// Test script to simulate exact frontend login flow
const axios = require('axios');

async function testExactFrontendFlow() {
    console.log('Starting test...');
    
    try {
        console.log('=== Testing Exact Frontend Login Flow ===');
        
        const frontendSupabaseUrl = 'https://czrxdrytvvbbtqfacnwr.supabase.co';
        const frontendAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cnhkcnl0dnZiYnRxZmFjbndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MjI3NzcsImV4cCI6MjA2MzI5ODc3N30.zPjoqzQ1JYRhSkctZyo1_KQhCMGb1YQppNRq-U3hUwQ';
        
        console.log('1. Attempting frontend-style login...');
        
        const authResponse = await axios.post(`${frontendSupabaseUrl}/auth/v1/token?grant_type=password`, {
            email: 'debug@test.com',
            password: 'testpass123'
        }, {
            headers: {
                'apikey': frontendAnonKey,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Auth response status:', authResponse.status);
        const { access_token, user } = authResponse.data;
        console.log('Got access token and user');
        
        console.log('2. Testing profile endpoint...');
        const profileResponse = await axios.get('http://localhost:3050/api/company/profile', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        console.log('✅ SUCCESS: Profile fetched successfully!');
        console.log('Company:', profileResponse.data.company_name);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

console.log('About to call test function...');
testExactFrontendFlow().then(() => {
    console.log('Test completed');
    process.exit(0);
}).catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
