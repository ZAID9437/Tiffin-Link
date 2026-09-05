const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const PROVIDER_ID = '6a7f3051d4b48741d8722416';
const PROVIDER_EMAIL = 'menxoxo50@gmail.com';
const PROVIDER_NAME = 'Xoxo Men Kitchen';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

// Import Models from src/models
const User = require('./src/models/User');
const Provider = require('./src/models/Provider');
const Order = require('./src/models/Order');
const Tiffin = require('./src/models/Tiffin');
const DeliveryRequest = require('./src/models/DeliveryRequest');
const Subscription = require('./src/models/Subscription');
const Review = require('./src/models/Review');
const Notification = require('./src/models/Notification');
const Payout = require('./src/models/Payout');
const KitchenCapacity = require('./src/models/KitchenCapacity');
const KitchenSchedule = require('./src/models/KitchenSchedule');
const ServiceArea = require('./src/models/ServiceArea');
const MealRequest = require('./src/models/MealRequest');
const SupportTicket = require('./src/models/SupportTicket');

async function seedXoxoMenRecords() {
  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully!\n');

    // 1. Seed/Update User & Provider
    let providerUser = await User.findOne({ email: PROVIDER_EMAIL });
    if (!providerUser) {
      providerUser = await User.create({
        fullName: 'Xoxo Men',
        email: PROVIDER_EMAIL,
        phone: '+91 98250 12345',
        role: 'provider',
        isVerified: true
      });
      console.log('✅ User account created for Xoxo Men');
    } else {
      providerUser.fullName = 'Xoxo Men';
      providerUser.role = 'provider';
      await providerUser.save();
      console.log('✅ User account updated for Xoxo Men');
    }

    let providerDoc = await Provider.findById(PROVIDER_ID);
    if (!providerDoc) {
      providerDoc = await Provider.create({
        _id: PROVIDER_ID,
        userId: providerUser._id,
        name: 'Mansuri Kitchen',
        businessName: PROVIDER_NAME,
        fullName: 'Xoxo Men',
        email: PROVIDER_EMAIL,
        mobile: '+91 98250 12345',
        description: 'Authentic Homemade Gujarati, Jain & Punjabi Delicacies',
        isAcceptingOrders: true,
        address: {
          houseNo: '4',
          street: 'Ruhan Duplex, Opp Labbaik Park',
          locality: 'Satellite',
          city: 'Ahmedabad',
          pincode: '380015',
          isLocationPinned: true
        },
        cuisines: 'Gujarati, Jain, Kathiyawadi, Punjabi',
        rating: 4.8,
        price: 120,
        eta: '25-35 min',
        image: '/assets/provider_1.png',
        kitchenPhotos: '/assets/provider_1.png',
        bankName: 'HDFC Bank',
        accountNumber: '•••• 8902',
        ifscCode: 'HDFC0001234',
        upiId: 'xoxomen@hdfcbank',
        status: 'active'
      });
      console.log('✅ Provider document created for Xoxo Men');
    } else {
      providerDoc.userId = providerUser._id;
      providerDoc.name = 'Mansuri Kitchen';
      providerDoc.businessName = PROVIDER_NAME;
      providerDoc.fullName = 'Xoxo Men';
      providerDoc.email = PROVIDER_EMAIL;
      providerDoc.mobile = '+91 98250 12345';
      providerDoc.isAcceptingOrders = true;
      providerDoc.rating = 4.8;
      providerDoc.status = 'active';
      await providerDoc.save();
      console.log('✅ Provider document updated for Xoxo Men');
    }

    // 2. Clear old data for Xoxo Men
    await Order.deleteMany({ providerId: PROVIDER_ID });
    await Tiffin.deleteMany({ providerId: PROVIDER_ID });
    await DeliveryRequest.deleteMany({ providerEmail: PROVIDER_EMAIL });
    await Subscription.deleteMany({ providerId: PROVIDER_ID });
    await Review.deleteMany({ providerId: PROVIDER_ID });
    await Notification.deleteMany({ recipientId: PROVIDER_ID });
    await Payout.deleteMany({ providerId: PROVIDER_ID });
    await KitchenCapacity.deleteMany({ providerId: PROVIDER_ID });
    await KitchenSchedule.deleteMany({ providerId: PROVIDER_ID });
    await ServiceArea.deleteMany({ providerId: PROVIDER_ID });
    await SupportTicket.deleteMany({ providerId: PROVIDER_ID });
    await MealRequest.deleteMany({});
    console.log('🧹 Cleaned previous test records for Xoxo Men\n');

    // 3. Seed Menu Tiffins
    const tiffins = [
      {
        providerId: PROVIDER_ID,
        name: 'Gujarati Special Kathiyawadi Thali',
        description: '4 Phulka Rotis, Sev Tameta Shaak, Ringan Bharta, Dal, Rice, Salad & Chaas.',
        price: 120,
        category: 'Gujarati',
        foodType: 'Veg',
        capacity: 40,
        available: 32,
        ordersToday: 8,
        rating: 4.9,
        status: 'Active',
        image: '/assets/provider_1.png',
        ingredients: 'Pure Desi Ghee, Wheat Flour, Fresh Vegetables, Spices'
      },
      {
        providerId: PROVIDER_ID,
        name: 'Jain Pure Veg Swaminarayan Thali',
        description: 'No Onion, No Garlic. 4 Soft Chapattis, Paneer Bhurji, Guj Dal, Steamed Rice, Sweet Kheer.',
        price: 140,
        category: 'Jain',
        foodType: 'Veg',
        capacity: 30,
        available: 25,
        ordersToday: 5,
        rating: 4.8,
        status: 'Active',
        image: '/assets/provider_3.png',
        ingredients: 'No Root Veg, Fresh Cottage Cheese, Ghee, Spices'
      },
      {
        providerId: PROVIDER_ID,
        name: 'Punjabi Butter Paneer Combo Thali',
        description: 'Butter Paneer Masala, Dal Makhani, 3 Butter Parathas, Jeera Rice, Gulab Jamun & Raita.',
        price: 160,
        category: 'Punjabi',
        foodType: 'Veg',
        capacity: 35,
        available: 28,
        ordersToday: 7,
        rating: 4.9,
        status: 'Active',
        image: '/assets/provider_4.png',
        ingredients: 'Fresh Cream, Butter, Cottage Cheese, Basmati Rice'
      },
      {
        providerId: PROVIDER_ID,
        name: 'Healthy Low-Cal High Protein Thali',
        description: 'Boiled Sprouts Salad, Paneer Tikka Cubes, Multigrain Rotis, Brown Rice, Roasted Makhana.',
        price: 150,
        category: 'Healthy',
        foodType: 'Veg',
        capacity: 25,
        available: 21,
        ordersToday: 4,
        rating: 4.7,
        status: 'Active',
        image: '/assets/provider_2.png',
        ingredients: 'Sprouts, Olive Oil, Multigrain Atta, Brown Rice'
      },
      {
        providerId: PROVIDER_ID,
        name: 'Special Executive Mini Thali',
        description: '3 Chapattis, Subzi of the Day, Dal, Rice & Pickle. Perfect quick lunch.',
        price: 99,
        category: 'Gujarati',
        foodType: 'Veg',
        capacity: 50,
        available: 38,
        ordersToday: 12,
        rating: 4.8,
        status: 'Active',
        image: '/assets/provider_5.png',
        ingredients: 'Seasonal Vegetables, Whole Wheat, Lentils'
      }
    ];

    const insertedTiffins = await Tiffin.insertMany(tiffins);
    console.log(`📦 Seeded ${insertedTiffins.length} Tiffin menu items`);

    // 4. Seed Orders
    const now = Date.now();
    const orders = [
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[0]._id.toString(),
        orderId: '#1024',
        customerName: 'Raj Patel',
        customerPhone: '+91 98250 12345',
        customerAddress: '402 Sunrise Towers, Navrangpura, Ahmedabad',
        tiffinName: 'Gujarati Special Kathiyawadi Thali',
        tiffinCategory: 'Gujarati',
        tiffinImage: '/assets/provider_1.png',
        quantity: 2,
        unitPrice: 120,
        subtotal: 240,
        deliveryKm: 3.2,
        deliveryFee: 50,
        packagingFee: 15,
        gstTax: 12,
        totalAmount: 317,
        paymentStatus: 'Paid',
        status: 'Preparing',
        deliveryStatus: 'On The Way',
        deliveryPartnerName: 'Rahul Sharma',
        deliveryPartnerPhone: '+91 98251 44556',
        createdAt: new Date(now - 25 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[1]._id.toString(),
        orderId: '#1025',
        customerName: 'Amit Shah',
        customerPhone: '+91 99798 54321',
        customerAddress: 'B-12 Shrinand Nagar, Vejalpur, Ahmedabad',
        tiffinName: 'Jain Pure Veg Swaminarayan Thali',
        tiffinCategory: 'Jain',
        tiffinImage: '/assets/provider_3.png',
        quantity: 3,
        unitPrice: 140,
        subtotal: 420,
        deliveryKm: 4.5,
        deliveryFee: 61,
        packagingFee: 15,
        gstTax: 21,
        totalAmount: 517,
        paymentStatus: 'Cash on Delivery',
        status: 'Ready',
        deliveryStatus: 'Assigned',
        deliveryPartnerName: 'Arjun Patel',
        deliveryPartnerPhone: '+91 98251 11223',
        createdAt: new Date(now - 45 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[2]._id.toString(),
        orderId: '#1026',
        customerName: 'Neha Patel',
        customerPhone: '+91 94260 98765',
        customerAddress: '701 Iscon Elegance, Prahlad Nagar, Ahmedabad',
        tiffinName: 'Punjabi Butter Paneer Combo Thali',
        tiffinCategory: 'Punjabi',
        tiffinImage: '/assets/provider_4.png',
        quantity: 1,
        unitPrice: 160,
        subtotal: 160,
        deliveryKm: 2.5,
        deliveryFee: 45,
        packagingFee: 15,
        gstTax: 8,
        totalAmount: 228,
        paymentStatus: 'Paid',
        status: 'Completed',
        deliveryStatus: 'Delivered',
        deliveryPartnerName: 'Vikram Singh',
        deliveryPartnerPhone: '+91 98251 77889',
        createdAt: new Date(now - 120 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[3]._id.toString(),
        orderId: '#1027',
        customerName: 'Vikram Mehta',
        customerPhone: '+91 98980 11223',
        customerAddress: 'A-101 Green Acres, Satellite, Ahmedabad',
        tiffinName: 'Healthy Low-Cal High Protein Thali',
        tiffinCategory: 'Healthy',
        tiffinImage: '/assets/provider_2.png',
        quantity: 2,
        unitPrice: 150,
        subtotal: 300,
        deliveryKm: 5.0,
        deliveryFee: 65,
        packagingFee: 15,
        gstTax: 15,
        totalAmount: 395,
        paymentStatus: 'Paid',
        status: 'New',
        deliveryStatus: 'Searching',
        createdAt: new Date(now - 10 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[4]._id.toString(),
        orderId: '#1028',
        customerName: 'Pooja Sharma',
        customerPhone: '+91 97129 44556',
        customerAddress: '304 Safal Paris, South Boper, Ahmedabad',
        tiffinName: 'Special Executive Mini Thali',
        tiffinCategory: 'Gujarati',
        tiffinImage: '/assets/provider_5.png',
        quantity: 2,
        unitPrice: 99,
        subtotal: 198,
        deliveryKm: 6.2,
        deliveryFee: 75,
        packagingFee: 15,
        gstTax: 10,
        totalAmount: 298,
        paymentStatus: 'Cash on Delivery',
        status: 'Cancelled',
        deliveryStatus: 'Unassigned',
        cancellationReason: 'Customer requested cancellation due to travel plan change.',
        createdAt: new Date(now - 180 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[0]._id.toString(),
        orderId: '#1029',
        customerName: 'Kavita Dave',
        customerPhone: '+91 98791 22334',
        customerAddress: '102 Earth Retail, Vastrapur, Ahmedabad',
        tiffinName: 'Gujarati Special Kathiyawadi Thali',
        tiffinCategory: 'Gujarati',
        tiffinImage: '/assets/provider_1.png',
        quantity: 4,
        unitPrice: 120,
        subtotal: 480,
        deliveryKm: 2.1,
        deliveryFee: 40,
        packagingFee: 20,
        gstTax: 24,
        totalAmount: 564,
        paymentStatus: 'Paid',
        status: 'Preparing',
        deliveryStatus: 'Searching',
        createdAt: new Date(now - 15 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        tiffinId: insertedTiffins[2]._id.toString(),
        orderId: '#1030',
        customerName: 'Sanjay Patel',
        customerPhone: '+91 98240 77665',
        customerAddress: 'B-501 Titanium City Center, Anand Nagar, Ahmedabad',
        tiffinName: 'Punjabi Butter Paneer Combo Thali',
        tiffinCategory: 'Punjabi',
        tiffinImage: '/assets/provider_4.png',
        quantity: 2,
        unitPrice: 160,
        subtotal: 320,
        deliveryKm: 1.5,
        deliveryFee: 35,
        packagingFee: 15,
        gstTax: 16,
        totalAmount: 386,
        paymentStatus: 'Paid',
        status: 'Completed',
        deliveryStatus: 'Delivered',
        deliveryPartnerName: 'Jayesh Parmar',
        deliveryPartnerPhone: '+91 98251 99000',
        createdAt: new Date(now - 300 * 60 * 1000)
      }
    ];

    const insertedOrders = await Order.insertMany(orders);
    console.log(`🛒 Seeded ${insertedOrders.length} Order records`);

    // 5. Seed Delivery Requests
    const deliveryRequests = [
      {
        requestId: '#DEL-1029',
        providerId: PROVIDER_ID,
        orderId: '#1024',
        providerEmail: PROVIDER_EMAIL,
        providerName: PROVIDER_NAME,
        customerName: 'Raj Patel',
        customerPhone: '+91 98250 12345',
        tiffinName: 'Gujarati Special Kathiyawadi Thali × 2',
        tiffinCategory: 'Gujarati',
        deliveryAddress: { street: '402 Sunrise Towers, Navrangpura', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
        pickupAddress: { street: 'Ruhan Duplex, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
        assignedDriver: {
          driverId: 'DRV-101',
          name: 'Rahul Sharma',
          phone: '+91 98251 44556',
          rating: 4.9,
          vehicleNo: 'GJ-01-AB-1029',
          location: { lat: 23.0275, lng: 72.5680 }
        },
        status: 'Out for Delivery',
        distanceKm: 3.2,
        etaMinutes: 18,
        amount: 317,
        itemCount: 2,
        pickupOtp: '4821',
        deliveryOtp: '9012',
        pickupOtpVerified: true,
        deliveryOtpVerified: false,
        requestedAt: new Date(now - 25 * 60 * 1000),
        acceptedAt: new Date(now - 20 * 60 * 1000),
        pickedUpAt: new Date(now - 10 * 60 * 1000)
      },
      {
        requestId: '#DEL-1028',
        providerId: PROVIDER_ID,
        orderId: '#1025',
        providerEmail: PROVIDER_EMAIL,
        providerName: PROVIDER_NAME,
        customerName: 'Amit Shah',
        customerPhone: '+91 99798 54321',
        tiffinName: 'Jain Pure Veg Swaminarayan Thali × 3',
        tiffinCategory: 'Jain',
        deliveryAddress: { street: 'B-12 Shrinand Nagar, Vejalpur', city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
        pickupAddress: { street: 'Ruhan Duplex, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
        assignedDriver: {
          driverId: 'DRV-102',
          name: 'Arjun Patel',
          phone: '+91 98251 11223',
          rating: 4.8,
          vehicleNo: 'GJ-01-CD-4589',
          location: { lat: 23.0290, lng: 72.5640 }
        },
        status: 'Driver Assigned',
        distanceKm: 4.5,
        etaMinutes: 8,
        amount: 517,
        itemCount: 3,
        pickupOtp: '9102',
        deliveryOtp: '3341',
        pickupOtpVerified: false,
        deliveryOtpVerified: false,
        requestedAt: new Date(now - 45 * 60 * 1000),
        acceptedAt: new Date(now - 38 * 60 * 1000)
      },
      {
        requestId: '#DEL-1027',
        providerId: PROVIDER_ID,
        orderId: '#1026',
        providerEmail: PROVIDER_EMAIL,
        providerName: PROVIDER_NAME,
        customerName: 'Neha Patel',
        customerPhone: '+91 94260 98765',
        tiffinName: 'Punjabi Butter Paneer Combo Thali × 1',
        tiffinCategory: 'Punjabi',
        deliveryAddress: { street: '701 Iscon Elegance, Prahlad Nagar', city: 'Ahmedabad', lat: 23.0380, lng: 72.5580 },
        pickupAddress: { street: 'Ruhan Duplex, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
        assignedDriver: {
          driverId: 'DRV-103',
          name: 'Vikram Singh',
          phone: '+91 98251 77889',
          rating: 4.7,
          vehicleNo: 'GJ-01-EF-8890',
          location: { lat: 23.0380, lng: 72.5580 }
        },
        status: 'Delivered',
        distanceKm: 2.5,
        etaMinutes: 0,
        amount: 228,
        itemCount: 1,
        pickupOtp: '3341',
        deliveryOtp: '1122',
        pickupOtpVerified: true,
        deliveryOtpVerified: true,
        requestedAt: new Date(now - 120 * 60 * 1000),
        acceptedAt: new Date(now - 115 * 60 * 1000),
        pickedUpAt: new Date(now - 90 * 60 * 1000),
        deliveredAt: new Date(now - 60 * 60 * 1000)
      },
      {
        requestId: '#DEL-1020',
        providerId: PROVIDER_ID,
        orderId: '#1030',
        providerEmail: PROVIDER_EMAIL,
        providerName: PROVIDER_NAME,
        customerName: 'Sanjay Patel',
        customerPhone: '+91 98240 77665',
        tiffinName: 'Punjabi Butter Paneer Combo Thali × 2',
        tiffinCategory: 'Punjabi',
        deliveryAddress: { street: 'B-501 Titanium City Center, Anand Nagar', city: 'Ahmedabad', lat: 23.0280, lng: 72.5100 },
        pickupAddress: { street: 'Ruhan Duplex, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
        assignedDriver: {
          driverId: 'DRV-104',
          name: 'Jayesh Parmar',
          phone: '+91 98251 99000',
          rating: 4.85,
          vehicleNo: 'GJ-01-GH-3344',
          location: { lat: 23.0280, lng: 72.5100 }
        },
        status: 'Delivered',
        distanceKm: 1.5,
        etaMinutes: 0,
        amount: 386,
        itemCount: 2,
        pickupOtp: '7765',
        deliveryOtp: '8876',
        pickupOtpVerified: true,
        deliveryOtpVerified: true,
        requestedAt: new Date(now - 300 * 60 * 1000),
        acceptedAt: new Date(now - 290 * 60 * 1000),
        pickedUpAt: new Date(now - 260 * 60 * 1000),
        deliveredAt: new Date(now - 240 * 60 * 1000)
      }
    ];

    const insertedDeliveries = await DeliveryRequest.insertMany(deliveryRequests);
    console.log(`🚚 Seeded ${insertedDeliveries.length} Delivery requests`);

    // 6. Seed Subscriptions
    const subscriptions = [
      {
        providerId: PROVIDER_ID,
        subId: '#SUB-801',
        customerName: 'Chirag Desai',
        customerPhone: '+91 98255 66778',
        customerEmail: 'chirag.desai@gmail.com',
        tiffinId: insertedTiffins[0]._id.toString(),
        plan: 'Monthly Gujarati Thali Plan',
        frequency: 'Daily',
        deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        mealType: 'Lunch',
        pricePerMeal: 120,
        amount: 3600,
        startDate: '01 Sep 2026',
        endDate: '30 Sep 2026',
        nextDeliveryDate: '06 Sep 2026',
        address: '502 Orchid Elegance, Prahlad Nagar, Ahmedabad',
        paymentStatus: 'PAID',
        status: 'ACTIVE'
      },
      {
        providerId: PROVIDER_ID,
        subId: '#SUB-802',
        customerName: 'Meera Trivedi',
        customerPhone: '+91 97243 11223',
        customerEmail: 'meera.trivedi@yahoo.com',
        tiffinId: insertedTiffins[1]._id.toString(),
        plan: 'Weekly Jain Special Plan',
        frequency: 'Weekly',
        deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        mealType: 'Dinner',
        pricePerMeal: 140,
        amount: 840,
        startDate: '01 Sep 2026',
        endDate: '07 Sep 2026',
        nextDeliveryDate: '06 Sep 2026',
        address: 'B-303 Venus Atlantis, Anand Nagar, Ahmedabad',
        paymentStatus: 'PAID',
        status: 'ACTIVE'
      },
      {
        providerId: PROVIDER_ID,
        subId: '#SUB-803',
        customerName: 'Harsh Joshi',
        customerPhone: '+91 99099 44332',
        customerEmail: 'harsh.j@techfirm.com',
        tiffinId: insertedTiffins[3]._id.toString(),
        plan: 'Monthly High Protein Fitness Plan',
        frequency: 'Monthly',
        deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        mealType: 'Lunch',
        pricePerMeal: 150,
        amount: 3900,
        startDate: '15 Aug 2026',
        endDate: '15 Sep 2026',
        nextDeliveryDate: '07 Sep 2026',
        address: 'C-104 Mondeal Heights, SG Highway, Ahmedabad',
        paymentStatus: 'PAID',
        status: 'PAUSED',
        pausedAt: new Date(now - 2 * 24 * 60 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        subId: '#SUB-804',
        customerName: 'Ananya Vora',
        customerPhone: '+91 98981 55443',
        customerEmail: 'ananya.vora@gmail.com',
        tiffinId: insertedTiffins[2]._id.toString(),
        plan: 'Weekly Punjabi Executive Combo',
        frequency: 'Weekly',
        deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        mealType: 'Dinner',
        pricePerMeal: 160,
        amount: 960,
        startDate: '01 Sep 2026',
        endDate: '07 Sep 2026',
        nextDeliveryDate: '06 Sep 2026',
        address: '201 Westgate Tower, Near YMCA, Ahmedabad',
        paymentStatus: 'PAID',
        status: 'ACTIVE'
      }
    ];

    const insertedSubs = await Subscription.insertMany(subscriptions);
    console.log(`📅 Seeded ${insertedSubs.length} Active & Paused Subscriptions`);

    // 7. Seed Reviews
    const reviews = [
      {
        providerId: PROVIDER_ID,
        orderId: '#1024',
        customerName: 'Raj Patel',
        customerEmail: 'raj.patel@gmail.com',
        tiffinId: insertedTiffins[0]._id.toString(),
        tiffinName: 'Gujarati Special Kathiyawadi Thali',
        tiffinCategory: 'Gujarati',
        rating: 5,
        comment: 'Authentic home taste! Soft rotlis and very fresh subzi. Loved the Ringan Bharta!',
        providerReply: 'Thank you Raj! We prepare fresh Kathiyawadi thalis daily with pure ghee.',
        repliedAt: new Date(now - 10 * 60 * 1000),
        createdAt: new Date(now - 2 * 60 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        orderId: '#1025',
        customerName: 'Meera Trivedi',
        customerEmail: 'meera.trivedi@yahoo.com',
        tiffinId: insertedTiffins[1]._id.toString(),
        tiffinName: 'Jain Pure Veg Swaminarayan Thali',
        tiffinCategory: 'Jain',
        rating: 5,
        comment: 'Very clean and hygienic Jain food. Packaging was leak-proof and food stayed hot.',
        createdAt: new Date(now - 18 * 60 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        orderId: '#1026',
        customerName: 'Neha Patel',
        customerEmail: 'neha.p@gmail.com',
        tiffinId: insertedTiffins[2]._id.toString(),
        tiffinName: 'Punjabi Butter Paneer Combo Thali',
        tiffinCategory: 'Punjabi',
        rating: 4,
        comment: 'Paneer Butter Masala was rich and creamy. Delivery was super fast too!',
        providerReply: 'Glad you enjoyed the Punjabi combo, Neha!',
        repliedAt: new Date(now - 5 * 60 * 60 * 1000),
        createdAt: new Date(now - 24 * 60 * 60 * 1000)
      },
      {
        providerId: PROVIDER_ID,
        orderId: '#1030',
        customerName: 'Sanjay Patel',
        customerEmail: 'sanjay.patel@hotmail.com',
        tiffinId: insertedTiffins[0]._id.toString(),
        tiffinName: 'Gujarati Special Kathiyawadi Thali',
        tiffinCategory: 'Gujarati',
        rating: 5,
        comment: 'Regular subscriber here! Consistent high quality every single day. Highly recommended!',
        createdAt: new Date(now - 48 * 60 * 60 * 1000)
      }
    ];

    const insertedReviews = await Review.insertMany(reviews);
    console.log(`⭐ Seeded ${insertedReviews.length} Ratings & Reviews`);

    // 8. Seed Payouts
    const payouts = [
      {
        payoutId: '#PAY-9001',
        providerId: PROVIDER_ID,
        providerName: PROVIDER_NAME,
        amount: 4850,
        bankName: 'HDFC Bank',
        accountNumber: '•••• 8902',
        status: 'Completed',
        requestedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        processedAt: new Date(now - 2 * 24 * 60 * 60 * 1000)
      },
      {
        payoutId: '#PAY-9002',
        providerId: PROVIDER_ID,
        providerName: PROVIDER_NAME,
        amount: 3200,
        bankName: 'HDFC Bank',
        accountNumber: '•••• 8902',
        status: 'Completed',
        requestedAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        processedAt: new Date(now - 6 * 24 * 60 * 60 * 1000)
      },
      {
        payoutId: '#PAY-9003',
        providerId: PROVIDER_ID,
        providerName: PROVIDER_NAME,
        amount: 2150,
        bankName: 'HDFC Bank',
        accountNumber: '•••• 8902',
        status: 'Pending',
        requestedAt: new Date(now - 6 * 60 * 60 * 1000)
      }
    ];

    const insertedPayouts = await Payout.insertMany(payouts);
    console.log(`💰 Seeded ${insertedPayouts.length} Payout history records`);

    // 9. Seed Notifications
    const notifications = [
      {
        notificationId: `NOTIF-${Date.now()}-1`,
        recipientId: PROVIDER_ID,
        title: 'New Order Received (#1027)',
        message: 'Vikram Mehta placed an order for 2x Healthy Low-Cal Thalis.',
        category: 'Orders',
        read: false,
        referenceId: '#1027',
        referenceType: 'order',
        createdAt: new Date(now - 10 * 60 * 1000)
      },
      {
        notificationId: `NOTIF-${Date.now()}-2`,
        recipientId: PROVIDER_ID,
        title: 'Driver Assigned (#DEL-1029)',
        message: 'Rahul Sharma accepted the delivery dispatch for Raj Patel.',
        category: 'Orders',
        read: true,
        referenceId: '#DEL-1029',
        referenceType: 'order',
        createdAt: new Date(now - 20 * 60 * 1000)
      },
      {
        notificationId: `NOTIF-${Date.now()}-3`,
        recipientId: PROVIDER_ID,
        title: 'Weekly Payout Processed',
        message: '₹4,850 has been successfully credited to your HDFC Bank account.',
        category: 'Payments',
        read: true,
        referenceId: '#PAY-9001',
        referenceType: 'payment',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000)
      },
      {
        notificationId: `NOTIF-${Date.now()}-4`,
        recipientId: PROVIDER_ID,
        title: 'New 5-Star Review!',
        message: 'Raj Patel gave 5 stars: "Authentic home taste! Soft rotlis..."',
        category: 'Reviews',
        read: false,
        referenceId: '#1024',
        referenceType: 'review',
        createdAt: new Date(now - 2 * 60 * 60 * 1000)
      }
    ];

    const insertedNotifs = await Notification.insertMany(notifications);
    console.log(`🔔 Seeded ${insertedNotifs.length} Provider notifications`);

    // 10. Seed Kitchen Capacity, Schedule & Service Area
    const todayStr = new Date().toISOString().split('T')[0];
    await KitchenCapacity.create({
      providerId: PROVIDER_ID,
      date: todayStr,
      dateLabel: 'Today',
      maxCapacity: 50,
      autoStopOrders: true,
      allowOverbooking: false,
      status: 'OPEN'
    });

    await KitchenSchedule.create({
      providerId: PROVIDER_ID,
      weeklySchedule: [
        { day: 'Monday', isOpen: true, openTime: '09:00 AM', closeTime: '09:30 PM' },
        { day: 'Tuesday', isOpen: true, openTime: '09:00 AM', closeTime: '09:30 PM' },
        { day: 'Wednesday', isOpen: true, openTime: '09:00 AM', closeTime: '09:30 PM' },
        { day: 'Thursday', isOpen: true, openTime: '09:00 AM', closeTime: '09:30 PM' },
        { day: 'Friday', isOpen: true, openTime: '09:00 AM', closeTime: '09:30 PM' },
        { day: 'Saturday', isOpen: true, openTime: '09:00 AM', closeTime: '09:30 PM' },
        { day: 'Sunday', isOpen: true, openTime: '09:00 AM', closeTime: '04:00 PM' }
      ],
      orderWindows: [
        { name: 'Lunch Express Window', icon: '☀️', cutoffTime: '11:30 AM', deliveryStartTime: '12:00 PM', deliveryEndTime: '02:00 PM', isActive: true },
        { name: 'Dinner Special Window', icon: '🌙', cutoffTime: '06:30 PM', deliveryStartTime: '07:30 PM', deliveryEndTime: '09:30 PM', isActive: true }
      ]
    });

    const serviceAreas = [
      { providerId: PROVIDER_ID, areaName: 'Satellite & Jodhpur', radiusKm: 4, latitude: 23.0300, longitude: 72.5650, customersCount: 42, status: 'ACTIVE' },
      { providerId: PROVIDER_ID, areaName: 'Prahlad Nagar & Anand Nagar', radiusKm: 5, latitude: 23.0380, longitude: 72.5580, customersCount: 38, status: 'ACTIVE' },
      { providerId: PROVIDER_ID, areaName: 'Navrangpura & CG Road', radiusKm: 6, latitude: 23.0225, longitude: 72.5714, customersCount: 29, status: 'ACTIVE' },
      { providerId: PROVIDER_ID, areaName: 'Vastrapur & Bodakdev', radiusKm: 5, latitude: 23.0350, longitude: 72.5300, customersCount: 31, status: 'ACTIVE' }
    ];
    await ServiceArea.insertMany(serviceAreas);

    // 11. Seed Meal Requests & Support Ticket
    await MealRequest.create({
      customerName: 'Bhavin Shah (Coromandel Corp)',
      customerPhone: '+91 98980 99887',
      customerAddress: '802 Mondeal Square, SG Highway, Ahmedabad',
      mealType: 'Corporate Thali Combo',
      category: 'Gujarati',
      items: [{ name: 'Gujarati Special Kathiyawadi Thali', qty: 15, price: 120 }],
      quantity: 15,
      date: 'Today',
      time: '01:00 PM',
      deliveryType: 'Delivery',
      location: 'SG Highway, Ahmedabad',
      distance: '3.5 km',
      budget: 120,
      totalAmount: 1800,
      specialInstructions: 'Please deliver in hot insulated boxes with extra papad.',
      status: 'pending',
      expiresAt: new Date(now + 120 * 1000)
    });

    await SupportTicket.create({
      ticketId: '#TCK-4001',
      providerId: PROVIDER_ID,
      providerEmail: PROVIDER_EMAIL,
      subject: 'Inquiry regarding dynamic payout settlement speed',
      category: 'Payments',
      relatedOrderId: '#PAY-9003',
      description: 'Requesting confirmation on whether pending payout #PAY-9003 will be settled by end of today.',
      status: 'In Progress'
    });

    console.log('✅ Kitchen Capacity, Weekly Schedule, Service Areas & Support Tickets initialized');

    console.log('\n======================================================');
    console.log('🎉 ALL DYNAMIC TEST RECORDS SUCCESSFULLY SEEDED FOR XOXO MEN!');
    console.log(`Provider Name: Mansuri Kitchen (Xoxo Men Kitchen)`);
    console.log(`Email: ${PROVIDER_EMAIL}`);
    console.log(`Provider ID: ${PROVIDER_ID}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Xoxo Men records:', error);
    process.exit(1);
  }
}

seedXoxoMenRecords();
