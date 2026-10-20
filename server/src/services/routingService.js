const RoutePlan = require('../models/RoutePlan');
const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');

// Haversine direct line calculation
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
};

// Generate interpolated intermediate waypoints between two points
const generateInterpolatedWaypoints = (p1, p2, steps = 5) => {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = p1.lat + (p2.lat - p1.lat) * fraction;
    const lng = p1.lng + (p2.lng - p1.lng) * fraction;
    // Inject subtle road curvature variation
    const jitterLat = i > 0 && i < steps ? (Math.sin(i) * 0.0004) : 0;
    const jitterLng = i > 0 && i < steps ? (Math.cos(i) * 0.0004) : 0;
    points.push([
      Math.round((lng + jitterLng) * 10000) / 10000,
      Math.round((lat + jitterLat) * 10000) / 10000
    ]);
  }
  return points;
};

// Query OSRM routing engine or fall back reliably
const fetchOsrmRoute = async (coordinatesList) => {
  // coordinatesList format: [[lng, lat], [lng, lat], ...]
  try {
    const coordString = coordinatesList.map(c => `${c[0]},${c[1]}`).join(';');
    const url = `http://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        return {
          source: 'osrm_live',
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMinutes: Math.round(route.duration / 60),
          geometry: route.geometry?.coordinates || []
        };
      }
    }
  } catch (err) {
    // Network or timeout, cleanly degrade to fallback
  }

  // Fallback: Haversine with 1.35x road curvature factor and 25 km/h urban speed
  let totalKm = 0;
  const polyline = [];

  for (let i = 0; i < coordinatesList.length - 1; i++) {
    const c1 = coordinatesList[i];
    const c2 = coordinatesList[i + 1];
    const segmentKm = haversineKm(c1[1], c1[0], c2[1], c2[0]);
    totalKm += segmentKm * 1.35; // City road winding factor
    const segmentPoints = generateInterpolatedWaypoints({ lat: c1[1], lng: c1[0] }, { lat: c2[1], lng: c2[0] });
    polyline.push(...segmentPoints);
  }

  const durationMinutes = Math.max(8, Math.round((totalKm / 25) * 60) + 5); // 25 km/h avg speed + 5 min buffer

  return {
    source: 'road_model_fallback',
    distanceKm: Math.round(totalKm * 10) / 10,
    durationMinutes,
    geometry: polyline
  };
};

// Calculate driver -> pickup -> dropoff route for a delivery
const calculateDeliveryRoute = async ({
  deliveryId,
  driverCoordinates,
  pickupCoordinates,
  dropoffCoordinates,
  providerName = 'Kitchen',
  customerName = 'Customer',
  orderId = ''
}) => {
  const driverPos = driverCoordinates || { lat: 23.0300, lng: 72.5178 };
  const pickupPos = pickupCoordinates || { lat: 23.0358, lng: 72.5293 };
  const dropoffPos = dropoffCoordinates || { lat: 23.0425, lng: 72.5150 };

  const coords = [
    [driverPos.lng, driverPos.lat],
    [pickupPos.lng, pickupPos.lat],
    [dropoffPos.lng, dropoffPos.lat]
  ];

  const routeResult = await fetchOsrmRoute(coords);

  const stops = [
    {
      stopType: 'driver_start',
      sequence: 1,
      address: 'Driver Current Location',
      coordinates: driverPos,
      orderId,
      status: 'arrived'
    },
    {
      stopType: 'pickup',
      sequence: 2,
      address: `${providerName} Kitchen`,
      coordinates: pickupPos,
      orderId,
      targetEntityName: providerName,
      status: 'pending'
    },
    {
      stopType: 'dropoff',
      sequence: 3,
      address: `${customerName} Delivery Address`,
      coordinates: dropoffPos,
      orderId,
      targetEntityName: customerName,
      status: 'pending'
    }
  ];

  const routePlan = await RoutePlan.findOneAndUpdate(
    { deliveryId },
    {
      orderId,
      driverId: 'CURRENT_DRIVER',
      providerName,
      customerName,
      stops,
      totalDistanceKm: routeResult.distanceKm,
      totalDurationMinutes: routeResult.durationMinutes,
      routeGeometry: routeResult.geometry,
      routingSource: routeResult.source,
      status: 'active'
    },
    { upsert: true, new: true }
  );

  return routePlan;
};

// Optimize multi-stop route sequencing ensuring pickups precede dropoffs
const optimizeMultiStopRoute = async (stopsList) => {
  // Validate that pickups happen before dropoffs
  const pickups = stopsList.filter(s => s.stopType === 'pickup');
  const dropoffs = stopsList.filter(s => s.stopType === 'dropoff');

  // Simple sequencing heuristic: Order all pickups first, then their corresponding dropoffs
  const orderedStops = [...pickups, ...dropoffs].map((stop, index) => ({
    ...stop,
    sequence: index + 1
  }));

  const coords = orderedStops.map(s => [s.coordinates.lng, s.coordinates.lat]);
  const routeResult = await fetchOsrmRoute(coords);

  return {
    orderedStops,
    totalDistanceKm: routeResult.distanceKm,
    totalDurationMinutes: routeResult.durationMinutes,
    geometry: routeResult.geometry,
    source: routeResult.source
  };
};

module.exports = {
  haversineKm,
  fetchOsrmRoute,
  calculateDeliveryRoute,
  optimizeMultiStopRoute
};
