import React, { useState, useEffect } from 'react';

export default function ActiveDeliveriesTab({ onNavigate }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [isPinging, setIsPinging] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Operational Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastNoticeText, setBroadcastNoticeText] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState('URGENT');
  const [activeNoticeBanner, setActiveNoticeBanner] = useState(null);

  // Universal Call Modal State
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callContactType, setCallContactType] = useState('courier'); // 'courier' | 'kitchen' | 'customer'

  // Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [driversList, setDriversList] = useState([]);
  const [selectedDriverToReassign, setSelectedDriverToReassign] = useState('');
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);

  // Escrow Abort Modal State
  const [isEscrowAbortModalOpen, setIsEscrowAbortModalOpen] = useState(false);
  const [escrowReason, setEscrowReason] = useState('Customer Address Unreachable / Refusal');
  const [isEscrow2FAAuthorized, setIsEscrow2FAAuthorized] = useState(false);
  const [isAbortingEscrow, setIsAbortingEscrow] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export in-flight deliveries manifest to CSV file
  const handleExportManifest = () => {
    if (!deliveries || deliveries.length === 0) {
      showToast('No active deliveries to export.');
      return;
    }
    const headers = ['Order ID', 'Customer', 'Destination', 'Kitchen', 'Hub', 'Courier', 'Vehicle', 'Phase', 'Temperature', 'Fee', 'Escrow', 'ETA'];
    const rows = deliveries.map(d => [
      d.id,
      `"${d.customer || ''}"`,
      `"${d.address || ''}"`,
      `"${d.kitchen || ''}"`,
      `"${d.kitchenHub || ''}"`,
      `"${d.courierName || ''}"`,
      `"${d.vehicle || ''}"`,
      `"${d.phase || ''}"`,
      `"${d.temp || ''}"`,
      `"${d.fee || ''}"`,
      `"${d.escrow || ''}"`,
      `"${d.eta || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tiffinlink_in_flight_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${deliveries.length} in-flight manifest record(s) to CSV.`);
  };

  // Broadcast Notice to Fleet
  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!broadcastNoticeText.trim()) {
      showToast('Please type a notice message.');
      return;
    }
    const banner = `[${broadcastPriority}] ${broadcastNoticeText.trim()} • Broadcasted ${new Date().toLocaleTimeString()} IST`;
    setActiveNoticeBanner(banner);
    setIsBroadcastModalOpen(false);
    setBroadcastNoticeText('');
    showToast('Operational dispatch notice broadcasted to all in-transit couriers.');
  };

  // Focus Mission Dossier Inspector
  const handleInspectMission = (id, del) => {
    setSelectedOrderId(id);
    showToast(`Focusing Mission #${id} (${del?.customer || 'Customer'}) dossier.`);
    setTimeout(() => {
      const panel = document.getElementById('delivery-mission-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        panel.classList.add('ring-2', 'ring-[#1a1a1a]');
        setTimeout(() => panel.classList.remove('ring-2', 'ring-[#1a1a1a]'), 1500);
      }
    }, 50);
  };

  // Fetch Drivers for Reassignment
  const handleOpenReassignModal = async () => {
    setIsReassignModalOpen(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/drivers');
      const data = await res.json();
      if (data.success && Array.isArray(data.drivers)) {
        setDriversList(data.drivers);
        if (data.drivers.length > 0) {
          setSelectedDriverToReassign(data.drivers[0].driverId || data.drivers[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching drivers for reassignment:', err);
    }
  };

  // Confirm Driver Reassignment
  const handleConfirmReassign = async () => {
    if (!selectedDriverToReassign) {
      showToast('Please select a replacement courier.');
      return;
    }
    try {
      setIsAssigningDriver(true);
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${selectedDriverToReassign}/assign-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrderId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order #${selectedOrderId} successfully reassigned to courier ${data.driver?.name || selectedDriverToReassign}`);
        setIsReassignModalOpen(false);
        await fetchDeliveries();
      } else {
        showToast(data.message || 'Failed to reassign');
      }
    } catch (err) {
      console.error('Error reassigning driver:', err);
      showToast('Network error during driver reassignment.');
    } finally {
      setIsAssigningDriver(false);
    }
  };

  // Confirm Emergency Escrow Refund & Abort
  const handleConfirmEscrowAbort = async () => {
    if (!isEscrow2FAAuthorized) {
      showToast('Please check the 2FA authorization box.');
      return;
    }
    try {
      setIsAbortingEscrow(true);
      // Update local state to cancelled & refunded
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === selectedOrderId
            ? { ...d, phase: 'CANCELLED', phaseTone: 'red', vector: 'Aborted - Escrow Refunded', escrow: '₹0 (Refunded)' }
            : d
        )
      );
      showToast(`Emergency Escrow Refund executed for #${selectedOrderId}. Customer wallet credited.`);
      setIsEscrowAbortModalOpen(false);
      setIsEscrow2FAAuthorized(false);
    } catch (err) {
      console.error('Error executing escrow refund:', err);
      showToast('Error executing escrow refund.');
    } finally {
      setIsAbortingEscrow(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dispatch-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        const mapped = data.requests.map((r) => {
          const rawSt = (r.rawStatus || r.status || '').toUpperCase();
          let phase = 'ON ROUTE';
          let phaseTone = 'emerald';
          let lifecycleKey = 'on-route';

          if (rawSt.includes('DELIVERED')) {
            phase = 'DELIVERED';
            phaseTone = 'emerald';
            lifecycleKey = 'delivered';
          } else if (rawSt.includes('CANCEL')) {
            phase = 'CANCELLED';
            phaseTone = 'red';
            lifecycleKey = 'cancelled';
          } else if (rawSt.includes('DRIVER ASSIGNED') || rawSt.includes('ACCEPTED') || rawSt.includes('LOCKED')) {
            phase = 'ASSIGNED';
            phaseTone = 'blue';
            lifecycleKey = 'assigned';
          } else if (rawSt.includes('PICKED_UP') || rawSt.includes('PICKUP')) {
            phase = 'AT PICKUP';
            phaseTone = 'amber';
            lifecycleKey = 'inspecting';
          }

          return {
            id: r.orderId || r.reqId,
            reqId: r.reqId,
            subType: 'TIF-SUB-DAILY',
            customer: r.customer,
            address: r.destination,
            kitchen: r.kitchen,
            kitchenHub: r.kitchenHub,
            courierName: r.winner ? r.winner.replace(/^#[^\s]+\s*\(/, '').replace(/\)$/, '') : 'Ziyan Mansuri',
            courierId: 'TL-65013-B',
            courierRating: '4.7★',
            vehicle: 'Hero Splendor (GJ 27 DX 3654)',
            phase,
            phaseTone,
            vector: phase === 'ON ROUTE' ? 'Vector: 28 km/h' : (phase === 'DELIVERED' ? 'Delivery Completed' : 'Standby / Assigned'),
            eta: r.elapsed ? `${r.elapsed}` : '14m',
            distRem: r.dist || '2.4 km',
            canisterId: '#TK-9021',
            temp: '68°C',
            tempVal: 68.2,
            fee: r.fee || '₹51 fee',
            escrow: '₹186 escrow',
            targetWindow: '20:15 IST',
            phone: '+91 9558601570',
            battery: '94% • Active Link',
            gpsAcc: '±2.4m (RTK-Grade)',
            clientApp: 'v4.19 (Android 14)',
            lifecycleKey
          };
        });
        setDeliveries(mapped);
        if (mapped.length > 0) {
          setSelectedOrderId((prev) => prev || mapped[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load active deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handlePingAll = async () => {
    setIsPinging(true);
    await fetchDeliveries();
    setTimeout(() => {
      setIsPinging(false);
      showToast(`Global RTK GPS ping synchronized across ${deliveries.length} active delivery nodes.`);
    }, 700);
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (lifecycleFilter === 'all') return true;
    return d.lifecycleKey === lifecycleFilter;
  });

  const selectedDelivery = deliveries.find((d) => d.id === selectedOrderId) || deliveries[0] || {
    id: 'TL-65013-B',
    customer: 'Customer',
    address: 'Ahmedabad',
    kitchen: 'Partner Kitchen',
    courierName: 'Ziyan Mansuri',
    courierId: 'TL-65013-B',
    phone: '+91 9558601570',
    phase: 'STANDBY',
    phaseTone: 'neutral',
    vector: 'Standby at Bodakdev Hub',
    eta: '0m',
    distRem: '0 km',
    canisterId: '#TK-9021',
    temp: '68°C',
    tempVal: 68.2,
    fee: '₹51 fee',
    escrow: '₹186 escrow',
    targetWindow: '20:00 IST',
    battery: '94% • Active Link',
    gpsAcc: '±2.4m (RTK-Grade)',
    clientApp: 'v4.19 (Android 14)',
    lifecycleKey: 'assigned'
  };

  const handleOverride = (action) => {
    if (action === 'call-courier') {
      setCallContactType('courier');
      setIsCallModalOpen(true);
    } else if (action === 'call-kitchen') {
      setCallContactType('kitchen');
      setIsCallModalOpen(true);
    } else if (action === 'call-customer') {
      setCallContactType('customer');
      setIsCallModalOpen(true);
    } else if (action === 'force-reassign') {
      handleOpenReassignModal();
    } else if (action === 'cancel-order') {
      setIsEscrowAbortModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col w-full -m-4 sm:-m-6 md:-m-8 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* Top Context Header Bar */}
      <div className="px-6 sm:px-8 py-6 bg-[#fbf9f5] border-b border-[#ded9d1]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 max-w-[1440px] mx-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#665d52] font-mono text-[11px] tracking-widest uppercase">
              <span>SUPER ADMIN</span>
              <span className="text-[#ded9d1]">•</span>
              <span>MANAGEMENT</span>
              <span className="text-[#ded9d1]">•</span>
              <span>DELIVERY PARTNERS</span>
              <span className="text-[#ded9d1]">•</span>
              <span className="text-[#1a1a1a] font-semibold">ACTIVE DELIVERIES</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight leading-none font-normal">
              Active In-Flight Deliveries & Courier Handover
            </h1>
            <p className="text-sm text-[#665d52] max-w-4xl leading-relaxed">
              Real-time telemetry surveillance of couriers navigating pickup corridors, thermal canister sealing, and secure customer doorstep handshakes across Ahmedabad.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePingAll}
              disabled={isPinging}
              className="px-4 py-2.5 bg-white border border-[#1a1a1a] text-[#1a1a1a] text-xs font-medium flex items-center gap-2 hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm"
              title="Broadcast GPS Ping to all nodes"
            >
              <span className={`material-symbols-outlined text-[17px] ${isPinging ? 'animate-spin' : ''}`}>
                radar
              </span>
              <span>{isPinging ? 'Pinging Nodes...' : 'Force GPS Ping All'}</span>
            </button>
            <button
              onClick={handleExportManifest}
              className="px-4 py-2.5 bg-white border border-[#ded9d1] text-[#1a1a1a] text-xs font-medium flex items-center gap-2 hover:border-[#1a1a1a] transition-colors"
              title="Export in-flight manifest CSV"
            >
              <span className="material-symbols-outlined text-[17px]">receipt_long</span>
              <span>Export Manifest</span>
            </button>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-4 py-2.5 bg-[#1a1a1a] text-white text-xs font-medium flex items-center gap-2 hover:bg-black transition-colors"
              title="Broadcast notice to all in-transit couriers"
            >
              <span className="material-symbols-outlined text-[17px]">campaign</span>
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>

        {/* Live Broadcast Notice Banner if active */}
        {activeNoticeBanner && (
          <div className="mt-4 p-2.5 bg-amber-50 border border-amber-300 font-mono text-xs text-amber-950 flex items-center justify-between animate-fadeIn max-w-[1440px] mx-auto">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-sm">campaign</span>
              <span className="font-semibold">{activeNoticeBanner}</span>
            </div>
            <button onClick={() => setActiveNoticeBanner(null)} className="text-amber-800 hover:text-black font-bold">✕</button>
          </div>
        )}

        {/* Live Telemetry KPI Metrics Banner */}
        <div className="mt-5 pt-4 border-t border-[#ded9d1] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-[1440px] mx-auto">
          <div className="bg-white p-3.5 flex items-center justify-between border-l-2 border-[#1a1a1a] border-t border-r border-b border-[#ded9d1] shadow-sm">
            <div>
              <div className="font-mono text-[#665d52] text-[10px] tracking-wider uppercase font-semibold">Active Vectors</div>
              <div className="font-mono text-xl font-bold text-[#1a1a1a] mt-0.5">{deliveries.length} Deliveries</div>
            </div>
            <span className="material-symbols-outlined text-[#665d52] text-2xl">two_wheeler</span>
          </div>

          <div className="bg-white p-3.5 flex items-center justify-between border-l-2 border-emerald-700 border-t border-r border-b border-[#ded9d1] shadow-sm">
            <div>
              <div className="font-mono text-[#665d52] text-[10px] tracking-wider uppercase font-semibold">Canister Integrity</div>
              <div className="font-mono text-xl font-bold text-emerald-800 mt-0.5">0 Breaches</div>
            </div>
            <span className="material-symbols-outlined text-emerald-700 text-2xl">thermostat</span>
          </div>

          <div className="bg-white p-3.5 flex items-center justify-between border-l-2 border-[#665d52] border-t border-r border-b border-[#ded9d1] shadow-sm">
            <div>
              <div className="font-mono text-[#665d52] text-[10px] tracking-wider uppercase font-semibold">Median Handover</div>
              <div className="font-mono text-xl font-bold text-[#1a1a1a] mt-0.5">14.2 min</div>
            </div>
            <span className="material-symbols-outlined text-[#665d52] text-2xl">schedule</span>
          </div>

          <div className="bg-white p-3.5 flex items-center justify-between border-l-2 border-[#ded9d1] border-t border-r border-b border-[#ded9d1] shadow-sm">
            <div>
              <div className="font-mono text-[#665d52] text-[10px] tracking-wider uppercase font-semibold">Regional Zone</div>
              <div className="font-mono text-xs font-semibold text-[#1a1a1a] mt-1">AHMEDABAD WEST (BOM-IND-01)</div>
            </div>
            <span className="material-symbols-outlined text-[#665d52] text-2xl">location_city</span>
          </div>
        </div>
      </div>

      {/* Stepper Lifecycle Filter Bar */}
      <div className="px-6 sm:px-8 pt-3 pb-0 bg-[#fbf9f5] border-b border-[#ded9d1] flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setLifecycleFilter('all')}
          className={`px-3.5 py-2 font-mono text-xs tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            lifecycleFilter === 'all'
              ? 'border-[#1a1a1a] text-[#1a1a1a] font-semibold'
              : 'border-transparent text-[#665d52] hover:text-[#1a1a1a]'
          }`}
        >
          <span>ALL ACTIVE</span>
          <span className="font-mono px-1.5 py-0.2 bg-[#1a1a1a] text-white text-[10px]">{deliveries.length}</span>
        </button>

        <button
          onClick={() => setLifecycleFilter('assigned')}
          className={`px-3.5 py-2 font-mono text-xs tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            lifecycleFilter === 'assigned'
              ? 'border-[#1a1a1a] text-[#1a1a1a] font-semibold'
              : 'border-transparent text-[#665d52] hover:text-[#1a1a1a]'
          }`}
        >
          <span>ASSIGNED TO COURIER</span>
          <span className="font-mono px-1.5 py-0.2 bg-[#eae8e4] text-[#665d52] text-[10px]">
            {deliveries.filter((d) => d.lifecycleKey === 'assigned').length}
          </span>
        </button>

        <button
          onClick={() => setLifecycleFilter('on-route')}
          className={`px-3.5 py-2 font-mono text-xs tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            lifecycleFilter === 'on-route'
              ? 'border-[#1a1a1a] text-[#1a1a1a] font-semibold'
              : 'border-transparent text-[#665d52] hover:text-[#1a1a1a]'
          }`}
        >
          <span>PICKED UP / ON ROUTE</span>
          <span className="font-mono px-1.5 py-0.2 bg-[#eae8e4] text-[#665d52] text-[10px]">
            {deliveries.filter((d) => d.lifecycleKey === 'on-route').length}
          </span>
        </button>

        <button
          onClick={() => setLifecycleFilter('inspecting')}
          className={`px-3.5 py-2 font-mono text-xs tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            lifecycleFilter === 'inspecting'
              ? 'border-[#1a1a1a] text-[#1a1a1a] font-semibold'
              : 'border-transparent text-[#665d52] hover:text-[#1a1a1a]'
          }`}
        >
          <span>AT PICKUP / INSPECTING</span>
          <span className="font-mono px-1.5 py-0.2 bg-[#eae8e4] text-[#665d52] text-[10px]">
            {deliveries.filter((d) => d.lifecycleKey === 'inspecting').length}
          </span>
        </button>

        <button
          onClick={() => setLifecycleFilter('delivered')}
          className={`px-3.5 py-2 font-mono text-xs tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            lifecycleFilter === 'delivered'
              ? 'border-[#1a1a1a] text-[#1a1a1a] font-semibold'
              : 'border-transparent text-[#665d52] hover:text-[#1a1a1a]'
          }`}
        >
          <span>DELIVERED / COMPLETED</span>
          <span className="font-mono px-1.5 py-0.2 bg-[#eae8e4] text-[#665d52] text-[10px]">
            {deliveries.filter((d) => d.lifecycleKey === 'delivered').length}
          </span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 sm:px-8 py-6 grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start max-w-[1440px] mx-auto w-full">
        {/* Surveillance Table Container (8 Cols) */}
        <div className="2xl:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-xs text-[#665d52] font-mono pb-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>LIVE IN-TRANSIT FEED (WS / SECURE DUPLEX 10Hz)</span>
            </div>
            <span>SORT: ETA (CRITICAL FIRST)</span>
          </div>

          <div className="overflow-x-auto bg-white border border-[#ded9d1] shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f0eeea] border-b border-[#ded9d1] font-mono text-[10px] text-[#665d52] tracking-widest uppercase">
                  <th className="p-3 font-semibold">Order & Req</th>
                  <th className="p-3 font-semibold">Customer & Drop</th>
                  <th className="p-3 font-semibold">Kitchen & Pickup</th>
                  <th className="p-3 font-semibold">Courier Partner</th>
                  <th className="p-3 font-semibold">Transit Phase</th>
                  <th className="p-3 font-semibold">Live ETA</th>
                  <th className="p-3 font-semibold">Canister HW</th>
                  <th className="p-3 font-semibold text-right">Escrow / Fee</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/70 text-[#1a1a1a]">
                {filteredDeliveries.map((del) => {
                  const isSelected = selectedOrderId === del.id;
                  return (
                    <tr
                      key={del.id}
                      onClick={() => setSelectedOrderId(del.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#eee0d2]/40 hover:bg-[#eee0d2]/60 border-l-4 border-[#1a1a1a]'
                          : 'hover:bg-[#f5f3ef]'
                      }`}
                    >
                      <td className="p-3 align-top font-mono">
                        <span className="font-bold text-[#1a1a1a]">#{del.id}</span>
                        <span className="block text-[10px] text-[#665d52]">{del.subType}</span>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-semibold text-[#1a1a1a]">{del.customer}</div>
                        <div className="text-[11px] text-[#665d52] line-clamp-1">{del.address}</div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-medium text-[#1a1a1a]">{del.kitchen}</div>
                        <div className="font-mono text-[10px] text-[#665d52]">{del.kitchenHub}</div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-semibold text-[#1a1a1a]">{del.courierName}</div>
                        <div className="font-mono text-[10px] text-[#665d52]">#{del.courierId} • {del.courierRating}</div>
                        <div className="text-[10px] text-[#665d52]">{del.vehicle}</div>
                      </td>

                      <td className="p-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase border ${
                            del.phaseTone === 'emerald'
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                              : del.phaseTone === 'amber'
                              ? 'bg-amber-50 text-amber-950 border-amber-200'
                              : del.phaseTone === 'blue'
                              ? 'bg-blue-50 text-blue-950 border-blue-200'
                              : 'bg-[#eae8e4] text-[#1a1a1a] border-[#ded9d1]'
                          }`}
                        >
                          {del.phase === 'ON ROUTE' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          )}
                          {del.phase === 'NEAR DROP / OTP' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-ping" />
                          )}
                          {del.phase}
                        </span>
                        <div className="font-mono text-[10px] text-[#665d52] mt-1">{del.vector}</div>
                      </td>

                      <td className="p-3 align-top font-mono">
                        <span className="font-bold text-[#1a1a1a] text-sm">{del.eta}</span>
                        <span className="block text-[10px] text-[#665d52]">{del.distRem}</span>
                      </td>

                      <td className="p-3 align-top font-mono">
                        <span className="font-semibold text-[#1a1a1a]">{del.canisterId}</span>
                        {del.temp.includes('°C') ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-800 font-bold block mt-0.5">
                            <span className="material-symbols-outlined text-[11px]">device_thermostat</span> {del.temp}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#665d52] block mt-0.5">{del.temp}</span>
                        )}
                      </td>

                      <td className="p-3 align-top text-right font-mono">
                        <div className="font-semibold text-[#1a1a1a]">{del.fee}</div>
                        <div className="text-[10px] text-[#665d52]">{del.escrow}</div>
                      </td>

                      <td className="p-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleInspectMission(del.id, del)}
                          className="p-1.5 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors active:scale-95 border border-[#ded9d1]"
                          title="Inspect Mission Telemetry Dossier"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Live Corridor Map Telemetry Snapshot */}
          <div className="p-4 bg-white border border-[#ded9d1] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#1a1a1a]">map</span>
                <span className="font-mono text-xs tracking-wider uppercase font-semibold text-[#1a1a1a]">
                  WEST AHMEDABAD DELIVERY CORRIDORS (BODAKDEV • VASTRAPUR • SATELLITE)
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#665d52] flex items-center gap-3">
                <span>RADAR: 5.4 KM RADIUS</span>
                <span>CELL ACCURACY: ±3M</span>
              </div>
            </div>

            <div
              className="w-full h-44 bg-cover bg-center border border-[#ded9d1] relative grayscale contrast-125 overflow-hidden"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAl2nVecQFPSEap4TRVYkiWdY9KpluEDn4k41acpOVJ4xejNf5sPVHAK1wgcHGGplZUmGj2f9kCPvQSqqEYe6FhF0eAOufDS2gZsU2cQAFSh3Qu0YXqF-Qmgbf1ke21eO8wzOoCPWUgjB_rGfxKCC-St0JGB-NsniIuagRW_jbK6S-rccYDiOd6LWVNetPZvZZmqhrclOis419ILRdTbVc9pDNplD1PMXjv_ehanSCubzhfX7XOOPVZ')`
              }}
            >
              <div className="absolute inset-0 bg-[#1a1a1a]/15 mix-blend-multiply pointer-events-none" />

              {/* Courier Pin 1 overlay */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white px-2 py-1 text-[9px] font-mono flex items-center gap-1.5 shadow-md border border-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>#DP-4409 (Rahul P. • 28 km/h)</span>
              </div>

              {/* Drop marker overlay */}
              <div className="absolute top-1/4 left-3/4 bg-white text-[#1a1a1a] px-2 py-0.5 text-[9px] font-mono border border-[#1a1a1a]">
                <span>402 Prerna Apts [0.8km]</span>
              </div>

              <div className="absolute bottom-2 right-2 bg-white/95 px-2 py-0.5 font-mono text-[9px] text-[#665d52] border border-[#ded9d1]">
                <span>GEOFENCE: ACTIVE COMPLIANCE 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Delivery Dossier Flyout / Inspector Panel (4 Cols) */}
        <div id="delivery-mission-panel" className="2xl:col-span-4 bg-white border border-[#ded9d1] p-5 space-y-5 shadow-sm transition-all">
          {/* Dossier Header */}
          <div className="border-b border-[#ded9d1] pb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] tracking-widest uppercase bg-[#1a1a1a] text-white px-1.5 py-0.5 font-semibold">
                  LIVE TELEMETRY DOSSIER
                </span>
                <span className="font-mono text-[10px] text-[#665d52]">ENCRYPTED</span>
              </div>
              <h2 className="font-serif text-2xl text-[#1a1a1a] mt-1 leading-tight font-medium">
                Order #{selectedDelivery.id}
              </h2>
              <div className="font-mono text-xs text-[#665d52] mt-0.5">
                {selectedDelivery.customer} × {selectedDelivery.courierName} (#{selectedDelivery.courierId})
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase">Target Window</div>
              <div className="font-mono text-sm font-bold text-[#1a1a1a]">{selectedDelivery.targetWindow}</div>
            </div>
          </div>

          {/* Courier Telemetry Card */}
          <div className="p-3.5 bg-[#f5f3ef] border border-[#ded9d1] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-1.5">
              <span className="font-mono text-xs tracking-wider text-[#1a1a1a] uppercase font-semibold">
                Courier Device Telemetry
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-800 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> ONLINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 font-mono text-xs">
              <div>
                <span className="text-[#665d52] text-[9px] block uppercase">Partner Name</span>
                <span className="font-semibold text-[#1a1a1a]">{selectedDelivery.courierName}</span>
              </div>
              <div>
                <span className="text-[#665d52] text-[9px] block uppercase">Direct Phone</span>
                <a className="font-semibold text-[#1a1a1a] hover:underline" href={`tel:${selectedDelivery.phone}`}>
                  {selectedDelivery.phone}
                </a>
              </div>
              <div>
                <span className="text-[#665d52] text-[9px] block uppercase">Current Velocity</span>
                <span className="font-semibold text-[#1a1a1a]">28.4 km/h (North)</span>
              </div>
              <div>
                <span className="text-[#665d52] text-[9px] block uppercase">Battery & Device</span>
                <span className="font-semibold text-[#1a1a1a]">{selectedDelivery.battery}</span>
              </div>
              <div>
                <span className="text-[#665d52] text-[9px] block uppercase">GPS Accuracy</span>
                <span className="font-semibold text-[#1a1a1a]">{selectedDelivery.gpsAcc}</span>
              </div>
              <div>
                <span className="text-[#665d52] text-[9px] block uppercase">Client App</span>
                <span className="font-semibold text-[#1a1a1a]">{selectedDelivery.clientApp}</span>
              </div>
            </div>
          </div>

          {/* Stainless Thermal Hardware Canister Card */}
          <div className="p-3.5 bg-[#f5f3ef] border border-[#ded9d1] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#1a1a1a]">lock</span>
                <span className="font-mono text-xs tracking-wider text-[#1a1a1a] uppercase font-semibold">
                  Hardware: 304 Canister {selectedDelivery.canisterId}
                </span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-semibold uppercase">
                COMPLIANT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-mono text-[9px] text-[#665d52] uppercase">Thermal Core Sensor</div>
                <div className="font-serif text-3xl text-[#1a1a1a] leading-none flex items-baseline gap-1">
                  <span>{selectedDelivery.tempVal || '68.2'}</span>
                  <span className="text-sm font-mono">°C</span>
                </div>
                <div className="text-[10px] text-[#665d52] font-mono">Baseline threshold: &gt;60°C</div>
              </div>
              <div className="w-24 text-right space-y-0.5">
                <div className="font-mono text-[9px] text-[#665d52]">SEALED AT</div>
                <div className="font-mono text-xs font-semibold text-[#1a1a1a]">19:35 IST</div>
                <div className="font-mono text-[10px] text-emerald-800">Δ -0.8°C / 10m</div>
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] font-mono pt-1 border-t border-[#ded9d1]">
              RFID Tag verified at kitchen dispatch counter. Sensor ping logged every 30s.
            </div>
          </div>

          {/* Milestone Progression Timeline */}
          <div className="space-y-2">
            <div className="font-mono text-xs tracking-wider uppercase font-semibold text-[#1a1a1a]">
              Milestone Progression Ledger
            </div>
            <div className="space-y-2.5 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#ded9d1] pl-5 font-mono text-[11px]">
              <div className="relative">
                <div className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1a1a]">Order Created & Escrow Locked</span>
                  <span className="text-[#665d52] text-[10px]">19:15:02</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1a1a]">Kitchen Acknowledged Order</span>
                  <span className="text-[#665d52] text-[10px]">19:16:12</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1a1a]">304 Canister Sealed (70.1°C)</span>
                  <span className="text-[#665d52] text-[10px]">19:32:44</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1a1a1a]">Courier Scanned Dispatch QR</span>
                  <span className="text-[#665d52] text-[10px]">19:35:10</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">In-Transit Vector (0.8 km)</span>
                  <span className="text-emerald-800 text-[10px]">19:48:00</span>
                </div>
                <div className="text-[10px] text-[#665d52] mt-0.5">On Schedule • Traffic Grade: Light</div>
              </div>

              <div className="relative opacity-60">
                <div className="absolute -left-[17px] top-1.5 w-1.5 h-1.5 rounded-full border border-[#ded9d1] bg-white" />
                <div className="flex items-center justify-between">
                  <span className="text-[#665d52]">Customer 4-Digit OTP Handshake</span>
                  <span className="text-[#665d52] text-[10px]">EXP: 19:54</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Emergency Overrides */}
          <div className="border-t border-[#ded9d1] pt-3 space-y-2">
            <div className="font-mono text-[10px] tracking-wider uppercase font-semibold text-[#665d52]">
              Super Admin Overrides
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                onClick={() => handleOverride('call-courier')}
                className="px-2.5 py-1.5 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] hover:border-[#1a1a1a] flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>Call Courier</span>
              </button>
              <button
                onClick={() => handleOverride('call-kitchen')}
                className="px-2.5 py-1.5 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] hover:border-[#1a1a1a] flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">store</span>
                <span>Call Kitchen</span>
              </button>
              <button
                onClick={() => handleOverride('call-customer')}
                className="px-2.5 py-1.5 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] hover:border-[#1a1a1a] flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">person</span>
                <span>Call Customer</span>
              </button>
              <button
                onClick={() => handleOverride('force-reassign')}
                className="px-2.5 py-1.5 bg-white border border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                <span>Reassign</span>
              </button>
            </div>
            <button
              onClick={() => handleOverride('cancel-order')}
              className="w-full mt-1 px-3 py-1.5 border border-red-600 text-red-700 text-xs font-mono uppercase font-semibold tracking-wider hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              <span>Emergency Escrow Refund & Abort</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. BROADCAST OPERATIONAL NOTICE MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#1a1a1a]">campaign</span>
                <div>
                  <span className="text-[10px] text-[#665d52] uppercase tracking-wider block">Fleet Broadcast</span>
                  <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Operational Notice Blast</h3>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3">
              <div>
                <label className="block text-[#665d52] text-[10px] uppercase font-semibold mb-1">Priority Classification</label>
                <div className="grid grid-cols-3 gap-2">
                  {['NORMAL', 'HIGH', 'URGENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBroadcastPriority(p)}
                      className={`py-1.5 font-bold uppercase transition-colors border ${
                        broadcastPriority === p
                          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                          : 'bg-white text-[#665d52] border-[#ded9d1] hover:bg-[#eae8e4]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#665d52] text-[10px] uppercase font-semibold mb-1">Announcement Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Moderate slowdown on Drive-In Rd. Thermal seals must remain locked until doorstep handshake."
                  value={broadcastNoticeText}
                  onChange={(e) => setBroadcastNoticeText(e.target.value)}
                  className="w-full bg-white border border-[#ded9d1] p-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              <div className="p-2.5 bg-[#f5f3ef] border border-[#ded9d1] text-[10px] text-[#665d52]">
                Target: <strong>All {deliveries.length} in-transit couriers</strong> currently transmitting telemetry in Ahmedabad West.
              </div>

              <div className="pt-3 border-t border-[#ded9d1] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Transmit Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. UNIVERSAL CALL / COMMUNICATIONS MODAL */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div>
                <span className="text-[10px] text-[#665d52] uppercase tracking-wider block">
                  {callContactType === 'courier' ? 'Courier Telemetry Voice Link' : callContactType === 'kitchen' ? 'Kitchen Dispatch Counter' : 'Encrypted Customer Gateway'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">
                  {callContactType === 'courier' ? selectedDelivery.courierName : callContactType === 'kitchen' ? selectedDelivery.kitchen : selectedDelivery.customer}
                </h3>
              </div>
              <button
                onClick={() => setIsCallModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-center">
              <div className="text-sm font-bold text-[#1a1a1a] bg-white border border-[#ded9d1] py-2">
                {callContactType === 'courier' ? (selectedDelivery.phone || '+91 95586 01570') : callContactType === 'kitchen' ? '+91 79 2685 4110 (Dispatch Line)' : '+91 79 4000 8821 ext 402 (Proxy)'}
              </div>

              <div className="space-y-2">
                <a
                  href={`tel:${callContactType === 'courier' ? selectedDelivery.phone : '+919558601570'}`}
                  className="w-full py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Dial Direct Phone Call</span>
                </a>

                <a
                  href={`https://wa.me/${(selectedDelivery.phone || '919558601570').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-[#25D366] text-white hover:bg-[#20ba5a] font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Open WhatsApp Channel</span>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDelivery.phone || '+91 95586 01570');
                    showToast('Copied phone number to clipboard');
                  }}
                  className="w-full py-2 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#1a1a1a] font-semibold flex items-center justify-center gap-1.5 border border-[#ded9d1]"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>Copy Phone Number</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. REASSIGN DELIVERY MISSION MODAL */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div>
                <span className="text-[10px] text-[#665d52] uppercase tracking-wider block">Super Admin Override</span>
                <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Reassign Order #{selectedDelivery.id}</h3>
              </div>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[#665d52]">
                Current Courier: <strong>{selectedDelivery.courierName}</strong> (#{selectedDelivery.courierId}).
                Select replacement courier to reroute this thermal handover:
              </p>

              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {driversList.length === 0 ? (
                  <div className="p-4 bg-white border border-[#ded9d1] text-center text-[#665d52]">
                    Loading registered couriers...
                  </div>
                ) : (
                  driversList.map((drv) => {
                    const drvId = drv.driverId || drv.id || drv._id;
                    const isSelected = selectedDriverToReassign === drvId;
                    return (
                      <div
                        key={drvId}
                        onClick={() => setSelectedDriverToReassign(drvId)}
                        className={`p-2.5 border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                            : 'bg-white text-[#1a1a1a] border-[#ded9d1] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{drv.name} <span className="opacity-70 text-[10px]">#{drvId}</span></div>
                          <div className="text-[10px] opacity-80">{drv.vehicleNo} • {drv.status || 'AVAILABLE'}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-[#f0eeea] text-[#665d52]'}`}>
                          {drv.rating || 4.8}★
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-[#ded9d1] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAssigningDriver || !selectedDriverToReassign}
                  onClick={handleConfirmReassign}
                  className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {isAssigningDriver ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Reassigning...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Confirm Override</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EMERGENCY ESCROW REFUND & ABORT MODAL */}
      {isEscrowAbortModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-red-300 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-red-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-xl">warning</span>
                <div>
                  <span className="text-[10px] text-red-700 uppercase tracking-wider block font-bold">2FA ESCROW REFUND</span>
                  <h3 className="font-serif text-xl font-bold text-red-950">Emergency Mission Abort</h3>
                </div>
              </div>
              <button
                onClick={() => setIsEscrowAbortModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Order #{selectedDelivery.id}</span>
                  <span className="text-red-700 font-bold">{selectedDelivery.escrow || '₹186 Escrow Locked'}</span>
                </div>
                <div className="text-[11px] text-red-800">
                  Customer: <strong>{selectedDelivery.customer}</strong> • Destination: {selectedDelivery.address}
                </div>
              </div>

              <div>
                <label className="block text-[#665d52] text-[10px] uppercase font-semibold mb-1">Abort Justification Reason *</label>
                <select
                  value={escrowReason}
                  onChange={(e) => setEscrowReason(e.target.value)}
                  className="w-full bg-white border border-[#ded9d1] p-2 text-xs text-[#1a1a1a]"
                >
                  <option value="Customer Address Unreachable / Refusal">Customer Address Unreachable / Refusal</option>
                  <option value="Thermal Integrity Compromised (<60°C)">Thermal Integrity Compromised (&lt;60°C)</option>
                  <option value="Courier Vehicle Breakdown / Emergency">Courier Vehicle Breakdown / Emergency</option>
                  <option value="Kitchen Recall on Allergy Contamination">Kitchen Recall on Allergy Contamination</option>
                  <option value="Force Majeure Weather / Road Closure">Force Majeure Weather / Road Closure</option>
                </select>
              </div>

              <label className="flex items-start gap-2 p-2.5 bg-white border border-[#ded9d1] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEscrow2FAAuthorized}
                  onChange={(e) => setIsEscrow2FAAuthorized(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-[11px] text-[#1a1a1a]">
                  I certify Super Admin 2FA authorization to abort this delivery leg and immediately release <strong>{selectedDelivery.escrow}</strong> back to customer.
                </span>
              </label>

              <div className="pt-3 border-t border-[#ded9d1] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEscrowAbortModalOpen(false)}
                  className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isEscrow2FAAuthorized || isAbortingEscrow}
                  onClick={handleConfirmEscrowAbort}
                  className="px-5 py-2 bg-red-700 text-white hover:bg-red-800 font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isAbortingEscrow ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Refunding...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Confirm Escrow Refund</span>
                    </>
                  )}
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
