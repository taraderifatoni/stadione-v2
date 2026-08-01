-- ============================================
-- Stadione V2: Foundation Schema
-- Fase 0 — Database Migration
-- ============================================

-- ============================================
-- TABLES FIRST
-- ============================================

CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  city text,
  latitude numeric,
  longitude numeric,
  phone text,
  photos jsonb DEFAULT '[]'::jsonb,
  operating_hours jsonb DEFAULT '{}'::jsonb,
  active_domains jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venue_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('platform_admin', 'owner', 'manager', 'staff', 'coach', 'member', 'customer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, venue_id)
);

CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'staff', 'coach')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  channels_used text[] DEFAULT ARRAY['in_app'],
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_confirmed_push boolean DEFAULT true,
  booking_reminder_push boolean DEFAULT true,
  membership_expired_email boolean DEFAULT true,
  raport_published_push boolean DEFAULT true,
  raport_published_email boolean DEFAULT true,
  payment_push boolean DEFAULT true,
  payment_email boolean DEFAULT true,
  promo_push boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric DEFAULT 0,
  doku_invoice_id text,
  doku_callback_raw jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_status ON public.venues(status);
CREATE INDEX IF NOT EXISTS idx_venue_roles_user ON public.venue_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_roles_venue ON public.venue_roles(venue_id);
CREATE INDEX IF NOT EXISTS idx_staff_invites_token ON public.staff_invites(token);
CREATE INDEX IF NOT EXISTS idx_staff_invites_email ON public.staff_invites(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_payment_records_user ON public.payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_venue ON public.payment_records(venue_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_ref ON public.payment_records(reference_type, reference_id);

-- ============================================
-- RLS + POLICIES
-- ============================================

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- venues
CREATE POLICY "Anyone can view active venues" ON public.venues
  FOR SELECT USING (status = 'active');

CREATE POLICY "Venue admins can update their venue" ON public.venues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles
      WHERE venue_id = venues.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- venue_roles
CREATE POLICY "Users can view their own roles" ON public.venue_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Venue owners can manage roles" ON public.venue_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles vr
      WHERE vr.venue_id = venue_roles.venue_id
      AND vr.user_id = auth.uid()
      AND vr.role = 'owner'
    )
  );

-- staff_invites
CREATE POLICY "Venue admins can manage invites" ON public.staff_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles
      WHERE venue_id = staff_invites.venue_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Users can view their own invites" ON public.staff_invites
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- user_notification_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- payment_records
CREATE POLICY "Users can view their own payments" ON public.payment_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Venue admins can view venue payments" ON public.payment_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles
      WHERE venue_id = payment_records.venue_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id) VALUES (new.id);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CRON EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- End of Foundation Schema
-- ============================================
