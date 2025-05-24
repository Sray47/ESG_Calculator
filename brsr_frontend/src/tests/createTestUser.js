// createTestUser.js
// This script creates a test user for automated testing purposes

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import testData from './testData.js';

// For ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API endpoints
const API_URL = 'http://localhost:3050/api';
const REGISTER_ENDPOINT = `${API_URL}/auth/register`;

/**
 * Creates a test user with company profile for running automated tests
 */
async function createTestUser() {
  console.log('Creating test user for automated form testing...');
  
  try {
    // Use fixed credentials for automated testing
    const email = 'autotest1747976939143@gmail.com';
    const password = 'Test123!';
    
    // Prepare registration data
    const registrationData = {
      email,
      password,
      company_name: testData.company.name,
      cin: testData.company.cin,
      year_of_incorporation: testData.company.year_of_incorporation,
      registered_office_address: testData.company.registered_office_address,
      corporate_address: testData.company.corporate_address,
      telephone: testData.company.telephone,
      website: testData.company.website,
      stock_exchange_listed: testData.company.stock_exchange_listed,
      paid_up_capital: testData.company.paid_up_capital,
      brsr_contact_name: testData.company.brsr_contact_name,
      brsr_contact_mail: testData.company.brsr_contact_mail,
      brsr_contact_number: testData.company.brsr_contact_number
    };
    
    // Send registration request
    const response = await axios.post(REGISTER_ENDPOINT, registrationData);
      if (response.status === 201) {
      console.log('Test user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      
      // Save the credentials to a file for reference
      const credentialsFile = path.join(__dirname, 'test-credentials.json');
      
      fs.writeFileSync(
        credentialsFile,
        JSON.stringify({ email, password }, null, 2)
      );
      
      console.log(`Credentials saved to ${credentialsFile}`);
      
      // Update the testData with the new email/password
      testData.auth.email = email;
      testData.auth.password = password;
      
      return true;
    } else {
      console.error('Unexpected response:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.error('Failed to create test user:', error.response?.data || error.message);
    return false;
  }
}

// Run this script directly
// In ESM there is no require.main === module check
const isRunningDirectly = process.argv[1]?.endsWith('createTestUser.js');

if (isRunningDirectly) {
  createTestUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);    });
}

export { createTestUser };
