const express = require('express');
const router = express.Router();
const { protect, requireProvider, providerAuthWithFallback } = require('../middleware/authMiddleware');
const { 
  createRequest, 
  getRequests, 
  getMyRequests,
  updateRequest, 
  deleteRequest,
  acceptRequest,
  declineRequest,
  simulateLiveRequest,
  submitOffer,
  selectOffer,
  getOffersForRequest,
  withdrawOffer,
  getProviderOffers
} = require('../controllers/requestController');

router.get('/', providerAuthWithFallback, getRequests);
router.get('/my-requests', getMyRequests);
router.get('/provider/my-offers', providerAuthWithFallback, getProviderOffers);
router.post('/', createRequest);
router.post('/simulate', providerAuthWithFallback, simulateLiveRequest);
router.post('/:id/accept', providerAuthWithFallback, acceptRequest);
router.put('/:id/accept', providerAuthWithFallback, acceptRequest);
router.post('/:id/decline', providerAuthWithFallback, declineRequest);
router.put('/:id/decline', providerAuthWithFallback, declineRequest);
router.post('/:id/offers', providerAuthWithFallback, submitOffer);
router.get('/:id/offers', getOffersForRequest);
router.post('/:id/offers/:offerId/select', selectOffer);
router.post('/:id/offers/:offerId/withdraw', providerAuthWithFallback, withdrawOffer);
router.put('/:id', providerAuthWithFallback, updateRequest);
router.delete('/:id', providerAuthWithFallback, deleteRequest);

module.exports = router;


