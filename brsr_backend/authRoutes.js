// brsr-hub-backend/authRoutes.js
const express = require('express');
const { pool, supabaseAdmin } = require('./db'); // Import pool and supabaseAdmin
const jwt = require('jsonwebtoken'); // Still useful if you issue your own session tokens

const router = express.Router();

// --- CREATE COMPANY PROFILE ROUTE (after Supabase signup) ---
// This route is called by the frontend AFTER a user has successfully signed up with Supabase Auth.
// The frontend will pass the Supabase auth_user_id.
router.post('/create-profile', async (req, res) => {
    const {
        auth_user_id, // Provided by frontend after Supabase signup
        cin,
        company_name,
        year_of_incorporation,
        registered_office_address,
        corporate_address,
        email, // Company email, should match Supabase Auth email
        telephone,
        website,
        paid_up_capital,
        stock_exchange_listed,
        brsr_contact_name,
        brsr_contact_mail,
        brsr_contact_number,
        reporting_boundary, // Q13
        sa_business_activities_turnover,
        sa_product_services_turnover, // Frontend sends this (fixed typo)
        sa_locations_plants_offices,
        sa_markets_served, // single JSONB object for all markets served data
    } = req.body;

    // Basic Validation
    if (!auth_user_id || !cin || !company_name || !email) {
        return res.status(400).json({ message: 'Supabase User ID, CIN, company name, and email are required.' });
    }    try {
        // 1. First, check if the user already exists in our companies table
        // This is a quick check to prevent duplicates without relying on Supabase Admin API
        const existingCheck = await pool.query(
            "SELECT * FROM companies WHERE auth_user_id = $1",
            [auth_user_id]
        );
        
        if (existingCheck.rows.length > 0) {
            return res.status(409).json({ message: 'User profile already exists.' });
        }
        // 2. Attempt to verify with Supabase Admin API, but don't fail if it doesn't work
        // We'll trust the token validation from our authMiddleware instead
        let supabaseUser = null;
        try {
            const { data: verificationData, error: verificationError } = await supabaseAdmin.auth.admin.getUserById(auth_user_id); // auth_user_id from req.body
            if (verificationError) {
                console.error('Supabase admin verification failed for auth_user_id from body:', verificationError);
                // If the user ID from the body can't be verified, it's a bad request or the user doesn't exist.
                return res.status(400).json({ message: 'Invalid auth_user_id provided or user does not exist in Supabase.' });
            } else if (verificationData && verificationData.user) {
                supabaseUser = verificationData.user;
                console.log(`Successfully verified auth_user_id ${auth_user_id} from body with Supabase Admin.`);
            } else {
                // This case should ideally not be reached if verificationError is handled.
                console.warn(`Supabase admin verification for ${auth_user_id} from body did not return a user but no explicit error.`);
                return res.status(400).json({ message: 'Could not verify auth_user_id with Supabase.' });
            }
        } catch (verificationError) {
            console.error('Exception during Supabase admin verification of auth_user_id from body:', verificationError.message);
            return res.status(500).json({ message: 'Server error during user verification.' });
        }
        
        // If we reach here, supabaseUser should be populated and the auth_user_id is verified.
        // The old comment "We'll continue even if Supabase admin verification fails" is no longer applicable
        // as we now return an error if verification fails.

        // 2. Check if CIN or Company Email already exists in your public.companies
        const existingCompany = await pool.query(
            "SELECT * FROM companies WHERE cin = $1 OR email = $2 OR auth_user_id = $3",
            [cin, email, auth_user_id]
        );
        if (existingCompany.rows.length > 0) {
            const conflictingField = existingCompany.rows[0].cin === cin ? 'CIN'
                                  : existingCompany.rows[0].email === email ? 'Email'
                                  : 'User ID';
            return res.status(409).json({ message: `Company with this ${conflictingField} already exists.` });
        }        // 3. Insert into public.companies table
        const stockExchangesArray = Array.isArray(stock_exchange_listed)
            ? stock_exchange_listed
            : (stock_exchange_listed ? stock_exchange_listed.split(',').map(s => s.trim()) : []);

        const newCompanyQuery = `
            INSERT INTO companies (
                auth_user_id, cin, company_name, year_of_incorporation,
                registered_office_address, corporate_address, email, telephone,
                website, paid_up_capital, stock_exchange_listed,
                brsr_contact_name, brsr_contact_mail, brsr_contact_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, cin, company_name, email, auth_user_id;
        `;
        const newCompanyResult = await pool.query(newCompanyQuery, [
            auth_user_id, cin, company_name, year_of_incorporation || null,
            registered_office_address || null, corporate_address || null, email, telephone || null,
            website || null, paid_up_capital || null, stockExchangesArray,
            brsr_contact_name || null, brsr_contact_mail || null, brsr_contact_number || null
        ]);

        const companyProfile = newCompanyResult.rows[0];
        const companyId = companyProfile.id;

        // 4. Insert initial BRSR report data (Section A Q13-Q17)
        const financial_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`; // Example
        const effectiveReportingBoundary = reporting_boundary || 'standalone';        // Ensure these fields are properly structured before storing in JSON
        let marketsServedData = null;
        try {
            marketsServedData = sa_markets_served ? JSON.parse(JSON.stringify(sa_markets_served)) : null;
        } catch (parseError) {
            console.error('Error parsing markets served data:', parseError);
            marketsServedData = null;
        }
        
        try {
            console.log('Creating BRSR report with data:', {
                companyId, 
                financial_year, 
                reporting_boundary: effectiveReportingBoundary,
                sa_business_activities_turnover,
                sa_product_services_turnover, // Data from frontend
                sa_locations_plants_offices,
                marketsServedData
            });
            
            await pool.query(`
                INSERT INTO brsr_reports (
                    company_id, financial_year, reporting_boundary,
                    sa_business_activities_turnover, sa_product_services_turnover, /* Corrected DB column name */
                    sa_locations_plants_offices, sa_markets_served, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft');
            `, [
                companyId, 
                financial_year, 
                effectiveReportingBoundary,
                Array.isArray(sa_business_activities_turnover) ? JSON.stringify(sa_business_activities_turnover) : null,
                Array.isArray(sa_product_services_turnover) ? JSON.stringify(sa_product_services_turnover) : null, 
                sa_locations_plants_offices ? JSON.stringify(sa_locations_plants_offices) : null,
                marketsServedData ? JSON.stringify(marketsServedData) : null
            ]);
            
            console.log('BRSR report created successfully');
        } catch (err) {
            console.error('Error creating BRSR report:', err);
            // We won't throw an error here - company profile was created successfully,
            // and the BRSR report can be created later
        }

        // Optionally, create and send your own backend session token if needed for subsequent requests
        // to your backend, though using the Supabase JWT directly is also common.
        const payload = {
            userId: companyProfile.id, // Your internal company ID
            authUserId: companyProfile.auth_user_id, // Supabase User ID
            cin: companyProfile.cin,
            companyName: companyProfile.company_name
        };
        const backendToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });


        res.status(201).json({
            message: 'Company profile created successfully.',
            company: companyProfile,
            backendToken: backendToken // Send your own token
        });

    } catch (error) {
        console.error('Profile creation error:', error.message, error.stack);
        if (error.code === '23505') { // Unique violation
             return res.status(409).json({ message: 'Company with this CIN, Email, or User ID already exists (DB constraint).' });
        }
        res.status(500).json({ message: 'Server error during profile creation.' });
    }
});

router.post('/register', async (req, res) => {
    const { 
        email, 
        password, 
        company_name, 
        cin,
        year_of_incorporation,
        // Add other fields from your 'companies' table that are set at registration
        registered_office_address,
        corporate_address,
        telephone,
        website,
        paid_up_capital,
        stock_exchange_listed, // This is an array
        brsr_contact_name,
        brsr_contact_number,
        brsr_contact_mail,
        // BRSR Section A fields
        reporting_boundary,
        sa_business_activities_turnover,
        sa_product_services_turnover, // Frontend sends this (fixed typo)
        sa_locations_plants_offices,
        sa_markets_served // single JSONB object for all markets served data
    } = req.body;

    // Basic validation
    if (!email || !password || !company_name || !cin || !year_of_incorporation) {
        return res.status(400).json({ message: 'Email, password, company name, CIN, and year of incorporation are required.' });
    }

    let supabaseAuthUserId = null;

    try {
        // Step 1: Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm email for simplicity, or implement confirmation flow
        });

        if (authError) {
            console.error('Supabase user creation error:', authError);
            // Check for specific errors, e.g., user already exists
            if (authError.message.includes('User already registered')) {
                return res.status(409).json({ message: 'User with this email already exists.' });
            }
            return res.status(500).json({ message: authError.message || 'Failed to create user in Supabase.' });
        }
        
        if (!authData || !authData.user) {
            console.error('Supabase user creation did not return a user object.');
            return res.status(500).json({ message: 'Failed to create user: No user data returned from Supabase.'});
        }
        supabaseAuthUserId = authData.user.id;

        // Step 2: Insert company profile into your 'companies' table
        const stockExchangesArray = Array.isArray(stock_exchange_listed)
        ? stock_exchange_listed
        : (stock_exchange_listed ? stock_exchange_listed.split(',').map(s => s.trim()) : []);

        const newCompanyQuery = `
            INSERT INTO companies (
                auth_user_id, email, company_name, cin, year_of_incorporation, 
                registered_office_address, corporate_address, telephone, website, 
                paid_up_capital, stock_exchange_listed, brsr_contact_name, 
                brsr_contact_number, brsr_contact_mail
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *;
        `;
        const companyValues = [
            supabaseAuthUserId, email, company_name, cin, year_of_incorporation,
            registered_office_address, corporate_address, telephone, website,
            paid_up_capital, stockExchangesArray, brsr_contact_name,
            brsr_contact_number, brsr_contact_mail
        ];
        
        const { rows } = await pool.query(newCompanyQuery, companyValues);
        const companyProfile = rows[0];
        const companyId = companyProfile.id;

        // Step 3: Insert initial BRSR report data (Section A Q13-Q17)
        const financial_year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`; // Example
        const effectiveReportingBoundary = reporting_boundary || 'standalone';

        const marketsServedData = sa_markets_served;
        
        try {
            console.log('Creating BRSR report with data during registration:', {
                companyId, 
                financial_year, 
                reporting_boundary: effectiveReportingBoundary,
                sa_business_activities_turnover,
                sa_product_services_turnover, // Data from frontend
                sa_locations_plants_offices,
                marketsServedData
            });
            
            await pool.query(`
                INSERT INTO brsr_reports (
                    company_id, financial_year, reporting_boundary,
                    sa_business_activities_turnover, sa_product_services_turnover, /* Corrected DB column name */
                    sa_locations_plants_offices, sa_markets_served, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft');
            `, [
                companyId, 
                financial_year, 
                effectiveReportingBoundary,
                Array.isArray(sa_business_activities_turnover) ? JSON.stringify(sa_business_activities_turnover) : null,
                Array.isArray(sa_product_services_turnover) ? JSON.stringify(sa_product_services_turnover) : null, 
                sa_locations_plants_offices ? JSON.stringify(sa_locations_plants_offices) : null,
                marketsServedData ? JSON.stringify(marketsServedData) : null
            ]);
            
            console.log('BRSR report created successfully during registration');
        } catch (brsrError) {
            console.error('Error creating BRSR report during registration:', brsrError);
            // We won't throw an error here - company profile was created successfully,
            // and the BRSR report can be created later or handled by the user.
            // However, it's good to log this for debugging.
        }
        
        res.status(201).json({ 
            message: 'Company registered and profile created successfully.', 
            company: companyProfile,
            auth_user: authData.user // Send back Supabase user info as well
        });

    } catch (error) {
        console.error('Registration error:', error);
        // If Supabase user was created but DB insert failed, attempt to delete Supabase user
        if (supabaseAuthUserId) {
            try {
                await supabaseAdmin.auth.admin.deleteUser(supabaseAuthUserId);
                console.log(`Cleaned up Supabase user ${supabaseAuthUserId} after DB insert failure.`);
            } catch (cleanupError) {
                console.error(`Failed to clean up Supabase user ${supabaseAuthUserId}:`, cleanupError);
            }
        }
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

module.exports = router;