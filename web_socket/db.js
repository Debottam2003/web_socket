import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
// Ensure that the dotenv package is configured to load environment variables
const { Pool } = pkg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432, // Default PostgreSQL port
});

export default pool;