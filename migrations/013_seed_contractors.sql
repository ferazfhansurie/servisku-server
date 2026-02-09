-- Seed sample contractors for iService with locations

-- First delete any existing contractor data
DELETE FROM contractor_services WHERE TRUE;
DELETE FROM contractor_profiles WHERE TRUE;
DELETE FROM users WHERE role = 'contractor';

-- Create contractor users
INSERT INTO users (id, email, phone, full_name, role, password_hash) VALUES
  ('c1000001-0001-0001-0001-000000000001', 'sarah@electrical.my', '+60123456001', 'Sarah Electrical Works', 'contractor', '$2b$10$hash1'),
  ('c2000001-0001-0001-0001-000000000002', 'ahmad@plumbing.my', '+60123456002', 'Ahmad Plumbing Services', 'contractor', '$2b$10$hash2'),
  ('c3000001-0001-0001-0001-000000000003', 'maya@cleaning.my', '+60123456003', 'Maya Sparkle Cleaning', 'contractor', '$2b$10$hash3'),
  ('c4000001-0001-0001-0001-000000000004', 'zul@aircon.my', '+60123456004', 'Zul Cool Aircon', 'contractor', '$2b$10$hash4'),
  ('c5000001-0001-0001-0001-000000000005', 'farid@renovation.my', '+60123456005', 'Farid Renovation Pro', 'contractor', '$2b$10$hash5'),
  ('c6000001-0001-0001-0001-000000000006', 'lisa@car.my', '+60123456006', 'Lisa Auto Services', 'contractor', '$2b$10$hash6'),
  ('c7000001-0001-0001-0001-000000000007', 'raj@tech.my', '+60123456007', 'Raj Tech Solutions', 'contractor', '$2b$10$hash7'),
  ('c8000001-0001-0001-0001-000000000008', 'aminah@beauty.my', '+60123456008', 'Aminah Beauty Studio', 'contractor', '$2b$10$hash8');

-- Create contractor profiles with Klang Valley locations
INSERT INTO contractor_profiles (id, user_id, business_name, description, verification_status, avg_rating, total_reviews, total_jobs_completed, is_online, service_radius_km, lat, lng)
VALUES
  ('d1000001-0001-0001-0001-000000000001', 'c1000001-0001-0001-0001-000000000001', 'Sarah Electrical Works', 'Professional electrical services for residential and commercial. Licensed wireman with 15 years experience.', 'verified', 4.9, 98, 245, true, 30, 3.1390, 101.6869),
  ('d2000001-0001-0001-0001-000000000002', 'c2000001-0001-0001-0001-000000000002', 'Ahmad Plumbing Services', 'Expert plumber serving Klang Valley. 24/7 emergency services available.', 'verified', 4.8, 156, 312, true, 25, 3.1579, 101.7119),
  ('d3000001-0001-0001-0001-000000000003', 'c3000001-0001-0001-0001-000000000003', 'Maya Sparkle Cleaning', 'Professional home and office cleaning. Eco-friendly products used.', 'verified', 4.7, 210, 450, false, 20, 3.1209, 101.6538),
  ('d4000001-0001-0001-0001-000000000004', 'c4000001-0001-0001-0001-000000000004', 'Zul Cool Aircon', 'Aircon installation, service and repair. All brands supported.', 'verified', 4.8, 89, 178, true, 35, 3.0738, 101.5183),
  ('d5000001-0001-0001-0001-000000000005', 'c5000001-0001-0001-0001-000000000005', 'Farid Renovation Pro', 'Full renovation services - kitchen, bathroom, living spaces.', 'verified', 4.6, 67, 89, true, 40, 3.0833, 101.5500),
  ('d6000001-0001-0001-0001-000000000006', 'c6000001-0001-0001-0001-000000000006', 'Lisa Auto Services', 'Mobile car service and repair. We come to you!', 'verified', 4.5, 123, 267, true, 50, 3.0319, 101.3959),
  ('d7000001-0001-0001-0001-000000000007', 'c7000001-0001-0001-0001-000000000007', 'Raj Tech Solutions', 'Computer repair, network setup, smart home installation.', 'verified', 4.9, 78, 156, true, 30, 3.1569, 101.7112),
  ('d8000001-0001-0001-0001-000000000008', 'c8000001-0001-0001-0001-000000000008', 'Aminah Beauty Studio', 'Makeup, hair styling, and spa services. Bridal packages available.', 'verified', 4.8, 145, 312, false, 15, 3.1412, 101.6865);

