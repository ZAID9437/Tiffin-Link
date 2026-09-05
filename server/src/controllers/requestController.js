const mongoose = require('mongoose');
const MealRequest = require('../models/MealRequest');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const localRequests = [];
const isDbConnected = async () => await ensureConnected();

const SIMULATED_SAMPLES = [
  {
    customerName: 'Ananya Roy',
    customerPhone: '+91 98251 34912',
    customerAddress: 'B-604, Venus Atlantis, Prahlad Nagar, Ahmedabad',
    location: 'Prahlad Nagar, Ahmedabad',
    mealType: 'Kathiyawadi Royal Thali',
    category: 'Kathiyawadi',
    items: [{ name: 'Kathiyawadi Royal Thali (Ringan Bharthu, Bajra Rotla, Chhas)', qty: 2, price: 160 }],
    quantity: 2,
    budget: 160,
    totalAmount: 320,
    distance: '1.4 km',
    specialInstructions: 'Please add extra garlic chutney',
    deliveryType: 'Delivery'
  },
  {
    customerName: 'Rohan Patel',
    customerPhone: '+91 97240 88219',
    customerAddress: 'C-201, Goyal Park, Vastrapur, Ahmedabad',
    location: 'Vastrapur, Ahmedabad',
    mealType: 'Gujarati Executive Thali',
    category: 'Gujarati',
    items: [{ name: 'Gujarati Executive Thali (2 Sabzi, 5 Phulka, Dal Rice, Sweet)', qty: 1, price: 140 }],
    quantity: 1,
    budget: 140,
    totalAmount: 140,
    distance: '2.1 km',
    specialInstructions: 'Medium spicy, piping hot rotis please',
    deliveryType: 'Delivery'
  },
  {
    customerName: 'Pooja Desai',
    customerPhone: '+91 98982 71630',
    customerAddress: '12, Shivalik Villa, Bodakdev, Ahmedabad',
    location: 'Bodakdev, Ahmedabad',
    mealType: 'Jain Special Swaminarayan Thali',
    category: 'Jain',
    items: [{ name: 'Jain Special Thali (No Onion/Garlic/Potato, Puri, Halwa)', qty: 3, price: 150 }],
    quantity: 3,
    budget: 150,
    totalAmount: 450,
    distance: '2.8 km',
    specialInstructions: 'Strictly Jain preparation please',
    deliveryType: 'Delivery'
  },
  {
    customerName: 'Vikramaditya Sharma',
    customerPhone: '+91 94285 41092',
    customerAddress: 'Flat 402, Titanium City Center, Satellite, Ahmedabad',
    location: 'Satellite, Ahmedabad',
    mealType: 'Punjabi Deluxe Paneer Combo',
    category: 'Punjabi',
    items: [{ name: 'Paneer Lababdar Deluxe Thali + Extra Butter Naan', qty: 2, price: 180 }],
    quantity: 2,
    budget: 180,
    totalAmount: 360,
    distance: '1.9 km',
    specialInstructions: 'Deliver to 4th floor door, ring bell twice',
    deliveryType: 'Delivery'
  },
  {
    customerName: 'Sneha Kulkarni',
    customerPhone: '+91 98790 15632',
    customerAddress: 'A-102, Maple County, Thaltej, Ahmedabad',
    location: 'Thaltej, Ahmedabad',
    mealType: 'Healthy Organic Khichdi & Kadhi Bowl',
    category: 'Healthy',
    items: [{ name: 'Organic Bajra Khichdi & Gujarati Kadhi Combo + Papad', qty: 1, price: 130 }],
    quantity: 1,
    budget: 130,
    totalAmount: 130,
    distance: '3.2 km',
    specialInstructions: 'Low oil and low salt, thank you',
    deliveryType: 'Delivery'
  },
  {
    customerName: 'Hardik Joshi',
    customerPhone: '+91 99042 33811',
    customerAddress: '501, Iscon Elegance, SG Highway, Ahmedabad',
    location: 'SG Highway, Ahmedabad',
    mealType: 'Authentic Marwari Dal Baati Churma',
    category: 'Rajasthani',
    items: [{ name: 'Authentic Marwari Dal Baati Churma (4 Baati + Pure Desi Ghee)', qty: 2, price: 170 }],
    quantity: 2,
    budget: 170,
    totalAmount: 340,
    distance: '2.5 km',
    specialInstructions: 'Serve with spicy green chutney and lemon wedges',
    deliveryType: 'Delivery'
  }
];

