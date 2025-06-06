// Test script to update Section C Principle 1 for a report with InProgress status
const axios = require('axios');

// Configuration - update these with your values
const API_URL = 'http://localhost:3050/api';
const REPORT_ID = 25; // Replace with your report ID
const COMPANY_ID = 7; // Company ID associated with the report

// Use the auth token obtained from the browser's localStorage after login
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJjb21wYW55X2lkIjoyLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2OTQ3MDAzMzksImV4cCI6MTY5NzI5MjMzOX0.KUREK0QUsH_cCkPmYQGLrsYiOFY59ultqBhPcSfJpU8'; // Replace with actual token

// Let's use mock test data instead of an actual auth token
// The server will be modified to accept this token for testing
const TEST_PAYLOAD = {
  reportId: REPORT_ID,
  companyId: COMPANY_ID,
  sc_p1_ethical_conduct: {
    anti_corruption_policy: {
      has_policy: true,
      details: `Updated anti-corruption policy details at ${new Date().toISOString()}`,
      weblink: 'https://example.com/policy-updated',
    },
    esg_training_employees: {
      has_program: true,
      employees_trained_count: 150,
    }
  }
};

async function testSectionCUpdate() {
  try {
    console.log(`Testing update for Section C Principle 1 on report ${REPORT_ID}...`);
    console.log(`Data to send:`, JSON.stringify(TEST_DATA, null, 2));
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    };    // First, check the current status of the report
    console.log(`\nChecking current report status...`);
    const statusResponse = await axios.get(`${API_URL}/reports/${REPORT_ID}`, { headers });
    console.log(`Current report status: ${statusResponse.data.status}`);
    
    if (statusResponse.data.status !== 'InProgress') {
      console.warn(`\nWARNING: Report is not in 'InProgress' status. Current status: ${statusResponse.data.status}`);
      console.warn(`This test is specifically for verifying updates to reports with 'InProgress' status.`);
    }
    
    // Make the update request
    console.log(`\nAttempting to update Section C Principle 1 data...`);
    const response = await axios.put(`${API_URL}/reports/${REPORT_ID}`, TEST_DATA, { headers });
    
    console.log(`\nUpdate request complete! Status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));
    
    // Verify that the data was updated
    console.log(`\nVerifying update by fetching the report again...`);
    const getResponse = await axios.get(`${API_URL}/reports/${REPORT_ID}`, { headers });
      // Check if sc_p1_ethical_conduct was updated
    console.log(`\nGet response - sc_p1_ethical_conduct data:`, 
      JSON.stringify(getResponse.data.sc_p1_ethical_conduct, null, 2));
      // Verify specific fields were updated as expected
    const ethicalConduct = getResponse.data.sc_p1_ethical_conduct;
    
    if (ethicalConduct && 
        ethicalConduct.anti_corruption_policy && 
        ethicalConduct.anti_corruption_policy.has_policy === true &&
        ethicalConduct.esg_training_employees &&
        ethicalConduct.esg_training_employees.has_program === true) {
      console.log('\nSUCCESS: Section C Principle 1 ethical conduct data was updated successfully!');
    } else {
      console.log('\nFAIL: Section C Principle 1 ethical conduct data was not updated as expected!');
      console.log('Expected: ', JSON.stringify(TEST_DATA.sc_p1_ethical_conduct, null, 2));
      console.log('Actual: ', JSON.stringify(ethicalConduct, null, 2));
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('\nError during test:');
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
      console.error(`Headers:`, error.response.headers);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from server');
    } else {
      // Error setting up the request
      console.error('Error:', error.message);
    }
  }
}

testSectionCUpdate();
