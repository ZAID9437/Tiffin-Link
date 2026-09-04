const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const calculateBillBreakdown = (qty, price, distanceKm = 3.2) => {
  const quantity = Number(qty) || 1;
  const unitPrice = Number(price) || 100;
  const subtotal = quantity * unitPrice;
  const km = Number(distanceKm) || 3.2;
  const deliveryFee = Math.round(25 + (km * 8)); // Base ₹25 + ₹8 per km
  const packagingFee = 15;
  const gstTax = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + deliveryFee + packagingFee + gstTax;

  return {
    quantity,
    unitPrice,
    subtotal,
    deliveryKm: km,
    deliveryFee,
    packagingFee,
    gstTax,
    totalAmount
  };
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

// @desc    Get all orders from MongoDB
// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const orders = await Order.find({ providerId }).sort({ createdAt: -1 });
      return res.json({ success: true, data: orders, source: 'database', databaseName: 'tiffinlink' });
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
      deliveryStatus: 'Unassigned'
    };

    if (await isDbConnected()) {
      const newOrder = new Order(orderData);
      await newOrder.save();
      return res.status(201).json({ 
        success: true, 
        message: 'Order created successfully with Bill Receipt', 
        data: newOrder, 
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
      const updated = await Order.findOneAndUpdate({ _id: id, providerId }, updateData, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
      }
      return res.json({ success: true, message: 'Order updated successfully', data: updated });
    }
    return res.json({ success: true, message: 'Order updated (in-memory)', data: req.body });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
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
      const updatedOrder = await Order.findOneAndUpdate(
        { 
          _id: id, 
          providerId,
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
      const updated = await Order.findOneAndUpdate({ _id: id, providerId }, updateFields, { new: true });
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
      const deleted = await Order.findOneAndDelete({ _id: id, providerId });
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

module.exports = {
  getOrders,
  createOrder,
  updateOrder,
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder
};
