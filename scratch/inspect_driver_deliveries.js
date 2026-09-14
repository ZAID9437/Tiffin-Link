const mongoose = require('../server/node_modules/mongoose');

async function inspectDb() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tiffinlink');
    console.log('Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    if (collections.some(c => c.name === 'deliveries')) {
      const sampleDeliveries = await db.collection('deliveries').find({}).limit(5).toArray();
      console.log('Sample Deliveries (up to 5):', JSON.stringify(sampleDeliveries, null, 2));

      const statuses = await db.collection('deliveries').distinct('status');
      console.log('Distinct Delivery statuses:', statuses);
    }

    if (collections.some(c => c.name === 'deliveryrequests')) {
      const sampleReqs = await db.collection('deliveryrequests').find({}).limit(3).toArray();
      console.log('Sample DeliveryRequests (up to 3):', JSON.stringify(sampleReqs, null, 2));
      const reqStatuses = await db.collection('deliveryrequests').distinct('status');
      console.log('Distinct DeliveryRequest statuses:', reqStatuses);
    }

    if (collections.some(c => c.name === 'orders')) {
      const sampleOrders = await db.collection('orders').find({}).limit(3).toArray();
      console.log('Sample Orders (up to 3):', JSON.stringify(sampleOrders, null, 2));
    }

    if (collections.some(c => c.name === 'reviews')) {
      const sampleReviews = await db.collection('reviews').find({}).limit(3).toArray();
      console.log('Sample Reviews (up to 3):', JSON.stringify(sampleReviews, null, 2));
    }

    if (collections.some(c => c.name === 'drivers')) {
      const sampleDrivers = await db.collection('drivers').find({}).limit(3).toArray();
      console.log('Sample Drivers (up to 3):', JSON.stringify(sampleDrivers, null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error inspecting DB:', err);
  }
}

inspectDb();
