const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const mealRequestSchema = new mongoose.Schema({
  customerName: {
    type: String,
    default: 'Customer'
  },
  customerPhone: {
    type: String,
    default: '+91 98765 43210'
  },
  customerAddress: {
    type: String,
    default: 'Satellite, Ahmedabad'
  },
  mealType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Gujarati'
  },
  items: {
    type: [mealItemSchema],
    default: []
  },
  quantity: {
    type: Number,
    default: 1
  },
  date: {
    type: String,
    default: 'Today'
  },
  time: {
    type: String,
    default: '5:00 PM'
  },
  deliveryType: {
    type: String,
    default: 'Delivery'
  },
  location: {
    type: String,
    default: 'Satellite, Ahmedabad'
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [72.5178, 23.0300]
    }
  },
  distance: {
    type: String,
    default: '1.8 km'
  },
  budget: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number
  },
  specialInstructions: {
    type: String,
    default: ''
  },
  customerId: {
    type: String,
    default: null
  },
  customerEmail: {
    type: String,
    default: ''
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  urgencyLevel: {
    type: String,
    enum: ['standard', 'urgent', 'emergency'],
    default: 'standard'
  },
  matchingStatus: {
    type: String,
    enum: ['pending', 'evaluating', 'matched', 'no_match', 'completed', 'expired'],
    default: 'pending'
  },
  matches: [{
    providerId: { type: String, required: true },
    providerName: { type: String, required: true },
    score: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    reasonCodes: [{ type: String }],
    notifiedAt: { type: Date, default: Date.now }
  }],
  corporateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    default: null
  },
  groupOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOrder',
    default: null
  },
  offers: [{
    providerId: { type: String, required: true },
    providerName: { type: String, required: true },
    providerRating: { type: Number, default: 4.8 },
    providerReviewsCount: { type: Number, default: 24 },
    providerImage: { type: String, default: '' },
    kitchenAddress: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    deliveryCharge: { type: Number, default: 0 },
    readyTimeMinutes: { type: Number, default: 25 },
    estimatedDeliveryTime: { type: String, default: '30-40 mins' },
    itemsIncluded: [{
      name: { type: String },
      qty: { type: Number, default: 1 },
      price: { type: Number, default: 0 }
    }],
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'selected', 'rejected', 'withdrawn', 'expired'],
      default: 'pending'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  selectedOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  providerId: {
    type: String,
    default: null
  },
  declinedByProviders: {
    type: [String],
    default: []
  },
  acceptedByProviderId: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 1000) // 2 minutes validity by default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-fill totalAmount and items if not provided
mealRequestSchema.pre('save', function(next) {
  if (!this.totalAmount) {
    this.totalAmount = (this.quantity || 1) * (this.budget || 100);
  }
  if (!this.items || this.items.length === 0) {
    this.items = [{
      name: this.mealType,
      qty: this.quantity || 1,
      price: this.budget || 100
    }];
  }
  next();
});

// 2dsphere index for geospatial proximity matching
mealRequestSchema.index({ coordinates: '2dsphere' });
mealRequestSchema.index({ status: 1, urgencyLevel: 1, expiresAt: 1 });

module.exports = mongoose.model('MealRequest', mealRequestSchema);

