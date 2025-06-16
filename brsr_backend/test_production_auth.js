// Production Authentication Test Script
const axios = require('axios');

// Configuration for production deployment
const BASE_URL = 'https://esg-calculator.vercel.app/api';
const AUTH_URL = `${BASE_URL}/auth`;
const COMPANY_URL = `${BASE_URL}/company`;

// Test user credentials (existing user from previous tests)
const TEST_USER = {
  email: 'testuser_nalco_1747888484369@example.com',
  password: 'password123'
};

// Helper function to log with timestamp
function logWithTime(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Test helper function with better error handling
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    logWithTime(`Making ${method} request to: ${url}`);
    const response = await axios(config);
    logWithTime(`✅ ${method} ${url} - Status: ${response.status}`);
    return response;
  } catch (error) {
    logWithTime(`❌ ${method} ${url} - Error: ${error.response?.status || 'Network Error'}`);
    if (error.response) {
      logWithTime(`Error Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      logWithTime(`Error Message: ${error.message}`);
    }
    throw error;
  }
}

// Test 1: Check if backend is accessible
async function testBackendHealth() {
  logWithTime('=== Testing Backend Health ===');
  try {
    await makeRequest('GET', `${BASE_URL}/test`);
    logWithTime('✅ Backend health check passed');
    return true;
  } catch (error) {
    logWithTime('❌ Backend health check failed');
    return false;
  }
}

// Test 2: Check available routes
async function testDebugRoutes() {
  logWithTime('=== Testing Debug Routes ===');
  try {
    const response = await makeRequest('GET', `${BASE_URL}/debug/routes`);
    logWithTime('Available routes:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    logWithTime('❌ Debug routes check failed');
    return false;
  }
}

// Test 3: Login with existing user
async function testLogin() {
  logWithTime('=== Testing User Login ===');
  try {
    const response = await makeRequest('POST', `${AUTH_URL}/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    logWithTime('✅ Login successful');
    logWithTime(`User data: ${JSON.stringify(response.data.user, null, 2)}`);
    
    return response.data.token;
  } catch (error) {
    logWithTime('❌ Login failed');
    return null;
  }
}

// Test 4: Access protected company profile
async function testCompanyProfile(token) {
  logWithTime('=== Testing Company Profile Access ===');
  try {
    const response = await makeRequest('GET', `${COMPANY_URL}/profile`, null, {
      'Authorization': `Bearer ${token}`
    });
    
    logWithTime('✅ Company profile access successful');
    logWithTime(`Company data: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logWithTime('❌ Company profile access failed');
    return false;
  }
}

// Test 5: Test company update endpoint
async function testCompanyUpdate(token) {
  logWithTime('=== Testing Company Update ===');
  try {
    const updateData = {
      company_name: 'NALCO Test Corp New - Updated',
      telephone: '9876543210'
    };
    
    const response = await makeRequest('PUT', `${COMPANY_URL}/profile`, updateData, {
      'Authorization': `Bearer ${token}`
    });
    
    logWithTime('✅ Company update successful');
    logWithTime(`Updated data: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logWithTime('❌ Company update failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  logWithTime('🚀 Starting Production Authentication Tests');
  logWithTime(`Testing against: ${BASE_URL}`);
  
  try {
    // Test 1: Backend health
    const healthOk = await testBackendHealth();
    if (!healthOk) {
      logWithTime('❌ Backend is not accessible, stopping tests');
      return;
    }
    
    // Test 2: Debug routes
    await testDebugRoutes();
    
    // Test 3: Login
    const token = await testLogin();
    if (!token) {
      logWithTime('❌ Cannot proceed without valid token');
      return;
    }
    
    logWithTime(`✅ JWT Token received: ${token.substring(0, 50)}...`);
    
    // Test 4: Company profile
    await testCompanyProfile(token);
    
    // Test 5: Company update
    await testCompanyUpdate(token);
    
    logWithTime('✅ All tests completed successfully');
    
  } catch (error) {
    logWithTime('❌ Test suite failed with error:');
    console.error(error);
  }
}

// Run the tests
if (require.main === module) {
  runTests().then(() => {
    logWithTime('Test suite finished');
    process.exit(0);
  }).catch((error) => {
    logWithTime('Test suite crashed:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTests };
