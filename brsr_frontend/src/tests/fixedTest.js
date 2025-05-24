// fixedTest.js
// A fixed version of the simplified test script focusing on PDF generation
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

// Sample test data - simplified version
const testData = {
  // Sample test data for user and form
  // (standard test data goes here)
  user: {
    email: "autotest1747976939143@gmail.com",
    password: "Test123!"
  },
  company: {
    name: "ESG Test Company",
    cin: "U12345AB6789CDE012345",
    year_of_incorporation: "2010"
  },
  sectionA: {
    employees_details: {
      permanent_male: 2500,
      permanent_female: 1200,
      other_than_permanent_male: 800,
      other_than_permanent_female: 400
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

/**
 * Wait for a file to be downloaded
 */
async function waitForDownload(downloadPath, beforeFiles, timeout = 60000) {
  console.log(`Waiting for download to complete (timeout: ${timeout}ms)`);
  console.log(`Watching directory: ${downloadPath}`);
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkForNewFile = () => {
      try {
        // List current files
        const currentFiles = fs.readdirSync(downloadPath);
        console.log(`Current files in directory: ${currentFiles.join(', ') || 'none'}`);
        
        // Find new files
        const newFiles = currentFiles.filter(file => !beforeFiles.has(file));
        console.log(`New files detected: ${newFiles.join(', ') || 'none'}`);
        
        // Look for completed PDFs
        const completedFiles = newFiles.filter(file => 
          file.endsWith('.pdf') && !file.endsWith('.crdownload')
        );
        console.log(`Completed PDFs: ${completedFiles.join(', ') || 'none'}`);
        
        if (completedFiles.length > 0) {
          // Return the first complete PDF
          const filePath = path.join(downloadPath, completedFiles[0]);
          console.log(`Found downloaded PDF: ${filePath}`);
          return resolve(filePath);
        }
        
        if (Date.now() - startTime > timeout) {
          console.log('Download timeout reached');
          return resolve(null);
        }
        
        // Check again in a moment
        setTimeout(checkForNewFile, 1000); // Check every second
      } catch (error) {
        console.error('Error checking for downloads:', error);
        if (Date.now() - startTime > timeout) {
          return resolve(null);
        }
        setTimeout(checkForNewFile, 1000);
      }
    };
    
    checkForNewFile();
  });
}

/**
 * Run just the PDF generation part of the test
 */
async function testPdfGeneration() {
  console.log('===== STARTING PDF GENERATION TEST =====');
  
  let browser;
  let page;
  
  try {
    // Step 1: Launch browser in visible mode for debugging
    console.log('\n1. Launching browser');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 100
    });
    
    page = await browser.newPage();
    
    // Set up network request monitoring
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('pdf') || url.includes('report')) {
        console.log(`Network response from: ${url}`);
        console.log(`Status: ${response.status()}`);
        try {
          if (response.status() !== 200) {
            const text = await response.text();
            console.log(`Response body: ${text.substring(0, 200)}...`);
          }
        } catch (e) {
          console.log('Could not get response body');
        }
      }
    });
    
    // Step 2: Login directly
    console.log('\n2. Logging in');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('#email');
    await page.type('#email', testData.user.email);
    await page.type('#password', testData.user.password);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    await takeScreenshot(page, 'login_screen');
    console.log('Login attempted');
    
    // Step 3: Create a new report (or go to existing report)
    console.log('\n3. Navigating to reports');
    
    // Option 1: Go to previous reports page to look for existing reports
    await page.goto(`${BASE_URL}/reports`);
    await takeScreenshot(page, 'reports_page');
    
    // Check if there are any existing reports we can use
    const hasExistingReports = await page.evaluate(() => {
      return !!document.querySelector('table tr td a');
    });
    
    if (hasExistingReports) {
      console.log('Found existing reports, opening the first one');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('table tr td a') // Click on the first report link
      ]);
    } else {
      console.log('No existing reports found, creating a new one');
      // Create new report
      await page.goto(`${BASE_URL}/reports/new`);
      await page.select('#financial_year', '2023-24');
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);
      
      // Fill at least section A with minimal data and save
      console.log('Filling minimal section A data');
      await page.type('input[name="sa_employee_details.permanent_male"]', 
                      testData.sectionA.employees_details.permanent_male.toString());
      await page.type('input[name="sa_employee_details.permanent_female"]', 
                      testData.sectionA.employees_details.permanent_female.toString());
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);
    }
    
    // Step 4: Navigate to Review & Submit page
    console.log('\n4. Navigating to Review & Submit page');
    await page.waitForSelector('a:has-text("Review & Submit")');
    await page.click('a:has-text("Review & Submit")');
    await page.waitForSelector('button:has-text("Submit Report")');
    
    await takeScreenshot(page, 'review_submit_page');
    
    // Check if report is already submitted
    const isSubmitted = await page.evaluate(() => {
      return document.body.innerText.includes('Report Status: Submitted');
    });
    
    if (!isSubmitted) {
      // Submit the report if not already submitted
      console.log('\n5. Submitting report');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button:has-text("Submit Report")')
      ]);
      console.log('Report submitted');
    } else {
      console.log('\n5. Report is already submitted');
    }
    
    // Step 6: Generate and download PDF
    console.log('\n6. Generating and downloading PDF');
    await takeScreenshot(page, 'before_pdf_download');
    
    // Check if PDF download link exists
    console.log('Looking for PDF download link...');
    const pdfLinkExists = await page.evaluate(() => {
      return !!document.querySelector('a[href*="pdf"]') || 
             !!document.querySelector('a:has-text("Download PDF")');
    });
    
    if (!pdfLinkExists) {
      console.error('PDF download link not found');
      await takeScreenshot(page, 'pdf_link_missing');
      throw new Error('PDF download link not found on the page');
    }
    
    console.log('Found PDF download link');
    
    // Get the PDF link from the page
    const pdfLink = await page.evaluate(() => {
      const link = document.querySelector('a[href*="pdf"]') || 
                   document.querySelector('a:has-text("Download PDF")');
      return link ? link.href : null;
    });
    
    console.log(`PDF link URL: ${pdfLink}`);
    
    // Set up download behavior
    const downloadPath = DOWNLOADS_DIR;
    const beforeFiles = new Set(fs.readdirSync(downloadPath));
    console.log(`Files before download: ${Array.from(beforeFiles).join(', ') || 'none'}`);
    
    // Configure CDP session for downloads
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });
    
    // Alternative direct API approach
    console.log('\nTrying direct API download...');
    
    // Get auth token from browser to use in API call
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    
    if (token) {
      try {
        // Extract report ID from URL
        const currentUrl = page.url();
        const reportIdMatch = currentUrl.match(/\/reports\/([^\/]+)/);
        const reportId = reportIdMatch ? reportIdMatch[1] : null;
        
        if (reportId) {
          console.log(`Found report ID: ${reportId}, attempting direct API download`);
          
          // Make API request to generate PDF
          const pdfResponse = await axios.get(
            `${API_URL}/reports/${reportId}/pdf`, 
            {
              headers: { Authorization: `Bearer ${token}` },
              responseType: 'arraybuffer'
            }
          );
          
          // Save the PDF directly
          const pdfFileName = `report_${reportId}_${Date.now()}.pdf`;
          const pdfFilePath = path.join(downloadPath, pdfFileName);
          fs.writeFileSync(pdfFilePath, pdfResponse.data);
          
          console.log(`PDF directly saved to: ${pdfFilePath}`);
          console.log(`PDF file size: ${fs.statSync(pdfFilePath).size} bytes`);
          
          return {
            success: true,
            message: 'PDF generated and saved successfully via direct API',
            pdfPath: pdfFilePath
          };
        }
      } catch (apiError) {
        console.error('Direct API download failed:', apiError.message);
        console.log('Falling back to browser download...');
      }
    }
    
    // Click the download button in the browser
    console.log('\nTrying browser download...');
    await page.click('a:has-text("Download PDF")');
    console.log('Clicked PDF download button');
    
    // Wait for download to complete
    const pdfFilePath = await waitForDownload(downloadPath, beforeFiles, 60000);
    
    if (pdfFilePath) {
      console.log(`PDF downloaded successfully: ${pdfFilePath}`);
      console.log(`PDF file size: ${fs.statSync(pdfFilePath).size} bytes`);
      
      return {
        success: true,
        message: 'PDF generated and downloaded successfully',
        pdfPath: pdfFilePath
      };
    } else {
      throw new Error('PDF download failed or timed out');
    }
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}`);
    
    if (page) {
      const screenshotPath = await takeScreenshot(page, 'test_failure');
      console.log(`Failure screenshot saved to: ${screenshotPath}`);
    }
    
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  } finally {
    // Keep the browser open for debugging
    console.log('\nKeeping browser open for debugging. Close it manually when done.');
    // if (browser) {
    //   await browser.close();
    //   console.log('Browser closed');
    // }
  }
}

// Run the test
testPdfGeneration()
  .then(result => {
    console.log('\n===== TEST SUMMARY =====');
    console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Message: ${result.message}`);
    if (result.pdfPath) {
      console.log(`PDF generated: ${result.pdfPath}`);
    }
  })
  .catch(error => {
    console.error('\n===== UNHANDLED ERROR =====');
    console.error(error);
  });

export { testPdfGeneration };
