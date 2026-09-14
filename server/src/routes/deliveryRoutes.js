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
  verifyCustomerHandoverOtp
} = require('../controllers/deliveryDispatchController');

router.post('/', registerDelivery);
router.get('/applications', getDeliveryApplications);
router.post('/verify-status', updateVerificationStatus);
router.get('/dashboard', protect, requireDriver, getDriverDashboardData);
router.get('/driver-dashboard', protect, requireDriver, getDriverDashboardData);
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

