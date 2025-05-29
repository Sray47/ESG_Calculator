# Critical Logical Error Fixes - Implementation Guide

**Document Version**: 1.0  
**Created**: January 2025  
**Project**: BRSR ESG Calculator - Critical Error Remediation

## Overview

This document provides detailed implementation guidance for fixing the 8 critical logical errors identified in the ESG Calculator project. These fixes should be implemented immediately to prevent service disruptions and data integrity issues.

---

## Fix 1: Database Connection Failure Handling

### Problem
Database connection errors are logged but don't prevent application startup, leading to runtime failures.

### Current Code (brsr_backend/db.js)
```javascript
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the PostgreSQL database from db.js', err.stack);
    } else {
        console.log('Successfully connected to the PostgreSQL database from db.js at', res.rows[0].now);
    }
});
```

### Fixed Implementation
```javascript
// Enhanced database connection with proper error handling
let isDbConnected = false;

const testConnection = async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        client.release();
        isDbConnected = true;
        console.log('✅ Successfully connected to PostgreSQL database at', res.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Error connecting to PostgreSQL database:', err.stack);
        isDbConnected = false;
        return false;
    }
};

// Connection health check middleware
const dbHealthCheck = async (req, res, next) => {
    if (!isDbConnected) {
        return res.status(503).json({ 
            message: 'Database connection unavailable', 
            status: 'unhealthy' 
        });
    }
    next();
};

// Initialize connection on startup
const initializeDatabase = async () => {
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
        const connected = await testConnection();
        if (connected) break;
        
        retries++;
        console.log(`Retrying database connection (${retries}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    
    if (!isDbConnected) {
        console.error('Failed to establish database connection after', maxRetries, 'attempts');
        process.exit(1); // Exit if unable to connect
    }
};

// Health check endpoint
app.get('/health/db', async (req, res) => {
    try {
        await testConnection();
        res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
    }
});

module.exports = { pool, supabaseAdmin, dbHealthCheck, initializeDatabase, testConnection };
```

### Integration in server.js
```javascript
// server.js modifications
const { initializeDatabase, dbHealthCheck } = require('./db');

