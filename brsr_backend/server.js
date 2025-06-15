// brsr-hub-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./db'); // Re-enable pool for graceful shutdown
const authRoutes = require('./authRoutes');
const companyRoutes = require('./companyRoutes'); // Require company routes
const reportRoutes = require('./reportRoutes'); // Require report routes
const authMiddleware = require('./authMiddleware'); // Import middleware
const { errorHandler, notFoundHandler, asyncHandler } = require('./errorMiddleware');
const { generalLimiter, authLimiter, pdfLimiter } = require('./rateLimitMiddleware');

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

// Graceful shutdown handler (not needed for Vercel serverless functions)
if (process.env.NODE_ENV !== 'production') {
    const gracefulShutdown = () => {
        console.log('Received shutdown signal. Closing server gracefully...');
        if (typeof server !== 'undefined') {
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
        }
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false // Disable for development
}));

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase payload limit

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);

app.use('/api/company', companyRoutes); // Use company routes

// Apply PDF rate limiting to PDF routes
app.use('/api/reports/:reportId/pdf', pdfLimiter);
app.use('/api/reports', reportRoutes); // Use report routes

// Example of a protected route
app.get('/api/my-company-data', authMiddleware, asyncHandler(async (req, res) => {
    // req.company and req.auth_user_id are available here
    // Fetch data related to req.company.id or req.auth_user_id
    res.json({ message: 'This is protected data for your company!', company: req.company });
}));

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

// Debug route to check database contents
app.get('/api/debug/companies', authMiddleware, asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT auth_user_id, email, company_name, created_at FROM companies ORDER BY created_at DESC LIMIT 10');
    res.json({ 
        message: 'Companies found', 
        count: result.rows.length,
        companies: result.rows,
        requesting_user: req.auth_user_id
    });
}));

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Export the app for Vercel serverless functions
module.exports = app;