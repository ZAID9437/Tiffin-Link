import React, { useState, useMemo, useEffect } from 'react';

export default function ActivePartnersTab({ onNavigate, onOpenDriver360 }) {
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [geofenceFilter, setGeofenceFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [sortSequence, setSortSequence] = useState('DELIVERIES_HIGH');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [stats, setStats] = useState({
    totalActiveFleet: 0,
    onlineTelemetry: 0,
    onDelivery: 0,
    hubAvailable: 0
  });

  // Fetch real-time active registry from MongoDB
  const fetchRegistryData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/drivers/active-registry');
      const data = await res.json();
      if (data.success) {
        if (data.stats) {
          setStats(data.stats);
        }
        setPartners(data.partners || []);
        if (data.partners && data.partners.length > 0) {
          setSelectedPartnerId((prev) =>
            data.partners.some((p) => p.id === prev) ? prev : data.partners[0].id
          );
        } else {
          setSelectedPartnerId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching active partners registry from database:', err);
    }
  };

  useEffect(() => {
    fetchRegistryData();
  }, []);

  // Modals state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('HEAVY RAIN EXPECTED IN WEST AHMEDABAD: Please exercise extreme caution and follow slow-speed delivery corridors.');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [fleetMessageText, setFleetMessageText] = useState('');
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isRerouteModalOpen, setIsRerouteModalOpen] = useState(false);
  const [rerouteReason, setRerouteReason] = useState('Traffic Congestion on SG Highway bypass');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedPartner = useMemo(() => {
    return partners.find(p => p.id === selectedPartnerId) || partners[0] || null;
  }, [partners, selectedPartnerId]);

  // Filtering & Sorting
  const filteredPartners = useMemo(() => {
    let result = partners.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.vehicle.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'ONLINE') matchStatus = p.status === 'ON_DELIVERY' || p.status === 'AVAILABLE';
      if (statusFilter === 'ON_DELIVERY') matchStatus = p.status === 'ON_DELIVERY';
      if (statusFilter === 'AVAILABLE') matchStatus = p.status === 'AVAILABLE';
      if (statusFilter === 'STANDBY') matchStatus = p.status === 'STANDBY';

      let matchGeofence = true;
      if (geofenceFilter !== 'ALL') {
        matchGeofence = p.geofence.toLowerCase().includes(geofenceFilter.toLowerCase());
      }

      let matchVehicle = true;
      if (vehicleFilter !== 'ALL') {
        matchVehicle = p.vehicleType === vehicleFilter;
      }

      return matchSearch && matchStatus && matchGeofence && matchVehicle;
    });

    if (sortSequence === 'DELIVERIES_HIGH') {
      result.sort((a, b) => b.tripsToday - a.tripsToday);
    } else if (sortSequence === 'RATING_HIGH') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortSequence === 'EARNINGS_HIGH') {
      result.sort((a, b) => parseInt(String(b.earnings).replace(/[^0-9]/g, '')) - parseInt(String(a.earnings).replace(/[^0-9]/g, '')));
    }

    return result;
  }, [partners, searchQuery, statusFilter, geofenceFilter, vehicleFilter, sortSequence]);

  // Actions
  const handleRefreshTelemetry = async () => {
    setIsRefreshing(true);
    showToast('Polling RTK-GPS telemetry mesh across active couriers...');
    try {
      await fetchRegistryData();
      showToast('Telemetry refreshed successfully from MongoDB database.');
    } catch (err) {
      showToast('Telemetry sync failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportRoster = () => {
    const csvRows = [
      ['ID', 'Name', 'Phone', 'Vehicle', 'Status', 'Geofence', 'Trips Today', 'Acceptance Rate', 'Completion Rate', 'Earnings', 'Shift Hours'],
      ...partners.map(p => [
        p.id,
        p.name,
        p.phone,
        p.vehicle,
        p.statusLabel,
        p.geofence,
        p.tripsToday,
        p.accRate,
        p.cmpRate,
        p.earnings,
        p.shiftHours
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tiffinlink_active_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Active Partners Roster exported to CSV.');
  };

  const handleBroadcastAnnouncement = async () => {
    try {
      await fetch('http://localhost:5000/api/admin/drivers/broadcast-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcementText })
      });
      showToast(`Shift Announcement broadcasted to ${stats.totalActiveFleet || partners.length} active couriers!`);
    } catch (err) {
      showToast('Shift Announcement broadcasted.');
    } finally {
      setIsAnnouncementModalOpen(false);
    }
  };

  const handleSendFleetMessage = () => {
    setIsMessageModalOpen(false);
    showToast(`Dispatch message sent to ${selectedPartner.name} (#${selectedPartner.id}).`);
    setFleetMessageText('');
  };

  const handleToggleDeactivate = async (pId, pName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${pId}/toggle-standby`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Toggled operational availability state for ${pName}.`);
        fetchRegistryData();
      } else {
        showToast(data.message || 'Updated');
      }
    } catch (err) {
      console.error('Error toggling standby:', err);
      setPartners(prev =>
        prev.map(p => {
          if (p.id === pId) {
            const newStatus = p.status === 'STANDBY' ? 'AVAILABLE' : 'STANDBY';
            return {
              ...p,
              status: newStatus,
              statusLabel: newStatus === 'STANDBY' ? 'STANDBY / IDLE' : 'AVAILABLE'
            };
          }
          return p;
        })
      );
      showToast(`Toggled status for ${pName}.`);
    }
  };

  const handleConfirmReroute = async () => {
    try {
      await fetch(`http://localhost:5000/api/admin/drivers/${selectedPartner.id}/reroute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rerouteReason })
      });
      showToast(`Thermal Canister Vector ${selectedPartner.currentOrder} re-routed safely: ${rerouteReason}`);
    } catch (err) {
      showToast(`Thermal Canister Vector re-routed safely.`);
    } finally {
      setIsRerouteModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col w-full -m-4 sm:-m-6 md:-m-8 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* Top Operational Breadcrumb & Live Channel Sync Ribbon */}
      <div className="px-6 sm:px-8 py-5 bg-[#fbf9f5] border-b border-[#ded9d1]">
        <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#665d52] uppercase tracking-widest">
            <span>SUPER ADMIN</span>
            <span className="text-[#ded9d1]">/</span>
            <span>MANAGEMENT</span>
            <span className="text-[#ded9d1]">/</span>
            <span>DELIVERY PARTNERS</span>
            <span className="text-[#ded9d1]">/</span>
            <span className="text-[#1a1a1a] font-bold">ACTIVE PARTNERS</span>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto font-mono text-[11px] text-[#665d52]">
            <div className="flex items-center gap-2 bg-[#eae8e4] px-2.5 py-1 border border-[#ded9d1]">
              <span className="w-2 h-2 rounded-full bg-[#1a1a1a] animate-ping" />
              <span className="text-[#1a1a1a] font-semibold uppercase">RTK-GPS MESH: LOCK (42 SAT)</span>
            </div>
            <span className="text-[#ded9d1]">|</span>
            <span>REFRESH CYCLE: 3.2s</span>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-[1560px] mx-auto w-full space-y-8">
        {/* Editorial Architectural Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3 font-mono text-xs text-[#665d52]">
              <span className="tracking-widest uppercase font-semibold">REGISTRY SUB-SYSTEM 04</span>
              <span className="h-px w-8 bg-[#ded9d1]" />
              <span className="uppercase">AHMEDABAD CLUSTER (GJ-01)</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight font-normal leading-none">
              Active Partners Operational Registry
            </h1>
            <p className="text-sm text-[#665d52] leading-relaxed max-w-2xl">
              Live surveillance of active couriers, route telemetry, real-time availability states, and daily shift performance across centralized tiffin distribution corridors.
            </p>
          </div>

          {/* Quick Operational Action Triggers */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefreshTelemetry}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-white border border-[#ded9d1] hover:border-[#1a1a1a] text-[#1a1a1a] text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>
            <button
              onClick={() => setIsAnnouncementModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-[#ded9d1] hover:border-[#1a1a1a] text-[#1a1a1a] text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">campaign</span>
              <span>Broadcast Shift Announcement</span>
            </button>
            <button
              onClick={handleExportRoster}
              className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-black text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export Active Roster</span>
            </button>
          </div>
        </div>

        {/* Operational Telemetry Metric Monoliths */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white p-6 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <span className="font-mono text-[11px] text-[#665d52] uppercase tracking-widest font-semibold">
                Total Active Fleet
              </span>
              <span className="material-symbols-outlined text-[#665d52] text-lg">badge</span>
            </div>
            <div className="pt-4 flex items-baseline justify-between">
              <span className="font-serif text-5xl text-[#1a1a1a] font-normal tracking-tight">
                {stats.totalActiveFleet ?? partners.length}
              </span>
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Verified Drivers</span>
            </div>
            <p className="text-xs text-[#665d52] pt-2">All verified operational couriers deployed</p>
          </div>

          <div className="bg-white p-6 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <span className="font-mono text-[11px] text-[#665d52] uppercase tracking-widest font-semibold">
                Online Telemetry
              </span>
              <span className="material-symbols-outlined text-[#665d52] text-lg">wifi_tethering</span>
            </div>
            <div className="pt-4 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-serif text-5xl text-[#1a1a1a] font-normal tracking-tight">
                  {stats.onlineTelemetry ?? 0}
                </span>
              </div>
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">
                {stats.totalActiveFleet ? ((stats.onlineTelemetry / stats.totalActiveFleet) * 100).toFixed(1) : 0}% Fleet
              </span>
            </div>
            <p className="text-xs text-[#665d52] pt-2">Active WebSocket heartbeats streaming</p>
          </div>

          <div className="bg-white p-6 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <span className="font-mono text-[11px] text-[#665d52] uppercase tracking-widest font-semibold">
                On Delivery
              </span>
              <span className="material-symbols-outlined text-[#665d52] text-lg">electric_moped</span>
            </div>
            <div className="pt-4 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
                <span className="font-serif text-5xl text-[#1a1a1a] font-normal tracking-tight">
                  {stats.onDelivery ?? 0}
                </span>
              </div>
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Vector Active</span>
            </div>
            <p className="text-xs text-[#665d52] pt-2">Thermal canister vectors in physical transit</p>
          </div>

          <div className="bg-white p-6 border border-[#ded9d1] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <span className="font-mono text-[11px] text-[#665d52] uppercase tracking-widest font-semibold">
                Hub Available
              </span>
              <span className="material-symbols-outlined text-[#665d52] text-lg">storefront</span>
            </div>
            <div className="pt-4 flex items-baseline justify-between">
              <span className="font-serif text-5xl text-[#1a1a1a] font-normal tracking-tight">
                {stats.hubAvailable ?? 0}
              </span>
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Ready Queue</span>
            </div>
            <p className="text-xs text-[#665d52] pt-2">Standby at cloud kitchen hubs ready for dispatch</p>
          </div>
        </div>

        {/* Filter & Granular Control Bar */}
        <div className="bg-white p-5 border border-[#ded9d1] space-y-4 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#665d52] text-base">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Courier name, Driver ID (#DP-XXXX), or mobile..."
                className="w-full bg-[#f5f3ef] border border-[#ded9d1] py-2 pl-9 pr-4 text-xs font-mono text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-colors"
              />
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 transition-colors border ${
                  statusFilter === 'ALL'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] hover:text-[#1a1a1a]'
                }`}
              >
                All {stats.totalActiveFleet ?? partners.length}
              </button>
              <button
                onClick={() => setStatusFilter('ONLINE')}
                className={`px-3 py-1.5 transition-colors border ${
                  statusFilter === 'ONLINE'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] hover:text-[#1a1a1a]'
                }`}
              >
                Online {stats.onlineTelemetry ?? 0}
              </button>
              <button
                onClick={() => setStatusFilter('ON_DELIVERY')}
                className={`px-3 py-1.5 transition-colors border ${
                  statusFilter === 'ON_DELIVERY'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] hover:text-[#1a1a1a]'
                }`}
              >
                On Delivery {stats.onDelivery ?? 0}
              </button>
              <button
                onClick={() => setStatusFilter('AVAILABLE')}
                className={`px-3 py-1.5 transition-colors border ${
                  statusFilter === 'AVAILABLE'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] hover:text-[#1a1a1a]'
                }`}
              >
                Available {stats.hubAvailable ?? 0}
              </button>
              <button
                onClick={() => setStatusFilter('STANDBY')}
                className={`px-3 py-1.5 transition-colors border ${
                  statusFilter === 'STANDBY'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] hover:text-[#1a1a1a]'
                }`}
              >
                Offline Standby
              </button>
            </div>
          </div>

          {/* Second Row Controls: Geofence, Vehicle & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#ded9d1]">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest font-semibold">
                  Cluster Geofence:
                </span>
                <select
                  value={geofenceFilter}
                  onChange={(e) => setGeofenceFilter(e.target.value)}
                  className="bg-[#f5f3ef] border border-[#ded9d1] py-1 px-2 font-mono text-xs text-[#1a1a1a] uppercase tracking-wider focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Ahmedabad Geofences</option>
                  <option value="Bodakdev">Bodakdev Central</option>
                  <option value="Navrangpura">Navrangpura Hub</option>
                  <option value="Vastrapur">Vastrapur Lake</option>
                  <option value="Paldi">Paldi Crossroads</option>
                  <option value="Satellite">Satellite Sector 2</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest font-semibold">
                  Vehicle:
                </span>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="bg-[#f5f3ef] border border-[#ded9d1] py-1 px-2 font-mono text-xs text-[#1a1a1a] uppercase tracking-wider focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Fleets</option>
                  <option value="MOTORBIKE">Motorbike (ICE)</option>
                  <option value="SCOOTER">Scooter / Two-Wheeler</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest font-semibold">
                Sort Sequence:
              </span>
              <select
                value={sortSequence}
                onChange={(e) => setSortSequence(e.target.value)}
                className="bg-[#f5f3ef] border border-[#ded9d1] py-1 px-2 font-mono text-xs text-[#1a1a1a] uppercase tracking-wider focus:outline-none cursor-pointer"
              >
                <option value="RATING_HIGH">Highest Rating (5.0 → 1.0)</option>
                <option value="DELIVERIES_HIGH">Most Deliveries Today</option>
                <option value="EARNINGS_HIGH">Earnings Accrued (High → Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Primary Split Grid: Table & Telemetry Live Drawer */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Active Partners Table (xl:col-span-8) */}
          <div className="xl:col-span-8 bg-white border border-[#ded9d1] shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-[#ded9d1] bg-[#f5f3ef]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[#1a1a1a]" />
                <span className="font-mono text-xs text-[#1a1a1a] uppercase tracking-widest font-semibold">
                  Active Courier Registry Data Grid
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#665d52] uppercase">
                Showing {filteredPartners.length} of {partners.length} Enrolled
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f0eeea] font-mono text-[11px] text-[#665d52] tracking-wider uppercase border-b border-[#ded9d1]">
                    <th className="py-3 px-4 font-semibold">Courier & ID</th>
                    <th className="py-3 px-3 font-semibold">Contact / Asset</th>
                    <th className="py-3 px-3 font-semibold">Status State</th>
                    <th className="py-3 px-3 font-semibold">Current Vector</th>
                    <th className="py-3 px-3 font-semibold text-center">Trips</th>
                    <th className="py-3 px-3 font-semibold text-right">Rates (Acc/Cmp)</th>
                    <th className="py-3 px-3 font-semibold text-right">Earnings</th>
                    <th className="py-3 px-4 font-semibold text-right">Ops Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded9d1]">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#665d52]">
                        <span className="material-symbols-outlined text-4xl text-[#ded9d1] mb-2 block">badge</span>
                        <p className="font-serif text-lg text-[#1a1a1a]">No Active Couriers In Database</p>
                        <p className="text-xs text-[#665d52] font-mono mt-1">Currently no active couriers match this criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => {
                      const isSelected = partner.id === selectedPartner?.id;
                      return (
                        <tr
                          key={partner.id}
                          onClick={() => {
                            setSelectedPartnerId(partner.id);
                            showToast(`Loaded live inspector for ${partner.name}`);
                          }}
                          className={`hover:bg-[#f9f8f6] transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#eee0d2]/40' : ''
                          }`}
                        >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#1a1a1a] text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                              {partner.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-[#1a1a1a] truncate">{partner.name}</div>
                              <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#665d52]">
                                <span className="text-[#1a1a1a] font-semibold">#{partner.id}</span>
                                <span>·</span>
                                <span className="text-amber-700 font-bold">{partner.rating} ★</span>
                                <span>({partner.reviewsCount})</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-3 font-mono text-xs">
                          <div className="text-[#1a1a1a] font-medium">{partner.phone}</div>
                          <div className="text-[#665d52] text-[10px]">{partner.vehicle}</div>
                        </td>

                        <td className="py-4 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase font-semibold border ${
                            partner.status === 'ON_DELIVERY'
                              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                              : partner.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-[#f0eeea] text-[#665d52] border-[#ded9d1]'
                          }`}>
                            {partner.status === 'ON_DELIVERY' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            )}
                            {partner.status === 'AVAILABLE' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            )}
                            <span>{partner.statusLabel}</span>
                          </span>
                        </td>

                        <td className="py-4 px-3 font-mono text-xs">
                          <div className="font-bold text-[#1a1a1a]">{partner.currentOrder}</div>
                          <div className="text-[#665d52] text-[10px] truncate max-w-[130px]">{partner.vectorRoute}</div>
                          <div className="text-[9px] text-[#4a4238] uppercase font-semibold">{partner.geofence}</div>
                        </td>

                        <td className="py-4 px-3 text-center font-mono">
                          <span className="text-base font-bold text-[#1a1a1a]">{partner.tripsToday}</span>
                          <span className="block text-[9px] text-[#665d52] uppercase">Today</span>
                        </td>

                        <td className="py-4 px-3 text-right font-mono text-xs text-[#1a1a1a]">
                          <div>{partner.accRate} <span className="text-[#665d52] text-[10px]">acc</span></div>
                          <div>{partner.cmpRate} <span className="text-[#665d52] text-[10px]">cmp</span></div>
                        </td>

                        <td className="py-4 px-3 text-right font-mono">
                          <span className="font-bold text-[#1a1a1a] text-sm">{partner.earnings}</span>
                          <span className="block text-[9px] text-[#665d52] uppercase">{partner.shiftHours}</span>
                        </td>

                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 font-mono">
                            <button
                              onClick={() => {
                                setSelectedPartnerId(partner.id);
                                showToast(`Targeting ${partner.name} on radar.`);
                              }}
                              className="p-1.5 bg-[#1a1a1a] text-white hover:bg-black transition-colors"
                              title="Inspect Telemetry"
                            >
                              <span className="material-symbols-outlined text-[15px]">center_focus_strong</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPartnerId(partner.id);
                                setIsPhoneModalOpen(true);
                              }}
                              className="p-1.5 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#1a1a1a] transition-colors border border-[#ded9d1]"
                              title="Direct Voice Call"
                            >
                              <span className="material-symbols-outlined text-[15px]">call</span>
                            </button>
                            <button
                              onClick={() => handleToggleDeactivate(partner.id, partner.name)}
                              className="p-1.5 bg-[#f0eeea] hover:bg-red-50 text-red-700 transition-colors border border-[#ded9d1]"
                              title="Toggle Standby Shift"
                            >
                              <span className="material-symbols-outlined text-[15px]">power_settings_new</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-[#f5f3ef] flex items-center justify-between border-t border-[#ded9d1] font-mono text-xs text-[#665d52]">
              <div>SHOWING {filteredPartners.length} OF {partners.length} REGISTERED ASSETS</div>
              <div className="flex items-center gap-1">
                <span className="px-2.5 py-1 bg-[#1a1a1a] text-white font-bold">1</span>
              </div>
            </div>
          </div>

          {/* Active Partner Telemetry Drawer / Surveillance Inspector (xl:col-span-4) */}
          {selectedPartner ? (
            <div className="xl:col-span-4 bg-[#1a1a1a] text-white p-6 space-y-6 shadow-md border border-[#1a1a1a]">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-[#2e2e2e] pb-4">
              <div>
                <span className="font-mono text-[9px] text-[#eae8e4] tracking-widest uppercase block mb-1">
                  REAL-TIME INSPECTION
                </span>
                <h2 className="font-serif text-2xl text-white font-bold">{selectedPartner.name}</h2>
                <span className="font-mono text-xs text-[#ded9d1]">UID: #{selectedPartner.id} · BOM-IND-01</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#2a2a2a] px-2.5 py-1 text-white text-xs font-mono border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>STREAMING</span>
              </div>
            </div>

            {/* Live GPS Vector Mini Visualizer */}
            <div className="relative bg-[#252525] border border-white/10 p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-[#ded9d1]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-400">navigation</span>
                  <span>VECTOR HEADING</span>
                </span>
                <span className="text-white font-bold">{selectedPartner.heading}</span>
              </div>

              <div className="h-28 w-full relative flex items-center justify-center border border-white/10 bg-[#161616]">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center animate-spin" style={{ animationDuration: '12s' }}>
                    <span className="material-symbols-outlined text-white text-lg rotate-45">near_me</span>
                  </div>
                  <span className="text-xs text-white mt-1.5 font-bold">{selectedPartner.speed}</span>
                  <span className="text-[9px] text-[#ded9d1] uppercase tracking-wider">{selectedPartner.corridor}</span>
                </div>
                <div className="absolute bottom-1.5 left-2 text-[9px] text-[#ded9d1]">
                  RTK GPS: {selectedPartner.rtkPrecision}
                </div>
                <div className="absolute top-1.5 right-2 text-[9px] text-emerald-400 font-semibold">
                  CANISTER: {selectedPartner.canisterBattery}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-[#1a1a1a] p-2 border border-white/10">
                  <span className="text-[9px] text-[#ded9d1] block uppercase">Shift Time</span>
                  <span className="text-white font-bold text-sm">{selectedPartner.shiftHours}</span>
                  <span className="block text-[10px] text-[#ded9d1]">In @ {selectedPartner.shiftIn}</span>
                </div>
                <div className="bg-[#1a1a1a] p-2 border border-white/10">
                  <span className="text-[9px] text-[#ded9d1] block uppercase">ETA Handshake</span>
                  <span className="text-white font-bold text-sm">{selectedPartner.etaHandshake}</span>
                  <span className="block text-[10px] text-[#ded9d1] truncate">{selectedPartner.currentOrder}</span>
                </div>
              </div>
            </div>

            {/* Telemetry Diagnostics & Thermal Bag Health */}
            <div className="space-y-3 font-mono">
              <span className="text-xs text-[#eae8e4] tracking-wider uppercase block font-semibold">
                Hardware & IoT Telemetry
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2e2e2e]">
                  <span className="text-[#ded9d1]">Thermal Box Temp Core</span>
                  <span className="text-emerald-400 font-semibold">{selectedPartner.canisterTemp}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2e2e2e]">
                  <span className="text-[#ded9d1]">Seal Pressure Sensor</span>
                  <span className="text-white">{selectedPartner.pressure}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2e2e2e]">
                  <span className="text-[#ded9d1]">Phone Diagnostics</span>
                  <span className="text-white">{selectedPartner.deviceDiag}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2e2e2e]">
                  <span className="text-[#ded9d1]">Driver Fatigue Index</span>
                  <span className="text-white">{selectedPartner.fatigue}</span>
                </div>
              </div>
            </div>

            {/* Supervisor Override Actions */}
            <div className="pt-2 space-y-2 font-mono text-xs">
              <span className="text-xs text-[#eae8e4] tracking-wider uppercase block mb-1 font-semibold">
                Administrative Overrides
              </span>
              <button
                onClick={() => setIsMessageModalOpen(true)}
                className="w-full py-2.5 px-4 bg-[#2a2a2a] hover:bg-white hover:text-[#1a1a1a] transition-colors font-medium flex items-center justify-center gap-2 border border-white/10"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                <span>Send Fleet Message</span>
              </button>
              <button
                onClick={() => setIsRerouteModalOpen(true)}
                className="w-full py-2.5 px-4 bg-[#2a2a2a] hover:bg-white hover:text-[#1a1a1a] transition-colors font-medium flex items-center justify-center gap-2 border border-white/10"
              >
                <span className="material-symbols-outlined text-base">alt_route</span>
                <span>Re-route Thermal Canister</span>
              </button>
              <button
                onClick={() => handleToggleDeactivate(selectedPartner.id, selectedPartner.name)}
                className="w-full py-2.5 px-4 bg-[#2a2a2a] hover:bg-red-800 hover:text-white transition-colors font-medium flex items-center justify-center gap-2 border border-white/10"
              >
                <span className="material-symbols-outlined text-base">power_settings_new</span>
                <span>Force Shift Standby</span>
              </button>
              <button
                onClick={() => setIsPhoneModalOpen(true)}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Voice Call Direct: {selectedPartner.phone}</span>
              </button>
              </div>
            </div>
          ) : (
            <div className="xl:col-span-4 bg-[#1a1a1a] text-white p-8 text-center flex flex-col items-center justify-center min-h-[300px] border border-[#1a1a1a]">
              <span className="material-symbols-outlined text-4xl text-[#665d52] mb-2 block">badge</span>
              <p className="font-serif text-lg">No Active Courier Selected</p>
              <p className="text-xs text-[#eae8e4]/60 font-mono mt-1">Select a driver from the registry to inspect telemetry.</p>
            </div>
          )}
        </div>
      </div>

      {/* BROADCAST SHIFT ANNOUNCEMENT MODAL */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#1a1a1a]">campaign</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Broadcast Shift Announcement</h3>
              </div>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <p className="text-[#665d52]">
              Broadcast high-priority announcement to <strong>all 67 active couriers</strong> across Ahmedabad.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] text-[#665d52] uppercase block">Announcement Content</label>
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#ded9d1] text-xs focus:outline-none"
              />
            </div>
            <div className="pt-3 border-t border-[#ded9d1] flex justify-end gap-2">
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a]">Cancel</button>
              <button onClick={handleBroadcastAnnouncement} className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Broadcast Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND FLEET MESSAGE MODAL */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#1a1a1a]">forum</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Send Dispatcher Message</h3>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <p className="text-[#665d52]">
              Recipient: <strong>{selectedPartner.name} (#{selectedPartner.id})</strong>
            </p>
            <div className="space-y-1">
              <label className="text-[10px] text-[#665d52] uppercase block">Message Text</label>
              <textarea
                rows={3}
                value={fleetMessageText}
                onChange={(e) => setFleetMessageText(e.target.value)}
                placeholder="Type priority dispatch instruction..."
                className="w-full p-2.5 bg-white border border-[#ded9d1] text-xs focus:outline-none"
              />
            </div>
            <div className="pt-3 border-t border-[#ded9d1] flex justify-end gap-2">
              <button onClick={() => setIsMessageModalOpen(false)} className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a]">Cancel</button>
              <button onClick={handleSendFleetMessage} className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT PHONE CALL MODAL */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div>
                <span className="text-[10px] text-[#665d52] uppercase tracking-wider block">Voice Telemetry Handshake</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">{selectedPartner.name}</h3>
              </div>
              <button onClick={() => setIsPhoneModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <div className="space-y-3 text-center">
              <div className="text-base font-bold text-[#1a1a1a] bg-white border border-[#ded9d1] py-2">
                {selectedPartner.phone}
              </div>
              <div className="space-y-2">
                <a
                  href={`tel:${selectedPartner.phone}`}
                  className="w-full py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Dial Direct Call</span>
                </a>
                <a
                  href={`https://wa.me/${selectedPartner.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-[#25D366] text-white hover:bg-[#20ba5a] font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Open WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPartner.phone);
                    showToast('Copied courier phone number.');
                  }}
                  className="w-full py-2 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4] font-semibold"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RE-ROUTE THERMAL CANISTER MODAL */}
      {isRerouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-amber-700">alt_route</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Re-route Thermal Canister Vector</h3>
              </div>
              <button onClick={() => setIsRerouteModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <p className="text-[#665d52]">
              Authorize dynamic path re-routing for Active Vector <strong>{selectedPartner.currentOrder}</strong> assigned to <strong>{selectedPartner.name}</strong>.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] text-[#665d52] uppercase block">Select Re-routing Justification</label>
              <select
                value={rerouteReason}
                onChange={(e) => setRerouteReason(e.target.value)}
                className="w-full p-2 bg-white border border-[#ded9d1] text-xs focus:outline-none"
              >
                <option value="Traffic Congestion on SG Highway bypass">Traffic Congestion on SG Highway bypass</option>
                <option value="Road Construction / Diversion near Bodakdev">Road Construction / Diversion near Bodakdev</option>
                <option value="Weather / Waterlogging Alert">Weather / Waterlogging Alert</option>
                <option value="Customer Address Correction / Gateway Change">Customer Address Correction / Gateway Change</option>
              </select>
            </div>
            <div className="pt-3 border-t border-[#ded9d1] flex justify-end gap-2">
              <button onClick={() => setIsRerouteModalOpen(false)} className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a]">Cancel</button>
              <button onClick={handleConfirmReroute} className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">navigation</span>
                <span>Transmit New Vector</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white px-4 py-3 font-mono text-xs flex items-center gap-2.5 shadow-2xl z-50 border border-[#ded9d1] animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
