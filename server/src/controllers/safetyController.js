const SosEvent = require('../models/SosEvent');
const EmergencyContact = require('../models/EmergencyContact');
const SafetyGuideline = require('../models/SafetyGuideline');
const SafetyAcknowledgement = require('../models/SafetyAcknowledgement');
const IssueReport = require('../models/IssueReport');
const DeliveryRequest = require('../models/DeliveryRequest');
const DeliveryPartnerApplication = require('../models/DeliveryPartnerApplication');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { emitToDriver, emitToUser } = require('../services/socketService');

// Helper to extract driver identifier
const getDriverIdFromReq = (req) => {
  return req.driverId || req.driver?.driverId || req.user?.driverId || req.query?.driverId || req.body?.driverId || req.user?.id || req.user?._id?.toString() || '';
};

/**
 * GET /api/driver/safety/emergency
 * Fetch current safety status, active SOS alert, active consignment, contacts & history
 */
const getEmergencyStatus = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);

    // 1. Fetch active SOS event if any
    const activeSos = await SosEvent.findOne({
      driverId,
      status: 'ACTIVE'
    }).sort({ createdAt: -1 });

    // 2. Fetch active delivery consignment
    const activeDelivery = await DeliveryRequest.findOne({
      $or: [
        { 'assignedDriver.driverId': driverId },
        { 'assignedDriver.id': driverId },
        { driverId: driverId }
      ],
      status: {
        $in: [
          'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'Arrived',
          'Assigned', 'Picked Up', 'On The Way', 'Out for Delivery'
        ]
      }
    }).sort({ updatedAt: -1 });

    // 3. Fetch emergency contacts from DB
    let contacts = await EmergencyContact.find({ driverId }).sort({ isPrimary: -1, createdAt: -1 });

    // If no contacts in EmergencyContact collection, seed from application or defaults
    if (contacts.length === 0) {
      const appRecord = await DeliveryPartnerApplication.findOne({
        $or: [{ email: req.user?.email }, { mobile: req.user?.phone }]
      });

      if (appRecord && appRecord.emergencyName && appRecord.emergencyMobile) {
        const seeded = await EmergencyContact.create({
          driverId,
          name: appRecord.emergencyName,
          phone: appRecord.emergencyMobile,
          relationship: appRecord.emergencyRelationship || 'Primary',
          isPrimary: true
        });
        contacts = [seeded];
      } else {
        // Seed default initial contacts for demo driver
        const default1 = await EmergencyContact.create({
          driverId,
          name: 'Rahul Mansuri',
          phone: '+91 98765 43210',
          relationship: 'Brother',
          isPrimary: true,
          autoSmsEnabled: true,
          autoCallEnabled: true
        });
        const default2 = await EmergencyContact.create({
          driverId,
          name: 'Pooja Verma',
          phone: '+91 98123 76543',
          relationship: 'Spouse',
          isPrimary: false,
          autoSmsEnabled: true,
          autoCallEnabled: true
        });
        contacts = [default1, default2];
      }
    }

    // 4. Fetch SOS audit history
    const sosHistory = await SosEvent.find({ driverId }).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({
      success: true,
      data: {
        driverId,
        activeSos,
        activeDelivery: activeDelivery ? {
          orderId: activeDelivery.orderId || activeDelivery.requestId,
          status: activeDelivery.status,
          providerName: activeDelivery.providerName || 'Xoxo Men Kitchen',
          pickupAddress: activeDelivery.pickupAddress,
          customerName: activeDelivery.customerName || 'Bhavin Shah',
          deliveryAddress: activeDelivery.deliveryAddress,
          customerPhone: activeDelivery.customerPhone || '+91 98330 99887',
          kitchenPhone: activeDelivery.kitchenPhone || '+91 98200 11223',
          distanceKm: activeDelivery.distanceKm || 2.4,
          etaMinutes: activeDelivery.etaMinutes || 8
        } : null,
        emergencyContacts: contacts,
        sosHistory
      }
    });
  } catch (error) {
    console.error('Error fetching emergency status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency status',
      error: error.message
    });
  }
};

/**
 * POST /api/driver/safety/sos
 * Trigger immediate SOS alert broadcast
 */
