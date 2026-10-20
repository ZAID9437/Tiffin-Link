import { apiRequest } from './api';

// 1. AI Smart Provider Matching API
export const evaluateMatching = (data) =>
  apiRequest('/v1/matching/evaluate', { method: 'POST', body: JSON.stringify(data) });

export const getRequestMatches = (requestId) =>
  apiRequest(`/v1/meal-requests/${requestId}/matches`, { method: 'GET' });

export const rematchRequest = (requestId) =>
  apiRequest(`/v1/meal-requests/${requestId}/rematch`, { method: 'POST' });

// 2. Multi-Provider Auction API
export const submitAuctionOffer = (requestId, data) =>
  apiRequest(`/v1/meal-requests/${requestId}/offers`, { method: 'POST', body: JSON.stringify(data) });

export const getRequestOffers = (requestId) =>
  apiRequest(`/v1/meal-requests/${requestId}/offers`, { method: 'GET' });

export const getOfferById = (offerId) =>
  apiRequest(`/v1/offers/${offerId}`, { method: 'GET' });

export const selectAuctionOffer = (offerId) =>
  apiRequest(`/v1/offers/${offerId}/select`, { method: 'POST' });

export const withdrawAuctionOffer = (offerId) =>
  apiRequest(`/v1/offers/${offerId}/withdraw`, { method: 'POST' });

// 3. Smart Route Optimization API
export const calculateDeliveryRoute = (data) =>
  apiRequest('/v1/routes/calculate', { method: 'POST', body: JSON.stringify(data) });

export const optimizeMultiStops = (stops) =>
  apiRequest('/v1/routes/optimize', { method: 'POST', body: JSON.stringify({ stops }) });

export const getDeliveryRoute = (deliveryId) =>
  apiRequest(`/v1/deliveries/${deliveryId}/route`, { method: 'GET' });

export const recalculateDeliveryRoute = (deliveryId, driverCoordinates) =>
  apiRequest(`/v1/deliveries/${deliveryId}/recalculate-route`, { method: 'POST', body: JSON.stringify({ driverCoordinates }) });

// 4. Emergency Meal Requests API
export const createEmergencyMealRequest = (data) =>
  apiRequest('/v1/emergency-requests', { method: 'POST', body: JSON.stringify(data) });

export const getEmergencyRequestStatus = (requestId) =>
  apiRequest(`/v1/emergency-requests/${requestId}`, { method: 'GET' });

export const getProviderEmergencyRequests = () =>
  apiRequest('/v1/providers/emergency-requests', { method: 'GET' });

// 5. Smart Queues API
export const getProviderPreparationQueue = (providerId) =>
  apiRequest(`/v1/providers/queues/preparation${providerId ? `?providerId=${providerId}` : ''}`, { method: 'GET' });

export const updatePreparationQueueStatus = (orderId, status, providerId) =>
  apiRequest(`/v1/providers/queues/${orderId}/status`, { method: 'POST', body: JSON.stringify({ status, providerId }) });

export const getAvailableDeliveryQueue = () =>
  apiRequest('/v1/delivery/queues/available', { method: 'GET' });

export const claimDeliveryQueueItem = (orderId, driverData = {}) =>
  apiRequest(`/v1/delivery/queues/${orderId}/claim`, { method: 'POST', body: JSON.stringify(driverData) });

export const getAdminQueuesOverview = () =>
  apiRequest('/v1/admin/queues/overview', { method: 'GET' });

// 6. Fraud Detection API
export const evaluateRisk = (data) =>
  apiRequest('/v1/risk/evaluate', { method: 'POST', body: JSON.stringify(data) });

