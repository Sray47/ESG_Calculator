// pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to manage Y position and add pages
function checkAndAddPage(doc, currentY, threshold = 50) {
    if (currentY > doc.page.height - doc.page.margins.bottom - threshold) {
        doc.addPage();
        // Re-apply header/footer if necessary (assuming they are added on pageAdded event or manually)
        // addHeader(doc, companyDataGlobal); // Assuming companyDataGlobal is accessible
        // addFooter(doc);
        return doc.page.margins.top;
    }
    return currentY;
}

// Placeholder for a robust drawTable function
// It should handle column widths, text wrapping, cell padding, headers, and page breaks within tables.
function drawTable(doc, table, startX, startY, tableWidth, columnLayout, options = {}) {
    let currentY = startY;
    const rowHeight = options.rowHeight || 20;
    const headerRowHeight = options.headerRowHeight || 25;
    const cellPadding = options.cellPadding || 5;
    const defaultFontSize = options.fontSize || 10;
    const headerFontSize = options.headerFontSize || 10;

    doc.font('Helvetica-Bold').fontSize(headerFontSize);

    // Calculate column widths if percentages are given
    const colWidths = columnLayout.map(col => 
        typeof col.width === 'string' && col.width.endsWith('%') 
        ? (parseFloat(col.width) / 100) * tableWidth 
        : col.width
    );

    // Draw header
    let currentX = startX;
    table.headers.forEach((header, i) => {
        doc.rect(currentX, currentY, colWidths[i], headerRowHeight).stroke();
        doc.text(header, currentX + cellPadding, currentY + cellPadding, { width: colWidths[i] - 2 * cellPadding, align: 'left' });
        currentX += colWidths[i];
    });
    currentY += headerRowHeight;

    doc.font('Helvetica').fontSize(defaultFontSize);

    // Draw rows
    table.rows.forEach(row => {
        currentY = checkAndAddPage(doc, currentY, headerRowHeight + rowHeight); // Check space for next row
        if (doc.y !== currentY && doc.y > doc.page.margins.top) { // New page was added
             // Redraw header on new page if table continues
            let tempX = startX;
            doc.font('Helvetica-Bold').fontSize(headerFontSize);
            table.headers.forEach((header, i) => {
                doc.rect(tempX, doc.y, colWidths[i], headerRowHeight).stroke();
                doc.text(header, tempX + cellPadding, doc.y + cellPadding, { width: colWidths[i] - 2 * cellPadding, align: 'left' });
                tempX += colWidths[i];
            });
            currentY = doc.y + headerRowHeight;
            doc.font('Helvetica').fontSize(defaultFontSize);
        }


        let maxHeightInRow = rowHeight;
        // Pre-calculate max height for the row if text wrapping occurs
        // This is a simplified version; a robust one would calculate actual text heights.
        row.forEach((cell, i) => {
            const textHeight = doc.heightOfString(String(cell), { width: colWidths[i] - 2 * cellPadding });
            if (textHeight > maxHeightInRow) maxHeightInRow = textHeight + (2 * cellPadding); // adjust for padding
        });
        if (maxHeightInRow < rowHeight) maxHeightInRow = rowHeight;


        currentY = checkAndAddPage(doc, currentY, maxHeightInRow);
         if (doc.y !== currentY && doc.y > doc.page.margins.top) { // New page was added
            currentY = doc.y;
             // Redraw header on new page if table continues
            let tempX = startX;
            doc.font('Helvetica-Bold').fontSize(headerFontSize);
            table.headers.forEach((header, i) => {
                doc.rect(tempX, currentY, colWidths[i], headerRowHeight).stroke();
                doc.text(header, tempX + cellPadding, currentY + cellPadding, { width: colWidths[i] - 2 * cellPadding, align: 'left' });
                tempX += colWidths[i];
            });
            currentY += headerRowHeight;
            doc.font('Helvetica').fontSize(defaultFontSize);
        }

        currentX = startX;
        row.forEach((cell, i) => {
            doc.rect(currentX, currentY, colWidths[i], maxHeightInRow).stroke();
            doc.text(String(cell !== null && cell !== undefined ? cell : ''), currentX + cellPadding, currentY + cellPadding, { width: colWidths[i] - 2 * cellPadding, align: 'left' });
            currentX += colWidths[i];
        });
        currentY += maxHeightInRow;
    });
    doc.y = currentY; // Update global Y position
    return currentY;
}


// Placeholder for renderKeyValue
function renderKeyValue(doc, key, value, startX, yPos, keyWidth = 200, valueIndent = 210) {
    doc.font('Helvetica-Bold').text(key, startX, yPos, { width: keyWidth });
    doc.font('Helvetica').text(`: ${value !== null && value !== undefined ? value : 'N/A'}`, startX + valueIndent - 10 , yPos, { width: doc.page.width - startX - valueIndent - doc.page.margins.right });
    return doc.y + 5; // Return new Y
}

// Placeholder for addSectionTitle
function addSectionTitle(doc, title, yPos, contentWidth) {
    const titleWidth = doc.widthOfString(title);
    const x = (contentWidth - titleWidth) / 2; // Center the title
    doc.font('Helvetica-Bold').fontSize(16).text(title, x, yPos, { align: 'center' });
    return doc.y + 10;
}

// Placeholder for addPrincipleTitle
function addPrincipleTitle(doc, principleNumber, title, yPos) {
    doc.font('Helvetica-Bold').fontSize(14).text(`PRINCIPLE ${principleNumber}: ${title}`, doc.page.margins.left, yPos);
    return doc.y + 10;
}
function addSubHeading(doc, text, yPos) {
    doc.font('Helvetica-Bold').fontSize(12).text(text, doc.page.margins.left, yPos);
    return doc.y + 5;
}

function addRegularText(doc, text, yPos, indent = 0) {
    doc.font('Helvetica').fontSize(10).text(text, doc.page.margins.left + indent, yPos, { align: 'justify', width: doc.page.width - doc.page.margins.left - doc.page.margins.right - indent });
    return doc.y + 5;
}


/**
 * Calculate all derived values from raw report data
 * This function implements all the mathematical formulas for automatic calculations
 * @param {Object} reportData - Raw report data from database
 * @returns {Object} - Object containing all calculated values
 */
function calculateDerivedValues(reportData) {
    const calculatedData = {};
    
    // Helper function to safely convert to number
    const toNumber = (val) => {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    // Helper function to format percentage
    const formatPercentage = (numerator, denominator) => {
        if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
            return 'N/A';
        }
        return ((toNumber(numerator) / toNumber(denominator)) * 100).toFixed(2) + '%';
    };

    // --------------------------------------------------
    // SECTION A CALCULATIONS
    // --------------------------------------------------
    calculatedData.sectionA = {};

    // Employee and Worker Totals (Q18)
    if (reportData.sa_employee_details) {
        const emp = reportData.sa_employee_details;
        calculatedData.sectionA.employeeTotals = {
            permanent_male: toNumber(emp.permanent_male_no),
            permanent_female: toNumber(emp.permanent_female_no),
            permanent_total: toNumber(emp.permanent_male_no) + toNumber(emp.permanent_female_no),
            other_male: toNumber(emp.other_male_no),
            other_female: toNumber(emp.other_female_no),
            other_total: toNumber(emp.other_male_no) + toNumber(emp.other_female_no),
            grand_total_male: toNumber(emp.permanent_male_no) + toNumber(emp.other_male_no),
            grand_total_female: toNumber(emp.permanent_female_no) + toNumber(emp.other_female_no),
            grand_total: (toNumber(emp.permanent_male_no) + toNumber(emp.other_male_no)) + (toNumber(emp.permanent_female_no) + toNumber(emp.other_female_no)),
        };
    }

    if (reportData.sa_workers_details) {
        const wrk = reportData.sa_workers_details;
         calculatedData.sectionA.workerTotals = {
            permanent_male: toNumber(wrk.permanent_male_no),
            permanent_female: toNumber(wrk.permanent_female_no),
            permanent_total: toNumber(wrk.permanent_male_no) + toNumber(wrk.permanent_female_no),
            other_male: toNumber(wrk.other_male_no),
            other_female: toNumber(wrk.other_female_no),
            other_total: toNumber(wrk.other_male_no) + toNumber(wrk.other_female_no),
            grand_total_male: toNumber(wrk.permanent_male_no) + toNumber(wrk.other_male_no),
            grand_total_female: toNumber(wrk.permanent_female_no) + toNumber(wrk.other_female_no),
            grand_total: (toNumber(wrk.permanent_male_no) + toNumber(wrk.other_male_no)) + (toNumber(wrk.permanent_female_no) + toNumber(wrk.other_female_no)),
        };
    }
    
    if (reportData.sa_differently_abled_details) {
        const da = reportData.sa_differently_abled_details;
        calculatedData.sectionA.differentlyAbledEmployeeTotals = {
            permanent_male: toNumber(da.employees_permanent_male_no),
            permanent_female: toNumber(da.employees_permanent_female_no),
            permanent_total: toNumber(da.employees_permanent_male_no) + toNumber(da.employees_permanent_female_no),
        };
        calculatedData.sectionA.differentlyAbledWorkerTotals = {
            permanent_male: toNumber(da.workers_permanent_male_no),
            permanent_female: toNumber(da.workers_permanent_female_no),
            permanent_total: toNumber(da.workers_permanent_male_no) + toNumber(da.workers_permanent_female_no),
        };
    }


    // Women Representation Percentages (Q19)
    if (reportData.sa_women_representation_details) {
        const womenRep = reportData.sa_women_representation_details;
        calculatedData.sectionA.boardWomenPercentage = formatPercentage(
            toNumber(womenRep.board_female_no),
            toNumber(womenRep.board_total_no)
        );
        calculatedData.sectionA.kmpWomenPercentage = formatPercentage(
            toNumber(womenRep.kmp_female_no),
            toNumber(womenRep.kmp_total_no)
        );
    }
    // ... Add other calculations for Section A, B, C as identified in PDF_CALCULATIONS.md and form structures
    // For example, for Section C Principle 6 (Environment)
    calculatedData.sectionC = calculatedData.sectionC || {};
    calculatedData.sectionC.p6 = calculatedData.sectionC.p6 || {};
    if (reportData.sc_p6_essential_indicators) {
        const p6ei = reportData.sc_p6_essential_indicators;
        calculatedData.sectionC.p6.renewableEnergyPercentage = formatPercentage(
            toNumber(p6ei.total_renewable_energy_consumed_gj),
            toNumber(p6ei.total_energy_consumed_gj)
        );
        // Add more P6 calculations: energy intensity, water intensity, GHG intensity etc.
    }

    return calculatedData;
}


