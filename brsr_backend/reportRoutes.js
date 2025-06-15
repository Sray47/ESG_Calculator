// filepath: c:\\Users\\USER\\ESG_Calculator\\brsr_backend\\reportRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const authMiddleware = require('./authMiddleware');
const { 
  validateReportUpdate, 
  validateSectionUpdate, 
  validatePdfGeneration,
  validateReportId 
} = require('./validationMiddleware');
const calculateDerivedValues = require('./calculateDerivedValues');
const { generateBRSRPdf } = require('./pdfGenerator_fixed');
const calculateESGScores = require('./scoringCalculator');

// GET all reports for a company
router.get('/', authMiddleware, async (req, res) => {
    const company_id = req.company?.id;
    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }
    try {
        const query = `SELECT id, company_id, financial_year, reporting_boundary, status, updated_at FROM brsr_reports WHERE company_id = $1 ORDER BY financial_year DESC, updated_at DESC;`;
        const { rows } = await pool.query(query, [company_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching reports list:', error);
        res.status(500).json({ message: 'Failed to fetch reports list.', error: error.message });
    }
});

// GET a specific report by ID
router.get('/:reportId', authMiddleware, validateReportId, async (req, res) => {
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
        const reportResponse = { ...reportFromDb };
        // Simple parsing for front-end convenience
        if (reportFromDb.sb_policy_management && typeof reportFromDb.sb_policy_management === 'string') {
            try {
                reportResponse.section_b_data = JSON.parse(reportFromDb.sb_policy_management);
            } catch(e) { console.error(e); }
        }
        res.json(reportResponse);
    } catch (error) {
        console.error(`Error fetching report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to fetch report.', error: error.message });
    }
});


// PUT /api/reports/:reportId - Update an existing BRSR report
router.put('/:reportId', authMiddleware, validateSectionUpdate, async (req, res) => {
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
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    const allowedFields = [
        'financial_year',
        'reporting_boundary',
        'status',
        'sb_policy_management',
        'sc_p1_ethical_conduct',
        'sc_p2_sustainable_safe_goods',
        'sc_p3_employee_wellbeing',
        'sc_p4_stakeholder_responsiveness',
        'sc_p5_human_rights',
        'sc_p6_environment_protection',
        'sc_p7_policy_advocacy',
        'sc_p8_inclusive_growth',
        'sc_p9_consumer_value',
        // Section A fields (from table definition)
        'sa_business_activities_turnover',
        'sa_product_services_turnover',
        'sa_locations_plants_offices',
        'sa_markets_served',
        'sa_employee_details',
        'sa_women_representation_details',
        'sa_turnover_rate',
        'sa_workers_details',
        'sa_differently_abled_details',
        'sa_holding_subsidiary_associate_companies',
        'sa_csr_applicable',
        'sa_csr_turnover',
        'sa_csr_net_worth',
        'sa_transparency_complaints'
    ];
    for (const key in dataToUpdate) {
        if (allowedFields.includes(key)) {
            updateFields.push(`${key} = $${valueIndex++}`);
            values.push(typeof dataToUpdate[key] === 'object' ? JSON.stringify(dataToUpdate[key]) : dataToUpdate[key]);
        }
    }
    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(reportId, company_id);
    const query = `UPDATE brsr_reports SET ${updateFields.join(', ')} WHERE id = $${valueIndex++} AND company_id = $${valueIndex++} AND (status = 'draft' OR status = 'InProgress' OR status IS NULL) RETURNING *;`;
    try {
        const { rows } = await pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or not in a modifiable state.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error updating report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to update report.', error: error.message });
    }
});

// --- NEW, CORRECTED SUBMIT ENDPOINT ---
// POST /api/reports/:reportId/submit
router.post('/:reportId/submit', authMiddleware, validateReportId, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }

    try {
        // --- Phase 1: Fetch current report and company data ---
        const reportQuery = `SELECT * FROM brsr_reports WHERE id = $1 AND company_id = $2 AND (status = 'draft' OR status = 'InProgress')`;
        const companyQuery = `SELECT * FROM companies WHERE id = $1`;
        
        const { rows: reportRows } = await pool.query(reportQuery, [reportId, company_id]);
        if (reportRows.length === 0) {
            return res.status(404).json({ message: 'Report not found or not in a submittable state.' });
        }
        const report = reportRows[0];

        const { rows: companyRows } = await pool.query(companyQuery, [company_id]);
        if (companyRows.length === 0) {
            return res.status(404).json({ message: 'Company information not found.' });
        }
        const company = companyRows[0];

        // --- Phase 2: Calculate scores and fetch previous year's score ---
        const calculatedData = calculateDerivedValues(report);
        const scoringData = calculateESGScores(report);
        
        const currentYear = parseInt(report.financial_year.split('-')[0]);
        const previousFinancialYear = `${currentYear - 1}-${currentYear}`;
        
        console.log(`DEBUG: Current financial year: ${report.financial_year}`);
        console.log(`DEBUG: Looking for previous year: ${previousFinancialYear}`);
        console.log(`DEBUG: Company ID: ${company_id}`);
        
        // --- FIX: Also fetch esg_score_environment, esg_score_social, esg_score_governance
        const prevYearQuery = `SELECT total_esg_score, esg_score_environment, esg_score_social, esg_score_governance FROM brsr_reports WHERE company_id = $1 AND financial_year = $2 AND status = 'submitted'`;
        const { rows: prevYearRows } = await pool.query(prevYearQuery, [company_id, previousFinancialYear]);
        
        console.log(`DEBUG: Previous year query returned ${prevYearRows.length} rows`);
        if (prevYearRows.length > 0) {
            console.log(`DEBUG: Previous year score found: ${prevYearRows[0].total_esg_score}`);
        } else {
            console.log(`DEBUG: No previous year data found. Checking what data exists for this company...`);
            const debugQuery = `SELECT financial_year, status, total_esg_score FROM brsr_reports WHERE company_id = $1 ORDER BY financial_year`;
            const { rows: debugRows } = await pool.query(debugQuery, [company_id]);
            console.log('DEBUG: All reports for this company:', debugRows);
        }
        
        // --- FIX: Set previousYearScore and previousYearPillarScores for PDF dashboard compatibility ---
        scoringData.previousYearScore = prevYearRows.length > 0 ? prevYearRows[0].total_esg_score : null;
        scoringData.previousYearPillarScores = prevYearRows.length > 0 ? {
          environment: prevYearRows[0].esg_score_environment,
          social: prevYearRows[0].esg_score_social,
          governance: prevYearRows[0].esg_score_governance
        } : null;        
        // --- Phase 4: Update database with score and status (PDF generated on-demand) ---
        const updateQuery = `
            UPDATE brsr_reports 
            SET status = 'submitted', 
                submitted_at = CURRENT_TIMESTAMP, 
                total_esg_score = $1,
                esg_score_environment = $2,
                esg_score_social = $3,
                esg_score_governance = $4,
                pdf_generated = TRUE
            WHERE id = $5 AND company_id = $6
            RETURNING *;
        `;
        await pool.query(updateQuery, [scoringData.totalScore, scoringData.environmentScore, scoringData.socialScore, scoringData.governanceScore, reportId, company_id]);

        res.json({ 
            message: 'Report submitted successfully. PDF will be generated on-demand.', 
            pdfUrl: `/api/reports/${reportId}/pdf`,
            scoringData: scoringData 
        });

    } catch (error) {
        console.error(`Error submitting report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to submit report and generate PDF.', error: error.message });
    }
});

// GET /api/reports/:reportId/pdf - Generate PDF on-demand
router.get('/:reportId/pdf', authMiddleware, validatePdfGeneration, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;

    if (!company_id) {
        return res.status(400).json({ message: 'Company information not found.' });
    }

    try {
        // Step 1: Fetch all necessary data for the PDF
        const reportQuery = `SELECT * FROM brsr_reports WHERE id = $1 AND company_id = $2 AND status = 'submitted'`;
        const { rows: reportRows } = await pool.query(reportQuery, [reportId, company_id]);

        if (reportRows.length === 0) {
            return res.status(404).json({ message: 'Submitted report not found or access denied.' });
        }
        const report = reportRows[0];

        const companyQuery = `SELECT * FROM companies WHERE id = $1`;
        const { rows: companyRows } = await pool.query(companyQuery, [company_id]);
        const company = companyRows[0];
        
        // Step 2: Recalculate derived values and scores for the PDF
        const calculatedData = require('./calculateDerivedValues')(report);
        const scoringData = require('./scoringCalculator')(report);
        
        // Fetch previous year data for scoring chart
        const currentYear = parseInt(report.financial_year.split('-')[0]);
        const previousFinancialYear = `${currentYear - 1}-${currentYear}`;
        const prevYearQuery = `SELECT total_esg_score, esg_score_environment, esg_score_social, esg_score_governance FROM brsr_reports WHERE company_id = $1 AND financial_year = $2 AND status = 'submitted'`;
        const { rows: prevYearRows } = await pool.query(prevYearQuery, [company_id, previousFinancialYear]);
        
        scoringData.previousYearScore = prevYearRows.length > 0 ? prevYearRows[0].total_esg_score : null;
        scoringData.previousYearPillarScores = prevYearRows.length > 0 ? {
          environment: prevYearRows[0].esg_score_environment,
          social: prevYearRows[0].esg_score_social,
          governance: prevYearRows[0].esg_score_governance
        } : null;
        
        // Step 3: Generate PDF in memory (as a buffer)
        const reportDataForPdf = { ...report };
        if (typeof report.sb_policy_management === 'string') {
           try {
               reportDataForPdf.sb_policy_management = JSON.parse(report.sb_policy_management);
           } catch (e) { console.error("PDF Gen: Failed to parse sb_policy_management"); }
        }

        const pdfBuffer = await require('./pdfGenerator_fixed').generateBRSRPdf({
            // NO outputPath - this makes it return a buffer
            reportData: reportDataForPdf,
            companyData: company,
            calculatedData: calculatedData,
            scoringData: scoringData
        });

        // Step 4: Stream the buffer to the client as a download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=BRSR_Report_${reportId}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error(`Error generating PDF for report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to generate PDF.', error: error.message });
    }
});