// Initialize database before starting server
const startServer = async () => {
    try {
        await initializeDatabase();
        
        // Add health check middleware to critical routes
        app.use('/api/reports', dbHealthCheck);
        app.use('/api/company', dbHealthCheck);
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
```

---

## Fix 2: Environment Variable Validation

### Problem
Critical Supabase configuration missing but application continues running.

### Fixed Implementation
```javascript
// config/validation.js
const validateEnvironment = () => {
    const requiredEnvVars = [
        'DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT',
        'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`  - ${varName}`);
        });
        console.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
    
    // Validate Supabase URL format
    try {
        new URL(process.env.SUPABASE_URL);
    } catch (error) {
        console.error('❌ Invalid SUPABASE_URL format:', process.env.SUPABASE_URL);
        process.exit(1);
    }
    
    // Validate JWT secret length
    if (process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters long');
        process.exit(1);
    }
    
    console.log('✅ Environment validation passed');
};

module.exports = { validateEnvironment };
```

### Updated db.js
```javascript
// brsr_backend/db.js
require('dotenv').config();
const { validateEnvironment } = require('./config/validation');

// Validate environment before initializing anything
validateEnvironment();

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Now we can safely use environment variables
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

// Supabase configuration (now guaranteed to exist)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY, 
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

console.log('✅ Supabase Admin client initialized');
```

---

## Fix 3: Transaction Handling for Report Operations

### Problem
Complex database operations without proper transaction handling leading to potential data corruption.

### Fixed Implementation
```javascript
// utils/database.js
const executeTransaction = async (queries) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const results = [];
        for (const query of queries) {
            const result = await client.query(query.text, query.values);
            results.push(result);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = { executeTransaction };
```

### Updated reportRoutes.js
```javascript
// brsr_backend/reportRoutes.js
const { executeTransaction } = require('./utils/database');

// PUT /api/reports/:reportId - Update with transaction
router.put('/:reportId', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;
    let dataToUpdate = req.body;

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: 'No data provided for update.' });
    }

    try {
        // Build queries for transaction
        const queries = [];
        
        // Main update query
        const allowedFields = [
            'sa_business_activities_turnover', 'sa_product_services_turnover',
            'sa_locations_plants_offices', 'sa_markets_served',
            'sa_employee_details', 'sa_workers_details',
            'sa_differently_abled_details', 'sa_women_representation_details',
            'sa_turnover_rate', 'sa_holding_subsidiary_associate_companies',
            'sa_csr_applicable', 'sa_csr_turnover', 'sa_csr_net_worth',
            'sa_transparency_complaints'
        ];
        
        const updateFields = [];
        const values = [];
        let paramIndex = 1;
        
        Object.keys(dataToUpdate).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramIndex}`);
                
                if (typeof dataToUpdate[key] === 'object' && dataToUpdate[key] !== null) {
                    values.push(JSON.stringify(dataToUpdate[key]));
                } else {
                    values.push(dataToUpdate[key]);
                }
                paramIndex++;
            }
        });
        
        if (updateFields.length === 0) {
            return res.status(400).json({ 
                message: 'No valid fields provided for update.' 
            });
        }
        
        // Add timestamp and WHERE conditions
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(reportId, company_id);
        
        const updateQuery = {
            text: `
                UPDATE brsr_reports 
                SET ${updateFields.join(', ')} 
                WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND status = 'draft'
                RETURNING *;
            `,
            values: values
        };
        
        // Add audit log query
        const auditQuery = {
            text: `
                INSERT INTO report_audit_log (report_id, company_id, action, changes, timestamp)
                VALUES ($1, $2, 'UPDATE', $3, CURRENT_TIMESTAMP)
            `,
            values: [reportId, company_id, JSON.stringify({ fields: Object.keys(dataToUpdate) })]
        };
        
        queries.push(updateQuery, auditQuery);
        
        // Execute transaction
        const results = await executeTransaction(queries);
        
        if (results[0].rows.length === 0) {
            return res.status(404).json({ 
                message: 'Report not found, not owned by your company, or not in draft status.' 
            });
        }
        
        res.json(results[0].rows[0]);
        
    } catch (error) {
        console.error(`Error updating report ${reportId}:`, error);
        
        // Don't expose internal error details
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ message: 'Duplicate data conflict.' });
        } else if (error.code === '23503') { // Foreign key violation
            res.status(400).json({ message: 'Invalid reference data.' });
        } else {
            res.status(500).json({ message: 'Failed to update report.' });
        }
    }
});
```

---

## Fix 4: File System Error Handling

### Problem
PDF generation and file operations lack comprehensive error handling.

### Fixed Implementation
```javascript
// utils/fileSystem.js
const fs = require('fs').promises;
const path = require('path');

const ensureDirectoryExists = async (dirPath) => {
    try {
        await fs.access(dirPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dirPath, { recursive: true });
        } else {
            throw error;
        }
    }
};

const safeFileOperation = async (operation) => {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (error.code === 'ENOSPC') {
                throw new Error('Insufficient disk space');
            }
            
            if (error.code === 'EACCES') {
                throw new Error('Permission denied');
            }
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    
    throw lastError;
};

const cleanupTempFiles = async (filePaths) => {
    for (const filePath of filePaths) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
        }
    }
};

module.exports = { ensureDirectoryExists, safeFileOperation, cleanupTempFiles };
```

