const mongoose = require('mongoose');
const MealRequest = require('../models/MealRequest');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const SmartQueue = require('../models/SmartQueue');
const Provider = require('../models/Provider');
const { getIO } = require('./socketService');

// Submit an offer for an active meal request
const submitAuctionOffer = async ({
  requestId,
  providerId,
  price,
  quantity,
  deliveryCharge,
  readyTimeMinutes,
  estimatedDeliveryTime,
  message,
  itemsIncluded
}) => {
  const request = await MealRequest.findById(requestId);
  if (!request) {
    throw new Error('Meal request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('This meal request is no longer open for auction bids');
  }

  if (new Date() > new Date(request.expiresAt)) {
    request.status = 'expired';
    await request.save();
    throw new Error('This meal request has expired');
  }

  // Get provider details
  const provider = await Provider.findById(providerId);
  const provName = provider?.businessName || provider?.name || 'Local Kitchen';
  const provRating = Number(provider?.rating) || 4.8;
  const provAddress = provider?.address?.locality || provider?.address?.street || 'Ahmedabad';

  const numPrice = Number(price);
  if (!numPrice || numPrice <= 0) {
    throw new Error('Valid offer price is required');
  }

  const numQty = Number(quantity) || request.quantity || 1;
  const numDeliveryCharge = deliveryCharge !== undefined ? Number(deliveryCharge) : 25;
  const numReadyMinutes = Number(readyTimeMinutes) || 20;

  // Check if provider already has an active offer for this request
  let existingOffer = await Offer.findOne({ requestId: request._id, providerId: String(providerId) });

  let offerDoc;
  if (existingOffer) {
    existingOffer.price = numPrice;
    existingOffer.quantity = numQty;
    existingOffer.deliveryCharge = numDeliveryCharge;
    existingOffer.readyTimeMinutes = numReadyMinutes;
    existingOffer.estimatedDeliveryTime = estimatedDeliveryTime || `${numReadyMinutes + 15} mins`;
    existingOffer.message = message || existingOffer.message;
    if (itemsIncluded && itemsIncluded.length > 0) {
      existingOffer.itemsIncluded = itemsIncluded;
    }
    existingOffer.status = 'pending';
    offerDoc = await existingOffer.save();
  } else {
    offerDoc = new Offer({
      requestId: request._id,
      providerId: String(providerId),
      providerName: provName,
      providerRating: provRating,
      kitchenAddress: provAddress,
      price: numPrice,
      quantity: numQty,
      deliveryCharge: numDeliveryCharge,
      readyTimeMinutes: numReadyMinutes,
      estimatedDeliveryTime: estimatedDeliveryTime || `${numReadyMinutes + 15} mins`,
      message: message || 'Freshly cooked homestyle meal prepared to order.',
      itemsIncluded: itemsIncluded || request.items || [],
      status: 'pending',
      expiresAt: request.expiresAt
    });
    await offerDoc.save();
  }

  // Also update embedded offers in MealRequest for backward-compatibility
  const cleanEmbeddedOffer = {
    _id: offerDoc._id,
    providerId: String(providerId),
    providerName: provName,
    providerRating: provRating,
    kitchenAddress: provAddress,
    price: numPrice,
    quantity: numQty,
    deliveryCharge: numDeliveryCharge,
    readyTimeMinutes: numReadyMinutes,
    estimatedDeliveryTime: offerDoc.estimatedDeliveryTime,
    itemsIncluded: offerDoc.itemsIncluded,
    message: offerDoc.message,
    status: 'pending',
    createdAt: new Date()
  };

  const existingEmbedIndex = request.offers.findIndex(o => String(o.providerId) === String(providerId));
  if (existingEmbedIndex >= 0) {
    request.offers[existingEmbedIndex] = cleanEmbeddedOffer;
  } else {
    request.offers.push(cleanEmbeddedOffer);
  }
  await request.save();

  // Notify customer room via Socket.IO
  try {
    const io = getIO();
    if (io) {
      if (request.customerId) {
        io.to(`customer:${request.customerId}`).emit('offer:received', {
          requestId: request._id,
          offer: offerDoc
        });
      }
      io.emit('auction:offer_submitted', {
        requestId: request._id,
        offerId: offerDoc._id,
        providerId,
        providerName: provName,
        price: numPrice
      });
    }
  } catch (sErr) {}

  return offerDoc;
};

// Concurrency-protected atomic offer selection
const selectAuctionOffer = async ({ requestId, offerId, customerUserId }) => {
  // 1. Atomically lock and update MealRequest only if it is still 'pending'
  const request = await MealRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    {
      $set: {
        status: 'accepted',
        selectedOfferId: offerId
      }
    },
    { new: true }
  );

  if (!request) {
    throw new Error('Meal request is no longer available or has already been accepted/expired.');
  }

  // 2. Fetch winning offer
  const winningOffer = await Offer.findById(offerId);
  if (!winningOffer) {
    // Revert status if offer document missing
    await MealRequest.findByIdAndUpdate(requestId, { status: 'pending', selectedOfferId: null });
    throw new Error('Selected offer could not be found');
  }

  winningOffer.status = 'selected';
  await winningOffer.save();

  request.acceptedByProviderId = winningOffer.providerId;
  await request.save();

  // 3. Mark competing offers as rejected
  await Offer.updateMany(
    { requestId: request._id, _id: { $ne: winningOffer._id }, status: 'pending' },
    { $set: { status: 'rejected' } }
  );

  // Update embedded array in request
  request.offers.forEach(o => {
    if (String(o._id) === String(offerId) || String(o.providerId) === String(winningOffer.providerId)) {
      o.status = 'selected';
    } else if (o.status === 'pending') {
      o.status = 'rejected';
    }
  });
  await request.save();

  // 4. Automatically generate confirmed Order in MongoDB
  const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderItems = winningOffer.itemsIncluded && winningOffer.itemsIncluded.length > 0
    ? winningOffer.itemsIncluded.map(it => ({
        itemId: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: it.name || request.mealType,
        quantity: it.qty || request.quantity || 1,
        unitPrice: it.price || winningOffer.price,
        totalPrice: (it.qty || 1) * (it.price || winningOffer.price)
      }))
    : [{
        itemId: `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: request.mealType,
        quantity: request.quantity || 1,
        unitPrice: winningOffer.price,
        totalPrice: (request.quantity || 1) * winningOffer.price
      }];

  const subtotal = winningOffer.price * (winningOffer.quantity || request.quantity || 1);
  const deliveryFee = winningOffer.deliveryCharge || 25;
  const packagingFee = 15;
  const gstTax = Math.round(subtotal * 0.05);
  const finalTotal = subtotal + deliveryFee + packagingFee + gstTax;

  const newOrder = new Order({
    orderId: orderNumber,
    providerId: String(winningOffer.providerId),
    customerName: request.customerName,
    customerPhone: request.customerPhone,
    customerEmail: request.customerEmail || '',
    customerId: request.customerId || customerUserId || '',
    customerAddress: request.customerAddress || request.location || 'Satellite, Ahmedabad',
    tiffinName: `${request.mealType} (Auction Won)`,
    tiffinCategory: request.category || 'Homestyle',
    quantity: request.quantity || 1,
    unitPrice: winningOffer.price,
    subtotal,
    deliveryFee,
    packagingFee,
    gstTax,
    totalAmount: finalTotal,
    finalTotal,
    mealSubtotal: subtotal,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    items: orderItems,
    instructions: request.specialInstructions || winningOffer.message || '',
    deliverySlot: `${winningOffer.estimatedDeliveryTime || '30-40 min'}`
  });

  await newOrder.save();

  // 5. Insert directly into SmartQueue for Provider Kitchen
  const prepTargetMinutes = winningOffer.readyTimeMinutes || 20;
  const targetReadyTime = new Date(Date.now() + prepTargetMinutes * 60 * 1000);

  const queueItem = new SmartQueue({
    queueType: 'provider_prep',
    orderId: orderNumber,
    providerId: String(winningOffer.providerId),
    providerName: winningOffer.providerName,
    customerName: request.customerName,
    customerAddress: request.customerAddress || request.location,
    mealTitle: request.mealType,
    quantity: request.quantity || 1,
    isUrgent: Boolean(request.isUrgent || request.urgencyLevel === 'emergency'),
    urgencyLevel: request.urgencyLevel || 'standard',
    priorityScore: request.urgencyLevel === 'emergency' ? 95 : 60,
    status: 'queued',
    targetReadyTime,
    targetDeliveryTime: new Date(Date.now() + (prepTargetMinutes + 25) * 60 * 1000)
  });
  await queueItem.save();

  // 6. Broadcast real-time Socket.IO events to all relevant parties
  try {
    const io = getIO();
    if (io) {
      // Winning Provider room
      io.to(`provider:${winningOffer.providerId}`).emit('auction:won', {
        requestId: request._id,
        orderId: orderNumber,
        order: newOrder,
        message: 'Congratulations! Your offer was selected by the customer.'
      });
      io.to(`provider:${winningOffer.providerId}`).emit('order:new', newOrder);

      // Customer room
      if (request.customerId) {
        io.to(`customer:${request.customerId}`).emit('offer:selected_confirmed', {
          requestId: request._id,
          orderId: orderNumber,
          providerId: winningOffer.providerId,
          order: newOrder
        });
      }

      // Competing providers
      const competingOffers = await Offer.find({ requestId: request._id, _id: { $ne: winningOffer._id } });
      for (const comp of competingOffers) {
        io.to(`provider:${comp.providerId}`).emit('auction:lost', {
          requestId: request._id,
          offerId: comp._id,
          message: 'The customer has accepted another kitchen offer for this request.'
        });
      }

      // General update
      io.emit('request:updated', {
        id: request._id,
        status: 'accepted',
        selectedOfferId: offerId,
        orderId: orderNumber
      });
    }
  } catch (sErr) {}

  return {
    success: true,
    message: 'Offer accepted and confirmed order created successfully!',
    order: newOrder,
    winningOffer
  };
};

// Provider withdraws their offer before selection
const withdrawAuctionOffer = async ({ requestId, offerId, providerId }) => {
  const offer = await Offer.findOne({ _id: offerId, providerId: String(providerId) });
  if (!offer) {
    throw new Error('Offer not found or unauthorized');
  }

  if (offer.status === 'selected') {
    throw new Error('Cannot withdraw an offer that has already been accepted by the customer');
  }

  offer.status = 'withdrawn';
  await offer.save();

  // Also remove or mark withdrawn in MealRequest embedded array
  await MealRequest.updateOne(
    { _id: requestId, 'offers._id': offer._id },
    { $set: { 'offers.$.status': 'withdrawn' } }
  );

  return { success: true, message: 'Offer withdrawn successfully' };
};

module.exports = {
  submitAuctionOffer,
  selectAuctionOffer,
  withdrawAuctionOffer
};
