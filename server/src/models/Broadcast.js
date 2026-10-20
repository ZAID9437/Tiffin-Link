const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  broadcastId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'emergency',
      'bulk_opportunity',
      'driver_callout',
      'weather_traffic_alert',
      'kitchen_capacity_boost',
      'platform_announcement'
    ],
    default: 'platform_announcement',
    index: true
  },
  audienceType: {
    type: String,
    enum: ['all', 'providers', 'drivers', 'customers', 'corporate', 'hostel'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetArea: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [72.5178, 23.0300]
    }
  },
  targetRadiusKm: {
    type: Number,
    default: 10
  },
  targetAreaName: {
    type: String,
    default: 'All Ahmedabad Zones'
  },
  actionUrl: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    default: 'TiffinLink Dispatch Center'
  },
  totalRecipientsTargeted: {
    type: Number,
    default: 0
  },
  acknowledgedCount: {
    type: Number,
    default: 0
  },
  dismissedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

broadcastSchema.index({ targetArea: '2dsphere' });

module.exports = mongoose.model('Broadcast', broadcastSchema);
