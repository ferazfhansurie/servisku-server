-- Seed categories & subcategories
INSERT INTO categories (name_en, name_ms, slug, icon, color, sort_order) VALUES
  ('Home & Transport', 'Rumah & Pengangkutan', 'home-transport', 'home', '#4A90D9', 1),
  ('Personal Care & Wellness', 'Penjagaan Diri & Kesihatan', 'personal-care', 'heart', '#E91E63', 2),
  ('Events & Specialized', 'Acara & Khusus', 'events-specialized', 'star', '#FF9800', 3),
  ('Professional & B2B', 'Profesional & B2B', 'professional-b2b', 'briefcase', '#607D8B', 4),
  ('IT & Creative', 'IT & Kreatif', 'it-creative', 'code', '#9C27B0', 5),
  ('Pet', 'Haiwan Peliharaan', 'pet', 'paw', '#8BC34A', 6),
  ('Learning', 'Pembelajaran', 'learning', 'book', '#00BCD4', 7);

-- Home & Transport subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Plumbing', 'Paip & Saliran', 'plumbing', 1 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Electrical', 'Elektrik', 'electrical', 2 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Aircon Service', 'Servis Aircond', 'aircon', 3 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Cleaning', 'Pembersihan', 'cleaning', 4 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Renovation', 'Pengubahsuaian', 'renovation', 5 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Moving & Transport', 'Pindah & Pengangkutan', 'moving', 6 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Pest Control', 'Kawalan Serangga', 'pest-control', 7 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Painting', 'Cat Rumah', 'painting', 8 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Landscaping', 'Landskap', 'landscaping', 9 FROM categories WHERE slug = 'home-transport'
UNION ALL
SELECT id, 'Car Service', 'Servis Kereta', 'car-service', 10 FROM categories WHERE slug = 'home-transport';

-- Personal Care & Wellness subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Hair & Beauty', 'Rambut & Kecantikan', 'hair-beauty', 1 FROM categories WHERE slug = 'personal-care'
UNION ALL
SELECT id, 'Massage & Spa', 'Urutan & Spa', 'massage-spa', 2 FROM categories WHERE slug = 'personal-care'
UNION ALL
SELECT id, 'Personal Training', 'Jurulatih Peribadi', 'personal-training', 3 FROM categories WHERE slug = 'personal-care'
UNION ALL
SELECT id, 'Nutrition & Diet', 'Nutrisi & Diet', 'nutrition', 4 FROM categories WHERE slug = 'personal-care'
UNION ALL
SELECT id, 'Traditional Medicine', 'Perubatan Tradisional', 'traditional-medicine', 5 FROM categories WHERE slug = 'personal-care';

-- Events & Specialized subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Photography', 'Fotografi', 'photography', 1 FROM categories WHERE slug = 'events-specialized'
UNION ALL
SELECT id, 'Videography', 'Videografi', 'videography', 2 FROM categories WHERE slug = 'events-specialized'
UNION ALL
SELECT id, 'Catering', 'Katering', 'catering', 3 FROM categories WHERE slug = 'events-specialized'
UNION ALL
SELECT id, 'Event Planning', 'Perancangan Acara', 'event-planning', 4 FROM categories WHERE slug = 'events-specialized'
UNION ALL
SELECT id, 'DJ & Entertainment', 'DJ & Hiburan', 'dj-entertainment', 5 FROM categories WHERE slug = 'events-specialized';

-- Professional & B2B subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Accounting', 'Perakaunan', 'accounting', 1 FROM categories WHERE slug = 'professional-b2b'
UNION ALL
SELECT id, 'Legal', 'Perundangan', 'legal', 2 FROM categories WHERE slug = 'professional-b2b'
UNION ALL
SELECT id, 'Business Consulting', 'Perundingan Perniagaan', 'consulting', 3 FROM categories WHERE slug = 'professional-b2b'
UNION ALL
SELECT id, 'Marketing', 'Pemasaran', 'marketing', 4 FROM categories WHERE slug = 'professional-b2b'
UNION ALL
SELECT id, 'Translation', 'Penterjemahan', 'translation', 5 FROM categories WHERE slug = 'professional-b2b';

-- IT & Creative subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Web Development', 'Pembangunan Web', 'web-dev', 1 FROM categories WHERE slug = 'it-creative'
UNION ALL
SELECT id, 'App Development', 'Pembangunan Aplikasi', 'app-dev', 2 FROM categories WHERE slug = 'it-creative'
UNION ALL
SELECT id, 'Graphic Design', 'Reka Bentuk Grafik', 'graphic-design', 3 FROM categories WHERE slug = 'it-creative'
UNION ALL
SELECT id, 'IT Support', 'Sokongan IT', 'it-support', 4 FROM categories WHERE slug = 'it-creative'
UNION ALL
SELECT id, 'Social Media', 'Media Sosial', 'social-media', 5 FROM categories WHERE slug = 'it-creative';

-- Pet subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Pet Grooming', 'Dandanan Haiwan', 'pet-grooming', 1 FROM categories WHERE slug = 'pet'
UNION ALL
SELECT id, 'Pet Sitting', 'Penjagaan Haiwan', 'pet-sitting', 2 FROM categories WHERE slug = 'pet'
UNION ALL
SELECT id, 'Pet Training', 'Latihan Haiwan', 'pet-training', 3 FROM categories WHERE slug = 'pet'
UNION ALL
SELECT id, 'Veterinary', 'Veterinar', 'veterinary', 4 FROM categories WHERE slug = 'pet';

-- Learning subcategories
INSERT INTO subcategories (category_id, name_en, name_ms, slug, sort_order)
SELECT id, 'Tutoring', 'Tuisyen', 'tutoring', 1 FROM categories WHERE slug = 'learning'
UNION ALL
SELECT id, 'Music Lessons', 'Kelas Muzik', 'music-lessons', 2 FROM categories WHERE slug = 'learning'
UNION ALL
SELECT id, 'Language Classes', 'Kelas Bahasa', 'language-classes', 3 FROM categories WHERE slug = 'learning'
UNION ALL
SELECT id, 'Driving School', 'Sekolah Memandu', 'driving-school', 4 FROM categories WHERE slug = 'learning'
UNION ALL
SELECT id, 'Skills Workshop', 'Bengkel Kemahiran', 'skills-workshop', 5 FROM categories WHERE slug = 'learning';
