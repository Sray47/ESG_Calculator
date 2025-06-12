// fixPdfGenerator.js - Updated
// This script fixes issues with Principle 2 and Principle 5 rendering in the PDF generator

const fs = require('fs');
const path = require('path');

// Path to the pdfGenerator_fixed.js file
const pdfGeneratorPath = path.join(__dirname, 'pdfGenerator_fixed.js');

// Fixed implementation for renderPrinciple2PdfMake function - handles data path mismatches
const fixedRenderPrinciple2PdfMake = `
function renderPrinciple2PdfMake(p2Data, calculatedData) {
    // Debug data path
    console.log("Principle 2 data type:", typeof p2Data);
    console.log("Principle 2 data keys:", p2Data ? Object.keys(p2Data) : "null");
    
    if (!p2Data || !p2Data.essential_indicators) {
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

// Fixed implementation for renderPrinciple5 function - handles field name mismatches
const fixedRenderPrinciple5 = `
function renderPrinciple5(p5Data, calcData) {
    // Debug data path
    console.log("Principle 5 data type:", typeof p5Data);
    console.log("Principle 5 data keys:", p5Data ? Object.keys(p5Data) : "null");
    
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
                        \`Employees - \${category.replace(/_/g, ' ')}\`,
                        data.count_current_fy ?? 0,
                        data.percentage_current_fy !== undefined ? \`\${data.percentage_current_fy}%\` : 'N/A'
                    ]);
                }
            });
        }
        
        if (ei.hr_training.workers && typeof ei.hr_training.workers === 'object') {
            Object.keys(ei.hr_training.workers).forEach(category => {
                const data = ei.hr_training.workers[category] || {};
                if (data.count_current_fy !== undefined || data.percentage_current_fy !== undefined) {
                    trainingRows.push([
                        \`Workers - \${category.replace(/_/g, ' ')}\`,
                        data.count_current_fy ?? 0,
                        data.percentage_current_fy !== undefined ? \`\${data.percentage_current_fy}%\` : 'N/A'
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
                    // Support both naming conventions with and without _current_fy suffix
                    const equalToValue = data.equal_to_minimum_wage_count ?? 
                                         data.equal_to_min_wage_percentage_current_fy ?? 0;
                    const moreThanValue = data.more_than_minimum_wage_count ?? 
                                          data.more_than_min_wage_percentage_current_fy ?? 0;
                    
                    wageRows.push([
                        \`\${type.charAt(0).toUpperCase() + type.slice(1)} - \${category.replace(/_/g, ' ')}\`,
                        equalToValue,
                        moreThanValue
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
                
                // Support both naming conventions with and without _current_fy suffix
                const maleValue = data.male_median ?? 
                                data.male_median_remuneration_current_fy ?? 'N/A';
                const femaleValue = data.female_median ?? 
                                  data.female_median_remuneration_current_fy ?? 'N/A';
                const ratioValue = data.median_ratio ?? 
                                 data.ratio_current_fy ?? 'N/A';
                
                remunerationRows.push([
                    categoryNames[category] || category,
                    maleValue,
                    femaleValue,
                    ratioValue
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
                // Support both naming conventions with and without _current_fy suffix
                const filedValue = data.filed ?? data.filed_current_fy ?? 0;
                const pendingValue = data.pending ?? data.pending_current_fy ?? 0;
                const resolvedValue = data.resolved ?? data.resolved_current_fy ?? 0;
                const remarksValue = data.remarks ?? data.remarks_current_fy ?? 'N/A';
                
                complaintRows.push([
                    complaintTypes[type],
                    filedValue,
                    pendingValue,
                    resolvedValue,
                    remarksValue
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
        
        // LI 4: Assessment of value chain partners
        if (li.assessment_value_chain_partners && typeof li.assessment_value_chain_partners === 'object') {
            content.push(addSubHeading('4. Assessment of value chain partners (% by business value)'));
            const valueChainHeaders = ['Assessment Type', 'Percentage'];
            const valueChainRows = [
                ['Sexual Harassment', li.assessment_value_chain_partners.sexual_harassment_percent !== undefined ? \`\${li.assessment_value_chain_partners.sexual_harassment_percent}%\` : 'N/A'],
                ['Discrimination at workplace', li.assessment_value_chain_partners.discrimination_workplace_percent !== undefined ? \`\${li.assessment_value_chain_partners.discrimination_workplace_percent}%\` : 'N/A'],
                ['Child Labour', li.assessment_value_chain_partners.child_labour_percent !== undefined ? \`\${li.assessment_value_chain_partners.child_labour_percent}%\` : 'N/A'],
                ['Forced Labour', li.assessment_value_chain_partners.forced_labour_percent !== undefined ? \`\${li.assessment_value_chain_partners.forced_labour_percent}%\` : 'N/A'],
                ['Wages', li.assessment_value_chain_partners.wages_percent !== undefined ? \`\${li.assessment_value_chain_partners.wages_percent}%\` : 'N/A']
            ];
            if (li.assessment_value_chain_partners.others_text) {
                valueChainRows.push([
                    li.assessment_value_chain_partners.others_text,
                    li.assessment_value_chain_partners.others_percent !== undefined ? \`\${li.assessment_value_chain_partners.others_percent}%\` : 'N/A'
                ]);
            }
            content.push(drawSimpleTable({ headers: valueChainHeaders, rows: valueChainRows }));
        }
        
        // LI 5: Corrective actions from LI Q4
        if (li.corrective_actions_risks_q4_li) {
            content.push(renderKeyValue('5. Corrective actions from value chain assessments', li.corrective_actions_risks_q4_li));
        }
    }
    
    return content;
}`;

// Modify the generateBRSRPdf function to add data path logging
const dataPathLoggingCode = `
    // Add data path logging for debugging Principle 2 and Principle 5
    try {
        // Check for Principle 2 data
        const p2Data = reportData.sc_p2_sustainable_safe_goods || reportData.sc_principle2_data;
        console.log("============= PRINCIPLE 2 DATA PATH DEBUG =============");
        console.log("sc_p2_sustainable_safe_goods exists:", !!reportData.sc_p2_sustainable_safe_goods);
        console.log("sc_principle2_data exists:", !!reportData.sc_principle2_data);
        console.log("Data will be taken from:", p2Data ? 
                    (reportData.sc_p2_sustainable_safe_goods ? "sc_p2_sustainable_safe_goods" : "sc_principle2_data") : "NONE");
        
        // Check for Principle 5 data
        const p5Data = reportData.sc_p5_human_rights || reportData.sc_principle5_data;
        console.log("============= PRINCIPLE 5 DATA PATH DEBUG =============");
        console.log("sc_p5_human_rights exists:", !!reportData.sc_p5_human_rights);
        console.log("sc_principle5_data exists:", !!reportData.sc_principle5_data);
        console.log("Data will be taken from:", p5Data ? 
                    (reportData.sc_p5_human_rights ? "sc_p5_human_rights" : "sc_principle5_data") : "NONE");
    } catch (error) {
        console.error("Error in data path logging:", error);
    }
`;

// Function to update the PDF generator file
function updatePdfGenerator() {
    try {
        // Read the file content
        let content = fs.readFileSync(pdfGeneratorPath, 'utf8');
        
        // Replace renderPrinciple2PdfMake function
        const principle2Regex = /function renderPrinciple2PdfMake\([^{]*\{[\s\S]*?return content;\s*\}/;
        if (content.match(principle2Regex)) {
            content = content.replace(principle2Regex, fixedRenderPrinciple2PdfMake);
            console.log('Successfully replaced renderPrinciple2PdfMake function');
        } else {
            console.log('Could not find renderPrinciple2PdfMake function to replace');
        }
        
        // Replace renderPrinciple5 function
        const principle5Regex = /function renderPrinciple5\([^{]*\{[\s\S]*?return content;\s*\}/;
        if (content.match(principle5Regex)) {
            content = content.replace(principle5Regex, fixedRenderPrinciple5);
            console.log('Successfully replaced renderPrinciple5 function');
        } else {
            console.log('Could not find renderPrinciple5 function to replace');
        }
        
        // Add data path logging in generateBRSRPdf
        const generateBRSRPdfRegex = /function generateBRSRPdf\(\{[^}]*\}\) \{/;
        if (content.match(generateBRSRPdfRegex)) {
            // Check if logging code is already there
            if (!content.includes("PRINCIPLE 2 DATA PATH DEBUG")) {
                content = content.replace(
                    generateBRSRPdfRegex, 
                    `$&\n${dataPathLoggingCode}`
                );
                console.log('Added data path logging to generateBRSRPdf function');
            }
        } else {
            console.log('Could not find generateBRSRPdf function to modify');
        }
        
        // Make sure render functions are exported for debugging
        if (content.includes('module.exports = {')) {
            if (!content.includes('renderPrinciple2PdfMake,') || !content.includes('renderPrinciple5,')) {
                content = content.replace(
                    'module.exports = {', 
                    'module.exports = {\n    renderPrinciple2PdfMake,\n    renderPrinciple5,'
                );
                console.log('Added render functions to module exports');
            }
        }
        
        // Write the updated content back to the file
        fs.writeFileSync(pdfGeneratorPath, content, 'utf8');
        console.log('Successfully updated pdfGenerator_fixed.js');
        
        return true;
    } catch (error) {
        console.error('Error updating pdfGenerator_fixed.js:', error);
        return false;
    }
}

// Execute the update
if (updatePdfGenerator()) {
    console.log('Fix for Principle 2 and Principle 5 has been applied.');
    console.log('Please run the test script to verify the changes.');
} else {
    console.log('Failed to apply fixes. Please check the errors above.');
}

// Create a simple test script to verify the changes
const testScriptContent = `
// testFixedPrinciples.js
// This script tests the fixed renderPrinciple2PdfMake and renderPrinciple5 functions

const { generateBRSRPdf } = require('./pdfGenerator_fixed');
const fs = require('fs');
const path = require('path');

// Test data that includes both Principle 2 and Principle 5 data
const testData = {
    // Principle 2 - using sc_p2_sustainable_safe_goods path
    sc_p2_sustainable_safe_goods: {
        essential_indicators: {
            r_and_d_expenditure_sustainability: {
                current_fy_percentage: 5.2,
                previous_fy_percentage: 4.1,
                details: "Invested in renewable energy research"
            },
            capital_expenditure_sustainability: {
                current_fy_percentage: 10.3,
                previous_fy_percentage: 8.7,
                details: "Solar panel installation"
            },
            sustainable_sourcing_procedures: {
                has_procedures: true,
                details: "We have implemented sustainable sourcing guidelines"
            },
            recycled_input_materials_percentage: 15.5,
            sustainable_sourcing_sme_percentage: 20.3
        },
        leadership_indicators: {
            lca_details: [
                {
                    product_service: "Product A",
                    percentage_of_turnover: 30,
                    results_communicated_publicly: true
                }
            ],
            sustainable_sourcing_suppliers_percentage: 40.2
        }
    },
    
    // Principle 5 - using sc_p5_human_rights path
    sc_p5_human_rights: {
        essential_indicators: {
            hr_training: {
                employees: {
                    permanent: {
                        count_current_fy: 120,
                        percentage_current_fy: 80
                    }
                },
                workers: {
                    permanent: {
                        count_current_fy: 200,
                        percentage_current_fy: 90
                    }
                }
            },
            minimum_wages: {
                employees: {
                    permanent: {
                        equal_to_min_wage_percentage_current_fy: 10,
                        more_than_min_wage_percentage_current_fy: 90
                    }
                },
                workers: {
                    permanent: {
                        equal_to_min_wage_percentage_current_fy: 15,
                        more_than_min_wage_percentage_current_fy: 85
                    }
                }
            },
            remuneration: {
                bod: {
                    male_median_remuneration_current_fy: "5000000",
                    female_median_remuneration_current_fy: "4800000",
                    ratio_current_fy: "1.04:1"
                },
                workers: {
                    male_median_remuneration_current_fy: "300000",
                    female_median_remuneration_current_fy: "300000",
                    ratio_current_fy: "1:1"
                }
            },
            focal_point_for_human_rights: true,
            grievance_redressal_mechanisms: "We have established a grievance redressal committee",
            complaints_current_fy: {
                sexual_harassment: {
                    filed: 2, // Note this uses 'filed' not 'filed_current_fy'
                    pending: 0,
                    resolved: 2,
                    remarks: "All cases resolved"
                }
            },
            anti_retaliation_mechanisms: "Anti-retaliation policy is in place",
            hr_in_business_agreements: true,
            assessments_plants_offices: {
                child_labour_percent: 100,
                forced_labour_percent: 100,
                sexual_harassment_percent: 100,
                discrimination_workplace_percent: 100,
                wages_percent: 100,
                others_text: "Other assessments",
                others_percent: 90
            },
            corrective_actions_risks_q9: "No issues identified requiring corrective actions"
        },
        leadership_indicators: {
            process_modification_grievances: "We have modified our HR processes based on feedback"
        }
    }
};

// Simple company data
const companyData = {
    company_name: "Test Company Ltd.",
    cin: "L12345MH2020PLC123456",
    email: "contact@testcompany.com"
};

// Empty calculated data
const calculatedData = {};

// Generate the PDF
const outputPath = path.join(__dirname, 'test_fixed_principles.pdf');

// Generate the PDF with test data
generateBRSRPdf({
    outputPath,
    reportData: testData,
    companyData,
    calculatedData
})
.then(result => {
    console.log(\`PDF successfully generated at: \${result}\`);
    console.log("Please check if Principle 2 and Principle 5 data is correctly displayed.");
})
.catch(error => {
    console.error(\`Error generating PDF: \${error.message}\`);
    console.error(error);
});
`;

// Save the test script
const testScriptPath = path.join(__dirname, 'testFixedPrinciples.js');
fs.writeFileSync(testScriptPath, testScriptContent, 'utf8');
console.log(`Test script created at: ${testScriptPath}`);
console.log('Run "node testFixedPrinciples.js" to test the fixes.');

// End of script
    `if (data.count_current_fy !== undefined || data.percentage_current_fy !== undefined) {
                    trainingRows.push([
                        \`Employees - \${category}\`,
                        data.count_current_fy || 0,
                        \`\${data.percentage_current_fy || 0}%\`
                    ]);
                }`
);

pdfGeneratorContent = pdfGeneratorContent.replace(
    /Object\.keys\(ei\.minimum_wages\[type\]\)\.forEach\(category => \{…\}\);/g,
    `Object.keys(ei.minimum_wages[type]).forEach(category => {
                    const data = ei.minimum_wages[type][category] || {};
                    wageRows.push([
                        \`\${type.charAt(0).toUpperCase() + type.slice(1)} - \${category}\`,
                        \`\${data.equal_to_min_wage_percentage_current_fy || 0}%\`,
                        \`\${data.more_than_min_wage_percentage_current_fy || 0}%\`
                    ]);
                });`
);

pdfGeneratorContent = pdfGeneratorContent.replace(
    /if \(Object\.keys\(data\)\.length > 0\) \{…\}/g,
    `if (Object.keys(data).length > 0) {
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
            }`
);

pdfGeneratorContent = pdfGeneratorContent.replace(
    /if \(Object\.keys\(data\)\.length > 0\) \{…\}/g,
    `if (Object.keys(data).length > 0) {
                complaintRows.push([
                    complaintTypes[type],
                    data.filed || 0,
                    data.pending || 0,
                    data.resolved || 0,
                    data.remarks || 'N/A'
                ]);
            }`
);

pdfGeneratorContent = pdfGeneratorContent.replace(
    /if \(complaintRows\.length > 0\) \{…\}/g,
    `if (complaintRows.length > 0) {
            content.push(drawSimpleTable({ headers: complaintHeaders, rows: complaintRows }));
        }`
);

pdfGeneratorContent = pdfGeneratorContent.replace(
    /if \(ei\.assessments_plants_offices\.others_text\) \{…\}/g,
    `if (ei.assessments_plants_offices.others_text) {
            assessmentRows.push([
                ei.assessments_plants_offices.others_text,
                ei.assessments_plants_offices.others_percent !== undefined ? \`\${ei.assessments_plants_offices.others_percent}%\` : 'N/A'
            ]);
        }`
);

// Fix for Principle 6 incomplete code
pdfGeneratorContent = pdfGeneratorContent.replace(
    /function renderPrinciple6\(p6Data, calcData\) \{\s+const content = \[\];\s+content\.push\(addPrincipleTitle\("6", "Businesses should respect and make efforts to protect and restore the environment\."\)\);\s+if \(!p6Data \|\| !p6Data\.essential_indicators\) \{…\}/g,
    `function renderPrinciple6(p6Data, calcData) {
    const content = [];
    content.push(addPrincipleTitle("6", "Businesses should respect and make efforts to protect and restore the environment."));
    if (!p6Data || !p6Data.essential_indicators) {
        content.push({ text: "Principle 6 data not available.", style: 'p_italic' });
        return content;
    }`
);

// Fix how principles are called in the main function
pdfGeneratorContent = pdfGeneratorContent.replace(
    /const p2Data = reportData\.sc_p2_sustainable_safe_goods \|\| reportData\.sc_principle2_data \|\| \{\};/g,
    `const p2Data = reportData.sc_p2_sustainable_safe_goods || reportData.sc_principle2_data || {};
        console.log("Principle 2 data:", p2Data);`
);

// Write the fixed content back to the file
fs.writeFileSync(pdfGeneratorPath, pdfGeneratorContent, 'utf8');

console.log('Fixed pdfGenerator_fixed.js successfully!');
