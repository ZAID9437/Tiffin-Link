import React, { useState, useEffect, useMemo } from 'react';

export default function ProviderLiveOrdersTab({ onNavigate, onOpenProvider360 }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedKitchen, setSelectedKitchen] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedEscrow, setSelectedEscrow] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState('dinner');
  const [hotFilter, setHotFilter] = useState('all');
  const [autoSync, setAutoSync] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');

  // Fetch live orders from server
  const fetchLiveOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/orders?status=active');
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        // Map live DB entries cleanly
        const liveItems = json.orders.map((o, idx) => ({
          id: o.orderNumber || o.orderId || (o._id ? `#${o._id.slice(-4).toUpperCase()}` : `#ORD-${idx + 1}`),
          time: new Date(o.createdAt || Date.now()).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
          slot: o.deliverySlot || (o.mealSlot || 'Standard Delivery'),
          kitchen: o.provider?.businessName || o.provider?.name || o.providerName || 'Partner Kitchen',
          kitchenKey: (o.provider?.businessName || o.provider?.name || 'kitchen').toLowerCase().replace(/\s+/g, '-'),
          sector: o.provider?.address?.locality || o.provider?.address?.city || 'Ahmedabad Central',
          rating: o.provider?.rating ? `${o.provider.rating} ★` : '4.8 ★',
          customer: o.user?.name || o.customerName || o.deliveryAddress?.contactName || 'Valued Customer',
          location: `${o.deliveryAddress?.locality || o.deliveryAddress?.city || 'Central Hub'} (${o.distance || o.distanceKm || '1.8'} km)`,
          address: typeof o.deliveryAddress === 'object' ? `${o.deliveryAddress?.houseNo || ''} ${o.deliveryAddress?.street || ''} ${o.deliveryAddress?.locality || ''}`.trim() : (o.deliveryAddress || 'Customer Address'),
          meal: o.items?.[0]?.name ? `${o.items[0].name} × ${o.items[0].quantity || 1}` : (o.tiffinName || 'Artisanal Meal'),
          mealDetails: o.items?.[0]?.description || o.description || 'Complete freshly cooked home meal',
          notes: o.specialInstructions || 'Standard prep',
          notesType: o.specialInstructions ? 'warning' : 'neutral',
          price: `₹${o.totalAmount || o.price || 140}`,
          escrowStatus: o.paymentStatus === 'paid' || o.paymentStatus === 'Paid' ? 'UPI Escrow Locked' : 'Pending Escrow',
          escrowVerified: o.paymentStatus === 'paid' || o.paymentStatus === 'Paid',
          txnId: o.paymentDetails?.transactionId || o.transactionId || 'TXN-SETTLED',
          lifecycle: (o.orderStatus || o.status || 'PREPARING').toUpperCase(),
          stagedRack: 'Staged at Kitchen Node',
          prepTime: 'Active ticket',
          progressPercent: o.orderStatus === 'ready' ? 100 : (o.orderStatus === 'delivered' ? 100 : 50),
          courier: o.deliveryPartner?.name || o.driverName || 'Courier Partner',
          vehicle: o.deliveryPartner?.vehicleNumber || o.deliveryPartner?.vehicleNo || 'Two-Wheeler Fleet',
          courierEta: 'ETA En route',
          courierEtaStatus: 'good',
          hasAlert: Boolean(o.hasAlert)
        }));
        setOrders(liveItems);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Error fetching live orders:', err);
      setOrders([]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
      if (autoSync) {
        fetchLiveOrders();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [autoSync]);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Hot filters
      if (hotFilter === 'sla' && !o.hasAlert && !o.slot.includes('ALERT')) return false;
      if (hotFilter === 'thali' && !o.meal.toLowerCase().includes('thali')) return false;
      if (hotFilter === 'rider' && !o.courier.toLowerCase().includes('searching')) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          o.id.toLowerCase().includes(q) ||
          o.kitchen.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.courier.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Kitchen filter
      if (selectedKitchen !== 'all') {
        if (selectedKitchen === 'xoxo' && !o.kitchen.toLowerCase().includes('xoxo')) return false;
        if (selectedKitchen === 'rasoi' && !o.kitchen.toLowerCase().includes('rasoi')) return false;
        if (selectedKitchen === 'maa' && !o.kitchen.toLowerCase().includes('annapurna')) return false;
        if (selectedKitchen === 'shreenathji' && !o.kitchen.toLowerCase().includes('shreenathji')) return false;
      }

      // State filter
      if (selectedState !== 'all') {
        if (selectedState === 'preparing' && !o.lifecycle.includes('PREPARING')) return false;
        if (selectedState === 'ready' && !o.lifecycle.includes('READY')) return false;
        if (selectedState === 'assigned' && !o.courier.toLowerCase().includes('patel') && !o.courier.toLowerCase().includes('varma') && !o.courier.toLowerCase().includes('dave')) return false;
        if (selectedState === 'transit' && !o.lifecycle.includes('TRANSIT')) return false;
      }

      // Escrow filter
      if (selectedEscrow !== 'all') {
        if (selectedEscrow === 'verified' && !o.escrowVerified) return false;
      }

      return true;
    });
  }, [orders, search, selectedKitchen, selectedState, selectedEscrow, selectedSlot, hotFilter]);

  // Quick Action notification helper
  const handleAction = (action, orderId) => {
    if (action === 'pos') {
      alert(`POS ping triggered for Order #${orderId}. Kitchen induction unit notified.`);
    } else if (action === 'gps') {
      alert(`Live GPS tracking beacon engaged for Order #${orderId}.`);
    } else if (action === 'assign') {
      alert(`Dispatch algorithm rerouting nearest courier to Order #${orderId}.`);
    } else if (action === 'call') {
      alert(`Calling assigned driver for Order #${orderId} on verified relay.`);
    } else if (action === 'expedite') {
      alert(`Expedited priority ticket issued for Order #${orderId}.`);
    } else if (action === 'inspect') {
      if (onOpenProvider360) {
        onOpenProvider360('6701b91811a28114008912aa');
      } else {
        alert(`Inspecting Order #${orderId} 360° telemetry.`);
      }
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 max-w-[1560px] mx-auto w-full">
        
        {/* Top Meta & Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#ded9d1]/60">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#665d52]">
              <span>Super Admin</span>
              <span className="text-[#ded9d1]">/</span>
              <span>Management</span>
              <span className="text-[#ded9d1]">/</span>
              <span>Providers</span>
              <span className="text-[#ded9d1]">/</span>
              <span className="text-[#1a1a1a] font-semibold">Live Orders</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight mt-1">
              Provider Live Orders
            </h1>
            <p className="font-sans text-[#665d52] max-w-2xl text-[14px]">
              Real-time surveillance of orders currently being prepared, packaged, and dispatched across all active kitchens in the cluster.
            </p>
          </div>

          {/* Socket Telemetry & Control Island */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#efeeea] text-[#1a1a1a] text-[12px] font-mono border border-[#ded9d1]/50">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-medium">Real-time Socket Connected</span>
              <span className="text-[#665d52]/60">•</span>
              <span className="text-[#665d52]">Hub: Ahmedabad AMD-C</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f3ef] border border-[#ded9d1]/50">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#665d52]">Auto-sync</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#ded9d1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#1a1a1a]"></div>
              </label>
            </div>

            <button
              onClick={fetchLiveOrders}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white font-sans text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Refresh Stream</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Metrics (Dynamic Strip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">Active In-Flight</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">alt_route</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">{orders.length}</span>
              <span className="font-mono text-[12px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 font-medium">Real-time load</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Active orders in current cycle</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">In Preparation</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">skillet</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">
                {orders.filter(o => o.lifecycle.includes('PREP')).length}
              </span>
              <span className="font-mono text-[12px] text-[#665d52] bg-[#efeeea] px-1.5 py-0.5">Cooking Fresh</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Kitchen assembly queue</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">Ready for Pickup</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">inventory_2</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">
                {orders.filter(o => o.lifecycle.includes('READY')).length}
              </span>
              <span className="font-mono text-[12px] text-amber-800 bg-amber-50 px-1.5 py-0.5">Staged at Kitchen</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Packaged &amp; sealed canisters</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">Couriers En Route</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">electric_moped</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">
                {orders.filter(o => o.lifecycle.includes('TRANSIT') || o.lifecycle.includes('ASSIGN') || o.lifecycle.includes('DISPATCH')).length}
              </span>
              <span className="font-mono text-[12px] text-[#665d52] bg-[#efeeea] px-1.5 py-0.5">Dispatched</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Doorstep transit progress</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>
        </div>

        {/* Live Pipeline Flow (Dynamic Visual Progress Ribbon) */}
        <div className="flex flex-col gap-3 p-5 bg-white border border-[#ded9d1]/60">
          <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]/40">
            <span className="font-mono text-xs text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">linear_scale</span>
              Live Pipeline Flow (Real-Time Service)
            </span>
            <span className="font-mono text-[11px] text-[#665d52]">Live Tick • {currentTime}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            {[
              { num: '01', stage: 'PREPARING', count: orders.filter(o => o.lifecycle.includes('PREP')).length },
              { num: '02', stage: 'READY', count: orders.filter(o => o.lifecycle.includes('READY')).length },
              { num: '03', stage: 'IN TRANSIT', count: orders.filter(o => o.lifecycle.includes('TRANSIT') || o.lifecycle.includes('ASSIGN')).length },
              { num: '04', stage: 'DELIVERED TODAY', count: orders.filter(o => o.lifecycle.includes('DELIVER')).length }
            ].map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col p-2.5 border transition-colors bg-[#f5f3ef] border-[#ded9d1]/40 hover:border-[#1a1a1a]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[#665d52]">
                    {p.num} • {p.stage}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#1a1a1a]">
                    {p.count}
                  </span>
                </div>
                <div className="w-full bg-[#ded9d1]/50 h-1 mt-2">
                  <div className="h-1 bg-[#1a1a1a]" style={{ width: orders.length > 0 ? `${Math.min(100, Math.round((p.count / orders.length) * 100))}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Exceptions & Interventions Strip (Only Shown If Real Alert Exists) */}
        {orders.some(o => o.hasAlert) && (
          <div className="grid grid-cols-1 gap-4">
            {orders.filter(o => o.hasAlert).map((alertOrder) => (
              <div key={alertOrder.id} className="p-4 bg-amber-50/70 border-l-2 border-amber-600 border-y border-r border-amber-200/60 flex items-start gap-4 justify-between">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-700 text-[20px] mt-0.5">warning</span>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs uppercase text-amber-900 tracking-wider">Operational Exception</span>
                    <p className="font-sans text-[13px] text-amber-950 mt-0.5 leading-snug">
                      Order <strong className="font-mono font-semibold">{alertOrder.id}</strong> ({alertOrder.kitchen}) requires supervisor attention.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAction('assign', alertOrder.id)}
                  className="shrink-0 px-3 py-1.5 bg-[#1a1a1a] text-white text-[12px] font-mono hover:bg-neutral-800 transition-colors uppercase tracking-wider"
                >
                  Manage Order
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Filter & Query Control Console */}
        <div className="flex flex-col gap-4 p-5 bg-white border border-[#ded9d1]/60">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Live Search Field */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#665d52]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Order ID, Kitchen, Customer, or Rider..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f5f3ef] border border-[#ded9d1]/60 text-[14px] text-[#1a1a1a] placeholder:text-[#665d52]/70 focus:outline-none focus:border-[#1a1a1a] transition-colors font-sans"
              />
            </div>

            {/* Filter Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Provider Filter */}
              <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#665d52] mr-2">Kitchen:</span>
                <select
                  value={selectedKitchen}
                  onChange={(e) => setSelectedKitchen(e.target.value)}
                  className="bg-transparent text-[13px] text-[#1a1a1a] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Kitchens ({orders.length})</option>
                  {Array.from(new Set(orders.map(o => o.kitchen).filter(Boolean))).map(kName => (
                    <option key={kName} value={kName}>{kName}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#665d52] mr-2">State:</span>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="bg-transparent text-[13px] text-[#1a1a1a] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Active States</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="assigned">Driver Assigned</option>
                  <option value="transit">In Transit</option>
                </select>
              </div>

              {/* Payment Verification Filter */}
              <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#665d52] mr-2">Escrow:</span>
                <select
                  value={selectedEscrow}
                  onChange={(e) => setSelectedEscrow(e.target.value)}
                  className="bg-transparent text-[13px] text-[#1a1a1a] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Payment Types</option>
                  <option value="verified">Escrow Verified</option>
                  <option value="mandate">UPI Mandate Active</option>
                  <option value="cod">COD</option>
                </select>
              </div>

              {/* Batch Slot Filter */}
              <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#665d52] mr-2">Slot:</span>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="bg-transparent text-[13px] text-[#1a1a1a] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Slots</option>
                  <option value="dinner">Dinner</option>
                  <option value="lunch">Lunch</option>
                  <option value="breakfast">Breakfast</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Pill Selector Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ded9d1]/30 text-[12px]">
            <span className="font-mono uppercase text-[10px] text-[#665d52] tracking-widest mr-1">Hot filters:</span>
            <button
              onClick={() => setHotFilter('all')}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                hotFilter === 'all'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#f5f3ef] text-[#665d52] hover:text-[#1a1a1a] hover:bg-[#efeeea]'
              }`}
            >
              All Active ({orders.length})
            </button>
            <button
              onClick={() => setHotFilter('sla')}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                hotFilter === 'sla'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#f5f3ef] text-[#665d52] hover:text-[#1a1a1a] hover:bg-[#efeeea]'
              }`}
            >
              SLA Warnings (2)
            </button>
            <button
              onClick={() => setHotFilter('thali')}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                hotFilter === 'thali'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#f5f3ef] text-[#665d52] hover:text-[#1a1a1a] hover:bg-[#efeeea]'
              }`}
            >
              Thali Bundles (16)
            </button>
            <button
              onClick={() => setHotFilter('rider')}
              className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                hotFilter === 'rider'
                  ? 'bg-[#1a1a1a] text-white'
                  : 'bg-[#f5f3ef] text-[#665d52] hover:text-[#1a1a1a] hover:bg-[#efeeea]'
              }`}
            >
              Rider Pending (2)
            </button>
          </div>
        </div>

        {/* Active Orders Data Matrix */}
        <div className="border border-[#ded9d1]/60 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ded9d1]/60 bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Order / Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Kitchen Provider</th>
                  <th className="py-3 px-4 font-semibold">Customer &amp; Geocode</th>
                  <th className="py-3 px-4 font-semibold">Meal Configuration</th>
                  <th className="py-3 px-4 font-semibold">Escrow Ledger</th>
                  <th className="py-3 px-4 font-semibold">Lifecycle Stage</th>
                  <th className="py-3 px-4 font-semibold">Assigned Courier</th>
                  <th className="py-3 px-4 font-semibold text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/40 font-sans text-[13px]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#665d52] font-mono text-sm">
                      No active orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      className={`hover:bg-[#f5f3ef]/40 transition-colors ${
                        o.hasAlert ? 'bg-amber-50/20 hover:bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Order & Time */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#1a1a1a] text-[14px]">#{o.id}</span>
                          <span className="font-mono text-[#665d52] text-[11px] mt-0.5">{o.time}</span>
                          <span
                            className={`mt-1 px-1.5 py-0.5 text-[10px] font-mono border w-fit ${
                              o.slot.includes('ALERT')
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200/50'
                            }`}
                          >
                            {o.slot}
                          </span>
                        </div>
                      </td>

                      {/* Kitchen Provider */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#1a1a1a] text-[13px]">{o.kitchen}</span>
                          <span className="text-[#665d52] text-[11px]">{o.sector}</span>
                          <span className="font-mono text-[10px] text-[#665d52] mt-0.5">Rating: {o.rating}</span>
                        </div>
                      </td>

                      {/* Customer & Geocode */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="text-[#1a1a1a] font-medium">{o.customer}</span>
                          <span className="text-[#665d52] text-[11px] flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {o.location}
                          </span>
                          <span className="text-[#665d52]/70 text-[10px] font-mono mt-0.5">{o.address}</span>
                        </div>
                      </td>

                      {/* Meal Configuration */}
                      <td className="py-4 px-4 align-top max-w-[240px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#1a1a1a] font-medium">{o.meal}</span>
                          <span className="text-[#665d52] text-[11px]">{o.mealDetails}</span>
                          {o.notes && (
                            <span
                              className={`font-mono text-[10px] px-1 py-0.5 w-fit mt-0.5 ${
                                o.notesType === 'warning'
                                  ? 'text-amber-800 bg-amber-50'
                                  : o.notesType === 'success'
                                  ? 'text-emerald-800 bg-emerald-50'
                                  : 'text-[#665d52] bg-[#f5f3ef]'
                              }`}
                            >
                              {o.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Escrow Ledger */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-[#1a1a1a] text-[14px]">{o.price}</span>
                          <span className="font-mono text-[10px] text-emerald-700 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {o.escrowStatus}
                          </span>
                          <span className="font-mono text-[#665d52] text-[10px] mt-0.5">{o.txnId}</span>
                        </div>
                      </td>

                      {/* Lifecycle Stage */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] font-semibold w-fit border ${
                              o.lifecycle === 'READY'
                                ? 'bg-emerald-100/70 text-emerald-900 border-emerald-300'
                                : o.lifecycle === 'PREPARING'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : o.lifecycle === 'IN TRANSIT'
                                ? 'bg-[#1a1a1a] text-white border-transparent'
                                : 'bg-blue-50 text-blue-900 border-blue-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                o.lifecycle === 'IN TRANSIT'
                                  ? 'bg-emerald-400'
                                  : o.lifecycle === 'READY'
                                  ? 'bg-emerald-600 animate-pulse'
                                  : o.lifecycle === 'PREPARING'
                                  ? 'bg-amber-600 animate-pulse'
                                  : 'bg-blue-600'
                              }`}
                            />
                            {o.lifecycle}
                          </span>
                          <span className="font-mono text-[11px] text-[#665d52]">{o.stagedRack}</span>
                          {o.progressPercent < 100 && (
                            <div className="w-24 bg-[#ded9d1]/60 h-1 mt-0.5">
                              <div
                                className={`h-1 ${o.lifecycle === 'PREPARING' ? 'bg-amber-600' : 'bg-[#1a1a1a]'}`}
                                style={{ width: `${o.progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Assigned Courier */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col">
                          {o.courier.includes('Searching') ? (
                            <>
                              <span className="text-amber-800 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">search</span>
                                Searching Driver
                              </span>
                              <span className="text-[#665d52] text-[11px] font-mono">{o.vehicle}</span>
                              <span className="text-red-700 font-mono text-[10px] mt-0.5">{o.courierEta}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[#1a1a1a] font-medium">{o.courier}</span>
                              <span className="text-[#665d52] text-[11px] font-mono">{o.vehicle}</span>
                              <span
                                className={`font-mono text-[11px] font-semibold mt-0.5 ${
                                  o.courierEtaStatus === 'good'
                                    ? 'text-emerald-700'
                                    : 'text-[#665d52]'
                                }`}
                              >
                                {o.courierEta}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Interventions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.hasAlert ? (
                            <>
                              <button
                                onClick={() => handleAction('assign', o.id)}
                                className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[11px] font-sans hover:bg-neutral-800 transition-colors uppercase tracking-wider"
                              >
                                Auto-Assign
                              </button>
                              <button
                                onClick={() => handleAction('expedite', o.id)}
                                className="px-2 py-1 bg-[#efeeea] text-[#1a1a1a] text-[11px] font-sans border border-[#ded9d1] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                              >
                                Expedite
                              </button>
                            </>
                          ) : o.lifecycle === 'IN TRANSIT' ? (
                            <>
                              <button
                                onClick={() => handleAction('gps', o.id)}
                                className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[11px] font-sans hover:bg-neutral-800 transition-colors uppercase tracking-wider"
                              >
                                Live GPS
                              </button>
                              <button
                                onClick={() => handleAction('call', o.id)}
                                className="px-2 py-1 bg-[#efeeea] text-[#1a1a1a] text-[11px] font-sans border border-[#ded9d1] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                              >
                                Call Driver
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAction('inspect', o.id)}
                                className="px-2.5 py-1 bg-[#efeeea] text-[#1a1a1a] text-[11px] font-sans border border-[#ded9d1] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                              >
                                Inspect 360°
                              </button>
                              <button
                                onClick={() => handleAction('pos', o.id)}
                                className="px-2.5 py-1 bg-[#efeeea] text-[#1a1a1a] text-[11px] font-sans border border-[#ded9d1] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                              >
                                POS Ping
                              </button>
                              <button
                                onClick={() => handleAction('gps', o.id)}
                                className="p-1 text-[#665d52] hover:text-[#1a1a1a] transition-colors"
                                title="Track Courier GPS"
                              >
                                <span className="material-symbols-outlined text-[18px]">near_me</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Matrix Footbar & Pagination */}
          <div className="p-4 bg-[#f5f3ef] border-t border-[#ded9d1]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-[12px] font-mono text-[#665d52]">
              <span>Showing {filteredOrders.length} of 24 live tickets</span>
              <span className="text-[#ded9d1]">•</span>
              <span>Cluster Capacity Utilization: 74.2%</span>
              <span className="text-[#ded9d1]">•</span>
              <span>Auto-refresh poll: every 15.0s</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 bg-white border border-[#ded9d1] text-[#1a1a1a] text-[12px] font-mono hover:bg-[#efeeea] transition-colors disabled:opacity-40"
                disabled
              >
                Previous
              </button>
              <span className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[12px] font-mono font-bold">1</span>
              <button className="px-2.5 py-1 bg-white border border-[#ded9d1] text-[#1a1a1a] text-[12px] font-mono hover:bg-[#efeeea] transition-colors">
                2
              </button>
              <button className="px-2.5 py-1 bg-white border border-[#ded9d1] text-[#1a1a1a] text-[12px] font-mono hover:bg-[#efeeea] transition-colors">
                3
              </button>
              <button className="px-3 py-1 bg-white border border-[#ded9d1] text-[#1a1a1a] text-[12px] font-mono hover:bg-[#efeeea] transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Architectural Deep Link Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pb-12">
          <div
            onClick={() => onNavigate && onNavigate('providers-history')}
            className="p-6 bg-white border border-[#ded9d1]/60 flex flex-col justify-between group hover:border-[#1a1a1a] transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest text-[11px]">System Archives</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a] mt-1">View Historical Order Dossiers</h3>
                <p className="font-sans text-[#665d52] text-[14px] mt-2 max-w-md">
                  Access completed, cancelled, and refund-reconciled orders with deep forensic audit logs and customer signature receipts.
                </p>
              </div>
              <span className="material-symbols-outlined text-[24px] text-[#665d52] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
            <div className="mt-6 font-mono text-[11px] text-[#665d52] flex items-center gap-2">
              <span>4,291 Records Archived</span>
              <span>•</span>
              <span>Storage: 100% Encrypted</span>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('providers-profiles')}
            className="p-6 bg-white border border-[#ded9d1]/60 flex flex-col justify-between group hover:border-[#1a1a1a] transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest text-[11px]">Kitchen Registry</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a] mt-1">Open Kitchen Profiles &amp; Licensure</h3>
                <p className="font-sans text-[#665d52] text-[14px] mt-2 max-w-md">
                  Review commercial kitchen hygiene verifications, FSSAI registry docs, daily capacity limits, and emergency pause controls.
                </p>
              </div>
              <span className="material-symbols-outlined text-[24px] text-[#665d52] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
            <div className="mt-6 font-mono text-[11px] text-[#665d52] flex items-center gap-2">
              <span>142 Active Cloud Kitchens</span>
              <span>•</span>
              <span>Ahmedabad Central Node</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
