const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function pruneDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully!\n');

    const db = mongoose.connection.db;

    // Fetch existing delivery requests
    const deliveryRequestsCol = db.collection('deliveryrequests');
    const ordersCol = db.collection('orders');

    const allRequests = await deliveryRequestsCol.find({}).sort({ createdAt: -1 }).toArray();
    console.log(`Found ${allRequests.length} delivery requests in database.`);

    const keptOrderIds = ['#1024', '#1025', '#1026'];
    
    let idsToKeep = allRequests
      .filter(r => keptOrderIds.includes(String(r.orderId).trim()) || keptOrderIds.includes(`#${String(r.orderId).trim().replace(/^#+/, '')}`))
      .map(r => r._id);

    if (idsToKeep.length < 3) {
      idsToKeep = allRequests.slice(0, 3).map(r => r._id);
    }

    // Delete all other delivery requests
    const deleteReqResult = await deliveryRequestsCol.deleteMany({ _id: { $nin: idsToKeep } });
    console.log(`Deleted ${deleteReqResult.deletedCount} excess delivery requests. Kept ${idsToKeep.length} dynamic records.`);

    // Fetch remaining delivery requests to match orders
    const remainingRequests = await deliveryRequestsCol.find({}).toArray();
    const remainingOrderIds = remainingRequests.map(r => String(r.orderId).trim().replace(/^#+/, ''));

    // Prune orders collection to keep matching orders
    const allOrders = await ordersCol.find({}).toArray();
    const orderIdsToKeep = [];

    allOrders.forEach(o => {
      const cleanId = String(o.orderId || o._id).trim().replace(/^#+/, '');
      if (remainingOrderIds.includes(cleanId)) {
        orderIdsToKeep.push(o._id);
      }
    });

    const deleteOrdersResult = await ordersCol.deleteMany({ _id: { $nin: orderIdsToKeep } });
    console.log(`Deleted ${deleteOrdersResult.deletedCount} excess orders. Kept ${orderIdsToKeep.length} dynamic matching orders.`);

    // Print remaining records summary
    console.log('\n--- REMAINING DYNAMIC DELIVERY REQUESTS (3 DATA) ---');
    const finalRequests = await deliveryRequestsCol.find({}).toArray();
    finalRequests.forEach((r, i) => {
      console.log(`[${i + 1}] ID: ${r._id} | OrderId: ${r.orderId} | Customer: ${r.customerName} | Partner: ${r.deliveryPartnerName || 'Unassigned'} | Status: ${r.status}`);
    });

    console.log('\n--- REMAINING DYNAMIC ORDERS (3 DATA) ---');
    const finalOrders = await ordersCol.find({}).toArray();
    finalOrders.forEach((o, i) => {
      console.log(`[${i + 1}] ID: ${o._id} | OrderId: ${o.orderId} | Customer: ${o.customerName} | Tiffin: ${o.tiffinName} | Status: ${o.status}`);
    });

    console.log('\nDatabase cleanup complete successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error pruning database:', err);
    process.exit(1);
  }
}

pruneDatabase();
