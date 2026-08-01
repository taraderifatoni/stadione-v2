-- ============================================
-- Stadione V2: Seed Data — 22 Venues
-- ============================================

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('JEC mini soccer n soccer field 105 x 68m', 'jec-mini-soccer-n-soccer-field-105-x-68m', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'jec-mini-soccer-n-soccer-field-105-x-68m';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'jec-mini-soccer-n-soccer-field-105-x-68m') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'jec-mini-soccer-n-soccer-field-105-x-68m') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Maguwoharjo Soccer Field', 'maguwoharjo-soccer-field', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'maguwoharjo-soccer-field';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'maguwoharjo-soccer-field') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'maguwoharjo-soccer-field') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Grha Pradipta JEC Mini Soccer', 'grha-pradipta-jec-mini-soccer', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'grha-pradipta-jec-mini-soccer';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'grha-pradipta-jec-mini-soccer') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'grha-pradipta-jec-mini-soccer') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Maguwoharjo Football Park', 'maguwoharjo-football-park', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'maguwoharjo-football-park';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'maguwoharjo-football-park') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'maguwoharjo-football-park') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Mecmata Arena Sport Center (Minisoccer, basket, futsal, volley)', 'mecmata-arena-sport-center-minisoccer-basket-futsa', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'mecmata-arena-sport-center-minisoccer-basket-futsa';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'mecmata-arena-sport-center-minisoccer-basket-futsa') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'mecmata-arena-sport-center-minisoccer-basket-futsa') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Bardosono Happy Futsal', 'bardosono-happy-futsal', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'bardosono-happy-futsal';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'bardosono-happy-futsal') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'bardosono-happy-futsal') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Tifosi Futsal', 'tifosi-futsal', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'tifosi-futsal';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'tifosi-futsal') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'tifosi-futsal') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Planet Futsal', 'planet-futsal', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'planet-futsal';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'planet-futsal') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'planet-futsal') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Golden Goal Futsal', 'golden-goal-futsal', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'golden-goal-futsal';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'golden-goal-futsal') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'golden-goal-futsal') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Futsal Jogokaryan', 'futsal-jogokaryan', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'futsal-jogokaryan';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'futsal-jogokaryan') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'futsal-jogokaryan') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('GPS Futsal', 'gps-futsal', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'gps-futsal';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'gps-futsal') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'gps-futsal') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Amikom Soccer Arena', 'amikom-soccer-arena', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'amikom-soccer-arena';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'amikom-soccer-arena') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'amikom-soccer-arena') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Rocket Mini Soccer Field', 'rocket-mini-soccer-field', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'rocket-mini-soccer-field';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'rocket-mini-soccer-field') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'rocket-mini-soccer-field') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Tegalyoso Soccer Center', 'tegalyoso-soccer-center', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'tegalyoso-soccer-center';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'tegalyoso-soccer-center') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'tegalyoso-soccer-center') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Maleha Sportainment', 'maleha-sportainment', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'maleha-sportainment';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'maleha-sportainment') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'maleha-sportainment') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Lapangan Karang Kotagede', 'lapangan-karang-kotagede', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-karang-kotagede';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-karang-kotagede') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-karang-kotagede') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Lapangan Sepakbola Potorono', 'lapangan-sepakbola-potorono', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-sepakbola-potorono';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-sepakbola-potorono') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-sepakbola-potorono') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Lapangan Banyuraden', 'lapangan-banyuraden', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-banyuraden';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-banyuraden') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-banyuraden') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Lapangan Madukismo', 'lapangan-madukismo', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-madukismo';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-madukismo') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-madukismo') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Lapangan Bola Basket GOR Klebengan', 'lapangan-bola-basket-gor-klebengan', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'basketball', false, 1 FROM public.venues WHERE slug = 'lapangan-bola-basket-gor-klebengan';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'basketball' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-bola-basket-gor-klebengan') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'basketball' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-bola-basket-gor-klebengan') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Lapangan Sepak Bola FIKK UNY', 'lapangan-sepak-bola-fikk-uny', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'lapangan-sepak-bola-fikk-uny';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-sepak-bola-fikk-uny') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-sepak-bola-fikk-uny') LIMIT 1;

INSERT INTO public.venues (name, slug, address, city, phone, active_domains, status) VALUES ('Kenari Football Area Yogyakarta', 'kenari-football-area-yogyakarta', 'Yogyakarta', 'Yogyakarta', '', '["booking"]', 'active');
INSERT INTO public.courts (venue_id, name, court_type, is_splittable, split_count) SELECT id, 'Lapangan Utama', 'futsal', false, 1 FROM public.venues WHERE slug = 'kenari-football-area-yogyakarta';
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Reguler', 'weekday', 100000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'kenari-football-area-yogyakarta') LIMIT 1;
INSERT INTO public.pricing_rules (court_id, name, day_type, base_price, member_discount_pct, priority) SELECT id, 'Weekend', 'weekend', 150000, 5, 0 FROM public.courts WHERE court_type = 'futsal' AND venue_id IN (SELECT id FROM public.venues WHERE slug = 'kenari-football-area-yogyakarta') LIMIT 1;

-- Court slots
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'jec-mini-soccer-n-soccer-field-105-x-68m');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'maguwoharjo-soccer-field');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'grha-pradipta-jec-mini-soccer');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'maguwoharjo-football-park');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'mecmata-arena-sport-center-minisoccer-basket-futsa');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'bardosono-happy-futsal');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'tifosi-futsal');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'planet-futsal');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'golden-goal-futsal');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'futsal-jogokaryan');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'gps-futsal');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'amikom-soccer-arena');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'rocket-mini-soccer-field');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'tegalyoso-soccer-center');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'maleha-sportainment');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-karang-kotagede');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-sepakbola-potorono');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-banyuraden');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-madukismo');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-bola-basket-gor-klebengan');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'lapangan-sepak-bola-fikk-uny');
INSERT INTO public.court_slots (court_id, split_index) SELECT id, 0 FROM public.courts WHERE venue_id IN (SELECT id FROM public.venues WHERE slug = 'kenari-football-area-yogyakarta');
