-- Assign platform_admin to the first user who registers
-- Run after first user registers, or manually via SQL editor

-- Find the first user and give them platform_admin role
INSERT INTO public.venue_roles (user_id, venue_id, role)
SELECT u.id, v.id, 'platform_admin'
FROM auth.users u
CROSS JOIN public.venues v
WHERE NOT EXISTS (
  SELECT 1 FROM public.venue_roles vr
  WHERE vr.user_id = u.id AND vr.role = 'platform_admin'
)
LIMIT 1;
