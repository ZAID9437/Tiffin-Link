const mongoose = require('mongoose');

const providerSettingSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    unique: true
  },
  account: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    kitchenBrand: { type: String, default: '' },
    dispatchAddress: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    accountStatus: { type: String, default: 'Active Kitchen' },
    fssaiNo: { type: String, default: '' },
    gstinNo: { type: String, default: '' },
    tags: { type: [String], default: [] },
    emailVerified: { type: Boolean, default: true },
    phoneVerified: { type: Boolean, default: true },
    lastLogin: { type: String, default: '' },
    createdAtDate: { type: String, default: '' }
  },
  business: {
    providerName: { type: String, default: '' },
    description: { type: String, default: '' },
    foodClassification: { type: String, default: 'Pure Veg' },
    address: { type: String, default: '' },
    city: { type: String, default: 'Ahmedabad' },
    serviceArea: { type: String, default: '' },
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '21:30' },
    businessStatus: { type: String, default: 'Open for Orders' }
  },
  notifications: {
    // Order Notifications
    newOrder: { type: Boolean, default: true },
    orderAccepted: { type: Boolean, default: true },
    orderCancelled: { type: Boolean, default: true },
    orderReady: { type: Boolean, default: true },
    deliveryUpdates: { type: Boolean, default: true },
    // Business Notifications
    earningsUpdate: { type: Boolean, default: true },
    payoutUpdate: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
    capacityAlerts: { type: Boolean, default: true },
    // System Notifications
    securityAlerts: { type: Boolean, default: true },
    accountUpdates: { type: Boolean, default: true },
    systemMaintenance: { type: Boolean, default: false }
  },
  security: {
    accountSecurityStatus: { type: String, default: 'Secure' },
    securityScore: { type: Number, default: 98 },
    tierStatus: { type: String, default: 'TIER 1 VERIFIED' },
    emailVerified: { type: Boolean, default: true },
    phoneVerified: { type: Boolean, default: true },
    kycStatus: { type: String, default: 'APPROVED' },
    twoFactorEnabled: { type: Boolean, default: true },
    loginAlerts: { type: Boolean, default: true },
    autoLockMinutes: { type: Number, default: 30 },
    activeSessions: [{
      id: { type: String },
      device: { type: String },
      os: { type: String },
      browser: { type: String },
      location: { type: String },
      ip: { type: String },
      lastActive: { type: String },
      tokenSig: { type: String },
      isCurrent: { type: Boolean, default: false }
    }],
    securityLogs: [{
      id: { type: String },
      event: { type: String },
      details: { type: String },
      timestamp: { type: String },
      sig: { type: String },
      status: { type: String, default: 'SUCCESS' }
    }]
  },
  preferences: {
    appearance: { type: String, default: 'light' }, // 'light' | 'dark' | 'system'
    language: { type: String, default: 'en_IN' }, // 'en_IN' | 'gu_IN' | 'hi_IN'
    dashboardLanding: { type: String, default: 'dashboard' }, // 'dashboard' | 'live-requests' | 'orders-prep'
    tableDensity: { type: Number, default: 25 }, // 10 | 25 | 50
    autoSoldOutPoint: { type: Number, default: 0 },
    dataIngestionInterval: { type: String, default: 'websocket' }, // 'websocket' | '5s' | '15s'
    autoRefresh: { type: Boolean, default: true },
    soundAlerts: { type: Boolean, default: true },
    newOrderPopup: { type: Boolean, default: true },
    liveOrderUpdates: { type: Boolean, default: true },
    defaultMapProvider: { type: String, default: 'Google Maps' },
    navigationBehavior: { type: String, default: 'Open External' },
    compactMode: { type: Boolean, default: false },
    reduceAnimations: { type: Boolean, default: false }
  },
  payments: {
    payoutMethod: { type: String, default: 'Bank Transfer (IMPS)' },
    bankName: { type: String, default: 'HDFC Bank' },
    ifscCode: { type: String, default: 'HDFC0001234' },
    accountNumber: { type: String, default: '•••• •••• 8902' },
    upiId: { type: String, default: 'shreejitiffin@okicici' },
    autoPayout: { type: Boolean, default: true }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProviderSetting', providerSettingSchema);

