-- Migration: Add comprehensive subcategories for all main categories
-- This migration adds more detailed subcategories to support the iService app structure

-- First, update the main categories structure for iService
UPDATE categories SET name_en = 'Home', name_ms = 'Rumah', slug = 'home' WHERE slug = 'home-transport';
UPDATE categories SET name_en = 'Beauty & Wellness', name_ms = 'Kecantikan & Kesihatan', slug = 'personal-care' WHERE slug = 'personal-care';
UPDATE categories SET name_en = 'Events', name_ms = 'Acara', slug = 'events' WHERE slug = 'events-specialized';
UPDATE categories SET name_en = 'Business', name_ms = 'Perniagaan', slug = 'business' WHERE slug = 'professional-b2b';
UPDATE categories SET name_en = 'Tech', name_ms = 'Teknologi', slug = 'tech' WHERE slug = 'it-creative';
UPDATE categories SET name_en = 'Pets', name_ms = 'Haiwan Peliharaan', slug = 'pets' WHERE slug = 'pet';

-- Add Transport as a new main category
INSERT INTO categories (name_en, name_ms, slug, icon, color, sort_order)
VALUES ('Transport', 'Pengangkutan', 'transport', 'car', '#2196F3', 2)
ON CONFLICT (slug) DO NOTHING;

-- Clear existing subcategories and add comprehensive new ones
DELETE FROM subcategories WHERE category_id IN (SELECT id FROM categories);

-- HOME subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Electrical', 'Elektrik', 'electrical', 'electrical_services', 1 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Plumbing', 'Paip', 'plumbing', 'plumbing', 2 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Building & Renovation', 'Pembinaan & Pengubahsuaian', 'building', 'construction', 3 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Aircond Services', 'Servis Aircond', 'aircond', 'ac_unit', 4 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Home Appliances', 'Peralatan Rumah', 'appliances', 'kitchen', 5 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Interior Design', 'Reka Bentuk Dalaman', 'interior-design', 'design_services', 6 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Cleaning Services', 'Perkhidmatan Pembersihan', 'cleaning', 'cleaning_services', 7 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Metal Works & Awning', 'Kerja Besi & Awning', 'metalworks', 'roofing', 8 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Scaffolding', 'Perancah', 'scaffolding', 'foundation', 9 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Landscaping', 'Landskap', 'landscaping', 'grass', 10 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Furniture', 'Perabot', 'furniture', 'weekend', 11 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Smart Home', 'Rumah Pintar', 'smarthome', 'smart_toy', 12 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Security & CCTV', 'Keselamatan & CCTV', 'security', 'security', 13 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Painting', 'Cat Rumah', 'painting', 'format_paint', 14 FROM categories WHERE slug = 'home'
UNION ALL SELECT id, 'Pest Control', 'Kawalan Serangga', 'pest-control', 'bug_report', 15 FROM categories WHERE slug = 'home';

-- TRANSPORT subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Car for Hire', 'Kereta Sewa', 'car-hire', 'directions_car', 1 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Motorcycle Rental', 'Sewa Motosikal', 'motorcycle-rental', 'two_wheeler', 2 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Lorry & Truck', 'Lori & Trak', 'lorry', 'local_shipping', 3 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Driver Services', 'Perkhidmatan Pemandu', 'driver', 'person_pin', 4 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Car Repairs', 'Pembaikan Kereta', 'car-repairs', 'car_repair', 5 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Service & Check Up', 'Servis & Pemeriksaan', 'car-service', 'build', 6 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Car Tyres', 'Tayar Kereta', 'car-tyres', 'tire_repair', 7 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Motorcycle Tyres', 'Tayar Motosikal', 'motorcycle-tyres', 'circle', 8 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Helicopter Rental', 'Sewa Helikopter', 'helicopter', 'flight', 9 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Aeroplane Charter', 'Cater Kapal Terbang', 'aeroplane', 'airplanemode_active', 10 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Boat Rental', 'Sewa Bot', 'boat', 'directions_boat', 11 FROM categories WHERE slug = 'transport'
UNION ALL SELECT id, 'Towing Services', 'Perkhidmatan Tunda', 'towing', 'rv_hookup', 12 FROM categories WHERE slug = 'transport';

-- BEAUTY & WELLNESS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Hair Salon', 'Salon Rambut', 'hair-salon', 'content_cut', 1 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Spa & Massage', 'Spa & Urut', 'spa-massage', 'spa', 2 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Nail Art', 'Seni Kuku', 'nail-art', 'brush', 3 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Makeup Artist', 'Jurusolek', 'makeup', 'face_retouching_natural', 4 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Personal Training', 'Jurulatih Peribadi', 'personal-training', 'fitness_center', 5 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Nutrition & Diet', 'Nutrisi & Diet', 'nutrition', 'restaurant_menu', 6 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Traditional Medicine', 'Perubatan Tradisional', 'traditional-medicine', 'healing', 7 FROM categories WHERE slug = 'personal-care'
UNION ALL SELECT id, 'Skincare Treatment', 'Rawatan Kulit', 'skincare', 'face', 8 FROM categories WHERE slug = 'personal-care';

