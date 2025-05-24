// formAutomation.test.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const testData = require('./testData');
const sectionAAutomation = require('./sectionAAutomation'); 

// Base URL for the application
const BASE_URL = 'http://localhost:5173';

// Set longer timeouts for the tests since we're doing full end-to-end testing
jest.setTimeout(120000); // 2 minutes

// Global variables for test user credentials
let testUserCredentials;

// Read test user credentials if available
try {
  const credentialsPath = path.join(__dirname, 'test_user_credentials.json');
  if (fs.existsSync(credentialsPath)) {
    testUserCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  } else {
    testUserCredentials = {
      email: 'autotest1747976939143@gmail.com',
      password: 'Test123!'
    };
  }
} catch (error) {
  console.warn('Failed to load test user credentials:', error);
  testUserCredentials = {
    email: 'autotest1747976939143@gmail.com',
    password: 'Test123!'
  };
};

// Test selectors for common form elements
const selectors = {
  // Authentication Selectors
  loginEmail: 'input[name="email"]',
  loginPassword: 'input[name="password"]',
  loginButton: 'button[type="submit"]',
  
  // Form Navigation
  newReportButton: 'a[href="/new-report"]',
  
  // New Report Form
  financialYearInput: 'input[name="financial_year"]',
  reportingBoundarySelect: 'select[name="reporting_boundary"]',
  startReportButton: 'button[type="submit"]',
  
  // Section A Form Selectors
  // Q14: Business Activities
  businessActivityMainInput: (index) => `input[name="sa_business_activities_turnover[${index}].description_main"]`,
  businessActivityDescInput: (index) => `input[name="sa_business_activities_turnover[${index}].description_business"]`,
  businessActivityTurnoverInput: (index) => `input[name="sa_business_activities_turnover[${index}].turnover_percentage"]`,
  addBusinessActivityBtn: 'button:contains("Add Activity")',
  
  // Q15: Products/Services
  productServiceInput: (index) => `input[name="sa_product_services_turnover[${index}].product_service"]`,
  productServiceNicInput: (index) => `input[name="sa_product_services_turnover[${index}].nic_code"]`,
  productServiceTurnoverInput: (index) => `input[name="sa_product_services_turnover[${index}].turnover_contributed"]`,
  addProductServiceBtn: 'button:contains("Add Product/Service")',
  
  // Q16: Locations
  nationalPlantsInput: 'input[name="sa_locations_plants_offices.national_plants"]',
  nationalOfficesInput: 'input[name="sa_locations_plants_offices.national_offices"]',
  internationalPlantsInput: 'input[name="sa_locations_plants_offices.international_plants"]',
  internationalOfficesInput: 'input[name="sa_locations_plants_offices.international_offices"]',
  
  // Q17: Markets Served
  nationalStatesInput: 'input[name="sa_markets_served.locations.national_states"]',
  internationalCountriesInput: 'input[name="sa_markets_served.locations.international_countries"]',
  exportsPercentageInput: 'input[name="sa_markets_served.exports_percentage"]',
  customerTypesInput: 'textarea[name="sa_markets_served.customer_types"]',
  
  // Q18: Employee and Worker Details
  employeesMaleInput: 'input[name="sa_employee_details.permanent_male"]',
  employeesFemaleInput: 'input[name="sa_employee_details.permanent_female"]',
  employeesOtherMaleInput: 'input[name="sa_employee_details.other_than_permanent_male"]',
  employeesOtherFemaleInput: 'input[name="sa_employee_details.other_than_permanent_female"]',
  
  workersMaleInput: 'input[name="sa_workers_details.permanent_male"]',
  workersFemaleInput: 'input[name="sa_workers_details.permanent_female"]',
  workersOtherMaleInput: 'input[name="sa_workers_details.other_than_permanent_male"]',
  workersOtherFemaleInput: 'input[name="sa_workers_details.other_than_permanent_female"]',
  
  diffAbledEmployeesMaleInput: 'input[name="sa_differently_abled_details.employees_male"]',
  diffAbledEmployeesFemaleInput: 'input[name="sa_differently_abled_details.employees_female"]',
  diffAbledWorkersMaleInput: 'input[name="sa_differently_abled_details.workers_male"]',
  diffAbledWorkersFemaleInput: 'input[name="sa_differently_abled_details.workers_female"]',
  
  // Q19: Women Representation
  boardTotalMembersInput: 'input[name="sa_women_representation_details.board_total_members"]',
  boardWomenInput: 'input[name="sa_women_representation_details.board_number_of_women"]',
  kmpTotalInput: 'input[name="sa_women_representation_details.kmp_total_personnel"]',
  kmpWomenInput: 'input[name="sa_women_representation_details.kmp_number_of_women"]',
  
  // Q20: Turnover Rate
  employeeTurnoverInput: 'input[id="sa_turnover_employees"]',
  workersTurnoverInput: 'input[id="sa_turnover_workers"]',
  
  // Q21: Holding/Subsidiary Companies
  holdingCompanyNameInput: (index) => `input[name="sa_holding_subsidiary_associate_companies[${index}].name"]`,
  holdingCompanyCinInput: (index) => `input[name="sa_holding_subsidiary_associate_companies[${index}].cin_or_country"]`,
  holdingCompanyTypeSelect: (index) => `select[name="sa_holding_subsidiary_associate_companies[${index}].type"]`,
  holdingCompanyPercentageInput: (index) => `input[name="sa_holding_subsidiary_associate_companies[${index}].percentage_holding"]`,
  addHoldingCompanyBtn: 'button:contains("Add Company")',
  
  // Q22: CSR
  csrApplicableCheckbox: 'input[name="sa_csr_applicable"]',
  csrTurnoverInput: 'input[name="sa_csr_turnover"]',
  csrNetWorthInput: 'input[name="sa_csr_net_worth"]',
  
  // Q23: Transparency & Complaints
  complaintsReceivedInput: 'input[name="sa_transparency_complaints.received"]',
  complaintsPendingInput: 'input[name="sa_transparency_complaints.pending"]',
  complaintsRemarksTextarea: 'textarea[name="sa_transparency_complaints.remarks"]',
  
  // Form Submission
  saveSectionAButton: 'button[type="submit"]:contains("Save Section A")'
};

