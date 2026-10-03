const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getCustomers, 
  getCustomerById,
  getCustomerAddresses,
  addCustomerAddress,
  deleteCustomerAddress
} = require('../controllers/customerController');

router.get('/addresses', protect, getCustomerAddresses);
router.post('/addresses', protect, addCustomerAddress);
router.delete('/addresses/:id', protect, deleteCustomerAddress);

router.get('/', protect, requireProvider, getCustomers);
router.get('/:id', protect, requireProvider, getCustomerById);

module.exports = router;