export const getFraudAlerts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/v1/admin/fraud-alerts${query ? `?${query}` : ''}`, { method: 'GET' });
};

export const getFraudAlertById = (alertId) =>
  apiRequest(`/v1/admin/fraud-alerts/${alertId}`, { method: 'GET' });

export const updateFraudAlertStatus = (alertId, data) =>
  apiRequest(`/v1/admin/fraud-alerts/${alertId}/status`, { method: 'PATCH', body: JSON.stringify(data) });

// 7. Corporate Meal Ordering API
export const createOrganization = (data) =>
  apiRequest('/v1/corporate/organizations', { method: 'POST', body: JSON.stringify(data) });

export const getOrganizations = () =>
  apiRequest('/v1/corporate/organizations', { method: 'GET' });

export const addOrganizationMember = (organizationId, data) =>
  apiRequest(`/v1/corporate/organizations/${organizationId}/members`, { method: 'POST', body: JSON.stringify(data) });

export const createCorporateMealOrder = (data) =>
  apiRequest('/v1/corporate/meal-orders', { method: 'POST', body: JSON.stringify(data) });

export const getCorporateMealOrders = (organizationId) =>
  apiRequest(`/v1/corporate/meal-orders${organizationId ? `?organizationId=${organizationId}` : ''}`, { method: 'GET' });

export const approveCorporateMealOrder = (orderId) =>
  apiRequest(`/v1/corporate/meal-orders/${orderId}/approve`, { method: 'POST' });

// 8. Hostel / PG Bulk Ordering API
export const createHostel = (data) =>
  apiRequest('/v1/hostels', { method: 'POST', body: JSON.stringify(data) });

export const getHostels = () =>
  apiRequest('/v1/hostels', { method: 'GET' });

export const createHostelGroupOrder = (hostelId, data) =>
  apiRequest(`/v1/hostels/${hostelId}/group-orders`, { method: 'POST', body: JSON.stringify(data) });

export const submitResidentSelection = (groupOrderId, data) =>
  apiRequest(`/v1/group-orders/${groupOrderId}/selections`, { method: 'POST', body: JSON.stringify(data) });

export const getGroupOrderById = (groupOrderId) =>
  apiRequest(`/v1/group-orders/${groupOrderId}`, { method: 'GET' });

export const finalizeHostelGroupOrder = (groupOrderId) =>
  apiRequest(`/v1/group-orders/${groupOrderId}/finalize`, { method: 'POST' });

// 9. Hyperlocal Broadcasting API
export const createBroadcast = (data) =>
  apiRequest('/v1/broadcasts', { method: 'POST', body: JSON.stringify(data) });

export const getActiveBroadcasts = (audienceType) =>
  apiRequest(`/v1/broadcasts${audienceType ? `?audienceType=${audienceType}` : ''}`, { method: 'GET' });

export const acknowledgeBroadcast = (broadcastId, data = {}) =>
  apiRequest(`/v1/broadcasts/${broadcastId}/acknowledge`, { method: 'POST', body: JSON.stringify(data) });

export const dismissBroadcast = (broadcastId, data = {}) =>
  apiRequest(`/v1/broadcasts/${broadcastId}/dismiss`, { method: 'POST', body: JSON.stringify(data) });

// 10. Customer Experience & Quality Assurance APIs
export const submitTasteGuaranteeClaim = (data) =>
  apiRequest('/v1/customer/taste-guarantee-claim', { method: 'POST', body: JSON.stringify(data) });

export const getDailyNutritionSummary = () =>
  apiRequest('/v1/customer/nutrition-summary', { method: 'GET' });

export const getDietitians = () =>
  apiRequest('/v1/customer/dietitians', { method: 'GET' });

export const bookDietitianConsultation = (data) =>
  apiRequest('/v1/customer/dietitian-consultation', { method: 'POST', body: JSON.stringify(data) });

export const requestMealSwap = (data) =>
  apiRequest('/v1/customer/meal-swap', { method: 'POST', body: JSON.stringify(data) });

export const getMySwaps = () =>
  apiRequest('/v1/customer/meal-swaps', { method: 'GET' });

export const getKitchenAuditData = (kitchenName) =>
  apiRequest(`/v1/kitchens/audit?name=${encodeURIComponent(kitchenName || '')}`, { method: 'GET' });

export const getDabbaDepositStatus = () =>
  apiRequest('/v1/customer/dabba-deposits', { method: 'GET' });

export const requestDabbaReturnPickup = (data = {}) =>
  apiRequest('/v1/customer/dabba-return', { method: 'POST', body: JSON.stringify(data) });

export const submitCorporateInquiry = (data) =>
  apiRequest('/v1/corporate/inquiry', { method: 'POST', body: JSON.stringify(data) });

export const submitCommunityRecipe = (data) =>
  apiRequest('/v1/community/recipes', { method: 'POST', body: JSON.stringify(data) });

