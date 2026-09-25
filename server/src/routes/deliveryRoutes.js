const express = require('express');
const router = express.Router();
const { protect, requireProvider, requireDriver } = require('../middleware/authMiddleware');
const { registerDelivery, getDeliveryApplications, updateVerificationStatus } = require('../controllers/deliveryController');
const {
  getDeliveryRequests,
  createDeliveryRequest,
  broadcastDeliveryRequest,
  acceptDeliveryRequest,
  assignDriver,
  confirmPickup,
  sendPickupOtpSms,
  updateDeliveryStatus,
  updateDriverLocation,
  getNearbyDrivers,
  getDeliveryMetrics,
  getDriverDashboardData,
  toggleDriverStatus,
  setDriverOnline,
  setDriverOffline,
  getDriverSchedule,
  updateDriverSchedule,
  copyDriverScheduleMondayToWeekdays,
  resetDriverSchedule,
  getDriverPreferences,
  updateDriverPreferences,
  resetDriverPreferences,
  simulateDispatchMatching,
  getEligibleRequestsForDriver,
  acceptDeliveryRequestAtomic,
  declineDeliveryRequest,
  getActiveDelivery,
  getUpcomingDeliveries,
  getCompletedDeliveries,
  getDeliveryHistory,
  verifyOtp,
  retryDelivery,
  cancelDelivery,
  sendCustomerArrivalOtp,
  verifyCustomerArrivalOtp,
  sendCustomerHandoverOtp,
  verifyCustomerHandoverOtp,
  getDriverEarningsOverview,
  exportDriverEarnings,
  getDriverTransactions,
  exportDriverTransactions,
  getDriverIncentives,
  getDriverWallet,
  getDriverWithdrawals,
  createDriverWithdrawal,
  getDriverPayoutMethods,
  createDriverPayoutMethod,
  setPrimaryPayoutMethod,
  deleteDriverPayoutMethod,
  getDriverPerformance,
  getDriverReviews,
  getDriverAccount,
  updateDriverAccount,
  changeDriverPassword,
  terminateOtherSessions,
  getDriverSecuritySettings,
  updateDriverSecuritySettings,
  getDriverNotificationPreferences,
  updateDriverNotificationPreferences,
  resetDriverNotificationPreferences,
  getDriverAppPreferences,
  updateDriverAppPreferences,
  resetDriverAppPreferences,
  resendDriverVerificationEmail,
  sendDriverEmailVerificationOtp,
  verifyDriverEmailOtp,
  resendDriverEmailOtp
} = require('../controllers/deliveryDispatchController');

router.post('/', registerDelivery);
router.get('/applications', getDeliveryApplications);
router.post('/verify-status', updateVerificationStatus);

// Account Settings Endpoints
router.get('/account', protect, requireDriver, getDriverAccount);
router.get('/driver/account', protect, requireDriver, getDriverAccount);
router.put('/account', protect, requireDriver, updateDriverAccount);
router.put('/driver/account', protect, requireDriver, updateDriverAccount);
router.put('/account/password', protect, requireDriver, changeDriverPassword);
router.put('/driver/account/password', protect, requireDriver, changeDriverPassword);
router.post('/account/password', protect, requireDriver, changeDriverPassword);
router.post('/driver/account/password', protect, requireDriver, changeDriverPassword);
router.post('/account/terminate-sessions', protect, requireDriver, terminateOtherSessions);
router.post('/driver/account/terminate-sessions', protect, requireDriver, terminateOtherSessions);
router.post('/account/resend-verification-email', protect, requireDriver, sendDriverEmailVerificationOtp);
router.post('/driver/account/resend-verification-email', protect, requireDriver, sendDriverEmailVerificationOtp);
router.post('/resend-verification-email', protect, requireDriver, sendDriverEmailVerificationOtp);

// Standardized Driver Email Verification API Endpoints
router.post('/email/reverify', protect, requireDriver, sendDriverEmailVerificationOtp);
router.post('/driver/email/reverify', protect, requireDriver, sendDriverEmailVerificationOtp);
router.post('/email/verify', protect, requireDriver, verifyDriverEmailOtp);
router.post('/driver/email/verify', protect, requireDriver, verifyDriverEmailOtp);
router.post('/email/resend-otp', protect, requireDriver, resendDriverEmailOtp);
router.post('/driver/email/resend-otp', protect, requireDriver, resendDriverEmailOtp);

