const SmartQueue = require('../models/SmartQueue');
const Order = require('../models/Order');
const { getIO } = require('./socketService');

// Recompute dynamic priority score for a queue item
const calculateDynamicPriority = (item) => {
  const now = Date.now();
  const baseUrgency = (item.isUrgent || item.urgencyLevel === 'emergency') ? 100 : 40;

  let timeUntilTargetMinutes = 30;
  if (item.targetReadyTime) {
    timeUntilTargetMinutes = Math.floor((new Date(item.targetReadyTime).getTime() - now) / (60 * 1000));
  }

  const ageMinutes = Math.floor((now - new Date(item.createdAt).getTime()) / (60 * 1000));

  const deadlineBonus = Math.max(0, 30 - timeUntilTargetMinutes);
  const agingBonus = Math.min(20, ageMinutes * 2);

  return Math.min(150, baseUrgency + deadlineBonus + agingBonus);
};

// Get provider preparation queue sorted by priority score
const getProviderPreparationQueue = async (providerId) => {
  const items = await SmartQueue.find({
    queueType: 'provider_prep',
    providerId: String(providerId),
    status: { $in: ['queued', 'preparing', 'ready_for_pickup'] }
  }).sort({ priorityScore: -1, createdAt: 1 });

  // Update dynamic scores in memory
  const scoredItems = items.map(it => {
    const freshScore = calculateDynamicPriority(it);
    const obj = it.toObject();
    obj.priorityScore = freshScore;
    return obj;
  });

  scoredItems.sort((a, b) => b.priorityScore - a.priorityScore);
  return scoredItems;
};

// Update status in provider preparation queue
const updatePreparationQueueStatus = async ({ orderId, status, providerId }) => {
  const validTransitions = ['queued', 'preparing', 'ready_for_pickup', 'completed', 'cancelled'];
  if (!validTransitions.includes(status)) {
    throw new Error('Invalid queue status transition');
  }

  const updateFields = { status };
  if (status === 'preparing') {
    updateFields.actualStartTime = new Date();
  } else if (status === 'ready_for_pickup') {
    updateFields.actualReadyTime = new Date();
  }

  const item = await SmartQueue.findOneAndUpdate(
    { orderId, providerId: String(providerId) },
    { $set: updateFields },
    { new: true }
  );

  if (!item) {
    throw new Error('Queue item not found for this provider');
  }

  // Synchronize Order status
  const orderStatusMap = {
    preparing: 'PREPARING',
    ready_for_pickup: 'READY_FOR_PICKUP',
    completed: 'DELIVERED',
    cancelled: 'CANCELLED'
  };

  if (orderStatusMap[status]) {
    await Order.findOneAndUpdate(
      { orderId },
      { status: orderStatusMap[status] }
    );
  }

  // When food is ready for pickup, ensure it's in the delivery dispatch queue
  if (status === 'ready_for_pickup') {
    await SmartQueue.findOneAndUpdate(
      { orderId, queueType: 'delivery_dispatch' },
      {
        providerId: item.providerId,
        providerName: item.providerName,
        customerName: item.customerName,
        customerAddress: item.customerAddress,
        mealTitle: item.mealTitle,
        quantity: item.quantity,
        isUrgent: item.isUrgent,
        urgencyLevel: item.urgencyLevel,
        priorityScore: item.priorityScore + 10,
        status: 'ready_for_pickup',
        targetDeliveryTime: item.targetDeliveryTime || new Date(Date.now() + 25 * 60 * 1000)
      },
      { upsert: true, new: true }
    );
  }

  // Emit real-time Socket.IO event
  try {
    const io = getIO();
    if (io) {
      io.emit('queue:status_changed', {
        orderId,
        status,
        providerId,
        actualReadyTime: updateFields.actualReadyTime
      });
    }
  } catch (sErr) {}

  return item;
};

// Get available delivery dispatch queue for drivers
const getAvailableDeliveryQueue = async () => {
  const items = await SmartQueue.find({
    queueType: 'delivery_dispatch',
    status: { $in: ['ready_for_pickup', 'driver_assigned'] }
  }).sort({ priorityScore: -1, createdAt: 1 });

  return items;
};

// Atomic delivery assignment claim by driver
const claimDeliveryQueueItem = async ({ orderId, driverId, driverName }) => {
  const item = await SmartQueue.findOneAndUpdate(
    {
      orderId,
      queueType: 'delivery_dispatch',
      status: 'ready_for_pickup',
      driverId: null
    },
    {
      $set: {
        driverId: String(driverId),
        status: 'driver_assigned',
        claimedAt: new Date()
      }
    },
    { new: true }
  );

  if (!item) {
    throw new Error('This delivery has already been claimed by another driver or is not ready for pickup.');
  }

  // Update Order
  await Order.findOneAndUpdate(
    { orderId },
    {
      driverId: String(driverId),
      status: 'DRIVER_ASSIGNED',
      deliveryStatus: 'Assigned'
    }
  );

  // Emit event
  try {
    const io = getIO();
    if (io) {
      io.emit('queue:delivery_claimed', {
        orderId,
        driverId,
        driverName
      });
    }
  } catch (sErr) {}

  return item;
};

module.exports = {
  calculateDynamicPriority,
  getProviderPreparationQueue,
  updatePreparationQueueStatus,
  getAvailableDeliveryQueue,
  claimDeliveryQueueItem
};