/**
 * Helper function to wait for navigation after clicking
 */
const clickAndWaitForNavigation = async (page, selector) => {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click(selector)
  ]);
};

/**
 * Helper function to type text with a small delay to avoid issues
 */
const typeWithDelay = async (page, selector, text) => {
  await page.waitForSelector(selector);
  await page.focus(selector);
  await page.evaluate((sel) => document.querySelector(sel).value = '', selector); // Clear the field
  await page.type(selector, text, { delay: 50 });
};

/**
 * Helper function to select an option from a dropdown
 */
const selectOption = async (page, selector, value) => {
  await page.select(selector, value);
};

/**
 * Login to the application
 */
const login = async (page, email, password) => {
  await page.goto(`${BASE_URL}/login`);
  await typeWithDelay(page, selectors.loginEmail, email);
  await typeWithDelay(page, selectors.loginPassword, password);
  await page.click(selectors.loginButton);
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
};

/**
 * Start a new report
 */
const startNewReport = async (page) => {
  // Navigate to new report page
  await page.click(selectors.newReportButton);
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Fill the new report form
  const currentYear = new Date().getFullYear();
  await typeWithDelay(page, selectors.financialYearInput, `${currentYear}-${currentYear + 1}`);
  await selectOption(page, selectors.reportingBoundarySelect, testData.sectionA.reporting_boundary);
  await page.click(selectors.startReportButton);
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
};

/**
 * Fill Section A form with test data
 */
