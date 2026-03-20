require('dotenv').config();
const mongoose = require('mongoose');

const testMongoConnection = async () => {
  try {
    // Connect to MongoDB using the connection string from .env
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB Atlas successfully!');

    // List all collections in the database
    const collections = await connection.connection.db.listCollections().toArray();
    console.log('Collections in the database:', collections.map((col) => col.name));

    // Close the connection
    await connection.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
  }
};

testMongoConnection();