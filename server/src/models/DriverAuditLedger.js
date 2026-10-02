const mongoose = require('mongoose');

const driverAuditLedgerSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    blockSequence: {
      type: Number,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    timeDisplay: {
      type: String,
      default: ''
    },
    partnerId: {
      type: String,
      required: true,
      index: true
    },
    partnerName: {
      type: String,
      required: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: ['AUTH', 'KYC', 'DELIVERY', 'FINANCIAL', 'GOV'],
      default: 'DELIVERY',
      index: true
    },
    previousState: {
      type: String,
      default: ''
    },
    mutatedState: {
      type: String,
      default: ''
    },
    actor: {
      type: String,
      default: 'System Daemon'
    },
    actorType: {
      type: String,
      enum: ['PARTNER', 'SYSTEM', 'ROOT'],
      default: 'SYSTEM',
      index: true
    },
    device: {
      type: String,
      default: ''
    },
    merkleDigest: {
      type: String,
      required: true
    },
    verificationBadge: {
      type: String,
      default: 'SHA-256 Verified ✓'
    },
    payloadDetails: {
      orderId: { type: String, default: '' },
      canisterTemp: { type: String, default: '67.8°C' },
      otpResult: { type: String, default: '4826 MATCHED' },
      clientCoords: { type: [Number], default: [23.0338, 72.585] },
      courierCoords: { type: [Number], default: [23.033812, 72.585045] },
      geoFenceDeltaMeters: { type: Number, default: 1.4 },
      courierVelocity: { type: String, default: '0 km/h' },
      originIp: { type: String, default: '152.58.42.112' },
      gatewayNode: { type: String, default: 'BOM-IND-01' },
      tlsCipherSuite: { type: String, default: 'TLS_AES_256_GCM_SHA384' },
      recipient: { type: String, default: 'Aarav Sharma' },
      canisterId: { type: String, default: 'TK-9021' },
      merkleNodePath: {
        leaf: { type: String, default: '0x9a8f...82e1' },
        branch: { type: String, default: '0x3d02...11b4' },
        root: { type: String, default: '0x8f2d...3a19' }
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DriverAuditLedger', driverAuditLedgerSchema);
