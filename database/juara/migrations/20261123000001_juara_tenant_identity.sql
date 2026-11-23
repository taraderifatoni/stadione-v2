-- RENCANA — JUARA MIGRATION M-01 (RENCANA, JANGAN DI-APPLY TANPA IZIN OWNER)
-- Tenant + identitas. club_id dari auth.uid() ∩ juara_club_members ∩ JWT claim (R11).
-- GUC app.current_club_id DILARANG. service_role tidak dipakai untuk juara_*.

CREATE TABLE juara_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  league_tier juara_league_tier NOT NULL,
  stadium_capacity INTEGER,
  avg_home_attendance INTEGER,
  fiscal_year_start_month SMALLINT NOT NULL DEFAULT 7,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,  -- hook Fase 2 (D4.7)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE juara_club_members (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES juara_clubs(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL CHECK (role IN ('OWNER','CEO','SPORTING_DIRECTOR','HEAD_COACH','FINANCE_CONTROLLER','CLUB_SECRETARY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, club_id)
);
CREATE INDEX idx_juara_club_members_club ON juara_club_members(club_id);

ALTER TABLE juara_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juara_club_members ENABLE ROW LEVEL SECURITY;

-- Helper: club_id aktif dari JWT ∩ membership. SECURITY DEFINER agar tidak rekursi.
CREATE OR REPLACE FUNCTION juara_current_club_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.club_id
  FROM juara_club_members m
  WHERE m.user_id = auth.uid()
    AND m.club_id = COALESCE(
      NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'club_id','')::uuid,
      m.club_id
    )
  LIMIT 1;
$$;

CREATE POLICY juara_clubs_tenant ON juara_clubs
  FOR ALL TO authenticated
  USING (id = juara_current_club_id())
  WITH CHECK (id = juara_current_club_id());

CREATE POLICY juara_club_members_tenant ON juara_club_members
  FOR ALL TO authenticated
  USING (club_id = juara_current_club_id())
  WITH CHECK (club_id = juara_current_club_id());
