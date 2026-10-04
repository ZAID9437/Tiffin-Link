const mongoose = require('mongoose');
const User = require('../models/User');
const UserLocation = require('../models/UserLocation');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

/**
 * Perform real reverse geocoding via Google Maps Geocoding API or OpenStreetMap Nominatim
 */
const reverseGeocodeCoords = async (lat, lng) => {
  // 1. Try Google Geocoding API if key configured
  const apiKey = process.env.GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
        { signal: AbortSignal.timeout(4000) }
      );
      const gData = await gRes.json();
      if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
        const first = gData.results[0];
        let city = '';
        let state = '';
        let country = '';

        for (const comp of first.address_components || []) {
          if (comp.types.includes('locality')) city = comp.long_name;
          else if (!city && comp.types.includes('administrative_area_level_2')) city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
          if (comp.types.includes('country')) country = comp.long_name;
        }

        return {
          address: first.formatted_address || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
          city: city || 'Ahmedabad',
          state: state || 'Gujarat',
          country: country || 'India'
        };
      }
    } catch (gErr) {
      console.warn('Google reverse geocode failed, falling back to OSM Nominatim:', gErr.message);
    }
  }

  // 2. OpenStreetMap Nominatim Provider (standard, free, zero-key reverse geocoder)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TiffinLink-Application/1.0 (https://tiffinlink.com; support@tiffinlink.com)',
          'Accept-Language': 'en'
        },
        signal: AbortSignal.timeout(5000)
      }
    );

    const data = await res.json();
    if (data && (data.display_name || data.address)) {
      const a = data.address || {};
      const street = a.road || a.pedestrian || a.suburb || a.neighbourhood || a.residential || '';
      const city = a.city || a.town || a.village || a.city_district || a.county || '';
      const state = a.state || a.region || '';
      const country = a.country || '';

      // Clean formatted address
      const parts = [street, city, state, country].filter(Boolean);
      const cleanAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);

      return {
        address: cleanAddress,
        city: city || state || 'Local Area',
        state: state || '',
        country: country || ''
      };
    }
  } catch (osmErr) {
    console.warn('OSM Nominatim reverse geocode attempt error:', osmErr.message);
  }

  // 3. Resilient fallback if all remote providers fail (preserves real GPS coords)
  return {
    address: `GPS Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`,
    city: '',
    state: '',
    country: ''
  };
};

// @desc    Reverse geocode real device coordinates into readable address
// @route   GET /api/location/reverse-geocode
const getReverseGeocode = async (req, res) => {
  try {
    const rawLat = parseFloat(req.query.lat);
    const rawLng = parseFloat(req.query.lng);
    const accuracy = req.query.accuracy !== undefined ? parseFloat(req.query.accuracy) : 0;

    // Validate coordinates
    if (isNaN(rawLat) || isNaN(rawLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates: latitude and longitude are required numbers.'
      });
    }

    if (rawLat < -90 || rawLat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90 degrees.'
      });
    }

    if (rawLng < -180 || rawLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180 degrees.'
      });
    }

    if (accuracy < 0) {
      return res.status(400).json({
        success: false,
        message: 'Accuracy cannot be negative.'
      });
    }

    const lat = Number(rawLat.toFixed(6));
    const lng = Number(rawLng.toFixed(6));

    const geoResult = await reverseGeocodeCoords(lat, lng);

    return res.json({
      success: true,
      latitude: lat,
      longitude: lng,
      accuracy: Number(accuracy.toFixed(1)),
      address: geoResult.address,
      city: geoResult.city,
      state: geoResult.state,
      country: geoResult.country
    });
  } catch (error) {
    console.error('Error in reverse geocoding endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Reverse geocoding service error'
    });
  }
};

// @desc    Update / persist user's latest detected location (works for auth and guest)
// @route   POST /api/location/update
const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy, address, city, state, country, timestamp } = req.body;

    const rawLat = parseFloat(latitude);
    const rawLng = parseFloat(longitude);

    if (isNaN(rawLat) || isNaN(rawLng) || rawLat < -90 || rawLat > 90 || rawLng < -180 || rawLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates required'
      });
    }

    const locationData = {
      latitude: Number(rawLat.toFixed(6)),
      longitude: Number(rawLng.toFixed(6)),
      accuracy: accuracy !== undefined ? Number(parseFloat(accuracy).toFixed(1)) : 0,
      address: address || '',
      city: city || '',
      state: state || '',
      country: country || '',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      updatedAt: new Date()
    };

    // If authenticated user is present
    if (req.user && req.user._id && (await isDbConnected())) {
      const userId = req.user._id;

      await User.findByIdAndUpdate(userId, {
        currentLocation: locationData
      });

      await UserLocation.findOneAndUpdate(
        { userId },
        {
          ...locationData,
          userId
        },
        { upsert: true, new: true }
      );
    }

    return res.json({
      success: true,
      message: 'Current location recorded successfully',
      location: locationData
    });
  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
};

module.exports = {
  getReverseGeocode,
  updateUserLocation
};
