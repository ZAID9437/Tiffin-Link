const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Cryptographically secure 6-digit numeric OTP generator
const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// SHA-256 OTP hashing helper
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

// Format user payload safely without passwords
const formatUserPayload = (user) => ({
  id: user._id || user.id,
  name: user.name || (user.email ? user.email.split('@')[0] : ''),
  email: user.email,
  phone: user.phone || '',
  role: user.role || 'customer',
  isActive: user.isActive !== false,
  isVerified: user.isVerified !== false,
  emailVerified: user.isVerified !== false,
  lastLogin: user.lastLogin
});

// User-friendly display names for roles
const getRoleDisplayName = (role) => {
  if (role === 'customer') return 'Diner';
  if (role === 'provider') return 'Provider';
  if (role === 'delivery') return 'Deliverer';
  if (role === 'admin') return 'Admin';
  return role || 'Diner';
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    let { name, email, phone, password, role } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    email = email.trim().toLowerCase();
    name = name ? name.trim() : email.split('@')[0];
    phone = phone ? phone.trim() : '';

    const allowedRole = (role === 'provider' || role === 'delivery' || role === 'customer') ? role : 'customer';

    if (isDbConnected()) {
      let user = await User.findOne({ email });

      if (user && user.isVerified && user.password) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.'
        });
      }

      if (!user) {
        user = new User({
          email,
          name,
          phone,
          password: password || undefined,
          role: allowedRole,
          isVerified: false,
          isActive: true
        });
      } else {
        user.name = name;
        user.phone = phone;
        if (password) user.password = password;
        user.role = allowedRole;
      }

      await user.save();

      // Generate cryptographically secure 6-digit OTP & store hashed OTP with 10 min expiry
      const otpCode = generateSecureOtp();
      const hashedOtpCode = hashOtp(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await Otp.deleteMany({ email });
      await Otp.create({
        email,
        otp: otpCode,
        hashedOtp: hashedOtpCode,
        purpose: 'EMAIL_VERIFICATION',
        attempts: 0,
        expiresAt
      });

      dotenv.config({ path: path.join(__dirname, '../../.env') });
      const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
      const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

      const mailResult = await sendOtpEmail(email, otpCode, emailUser, emailPass, 'TiffinLink — Your Email Verification Code', name);

      if (!mailResult.success) {
        console.error(`[OTP Send Failure] Failed to send verification email to ${email}:`, mailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Unable to send verification email. Please try again.'
        });
      }

      return res.status(201).json({
        success: true,
        message: `Verification code sent to ${email}. Please check Inbox and Spam/Junk folder.`,
        source: 'database'
      });
    } else {
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
  }
};

// @desc    Authenticate user & get JWT tokens
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    email = email.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ email }).select('+password +refreshToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email. Please register first.'
        });
      }

      if (req.body.role && user.role !== req.body.role) {
        const expectedRoleTitle = getRoleDisplayName(user.role);
        return res.status(400).json({
          success: false,
          message: `This account is registered as a ${expectedRoleTitle}. Please select the ${expectedRoleTitle} tab to log in.`
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.'
        });
      }

      if (password && user.password) {
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
        }
      }

      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      res.cookie('tiffinlink_token', accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      });
      if (req.session) {
        req.session.user = formatUserPayload(user);
      }

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        user: formatUserPayload(user),
        accessToken,
        refreshToken
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET || 'tiffinlink_super_secret_refresh_token_key_2026'
      );
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    if (isDbConnected()) {
      const user = await User.findById(decoded.userId).select('+refreshToken');

      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token session' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
      }

      const newAccessToken = generateAccessToken(user._id, user.role);
      const newRefreshToken = generateRefreshToken(user._id);

      user.refreshToken = newRefreshToken;
      await user.save();

      return res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: formatUserPayload(user)
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
};

