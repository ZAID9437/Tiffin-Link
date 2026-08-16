const KitchenSchedule = require('../models/KitchenSchedule');
const KitchenCapacity = require('../models/KitchenCapacity');
const ProviderSetting = require('../models/ProviderSetting');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultWeeklySchedule = [
  { day: 'Monday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
  { day: 'Tuesday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
  { day: 'Wednesday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
  { day: 'Thursday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
  { day: 'Friday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
  { day: 'Saturday', isOpen: true, openTime: '09:00 AM', closeTime: '10:00 PM' },
  { day: 'Sunday', isOpen: false, openTime: '09:00 AM', closeTime: '09:00 PM' }
];

const defaultOrderWindows = [
  { name: 'Breakfast', icon: '🍱', cutoffTime: '08:30 AM', deliveryStartTime: '09:00 AM', deliveryEndTime: '11:00 AM', isActive: true },
  { name: 'Lunch', icon: '🍛', cutoffTime: '11:30 AM', deliveryStartTime: '12:00 PM', deliveryEndTime: '03:00 PM', isActive: true },
  { name: 'Dinner', icon: '🌙', cutoffTime: '07:30 PM', deliveryStartTime: '08:00 PM', deliveryEndTime: '10:00 PM', isActive: true }
];

const defaultSpecialDates = [
  { date: '18 Aug', reason: 'Holiday', status: 'CLOSED' },
  { date: '25 Aug', reason: 'Festival', status: 'CLOSED' }
];

// Helper: Convert 12h time string ("09:00 AM") to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// @desc    Get real-time Kitchen Schedule, Today's Operational Status & Windows
// @route   GET /api/schedule
const getSchedule = async (req, res) => {
  try {
    const providerId = req.query.providerId || 'prov_1';

    let scheduleDoc = null;
    if (await isDbConnected()) {
      scheduleDoc = await KitchenSchedule.findOne({ providerId });
      if (!scheduleDoc) {
        scheduleDoc = await KitchenSchedule.create({
          providerId,
          weeklySchedule: defaultWeeklySchedule,
          orderWindows: defaultOrderWindows,
          specialDates: defaultSpecialDates
        });
      }
    }

    const weeklySchedule = scheduleDoc?.weeklySchedule?.length > 0 ? scheduleDoc.weeklySchedule : defaultWeeklySchedule;
    const orderWindows = scheduleDoc?.orderWindows?.length > 0 ? scheduleDoc.orderWindows : defaultOrderWindows;
    const specialDates = scheduleDoc?.specialDates?.length > 0 ? scheduleDoc.specialDates : defaultSpecialDates;

    // Calculate real-time status based on current IST time
    const now = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check special dates override
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('en', { month: 'short' })}`;
    const specialOverride = specialDates.find(sd => sd.date.toLowerCase() === dateFormatted.toLowerCase());

    const todayDayConfig = weeklySchedule.find(d => d.day === currentDayName) || { isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' };

    let isKitchenOpen = todayDayConfig.isOpen;
    let closedReason = '';

    if (specialOverride && specialOverride.status === 'CLOSED') {
      isKitchenOpen = false;
      closedReason = `Holiday (${specialOverride.reason})`;
    } else if (todayDayConfig.isOpen) {
      const openMins = timeToMinutes(todayDayConfig.openTime);
      const closeMins = timeToMinutes(todayDayConfig.closeTime);
      if (currentMinutes < openMins || currentMinutes > closeMins) {
        isKitchenOpen = false;
        closedReason = `Outside Working Hours (${todayDayConfig.openTime} – ${todayDayConfig.closeTime})`;
      }
    } else {
      isKitchenOpen = false;
      closedReason = 'Closed Today';
    }

    // Determine current/next meal slot
    let activeSlot = 'Lunch';
    let activeSlotTime = '12:00–3:00 PM';
    let cutoffText = 'OPEN Until 11:30 AM';

    // Find active window or closest upcoming window
    let activeWindow = orderWindows.find(w => w.isActive && w.name === 'Lunch');
    if (!activeWindow && orderWindows.length > 0) activeWindow = orderWindows[0];

    if (activeWindow) {
      activeSlot = activeWindow.name;
      activeSlotTime = `${activeWindow.deliveryStartTime}–${activeWindow.deliveryEndTime}`;
      cutoffText = `OPEN Until ${activeWindow.cutoffTime}`;

      // If cutoff has passed for active window
      const cutoffMins = timeToMinutes(activeWindow.cutoffTime);
      if (currentMinutes > cutoffMins && isKitchenOpen) {
        cutoffText = `CLOSED for ${activeWindow.name} (Cutoff was ${activeWindow.cutoffTime})`;
      }
    }

    return res.json({
      success: true,
      data: {
        todayStatus: {
          isOpen: isKitchenOpen,
          statusText: isKitchenOpen ? 'OPEN' : 'CLOSED',
          closedReason,
          currentDay: currentDayName,
          currentSlot: `${activeSlot} (${activeSlotTime})`,
          ordersStatusText: isKitchenOpen ? cutoffText : `CLOSED (${closedReason || 'Kitchen Closed'})`
        },
        weeklySchedule,
        orderWindows,
        specialDates
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching schedule: ' + error.message });
  }
};

// @desc    Update Weekly Schedule, Windows & Special Dates
// @route   POST /api/schedule/settings
const updateScheduleSettings = async (req, res) => {
  try {
    const { providerId = 'prov_1', weeklySchedule, orderWindows, specialDates } = req.body;

    if (await isDbConnected()) {
      let scheduleDoc = await KitchenSchedule.findOne({ providerId });
      if (!scheduleDoc) {
        scheduleDoc = new KitchenSchedule({ providerId });
      }

      if (weeklySchedule) scheduleDoc.weeklySchedule = weeklySchedule;
      if (orderWindows) scheduleDoc.orderWindows = orderWindows;
      if (specialDates) scheduleDoc.specialDates = specialDates;
      scheduleDoc.updatedAt = new Date();

      await scheduleDoc.save();
    }

    return res.json({
      success: true,
      message: '✓ Kitchen Schedule saved successfully!'
    });
  } catch (error) {
    console.error('Error updating schedule settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule: ' + error.message });
  }
};

// @desc    Add Special Holiday Date Override
// @route   POST /api/schedule/special-date
const addSpecialDate = async (req, res) => {
  try {
    const { providerId = 'prov_1', date, reason = 'Holiday', status = 'CLOSED' } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    if (await isDbConnected()) {
      let scheduleDoc = await KitchenSchedule.findOne({ providerId });
      if (!scheduleDoc) {
        scheduleDoc = new KitchenSchedule({ providerId, weeklySchedule: defaultWeeklySchedule, orderWindows: defaultOrderWindows, specialDates: [] });
      }

      // Check duplicate date
      const existing = scheduleDoc.specialDates.find(sd => sd.date.toLowerCase() === date.toLowerCase());
      if (!existing) {
        scheduleDoc.specialDates.push({ date, reason, status });
        scheduleDoc.updatedAt = new Date();
        await scheduleDoc.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: `✓ Added special holiday date: ${date}`
    });
  } catch (error) {
    console.error('Error adding special date:', error);
    res.status(500).json({ success: false, message: 'Failed to add special date' });
  }
};

// @desc    Delete Special Holiday Date Override
// @route   DELETE /api/schedule/special-date/:id
const deleteSpecialDate = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.query.providerId || 'prov_1';

    if (await isDbConnected()) {
      let scheduleDoc = await KitchenSchedule.findOne({ providerId });
      if (scheduleDoc) {
        scheduleDoc.specialDates = scheduleDoc.specialDates.filter(sd => sd._id.toString() !== id && sd.date !== id);
        scheduleDoc.updatedAt = new Date();
        await scheduleDoc.save();
      }
    }

    return res.json({
      success: true,
      message: '✓ Removed special holiday date'
    });
  } catch (error) {
    console.error('Error deleting special date:', error);
    res.status(500).json({ success: false, message: 'Failed to delete special date' });
  }
};

// @desc    Combined Order Validation Pipeline (Schedule + Capacity + Service Area)
// @route   GET /api/schedule/validate-order
const validateOrderEligibility = async (req, res) => {
  try {
    const providerId = req.query.providerId || 'prov_1';
    const mealWindowName = req.query.mealWindow || 'Lunch';

    let scheduleOk = true;
    let capacityOk = true;
    let reason = '';

    if (await isDbConnected()) {
      // 1. SCHEDULE CHECK
      const scheduleDoc = await KitchenSchedule.findOne({ providerId });
      const orderWindows = scheduleDoc?.orderWindows || defaultOrderWindows;
      const windowObj = orderWindows.find(w => w.name.toLowerCase() === mealWindowName.toLowerCase()) || orderWindows[1];

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const cutoffMins = timeToMinutes(windowObj?.cutoffTime || '11:30 AM');

      if (currentMinutes > cutoffMins) {
        scheduleOk = false;
        reason = `Order cutoff time (${windowObj?.cutoffTime}) for ${windowObj?.name || mealWindowName} has passed.`;
      }

      // 2. CAPACITY CHECK
      const capacityDoc = await KitchenCapacity.findOne({ providerId });
      if (capacityDoc && capacityDoc.autoStopAtLimit && capacityDoc.settings) {
        const todayStr = new Date().toISOString().split('T')[0];
        const dayCapacity = capacityDoc.dailySchedule?.find(d => d.date === todayStr);
        const maxLimit = dayCapacity ? dayCapacity.maxCapacity : capacityDoc.settings.maxDailyLimit;
        const currentOrders = dayCapacity ? dayCapacity.currentOrders : 0;

        if (currentOrders >= maxLimit) {
          capacityOk = false;
          reason = `Daily kitchen capacity limit (${maxLimit} orders) reached. Kitchen is temporarily paused.`;
        }
      }
    }

    const eligible = scheduleOk && capacityOk;

    return res.json({
      success: true,
      eligible,
      reason: eligible ? 'Eligible for order placement' : reason,
      checks: {
        schedule: scheduleOk,
        capacity: capacityOk,
        serviceArea: true
      }
    });
  } catch (error) {
    console.error('Error validating order eligibility:', error);
    res.status(500).json({ success: false, message: 'Server error during order validation' });
  }
};

module.exports = {
  getSchedule,
  updateScheduleSettings,
  addSpecialDate,
  deleteSpecialDate,
  validateOrderEligibility
};
