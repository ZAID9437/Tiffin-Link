const mongoose = require('mongoose');

const attendeeOrderSchema = new mongoose.Schema({
  employeeUserId: { type: String, required: true },
  employeeName: { type: String, required: true },
  mealChoice: { type: String, required: true },
  dietaryPreference: { type: String, default: 'Standard' },
  subsidizedAmount: { type: Number, default: 0 },
  employeeCoPay: { type: Number, default: 0 }
}, { _id: false });

const corporateMealOrderSchema = new mongoose.Schema({
  corporateOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  eventDate: {
    type: String,
    required: true
  },
  deliveryTimeSlot: {
    type: String,
    required: true
  },
  deliverySiteName: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryCoordinates: {
    lat: { type: Number, default: 23.0300 },
    lng: { type: Number, default: 72.5178 }
  },
  coordinatorUserId: {
    type: String,
    required: true,
    index: true
  },
  coordinatorName: {
    type: String,
    required: true
  },
  attendees: [attendeeOrderSchema],
  headcount: {
    type: Number,
    required: true,
    default: 1
  },
  estimatedTotalBudget: {
    type: Number,
    required: true
  },
  finalTotalAmount: {
    type: Number,
    default: 0
  },
  companySubsidizedTotal: {
    type: Number,
    default: 0
  },
  approvalStatus: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected'],
    default: 'pending_approval',
    index: true
  },
  approvedByUserId: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  linkedMealRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealRequest',
    default: null
  },
  linkedOrderId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('CorporateMealOrder', corporateMealOrderSchema);
