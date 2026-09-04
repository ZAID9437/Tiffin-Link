const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', protect, requireProvider, getAnalytics);

module.exports = router;

