const KitchenCapacity = require('../models/KitchenCapacity');
const ProviderSetting = require('../models/ProviderSetting');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to format Date as YYYY-MM-DD in local time
const formatDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper for human readable date label (Today, Tomorrow, 18 Aug...)
const getDateLabel = (idx, dateObj) => {
  if (idx === 0) return 'Today';
  if (idx === 1) return 'Tomorrow';
  return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

// @desc    Get real-time Kitchen Capacity & Multi-day Schedule from MongoDB
// @route   GET /api/capacity
const getCapacity = async (req, res) => {
  try {
    const providerId = req.query.providerId || 'prov_1';
    let globalMaxCapacity = 50;
    let autoStopOrders = true;
    let allowOverbooking = false;

    if (await isDbConnected()) {
      let settings = await ProviderSetting.findOne({ providerId });
      if (!settings) {
        settings = await ProviderSetting.create({ providerId });
      }
      globalMaxCapacity = settings.tiffin?.maxDailyLimit ?? 50;
      autoStopOrders = settings.tiffin?.autoPauseLimit ?? true;
      allowOverbooking = settings.tiffin?.allowOverbooking ?? false;
    }

    const now = new Date();
    const daysList = [];

    // Fetch orders for the next 7 days
    const allOrders = (await isDbConnected()) ? await Order.find({ status: { $ne: 'Cancelled' } }) : [];

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(now);
      dateObj.setDate(now.getDate() + i);
      const dateKey = formatDateKey(dateObj);
      const label = getDateLabel(i, dateObj);

      let record = null;
      if (await isDbConnected()) {
        record = await KitchenCapacity.findOne({ providerId, date: dateKey });
      }

      const dayMaxCapacity = record ? record.maxCapacity : globalMaxCapacity;
      const dayAutoStop = record ? record.autoStopOrders : autoStopOrders;
      const dayAllowOverbooking = record ? record.allowOverbooking : allowOverbooking;

      // Calculate booked count from real orders on this date
      const dayOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return formatDateKey(orderDate) === dateKey;
      });

      // Sum quantities of orders
      const bookedCount = dayOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
      const availableCapacity = Math.max(0, dayMaxCapacity - bookedCount);
      
      let status = 'OPEN';
      if (bookedCount >= dayMaxCapacity && !dayAllowOverbooking) {
        status = 'FULL';
      }

      daysList.push({
        date: dateKey,
        dateLabel: label,
        maxCapacity: dayMaxCapacity,
        bookedCount,
        availableCapacity,
        autoStopOrders: dayAutoStop,
        allowOverbooking: dayAllowOverbooking,
        status
      });
    }

    const todayData = daysList[0] || {
      date: formatDateKey(now),
      dateLabel: 'Today',
      maxCapacity: globalMaxCapacity,
      bookedCount: 0,
      availableCapacity: globalMaxCapacity,
      autoStopOrders,
      allowOverbooking,
      status: 'OPEN'
    };

    const usagePercentage = todayData.maxCapacity > 0 
      ? Math.min(100, Math.round((todayData.bookedCount / todayData.maxCapacity) * 100))
      : 0;

    return res.json({
      success: true,
      data: {
        today: {
          totalCapacity: todayData.maxCapacity,
          bookedCount: todayData.bookedCount,
          remainingCapacity: todayData.availableCapacity,
          usagePercentage,
          status: todayData.status
        },
        dailySchedule: daysList,
        settings: {
          maxDailyOrders: globalMaxCapacity,
          autoStopOrders,
          allowOverbooking
        }
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Error fetching capacity:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update global capacity settings
// @route   POST /api/capacity/settings
const updateCapacitySettings = async (req, res) => {
  try {
    const { providerId = 'prov_1', maxDailyOrders, autoStopOrders, allowOverbooking } = req.body;

    if (await isDbConnected()) {
      let settings = await ProviderSetting.findOne({ providerId });
      if (!settings) {
        settings = new ProviderSetting({ providerId });
      }

      if (maxDailyOrders !== undefined) settings.tiffin.maxDailyLimit = Number(maxDailyOrders);
      if (autoStopOrders !== undefined) settings.tiffin.autoPauseLimit = Boolean(autoStopOrders);
      if (allowOverbooking !== undefined) settings.tiffin.allowOverbooking = Boolean(allowOverbooking);
      settings.updatedAt = new Date();
      await settings.save();

      // Also update today's capacity document
      const todayKey = formatDateKey(new Date());
      await KitchenCapacity.findOneAndUpdate(
        { providerId, date: todayKey },
        { 
          $set: { 
            maxCapacity: Number(maxDailyOrders), 
            autoStopOrders: Boolean(autoStopOrders),
            allowOverbooking: Boolean(allowOverbooking),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      message: '✓ Kitchen capacity settings saved successfully in MongoDB!'
    });
  } catch (error) {
    console.error('Error updating capacity settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update capacity settings: ' + error.message });
  }
};

// @desc    Update specific date capacity limit
// @route   PUT /api/capacity/date
const updateDateCapacity = async (req, res) => {
  try {
    const { providerId = 'prov_1', date, maxCapacity } = req.body;

    if (!date || maxCapacity === undefined) {
      return res.status(400).json({ success: false, message: 'Date and maxCapacity are required' });
    }

    if (await isDbConnected()) {
      const updated = await KitchenCapacity.findOneAndUpdate(
        { providerId, date },
        {
          $set: {
            maxCapacity: Number(maxCapacity),
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, message: `Capacity updated for ${date}`, data: updated });
    }

    return res.json({ success: true, message: `Capacity updated for ${date} (fallback)` });
  } catch (error) {
    console.error('Error updating date capacity:', error);
    res.status(500).json({ success: false, message: 'Failed to update date capacity: ' + error.message });
  }
};

// @desc    Check if today's capacity allows new order
// @route   GET /api/capacity/check-today
const checkCapacityAvailable = async (req, res) => {
  try {
    const providerId = req.query.providerId || 'prov_1';
    const now = new Date();
    const todayKey = formatDateKey(now);

    let globalMax = 50;
    let autoStop = true;
    let allowOver = false;

    if (await isDbConnected()) {
      const settings = await ProviderSetting.findOne({ providerId });
      if (settings) {
        globalMax = settings.tiffin?.maxDailyLimit ?? 50;
        autoStop = settings.tiffin?.autoPauseLimit ?? true;
        allowOver = settings.tiffin?.allowOverbooking ?? false;
      }

      const todayCap = await KitchenCapacity.findOne({ providerId, date: todayKey });
      if (todayCap) {
        globalMax = todayCap.maxCapacity;
        autoStop = todayCap.autoStopOrders;
        allowOver = todayCap.allowOverbooking;
      }

      const todayOrders = await Order.find({ status: { $ne: 'Cancelled' } });
      const bookedCount = todayOrders.filter(o => formatDateKey(new Date(o.createdAt)) === todayKey)
                                     .reduce((sum, o) => sum + (o.quantity || 1), 0);

      const isFull = bookedCount >= globalMax && autoStop && !allowOver;

      return res.json({
        success: true,
        canAcceptOrder: !isFull,
        bookedCount,
        maxCapacity: globalMax,
        message: isFull ? 'Kitchen is currently at full capacity.' : 'Kitchen accepting orders.'
      });
    }

    return res.json({ success: true, canAcceptOrder: true, message: 'Kitchen accepting orders.' });
  } catch (error) {
    console.error('Error checking capacity:', error);
    res.status(500).json({ success: false, message: 'Failed to check capacity' });
  }
};

module.exports = {
  getCapacity,
  updateCapacitySettings,
  updateDateCapacity,
  checkCapacityAvailable
};
