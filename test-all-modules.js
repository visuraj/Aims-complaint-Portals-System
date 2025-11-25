const axios = require('axios');

// Test backend connectivity
async function testBackend() {
  try {
    console.log('Testing backend connectivity...');
    
    // Test main endpoint
    const mainResponse = await axios.get('http://localhost:3003/');
    console.log('✓ Main endpoint:', mainResponse.status, mainResponse.data.message);
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3003/health');
    console.log('✓ Health endpoint:', healthResponse.status, healthResponse.data.message);
    
    return true;
  } catch (error) {
    console.error('✗ Backend connectivity test failed:', error.message);
    return false;
  }
}

// Test admin login
async function testAdminLogin() {
  try {
    console.log('\nTesting admin login...');
    
    const loginResponse = await axios.post('http://localhost:3003/api/login', {
      email: 'asthikshetty9999@gmail.com',
      password: '123456'
    });
    
    console.log('✓ Admin login successful');
    console.log('  Token:', loginResponse.data.token ? 'Received' : 'Not received');
    console.log('  User role:', loginResponse.data.user.role);
    
    return loginResponse.data.token;
  } catch (error) {
    console.error('✗ Admin login failed:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test user registration
async function testUserRegistration(token) {
  try {
    console.log('\nTesting user registration...');
    
    // Test student registration
    const studentResponse = await axios.post('http://localhost:3003/api/register/student', {
      collegeId: 'STU001',
      name: 'Test Student',
      email: 'teststudent@example.com',
      password: 'student123',
      course: 'Computer Science'
    });
    
    console.log('✓ Student registration:', studentResponse.data.message);
    
    // Test professor registration
    const professorResponse = await axios.post('http://localhost:3003/api/register/professor', {
      professorId: 'PROF001',
      name: 'Test Professor',
      department: 'Computer Science',
      email: 'testprofessor@example.com',
      password: 'prof123'
    });
    
    console.log('✓ Professor registration:', professorResponse.data.message);
    
    return true;
  } catch (error) {
    console.error('✗ User registration failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Test user management (admin only)
async function testUserManagement(token) {
  try {
    console.log('\nTesting user management...');
    
    // Get pending users
    const pendingUsersResponse = await axios.get('http://localhost:3003/api/users/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✓ Retrieved pending users:', pendingUsersResponse.data.length);
    
    return true;
  } catch (error) {
    console.error('✗ User management test failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== Complaint Portal - All Modules Test ===\n');
  
  // Test 1: Backend connectivity
  const backendOk = await testBackend();
  if (!backendOk) {
    console.log('\n❌ Backend connectivity test failed. Stopping tests.');
    return;
  }
  
  // Test 2: Admin login
  const token = await testAdminLogin();
  if (!token) {
    console.log('\n❌ Admin login test failed. Stopping tests.');
    return;
  }
  
  // Test 3: User registration
  const registrationOk = await testUserRegistration(token);
  if (!registrationOk) {
    console.log('\n⚠️  User registration test failed, but continuing with other tests.');
  }
  
  // Test 4: User management
  const userManagementOk = await testUserManagement(token);
  if (!userManagementOk) {
    console.log('\n⚠️  User management test failed, but continuing with other tests.');
  }
  
  console.log('\n=== Test Summary ===');
  console.log('✓ Backend connectivity: PASSED');
  console.log('✓ Admin login: PASSED');
  console.log(registrationOk ? '✓ User registration: PASSED' : '✗ User registration: FAILED');
  console.log(userManagementOk ? '✓ User management: PASSED' : '✗ User management: FAILED');
  console.log('\n🎉 All core functionality tests completed!');
}

// Run the tests
runAllTests();