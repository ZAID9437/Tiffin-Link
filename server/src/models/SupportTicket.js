const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  senderId: { type: String, default: '' },
  senderRole: { type: String, enum: ['provider', 'support', 'system'], default: 'provider' },
  senderName: { type: String, default: '' },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

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
    enum: ['Orders', 'Tiffins', 'Payments', 'Delivery', 'Customers', 'Account & Security', 'Technical Issue', 'Other'],
    default: 'Orders'
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
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
  assignedTo: {
    type: String,
    default: 'TiffinLink Support Team'
  },
  messages: [ticketMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
});

supportTicketSchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

