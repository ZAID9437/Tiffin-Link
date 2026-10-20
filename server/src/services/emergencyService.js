const EmergencyRequest = require('../models/EmergencyRequest');
const MealRequest = require('../models/MealRequest');
const Provider = require('../models/Provider');
const SmartQueue = require('../models/SmartQueue');
const { evaluateMatchingForRequest } = require('./matchingService');
const { getIO } = require('./socketService');

// Create and process an emergency meal request
const createEmergencyMealRequest = async ({
  customerName,
  customerPhone,
  customerEmail,
  customerId,
  mealType,
  category,
  budget,
  quantity,
  deliveryLocation,
  targetDeliveryMinutes = 30,
  severityReason = 'immediate_hunger',
  specialNote = ''
}) => {
  const now = new Date();
  const deadlineAt = new Date(now.getTime() + targetDeliveryMinutes * 60 * 1000);
  const emergencyId = `EMERG-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Create underlying MealRequest marked with emergency urgency
  const mealReq = new MealRequest({
    customerName: customerName || 'Emergency Diner',
    customerPhone: customerPhone || '+91 98765 43210',
    customerEmail: customerEmail || '',
    customerId: customerId || null,
    mealType: mealType || 'Quick Hot Homestyle Meal',
    category: category || 'Gujarati',
    budget: Number(budget) || 150,
    quantity: Number(quantity) || 1,
    location: deliveryLocation || 'Satellite, Ahmedabad',
    customerAddress: deliveryLocation || 'Satellite, Ahmedabad',
    isUrgent: true,
    urgencyLevel: 'emergency',
    matchingStatus: 'evaluating',
    specialInstructions: `[EMERGENCY SLA: ${targetDeliveryMinutes} MINS] ${specialNote}`,
    expiresAt: deadlineAt
  });
  await mealReq.save();

  // 2. Create EmergencyRequest record
  const emergencyDoc = new EmergencyRequest({
    emergencyId,
    mealRequestId: mealReq._id,
    customerId: customerId || '',
    customerName: mealReq.customerName,
    customerPhone: mealReq.customerPhone,
    targetDeliveryMinutes,
    deadlineAt,
    severityReason,
    specialNote,
    urgencySurcharge: 30, // 30 Rs express surcharge
    status: 'evaluating'
  });
  await emergencyDoc.save();

  // 3. Fast provider screening (within 5km and active)
  const matchingResult = await evaluateMatchingForRequest(mealReq._id, {
    maxRadiusKm: 5.5,
    minScore: 40,
    maxMatches: 5
  });

  if (!matchingResult.matchesCount || matchingResult.matchesCount === 0) {
    emergencyDoc.status = 'unfulfillable';
    await emergencyDoc.save();

    mealReq.matchingStatus = 'no_match';
    await mealReq.save();

    return {
      success: false,
      isFulfillable: false,
      emergencyId,
      message: 'No active express kitchens currently available within 5km for a 30-minute delivery window. Please consider standard dispatch.'
    };
  }

  // 4. Update emergency record with notified providers count
  emergencyDoc.status = 'broadcasted';
  emergencyDoc.notifiedProvidersCount = matchingResult.matchesCount;
  await emergencyDoc.save();

  // 5. Emit high-priority emergency alert via Socket.IO
  try {
    const io = getIO();
    if (io) {
      io.emit('emergency:request_broadcast', {
        emergencyId,
        requestId: mealReq._id,
        mealType: mealReq.mealType,
        deliveryLocation: mealReq.location,
        targetDeliveryMinutes,
        deadlineAt,
        urgencySurcharge: 30,
        severityReason
      });
    }
  } catch (sErr) {}

  return {
    success: true,
    isFulfillable: true,
    emergencyId,
    requestId: mealReq._id,
    deadlineAt,
    notifiedProvidersCount: matchingResult.matchesCount,
    message: `Emergency request broadcasted to ${matchingResult.matchesCount} express home kitchens!`
  };
};

module.exports = {
  createEmergencyMealRequest
};
