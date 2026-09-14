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

async function testWithCompletedDelivery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('✅ Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    // Set status of #ORD-2773 to DELIVERED for driver Ziyan Mansuri
    const result = await db.collection('deliveryrequests').updateOne(
      { orderId: '#ORD-2773' },
      { 
        $set: { 
          status: 'DELIVERED',
          deliveredAt: new Date(),
          completedAt: new Date(),
          dabbaReturned: true,
          containerReturnCredit: 15,
          driverEarning: 93,
          rating: 4.8,
          reviewComment: 'Tiffin was piping hot and courier was very courteous when swapping the dabba container!'
        } 
      }
    );

    console.log('Updated delivery request #ORD-2773 to DELIVERED:', result.modifiedCount);

    // Call API again
    const json = await httpGet('http://localhost:5000/api/delivery/completed?email=zaidmansuri3654@gmail.com');

    console.log('\n--- API Response with DELIVERED delivery ---');
    console.log('Success:', json.success);
    console.log('Stats:', json.data?.stats);
    console.log('Pagination:', json.pagination);
    console.log('Deliveries count:', json.data?.deliveries?.length);
    if (json.data?.deliveries?.length > 0) {
      const del = json.data.deliveries[0];
      console.log('Completed Delivery details:', {
        orderId: del.orderId,
        status: del.status,
        customerName: del.customerName,
        providerName: del.providerName,
        tiffinName: del.tiffinName,
        orderTotal: del.orderTotal,
        driverEarning: del.driverEarning,
        dabbaCredit: del.dabbaCredit,
        deliveredAt: del.deliveredAt,
        rating: del.rating
      });
    }

    await mongoose.disconnect();
    console.log('✅ Verification completed.');
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testWithCompletedDelivery();
