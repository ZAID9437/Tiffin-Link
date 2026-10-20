const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/advancedFeaturesController');

// 1. AI Smart Provider Matching
router.post('/matching/evaluate', ctrl.evaluateMatching);
router.get('/meal-requests/:requestId/matches', ctrl.getRequestMatches);
router.post('/meal-requests/:requestId/rematch', ctrl.rematchRequest);

// 2. Multi-Provider Auction
router.post('/meal-requests/:requestId/offers', ctrl.submitOffer);
router.get('/meal-requests/:requestId/offers', ctrl.getRequestOffers);
router.get('/offers/:offerId', ctrl.getOfferById);
router.post('/offers/:offerId/select', ctrl.selectOffer);
router.post('/offers/:offerId/withdraw', ctrl.withdrawOffer);

// 3. Smart Route Optimization
router.post('/routes/calculate', ctrl.calculateRoute);
router.post('/routes/optimize', ctrl.optimizeStops);
router.get('/deliveries/:deliveryId/route', ctrl.getDeliveryRoute);
router.post('/deliveries/:deliveryId/recalculate-route', ctrl.recalculateRoute);

// 4. Emergency Meal Requests
router.post('/emergency-requests', ctrl.createEmergencyRequest);
router.get('/emergency-requests/:requestId', ctrl.getEmergencyRequestStatus);
router.get('/providers/emergency-requests', ctrl.getProviderEmergencyRequests);

// 5. Smart Queues
router.get('/providers/queues/preparation', ctrl.getProviderPreparationQueueController);
router.post('/providers/queues/:orderId/status', ctrl.updatePreparationQueueStatusController);
router.get('/delivery/queues/available', ctrl.getAvailableDeliveryQueueController);
router.post('/delivery/queues/:orderId/claim', ctrl.claimDeliveryQueueItemController);
router.get('/admin/queues/overview', ctrl.getAdminQueuesOverview);

// 6. Fraud Detection
router.post('/risk/evaluate', ctrl.evaluateRisk);
router.get('/admin/fraud-alerts', ctrl.getFraudAlerts);
router.get('/admin/fraud-alerts/:alertId', ctrl.getFraudAlertById);
router.patch('/admin/fraud-alerts/:alertId/status', ctrl.updateFraudAlertStatus);

// 7. Corporate Meal Ordering
router.post('/corporate/organizations', ctrl.createOrganizationController);
router.get('/corporate/organizations', ctrl.getOrganizations);
router.post('/corporate/organizations/:organizationId/members', ctrl.addMemberController);
router.post('/corporate/meal-orders', ctrl.createCorporateMealOrderController);
router.get('/corporate/meal-orders', ctrl.getCorporateMealOrders);
router.post('/corporate/meal-orders/:orderId/approve', ctrl.approveCorporateMealOrderController);

// 8. Hostel / PG Bulk Ordering
router.post('/hostels', ctrl.createHostelController);
router.get('/hostels', ctrl.getHostels);
router.post('/hostels/:hostelId/group-orders', ctrl.createGroupOrderController);
router.post('/group-orders/:groupOrderId/selections', ctrl.submitResidentSelectionController);
router.get('/group-orders/:groupOrderId', ctrl.getGroupOrderById);
router.post('/group-orders/:groupOrderId/finalize', ctrl.finalizeHostelGroupOrderController);

// 9. Hyperlocal Broadcasting
router.post('/broadcasts', ctrl.createBroadcast);
router.get('/broadcasts', ctrl.getActiveBroadcasts);
router.post('/broadcasts/:broadcastId/acknowledge', ctrl.acknowledgeBroadcastController);
router.post('/broadcasts/:broadcastId/dismiss', ctrl.dismissBroadcastController);

// 10. Customer Experience & Quality Assurance
router.post('/customer/taste-guarantee-claim', ctrl.submitTasteGuaranteeClaimController);
router.get('/customer/nutrition-summary', ctrl.getNutritionSummaryController);
router.get('/customer/dietitians', ctrl.getDietitiansController);
router.post('/customer/dietitian-consultation', ctrl.bookDietitianConsultationController);
router.post('/customer/meal-swap', ctrl.requestMealSwapController);
router.get('/customer/meal-swaps', ctrl.getMySwapsController);
router.get('/kitchens/audit', ctrl.getKitchenAuditDataController);
router.get('/customer/dabba-deposits', ctrl.getDabbaDepositStatusController);
router.post('/customer/dabba-return', ctrl.requestDabbaReturnPickupController);
router.post('/corporate/inquiry', ctrl.submitCorporateInquiryController);
router.post('/community/recipes', ctrl.submitCommunityRecipeController);

module.exports = router;

