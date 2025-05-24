// jest-puppeteer.config.js
module.exports = {
  launch: {
    headless: false, // Set to true for production, false for development to see browser automation
    slowMo: 100, // Slows down Puppeteer operations by 100ms for better visibility
    defaultViewport: null, // For better visibility, use the default viewport of the browser
    args: ['--start-maximized'], // Start with maximized window
  },
  browserContext: 'default',
};
