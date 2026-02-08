const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`[Migrate] Found ${files.length} migration files`);

  for (const file of files) {
    console.log(`[Migrate] Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      console.log(`[Migrate] Success: ${file}`);
    } catch (error) {
      console.error(`[Migrate] Error in ${file}:`, error.message);
      // Continue on duplicate errors (already migrated)
      if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
        process.exit(1);
      }
    }
  }

  console.log('[Migrate] All migrations complete');
  await pool.end();
  process.exit(0);
}

migrate();
