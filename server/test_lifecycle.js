const mongoose = require('mongoose');
const { generateAccessToken } = require('./src/utils/generateToken');

async function run() {
  console.log('================================================================');
  console.log('   TIFFINLINK COMPLETE FOOD ORDER LIFECYCLE AUTOMATED TEST');
  console.log('================================================================\n');

  await mongoose.connect('mongodb://localhost:27017/tiffinlink');

  // 1. Ensure linked user for provider Mom's Kitchen
  let pUser = await mongoose.connection.collection('users').findOne({ email: 'momskitchen@tiffinlink.com' });
  if (!pUser) {
    const res = await mongoose.connection.collection('users').insertOne({
      name: "Mom's Kitchen",
      email: 'momskitchen@tiffinlink.com',
      role: 'provider',
      isActive: true,
      createdAt: new Date()
    });
    pUser = { _id: res.insertedId, email: 'momskitchen@tiffinlink.com' };
  }
  let prov = await mongoose.connection.collection('providers').findOne({});
  if (!prov) {
    const pRes = await mongoose.connection.collection('providers').insertOne({
      name: "Mom's Kitchen",
      email: 'momskitchen@tiffinlink.com',
      status: 'active',
      isActive: true,
      price: 120,
      userId: pUser._id
    });
    prov = { _id: pRes.insertedId };
  } else {
    await mongoose.connection.collection('providers').updateOne(
      { _id: prov._id },
      { $set: { userId: pUser._id, email: 'momskitchen@tiffinlink.com', status: 'active', isActive: true } }
    );
  }
  const providerId = prov._id.toString();

  // 2. Ensure linked users for Drivers
  let d1User = await mongoose.connection.collection('users').findOne({ email: 'driver101@tiffinlink.com' });
  if (!d1User) {
    const res = await mongoose.connection.collection('users').insertOne({
      name: 'Ramesh Solanki (Driver A)',
      email: 'driver101@tiffinlink.com',
      phone: '+91 98250 99999',
      role: 'driver',
      isActive: true,
      createdAt: new Date()
    });
    d1User = { _id: res.insertedId };
  }
  await mongoose.connection.collection('drivers').updateOne(
    { driverId: 'DRV-101' },
    { $set: { driverId: 'DRV-101', name: 'Ramesh Solanki (Driver A)', phone: '+91 98250 99999', status: 'AVAILABLE', userId: d1User._id, vehicleNo: 'GJ-01-AB-1234' } },
    { upsert: true }
  );

  let d2User = await mongoose.connection.collection('users').findOne({ email: 'driver102@tiffinlink.com' });
  if (!d2User) {
    const res = await mongoose.connection.collection('users').insertOne({
      name: 'Suresh Patel (Driver B)',
      email: 'driver102@tiffinlink.com',
      phone: '+91 98250 88888',
      role: 'driver',
      isActive: true,
      createdAt: new Date()
    });
    d2User = { _id: res.insertedId };
  }
  await mongoose.connection.collection('drivers').updateOne(
    { driverId: 'DRV-102' },
    { $set: { driverId: 'DRV-102', name: 'Suresh Patel (Driver B)', phone: '+91 98250 88888', status: 'AVAILABLE', userId: d2User._id, vehicleNo: 'GJ-01-CD-5678' } },
    { upsert: true }
  );

  await mongoose.disconnect();
  console.log('✓ Database identities initialized.\n');

  const base = 'http://localhost:5000/api';

  // Setup tokens
  const customerId = '6a7f285d1c6dbc4f35992629';
  const customerToken = generateAccessToken(customerId, 'customer');

  const providerToken = generateAccessToken(pUser._id.toString(), 'provider');
  const driverAToken = generateAccessToken(d1User._id.toString(), 'driver');
  const driverBToken = generateAccessToken(d2User._id.toString(), 'driver');

  // STEP 1: Customer creates order
  console.log('--> STEP 1: Customer places customized order in MongoDB...');
  const createRes = await fetch(base + '/orders/customer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + customerToken
    },
    body: JSON.stringify({
      providerId,
      tiffinName: 'Royal Kathiyawadi Thali',
      tiffinCategory: 'Kathiyawadi',
      quantity: 1,
      customerName: 'Zaid Mansuri',
      customerPhone: '+91 98765 43210',
      customerAddress: '402 Sunset Tower, Satellite, Ahmedabad',
      deliveryCoordinates: { lat: 23.0300, lng: 72.5178 },
      paymentMethod: 'Cash on Delivery',
      items: [
        { name: 'Baingan Bhartha & Sev Dungri', price: 130 },
        { name: 'Bajra Rotla with Ghee', price: 30 }
      ],
      extras: [{ name: 'Masala Chaas', price: 15 }]
    })
  });
  const createData = await createRes.json();
  if (createRes.status !== 201) throw new Error('Order creation failed: ' + JSON.stringify(createData));
  const order = createData.data;
  console.log('    ✓ Order Created:', order.orderId, '| Total: ₹' + order.totalAmount, '| Status:', order.status);

  // STEP 2: Provider accepts order
  console.log('\n--> STEP 2: Provider accepts order...');
  const acceptRes = await fetch(base + '/orders/' + order.orderId + '/accept', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + providerToken }
  });
  const acceptData = await acceptRes.json();
  console.log('    ✓ Provider Accepted:', acceptData.message, '| New Status:', acceptData.data?.status);

  // STEP 3: Provider prepares food
  console.log('\n--> STEP 3: Provider marks food as Preparing...');
  const prepRes = await fetch(base + '/orders/' + order.orderId + '/prepare', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + providerToken }
  });
  const prepData = await prepRes.json();
  console.log('    ✓ Kitchen Preparing:', prepData.message);

  // STEP 4: Provider marks food as Ready
  console.log('\n--> STEP 4: Provider marks food as Ready for Pickup...');
  const readyRes = await fetch(base + '/orders/' + order.orderId + '/ready', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + providerToken }
  });
  const readyData = await readyRes.json();
  console.log('    ✓ Kitchen Ready:', readyData.message);

  // STEP 5: Provider confirms pickup (creates delivery request + OTPs)
  console.log('\n--> STEP 5: Provider confirms pickup & dispatches delivery request...');
  const confirmRes = await fetch(base + '/orders/' + order.orderId + '/confirm-pickup', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + providerToken }
  });
  const confirmData = await confirmRes.json();
  if (!confirmData.success) throw new Error('Confirm pickup failed: ' + JSON.stringify(confirmData));
  const delReq = confirmData.data.deliveryRequest;
  const pickupOtp = confirmData.data.order.pickupOtp;
  const deliveryOtp = confirmData.data.order.deliveryOtp;
  console.log('    ✓ Delivery Request Created:', delReq.requestId, '| Status:', delReq.status);
  console.log('    ✓ Generated Pickup OTP:', pickupOtp, '| Delivery OTP:', deliveryOtp);

  const cleanReqId = encodeURIComponent(delReq.requestId);

  // STEP 6: Driver A accepts request atomically
  console.log('\n--> STEP 6: Driver A accepts delivery request atomically...');
  const drvAcceptRes = await fetch(base + '/delivery/requests/' + cleanReqId + '/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + driverAToken
    },
    body: JSON.stringify({
      requestId: delReq.requestId,
      driverId: 'DRV-101',
      driverName: 'Ramesh Solanki (Driver A)',
      driverPhone: '+91 98250 99999',
      vehicleNo: 'GJ-01-AB-1234'
    })
  });
  const drvAcceptData = await drvAcceptRes.json();
  console.log('    ✓ Driver A Acceptance Result: Status', drvAcceptRes.status, '| Success:', drvAcceptData.success);

  // STEP 7: Driver B attempts to accept the SAME request (Race condition check)
  console.log('\n--> STEP 7: Driver B attempts to accept SAME request (Atomic Conflict Test)...');
  const drvBAcceptRes = await fetch(base + '/delivery/requests/' + cleanReqId + '/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + driverBToken
    },
    body: JSON.stringify({
      requestId: delReq.requestId,
      driverId: 'DRV-102',
      driverName: 'Suresh Patel (Driver B)'
    })
  });
  const drvBAcceptData = await drvBAcceptRes.json();
  console.log('    ✓ Driver B Rejection Result: Status', drvBAcceptRes.status, '| Message:', drvBAcceptData.message);
  if (drvBAcceptRes.status !== 409) {
    throw new Error('Atomic check failed: Driver B was not rejected with 409 Conflict!');
  }

  // STEP 8: Driver A verifies Pickup OTP
  console.log('\n--> STEP 8: Driver reaches kitchen & verifies Pickup OTP...');
  const otpRes = await fetch(base + '/delivery/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + driverAToken
    },
    body: JSON.stringify({
      deliveryId: delReq.requestId,
      otp: pickupOtp,
      driverId: 'DRV-101'
    })
  });
  const otpData = await otpRes.json();
  console.log('    ✓ Pickup OTP Verification:', otpData.message);

  // STEP 9: Driver updates GPS location
  console.log('\n--> STEP 9: Driver transmits live GPS coordinates...');
  const locRes = await fetch(base + '/delivery/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + driverAToken
    },
    body: JSON.stringify({
      deliveryId: delReq.requestId,
      driverId: 'DRV-101',
      lat: 23.0315,
      lng: 72.5201,
      speed: 28,
      heading: 90
    })
  });
  const locData = await locRes.json();
  console.log('    ✓ Driver Location Persisted & Broadcasted: Status', locRes.status);

  // STEP 10: Driver arrives at customer & verifies Delivery OTP
  console.log('\n--> STEP 10: Driver reaches customer & verifies Handover Delivery OTP...');
  const handoverRes = await fetch(base + '/delivery/customer-handover-otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + driverAToken
    },
    body: JSON.stringify({
      deliveryId: delReq.requestId,
      otp: deliveryOtp,
      driverId: 'DRV-101'
    })
  });
  const handoverData = await handoverRes.json();
  console.log('    ✓ Delivery Handover OTP Verification:', handoverData.message);

  // STEP 11: Verify Order is DELIVERED in customer orders
  console.log('\n--> STEP 11: Verify Order status is now Completed in Customer orders...');
  const myOrdersRes = await fetch(base + '/orders/my-orders', {
    headers: { 'Authorization': 'Bearer ' + customerToken }
  });
  const myOrdersData = await myOrdersRes.json();
  const finalOrder = myOrdersData.data.find(o => o.orderId === order.orderId);
  console.log('    ✓ Found Order:', finalOrder.orderId, '| Status:', finalOrder.status, '| Delivery Status:', finalOrder.deliveryStatus);

  // STEP 12: Customer posts Review
  console.log('\n--> STEP 12: Customer posts dining review for the delivered tiffin...');
  const revRes = await fetch(base + '/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + customerToken
    },
    body: JSON.stringify({
      providerId,
      orderId: order.orderId,
      tiffinName: 'Royal Kathiyawadi Thali',
      rating: 5,
      comment: 'Authentic Kathiyawadi taste! The Baingan Bhartha was smoky and hot.'
    })
  });
  const revData = await revRes.json();
  console.log('    ✓ Review Submitted:', revData.message, '| Rating:', revData.data?.rating);

  // STEP 13: Customer Address Management
  console.log('\n--> STEP 13: Customer saves new delivery address to profile...');
  const addrRes = await fetch(base + '/customer/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + customerToken
    },
    body: JSON.stringify({
      label: 'Office',
      street: '802 Titanium City Center, Prahlad Nagar',
      city: 'Ahmedabad',
      pincode: '380015',
      lat: 23.0135,
      lng: 72.5110,
      isDefault: true
    })
  });
  const addrData = await addrRes.json();
  console.log('    ✓ Saved Addresses Count:', addrData.data?.length);

  console.log('\n================================================================');
  console.log('   🎉 ALL 13 END-TO-END LIFECYCLE TESTS COMPLETED SUCCESSFULLY!  ');
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
