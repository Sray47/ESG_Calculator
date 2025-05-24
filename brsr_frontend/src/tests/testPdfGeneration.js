// testPdfGeneration.js
// This script tests the form submission and PDF generation process

import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import testData from './testData.js';
import { runValidation } from './verifyPdfCalculations.js';

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3050/api';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Take a screenshot for debugging
 */
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}_${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Create a test user account
 */
async function createTestUser() {
  console.log('Creating test user...');
  
  // Generate unique email
  const uniqueId = Date.now();
  const email = `test_${uniqueId}@example.com`;
  const password = 'Test123!';
  
  try {
    // Register new user with company profile
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      company_name: testData.company.name,
      cin: testData.company.cin,
      year_of_incorporation: testData.company.year_of_incorporation,
      registered_office_address: testData.company.registered_office_address,
      corporate_address: testData.company.corporate_address,
      telephone: testData.company.telephone,
      website: testData.company.website,
      stock_exchange_listed: testData.company.stock_exchange_listed,
      paid_up_capital: testData.company.paid_up_capital,
      brsr_contact_name: testData.company.brsr_contact_name,
      brsr_contact_mail: testData.company.brsr_contact_mail,
      brsr_contact_number: testData.company.brsr_contact_number
    });
    
    console.log('Test user created:', email);
    return { email, password };
  } catch (error) {
    console.error('Error creating test user:', error.response?.data || error.message);
    throw new Error('Failed to create test user');
  }
}

/**
 * Login to the application
 */
async function login(page, credentials) {
  console.log('Logging in...');
  
  await page.goto(`${BASE_URL}/login`);
  
  // Wait for the login form
  await page.waitForSelector('input[name="email"]');
  
  // Fill login form
  await page.type('input[name="email"]', credentials.email);
  await page.type('input[name="password"]', credentials.password);
  
  // Submit login form
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);
  
  // Verify login success
  await page.waitForSelector('.profile-header');
  console.log('Login successful!');
  await takeScreenshot(page, 'login_success');
}

/**
 * Create a new BRSR report
 */
async function createNewReport(page) {
  console.log('Creating new BRSR report...');
  
  // Navigate to new report page
  await page.click('a[href="/new-report"]');
  await page.waitForSelector('form', { visible: true });
  
  // Fill report details
  const currentYear = new Date().getFullYear();
  await page.type('input[name="financial_year"]', `${currentYear-1}-${currentYear}`);
  await page.select('select[name="reporting_boundary"]', testData.sectionA.reporting_boundary);
  
  // Submit form
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);
  
  // Verify we're in the report wizard
  await page.waitForSelector('.report-wizard-container');
  console.log('New report created successfully!');
  await takeScreenshot(page, 'new_report_created');
}

/**
 * Fill Section A form with test data
 */
async function fillSectionA(page) {
  console.log('Filling Section A form...');
  
  // Business Activities
  await fillBusinessActivities(page);
  
  // Products/Services
  await fillProductsServices(page);
  
  // Locations
  await fillLocations(page);
  
  // Markets Served
  await fillMarketsServed(page);
  
  // Employee and Worker Details
  await fillEmployeeDetails(page);
  
  // Women Representation
  await fillWomenRepresentation(page);
  
  // Turnover Rates
  await fillTurnoverRates(page);
  
  // Holding/Subsidiary Companies
  await fillHoldingSubsidiaryCompanies(page);
  
  // CSR Details
  await fillCSRDetails(page);
  
  // Transparency & Complaints
  await fillTransparencyComplaints(page);
  
  // Save the form
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click('button[type="submit"]')
  ]);
  
  console.log('Section A saved successfully!');
  await takeScreenshot(page, 'section_a_saved');
}

/**
 * Fill Business Activities section
 */
