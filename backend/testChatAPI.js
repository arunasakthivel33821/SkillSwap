require('dotenv').config();
const axios = require('axios');

const testChatAPI = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/chat/session/<SESSION_ID>', {
      headers: {
        Authorization: `Bearer <YOUR_JWT_TOKEN>`
      }
    });
    console.log('Chat API Response:', response.data);
  } catch (error) {
    console.error('Error fetching chat messages:', error.response ? error.response.data : error.message);
  }
};

testChatAPI();