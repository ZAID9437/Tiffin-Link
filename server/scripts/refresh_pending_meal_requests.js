const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function refreshPendingMealRequests() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const now = Date.now();
    await db.collection('mealrequests').updateMany(
      { status: 'pending' },
      { $set: { expiresAt: new Date(now + 120 * 1000) } }
    );

    const reqs = await db.collection('mealrequests').find({ status: 'pending' }).toArray();
    console.log('=== PENDING MEAL REQUESTS IN MONGO ===');
    reqs.forEach((r, i) => {
      const sec = Math.floor((new Date(r.expiresAt).getTime() - Date.now()) / 1000);
      console.log(`[${i + 1}] ID: ${r._id} | Customer: ${r.customerName} | Meal: ${r.mealType} | Status: ${r.status} | Expires In: ${sec}s`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error refreshing meal requests:', err);
    process.exit(1);
  }
}

refreshPendingMealRequests();