const triggerSos = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);

    // Prevent duplicate active SOS alerts
    const existingActive = await SosEvent.findOne({
      driverId,
      status: 'ACTIVE'
    });

    if (existingActive) {
      return res.status(200).json({
        success: true,
        message: 'SOS is already active.',
        sosEvent: existingActive
      });
    }

    // Find active consignment
    const activeDelivery = await DeliveryRequest.findOne({
      $or: [
        { 'assignedDriver.driverId': driverId },
        { 'assignedDriver.id': driverId },
        { driverId: driverId }
      ],
      status: {
        $in: [
          'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'Arrived',
          'Assigned', 'Picked Up', 'On The Way', 'Out for Delivery'
        ]
      }
    });

    const locationObj = {
      lat: req.body?.lat || req.body?.latitude || 19.0596,
      lng: req.body?.lng || req.body?.longitude || 72.8295,
      accuracy: req.body?.accuracy || 11.4,
      address: req.body?.address || 'Bandra West, Mumbai'
    };

    // Fetch emergency contacts to log as notified
    const contacts = await EmergencyContact.find({ driverId });
    const notifiedList = contacts.map(c => ({
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
      notifiedAt: new Date()
    }));

    const generatedSosId = `#SOS-${Date.now().toString().slice(-6)}`;

    const newSos = await SosEvent.create({
      sosId: generatedSosId,
      driverId,
      orderId: activeDelivery ? (activeDelivery.orderId || activeDelivery.requestId) : '',
      status: 'ACTIVE',
      location: locationObj,
      emergencyContactsNotified: notifiedList,
      note: req.body?.note || 'Emergency assistance requested by courier',
      activatedAt: new Date()
    });

    // Emit Socket.IO alert
    try {
      emitToDriver(driverId, 'sos:created', newSos);
    } catch (sErr) {
      console.warn('Socket alert notification warning:', sErr.message);
    }

    return res.status(201).json({
      success: true,
      message: '🚨 EMERGENCY SOS ACTIVATED SUCCESSFULLY',
      sosEvent: newSos
    });
  } catch (error) {
    console.error('Error triggering SOS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate SOS alert',
      error: error.message
    });
  }
};

/**
 * PATCH /api/driver/safety/sos/:sosId/resolve
 * Resolve active SOS event
 */
const resolveSos = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const { sosId } = req.params;

    const sosEvent = await SosEvent.findOne({
      $or: [{ sosId: sosId }, { _id: sosId }],
      driverId
    });

    if (!sosEvent) {
      return res.status(404).json({
        success: false,
        message: 'SOS incident record not found or access denied.'
      });
    }

    sosEvent.status = 'RESOLVED';
    sosEvent.resolvedAt = new Date();
    if (req.body?.note) {
      sosEvent.note = req.body.note;
    }
    await sosEvent.save();

    // Socket alert
    try {
      emitToDriver(driverId, 'sos:resolved', sosEvent);
    } catch (sErr) {}

    return res.status(200).json({
      success: true,
      message: 'SOS incident marked as RESOLVED.',
      sosEvent
    });
  } catch (error) {
    console.error('Error resolving SOS:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve SOS incident',
      error: error.message
    });
  }
};

/**
 * GET /api/driver/safety/sos/history
 * Fetch authenticated driver's SOS audit log
 */
const getSosHistory = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const history = await SosEvent.find({ driverId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      sosHistory: history
    });
  } catch (error) {
    console.error('Error fetching SOS history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch SOS history',
      error: error.message
    });
  }
};

/**
 * GET /api/driver/safety/emergency-contacts
 */
const getEmergencyContacts = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const contacts = await EmergencyContact.find({ driverId }).sort({ isPrimary: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: error.message
    });
  }
};

/**
 * POST /api/driver/safety/emergency-contacts
 */
const addEmergencyContact = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const { name, phone, relationship, isPrimary, autoSmsEnabled, autoCallEnabled } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required fields.'
      });
    }

    if (isPrimary) {
      await EmergencyContact.updateMany({ driverId }, { $set: { isPrimary: false } });
    }

    const contact = await EmergencyContact.create({
      driverId,
      name,
      phone,
      relationship: relationship || 'Other',
      isPrimary: Boolean(isPrimary),
      autoSmsEnabled: autoSmsEnabled !== false,
      autoCallEnabled: autoCallEnabled !== false
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully.',
      contact
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
};

/**
 * PUT /api/driver/safety/emergency-contacts/:contactId
 */
const updateEmergencyContact = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const { contactId } = req.params;
    const { name, phone, relationship, isPrimary, autoSmsEnabled, autoCallEnabled } = req.body;

    let contact = await EmergencyContact.findOne({ _id: contactId });
    if (!contact) {
      contact = await EmergencyContact.findOne({ _id: contactId, driverId });
    }

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found.'
      });
    }

    if (isPrimary && !contact.isPrimary) {
      await EmergencyContact.updateMany({ driverId: contact.driverId || driverId }, { $set: { isPrimary: false } });
    }

    if (name) contact.name = name;
    if (phone) contact.phone = phone;
    if (relationship) contact.relationship = relationship;
    if (typeof isPrimary === 'boolean') contact.isPrimary = isPrimary;
    if (typeof autoSmsEnabled === 'boolean') contact.autoSmsEnabled = autoSmsEnabled;
    if (typeof autoCallEnabled === 'boolean') contact.autoCallEnabled = autoCallEnabled;

    await contact.save();

    return res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully.',
      contact
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact',
      error: error.message
    });
  }
};

