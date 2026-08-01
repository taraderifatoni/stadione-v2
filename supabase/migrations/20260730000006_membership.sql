-- ============================================
-- Stadione V2: Membership Schema
-- Fase 5 — Plans, Packages, Members, Check-ins, Rewards
-- ============================================

CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  tier_level int NOT NULL CHECK (tier_level BETWEEN 1 AND 5),
  price numeric NOT NULL,
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  benefits jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active plans" ON public.membership_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Venue admins manage plans" ON public.membership_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = membership_plans.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.visit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  visit_count int NOT NULL,
  price numeric NOT NULL,
  validity_days int NOT NULL DEFAULT 90,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.visit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view visit packages" ON public.visit_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Venue admins manage packages" ON public.visit_packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = visit_packages.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager'))
);

CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  plan_id uuid REFERENCES public.membership_plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'cancelled', 'expired')),
  start_date date NOT NULL DEFAULT now(),
  end_date date NOT NULL,
  frozen_until date,
  freeze_count int DEFAULT 0,
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_members_user ON public.members(user_id);
CREATE INDEX idx_members_venue ON public.members(venue_id);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own membership" ON public.members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Venue staff view members" ON public.members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = members.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

CREATE TABLE IF NOT EXISTS public.member_visit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.visit_packages(id),
  remaining_visits int NOT NULL,
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.member_visit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own packages" ON public.member_visit_packages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = member_visit_packages.member_id AND user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  check_in_type text NOT NULL CHECK (check_in_type IN ('membership', 'visit_package')),
  member_visit_package_id uuid REFERENCES public.member_visit_packages(id),
  checked_in_at timestamptz DEFAULT now()
);

CREATE INDEX idx_check_ins_member ON public.check_ins(member_id);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own check-ins" ON public.check_ins FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = check_ins.member_id AND user_id = auth.uid())
);
CREATE POLICY "Venue staff manage check-ins" ON public.check_ins FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = check_ins.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

CREATE TABLE IF NOT EXISTS public.reward_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  points int NOT NULL,
  source text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own points" ON public.reward_points FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = reward_points.member_id AND user_id = auth.uid())
);

-- ============================================
-- End of Membership Schema
-- ============================================
