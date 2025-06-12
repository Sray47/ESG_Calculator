// fixRenderPrinciples.js
// This script adds proper implementations for renderPrinciple2PdfMake and renderPrinciple5

const fs = require('fs');
const path = require('path');

// Fixed implementation for renderPrinciple5
const fixedRenderPrinciple5 = `
function renderPrinciple5(p5Data, calcData) {
    if (!p5Data?.essential_indicators) {
        return [{ text: "Principle 5 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("5", "Businesses should respect and promote human rights."));
    
    const ei = p5Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Human rights training
    content.push(addSubHeading('1. Human rights training provided'));
    if (ei.hr_training && (ei.hr_training.employees || ei.hr_training.workers)) {
        const trainingHeaders = ['Category', 'Total trained (No.)', '% of total employees/workers'];
        const trainingRows = [];
        
        if (ei.hr_training.employees && typeof ei.hr_training.employees === 'object') {
            Object.keys(ei.hr_training.employees).forEach(category => {
                const data = ei.hr_training.employees[category] || {};
                if (data.count_current_fy !== undefined || data.percentage_current_fy !== undefined) {
                    trainingRows.push([
                        \`Employees - \${category}\`,
                        data.count_current_fy || 0,
                        \`\${data.percentage_current_fy || 0}%\`
                    ]);
                }
            });
        }
        
        if (ei.hr_training.workers && typeof ei.hr_training.workers === 'object') {
            Object.keys(ei.hr_training.workers).forEach(category => {
                const data = ei.hr_training.workers[category] || {};
                if (data.count_current_fy !== undefined || data.percentage_current_fy !== undefined) {
                    trainingRows.push([
                        \`Workers - \${category}\`,
                        data.count_current_fy || 0,
                        \`\${data.percentage_current_fy || 0}%\`
                    ]);
                }
            });
        }
        
        if (trainingRows.length > 0) {
            content.push(drawSimpleTable({ headers: trainingHeaders, rows: trainingRows }));
        } else {
            content.push(addRegularText('No human rights training data available.'));
        }
    } else {
        content.push(addRegularText('No human rights training data available.'));
    }

    // EI 2: Minimum wages
    content.push(addSubHeading('2. Details of minimum wages paid'));
    if (ei.minimum_wages && (ei.minimum_wages.employees || ei.minimum_wages.workers)) {
        const wageHeaders = ['Category', 'Equal to Minimum Wage', 'More than Minimum Wage'];
        const wageRows = [];
        
        ['employees', 'workers'].forEach(type => {
            if (ei.minimum_wages[type] && typeof ei.minimum_wages[type] === 'object') {
                Object.keys(ei.minimum_wages[type]).forEach(category => {
                    const data = ei.minimum_wages[type][category] || {};
                    wageRows.push([
                        \`\${type.charAt(0).toUpperCase() + type.slice(1)} - \${category}\`,
                        \`\${data.equal_to_min_wage_percentage_current_fy || 0}%\`,
                        \`\${data.more_than_min_wage_percentage_current_fy || 0}%\`
                    ]);
                });
            }
        });
        
        if (wageRows.length > 0) {
            content.push(drawSimpleTable({ headers: wageHeaders, rows: wageRows }));
        } else {
            content.push(addRegularText('No minimum wage data available.'));
        }
    } else {
        content.push(addRegularText('No minimum wage data available.'));
    }

    // EI 3: Remuneration details
    content.push(addSubHeading('3. Details of remuneration/salary/wages'));
    if (ei.remuneration && typeof ei.remuneration === 'object') {
        const remunerationHeaders = ['Category', 'Male', 'Female', 'Median (M:F Ratio)'];
        const remunerationRows = [];
        
        ['bod', 'kmp', 'employees_other_than_bod_kmp', 'workers'].forEach(category => {
            const data = ei.remuneration[category] || {};
            if (Object.keys(data).length > 0) {
                const categoryNames = {
                    'bod': 'Board of Directors',
                    'kmp': 'Key Managerial Personnel',
                    'employees_other_than_bod_kmp': 'Employees (excluding BoD & KMP)',
                    'workers': 'Workers'
                };
                
                remunerationRows.push([
                    categoryNames[category] || category,
                    data.male_median_remuneration_current_fy || 'N/A',
                    data.female_median_remuneration_current_fy || 'N/A',
                    data.ratio_current_fy || 'N/A'
                ]);
            }
        });
        
        if (remunerationRows.length > 0) {
            content.push(drawSimpleTable({ headers: remunerationHeaders, rows: remunerationRows }));
        } else {
            content.push(addRegularText('No remuneration data available.'));
        }
    } else {
        content.push(addRegularText('No remuneration data available.'));
    }

    // EI 4: Focal point for human rights
    content.push(renderKeyValue('4. Focal point for human rights', ei.focal_point_for_human_rights ? 'Yes' : 'No'));

    // EI 5: Grievance redressal mechanisms
    content.push(renderKeyValue('5. Grievance redressal mechanisms', ei.grievance_redressal_mechanisms ?? 'N/A'));

    // EI 6: Complaints received (Current FY)
    content.push(addSubHeading('6. Complaints received during current financial year'));
    if (ei.complaints_current_fy && typeof ei.complaints_current_fy === 'object') {
        const complaintTypes = {
            sexual_harassment: 'Sexual Harassment',
            discrimination_workplace: 'Discrimination at workplace',
            child_labour: 'Child Labour',
            forced_labour: 'Forced Labour/Involuntary Labour',
            wages: 'Wages',
            other_hr_issues: 'Other human rights related issues'
        };
        
        const complaintHeaders = ['Type', 'Filed', 'Pending', 'Resolved', 'Remarks'];
        const complaintRows = [];
        
        Object.keys(complaintTypes).forEach(type => {
            const data = ei.complaints_current_fy[type] || {};
            if (Object.keys(data).length > 0) {
                complaintRows.push([
                    complaintTypes[type],
                    data.filed || 0,
                    data.pending || 0,
                    data.resolved || 0,
                    data.remarks || 'N/A'
                ]);
            }
        });
        
        if (complaintRows.length > 0) {
            content.push(drawSimpleTable({ headers: complaintHeaders, rows: complaintRows }));
        }
    }

    // EI 7: Anti-retaliation mechanisms
    content.push(renderKeyValue('7. Anti-retaliation mechanisms', ei.anti_retaliation_mechanisms ?? 'N/A'));

    // EI 8: Human rights in business agreements
    content.push(renderKeyValue('8. Human rights covered in business agreements', ei.hr_in_business_agreements ? 'Yes' : 'No'));

    // EI 9: Assessments for the year (% of plants/offices covered)
    content.push(addSubHeading('9. Assessments for the year (% of plants/offices covered)'));
    if (ei.assessments_plants_offices && typeof ei.assessments_plants_offices === 'object') {
        const assessmentHeaders = ['Assessment Type', 'Percentage'];
        const assessmentRows = [
            ['Child Labour', ei.assessments_plants_offices.child_labour_percent !== undefined ? \`\${ei.assessments_plants_offices.child_labour_percent}%\` : 'N/A'],
            ['Forced/Involuntary Labour', ei.assessments_plants_offices.forced_labour_percent !== undefined ? \`\${ei.assessments_plants_offices.forced_labour_percent}%\` : 'N/A'],
            ['Sexual Harassment', ei.assessments_plants_offices.sexual_harassment_percent !== undefined ? \`\${ei.assessments_plants_offices.sexual_harassment_percent}%\` : 'N/A'],
            ['Discrimination at workplace', ei.assessments_plants_offices.discrimination_workplace_percent !== undefined ? \`\${ei.assessments_plants_offices.discrimination_workplace_percent}%\` : 'N/A'],
            ['Wages', ei.assessments_plants_offices.wages_percent !== undefined ? \`\${ei.assessments_plants_offices.wages_percent}%\` : 'N/A']
        ];
        if (ei.assessments_plants_offices.others_text) {
            assessmentRows.push([
                ei.assessments_plants_offices.others_text,
                ei.assessments_plants_offices.others_percent !== undefined ? \`\${ei.assessments_plants_offices.others_percent}%\` : 'N/A'
            ]);
        }
        content.push(drawSimpleTable({ headers: assessmentHeaders, rows: assessmentRows }));
    } else {
        content.push(addRegularText('No assessment data available.'));
    }

    // EI 10: Corrective actions from Q9
    content.push(renderKeyValue('10. Corrective actions from assessments', ei.corrective_actions_risks_q9 ?? 'N/A'));

    // Leadership Indicators
    if (p5Data.leadership_indicators && typeof p5Data.leadership_indicators === 'object') {
        const li = p5Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        // LI 1: Process modification due to HR grievances
        content.push(renderKeyValue('1. Process modification due to HR grievances', li.process_modification_grievances ?? 'N/A'));
        // LI 2: HR due-diligence scope
        if (li.hr_due_diligence_scope) {
            content.push(renderKeyValue('2. HR due-diligence scope', li.hr_due_diligence_scope));
        }
        // LI 3: Accessibility for differently-abled
        if (li.accessibility_for_disabled !== undefined) {
            content.push(renderKeyValue('3. Premise accessible to differently abled', li.accessibility_for_disabled ? 'Yes' : 'No'));
        }
    }
    return content;
}`;

