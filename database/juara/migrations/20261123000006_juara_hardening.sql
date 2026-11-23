-- RENCANA — JUARA MIGRATION M-06 (RENCANA, JANGAN DI-APPLY TANPA IZIN OWNER)

-- Cabut akses service_role dari semua tabel juara_* (D4.5).
REVOKE ALL ON juara_clubs, juara_club_members, juara_playbooks, juara_squad_slots,
  juara_players, juara_contracts_vault, juara_projections, juara_audit_logs FROM service_role;

-- Verifikasi RLS aktif (relrowsecurity = true) pada semua tabel juara_*.
-- FORCE RLS sengaja tidak dipakai pada juara_club_members (hindari rekursi helper
-- SECURITY DEFINER); relrowsecurity tetap true (R11 + ARCHITECTURE §4.2).

-- View inventaris policy untuk audit (CT-10).
CREATE OR REPLACE VIEW juara_policy_inventory AS
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE tablename LIKE 'juara_%';
