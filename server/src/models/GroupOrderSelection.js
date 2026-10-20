const mongoose = require('mongoose');

const groupOrderSelectionSchema = new mongoose.Schema({
  groupOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOrder',
    required: true,
    index: true
  },
  residentUserId: {
    type: String,
    required: true,
    index: true
  },
  residentName: {
    type: String,
    required: true
  },
  residentRoomNumber: {
    type: String,
    required: true
  },
  residentPhone: {
    type: String,
    required: true
  },
  selectedMeal: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },
  finalPriceAfterDiscount: {
    type: Number,
    required: true
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'cash_on_delivery', 'hostel_account'],
    default: 'paid'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

groupOrderSelectionSchema.index({ groupOrderId: 1, residentUserId: 1 });

module.exports = mongoose.model('GroupOrderSelection', groupOrderSelectionSchema);
