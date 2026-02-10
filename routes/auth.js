const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, generateToken, hashPassword, comparePassword } = require('../middleware/auth');

// POST /api/auth/register — Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, phone, full_name, role = 'user', preferred_language = 'en', business_name, lat, lng } = req.body;

    if (!email || !password || !full_name) {
      return res.status(422).json({ success: false, error: 'email, password, and full_name are required' });
    }

    if (password.length < 6) {
      return res.status(422).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Check existing
    const existing = await db.getRow('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    const user = await db.insertRow(
      `INSERT INTO users (email, password_hash, phone, full_name, role, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, phone, full_name, role, preferred_language, avatar_url, is_active, created_at, updated_at`,
      [email, password_hash, phone || null, full_name, role === 'contractor' ? 'contractor' : 'user', preferred_language]
    );

    // If contractor, create contractor profile with location
    if (role === 'contractor') {
      await db.insertRow(
        `INSERT INTO contractor_profiles (user_id, business_name, verification_status, is_online, lat, lng)
         VALUES ($1, $2, 'verified', false, $3, $4)`,
        [user.id, business_name || full_name, lat || null, lng || null]
      );
    }

    // Create session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.insertRow(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    res.status(201).json({ success: true, user, token });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    res.status(500).json({ success: false, error: 'Failed to register user' });
  }
});

// POST /api/auth/login — Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ success: false, error: 'email and password are required' });
    }

    const user = await db.getRow('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Create session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.insertRow(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ success: true, user: userWithoutPassword, token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
});

// POST /api/auth/logout — Logout user
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split('Bearer ')[1];
    await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ success: false, error: 'Failed to logout' });
  }
});

// POST /api/auth/register-contractor — Register as contractor
router.post('/register-contractor', authMiddleware, async (req, res) => {
  try {
    const { business_name, description, ic_number, ssm_number, lat, lng, service_radius_km } = req.body;

    if (!business_name || !ic_number) {
      return res.status(422).json({ success: false, error: 'business_name and ic_number are required' });
    }

    // Update user role
    await db.updateRow('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *', ['contractor', req.user.id]);

    // Create contractor profile
    const profile = await db.insertRow(
      `INSERT INTO contractor_profiles (user_id, business_name, description, ic_number, ssm_number, lat, lng, service_radius_km)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         business_name = EXCLUDED.business_name,
         description = EXCLUDED.description,
         ic_number = EXCLUDED.ic_number,
         ssm_number = EXCLUDED.ssm_number,
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng,
         service_radius_km = EXCLUDED.service_radius_km,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, business_name, description || null, ic_number, ssm_number || null, lat || null, lng || null, service_radius_km || 25]
    );

    res.status(201).json({ success: true, profile });
  } catch (error) {
    console.error('Error registering contractor:', error);
    res.status(500).json({ success: false, error: 'Failed to register contractor' });
  }
});

// GET /api/auth/me — Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    // If contractor, also fetch profile
    let contractor_profile = null;
    if (user.role === 'contractor') {
      contractor_profile = await db.getRow(
        'SELECT * FROM contractor_profiles WHERE user_id = $1',
        [user.id]
      );
    }

    // Fetch addresses
    const addresses = await db.getRows(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [user.id]
    );

    res.json({ success: true, user: { ...user, contractor_profile, addresses } });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/me — Update profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { full_name, phone, avatar_url, preferred_language } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(avatar_url); }
    if (preferred_language !== undefined) { fields.push(`preferred_language = $${idx++}`); values.push(preferred_language); }

    if (fields.length === 0) {
      return res.status(422).json({ success: false, error: 'No fields to update' });
    }

    fields.push('updated_at = NOW()');
    values.push(req.user.id);

    const user = await db.updateRow(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// DELETE /api/auth/me — Deactivate account
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    await db.updateRow('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *', [req.user.id]);
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    console.error('Error deactivating account:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate account' });
  }
});

// POST /api/auth/addresses — Add address
router.post('/addresses', authMiddleware, async (req, res) => {
  try {
    const { label, address_line, city, state, postcode, lat, lng, is_default } = req.body;

    if (!address_line) {
      return res.status(422).json({ success: false, error: 'address_line is required' });
    }

    // If setting as default, unset others
    if (is_default) {
      await db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const address = await db.insertRow(
      `INSERT INTO addresses (user_id, label, address_line, city, state, postcode, lat, lng, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, label || null, address_line, city || null, state || null, postcode || null, lat || null, lng || null, is_default || false]
    );

    res.status(201).json({ success: true, address });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, error: 'Failed to add address' });
  }
});

// GET /api/auth/addresses — List addresses
router.get('/addresses', authMiddleware, async (req, res) => {
  try {
    const addresses = await db.getRows(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch addresses' });
  }
});

// DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', authMiddleware, async (req, res) => {
  try {
    await db.deleteRow('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
});

module.exports = router;
