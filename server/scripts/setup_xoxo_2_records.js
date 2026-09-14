const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function setupXoxo2Records() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully!\n');

    const db = mongoose.connection.db;

    // 1. Resolve Xoxo Men Kitchen Provider
    const provider = await db.collection('providers').findOne({
      $or: [
        { businessName: /xoxo/i },
        { name: /xoxo/i },
        { email: /menxoxo/i }
      ]
    });

    if (!provider) {
      console.error('Xoxo Men Kitchen Provider document not found!');
      process.exit(1);
    }

    const providerId = provider._id.toString();
    const providerEmail = provider.email || 'menxoxo50@gmail.com';
    const providerName = provider.businessName || provider.name || 'Xoxo Men Kitchen';

    console.log(`✅ Resolved Provider: ${providerName} | ID: ${providerId} | Email: ${providerEmail}`);

    // 2. Remove legacy/temporary test requests like #DEL-TEST
    await db.collection('deliveryrequests').deleteMany({ requestId: '#DEL-TEST' });

    // 3. Ensure 2 active delivery requests exist for Xoxo Men Kitchen with status 'Searching Drivers'
    // Record 1: #DEL-1029 (Order #1024 - Raj Patel)
    await db.collection('deliveryrequests').updateOne(
      { requestId: '#DEL-1029' },
      {
        $set: {
          providerId,
          providerEmail,
          providerName,
          orderId: '#1024',
          customerName: 'Raj Patel',
          customerPhone: '+91 98250 12345',
          tiffinName: 'Gujarati Special Kathiyawadi Thali × 2',
          tiffinCategory: 'Gujarati',
          deliveryAddress: { street: '402 Sunrise Towers, Navrangpura', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
          pickupAddress: { street: 'Ruhan Duplex, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
          assignedDriver: { driverId: '', name: '', phone: '', rating: 4.8, vehicleNo: '', location: { lat: 23.0280, lng: 72.5670 } },
          status: 'Searching Drivers',
          distanceKm: 3.2,
          etaMinutes: 18,
          amount: 317,
          itemCount: 2,
          pickupOtp: '4821',
          deliveryOtp: '9012',
          pickupOtpVerified: false,
          deliveryOtpVerified: false,
          requestedAt: new Date()
        }
      },
      { upsert: true }
    );

    // Record 2: #DEL-1028 (Order #1025 - Amit Shah)
    await db.collection('deliveryrequests').updateOne(
      { requestId: '#DEL-1028' },
      {
        $set: {
          providerId,
          providerEmail,
          providerName,
          orderId: '#1025',
          customerName: 'Amit Shah',
          customerPhone: '+91 99798 54321',
          tiffinName: 'Jain Pure Veg Swaminarayan Thali × 3',
          tiffinCategory: 'Jain',
          deliveryAddress: { street: 'B-12 Shrinand Nagar, Vejalpur', city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
          pickupAddress: { street: 'Ruhan Duplex, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
          assignedDriver: { driverId: '', name: '', phone: '', rating: 4.8, vehicleNo: '', location: { lat: 23.0280, lng: 72.5670 } },
          status: 'Searching Drivers',
          distanceKm: 4.5,
          etaMinutes: 22,
          amount: 517,
          itemCount: 3,
          pickupOtp: '9102',
          deliveryOtp: '3341',
          pickupOtpVerified: false,
          deliveryOtpVerified: false,
          requestedAt: new Date(Date.now() - 5 * 60 * 1000)
        }
      },
      { upsert: true }
    );

    // Delete any other excess delivery requests for clean 2-record testing
    const deleteResult = await db.collection('deliveryrequests').deleteMany({
      requestId: { $nin: ['#DEL-1029', '#DEL-1028'] }
    });

    console.log(`🧹 Cleaned ${deleteResult.deletedCount} non-test requests.`);

    // Print final DB check
    const finalRequests = await db.collection('deliveryrequests').find({}).toArray();
    console.log(`\n=== FINAL MONGODB DELIVERY REQUESTS COUNT: ${finalRequests.length} ===`);
    finalRequests.forEach((r, i) => {
      console.log(`[${i+1}] RequestId: ${r.requestId} | OrderId: ${r.orderId} | Provider: ${r.providerName} (${r.providerId}) | Customer: ${r.customerName} | Tiffin: ${r.tiffinName} | Amount: ₹${r.amount} | Status: ${r.status}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error setting up Xoxo records:', err);
    process.exit(1);
  }
}

setupXoxo2Records();
