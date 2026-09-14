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

async function testCancelledHistory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('✅ Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    // Check if there is a cancelled delivery request or insert one for driver Ziyan Mansuri
    const existingCancelled = await db.collection('deliveryrequests').findOne({ status: 'CANCELLED' });

    if (!existingCancelled) {
      await db.collection('deliveryrequests').insertOne({
        requestId: '#DEL-1002',
        orderId: '#ORD-4113',
        providerId: '6a7f3051d4b48741d8722416',
        providerEmail: 'menxoxo50@gmail.com',
        providerName: 'Ghar Ka Khana',
        customerName: 'Rahul Patel',
        customerPhone: '+91 98765 43210',
        deliveryAddress: { street: 'Prahlad Nagar, Ahmedabad', city: 'Ahmedabad' },
        pickupAddress: { street: 'Satellite, Ahmedabad', city: 'Ahmedabad' },
        assignedDriver: {
          driverId: '6aa03a9d09b952ceb1a40c21',
          name: 'Ziyan Mansuri',
          phone: '+91 9558601570'
        },
        status: 'CANCELLED',
        cancellationReason: 'Customer requested cancellation prior to pickup',
        amount: 320,
        driverEarning: 0,
        tiffinName: 'Gujarati Thali Special × 2',
        requestedAt: new Date('2026-09-13T12:50:00Z'),
        createdAt: new Date('2026-09-13T12:50:00Z')
      });
      console.log('Inserted sample cancelled delivery request #ORD-4113');
    }

    // Call API
    const json = await httpGet('http://localhost:5000/api/delivery/history?email=zaidmansuri3654@gmail.com');

    console.log('\n--- API History Response with Cancelled Trip ---');
    console.log('Success:', json.success);
    console.log('Stats:', json.data?.stats);
    console.log('Total deliveries:', json.data?.deliveries?.length);

    const cancelledItem = json.data?.deliveries?.find(d => d.status === 'CANCELLED');
    if (cancelledItem) {
      console.log('\nCancelled Delivery Item payload:', {
        orderId: cancelledItem.orderId,
        status: cancelledItem.status,
        customerName: cancelledItem.customerName,
        providerName: cancelledItem.providerName,
        driverEarning: cancelledItem.driverEarning,
        paymentStatus: cancelledItem.paymentStatus,
        cancellationReason: cancelledItem.cancellationReason
      });
    }

    await mongoose.disconnect();
    console.log('✅ Cancelled history flow test completed.');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testCancelledHistory();
