-- JUARA MIGRATION M-13 (diterapkan 24 Nov 2026)
-- Draft visi tersimpan per klub tanpa menambah tabel. AES-256-GCM di aplikasi.
ALTER TABLE juara_clubs
  ADD COLUMN IF NOT EXISTS vision_draft_enc BYTEA;

COMMENT ON COLUMN juara_clubs.vision_draft_enc IS
  'Draft wizard JUARA terenkripsi; AAD clubId|juara_clubs|vision_draft_enc|clubId|keyId';
