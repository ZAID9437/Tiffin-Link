const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');
const DeliveryPartnerApplication = require('../models/DeliveryPartnerApplication');
const { ensureConnected } = require('../config/db');
const {
  sendDeliveryVerificationSuccessEmail,
  sendDeliveryDocumentRejectionEmail
} = require('../services/emailService');

const isDbConnected = async () => await ensureConnected();

// @desc    Register a new delivery partner storing all form fields in MongoDB
// @route   POST /api/delivery
const registerDelivery = async (req, res) => {
  try {
    await isDbConnected();

    const {
      fullName,
      email,
      mobile,
      dob,
      gender,
      houseNo,
      streetName,
      area,
      city,
      state,
      zip,
      vehicleType,
      registrationNo,
      brand,
      model,
      licenseNumber,
      licenseCopy,
      licenseCopyName,
      idType,
      idNumber,
      idFront,
      idFrontName,
      idBack,
      idBackName,
      accountHolderName,
      bankName,
      accountNumber,
      routingCode,
      upiId,
      emergencyName,
      emergencyRelationship,
      emergencyMobile,
      workingDays,
      timeSlot,
      preferredArea,
      startImmediately,
      experience,
      languages,
      referralCode,
      confirmAccurate,
      agreePrivacy,
      understandBackgroundCheck
    } = req.body;

    const applicationId = `TL-${Math.floor(10000 + Math.random() * 90000)}-B`;

    // 1. Save or Update in DeliveryPartnerApplication model
    const applicationData = {
      applicationId,
      fullName: fullName || '',
      email: email ? email.toLowerCase().trim() : '',
      mobile: mobile || '',
      dob: dob || '',
      gender: gender || '',
      houseNo: houseNo || '',
      streetName: streetName || '',
      area: area || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      vehicleType: vehicleType || 'motorcycle',
      registrationNo: registrationNo || '',
      brand: brand || '',
      model: model || '',
      licenseNumber: licenseNumber || '',
      licenseCopy: licenseCopy || '',
      licenseCopyName: licenseCopyName || '',
      idType: idType || 'Passport',
      idNumber: idNumber || '',
      idFront: idFront || '',
      idFrontName: idFrontName || '',
      idBack: idBack || '',
      idBackName: idBackName || '',
      accountHolderName: accountHolderName || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      routingCode: routingCode || '',
      upiId: upiId || '',
      emergencyName: emergencyName || '',
      emergencyRelationship: emergencyRelationship || '',
      emergencyMobile: emergencyMobile || '',
      workingDays: Array.isArray(workingDays) ? workingDays : [],
      timeSlot: timeSlot || '',
      preferredArea: preferredArea || '',
      startImmediately: Boolean(startImmediately),
      experience: experience || '',
      languages: languages || '',
      referralCode: referralCode || '',
      confirmAccurate: Boolean(confirmAccurate),
      agreePrivacy: Boolean(agreePrivacy),
      understandBackgroundCheck: Boolean(understandBackgroundCheck),
      status: 'APPROVED',
      verifiedAt: new Date()
    };

    const savedApplication = await DeliveryPartnerApplication.create(applicationData);

    // 2. Sync to User model
    if (email) {
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

    // 3. Sync to Driver model for active order dispatching
    await Driver.findOneAndUpdate(
      { phone: mobile || email },
      {
        driverId: applicationId,
        name: fullName || 'Delivery Partner',
        phone: mobile || '',
        email: email ? email.toLowerCase().trim() : '',
        vehicleNo: registrationNo || 'GJ-01-TL-100',
        vehicleType: vehicleType || 'Bike',
        status: 'AVAILABLE',
        currentLocation: {
          lat: 23.0225,
          lng: 72.5714,
          address: `${area || 'Satellite'}, ${city || 'Ahmedabad'}`
        }
      },
      { upsert: true, new: true }
    );

    // 4. Send Verification Success Email to Partner
    if (email) {
      sendDeliveryVerificationSuccessEmail({
        email: email.toLowerCase().trim(),
        fullName: fullName || 'Delivery Partner',
        applicationId
      }).catch(err => console.error("Error sending verification email:", err));
    }

    return res.status(201).json({
      success: true,
      message: 'Delivery partner application submitted, verified & email sent successfully',
      data: {
        applicationId,
        id: savedApplication._id
      }
    });
  } catch (error) {
    console.error('Error saving delivery partner application to MongoDB:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get all delivery partner applications
// @route   GET /api/delivery/applications
const getDeliveryApplications = async (req, res) => {
  try {
    await isDbConnected();
    const apps = await DeliveryPartnerApplication.find().sort({ createdAt: -1 });
    res.json({ success: true, count: apps.length, data: apps });
  } catch (error) {
    console.error('Error fetching applications from MongoDB:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update document verification status & send notification email (Success or Rejection)
// @route   POST /api/delivery/verify-status
const updateVerificationStatus = async (req, res) => {
  try {
    await isDbConnected();
    const { applicationId, status, rejectedDocuments, rejectionReason } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, message: 'applicationId is required' });
    }

    const app = await DeliveryPartnerApplication.findOne({ applicationId });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Delivery application not found' });
    }

    app.status = status || 'APPROVED';

    if (status === 'REJECTED') {
      app.rejectedDocuments = Array.isArray(rejectedDocuments) ? rejectedDocuments : [];
      app.rejectionReason = rejectionReason || 'Document quality is blurry or invalid. Please re-upload.';
    } else {
      app.verifiedAt = new Date();
      app.rejectedDocuments = [];
      app.rejectionReason = '';
    }

    await app.save();

    // Sync Driver model status
    await Driver.findOneAndUpdate(
      { driverId: applicationId },
      { status: status === 'APPROVED' ? 'AVAILABLE' : 'INACTIVE' }
    );

    // Send corresponding Email
    let emailResult = null;
    if (app.email) {
      if (status === 'APPROVED') {
        emailResult = await sendDeliveryVerificationSuccessEmail({
          email: app.email,
          fullName: app.fullName,
          applicationId: app.applicationId
        });
      } else if (status === 'REJECTED') {
        emailResult = await sendDeliveryDocumentRejectionEmail({
          email: app.email,
          fullName: app.fullName,
          applicationId: app.applicationId,
          rejectedDocuments: app.rejectedDocuments,
          rejectionReason: app.rejectionReason
        });
      }
    }

    return res.json({
      success: true,
      message: `Application ${applicationId} status updated to ${status}. Notification email sent to ${app.email}`,
      data: app,
      emailResult
    });
  } catch (error) {
    console.error('Error updating document verification status:', error);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  registerDelivery,
  getDeliveryApplications,
  updateVerificationStatus
};

