const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function auditXoxoData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);
    const db = mongoose.connection.db;

    // 1. Find Provider document for Xoxo Men Kitchen
    const providers = await db.collection('providers').find({
      $or: [
        { name: /xoxo/i },
        { businessName: /xoxo/i },
        { fullName: /xoxo/i },
        { email: /menxoxo/i }
      ]
    }).toArray();

    console.log('\n=== PROVIDERS MATCHING XOXO MEN (' + providers.length + ') ===');
    providers.forEach(p => console.log('Provider ID:', p._id.toString(), '| Business:', p.businessName, '| Name:', p.name, '| Email:', p.email));

    const providerIds = providers.map(p => p._id.toString());
    const providerEmails = providers.map(p => p.email).filter(Boolean);

    // 2. Find Orders for Xoxo Men Kitchen
    const orders = await db.collection('orders').find({
      $or: [
        { providerId: { $in: providerIds } },
        { providerEmail: { $in: providerEmails } }
      ]
    }).toArray();

    console.log('\n=== ORDERS FOR XOXO MEN (' + orders.length + ') ===');
    orders.forEach((o, i) => console.log(`[${i+1}] ID: ${o._id} | OrderId: ${o.orderId} | ProviderId: ${o.providerId} | Customer: ${o.customerName} | Tiffin: ${o.tiffinName} | Amount: ₹${o.totalAmount} | Status: ${o.status} | DeliveryStatus: ${o.deliveryStatus}`));

    // 3. Find DeliveryRequests for Xoxo Men Kitchen
    const deliveryRequests = await db.collection('deliveryrequests').find({
      $or: [
        { providerId: { $in: providerIds } },
        { providerEmail: { $in: providerEmails } }
      ]
    }).toArray();

    console.log('\n=== DELIVERY REQUESTS FOR XOXO MEN (' + deliveryRequests.length + ') ===');
    deliveryRequests.forEach((r, i) => console.log(`[${i+1}] ID: ${r._id} | RequestId: ${r.requestId} | OrderId: ${r.orderId} | ProviderId: ${r.providerId} | Customer: ${r.customerName} | Tiffin: ${r.tiffinName} | Amount: ₹${r.amount} | Status: ${r.status}`));

    // 4. Find Users / Tiffins related to Xoxo Men
    const tiffins = await db.collection('tiffins').find({
      providerId: { $in: providerIds }
    }).toArray();

    console.log('\n=== TIFFINS FOR XOXO MEN (' + tiffins.length + ') ===');
    tiffins.forEach((t, i) => console.log(`[${i+1}] ID: ${t._id} | Name: ${t.name} | Category: ${t.category} | Price: ₹${t.price}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Audit Error:', err);
  }
}

auditXoxoData();
