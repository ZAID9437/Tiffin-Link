const mongoose = require('mongoose');

const deliveryPartnerApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: ''
  },
  // Address Details
  houseNo: { type: String, default: '' },
  streetName: { type: String, default: '' },
  area: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  // Vehicle Details
  vehicleType: { type: String, default: 'motorcycle' },
  registrationNo: { type: String, default: '' },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  // Driving License Details
  licenseNumber: { type: String, default: '' },
  licenseCopy: { type: String, default: '' }, // Base64 or URL
  licenseCopyName: { type: String, default: '' },
  // ID Verification
  idType: { type: String, default: 'Passport' },
  idNumber: { type: String, default: '' },
  idFront: { type: String, default: '' },
  idFrontName: { type: String, default: '' },
  idBack: { type: String, default: '' },
  idBackName: { type: String, default: '' },
  // Bank Account Details
  accountHolderName: { type: String, default: '' },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  routingCode: { type: String, default: '' },
  upiId: { type: String, default: '' },
  // Emergency Contact
  emergencyName: { type: String, default: '' },
  emergencyRelationship: { type: String, default: '' },
  emergencyMobile: { type: String, default: '' },
  // Preferences
  workingDays: [{ type: String }],
  timeSlot: { type: String, default: '' },
  preferredArea: { type: String, default: '' },
  startImmediately: { type: Boolean, default: false },
  experience: { type: String, default: '' },
  languages: { type: String, default: '' },
  referralCode: { type: String, default: '' },
  // Declarations
  confirmAccurate: { type: Boolean, default: true },
  agreePrivacy: { type: Boolean, default: true },
  understandBackgroundCheck: { type: Boolean, default: true },
  // Application Status & Verification Audit
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectedDocuments: [{ type: String }],
  rejectionReason: { type: String, default: '' },
  verifiedAt: { type: Date },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeliveryPartnerApplication', deliveryPartnerApplicationSchema);
