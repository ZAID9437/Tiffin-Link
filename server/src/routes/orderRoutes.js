const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getOrders, 
  getOrderById,
  createOrder, 
  updateOrder, 
  acceptOrder,
  rejectOrder,
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder 
} = require('../controllers/orderController');

router.get('/', protect, requireProvider, getOrders);
router.get('/provider', protect, requireProvider, getOrders);
router.get('/history', protect, requireProvider, getOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, requireProvider, createOrder);
router.put('/:id', protect, requireProvider, updateOrder);

router.post('/:id/accept', protect, requireProvider, acceptOrder);
router.put('/:id/accept', protect, requireProvider, acceptOrder);
router.post('/:id/reject', protect, requireProvider, rejectOrder);
router.put('/:id/reject', protect, requireProvider, rejectOrder);

router.put('/:id/accept-delivery', protect, requireProvider, acceptDelivery);
router.put('/:id/delivery-status', protect, requireProvider, updateDeliveryStatus);
router.delete('/:id', protect, requireProvider, deleteOrder);

module.exports = router;