const fillSectionAForm = async (page) => {
  // Q13 - Reporting Boundary already handled in startNewReport function
  
  // Q14 - Business Activities
  for (let i = 0; i < testData.sectionA.business_activities.length; i++) {
    const activity = testData.sectionA.business_activities[i];
    
    if (i > 0) {
      // Need to add a new row for each activity after the first one
      await page.click(selectors.addBusinessActivityBtn);
      await page.waitForTimeout(500); // Wait for UI to update
    }
    
    // Fill in activity details
    await typeWithDelay(page, selectors.businessActivityMainInput(i), activity.description_main);
    await typeWithDelay(page, selectors.businessActivityDescInput(i), activity.description_business);
    await typeWithDelay(page, selectors.businessActivityTurnoverInput(i), activity.turnover_percentage);
  }
  
  // Q15 - Products/Services
  for (let i = 0; i < testData.sectionA.products_services.length; i++) {
    const product = testData.sectionA.products_services[i];
    
    if (i > 0) {
      // Need to add a new row for each product after the first one
      await page.click(selectors.addProductServiceBtn);
      await page.waitForTimeout(500); // Wait for UI to update
    }
    
    // Fill in product details
    await typeWithDelay(page, selectors.productServiceInput(i), product.product_service);
    await typeWithDelay(page, selectors.productServiceNicInput(i), product.nic_code);
    await typeWithDelay(page, selectors.productServiceTurnoverInput(i), product.turnover_contributed);
  }
  
  // Q16 - Locations
  await typeWithDelay(page, selectors.nationalPlantsInput, testData.sectionA.locations.national_plants.toString());
  await typeWithDelay(page, selectors.nationalOfficesInput, testData.sectionA.locations.national_offices.toString());
  await typeWithDelay(page, selectors.internationalPlantsInput, testData.sectionA.locations.international_plants.toString());
  await typeWithDelay(page, selectors.internationalOfficesInput, testData.sectionA.locations.international_offices.toString());
  
  // Q17 - Markets Served
  await typeWithDelay(page, selectors.nationalStatesInput, testData.sectionA.markets_served.locations.national_states.toString());
  await typeWithDelay(page, selectors.internationalCountriesInput, testData.sectionA.markets_served.locations.international_countries.toString());
  await typeWithDelay(page, selectors.exportsPercentageInput, testData.sectionA.markets_served.exports_percentage);
  await typeWithDelay(page, selectors.customerTypesInput, testData.sectionA.markets_served.customer_types);
  
  // Q18 - Employee and Worker Details
  // a. Employees
  await typeWithDelay(page, selectors.employeesMaleInput, testData.sectionA.employees_details.permanent_male.toString());
  await typeWithDelay(page, selectors.employeesFemaleInput, testData.sectionA.employees_details.permanent_female.toString());
  await typeWithDelay(page, selectors.employeesOtherMaleInput, testData.sectionA.employees_details.other_than_permanent_male.toString());
  await typeWithDelay(page, selectors.employeesOtherFemaleInput, testData.sectionA.employees_details.other_than_permanent_female.toString());
  
  // b. Workers
  await typeWithDelay(page, selectors.workersMaleInput, testData.sectionA.workers_details.permanent_male.toString());
  await typeWithDelay(page, selectors.workersFemaleInput, testData.sectionA.workers_details.permanent_female.toString());
  await typeWithDelay(page, selectors.workersOtherMaleInput, testData.sectionA.workers_details.other_than_permanent_male.toString());
  await typeWithDelay(page, selectors.workersOtherFemaleInput, testData.sectionA.workers_details.other_than_permanent_female.toString());
  
  // c. Differently Abled
  await typeWithDelay(page, selectors.diffAbledEmployeesMaleInput, testData.sectionA.differently_abled_details.employees_male.toString());
  await typeWithDelay(page, selectors.diffAbledEmployeesFemaleInput, testData.sectionA.differently_abled_details.employees_female.toString());
  await typeWithDelay(page, selectors.diffAbledWorkersMaleInput, testData.sectionA.differently_abled_details.workers_male.toString());
  await typeWithDelay(page, selectors.diffAbledWorkersFemaleInput, testData.sectionA.differently_abled_details.workers_female.toString());
  
  // Q19 - Women Representation
  await typeWithDelay(page, selectors.boardTotalMembersInput, testData.sectionA.women_representation.board_total_members.toString());
  await typeWithDelay(page, selectors.boardWomenInput, testData.sectionA.women_representation.board_number_of_women.toString());
  await typeWithDelay(page, selectors.kmpTotalInput, testData.sectionA.women_representation.kmp_total_personnel.toString());
  await typeWithDelay(page, selectors.kmpWomenInput, testData.sectionA.women_representation.kmp_number_of_women.toString());
  
  // Q20 - Turnover Rate
  await typeWithDelay(page, selectors.employeeTurnoverInput, testData.sectionA.turnover_rates.permanent_employees_turnover_rate);
  await typeWithDelay(page, selectors.workersTurnoverInput, testData.sectionA.turnover_rates.permanent_workers_turnover_rate);
  
  // Q21 - Holding/Subsidiary Companies
  for (let i = 0; i < testData.sectionA.holding_subsidiary_companies.length; i++) {
    const company = testData.sectionA.holding_subsidiary_companies[i];
    
    if (i > 0) {
      // Need to add a new row for each company after the first one
      await page.click(selectors.addHoldingCompanyBtn);
      await page.waitForTimeout(500); // Wait for UI to update
    }
    
    // Fill in company details
    await typeWithDelay(page, selectors.holdingCompanyNameInput(i), company.name);
    await typeWithDelay(page, selectors.holdingCompanyCinInput(i), company.cin_or_country);
    await selectOption(page, selectors.holdingCompanyTypeSelect(i), company.type);
    await typeWithDelay(page, selectors.holdingCompanyPercentageInput(i), company.percentage_holding);
  }
  
  // Q22 - CSR
  if (testData.sectionA.csr.applicable) {
    await page.click(selectors.csrApplicableCheckbox);
    await page.waitForTimeout(500); // Wait for UI to update
    
    await typeWithDelay(page, selectors.csrTurnoverInput, testData.sectionA.csr.turnover);
    await typeWithDelay(page, selectors.csrNetWorthInput, testData.sectionA.csr.net_worth);
  }
  
  // Q23 - Transparency & Complaints
  await typeWithDelay(page, selectors.complaintsReceivedInput, testData.sectionA.transparency_complaints.received.toString());
  await typeWithDelay(page, selectors.complaintsPendingInput, testData.sectionA.transparency_complaints.pending.toString());
  await typeWithDelay(page, selectors.complaintsRemarksTextarea, testData.sectionA.transparency_complaints.remarks);
  
  // Submit the form
  await page.click(selectors.saveSectionAButton);
  await page.waitForTimeout(2000); // Wait for form submission to complete
};

