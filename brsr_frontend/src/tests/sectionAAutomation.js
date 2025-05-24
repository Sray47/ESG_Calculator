// sectionAAutomation.js
const { waitForElement, takeScreenshot, typeText, fillForm, submitFormAndWait, addAndFillDynamicRow } = require('./formUtils');
const testData = require('./testData');

/**
 * This module contains functions to automate filling the Section A form
 * with sample data from NALCO's BRSR report
 */

/**
 * Logs into the application using test credentials
 * @param {Page} page - Puppeteer page object
 * @param {Object} credentials - User credentials (email and password)
 */
async function loginTestUser(page, credentials) {
  console.log('Logging in test user...');
  
  // Navigate to login page
  await page.goto('http://localhost:5173/login');
  
  // Fill login form
  await page.type('input[name="email"]', credentials.email);
  await page.type('input[name="password"]', credentials.password);
  
  // Submit login form
  await submitFormAndWait(page, async () => {
    await page.click('button[type="submit"]');
  });
  
  // Verify login success
  const profileText = await page.$eval('.profile-header', el => el.textContent);
  if (!profileText.includes('Welcome')) {
    throw new Error('Login failed: Unable to reach profile page');
  }
  
  console.log('Login successful!');
  
  // Take screenshot of profile page
  await takeScreenshot(page, 'profile_page');
}

/**
 * Creates a new report from the profile page
 * @param {Page} page - Puppeteer page object
 */
async function createNewReport(page) {
  console.log('Creating a new BRSR report...');
  
  // Navigate to new report page
  await page.click('a[href="/new-report"]');
  await page.waitForSelector('form', { visible: true });
  
  // Fill in report details
  const currentYear = new Date().getFullYear();
  await page.type('input[name="financial_year"]', `${currentYear-1}-${currentYear}`);
  await page.select('select[name="reporting_boundary"]', testData.sectionA.reporting_boundary);
  
  // Submit the form
  await submitFormAndWait(page, async () => {
    await page.click('button[type="submit"]');
  });
  
  // Verify we're in the report wizard
  await page.waitForSelector('.report-wizard-container', { visible: true });
  
  console.log('New report created successfully!');
  await takeScreenshot(page, 'new_report_created');
}

/**
 * Fills the Business Activities & Turnover section (Q14)
 * @param {Page} page - Puppeteer page object 
 */
async function fillBusinessActivities(page) {
  console.log('Filling Business Activities & Turnover (Q14)...');
  
  // Clear any existing items in the array
  const existingItemsCount = await page.evaluate(() => {
    return document.querySelectorAll('.array-item').length;
  });
  
  // Remove existing items if any (except the first one which we'll overwrite)
  for (let i = existingItemsCount - 1; i > 0; i--) {
    await page.click(`.array-item:nth-child(${i+1}) button`);
    await page.waitForTimeout(300);
  }
  
  // Fill the first business activity (which already exists in the form)
  const firstActivity = testData.sectionA.business_activities[0];
  await page.type('input[placeholder="Main Activity"]', firstActivity.description_main);
  await page.type('input[placeholder="Business Activity"]', firstActivity.description_business);
  await page.type('input[placeholder="% of Turnover"]', firstActivity.turnover_percentage);
  
  // Add and fill additional business activities
  for (let i = 1; i < testData.sectionA.business_activities.length; i++) {
    const activity = testData.sectionA.business_activities[i];
    
    // Click the "Add Activity" button
    await page.click('button:contains("Add Activity")');
    await page.waitForTimeout(500);
    
    // Fill the new fields
    await page.type(`div.array-item:nth-child(${i+1}) input[placeholder="Main Activity"]`, activity.description_main);
    await page.type(`div.array-item:nth-child(${i+1}) input[placeholder="Business Activity"]`, activity.description_business);
    await page.type(`div.array-item:nth-child(${i+1}) input[placeholder="% of Turnover"]`, activity.turnover_percentage);
  }
  
  console.log('Business Activities filled successfully!');
}

/**
 * Fills the Products/Services section (Q15)
 * @param {Page} page - Puppeteer page object
 */
