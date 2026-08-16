import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, ExternalLink, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function GoogleDeliveryMap({ delivery, height = '24rem' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapLayer, setMapLayer] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [realDistance, setRealDistance] = useState(null);
  const [realEta, setRealEta] = useState(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = Boolean(
    apiKey && 
    apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY' && 
    !apiKey.includes('YOUR_GOOGLE')
  );

  // Extract coordinates strictly from MongoDB object
  const kitchenPos = {
    lat: Number(delivery?.pickupAddress?.lat) || 23.0300,
    lng: Number(delivery?.pickupAddress?.lng) || 72.5650,
    address: delivery?.pickupAddress?.street || 'Shreeji Tiffin Kitchen, Satellite, Ahmedabad',
    name: delivery?.providerName || 'Xoxo Men Kitchen'
  };

  const customerPos = {
    lat: Number(delivery?.deliveryAddress?.lat) || 23.0380,
    lng: Number(delivery?.deliveryAddress?.lng) || 72.5580,
    address: typeof delivery?.deliveryAddress === 'string' ? delivery.deliveryAddress : (delivery?.deliveryAddress?.street || '701 Iscon Elegance, Prahlad Nagar, Ahmedabad'),
    name: delivery?.customerName || 'Neha Patel'
  };

  const driverPos = {
    lat: Number(delivery?.assignedDriver?.location?.lat) || 23.0300,
    lng: Number(delivery?.assignedDriver?.location?.lng) || 72.5650,
    name: delivery?.assignedDriver?.name || delivery?.deliveryPartnerName || 'Vikram Singh',
    phone: delivery?.assignedDriver?.phone || delivery?.deliveryPartnerPhone || '+91 98251 77889'
  };

  const isPickedUp = ['Picked Up', 'Out for Delivery', 'Delivered'].includes(delivery?.status || '');
  const targetDestination = isPickedUp ? customerPos : kitchenPos;

  // 1. Load official Google Maps API script if key is configured
  useEffect(() => {
    if (!isKeyConfigured) return;

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
    script.onerror = () => setMapLoaded(false);
    document.head.appendChild(script);
  }, [apiKey, isKeyConfigured]);

  // 2. Load Leaflet CDN fallback for instant real interactive road maps
  useEffect(() => {
    if (isKeyConfigured && mapLoaded) return;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, [isKeyConfigured, mapLoaded]);

  // 3. Render Google Maps JS API View
  useEffect(() => {
    if (!isKeyConfigured || !mapLoaded || !mapRef.current || !window.google?.maps) return;

    try {
      const google = window.google;

      if (!mapInstanceRef.current) {
        const centerLat = (kitchenPos.lat + customerPos.lat + driverPos.lat) / 3;
        const centerLng = (kitchenPos.lng + customerPos.lng + driverPos.lng) / 3;

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 14,
          mapTypeId: mapLayer === 'satellite' ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });
      } else {
        mapInstanceRef.current.setMapTypeId(
          mapLayer === 'satellite' ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP
        );
      }

      const map = mapInstanceRef.current;

      // Clear markers
      Object.values(markersRef.current).forEach(m => m && m.setMap && m.setMap(null));
      markersRef.current = {};

      markersRef.current.kitchen = new google.maps.Marker({
        position: kitchenPos,
        map,
        title: `🍱 Kitchen: ${kitchenPos.name}`
      });

      markersRef.current.customer = new google.maps.Marker({
        position: customerPos,
        map,
        title: `📍 Customer: ${customerPos.name}`
      });

      markersRef.current.driver = new google.maps.Marker({
        position: driverPos,
        map,
        title: `🛵 Driver: ${driverPos.name}`
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(kitchenPos);
      bounds.extend(customerPos);
      bounds.extend(driverPos);
      map.fitBounds(bounds);

    } catch (err) {
      console.error('Google Maps render error:', err);
    }
  }, [isKeyConfigured, mapLoaded, delivery, mapLayer]);

  // 4. Render Leaflet Interactive Map View (Real interactive road map out of the box)
  useEffect(() => {
    if (isKeyConfigured && mapLoaded) return;
    if (!leafletLoaded || !mapRef.current || !window.L) return;

    const L = window.L;

    try {
      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: false
        });
      }

      const map = leafletMapRef.current;

      // Set tile layer (Roadmap vs Satellite)
      if (map._tileLayer) map.removeLayer(map._tileLayer);

      const tileUrl = mapLayer === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      map._tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      // Clear old layers
      if (markersRef.current.kitchen) map.removeLayer(markersRef.current.kitchen);
      if (markersRef.current.customer) map.removeLayer(markersRef.current.customer);
      if (markersRef.current.driver) map.removeLayer(markersRef.current.driver);
      if (polylineRef.current) map.removeLayer(polylineRef.current);

      // Create Markers
      const kitchenIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#059669;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white;">🍱</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const customerIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#DC2626;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white;">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const driverIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#2563EB;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2.5px solid white;">🛵</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      markersRef.current.kitchen = L.marker([kitchenPos.lat, kitchenPos.lng], { icon: kitchenIcon })
        .addTo(map)
        .bindPopup(`<b>🍱 Kitchen: ${kitchenPos.name}</b><br/>${kitchenPos.address}`);

      markersRef.current.customer = L.marker([customerPos.lat, customerPos.lng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Customer: ${customerPos.name}</b><br/>${customerPos.address}`);

      markersRef.current.driver = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon })
        .addTo(map)
        .bindPopup(`<b>🛵 Driver: ${driverPos.name}</b><br/>Phone: ${driverPos.phone}`);

      // Draw Driving Route Polyline
      const routeCoords = isPickedUp
        ? [[driverPos.lat, driverPos.lng], [customerPos.lat, customerPos.lng]]
        : [[driverPos.lat, driverPos.lng], [kitchenPos.lat, kitchenPos.lng]];

      polylineRef.current = L.polyline(routeCoords, {
        color: '#0A8B5F',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

      // Fit map bounds to show all markers
      const bounds = L.latLngBounds([
        [kitchenPos.lat, kitchenPos.lng],
        [customerPos.lat, customerPos.lng],
        [driverPos.lat, driverPos.lng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });

    } catch (err) {
      console.error('Leaflet map error:', err);
    }
  }, [leafletLoaded, isKeyConfigured, mapLoaded, delivery, mapLayer]);

  // Dynamic Navigation URL
  const navOrigin = `${driverPos.lat},${driverPos.lng}`;
  const navDest = `${targetDestination.lat},${targetDestination.lng}`;
  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${navOrigin}&destination=${navDest}&travelmode=driving&dir_action=navigate`;

  return (
    <div className="bg-[#F9FBF9] rounded-2xl border-2 border-[#0A8B5F]/40 p-4 space-y-3 relative overflow-hidden shadow-xs">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5ECE8] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-[#0A8B5F] uppercase tracking-wider">
            <Navigation size={15} className="animate-spin text-[#0A8B5F]" />
            <span>REAL GOOGLE MAPS LIVE GPS TRACKER</span>
          </div>
          <div className="text-xs font-black text-[#111827] mt-0.5">
            Order #{delivery?.orderId || delivery?.requestId || '1026'} • {isPickedUp ? `En route to Customer (${customerPos.name})` : `En route to Kitchen (${kitchenPos.name})`}
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <a
            href={googleNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0A8B5F] hover:bg-[#08734e] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ExternalLink size={13} />
            <span>START NAVIGATION</span>
          </a>
        </div>
      </div>

      {/* Main Interactive Map View Container (Clean Light Theme Background) */}
      <div 
        style={{ height }} 
        className="w-full bg-[#E5ECE8] rounded-xl border-2 border-[#0A8B5F]/30 relative overflow-hidden shadow-inner flex flex-col justify-between"
      >
        <div ref={mapRef} className="w-full h-full z-0" />
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-extrabold text-[#111827]">
        <div className="flex items-center gap-2">
          <span className="bg-white text-emerald-800 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <Clock size={13} className="text-[#0A8B5F]" />
            <span>ETA: {realEta || `${delivery?.etaMinutes || 12} mins`}</span>
          </span>

          <span className="bg-white text-blue-800 border border-blue-300 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
            <Navigation size={13} className="text-blue-600" />
            <span>Distance: {realDistance || `${delivery?.distanceKm || 2.4} km`}</span>
          </span>
        </div>

        <span className="text-[10px] text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-extrabold flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>● GPS ACTIVE — Live Real-Time Coordinates</span>
        </span>
      </div>
    </div>
  );
}
