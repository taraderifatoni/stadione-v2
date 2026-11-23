-- RENCANA — JUARA MIGRATION M-04 (RENCANA, JANGAN DI-APPLY TANPA IZIN OWNER)

CREATE TABLE juara_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES juara_playbooks(id) ON DELETE CASCADE,
  projection_year SMALLINT NOT NULL CHECK (projection_year BETWEEN 1 AND 5),
  capex_transfer_fees BIGINT,
  capex_signing_agent_fees BIGINT,
  capex_sport_science_infra BIGINT,
  opex_base_wages BIGINT,
  opex_performance_bonuses BIGINT,
  opex_taxes_insurance BIGINT,
  opex_matchday_operations BIGINT,
  opex_away_travel_logistics BIGINT,
  opex_academy_operations BIGINT,
  rev_sponsorship_corporate BIGINT,
  rev_ticketing_hospitality BIGINT,
  rev_merchandise_memorabilia BIGINT,
  rev_league_broadcast_prize BIGINT,
  rev_player_trading_net BIGINT,
  rev_academy_community BIGINT,
  calculated_scr_pct NUMERIC(5,2),
  ratecard_config_enc BYTEA,  -- R16: field rate-card tanpa tabel ke-9
  UNIQUE (playbook_id, projection_year)
);

CREATE TABLE juara_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES juara_clubs(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  target_table VARCHAR(60),
  target_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_juara_audit_logs_club ON juara_audit_logs(club_id);

ALTER TABLE juara_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE juara_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY juara_projections_tenant ON juara_projections
  FOR ALL TO authenticated
  USING (playbook_id IN (SELECT id FROM juara_playbooks WHERE club_id = juara_current_club_id()))
  WITH CHECK (playbook_id IN (SELECT id FROM juara_playbooks WHERE club_id = juara_current_club_id()));

CREATE POLICY juara_audit_logs_tenant ON juara_audit_logs
  FOR ALL TO authenticated
  USING (club_id = juara_current_club_id())
  WITH CHECK (club_id = juara_current_club_id());
