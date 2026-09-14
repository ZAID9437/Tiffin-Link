const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';

async function globalAudit() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    const db = mongoose.connection.db;

    // 1. Collections Overview
    const collections = await db.listCollections().toArray();
    console.log('\n--- COLLECTIONS IN TIFFINLINK (' + collections.length + ') ---');
    collections.forEach(c => console.log(` - ${c.name}`));

    // 2. Users Audit
    const users = await db.collection('users').find({}).toArray();
    console.log('\n--- USERS AUDIT (' + users.length + ') ---');
    const roleCounts = {};
    users.forEach(u => {
      const r = u.role || u.userType || 'UNKNOWN';
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    });
    console.log('User roles distribution:', roleCounts);

    // 3. Providers Audit
    const providers = await db.collection('providers').find({}).toArray();
    console.log('\n--- PROVIDERS AUDIT (' + providers.length + ') ---');
    providers.forEach((p, i) => {
      console.log(`[${i+1}] ID: ${p._id} | Name: ${p.businessName || p.name} | Email: ${p.email}`);
    });

    // 4. Drivers Audit
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log('\n--- DRIVERS AUDIT (' + drivers.length + ') ---');
    drivers.forEach((d, i) => {
      console.log(`[${i+1}] ID: ${d._id} | DriverId: ${d.driverId} | Name: ${d.name} | VehicleNo: ${d.vehicleNo || d.vehicleNumber} | Status: ${d.status}`);
    });

    // 5. Orders Audit
    const orders = await db.collection('orders').find({}).toArray();
    console.log('\n--- ORDERS AUDIT (' + orders.length + ') ---');
    const orderStatuses = {};
    orders.forEach(o => {
      orderStatuses[o.status] = (orderStatuses[o.status] || 0) + 1;
    });
    console.log('Order statuses distribution:', orderStatuses);

    // 6. Delivery Requests Audit
    const delReqs = await db.collection('deliveryrequests').find({}).toArray();
    console.log('\n--- DELIVERY REQUESTS AUDIT (' + delReqs.length + ') ---');
    const delStatuses = {};
    delReqs.forEach(d => {
      delStatuses[d.status] = (delStatuses[d.status] || 0) + 1;
    });
    console.log('Delivery request statuses distribution:', delStatuses);

    await mongoose.disconnect();
    console.log('\nGlobal Audit Complete.');
  } catch (err) {
    console.error('Error during global audit:', err);
    process.exit(1);
  }
}

globalAudit();
