const express = require('express');
const router = express.Router();
const db = require('./db'); // Import the entire db module
const pool = db.pool; // Access the pool property
const authMiddleware = require('./authMiddleware'); // To protect routes and get user info

// Add an immediate check to validate the pool
console.log('[companyRoutes] Initial pool check:', {
    isPoolDefined: !!pool,
    hasQueryMethod: pool && typeof pool.query === 'function'
});

// GET company profile
router.get('/profile', authMiddleware, async (req, res) => {
    console.log(`[companyRoutes /profile] Request from auth_user_id: ${req.auth_user_id}`);
    
    try {
        // authMiddleware should have already fetched the company profile and stored it in req.company.
        if (!req.company) {
            console.info(`[companyRoutes /profile] No company profile found for auth_user_id: ${req.auth_user_id}. Returning 404.`);
            return res.status(404).json({ 
                message: 'Company profile not found.',
                debug: {
                    auth_user_id: req.auth_user_id,
                    user_email: req.supabaseUser?.email
                }
            });
        }

        console.log(`[companyRoutes /profile] Company profile found: ${req.company.company_name} (ID: ${req.company.id})`);
        let companyData = { ...req.company, brsr_report_data: null };

        try {
            const brsrReportQuery = `
                SELECT id as brsr_report_id, company_id, financial_year, reporting_boundary,
                       sa_business_activities_turnover, sa_product_services_turnover,
                       sa_locations_plants_offices, sa_markets_served,
                       created_at, updated_at
                FROM brsr_reports 
                WHERE company_id = $1  
                ORDER BY financial_year DESC, created_at DESC 
                LIMIT 1;
            `;
            const brsrReportResult = await pool.query(brsrReportQuery, [req.company.id]);
            
            if (brsrReportResult.rows.length > 0) {
                companyData.brsr_report_data = brsrReportResult.rows[0];
                console.info(`[companyRoutes /profile] Found BRSR report data for company_id: ${req.company.id}`);
            } else {
                console.info(`[companyRoutes /profile] No BRSR report data found for company_id: ${req.company.id}. Initializing with defaults.`);
                companyData.brsr_report_data = {
                    reporting_boundary: 'Standalone',
                    sa_business_activities_turnover: [],
                    sa_product_services_turnover: [],
                    sa_locations_plants_offices: { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
                    sa_markets_served_locations: { national_states: 0, international_countries: 0 },
                    sa_markets_served_exports_percentage: 0,
                    sa_markets_served_customer_types: '',
                    brsr_report_id: null 
                };
            }
        } catch (brsrError) {
            console.error(`[companyRoutes /profile] Error fetching BRSR report for company_id: ${req.company.id}:`, brsrError);
            companyData.brsr_report_data = {
                reporting_boundary: 'Standalone',
                sa_business_activities_turnover: [],
                sa_product_services_turnover: [],
                sa_locations_plants_offices: { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
                sa_markets_served_locations: { national_states: 0, international_countries: 0 },
                sa_markets_served_exports_percentage: 0,
                sa_markets_served_customer_types: '',
                brsr_report_id: null
            };
        }
        
        console.info(`[companyRoutes /profile] Company profile and BRSR data prepared for auth_user_id: ${req.auth_user_id}.`);
        res.json(companyData);
    } catch (error) {
        console.error(`[companyRoutes /profile] Error in GET /profile handler for auth_user_id: ${req.auth_user_id}:`, error);
        res.status(500).json({ 
            message: 'Internal server error while retrieving company profile.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT update company profile
router.put('/profile', authMiddleware, async (req, res) => {
    const { auth_user_id, company } = req; // company object from authMiddleware
    const { 
        company_name,
        registered_office_address,
        corporate_address,
        telephone,
        website,
        paid_up_capital,
        stock_exchange_listed,
        brsr_contact_name,
        brsr_contact_number,
        brsr_contact_mail,
        // BRSR fields from the new brsr_report_data object
        brsr_report_data 
    } = req.body;

    if (!company) {
        return res.status(404).json({ message: 'Company profile not found. Cannot update.' });
    }
    const companyId = company.id;

    // Validate required fields like company_name if necessary
    if (company_name === undefined || company_name.trim() === '') { 
        return res.status(400).json({ message: 'Company name is required.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Update basic company details in 'companies' table
        const companyUpdateFields = [];
        const companyValues = [];
        let companyQueryIndex = 1;

        const addCompanyFieldToUpdate = (fieldName, value) => {
            if (value !== undefined) {
                companyUpdateFields.push(`${fieldName} = $${companyQueryIndex++}`);
                companyValues.push(value);
            }
        };

        addCompanyFieldToUpdate('company_name', company_name);
        addCompanyFieldToUpdate('registered_office_address', registered_office_address);
        addCompanyFieldToUpdate('corporate_address', corporate_address);
        addCompanyFieldToUpdate('telephone', telephone);
        addCompanyFieldToUpdate('website', website);
        addCompanyFieldToUpdate('paid_up_capital', paid_up_capital);
        
        if (stock_exchange_listed !== undefined) {
            const stockExchangesArray = Array.isArray(stock_exchange_listed) 
                ? stock_exchange_listed 
                : (typeof stock_exchange_listed === 'string' 
                    ? stock_exchange_listed.split(',').map(s => s.trim()).filter(s => s) 
                    : []);
            addCompanyFieldToUpdate('stock_exchange_listed', stockExchangesArray);
        }
        
        addCompanyFieldToUpdate('brsr_contact_name', brsr_contact_name);
        addCompanyFieldToUpdate('brsr_contact_number', brsr_contact_number);
        addCompanyFieldToUpdate('brsr_contact_mail', brsr_contact_mail);

        if (companyUpdateFields.length > 0) {
            companyValues.push(auth_user_id);
            const updateCompanyQuery = `
                UPDATE companies 
                SET ${companyUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE auth_user_id = $${companyQueryIndex}
                RETURNING *;
            `;
            await client.query(updateCompanyQuery, companyValues);
            console.log('[companyRoutes PUT /profile] Basic company details updated for auth_user_id:', auth_user_id);
        }

        // 2. Update or Insert BRSR data in 'brsr_reports' table
        if (brsr_report_data) {
            console.log('[companyRoutes PUT /profile] Received brsr_report_data:', JSON.stringify(brsr_report_data, null, 2));

            const { 
                brsr_report_id, // This ID determines if it's an UPDATE or INSERT
                financial_year, // Should be provided or determined
                reporting_boundary,
                sa_business_activities_turnover,
                sa_product_services_turnover,
                sa_locations_plants_offices,
                sa_markets_served_locations,
                sa_markets_served_exports_percentage,
                sa_markets_served_customer_types 
            } = brsr_report_data;

            // Determine financial year if not provided (e.g., current reporting period)
            const currentFinancialYear = financial_year || `${new Date().getFullYear()}-${new Date().getFullYear() +1}`;

            console.log(`[companyRoutes PUT /profile] BRSR processing: brsr_report_id = ${brsr_report_id}, companyId = ${companyId}`);

            if (brsr_report_id) {
                // Update existing BRSR report
                const brsrUpdateFields = [];
                const brsrValues = [];
                let brsrQueryIndex = 1;

                const addBrsrFieldToUpdate = (fieldName, value) => {
                    if (value !== undefined) {
                        brsrUpdateFields.push(`${fieldName} = $${brsrQueryIndex++}`);
                        brsrValues.push(value);
                    }
                };
                
                addBrsrFieldToUpdate('financial_year', currentFinancialYear);
                addBrsrFieldToUpdate('reporting_boundary', reporting_boundary);
                addBrsrFieldToUpdate('sa_business_activities_turnover', sa_business_activities_turnover);
                addBrsrFieldToUpdate('sa_product_services_turnover', sa_product_services_turnover);
                addBrsrFieldToUpdate('sa_locations_plants_offices', sa_locations_plants_offices);
                addBrsrFieldToUpdate('sa_markets_served_locations', sa_markets_served_locations);
                addBrsrFieldToUpdate('sa_markets_served_exports_percentage', sa_markets_served_exports_percentage);
                addBrsrFieldToUpdate('sa_markets_served_customer_types', sa_markets_served_customer_types);

                if (brsrUpdateFields.length > 0) {
                    brsrValues.push(brsr_report_id); // For WHERE clause
                    brsrValues.push(companyId);      // For WHERE clause to ensure it belongs to the company
                    const updateBrsrQuery = `
                        UPDATE brsr_reports
                        SET ${brsrUpdateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $${brsrQueryIndex} AND company_id = $${brsrQueryIndex + 1} AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
                        RETURNING *;
                    `;
                    console.log('[companyRoutes PUT /profile] Attempting to UPDATE brsr_reports. Query:', updateBrsrQuery);
                    console.log('[companyRoutes PUT /profile] Values for brsr_reports UPDATE:', JSON.stringify(brsrValues, null, 2));
                    
                    const updateBrsrResult = await client.query(updateBrsrQuery, brsrValues);
                    
                    console.log(`[companyRoutes PUT /profile] BRSR report update result: ${updateBrsrResult.rowCount} row(s) affected.`);
                    if (updateBrsrResult.rowCount === 0) {
                        console.warn('[companyRoutes PUT /profile] WARNING: BRSR report UPDATE affected 0 rows. brsr_report_id:', brsr_report_id, 'companyId:', companyId);
                    }
                    console.log('[companyRoutes PUT /profile] BRSR report updated with id:', brsr_report_id);
                } else {
                    console.log('[companyRoutes PUT /profile] No fields to update for existing BRSR report id:', brsr_report_id);
                }
            } else {
                // Insert new BRSR report
                console.log('[companyRoutes PUT /profile] Attempting to INSERT new brsr_report for company_id:', companyId);
                const insertBrsrQuery = `
                    INSERT INTO brsr_reports (
                        company_id, financial_year, reporting_boundary, 
                        sa_business_activities_turnover, sa_product_services_turnover, 
                        sa_locations_plants_offices, sa_markets_served_locations, 
                        sa_markets_served_exports_percentage, sa_markets_served_customer_types
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *;
                `;
                const insertBrsrResult = await client.query(insertBrsrQuery, [
                    companyId,
                    currentFinancialYear,
                    reporting_boundary,
                    sa_business_activities_turnover,
                    sa_product_services_turnover,
                    sa_locations_plants_offices,
                    sa_markets_served_locations,
                    sa_markets_served_exports_percentage,
                    sa_markets_served_customer_types
                ]);
                console.log('[companyRoutes PUT /profile] New BRSR report created for company_id:', companyId, 'Result:', insertBrsrResult.rows[0]?.id);
            }
        } else {
            console.log('[companyRoutes PUT /profile] No brsr_report_data found in request body.');
        }

        await client.query('COMMIT');
        // Fetch the updated profile with BRSR data to return
        const updatedProfileQuery = `
            SELECT c.*,
                   (SELECT row_to_json(br.*) 
                    FROM brsr_reports br 
                    WHERE br.company_id = c.id 
                    ORDER BY br.financial_year DESC, br.created_at DESC 
                    LIMIT 1) as brsr_report_data
            FROM companies c
            WHERE c.auth_user_id = $1;
        `;
        const finalResult = await client.query(updatedProfileQuery, [auth_user_id]);

        res.json({ 
            message: 'Profile updated successfully', 
            profile: finalResult.rows[0] 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[companyRoutes PUT /profile] Error updating company profile and/or BRSR data:', error);
        res.status(500).json({ message: 'Internal server error during profile update.' });
    } finally {
        client.release();
    }
});

module.exports = router;
