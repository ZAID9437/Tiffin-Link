const mongoose = require('mongoose');

const payoutMethodSchema = new mongoose.Schema({
  payoutMethodId: {
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
  type: {
    type: String,
    enum: ['BANK_ACCOUNT', 'UPI'],
    required: true
  },
  bankName: {
    type: String,
    default: ''
  },
  accountNumberMasked: {
    type: String,
    default: ''
  },
  accountNumberHash: {
    type: String,
    default: ''
  },
  ifscCode: {
    type: String,
    default: ''
  },
  upiHandleMasked: {
    type: String,
    default: ''
  },
  upiHandleHash: {
    type: String,
    default: ''
  },
  beneficiaryName: {
    type: String,
    required: true,
    default: 'Rahul Verma'
  },
  branchName: {
    type: String,
    default: ''
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['VERIFIED', 'PENDING', 'REJECTED', 'FAILED'],
    default: 'VERIFIED',
    index: true
  },
  verificationProvider: {
    type: String,
    default: 'CASHFREE'
  },
  verificationId: {
    type: String,
    default: ''
  },
  nameAtBank: {
    type: String,
    default: ''
  },
  nameMatchScore: {
    type: Number,
    default: 100
  },
  utr: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PayoutMethod', payoutMethodSchema);
