// test_pdf_with_charts.js - Test complete PDF generation with charts
const { generateBRSRPdf } = require('./pdfGenerator_fixed');
const path = require('path');

// Mock data for testing
const mockScoringData = {
    totalScore: 4200,
    maxScore: 6900,
    percentage: 60.87,
    previousYearScore: 3800,
    pillarScores: {
        environment: 1300,
        social: 1800,
        governance: 1100,
        environmentPercentage: '50.00',
        socialPercentage: '64.29',
        governancePercentage: '73.33'
    },
    principleScores: {
        p1: { total: 450 },
        p2: { total: 520 },
        p3: { total: 680 },
        p4: { total: 320 },
        p5: { total: 800 },
        p6: { total: 780 },
        p7: { total: 420 },
        p8: { total: 570 },
        p9: { total: 660 }
    }
};

const mockReportData = {
    financial_year: '2023-24',
    sb_policy_management: {
        sb_director_statement: 'Test director statement',
        sb_esg_responsible_individual: {
            name: 'John Doe',
            designation: 'Chief Sustainability Officer'
        }
    },
    sc_p1_ethical_conduct: {
        essential_indicators: {
            anti_corruption_policy: {
                has_policy: true,
                details: 'Comprehensive anti-corruption policy'
            }
        }
    }
};

const mockCompanyData = {
    company_name: 'Test ESG Company Ltd.',
    cin: 'L12345MH2020PLC123456',
    email: 'test@esgcompany.com'
};

const mockCalculatedData = {
    sectionA: {
        employees: { grand_total: 1000 }
    }
};

async function testPDFWithCharts() {
    console.log('Testing PDF generation with charts...');
    
    try {
        const outputPath = path.join(__dirname, 'pdfs', 'test_chart_report.pdf');
        
        console.log('Generating PDF with charts...');
        await generateBRSRPdf({
            outputPath,
            reportData: mockReportData,
            companyData: mockCompanyData,
            calculatedData: mockCalculatedData,
            scoringData: mockScoringData
        });
        
        console.log(`✅ PDF generated successfully: ${outputPath}`);
        console.log('🎉 Chart integration test completed!');
        
    } catch (error) {
        console.error('❌ Error generating PDF with charts:', error);
        throw error;
    }
}

// Run test
if (require.main === module) {
    testPDFWithCharts().catch(console.error);
}

module.exports = { testPDFWithCharts };
