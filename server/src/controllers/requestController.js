const mongoose = require('mongoose');
const MealRequest = require('../models/MealRequest');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to format/enrich request object with live dynamic remaining seconds
const enrichRequestWithLiveTimer = (reqObj) => {
  const now = Date.now();
  let expiresAtMs = reqObj.expiresAt ? new Date(reqObj.expiresAt).getTime() : (now + 120 * 1000);
  let secondsLeft = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

  const plain = typeof reqObj.toObject === 'function' ? reqObj.toObject() : { ...reqObj };
  
  return {
    ...plain,
    id: plain._id ? `REQ-${plain._id.toString().slice(-4).toUpperCase()}` : `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    secondsLeft,
    totalAmount: plain.totalAmount || ((plain.quantity || 1) * (plain.budget || 0))
  };
};

// @desc    Get all pending live meal requests (auto-cleans expired, deduplicates, and scopes to provider)
// @route   GET /api/requests
const getRequests = async (req, res) => {
  try {
    if (await isDbConnected()) {
      const now = new Date();
      const providerId = req.providerId || (req.user?.role === 'provider' ? (req.user.providerId || req.user._id?.toString()) : null);

      // 1. Mark expired requests so they are permanently removed from live dispatch
      await MealRequest.updateMany(
        { status: 'pending', expiresAt: { $lte: now } },
        { $set: { status: 'expired' } }
      );

      // 2. Build provider-isolated query:
      // Must be pending and unexpired
      const query = {
        status: 'pending',
        expiresAt: { $gt: now }
      };

      if (providerId) {
        query.$and = [
          {
            $or: [
              { providerId: null },
              { providerId: { $exists: false } },
              { providerId: '' },
              { providerId: String(providerId) }
            ]
          },
          {
            declinedByProviders: { $ne: String(providerId) }
          }
        ];
      }

      // Fetch active pending requests matching this provider
      let requests = await MealRequest.find(query).sort({ createdAt: -1 });

      // 3. Deduplicate multiple submissions from same customer for same meal within short window
      const seenCustomerMap = new Map();
      const uniqueRequests = [];

      for (const r of requests) {
        const phone = (r.customerPhone || '').replace(/\D/g, '');
        const name = (r.customerName || '').trim().toLowerCase();
        const meal = (r.mealType || '').trim().toLowerCase();
        const dedupeKey = `${phone || name}_${meal}`;

        if (!seenCustomerMap.has(dedupeKey)) {
          seenCustomerMap.set(dedupeKey, r);
          uniqueRequests.push(r);
        } else {
          // Mark superseded duplicate as expired
          MealRequest.findByIdAndUpdate(r._id, { status: 'expired' }).catch(() => {});
        }
      }

      const enriched = uniqueRequests.map(enrichRequestWithLiveTimer);
      return res.json({ success: true, count: enriched.length, data: enriched, source: 'database' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error getting live requests:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new live meal request (with duplicate prevention guard)
// @route   POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerAddress, 
      mealType, 
      category, 
      items, 
      quantity, 
      date, 
      time, 
      deliveryType, 
      location, 
      distance, 
      budget, 
      totalAmount, 
      specialInstructions,
      validMinutes 
    } = req.body;
    
    if (!mealType && (!items || items.length === 0)) {
      return res.status(400).json({ success: false, message: 'Please provide mealType or items' });
    }

    const qty = Number(quantity) || 1;
    const itemBudget = Number(budget) || (items && items[0] ? items[0].price : 0);
    const calculatedTotal = totalAmount ? Number(totalAmount) : (qty * itemBudget);
    const durationMin = Number(validMinutes) || 2;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMin * 60 * 1000);

    const formattedItems = Array.isArray(items) && items.length > 0
      ? items.map(it => ({ name: it.name, qty: Number(it.qty) || 1, price: Number(it.price) || itemBudget }))
      : [{ name: mealType || 'Custom Meal', qty, price: itemBudget }];

    const cleanCustomerName = customerName || (req.user?.name || 'Customer');
    const cleanCustomerPhone = customerPhone || (req.user?.phone || '');
    const cleanMealType = mealType || formattedItems[0].name;

    if (await isDbConnected()) {
      // Duplicate prevention: If this customer already has an active pending request in last 60s for same meal, reuse it
      const existingRecent = await MealRequest.findOne({
        status: 'pending',
        $or: [
          { customerPhone: cleanCustomerPhone },
          { customerName: cleanCustomerName }
        ],
        mealType: cleanMealType,
        expiresAt: { $gt: now },
        createdAt: { $gte: new Date(now.getTime() - 60 * 1000) }
      });

      if (existingRecent) {
        const enriched = enrichRequestWithLiveTimer(existingRecent);
        return res.status(200).json({
          success: true,
          data: enriched,
          message: 'Active request already placed in provider queue',
          source: 'database'
        });
      }

      const cleanCustomerEmail = req.body.customerEmail || req.user?.email || '';
      const cleanCustomerId = req.body.customerId || req.user?._id?.toString() || null;

      const reqData = {
        customerName: cleanCustomerName,
        customerPhone: cleanCustomerPhone,
        customerEmail: cleanCustomerEmail,
        customerId: cleanCustomerId,
        customerAddress: customerAddress || location || 'Satellite, Ahmedabad',
        mealType: cleanMealType,
        category: category || 'Gujarati',
        items: formattedItems,
        quantity: qty,
        date: date || 'Today',
        time: time || '1:30 PM',
        deliveryType: deliveryType || 'Delivery',
        location: location || customerAddress || 'Satellite, Ahmedabad',
        distance: distance || '1.8 km',
        budget: itemBudget,
        totalAmount: calculatedTotal,
        specialInstructions: specialInstructions || '',
        status: 'pending',
        expiresAt,
        createdAt: now
      };

      const newRequest = new MealRequest(reqData);
      await newRequest.save();
      const enriched = enrichRequestWithLiveTimer(newRequest);

      // Trigger AI Smart Provider Matching in background
      try {
        const { evaluateMatchingForRequest } = require('../services/matchingService');
        evaluateMatchingForRequest(newRequest._id).catch(err => console.log('Auto matching eval error:', err.message));
      } catch (mErr) {}

      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        if (io) io.emit('request:new', enriched);
      } catch (sErr) {}

      return res.status(201).json({ success: true, data: enriched, source: 'database' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error creating live request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Accept a live request and convert directly into an active Preparing Order
// @route   POST /api/requests/:id/accept
const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId || (req.user?.role === 'provider' ? (req.user.providerId || req.user._id?.toString()) : null);

    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (await isDbConnected()) {
      // Atomic find & update: only accept if status is currently 'pending'
      const matchCriteria = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { _id: id };
      const requestDoc = await MealRequest.findOneAndUpdate(
        { ...matchCriteria, status: 'pending' },
        { 
          $set: { 
            status: 'accepted',
            acceptedByProviderId: String(providerId)
          } 
        },
        { new: true }
      );

      if (!requestDoc) {
        return res.status(409).json({ 
          success: false, 
          message: 'This request is no longer available (it may have been accepted by another kitchen or expired).' 
        });
      }

      // Automatically generate a real Order in MongoDB database for THIS provider
      const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const firstItem = (requestDoc.items && requestDoc.items[0]) || { name: requestDoc.mealType, qty: requestDoc.quantity, price: requestDoc.budget };
      const km = parseFloat(requestDoc.distance) || 2.4;
      const subtotal = requestDoc.totalAmount || (requestDoc.quantity * requestDoc.budget);
      const deliveryFee = Math.round(25 + (km * 8));
      const packagingFee = 15;
      const gstTax = Math.round(subtotal * 0.05);
      const finalTotal = subtotal + deliveryFee + packagingFee + gstTax;

      const newOrder = new Order({
        orderId: orderNumber,
        providerId: String(providerId),
        customerName: requestDoc.customerName,
        customerPhone: requestDoc.customerPhone,
        customerAddress: requestDoc.customerAddress || requestDoc.location || '',
        tiffinName: firstItem.name || requestDoc.mealType || 'Custom Meal',
        tiffinCategory: requestDoc.category || '',
        tiffinImage: requestDoc.image || '',
        quantity: requestDoc.quantity || 1,
        unitPrice: firstItem.price || requestDoc.budget || 0,
        subtotal,
        deliveryKm: km,
        deliveryFee,
        driverEarning: deliveryFee,
        packagingFee,
        gstTax,
        totalAmount: finalTotal,
        paymentStatus: 'Paid',
        status: 'Preparing',
        deliveryStatus: 'Unassigned',
        pickupAddress: 'Kitchen Hub'
      });

      await newOrder.save();

      // Enqueue to SmartQueue for kitchen prep
      try {
        const SmartQueue = require('../models/SmartQueue');
        await new SmartQueue({
          queueType: 'provider_prep',
          orderId: orderNumber,
          providerId: String(providerId),
          customerName: requestDoc.customerName,
          customerAddress: requestDoc.customerAddress || requestDoc.location,
          mealTitle: requestDoc.mealType,
          quantity: requestDoc.quantity || 1,
          isUrgent: Boolean(requestDoc.isUrgent || requestDoc.urgencyLevel === 'emergency'),
          urgencyLevel: requestDoc.urgencyLevel || 'standard',
          priorityScore: requestDoc.urgencyLevel === 'emergency' ? 95 : 60,
          status: 'queued',
          targetReadyTime: new Date(Date.now() + 25 * 60 * 1000)
        }).save();
      } catch (qErr) {}

      // Risk Evaluation in background
      try {
        const { evaluateOrderRisk } = require('../services/fraudRiskService');
        evaluateOrderRisk({
          orderId: orderNumber,
          userId: requestDoc.customerId,
          userEmail: requestDoc.customerEmail,
          totalAmount: finalTotal,
          actionType: 'order_placement'
        }).catch(() => {});
      } catch (rErr) {}

      // Realtime Socket broadcast
      try {
        const { getIO, emitToProvider } = require('../services/socketService');
        emitToProvider(String(providerId), 'order:created', newOrder);
        emitToProvider(String(providerId), 'order:new', newOrder);
        const io = getIO();
        if (io) {
          io.emit('request:accepted', { requestId: requestDoc._id, providerId: String(providerId) });
        }
      } catch (sErr) {}

      return res.json({
        success: true,
        message: `Request accepted and converted to Order ${orderNumber} in Preparing status`,
        data: {
          request: requestDoc,
          order: newOrder
        }
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error accepting live request:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Decline a live request (hides strictly from current provider without canceling for others)
// @route   POST /api/requests/:id/decline
const declineRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId || (req.user?.role === 'provider' ? (req.user.providerId || req.user._id?.toString()) : null);

    if (await isDbConnected()) {
      const matchCriteria = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { _id: id };
      let updated = null;

      if (providerId) {
        // Hide request from THIS provider only
        updated = await MealRequest.findOneAndUpdate(
          matchCriteria,
          { $addToSet: { declinedByProviders: String(providerId) } },
          { new: true }
        );
      } else {
        updated = await MealRequest.findOneAndUpdate(matchCriteria, { status: 'declined' }, { new: true });
      }

      if (updated) {
        try {
          const { getIO } = require('../services/socketService');
          const io = getIO();
          const declineReason = req.body?.reason || 'The selected kitchen is currently at peak preparation capacity.';
          const payload = {
            requestId: updated._id,
            status: 'declined',
            mealType: updated.mealType,
            customerEmail: updated.customerEmail,
            customerId: updated.customerId,
            providerId: String(providerId || ''),
            reason: declineReason
          };
          if (io) {
            io.emit('request:declined', payload);
            if (updated.customerId) {
              io.to(`customer:${updated.customerId}`).emit('request:declined', payload);
            }
            if (updated.customerEmail) {
              io.to(`customer:${updated.customerEmail.toLowerCase()}`).emit('request:declined', payload);
            }
          }
        } catch (sErr) {}
      }

      return res.json({ success: true, message: 'Request dismissed for this provider', data: updated });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error declining live request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Simulate/generate a new incoming realistic customer meal request in real-time
// @route   POST /api/requests/simulate
const simulateLiveRequest = async (req, res) => {
  try {
    const Tiffin = require('../models/Tiffin');
    const dbTiffin = await Tiffin.findOne() || { name: 'Kathiyawadi Royal Thali', price: 160, category: 'Kathiyawadi' };
    const expiresAt = new Date(Date.now() + 120 * 1000); // 2 minutes validity

    const reqData = {
      customerName: req.body.customerName || 'Aarav Patel',
      customerPhone: req.body.customerPhone || '+91 98250 ' + Math.floor(10000 + Math.random() * 90000),
      customerAddress: req.body.customerAddress || 'Prahlad Nagar, Ahmedabad',
      location: req.body.location || 'Prahlad Nagar, Ahmedabad',
      mealType: dbTiffin.name,
      category: dbTiffin.category || 'Gujarati',
      items: [{ name: dbTiffin.name, qty: 1, price: dbTiffin.price || 140 }],
      quantity: 1,
      budget: dbTiffin.price || 140,
      totalAmount: dbTiffin.price || 140,
      distance: '2.1 km',
      specialInstructions: req.body.specialInstructions || 'Please make it hot & fresh',
      deliveryType: 'Delivery',
      status: 'pending',
      date: 'Today',
      time: new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresAt,
      createdAt: new Date()
    };

    if (await isDbConnected()) {
      const newRequest = new MealRequest(reqData);
      await newRequest.save();
      const enriched = enrichRequestWithLiveTimer(newRequest);

      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        if (io) io.emit('request:new', enriched);
      } catch (sErr) {}

      return res.status(201).json({
        success: true,
        message: 'New live customer meal request simulated successfully!',
        data: enriched,
        source: 'database'
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error simulating live request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update request status (generic)
// @route   PUT /api/requests/:id
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (await isDbConnected()) {
      const updated = await MealRequest.findByIdAndUpdate(id, { status }, { new: true });
      return res.json({ success: true, data: updated });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete meal request
// @route   DELETE /api/requests/:id
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isDbConnected()) {
      await MealRequest.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Request deleted' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Submit a quote/offer for a live meal request
// @route   POST /api/requests/:id/offers
const submitOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId || (req.user?.role === 'provider' ? (req.user.providerId || req.user._id?.toString()) : null);

    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const {
      price,
      quantity,
      deliveryCharge,
      readyTimeMinutes,
      message,
      itemsIncluded
    } = req.body;

    const offerPrice = Number(price);
    if (!offerPrice || offerPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid offer price is required' });
    }

    if (await isDbConnected()) {
      const requestDoc = await MealRequest.findById(id);
      if (!requestDoc) {
        return res.status(404).json({ success: false, message: 'Meal request not found' });
      }

      if (requestDoc.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'This request is no longer open for offers' });
      }

      if (new Date(requestDoc.expiresAt).getTime() <= Date.now()) {
        requestDoc.status = 'expired';
        await requestDoc.save();
        return res.status(400).json({ success: false, message: 'This request has expired' });
      }

      // Check if provider already has an active offer
      const existingOffer = (requestDoc.offers || []).find(
        o => o.providerId === String(providerId) && o.status === 'pending'
      );
      if (existingOffer) {
        return res.status(400).json({ success: false, message: 'You have already submitted an active offer for this request' });
      }

      // Fetch Provider profile for details
      let providerName = req.user?.kitchenName || req.user?.businessName || req.user?.name || 'Local Kitchen';
      let providerRating = 4.8;
      let providerReviewsCount = 28;
      let kitchenAddress = 'Kitchen Hub, Ahmedabad';
      let providerImage = '';

      try {
        const Provider = require('../models/Provider');
        const providerProfile = await Provider.findOne({
          $or: [
            { providerId: String(providerId) },
            { user: mongoose.Types.ObjectId.isValid(providerId) ? providerId : null }
          ]
        });
        if (providerProfile) {
          providerName = providerProfile.kitchenName || providerProfile.businessName || providerName;
          providerRating = providerProfile.rating || providerRating;
          providerReviewsCount = providerProfile.reviewsCount || providerReviewsCount;
          kitchenAddress = providerProfile.address?.formatted || providerProfile.address?.area || kitchenAddress;
          providerImage = providerProfile.image || providerImage;
        }
      } catch (pErr) {}

      const prepTime = Number(readyTimeMinutes) || 25;
      const newOfferData = {
        providerId: String(providerId),
        providerName,
        providerRating,
        providerReviewsCount,
        providerImage,
        kitchenAddress,
        price: offerPrice,
        quantity: Number(quantity) || requestDoc.quantity || 1,
        deliveryCharge: Number(deliveryCharge) || 0,
        readyTimeMinutes: prepTime,
        estimatedDeliveryTime: `${prepTime + 15} mins`,
        itemsIncluded: Array.isArray(itemsIncluded) && itemsIncluded.length > 0 ? itemsIncluded : requestDoc.items,
        message: (message || '').trim(),
        status: 'pending',
        createdAt: new Date()
      };

      if (!requestDoc.offers) requestDoc.offers = [];
      requestDoc.offers.push(newOfferData);
      await requestDoc.save();

      const createdOffer = requestDoc.offers[requestDoc.offers.length - 1];

      // Also persist to Offer collection
      try {
        const Offer = require('../models/Offer');
        const offerDoc = new Offer({
          requestId: requestDoc._id,
          ...newOfferData
        });
        await offerDoc.save();
      } catch (oErr) {}

      // Emit real-time Socket event to all clients / customer
      try {
        const { getIO } = require('../services/socketService');
        const io = getIO();
        if (io) {
          io.emit('request:offer:new', {
            requestId: requestDoc._id,
            offer: createdOffer
          });
        }
      } catch (sErr) {}

      return res.status(201).json({
        success: true,
        message: 'Offer submitted successfully',
        data: createdOffer
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error submitting offer:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Customer selects a provider offer atomically and creates the active Order
// @route   POST /api/requests/:id/offers/:offerId/select
const selectOffer = async (req, res) => {
  try {
    const { id, offerId } = req.params;

    if (await isDbConnected()) {
      // Find request in pending status
      const requestDoc = await MealRequest.findOne({
        _id: id,
        status: 'pending'
      });

      if (!requestDoc) {
        return res.status(409).json({
          success: false,
          message: 'This request is no longer pending or has already been accepted.'
        });
      }

      // Find the specific offer
      const offer = requestDoc.offers.id ? requestDoc.offers.id(offerId) : (requestDoc.offers || []).find(o => String(o._id) === String(offerId));
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      if (offer.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'This offer is no longer available' });
      }

      // Safe atomic update
      requestDoc.status = 'accepted';
      requestDoc.acceptedByProviderId = String(offer.providerId);
      requestDoc.selectedOfferId = offer._id;

      // Mark chosen offer as selected, all other offers as rejected
      requestDoc.offers.forEach(o => {
        if (String(o._id) === String(offer._id)) {
          o.status = 'selected';
        } else if (o.status === 'pending') {
          o.status = 'rejected';
        }
      });

      await requestDoc.save();

      // Update standalone Offer documents if present
      try {
        const Offer = require('../models/Offer');
        await Offer.updateMany(
          { requestId: requestDoc._id, _id: { $ne: offer._id }, status: 'pending' },
          { $set: { status: 'rejected' } }
        );
        await Offer.findByIdAndUpdate(offer._id, { $set: { status: 'selected' } });
      } catch (oErr) {}

      // Create the single Order in MongoDB
      const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const km = parseFloat(requestDoc.distance) || 2.4;
      const subtotal = offer.price;
      const deliveryFee = offer.deliveryCharge || Math.round(25 + (km * 8));
      const packagingFee = 15;
      const gstTax = Math.round(subtotal * 0.05);
      const finalTotal = subtotal + deliveryFee + packagingFee + gstTax;

      const newOrder = new Order({
        orderId: orderNumber,
        providerId: String(offer.providerId),
        providerName: offer.providerName,
        customerName: requestDoc.customerName,
        customerPhone: requestDoc.customerPhone,
        customerAddress: requestDoc.customerAddress || requestDoc.location || '',
        customerEmail: requestDoc.customerEmail || req.user?.email || '',
        tiffinName: requestDoc.mealType || 'Custom Meal',
        tiffinCategory: requestDoc.category || '',
        quantity: offer.quantity || requestDoc.quantity || 1,
        unitPrice: Math.round(subtotal / (offer.quantity || requestDoc.quantity || 1)),
        subtotal,
        deliveryKm: km,
        deliveryFee,
        driverEarning: deliveryFee,
        packagingFee,
        gstTax,
        totalAmount: finalTotal,
        paymentStatus: 'Paid',
        status: 'Preparing',
        deliveryStatus: 'Unassigned',
        pickupAddress: offer.kitchenAddress || 'Kitchen Hub'
      });

      await newOrder.save();

      // Realtime Socket broadcast
      try {
        const { getIO, emitToProvider } = require('../services/socketService');
        emitToProvider(String(offer.providerId), 'order:created', newOrder);
        emitToProvider(String(offer.providerId), 'order:new', newOrder);
        emitToProvider(String(offer.providerId), 'offer:selected', { requestId: requestDoc._id, offerId });
        const io = getIO();
        if (io) {
          io.emit('request:accepted', { requestId: requestDoc._id, providerId: String(offer.providerId) });
          io.emit('order:created', newOrder);
        }
      } catch (sErr) {}

      return res.json({
        success: true,
        message: `Offer accepted! Order ${orderNumber} created in Preparing status.`,
        data: {
          request: requestDoc,
          order: newOrder
        }
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error selecting offer:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get customer's meal requests and their competing offers
// @route   GET /api/requests/my-requests
const getMyRequests = async (req, res) => {
  try {
    if (await isDbConnected()) {
      const email = req.query.email || req.user?.email;
      const phone = req.query.phone || req.user?.phone;
      const customerId = req.user?._id?.toString();

      const queryConditions = [];
      if (email) queryConditions.push({ customerEmail: email });
      if (phone) queryConditions.push({ customerPhone: phone });
      if (customerId) queryConditions.push({ customerId: customerId });

      let query = {};
      if (queryConditions.length > 0) {
        query = { $or: queryConditions };
      }

      const requests = await MealRequest.find(query).sort({ createdAt: -1 }).limit(30);
      const enriched = requests.map(enrichRequestWithLiveTimer);

      return res.json({ success: true, count: enriched.length, data: enriched });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error fetching customer requests:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get offers for a specific request
// @route   GET /api/requests/:id/offers
const getOffersForRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (await isDbConnected()) {
      const requestDoc = await MealRequest.findById(id);
      if (!requestDoc) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      return res.json({ success: true, count: requestDoc.offers.length, data: requestDoc.offers });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Provider withdraws an offer
// @route   POST /api/requests/:id/offers/:offerId/withdraw
const withdrawOffer = async (req, res) => {
  try {
    const { id, offerId } = req.params;
    const providerId = req.providerId || (req.user?.role === 'provider' ? (req.user.providerId || req.user._id?.toString()) : null);

    if (await isDbConnected()) {
      const requestDoc = await MealRequest.findById(id);
      if (!requestDoc) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      const offer = (requestDoc.offers || []).find(o => String(o._id) === String(offerId));
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      if (providerId && String(offer.providerId) !== String(providerId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized to withdraw this offer' });
      }

      if (offer.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Cannot withdraw an offer that is not pending' });
      }

      offer.status = 'withdrawn';
      await requestDoc.save();

      return res.json({ success: true, message: 'Offer withdrawn successfully' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error withdrawing offer:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all offers submitted by this provider
// @route   GET /api/requests/provider/my-offers
const getProviderOffers = async (req, res) => {
  try {
    const providerId = req.providerId || (req.user?.role === 'provider' ? (req.user.providerId || req.user._id?.toString()) : null);
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (await isDbConnected()) {
      const requests = await MealRequest.find({ 'offers.providerId': String(providerId) }).sort({ createdAt: -1 });
      const myOffers = [];
      requests.forEach(r => {
        (r.offers || []).forEach(o => {
          if (String(o.providerId) === String(providerId)) {
            myOffers.push({
              ...o.toObject(),
              requestId: r._id,
              mealType: r.mealType,
              customerName: r.customerName,
              customerAddress: r.customerAddress || r.location,
              requestStatus: r.status
            });
          }
        });
      });

      return res.json({ success: true, count: myOffers.length, data: myOffers });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error getting provider offers:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getMyRequests,
  updateRequest,
  deleteRequest,
  acceptRequest,
  declineRequest,
  simulateLiveRequest,
  submitOffer,
  selectOffer,
  getOffersForRequest,
  withdrawOffer,
  getProviderOffers
};

