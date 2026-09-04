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
    enum: ['Orders', 'Customers', 'Payments', 'Reviews', 'Tiffins', 'System'],
    default: 'Orders'
  },
  read: {
    type: Boolean,
    default: false
  },
  referenceId: {
    type: String
  },
  referenceType: {
    type: String,
    enum: ['order', 'review', 'payment', 'tiffin', 'system']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
