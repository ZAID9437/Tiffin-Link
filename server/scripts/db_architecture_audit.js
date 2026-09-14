const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';

async function runDeepAudit() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    const db = mongoose.connection.db;

    // 1. Collections Audit
    const collections = await db.listCollections().toArray();
    console.log('\n========================================');
    console.log('1. MONGODB COLLECTIONS OVERVIEW (' + collections.length + ')');
    console.log('========================================');
    collections.forEach(c => console.log(` - ${c.name}`));

    // 2. Users Audit
    const users = await db.collection('users').find({}).toArray();
    console.log('\n========================================');
    console.log('2. USERS COLLECTION AUDIT (' + users.length + ' documents)');
    console.log('========================================');
    users.forEach((u, i) => {
      console.log(`[${i+1}] ID: ${u._id} | Name: ${u.fullName || u.name} | Email: ${u.email} | Phone: ${u.phone || 'N/A'} | Role: ${u.role || u.userType}`);
    });

    // 3. Drivers Audit
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log('\n========================================');
    console.log('3. DRIVERS COLLECTION AUDIT (' + drivers.length + ' documents)');
    console.log('========================================');
    let driversWithUser = 0;
    let driversMissingUser = 0;
    const driverIdsSet = new Set();
    const duplicateDriverIds = [];

    drivers.forEach((d, i) => {
      const dIdStr = d.driverId || String(d._id);
      if (driverIdsSet.has(dIdStr)) duplicateDriverIds.push(dIdStr);
      driverIdsSet.add(dIdStr);

      const userMatch = users.find(u => 
        (d.userId && String(u._id) === String(d.userId)) || 
        (d.email && u.email && d.email.toLowerCase() === u.email.toLowerCase()) ||
        (d.phone && u.phone && d.phone === u.phone)
      );

      if (userMatch) driversWithUser++;
      else driversMissingUser++;

      console.log(`[${i+1}] ID: ${d._id} | DriverId: ${d.driverId} | Name: ${d.name} | Phone: ${d.phone} | Email: ${d.email || 'N/A'} | VehicleNo: ${d.vehicleNo || d.vehicleNumber || 'N/A'} | Linked User: ${userMatch ? userMatch._id + ' (' + userMatch.role + ')' : 'NONE'}`);
    });

    // 4. Providers Audit
    const providers = await db.collection('providers').find({}).toArray();
    console.log('\n========================================');
    console.log('4. PROVIDERS COLLECTION AUDIT (' + providers.length + ' documents)');
    console.log('========================================');
    let providersWithUser = 0;
    let providersMissingUser = 0;

    providers.forEach((p, i) => {
      const userMatch = users.find(u => 
        (p.userId && String(u._id) === String(p.userId)) || 
        (p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase()) ||
        (p.phone && u.phone && p.phone === u.phone)
      );

      if (userMatch) providersWithUser++;
      else providersMissingUser++;

      console.log(`[${i+1}] ID: ${p._id} | BusinessName: ${p.businessName || p.name} | Email: ${p.email} | Phone: ${p.phone || 'N/A'} | Linked User: ${userMatch ? userMatch._id + ' (' + userMatch.role + ')' : 'NONE'}`);
    });

    // 5. Xoxo Men Deep Audit
    console.log('\n========================================');
    console.log('5. DEEP AUDIT: XOXO MEN ACCOUNTS');
    console.log('========================================');
    const xoxoUsers = users.filter(u => (u.email && u.email.includes('xoxo')) || (u.fullName && u.fullName.includes('Xoxo')));
    const xoxoProviders = providers.filter(p => (p.email && p.email.includes('xoxo')) || (p.businessName && p.businessName.includes('Xoxo')));
    const xoxoDrivers = drivers.filter(d => (d.email && d.email.includes('xoxo')) || (d.name && d.name.includes('Xoxo')));

    console.log(`Xoxo Men Users (${xoxoUsers.length}):`, xoxoUsers.map(u => ({ id: u._id, name: u.fullName || u.name, role: u.role, email: u.email })));
    console.log(`Xoxo Men Providers (${xoxoProviders.length}):`, xoxoProviders.map(p => ({ id: p._id, name: p.businessName || p.name, email: p.email })));
    console.log(`Xoxo Men Drivers (${xoxoDrivers.length}):`, xoxoDrivers.map(d => ({ id: d._id, driverId: d.driverId, name: d.name, email: d.email })));

    // 6. Orders & DeliveryRequests Audit
    const orders = await db.collection('orders').find({}).toArray();
    const delReqs = await db.collection('deliveryrequests').find({}).toArray();
    console.log('\n========================================');
    console.log('6. ORDERS & DELIVERIES AUDIT');
    console.log('========================================');
    console.log(`Total Orders: ${orders.length}`);
    console.log(`Total Delivery Requests: ${delReqs.length}`);

    // Check sample requests e.g. #DEL-1029 / #1024
    const sampleReq = delReqs.find(r => r.requestId === '#DEL-1029' || r.orderId === '#1024' || r.orderId === '#5155');
    if (sampleReq) {
      console.log('\nSample Delivery Request Audit:', {
        requestId: sampleReq.requestId,
        orderId: sampleReq.orderId,
        providerEmail: sampleReq.providerEmail,
        providerName: sampleReq.providerName,
        customerName: sampleReq.customerName,
        assignedDriver: sampleReq.assignedDriver,
        status: sampleReq.status
      });
    }

    // 7. Audit Summary Report
    console.log('\n========================================');
    console.log('7. MANDATORY AUDIT SUMMARY STATS');
    console.log('========================================');
    console.log(`- Total Users: ${users.length}`);
    console.log(`- Total Drivers: ${drivers.length}`);
    console.log(`- Total Providers: ${providers.length}`);
    console.log(`- Drivers with valid User relation: ${driversWithUser}`);
    console.log(`- Drivers missing User relation: ${driversMissingUser}`);
    console.log(`- Providers with valid User relation: ${providersWithUser}`);
    console.log(`- Providers missing User relation: ${providersMissingUser}`);
    console.log(`- Duplicate driverIds: ${duplicateDriverIds.length}`);

    await mongoose.disconnect();
    console.log('\nAudit script complete.');
  } catch (err) {
    console.error('Error running deep audit:', err);
    process.exit(1);
  }
}

runDeepAudit();
