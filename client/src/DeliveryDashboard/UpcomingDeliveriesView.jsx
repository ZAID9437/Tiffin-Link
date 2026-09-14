import React, { useState, useEffect } from 'react';
import {
  subscribeToDeliveryLifecycle,
  joinDriverRoom,
  subscribeToConnectionStatus,
  getSocket
} from '../services/socket';

const formatOrderRef = (ref) => {
  if (!ref) return '';
  const clean = String(ref).trim().replace(/^#+/, '');
  return `#${clean}`;
};

export default function UpcomingDeliveriesView({
  activeDelivery = null,
  currentUser = null,
  onNavigateTab = null,
  onStatusUpdate = null
}) {
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTransit, setActiveTransit] = useState(activeDelivery);
  const [metrics, setMetrics] = useState({ nextPickupWindow: 'None scheduled', queuedTripEarnings: 0 });
  const [counts, setCounts] = useState({ all: 0, today: 0, tomorrow: 0, scheduled: 0 });
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'scheduled'
  const [sortOption, setSortOption] = useState('earliest'); // 'earliest' | 'highest_fare' | 'shortest_distance'

  // Modal State for View Details & Route Manifest
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Socket.IO Room & Connection Status Manager
  useEffect(() => {
    const driverId = currentUser?.id || currentUser?._id || localStorage.getItem('driver_id') || '';
    if (driverId) {
      joinDriverRoom(driverId);
    }

    const s = getSocket();
    if (s) {
      setIsSocketConnected(s.connected);
    }

    const unsubscribeConn = subscribeToConnectionStatus(
      () => setIsSocketConnected(true),
      () => setIsSocketConnected(false)
    );

    return () => {
      if (unsubscribeConn) unsubscribeConn();
    };
  }, [currentUser]);

  // Fetch upcoming deliveries for authenticated driver from MongoDB
  const fetchUpcomingDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);

      const email = currentUser?.email || localStorage.getItem('user_email') || '';
      const driverId = currentUser?.id || currentUser?._id || localStorage.getItem('driver_id') || '';
      const phone = currentUser?.phone || '';

      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        email,
        driverId,
        phone,
        search: searchQuery,
        filter: activeFilter,
        sort: sortOption
      });

      const res = await fetch(`http://localhost:5000/api/delivery/upcoming?${params.toString()}`, { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || 'Unable to load upcoming deliveries');
        return;
      }

      setUpcomingDeliveries(json.upcomingDeliveries || []);
      if (json.activeDelivery) {
        setActiveTransit(json.activeDelivery);
      } else {
        setActiveTransit(null);
      }
      if (json.counts) {
        setCounts(json.counts);
      }
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err) {
      console.error('Error fetching upcoming deliveries:', err);
      setError('Server connection error while loading upcoming queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingDeliveries();
  }, [currentUser, searchQuery, activeFilter, sortOption]);

  // Real-time Socket.IO Subscriptions
  useEffect(() => {
    const unsubscribe = subscribeToDeliveryLifecycle({
      onAssigned: () => fetchUpcomingDeliveries(),
      onStatusUpdate: () => fetchUpcomingDeliveries(),
      onPickup: () => fetchUpcomingDeliveries(),
      onCompleted: () => fetchUpcomingDeliveries()
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fallback filter calculations for badge pill counts if counts API is not present
  const todayCount = upcomingDeliveries.filter(d => {
    const dDate = new Date(d.requestedAt || d.createdAt || Date.now());
    const today = new Date();
    return dDate.toDateString() === today.toDateString();
  }).length;

  const tomorrowCount = upcomingDeliveries.filter(d => {
    const dDate = new Date(d.requestedAt || d.createdAt || Date.now());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dDate.toDateString() === tomorrow.toDateString();
  }).length;

  const scheduledCount = upcomingDeliveries.filter(d => d.isRecurring || d.subscriptionId || d.status === 'Scheduled' || d.status === 'SCHEDULED').length;

  const displayAllCount = counts.all !== undefined ? counts.all : upcomingDeliveries.length;
  const displayTodayCount = counts.today !== undefined ? counts.today : todayCount;
  const displayTomorrowCount = counts.tomorrow !== undefined ? counts.tomorrow : tomorrowCount;
  const displayScheduledCount = counts.scheduled !== undefined ? counts.scheduled : scheduledCount;

  // Group deliveries by Date / Batch dynamically
  const groupDeliveriesByBatch = (deliveries) => {
    const groups = {};
    const now = new Date();
    const todayStr = now.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    deliveries.forEach((del) => {
      const delDate = new Date(del.requestedAt || del.createdAt || Date.now());
      const delDateStr = delDate.toDateString();
      let key = 'UPCOMING QUEUE';

      if (delDateStr === todayStr) {
        const hours = delDate.getHours();
        if (hours < 16) {
          key = 'TODAY • AFTERNOON BATCH';
        } else {
          key = 'TODAY • DINNER BATCH';
        }
      } else if (delDateStr === tomorrowStr) {
        const options = { month: 'short', day: 'numeric' };
        key = `TOMORROW • ${delDate.toLocaleDateString('en-US', options).toUpperCase()}`;
      } else {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        key = `SCHEDULED • ${delDate.toLocaleDateString('en-US', options).toUpperCase()}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(del);
    });

    return groups;
  };

  const groupedDeliveries = groupDeliveriesByBatch(upcomingDeliveries);

  // Google Maps navigation handler
  const handleOpenNavigation = (address) => {
    const encoded = encodeURIComponent(address || 'Mumbai');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#fbf9f5] text-[#1c1b18] font-sans antialiased">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#181816] text-[#fbf9f5] text-xs font-mono px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top System Breadcrumb & Quick Stats Header */}
      <header className="border-b border-[#e7e2d9] bg-[#fbf9f5] px-6 sm:px-8 py-5 flex-shrink-0" data-purpose="page-top-header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title & Breadcrumb Block */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-[#8a857b] uppercase mb-1">
              <span>MY DELIVERIES</span>
              <span>/</span>
              <span className="text-[#181816] font-semibold">UPCOMING</span>
              <span className={`inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded border ${
                isSocketConnected 
                  ? 'text-[#1b8743] bg-[#eef7ee] border-[#bfe3c6]' 
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-[#1b8743] animate-pulse' : 'bg-amber-500'}`}></span>
                {isSocketConnected ? 'LIVE QUEUE' : 'OFFLINE MODE'}
              </span>
            </div>
            <h2 className="font-serif text-3xl font-normal tracking-tight text-[#181816] leading-tight">Upcoming Deliveries</h2>
            <p className="text-xs text-[#706c64] mt-0.5">Your scheduled and assigned deliveries queued for fulfillment</p>
          </div>

          {/* Header Stats Group */}
          <div className="flex items-center gap-6 divide-x divide-[#e7e2d9] self-start md:self-center">
            <div className="text-left pr-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a857b] block">Next Pickup Window</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-semibold text-[#181816] font-mono">{loading ? 'Loading...' : (metrics.nextPickupWindow || 'None scheduled')}</span>
              </div>
            </div>
            <div className="pl-6 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a857b] block">Queued Trip Earnings</span>
              <span className="text-base font-semibold text-[#181816] font-mono mt-0.5 block">
                {loading ? '₹...' : `₹${(metrics.queuedTripEarnings || 0).toFixed(2)}`}
              </span>
            </div>
            <div className="pl-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-[#1b8743] animate-pulse' : 'bg-amber-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-mono text-[#706c64]">
                {isSocketConnected ? 'Auto-synced via Socket.IO' : 'Reconnecting Socket.IO...'}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">

        {/* ACTIVE DELIVERY NOTICE BANNER */}
        {activeTransit && (
          <section className="bg-[#ffffff] border border-[#d9d2c5] rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs" data-purpose="active-delivery-state-banner">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded bg-[#181816] text-[#ffffff] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">electric_bolt</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#181816]">
                    ACTIVE TRANSIT: {formatOrderRef(activeTransit.orderId || activeTransit.requestId)}
                  </span>
                  <span className="text-[10px] uppercase font-mono bg-[#1b8743]/10 text-[#1b8743] px-1.5 py-0.5 rounded font-semibold border border-[#1b8743]/20">
                    {activeTransit.status || 'Heading to Customer'}
                  </span>
                </div>
                <p className="text-xs text-[#5f5b54] mt-1 leading-relaxed">
                  Order <strong className="text-[#181816] font-semibold">{formatOrderRef(activeTransit.orderId || activeTransit.requestId)}</strong> is currently active in transit. Once delivered, next assigned delivery will automatically activate.
                  <span className="text-[#8c877d] italic block sm:inline mt-0.5 sm:mt-0 sm:ml-1">Active delivery is excluded from upcoming queue as per dispatch protocol.</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('active-delivery')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase font-medium bg-[#f5f1e8] hover:bg-[#ede7db] text-[#181816] border border-[#d8d1c3] rounded transition-all whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
            >
              <span>View Active Delivery</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </section>
        )}

        {/* FILTERS AND SEARCH TOOLBAR */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-2 border-b border-[#e7e2d9]" data-purpose="filtering-and-search">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8c877d]">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer, or kitchen..."
              className="w-full pl-9 pr-4 py-2 bg-[#ffffff] border border-[#d9d2c5] rounded text-xs text-[#181816] placeholder-[#8c877d] focus:outline-none focus:border-[#181816] focus:ring-1 focus:ring-[#181816] transition-all font-sans"
            />
          </div>

          {/* Filter Tabs & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex p-1 bg-[#ede8dc] rounded border border-[#ded8cc] text-xs font-mono" role="tablist">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                  activeFilter === 'all' ? 'bg-[#181816] text-[#ffffff] shadow-xs' : 'text-[#5f5b54] hover:text-[#181816]'
                }`}
              >
                All ({loading ? '...' : displayAllCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('today')}
                className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                  activeFilter === 'today' ? 'bg-[#181816] text-[#ffffff] shadow-xs' : 'text-[#5f5b54] hover:text-[#181816]'
                }`}
              >
                Today ({loading ? '...' : displayTodayCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('tomorrow')}
                className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                  activeFilter === 'tomorrow' ? 'bg-[#181816] text-[#ffffff] shadow-xs' : 'text-[#5f5b54] hover:text-[#181816]'
                }`}
              >
                Tomorrow ({loading ? '...' : displayTomorrowCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('scheduled')}
                className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                  activeFilter === 'scheduled' ? 'bg-[#181816] text-[#ffffff] shadow-xs' : 'text-[#5f5b54] hover:text-[#181816]'
                }`}
              >
                Scheduled Subscriptions ({loading ? '...' : displayScheduledCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-[#ffffff] border border-[#d9d2c5] text-xs font-mono text-[#181816] py-2 pl-3 pr-8 rounded focus:outline-none focus:border-[#181816] cursor-pointer"
              >
                <option value="earliest">Sort: Earliest Slot</option>
                <option value="highest_fare">Sort: Highest Fare</option>
                <option value="shortest_distance">Sort: Shortest Distance</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#706c64]">
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </div>
            </div>
          </div>

        </section>

        {/* LOADING SKELETON STATE */}
        {loading && (
          <div className="space-y-4 py-8">
            <div className="h-6 w-48 bg-[#ede8dc] animate-pulse rounded" />
            <div className="h-40 w-full bg-[#ffffff] border border-[#e2dcd0] animate-pulse rounded" />
            <div className="h-40 w-full bg-[#ffffff] border border-[#e2dcd0] animate-pulse rounded" />
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="p-6 bg-red-50 border border-red-200 rounded text-center space-y-3">
            <span className="material-symbols-outlined text-red-700 text-[36px]">error</span>
            <p className="text-sm font-semibold text-red-900">{error}</p>
            <button
              type="button"
              onClick={fetchUpcomingDeliveries}
              className="px-4 py-2 bg-[#181816] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && upcomingDeliveries.length === 0 && (
          <div className="py-16 px-6 bg-[#ffffff] border border-[#e2dcd0] rounded text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <span className="material-symbols-outlined text-[#8a857b] text-[56px]">calendar_today</span>
            <h3 className="font-serif text-2xl text-[#181816]">No Upcoming Deliveries</h3>
            <p className="text-xs text-[#706c64] max-w-md">
              You currently don't have any upcoming deliveries queued. New assignments from providers will appear here automatically.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('delivery-requests')}
              className="px-6 py-2.5 bg-[#181816] text-[#ffffff] text-xs font-mono uppercase tracking-wider font-bold cursor-pointer hover:bg-stone-800 transition-colors"
            >
              View Delivery Requests
            </button>
          </div>
        )}

        {/* DELIVERIES LIST GROUPED BY CHRONOLOGICAL BATCH */}
        {!loading && !error && upcomingDeliveries.length > 0 && (
          <div className="space-y-8" data-purpose="deliveries-chronological-list">
            {Object.keys(groupedDeliveries).map((groupKey) => (
              <div key={groupKey} className="space-y-3">
                
                {/* Group Date Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm bg-[#181816]"></span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#181816]">{groupKey}</h3>
                    <span className="text-[11px] text-[#706c64] font-mono">({groupedDeliveries[groupKey].length} Scheduled)</span>
                  </div>
                </div>

                {/* Delivery Cards in Group */}
                {groupedDeliveries[groupKey].map((del) => {
                  const ref = formatOrderRef(del.orderId || del.requestId || del._id);
                  const providerName = del.providerName || 'Tiffin Kitchen';
                  const providerAddress = typeof del.pickupAddress === 'string' ? del.pickupAddress : (del.pickupAddress?.street || 'Pickup address');
                  
                  const customerName = del.customerName || 'Customer';
                  const customerAddress = typeof del.deliveryAddress === 'string' ? del.deliveryAddress : (del.deliveryAddress?.street || del.customerAddress || 'Delivery address');
                  
                  const tripEarning = del.driverEarning || del.payout || 180;
                  const tiffinTitle = del.tiffinName || 'Gujarati Special Thali';
                  const distance = del.distanceKm || 3.4;
                  const eta = del.etaMinutes || 18;

                  const reqTime = new Date(del.requestedAt || Date.now());
                  const timeFormatted = reqTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <article key={del._id || del.requestId} className="bg-[#ffffff] border border-[#e2dcd0] rounded hover:border-[#181816]/40 transition-all p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]" data-purpose="delivery-card">
                      
                      {/* Card Header: Ref, Status Badge, Driver Earning */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f0ece3] gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-[#181816]">{ref}</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide bg-[#eef7ee] text-[#1b8743] border border-[#bfe3c6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1b8743]"></span>
                            ASSIGNED • READY FOR PICKUP AT {timeFormatted}
                          </span>
                          <span className="text-[11px] font-mono text-[#8c877d]">● Queued assignment</span>
                        </div>
                        <div className="flex items-baseline gap-2 self-start sm:self-center">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a857b]">Driver Earning</span>
                          <span className="font-mono text-lg font-bold text-[#181816]">₹{tripEarning.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Card Body: Grid of Logistics Details */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-4 text-xs">
                        
                        {/* Column 1: Customer & Destination */}
                        <div className="md:col-span-4 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a857b] block">Customer &amp; Destination</span>
                          <p className="font-serif text-base font-bold text-[#181816] leading-tight">{customerName}</p>
                          <p className="text-[#59554e] leading-snug">{customerAddress}</p>
                          <p className="text-[11px] text-[#8c877d] font-mono">
                            {del.customerPhone ? `Phone: ${del.customerPhone}` : 'Contact available'}
                          </p>
                        </div>

                        {/* Column 2: Kitchen Dispatch */}
                        <div className="md:col-span-4 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8a857b] block">Kitchen Dispatch</span>
                          <p className="font-medium text-[#181816] text-[13px]">{providerName}</p>
                          <p className="text-[#59554e]">{providerAddress}</p>
                          <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono text-[#706c64]">
                            {del.providerEmail && <span>Kitchen Email: {del.providerEmail} • </span>}
                            <span className="text-[#1b8743] font-medium">Food Ready</span>
                          </div>
                        </div>

                        {/* Column 3: Timing Manifest */}
                        <div className="md:col-span-4 space-y-1 bg-[#fcfbf7] p-2.5 rounded border border-[#f0ece3]">
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-[#8a857b]">Pickup Window:</span>
                            <span className="font-semibold text-[#181816]">{timeFormatted}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-[#8a857b]">Target Handover:</span>
                            <span className="font-semibold text-[#181816]">
                              {new Date(reqTime.getTime() + eta * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-[#8a857b]">Transit Est.:</span>
                            <span className="text-[#181816]">{distance} km (~{eta} mins)</span>
                          </div>
                        </div>

                      </div>

                      {/* Tiffin Spec & Actions Bar */}
                      <div className="pt-3 border-t border-[#f0ece3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-[#59554e] text-[11px]">
                          <span className="px-2 py-0.5 bg-[#f4efe4] rounded font-mono text-[#403c35] font-medium border border-[#ded7c8]">
                            {tiffinTitle}
                          </span>
                          <span className="text-[#a36214] font-medium inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">swap_calls</span>
                            Container return exchange required
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => showToast(`📱 Dispatch contact for ${providerName} initiated`)}
                            className="flex-1 sm:flex-initial px-3 py-1.5 border border-[#d9d2c5] text-[#33302a] hover:border-[#181816] rounded text-xs font-mono uppercase transition-colors cursor-pointer"
                          >
                            Contact Dispatch
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDelivery(del)}
                            className="flex-1 sm:flex-initial px-4 py-1.5 bg-[#181816] text-[#ffffff] hover:bg-[#33312c] rounded text-xs font-mono uppercase font-medium transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>View Details &amp; Route Manifest</span>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                          </button>
                        </div>
                      </div>

                    </article>
                  );
                })}

              </div>
            ))}
          </div>
        )}

      </div>

      {/* VIEW DETAILS & ROUTE MANIFEST MODAL */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-[#181816]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border-2 border-[#181816] p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-start justify-between border-b border-[#e7e2d9] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#706c64]">MANIFEST DETAILS</span>
                <h3 className="font-serif text-2xl font-bold text-[#181816]">
                  {formatOrderRef(selectedDelivery.orderId || selectedDelivery.requestId)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="p-1 text-[#706c64] hover:text-[#181816] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Kitchen & Provider */}
              <div className="p-3 bg-[#fcfbf7] border border-[#e7e2d9]">
                <span className="text-[10px] font-mono uppercase text-[#706c64] block mb-1">Kitchen Dispatch</span>
                <p className="font-bold text-sm text-[#181816]">{selectedDelivery.providerName || 'Kitchen'}</p>
                <p className="text-[#59554e]">{typeof selectedDelivery.pickupAddress === 'string' ? selectedDelivery.pickupAddress : (selectedDelivery.pickupAddress?.street || 'Kitchen location')}</p>
                {selectedDelivery.providerEmail && (
                  <p className="text-[11px] text-[#706c64] font-mono mt-1">Email: {selectedDelivery.providerEmail}</p>
                )}
              </div>

              {/* Customer */}
              <div className="p-3 bg-[#fcfbf7] border border-[#e7e2d9]">
                <span className="text-[10px] font-mono uppercase text-[#706c64] block mb-1">Customer Drop-off</span>
                <p className="font-bold text-sm text-[#181816]">{selectedDelivery.customerName || 'Customer'}</p>
                <p className="text-[#59554e]">{typeof selectedDelivery.deliveryAddress === 'string' ? selectedDelivery.deliveryAddress : (selectedDelivery.deliveryAddress?.street || 'Delivery address')}</p>
                {selectedDelivery.customerPhone && (
                  <p className="text-[11px] text-[#706c64] font-mono mt-1">Phone: {selectedDelivery.customerPhone}</p>
                )}
              </div>

              {/* Earnings Breakdown */}
              <div className="p-3 bg-[#eef7ee] border border-[#bfe3c6] flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] uppercase text-[#1b8743] block">Guaranteed Driver Earning</span>
                  <span className="font-bold text-lg text-[#181816]">₹{(selectedDelivery.driverEarning || selectedDelivery.payout || 0).toFixed(2)}</span>
                </div>
                <div className="text-right text-[11px]">
                  <span className="text-[#706c64] block">Tiffin Price Total</span>
                  <span className="font-bold text-[#181816]">₹{selectedDelivery.amount || selectedDelivery.tiffinPayment || 0}</span>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e7e2d9]">
              <button
                type="button"
                onClick={() => handleOpenNavigation(
                  typeof selectedDelivery.deliveryAddress === 'string'
                    ? selectedDelivery.deliveryAddress
                    : selectedDelivery.deliveryAddress?.street
                )}
                className="px-4 py-2 bg-[#f5f1e8] hover:bg-[#ede7db] text-[#181816] border border-[#d8d1c3] font-mono text-xs uppercase font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">near_me</span>
                <span>Open Google Navigation</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="px-5 py-2 bg-[#181816] text-[#ffffff] font-mono text-xs uppercase font-bold hover:bg-stone-800 cursor-pointer"
              >
                Close Manifest
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
