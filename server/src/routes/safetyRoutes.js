const express = require('express');
const router = express.Router();
const { driverAuthWithFallback } = require('../middleware/authMiddleware');
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
router.get('/emergency', driverAuthWithFallback, getEmergencyStatus);
router.get('/status', driverAuthWithFallback, getEmergencyStatus);

router.post('/sos', driverAuthWithFallback, triggerSos);
router.patch('/sos/:sosId/resolve', driverAuthWithFallback, resolveSos);
router.post('/sos/:sosId/resolve', driverAuthWithFallback, resolveSos);
router.get('/sos/history', driverAuthWithFallback, getSosHistory);

// Emergency contacts routes
router.get('/emergency-contacts', driverAuthWithFallback, getEmergencyContacts);
router.post('/emergency-contacts', driverAuthWithFallback, addEmergencyContact);
router.put('/emergency-contacts/:contactId', driverAuthWithFallback, updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', driverAuthWithFallback, deleteEmergencyContact);

// Safety guidelines routes
router.get('/guidelines', driverAuthWithFallback, getSafetyGuidelines);
router.get('/safety-guidelines', driverAuthWithFallback, getSafetyGuidelines);
router.post('/guidelines/acknowledge', driverAuthWithFallback, acknowledgeSafetyGuidelines);
router.post('/safety-guidelines/acknowledge', driverAuthWithFallback, acknowledgeSafetyGuidelines);

// Issue report routes
router.get('/reports', driverAuthWithFallback, getIssueReports);
router.get('/issue-reports', driverAuthWithFallback, getIssueReports);
router.post('/reports', driverAuthWithFallback, createIssueReport);
router.post('/issue-reports', driverAuthWithFallback, createIssueReport);
router.get('/reports/:id', driverAuthWithFallback, getIssueReportById);
router.get('/issue-reports/:id', driverAuthWithFallback, getIssueReportById);

module.exports = router;
