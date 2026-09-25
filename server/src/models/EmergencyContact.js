const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    default: 'Other',
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  autoSmsEnabled: {
    type: Boolean,
    default: true
  },
  autoCallEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
