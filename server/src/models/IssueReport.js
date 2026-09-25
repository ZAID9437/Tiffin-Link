const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  driverId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: [
      'DELIVERY_ISSUE',
      'CUSTOMER_ISSUE',
      'KITCHEN_ISSUE',
      'VEHICLE_ISSUE',
      'PAYMENT_ISSUE',
      'APP_ISSUE',
      'SAFETY_ISSUE',
      'OTHER_ISSUE'
    ],
    default: 'KITCHEN_ISSUE'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    name: { type: String, default: '' },
    url: { type: String, default: '' },
    type: { type: String, default: '' }
  }],
  location: {
    lat: { type: Number, default: 19.0596 },
    lng: { type: Number, default: 72.8295 },
    address: { type: String, default: 'Pali Hill, Bandra West, Mumbai' }
  },
  contactPreference: {
    type: String,
    enum: ['PHONE', 'CHAT', 'ASYNC'],
    default: 'PHONE'
  },
  status: {
    type: String,
    enum: ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  assignedSupervisor: {
    type: String,
    default: 'Capt. H. Mehta (Hub 12)'
  },
  slaMinutes: {
    type: Number,
    default: 15
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IssueReport', issueReportSchema);