// Main Test Scenarios
describe('ESG Calculator Automated Form Filling', () => {
  let browser;
  let page;
    beforeAll(async () => {
    // Configure browser based on environment (headless or visible)
    const isHeadless = process.env.HEADLESS === 'true';
    console.log(`Running in ${isHeadless ? 'headless' : 'visible'} mode`);
    
    browser = await puppeteer.launch({
      headless: isHeadless,
      slowMo: isHeadless ? 50 : 100, // Faster in headless mode
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(30000); // 30 seconds timeout
    
    // Enable console logs from the browser
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
  });
  
  afterAll(async () => {
    console.log('Closing browser...');
    if (browser) {
      await browser.close();
    }
  });
    test('Login and fill Section A form with NALCO test data', async () => {
    try {
      // Use the comprehensive sectionAAutomation module for Section A
      const result = await sectionAAutomation.fillSectionAComplete(page, testUserCredentials);
      
      // Verify success
      expect(result).toBe(true);
      
      // Additional assertions could be added here
      const successMessage = await page.$eval('.success-message', el => el.textContent);
      expect(successMessage).toContain('saved successfully');
    } catch (error) {
      console.error('Test failed with error:', error);
      // Take screenshot on failure
      await page.screenshot({ path: `test-failure-${Date.now()}.png` });
      throw error;
    }
  }, 120000); // 2-minute timeout for this test
  
  test('Fill Section A form components individually', async () => {
    try {
      // Login with test user
      await sectionAAutomation.loginTestUser(page, testUserCredentials);
      
      // Create a new report
      await sectionAAutomation.createNewReport(page);
      
      // Test each section individually
      await sectionAAutomation.fillBusinessActivities(page);
      await sectionAAutomation.fillProductsServices(page);
      await sectionAAutomation.fillLocations(page);
      await sectionAAutomation.fillMarketsServed(page);
      await sectionAAutomation.fillEmployeeWorkerDetails(page);
      await sectionAAutomation.fillWomenRepresentation(page);
      await sectionAAutomation.fillTurnoverRates(page);
      await sectionAAutomation.fillHoldingSubsidiaryCompanies(page);
      await sectionAAutomation.fillCSRDetails(page);
      await sectionAAutomation.fillTransparencyComplaints(page);
      
      // Save the form
      const result = await sectionAAutomation.saveSectionA(page);
      expect(result).toBe(true);
    } catch (error) {
      console.error('Test failed with error:', error);
      // Take screenshot on failure
      await page.screenshot({ path: `test-section-a-components-${Date.now()}.png` });
      throw error;
    }
  }, 180000); // 3-minute timeout for this detailed test
});

// Additional test scenarios for other form sections will be added in future updates
