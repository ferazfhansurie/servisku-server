-- Bookings & Bids
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  contractor_id UUID REFERENCES contractor_profiles(id),
  service_id UUID REFERENCES contractor_services(id),
  subcategory_id UUID REFERENCES subcategories(id),
  status VARCHAR(20) DEFAULT 'pending',
  is_help_request BOOLEAN DEFAULT false,
  description TEXT,
  images JSONB DEFAULT '[]',
  scheduled_date DATE,
  scheduled_time TIME,
  address_id UUID REFERENCES addresses(id),
  address_snapshot JSONB,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  contractor_notes TEXT,
  user_notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE booking_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractor_profiles(id),
  price DECIMAL(10,2) NOT NULL,
  message TEXT,
  eta_minutes INT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_contractor ON bookings(contractor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_help ON bookings(is_help_request) WHERE is_help_request = true;
CREATE INDEX idx_bookings_number ON bookings(booking_number);
CREATE INDEX idx_booking_bids_booking ON booking_bids(booking_id);
CREATE INDEX idx_booking_bids_contractor ON booking_bids(contractor_id);
