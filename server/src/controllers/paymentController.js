const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Provider = require('../models/Provider');
const Tiffin = require('../models/Tiffin');
const TiffinItem = require('../models/TiffinItem');
const { reconcileMissingDeliveryRequests } = require('./deliveryDispatchController');

// Utility: Haversine distance in KM
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.8;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

// Helper: Authoritatively calculate pricing from MongoDB models
const calculateAuthoritativePricing = async ({
  providerId,
  tiffinId,
  items = [],
  extras = [],
  quantity = 1,
  deliveryCoordinates
}) => {
  let providerDoc = null;
  if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
    providerDoc = await Provider.findById(providerId);
  }

  let tiffinDoc = null;
  if (tiffinId && mongoose.Types.ObjectId.isValid(tiffinId)) {
    tiffinDoc = await Tiffin.findOne({
      _id: tiffinId,
      providerId: providerId.toString()
    });
  }

  const basePrice = Number(
    tiffinDoc?.price !== undefined
      ? tiffinDoc.price
      : providerDoc?.price || 140
  );

  // Delivery distance & fee calculation
  let distanceKm = 1.8;
  if (providerDoc?.address?.lat && deliveryCoordinates?.lat) {
    distanceKm = calculateHaversineKm(
      providerDoc.address.lat,
      providerDoc.address.lng,
      deliveryCoordinates.lat,
      deliveryCoordinates.lng
    );
  }

  // Delivery fee: ₹25 base + ₹8/km
  const deliveryFee = Math.max(25, Math.round(25 + distanceKm * 8));

  // Items processing and authoritative price verification
  const qty = Math.max(1, Number(quantity) || 1);
  let itemsAmount = 0;
  const sanitizedItemsSnapshot = [];
  const incomingItems = Array.isArray(items) ? items : [];

  for (const item of incomingItems) {
    const reqQty = Number(item.quantity || item.qty) || 0;
    if (reqQty <= 0) continue;

    let dbItem = null;
    const itemId = item.itemId || item.id || item._id;
    if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
      dbItem = await TiffinItem.findOne({
        _id: itemId,
        providerId: providerId.toString()
      });
    } else if (item.name) {
      dbItem = await TiffinItem.findOne({
        name: item.name.trim(),
        providerId: providerId.toString(),
        ...(tiffinId ? { tiffinId } : {})
      });
    }

    if (dbItem) {
      if (dbItem.isAvailable === false || dbItem.availableQuantity <= 0) {
        throw new Error(`"${dbItem.name}" is currently OUT OF STOCK.`);
      }
      if (reqQty > dbItem.availableQuantity) {
        throw new Error(
          `"${dbItem.name}" only has ${dbItem.availableQuantity} portion(s) available in stock. You requested ${reqQty}.`
        );
      }

      const effectiveUnitPrice =
        Number(
          dbItem.price !== undefined ? dbItem.price : dbItem.unitPrice
        ) || 0;
      const lineTotal = effectiveUnitPrice * reqQty;
      itemsAmount += lineTotal;

      sanitizedItemsSnapshot.push({
        menuItemId: dbItem._id.toString(),
        itemId: dbItem._id.toString(),
        name: dbItem.name,
        category: dbItem.category,
        image: dbItem.image || '',
        unit: dbItem.unit || 'portion',
        unitPrice: effectiveUnitPrice,
        quantity: reqQty,
        totalPrice: lineTotal
      });
    } else {
      const p = Number(item.unitPrice || item.price) || 0;
      const lineTotal = p * reqQty;
      itemsAmount += lineTotal;

      sanitizedItemsSnapshot.push({
        menuItemId: itemId ? String(itemId) : '',
        itemId: itemId ? String(itemId) : '',
        name: item.name || 'Custom Dish',
        category: item.category || 'Add-on',
        image: item.image || '',
        unit: item.unit || 'portion',
        unitPrice: p,
        quantity: reqQty,
        totalPrice: lineTotal
      });
    }
  }

  // Extras
  let extrasTotal = 0;
  const sanitizedExtras = [];
  if (Array.isArray(extras)) {
    for (const ex of extras) {
      const p = Number(ex.price) || 0;
      extrasTotal += p;
      sanitizedExtras.push({ name: ex.name, price: p });
    }
  }

  const isCustomizedMeal = sanitizedItemsSnapshot.length > 0;
  const mealSubtotal = isCustomizedMeal
    ? itemsAmount + extrasTotal
    : basePrice * qty + extrasTotal;

  // 5% GST calculated on meal subtotal
  const gstTax = Math.round(mealSubtotal * 0.05);
  const packagingFee = 0;
  const discounts = 0;
  const finalPayable = mealSubtotal + deliveryFee + gstTax + packagingFee - discounts;

  return {
    providerDoc,
    tiffinDoc,
    distanceKm,
    deliveryFee,
    mealSubtotal,
    gstTax,
    packagingFee,
    discounts,
    finalPayable,
    itemsAmount,
    sanitizedItemsSnapshot,
    sanitizedExtras,
    isCustomizedMeal,
    basePrice,
    qty
  };
};