-- Create services for electrical contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd1000001-0001-0001-0001-000000000001', id, 'Electrical Wiring Repair', 'Fix faulty wiring, replace damaged cables', 150, 'fixed', true
FROM subcategories WHERE slug = 'electrical';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd1000001-0001-0001-0001-000000000001', id, 'Light Fixture Installation', 'Install new lights, ceiling fans', 80, 'fixed', true
FROM subcategories WHERE slug = 'electrical';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd1000001-0001-0001-0001-000000000001', id, 'Electrical Panel Upgrade', 'Upgrade main electrical panel', 500, 'fixed', true
FROM subcategories WHERE slug = 'electrical';

-- Create services for plumbing contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd2000001-0001-0001-0001-000000000002', id, 'Pipe Leak Repair', 'Fix leaking pipes, replace damaged sections', 120, 'fixed', true
FROM subcategories WHERE slug = 'plumbing';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd2000001-0001-0001-0001-000000000002', id, 'Toilet Repair', 'Fix toilet issues, replace parts', 100, 'fixed', true
FROM subcategories WHERE slug = 'plumbing';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd2000001-0001-0001-0001-000000000002', id, 'Water Heater Installation', 'Install new water heater', 200, 'fixed', true
FROM subcategories WHERE slug = 'plumbing';

-- Create services for cleaning contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd3000001-0001-0001-0001-000000000003', id, 'Home Deep Cleaning', 'Thorough cleaning of entire home', 250, 'fixed', true
FROM subcategories WHERE slug = 'cleaning';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd3000001-0001-0001-0001-000000000003', id, 'Move-in/Move-out Cleaning', 'Complete cleaning for moving', 300, 'fixed', true
FROM subcategories WHERE slug = 'cleaning';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd3000001-0001-0001-0001-000000000003', id, 'Office Cleaning', 'Regular office cleaning service', 45, 'hourly', true
FROM subcategories WHERE slug = 'cleaning';

-- Create services for aircon contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd4000001-0001-0001-0001-000000000004', id, 'Aircon Servicing', 'Regular maintenance and cleaning', 80, 'fixed', true
FROM subcategories WHERE slug = 'aircond';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd4000001-0001-0001-0001-000000000004', id, 'Aircon Installation', 'New aircon unit installation', 350, 'fixed', true
FROM subcategories WHERE slug = 'aircond';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd4000001-0001-0001-0001-000000000004', id, 'Gas Top-up', 'Refill aircon gas', 150, 'fixed', true
FROM subcategories WHERE slug = 'aircond';

-- Create services for renovation contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd5000001-0001-0001-0001-000000000005', id, 'Kitchen Renovation', 'Complete kitchen makeover', 15000, 'fixed', true
FROM subcategories WHERE slug = 'building';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd5000001-0001-0001-0001-000000000005', id, 'Bathroom Renovation', 'Full bathroom remodel', 8000, 'fixed', true
FROM subcategories WHERE slug = 'building';

-- Create services for auto contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd6000001-0001-0001-0001-000000000006', id, 'Car Service Package', 'Full service with oil change', 180, 'fixed', true
FROM subcategories WHERE slug = 'car-service';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd6000001-0001-0001-0001-000000000006', id, 'Brake Service', 'Brake pad replacement and inspection', 250, 'fixed', true
FROM subcategories WHERE slug = 'car-repairs';

-- Create services for tech contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd7000001-0001-0001-0001-000000000007', id, 'Computer Repair', 'Diagnose and fix PC issues', 80, 'fixed', true
FROM subcategories WHERE slug = 'computer-repair';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd7000001-0001-0001-0001-000000000007', id, 'Smart Home Setup', 'Install and configure smart devices', 150, 'fixed', true
FROM subcategories WHERE slug = 'smarthome';

-- Create services for beauty contractor
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd8000001-0001-0001-0001-000000000008', id, 'Bridal Makeup', 'Complete bridal makeup service', 500, 'fixed', true
FROM subcategories WHERE slug = 'makeup';
INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, is_active)
SELECT 'd8000001-0001-0001-0001-000000000008', id, 'Hair Styling', 'Professional hair styling', 80, 'fixed', true
FROM subcategories WHERE slug = 'hair-salon';
