// This is a test script to check if principle 2 and principle 5 are working correctly

const { generateBRSRPdf } = require('./pdfGenerator_fixed');
const fs = require('fs');
const path = require('path');

// Create sample data with required structure
const sampleData = {
    // Sample data for Principle 2
    sc_principle2_data: {
        essential_indicators: {
            r_and_d_expenditure_sustainability: {
                current_fy_percentage: 5,
                previous_fy_percentage: 4,
                details: "Invested in renewable energy research"
            },
            capital_expenditure_sustainability: {
                current_fy_percentage: 10,
                previous_fy_percentage: 8,
                details: "Solar panel installation"
            },
            sustainable_sourcing_procedures: {
                has_procedures: true,
                details: "We have implemented sustainable sourcing guidelines"
            },
            recycled_input_materials_percentage: 15,
            sustainable_sourcing_sme_percentage: 20
        },
        leadership_indicators: {
            lca_details: [
                {
                    product_service: "Product A",
                    percentage_of_turnover: 30,
                    results_communicated_publicly: true
                }
            ],
            sustainable_sourcing_suppliers_percentage: 40
        }
    },
    
    // Sample data for Principle 5
    sc_principle5_data: {
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
                    filed: 2,
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

// Company data
const companyData = {
    company_name: "Test Company",
    cin: "L12345MH2020PLC123456",
    email: "contact@testcompany.com"
};

// Calculated data
const calculatedData = {};

async function testPdfGeneration() {
    try {
        const outputPath = path.join(__dirname, 'test_principles.pdf');
        await generateBRSRPdf({
            outputPath,
            reportData: sampleData,
            companyData,
            calculatedData
        });
        console.log(`PDF generated successfully at ${outputPath}`);
    } catch (error) {
        console.error("Error generating PDF:", error);
    }
}

testPdfGeneration();
