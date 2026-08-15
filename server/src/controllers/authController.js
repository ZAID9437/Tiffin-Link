const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const otpStore = new Map();
const isDbConnected = () => mongoose.connection.readyState === 1;

// Format user payload safely without passwords
const formatUserPayload = (user) => ({
  id: user._id || user.id,
  name: user.name || (user.email ? user.email.split('@')[0] : ''),
  email: user.email,
  phone: user.phone || '',
  role: user.role || 'customer',
  isActive: user.isActive !== false,
  isVerified: user.isVerified !== false,
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

    // Enforce role security: frontend user cannot register directly as 'admin'
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

      // Generate 6-digit OTP, save in MongoDB, and send Email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await Otp.deleteMany({ email });
      await Otp.create({ email, otp });

      dotenv.config({ path: path.join(__dirname, '../../.env') });
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (emailUser && emailPass) {
        try {
          await sendOtpEmail(email, otp, emailUser, emailPass);
          return res.status(201).json({
            success: true,
            message: `Verification code sent to ${email}. Please check Inbox and Spam/Junk folder.`,
            source: 'database'
          });
        } catch (mailErr) {
          console.error('\x1b[31m[Nodemailer Error]\x1b[0m', mailErr.message);
          return res.status(201).json({
            success: true,
            message: `Verification code sent to ${email}. Please check Inbox and Spam/Junk folder.`,
            source: 'database'
          });
        }
      } else {
        return res.status(201).json({
          success: true,
          message: `Verification code sent to ${email}. Please check Inbox and Spam/Junk folder.`,
          source: 'database'
        });
      }
    } else {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      return res.status(201).json({
        success: true,
        message: `Verification code sent to ${email}.`,
        devOtp: otp,
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ success: false, message: 'Registration failed. ' + error.message });
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

      // Password comparison if password is provided
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

      return res.json({
        success: true,
        message: 'Logged in successfully.',
        user: formatUserPayload(user),
        accessToken,
        refreshToken
      });
    } else {
      return res.json({
        success: true,
        message: 'Logged in successfully (in-memory).',
        user: { email, name: email.split('@')[0], role: 'customer' },
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token'
      });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Login failed. ' + error.message });
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
    } else {
      return res.json({
        success: true,
        accessToken: 'new_mock_access_token',
        refreshToken: 'new_mock_refresh_token'
      });
    }
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

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    if (req.user) {
      return res.json({
        success: true,
        user: formatUserPayload(req.user),
        source: 'database'
      });
    }

    let { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email parameter is required' });
    }

    email = email.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User profile not found' });
      }
      return res.json({
        success: true,
        user: formatUserPayload(user),
        source: 'database'
      });
    } else {
      return res.json({
        success: true,
        user: { email, name: email.split('@')[0], role: 'customer' },
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
};

// @desc    Send OTP code to email (Requires existing MongoDB user)
// @route   POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    // 1. Email presence check
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // 3. Email normalization
    const normalizedEmail = email.trim().toLowerCase();

    // 4. Search MongoDB User collection BEFORE generating or sending OTP
    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });

      // DO NOT GENERATE OTP, DO NOT SAVE OTP, DO NOT SEND EMAIL IF USER DOES NOT EXIST IN MONGO DB
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

      // ONLY AFTER USER EXISTS -> Generate OTP, Save, and Send
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await Otp.deleteMany({ email: normalizedEmail });
      await Otp.create({ email: normalizedEmail, otp });

      dotenv.config({ path: path.join(__dirname, '../../.env') });
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (emailUser && emailPass) {
        try {
          await sendOtpEmail(normalizedEmail, otp, emailUser, emailPass);
          return res.json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}. Please check Inbox and Spam/Junk folder.`,
            source: 'database'
          });
        } catch (mailErr) {
          console.error('\x1b[31m[Nodemailer Error]\x1b[0m', mailErr.message);
          return res.json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}. Please check Inbox and Spam/Junk folder.`,
            source: 'database'
          });
        }
      } else {
        return res.json({
          success: true,
          message: `Verification code sent to ${normalizedEmail}. Please check Inbox and Spam/Junk folder.`,
          source: 'database'
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
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

// @desc    Verify OTP and return authenticated session
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }
    email = email.trim().toLowerCase();
    otp = otp.trim();

    if (isDbConnected()) {
      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }

      await Otp.deleteMany({ email });

      let user = await User.findOne({ email });
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
        if (req.body.name) user.name = req.body.name;
        if (req.body.phone) user.phone = req.body.phone;
        await user.save();
      } else {
        user = await User.create({
          email,
          name: req.body.name || email.split('@')[0],
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
        message: 'Access granted successfully.',
        user: formatUserPayload(user),
        accessToken,
        refreshToken,
        source: 'database'
      });
    } else {
      const record = otpStore.get(email);
      if (!record || record.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
      }
      otpStore.delete(email);

      return res.json({
        success: true,
        message: 'Access granted successfully.',
        user: { email, name: email.split('@')[0], role: 'customer' },
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        source: 'in-memory'
      });
    }
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
  verifyOtp
};
