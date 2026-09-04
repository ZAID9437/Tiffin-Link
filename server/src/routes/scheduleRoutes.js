const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getSchedule,
  updateScheduleSettings,
  addSpecialDate,
  deleteSpecialDate,
  validateOrderEligibility
} = require('../controllers/scheduleController');

router.get('/', protect, requireProvider, getSchedule);
router.post('/settings', protect, requireProvider, updateScheduleSettings);
router.post('/special-date', protect, requireProvider, addSpecialDate);
router.delete('/special-date/:id', protect, requireProvider, deleteSpecialDate);
router.get('/validate-order', protect, validateOrderEligibility);

module.exports = router;