### Updated PDF Route
```javascript
// brsr_backend/reportRoutes.js
const { ensureDirectoryExists, safeFileOperation, cleanupTempFiles } = require('./utils/fileSystem');

// GET /api/reports/:reportId/pdf - Download PDF with proper error handling
router.get('/:reportId/pdf', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const { company } = req;
    
    if (!company) {
        return res.status(403).json({ 
            message: 'User does not have an associated company profile.' 
        });
    }
    
    const pdfDir = path.join(__dirname, 'pdfs');
    const pdfPath = path.join(pdfDir, `brsr_report_${reportId}.pdf`);
    const tempFiles = [];
    
    try {
        // Check if PDF already exists
        try {
            await fs.access(pdfPath);
            
            // Verify file is not corrupted
            const stats = await fs.stat(pdfPath);
            if (stats.size === 0) {
                await fs.unlink(pdfPath); // Remove corrupted file
                throw new Error('Corrupted PDF file removed');
            }
            
            // File exists and is valid, send it
            return res.download(pdfPath, `BRSR_Report_${reportId}.pdf`);
            
        } catch (accessError) {
            // File doesn't exist or is corrupted, generate it
            console.log(`PDF not found for report ${reportId}, generating...`);
        }
        
        // Get report data with validation
        const reportQuery = `
            SELECT r.*, c.company_name, c.cin, c.registered_office_address
            FROM brsr_reports r 
            JOIN companies c ON r.company_id = c.id 
            WHERE r.id = $1 AND r.company_id = $2
        `;
        
        const reportResult = await pool.query(reportQuery, [reportId, company.id]);
        
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Report not found or access denied.' 
            });
        }
        
        const report = reportResult.rows[0];
        
        // Ensure PDF directory exists
        await ensureDirectoryExists(pdfDir);
        
        // Generate PDF with proper error handling
        await safeFileOperation(async () => {
            const calculatedData = calculateDerivedValues(report);
            await generateBRSRPdf(pdfPath, report, company, calculatedData);
            
            // Verify generated file
            const stats = await fs.stat(pdfPath);
            if (stats.size === 0) {
                throw new Error('Generated PDF file is empty');
            }
            
            tempFiles.push(pdfPath); // Track for cleanup on error
        });
        
        // Update report with PDF generation timestamp
        await pool.query(
            'UPDATE brsr_reports SET pdf_generated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [reportId]
        );
        
        // Send the generated PDF
        res.download(pdfPath, `BRSR_Report_${reportId}.pdf`, (error) => {
            if (error) {
                console.error(`Error sending PDF ${reportId}:`, error);
            }
        });
        
    } catch (error) {
        console.error(`Failed to generate/serve PDF for report ${reportId}:`, error);
        
        // Cleanup any partial files
        await cleanupTempFiles([pdfPath]);
        
        // Send appropriate error response
        if (error.message.includes('disk space')) {
            res.status(507).json({ 
                message: 'Insufficient storage space to generate PDF.' 
            });
        } else if (error.message.includes('Permission denied')) {
            res.status(500).json({ 
                message: 'Server configuration error. Please contact support.' 
            });
        } else {
            res.status(500).json({ 
                message: 'Failed to generate PDF report. Please try again later.' 
            });
        }
    }
});
```

---

## Fix 5: Session Management Race Conditions

### Problem
Auth state changes handled without proper synchronization causing race conditions.

### Fixed Implementation
```javascript
// brsr_frontend/src/services/authService.js - Enhanced session management
let authStateQueue = Promise.resolve();
let currentAuthOperation = null;

const queueAuthOperation = (operation) => {
    authStateQueue = authStateQueue.then(async () => {
        try {
            currentAuthOperation = operation.name || 'unknown';
            return await operation();
        } catch (error) {
            console.error(`Auth operation '${currentAuthOperation}' failed:`, error);
            throw error;
        } finally {
            currentAuthOperation = null;
        }
    });
    return authStateQueue;
};

// Enhanced session management with synchronization
export const setSession = (session) => {
    return queueAuthOperation(async () => {
        if (session) {
            try {
                localStorage.setItem('session', JSON.stringify(session));
                setAuthHeader(session.access_token);
                console.log('[authService] Session set successfully');
            } catch (error) {
                console.error('[authService] Failed to set session:', error);
                localStorage.removeItem('session');
                setAuthHeader(null);
                throw error;
            }
        } else {
            localStorage.removeItem('session');
            setAuthHeader(null);
        }
    });
};

export const clearSession = async () => {
    return queueAuthOperation(async () => {
        localStorage.removeItem('session');
        localStorage.removeItem('supabaseUser');
        localStorage.removeItem('backendUserToken');
        setAuthHeader(null);
        
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out from Supabase:', error);
        }
    });
};

// Enhanced auth state change handler
let authStateChangeHandler = null;

const initializeAuthStateHandler = () => {
    if (authStateChangeHandler) {
        // Remove existing handler to prevent duplicates
        authStateChangeHandler.unsubscribe();
    }
    
    authStateChangeHandler = supabase.auth.onAuthStateChange((event, session) => {
        queueAuthOperation(async () => {
            console.log('[authService] Auth state change:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    if (session) {
                        await setSession(session);
                        console.log('[authService] User signed in:', session.user.email);
                    } else {
                        console.warn('[authService] SIGNED_IN event without session');
                    }
                    break;
                    
                case 'SIGNED_OUT':
                    await clearSession();
                    console.log('[authService] User signed out');
                    break;
                    
                case 'TOKEN_REFRESHED':
                    if (session) {
                        await setSession(session);
                        console.log('[authService] Token refreshed');
                    }
                    break;
                    
                default:
                    console.log('[authService] Unhandled auth event:', event);
            }
        }).catch(error => {
            console.error('[authService] Error handling auth state change:', error);
        });
    });
};

// Initialize auth state handler
initializeAuthStateHandler();

// Enhanced login with proper error handling
export const loginCompany = async (credentials) => {
    return queueAuthOperation(async () => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) {
                console.error("Login error:", error);
                throw new Error(error.message || 'Login failed');
            }
            
            if (!data.session) {
                throw new Error('Login succeeded but no session was created. Please try again.');
            }
            
            // Session will be set by onAuthStateChange handler
            return data;
            
        } catch (error) {
            console.error("Login error in authService:", error);
            throw error;
        }
    });
};
```

