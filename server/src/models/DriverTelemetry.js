const mongoose = require('mongoose');

const driverTelemetrySchema = new mongoose.Schema({
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
  device: {
    type: String,
    default: 'Android 14 • Jio 4G'
  },
  lastHeartbeatTime: {
    type: String,
    default: '14:28:10 IST'
  },
  lastHeartbeatAgo: {
    type: String,
    default: '4m ago'
  },
  inactiveMins: {
    type: Number,
    default: 4
  },
  inactiveDisplay: {
    type: String,
    default: '04 mins'
  },
  lastLocationName: {
    type: String,
    default: 'Bodakdev Hub'
  },
  coords: {
    type: String,
    default: '23.0384° N, 72.5119° E'
  },
  battery: {
    type: Number,
    default: 72
  },
  batteryIcon: {
    type: String,
    default: 'battery_5_bar'
  },
  disconnectReasonCode: {
    type: String,
    enum: ['MANUAL', 'TIMEOUT', 'BATTERY', 'GEOFENCE', 'UNREGISTERED'],
    default: 'TIMEOUT'
  },
  disconnectReason: {
    type: String,
    default: 'Socket Timeout (Packet Drop)'
  },
  detailNote: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true
  },
  isSevered: {
    type: Boolean,
    default: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'PENDING'],
    default: 'MEDIUM'
  },
  osStack: {
    type: String,
    default: 'Android 13 • Stitch v4.19'
  },
  hardware: {
    type: String,
    default: 'Xiaomi Redmi Note 12 (Airtel)'
  },
  tempCore: {
    type: String,
    default: '34.8°C Normal'
  },
  precision: {
    type: String,
    default: '±14.2m before dropout'
  },
  rootCause: {
    type: String,
    default: 'Cell Tower Handover Fail at Vastrapur Ring Road Node B-11'
  },
  retryDaemon: [
    {
      num: { type: Number },
      time: { type: String },
      status: { type: String }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DriverTelemetry', driverTelemetrySchema);
