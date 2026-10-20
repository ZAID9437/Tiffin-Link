const mongoose = require('mongoose');

const riskEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'payment_failure_burst',
      'cancellation_velocity',
      'duplicate_account_device',
      'order_frequency_spike',
      'unusual_high_value_order',
      'frequent_address_change',
      'driver_telemetry_jump',
      'suspicious_otp_failure'
    ],
    index: true
  },
  userId: {
    type: String,
    default: '',
    index: true
  },
  userEmail: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    default: 'customer'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  riskPoints: {
    type: Number,
    required: true,
    default: 10
  },
  resourceType: {
    type: String,
    enum: ['order', 'payment', 'request', 'user', 'driver', 'provider'],
    default: 'order'
  },
  resourceId: {
    type: String,
    default: ''
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('RiskEvent', riskEventSchema);