-- EVENTS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Photography', 'Fotografi', 'photography', 'camera_alt', 1 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Videography', 'Videografi', 'videography', 'videocam', 2 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Catering', 'Katering', 'catering', 'restaurant', 3 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Event Planning', 'Perancangan Acara', 'event-planning', 'event', 4 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'DJ & Entertainment', 'DJ & Hiburan', 'dj-entertainment', 'music_note', 5 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Florist', 'Kedai Bunga', 'florist', 'local_florist', 6 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Wedding Services', 'Perkhidmatan Perkahwinan', 'wedding', 'favorite', 7 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Tent & Canopy', 'Khemah & Kanopi', 'tent-canopy', 'holiday_village', 8 FROM categories WHERE slug = 'events'
UNION ALL SELECT id, 'Sound System', 'Sistem Bunyi', 'sound-system', 'speaker', 9 FROM categories WHERE slug = 'events';

-- BUSINESS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Accounting', 'Perakaunan', 'accounting', 'calculate', 1 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'Legal Services', 'Perkhidmatan Guaman', 'legal', 'gavel', 2 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'Business Consulting', 'Perundingan Perniagaan', 'consulting', 'business_center', 3 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'Marketing', 'Pemasaran', 'marketing', 'campaign', 4 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'Translation', 'Penterjemahan', 'translation', 'translate', 5 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'Printing Services', 'Perkhidmatan Cetakan', 'printing', 'print', 6 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'Office Supplies', 'Bekalan Pejabat', 'office-supplies', 'inventory_2', 7 FROM categories WHERE slug = 'business'
UNION ALL SELECT id, 'HR Services', 'Perkhidmatan HR', 'hr-services', 'people', 8 FROM categories WHERE slug = 'business';

-- TECH subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Web Development', 'Pembangunan Web', 'web-dev', 'web', 1 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'App Development', 'Pembangunan Aplikasi', 'app-dev', 'phone_android', 2 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'Graphic Design', 'Reka Bentuk Grafik', 'graphic-design', 'palette', 3 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'IT Support', 'Sokongan IT', 'it-support', 'support_agent', 4 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'Social Media', 'Media Sosial', 'social-media', 'share', 5 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'Computer Repair', 'Pembaikan Komputer', 'computer-repair', 'computer', 6 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'Phone Repair', 'Pembaikan Telefon', 'phone-repair', 'phone_iphone', 7 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'Network Setup', 'Pemasangan Rangkaian', 'network', 'wifi', 8 FROM categories WHERE slug = 'tech'
UNION ALL SELECT id, 'Data Recovery', 'Pemulihan Data', 'data-recovery', 'restore', 9 FROM categories WHERE slug = 'tech';

-- PETS subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Pet Grooming', 'Dandanan Haiwan', 'pet-grooming', 'pets', 1 FROM categories WHERE slug = 'pets'
UNION ALL SELECT id, 'Pet Sitting', 'Penjagaan Haiwan', 'pet-sitting', 'house', 2 FROM categories WHERE slug = 'pets'
UNION ALL SELECT id, 'Pet Training', 'Latihan Haiwan', 'pet-training', 'school', 3 FROM categories WHERE slug = 'pets'
UNION ALL SELECT id, 'Veterinary', 'Veterinar', 'veterinary', 'medical_services', 4 FROM categories WHERE slug = 'pets'
UNION ALL SELECT id, 'Pet Transport', 'Pengangkutan Haiwan', 'pet-transport', 'local_shipping', 5 FROM categories WHERE slug = 'pets'
UNION ALL SELECT id, 'Pet Boarding', 'Penginapan Haiwan', 'pet-boarding', 'hotel', 6 FROM categories WHERE slug = 'pets'
UNION ALL SELECT id, 'Pet Food & Supplies', 'Makanan & Bekalan Haiwan', 'pet-supplies', 'shopping_bag', 7 FROM categories WHERE slug = 'pets';

-- LEARNING subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, icon, sort_order)
SELECT id, 'Tutoring', 'Tuisyen', 'tutoring', 'menu_book', 1 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Music Lessons', 'Kelas Muzik', 'music-lessons', 'music_note', 2 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Language Classes', 'Kelas Bahasa', 'language-classes', 'language', 3 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Driving School', 'Sekolah Memandu', 'driving-school', 'directions_car', 4 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Skills Workshop', 'Bengkel Kemahiran', 'skills-workshop', 'handyman', 5 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Art Classes', 'Kelas Seni', 'art-classes', 'brush', 6 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Sports Coaching', 'Bimbingan Sukan', 'sports-coaching', 'sports', 7 FROM categories WHERE slug = 'learning'
UNION ALL SELECT id, 'Quran Classes', 'Kelas Al-Quran', 'quran-classes', 'auto_stories', 8 FROM categories WHERE slug = 'learning';

-- Update category sort order
UPDATE categories SET sort_order = 1 WHERE slug = 'home';
UPDATE categories SET sort_order = 2 WHERE slug = 'transport';
UPDATE categories SET sort_order = 3 WHERE slug = 'personal-care';
UPDATE categories SET sort_order = 4 WHERE slug = 'events';
UPDATE categories SET sort_order = 5 WHERE slug = 'business';
UPDATE categories SET sort_order = 6 WHERE slug = 'tech';
UPDATE categories SET sort_order = 7 WHERE slug = 'pets';
UPDATE categories SET sort_order = 8 WHERE slug = 'learning';
