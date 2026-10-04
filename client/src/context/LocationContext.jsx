import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from '../services/api';

const LocationContext = createContext(null);

const STORAGE_KEY = 'tiffinlink_user_location';

export function LocationProvider({ children }) {
  const { currentUser } = useAuth();

  // Primary Location State (Section 19)
  const [location, setLocation] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          return {
            ...parsed,
            isCalibrated: true
          };
        }
      }
    } catch (e) {}

    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      address: '',
      city: '',
      state: '',
      country: '',
      timestamp: null,
      isCalibrated: false
    };
  });

  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [recalibrateToast, setRecalibrateToast] = useState('');
  const [locationError, setLocationError] = useState('');
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg, duration = 4500) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setRecalibrateToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setRecalibrateToast('');
    }, duration);
  }, []);

  /**
   * RECALIBRATE: Single-source, high-accuracy GPS capture with real reverse geocoding
   */
  const recalibrate = useCallback(async () => {
    // 1. Debounce guard: prevent concurrent rapid clicks
    if (isRecalibrating) {
      return null;
    }

    setIsRecalibrating(true);
    setLocationError('');
    showToast('LOCATING... Requesting current device GPS coordinates...', 15000);

    // 2. Insecure context validation
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext === false &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setIsRecalibrating(false);
      const errMsg = 'Geolocation requires a secure HTTPS connection or localhost context.';
      setLocationError(errMsg);
      showToast(errMsg, 6000);
      return null;
    }

    // 3. Browser support validation
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsRecalibrating(false);
      const errMsg = 'Your browser does not support location detection.';
      setLocationError(errMsg);
      showToast(errMsg, 6000);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const rawLat = position.coords.latitude;
            const rawLng = position.coords.longitude;
            const accuracy = position.coords.accuracy || 0;
            const timestamp = position.timestamp || Date.now();

            // 4. Validate coordinates
            if (
              typeof rawLat !== 'number' ||
              typeof rawLng !== 'number' ||
              isNaN(rawLat) ||
              isNaN(rawLng) ||
              rawLat < -90 ||
              rawLat > 90 ||
              rawLng < -180 ||
              rawLng > 180
            ) {
              setIsRecalibrating(false);
              const errMsg = 'Invalid GPS coordinates detected from device.';
              setLocationError(errMsg);
              showToast(errMsg, 5000);
              return resolve(null);
            }

            const latitude = Number(rawLat.toFixed(6));
            const longitude = Number(rawLng.toFixed(6));

            // 5. Call backend reverse geocoding
            let detectedAddress = '';
            let detectedCity = '';
            let detectedState = '';
            let detectedCountry = '';

            try {
              const res = await apiRequest(`/location/reverse-geocode?lat=${latitude}&lng=${longitude}&accuracy=${accuracy}`);
              const json = typeof res?.json === 'function' ? await res.json() : res;

              if (json && json.success) {
                detectedAddress = json.address || '';
                detectedCity = json.city || '';
                detectedState = json.state || '';
                detectedCountry = json.country || '';
              }
            } catch (apiErr) {
              console.warn('Reverse geocoding network error:', apiErr);
            }

            // Resilient fallback: keep real GPS coordinates if reverse geocoding fails
            if (!detectedAddress) {
              detectedAddress = `Current GPS Location (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)`;
            }

            const updatedLocation = {
              latitude,
              longitude,
              accuracy: Number(accuracy.toFixed(1)),
              address: detectedAddress,
              city: detectedCity,
              state: detectedState,
              country: detectedCountry,
              timestamp,
              isCalibrated: true
            };

            // 6. Persist location
            setLocation(updatedLocation);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocation));
            } catch (e) {}

            // If user is logged in, synchronize with MongoDB user profile
            if (currentUser) {
              apiRequest('/location/update', {
                method: 'POST',
                body: JSON.stringify(updatedLocation)
              }).catch(() => {});
            }

            // 7. Accuracy user feedback (Section 6)
            let accuracyMsg = '';
            if (accuracy <= 25) {
              accuracyMsg = `✓ Calibrated to ${detectedAddress} (Accuracy: ±${Math.round(accuracy)}m - Excellent)`;
            } else if (accuracy <= 75) {
              accuracyMsg = `✓ Calibrated to ${detectedAddress} (Accuracy: ±${Math.round(accuracy)}m - Good)`;
            } else if (accuracy <= 150) {
              accuracyMsg = `⚠️ Calibrated to ${detectedAddress} (Warning: Low accuracy ±${Math.round(accuracy)}m)`;
            } else {
              accuracyMsg = `⚠️ Location accuracy is low (±${Math.round(accuracy)}m). Please enable precise location or move to an open area.`;
            }

            showToast(accuracyMsg, 5500);
            setIsRecalibrating(false);
            resolve(updatedLocation);
          } catch (innerErr) {
            console.error('Error handling GPS position:', innerErr);
            setIsRecalibrating(false);
            showToast('Error processing GPS coordinates.', 4500);
            resolve(null);
          }
        },
        (error) => {
          setIsRecalibrating(false);
          let userMsg = 'Unable to detect your current location.';

          // Comprehensive error handling (Section 7)
          switch (error.code) {
            case error.PERMISSION_DENIED:
              userMsg = 'Location permission is required to detect your current location.';
              break;
            case error.POSITION_UNAVAILABLE:
              userMsg = 'Unable to detect your current location. Please enable GPS/location services.';
              break;
            case error.TIMEOUT:
              userMsg = 'Location request timed out. Please try again.';
              break;
            default:
              userMsg = 'Unable to determine your current location. Please check your device location settings.';
              break;
          }

          setLocationError(userMsg);
          showToast(userMsg, 5000);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0 // MUST NOT use stale cached location for RECALIBRATE
        }
      );
    });
  }, [isRecalibrating, currentUser, showToast]);

  /**
   * Set custom location address (e.g. user manually types in address field)
   */
  const setCustomLocation = useCallback((customData) => {
    setLocation(prev => {
      const next = {
        ...prev,
        ...customData,
        isCalibrated: customData.latitude && customData.longitude ? true : prev.isCalibrated
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isRecalibrating,
        recalibrateToast,
        locationError,
        recalibrate,
        setCustomLocation,
        showToast
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
