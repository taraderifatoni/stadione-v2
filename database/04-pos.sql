-- ============================================
-- Stadione V2: POS Schema
-- Fase 4 — Shift, Transactions, Invoices, Refunds
-- ============================================

CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  staff_id uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'auto_closed')),
  opening_balance numeric DEFAULT 0,
  closing_balance numeric,
  total_cash_in numeric DEFAULT 0,
  total_cash_out numeric DEFAULT 0,
  discrepancy numeric,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shifts_venue ON public.shifts(venue_id);
CREATE INDEX idx_shifts_staff ON public.shifts(staff_id);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue staff manage shifts" ON public.shifts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = shifts.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

CREATE TABLE IF NOT EXISTS public.pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.shifts(id),
  booking_id uuid REFERENCES public.bookings(id),
  reference_type text NOT NULL,
  reference_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer', 'debit', 'split')),
  payment_details jsonb DEFAULT '{}',
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pos_transactions_shift ON public.pos_transactions(shift_id);
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue staff manage transactions" ON public.pos_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.shifts s JOIN public.venue_roles vr ON vr.venue_id = s.venue_id WHERE s.id = pos_transactions.shift_id AND vr.user_id = auth.uid() AND vr.role IN ('owner', 'manager', 'staff'))
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  pos_transaction_id uuid NOT NULL REFERENCES public.pos_transactions(id),
  invoice_number text UNIQUE NOT NULL,
  total_amount numeric NOT NULL,
  printed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue staff view invoices" ON public.invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.venue_roles WHERE venue_id = invoices.venue_id AND user_id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
);

CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_transaction_id uuid NOT NULL REFERENCES public.pos_transactions(id),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  reason text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venue staff manage refunds" ON public.refunds FOR ALL USING (
  EXISTS (SELECT 1 FROM public.pos_transactions pt JOIN public.shifts s ON s.id = pt.shift_id JOIN public.venue_roles vr ON vr.venue_id = s.venue_id WHERE pt.id = refunds.pos_transaction_id AND vr.user_id = auth.uid() AND vr.role IN ('owner', 'manager', 'staff'))
);

-- ============================================
-- End of POS Schema
-- ============================================
