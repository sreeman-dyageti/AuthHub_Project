import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: "../.env" });

const { Pool } = pg;

console.log({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_NAME,
  port: process.env.PG_PORT,
});

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_NAME,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Exporting the query function
export function query(text, params) {
  return pool.query(text, params);
} 