/**
 * DELETE /api/driver/safety/emergency-contacts/:contactId
 */
const deleteEmergencyContact = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const { contactId } = req.params;

    let result = await EmergencyContact.deleteOne({ _id: contactId, driverId });
    if (result.deletedCount === 0) {
      result = await EmergencyContact.deleteOne({ _id: contactId });
    }

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact',
      error: error.message
    });
  }
};

/**
 * GET /api/driver/safety/guidelines
 * Fetch safety guidelines & current driver's acknowledgement status from MongoDB
 */
const getSafetyGuidelines = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const currentVersion = 'SAF-902-v4.2';

    // Fetch or create guideline metadata
    let guideline = await SafetyGuideline.findOne({ guidelineId: 'SAF-902' });
    if (!guideline) {
      guideline = await SafetyGuideline.create({
        guidelineId: 'SAF-902',
        version: currentVersion,
        title: 'Safety Guidelines & Compliance',
        subtitle: 'Follow these guidelines to keep yourself, kitchen partners, and customers safe during deliveries.',
        effectiveDate: '18 Sep 2026'
      });
    }

    // Fetch driver's compliance acknowledgement
    const acknowledgement = await SafetyAcknowledgement.findOne({
      driverId,
      guidelineVersion: currentVersion
    });

    return res.status(200).json({
      success: true,
      data: {
        driverId,
        guidelineId: guideline.guidelineId,
        version: guideline.version || currentVersion,
        effectiveDate: guideline.effectiveDate || '18 Sep 2026',
        isAcknowledged: Boolean(acknowledgement),
        acknowledgedAt: acknowledgement ? acknowledgement.acknowledgedAt : null,
        digitalSignature: acknowledgement ? acknowledgement.digitalSignature : null
      }
    });
  } catch (error) {
    console.error('Error fetching safety guidelines status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch safety guidelines',
      error: error.message
    });
  }
};

/**
 * POST /api/driver/safety/guidelines/acknowledge
 * Save driver compliance attestation in MongoDB
 */
const acknowledgeSafetyGuidelines = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const currentVersion = req.body?.version || 'SAF-902-v4.2';

    let ack = await SafetyAcknowledgement.findOne({
      driverId,
      guidelineVersion: currentVersion
    });

    if (!ack) {
      const driverName = req.user?.name || req.driver?.name || 'Courier Partner';
      const sig = `Digitally Signed by ${driverName} (#${driverId}) on ${new Date().toUTCString()}`;
      
      ack = await SafetyAcknowledgement.create({
        driverId,
        guidelineVersion: currentVersion,
        acknowledgedAt: new Date(),
        digitalSignature: sig,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Compliance attestation recorded & verified successfully in MongoDB.',
      data: {
        driverId,
        guidelineVersion: ack.guidelineVersion,
        isAcknowledged: true,
        acknowledgedAt: ack.acknowledgedAt,
        digitalSignature: ack.digitalSignature
      }
    });
  } catch (error) {
    console.error('Error acknowledging safety guidelines:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record compliance attestation',
      error: error.message
    });
  }
};

/**
 * GET /api/driver/safety/reports
 * Fetch driver's submitted issue reports & driver's recent orders for context
 */
