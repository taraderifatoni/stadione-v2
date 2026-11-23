-- RENCANA — JUARA MIGRATION M-03 (RENCANA, JANGAN DI-APPLY TANPA IZIN OWNER)

CREATE TABLE juara_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES juara_clubs(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  date_of_birth DATE NOT NULL,
  birth_quarter juara_birth_quarter NOT NULL,
  phv_maturity_stage juara_maturity_stage NOT NULL DEFAULT 'ADULT',
  nationality VARCHAR(50),
  is_foreign_quota BOOLEAN NOT NULL DEFAULT false,
  primary_role VARCHAR(50),
  secondary_role VARCHAR(50),
  current_ability_grade juara_ability_grade,
  potential_ceiling_grade juara_potential_grade,
  academy_readiness_index NUMERIC(5,2),
  is_homegrown_epa BOOLEAN NOT NULL DEFAULT false,
  estimated_market_value BIGINT
);
CREATE INDEX idx_juara_players_club ON juara_players(club_id);

CREATE TABLE juara_contracts_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES juara_players(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES juara_clubs(id) ON DELETE CASCADE,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  base_salary_monthly_enc BYTEA,        -- AES-256-GCM (D2)
  signing_on_fee_total_enc BYTEA,
  transfer_fee_capitalized_enc BYTEA,
  agent_fee_capitalized_enc BYTEA,
  release_clause_enc BYTEA,
  performance_bonus_rules_enc BYTEA,
  sponsor_contract_value_enc BYTEA,     -- R10: di vault, bukan projections
  monthly_amortization_value BIGINT,
  net_book_value_current BIGINT
);
CREATE INDEX idx_juara_contracts_club ON juara_contracts_vault(club_id);

ALTER TABLE juara_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE juara_contracts_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY juara_players_tenant ON juara_players
  FOR ALL TO authenticated
  USING (club_id = juara_current_club_id())
  WITH CHECK (club_id = juara_current_club_id());

CREATE POLICY juara_contracts_vault_tenant ON juara_contracts_vault
  FOR ALL TO authenticated
  USING (club_id = juara_current_club_id())
  WITH CHECK (club_id = juara_current_club_id());