// Fixed implementation for renderPrinciple2PdfMake
const fixedRenderPrinciple2PdfMake = `
function renderPrinciple2PdfMake(p2Data, calculatedData) {
    // Add debug logging to track data
    console.log("renderPrinciple2PdfMake called with data:", JSON.stringify(p2Data, null, 2));
    
    if (!p2Data || !p2Data.essential_indicators) {
        console.log("Principle 2 data not available - returning error message");
        return [{ text: "Principle 2 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("2", "Businesses should provide goods and services in a manner that is sustainable and safe."));
    
    const ei = p2Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Percentage of R&D and capital expenditure
    content.push(addSubHeading('1. R&D and Capital Expenditure on Sustainability'));
    if (ei.r_and_d_expenditure_sustainability || ei.capital_expenditure_sustainability) {
        content.push(drawSimpleTable({
            headers: ['Parameter', 'Current FY (%)', 'Previous FY (%)', 'Details'],
            rows: [
                ['R&D', ei.r_and_d_expenditure_sustainability?.current_fy_percentage || 0, ei.r_and_d_expenditure_sustainability?.previous_fy_percentage || 0, ei.r_and_d_expenditure_sustainability?.details || 'N/A'],
                ['Capital Expenditure', ei.capital_expenditure_sustainability?.current_fy_percentage || 0, ei.capital_expenditure_sustainability?.previous_fy_percentage || 0, ei.capital_expenditure_sustainability?.details || 'N/A']
            ]
        }));
    } else {
        content.push(addRegularText('No R&D or capital expenditure data available.'));
    }

    // EI 2: Procedures for sustainable sourcing
    content.push(renderKeyValue('2. Procedures for sustainable sourcing', ei.sustainable_sourcing_procedures?.has_procedures ? 'Yes' : 'No'));
    if (ei.sustainable_sourcing_procedures?.details) {
        content.push(addRegularText(\`Details: \${ei.sustainable_sourcing_procedures.details}\`));
    }

    // EI 3: Reclaimed/recycled input materials
    content.push(renderKeyValue('3. Percentage of recycled/reclaimed input materials', \`\${ei.recycled_input_materials_percentage || 0}%\`));

    // EI 4: Sustainable sourcing from SMEs/MSMEs
    content.push(renderKeyValue('4. Sustainable sourcing from SMEs/MSMEs', ei.sustainable_sourcing_sme_percentage ? \`\${ei.sustainable_sourcing_sme_percentage}%\` : 'N/A'));

    // Leadership Indicators
    if (p2Data.leadership_indicators) {
        const li = p2Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        if (li.lca_details && li.lca_details.length > 0) {
            content.push(addSubHeading('Life Cycle Assessments (LCA)'));
            content.push(drawSimpleTable({
                headers: ['Product/Service', 'Percentage of Total Turnover', 'Results Communicated Publicly'],
                rows: li.lca_details.map(lca => [
                    lca.product_service || 'N/A',
                    \`\${lca.percentage_of_turnover || 0}%\`,
                    lca.results_communicated_publicly ? 'Yes' : 'No'
                ])
            }));
        }

        content.push(renderKeyValue('Sustainable sourcing from suppliers', li.sustainable_sourcing_suppliers_percentage ? \`\${li.sustainable_sourcing_suppliers_percentage}%\` : 'N/A'));
    }

    return content;
}`;

