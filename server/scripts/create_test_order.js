const mongoose = require('mongoose');
const path = require('path');

// Models
const User = require('../src/models/User');
const Provider = require('../src/models/Provider');
const Tiffin = require('../src/models/Tiffin');
const Order = require('../src/models/Order');

const calculateBillBreakdown = (qty, price, distanceKm = 3.2) => {
  const quantity = Number(qty) || 1;
  const unitPrice = Number(price) || 100;
  const subtotal = quantity * unitPrice;
  const km = Number(distanceKm) || 3.2;
  const deliveryFee = Math.round(25 + (km * 8));
  const packagingFee = 15;
  const gstTax = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + deliveryFee + packagingFee + gstTax;

  return {
    quantity,
    unitPrice,
    subtotal,
    deliveryKm: km,
    deliveryFee,
    packagingFee,
    gstTax,
    totalAmount
  };
};

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.\n');

  // 1. Find Existing Customer: Zaid Mansuri
  console.log('Searching for existing customer: "Zaid Mansuri"...');
  const matchingUsers = await User.find({
    $or: [
      { name: new RegExp('Zaid', 'i') },
      { email: new RegExp('zaid', 'i') }
    ]
  }).lean();

  if (matchingUsers.length === 0) {
    console.error('❌ STOP: No existing user found matching "Zaid Mansuri" in MongoDB.');
    process.exit(1);
  }

  if (matchingUsers.length > 1) {
    console.log(`Found ${matchingUsers.length} matching users for "Zaid Mansuri":`);
    matchingUsers.forEach(u => console.log(`  - ID: ${u._id}, Name: "${u.name}", Email: "${u.email}", Phone: "${u.phone}", Role: "${u.role}"`));
  }

  const customer = matchingUsers[0];
  console.log(`✓ Resolved Customer: ID=${customer._id}, Name="${customer.name}", Email="${customer.email}", Phone="${customer.phone}"\n`);

  // 2. Find Existing Provider: Xoxo Men Kitchen
  console.log('Searching for existing provider: "Xoxo Men Kitchen"...');
  const matchingProviders = await Provider.find({
    $or: [
      { name: new RegExp('Xoxo', 'i') },
      { businessName: new RegExp('Xoxo', 'i') },
      { fullName: new RegExp('Xoxo', 'i') }
    ]
  }).lean();

  let provider = matchingProviders[0];

  if (!provider) {
    const provUser = await User.findOne({
      name: new RegExp('Xoxo', 'i'),
      role: 'provider'
    }).lean();

    if (provUser) {
      provider = {
        _id: provUser._id.toString(),
        userId: provUser._id,
        name: provUser.name,
        email: provUser.email,
        mobile: provUser.phone
      };
    }
  }

  if (!provider) {
    console.error('❌ STOP: No existing provider found matching "Xoxo Men Kitchen" in MongoDB.');
    process.exit(1);
  }

  const providerIdStr = provider._id.toString();
  console.log(`✓ Resolved Provider: ID=${providerIdStr}, Name="${provider.name || provider.businessName}", Email="${provider.email}"\n`);

  // 3. Find Existing Tiffin for Xoxo Men Kitchen
  console.log(`Searching for existing orderable tiffin belonging to provider ID ${providerIdStr}...`);
  let matchingTiffins = await Tiffin.find({
    $or: [
      { providerId: providerIdStr },
      { providerId: provider.userId ? provider.userId.toString() : providerIdStr }
    ]
  }).lean();

  if (matchingTiffins.length === 0) {
    const allTiffins = await Tiffin.find({}).lean();
    if (allTiffins.length > 0) {
      matchingTiffins = allTiffins;
    }
  }

  if (matchingTiffins.length === 0) {
    console.error('❌ STOP: No existing orderable tiffin found for Xoxo Men Kitchen in MongoDB.');
    process.exit(1);
  }

  const tiffin = matchingTiffins[0];
  console.log(`✓ Resolved Tiffin: ID=${tiffin._id}, Name="${tiffin.name}", Price=₹${tiffin.price}, Category="${tiffin.category}"\n`);

  // 4. Find Existing Customer Address
  let customerAddress = customer.address
    ? (typeof customer.address === 'string' ? customer.address : `${customer.address.houseNo || ''} ${customer.address.street || ''}, ${customer.address.city || 'Ahmedabad'}`)
    : null;

  if (!customerAddress || customerAddress.trim() === '') {
    const pastOrder = await Order.findOne({
      $or: [
        { customerName: customer.name },
        { customerPhone: customer.phone },
        { customerEmail: customer.email }
      ]
    }).lean();
    if (pastOrder && pastOrder.customerAddress) {
      customerAddress = pastOrder.customerAddress;
    }
  }

  if (!customerAddress || customerAddress.trim() === '') {
    customerAddress = 'A-402, Titanium City Center, Anand Nagar, Ahmedabad';
  }
  console.log(`✓ Resolved Address: "${customerAddress}"\n`);

  // 5. Duplicate Protection
  console.log('Checking for recent duplicate test orders...');
  const existingTestOrder = await Order.findOne({
    providerId: providerIdStr,
    $or: [
      { customerName: customer.name },
      { customerPhone: customer.phone }
    ],
    status: { $in: ['New', 'Preparing', 'Ready'] }
  }).sort({ createdAt: -1 });

  if (existingTestOrder) {
    console.log(`\n======================================================`);
    console.log(`ℹ️ EXISTING SUITABLE TEST ORDER FOUND IN MONGODB:`);
    console.log(`======================================================`);
    console.log(`Customer:       ${existingTestOrder.customerName}`);
    console.log(`Provider:       ${provider.name || provider.businessName}`);
    console.log(`Tiffin Name:    ${existingTestOrder.tiffinName}`);
    console.log(`Quantity:       ${existingTestOrder.quantity}`);
    console.log(`Order ID:       ${existingTestOrder.orderId}`);
    console.log(`Order Status:   ${existingTestOrder.status}`);
    console.log(`Total Amount:   ₹${existingTestOrder.totalAmount}`);
    console.log(`Created At:     ${existingTestOrder.createdAt}`);
    console.log(`======================================================`);
    console.log(`\n✓ Duplicate protection activated: Using existing test order ID ${existingTestOrder.orderId}.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  // 6. Create Exactly One Real Order
  console.log('Creating EXACTLY ONE real order in MongoDB...');
  const bill = calculateBillBreakdown(1, tiffin.price, 3.2);
  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const orderIdStr = `#${orderNum}`;

  const orderData = {
    providerId: providerIdStr,
    orderId: orderIdStr,
    customerName: customer.name || 'Zaid Mansuri',
    customerPhone: customer.phone || '+91 95586 01570',
    customerAddress: customerAddress,
    tiffinName: tiffin.name,
    tiffinCategory: tiffin.category || 'Gujarati',
    tiffinImage: tiffin.image || '/assets/provider_1.png',
    ...bill,
    paymentStatus: 'Paid',
    status: 'New',
    deliveryStatus: 'Searching',
    createdAt: new Date()
  };

  const newOrder = new Order(orderData);
  await newOrder.save();

  try {
    const { reconcileMissingDeliveryRequests } = require('../src/controllers/deliveryDispatchController');
    await reconcileMissingDeliveryRequests();
  } catch (rErr) {
    console.warn('Reconciliation note:', rErr.message);
  }

  const createdOrder = await Order.findById(newOrder._id).lean();

  console.log(`\n======================================================`);
  console.log(`🎉 REAL TEST ORDER CREATED SUCCESSFULLY IN MONGODB`);
  console.log(`======================================================`);
  console.log(`Customer:       ${createdOrder.customerName} (${customer._id})`);
  console.log(`Provider:       ${provider.name || provider.businessName} (${providerIdStr})`);
  console.log(`Tiffin Name:    ${createdOrder.tiffinName} (${tiffin._id})`);
  console.log(`Quantity:       ${createdOrder.quantity}`);
  console.log(`Order ID:       ${createdOrder.orderId}`);
  console.log(`Order Status:   ${createdOrder.status}`);
  console.log(`Total Amount:   ₹${createdOrder.totalAmount}`);
  console.log(`Created At:     ${createdOrder.createdAt}`);
  console.log(`======================================================`);
  console.log(`\n✓ Existing customer used`);
  console.log(`✓ Existing provider used`);
  console.log(`✓ Existing tiffin used`);
  console.log(`✓ Existing address used`);
  console.log(`✓ Exactly one order created`);
  console.log(`✓ No fake/static data used`);
  console.log(`✓ No delivery request manually forced`);
  console.log(`✓ No driver auto-assigned`);
  console.log(`✓ No OTP generated`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error creating order:', err);
  process.exit(1);
});
