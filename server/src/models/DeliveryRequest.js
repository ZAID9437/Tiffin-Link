const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true
  },
  providerEmail: {
    type: String,
    default: 'menxoxo50@gmail.com'
  },
  providerName: {
    type: String,
    default: 'Mansuri Kitchen'
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: '+91 98765 43210'
  },
  deliveryAddress: {
    street: { type: String, default: '102, Shivalik Residency, CG Road' },
    city: { type: String, default: 'Ahmedabad' },
    lat: { type: Number, default: 23.0225 },
    lng: { type: Number, default: 72.5714 }
  },
  pickupAddress: {
    street: { type: String, default: '4, Ruhan Duplex, Opp Labbaik Park' },
    city: { type: String, default: 'Ahmedabad' },
    lat: { type: Number, default: 23.0300 },
    lng: { type: Number, default: 72.5650 }
  },
  assignedDriver: {
    driverId: { type: String, default: '' },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    rating: { type: Number, default: 4.8 },
    vehicleNo: { type: String, default: '' },
    location: {
      lat: { type: Number, default: 23.0280 },
      lng: { type: Number, default: 72.5670 }
    }
  },
  status: {
    type: String,
    enum: ['Searching Drivers', 'Driver Assigned', 'Arrived at Provider', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Searching Drivers'
  },
  distanceKm: {
    type: Number,
    default: 1.8
  },
  etaMinutes: {
    type: Number,
    default: 12
  },
  amount: {
    type: Number,
    default: 240
  },
  itemCount: {
    type: Number,
    default: 2
  },
  candidateDrivers: [
    {
      driverId: String,
      name: String,
      phone: String,
      rating: Number,
      distanceKm: Number,
      status: { type: String, enum: ['Offered', 'Accepted', 'Rejected', 'Passed'], default: 'Offered' }
    }
  ],
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
});

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
