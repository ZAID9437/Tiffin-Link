const express = require('express');
const router = express.Router();
const { getProviderSettings, updateProviderSettings } = require('../controllers/settingController');

router.get('/provider', getProviderSettings);
router.put('/provider', updateProviderSettings);

module.exports = router;
