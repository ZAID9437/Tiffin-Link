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

const defaultInitialOrders = [
  {
    orderId: '#1024',
    customerName: 'Raj Patel',
    customerPhone: '+91 98250 12345',
    customerAddress: '402 Sunrise Towers, Navrangpura, Ahmedabad',
    tiffinName: 'Gujarati Home Thali',
    tiffinCategory: 'Gujarati',
    tiffinImage: '/assets/provider_1.png',
    quantity: 2,
    unitPrice: 120,
    subtotal: 240,
    deliveryKm: 3.2,
    deliveryFee: 50,
    packagingFee: 15,
    gstTax: 12,
    totalAmount: 317,
    paymentStatus: 'Paid',
    status: 'Preparing',
    deliveryStatus: 'Searching',
    createdAt: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    orderId: '#1025',
    customerName: 'Amit Shah',
    customerPhone: '+91 99798 54321',
    customerAddress: 'B-12 Shrinand Nagar, Vejalpur, Ahmedabad',
    tiffinName: 'Jain Special Thali',
    tiffinCategory: 'Jain',
    tiffinImage: '/assets/provider_3.png',
    quantity: 3,
    unitPrice: 140,
    subtotal: 420,
    deliveryKm: 4.5,
    deliveryFee: 61,
    packagingFee: 15,
    gstTax: 21,
    totalAmount: 517,
    paymentStatus: 'Cash on Delivery',
    status: 'Ready',
    deliveryStatus: 'Searching',
    createdAt: new Date(Date.now() - 1000 * 60 * 90)
  },
  {
    orderId: '#1026',
    customerName: 'Neha Patel',
    customerPhone: '+91 94260 98765',
    customerAddress: '701 Iscon Elegance, Prahlad Nagar, Ahmedabad',
    tiffinName: 'Kathiyawadi Special Combo',
    tiffinCategory: 'Kathiyawadi',
    tiffinImage: '/assets/provider_2.png',
    quantity: 1,
    unitPrice: 150,
    subtotal: 150,
    deliveryKm: 2.5,
    deliveryFee: 45,
    packagingFee: 15,
    gstTax: 8,
    totalAmount: 218,
    paymentStatus: 'Paid',
    status: 'Completed',
    deliveryStatus: 'Delivered',
    deliveryPartnerName: 'Rahul M.',
    deliveryPartnerPhone: '+91 98765 11223',
    createdAt: new Date(Date.now() - 1000 * 60 * 180)
  },
  {
    orderId: '#1027',
    customerName: 'Vikram Mehta',
    customerPhone: '+91 98980 11223',
    customerAddress: 'A-101 Green Acres, Satellite, Ahmedabad',
    tiffinName: 'Panjabi Deluxe Thali',
    tiffinCategory: 'Panjabi',
    tiffinImage: '/assets/provider_4.png',
    quantity: 2,
    unitPrice: 160,
    subtotal: 320,
    deliveryKm: 5.0,
    deliveryFee: 65,
    packagingFee: 15,
    gstTax: 16,
    totalAmount: 416,
    paymentStatus: 'Paid',
    status: 'New',
    deliveryStatus: 'Unassigned',
    createdAt: new Date(Date.now() - 1000 * 60 * 10)
  },
  {
    orderId: '#1028',
    customerName: 'Pooja Sharma',
    customerPhone: '+91 97129 44556',
    customerAddress: '304 Safal Paris, South Boper, Ahmedabad',
    tiffinName: 'Gujarati Home Thali',
    tiffinCategory: 'Gujarati',
    tiffinImage: '/assets/provider_1.png',
    quantity: 1,
    unitPrice: 120,
    subtotal: 120,
    deliveryKm: 3.2,
    deliveryFee: 50,
    packagingFee: 15,
    gstTax: 6,
    totalAmount: 191,
    paymentStatus: 'Cash on Delivery',
    status: 'Cancelled',
    deliveryStatus: 'Unassigned',
    cancellationReason: 'Customer requested cancellation due to change of plans.',
    createdAt: new Date(Date.now() - 1000 * 60 * 240)
  }
];

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
      deliveryStatus: 'Searching'
    };

    if (await isDbConnected()) {
      const newOrder = new Order(orderData);
      await newOrder.save();
      try {
        const { reconcileMissingDeliveryRequests } = require('./deliveryDispatchController');
        await reconcileMissingDeliveryRequests();
      } catch (rErr) {
        console.warn('Reconciliation error in createOrder:', rErr.message);
      }
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

    if (updateData.status === 'Ready' && (!updateData.deliveryStatus || updateData.deliveryStatus === 'Unassigned')) {
      updateData.deliveryStatus = 'Searching';
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
    const providerId = req.providerId;
    const { partnerName, partnerPhone } = req.body;

    const deliveryPartnerName = partnerName || 'Rahul M.';
    const deliveryPartnerPhone = partnerPhone || '+91 98765 11223';

    if (await isDbConnected()) {
      const query = buildOrderLookupQuery(id, providerId);
      const updatedOrder = await Order.findOneAndUpdate(
        { 
          ...query,
          status: 'Ready',
          deliveryStatus: { $in: ['Unassigned', 'Searching'] }
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
          message: 'Delivery offer is no longer available or unauthorized.' 
        });
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

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  acceptOrder,
  rejectOrder,
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder
};
