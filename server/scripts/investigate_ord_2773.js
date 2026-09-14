const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/tiffinlink';

async function investigate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  const db = mongoose.connection.db;

  const orders = await db.collection('orders').find({}).toArray();
  console.log('\n--- ORDERS IN DB ---');
  orders.forEach(o => {
    console.log({
      _id: o._id,
      orderId: o.orderId,
      status: o.status,
      deliveryStatus: o.deliveryStatus,
      deliveryPartnerName: o.deliveryPartnerName,
      customerName: o.customerName,
      totalAmount: o.totalAmount
    });
  });

  const requests = await db.collection('deliveryrequests').find({}).toArray();
  console.log('\n--- DELIVERY REQUESTS IN DB ---');
  requests.forEach(r => {
    console.log({
      _id: r._id,
      requestId: r.requestId,
      orderId: r.orderId,
      status: r.status,
      assignedDriver: r.assignedDriver,
      candidateDrivers: r.candidateDrivers
    });
  });

  const drivers = await db.collection('drivers').find({}).toArray();
  console.log('\n--- DRIVERS IN DB ---');
  drivers.forEach(d => {
    console.log({
      _id: d._id,
      driverId: d.driverId,
      name: d.name,
      status: d.status,
      activeDeliveries: d.activeDeliveries
    });
  });

  await mongoose.disconnect();
}

investigate();
