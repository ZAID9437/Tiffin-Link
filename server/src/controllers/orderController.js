const mongoose = require('mongoose');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const calculateBillBreakdown = (qty, price, distanceKm = 3.2) => {
  const quantity = Number(qty) || 1;
  const unitPrice = Number(price) || 100;
  const subtotal = quantity * unitPrice;
  const km = Number(distanceKm) || 3.2;
  const deliveryFee = Math.round(25 + (km * 8)); // Base ₹25 + ₹8 per km
  const driverEarning = deliveryFee; // Single source of truth
  const packagingFee = 15;
  const gstTax = Math.round(subtotal * 0.05); // 5% GST
  const serviceCharge = 0;
  const additionalCharges = 0;
  const totalAmount = subtotal + deliveryFee + packagingFee + gstTax + serviceCharge + additionalCharges;
  const platformCommission = Math.round(totalAmount * 0.125);
  const netPayout = totalAmount - platformCommission;

  const pricing = {
    itemsSubtotal: subtotal,
    packagingCharge: packagingFee,
    deliveryCharge: deliveryFee,
    serviceCharge,
    tax: gstTax,
    discount: 0,
    additionalCharges,
    customerPaidTotal: totalAmount,
    driverEarning,
    platformFee: platformCommission,
    providerPayout: netPayout
  };

  return {
    quantity,
    unitPrice,
    subtotal,
    deliveryKm: km,
    deliveryFee,
    driverEarning,
    packagingFee,
    serviceCharge,
    additionalCharges,
    gstTax,
    totalAmount,
    platformCommission,
    netPayout,
    pricing
  };
};

const enrichOrderFinancials = (o) => {
  if (!o) return o;
  const obj = typeof o.toObject === 'function' ? o.toObject() : { ...o };
  const subtotal = Number(obj.subtotal) || ((Number(obj.quantity) || 1) * (Number(obj.unitPrice) || 120)) || 120;
  const deliveryFee = Number(obj.deliveryFee) || 51;
  const driverEarning = Number(obj.driverEarning) || deliveryFee;
  const packagingFee = Number(obj.packagingFee) || 15;
  const gstTax = Number(obj.gstTax) || Math.round(subtotal * 0.05);
  const serviceCharge = Number(obj.serviceCharge) || 0;
  const additionalCharges = Number(obj.additionalCharges) || 0;
  const totalAmount = Number(obj.totalAmount) || (subtotal + deliveryFee + packagingFee + gstTax + serviceCharge + additionalCharges);
  const platformCommission = Number(obj.platformCommission) || Math.round(totalAmount * 0.125);
  const netPayout = Number(obj.netPayout) || (totalAmount - platformCommission);

  const createdAtTime = obj.createdAt ? new Date(obj.createdAt).getTime() : Date.now();
  const elapsedSecs = Math.floor((Date.now() - createdAtTime) / 1000);
  const secondsLeft = Math.max(0, 300 - elapsedSecs);

  obj.subtotal = subtotal;
  obj.deliveryFee = deliveryFee;
  obj.driverEarning = driverEarning;
  obj.packagingFee = packagingFee;
  obj.gstTax = gstTax;
  obj.serviceCharge = serviceCharge;
  obj.additionalCharges = additionalCharges;
  obj.totalAmount = totalAmount;
  obj.platformCommission = platformCommission;
  obj.netPayout = netPayout;
  obj.secondsLeft = secondsLeft;

  obj.pricing = {
    itemsSubtotal: subtotal,
    packagingCharge: packagingFee,
    deliveryCharge: deliveryFee,
    serviceCharge,
    tax: gstTax,
    discount: 0,
    additionalCharges,
    customerPaidTotal: totalAmount,
    driverEarning,
    platformFee: platformCommission,
    providerPayout: netPayout
  };

  return obj;
};

