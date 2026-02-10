require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
  try {
    const cats = await pool.query('SELECT name_en, slug FROM categories ORDER BY sort_order');
    console.log('\n=== CATEGORIES ===');
    cats.rows.forEach(r => console.log(' -', r.name_en, '(' + r.slug + ')'));

    const subs = await pool.query(`
      SELECT s.name_en, s.slug, c.name_en as category 
      FROM subcategories s 
      JOIN categories c ON s.category_id = c.id 
      ORDER BY c.sort_order, s.sort_order
    `);
    console.log('\n=== SUBCATEGORIES ===');
    subs.rows.forEach(r => console.log(' -', r.category + ':', r.name_en));

    const contractors = await pool.query('SELECT business_name, verification_status FROM contractor_profiles');
    console.log('\n=== CONTRACTORS ===');
    contractors.rows.forEach(r => console.log(' -', r.business_name, '[' + r.verification_status + ']'));

    const services = await pool.query('SELECT COUNT(*) as count FROM contractor_services');
    console.log('\n=== SERVICES ===');
    console.log('Total services:', services.rows[0].count);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

verify();
