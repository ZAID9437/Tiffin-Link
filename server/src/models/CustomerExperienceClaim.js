const mongoose = require('mongoose');

const customerExperienceClaimSchema = new mongoose.Schema({
  claimType: {
    type: String,
    enum: ['taste_guarantee', 'meal_swap', 'dietitian_consult', 'dabba_return', 'corporate_inquiry'],
    required: true
  },
  userId: { type: String, default: null },
  userName: { type: String, default: '' },
  orderId: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processed', 'completed', 'rejected'],
    default: 'approved'
  },
  refundAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CustomerExperienceClaim', customerExperienceClaimSchema);
