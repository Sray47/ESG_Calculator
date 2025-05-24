// brsr-hub-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const { pool } = require('./db'); // pool might not be directly needed here anymore
const authRoutes = require('./authRoutes');
const companyRoutes = require('./companyRoutes'); // Require company routes
const reportRoutes = require('./reportRoutes'); // Require report routes
const authMiddleware = require('./authMiddleware'); // Import middleware

const app = express();
const port = process.env.PORT || 3050;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes); // Use company routes
app.use('/api/reports', reportRoutes); // Use report routes

// Example of a protected route
app.get('/api/my-company-data', authMiddleware, async (req, res) => {
    // req.company and req.auth_user_id are available here
    // Fetch data related to req.company.id or req.auth_user_id
    res.json({ message: 'This is protected data for your company!', company: req.company });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
});

module.exports = app;