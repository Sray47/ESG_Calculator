// test_chart_integration.js - Test Chart.js integration
const { generateESGPillarChart, generateYoYComparisonChart, generatePrincipleChart } = require('./chartGenerator');

// Mock scoring data
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

async function testChartGeneration() {
    console.log('Testing Chart.js integration...');
    
    try {
        // Test pillar chart
        console.log('Generating pillar chart...');
        const pillarChart = await generateESGPillarChart(mockScoringData);
        console.log(`✅ Pillar chart generated: ${pillarChart.length} bytes`);
        
        // Test YoY chart
        console.log('Generating YoY comparison chart...');
        const yoyChart = await generateYoYComparisonChart(mockScoringData);
        console.log(`✅ YoY chart generated: ${yoyChart.length} bytes`);
        
        // Test principle chart
        console.log('Generating principle chart...');
        const principleChart = await generatePrincipleChart(mockScoringData);
        console.log(`✅ Principle chart generated: ${principleChart.length} bytes`);
        
        console.log('\n🎉 All charts generated successfully!');
        console.log('Charts are ready for PDF integration.');
        
    } catch (error) {
        console.error('❌ Error generating charts:', error);
        throw error;
    }
}

// Run test
if (require.main === module) {
    testChartGeneration().catch(console.error);
}

module.exports = { testChartGeneration };
