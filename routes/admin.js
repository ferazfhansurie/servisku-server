const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);
router.use(requireRole('admin', 'super_admin'));

// GET /api/admin/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [users, contractors, bookings, revenue, pendingVerifications, openDisputes] = await Promise.all([
      db.getRow('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      db.getRow("SELECT COUNT(*) as count FROM contractor_profiles WHERE verification_status = 'verified'"),
      db.getRow('SELECT COUNT(*) as count FROM bookings'),
      db.getRow("SELECT COALESCE(SUM(platform_fee), 0) as total FROM payments WHERE status IN ('captured', 'released')"),
      db.getRow("SELECT COUNT(*) as count FROM contractor_profiles WHERE verification_status = 'pending'"),
      db.getRow("SELECT COUNT(*) as count FROM disputes WHERE status = 'open'"),
    ]);

    // Recent bookings
    const recentBookings = await db.getRows(
      `SELECT b.*, u.full_name as user_name, cp.business_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN contractor_profiles cp ON cp.id = b.contractor_id
       ORDER BY b.created_at DESC LIMIT 10`
    );

    // Monthly stats
    const monthlyBookings = await db.getRows(
      `SELECT date_trunc('month', created_at)::date as month, COUNT(*) as count
       FROM bookings
       WHERE created_at >= NOW() - interval '12 months'
       GROUP BY month ORDER BY month`
    );

    res.json({
      success: true,
      dashboard: {
        total_users: parseInt(users.count),
        total_contractors: parseInt(contractors.count),
        total_bookings: parseInt(bookings.count),
        total_revenue: parseFloat(revenue.total),
        pending_verifications: parseInt(pendingVerifications.count),
        open_disputes: parseInt(openDisputes.count),
        recent_bookings: recentBookings,
        monthly_bookings: monthlyBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

// GET /api/admin/users — List users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 200);
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (role) {
      conditions.push(`role = $${idx}`);
      params.push(role);
      idx++;
    }

    if (search) {
      conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limitNum, offset);

    const users = await db.getRows(
      `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    const countResult = await db.getRow(`SELECT COUNT(*) as total FROM users ${whereClause}`, params.slice(0, -2));

    res.json({
      success: true,
      users,
      pagination: {
        page: pageNum, limit: limitNum,
        total: parseInt(countResult.total),
        total_pages: Math.ceil(parseInt(countResult.total) / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET /api/admin/contractors/pending — Pending verifications
router.get('/contractors/pending', async (req, res) => {
  try {
    const contractors = await db.getRows(
      `SELECT cp.*, u.full_name, u.email, u.phone, u.avatar_url,
              (SELECT json_agg(json_build_object('id', cd.id, 'type', cd.type, 'file_url', cd.file_url, 'status', cd.status))
               FROM contractor_documents cd WHERE cd.contractor_id = cp.id) as documents
       FROM contractor_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.verification_status = 'pending'
       ORDER BY cp.created_at ASC`
    );
    res.json({ success: true, contractors });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending contractors' });
  }
});

// PUT /api/admin/contractors/:id/verify — Approve or reject contractor
router.put('/contractors/:id/verify', async (req, res) => {
  try {
    const { status, reason } = req.body; // status: 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(422).json({ success: false, error: 'status must be verified or rejected' });
    }

    const profile = await db.updateRow(
      `UPDATE contractor_profiles SET verification_status = $1, verified_at = ${status === 'verified' ? 'NOW()' : 'NULL'}, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (!profile) return res.status(404).json({ success: false, error: 'Contractor not found' });

    // Notify contractor
    const title = status === 'verified' ? 'Account Verified!' : 'Verification Rejected';
    const body = status === 'verified' ? 'Your account has been verified. You can now receive bookings!' : `Your verification was rejected. Reason: ${reason || 'Please contact support.'}`;

    await db.insertRow(
      'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [profile.user_id, title, body, 'verification', JSON.stringify({ status })]
    );

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify contractor' });
  }
});

// GET /api/admin/bookings — All bookings
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 200);
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (status) { conditions.push(`b.status = $${idx}`); params.push(status); idx++; }
    if (search) { conditions.push(`b.booking_number ILIKE $${idx}`); params.push(`%${search}%`); idx++; }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limitNum, offset);

    const bookings = await db.getRows(
      `SELECT b.*, u.full_name as user_name, cp.business_name, cu.full_name as contractor_name
       FROM bookings b
       LEFT JOIN users u ON u.id = b.user_id
       LEFT JOIN contractor_profiles cp ON cp.id = b.contractor_id
       LEFT JOIN users cu ON cu.id = cp.user_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// GET /api/admin/disputes — All disputes
router.get('/disputes', async (req, res) => {
  try {
    const disputes = await db.getRows(
      `SELECT d.*, b.booking_number, u.full_name as raised_by_name
       FROM disputes d
       JOIN bookings b ON b.id = d.booking_id
       JOIN users u ON u.id = d.raised_by
       ORDER BY d.created_at DESC`
    );
    res.json({ success: true, disputes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch disputes' });
  }
});

// PUT /api/admin/disputes/:id/resolve
router.put('/disputes/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body;
    const dispute = await db.updateRow(
      `UPDATE disputes SET status = 'resolved', resolution = $1, resolved_by = $2, resolved_at = NOW()
       WHERE id = $3 RETURNING *`,
      [resolution, req.user.id, req.params.id]
    );
    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });
    res.json({ success: true, dispute });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to resolve dispute' });
  }
});

// CRUD /api/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const { name_en, name_ms, slug, icon, color, sort_order } = req.body;
    const category = await db.insertRow(
      'INSERT INTO categories (name_en, name_ms, slug, icon, color, sort_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name_en, name_ms, slug, icon || null, color || null, sort_order || 0]
    );
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name_en, name_ms, slug, icon, color, sort_order, is_active } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (name_en !== undefined) { fields.push(`name_en = $${idx++}`); values.push(name_en); }
    if (name_ms !== undefined) { fields.push(`name_ms = $${idx++}`); values.push(name_ms); }
    if (slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(slug); }
    if (icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(icon); }
    if (color !== undefined) { fields.push(`color = $${idx++}`); values.push(color); }
    if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sort_order); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) return res.status(422).json({ success: false, error: 'No fields to update' });
    values.push(req.params.id);

    const category = await db.updateRow(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

// CRUD /api/admin/promos
router.get('/promos', async (req, res) => {
  try {
    const promos = await db.getRows('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json({ success: true, promos });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch promos' });
  }
});

router.post('/promos', async (req, res) => {
  try {
    const { code, discount_type, discount_value, max_uses, min_order, valid_from, valid_until } = req.body;
    const promo = await db.insertRow(
      `INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, min_order, valid_from, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, max_uses || null, min_order || 0, valid_from || null, valid_until || null]
    );
    res.status(201).json({ success: true, promo });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create promo' });
  }
});

module.exports = router;
