// PDF Debug Script
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Create a debug function that will be inserted into pdfGenerator.js
function createDebugPdfGenerator() {
  console.log('Creating debug version of pdfGenerator.js');
  
  // Read the original file
  const pdfGeneratorPath = path.join(__dirname, 'brsr_backend', 'pdfGenerator.js');
  let pdfContent = fs.readFileSync(pdfGeneratorPath, 'utf8');
  
  // Create a backup of the original file
  fs.writeFileSync(pdfGeneratorPath + '.bak', pdfContent, 'utf8');
  console.log('Created backup of pdfGenerator.js at ' + pdfGeneratorPath + '.bak');
  
  // Replace all instances of "await drawTable" with just "drawTable"
  pdfContent = pdfContent.replace(/await\s+drawTable/g, 'drawTable');
  
  // Replace all instances of "async function renderPrinciple" with "function renderPrinciple"
  pdfContent = pdfContent.replace(/async\s+function\s+renderPrinciple/g, 'function renderPrinciple');
  
  // Replace all instances of "async function renderSection" with "function renderSection"
  pdfContent = pdfContent.replace(/async\s+function\s+renderSection/g, 'function renderSection');
  
  // Add function call debugging
  pdfContent = pdfContent.replace(/function drawTable\(/, 
    `// Debug wrapper for drawTable
function drawTableDebug(doc, table, startX, startY, tableWidth, columnLayout, options = {}) {
  console.log('drawTable called with', {startX, startY, tableWidth});
  try {
    return drawTable(doc, table, startX, startY, tableWidth, columnLayout, options);
  } catch (err) {
    console.error('Error in drawTable:', err);
    throw err;
  }
}

function drawTable(`);

  // Replace calls to drawTable with calls to drawTableDebug
  pdfContent = pdfContent.replace(/drawTable\(/g, 'drawTableDebug(');
  
  // Write the modified file
  fs.writeFileSync(pdfGeneratorPath, pdfContent, 'utf8');
  console.log('Created debug version of pdfGenerator.js');
}

// Run the debug script
createDebugPdfGenerator();
console.log('PDF debug script completed. Run your test script now to see detailed debugging output.');
