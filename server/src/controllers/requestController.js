const mongoose = require('mongoose');
const MealRequest = require('../models/MealRequest');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to format/enrich request object with live dynamic remaining seconds (max 2 minutes = 120s)
const enrichRequestWithLiveTimer = (reqObj) => {
  const now = Date.now();
  let expiresAtMs;

  if (reqObj.expiresAt && new Date(reqObj.expiresAt).getTime() > now) {
    expiresAtMs = new Date(reqObj.expiresAt).getTime();
  } else {
    // If pending request expired or has no active expiresAt, refresh to 2 minutes from now
    expiresAtMs = now + 120 * 1000;
  }

  let calcSec = Math.floor((expiresAtMs - now) / 1000);
  let secondsLeft = Math.max(15, Math.min(120, calcSec));

  const plain = typeof reqObj.toObject === 'function' ? reqObj.toObject() : { ...reqObj };
  
  return {
    ...plain,
    id: plain._id ? `REQ-${plain._id.toString().slice(-4).toUpperCase()}` : `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
    secondsLeft,
    totalAmount: plain.totalAmount || ((plain.quantity || 1) * (plain.budget || 120))
  };
};

// @desc    Get all pending live meal requests
// @route   GET /api/requests
const getRequests = async (req, res) => {
  try {
    if (await isDbConnected()) {
      let requests = await MealRequest.find({ status: 'pending' }).sort({ createdAt: -1 });

      // Refresh expiresAt for pending requests in DB if expired
      const now = Date.now();
      for (const r of requests) {
        if (!r.expiresAt || new Date(r.expiresAt).getTime() <= now) {
          r.expiresAt = new Date(now + 120 * 1000);
          await r.save();
        }
      }

      const enriched = requests.map(enrichRequestWithLiveTimer);
      return res.json({ success: true, count: enriched.length, data: enriched, source: 'database' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error getting live requests:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new live meal request
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
    const itemBudget = Number(budget) || (items && items[0] ? items[0].price : 120);
    const calculatedTotal = totalAmount ? Number(totalAmount) : (qty * itemBudget);
    const durationMin = Number(validMinutes) || 2;
    const expiresAt = new Date(Date.now() + durationMin * 60 * 1000);

    const formattedItems = Array.isArray(items) && items.length > 0
      ? items.map(it => ({ name: it.name, qty: Number(it.qty) || 1, price: Number(it.price) || itemBudget }))
      : [{ name: mealType || 'Veg Special Thali', qty, price: itemBudget }];

    const reqData = {
      customerName: customerName || 'Rahul Shah',
      customerPhone: customerPhone || '+91 98765 12345',
      customerAddress: customerAddress || location || 'Satellite, Ahmedabad',
      mealType: mealType || formattedItems[0].name,
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
      createdAt: new Date()
    };

    if (await isDbConnected()) {
      const newRequest = new MealRequest(reqData);
      await newRequest.save();
      const enriched = enrichRequestWithLiveTimer(newRequest);
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
    let requestDoc = null;

    if (await isDbConnected()) {
      // Find by MongoDB _id or string match
      if (mongoose.Types.ObjectId.isValid(id)) {
        requestDoc = await MealRequest.findById(id);
      } else {
        requestDoc = await MealRequest.findOne({ _id: id });
      }

      if (!requestDoc) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      requestDoc.status = 'accepted';
      await requestDoc.save();

      // Automatically generate a real Order in MongoDB database
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
        providerId: req.providerId,
        customerName: requestDoc.customerName,
        customerPhone: requestDoc.customerPhone,
        customerAddress: requestDoc.customerAddress || requestDoc.location || 'Satellite, Ahmedabad',
        tiffinName: firstItem.name || requestDoc.mealType || 'Deluxe Thali',
        tiffinCategory: requestDoc.category || 'Gujarati',
        tiffinImage: '/assets/provider_1.png',
        quantity: requestDoc.quantity || 1,
        unitPrice: firstItem.price || requestDoc.budget || 120,
        subtotal,
        deliveryKm: km,
        deliveryFee,
        packagingFee,
        gstTax,
        totalAmount: finalTotal,
        paymentStatus: 'Paid',
        status: 'Preparing',
        deliveryStatus: 'Searching',
        pickupAddress: 'Shreeji Tiffin Kitchen, Satellite, Ahmedabad'
      });

      await newOrder.save();

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
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Decline a live request
// @route   POST /api/requests/:id/decline
const declineRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isDbConnected()) {
      let updated = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updated = await MealRequest.findByIdAndUpdate(id, { status: 'declined' }, { new: true });
      } else {
        updated = await MealRequest.findOneAndUpdate({ _id: id }, { status: 'declined' }, { new: true });
      }
      return res.json({ success: true, message: 'Request declined', data: updated });
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

module.exports = {
  createRequest,
  getRequests,
  updateRequest,
  deleteRequest,
  acceptRequest,
  declineRequest,
  simulateLiveRequest
};

