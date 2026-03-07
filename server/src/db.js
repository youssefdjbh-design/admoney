import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/admoney';

const useSsl = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(120) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(100) UNIQUE,
      twofa_secret VARCHAR(32),
      twofa_enabled BOOLEAN DEFAULT FALSE,
      balance DOUBLE PRECISION DEFAULT 0.0,
      visit_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_view_time TIMESTAMPTZ
    );
  `);
}
