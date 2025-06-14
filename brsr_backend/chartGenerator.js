// chartGenerator.js - ESG Chart Generation for BRSR Reports
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const Chart = require('chart.js/auto');

// Chart configuration
const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: 'white',
    chartCallback: (ChartJS) => {
        // Register any additional plugins if needed
    }
});

/**
 * Generate ESG Score Overview Chart (Pillar comparison)
 */
async function generateESGPillarChart(scoringData) {
    const { pillarScores } = scoringData;
    
    const config = {
        type: 'bar',
        data: {
            labels: ['Environment', 'Social', 'Governance'],
            datasets: [{
                label: 'Current Score',
                data: [
                    pillarScores.environment || 0,
                    pillarScores.social || 0,
                    pillarScores.governance || 0
                ],
                backgroundColor: ['#22C55E', '#3B82F6', '#F59E0B'],
                borderColor: ['#16A34A', '#2563EB', '#D97706'],
                borderWidth: 2
            }, {
                label: 'Maximum Possible',
                data: [2600, 2800, 1500], // Max scores for each pillar
                backgroundColor: ['#E5E7EB', '#E5E7EB', '#E5E7EB'],
                borderColor: ['#9CA3AF', '#9CA3AF', '#9CA3AF'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'ESG Pillar Performance',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Score'
                    }
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(config);
}

/**
 * Generate Year-over-Year Comparison Chart
 */
async function generateYoYComparisonChart(scoringData) {
    const { totalScore, previousYearScore, pillarScores, previousYearPillarScores } = scoringData;
    
    if (!previousYearScore) {
        // Generate single year chart if no previous data
        return await generateCurrentYearChart(scoringData);
    }

    // Use actual previous year pillar scores if available, else estimate
    let prevEnv = previousYearPillarScores && previousYearPillarScores.environment != null ? previousYearPillarScores.environment : Math.floor(previousYearScore * 0.4);
    let prevSoc = previousYearPillarScores && previousYearPillarScores.social != null ? previousYearPillarScores.social : Math.floor(previousYearScore * 0.4);
    let prevGov = previousYearPillarScores && previousYearPillarScores.governance != null ? previousYearPillarScores.governance : Math.floor(previousYearScore * 0.2);

    const config = {
        type: 'line',
        data: {
            labels: ['Environment', 'Social', 'Governance', 'Total'],
            datasets: [{
                label: 'Previous Year',
                data: [
                    prevEnv,
                    prevSoc,
                    prevGov,
                    previousYearScore
                ],
                borderColor: '#6B7280',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                borderWidth: 2,
                tension: 0.4
            }, {
                label: 'Current Year',
                data: [
                    pillarScores.environment || 0,
                    pillarScores.social || 0,
                    pillarScores.governance || 0,
                    totalScore
                ],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Year-over-Year ESG Performance',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Score'
                    }
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(config);
}

/**
 * Generate Principle-wise Performance Chart
 */
async function generatePrincipleChart(scoringData) {
    const { principleScores } = scoringData;
    
    const principleLabels = Object.keys(principleScores).map(key => `P${key.substring(1)}`);
    const principleData = Object.values(principleScores).map(p => p.total || 0);
    
    const config = {
        type: 'doughnut',
        data: {
            labels: principleLabels,
            datasets: [{
                data: principleData,
                backgroundColor: [
                    '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#10B981',
                    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'
                ],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Principle-wise Score Distribution',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'right'
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(config);
}

/**
 * Generate Current Year Overview (when no previous year data)
 */
async function generateCurrentYearChart(scoringData) {
    const { totalScore, maxScore, percentage, pillarScores } = scoringData;
    
    const config = {
        type: 'bar',
        data: {
            labels: ['ESG Score'],
            datasets: [{
                label: 'Achieved',
                data: [totalScore],
                backgroundColor: '#22C55E',
                borderColor: '#16A34A',
                borderWidth: 2
            }, {
                label: 'Remaining',
                data: [maxScore - totalScore],
                backgroundColor: '#E5E7EB',
                borderColor: '#9CA3AF',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Current ESG Performance: ${percentage}%`,
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Score'
                    }
                },
                y: {
                    stacked: true
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(config);
}

/**
 * Generate small sparkline charts for dashboard cards
 */
async function generateSparklineChart(data, color = '#3B82F6') {
    const config = {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                data: data,
                borderColor: color,
                backgroundColor: `${color}20`,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                point: { radius: 0 }
            }
        }
    };

    // Create smaller sparkline
    const sparklineCanvas = new ChartJSNodeCanvas({
        width: 200,
        height: 60,
        backgroundColour: 'transparent'
    });

    return await sparklineCanvas.renderToBuffer(config);
}

module.exports = {
    generateESGPillarChart,
    generateYoYComparisonChart,
    generatePrincipleChart,
    generateCurrentYearChart,
    generateSparklineChart
};
