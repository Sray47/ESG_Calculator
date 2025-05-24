// filepath: c:\\Users\\USER\\ESG_Calculator\\brsr_backend\\reportRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const authMiddleware = require('./authMiddleware');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { calculateDerivedValues, generateBRSRPdf } = require('./pdfGenerator');

// GET all reports for a company (for PreviousReportsPage)
router.get('/', authMiddleware, async (req, res) => {
    const company_id = req.company?.id;
    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }
    try {
        const query = `
            SELECT id, financial_year, reporting_boundary, status, updated_at 
            FROM brsr_reports 
            WHERE company_id = $1
            ORDER BY financial_year DESC, updated_at DESC;
        `;
        const { rows } = await pool.query(query, [company_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching reports list:', error);
        res.status(500).json({ message: 'Failed to fetch reports list.', error: error.message });
    }
});

// GET a specific report by ID (for ReportWizardPage loading)
router.get('/:reportId', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }

    try {
        const query = `SELECT * FROM brsr_reports WHERE id = $1 AND company_id = $2;`;
        const { rows } = await pool.query(query, [reportId, company_id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        const reportFromDb = rows[0];
        const sectionAData = {};
        const reportResponse = {};

        for (const key in reportFromDb) {
            if (reportFromDb.hasOwnProperty(key)) {
                if (key.startsWith('sa_')) {
                    sectionAData[key] = reportFromDb[key];
                } else {
                    reportResponse[key] = reportFromDb[key];
                }
            }
        }
        reportResponse.section_a_data = sectionAData;

        res.json(reportResponse);
    } catch (error) {
        console.error(`Error fetching report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to fetch report.', error: error.message });
    }
});

// PUT /api/reports/:reportId - Update an existing BRSR report (for wizard steps)
router.put('/:reportId', authMiddleware, async (req, res) => {    const { reportId } = req.params;
    const company_id = req.company?.id;
    let dataToUpdate = req.body; // e.g., { section_a_data: { ... }, section_b_data: { ... } }

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: 'No data provided for update.' });
    }
    
    // Debug log to see what data is being sent
    console.log('PUT /:reportId - Data to update:', JSON.stringify(dataToUpdate, null, 2));    // Handle section_a_data specially
    if (dataToUpdate.section_a_data) {
        console.log('Found section_a_data in update payload');
        
        // Keep track that we have section_a_data to update
        const sectionAData = dataToUpdate.section_a_data;
        
        try {
            // Instead of using router.handle (which isn't working), directly call the code from section-a-test endpoint
            // Extract only the fields that match database columns starting with sa_
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            
            // Filter fields that start with sa_ to ensure we only update valid database columns
            const fieldNames = Object.keys(sectionAData).filter(key => key.startsWith('sa_'));
            
            if (fieldNames.length === 0) {
                return res.status(400).json({ message: 'No valid Section A fields found in data.' });
            }
            
            // Build the SET part of the query dynamically
            fieldNames.forEach(field => {
                updateFields.push(`${field} = $${paramIndex}`);
                
                if (typeof sectionAData[field] === 'object' && sectionAData[field] !== null) {
                    values.push(JSON.stringify(sectionAData[field]));
                } else {
                    values.push(sectionAData[field]);
                }
                
                paramIndex++;
            });
            
            // Add the standard WHERE clause parameters
            values.push(reportId);
            values.push(company_id);
            
            const query = `
                UPDATE brsr_reports
                SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND status != 'submitted'
                RETURNING *;
            `;
            
            console.log('Executing query:', query);
            console.log('With values:', values);
            
            const { rows } = await pool.query(query, values);
            
            if (rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Report not found, not owned by your company, or already submitted.' 
                });
            }
            
            return res.json(rows[0]);
        } catch (error) {
            console.error(`Error updating Section A data for report ${reportId}:`, error);
            return res.status(500).json({ 
                message: 'Failed to update Section A data.', 
                error: error.message 
            });
        }
        
    // The code below is kept but won't be executed due to the return above
    try {
        // Extract fields from the sectionAData object
        const {
            sa_business_activities_turnover = [],
            sa_product_services_turnover = [],
            sa_locations_plants_offices = {},
            sa_markets_served = {},
            sa_employee_details = {},
            sa_workers_details = {},
            sa_differently_abled_details = {},
            sa_women_representation_details = {},
            sa_turnover_rate = {},
            sa_holding_subsidiary_associate_companies = [],
            sa_csr_applicable = false,
            sa_csr_turnover = '',
            sa_csr_net_worth = '',
            sa_transparency_complaints = {}
        } = sectionAData || {};
        
        // Construct a query that updates each JSONB column separately
        const query = `
            UPDATE brsr_reports
            SET 
                sa_business_activities_turnover = $1, 
                sa_product_services_turnover = $2,
                sa_locations_plants_offices = $3,
                sa_markets_served = $4,
                sa_employee_details = $5,
                sa_workers_details = $6, 
                sa_differently_abled_details = $7,
                sa_women_representation_details = $8,
                sa_turnover_rate = $9,
                sa_holding_subsidiary_associate_companies = $10,
                sa_csr_applicable = $11,
                sa_csr_turnover = $12,
                sa_csr_net_worth = $13,
                sa_transparency_complaints = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND company_id = $16 AND status != 'submitted'
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [
            sa_business_activities_turnover,
            sa_product_services_turnover,
            sa_locations_plants_offices,
            sa_markets_served,
            sa_employee_details,
            sa_workers_details,
            sa_differently_abled_details,
            sa_women_representation_details,
            sa_turnover_rate,
            sa_holding_subsidiary_associate_companies,
            sa_csr_applicable,
            sa_csr_turnover,
            sa_csr_net_worth,
            sa_transparency_complaints,
            reportId,
            company_id
        ]);
            
            if (rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Report not found, not owned by your company, or not in draft status.' 
                });
            }
            
            // Return the updated report directly
            return res.json(rows[0]);
        } catch (error) {
            console.error(`Error updating section_a_data for report ${reportId}:`, error);
            return res.status(500).json({ 
                message: 'Failed to update section_a_data.', 
                error: error.message 
            });
        }
    }

    // Debug log to see what data is being sent
    console.log('PUT /:reportId - Data to update:', JSON.stringify(dataToUpdate, null, 2));

    // Construct the SET part of the query dynamically
    // Ensure column names match your brsr_reports table schema
    const updateFields = [];
    const values = [];
    let valueIndex = 1;    // Map frontend field names to DB column names if they differ, or handle structure
    // For simplicity, assuming direct mapping for now for top-level JSONB fields    const allowedFields = [
        'financial_year', 'reporting_boundary', 'status',
        // Section A fields are handled by /:reportId/section-a endpoint
        'sa_business_activities_turnover', 'sa_product_services_turnover',
        'sa_locations_plants_offices', 'sa_markets_served',
        'sb_policy_management', 'sb_governance_leadership_oversight', 'sb_review_of_ngrbcs',
        'sb_independent_assessment', 'sb_non_coverage_reason',
        'sc_p1_ethical_conduct', 'sc_p2_sustainable_services', 'sc_p3_employee_wellbeing',
        'sc_p4_stakeholder_engagement', 'sc_p5_human_rights', 'sc_p6_environment',
        'sc_p7_policy_advocacy', 'sc_p8_inclusive_growth', 'sc_p9_consumer_value',
        'submitted_at' // if you allow updating this separately before final submit];
    for (const key in dataToUpdate) {
        if (allowedFields.includes(key)) {
            console.log(`Processing field: ${key}`);
            updateFields.push(`${key} = $${valueIndex++}`);
            // Ensure JSONB fields are stringified if your pg library doesn't handle objects automatically for JSONB
            if (typeof dataToUpdate[key] === 'object' && dataToUpdate[key] !== null) {
                values.push(JSON.stringify(dataToUpdate[key]));
            } else {
                values.push(dataToUpdate[key]);
            }
        } else {
            console.log(`Skipping unallowed field: ${key}`);
        }
    }    if (updateFields.length === 0) {
        const providedFields = Object.keys(dataToUpdate).join(', ');
        return res.status(400).json({ 
            message: 'No valid fields provided for update.', 
            details: `Provided fields [${providedFields}] do not match any allowed fields in the database schema.` 
        });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(reportId);
    values.push(company_id);

    const query = `
        UPDATE brsr_reports 
        SET ${updateFields.join(', ')} 
        WHERE id = $${valueIndex++} AND company_id = $${valueIndex++} AND status = 'draft'
        RETURNING *;
    `;

    try {
        const { rows } = await pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found, not owned by your company, or not in draft status.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to update report.', error: error.message });
    }
});

