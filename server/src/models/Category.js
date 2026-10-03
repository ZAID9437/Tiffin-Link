const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  providerId: {
    type: String,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: 'Delicious home-cooked meal category.'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  image: {
    type: String,
    default: '/assets/provider_1.png'
  }
}, { timestamps: true });

categorySchema.index({ providerId: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
