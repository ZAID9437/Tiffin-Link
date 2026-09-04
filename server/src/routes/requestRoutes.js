const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  createRequest, 
  getRequests, 
  updateRequest, 
  deleteRequest,
  acceptRequest,
  declineRequest,
  simulateLiveRequest
} = require('../controllers/requestController');

router.get('/', protect, getRequests);
router.post('/', createRequest);
router.post('/simulate', protect, simulateLiveRequest);
router.post('/:id/accept', protect, requireProvider, acceptRequest);
router.put('/:id/accept', protect, requireProvider, acceptRequest);
router.post('/:id/decline', protect, requireProvider, declineRequest);
router.put('/:id/decline', protect, requireProvider, declineRequest);
router.put('/:id', protect, requireProvider, updateRequest);
router.delete('/:id', protect, requireProvider, deleteRequest);

module.exports = router;