// POST /api/reports/:reportId/submit - Finalize, submit, and generate PDF
router.post('/:reportId/submit', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }

    try {
        // Mark as submitted
        const query = `
            UPDATE brsr_reports 
            SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND company_id = $2 AND status = 'draft'
            RETURNING *;
        `;
        const companyQuery = `SELECT * FROM companies WHERE id = $1`;
        
        // Get report data and company data
        const { rows: reportRows } = await pool.query(query, [reportId, company_id]);
        
        if (reportRows.length === 0) {
            return res.status(404).json({ message: 'Report not found, not owned by your company, or not in draft status for submission.' });
        }

        // Get company details
        const { rows: companyRows } = await pool.query(companyQuery, [company_id]);
        if (companyRows.length === 0) {
            return res.status(404).json({ message: 'Company information not found.' });
        }
        
        // Merge report and company data
        const report = reportRows[0];
        const company = companyRows[0];
        
        // Calculate derived values from raw data using our calculation functions
        const calculatedData = calculateDerivedValues(report);
        
        // Generate PDF with calculated values
        const pdfDir = path.join(__dirname, 'pdfs');
        const pdfPath = path.join(pdfDir, `brsr_report_${reportId}.pdf`);
        fs.mkdirSync(pdfDir, { recursive: true });
          try {
            // Generate the PDF document with all calculated values
            await generateBRSRPdf(pdfPath, report, company, calculatedData);
            
            res.json({ 
                message: 'Report submitted and PDF generated.', 
                pdfUrl: `/api/reports/${reportId}/pdf`,
                calculatedData: calculatedData // Include the calculated data in the response for verification
            });
        } catch (pdfError) {
            console.error(`Error generating PDF for report ${reportId}:`, pdfError);
            // Allow submission to succeed even if PDF generation fails
            res.json({ 
                message: 'Report submitted but PDF generation failed.', 
                calculatedData: calculatedData,
                pdfError: pdfError.message
            });
        }
    } catch (error) {
        console.error(`Error submitting report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to submit and generate PDF.' });
    }
});

// GET /api/reports/:reportId/pdf - Download PDF
router.get('/:reportId/pdf', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const pdfPath = path.join(__dirname, 'pdfs', `brsr_report_${reportId}.pdf`);
    
    try {
        // Check if PDF exists
        if (!fs.existsSync(pdfPath)) {
            console.error(`PDF file not found at path: ${pdfPath}`);
            
            // Attempt to generate it on-the-fly if report exists
            try {
                const { company } = req;
                if (!company) {
                    return res.status(403).json({ message: 'User does not have an associated company profile.' });
                }
                
                // Get report data
                const reportQuery = `SELECT * FROM brsr_reports WHERE id = $1 AND company_id = $2;`;
                const reportResult = await pool.query(reportQuery, [reportId, company.id]);
                
                if (reportResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Report not found or access denied.' });
                }
                
                const report = reportResult.rows[0];
                
                // Calculate data for PDF
                const calculatedData = calculateDerivedValues(report);
                
                // Ensure directory exists
                fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
                
                // Generate PDF
                await generateBRSRPdf(pdfPath, report, company, calculatedData);
                
                // Send the newly generated PDF
                return res.download(pdfPath, `BRSR_Report_${reportId}.pdf`);
            } catch (genError) {
                console.error(`Failed to generate PDF on-the-fly for report ${reportId}:`, genError);
                return res.status(500).json({ 
                    message: 'PDF not found and could not be generated.', 
                    error: genError.message 
                });
            }
        }
        
        // If PDF exists, download it
        res.download(pdfPath, `BRSR_Report_${reportId}.pdf`);
    } catch (error) {
        console.error(`Error downloading PDF for report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to download PDF', error: error.message });
    }
});

