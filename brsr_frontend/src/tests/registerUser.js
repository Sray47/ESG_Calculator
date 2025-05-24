// registerUser.js
// Automated script to register a new user using Puppeteer and testData.js
const puppeteer = require('puppeteer');
const testData = require('./testData');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
    // Fill only required fields for registration
    await page.type('input[name="email"]', testData.auth.email);
    await page.type('input[name="password"]', testData.auth.password);
    await page.type('input[name="confirmPassword"]', testData.auth.password);
    // If your registration form requires company name, fill it
    if (await page.$('input[name="company_name"]')) {
      await page.type('input[name="company_name"]', testData.company.name);
    }
    // Submit the form
    await page.click('button[type="submit"]');
    // Wait for navigation or confirmation message
    await page.waitForTimeout(3000);
    // Screenshot for confirmation
    await page.screenshot({ path: 'register_success.png' });
    console.log('User registration attempted. Please confirm the email manually if required.');
  } catch (err) {
    console.error('Registration automation failed:', err);
    await page.screenshot({ path: 'register_failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
