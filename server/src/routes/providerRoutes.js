const express = require('express');
const router = express.Router();
const { getProviders, sendProviderOtp, registerProvider, getProviderDashboardStats, toggleProviderStatus } = require('../controllers/providerController');

router.get('/', getProviders);
router.get('/dashboard', getProviderDashboardStats);
router.put('/status', toggleProviderStatus);
router.post('/send-otp', sendProviderOtp);
router.post('/', registerProvider);

module.exports = router;
