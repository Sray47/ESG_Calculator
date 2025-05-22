// brsr-hub-backend/middleware/authMiddleware.js
const { supabaseAdmin, pool } = require('./db'); // Corrected path and added pool

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    console.log("Auth middleware processing token:", token.substring(0, 10) + '...');
    try {
        // First attempt with JWT token directly 
        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data || !data.user) {
            console.error("Supabase token validation error:", error);
            
            // Attempt to verify the token as a session token
            try {
                const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.getSession(token);
                
                if (sessionError || !sessionData || !sessionData.session || !sessionData.session.user) {
                    console.error("Supabase session validation error:", sessionError);
                    return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
                }
                
                // Session token is valid
                req.supabaseUser = sessionData.session.user;
                req.auth_user_id = sessionData.session.user.id;
                console.log(`Authenticated user via session token: ${req.auth_user_id}`);
            } catch (sessionVerifyError) {
                console.error("Error verifying session token:", sessionVerifyError);
                return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
            }
        } else {
            // JWT token is valid
            req.supabaseUser = data.user; // Contains id (auth_user_id), email, etc.
            req.auth_user_id = data.user.id; // For convenience
            console.log(`Authenticated user via JWT: ${req.auth_user_id}`);
        }// Fetch and attach internal company profile here if it exists
        try {
            const companyProfile = await pool.query(
                "SELECT * FROM companies WHERE auth_user_id = $1",
                [req.auth_user_id] // Changed from user.id
            );
            
            // Don't block access if no company profile found, just set req.company to null
            // This allows newly registered users to create their profile
            if (companyProfile.rows.length > 0) {
                req.company = companyProfile.rows[0];
            } else {
                console.log(`No company profile found for auth_user_id: ${req.auth_user_id}`); // Changed from user.id
                req.company = null;
            }
        } catch (dbError) {
            console.error("Error fetching company profile:", dbError);
            // Don't block the request, continue with null company
            req.company = null;
        }


        next();
    } catch (err) {
        console.error("Middleware error:", err);
        return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
};

module.exports = authMiddleware;