const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  emergencyId: {
    type: String,
    required: true,
    unique: true
  },
  mealRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealRequest',
    required: true,
    index: true
  },
  customerId: {
    type: String,
    default: ''
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  targetDeliveryMinutes: {
    type: Number,
    required: true,
    default: 30
  },
  deadlineAt: {
    type: Date,
    required: true,
    index: true
  },
  severityReason: {
    type: String,
    enum: ['medical_dietary', 'child_feeding', 'elderly_care', 'late_office_shift', 'travel_transit', 'immediate_hunger', 'other'],
    default: 'immediate_hunger'
  },
  specialNote: {
    type: String,
    default: ''
  },
  urgencySurcharge: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['evaluating', 'broadcasted', 'accepted', 'unfulfillable', 'cancelled', 'completed'],
    default: 'evaluating',
    index: true
  },
  notifiedProvidersCount: {
    type: Number,
    default: 0
  },
  acceptedProviderId: {
    type: String,
    default: null
  },
  resultingOrderId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