---

## Fix 6: Memory Leak Prevention in PDF Generation

### Problem
PDF generation without proper resource cleanup leading to memory accumulation.

### Fixed Implementation
```javascript
// utils/pdfGenerator.js - Enhanced PDF generation with resource management
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class PDFGenerator {
    constructor() {
        this.browser = null;
        this.activeTasks = new Set();
        this.maxConcurrentTasks = 3;
    }
    
    async initialize() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--memory-pressure-off',
                    '--max-old-space-size=1024'
                ]
            });
        }
    }
    
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    
    async generatePDF(reportData, outputPath) {
        if (this.activeTasks.size >= this.maxConcurrentTasks) {
            throw new Error('PDF generation queue is full. Please try again later.');
        }
        
        const taskId = `pdf-${Date.now()}-${Math.random()}`;
        this.activeTasks.add(taskId);
        
        let page = null;
        
        try {
            await this.initialize();
            
            page = await this.browser.newPage();
            
            // Set memory and resource limits
            await page.setDefaultTimeout(30000);
            await page.setDefaultNavigationTimeout(30000);
            
            // Generate HTML content
            const htmlContent = this.generateHTMLContent(reportData);
            
            await page.setContent(htmlContent, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            // Generate PDF with optimized settings
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                preferCSSPageSize: true
            });
            
            // Verify file was created successfully
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                throw new Error('Generated PDF file is empty');
            }
            
            console.log(`PDF generated successfully: ${outputPath} (${stats.size} bytes)`);
            
        } catch (error) {
            // Cleanup partial file on error
            try {
                await fs.unlink(outputPath);
            } catch (unlinkError) {
                console.warn('Failed to cleanup partial PDF file:', unlinkError.message);
            }
            throw error;
        } finally {
            // Always cleanup page and task tracking
            if (page) {
                try {
                    await page.close();
                } catch (closeError) {
                    console.warn('Failed to close PDF page:', closeError.message);
                }
            }
            
            this.activeTasks.delete(taskId);
        }
    }
    
    generateHTMLContent(reportData) {
        // Generate HTML with proper escaping to prevent XSS
        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };
        
        // Build HTML content with proper structure
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>BRSR Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .report-header { border-bottom: 2px solid #333; margin-bottom: 20px; }
                .section { margin-bottom: 30px; page-break-inside: avoid; }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>Business Responsibility and Sustainability Report</h1>
                <h2>${escapeHtml(reportData.company_name || 'N/A')}</h2>
                <p>Financial Year: ${escapeHtml(reportData.financial_year || 'N/A')}</p>
            </div>
            
            <div class="section">
                <h3>Section A: General Disclosures</h3>
                ${this.generateSectionAContent(reportData)}
            </div>
            
            <div class="section">
                <h3>Report Generation Information</h3>
                <p>Generated on: ${new Date().toISOString()}</p>
                <p>Report ID: ${escapeHtml(reportData.id || 'N/A')}</p>
            </div>
        </body>
        </html>
        `;
    }
    
    generateSectionAContent(reportData) {
        // Implementation for Section A content generation
        // This would include all the BRSR Section A fields
        return '<p>Section A content would be generated here...</p>';
    }
}

// Singleton instance with cleanup management
let pdfGenerator = null;

const getPDFGenerator = () => {
    if (!pdfGenerator) {
        pdfGenerator = new PDFGenerator();
        
        // Cleanup on process exit
        process.on('SIGINT', async () => {
            console.log('Cleaning up PDF generator...');
            if (pdfGenerator) {
                await pdfGenerator.cleanup();
            }
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('Cleaning up PDF generator...');
            if (pdfGenerator) {
                await pdfGenerator.cleanup();
            }
            process.exit(0);
        });
    }
    return pdfGenerator;
};

module.exports = { getPDFGenerator };
```

---

## Fix 7: Async Operation Timeout Handling

### Problem
Operations without timeout handling causing infinite waits and resource exhaustion.

### Fixed Implementation
```javascript
// utils/timeout.js
const withTimeout = (promise, timeoutMs, timeoutMessage = 'Operation timed out') => {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);
        })
    ]);
};

const withRetry = async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            console.log(`Operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
    
    throw lastError;
};

module.exports = { withTimeout, withRetry };
```

### Frontend timeout handling
```javascript
// brsr_frontend/src/utils/apiClient.js
import axios from 'axios';

const API_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAY = 1000; // 1 second

const apiClient = axios.create({
    timeout: API_TIMEOUT,
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3050/api'
});

// Enhanced error handling with retry logic
const withRetry = async (fn, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Don't retry on certain error types
            if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
                throw error;
            }
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
    }
    
    throw lastError;
};

// Enhanced interceptors
apiClient.interceptors.response.use(
    response => response,
    async error => {
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }
        
        if (error.response?.status >= 500) {
            console.error('Server error:', error.response.data);
            throw new Error('Server error. Please try again later.');
        }
        
        throw error;
    }
);

export { apiClient, withRetry };
```

---

## Fix 8: Database Transaction Integrity for Registration

### Problem
Multi-step operations without transaction boundaries during user registration.

### Fixed Implementation
```javascript
// brsr_backend/authRoutes.js - Enhanced registration with transaction
router.post('/register', async (req, res) => {
    const {
        email, password, company_name, cin, year_of_incorporation,
        registered_office_address, corporate_address, telephone,
        website, stock_exchange_listed, paid_up_capital,
        brsr_contact_name, brsr_contact_mail, brsr_contact_number,
        reporting_boundary, sa_business_activities_turnover,
        sa_product_services_turnover, sa_locations_plants_offices,
        sa_markets_served
    } = req.body;

    // Input validation
    const requiredFields = ['email', 'password', 'company_name', 'cin'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            message: 'Required fields missing',
            missing: missingFields
        });
    }

    let supabaseUserId = null;
    let shouldCleanupSupabase = false;

    try {
        // Step 1: Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        if (authError) {
            console.error('Supabase user creation error:', authError);
            
            if (authError.message.includes('User already registered')) {
                return res.status(409).json({ 
                    message: 'User with this email already exists.' 
                });
            }
            
            return res.status(500).json({ 
                message: authError.message || 'Failed to create user in Supabase.' 
            });
        }

        if (!authData?.user) {
            return res.status(500).json({ 
                message: 'Failed to create user: No user data returned from Supabase.' 
            });
        }

        supabaseUserId = authData.user.id;
        shouldCleanupSupabase = true;

        // Step 2: Create company profile and initial report in transaction
        const transactionQueries = [
            // Create company profile
            {
                text: `
                    INSERT INTO companies (
                        auth_user_id, email, company_name, cin, year_of_incorporation,
                        registered_office_address, corporate_address, telephone,
                        website, stock_exchange_listed, paid_up_capital,
                        brsr_contact_name, brsr_contact_mail, brsr_contact_number,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `,
                values: [
                    supabaseUserId, email, company_name, cin, year_of_incorporation,
                    registered_office_address, corporate_address, telephone,
                    website, stock_exchange_listed, paid_up_capital,
                    brsr_contact_name, brsr_contact_mail, brsr_contact_number
                ]
            }
        ];

        // Execute transaction
        const results = await executeTransaction(transactionQueries);
        const companyProfile = results[0].rows[0];

        // Step 3: Create initial BRSR report if section A data provided
        if (reporting_boundary && (sa_business_activities_turnover || sa_product_services_turnover)) {
            const currentYear = new Date().getFullYear();
            const financialYear = `${currentYear}-${currentYear + 1}`;

            const reportQueries = [{
                text: `
                    INSERT INTO brsr_reports (
                        company_id, financial_year, reporting_boundary,
                        sa_business_activities_turnover, sa_product_services_turnover,
                        sa_locations_plants_offices, sa_markets_served,
                        status, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `,
                values: [
                    companyProfile.id, financialYear, reporting_boundary,
                    JSON.stringify(sa_business_activities_turnover || []),
                    JSON.stringify(sa_product_services_turnover || []),
                    JSON.stringify(sa_locations_plants_offices || {}),
                    JSON.stringify(sa_markets_served || {})
                ]
            }];

            await executeTransaction(reportQueries);
        }

        // Success - don't cleanup Supabase user
        shouldCleanupSupabase = false;

        res.status(201).json({
            message: 'Company registered and profile created successfully.',
            company: companyProfile,
            auth_user: authData.user
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Cleanup Supabase user if we created one but DB operations failed
        if (shouldCleanupSupabase && supabaseUserId) {
            try {
                await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
                console.log(`Cleaned up Supabase user ${supabaseUserId} after registration failure`);
            } catch (cleanupError) {
                console.error(`Failed to cleanup Supabase user ${supabaseUserId}:`, cleanupError);
            }
        }

        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ 
                message: 'Company with this CIN or email already exists.' 
            });
        }

        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ 
                message: 'Invalid reference data provided.' 
            });
        }

        res.status(500).json({ 
            message: 'Internal server error during registration.' 
        });
    }
});
```

---

## Implementation Checklist

### Pre-Implementation Steps
- [ ] Create backup of current codebase
- [ ] Set up staging environment for testing
- [ ] Review team availability for implementation
- [ ] Prepare rollback plan

### Implementation Order
1. [ ] **Environment Validation** (Fix 2) - Low risk, foundational
2. [ ] **Database Connection Handling** (Fix 1) - Critical for stability
3. [ ] **Transaction Management** (Fix 3, 8) - Data integrity
4. [ ] **File System Error Handling** (Fix 4) - PDF generation
5. [ ] **Memory Management** (Fix 6) - Resource optimization
6. [ ] **Session Management** (Fix 5) - User experience
7. [ ] **Timeout Handling** (Fix 7) - Frontend reliability

### Testing Requirements
- [ ] Unit tests for each fix
- [ ] Integration tests for transaction handling
- [ ] Load testing for PDF generation
- [ ] User acceptance testing for session management

### Monitoring Setup
- [ ] Database connection health checks
- [ ] Memory usage monitoring
- [ ] PDF generation success rates
- [ ] Session timeout tracking
- [ ] Error rate monitoring

### Deployment Strategy
- [ ] Deploy fixes incrementally
- [ ] Monitor each deployment for issues
- [ ] Have rollback procedures ready
- [ ] Update documentation after each fix

---

## Success Metrics

### Performance Metrics
- Database connection success rate: >99.9%
- PDF generation success rate: >95%
- Average session duration without errors: >30 minutes
- Memory usage stability: <80% peak usage

### Error Reduction Metrics
- Critical errors reduced by >90%
- High-risk errors reduced by >80%
- User-reported issues reduced by >70%
- System downtime reduced by >95%

### User Experience Metrics
- Login success rate: >99%
- Report submission success rate: >98%
- PDF download success rate: >97%
- Session timeout complaints: <1% of users

This implementation guide provides detailed, actionable solutions for all critical logical errors identified in the ESG Calculator project. Following this guide will significantly improve system reliability, data integrity, and user experience.
