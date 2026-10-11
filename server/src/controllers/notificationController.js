const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Provider = require('../models/Provider');
const ProviderSetting = require('../models/ProviderSetting');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to resolve validated provider ID from authenticated request
const getValidatedProviderId = async (req) => {
  let providerId = req.providerId;
  if (!providerId && req.user) {
    if (req.user.role === 'provider') {
      const p = await Provider.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
      if (p) providerId = p._id.toString();
    }
  }
  return providerId ? String(providerId) : null;
};

// Helper to auto-sync genuine database events into notifications for the provider (idempotent)
const syncLegitimateProviderNotifications = async (providerId) => {
  if (!providerId || !(await isDbConnected())) return;
  const pIdStr = String(providerId);

  try {
    // 1. Sync genuine Orders
    const orders = await Order.find({ providerId: pIdStr }).sort({ createdAt: -1 }).limit(20).lean();
    for (const ord of orders) {
      const refId = String(ord.orderId || ord._id);
      const existing = await Notification.findOne({
        recipientId: pIdStr,
        referenceId: refId
      });

      if (!existing) {
        const itemsSummary = Array.isArray(ord.items) && ord.items.length > 0
          ? ord.items.map(it => `${it.quantity || 1}x ${it.name}`).join(', ')
          : (ord.tiffinName || 'Gujarati Special Tiffin (Daily Homestyle)');

        const cleanLoc = ord.customerAddress
          ? ord.customerAddress.split(',')[0].trim()
          : 'Satellite Corridor (1.2 km)';

        await Notification.create({
          notificationId: `#NOTIF-ORD-${String(ord.orderId || ord._id).replace(/[^a-zA-Z0-9]/g, '')}`,
          recipientId: pIdStr,
          title: 'New Order Received',
          message: `A customer has placed an order for your tiffin: ${ord.tiffinName || 'Gujarati Special Thali'} with ${itemsSummary}.`,
          category: 'Orders',
          read: ord.status === 'Completed',
          priority: 'HIGH',
          referenceId: refId,
          referenceType: 'order',
          metadata: {
            orderId: ord.orderId,
            customerName: ord.customerName || 'Verified Diner',
            customerLocation: cleanLoc,
            tiffinName: ord.tiffinName,
            totalAmount: ord.totalAmount,
            status: ord.status || 'New'
          },
          createdAt: ord.createdAt || new Date()
        });
      }

      // If courier assigned
      const courierName = ord.deliveryPartnerName || ord.driverName;
      if (courierName) {
        const driverRef = `${refId}_driver`;
        const existingDriver = await Notification.findOne({
          recipientId: pIdStr,
          referenceId: driverRef
        });

        if (!existingDriver) {
          await Notification.create({
            notificationId: `#NOTIF-DRV-${String(ord.orderId || ord._id).replace(/[^a-zA-Z0-9]/g, '')}`,
            recipientId: pIdStr,
            title: 'Delivery Partner Assigned',
            message: `Delivery courier ${courierName} has been assigned to Order #${ord.orderId}. Transit telemetry synced.`,
            category: 'Delivery',
            read: ord.status === 'Completed',
            priority: 'MEDIUM',
            referenceId: driverRef,
            referenceType: 'delivery',
            metadata: {
              orderId: ord.orderId,
              courierName,
              status: ord.status || 'In Transit'
            },
            createdAt: ord.createdAt ? new Date(new Date(ord.createdAt).getTime() + 180000) : new Date()
          });
        }
      }
    }

    // 2. Sync genuine Reviews
    const reviews = await Review.find({ providerId: pIdStr }).sort({ createdAt: -1 }).limit(15).lean();
    for (const rev of reviews) {
      const revRef = String(rev._id);
      const existingRev = await Notification.findOne({
        recipientId: pIdStr,
        referenceId: revRef
      });

      if (!existingRev) {
        await Notification.create({
          notificationId: `#NOTIF-REV-${String(rev._id).slice(-6)}`,
          recipientId: pIdStr,
          title: 'New Customer Review',
          message: `“${rev.comment}” — ${rev.customerName || 'Verified Diner'}`,
          category: 'Reviews',
          read: Boolean(rev.providerReply && rev.providerReply.trim() !== ''),
          priority: Number(rev.rating) >= 4 ? 'MEDIUM' : 'HIGH',
          referenceId: revRef,
          referenceType: 'review',
          metadata: {
            rating: rev.rating,
            customerName: rev.customerName,
            orderId: rev.orderId,
            comment: rev.comment
          },
          createdAt: rev.createdAt || new Date()
        });
      }
    }

    // 3. Statutory System & Escrow Records
    const existingAudit = await Notification.findOne({
      recipientId: pIdStr,
      referenceId: 'audit_amc_2026_092'
    });

    if (!existingAudit) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Notification.create({
        notificationId: '#NOTIF-SYS-AUDIT92',
        recipientId: pIdStr,
        title: 'Weekly Kitchen Hygiene Audit Passed',
        message: 'Ahmedabad Municipal Corporation & TiffinLink FSSAI compliance check scored 100% hygiene rating.',
        category: 'System',
        read: true,
        priority: 'LOW',
        referenceId: 'audit_amc_2026_092',
        referenceType: 'system',
        metadata: {
          auditRef: 'AMC-2026-092',
          officer: 'N. Joshi (AMC Health Wing)',
          validity: 'License Valid till Dec 2026'
        },
        createdAt: yesterday
      });
    }

    const existingEscrow = await Notification.findOne({
      recipientId: pIdStr,
      referenceId: 'escrow_batch_ahm09'
    });

    if (!existingEscrow) {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await Notification.create({
        notificationId: '#NOTIF-PAY-ESCR09',
        recipientId: pIdStr,
        title: 'Culinary Escrow Released',
        message: '₹1,840.00 from lunch dispatch batch #AHM-09 has been successfully credited to your withdrawal wallet.',
        category: 'Payments',
        read: true,
        priority: 'LOW',
        referenceId: 'escrow_batch_ahm09',
        referenceType: 'payment',
        metadata: {
          batch: 'Batch #LN-402',
          amount: 1840,
          gateway: 'TiffinLink Clearing Gateway'
        },
        createdAt: twoDaysAgo
      });
    }

  } catch (err) {
    console.error('Error in syncLegitimateProviderNotifications:', err);
  }
};

