const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/contractors/:id — Contractor public profile
router.get('/:id', async (req, res) => {
  try {
    const contractor = await db.getRow(
      `SELECT cp.*, u.full_name, u.avatar_url, u.email, u.phone
       FROM contractor_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.id = $1 AND cp.verification_status = 'verified'`,
      [req.params.id]
    );

    if (!contractor) {
      return res.status(404).json({ success: false, error: 'Contractor not found' });
    }

    // Get services
    const services = await db.getRows(
      `SELECT cs.*, sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms
       FROM contractor_services cs
       JOIN subcategories sc ON sc.id = cs.subcategory_id
       WHERE cs.contractor_id = $1 AND cs.is_active = true
       ORDER BY cs.created_at DESC`,
      [req.params.id]
    );

    // Get availability
    const availability = await db.getRows(
      'SELECT * FROM contractor_availability WHERE contractor_id = $1 ORDER BY day_of_week',
      [req.params.id]
    );

    res.json({ success: true, contractor: { ...contractor, services, availability } });
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contractor' });
  }
});

// GET /api/contractors/:id/reviews — Contractor reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const reviews = await db.getRows(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.contractor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limitNum, offset]
    );

    const countResult = await db.getRow(
      'SELECT COUNT(*) as total FROM reviews WHERE contractor_id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.total),
        total_pages: Math.ceil(parseInt(countResult.total) / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// POST /api/contractors/:id/favorite — Toggle favorite
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const existing = await db.getRow(
      'SELECT id FROM favorites WHERE user_id = $1 AND contractor_id = $2',
      [req.user.id, req.params.id]
    );

    if (existing) {
      await db.deleteRow('DELETE FROM favorites WHERE id = $1 RETURNING *', [existing.id]);
      res.json({ success: true, favorited: false });
    } else {
      await db.insertRow(
        'INSERT INTO favorites (user_id, contractor_id) VALUES ($1, $2) RETURNING *',
        [req.user.id, req.params.id]
      );
      res.json({ success: true, favorited: true });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle favorite' });
  }
});

// GET /api/contractors/favorites/list — Get user's favorites
router.get('/favorites/list', authMiddleware, async (req, res) => {
  try {
    const favorites = await db.getRows(
      `SELECT cp.*, u.full_name, u.avatar_url, f.created_at as favorited_at
       FROM favorites f
       JOIN contractor_profiles cp ON cp.id = f.contractor_id
       JOIN users u ON u.id = cp.user_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' });
  }
});

module.exports = router;