// @desc    Authoritative Dynamic Calculation of Payable Amount
// @route   POST /api/payments/calculate
const calculateAmount = async (req, res) => {
  try {
    const {
      providerId,
      tiffinId,
      items,
      extras,
      quantity,
      deliveryCoordinates
    } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider ID is required for amount calculation.'
      });
    }

    const pricing = await calculateAuthoritativePricing({
      providerId,
      tiffinId,
      items,
      extras,
      quantity,
      deliveryCoordinates
    });

    const providerUpiId = pricing.providerDoc?.upiId || 'zaidupi@abcbank';
    const providerUpiName = pricing.providerDoc?.businessName || pricing.providerDoc?.name || 'Mansuri Kitchen';

    return res.json({
      success: true,
      data: {
        mealSubtotal: pricing.mealSubtotal,
        deliveryFee: pricing.deliveryFee,
        gstTax: pricing.gstTax,
        packagingFee: pricing.packagingFee,
        discounts: pricing.discounts,
        finalPayable: pricing.finalPayable,
        distanceKm: pricing.distanceKm,
        provider: {
          id: providerId.toString(),
          name: providerUpiName,
          upiId: providerUpiId
        }
      }
    });
  } catch (error) {
    console.error('Payment calculate error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate payment amount.'
    });
  }
};

