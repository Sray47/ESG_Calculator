// brsr-hub-backend/db.js
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js'); // Import Supabase
require('dotenv').config({ path: __dirname + '/.env' }); // Always load .env from the backend directory

// Database connection configuration
let poolConfig;

if (process.env.DATABASE_URL) {
    // Use DATABASE_URL if available (preferred for Supabase/Vercel)
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        // Add additional parameters for Supabase Pooler
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        application_name: 'brsr_calculator',
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000 // How long a client is allowed to remain idle before being closed
    };
    console.log('DB connection config: Using DATABASE_URL with enhanced options');
} else {
    // Fallback to individual environment variables
    poolConfig = {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: {
            rejectUnauthorized: false
        }
    };
    console.log('DB connection config:', {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD ? '***' : undefined,
        port: process.env.DB_PORT,
    });
}

const pool = new Pool(poolConfig);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the PostgreSQL database from db.js', err.stack);
    } else {
        console.log('Successfully connected to the PostgreSQL database from db.js at', res.rows[0].now);
    }
});

// Supabase Admin Client (using service_role key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase URL or Service Key is missing. Check .env file.");
    console.warn("SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
    console.warn("SUPABASE_SERVICE_KEY:", supabaseServiceKey ? "SET" : "MISSING");
    console.warn("Application will continue without Supabase functionality.");
} else {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('Supabase Admin client initialized.');
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error.message);
        console.warn("Application will continue without Supabase functionality.");
    }
}


module.exports = { pool, supabaseAdmin }; // Export both