const mongoose = require('mongoose');

const groupOrderSchema = new mongoose.Schema({
  groupOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  mealType: {
    type: String,
    enum: ['Lunch', 'Dinner', 'Breakfast', 'Special'],
    default: 'Dinner'
  },
  date: {
    type: String,
    required: true
  },
  orderCutoffTime: {
    type: Date,
    required: true,
    index: true
  },
  targetDeliveryTime: {
    type: String,
    required: true
  },
  minimumOrdersNeeded: {
    type: Number,
    default: 10
  },
  bulkDiscountPercent: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['open', 'cutoff_passed', 'consolidating', 'dispatched_to_kitchen', 'completed', 'cancelled'],
    default: 'open',
    index: true
  },
  totalSelectionsCount: {
    type: Number,
    default: 0
  },
  totalGroupAmount: {
    type: Number,
    default: 0
  },
  finalBulkDiscountAmount: {
    type: Number,
    default: 0
  },
  consolidatedMealBreakdown: [{
    mealName: { type: String, required: true },
    dietary: { type: String, default: 'Veg' },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
  }],
  linkedMealRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealRequest',
    default: null
  },
  linkedOrderId: {
    type: String,
    default: null
  },
  createdByCoordinatorId: {
    type: String,
    required: true
  },
  coordinatorName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
