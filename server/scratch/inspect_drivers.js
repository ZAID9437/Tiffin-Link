const mongoose = require('mongoose');
const db = require('../src/config/db');
const Driver = require('../src/models/Driver');
const User = require('../src/models/User');

async function run() {
  await db.ensureConnected();
  
  console.log('=== DRIVERS COLLECTION ===');
  const drivers = await Driver.find({});
  console.log(`Total Drivers in MongoDB: ${drivers.length}`);
  drivers.forEach((d, idx) => {
    console.log(`[${idx+1}] ID: ${d._id} | DriverId: ${d.driverId} | Name: ${d.name} | Phone: ${d.phone} | Vehicle: ${d.vehicleNo} | Status: ${d.status}`);
  });

  console.log('\n=== USERS COLLECTION ===');
  const users = await User.find({});
  console.log(`Total Users in MongoDB: ${users.length}`);
  users.forEach((u, idx) => {
    console.log(`[${idx+1}] ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