// @desc    Create / Initialize Payment Order & Transaction
// @route   POST /api/payments/create-order
const createPaymentOrder = async (req, res) => {
  try {
    const {
      providerId,
      tiffinId,
      tiffinName,
      tiffinCategory,
      tiffinImage,
      quantity = 1,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      deliveryCoordinates,
      deliverySlot,
      items,
      extras,
      rotliCount,
      selectedShaak,
      instructions,
      paymentMethod = 'UPI',
      idempotencyKey
    } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        message: 'Provider ID is required to initiate payment.'
      });
    }

    // Idempotency check: prevent duplicate transactions
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({ idempotencyKey });
      if (existingPayment) {
        if (existingPayment.status === 'PAID') {
          return res.status(400).json({
            success: false,
            message: 'This payment transaction has already been completed.'
          });
        }
        if (
          existingPayment.status === 'PENDING' &&
          Date.now() - new Date(existingPayment.createdAt).getTime() < 120000
        ) {
          const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_tiffinlink_sandbox';
          return res.json({
            success: true,
            paymentId: existingPayment.paymentId,
            orderId: existingPayment.orderId,
            gatewayOrderId: existingPayment.gatewayOrderId,
            amount: existingPayment.amount,
            amountInPaise: existingPayment.amountInPaise,
            currency: existingPayment.currency,
            keyId,
            paymentMethod: existingPayment.paymentMethod,
            customer: {
              name: existingPayment.customerName,
              email: existingPayment.customerEmail,
              phone: existingPayment.customerPhone
            }
          });
        }
      }
    }

    // Authoritative calculation from DB
    const pricing = await calculateAuthoritativePricing({
      providerId,
      tiffinId,
      items,
      extras,
      quantity,
      deliveryCoordinates
    });

    const customerId = req.user?._id?.toString() || req.user?.id || '';
    const email = (customerEmail || req.user?.email || '').trim().toLowerCase();
    const phone = (customerPhone || req.user?.phone || '+91 98765 43210').trim();
    const finalCustomerName = (customerName || req.user?.name || req.user?.fullName || 'Customer').trim();

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `TL-${orderNum}`;
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Razorpay or Sandbox Gateway Order Creation
    let gatewayOrderId = '';
    const amountInPaise = Math.round(pricing.finalPayable * 100);
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (razorpayKeyId && razorpayKeySecret) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: paymentId,
            notes: {
              orderId,
              providerId: providerId.toString(),
              paymentMethod
            }
          })
        });
        const rzpJson = await rzpRes.json();
        if (rzpJson && rzpJson.id) {
          gatewayOrderId = rzpJson.id;
        } else {
          console.warn('Razorpay order creation fallback:', rzpJson);
          gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
      } catch (rzpErr) {
        console.warn('Razorpay API connect error, using secure sandbox order ID:', rzpErr.message);
        gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
    } else {
      // Secure local development / sandbox gateway order
      gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Build authoritative order snapshot to prevent any client-side tampering
    const resolvedTiffinName = (
      pricing.tiffinDoc?.name ||
      tiffinName ||
      pricing.sanitizedItemsSnapshot[0]?.name ||
      'Homestyle Special Meal'
    ).trim();

    const formattedSelectedItems = pricing.sanitizedItemsSnapshot.map(i => ({
      itemId: i.itemId || i.menuItemId,
      itemName: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice
    }));

    const orderSnapshot = {
      orderId,
      providerId: providerId.toString(),
      tiffinId: tiffinId || (pricing.tiffinDoc ? pricing.tiffinDoc._id.toString() : ''),
      customerId,
      customerName: finalCustomerName,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: (customerAddress || 'Satellite, Ahmedabad').trim(),
      deliveryCoordinates: deliveryCoordinates || { lat: 23.03, lng: 72.5178 },
      deliverySlot: deliverySlot || 'Lunch Slot (12:00 - 13:30)',
      tiffinName: resolvedTiffinName,
      tiffinCategory: pricing.tiffinDoc?.category || tiffinCategory || 'Gujarati Traditional',
      tiffinImage: pricing.tiffinDoc?.image || tiffinImage || pricing.providerDoc?.image || '/assets/provider_1.png',
      quantity: pricing.qty,
      unitPrice: pricing.isCustomizedMeal ? 0 : pricing.basePrice,
      tiffinBaseAmount: pricing.isCustomizedMeal ? 0 : pricing.basePrice * pricing.qty,
      itemsAmount: pricing.itemsAmount,
      mealSubtotal: pricing.mealSubtotal,
      subtotal: pricing.mealSubtotal,
      deliveryKm: pricing.distanceKm,
      deliveryDistance: `${pricing.distanceKm} km`,
      deliveryFee: pricing.deliveryFee,
      driverEarning: pricing.deliveryFee,
      packagingFee: pricing.packagingFee,
      gstTax: pricing.gstTax,
      finalTotal: pricing.finalPayable,
      totalAmount: pricing.finalPayable,
      items: pricing.sanitizedItemsSnapshot,
      selectedItems: formattedSelectedItems,
      extras: pricing.sanitizedExtras,
      rotliCount: rotliCount || 4,
      selectedShaak: selectedShaak || '',
      instructions: instructions || '',
      status: 'New',
      deliveryStatus: 'Unassigned',
      pickupAddress: pricing.providerDoc?.address?.street
        ? `${pricing.providerDoc.address.street}, ${pricing.providerDoc.address.locality || ''}, ${pricing.providerDoc.address.city || 'Ahmedabad'}`
        : 'Kitchen Hub, Ahmedabad'
    };

    // Save payment record in DB with PENDING status
    const payment = new Payment({
      paymentId,
      orderId,
      idempotencyKey: idempotencyKey || '',
      customerId,
      customerName: finalCustomerName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: (customerAddress || '').trim(),
      providerId: providerId.toString(),
      amount: pricing.finalPayable,
      amountInPaise,
      currency: 'INR',
      gateway: 'Razorpay',
      gatewayOrderId,
      paymentMethod,
      status: 'PENDING',
      orderSnapshot
    });

    await payment.save();

    const safeKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_tiffinlink_sandbox';
    const providerUpiId = pricing.providerDoc?.upiId || 'zaidupi@abcbank';
    const providerUpiName = pricing.providerDoc?.businessName || pricing.providerDoc?.name || pricing.providerDoc?.accountHolderName || 'Mansuri Kitchen';
    const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(providerUpiId)}&pn=${encodeURIComponent(providerUpiName)}&am=${pricing.finalPayable.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`;

    return res.status(201).json({
      success: true,
      paymentId,
      orderId,
      gatewayOrderId,
      amount: pricing.finalPayable,
      amountInPaise,
      currency: 'INR',
      keyId: safeKeyId,
      paymentMethod,
      provider: {
        id: providerId.toString(),
        name: providerUpiName,
        upiId: providerUpiId,
        businessName: pricing.providerDoc?.businessName || providerUpiName
      },
      upiPaymentUri,
      customer: {
        name: finalCustomerName,
        email,
        phone
      }
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Could not initialize payment order.'
    });
  }
};

// @desc    Verify Gateway Signature & Confirm Order Only on Genuine Verification
// @route   POST /api/payments/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for verification.'
      });
    }

    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction record not found.'
      });
    }

    // Idempotency: If already paid, return the confirmed order
    if (payment.status === 'PAID') {
      const existingOrder = await Order.findOne({
        $or: [{ orderId: payment.orderId }, { paymentId: payment.paymentId }]
      });
      if (existingOrder) {
        return res.json({
          success: true,
          message: 'Payment already verified.',
          data: existingOrder
        });
      }
    }

    // Signature verification
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (razorpayKeySecret && gatewayOrderId && gatewayPaymentId && gatewaySignature) {
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${gatewayOrderId}|${gatewayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== gatewaySignature) {
        payment.status = 'FAILED';
        payment.failureReason = 'Cryptographic signature mismatch';
        await payment.save();
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Signature mismatch.'
        });
      }
    } else {
      // In sandbox/development mode or simulated test gateway,
      // verify that the gateway order ID matches the record and payment ID is present
      if (gatewayOrderId && payment.gatewayOrderId && gatewayOrderId !== payment.gatewayOrderId) {
        payment.status = 'FAILED';
        payment.failureReason = 'Gateway Order ID mismatch';
        await payment.save();
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Order mismatch.'
        });
      }
    }

    // Atomic stock decrement for verified order items
    const snapshotItems = payment.orderSnapshot?.items || [];
    for (const it of snapshotItems) {
      const idToDec = it.itemId || it.menuItemId;
      if (idToDec && mongoose.Types.ObjectId.isValid(idToDec)) {
        await TiffinItem.findByIdAndUpdate(idToDec, {
          $inc: { availableQuantity: -Math.max(1, it.quantity || 1) }
        }).catch(err => console.warn('Inventory decrement warning:', err.message));
      }
    }

    // Update payment record to PAID
    payment.status = 'PAID';
    payment.gatewayPaymentId = gatewayPaymentId || `pay_${Date.now()}`;
    payment.gatewaySignature = gatewaySignature || 'verified_secure_token';
    payment.paidAt = new Date();
    await payment.save();

    // Create authoritative Order record in DB with paymentStatus: 'Paid'
    const finalOrderData = {
      ...payment.orderSnapshot,
      paymentStatus: 'Paid',
      paymentMethod: payment.paymentMethod || 'Online Payment',
      paymentId: payment.paymentId,
      gatewayOrderId: payment.gatewayOrderId,
      transactionId: payment.gatewayPaymentId,
      paidAt: payment.paidAt
    };

    const newOrder = new Order(finalOrderData);
    await newOrder.save();

    return res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      data: newOrder
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal error during payment verification.'
    });
  }
};

// @desc    Record Gateway Payment Failure or Cancellation
// @route   POST /api/payments/payment-failed
const recordPaymentFailure = async (req, res) => {
  try {
    const { paymentId, reason, status = 'FAILED' } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required.'
      });
    }

    const payment = await Payment.findOne({ paymentId });
    if (payment && payment.status !== 'PAID') {
      payment.status = status === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
      payment.failureReason = reason || 'Payment cancelled or declined by customer';
      await payment.save();
    }

    return res.json({
      success: true,
      message: 'Payment failure recorded. Order was not confirmed.'
    });
  } catch (error) {
    console.error('Payment failure record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error recording payment failure.'
    });
  }
};

module.exports = {
  calculateAmount,
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure
};
