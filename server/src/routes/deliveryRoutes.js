const express = require('express');
const router = express.Router();
const { registerDelivery } = require('../controllers/deliveryController');

router.post('/', registerDelivery);

module.exports = router;
