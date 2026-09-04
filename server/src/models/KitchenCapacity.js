const mongoose = require('mongoose');

const kitchenCapacitySchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  dateLabel: {
    type: String, // E.g., Today, Tomorrow, 18 Aug
    default: ''
  },
  maxCapacity: {
    type: Number,
    required: true,
    default: 50
  },
  autoStopOrders: {
    type: Boolean,
    default: true
  },
  allowOverbooking: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['OPEN', 'FULL', 'PAUSED'],
    default: 'OPEN'
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

// Ensure compound index for providerId + date
kitchenCapacitySchema.index({ providerId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('KitchenCapacity', kitchenCapacitySchema);
