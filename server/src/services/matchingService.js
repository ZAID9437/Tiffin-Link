const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const MealRequest = require('../models/MealRequest');
const ProviderMatch = require('../models/ProviderMatch');
const { getIO } = require('./socketService');

// Haversine distance in kilometers
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
};

// Deterministic rule-based smart matching scoring algorithm
const computeProviderMatchScore = ({ provider, request, distanceKm }) => {
  let proximityScore = 0;
  let cuisineScore = 0;
  let ratingScore = 0;
  let prepTimeScore = 0;
  let budgetScore = 0;
  let reliabilityScore = 0;
  const reasonCodes = [];

  // 1. Proximity score (Max 30 points)
  if (distanceKm <= 1.5) {
    proximityScore = 30;
    reasonCodes.push('PROXIMITY_IMMEDIATE_NEIGHBORHOOD');
  } else if (distanceKm <= 3.5) {
    proximityScore = 24;
    reasonCodes.push('PROXIMITY_CLOSE_RADIUS');
  } else if (distanceKm <= 6.0) {
    proximityScore = 18;
    reasonCodes.push('PROXIMITY_MODERATE_DISTANCE');
  } else if (distanceKm <= 10.0) {
    proximityScore = 10;
    reasonCodes.push('PROXIMITY_OUTER_RADIUS');
  } else {
    proximityScore = 4;
  }

  // 2. Cuisine / Category match (Max 25 points)
  const reqCategory = (request.category || request.mealType || '').toLowerCase();
  const provCuisines = String(provider.cuisines || '').toLowerCase();
  const provDesc = String(provider.description || '').toLowerCase();
  const provTags = (provider.tags || []).map(t => String(t).toLowerCase());

  const isExactCuisineMatch = provCuisines.includes(reqCategory) || provTags.includes(reqCategory);
  const isPartialMatch = provDesc.includes(reqCategory) || 
    (reqCategory.includes('veg') && (provTags.includes('pure veg') || provCuisines.includes('veg'))) ||
    (reqCategory.includes('jain') && (provDesc.includes('jain') || provDesc.includes('satvik')));

  if (isExactCuisineMatch) {
    cuisineScore = 25;
    reasonCodes.push('CUISINE_EXACT_MATCH');
  } else if (isPartialMatch) {
    cuisineScore = 18;
    reasonCodes.push('CUISINE_COMPATIBLE');
  } else {
    cuisineScore = 10;
    reasonCodes.push('CUISINE_GENERAL_HOMESTYLE');
  }

  // 3. Provider Rating (Max 20 points)
  const rating = Number(provider.rating) || 4.0;
  if (rating >= 4.8) {
    ratingScore = 20;
    reasonCodes.push('RATING_EXCELLENCE_TOP_TIER');
  } else if (rating >= 4.5) {
    ratingScore = 16;
    reasonCodes.push('RATING_HIGHLY_RATED');
  } else if (rating >= 4.0) {
    ratingScore = 12;
  } else {
    ratingScore = 8;
  }

  // 4. Prep Time / Speed (Max 15 points)
  const rawPrep = String(provider.avgPrepTime || provider.mealPrepTime || '20 min');
  const prepMinutes = parseInt(rawPrep.replace(/\D/g, ''), 10) || 20;
  if (prepMinutes <= 15) {
    prepTimeScore = 15;
    reasonCodes.push('PREP_SPEED_FAST');
  } else if (prepMinutes <= 25) {
    prepTimeScore = 11;
    reasonCodes.push('PREP_SPEED_STANDARD');
  } else {
    prepTimeScore = 6;
  }

  // 5. Budget compatibility (Max 10 points)
  const targetBudget = Number(request.budget) || 120;
  const provMealPrice = Number(provider.mealPrice || provider.price) || 120;
  if (provMealPrice > 0) {
    const diff = Math.abs(provMealPrice - targetBudget);
    if (diff <= 20) {
      budgetScore = 10;
      reasonCodes.push('BUDGET_ALIGNED');
    } else if (diff <= 50) {
      budgetScore = 6;
    } else {
      budgetScore = 3;
    }
  } else {
    budgetScore = 8;
  }

  // Extra urgency bonus for urgent requests
  if (request.urgencyLevel === 'emergency' || request.isUrgent) {
    if (prepMinutes <= 20) {
      prepTimeScore += 5;
      reasonCodes.push('EMERGENCY_READY_KITCHEN');
    }
  }

  const totalScore = Math.min(100, proximityScore + cuisineScore + ratingScore + prepTimeScore + budgetScore + reliabilityScore);

  return {
    score: totalScore,
    breakdown: {
      proximityScore,
      cuisineScore,
      ratingScore,
      prepTimeScore,
      budgetScore,
      reliabilityScore
    },
    reasonCodes,
    distanceKm
  };
};

