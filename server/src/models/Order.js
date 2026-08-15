const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    default: '+91 98765 43210'
  },
  customerAddress: {
    type: String,
    default: 'A-402, Titanium City Center, Anand Nagar, Ahmedabad'
  },
  tiffinName: {
    type: String,
    required: true
  },
  tiffinCategory: {
    type: String,
    default: 'Gujarati'
  },
  tiffinImage: {
    type: String,
    default: '/assets/provider_1.png'
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true
  },

  // Item Subtotal & Pricing Breakdown
  subtotal: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 45
  },
  deliveryKm: {
    type: Number,
    default: 3.2
  },
  deliveryFeePerKm: {
    type: Number,
    default: 10
  },
  packagingFee: {
    type: Number,
    default: 15
  },
  gstTax: {
    type: Number,
    default: 12
  },
  totalAmount: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['Paid', 'Cash on Delivery', 'Pending'],
    default: 'Paid'
  },
  status: {
    type: String,
    enum: ['New', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'New'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  
  // Delivery Partner Integrated Fields
  deliveryStatus: {
    type: String,
    enum: ['Unassigned', 'Searching', 'Assigned', 'Accepted', 'Arrived at Pickup', 'Picked Up', 'On The Way', 'Delivered'],
    default: 'Unassigned'
  },
  deliveryPartnerName: {
    type: String,
    default: ''
  },
  deliveryPartnerPhone: {
    type: String,
    default: ''
  },
  deliveryDistance: {
    type: String,
    default: '3.2 km'
  },
  estimatedTime: {
    type: String,
    default: '25 mins'
  },
  pickupAddress: {
    type: String,
    default: 'Shreeji Tiffin Kitchen, Satellite, Ahmedabad'
  },
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
