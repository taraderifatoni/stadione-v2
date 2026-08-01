-- ============================================
-- Stadione V2: Platform Schema
-- Fase 3 — Platform Dashboard
-- ============================================

CREATE TABLE IF NOT EXISTS public.platform_fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES public.venues(id) ON DELETE CASCADE,
  fee_pct numeric(5,2) NOT NULL,
  min_fee_amount numeric DEFAULT 0,
  max_fee_amount numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_fee_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admin manage fees" ON public.platform_fee_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

CREATE TABLE IF NOT EXISTS public.platform_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  platform_share_pct numeric(5,2) DEFAULT 100,
  min_booking_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  max_usage_per_user int DEFAULT 1,
  max_total_usage int,
  current_usage int DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  applicable_venues uuid[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active discounts" ON public.platform_discounts FOR SELECT USING (is_active = true);
CREATE POLICY "Platform admin manage discounts" ON public.platform_discounts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'maintenance', 'promo')),
  is_dismissible boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active announcements" ON public.platform_announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Platform admin manage announcements" ON public.platform_announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

CREATE TABLE IF NOT EXISTS public.venue_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'pending_docs' CHECK (status IN ('pending_docs', 'under_review', 'approved', 'rejected', 'active')),
  documents jsonb DEFAULT '{}',
  reviewer_id uuid REFERENCES auth.users(id),
  review_notes text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.venue_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view own onboarding" ON public.venue_onboarding FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Platform admin manage onboarding" ON public.venue_onboarding FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);

-- ============================================
-- End of Platform Schema
-- ============================================
