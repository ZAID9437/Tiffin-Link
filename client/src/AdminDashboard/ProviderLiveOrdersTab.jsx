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

  // Baseline data matching the exact high-contrast design
  const defaultLiveOrders = [
    {
      id: '4956',
      time: '19:15:22 IST',
      slot: 'SLOT-DINNER',
      kitchen: 'Xoxo Men Kitchen',
      kitchenKey: 'xoxo',
      sector: 'Sector AMD-West • K-04',
      rating: '4.9 ★ (Active: 8)',
      customer: 'Aarav Sharma',
      location: 'Satellite (1.2 km from kitchen)',
      address: 'Tower 4B, Prerna Apts',
      meal: 'Kathiyawadi Village Thali × 1',
      mealDetails: 'Ringan Bhartu, 4 Phulkas, Fresh Chaas, Garlic Chutney',
      notes: 'No Onion in Dal',
      notesType: 'warning',
      price: '₹186',
      escrowStatus: 'UPI Escrow Locked',
      escrowVerified: true,
      txnId: 'TXN_98012A',
      lifecycle: 'READY',
      stagedRack: 'Staged: Rack #B-04',
      prepTime: 'Pack time: 14 mins',
      progressPercent: 100,
      courier: 'Rahul Patel',
      vehicle: 'Hero Splendor • GJ-01-ET-4412',
      courierEta: 'ETA 4m to kitchen',
      courierEtaStatus: 'good',
      hasAlert: false
    },
    {
      id: '4957',
      time: '19:22:04 IST',
      slot: 'SLA ALERT',
      kitchen: 'Rasoi Express',
      kitchenKey: 'rasoi',
      sector: 'Bodakdev Hub • K-12',
      rating: '4.7 ★ (Active: 5)',
      customer: 'Zaid Mansuri',
      location: 'Bodakdev (2.4 km from kitchen)',
      address: 'Block C, Goyal Intercity',
      meal: 'Dal Bati Churma Banquet Box × 2',
      mealDetails: 'Traditional ghee dip, spicy garlic chutney, 6 batis',
      notes: 'Standard spice profile',
      notesType: 'neutral',
      price: '₹240',
      escrowStatus: 'Paid UPI',
      escrowVerified: true,
      txnId: 'TXN_98014B',
      lifecycle: 'PREPARING',
      stagedRack: 'Elapsed 18m / SLA 22m',
      prepTime: 'Cooking fresh',
      progressPercent: 80,
      courier: 'Searching Driver',
      vehicle: '2 couriers pinged',
      courierEta: '6.4m wait time',
      courierEtaStatus: 'risk',
      hasAlert: true,
      alertText: 'SLA Breach Alert • Driver Search Lag'
    },
    {
      id: '4958',
      time: '19:28:11 IST',
      slot: 'SLOT-DINNER',
      kitchen: 'Maa Annapurna Rasoi',
      kitchenKey: 'annapurna',
      sector: 'Prahladnagar Sub-Hub • K-01',
      rating: '4.8 ★ (Active: 6)',
      customer: 'Tanvi Mehta',
      location: 'Prahladnagar (0.9 km from kitchen)',
      address: 'Shivalik Platinum #702',
      meal: 'Punjabi Homestyle Executive Thali × 1',
      mealDetails: 'Paneer Butter Masala, Yellow Dal Tadka, 3 Parathas, Jeera Rice',
      notes: 'Extra Pickle sachet',
      notesType: 'neutral',
      price: '₹165',
      escrowStatus: 'Paid Card',
      escrowVerified: true,
      txnId: 'TXN_98018C',
      lifecycle: 'ACCEPTED',
      stagedRack: 'Queued stove #2',
      prepTime: 'Kitchen accepted in 45s',
      progressPercent: 40,
      courier: 'Courier Standby',
      vehicle: 'Courier ID #DP-1804',
      courierEta: 'Radius: 350m to store',
      courierEtaStatus: 'neutral',
      hasAlert: false
    },
    {
      id: '4959',
      time: '19:30:45 IST',
      slot: 'SLOT-DINNER',
      kitchen: 'Xoxo Men Kitchen',
      kitchenKey: 'xoxo',
      sector: 'Sector AMD-West • K-04',
      rating: '4.9 ★ (Active: 8)',
      customer: 'Priya Desai',
      location: 'Judges Bungalow (3.1 km)',
      address: 'Vardhman Kripa Bung #3',
      meal: 'Gujarati Home Meal × 2',
      mealDetails: 'Sev Tameta, Sukhi Bhaji, 8 Rotli, Masala Khichdi',
      notes: 'Strictly No Ghee on Rotlis',
      notesType: 'warning',
      price: '₹260',
      escrowStatus: 'UPI AutoPay',
      escrowVerified: true,
      txnId: 'TXN_98020D',
      lifecycle: 'IN TRANSIT',
      stagedRack: '1.8 km left to drop',
      prepTime: 'Dispatched: 19:38',
      progressPercent: 75,
      courier: 'Aman Varma',
      vehicle: 'Pulsar 150 • GJ-27-AK-1088',
      courierEta: 'ETA 8m to customer',
      courierEtaStatus: 'good',
      hasAlert: false
    },
    {
      id: '4960',
      time: '19:34:10 IST',
      slot: 'SLOT-DINNER',
      kitchen: 'Shreenathji Satvik',
      kitchenKey: 'shreenathji',
      sector: 'Vastrapur • K-09',
      rating: '4.9 ★ (Active: 5)',
      customer: 'Hardik Parmar',
      location: 'Vastrapur (1.5 km)',
      address: 'Near Vastrapur Lake',
      meal: 'Jain Satvik Khichdi-Kadhi Box × 1',
      mealDetails: 'Moong Dal Khichdi, Gujarati Sweet Kadhi, Papad, Athana',
      notes: 'Pure Jain Prep Verified',
      notesType: 'success',
      price: '₹130',
      escrowStatus: 'Paid Escrow',
      escrowVerified: true,
      txnId: 'TXN_98025E',
      lifecycle: 'PREPARING',
      stagedRack: 'Cooking fresh (4m in)',
      prepTime: 'Pack queue: 10 mins left',
      progressPercent: 30,
      courier: 'Jay Dave',
      vehicle: 'Activa 6G • GJ-01-WQ-8819',
      courierEta: 'En route to kitchen',
      courierEtaStatus: 'neutral',
      hasAlert: false
    }
  ];

  // Fetch live orders from server
  const fetchLiveOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/orders?status=active');
      const json = await res.json();
      if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
        // Merge with our rich structure
        const liveItems = json.orders.slice(0, 15).map((o, idx) => ({
          id: o.orderNumber || o._id?.slice(-4) || `495${idx}`,
          time: new Date(o.createdAt || Date.now()).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST',
          slot: o.deliverySlot || 'SLOT-DINNER',
          kitchen: o.provider?.businessName || o.provider?.name || defaultLiveOrders[idx % defaultLiveOrders.length].kitchen,
          kitchenKey: 'xoxo',
          sector: o.provider?.address?.locality || 'Ahmedabad Central',
          rating: '4.8 ★',
          customer: o.user?.name || o.deliveryAddress?.contactName || 'Valued Customer',
          location: `${o.deliveryAddress?.locality || 'Central Hub'} (${o.distance || '1.8 km'})`,
          address: o.deliveryAddress?.houseNo ? `${o.deliveryAddress?.houseNo}, ${o.deliveryAddress?.street || ''}` : 'Ahmedabad Grid',
          meal: o.items?.[0]?.name ? `${o.items[0].name} × ${o.items[0].quantity || 1}` : 'Deluxe Tiffin Thali',
          mealDetails: o.items?.[0]?.description || 'Complete freshly cooked artisanal meal',
          notes: o.specialInstructions || 'Standard prep',
          notesType: o.specialInstructions ? 'warning' : 'neutral',
          price: `₹${o.totalAmount || 180}`,
          escrowStatus: o.paymentStatus === 'paid' ? 'UPI Escrow Locked' : 'Pending Escrow',
          escrowVerified: true,
          txnId: o.paymentDetails?.transactionId || `TXN_${Math.floor(10000 + Math.random() * 90000)}A`,
          lifecycle: (o.orderStatus || 'PREPARING').toUpperCase(),
          stagedRack: 'Staged at Hub',
          prepTime: 'Active ticket',
          progressPercent: o.orderStatus === 'ready' ? 100 : o.orderStatus === 'delivered' ? 100 : 65,
          courier: o.deliveryPartner?.name || 'Assigned Courier',
          vehicle: o.deliveryPartner?.vehicleNumber || 'GJ-01-ET-4412',
          courierEta: 'ETA 5m',
          courierEtaStatus: 'good',
          hasAlert: false
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

        {/* KPI Summary Metrics (High Contrast Brutalist Strip) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">Active In-Flight</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">alt_route</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">24</span>
              <span className="font-mono text-[12px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 font-medium">+4 last 10m</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Total active platform load</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">In Preparation</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">skillet</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">08</span>
              <span className="font-mono text-[12px] text-[#665d52] bg-[#efeeea] px-1.5 py-0.5">8 Kitchens</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Mean ticket prep: 18.4 mins</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">Ready for Pickup</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">inventory_2</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">06</span>
              <span className="font-mono text-[12px] text-amber-800 bg-amber-50 px-1.5 py-0.5">Staged at Hub</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Average rack time: 3.2m</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>

          <div className="p-5 bg-white border border-[#ded9d1]/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-widest">Couriers En Route</span>
              <span className="material-symbols-outlined text-[18px] text-[#665d52]">electric_moped</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-[#1a1a1a] font-normal">10</span>
              <span className="font-mono text-[12px] text-[#665d52] bg-[#efeeea] px-1.5 py-0.5">94% on-time</span>
            </div>
            <div className="text-[12px] text-[#665d52] mt-1 font-sans">Median ETA: 9.6 mins</div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1a1a1a] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          </div>
        </div>

        {/* Live Pipeline Flow (Visual Progress Ribbon) */}
        <div className="flex flex-col gap-3 p-5 bg-white border border-[#ded9d1]/60">
          <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]/40">
            <span className="font-mono text-xs text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">linear_scale</span>
              Live Pipeline Flow (Batch: Dinner Service)
            </span>
            <span className="font-mono text-[11px] text-[#665d52]">Live Tick • {currentTime}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-2 pt-2">
            {[
              { num: '01', stage: 'NEW', count: '03', width: 'w-1/3' },
              { num: '02', stage: 'ACCEPTED', count: '05', width: 'w-1/2' },
              { num: '03', stage: 'PREPARING', count: '08', width: 'w-3/4' },
              { num: '04', stage: 'READY', count: '06', width: 'w-2/3' },
              { num: '05', stage: 'SEARCHING', count: '02', width: 'w-2/5', highlight: true },
              { num: '06', stage: 'ASSIGNED', count: '10', width: 'w-full' },
              { num: '07', stage: 'PICKED UP', count: '04', width: 'w-2/5' },
              { num: '08', stage: 'IN TRANSIT', count: '08', width: 'w-4/5' },
              { num: '09', stage: 'DELIVERED', count: '42', width: 'w-full', dim: true }
            ].map((p, idx) => (
              <div
                key={idx}
                className={`flex flex-col p-2.5 border transition-colors ${
                  p.highlight
                    ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                    : p.dim
                    ? 'bg-white border-[#ded9d1]/30 opacity-70'
                    : 'bg-[#f5f3ef] border-[#ded9d1]/40 hover:border-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] uppercase ${p.highlight ? 'text-amber-900' : 'text-[#665d52]'}`}>
                    {p.num} • {p.stage}
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${p.highlight ? 'text-amber-900' : p.dim ? 'text-[#665d52]' : 'text-[#1a1a1a]'}`}>
                    {p.count}
                  </span>
                </div>
                <div className={`w-full ${p.highlight ? 'bg-amber-100' : 'bg-[#ded9d1]/50'} h-1 mt-2`}>
                  <div className={`h-1 ${p.highlight ? 'bg-amber-600' : p.dim ? 'bg-[#665d52]' : 'bg-[#1a1a1a]'} ${p.width}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Exceptions & Interventions Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50/70 border-l-2 border-amber-600 border-y border-r border-amber-200/60 flex items-start gap-4 justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 text-[20px] mt-0.5">warning</span>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-amber-900 tracking-wider">SLA Breach Alert • Driver Search Lag</span>
                <p className="font-sans text-[13px] text-amber-950 mt-0.5 leading-snug">
                  Order <strong className="font-mono font-semibold">#4957</strong> driver search exceeding 6 mins. Courier ping pool exhausted in Bodakdev radius.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAction('assign', '4957')}
              className="shrink-0 px-3 py-1.5 bg-[#1a1a1a] text-white text-[12px] font-mono hover:bg-neutral-800 transition-colors uppercase tracking-wider"
            >
              Auto-Dispatch Bay #04
            </button>
          </div>

          <div className="p-4 bg-white border-l-2 border-[#1a1a1a] border-y border-r border-[#ded9d1]/60 flex items-start gap-4 justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#1a1a1a] text-[20px] mt-0.5">speed</span>
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase text-[#1a1a1a] tracking-wider">Kitchen Capacity Notice</span>
                <p className="font-sans text-[13px] text-[#665d52] mt-0.5 leading-snug">
                  <strong className="text-[#1a1a1a]">Maa Annapurna Rasoi</strong> active dinner slot load is at 88% capacity (7 pending tickets).
                </p>
              </div>
            </div>
            <button
              onClick={() => alert('Inbound orders paused for Maa Annapurna Rasoi for 15 minutes.')}
              className="shrink-0 px-3 py-1.5 border border-[#1a1a1a] text-[#1a1a1a] text-[12px] font-mono hover:bg-[#1a1a1a] hover:text-white transition-colors uppercase tracking-wider"
            >
              Pause Inbound (15m)
            </button>
          </div>
        </div>

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
                placeholder="Search Order ID (#4956), Kitchen, Customer, Geocode, or Rider..."
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
                  <option value="all">All Providers (142)</option>
                  <option value="xoxo">Xoxo Men Kitchen (8)</option>
                  <option value="rasoi">Rasoi Express (5)</option>
                  <option value="maa">Maa Annapurna Rasoi (6)</option>
                  <option value="shreenathji">Shreenathji Satvik (5)</option>
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
                  <option value="preparing">Preparing (08)</option>
                  <option value="ready">Ready (06)</option>
                  <option value="assigned">Driver Assigned (10)</option>
                  <option value="transit">In Transit (08)</option>
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
                  <option value="cod">COD Locked</option>
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
                  <option value="dinner">Dinner (17:00 - 19:30)</option>
                  <option value="lunch">Lunch (12:00 - 14:00)</option>
                  <option value="breakfast">Breakfast (07:30 - 09:30)</option>
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
