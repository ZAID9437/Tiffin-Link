const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById } = require('../controllers/customerController');

router.get('/', getCustomers);
router.get('/:id', getCustomerById);

module.exports = router;
