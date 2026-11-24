-- JUARA MIGRATION M-10 (diterapkan 2026-11-24 dengan izin Owner)
-- Profil taktik (formasi, mentalitas, tempo, pressing, garis pertahanan, lebar,
-- gaya umpan) disimpan terenkripsi di tabel yang sudah ada — tanpa tabel ke-9.

ALTER TABLE juara_playbooks
  ADD COLUMN IF NOT EXISTS tactical_profile_enc BYTEA;

COMMENT ON COLUMN juara_playbooks.tactical_profile_enc IS
  'AES-256-GCM, AAD clubId|table|column|rowId|keyId — profil taktik ala Football Manager';
