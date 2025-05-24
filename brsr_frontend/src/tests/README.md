# BRSR Form Automation Tests

This directory contains automated testing scripts for the ESG Calculator application, focusing specifically on filling out BRSR form sections with realistic test data.

## Test Structure

- `formAutomation.test.js`: Main test file that runs the Section A form automation
- `sectionAAutomation.js`: Contains specialized functions for completing the Section A form
- `testData.js`: Contains test data based on NALCO's BRSR report
- `formUtils.js`: Utility functions for interacting with forms
- `runSectionATests.js`: Utility script to run Section A tests
- `createTestUser.js`: Creates a test user for running the tests

## Running the Tests

### Prerequisites

1. Ensure the frontend and backend servers are running:
   ```powershell
   # Terminal 1 - Start backend server
   cd brsr_backend
   npm start

   # Terminal 2 - Start frontend server
   cd brsr_frontend
   npm run dev
   ```

2. Create a test user (first time only):
   ```powershell
   cd brsr_frontend
   npm run test:create-user
   ```

### Running Form Automation Tests

#### Regular mode (with visible browser)
```powershell
cd brsr_frontend
npm run test:section-a
```

#### Headless mode (without visible browser)
```powershell
cd brsr_frontend
npm run test:section-a:headless
```

### Running PDF Generation and Calculation Tests

We've added tests to verify the PDF generation process and validate calculations:

1. PDF Generation Test:
   ```powershell
   npm run test:pdf
   # or headless mode:
   npm run test:pdf:headless
   ```

2. Full End-to-End Test with Calculation Validation:
   ```powershell
   npm run test:full
   # or headless mode:
   npm run test:full:headless
   ```

#### Important Note About PDF Testing

The pdf-parse library used for PDF testing requires a test file at `test/data/05-versions-space.pdf`. This file should be created automatically during the setup process, but if you encounter an error like `ENOENT: no such file or directory, open '.../test/data/05-versions-space.pdf'`, you can manually create this file:

```powershell
# Create directory if it doesn't exist
mkdir -Force "C:\Users\USER\ESG_Calculator\brsr_frontend\test\data"

# Generate a minimal PDF file (you can copy an existing PDF file here instead)
$minimalPdf = '%PDF-1.3
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 21 >>
stream
BT /F1 12 Tf (Test) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000198 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
270
%%EOF'

Set-Content -Path "C:\Users\USER\ESG_Calculator\brsr_frontend\test\data\05-versions-space.pdf" -Value $minimalPdf
```

See [PDF_TESTING.md](PDF_TESTING.md) for more details on PDF calculation validation.

## Test Flow

The automation tests perform the following steps:
1. Login using the test user credentials
2. Create a new BRSR report
3. Fill out all sections of the Section A form with realistic test data
4. Save the form and verify success

## Screenshots

Screenshots are automatically saved in the `screenshots` directory during test execution. They capture key steps in the form submission process and are helpful for debugging.

## Extending the Tests

To extend these tests to cover additional sections (B, C) of the BRSR form:

1. Create specialized automation modules (e.g., `sectionBAutomation.js`)
2. Add test data in `testData.js` for the new sections
3. Add new test cases in `formAutomation.test.js`
4. Update the run script to include the new tests
