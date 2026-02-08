-- Seed sample contractors and services for testing
-- This adds demo data so the app has something to display

-- First, create some test users as contractors
INSERT INTO users (id, email, password_hash, phone, full_name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ahmad@test.com', '$2a$10$rQnM1hJ5vKGgV5XvHJ8pXO5zP0qYt9.GhQ5Wm5x1Q8z7v8y9n0m1i', '+60123456001', 'Ahmad Plumber Pro', 'contractor', true),
  ('22222222-2222-2222-2222-222222222222', 'sarah@test.com', '$2a$10$rQnM1hJ5vKGgV5XvHJ8pXO5zP0qYt9.GhQ5Wm5x1Q8z7v8y9n0m1i', '+60123456002', 'Sarah Electrician', 'contractor', true),
  ('33333333-3333-3333-3333-333333333333', 'ali@test.com', '$2a$10$rQnM1hJ5vKGgV5XvHJ8pXO5zP0qYt9.GhQ5Wm5x1Q8z7v8y9n0m1i', '+60123456003', 'Ali Aircon Services', 'contractor', true),
  ('44444444-4444-4444-4444-444444444444', 'maya@test.com', '$2a$10$rQnM1hJ5vKGgV5XvHJ8pXO5zP0qYt9.GhQ5Wm5x1Q8z7v8y9n0m1i', '+60123456004', 'Maya Cleaning Pro', 'contractor', true),
  ('55555555-5555-5555-5555-555555555555', 'faiz@test.com', '$2a$10$rQnM1hJ5vKGgV5XvHJ8pXO5zP0qYt9.GhQ5Wm5x1Q8z7v8y9n0m1i', '+60123456005', 'Faiz Renovation', 'contractor', true)
ON CONFLICT (id) DO NOTHING;

-- Create contractor profiles (Kuala Lumpur area coordinates)
INSERT INTO contractor_profiles (id, user_id, business_name, description, ic_number, verification_status, avg_rating, total_reviews, lat, lng, service_radius_km) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Ahmad Plumber Pro', 'Professional plumbing services with 10+ years experience. We fix leaks, install pipes, and handle all plumbing emergencies.', '880101145001', 'verified', 4.8, 125, 3.1390, 101.6869, 30),
  ('aaaa2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Sarah Electrical Works', 'Licensed electrician offering residential and commercial electrical services. Wiring, repairs, and installations.', '900202145002', 'verified', 4.9, 98, 3.1516, 101.7043, 25),
  ('aaaa3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Ali Cool Aircon', 'Expert aircon services - installation, repair, cleaning, and maintenance for all brands.', '850303145003', 'verified', 4.7, 210, 3.1275, 101.6824, 35),
  ('aaaa4444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Maya Sparkle Cleaning', 'Professional home and office cleaning services. Deep cleaning, move-in/out cleaning, regular maintenance.', '920404145004', 'verified', 4.6, 156, 3.1569, 101.7118, 20),
  ('aaaa5555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Faiz Home Renovation', 'Complete renovation services - kitchen, bathroom, flooring, and full house renovation. Free consultation!', '880505145005', 'verified', 4.9, 67, 3.1321, 101.6892, 40)
ON CONFLICT (user_id) DO NOTHING;

-- Create contractor services
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa1111-1111-1111-1111-111111111111',
  s.id,
  'Pipe Leak Repair',
  'Fix all types of pipe leaks - kitchen, bathroom, outdoor. Fast and reliable service with warranty.',
  80.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa1111-1111-1111-1111-111111111111',
  s.id,
  'Toilet Installation',
  'Professional toilet bowl installation and replacement. Includes removal of old toilet.',
  200.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa1111-1111-1111-1111-111111111111',
  s.id,
  'Water Heater Installation',
  'Install new water heater or replace existing one. All brands supported.',
  150.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa2222-2222-2222-2222-222222222222',
  s.id,
  'Electrical Wiring Repair',
  'Fix faulty wiring, short circuits, and electrical issues. Safety guaranteed.',
  100.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'electrical'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa2222-2222-2222-2222-222222222222',
  s.id,
  'Light Fixture Installation',
  'Install ceiling lights, chandeliers, wall lights, and LED strips.',
  60.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'electrical'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa2222-2222-2222-2222-222222222222',
  s.id,
  'Electrical Panel Upgrade',
  'Upgrade your electrical panel for more capacity and safety.',
  500.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'electrical'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa3333-3333-3333-3333-333333333333',
  s.id,
  'Aircon Chemical Wash',
  'Deep chemical cleaning for your aircon unit. Improves cooling and removes odor.',
  120.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'aircon'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa3333-3333-3333-3333-333333333333',
  s.id,
  'Aircon Installation',
  'Professional aircon installation with proper piping and bracket setup.',
  250.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'aircon'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa3333-3333-3333-3333-333333333333',
  s.id,
  'Aircon Gas Top-up',
  'Refill refrigerant gas to restore cooling performance.',
  80.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'aircon'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa4444-4444-4444-4444-444444444444',
  s.id,
  'Home Deep Cleaning',
  'Thorough deep cleaning of your entire home. Includes kitchen, bathroom, bedroom, and living areas.',
  250.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa4444-4444-4444-4444-444444444444',
  s.id,
  'Office Cleaning',
  'Professional office cleaning service. Daily, weekly, or monthly packages available.',
  150.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa4444-4444-4444-4444-444444444444',
  s.id,
  'Move-in/Move-out Cleaning',
  'Complete cleaning for moving in or out. Leave the place spotless!',
  350.00,
  'fixed',
  true
FROM subcategories s WHERE s.slug = 'cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa5555-5555-5555-5555-555555555555',
  s.id,
  'Kitchen Renovation',
  'Complete kitchen renovation including cabinets, countertops, and appliance installation.',
  5000.00,
  'quote',
  true
FROM subcategories s WHERE s.slug = 'renovation'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa5555-5555-5555-5555-555555555555',
  s.id,
  'Bathroom Renovation',
  'Modern bathroom renovation with new tiles, fixtures, and fittings.',
  3500.00,
  'quote',
  true
FROM subcategories s WHERE s.slug = 'renovation'
ON CONFLICT DO NOTHING;

INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 
  'aaaa5555-5555-5555-5555-555555555555',
  s.id,
  'Flooring Installation',
  'Install vinyl, laminate, or tile flooring. Includes floor preparation.',
  25.00,
  'hourly',
  true
FROM subcategories s WHERE s.slug = 'renovation'
ON CONFLICT DO NOTHING;
