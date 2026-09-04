const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { getProviderSettings, updateProviderSettings } = require('../controllers/settingController');

router.get('/provider', protect, requireProvider, getProviderSettings);
router.put('/provider', protect, requireProvider, updateProviderSettings);

module.exports = router;

