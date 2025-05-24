# PDF Generation and Calculation Testing

This document explains how to test the PDF generation process and verify that calculations in the generated PDFs are correctly performed.

## Overview

The ESG Calculator includes automated tests that:

1. Fill forms with test data
2. Submit the forms to generate reports
3. Download the generated PDFs
4. Verify that the calculations in the PDFs match expected values

These tests ensure that mathematical formulas like totals and percentages are correctly calculated.

## Test Files

- `testPdfGeneration.js` - Handles form filling, submission, and PDF download
- `verifyPdfCalculations.js` - Extracts text from PDFs and validates calculations
- `runFullTest.js` - Combines both tests into a single end-to-end test

## Running the Tests

### Prerequisites

1. Make sure both the backend and frontend servers are running:

```powershell
# Terminal 1 - Start backend server
cd brsr_backend
npm start

# Terminal 2 - Start frontend server
cd brsr_frontend
npm run dev
```

2. Install required dependencies:

```powershell
cd brsr_frontend
npm install pdf-parse
```

### Test Options

#### Test PDF Generation Only

```powershell
# Visible browser mode
npm run test:pdf

# Headless mode (no visible browser)
npm run test:pdf:headless
```

#### Run Full End-to-End Test with Calculation Verification

```powershell
# Visible browser mode
npm run test:full

# Headless mode (no visible browser)
npm run test:full:headless
```

## What's Being Verified

The calculation validation tests verify that:

1. **Employee and Worker Totals**: 
   - Sum of permanent and other-than-permanent employees/workers matches the total
   - Sum of male and female employees/workers matches the total

2. **Women Representation Percentages**: 
   - Board women percentage = (women board members / total board members) * 100
   - KMP women percentage = (women KMPs / total KMPs) * 100

3. **Environmental Calculations**:
   - Water withdrawal totals = sum of surface water + groundwater + third-party water + seawater + others
   - Energy consumption totals = electricity + fuel + other sources

4. **Other Percentage Calculations**:
   - Various percentage fields are properly calculated from their components

## Test Results

Test results are displayed in the console, showing passed and failed tests. Screenshots are saved at key points in the process for debugging.

### Viewing Test Results

- **Screenshots**: Located in the `src/tests/screenshots` directory
- **Downloaded PDFs**: Located in the `src/tests/downloads` directory
- **Validation Reports**: Displayed in the console output

## Troubleshooting

If tests fail, check:

1. Both backend and frontend servers are running
2. Network connectivity to both servers (default URLs are http://localhost:3050 for API and http://localhost:5173 for frontend)
3. Screenshots in the screenshots directory to see where the process failed
4. Console output for specific error messages

## Customizing Tests

To test different calculations or add new validation rules:

1. Modify `verifyPdfCalculations.js` to add new validation functions
2. Update `testData.js` with different test values to test edge cases
