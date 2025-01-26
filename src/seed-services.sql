-- First add the is_active column to services table
ALTER TABLE public.services 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Then update existing services to be active
UPDATE public.services 
SET is_active = true;

-- Now insert the services
INSERT INTO public.services (
  provider_id, 
  title, 
  description, 
  price, 
  category,
  city,
  is_active
)
SELECT 
  p.id,
  'House Cleaning',
  'Professional house cleaning service',
  80,
  'Cleaning',
  'Mumbai',
  true
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;

INSERT INTO public.services (
  provider_id, 
  title, 
  description, 
  price, 
  category,
  city,
  is_active
)
SELECT 
  p.id,
  'Garden Maintenance',
  'Complete garden care and maintenance',
  60,
  'Gardening',
  'Mumbai',
  true
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;

INSERT INTO public.services (
  provider_id, 
  title, 
  description, 
  price, 
  category,
  city,
  is_active
)
SELECT 
  p.id,
  'Window Cleaning',
  'Professional window cleaning service',
  40,
  'Cleaning',
  'Mumbai',
  true
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;

-- Add more diverse services
INSERT INTO public.services (
  provider_id, 
  title, 
  description, 
  price, 
  category,
  city,
  is_active
)
SELECT 
  p.id,
  'Haircut & Styling',
  'Professional haircut and styling service',
  100,
  'Haircuts',
  'Bangalore',
  true
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;

INSERT INTO public.services (
  provider_id, 
  title, 
  description, 
  price, 
  category,
  city,
  is_active
)
SELECT 
  p.id,
  'Home Repair & Maintenance',
  'General home repair and maintenance service',
  120,
  'Home Repairs',
  'Pune',
  true
FROM profiles p
WHERE p.user_type = 'provider'
LIMIT 1;