const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  subId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    default: ''
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    default: ''
  },
  customerPhone: {
    type: String,
    required: true
  },
  tiffinId: {
    type: String,
    default: ''
  },
  plan: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Custom days'],
    default: 'Daily'
  },
  deliveryDays: {
    type: [String],
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  },
  mealType: {
    type: String,
    default: 'Lunch'
  },
  pricePerMeal: {
    type: Number,
    default: 120
  },
  amount: {
    type: Number,
    default: 3200
  },
  startDate: {
    type: String,
    default: '01 Aug 2026'
  },
  endDate: {
    type: String,
    default: '31 Aug 2026'
  },
  nextDeliveryDate: {
    type: String,
    default: '18 Aug 2026'
  },
  address: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PENDING', 'FAILED', 'REFUNDED'],
    default: 'PAID'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  pausedAt: {
    type: Date
  },
  resumedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

subscriptionSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
