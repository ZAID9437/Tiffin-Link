const express = require('express');
const router = express.Router();
const { registerDelivery } = require('../controllers/deliveryController');
const {
  getDeliveryRequests,
  createDeliveryRequest,
  acceptDeliveryRequest,
  assignDriver,
  confirmPickup,
  updateDeliveryStatus,
  updateDriverLocation,
  getNearbyDrivers,
  retryDelivery,
  cancelDelivery
} = require('../controllers/deliveryDispatchController');

router.post('/', registerDelivery);
router.get('/requests', getDeliveryRequests);
router.post('/dispatch', createDeliveryRequest);
router.post('/accept', acceptDeliveryRequest);
router.post('/assign', assignDriver);
router.post('/confirm-pickup', confirmPickup);
router.post('/status', updateDeliveryStatus);
router.post('/location', updateDriverLocation);
router.get('/drivers/nearby', getNearbyDrivers);
router.post('/retry', retryDelivery);
router.post('/cancel', cancelDelivery);

module.exports = router;
