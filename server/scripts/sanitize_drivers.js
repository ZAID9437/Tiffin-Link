const mongoose = require('mongoose');

async function sanitize() {
  await mongoose.connect('mongodb://localhost:27017/tiffinlink');
  const collection = mongoose.connection.collection('deliveryrequests');
  const defaultDriver = {
    driverId: '',
    name: '',
    phone: '',
    rating: 4.8,
    vehicleNo: '',
    location: { lat: 23.0280, lng: 72.5670, accuracy: 0, updatedAt: new Date() }
  };
  const res = await collection.updateMany(
    { $or: [{ assignedDriver: null }, { assignedDriver: { $exists: false } }] },
    { $set: { assignedDriver: defaultDriver } }
  );
  console.log('Sanitized delivery requests where assignedDriver was null/undefined:', res.modifiedCount);

  // Also check orders if any
  const orderCol = mongoose.connection.collection('orders');
  const orderRes = await orderCol.updateMany(
    { $or: [{ assignedDriver: null }] },
    { $unset: { assignedDriver: "" } }
  );
  console.log('Sanitized orders where assignedDriver was null:', orderRes.modifiedCount);

  await mongoose.disconnect();
}
sanitize().catch(console.error);