async function fillProductsServices(page) {
  console.log('Filling Products/Services (Q15)...');
  
  // Handle similar to the business activities
  const existingItemsCount = await page.evaluate(() => {
    return document.querySelectorAll('h4:contains("Products/Services & Turnover") + div.array-item').length;
  });
  
  // Remove existing items if any (except the first one which we'll overwrite)
  for (let i = existingItemsCount - 1; i > 0; i--) {
    const selector = `h4:contains("Products/Services & Turnover") + div.array-item:nth-child(${i+2}) button`;
    await page.click(selector);
    await page.waitForTimeout(300);
  }
  
  // Fill the first product/service
  const firstProduct = testData.sectionA.products_services[0];
  await page.type('input[placeholder="Product/Service"]', firstProduct.product_service);
  await page.type('input[placeholder="NIC Code"]', firstProduct.nic_code);
  await page.type('input[placeholder="% Turnover Contributed"]', firstProduct.turnover_contributed);
  
  // Add and fill additional products/services
  for (let i = 1; i < testData.sectionA.products_services.length; i++) {
    const product = testData.sectionA.products_services[i];
    
    // Click the "Add Product/Service" button
    await page.click('button:contains("Add Product/Service")');
    await page.waitForTimeout(500);
    
    // Fill the new fields
    await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="Product/Service"]`, product.product_service);
    await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="NIC Code"]`, product.nic_code);
    await page.type(`h4:contains("Products/Services") ~ div.array-item:nth-child(${i+2}) input[placeholder="% Turnover Contributed"]`, product.turnover_contributed);
  }
  
  console.log('Products/Services filled successfully!');
}

/**
 * Fills the Locations section (Q16)
 * @param {Page} page - Puppeteer page object
 */
async function fillLocations(page) {
  console.log('Filling Locations (Q16)...');
  
  const locations = testData.sectionA.locations;
  
  // Fill each field
  await page.evaluate((locations) => {
    document.querySelector('input[name="sa_locations_plants_offices.national_plants"]').value = locations.national_plants;
    document.querySelector('input[name="sa_locations_plants_offices.national_offices"]').value = locations.national_offices;
    document.querySelector('input[name="sa_locations_plants_offices.international_plants"]').value = locations.international_plants;
    document.querySelector('input[name="sa_locations_plants_offices.international_offices"]').value = locations.international_offices;
  }, locations);
  
  // Dispatch input events to trigger React state updates
  await page.type('input[name="sa_locations_plants_offices.national_plants"]', locations.national_plants.toString());
  await page.type('input[name="sa_locations_plants_offices.national_offices"]', locations.national_offices.toString());
  await page.type('input[name="sa_locations_plants_offices.international_plants"]', locations.international_plants.toString());
  await page.type('input[name="sa_locations_plants_offices.international_offices"]', locations.international_offices.toString());
  
  console.log('Locations filled successfully!');
}

/**
 * Fills the Markets Served section (Q17)
 * @param {Page} page - Puppeteer page object
 */
async function fillMarketsServed(page) {
  console.log('Filling Markets Served (Q17)...');
  
  const markets = testData.sectionA.markets_served;
  
  // Fill national and international locations
  await page.type('input[name="sa_markets_served.locations.national_states"]', markets.locations.national_states.toString());
  await page.type('input[name="sa_markets_served.locations.international_countries"]', markets.locations.international_countries.toString());
  
  // Fill exports percentage
  await page.type('#sa_markets_served_exports_percentage', markets.exports_percentage);
  
  // Fill customer types
  await page.type('#sa_markets_served_customer_types', markets.customer_types);
  
  console.log('Markets Served filled successfully!');
}

/**
 * Fills the Employee and Worker Details section (Q18)
 * @param {Page} page - Puppeteer page object
 */
async function fillEmployeeWorkerDetails(page) {
  console.log('Filling Employee and Worker Details (Q18)...');
  
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
  
  console.log('Employee and Worker Details filled successfully!');
  await takeScreenshot(page, 'employee_worker_details');
}

/**
 * Fills the Women Representation section (Q19)
 * @param {Page} page - Puppeteer page object
 */
async function fillWomenRepresentation(page) {
  console.log('Filling Women Representation (Q19)...');
  
  const women = testData.sectionA.women_representation;
  
  // Fill board representation
  await page.type('input[name="sa_women_representation_details.board_total_members"]', women.board_total_members.toString());
  await page.type('input[name="sa_women_representation_details.board_number_of_women"]', women.board_number_of_women.toString());
  
  // Fill KMP representation
  await page.type('input[name="sa_women_representation_details.kmp_total_personnel"]', women.kmp_total_personnel.toString());
  await page.type('input[name="sa_women_representation_details.kmp_number_of_women"]', women.kmp_number_of_women.toString());
  
  console.log('Women Representation filled successfully!');
}

/**
 * Fills the Turnover Rate section (Q20)
 * @param {Page} page - Puppeteer page object
 */
async function fillTurnoverRates(page) {
  console.log('Filling Turnover Rates (Q20)...');
  
  const turnover = testData.sectionA.turnover_rates;
  
  // Fill turnover rates
  await page.type('#sa_turnover_employees', turnover.permanent_employees_turnover_rate);
  await page.type('#sa_turnover_workers', turnover.permanent_workers_turnover_rate);
  
  console.log('Turnover Rates filled successfully!');
}

/**
 * Fills the Holding/Subsidiary Companies section (Q21)
 * @param {Page} page - Puppeteer page object
 */
