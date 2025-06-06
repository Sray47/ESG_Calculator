// Test script to verify Section C updates with 'InProgress' status
// Run this script using Node.js

const axios = require('axios');
const baseUrl = 'http://localhost:3000/api'; // Adjust if your server is on a different port

// Replace these with valid values from your system
const testAuthToken = 'YOUR_AUTH_TOKEN'; // Get this from localStorage in browser after login
const testReportId = 'YOUR_REPORT_ID'; // Choose a report with 'InProgress' status

async function testSectionCUpdates() {
    console.log('Starting Section C update tests...');
    
    try {
        // Test updating each Section C principle
        for (let i = 1; i <= 9; i++) {
            const fieldName = `sc_p${i}_ethical_conduct`;
            const testData = {
                [`sc_p${i}_ethical_conduct`]: {
                    test_value: `Test data for principle ${i} at ${new Date().toISOString()}`
                }
            };
            
            console.log(`Testing update for principle ${i}...`);
            
            const response = await axios.put(`${baseUrl}/reports/${testReportId}`, testData, {
                headers: {
                    'Authorization': `Bearer ${testAuthToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`Principle ${i} update result:`, response.status, response.statusText);
            console.log(`Updated data:`, response.data[`sc_p${i}_ethical_conduct`]);
        }
        
        console.log('All Section C update tests completed successfully!');
    } catch (error) {
        console.error('Error during testing:', error.response?.status, error.response?.data || error.message);
    }
}

testSectionCUpdates();
