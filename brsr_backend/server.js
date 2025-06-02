// brsr-hub-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db'); // Re-enable pool for graceful shutdown
const authRoutes = require('./authRoutes');
const companyRoutes = require('./companyRoutes'); // Require company routes
const reportRoutes = require('./reportRoutes'); // Require report routes
const authMiddleware = require('./authMiddleware'); // Import middleware

const app = express();
const port = process.env.PORT || 3050;

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Don't exit in development, just log
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in development, just log
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Graceful shutdown handler
const gracefulShutdown = () => {
    console.log('Received shutdown signal. Closing server gracefully...');
    server.close(() => {
        console.log('HTTP server closed.');
        pool.end(() => {
            console.log('Database pool closed.');
            process.exit(0);
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' })); // Increase payload limit

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes); // Use company routes
app.use('/api/reports', reportRoutes); // Use report routes

// Example of a protected route
app.get('/api/my-company-data', authMiddleware, async (req, res) => {
    try {
        // req.company and req.auth_user_id are available here
        // Fetch data related to req.company.id or req.auth_user_id
        res.json({ message: 'This is protected data for your company!', company: req.company });
    } catch (error) {
        console.error('Error in protected route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Debug route to check database contents
app.get('/api/debug/companies', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT auth_user_id, email, company_name, created_at FROM companies ORDER BY created_at DESC LIMIT 10');
        res.json({ 
            message: 'Companies found', 
            count: result.rows.length,
            companies: result.rows,
            requesting_user: req.auth_user_id
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

const server = app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});

module.exports = app;