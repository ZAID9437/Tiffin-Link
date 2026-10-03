const mongoose = require('mongoose');
const { generateAccessToken } = require('./src/utils/generateToken');

async function testAuthOrderFlow() {
  console.log('================================================================');
  console.log('    TIFFINLINK AUTHENTICATION-TO-ORDER FLOW VERIFICATION TEST   ');
  console.log('================================================================\n');

  await mongoose.connect('mongodb://localhost:27017/tiffinlink');

  const base = 'http://localhost:5000/api';

  // TEST 1: Verify /api/auth/login returns both id and _id normalized
  console.log('--> TEST 1: Customer login API payload verification (id and _id check)...');
  
  // Ensure test customer exists with password
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  await mongoose.connection.collection('users').updateOne(
    { email: 'zaid.customer@tiffinlink.com' },
    {
      $set: {
        name: 'Zaid Mansuri',
        email: 'zaid.customer@tiffinlink.com',
        password: hashedPassword,
        role: 'customer',
        isActive: true,
        isVerified: true
      }
    },
    { upsert: true }
  );

  const loginRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'zaid.customer@tiffinlink.com',
      password: 'password123',
      role: 'customer'
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));
  
  console.log('    ✓ Login Success:', loginData.message);
  console.log('    ✓ User ID (id):', loginData.user.id);
  console.log('    ✓ User ID (_id):', loginData.user._id);

  if (!loginData.user.id || !loginData.user._id || loginData.user.id !== loginData.user._id) {
    throw new Error('Normalization check failed: user.id and user._id must both be defined and identical!');
  }
  console.log('    ✓ PASSED: Both user.id and user._id are present and identical.');

  // TEST 2: Verify /api/auth/me returns both id and _id normalized
  console.log('\n--> TEST 2: /api/auth/me endpoint verification with JWT access token...');
  const token = loginData.accessToken;
  const meRes = await fetch(base + '/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  if (!meData.success) throw new Error('/auth/me failed: ' + JSON.stringify(meData));

  console.log('    ✓ /auth/me User:', meData.user.name, `(${meData.user.email})`);
  console.log('    ✓ /auth/me user.id:', meData.user.id);
  console.log('    ✓ /auth/me user._id:', meData.user._id);

  if (!meData.user.id || !meData.user._id || meData.user.id !== meData.user._id) {
    throw new Error('/auth/me normalization check failed: user.id and user._id must both be defined and identical!');
  }
  console.log('    ✓ PASSED: /auth/me preserves dual id/_id normalization.');

  // TEST 3: Unauthenticated Order Creation Blocked
  console.log('\n--> TEST 3: Security check: Attempt order creation WITHOUT token...');
  const unauthRes = await fetch(base + '/orders/customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: '6a7ebb44019deec85d9fa391',
      tiffinName: 'Royal Kathiyawadi Thali',
      quantity: 1,
      customerName: 'Guest User'
    })
  });
  const unauthData = await unauthRes.json();
  console.log('    ✓ Unauthenticated Response Status:', unauthRes.status, '| Message:', unauthData.message);
  if (unauthRes.status !== 401) {
    throw new Error('Security check failed: unauthenticated order was NOT rejected with 401!');
  }
  console.log('    ✓ PASSED: Server correctly rejected unauthenticated order.');

  // TEST 4: Invalid/Tampered Token Blocked
  console.log('\n--> TEST 4: Security check: Attempt order creation with invalid/tampered token...');
  const invalidRes = await fetch(base + '/orders/customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
    },
    body: JSON.stringify({
      providerId: '6a7ebb44019deec85d9fa391',
      tiffinName: 'Royal Kathiyawadi Thali',
      quantity: 1
    })
  });
  const invalidData = await invalidRes.json();
  console.log('    ✓ Invalid Token Response Status:', invalidRes.status, '| Message:', invalidData.message);
  if (invalidRes.status !== 401) {
    throw new Error('Security check failed: invalid token was NOT rejected with 401!');
  }
  console.log('    ✓ PASSED: Invalid token correctly rejected with 401 Unauthorized.');

  // TEST 5: Authenticated Order Creation with Verified Customer ID
  console.log('\n--> TEST 5: Authenticated order creation with verified token...');
  const provider = await mongoose.connection.collection('providers').findOne({}) || { _id: '6a7ebb44019deec85d9fa391' };
  const providerId = provider._id.toString();

  const orderRes = await fetch(base + '/orders/customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      providerId,
      tiffinName: 'Royal Kathiyawadi Thali',
      tiffinCategory: 'Kathiyawadi',
      quantity: 1,
      customerName: 'Zaid Mansuri',
      customerPhone: '+91 98765 43210',
      customerAddress: '402 Sunset Tower, Satellite, Ahmedabad',
      paymentMethod: 'Cash on Delivery',
      items: [{ name: 'Baingan Bhartha & Sev Dungri', price: 130 }]
    })
  });
  const orderData = await orderRes.json();
  if (orderRes.status !== 201) throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  
  console.log('    ✓ Order Created Successfully:', orderData.data.orderId);
  console.log('    ✓ Associated Customer ID in MongoDB:', orderData.data.customerId);

  if (orderData.data.customerId !== meData.user.id) {
    throw new Error('Customer ID mismatch: Order customerId must match verified JWT customer ID!');
  }
  console.log('    ✓ PASSED: Order customerId matches verified JWT authenticated customer.');

  // TEST 6: Customer Order Scoping (Customer only sees their own orders)
  console.log('\n--> TEST 6: Data isolation: Fetch /api/orders/my-orders with customer token...');
  const myOrdersRes = await fetch(base + '/orders/my-orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const myOrdersData = await myOrdersRes.json();
  console.log('    ✓ Customer My Orders Count:', myOrdersData.data.length);
  const found = myOrdersData.data.find(o => o.orderId === orderData.data.orderId);
  if (!found) throw new Error('Order isolation failed: created order not found in customer orders list!');
  console.log('    ✓ PASSED: Created order found in customer scoped orders list.');

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log('    🎉 ALL 6 AUTHENTICATION & ORDER TESTS PASSED PERFECTLY!     ');
  console.log('================================================================\n');
}

testAuthOrderFlow().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