// Privacy & Security Endpoints
router.get('/security', protect, requireDriver, getDriverSecuritySettings);
router.get('/driver/security', protect, requireDriver, getDriverSecuritySettings);
router.get('/privacy', protect, requireDriver, getDriverSecuritySettings);
router.get('/driver/privacy', protect, requireDriver, getDriverSecuritySettings);
router.put('/security', protect, requireDriver, updateDriverSecuritySettings);
router.put('/driver/security', protect, requireDriver, updateDriverSecuritySettings);
router.patch('/security', protect, requireDriver, updateDriverSecuritySettings);
router.patch('/driver/security', protect, requireDriver, updateDriverSecuritySettings);
router.put('/privacy', protect, requireDriver, updateDriverSecuritySettings);
router.put('/driver/privacy', protect, requireDriver, updateDriverSecuritySettings);

// Notification Preferences Endpoints
router.get('/notification-preferences', protect, requireDriver, getDriverNotificationPreferences);
router.get('/driver/notification-preferences', protect, requireDriver, getDriverNotificationPreferences);
router.put('/notification-preferences', protect, requireDriver, updateDriverNotificationPreferences);
router.put('/driver/notification-preferences', protect, requireDriver, updateDriverNotificationPreferences);
router.patch('/notification-preferences', protect, requireDriver, updateDriverNotificationPreferences);
router.patch('/driver/notification-preferences', protect, requireDriver, updateDriverNotificationPreferences);
router.post('/notification-preferences/reset', protect, requireDriver, resetDriverNotificationPreferences);
router.post('/driver/notification-preferences/reset', protect, requireDriver, resetDriverNotificationPreferences);
router.get('/dashboard', protect, requireDriver, getDriverDashboardData);
router.get('/driver-dashboard', protect, requireDriver, getDriverDashboardData);
router.get('/performance', protect, requireDriver, getDriverPerformance);
router.get('/driver/performance', protect, requireDriver, getDriverPerformance);
router.get('/reviews', protect, requireDriver, getDriverReviews);
router.get('/driver/reviews', protect, requireDriver, getDriverReviews);
router.get('/reviews/summary', protect, requireDriver, getDriverReviews);
router.get('/driver/reviews/summary', protect, requireDriver, getDriverReviews);
router.get('/earnings/overview', protect, requireDriver, getDriverEarningsOverview);

router.post('/availability/online', protect, requireDriver, setDriverOnline);
router.post('/availability/offline', protect, requireDriver, setDriverOffline);
router.get('/availability/status', protect, requireDriver, getDriverDashboardData);

router.get('/schedule', protect, requireDriver, getDriverSchedule);
router.get('/driver/schedule', protect, requireDriver, getDriverSchedule);
router.put('/schedule', protect, requireDriver, updateDriverSchedule);
router.put('/driver/schedule', protect, requireDriver, updateDriverSchedule);
router.post('/schedule/copy-monday', protect, requireDriver, copyDriverScheduleMondayToWeekdays);
router.post('/schedule/reset', protect, requireDriver, resetDriverSchedule);

router.get('/preferences', protect, requireDriver, getDriverPreferences);
router.get('/driver/preferences', protect, requireDriver, getDriverPreferences);
router.put('/preferences', protect, requireDriver, updateDriverPreferences);
router.put('/driver/preferences', protect, requireDriver, updateDriverPreferences);
router.post('/preferences/reset', protect, requireDriver, resetDriverPreferences);
router.post('/preferences/simulate', protect, requireDriver, simulateDispatchMatching);

// App Preferences Endpoints
router.get('/app-preferences', protect, requireDriver, getDriverAppPreferences);
router.get('/driver/app-preferences', protect, requireDriver, getDriverAppPreferences);
router.put('/app-preferences', protect, requireDriver, updateDriverAppPreferences);
router.patch('/app-preferences', protect, requireDriver, updateDriverAppPreferences);
router.put('/driver/app-preferences', protect, requireDriver, updateDriverAppPreferences);
router.patch('/driver/app-preferences', protect, requireDriver, updateDriverAppPreferences);
router.post('/app-preferences/reset', protect, requireDriver, resetDriverAppPreferences);
router.post('/driver/app-preferences/reset', protect, requireDriver, resetDriverAppPreferences);


