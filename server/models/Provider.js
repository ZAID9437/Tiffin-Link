const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  businessName: { type: String, default: '' },
  businessType: { type: String, default: 'Home Kitchen' },
  cuisines: { type: String, default: '' },
  fssaiNumber: { type: String, default: '' },
  rating: {
    type: Number,
    default: 4.8
  },
  eta: {
    type: String,
    default: '30-40 min'
  },
  price: {
    type: Number,
    default: 120
  },
  tags: {
    type: [String],
    default: []
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

module.exports = mongoose.model('Provider', ProviderSchema);
