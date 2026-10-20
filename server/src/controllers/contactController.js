const mongoose = require('mongoose');
const ContactInquiry = require('../models/ContactInquiry');
const { ensureConnected } = require('../config/db');
const { sendContactInquiryEmails } = require('../services/emailService');
const { getIO } = require('../services/socketService');

const isDbConnected = async () => await ensureConnected();

// @desc    Submit a contact inquiry with real-time email dispatch & socket alerts
// @route   POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, phone = '', subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide your name, a valid email address, and your message.' 
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSubject = String(subject || 'Artisanal Culinary Inquiry').trim();
    const cleanMessage = String(message).trim();
    const cleanPhone = String(phone || '').trim();

    const ticketId = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;

    let savedInquiry = null;

    if (await isDbConnected()) {
      const newInquiry = new ContactInquiry({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage,
        ticketId
      });
      await newInquiry.save();
      savedInquiry = newInquiry;
    } else {
      savedInquiry = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage,
        ticketId,
        createdAt: new Date()
      };
    }

    // 1. Real-Time Socket Broadcast to Admin & Concierge Rooms
    try {
      const io = getIO();
      if (io) {
        io.emit('contact:new', savedInquiry);
        io.emit('admin:notification', {
          type: 'contact',
          title: `New Inquiry from ${cleanName}`,
          message: cleanMessage.length > 80 ? cleanMessage.slice(0, 80) + '...' : cleanMessage,
          ticketId
        });
      }
    } catch (sErr) {
      console.warn('[Contact] Socket notification skipped:', sErr.message);
    }

    // 2. Real-Time Email Dispatch (Admin Notice + Customer Receipt)
    let emailResult = { success: false };
    try {
      emailResult = await sendContactInquiryEmails({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage,
        ticketId
      });

      if (emailResult.success && savedInquiry._id) {
        await ContactInquiry.updateOne(
          { _id: savedInquiry._id }, 
          { $set: { emailNotificationSent: true } }
        ).catch(() => {});
      }
    } catch (eErr) {
      console.error('[Contact] Error triggering email delivery:', eErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Your message has been delivered to our concierge team. A confirmation email has been dispatched to your inbox.',
      ticketId,
      emailSent: Boolean(emailResult.success),
      data: savedInquiry
    });
  } catch (error) {
    console.error('[Contact Error]', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get all contact inquiries
// @route   GET /api/contact
const getContactInquiries = async (req, res) => {
  try {
    if (await isDbConnected()) {
      const inquiries = await ContactInquiry.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: inquiries.length, data: inquiries });
    }
    return res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

module.exports = {
  submitContact,
  getContactInquiries
};
