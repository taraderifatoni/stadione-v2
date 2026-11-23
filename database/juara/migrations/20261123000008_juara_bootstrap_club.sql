-- JUARA MIGRATION M-08 (diterapkan 2026-11-23 dengan izin Owner)
-- Bootstrap klub pertama untuk pemilik akun yang sudah login.
-- club_id tetap berasal dari auth.uid(); helper ini tidak menerima club_id dari klien.

CREATE OR REPLACE FUNCTION juara_bootstrap_club(p_name TEXT, p_tier juara_league_tier)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_club UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Butuh sesi login untuk membuat klub';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 3 THEN
    RAISE EXCEPTION 'Nama klub minimal 3 karakter';
  END IF;

  SELECT club_id INTO v_club
  FROM juara_club_members
  WHERE user_id = v_uid
  LIMIT 1;
  IF v_club IS NOT NULL THEN
    RETURN v_club;
  END IF;

  INSERT INTO juara_clubs (name, league_tier)
  VALUES (trim(p_name), p_tier)
  RETURNING id INTO v_club;

  INSERT INTO juara_club_members (user_id, club_id, role)
  VALUES (v_uid, v_club, 'OWNER');

  RETURN v_club;
END;
$$;

REVOKE ALL ON FUNCTION juara_bootstrap_club(TEXT, juara_league_tier) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_bootstrap_club(TEXT, juara_league_tier) TO authenticated;
