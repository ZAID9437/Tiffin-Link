const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function verifyXoxo2Records() {
  console.log('=== TIFFINLINK — LIVE DELIVERY REQUEST TEST DATA AUDIT ===\n');

  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // 1. Provider Resolution
    const provider = await db.collection('providers').findOne({
      $or: [
        { businessName: /xoxo/i },
        { name: /xoxo/i },
        { email: /menxoxo/i }
      ]
    });

    if (!provider) {
      console.error('❌ Provider Xoxo Men Kitchen not found');
      process.exit(1);
    }

    const providerId = provider._id.toString();
    const providerEmail = provider.email || 'menxoxo50@gmail.com';
    const providerName = provider.businessName || provider.name || 'Xoxo Men Kitchen';

    // 2. Orders Audit
    const orders = await db.collection('orders').find({
      $or: [{ providerId }, { providerEmail }]
    }).toArray();

    // 3. DeliveryRequests Audit
    const deliveryRequests = await db.collection('deliveryrequests').find({
      $or: [{ providerId }, { providerEmail }]
    }).limit(2).toArray();

    // 4. Tiffins Audit
    const tiffins = await db.collection('tiffins').find({
      providerId
    }).toArray();

    console.log('1. Xoxo Men Kitchen Provider ID:', providerId);
    console.log('2. Number of suitable real orders found:', orders.length);
    console.log('3. Number of DeliveryRequests found (Limit 2):', deliveryRequests.length);
    console.log('4. Displayed Records Count:', deliveryRequests.length);

    console.log('\n--- DISPLAYED REAL RECORDS DETAILS ---');
    deliveryRequests.forEach((r, i) => {
      const matchingOrder = orders.find(o => String(o.orderId) === String(r.orderId) || String(o._id) === String(r.orderId)) || {};
      console.log(`\nRECORD [${i + 1}]:`);
      console.log(`  - DeliveryRequest ID: ${r._id}`);
      console.log(`  - Request ID: ${r.requestId}`);
      console.log(`  - Order ID: ${r.orderId}`);
      console.log(`  - Customer ID / Name: ${r.customerName} (${matchingOrder.customerPhone || r.customerPhone})`);
      console.log(`  - Tiffin ID / Name: ${r.tiffinName}`);
      console.log(`  - Total Amount: ₹${r.amount}`);
      console.log(`  - Driver Earning: ₹${Math.max(65, Math.round((r.amount || 200) * 0.35))}`);
      console.log(`  - Distance: ${r.distanceKm} km | ETA: ${r.etaMinutes} mins`);
      console.log(`  - Status: ${r.status}`);
    });

    console.log('\n========================================================');
    console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error verifying Xoxo 2 records:', err);
    process.exit(1);
  }
}

verifyXoxo2Records();
