-- Fix categories to match the app's expected slugs

-- Delete existing data
DELETE FROM contractor_services;
DELETE FROM subcategories;
DELETE FROM categories;
DELETE FROM contractor_profiles;
DELETE FROM users WHERE role = 'contractor';

-- Insert categories matching the app (using valid hex UUIDs)
INSERT INTO categories (id, name_en, name_ms, slug, icon, color, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000001', 'Home', 'Rumah', 'home', 'home', '#4CAF50', 1),
  ('a0000001-0001-0001-0001-000000000002', 'Transport', 'Pengangkutan', 'transport', 'car', '#2196F3', 2),
  ('a0000001-0001-0001-0001-000000000003', 'Beauty & Wellness', 'Kecantikan & Kesejahteraan', 'personal-care', 'spa', '#E91E63', 3),
  ('a0000001-0001-0001-0001-000000000004', 'Events', 'Acara', 'events', 'celebration', '#9C27B0', 4),
  ('a0000001-0001-0001-0001-000000000005', 'Business', 'Perniagaan', 'business', 'business', '#607D8B', 5),
  ('a0000001-0001-0001-0001-000000000006', 'Tech', 'Teknologi', 'tech', 'computer', '#00BCD4', 6),
  ('a0000001-0001-0001-0001-000000000007', 'Pets', 'Haiwan Peliharaan', 'pets', 'pets', '#FF9800', 7),
  ('a0000001-0001-0001-0001-000000000008', 'Learning', 'Pembelajaran', 'learning', 'school', '#673AB7', 8);

-- Insert subcategories for Home
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000001', 'a0000001-0001-0001-0001-000000000001', 'Plumbing', 'Paip', 'plumbing', 'plumbing'),
  ('b0000001-0001-0001-0001-000000000002', 'a0000001-0001-0001-0001-000000000001', 'Electrical', 'Elektrik', 'electrical', 'electrical_services'),
  ('b0000001-0001-0001-0001-000000000003', 'a0000001-0001-0001-0001-000000000001', 'Aircon Service', 'Servis Aircon', 'aircon', 'ac_unit'),
  ('b0000001-0001-0001-0001-000000000004', 'a0000001-0001-0001-0001-000000000001', 'Cleaning', 'Pembersihan', 'cleaning', 'cleaning_services'),
  ('b0000001-0001-0001-0001-000000000005', 'a0000001-0001-0001-0001-000000000001', 'Renovation', 'Pengubahsuaian', 'renovation', 'construction');

-- Insert subcategories for Transport
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000006', 'a0000001-0001-0001-0001-000000000002', 'Car Wash', 'Cuci Kereta', 'car-wash', 'local_car_wash'),
  ('b0000001-0001-0001-0001-000000000007', 'a0000001-0001-0001-0001-000000000002', 'Mechanic', 'Mekanik', 'mechanic', 'build'),
  ('b0000001-0001-0001-0001-000000000008', 'a0000001-0001-0001-0001-000000000002', 'Towing', 'Tunda', 'towing', 'local_shipping');

-- Insert subcategories for Personal Care
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000009', 'a0000001-0001-0001-0001-000000000003', 'Haircut', 'Gunting Rambut', 'haircut', 'content_cut'),
  ('b0000001-0001-0001-0001-000000000010', 'a0000001-0001-0001-0001-000000000003', 'Massage', 'Urut', 'massage', 'spa'),
  ('b0000001-0001-0001-0001-000000000011', 'a0000001-0001-0001-0001-000000000003', 'Makeup', 'Solekan', 'makeup', 'face');

-- Insert subcategories for Events
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000012', 'a0000001-0001-0001-0001-000000000004', 'Photography', 'Fotografi', 'photography', 'camera_alt'),
  ('b0000001-0001-0001-0001-000000000013', 'a0000001-0001-0001-0001-000000000004', 'Catering', 'Katering', 'catering', 'restaurant'),
  ('b0000001-0001-0001-0001-000000000014', 'a0000001-0001-0001-0001-000000000004', 'DJ & Music', 'DJ & Muzik', 'dj-music', 'music_note');

-- Insert subcategories for Business
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000015', 'a0000001-0001-0001-0001-000000000005', 'Accounting', 'Perakaunan', 'accounting', 'calculate'),
  ('b0000001-0001-0001-0001-000000000016', 'a0000001-0001-0001-0001-000000000005', 'Legal', 'Perundangan', 'legal', 'gavel'),
  ('b0000001-0001-0001-0001-000000000017', 'a0000001-0001-0001-0001-000000000005', 'Marketing', 'Pemasaran', 'marketing', 'campaign');

-- Insert subcategories for Tech
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000018', 'a0000001-0001-0001-0001-000000000006', 'Computer Repair', 'Baiki Komputer', 'computer-repair', 'computer'),
  ('b0000001-0001-0001-0001-000000000019', 'a0000001-0001-0001-0001-000000000006', 'Phone Repair', 'Baiki Telefon', 'phone-repair', 'phone_android'),
  ('b0000001-0001-0001-0001-000000000020', 'a0000001-0001-0001-0001-000000000006', 'Web Development', 'Pembangunan Web', 'web-dev', 'web');

-- Insert subcategories for Pets
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000021', 'a0000001-0001-0001-0001-000000000007', 'Pet Grooming', 'Dandanan Haiwan', 'pet-grooming', 'pets'),
  ('b0000001-0001-0001-0001-000000000022', 'a0000001-0001-0001-0001-000000000007', 'Pet Sitting', 'Penjagaan Haiwan', 'pet-sitting', 'house'),
  ('b0000001-0001-0001-0001-000000000023', 'a0000001-0001-0001-0001-000000000007', 'Veterinary', 'Veterinar', 'vet', 'healing');

-- Insert subcategories for Learning
INSERT INTO subcategories (id, category_id, name_en, name_ms, slug, icon) VALUES
  ('b0000001-0001-0001-0001-000000000024', 'a0000001-0001-0001-0001-000000000008', 'Tuition', 'Tuisyen', 'tuition', 'school'),
  ('b0000001-0001-0001-0001-000000000025', 'a0000001-0001-0001-0001-000000000008', 'Music Lessons', 'Pelajaran Muzik', 'music-lesson', 'music_note'),
  ('b0000001-0001-0001-0001-000000000026', 'a0000001-0001-0001-0001-000000000008', 'Language', 'Bahasa', 'language', 'translate');

-- Create contractor users
INSERT INTO users (id, email, phone, full_name, role, is_active) VALUES
  ('d0000001-0001-0001-0001-000000000001', 'ahmad@servisku.com', '+60123456001', 'Ahmad Plumber', 'contractor', true),
  ('d0000001-0001-0001-0001-000000000002', 'sarah@servisku.com', '+60123456002', 'Sarah Electric', 'contractor', true),
  ('d0000001-0001-0001-0001-000000000003', 'ali@servisku.com', '+60123456003', 'Ali Aircon', 'contractor', true),
  ('d0000001-0001-0001-0001-000000000004', 'maya@servisku.com', '+60123456004', 'Maya Cleaner', 'contractor', true),
  ('d0000001-0001-0001-0001-000000000005', 'faiz@servisku.com', '+60123456005', 'Faiz Mechanic', 'contractor', true);

-- Create contractor profiles
INSERT INTO contractor_profiles (id, user_id, business_name, description, verification_status, avg_rating, total_reviews, total_jobs_completed, is_online, service_radius_km, lat, lng) VALUES
  ('e0000001-0001-0001-0001-000000000001', 'd0000001-0001-0001-0001-000000000001', 'Ahmad Plumber Pro', 'Professional plumbing services with 10 years experience', 'verified', 4.8, 125, 250, true, 25, 3.1390, 101.6869),
  ('e0000001-0001-0001-0001-000000000002', 'd0000001-0001-0001-0001-000000000002', 'Sarah Electrical Works', 'Licensed electrician for all electrical needs', 'verified', 4.9, 89, 180, true, 30, 3.1480, 101.7100),
  ('e0000001-0001-0001-0001-000000000003', 'd0000001-0001-0001-0001-000000000003', 'Ali Cool Aircon', 'Aircon installation, repair and maintenance', 'verified', 4.7, 156, 320, false, 20, 3.1250, 101.6500),
  ('e0000001-0001-0001-0001-000000000004', 'd0000001-0001-0001-0001-000000000004', 'Maya Sparkle Cleaning', 'Home and office cleaning services', 'verified', 4.85, 210, 450, true, 15, 3.1600, 101.7200),
  ('e0000001-0001-0001-0001-000000000005', 'd0000001-0001-0001-0001-000000000005', 'Faiz Auto Service', 'Car repair and maintenance specialist', 'verified', 4.6, 78, 150, true, 35, 3.1100, 101.6300);

-- Create services for contractors
-- Ahmad Plumber (Home - Plumbing)
INSERT INTO contractor_services (id, contractor_id, subcategory_id, title, description, base_price, price_type, is_active) VALUES
  ('f0000001-0001-0001-0001-000000000001', 'e0000001-0001-0001-0001-000000000001', 'b0000001-0001-0001-0001-000000000001', 'Pipe Leak Repair', 'Fix all types of pipe leaks quickly', 80.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000002', 'e0000001-0001-0001-0001-000000000001', 'b0000001-0001-0001-0001-000000000001', 'Toilet Installation', 'Install new toilet or replace old one', 150.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000003', 'e0000001-0001-0001-0001-000000000001', 'b0000001-0001-0001-0001-000000000001', 'Drain Unclogging', 'Clear blocked drains and pipes', 60.00, 'fixed', true);

-- Sarah Electrical (Home - Electrical)
INSERT INTO contractor_services (id, contractor_id, subcategory_id, title, description, base_price, price_type, is_active) VALUES
  ('f0000001-0001-0001-0001-000000000004', 'e0000001-0001-0001-0001-000000000002', 'b0000001-0001-0001-0001-000000000002', 'Electrical Wiring Repair', 'Fix faulty wiring and connections', 100.00, 'hourly', true),
  ('f0000001-0001-0001-0001-000000000005', 'e0000001-0001-0001-0001-000000000002', 'b0000001-0001-0001-0001-000000000002', 'Light Installation', 'Install ceiling lights, chandeliers, etc', 50.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000006', 'e0000001-0001-0001-0001-000000000002', 'b0000001-0001-0001-0001-000000000002', 'Circuit Breaker Replacement', 'Replace faulty circuit breakers', 120.00, 'fixed', true);

-- Ali Aircon (Home - Aircon)
INSERT INTO contractor_services (id, contractor_id, subcategory_id, title, description, base_price, price_type, is_active) VALUES
  ('f0000001-0001-0001-0001-000000000007', 'e0000001-0001-0001-0001-000000000003', 'b0000001-0001-0001-0001-000000000003', 'Aircon Servicing', 'Regular maintenance and cleaning', 45.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000008', 'e0000001-0001-0001-0001-000000000003', 'b0000001-0001-0001-0001-000000000003', 'Aircon Installation', 'Install new aircon unit', 250.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000009', 'e0000001-0001-0001-0001-000000000003', 'b0000001-0001-0001-0001-000000000003', 'Gas Top-up', 'Refill aircon refrigerant gas', 80.00, 'fixed', true);

-- Maya Cleaning (Home - Cleaning)
INSERT INTO contractor_services (id, contractor_id, subcategory_id, title, description, base_price, price_type, is_active) VALUES
  ('f0000001-0001-0001-0001-000000000010', 'e0000001-0001-0001-0001-000000000004', 'b0000001-0001-0001-0001-000000000004', 'Home Deep Cleaning', 'Thorough cleaning of entire home', 200.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000011', 'e0000001-0001-0001-0001-000000000004', 'b0000001-0001-0001-0001-000000000004', 'Office Cleaning', 'Professional office cleaning service', 150.00, 'hourly', true),
  ('f0000001-0001-0001-0001-000000000012', 'e0000001-0001-0001-0001-000000000004', 'b0000001-0001-0001-0001-000000000004', 'Move-in/Move-out Cleaning', 'Complete cleaning for moving', 300.00, 'fixed', true);

-- Faiz Mechanic (Transport - Mechanic)
INSERT INTO contractor_services (id, contractor_id, subcategory_id, title, description, base_price, price_type, is_active) VALUES
  ('f0000001-0001-0001-0001-000000000013', 'e0000001-0001-0001-0001-000000000005', 'b0000001-0001-0001-0001-000000000007', 'Car Service', 'Full car servicing and checkup', 180.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000014', 'e0000001-0001-0001-0001-000000000005', 'b0000001-0001-0001-0001-000000000007', 'Brake Repair', 'Brake pad replacement and repair', 120.00, 'fixed', true),
  ('f0000001-0001-0001-0001-000000000015', 'e0000001-0001-0001-0001-000000000005', 'b0000001-0001-0001-0001-000000000007', 'Engine Diagnostic', 'Computer diagnostic for engine issues', 80.00, 'fixed', true);
