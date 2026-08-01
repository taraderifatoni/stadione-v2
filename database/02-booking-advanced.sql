-- ============================================
-- Stadione V2: Booking Advanced Schema
-- Fase 2 — Recurring, Split, Waitlist, Tournament, Promo
-- ============================================

-- Recurring booking templates
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  court_slot_id uuid NOT NULL REFERENCES public.court_slots(id),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly')),
  max_occurrences int,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own templates" ON public.recurring_templates FOR ALL USING (user_id = auth.uid());

-- Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_slot_id uuid NOT NULL REFERENCES public.court_slots(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'claimed', 'expired', 'cancelled')),
  offered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_waitlist_slot_date ON public.waitlist(court_slot_id, booking_date);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their waitlist" ON public.waitlist FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Venue staff can view waitlist" ON public.waitlist FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.court_slots cs JOIN public.courts c ON c.id = cs.court_id
    JOIN public.venue_roles vr ON vr.venue_id = c.venue_id
    WHERE cs.id = waitlist.court_slot_id AND vr.user_id = auth.uid() AND vr.role IN ('owner', 'manager', 'staff'))
);

-- Add recurring_group_id to bookings (if not exists)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_tournament_slot boolean DEFAULT false;

-- ============================================
-- End of Booking Advanced Schema
-- ============================================
