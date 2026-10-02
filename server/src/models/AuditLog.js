const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      enum: ['provider', 'driver', 'customer', 'order', 'finance', 'system'],
      required: true
    },
    entityId: {
      type: String,
      default: ''
    },
    performedBy: {
      type: String,
      default: 'Super Admin'
    },
    details: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