// --- SECTION A Rendering ---
function renderSectionA(doc, sectionAData, sectionACalculated, companyData, currentY, contentWidth, pageMargin) {
    currentY = addSectionTitle(doc, "SECTION A: GENERAL DISCLOSURES", currentY, contentWidth);

    if (!sectionAData) {
        currentY = addRegularText(doc, "Section A data not available.", currentY);
        return currentY;
    }

    const startX = doc.page.margins.left;
    
    currentY = renderKeyValue(doc, "1. Corporate Identity Number (CIN)", companyData?.cin || sectionAData.cin, startX, currentY);
    currentY = renderKeyValue(doc, "2. Name of the Listed Entity", companyData?.name || sectionAData.entity_name, startX, currentY);
    currentY = renderKeyValue(doc, "3. Year of Incorporation", companyData?.year_of_incorporation || sectionAData.year_of_incorporation, startX, currentY);
    currentY = renderKeyValue(doc, "4. Registered Office Address", companyData?.registered_office_address || sectionAData.registered_office_address, startX, currentY);
    currentY = renderKeyValue(doc, "5. Corporate Office Address", companyData?.corporate_office_address || sectionAData.corporate_office_address, startX, currentY);
    currentY = renderKeyValue(doc, "6. Email", companyData?.email || sectionAData.email, startX, currentY);
    currentY = renderKeyValue(doc, "7. Telephone", companyData?.telephone || sectionAData.telephone, startX, currentY);
    currentY = renderKeyValue(doc, "8. Website", companyData?.website || sectionAData.website, startX, currentY);
    currentY = renderKeyValue(doc, "9. Financial Year for Reporting", sectionAData.financial_year, startX, currentY);
    currentY = renderKeyValue(doc, "10. Name of Stock Exchange(s)", sectionAData.stock_exchange_names, startX, currentY);
    currentY = renderKeyValue(doc, "11. Paid-up Capital", sectionAData.paid_up_capital, startX, currentY);
    currentY = renderKeyValue(doc, "12. Contact Information (Person responsible for BRSR)", `${sectionAData.contact_person_name_email_phone}`, startX, currentY);
    currentY = renderKeyValue(doc, "13. Describe Business Activity", sectionAData.business_activity_description, startX, currentY);
    
    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "14. Products/Services", currentY);
    if (sectionAData.products_services && sectionAData.products_services.length > 0) {
        const productTable = {
            headers: ["S.No.", "Product/Service", "NIC Code", "% of Turnover"],
            rows: sectionAData.products_services.map((p, i) => [i + 1, p.name, p.nic_code, p.turnover_percentage])
        };
        currentY = drawTable(doc, productTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, 
            [{width: '10%'}, {width: '40%'}, {width: '25%'}, {width: '25%'}]
        );
    } else {
        currentY = addRegularText(doc, "No specific products/services listed.", currentY, 20);
    }
    
    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "15. Operations", currentY);
    currentY = renderKeyValue(doc, "Number of locations (plants/operations)", sectionAData.locations_plants_operations_count, startX, currentY, 300);
    currentY = renderKeyValue(doc, "Number of locations (offices/sales)", sectionAData.locations_offices_count, startX, currentY, 300);
    currentY = renderKeyValue(doc, "Operations in National/International locations", sectionAData.national_international_locations, startX, currentY, 300);

    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "16. Contribution of exports", currentY);
    currentY = renderKeyValue(doc, "Total export revenue (INR)", sectionAData.exports_revenue, startX, currentY, 300);
    currentY = renderKeyValue(doc, "Percentage of total revenue from exports", sectionAData.exports_revenue_percentage, startX, currentY, 300);
    
    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "17. Details of CSR activities", currentY);
    currentY = renderKeyValue(doc, "Whether CSR is applicable as per Sec 135", sectionAData.csr_applicable ? 'Yes' : 'No', startX, currentY, 300);
    currentY = renderKeyValue(doc, "Turnover (INR)", sectionAData.csr_turnover, startX, currentY, 300);
    currentY = renderKeyValue(doc, "Net Worth (INR)", sectionAData.csr_net_worth, startX, currentY, 300);

    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "18. Employees and Workers Details (Current FY)", currentY);
    if (sectionAData.sa_employee_details && sectionACalculated?.employeeTotals) {
        const empData = sectionAData.sa_employee_details;
        const empCalc = sectionACalculated.employeeTotals;
        const empTable = {
            headers: ["Category", "Male", "Female", "Total"],
            rows: [
                ["Permanent Employees", empCalc.permanent_male, empCalc.permanent_female, empCalc.permanent_total],
                ["Other than Permanent Employees", empCalc.other_male, empCalc.other_female, empCalc.other_total],
                ["Total Employees", empCalc.grand_total_male, empCalc.grand_total_female, empCalc.grand_total]
            ]
        };
        currentY = drawTable(doc, empTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, 
            [{width: '40%'}, {width: '20%'}, {width: '20%'}, {width: '20%'}]
        );
        currentY += 5;
    }
    if (sectionAData.sa_workers_details && sectionACalculated?.workerTotals) {
        const workData = sectionAData.sa_workers_details;
        const workCalc = sectionACalculated.workerTotals;
        const workerTable = {
            headers: ["Category", "Male", "Female", "Total"],
            rows: [
                ["Permanent Workers", workCalc.permanent_male, workCalc.permanent_female, workCalc.permanent_total],
                ["Other than Permanent Workers", workCalc.other_male, workCalc.other_female, workCalc.other_total],
                ["Total Workers", workCalc.grand_total_male, workCalc.grand_total_female, workCalc.grand_total]
            ]
        };
        currentY = drawTable(doc, workerTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, 
            [{width: '40%'}, {width: '20%'}, {width: '20%'}, {width: '20%'}]
        );
        currentY += 5;
    }
     if (sectionAData.sa_differently_abled_details && sectionACalculated?.differentlyAbledEmployeeTotals && sectionACalculated?.differentlyAbledWorkerTotals) {
        const daCalcEmp = sectionACalculated.differentlyAbledEmployeeTotals;
        const daCalcWrk = sectionACalculated.differentlyAbledWorkerTotals;
        const daTable = {
            headers: ["Category", "Male", "Female", "Total"],
            rows: [
                ["Differently Abled Employees (Permanent)", daCalcEmp.permanent_male, daCalcEmp.permanent_female, daCalcEmp.permanent_total],
                ["Differently Abled Workers (Permanent)", daCalcWrk.permanent_male, daCalcWrk.permanent_female, daCalcWrk.permanent_total]
            ]
        };
        currentY = drawTable(doc, daTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, 
            [{width: '40%'}, {width: '20%'}, {width: '20%'}, {width: '20%'}]
        );
    }


    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "19. Participation/Inclusion of Women (Current FY)", currentY);
    if (sectionAData.sa_women_representation_details) {
        const womenRep = sectionAData.sa_women_representation_details;
        currentY = renderKeyValue(doc, "Women on Board (No.)", womenRep.board_female_no, startX, currentY, 350);
        currentY = renderKeyValue(doc, "Total Board Members (No.)", womenRep.board_total_no, startX, currentY, 350);
        currentY = renderKeyValue(doc, "Women on Board (%)", sectionACalculated?.boardWomenPercentage || 'N/A', startX, currentY, 350);
        currentY = renderKeyValue(doc, "Women KMPs (No.)", womenRep.kmp_female_no, startX, currentY, 350);
        currentY = renderKeyValue(doc, "Total KMPs (No.)", womenRep.kmp_total_no, startX, currentY, 350);
        currentY = renderKeyValue(doc, "Women KMPs (%)", sectionACalculated?.kmpWomenPercentage || 'N/A', startX, currentY, 350);
    }

    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "20. Turnover Rate for Permanent Employees and Workers (Current FY)", currentY);
     if (sectionAData.sa_turnover_rate_details && sectionAData.sa_turnover_rate_details.length > 0) {
        const turnoverData = sectionAData.sa_turnover_rate_details[0]; // Assuming first entry for current FY
        const turnoverTable = {
            headers: ["Category", "Male (%)", "Female (%)", "Total (%)"],
            rows: [
                ["Employees Turnover Rate", turnoverData.employees_male_turnover, turnoverData.employees_female_turnover, turnoverData.employees_total_turnover],
                ["Workers Turnover Rate", turnoverData.workers_male_turnover, turnoverData.workers_female_turnover, turnoverData.workers_total_turnover],
            ]
        };
        currentY = drawTable(doc, turnoverTable, startX, currentY, doc.page.width - startX - doc.page.margins.right,
            [{width: '40%'}, {width: '20%'}, {width: '20%'}, {width: '20%'}]
        );
    } else {
        currentY = addRegularText(doc, "Turnover rate data not available.", currentY, 20);
    }


    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "21. Holding, Subsidiary and Associate Companies", currentY);
    currentY = renderKeyValue(doc, "Number of Holding Companies", sectionAData.holding_companies_count, startX, currentY, 300);
    currentY = renderKeyValue(doc, "Number of Subsidiary Companies", sectionAData.subsidiary_companies_count, startX, currentY, 300);
    currentY = renderKeyValue(doc, "Number of Associate Companies", sectionAData.associate_companies_count, startX, currentY, 300);
    // Could add a table for their names if data structure supports it

    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "22. CSR Details", currentY); // Already covered in Q17, maybe more details here
    currentY = renderKeyValue(doc, "CSR Committee Web Link", sectionAData.csr_committee_weblink, startX, currentY, 300);


    currentY = checkAndAddPage(doc, currentY);
    currentY = addSubHeading(doc, "23. Transparency and Disclosures Compliances", currentY);
    currentY = renderKeyValue(doc, "Complaints/Grievances on BR aspects received", sectionAData.complaints_grievances_br_aspects_count, startX, currentY, 400);
    currentY = renderKeyValue(doc, "Weblink for policy on BR", sectionAData.br_policy_weblink, startX, currentY, 400);
    currentY = renderKeyValue(doc, "Independent assessment of BR policy", sectionAData.independent_assessment_details, startX, currentY, 400);
    
    currentY = checkAndAddPage(doc, currentY);
    doc.y = currentY;
    return doc.y;
}

