const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getSubscriptions,
  getCustomerSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription
} = require('../controllers/subscriptionController');

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.tiffinlink_token || req.cookies?.token) {
    token = req.cookies.tiffinlink_token || req.cookies.token;
  }
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026');
      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');
      if (user) req.user = user;
    } catch (e) {}
  }
  next();
};

router.get('/my-subscriptions', optionalProtect, getCustomerSubscriptions);
router.get('/', protect, requireProvider, getSubscriptions);
router.post('/', protect, requireProvider, createSubscription);
router.put('/:id', protect, requireProvider, updateSubscription);
router.delete('/:id', protect, requireProvider, deleteSubscription);

module.exports = router;
