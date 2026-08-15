const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  payoutId: {
    type: String,
    required: true,
    unique: true
  },
  providerName: {
    type: String,
    default: 'Shreeji Tiffin Services'
  },
  amount: {
    type: Number,
    required: true
  },
  bankName: {
    type: String,
    default: 'HDFC Bank'
  },
  accountNumber: {
    type: String,
    default: '•••• 8902'
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Failed'],
    default: 'Pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Payout', payoutSchema);
