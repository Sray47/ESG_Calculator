// reportAutomation.js
// Automated script to login and generate a new report for a new financial year using Puppeteer and testData.js
const puppeteer = require('puppeteer');
const testData = require('./testData');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    // 1. Login
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[name="email"]', testData.auth.email);
    await page.type('input[name="password"]', testData.auth.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 2. Go to New Report page
    await page.goto('http://localhost:5173/new-report', { waitUntil: 'networkidle0' });
    // Fill financial year (use next year to ensure uniqueness)
    const currentYear = new Date().getFullYear();
    const fy = `${currentYear}-${currentYear + 1}`;
    await page.type('input[name="financial_year"]', fy);
    await page.select('select[name="reporting_boundary"]', testData.sectionA.reporting_boundary);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 3. Screenshot the wizard landing page
    await page.screenshot({ path: 'report_wizard_landing.png' });
    console.log('Report creation attempted for financial year:', fy);
  } catch (err) {
    console.error('Report automation failed:', err);
    await page.screenshot({ path: 'report_failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
