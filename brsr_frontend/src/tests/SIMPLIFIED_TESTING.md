# ESG Calculator Automated Testing

This document provides information on running automated tests for the ESG Calculator application.

## Overview

The automated testing script provides end-to-end testing of the ESG Calculator application. It performs the following key steps:

1. Creates a test user account with company information
2. Logs into the application 
3. Creates a new ESG report
4. Fills in Section A data (company details, employee information, etc.)
5. Submits the report
6. Generates and downloads the PDF report

## Prerequisites

Before running the tests, ensure that:

1. Both frontend and backend servers are running:
   ```powershell
   # Terminal 1 - Start backend server
   cd brsr_backend
   npm start

   # Terminal 2 - Start frontend server
   cd brsr_frontend
   npm run dev
   ```

2. Required dependencies are installed:
   ```powershell
   npm install puppeteer axios
   ```

## Running the Tests

You can run the tests in two modes:

### Visible Browser Mode

This mode shows the browser automation in real-time, which is useful for debugging:

```powershell
npm test
```

### Headless Mode

This mode runs tests in the background without showing the browser, which is faster and suitable for CI/CD pipelines:

```powershell
npm run test:headless
```

## Test Results

The tests will generate the following artifacts:

1. **Console Output**: Shows the progress and results of each test step
2. **Screenshots**: Saved in the `src/tests/screenshots` directory for visual verification
3. **Downloaded PDF**: The generated report is saved in the `src/tests/downloads` directory

## Test Data

The test uses sample data defined within the test script. The data covers:

- Company information
- Business activities
- Products and services
- Locations and markets
- Employee and worker details
- Women representation statistics
- Holding/subsidiary companies
- CSR information
- Transparency and complaint metrics

## Modifying the Test

To modify the test:

1. Edit the `testData` object in `simplifiedTest.js` to change the test data
2. Add or modify form filling steps in the `runTest` function
3. Add additional validation checks as needed

## Troubleshooting

If the tests fail, check:

- Both backend and frontend servers are running
- The form structure hasn't changed (selectors may need updating)
- The console output and screenshots to identify where the test failed

The screenshots in the `screenshots` directory are particularly helpful for debugging form filling issues.
