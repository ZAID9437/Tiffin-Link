const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Driver = require('../models/Driver');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026'
      );

      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found. Authorization denied.' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
      }

      req.user = user;

      // If user is a Provider, bind their authenticated Provider record & providerId
      if (user.role === 'provider') {
        let provider = await Provider.findOne({
          $or: [{ userId: user._id }, { email: user.email }]
        });

        if (!provider) {
          provider = await Provider.create({
            userId: user._id,
            name: user.name || 'Artisanal Home Kitchen',
            businessName: user.name || 'Artisanal Home Kitchen',
            description: 'Authentic home-cooked meals prepared with fresh ingredients.',
            email: user.email,
            mobile: user.phone || '',
            status: 'active'
          });
        } else if (!provider.userId) {
          provider.userId = user._id;
          await provider.save();
        }

        req.provider = provider;
        req.providerId = provider._id.toString();
      }

      // If user is a Driver / Delivery partner, bind their authenticated Driver record & driverId
      if (user.role === 'delivery' || user.role === 'driver' || user.role === 'delivery_partner') {
        let driver = await Driver.findOne({
          $or: [
            { userId: user._id },
            { email: user.email },
            { phone: user.phone }
          ]
        });

        if (driver) {
          req.driver = driver;
          req.driverId = driver.driverId || driver._id.toString();
        } else {
          req.driverId = user.driverId || user._id.toString();
        }
      }

      return next();
    } catch (error) {
      if (error.name !== 'TokenExpiredError') {
        console.error('JWT Authentication Error:', error.message);
      }
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  // If token is missing, check if specific identity email/phone query parameter was explicitly provided
  const email = req.query?.email || req.body?.email || '';
  const phone = req.query?.phone || req.body?.phone || '';

  if (email || phone) {
    try {
      const queryOr = [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : [])
      ];

      const user = await User.findOne({ $or: queryOr }).select('-password');
      if (user && user.isActive !== false) {
        req.user = user;
        if (user.role === 'provider') {
          const provider = await Provider.findOne({ $or: [{ userId: user._id }, { email: user.email }] });
          if (provider) {
            req.provider = provider;
            req.providerId = provider._id.toString();
          }
        } else if (user.role === 'delivery' || user.role === 'driver' || user.role === 'delivery_partner') {
          const driver = await Driver.findOne({ $or: [{ userId: user._id }, { email: user.email }] });
          if (driver) {
            req.driver = driver;
            req.driverId = driver.driverId || driver._id.toString();
          } else {
            req.driverId = user._id.toString();
          }
        }
        return next();
      }
    } catch (err) {
      console.error('Explicit query auth error:', err);
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no access token provided' });
};

const requireProvider = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'provider' && !req.providerId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Provider access required' });
  }
  next();
};

const requireDriver = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const validRoles = ['delivery', 'driver', 'delivery_partner', 'courier', 'admin'];
  if (!validRoles.includes(req.user.role) && !req.driverId && !req.driver) {
    return res.status(403).json({ success: false, message: 'Forbidden: Driver access required' });
  }

  if (!req.driverId && req.user) {
    req.driverId = req.driver?.driverId || req.user?.driverId || req.user?._id?.toString();
  }

  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }
  next();
};

module.exports = { protect, requireProvider, requireDriver, requireAdmin };
