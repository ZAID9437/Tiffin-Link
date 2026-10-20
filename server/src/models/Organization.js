const mongoose = require('mongoose');

const deliverySiteSchema = new mongoose.Schema({
  siteName: { type: String, required: true },
  floorRoom: { type: String, default: '' },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, default: 23.0300 },
    lng: { type: Number, default: 72.5178 }
  },
  contactPerson: { type: String, default: '' },
  contactPhone: { type: String, default: '' }
}, { _id: true });

const organizationSchema = new mongoose.Schema({
  orgCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  businessEmailDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  contactPerson: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  taxIdGst: {
    type: String,
    default: ''
  },
  billingAddress: {
    type: String,
    default: ''
  },
  monthlyBudgetLimit: {
    type: Number,
    required: true,
    default: 50000
  },
  currentMonthSpent: {
    type: Number,
    default: 0
  },
  dailyPerMealSubsidy: {
    type: Number,
    default: 150
  },
  deliverySites: [deliverySiteSchema],
  status: {
    type: String,
    enum: ['active', 'paused', 'pending_approval'],
    default: 'active',
    index: true
  },
  createdByUserId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
