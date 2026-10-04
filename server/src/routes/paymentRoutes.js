const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  calculateAmount,
  createPaymentOrder,
  verifyPayment,
  recordPaymentFailure
} = require('../controllers/paymentController');

// Optional authentication middleware for guest & logged-in checkout support
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.tiffinlink_token || req.cookies?.token) {
    token = req.cookies.tiffinlink_token || req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026'
      );
      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Continue as guest
    }
  }
  next();
};

router.post('/calculate', optionalAuth, calculateAmount);
router.post('/create-order', optionalAuth, createPaymentOrder);
router.post('/verify-payment', optionalAuth, verifyPayment);
router.post('/payment-failed', optionalAuth, recordPaymentFailure);

module.exports = router;
