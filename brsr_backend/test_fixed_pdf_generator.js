const fs = require('fs');
const path = require('path');
const { generateBRSRPdf } = require('./pdfGenerator_fixed');

// Load sample data from a JSON file if available, or use mock data
let reportData;
let companyData;

try {
  // Try to load real data if available
  const sampleDataPath = path.join(__dirname, 'sample_report_data.json');
  if (fs.existsSync(sampleDataPath)) {
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
    reportData = sampleData.reportData;
    companyData = sampleData.companyData;
    console.log('Loaded real sample data');
  } else {
    throw new Error('Sample data file not found, using mock data');
  }
} catch (error) {
  console.log('Using mock data:', error.message);
  
  // Mock data with the expected structure
  reportData = {
    // Section A data directly in reportData
    company_name: 'Test Company',
    corporate_identity_number: 'L12345AB6789CDE012345',
    
    // Section B data
    section_b_data: {
      policy_management: {
        has_policy_for_principle_1: true,
        policy_1_approved_by_board: true
        // Other policy fields...
      }
    },
    
    // Section C data with proper keys
    sc_p1_ethical_conduct: {
      essential_indicators: {
        training_provided_on_business_conduct_ethics: true,
        // Other P1 fields...
      }
    },
    sc_p2_sustainable_safe_goods: {
      essential_indicators: {
        r_and_d_sustainable_products: true,
        // Other P2 fields...
      }
    },
    sc_p3_employee_wellbeing: {
      essential_indicators: {
        accessibility_of_workplaces: true,
        // Other P3 fields...
      }
    },
    sc_p4_stakeholder_responsiveness: {
      essential_indicators: {
        stakeholder_identification_engagement_process: true,
        // Other P4 fields...
      }
    },
    sc_p5_human_rights: {
      essential_indicators: {
        policy_on_human_rights: true,
        // Other P5 fields...
      }
    },
    sc_p6_environment_protection: {
      essential_indicators: {
        energy_consumption: {
          current_fy: {
            total_electricity_consumption: 1000
          }
        },
        // Other P6 fields...
      }
    },
    sc_p7_policy_advocacy: {
      essential_indicators: {
        trade_and_industry_chambers_associations: [
          { name: 'Test Association', reach: 'National' }
        ],
        // Other P7 fields...
      }
    },
    sc_p8_inclusive_growth: {
      essential_indicators: {
        social_impact_assessments: [],
        // Other P8 fields...
      }
    },
    sc_p9_consumer_value: {
      essential_indicators: {
        consumer_complaints: {
          data_privacy: { received_current_fy: 5, pending_resolution_current_fy: 1 }
        },
        // Other P9 fields...
      }
    }
  };
  
  companyData = {
    name: 'Test Company',
    cin: 'L12345AB6789CDE012345',
    address: '123 Test Street, Test City',
    website: 'https://testcompany.com',
    email: 'contact@testcompany.com',
    phone: '+91 1234567890'
  };
}

// Mock calculated data
const calculatedData = {
  p1: {},
  p2: {},
  p3: {},
  p4: {},
  p5: {},
  p6: {},
  p7: {},
  p8: {},
  p9: {}
};

// Output path for the generated PDF
const outputPath = path.join(__dirname, 'pdfs', 'test_fixed_brsr_report.pdf');

// Ensure the pdfs directory exists
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir);
}

console.log('Generating PDF...');
generateBRSRPdf(outputPath, reportData, companyData, calculatedData)
  .then(pdfPath => {
    console.log(`PDF successfully generated at: ${pdfPath}`);
  })
  .catch(error => {
    console.error('Error generating PDF:', error);
  });
