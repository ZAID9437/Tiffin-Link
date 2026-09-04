const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { getCustomers, getCustomerById } = require('../controllers/customerController');

router.get('/', protect, requireProvider, getCustomers);
router.get('/:id', protect, requireProvider, getCustomerById);

module.exports = router;
