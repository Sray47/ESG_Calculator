// brsr_backend/pdfGenerator_fixed.js
const Pdfmake = require('pdfmake');
const fs = require('fs');
const vfsFonts = require('pdfmake/build/vfs_fonts.js');

const fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};
const printer = new Pdfmake(fonts);
printer.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts.vfs;

// --- HELPER FUNCTIONS ---

function getPageMargins() { return [40, 60, 40, 60]; } // [left, top, right, bottom]

function addSectionTitle(title, options = {}) {
    return { text: title, style: 'h1', pageBreak: options.pageBreak || undefined, margin: options.margin || [0, 15, 0, 10] };
}

function addPrincipleTitle(principleNumber, title) {
    return { text: `PRINCIPLE ${principleNumber}: ${title}`, style: 'h2', margin: [0, 15, 0, 5] };
}

function addSubHeading(text) {
    return { text: text, style: 'h3', margin: [0, 10, 0, 5] };
}

function addRegularText(text, options = {}) {
    if (text === null || text === undefined || text === '') return { text: 'N/A', style: 'p_italic' };
    return { text: String(text), style: 'p', margin: options.margin || [0, 0, 0, 5], alignment: options.alignment || 'justify' };
}

function renderKeyValue(key, value) {
    return {
        columns: [
            { text: String(key), style: 'b', width: 200 },
            { text: `: ${value !== null && value !== undefined ? value : 'N/A'}`, width: '*' }
        ],
        margin: [0, 2, 0, 2],
        columnGap: 5
    };
}

