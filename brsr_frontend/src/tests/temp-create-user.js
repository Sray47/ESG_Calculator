// Test user creation utility

import axios from 'axios';

async function createUser() {
  // Test user data
  const userData = {
    email: 'autotest1747976939143@gmail.com',
    password: 'Test123!',
    company_name: 'National Aluminium Company Limited',
    cin: 'L27203OR1981GOI000920',
    year_of_incorporation: '1981',
    registered_office_address: 'NALCO Bhawan, Plot No. P/1, Nayapalli, Bhubaneswar-751013, Odisha',
    corporate_address: 'NALCO Bhawan, Plot No. P/1, Nayapalli, Bhubaneswar-751013, Odisha',
    telephone: '0674-2301988',
    website: 'www.nalcoindia.com',
    stock_exchange_listed: 'BSE Limited and National Stock Exchange of India Limited',
    paid_up_capital: '918,32,71,590',
    brsr_contact_name: 'Shri B K Sahu',
    brsr_contact_mail: 'bksahu@nalcoindia.co.in',
    brsr_contact_number: '0674-2300430'
  };
  
  try {
    // Register the user
    const response = await axios.post('http://localhost:3050/api/auth/register', userData);
    
    if (response.status === 201) {
      // Return the user credentials
      const credentials = {
        email: userData.email,
        password: userData.password
      };
      
      console.log('Test user created successfully:');
      console.log(credentials);
      
      return credentials;
    } else {
      console.error('Failed to create user:', response.data);
      throw new Error('User creation failed');
    }
  } catch (error) {
    console.error('Error creating user:', error.message);
    throw error;
  }
}

createUser().catch(error => console.error('Failed to create test user:', error));
