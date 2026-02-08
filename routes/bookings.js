const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getIO } = require('../socket');

router.use(authMiddleware);

// Generate booking number: SRV-YYYYMMDD-XXXX
function generateBookingNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SRV-${date}-${rand}`;
}

// POST /api/bookings — Create standard booking
router.post('/', async (req, res) => {
  try {
    const {
      service_id, contractor_id, subcategory_id, description, images,
      scheduled_date, scheduled_time, address_id, lat, lng, user_notes,
    } = req.body;

    if (!service_id && !subcategory_id) {
      return res.status(422).json({ success: false, error: 'service_id or subcategory_id is required' });
    }

    // Get address snapshot if address_id provided
    let address_snapshot = null;
    if (address_id) {
      const addr = await db.getRow('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [address_id, req.user.id]);
      if (addr) address_snapshot = JSON.stringify(addr);
    }

    // Get service price
    let quoted_price = null;
    if (service_id) {
      const service = await db.getRow('SELECT base_price FROM contractor_services WHERE id = $1', [service_id]);
      if (service) quoted_price = service.base_price;
    }

    const booking = await db.insertRow(
      `INSERT INTO bookings (booking_number, user_id, contractor_id, service_id, subcategory_id,
        description, images, scheduled_date, scheduled_time, address_id, address_snapshot,
        lat, lng, quoted_price, user_notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
       RETURNING *`,
      [
        generateBookingNumber(), req.user.id, contractor_id || null, service_id || null,
        subcategory_id || null, description || null, JSON.stringify(images || []),
        scheduled_date || null, scheduled_time || null, address_id || null, address_snapshot,
        lat || null, lng || null, quoted_price, user_notes || null,
      ]
    );

    // Notify contractor via Socket.io
    if (contractor_id) {
      const io = getIO();
      // Get contractor user_id
      const cp = await db.getRow('SELECT user_id FROM contractor_profiles WHERE id = $1', [contractor_id]);
      if (cp) {
        io.to(`user:${cp.user_id}`).emit('booking:new', booking);
      }

      // Create notification
      await db.insertRow(
        `INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [cp.user_id, 'New Booking Request', `New booking ${booking.booking_number}`, 'booking_update', JSON.stringify({ booking_id: booking.id })]
      );
    }

    // Auto-create chat room
    if (contractor_id) {
      await db.insertRow(
        `INSERT INTO chat_rooms (booking_id, user_id, contractor_id) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING RETURNING *`,
        [booking.id, req.user.id, contractor_id]
      );
    }

    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// POST /api/bookings/help — Create HELP! quick-book (broadcast to nearby contractors)
