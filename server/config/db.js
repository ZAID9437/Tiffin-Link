const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink', {
      serverSelectionTimeoutMS: 3000 // Timeout quickly if MongoDB is not running
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`\x1b[33mWarning: MongoDB Connection Failed (${error.message})\x1b[0m`);
    console.warn('\x1b[36mNotice: Server is falling back to an in-memory data store for development.\x1b[0m');
    return false;
  }
};

module.exports = connectDB;
