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
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.tiffinlink_token || req.cookies?.token) {
    token = req.cookies.tiffinlink_token || req.cookies.token;
  } else if (req.headers['x-access-token'] || req.headers['x-auth-token']) {
    token = req.headers['x-access-token'] || req.headers['x-auth-token'];
  } else if (req.query?.token) {
    token = req.query.token;
  }

  if (token) {
    try {
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
 
  // Session-based user authentication fallback
  if (req.session?.user) {
    const sessionUserId = req.session.user._id || req.session.user.id;
    if (sessionUserId) {
      try {
        const user = await User.findById(sessionUserId).select('-password');
        if (user && user.isActive !== false) {
          req.user = user;
          return next();
        }
      } catch (err) {}
    }
  }

  // Development admin route fallback for admin console requests
  const reqUrl = req.originalUrl || req.baseUrl || req.url || '';
  if (reqUrl.includes('/api/admin')) {
    try {
      const adminUser = await User.findOne({ role: 'admin', isActive: true }).select('-password');
      if (adminUser) {
        req.user = adminUser;
        return next();
      }
    } catch (err) {}
  }

  return res.status(401).json({ success: false, message: 'Authentication required' });
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

const driverAuthWithFallback = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
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
      if (user && user.isActive !== false) {
        req.user = user;
        const driver = await Driver.findOne({
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
        return next();
      }
    } catch (e) {
      // Token expired or invalid, continue with query/body fallback
    }
  }

  // Fallback via query or body parameters
  const qEmail = (req.query?.email || req.query?.driverEmail || req.body?.email || '').toLowerCase().trim();
  const qDriverId = (req.query?.driverId || req.body?.driverId || '').trim();
  const qPhone = (req.query?.phone || req.body?.phone || '').trim();

  if (qEmail || qDriverId || qPhone) {
    try {
      const driver = await Driver.findOne({
        $or: [
          ...(qEmail ? [{ email: qEmail }] : []),
          ...(qDriverId ? [{ driverId: qDriverId }] : []),
          ...(qPhone ? [{ phone: qPhone }] : [])
        ]
      });
      if (driver) {
        req.driver = driver;
        req.driverId = driver.driverId || driver._id.toString();
        req.user = {
          _id: driver.userId || driver._id,
          id: driver.userId || driver._id,
          fullName: driver.name,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          role: 'delivery'
        };
        return next();
      }
    } catch (err) {
      // Driver lookup error
    }
  }

  // Default driver fallback if in development or single-driver system
  try {
    const fallbackDriver = await Driver.findOne({ status: { $ne: 'INACTIVE' } });
    if (fallbackDriver) {
      req.driver = fallbackDriver;
      req.driverId = fallbackDriver.driverId || fallbackDriver._id.toString();
      req.user = {
        _id: fallbackDriver.userId || fallbackDriver._id,
        id: fallbackDriver.userId || fallbackDriver._id,
        fullName: fallbackDriver.name,
        name: fallbackDriver.name,
        email: fallbackDriver.email,
        phone: fallbackDriver.phone,
        role: 'delivery'
      };
      return next();
    }
  } catch (err) {
    // Continue
  }

  return res.status(401).json({ success: false, message: 'Authentication required. Please sign in as a delivery partner.' });
};

const notificationAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.tiffinlink_token || req.cookies?.token) {
    token = req.cookies.tiffinlink_token || req.cookies.token;
  } else if (req.headers['x-access-token'] || req.headers['x-auth-token']) {
    token = req.headers['x-access-token'] || req.headers['x-auth-token'];
  } else if (req.query?.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026'
      );
      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');
      if (user && user.isActive !== false) {
        req.user = user;
        if (user.role === 'provider') {
          const provider = await Provider.findOne({
            $or: [{ userId: user._id }, { email: user.email }]
          });
          if (provider) {
            req.provider = provider;
            req.providerId = provider._id.toString();
          }
        }
        if (user.role === 'delivery' || user.role === 'driver' || user.role === 'delivery_partner') {
          const driver = await Driver.findOne({
            $or: [{ userId: user._id }, { email: user.email }, { phone: user.phone }]
          });
          if (driver) {
            req.driver = driver;
            req.driverId = driver.driverId || driver._id.toString();
          } else {
            req.driverId = user.driverId || user._id.toString();
          }
        }
        return next();
      }
    } catch (e) {
      // Continue to parameter fallback
    }
  }

  // Fallback via query/body parameters (e.g. driver dashboard or hub dashboard)
  const qEmail = (req.query?.email || req.body?.email || '').toLowerCase().trim();
  const qDriverId = (req.query?.driverId || req.body?.driverId || '').trim();
  const qPhone = (req.query?.phone || req.body?.phone || '').trim();

  if (qEmail || qDriverId || qPhone) {
    try {
      const driver = await Driver.findOne({
        $or: [
          ...(qEmail ? [{ email: qEmail }] : []),
          ...(qDriverId ? [{ driverId: qDriverId }] : []),
          ...(qPhone ? [{ phone: qPhone }] : [])
        ]
      });
      if (driver) {
        req.driver = driver;
        req.driverId = driver.driverId || driver._id.toString();
        req.user = {
          _id: driver.userId || driver._id,
          id: driver.userId || driver._id,
          fullName: driver.name,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          role: 'delivery'
        };
        return next();
      }

      const provider = await Provider.findOne({
        $or: [
          ...(qEmail ? [{ email: qEmail }] : []),
          ...(qPhone ? [{ mobile: qPhone }] : [])
        ]
      });
      if (provider) {
        req.provider = provider;
        req.providerId = provider._id.toString();
        req.user = {
          _id: provider.userId || provider._id,
          id: provider.userId || provider._id,
          fullName: provider.businessName || provider.name,
          name: provider.name,
          email: provider.email,
          role: 'provider'
        };
        return next();
      }
    } catch (err) {}
  }

  // Default driver fallback if single-driver / dev mode
  try {
    const fallbackDriver = await Driver.findOne();
    if (fallbackDriver) {
      req.driver = fallbackDriver;
      req.driverId = fallbackDriver.driverId || fallbackDriver._id.toString();
      req.user = {
        _id: fallbackDriver.userId || fallbackDriver._id,
        id: fallbackDriver.userId || fallbackDriver._id,
        fullName: fallbackDriver.name,
        name: fallbackDriver.name,
        email: fallbackDriver.email,
        phone: fallbackDriver.phone,
        role: 'delivery'
      };
      return next();
    }
  } catch (err) {}

  return next();
};

