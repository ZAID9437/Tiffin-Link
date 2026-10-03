const mongoose = require('mongoose');

const tiffinItemSchema = new mongoose.Schema({
  tiffinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tiffin',
    required: true,
    index: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Breads', 'Vegetable Curries', 'Dal & Kadhi', 'Rice & Khichdi', 'Farsan', 'Accompaniments', 'Sweets', 'Other'],
    default: 'Other'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    default: 'piece'
  },
  defaultQuantity: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  minQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  maxQuantity: {
    type: Number,
    default: 10,
    min: 1
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: 50,
    min: 0
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  isDefault: {
    // Whether this item is part of the default tiffin (auto-included)
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isCustomizable: {
    // Whether customer can adjust quantity
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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

tiffinItemSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

tiffinItemSchema.index({ tiffinId: 1, category: 1, sortOrder: 1 });
tiffinItemSchema.index({ providerId: 1, isAvailable: 1 });

module.exports = mongoose.model('TiffinItem', tiffinItemSchema);
