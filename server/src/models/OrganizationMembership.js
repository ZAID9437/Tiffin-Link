const mongoose = require('mongoose');

const organizationMembershipSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['org_admin', 'coordinator', 'employee'],
    default: 'employee',
    index: true
  },
  department: {
    type: String,
    default: 'Operations'
  },
  monthlyAllowance: {
    type: Number,
    default: 3000
  },
  allowanceSpentThisMonth: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_verification'],
    default: 'active',
    index: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

organizationMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationMembership', organizationMembershipSchema);
