-- JUARA MIGRATION M-14 (24 Nov 2026, mandat audit P1 temuan 1)
-- Semua tabel juara_* menjadi SELECT-only lewat PostgREST. Penulisan hanya lewat
-- fungsi SECURITY DEFINER yang memeriksa peran dan klub. Non-destruktif: policy saja.
-- Rollback TIDAK membuka FOR ALL — rollback aplikasi tetap memakai M-12/M-14.

DROP POLICY IF EXISTS juara_clubs_tenant ON juara_clubs;
CREATE POLICY juara_clubs_read ON juara_clubs FOR SELECT TO authenticated
  USING (id = juara_current_club_id());

DROP POLICY IF EXISTS juara_playbooks_tenant ON juara_playbooks;
CREATE POLICY juara_playbooks_read ON juara_playbooks FOR SELECT TO authenticated
  USING (club_id = juara_current_club_id());

DROP POLICY IF EXISTS juara_squad_slots_tenant ON juara_squad_slots;
CREATE POLICY juara_squad_slots_read ON juara_squad_slots FOR SELECT TO authenticated
  USING (playbook_id IN (SELECT id FROM juara_playbooks WHERE club_id = juara_current_club_id()));

DROP POLICY IF EXISTS juara_players_tenant ON juara_players;
CREATE POLICY juara_players_read ON juara_players FOR SELECT TO authenticated
  USING (club_id = juara_current_club_id());

DROP POLICY IF EXISTS juara_contracts_vault_tenant ON juara_contracts_vault;
CREATE POLICY juara_contracts_vault_read ON juara_contracts_vault FOR SELECT TO authenticated
  USING (club_id = juara_current_club_id());

DROP POLICY IF EXISTS juara_projections_tenant ON juara_projections;
CREATE POLICY juara_projections_read ON juara_projections FOR SELECT TO authenticated
  USING (playbook_id IN (SELECT id FROM juara_playbooks WHERE club_id = juara_current_club_id()));

DROP POLICY IF EXISTS juara_audit_logs_tenant ON juara_audit_logs;
CREATE POLICY juara_audit_logs_read ON juara_audit_logs FOR SELECT TO authenticated
  USING (club_id = juara_current_club_id());

-- Helper: editor yang diizinkan menulis draft/playbook.
CREATE OR REPLACE FUNCTION juara_can_edit(p_uid UUID, p_club UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM juara_club_members
    WHERE user_id = p_uid AND club_id = p_club
      AND role IN ('OWNER', 'CEO', 'SPORTING_DIRECTOR')
  );
$$;

REVOKE ALL ON FUNCTION juara_can_edit(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_can_edit(UUID, UUID) TO authenticated;

-- Tulis playbook hanya lewat RPC dengan klub dari membership, bukan request.
CREATE OR REPLACE FUNCTION juara_insert_playbook(
  p_id UUID, p_club_id UUID, p_version_name VARCHAR, p_horizon_years SMALLINT,
  p_target_sporting_outcome juara_target_outcome, p_tactical_dna_type juara_tactical_dna,
  p_base_formation VARCHAR, p_philosophy_star_pct NUMERIC, p_philosophy_prime_pct NUMERIC,
  p_philosophy_academy_pct NUMERIC, p_owner_equity_injection_enc BYTEA,
  p_tactical_profile_enc BYTEA, p_scr_max_threshold_pct NUMERIC
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT juara_can_edit(auth.uid(), p_club_id) THEN
    RAISE EXCEPTION 'Tidak berhak menulis playbook klub ini';
  END IF;
  INSERT INTO juara_playbooks (
    id, club_id, version_name, horizon_years, target_sporting_outcome,
    tactical_dna_type, base_formation, philosophy_star_pct, philosophy_prime_pct,
    philosophy_academy_pct, owner_equity_injection_enc, tactical_profile_enc,
    scr_max_threshold_pct, status
  ) VALUES (
    p_id, p_club_id, p_version_name, p_horizon_years, p_target_sporting_outcome,
    p_tactical_dna_type, p_base_formation, p_philosophy_star_pct, p_philosophy_prime_pct,
    p_philosophy_academy_pct, p_owner_equity_injection_enc, p_tactical_profile_enc,
    p_scr_max_threshold_pct, 'DRAFT'
  );
  RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION juara_insert_playbook(UUID, UUID, VARCHAR, SMALLINT, juara_target_outcome, juara_tactical_dna, VARCHAR, NUMERIC, NUMERIC, NUMERIC, BYTEA, BYTEA, NUMERIC)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_insert_playbook(UUID, UUID, VARCHAR, SMALLINT, juara_target_outcome, juara_tactical_dna, VARCHAR, NUMERIC, NUMERIC, NUMERIC, BYTEA, BYTEA, NUMERIC)
  TO authenticated;

-- Tulis draft visi hanya lewat RPC dengan peran editor.
CREATE OR REPLACE FUNCTION juara_set_vision_draft(p_club_id UUID, p_blob BYTEA)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT juara_can_edit(auth.uid(), p_club_id) THEN
    RAISE EXCEPTION 'Tidak berhak menulis draft klub ini';
  END IF;
  UPDATE juara_clubs SET vision_draft_enc = p_blob WHERE id = p_club_id;
END;
$$;

REVOKE ALL ON FUNCTION juara_set_vision_draft(UUID, BYTEA) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION juara_set_vision_draft(UUID, BYTEA) TO authenticated;
