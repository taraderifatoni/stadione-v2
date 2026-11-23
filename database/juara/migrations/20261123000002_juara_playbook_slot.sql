-- RENCANA — JUARA MIGRATION M-02 (RENCANA, JANGAN DI-APPLY TANPA IZIN OWNER)

CREATE TABLE juara_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES juara_clubs(id) ON DELETE CASCADE,
  version_name VARCHAR(100),
  horizon_years SMALLINT NOT NULL CHECK (horizon_years BETWEEN 1 AND 5),
  target_sporting_outcome juara_target_outcome NOT NULL,
  tactical_dna_type juara_tactical_dna NOT NULL,
  base_formation VARCHAR(20),
  philosophy_star_pct NUMERIC(5,2),
  philosophy_prime_pct NUMERIC(5,2),
  philosophy_academy_pct NUMERIC(5,2),
  owner_equity_injection_enc BYTEA,  -- AES-256-GCM (D2)
  scr_max_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 65.00,
  status juara_playbook_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_juara_playbooks_club ON juara_playbooks(club_id);

CREATE TABLE juara_squad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES juara_playbooks(id) ON DELETE CASCADE,
  position_code VARCHAR(10) NOT NULL,
  tactical_role_archetype VARCHAR(50),
  depth_tier juara_depth_tier NOT NULL,
  target_age_min SMALLINT,
  target_age_max SMALLINT,
  target_grade juara_target_grade NOT NULL,
  target_minutes_pct NUMERIC(5,2),
  assigned_player_id UUID,
  mentor_slot_id UUID REFERENCES juara_squad_slots(id) ON DELETE SET NULL
);

ALTER TABLE juara_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE juara_squad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY juara_playbooks_tenant ON juara_playbooks
  FOR ALL TO authenticated
  USING (club_id = juara_current_club_id())
  WITH CHECK (club_id = juara_current_club_id());

CREATE POLICY juara_squad_slots_tenant ON juara_squad_slots
  FOR ALL TO authenticated
  USING (playbook_id IN (SELECT id FROM juara_playbooks WHERE club_id = juara_current_club_id()))
  WITH CHECK (playbook_id IN (SELECT id FROM juara_playbooks WHERE club_id = juara_current_club_id()));
