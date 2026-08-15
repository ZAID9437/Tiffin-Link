const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  mobile: { type: String, default: '' },
  dob: { type: String, default: '' },
  gender: { type: String, default: '' },
  businessName: { type: String, default: '' },
  businessType: { type: String, default: 'Home Kitchen' },
  experience: { type: String, default: '' },
  staffCount: { type: String, default: '' },
  address: {
    houseNo: { type: String, default: '' },
    street: { type: String, default: '' },
    locality: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    isLocationPinned: { type: Boolean, default: false }
  },
  cuisines: { type: String, default: '' },
  maxMeals: { type: String, default: '' },
  opens: { type: String, default: '' },
  closes: { type: String, default: '' },
  sameDayDelivery: { type: Boolean, default: false },
  fssaiNumber: { type: String, default: '' },
  idType: { type: String, default: 'Aadhar Card' },
  fssaiCert: { type: String, default: '' },
  fssaiCertName: { type: String, default: '' },
  kitchenPhotos: { type: String, default: '' },
  kitchenPhotosName: { type: String, default: '' },
  ownerId: { type: String, default: '' },
  ownerIdName: { type: String, default: '' },
  accountHolderName: { type: String, default: '' },
  bankName: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  upiId: { type: String, default: '' },
  deliveryPreference: { type: String, default: 'TiffinLink Partner' },
  languagesSpoken: { type: String, default: '' },
  hearSource: { type: String, default: 'Instagram' },
  mealTitle: { type: String, default: '' },
  mealIngredients: { type: String, default: '' },
  mealPrice: { type: Number, default: 0 },
  mealPrepTime: { type: String, default: '' },
  skipMenu: { type: Boolean, default: false },
  rating: {
    type: Number,
    default: 4.8
  },
  eta: {
    type: String,
    default: '30-40 min'
  },
  price: {
    type: Number,
    default: 120
  },
  tags: {
    type: [String],
    default: ['Pure Veg']
  },
  image: {
    type: String,
    default: '/assets/provider_1.png'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'draft'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Provider', providerSchema);
