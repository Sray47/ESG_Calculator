// filepath: c:\\Users\\USER\\ESG_Calculator\\brsr_backend\\reportRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const authMiddleware = require('./authMiddleware');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const calculateDerivedValues = require('./calculateDerivedValues');
// Use the fixed PDF generator implementation
const { generateBRSRPdf } = require('./pdfGenerator_fixed');

// GET all reports for a company (for PreviousReportsPage)
router.get('/', authMiddleware, async (req, res) => {
    const company_id = req.company?.id;
    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }
    try {
        const query = `
            SELECT id, company_id, financial_year, reporting_boundary, status, updated_at 
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
        }        const reportFromDb = rows[0];
        const sectionAData = {};
        const sectionBData = {};
        const reportResponse = {}; // reportResponse will hold non-section A/B data

        for (const key in reportFromDb) {
            if (reportFromDb.hasOwnProperty(key)) {
                if (key.startsWith('sa_')) { // Collect all sa_ prefixed keys into sectionAData
                    sectionAData[key] = reportFromDb[key];
                } else if (key === 'brsr_report_data') { // If there's a JSON blob for section A
                    let parsedSectionA = {};
                    if (typeof reportFromDb[key] === 'string') {
                        try { parsedSectionA = JSON.parse(reportFromDb[key]); }
                        catch (e) { console.error('Error parsing brsr_report_data in GET /:reportId (first instance):', e); }
                    } else if (typeof reportFromDb[key] === 'object' && reportFromDb[key] !== null) {
                        parsedSectionA = reportFromDb[key];
                    }
                    // Merge with any existing sa_ fields, parsed data takes precedence
                    Object.assign(sectionAData, parsedSectionA);
                } else if (key === 'sb_policy_management' && reportFromDb[key]) { // Section B data stored in sb_policy_management
                    let parsedSectionB = {};
                    if (typeof reportFromDb[key] === 'string') {
                        try { parsedSectionB = JSON.parse(reportFromDb[key]); }
                        catch (e) { console.error('Error parsing sb_policy_management in GET /:reportId:', e); }
                    } else if (typeof reportFromDb[key] === 'object' && reportFromDb[key] !== null) {
                        parsedSectionB = reportFromDb[key];
                    }
                    Object.assign(sectionBData, parsedSectionB);
                } else if (key.startsWith('sb_')) { // Other sb_ fields (if any individual fields are used)
                    // For now, we're storing all Section B data in sb_policy_management
                    // But if there are individual sb_ fields, they could be handled here
                    reportResponse[key] = reportFromDb[key];
                } else { // Other fields go to reportResponse
                    reportResponse[key] = reportFromDb[key];
                }
            }
        }
        reportResponse.section_a_data = sectionAData;
        reportResponse.section_b_data = sectionBData;
        // Remove brsr_report_data from the main object if it was copied and processed
        delete reportResponse.brsr_report_data;

        res.json(reportResponse);
    } catch (error) {
        console.error(`Error fetching report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to fetch report.', error: error.message });
    }
});

