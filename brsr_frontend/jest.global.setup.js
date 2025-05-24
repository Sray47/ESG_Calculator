// jest.global.setup.js
const { setup: setupPuppeteer } = require('jest-puppeteer');

module.exports = async () => {
  // Setup puppeteer with headless mode
  process.env.PUPPETEER_HEADLESS = 'true';
  
  // Call default jest-puppeteer setup
  await setupPuppeteer();
};
