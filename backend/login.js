require('dotenv').config();
const axios = require('axios');

const login = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: '<YOUR_EMAIL>', // Replace with your email
      password: '<YOUR_PASSWORD>', // Replace with your password
    });
    console.log('JWT Token:', response.data.token);
  } catch (error) {
    console.error('Error logging in:', error.response ? error.response.data : error.message);
  }
};

login();