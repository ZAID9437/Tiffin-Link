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

// Initial notifications template for seeding driver inbox in MongoDB
const initialDriverNotifications = (primaryRecipientId) => [
  {
    notificationId: '#NOTIF-5188',
    recipientId: primaryRecipientId,
    title: 'High-Surge Meal Request Available: #ORD-5188',
    message: 'New lunch delivery request from Pali Hill Kitchen Hub to Bandra West Sector 3. Est. payout: ₹145.00 (+25% surge). Expires in 45s.',
    category: 'Orders',
    read: false,
    priority: 'HIGH',
    referenceId: 'ORD-5188',
    referenceType: 'order',
    metadata: { orderId: 'ORD-5188', tag: 'Surge +25%', deepLink: 'delivery-requests' },
    createdAt: new Date(Date.now() - 2 * 60 * 1000)
  },
  {
    notificationId: '#NOTIF-9021',
    recipientId: primaryRecipientId,
    title: 'Weekly Payout Initiated to HDFC Bank',
    message: 'Withdrawal of ₹4,850.00 successfully processed to your primary bank account ending in **9012. Reference: #TXN-90214.',
    category: 'Payments',
    read: false,
    priority: 'MEDIUM',
    referenceId: 'TXN-90214',
    referenceType: 'payment',
    metadata: { txnId: 'TXN-90214', deepLink: 'wallet-withdrawals' },
    createdAt: new Date(Date.now() - 18 * 60 * 1000)
  },
  {
    notificationId: '#NOTIF-1024',
    recipientId: primaryRecipientId,
    title: 'Incident Follow-up: Ticket #ISS-1024',
    message: 'Hub Supervisor Capt. H. Mehta reviewed your packaging spill report on #ORD-5162. Automatic ₹65 credit approved to your courier ledger.',
    category: 'Orders',
    read: false,
    priority: 'HIGH',
    referenceId: 'ISS-1024',
    referenceType: 'safety',
    metadata: { reportId: 'ISS-1024', orderId: 'ORD-5162', deepLink: 'safety-report-issue' },
    createdAt: new Date(Date.now() - 42 * 60 * 1000)
  },
  {
    notificationId: '#NOTIF-5162',
    recipientId: primaryRecipientId,
    title: 'Pickup Window Closing in 10 Minutes',
    message: 'Consignment #ORD-5162 at Xoxo Men Kitchen is packed and sealed. Please proceed to kitchen dispatch counter for QR verification.',
    category: 'Orders',
    read: false,
    priority: 'HIGH',
    referenceId: 'ORD-5162',
    referenceType: 'order',
    metadata: { orderId: 'ORD-5162', deepLink: 'active-delivery' },
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  },
  {
    notificationId: '#NOTIF-4091',
    recipientId: primaryRecipientId,
    title: 'Customer Notified of Approach',
    message: 'Recipient Bhavin Shah notified via SMS/Push that you are within 400m of Sea Pearl Apt, 14th Road. Prepare 4-digit OTP handshake.',
    category: 'Orders',
    read: true,
    readAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    priority: 'LOW',
    referenceId: 'ORD-5162',
    referenceType: 'order',
    metadata: { orderId: 'ORD-5162', deepLink: 'active-delivery' },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    notificationId: '#NOTIF-9020',
    recipientId: primaryRecipientId,
    title: 'Quarterly Safety Attestation Required',
    message: 'Your Monsoon Defensive Driving policy revision #SAF-902 is available for electronic signature. Compliance required by 30 Sep 2026.',
    category: 'System',
    read: true,
    readAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    priority: 'MEDIUM',
    referenceId: 'SAF-902',
    referenceType: 'system',
    metadata: { policyId: 'SAF-902', deepLink: 'safety-guidelines' },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    notificationId: '#NOTIF-8812',
    recipientId: primaryRecipientId,
    title: 'Diwali Festive Courier Incentive Program',
    message: 'Earn up to ₹3,500 additional tier bonuses for maintaining >95% on-time dispatch during the upcoming Diwali festival week.',
    category: 'Payments',
    read: true,
    readAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    priority: 'LOW',
    referenceId: 'INC-2026',
    referenceType: 'payment',
    metadata: { deepLink: 'incentives-bonuses' },
    createdAt: new Date(Date.now() - 48 * 60 * 1000)
  }
];

// @desc    Get all notifications and summary metrics
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const recipientIds = getRecipientIds(req);
    const primaryRecipientId = recipientIds[0] || 'DP-4409';

    if (await isDbConnected() && recipientIds.length > 0) {
      let notifications = await Notification.find({ recipientId: { $in: recipientIds } }).sort({ createdAt: -1 }).lean();

      // Seed initial driver notifications if 0 found for this recipient
      if (notifications.length === 0) {
        try {
          const seededDocs = initialDriverNotifications(primaryRecipientId);
          await Notification.insertMany(seededDocs);
          notifications = await Notification.find({ recipientId: { $in: recipientIds } }).sort({ createdAt: -1 }).lean();
        } catch (seedErr) {
          console.warn('Seeding notifications failed:', seedErr.message);
        }
      }

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
