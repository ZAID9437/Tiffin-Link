const mongoose = require('mongoose');

const safetyAcknowledgementSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    index: true
  },
  guidelineVersion: {
    type: String,
    default: 'SAF-902-v4.2'
  },
  acknowledgedAt: {
    type: Date,
    default: Date.now
  },
  digitalSignature: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SafetyAcknowledgement', safetyAcknowledgementSchema);
