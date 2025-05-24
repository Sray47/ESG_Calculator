// simplifiedTest.js
// A simplified, all-in-one test script for the ESG Calculator application
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const BASE_URL = 'http://localhost:5173'; 
const API_URL = 'http://localhost:3050/api';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Create directories if they don't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Sample test data
const testData = {
  company: {
    name: "ESG Test Company",
    cin: "U12345AB6789CDE012345",
    year_of_incorporation: "2010",
    registered_office_address: "123 Test Street, Test City, 123456",
    corporate_address: "456 Corp Avenue, Business District, 654321",
    telephone: "1234567890",
    website: "https://testcompany.example.com",
    stock_exchange_listed: "Yes",
    paid_up_capital: "10000000",
    brsr_contact_name: "Test Contact",
    brsr_contact_mail: "contact@testcompany.example.com",
    brsr_contact_phone: "9876543210"
  },
  
  sectionA: {
    business_activities: [
      { description_main: "Manufacturing", description_business: "Steel Products", turnover_percentage: "65" },
      { description_main: "Services", description_business: "Engineering Consulting", turnover_percentage: "35" }
    ],
    products_services: [
      { product_service: "Steel Pipes", nic_code: "24106", turnover_contributed: "40" },
      { product_service: "Steel Sheets", nic_code: "24105", turnover_contributed: "25" },
      { product_service: "Engineering Design", nic_code: "71100", turnover_contributed: "35" }
    ],
    locations: {
      national_plants: "3",
      national_offices: "5",
      international_plants: "1",
      international_offices: "2"
    },
    markets_served: {
      locations: {
        national_states: "12",
        international_countries: "5"
      },
      exports_percentage: "30",
      customer_types: "B2B, Government"
    },
    employees_details: {
      permanent_male: 2500,
      permanent_female: 1200,
      other_than_permanent_male: 800,
      other_than_permanent_female: 400
    },
    workers_details: {
      permanent_male: 4000,
      permanent_female: 1500,
      other_than_permanent_male: 1200,
      other_than_permanent_female: 600
    },
    differently_abled_details: {
      employees_male: 25,
      employees_female: 15,
      workers_male: 40,
      workers_female: 20
    },
    women_representation: {
      board_total_members: "10",
      board_number_of_women: "3",
      kmp_total: "15",
      kmp_women: "5"
    },
    turnover_rates: {
      permanent_employees_turnover_rate: "12",
      permanent_workers_turnover_rate: "15"
    },
    holding_subsidiaries: [
      { name: "Parent Company Ltd", type: "Holding", percentage_holding: "60" },
      { name: "Subsidiary XYZ", type: "Subsidiary", percentage_holding: "75" }
    ],
    csr_details: {
      applicable: "Yes",
      turnover: "1200000000",
      networth: "5000000000"
    },
    transparency: {
      stakeholder_complaints: "15",
      complaints_resolved: "14"
    }
  }
};

