const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink');
    console.log(`\x1b[32m[MongoDB Connected]\x1b[0m ${conn.connection.host} / database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`\x1b[31m[MongoDB Connection Error]\x1b[0m ${error.message}`);
    console.log('\x1b[33mFalling back to in-memory storage...\x1b[0m');
  }
};

const ensureConnected = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      console.error('Failed to reconnect to MongoDB:', e.message);
    }
  }
  return mongoose.connection.readyState === 1;
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.ensureConnected = ensureConnected;
