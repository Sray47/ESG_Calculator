// verifyPdfCalculations.js
// This script validates calculations in the generated PDF files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for pdf-parse package requiring a specific test file
// The error suggests pdf-parse is looking for this file under src/tests/test/data
// when scripts are run from the src/tests directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the directory structure in multiple locations to ensure it's found
const testDataDir = path.join(__dirname, 'test', 'data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Also create the file in the project root test/data directory
const projectTestDataDir = path.join(process.cwd(), 'test', 'data');
if (!fs.existsSync(projectTestDataDir)) {
  fs.mkdirSync(projectTestDataDir, { recursive: true });
}

// Create the specific directory structure seen in the error message
const srcTestsTestDataDir = path.join(process.cwd(), 'src', 'tests', 'test', 'data');
if (!fs.existsSync(srcTestsTestDataDir)) {
  fs.mkdirSync(srcTestsTestDataDir, { recursive: true });
}

// Create the minimal PDF file in all possible locations
const pdfContent = '%PDF-1.3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT /F1 12 Tf (Test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000198 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n270\n%%EOF';

// Write to all potential locations
const dummyPdfPath1 = path.join(testDataDir, '05-versions-space.pdf');
const dummyPdfPath2 = path.join(projectTestDataDir, '05-versions-space.pdf');
const dummyPdfPath3 = path.join(srcTestsTestDataDir, '05-versions-space.pdf');

if (!fs.existsSync(dummyPdfPath1)) {
  try { fs.writeFileSync(dummyPdfPath1, pdfContent); } catch (e) { console.error('Could not write to:', dummyPdfPath1); }
}

if (!fs.existsSync(dummyPdfPath2)) {
  try { fs.writeFileSync(dummyPdfPath2, pdfContent); } catch (e) { console.error('Could not write to:', dummyPdfPath2); }
}

if (!fs.existsSync(dummyPdfPath3)) {
  try { fs.writeFileSync(dummyPdfPath3, pdfContent); } catch (e) { console.error('Could not write to:', dummyPdfPath3); }
}

// Import PDF parser after ensuring the test file exists
import PDFParser from 'pdf-parse';

class PdfCalculationValidator {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.pdfText = '';
    this.validationResults = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Extract text content from the PDF file
   */
  async extractPdfText() {
    console.log(`Extracting text from PDF: ${this.pdfPath}`);
    
    try {
      const dataBuffer = fs.readFileSync(this.pdfPath);
      const pdfData = await PDFParser(dataBuffer);
      this.pdfText = pdfData.text;
      console.log(`PDF text extracted successfully. Total characters: ${this.pdfText.length}`);
      return true;
    } catch (error) {
      console.error(`Error extracting PDF text: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract numeric values from text using regex
   * @param {string} text - The text to search in
   * @param {string} pattern - The regex pattern to match
   * @returns {number|null} - The extracted number or null if not found
   */
  extractNumericValue(text, pattern) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove commas and convert to number
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Extract percentage value from text using regex
   * @param {string} text - The text to search in
   * @param {string} pattern - The regex pattern to match
   * @returns {number|null} - The extracted percentage value or null if not found
   */
  extractPercentageValue(text, pattern) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove % sign and convert to number
      return parseFloat(match[1]);
    }
    return null;
  }

  /**
   * Validate that a total equals the sum of its parts
   * @param {string} description - Description of what's being validated
   * @param {number} total - The total value to validate
   * @param {Array<number>} components - Array of component values that should add up to the total
   * @param {number} tolerance - Acceptable rounding error tolerance (default 0.01)
   */
  validateTotal(description, total, components, tolerance = 0.01) {
    const sum = components.reduce((acc, val) => acc + (val || 0), 0);
    const difference = Math.abs(total - sum);
    
    if (difference <= tolerance) {
      this.validationResults.passed.push({
        description,
        expected: sum,
        actual: total,
        difference
      });
      return true;
    } else {
      this.validationResults.failed.push({
        description,
        expected: sum,
        actual: total,
        difference,
        components
      });
      return false;
    }
  }

  /**
   * Validate that a percentage is correctly calculated
   * @param {string} description - Description of what's being validated
   * @param {number} percentage - The percentage value to validate
   * @param {number} numerator - The numerator used in the calculation
   * @param {number} denominator - The denominator used in the calculation
   * @param {number} tolerance - Acceptable rounding error tolerance (default 0.01)
   */
  validatePercentage(description, percentage, numerator, denominator, tolerance = 0.1) {
    if (!denominator) {
      this.validationResults.warnings.push({
        description,
        message: "Denominator is zero, percentage should be 0%"
      });
      return percentage === 0;
    }
    
    const expectedPercentage = (numerator / denominator) * 100;
    const difference = Math.abs(percentage - expectedPercentage);
    
    if (difference <= tolerance) {
      this.validationResults.passed.push({
        description,
        expected: expectedPercentage,
        actual: percentage,
        difference
      });
      return true;
    } else {
      this.validationResults.failed.push({
        description,
        expected: expectedPercentage,
        actual: percentage,
        difference,
        numerator,
        denominator
      });
      return false;
    }
  }

  /**
   * Validate employee and worker totals in Section A
   */
  validateEmployeeWorkerTotals() {
    console.log("Validating employee and worker totals...");
    
    // Extract employee counts
    const permanentMaleEmployees = this.extractNumericValue(this.pdfText, /Permanent Employees\s+Male\s+(\d+[\d,]*)/);
    const permanentFemaleEmployees = this.extractNumericValue(this.pdfText, /Permanent Employees\s+Female\s+(\d+[\d,]*)/);
    const otherMaleEmployees = this.extractNumericValue(this.pdfText, /Other than Permanent Employees\s+Male\s+(\d+[\d,]*)/);
    const otherFemaleEmployees = this.extractNumericValue(this.pdfText, /Other than Permanent Employees\s+Female\s+(\d+[\d,]*)/);
    const totalEmployees = this.extractNumericValue(this.pdfText, /Total Employees\s+(\d+[\d,]*)/);
    
    // Extract worker counts
    const permanentMaleWorkers = this.extractNumericValue(this.pdfText, /Permanent Workers\s+Male\s+(\d+[\d,]*)/);
    const permanentFemaleWorkers = this.extractNumericValue(this.pdfText, /Permanent Workers\s+Female\s+(\d+[\d,]*)/);
    const otherMaleWorkers = this.extractNumericValue(this.pdfText, /Other than Permanent Workers\s+Male\s+(\d+[\d,]*)/);
    const otherFemaleWorkers = this.extractNumericValue(this.pdfText, /Other than Permanent Workers\s+Female\s+(\d+[\d,]*)/);
    const totalWorkers = this.extractNumericValue(this.pdfText, /Total Workers\s+(\d+[\d,]*)/);
    
    if (permanentMaleEmployees && permanentFemaleEmployees && otherMaleEmployees && otherFemaleEmployees && totalEmployees) {
      this.validateTotal(
        "Total Employees",
        totalEmployees,
        [permanentMaleEmployees, permanentFemaleEmployees, otherMaleEmployees, otherFemaleEmployees]
      );
    } else {
      this.validationResults.warnings.push({
        description: "Employee Totals",
        message: "Could not extract all required employee count values from the PDF"
      });
    }
    
    if (permanentMaleWorkers && permanentFemaleWorkers && otherMaleWorkers && otherFemaleWorkers && totalWorkers) {
      this.validateTotal(
        "Total Workers",
        totalWorkers,
        [permanentMaleWorkers, permanentFemaleWorkers, otherMaleWorkers, otherFemaleWorkers]
      );
    } else {
      this.validationResults.warnings.push({
        description: "Worker Totals",
        message: "Could not extract all required worker count values from the PDF"
      });
    }
  }

  /**
   * Validate women representation percentages in Section A
   */
  validateWomenRepresentation() {
    console.log("Validating women representation percentages...");
    
    // Board of Directors
    const boardTotalMembers = this.extractNumericValue(this.pdfText, /Board of Directors\s+(\d+[\d,]*)\s+\d+[\d,]*\s+/);
    const boardWomenMembers = this.extractNumericValue(this.pdfText, /Board of Directors\s+\d+[\d,]*\s+(\d+[\d,]*)\s+/);
    const boardWomenPercentage = this.extractPercentageValue(this.pdfText, /Board of Directors\s+\d+[\d,]*\s+\d+[\d,]*\s+([\d.]+)%/);
    
    // Key Management Personnel
    const kmpTotalMembers = this.extractNumericValue(this.pdfText, /Key Management Personnel\s+(\d+[\d,]*)\s+\d+[\d,]*\s+/);
    const kmpWomenMembers = this.extractNumericValue(this.pdfText, /Key Management Personnel\s+\d+[\d,]*\s+(\d+[\d,]*)\s+/);
    const kmpWomenPercentage = this.extractPercentageValue(this.pdfText, /Key Management Personnel\s+\d+[\d,]*\s+\d+[\d,]*\s+([\d.]+)%/);
    
    if (boardTotalMembers && boardWomenMembers && boardWomenPercentage) {
      this.validatePercentage(
        "Board Women Representation",
        boardWomenPercentage,
        boardWomenMembers,
        boardTotalMembers
      );
    } else {
      this.validationResults.warnings.push({
        description: "Board Women Representation",
        message: "Could not extract all required board representation values from the PDF"
      });
    }
    
    if (kmpTotalMembers && kmpWomenMembers && kmpWomenPercentage) {
      this.validatePercentage(
        "KMP Women Representation",
        kmpWomenPercentage,
        kmpWomenMembers,
        kmpTotalMembers
      );
    } else {
      this.validationResults.warnings.push({
        description: "KMP Women Representation",
        message: "Could not extract all required KMP representation values from the PDF"
      });
    }
  }

  /**
   * Validate water withdrawal/consumption totals in Section C - Principle 6
   */
  validateWaterConsumption() {
    console.log("Validating water consumption totals...");
    
    const surfaceWater = this.extractNumericValue(this.pdfText, /Surface water\s+(\d+[\d,]*)/);
    const groundwater = this.extractNumericValue(this.pdfText, /Groundwater\s+(\d+[\d,]*)/);
    const thirdPartyWater = this.extractNumericValue(this.pdfText, /Third party water\s+(\d+[\d,]*)/);
    const seawaterDesalinated = this.extractNumericValue(this.pdfText, /Seawater \/ desalinated water\s+(\d+[\d,]*)/);
    const otherSources = this.extractNumericValue(this.pdfText, /Others\s+(\d+[\d,]*)/);
    const totalWaterWithdrawal = this.extractNumericValue(this.pdfText, /Total volume of water withdrawal\s+(\d+[\d,]*)/);
    
    if (surfaceWater && groundwater && thirdPartyWater && seawaterDesalinated !== null && otherSources && totalWaterWithdrawal) {
      this.validateTotal(
        "Water Withdrawal Total",
        totalWaterWithdrawal,
        [surfaceWater, groundwater, thirdPartyWater, seawaterDesalinated, otherSources]
      );
    } else {
      this.validationResults.warnings.push({
        description: "Water Withdrawal Total",
        message: "Could not extract all required water withdrawal values from the PDF"
      });
    }
  }

  /**
   * Validate energy consumption totals in Section C - Principle 6
   */
  validateEnergyConsumption() {
    console.log("Validating energy consumption totals...");
    
    const electricity = this.extractNumericValue(this.pdfText, /Electricity consumption\s+(\d+[\d,]*)/);
    const fuel = this.extractNumericValue(this.pdfText, /Fuel consumption\s+(\d+[\d,]*)/);
    const otherSources = this.extractNumericValue(this.pdfText, /Energy consumption through other sources\s+(\d+[\d,]*)/);
    const totalEnergy = this.extractNumericValue(this.pdfText, /Total energy consumption\s+(\d+[\d,]*)/);
    
    if (electricity && fuel && otherSources && totalEnergy) {
      this.validateTotal(
        "Energy Consumption Total",
        totalEnergy,
        [electricity, fuel, otherSources]
      );
    } else {
      this.validationResults.warnings.push({
        description: "Energy Consumption Total",
        message: "Could not extract all required energy consumption values from the PDF"
      });
    }
  }

  /**
   * Run all validation tests
   */
  async validateAll() {
    const success = await this.extractPdfText();
    if (!success) return false;
    
    this.validateEmployeeWorkerTotals();
    this.validateWomenRepresentation();
    this.validateWaterConsumption();
    this.validateEnergyConsumption();
    
    return this.generateReport();
  }

  /**
   * Generate a report of validation results
   */
  generateReport() {
    console.log("\n=== PDF CALCULATION VALIDATION REPORT ===");
    console.log(`PDF File: ${path.basename(this.pdfPath)}`);
    console.log(`Total Tests: ${this.validationResults.passed.length + this.validationResults.failed.length}`);
    console.log(`Passed: ${this.validationResults.passed.length}`);
    console.log(`Failed: ${this.validationResults.failed.length}`);
    console.log(`Warnings: ${this.validationResults.warnings.length}`);
    
    if (this.validationResults.failed.length > 0) {
      console.log("\n=== FAILED TESTS ===");
      this.validationResults.failed.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.description}`);
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual: ${result.actual}`);
        console.log(`   Difference: ${result.difference}`);
        
        if (result.components) {
          console.log(`   Components: [${result.components.join(', ')}]`);
        }
        
        if (result.numerator && result.denominator) {
          console.log(`   Calculation: ${result.numerator} / ${result.denominator} * 100 = ${(result.numerator / result.denominator * 100).toFixed(2)}%`);
        }
      });
    }
    
    if (this.validationResults.warnings.length > 0) {
      console.log("\n=== WARNINGS ===");
      this.validationResults.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.description}`);
        console.log(`   ${warning.message}`);
      });
    }
    
    console.log("\n=== VALIDATION COMPLETE ===");
    return this.validationResults.failed.length === 0;
  }
}

// Main function to run the validation
async function runValidation(pdfPath) {
  console.log("Running PDF validation on:", pdfPath);
  if (!pdfPath) {
    console.error("Please provide a path to the PDF file to validate");
    return false;
  }
  
  console.log("Checking if PDF file exists:", fs.existsSync(pdfPath));
  console.log("File stats:", fs.existsSync(pdfPath) ? JSON.stringify(fs.statSync(pdfPath)) : "File not found");
  
  try {
    const validator = new PdfCalculationValidator(pdfPath);
    const result = await validator.validateAll();
    console.log("Validation completed with result:", result);
    return result;
  } catch (error) {
    console.error(`Error running validation: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Run the validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error("Please provide the path to the generated PDF file as a command line argument");
    process.exit(1);
  }
  
  runValidation(pdfPath)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    });
}

export { PdfCalculationValidator, runValidation };
