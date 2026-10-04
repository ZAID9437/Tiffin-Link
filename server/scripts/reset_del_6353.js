const mongoose = require('mongoose');

async function reset() {
  await mongoose.connect('mongodb://localhost:27017/tiffinlink');
  const DeliveryRequest = require('../src/models/DeliveryRequest');
  const Order = require('../src/models/Order');

  const defaultDriver = {
    driverId: '',
    name: '',
    phone: '',
    rating: 4.8,
    vehicleNo: '',
    location: { lat: 23.0280, lng: 72.5670, accuracy: 0, updatedAt: new Date() }
  };

  await DeliveryRequest.updateOne(
    { requestId: '#DEL-6353' },
    {
      $set: {
        status: 'Searching Drivers',
        assignedDriver: defaultDriver,
        pickupOtpVerified: false,
        deliveryOtpVerified: false,
        acceptedAt: null,
        payout: 25,
        deliveryFee: 25,
        driverEarning: 25
      }
    }
  );

  await Order.updateOne(
    { orderId: 'TL-8802' },
    {
      $set: {
        status: 'Ready',
        deliveryStatus: 'Searching',
        driverId: '',
        deliveryPartnerName: '',
        deliveryPartnerPhone: '',
        assignedAt: null
      }
    }
  );

  console.log('Reset #DEL-6353 and Order TL-8802 to Searching Drivers state with valid assignedDriver object!');
  await mongoose.disconnect();
}
reset().catch(console.error);