// PUT /api/reports/:reportId - Update an existing BRSR report (for wizard steps)
router.put('/:reportId', authMiddleware, async (req, res) => {
    // Ensure reportId and company_id are numbers to avoid type mismatch with int8 columns
    const reportId = Number(req.params.reportId);
    const company_id = Number(req.company?.id);
    let dataToUpdate = req.body; // e.g., { section_a_data: { ... }, section_b_data: { ... } }

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: 'No data provided for update.' });
    }
    
    // Debug log to see what data is being sent
    console.log('PUT /:reportId - Data to update:', JSON.stringify(dataToUpdate, null, 2));

    // Handle section_a_data specially
    if (dataToUpdate.section_a_data) {
        console.log('Found section_a_data in update payload for report:', reportId);
        
        const sectionAData = dataToUpdate.section_a_data;
        
        try {
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            
            // Filter fields that start with sa_ to ensure we only update valid database columns
            // Also, handle brsr_report_data if it's the main store for Section A
            let hasSectionAFields = false;

            for (const field in sectionAData) {
                if (sectionAData.hasOwnProperty(field)) {
                    if (field.startsWith('sa_')) {
                        updateFields.push(`${field} = $${paramIndex++}`);
                        if (typeof sectionAData[field] === 'object' && sectionAData[field] !== null) {
                            values.push(JSON.stringify(sectionAData[field])); // Stringify objects for JSONB
                        } else {
                            values.push(sectionAData[field]); // Push other types directly
                        }
                        hasSectionAFields = true;
                    } else if (field === 'brsr_report_data') { // If section_a_data is a blob
                         updateFields.push(`brsr_report_data = $${paramIndex++}`);
                         if (typeof sectionAData[field] === 'object' && sectionAData[field] !== null) {
                            values.push(JSON.stringify(sectionAData[field]));
                         } else {
                            values.push(sectionAData[field]); // Should be a JSON string or object
                         }
                         hasSectionAFields = true;
                    }
                }
            }
            
            if (!hasSectionAFields) {
                 console.warn('No valid Section A fields (sa_ or brsr_report_data) found in section_a_data payload for report:', reportId);
                // Do not return error, proceed to update other sections if any.
                // If only section_a_data was provided and it had no valid fields, then the generic update logic later will handle it.
            } else {
                values.push(reportId);
                values.push(company_id);
                
                const query = `
                    UPDATE brsr_reports
                    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
                    RETURNING *;
                `;
                
                console.log('Executing Section A update query for report:', reportId, query);
                console.log('With values:', values);
                
                const { rows } = await pool.query(query, values);
                
                if (rows.length === 0) {
                    return res.status(404).json({ 
                        message: 'Report not found, not owned by your company, or already submitted (Section A update).' 
                    });
                }
                
                // Remove section_a_data from dataToUpdate as it's handled
                delete dataToUpdate.section_a_data;

                // If no other data to update, return the result
                if (Object.keys(dataToUpdate).length === 0) {
                    return res.json(rows[0]);
                }
                // Otherwise, fall through to update other sections
            }
        } catch (error) {
            console.error(`Error updating Section A data for report ${reportId}:`, error);
            return res.status(500).json({ 
                message: 'Failed to update Section A data.', 
                error: error.message 
            });
        }    } // End of section_a_data handling

    // Handle section_b_data specially (similar to section_a_data)
    if (dataToUpdate.section_b_data) {
        console.log('Found section_b_data in update payload for report:', reportId);
        
        const sectionBData = dataToUpdate.section_b_data;
        
        try {
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            
            // Map section_b_data fields to database columns
            const sectionBFieldMapping = {
                'sb_director_statement': 'sb_policy_management',
                'sb_esg_responsible_individual': 'sb_governance_leadership_oversight', 
                'sb_sustainability_committee': 'sb_review_of_ngrbcs',
                'sb_principle_policies': 'sb_independent_assessment',
                'sb_ngrbc_company_review': 'sb_non_coverage_reasons',
                'sb_external_policy_assessment': 'sb_policy_management' // This might need adjustment based on actual structure
            };
            
            // For Section B, we store the entire object as JSON in specific columns
            // Based on the database schema, we have these sb_ columns available
            const availableSbColumns = [
                'sb_policy_management',
                'sb_governance_leadership_oversight', 
                'sb_review_of_ngrbcs',
                'sb_independent_assessment',
                'sb_non_coverage_reasons'
            ];
            
            // Store the entire section_b_data in sb_policy_management as the main container
            // This follows a similar pattern to how some section data might be stored
            updateFields.push(`sb_policy_management = $${paramIndex++}`);
            values.push(JSON.stringify(sectionBData));
            
            if (updateFields.length > 0) {
                values.push(reportId);
                values.push(company_id);
                
                const query = `
                    UPDATE brsr_reports
                    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
                    RETURNING *;
                `;
                
                console.log('Executing Section B update query for report:', reportId, query);
                console.log('With values:', values);
                
                const { rows } = await pool.query(query, values);
                
                if (rows.length === 0) {
                    return res.status(404).json({ 
                        message: 'Report not found, not owned by your company, or already submitted (Section B update).' 
                    });
                }
                
                // Remove section_b_data from dataToUpdate as it's handled
                delete dataToUpdate.section_b_data;

                // If no other data to update, return the result
                if (Object.keys(dataToUpdate).length === 0) {
                    return res.json(rows[0]);
                }
                // Otherwise, fall through to update other sections
            }
        } catch (error) {
            console.error(`Error updating Section B data for report ${reportId}:`, error);
            return res.status(500).json({ 
                message: 'Failed to update Section B data.', 
                error: error.message 
            });
        }
    } // End of section_b_data handling

    // Generic update for other sections (C, status, etc.)
    // This part will execute if section_a_data and section_b_data were not present, or if they were present and successfully updated,
    // and there are still other fields in dataToUpdate.
    if (Object.keys(dataToUpdate).length > 0) {
        const updateFields = [];
        const values = [];
        let valueIndex = 1;        const allowedFields = [
            'financial_year', 'reporting_boundary', 'status',
            'sb_policy_management', 'sb_governance_leadership_oversight', 'sb_review_of_ngrbcs',
            'sb_independent_assessment', 'sb_non_coverage_reason',
            'sc_p1_ethical_conduct', 'sc_p2_sustainable_safe_goods', 'sc_p3_employee_wellbeing',
            'sc_p4_stakeholder_responsiveness', 'sc_p5_human_rights', 'sc_p6_environment_protection',
            'sc_p7_policy_advocacy', 'sc_p8_inclusive_growth', 'sc_p9_consumer_value',
            'submitted_at' // if you allow updating this separately before final submit
        ];

        for (const key in dataToUpdate) {
            if (dataToUpdate.hasOwnProperty(key) && allowedFields.includes(key)) {
                console.log(`Processing generic field: ${key} for report: ${reportId}`);
                updateFields.push(`${key} = $${valueIndex++}`);
                if (typeof dataToUpdate[key] === 'object' && dataToUpdate[key] !== null) {
                    values.push(JSON.stringify(dataToUpdate[key]));
                } else {
                    values.push(dataToUpdate[key]);
                }
            } else if (dataToUpdate.hasOwnProperty(key)) {
                console.log(`Skipping unallowed/already handled field: ${key} for report: ${reportId}`);
            }
        }

        if (updateFields.length === 0) {
            // This can happen if section_a_data was the only thing and it was processed,
            // or if only unallowed fields were sent.
            // If section_a_data was processed and returned, this won't be hit.
            // If section_a_data was processed and there were other fields, but none were allowed, this will be hit.
            // If section_a_data was not present, and no other allowed fields were present, this will be hit.
            console.log("No valid generic fields to update for report:", reportId, "Payload:", dataToUpdate);
            // Check if a response has already been sent (e.g. if section_a_data was the only thing and it failed)
            if (!res.headersSent) {
                // If section_a_data was handled and returned, this part is not reached.
                // If section_a_data was not in payload, and no other valid fields, this will be an error.
                // If section_a_data was in payload, but had no valid fields AND no other valid fields were provided, this will be an error.
                const wasSectionAProcessed = req.body.section_a_data && !dataToUpdate.section_a_data; // True if section_a_data was in original req.body and now removed from dataToUpdate
                if (wasSectionAProcessed) {
                    // This means section_a_data was processed (likely had no valid fields) and we fell through.
                    // We should probably return the current state of the report or a specific message.
                    // For now, let's assume if we are here, and updateFields is empty, it's because nothing valid was provided for generic update.
                    // A previous successful Section A update would have already returned.
                    // A failed Section A update would have already returned.
                    // So, if we are here, it means either Section A was not provided, or it was provided but had no valid fields AND no other valid fields were provided.
                    return res.status(400).json({
                        message: 'No valid fields provided for update in the generic section.',
                        details: `Provided fields in dataToUpdate: ${Object.keys(dataToUpdate).join(', ')}`
                    });
                } else {
                     // Section A was not in the original payload, and no other valid fields.
                     return res.status(400).json({
                        message: 'No valid fields provided for update.',
                        details: `Provided fields: ${Object.keys(req.body).join(', ')}`
                    });
                }
            } else {
                return; // Response already sent
            }
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(reportId);
        values.push(company_id);

        const query = `
            UPDATE brsr_reports 
            SET ${updateFields.join(', ')} 
            WHERE id = $${valueIndex++} AND company_id = $${valueIndex++} AND (status = 'draft' OR status = 'InProgress' OR status IS NULL)
            RETURNING *;
        `;

        console.log('Executing generic update query for report:', reportId, query);
        console.log('With values:', values);

        try {
            const { rows } = await pool.query(query, values);
            if (rows.length === 0) {
                if (!res.headersSent) {
                    return res.status(404).json({ message: 'Report not found, not owned by your company, or not in draft status (Generic update).' });
                } else {
                    return;
                }
            }
            if (!res.headersSent) {
                res.json(rows[0]);
            }
        } catch (error) {
            console.error(`Error updating report ${reportId} (generic part):`, error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to update report (generic part).', error: error.message });
            }
        }
    } else if (!req.body.section_a_data && Object.keys(dataToUpdate).length === 0) {
        // This case means section_a_data was not in the original request, and dataToUpdate is now empty
        // (e.g. original payload had only unallowed fields).
        if (!res.headersSent) {
             return res.status(400).json({ message: 'No valid fields provided for update. Original payload had no processable fields.' });
        }
    }
    // If section_a_data was processed and returned, or if generic update was processed and returned,
    // or if an error occurred and returned, this point might not be reached or res might be sent.
    // If section_a_data was processed, resulted in no DB update (e.g. no valid fields),
    // and there were no other fields to update, then we need to ensure a response.
    // The logic above tries to handle this by returning early.
    // If we reach here and headers are not sent, it implies an unhandled case.
    // However, the current structure should ensure a response is sent in most paths.
    // One edge case: section_a_data was present, had no valid fields, so it fell through.
    // Then, dataToUpdate (for generic fields) was also empty or had no valid fields.
    // The `if (updateFields.length === 0)` block in generic update should catch this.

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
            WHERE id = $1 AND company_id = $2 AND (status = 'draft' OR status = 'InProgress')
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
        const calculatedData = calculateDerivedValues(report); // Based on the original report structure
        
        // Prepare reportData for PDF generation to match pdfGenerator.js expectations
        let sectionADataForPdf = {};
        // Start with individual sa_ fields from the report object
        for (const key in report) {
            if (report.hasOwnProperty(key) && key.startsWith('sa_')) {
                sectionADataForPdf[key] = report[key];
            }
        }
        // Then, merge/override with data from brsr_report_data JSON blob
        if (report.brsr_report_data) {
            let parsedSABlob = {};
            if (typeof report.brsr_report_data === 'string') {
                try { parsedSABlob = JSON.parse(report.brsr_report_data); }
                catch (e) { console.error('Error parsing report.brsr_report_data in /submit:', e); }
            } else if (typeof report.brsr_report_data === 'object' && report.brsr_report_data !== null) {
                parsedSABlob = report.brsr_report_data;
            }
            Object.assign(sectionADataForPdf, parsedSABlob); // parsedSABlob takes precedence
        }

        let sectionBDataForPdf = {};
        if (report.sb_policy_management) {
            if (typeof report.sb_policy_management === 'string') {
                try { sectionBDataForPdf = JSON.parse(report.sb_policy_management); }
                catch (e) { console.error('Error parsing report.sb_policy_management in /submit:', e); }
            } else if (typeof report.sb_policy_management === 'object' && report.sb_policy_management !== null) {
                sectionBDataForPdf = report.sb_policy_management;
            }
        }

        const reportDataForPdf = {
            ...report, // Spread original report data (includes sc_p* fields, financial_year etc.)
            section_a_data: sectionADataForPdf,
            section_b_data: sectionBDataForPdf
        };

        // Log the data that will be sent to the PDF generator for debugging
        console.log('PDF Generation - Data sent to generateBRSRPdf:', JSON.stringify({
            reportData: reportDataForPdf,
            companyData: company,
            calculatedData: calculatedData
        }, null, 2));
        
        // Generate PDF with calculated values
        const pdfDir = path.join(__dirname, 'pdfs');
        const pdfPath = path.join(pdfDir, `brsr_report_${reportId}.pdf`);
        fs.mkdirSync(pdfDir, { recursive: true });
        try {
            // Generate the PDF document with all calculated values
            await generateBRSRPdf({
                outputPath: pdfPath,
                reportData: reportDataForPdf, // Use the prepared data structure
                companyData: company,
                calculatedData: calculatedData
            });

            // Set pdf_generated = true in the database
            await pool.query(
                'UPDATE brsr_reports SET pdf_generated = TRUE WHERE id = $1',
                [reportId]
            );

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
                const calculatedData = calculateDerivedValues(report); // Based on the original report structure
                
                // Prepare reportData for PDF generation
                let sectionADataForPdf = {};
                // Start with individual sa_ fields
                for (const key in report) {
                    if (report.hasOwnProperty(key) && key.startsWith('sa_')) {
                        sectionADataForPdf[key] = report[key];
                    }
                }
                // Then, merge/override with data from brsr_report_data JSON blob
                if (report.brsr_report_data) {
                    let parsedSABlob = {};
                    if (typeof report.brsr_report_data === 'string') {
                        try { parsedSABlob = JSON.parse(report.brsr_report_data); }
                        catch (e) { console.error('Error parsing report.brsr_report_data in /pdf (on-the-fly):', e); }
                    } else if (typeof report.brsr_report_data === 'object' && report.brsr_report_data !== null) {
                        parsedSABlob = report.brsr_report_data;
                    }
                    Object.assign(sectionADataForPdf, parsedSABlob); // parsedSABlob takes precedence
                }

                let sectionBDataForPdf = {};
                if (report.sb_policy_management) {
                    if (typeof report.sb_policy_management === 'string') {
                        try { sectionBDataForPdf = JSON.parse(report.sb_policy_management); }
                        catch (e) { console.error('Error parsing report.sb_policy_management in /pdf (on-the-fly):', e); }
                    } else if (typeof report.sb_policy_management === 'object' && report.sb_policy_management !== null) {
                        sectionBDataForPdf = report.sb_policy_management;
                    }
                }

                const reportDataForPdf = {
                    ...report, // Spread original report data
                    section_a_data: sectionADataForPdf,
                    section_b_data: sectionBDataForPdf
                };

                // Ensure directory exists
                fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
                
                // Generate PDF
                await generateBRSRPdf({
                    outputPath: pdfPath,
                    reportData: reportDataForPdf, // Use the prepared data structure
                    companyData: company,
                    calculatedData: calculatedData
                });
                
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
            return res.status(404).json({ message: 'Report details not found or access denied.' });
        }

        const reportDetails = result.rows[0];
          // Structure the response to be more frontend-friendly if needed
        // For example, nest company data under a 'company' key
        // Construct section_a_data from individual fields
        res.json(reportDetails);

    } catch (error) {
        console.error(`Error fetching details for report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to fetch report details.', error: error.message });
    }
});

/*
// PDF generation endpoint
router.get('/:id/pdf', authMiddleware, async (req, res) => {
    try {
        const reportId = req.params.id;
        // Fetch the report row
        const reportQuery = 'SELECT * FROM brsr_reports WHERE id = $1';
        const reportResult = await pool.query(reportQuery, [reportId]);
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const reportRow = reportResult.rows[0];

        // Fetch company data (if needed)
        const companyQuery = 'SELECT * FROM companies WHERE id = $1';
        const companyResult = await pool.query(companyQuery, [reportRow.company_id]);
        const companyData = companyResult.rows[0] || {};

        // Reconstruct reportContent with all sections for PDF generation
        const reportContent = {
            // Section A
            reporting_boundary: reportRow.reporting_boundary,
            sa_business_activities_turnover: reportRow.sa_business_activities_turnover,
            sa_product_services_turnover: reportRow.sa_product_services_turnover,
            sa_locations_plants_offices: reportRow.sa_locations_plants_offices,
            sa_markets_served: reportRow.sa_markets_served,
            sa_employee_details: reportRow.sa_employee_details,
            sa_workers_details: reportRow.sa_workers_details,
            sa_differently_abled_details: reportRow.sa_differently_abled_details,
            sa_women_representation_details: reportRow.sa_women_representation_details,
            // Section B
            section_b_data: reportRow.section_b_data || reportRow.sb_policy_management,
            // Section C (Principles 1-9)
            sc_p1_ethical_conduct: reportRow.sc_p1_ethical_conduct,
            sc_p2_sustainable_safe_goods: reportRow.sc_p2_sustainable_safe_goods,
            sc_p3_employee_wellbeing: reportRow.sc_p3_employee_wellbeing,
            sc_p4_stakeholder_responsiveness: reportRow.sc_p4_stakeholder_responsiveness,
            sc_p5_human_rights: reportRow.sc_p5_human_rights,
            sc_p6_environment_protection: reportRow.sc_p6_environment_protection,
            sc_p7_policy_advocacy: reportRow.sc_p7_policy_advocacy,
            sc_p8_inclusive_growth: reportRow.sc_p8_inclusive_growth,
            sc_p9_customer_value: reportRow.sc_p9_customer_value,
            // Section C indicators (if stored separately)
            sc_p3_essential_indicators: reportRow.sc_p3_essential_indicators,
            sc_p6_essential_indicators: reportRow.sc_p6_essential_indicators,
            sc_p7_essential_indicators: reportRow.sc_p7_essential_indicators,
            sc_p7_leadership_indicators: reportRow.sc_p7_leadership_indicators,
            // Add any other keys as needed
        };
        console.log('PDF Generation: reportContent structure:', Object.keys(reportContent));
        await generateBRSRPdf({
            outputPath: pdfPath, // pdfPath is not defined in this scope
            reportData: reportContent,
            companyData: companyData,
            calculatedData: calculateDerivedValues(reportContent)
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=brsr_report_${reportId}.pdf`);
        res.send(pdfBuffer); // pdfBuffer is not defined
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
*/

module.exports = router;
