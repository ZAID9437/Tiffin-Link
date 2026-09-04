const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { getProviders, sendProviderOtp, registerProvider, getProviderDashboardStats, toggleProviderStatus } = require('../controllers/providerController');

router.get('/', getProviders);
router.get('/dashboard', protect, requireProvider, getProviderDashboardStats);
router.put('/status', protect, requireProvider, toggleProviderStatus);
router.post('/send-otp', sendProviderOtp);
router.post('/', registerProvider);

module.exports = router;