// @desc    Get provider orders from MongoDB with server-side pagination, search, filters & summary counts
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const {
      status = 'All',
      search = '',
      paymentStatus = 'All',
      page,
      limit
    } = req.query;

    if (await isDbConnected()) {
      // Reconcile delivery requests before querying orders
      try {
        const { reconcileMissingDeliveryRequests } = require('./deliveryDispatchController');
        await reconcileMissingDeliveryRequests();
      } catch (rErr) {}

      // Build MongoDB query
      const query = { providerId };

      if (status && status !== 'All') {
        query.status = status;
      }
      if (paymentStatus && paymentStatus !== 'All') {
        query.paymentStatus = paymentStatus;
      }

      if (search && search.trim()) {
        const s = search.trim();
        query.$or = [
          { orderId: { $regex: s, $options: 'i' } },
          { customerName: { $regex: s, $options: 'i' } },
          { customerPhone: { $regex: s, $options: 'i' } },
          { tiffinName: { $regex: s, $options: 'i' } }
        ];
      }

      // Helper to deduplicate order documents strictly by Mongo _id and orderId
      const deduplicateOrders = (orderDocs) => {
        const seenIds = new Set();
        const seenOrderIds = new Set();
        const result = [];
        for (const o of orderDocs) {
          const idStr = String(o._id || o.id || '').trim();
          const ordIdStr = String(o.orderId || '').trim();
          if (idStr && seenIds.has(idStr)) continue;
          if (ordIdStr && seenOrderIds.has(ordIdStr)) continue;
          if (idStr) seenIds.add(idStr);
          if (ordIdStr) seenOrderIds.add(ordIdStr);
          result.push(enrichOrderFinancials({ ...o, id: idStr || o.id }));
        }
        return result;
      };

      // If pagination is requested
      if (page || limit) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 20;
        const skip = (pageNum - 1) * limitNum;

        const [orders, total, statusCountsAgg] = await Promise.all([
          Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Order.countDocuments(query),
          Order.aggregate([
            { $match: { providerId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ])
        ]);

        const formattedOrders = deduplicateOrders(orders);

        const statusCounts = { All: 0, New: 0, Preparing: 0, Ready: 0, Completed: 0, Cancelled: 0 };
        statusCountsAgg.forEach(item => {
          if (item._id && statusCounts.hasOwnProperty(item._id)) {
            statusCounts[item._id] = item.count;
          }
          statusCounts.All += item.count;
        });

        return res.json({
          success: true,
          data: formattedOrders,
          pagination: {
            total: formattedOrders.length,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
          },
          statusCounts,
          source: 'database',
          databaseName: 'tiffinlink'
        });
      }

      // Default: lightweight projected query if no pagination explicitly requested
      const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
      const formattedOrders = deduplicateOrders(orders);

      return res.json({ success: true, data: formattedOrders, source: 'database', databaseName: 'tiffinlink' });
    } else {
      return res.json({ success: true, data: [], source: 'in-memory' });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create a new order in MongoDB with Bill Calculation
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const providerId = req.providerId || req.body.providerId;
    if (!providerId) {
      return res.status(400).json({ success: false, message: 'Provider ID is required' });
    }
    const { customerName, customerPhone, customerAddress, tiffinName, tiffinCategory, tiffinImage, quantity, unitPrice, distanceKm, paymentStatus, status } = req.body;
    
    if (!customerName || !tiffinName || !unitPrice) {
      return res.status(400).json({ success: false, message: 'Please provide customer name, tiffin name, and unit price' });
    }

    // Schedule & Capacity Validation Check
    if (await isDbConnected()) {
      try {
        const KitchenSchedule = require('../models/KitchenSchedule');
        const ProviderSetting = require('../models/ProviderSetting');
        const KitchenCapacity = require('../models/KitchenCapacity');

        // 1. Kitchen Schedule Check
        const schedDoc = await KitchenSchedule.findOne({ providerId });
        if (schedDoc) {
          const now = new Date();
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const currentDayName = daysOfWeek[now.getDay()];
          const todayConfig = schedDoc.weeklySchedule?.find(d => d.day === currentDayName);
          if (todayConfig && !todayConfig.isOpen) {
            return res.status(400).json({
              success: false,
              message: `Kitchen is closed today (${currentDayName}) according to kitchen schedule.`
            });
          }

          const dateFormatted = `${now.getDate()} ${now.toLocaleString('en', { month: 'short' })}`;
          const specialOverride = schedDoc.specialDates?.find(sd => sd.date.toLowerCase() === dateFormatted.toLowerCase());
          if (specialOverride && specialOverride.status === 'CLOSED') {
            return res.status(400).json({
              success: false,
              message: `Kitchen is closed today for ${specialOverride.reason || 'Holiday'}.`
            });
          }
        }

        // 2. Capacity Auto-Stop Validation Check
        const settings = await ProviderSetting.findOne({ providerId });
        const maxDaily = settings?.tiffin?.maxDailyLimit ?? 50;
        const autoStop = settings?.tiffin?.autoPauseLimit ?? true;
        const allowOver = settings?.tiffin?.allowOverbooking ?? false;

        const dObj = new Date();
        const todayKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        
        const todayCapDoc = await KitchenCapacity.findOne({ providerId, date: todayKey });
        const finalMax = todayCapDoc ? todayCapDoc.maxCapacity : maxDaily;
        const finalAutoStop = todayCapDoc ? todayCapDoc.autoStopOrders : autoStop;
        const finalAllowOver = todayCapDoc ? todayCapDoc.allowOverbooking : allowOver;

        const existingOrders = await Order.find({ providerId, status: { $ne: 'Cancelled' } });
        const todayBooked = existingOrders
          .filter(o => {
            const od = new Date(o.createdAt);
            const k = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}-${String(od.getDate()).padStart(2, '0')}`;
            return k === todayKey;
          })
          .reduce((sum, o) => sum + (o.quantity || 1), 0);

        const newTotal = todayBooked + (Number(quantity) || 1);
        if (newTotal > finalMax && finalAutoStop && !finalAllowOver) {
          return res.status(400).json({
            success: false,
            message: 'Kitchen is currently at full capacity.'
          });
        }
      } catch (capErr) {
        console.error('Error validating capacity during order creation:', capErr);
      }
    }

    const bill = calculateBillBreakdown(quantity, unitPrice, distanceKm || 3.2);
    const orderNum = Math.floor(1000 + Math.random() * 9000);

    const orderData = {
      providerId,
      orderId: `#${orderNum}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone || '+91 98765 43210',
      customerAddress: customerAddress || 'Ahmedabad',
      tiffinName: tiffinName.trim(),
      tiffinCategory: tiffinCategory || 'Gujarati',
      tiffinImage: tiffinImage || '/assets/provider_1.png',
      ...bill,
      paymentStatus: paymentStatus || 'Paid',
      status: status || 'New',
      deliveryStatus: 'Not Requested'
    };

    if (await isDbConnected()) {
      const newOrder = new Order(orderData);
      await newOrder.save();
      const refreshedOrder = await Order.findById(newOrder._id);
      return res.status(201).json({ 
        success: true, 
        message: 'Order created successfully with Bill Receipt and Driver Dispatch', 
        data: refreshedOrder || newOrder, 
        source: 'database' 
      });
    } else {
      return res.status(201).json({ 
        success: true, 
        message: 'Order created', 
        data: { _id: 'ord_' + Date.now(), ...orderData }, 
        source: 'in-memory' 
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order: ' + error.message });
  }
};

// Helper to build flexible order lookup query matching _id or orderId formats
const buildOrderLookupQuery = (id, providerId = null) => {
  const queryList = [];
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    queryList.push({ _id: id });
  }
  if (id) {
    const cleanId = String(id).replace(/^#/, '').trim();
    queryList.push({ orderId: id });
    queryList.push({ orderId: `#${cleanId}` });
    queryList.push({ orderId: `#ORD-${cleanId}` });
    queryList.push({ orderId: cleanId });
  }

  const findFilter = queryList.length > 0 ? { $or: queryList } : {};
  if (providerId) {
    return { providerId, ...findFilter };
  }
  return findFilter;
};

// @desc    Update order status or details
// @route   PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    const updateData = { ...req.body };

    if (updateData.status === 'Delivery' && (!updateData.deliveryStatus || updateData.deliveryStatus === 'Unassigned' || updateData.deliveryStatus === 'Not Requested')) {
      updateData.deliveryStatus = 'Searching';
      if (!updateData.deliveryRequestedAt) {
        updateData.deliveryRequestedAt = new Date();
      }
    }

    if (await isDbConnected()) {
      const query = buildOrderLookupQuery(id, providerId);
      const updated = await Order.findOneAndUpdate(query, updateData, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }
      try {
        const { reconcileMissingDeliveryRequests } = require('./deliveryDispatchController');
        await reconcileMissingDeliveryRequests();
      } catch (rErr) {
        console.warn('Reconciliation error in updateOrder:', rErr.message);
      }
      const refreshed = await Order.findById(updated._id);
      return res.json({ success: true, message: 'Order updated successfully', data: refreshed || updated });
    }
    return res.json({ success: true, message: 'Order updated (in-memory)', data: req.body });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Failed to update order: ' + error.message });
  }
};

// @desc    Atomic Delivery Acceptance
// @route   PUT /api/orders/:id/accept-delivery
const acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.user?.role === 'provider' ? req.providerId : null;
    const { partnerName, partnerPhone } = req.body;

    const deliveryPartnerName = partnerName || req.user?.fullName || req.user?.name || 'Delivery Partner';
    const deliveryPartnerPhone = partnerPhone || req.user?.phone || '+91 98765 11223';
    const driverId = req.user?.driverId || (req.user?._id ? String(req.user._id) : 'DRV-1');

    if (await isDbConnected()) {
      const query = buildOrderLookupQuery(id, providerId);
      const updatedOrder = await Order.findOneAndUpdate(
        { 
          ...query,
          deliveryStatus: { $in: ['Unassigned', 'Searching', 'Searching Drivers', 'Pending'] }
        },
        { 
          $set: {
            deliveryStatus: 'Accepted',
            deliveryPartnerName,
            deliveryPartnerPhone,
            acceptedAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(409).json({ 
          success: false, 
          message: 'Delivery offer is no longer available or already assigned.' 
        });
      }

      // Synchronize DeliveryRequest in MongoDB
      try {
        const DeliveryRequest = require('../models/DeliveryRequest');
        await DeliveryRequest.updateMany(
          { 
            $or: [
              { orderId: updatedOrder.orderId },
              { orderId: `#${String(updatedOrder.orderId).replace(/^#+/, '')}` },
              { orderId: String(updatedOrder.orderId).replace(/^#+/, '') }
            ]
          },
          {
            $set: {
              status: 'Driver Assigned',
              acceptedAt: new Date(),
              assignedDriver: {
                driverId: String(driverId),
                name: deliveryPartnerName,
                phone: deliveryPartnerPhone,
                rating: 4.8,
                vehicleNo: '',
                location: { lat: 23.0280, lng: 72.5670 }
              }
            }
          }
        );
      } catch (dErr) {
        console.warn('DeliveryRequest sync warning on acceptDelivery:', dErr.message);
      }

      return res.json({ 
        success: true, 
        message: 'Delivery accepted successfully!', 
        data: updatedOrder 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Delivery accepted (in-memory)', 
      data: { _id: id, deliveryStatus: 'Accepted', deliveryPartnerName } 
    });
  } catch (error) {
    console.error('Error accepting delivery:', error);
    res.status(500).json({ success: false, message: 'Failed to accept delivery: ' + error.message });
  }
};

// @desc    Update Delivery Status Lifecycle
// @route   PUT /api/orders/:id/delivery-status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    const { deliveryStatus } = req.body;

    const updateFields = { deliveryStatus };
    if (deliveryStatus === 'Picked Up') {
      updateFields.pickedUpAt = new Date();
    } else if (deliveryStatus === 'Delivered') {
      updateFields.deliveredAt = new Date();
      updateFields.status = 'Completed';
    }

    if (await isDbConnected()) {
      const query = buildOrderLookupQuery(id, providerId);
      const updated = await Order.findOneAndUpdate(query, updateFields, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }
      return res.json({ success: true, message: `Delivery status updated to ${deliveryStatus}`, data: updated });
    }

    return res.json({ success: true, message: `Delivery status updated (in-memory)`, data: { _id: id, ...updateFields } });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ success: false, message: 'Failed to update delivery status' });
  }
};

// @desc    Delete an order from MongoDB
// @route   DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const query = buildOrderLookupQuery(id, providerId);
      const deleted = await Order.findOneAndDelete(query);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }
      return res.json({ success: true, message: 'Order deleted successfully' });
    }
    return res.json({ success: true, message: 'Order deleted (in-memory)' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

// @desc    Get single order by ID with authoritative financial snapshot
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const query = buildOrderLookupQuery(id, providerId);
      const ord = await Order.findOne(query).lean();
      if (!ord) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }
      return res.json({ success: true, data: enrichOrderFinancials(ord) });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order: ' + error.message });
  }
};

