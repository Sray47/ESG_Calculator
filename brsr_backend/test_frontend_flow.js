// Test script to simulate the frontend authentication flow
const axios = require('axios');

async function testFrontendFlow() {
    try {
        console.log('=== Testing Frontend Authentication Flow ===');
        
        // Read environment variables
        console.log('1. Loading environment...');
        require('dotenv').config();
          const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using service key for testing
        
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key present:', !!supabaseKey);
        
        // Step 1: Make direct Supabase auth request
        console.log('2. Making direct Supabase auth request...');
        const authResponse = await axios.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            email: 'debug@test.com',
            password: 'testpass123'
        }, {
            headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Auth response status:', authResponse.status);
        const { access_token } = authResponse.data;
        console.log('Got access token:', access_token.substring(0, 30) + '...');
        
        // Step 2: Test the profile endpoint with this token
        console.log('3. Testing profile endpoint with token...');
        const profileResponse = await axios.get('http://localhost:3050/api/company/profile', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        console.log('Profile response:', profileResponse.data);
        console.log('✅ SUCCESS: Profile fetched successfully!');
        
    } catch (error) {
        console.error('❌ Error during test:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data?.message);
            console.log('Debug info:', error.response.data?.debug);
            console.log('Full response:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testFrontendFlow();
