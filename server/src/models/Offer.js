const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealRequest',
    required: true,
    index: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  providerName: {
    type: String,
    required: true
  },
  providerRating: {
    type: Number,
    default: 4.8
  },
  providerReviewsCount: {
    type: Number,
    default: 24
  },
  providerImage: {
    type: String,
    default: ''
  },
  kitchenAddress: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  readyTimeMinutes: {
    type: Number,
    default: 25
  },
  estimatedDeliveryTime: {
    type: String,
    default: '30-40 mins'
  },
  itemsIncluded: [{
    name: { type: String },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 }
  }],
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'selected', 'rejected', 'withdrawn', 'expired'],
    default: 'pending',
    index: true
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Offer', offerSchema);
