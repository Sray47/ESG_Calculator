// Run this script to execute the automated tests
// It ensures the screenshots directory exists and runs the tests

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createTestUser } from './createTestUser.js';

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for command line arguments
const args = process.argv.slice(2);
const shouldCreateUser = args.includes('--create-user');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Main function to run tests
async function runTests() {
  if (shouldCreateUser) {
    console.log('Creating test user before running tests...');
    const userCreated = await createTestUser();
    
    if (!userCreated) {
      console.error('Failed to create test user. Aborting tests.');
      process.exit(1);
    }
  }
  
  console.log('Starting automated form testing...');
  
  try {
    // Run the tests with Jest
    execSync('npx jest formAutomation.test.js --config=../../jest.config.js', {
      stdio: 'inherit',
      cwd: path.join(__dirname)
    });
    
    console.log('Tests completed successfully!');
  } catch (error) {
    console.error('Tests failed with error:', error.message);
    process.exit(1);
  }
}

// Execute tests if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

export { runTests };
