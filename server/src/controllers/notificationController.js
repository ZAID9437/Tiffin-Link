const Notification = require('../models/Notification');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to get array of valid recipient IDs for the authenticated user/provider
const getRecipientIds = (req) => {
  const ids = [];
  if (req.providerId) ids.push(req.providerId.toString());
  if (req.user?._id) ids.push(req.user._id.toString());
  if (req.user?.id) ids.push(req.user.id.toString());
  return Array.from(new Set(ids));
};

// @desc    Get all notifications and summary metrics
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const recipientIds = getRecipientIds(req);

    if (await isDbConnected() && recipientIds.length > 0) {
      const notifications = await Notification.find({ recipientId: { $in: recipientIds } }).sort({ createdAt: -1 });

      const summary = {
        all: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        orders: notifications.filter(n => n.category === 'Orders').length,
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
        summary: { all: 0, unread: 0, orders: 0, system: 0 },
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
        { notificationId: id, recipientId: { $in: recipientIds } },
        { $set: { read: true } },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
      }
      return res.json({ success: true, notification: updated });
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
      await Notification.updateMany({ recipientId: { $in: recipientIds } }, { $set: { read: true } });
      return res.json({ success: true, message: 'All notifications marked as read' });
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

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  deleteNotification
};
