const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const dayNameMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

// Helper to compute next valid delivery date from allowed days
const calculateNextDeliveryDate = (deliveryDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], fromDate = new Date()) => {
  const current = new Date(fromDate);
  // Look up to 7 days ahead
  for (let i = 0; i <= 7; i++) {
    const checkDate = new Date(current);
    checkDate.setDate(current.getDate() + i);
    const dayName = dayNameMap[checkDate.getDay()];
    if (deliveryDays.includes(dayName)) {
      const dayNum = checkDate.getDate();
      const monthStr = checkDate.toLocaleString('en', { month: 'short' });
      const yearStr = checkDate.getFullYear();
      return `${dayNum} ${monthStr} ${yearStr}`;
    }
  }
  return `${current.getDate()} ${current.toLocaleString('en', { month: 'short' })} ${current.getFullYear()}`;
};

const initialSeedSubscriptions = [
  {
    subId: 'SUB-801',
    customerName: 'Raj Patel',
    customerEmail: 'raj.patel@gmail.com',
    customerPhone: '+91 98250 12345',
    plan: 'Monthly Deluxe Gujarati Thali',
    frequency: 'Daily',
    deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    mealType: 'Lunch',
    pricePerMeal: 120,
    amount: 3200,
    startDate: '01 Aug 2026',
    endDate: '31 Aug 2026',
    nextDeliveryDate: '18 Aug 2026',
    address: '402 Sunrise Towers, Navrangpura, Ahmedabad',
    paymentStatus: 'PAID',
    status: 'ACTIVE'
  },
  {
    subId: 'SUB-802',
    customerName: 'Amit Shah',
    customerEmail: 'amit.shah@yahoo.com',
    customerPhone: '+91 99798 54321',
    plan: 'Weekly Jain Special Plan',
    frequency: 'Weekly',
    deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    mealType: 'Lunch & Dinner',
    pricePerMeal: 140,
    amount: 1800,
    startDate: '05 Aug 2026',
    endDate: '25 Aug 2026',
    nextDeliveryDate: '19 Aug 2026',
    address: '12 Shrinand Nagar, Vejalpur, Ahmedabad',
    paymentStatus: 'PAID',
    status: 'ACTIVE'
  },
  {
    subId: 'SUB-803',
    customerName: 'Neha Patel',
    customerEmail: 'neha.patel@outlook.com',
    customerPhone: '+91 94260 98765',
    plan: 'Monthly Executive Tiffin',
    frequency: 'Monthly',
    deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    mealType: 'Lunch',
    pricePerMeal: 150,
    amount: 2900,
    startDate: '01 Aug 2026',
    endDate: '31 Aug 2026',
    nextDeliveryDate: '20 Aug 2026',
    address: '701 Iscon Elegance, Prahlad Nagar, Ahmedabad',
    paymentStatus: 'PAID',
    status: 'PAUSED'
  },
  {
    subId: 'SUB-804',
    customerName: 'Vikram Mehta',
    customerEmail: 'vikram.mehta@gmail.com',
    customerPhone: '+91 98980 11223',
    plan: 'Kathiyawadi Meal Subscription',
    frequency: 'Daily',
    deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    mealType: 'Dinner',
    pricePerMeal: 130,
    amount: 3400,
    startDate: '10 Aug 2026',
    endDate: '22 Aug 2026',
    nextDeliveryDate: '18 Aug 2026',
    address: '105 Bodakdev Heights, Satellite, Ahmedabad',
    paymentStatus: 'PAID',
    status: 'ACTIVE'
  }
];

