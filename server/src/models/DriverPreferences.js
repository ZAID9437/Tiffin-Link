const mongoose = require('mongoose');

const driverPreferencesSchema = new mongoose.Schema({
  driverId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    default: ''
  },
  deliveryTypes: {
    standard: { type: Boolean, default: true },
    express: { type: Boolean, default: true },
    scheduled: { type: Boolean, default: false },
    subscription: { type: Boolean, default: true }
  },
  maxDistanceKm: {
    type: Number,
    default: 12.0
  },
  strictBoundary: {
    type: Boolean,
    default: true
  },
  preferredAreas: {
    type: [String],
    default: ['Bandra West • Sector 4', 'Khar West • Commercial', 'Santacruz West', 'Pali Hill Kitchen Hub']
  },
  minPayout: {
    type: Number,
    default: 50
  },
  maxPayout: {
    type: Number,
    default: 500
  },
  vehicleType: {
    type: String,
    default: 'Two-Wheeler'
  },
  capabilities: {
    hotFood: { type: Boolean, default: true },
    multipleOrders: { type: Boolean, default: true },
    heavyCrates: { type: Boolean, default: false }
  },
  autoAssignment: {
    type: Boolean,
    default: true
  },
  allowMultipleOrders: {
    type: Boolean,
    default: false
  },
  maxActiveDeliveries: {
    type: Number,
    default: 1
  },
  notificationPreferences: {
    deliveryNotifications: {
      newDeliveryRequest: { type: Boolean, default: true },
      deliveryAssigned: { type: Boolean, default: true },
      deliveryAccepted: { type: Boolean, default: true },
      pickupReminder: { type: Boolean, default: true },
      customerArrival: { type: Boolean, default: true },
      deliveryCompleted: { type: Boolean, default: true },
      deliveryCancelled: { type: Boolean, default: true }
    },
    earningsNotifications: {
      paymentReceived: { type: Boolean, default: true },
      earningsCredited: { type: Boolean, default: true },
      payoutStatus: { type: Boolean, default: true },
      failedPayment: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true }
    },
    securityNotifications: {
      loginAlert: { type: Boolean, default: true },
      passwordChanged: { type: Boolean, default: true },
      emailVerification: { type: Boolean, default: true },
      phoneVerification: { type: Boolean, default: true },
      suspiciousLogin: { type: Boolean, default: true }
    },
    channels: {
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true }
    },
    soundAlerts: {
      standardChime: { type: Boolean, default: true },
      highDecibelAlarm: { type: Boolean, default: true },
      hapticVibration: { type: Boolean, default: true },
      urgentSafetyAlerts: { type: Boolean, default: true }
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      from: { type: String, default: '23:00' },
      to: { type: String, default: '07:00' }
    }
  },
  privacySettings: {
    profileVisibility: { type: String, default: 'verified' },
    contactInfoMasking: { type: Boolean, default: true },
    liveStatusBroadcast: { type: Boolean, default: true },
    highPrecisionGpsSharing: { type: Boolean, default: true },
    transitCorridorTelemetry: { type: Boolean, default: true }
  },
  securityAlertSettings: {
    geofenceAnomalyAlert: { type: Boolean, default: true },
    payoutBankChangeAlert: { type: Boolean, default: true }
  },
  twoFactorEnabled: {
    type: Boolean,
    default: true
  },
  twoFactorMethod: {
    type: String,
    default: 'TOTP Authenticator & FIDO2'
  },
  backupCodesCount: {
    type: Number,
    default: 8
  },
  securityAuditLog: [
    {
      eventId: { type: String },
      eventType: { type: String },
      device: { type: String },
      ip: { type: String },
      location: { type: String },
      timestamp: { type: Date, default: Date.now },
      status: { type: String, default: 'SUCCESS' }
    }
  ],
  activeSessions: [
    {
      id: { type: String },
      device: { type: String },
      location: { type: String },
      ip: { type: String },
      lastActive: { type: String },
      isCurrent: { type: Boolean, default: false }
    }
  ],
  appPreferences: {
    appearance: {
      theme: { type: String, default: 'light' },
      compactMode: { type: Boolean, default: true },
      reduceMotion: { type: Boolean, default: false }
    },
    mapRouting: {
      mapCartography: { type: String, default: 'vector' },
      distanceMetric: { type: String, default: 'km' },
      gpsEngine: { type: String, default: 'google' },
      autoOpenNavigation: { type: Boolean, default: true },
      dynamicRouteRecalculation: { type: Boolean, default: true }
    },
    deliveryProtocol: {
      autoRefreshQueue: { type: Boolean, default: true },
      highDecibelChime: { type: Boolean, default: true },
      confirmAcceptDialog: { type: Boolean, default: false },
      confirmDeclineDialog: { type: Boolean, default: true },
      keepDisplayActive: { type: Boolean, default: true }
    },
    localization: {
      primaryLanguage: { type: String, default: 'en-IN' },
      operatingRegion: { type: String, default: 'IN' },
      systemTimezone: { type: String, default: 'Asia/Kolkata' },
      monetaryFormat: { type: String, default: 'lakhs' }
    },
    bandwidth: {
      dataSaverMode: { type: Boolean, default: true },
      preloadKitchenPhotos: { type: Boolean, default: true },
      backgroundWebWorkerSync: { type: Boolean, default: true },
      offlineTileCacheRetention: { type: String, default: '50mb' }
    },
    temporalFormatting: {
      timeStandard: { type: String, default: '24h' },
      datePattern: { type: String, default: 'ddmmyyyy' }
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DriverPreferences', driverPreferencesSchema);
