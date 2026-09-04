const mongoose = require('mongoose');

const tiffinSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: 'Authentic home-style thali prepared fresh daily.'
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: 'Gujarati'
  },
  foodType: {
    type: String,
    default: 'Veg'
  },
  capacity: {
    type: Number,
    default: 30
  },
  available: {
    type: Number,
    default: 30
  },
  days: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  area: {
    type: String,
    default: 'All Localities'
  },
  ingredients: {
    type: String,
    default: 'Fresh veggies, Whole wheat flour, Pure Ghee'
  },
  ordersToday: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 4.8
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Sold Out'],
    default: 'Active'
  },
  image: {
    type: String,
    default: '/assets/provider_1.png'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

tiffinSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model('Tiffin', tiffinSchema);
