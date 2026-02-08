const { neon, neonConfig } = require("@neondatabase/serverless");
const { Pool } = require("pg");
require('dotenv').config();

// Configure Neon for WebSocket pooling
neonConfig.webSocketConstructor = require("ws");

// For direct SQL queries
const sql = neon(process.env.DATABASE_URL);

// Connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 15000,
  query_timeout: 15000,
});

pool.on('error', (err) => {
  console.error("[DB] Pool error:", err.message);
});

pool.on('connect', () => {
  console.log('[DB] New connection established');
});

// Helper functions
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function getRow(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

async function getRows(text, params) {
  const result = await query(text, params);
  return result.rows;
}

async function insertRow(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

async function updateRow(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

async function deleteRow(text, params) {
  const result = await query(text, params);
  return result.rows[0];
}

module.exports = {
  sql,
  pool,
  query,
  getRow,
  getRows,
  insertRow,
  updateRow,
  deleteRow,
};
