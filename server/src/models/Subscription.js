const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subId: {
    type: String,
    required: true,
    unique: true
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
  plan: {
    type: String,
    required: true
  },
  mealType: {
    type: String,
    required: true
  },
  pricePerMeal: {
    type: Number,
    required: true
  },
  nextMeal: {
    type: String,
    default: 'Tomorrow • 12:30 PM'
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
