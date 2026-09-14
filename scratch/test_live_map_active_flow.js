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

async function testActiveFlow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('✅ Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    // Set #ORD-8569 to ARRIVED_CUSTOMER for driver Ziyan Mansuri
    await db.collection('deliveryrequests').updateOne(
      { orderId: '#ORD-8569' },
      { $set: { status: 'ARRIVED_CUSTOMER', driverEarning: 93 } }
    );

    console.log('Set delivery request #ORD-8569 to ARRIVED_CUSTOMER');

    // Call active delivery API
    const json = await httpGet('http://localhost:5000/api/delivery/active-delivery?email=zaidmansuri3654@gmail.com');

    console.log('\n--- Active Delivery Payload ---');
    console.log('Success:', json.success);
    console.log('Has Active Delivery:', Boolean(json.activeDelivery));
    if (json.activeDelivery) {
      console.log('Active Delivery details:', {
        orderId: json.activeDelivery.orderId || json.activeDelivery.requestId,
        status: json.activeDelivery.status,
        providerName: json.activeDelivery.providerName,
        customerName: json.activeDelivery.customerName,
        pickupAddress: json.activeDelivery.pickupAddress,
        deliveryAddress: json.activeDelivery.deliveryAddress,
        driverEarning: json.activeDelivery.driverEarning
      });
    }

    await mongoose.disconnect();
    console.log('✅ Active flow verification complete.');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testActiveFlow();