// @desc    Atomic Provider Order Acceptance
// @route   POST /api/orders/:id/accept or PUT /api/orders/:id/accept
const acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (await isDbConnected()) {
      const lookupQuery = buildOrderLookupQuery(id, providerId);
      const existing = await Order.findOne(lookupQuery);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }

      const currentStatus = String(existing.status || '').toUpperCase();
      
      // If already accepted/preparing, return success gracefully
      if (currentStatus === 'PREPARING' || currentStatus === 'ACCEPTED' || currentStatus === 'IN_PREP') {
        return res.json({
          success: true,
          message: `Order ${existing.orderId} is already accepted and in kitchen preparation.`,
          data: enrichOrderFinancials(existing)
        });
      }

      // If cancelled, cannot accept
      if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
        return res.status(409).json({
          success: false,
          message: 'Order was cancelled and cannot be accepted.'
        });
      }

      // Update order to Preparing atomically
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: existing._id,
          providerId
        },
        {
          $set: {
            status: 'Preparing',
            acceptedAt: new Date(),
            acceptedBy: req.user?._id
          }
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message: 'Order is no longer available.'
        });
      }

      // Audit Log & Socket Notification
      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          action: 'ORDER_ACCEPTED',
          entityType: 'Order',
          entityId: String(updatedOrder._id),
          performedBy: req.user?.name || 'Provider',
          details: `Order ${updatedOrder.orderId} accepted by provider`
        });
      } catch (aErr) {}

      try {
        const { emitToProvider, getIO } = require('../services/socketService');
        emitToProvider(providerId, 'order:status:updated', { orderId: updatedOrder.orderId, status: 'Preparing' });
        const io = getIO();
        if (io) io.emit('order:status:updated', { orderId: updatedOrder.orderId, status: 'Preparing', providerId });
      } catch (sErr) {}

      return res.json({
        success: true,
        message: `Order ${updatedOrder.orderId} Accepted! Moved to Kitchen Prep Queue.`,
        data: enrichOrderFinancials(updatedOrder)
      });
    }

    return res.json({ success: true, message: 'Order accepted' });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ success: false, message: 'Failed to accept order: ' + error.message });
  }
};

