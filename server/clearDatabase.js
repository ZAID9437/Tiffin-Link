const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Otp = require('./models/Otp');

async function clearDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    const userResult = await User.deleteMany({});
    const otpResult = await Otp.deleteMany({});

    console.log(`\n========================================`);
    console.log(`[SUCCESS] Database Cleaned Successfully!`);
    console.log(`- Removed Users: ${userResult.deletedCount}`);
    console.log(`- Removed OTPs: ${otpResult.deletedCount}`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDB();
