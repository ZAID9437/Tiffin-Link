const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getProviderSettings, 
  updateProviderSettings,
  getAccountSettings,
  updateAccountSettings,
  getNotificationPreferences,
  updateNotificationPreferences,
  getSecurityOverview,
  changePassword,
  getActiveSessions,
  revokeSession,
  getAppPreferences,
  updateAppPreferences
} = require('../controllers/settingController');

router.get('/provider', protect, requireProvider, getProviderSettings);
router.put('/provider', protect, requireProvider, updateProviderSettings);

// Specialized Settings Endpoints requested in master prompt
router.get('/account', protect, requireProvider, getAccountSettings);
router.patch('/account', protect, requireProvider, updateAccountSettings);
router.put('/account', protect, requireProvider, updateAccountSettings);

router.get('/notifications', protect, requireProvider, getNotificationPreferences);
router.patch('/notifications', protect, requireProvider, updateNotificationPreferences);
router.put('/notifications', protect, requireProvider, updateNotificationPreferences);

router.get('/security', protect, requireProvider, getSecurityOverview);
router.post('/change-password', protect, requireProvider, changePassword);
router.get('/sessions', protect, requireProvider, getActiveSessions);
router.delete('/sessions/:sessionId', protect, requireProvider, revokeSession);

router.get('/preferences', protect, requireProvider, getAppPreferences);
router.patch('/preferences', protect, requireProvider, updateAppPreferences);
router.put('/preferences', protect, requireProvider, updateAppPreferences);

module.exports = router;


