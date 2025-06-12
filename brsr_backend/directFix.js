// This script directly fixes specific issues in the PDF generator

const fs = require('fs');
const path = require('path');

// Function to create a complete fixed renderPrinciple5 function
function getFixedPrinciple5Function() {
  return `function renderPrinciple5(p5Data, calcData) {
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
    }
    return content;
}`;
}

// Read the pdfGenerator_fixed.js file
const pdfGeneratorPath = path.join(__dirname, 'pdfGenerator_fixed.js');
let content = fs.readFileSync(pdfGeneratorPath, 'utf8');

// Find the location of the renderPrinciple5 function
const principle5Regex = /function renderPrinciple5\(p5Data, calcData\) \{[\s\S]*?return content;\s*\}/;
const principle5Match = content.match(principle5Regex);

if (principle5Match) {
    // Replace the function with our fixed version
    content = content.replace(principle5Regex, getFixedPrinciple5Function());
    
    // Add debugging for Principle 2
    content = content.replace(
        /const p2Data = reportData\.sc_p2_sustainable_safe_goods \|\| reportData\.sc_principle2_data \|\| \{\};/g,
        `const p2Data = reportData.sc_p2_sustainable_safe_goods || reportData.sc_principle2_data || {};
        console.log("Principle 2 data structure:", JSON.stringify(p2Data, null, 2));`
    );
    
    // Write the modified content back to the file
    fs.writeFileSync(pdfGeneratorPath, content, 'utf8');
    console.log('Successfully fixed renderPrinciple5 function and added debugging for Principle 2');
} else {
    console.error('Could not find renderPrinciple5 function in the file');
}