async function fillHoldingSubsidiaryCompanies(page) {
  console.log('Filling Holding/Subsidiary Companies (Q21)...');
  
  const companies = testData.sectionA.holding_subsidiary_companies;
  
  // Handle similar to business activities
  const existingItemsCount = await page.evaluate(() => {
    return document.querySelectorAll('h4:contains("Holding, Subsidiary") ~ div.array-item').length;
  });
  
  // Remove existing items if any
  for (let i = existingItemsCount - 1; i >= 0; i--) {
    const selector = `h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) button`;
    await page.click(selector).catch(() => console.log('No remove button found for item', i));
    await page.waitForTimeout(300);
  }
  
  // Add and fill companies
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    
    // Click the "Add Company" button
    await page.click('button:contains("Add Company")');
    await page.waitForTimeout(500);
    
    // Fill the new fields
    await page.type(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) input[placeholder="Company Name"]`, company.name);
    await page.type(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) input[placeholder="CIN / Country"]`, company.cin_or_country);
    await page.select(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) select`, company.type);
    await page.type(`h4:contains("Holding, Subsidiary") ~ div.array-item:nth-child(${i+1}) input[placeholder="% Holding"]`, company.percentage_holding);
  }
  
  console.log('Holding/Subsidiary Companies filled successfully!');
}

/**
 * Fills the CSR Details section (Q22)
 * @param {Page} page - Puppeteer page object
 */
async function fillCSRDetails(page) {
  console.log('Filling CSR Details (Q22)...');
  
  const csr = testData.sectionA.csr;
  
  // Check/uncheck CSR applicable checkbox
  const isChecked = await page.$eval('input[name="sa_csr_applicable"]', el => el.checked);
  if (isChecked !== csr.applicable) {
    await page.click('input[name="sa_csr_applicable"]');
    await page.waitForTimeout(500);
  }
  
  if (csr.applicable) {
    // Fill CSR turnover and net worth
    await page.type('#sa_csr_turnover', csr.turnover);
    await page.type('#sa_csr_net_worth', csr.net_worth);
  }
  
  console.log('CSR Details filled successfully!');
}

/**
 * Fills the Transparency & Complaints section (Q23)
 * @param {Page} page - Puppeteer page object
 */
async function fillTransparencyComplaints(page) {
  console.log('Filling Transparency & Complaints (Q23)...');
  
  const complaints = testData.sectionA.transparency_complaints;
  
  // Fill complaints received and pending
  await page.type('input[name="sa_transparency_complaints.received"]', complaints.received.toString());
  await page.type('input[name="sa_transparency_complaints.pending"]', complaints.pending.toString());
  
  // Fill remarks
  await page.type('#sa_transparency_complaints_remarks', complaints.remarks);
  
  console.log('Transparency & Complaints filled successfully!');
}

/**
 * Saves the Section A form
 * @param {Page} page - Puppeteer page object
 */
async function saveSectionA(page) {
  console.log('Saving Section A form...');
  
  // Scroll to bottom of form
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  // Click the save button
  await submitFormAndWait(page, async () => {
    await page.click('button:contains("Save Section A")');
  });
  
  // Check for success message
  const successMessage = await page.evaluate(() => {
    const el = document.querySelector('p.success-message');
    return el ? el.textContent : null;
  });
  
  if (successMessage && successMessage.includes('saved successfully')) {
    console.log('Section A saved successfully!');
    await takeScreenshot(page, 'section_a_saved');
    return true;
  } else {
    console.error('Failed to save Section A form');
    await takeScreenshot(page, 'section_a_save_error');
    return false;
  }
}

/**
 * Complete automation of filling Section A
 * @param {Page} page - Puppeteer page object
 * @param {Object} credentials - User login credentials
 */
async function fillSectionAComplete(page, credentials) {
  try {
    // Login and create report
    await loginTestUser(page, credentials);
    await createNewReport(page);
    
    // Fill all sections of Form A
    await fillBusinessActivities(page);
    await fillProductsServices(page);
    await fillLocations(page);
    await fillMarketsServed(page);
    await fillEmployeeWorkerDetails(page);
    await fillWomenRepresentation(page);
    await fillTurnoverRates(page);
    await fillHoldingSubsidiaryCompanies(page);
    await fillCSRDetails(page);
    await fillTransparencyComplaints(page);
    
    // Save the form
    const saved = await saveSectionA(page);
    return saved;
  } catch (error) {
    console.error('Error in filling Section A:', error);
    await takeScreenshot(page, 'section_a_error');
    throw error;
  }
}

module.exports = {
  loginTestUser,
  createNewReport,
  fillBusinessActivities,
  fillProductsServices,
  fillLocations,
  fillMarketsServed,
  fillEmployeeWorkerDetails,
  fillWomenRepresentation,
  fillTurnoverRates,
  fillHoldingSubsidiaryCompanies,
  fillCSRDetails,
  fillTransparencyComplaints,
  saveSectionA,
  fillSectionAComplete
};
