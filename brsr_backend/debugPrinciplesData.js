// debugPrinciplesData.js
// This script helps debug issues with Principle 2 and Principle 5 data in the PDF generator

const fs = require('fs');
const path = require('path');
const { generateBRSRPdf } = require('./pdfGenerator_fixed');
const calculateDerivedValues = require('./calculateDerivedValues');

// Create sample test data with specific focus on Principles 2 and 5
const sampleData = {
    // Section A data (minimal for testing)
    financial_year: "2023-24",
    sa_markets_served: { customer_types: "Various industry segments" },
    
    // Principle 2 data - this should be properly structured
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
    
    // Principle 5 data - this should be properly structured
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

// Sample company data
const companyData = {
    company_name: "Debug Company Ltd.",
    cin: "L12345MH2020PLC123456",
    email: "contact@debugcompany.com",
    website: "www.debugcompany.com",
    telephone: "+91 1234567890",
    brsr_contact_name: "Debug Contact",
    brsr_contact_mail: "brsr@debugcompany.com",
    year_of_incorporation: "2010",
    registered_office_address: "Debug Office, Debug Street, Debug City - 123456",
    corporate_address: "Debug Corporate, Debug Avenue, Debug City - 123456",
    stock_exchange_listed: ["NSE", "BSE"],
    paid_up_capital: "100 Crores"
};

// Add debug logging functions to trace data flow
function debugLog(message, data) {
    console.log(`DEBUG: ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// Monkey patch the renderPrinciple2PdfMake and renderPrinciple5 functions to log data
const originalModule = require('./pdfGenerator_fixed');
const originalRenderPrinciple2 = originalModule.renderPrinciple2PdfMake;
const originalRenderPrinciple5 = originalModule.renderPrinciple5;

// This will be executed if the module exports the render functions
if (originalRenderPrinciple2) {
    debugLog("Found renderPrinciple2PdfMake function, adding logging");
    originalModule.renderPrinciple2PdfMake = function(p2Data, calculatedData) {
        debugLog("renderPrinciple2PdfMake called with data:", p2Data);
        return originalRenderPrinciple2(p2Data, calculatedData);
    };
}

if (originalRenderPrinciple5) {
    debugLog("Found renderPrinciple5 function, adding logging");
    originalModule.renderPrinciple5 = function(p5Data, calculatedData) {
        debugLog("renderPrinciple5 called with data:", p5Data);
        return originalRenderPrinciple5(p5Data, calculatedData);
    };
}

// If the module doesn't export those functions, we'll modify the code
// to add debug logging inside the main function
function addLoggingToMainFunction() {
    debugLog("Adding debug logging to main PDF generation function");
    
    // Override the generateBRSRPdf function to add logging
    const originalGenerateBRSRPdf = originalModule.generateBRSRPdf;
    originalModule.generateBRSRPdf = async function(options) {
        const { reportData, companyData, calculatedData } = options;
        
        debugLog("Principle 2 data being passed to PDF generator:", reportData.sc_p2_sustainable_safe_goods);
        debugLog("Principle 5 data being passed to PDF generator:", reportData.sc_p5_human_rights);
        
        // Continue with original function
        return await originalGenerateBRSRPdf(options);
    };
}

// Add logging to main function anyway
addLoggingToMainFunction();

// Calculate derived values for the test data
const calculatedData = calculateDerivedValues(sampleData);

// Output path for the generated PDF
const outputPath = path.join(__dirname, 'pdfs', 'debug_principles.pdf');

// Ensure the pdfs directory exists
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir);
}

// Add some custom checks for the data structure
debugLog("Checking data structure for Principle 2");
const p2Data = sampleData.sc_p2_sustainable_safe_goods;
if (!p2Data) {
    debugLog("ERROR: sc_p2_sustainable_safe_goods is missing");
} else if (!p2Data.essential_indicators) {
    debugLog("ERROR: sc_p2_sustainable_safe_goods.essential_indicators is missing");
} else {
    debugLog("sc_p2_sustainable_safe_goods structure looks good");
}

debugLog("Checking data structure for Principle 5");
const p5Data = sampleData.sc_p5_human_rights;
if (!p5Data) {
    debugLog("ERROR: sc_p5_human_rights is missing");
} else if (!p5Data.essential_indicators) {
    debugLog("ERROR: sc_p5_human_rights.essential_indicators is missing");
} else {
    debugLog("sc_p5_human_rights structure looks good");
}

// Generate the PDF
debugLog("Generating PDF with test data");
generateBRSRPdf({
    outputPath,
    reportData: sampleData,
    companyData,
    calculatedData
})
.then(result => {
    debugLog(`PDF successfully generated at: ${result}`);
})
.catch(error => {
    debugLog(`Error generating PDF: ${error.message}`);
    console.error(error);
});
