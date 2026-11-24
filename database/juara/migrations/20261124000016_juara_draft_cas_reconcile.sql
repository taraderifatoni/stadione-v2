-- JUARA MIGRATION M-16 (24 Nov 2026, audit commit-fixes-v2)
-- Rekonsiliasi dari keadaan produksi aktual (M-00..M-13 + M-15; M-14 bisa
-- menyusul lalu M-16 menghapus overload yang dibuatnya). Atomik per statement.
-- TIDAK di-apply produksi pada slice ini; rehearsal staging wajib.

BEGIN;

ALTER TABLE juara_clubs
  ADD COLUMN IF NOT EXISTS vision_revision INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vision_legacy_migrated BOOLEAN NOT NULL DEFAULT false;

-- Cabut semua overload lama, termasuk 2 argumen yang bisa dibuat ulang M-14
-- dan 3 argumen dari M-15. Satu-satunya jalur tulis adalah 4 argumen + CAS.
DROP FUNCTION IF EXISTS juara_set_vision_draft(UUID, BYTEA);
DROP FUNCTION IF EXISTS juara_set_vision_draft(UUID, BYTEA, BYTEA);
DROP FUNCTION IF EXISTS juara_set_vision_draft(UUID, BYTEA, BYTEA, INTEGER);

CREATE FUNCTION juara_set_vision_draft(
  p_club_id UUID,
  p_blob BYTEA,
  p_finance_blob BYTEA,
  p_expected_revision INTEGER
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role TEXT;
  v_can_finance BOOLEAN;
  v_new_revision INTEGER;
BEGIN
  SELECT role INTO v_role
  FROM juara_club_members
  WHERE user_id = auth.uid() AND club_id = p_club_id;

  IF v_role IS NULL OR v_role NOT IN ('OWNER','CEO','SPORTING_DIRECTOR') THEN
    RAISE EXCEPTION 'Tidak berhak menulis draft klub ini';
  END IF;

  IF v_role = 'SPORTING_DIRECTOR' AND NOT EXISTS (
    SELECT 1 FROM juara_clubs
    WHERE id = p_club_id AND vision_legacy_migrated = true
  ) THEN
    RAISE EXCEPTION 'LEGACY_NOT_MIGRATED' USING ERRCODE = 'P0001';
  END IF;

  v_can_finance := v_role IN ('OWNER','CEO');

  UPDATE juara_clubs
  SET vision_draft_enc = p_blob,
      vision_finance_enc = CASE
        WHEN v_can_finance AND p_finance_blob IS NOT NULL THEN p_finance_blob
        ELSE vision_finance_enc
      END,
      vision_legacy_migrated = CASE
        WHEN v_can_finance THEN true
        ELSE vision_legacy_migrated
      END,
      vision_revision = vision_revision + 1
  WHERE id = p_club_id
    AND vision_revision = p_expected_revision
  RETURNING vision_revision INTO v_new_revision;

  IF v_new_revision IS NULL THEN
    RAISE EXCEPTION 'REVISION_CONFLICT' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_new_revision;
END;
$$;

REVOKE ALL ON FUNCTION juara_set_vision_draft(UUID, BYTEA, BYTEA, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_set_vision_draft(UUID, BYTEA, BYTEA, INTEGER) TO authenticated;

-- Pastikan tidak ada overload tersisa.
DO $$
BEGIN
  IF (
    SELECT count(*) FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'juara_set_vision_draft' AND n.nspname = 'public'
  ) <> 1 THEN
    RAISE EXCEPTION 'Overload juara_set_vision_draft masih ada';
  END IF;
END $$;

COMMIT;
