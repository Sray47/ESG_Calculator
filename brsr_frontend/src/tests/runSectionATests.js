// runSectionATests.js
// Script to specifically run the Section A form automation tests

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createTestUser } from './createTestUser.js';

// Check for command line arguments
const args = process.argv.slice(2);
const shouldCreateUser = args.includes('--create-user');
const headless = args.includes('--headless');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create credentials directory if it doesn't exist
const credentialsDir = path.join(__dirname);
const credentialsFile = path.join(credentialsDir, 'test_user_credentials.json');

// Main function to run tests
async function runTests() {
  try {
    // Create a test user if requested
    if (shouldCreateUser) {
      console.log('\n🔑 Creating test user...');
      const credentials = await createTestUser();
      
      // Save credentials to file for later use
      fs.writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2));
      console.log(`✅ Test user created and credentials saved to ${credentialsFile}`);
    }
    
    // Check if credentials file exists
    if (!fs.existsSync(credentialsFile)) {
      console.error('❌ No test user credentials found. Run with --create-user first.');
      process.exit(1);
    }
    
    // Read credentials from file
    const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'));
    console.log(`\n👤 Using test user: ${credentials.email}`);
    
    // Configure jest command
    let jestCommand = 'npx jest --testMatch="**/formAutomation.test.js"';
    if (headless) {
      // Set headless mode environment variable
      process.env.HEADLESS = 'true';
      jestCommand += ' --config=jest.config.headless.js';
    }
    
    console.log('\n🚀 Running Section A form automation tests...');
    console.log(`\nCommand: ${jestCommand}`);
    
    // Execute tests
    execSync(jestCommand, { stdio: 'inherit' });
    
    console.log('\n✅ Tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
