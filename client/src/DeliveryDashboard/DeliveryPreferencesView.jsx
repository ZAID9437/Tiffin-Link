import React, { useState, useEffect } from 'react';

/**
 * DeliveryPreferencesView Component - Driver Delivery Preferences Module
 * Full real-time MongoDB persistence, real-time matrix updates, dispatch matching simulation,
 * and exact TiffinLink Driver Panel aesthetics matching HTML prompt.
 */
export default function DeliveryPreferencesView({ currentUser, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [syncTime, setSyncTime] = useState('Just now');
  const [errorMessage, setErrorMessage] = useState(null);

  const activeToken = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const driverId = currentUser?.driverId || currentUser?.id || currentUser?._id || '';
  const driverName = currentUser?.fullName || currentUser?.name || 'Courier Partner';

  // Preference State
  const [deliveryTypes, setDeliveryTypes] = useState({
    standard: true,
    express: true,
    scheduled: false,
    subscription: true
  });

  const [maxDistanceKm, setMaxDistanceKm] = useState(12.0);
  const [strictBoundary, setStrictBoundary] = useState(true);
  
  const [preferredAreas, setPreferredAreas] = useState([]);
  const [newAreaInput, setNewAreaInput] = useState('');

  const [minPayout, setMinPayout] = useState(50);
  const [maxPayout, setMaxPayout] = useState(500);

  const [vehicleType, setVehicleType] = useState('Two-Wheeler');

  const [capabilities, setCapabilities] = useState({
    hotFood: true,
    multipleOrders: true,
    heavyCrates: false
  });

  const [autoAssignment, setAutoAssignment] = useState(true);
  const [allowMultipleOrders, setAllowMultipleOrders] = useState(false);
  const [maxActiveDeliveries, setMaxActiveDeliveries] = useState(1);

  // Radar Simulation Metrics
  const [radarMetrics, setRadarMetrics] = useState({
    availableCount: 0,
    eligibleCount: 0,
    filteredCount: 0
  });

  // Count active delivery types
  const activeDeliveryTypesCount = Object.values(deliveryTypes).filter(Boolean).length;

  // Fetch saved preferences from MongoDB
  const fetchPreferencesFromBackend = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const email = currentUser?.email || '';
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/driver/preferences?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}`, {
        headers
      });
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        if (data.deliveryTypes) setDeliveryTypes(data.deliveryTypes);
        if (typeof data.maxDistanceKm === 'number') setMaxDistanceKm(data.maxDistanceKm);
        if (typeof data.strictBoundary === 'boolean') setStrictBoundary(data.strictBoundary);
        if (Array.isArray(data.preferredAreas)) setPreferredAreas(data.preferredAreas);
        if (typeof data.minPayout === 'number') setMinPayout(data.minPayout);
        if (typeof data.maxPayout === 'number') setMaxPayout(data.maxPayout);
        if (data.vehicleType) setVehicleType(data.vehicleType);
        if (data.capabilities) setCapabilities(data.capabilities);
        if (typeof data.autoAssignment === 'boolean') setAutoAssignment(data.autoAssignment);
        if (typeof data.allowMultipleOrders === 'boolean') setAllowMultipleOrders(data.allowMultipleOrders);
        if (typeof data.maxActiveDeliveries === 'number') setMaxActiveDeliveries(data.maxActiveDeliveries);

        setSyncTime('2m ago');
      }
    } catch (err) {
      console.error('Error fetching driver preferences:', err);
      setErrorMessage('Failed to connect to backend preferences service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferencesFromBackend();
  }, [currentUser]);

  // Save Preferences to MongoDB
  const handleSavePreferences = async () => {
    // Validate payout floor
    if (Number(minPayout) > Number(maxPayout)) {
      setErrorMessage('Minimum payout per delivery cannot be greater than maximum payout.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload = {
      driverId,
      email: currentUser?.email,
      deliveryTypes,
      maxDistanceKm: Number(maxDistanceKm),
      strictBoundary,
      preferredAreas,
      minPayout: Number(minPayout),
      maxPayout: Number(maxPayout),
      vehicleType,
      capabilities,
      autoAssignment,
      allowMultipleOrders,
      maxActiveDeliveries
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('http://localhost:5000/api/driver/preferences', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowToast(true);
        setSyncTime('Just now');
        setTimeout(() => setShowToast(false), 3500);
      } else {
        setErrorMessage(json.message || 'Failed to save delivery preferences.');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setErrorMessage('Network error. Unable to save delivery preferences.');
    } finally {
      setSaving(false);
    }
  };

  // Add Preferred Area
  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (preferredAreas.includes(trimmed)) {
      setNewAreaInput('');
      return;
    }
    setPreferredAreas(prev => [...prev, trimmed]);
    setNewAreaInput('');
  };

  // Remove Preferred Area
  const handleRemoveArea = (areaToRemove) => {
    setPreferredAreas(prev => prev.filter(a => a !== areaToRemove));
  };

  // Simulate Dispatch Matching
  const handleSimulateMatching = async () => {
    setSimulating(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('http://localhost:5000/api/driver/preferences/simulate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          driverId,
          maxDistanceKm,
          minPayout,
          maxPayout,
          deliveryTypes
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRadarMetrics(json.data);
      }
    } catch (err) {
      console.error('Error simulating matching:', err);
    } finally {
      setTimeout(() => setSimulating(false), 800);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16 font-sans bg-[#FBF9F5] text-[#1A1A1A]">
      <div className="w-full pb-20 pt-2 space-y-8 max-w-7xl mx-auto">
        
        {/* Top Context & Action Bar */}
        <div className="pb-8 border-b border-[#DED9D1]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col max-w-3xl">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#4A4238]">Availability</span>
                <span className="text-[#4A4238] text-xs">/</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]">Delivery Preferences</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F5F3EF] border border-[#DED9D1] ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                    MongoDB Dispatch Profile Synced
                  </span>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight leading-none mt-1 font-normal">
                Delivery Preferences
              </h1>
              <p className="text-sm text-[#665D52] mt-3 max-w-2xl leading-relaxed">
                Configure which delivery requests you want to receive. Your preferences will be used when matching available deliveries across regional hubs.
              </p>
            </div>

            {/* Action Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 text-[#4A4238]">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="text-[11px] font-bold tracking-wider uppercase">
                  Last synced: {syncTime} • Telemetry Valid
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchPreferencesFromBackend}
                  disabled={loading || saving}
                  className="px-4 py-2.5 bg-[#FBF9F5] border border-[#DED9D1] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#DED9D1]/50 transition-colors cursor-pointer"
                >
                  Reset to Saved
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-red-600">error</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline cursor-pointer">
              DISMISS
            </button>
          </div>
        )}

        {/* Save Notification Toast Banner */}
        {showToast && (
          <div className="transition-all duration-300 mt-4 p-4 bg-[#F5F3EF] border-l-2 border-[#1A1A1A] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1A1A1A] text-lg">verified</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                Configuration saved &amp; broadcast to dispatch mesh nodes.
              </span>
            </div>
            <span className="text-[11px] text-[#4A4238] uppercase tracking-widest font-mono">
              OK #SYNC-9921
            </span>
          </div>
        )}

        {/* 12-Column Main Workspace Grid */}
        <div className="grid grid-cols-12 gap-8 mt-8">
          
          {/* LEFT COLUMN (8 Columns): Preference Configurations */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-10">
            
            {/* SECTION 01: Consignment Profiles */}
            <section className="bg-white p-7 border border-[#DED9D1] shadow-xs">
              <div className="flex items-start justify-between pb-5 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[11px] text-[#4A4238] uppercase tracking-widest block mb-1 font-bold">
                    01 / Consignment Profiles
                  </span>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">Delivery Types</h2>
                  <p className="text-xs text-[#665D52] mt-1">
                    Define dispatch filters based on packaging profile, urgency, and courier transit capacity.
                  </p>
                </div>
                <span className="text-[10px] text-[#4A4238] uppercase tracking-widest bg-[#F5F3EF] px-2 py-1 border border-[#DED9D1] font-bold">
                  Filter Matrix
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Standard Delivery */}
                <label className="relative flex flex-col p-4 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-bold">Standard Delivery</span>
                    <input
                      type="checkbox"
                      checked={deliveryTypes.standard}
                      onChange={(e) => setDeliveryTypes(prev => ({ ...prev, standard: e.target.checked }))}
                      className="w-4 h-4 accent-[#1A1A1A] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-[#665D52] mt-2 leading-relaxed">
                    Routine hot-case lunch &amp; dinner drops, standard transit SLA 30-45m.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#4A4238] uppercase tracking-wider font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A4238]" /> SLA: 45 Min
                  </div>
                </label>

                {/* Express Delivery */}
                <label className="relative flex flex-col p-4 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-bold">Express Delivery</span>
                      <span className="text-[9px] bg-[#1A1A1A] text-white px-1.5 py-0.5 uppercase tracking-tight font-bold">
                        +25% SURGE
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={deliveryTypes.express}
                      onChange={(e) => setDeliveryTypes(prev => ({ ...prev, express: e.target.checked }))}
                      className="w-4 h-4 accent-[#1A1A1A] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-[#665D52] mt-2 leading-relaxed">
                    Priority direct dispatch, guaranteed &lt;25m delivery window, +25% surge bonus.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#4A4238] uppercase tracking-wider font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" /> SLA: 25 Min Express
                  </div>
                </label>

                {/* Scheduled Delivery */}
                <label className="relative flex flex-col p-4 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-bold">Scheduled Delivery</span>
                    <input
                      type="checkbox"
                      checked={deliveryTypes.scheduled}
                      onChange={(e) => setDeliveryTypes(prev => ({ ...prev, scheduled: e.target.checked }))}
                      className="w-4 h-4 accent-[#1A1A1A] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-[#665D52] mt-2 leading-relaxed">
                    Pre-booked multi-day catering &amp; office batch deliveries with scheduled slots.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#4A4238] uppercase tracking-wider font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A4238]" /> Batch Fulfillment
                  </div>
                </label>

                {/* Tiffin Subscription */}
                <label className="relative flex flex-col p-4 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-bold">Tiffin Subscription</span>
                    <input
                      type="checkbox"
                      checked={deliveryTypes.subscription}
                      onChange={(e) => setDeliveryTypes(prev => ({ ...prev, subscription: e.target.checked }))}
                      className="w-4 h-4 accent-[#1A1A1A] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-[#665D52] mt-2 leading-relaxed">
                    Recurring daily customer dabba exchanges on fixed route corridors.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#4A4238] uppercase tracking-wider font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A4238]" /> Dedicated Route
                  </div>
                </label>
              </div>

              <div className="mt-5 pt-4 border-t border-[#DED9D1]/60 flex items-center justify-between text-[#665D52]">
                <span className="text-[11px] uppercase tracking-wider text-[#4A4238] font-mono">
                  schema mapping: driver_preferences.delivery_types
                </span>
                <span className="text-[11px] text-[#1A1A1A] uppercase font-bold">
                  {activeDeliveryTypesCount} of 4 Active
                </span>
              </div>
            </section>

            {/* SECTION 02: Geographic Boundary */}
            <section className="bg-white p-7 border border-[#DED9D1] shadow-xs">
              <div className="flex items-start justify-between pb-5 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[11px] text-[#4A4238] uppercase tracking-widest block mb-1 font-bold">
                    02 / Geographic Boundary
                  </span>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">Maximum Delivery Distance</h2>
                  <p className="text-xs text-[#665D52] mt-1">
                    Set the geographic radius cutoff from your active position or central cluster hub.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#4A4238] uppercase tracking-widest block font-bold">
                    Transit Boundary
                  </span>
                  <span className="font-serif text-2xl text-[#1A1A1A]">
                    {Number(maxDistanceKm).toFixed(1)} km
                  </span>
                </div>
              </div>

              {/* Slider and Display Card */}
              <div className="mt-6 flex flex-col gap-6">
                <div className="p-5 bg-[#F5F3EF] border border-[#DED9D1] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] uppercase text-[#4A4238] tracking-widest block font-bold">
                      Radius Target
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-serif text-4xl text-[#1A1A1A] leading-none">
                        {Number(maxDistanceKm).toFixed(1)}
                      </span>
                      <span className="font-serif text-xl text-[#4A4238]">km</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#665D52] max-w-md leading-relaxed border-l-0 md:border-l md:border-[#DED9D1] md:pl-5">
                    Optimized for thermal retention (&lt;45 min transit duration) across West Mumbai corridor. Reduces dispatch latency by 32%.
                  </p>
                </div>

                {/* Slider Track */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#4A4238] uppercase tracking-wider">
                    <span>Min: 5 km</span>
                    <span>Regional Median: 10 km</span>
                    <span>Max: 20 km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="0.5"
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#DED9D1] appearance-none cursor-pointer accent-[#1A1A1A]"
                  />
                  <div className="flex justify-between px-1 text-[10px] text-[#665D52] font-mono">
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                    <span>|</span>
                  </div>
                </div>

                {/* Strict Boundary Toggle */}
                <div className="flex items-center justify-between pt-4 border-t border-[#DED9D1]/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                      Strict Boundary Enforcement
                    </span>
                    <span className="text-xs text-[#665D52] mt-0.5">
                      Reject orders with drop-off addresses outside this exact radius regardless of incentive surge.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStrictBoundary(prev => !prev)}
                    className={`w-11 h-6 ${strictBoundary ? 'bg-[#1A1A1A]' : 'bg-[#DED9D1]'} relative inline-flex items-center cursor-pointer transition-colors p-0.5`}
                  >
                    <div className={`w-5 h-5 bg-white transition-transform ${strictBoundary ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 03: Preferred Zones */}
            <section className="bg-white p-7 border border-[#DED9D1] shadow-xs">
              <div className="flex items-start justify-between pb-5 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[11px] text-[#4A4238] uppercase tracking-widest block mb-1 font-bold">
                    03 / Preferred Zones
                  </span>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">Assigned &amp; Preferred Delivery Clusters</h2>
                  <p className="text-xs text-[#665D52] mt-1">
                    Orders originating in preferred clusters receive +15% dispatch priority queue placement.
                  </p>
                </div>
                <span className="text-[10px] text-[#4A4238] uppercase tracking-widest bg-[#F5F3EF] px-2 py-1 border border-[#DED9D1] font-bold">
                  Geo-Fenced
                </span>
              </div>

              {/* Tags Container */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {preferredAreas.length === 0 ? (
                  <p className="text-xs text-[#665D52] italic">
                    No specific areas restricted. Deliveries will be matched across all reachable clusters.
                  </p>
                ) : (
                  preferredAreas.map(area => (
                  <div key={area} className="inline-flex items-center gap-2 bg-[#F5F3EF] border border-[#DED9D1] px-3.5 py-2 text-[#1A1A1A]">
                    <span className="text-[11px] uppercase tracking-wider font-bold">{area}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(area)}
                      className="text-[#4A4238] hover:text-[#1A1A1A] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )))}
              </div>

              {/* Inline Add Form */}
              <div className="mt-6 pt-5 border-t border-[#DED9D1] flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#4A4238] text-lg">search</span>
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddArea(); } }}
                    placeholder="Enter area name, sector, or 6-digit pin code..."
                    className="w-full bg-[#F5F3EF] border border-[#DED9D1] pl-10 pr-4 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddArea}
                  className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  + Add Area
                </button>
              </div>
            </section>

            {/* SECTION 04: Financial Thresholds */}
            <section className="bg-white p-7 border border-[#DED9D1] shadow-xs">
              <div className="flex items-start justify-between pb-5 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[11px] text-[#4A4238] uppercase tracking-widest block mb-1 font-bold">
                    04 / Financial Thresholds
                  </span>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">Order Value &amp; Earnings Floor</h2>
                  <p className="text-xs text-[#665D52] mt-1">
                    Set remuneration floors per consignment to auto-divert orders below your working threshold.
                  </p>
                </div>
                <span className="text-[10px] text-[#4A4238] uppercase tracking-widest bg-[#F5F3EF] px-2 py-1 border border-[#DED9D1] font-bold">
                  Currency: INR (₹)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Min Payout Field */}
                <div className="flex flex-col bg-[#F5F3EF] p-5 border border-[#DED9D1]">
                  <label className="text-[11px] uppercase text-[#4A4238] tracking-widest mb-2 block font-bold">
                    Minimum Payout Per Delivery
                  </label>
                  <div className="flex items-center gap-2 bg-white border border-[#DED9D1] px-3 py-2">
                    <span className="font-serif text-lg text-[#1A1A1A]">₹</span>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      step="5"
                      value={minPayout}
                      onChange={(e) => setMinPayout(e.target.value)}
                      className="w-full bg-transparent font-serif text-xl text-[#1A1A1A] focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-[#665D52] mt-3 leading-relaxed">
                    Floor per completed drop. Consignments below this will be auto-diverted unless part of a multi-drop batch.
                  </p>
                </div>

                {/* Max Payout Field */}
                <div className="flex flex-col bg-[#F5F3EF] p-5 border border-[#DED9D1]">
                  <label className="text-[11px] uppercase text-[#4A4238] tracking-widest mb-2 block font-bold">
                    Maximum Payout Per Delivery
                  </label>
                  <div className="flex items-center gap-2 bg-white border border-[#DED9D1] px-3 py-2">
                    <span className="font-serif text-lg text-[#1A1A1A]">₹</span>
                    <input
                      type="number"
                      min="200"
                      max="2500"
                      step="25"
                      value={maxPayout}
                      onChange={(e) => setMaxPayout(e.target.value)}
                      className="w-full bg-transparent font-serif text-xl text-[#1A1A1A] focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-[#665D52] mt-3 leading-relaxed">
                    Ceiling cap for single courier liability and cash-on-delivery handling guarantees.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#F5F3EF]/60 border border-[#DED9D1]/50 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#4A4238] text-sm">info</span>
                <span className="text-xs text-[#665D52]">
                  Trip incentive matching calculates base distance rate plus guaranteed peak surge.
                </span>
              </div>
            </section>

            {/* SECTION 05: Equipment & Asset Telemetry */}
            <section className="bg-white p-7 border border-[#DED9D1] shadow-xs">
              <div className="flex items-start justify-between pb-5 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[11px] text-[#4A4238] uppercase tracking-widest block mb-1 font-bold">
                    05 / Equipment &amp; Asset Telemetry
                  </span>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">Delivery Capabilities</h2>
                  <p className="text-xs text-[#665D52] mt-1">
                    Vehicle equipment profile determines matching with insulated crate requirements.
                  </p>
                </div>
                <span className="text-[10px] text-[#1A1A1A] uppercase tracking-widest bg-[#DED9D1]/50 px-2 py-1 border border-[#DED9D1] font-bold">
                  Verified #INS-8812
                </span>
              </div>

              {/* Vehicle Type Checkcards */}
              <div className="mt-6 flex flex-col gap-4">
                <span className="text-[11px] uppercase text-[#4A4238] tracking-widest font-bold">
                  Registered Vehicle Class
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-start gap-3 p-4 bg-[#F5F3EF] border-2 border-[#1A1A1A] cursor-pointer">
                    <input
                      type="radio"
                      name="vehicle_type"
                      checked={vehicleType === 'Two-Wheeler'}
                      onChange={() => setVehicleType('Two-Wheeler')}
                      className="mt-1 accent-[#1A1A1A]"
                    />
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-bold block">
                        Two-Wheeler (Motorcycle / Scooter)
                      </span>
                      <span className="text-xs text-[#665D52] block mt-1">
                        Enclosed thermal rack mounted • Optimal for dense urban corridors.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-[#F5F3EF] border border-[#DED9D1] opacity-60 cursor-not-allowed">
                    <input
                      type="radio"
                      name="vehicle_type"
                      disabled
                      checked={vehicleType === 'Four-Wheeler'}
                      className="mt-1 accent-[#1A1A1A]"
                    />
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-bold block">
                        Four-Wheeler (Eco Van / EV)
                      </span>
                      <span className="text-xs text-[#665D52] block mt-1">
                        Bulk catering transport • Requires secondary Tier-2 certification.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Checkbox capabilities */}
              <div className="mt-6 pt-5 border-t border-[#DED9D1] flex flex-col gap-3">
                <span className="text-[11px] uppercase text-[#4A4238] tracking-widest font-bold">
                  Hardware &amp; Volume Capability
                </span>

                <label className="flex items-center justify-between p-3.5 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#1A1A1A] text-lg">view_stream</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Can carry hot food</span>
                      <span className="text-xs text-[#665D52]">Certified Insulated Thermal Hot-Box active with calibrated temp sensor</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={capabilities.hotFood}
                    onChange={(e) => setCapabilities(prev => ({ ...prev, hotFood: e.target.checked }))}
                    className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#1A1A1A] text-lg">layers</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Can handle multiple orders</span>
                      <span className="text-xs text-[#665D52]">Dual rack capacity up to 6 stacked stainless steel tiffins</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={capabilities.multipleOrders}
                    onChange={(e) => setCapabilities(prev => ({ ...prev, multipleOrders: e.target.checked }))}
                    className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F5F3EF] border border-[#DED9D1] cursor-pointer hover:border-[#1A1A1A] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#4A4238] text-lg">inventory_2</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Large / Heavy catering crates</span>
                      <span className="text-xs text-[#665D52]">Multi-tier containers exceeding 15 kg gross weight</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={capabilities.heavyCrates}
                    onChange={(e) => setCapabilities(prev => ({ ...prev, heavyCrates: e.target.checked }))}
                    className="w-4 h-4 accent-[#1A1A1A] cursor-pointer"
                  />
                </label>
              </div>
            </section>

            {/* SECTION 06: Algorithmic Matching */}
            <section className="bg-white p-7 border border-[#DED9D1] mb-8 shadow-xs">
              <div className="flex items-start justify-between pb-5 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[11px] text-[#4A4238] uppercase tracking-widest block mb-1 font-bold">
                    06 / Algorithmic Matching
                  </span>
                  <h2 className="font-serif text-2xl text-[#1A1A1A]">Delivery Assignment</h2>
                  <p className="text-xs text-[#665D52] mt-1">
                    Control automatic batch acceptance and concurrent consignment limits.
                  </p>
                </div>
                <span className="text-[10px] text-[#4A4238] uppercase tracking-widest bg-[#F5F3EF] px-2 py-1 border border-[#DED9D1] font-bold">
                  Queue Engine
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-5">
                {/* Toggle 1: Auto accept */}
                <div className="flex items-center justify-between p-4 bg-[#F5F3EF] border border-[#DED9D1]">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                      Receive delivery requests automatically
                    </span>
                    <span className="text-xs text-[#665D52] mt-0.5">
                      Direct push to active queue without requiring 30-second manual countdown acceptance.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoAssignment(prev => !prev)}
                    className={`w-11 h-6 ${autoAssignment ? 'bg-[#1A1A1A]' : 'bg-[#DED9D1]'} relative inline-flex items-center cursor-pointer transition-colors p-0.5 shrink-0`}
                  >
                    <div className={`w-5 h-5 bg-white transition-transform ${autoAssignment ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Toggle 2: Multiple concurrent */}
                <div className="flex items-center justify-between p-4 bg-[#F5F3EF] border border-[#DED9D1]">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                      Allow multiple concurrent delivery requests
                    </span>
                    <span className="text-xs text-[#665D52] mt-0.5">
                      Permit the dispatch system to interleave additional pickup stops along your active corridor.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowMultipleOrders(prev => !prev)}
                    className={`w-11 h-6 ${allowMultipleOrders ? 'bg-[#1A1A1A]' : 'bg-[#DED9D1]'} relative inline-flex items-center cursor-pointer transition-colors p-0.5 shrink-0`}
                  >
                    <div className={`w-5 h-5 bg-white transition-transform ${allowMultipleOrders ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Stepper: Maximum active deliveries */}
                <div className="flex items-center justify-between p-4 bg-[#F5F3EF] border border-[#DED9D1]">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                      Maximum active deliveries
                    </span>
                    <span className="text-xs text-[#665D52] mt-0.5">
                      Platform safety cap for motorcycle couriers during lunch peak window.
                    </span>
                  </div>
                  <div className="flex items-center border border-[#DED9D1] bg-white">
                    <button
                      type="button"
                      onClick={() => setMaxActiveDeliveries(prev => Math.max(1, prev - 1))}
                      disabled={maxActiveDeliveries <= 1}
                      className="w-8 h-8 flex items-center justify-center text-[#4A4238] hover:bg-[#DED9D1] cursor-pointer disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-serif text-lg text-[#1A1A1A]">
                      {maxActiveDeliveries}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaxActiveDeliveries(prev => Math.min(3, prev + 1))}
                      disabled={maxActiveDeliveries >= 3}
                      className="w-8 h-8 flex items-center justify-center text-[#4A4238] hover:bg-[#DED9D1] cursor-pointer disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#FBF9F5] border-l-2 border-[#1A1A1A] flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#1A1A1A] text-sm">lock_clock</span>
                  <span className="text-xs text-[#665D52]">
                    <strong className="text-[#1A1A1A] font-semibold">Active Dispatch Lockout:</strong> Modifications will queue and update immediately upon completion of active delivery.
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (4 Columns): Dynamic Summary Matrix & Audit */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            
            {/* CARD 1: Obsidian Dynamic Summary Card */}
            <div className="bg-[#1A1A1A] text-white p-7 flex flex-col justify-between relative overflow-hidden shadow-2xl">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 border border-white/10 rounded-full pointer-events-none" />
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-white/20">
                  <div>
                    <span className="text-[10px] text-[#DED9D1] uppercase tracking-widest block font-bold">
                      Summary Matrix
                    </span>
                    <h3 className="font-serif text-2xl text-white tracking-wide mt-1">Preference Matrix</h3>
                  </div>
                  <span className="text-[10px] text-white/80 uppercase tracking-widest bg-white/10 px-2 py-0.5 font-mono">
                    #{driverId}
                  </span>
                </div>

                {/* Dynamic Key Metrics List */}
                <div className="flex flex-col divide-y divide-white/10 text-xs mt-4 font-sans">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Delivery Radius</span>
                    <span className="text-white uppercase font-bold text-[12px] font-mono">
                      {Number(maxDistanceKm).toFixed(1)} km
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Delivery Types</span>
                    <span className="text-white uppercase font-bold text-[12px] text-right">
                      {activeDeliveryTypesCount} Types Active
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Minimum Payout</span>
                    <span className="text-white uppercase font-bold text-[12px] font-mono">
                      ₹{Number(minPayout).toFixed(2)} / drop
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Maximum Payout</span>
                    <span className="text-white uppercase font-bold text-[12px] font-mono">
                      ₹{Number(maxPayout).toFixed(2)} / drop
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Auto Assignment</span>
                    <span className="text-white uppercase font-bold text-[12px]">
                      {autoAssignment ? 'ACTIVE (Instant)' : 'DISABLED'}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Concurrent Trips</span>
                    <span className="text-white uppercase font-bold text-[12px]">
                      {maxActiveDeliveries} Active Limit
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Vehicle Class</span>
                    <span className="text-white uppercase font-bold text-[12px]">
                      {vehicleType}
                    </span>
                  </div>

                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-white/60 uppercase tracking-wider text-[11px] font-bold">Thermal Hot-Box</span>
                    <span className="text-white uppercase font-bold text-[12px]">
                      {capabilities.hotFood ? 'Active & Calibrated' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-white/20 flex flex-col gap-4">
                <div className="bg-white/10 p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-white font-bold">
                      Preferences Active &amp; Enforced
                    </span>
                  </div>
                  <span className="text-[11px] text-white/80 leading-normal">
                    Matches approximately 84% of incoming lunch/dinner orders in your {Number(maxDistanceKm).toFixed(0)}km cluster.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateMatching}
                  disabled={simulating}
                  className="w-full py-2.5 bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#DED9D1] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className={`material-symbols-outlined text-sm ${simulating ? 'animate-spin' : ''}`}>
                    {simulating ? 'refresh' : 'radar'}
                  </span>
                  <span>{simulating ? 'Matching Orders...' : 'Simulate Dispatch Matching'}</span>
                </button>
              </div>
            </div>

            {/* CARD 2: Dispatch Matching Radar */}
            <div className="bg-white p-6 border border-[#DED9D1] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#DED9D1]">
                <div>
                  <span className="text-[10px] text-[#4A4238] uppercase tracking-widest block font-bold">
                    Live Corridor Telemetry
                  </span>
                  <h4 className="font-serif text-xl text-[#1A1A1A] mt-0.5">Matching Radar</h4>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#1A1A1A]" />
              </div>

              <div className="mt-4 flex flex-col gap-3 font-sans">
                <div className="flex items-center justify-between p-3 bg-[#F5F3EF] border border-[#DED9D1]">
                  <span className="text-xs text-[#665D52]">Available in {Number(maxDistanceKm).toFixed(0)}km Radius</span>
                  <span className="font-serif text-lg text-[#1A1A1A]">{radarMetrics.availableCount} Orders</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F5F3EF] border border-[#DED9D1]">
                  <span className="text-xs text-[#665D52]">Eligible on Preferences</span>
                  <span className="font-serif text-lg text-[#1A1A1A] font-bold">{radarMetrics.eligibleCount} Orders</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F5F3EF] border border-[#DED9D1]">
                  <span className="text-xs text-[#665D52]">Filtered out (Value/Type)</span>
                  <span className="font-serif text-lg text-[#4A4238]">{radarMetrics.filteredCount} Orders</span>
                </div>
              </div>

              {/* Proximity Heatmap Preview SVG */}
              <div className="mt-5 p-4 bg-[#F5F3EF] border border-[#DED9D1] flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] uppercase text-[#4A4238] font-bold">
                  <span>Cluster Density Map</span>
                  <span>West Mumbai Zone</span>
                </div>
                <div className="w-full h-28 relative flex items-center justify-center overflow-hidden bg-[#EFEEEA] border border-[#DED9D1]">
                  <svg className="w-full h-full text-[#1A1A1A]/30" fill="none" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="50" r="45" stroke="currentColor" strokeDasharray="2 3" strokeWidth="0.75" />
                    <circle cx="100" cy="50" r="30" stroke="currentColor" strokeWidth="0.75" />
                    <circle cx="100" cy="50" r="15" stroke="currentColor" strokeWidth="0.5" />
                    <circle cx="100" cy="50" fill="#1a1a1a" r="3" />
                    <circle cx="90" cy="40" fill="#1a1a1a" r="2.5" />
                    <circle cx="95" cy="42" fill="#1a1a1a" r="2" />
                    <circle cx="115" cy="48" fill="#1a1a1a" r="2.5" />
                    <circle cx="108" cy="62" fill="#1a1a1a" r="3" />
                    <circle cx="82" cy="55" fill="#1a1a1a" r="2" />
                    <circle cx="120" cy="35" fill="#87837d" r="1.5" />
                    <line stroke="currentColor" strokeDasharray="1 4" strokeWidth="0.5" x1="100" x2="100" y1="0" y2="100" />
                    <line stroke="currentColor" strokeDasharray="1 4" strokeWidth="0.5" x1="0" x2="200" y1="50" y2="50" />
                  </svg>
                  <span className="absolute bottom-2 right-2 text-[9px] uppercase tracking-wider bg-white/80 px-1 text-[#1A1A1A] font-bold">
                    Hub 12 Centered
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Compliance & Safety Guardrails */}
            <div className="bg-white p-6 border border-[#DED9D1] shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#DED9D1]">
                <span className="material-symbols-outlined text-[#1A1A1A] text-base">verified_user</span>
                <h4 className="font-serif text-xl text-[#1A1A1A]">Compliance Guardrails</h4>
              </div>
              <div className="mt-4 flex flex-col gap-3 text-xs text-[#665D52]">
                <div className="flex items-start gap-2">
                  <span className="text-[#1A1A1A] font-bold text-xs mt-0.5">•</span>
                  <p><strong className="text-[#1A1A1A] font-semibold">Food Safety SLA:</strong> Hot food thermal maintenance (&gt;65°C threshold within 45 min strict target).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#1A1A1A] font-bold text-xs mt-0.5">•</span>
                  <p><strong class="text-[#1A1A1A] font-semibold">Active Order Lockout:</strong> Preferences changes take effect immediately upon completion of active delivery.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#1A1A1A] font-bold text-xs mt-0.5">•</span>
                  <p><strong className="text-[#1A1A1A] font-semibold">Hygiene Standards:</strong> Double-latch thermal crate inspections required every 30 days.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Page Footer Scoped Meta */}
        <div className="mt-12 py-6 border-t border-[#DED9D1] flex flex-col md:flex-row items-center justify-between gap-4 text-[#4A4238] text-[11px] uppercase tracking-wider font-bold">
          <div>
            Driver Dispatch Preferences scoped to JWT principal <span className="text-[#1A1A1A]">{driverName} (#{driverId})</span> • Asia/Kolkata (IST)
          </div>
          <div className="font-mono text-[11px] tracking-wide text-[#1A1A1A]">
            Sync Protocol: Socket.io / MongoDB_Stream_v2
          </div>
        </div>

      </div>
    </div>
  );
}
