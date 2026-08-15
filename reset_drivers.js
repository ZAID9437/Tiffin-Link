const mongoose = require('./server/node_modules/mongoose');

const mongoUri = 'mongodb://localhost:27017/tiffinlink';

async function resetDeliveryRequestsInDb() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB tiffinlink');

    const db = mongoose.connection.db;
    const deliveryColl = db.collection('deliveryrequests');
    const orderColl = db.collection('orders');

    await deliveryColl.deleteMany({});
    console.log('Cleared old delivery requests with repeated Rahul Sharma');

    const diverseRequests = [
      {
        requestId: '#DEL-1029',
        orderId: '#1024',
        providerEmail: 'menxoxo50@gmail.com',
        providerName: 'Xoxo Men Kitchen',
        customerName: 'Raj Patel',
        customerPhone: '+91 98250 12345',
        tiffinName: 'Gujarati Veg Thali × 2',
        deliveryAddress: { street: '402 Sunrise Towers, Navrangpura', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
        pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
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
        amount: 240,
        itemCount: 2,
        pickupOtp: '4821',
        requestedAt: new Date(Date.now() - 35 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 30 * 60 * 1000),
        pickedUpAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        requestId: '#DEL-1028',
        orderId: '#1025',
        providerEmail: 'menxoxo50@gmail.com',
        providerName: 'Xoxo Men Kitchen',
        customerName: 'Amit Shah',
        customerPhone: '+91 99798 54321',
        tiffinName: 'Jain Special Thali × 3',
        deliveryAddress: { street: 'B-12 Shrinand Nagar, Vejalpur', city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
        pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
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
        amount: 360,
        itemCount: 3,
        pickupOtp: '9102',
        requestedAt: new Date(Date.now() - 15 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 8 * 60 * 1000)
      },
      {
        requestId: '#DEL-1027',
        orderId: '#1026',
        providerEmail: 'menxoxo50@gmail.com',
        providerName: 'Xoxo Men Kitchen',
        customerName: 'Neha Patel',
        customerPhone: '+91 94260 98765',
        tiffinName: 'Kathiyawadi Special Combo × 1',
        deliveryAddress: { street: '701 Iscon Elegance, Prahlad Nagar', city: 'Ahmedabad', lat: 23.0380, lng: 72.5580 },
        pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
        assignedDriver: {
          driverId: 'DRV-103',
          name: 'Vikram Singh',
          phone: '+91 98251 77889',
          rating: 4.7,
          vehicleNo: 'GJ-01-EF-8890',
          location: { lat: 23.0300, lng: 72.5650 }
        },
        status: 'Driver Assigned',
        distanceKm: 2.5,
        etaMinutes: 15,
        amount: 150,
        itemCount: 1,
        pickupOtp: '3341',
        requestedAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        requestId: '#DEL-1020',
        orderId: '#1021',
        providerEmail: 'menxoxo50@gmail.com',
        providerName: 'Xoxo Men Kitchen',
        customerName: 'Vikram Mehta',
        customerPhone: '+91 98980 11223',
        tiffinName: 'Panjabi Deluxe Thali × 2',
        deliveryAddress: { street: 'A-101 Green Acres, Satellite', city: 'Ahmedabad', lat: 23.0280, lng: 72.5100 },
        pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
        assignedDriver: {
          driverId: 'DRV-104',
          name: 'Jayesh Parmar',
          phone: '+91 98251 99000',
          rating: 4.85,
          vehicleNo: 'GJ-01-GH-3344',
          location: { lat: 23.0280, lng: 72.5100 }
        },
        status: 'Delivered',
        distanceKm: 3.5,
        etaMinutes: 0,
        amount: 320,
        itemCount: 2,
        pickupOtp: '7765',
        requestedAt: new Date(Date.now() - 120 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 115 * 60 * 1000),
        pickedUpAt: new Date(Date.now() - 95 * 60 * 1000),
        deliveredAt: new Date(Date.now() - 65 * 60 * 1000)
      }
    ];

    await deliveryColl.insertMany(diverseRequests);
    console.log('Inserted diverse dynamic delivery requests into MongoDB!');

    // Update order collection deliveryPartnerName fields so every order in Order collection has a unique driver!
    await orderColl.updateOne({ orderId: '#1024' }, { $set: { deliveryPartnerName: 'Rahul Sharma', deliveryPartnerPhone: '+91 98251 44556' } });
    await orderColl.updateOne({ orderId: '#1025' }, { $set: { deliveryPartnerName: 'Arjun Patel', deliveryPartnerPhone: '+91 98251 11223' } });
    await orderColl.updateOne({ orderId: '#1026' }, { $set: { deliveryPartnerName: 'Vikram Singh', deliveryPartnerPhone: '+91 98251 77889' } });
    await orderColl.updateOne({ orderId: '#1021' }, { $set: { deliveryPartnerName: 'Jayesh Parmar', deliveryPartnerPhone: '+91 98251 99000' } });
    console.log('Updated Order collection with diverse unique delivery partners!');

    process.exit(0);
  } catch (err) {
    console.error('Error resetting delivery requests:', err);
    process.exit(1);
  }
}

resetDeliveryRequestsInDb();
