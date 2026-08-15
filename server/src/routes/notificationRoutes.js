const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  markAsUnread, 
  deleteNotification 
} = require('../controllers/notificationController');

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.put('/:id/unread', markAsUnread);
router.delete('/:id', deleteNotification);

module.exports = router;
