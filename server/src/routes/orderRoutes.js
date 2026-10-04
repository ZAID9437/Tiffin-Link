const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
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

router.get('/', protect, requireProvider, getOrders);
router.get('/provider', protect, requireProvider, getOrders);
router.get('/history', protect, requireProvider, getOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, (req, res, next) => {
  if (req.user && req.user.role === 'provider' && req.providerId) {
    return createOrder(req, res, next);
  }
  return createCustomerOrder(req, res, next);
});
router.put('/:id', protect, requireProvider, updateOrder);

router.post('/:id/accept', protect, requireProvider, acceptOrder);
router.put('/:id/accept', protect, requireProvider, acceptOrder);
router.post('/:id/reject', protect, requireProvider, rejectOrder);
router.put('/:id/reject', protect, requireProvider, rejectOrder);

router.post('/:id/prepare', protect, requireProvider, prepareOrder);
router.put('/:id/prepare', protect, requireProvider, prepareOrder);

router.post('/:id/ready', protect, requireProvider, readyOrder);
router.put('/:id/ready', protect, requireProvider, readyOrder);

router.post('/:id/confirm-pickup', protect, requireProvider, confirmOrderPickup);
router.put('/:id/confirm-pickup', protect, requireProvider, confirmOrderPickup);

router.post('/:id/cancel', protect, cancelOrder);
router.put('/:id/cancel', protect, cancelOrder);

router.post('/:id/payment-verify', protect, verifyPayment);

router.put('/:id/accept-delivery', protect, acceptDelivery);
router.put('/:id/delivery-status', protect, updateDeliveryStatus);
router.delete('/:id', protect, requireProvider, deleteOrder);

module.exports = router;
