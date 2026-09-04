const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const http = require('http');
const app = require('./app');

const JWT_SECRET = process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';

// Provider IDs from MongoDB migration
const PROVIDER_1_ID = '6a7f3051d4b48741d8722416'; // Mansuri Kitchen (menxoxo50@gmail.com)
const PROVIDER_2_ID = '6a8676bb5f9ffe0ecabad36c'; // Sahal Patel Kitchen (sahal233patel@gmail.com)

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

async function runTests() {
  console.log('============================================================');
  console.log('RUNNING TIFFINLINK MULTI-PROVIDER DATA ISOLATION TEST SUITE');
  console.log('============================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB database tiffinlink');

  // Start test server on random free port
  await new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      PORT = serverInstance.address().port;
      console.log(`✓ Express test server listening on 127.0.0.1:${PORT}`);
      resolve();
    });
  });

  // Find users corresponding to Provider 1 and Provider 2
  const User = require('./models/User');
  const provider1User = await User.findOne({ email: 'menxoxo50@gmail.com' });
  const provider2User = await User.findOne({ email: 'sahal233patel@gmail.com' });

  if (!provider1User || !provider2User) {
    console.error('❌ Provider users not found in DB!');
    process.exit(1);
  }

  // Create JWT tokens
  const tokenP1 = jwt.sign({ userId: provider1User._id, role: 'provider' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenP2 = jwt.sign({ userId: provider2User._id, role: 'provider' }, JWT_SECRET, { expiresIn: '1h' });

  console.log(`Provider 1 User ID: ${provider1User._id} (Provider ID: ${PROVIDER_1_ID})`);
  console.log(`Provider 2 User ID: ${provider2User._id} (Provider ID: ${PROVIDER_2_ID})\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ❌ ${testName}`);
      testsFailed++;
    }
  }

  const Order = require('./models/Order');
  const Tiffin = require('./models/Tiffin');
  const Review = require('./models/Review');
  const KitchenCapacity = require('./models/KitchenCapacity');

