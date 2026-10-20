const express = require('express');
const router = express.Router();
const { protect, requireProvider, providerAuthWithFallback } = require('../middleware/authMiddleware');
const { 
  getOrders, 
  getOrderById,
  createOrder, 
  createCustomerOrder,
  getCustomerOrders,
  updateOrder, 
  acceptOrder,
  rejectOrder,
  prepareOrder,
  readyOrder,
  confirmOrderPickup,
  cancelOrder,
  verifyPayment,
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder 
} = require('../controllers/orderController');

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.tiffinlink_token || req.cookies?.token) {
    token = req.cookies.tiffinlink_token || req.cookies.token;
  }
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026');
      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');
      if (user) req.user = user;
    } catch (e) {}
  }
  next();
};

router.get('/my-orders', optionalProtect, getCustomerOrders);

router.post('/customer', protect, createCustomerOrder);
router.post('/customer-order', protect, createCustomerOrder);

router.get('/', providerAuthWithFallback, getOrders);
router.get('/provider', providerAuthWithFallback, getOrders);
router.get('/history', providerAuthWithFallback, getOrders);
router.get('/:id', optionalProtect, getOrderById);
router.post('/', protect, (req, res, next) => {
  if (req.user && req.user.role === 'provider' && req.providerId) {
    return createOrder(req, res, next);
  }
  return createCustomerOrder(req, res, next);
});
router.put('/:id', providerAuthWithFallback, updateOrder);

router.post('/:id/accept', providerAuthWithFallback, acceptOrder);
router.put('/:id/accept', providerAuthWithFallback, acceptOrder);
router.post('/:id/reject', providerAuthWithFallback, rejectOrder);
router.put('/:id/reject', providerAuthWithFallback, rejectOrder);
router.post('/:id/decline', providerAuthWithFallback, rejectOrder);
router.put('/:id/decline', providerAuthWithFallback, rejectOrder);

router.post('/:id/prepare', providerAuthWithFallback, prepareOrder);
router.put('/:id/prepare', providerAuthWithFallback, prepareOrder);

router.post('/:id/ready', providerAuthWithFallback, readyOrder);
router.put('/:id/ready', providerAuthWithFallback, readyOrder);

router.post('/:id/confirm-pickup', providerAuthWithFallback, confirmOrderPickup);
router.put('/:id/confirm-pickup', providerAuthWithFallback, confirmOrderPickup);

router.post('/:id/cancel', protect, cancelOrder);
router.put('/:id/cancel', protect, cancelOrder);

router.post('/:id/payment-verify', protect, verifyPayment);

router.put('/:id/accept-delivery', protect, acceptDelivery);
router.put('/:id/delivery-status', protect, updateDeliveryStatus);
router.delete('/:id', protect, requireProvider, deleteOrder);

module.exports = router;
