const { startTwilioVerification, checkTwilioVerification, normalizeE164 } = require('../services/twilioService');

// @desc    Send OTP via SMS or WhatsApp using Twilio Verify API
// @route   POST /api/otp/send-otp
const sendOtp = async (req, res) => {
  try {
    const { phone, channel } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const result = await startTwilioVerification(phone, channel || 'sms');
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in sendOtp controller:', error);
    res.status(500).json({ success: false, message: 'Unable to send OTP. Please try again.' });
  }
};

// @desc    Verify OTP using Twilio Verify API Check
// @route   POST /api/otp/verify-otp
const verifyOtpCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
    }

    const result = await checkTwilioVerification(phone, code);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Error in verifyOtpCode controller:', error);
    res.status(500).json({ success: false, message: 'Unable to verify OTP. Please try again.' });
  }
};

module.exports = {
  sendOtp,
  verifyOtpCode
};