// --- SECTION B Rendering ---
function renderSectionB(doc, sectionBData, companyData, currentY, contentWidth, pageMargin) {
    currentY = addSectionTitle(doc, "SECTION B: MANAGEMENT AND PROCESS DISCLOSURES", currentY, contentWidth);
    const startX = doc.page.margins.left;

    if (!sectionBData) {
        currentY = addRegularText(doc, "Section B data not available.", currentY);
        return currentY;
    }

    // Q1 & Q2: Policy and Process for Principles
    currentY = addSubHeading(doc, "1. Policy and Process for Principles", currentY);
    if (sectionBData.principle_wise_policies && sectionBData.principle_wise_policies.length > 0) {
        sectionBData.principle_wise_policies.forEach(policy => {
            currentY = checkAndAddPage(doc, currentY, 60); // Estimate space for a policy block
            doc.font('Helvetica-Bold').fontSize(10).text(`Principle ${policy.principle}:`, startX, currentY);
            currentY += 15;
            currentY = renderKeyValue(doc, "  Has Policy", policy.has_policy ? 'Yes' : 'No', startX, currentY, 250, 260);
            if (policy.has_policy) {
                currentY = renderKeyValue(doc, "  Policy Text/URL", policy.policy_text_or_url, startX, currentY, 250, 260);
                currentY = renderKeyValue(doc, "  Commitments/Goals", policy.specific_commitments_goals_targets, startX, currentY, 250, 260);
                currentY = renderKeyValue(doc, "  Performance", policy.performance_against_targets, startX, currentY, 250, 260);
            }
            currentY = renderKeyValue(doc, "  Extends to Value Chain", policy.extends_to_value_chain ? 'Yes' : 'No', startX, currentY, 250, 260);
            currentY += 5; // Spacing between policies
        });
    } else {
        currentY = addRegularText(doc, "No principle-wise policy data available.", currentY, 20);
    }
    
    currentY = checkAndAddPage(doc, currentY);
    // Q3: Governance, Leadership and Oversight
    currentY = addSubHeading(doc, "2. Governance, Leadership and Oversight", currentY);
    currentY = renderKeyValue(doc, "Statement from Director on BR Policy/Report", sectionBData.governance_leadership_oversight?.director_statement_br_policy, startX, currentY);
    currentY = renderKeyValue(doc, "Highest authority for BR implementation", sectionBData.governance_leadership_oversight?.highest_authority_br_implementation, startX, currentY);
    currentY = renderKeyValue(doc, "Does the entity have a specified Committee of the Board/ Director responsible for decision making on sustainability issues?", sectionBData.governance_leadership_oversight?.sustainability_committee_board_director ? 'Yes' : 'No', startX, currentY);
    currentY = renderKeyValue(doc, "Details of the highest authority responsible for implementation and oversight of the BR policy(ies).", sectionBData.governance_leadership_oversight?.oversight_authority_details, startX, currentY);
    currentY = renderKeyValue(doc, "Does the entity have a head of sustainability or equivalent?", sectionBData.governance_leadership_oversight?.has_sustainability_head ? 'Yes' : 'No', startX, currentY);
    currentY = renderKeyValue(doc, "Frequency of performance review by Board", sectionBData.governance_leadership_oversight?.board_performance_review_frequency, startX, currentY);
    currentY = renderKeyValue(doc, "Publicly accessible BR information", sectionBData.governance_leadership_oversight?.public_br_information_weblink, startX, currentY);

    currentY = checkAndAddPage(doc, currentY);
    // Q4-Q11: Stakeholder Engagement (NALCO report has this detailed)
    currentY = addSubHeading(doc, "3. Stakeholder Engagement", currentY);
    currentY = renderKeyValue(doc, "Stakeholders Identified", sectionBData.stakeholder_engagement?.stakeholders_identified, startX, currentY);
    currentY = renderKeyValue(doc, "Process for Engagement", sectionBData.stakeholder_engagement?.engagement_process, startX, currentY);
    // Add table for stakeholder engagement details if available in sectionBData.stakeholder_engagement.engagement_details (e.g., type, method, frequency)
    if (sectionBData.stakeholder_engagement?.engagement_details_table && sectionBData.stakeholder_engagement.engagement_details_table.length > 0) {
        const stakeholderTable = {
            headers: ["Stakeholder Group", "Engagement Method", "Frequency", "Purpose/Outcome"],
            rows: sectionBData.stakeholder_engagement.engagement_details_table.map(s => [s.group, s.method, s.frequency, s.outcome])
        };
        currentY = drawTable(doc, stakeholderTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, 
            [{width: '25%'}, {width: '25%'}, {width: '20%'}, {width: '30%'}]
        );
    }


    currentY = checkAndAddPage(doc, currentY);
    // Q12-Q14: Materiality Assessment
    currentY = addSubHeading(doc, "4. Materiality Assessment", currentY);
    currentY = renderKeyValue(doc, "Materiality Assessment Process", sectionBData.materiality_assessment?.process_description, startX, currentY);
    currentY = renderKeyValue(doc, "Material Issues Identified", sectionBData.materiality_assessment?.material_issues_identified, startX, currentY);
    // Add table for material issues if available

    currentY = checkAndAddPage(doc, currentY);
    // Q15: Risk Management
    currentY = addSubHeading(doc, "5. Risk Management", currentY);
    currentY = renderKeyValue(doc, "Risk Management Framework", sectionBData.risk_management?.framework_description, startX, currentY);
    currentY = renderKeyValue(doc, "Climate Related Risks", sectionBData.risk_management?.climate_related_risks_opportunities, startX, currentY);
    
    doc.y = currentY;
    return doc.y;
}

