// brsr-hub-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./db'); // Re-enable pool for graceful shutdown
const authRoutes = require('./authRoutes');
const companyRoutes = require('./companyRoutes'); // Require company routes
// const reportRoutes = require('./reportRoutes'); // Conditionally loaded below
const authMiddleware = require('./authMiddleware'); // Import middleware
const { errorHandler, notFoundHandler, asyncHandler } = require('./errorMiddleware');
const { generalLimiter, authLimiter, pdfLimiter } = require('./rateLimitMiddleware');

const app = express();

// Define corsOptions (as before)
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (process.env.CORS_ORIGIN === '*' || !origin || (origin && allowedOrigins.indexOf(origin) !== -1)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS from origin: ${origin}`));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: false, // Crucial: set to false if origin is '*'
  preflightContinue: false, 
  optionsSuccessStatus: 204 
};

// MANUAL GLOBAL OPTIONS HANDLER - VERY TOP
app.options('*', (req, res) => {
  console.log(`[CORS Preflight] Received OPTIONS request for: ${req.path} from origin: ${req.headers.origin}`);
  
  const requestOrigin = req.headers.origin;
  let allowOrigin = process.env.CORS_ORIGIN || '*'; // Default to '*'

  if (allowOrigin !== '*') {
    const allowedOrigins = allowOrigin.split(',');
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      allowOrigin = requestOrigin; // Reflect the specific allowed origin
      res.setHeader('Vary', 'Origin'); // Important if not using '*' and reflecting specific origin
    } else {
      // If the requestOrigin is not in the explicit list, and we are not using '*',
      // then this origin is not allowed. However, for OPTIONS, we might still send generic headers
      // or rely on the main cors middleware to deny. For simplicity here, if not '*',
      // and origin doesn't match, it might lead to the main cors handler blocking.
      // For now, let's assume CORS_ORIGIN is '*' or the origin matches.
      // If CORS_ORIGIN is a list, and origin is in it, allowOrigin is set to requestOrigin.
      // If CORS_ORIGIN is '*', allowOrigin remains '*'.

      // For development, you might want to log or handle this case differently
      console.warn(`CORS preflight request from unallowed origin: ${requestOrigin}`);
    }
  }
  
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept'); // Be comprehensive
  
  res.status(204).end(); // Respond to preflight and end chain
});

// Then, apply the main CORS policy for non-OPTIONS requests
app.use(cors(corsOptions));

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

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase payload limit

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
    next();
});

// --- ROUTE DEFINITIONS FOR STANDALONE DEPLOYMENT ---
// Add '/api' prefix for standalone backend deployment

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);

app.use('/api/company', companyRoutes);

// Conditionally load report routes
let reportRoutesAvailable = false;
try {
  const reportRoutes = require('./reportRoutes');
  app.use('/api/reports/:reportId/pdf', pdfLimiter);
  app.use('/api/reports', reportRoutes);
  reportRoutesAvailable = true;
  console.log('✓ Report routes loaded successfully');
} catch (error) {
  console.warn('⚠ Report routes disabled due to dependency error:', error.message);
  
  // Add placeholder route for reports
  app.get('/api/reports/status', (req, res) => {
    res.json({
      available: false,
      reason: 'PDF/Chart functionality temporarily disabled',
      error: 'Canvas dependency not available in this environment'
    });
  });
}

// Example of a protected route
app.get('/api/my-company-data', authMiddleware, asyncHandler(async (req, res) => {
    // req.company and req.auth_user_id are available here
    // Fetch data related to req.company.id or req.auth_user_id
    res.json({ message: 'This is protected data for your company!', company: req.company });
}));

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!', 
        timestamp: new Date().toISOString(),
        features: {
            reports: reportRoutesAvailable,
            auth: true,
            company: true
        }
    });
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

// Start server (for local development)
if (process.env.NODE_ENV !== 'test') { // Avoid starting server during tests
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (process.env.CORS_ORIGIN) {
      console.log(`CORS_ORIGIN set to: ${process.env.CORS_ORIGIN}`);
    } else {
      console.warn('CORS_ORIGIN is not set in .env file. CORS might not work as expected.');
    }
    // Add other env vars checks if needed
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

// Export the app for Vercel serverless functions
module.exports = app;