// Helper to format/enrich request object with live dynamic remaining seconds (max 2 minutes = 120s)
const enrichRequestWithLiveTimer = (reqObj) => {
  const now = Date.now();
  let expiresAtMs;

  if (reqObj.expiresAt) {
    expiresAtMs = new Date(reqObj.expiresAt).getTime();
  } else if (reqObj.createdAt) {
    expiresAtMs = new Date(reqObj.createdAt).getTime() + 120 * 1000; // Strictly 2 minutes
  } else {
    expiresAtMs = now + 120 * 1000;
  }

  let secondsLeft = Math.max(0, Math.min(120, Math.floor((expiresAtMs - now) / 1000)));

  // Automatically decline pending request when 2-minute timer reaches 0
  if (secondsLeft <= 0 && reqObj.status === 'pending') {
    reqObj.status = 'declined';
    if (typeof reqObj.save === 'function') {
      reqObj.save().catch(e => console.error('Error auto-declining expired request:', e));
    }
  }

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
      const requests = await MealRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
      const enriched = requests.map(enrichRequestWithLiveTimer);
      return res.json({ success: true, count: enriched.length, data: enriched, source: 'database' });
    } else {
      const pending = localRequests.filter(r => r.status === 'pending');
      const enriched = pending.map(enrichRequestWithLiveTimer);
      return res.json({ success: true, count: enriched.length, data: enriched.reverse(), source: 'in-memory' });
    }
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
    } else {
      const mockRequest = {
        _id: 'mr_' + Math.random().toString(36).substr(2, 9),
        ...reqData
      };
      localRequests.push(mockRequest);
      const enriched = enrichRequestWithLiveTimer(mockRequest);
      return res.status(201).json({ success: true, data: enriched, source: 'in-memory' });
    }
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
    } else {
      const idx = localRequests.findIndex(r => r._id === id);
      if (idx !== -1) {
        localRequests[idx].status = 'accepted';
        return res.json({ success: true, message: 'Request accepted', data: { request: localRequests[idx] } });
      }
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
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
    } else {
      const idx = localRequests.findIndex(r => r._id === id);
      if (idx !== -1) {
        localRequests[idx].status = 'declined';
        return res.json({ success: true, message: 'Request declined', data: localRequests[idx] });
      }
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
  } catch (error) {
    console.error('Error declining live request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Simulate/generate a new incoming realistic customer meal request in real-time
// @route   POST /api/requests/simulate
const simulateLiveRequest = async (req, res) => {
  try {
    const randomSample = SIMULATED_SAMPLES[Math.floor(Math.random() * SIMULATED_SAMPLES.length)];
    const expiresAt = new Date(Date.now() + 120 * 1000); // 2 minutes validity
    
    // Slight jitter to phone number to make each simulated order unique
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const customerPhone = randomSample.customerPhone.slice(0, -4) + randomSuffix;

    const reqData = {
      ...randomSample,
      customerPhone,
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
    } else {
      const mockRequest = {
        _id: 'mr_' + Math.random().toString(36).substr(2, 9),
        ...reqData
      };
      localRequests.push(mockRequest);
      const enriched = enrichRequestWithLiveTimer(mockRequest);
      return res.status(201).json({
        success: true,
        message: 'New live customer meal request simulated successfully!',
        data: enriched,
        source: 'in-memory'
      });
    }
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
    } else {
      const idx = localRequests.findIndex(r => r._id === id);
      if (idx !== -1) {
        localRequests[idx].status = status;
        return res.json({ success: true, data: localRequests[idx] });
      }
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
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
    } else {
      const idx = localRequests.findIndex(r => r._id === id);
      if (idx !== -1) {
        localRequests.splice(idx, 1);
      }
      return res.json({ success: true, message: 'Request deleted' });
    }
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

