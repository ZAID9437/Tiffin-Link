const mongoose = require('mongoose');

const sosEventSchema = new mongoose.Schema({
  sosId: {
    type: String,
    required: true,
    unique: true
  },
  driverId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  location: {
    lat: { type: Number, default: 19.0596 },
    lng: { type: Number, default: 72.8295 },
    accuracy: { type: Number, default: 10 },
    address: { type: String, default: 'Bandra West, Mumbai' }
  },
  emergencyContactsNotified: [{
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' },
    notifiedAt: { type: Date, default: Date.now }
  }],
  note: {
    type: String,
    default: ''
  },
  activatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SosEvent', sosEventSchema);
