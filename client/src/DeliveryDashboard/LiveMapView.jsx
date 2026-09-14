import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  subscribeToConnectionStatus, 
  subscribeToDeliveryLifecycle, 
  sendDriverLocationUpdate,
  joinDriverRoom 
} from '../services/socket';

export default function LiveMapView({ currentUser, onNavigateTab }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  // Active Delivery & Telemetry State
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [deliveryError, setDeliveryError] = useState(null);

  // GPS State
  const [driverGps, setDriverGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('LOCATING'); // 'LOCATING' | 'READY' | 'DENIED' | 'ERROR'
  const [gpsErrorMessage, setGpsErrorMessage] = useState('');
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null);

  // Map & Route State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTypeError, setMapTypeError] = useState(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'hybrid' | 'terrain'
  const [realDistance, setRealDistance] = useState(null);
  const [realEta, setRealEta] = useState(null);
  const [routeStatus, setRouteStatus] = useState('INIT'); // 'INIT' | 'CALCULATING' | 'SUCCESS' | 'ERROR'
  const [isConnected, setIsConnected] = useState(true);

  // Auth Session
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const token = typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '') : '';

  const email = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const phone = currentUser?.phone || savedUser?.phone || '';

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyValid = Boolean(
    apiKey &&
    apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' &&
    !apiKey.includes('YOUR_GOOGLE')
  );

  // 1. Fetch Current Active Delivery from MongoDB
  const fetchActiveDelivery = useCallback(async () => {
    setLoadingDelivery(true);
    setDeliveryError(null);
    try {
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/delivery/active-delivery?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}`, {
        headers
      });
      const json = await res.json();

      if (json.success) {
        setActiveDelivery(json.activeDelivery || null);
      } else {
        throw new Error(json.message || 'Failed to fetch active delivery');
      }
    } catch (err) {
      console.error('Error fetching active delivery:', err);
      setDeliveryError(err.message || 'Unable to load active delivery data');
    } finally {
      setLoadingDelivery(false);
    }
  }, [email, driverId, phone, token]);

  useEffect(() => {
    fetchActiveDelivery();
  }, [fetchActiveDelivery]);

  // Join Socket.IO driver room & subscribe to events
  useEffect(() => {
    if (driverId) joinDriverRoom(driverId);

    const unsubConn = subscribeToConnectionStatus((status) => setIsConnected(status));
    const unsubLifecycle = subscribeToDeliveryLifecycle({
      onAssigned: () => fetchActiveDelivery(),
      onStatusUpdate: () => fetchActiveDelivery(),
      onCompleted: () => fetchActiveDelivery()
    });

    return () => {
      if (unsubConn) unsubConn();
      if (unsubLifecycle) unsubLifecycle();
    };
  }, [driverId, fetchActiveDelivery]);

  // 2. Real Geolocation Watcher (navigator.geolocation)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      setGpsErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('LOCATING');

    const handleSuccess = (position) => {
      const { latitude, longitude, speed, heading, accuracy } = position.coords;
      const newPos = {
        lat: latitude,
        lng: longitude,
        speed: speed ? Math.round(speed * 3.6) : 0, // m/s to km/h
        heading: heading || 0,
        accuracy: accuracy ? Math.round(accuracy) : 0
      };

      setDriverGps(newPos);
      setGpsStatus('READY');
      setLastGpsUpdate(new Date());

      // Broadcast position to backend via socket and HTTP
      sendDriverLocationUpdate({
        driverId,
        location: { lat: latitude, lng: longitude }
      });

      if (token) {
        fetch('http://localhost:5000/api/delivery/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
            driverId
          })
        }).catch(err => console.error('Error posting GPS location:', err));
      }
    };

    const handleError = (error) => {
      console.warn('GPS position error:', error);
      if (error.code === error.PERMISSION_DENIED) {
        setGpsStatus('DENIED');
        setGpsErrorMessage('Location permission denied. Please allow location access in your browser settings.');
      } else {
        setGpsStatus('ERROR');
        setGpsErrorMessage(error.message || 'Unable to retrieve your current location.');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 3000
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [driverId, token]);

  // 3. Load Google Maps JS API Script
  useEffect(() => {
    if (!isKeyValid) {
      setMapTypeError('Google Maps API Key is not configured in VITE_GOOGLE_MAPS_API_KEY.');
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (document.getElementById(scriptId)) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapTypeError('Failed to load Google Maps JavaScript SDK.');
    document.head.appendChild(script);
  }, [apiKey, isKeyValid]);

  // 4. Extract destination & positions
  const isPickedUp = useMemo(() => {
    const status = activeDelivery?.status || '';
    return ['Picked Up', 'Out for Delivery', 'Delivered', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_CUSTOMER'].includes(status);
  }, [activeDelivery]);

  const pickupPos = useMemo(() => {
    const pLat = Number(activeDelivery?.pickupAddress?.lat);
    const pLng = Number(activeDelivery?.pickupAddress?.lng);
    return {
      lat: !isNaN(pLat) && pLat !== 0 ? pLat : 23.0300,
      lng: !isNaN(pLng) && pLng !== 0 ? pLng : 72.5650,
      name: activeDelivery?.providerName || 'Pickup Kitchen',
      street: activeDelivery?.pickupAddress?.street || 'Kitchen location'
    };
  }, [activeDelivery]);

  const dropPos = useMemo(() => {
    const dLat = Number(activeDelivery?.deliveryAddress?.lat);
    const dLng = Number(activeDelivery?.deliveryAddress?.lng);
    return {
      lat: !isNaN(dLat) && dLat !== 0 ? dLat : 23.0120,
      lng: !isNaN(dLng) && dLng !== 0 ? dLng : 72.5600,
      name: activeDelivery?.customerName || 'Customer Destination',
      street: typeof activeDelivery?.deliveryAddress === 'string' ? activeDelivery.deliveryAddress : (activeDelivery?.deliveryAddress?.street || 'Customer location')
    };
  }, [activeDelivery]);

  const targetDestination = isPickedUp ? dropPos : pickupPos;

  // 5. Initialize Google Map & Calculate Real Directions Route
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google || !window.google.maps) return;

    const centerLat = driverGps?.lat || pickupPos.lat;
    const centerLng = driverGps?.lng || pickupPos.lng;

    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 14,
        mapTypeId: mapType,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true
      });
      mapInstanceRef.current = map;

      const renderer = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#1a1a1a',
          strokeOpacity: 0.9,
          strokeWeight: 5
        }
      });
      directionsRendererRef.current = renderer;
    } else {
      mapInstanceRef.current.setMapTypeId(mapType);
    }

    const map = mapInstanceRef.current;

    // Update Driver Marker
    if (driverGps) {
      const driverLatLng = new window.google.maps.LatLng(driverGps.lat, driverGps.lng);
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new window.google.maps.Marker({
          position: driverLatLng,
          map,
          title: 'Your Current GPS Location',
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#1a1a1a',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: driverGps.heading || 0
          }
        });
      } else {
        driverMarkerRef.current.setPosition(driverLatLng);
      }
    }

    // Calculate Real Road Directions if active delivery exists
    if (activeDelivery && (driverGps || pickupPos)) {
      setRouteStatus('CALCULATING');
      const origin = driverGps ? { lat: driverGps.lat, lng: driverGps.lng } : { lat: pickupPos.lat, lng: pickupPos.lng };
      const destination = { lat: targetDestination.lat, lng: targetDestination.lng };

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
            setRouteStatus('SUCCESS');

            const leg = result.routes[0]?.legs[0];
            if (leg) {
              if (leg.distance?.text) setRealDistance(leg.distance.text);
              if (leg.duration?.text) setRealEta(leg.duration.text);
            }
          } else {
            console.warn('Directions route calculation status:', status);
            setRouteStatus('ERROR');
          }
        }
      );
    }
  }, [mapLoaded, mapType, driverGps, activeDelivery, pickupPos, targetDestination]);

  // Handle Map Re-center on Driver GPS
  const handleRecenterGps = () => {
    if (mapInstanceRef.current && driverGps) {
      mapInstanceRef.current.setCenter({ lat: driverGps.lat, lng: driverGps.lng });
      mapInstanceRef.current.setZoom(16);
    }
  };

  return (
    <div className="flex flex-col w-full selection:bg-onyx-black selection:text-white">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 gap-4 border-b border-sand-neutral">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-xs uppercase tracking-widest text-secondary">Navigation / Live Map</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-caps text-[11px] ${
              isConnected ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600 animate-ping'}`} />
              <span>{isConnected ? 'LIVE (Socket.IO Synced)' : 'RECONNECTING...'}</span>
            </div>
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-onyx-black tracking-tight font-serif">Live Map</h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl">
            Track your active delivery route, turn-by-turn navigation coordinates, and real-time GPS telemetry.
          </p>
        </div>

        {/* Quick Map Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleRecenterGps}
            disabled={!driverGps}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-lowest text-onyx-black font-button-text text-xs font-semibold hover:bg-surface-container-high border border-sand-neutral transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">my_location</span>
            <span>Re-center GPS</span>
          </button>
          <button
            type="button"
            onClick={fetchActiveDelivery}
            className="inline-flex items-center justify-center w-9 h-9 bg-surface-container-lowest text-onyx-black hover:bg-surface-container-high border border-sand-neutral transition-colors shadow-xs cursor-pointer"
            title="Refresh Route Telemetry"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* GPS Warning Banner if Permission Denied or Error */}
      {gpsStatus === 'DENIED' && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-4 my-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-700">location_off</span>
            <span>{gpsErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-amber-900 text-amber-50 font-bold uppercase tracking-wider text-[10px]"
          >
            Enable Location
          </button>
        </div>
      )}

      {/* 2. Interactive Google Map Container */}
      <div className="relative w-full h-[500px] bg-surface-container border border-sand-neutral overflow-hidden shadow-md my-6">
        {/* Map Viewport Node */}
        <div ref={mapRef} className="w-full h-full" />

        {!isKeyValid ? (
          <div className="absolute inset-0 bg-surface-container-low flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
            <span className="material-symbols-outlined text-[48px] text-amber-600">map</span>
            <h3 className="font-headline-md text-xl text-onyx-black font-serif">Google Maps Key Missing</h3>
            <p className="font-body-md text-sm text-on-surface-variant max-w-md">
              Please set your Google Maps API key in <code className="bg-sand-neutral px-1.5 py-0.5 font-mono">VITE_GOOGLE_MAPS_API_KEY</code> environment file to render real interactive Google Maps.
            </p>
          </div>
        ) : !mapLoaded ? (
          <div className="absolute inset-0 bg-surface-container-low flex flex-col items-center justify-center space-y-3 z-10">
            <span className="material-symbols-outlined text-[36px] animate-spin text-onyx-black">progress_activity</span>
            <p className="font-body-md text-sm text-secondary">Initializing Google Maps SDK...</p>
          </div>
        ) : null}

        {/* Map Type Controls (Top Right) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          <div className="bg-surface-container-lowest border border-sand-neutral p-1 shadow-md flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-3 py-1 font-button-text font-semibold transition-colors cursor-pointer ${
                mapType === 'roadmap' ? 'bg-onyx-black text-on-primary' : 'text-secondary hover:text-onyx-black'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMapType('hybrid')}
              className={`px-3 py-1 font-button-text font-semibold transition-colors cursor-pointer ${
                mapType === 'hybrid' ? 'bg-onyx-black text-on-primary' : 'text-secondary hover:text-onyx-black'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapType('terrain')}
              className={`px-3 py-1 font-button-text font-semibold transition-colors cursor-pointer ${
                mapType === 'terrain' ? 'bg-onyx-black text-on-primary' : 'text-secondary hover:text-onyx-black'
              }`}
            >
              Terrain
            </button>
          </div>
        </div>

        {/* Telemetry HUD Widget (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-onyx-black text-on-primary px-4 py-3 shadow-2xl flex items-center gap-5 border border-stone-800">
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-2xl font-serif text-on-primary">{driverGps?.speed || 0}</span>
              <span className="font-label-caps text-[10px] text-sand-neutral tracking-wider">KM/H</span>
            </div>
            <div className="w-px h-7 bg-stone-700" />
            <div className="flex flex-col text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">near_me</span>
                <span className="font-label-caps text-[11px] uppercase tracking-wider font-semibold">GPS Active</span>
              </div>
              <span className="font-label-caps text-[10px] text-stone-400">
                {lastGpsUpdate ? `Updated ${Math.round((Date.now() - lastGpsUpdate.getTime()) / 1000)}s ago` : 'Locating driver...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Telemetry Metrics Strip (4-Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Current Location */}
        <div className="bg-surface-container-lowest p-6 border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Current Location</span>
            <span className="material-symbols-outlined text-[20px] text-onyx-black">navigation</span>
          </div>
          <div>
            <div className="font-headline-md text-lg text-onyx-black font-serif truncate">
              {driverGps ? `${driverGps.lat.toFixed(4)}, ${driverGps.lng.toFixed(4)}` : 'Locating GPS...'}
            </div>
            <p className="font-body-md text-xs text-secondary mt-1">
              {gpsStatus === 'READY' ? `Accurately tracked (±${driverGps?.accuracy || 5}m)` : 'GPS telemetry searching...'}
            </p>
          </div>
        </div>

        {/* Card 2: Distance Remaining */}
        <div className="bg-surface-container-lowest p-6 border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Distance Remaining</span>
            <span className="material-symbols-outlined text-[20px] text-onyx-black">straighten</span>
          </div>
          <div>
            <div className="font-headline-md text-3xl text-onyx-black font-serif">
              {realDistance || (activeDelivery?.distanceKm ? `${activeDelivery.distanceKm} km` : '0.0 km')}
            </div>
            <p className="font-body-md text-xs text-secondary mt-1">
              {isPickedUp ? 'Distance to Customer' : 'Distance to Kitchen'}
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Time (ETA) */}
        <div className="bg-surface-container-lowest p-6 border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Estimated Time (ETA)</span>
            <span className="material-symbols-outlined text-[20px] text-onyx-black">schedule</span>
          </div>
          <div>
            <div className="font-headline-md text-3xl text-onyx-black font-serif">
              {realEta || (activeDelivery?.etaMinutes ? `${activeDelivery.etaMinutes} mins` : 'Est. pending')}
            </div>
            <p className="font-body-md text-xs text-secondary mt-1">
              Real road traffic duration
            </p>
          </div>
        </div>

        {/* Card 4: Delivery Status */}
        <div className="bg-surface-container-lowest p-6 border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Delivery Status</span>
            <span className="material-symbols-outlined text-[20px] text-onyx-black">local_shipping</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-900 font-label-caps text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{activeDelivery ? (activeDelivery.status || 'ACTIVE') : 'NO ACTIVE DELIVERY'}</span>
            </div>
            <p className="font-body-md text-xs text-secondary mt-1">
              {activeDelivery ? `Order #${activeDelivery.orderId || activeDelivery.requestId}` : 'Available for new requests'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Bottom Operational Split: Active Delivery Dossier vs Turn-by-Turn Route Manifest */}
      {loadingDelivery ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <span className="material-symbols-outlined text-[36px] animate-spin text-onyx-black">progress_activity</span>
          <p className="font-body-md text-sm text-secondary">Loading active delivery manifest...</p>
        </div>
      ) : !activeDelivery ? (
        <div className="p-12 bg-surface-container-lowest border border-sand-neutral text-center space-y-4 my-4">
          <span className="material-symbols-outlined text-[48px] text-secondary">local_shipping</span>
          <div>
            <h3 className="font-headline-md text-xl text-onyx-black font-serif">No Active Delivery</h3>
            <p className="font-body-md text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
              You currently don't have an active delivery to track on Live Map.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('delivery-requests')}
            className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider font-bold hover:bg-stone-800 transition-colors inline-block cursor-pointer"
          >
            View Delivery Requests
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
          
          {/* Active Delivery Manifest (5 Cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest p-6 sm:p-8 border border-sand-neutral flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-sand-neutral pb-4">
                <div>
                  <span className="font-label-caps text-xs uppercase tracking-widest text-secondary block">ACTIVE DELIVERY</span>
                  <h2 className="font-headline-md text-2xl text-onyx-black font-serif mt-1">{activeDelivery.orderId || activeDelivery.requestId}</h2>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-label-caps text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {activeDelivery.pickupOtpVerified ? 'OTP Verified' : 'In Transit'}
                </span>
              </div>

              {/* Route Waypoints */}
              <div className="bg-surface-container-low p-4 border border-sand-neutral space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">storefront</span>
                  <div>
                    <span className="font-label-caps text-[10px] text-secondary uppercase block">Pickup Kitchen</span>
                    <span className="font-button-text text-sm text-onyx-black font-semibold">{activeDelivery.providerName || 'Tiffin Kitchen'}</span>
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{pickupPos.street}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-sand-neutral" />

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-onyx-black mt-0.5">home_pin</span>
                  <div>
                    <span className="font-label-caps text-[10px] text-secondary uppercase block">Customer Drop-off</span>
                    <span className="font-button-text text-sm text-onyx-black font-semibold">{activeDelivery.customerName || 'Customer'}</span>
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{dropPos.street}</p>
                  </div>
                </div>
              </div>

              {/* Meal Payload */}
              <div className="space-y-2 text-xs">
                <span className="font-label-caps text-xs uppercase tracking-wider text-secondary block">Consignment Details</span>
                <div className="p-3.5 bg-surface-container border border-sand-neutral flex items-center justify-between">
                  <div>
                    <div className="font-button-text text-sm font-semibold text-onyx-black">{activeDelivery.tiffinName || 'Gujarati Thali Special'}</div>
                    <div className="font-body-md text-xs text-on-surface-variant mt-0.5">Quantity: × {activeDelivery.itemCount || 1} Tiffin Box</div>
                  </div>
                  <span className="font-label-caps text-[11px] bg-surface-container-lowest border border-sand-neutral px-2 py-0.5 text-onyx-black font-bold">
                    ₹{activeDelivery.driverEarning || activeDelivery.payout || 93} Payout
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('active-delivery')}
                className="flex-1 py-3 px-4 bg-onyx-black text-on-primary font-button-text text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer text-center"
              >
                Open Delivery Details
              </button>
              {activeDelivery.customerPhone && (
                <a
                  href={`tel:${activeDelivery.customerPhone}`}
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-low border border-sand-neutral text-onyx-black font-button-text text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>

          {/* Turn-by-Turn Route Navigation Manifest (7 Cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-8 border border-sand-neutral flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-sand-neutral pb-4">
                <div>
                  <span className="font-label-caps text-xs uppercase tracking-widest text-secondary block">Live Directions</span>
                  <h2 className="font-headline-md text-2xl text-onyx-black font-serif mt-1">Turn-by-Turn Route Manifest</h2>
                </div>
                <span className="font-label-caps text-xs text-secondary uppercase font-semibold">
                  {isPickedUp ? 'Step 2 of 2 (Heading to Customer)' : 'Step 1 of 2 (Heading to Kitchen)'}
                </span>
              </div>

              {/* Waypoints Sequence */}
              <div className="space-y-4 text-xs">
                {/* Waypoint 1: Pickup Kitchen */}
                <div className={`flex items-start gap-4 p-4 border ${isPickedUp ? 'bg-surface-container-low border-sand-neutral opacity-75' : 'bg-onyx-black text-on-primary border-onyx-black'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPickedUp ? 'bg-sand-neutral text-onyx-black' : 'bg-on-primary text-onyx-black'}`}>
                    <span className="material-symbols-outlined text-[16px]">{isPickedUp ? 'check' : 'storefront'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-button-text text-xs font-bold ${isPickedUp ? 'text-secondary' : 'text-emerald-400 uppercase'}`}>
                        Waypoint 1: Pickup Kitchen
                      </span>
                      <span className="font-label-caps text-[11px]">{isPickedUp ? 'Picked Up ✓' : 'En Route'}</span>
                    </div>
                    <p className={`font-body-md text-xs mt-0.5 ${isPickedUp ? 'text-on-surface-variant' : 'text-on-primary-container'}`}>
                      {pickupPos.name} • {pickupPos.street}
                    </p>
                  </div>
                </div>

                {/* Waypoint 2: Destination Drop-off */}
                <div className={`flex items-start gap-4 p-4 border ${isPickedUp ? 'bg-onyx-black text-on-primary border-onyx-black' : 'bg-surface-container-low border-sand-neutral'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPickedUp ? 'bg-on-primary text-onyx-black' : 'bg-surface-container-high text-secondary'}`}>
                    <span className="material-symbols-outlined text-[16px]">flag</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-button-text text-xs font-bold ${isPickedUp ? 'text-emerald-400 uppercase' : 'text-onyx-black'}`}>
                        Waypoint 2: Destination Handover
                      </span>
                      <span className="font-label-caps text-[11px]">{realEta ? `ETA: ${realEta}` : 'Pending'}</span>
                    </div>
                    <p className={`font-body-md text-xs mt-0.5 ${isPickedUp ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                      {dropPos.name} • {dropPos.street}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps External Navigation Launcher */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(targetDestination.street + ', ' + targetDestination.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3.5 px-6 bg-onyx-black text-on-primary font-button-text text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
              >
                <span>Start Navigation in Google Maps</span>
                <span className="material-symbols-outlined text-[16px]">north_east</span>
              </a>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