// @desc    Logout user / clear refresh token
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && isDbConnected()) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET || 'tiffinlink_super_secret_refresh_token_key_2026'
        );
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
      } catch (e) {
        // Token already expired/invalid
      }
    }

    res.clearCookie('tiffinlink_token');
    res.clearCookie('tiffinlink_session');
    if (req.session) {
      req.session.destroy();
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// @desc    Get current authenticated user profile from MongoDB
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const freshUser = await User.findById(req.user._id || req.user.id).select('-password');
    if (!freshUser) {
      return res.status(404).json({ success: false, message: 'User record not found' });
    }

    const userPayload = formatUserPayload(freshUser);
    if (freshUser.role === 'provider' && req.providerId) {
      userPayload.providerId = req.providerId;
      if (req.provider) {
        userPayload.providerName = req.provider.name || req.provider.businessName;
      }
    }
    if ((freshUser.role === 'delivery' || freshUser.role === 'driver') && req.driverId) {
      userPayload.driverId = req.driverId;
      if (req.driver) {
        userPayload.driverName = req.driver.name;
      }
    }

    return res.json({
      success: true,
      user: userPayload,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
};

// @desc    Send OTP code to email (Requires existing MongoDB user)
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    let email = req.user?.email || req.body.email;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }

      if (req.body.role && existingUser.role !== req.body.role) {
        const expectedRoleTitle = getRoleDisplayName(existingUser.role);
        return res.status(400).json({
          success: false,
          message: `This account is registered as a ${expectedRoleTitle}. Please select the ${expectedRoleTitle} tab to log in.`
        });
      }

      // Generate cryptographically secure 6-digit OTP & store hashed OTP with 10 min expiry
      const otpCode = generateSecureOtp();
      const hashedOtpCode = hashOtp(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Invalidate existing OTPs for this email before creating new one (Requirement 10)
      await Otp.deleteMany({ email: normalizedEmail });
      await Otp.create({
        email: normalizedEmail,
        otp: otpCode,
        hashedOtp: hashedOtpCode,
        purpose: 'EMAIL_VERIFICATION',
        attempts: 0,
        expiresAt
      });

      dotenv.config({ path: path.join(__dirname, '../../.env') });
      const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
      const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

      const mailResult = await sendOtpEmail(normalizedEmail, otpCode, emailUser, emailPass, 'TiffinLink — Your Email Verification Code', existingUser.name);

      if (!mailResult.success) {
        console.error(`[OTP Send Failure] Failed to send verification email to ${normalizedEmail}:`, mailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Unable to send verification email. Please try again.'
        });
      }

      return res.json({
        success: true,
        message: `Verification code sent to ${normalizedEmail}. Please check Inbox and Spam/Junk folder.`,
        source: 'database'
      });
    } else {
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
};

// @desc    Forgot Password - Send OTP for password reset
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  return sendOtp(req, res);
};

// @desc    Verify OTP and update user email verification status in MongoDB
// @route   POST /api/auth/verify-otp & POST /api/auth/verify-email-otp
const verifyOtp = async (req, res) => {
  try {
    let email = req.user?.email || req.body.email;
    let submittedOtp = req.body.otp;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!submittedOtp || typeof submittedOtp !== 'string' || submittedOtp.trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit verification code' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    submittedOtp = submittedOtp.trim();
    const submittedHash = hashOtp(submittedOtp);

    if (isDbConnected()) {
      const otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }

      // Check Expiration (Requirement 9: 10 mins max)
      if (otpRecord.expiresAt && new Date(otpRecord.expiresAt) < new Date()) {
        await Otp.deleteMany({ email: normalizedEmail });
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new code.'
        });
      }

      // Check Attempt Limit (Requirement 8: Max 5 attempts)
      if ((otpRecord.attempts || 0) >= 5) {
        await Otp.deleteMany({ email: normalizedEmail });
        return res.status(400).json({
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new code.'
        });
      }

      // Compare OTP (Hash comparison or fallback plaintext match)
      const isMatch = (otpRecord.hashedOtp === submittedHash) || (otpRecord.otp === submittedOtp);

      if (!isMatch) {
        otpRecord.attempts = (otpRecord.attempts || 0) + 1;
        await otpRecord.save();

        if (otpRecord.attempts >= 5) {
          await Otp.deleteMany({ email: normalizedEmail });
          return res.status(400).json({
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new code.'
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid verification code.'
        });
      }

      // OTP MATCH SUCCESS (Requirement 7)
      await Otp.deleteMany({ email: normalizedEmail });

      let user = await User.findOne({ email: normalizedEmail });
      if (user) {
        if (req.body.role && user.role !== req.body.role) {
          const expectedRoleTitle = getRoleDisplayName(user.role);
          return res.status(400).json({
            success: false,
            message: `This account is registered as a ${expectedRoleTitle}. Please select the ${expectedRoleTitle} tab to log in.`
          });
        }

        user.lastLogin = new Date();
        user.isVerified = true;
        if (req.body.name) user.name = req.body.name.trim();
        if (req.body.phone) user.phone = req.body.phone.trim();
        await user.save();
      } else {
        user = await User.create({
          email: normalizedEmail,
          name: req.body.name || normalizedEmail.split('@')[0],
          phone: req.body.phone || '',
          role: req.body.role || 'customer',
          isVerified: true,
          isActive: true,
          lastLogin: new Date()
        });
      }

      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      return res.json({
        success: true,
        message: 'Email verified successfully.',
        user: formatUserPayload(user),
        accessToken,
        refreshToken,
        source: 'database'
      });
    }

    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  sendOtp,
  forgotPassword,
  verifyOtp,
  verifyEmailOtp: verifyOtp
};
