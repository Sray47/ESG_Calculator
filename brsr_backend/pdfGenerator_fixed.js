// brsr_backend/pdfGenerator_fixed.js
console.log("--- LOADING LATEST PDF GENERATOR (FULLY FORTIFIED V5 - FINAL) ---");
const Pdfmake = require('pdfmake');
const fs = require('fs');
const vfsFonts = require('pdfmake/build/vfs_fonts.js');
const { 
    generateESGPillarChart, 
    generateYoYComparisonChart, 
    generatePrincipleChart 
} = require('./chartGenerator');

// Font configuration - will be used inside generateBRSRPdf function
const fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

// Create the printer instance with proper font configuration
const printer = new Pdfmake(fonts);
// Set up the virtual file system for fonts
printer.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts.vfs;

// --- HELPER FUNCTIONS ---

function getPageMargins() { return [40, 80, 40, 60]; } // [left, top, right, bottom] - Increased top margin for header

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
            { text: String(key), style: 'b', width: 'auto' },
            { text: `: ${value !== null && value !== undefined && value !== '' ? value : 'N/A'}`, width: '*' }
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
    (tableData.rows || []).forEach(row => {
        body.push(row.map(cell => {
            if (typeof cell === 'object' && cell !== null && 'text' in cell) return cell;
            if (typeof cell === 'object' && cell !== null) return { text: '' };
            return { text: String(cell !== null && cell !== undefined ? cell : ''), style: 'tableCell' };
        }));
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
    content.push(addSectionTitle('SECTION A: GENERAL DISCLOSURES'));
    const sa = reportData || {};
    const company = companyData || {};
    const calc = calculatedData?.sectionA || {};
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
        renderKeyValue('12. Contact for BRSR queries', `${company.brsr_contact_name || ''} (${company.brsr_contact_mail || ''})`),
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
                    [{text: 'EMPLOYEES (Executives)', style: 'b', colSpan: 4}, '', '', ''],
                    ['Permanent', sa.sa_employee_details?.permanent_male, sa.sa_employee_details?.permanent_female, calc.employees.permanent_total],
                    ['Other than Permanent', sa.sa_employee_details?.other_than_permanent_male, sa.sa_employee_details?.other_than_permanent_female, calc.employees.other_total],
                    [{text: 'Total employees', style: 'b'}, calc.employees.total_male, calc.employees.total_female, calc.employees.grand_total],
                    [{text: 'WORKERS', style: 'b', colSpan: 4}, '', '', ''],
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
    return content;
}

function renderSectionB(sectionBData, calculatedData) {
    const content = [];
    const sectionB = sectionBData || {};
    content.push(addSectionTitle('SECTION B: MANAGEMENT AND PROCESS DISCLOSURES', { pageBreak: 'before' }));
    content.push(addSubHeading('1. Statement by director responsible for the business responsibility report'));
    content.push(addRegularText(sectionB.sb_director_statement));
    content.push(addSubHeading('2. Details of the highest authority responsible for implementation and oversight of the Business Responsibility policy(ies)'));
    const esgResponsible = sectionB.sb_esg_responsible_individual || {};
    content.push(
        renderKeyValue('Name', esgResponsible.name),
        renderKeyValue('Designation', esgResponsible.designation),
        renderKeyValue('DIN (if Director)', esgResponsible.din_if_director),
        renderKeyValue('Email', esgResponsible.email),
        renderKeyValue('Phone', esgResponsible.phone)
    );
    content.push(addSubHeading('3. Policy and management processes for NGRBC Principles'));
    const principlePolicies = sectionB.sb_principle_policies || [];
    if (principlePolicies.length > 0) {
        const principleNames = ["Social: Human Rights", "Environmental: Natural Capital", "Social: Employee Well-being", "Social: Stakeholder Engagement", "Governance: Ethical Conduct", "Environmental: Circular Economy", "Governance: Policy Advocacy", "Social: Inclusive Development", "Social: Customer Value"];
        const policyHeaders = ['Principle', 'Has Policy', 'Board Approved', 'Policy Text/URL', 'Extends to Value Chain', 'Performance Against Targets'];
        const policyRows = principlePolicies.map((policy, index) => {
            const principleNum = policy.principle || (index + 1);
            const principleName = principleNames[principleNum - 1] || `Principle ${principleNum}`;
            return [
                `P${principleNum}: ${principleName}`,
                policy.has_policy ? 'Yes' : 'No',
                policy.is_board_approved ? 'Yes' : 'No',
                policy.policy_text_or_url || 'N/A',
                policy.extends_to_value_chain ? 'Yes' : 'No',
                policy.performance_against_targets || 'N/A'
            ];
        });
        content.push(drawSimpleTable({ headers: policyHeaders, rows: policyRows }));
    } else {
        content.push(addRegularText('No principle policy data available.'));
    }
    content.push(addSubHeading('9. Sustainability Committee'));
    const sustainabilityCommittee = sectionB.sb_sustainability_committee || {};
    content.push(renderKeyValue('Has Committee', sustainabilityCommittee.has_committee ? 'Yes' : 'No'));
    if (sustainabilityCommittee.has_committee && sustainabilityCommittee.details) {
        content.push(addRegularText(`Committee Details: ${sustainabilityCommittee.details}`));
    }
    content.push(addSubHeading('10. Details of Review of NGRBCs by the Company'));
    const ngrbcReview = sectionB.sb_ngrbc_company_review || {};
    content.push(
        renderKeyValue('Performance Review', ngrbcReview.performance_review_yn ? 'Yes' : 'No'),
        renderKeyValue('Compliance Review', ngrbcReview.compliance_review_yn ? 'Yes' : 'No'),
        renderKeyValue('Review Undertaken By', ngrbcReview.review_undertaken_by),
        renderKeyValue('Frequency', ngrbcReview.frequency)
    );
    content.push(addSubHeading('11. Independent Assessment/Evaluation by External Agency'));
    const externalAssessment = sectionB.sb_external_policy_assessment || {};
    content.push(renderKeyValue('Conducted', externalAssessment.conducted ? 'Yes' : 'No'));
    if (externalAssessment.conducted && externalAssessment.agency_name) {
        content.push(renderKeyValue('Agency Name', externalAssessment.agency_name));
    }
    return content;
}

// --- PRINCIPLE RENDERING FUNCTIONS (PDFMake Format) ---

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
    if (!p2Data) {
        return [{ text: "Principle 2 data not available.", style: 'p_italic' }];
    }
    
    const content = [];
    content.push(addPrincipleTitle("2", "Businesses should provide goods and services in a manner that is sustainable and safe."));
    
    content.push(addSubHeading("Essential Indicators"));
    
    // EI 1: Percentage of R&D and capital expenditure
    content.push(addSubHeading('1. R&D and Capital Expenditure on Sustainability'));
    const rdCapex = p2Data.p2_essential_rd_capex_percentages;
    if (rdCapex) {
        content.push(drawSimpleTable({
            headers: ['Parameter', 'Current FY (%)', 'Details'],
            rows: [
                ['R&D', rdCapex.rd_percentage_current_fy || 0, rdCapex.rd_improvements_details || 'N/A'],
                ['Capital Expenditure', rdCapex.capex_percentage_current_fy || 0, rdCapex.capex_improvements_details || 'N/A']
            ]
        }));
    } else {
        content.push(addRegularText('No R&D or capital expenditure data available.'));
    }

    // EI 2: Procedures for sustainable sourcing
    const sourcing = p2Data.p2_essential_sustainable_sourcing;
    content.push(renderKeyValue('2. Procedures for sustainable sourcing', sourcing?.has_procedures ? 'Yes' : 'No'));
    if (sourcing?.percentage_inputs_sourced_sustainably) {
        content.push(renderKeyValue('   Percentage of inputs sourced sustainably', `${sourcing.percentage_inputs_sourced_sustainably}%`));
    }

    // EI 3: Reclaimed/recycled input materials
    const reclaim = p2Data.p2_essential_reclaim_processes_description;
    if (reclaim) {
        content.push(addSubHeading('3. Reclaimed/Recycled Input Materials'));
        if (reclaim.e_waste) content.push(renderKeyValue('   E-waste processes', reclaim.e_waste));
        if (reclaim.hazardous_waste) content.push(renderKeyValue('   Hazardous waste processes', reclaim.hazardous_waste));
        if (reclaim.other_waste) content.push(renderKeyValue('   Other waste processes', reclaim.other_waste));
    }    // EI 4: Extended Producer Responsibility (EPR)
    const epr = p2Data.p2_essential_epr_status;
    if (epr) {
        content.push(addSubHeading('4. Extended Producer Responsibility (EPR)'));
        content.push(renderKeyValue('   Collection plan in line with EPR', epr.is_collection_plan_in_line_with_epr ? 'Yes' : 'No'));
        if (epr.details) content.push(renderKeyValue('   Details', epr.details));
    }    // Leadership Indicators
    const hasLeadershipData = p2Data.p2_leadership_lca_details || 
                             p2Data.p2_leadership_product_risks || 
                             p2Data.p2_leadership_recycled_input_value_percentage ||
                             p2Data.p2_leadership_reclaimed_waste_quantities ||
                             p2Data.p2_leadership_reclaimed_products_as_percentage_sold;

    if (hasLeadershipData) {
        content.push(addSubHeading("Leadership Indicators"));
        
        // LI 1: Life Cycle Assessments (LCA)
        const lca = p2Data.p2_leadership_lca_details;
        if (lca && lca.conducted !== null) {
            content.push(addSubHeading('1. Life Cycle Assessments (LCA)'));
            content.push(renderKeyValue('LCA conducted', lca.conducted ? 'Yes' : 'No'));
            
            if (lca.conducted && lca.assessments && lca.assessments.length > 0) {
                content.push(drawSimpleTable({
                    headers: ['Product/Service', 'NIC Code', '% of Total Turnover', 'LCA Boundary', 'External Agency', 'Results Public', 'Weblink'],
                    rows: lca.assessments.map(assessment => [
                        assessment.product_service_name || 'N/A',
                        assessment.nic_code || 'N/A',
                        assessment.turnover_percentage ? `${assessment.turnover_percentage}%` : 'N/A',
                        assessment.lca_boundary || 'N/A',
                        assessment.conducted_by_external_agency ? 'Yes' : 'No',
                        assessment.results_communicated_publicly ? 'Yes' : 'No',
                        assessment.lca_summary_weblink || 'N/A'
                    ])
                }));
            }
        }

        // LI 2: Product risks and concerns
        const risks = p2Data.p2_leadership_product_risks;
        if (risks && risks.length > 0) {
            content.push(addSubHeading('2. Significant Environmental/Social Concerns'));
            content.push(drawSimpleTable({
                headers: ['Product/Service', 'Risk Description', 'Action Taken'],
                rows: risks.map(risk => [
                    risk.product_service_name || 'N/A',
                    risk.risk_description || 'N/A',
                    risk.action_taken || 'N/A'
                ])
            }));
        }

        // LI 3: Recycled input materials by value
        const recycledInputs = p2Data.p2_leadership_recycled_input_value_percentage;
        if (recycledInputs && recycledInputs.length > 0) {
            content.push(addSubHeading('3. Recycled/Reused Input Materials (% by Value)'));
            content.push(drawSimpleTable({
                headers: ['Input Material Category', 'Current FY (%)'],
                rows: recycledInputs.map(input => [
                    input.input_material_category || 'N/A',
                    input.percentage_by_value_current_fy ? `${input.percentage_by_value_current_fy}%` : 'N/A'
                ])
            }));
        }

        // LI 4: Reclaimed waste quantities
        const reclaimedWaste = p2Data.p2_leadership_reclaimed_waste_quantities;
        if (reclaimedWaste) {
            const hasWasteData = Object.values(reclaimedWaste).some(category => 
                category.current_fy_reused_mt || category.current_fy_recycled_mt || category.current_fy_safely_disposed_mt
            );
            
            if (hasWasteData) {
                content.push(addSubHeading('4. Products/Packaging Reclaimed at End of Life (MT)'));
                const wasteRows = [];
                
                Object.entries(reclaimedWaste).forEach(([wasteType, data]) => {
                    if (data.current_fy_reused_mt || data.current_fy_recycled_mt || data.current_fy_safely_disposed_mt) {
                        wasteRows.push([
                            wasteType.replace('_', ' ').toUpperCase(),
                            data.current_fy_reused_mt || '0',
                            data.current_fy_recycled_mt || '0',
                            data.current_fy_safely_disposed_mt || '0'
                        ]);
                    }
                });
                
                if (wasteRows.length > 0) {
                    content.push(drawSimpleTable({
                        headers: ['Waste Category', 'Reused (MT)', 'Recycled (MT)', 'Safely Disposed (MT)'],
                        rows: wasteRows
                    }));
                }
            }
        }

        // LI 5: Reclaimed products as percentage of products sold
        const reclaimedProducts = p2Data.p2_leadership_reclaimed_products_as_percentage_sold;
        if (reclaimedProducts && reclaimedProducts.length > 0) {
            content.push(addSubHeading('5. Reclaimed Products (% of Products Sold)'));
            content.push(drawSimpleTable({
                headers: ['Product Category', 'Reclaimed as % of Sold'],
                rows: reclaimedProducts.map(product => [
                    product.product_category || 'N/A',
                    product.reclaimed_as_percentage_of_sold ? `${product.reclaimed_as_percentage_of_sold}%` : 'N/A'
                ])
            }));
        }
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
                [{text: 'EMPLOYEES (Executives)', style: 'b', colSpan: 4}, '', '', ''],
                ['Permanent', details.employees_total || 0, details.employees_male || 0, details.employees_female || 0],
                ['Other than Permanent', details.employees_other_than_permanent_total || 0, details.employees_other_than_permanent_male || 0, details.employees_other_than_permanent_female || 0],
                [{text: 'Total employees', style: 'b'}, details.total_employees || 0, details.total_employees_male || 0, details.total_employees_female || 0],
                [{text: 'WORKERS', style: 'b', colSpan: 4}, '', '', ''],
                ['Permanent', details.workers_total || 0, details.workers_male || 0, details.workers_female || 0],
                ['Other than Permanent', details.workers_other_than_permanent_total || 0, details.workers_other_than_permanent_male || 0, details.workers_other_than_permanent_female || 0],
                [{text: 'Total workers', style: 'b'}, details.total_workers || 0, details.total_workers_male || 0, details.total_workers_female || 0]
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

// Enhanced renderPrinciple5PdfMake function
function renderPrinciple5PdfMake(p5Data, calculatedData) {
    if (!p5Data || !p5Data.essential_indicators) {
        return [{ text: "Principle 5 data not available.", style: 'p_italic' }];
    }
    const content = [];
    content.push(addPrincipleTitle("5", "Businesses should respect and promote human rights."));
    const ei = p5Data.essential_indicators;
    content.push(addSubHeading("Essential Indicators"));
    // EI 1: Human rights training
    content.push(addSubHeading('1. Human rights training provided'));
    if (ei.hr_training?.employees || ei.hr_training?.workers) {
        const trainingHeaders = ['Category', 'Total trained (No.)', '% of total employees/workers'];
        const trainingRows = [];
        if (ei.hr_training?.employees && typeof ei.hr_training.employees === 'object') {
            Object.keys(ei.hr_training.employees).forEach(category => {
                const data = ei.hr_training.employees?.[category] || {};
                if (data.count_current_fy !== undefined || data.percentage_current_fy !== undefined) {
                    trainingRows.push([
                        `Employees - ${category.replace(/_/g, ' ')}`,
                        data.count_current_fy ?? 0,
                        data.percentage_current_fy !== undefined ? `${data.percentage_current_fy}%` : 'N/A'
                    ]);
                }
            });
        }
        if (ei.hr_training?.workers && typeof ei.hr_training.workers === 'object') {
            Object.keys(ei.hr_training.workers).forEach(category => {
                const data = ei.hr_training.workers?.[category] || {};
                if (data.count_current_fy !== undefined || data.percentage_current_fy !== undefined) {
                    trainingRows.push([
                        `Workers - ${category.replace(/_/g, ' ')}`,
                        data.count_current_fy ?? 0,
                        data.percentage_current_fy !== undefined ? `${data.percentage_current_fy}%` : 'N/A'
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
    if (ei.minimum_wages?.employees || ei.minimum_wages?.workers) {
        const wageHeaders = ['Category', 'Equal to Minimum Wage', 'More than Minimum Wage'];
        const wageRows = [];
        ['employees', 'workers'].forEach(type => {
            if (ei.minimum_wages?.[type] && typeof ei.minimum_wages[type] === 'object') {
                Object.keys(ei.minimum_wages[type]).forEach(category => {
                    const data = ei.minimum_wages[type]?.[category] || {};
                    wageRows.push([
                        `${type.charAt(0).toUpperCase() + type.slice(1)} - ${category.replace(/_/g, ' ')}`,
                        data.equal_to_minimum_wage_count ?? 0,
                        data.more_than_minimum_wage_count ?? 0
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
    if (typeof ei.remuneration === 'object' && ei.remuneration !== null) {
        const remunerationHeaders = ['Category', 'Male', 'Female', 'Median (M:F Ratio)'];
        const remunerationRows = [];
        ['bod', 'kmp', 'employees_other_than_bod_kmp', 'workers'].forEach(category => {
            const data = ei.remuneration?.[category] || {};
            if (Object.keys(data).length > 0) {
                remunerationRows.push([
                    category.replace(/_/g, ' ').toUpperCase(),
                    data.male_median ?? 'N/A',
                    data.female_median ?? 'N/A',
                    data.median_ratio ?? 'N/A'
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
    if (typeof ei.complaints_current_fy === 'object' && ei.complaints_current_fy !== null) {
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
            const data = ei.complaints_current_fy?.[type] || {};
            if (Object.keys(data).length > 0) {
                complaintRows.push([
                    complaintTypes[type],
                    data.filed_current_fy ?? 0,
                    data.pending_current_fy ?? 0,
                    data.resolved_current_fy ?? 0,
                    data.remarks_current_fy ?? 'N/A'
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
    if (typeof ei.assessments_plants_offices === 'object' && ei.assessments_plants_offices !== null) {
        const assessmentHeaders = ['Assessment Type', 'Percentage'];
        const assessmentRows = [
            ['Child Labour', ei.assessments_plants_offices?.child_labour_percent !== undefined ? `${ei.assessments_plants_offices.child_labour_percent}%` : 'N/A'],
            ['Forced/Involuntary Labour', ei.assessments_plants_offices?.forced_labour_percent !== undefined ? `${ei.assessments_plants_offices.forced_labour_percent}%` : 'N/A'],
            ['Sexual Harassment', ei.assessments_plants_offices?.sexual_harassment_percent !== undefined ? `${ei.assessments_plants_offices.sexual_harassment_percent}%` : 'N/A'],
            ['Discrimination at workplace', ei.assessments_plants_offices?.discrimination_workplace_percent !== undefined ? `${ei.assessments_plants_offices.discrimination_workplace_percent}%` : 'N/A'],
            ['Wages', ei.assessments_plants_offices?.wages_percent !== undefined ? `${ei.assessments_plants_offices.wages_percent}%` : 'N/A']
        ];
        if (ei.assessments_plants_offices?.others_text) {
            assessmentRows.push([
                ei.assessments_plants_offices.others_text,
                ei.assessments_plants_offices?.others_percent !== undefined ? `${ei.assessments_plants_offices.others_percent}%` : 'N/A'
            ]);
        }
        content.push(drawSimpleTable({ headers: assessmentHeaders, rows: assessmentRows }));
    } else {
        content.push(addRegularText('No assessment data available.'));
    }
    // EI 10: Corrective actions from Q9
    content.push(renderKeyValue('10. Corrective actions from assessments', ei.corrective_actions_risks_q9 ?? 'N/A'));
    // Leadership Indicators
    if (typeof p5Data.leadership_indicators === 'object' && p5Data.leadership_indicators !== null) {
        const li = p5Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        content.push(renderKeyValue('1. Process modification due to HR grievances', li.process_modification_grievances ?? 'N/A'));
        content.push(renderKeyValue('2. HR due-diligence scope', li.hr_due_diligence_scope ?? 'N/A'));
        content.push(renderKeyValue('3. Premise accessible to differently abled', li.accessibility_for_disabled === true ? 'Yes' : (li.accessibility_for_disabled === false ? 'No' : 'N/A')));
        content.push(addSubHeading('4. Assessment of value chain partners (% by business value)'));
        if (typeof li.assessment_value_chain_partners === 'object' && li.assessment_value_chain_partners !== null) {
            const valueChainHeaders = ['Assessment Type', 'Percentage'];
            const valueChainRows = [
                ['Sexual Harassment', li.assessment_value_chain_partners?.sexual_harassment_percent !== undefined ? `${li.assessment_value_chain_partners.sexual_harassment_percent}%` : 'N/A'],
                ['Discrimination at workplace', li.assessment_value_chain_partners?.discrimination_workplace_percent !== undefined ? `${li.assessment_value_chain_partners.discrimination_workplace_percent}%` : 'N/A'],
                ['Child Labour', li.assessment_value_chain_partners?.child_labour_percent !== undefined ? `${li.assessment_value_chain_partners.child_labour_percent}%` : 'N/A'],
                ['Forced Labour', li.assessment_value_chain_partners?.forced_labour_percent !== undefined ? `${li.assessment_value_chain_partners.forced_labour_percent}%` : 'N/A'],
                ['Wages', li.assessment_value_chain_partners?.wages_percent !== undefined ? `${li.assessment_value_chain_partners.wages_percent}%` : 'N/A']
            ];
            if (li.assessment_value_chain_partners?.others_text) {
                valueChainRows.push([
                    li.assessment_value_chain_partners.others_text,
                    li.assessment_value_chain_partners?.others_percent !== undefined ? `${li.assessment_value_chain_partners.others_percent}%` : 'N/A'
                ]);
            }
            content.push(drawSimpleTable({ headers: valueChainHeaders, rows: valueChainRows }));
        }
        content.push(renderKeyValue('5. Corrective actions from value chain assessments', li.corrective_actions_risks_q4_li ?? 'N/A'));
    }
    return content;
}

function renderPrinciple6PdfMake(p6Data, calcData) {
    const content = [];
    content.push(addPrincipleTitle("6", "Businesses should respect and make efforts to protect and restore the environment."));
    if (!p6Data || !p6Data.essential_indicators) {
        content.push({ text: "Principle 6 data not available.", style: 'p_italic' });
        return content;
    }
    const ei = p6Data.essential_indicators;
    content.push(addSubHeading("Essential Indicators"));
    // EI 1: Energy consumption and intensity (energy_consumption_intensity)
    content.push(addSubHeading('1. Details of Total Energy Consumption and Energy Intensity (in Giga Joules)'));
    if (ei.energy_consumption_intensity?.current_fy) {
        const energyHeaders = ['Parameter', 'Current FY (GJ)'];
        const energyRows = [
            ['Total electricity consumption (A)', ei.energy_consumption_intensity.current_fy.electricity_consumption_a || 0],
            ['Total fuel consumption (B)', ei.energy_consumption_intensity.current_fy.fuel_consumption_b || 0],
            ['Energy consumption through other sources (C)', ei.energy_consumption_intensity.current_fy.other_sources_consumption_c || 0],
            ['Energy intensity per rupee of turnover', ei.energy_consumption_intensity.current_fy.energy_intensity_turnover || 'N/A'],
            ['Energy intensity (optional metric)', ei.energy_consumption_intensity.current_fy.energy_intensity_optional_metric || 'N/A']
        ];
        content.push(drawSimpleTable({ headers: energyHeaders, rows: energyRows }));
    } else {
        content.push(addRegularText('No energy consumption data available.'));
    }    // --- Biodiversity/ecologically sensitive areas (fixed logic) ---
    content.push(addSubHeading('2. Operations in or near Ecologically Sensitive Areas/Biodiversity Hotspots'));
    
    // Check if we have structured operation data
    if (ei.ecologically_sensitive_operations?.list?.length) {
        content.push(drawSimpleTable({
            headers: ["Location", "Type of Operations", "Compliance Status", "Reason/Corrective Action"],
            rows: ei.ecologically_sensitive_operations.list.map(op => [
                op.location || 'N/A',
                op.type_of_operations || 'N/A',
                op.compliance_status || 'N/A',
                op.non_compliance_reason_corrective || 'N/A'
            ])
        }));
    } 
    // Check if we have general text description 
    else if (ei.operations_in_or_near_biodiversity_hotspots) {
        content.push(addRegularText(ei.operations_in_or_near_biodiversity_hotspots));
    } 
    // No data available
    else {
        content.push(addRegularText('No operations reported in or near ecologically sensitive areas.'));
    }
    
    // Assessment information (separate from operations data)
    if (ei.ecologically_sensitive_operations?.assessment_info?.conducted) {
        content.push(addRegularText(`Assessment conducted by: ${ei.ecologically_sensitive_operations.assessment_info.agency_name || 'N/A'}`));
    }
    content.push(addSubHeading('3. Biodiversity Impact Assessment'));
    if (ei.biodiversity_impact_assessment) {
        const bia = ei.biodiversity_impact_assessment;
        content.push(renderKeyValue('Biodiversity Impact Assessed & Reported', bia.assessed_reported ? 'Yes' : 'No'));
        if (bia.assessed_reported) {
            content.push(addRegularText(`Details: ${bia.details || 'N/A'}`));
        }
    }
    // EI 2: Water consumption and discharge (renumbered to 4)
    content.push(addSubHeading('4. Details of Water Consumption and Discharge'));
    if (ei.water_consumption_discharge?.current_fy) {
        const waterHeaders = ['Parameter', 'Current FY'];
        const waterRows = [
            ['Total water withdrawal (A)', ei.water_consumption_discharge.current_fy.total_water_withdrawal || 0],
            ['Water recycled and reused (B)', ei.water_consumption_discharge.current_fy.water_recycled_reused || 0],
            ['Net water consumption (A-B)', ei.water_consumption_discharge.current_fy.net_water_consumption || 0],
            ['Percentage of water recycled and reused', `${ei.water_consumption_discharge.current_fy.percentage_recycled_reused || 0}%`]
        ];
        content.push(drawSimpleTable({ headers: waterHeaders, rows: waterRows }));
    } else {
        content.push(addRegularText('No water consumption or discharge data available.'));
    }
    // EI 3: Waste management (renumbered to 5)
    content.push(addSubHeading('5. Details of Waste Management'));
    if (ei.waste_management?.current_fy) {
        const wasteHeaders = ['Parameter', 'Current FY'];
        const wasteRows = [
            ['Total waste generated (A)', ei.waste_management.current_fy.total_waste_generated || 0],
            ['Waste recycled (B)', ei.waste_management.current_fy.waste_recycled || 0],
            ['Waste disposed (C)', ei.waste_management.current_fy.waste_disposed || 0],
            ['Recycling rate', `${ei.waste_management.current_fy.recycling_rate || 0}%`]
        ];
        content.push(drawSimpleTable({ headers: wasteHeaders, rows: wasteRows }));
    } else {
        content.push(addRegularText('No waste management data available.'));
    }
    // EI 4: Greenhouse gas (GHG) emissions (renumbered to 6)
    content.push(addSubHeading('6. Details of Greenhouse Gas (GHG) Emissions'));
    if (ei.ghg_emissions?.current_fy) {
        const ghgHeaders = ['Parameter', 'Current FY'];
        const ghgRows = [
            ['Total GHG emissions (Scope 1 and 2) (A)', ei.ghg_emissions.current_fy.total_ghg_emissions || 0],
            ['GHG emissions reduction initiatives (B)', ei.ghg_emissions.current_fy.ghg_reduction_initiatives || 0],
            ['Net GHG emissions (A-B)', ei.ghg_emissions.current_fy.net_ghg_emissions || 0],
            ['Percentage reduction in GHG emissions', `${ei.ghg_emissions.current_fy.percentage_reduction || 0}%`]
        ];
        content.push(drawSimpleTable({ headers: ghgHeaders, rows: ghgRows }));
    } else {
        content.push(addRegularText('No GHG emissions data available.'));
    }
    // EI 5: Air emissions (renumbered to 7)
    content.push(addSubHeading('7. Details of Air Emissions'));
    if (ei.air_emissions?.current_fy) {
        const airHeaders = ['Parameter', 'Current FY'];
        const airRows = [
            ['Total air emissions (A)', ei.air_emissions.current_fy.total_air_emissions || 0],
            ['Air emissions reduction initiatives (B)', ei.air_emissions.current_fy.air_reduction_initiatives || 0],
            ['Net air emissions (A-B)', ei.air_emissions.current_fy.net_air_emissions || 0],
            ['Percentage reduction in air emissions', `${ei.air_emissions.current_fy.percentage_reduction || 0}%`]
        ];
        content.push(drawSimpleTable({ headers: airHeaders, rows: airRows }));
    } else {
        content.push(addRegularText('No air emissions data available.'));
    }
    // EI 6: Compliance with environmental regulations (renumbered to 8)
    content.push(addSubHeading('8. Compliance with Environmental Regulations'));
    if (ei.compliance_environmental?.current_fy) {
        const complianceHeaders = ['Parameter', 'Current FY'];
        const complianceRows = [
            ['Total number of notices/penalties', ei.compliance_environmental.current_fy.total_notices_penalties || 0],
            ['Pending notices/penalties', ei.compliance_environmental.current_fy.pending_notices_penalties || 0],
            ['Details of non-compliance', ei.compliance_environmental.current_fy.details_non_compliance || 'N/A']
        ];
        content.push(drawSimpleTable({ headers: complianceHeaders, rows: complianceRows }));
    } else {
        content.push(addRegularText('No compliance data available.'));
    }
    // EI 7: Environmental certifications (renumbered to 9)
    content.push(addSubHeading('9. Environmental Certifications'));
    if (ei.environmental_certifications?.current_fy) {
        const certHeaders = ['Certification', 'Agency', 'Validity', 'Remarks'];
        const certRows = ei.environmental_certifications.current_fy.map(cert => [
            cert.certification || 'N/A',
            cert.agency || 'N/A',
            cert.validity || 'N/A',
            cert.remarks || 'N/A'
        ]);
        content.push(drawSimpleTable({ headers: certHeaders, rows: certRows }));
    } else {
        content.push(addRegularText('No environmental certifications data available.'));
    }

    return content;
}

// Principle 4
function renderPrinciple4PdfMake(p4Data, calculatedData) {
    if (!p4Data || !p4Data.essential_indicators) {
        return [{ text: "Principle 4 data not available.", style: 'p_italic' }];
    }
    const content = [];
    content.push(addPrincipleTitle("4", "Businesses should respect the interests of and be responsive to all its stakeholders."));
    const ei = p4Data.essential_indicators;
    content.push(addSubHeading("Essential Indicators"));
    content.push(addSubHeading('1. Stakeholder identification and engagement'));
    const stakeholders = ei.stakeholder_identification_engagement || [];
    if (stakeholders.length > 0) {
        content.push(drawSimpleTable({
            headers: ['Stakeholder Group', 'Whether Identified as Vulnerable', 'Channels of Communication', 'Frequency of Engagement'],
            rows: stakeholders.map(sh => [
                sh?.stakeholder_group || 'N/A',
                sh?.identified_as_vulnerable ? 'Yes' : 'No',
                sh?.channels_of_communication || 'N/A',
                sh?.frequency_of_engagement || 'N/A'
            ])
        }));
    } else {
        content.push(addRegularText('No stakeholder identification data available.'));
    }
    content.push(renderKeyValue('2. Feedback mechanism for vulnerable stakeholders', ei.vulnerable_stakeholder_feedback?.has_mechanism ? 'Yes' : 'No'));
    if (ei.vulnerable_stakeholder_feedback?.details) {
        content.push(addRegularText(`Details: ${ei.vulnerable_stakeholder_feedback.details}`));
    }
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
// Principle 7
function renderPrinciple7PdfMake(p7Data, calculatedData) {
    if (!p7Data || !p7Data.essential_indicators) {
        return [{ text: "Principle 7 data not available.", style: 'p_italic' }];
    }
    const content = [];
    content.push(addPrincipleTitle("7", "Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent."));
    const ei = p7Data.essential_indicators;
    content.push(addSubHeading("Essential Indicators"));
    content.push(addSubHeading('1. Affiliations with trade and industry chambers/associations'));
    const memberships = ei.trade_and_industry_chambers_associations || [];
    if (memberships.length > 0) {
        const membershipHeaders = ['S.No.', 'Name of the trade and industry chambers/associations', 'Reach (State/National)'];
        const membershipRows = memberships.map((membership, index) => [index + 1, membership.name || 'N/A', membership.reach || 'N/A']);
        content.push(drawSimpleTable({ headers: membershipHeaders, rows: membershipRows }));
    } else {
        content.push(addRegularText('No memberships in trade and industry chambers/associations reported.'));
    }
    content.push(addSubHeading('2. Corrective action on issues related to anti-competitive conduct'));
    const actions = ei.anti_competitive_conduct_corrective_actions || [];
    if (actions.length > 0) {
        const actionHeaders = ['Name of Authority', 'Brief of the Case', 'Corrective Action Taken'];
        const actionRows = actions.map(action => [action.name_of_authority || 'N/A', action.brief_of_case || 'N/A', action.corrective_action_taken || 'N/A']);
        content.push(drawSimpleTable({ headers: actionHeaders, rows: actionRows }));
    } else {
        content.push(addRegularText('No corrective actions on anti-competitive conduct reported.'));
    }
    if (p7Data.leadership_indicators) {
        const li = p7Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        content.push(addSubHeading('1. Public policy positions advocated'));
        const policies = li.public_policy_positions_advocated || [];
        if (policies.length > 0) {
            const policyHeaders = ['S.No.', 'Policy Advocated', 'Method of Advocacy', 'Board Review Frequency', 'Web Link'];
            const policyRows = policies.map((policy, index) => [index + 1, policy.policy_advocated || 'N/A', policy.method_of_advocacy || 'N/A', policy.board_review_frequency || 'N/A', policy.web_link || 'N/A']);
            content.push(drawSimpleTable({ headers: policyHeaders, rows: policyRows }));
        } else {
            content.push(addRegularText('No public policy positions advocated reported.'));
        }
    }
    return content;
}
// Principle 8
function renderPrinciple8PdfMake(p8Data, calculatedData) {
    if (!p8Data || !p8Data.essential_indicators) {
        return [{ text: "Principle 8 data not available.", style: 'p_italic' }];
    }
    const content = [];
    content.push(addPrincipleTitle("8", "Businesses should promote inclusive growth and equitable development."));
    const ei = p8Data.essential_indicators;
    content.push(addSubHeading("Essential Indicators"));
    content.push(addSubHeading('1. Details of Social Impact Assessments (SIA) of projects'));
    const sias = ei.social_impact_assessments || [];
    if (sias.length > 0) {
        const siaHeaders = ['S.No.', 'Project Details', 'SIA Notification No.', 'Date', 'Conducted by', 'Results in Public Domain', 'Web Link'];
        const siaRows = sias.map((sia, index) => [index + 1, sia.project_details || 'N/A', sia.sia_notification_no || 'N/A', sia.date_of_notification || 'N/A', sia.conducted_by || 'N/A', sia.results_communicated_in_public_domain ? 'Yes' : 'No', sia.relevant_web_link || 'N/A']);
        content.push(drawSimpleTable({ headers: siaHeaders, rows: siaRows }));
    } else {
        content.push(addRegularText('No Social Impact Assessments conducted.'));
    }
    content.push(addSubHeading('2. Rehabilitation and Resettlement (R&R) projects'));
    const rrProjects = ei.rehab_resettlement_projects || [];
    if (rrProjects.length > 0) {
        const rrHeaders = ['S.No.', 'Name of Project', 'State', 'District', 'No. of PAFs', 'Amounts Paid (INR)'];
        const rrRows = rrProjects.map((project, index) => [index + 1, project.name_of_project_ongoing_rr || 'N/A', project.state || 'N/A', project.district || 'N/A', project.no_of_paf || 'N/A', project.amounts_paid_to_pafs_fy_inr || 'N/A']);
        content.push(drawSimpleTable({ headers: rrHeaders, rows: rrRows }));
    } else {
        content.push(addRegularText('No Rehabilitation and Resettlement projects.'));
    }
    content.push(renderKeyValue('3. Community grievance mechanisms', ei.community_grievance_mechanisms));
    content.push(addSubHeading('4. Input material sourcing (Current FY)'));
    if (ei.input_material_sourcing?.current_fy) {
        const sourcingData = ei.input_material_sourcing.current_fy;
        content.push(renderKeyValue('Directly from MSMEs/small producers (%)', sourcingData.directly_from_msme_small_producers_percent ? `${sourcingData.directly_from_msme_small_producers_percent}%` : 'N/A'));
        content.push(renderKeyValue('Directly from district and neighbouring districts (%)', sourcingData.directly_from_district_neighbouring_percent ? `${sourcingData.directly_from_district_neighbouring_percent}%` : 'N/A'));
    } else {
        content.push(addRegularText('No input material sourcing data available.'));
    }
    if (p8Data.leadership_indicators) {
        const li = p8Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        content.push(addSubHeading('1. Social impact mitigation actions'));
        const mitigations = li.social_impact_mitigation_actions || [];
        if (mitigations.length > 0) {
            const mitigationHeaders = ['Details of Negative Social Impact Identified', 'Corrective Action Taken'];
            const mitigationRows = mitigations.map(action => [action.negative_social_impact_identified || 'N/A', action.corrective_action_taken || 'N/A']);
            content.push(drawSimpleTable({ headers: mitigationHeaders, rows: mitigationRows }));
        } else {
            content.push(addRegularText('No social impact mitigation actions reported.'));
        }
        content.push(addSubHeading('2. CSR projects in aspirational districts'));
        const csrProjects = li.csr_aspirational_districts_projects || [];
        if (csrProjects.length > 0) {
            const csrHeaders = ['S.No.', 'State', 'Aspirational District', 'Amount Spent (INR)'];
            const csrRows = csrProjects.map((project, index) => [project.s_no || (index + 1), project.state || 'N/A', project.aspirational_district || 'N/A', project.amount_spent_inr || 'N/A']);
            content.push(drawSimpleTable({ headers: csrHeaders, rows: csrRows }));
        } else {
            content.push(addRegularText('No CSR projects in aspirational districts.'));
        }
        content.push(addSubHeading('3. Preferential procurement'));
        if (li.preferential_procurement) {
            content.push(renderKeyValue('Has preferential procurement policy', li.preferential_procurement.has_policy ? 'Yes' : 'No'));
            if (li.preferential_procurement.has_policy) {
                content.push(addRegularText(`Marginalized/vulnerable groups procured from: ${(li.preferential_procurement.marginalized_vulnerable_groups_procured_from || []).join(', ')}`));
                content.push(renderKeyValue('Percentage of total procurement by value', li.preferential_procurement.percentage_total_procurement_by_value ? `${li.preferential_procurement.percentage_total_procurement_by_value}%` : 'N/A'));
            }
        }
        content.push(addSubHeading('4. IP and traditional knowledge benefits'));
        const ipBenefits = li.ip_traditional_knowledge_benefits || [];
        if (ipBenefits.length > 0) {
            const ipHeaders = ['S.No.', 'IP based on traditional knowledge', 'Owned/Acquired', 'Benefit Shared', 'Basis of Calculating Benefit Share'];
            const ipRows = ipBenefits.map((ip, index) => [ip.s_no || (index + 1), ip.ip_based_on_traditional_knowledge || 'N/A', ip.owned_acquired || 'N/A', ip.benefit_shared_yes_no ? 'Yes' : 'No', ip.basis_of_calculating_benefit_share || 'N/A']);
            content.push(drawSimpleTable({ headers: ipHeaders, rows: ipRows }));
        } else {
            content.push(addRegularText('No IP and traditional knowledge benefits reported.'));
        }
        content.push(addSubHeading('5. IP disputes and traditional knowledge actions'));
        const ipDisputes = li.ip_disputes_traditional_knowledge_actions || [];
        if (ipDisputes.length > 0) {
            const disputeHeaders = ['Name of Authority', 'Brief of Case', 'Corrective Action Taken'];
            const disputeRows = ipDisputes.map(dispute => [dispute.name_of_authority || 'N/A', dispute.brief_of_case || 'N/A', dispute.corrective_action_taken || 'N/A']);
            content.push(drawSimpleTable({ headers: disputeHeaders, rows: disputeRows }));
        } else {
            content.push(addRegularText('No IP disputes or traditional knowledge actions reported.'));
        }
        content.push(addSubHeading('6. CSR project beneficiaries details'));
        const beneficiaries = li.csr_project_beneficiaries_details || [];
        if (beneficiaries.length > 0) {
            const beneficiaryHeaders = ['S.No.', 'CSR Project', 'No. of persons benefitted', '% of beneficiaries from vulnerable groups'];
            const beneficiaryRows = beneficiaries.map((beneficiary, index) => [beneficiary.s_no || (index + 1), beneficiary.csr_project || 'N/A', beneficiary.persons_benefitted_from_csr || 'N/A', beneficiary.percent_beneficiaries_vulnerable_marginalized ? `${beneficiary.percent_beneficiaries_vulnerable_marginalized}%` : 'N/A']);
            content.push(drawSimpleTable({ headers: beneficiaryHeaders, rows: beneficiaryRows }));
        } else {
            content.push(addRegularText('No CSR project beneficiaries details reported.'));
        }
    }
    return content;
}
// Principle 9
function renderPrinciple9PdfMake(p9Data, calculatedData) {
    if (!p9Data || !p9Data.essential_indicators) {
        return [{ text: "Principle 9 data not available.", style: 'p_italic' }];
    }
    const content = [];
    content.push(addPrincipleTitle("9", "Businesses should engage with and provide value to their consumers in a responsible manner."));
    const ei = p9Data.essential_indicators;
    content.push(addSubHeading("Essential Indicators"));
    content.push(addSubHeading('1. Consumer complaints'));
    if (ei.consumer_complaints) {
        const complaintHeaders = ['Category', 'Received during current FY', 'Pending resolution', 'Remarks'];
        const complaintRows = [
            ['Data privacy', ei.consumer_complaints.data_privacy?.received_current_fy || 0, ei.consumer_complaints.data_privacy?.pending_resolution_current_fy || 0, ei.consumer_complaints.data_privacy?.remarks_current_fy || 'N/A'],
            ['Advertising', ei.consumer_complaints.advertising?.received_current_fy || 0, ei.consumer_complaints.advertising?.pending_resolution_current_fy || 0, ei.consumer_complaints.advertising?.remarks_current_fy || 'N/A'],
            ['Cyber-security', ei.consumer_complaints.cyber_security?.received_current_fy || 0, ei.consumer_complaints.cyber_security?.pending_resolution_current_fy || 0, ei.consumer_complaints.cyber_security?.remarks_current_fy || 'N/A'],
            ['Delivery of essential services', ei.consumer_complaints.delivery_of_essential_services?.received_current_fy || 0, ei.consumer_complaints.delivery_of_essential_services?.pending_resolution_current_fy || 0, ei.consumer_complaints.delivery_of_essential_services?.remarks_current_fy || 'N/A'],
            ['Restrictive trade practices', ei.consumer_complaints.restrictive_trade_practices?.received_current_fy || 0, ei.consumer_complaints.restrictive_trade_practices?.pending_resolution_current_fy || 0, ei.consumer_complaints.restrictive_trade_practices?.remarks_current_fy || 'N/A'],
            ['Unfair trade practices', ei.consumer_complaints.unfair_trade_practices?.received_current_fy || 0, ei.consumer_complaints.unfair_trade_practices?.pending_resolution_current_fy || 0, ei.consumer_complaints.unfair_trade_practices?.remarks_current_fy || 'N/A'],
            ['Other consumer issues', ei.consumer_complaints.other_consumer_issues?.received_current_fy || 0, ei.consumer_complaints.other_consumer_issues?.pending_resolution_current_fy || 0, ei.consumer_complaints.other_consumer_issues?.remarks_current_fy || 'N/A']
        ];
        content.push(drawSimpleTable({ headers: complaintHeaders, rows: complaintRows }));
    } else {
        content.push(addRegularText('No consumer complaints data available.'));
    }
    content.push(addSubHeading('2. Product recalls'));
    const recalls = ei.product_recalls || {};
    const recallCategories = Object.keys(recalls);
    if (recallCategories.length > 0) {
        const recallHeaders = ['Product Category', 'Number of instances (Current FY)', 'Reasons for recall'];
        const recallRows = recallCategories.map(category => {
            const recallData = recalls[category] || {};
            return [category.replace(/_/g, ' '), recallData.instances_current_fy || 0, recallData.reasons_for_recall || 'N/A'];
        });
        content.push(drawSimpleTable({ headers: recallHeaders, rows: recallRows }));
    } else {
        content.push(addRegularText('No product recalls reported.'));
    }
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
            const data = ei.product_service_information[item.key] || {};
            let covered = 'N/A';
            if (data.covered === true) covered = 'Yes';
            else if (data.covered === false) covered = 'No';
            else if (data.covered === 'not_applicable') covered = 'Not Applicable';
            return [item.label, covered, data.details || 'N/A'];
        });
        content.push(drawSimpleTable({ headers: infoHeaders, rows: infoRows }));
    } else {
        content.push(addRegularText('No product/service information data available.'));
    }
    content.push(renderKeyValue('4. Consumer survey satisfaction score', ei.consumer_survey_satisfaction_score?.score ? `${ei.consumer_survey_satisfaction_score.score}%` : 'N/A'));
    if (ei.consumer_survey_satisfaction_score?.methodology) {
        content.push(addRegularText(`Methodology: ${ei.consumer_survey_satisfaction_score.methodology}`));
    }
    content.push(addSubHeading('5. Data security and privacy policy'));
    if (ei.data_security_privacy_policy) {
        content.push(renderKeyValue('Has policy', ei.data_security_privacy_policy.has_policy ? 'Yes' : 'No'));
        if (ei.data_security_privacy_policy.has_policy) {
            content.push(renderKeyValue('Policy weblink', ei.data_security_privacy_policy.policy_weblink || 'N/A'));
            content.push(renderKeyValue('Cybersecurity investment (% of revenue)', ei.data_security_privacy_policy.cybersecurity_investment_percent_revenue ? `${ei.data_security_privacy_policy.cybersecurity_investment_percent_revenue}%` : 'N/A'));
        }
    } else {
        content.push(addRegularText('No data security and privacy policy information available.'));
    }
    content.push(renderKeyValue('6. Corrective actions for issues related to consumer complaints', ei.corrective_actions_details));
    if (ei.ethical_supply_chain_governance) {
        content.push(addSubHeading('7. Ethical supply chain governance'));
        content.push(renderKeyValue('Has integrated framework', ei.ethical_supply_chain_governance.has_framework ? 'Yes' : 'No'));
        if (ei.ethical_supply_chain_governance.has_framework && ei.ethical_supply_chain_governance.code_of_conduct_followed) {
            content.push(renderKeyValue('Code of conduct followed', ei.ethical_supply_chain_governance.code_of_conduct_followed));
        }
    }
    if (p9Data.leadership_indicators) {
        const li = p9Data.leadership_indicators;
        content.push(addSubHeading("Leadership Indicators"));
        content.push(renderKeyValue('1. Product/service information channels and platforms', li.product_service_info_channels_platforms));
        content.push(renderKeyValue('2. Steps to inform and educate consumers on safe usage', li.steps_inform_educate_safe_responsible_usage));
        content.push(renderKeyValue('3. Mechanisms to inform about risks and service disruption', li.mechanisms_inform_risk_disruption_essential_services));
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
        content.push(addSubHeading('5. Consumer survey and action plan'));
        if (li.consumer_survey_action_plan) {
            content.push(renderKeyValue('Survey undertaken', li.consumer_survey_action_plan.survey_undertaken ? 'Yes' : 'No'));
            if (li.consumer_survey_action_plan.survey_undertaken) {
                content.push(renderKeyValue('Percentage of consumers surveyed', li.consumer_survey_action_plan.percentage_consumers_surveyed ? `${li.consumer_survey_action_plan.percentage_consumers_surveyed}%` : 'N/A'));
                content.push(renderKeyValue('Action plan status', li.consumer_survey_action_plan.action_plan_status || 'N/A'));
            }
        }
    }
    return content;
}

// --- REVISED AND CORRECTED: RENDER SCORING SUMMARY DASHBOARD WITH CHARTS ---
async function renderScoringSummary(scoringData) {
    if (!scoringData) return [];

    const { pillarScores, totalScore, maxScore, percentage, previousYearScore } = scoringData;

    // --- Helper function to create a styled card ---
    const createCard = (contentStack) => {
        return {
            table: {
                widths: ['*'],
                body: [
                    [{
                        stack: contentStack,
                        margin: [10, 10, 10, 10] // Inner padding for the card
                    }]
                ]
            },
            // This layout object applies the styles to the card
            layout: {
                fillColor: '#F5F5FF5',
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#DDDDDD',
                vLineColor: () => '#DDDDDD',
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0
            }        };
    };

    const content = [];
    content.push(addSectionTitle('ESG Scoring Summary', { pageBreak: 'before' }));

    // --- Generate Charts ---
    try {
        console.log('Generating ESG charts...');
        
        // Generate pillar comparison chart
        const pillarChartBuffer = await generateESGPillarChart(scoringData);
        if (pillarChartBuffer && pillarChartBuffer.length > 0) {
            const pillarChartBase64 = pillarChartBuffer.toString('base64');
            
            // Add pillar chart
            content.push({
                image: `data:image/png;base64,${pillarChartBase64}`,
                width: 500,
                alignment: 'center',
                margin: [0, 10, 0, 20]
            });
        }

        // --- Always show YoY chart (or current year bar if no previous year) ---
        let yoyChartBuffer;
        yoyChartBuffer = await generateYoYComparisonChart(scoringData); // This will fallback to current year bar if no previousYearScore
        if (yoyChartBuffer && yoyChartBuffer.length > 0) {
            const yoyChartBase64 = yoyChartBuffer.toString('base64');
            content.push({
                image: `data:image/png;base64,${yoyChartBase64}`,
                width: 500,
                alignment: 'center',
                margin: [0, 10, 0, 20]
            });
        }

        // --- Always show principle-wise pie chart ---
        const principleChartBuffer = await generatePrincipleChart(scoringData);
        if (principleChartBuffer && principleChartBuffer.length > 0) {
            const principleChartBase64 = principleChartBuffer.toString('base64');
            content.push({
                image: `data:image/png;base64,${principleChartBase64}`,
                width: 500,
                alignment: 'center',
                margin: [0, 10, 0, 20]
            });
        }

    } catch (error) {
        console.error('Error generating charts:', error);
        content.push({
            text: 'Charts could not be generated at this time. Canvas dependencies not available in this environment.',
            style: 'p_italic',
            alignment: 'center',
            margin: [0, 10, 0, 20]
        });
    }

    // --- Define content for each card ---
    const totalScoreStack = [
        { text: 'Total ESG Score', style: 'pillarTitle' },
        { text: `${totalScore} / ${maxScore}`, style: 'pillarScore' },
        { text: `${percentage}%`, style: 'pillarPercent' }
    ];

    // --- Assemble Top Dashboard using the createCard helper ---
    content.push({
        columns: [
            createCard(totalScoreStack)
            // Removed the YoY numeric card/column as per user request
        ],
        columnGap: 20,
        margin: [0, 10, 0, 20]
    });

    // --- Pillar Scores using the createCard helper ---
    content.push(addSubHeading('Pillar-wise Performance'));
    content.push({
        columns: [
            createCard([
                { text: 'Environment', style: 'pillarTitle' },
                { text: `${pillarScores.environment || 0} / 2600`, style: 'pillarScore' },
                { text: `${pillarScores.environmentPercentage || '0.00'}%`, style: 'pillarPercent' }
            ]),
            createCard([
                { text: 'Social', style: 'pillarTitle' },
                { text: `${pillarScores.social || 0} / 2800`, style: 'pillarScore' },
                { text: `${pillarScores.socialPercentage || '0.00'}%`, style: 'pillarPercent' }
            ]),
            createCard([
                { text: 'Governance', style: 'pillarTitle' },
                { text: `${pillarScores.governance || 0} / 1500`, style: 'pillarScore' },
                { text: `${pillarScores.governancePercentage || '0.00'}%`, style: 'pillarPercent' }
            ])
        ],
        columnGap: 10,
        margin: [0, 10, 0, 30]
    });

    // --- Detailed Principle Scores Table (no change needed here) ---
    content.push(addSubHeading('Detailed Principle Scores'));
    const principleRows = Object.entries(scoringData.principleScores).map(([pKey, pData]) => {
        return [`Principle ${pKey.substring(1)}`, pData.total || 0];
    });
    content.push(drawSimpleTable({
        headers: ['Principle', 'Score'],
        rows: principleRows
    }));

    return content;
}

// --- MAIN PDF GENERATION FUNCTION ---

async function generateBRSRPdf({ outputPath, reportData, companyData, calculatedData, scoringData }) {
    const content = [];

    // --- STEP 1: RENDER ALL STANDARD REPORT SECTIONS ---
    content.push(...renderSectionA(reportData, companyData, calculatedData));
    const sectionBData = reportData.sb_policy_management || {};
    content.push(...renderSectionB(sectionBData, calculatedData));
    // Render all principles (Section C)
    try {
        const p1Data = reportData.sc_p1_ethical_conduct || {};
        content.push(...renderPrinciple1PdfMake(p1Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 1:", error); content.push({ text: "Error rendering Principle 1 data", style: 'errorText' }); }
    try {
        const p2Data = reportData.sc_p2_sustainable_safe_goods || {};
        content.push(...renderPrinciple2PdfMake(p2Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 2:", error); content.push({ text: "Error rendering Principle 2 data", style: 'errorText' }); }
    try {
        const p3Data = reportData.sc_p3_employee_wellbeing || {};
        content.push(...renderPrinciple3PdfMake(p3Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 3:", error); content.push({ text: "Error rendering Principle 3 data", style: 'errorText' }); }
    try {
        const p4Data = reportData.sc_p4_stakeholder_responsiveness || {};
        content.push(...renderPrinciple4PdfMake(p4Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 4:", error); content.push({ text: "Error rendering Principle 4 data", style: 'errorText' }); }
    try {
        const p5Data = reportData.sc_p5_human_rights || {};
        content.push(...renderPrinciple5PdfMake(p5Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 5:", error); content.push({ text: "Error rendering Principle 5 data", style: 'errorText' }); }
    try {
        const p6Data = reportData.sc_p6_environment_protection || {};
        content.push(...renderPrinciple6PdfMake(p6Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 6:", error); content.push({ text: "Error rendering Principle 6 data", style: 'errorText' }); }
    try {
        const p7Data = reportData.sc_p7_policy_advocacy || {};
        content.push(...renderPrinciple7PdfMake(p7Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 7:", error); content.push({ text: "Error rendering Principle 7 data", style: 'errorText' }); }
    try {
        const p8Data = reportData.sc_p8_inclusive_growth || {};
        content.push(...renderPrinciple8PdfMake(p8Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 8:", error); content.push({ text: "Error rendering Principle 8 data", style: 'errorText' }); }
    try {
        const p9Data = reportData.sc_p9_consumer_value || {};
        content.push(...renderPrinciple9PdfMake(p9Data, calculatedData));
    } catch (error) { console.error("Error rendering Principle 9:", error); content.push({ text: "Error rendering Principle 9 data", style: 'errorText' }); }

    // --- STEP 2: RENDER THE SCORING SUMMARY WITH CHARTS AT THE VERY END ---
    const scoringSummaryContent = await renderScoringSummary(scoringData);
    content.push(...scoringSummaryContent);

    // --- STEP 3: CREATE THE DOCUMENT DEFINITION ---
    const docDefinition = {
        content,
        pageMargins: getPageMargins(),
        header: function(currentPage, pageCount) {
            return {
                text: `BRSR Report | Page ${currentPage} of ${pageCount}`,
                alignment: 'right',
                margin: [0, 30, 40, 0],
                fontSize: 9,
                color: '#888'
            };
        },
        footer: function(currentPage, pageCount) {
            return {
                text: `Generated on: ${new Date().toLocaleDateString()}`,
                alignment: 'left',
                margin: [40, 20, 40, 0],
                fontSize: 9,
                color: '#888'
            };
        },
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
            link: { color: 'blue', decoration: 'underline' },
            pillarTitle: { fontSize: 14, bold: true, alignment: 'center', color: '#333333' },
            pillarScore: { fontSize: 24, bold: true, alignment: 'center', color: '#0055A4', margin: [0, 5, 0, 0] },
            pillarPercent: { fontSize: 12, alignment: 'center', color: '#777' },
            dashboardBox: { fillColor: '#F5F5F5', margin: [0, 5, 0, 5], padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 4 },
            positiveChange: { fontSize: 14, bold: true, color: 'green', alignment: 'center' },
            negativeChange: { fontSize: 14, bold: true, color: 'red', alignment: 'center' }
        },
        defaultStyle: {
            font: 'Roboto',
            fontSize: 11
        }
    };
    if (outputPath) {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const writeStream = fs.createWriteStream(outputPath);
        pdfDoc.pipe(writeStream);
        pdfDoc.end();
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(outputPath));
            writeStream.on('error', reject);
        });
    } else {
        // Return buffer for API response
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

module.exports = { generateBRSRPdf };