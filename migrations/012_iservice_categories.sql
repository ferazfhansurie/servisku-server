-- iService Categories and Subcategories Seed Data

-- First, delete existing contractor_services (they reference subcategories)
DELETE FROM contractor_services WHERE TRUE;

-- Delete existing subcategories and categories
DELETE FROM subcategories WHERE TRUE;
DELETE FROM categories WHERE TRUE;

-- Insert main categories
INSERT INTO categories (id, name_en, name_ms, slug, icon, color, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000001', 'Home', 'Rumah', 'home', 'home', '#4CAF50', 1),
  ('a0000001-0001-0001-0001-000000000002', 'Transport', 'Pengangkutan', 'transport', 'car', '#2196F3', 2),
  ('a0000001-0001-0001-0001-000000000003', 'Beauty & Wellness', 'Kecantikan & Kesejahteraan', 'personal-care', 'spa', '#E91E63', 3),
  ('a0000001-0001-0001-0001-000000000004', 'Events', 'Acara', 'events', 'celebration', '#9C27B0', 4),
  ('a0000001-0001-0001-0001-000000000005', 'Business', 'Perniagaan', 'business', 'business', '#607D8B', 5),
  ('a0000001-0001-0001-0001-000000000006', 'Tech', 'Teknologi', 'tech', 'computer', '#00BCD4', 6),
  ('a0000001-0001-0001-0001-000000000007', 'Pets', 'Haiwan Peliharaan', 'pets', 'pets', '#FF9800', 7),
  ('a0000001-0001-0001-0001-000000000008', 'Learning', 'Pembelajaran', 'learning', 'school', '#673AB7', 8);

-- HOME subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000001', 'Electrical', 'Elektrik', 'electrical', 'electrical_services', 1),
  ('a0000001-0001-0001-0001-000000000001', 'Plumbing', 'Paip', 'plumbing', 'plumbing', 2),
  ('a0000001-0001-0001-0001-000000000001', 'Building & Renovation', 'Pembinaan', 'building', 'construction', 3),
  ('a0000001-0001-0001-0001-000000000001', 'Aircond Services', 'Servis Aircond', 'aircond', 'ac_unit', 4),
  ('a0000001-0001-0001-0001-000000000001', 'Home Appliances', 'Peralatan Rumah', 'appliances', 'kitchen', 5),
  ('a0000001-0001-0001-0001-000000000001', 'Interior Design', 'Reka Bentuk Dalaman', 'interior-design', 'design_services', 6),
  ('a0000001-0001-0001-0001-000000000001', 'Cleaning Services', 'Pembersihan', 'cleaning', 'cleaning_services', 7),
  ('a0000001-0001-0001-0001-000000000001', 'Pest Control', 'Kawalan Serangga', 'pest-control', 'pest_control', 8),
  ('a0000001-0001-0001-0001-000000000001', 'Landscaping', 'Landskap', 'landscaping', 'grass', 9),
  ('a0000001-0001-0001-0001-000000000001', 'Security', 'Keselamatan', 'security', 'security', 10);

-- TRANSPORT subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000002', 'Car Hire', 'Sewa Kereta', 'car-hire', 'car_rental', 1),
  ('a0000001-0001-0001-0001-000000000002', 'Lorry Services', 'Perkhidmatan Lori', 'lorry', 'local_shipping', 2),
  ('a0000001-0001-0001-0001-000000000002', 'Towing', 'Tunda', 'towing', 'tow_truck', 3),
  ('a0000001-0001-0001-0001-000000000002', 'Car Service', 'Servis Kereta', 'car-service', 'car_repair', 4),
  ('a0000001-0001-0001-0001-000000000002', 'Car Repairs', 'Pembaikan Kereta', 'car-repairs', 'build', 5),
  ('a0000001-0001-0001-0001-000000000002', 'Motorcycle Service', 'Servis Motosikal', 'motorcycle-service', 'two_wheeler', 6),
  ('a0000001-0001-0001-0001-000000000002', 'Detailing', 'Detailing', 'detailing', 'auto_awesome', 7),
  ('a0000001-0001-0001-0001-000000000002', 'Tires', 'Tayar', 'tires', 'tire_repair', 8);

-- BEAUTY & WELLNESS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000003', 'Hair Salon', 'Salun Rambut', 'hair-salon', 'content_cut', 1),
  ('a0000001-0001-0001-0001-000000000003', 'Makeup', 'Solekan', 'makeup', 'face', 2),
  ('a0000001-0001-0001-0001-000000000003', 'Nail Services', 'Perkhidmatan Kuku', 'nails', 'spa', 3),
  ('a0000001-0001-0001-0001-000000000003', 'Massage', 'Urutan', 'massage', 'self_improvement', 4),
  ('a0000001-0001-0001-0001-000000000003', 'Spa', 'Spa', 'spa', 'hot_tub', 5),
  ('a0000001-0001-0001-0001-000000000003', 'Personal Training', 'Latihan Peribadi', 'personal-training', 'fitness_center', 6),
  ('a0000001-0001-0001-0001-000000000003', 'Barbershop', 'Kedai Gunting', 'barbershop', 'face_retouching_natural', 7),
  ('a0000001-0001-0001-0001-000000000003', 'Tattoo & Piercing', 'Tatu & Tindik', 'tattoo', 'brush', 8);

-- EVENTS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000004', 'Event Planning', 'Perancangan Acara', 'event-planning', 'event', 1),
  ('a0000001-0001-0001-0001-000000000004', 'Photography', 'Fotografi', 'photography', 'photo_camera', 2),
  ('a0000001-0001-0001-0001-000000000004', 'Videography', 'Videografi', 'videography', 'videocam', 3),
  ('a0000001-0001-0001-0001-000000000004', 'Catering', 'Katering', 'catering', 'restaurant', 4),
  ('a0000001-0001-0001-0001-000000000004', 'DJ & Music', 'DJ & Muzik', 'dj-music', 'music_note', 5),
  ('a0000001-0001-0001-0001-000000000004', 'Decoration', 'Hiasan', 'decoration', 'celebration', 6),
  ('a0000001-0001-0001-0001-000000000004', 'MC & Emcee', 'MC & Pengacara', 'mc-emcee', 'mic', 7),
  ('a0000001-0001-0001-0001-000000000004', 'Venue Rental', 'Sewa Tempat', 'venue-rental', 'location_city', 8);

-- BUSINESS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000005', 'Accounting', 'Perakaunan', 'accounting', 'calculate', 1),
  ('a0000001-0001-0001-0001-000000000005', 'Legal Services', 'Perkhidmatan Undang-undang', 'legal', 'gavel', 2),
  ('a0000001-0001-0001-0001-000000000005', 'Marketing', 'Pemasaran', 'marketing', 'campaign', 3),
  ('a0000001-0001-0001-0001-000000000005', 'Consulting', 'Perundingan', 'consulting', 'support_agent', 4),
  ('a0000001-0001-0001-0001-000000000005', 'HR Services', 'Perkhidmatan HR', 'hr-services', 'people', 5),
  ('a0000001-0001-0001-0001-000000000005', 'Insurance', 'Insurans', 'insurance', 'health_and_safety', 6),
  ('a0000001-0001-0001-0001-000000000005', 'Translation', 'Terjemahan', 'translation', 'translate', 7),
  ('a0000001-0001-0001-0001-000000000005', 'Virtual Assistant', 'Pembantu Maya', 'virtual-assistant', 'assistant', 8);

-- TECH subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000006', 'Computer Repair', 'Pembaikan Komputer', 'computer-repair', 'computer', 1),
  ('a0000001-0001-0001-0001-000000000006', 'Phone Repair', 'Pembaikan Telefon', 'phone-repair', 'phone_android', 2),
  ('a0000001-0001-0001-0001-000000000006', 'Web Development', 'Pembangunan Web', 'web-development', 'web', 3),
  ('a0000001-0001-0001-0001-000000000006', 'App Development', 'Pembangunan Aplikasi', 'app-development', 'app_shortcut', 4),
  ('a0000001-0001-0001-0001-000000000006', 'IT Support', 'Sokongan IT', 'it-support', 'support', 5),
  ('a0000001-0001-0001-0001-000000000006', 'Network Setup', 'Tetapan Rangkaian', 'network-setup', 'router', 6),
  ('a0000001-0001-0001-0001-000000000006', 'CCTV Installation', 'Pemasangan CCTV', 'cctv', 'videocam', 7),
  ('a0000001-0001-0001-0001-000000000006', 'Smart Home', 'Rumah Pintar', 'smarthome', 'home_iot_device', 8);

-- PETS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000007', 'Pet Grooming', 'Dandanan Haiwan', 'pet-grooming', 'pets', 1),
  ('a0000001-0001-0001-0001-000000000007', 'Veterinary', 'Veterinar', 'veterinary', 'medical_services', 2),
  ('a0000001-0001-0001-0001-000000000007', 'Pet Boarding', 'Penginapan Haiwan', 'pet-boarding', 'house', 3),
  ('a0000001-0001-0001-0001-000000000007', 'Pet Training', 'Latihan Haiwan', 'pet-training', 'school', 4),
  ('a0000001-0001-0001-0001-000000000007', 'Pet Sitting', 'Penjagaan Haiwan', 'pet-sitting', 'favorite', 5),
  ('a0000001-0001-0001-0001-000000000007', 'Pet Transport', 'Pengangkutan Haiwan', 'pet-transport', 'local_shipping', 6);

-- LEARNING subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order) VALUES
  ('a0000001-0001-0001-0001-000000000008', 'Tutoring', 'Tuisyen', 'tutoring', 'school', 1),
  ('a0000001-0001-0001-0001-000000000008', 'Music Lessons', 'Pelajaran Muzik', 'music-lessons', 'music_note', 2),
  ('a0000001-0001-0001-0001-000000000008', 'Language Classes', 'Kelas Bahasa', 'language-classes', 'language', 3),
  ('a0000001-0001-0001-0001-000000000008', 'Driving Lessons', 'Pelajaran Memandu', 'driving-lessons', 'directions_car', 4),
  ('a0000001-0001-0001-0001-000000000008', 'Art Classes', 'Kelas Seni', 'art-classes', 'palette', 5),
  ('a0000001-0001-0001-0001-000000000008', 'Sports Coaching', 'Latihan Sukan', 'sports-coaching', 'sports', 6),
  ('a0000001-0001-0001-0001-000000000008', 'Cooking Classes', 'Kelas Memasak', 'cooking-classes', 'restaurant', 7),
  ('a0000001-0001-0001-0001-000000000008', 'Professional Courses', 'Kursus Profesional', 'professional-courses', 'workspace_premium', 8);
