const mongoose = require('mongoose');

const broadcastRecipientSchema = new mongoose.Schema({
  broadcastId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broadcast',
    required: true,
    index: true
  },
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    required: true,
    index: true
  },
  recipientName: {
    type: String,
    default: ''
  },
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  dismissedAt: {
    type: Date,
    default: null
  },
  deliveryChannel: {
    type: String,
    enum: ['socket', 'push', 'sms', 'in_app'],
    default: 'socket'
  }
});

broadcastRecipientSchema.index({ broadcastId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.model('BroadcastRecipient', broadcastRecipientSchema);
