// Debug script to check PDF data structure
const { generateBRSRPdf } = require('./pdfGenerator_fixed');

// Simulate the data structure that would come from the backend
const mockReportData = {
    section_a_data: {
        sa_business_activities_turnover: [
            { description_main: 'Test Main Activity', description_business: 'Test Business', turnover_percentage: 50 }
        ],
        // Add some basic section A data
    },
    section_b_data: {
        sb_director_statement: 'Test director statement for debugging',
        sb_esg_responsible_individual: {
            name: 'John Doe',
            designation: 'CEO',
            email: 'john.doe@company.com'
        },
        sb_principle_policies: [
            {
                principle: 1,
                has_policy: true,
                policy_text_or_url: 'Test policy URL',
                performance_against_targets: 'Test performance description'
            }
        ]
    },
    // Test Section C data with actual structure
    sc_p1_ethical_conduct: {
        essential_indicators: {
            anti_corruption_policy: {
                has_policy: true,
                details: 'Test anti-corruption policy details',
                weblink: 'https://example.com/policy'
            }
        }
    },
    sc_p2_sustainable_safe_goods: {
        essential_indicators: {
            r_and_d_sustainable_products: {
                details: 'Test R&D details'
            }
        }
    },
    sc_p3_employee_wellbeing: {
        essential_indicators: {
            employee_well_being_measures: {
                employees_current_fy: 'Test employee wellbeing measures'
            }
        }
    },
    sc_p4_stakeholder_responsiveness: {
        essential_indicators: {
            stakeholder_engagement_mapping: {
                has_mapping: true
            }
        }
    },
    sc_p5_human_rights: {
        essential_indicators: {
            human_rights_training: {
                employees: {
                    permanent: { total_a: 100, covered_b: 90 }
                }
            }
        }
    },
    sc_p6_environment_protection: {
        essential_indicators: {
            energy_consumption_intensity: {
                current_fy: {
                    electricity_consumption_a: 1000
                }
            },
            biodiversity_impact: {
                details_of_operations: "No significant operations near ecologically sensitive areas.",
                impact_mitigation_measures: "Standard environmental protocols are in place.",
                has_operations_near_sensitive_areas: false // <-- Added for compatibility
            },
            // Optionally, keep the old key for backward compatibility
            operations_in_or_near_sensitive_areas: {
                has_operations_near_sensitive_areas: false // <-- Added for compatibility
            }
        }
    },
    sc_p7_policy_advocacy: {
        essential_indicators: {
            trade_industry_chambers_associations: [
                { name: 'Test Association', details: 'Test membership details' }
            ]
        }
    },
    sc_p8_inclusive_growth: {
        essential_indicators: {
            social_impact_assessments: [
                { project_name: 'Test Project', sia_notification_no: '123' }
            ]
        }
    },
    sc_p9_consumer_value: {
        essential_indicators: {
            consumer_complaints: {
                received_current_fy: 5,
                pending_end_fy: 1
            }
        }
    }
};

const mockCompanyData = {
    company_name: 'Test Company Ltd',
    cin: 'L12345AB1234PLC567890',
    year_of_incorporation: '2000',
    registered_office_address: 'Test Address',
    email: 'test@company.com'
};

const mockCalculatedData = {
    sectionA: {},
    sectionB: {},
    sectionC: {}
};

console.log('Testing PDF generation with mock data...');
console.log('Report data keys:', Object.keys(mockReportData));
console.log('Section B data:', JSON.stringify(mockReportData.section_b_data, null, 2));
console.log('Section C P1 data:', JSON.stringify(mockReportData.sc_p1_ethical_conduct, null, 2));

// Test the PDF generation
try {
    // Corrected call for pdfGenerator_fixed.js
    generateBRSRPdf(
        { 
            outputPath: './debug_output_fixed.pdf', // Added outputPath
            reportData: mockReportData, 
            companyData: mockCompanyData, 
            calculatedData: mockCalculatedData 
        }
        // Removed callback as the fixed version is async
    ).then(result => {
        console.log('PDF (fixed) generated successfully at:', result);
    }).catch(error => {
        console.error('PDF generation error (fixed):', error);
    });

} catch (error) {
    console.error('Error during PDF generation:', error);
}
