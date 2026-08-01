-- ============================================
-- Stadione V2: Booking Schema
-- Fase 1 — Booking MVP
-- ============================================

CREATE TABLE IF NOT EXISTS public.courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  court_type text NOT NULL CHECK (court_type IN ('futsal', 'basketball', 'badminton', 'tennis', 'volleyball', 'pingpong', 'squash', 'pickleball')),
  is_splittable boolean DEFAULT false,
  split_count int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_courts_venue ON public.courts(venue_id);

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courts" ON public.courts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Venue admins can manage courts" ON public.courts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles
      WHERE venue_id = courts.venue_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

-- ============================================
CREATE TABLE IF NOT EXISTS public.court_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  split_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_court_slots_court ON public.court_slots(court_id);

ALTER TABLE public.court_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view court slots" ON public.court_slots
  FOR SELECT USING (true);

-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
  name text NOT NULL,
  day_type text NOT NULL DEFAULT 'weekday' CHECK (day_type IN ('weekday', 'weekend', 'holiday')),
  time_start time,
  time_end time,
  base_price numeric NOT NULL,
  member_discount_pct numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pricing_rules_court ON public.pricing_rules(court_id);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing rules" ON public.pricing_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Venue admins can manage pricing" ON public.pricing_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.courts c
      JOIN public.venue_roles vr ON vr.venue_id = c.venue_id
      WHERE c.id = pricing_rules.court_id
      AND vr.user_id = auth.uid()
      AND vr.role IN ('owner', 'manager')
    )
  );

-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  court_slot_id uuid NOT NULL REFERENCES public.court_slots(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  total_hours numeric(3,1) NOT NULL,
  base_price numeric NOT NULL,
  discount_amount numeric DEFAULT 0,
  promo_id uuid,
  final_price numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'ongoing', 'completed', 'cancelled', 'refunded')),
  is_recurring_parent boolean DEFAULT false,
  recurring_group_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_venue ON public.bookings(venue_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_court_slot ON public.bookings(court_slot_id, booking_date);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Venue staff can view venue bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles
      WHERE venue_id = bookings.venue_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager', 'staff')
    )
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
CREATE TABLE IF NOT EXISTS public.promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_booking_hours int DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  max_usage int,
  current_usage int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_promos_code ON public.promos(code);
CREATE INDEX idx_promos_venue ON public.promos(venue_id);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promos" ON public.promos
  FOR SELECT USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Venue admins can manage promos" ON public.promos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.venue_roles
      WHERE venue_id = promos.venue_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  );

-- ============================================
-- End of Booking Schema
-- ============================================