// POST /api/reports/initiate - Initiate a new BRSR report
router.post('/initiate', authMiddleware, async (req, res) => {
    const { financial_year, reporting_boundary } = req.body;
    const { company } = req; // Company object attached by authMiddleware

    if (!company || !company.id) {
        return res.status(403).json({ message: 'User does not have an associated company profile. Please create one first.' });
    }
    const companyId = company.id;

    // For debugging: print company_id and financial_year
    console.log(`[reportRoutes /initiate] Attempting to initiate report for company_id: ${companyId}, financial_year: ${financial_year}, reporting_boundary: ${reporting_boundary}`);

    if (!financial_year || !reporting_boundary) {
        return res.status(400).json({ message: 'Financial year and reporting boundary are required.' });
    }
    
    try {        // First check if a report already exists for this company and financial year
        const checkExistingQuery = `
            SELECT id, status FROM brsr_reports 
            WHERE company_id = $1 AND financial_year = $2
        `;
        const existingReport = await pool.query(checkExistingQuery, [companyId, financial_year]);
        
        if (existingReport.rows.length > 0) {
            const existingReportId = existingReport.rows[0].id;
            const existingStatus = existingReport.rows[0].status;
            
            // If report exists but is in 'InProgress' or 'draft' status, update it
            if (existingStatus === 'InProgress' || existingStatus === 'draft') {
                // Update the existing report with new reporting boundary if provided
                const updateQuery = `
                    UPDATE brsr_reports 
                    SET reporting_boundary = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING id, company_id, financial_year, reporting_boundary, status, created_at, updated_at;
                `;
                const result = await pool.query(updateQuery, [reporting_boundary, existingReportId]);
                const updatedReport = result.rows[0];
                
                console.log(`[reportRoutes /initiate] Updated existing BRSR report with ID: ${existingReportId} for company_id ${companyId} and financial_year ${financial_year}`);
                return res.status(200).json({
                    ...updatedReport,
                    message: 'Updated existing report that was in progress'
                });
            } else {
                // If report exists and is in a final state like 'submitted', don't modify it
                console.log(`[reportRoutes /initiate] A completed report for company_id ${companyId} and financial_year ${financial_year} already exists. No modifications made.`);
                return res.status(409).json({ 
                    message: `A report for this company (ID: ${companyId}) with the financial year ${financial_year} already exists in ${existingStatus} status. Only one report per company per financial year is allowed.`,
                    reportId: existingReportId
                });
            }
        }
          // If no existing report, create a new one
        // Add ON CONFLICT clause to handle potential race conditions
        const newReportQuery = `
            INSERT INTO brsr_reports (company_id, financial_year, reporting_boundary, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT ON CONSTRAINT brsr_reports_company_id_financial_year_key 
            DO UPDATE SET reporting_boundary = $3, updated_at = CURRENT_TIMESTAMP
            RETURNING id, company_id, financial_year, reporting_boundary, status, created_at;
        `;
        // Default status to 'Draft' or 'InProgress'
        const result = await pool.query(newReportQuery, [companyId, financial_year, reporting_boundary, 'InProgress']);
        
        const newReport = result.rows[0];
        console.log(`[reportRoutes /initiate] New BRSR report initiated with ID: ${newReport.id} for company ID: ${companyId}`);
        res.status(201).json(newReport);
    } catch (error) {
        console.error(`[reportRoutes /initiate] Error initiating new BRSR report for company_id ${companyId}, financial_year ${financial_year}:`, error);
          // In case there are still any constraint violations, handle them generically
        if (error.code === '23505') {
            console.log(`[reportRoutes /initiate] Constraint violation: ${error.constraint}`);
            
            // A more specific error message based on the actual constraint being violated
            if (error.constraint === 'brsr_reports_company_id_financial_year_key') {
                return res.status(409).json({ 
                    message: `A report for company ID ${companyId} with financial year ${financial_year} already exists. Only one report per company per financial year is allowed.` 
                });
            } else {
                return res.status(409).json({ 
                    message: `Database conflict: A report for company ID ${companyId} with financial year ${financial_year} already exists. Please try again.` 
                });
            }
        }
        
        res.status(500).json({ 
            message: 'Internal server error while initiating report.',
            error: error.message // Include error message for debugging
        });
    }
});