// Evaluate and match eligible providers for a meal request
const evaluateMatchingForRequest = async (requestId, options = {}) => {
  const maxRadiusKm = options.maxRadiusKm || 12;
  const minScore = options.minScore || 35;
  const maxMatches = options.maxMatches || 10;

  const request = await MealRequest.findById(requestId);
  if (!request) {
    throw new Error('Meal request not found');
  }

  request.matchingStatus = 'evaluating';
  await request.save();

  // Determine request coordinates
  let reqLat = 23.0300;
  let reqLng = 72.5178;

  if (request.coordinates && Array.isArray(request.coordinates.coordinates) && request.coordinates.coordinates.length === 2) {
    reqLng = request.coordinates.coordinates[0];
    reqLat = request.coordinates.coordinates[1];
  }

  // Find active approved providers accepting orders
  const providers = await Provider.find({
    status: { $in: ['active', 'approved'] },
    isAcceptingOrders: { $ne: false }
  });

  const scoredCandidates = [];

  for (const prov of providers) {
    // Determine provider coordinates
    let provLat = prov.address?.lat || 23.0300;
    let provLng = prov.address?.lng || 72.5178;

    if (prov.location && Array.isArray(prov.location.coordinates) && prov.location.coordinates.length === 2) {
      provLng = prov.location.coordinates[0];
      provLat = prov.location.coordinates[1];
    }

    const distanceKm = calculateHaversineKm(reqLat, reqLng, provLat, provLng);

    // Skip if beyond radius
    if (distanceKm > maxRadiusKm) continue;

    // Check if provider declined
    if (request.declinedByProviders && request.declinedByProviders.includes(prov._id.toString())) {
      continue;
    }

    const { score, breakdown, reasonCodes } = computeProviderMatchScore({
      provider: prov,
      request,
      distanceKm
    });

    if (score >= minScore) {
      scoredCandidates.push({
        provider,
        score,
        breakdown,
        reasonCodes,
        distanceKm
      });
    }
  }

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);
  const selectedMatches = scoredCandidates.slice(0, maxMatches);

  // Persist matches in MongoDB
  const savedMatches = [];
  const requestMatchesEmbed = [];

  for (const item of selectedMatches) {
    const prov = item.provider;
    const matchRecord = await ProviderMatch.findOneAndUpdate(
      { requestId: request._id, providerId: prov._id.toString() },
      {
        providerName: prov.name || prov.businessName || 'Home Kitchen',
        score: item.score,
        distanceKm: item.distanceKm,
        breakdown: item.breakdown,
        reasonCodes: item.reasonCodes,
        status: 'matched',
        notifiedAt: new Date()
      },
      { upsert: true, new: true }
    );
    savedMatches.push(matchRecord);

    requestMatchesEmbed.push({
      providerId: prov._id.toString(),
      providerName: prov.name || prov.businessName || 'Home Kitchen',
      score: item.score,
      distanceKm: item.distanceKm,
      breakdown: item.breakdown,
      reasonCodes: item.reasonCodes,
      notifiedAt: new Date()
    });

    // Notify provider via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.to(`provider:${prov._id.toString()}`).emit('matching:opportunity', {
          requestId: request._id,
          mealType: request.mealType,
          budget: request.budget,
          quantity: request.quantity,
          location: request.location,
          distanceKm: item.distanceKm,
          matchScore: item.score,
          urgencyLevel: request.urgencyLevel || 'standard',
          expiresAt: request.expiresAt
        });
      }
    } catch (sErr) {}
  }

  // Update request matching status
  request.matchingStatus = selectedMatches.length > 0 ? 'matched' : 'no_match';
  request.matches = requestMatchesEmbed;
  await request.save();

  // Notify customer room via Socket.IO
  try {
    const io = getIO();
    if (io) {
      if (request.customerId) {
        io.to(`customer:${request.customerId}`).emit('matching:completed', {
          requestId: request._id,
          matchesCount: selectedMatches.length,
          matches: requestMatchesEmbed
        });
      }
      io.emit('matching:results_updated', {
        requestId: request._id,
        matchesCount: selectedMatches.length
      });
    }
  } catch (sErr) {}

  return {
    success: true,
    requestId: request._id,
    matchesCount: savedMatches.length,
    matches: savedMatches
  };
};

module.exports = {
  calculateHaversineKm,
  computeProviderMatchScore,
  evaluateMatchingForRequest
};
