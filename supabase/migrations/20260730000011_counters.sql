-- daily_counters for anti-race-condition invoice/booking numbering
CREATE TABLE IF NOT EXISTS public.daily_counters (
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  counter_date date NOT NULL DEFAULT CURRENT_DATE,
  kind text NOT NULL CHECK (kind IN ('invoice', 'booking')),
  last_seq int NOT NULL DEFAULT 0,
  PRIMARY KEY (venue_id, counter_date, kind)
);

CREATE OR REPLACE FUNCTION public.next_counter(p_venue_id uuid, p_kind text, p_date date DEFAULT CURRENT_DATE)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_seq int;
BEGIN
  INSERT INTO public.daily_counters (venue_id, counter_date, kind, last_seq)
  VALUES (p_venue_id, p_date, p_kind, 1)
  ON CONFLICT (venue_id, counter_date, kind)
  DO UPDATE SET last_seq = daily_counters.last_seq + 1
  RETURNING last_seq INTO v_seq;
  RETURN v_seq;
END;
$$;
