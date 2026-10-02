const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  providerId: {
    type: String,
    required: true,
    index: true
  },
  tiffinId: {
    type: String,
    default: ''
  },
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

  // Item Subtotal & Pricing Breakdown Snapshot
  subtotal: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 45
  },
  driverEarning: {
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
  serviceCharge: {
    type: Number,
    default: 0
  },
  additionalCharges: {
    type: Number,
    default: 0
  },
  gstTax: {
    type: Number,
    default: 12
  },
  platformCommission: {
    type: Number,
    default: 0
  },
  netPayout: {
    type: Number,
    default: 0
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
  
  deliveryStatus: {
    type: String,
    enum: [
      'Unassigned', 'Searching', 'SEARCHING_DRIVERS',
      'Assigned', 'ASSIGNED', 'Accepted',
      'Arrived at Pickup', 'Arrived at Provider', 'ARRIVED_PROVIDER', 'At Kitchen',
      'Picked Up', 'PICKED_UP',
      'On The Way', 'Out for Delivery', 'OUT_FOR_DELIVERY',
      'Arrived at Customer', 'ARRIVED_CUSTOMER',
      'Delivered', 'DELIVERED', 'Completed'
    ],
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

orderSchema.index({ providerId: 1, createdAt: -1 });
orderSchema.index({ providerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ providerId: 1, deliveryStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
