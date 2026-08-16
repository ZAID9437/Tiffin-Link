import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, Layers, CheckCircle2 } from 'lucide-react';

export default function ServiceAreaMap({ 
  kitchenLocation, 
  radiusKm = 5, 
  deliveryMode = 'Radius Based', 
  areas = [], 
  height = '26rem' 
}) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const circleRef = useRef(null);
  const areaCirclesRef = useRef([]);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapLayer, setMapLayer] = useState('roadmap'); // 'roadmap' | 'satellite'

  const kitchenLat = kitchenLocation?.latitude || 23.0300;
  const kitchenLng = kitchenLocation?.longitude || 72.5650;
  const kitchenName = kitchenLocation?.locality || kitchenLocation?.city || 'Shreeji Kitchen';

  // Load Leaflet CDN script & styles
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [kitchenLat, kitchenLng],
        zoom: 12,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Tile Layer based on layer mode
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapLayer === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }

    // Kitchen Marker (Green Pulse)
    const kitchenIcon = L.divIcon({
      className: 'custom-kitchen-marker',
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background: #0A8B5F; 
          color: white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 900; 
          font-size: 14px; 
          box-shadow: 0 4px 14px rgba(10, 139, 95, 0.5); 
          border: 3px solid white;
        ">🍱</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([kitchenLat, kitchenLng], { icon: kitchenIcon })
      .addTo(map)
      .bindPopup(`<b>🟢 ${kitchenName}</b><br/>Kitchen Delivery Hub`);

    // Remove existing main circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    // Main Service Radius Circle
    const radiusMeters = (radiusKm || 5) * 1000;
    const mainCircle = L.circle([kitchenLat, kitchenLng], {
      color: '#0A8B5F',
      fillColor: '#10B981',
      fillOpacity: 0.2,
      weight: 3,
      dashArray: deliveryMode === 'Area Based' ? '6, 6' : null
    }).addTo(map);

    circleRef.current = mainCircle;

    // Render area circles for active areas
    areaCirclesRef.current.forEach(c => map.removeLayer(c));
    areaCirclesRef.current = [];

    if (Array.isArray(areas)) {
      areas.forEach((area) => {
        if (area.status === 'ACTIVE' && area.latitude && area.longitude) {
          const areaCircle = L.circle([area.latitude, area.longitude], {
            color: '#3B82F6',
            fillColor: '#60A5FA',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(map);

          areaCircle.bindPopup(`<b>📍 ${area.areaName}</b><br/>${area.radiusKm} km radius (${area.customersCount} customers)`);
          areaCirclesRef.current.push(areaCircle);
        }
      });
    }

    map.setView([kitchenLat, kitchenLng], 12);
  }, [leafletLoaded, kitchenLat, kitchenLng, radiusKm, deliveryMode, areas, mapLayer]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#E5ECE8] shadow-xs" style={{ height }}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Layer Toggle Control Overlay */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-[#E5ECE8] shadow-md">
        <button
          type="button"
          onClick={() => setMapLayer('roadmap')}
          className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
            mapLayer === 'roadmap' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-white'
          }`}
        >
          Roadmap
        </button>
        <button
          type="button"
          onClick={() => setMapLayer('satellite')}
          className={`px-3 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
            mapLayer === 'satellite' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-white'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* Map Information Badge Overlay */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E5ECE8] shadow-md flex items-center gap-2 text-xs font-black">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[#111827]">Active Radius: <strong className="text-[#0A8B5F]">{radiusKm} KM Zone</strong></span>
      </div>
    </div>
  );
}
