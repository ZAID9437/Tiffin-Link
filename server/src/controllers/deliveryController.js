const mongoose = require('mongoose');
const User = require('../models/User');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Register a new delivery partner
// @route   POST /api/delivery
const registerDelivery = async (req, res) => {
  try {
    const { fullName, email, mobile } = req.body;
    
    if (email && (await isDbConnected())) {
      await User.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        { 
          name: fullName || '',
          phone: mobile || '',
          role: 'delivery',
          isVerified: true,
          lastLogin: new Date()
        },
        { upsert: true, new: true }
      );
    }
    return res.status(201).json({ success: true, message: 'Delivery partner registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  registerDelivery
};
