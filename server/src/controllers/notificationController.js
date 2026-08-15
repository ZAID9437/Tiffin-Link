const Notification = require('../models/Notification');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Get all notifications and summary metrics
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    if (await isDbConnected()) {
      const notifications = await Notification.find().sort({ createdAt: -1 });

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
    if (await isDbConnected()) {
      const updated = await Notification.findOneAndUpdate(
        { notificationId: id },
        { $set: { read: true } },
        { new: true }
      );
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
    if (await isDbConnected()) {
      await Notification.updateMany({}, { $set: { read: true } });
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
    if (await isDbConnected()) {
      const updated = await Notification.findOneAndUpdate(
        { notificationId: id },
        { $set: { read: false } },
        { new: true }
      );
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
    if (await isDbConnected()) {
      await Notification.deleteOne({ notificationId: id });
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
