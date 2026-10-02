import React, { useState, useEffect } from 'react';

export default function LiveFleetGpsTab({ onNavigate, onOpenDriver360 }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourierId, setSelectedCourierId] = useState('TL-65013-B');
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showHeat, setShowHeat] = useState(false);
  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [tickerMessage, setTickerMessage] = useState(
    '20:44:12 IST: #TL-65013-B (23.0281° N, 72.5670° E) • Packet hash: 0x9a8f...4b1 • Ping latency: 14ms • GPS Accuracy: ±2.4m.'
  );
  const [toastMessage, setToastMessage] = useState(null);
  const [dbCouriers, setDbCouriers] = useState([]);
  const [stats, setStats] = useState({
    registeredFleet: 1,
    onlineConnected: 1,
    standbyAvailable: 1,
    inFlightOrders: 1,
    doorstepPending: 0,
    offlineTelemetry: 0,
    fleetReadiness: '100.0% telemetry reporting'
  });

  // Interactive Button States
  const [isHubCentered, setIsHubCentered] = useState(false);
  const [isRadarFilterOpen, setIsRadarFilterOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [callModalCourier, setCallModalCourier] = useState(null);
  const [local360Courier, setLocal360Courier] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCenterWestHub = () => {
    setIsHubCentered(true);
    setTickerMessage('CENTER LOCK: Bodakdev Central Kitchen Node (23.0381° N, 72.5119° E) • Zoom: 14.5x • Geofence active');
    showToast('Radar viewport locked & centered on Ahmedabad West Hub (Bodakdev Sector)');
    setTimeout(() => setIsHubCentered(false), 3000);
  };

  // Telemetry stream ticker generator based on database fleet
  useEffect(() => {
    if (isStreamPaused) return;
    const interval = setInterval(() => {
      const activeIds = dbCouriers.map((d) => d.id);
      const pick = activeIds.length > 0 ? activeIds[Math.floor(Math.random() * activeIds.length)] : 'TL-65013-B';
      const lat = (23.028 + (Math.random() - 0.5) * 0.005).toFixed(4);
      const lng = (72.567 + (Math.random() - 0.5) * 0.005).toFixed(4);
      const now = new Date().toTimeString().split(' ')[0] + ' IST';
      const rtt = Math.floor(12 + Math.random() * 8);
      setTickerMessage(`${now}: #${pick} (${lat}° N, ${lng}° E) • Packet hash: 0x${Math.random().toString(16).slice(2, 8)}... • Ping: ${rtt}ms • RTK GPS: ±2.4m`);
    }, 4500);
    return () => clearInterval(interval);
  }, [isStreamPaused, dbCouriers]);

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/drivers')
      .then(r => r.json())
      .then(data => {
        if (data.stats) {
          setStats({
            registeredFleet: data.stats.registeredFleet || 0,
            onlineConnected: data.stats.onlineConnected || 0,
            standbyAvailable: data.stats.standbyAvailable || 0,
            inFlightOrders: data.stats.inFlightOrders || 0,
            doorstepPending: data.stats.doorstepPending !== undefined ? data.stats.doorstepPending : 0,
            offlineTelemetry: data.stats.offlineTelemetry || 0,
            fleetReadiness: data.stats.fleetReadiness || '100.0% telemetry reporting'
          });
        }
        if (data.success && Array.isArray(data.drivers)) {
          const mapped = data.drivers.map(d => ({
            id: d.driverId || d.id || 'TL-65013-B',
            name: d.name || 'Ziyan Mansuri',
            type: (d.status || '').toUpperCase() === 'AVAILABLE' ? 'idle' : ((d.status || '').toUpperCase() === 'BUSY' ? 'transit' : 'idle'),
            status: d.status || 'AVAILABLE',
            statusTone: (d.status || '').toUpperCase() === 'AVAILABLE' ? 'blue' : ((d.status || '').toUpperCase() === 'BUSY' ? 'emerald' : 'neutral'),
            orderId: d.activeOrder && !d.activeOrder.toLowerCase().includes('none') ? (d.activeOrder.startsWith('#') ? d.activeOrder.replace('#', '') : d.activeOrder) : '',
            eta: d.eta || 'Ready for dispatch',
            dist: '0.8 km from hub',
            speed: d.speed || '0 km/h (Standby)',
            battery: '94% Power',
            heading: d.cluster || 'Amber Tower Cluster',
            target: d.orderDetail || 'Bodakdev Central Hub',
            phone: d.phone || '+91 9558601570',
            stage: d.cluster || 'Amber Tower Cluster, Ahmedabad',
            radius: 'Radius: 5.0 km',
            bagTemp: 'Hot Bag Temp: 68.2°C Ready',
            vehicleNo: d.vehicleNo || 'GJ 27 DX 3654'
          }));
          setDbCouriers(mapped);
          if (mapped.length > 0) {
            setSelectedCourierId(prev => mapped.some(c => c.id === prev) ? prev : mapped[0].id);
          } else {
            setSelectedCourierId(null);
          }
        }
      })
      .catch(e => console.error('Failed to load DB drivers in GPS radar:', e));
  }, []);

  const allDisplayCouriers = dbCouriers;

  const filteredCouriers = allDisplayCouriers.filter((c) => {
    if (activeFilter === 'transit' && c.type !== 'transit') return false;
    if (activeFilter === 'idle' && c.type !== 'idle') return false;
    if (activeFilter === 'doorstep' && c.type !== 'doorstep') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.orderId && c.orderId.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full -m-4 sm:-m-6 md:-m-8 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* Command Header & Breadcrumb */}
      <section className="w-full bg-[#fbf9f5] border-b border-[#ded9d1] px-6 sm:px-8 py-5">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 max-w-[1440px] mx-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#665d52]">
              <span>SUPER ADMIN</span>
              <span>/</span>
              <span>MANAGEMENT</span>
              <span>/</span>
              <span>DELIVERY PARTNERS</span>
              <span>/</span>
              <span className="text-[#1a1a1a] font-semibold">LIVE FLEET GPS</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight font-normal">
                Live Fleet GPS Command & Tactical Handover Radar
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-[#eae8e4] text-[#665d52] uppercase tracking-widest font-medium border border-[#ded9d1]">
                ZONE AMD-WEST
              </span>
            </div>

            {/* Live Socket Telemetry Ingest Badge */}
            <div className="flex items-center gap-3 pt-0.5 flex-wrap">
              <div className="flex items-center gap-2 font-mono text-xs bg-[#f0eeea] border border-[#ded9d1] px-3 py-1 text-[#1a1a1a]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse inline-block" />
                <span className="font-semibold">Socket.IO Ingest Active (20ms latency)</span>
                <span className="text-[#665d52]">•</span>
                <span className="text-[#665d52]">PostGIS Geocoding Cluster: AMD-C</span>
                <span className="text-[#665d52]">•</span>
                <span className="text-[#665d52]">TLS 1.3 Strict</span>
              </div>
              <span className="font-mono text-[11px] text-[#665d52] hidden md:inline">SYNC CYCLE: 1200ms</span>
            </div>
          </div>

          {/* Quick Control Action Bar */}
          <div className="flex items-center gap-2 flex-wrap relative">
            <button
              onClick={handleCenterWestHub}
              className={`px-4 py-2 font-mono text-xs flex items-center gap-2 transition-all ${
                isHubCentered ? 'bg-emerald-800 text-white ring-2 ring-emerald-500 scale-105' : 'bg-[#1a1a1a] text-white hover:bg-black'
              }`}
              title="Lock radar center on Ahmedabad West Hub"
            >
              <span className={`material-symbols-outlined text-[16px] ${isHubCentered ? 'animate-spin' : ''}`}>my_location</span>
              <span>{isHubCentered ? 'Hub Centered' : 'Center West Hub'}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsRadarFilterOpen(!isRadarFilterOpen)}
                className={`px-3.5 py-2 font-mono text-xs flex items-center gap-1.5 transition-colors border ${
                  isRadarFilterOpen ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4] border-[#ded9d1]'
                }`}
                title="Toggle Radar Display Filters"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Filter Radar</span>
                <span className="text-[10px] ml-0.5">{isRadarFilterOpen ? '▲' : '▼'}</span>
              </button>

              {/* Filter Radar Popover Panel */}
              {isRadarFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#ded9d1] shadow-2xl p-3 z-50 font-mono text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#ded9d1] pb-1.5 font-bold text-[#1a1a1a]">
                    <span>RADAR FILTERS</span>
                    <button onClick={() => setIsRadarFilterOpen(false)} className="text-[#665d52] hover:text-black">✕</button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-[#665d52] uppercase font-semibold">Status Scope</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      {['all', 'transit', 'idle', 'doorstep'].map((f) => (
                        <button
                          key={f}
                          onClick={() => {
                            setActiveFilter(f);
                            showToast(`Radar filtered by: ${f.toUpperCase()}`);
                          }}
                          className={`px-2 py-1 text-left uppercase transition-colors ${
                            activeFilter === f ? 'bg-[#1a1a1a] text-white font-bold' : 'bg-[#f5f3ef] text-[#665d52] hover:bg-[#eae8e4]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-[#ded9d1]">
                    <div className="text-[10px] text-[#665d52] uppercase font-semibold">Visual Overlays</div>
                    <label className="flex items-center gap-2 cursor-pointer text-[#1a1a1a]">
                      <input
                        type="checkbox"
                        checked={showTraffic}
                        onChange={(e) => setShowTraffic(e.target.checked)}
                        className="rounded"
                      />
                      <span>Traffic Corridors</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#1a1a1a]">
                      <input
                        type="checkbox"
                        checked={showHubs}
                        onChange={(e) => setShowHubs(e.target.checked)}
                        className="rounded"
                      />
                      <span>Kitchen Hub Nodes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#1a1a1a]">
                      <input
                        type="checkbox"
                        checked={showHeat}
                        onChange={(e) => setShowHeat(e.target.checked)}
                        className="rounded"
                      />
                      <span>Geofence 5km Radii</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSosModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-red-50 text-[#665d52] hover:text-red-700 font-mono text-xs flex items-center gap-2 border border-[#ded9d1] transition-colors cursor-pointer"
              title="Open SOS Emergency Dispatch Monitor"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-[#1a1a1a]">SOS: 0 Active</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Tactical Metrics Strip */}
      <section className="w-full bg-[#f0eeea] border-b border-[#ded9d1] px-6 sm:px-8 py-3.5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-[1440px] mx-auto font-mono">
          <div className="bg-white p-3.5 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="text-[10px] tracking-wider uppercase font-semibold">Total Active Fleet</span>
              <span className="material-symbols-outlined text-sm">moped</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a1a1a] leading-none">
                {String(stats.onlineConnected).padStart(2, '0')}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">Online</span>
            </div>
            <div className="text-[10px] text-[#665d52] mt-0.5">{stats.fleetReadiness}</div>
          </div>

          <div className="bg-white p-3.5 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="text-[10px] tracking-wider uppercase font-semibold">Available Hub Idle</span>
              <span className="material-symbols-outlined text-sm">store</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a1a1a] leading-none">
                {String(stats.standbyAvailable).padStart(2, '0')}
              </span>
              <span className="text-xs text-[#665d52] font-semibold">At Kitchens</span>
            </div>
            <div className="text-[10px] text-[#665d52] mt-0.5">
              {stats.standbyAvailable > 0 ? `${stats.standbyAvailable} Ready for dispatch` : 'Avg standby 11.4 min'}
            </div>
          </div>

          <div className="bg-white p-3.5 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="text-[10px] tracking-wider uppercase font-semibold">On Delivery</span>
              <span className="material-symbols-outlined text-sm">navigation</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a1a1a] leading-none">
                {String(stats.inFlightOrders).padStart(2, '0')}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">In-Transit</span>
            </div>
            <div className="text-[10px] text-[#665d52] mt-0.5">
              {stats.inFlightOrders > 0 ? `${stats.inFlightOrders} Active in flight` : 'Thermal canisters moving'}
            </div>
          </div>

          <div className="bg-white p-3.5 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="text-[10px] tracking-wider uppercase font-semibold">Standby At Doorstep</span>
              <span className="material-symbols-outlined text-sm">pin_drop</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a1a1a] leading-none">
                {String(stats.doorstepPending).padStart(2, '0')}
              </span>
              <span className="text-xs text-amber-700 font-semibold">OTP Pending</span>
            </div>
            <div className="text-[10px] text-[#665d52] mt-0.5">Handshake cycle ~2m</div>
          </div>

          <div className="bg-white p-3.5 border border-[#ded9d1] shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="text-[10px] tracking-wider uppercase font-semibold">Offline Telemetry</span>
              <span className="material-symbols-outlined text-sm text-red-600">signal_disconnected</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a1a1a] leading-none">
                {String(stats.offlineTelemetry).padStart(2, '0')}
              </span>
              <span className="text-xs text-red-700 font-semibold">&gt;15m Heartbeat</span>
            </div>
            <div className="text-[10px] text-[#665d52] mt-0.5">Unreachable couriers</div>
          </div>
        </div>
      </section>

      {/* Split-Pane Tactical Interface */}
      <section className="w-full px-6 sm:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANE: 60% Map Canvas (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {/* Interactive Cartography Viewport */}
            <div className="relative w-full h-[620px] bg-[#f5f3ef] border border-[#ded9d1] overflow-hidden shadow-sm select-none">
              {/* SVG Vector Canvas for Ahmedabad West */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern-radar" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ded9d1" strokeWidth="0.5" opacity="0.6" />
                  </pattern>
                </defs>

                {/* Grid Base */}
                <rect width="100%" height="100%" fill="url(#grid-pattern-radar)" />

                {/* Sabarmati River Contour (East border of map) */}
                <path
                  d="M 680,-20 C 660,160 640,320 610,480 C 590,590 560,720 550,800"
                  fill="none"
                  stroke="#ded9d1"
                  strokeWidth="24"
                  opacity="0.8"
                />
                <path
                  d="M 680,-20 C 660,160 640,320 610,480 C 590,590 560,720 550,800"
                  fill="none"
                  stroke="#eae8e4"
                  strokeWidth="18"
                />

                {/* Geofence 5km Delivery Radius Rings */}
                {showHeat && (
                  <>
                    <circle cx="280" cy="290" r="140" fill="#eee0d2" fillOpacity="0.4" stroke="#cbc6be" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="440" cy="380" r="120" fill="#eee0d2" fillOpacity="0.3" stroke="#cbc6be" strokeWidth="1" strokeDasharray="4 4" />
                  </>
                )}

                {/* Arterial Road Corridors */}
                {/* SG Highway (Diagonal North-South) */}
                <line x1="80" y1="20" x2="220" y2="600" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                {/* Drive-In Road (Bodakdev -> Memnagar) */}
                <line x1="120" y1="200" x2="480" y2="190" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
                {/* 132 Feet Ring Road */}
                <line x1="370" y1="50" x2="420" y2="590" stroke="#665d52" strokeWidth="2" strokeDasharray="3 2" opacity="0.7" />
                {/* Satellite Road Corridor */}
                <line x1="140" y1="380" x2="500" y2="360" stroke="#1a1a1a" strokeWidth="2.5" opacity="0.8" />
                {/* Judges Bungalow Road Connector */}
                <line x1="160" y1="160" x2="340" y2="300" stroke="#665d52" strokeWidth="1.8" opacity="0.6" />
                {/* Vastrapur Lake Loop */}
                <circle cx="320" cy="280" r="30" fill="#efeeea" stroke="#1a1a1a" strokeWidth="1.5" />

                {/* Active Route Polyline for active DB couriers */}
                {dbCouriers.some(c => c.orderId) && (
                  <>
                    <polyline points="235,215 270,240 280,270" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeDasharray="6 3" />
                    <polyline points="180,180 210,195 235,215" fill="none" stroke="#1a1a1a" strokeWidth="3" />
                  </>
                )}
              </svg>

              {/* Cartographic District Labels */}
              <div className="absolute top-5 left-10 font-mono text-[9px] text-[#665d52] tracking-widest uppercase pointer-events-none">
                CORRIDOR // S.G. HIGHWAY EXPRESS
              </div>
              <div className="absolute top-44 left-40 font-serif text-sm text-[#1a1a1a]/70 font-semibold tracking-wide pointer-events-none">
                BODAKDEV SECTOR
              </div>
              <div className="absolute top-[265px] left-[350px] font-serif text-sm text-[#1a1a1a]/70 font-semibold tracking-wide pointer-events-none">
                VASTRAPUR LAKE BASIN
              </div>
              <div className="absolute top-[395px] left-32 font-serif text-sm text-[#1a1a1a]/70 font-semibold tracking-wide pointer-events-none">
                SATELLITE CENTRAL
              </div>
              <div className="absolute top-[190px] right-20 font-serif text-sm text-[#1a1a1a]/50 font-semibold tracking-wide pointer-events-none">
                NAVRANGPURA WEST
              </div>
              <div className="absolute bottom-12 right-32 font-serif text-sm text-[#1a1a1a]/50 font-semibold tracking-wide pointer-events-none">
                PALDI CROSSROAD
              </div>

              {/* Kitchen Hubs */}
              {showHubs && (
                <>
                  {/* Central Hearth Kitchen Node (Satellite) */}
                  <div className="absolute top-[380px] left-[250px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-7 h-7 rounded-full bg-[#ded9d1] animate-ping opacity-30" />
                      <div className="w-6 h-6 bg-[#1a1a1a] text-white flex items-center justify-center font-mono text-[10px] font-bold shadow-md">
                        KH
                      </div>
                    </div>
                    <div className="absolute left-8 top-0 bg-white border border-[#ded9d1] px-2 py-1 shadow-sm whitespace-nowrap z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-mono text-[10px] font-bold text-[#1a1a1a]">CENTRAL HEARTH HUB #01</div>
                      <div className="font-mono text-[9px] text-[#665d52]">8 Couriers Idle • 34 Orders Staged</div>
                    </div>
                  </div>

                  {/* Vastrapur Kitchen Hub Node */}
                  <div className="absolute top-[270px] left-[310px] -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer">
                    <div className="w-5 h-5 bg-[#4a4238] text-white flex items-center justify-center font-mono text-[9px] font-bold shadow-md">
                      K2
                    </div>
                    <div className="absolute left-7 top-0 bg-white border border-[#ded9d1] px-2 py-1 shadow-sm whitespace-nowrap z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-mono text-[10px] font-bold text-[#1a1a1a]">VASTRAPUR NODE HUB</div>
                      <div className="font-mono text-[9px] text-[#665d52]">5 Couriers Available</div>
                    </div>
                  </div>
                </>
              )}

              {/* Database Real Courier Marker(s) */}
              {dbCouriers.map((dc, idx) => {
                const isSelected = selectedCourierId === dc.id;
                const topPos = 215 + (idx * 45);
                const leftPos = 235 + (idx * 55);

                return (
                  <React.Fragment key={dc.id}>
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
                      style={{ top: `${topPos}px`, left: `${leftPos}px` }}
                      onClick={() => setSelectedCourierId(dc.id)}
                    >
                      <div className="relative flex flex-col items-center">
                        <span className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-emerald-500 animate-ping opacity-60" />
                        <div className={`w-7 h-7 bg-[#1a1a1a] text-emerald-400 border-2 ${isSelected ? 'border-emerald-400 ring-2 ring-emerald-500 scale-110' : 'border-emerald-500'} flex items-center justify-center shadow-lg transition-transform`}>
                          <span className="material-symbols-outlined text-[15px]">two_wheeler</span>
                        </div>
                        <div className="mt-1 bg-white border border-[#1a1a1a] px-1.5 py-0.5 shadow-sm flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span className="font-mono text-[10px] font-bold text-[#1a1a1a]">#{dc.id}</span>
                          <span className="font-mono text-[9px] text-emerald-800 bg-emerald-50 px-1 font-semibold">{dc.name}</span>
                          <span className="font-mono text-[9px] text-[#665d52] bg-[#f0eeea] px-1">{dc.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Drop-off Destination Target if Courier has Active Order */}
                    {dc.orderId && (
                      <div className="absolute top-[280px] left-[290px] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="flex items-center gap-1 bg-white border border-[#1a1a1a] px-1.5 py-0.5 shadow-sm">
                          <span className="material-symbols-outlined text-xs text-emerald-700">flag</span>
                          <span className="font-mono text-[9px] text-[#1a1a1a]">Drop: {dc.target || 'Customer Address'}</span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Traffic Alert Card */}
              {showTraffic && (
                <div className="absolute top-10 left-36 z-20 bg-white/95 backdrop-blur-sm p-2 max-w-[220px] shadow-sm border border-[#ded9d1]">
                  <div className="flex items-center gap-1 text-amber-800 font-mono text-[9px] font-bold uppercase">
                    <span className="material-symbols-outlined text-xs">traffic</span>
                    <span>Drive-In Rd Congestion</span>
                  </div>
                  <p className="font-mono text-[9px] text-[#665d52] mt-0.5 leading-tight">
                    Moderate slowdown. +4.2m added to active route ETAs.
                  </p>
                </div>
              )}

              {/* Floating Map Controls */}
              <div className="absolute top-4 right-4 z-40 flex flex-col gap-1 font-mono text-xs">
                <div className="bg-white border border-[#ded9d1] p-0.5 shadow-sm flex flex-col gap-0.5">
                  <button
                    onClick={() => showToast('Zoom in +1')}
                    className="w-7 h-7 bg-[#f5f3ef] flex items-center justify-center text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                  <button
                    onClick={() => showToast('Zoom out -1')}
                    className="w-7 h-7 bg-[#f5f3ef] flex items-center justify-center text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                </div>

                <div className="bg-white border border-[#ded9d1] p-0.5 shadow-sm flex flex-col gap-0.5 mt-1.5">
                  <button
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={`w-7 h-7 flex items-center justify-center transition-colors ${
                      showTraffic ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f3ef] text-[#1a1a1a]'
                    }`}
                    title="Toggle Traffic Flow"
                  >
                    <span className="material-symbols-outlined text-sm">traffic</span>
                  </button>
                  <button
                    onClick={() => setShowHubs(!showHubs)}
                    className={`w-7 h-7 flex items-center justify-center transition-colors ${
                      showHubs ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f3ef] text-[#1a1a1a]'
                    }`}
                    title="Toggle Kitchen Hubs"
                  >
                    <span className="material-symbols-outlined text-sm">soup_kitchen</span>
                  </button>
                  <button
                    onClick={() => setShowHeat(!showHeat)}
                    className={`w-7 h-7 flex items-center justify-center transition-colors ${
                      showHeat ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f3ef] text-[#1a1a1a]'
                    }`}
                    title="Toggle Density Heatmap"
                  >
                    <span className="material-symbols-outlined text-sm">layers</span>
                  </button>
                </div>
              </div>

              {/* Bottom Left Scale */}
              <div className="absolute bottom-3 left-3 z-30 bg-white/95 px-2.5 py-1 shadow-sm font-mono text-[9px] text-[#665d52] border border-[#ded9d1] flex items-center gap-2">
                <span>SCALE 1:12,500</span>
                <span>•</span>
                <span>EPSG:4326 (WGS84)</span>
                <span>•</span>
                <span className="text-[#1a1a1a] font-semibold">AHMEDABAD WEST QUAD</span>
              </div>
            </div>

            {/* Diagnostic Bar */}
            <div className="bg-white border border-[#ded9d1] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-[#665d52] uppercase text-[10px] tracking-wider font-semibold">SENSOR STATUS:</span>
                <span className="flex items-center gap-1 text-[#1a1a1a] font-semibold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  99.2% LOCK
                </span>
                <span className="text-[#ded9d1]">|</span>
                <span className="text-[#665d52] text-[11px]">MEDIAN DRIFT: ±2.4m</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#665d52]">
                <span>FRAME PACKETS: 4,821/s</span>
                <span>DROPPED: 0.01%</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: 40% Live Courier & Ingest Feed (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Search & Filter Controls */}
            <div className="bg-white border border-[#ded9d1] p-3.5 space-y-2.5 shadow-sm">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#665d52] text-sm">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search partner ID, name, order hash..."
                  className="w-full bg-[#f5f3ef] border border-[#ded9d1] pl-8 pr-3 py-1.5 font-mono text-xs text-[#1a1a1a] placeholder:text-[#665d52] focus:outline-none focus:bg-white focus:border-[#1a1a1a]"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-[#1a1a1a] text-white font-semibold'
                      : 'bg-[#f0eeea] text-[#665d52] hover:text-[#1a1a1a] border border-[#ded9d1]'
                  }`}
                >
                  All ({allDisplayCouriers.length})
                </button>
                <button
                  onClick={() => setActiveFilter('transit')}
                  className={`px-2.5 py-1 transition-colors ${
                    activeFilter === 'transit'
                      ? 'bg-[#1a1a1a] text-white font-semibold'
                      : 'bg-[#f0eeea] text-[#665d52] hover:text-[#1a1a1a] border border-[#ded9d1]'
                  }`}
                >
                  In-Transit ({stats.inFlightOrders || allDisplayCouriers.filter(c => c.type === 'transit').length})
                </button>
                <button
                  onClick={() => setActiveFilter('idle')}
                  className={`px-2.5 py-1 transition-colors ${
                    activeFilter === 'idle'
                      ? 'bg-[#1a1a1a] text-white font-semibold'
                      : 'bg-[#f0eeea] text-[#665d52] hover:text-[#1a1a1a] border border-[#ded9d1]'
                  }`}
                >
                  Idle ({stats.standbyAvailable || allDisplayCouriers.filter(c => c.type === 'idle').length})
                </button>
                <button
                  onClick={() => setActiveFilter('doorstep')}
                  className={`px-2.5 py-1 transition-colors ${
                    activeFilter === 'doorstep'
                      ? 'bg-[#1a1a1a] text-white font-semibold'
                      : 'bg-[#f0eeea] text-[#665d52] hover:text-[#1a1a1a] border border-[#ded9d1]'
                  }`}
                >
                  Handshake ({stats.doorstepPending || allDisplayCouriers.filter(c => c.type === 'doorstep').length})
                </button>
              </div>
            </div>

            {/* Real-Time Courier Feed List */}
            <div className="flex flex-col space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredCouriers.length === 0 ? (
                <div className="bg-white border border-[#ded9d1] p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-[#ded9d1] mb-2 block">location_off</span>
                  <p className="font-serif text-base text-[#1a1a1a]">No Active Couriers Found</p>
                  <p className="text-xs text-[#665d52] font-mono mt-1">No driver matches current telemetry filter.</p>
                </div>
              ) : (
                filteredCouriers.map((c) => {
                  const isSelected = selectedCourierId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCourierId(c.id)}
                    className={`bg-white border p-3.5 transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'border-[#1a1a1a] ring-1 ring-[#1a1a1a] bg-[#fbf9f5]'
                        : 'border-[#ded9d1] hover:bg-[#f5f3ef]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif text-base text-[#1a1a1a] font-semibold">{c.name}</span>
                          <span className="font-mono text-[9px] bg-[#1a1a1a] text-white px-1.5 py-0.5">#{c.id}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-[#665d52]">
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              c.statusTone === 'emerald'
                                ? 'text-emerald-800'
                                : c.statusTone === 'amber'
                                ? 'text-amber-800'
                                : c.statusTone === 'red'
                                ? 'text-red-700'
                                : 'text-[#665d52]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                c.statusTone === 'emerald'
                                  ? 'bg-emerald-600'
                                  : c.statusTone === 'amber'
                                  ? 'bg-amber-600'
                                  : c.statusTone === 'red'
                                  ? 'bg-red-600'
                                  : 'bg-[#665d52]'
                              }`}
                            />
                            {c.status}
                          </span>
                          {c.orderId && (
                            <>
                              <span>•</span>
                              <span>Order <strong className="text-[#1a1a1a]">#{c.orderId}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <div className="text-[#1a1a1a] font-semibold">{c.eta || c.readiness || c.dwell || c.telemetryNotice}</div>
                        <div className="text-[10px] text-[#665d52]">{c.dist || c.queuePos || c.awaiting || c.battery}</div>
                      </div>
                    </div>

                    {c.speed && (
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 bg-[#f5f3ef] border border-[#ded9d1] p-2 font-mono text-[10px]">
                        <div>
                          <div className="text-[8px] text-[#665d52] uppercase">Telemetry Speed</div>
                          <div className="font-semibold text-[#1a1a1a]">{c.speed}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-[#665d52] uppercase">Battery</div>
                          <div className="font-semibold text-[#1a1a1a]">{c.battery}</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-[#665d52] uppercase">Heading / Route</div>
                          <div className="font-semibold text-[#1a1a1a]">{c.heading}</div>
                        </div>
                      </div>
                    )}

                    {c.target && (
                      <div className="mt-2 flex items-center justify-between text-xs font-mono">
                        <div className="text-[#665d52] text-[10px] truncate max-w-[200px]">
                          Target: <span className="text-[#1a1a1a] font-medium">{c.target}</span>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedCourierId(c.id);
                              showToast(`Radar reticle locked on #${c.id} (${c.name})`);
                            }}
                            className="px-2 py-0.5 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors text-[10px] border border-[#ded9d1] font-semibold"
                            title="Pin radar lock on courier"
                          >
                            Pin
                          </button>
                          <button
                            onClick={() => setCallModalCourier(c)}
                            className="px-2 py-0.5 bg-[#1a1a1a] text-white hover:bg-black transition-colors text-[10px] flex items-center gap-0.5"
                            title="Call Courier"
                          >
                            <span className="material-symbols-outlined text-[11px]">call</span>
                            <span>Call</span>
                          </button>
                          <button
                            onClick={() => {
                              if (onOpenDriver360) {
                                onOpenDriver360(c.id);
                              } else {
                                setLocal360Courier(c);
                              }
                            }}
                            className="px-2 py-0.5 bg-[#1a1a1a] text-white hover:bg-black transition-colors text-[10px] flex items-center gap-0.5 border border-[#ded9d1]"
                            title="Open 360° Partner Dossier"
                          >
                            <span className="material-symbols-outlined text-[11px]">visibility</span>
                            <span>360°</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {c.stage && (
                      <div className="mt-2 bg-[#f5f3ef] border border-[#ded9d1] p-2 font-mono text-[10px] flex items-center justify-between">
                        <div>
                          <span className="text-[#665d52]">Staged At:</span>
                          <span className="text-[#1a1a1a] font-medium ml-1">{c.stage}</span>
                        </div>
                        <div className="text-[#665d52]">{c.radius}</div>
                      </div>
                    )}

                    {c.bagTemp && (
                      <div className="mt-2 flex items-center justify-between text-xs font-mono">
                        <span className="text-[#665d52] text-[10px]">{c.bagTemp}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`Manual dispatch request initiated for ${c.name}`);
                          }}
                          className="px-2.5 py-0.5 bg-[#1a1a1a] text-white hover:bg-black transition-colors text-[10px]"
                        >
                          Manual Dispatch
                        </button>
                      </div>
                    )}

                    {c.address && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 p-2 font-mono text-[10px] flex items-center justify-between text-amber-900">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">home</span>
                          <span>{c.address}</span>
                        </div>
                        <span className="font-semibold">Escrow Locked</span>
                      </div>
                    )}

                    {c.ring && (
                      <div className="mt-2 flex items-center justify-between text-xs font-mono">
                        <span className="text-[#665d52] text-[10px]">{c.ring}</span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => showToast(`Doorstep OTP bypass triggered for #${c.id}`)}
                            className="px-2 py-0.5 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors text-[10px] border border-[#ded9d1]"
                          >
                            Bypass OTP
                          </button>
                        </div>
                      </div>
                    )}

                    {c.lastKnown && (
                      <div className="mt-2 bg-red-50 border border-red-200 p-2 font-mono text-[10px] text-red-900 flex items-center justify-between">
                        <span>{c.lastKnown}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`Cell carrier tower ping dispatched for ${c.name}`);
                          }}
                          className="px-2 py-0.5 bg-red-700 text-white hover:bg-red-800 text-[10px]"
                        >
                          Ping Tower
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Operational Telemetry Stream Footer */}
      <footer className="w-full bg-[#f0eeea] border-t border-[#ded9d1] px-6 sm:px-8 py-3.5 font-mono text-xs mt-4">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${isStreamPaused ? 'bg-amber-500' : 'bg-emerald-600 animate-ping'}`} />
            <span className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[10px]">AUDIT INGEST FEED:</span>
            <div className="text-[#665d52] text-[10px] truncate max-w-[700px]">
              {tickerMessage}
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#665d52] text-[10px]">
            <span>GEOHASH: QUADKEY_LEVEL_19</span>
            <span>•</span>
            <button
              onClick={() => {
                setIsStreamPaused(!isStreamPaused);
                showToast(isStreamPaused ? 'Resumed telemetry ingest' : 'Paused telemetry ingest');
              }}
              className="underline hover:text-[#1a1a1a] font-medium"
            >
              {isStreamPaused ? 'Resume Ingest' : 'Pause Ingest'}
            </button>
          </div>
        </div>
      </footer>

      {/* 1. SOS EMERGENCY MONITOR MODAL */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping" />
                <div>
                  <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider block">Security Escalation</span>
                  <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Emergency SOS & Incident Command</h3>
                </div>
              </div>
              <button
                onClick={() => setIsSosModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700">shield_check</span>
                  <div>
                    <div className="font-bold">STATUS NORMAL: 0 SOS INCIDENTS</div>
                    <div className="text-[10px] text-emerald-800">All registered couriers reporting healthy telemetry</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 font-bold">100% SECURE</span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#1a1a1a] uppercase">Emergency Speed Dials</div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:108"
                    className="p-2.5 bg-white border border-[#ded9d1] hover:border-[#1a1a1a] flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[#1a1a1a]">108 AMBULANCE</div>
                      <div className="text-[10px] text-[#665d52]">Gujarat Medical Emergency</div>
                    </div>
                    <span className="material-symbols-outlined text-red-600">emergency</span>
                  </a>
                  <a
                    href="tel:100"
                    className="p-2.5 bg-white border border-[#ded9d1] hover:border-[#1a1a1a] flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[#1a1a1a]">100 POLICE</div>
                      <div className="text-[10px] text-[#665d52]">Ahmedabad City Police</div>
                    </div>
                    <span className="material-symbols-outlined text-blue-600">local_police</span>
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-[#ded9d1] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    showToast('Safety check ping broadcasted across all Ahmedabad West nodes.');
                    setIsSosModalOpen(false);
                  }}
                  className="w-full py-2 bg-[#1a1a1a] text-white hover:bg-black font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">broadcast_on_personal</span>
                  <span>Broadcast Fleet Safety Ping</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COURIER QUICK CALL MODAL */}
      {callModalCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider block">Secure Driver Proxy</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">{callModalCourier.name}</h3>
                <span className="font-mono text-[10px] text-[#665d52]">#{callModalCourier.id} • {callModalCourier.vehicleNo}</span>
              </div>
              <button
                onClick={() => setCallModalCourier(null)}
                className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-center">
              <div className="text-sm font-bold text-[#1a1a1a] bg-white border border-[#ded9d1] py-2">
                {callModalCourier.phone || '+91 95586 01570'}
              </div>

              <div className="space-y-2">
                <a
                  href={`tel:${callModalCourier.phone}`}
                  className="w-full py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Dial Direct Phone Call</span>
                </a>

                <a
                  href={`https://wa.me/${(callModalCourier.phone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-[#25D366] text-white hover:bg-[#20ba5a] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Open WhatsApp Dispatch</span>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(callModalCourier.phone || '');
                    showToast(`Copied ${callModalCourier.phone} to clipboard`);
                  }}
                  className="w-full py-2 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#ded9d1]"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copy Phone Number</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LOCAL 360 DOSSIER VIEWER MODAL */}
      {local360Courier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#ded9d1] max-w-xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider block">Comprehensive Inspection</span>
                <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">360° Partner Dossier: {local360Courier.name}</h3>
              </div>
              <button
                onClick={() => setLocal360Courier(null)}
                className="w-8 h-8 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-4 p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <div className="w-14 h-14 bg-[#1a1a1a] text-emerald-400 flex items-center justify-center text-2xl font-bold">
                  <span className="material-symbols-outlined text-3xl">two_wheeler</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-lg font-bold text-[#1a1a1a]">{local360Courier.name}</h4>
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 text-[10px] font-bold">
                      {local360Courier.status}
                    </span>
                  </div>
                  <div className="text-[#665d52] mt-0.5">
                    ID: <strong>#{local360Courier.id}</strong> • Phone: {local360Courier.phone}
                  </div>
                  <div className="text-[#665d52]">
                    Vehicle: {local360Courier.vehicleNo} • Battery: {local360Courier.battery}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-[#f5f3ef] border border-[#ded9d1]">
                  <span className="text-[10px] text-[#665d52] block">DISPATCH STAGE</span>
                  <span className="font-bold text-[#1a1a1a] text-sm block mt-0.5">{local360Courier.target || 'Bodakdev Hub'}</span>
                </div>
                <div className="p-2.5 bg-[#f5f3ef] border border-[#ded9d1]">
                  <span className="text-[10px] text-[#665d52] block">GPS SPEED</span>
                  <span className="font-bold text-[#1a1a1a] text-sm block mt-0.5">{local360Courier.speed || '0 km/h'}</span>
                </div>
                <div className="p-2.5 bg-[#f5f3ef] border border-[#ded9d1]">
                  <span className="text-[10px] text-[#665d52] block">THERMAL STATUS</span>
                  <span className="font-bold text-emerald-800 text-sm block mt-0.5">68.2°C Ready</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#ded9d1] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLocal360Courier(null)}
                  className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-black font-semibold text-xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white px-4 py-3 font-mono text-xs flex items-center gap-2.5 shadow-xl z-50 border border-[#ded9d1] animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