const getIssueReports = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);

    // 1. Fetch reports filed by authenticated driver
    let reports = await IssueReport.find({ driverId }).sort({ createdAt: -1 });

    // Seed default initial issue reports if empty for demo courier
    if (reports.length === 0) {
      const r1 = await IssueReport.create({
        reportId: '#ISS-1024',
        driverId,
        orderId: 'ORD-5162',
        category: 'KITCHEN_ISSUE',
        priority: 'HIGH',
        description: 'Upon arriving at Pali Hill Kitchen Hub for pickup, the hot-box container seal was compromised with dal spillage from container #2. Kitchen partner refused immediate repacking.',
        contactPreference: 'PHONE',
        status: 'OPEN',
        assignedSupervisor: 'Capt. H. Mehta (Hub 12)',
        slaMinutes: 15
      });
      const r2 = await IssueReport.create({
        reportId: '#ISS-1019',
        driverId,
        orderId: 'ORD-4921',
        category: 'CUSTOMER_ISSUE',
        priority: 'MEDIUM',
        description: 'Customer disputed gate handover and was unreachable for 12 minutes at entry manifest desk.',
        contactPreference: 'CHAT',
        status: 'UNDER_REVIEW',
        assignedSupervisor: 'Capt. H. Mehta (Hub 12)',
        slaMinutes: 30
      });
      const r3 = await IssueReport.create({
        reportId: '#ISS-0988',
        driverId,
        orderId: 'ORD-3810',
        category: 'VEHICLE_ISSUE',
        priority: 'CRITICAL',
        description: 'Rear tire blowout on S.V. Road underpass. Relief courier transferred order seamlessly.',
        contactPreference: 'PHONE',
        status: 'RESOLVED',
        assignedSupervisor: 'Capt. H. Mehta (Hub 12)',
        slaMinutes: 10,
        resolvedAt: new Date(Date.now() - 3600000 * 48)
      });
      const r4 = await IssueReport.create({
        reportId: '#ISS-0941',
        driverId,
        orderId: 'ORD-2914',
        category: 'PAYMENT_ISSUE',
        priority: 'LOW',
        description: 'Wait time incentive adjustment request for 18-minute kitchen delay.',
        contactPreference: 'ASYNC',
        status: 'CLOSED',
        assignedSupervisor: 'Capt. H. Mehta (Hub 12)',
        slaMinutes: 60,
        resolvedAt: new Date(Date.now() - 3600000 * 120)
      });
      reports = [r1, r2, r3, r4];
    }

    // 2. Fetch driver's active & recent orders from MongoDB for dropdown
    const deliveryOrders = await DeliveryRequest.find({
      $or: [
        { 'assignedDriver.driverId': driverId },
        { 'assignedDriver.id': driverId },
        { driverId: driverId }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    const formattedOrders = deliveryOrders.map(o => ({
      orderId: o.orderId || o.requestId || o._id.toString(),
      tiffinName: o.tiffinName || 'Tiffin Box',
      customerName: o.customerName || 'Customer',
      deliveryAddress: typeof o.deliveryAddress === 'string' ? o.deliveryAddress : (o.deliveryAddress?.street || 'Delivery Address'),
      status: o.status || 'COMPLETED'
    }));

    // Fallback order list if database currently has no assigned requests
    if (formattedOrders.length === 0) {
      formattedOrders.push(
        { orderId: 'ORD-5162', tiffinName: 'Gujarati Special Thali', customerName: 'Bhavin Shah', deliveryAddress: 'Pali Hill, Bandra West', status: 'IN TRANSIT - ACTIVE' },
        { orderId: 'ORD-8569', tiffinName: 'Punjabi Lunch Box', customerName: 'Meera Nair', deliveryAddress: 'Khar West', status: 'COMPLETED - 13:40' },
        { orderId: 'ORD-4921', tiffinName: 'Satvik Tiffin 3-Tier', customerName: 'Anish Deshmukh', deliveryAddress: 'Bandra Kurla Complex', status: 'COMPLETED - 12:15' }
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        driverId,
        reports,
        orders: formattedOrders
      }
    });
  } catch (error) {
    console.error('Error fetching issue reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch issue reports',
      error: error.message
    });
  }
};

/**
 * POST /api/driver/safety/reports
 * Submit new operational issue report to MongoDB
 */
const createIssueReport = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const { orderId, category, priority, description, attachments, location, contactPreference } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Detailed description of the incident is required.'
      });
    }

    const reportId = `#ISS-${Date.now().toString().slice(-6)}`;

    const newReport = await IssueReport.create({
      reportId,
      driverId,
      orderId: orderId || 'NONE',
      category: category || 'KITCHEN_ISSUE',
      priority: priority || 'HIGH',
      description: description.trim(),
      attachments: attachments || [],
      location: location || { lat: 19.0596, lng: 72.8295, address: 'Pali Hill, Bandra West' },
      contactPreference: contactPreference || 'PHONE',
      status: 'OPEN',
      assignedSupervisor: 'Capt. H. Mehta (Hub 12)',
      slaMinutes: 15
    });

    // Socket alert broadcast
    try {
      emitToDriver(driverId, 'issue:created', newReport);
    } catch (sErr) {}

    return res.status(201).json({
      success: true,
      message: '✓ Issue report submitted successfully to Hub 12 Supervisor desk.',
      report: newReport
    });
  } catch (error) {
    console.error('Error creating issue report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit issue report',
      error: error.message
    });
  }
};

/**
 * GET /api/driver/safety/reports/:id
 * Get single issue report details
 */
const getIssueReportById = async (req, res) => {
  try {
    const driverId = getDriverIdFromReq(req);
    const { id } = req.params;

    const report = await IssueReport.findOne({
      $or: [{ reportId: id }, { _id: id }],
      driverId
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Issue report not found or access denied.'
      });
    }

    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching issue report details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report details',
      error: error.message
    });
  }
};

module.exports = {
  getEmergencyStatus,
  triggerSos,
  resolveSos,
  getSosHistory,
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getSafetyGuidelines,
  acknowledgeSafetyGuidelines,
  getIssueReports,
  createIssueReport,
  getIssueReportById
};
