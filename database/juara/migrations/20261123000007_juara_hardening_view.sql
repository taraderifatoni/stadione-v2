-- JUARA MIGRATION M-07 (RENCANA → diterapkan 2026-11-23 dengan izin Owner)
-- Menutup celah grant bawaan pada view audit: service_role tidak boleh membaca
-- inventaris policy juara_*. View tetap bisa dibaca role authenticated (audit CT-10).

REVOKE ALL ON juara_policy_inventory FROM service_role;
REVOKE ALL ON juara_policy_inventory FROM anon;
GRANT SELECT ON juara_policy_inventory TO authenticated;
