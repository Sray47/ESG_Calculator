// brsr-hub-backend/db.js
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js'); // Import Supabase
require('dotenv').config({ path: __dirname + '/.env' }); // Always load .env from the backend directory

// Database connection configuration
let poolConfig;

// For Supabase, we need to use a specific connection format to avoid SASL errors
if (process.env.DATABASE_URL) {
    // Use DATABASE_URL if available (preferred for Supabase/Vercel)
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
            // Handle self-signed certificates and certificate chain issues
            checkServerIdentity: () => undefined
        },
        // Connection pool settings optimized for Vercel serverless functions
        max: 10, // Reduced for serverless environment
        idleTimeoutMillis: 20000, // Shorter idle timeout for serverless
        connectionTimeoutMillis: 15000, // Increased timeout for pooler connection
        // Additional settings for Supabase Pooler compatibility
        application_name: 'brsr_calculator_vercel',
        keepAlive: true,
        keepAliveInitialDelayMillis: 5000,
        // Pooler specific settings
        statement_timeout: 30000,
        query_timeout: 30000
    };
    console.log('DB connection config: Using DATABASE_URL with Supabase-optimized settings');
} else {
    // Fallback: Build connection string from individual variables for Supabase
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;
    
    poolConfig = {
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false,
            // Handle self-signed certificates and certificate chain issues
            checkServerIdentity: () => undefined
        },
        // Connection pool settings optimized for Vercel serverless functions
        max: 10, // Reduced for serverless environment
        idleTimeoutMillis: 20000, // Shorter idle timeout for serverless
        connectionTimeoutMillis: 15000, // Increased timeout for pooler connection
        application_name: 'brsr_calculator_vercel',
        // Pooler specific settings
        statement_timeout: 30000,
        query_timeout: 30000
    };
    console.log('DB connection config: Using constructed connection string from individual variables');
    console.log('Connection details:', {
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
    console.error("Supabase URL or Service Key is missing. Check .env file.");
    console.error("SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
    console.error("SUPABASE_SERVICE_KEY:", supabaseServiceKey ? "SET" : "MISSING");
    console.error("Application will continue without Supabase functionality.");
} else {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('Supabase Admin client initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error.message);
        console.error("Application will continue without Supabase functionality.");
    }
}


module.exports = { pool, supabaseAdmin }; // Export both