// jest.global.teardown.js
const { teardown: teardownPuppeteer } = require('jest-puppeteer');

module.exports = async () => {
  // Call default jest-puppeteer teardown
  await teardownPuppeteer();
};
