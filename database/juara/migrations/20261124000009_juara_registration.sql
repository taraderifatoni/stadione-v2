-- JUARA MIGRATION M-09 (diterapkan 2026-11-24 dengan izin Owner)
-- Bootstrap klub untuk user yang baru mendaftar. Dipanggil hanya oleh service_role
-- dari route registrasi; klien tidak bisa menentukan club_id atau role.

CREATE OR REPLACE FUNCTION juara_create_owner_club(
  p_user_id UUID,
  p_name TEXT,
  p_tier juara_league_tier
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_club UUID;
BEGIN
  IF p_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User tidak ditemukan';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 3 THEN
    RAISE EXCEPTION 'Nama klub minimal 3 karakter';
  END IF;

  SELECT club_id INTO v_club
  FROM juara_club_members
  WHERE user_id = p_user_id
  LIMIT 1;
  IF v_club IS NOT NULL THEN
    RETURN v_club;
  END IF;

  INSERT INTO juara_clubs (name, league_tier)
  VALUES (trim(p_name), p_tier)
  RETURNING id INTO v_club;

  INSERT INTO juara_club_members (user_id, club_id, role)
  VALUES (p_user_id, v_club, 'OWNER');

  RETURN v_club;
END;
$$;

REVOKE ALL ON FUNCTION juara_create_owner_club(UUID, TEXT, juara_league_tier)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION juara_create_owner_club(UUID, TEXT, juara_league_tier)
  TO service_role;
