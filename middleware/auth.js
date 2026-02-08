const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');

// Simple token-based authentication using secure random tokens
// Tokens are stored in the database and validated on each request

// Verify token and attach user to request
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Look up token in database
    const session = await db.getRow(
      `SELECT s.*, u.* FROM user_sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = $1 AND s.expires_at > NOW() AND u.is_active = true`,
      [token]
    );

    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Remove session fields from user object
    const { token: _, expires_at, user_id, ...user } = session;
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Generate a secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Compare password
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Role-based access control
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, generateToken, hashPassword, comparePassword };
