const mongoose = require('mongoose');
const ContactInquiry = require('../models/ContactInquiry');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Submit a contact inquiry
// @route   POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    if (await isDbConnected()) {
      const newInquiry = new ContactInquiry({
        name,
        email,
        subject,
        message
      });
      await newInquiry.save();
      return res.status(201).json({ success: true, data: newInquiry, source: 'database' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  submitContact
};
