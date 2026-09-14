const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  deliveryId: {
    type: String,
    index: true
  },
  orderId: {
    type: String
  },
  providerId: {
    type: String
  },
  purpose: {
    type: String,
    default: 'AUTH',
    enum: ['AUTH', 'KITCHEN_PICKUP', 'CUSTOMER_DELIVERY', 'CUSTOMER_ARRIVAL', 'CUSTOMER_HANDOVER'],
    index: true
  },
  otp: {
    type: String
  },
  hashedOtp: {
    type: String
  },
  attempts: {
    type: Number,
    default: 0
  },
  verifiedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minute MongoDB TTL for record cleanup
  }
});

module.exports = mongoose.model('Otp', otpSchema);