// --- SECTION C Rendering ---
// Principle 1
function renderPrinciple1(doc, essentialData, leadershipData, calculatedP1Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "1", "Businesses should conduct and govern themselves with integrity, and in a manner that is Ethical, Transparent and Accountable.", currentY, contentWidth);
    const startX = doc.page.margins.left;

    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 1 data not available.", currentY);
        return currentY;
    }
    
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. Anti-corruption/anti-bribery policy", essentialData.anti_corruption_policy?.has_policy ? 'Yes' : 'No', startX, currentY, 300, contentWidth - 300);
    if(essentialData.anti_corruption_policy?.has_policy) {
        currentY = renderKeyValue(doc, "   Details/Weblink", essentialData.anti_corruption_policy.weblink || essentialData.anti_corruption_policy.details, startX, currentY, 150, contentWidth - 160);
    }
    currentY = renderKeyValue(doc, "2. Process for concerns reporting", essentialData.concerns_reporting_process?.has_process ? 'Yes' : 'No', startX, currentY, 300, contentWidth - 300);
     if(essentialData.concerns_reporting_process?.has_process) {
        currentY = renderKeyValue(doc, "   Process Details", essentialData.concerns_reporting_process.process_details, startX, currentY, 150, contentWidth - 160);
    }
    currentY = renderKeyValue(doc, "3. Disciplinary actions for corruption (Current FY)", essentialData.disciplinary_actions_corruption?.count_fy, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "4. Fines/penalties for corruption (Current FY - Amount)", essentialData.fines_penalties_corruption?.fy?.amount, startX, currentY, 300, contentWidth - 300);
    
    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Conflict of interest policy communication", leadershipData.conflict_of_interest_policy_communication?.communicated ? 'Yes' : 'No', startX, currentY, 300, contentWidth - 300);
        currentY = renderKeyValue(doc, "b. Anti-corruption training (Employees)", leadershipData.anti_corruption_training?.covered_employees ? 'Yes' : 'No', startX, currentY, 300, contentWidth - 300);
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 2
function renderPrinciple2(doc, essentialData, leadershipData, calculatedP2Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "2", "Businesses should provide goods and services in a manner that is sustainable and safe.", currentY, contentWidth);
    const startX = doc.page.margins.left;
     if (!essentialData) {
        currentY = addRegularText(doc, "Principle 2 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. R&D for sustainable products/services", essentialData.r_and_d_sustainable_products?.details, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "2. Procedures for sustainable sourcing", essentialData.sustainable_sourcing_procedures?.details, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "3. Reclaimed/Recycled input material (%)", essentialData.recycled_input_materials_percentage, startX, currentY, 300, contentWidth - 300); // Use calculated if available

    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Life Cycle Assessments (LCA)", leadershipData.lca_conducted_details, startX, currentY, 300, contentWidth - 300);
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 3
function renderPrinciple3(doc, essentialData, leadershipData, calculatedP3Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "3", "Businesses should respect and promote the well-being of all employees, including those in their value chains.", currentY, contentWidth);
    const startX = doc.page.margins.left;
    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 3 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. Health & Safety Management System", essentialData.health_safety_management_system?.has_system ? 'Yes, Certified: ' + essentialData.health_safety_management_system.certification_details : 'No', startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "2. Measures for well-being of employees", essentialData.employee_wellbeing_measures, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "3. Training on H&S (Employees %)", essentialData.health_safety_training?.employee_coverage_percentage, startX, currentY, 300, contentWidth - 300); // Use calculated
    currentY = renderKeyValue(doc, "4. Details of retirement benefits", `${essentialData.retirement_benefits_details?.statutory_pf_coverage_percent}% PF, ${essentialData.retirement_benefits_details?.statutory_gratuity_coverage_percent}% Gratuity`, startX, currentY, 300, contentWidth - 300); // Use calculated

    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Health insurance coverage (Employees %)", leadershipData.health_insurance_coverage_employees_percent, startX, currentY, 300, contentWidth - 300); // Use calculated
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 4
function renderPrinciple4(doc, essentialData, leadershipData, calculatedP4Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "4", "Businesses should respect the interests of and be responsive to all its stakeholders.", currentY, contentWidth);
    const startX = doc.page.margins.left;
    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 4 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. Stakeholder consultation mechanisms", essentialData.stakeholder_consultation_mechanisms, startX, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY = renderKeyValue(doc, "2. Stakeholder complaints received (FY)", sectionBData.stakeholder_engagement?.stakeholders_identified, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "3. Disciplinary actions for corruption (Current FY)", essentialData.disciplinary_actions_corruption?.count_fy, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "4. Fines/penalties for corruption (Current FY - Amount)", essentialData.fines_penalties_corruption?.fy?.amount, startX, currentY, 300, contentWidth - 300);
    
    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Consultation with Board on ESG", leadershipData.consultation_process_with_board_path, startX, currentY, 300, contentWidth - 300);
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 5
function renderPrinciple5(doc, essentialData, leadershipData, calculatedP5Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "5", "Businesses should respect and promote human rights.", currentY, contentWidth);
    const startX = doc.page.margins.left;
    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 5 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. Human rights policy & training", essentialData.human_rights_policy, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "2. Min. wages (Employees Male %)", essentialData.min_wages_employees_male, startX, currentY, 300, contentWidth - 300); // Use calculated
    currentY = renderKeyValue(doc, "3. Complaints (Sexual Harassment - Filed)", essentialData.complaints_sexual_harassment?.filed, startX, currentY, 300, contentWidth - 300);

    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Grievance redressal for community", leadershipData.grievance_redressal_mechanisms_community, startX, currentY, 300, contentWidth - 300);
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 6
function renderPrinciple6(doc, essentialData, leadershipData, calculatedP6Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "6", "Businesses should respect and make efforts to protect and restore the environment.", currentY, contentWidth);
    const startX = doc.page.margins.left;
    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 6 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. Environmental policy link/details", essentialData.env_policy_link_or_details, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "2. Total energy consumed (GJ)", essentialData.total_energy_consumed_gj, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "3. Renewable energy consumed (%)", calculatedP6Data?.renewableEnergyPercentage || essentialData.total_renewable_energy_consumed_gj, startX, currentY, 300, contentWidth - 300); // Use calculated
    currentY = renderKeyValue(doc, "4. Total water withdrawal (KL)", essentialData.total_water_withdrawal_kl, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "5. GHG Emissions Scope 1 (Tonnes CO2e)", essentialData.ghg_emissions_scope1_tonnes, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "6. GHG Emissions Scope 2 (Tonnes CO2e)", essentialData.ghg_emissions_scope2_tonnes, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "7. Total waste generated (Metric Tonnes)", essentialData.total_waste_generated_metric_tonnes, startX, currentY, 300, contentWidth - 300);

    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. LCA Conducted Details", leadershipData.lca_conducted_details, startX, currentY, 300, contentWidth - 300);
        currentY = renderKeyValue(doc, "b. GHG reduction targets & progress", leadershipData.ghg_reduction_targets_and_progress, startX, currentY, 300, contentWidth - 300);
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 7
function renderPrinciple7(doc, essentialData, leadershipData, calculatedP7Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "7", "Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent.", currentY, contentWidth);
    const startX = doc.page.margins.left;
    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 7 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    if (essentialData.trade_associations_affiliations && essentialData.trade_associations_affiliations.length > 0) {
        currentY = addSubHeading(doc, "1. Trade Associations Affiliations", currentY);
        const tradeTable = {
            headers: ["Name", "Reach"],
            rows: essentialData.trade_associations_affiliations.map(a => [a.name, a.reach])
        };
        currentY = drawTable(doc, tradeTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, [{width: '70%'}, {width: '30%'}]);
    }
    currentY = renderKeyValue(doc, "2. Details of anti-competitive conduct proceedings", essentialData.anti_competitive_conduct_proceedings_details, startX, currentY, 350, contentWidth - 350, { isLongText: true });

    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Advocacy consistency with sustainability goals", leadershipData.advocacy_consistency_with_sustainability_goals, startX, currentY, 350, contentWidth - 350, { isLongText: true });
    }
    doc.y = currentY;
    return doc.y;
}

