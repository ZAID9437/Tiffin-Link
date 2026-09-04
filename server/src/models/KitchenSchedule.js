const mongoose = require('mongoose');

const weeklyDaySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  openTime: {
    type: String,
    default: '09:00 AM'
  },
  closeTime: {
    type: String,
    default: '09:00 PM'
  }
}, { _id: false });

const orderWindowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🍱'
  },
  cutoffTime: {
    type: String,
    required: true
  },
  deliveryStartTime: {
    type: String,
    required: true
  },
  deliveryEndTime: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const specialDateSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD or DD MMM
    required: true
  },
  reason: {
    type: String,
    default: 'Holiday'
  },
  status: {
    type: String,
    enum: ['CLOSED', 'SPECIAL_HOURS'],
    default: 'CLOSED'
  }
});

const kitchenScheduleSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    unique: true
  },
  weeklySchedule: [weeklyDaySchema],
  orderWindows: [orderWindowSchema],
  specialDates: [specialDateSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('KitchenSchedule', kitchenScheduleSchema);
