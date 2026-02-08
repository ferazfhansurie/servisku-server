-- Contractor Profiles, Documents, Services, Availability
CREATE TABLE contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255),
  description TEXT,
  ic_number VARCHAR(20),
  ssm_number VARCHAR(20),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  total_jobs_completed INT DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  service_radius_km INT DEFAULT 25,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contractor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contractor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'fixed',
  images JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contractor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true
);

CREATE INDEX idx_contractor_profiles_user ON contractor_profiles(user_id);
CREATE INDEX idx_contractor_profiles_status ON contractor_profiles(verification_status);
CREATE INDEX idx_contractor_profiles_location ON contractor_profiles(lat, lng);
CREATE INDEX idx_contractor_services_contractor ON contractor_services(contractor_id);
CREATE INDEX idx_contractor_services_subcategory ON contractor_services(subcategory_id);
