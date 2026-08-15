const express = require('express');
const router = express.Router();
const { 
  getOrders, 
  createOrder, 
  updateOrder, 
  acceptDelivery,
  updateDeliveryStatus,
  deleteOrder 
} = require('../controllers/orderController');

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.put('/:id/accept-delivery', acceptDelivery);
router.put('/:id/delivery-status', updateDeliveryStatus);
router.delete('/:id', deleteOrder);

module.exports = router;
