const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getServiceArea,
  updateServiceAreaSettings,
  addServiceArea,
  updateServiceArea,
  deleteServiceArea
} = require('../controllers/serviceAreaController');

router.get('/', protect, requireProvider, getServiceArea);
router.post('/settings', protect, requireProvider, updateServiceAreaSettings);
router.post('/areas', protect, requireProvider, addServiceArea);
router.put('/areas/:id', protect, requireProvider, updateServiceArea);
router.delete('/areas/:id', protect, requireProvider, deleteServiceArea);

module.exports = router;

