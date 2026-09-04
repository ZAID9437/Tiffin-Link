const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  providerEmail: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Orders', 'Tiffins', 'Payments', 'Delivery', 'Reviews', 'Notifications', 'Account & Security'],
    default: 'Orders'
  },
  relatedOrderId: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Waiting for Provider', 'Resolved', 'Closed'],
    default: 'Open'
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

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
