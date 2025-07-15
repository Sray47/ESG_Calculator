// reportRoutes_safe.js - Report routes without PDF/Chart dependencies
const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const authMiddleware = require('./authMiddleware');
const { 
  validateReportUpdate, 
  validateSectionUpdate, 
  validateReportId 
} = require('./validationMiddleware');
const calculateDerivedValues = require('./calculateDerivedValues');
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

// GET a specific report
router.get('/:reportId', authMiddleware, validateReportId, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;
    
    try {
        const query = `SELECT * FROM brsr_reports WHERE id = $1 AND company_id = $2;`;
        const { rows } = await pool.query(query, [reportId, company_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error fetching report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to fetch report.', error: error.message });
    }
});

// POST - Create a new report
router.post('/', authMiddleware, async (req, res) => {
    const { financial_year, reporting_boundary } = req.body;
    const company_id = req.company?.id;

    if (!financial_year || !reporting_boundary) {
        return res.status(400).json({ message: 'Financial year and reporting boundary are required.' });
    }

    try {
        // Check if report already exists for this company and financial year
        const existingQuery = `SELECT id FROM brsr_reports WHERE company_id = $1 AND financial_year = $2;`;
        const existing = await pool.query(existingQuery, [company_id, financial_year]);
        
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'Report for this financial year already exists.' });
        }

        const insertQuery = `
            INSERT INTO brsr_reports (company_id, financial_year, reporting_boundary, status, created_at, updated_at)
            VALUES ($1, $2, $3, 'draft', NOW(), NOW())
            RETURNING *;
        `;
        
        const { rows } = await pool.query(insertQuery, [company_id, financial_year, reporting_boundary]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Failed to create report.', error: error.message });
    }
});

// POST /api/reports/initiate - Create a new report (legacy endpoint for compatibility)
router.post('/initiate', authMiddleware, async (req, res) => {
    const { financial_year, reporting_boundary } = req.body;
    const company_id = req.company?.id;

    if (!company_id) {
        return res.status(403).json({ message: 'User does not have an associated company profile.' });
    }

    if (!financial_year || !reporting_boundary) {
        return res.status(400).json({ message: 'Financial year and reporting boundary are required.' });
    }

    try {
        // Check if report already exists for this company and financial year
        const checkExistingQuery = `SELECT id, status FROM brsr_reports WHERE company_id = $1 AND financial_year = $2`;
        const { rows: existingRows } = await pool.query(checkExistingQuery, [company_id, financial_year]);
        
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
        const { rows: newRows } = await pool.query(newReportQuery, [company_id, financial_year, reporting_boundary]);
        res.status(201).json(newRows[0]);
    } catch (error) {
        console.error(`Error initiating report:`, error);
        if (error.code === '23505') {
            return res.status(409).json({ message: `A report for company ID ${company_id} with financial year ${financial_year} already exists.` });
        }
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

// PUT - Update a report
router.put('/:reportId', authMiddleware, validateReportId, validateReportUpdate, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;
    const updateData = req.body;

    try {
        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updateData)) {
            if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
                updateFields.push(`${key} = $${paramCount++}`);
                values.push(value);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(reportId, company_id);

        const updateQuery = `
            UPDATE brsr_reports 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount++} AND company_id = $${paramCount++}
            RETURNING *;
        `;

        const { rows } = await pool.query(updateQuery, values);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        // Calculate derived values
        const updatedReport = rows[0];
        const calculatedData = calculateDerivedValues(updatedReport);
        const scoringData = calculateESGScores(updatedReport);

        res.json({
            ...updatedReport,
            calculated_values: calculatedData,
            esg_scores: scoringData
        });
    } catch (error) {
        console.error(`Error updating report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to update report.', error: error.message });
    }
});

// DELETE a report
router.delete('/:reportId', authMiddleware, validateReportId, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;

    try {
        const deleteQuery = `DELETE FROM brsr_reports WHERE id = $1 AND company_id = $2 RETURNING id;`;
        const { rows } = await pool.query(deleteQuery, [reportId, company_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        res.json({ message: 'Report deleted successfully.', reportId: rows[0].id });
    } catch (error) {
        console.error(`Error deleting report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to delete report.', error: error.message });
    }
});

// GET report calculations (derived values and scores)
router.get('/:reportId/calculations', authMiddleware, validateReportId, async (req, res) => {
    const { reportId } = req.params;
    const company_id = req.company?.id;

    try {
        const query = `SELECT * FROM brsr_reports WHERE id = $1 AND company_id = $2;`;
        const { rows } = await pool.query(query, [reportId, company_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        const report = rows[0];
        const calculatedData = calculateDerivedValues(report);
        const scoringData = calculateESGScores(report);

        res.json({
            reportId: report.id,
            calculated_values: calculatedData,
            esg_scores: scoringData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error calculating report data for ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to calculate report data.', error: error.message });
    }
});

// PDF generation endpoint - disabled but provides informative error
router.get('/:reportId/pdf', authMiddleware, validateReportId, (req, res) => {
    res.status(503).json({
        message: 'PDF generation temporarily unavailable',
        reason: 'Canvas dependencies not available in serverless environment',
        alternative: 'Use the /calculations endpoint to get report data',
        timestamp: new Date().toISOString()
    });
});

// Update specific sections of a report
router.patch('/:reportId/section/:sectionName', authMiddleware, validateReportId, validateSectionUpdate, async (req, res) => {
    const { reportId, sectionName } = req.params;
    const company_id = req.company?.id;
    const sectionData = req.body;

    try {
        // Verify report exists and belongs to company
        const reportQuery = `SELECT id FROM brsr_reports WHERE id = $1 AND company_id = $2;`;
        const reportResult = await pool.query(reportQuery, [reportId, company_id]);
        
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        // Update the specific section
        const updateQuery = `
            UPDATE brsr_reports 
            SET ${sectionName} = $1, updated_at = NOW()
            WHERE id = $2 AND company_id = $3
            RETURNING *;
        `;

        const { rows } = await pool.query(updateQuery, [JSON.stringify(sectionData), reportId, company_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found or access denied.' });
        }

        const updatedReport = rows[0];
        const calculatedData = calculateDerivedValues(updatedReport);
        const scoringData = calculateESGScores(updatedReport);

        res.json({
            message: `Section ${sectionName} updated successfully`,
            report: updatedReport,
            calculated_values: calculatedData,
            esg_scores: scoringData
        });
    } catch (error) {
        console.error(`Error updating section ${sectionName} for report ${reportId}:`, error);
        res.status(500).json({ message: 'Failed to update report section.', error: error.message });
    }
});

module.exports = router;
