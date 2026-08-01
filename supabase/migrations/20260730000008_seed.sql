-- Seed venue dummy + courts + pricing rules
INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status)
VALUES 
  ('Iron Gym Jakarta', 'iron-gym-jakarta', 'Jl. Sudirman No. 123', 'Jakarta Selatan', '021-5551234', '["booking","membership","academy"]', 'active'),
  ('Lapangan Futsal Surabaya', 'lapangan-futsal-surabaya', 'Jl. Ahmad Yani No. 45', 'Surabaya', '031-5556789', '["booking"]', 'active');

-- Courts for Iron Gym Jakarta
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count)
SELECT id, 'Lapangan Futsal A', 'futsal', false, 1 FROM public.venues WHERE slug = 'iron-gym-jakarta'
UNION ALL
SELECT id, 'Lapangan Basket', 'basketball', true, 2 FROM public.venues WHERE slug = 'iron-gym-jakarta'
UNION ALL
SELECT id, 'Ruang Gym', 'badminton', false, 1 FROM public.venues WHERE slug = 'iron-gym-jakarta';

-- Courts for Lapangan Futsal Surabaya
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count)
SELECT id, 'Lapangan 1', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-futsal-surabaya'
UNION ALL
SELECT id, 'Lapangan 2', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-futsal-surabaya';

-- Pricing for Iron Gym
INSERT INTO public.pricing_rules (court_id, name, day_type, time_start, time_end, base_price, member_discount_pct, priority)
SELECT c.id, 'Weekday', 'weekday', NULL::time, NULL::time, 80000, 10, 0 FROM public.courts c JOIN public.venues v ON v.id = c.venue_id WHERE v.slug = 'iron-gym-jakarta'
UNION ALL
SELECT c.id, 'Weekend', 'weekend', NULL::time, NULL::time, 120000, 10, 0 FROM public.courts c JOIN public.venues v ON v.id = c.venue_id WHERE v.slug = 'iron-gym-jakarta';

-- Pricing for Surabaya
INSERT INTO public.pricing_rules (court_id, name, day_type, time_start, time_end, base_price, member_discount_pct, priority)
SELECT c.id, 'Reguler', 'weekday', NULL::time, NULL::time, 100000, 5, 0 FROM public.courts c JOIN public.venues v ON v.id = c.venue_id WHERE v.slug = 'lapangan-futsal-surabaya';

-- Court slots
INSERT INTO public.court_slots (court_id, split_index)
SELECT id, 0 FROM public.courts WHERE split_count = 1
UNION ALL
SELECT id, 0 FROM public.courts WHERE split_count = 2
UNION ALL
SELECT id, 1 FROM public.courts WHERE split_count = 2;
