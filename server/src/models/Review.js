const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    default: 'prov_1'
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
