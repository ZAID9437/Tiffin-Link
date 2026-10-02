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
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE', 'PAUSED'],
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String,
    default: ''
  },
  dob: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: 'Male'
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  hubAssociation: {
    type: String,
    default: ''
  },
  cluster: {
    type: String,
    default: ''
  },
  tier: {
    type: String,
    default: 'Tier 1 Senior Courier'
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: true
  },
  whatsappNotifications: {
    type: Boolean,
    default: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: true
  },
  lastPasswordChange: {
    type: Date,
    default: () => new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
  },
  healthAttestation: {
    type: String,
    default: 'Completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Driver', driverSchema);
