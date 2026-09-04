const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getOrders, 
  createOrder, 
  updateOrder, 
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder 
} = require('../controllers/orderController');

router.get('/', protect, requireProvider, getOrders);
router.post('/', protect, requireProvider, createOrder);
router.put('/:id', protect, requireProvider, updateOrder);
router.put('/:id/accept-delivery', protect, requireProvider, acceptDelivery);
router.put('/:id/delivery-status', protect, requireProvider, updateDeliveryStatus);
router.delete('/:id', protect, requireProvider, deleteOrder);

module.exports = router;
