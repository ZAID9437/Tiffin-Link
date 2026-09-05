const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const mealRequestSchema = new mongoose.Schema({
  customerName: {
    type: String,
    default: 'Customer'
  },
  customerPhone: {
    type: String,
    default: '+91 98765 43210'
  },
  customerAddress: {
    type: String,
    default: 'Satellite, Ahmedabad'
  },
  mealType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Gujarati'
  },
  items: {
    type: [mealItemSchema],
    default: []
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
  totalAmount: {
    type: Number
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 1000) // 2 minutes validity by default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-fill totalAmount and items if not provided
mealRequestSchema.pre('save', function(next) {
  if (!this.totalAmount) {
    this.totalAmount = (this.quantity || 1) * (this.budget || 100);
  }
  if (!this.items || this.items.length === 0) {
    this.items = [{
      name: this.mealType,
      qty: this.quantity || 1,
      price: this.budget || 100
    }];
  }
  next();
});

module.exports = mongoose.model('MealRequest', mealRequestSchema);

