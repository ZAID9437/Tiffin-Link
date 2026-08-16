const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 4.8
  },
  vehicleNo: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    default: 'Bike'
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
    default: 'AVAILABLE'
  },
  activeDeliveries: {
    type: Number,
    default: 0
  },
  distanceKm: {
    type: Number,
    default: 1.2
  },
  currentLocation: {
    lat: { type: Number, default: 23.0225 },
    lng: { type: Number, default: 72.5714 },
    address: { type: String, default: 'Satellite, Ahmedabad' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Driver', driverSchema);
