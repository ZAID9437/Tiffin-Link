const mongoose = require('mongoose');
require('dotenv').config();

async function inspect() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const drivers = await db.collection('drivers').find().toArray();
  console.log('=== DRIVERS IN DB (' + drivers.length + ') ===');
  drivers.forEach(d => console.log(d._id, d.name, d.phone, d.driverId, d.status));

  const kyc = await db.collection('driverkycs').find().toArray();
  console.log('=== DRIVER KYCS IN DB (' + kyc.length + ') ===');
  kyc.forEach(k => console.log(k._id, k.name, k.id, k.status));

  const tel = await db.collection('drivertelemetries').find().toArray();
  console.log('=== DRIVER TELEMETRIES IN DB (' + tel.length + ') ===');
  tel.forEach(t => console.log(t._id, t.name, t.id, t.status));

  const users = await db.collection('users').find({ role: 'driver' }).toArray();
  console.log('=== USERS WITH ROLE DRIVER (' + users.length + ') ===');
  users.forEach(u => console.log(u._id, u.name, u.phone, u.role));

  await mongoose.disconnect();
}

inspect();
