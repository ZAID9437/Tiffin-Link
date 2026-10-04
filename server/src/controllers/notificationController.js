const Notification = require('../models/Notification');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to get array of valid recipient IDs for the authenticated user/provider/driver
const getRecipientIds = (req) => {
  const ids = [];
  if (req.providerId) ids.push(req.providerId.toString());
  if (req.driverId) ids.push(req.driverId.toString());
  if (req.driver?.driverId) ids.push(req.driver.driverId.toString());
  if (req.driver?._id) ids.push(req.driver._id.toString());
  if (req.user?._id) ids.push(req.user._id.toString());
  if (req.user?.id) ids.push(req.user.id.toString());
  if (req.user?.driverId) ids.push(req.user.driverId.toString());
  if (req.query?.driverId) ids.push(req.query.driverId.toString());
  if (req.body?.driverId) ids.push(req.body.driverId.toString());
  if (req.query?.email) ids.push(req.query.email.toString());
  if (req.user?.email) ids.push(req.user.email.toString());
  return Array.from(new Set(ids.filter(Boolean)));
};

// @desc    Get all notifications and summary metrics
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const recipientIds = getRecipientIds(req);

    if (await isDbConnected() && recipientIds.length > 0) {
      const notifications = await Notification.find({ recipientId: { $in: recipientIds } }).sort({ createdAt: -1 }).lean();

      const summary = {
        all: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        important: notifications.filter(n => n.priority === 'HIGH' || n.priority === 'CRITICAL').length,
        orders: notifications.filter(n => n.category === 'Orders' || n.category === 'Delivery').length,
        payments: notifications.filter(n => n.category === 'Payments').length,
        system: notifications.filter(n => n.category === 'System').length
      };

      return res.json({
        success: true,
        summary,
        notifications,
        source: 'database',
        databaseName: 'tiffinlink'
      });
    } else {
      return res.json({
        success: true,
        summary: { all: 0, unread: 0, important: 0, orders: 0, payments: 0, system: 0 },
        notifications: [],
        source: 'in-memory'
      });
    }
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
    const recipientIds = getRecipientIds(req);
    if (await isDbConnected() && recipientIds.length > 0) {
      const updated = await Notification.findOneAndUpdate(
        { 
          $or: [{ notificationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }], 
          recipientId: { $in: recipientIds } 
        },
        { $set: { read: true, readAt: new Date() } },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }

      // Emit updated unread count to socket clients
      const unreadCount = await Notification.countDocuments({ recipientId: { $in: recipientIds }, read: false });
      try {
        const { emitToUser, emitToProvider } = require('../services/socketService');
        recipientIds.forEach(rId => {
          emitToUser(rId, 'notification:count:update', { unreadCount });
          emitToProvider(rId, 'notification:count:update', { unreadCount });
        });
      } catch (sErr) {
        console.warn('Socket emit error on markAsRead:', sErr.message);
      }

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
    const recipientIds = getRecipientIds(req);
    if (await isDbConnected() && recipientIds.length > 0) {
      await Notification.updateMany(
        { recipientId: { $in: recipientIds }, read: false }, 
        { $set: { read: true, readAt: new Date() } }
      );

      const unreadCount = 0;
      try {
        const { emitToUser, emitToProvider } = require('../services/socketService');
        recipientIds.forEach(rId => {
          emitToUser(rId, 'notification:count:update', { unreadCount });
          emitToProvider(rId, 'notification:count:update', { unreadCount });
        });
      } catch (sErr) {
        console.warn('Socket emit error on markAllAsRead:', sErr.message);
      }

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
    const recipientIds = getRecipientIds(req);
    if (await isDbConnected() && recipientIds.length > 0) {
      const updated = await Notification.findOneAndUpdate(
        { notificationId: id, recipientId: { $in: recipientIds } },
        { $set: { read: false } },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }
      return res.json({ success: true, notification: updated });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification unread:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientIds = getRecipientIds(req);
    if (await isDbConnected() && recipientIds.length > 0) {
      const result = await Notification.deleteOne({ notificationId: id, recipientId: { $in: recipientIds } });
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }
      return res.json({ success: true, message: 'Notification deleted successfully' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to create notification in MongoDB and emit real-time Socket.IO count update
const createAndEmitNotification = async ({ recipientId, title, message, category, metadata }) => {
  try {
    if (!recipientId || !(await isDbConnected())) return null;

    const notif = await Notification.create({
      notificationId: `#NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientId: String(recipientId),
      title,
      message,
      category: category || 'Orders',
      read: false,
      metadata: metadata || {}
    });

    const unreadCount = await Notification.countDocuments({ recipientId: String(recipientId), read: false });

    try {
      const { emitToUser, emitToProvider } = require('../services/socketService');
      emitToUser(recipientId, 'notification:new', { notification: notif, unreadCount });
      emitToUser(recipientId, 'notification:count:update', { unreadCount });
      emitToProvider(recipientId, 'notification:new', { notification: notif, unreadCount });
      emitToProvider(recipientId, 'notification:count:update', { unreadCount });
    } catch (sErr) {
      console.warn('Socket notification emit error:', sErr.message);
    }

    return notif;
  } catch (err) {
    console.error('Error in createAndEmitNotification:', err);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  deleteNotification,
  createAndEmitNotification
};
