// Script to clean all data from database
const db = require('./db');

async function cleanAll() {
  console.log('Cleaning all data...');
  
  try {
    // Delete in correct order to respect foreign keys
    await db.query('DELETE FROM notifications');
    console.log('✓ Deleted notifications');
    
    await db.query('DELETE FROM reviews');
    console.log('✓ Deleted reviews');
    
    await db.query('DELETE FROM chat_messages');
    console.log('✓ Deleted chat_messages');
    
    await db.query('DELETE FROM chat_rooms');
    console.log('✓ Deleted chat_rooms');
    
    await db.query('DELETE FROM payments');
    console.log('✓ Deleted payments');
    
    await db.query('DELETE FROM bookings');
    console.log('✓ Deleted bookings');
    
    await db.query('DELETE FROM contractor_services');
    console.log('✓ Deleted contractor_services');
    
    await db.query('DELETE FROM subcategories');
    console.log('✓ Deleted subcategories');
    
    await db.query('DELETE FROM categories');
    console.log('✓ Deleted categories');
    
    await db.query('DELETE FROM addresses');
    console.log('✓ Deleted addresses');
    
    await db.query('DELETE FROM contractor_profiles');
    console.log('✓ Deleted contractor_profiles');
    
    await db.query("DELETE FROM users WHERE role != 'customer'");
    console.log('✓ Deleted contractor users');
    
    console.log('\n✅ All data cleaned successfully!');
    console.log('Now run: node migrate.js to re-seed data');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

cleanAll();
