const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
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
  getEligibleRequestsForDriver,
  acceptDeliveryRequestAtomic,
  declineDeliveryRequest,
  verifyOtp,
  retryDelivery,
  cancelDelivery
} = require('../controllers/deliveryDispatchController');

router.post('/', registerDelivery);
router.get('/applications', getDeliveryApplications);
router.post('/verify-status', updateVerificationStatus);
router.get('/dashboard', getDriverDashboardData);
router.get('/driver-dashboard', getDriverDashboardData);
router.get('/driver-requests', getEligibleRequestsForDriver);
router.post('/requests/:requestId/accept', acceptDeliveryRequestAtomic);
router.post('/requests/:requestId/decline', declineDeliveryRequest);
router.post('/status/toggle', toggleDriverStatus);
router.get('/requests', protect, requireProvider, getDeliveryRequests);
router.get('/metrics', protect, requireProvider, getDeliveryMetrics);
router.post('/dispatch', protect, requireProvider, createDeliveryRequest);
router.post('/broadcast', protect, requireProvider, broadcastDeliveryRequest);
router.post('/accept', acceptDeliveryRequest);
router.post('/assign', assignDriver);
router.post('/confirm-pickup', confirmPickup);
router.post('/verify-otp', verifyOtp);
router.post('/send-otp-sms', sendPickupOtpSms);
router.post('/status', updateDeliveryStatus);
router.post('/location', updateDriverLocation);
router.get('/drivers/nearby', getNearbyDrivers);
router.post('/retry', protect, requireProvider, retryDelivery);
router.post('/cancel', protect, requireProvider, cancelDelivery);

module.exports = router;
