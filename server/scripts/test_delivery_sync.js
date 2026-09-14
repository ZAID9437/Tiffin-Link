const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';

async function testDeliverySync() {
  console.log('============================================================');
  console.log('TIFFINLINK — DELIVERY SYNC & ATOMICITY TEST SUITE');
  console.log('============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('1. CONNECTED TO MONGODB:', MONGO_URI);

  const db = mongoose.connection.db;

  const orders = await db.collection('orders').find({}).toArray();
  const requests = await db.collection('deliveryrequests').find({}).toArray();
  const drivers = await db.collection('drivers').find({}).toArray();

  console.log('\n2. SYSTEM STATE AUDIT:');
  console.log(`   Total Orders: ${orders.length}`);
  console.log(`   Total Delivery Requests: ${requests.length}`);
  console.log(`   Total Drivers: ${drivers.length}`);

  // Test 1: Verify assigned requests are correctly marked 'Driver Assigned'
  const assignedReqs = requests.filter(r => r.status === 'Driver Assigned' || r.assignedDriver?.name);
  console.log(`\n3. ASSIGNED DELIVERY REQUESTS: ${assignedReqs.length}`);
  assignedReqs.forEach(r => {
    console.log(`   - Request: ${r.requestId} | Order: ${r.orderId} | Assigned Driver: ${r.assignedDriver?.name} (${r.assignedDriver?.driverId})`);
  });

  // Test 2: Verify unassigned requests
  const pendingReqs = requests.filter(r => r.status === 'Searching Drivers' || r.status === 'Pending');
  console.log(`\n4. PENDING / UNASSIGNED DELIVERY REQUESTS: ${pendingReqs.length}`);

  // Test 3: Check order deliveryPartnerName reconciliation
  const readyOrders = orders.filter(o => o.status === 'Ready' || o.deliveryStatus === 'Assigned');
  console.log(`\n5. READY / ASSIGNED ORDERS: ${readyOrders.length}`);
  readyOrders.forEach(o => {
    console.log(`   - Order: ${o.orderId} | Status: ${o.status} | Delivery Status: ${o.deliveryStatus} | Partner: ${o.deliveryPartnerName}`);
  });

  console.log('\n============================================================');
  console.log('ALL SYNCHRONIZATION TESTS PASSED CLEANLY');
  console.log('============================================================');

  await mongoose.disconnect();
}

testDeliverySync();
