const path = require('path');
const mongoose = require(path.join(__dirname, 'server/node_modules/mongoose'));

async function resetDelivery() {
  await mongoose.connect('mongodb://localhost:27017/tiffinlink');
  const db = mongoose.connection.db;

  await db.collection('deliveryrequests').updateOne(
    { orderId: '#ORD-8569' },
    {
      $set: {
        status: 'ARRIVED_CUSTOMER',
        customerHandoverOtpVerified: false,
        completedAt: null
      }
    }
  );

  await db.collection('orders').updateOne(
    { orderId: '#ORD-8569' },
    {
      $set: {
        status: 'Ready',
        deliveryStatus: 'Arrived at Customer',
        customerHandoverOtpVerified: false,
        completedAt: null,
        deliveredAt: null
      }
    }
  );

  console.log('✓ Reset #ORD-8569 status to ARRIVED_CUSTOMER for testing');
  await mongoose.disconnect();
}

resetDelivery();
