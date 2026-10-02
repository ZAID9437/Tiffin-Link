const mongoose = require('mongoose');

const driverKycSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  initials: {
    type: String,
    default: 'DP'
  },
  age: {
    type: Number,
    default: 25
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  vehicle: {
    type: String,
    default: 'Hero Splendor+'
  },
  plate: {
    type: String,
    required: true
  },
  submissionDate: {
    type: String,
    default: '04 Oct 2026'
  },
  submissionTime: {
    type: String,
    default: '11:20:14 IST'
  },
  attestation: {
    aadhaar: { type: Boolean, default: true },
    dl: { type: Boolean, default: true },
    rc: { type: Boolean, default: true },
    ins: { type: Boolean, default: true }
  },
  bank: {
    name: { type: String, default: 'State Bank of India (SBI)' },
    account: { type: String, default: '390281009012' },
    masked: { type: String, default: '•••• 9012' },
    ifsc: { type: String, default: 'SBIN0001042' },
    branch: { type: String, default: 'Paldi Branch' },
    pennyVerified: { type: Boolean, default: true },
    beneficiary: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['READY_APPROVAL', 'CORRECTION_NEEDED', 'FLAGGED_EXPIRED_DL', 'INCOMPLETE_KYC', 'APPROVED', 'REJECTED_BLACKLIST'],
    default: 'READY_APPROVAL'
  },
  statusLabel: {
    type: String,
    default: 'Ready For Approval'
  },
  statusTone: {
    type: String,
    default: 'emerald'
  },
  jurisdiction: {
    type: String,
    default: 'Paldi, Ahmedabad'
  },
  pin: {
    type: String,
    default: '380007'
  },
  zone: {
    type: String,
    default: 'AMD-CENTRAL'
  },
  matchConfidence: {
    type: Number,
    default: 98.4
  },
  livenessScore: {
    type: Number,
    default: 0.984
  },
  selfieUrl: {
    type: String,
    default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCBk5CH2J1RsxevNHcmQJ1wQNbYH4sQA9DDY1c4HpR59Q0Yw5Yt-WMl8wztua0NTWrOySsrXsEGNJ9S-GpjHw_398sEjroHyP-norXIqnxsGE3JVQZoyMpepItB8CKJZIytosNTjywuIjUaR_yntVrXUDgjhTDn01M3jofpvZeTOtXCwHsT1pD3j3JQnVOmramQbicTg8n_nAKaiee5nDPh0PD2jTWFoAul_hc6WzzB9YdlOEn1_b7'
  },
  aadhaarData: {
    refHash: { type: String, default: '' },
    recordName: { type: String, default: '' },
    maskedUid: { type: String, default: '' },
    dob: { type: String, default: '' },
    gender: { type: String, default: 'MALE' },
    address: { type: String, default: '' },
    xmlSha: { type: String, default: '' }
  },
  dlData: {
    number: { type: String, default: '' },
    vehicleClass: { type: String, default: '' },
    authority: { type: String, default: '' },
    expiry: { type: String, default: '' },
    scanConfidence: { type: String, default: '99.2%' },
    flag: { type: String, default: null },
    scanUrl: { type: String, default: '' }
  },
  rcData: {
    plate: { type: String, default: '' },
    model: { type: String, default: '' },
    chassis: { type: String, default: '' },
    emission: { type: String, default: 'Bharat Stage VI (BS-VI)' },
    fitness: { type: String, default: '' },
    fuel: { type: String, default: 'Petrol' },
    owner: { type: String, default: '' }
  },
  insData: {
    provider: { type: String, default: '' },
    policyNo: { type: String, default: '' },
    coverage: { type: String, default: '' },
    expiry: { type: String, default: '' },
    token: { type: String, default: '' }
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  reuploadNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DriverKyc', driverKycSchema);
