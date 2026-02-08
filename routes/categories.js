const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories — List all categories with subcategories
router.get('/', async (req, res) => {
  try {
    const categories = await db.getRows(
      `SELECT c.*,
        COALESCE(json_agg(
          json_build_object(
            'id', s.id, 'name_en', s.name_en, 'name_ms', s.name_ms,
            'slug', s.slug, 'icon', s.icon, 'sort_order', s.sort_order
          ) ORDER BY s.sort_order
        ) FILTER (WHERE s.id IS NOT NULL), '[]') as subcategories
       FROM categories c
       LEFT JOIN subcategories s ON s.category_id = c.id AND s.is_active = true
       WHERE c.is_active = true
       GROUP BY c.id
       ORDER BY c.sort_order`
    );

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:slug — Get category with subcategories
router.get('/:slug', async (req, res) => {
  try {
    const category = await db.getRow(
      'SELECT * FROM categories WHERE slug = $1 AND is_active = true',
      [req.params.slug]
    );

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const subcategories = await db.getRows(
      'SELECT * FROM subcategories WHERE category_id = $1 AND is_active = true ORDER BY sort_order',
      [category.id]
    );

    res.json({ success: true, category: { ...category, subcategories } });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
});

// GET /api/categories/:slug/services — List services in category
router.get('/:slug/services', async (req, res) => {
  try {
    const { page = 1, limit = 20, lat, lng } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const category = await db.getRow('SELECT id FROM categories WHERE slug = $1', [req.params.slug]);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    let distanceSelect = '';
    let distanceOrder = 'cs.created_at DESC';
    const params = [category.id, limitNum, offset];

    if (lat && lng) {
      distanceSelect = `, (6371 * acos(cos(radians($4)) * cos(radians(cp.lat)) * cos(radians(cp.lng) - radians($5)) + sin(radians($4)) * sin(radians(cp.lat)))) AS distance`;
      distanceOrder = 'distance ASC';
      params.push(parseFloat(lat), parseFloat(lng));
    }

    const services = await db.getRows(
      `SELECT cs.*, sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms,
              cp.business_name, cp.avg_rating, cp.total_reviews, cp.is_online,
              u.full_name as contractor_name, u.avatar_url as contractor_avatar
              ${distanceSelect}
       FROM contractor_services cs
       JOIN subcategories sc ON sc.id = cs.subcategory_id
       JOIN contractor_profiles cp ON cp.id = cs.contractor_id
       JOIN users u ON u.id = cp.user_id
       WHERE sc.category_id = $1
         AND cs.is_active = true
         AND cp.verification_status = 'verified'
       ORDER BY ${distanceOrder}
       LIMIT $2 OFFSET $3`,
      params
    );

    const countResult = await db.getRow(
      `SELECT COUNT(*) as total
       FROM contractor_services cs
       JOIN subcategories sc ON sc.id = cs.subcategory_id
       JOIN contractor_profiles cp ON cp.id = cs.contractor_id
       WHERE sc.category_id = $1 AND cs.is_active = true AND cp.verification_status = 'verified'`,
      [category.id]
    );

    res.json({
      success: true,
      services,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.total),
        total_pages: Math.ceil(parseInt(countResult.total) / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching category services:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

module.exports = router;
