-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES users(id),
  contractor_id UUID REFERENCES contractor_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  contractor_payout DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'MYR',
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_contractor ON payments(contractor_id);
CREATE INDEX idx_payments_status ON payments(status);