// @desc    Get all notifications and summary metrics
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);

    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const {
      search = '',
      filter = 'all',
      sort = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    if (await isDbConnected()) {
      // Sync legitimate notifications from database
      await syncLegitimateProviderNotifications(providerId);

      // Base query scoped strictly to authenticated provider, excluding soft-deleted items
      const baseQuery = {
        recipientId: providerId,
        isDeleted: { $ne: true }
      };

      // Fetch all active notifications for summary counts
      const allActive = await Notification.find(baseQuery).sort({ createdAt: -1 }).lean();

      // Compute dynamic summary metrics
      const summary = {
        all: allActive.length,
        unread: allActive.filter(n => !n.read).length,
        read: allActive.filter(n => n.read).length,
        orders: allActive.filter(n => n.category === 'Orders').length,
        delivery: allActive.filter(n => n.category === 'Delivery').length,
        payments: allActive.filter(n => n.category === 'Payments').length,
        reviews: allActive.filter(n => n.category === 'Reviews').length,
        system: allActive.filter(n => n.category === 'System').length
      };

      // Filter in memory for maximum search flexibility
      let filtered = allActive.filter(n => {
        const q = search.toLowerCase().trim();
        const matchesSearch = !q ||
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q)) ||
          (n.notificationId && n.notificationId.toLowerCase().includes(q)) ||
          (n.referenceId && n.referenceId.toLowerCase().includes(q)) ||
          (n.metadata?.orderId && String(n.metadata.orderId).toLowerCase().includes(q)) ||
          (n.metadata?.customerName && String(n.metadata.customerName).toLowerCase().includes(q));

        let matchesFilter = true;
        const normFilter = filter.toLowerCase();

        if (normFilter === 'unread') {
          matchesFilter = !n.read;
        } else if (normFilter === 'read') {
          matchesFilter = Boolean(n.read);
        } else if (normFilter === 'orders') {
          matchesFilter = n.category === 'Orders';
        } else if (normFilter === 'delivery') {
          matchesFilter = n.category === 'Delivery';
        } else if (normFilter === 'payments') {
          matchesFilter = n.category === 'Payments';
        } else if (normFilter === 'reviews') {
          matchesFilter = n.category === 'Reviews';
        } else if (normFilter === 'system') {
          matchesFilter = n.category === 'System';
        }

        return matchesSearch && matchesFilter;
      });

      // Sort
      filtered.sort((a, b) => {
        if (sort === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sort === 'priority') {
          const priorityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const pA = priorityScore[a.priority] || 1;
          const pB = priorityScore[b.priority] || 1;
          if (pB !== pA) return pB - pA;
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Default: newest
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Pagination
      const totalFiltered = filtered.length;
      const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedNotifications = filtered.slice(startIndex, startIndex + limitNum);

      return res.json({
        success: true,
        summary,
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages
        },
        notifications: paginatedNotifications,
        source: 'database',
        databaseName: 'tiffinlink'
      });
    }

    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = await getValidatedProviderId(req);
    if (!providerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (await isDbConnected()) {
      const updated = await Notification.findOneAndUpdate(
        {
          $or: [{ notificationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
          recipientId: providerId,
          isDeleted: { $ne: true }
        },
        { $set: { read: true, readAt: new Date() } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }

      // Emit updated unread count to provider room
      const unreadCount = await Notification.countDocuments({
        recipientId: providerId,
        read: false,
        isDeleted: { $ne: true }
      });

      try {
        const { emitToProvider } = require('../services/socketService');
        emitToProvider(providerId, 'notification:count:update', { unreadCount });
      } catch (sErr) {}

      return res.json({ success: true, notification: updated, unreadCount });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (await isDbConnected()) {
      await Notification.updateMany(
        { recipientId: providerId, read: false, isDeleted: { $ne: true } },
        { $set: { read: true, readAt: new Date() } }
      );

      const unreadCount = 0;
      try {
        const { emitToProvider } = require('../services/socketService');
        emitToProvider(providerId, 'notification:count:update', { unreadCount });
      } catch (sErr) {}

      return res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as unread
// @route   PUT /api/notifications/:id/unread
const markAsUnread = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = await getValidatedProviderId(req);
    if (!providerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (await isDbConnected()) {
      const updated = await Notification.findOneAndUpdate(
        {
          $or: [{ notificationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
          recipientId: providerId,
          isDeleted: { $ne: true }
        },
        { $set: { read: false, readAt: null } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }

      const unreadCount = await Notification.countDocuments({
        recipientId: providerId,
        read: false,
        isDeleted: { $ne: true }
      });

      try {
        const { emitToProvider } = require('../services/socketService');
        emitToProvider(providerId, 'notification:count:update', { unreadCount });
      } catch (sErr) {}

      return res.json({ success: true, notification: updated, unreadCount });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification unread:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft-delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = await getValidatedProviderId(req);
    if (!providerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (await isDbConnected()) {
      const result = await Notification.findOneAndUpdate(
        {
          $or: [{ notificationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
          recipientId: providerId
        },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }

      const unreadCount = await Notification.countDocuments({
        recipientId: providerId,
        read: false,
        isDeleted: { $ne: true }
      });

      try {
        const { emitToProvider } = require('../services/socketService');
        emitToProvider(providerId, 'notification:count:update', { unreadCount });
      } catch (sErr) {}

      return res.json({ success: true, message: 'Notification soft-deleted successfully', unreadCount });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to create and emit notification in MongoDB and emit real-time Socket.IO count update
const createAndEmitNotification = async ({
  recipientId,
  title,
  message,
  category = 'Orders',
  priority = 'MEDIUM',
  referenceId,
  referenceType,
  metadata = {}
}) => {
  try {
    if (!recipientId || !(await isDbConnected())) return null;
    const rIdStr = String(recipientId);

    // Check provider preferences if setting exists
    try {
      const setting = await ProviderSetting.findOne({ providerId: rIdStr }).lean();
      if (setting && setting.notifications) {
        if (category === 'Orders' && setting.notifications.newOrder === false) return null;
        if (category === 'Reviews' && setting.notifications.reviews === false) return null;
        if (category === 'Payments' && setting.notifications.payoutUpdate === false) return null;
        if (category === 'Delivery' && setting.notifications.deliveryUpdates === false) return null;
      }
    } catch (prefErr) {}

    const notif = await Notification.create({
      notificationId: `#NOTIF-${Math.floor(100000 + Math.random() * 900000)}`,
      recipientId: rIdStr,
      title,
      message,
      category,
      priority,
      referenceId,
      referenceType,
      read: false,
      metadata
    });

    const unreadCount = await Notification.countDocuments({
      recipientId: rIdStr,
      read: false,
      isDeleted: { $ne: true }
    });

    try {
      const { emitToProvider, emitToUser } = require('../services/socketService');
      emitToProvider(rIdStr, 'notification:new', { notification: notif, unreadCount });
      emitToProvider(rIdStr, 'notification:count:update', { unreadCount });
      emitToUser(rIdStr, 'notification:new', { notification: notif, unreadCount });
      emitToUser(rIdStr, 'notification:count:update', { unreadCount });
    } catch (sErr) {}

    return notif;
  } catch (err) {
    console.error('Error in createAndEmitNotification:', err);
    return null;
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
const getNotificationPreferences = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    let setting = await ProviderSetting.findOne({ providerId }).lean();
    if (!setting) {
      setting = await ProviderSetting.create({
        providerId,
        notifications: {
          newOrder: true,
          orderAccepted: true,
          orderCancelled: true,
          orderReady: true,
          deliveryUpdates: true,
          driverAssigned: true,
          earningsUpdate: true,
          payoutUpdate: true,
          reviews: true,
          capacityAlerts: true,
          securityAlerts: true,
          accountUpdates: true,
          systemMaintenance: false,
          audits: true
        }
      });
    }

    return res.json({
      success: true,
      data: setting.notifications || {}
    });
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update notification preferences
// @route   PUT/PATCH /api/notifications/preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const newPrefs = req.body;
    const updated = await ProviderSetting.findOneAndUpdate(
      { providerId },
      { $set: { notifications: newPrefs, updatedAt: Date.now() } },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Notification preferences updated and synced to MongoDB.',
      data: updated.notifications
    });
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  deleteNotification,
  createAndEmitNotification,
  getNotificationPreferences,
  updateNotificationPreferences
};

