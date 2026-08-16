const express = require('express');
const router = express.Router();
const {
  getSchedule,
  updateScheduleSettings,
  addSpecialDate,
  deleteSpecialDate,
  validateOrderEligibility
} = require('../controllers/scheduleController');

router.get('/', getSchedule);
router.post('/settings', updateScheduleSettings);
router.post('/special-date', addSpecialDate);
router.delete('/special-date/:id', deleteSpecialDate);
router.get('/validate-order', validateOrderEligibility);

module.exports = router;
