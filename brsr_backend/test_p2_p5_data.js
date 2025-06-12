// test_p2_p5_data.js
// This script directly tests the Principle 2 and Principle 5 rendering functions with simple data

const fs = require('fs');
const path = require('path');
const { generateBRSRPdf } = require('./pdfGenerator_fixed');

// Simple test data with just Principle 2 and 5
const testData = {
    // Minimal Section A data
    financial_year: "2023-24",
    
    // Principle 2 data with very basic structure
    sc_principle2_data: {
        essential_indicators: {
            r_and_d_expenditure_sustainability: {
                current_fy_percentage: 10,
                previous_fy_percentage: 8,
                details: "Invested in renewable energy"
            },
            sustainable_sourcing_procedures: {
                has_procedures: true,
                details: "We follow sustainable sourcing"
            },
            recycled_input_materials_percentage: 25
        }
    },
    
    // Principle 5 data with very basic structure
    sc_principle5_data: {
        essential_indicators: {
            hr_training: {
                employees: {
                    permanent: {
                        count_current_fy: 100,
                        percentage_current_fy: 90
                    }
                }
            },
            focal_point_for_human_rights: true,
            grievance_redressal_mechanisms: "We have a grievance committee"
        }
    }
};

// Company data
const companyData = {
    company_name: "Test Company",
    cin: "L12345XYZ67890"
};

// Minimal calculated data
const calculatedData = {};

// Output path for the generated PDF
const outputPath = path.join(__dirname, 'pdfs', 'p2_p5_test.pdf');

// Create pdfs directory if it doesn't exist
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir);
}

// Add console logging for data validation
console.log("Test data structure:");
console.log("P2 data available:", !!testData.sc_principle2_data);
console.log("P2 essential indicators:", !!testData.sc_principle2_data?.essential_indicators);
console.log("P5 data available:", !!testData.sc_principle5_data);
console.log("P5 essential indicators:", !!testData.sc_principle5_data?.essential_indicators);

// Generate the PDF
console.log("Generating PDF...");
generateBRSRPdf({
    outputPath,
    reportData: testData,
    companyData,
    calculatedData
})
.then(result => {
    console.log(`PDF successfully generated at: ${result}`);
})
.catch(error => {
    console.error("Error generating PDF:", error);
});
