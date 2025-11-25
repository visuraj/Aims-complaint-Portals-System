const axios = require('axios');

async function testAdminLogin() {
  try {
    const response = await axios.post('http://localhost:3003/api/login', {
      email: 'asthikshetty9999@gmail.com',
      password: '123456'
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
  }
}

testAdminLogin();