function drawSimpleTable(tableData) {
    if (!tableData || !tableData.headers || !tableData.rows) {
        return { text: 'Table data missing or malformed.', style: 'errorText' };
    }
    const body = [
        tableData.headers.map(header => ({ text: String(header), style: 'tableHeader' }))
    ];
    tableData.rows.forEach(row => {
        body.push(row.map(cell => ({ text: String(cell !== null && cell !== undefined ? cell : ''), style: 'tableCell' })));
    });

    return {
        table: {
            headerRows: 1,
            widths: Array(tableData.headers.length).fill('*'),
            body: body,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
    };
}


// --- RENDER FUNCTIONS FOR EACH SECTION ---

function renderSectionA(reportData, companyData, calculatedData) {
    const content = [];
    content.push(addSectionTitle('SECTION A: GENERAL DISCLOSURES', { pageBreak: 'before' }));

    const sa = reportData;
    const company = companyData;
    const calc = calculatedData.sectionA;
    
    content.push(
        addSubHeading('I. Details of the listed entity'),
        renderKeyValue('1. Corporate Identity Number (CIN)', company.cin),
        renderKeyValue('2. Name of the Listed Entity', company.company_name),
        renderKeyValue('3. Year of Incorporation', company.year_of_incorporation),
        renderKeyValue('4. Registered Office Address', company.registered_office_address),
        renderKeyValue('5. Corporate Office Address', company.corporate_address),
        renderKeyValue('6. Email', company.email),
        renderKeyValue('7. Telephone', company.telephone),
        renderKeyValue('8. Website', company.website),
        renderKeyValue('9. Financial Year for reporting', sa.financial_year),
        renderKeyValue('10. Name of Stock Exchange(s)', (company.stock_exchange_listed || []).join(', ')),
        renderKeyValue('11. Paid-up Capital (INR)', company.paid_up_capital),
        renderKeyValue('12. Contact for BRSR queries', `${company.brsr_contact_name} (${company.brsr_contact_mail})`),
        renderKeyValue('13. Reporting boundary', sa.reporting_boundary)
    );

    content.push(addSubHeading('II. Products / Services'));
    if (sa.sa_product_services_turnover?.length) {
        content.push(addRegularText('15. Products/Services sold by the entity (accounting for 90% of Turnover):'));
        content.push(drawSimpleTable({
            headers: ["Product/Service", "NIC Code", "% of total Turnover"],
            rows: sa.sa_product_services_turnover.map(p => [p.product_service, p.nic_code, p.turnover_contributed])
        }));
    }

    content.push(addSubHeading('III. Operations'));
    if (calc.locations) {
        content.push(addRegularText('16. Number of locations:'));
        content.push(drawSimpleTable({
            headers: ["Location", "Number of plants", "Number of offices", "Total"],
            rows: [
                ['National', company.sa_locations_plants_offices?.national_plants || 0, company.sa_locations_plants_offices?.national_offices || 0, calc.locations.national_total],
                ['International', company.sa_locations_plants_offices?.international_plants || 0, company.sa_locations_plants_offices?.international_offices || 0, calc.locations.international_total]
            ]
        }));
    }
    
    content.push(addRegularText('17. Markets Served by the entity:'));
    content.push(
        renderKeyValue('a) Number of locations', `National: ${sa.sa_markets_served?.locations?.national_states || 0} States, International: ${sa.sa_markets_served?.locations?.international_countries || 0} Countries`),
        renderKeyValue('b) Contribution of exports as a percentage of total turnover', `${sa.sa_markets_served?.exports_percentage || 0}%`),
        renderKeyValue('c) A brief on types of customers', sa.sa_markets_served?.customer_types || 'N/A')
    );
    
    content.push(addSubHeading('IV. Employees'));
    if(calc.employees) {
        content.push(addRegularText('18. Details as at the end of Financial Year:'));
        content.push(
            addRegularText('a) Employees and workers (including differently abled):'),
            drawSimpleTable({
                headers: ["Particulars", "Male", "Female", "Total"],
                rows: [
                    [{text: 'EMPLOYEES (Executives)', style: 'b', colSpan: 4}, {}, {}, {}],
                    ['Permanent', sa.sa_employee_details?.permanent_male, sa.sa_employee_details?.permanent_female, calc.employees.permanent_total],
                    ['Other than Permanent', sa.sa_employee_details?.other_than_permanent_male, sa.sa_employee_details?.other_than_permanent_female, calc.employees.other_total],
                    [{text: 'Total employees', style: 'b'}, calc.employees.total_male, calc.employees.total_female, calc.employees.grand_total],
                    [{text: 'WORKERS', style: 'b', colSpan: 4}, {}, {}, {}],
                    ['Permanent', sa.sa_workers_details?.permanent_male, sa.sa_workers_details?.permanent_female, calc.workers.permanent_total],
                    ['Other than Permanent', sa.sa_workers_details?.other_than_permanent_male, sa.sa_workers_details?.other_than_permanent_female, calc.workers.other_total],
                    [{text: 'Total workers', style: 'b'}, calc.workers.total_male, calc.workers.total_female, calc.workers.grand_total]
                ]
            })
        );
        content.push(
            addRegularText('b) Differently abled Employees and workers:'),
            drawSimpleTable({
                headers: ["Particulars", "Male", "Female", "Total"],
                rows: [
                    ['Differently abled employees', sa.sa_differently_abled_details?.employees_male, sa.sa_differently_abled_details?.employees_female, calc.differently_abled.employees_total],
                    ['Differently abled workers', sa.sa_differently_abled_details?.workers_male, sa.sa_differently_abled_details?.workers_female, calc.differently_abled.workers_total]
                ]
            })
        );
    }

    if (calc.women_representation) {
        content.push(addRegularText('19. Participation/Inclusion/Representation of women:'));
        content.push(drawSimpleTable({
            headers: ["Category", "Total (A)", "No. of Females (B)", "% (B/A)"],
            rows: [
                ['Board of Directors', sa.sa_women_representation_details?.board_total_members, sa.sa_women_representation_details?.board_number_of_women, calc.women_representation.board_percentage],
                ['Key Management Personnel', sa.sa_women_representation_details?.kmp_total_personnel, sa.sa_women_representation_details?.kmp_number_of_women, calc.women_representation.kmp_percentage]
            ]
        }));
    }

    // Add more sections from Section A as needed...

    return content;
}

// Accepts sectionBData directly, not the whole reportData
function renderSectionB(sectionBData, calculatedData) {
    const content = [];
    const sectionB = sectionBData || {};
    
    content.push(addSectionTitle('SECTION B: MANAGEMENT AND PROCESS DISCLOSURES', { pageBreak: 'before' }));

    // Q1. Statement from Director (OCR2 Sl.No.7)
    content.push(addSubHeading('1. Statement by director responsible for the business responsibility report'));
    content.push(addRegularText(sectionB.sb_director_statement || 'N/A'));

    // Q2. Details of ESG Responsible Individual (OCR2 Sl.No.8)
    content.push(addSubHeading('2. Details of the highest authority responsible for implementation and oversight of the Business Responsibility policy(ies)'));
    const esgResponsible = sectionB.sb_esg_responsible_individual || {};
    content.push(
        renderKeyValue('Name', esgResponsible.name || 'N/A'),
        renderKeyValue('Designation', esgResponsible.designation || 'N/A'),
        renderKeyValue('DIN (if Director)', esgResponsible.din_if_director || 'N/A'),
        renderKeyValue('Email', esgResponsible.email || 'N/A'),
        renderKeyValue('Phone', esgResponsible.phone || 'N/A')
    );

    // Q3. Policy and Management Processes for NGRBC Principles
    content.push(addSubHeading('3. Policy and management processes for NGRBC Principles'));
    
    if (sectionB.sb_principle_policies && Array.isArray(sectionB.sb_principle_policies)) {
        const principleNames = [
            "Social: Human Rights",
            "Environmental: Natural Capital", 
            "Social: Employee Well-being",
            "Social: Stakeholder Engagement",
            "Governance: Ethical Conduct",
            "Environmental: Circular Economy",
            "Governance: Policy Advocacy",
            "Social: Inclusive Development",
            "Social: Customer Value"
        ];

        // Create principle policies table
        const policyHeaders = [
            'Principle',
            'Has Policy',
            'Board Approved',
            'Policy Text/URL',
            'Extends to Value Chain',
            'Performance Against Targets'
        ];

        const policyRows = [];
        sectionB.sb_principle_policies.forEach((policy, index) => {
            const principleNum = policy.principle || (index + 1);
            const principleName = principleNames[principleNum - 1] || `Principle ${principleNum}`;
            
            policyRows.push([
                `P${principleNum}: ${principleName}`,
                policy.has_policy ? 'Yes' : 'No',
                policy.is_board_approved ? 'Yes' : 'No',
                policy.policy_text_or_url || 'N/A',
                policy.extends_to_value_chain ? 'Yes' : 'No',
                policy.performance_against_targets || 'N/A'
            ]);

            // Add reasons for not having policy if applicable
            if (!policy.has_policy) {
                const reasons = [];
                if (policy.reason_q12_not_material) reasons.push('Not Material');
                if (policy.reason_q12_not_at_stage) reasons.push('Not at Stage');
                if (policy.reason_q12_no_resources) reasons.push('No Resources');
                if (policy.reason_q12_planned_next_year) reasons.push('Planned Next Year');
                if (policy.reason_q12_other_text) reasons.push(`Other: ${policy.reason_q12_other_text}`);
                
                if (reasons.length > 0) {
                    content.push(addRegularText(`Reasons for no policy on ${principleName}: ${reasons.join(', ')}`));
                }
            }
        });

        content.push(drawSimpleTable({
            headers: policyHeaders,
            rows: policyRows
        }));
    } else {
        content.push(addRegularText('No principle policy data available.'));
    }

    // Q9. Sustainability Committee
    content.push(addSubHeading('9. Sustainability Committee'));
    const sustainabilityCommittee = sectionB.sb_sustainability_committee || {};
    content.push(renderKeyValue('Has Committee', sustainabilityCommittee.has_committee ? 'Yes' : 'No'));
    if (sustainabilityCommittee.has_committee && sustainabilityCommittee.details) {
        content.push(addRegularText(`Committee Details: ${sustainabilityCommittee.details}`));
    }

    // Q10. Details of Review of NGRBCs by the Company
    content.push(addSubHeading('10. Details of Review of NGRBCs by the Company'));
    const ngrbcReview = sectionB.sb_ngrbc_company_review || {};
    content.push(
        renderKeyValue('Performance Review', ngrbcReview.performance_review_yn ? 'Yes' : 'No'),
        renderKeyValue('Compliance Review', ngrbcReview.compliance_review_yn ? 'Yes' : 'No'),
        renderKeyValue('Review Undertaken By', ngrbcReview.review_undertaken_by || 'N/A'),
        renderKeyValue('Frequency', ngrbcReview.frequency || 'N/A')
    );

    // Q11. Independent Assessment/Evaluation by External Agency
    content.push(addSubHeading('11. Independent Assessment/Evaluation by External Agency'));
    const externalAssessment = sectionB.sb_external_policy_assessment || {};
    content.push(renderKeyValue('Conducted', externalAssessment.conducted ? 'Yes' : 'No'));
    if (externalAssessment.conducted && externalAssessment.agency_name) {
        content.push(renderKeyValue('Agency Name', externalAssessment.agency_name));
    }

    return content;
}

// --- RENDER FUNCTIONS FOR PRINCIPLES --- //

function renderPrinciple1(p1Data, calcData) {
    if (!p1Data?.essential_indicators) return [{ text: "Principle 1 data not available.", style: 'p_italic' }];
    const content = [];
    content.push(addPrincipleTitle("1", "Businesses should conduct and govern themselves with integrity, and in a manner that is Ethical, Transparent and Accountable."));
    const ei = p1Data.essential_indicators;

    content.push(addSubHeading("Essential Indicators"));
    content.push(renderKeyValue('1. Anti-corruption / anti-bribery policy:', ei.anti_corruption_policy?.has_policy ? 'Yes' : 'No'));
    if (ei.anti_corruption_policy?.has_policy) {
        content.push(addRegularText(ei.anti_corruption_policy.details, { indent: 15 }));
        content.push({ text: `Weblink: ${ei.anti_corruption_policy.weblink}`, style: 'link', margin: [15, 0, 0, 5] });
    }
    content.push(renderKeyValue('2. Concerns reporting process:', ei.concerns_reporting_process?.has_process ? 'Yes' : 'No'));
    if (ei.concerns_reporting_process?.has_process) {
        content.push(addRegularText(ei.concerns_reporting_process.process_details, { indent: 15 }));
    }
    content.push(renderKeyValue('3. Number of instances of ethical concerns', ei.ethical_concerns_instances?.count || 0));
    if (ei.ethical_concerns_instances?.details) {
        content.push(addRegularText(`Details: ${ei.ethical_concerns_instances.details}`));
    }
    content.push(addSubHeading('4. Details of fines/penalties for corruption and conflicts of interest'));
    if (ei.fines_penalties_corruption?.current_fy || ei.fines_penalties_corruption?.previous_fy) {
        content.push(drawSimpleTable({
            headers: ['Parameter', 'Current FY', 'Previous FY'],
            rows: [
                ['Amount (INR)', ei.fines_penalties_corruption?.current_fy?.amount || 0, ei.fines_penalties_corruption?.previous_fy?.amount || 0],
                ['Frequency', ei.fines_penalties_corruption?.current_fy?.frequency || 0, ei.fines_penalties_corruption?.previous_fy?.frequency || 0]
            ]
        }));
    } else {
        content.push(addRegularText('No fines or penalties reported.'));
    }

    // Leadership Indicators
    if (p1Data.leadership_indicators) {
        const li = p1Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        content.push(renderKeyValue('Board awareness on ESG risks and opportunities', li.board_awareness_esg?.aware ? 'Yes' : 'No'));
        if (li.board_awareness_esg?.details) {
            content.push(addRegularText(`Details: ${li.board_awareness_esg.details}`));
        }

        content.push(renderKeyValue('Processes to avoid conflicts of interest', li.conflict_avoidance_processes?.has_processes ? 'Yes' : 'No'));
        if (li.conflict_avoidance_processes?.details) {
            content.push(addRegularText(`Details: ${li.conflict_avoidance_processes.details}`));
        }
    }

    return content;
}

// Enhanced renderPrinciple1PdfMake function with complete implementation
function renderPrinciple1PdfMake(p1Data, calculatedData) {
    if (!p1Data || !p1Data.essential_indicators) {
        return [{ text: "Principle 1 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("1", "Businesses should conduct and govern themselves with integrity, and in a manner that is Ethical, Transparent and Accountable."));
    
    const ei = p1Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Anti-corruption/anti-bribery policy
    content.push(renderKeyValue('1. Anti-corruption/anti-bribery policy', ei.anti_corruption_policy?.has_policy ? 'Yes' : 'No'));
    if (ei.anti_corruption_policy?.has_policy) {
        content.push(addRegularText(`Details: ${ei.anti_corruption_policy.details || 'N/A'}`));
        if (ei.anti_corruption_policy.weblink) {
            content.push({ text: `Weblink: ${ei.anti_corruption_policy.weblink}`, style: 'link' });
        }
    }

    // EI 2: Concerns reporting process
    content.push(renderKeyValue('2. Process for reporting concerns on unethical behavior', ei.concerns_reporting_process?.has_process ? 'Yes' : 'No'));
    if (ei.concerns_reporting_process?.has_process) {
        content.push(addRegularText(`Process Details: ${ei.concerns_reporting_process.process_details || 'N/A'}`));
    }

    // EI 3: Number of instances of ethical concerns
    content.push(renderKeyValue('3. Number of instances of ethical concerns', ei.ethical_concerns_instances?.count || 0));
    if (ei.ethical_concerns_instances?.details) {
        content.push(addRegularText(`Details: ${ei.ethical_concerns_instances.details}`));
    }

    // EI 4: Details of fines/penalties
    content.push(addSubHeading('4. Details of fines/penalties for corruption and conflicts of interest'));
    if (ei.fines_penalties_corruption?.current_fy || ei.fines_penalties_corruption?.previous_fy) {
        content.push(drawSimpleTable({
            headers: ['Parameter', 'Current FY', 'Previous FY'],
            rows: [
                ['Amount (INR)', ei.fines_penalties_corruption?.current_fy?.amount || 0, ei.fines_penalties_corruption?.previous_fy?.amount || 0],
                ['Frequency', ei.fines_penalties_corruption?.current_fy?.frequency || 0, ei.fines_penalties_corruption?.previous_fy?.frequency || 0]
            ]
        }));
    } else {
        content.push(addRegularText('No fines or penalties reported.'));
    }

    // Leadership Indicators
    if (p1Data.leadership_indicators) {
        const li = p1Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        content.push(renderKeyValue('Board awareness on ESG risks and opportunities', li.board_awareness_esg?.aware ? 'Yes' : 'No'));
        if (li.board_awareness_esg?.details) {
            content.push(addRegularText(`Details: ${li.board_awareness_esg.details}`));
        }

        content.push(renderKeyValue('Processes to avoid conflicts of interest', li.conflict_avoidance_processes?.has_processes ? 'Yes' : 'No'));
        if (li.conflict_avoidance_processes?.details) {
            content.push(addRegularText(`Details: ${li.conflict_avoidance_processes.details}`));
        }
    }

    return content;
}

// Enhanced renderPrinciple2PdfMake function
function renderPrinciple2PdfMake(p2Data, calculatedData) {
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
        content.push(addRegularText(`Details: ${ei.sustainable_sourcing_procedures.details}`));
    }

    // EI 3: Reclaimed/recycled input materials
    content.push(renderKeyValue('3. Percentage of recycled/reclaimed input materials', `${ei.recycled_input_materials_percentage || 0}%`));

    // EI 4: Sustainable sourcing from SMEs/MSMEs
    content.push(renderKeyValue('4. Sustainable sourcing from SMEs/MSMEs', ei.sustainable_sourcing_sme_percentage ? `${ei.sustainable_sourcing_sme_percentage}%` : 'N/A'));

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
                    `${lca.percentage_of_turnover || 0}%`,
                    lca.results_communicated_publicly ? 'Yes' : 'No'
                ])
            }));
        }

        content.push(renderKeyValue('Sustainable sourcing from suppliers', li.sustainable_sourcing_suppliers_percentage ? `${li.sustainable_sourcing_suppliers_percentage}%` : 'N/A'));
    }

    return content;
}