async function fillBusinessActivities(page) {
  console.log('Filling Business Activities...');
  
  // First activity is already there
  const firstActivity = testData.sectionA.business_activities[0];
  await page.type('input[placeholder="Main Activity"]', firstActivity.description_main);
  await page.type('input[placeholder="Business Activity"]', firstActivity.description_business);
  await page.type('input[placeholder="% of Turnover"]', firstActivity.turnover_percentage);
  
  // Add more activities
  for (let i = 1; i < testData.sectionA.business_activities.length; i++) {
    const activity = testData.sectionA.business_activities[i];
    await page.click('button:contains("Add Activity")');
    await page.waitForTimeout(500);
    
    await page.type(`div.array-item:nth-child(${i+1}) input[placeholder="Main Activity"]`, activity.description_main);
    await page.type(`div.array-item:nth-child(${i+1}) input[placeholder="Business Activity"]`, activity.description_business);
    await page.type(`div.array-item:nth-child(${i+1}) input[placeholder="% of Turnover"]`, activity.turnover_percentage);
  }
}

/**
 * Fill Products/Services section
 */
async function fillProductsServices(page) {
  console.log('Filling Products/Services...');
  
  // First product is already there
  const firstProduct = testData.sectionA.products_services[0];
  await page.type('input[placeholder="Product/Service"]', firstProduct.product_service);
  await page.type('input[placeholder="NIC Code"]', firstProduct.nic_code);
  await page.type('input[placeholder="% Turnover Contributed"]', firstProduct.turnover_contributed);
  
  // Add more products
  for (let i = 1; i < testData.sectionA.products_services.length; i++) {
    const product = testData.sectionA.products_services[i];
    await page.click('button:contains("Add Product/Service")');
    await page.waitForTimeout(500);
    
    await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="Product/Service"]`, product.product_service);
    await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="NIC Code"]`, product.nic_code);
    await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="% Turnover Contributed"]`, product.turnover_contributed);
  }
}

/**
 * Fill Locations section
 */
async function fillLocations(page) {
  console.log('Filling Locations...');
  
  const locations = testData.sectionA.locations;
  await page.type('input[name="sa_locations_plants_offices.national_plants"]', locations.national_plants.toString());
  await page.type('input[name="sa_locations_plants_offices.national_offices"]', locations.national_offices.toString());
  await page.type('input[name="sa_locations_plants_offices.international_plants"]', locations.international_plants.toString());
  await page.type('input[name="sa_locations_plants_offices.international_offices"]', locations.international_offices.toString());
}

/**
 * Fill Markets Served section
 */
async function fillMarketsServed(page) {
  console.log('Filling Markets Served...');
  
  const markets = testData.sectionA.markets_served;
  await page.type('input[name="sa_markets_served.locations.national_states"]', markets.locations.national_states.toString());
  await page.type('input[name="sa_markets_served.locations.international_countries"]', markets.locations.international_countries.toString());
  await page.type('#sa_markets_served_exports_percentage', markets.exports_percentage);
  await page.type('#sa_markets_served_customer_types', markets.customer_types);
}

/**
 * Fill Employee Details section
 */
async function fillEmployeeDetails(page) {
  console.log('Filling Employee and Worker Details...');
  
  // Fill employee details
  const employees = testData.sectionA.employees_details;
  await page.type('input[name="sa_employee_details.permanent_male"]', employees.permanent_male.toString());
  await page.type('input[name="sa_employee_details.permanent_female"]', employees.permanent_female.toString());
  await page.type('input[name="sa_employee_details.other_than_permanent_male"]', employees.other_than_permanent_male.toString());
  await page.type('input[name="sa_employee_details.other_than_permanent_female"]', employees.other_than_permanent_female.toString());
  
  // Fill worker details
  const workers = testData.sectionA.workers_details;
  await page.type('input[name="sa_workers_details.permanent_male"]', workers.permanent_male.toString());
  await page.type('input[name="sa_workers_details.permanent_female"]', workers.permanent_female.toString());
  await page.type('input[name="sa_workers_details.other_than_permanent_male"]', workers.other_than_permanent_male.toString());
  await page.type('input[name="sa_workers_details.other_than_permanent_female"]', workers.other_than_permanent_female.toString());
  
  // Fill differently abled details
  const diffAbled = testData.sectionA.differently_abled_details;
  await page.type('input[name="sa_differently_abled_details.employees_male"]', diffAbled.employees_male.toString());
  await page.type('input[name="sa_differently_abled_details.employees_female"]', diffAbled.employees_female.toString());
  await page.type('input[name="sa_differently_abled_details.workers_male"]', diffAbled.workers_male.toString());
  await page.type('input[name="sa_differently_abled_details.workers_female"]', diffAbled.workers_female.toString());
}

/**
 * Fill Women Representation section
 */
async function fillWomenRepresentation(page) {
  console.log('Filling Women Representation...');
  
  const women = testData.sectionA.women_representation;
  await page.type('input[name="sa_women_representation_details.board_total_members"]', women.board_total_members.toString());
  await page.type('input[name="sa_women_representation_details.board_number_of_women"]', women.board_number_of_women.toString());
  await page.type('input[name="sa_women_representation_details.kmp_total_personnel"]', women.kmp_total_personnel.toString());
  await page.type('input[name="sa_women_representation_details.kmp_number_of_women"]', women.kmp_number_of_women.toString());
}

/**
 * Fill Turnover Rates section
 */
async function fillTurnoverRates(page) {
  console.log('Filling Turnover Rates...');
  
  const turnover = testData.sectionA.turnover_rates;
  await page.type('#sa_turnover_employees', turnover.permanent_employees_turnover_rate);
  await page.type('#sa_turnover_workers', turnover.permanent_workers_turnover_rate);
}

/**
 * Fill Holding/Subsidiary Companies section
 */
async function fillHoldingSubsidiaryCompanies(page) {
  console.log('Filling Holding/Subsidiary Companies...');
  
  const companies = testData.sectionA.holding_subsidiary_companies;
  
  // Add companies
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    
    if (i > 0) {
      await page.click('button:contains("Add Company")');
      await page.waitForTimeout(500);
    }
    
    await page.type(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) input[placeholder="Company Name"]`, company.name);
    await page.type(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) input[placeholder="CIN / Country"]`, company.cin_or_country);
    await page.select(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) select`, company.type);
    await page.type(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) input[placeholder="% Holding"]`, company.percentage_holding);
  }
}

/**
 * Fill CSR Details section
 */
async function fillCSRDetails(page) {
  console.log('Filling CSR Details...');
  
  const csr = testData.sectionA.csr;
  
  if (csr.applicable) {
    await page.click('input[name="sa_csr_applicable"]');
    await page.waitForTimeout(500);
    
    await page.type('#sa_csr_turnover', csr.turnover);
    await page.type('#sa_csr_net_worth', csr.net_worth);
  }
}

/**
 * Fill Transparency & Complaints section
 */
async function fillTransparencyComplaints(page) {
  console.log('Filling Transparency & Complaints...');
  
  const complaints = testData.sectionA.transparency_complaints;
  await page.type('input[name="sa_transparency_complaints.received"]', complaints.received.toString());
  await page.type('input[name="sa_transparency_complaints.pending"]', complaints.pending.toString());
  await page.type('#sa_transparency_complaints_remarks', complaints.remarks);
}

/**
 * Submit the final report and generate PDF
 * @returns {Promise<string>} - Path to the downloaded PDF file
 */
async function submitReportAndGeneratePDF(page) {
  console.log('Submitting final report...');
  
  // Navigate to review and submit page
  await page.click('a:contains("Review & Submit")');
  await page.waitForSelector('button:contains("Submit Report")');
  
  // Take screenshot before submission
  await takeScreenshot(page, 'before_final_submission');
  
  // Submit the final report
  let reportId;
  const response = await Promise.all([
    page.waitForResponse(response => 
      response.url().includes('/api/reports/') && 
      response.url().includes('/submit') && 
      response.status() === 200
    ),
    page.click('button:contains("Submit Report")')
  ]);
  
  // Extract the report ID from the response URL
  const responseUrl = response[0].url();
  const reportIdMatch = responseUrl.match(/\/reports\/([^\/]+)\/submit/);
  if (reportIdMatch && reportIdMatch[1]) {
    reportId = reportIdMatch[1];
    console.log('Extracted report ID:', reportId);
  }
  
  console.log('Report submitted successfully!');
  await takeScreenshot(page, 'report_submitted');
  
  // Wait for PDF link to appear
  await page.waitForSelector('a:contains("Download PDF")');
  
  // Setup download path
  const downloadPath = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  // Get the current files in the download directory before download
  const beforeFiles = new Set(fs.readdirSync(downloadPath));
  
  // Enable download in Puppeteer
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });
  
  // Click the download button
  await page.click('a:contains("Download PDF")');
  console.log('PDF download initiated');
  
  // Wait for the download to complete by checking for new files
  const pdfFilePath = await waitForDownload(downloadPath, beforeFiles);
  
  if (pdfFilePath) {
    console.log(`PDF downloaded successfully: ${pdfFilePath}`);
    return pdfFilePath;
  } else {
    console.error('❌ PDF download failed or timed out');
    throw new Error('PDF download failed');
  }
}

/**
 * Wait for a file to be downloaded
 * @param {string} downloadPath - Path where downloads are saved
 * @param {Set} beforeFiles - Set of files that existed before the download started
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string>} - Path of the downloaded file or null if timeout
 */
async function waitForDownload(downloadPath, beforeFiles, timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {      const checkForNewFile = () => {
      console.log('Checking for new files in:', downloadPath);
      const currentFiles = fs.readdirSync(downloadPath);
      console.log('Current files in directory:', currentFiles);
      const newFiles = currentFiles.filter(file => !beforeFiles.has(file));
      console.log('New files detected:', newFiles);
      
      // Look for completed downloads (.pdf files, not .crdownload)
      const completedFiles = newFiles.filter(file => 
        file.endsWith('.pdf') && !file.endsWith('.crdownload')
      );
      console.log('Completed PDF files:', completedFiles);
      
      if (completedFiles.length > 0) {
        // Return the first complete PDF
        console.log('Found completed PDF:', completedFiles[0]);
        return resolve(path.join(downloadPath, completedFiles[0]));
      }
      
      if (Date.now() - startTime > timeout) {
        console.log('Download timeout reached after', timeout, 'ms');
        return resolve(null);
      }
      
      // Check again in a moment
      setTimeout(checkForNewFile, 500);
    };
    
    checkForNewFile();
  });
}

/**
 * Run the complete test process
 */
async function runTest(useHeadless = false) {
  let browser;
  let page;
  let testResult = {
    success: false,
    message: '',
    pdfPath: null
  };
  
  try {
    // Create a test user
    const credentials = await createTestUser();
    
    // Launch browser
    console.log(`Launching browser in ${useHeadless ? 'headless' : 'visible'} mode...`);
    browser = await puppeteer.launch({
      headless: useHeadless ? 'new' : false,
      slowMo: useHeadless ? 50 : 100,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    
    // Login
    await login(page, credentials);
    
    // Create a new report
    await createNewReport(page);
    
    // Fill Section A
    await fillSectionA(page);
    
    // Submit report and generate PDF
    const pdfPath = await submitReportAndGeneratePDF(page);
    
    console.log('Test completed successfully!');
    testResult.success = true;
    testResult.message = 'Test completed successfully';
    testResult.pdfPath = pdfPath;
    
  } catch (error) {
    console.error('Test failed:', error);
    testResult.message = `Test failed: ${error.message}`;
    
    if (page) {
      const screenshotPath = await takeScreenshot(page, 'test_failed');
      console.log(`Failure screenshot saved to: ${screenshotPath}`);
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Return the test result
  return testResult;
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const headless = args.includes('--headless');
  console.log('Starting PDF generation test with headless mode:', headless);
  console.log('Current working directory:', process.cwd());
  console.log('Test PDF file exists at src/tests/test/data:', fs.existsSync(path.join(process.cwd(), 'src', 'tests', 'test', 'data', '05-versions-space.pdf')));
  console.log('Test PDF file exists at test/data:', fs.existsSync(path.join(process.cwd(), 'test', 'data', '05-versions-space.pdf')));
  runTest(headless)
    .then(result => {
      console.log('Test result:', JSON.stringify(result));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test error:', error);
      process.exit(1);
    });
}

export { runTest };
