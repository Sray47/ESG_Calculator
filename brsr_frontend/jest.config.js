// jest.config.js
const config = {
  preset: 'jest-puppeteer',
  testRegex: './*\\.test\\.js$',
  testEnvironment: 'node',
  // Increase test timeout for Puppeteer operations
  testTimeout: 30000,
};

module.exports = config;
