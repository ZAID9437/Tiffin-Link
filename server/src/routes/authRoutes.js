const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  refresh, 
  logout, 
  getMe, 
  sendOtp,
  forgotPassword,
  verifyOtp 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/send-otp', sendOtp);
router.post('/send-email-otp', sendOtp);
router.post('/reverify-email', sendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/verify-email-otp', verifyOtp);

module.exports = router;
