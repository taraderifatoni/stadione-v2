-- ============================================
-- Stadione V2: pg_cron Scheduled Jobs
-- ============================================

-- Booking reminder: cek 1 jam sebelum booking
SELECT cron.schedule(
  'booking-reminder',
  '0 * * * *',
  $$
  INSERT INTO public.notifications (user_id, type, title, body)
  SELECT b.user_id, 'booking.reminder',
    'Reminder Booking',
    'Booking Anda besok jam ' || b.start_time || ' - ' || b.end_time
  FROM public.bookings b
  WHERE b.status = 'confirmed'
    AND b.booking_date = CURRENT_DATE + 1
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = b.user_id AND n.type = 'booking.reminder'
        AND n.created_at::date = CURRENT_DATE
    )
  $$
);

-- Membership expiry: cek H-7, H-3, H-1
SELECT cron.schedule(
  'membership-expiry-reminder',
  '0 8 * * *',
  $$
  INSERT INTO public.notifications (user_id, type, title, body, channels_used)
  SELECT m.user_id, 'membership.expired',
    'Membership Akan Berakhir',
    CASE
      WHEN m.end_date - CURRENT_DATE = 7 THEN 'Membership Anda akan berakhir dalam 7 hari.'
      WHEN m.end_date - CURRENT_DATE = 3 THEN 'Membership Anda akan berakhir dalam 3 hari.'
      WHEN m.end_date - CURRENT_DATE = 1 THEN 'Membership Anda berakhir besok.'
      ELSE 'Membership Anda akan segera berakhir.'
    END,
    ARRAY['in_app', 'push', 'email']
  FROM public.members m
  WHERE m.status = 'active'
    AND m.end_date - CURRENT_DATE IN (7, 3, 1)
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = m.user_id AND n.type = 'membership.expired'
        AND n.created_at::date = CURRENT_DATE
    )
  $$
);