// Principle 8
function renderPrinciple8(doc, essentialData, leadershipData, calculatedP8Data, currentY, contentWidth, pageMargin) {
    currentY = addPrincipleTitle(doc, "8", "Businesses should promote inclusive growth and equitable development.", currentY, contentWidth);
    const startX = doc.page.margins.left;
    if (!essentialData) {
        currentY = addRegularText(doc, "Principle 8 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    // Example: Social Impact Assessments
    if (essentialData.social_impact_assessments && essentialData.social_impact_assessments.length > 0) {
        currentY = addSubHeading(doc, "1. Social Impact Assessments (SIAs) undertaken", currentY);
        const siaTable = {
            headers: ["Notification No.", "Date", "External Agency", "Results Communicated", "Weblink"],
            rows: essentialData.social_impact_assessments.map(sia => [sia.notification_no, sia.date, sia.external_agency, sia.results_communicated, sia.weblink])
        };
        currentY = drawTable(doc, siaTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, [{width: '20%'},{width: '15%'},{width: '25%'},{width: '20%'},{width: '20%'}]);
    } else {
        currentY = renderKeyValue(doc, "1. Social Impact Assessments (SIAs) undertaken", "No SIAs listed.", startX, currentY, 350, contentWidth - 350);
    }
    currentY += 5;
    currentY = renderKeyValue(doc, "2. Community grievance mechanisms", essentialData.community_grievance_mechanisms, startX, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY += 10;

    currentY = addSubHeading(doc, "Leadership Indicators", currentY, contentWidth);
    currentY = renderKeyValue(doc, "1. CSR projects in aspirational districts", (leadership.csr_aspirational_districts_projects || []).length > 0 ? 'Details provided in report' : 'N/A', startX, currentY, 350, contentWidth - 350);
    // Add more leadership indicators for P8
    currentY += 10;
    return currentY;
}

async function renderPrinciple9(doc, p9Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 9: Businesses should engage with and provide value to their consumers in a responsible manner.', currentY, contentWidth);

    const essential = p9Data?.essential_indicators || {};
    // const leadership = p9Data?.leadership_indicators || {}; // Assuming structure if available

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Customer satisfaction mechanisms:', essential.customer_satisfaction_mechanisms || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    
    if (essential.consumer_complaints && essential.consumer_complaints.length > 0) {
        currentY = addRegularText(doc, '2. Consumer Complaints:', pageMargin, currentY + 5, contentWidth);
        const complaintTable = {
            headers: ['Category', 'Received (FY)', 'Pending (FY)', 'Received (Prev FY)', 'Pending (Prev FY)'],
            rows: essential.consumer_complaints.map(c => [
                c.category_label || c.category || 'N/A',
                c.current_fy?.received || 0,
                c.current_fy?.pending || 0,
                c.previous_fy?.received || 0,
                c.previous_fy?.pending || 0,
            ])
        };
        currentY = await drawTable(doc, complaintTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.3, contentWidth*0.15, contentWidth*0.15, contentWidth*0.2, contentWidth*0.2]);
    }
    currentY += 5;
    currentY = renderKeyValue(doc, '3. Product recall incidents (Voluntary/Forced):', `Voluntary: ${essential.product_recall_incidents?.voluntary_recalls || 0}, Forced: ${essential.product_recall_incidents?.forced_recalls || 0}`, pageMargin, currentY, 350, contentWidth - 350);
    currentY = renderKeyValue(doc, '   Details:', essential.product_recall_incidents?.details || 'N/A', pageMargin + 10, currentY, 100, contentWidth - 110, { isLongText: true });
    currentY += 10;
    
    // Add Leadership Indicators for P9 if data structure is known
    return currentY;
}


/**
 * Generate a properly formatted PDF report with all data
 * @param {string} outputPath - Path where the PDF will be saved
 * @param {Object} reportData - Raw report data from database (e.g., reportData.section_a, reportData.section_b, reportData.section_c.p1_essential_indicators etc.)
 * @param {Object} companyData - Company details
 * @param {Object} calculatedData - Pre-calculated derived values (e.g., calculatedData.sectionA, calculatedData.sectionC.p1 etc.)
 */
async function generateBRSRPdf(outputPath, reportData, companyData, calculatedData) {
    const doc = new PDFDocument({ margin: 50, layout: 'portrait', size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Register fonts if you have custom fonts
    // doc.registerFont('Regular', path.join(__dirname, 'fonts', 'YourFont-Regular.ttf'));
    // doc.registerFont('Bold', path.join(__dirname, 'fonts', 'YourFont-Bold.ttf'));
    doc.font('Helvetica');

    let currentY = 50;
    const pageMargin = 50;
    const contentWidth = doc.page.width - 2 * pageMargin;

    // Helper: Add Header
    const addHeader = () => {
        doc.fontSize(10).fillColor('grey')
           .text(`BRSR Report - ${companyData.name || 'N/A'} - FY ${reportData.sa_general_details?.reporting_financial_year || 'N/A'}`, pageMargin, 30, { align: 'center' });
        currentY = 50; // Reset Y after header for content
    };

    // Helper: Add Footer (Page Number)
    const addFooter = () => {
        const pageNumber = doc.page.number;
        doc.fontSize(8).fillColor('grey')
           .text(`Page ${pageNumber}`, pageMargin, doc.page.height - 40, { align: 'center' });
    };
    
    doc.on('pageAdded', () => {
        addHeader();
        addFooter();
        currentY = pageMargin; // Reset Y for new page
    });
    
    addHeader(); // Add header to the first page
    addFooter(); // Add footer to the first page

    // --- Report Title ---
    doc.fontSize(18).font('Helvetica-Bold').text('Business Responsibility and Sustainability Report (BRSR)', { align: 'center' });
    currentY = doc.y + 20;

    // --- Company Overview ---
    currentY = addSectionTitle(doc, 'Company Overview', currentY, contentWidth);
    currentY = renderKeyValue(doc, 'Company Name:', companyData.name || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Corporate Identity Number (CIN):', companyData.cin || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Year of Incorporation:', companyData.year_of_incorporation || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Registered Office Address:', companyData.registered_office_address || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Corporate Office Address:', companyData.corporate_office_address || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Email:', companyData.email || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Telephone:', companyData.telephone || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Website:', companyData.website || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Financial Year for Reporting:', reportData.sa_general_details?.reporting_financial_year || 'N/A', pageMargin, currentY, 200, contentWidth - 200);
    currentY = renderKeyValue(doc, 'Stock Exchanges Listed On:', (companyData.stock_exchanges_listed || []).join(', ') || 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Paid-up Capital (INR):', companyData.paid_up_capital ? companyData.paid_up_capital.toLocaleString('en-IN') : 'N/A', pageMargin, currentY, 150, contentWidth - 150);
    currentY = renderKeyValue(doc, 'Contact for BRSR Queries:', `${reportData.sa_general_details?.contact_person_name || 'N/A'} (${reportData.sa_general_details?.contact_person_designation || 'N/A'})`, pageMargin, currentY, 200, contentWidth - 200);
    currentY = renderKeyValue(doc, 'Contact Email:', reportData.sa_general_details?.contact_person_email || 'N/A', pageMargin, currentY, 200, contentWidth - 200);
    currentY = renderKeyValue(doc, 'Contact Phone:', reportData.sa_general_details?.contact_person_phone || 'N/A', pageMargin, currentY, 200, contentWidth - 200);
    doc.y = currentY + 10;

    // --- Section A: General Disclosures ---
    currentY = await renderSectionA(doc, reportData, calculatedData, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);

    // --- Section B: Management and Process Disclosures ---
    currentY = await renderSectionB(doc, reportData, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);

    // --- Section C: Principle-wise Performance Disclosures ---
    currentY = addSectionTitle(doc, 'SECTION C: PRINCIPLE-WISE PERFORMANCE DISCLOSURE', currentY, contentWidth);
    
    currentY = await renderPrinciple1(doc, reportData.sc_principle1_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple2(doc, reportData.sc_principle2_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple3(doc, reportData.sc_principle3_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple4(doc, reportData.sc_principle4_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple5(doc, reportData.sc_principle5_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple6(doc, reportData.sc_principle6_data, calculatedData, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple7(doc, reportData.sc_principle7_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple8(doc, reportData.sc_principle8_data, doc.y, contentWidth, pageMargin);
    currentY = checkAndAddPage(doc, currentY, pageMargin);
    currentY = await renderPrinciple9(doc, reportData.sc_principle9_data, doc.y, contentWidth, pageMargin);

    doc.end();
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
    });
}

// --- Helper Functions for PDF Generation ---
// ... (addSectionTitle, addPrincipleTitle, addSubHeading, addRegularText, renderKeyValue, drawTable, checkAndAddPage - assumed to be defined as per previous context)

async function renderSectionA(doc, reportData, calculatedData, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addSectionTitle(doc, 'SECTION A: GENERAL DISCLOSURES', currentY, contentWidth);

    const sa = reportData.sa_general_details || {};
    const products = reportData.sa_products_services_details || {};
    const operations = reportData.sa_operations_details || {};
    const empDetails = reportData.sa_employee_details || {};
    const workerDetails = reportData.sa_workers_details || {};
    const diffAbled = reportData.sa_differently_abled_details || {};
    const womenRep = reportData.sa_women_representation_details || {};
    const empTurnover = reportData.sa_employee_turnover_details || [];
    const workerTurnover = reportData.sa_worker_turnover_details || [];
    const complaints = reportData.sa_complaints_details || {};
    const csr = reportData.sa_csr_details || {};
    const holding = reportData.sa_holding_company_details || {};
    // ... add other section A data sources

    currentY = addSubHeading(doc, '1. Products/Services', currentY, contentWidth);
    if (products.main_products_services && products.main_products_services.length > 0) {
        const productTable = {
            headers: ['S.No.', 'Product/Service Name', 'NIC Code', '% of Turnover'],
            rows: products.main_products_services.map((p, i) => [
                i + 1,
                p.name || 'N/A',
                p.nics_code || 'N/A',
                p.turnover_percent != null ? `${p.turnover_percent}%` : 'N/A'
            ])
        };
        currentY = await drawTable(doc, productTable, pageMargin, currentY, contentWidth, 20, [40, contentWidth * 0.4 - 40, contentWidth * 0.3, contentWidth * 0.2]);
    } else {
        currentY = addRegularText(doc, 'No product/service details provided.', pageMargin, currentY, contentWidth);
    }
    currentY += 10;

    currentY = addSubHeading(doc, '2. Operations', currentY, contentWidth);
    currentY = renderKeyValue(doc, 'Number of plant locations:', (operations.locations_plants_count || 'N/A'), pageMargin, currentY, 250, contentWidth - 250);
    currentY = renderKeyValue(doc, 'Number of markets served:', (operations.locations_markets_count || 'N/A'), pageMargin, currentY, 250, contentWidth - 250);
    // Add more operational details if available

    currentY = addSubHeading(doc, '3. Employees', currentY, contentWidth);
    if (empDetails.employees) {
        const empData = empDetails.employees; // Assuming structure like { permanent_male_no, permanent_female_no, ... }
        const calcEmp = calculatedData.sectionA?.employees || {};
        const employeeTableData = {
            headers: ['Category', 'Male', 'Female', 'Total'],
            rows: [
                ['Permanent', empData.permanent_male_no || 0, empData.permanent_female_no || 0, calcEmp.permanent_total || 0],
                ['Other than Permanent', empData.other_male_no || 0, empData.other_female_no || 0, calcEmp.other_total || 0],
                ['Total Employees', calcEmp.total_male || 0, calcEmp.total_female || 0, calcEmp.grand_total || 0]
            ]
        };
        currentY = await drawTable(doc, employeeTableData, pageMargin, currentY, contentWidth, 20, [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2]);
    } else {
        currentY = addRegularText(doc, 'No employee details provided.', pageMargin, currentY, contentWidth);
    }
    currentY += 5;

    currentY = addSubHeading(doc, '4. Workers (Non-Employees)', currentY, contentWidth);
     if (workerDetails.workers) {
        const workerData = workerDetails.workers;
        const calcWorkers = calculatedData.sectionA?.workers || {};
        const workerTableData = {
            headers: ['Category', 'Male', 'Female', 'Total'],
            rows: [
                ['Permanent', workerData.permanent_male_no || 0, workerData.permanent_female_no || 0, calcWorkers.permanent_total || 0],
                ['Other than Permanent', workerData.other_male_no || 0, workerData.other_female_no || 0, calcWorkers.other_total || 0],
                ['Total Workers', calcWorkers.total_male || 0, calcWorkers.total_female || 0, calcWorkers.grand_total || 0]
            ]
        };
        currentY = await drawTable(doc, workerTableData, pageMargin, currentY, contentWidth, 20, [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2]);
    } else {
        currentY = addRegularText(doc, 'No worker details provided.', pageMargin, currentY, contentWidth);
    }
    currentY += 5;
    
    currentY = addSubHeading(doc, '5. Differently Abled Employees and Workers', currentY, contentWidth);
    if (diffAbled.employees && diffAbled.workers) {
        const daEmp = diffAbled.employees;
        const daWrk = diffAbled.workers;
        const calcDiffAbled = calculatedData.sectionA?.differently_abled || {};
        const diffAbledTable = {
            headers: ['Category', 'Male', 'Female', 'Total'],
            rows: [
                ['Employees (Permanent)', daEmp.permanent_male_no || 0, daEmp.permanent_female_no || 0, calcDiffAbled.employees_permanent_total || 0],
                ['Employees (Other)', daEmp.other_male_no || 0, daEmp.other_female_no || 0, calcDiffAbled.employees_other_total || 0],
                ['Total Employees', calcDiffAbled.employees_total_male || 0, calcDiffAbled.employees_total_female || 0, calcDiffAbled.employees_grand_total || 0],
                ['Workers (Permanent)', daWrk.permanent_male_no || 0, daWrk.permanent_female_no || 0, calcDiffAbled.workers_permanent_total || 0],
                ['Workers (Other)', daWrk.other_male_no || 0, daWrk.other_female_no || 0, calcDiffAbled.workers_other_total || 0],
                ['Total Workers', calcDiffAbled.workers_total_male || 0, calcDiffAbled.workers_total_female || 0, calcDiffAbled.workers_grand_total || 0],
            ]
        };
        currentY = await drawTable(doc, diffAbledTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.4, contentWidth*0.2, contentWidth*0.2, contentWidth*0.2]);
    } else {
         currentY = addRegularText(doc, 'No differently abled employee/worker details provided.', pageMargin, currentY, contentWidth);
    }
    currentY += 5;

    currentY = addSubHeading(doc, '6. Participation/Representation of Women', currentY, contentWidth);
    if (womenRep.board_directors && calculatedData.sectionA) {
        const board = womenRep.board_directors;
        const kmp = womenRep.kmps;
        const calcWomenRep = calculatedData.sectionA.women_representation || {};
        const womenRepTable = {
            headers: ['Category', 'Total Count', 'Number of Women', '% of Women'],
            rows: [
                ['Board of Directors', board.total_members || 0, board.women_no || 0, calcWomenRep.board_women_percentage || 'N/A'],
                ['Key Management Personnel (KMPs)', kmp.total_kmps || 0, kmp.women_kmps_no || 0, calcWomenRep.kmp_women_percentage || 'N/A'],
                ['Employees (Permanent)', empDetails.employees?.permanent_total || calculatedData.sectionA?.employees?.permanent_total || 0, empDetails.employees?.permanent_female_no || 0, calcWomenRep.employees_permanent_women_percentage || 'N/A'],
                ['Workers (Other than Permanent)', workerDetails.workers?.other_total || calculatedData.sectionA?.workers?.other_total || 0, workerDetails.workers?.other_female_no || 0, calcWomenRep.workers_other_women_percentage || 'N/A'],
            ]
        };
        currentY = await drawTable(doc, womenRepTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.4, contentWidth*0.2, contentWidth*0.2, contentWidth*0.2]);
    } else {
        currentY = addRegularText(doc, 'No women representation details provided.', pageMargin, currentY, contentWidth);
    }
    currentY += 5;

    currentY = addSubHeading(doc, '7. Turnover Rate for Permanent Employees and Workers', currentY, contentWidth);
    // Assuming empTurnover and workerTurnover are arrays for different FYs if needed, taking the first one for simplicity
    const turnoverFY = empTurnover[0]?.year_label || workerTurnover[0]?.year_label || 'Current FY';
    const turnoverTable = {
        headers: ['Category', `Turnover Rate (${turnoverFY}) - Male`, `Turnover Rate (${turnoverFY}) - Female`, `Turnover Rate (${turnoverFY}) - Total`],
        rows: [
            ['Permanent Employees', empTurnover[0]?.employees_male_turnover || 'N/A', empTurnover[0]?.employees_female_turnover || 'N/A', empTurnover[0]?.employees_total_turnover || 'N/A'],
            ['Permanent Workers', workerTurnover[0]?.workers_male_turnover || 'N/A', workerTurnover[0]?.workers_female_turnover || 'N/A', workerTurnover[0]?.workers_total_turnover || 'N/A']
        ]
    };
    currentY = await drawTable(doc, turnoverTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.25, contentWidth*0.25, contentWidth*0.25, contentWidth*0.25]);
    currentY += 5;

    currentY = addSubHeading(doc, '8. Complaints (Child Labour, Forced Labour, Sexual Harassment, Discrimination)', currentY, contentWidth);
    const complaintData = complaints.complaints_details || {}; // Assuming this structure
    const complaintTableData = {
        headers: ['Nature of Complaint', 'Cases Filed (FY)', 'Cases Pending (FY)', 'Remarks'],
        rows: [
            ['Child Labour', complaintData.child_labour?.filed_fy || 0, complaintData.child_labour?.pending_fy || 0, complaintData.child_labour?.remarks || 'N/A'],
            ['Forced/Involuntary Labour', complaintData.forced_labour?.filed_fy || 0, complaintData.forced_labour?.pending_fy || 0, complaintData.forced_labour?.remarks || 'N/A'],
            ['Sexual Harassment', complaintData.sexual_harassment?.filed_fy || 0, complaintData.sexual_harassment?.pending_fy || 0, complaintData.sexual_harassment?.remarks || 'N/A'],
            ['Discrimination at Workplace', complaintData.discrimination?.filed_fy || 0, complaintData.discrimination?.pending_fy || 0, complaintData.discrimination?.remarks || 'N/A'],
        ]
    };
    currentY = await drawTable(doc, complaintTableData, pageMargin, currentY, contentWidth, 20, [contentWidth*0.3, contentWidth*0.2, contentWidth*0.2, contentWidth*0.3]);
    currentY += 5;

    currentY = addSubHeading(doc, '9. Corporate Social Responsibility (CSR)', currentY, contentWidth);
    currentY = renderKeyValue(doc, 'Whether CSR is applicable as per Sec 135 of Companies Act:', csr.is_csr_applicable ? 'Yes' : 'No', pageMargin, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, 'Turnover (INR):', csr.turnover_inr ? csr.turnover_inr.toLocaleString('en-IN') : 'N/A', pageMargin, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, 'Net Worth (INR):', csr.net_worth_inr ? csr.net_worth_inr.toLocaleString('en-IN') : 'N/A', pageMargin, currentY, 300, contentWidth - 300);
    currentY += 5;

    currentY = addSubHeading(doc, '10. Transparency and Disclosure Compliances', currentY, contentWidth);
    currentY = renderKeyValue(doc, 'Complaints/Grievances on BRSR:', reportData.sa_transparency_disclosure_details?.brsr_grievances_count || 'N/A', pageMargin, currentY, 350, contentWidth - 350);
    currentY = renderKeyValue(doc, 'Link to BR Policy:', reportData.sa_transparency_disclosure_details?.br_policy_link || 'N/A', pageMargin, currentY, 350, contentWidth - 350);
    currentY += 10;

    return currentY;
}

async function renderSectionB(doc, reportData, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addSectionTitle(doc, 'SECTION B: MANAGEMENT AND PROCESS DISCLOSURES', currentY, contentWidth);
    
    const policies = reportData.sb_policy_details || []; // Array of 9 policies

    if (policies.length === 0) {
        currentY = addRegularText(doc, 'No policy details provided for Section B.', pageMargin, currentY, contentWidth);
        return currentY + 10;
    }

    for (let i = 0; i < policies.length; i++) {
        const policy = policies[i];
        currentY = checkAndAddPage(doc, currentY, pageMargin);
        currentY = addSubHeading(doc, `Principle ${policy.principle_number || (i + 1)}: ${policy.principle_name || `Policy Details for Principle ${i+1}`}`, currentY, contentWidth);
        
        currentY = renderKeyValue(doc, '1. Does the entity have a policy approved by the Board?', policy.has_policy ? 'Yes' : 'No', pageMargin, currentY, 350, contentWidth - 350);
        if (policy.has_policy) {
            currentY = renderKeyValue(doc, '   Weblink to policy:', policy.policy_text_or_url || 'N/A', pageMargin + 10, currentY, 150, contentWidth - 160);
        }
        currentY = renderKeyValue(doc, '2. Has the policy been communicated to all relevant stakeholders?', policy.is_communicated ? 'Yes' : 'No', pageMargin, currentY, 350, contentWidth - 350);
        currentY = renderKeyValue(doc, '3. Specific commitments, goals, and targets set (if any):', policy.specific_commitments_goals_targets || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
        currentY = renderKeyValue(doc, '4. Performance against targets for the year:', policy.performance_against_targets || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
        currentY += 10;
    }
    return currentY;
}

async function renderPrinciple1(doc, p1Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 1: Businesses should conduct and govern themselves with integrity, and in a manner that is Ethical, Transparent and Accountable.', currentY, contentWidth);
    
    const essential = p1Data?.essential_indicators || {};
    const leadership = p1Data?.leadership_indicators || {};

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Anti-corruption/anti-bribery policy:', essential.anti_corruption_policy?.has_policy ? 'Yes' : 'No', pageMargin, currentY, 300, contentWidth - 300);
    if (essential.anti_corruption_policy?.has_policy) {
        currentY = renderKeyValue(doc, '   Details/Weblink:', essential.anti_corruption_policy.weblink || essential.anti_corruption_policy.details || 'N/A', pageMargin + 10, currentY, 150, contentWidth - 160, { isLongText: true });
    }
    currentY = renderKeyValue(doc, '2. Process for concerns reporting:', essential.concerns_reporting_process?.has_process ? 'Yes' : 'No', pageMargin, currentY, 300, contentWidth - 300);
    if (essential.concerns_reporting_process?.has_process) {
        currentY = renderKeyValue(doc, '   Details:', essential.concerns_reporting_process.process_details || 'N/A', pageMargin + 10, currentY, 150, contentWidth - 160, { isLongText: true });
    }
    currentY = renderKeyValue(doc, '3. Disciplinary actions for corruption (FY):', `${essential.disciplinary_actions_corruption?.count_fy || 0} (Prev FY: ${essential.disciplinary_actions_corruption?.count_prev_fy || 0})`, pageMargin, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, '   Remarks:', essential.disciplinary_actions_corruption?.remarks || 'N/A', pageMargin + 10, currentY, 150, contentWidth - 160, { isLongText: true });
    currentY = renderKeyValue(doc, '4. Corrective actions from corruption cases:', essential.corrective_actions_corruption?.details || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    
    if (essential.fines_penalties_corruption) {
        const finesTable = {
            headers: ['Period', 'No. of Fines/Penalties', 'Amount (INR)', 'Details'],
            rows: [
                ['Current FY', essential.fines_penalties_corruption.fy?.count || 0, essential.fines_penalties_corruption.fy?.amount || 0, essential.fines_penalties_corruption.fy?.details || 'N/A'],
                ['Previous FY', essential.fines_penalties_corruption.prev_fy?.count || 0, essential.fines_penalties_corruption.prev_fy?.amount || 0, essential.fines_penalties_corruption.prev_fy?.details || 'N/A']
            ]
        };
        currentY = addRegularText(doc, '5. Fines/Penalties for Corruption:', pageMargin, currentY + 5, contentWidth);
        currentY = await drawTable(doc, finesTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.2, contentWidth*0.2, contentWidth*0.2, contentWidth*0.4]);
    }
    currentY = renderKeyValue(doc, '6. Appeals on fines/penalties for corruption:', essential.appeals_fines_corruption?.details || 'N/A', pageMargin, currentY + 5, 300, contentWidth - 300, { isLongText: true });
    currentY += 10;

    currentY = addSubHeading(doc, 'Leadership Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Conflict of interest policy communication:', leadership.conflict_of_interest_policy_communication?.communicated ? 'Yes' : 'No', pageMargin, currentY, 300, contentWidth - 300);
    if (leadership.conflict_of_interest_policy_communication?.communicated) {
         currentY = renderKeyValue(doc, '   How communicated:', leadership.conflict_of_interest_policy_communication.how_communicated || 'N/A', pageMargin + 10, currentY, 150, contentWidth - 160, { isLongText: true });
    }
    currentY = renderKeyValue(doc, '2. Conflict of interest training coverage:', `Directors: ${leadership.conflict_of_interest_training?.covered_directors ? 'Yes':'No'}, KMPs: ${leadership.conflict_of_interest_training?.covered_kmps ? 'Yes':'No'}, Employees: ${leadership.conflict_of_interest_training?.covered_employees ? 'Yes':'No'}`, pageMargin, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, '   Training details (FY):', leadership.conflict_of_interest_training?.fy_training_details || 'N/A', pageMargin + 10, currentY, 150, contentWidth - 160, { isLongText: true });
    currentY += 10;
    return currentY;
}

async function renderPrinciple2(doc, p2Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 2: Businesses should provide goods and services in a manner that is sustainable and safe.', currentY, contentWidth);
    const startX = doc.page.margins.left;
     if (!p2Data) {
        currentY = addRegularText(doc, "Principle 2 data not available.", currentY);
        return currentY;
    }
    currentY = addSubHeading(doc, "Essential Indicators", currentY);
    currentY = renderKeyValue(doc, "1. Percentage of R&D/capital expenditure on sustainable products/processes:", p2Data.r_and_d_sustainable_percentage || 'N/A', pageMargin, currentY, 400, contentWidth - 400);
    currentY = renderKeyValue(doc, "2. Procedures for sustainable sourcing", p2Data.sustainable_sourcing_procedures || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, "3. Reclaimed/recycled input materials percentage:", p2Data.reclaimed_input_percentage || 'N/A', pageMargin, currentY, 400, contentWidth - 400);
    currentY += 10;

    currentY = addSubHeading(doc, "Leadership Indicators", currentY, contentWidth);
    currentY = renderKeyValue(doc, "1. Life Cycle Assessments (LCAs) conducted:", p2Data.lca_conducted_details || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, "2. Product recall procedures:", p2Data.product_recall_procedures || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, "3. Consumer feedback mechanisms for sustainability:", p2Data.consumer_feedback_sustainability || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY += 10;
    return currentY;
}

async function renderPrinciple3(doc, p3Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 3: Businesses should respect and promote the well-being of all employees, including those in their value chains.', currentY, contentWidth);

    const essential = p3Data?.essential_indicators || {}; // Assuming structure
    const leadership = p3Data?.leadership_indicators || {}; // Assuming structure

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Measures for employee well-being (health, safety, skilling):', essential.wellbeing_measures || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Percentage of employees covered by collective bargaining agreements:', essential.collective_bargaining_percentage || 'N/A', pageMargin, currentY, 400, contentWidth - 400);
    currentY = renderKeyValue(doc, '3. Details of occupational health and safety management system:', essential.ohs_management_system_details || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, '   Is it certified by external agency?', essential.ohs_certified ? 'Yes' : 'No', pageMargin + 10, currentY, 200, contentWidth - 210);
    currentY = renderKeyValue(doc, '4. Number of man-days lost due to work-related injuries/fatalities (FY):', `Employees: ${essential.lost_days_employees_fy || 0}, Workers: ${essential.lost_days_workers_fy || 0}`, pageMargin, currentY, 400, contentWidth - 400);
    currentY += 10;

    currentY = addSubHeading(doc, 'Leadership Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Details of retirement benefits (other than statutory):', leadership.retirement_benefits_details || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Accessibility for differently-abled employees/workers:', leadership.accessibility_details || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY = renderKeyValue(doc, '3. Grievance redressal mechanism for employees/workers:', leadership.employee_grievance_mechanism || 'N/A', pageMargin, currentY, 400, contentWidth - 400, { isLongText: true });
    currentY += 10;
    return currentY;
}

async function renderPrinciple4(doc, p4Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 4: Businesses should respect the interests of and be responsive to all its stakeholders.', currentY, contentWidth);
    
    const essential = p4Data?.essential_indicators || {};
    const leadership = p4Data?.leadership_indicators || {};

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Stakeholder consultation mechanisms:', essential.stakeholder_consultation_mechanisms || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Stakeholder complaints received (FY):', sectionBData.stakeholder_engagement?.stakeholders_identified, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, '3. Disciplinary actions for corruption (Current FY)', essentialData.disciplinary_actions_corruption?.count_fy, startX, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, "4. Fines/penalties for corruption (Current FY - Amount)", essentialData.fines_penalties_corruption?.fy?.amount, startX, currentY, 300, contentWidth - 300);
    
    if (leadershipData) {
        currentY = checkAndAddPage(doc, currentY);
        currentY = addSubHeading(doc, "Leadership Indicators", currentY);
        currentY = renderKeyValue(doc, "a. Consultation with Board on ESG", leadershipData.consultation_process_with_board_path, startX, currentY, 300, contentWidth - 300);
    }
    doc.y = currentY;
    return doc.y;
}

async function renderPrinciple5(doc, p5Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 5: Businesses should promote and respect human rights.', currentY, contentWidth);

    const essential = p5Data?.essential_indicators || {};
    const leadership = p5Data?.leadership_indicators || {};

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Human rights policy details/link:', essential.human_rights_policy || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Human rights training coverage (Employees):', essential.human_rights_training_coverage_employees || 'N/A', pageMargin, currentY, 300, contentWidth - 300);
    currentY = renderKeyValue(doc, '   Human rights training coverage (Workers):', essential.human_rights_training_coverage_workers || 'N/A', pageMargin + 10, currentY, 290, contentWidth - 300);
    
    currentY = addRegularText(doc, '3. Minimum Wages (as % of minimum wage):', pageMargin, currentY + 5, contentWidth);
    const minWageTable = {
        headers: ['Category', 'Male (%)', 'Female (%)'],
        rows: [
            ['Employees', essential.min_wages_employees_male || 'N/A', essential.min_wages_employees_female || 'N/A'],
            ['Workers', essential.min_wages_workers_male || 'N/A', essential.min_wages_workers_female || 'N/A']
        ]
    };
    currentY = await drawTable(doc, minWageTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.4, contentWidth*0.3, contentWidth*0.3]);
    currentY += 5;

    currentY = addRegularText(doc, '4. Remuneration/Salary/Wages (Median as % of median for category):', pageMargin, currentY + 5, contentWidth);
     const remunerationTable = {
        headers: ['Category', 'Male (Median %)', 'Female (Median %)'],
        rows: [
            ['Employees', essential.remuneration_employees_male || 'N/A', essential.remuneration_employees_female || 'N/A'],
            ['Workers', essential.remuneration_workers_male || 'N/A', essential.remuneration_workers_female || 'N/A']
        ]
    };
    currentY = await drawTable(doc, remunerationTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.4, contentWidth*0.3, contentWidth*0.3]);
    currentY += 5;

    currentY = addRegularText(doc, '5. Complaints concerning Human Rights issues:', pageMargin, currentY + 5, contentWidth);
    const hrComplaints = [
        {label: 'Child Labour', data: essential.complaints_child_labour},
        {label: 'Forced Labour', data: essential.complaints_forced_labour},
        {label: 'Sexual Harassment', data: essential.complaints_sexual_harassment},
        {label: 'Discrimination', data: essential.complaints_discrimination},
        {label: 'Wages', data: essential.complaints_wages},
        {label: 'Other HR Issues', data: essential.complaints_other_hr},
    ];
    const hrComplaintsTable = {
        headers: ['Issue', 'Filed (FY)', 'Pending (FY)', 'Resolved (FY)', 'Remarks'],
        rows: hrComplaints.map(c => [
            c.label,
            c.data?.filed || 0,
            c.data?.pending || 0,
            c.data?.resolved || 0,
            c.data?.remarks || 'N/A'
        ])
    };
    currentY = await drawTable(doc, hrComplaintsTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.25, contentWidth*0.15, contentWidth*0.15, contentWidth*0.15, contentWidth*0.3]);
    currentY += 5;

    currentY = renderKeyValue(doc, '6. Mechanisms to prevent HR impacts in value chain:', essential.value_chain_hr_impact_prevention_mechanisms || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY = renderKeyValue(doc, '7. Percentage of value chain covered by HR due diligence:', essential.value_chain_hr_due_diligence_percentage || 'N/A', pageMargin, currentY, 350, contentWidth - 350);
    currentY += 10;

    currentY = addSubHeading(doc, 'Leadership Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Grievance redressal mechanisms for community:', leadership.grievance_redressal_mechanisms_community || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Value chain human rights training:', leadership.value_chain_human_rights_training || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY = renderKeyValue(doc, '3. Corrective actions on HR impacts:', leadership.corrective_actions_hr_impacts || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY += 10;
    return currentY;
}

async function renderPrinciple6(doc, p6Data, calculatedData, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 6: Businesses should respect and make efforts to protect and restore the environment.', currentY, contentWidth);

    const essential = p6Data?.essential_indicators || {};
    const leadership = p6Data?.leadership_indicators || {};
    const calcP6 = calculatedData?.sectionC?.principle6 || {}; // For calculated values like energy intensity, renewable %

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Environmental policy details/link:', essential.env_policy_link_or_details || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Environmental Impact Assessments (EIAs) details:', essential.env_impact_assessments_details || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    
    currentY = addRegularText(doc, '3. Energy Consumption:', pageMargin, currentY + 5, contentWidth);
    currentY = renderKeyValue(doc, '   Total energy consumed (GJ):', essential.total_energy_consumed_gj || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Total renewable energy consumed (GJ):', essential.total_renewable_energy_consumed_gj || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Percentage of renewable energy:', calcP6.renewable_energy_percentage || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Energy intensity (per rupee of turnover):', essential.energy_intensity_details || calcP6.energy_intensity || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY += 5;

    currentY = addRegularText(doc, '4. Water Withdrawal & Consumption:', pageMargin, currentY + 5, contentWidth);
    currentY = renderKeyValue(doc, '   Total water withdrawal (KL):', essential.total_water_withdrawal_kl || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Total water consumption (KL):', essential.total_water_consumption_kl || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Water intensity (per rupee of turnover):', essential.water_intensity_details || calcP6.water_intensity || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    // Add table for water discharge if data available: essential.water_discharge_by_destination_and_treatment
    currentY += 5;

    currentY = addRegularText(doc, '5. Greenhouse Gas (GHG) Emissions (tonnes CO2e):', pageMargin, currentY + 5, contentWidth);
    currentY = renderKeyValue(doc, '   Scope 1 emissions:', essential.ghg_emissions_scope1_tonnes || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Scope 2 emissions:', essential.ghg_emissions_scope2_tonnes || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   Scope 3 emissions (if any):', essential.ghg_emissions_scope3_tonnes || 'N/A', pageMargin + 10, currentY, 250, contentWidth - 260);
    currentY = renderKeyValue(doc, '   GHG intensity (Scope 1+2 per rupee of turnover):', essential.ghg_intensity_details || calcP6.ghg_intensity || 'N/A', pageMargin + 10, currentY, 300, contentWidth - 310);
    currentY += 5;
    
    currentY = addRegularText(doc, '6. Waste Management:', pageMargin, currentY + 5, contentWidth);
    currentY = renderKeyValue(doc, '   Total waste generated (metric tonnes):', essential.total_waste_generated_metric_tonnes || 'N/A', pageMargin + 10, currentY, 300, contentWidth - 310);
    currentY = renderKeyValue(doc, '   Total hazardous waste (metric tonnes):', essential.total_hazardous_waste_generated_metric_tonnes || 'N/A', pageMargin + 10, currentY, 300, contentWidth - 310);
    currentY = renderKeyValue(doc, '   Total non-hazardous waste (metric tonnes):', essential.total_non_hazardous_waste_generated_metric_tonnes || 'N/A', pageMargin + 10, currentY, 300, contentWidth - 310);
    // Add table for waste management practices: essential.waste_management_practices
    currentY += 10;

    currentY = addSubHeading(doc, 'Leadership Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Life Cycle Assessment (LCA) conducted:', leadership.lca_conducted_details || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY = renderKeyValue(doc, '2. GHG reduction targets and progress:', leadership.ghg_reduction_targets_and_progress || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY = renderKeyValue(doc, '3. Biodiversity conservation programs:', leadership.biodiversity_conservation_programs_details || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    currentY += 10;
    return currentY;
}

async function renderPrinciple7(doc, p7Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 7: Businesses should engage responsibly and transparently with and influence public and regulatory policy.', currentY, contentWidth);

    const essential = p7Data?.essential_indicators || {};
    const leadership = p7Data?.leadership_indicators || {};

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    if (essential.trade_associations_affiliations && essential.trade_associations_affiliations.length > 0) {
        currentY = addRegularText(doc, '1. Affiliations with trade and industry chambers/associations:', pageMargin, currentY + 5, contentWidth);
        const tradeAssocTable = {
            headers: ['Name of Association', 'Reach (National/Regional/Global)'],
            rows: essential.trade_associations_affiliations.map(a => [a.name || 'N/A', a.reach || 'N/A'])
        };
        currentY = await drawTable(doc, tradeAssocTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.6, contentWidth*0.4]);
    } else {
        currentY = renderKeyValue(doc, '1. Affiliations with trade and industry chambers/associations:', 'No affiliations listed.', pageMargin, currentY, 400, contentWidth - 400);
    }
    currentY += 5;

    if (essential.public_policy_advocacy_details && essential.public_policy_advocacy_details.length > 0) {
        currentY = addRegularText(doc, '2. Public policy positions advocated:', pageMargin, currentY + 5, contentWidth);
        const policyAdvocacyTable = {
            headers: ['Subject of Policy', 'Method of Advocacy', 'Alignment with NDC'],
            rows: essential.public_policy_advocacy_details.map(p => [p.subject || 'N/A', p.method || 'N/A', p.alignment_with_ndc || 'N/A'])
        };
        currentY = await drawTable(doc, policyAdvocacyTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.4, contentWidth*0.3, contentWidth*0.3]);
    } else {
        currentY = renderKeyValue(doc, '2. Public policy positions advocated:', 'No policy advocacy details provided.', pageMargin, currentY, 400, contentWidth - 400);
    }
    currentY += 5;
    currentY = renderKeyValue(doc, '3. Anti-competitive conduct proceedings details:', essential.anti_competitive_conduct_proceedings_details || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY += 10;

    currentY = addSubHeading(doc, 'Leadership Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Additional public policy advocacy details:', leadership.additional_public_policy_advocacy_details || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY = renderKeyValue(doc, '2. Consistency of policy advocacy with sustainability goals:', leadership.advocacy_consistency_with_sustainability_goals || 'N/A', pageMargin, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY = renderKeyValue(doc, '3. Board review frequency of policy advocacy:', leadership.board_review_frequency_policy_advocacy || 'N/A', pageMargin, currentY, 350, contentWidth - 350);
    currentY += 10;
    return currentY;
}

// --- Stubs for Principle 8 and 9 (as per existing structure, can be fleshed out similarly) ---
async function renderPrinciple8(doc, p8Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 8: Businesses should promote inclusive growth and equitable development.', currentY, contentWidth);
    
    const essential = p8Data?.essential_indicators || {};
    const leadership = p8Data?.leadership_indicators || {};

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    // Example: Social Impact Assessments
    if (essential.social_impact_assessments && essential.social_impact_assessments.length > 0) {
        currentY = addSubHeading(doc, "1. Social Impact Assessments (SIAs) undertaken", currentY);
        const siaTable = {
            headers: ["Notification No.", "Date", "External Agency", "Results Communicated", "Weblink"],
            rows: essential.social_impact_assessments.map(sia => [sia.notification_no, sia.date, sia.external_agency, sia.results_communicated, sia.weblink])
        };
        currentY = drawTable(doc, siaTable, startX, currentY, doc.page.width - startX - doc.page.margins.right, [{width: '20%'},{width: '15%'},{width: '25%'},{width: '20%'},{width: '20%'}]);
    } else {
        currentY = renderKeyValue(doc, "1. Social Impact Assessments (SIAs) undertaken", "No SIAs listed.", startX, currentY, 350, contentWidth - 350);
    }
    currentY += 5;
    currentY = renderKeyValue(doc, "2. Community grievance mechanisms", essentialData.community_grievance_mechanisms, startX, currentY, 350, contentWidth - 350, { isLongText: true });
    currentY += 10;

    currentY = addSubHeading(doc, 'Leadership Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, "1. CSR projects in aspirational districts", (leadership.csr_aspirational_districts_projects || []).length > 0 ? 'Details provided in report' : 'N/A', startX, currentY, 350, contentWidth - 350);
    // Add more leadership indicators for P8
    currentY += 10;
    return currentY;
}

async function renderPrinciple9(doc, p9Data, startY, contentWidth, pageMargin) {
    let currentY = startY;
    currentY = addPrincipleTitle(doc, 'Principle 9: Businesses should engage with and provide value to their consumers in a responsible manner.', currentY, contentWidth);

    const essential = p9Data?.essential_indicators || {};
    // const leadership = p9Data?.leadership_indicators || {}; // Assuming structure if available

    currentY = addSubHeading(doc, 'Essential Indicators', currentY, contentWidth);
    currentY = renderKeyValue(doc, '1. Customer satisfaction mechanisms:', essential.customer_satisfaction_mechanisms || 'N/A', pageMargin, currentY, 300, contentWidth - 300, { isLongText: true });
    
    if (essential.consumer_complaints && essential.consumer_complaints.length > 0) {
        currentY = addRegularText(doc, '2. Consumer Complaints:', pageMargin, currentY + 5, contentWidth);
        const complaintTable = {
            headers: ['Category', 'Received (FY)', 'Pending (FY)', 'Received (Prev FY)', 'Pending (Prev FY)'],
            rows: essential.consumer_complaints.map(c => [
                c.category_label || c.category || 'N/A',
                c.current_fy?.received || 0,
                c.current_fy?.pending || 0,
                c.previous_fy?.received || 0,
                c.previous_fy?.pending || 0,
            ])
        };
        currentY = await drawTable(doc, complaintTable, pageMargin, currentY, contentWidth, 20, [contentWidth*0.3, contentWidth*0.15, contentWidth*0.15, contentWidth*0.2, contentWidth*0.2]);
    }
    currentY += 5;
    currentY = renderKeyValue(doc, '3. Product recall incidents (Voluntary/Forced):', `Voluntary: ${essential.product_recall_incidents?.voluntary_recalls || 0}, Forced: ${essential.product_recall_incidents?.forced_recalls || 0}`, pageMargin, currentY, 350, contentWidth - 350);
    currentY = renderKeyValue(doc, '   Details:', essential.product_recall_incidents?.details || 'N/A', pageMargin + 10, currentY, 100, contentWidth - 110, { isLongText: true });
    currentY += 10;
    
    // Add Leadership Indicators for P9 if data structure is known
    return currentY;
}
module.exports = {
    calculateDerivedValues,
    generateBRSRPdf
};