router.get('/earnings/export', protect, requireDriver, exportDriverEarnings);
router.get('/transactions', protect, requireDriver, getDriverTransactions);
router.get('/transactions/export', protect, requireDriver, exportDriverTransactions);
router.get('/incentives', protect, requireDriver, getDriverIncentives);
router.get('/wallet', protect, requireDriver, getDriverWallet);
router.get('/withdrawals', protect, requireDriver, getDriverWithdrawals);
router.post('/withdrawals', protect, requireDriver, createDriverWithdrawal);
router.get('/payout-methods', protect, requireDriver, getDriverPayoutMethods);
router.post('/payout-methods', protect, requireDriver, createDriverPayoutMethod);
router.patch('/payout-methods/:id/primary', protect, requireDriver, setPrimaryPayoutMethod);
router.delete('/payout-methods/:id', protect, requireDriver, deleteDriverPayoutMethod);
router.get('/active-delivery', protect, requireDriver, getActiveDelivery);
router.get('/driver/deliveries/active', protect, requireDriver, getActiveDelivery);
router.get('/upcoming', protect, requireDriver, getUpcomingDeliveries);
router.get('/driver/deliveries/upcoming', protect, requireDriver, getUpcomingDeliveries);
router.get('/completed', protect, requireDriver, getCompletedDeliveries);
router.get('/driver/deliveries/completed', protect, requireDriver, getCompletedDeliveries);
router.get('/history', protect, requireDriver, getDeliveryHistory);
router.get('/driver/deliveries/history', protect, requireDriver, getDeliveryHistory);
router.get('/driver-requests', protect, requireDriver, getEligibleRequestsForDriver);
router.post('/requests/:requestId/accept', protect, requireDriver, acceptDeliveryRequestAtomic);
router.post('/requests/:requestId/decline', protect, requireDriver, declineDeliveryRequest);
router.post('/status/toggle', protect, requireDriver, toggleDriverStatus);
router.get('/requests', protect, requireProvider, getDeliveryRequests);
router.get('/metrics', protect, requireProvider, getDeliveryMetrics);
router.post('/dispatch', protect, requireProvider, createDeliveryRequest);
router.post('/broadcast', protect, requireProvider, broadcastDeliveryRequest);
router.post('/accept', protect, requireDriver, acceptDeliveryRequest);
router.post('/assign', protect, requireProvider, assignDriver);
router.post('/confirm-pickup', protect, requireDriver, confirmPickup);
router.post('/verify-otp', protect, requireDriver, verifyOtp);
router.post('/send-otp-sms', protect, requireDriver, sendPickupOtpSms);
router.post('/:deliveryId/pickup-otp/send', protect, requireDriver, sendPickupOtpSms);
router.post('/:deliveryId/pickup-otp/verify', protect, requireDriver, verifyOtp);
router.post('/customer-arrival-otp/send', protect, requireProvider, sendCustomerArrivalOtp);
router.post('/customer-arrival-otp/verify', protect, requireProvider, verifyCustomerArrivalOtp);
router.post('/:deliveryId/customer-arrival-otp/send', protect, requireProvider, sendCustomerArrivalOtp);
router.post('/:deliveryId/customer-arrival-otp/verify', protect, requireProvider, verifyCustomerArrivalOtp);
router.post('/customer-handover-otp/send', protect, requireDriver, sendCustomerHandoverOtp);
router.post('/customer-handover-otp/verify', protect, requireDriver, verifyCustomerHandoverOtp);
router.post('/:deliveryId/customer-handover-otp/send', protect, requireDriver, sendCustomerHandoverOtp);
router.post('/:deliveryId/customer-handover-otp/verify', protect, requireDriver, verifyCustomerHandoverOtp);
router.post('/status', protect, updateDeliveryStatus);
router.post('/location', protect, requireDriver, updateDriverLocation);
router.get('/drivers/nearby', protect, getNearbyDrivers);
router.post('/retry', protect, requireProvider, retryDelivery);
router.post('/cancel', protect, requireProvider, cancelDelivery);

module.exports = router;

