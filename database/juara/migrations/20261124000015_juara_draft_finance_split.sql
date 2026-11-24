-- JUARA MIGRATION M-15 (24 Nov 2026, audit P1 temuan 2)
-- Pemisahan draft non-sensitif dan finance privat. SD tidak bisa menimpa
-- equity lewat RPC langsung. Non-destruktif, tanpa service role umum.

ALTER TABLE juara_clubs
  ADD COLUMN IF NOT EXISTS vision_finance_enc BYTEA;

COMMENT ON COLUMN juara_clubs.vision_finance_enc IS
  'Equity pemilik terenkripsi terpisah; hanya OWNER/CEO yang boleh menulis';

CREATE OR REPLACE FUNCTION juara_can_write_finance(p_uid UUID, p_club UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM juara_club_members
    WHERE user_id = p_uid AND club_id = p_club
      AND role IN ('OWNER', 'CEO')
  );
$$;

REVOKE ALL ON FUNCTION juara_can_write_finance(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_can_write_finance(UUID, UUID) TO authenticated;

DROP FUNCTION IF EXISTS juara_set_vision_draft(UUID, BYTEA);

CREATE OR REPLACE FUNCTION juara_set_vision_draft(
  p_club_id UUID,
  p_blob BYTEA,
  p_finance_blob BYTEA DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Pemeriksaan inline agar M-15 berdiri sendiri sebelum M-14 di-apply.
  IF NOT EXISTS (
    SELECT 1 FROM juara_club_members
    WHERE user_id = auth.uid() AND club_id = p_club_id
      AND role IN ('OWNER', 'CEO', 'SPORTING_DIRECTOR')
  ) THEN
    RAISE EXCEPTION 'Tidak berhak menulis draft klub ini';
  END IF;

  UPDATE juara_clubs SET vision_draft_enc = p_blob WHERE id = p_club_id;

  IF EXISTS (
    SELECT 1 FROM juara_club_members
    WHERE user_id = auth.uid() AND club_id = p_club_id AND role IN ('OWNER', 'CEO')
  ) AND p_finance_blob IS NOT NULL THEN
    UPDATE juara_clubs SET vision_finance_enc = p_finance_blob WHERE id = p_club_id;
  END IF;
  -- Peran editor terbatas: vision_finance_enc sengaja tidak disentuh.
END;
$$;

REVOKE ALL ON FUNCTION juara_set_vision_draft(UUID, BYTEA, BYTEA) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_set_vision_draft(UUID, BYTEA, BYTEA) TO authenticated;
