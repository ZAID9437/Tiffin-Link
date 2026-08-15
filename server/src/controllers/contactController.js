const mongoose = require('mongoose');
const ContactInquiry = require('../models/ContactInquiry');
const { ensureConnected } = require('../config/db');

const localInquiries = [];
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
    } else {
      const mockInquiry = {
        _id: 'ci_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        subject,
        message,
        createdAt: new Date()
      };
      localInquiries.push(mockInquiry);
      return res.status(201).json({ success: true, data: mockInquiry, source: 'in-memory' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  submitContact
};
