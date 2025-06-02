// Debug script to test frontend authentication flow
const axios = require('axios');

// Test the exact frontend flow by calling backend endpoints
async function testFrontendAuthFlow() {
    console.log('=== Testing Frontend Authentication Flow ===\n');
    
    const TEST_USER = {
        email: 'debug@test.com',
        password: 'Debug123!'
    };
    
    try {
        // Step 1: Test Supabase login (simulate what frontend does)
        console.log('1. Testing Supabase auth endpoint...');
        
        // The frontend would call Supabase directly, but we can test the backend auth endpoint
        const loginResponse = await axios.post('http://localhost:3050/api/auth/login', {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        
        if (loginResponse.status === 200) {
            console.log('✓ Login successful');
            console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
            
            // Step 2: Extract token and test company profile fetch
            const token = loginResponse.data.token || 
                         loginResponse.data.session?.access_token || 
                         loginResponse.data.access_token;
            
            if (token) {
                console.log('\n2. Testing company profile fetch with token...');
                
                try {
                    const profileResponse = await axios.get('http://localhost:3050/api/company/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('✓ Company profile fetch successful');
                    console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
                    
                } catch (profileError) {
                    console.log('✗ Company profile fetch failed');
                    console.log('Error:', profileError.response?.data || profileError.message);
                }
                
            } else {
                console.log('✗ No token found in login response');
            }
            
        }
        
    } catch (loginError) {
        console.log('✗ Login failed');
        if (loginError.response) {
            console.log('Status:', loginError.response.status);
            console.log('Data:', loginError.response.data);
        } else {
            console.log('Error:', loginError.message);
        }
    }
}

// Test backend health
async function testBackendHealth() {
    console.log('=== Testing Backend Health ===\n');
    
    try {
        const response = await axios.get('http://localhost:3050/api/health');
        console.log('✓ Backend is healthy');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('✗ Backend health check failed');
        console.log('Error:', error.message);
    }
}

// Run tests
async function runTests() {
    await testBackendHealth();
    console.log('\n');
    await testFrontendAuthFlow();
}

runTests().catch(console.error);