// Enhanced renderPrinciple3PdfMake function
function renderPrinciple3PdfMake(p3Data, calculatedData) {
    if (!p3Data || !p3Data.essential_indicators) {
        return [{ text: "Principle 3 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("3", "Businesses should respect and promote the well-being of all employees, including those in their value chains."));
    
    const ei = p3Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Total number of employees and workers
    content.push(addSubHeading('1. Details of employees and workers'));
    if (ei.employee_worker_details) {
        const details = ei.employee_worker_details;
        content.push(drawSimpleTable({
            headers: ['Category', 'Total', 'Male', 'Female'],
            rows: [
                ['Employees', details.employees_total || 0, details.employees_male || 0, details.employees_female || 0],
                ['Workers', details.workers_total || 0, details.workers_male || 0, details.workers_female || 0]
            ]
        }));
    }

    // EI 2: Employee associations and collective bargaining
    content.push(addSubHeading('2. Employee associations and collective bargaining'));
    if (ei.employee_association_collective_bargaining) {
        const cb = ei.employee_association_collective_bargaining;
        content.push(drawSimpleTable({
            headers: ['Category', 'Total Eligible', 'Covered by Collective Bargaining (%)'],
            rows: [
                ['Permanent Employees', cb.permanent_employees_total || 0, `${cb.permanent_employees_collective_bargaining_percentage || 0}%`],
                ['Permanent Workers', cb.permanent_workers_total || 0, `${cb.permanent_workers_collective_bargaining_percentage || 0}%`]
            ]
        }));
    }

    // EI 3: Retirement benefits
    content.push(addSubHeading('3. Details of retirement benefits'));
    if (ei.retirement_benefits_permanent_employees || ei.retirement_benefits_other_employees) {
        const benefitTypes = ['pf', 'gratuity', 'superannuation'];
        const benefitLabels = ['Provident Fund', 'Gratuity', 'Superannuation Fund'];
        
        const benefitRows = [];
        benefitTypes.forEach((type, index) => {
            const permData = ei.retirement_benefits_permanent_employees?.[`${type}_count_current_fy`] || 0;
            const otherData = ei.retirement_benefits_other_employees?.[`${type}_count_current_fy`] || 0;
            benefitRows.push([benefitLabels[index], permData, otherData]);
        });

        content.push(drawSimpleTable({
            headers: ['Benefit', 'Permanent Employees', 'Other than Permanent'],
            rows: benefitRows
        }));
    }

    // EI 4: Workplace accessibility for differently abled
    content.push(renderKeyValue('4. Workplace accessibility for differently abled', ei.workplace_accessibility_differently_abled?.is_accessible_current_fy ? 'Yes' : 'No'));
    if (ei.workplace_accessibility_differently_abled?.facilities_details_current_fy) {
        content.push(addRegularText(`Facilities Details: ${ei.workplace_accessibility_differently_abled.facilities_details_current_fy}`));
    }

    // EI 5: Equal remuneration
    content.push(renderKeyValue('5. Equal remuneration policy', ei.equal_remuneration_policy?.has_policy ? 'Yes' : 'No'));
    if (ei.equal_remuneration_policy?.details) {
        content.push(addRegularText(`Details: ${ei.equal_remuneration_policy.details}`));
    }

    // EI 6: Complaints on working conditions and health & safety
    content.push(addSubHeading('6. Complaints on working conditions and health & safety'));
    if (ei.complaints_working_conditions) {
        const complaints = ei.complaints_working_conditions;
        const complaintTypes = ['working_conditions', 'child_labour', 'forced_labour', 'involuntary_labour', 'sexual_harassment', 'discrimination'];
        const complaintLabels = ['Working Conditions', 'Child Labour', 'Forced Labour', 'Involuntary Labour', 'Sexual Harassment', 'Discrimination'];
        
        const complaintRows = [];
        complaintTypes.forEach((type, index) => {
            const typeData = complaints[type];
            if (typeData) {
                complaintRows.push([
                    complaintLabels[index],
                    typeData.filed_current_fy || 0,
                    typeData.pending_current_fy || 0,
                    typeData.remarks_current_fy || 'N/A'
                ]);
            }
        });

        if (complaintRows.length > 0) {
            content.push(drawSimpleTable({
                headers: ['Category', 'Filed (Current FY)', 'Pending (Current FY)', 'Remarks'],
                rows: complaintRows
            }));
        }
    }

    // Leadership Indicators
    if (p3Data.leadership_indicators) {
        const li = p3Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        content.push(renderKeyValue('Well-being measures beyond legal requirements', li.wellbeing_measures_beyond_legal?.has_measures ? 'Yes' : 'No'));
        if (li.wellbeing_measures_beyond_legal?.details) {
            content.push(addRegularText(`Details: ${li.wellbeing_measures_beyond_legal.details}`));
        }
    }

    return content;
}

// Enhanced renderPrinciple4PdfMake function
function renderPrinciple4PdfMake(p4Data, calculatedData) {
    if (!p4Data || !p4Data.essential_indicators) {
        return [{ text: "Principle 4 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("4", "Businesses should respect the interests of and be responsive to all its stakeholders."));
    
    const ei = p4Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Stakeholder identification and engagement
    content.push(addSubHeading('1. Stakeholder identification and engagement'));
    if (ei.stakeholder_identification_engagement) {
        const stakeholders = ei.stakeholder_identification_engagement;
        if (Array.isArray(stakeholders) && stakeholders.length > 0) {
            content.push(drawSimpleTable({
                headers: ['Stakeholder Group', 'Whether Identified as Vulnerable', 'Channels of Communication', 'Frequency of Engagement'],
                rows: stakeholders.map(sh => [
                    sh.stakeholder_group || 'N/A',
                    sh.identified_as_vulnerable ? 'Yes' : 'No',
                    sh.channels_of_communication || 'N/A',
                    sh.frequency_of_engagement || 'N/A'
                ])
            }));
        }
    }

    // EI 2: Feedback mechanism for vulnerable stakeholders
    content.push(renderKeyValue('2. Feedback mechanism for vulnerable stakeholders', ei.vulnerable_stakeholder_feedback?.has_mechanism ? 'Yes' : 'No'));
    if (ei.vulnerable_stakeholder_feedback?.details) {
        content.push(addRegularText(`Details: ${ei.vulnerable_stakeholder_feedback.details}`));
    }

    // Leadership Indicators
    if (p4Data.leadership_indicators) {
        const li = p4Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        content.push(renderKeyValue('Stakeholder consultation on ESG risks', li.stakeholder_consultation_esg?.conducted ? 'Yes' : 'No'));
        if (li.stakeholder_consultation_esg?.details) {
            content.push(addRegularText(`Details: ${li.stakeholder_consultation_esg.details}`));
        }
    }

    return content;
}

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
        
        if (ei.hr_training.employees) {
            Object.keys(ei.hr_training.employees).forEach(category => {
                const data = ei.hr_training.employees[category];
                if (data.count_current_fy !== null || data.percentage_current_fy !== null) {
                    trainingRows.push([
                        `Employees - ${category.replace(/_/g, ' ')}`,
                        data.count_current_fy || 0,
                        data.percentage_current_fy ? `${data.percentage_current_fy}%` : 'N/A'
                    ]);
                }
            });
        }
        
        if (ei.hr_training.workers) {
            Object.keys(ei.hr_training.workers).forEach(category => {
                const data = ei.hr_training.workers[category];
                if (data.count_current_fy !== null || data.percentage_current_fy !== null) {
                    trainingRows.push([
                        `Workers - ${category.replace(/_/g, ' ')}`,
                        data.count_current_fy || 0,
                        data.percentage_current_fy ? `${data.percentage_current_fy}%` : 'N/A'
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
            if (ei.minimum_wages[type]) {
                Object.keys(ei.minimum_wages[type]).forEach(category => {
                    const data = ei.minimum_wages[type][category];
                    wageRows.push([
                        `${type.charAt(0).toUpperCase() + type.slice(1)} - ${category.replace(/_/g, ' ')}`,
                        data.equal_to_minimum_wage_count || 0,
                        data.more_than_minimum_wage_count || 0
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
    if (ei.remuneration) {
        const remunerationHeaders = ['Category', 'Male', 'Female', 'Median (M:F Ratio)'];
        const remunerationRows = [];
        
        ['bod', 'kmp', 'employees_other_than_bod_kmp', 'workers'].forEach(category => {
            const data = ei.remuneration[category];
            if (data) {
                remunerationRows.push([
                    category.replace(/_/g, ' ').toUpperCase(),
                    data.male_median || 'N/A',
                    data.female_median || 'N/A',
                    data.median_ratio || 'N/A'
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
    content.push(renderKeyValue('5. Grievance redressal mechanisms', ei.grievance_redressal_mechanisms || 'N/A'));

    // EI 6: Complaints received (Current FY)
    content.push(addSubHeading('6. Complaints received during current financial year'));
    if (ei.complaints_current_fy) {
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
            const data = ei.complaints_current_fy[type];
            if (data) {
                complaintRows.push([
                    complaintTypes[type],
                    data.filed_current_fy || 0,
                    data.pending_current_fy || 0,
                    data.resolved_current_fy || 0,
                    data.remarks_current_fy || 'N/A'
                ]);
            }
        });
        
        if (complaintRows.length > 0) {
            content.push(drawSimpleTable({ headers: complaintHeaders, rows: complaintRows }));
        }
    }

    // EI 7: Anti-retaliation mechanisms
    content.push(renderKeyValue('7. Anti-retaliation mechanisms', ei.anti_retaliation_mechanisms || 'N/A'));

    // EI 8: Human rights in business agreements
    content.push(renderKeyValue('8. Human rights covered in business agreements', ei.hr_in_business_agreements ? 'Yes' : 'No'));

    // EI 9: Assessments for the year
    content.push(addSubHeading('9. Assessments for the year (% of plants/offices covered)'));
    if (ei.assessments_plants_offices) {
        const assessmentHeaders = ['Assessment Type', 'Percentage'];
        const assessmentRows = [
            ['Child Labour', ei.assessments_plants_offices.child_labour_percent ? `${ei.assessments_plants_offices.child_labour_percent}%` : 'N/A'],
            ['Forced/Involuntary Labour', ei.assessments_plants_offices.forced_labour_percent ? `${ei.assessments_plants_offices.forced_labour_percent}%` : 'N/A'],
            ['Sexual Harassment', ei.assessments_plants_offices.sexual_harassment_percent ? `${ei.assessments_plants_offices.sexual_harassment_percent}%` : 'N/A'],
            ['Discrimination at workplace', ei.assessments_plants_offices.discrimination_workplace_percent ? `${ei.assessments_plants_offices.discrimination_workplace_percent}%` : 'N/A'],
            ['Wages', ei.assessments_plants_offices.wages_percent ? `${ei.assessments_plants_offices.wages_percent}%` : 'N/A']
        ];
        
        if (ei.assessments_plants_offices.others_text) {
            assessmentRows.push([
                ei.assessments_plants_offices.others_text,
                ei.assessments_plants_offices.others_percent ? `${ei.assessments_plants_offices.others_percent}%` : 'N/A'
            ]);
        }
        
        content.push(drawSimpleTable({ headers: assessmentHeaders, rows: assessmentRows }));
    }

    // EI 10: Corrective actions from Q9
    content.push(renderKeyValue('10. Corrective actions from assessments', ei.corrective_actions_risks_q9 || 'N/A'));

    // Leadership Indicators
    if (p5Data.leadership_indicators) {
        const li = p5Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        // LI 1: Process modification due to HR grievances
        content.push(renderKeyValue('1. Process modification due to HR grievances', li.process_modification_grievances || 'N/A'));

        // LI 2: HR due-diligence scope
        content.push(renderKeyValue('2. HR due-diligence scope', li.hr_due_diligence_scope || 'N/A'));

        // LI 3: Accessibility for differently-abled
        content.push(renderKeyValue('3. Premise accessible to differently abled', li.accessibility_for_disabled ? 'Yes' : (li.accessibility_for_disabled === false ? 'No' : 'N/A')));

        // LI 4: Assessment of value chain partners
        content.push(addSubHeading('4. Assessment of value chain partners (% by business value)'));
        if (li.assessment_value_chain_partners) {
            const valueChainHeaders = ['Assessment Type', 'Percentage'];
            const valueChainRows = [
                ['Sexual Harassment', li.assessment_value_chain_partners.sexual_harassment_percent ? `${li.assessment_value_chain_partners.sexual_harassment_percent}%` : 'N/A'],
                ['Discrimination at workplace', li.assessment_value_chain_partners.discrimination_workplace_percent ? `${li.assessment_value_chain_partners.discrimination_workplace_percent}%` : 'N/A'],
                ['Child Labour', li.assessment_value_chain_partners.child_labour_percent ? `${li.assessment_value_chain_partners.child_labour_percent}%` : 'N/A'],
                ['Forced Labour', li.assessment_value_chain_partners.forced_labour_percent ? `${li.assessment_value_chain_partners.forced_labour_percent}%` : 'N/A'],
                ['Wages', li.assessment_value_chain_partners.wages_percent ? `${li.assessment_value_chain_partners.wages_percent}%` : 'N/A']
            ];
            
            if (li.assessment_value_chain_partners.others_text) {
                valueChainRows.push([
                    li.assessment_value_chain_partners.others_text,
                    li.assessment_value_chain_partners.others_percent ? `${li.assessment_value_chain_partners.others_percent}%` : 'N/A'
                ]);
            }
            
            content.push(drawSimpleTable({ headers: valueChainHeaders, rows: valueChainRows }));
        }

        // LI 5: Corrective actions from LI Q4
        content.push(renderKeyValue('5. Corrective actions from value chain assessments', li.corrective_actions_risks_q4_li || 'N/A'));
    }

    return content;
}

function renderPrinciple6(p6Data, calcData) {
    if (!p6Data?.essential_indicators) {
        return [{ text: "Principle 6 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("6", "Businesses should respect and make efforts to protect and restore the environment."));
    
    const ei = p6Data.essential_indicators;
    const calc = calcData.p6;

    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Energy consumption and intensity
    content.push(addSubHeading('1. Details of total energy consumption and energy intensity'));
    if (ei.energy_consumption) {
        const energyHeaders = ['Parameter', 'Current FY', 'Previous FY'];
        const energyRows = [];
        
        if (ei.energy_consumption.current_fy) {
            const currentFY = ei.energy_consumption.current_fy;
            energyRows.push([
                'Total electricity consumption (A)',
                currentFY.total_electricity_consumption || 'N/A',
                ei.energy_consumption.previous_fy?.total_electricity_consumption || 'N/A'
            ]);
            energyRows.push([
                'Total fuel consumption (B)',
                currentFY.total_fuel_consumption || 'N/A',
                ei.energy_consumption.previous_fy?.total_fuel_consumption || 'N/A'
            ]);
            energyRows.push([
                'Energy consumption through other sources (C)',
                currentFY.energy_consumption_other_sources || 'N/A',
                ei.energy_consumption.previous_fy?.energy_consumption_other_sources || 'N/A'
            ]);
            energyRows.push([
                'Total energy consumption (A+B+C)',
                currentFY.total_energy_consumption || 'N/A',
                ei.energy_consumption.previous_fy?.total_energy_consumption || 'N/A'
            ]);
            energyRows.push([
                'Energy intensity per rupee of turnover',
                currentFY.energy_intensity_per_rupee_turnover || 'N/A',
                ei.energy_consumption.previous_fy?.energy_intensity_per_rupee_turnover || 'N/A'
            ]);
        }
        
        if (energyRows.length > 0) {
            content.push(drawSimpleTable({ headers: energyHeaders, rows: energyRows }));
        }
    } else {
        content.push(addRegularText('No energy consumption data available.'));
    }

    // EI 2: Water withdrawal, consumption and discharge
    content.push(addSubHeading('2. Details of water withdrawal, consumption and discharge'));
    if (ei.water_withdrawal_consumption_discharge) {
        const waterHeaders = ['Parameter', 'Current FY', 'Previous FY'];
        const waterRows = [];
        
        if (ei.water_withdrawal_consumption_discharge.current_fy) {
            const currentFY = ei.water_withdrawal_consumption_discharge.current_fy;
            waterRows.push([
                'Water withdrawal by source (in kilolitres)',
                currentFY.water_withdrawal_by_source || 'N/A',
                ei.water_withdrawal_consumption_discharge.previous_fy?.water_withdrawal_by_source || 'N/A'
            ]);
            waterRows.push([
                'Total volume of water consumption (in kilolitres)',
                currentFY.total_volume_water_consumption || 'N/A',
                ei.water_withdrawal_consumption_discharge.previous_fy?.total_volume_water_consumption || 'N/A'
            ]);
            waterRows.push([
                'Water intensity per rupee of turnover',
                currentFY.water_intensity_per_rupee_turnover || 'N/A',
                ei.water_withdrawal_consumption_discharge.previous_fy?.water_intensity_per_rupee_turnover || 'N/A'
            ]);
            waterRows.push([
                'Total volume of water discharge (in kilolitres)',
                currentFY.total_volume_water_discharge || 'N/A',
                ei.water_withdrawal_consumption_discharge.previous_fy?.total_volume_water_discharge || 'N/A'
            ]);
        }
        
        if (waterRows.length > 0) {
            content.push(drawSimpleTable({ headers: waterHeaders, rows: waterRows }));
        }
    } else {
        content.push(addRegularText('No water withdrawal/consumption data available.'));
    }

    // EI 3: Total GHG emissions and intensity
    content.push(addSubHeading('3. Total GHG emissions and intensity'));
    if (ei.total_ghg_emissions) {
        const ghgHeaders = ['Parameter', 'Current FY', 'Previous FY'];
        const ghgRows = [];
        
        if (ei.total_ghg_emissions.current_fy) {
            const currentFY = ei.total_ghg_emissions.current_fy;
            ghgRows.push([
                'Total Scope 1 emissions (Metric tonnes of CO2 equivalent)',
                currentFY.total_scope_1_emissions || 'N/A',
                ei.total_ghg_emissions.previous_fy?.total_scope_1_emissions || 'N/A'
            ]);
            ghgRows.push([
                'Total Scope 2 emissions (Metric tonnes of CO2 equivalent)',
                currentFY.total_scope_2_emissions || 'N/A',
                ei.total_ghg_emissions.previous_fy?.total_scope_2_emissions || 'N/A'
            ]);
            ghgRows.push([
                'Total Scope 1 and Scope 2 emissions per rupee of turnover',
                currentFY.total_scope_1_2_intensity_per_rupee_turnover || 'N/A',
                ei.total_ghg_emissions.previous_fy?.total_scope_1_2_intensity_per_rupee_turnover || 'N/A'
            ]);
        }
        
        if (ghgRows.length > 0) {
            content.push(drawSimpleTable({ headers: ghgHeaders, rows: ghgRows }));
        }
    } else {
        content.push(addRegularText('No GHG emissions data available.'));
    }

    // EI 4: Water positive enterprise
    content.push(renderKeyValue('4. Does the entity have any project related to reducing Greenhouse Gas emission?', 
        ei.ghg_projects?.has_projects ? 'Yes' : 'No'));
    if (ei.ghg_projects?.has_projects && ei.ghg_projects.project_details) {
        content.push(addRegularText(`Project Details: ${ei.ghg_projects.project_details}`));
    }

    // EI 5: Details related to waste management
    content.push(addSubHeading('5. Details related to waste management'));
    if (ei.waste_management) {
        const wasteHeaders = ['Parameter', 'Current FY', 'Previous FY'];
        const wasteRows = [];
        
        if (ei.waste_management.current_fy) {
            const currentFY = ei.waste_management.current_fy;
            wasteRows.push([
                'Total Waste generated (in metric tonnes)',
                currentFY.total_waste_generated || 'N/A',
                ei.waste_management.previous_fy?.total_waste_generated || 'N/A'
            ]);
            wasteRows.push([
                'Plastic waste (A)',
                currentFY.plastic_waste || 'N/A',
                ei.waste_management.previous_fy?.plastic_waste || 'N/A'
            ]);
            wasteRows.push([
                'E-waste (B)',
                currentFY.e_waste || 'N/A',
                ei.waste_management.previous_fy?.e_waste || 'N/A'
            ]);
            wasteRows.push([
                'Bio-medical waste (C)',
                currentFY.bio_medical_waste || 'N/A',
                ei.waste_management.previous_fy?.bio_medical_waste || 'N/A'
            ]);
            wasteRows.push([
                'Construction and demolition waste (D)',
                currentFY.construction_demolition_waste || 'N/A',
                ei.waste_management.previous_fy?.construction_demolition_waste || 'N/A'
            ]);
            wasteRows.push([
                'Battery waste (E)',
                currentFY.battery_waste || 'N/A',
                ei.waste_management.previous_fy?.battery_waste || 'N/A'
            ]);
            wasteRows.push([
                'Radioactive waste (F)',
                currentFY.radioactive_waste || 'N/A',
                ei.waste_management.previous_fy?.radioactive_waste || 'N/A'
            ]);
            wasteRows.push([
                'Other Hazardous waste (G)',
                currentFY.other_hazardous_waste || 'N/A',
                ei.waste_management.previous_fy?.other_hazardous_waste || 'N/A'
            ]);
            wasteRows.push([
                'Other Non-hazardous waste (H)',
                currentFY.other_non_hazardous_waste || 'N/A',
                ei.waste_management.previous_fy?.other_non_hazardous_waste || 'N/A'
            ]);
            wasteRows.push([
                'Total (A+B+C+D+E+F+G+H)',
                currentFY.total_waste_sum || 'N/A',
                ei.waste_management.previous_fy?.total_waste_sum || 'N/A'
            ]);
        }
        
        if (wasteRows.length > 0) {
            content.push(drawSimpleTable({ headers: wasteHeaders, rows: wasteRows }));
        }
    } else {
        content.push(addRegularText('No waste management data available.'));
    }

    // EI 6: Provide details of air emissions
    content.push(addSubHeading('6. Details of air emissions (other than GHG emissions)'));
    if (ei.air_emissions_non_ghg) {
        const emissionHeaders = ['Parameter', 'Current FY', 'Previous FY'];
        const emissionRows = [];
        
        if (ei.air_emissions_non_ghg.current_fy) {
            const currentFY = ei.air_emissions_non_ghg.current_fy;
            emissionRows.push([
                'NOx (kg)',
                currentFY.nox || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.nox || 'N/A'
            ]);
            emissionRows.push([
                'SOx (kg)',
                currentFY.sox || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.sox || 'N/A'
            ]);
            emissionRows.push([
                'Particulate matter (PM) (kg)',
                currentFY.particulate_matter || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.particulate_matter || 'N/A'
            ]);
            emissionRows.push([
                'Persistent organic pollutants (POP) (kg)',
                currentFY.persistent_organic_pollutants || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.persistent_organic_pollutants || 'N/A'
            ]);
            emissionRows.push([
                'Volatile organic compounds (VOC) (kg)',
                currentFY.volatile_organic_compounds || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.volatile_organic_compounds || 'N/A'
            ]);
            emissionRows.push([
                'Hazardous air pollutants (HAP) (kg)',
                currentFY.hazardous_air_pollutants || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.hazardous_air_pollutants || 'N/A'
            ]);
            emissionRows.push([
                'Others (kg)',
                currentFY.others || 'N/A',
                ei.air_emissions_non_ghg.previous_fy?.others || 'N/A'
            ]);
        }
        
        if (emissionRows.length > 0) {
            content.push(drawSimpleTable({ headers: emissionHeaders, rows: emissionRows }));
        }
    } else {
        content.push(addRegularText('No air emissions data available.'));
    }

    // EI 7: Environmental management system
    content.push(renderKeyValue('7. Environmental management system in place', ei.environmental_management_system?.is_implemented ? 'Yes' : 'No'));
    if (ei.environmental_management_system?.is_implemented && ei.environmental_management_system.certification_details) {
        content.push(addRegularText(`Certification Details: ${ei.environmental_management_system.certification_details}`));
    }

    // EI 8: Environmental compliance
    content.push(renderKeyValue('8. Number of environmental compliance non-conformities', ei.environmental_compliance?.non_conformities_count || 0));
    if (ei.environmental_compliance?.action_taken) {
        content.push(addRegularText(`Action Taken: ${ei.environmental_compliance.action_taken}`));
    }

    // EI 9: Environmental standards certification
    content.push(renderKeyValue('9. Environmental standards certification', ei.environmental_standards_certification?.has_certification ? 'Yes' : 'No'));
    if (ei.environmental_standards_certification?.has_certification && ei.environmental_standards_certification.standards_list) {
        content.push(addRegularText(`Standards: ${ei.environmental_standards_certification.standards_list}`));
    }

    // EI 10: Biodiversity impact
    content.push(addSubHeading('10. Biodiversity impact in ecologically sensitive areas'));
    if (ei.biodiversity_impact?.has_operations_near_sensitive_areas !== null) {
        content.push(renderKeyValue('Operations near/in ecologically sensitive areas', 
            ei.biodiversity_impact.has_operations_near_sensitive_areas ? 'Yes' : 'No'));
        if (ei.biodiversity_impact.has_operations_near_sensitive_areas && ei.biodiversity_impact.details_of_operations) {
            content.push(addRegularText(`Details: ${ei.biodiversity_impact.details_of_operations}`));
        }
    }

    // EI 11: Environmental Impact Assessments (EIA)
    content.push(addSubHeading('11. Environmental Impact Assessments (EIA) conducted'));
    if (ei.eia_current_fy?.list && ei.eia_current_fy.list.length > 0) {
        const eiaHeaders = ['Project Details', 'EIA Notification No.', 'Date', 'Conducted by', 'Public Domain'];
        const eiaRows = ei.eia_current_fy.list.map(eia => [
            eia.project_details || 'N/A',
            eia.eia_notification_no || 'N/A',
            eia.date || 'N/A',
            eia.conducted_by || 'N/A',
            eia.results_in_public_domain ? 'Yes' : 'No'
        ]);
        content.push(drawSimpleTable({ headers: eiaHeaders, rows: eiaRows }));
    } else {
        content.push(addRegularText('No EIA conducted during current financial year.'));
    }

    // Leadership Indicators
    if (p6Data.leadership_indicators) {
        const li = p6Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        // LI 1: Water positive enterprise
        content.push(renderKeyValue('1. Water positive enterprise', li.water_positive_enterprise?.is_water_positive ? 'Yes' : 'No'));
        if (li.water_positive_enterprise?.is_water_positive && li.water_positive_enterprise.details) {
            content.push(addRegularText(`Details: ${li.water_positive_enterprise.details}`));
        }

        // LI 2: Zero waste to landfill
        content.push(renderKeyValue('2. Zero waste to landfill', li.zero_waste_to_landfill?.achieved ? 'Yes' : 'No'));
        if (li.zero_waste_to_landfill?.achieved && li.zero_waste_to_landfill.details) {
            content.push(addRegularText(`Details: ${li.zero_waste_to_landfill.details}`));
        }

        // LI 3: Air pollution reduction
        content.push(renderKeyValue('3. Air pollution reduction initiatives', li.air_pollution_reduction?.has_initiatives ? 'Yes' : 'No'));
        if (li.air_pollution_reduction?.has_initiatives && li.air_pollution_reduction.initiatives_details) {
            content.push(addRegularText(`Details: ${li.air_pollution_reduction.initiatives_details}`));
        }

        // LI 4: Scope 3 GHG emissions
        content.push(addSubHeading('4. Scope 3 GHG emissions'));
        if (li.scope_3_emissions?.current_fy) {
            const scope3Headers = ['Parameter', 'Current FY', 'Previous FY'];
            const scope3Rows = [
                [
                    'Total Scope 3 emissions (Metric tonnes of CO2 equivalent)',
                    li.scope_3_emissions.current_fy.total_scope_3_emissions || 'N/A',
                    li.scope_3_emissions.previous_fy?.total_scope_3_emissions || 'N/A'
                ],
                [
                    'Scope 3 intensity per rupee of turnover',
                    li.scope_3_emissions.current_fy.intensity_turnover || 'N/A',
                    li.scope_3_emissions.previous_fy?.intensity_turnover || 'N/A'
                ]
            ];
            content.push(drawSimpleTable({ headers: scope3Headers, rows: scope3Rows }));
        }

        // LI 5: Biodiversity impact details
        if (li.biodiversity_impact_ecologically_sensitive_areas_details) {
            content.push(renderKeyValue('5. Biodiversity impact in sensitive areas details', 
                li.biodiversity_impact_ecologically_sensitive_areas_details));
        }

        // LI 6: Resource efficiency initiatives
        content.push(addSubHeading('6. Resource efficiency initiatives'));
        if (li.resource_efficiency_initiatives?.list && li.resource_efficiency_initiatives.list.length > 0) {
            const initiativeHeaders = ['Sr.No.', 'Initiative Undertaken', 'Details', 'Outcome'];
            const initiativeRows = li.resource_efficiency_initiatives.list.map((initiative, index) => [
                index + 1,
                initiative.initiative_undertaken || 'N/A',
                initiative.details_of_initiative || 'N/A',
                initiative.outcome_of_initiative || 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: initiativeHeaders, rows: initiativeRows }));
        }
    }

    return content;
}

// Enhanced renderPrinciple7PdfMake function
function renderPrinciple7PdfMake(p7Data, calculatedData) {
    if (!p7Data || !p7Data.essential_indicators) {
        return [{ text: "Principle 7 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("7", "Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent."));
    
    const ei = p7Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Memberships in trade and industry chambers/associations
    content.push(addSubHeading('1. Affiliations with trade and industry chambers/associations'));
    if (ei.trade_and_industry_chambers_associations && ei.trade_and_industry_chambers_associations.length > 0) {
        const membershipHeaders = ['S.No.', 'Name of the trade and industry chambers/associations', 'Reach (State/National)'];
        const membershipRows = ei.trade_and_industry_chambers_associations.map((membership, index) => [
            index + 1,
            membership.name || 'N/A',
            membership.reach || 'N/A'
        ]);
        content.push(drawSimpleTable({ headers: membershipHeaders, rows: membershipRows }));
    } else {
        content.push(addRegularText('No memberships in trade and industry chambers/associations reported.'));
    }

    // EI 2: Details of corrective action taken or underway on any issues related to anti-competitive conduct
    content.push(addSubHeading('2. Corrective action on issues related to anti-competitive conduct'));
    if (ei.anti_competitive_conduct_corrective_actions && ei.anti_competitive_conduct_corrective_actions.length > 0) {
        const actionHeaders = ['Name of Authority', 'Brief of the Case', 'Corrective Action Taken'];
        const actionRows = ei.anti_competitive_conduct_corrective_actions.map(action => [
            action.name_of_authority || 'N/A',
            action.brief_of_case || 'N/A',
            action.corrective_action_taken || 'N/A'
        ]);
        content.push(drawSimpleTable({ headers: actionHeaders, rows: actionRows }));
    } else {
        content.push(addRegularText('No corrective actions on anti-competitive conduct reported.'));
    }

    // Leadership Indicators
    if (p7Data.leadership_indicators) {
        const li = p7Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        // LI 1: Details of public policy positions advocated
        content.push(addSubHeading('1. Public policy positions advocated'));
        if (li.public_policy_positions_advocated && li.public_policy_positions_advocated.length > 0) {
            const policyHeaders = ['S.No.', 'Policy Advocated', 'Method of Advocacy', 'Board Review Frequency', 'Web Link'];
            const policyRows = li.public_policy_positions_advocated.map((policy, index) => [
                index + 1,
                policy.policy_advocated || 'N/A',
                policy.method_of_advocacy || 'N/A',
                policy.board_review_frequency || 'N/A',
                policy.web_link || 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: policyHeaders, rows: policyRows }));
        } else {
            content.push(addRegularText('No public policy positions advocated reported.'));
        }
    }

    return content;
}

// Enhanced renderPrinciple8PdfMake function
function renderPrinciple8PdfMake(p8Data, calculatedData) {
    if (!p8Data || !p8Data.essential_indicators) {
        return [{ text: "Principle 8 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("8", "Businesses should promote inclusive growth and equitable development."));
    
    const ei = p8Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Details of Social Impact Assessments (SIA)
    content.push(addSubHeading('1. Details of Social Impact Assessments (SIA) of projects'));
    if (ei.social_impact_assessments && ei.social_impact_assessments.length > 0) {
        const siaHeaders = ['S.No.', 'Project Details', 'SIA Notification No.', 'Date', 'Conducted by', 'Results in Public Domain', 'Web Link'];
        const siaRows = ei.social_impact_assessments.map((sia, index) => [
            index + 1,
            sia.project_details || 'N/A',
            sia.sia_notification_no || 'N/A',
            sia.date_of_notification || 'N/A',
            sia.conducted_by || 'N/A',
            sia.results_communicated_in_public_domain ? 'Yes' : 'No',
            sia.relevant_web_link || 'N/A'
        ]);
        content.push(drawSimpleTable({ headers: siaHeaders, rows: siaRows }));
    } else {
        content.push(addRegularText('No Social Impact Assessments conducted.'));
    }

    // EI 2: Rehabilitation and Resettlement (R&R) projects
    content.push(addSubHeading('2. Rehabilitation and Resettlement (R&R) projects'));
    if (ei.rehab_resettlement_projects && ei.rehab_resettlement_projects.length > 0) {
        const rrHeaders = ['S.No.', 'Name of Project', 'State', 'District', 'No. of PAFs', 'Amounts Paid (INR)'];
        const rrRows = ei.rehab_resettlement_projects.map((project, index) => [
            index + 1,
            project.name_of_project_ongoing_rr || 'N/A',
            project.state || 'N/A',
            project.district || 'N/A',
            project.no_of_paf || 'N/A',
            project.amounts_paid_to_pafs_fy_inr || 'N/A'
        ]);
        content.push(drawSimpleTable({ headers: rrHeaders, rows: rrRows }));
    } else {
        content.push(addRegularText('No Rehabilitation and Resettlement projects.'));
    }

    // EI 3: Community grievance mechanisms
    content.push(renderKeyValue('3. Community grievance mechanisms', ei.community_grievance_mechanisms || 'N/A'));

    // EI 4: Input material sourcing
    content.push(addSubHeading('4. Input material sourcing (Current FY)'));
    if (ei.input_material_sourcing?.current_fy) {
        const sourcingData = ei.input_material_sourcing.current_fy;
        content.push(renderKeyValue('Directly from MSMEs/small producers (%)', 
            sourcingData.directly_from_msme_small_producers_percent ? `${sourcingData.directly_from_msme_small_producers_percent}%` : 'N/A'));
        content.push(renderKeyValue('Directly from district and neighbouring districts (%)', 
            sourcingData.directly_from_district_neighbouring_percent ? `${sourcingData.directly_from_district_neighbouring_percent}%` : 'N/A'));
    } else {
        content.push(addRegularText('No input material sourcing data available.'));
    }

    // Leadership Indicators
    if (p8Data.leadership_indicators) {
        const li = p8Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        // LI 1: Social impact mitigation actions
        content.push(addSubHeading('1. Social impact mitigation actions'));
        if (li.social_impact_mitigation_actions && li.social_impact_mitigation_actions.length > 0) {
            const mitigationHeaders = ['Details of Negative Social Impact Identified', 'Corrective Action Taken'];
            const mitigationRows = li.social_impact_mitigation_actions.map(action => [
                action.negative_social_impact_identified || 'N/A',
                action.corrective_action_taken || 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: mitigationHeaders, rows: mitigationRows }));
        } else {
            content.push(addRegularText('No social impact mitigation actions reported.'));
        }

        // LI 2: CSR projects in aspirational districts
        content.push(addSubHeading('2. CSR projects in aspirational districts'));
        if (li.csr_aspirational_districts_projects && li.csr_aspirational_districts_projects.length > 0) {
            const csrHeaders = ['S.No.', 'State', 'Aspirational District', 'Amount Spent (INR)'];
            const csrRows = li.csr_aspirational_districts_projects.map((project, index) => [
                project.s_no || (index + 1),
                project.state || 'N/A',
                project.aspirational_district || 'N/A',
                project.amount_spent_inr || 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: csrHeaders, rows: csrRows }));
        } else {
            content.push(addRegularText('No CSR projects in aspirational districts.'));
        }

        // LI 3: Preferential procurement
        content.push(addSubHeading('3. Preferential procurement'));
        if (li.preferential_procurement) {
            content.push(renderKeyValue('Has preferential procurement policy', 
                li.preferential_procurement.has_policy ? 'Yes' : 'No'));
            
            if (li.preferential_procurement.has_policy) {
                if (li.preferential_procurement.marginalized_vulnerable_groups_procured_from && 
                    li.preferential_procurement.marginalized_vulnerable_groups_procured_from.length > 0) {
                    content.push(addRegularText(`Marginalized/vulnerable groups procured from: ${li.preferential_procurement.marginalized_vulnerable_groups_procured_from.join(', ')}`));
                }
                
                if (li.preferential_procurement.percentage_total_procurement_by_value !== null) {
                    content.push(renderKeyValue('Percentage of total procurement by value', 
                        `${li.preferential_procurement.percentage_total_procurement_by_value}%`));
                }
            }
        }

        // LI 4: IP and traditional knowledge benefits
        content.push(addSubHeading('4. IP and traditional knowledge benefits'));
        if (li.ip_traditional_knowledge_benefits && li.ip_traditional_knowledge_benefits.length > 0) {
            const ipHeaders = ['S.No.', 'IP based on traditional knowledge', 'Owned/Acquired', 'Benefit Shared', 'Basis of Calculating Benefit Share'];
            const ipRows = li.ip_traditional_knowledge_benefits.map((ip, index) => [
                ip.s_no || (index + 1),
                ip.ip_based_on_traditional_knowledge || 'N/A',
                ip.owned_acquired || 'N/A',
                ip.benefit_shared_yes_no ? 'Yes' : 'No',
                ip.basis_of_calculating_benefit_share || 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: ipHeaders, rows: ipRows }));
        } else {
            content.push(addRegularText('No IP and traditional knowledge benefits reported.'));
        }

        // LI 5: IP disputes and traditional knowledge actions
        content.push(addSubHeading('5. IP disputes and traditional knowledge actions'));
        if (li.ip_disputes_traditional_knowledge_actions && li.ip_disputes_traditional_knowledge_actions.length > 0) {
            const disputeHeaders = ['Name of Authority', 'Brief of Case', 'Corrective Action Taken'];
            const disputeRows = li.ip_disputes_traditional_knowledge_actions.map(dispute => [
                dispute.name_of_authority || 'N/A',
                dispute.brief_of_case || 'N/A',
                dispute.corrective_action_taken || 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: disputeHeaders, rows: disputeRows }));
        } else {
            content.push(addRegularText('No IP disputes or traditional knowledge actions reported.'));
        }

        // LI 6: CSR project beneficiaries details
        content.push(addSubHeading('6. CSR project beneficiaries details'));
        if (li.csr_project_beneficiaries_details && li.csr_project_beneficiaries_details.length > 0) {
            const beneficiaryHeaders = ['S.No.', 'CSR Project', 'No. of persons benefitted', '% of beneficiaries from vulnerable groups'];
            const beneficiaryRows = li.csr_project_beneficiaries_details.map((beneficiary, index) => [
                beneficiary.s_no || (index + 1),
                beneficiary.csr_project || 'N/A',
                beneficiary.persons_benefitted_from_csr || 'N/A',
                beneficiary.percent_beneficiaries_vulnerable_marginalized ? `${beneficiary.percent_beneficiaries_vulnerable_marginalized}%` : 'N/A'
            ]);
            content.push(drawSimpleTable({ headers: beneficiaryHeaders, rows: beneficiaryRows }));
        } else {
            content.push(addRegularText('No CSR project beneficiaries details reported.'));
        }
    }

    return content;
}

// Enhanced renderPrinciple9PdfMake function
function renderPrinciple9PdfMake(p9Data, calculatedData) {
    if (!p9Data || !p9Data.essential_indicators) {
        return [{ text: "Principle 9 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("9", "Businesses should engage with and provide value to their consumers in a responsible manner."));
    
    const ei = p9Data.essential_indicators;
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Consumer complaints
    content.push(addSubHeading('1. Consumer complaints'));
    if (ei.consumer_complaints) {
        const complaintHeaders = ['Category', 'Received during current FY', 'Pending resolution', 'Remarks'];
        const complaintRows = [];
        
        if (ei.consumer_complaints.data_privacy) {
            complaintRows.push([
                'Data privacy',
                ei.consumer_complaints.data_privacy.received_current_fy || 0,
                ei.consumer_complaints.data_privacy.pending_resolution_current_fy || 0,
                ei.consumer_complaints.data_privacy.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (ei.consumer_complaints.advertising) {
            complaintRows.push([
                'Advertising',
                ei.consumer_complaints.advertising.received_current_fy || 0,
                ei.consumer_complaints.advertising.pending_resolution_current_fy || 0,
                ei.consumer_complaints.advertising.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (ei.consumer_complaints.cyber_security) {
            complaintRows.push([
                'Cyber-security',
                ei.consumer_complaints.cyber_security.received_current_fy || 0,
                ei.consumer_complaints.cyber_security.pending_resolution_current_fy || 0,
                ei.consumer_complaints.cyber_security.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (ei.consumer_complaints.delivery_of_essential_services) {
            complaintRows.push([
                'Delivery of essential services',
                ei.consumer_complaints.delivery_of_essential_services.received_current_fy || 0,
                ei.consumer_complaints.delivery_of_essential_services.pending_resolution_current_fy || 0,
                ei.consumer_complaints.delivery_of_essential_services.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (ei.consumer_complaints.restrictive_trade_practices) {
            complaintRows.push([
                'Restrictive trade practices',
                ei.consumer_complaints.restrictive_trade_practices.received_current_fy || 0,
                ei.consumer_complaints.restrictive_trade_practices.pending_resolution_current_fy || 0,
                ei.consumer_complaints.restrictive_trade_practices.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (ei.consumer_complaints.unfair_trade_practices) {
            complaintRows.push([
                'Unfair trade practices',
                ei.consumer_complaints.unfair_trade_practices.received_current_fy || 0,
                ei.consumer_complaints.unfair_trade_practices.pending_resolution_current_fy || 0,
                ei.consumer_complaints.unfair_trade_practices.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (ei.consumer_complaints.other_consumer_issues) {
            complaintRows.push([
                'Other consumer issues',
                ei.consumer_complaints.other_consumer_issues.received_current_fy || 0,
                ei.consumer_complaints.other_consumer_issues.pending_resolution_current_fy || 0,
                ei.consumer_complaints.other_consumer_issues.remarks_current_fy || 'N/A'
            ]);
        }
        
        if (complaintRows.length > 0) {
            content.push(drawSimpleTable({ headers: complaintHeaders, rows: complaintRows }));
        } else {
            content.push(addRegularText('No consumer complaints data available.'));
        }
    } else {
        content.push(addRegularText('No consumer complaints data available.'));
    }

    // EI 2: Product recalls
    content.push(addSubHeading('2. Product recalls'));
    if (ei.product_recalls) {
        const recallHeaders = ['Product Category', 'Number of instances (Current FY)', 'Reasons for recall'];
        const recallRows = [];
        
        Object.keys(ei.product_recalls).forEach(category => {
            const recallData = ei.product_recalls[category];
            if (recallData && (recallData.instances_current_fy || recallData.reasons_for_recall)) {
                recallRows.push([
                    category.replace(/_/g, ' '),
                    recallData.instances_current_fy || 0,
                    recallData.reasons_for_recall || 'N/A'
                ]);
            }
        });
        
        if (recallRows.length > 0) {
            content.push(drawSimpleTable({ headers: recallHeaders, rows: recallRows }));
        } else {
            content.push(addRegularText('No product recalls reported.'));
        }
    } else {
        content.push(addRegularText('No product recalls data available.'));
    }

    // EI 3: Information on product or service labeling
    content.push(addSubHeading('3. Information on product or service labelling'));
    if (ei.product_service_information) {
        const infoItems = [
            { key: 'source_of_raw_materials', label: 'Source of raw materials' },
            { key: 'country_of_origin', label: 'Country of origin' },
            { key: 'recyclability', label: 'Recyclability' },
            { key: 'environmental_toxicity', label: 'Environmental toxicity' },
            { key: 'safety_warnings', label: 'Safety warnings' },
            { key: 'end_of_life_disposal', label: 'End of life disposal' }
        ];
        
        const infoHeaders = ['Information Type', 'Covered (Yes/No/N.A.)', 'Details'];
        const infoRows = infoItems.map(item => {
            const data = ei.product_service_information[item.key];
            let covered = 'N/A';
            let details = 'N/A';
            
            if (data) {
                if (data.covered === true) covered = 'Yes';
                else if (data.covered === false) covered = 'No';
                else if (data.covered === 'not_applicable') covered = 'Not Applicable';
                
                details = data.details || 'N/A';
            }
            
            return [item.label, covered, details];
        });
        
        content.push(drawSimpleTable({ headers: infoHeaders, rows: infoRows }));
    } else {
        content.push(addRegularText('No product/service information data available.'));
    }

    // EI 4: Consumer survey satisfaction score
    content.push(renderKeyValue('4. Consumer survey satisfaction score', 
        ei.consumer_survey_satisfaction_score?.score ? `${ei.consumer_survey_satisfaction_score.score}%` : 'N/A'));
    if (ei.consumer_survey_satisfaction_score?.methodology) {
        content.push(addRegularText(`Methodology: ${ei.consumer_survey_satisfaction_score.methodology}`));
    }

    // EI 5: Data security policy
    content.push(addSubHeading('5. Data security and privacy policy'));
    if (ei.data_security_privacy_policy) {
        content.push(renderKeyValue('Has policy', ei.data_security_privacy_policy.has_policy ? 'Yes' : 'No'));
        if (ei.data_security_privacy_policy.has_policy) {
            content.push(renderKeyValue('Policy weblink', ei.data_security_privacy_policy.policy_weblink || 'N/A'));
            content.push(renderKeyValue('Cybersecurity investment (% of revenue)', 
                ei.data_security_privacy_policy.cybersecurity_investment_percent_revenue ? 
                `${ei.data_security_privacy_policy.cybersecurity_investment_percent_revenue}%` : 'N/A'));
        }
    } else {
        content.push(addRegularText('No data security and privacy policy information available.'));
    }

    // EI 6: Corrective actions details
    content.push(renderKeyValue('6. Corrective actions for issues related to consumer complaints', 
        ei.corrective_actions_details || 'N/A'));

    // EI 7: Ethical supply chain governance (if available)
    if (ei.ethical_supply_chain_governance) {
        content.push(addSubHeading('7. Ethical supply chain governance'));
        content.push(renderKeyValue('Has integrated framework', 
            ei.ethical_supply_chain_governance.has_framework ? 'Yes' : 'No'));
        if (ei.ethical_supply_chain_governance.has_framework && ei.ethical_supply_chain_governance.code_of_conduct_followed) {
            content.push(renderKeyValue('Code of conduct followed', ei.ethical_supply_chain_governance.code_of_conduct_followed));
        }
    }

    // Leadership Indicators
    if (p9Data.leadership_indicators) {
        const li = p9Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        
        // LI 1: Product/service information channels
        if (li.product_service_info_channels_platforms) {
            content.push(renderKeyValue('1. Product/service information channels and platforms', 
                li.product_service_info_channels_platforms));
        }

        // LI 2: Steps to inform and educate safe usage
        if (li.steps_inform_educate_safe_responsible_usage) {
            content.push(renderKeyValue('2. Steps to inform and educate consumers on safe usage', 
                li.steps_inform_educate_safe_responsible_usage));
        }

        // LI 3: Mechanisms to inform about risks and disruption
        if (li.mechanisms_inform_risk_disruption_essential_services) {
            content.push(renderKeyValue('3. Mechanisms to inform about risks and service disruption', 
                li.mechanisms_inform_risk_disruption_essential_services));
        }

        // LI 4: Product information display
        content.push(addSubHeading('4. Product information display'));
        if (li.product_info_display_above_mandate) {
            const displayValue = li.product_info_display_above_mandate.displays_yes_no_na;
            let displayText = 'N/A';
            if (displayValue === true) displayText = 'Yes';
            else if (displayValue === false) displayText = 'No';
            else if (displayValue === 'not_applicable') displayText = 'Not Applicable';
            
            content.push(renderKeyValue('Displays product information above mandate', displayText));
            
            if (displayValue === true && li.product_info_display_above_mandate.details_if_yes) {
                content.push(addRegularText(`Details: ${li.product_info_display_above_mandate.details_if_yes}`));
            }
        }

        // LI 5: Consumer survey and action plan
        if (li.consumer_survey_action_plan) {
            content.push(addSubHeading('5. Consumer survey and action plan'));
            content.push(renderKeyValue('Survey undertaken', li.consumer_survey_action_plan.survey_undertaken ? 'Yes' : 'No'));
            if (li.consumer_survey_action_plan.survey_undertaken) {
                content.push(renderKeyValue('Percentage of consumers surveyed', 
                    li.consumer_survey_action_plan.percentage_consumers_surveyed ? 
                    `${li.consumer_survey_action_plan.percentage_consumers_surveyed}%` : 'N/A'));
                content.push(renderKeyValue('Action plan status', 
                    li.consumer_survey_action_plan.action_plan_status || 'N/A'));
            }
        }
    }

    return content;
}

// --- MAIN PDF GENERATION FUNCTION ---

function generateBRSRPdf({ outputPath, reportData, companyData, calculatedData }) {
    const content = [];

    // Section A - reportData contains all the fields directly
    content.push(...renderSectionA(reportData, companyData, calculatedData));

    // Section B - Look for section_b_data or sb_* fields in reportData
    const sectionBData = reportData.section_b_data || reportData.sb_policy_management || {};
    content.push(...renderSectionB(sectionBData, calculatedData));
    
    // Section C: Principles 1-9
    // Handle each principle with proper error handling and data path mapping
    
    // Principle 1: Ethics and Transparency
    try {
        const p1Data = reportData.sc_p1_ethical_conduct || reportData.sc_principle1_data || {};
        content.push(...renderPrinciple1PdfMake(p1Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 1:", error);
        content.push({ text: "Error rendering Principle 1 data", style: 'errorText' });
    }
    
    // Principle 2: Sustainable Products & Services
    try {
        const p2Data = reportData.sc_p2_sustainable_safe_goods || reportData.sc_principle2_data || {};
        content.push(...renderPrinciple2PdfMake(p2Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 2:", error);
        content.push({ text: "Error rendering Principle 2 data", style: 'errorText' });
    }
    
    // Principle 3: Employee Wellbeing
    try {
        const p3Data = reportData.sc_p3_employee_wellbeing || reportData.sc_principle3_data || {};
        content.push(...renderPrinciple3PdfMake(p3Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 3:", error);
        content.push({ text: "Error rendering Principle 3 data", style: 'errorText' });
    }
    
    // Principle 4: Stakeholder Engagement
    try {
        const p4Data = reportData.sc_p4_stakeholder_responsiveness || reportData.sc_principle4_data || {};
        content.push(...renderPrinciple4PdfMake(p4Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 4:", error);
        content.push({ text: "Error rendering Principle 4 data", style: 'errorText' });
    }
    
    // Principle 5: Human Rights
    try {
        const p5Data = reportData.sc_p5_human_rights || reportData.sc_principle5_data || {};
        content.push(...renderPrinciple5(p5Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 5:", error);
        content.push({ text: "Error rendering Principle 5 data", style: 'errorText' });
    }
    
    // Principle 6: Environment
    try {
        const p6Data = reportData.sc_p6_environment_protection || reportData.sc_principle6_data || {};
        content.push(...renderPrinciple6(p6Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 6:", error);
        content.push({ text: "Error rendering Principle 6 data", style: 'errorText' });
    }
    
    // Principle 7: Policy Advocacy
    try {
        const p7Data = reportData.sc_p7_policy_advocacy || reportData.sc_principle7_data || {};
        content.push(...renderPrinciple7PdfMake(p7Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 7:", error);
        content.push({ text: "Error rendering Principle 7 data", style: 'errorText' });
    }
    
    // Principle 8: Inclusive Growth
    try {
        const p8Data = reportData.sc_p8_inclusive_growth || reportData.sc_principle8_data || {};
        content.push(...renderPrinciple8PdfMake(p8Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 8:", error);
        content.push({ text: "Error rendering Principle 8 data", style: 'errorText' });
    }
    
    // Principle 9: Customer Value
    try {
        const p9Data = reportData.sc_p9_consumer_value || reportData.sc_principle9_data || {};
        content.push(...renderPrinciple9PdfMake(p9Data, calculatedData));
    } catch (error) {
        console.error("Error rendering Principle 9:", error);
        content.push({ text: "Error rendering Principle 9 data", style: 'errorText' });
    }
    // Document definition
    const docDefinition = {
        content,
        pageMargins: getPageMargins(),
        styles: {
            h1: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
            h2: { fontSize: 15, bold: true, margin: [0, 8, 0, 8] },
            h3: { fontSize: 13, bold: true, margin: [0, 6, 0, 6] },
            p: { fontSize: 11, margin: [0, 0, 0, 5] },
            p_italic: { fontSize: 11, italics: true, color: '#888', margin: [0, 0, 0, 5] },
            b: { bold: true },
            tableHeader: { bold: true, fillColor: '#f0f0f0', fontSize: 11 },
            tableCell: { fontSize: 11 },
            errorText: { color: 'red', italics: true },
            link: { color: 'blue', decoration: 'underline' }
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 11
        }
    };
    
    // If outputPath is provided, write to file. Otherwise, return buffer.
    if (outputPath) {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const writeStream = fs.createWriteStream(outputPath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve(outputPath);
            });
            writeStream.on('error', (err) => {
                reject(err);
            });
        });
    } else {
        // Collect PDF as buffer
        return new Promise((resolve, reject) => {
            const chunks = [];
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
}

// For compatibility, export the main PDF generation function as generateBRSRPdf
module.exports = {
    generateBRSRPdf: async function({ outputPath, reportData, companyData, calculatedData }) {
        const content = [];

        // Section A - reportData contains all the fields directly
        content.push(...renderSectionA(reportData, companyData, calculatedData));

        // Section B - Look for section_b_data or sb_* fields in reportData
        const sectionBData = reportData.section_b_data || reportData.sb_policy_management || {};
        content.push(...renderSectionB(sectionBData, calculatedData));
        
        // Section C: Principles 1-9
        // Handle each principle with proper error handling and data path mapping
        
        // Principle 1: Ethics and Transparency
        try {
            const p1Data = reportData.sc_p1_ethical_conduct || reportData.sc_principle1_data || {};
            content.push(...renderPrinciple1PdfMake(p1Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 1:", error);
            content.push({ text: "Error rendering Principle 1 data", style: 'errorText' });
        }
        
        // Principle 2: Sustainable Products & Services
        try {
            const p2Data = reportData.sc_p2_sustainable_safe_goods || reportData.sc_principle2_data || {};
            content.push(...renderPrinciple2PdfMake(p2Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 2:", error);
            content.push({ text: "Error rendering Principle 2 data", style: 'errorText' });
        }
        
        // Principle 3: Employee Wellbeing
        try {
            const p3Data = reportData.sc_p3_employee_wellbeing || reportData.sc_principle3_data || {};
            content.push(...renderPrinciple3PdfMake(p3Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 3:", error);
            content.push({ text: "Error rendering Principle 3 data", style: 'errorText' });
        }
        
        // Principle 4: Stakeholder Engagement
        try {
            const p4Data = reportData.sc_p4_stakeholder_responsiveness || reportData.sc_principle4_data || {};
            content.push(...renderPrinciple4PdfMake(p4Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 4:", error);
            content.push({ text: "Error rendering Principle 4 data", style: 'errorText' });
        }
        
        // Principle 5: Human Rights
        try {
            const p5Data = reportData.sc_p5_human_rights || reportData.sc_principle5_data || {};
            content.push(...renderPrinciple5(p5Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 5:", error);
            content.push({ text: "Error rendering Principle 5 data", style: 'errorText' });
        }
        
        // Principle 6: Environment
        try {
            const p6Data = reportData.sc_p6_environment_protection || reportData.sc_principle6_data || {};
            content.push(...renderPrinciple6(p6Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 6:", error);
            content.push({ text: "Error rendering Principle 6 data", style: 'errorText' });
        }
        
        // Principle 7: Policy Advocacy
        try {
            const p7Data = reportData.sc_p7_policy_advocacy || reportData.sc_principle7_data || {};
            content.push(...renderPrinciple7PdfMake(p7Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 7:", error);
            content.push({ text: "Error rendering Principle 7 data", style: 'errorText' });
        }
        
        // Principle 8: Inclusive Growth
        try {
            const p8Data = reportData.sc_p8_inclusive_growth || reportData.sc_principle8_data || {};
            content.push(...renderPrinciple8PdfMake(p8Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 8:", error);
            content.push({ text: "Error rendering Principle 8 data", style: 'errorText' });
        }
        
        // Principle 9: Customer Value
        try {
            const p9Data = reportData.sc_p9_consumer_value || reportData.sc_principle9_data || {};
            content.push(...renderPrinciple9PdfMake(p9Data, calculatedData));
        } catch (error) {
            console.error("Error rendering Principle 9:", error);
            content.push({ text: "Error rendering Principle 9 data", style: 'errorText' });
        }
        // Document definition
        const docDefinition = {
            content,
            pageMargins: getPageMargins(),
            styles: {
                h1: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
                h2: { fontSize: 15, bold: true, margin: [0, 8, 0, 8] },
                h3: { fontSize: 13, bold: true, margin: [0, 6, 0, 6] },
                p: { fontSize: 11, margin: [0, 0, 0, 5] },
                p_italic: { fontSize: 11, italics: true, color: '#888', margin: [0, 0, 0, 5] },
                b: { bold: true },
                tableHeader: { bold: true, fillColor: '#f0f0f0', fontSize: 11 },
                tableCell: { fontSize: 11 },
                errorText: { color: 'red', italics: true },
                link: { color: 'blue', decoration: 'underline' }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 11
            }
        };
        
        // If outputPath is provided, write to file. Otherwise, return buffer.
        if (outputPath) {
            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const writeStream = fs.createWriteStream(outputPath);
            pdfDoc.pipe(writeStream);
            pdfDoc.end();
            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => {
                    resolve(outputPath);
                });
                writeStream.on('error', (err) => {
                    reject(err);
                });
            });
        } else {
            // Collect PDF as buffer
            return new Promise((resolve, reject) => {
                const chunks = [];
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);
                pdfDoc.end();
            });
        }
    }
};