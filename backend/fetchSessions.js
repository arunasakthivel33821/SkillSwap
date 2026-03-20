require('dotenv').config();
const axios = require('axios');

const fetchSessions = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/sessions/my', {
      headers: {
        Authorization: `Bearer <YOUR_JWT_TOKEN>`, // Replace with your JWT token
      },
    });
    console.log('Sessions:', response.data);
  } catch (error) {
    console.error('Error fetching sessions:', error.response ? error.response.data : error.message);
  }
};

fetchSessions();