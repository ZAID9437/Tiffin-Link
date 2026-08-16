const express = require('express');
const router = express.Router();
const {
  getServiceArea,
  updateServiceAreaSettings,
  addServiceArea,
  updateServiceArea,
  deleteServiceArea
} = require('../controllers/serviceAreaController');

router.get('/', getServiceArea);
router.post('/settings', updateServiceAreaSettings);
router.post('/areas', addServiceArea);
router.put('/areas/:id', updateServiceArea);
router.delete('/areas/:id', deleteServiceArea);

module.exports = router;
