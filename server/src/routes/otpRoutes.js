const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpCode } = require('../controllers/otpController');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpCode);

module.exports = router;