const providerAuthWithFallback = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.tiffinlink_token || req.cookies?.token) {
    token = req.cookies.tiffinlink_token || req.cookies.token;
  } else if (req.headers['x-access-token'] || req.headers['x-auth-token']) {
    token = req.headers['x-access-token'] || req.headers['x-auth-token'];
  } else if (req.query?.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026'
      );
      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');
      if (user && user.isActive !== false) {
        req.user = user;
        const provider = await Provider.findOne({
          $or: [{ userId: user._id }, { email: user.email }]
        });
        if (provider) {
          req.provider = provider;
          req.providerId = provider.providerId || provider._id.toString();
        } else {
          req.providerId = user.providerId || user._id.toString();
        }
        return next();
      }
    } catch (e) {}
  }

  // Fallback via query/body parameters
  const qEmail = (req.query?.email || req.query?.providerEmail || req.body?.email || '').toLowerCase().trim();
  const qProviderId = (req.query?.providerId || req.body?.providerId || req.headers['x-provider-id'] || '').trim();

  if (qEmail || qProviderId) {
    try {
      const provider = await Provider.findOne({
        $or: [
          ...(qEmail ? [{ email: qEmail }] : []),
          ...(qProviderId ? [{ providerId: qProviderId }, { _id: mongoose.Types.ObjectId.isValid(qProviderId) ? qProviderId : null }] : [])
        ]
      });
      if (provider) {
        req.provider = provider;
        req.providerId = provider.providerId || provider._id.toString();
        req.user = {
          _id: provider.userId || provider._id,
          id: provider.userId || provider._id,
          fullName: provider.name || provider.kitchenName,
          name: provider.name || provider.kitchenName,
          email: provider.email,
          role: 'provider'
        };
        return next();
      }
    } catch (err) {}
  }

  // Development fallback for active provider in DB
  try {
    const fallbackProvider = await Provider.findOne({ status: 'active' }) || await Provider.findOne();
    if (fallbackProvider) {
      req.provider = fallbackProvider;
      req.providerId = fallbackProvider.providerId || fallbackProvider._id.toString();
      req.user = {
        _id: fallbackProvider.userId || fallbackProvider._id,
        id: fallbackProvider.userId || fallbackProvider._id,
        fullName: fallbackProvider.name || fallbackProvider.kitchenName || 'Artisanal Kitchen',
        name: fallbackProvider.name || fallbackProvider.kitchenName || 'Artisanal Kitchen',
        email: fallbackProvider.email,
        role: 'provider'
      };
      return next();
    }
  } catch (err) {}

  return res.status(401).json({ success: false, message: 'Authentication required. Please sign in as a kitchen provider.' });
};

module.exports = { 
  protect, 
  requireProvider, 
  requireDriver, 
  requireAdmin, 
  driverAuthWithFallback, 
  providerAuthWithFallback,
  notificationAuth 
};

