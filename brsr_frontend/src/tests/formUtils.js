// formUtils.js

/**
 * Utility functions to assist with automated form testing
 */

/**
 * Waits for an element to be visible on the page
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<ElementHandle>} - The element handle
 */
const waitForElement = async (page, selector, timeout = 10000) => {
  await page.waitForSelector(selector, { visible: true, timeout });
  return await page.$(selector);
};

/**
 * Takes a screenshot of the current page state
 * @param {Page} page - Puppeteer page object
 * @param {string} name - Name for the screenshot file
 */
const takeScreenshot = async (page, name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `./screenshots/${name}_${timestamp}.png`,
    fullPage: true 
  });
};

/**
 * Types text into an input field with error handling
 * @param {Page} page - Puppeteer page object
 * @param {string} selector - CSS selector for the input field
 * @param {string} text - Text to type
 * @param {Object} options - Additional options
 */
const typeText = async (page, selector, text, options = {}) => {
  try {
    const element = await waitForElement(page, selector);
    await element.click({ clickCount: 3 }); // Select all existing text
    await element.press('Backspace'); // Clear the field
    await page.type(selector, text, { delay: options.delay || 50 });
  } catch (error) {
    console.error(`Failed to type text into ${selector}:`, error);
    await takeScreenshot(page, `type_error_${selector.replace(/[^a-zA-Z0-9]/g, '_')}`);
    throw error;
  }
};

/**
 * Fills a form based on a mapping of selectors to values
 * @param {Page} page - Puppeteer page object
 * @param {Object} formData - Object mapping selectors to values
 */
const fillForm = async (page, formData) => {
  for (const [selector, value] of Object.entries(formData)) {
    if (typeof value === 'boolean') {
      // Handle checkboxes
      const checked = await page.$eval(selector, el => el.checked);
      if (checked !== value) {
        await page.click(selector);
      }
    } else if (typeof value === 'string' || typeof value === 'number') {
      // Handle text inputs, textareas, and select elements
      const tagName = await page.$eval(selector, el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await page.select(selector, value.toString());
      } else {
        await typeText(page, selector, value.toString());
      }
    }
    
    // Add a small delay between form field interactions
    await page.waitForTimeout(100);
  }
};

/**
 * Waits for form submission to complete by monitoring network activity
 * @param {Page} page - Puppeteer page object
 * @param {Function} submitAction - Function that triggers the form submission
 * @param {string} waitForUrl - Optional URL pattern to wait for after submission
 */
const submitFormAndWait = async (page, submitAction, waitForUrl = null) => {
  // Create a promise that resolves when network is idle
  const networkIdlePromise = page.waitForNavigation({ 
    waitUntil: 'networkidle0',
    timeout: 30000 
  }).catch(() => {
    // Sometimes forms don't cause navigation, so we'll continue anyway
    console.log('Navigation timeout occurred, continuing test');
  });
  
  // Execute the submit action (e.g., clicking a button)
  await submitAction();
  
  // Wait for navigation to complete
  await networkIdlePromise;
  
  // If a specific URL is provided, wait until we reach that URL
  if (waitForUrl) {
    await page.waitForFunction(
      url => window.location.href.includes(url),
      { timeout: 10000 },
      waitForUrl
    );
  }
  
  // Give the page a moment to settle
  await page.waitForTimeout(1000);
};

/**
 * Creates and adds a dynamic row (e.g., for repeating form sections)
 * @param {Page} page - Puppeteer page object
 * @param {string} addButtonSelector - Selector for the "add row" button
 * @param {Function} fillRowFn - Function to fill the newly added row
 */
const addAndFillDynamicRow = async (page, addButtonSelector, fillRowFn) => {
  // Get current number of rows
  const rowCountBefore = await page.evaluate((selector) => {
    const addButton = document.querySelector(selector);
    // Find the parent container and count existing rows
    const container = addButton.parentElement;
    return container.querySelectorAll('.array-item').length;
  }, addButtonSelector);
  
  // Click the "add" button
  await page.click(addButtonSelector);
  
  // Wait for the new row to appear
  await page.waitForFunction(
    (selector, expectedCount) => {
      const addButton = document.querySelector(selector);
      const container = addButton.parentElement;
      return container.querySelectorAll('.array-item').length === expectedCount;
    },
    { timeout: 5000 },
    addButtonSelector,
    rowCountBefore + 1
  );
  
  // Fill the new row
  await fillRowFn(rowCountBefore);
};

module.exports = {
  waitForElement,
  takeScreenshot,
  typeText,
  fillForm,
  submitFormAndWait,
  addAndFillDynamicRow
};
