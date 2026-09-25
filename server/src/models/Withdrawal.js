const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  withdrawalId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  driverId: {
    type: String,
    required: true,
    index: true
  },
  driverName: {
    type: String,
    default: ''
  },
  driverPhone: {
    type: String,
    default: ''
  },
  driverEmail: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['IMPS', 'UPI', 'NEFT', 'Bank Transfer'],
    default: 'IMPS'
  },
  bankName: {
    type: String,
    default: 'HDFC Bank'
  },
  accountNumber: {
    type: String,
    default: '••••4198'
  },
  ifscCode: {
    type: String,
    default: 'HDFC0000240'
  },
  upiId: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'REQUESTED',
    index: true
  },
  utrRef: {
    type: String,
    default: ''
  },
  failureReason: {
    type: String,
    default: ''
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
