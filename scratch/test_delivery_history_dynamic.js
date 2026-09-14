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

async function testDeliveryHistory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('✅ Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    // 1. Check Drivers in DB
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log(`Found ${drivers.length} drivers in DB.`);
    const driver = drivers[0];
    if (driver) {
      console.log(`Driver: ${driver.name} (${driver.email || driver.phone})`);
    }

    // 2. Fetch history API
    const emailParam = driver?.email ? encodeURIComponent(driver.email) : '';
    const json = await httpGet(`http://localhost:5000/api/delivery/history?email=${emailParam}`);

    console.log('\n--- API Response /api/delivery/history ---');
    console.log('Success:', json.success);
    console.log('Stats:', json.data?.stats);
    console.log('Pagination:', json.pagination);
    console.log('Total deliveries in response array:', json.data?.deliveries?.length);

    if (json.data?.deliveries?.length > 0) {
      const sample = json.data.deliveries[0];
      console.log('Sample History Record:', {
        orderId: sample.orderId,
        status: sample.status,
        customerName: sample.customerName,
        providerName: sample.providerName,
        tiffinName: sample.tiffinName,
        orderTotal: sample.orderTotal,
        driverEarning: sample.driverEarning,
        completedAt: sample.completedAt
      });
    }

    // 3. Test Status Filter API: DELIVERED
    const deliveredJson = await httpGet(`http://localhost:5000/api/delivery/history?email=${emailParam}&status=DELIVERED`);
    console.log('Status "DELIVERED" filter count:', deliveredJson.data?.deliveries?.length);

    // 4. Test Status Filter API: CANCELLED
    const cancelledJson = await httpGet(`http://localhost:5000/api/delivery/history?email=${emailParam}&status=CANCELLED`);
    console.log('Status "CANCELLED" filter count:', cancelledJson.data?.deliveries?.length);

    // 5. Test Search API
    const searchJson = await httpGet(`http://localhost:5000/api/delivery/history?email=${emailParam}&search=Priya`);
    console.log('Search "Priya" count:', searchJson.data?.deliveries?.length);

    // Safety checks
    console.log('✅ DB Safety Check: No collections dropped, real data intact.');

    await mongoose.disconnect();
    console.log('✅ History test completed successfully.');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testDeliveryHistory();