// @desc    Get provider-specific subscriptions with pagination, search, filters & summary metrics
// @route   GET /api/subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const {
      providerId = 'prov_1',
      search = '',
      status = 'All',
      plan = 'All',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    let subList = [];

    if (await isDbConnected()) {
      subList = await Subscription.find({ providerId }).sort({ createdAt: -1 });

      if (subList.length === 0) {
        for (const s of initialSeedSubscriptions) {
          await Subscription.updateOne(
            { subId: s.subId },
            { $set: { ...s, providerId } },
            { upsert: true }
          );
        }
        subList = await Subscription.find({ providerId }).sort({ createdAt: -1 });
      }
    } else {
      subList = initialSeedSubscriptions.map((s, idx) => ({ _id: `sub_${idx}`, ...s, providerId }));
    }

    // Apply Filters
    let filtered = subList.filter(s => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.subId && s.subId.toLowerCase().includes(q)) ||
        (s.plan && s.plan.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.toLowerCase().includes(q));

      let matchesStatus = true;
      if (status === 'ACTIVE') matchesStatus = s.status === 'ACTIVE';
      else if (status === 'PAUSED') matchesStatus = s.status === 'PAUSED';
      else if (status === 'CANCELLED') matchesStatus = s.status === 'CANCELLED';
      else if (status === 'EXPIRING_SOON') {
        const endD = new Date(s.endDate);
        const now = new Date();
        const diffDays = Math.ceil((endD - now) / (1000 * 60 * 60 * 24));
        matchesStatus = diffDays >= 0 && diffDays <= 7;
      }

      let matchesPlan = true;
      if (plan !== 'All') {
        matchesPlan = s.plan.toLowerCase().includes(plan.toLowerCase());
      }

      return matchesSearch && matchesStatus && matchesPlan;
    });

    // Compute Summary Metrics across full dataset
    const activeCount = subList.filter(s => s.status === 'ACTIVE').length;
    const pausedCount = subList.filter(s => s.status === 'PAUSED').length;

    const now = new Date();
    const expiringSoonCount = subList.filter(s => {
      if (!s.endDate) return false;
      const endD = new Date(s.endDate);
      const diffDays = Math.ceil((endD - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    const monthlyRevenue = subList
      .filter(s => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + (s.amount || 3200), 0);

    // Apply Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedSubs = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: {
        metrics: {
          activeCount,
          expiringSoonCount,
          pausedCount,
          monthlyRevenue
        },
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages
        },
        subscriptions: paginatedSubs
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create new Subscription
// @route   POST /api/subscriptions
const createSubscription = async (req, res) => {
  try {
    const {
      providerId = 'prov_1',
      customerName,
      customerPhone,
      customerEmail,
      plan,
      frequency = 'Daily',
      deliveryDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      mealType = 'Lunch',
      amount = 3200,
      startDate,
      endDate,
      address,
      paymentStatus = 'PAID'
    } = req.body;

    if (!customerName || !plan) {
      return res.status(400).json({ success: false, message: 'Customer name and tiffin plan are required' });
    }

    const subIdNum = Math.floor(800 + Math.random() * 200);
    const calculatedNextDelivery = calculateNextDeliveryDate(deliveryDays);

    const subData = {
      providerId,
      subId: `SUB-${subIdNum}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone || '+91 98250 12345',
      customerEmail: customerEmail || '',
      plan: plan.trim(),
      frequency,
      deliveryDays,
      mealType,
      amount: Number(amount) || 3200,
      startDate: startDate || '01 Aug 2026',
      endDate: endDate || '31 Aug 2026',
      nextDeliveryDate: calculatedNextDelivery,
      address: address || 'Ahmedabad',
      paymentStatus,
      status: 'ACTIVE',
      createdAt: new Date()
    };

    if (await isDbConnected()) {
      const newSub = new Subscription(subData);
      await newSub.save();
      return res.status(201).json({ success: true, message: '✓ Subscription created successfully', data: newSub });
    }

    return res.status(201).json({ success: true, message: '✓ Subscription created', data: { _id: 'sub_' + Date.now(), ...subData } });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to create subscription: ' + error.message });
  }
};

// @desc    Update Subscription Status (Pause, Resume, Cancel) or Details
// @route   PUT /api/subscriptions/:id
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    // Handle status transitions
    if (updateData.status === 'PAUSED') {
      updateData.pausedAt = new Date();
    } else if (updateData.status === 'ACTIVE') {
      updateData.resumedAt = new Date();
      // Recalculate dynamic next delivery date upon resume
      updateData.nextDeliveryDate = calculateNextDeliveryDate(updateData.deliveryDays);
    } else if (updateData.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    if (await isDbConnected()) {
      const updated = await Subscription.findByIdAndUpdate(id, updateData, { new: true });
      return res.json({ success: true, message: `✓ Subscription status updated to ${updateData.status || 'updated'}`, data: updated });
    }

    return res.json({ success: true, message: '✓ Subscription updated', data: updateData });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to update subscription' });
  }
};

// @desc    Delete Subscription
// @route   DELETE /api/subscriptions/:id
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    if (await isDbConnected()) {
      await Subscription.findByIdAndDelete(id);
      return res.json({ success: true, message: '✓ Subscription deleted successfully' });
    }
    return res.json({ success: true, message: '✓ Subscription deleted' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subscription' });
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription
};
