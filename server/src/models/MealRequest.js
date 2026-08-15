const mongoose = require('mongoose');

const mealRequestSchema = new mongoose.Schema({
  customerName: {
    type: String,
    default: 'Customer'
  },
  customerPhone: {
    type: String,
    default: '+91 98765 43210'
  },
  mealType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  date: {
    type: String,
    default: 'Today'
  },
  time: {
    type: String,
    default: '5:00 PM'
  },
  deliveryType: {
    type: String,
    default: 'Delivery'
  },
  location: {
    type: String,
    default: 'Satellite, Ahmedabad'
  },
  distance: {
    type: String,
    default: '1.8 km'
  },
  budget: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MealRequest', mealRequestSchema);