// @desc    Provider Order Rejection/Decline
// @route   POST /api/orders/:id/reject or PUT /api/orders/:id/reject
const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    const { reason, notes } = req.body;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (await isDbConnected()) {
      const lookupQuery = buildOrderLookupQuery(id, providerId);
      const existing = await Order.findOne(lookupQuery);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }

      const currentStatus = String(existing.status || '').toUpperCase();
      if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED') {
        return res.json({
          success: true,
          message: `Order ${existing.orderId} is already cancelled.`,
          data: enrichOrderFinancials(existing)
        });
      }

      const rejectionReason = reason || notes || 'Declined by kitchen provider';

      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: existing._id,
          providerId
        },
        {
          $set: {
            status: 'Cancelled',
            cancelledBy: 'Provider',
            cancellationReason: rejectionReason,
            cancelledAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(409).json({
          success: false,
          message: 'Order is no longer available for rejection.'
        });
      }

      // Audit Log & Socket Notification
      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          action: 'ORDER_REJECTED',
          entityType: 'Order',
          entityId: String(updatedOrder._id),
          performedBy: req.user?.name || 'Provider',
          details: `Order ${updatedOrder.orderId} declined by provider. Reason: ${rejectionReason}`
        });
      } catch (aErr) {}

      try {
        const { emitToProvider, getIO } = require('../services/socketService');
        emitToProvider(providerId, 'order:status:updated', { orderId: updatedOrder.orderId, status: 'Cancelled' });
        const io = getIO();
        if (io) io.emit('order:status:updated', { orderId: updatedOrder.orderId, status: 'Cancelled', providerId });
      } catch (sErr) {}

      return res.json({
        success: true,
        message: `Order ${updatedOrder.orderId} declined. Reason logged.`,
        data: enrichOrderFinancials(updatedOrder)
      });
    }

    return res.json({ success: true, message: 'Order declined' });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ success: false, message: 'Failed to decline order: ' + error.message });
  }
};

