const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription
} = require('../controllers/subscriptionController');

router.get('/', protect, requireProvider, getSubscriptions);
router.post('/', protect, requireProvider, createSubscription);
router.put('/:id', protect, requireProvider, updateSubscription);
router.delete('/:id', protect, requireProvider, deleteSubscription);

module.exports = router;