// POST /api/reports/initiate
router.post('/initiate', authMiddleware, async (req, res) => {
    const { financial_year, reporting_boundary } = req.body;
    const companyId = req.company?.id;

    if (!companyId) {
        return res.status(403).json({ message: 'User does not have an associated company profile.' });
    }
    if (!financial_year || !reporting_boundary) {
        return res.status(400).json({ message: 'Financial year and reporting boundary are required.' });
    }
    
    try {
        const checkExistingQuery = `SELECT id, status FROM brsr_reports WHERE company_id = $1 AND financial_year = $2`;
        const { rows: existingRows } = await pool.query(checkExistingQuery, [companyId, financial_year]);
        
        if (existingRows.length > 0) {
            const { id, status } = existingRows[0];
            if (status === 'InProgress' || status === 'draft') {
                const updateQuery = `UPDATE brsr_reports SET reporting_boundary = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`;
                const { rows: updatedRows } = await pool.query(updateQuery, [reporting_boundary, id]);
                return res.status(200).json({ ...updatedRows[0], message: 'Updated existing report.' });
            } else {
                return res.status(409).json({ message: `A report for ${financial_year} already exists with status: ${status}.`, reportId: id });
            }
        }
        
        const newReportQuery = `INSERT INTO brsr_reports (company_id, financial_year, reporting_boundary, status) VALUES ($1, $2, $3, 'InProgress') RETURNING *;`;
        const { rows: newRows } = await pool.query(newReportQuery, [companyId, financial_year, reporting_boundary]);
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error(`Error initiating report:`, error);
        if (error.code === '23505') {
            return res.status(409).json({ message: `A report for company ID ${companyId} with financial year ${financial_year} already exists.` });
        }
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


module.exports = router;