router.post('/help', async (req, res) => {
  try {
    const { subcategory_id, description, images, lat, lng, address_id } = req.body;

    if (!description || !lat || !lng) {
      return res.status(422).json({ success: false, error: 'description, lat, and lng are required' });
    }

    let address_snapshot = null;
    if (address_id) {
      const addr = await db.getRow('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [address_id, req.user.id]);
      if (addr) address_snapshot = JSON.stringify(addr);
    }

    const booking = await db.insertRow(
      `INSERT INTO bookings (booking_number, user_id, subcategory_id, description, images,
        lat, lng, address_id, address_snapshot, is_help_request, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'pending')
       RETURNING *`,
      [
        generateBookingNumber(), req.user.id, subcategory_id || null,
        description, JSON.stringify(images || []),
        lat, lng, address_id || null, address_snapshot,
      ]
    );

    // Broadcast to nearby contractors via Socket.io
    const io = getIO();
    const radius = 25; // km

    // Find nearby verified online contractors
    const nearbyContractors = await db.getRows(
      `SELECT cp.id, cp.user_id FROM contractor_profiles cp
       WHERE cp.verification_status = 'verified'
         AND cp.is_online = true
         AND cp.lat IS NOT NULL AND cp.lng IS NOT NULL
         AND (6371 * acos(cos(radians($1)) * cos(radians(cp.lat)) * cos(radians(cp.lng) - radians($2)) + sin(radians($1)) * sin(radians(cp.lat)))) <= $3`,
      [lat, lng, radius]
    );

    // Optionally filter by subcategory
    for (const contractor of nearbyContractors) {
      io.to(`user:${contractor.user_id}`).emit('booking:help_broadcast', booking);
      await db.insertRow(
        `INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [contractor.user_id, 'HELP! Request Nearby', description.substring(0, 100), 'help_request', JSON.stringify({ booking_id: booking.id })]
      );
    }

    res.status(201).json({ success: true, booking, contractors_notified: nearbyContractors.length });
  } catch (error) {
    console.error('Error creating help request:', error);
    res.status(500).json({ success: false, error: 'Failed to create help request' });
  }
});

// GET /api/bookings — List my bookings
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];
    let idx = 1;

    // Filter by role
    if (req.user.role === 'contractor') {
      const profile = await db.getRow('SELECT id FROM contractor_profiles WHERE user_id = $1', [req.user.id]);
      if (!profile) return res.json({ success: true, bookings: [], pagination: { page: 1, limit: limitNum, total: 0, total_pages: 0 } });
      conditions.push(`b.contractor_id = $${idx}`);
      params.push(profile.id);
      idx++;
    } else {
      conditions.push(`b.user_id = $${idx}`);
      params.push(req.user.id);
      idx++;
    }

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
              u.full_name as user_name, u.avatar_url as user_avatar,
              cu.full_name as contractor_name, cu.avatar_url as contractor_avatar,
              cp.business_name
       FROM bookings b
       LEFT JOIN contractor_services cs ON cs.id = b.service_id
       LEFT JOIN subcategories sc ON sc.id = b.subcategory_id
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
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:id — Booking detail
router.get('/:id', async (req, res) => {
  try {
    const booking = await db.getRow(
      `SELECT b.*,
              cs.title as service_title, cs.base_price as service_price, cs.images as service_images,
              sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms,
              c.name_en as category_name,
              u.full_name as user_name, u.avatar_url as user_avatar, u.phone as user_phone,
              cu.full_name as contractor_name, cu.avatar_url as contractor_avatar, cu.phone as contractor_phone,
              cp.business_name, cp.avg_rating, cp.lat as contractor_lat, cp.lng as contractor_lng
       FROM bookings b
       LEFT JOIN contractor_services cs ON cs.id = b.service_id
       LEFT JOIN subcategories sc ON sc.id = b.subcategory_id
       LEFT JOIN categories c ON c.id = sc.category_id
       LEFT JOIN users u ON u.id = b.user_id
       LEFT JOIN contractor_profiles cp ON cp.id = b.contractor_id
       LEFT JOIN users cu ON cu.id = cp.user_id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    // Get bids if HELP! request
    let bids = [];
    if (booking.is_help_request) {
      bids = await db.getRows(
        `SELECT bb.*, cp.business_name, cp.avg_rating, cp.total_reviews,
                u.full_name as contractor_name, u.avatar_url as contractor_avatar
         FROM booking_bids bb
         JOIN contractor_profiles cp ON cp.id = bb.contractor_id
         JOIN users u ON u.id = cp.user_id
         WHERE bb.booking_id = $1
         ORDER BY bb.created_at ASC`,
        [req.params.id]
      );
    }

    // Get review if exists
    const review = await db.getRow('SELECT * FROM reviews WHERE booking_id = $1', [req.params.id]);

    // Get chat room
    const chatRoom = await db.getRow('SELECT id FROM chat_rooms WHERE booking_id = $1', [req.params.id]);

    res.json({ success: true, booking: { ...booking, bids, review, chat_room_id: chatRoom?.id } });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:id/accept — Contractor accepts
router.put('/:id/accept', async (req, res) => {
  try {
    const { quoted_price } = req.body;
    const booking = await db.updateRow(
      `UPDATE bookings SET status = 'accepted', quoted_price = COALESCE($2, quoted_price), updated_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING *`,
      [req.params.id, quoted_price || null]
    );

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or not pending' });

    // Notify user
    const io = getIO();
    io.to(`user:${booking.user_id}`).emit('booking:accepted', booking);
    await db.insertRow(
      'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [booking.user_id, 'Booking Accepted', `Your booking ${booking.booking_number} has been accepted`, 'booking_update', JSON.stringify({ booking_id: booking.id })]
    );

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to accept booking' });
  }
});

// PUT /api/bookings/:id/reject — Contractor rejects
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await db.updateRow(
      `UPDATE bookings SET status = 'rejected', contractor_notes = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING *`,
      [req.params.id, reason || null]
    );

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or not pending' });

    const io = getIO();
    io.to(`user:${booking.user_id}`).emit('booking:rejected', booking);

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject booking' });
  }
});

// PUT /api/bookings/:id/start — Contractor starts work
router.put('/:id/start', async (req, res) => {
  try {
    const booking = await db.updateRow(
      `UPDATE bookings SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'accepted' RETURNING *`,
      [req.params.id]
    );

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or not accepted' });

    const io = getIO();
    io.to(`user:${booking.user_id}`).emit('booking:started', booking);

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start booking' });
  }
});

// PUT /api/bookings/:id/complete — Contractor marks complete
router.put('/:id/complete', async (req, res) => {
  try {
    const { final_price, contractor_notes } = req.body;
    const booking = await db.updateRow(
      `UPDATE bookings SET status = 'completed', completed_at = NOW(),
        final_price = COALESCE($2, quoted_price), contractor_notes = COALESCE($3, contractor_notes), updated_at = NOW()
       WHERE id = $1 AND status = 'in_progress' RETURNING *`,
      [req.params.id, final_price || null, contractor_notes || null]
    );

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or not in progress' });

    const io = getIO();
    io.to(`user:${booking.user_id}`).emit('booking:completed', booking);
    await db.insertRow(
      'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [booking.user_id, 'Booking Completed', `Your booking ${booking.booking_number} is complete. Please leave a review!`, 'booking_update', JSON.stringify({ booking_id: booking.id })]
    );

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to complete booking' });
  }
});

// PUT /api/bookings/:id/cancel — Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await db.updateRow(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $2,
        cancellation_reason = $3, updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'accepted') RETURNING *`,
      [req.params.id, req.user.id, reason || null]
    );

    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or cannot be cancelled' });

    const io = getIO();
    // Notify the other party
    const notifyUserId = req.user.id === booking.user_id ? null : booking.user_id;
    if (notifyUserId) {
      io.to(`user:${notifyUserId}`).emit('booking:cancelled', booking);
    }
    if (booking.contractor_id) {
      const cp = await db.getRow('SELECT user_id FROM contractor_profiles WHERE id = $1', [booking.contractor_id]);
      if (cp && cp.user_id !== req.user.id) {
        io.to(`user:${cp.user_id}`).emit('booking:cancelled', booking);
      }
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
});

// POST /api/bookings/:id/bid — Contractor bids on HELP! request
router.post('/:id/bid', async (req, res) => {
  try {
    const { price, message, eta_minutes } = req.body;

    if (!price) return res.status(422).json({ success: false, error: 'price is required' });

    const profile = await db.getRow('SELECT * FROM contractor_profiles WHERE user_id = $1', [req.user.id]);
    if (!profile) return res.status(403).json({ success: false, error: 'Contractor profile required' });

    const booking = await db.getRow('SELECT * FROM bookings WHERE id = $1 AND is_help_request = true AND status = $2', [req.params.id, 'pending']);
    if (!booking) return res.status(404).json({ success: false, error: 'Help request not found or no longer pending' });

    const bid = await db.insertRow(
      `INSERT INTO booking_bids (booking_id, contractor_id, price, message, eta_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, profile.id, price, message || null, eta_minutes || null]
    );

    // Notify user about new bid
    const io = getIO();
    io.to(`user:${booking.user_id}`).emit('booking:bid_received', {
      ...bid,
      contractor_name: req.user.full_name,
      business_name: profile.business_name,
      avg_rating: profile.avg_rating,
    });

    res.status(201).json({ success: true, bid });
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ success: false, error: 'Failed to create bid' });
  }
});

