const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';

async function inspectDb() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    const db = mongoose.connection.db;

    // Inspect Users
    const usersColl = db.collection('users');
    const users = await usersColl.find({}).toArray();
    console.log('\n--- ALL USERS (' + users.length + ') ---');
    users.forEach((u, i) => {
      console.log(`[${i+1}] ID: ${u._id} | Name: ${u.fullName || u.name} | Email: ${u.email} | Role: ${u.role || u.userType}`);
    });

    // Inspect Drivers
    const driversColl = db.collection('drivers');
    const drivers = await driversColl.find({}).toArray();
    console.log('\n--- ALL DRIVERS (' + drivers.length + ') ---');
    drivers.forEach((d, i) => {
      console.log(`[${i+1}] ID: ${d._id} | DriverId: ${d.driverId} | Name: ${d.name} | VehicleNo: ${d.vehicleNo || d.vehicleNumber} | Status: ${d.status} | Rating: ${d.rating}`);
    });

    // Check for hardcoded DRV-101 .. DRV-106 mock drivers in drivers collection
    const mockDriverIds = ['DRV-101', 'DRV-102', 'DRV-103', 'DRV-104', 'DRV-105', 'DRV-106'];
    const mockDriversInDb = drivers.filter(d => mockDriverIds.includes(d.driverId));
    console.log(`\nMock DRV-10x drivers in MongoDB: ${mockDriversInDb.length}`);

    await mongoose.disconnect();
    console.log('\nDone.');
  } catch (err) {
    console.error('Error inspecting DB:', err);
    process.exit(1);
  }
}

inspectDb();
