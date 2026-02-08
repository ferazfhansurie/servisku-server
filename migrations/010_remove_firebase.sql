-- Remove Firebase dependency and add password-based auth

-- Add password_hash column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make firebase_uid nullable (for backward compatibility during migration)
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;

-- Create sessions table for token-based auth
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Clean up expired sessions (can be run periodically)
-- DELETE FROM user_sessions WHERE expires_at < NOW();
