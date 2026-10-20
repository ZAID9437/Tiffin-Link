const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  hostelCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Hostel', 'PG', 'Student_Residence', 'Co_Living'],
    default: 'PG'
  },
  address: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number, default: 23.0300 },
    lng: { type: Number, default: 72.5178 }
  },
  wardenName: {
    type: String,
    required: true
  },
  wardenPhone: {
    type: String,
    required: true
  },
  wardenEmail: {
    type: String,
    default: ''
  },
  totalResidentsCount: {
    type: Number,
    default: 50
  },
  dropPointInstructions: {
    type: String,
    default: 'Leave at security gate reception counter'
  },
  coordinators: [{
    userId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, default: 'Resident Coordinator' }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Hostel', hostelSchema);
