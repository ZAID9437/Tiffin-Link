const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  markAsUnread, 
  deleteNotification 
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/unread', protect, markAsUnread);
router.delete('/:id', protect, deleteNotification);

module.exports = router;

