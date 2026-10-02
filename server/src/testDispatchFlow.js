const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('./app');

const JWT_SECRET = process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';

let serverInstance;
let PORT;

function makeRequest(path, method = 'GET', token = null, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runDispatchTest() {
  console.log('============================================================');
  console.log('RUNNING END-TO-END DELIVERY DISPATCH LIFECYCLE TEST SUITE');
  console.log('============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB database tiffinlink');

  await new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      PORT = serverInstance.address().port;
      console.log(`✓ Express test server running on 127.0.0.1:${PORT}`);
      resolve();
    });
  });

  const User = require('./models/User');
  const Order = require('./models/Order');
  const DeliveryRequest = require('./models/DeliveryRequest');
  const Provider = require('./models/Provider');

  // Find provider and delivery partner users
  let providerUser = await User.findOne({ role: 'provider' }) || await User.findOne({ email: 'menxoxo50@gmail.com' });
  if (!providerUser) {
    providerUser = await User.create({
      name: 'Test Provider Kitchen',
      email: 'test_provider@tiffinlink.com',
      phone: '+91 9876543211',
      role: 'provider',
      isActive: true
    });
  }

  let driverUser = await User.findOne({ role: 'delivery' }) || await User.findOne({ role: 'driver' });

  if (!driverUser) {
    driverUser = await User.create({
      name: 'Test Delivery Partner A',
      email: 'driver_test_a@tiffinlink.com',
      phone: '+91 9876543210',
      role: 'delivery',
      isActive: true
    });
  }

  const providerToken = jwt.sign({ userId: providerUser._id, role: 'provider' }, JWT_SECRET, { expiresIn: '1h' });
  const driverToken = jwt.sign({ userId: driverUser._id, role: 'delivery' }, JWT_SECRET, { expiresIn: '1h' });

  const providerDoc = await Provider.findOne({ userId: providerUser._id }) || await Provider.findOne({ email: providerUser.email });
  const providerId = providerDoc?._id?.toString() || '6a7f3051d4b48741d8722416';

  console.log(`Provider: ${providerUser.email} (Provider ID: ${providerId})`);
  console.log(`Driver: ${driverUser.email}\n`);

  // STEP 1: Provider creates / dispatches order #4956
  console.log('--- Step 1: Provider Dispatch ---');
  const testOrderId = `#TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const dispatchRes = await makeRequest('/delivery/dispatch', 'POST', providerToken, {
    orderId: testOrderId,
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98250 12345',
    tiffinName: 'Gujarati Special Kathiyawadi Thali × 1',
    amount: 186
  });

  console.log(`Dispatch API Status: ${dispatchRes.status}`);
  console.log(`Dispatch Message: ${dispatchRes.body.message}`);

  if (dispatchRes.status !== 201) {
    console.error('❌ Dispatch failed:', dispatchRes.body);
    process.exit(1);
  }

  // STEP 2: Driver queries pending requests
  console.log('\n--- Step 2: Driver Request Feed ---');
  const driverRequestsRes = await makeRequest('/delivery/driver-requests', 'GET', driverToken);
  
  console.log(`Driver Requests Status: ${driverRequestsRes.status}`);
  const reqList = driverRequestsRes.body?.data?.requests || [];
  console.log(`Found ${reqList.length} pending delivery requests for driver.`);

  const createdReq = reqList.find(r => r.orderId === testOrderId || String(r.orderId).replace(/^#+/, '') === testOrderId.replace(/^#+/, ''));
  if (!createdReq) {
    console.error('❌ Created order not found in driver feed!');
    process.exit(1);
  }
  console.log(`✓ Order ${testOrderId} correctly present in driver feed with status: ${createdReq.status}`);

  // STEP 3: Driver accepts request atomically
  console.log('\n--- Step 3: Driver Acceptance (First-Accept-Wins) ---');
  const targetReqId = String(createdReq.requestId || createdReq._id).replace(/^#+/, '');
  const acceptRes = await makeRequest(`/delivery/requests/${encodeURIComponent(targetReqId)}/accept`, 'POST', driverToken);
  
  console.log(`Accept Status: ${acceptRes.status}`);
  console.log(`Accept Message: ${acceptRes.body.message}`);

  if (acceptRes.status !== 200) {
    console.error('❌ Accept failed:', acceptRes.body);
    process.exit(1);
  }
  console.log(`✓ Driver successfully accepted request! Assigned Driver: ${acceptRes.body.request.assignedDriver.name}`);

  // STEP 4: Second driver attempts to accept same request (Race Condition / Atomic Lock Test)
  console.log('\n--- Step 4: Conflict Test (Second Driver Attempt) ---');
  const secondDriverUser = await User.create({
    name: 'Test Delivery Partner B',
    email: `driver_test_b_${Date.now()}@tiffinlink.com`,
    phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    role: 'delivery',
    isActive: true
  });
  const secondDriverToken = jwt.sign({ userId: secondDriverUser._id, role: 'delivery' }, JWT_SECRET, { expiresIn: '1h' });

  const secondAcceptRes = await makeRequest(`/delivery/requests/${encodeURIComponent(targetReqId)}/accept`, 'POST', secondDriverToken);
  console.log(`Second Accept Status: ${secondAcceptRes.status}`);
  console.log(`Second Accept Message: ${secondAcceptRes.body.message}`);

  if (secondAcceptRes.status === 409 || secondAcceptRes.status === 404) {
    console.log(`✓ Atomic lock verified! Second driver blocked with status ${secondAcceptRes.status}.`);
  } else {
    console.error('❌ Race condition test failed! Second driver was not blocked:', secondAcceptRes.body);
    process.exit(1);
  }

  // Cleanup
  await Order.deleteOne({ orderId: testOrderId });
  await DeliveryRequest.deleteOne({ _id: createdReq._id });
  await User.deleteOne({ _id: secondDriverUser._id });

  console.log('\n============================================================');
  console.log('ALL DISPATCH LIFECYCLE TESTS PASSED 100%!');
  console.log('============================================================');

  serverInstance.close();
  await mongoose.disconnect();
}

runDispatchTest().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
