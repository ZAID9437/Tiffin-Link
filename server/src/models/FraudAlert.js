const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  previousState: { type: String },
  newState: { type: String }
}, { _id: false });

const fraudAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ruleId: {
    type: String,
    required: true,
    index: true
  },
  ruleName: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'under_investigation', 'resolved', 'dismissed'],
    default: 'open',
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    default: 70
  },
  reasonCode: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['order', 'payment', 'request', 'user', 'provider', 'driver'],
    required: true
  },
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: '',
    index: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  evidence: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  assignedAdminId: {
    type: String,
    default: null
  },
  assignedAdminName: {
    type: String,
    default: null
  },
  resolutionAction: {
    type: String,
    enum: ['none', 'warning_issued', 'user_shadowbanned', 'user_suspended', 'order_blocked', 'false_positive_cleared'],
    default: 'none'
  },
  resolutionNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date
  },
  auditTrail: [auditEntrySchema],
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

fraudAlertSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
