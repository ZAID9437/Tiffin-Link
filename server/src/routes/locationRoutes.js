const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getReverseGeocode, updateUserLocation } = require('../controllers/locationController');

// Optional auth middleware so logged in user attaches req.user, while guest continues freely
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
      // Token expired or invalid - ignore for optional auth
    }
  }
  next();
};

// GET /api/location/reverse-geocode?lat=...&lng=...&accuracy=...
router.get('/reverse-geocode', getReverseGeocode);

// POST /api/location/update
router.post('/update', optionalAuth, updateUserLocation);

module.exports = router;
