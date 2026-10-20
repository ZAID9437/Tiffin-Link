const express = require('express');
const router = express.Router();
const { notificationAuth } = require('../middleware/authMiddleware');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  markAsUnread, 
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} = require('../controllers/notificationController');

router.get('/', notificationAuth, getNotifications);
router.get('/preferences', notificationAuth, getNotificationPreferences);
router.patch('/preferences', notificationAuth, updateNotificationPreferences);
router.put('/preferences', notificationAuth, updateNotificationPreferences);
router.put('/read-all', notificationAuth, markAllAsRead);
router.patch('/read-all', notificationAuth, markAllAsRead);
router.put('/:id/read', notificationAuth, markAsRead);
router.patch('/:id/read', notificationAuth, markAsRead);
router.put('/:id/unread', notificationAuth, markAsUnread);
router.patch('/:id/unread', notificationAuth, markAsUnread);
router.delete('/:id', notificationAuth, deleteNotification);

module.exports = router;