// PUT /api/bookings/:id/bids/:bidId/accept — User accepts a bid
router.put('/:id/bids/:bidId/accept', async (req, res) => {
  try {
    const bid = await db.getRow('SELECT * FROM booking_bids WHERE id = $1 AND booking_id = $2', [req.params.bidId, req.params.id]);
    if (!bid) return res.status(404).json({ success: false, error: 'Bid not found' });

    // Accept this bid, reject others
    await db.updateRow("UPDATE booking_bids SET status = 'accepted' WHERE id = $1 RETURNING *", [bid.id]);
    await db.query("UPDATE booking_bids SET status = 'rejected' WHERE booking_id = $1 AND id != $2", [req.params.id, bid.id]);

    // Update booking with contractor and price
    const booking = await db.updateRow(
      `UPDATE bookings SET contractor_id = $2, quoted_price = $3, status = 'accepted', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id, bid.contractor_id, bid.price]
    );

    // Create chat room
    await db.insertRow(
      `INSERT INTO chat_rooms (booking_id, user_id, contractor_id) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING RETURNING *`,
      [booking.id, booking.user_id, bid.contractor_id]
    );

    // Notify contractor
    const io = getIO();
    const cp = await db.getRow('SELECT user_id FROM contractor_profiles WHERE id = $1', [bid.contractor_id]);
    if (cp) {
      io.to(`user:${cp.user_id}`).emit('booking:accepted', booking);
      await db.insertRow(
        'INSERT INTO notifications (user_id, title, body, type, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [cp.user_id, 'Bid Accepted!', `Your bid for ${booking.booking_number} was accepted`, 'booking_update', JSON.stringify({ booking_id: booking.id })]
      );
    }

    res.json({ success: true, booking, bid });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ success: false, error: 'Failed to accept bid' });
  }
});

// GET /api/bookings/:id/bids — List bids for a booking
router.get('/:id/bids', async (req, res) => {
  try {
    const bids = await db.getRows(
      `SELECT bb.*, cp.business_name, cp.avg_rating, cp.total_reviews,
              u.full_name as contractor_name, u.avatar_url as contractor_avatar
       FROM booking_bids bb
       JOIN contractor_profiles cp ON cp.id = bb.contractor_id
       JOIN users u ON u.id = cp.user_id
       WHERE bb.booking_id = $1
       ORDER BY bb.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, bids });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bids' });
  }
});

module.exports = router;
