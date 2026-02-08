const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/reviews — Submit review
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { booking_id, rating, comment, images } = req.body;

    if (!booking_id || !rating) {
      return res.status(422).json({ success: false, error: 'booking_id and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(422).json({ success: false, error: 'rating must be between 1 and 5' });
    }

    // Verify booking belongs to user and is completed
    const booking = await db.getRow(
      "SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'completed'",
      [booking_id, req.user.id]
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Completed booking not found' });
    }

    // Check if already reviewed
    const existing = await db.getRow('SELECT id FROM reviews WHERE booking_id = $1', [booking_id]);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Already reviewed' });
    }

    const review = await db.insertRow(
      `INSERT INTO reviews (booking_id, user_id, contractor_id, rating, comment, images)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [booking_id, req.user.id, booking.contractor_id, rating, comment || null, JSON.stringify(images || [])]
    );

    // Update contractor rating
    const ratingResult = await db.getRow(
      'SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total FROM reviews WHERE contractor_id = $1',
      [booking.contractor_id]
    );

    await db.updateRow(
      'UPDATE contractor_profiles SET avg_rating = $1, total_reviews = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [ratingResult.avg_rating, parseInt(ratingResult.total), booking.contractor_id]
    );

    // Update booking status to reviewed
    await db.updateRow("UPDATE bookings SET status = 'reviewed', updated_at = NOW() WHERE id = $1 RETURNING *", [booking_id]);

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

// POST /api/reviews/:id/reply — Contractor replies
router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.status(422).json({ success: false, error: 'reply is required' });

    const profile = await db.getRow('SELECT id FROM contractor_profiles WHERE user_id = $1', [req.user.id]);
    if (!profile) return res.status(403).json({ success: false, error: 'Contractor profile required' });

    const review = await db.updateRow(
      'UPDATE reviews SET contractor_reply = $1 WHERE id = $2 AND contractor_id = $3 RETURNING *',
      [reply, req.params.id, profile.id]
    );

    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reply to review' });
  }
});

module.exports = router;
