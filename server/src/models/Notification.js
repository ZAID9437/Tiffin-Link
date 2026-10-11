const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  recipientId: {
    type: String,
    required: true,
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
    enum: ['Orders', 'Delivery', 'Customers', 'Payments', 'Reviews', 'Tiffins', 'System'],
    default: 'Orders'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'CRITICAL'],
    default: 'MEDIUM'
  },
  referenceId: {
    type: String
  },
  referenceType: {
    type: String,
    enum: ['order', 'delivery', 'review', 'payment', 'tiffin', 'system', 'safety']
  },
  metadata: {
    type: Object,
    default: {}
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
