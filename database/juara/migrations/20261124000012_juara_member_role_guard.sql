-- JUARA MIGRATION M-12 (diterapkan 24 Nov 2026, mandat eksekusi Owner Rep)
-- Anti eskalasi role: anggota biasa tidak boleh mengubah juara_club_members
-- lewat PostgREST. Non-destruktif: hanya policy + fungsi, tanpa ubah baris.

DROP POLICY IF EXISTS juara_club_members_tenant ON juara_club_members;

CREATE POLICY juara_club_members_read ON juara_club_members
  FOR SELECT TO authenticated
  USING (club_id = juara_current_club_id());

CREATE OR REPLACE FUNCTION juara_set_member_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_club UUID;
BEGIN
  IF p_role NOT IN ('OWNER','CEO','SPORTING_DIRECTOR','HEAD_COACH','FINANCE_CONTROLLER','CLUB_SECRETARY') THEN
    RAISE EXCEPTION 'Role tidak dikenal';
  END IF;

  SELECT club_id INTO v_club
  FROM juara_club_members
  WHERE user_id = v_caller AND role = 'OWNER'
  LIMIT 1;

  IF v_club IS NULL THEN
    RAISE EXCEPTION 'Hanya Owner klub yang boleh mengubah role';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM juara_club_members
    WHERE user_id = p_user_id AND club_id = v_club
  ) THEN
    RAISE EXCEPTION 'Anggota tidak ditemukan di klub ini';
  END IF;

  UPDATE juara_club_members
  SET role = p_role
  WHERE user_id = p_user_id AND club_id = v_club;
END;
$$;

REVOKE ALL ON FUNCTION juara_set_member_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_set_member_role(UUID, TEXT) TO authenticated;

-- Rollback (manual):
-- DROP POLICY IF EXISTS juara_club_members_read ON juara_club_members;
-- CREATE POLICY juara_club_members_tenant ON juara_club_members FOR ALL TO authenticated
--   USING (club_id = juara_current_club_id())
--   WITH CHECK (club_id = juara_current_club_id());
