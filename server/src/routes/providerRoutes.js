const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getProviders, 
  sendProviderOtp, 
  registerProvider, 
  getProviderDashboardStats, 
  toggleProviderStatus,
  getEarningsOverview,
  getTransactions,
  getIncentives,
  getWallet,
  getWithdrawals,
  requestWithdrawal,
  getPayoutAccount,
  updatePayoutAccount,
  getProviderPerformance
} = require('../controllers/providerController');

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

router.get('/', getProviders);
router.get('/dashboard', protect, requireProvider, getProviderDashboardStats);
router.put('/status', protect, requireProvider, toggleProviderStatus);
router.post('/send-otp', sendProviderOtp);
router.post('/', registerProvider);

// Financial & Performance Routes
router.get('/performance', protect, requireProvider, getProviderPerformance);
router.get('/earnings/overview', protect, requireProvider, getEarningsOverview);
router.get('/earnings/transactions', protect, requireProvider, getTransactions);
router.get('/incentives', protect, requireProvider, getIncentives);
router.get('/wallet', protect, requireProvider, getWallet);
router.get('/withdrawals', protect, requireProvider, getWithdrawals);
router.post('/withdrawals/request', protect, requireProvider, requestWithdrawal);
router.get('/payout-account', protect, requireProvider, getPayoutAccount);
router.post('/payout-account', protect, requireProvider, updatePayoutAccount);
router.put('/payout-account', protect, requireProvider, updatePayoutAccount);

// Provider Settings Sub-Routes
router.get('/settings/account', protect, requireProvider, getAccountSettings);
router.patch('/settings/account', protect, requireProvider, updateAccountSettings);
router.put('/settings/account', protect, requireProvider, updateAccountSettings);

router.get('/settings/notifications', protect, requireProvider, getNotificationPreferences);
router.patch('/settings/notifications', protect, requireProvider, updateNotificationPreferences);
router.put('/settings/notifications', protect, requireProvider, updateNotificationPreferences);

router.get('/settings/security', protect, requireProvider, getSecurityOverview);
router.post('/settings/change-password', protect, requireProvider, changePassword);
router.get('/settings/sessions', protect, requireProvider, getActiveSessions);
router.delete('/settings/sessions/:sessionId', protect, requireProvider, revokeSession);

router.get('/settings/preferences', protect, requireProvider, getAppPreferences);
router.patch('/settings/preferences', protect, requireProvider, updateAppPreferences);
router.put('/settings/preferences', protect, requireProvider, updateAppPreferences);

module.exports = router;