// GET /api/reports/:reportId - Fetch details for a specific BRSR report
router.get('/:reportId', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const { company } = req; // Company object from authMiddleware

    if (!company || !company.id) {
        return res.status(403).json({ message: 'User does not have an associated company profile.' });
    }

    if (isNaN(parseInt(reportId))) {
        return res.status(400).json({ message: 'Invalid report ID format.' });
    }

    try {
        const reportQuery = `
            SELECT 
                r.id AS report_id,
                r.financial_year,
                r.reporting_boundary,
                r.status,
                r.created_at AS report_created_at,
                r.updated_at AS report_updated_at,
                r.submitted_at,
                r.brsr_report_data, -- This should contain Section A specific data stored in brsr_reports
                c.id AS company_id,
                c.company_name,
                c.cin,
                c.year_of_incorporation,
                c.registered_office_address,
                c.corporate_address,
                c.email AS company_email,
                c.telephone AS company_telephone,
                c.website AS company_website,
                c.stock_exchange_listed,
                c.paid_up_capital,
                c.contact_name AS company_contact_name,       -- from companies table (general contact)
                c.contact_mail AS company_contact_mail,       -- from companies table
                c.contact_number AS company_contact_number,   -- from companies table
                c.brsr_contact_name,    -- from companies table (specific BRSR contact)
                c.brsr_contact_mail,    -- from companies table
                c.brsr_contact_number,  -- from companies table
                // Include other company fields as needed for pre-filling Section A
                c.sa_business_activities_turnover,
                c.sa_product_services_turnover,
                c.sa_locations_plants_offices,
                c.sa_markets_served
            FROM brsr_reports r
            JOIN companies c ON r.company_id = c.id
            WHERE r.id = $1 AND r.company_id = $2;
        `;
        const result = await pool.query(reportQuery, [reportId, company.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        const reportDetails = result.rows[0];
          // Structure the response to be more frontend-friendly if needed
        // For example, nest company data under a 'company' key
        // Construct section_a_data from individual fields
        const section_a_data = {
            company_name: reportDetails.company_name || '',
            cin: reportDetails.cin || '',
            year_of_incorporation: reportDetails.year_of_incorporation || '',
            registered_office_address: reportDetails.registered_office_address || '',
            corporate_address: reportDetails.corporate_address || '',
            email: reportDetails.company_email || '',
            telephone: reportDetails.company_telephone || '',
            website: reportDetails.company_website || '',
            financial_year: reportDetails.financial_year || '',
            stock_exchange_listed: reportDetails.stock_exchange_listed || '',
            paid_up_capital: reportDetails.paid_up_capital || '',
            brsr_contact_name: reportDetails.brsr_contact_name || '',
            brsr_contact_mail: reportDetails.brsr_contact_mail || '',
            brsr_contact_number: reportDetails.brsr_contact_number || '',
            reporting_boundary: reportDetails.reporting_boundary || '',
            // Fields from the database JSONB columns
            sa_business_activities_turnover: reportDetails.sa_business_activities_turnover || [],
            sa_product_services_turnover: reportDetails.sa_product_services_turnover || [],
            sa_locations_plants_offices: reportDetails.sa_locations_plants_offices || {},
            sa_markets_served: reportDetails.sa_markets_served || {},
            sa_employee_details: reportDetails.sa_employee_details || {},
            sa_workers_details: reportDetails.sa_workers_details || {},
            sa_differently_abled_details: reportDetails.sa_differently_abled_details || {},
            sa_women_representation_details: reportDetails.sa_women_representation_details || {},
            sa_turnover_rate: reportDetails.sa_turnover_rate || {},
            sa_holding_subsidiary_associate_companies: reportDetails.sa_holding_subsidiary_associate_companies || [],
            sa_csr_applicable: reportDetails.sa_csr_applicable || false,
            sa_csr_turnover: reportDetails.sa_csr_turnover || '',
            sa_csr_net_worth: reportDetails.sa_csr_net_worth || '',
            sa_transparency_complaints: reportDetails.sa_transparency_complaints || {}
        };        const formattedResponse = {
            id: reportDetails.report_id,
            financial_year: reportDetails.financial_year,
            reporting_boundary: reportDetails.reporting_boundary,
            status: reportDetails.status,
            created_at: reportDetails.report_created_at,
            updated_at: reportDetails.report_updated_at,
            submitted_at: reportDetails.submitted_at,
            brsr_report_data: reportDetails.brsr_report_data || {}, // Ensure it's an object
            section_a_data: section_a_data, // Use the constructed section_a_data object - frontend expects this structure
            company: {
                id: reportDetails.company_id,
                company_name: reportDetails.company_name,
                cin: reportDetails.cin,
                year_of_incorporation: reportDetails.year_of_incorporation,
                registered_office_address: reportDetails.registered_office_address,
                corporate_address: reportDetails.corporate_address,
                email: reportDetails.company_email,
                telephone: reportDetails.company_telephone,
                website: reportDetails.company_website,
                stock_exchange_listed: reportDetails.stock_exchange_listed,
                paid_up_capital: reportDetails.paid_up_capital,
                contact_name: reportDetails.company_contact_name,
                contact_mail: reportDetails.company_contact_mail,
                contact_number: reportDetails.company_contact_number,
                brsr_contact_name: reportDetails.brsr_contact_name,
                brsr_contact_mail: reportDetails.brsr_contact_mail,
                brsr_contact_number: reportDetails.brsr_contact_number,
                // BRSR Section A company fields
                sa_business_activities_turnover: reportDetails.sa_business_activities_turnover || [],
                sa_product_services_turnover: reportDetails.sa_product_services_turnover || [],
                sa_locations_plants_offices: reportDetails.sa_locations_plants_offices || { national_plants: 0, national_offices: 0, international_plants: 0, international_offices: 0 },
                sa_markets_served: reportDetails.sa_markets_served || { locations: { national_states: 0, international_countries: 0 }, exports_percentage: 0, customer_types: '' },
            }
        };

        res.status(200).json(formattedResponse);

    } catch (error) {
        console.error(`[reportRoutes /:reportId] Error fetching report details for ID ${reportId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching report details.' });
    }
});

// POST /api/reports/:reportId/section-a - Special endpoint for updating Section A data
router.post('/:reportId/section-a', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;
    const sectionAData = req.body;

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }
    
    if (!sectionAData || Object.keys(sectionAData).length === 0) {
        return res.status(400).json({ message: 'No Section A data provided for update.' });
    }
    
    console.log('POST /:reportId/section-a - Data to update:', JSON.stringify(sectionAData, null, 2));
    
    // Make sure we're only passing field names that exist in the database
    // Filter out any fields that don't start with 'sa_'
    const validFields = Object.keys(sectionAData).filter(key => key.startsWith('sa_'));
    console.log('Valid section A fields for database update:', validFields);
    
    try {
        // Extract fields from the sectionAData object
        // Use let for fields that might be reassigned if they need modification (like numeric conversion)
        let {
            sa_business_activities_turnover = [],
            sa_product_services_turnover = [],
            sa_locations_plants_offices = {},
            sa_markets_served = {},
            sa_employee_details = {},
            sa_workers_details = {},
            sa_differently_abled_details = {},
            sa_women_representation_details = {},
            sa_turnover_rate = {},
            sa_holding_subsidiary_associate_companies = [],
            sa_csr_applicable = false,
            sa_csr_turnover, // No default here, handle '' to null below
            sa_csr_net_worth, // No default here, handle '' to null below
            sa_transparency_complaints = {}
        } = sectionAData;
        
        // Convert empty strings to null for specific numeric fields
        sa_csr_turnover = (sectionAData.sa_csr_turnover === '' || sectionAData.sa_csr_turnover === undefined) ? null : sectionAData.sa_csr_turnover;
        sa_csr_net_worth = (sectionAData.sa_csr_net_worth === '' || sectionAData.sa_csr_net_worth === undefined) ? null : sectionAData.sa_csr_net_worth;
        
        // Construct a query that updates each JSONB column separately
        const query = `
            UPDATE brsr_reports
            SET 
                sa_business_activities_turnover = $1, 
                sa_product_services_turnover = $2,
                sa_locations_plants_offices = $3,
                sa_markets_served = $4,
                sa_employee_details = $5,
                sa_workers_details = $6, 
                sa_differently_abled_details = $7,
                sa_women_representation_details = $8,
                sa_turnover_rate = $9,
                sa_holding_subsidiary_associate_companies = $10,
                sa_csr_applicable = $11,
                sa_csr_turnover = $12,
                sa_csr_net_worth = $13,
                sa_transparency_complaints = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND company_id = $16 AND status != 'submitted'
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [
            sa_business_activities_turnover,
            sa_product_services_turnover,
            sa_locations_plants_offices,
            sa_markets_served,
            sa_employee_details,
            sa_workers_details,
            sa_differently_abled_details,
            sa_women_representation_details,
            sa_turnover_rate,
            sa_holding_subsidiary_associate_companies,
            sa_csr_applicable,
            sa_csr_turnover, // Pass the potentially modified value (null or original)
            sa_csr_net_worth, // Pass the potentially modified value (null or original)
            sa_transparency_complaints,
            reportId,
            company_id
        ]);
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                message: 'Report not found, not owned by your company, or already submitted.' 
            });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating Section A data for report ${reportId}:`, error);
        res.status(500).json({ 
            message: 'Failed to update Section A data.', 
            error: error.message 
        });
    }
});

// Endpoint to update only Section A data (individual sa_ columns)
router.post('/:reportId/section-a', authMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const sectionAData = req.body; // This is the flat object with sa_ keys from SectionAForm's formData

    // Validate that sectionAData is an object
    if (typeof sectionAData !== 'object' || sectionAData === null) {
        return res.status(400).json({ message: "Invalid Section A data format." });
    }

    // Convert empty strings for specific numeric fields to null for DB
    if (sectionAData.sa_csr_turnover === "") {
        sectionAData.sa_csr_turnover = null;
    }
    if (sectionAData.sa_csr_net_worth === "") {
        sectionAData.sa_csr_net_worth = null;
    }

    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    for (const key in sectionAData) {
        if (Object.prototype.hasOwnProperty.call(sectionAData, key) && key.startsWith('sa_')) {
            let valueToStore = sectionAData[key];
            // For array/object types, stringify them before storing if they aren't already strings
            if (typeof valueToStore === 'object' && valueToStore !== null) {
                valueToStore = JSON.stringify(valueToStore);
            }
            updateFields.push(`${key} = $${valueIndex++}`);
            updateValues.push(valueToStore);
        }
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: "No Section A data provided for update." });
    }

    const updateQuery = `UPDATE brsr_reports SET ${updateFields.join(', ')} WHERE id = $${valueIndex} AND company_id = $${valueIndex + 1}`;
    updateValues.push(reportId, req.user.company_id);

    try {
        await pool.query(updateQuery, updateValues);

        // After successful update, fetch the complete report to return it
        const updatedReportResult = await pool.query(
            `SELECT r.*, c.name as company_name, c.cin as company_cin 
             FROM brsr_reports r
             JOIN companies c ON r.company_id = c.id
             WHERE r.id = $1 AND r.company_id = $2`,
            [reportId, req.user.company_id]
        );

        if (updatedReportResult.rows.length === 0) {
            return res.status(404).json({ message: "Report not found after update." });
        }
        
        let fullReportData = updatedReportResult.rows[0];
        
        fullReportData.section_a_data = {};
        // TODO: Initialize section_b_data, section_c_data if they are also to be reconstructed

        for (const key in fullReportData) {
            let value = fullReportData[key];
            if (key.startsWith('sa_')) {
                if (arrayTypeSAKeys.includes(key)) {
                    if (typeof value === 'string') {
                        try { value = JSON.parse(value); } catch (e) { value = []; }
                    }
                    if (!Array.isArray(value)) value = [];
                } else if (objectTypeSAKeys.includes(key)) {
                    if (typeof value === 'string') {
                        try { value = JSON.parse(value); } catch (e) { value = {}; }
                    }
                    if (typeof value !== 'object' || value === null) value = {};
                }
                fullReportData.section_a_data[key] = value;
            }
            // TODO: Reconstruct section_b_data and section_c_data similarly if needed
        }
        // Optionally remove flat sa_ keys from root if fully represented in section_a_data
        // Object.keys(fullReportData).forEach(key => {
        //     if (key.startsWith('sa_') && key in fullReportData.section_a_data) {
        //         delete fullReportData[key];
        //     }
        // });

        res.json(fullReportData); 
    } catch (error) {
        console.error("Error updating Section A data:", error);
        // Check for specific PostgreSQL errors if needed, e.g., error.code
        res.status(500).json({ message: "Failed to update Section A data", error: error.message });
    }
});

module.exports = router;
