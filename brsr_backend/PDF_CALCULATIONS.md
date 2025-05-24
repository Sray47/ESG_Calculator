# PDF Report Generation with Automatic Calculations

This document explains how automatic calculations are performed for the BRSR report PDF generation.

## Overview

The BRSR framework requires various mathematical calculations for totals, percentages, and aggregations:
- Employee and worker totals (male, female, permanent, other)
- Water usage totals from different sources
- Energy consumption totals from different sources
- Waste generation totals
- Percentages for women representation, CSR spending, etc.

## Implementation

The calculations are implemented in the backend to ensure consistency and accuracy. The key components are:

### 1. Data Collection
- User inputs raw data through the front-end forms
- Data is stored in JSONB columns in the PostgreSQL database

### 2. Calculation Process
- When a report is submitted, the raw data is fetched from the database
- `calculateDerivedValues()` function processes this data to compute all required totals and percentages
- Results are passed to the PDF generation function

### 3. PDF Generation
- `generateBRSRPdf()` function uses the raw data and calculated values to create the final PDF report
- Calculations are displayed in appropriate tables and sections

## Key Formulas Implemented

### Section A
1. **Employee/Worker Totals**:
   - Permanent Total = Permanent Male + Permanent Female
   - Other than Permanent Total = Other than Permanent Male + Other than Permanent Female
   - Total Male = Permanent Male + Other than Permanent Male
   - Total Female = Permanent Female + Other than Permanent Female
   - Grand Total = Total Male + Total Female

2. **Women Representation Percentages**:
   - Board Women % = (Number of Women on Board / Total Board Members) × 100
   - KMP Women % = (Number of Women KMPs / Total KMPs) × 100

3. **Location Totals**:
   - Total Plants = National Plants + International Plants
   - Total Offices = National Offices + International Offices
   - Total National = National Plants + National Offices
   - Total International = International Plants + International Offices
   - Grand Total = Total National + Total International

### Section C - Principle 6
1. **Water Withdrawal Total**:
   - Total Volume = Surface Water + Groundwater + Third Party Water + Seawater/Desalinated + Others

2. **Energy Consumption Total**:
   - Total Energy = Electricity (A) + Fuel (B) + Other Sources (C)

### Section C - Principle 8
1. **CSR Spending**:
   - CSR Spending % = (Total Spent / Net Profit) × 100
   - Spending Gap = Obligation - Total Spent (if positive)

## Testing

To test the calculation functionality:

1. Run the test script:
   ```
   node testPdfCalculations.js
   ```

2. Generate a PDF with real data:
   ```
   # Submit a report through the API
   # Check the resulting PDF for correct calculations
   ```

## Extension

To add new calculations:
1. Add new formulas to `calculateDerivedValues()` function in pdfGenerator.js
2. Update the `generateBRSRPdf()` function to include these values in the appropriate sections
3. Test to ensure accuracy
