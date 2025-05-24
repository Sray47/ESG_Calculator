// jest.config.headless.js
// Configuration for running tests in headless mode

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  preset: 'jest-puppeteer',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 120000,
  testMatch: ['**/*.test.js'],
  verbose: true,
  // Override puppeteer config for headless mode
  globalSetup: './jest.global.setup.js',
  globalTeardown: './jest.global.teardown.js',
};
