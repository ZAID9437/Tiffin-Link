const mongoose = require('mongoose');

const serviceAreaSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  areaName: {
    type: String,
    required: true,
    trim: true
  },
  radiusKm: {
    type: Number,
    required: true,
    default: 5
  },
  latitude: {
    type: Number,
    default: 23.0300
  },
  longitude: {
    type: Number,
    default: 72.5650
  },
  customersCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
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

module.exports = mongoose.model('ServiceArea', serviceAreaSchema);
