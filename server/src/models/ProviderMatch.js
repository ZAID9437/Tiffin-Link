const mongoose = require('mongoose');

const providerMatchSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealRequest',
    required: true,
    index: true
  },
  providerId: {
    type: String,
    required: true,
    index: true
  },
  providerName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  distanceKm: {
    type: Number,
    default: 0
  },
  estimatedTravelMins: {
    type: Number,
    default: 15
  },
  breakdown: {
    proximityScore: { type: Number, default: 0 },
    cuisineScore: { type: Number, default: 0 },
    ratingScore: { type: Number, default: 0 },
    prepTimeScore: { type: Number, default: 0 },
    budgetScore: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 0 }
  },
  reasonCodes: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['matched', 'notified', 'offer_submitted', 'declined', 'expired'],
    default: 'matched',
    index: true
  },
  notifiedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

providerMatchSchema.index({ requestId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('ProviderMatch', providerMatchSchema);
