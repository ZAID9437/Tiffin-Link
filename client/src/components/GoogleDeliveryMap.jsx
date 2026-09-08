import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Navigation, MapPin, ExternalLink, Clock, ShieldCheck, RefreshCw, AlertTriangle, Radio, Compass, Target } from 'lucide-react';
import { joinDeliveryRoom, leaveDeliveryRoom, subscribeToLocationUpdates, subscribeToConnectionStatus } from '../services/socket';

// Utility helper to calculate Haversine distance in meters between two lat/lng pairs
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function GoogleDeliveryMap({ delivery, height = '24rem', activeRole = 'provider' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef({});
  
  // Real-time dynamic state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [mapLayer, setMapLayer] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [isConnected, setIsConnected] = useState(true);

  // Live Location state (updated via Socket.IO or props)
  const [liveDriverLoc, setLiveDriverLoc] = useState(null);
  const [realDistance, setRealDistance] = useState(null);
  const [realEta, setRealEta] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeMode, setRouteMode] = useState('road'); // 'road' | 'live'

  // Route Throttling state
  const lastRouteCalcPosRef = useRef(null);
  const lastRouteCalcTimeRef = useRef(0);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = Boolean(
    apiKey &&
    apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' &&
    !apiKey.includes('YOUR_GOOGLE')
  );

  const deliveryId = delivery?.requestId || delivery?.orderId || delivery?._id;

  // Extract raw coordinates safely with solid fallback defaults
  const kitchenPos = useMemo(() => {
    const kLat = Number(delivery?.pickupAddress?.lat);
    const kLng = Number(delivery?.pickupAddress?.lng);
    return {
      lat: !isNaN(kLat) && kLat !== 0 ? kLat : 23.0300,
      lng: !isNaN(kLng) && kLng !== 0 ? kLng : 72.5650,
      address: delivery?.pickupAddress?.street || 'Kitchen Address',
      name: delivery?.providerName || 'Provider Kitchen'
    };
  }, [delivery]);

  const customerPos = useMemo(() => {
    const cLat = Number(delivery?.deliveryAddress?.lat);
    const cLng = Number(delivery?.deliveryAddress?.lng);
    return {
      lat: !isNaN(cLat) && cLat !== 0 ? cLat : 23.0120,
      lng: !isNaN(cLng) && cLng !== 0 ? cLng : 72.5600,
      address: typeof delivery?.deliveryAddress === 'string' ? delivery.deliveryAddress : (delivery?.deliveryAddress?.street || 'Customer Address'),
      name: delivery?.customerName || 'Customer'
    };
  }, [delivery]);

  const initialDriverPos = useMemo(() => {
    const dLat = Number(delivery?.assignedDriver?.location?.lat || delivery?.driverLocation?.lat);
    const dLng = Number(delivery?.assignedDriver?.location?.lng || delivery?.driverLocation?.lng);
    return {
      lat: !isNaN(dLat) && dLat !== 0 ? dLat : 23.0225,
      lng: !isNaN(dLng) && dLng !== 0 ? dLng : 72.5714,
      name: delivery?.assignedDriver?.name || delivery?.deliveryPartnerName || 'Delivery Partner',
      phone: delivery?.assignedDriver?.phone || delivery?.deliveryPartnerPhone || ''
    };
  }, [delivery]);

  const isPickedUp = ['Picked Up', 'Out for Delivery', 'Delivered', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(delivery?.status || '');
  const targetDestination = isPickedUp ? customerPos : kitchenPos;

  // 1. Socket.IO Connection & Live Location Room Subscription
  useEffect(() => {
    if (!deliveryId) return;

    joinDeliveryRoom(deliveryId);

    const unsubscribeLocation = subscribeToLocationUpdates((data) => {
      if (data && (data.deliveryId === deliveryId || String(data.deliveryId) === String(deliveryId))) {
        if (data.location && typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
          setLiveDriverLoc({
            lat: data.location.lat,
            lng: data.location.lng,
            accuracy: data.location.accuracy || 0,
            updatedAt: data.location.updatedAt || new Date()
          });
        }
      }
    });

    const unsubscribeStatus = subscribeToConnectionStatus(
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    return () => {
      leaveDeliveryRoom(deliveryId);
      unsubscribeLocation();
      unsubscribeStatus();
    };
  }, [deliveryId]);

  // Sync initial driver location if prop changes and no live updates yet
  useEffect(() => {
    if (initialDriverPos.lat && initialDriverPos.lng && !liveDriverLoc) {
      setLiveDriverLoc({ lat: initialDriverPos.lat, lng: initialDriverPos.lng });
    }
  }, [initialDriverPos, liveDriverLoc]);

  // Current active driver coordinates
  const currentDriverCoords = useMemo(() => {
    if (liveDriverLoc && typeof liveDriverLoc.lat === 'number' && typeof liveDriverLoc.lng === 'number') {
      return liveDriverLoc;
    }
    if (initialDriverPos.lat && initialDriverPos.lng) {
      return initialDriverPos;
    }
    return { lat: 23.0225, lng: 72.5714 };
  }, [liveDriverLoc, initialDriverPos]);

  // 2. Load Official Google Maps JavaScript API SDK & Handle Auth Failures
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('Google Maps JS SDK Auth Failure callback triggered.');
      setMapLoadError('Google Maps API Authentication Failed: The API key configured in client/.env (VITE_GOOGLE_MAPS_API_KEY) is invalid, restricted, or Billing/Maps JavaScript API is not enabled in your Google Cloud Console.');
    };

    if (!isKeyConfigured) {
      setMapLoadError('Google Maps API key missing in client/.env (VITE_GOOGLE_MAPS_API_KEY).');
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (document.getElementById(scriptId)) {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,routes`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => {
      setMapLoaded(false);
      setMapLoadError('Failed to load Google Maps JavaScript API SDK.');
    };
    document.head.appendChild(script);
  }, [apiKey, isKeyConfigured]);



  // 3. Initialize Official Google Map Instance (Cached in useRef to avoid re-creation)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google?.maps) return;

    const google = window.google;

    try {
      if (!mapInstanceRef.current) {
        const centerLat = currentDriverCoords?.lat || kitchenPos.lat || 23.0225;
        const centerLng = currentDriverCoords?.lng || kitchenPos.lng || 72.5714;

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 14,
          mapTypeId: mapLayer === 'satellite' ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true, // Custom HTML SVG markers used instead
          polylineOptions: {
            strokeColor: '#0A8B5F',
            strokeOpacity: 0.95,
            strokeWeight: 6
          }
        });
      } else {
        mapInstanceRef.current.setMapTypeId(
          mapLayer === 'satellite' ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP
        );
      }
    } catch (err) {
      console.error('Google Maps init error:', err);
      setMapLoadError('Error initializing Google Map.');
    }
  }, [mapLoaded, mapLayer, kitchenPos, currentDriverCoords]);

  // 4. Update Custom Markers (Kitchen, Customer, Live Driver) & Fit Bounds
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    const google = window.google;
    const map = mapInstanceRef.current;

    // Kitchen Marker (Green)
    if (kitchenPos.lat && kitchenPos.lng) {
      if (!markersRef.current.kitchen) {
        markersRef.current.kitchen = new google.maps.Marker({
          position: { lat: kitchenPos.lat, lng: kitchenPos.lng },
          map,
          title: `🍱 Kitchen: ${kitchenPos.name}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });
      } else {
        markersRef.current.kitchen.setPosition({ lat: kitchenPos.lat, lng: kitchenPos.lng });
      }
    }

    // Customer Marker (Red)
    if (customerPos.lat && customerPos.lng) {
      if (!markersRef.current.customer) {
        markersRef.current.customer = new google.maps.Marker({
          position: { lat: customerPos.lat, lng: customerPos.lng },
          map,
          title: `📍 Customer: ${customerPos.name}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });
      } else {
        markersRef.current.customer.setPosition({ lat: customerPos.lat, lng: customerPos.lng });
      }
    }

    // Driver Marker (Blue - Moves smoothly on live GPS update)
    if (currentDriverCoords && currentDriverCoords.lat && currentDriverCoords.lng) {
      const driverLatLng = { lat: currentDriverCoords.lat, lng: currentDriverCoords.lng };

      if (!markersRef.current.driver) {
        markersRef.current.driver = new google.maps.Marker({
          position: driverLatLng,
          map,
          title: `🛵 Driver: ${initialDriverPos.name}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(44, 44)
          }
        });
      } else {
        markersRef.current.driver.setPosition(driverLatLng);
      }
    }

    // Fit map bounds to show all active pins
    const bounds = new google.maps.LatLngBounds();
    let count = 0;
    if (kitchenPos.lat && kitchenPos.lng) { bounds.extend(kitchenPos); count++; }
    if (customerPos.lat && customerPos.lng) { bounds.extend(customerPos); count++; }
    if (currentDriverCoords?.lat && currentDriverCoords?.lng) { bounds.extend(currentDriverCoords); count++; }

    if (count > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [mapLoaded, kitchenPos, customerPos, currentDriverCoords, initialDriverPos, targetDestination]);

  // 5. Throttled Google Directions Service Route Calculation with Automatic Fallback
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps || !directionsRendererRef.current) return;
    if (!currentDriverCoords || !targetDestination?.lat || !targetDestination?.lng) return;

    const driverLat = currentDriverCoords.lat;
    const driverLng = currentDriverCoords.lng;
    const destLat = targetDestination.lat;
    const destLng = targetDestination.lng;

    const now = Date.now();
    const lastTime = lastRouteCalcTimeRef.current;
    const lastPos = lastRouteCalcPosRef.current;

    let distanceMovedMeters = 9999;
    if (lastPos) {
      distanceMovedMeters = getDistanceInMeters(lastPos.lat, lastPos.lng, driverLat, driverLng);
    }

    // Recalculate route only if >50m moved or >30 sec passed (or initial run)
    const shouldRecalculate = !lastPos || distanceMovedMeters > 50 || (now - lastTime > 30000);

    if (!shouldRecalculate) return;

    lastRouteCalcTimeRef.current = now;
    lastRouteCalcPosRef.current = { lat: driverLat, lng: driverLng };

    setIsCalculatingRoute(true);

    const google = window.google;
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: { lat: driverLat, lng: driverLng },
        destination: { lat: destLat, lng: destLng },
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        setIsCalculatingRoute(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current.setDirections(result);
          setRouteError(null);
          setRouteMode('road');

          const routeLeg = result.routes[0]?.legs[0];
          if (routeLeg) {
            setRealDistance(routeLeg.distance?.text || null);
            setRealEta(routeLeg.duration?.text || null);
          }
        } else {
          console.warn('Google Directions API status:', status);
          setRouteError(`Road navigation API status: ${status}. Ensure Directions API is activated in Google Cloud Console.`);
          setRouteMode('error');

          // Clear renderer if API route fails — NEVER fallback to straight line
          directionsRendererRef.current.setDirections({ routes: [] });

          // Calculate direct distance & ETA fallback
          const distMeters = getDistanceInMeters(driverLat, driverLng, destLat, destLng);
          const distKm = (distMeters / 1000).toFixed(1);
          const estMins = Math.max(2, Math.round((distMeters / 1000) / 25 * 60)); // Avg 25 km/h city speed

          setRealDistance(`${distKm} km`);
          setRealEta(`${estMins} mins`);
        }
      }
    );
  }, [mapLoaded, currentDriverCoords, targetDestination, kitchenPos]);

  // Recenter / Re-fit view handler
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const google = window.google;
    const bounds = new google.maps.LatLngBounds();
    if (kitchenPos.lat && kitchenPos.lng) bounds.extend(kitchenPos);
    if (customerPos.lat && customerPos.lng) bounds.extend(customerPos);
    if (currentDriverCoords?.lat && currentDriverCoords?.lng) bounds.extend(currentDriverCoords);
    mapInstanceRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
  };

  // Open in Google Maps dynamic directions link
  const googleNavUrl = useMemo(() => {
    if (!currentDriverCoords || !targetDestination) return '#';
    const origin = `${currentDriverCoords.lat},${currentDriverCoords.lng}`;
    const destination = `${targetDestination.lat},${targetDestination.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }, [currentDriverCoords, targetDestination]);

  // Error UI for missing configuration or API authentication load failures
  if (!isKeyConfigured || mapLoadError) {
    return (
      <div 
        style={{ height }}
        className="w-full bg-[#FFF8F6] rounded-2xl border-2 border-amber-400 p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-xs"
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
          <AlertTriangle size={26} />
        </div>
        <div className="space-y-1.5 max-w-lg">
          <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
            Google Maps API Key Action Required
          </h3>
          <p className="text-xs text-amber-800 font-bold leading-relaxed">
            {mapLoadError || 'Google Maps API key is missing or rejected by Google Cloud.'}
          </p>
        </div>
        
        <div className="bg-white p-3 rounded-xl border border-amber-200 text-left text-[11px] font-semibold text-gray-700 space-y-1 max-w-md">
          <div className="font-extrabold text-amber-900">How to fix in Google Cloud Console:</div>
          <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
            <li>Enable <span className="font-bold text-black">Maps JavaScript API</span> & <span className="font-bold text-black">Directions API</span>.</li>
            <li>Ensure <span className="font-bold text-black">Billing</span> is attached to your Google Cloud Project.</li>
            <li>Paste your valid API Key into <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-700 font-bold">client/.env</code>:</li>
          </ol>
          <div className="text-[10px] font-mono bg-gray-900 text-emerald-400 p-2 rounded-lg mt-1 font-bold">
            VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FBF9] rounded-2xl border-2 border-[#0A8B5F]/40 p-4 space-y-3 relative overflow-hidden shadow-xs">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5ECE8] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#0A8B5F] uppercase tracking-wider">
            <Radio size={15} className={`text-[#0A8B5F] ${isConnected ? 'animate-pulse' : 'text-amber-500'}`} />
            <span>REAL GOOGLE MAPS LIVE NAVIGATION</span>
          </div>
          <div className="text-xs font-black text-[#111827] mt-0.5">
            Order #{delivery?.orderId || delivery?.requestId || '1026'} • {isPickedUp ? `En route to Customer (${customerPos.name})` : `En route to Kitchen (${kitchenPos.name})`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recenter Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="bg-white hover:bg-emerald-50 text-[#0A8B5F] px-2.5 py-1 rounded-xl border border-[#0A8B5F]/30 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Recenter Map View"
          >
            <Target size={13} />
            <span>Fit View</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="bg-white p-1 rounded-xl border border-[#E5ECE8] flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setMapLayer('roadmap')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                mapLayer === 'roadmap' ? 'bg-[#0A8B5F] text-white shadow-2xs' : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              🗺️ Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                mapLayer === 'satellite' ? 'bg-[#0A8B5F] text-white shadow-2xs' : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              🛰️ Satellite
            </button>
          </div>

          {currentDriverCoords && (
            <a
              href={googleNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0A8B5F] hover:bg-[#08734e] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink size={13} />
              <span>OPEN IN GOOGLE MAPS</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Interactive Google Map View Container */}
      <div 
        style={{ height }} 
        className="w-full bg-[#E5ECE8] rounded-xl border-2 border-[#0A8B5F]/30 relative overflow-hidden shadow-inner flex flex-col justify-between"
      >
        <div ref={mapRef} className="w-full h-full z-0" />

        {!mapLoaded && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="text-center space-y-2">
              <RefreshCw size={24} className="animate-spin mx-auto text-[#0A8B5F]" />
              <p className="text-xs font-black text-[#111827]">Loading Google Maps Navigation...</p>
            </div>
          </div>
        )}

        {isCalculatingRoute && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#E5ECE8] text-[10px] font-black text-[#0A8B5F] flex items-center gap-1.5 shadow-md z-10">
            <RefreshCw size={12} className="animate-spin text-[#0A8B5F]" />
            <span>Calculating navigation route...</span>
          </div>
        )}

        {/* Live Route Mode Indicator Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#E5ECE8] text-[10px] font-extrabold text-[#111827] flex items-center gap-2 shadow-md z-10">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0A8B5F] animate-ping" />
          <span className="text-[#0A8B5F] font-black uppercase">Navigation Route:</span>
          <span>{routeMode === 'road' ? 'Road Network Route' : 'Live Tracking Line'}</span>
        </div>
      </div>

      {/* Navigation Line Legend & Live Status Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-[#E5ECE8] flex flex-wrap items-center justify-between gap-3 text-[11px] font-extrabold text-[#374151] shadow-2xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700 shadow-2xs" />
            <span>Kitchen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700 shadow-2xs" />
            <span>Driver (Live)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-700 shadow-2xs" />
            <span>Customer</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
            <span className="w-6 h-1.5 rounded bg-[#0A8B5F] shadow-2xs inline-block" />
            <span className="text-[#0A8B5F]">Active Route Line</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* GPS Accuracy Warning */}
          {liveDriverLoc?.accuracy > 100 && (
            <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1">
              <AlertTriangle size={11} className="text-amber-600" />
              <span>GPS Accuracy Low ({Math.round(liveDriverLoc.accuracy)}m)</span>
            </span>
          )}

          {/* Last Updated Timestamp */}
          {liveDriverLoc?.updatedAt && (
            <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-lg text-[10px] font-bold">
              Updated: {Math.max(0, Math.floor((Date.now() - new Date(liveDriverLoc.updatedAt).getTime()) / 1000))}s ago
            </span>
          )}

          {realEta && (
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
              <Clock size={12} className="text-[#0A8B5F]" />
              <span>ETA: {realEta}</span>
            </span>
          )}

          {realDistance && (
            <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
              <Navigation size={12} className="text-blue-600" />
              <span>Distance: {realDistance}</span>
            </span>
          )}

          {/* Socket Connection Status */}
          {isConnected ? (
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 font-extrabold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>● LIVE</span>
            </span>
          ) : (
            <span className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 font-extrabold flex items-center gap-1.5 shadow-2xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>● RECONNECTING</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

