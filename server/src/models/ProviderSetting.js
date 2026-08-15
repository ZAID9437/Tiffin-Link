const mongoose = require('mongoose');

const providerSettingSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    unique: true,
    default: 'prov_1'
  },
  account: {
    name: { type: String, default: 'Zaid Mansuri' },
    email: { type: String, default: 'provider@tiffinlink.com' },
    phone: { type: String, default: '+91 98765 43210' },
    avatarUrl: { type: String, default: '/assets/provider_1.png' },
    accountStatus: { type: String, default: 'Verified Active' }
  },
  business: {
    providerName: { type: String, default: 'Shreeji Authentic Tiffins' },
    description: { type: String, default: 'Authentic home-cooked Gujarati thali, Jain food, and North Indian meals prepared with fresh ingredients and pure ghee.' },
    address: { type: String, default: '102, Shivalik Plaza, CG Road' },
    city: { type: String, default: 'Ahmedabad' },
    serviceArea: { type: String, default: 'CG Road, Paldi, Navrangpura, Satellite (5km radius)' },
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '21:30' },
    businessStatus: { type: String, default: 'Open for Orders' }
  },
  tiffin: {
    defaultAvailability: { type: Boolean, default: true },
    maxDailyLimit: { type: Number, default: 50 },
    vegPreference: { type: String, default: 'Pure Veg Only' },
    deliveryAvailable: { type: Boolean, default: true },
    autoPauseLimit: { type: Boolean, default: true }
  },
  orders: {
    acceptingOrders: { type: Boolean, default: true },
    autoAccept: { type: Boolean, default: true },
    prepTimeMinutes: { type: Number, default: 30 },
    minOrderAmount: { type: Number, default: 120 },
    cancellationRules: { type: String, default: 'Free cancellation up to 30 mins before dispatch' }
  },
  notifications: {
    newOrder: { type: Boolean, default: true },
    orderCompleted: { type: Boolean, default: true },
    orderCancelled: { type: Boolean, default: true },
    newReview: { type: Boolean, default: true },
    paymentReceived: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true }
  },
  payments: {
    payoutMethod: { type: String, default: 'Bank Transfer (IMPS)' },
    bankName: { type: String, default: 'HDFC Bank' },
    ifscCode: { type: String, default: 'HDFC0001234' },
    accountNumber: { type: String, default: '•••• •••• 8902' },
    upiId: { type: String, default: 'shreejitiffin@okicici' },
    autoPayout: { type: Boolean, default: true }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    activeSessions: { type: Number, default: 2 },
    lastPasswordChange: { type: String, default: '14 Aug 2026' }
  },
  preferences: {
    language: { type: String, default: 'English (India)' },
    currency: { type: String, default: 'INR (₹)' },
    timeFormat: { type: String, default: '12-hour (AM/PM)' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    timezone: { type: String, default: 'Asia/Kolkata (IST)' }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProviderSetting', providerSettingSchema);
