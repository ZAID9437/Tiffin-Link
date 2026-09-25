const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  startTime: { type: String, default: '09:00 AM' },
  endTime: { type: String, default: '08:00 PM' },
  breakEnabled: { type: Boolean, default: true },
  breakStart: { type: String, default: '01:00 PM' },
  breakEnd: { type: String, default: '02:00 PM' }
}, { _id: false });

const driverScheduleSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    default: ''
  },
  autoAccept: {
    type: Boolean,
    default: true
  },
  weeklySchedule: {
    monday: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) },
    tuesday: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) },
    wednesday: { type: dayScheduleSchema, default: () => ({ enabled: false, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) },
    thursday: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: '10:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) },
    friday: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: '09:00 AM', endTime: '09:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) },
    saturday: { type: dayScheduleSchema, default: () => ({ enabled: true, startTime: '10:00 AM', endTime: '06:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) },
    sunday: { type: dayScheduleSchema, default: () => ({ enabled: false, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' }) }
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DriverSchedule', driverScheduleSchema);
