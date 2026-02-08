const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to check if a string is a valid UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/services/search — Search services
router.get('/search', async (req, res) => {
  try {
    const { q, category_id, category_slug, subcategory_id, lat, lng, radius = 25, page = 1, limit = 20, price_min, price_max } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let conditions = ['cs.is_active = true', "cp.verification_status = 'verified'"];
    let params = [];
    let idx = 1;

    if (q) {
      conditions.push(`(cs.title ILIKE $${idx} OR cs.description ILIKE $${idx} OR sc.name_en ILIKE $${idx} OR sc.name_ms ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    // Handle category filtering - support both UUID and slug
    if (category_id) {
      if (isUUID(category_id)) {
        conditions.push(`sc.category_id = $${idx}`);
        params.push(category_id);
      } else {
        // Treat as slug
        conditions.push(`c.slug = $${idx}`);
        params.push(category_id);
      }
      idx++;
    } else if (category_slug) {
      conditions.push(`c.slug = $${idx}`);
      params.push(category_slug);
      idx++;
    }

    if (subcategory_id) {
      conditions.push(`cs.subcategory_id = $${idx}`);
      params.push(subcategory_id);
      idx++;
    }

    if (price_min) {
      conditions.push(`cs.base_price >= $${idx}`);
      params.push(parseFloat(price_min));
      idx++;
    }

    if (price_max) {
      conditions.push(`cs.base_price <= $${idx}`);
      params.push(parseFloat(price_max));
      idx++;
    }

    let distanceSelect = '';
    let distanceCondition = '';
    let orderBy = 'cp.avg_rating DESC, cs.created_at DESC';

    if (lat && lng) {
      distanceSelect = `, (6371 * acos(cos(radians($${idx})) * cos(radians(cp.lat)) * cos(radians(cp.lng) - radians($${idx + 1})) + sin(radians($${idx})) * sin(radians(cp.lat)))) AS distance`;
      distanceCondition = ` AND (6371 * acos(cos(radians($${idx})) * cos(radians(cp.lat)) * cos(radians(cp.lng) - radians($${idx + 1})) + sin(radians($${idx})) * sin(radians(cp.lat)))) <= $${idx + 2}`;
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
      orderBy = 'distance ASC';
      idx += 3;
    }

    const whereClause = conditions.join(' AND ');
    params.push(limitNum, offset);

    const services = await db.getRows(
      `SELECT cs.*, sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms,
              c.name_en as category_name, c.slug as category_slug,
              cp.business_name, cp.avg_rating, cp.total_reviews, cp.is_online, cp.id as contractor_profile_id,
              u.full_name as contractor_name, u.avatar_url as contractor_avatar
              ${distanceSelect}
       FROM contractor_services cs
       JOIN subcategories sc ON sc.id = cs.subcategory_id
       JOIN categories c ON c.id = sc.category_id
       JOIN contractor_profiles cp ON cp.id = cs.contractor_id
       JOIN users u ON u.id = cp.user_id
       WHERE ${whereClause} ${distanceCondition}
       ORDER BY ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({ success: true, services });
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ success: false, error: 'Failed to search services' });
  }
});

// GET /api/services/nearby — Get nearby services
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 25, limit = 30 } = req.query;

    if (!lat || !lng) {
      return res.status(422).json({ success: false, error: 'lat and lng are required' });
    }

    const services = await db.getRows(
      `SELECT cs.*, sc.name_en as subcategory_name, c.name_en as category_name, c.slug as category_slug,
              cp.business_name, cp.avg_rating, cp.total_reviews, cp.is_online, cp.lat as contractor_lat, cp.lng as contractor_lng,
              u.full_name as contractor_name, u.avatar_url as contractor_avatar,
              (6371 * acos(cos(radians($1)) * cos(radians(cp.lat)) * cos(radians(cp.lng) - radians($2)) + sin(radians($1)) * sin(radians(cp.lat)))) AS distance
       FROM contractor_services cs
       JOIN subcategories sc ON sc.id = cs.subcategory_id
       JOIN categories c ON c.id = sc.category_id
       JOIN contractor_profiles cp ON cp.id = cs.contractor_id
       JOIN users u ON u.id = cp.user_id
       WHERE cs.is_active = true
         AND cp.verification_status = 'verified'
         AND cp.lat IS NOT NULL AND cp.lng IS NOT NULL
         AND (6371 * acos(cos(radians($1)) * cos(radians(cp.lat)) * cos(radians(cp.lng) - radians($2)) + sin(radians($1)) * sin(radians(cp.lat)))) <= $3
       ORDER BY distance ASC
       LIMIT $4`,
      [parseFloat(lat), parseFloat(lng), parseFloat(radius), parseInt(limit)]
    );

    res.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching nearby services:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch nearby services' });
  }
});

// GET /api/services/:id — Get service detail
router.get('/:id', async (req, res) => {
  try {
    const service = await db.getRow(
      `SELECT cs.*, sc.name_en as subcategory_name, sc.name_ms as subcategory_name_ms,
              c.name_en as category_name, c.slug as category_slug,
              cp.business_name, cp.avg_rating, cp.total_reviews, cp.total_jobs_completed,
              cp.is_online, cp.description as contractor_description, cp.id as contractor_profile_id,
              u.full_name as contractor_name, u.avatar_url as contractor_avatar, u.id as contractor_user_id
       FROM contractor_services cs
       JOIN subcategories sc ON sc.id = cs.subcategory_id
       JOIN categories c ON c.id = sc.category_id
       JOIN contractor_profiles cp ON cp.id = cs.contractor_id
       JOIN users u ON u.id = cp.user_id
       WHERE cs.id = $1`,
      [req.params.id]
    );

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    // Get recent reviews for this contractor
    const reviews = await db.getRows(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.contractor_id = $1
       ORDER BY r.created_at DESC LIMIT 5`,
      [service.contractor_profile_id]
    );

    res.json({ success: true, service: { ...service, recent_reviews: reviews } });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service' });
  }
});

module.exports = router;
