const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  stopType: {
    type: String,
    enum: ['driver_start', 'pickup', 'dropoff'],
    required: true
  },
  sequence: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  orderId: {
    type: String,
    default: ''
  },
  targetEntityName: {
    type: String,
    default: ''
  },
  targetEntityPhone: {
    type: String,
    default: ''
  },
  estimatedArrivalTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'arrived', 'completed', 'skipped'],
    default: 'pending'
  }
}, { _id: false });

const routePlanSchema = new mongoose.Schema({
  deliveryId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  driverId: {
    type: String,
    required: true,
    index: true
  },
  providerName: {
    type: String,
    default: ''
  },
  customerName: {
    type: String,
    default: ''
  },
  stops: [stopSchema],
  totalDistanceKm: {
    type: Number,
    required: true,
    default: 0
  },
  totalDurationMinutes: {
    type: Number,
    required: true,
    default: 0
  },
  routeGeometry: {
    type: [[Number]], // Array of [lng, lat] coordinates forming route polyline
    default: []
  },
  routingSource: {
    type: String,
    default: 'osrm_live' // 'osrm_live', 'google_maps', or 'geodesic_fallback'
  },
  isMultiStop: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'recalculated', 'cancelled'],
    default: 'active',
    index: true
  },
  recalculationCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

routePlanSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('RoutePlan', routePlanSchema);
