const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true
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
    default: '+91 98765 43210'
  },
  customerTotalOrders: {
    type: Number,
    default: 12
  },
  customerTotalReviews: {
    type: Number,
    default: 3
  },
  tiffinId: {
    type: String,
    default: ''
  },
  tiffinName: {
    type: String,
    required: true
  },
  tiffinCategory: {
    type: String,
    default: 'Gujarati'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  foodQualityRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  packagingRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  tasteRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 4
  },
  orderAmount: {
    type: Number,
    default: 240
  },
  orderQuantity: {
    type: Number,
    default: 2
  },
  comment: {
    type: String,
    required: true
  },
  providerReply: {
    type: String,
    default: ''
  },
  repliedAt: {
    type: Date
  },
  repliedBy: {
    type: String,
    default: 'Provider Kitchen'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.index({ providerId: 1, createdAt: -1 });
reviewSchema.index({ providerId: 1, rating: -1 });
reviewSchema.index({ providerId: 1, tiffinName: 1 });

module.exports = mongoose.model('Review', reviewSchema);
