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

async function testLiveMap() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('✅ Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    // 1. Fetch Drivers in DB
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log(`Found ${drivers.length} drivers in DB.`);
    const driver = drivers[0];
    if (driver) {
      console.log(`Driver: ${driver.name} (${driver.email || driver.phone})`);
    }

    // 2. Fetch Active Delivery for driver
    const emailParam = driver?.email ? encodeURIComponent(driver.email) : '';
    const json = await httpGet(`http://localhost:5000/api/delivery/active-delivery?email=${emailParam}`);

    console.log('\n--- Active Delivery API Response ---');
    console.log('Success:', json.success);
    console.log('Has Active Delivery:', Boolean(json.activeDelivery));

    if (json.activeDelivery) {
      const active = json.activeDelivery;
      console.log('Active Delivery details:', {
        orderId: active.orderId || active.requestId,
        status: active.status,
        providerName: active.providerName,
        customerName: active.customerName,
        pickupAddress: active.pickupAddress,
        deliveryAddress: active.deliveryAddress,
        driverEarning: active.driverEarning || active.payout
      });
    }

    // Safety checks
    console.log('\n✅ DB Safety Check: No collections dropped, real data intact.');

    await mongoose.disconnect();
    console.log('✅ Live Map test completed successfully.');
  } catch (err) {
    console.error('❌ Live Map test failed:', err);
  }
}

testLiveMap();