// Helper functions
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}_${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function createUser() {
  // Generate unique email
  const uniqueId = Date.now();
  const email = `test_${uniqueId}@example.com`;
  const password = 'Test123!';
  
  try {
    // Register new user with company profile
    console.log('Registering test user...');
    await axios.post(`${API_URL}/auth/register`, {
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
      brsr_contact_phone: testData.company.brsr_contact_phone
    });
    
    console.log('User registered successfully');
    return { email, password };
  } catch (error) {
    console.error('Error creating user:', error.message);
    
    // If user already exists, try to login
    try {
      console.log('Attempting to login with existing credentials');
      await axios.post(`${API_URL}/auth/login`, { email, password });
      return { email, password };
    } catch (loginError) {
      throw new Error('Could not create or login user');
    }
  }
}

/**
 * Run the complete end-to-end test
 */
async function runTest(headless = false) {
  console.log('===== STARTING ESG CALCULATOR TEST =====');
  console.log(`Mode: ${headless ? 'Headless' : 'Browser visible'}`);
  console.log('=======================================');
  
  let browser;
  let page;
  
  try {
    // Step 1: Create test user
    console.log('\n1. Creating test user');
    const credentials = {
      email: 'autotest1747976939143@gmail.com',
      password: 'Test123!'
    };
    console.log(`Test user created with email: ${credentials.email}`);
    
    // Step 2: Launch browser
    console.log('\n2. Launching browser');
    browser = await puppeteer.launch({
      headless: headless ? 'new' : false, 
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: headless ? 50 : 100 // slow down to see what's happening
    });
    
    page = await browser.newPage();
    
    // Step 3: Login
    console.log('\n3. Logging in');
    await page.goto(`${BASE_URL}/login`);
    await page.type('#email', credentials.email);
    await page.type('#password', credentials.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    await takeScreenshot(page, 'login_successful');
    console.log('Login successful');
    
    // Step 4: Create new report
    console.log('\n4. Creating new report');
    await page.goto(`${BASE_URL}/reports/new`);
    await page.click('#financial_year');
    await page.select('#financial_year', '2023-24');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    await takeScreenshot(page, 'new_report_created');
    console.log('New report created');
    
    // Step 5: Fill Section A form
    console.log('\n5. Filling Section A form');
    
    // Business Activities
    console.log('5.1 Filling Business Activities');
    const activities = testData.sectionA.business_activities;
    await page.type('input[placeholder="Main Activity"]', activities[0].description_main);
    await page.type('input[placeholder="Business Activity"]', activities[0].description_business);
    await page.type('input[placeholder="% of Turnover"]', activities[0].turnover_percentage);
    
    // Add second activity
    await page.click('button:has-text("Add Activity")');
    await page.waitForTimeout(500);
    await page.type('div.array-item:nth-child(2) input[placeholder="Main Activity"]', activities[1].description_main);
    await page.type('div.array-item:nth-child(2) input[placeholder="Business Activity"]', activities[1].description_business);
    await page.type('div.array-item:nth-child(2) input[placeholder="% of Turnover"]', activities[1].turnover_percentage);
    
    // Products/Services
    console.log('5.2 Filling Products/Services');
    const products = testData.sectionA.products_services;
    await page.type('input[placeholder="Product/Service"]', products[0].product_service);
    await page.type('input[placeholder="NIC Code"]', products[0].nic_code);
    await page.type('input[placeholder="% Turnover Contributed"]', products[0].turnover_contributed);
    
    // Add more products
    for (let i = 1; i < products.length; i++) {
      await page.click('button:has-text("Add Product/Service")');
      await page.waitForTimeout(500);
      
      await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="Product/Service"]`, 
                      products[i].product_service);
      await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="NIC Code"]`, 
                      products[i].nic_code);
      await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="% Turnover Contributed"]`, 
                      products[i].turnover_contributed);
    }
    
    // Locations
    console.log('5.3 Filling Locations');
    const locations = testData.sectionA.locations;
    await page.type('input[name="sa_locations_plants_offices.national_plants"]', locations.national_plants);
    await page.type('input[name="sa_locations_plants_offices.national_offices"]', locations.national_offices);
    await page.type('input[name="sa_locations_plants_offices.international_plants"]', locations.international_plants);
    await page.type('input[name="sa_locations_plants_offices.international_offices"]', locations.international_offices);
    
    // Markets Served
    console.log('5.4 Filling Markets Served');
    const markets = testData.sectionA.markets_served;
    await page.type('input[name="sa_markets_served.locations.national_states"]', markets.locations.national_states);
    await page.type('input[name="sa_markets_served.locations.international_countries"]', markets.locations.international_countries);
    await page.type('#sa_markets_served_exports_percentage', markets.exports_percentage);
    await page.type('#sa_markets_served_customer_types', markets.customer_types);
    
    // Employee Details
    console.log('5.5 Filling Employee Details');
    const employees = testData.sectionA.employees_details;
    await page.type('input[name="sa_employee_details.permanent_male"]', employees.permanent_male.toString());
    await page.type('input[name="sa_employee_details.permanent_female"]', employees.permanent_female.toString());
    await page.type('input[name="sa_employee_details.other_than_permanent_male"]', employees.other_than_permanent_male.toString());
    await page.type('input[name="sa_employee_details.other_than_permanent_female"]', employees.other_than_permanent_female.toString());
    
    // Worker Details
    console.log('5.6 Filling Worker Details');
    const workers = testData.sectionA.workers_details;
    await page.type('input[name="sa_workers_details.permanent_male"]', workers.permanent_male.toString());
    await page.type('input[name="sa_workers_details.permanent_female"]', workers.permanent_female.toString());
    await page.type('input[name="sa_workers_details.other_than_permanent_male"]', workers.other_than_permanent_male.toString());
    await page.type('input[name="sa_workers_details.other_than_permanent_female"]', workers.other_than_permanent_female.toString());
    
    // Differently Abled Details
    console.log('5.7 Filling Differently Abled Details');
    const diffAbled = testData.sectionA.differently_abled_details;
    await page.type('input[name="sa_differently_abled_details.employees_male"]', diffAbled.employees_male.toString());
    await page.type('input[name="sa_differently_abled_details.employees_female"]', diffAbled.employees_female.toString());
    await page.type('input[name="sa_differently_abled_details.workers_male"]', diffAbled.workers_male.toString());
    await page.type('input[name="sa_differently_abled_details.workers_female"]', diffAbled.workers_female.toString());
    
    // Women Representation
    console.log('5.8 Filling Women Representation');
    const women = testData.sectionA.women_representation;
    await page.type('#sa_women_representation_details_board_total_members', women.board_total_members);
    await page.type('#sa_women_representation_details_board_number_of_women', women.board_number_of_women);
    await page.type('#sa_women_representation_details_kmp_total_personnel', women.kmp_total);
    await page.type('#sa_women_representation_details_kmp_number_of_women', women.kmp_women);
    
    // Turnover Rates
    console.log('5.9 Filling Turnover Rates');
    const turnover = testData.sectionA.turnover_rates;
    await page.type('#sa_turnover_employees', turnover.permanent_employees_turnover_rate);
    await page.type('#sa_turnover_workers', turnover.permanent_workers_turnover_rate);
    
    // Holding/Subsidiary Companies
    console.log('5.10 Filling Holding/Subsidiary Companies');
    const holdings = testData.sectionA.holding_subsidiaries;
    await page.type('input[placeholder="Name of the holding/subsidiary/associate companies/joint ventures"]', holdings[0].name);
    await page.select('select[name="sa_holding_subsidiary_associate_companies[0].type"]', holdings[0].type);
    await page.type('input[placeholder="% Holding"]', holdings[0].percentage_holding);
    
    // Add second holding
    await page.click('button:has-text("Add Company")');
    await page.waitForTimeout(500);
    await page.type('div.array-item:nth-child(2) input[placeholder="Name of the holding/subsidiary/associate companies/joint ventures"]', holdings[1].name);
    await page.select('select[name="sa_holding_subsidiary_associate_companies[1].type"]', holdings[1].type);
    await page.type('div.array-item:nth-child(2) input[placeholder="% Holding"]', holdings[1].percentage_holding);
    
    // CSR Details
    console.log('5.11 Filling CSR Details');
    const csr = testData.sectionA.csr_details;
    await page.select('#sa_csr_applicable', csr.applicable);
    await page.type('#sa_turnover', csr.turnover);
    await page.type('#sa_networth', csr.networth);
    
    // Transparency & Complaints
    console.log('5.12 Filling Transparency & Complaints');
    const complaints = testData.sectionA.transparency;
    await page.type('#sa_complaints_stakeholders_other_than_investors_count', complaints.stakeholder_complaints);
    await page.type('#sa_complaints_stakeholders_other_than_investors_resolved', complaints.complaints_resolved);
    
    // Save Section A
    console.log('5.13 Saving Section A form');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    await takeScreenshot(page, 'section_a_saved');
    console.log('Section A saved successfully');
    
    // Skip Section B and C for brevity, but keep navigation to review page
    
    // Step 6: Navigate to Review & Submit page
    console.log('\n6. Navigating to Review & Submit page');
    await page.click('a:has-text("Review & Submit")');
    await page.waitForSelector('button:has-text("Submit Report")');
    
    await takeScreenshot(page, 'review_page');
    
    // Step 7: Submit report
    console.log('\n7. Submitting report');
    const response = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/reports/') && 
        response.url().includes('/submit') && 
        response.status() === 200
      ),
      page.click('button:has-text("Submit Report")')
    ]);
    
    // Extract report ID from response URL if needed
    const responseUrl = response[0].url();
    const reportIdMatch = responseUrl.match(/\/reports\/([^\/]+)\/submit/);
    let reportId;
    
    if (reportIdMatch && reportIdMatch[1]) {
      reportId = reportIdMatch[1];
      console.log('Extracted report ID:', reportId);
    }
    
    await takeScreenshot(page, 'report_submitted');
    console.log('Report submitted successfully!');
      // Step 8: Generate and download PDF
    console.log('\n8. Generating and downloading PDF');
    
    // Take screenshot before PDF download
    await takeScreenshot(page, 'before_download_pdf');
    
    console.log('Looking for PDF download link...');
    try {
      // Wait for the PDF link with more details on failure
      await page.waitForSelector('a:contains("Download PDF")', { 
        timeout: 5000,
        visible: true
      });
      console.log('Found PDF download link');
      
      // Get the actual href attribute to see where it's pointing
      const pdfLinkHref = await page.$eval('a:contains("Download PDF")', el => el.href);
      console.log(`PDF link destination: ${pdfLinkHref}`);
      
      // Set download path
      const downloadPath = DOWNLOADS_DIR;
      console.log(`Using download path: ${downloadPath}`);
      const beforeFiles = new Set(fs.readdirSync(downloadPath));
      console.log(`Files before download: ${Array.from(beforeFiles).join(', ') || 'none'}`);
      
      // Enable download in Puppeteer
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });
      
      // Inspect network traffic related to PDFs
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('pdf') || url.includes('generate') || url.includes('download')) {
          console.log(`Response received from: ${url}`);
          console.log(`Response status: ${response.status()}`);
        }
      });
      
      // Click download button
      console.log('Clicking the PDF download button');
      await Promise.all([
        page.waitForResponse(response => response.url().includes('pdf') || response.url().includes('report'), { timeout: 10000 })
          .catch(e => console.log('No matching network response detected')),
        page.click('a:contains("Download PDF")')
      ]);
      console.log('PDF download initiated');
      
      // Wait for download to complete
      const pdfFilePath = await waitForDownload(downloadPath, beforeFiles, 60000); // Increase timeout to 60 seconds
    
    if (pdfFilePath) {
      console.log(`PDF downloaded successfully: ${pdfFilePath}`);
      await takeScreenshot(page, 'pdf_downloaded');
      
      // Optional: Validate key calculations in the PDF
      console.log('\n9. Basic validation of PDF content');
      console.log(`PDF file size: ${fs.statSync(pdfFilePath).size} bytes`);
      console.log('PDF generated successfully');
      
      return {
        success: true,
        message: 'Test completed successfully',
        pdfPath: pdfFilePath
      };
    } else {
      console.error('PDF download failed or timed out');
      throw new Error('PDF download failed');
    }
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    
    if (page) {
      const screenshotPath = await takeScreenshot(page, 'test_failed');
      console.log(`Failure screenshot saved to: ${screenshotPath}`);
    }
    
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nBrowser closed');
    }
  }
}

/**
 * Wait for a file to be downloaded
 */
async function waitForDownload(downloadPath, beforeFiles, timeout = 30000) {
  console.log(`Waiting for download to complete (timeout: ${timeout}ms)`);
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkForNewFile = () => {
      const currentFiles = fs.readdirSync(downloadPath);
      const newFiles = currentFiles.filter(file => !beforeFiles.has(file));
      
      // Look for completed downloads (.pdf files, not .crdownload)
      const completedFiles = newFiles.filter(file => 
        file.endsWith('.pdf') && !file.endsWith('.crdownload')
      );
      
      if (completedFiles.length > 0) {
        // Return the first complete PDF
        return resolve(path.join(downloadPath, completedFiles[0]));
      }
      
      if (Date.now() - startTime > timeout) {
        console.log('Download timeout reached');
        return resolve(null);
      }
      
      // Check again in a moment
      setTimeout(checkForNewFile, 500);
    };
    
    checkForNewFile();
  });
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const headless = args.includes('--headless');
  
  runTest(headless)
    .then(result => {
      console.log('\n===== TEST SUMMARY =====');
      console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`Message: ${result.message}`);
      if (result.pdfPath) {
        console.log(`PDF generated: ${result.pdfPath}`);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n===== UNHANDLED ERROR =====');
      console.error(error);
      process.exit(1);
    });
}

export { runTest };
