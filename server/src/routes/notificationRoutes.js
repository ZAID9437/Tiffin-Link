const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  markAsUnread, 
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.get('/preferences', protect, getNotificationPreferences);
router.patch('/preferences', protect, updateNotificationPreferences);
router.put('/preferences', protect, updateNotificationPreferences);
router.put('/read-all', protect, markAllAsRead);
router.patch('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.patch('/:id/read', protect, markAsRead);
router.put('/:id/unread', protect, markAsUnread);
router.patch('/:id/unread', protect, markAsUnread);
router.delete('/:id', protect, deleteNotification);

module.exports = router;


