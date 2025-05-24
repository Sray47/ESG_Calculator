// debugPdfTest.js - A simplified test for debugging purposes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test directories if they don't exist
const testDataDir = path.join(__dirname, 'test', 'data');
fs.mkdirSync(testDataDir, { recursive: true });

const projectTestDataDir = path.join(process.cwd(), 'test', 'data');
fs.mkdirSync(projectTestDataDir, { recursive: true });

const srcTestsTestDataDir = path.join(process.cwd(), 'src', 'tests', 'test', 'data');
fs.mkdirSync(srcTestsTestDataDir, { recursive: true });

// Check if files exist
console.log('Test file exists in src/tests/test/data:', 
  fs.existsSync(path.join(srcTestsTestDataDir, '05-versions-space.pdf')));

console.log('Test file exists in test/data:', 
  fs.existsSync(path.join(projectTestDataDir, '05-versions-space.pdf')));

// Try to create file content
const minimalPdf = '%PDF-1.3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT /F1 12 Tf (Test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000198 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n270\n%%EOF';

// Try to write to both locations
try {
  fs.writeFileSync(path.join(srcTestsTestDataDir, '05-versions-space.pdf'), minimalPdf);
  console.log('Successfully wrote test file to src/tests/test/data');
} catch (err) {
  console.error('Failed to write to src/tests/test/data:', err);
}

try {
  fs.writeFileSync(path.join(projectTestDataDir, '05-versions-space.pdf'), minimalPdf);
  console.log('Successfully wrote test file to test/data');
} catch (err) {
  console.error('Failed to write to test/data:', err);
}

// Try to load pdf-parse module
try {
  console.log('Attempting to import pdf-parse...');
  import('pdf-parse').then(PDFParser => {
    console.log('Successfully imported pdf-parse');

    // Try parsing a simple PDF
    const pdfPath = path.join(srcTestsTestDataDir, '05-versions-space.pdf');
    console.log('Attempting to parse PDF at:', pdfPath);
    
    const dataBuffer = fs.readFileSync(pdfPath);
    PDFParser.default(dataBuffer).then(data => {
      console.log('Successfully parsed PDF, text length:', data.text.length);
    }).catch(err => {
      console.error('Error parsing PDF:', err);
    });
  }).catch(err => {
    console.error('Failed to import pdf-parse:', err);
  });
} catch (err) {
  console.error('Error during PDF parsing setup:', err);
}
