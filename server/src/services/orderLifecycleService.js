const mongoose = require('mongoose');
const Order = require('../models/Order');
const DeliveryRequest = require('../models/DeliveryRequest');
const Provider = require('../models/Provider');
const AuditLog = require('../models/AuditLog');
const { getIO, emitToProvider, emitToCustomer, emitToDriver } = require('./socketService');

/**
 * CANONICAL ORDER LIFECYCLE SERVICE
 * Enforces atomic state transitions, audit logging, timestamps, and real-time socket events.
 */

// Canonical statuses
const ORDER_STATUS = {
  NEW: 'New',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERY: 'Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const DELIVERY_STATUS = {
  UNASSIGNED: 'Unassigned',
  SEARCHING: 'Searching',
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  ARRIVED_CUSTOMER: 'Arrived at Customer',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

// Valid forward transitions map
const ALLOWED_STATUS_TRANSITIONS = {
  'new': ['preparing', 'accepted', 'cancelled', 'rejected'],
  'pending': ['preparing', 'accepted', 'cancelled', 'rejected'],
  'confirmed': ['preparing', 'accepted', 'cancelled', 'rejected'],
  'accepted': ['preparing', 'ready', 'cancelled'],
  'preparing': ['ready', 'delivery', 'cancelled'],
  'in prep': ['ready', 'delivery', 'cancelled'],
  'ready': ['delivery', 'cancelled'],
  'ready_for_pickup': ['delivery', 'cancelled'],
  'delivery': ['delivery', 'out for delivery', 'completed'],
  'dispatched': ['out for delivery', 'completed'],
  'in transit': ['out for delivery', 'completed'],
  'out for delivery': ['completed'],
  'picked up': ['out for delivery', 'completed'],
  'arrived at customer': ['completed'],
  'completed': [],
  'delivered': [],
  'cancelled': [],
  'rejected': []
};

/**
 * Helper to build flexible order lookup query matching _id or orderId formats
 */
const buildOrderLookupQuery = (id, providerId = null) => {
  const queryList = [];
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    queryList.push({ _id: id });
  }
  if (id) {
    const cleanId = String(id).replace(/^#+/, '').trim();
    queryList.push({ orderId: id });
    queryList.push({ orderId: `#${cleanId}` });
    queryList.push({ orderId: `#ORD-${cleanId}` });
    queryList.push({ orderId: `TL-${cleanId}` });
    queryList.push({ orderId: cleanId });
  }

  const findFilter = queryList.length > 0 ? { $or: queryList } : {};
  if (providerId) {
    return { providerId: String(providerId), ...findFilter };
  }
  return findFilter;
};

/**
 * Perform an atomic order status transition with validation
 */
const transitionOrderStatus = async ({
  orderId,
  targetStatus,
  actorRole,
  actorId,
  actorName,
  reason = '',
  extraUpdates = {}
}) => {
  const query = buildOrderLookupQuery(orderId, actorRole === 'provider' ? actorId : null);
  const existingOrder = await Order.findOne(query);

  if (!existingOrder) {
    return {
      success: false,
      statusCode: 404,
      message: 'Order not found or unauthorized.'
    };
  }

  const currentStatusNorm = String(existingOrder.status || '').toLowerCase().trim();
  const targetStatusNorm = String(targetStatus || '').toLowerCase().trim();

  // 1. Idempotency Check: Already in target status?
  if (currentStatusNorm === targetStatusNorm) {
    return {
      success: true,
      idempotent: true,
      message: `Order ${existingOrder.orderId} is already in ${existingOrder.status} state.`,
      order: existingOrder
    };
  }

  // 2. Validate transition
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatusNorm] || [];
  if (!allowedNext.includes(targetStatusNorm)) {
    return {
      success: false,
      statusCode: 400,
      message: `Invalid state transition: Cannot change order from "${existingOrder.status}" to "${targetStatus}".`
    };
  }

  // 3. Prepare field updates and timestamps
  const updates = {
    status: targetStatus,
    updatedAt: new Date(),
    ...extraUpdates
  };

  const now = new Date();
  if (targetStatusNorm === 'preparing' || targetStatusNorm === 'accepted') {
    updates.status = 'Preparing';
    if (!existingOrder.acceptedAt) updates.acceptedAt = now;
    if (actorId) updates.acceptedBy = actorId;
  } else if (targetStatusNorm === 'ready') {
    updates.status = 'Ready';
    if (!existingOrder.readyAt) updates.readyAt = now;
  } else if (targetStatusNorm === 'delivery') {
    updates.status = 'Delivery';
    if (!existingOrder.deliveryRequestedAt) updates.deliveryRequestedAt = now;
    if (!existingOrder.deliveryStatus || existingOrder.deliveryStatus === 'Unassigned') {
      updates.deliveryStatus = 'Searching';
    }
  } else if (targetStatusNorm === 'completed' || targetStatusNorm === 'delivered') {
    updates.status = 'Completed';
    updates.deliveryStatus = 'Delivered';
    if (!existingOrder.completedAt) updates.completedAt = now;
    if (!existingOrder.deliveredAt) updates.deliveredAt = now;
  } else if (targetStatusNorm === 'cancelled' || targetStatusNorm === 'rejected') {
    updates.status = 'Cancelled';
    updates.cancelledAt = now;
    updates.cancelledBy = actorName || actorRole || 'User';
    if (reason) updates.cancellationReason = reason;
  }

  // 4. Atomic Database Update
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: existingOrder._id },
    { $set: updates },
    { new: true }
  );

  if (!updatedOrder) {
    return {
      success: false,
      statusCode: 409,
      message: 'Failed to update order state. Order may have been modified concurrently.'
    };
  }

  // 5. Audit Logging
  try {
    await AuditLog.create({
      action: `ORDER_${targetStatusNorm.toUpperCase()}`,
      entityType: 'Order',
      entityId: String(updatedOrder._id),
      performedBy: actorName || `${actorRole} (${actorId || 'system'})`,
      details: `Order ${updatedOrder.orderId} transitioned from ${existingOrder.status} to ${updatedOrder.status}. ${reason || ''}`.trim()
    });
  } catch (aErr) {}

  // 6. Real-Time Socket Broadcast
  try {
    const payload = {
      orderId: updatedOrder.orderId,
      status: updatedOrder.status,
      deliveryStatus: updatedOrder.deliveryStatus,
      providerId: updatedOrder.providerId,
      customerId: updatedOrder.customerId,
      driverId: updatedOrder.driverId,
      pickupOtp: updatedOrder.pickupOtp,
      deliveryOtp: updatedOrder.deliveryOtp,
      updatedAt: updatedOrder.updatedAt
    };

    if (updatedOrder.providerId) {
      emitToProvider(String(updatedOrder.providerId), 'order:status:updated', payload);
      emitToProvider(String(updatedOrder.providerId), 'order:updated', payload);
    }
    if (updatedOrder.customerId) {
      emitToCustomer(String(updatedOrder.customerId), 'order:status:updated', payload);
      emitToCustomer(String(updatedOrder.customerId), 'order:updated', payload);
    }
    if (updatedOrder.driverId) {
      emitToDriver(String(updatedOrder.driverId), 'order:status:updated', payload);
    }

    const io = getIO();
    if (io) {
      io.emit('order:status:updated', payload);
      io.emit('order:updated', payload);
    }
  } catch (sErr) {
    console.warn('Socket broadcast notice in transitionOrderStatus:', sErr.message);
  }

  return {
    success: true,
    message: `Order ${updatedOrder.orderId} moved to ${updatedOrder.status}.`,
    order: updatedOrder
  };
};

module.exports = {
  ORDER_STATUS,
  DELIVERY_STATUS,
  ALLOWED_STATUS_TRANSITIONS,
  buildOrderLookupQuery,
  transitionOrderStatus
};
