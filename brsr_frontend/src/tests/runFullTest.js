// runFullTest.js
// This script runs a full end-to-end test of form filling, submission and PDF verification

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runTest } from './testPdfGeneration.js';
import { runValidation } from './verifyPdfCalculations.js';

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for command line arguments
const args = process.argv.slice(2);
const headless = args.includes('--headless');

// Create directories for test artifacts
const screenshotsDir = path.join(__dirname, 'screenshots');
const downloadsDir = path.join(__dirname, 'downloads');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

/**
 * Run a full end-to-end test of the ESG Calculator application:
 * 1. Fill out the form with test data
 * 2. Submit the form
 * 3. Generate a PDF
 * 4. Verify the calculations in the PDF
 */
async function runFullTest() {
  console.log('=== Starting Full End-to-End Test ===');
  console.log('1. Form filling and submission');
  
  try {
    // Run the form automation and PDF generation test
    const testResult = await runTest(headless);
    
    if (!testResult || !testResult.success) {
      console.error('Form automation and PDF generation test failed.');
      return false;
    }
    
    console.log('Form test completed successfully!');
    console.log('PDF generated at:', testResult.pdfPath);
    
    // Wait a moment to ensure PDF is fully written to disk
    console.log('Waiting for PDF file to be fully written to disk...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the PDF file exists
    if (!fs.existsSync(testResult.pdfPath)) {
      console.error('PDF file not found at the expected location:', testResult.pdfPath);
      return false;
    }
    
    console.log('2. PDF calculation verification');
    
    // Run the PDF validation
    const validationResult = await runValidation(testResult.pdfPath);
    
    if (!validationResult) {
      console.error('PDF calculation validation failed.');
      return false;
    }
    
    console.log('PDF calculation validation passed!');
    console.log('=== Full End-to-End Test Completed Successfully ===');
    
    return true;
  } catch (error) {
    console.error('An error occurred during the full test:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

export { runFullTest };
