const mongoose = require('mongoose');

const smartQueueSchema = new mongoose.Schema({
  queueType: {
    type: String,
    enum: ['provider_prep', 'delivery_dispatch'],
    required: true,
    index: true
  },
  orderId: {
    type: String,
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
    default: ''
  },
  driverId: {
    type: String,
    default: null,
    index: true
  },
  customerName: {
    type: String,
    default: ''
  },
  customerAddress: {
    type: String,
    default: ''
  },
  mealTitle: {
    type: String,
    default: 'Homestyle Meal'
  },
  quantity: {
    type: Number,
    default: 1
  },
  isUrgent: {
    type: Boolean,
    default: false,
    index: true
  },
  urgencyLevel: {
    type: String,
    enum: ['standard', 'urgent', 'emergency'],
    default: 'standard'
  },
  priorityScore: {
    type: Number,
    default: 50, // Higher score = higher priority in queue
    index: true
  },
  status: {
    type: String,
    enum: [
      'queued',             // in queue waiting for prep to start
      'preparing',          // kitchen currently cooking
      'ready_for_pickup',   // kitchen finished, ready for driver
      'driver_assigned',    // driver en route to kitchen
      'picked_up',          // driver has food
      'completed',          // delivered
      'cancelled'
    ],
    default: 'queued',
    index: true
  },
  targetReadyTime: {
    type: Date
  },
  actualReadyTime: {
    type: Date
  },
  targetDeliveryTime: {
    type: Date
  },
  claimedAt: {
    type: Date
  },
  lockToken: {
    type: String,
    default: null
  },
  lockExpiresAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

smartQueueSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

smartQueueSchema.index({ queueType: 1, status: 1, priorityScore: -1 });

module.exports = mongoose.model('SmartQueue', smartQueueSchema);
