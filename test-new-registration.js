const axios = require('axios');

async function testNewUserRegistration() {
  try {
    console.log('Testing new user registration...');
    
    // Test student registration with a new email
    const studentResponse = await axios.post('http://localhost:3003/api/register/student', {
      collegeId: 'STU002',
      name: 'Test Student 2',
      email: 'teststudent2@example.com',
      password: 'student123',
      course: 'Computer Science'
    });
    
    console.log('✓ New student registration successful:', studentResponse.data.message);
    
    // Test professor registration with a new email
    const professorResponse = await axios.post('http://localhost:3003/api/register/professor', {
      professorId: 'PROF002',
      name: 'Test Professor 2',
      department: 'Computer Science',
      email: 'testprofessor2@example.com',
      password: 'prof123'
    });
    
    console.log('✓ New professor registration successful:', professorResponse.data.message);
    
    return true;
  } catch (error) {
    if (error.response && error.response.data.message.includes('already exists')) {
      console.log('⚠️  User already exists (this is expected if test was run before)');
      return true;
    }
    console.error('✗ New user registration failed:', error.response ? error.response.data : error.message);
    return false;
  }
}

testNewUserRegistration();