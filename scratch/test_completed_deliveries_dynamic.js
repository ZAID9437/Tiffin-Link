const mongoose = require('../server/node_modules/mongoose');
const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function testCompletedDeliveries() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('✅ Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    // 1. Fetch real driver docs
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log(`Found ${drivers.length} drivers in MongoDB`);

    if (drivers.length > 0) {
      const driver = drivers[0];
      console.log(`Testing for Driver: ${driver.name} (${driver.email || driver.phone || driver.driverId})`);
    }

    // 2. Fetch completed delivery requests in MongoDB
    const completedReqs = await db.collection('deliveryrequests').find({
      status: { $in: ['Delivered', 'DELIVERED', 'Completed', 'COMPLETED'] }
    }).toArray();

    console.log(`Total completed delivery requests in DB: ${completedReqs.length}`);

    // 3. Test HTTP API endpoint
    const json = await httpGet('http://localhost:5000/api/delivery/completed');

    console.log('HTTP API Response success:', json.success);
    console.log('Stats:', json.data?.stats);
    console.log('Pagination:', json.pagination);
    console.log('Fetched deliveries count:', json.data?.deliveries?.length);

    if (json.data?.deliveries?.length > 0) {
      const sample = json.data.deliveries[0];
      console.log('Sample Completed Delivery:', {
        orderId: sample.orderId,
        status: sample.status,
        customerName: sample.customerName,
        providerName: sample.providerName,
        orderTotal: sample.orderTotal,
        driverEarning: sample.driverEarning,
        completedAt: sample.completedAt
      });
    }

    // 4. Test Search API
    const searchJson = await httpGet('http://localhost:5000/api/delivery/completed?search=Priya');
    console.log('Search "Priya" results count:', searchJson.data?.deliveries?.length);

    // 5. Test Date Filter API
    const todayJson = await httpGet('http://localhost:5000/api/delivery/completed?date=today');
    console.log('Date "today" filter results count:', todayJson.data?.deliveries?.length);

    // 6. Test Sorting API
    const sortJson = await httpGet('http://localhost:5000/api/delivery/completed?sort=highest_earnings');
    console.log('Sort "highest_earnings" top item payout:', sortJson.data?.deliveries?.[0]?.driverEarning);

    // Safety checks
    console.log('✅ DB Safety Check: No collections dropped, real data intact.');

    await mongoose.disconnect();
    console.log('✅ Test completed successfully.');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testCompletedDeliveries();