// Function to update the file
function updateFile() {
    // Path to the pdfGenerator_fixed.js file
    const pdfFilePath = path.join(__dirname, 'pdfGenerator_fixed.js');
    
    // Read the file content
    let fileContent = fs.readFileSync(pdfFilePath, 'utf8');
    
    // Find and replace renderPrinciple5 function
    const principle5Regex = /function renderPrinciple5\([^{]*\{[\s\S]*?return content;\s*\}/;
    if (fileContent.match(principle5Regex)) {
        fileContent = fileContent.replace(principle5Regex, fixedRenderPrinciple5);
        console.log('Successfully replaced renderPrinciple5 function');
    } else {
        console.log('Could not find renderPrinciple5 function to replace');
    }
    
    // Find and replace renderPrinciple2PdfMake function
    const principle2Regex = /function renderPrinciple2PdfMake\([^{]*\{[\s\S]*?return content;\s*\}/;
    if (fileContent.match(principle2Regex)) {
        fileContent = fileContent.replace(principle2Regex, fixedRenderPrinciple2PdfMake);
        console.log('Successfully replaced renderPrinciple2PdfMake function');
    } else {
        console.log('Could not find renderPrinciple2PdfMake function to replace');
    }
    
    // Add export for the render functions to help with debugging
    if (!fileContent.includes('module.exports = {')) {
        fileContent = fileContent.replace(
            'module.exports = {', 
            'module.exports = {\n    renderPrinciple2PdfMake,\n    renderPrinciple5,'
        );
        console.log('Added render functions to module exports');
    } else {
        // Make sure the render functions are exported
        const exportSection = fileContent.match(/module\.exports = \{[\s\S]*?\};/);
        if (exportSection && !exportSection[0].includes('renderPrinciple2PdfMake')) {
            fileContent = fileContent.replace(
                'module.exports = {', 
                'module.exports = {\n    renderPrinciple2PdfMake,\n    renderPrinciple5,'
            );
            console.log('Added render functions to module exports');
        }
    }
    
    // Add data validation and debugging for both principles in the main function
    const mainFunctionStart = fileContent.match(/function generateBRSRPdf\(\{[^}]*\}\) \{/);
    if (mainFunctionStart) {
        const debugCode = `
    // Add data validation and debugging for Principle 2 and Principle 5
    const p2Data = reportData.sc_p2_sustainable_safe_goods || reportData.sc_principle2_data || {};
    const p5Data = reportData.sc_p5_human_rights || reportData.sc_principle5_data || {};
    
    console.log("=================== DATA VALIDATION ===================");
    console.log("Principle 2 data available:", !!p2Data);
    console.log("Principle 2 essential indicators available:", !!(p2Data && p2Data.essential_indicators));
    if (p2Data && p2Data.essential_indicators) {
        console.log("Principle 2 data structure:", Object.keys(p2Data.essential_indicators));
    }
    
    console.log("Principle 5 data available:", !!p5Data);
    console.log("Principle 5 essential indicators available:", !!(p5Data && p5Data.essential_indicators));
    if (p5Data && p5Data.essential_indicators) {
        console.log("Principle 5 data structure:", Object.keys(p5Data.essential_indicators));
    }
    console.log("======================================================");
    `;
        
        fileContent = fileContent.replace(
            mainFunctionStart[0],
            mainFunctionStart[0] + debugCode
        );
        console.log('Added data validation and debugging code to main function');
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(pdfFilePath, fileContent);
    console.log('File updated successfully');
}

// Run the update function
updateFile();
