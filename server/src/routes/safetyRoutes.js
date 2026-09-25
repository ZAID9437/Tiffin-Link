const express = require('express');
const router = express.Router();
const { protect, requireDriver } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/safetyController');

// Emergency / SOS routes
router.get('/emergency', protect, requireDriver, getEmergencyStatus);
router.get('/status', protect, requireDriver, getEmergencyStatus);

router.post('/sos', protect, requireDriver, triggerSos);
router.patch('/sos/:sosId/resolve', protect, requireDriver, resolveSos);
router.post('/sos/:sosId/resolve', protect, requireDriver, resolveSos);
router.get('/sos/history', protect, requireDriver, getSosHistory);

// Emergency contacts routes
router.get('/emergency-contacts', protect, requireDriver, getEmergencyContacts);
router.post('/emergency-contacts', protect, requireDriver, addEmergencyContact);
router.put('/emergency-contacts/:contactId', protect, requireDriver, updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', protect, requireDriver, deleteEmergencyContact);

// Safety guidelines routes
router.get('/guidelines', protect, requireDriver, getSafetyGuidelines);
router.get('/safety-guidelines', protect, requireDriver, getSafetyGuidelines);
router.post('/guidelines/acknowledge', protect, requireDriver, acknowledgeSafetyGuidelines);
router.post('/safety-guidelines/acknowledge', protect, requireDriver, acknowledgeSafetyGuidelines);

// Issue report routes
router.get('/reports', protect, requireDriver, getIssueReports);
router.get('/issue-reports', protect, requireDriver, getIssueReports);
router.post('/reports', protect, requireDriver, createIssueReport);
router.post('/issue-reports', protect, requireDriver, createIssueReport);
router.get('/reports/:id', protect, requireDriver, getIssueReportById);
router.get('/issue-reports/:id', protect, requireDriver, getIssueReportById);

module.exports = router;
