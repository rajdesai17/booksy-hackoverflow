-- Insert dummy services
INSERT INTO public.services (provider_id, title, description, price)
SELECT 
  p.id,
  'House Cleaning',
  'Professional house cleaning service',
  80
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;

INSERT INTO public.services (provider_id, title, description, price)
SELECT 
  p.id,
  'Garden Maintenance',
  'Complete garden care and maintenance',
  60
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;

INSERT INTO public.services (provider_id, title, description, price)
SELECT 
  p.id,
  'Window Cleaning',
  'Professional window cleaning service',
  40
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;