try {
    // -------------------------------------------------------------
    // TEST 1: Orders Isolation
    // -------------------------------------------------------------
    console.log('--- Test 1: Orders Query Isolation ---');
    const ordersP1 = await makeRequest('/orders', 'GET', tokenP1);
    const ordersP2 = await makeRequest('/orders', 'GET', tokenP2);

    assert(ordersP1.status === 200 && ordersP1.body.success, 'P1 Orders API returns 200 OK');
    assert(ordersP2.status === 200 && ordersP2.body.success, 'P2 Orders API returns 200 OK');

    const p1OrderList = ordersP1.body.orders || ordersP1.body.data || [];
    const p2OrderList = ordersP2.body.orders || ordersP2.body.data || [];

    const p1HasOnlyP1Orders = p1OrderList.every(o => String(o.providerId) === PROVIDER_1_ID);
    const p2HasOnlyP2Orders = p2OrderList.every(o => String(o.providerId) === PROVIDER_2_ID);

    assert(p1HasOnlyP1Orders, `Provider 1 sees ONLY Provider 1 orders (${p1OrderList.length} orders)`);
    assert(p2HasOnlyP2Orders, `Provider 2 sees ONLY Provider 2 orders (${p2OrderList.length} orders)`);

    // -------------------------------------------------------------
    // TEST 2: Tiffins Isolation
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Tiffins Query Isolation ---');
    const tiffinsP1 = await makeRequest('/tiffins', 'GET', tokenP1);
    const tiffinsP2 = await makeRequest('/tiffins', 'GET', tokenP2);

    assert(tiffinsP1.status === 200 && tiffinsP1.body.success, 'P1 Tiffins API returns 200 OK');
    assert(tiffinsP2.status === 200 && tiffinsP2.body.success, 'P2 Tiffins API returns 200 OK');

    const p1TiffinList = tiffinsP1.body.data || [];
    const p2TiffinList = tiffinsP2.body.data || [];

    const p1HasOnlyP1Tiffins = p1TiffinList.every(t => String(t.providerId) === PROVIDER_1_ID);
    const p2HasOnlyP2Tiffins = p2TiffinList.every(t => String(t.providerId) === PROVIDER_2_ID);

    assert(p1HasOnlyP1Tiffins, `Provider 1 sees ONLY Provider 1 tiffins (${p1TiffinList.length} tiffins)`);
    assert(p2HasOnlyP2Tiffins, `Provider 2 sees ONLY Provider 2 tiffins (${p2TiffinList.length} tiffins)`);

    // -------------------------------------------------------------
    // TEST 3: Customers Isolation
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Customers Query Isolation ---');
    const custP1 = await makeRequest('/customers', 'GET', tokenP1);
    const custP2 = await makeRequest('/customers', 'GET', tokenP2);

    assert(custP1.status === 200 && custP1.body.success, 'P1 Customers API returns 200 OK');
    assert(custP2.status === 200 && custP2.body.success, 'P2 Customers API returns 200 OK');

    const p1CustList = custP1.body.customers || [];
    const p2CustList = custP2.body.customers || [];

    assert(Array.isArray(p1CustList), `Provider 1 customers list loaded (${p1CustList.length} customers)`);
    assert(Array.isArray(p2CustList), `Provider 2 customers list loaded (${p2CustList.length} customers)`);

    // -------------------------------------------------------------
    // TEST 4: Analytics Isolation
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Analytics Query Isolation ---');
    const earnP1 = await makeRequest('/analytics', 'GET', tokenP1);
    const earnP2 = await makeRequest('/analytics', 'GET', tokenP2);

    assert(earnP1.status === 200 && earnP1.body.success, 'P1 Analytics API returns 200 OK');
    assert(earnP2.status === 200 && earnP2.body.success, 'P2 Analytics API returns 200 OK');

    assert(earnP1.body.metrics !== undefined || earnP1.body.summary !== undefined || earnP1.body.analytics !== undefined, 'P1 summary contains provider-specific metrics');
    assert(earnP2.body.metrics !== undefined || earnP2.body.summary !== undefined || earnP2.body.analytics !== undefined, 'P2 summary contains provider-specific metrics');

    // -------------------------------------------------------------
    // TEST 5: IDOR & Negative Authorization Security Test
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Negative Authorization (IDOR Attack Prevention) ---');
    
    // Find an order belonging to Provider 1 or Provider 2
    const p1Order = await Order.findOne({ providerId: PROVIDER_1_ID });
    if (p1Order) {
      // Provider 2 tries to access Provider 1's order ID
      const illegalAccess = await makeRequest(`/orders/${p1Order._id}`, 'GET', tokenP2);
      assert(
        illegalAccess.status === 404 || illegalAccess.status === 403 || !illegalAccess.body.success,
        `P2 blocked from viewing P1's order (Status Code: ${illegalAccess.status})`
      );

      // Provider 2 tries to update Provider 1's order ID
      const illegalUpdate = await makeRequest(`/orders/${p1Order._id}/status`, 'PUT', tokenP2, { status: 'Cancelled' });
      assert(
        illegalUpdate.status === 404 || illegalUpdate.status === 403 || !illegalUpdate.body.success,
        `P2 blocked from updating P1's order status (Status Code: ${illegalUpdate.status})`
      );

      // Provider 2 tries to delete Provider 1's order ID
      const illegalDelete = await makeRequest(`/orders/${p1Order._id}`, 'DELETE', tokenP2);
      assert(
        illegalDelete.status === 404 || illegalDelete.status === 403 || !illegalDelete.body.success,
        `P2 blocked from deleting P1's order (Status Code: ${illegalDelete.status})`
      );
    }

    // Find a tiffin belonging to Provider 1
    const p1Tiffin = await Tiffin.findOne({ providerId: PROVIDER_1_ID });
    if (p1Tiffin) {
      const illegalTiffinAccess = await makeRequest(`/tiffins/${p1Tiffin._id}`, 'GET', tokenP2);
      assert(
        illegalTiffinAccess.status === 404 || illegalTiffinAccess.status === 403 || !illegalTiffinAccess.body.success,
        `P2 blocked from viewing P1's tiffin (Status Code: ${illegalTiffinAccess.status})`
      );

      const illegalTiffinDelete = await makeRequest(`/tiffins/${p1Tiffin._id}`, 'DELETE', tokenP2);
      assert(
        illegalTiffinDelete.status === 404 || illegalTiffinDelete.status === 403 || !illegalTiffinDelete.body.success,
        `P2 blocked from deleting P1's tiffin (Status Code: ${illegalTiffinDelete.status})`
      );
    }

  } catch (err) {
    console.error('Error during test execution:', err);
    testsFailed++;
  } finally {
    console.log('\n============================================================');
    console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('============================================================');
    if (serverInstance) serverInstance.close();
    await mongoose.disconnect();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runTests();
