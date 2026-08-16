const express = require('express');
const router = express.Router();
const {
  getCapacity,
  updateCapacitySettings,
  updateDateCapacity,
  checkCapacityAvailable
} = require('../controllers/capacityController');

router.get('/', getCapacity);
router.post('/settings', updateCapacitySettings);
router.put('/date', updateDateCapacity);
router.get('/check-today', checkCapacityAvailable);

module.exports = router;
