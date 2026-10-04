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
  customerEmail: {
    type: String,
    default: '',
    index: true
  },
  customerId: {
    type: String,
    default: '',
    index: true
  },
  customerAddress: {
    type: String,
    default: 'A-402, Titanium City Center, Anand Nagar, Ahmedabad'
  },
  deliveryCoordinates: {
    lat: { type: Number, default: 23.0300 },
    lng: { type: Number, default: 72.5178 }
  },
  deliverySlot: {
    type: String,
    default: 'Lunch Slot (12:00 - 13:30)'
  },
  items: [
    {
      itemId: String,
      name: String,
      category: String,
      price: Number,
      unitPrice: Number,
      quantity: Number,
      totalPrice: Number
    }
  ],
  selectedItems: [
    {
      itemId: String,
      itemName: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  extras: [
    {
      name: String,
      price: Number
    }
  ],
  mealSubtotal: {
    type: Number,
    default: 0
  },
  finalTotal: {
    type: Number,
    default: 0
  },
  rotliCount: {
    type: Number,
    default: 4
  },
  selectedShaak: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  tiffinName: {
    type: String,
    required: true
  },
  tiffinCategory: {
    type: String,
    default: ''
  },
  tiffinImage: {
    type: String,
    default: ''
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
    default: 0
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
    enum: ['Paid', 'Cash on Delivery', 'Pending', 'Failed', 'PAYMENT_FAILED'],
    default: 'Paid'
  },
  paymentId: {
    type: String,
    default: ''
  },
  gatewayOrderId: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    default: ''
  },
  paidAt: Date,

  status: {
    type: String,
    enum: [
      'New', 'PENDING', 'Pending', 'CONFIRMED', 'Confirmed', 
      'ACCEPTED', 'Accepted', 'PREPARING', 'Preparing', 
      'READY_FOR_PICKUP', 'Ready', 'DELIVERY_REQUESTED', 
      'DRIVER_ASSIGNED', 'PICKED_UP', 'Picked Up', 
      'OUT_FOR_DELIVERY', 'Out for Delivery', 'ARRIVED', 
      'DELIVERED', 'Completed', 
      'REJECTED', 'CANCELLED', 'Cancelled', 
      'PAYMENT_FAILED', 'DELIVERY_FAILED'
    ],
    default: 'New'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  
  driverId: {
    type: String,
    default: '',
    index: true
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
      'Delivered', 'DELIVERED', 'Completed',
      'CANCELLED', 'EXPIRED', 'FAILED'
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
  pickupOtp: {
    type: String,
    default: ''
  },
  deliveryOtp: {
    type: String,
    default: ''
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewRating: {
    type: Number,
    default: 0
  },

  acceptedAt: Date,
  preparingAt: Date,
  readyAt: Date,
  deliveryRequestedAt: Date,
  assignedAt: Date,
  pickedUpAt: Date,
  outForDeliveryAt: Date,
  arrivedAt: Date,
  deliveredAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
}, { strict: false });

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ driverId: 1, createdAt: -1 });
orderSchema.index({ providerId: 1, createdAt: -1 });
orderSchema.index({ providerId: 1, status: 1, createdAt: -1 });
orderSchema.index({ providerId: 1, deliveryStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
