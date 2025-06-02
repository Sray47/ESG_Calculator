// Simple test script to check backend connectivity and database
const axios = require('axios');

async function testBackend() {
    try {
        console.log('Testing backend connectivity...');
        
        // Test basic connection
        const testResponse = await axios.get('http://localhost:3050/api/test');
        console.log('✅ Backend test successful:', testResponse.data);
        
        // Test with a sample token (you'll need to replace this with a real token)
        console.log('\n❌ To test authentication, you need to:');
        console.log('1. Log in through the frontend');
        console.log('2. Check browser dev tools > Application > localStorage > session');
        console.log('3. Copy the access_token from the session');
        console.log('4. Run this test with: node test_connection.js <your-token>');
        
        if (process.argv[2]) {
            const token = process.argv[2];
            console.log('\n🔐 Testing with provided token...');
            
            try {
                const profileResponse = await axios.get('http://localhost:3050/api/company/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('✅ Profile fetch successful:', profileResponse.data);
            } catch (error) {
                console.log('❌ Profile fetch failed:', error.response?.data || error.message);
                
                // Try debug route
                try {
                    const debugResponse = await axios.get('http://localhost:3050/api/debug/companies', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    console.log('🔍 Debug info:', debugResponse.data);
                } catch (debugError) {
                    console.log('❌ Debug route failed:', debugError.response?.data || debugError.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Backend test failed:', error.message);
    }
}

testBackend();
