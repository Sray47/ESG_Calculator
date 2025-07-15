// chartGenerator.js - ESG Chart Generation for BRSR Reports
let ChartJSNodeCanvas;
let canvasAvailable = false;

try {
  ChartJSNodeCanvas = require('chartjs-node-canvas').ChartJSNodeCanvas;
  canvasAvailable = true;
  console.log("✓ chartjs-node-canvas loaded successfully");
} catch (error) {
  console.warn("chartjs-node-canvas not found. Trying alternative canvas implementation...");
  
  // Try @napi-rs/canvas as alternative
  try {
    const { createCanvas } = require('@napi-rs/canvas');
    console.log("Using @napi-rs/canvas as canvas backend");
    canvasAvailable = true;
    
    // Create a minimal ChartJSNodeCanvas-like wrapper for @napi-rs/canvas
    ChartJSNodeCanvas = class {
      constructor(options) {
        this.width = options.width || 800;
        this.height = options.height || 400;
        this.backgroundColour = options.backgroundColour || 'white';
      }
      
      async renderToBuffer(chartConfig) {
        // Return a simple placeholder buffer for chart
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');
        
        // Draw a simple placeholder
        ctx.fillStyle = this.backgroundColour;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chart generation temporarily disabled', this.width/2, this.height/2);
        
        return canvas.toBuffer('image/png');
      }
    };
  } catch (napiError) {
    console.warn("@napi-rs/canvas also not available. Chart generation will be disabled.");
    canvasAvailable = false;
    
    // Create a completely fallback implementation
    ChartJSNodeCanvas = class {
      constructor(options) {
        this.width = options.width || 800;
        this.height = options.height || 400;
      }
      
      async renderToBuffer(chartConfig) {
        // Return a minimal 1x1 PNG buffer as placeholder
        return Buffer.from([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
          0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
          0x54, 0x08, 0x57, 0x63, 0xF8, 0x0F, 0x00, 0x00,
          0x01, 0x00, 0x01, 0x02, 0x6A, 0x03, 0x10, 0x00,
          0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
          0x42, 0x60, 0x82
        ]);
      }
    };
  }
}

let Chart;
try {
  Chart = require('chart.js/auto');
} catch (chartError) {
  console.warn("chart.js not available, chart functionality will be limited");
  Chart = null;
}

// Chart configuration - only initialize if ChartJSNodeCanvas is available
const chartJSNodeCanvas = (ChartJSNodeCanvas && canvasAvailable) ? new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: 'white',
    chartCallback: (ChartJS) => {
        // Register any additional plugins if needed
    }
}) : null;

async function generateChart(config, type) {
  if (!chartJSNodeCanvas || !canvasAvailable) {
    console.warn(`Chart generation for ${type} skipped: canvas is not available.`);
    return Buffer.from(''); // Return empty buffer instead of trying to generate placeholder
  }
  
  try {
    return await chartJSNodeCanvas.renderToBuffer(config);
  } catch (error) {
    console.error(`Error generating ${type} chart:`, error);
    return Buffer.from(''); // Return empty buffer on error
  }
}


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

    return await generateChart(config, 'ESG Pillar');
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

    return await generateChart(config, 'Year-over-Year Comparison');
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

    return await generateChart(config, 'Principle-wise Performance');
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

    return await generateChart(config, 'Current Year Overview');
}

/**
 * Generate small sparkline charts for dashboard cards
 */
async function generateSparklineChart(data, color = '#3B82F6') {
    if (!canvasAvailable || !ChartJSNodeCanvas) {
        console.warn(`Sparkline chart generation skipped: canvas is not available.`);
        return Buffer.from(''); // Empty buffer
    }
    
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
    try {
        return await sparklineCanvas.renderToBuffer(config);
    } catch (error) {
        console.error('Error generating sparkline chart:', error);
        return Buffer.from(''); // Empty buffer on error
    }
}

module.exports = {
    generateESGPillarChart,
    generateYoYComparisonChart,
    generatePrincipleChart,
    generateCurrentYearChart,
    generateSparklineChart
};
