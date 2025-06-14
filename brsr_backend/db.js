// brsr-hub-backend/db.js
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js'); // Import Supabase
require('dotenv').config({ path: __dirname + '/.env' }); // Always load .env from the backend directory

console.log('DB connection config:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? '***' : undefined,
    port: process.env.DB_PORT,
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the PostgreSQL database from db.js', err.stack);
    } else {
        console.log('Successfully connected to the PostgreSQL database from db.js at', res.rows[0].now);
    }
});

// Supabase Admin Client (using service_role key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Key is missing. Check .env file.");
    // process.exit(1); // Or handle this more gracefully
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
console.log('Supabase Admin client initialized.');


module.exports = { pool, supabaseAdmin }; // Export both