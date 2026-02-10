const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// All routes require contractor role
router.use(authMiddleware);
router.use(requireRole('contractor'));

// Helper: get contractor profile, auto-create if doesn't exist
async function getProfile(userId, userName) {
  let profile = await db.getRow('SELECT * FROM contractor_profiles WHERE user_id = $1', [userId]);
  
  // Auto-create profile if doesn't exist (auto-verified for MVP)
  if (!profile) {
    profile = await db.insertRow(
      `INSERT INTO contractor_profiles (user_id, business_name, verification_status, is_online)
       VALUES ($1, $2, 'verified', false) RETURNING *`,
      [userId, userName || 'My Business']
    );
  }
  
  return profile;
}

// GET /api/contractor/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id, req.user.full_name);
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
    const profile = await getProfile(req.user.id, req.user.full_name);
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
    const profile = await getProfile(req.user.id, req.user.full_name);
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
    const profile = await getProfile(req.user.id, req.user.full_name);
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
    const profile = await getProfile(req.user.id, req.user.full_name);
    await db.deleteRow('DELETE FROM contractor_services WHERE id = $1 AND contractor_id = $2 RETURNING *', [req.params.id, profile.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete service' });
  }
});

// CRUD /api/contractor/availability
router.get('/availability', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id, req.user.full_name);
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
    const profile = await getProfile(req.user.id, req.user.full_name);
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
    const profile = await getProfile(req.user.id, req.user.full_name);
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

// GET /api/contractor/nearby-requests — Nearby HELP! requests for bidding
router.get('/nearby-requests', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id, req.user.full_name);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const { lat, lng, radius = 25 } = req.query;
    
    // Use contractor's stored location if not provided
    const contractorLat = lat || profile.lat;
    const contractorLng = lng || profile.lng;
    
    if (!contractorLat || !contractorLng) {
      return res.status(422).json({ success: false, error: 'Location required. Update your location in profile settings.' });
    }

    const requests = await db.getRows(
      `SELECT b.*,
              sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms,
              c.name_en as category_name,
              u.full_name as user_name, u.avatar_url as user_avatar,
              (6371 * acos(cos(radians($1)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians($2)) + sin(radians($1)) * sin(radians(b.lat)))) as distance_km
       FROM bookings b
       LEFT JOIN subcategories sc ON sc.id = b.subcategory_id
       LEFT JOIN categories c ON c.id = sc.category_id
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.is_help_request = true
         AND b.status = 'pending'
         AND b.lat IS NOT NULL AND b.lng IS NOT NULL
         AND (6371 * acos(cos(radians($1)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians($2)) + sin(radians($1)) * sin(radians(b.lat)))) <= $3
       ORDER BY distance_km ASC
       LIMIT 50`,
      [contractorLat, contractorLng, radius]
    );

    // Check if contractor already bid on each request
    for (const request of requests) {
      const existingBid = await db.getRow(
        'SELECT id FROM booking_bids WHERE booking_id = $1 AND contractor_id = $2',
        [request.id, profile.id]
      );
      request.has_bid = !!existingBid;
    }

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching nearby requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nearby requests' });
  }
});

// GET /api/contractor/bookings — Contractor's bookings (alternative to /api/bookings)
router.get('/bookings', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id, req.user.full_name);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let conditions = ['b.contractor_id = $1'];
    let params = [profile.id];
    let idx = 2;

    if (status) {
      conditions.push(`b.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limitNum, offset);

    const bookings = await db.getRows(
      `SELECT b.*,
              cs.title as service_title, cs.base_price as service_price,
              sc.name_en as subcategory_name,
              u.full_name as user_name, u.avatar_url as user_avatar, u.phone as user_phone
       FROM bookings b
       LEFT JOIN contractor_services cs ON cs.id = b.service_id
       LEFT JOIN subcategories sc ON sc.id = b.subcategory_id
       LEFT JOIN users u ON u.id = b.user_id
       ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching contractor bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// GET /api/contractor/reviews — Contractor's reviews
router.get('/reviews', async (req, res) => {
  try {
    const profile = await getProfile(req.user.id, req.user.full_name);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const reviews = await db.getRows(
      `SELECT r.*, 
              u.full_name as customer_name, u.avatar_url as customer_photo,
              b.booking_number, cs.title as service_title
       FROM reviews r
       JOIN bookings b ON b.id = r.booking_id
       JOIN users u ON u.id = r.user_id
       LEFT JOIN contractor_services cs ON cs.id = b.service_id
       WHERE r.contractor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [profile.id, limitNum, offset]
    );

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// PUT /api/contractor/reviews/:id/reply — Reply to a review
router.put('/reviews/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(422).json({ success: false, error: 'reply is required' });

    const profile = await getProfile(req.user.id, req.user.full_name);
    
    const review = await db.updateRow(
      `UPDATE reviews SET contractor_reply = $1, replied_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND contractor_id = $3 RETURNING *`,
      [reply, req.params.id, profile.id]
    );

    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    res.json({ success: true, review });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ success: false, error: 'Failed to reply to review' });
  }
});

module.exports = router;
