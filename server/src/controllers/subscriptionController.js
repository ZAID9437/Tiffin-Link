const Subscription = require('../models/Subscription');
const { ensureConnected } = require('../config/db');

const initialSubscriptions = [
  {
    subId: 'SUB-801',
    customerName: 'Rahul Shah',
    customerEmail: 'rahul.shah@gmail.com',
    customerPhone: '+91 98765 12345',
    plan: 'Lunch • Monday to Friday',
    mealType: 'Gujarati Veg Thali',
    pricePerMeal: 120,
    nextMeal: 'Tomorrow • 12:30 PM',
    address: 'B-402, Shivalik Towers, Satellite, Ahmedabad',
    status: 'Active'
  },
  {
    subId: 'SUB-802',
    customerName: 'Neha Verma',
    customerEmail: 'neha.v@gmail.com',
    customerPhone: '+91 98123 45678',
    plan: 'Dinner • Everyday (7 Days)',
    mealType: 'Jain Special Thali',
    pricePerMeal: 130,
    nextMeal: 'Today • 7:30 PM',
    address: '12, Goyal Intercity, Drive-In Road, Ahmedabad',
    status: 'Active'
  },
  {
    subId: 'SUB-803',
    customerName: 'Amit Trivedi',
    customerEmail: 'trivedi.a@gmail.com',
    customerPhone: '+91 97654 32109',
    plan: 'Lunch & Dinner • Mon to Sat',
    mealType: 'North Indian Deluxe Thali',
    pricePerMeal: 150,
    nextMeal: 'Today • 8:00 PM',
    address: 'A-10, Dev Aurum, Anandnagar, Ahmedabad',
    status: 'Active'
  },
  {
    subId: 'SUB-804',
    customerName: 'Karan Patel',
    customerEmail: 'karan.p@gmail.com',
    customerPhone: '+91 96543 21098',
    plan: 'Lunch • Monday to Friday',
    mealType: 'Veg Mini Tiffin',
    pricePerMeal: 90,
    nextMeal: 'Tomorrow • 1:00 PM',
    address: '501, Titanium City Center, Prahaladnagar, Ahmedabad',
    status: 'Paused'
  }
];

// @desc Get all subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const isDb = await ensureConnected();
    if (isDb) {
      let subs = await Subscription.find().sort({ createdAt: -1 });
      if (subs.length === 0) {
        subs = await Subscription.insertMany(initialSubscriptions);
      }
      return res.json({ success: true, data: subs });
    }
    return res.json({ success: true, data: initialSubscriptions });
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Create subscription
const createSubscription = async (req, res) => {
  try {
    const isDb = await ensureConnected();
    const subData = {
      subId: 'SUB-' + Math.floor(100 + Math.random() * 900),
      ...req.body
    };

    if (isDb) {
      const newSub = new Subscription(subData);
      await newSub.save();
      return res.status(201).json({ success: true, data: newSub });
    }
    initialSubscriptions.unshift(subData);
    return res.status(201).json({ success: true, data: subData });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Update subscription status/details
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const isDb = await ensureConnected();

    if (isDb) {
      const updated = await Subscription.findByIdAndUpdate(id, req.body, { new: true });
      return res.json({ success: true, data: updated });
    }
    const idx = initialSubscriptions.findIndex(s => s.subId === id);
    if (idx !== -1) {
      initialSubscriptions[idx] = { ...initialSubscriptions[idx], ...req.body };
      return res.json({ success: true, data: initialSubscriptions[idx] });
    }
    res.status(404).json({ success: false, message: 'Subscription not found' });
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Delete subscription
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const isDb = await ensureConnected();

    if (isDb) {
      await Subscription.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Subscription deleted' });
    }
    const idx = initialSubscriptions.findIndex(s => s.subId === id);
    if (idx !== -1) {
      initialSubscriptions.splice(idx, 1);
    }
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription
};
