const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes require contractor role
router.use(authMiddleware);
router.use(requireRole('contractor'));

// Helper: get contractor profile
async function getProfile(userId) {
  return db.getRow('SELECT * FROM contractor_profiles WHERE user_id = $1', [userId]);
}

// GET /api/contractor/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const today = new Date().toISOString().split('T')[0];

    const [todayBookings, activeBookings, monthEarnings, pendingRequests] = await Promise.all([
      db.getRow(
        `SELECT COUNT(*) as count FROM bookings WHERE contractor_id = $1 AND scheduled_date = $2 AND status NOT IN ('cancelled', 'rejected')`,
        [profile.id, today]
      ),
      db.getRow(
        `SELECT COUNT(*) as count FROM bookings WHERE contractor_id = $1 AND status IN ('accepted', 'in_progress')`,
        [profile.id]
      ),
      db.getRow(
        `SELECT COALESCE(SUM(contractor_payout), 0) as total FROM payments WHERE contractor_id = $1 AND status = 'released' AND paid_at >= date_trunc('month', CURRENT_DATE)`,
        [profile.id]
      ),
      db.getRow(
        `SELECT COUNT(*) as count FROM bookings WHERE contractor_id = $1 AND status = 'pending'`,
        [profile.id]
      ),
    ]);

    res.json({
      success: true,
      dashboard: {
        profile,
        today_bookings: parseInt(todayBookings.count),
        active_bookings: parseInt(activeBookings.count),
        month_earnings: parseFloat(monthEarnings.total),
        pending_requests: parseInt(pendingRequests.count),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

// CRUD /api/contractor/services
router.get('/services', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    const services = await db.getRows(
      `SELECT cs.*, sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms
       FROM contractor_services cs
       LEFT JOIN subcategories sc ON sc.id = cs.subcategory_id
       WHERE cs.contractor_id = $1 ORDER BY cs.created_at DESC`,
      [profile.id]
    );
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

router.post('/services', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    const { subcategory_id, title, description, base_price, price_type, images } = req.body;

    if (!title || !base_price || !subcategory_id) {
      return res.status(422).json({ success: false, error: 'title, base_price, and subcategory_id are required' });
    }

    const service = await db.insertRow(
      `INSERT INTO contractor_services (contractor_id, subcategory_id, title, description, base_price, price_type, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [profile.id, subcategory_id, title, description || null, base_price, price_type || 'fixed', JSON.stringify(images || [])]
    );

    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    const { title, description, base_price, price_type, images, is_active, subcategory_id } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (base_price !== undefined) { fields.push(`base_price = $${idx++}`); values.push(base_price); }
    if (price_type !== undefined) { fields.push(`price_type = $${idx++}`); values.push(price_type); }
    if (images !== undefined) { fields.push(`images = $${idx++}`); values.push(JSON.stringify(images)); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }
    if (subcategory_id !== undefined) { fields.push(`subcategory_id = $${idx++}`); values.push(subcategory_id); }

    if (fields.length === 0) return res.status(422).json({ success: false, error: 'No fields to update' });

    fields.push('updated_at = NOW()');
    values.push(req.params.id, profile.id);

    const service = await db.updateRow(
      `UPDATE contractor_services SET ${fields.join(', ')} WHERE id = $${idx} AND contractor_id = $${idx + 1} RETURNING *`,
      values
    );

    if (!service) return res.status(404).json({ success: false, error: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update service' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    await db.deleteRow('DELETE FROM contractor_services WHERE id = $1 AND contractor_id = $2 RETURNING *', [req.params.id, profile.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete service' });
  }
});

// CRUD /api/contractor/availability
router.get('/availability', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    const availability = await db.getRows(
      'SELECT * FROM contractor_availability WHERE contractor_id = $1 ORDER BY day_of_week, start_time',
      [profile.id]
    );
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch availability' });
  }
});

router.put('/availability', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    const { slots } = req.body; // Array of { day_of_week, start_time, end_time, is_available }

    // Delete existing and re-insert
    await db.query('DELETE FROM contractor_availability WHERE contractor_id = $1', [profile.id]);

    for (const slot of slots) {
      await db.insertRow(
        'INSERT INTO contractor_availability (contractor_id, day_of_week, start_time, end_time, is_available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [profile.id, slot.day_of_week, slot.start_time, slot.end_time, slot.is_available !== false]
      );
    }

    const availability = await db.getRows(
      'SELECT * FROM contractor_availability WHERE contractor_id = $1 ORDER BY day_of_week',
      [profile.id]
    );
    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update availability' });
  }
});

// PUT /api/contractor/online-status — Toggle online/offline
router.put('/online-status', async (req, res) => {
  try {
    const { is_online } = req.body;
    const profile = await db.updateRow(
      'UPDATE contractor_profiles SET is_online = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [is_online, req.user.id]
    );

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) io.emit('contractor:status', { contractorId: profile.id, online: is_online });

    res.json({ success: true, is_online: profile.is_online });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// PUT /api/contractor/location — Update live location
router.put('/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await db.updateRow(
      'UPDATE contractor_profiles SET lat = $1, lng = $2, updated_at = NOW() WHERE user_id = $3 RETURNING *',
      [lat, lng, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
});

// GET /api/contractor/earnings — Earnings summary
router.get('/earnings', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);
    const { period = 'month' } = req.query;

    let dateFilter = "date_trunc('month', CURRENT_DATE)";
    if (period === 'week') dateFilter = "date_trunc('week', CURRENT_DATE)";
    if (period === 'year') dateFilter = "date_trunc('year', CURRENT_DATE)";
    if (period === 'all') dateFilter = "'1970-01-01'::timestamptz";

    const earnings = await db.getRow(
      `SELECT
         COALESCE(SUM(contractor_payout), 0) as total_earnings,
         COALESCE(SUM(CASE WHEN status = 'released' THEN contractor_payout ELSE 0 END), 0) as released,
         COALESCE(SUM(CASE WHEN status = 'captured' THEN contractor_payout ELSE 0 END), 0) as pending,
         COUNT(*) as total_payments
       FROM payments
       WHERE contractor_id = $1 AND created_at >= ${dateFilter}`,
      [profile.id]
    );

    const recentPayments = await db.getRows(
      `SELECT p.*, b.booking_number, b.description as booking_description
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE p.contractor_id = $1 AND p.status IN ('released', 'captured')
       ORDER BY p.created_at DESC LIMIT 20`,
      [profile.id]
    );

    res.json({ success: true, earnings, recent_payments: recentPayments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch earnings' });
  }
});

module.exports = router;