// @desc    Customer places an order from cart/dossier
// @route   POST /api/orders/customer
const createCustomerOrder = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required to place an order' 
      });
    }

    const {
      providerId,
      tiffinId,
      tiffinName,
      tiffinCategory,
      tiffinImage,
      quantity = 1,
      unitPrice,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      deliveryCoordinates,
      deliverySlot,
      items,
      extras,
      rotliCount,
      selectedShaak,
      instructions,
      paymentMethod = 'Online Payment'
    } = req.body;

    if (!providerId) {
      return res.status(400).json({ success: false, message: 'Provider ID is required' });
    }

    // Fetch authoritative Provider & Tiffin from DB
    const Provider = require('../models/Provider');
    const Tiffin = require('../models/Tiffin');
    const TiffinItem = require('../models/TiffinItem');
    let providerDoc = null;
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      providerDoc = await Provider.findById(providerId);
    }
    let tiffinDoc = null;
    if (tiffinId && mongoose.Types.ObjectId.isValid(tiffinId)) {
      tiffinDoc = await Tiffin.findOne({ _id: tiffinId, providerId: providerId.toString() });
    }

    const resolvedTiffinName = (tiffinDoc?.name || tiffinName || (items && items[0]?.name) || (tiffinCategory ? `${tiffinCategory} Tiffin` : 'Special Meal Tiffin')).trim();
    const resolvedTiffinImage = tiffinDoc?.image || tiffinImage || providerDoc?.image || '/assets/provider_1.png';
    const resolvedTiffinCategory = tiffinDoc?.category || tiffinCategory || 'Gujarati Traditional';
    const basePrice = Number(tiffinDoc?.price !== undefined ? tiffinDoc.price : (unitPrice || providerDoc?.price || 140));

    // Authoritative Customer identity from JWT token
    const customerId = req.user._id.toString();
    const email = (req.user.email || customerEmail || '').trim().toLowerCase();
    const phone = (customerPhone || req.user.phone || '+91 98765 43210').trim();
    const finalCustomerName = (customerName || req.user.name || 'Customer').trim();

    // Calculate distance
    let distanceKm = 1.8;
    if (providerDoc?.address?.lat && deliveryCoordinates?.lat) {
      const haversineKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return Number((2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
      };
      distanceKm = haversineKm(deliveryCoordinates.lat, deliveryCoordinates.lng, providerDoc.address.lat, providerDoc.address.lng);
    }

    // Process & Validate Items against DB (Rule 11 & Rule 16)
    const qty = Math.max(1, Number(quantity) || 1);
    let itemsAmount = 0;
    const sanitizedItemsSnapshot = [];
    const incomingItems = Array.isArray(items) ? items : [];

    for (const item of incomingItems) {
      const reqQty = Number(item.quantity) || 0;
      if (reqQty <= 0) continue;

      let dbItem = null;
      const itemId = item.itemId || item.id || item._id;
      if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
        dbItem = await TiffinItem.findOne({ _id: itemId, providerId: providerId.toString() });
      } else if (item.name) {
        dbItem = await TiffinItem.findOne({ 
          name: item.name.trim(), 
          providerId: providerId.toString(),
          ...(tiffinId ? { tiffinId } : {})
        });
      }

      if (dbItem) {
        // Validate stock availability
        if (dbItem.isAvailable === false || dbItem.availableQuantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `"${dbItem.name}" is currently OUT OF STOCK.`
          });
        }
        if (reqQty > dbItem.availableQuantity) {
          return res.status(400).json({
            success: false,
            message: `"${dbItem.name}" only has ${dbItem.availableQuantity} portion(s) available in stock. You requested ${reqQty}.`
          });
        }

        const effectiveUnitPrice = Number(dbItem.price !== undefined ? dbItem.price : dbItem.unitPrice) || 0;
        const lineTotal = effectiveUnitPrice * reqQty;
        itemsAmount += lineTotal;

        sanitizedItemsSnapshot.push({
          menuItemId: dbItem._id.toString(),
          itemId: dbItem._id.toString(),
          name: dbItem.name,
          category: dbItem.category,
          image: dbItem.image || '',
          unit: dbItem.unit || 'portion',
          unitPrice: effectiveUnitPrice,
          quantity: reqQty,
          totalPrice: lineTotal
        });

        // Atomic inventory decrement
        await TiffinItem.findByIdAndUpdate(dbItem._id, {
          $inc: { availableQuantity: -reqQty }
        });
      } else {
        // Fallback for custom extra add-ons
        const p = Number(item.unitPrice || item.price) || 0;
        const lineTotal = p * reqQty;
        itemsAmount += lineTotal;
        sanitizedItemsSnapshot.push({
          menuItemId: itemId ? String(itemId) : '',
          itemId: itemId ? String(itemId) : '',
          name: item.name || 'Custom Item',
          category: item.category || 'Add-on',
          image: item.image || '',
          unit: item.unit || 'portion',
          unitPrice: p,
          quantity: reqQty,
          totalPrice: lineTotal
        });
      }
    }

    // Extras array (e.g. chaas, sweet checkbox addons if passed separately)
    let extrasTotal = 0;
    const sanitizedExtras = [];
    if (Array.isArray(extras)) {
      for (const ex of extras) {
        const p = Number(ex.price) || 0;
        extrasTotal += p;
        sanitizedExtras.push({ name: ex.name, price: p });
      }
    }

    // Dynamic Delivery Fee Calculation: ₹25 base + ₹8/km (based on KM)
    const deliveryFee = Math.max(25, Math.round(25 + (distanceKm * 8)));

    // Dynamic Item-Based Meal Pricing:
    // If customer selected items, mealSubtotal is SUM(item.price * quantity) + extras
    // Fixed tiffin base price is not charged when customer builds their own meal.
    const isCustomizedMeal = sanitizedItemsSnapshot.length > 0;
    const mealSubtotal = isCustomizedMeal 
      ? (itemsAmount + extrasTotal) 
      : (basePrice * qty + extrasTotal);
    const subtotal = mealSubtotal;
    const totalAmount = subtotal + deliveryFee;
    const tiffinBaseAmount = isCustomizedMeal ? 0 : (basePrice * qty);

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `TL-${orderNum}`;

    const formattedSelectedItems = sanitizedItemsSnapshot.map(i => ({
      itemId: i.itemId || i.menuItemId,
      itemName: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice
    }));

    const orderData = {
      orderId,
      providerId: providerId.toString(),
      tiffinId: tiffinId || (tiffinDoc ? tiffinDoc._id.toString() : ''),
      customerId,
      customerName: finalCustomerName,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: (customerAddress || 'Satellite, Ahmedabad').trim(),
      deliveryCoordinates: deliveryCoordinates || { lat: 23.0300, lng: 72.5178 },
      deliverySlot: deliverySlot || 'Lunch Slot (12:00 - 13:30)',
      tiffinName: resolvedTiffinName,
      tiffinCategory: resolvedTiffinCategory,
      tiffinImage: resolvedTiffinImage,
      quantity: qty,
      unitPrice: isCustomizedMeal ? 0 : basePrice,
      tiffinBaseAmount,
      itemsAmount,
      mealSubtotal,
      subtotal,
      deliveryKm: distanceKm,
      deliveryDistance: `${distanceKm} km`,
      deliveryFee,
      driverEarning: deliveryFee,
      packagingFee: 0,
      gstTax: Math.round(subtotal * 0.05),
      finalTotal: totalAmount,
      totalAmount,
      items: sanitizedItemsSnapshot,
      selectedItems: formattedSelectedItems,
      extras: sanitizedExtras,
      rotliCount: rotliCount || 4,
      selectedShaak: selectedShaak || '',
      instructions: instructions || '',
      paymentStatus: (paymentMethod || '').toLowerCase().includes('cash') ? 'Cash on Delivery' : 'Paid',
      status: 'New',
      deliveryStatus: 'Not Requested',
      pickupAddress: providerDoc?.address?.street 
        ? `${providerDoc.address.street}, ${providerDoc.address.locality || ''}, ${providerDoc.address.city || 'Ahmedabad'}`
        : 'Kitchen Hub, Ahmedabad'
    };

    if (await isDbConnected()) {
      const newOrder = new Order(orderData);
      await newOrder.save();

      const savedOrder = await Order.findById(newOrder._id);
      const enriched = enrichOrderFinancials(savedOrder || newOrder);

      // Real-time socket broadcast to provider & admin
      try {
        const { getIO, emitToProvider } = require('../services/socketService');
        emitToProvider(providerId.toString(), 'order:created', enriched);
        emitToProvider(providerId.toString(), 'order:new', enriched);
        const io = getIO();
        if (io) {
          io.emit('order:created', enriched);
          io.emit('order:new', enriched);
        }
      } catch (sErr) {
        console.warn('Socket notification error on order create:', sErr.message);
      }

      // Audit Log
      try {
        const AuditLog = require('../models/AuditLog');
        await AuditLog.create({
          action: 'ORDER_CREATED',
          entityType: 'Order',
          entityId: String(newOrder._id),
          performedBy: req.user?.name || finalCustomerName,
          details: `New order ${newOrder.orderId} created by customer for ₹${newOrder.totalAmount}`
        });
      } catch (aErr) {}

      return res.status(201).json({
        success: true,
        message: 'Order created successfully!',
        data: enriched
      });
    } else {
      return res.status(201).json({
        success: true,
        message: 'Order created',
        data: { _id: 'ord_' + Date.now(), ...orderData }
      });
    }
  } catch (error) {
    console.error('Error creating customer order:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Provider marks order as Preparing
// @route   POST /api/orders/:id/prepare
const prepareOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (!(await isDbConnected())) {
      return res.status(503).json({ success: false, message: 'Database connection offline' });
    }

    const query = buildOrderLookupQuery(id, providerId);
    const updated = await Order.findOneAndUpdate(
      query,
      { $set: { status: 'Preparing', preparingAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    try {
      const { emitToProvider, emitToCustomer, getIO } = require('../services/socketService');
      emitToProvider(providerId, 'order:status:updated', { orderId: updated.orderId, status: 'Preparing' });
      if (updated.customerId) {
        emitToCustomer(updated.customerId, 'order:status:updated', { orderId: updated.orderId, status: 'Preparing' });
      }
      const io = getIO();
      if (io) io.emit('order:status:updated', { orderId: updated.orderId, status: 'Preparing' });
    } catch (sErr) {}

    return res.json({ success: true, message: `Order ${updated.orderId} moved to Preparing`, data: enrichOrderFinancials(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @desc    Provider marks food as Ready for Pickup
// @route   POST /api/orders/:id/ready
const readyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (!(await isDbConnected())) {
      return res.status(503).json({ success: false, message: 'Database connection offline' });
    }

    const query = buildOrderLookupQuery(id, providerId);
    const updated = await Order.findOneAndUpdate(
      query,
      { $set: { status: 'Ready', readyAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    try {
      const { emitToProvider, emitToCustomer, getIO } = require('../services/socketService');
      emitToProvider(providerId, 'order:status:updated', { orderId: updated.orderId, status: 'Ready' });
      if (updated.customerId) {
        emitToCustomer(updated.customerId, 'order:status:updated', { orderId: updated.orderId, status: 'Ready' });
      }
      const io = getIO();
      if (io) io.emit('order:status:updated', { orderId: updated.orderId, status: 'Ready' });
    } catch (sErr) {}

    return res.json({ success: true, message: `Order ${updated.orderId} marked Ready for Pickup`, data: enrichOrderFinancials(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @desc    Provider confirms pickup when food is ready -> Dispatches Delivery Request to Available Drivers
// @route   POST /api/orders/:id/confirm-pickup
const confirmOrderPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (!(await isDbConnected())) {
      return res.status(503).json({ success: false, message: 'Database connection offline' });
    }

    const query = buildOrderLookupQuery(id, providerId);
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    if (order.status === 'Delivery' || order.status === 'Out for Delivery' || order.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: `Order ${order.orderId} is already in ${order.status} stage.`
      });
    }

    // Generate 4-digit Kitchen Pickup OTP & 6-digit Customer Handover OTP if not already present
    const isValid4Digit = (c) => c && /^\d{4}$/.test(String(c).trim());
    const pickupOtp = isValid4Digit(order.pickupOtp) ? String(order.pickupOtp).trim() : String(Math.floor(1000 + Math.random() * 9000));
    const deliveryOtp = order.deliveryOtp || String(Math.floor(100000 + Math.random() * 900000));

    // Update order status to Delivery and searching for couriers
    order.status = 'Delivery';
    order.deliveryStatus = 'Searching';
    order.pickupOtp = pickupOtp;
    order.deliveryOtp = deliveryOtp;
    order.deliveryRequestedAt = new Date();
    await order.save();

    // Create or update DeliveryRequest in MongoDB
    const DeliveryRequest = require('../models/DeliveryRequest');
    const Provider = require('../models/Provider');
    const AuditLog = require('../models/AuditLog');

    const providerDoc = await Provider.findById(providerId);

    const reqId = order.orderId ? String(order.orderId).replace(/^#+/, '') : String(order._id);
    const existingReq = await DeliveryRequest.findOne({
      $or: [{ orderId: order.orderId }, { requestId: reqId }, { requestId: `TL-REQ-${reqId}` }]
    });

    let deliveryReq;
    const deliveryPayload = {
      orderId: order.orderId,
      providerId: String(providerId),
      providerName: providerDoc?.name || order.tiffinName || 'Kitchen Hub',
      providerEmail: providerDoc?.email || req.user?.email || '',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '',
      customerId: order.customerId || '',
      deliveryAddress: {
        street: order.customerAddress || 'Ahmedabad',
        city: 'Ahmedabad',
        lat: order.deliveryCoordinates?.lat || 23.0300,
        lng: order.deliveryCoordinates?.lng || 72.5178
      },
      pickupAddress: {
        street: order.pickupAddress || providerDoc?.address?.street || 'Kitchen Hub, Ahmedabad',
        city: 'Ahmedabad',
        lat: providerDoc?.address?.lat || 23.0300,
        lng: providerDoc?.address?.lng || 72.5178
      },
      distanceKm: order.deliveryKm || 3.2,
      subtotal: order.subtotal || 120,
      deliveryFee: order.deliveryFee || 45,
      driverEarning: order.driverEarning || order.deliveryFee || 45,
      amount: order.totalAmount,
      tiffinName: order.tiffinName,
      tiffinCategory: order.tiffinCategory || 'Gujarati',
      status: 'Searching Drivers',
      pickupOtp,
      deliveryOtp,
      requestedAt: new Date()
    };

    if (existingReq) {
      Object.assign(existingReq, deliveryPayload);
      await existingReq.save();
      deliveryReq = existingReq;
    } else {
      deliveryReq = new DeliveryRequest({
        requestId: `TL-REQ-${reqId}`,
        ...deliveryPayload
      });
      await deliveryReq.save();
    }

    // Broadcast to available drivers and socket rooms
    try {
      const { getIO, emitToProvider, emitToCustomer } = require('../services/socketService');
      const io = getIO();
      if (io) {
        const broadcastData = {
          requestId: deliveryReq.requestId,
          orderId: order.orderId,
          providerId: String(providerId),
          providerName: deliveryPayload.providerName,
          pickupAddress: deliveryPayload.pickupAddress,
          deliveryAddress: deliveryPayload.deliveryAddress,
          customerName: order.customerName,
          tiffinName: order.tiffinName,
          distanceKm: order.deliveryKm || 3.2,
          deliveryFee: order.deliveryFee,
          driverEarning: order.driverEarning,
          amount: order.totalAmount,
          secondsLeft: 60,
          requestedAt: new Date()
        };

        // Notify drivers
        io.emit('delivery:request:new', broadcastData);
        io.emit('delivery:driver:live_request', broadcastData);
        io.emit('delivery:new_request', broadcastData);

        // Notify provider & customer
        emitToProvider(String(providerId), 'order:status:updated', {
          orderId: order.orderId,
          status: 'Delivery',
          deliveryStatus: 'Searching',
          pickupOtp
        });
        emitToProvider(String(providerId), 'order:updated', {
          orderId: order.orderId,
          status: 'Delivery',
          deliveryStatus: 'Searching',
          pickupOtp
        });
        if (order.customerId) {
          emitToCustomer(order.customerId, 'order:status:updated', {
            orderId: order.orderId,
            status: 'Delivery',
            deliveryStatus: 'Searching for Delivery Partner',
            deliveryOtp
          });
        }
        io.emit('order:status:updated', {
          orderId: order.orderId,
          status: 'Delivery',
          deliveryStatus: 'Searching'
        });
      }
    } catch (sErr) {
      console.warn('Socket emit warning in confirmOrderPickup:', sErr.message);
    }

    // Audit Log
    try {
      await AuditLog.create({
        action: 'DELIVERY_REQUESTED',
        entityType: 'Order',
        entityId: String(order._id),
        performedBy: req.user?.name || 'Provider',
        details: `Pickup confirmed and delivery requested for Order ${order.orderId}`
      });
    } catch (aErr) {}

    return res.json({
      success: true,
      message: '✓ Pickup confirmed! Delivery request broadcasted to available drivers.',
      data: {
        order: enrichOrderFinancials(order),
        deliveryRequest: deliveryReq
      }
    });
  } catch (error) {
    console.error('Error in confirmOrderPickup:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Customer or Provider cancels order
// @route   POST /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Order cancelled by user' } = req.body;
    const userId = req.user?._id?.toString();
    const providerId = req.providerId;

    if (!(await isDbConnected())) {
      return res.status(503).json({ success: false, message: 'Database connection offline' });
    }

    let query = {};
    if (providerId) {
      query = buildOrderLookupQuery(id, providerId);
    } else if (userId) {
      query = {
        $and: [
          { $or: [{ _id: id }, { orderId: id }, { orderId: `#${id}` }] },
          { customerId: userId }
        ]
      };
    } else {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    const s = String(order.status || '').toLowerCase();
    if (['picked_up', 'picked up', 'out_for_delivery', 'out for delivery', 'delivered', 'completed'].includes(s)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled after dispatch or delivery' });
    }

    order.status = 'Cancelled';
    order.cancellationReason = reason;
    await order.save();

    // Cancel matching delivery request if any
    const DeliveryRequest = require('../models/DeliveryRequest');
    await DeliveryRequest.updateMany(
      { orderId: order.orderId },
      { $set: { status: 'Cancelled' } }
    );

    try {
      const { getIO, emitToProvider, emitToCustomer } = require('../services/socketService');
      const io = getIO();
      if (io) {
        io.emit('delivery:request:cancelled', { orderId: order.orderId, requestId: order.orderId });
        io.emit('order:status:updated', { orderId: order.orderId, status: 'Cancelled' });
      }
      if (order.providerId) emitToProvider(order.providerId, 'order:updated', { orderId: order.orderId, status: 'Cancelled' });
      if (order.customerId) emitToCustomer(order.customerId, 'order:updated', { orderId: order.orderId, status: 'Cancelled' });
    } catch (sErr) {}

    return res.json({ success: true, message: 'Order cancelled successfully', data: enrichOrderFinancials(order) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @desc    Verify and settle payment on backend
// @route   POST /api/orders/:id/payment-verify
const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, gatewayOrderId, transactionId, paymentStatus = 'Paid' } = req.body;
    const userId = req.user?._id?.toString();

    if (!(await isDbConnected())) {
      return res.status(503).json({ success: false, message: 'Database connection offline' });
    }

    const order = await Order.findOne({
      $and: [
        { $or: [{ _id: id }, { orderId: id }, { orderId: `#${id}` }] },
        { customerId: userId }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    if (paymentStatus === 'Paid') {
      order.paymentStatus = 'Paid';
      order.paymentId = paymentId || `pay_${Date.now()}`;
      order.gatewayOrderId = gatewayOrderId || `order_${Date.now()}`;
      order.transactionId = transactionId || `txn_${Date.now()}`;
      order.paidAt = new Date();
      order.status = 'New';
    } else {
      order.paymentStatus = 'Failed';
      order.status = 'PAYMENT_FAILED';
    }
    await order.save();

    return res.json({ success: true, message: `Payment verified: ${order.paymentStatus}`, data: enrichOrderFinancials(order) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// @desc    Customer gets their orders
const computeHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 2.0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Number((2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

const calculateLiveDropEta = ({ driverLat, driverLng, dropLat, dropLng, pickupLat, pickupLng, status, currentSpeed }) => {
  if (!dropLat || !dropLng || isNaN(dropLat) || isNaN(dropLng)) {
    return { distanceKm: 2.5, etaMinutes: 15 };
  }

  const normStatus = String(status || '').toUpperCase();
  const isDelivered = normStatus.includes('DELIVERED') || normStatus.includes('COMPLETED');
  const isAtCustomer = normStatus.includes('ARRIVED_CUSTOMER') || normStatus.includes('ARRIVED AT CUSTOMER') || normStatus.includes('DELIVERY_OTP_PENDING') || normStatus.includes('DELIVERY OTP PENDING');
  const isPickedUp = normStatus.includes('PICKED_UP') || normStatus.includes('PICKED UP') || normStatus.includes('OUT_FOR_DELIVERY') || normStatus.includes('OUT FOR DELIVERY') || normStatus.includes('ON THE WAY');

  if (isDelivered) {
    return { distanceKm: 0, etaMinutes: 0 };
  }

  if (isAtCustomer) {
    return { distanceKm: 0.1, etaMinutes: 1 };
  }

  let roadDistanceKm = 2.5;
  let baseEtaMins = 15;

  if (isPickedUp) {
    // Driver is en route directly to customer drop
    const straightDist = computeHaversineKm(driverLat, driverLng, dropLat, dropLng);
    roadDistanceKm = Number((straightDist * 1.3).toFixed(1));
    const effectiveSpeed = (currentSpeed && currentSpeed > 10) ? Math.min(45, Math.max(15, currentSpeed)) : 24;
    const trafficBuffer = roadDistanceKm > 3 ? 3 : 2;
    baseEtaMins = Math.max(2, Math.round((roadDistanceKm / effectiveSpeed) * 60 + trafficBuffer));
  } else {
    // Driver is heading to kitchen or waiting for pickup
    const toPickupDist = (pickupLat && pickupLng) ? computeHaversineKm(driverLat, driverLng, pickupLat, pickupLng) * 1.3 : 1.0;
    const pickupToDropDist = (pickupLat && pickupLng) ? computeHaversineKm(pickupLat, pickupLng, dropLat, dropLng) * 1.3 : 2.5;
    roadDistanceKm = Number((toPickupDist + pickupToDropDist).toFixed(1));
    baseEtaMins = Math.max(3, Math.round((roadDistanceKm / 24) * 60 + 4));
  }

  return {
    distanceKm: roadDistanceKm,
    etaMinutes: baseEtaMins
  };
};

// @route   GET /api/orders/my-orders
const getCustomerOrders = async (req, res) => {
  try {
    const userId = req.user?._id ? req.user._id.toString() : (req.query.userId || '');
    const userEmail = (req.user?.email || req.query.email || 'mansurizaid663@gmail.com').toLowerCase();
    const userPhone = req.user?.phone || req.query.phone || '';

    const conditions = [];
    if (userId) conditions.push({ customerId: userId });
    if (userEmail) conditions.push({ customerEmail: userEmail });
    if (userPhone) conditions.push({ customerPhone: userPhone });

    const query = conditions.length > 0 ? { $or: conditions } : {};

    if (await isDbConnected()) {
      const DeliveryRequest = require('../models/DeliveryRequest');
      const rawOrders = await Order.find(query).sort({ createdAt: -1 }).limit(50).lean();

      // Find active delivery requests matching these orders
      const orderIdentifiers = rawOrders.map(o => o.orderId || o._id?.toString()).filter(Boolean);
      let deliveryMap = {};

      if (orderIdentifiers.length > 0) {
        const delRequests = await DeliveryRequest.find({
          $or: [
            { orderId: { $in: orderIdentifiers } },
            { requestId: { $in: orderIdentifiers } }
          ]
        }).lean();

        delRequests.forEach(dr => {
          if (dr.orderId) deliveryMap[dr.orderId] = dr;
          if (dr.requestId) deliveryMap[dr.requestId] = dr;
        });
      }

      const enrichedList = rawOrders.map(o => {
        const enriched = enrichOrderFinancials(o);
        const delReq = deliveryMap[o.orderId] || deliveryMap[o._id?.toString()];

        if (delReq) {
          const driverLoc = delReq.assignedDriver?.location || delReq.driverLocation;
          const dropCoords = delReq.deliveryAddress;
          const pickupCoords = delReq.pickupAddress;

          let dLat = driverLoc && typeof driverLoc.lat === 'number' ? driverLoc.lat : pickupCoords?.lat;
          let dLng = driverLoc && typeof driverLoc.lng === 'number' ? driverLoc.lng : pickupCoords?.lng;

          if (dLat && dLng && dropCoords?.lat && dropCoords?.lng) {
            const liveCalc = calculateLiveDropEta({
              driverLat: dLat,
              driverLng: dLng,
              dropLat: dropCoords.lat,
              dropLng: dropCoords.lng,
              pickupLat: pickupCoords?.lat,
              pickupLng: pickupCoords?.lng,
              status: delReq.status || o.deliveryStatus || o.status,
              currentSpeed: driverLoc?.speed || 0
            });

            enriched.etaMinutes = liveCalc.etaMinutes;
            enriched.estimatedTime = `${liveCalc.etaMinutes} mins`;
            enriched.deliveryDistance = `${liveCalc.distanceKm} km`;
            enriched.distanceKm = liveCalc.distanceKm;
          } else if (delReq.etaMinutes) {
            enriched.etaMinutes = delReq.etaMinutes;
            enriched.estimatedTime = `${delReq.etaMinutes} mins`;
            enriched.deliveryDistance = `${delReq.distanceKm || 2.5} km`;
            enriched.distanceKm = delReq.distanceKm || 2.5;
          }

          if (delReq.deliveryOtp) enriched.deliveryOtp = delReq.deliveryOtp;
          if (delReq.pickupOtp) enriched.pickupOtp = delReq.pickupOtp;
          if (driverLoc) enriched.driverLocation = driverLoc;
          if (dropCoords) enriched.deliveryAddressCoords = dropCoords;
          if (pickupCoords) enriched.pickupAddressCoords = pickupCoords;

          if (delReq.assignedDriver?.name) {
            enriched.deliveryPartnerName = delReq.assignedDriver.name;
            enriched.deliveryPartnerPhone = delReq.assignedDriver.phone;
            enriched.driver = {
              name: delReq.assignedDriver.name,
              phone: delReq.assignedDriver.phone,
              vehicle: delReq.assignedDriver.vehicleNo || 'Delivery Courier Partner',
              rating: String(delReq.assignedDriver.rating || '4.9')
            };
          }
        }

        return enriched;
      });

      return res.json({ success: true, data: enrichedList });
    }
    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  createCustomerOrder,
  getCustomerOrders,
  updateOrder,
  acceptOrder,
  rejectOrder,
  prepareOrder,
  readyOrder,
  confirmOrderPickup,
  cancelOrder,
  verifyPayment,
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder,
  computeHaversineKm,
  calculateLiveDropEta
};
