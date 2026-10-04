const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      default: '',
      index: true
    },
    customerId: {
      type: String,
      default: '',
      index: true
    },
    customerName: {
      type: String,
      default: 'Guest Customer'
    },
    customerEmail: {
      type: String,
      default: ''
    },
    customerPhone: {
      type: String,
      default: ''
    },
    customerAddress: {
      type: String,
      default: ''
    },
    providerId: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    amountInPaise: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    gateway: {
      type: String,
      default: 'Razorpay'
    },
    gatewayOrderId: {
      type: String,
      default: '',
      index: true
    },
    gatewayPaymentId: {
      type: String,
      default: ''
    },
    gatewaySignature: {
      type: String,
      default: ''
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Credit / Debit Card', 'Net Banking', 'Wallets', 'Online Payment'],
      default: 'UPI'
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'CREATED',
      index: true
    },
    failureReason: {
      type: String,
      default: ''
    },
    paidAt: {
      type: Date
    },
    // Authoritative order snapshot computed and verified by backend
    orderSnapshot: {
      type: Object,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
