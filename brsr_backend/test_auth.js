// Authentication Flow Test Script
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3050/api/auth'; // Corrected API URL
const TEST_USER = {
  email: 'test_user@example.com',
  password: 'Test123!',
  company_name: 'Test Company',
  cin: 'TEST123456789',
  year_of_incorporation: '2020',
  registered_office_address: 'Test Address',
  corporate_address: 'Test Corporate Address',
  telephone: '1234567890',
  website: 'https://example.com',
  stock_exchanges_listed: 'BSE,NSE',
  paid_up_capital: '1000000',
  brsr_contact_name: 'Test Contact',
  brsr_contact_mail: 'contact@example.com',
  brsr_contact_number: '0987654321',
  // BRSR Section A fields
  reporting_boundary: 'standalone',
  sa_business_activities_turnover: [
    { description_main: 'Activity 1', description_business: 'Business 1', turnover_percentage: '50' }
  ],
  sa_product_services_turnover: [
    { product_service: 'Product 1', nic_code: '12345', turnover_contributed: '60' }
  ],
  sa_locations_plants_offices: {
    national_plants: 2,
    national_offices: 3,
    international_plants: 1,
    international_offices: 2
  },
  sa_markets_served: {
    locations: {
      national_states: 10,
      international_countries: 5
    },
    exports_percentage: '30',
    customer_types: 'B2B, B2C'
  }
};

// Helper function to log with timestamp
function logWithTime(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Test Registration Flow
async function testRegistration() {
  console.log(`[${new Date().toISOString()}] Starting registration test`);
  const uniqueEmail = `testuser_nalco_${Date.now()}@example.com`;
  const registrationData = {
    email: uniqueEmail,
    password: 'password123',
    company_name: 'NALCO Test Corp',
    cin: `L12345XX${Date.now().toString().slice(-4)}YY`, // NALCO is listed
    year_of_incorporation: 1981,
    registered_office_address: 'NALCO Bhawan, P/1, Nayapalli, Bhubaneswar - 751013, Odisha, India (Test)',
    corporate_address: 'NALCO Corporate Office, Plot No. P/1, Nayapalli, Bhubaneswar, Odisha 751013 (Test)',
    telephone: '06742301234',
    website: 'https://nalcoindia.com/test',
    stock_exchange_listed: ['NSE', 'BSE'],
    paid_up_capital: '12880000000', // Representative value
    brsr_contact_name: 'Mr. Test Contact Person',
    brsr_contact_mail: `nalco_contact_${Date.now()}@example.com`,
    brsr_contact_number: '06742300000',
    reporting_boundary: 'Standalone',
    sa_business_activities_turnover: [
      { description_main: 'Aluminium Smelting & Refining', description_business: 'Production of Alumina and Aluminium', turnover_percentage: 70 },
      { description_main: 'Chemicals', description_business: 'Production of various chemicals', turnover_percentage: 20 }
    ],
    sa_product_services_turnover: [
      { product_service: 'Alumina Hydrate', nic_code: '24202', turnover_contributed: 40 },
      { product_service: 'Aluminium Ingots/Billets/Wire Rods', nic_code: '24202', turnover_contributed: 30 },
      { product_service: 'Rolled Products', nic_code: '24202', turnover_contributed: 20 }
    ],
    sa_locations_plants_offices: {
      national_plants: 5,
      national_offices: 10,
      international_plants: 0,
      international_offices: 2
    },
    sa_markets_served: {
      locations: {
        national_states: 20,
        international_countries: 15
      },
      exports_percentage: 40,
      customer_types: 'B2B, Government'
    }
  };

  console.log(`[${new Date().toISOString()}] Attempting to register a new user with NALCO-derived data`);
  
  try {
    // Changed to call the /register endpoint
    const response = await axios.post(`${API_URL}/register`, registrationData);

    console.log(`[${new Date().toISOString()}] Registration successful:`, response.data);
    return response.data; // Contains company and auth_user from Supabase
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Registration error:`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('Request data:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Config:', JSON.stringify(error.config, null, 2));
    throw error; // Re-throw to ensure test fails
  }
}

// Test Login Flow
async function testLogin() {
  logWithTime('Starting login test');
  
  try {
    // Attempt login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResponse.status === 200) {
      logWithTime('Login successful:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
      
      // Save token for testing protected routes
      const token = loginResponse.data.token || 
                    loginResponse.data.session?.access_token || 
                    loginResponse.data.access_token;
      
      if (token) {
        // Test protected route
        await testProtectedRoute(token);
      } else {
        logWithTime('No authentication token in response');
      }
    } else {
      logWithTime(`Login failed with status: ${loginResponse.status}`);
      console.log(loginResponse.data);
    }
  } catch (error) {
    logWithTime('Login error:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

// Test Protected Route
async function testProtectedRoute(token) {
  logWithTime('Testing protected route access');
  
  try {
    const profileResponse = await axios.get(`${API_URL}/company/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.status === 200) {
      logWithTime('Successfully accessed protected route:');
      console.log(JSON.stringify(profileResponse.data, null, 2));
    } else {
      logWithTime(`Protected route access failed with status: ${profileResponse.status}`);
      console.log(profileResponse.data);
    }
  } catch (error) {
    logWithTime('Protected route access error:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

// Run the test
logWithTime('Starting Authentication Flow Test');
testRegistration()
  .then(() => {
    logWithTime('Test completed');
  })
  .catch(error => {
    logWithTime('Test failed with error:');
    console.error(error);
  });
