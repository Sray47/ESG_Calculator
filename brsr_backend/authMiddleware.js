// brsr-hub-backend/middleware/authMiddleware.js
const { supabaseAdmin, pool } = require('./db'); // Corrected path and added pool

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log(`[authMiddleware] Processing request: ${req.method} ${req.path}`);
    console.log(`[authMiddleware] Auth header present: ${!!authHeader}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[authMiddleware] No valid auth header found');
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    console.log("[authMiddleware] Processing token:", token.substring(0, 20) + '...');
    
    try {
        // First attempt with JWT token directly 
        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data || !data.user) {
            console.error("[authMiddleware] Supabase token validation error:", error?.message || 'No user data');
            return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
        }

        // JWT token is valid
        req.supabaseUser = data.user; // Contains id (auth_user_id), email, etc.
        req.auth_user_id = data.user.id; // For convenience
        console.log(`[authMiddleware] Authenticated user via JWT: ${req.auth_user_id} (${data.user.email})`);

        // Fetch and attach internal company profile here if it exists
        try {
            console.log(`[authMiddleware] Fetching company profile for auth_user_id: ${req.auth_user_id}`);
            const companyProfile = await pool.query(
                "SELECT * FROM companies WHERE auth_user_id = $1",
                [req.auth_user_id]
            );
            
            console.log(`[authMiddleware] Company profile query result: ${companyProfile.rows.length} rows found`);
            
            // Don't block access if no company profile found, just set req.company to null
            // This allows newly registered users to create their profile
            if (companyProfile.rows.length > 0) {
                req.company = companyProfile.rows[0];
                console.log(`[authMiddleware] Company profile found: ${req.company.company_name} (ID: ${req.company.id})`);
            } else {
                console.log(`[authMiddleware] No company profile found for auth_user_id: ${req.auth_user_id}`);
                req.company = null;
            }
        } catch (dbError) {
            console.error("[authMiddleware] Error fetching company profile:", dbError);
            // Don't block the request, continue with null company
            req.company = null;
        }

        next();
    } catch (err) {
        console.error("[authMiddleware] Middleware error:", err);
        return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
};

module.exports = authMiddleware;