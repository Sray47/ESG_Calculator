// logDataStructure.js
// This script logs the full structure of the data in the JSON
// to help diagnose issues with Principle 2 and Principle 5

const fs = require('fs');
const path = require('path');

// Create a simple test to explicitly check Principle 2 and 5 data structure
const testData = {
    sc_principle2_data: {
        essential_indicators: {
            r_and_d_expenditure_sustainability: {
                current_fy_percentage: 10
            }
        }
    },
    sc_principle5_data: {
        essential_indicators: {
            hr_training: {
                employees: {
                    permanent: {
                        count_current_fy: 100
                    }
                }
            }
        }
    }
};

// Function to check data availability
function checkDataPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return false;
        }
    }
    
    return true;
}

// Test data paths
console.log("TESTING DATA STRUCTURE ACCESSIBILITY:");
console.log("sc_principle2_data exists:", checkDataPath(testData, "sc_principle2_data"));
console.log("sc_principle2_data.essential_indicators exists:", checkDataPath(testData, "sc_principle2_data.essential_indicators"));
console.log("sc_principle5_data exists:", checkDataPath(testData, "sc_principle5_data"));
console.log("sc_principle5_data.essential_indicators exists:", checkDataPath(testData, "sc_principle5_data.essential_indicators"));

// Load the pdfGenerator_fixed.js to examine the functions
const pdfGeneratorPath = path.join(__dirname, 'pdfGenerator_fixed.js');
const pdfGeneratorContent = fs.readFileSync(pdfGeneratorPath, 'utf8');

// Check for renderPrinciple2PdfMake and renderPrinciple5 functions
const p2FunctionMatch = pdfGeneratorContent.match(/function\s+renderPrinciple2PdfMake\s*\([^)]*\)\s*\{/);
const p5FunctionMatch = pdfGeneratorContent.match(/function\s+renderPrinciple5\s*\([^)]*\)\s*\{/);

console.log("\nPDF GENERATOR FUNCTION CHECK:");
console.log("renderPrinciple2PdfMake function found:", !!p2FunctionMatch);
console.log("renderPrinciple5 function found:", !!p5FunctionMatch);

// Check the first few lines of each function to ensure they're properly implemented
if (p2FunctionMatch) {
    const p2FunctionStartIndex = p2FunctionMatch.index;
    const p2FunctionFirstLines = pdfGeneratorContent.substring(p2FunctionStartIndex, p2FunctionStartIndex + 300);
    console.log("\nrenderPrinciple2PdfMake first few lines:");
    console.log(p2FunctionFirstLines);
}

if (p5FunctionMatch) {
    const p5FunctionStartIndex = p5FunctionMatch.index;
    const p5FunctionFirstLines = pdfGeneratorContent.substring(p5FunctionStartIndex, p5FunctionStartIndex + 300);
    console.log("\nrenderPrinciple5 first few lines:");
    console.log(p5FunctionFirstLines);
}

// Check how these functions are called in the main generateBRSRPdf function
const mainFunctionCallsP2Match = pdfGeneratorContent.match(/content\.push\(\.\.\.(renderPrinciple2PdfMake|renderPrinciple2)\(p2Data,\s*calculatedData\)\);/);
const mainFunctionCallsP5Match = pdfGeneratorContent.match(/content\.push\(\.\.\.(renderPrinciple5)\(p5Data,\s*calculatedData\)\);/);

console.log("\nMAIN FUNCTION CALLS CHECK:");
console.log("Main function calls renderPrinciple2PdfMake:", !!mainFunctionCallsP2Match);
console.log("Main function calls renderPrinciple5:", !!mainFunctionCallsP5Match);

// Check which function names are being used
if (mainFunctionCallsP2Match) {
    console.log("Function name used for Principle 2:", mainFunctionCallsP2Match[1]);
}

if (mainFunctionCallsP5Match) {
    console.log("Function name used for Principle 5:", mainFunctionCallsP5Match[1]);
}

// Create a test with export of the individual render functions
console.log("\nCREATING TEST WITH DIRECT RENDER FUNCTION CALLS:");

// Add exports for the render functions if they don't exist
if (!pdfGeneratorContent.includes('renderPrinciple2PdfMake,') && !pdfGeneratorContent.includes('renderPrinciple5,')) {
    // Create a modified version of the file with exports
    const modifiedContent = pdfGeneratorContent.replace(
        'module.exports = {',
        'module.exports = {\n    renderPrinciple2PdfMake,\n    renderPrinciple5,'
    );
    
    const tempFilePath = path.join(__dirname, 'pdfGenerator_with_exports.js');
    fs.writeFileSync(tempFilePath, modifiedContent);
    console.log(`Created temporary file with exports: ${tempFilePath}`);
    
    // Create a test file that directly calls the render functions
    const testDirectCallsPath = path.join(__dirname, 'testDirectRenderCalls.js');
    const testDirectCallsContent = `
const fs = require('fs');
const path = require('path');
const { renderPrinciple2PdfMake, renderPrinciple5 } = require('./pdfGenerator_with_exports');

// Test data
const p2Data = {
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
};

const p5Data = {
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
};

// Test render functions directly
console.log("Testing renderPrinciple2PdfMake directly:");
try {
    const p2Content = renderPrinciple2PdfMake(p2Data, {});
    console.log("Principle 2 render successful:", p2Content && p2Content.length > 0);
    console.log("First few content items:", p2Content.slice(0, 3));
} catch (error) {
    console.error("Error rendering Principle 2:", error);
}

console.log("\\nTesting renderPrinciple5 directly:");
try {
    const p5Content = renderPrinciple5(p5Data, {});
    console.log("Principle 5 render successful:", p5Content && p5Content.length > 0);
    console.log("First few content items:", p5Content.slice(0, 3));
} catch (error) {
    console.error("Error rendering Principle 5:", error);
}
`;
    
    fs.writeFileSync(testDirectCallsPath, testDirectCallsContent);
    console.log(`Created test file for direct render calls: ${testDirectCallsPath}`);
} else {
    console.log("Functions are already exported, no need to create temporary files");
}
