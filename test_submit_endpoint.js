// Test script to debug PDF generation issue
const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:3050/api';
const TEST_USER = {
    email: 'testuser_nalco_1747888484369@example.com',
    password: 'password123'
};

async function testSubmitEndpoint() {
    try {
        console.log('=== Testing Submit Endpoint and PDF Generation ===\n');

        // Step 1: Login to get a token
        console.log('1. Logging in to get auth token...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });

        console.log('Login response data:', JSON.stringify(loginResponse.data, null, 2)); // DEBUG

        if (loginResponse.status !== 200) {
            throw new Error('Login failed');
        }

        const session = loginResponse.data.session;
        if (!session || !session.access_token) {
            throw new Error('No session token received from login');
        }

        console.log('✓ Login successful, token obtained');

        // Step 2: Get list of reports for this user
        console.log('\n2. Fetching user reports...');
        const reportsResponse = await axios.get(`${API_BASE}/reports`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        console.log('✓ Reports fetched:', reportsResponse.data.length, 'reports found');
        console.log('All reports:', JSON.stringify(reportsResponse.data, null, 2)); // DEBUG

        if (reportsResponse.data.length === 0) {
            console.log('⚠ No reports found for this user. Cannot test submit endpoint.');
            return;
        }        // Use report ID 24 which is in "InProgress" status
        let reportId = 26;
        console.log(`Using hardcoded report ID ${reportId} which should be in "InProgress" status`);

        // Step 3: Try to submit the report
        console.log('\n3. Attempting to submit report and generate PDF...');
        const submitResponse = await axios.post(`${API_BASE}/reports/${reportId}/submit`, {}, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        console.log('✓ Submit response status:', submitResponse.status);
        console.log('Submit response data:', JSON.stringify(submitResponse.data, null, 2));

        // Step 4: Try to download PDF if URL is provided
        if (submitResponse.data.pdfUrl) {
            console.log('\n4. Testing PDF download...');
            // Fix: Remove duplicate /api if present in pdfUrl
            let pdfUrl = submitResponse.data.pdfUrl;
            if (pdfUrl.startsWith('/api/')) {
                pdfUrl = pdfUrl.replace(/^\/api/, '');
            }
            const pdfResponse = await axios.get(`${API_BASE}${pdfUrl}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                responseType: 'stream'
            });

            console.log('✓ PDF download status:', pdfResponse.status);
            console.log('✓ PDF content type:', pdfResponse.headers['content-type']);
        }

    } catch (error) {
        console.error('\n❌ Error occurred:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Message:', error.message);
        }
        console.error('Full error:', error);
    }
}

// Run the test
testSubmitEndpoint();
