import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text, params) => pool.query(text, params);
