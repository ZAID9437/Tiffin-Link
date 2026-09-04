const mongoose = require('mongoose');

const deliveryRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true
  },
  providerEmail: {
    type: String,
    default: ''
  },
  providerName: {
    type: String,
    default: ''
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
  tiffinName: {
    type: String,
    default: 'Gujarati Veg Thali × 2'
  },
  tiffinCategory: {
    type: String,
    default: 'Gujarati'
  },
  pickupOtp: {
    type: String,
    default: ''
  },
  deliveryOtp: {
    type: String,
    default: ''
  },
  pickupOtpVerified: {
    type: Boolean,
    default: false
  },
  deliveryOtpVerified: {
    type: Boolean,
    default: false
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  arrivedAt: Date,
  pickedUpAt: Date,
  outForDeliveryAt: Date,
  nearCustomerAt: Date,
  deliveredAt: Date
});

deliveryRequestSchema.index({ providerId: 1, requestedAt: -1 });

module.exports = mongoose.model('DeliveryRequest', deliveryRequestSchema);
