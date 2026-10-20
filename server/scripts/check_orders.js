const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tiffinlink';

async function check() {
  await mongoose.connect(uri);
  const Order = require('../src/models/Order');
  const DeliveryRequest = require('../src/models/DeliveryRequest');
  const Driver = require('../src/models/Driver');
  const User = require('../src/models/User');

  console.log('=== DRIVERS ===');
  const drivers = await Driver.find().lean();
  console.log(drivers.map(d => ({ _id: d._id, driverId: d.driverId, name: d.name, phone: d.phone, email: d.email })));

  console.log('=== ORDERS (Delivered/Completed) ===');
  const orders = await Order.find({ status: { $in: ['Delivered', 'Completed', 'DELIVERED', 'COMPLETED'] } }).lean();
  console.log(orders.map(o => ({
    orderId: o.orderId,
    driverId: o.driverId,
    deliveryPartnerName: o.deliveryPartnerName,
    deliveryPartnerPhone: o.deliveryPartnerPhone,
    status: o.status,
    deliveryStatus: o.deliveryStatus,
    customerName: o.customerName
  })));

  console.log('=== DELIVERY REQUESTS (Delivered/Completed) ===');
  const reqs = await DeliveryRequest.find({ status: { $in: ['Delivered', 'Completed', 'DELIVERED', 'COMPLETED'] } }).lean();
  console.log(reqs.map(r => ({
    orderId: r.orderId,
    driverId: r.driverId,
    assignedDriver: r.assignedDriver,
    status: r.status,
    customerName: r.customerName
  })));

  await mongoose.disconnect();
}

check().catch(console.error);
