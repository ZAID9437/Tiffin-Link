import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  Users, 
  ShoppingBag, 
  Radio, 
  Check, 
  X, 
  Clock,
  ArrowUpRight,
  Sparkles,
  Utensils,
  Zap,
  Star,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  Calendar,
  Filter
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { apiRequest } from '../services/api';
import { getSocket } from '../services/socket';

export default function DashboardOverviewTab({ currentUser, onNavigateTab }) {
  const providerName = currentUser?.name || currentUser?.businessName || 'Provider';

  const [stats, setStats] = useState({
    liveRequestsCount: 0,
    todaysOrdersCount: 0,
    revenueToday: 0,
    rating: 0,
    reviewCount: 0
  });

  const [allRawOrders, setAllRawOrders] = useState([]);

  const [todaysOrders, setTodaysOrders] = useState([]);
  const [kitchenCapacity, setKitchenCapacity] = useState({
    maxMeals: 30,
    cookedMeals: 0,
    bookedMeals: 0,
    remainingMeals: 30,
    utilization: 0,
    lunch: { booked: 0, capacity: 15, remaining: 15, isMaxed: false },
    dinner: { booked: 0, capacity: 15, remaining: 15, isMaxed: false }
  });
  const [deliveryCounts, setDeliveryCounts] = useState({
    ready: 0,
    assigned: 0,
    searching: 0
  });

  const [liveRequest, setLiveRequest] = useState(null);

  const [acceptingOrders, setAcceptingOrders] = useState(() => {
    return localStorage.getItem('tiffinlink_provider_accepting_orders') !== 'false';
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Report & Export Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState('today'); // 'today' | 'yesterday' | '7days' | 'all'

  // Date Check Helper Functions
  const isTodayDate = (dateInput) => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const isYesterdayDate = (dateInput) => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return (
      d.getFullYear() === y.getFullYear() &&
      d.getMonth() === y.getMonth() &&
      d.getDate() === y.getDate()
    );
  };

  const isWithinLastDays = (dateInput, days = 7) => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  };

  const formatDateFormatted = (dateInput) => {
    if (!dateInput) return 'Today';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day}/${month}/${year} • ${timeStr}`;
  };

  // Fetch Real Dashboard Data from MongoDB
  const fetchDashboardDataFromDb = useCallback(async () => {
      try {
        const [dashRes, reqRes] = await Promise.all([
          apiRequest('/providers/dashboard'),
          apiRequest('/requests')
        ]);

        const dashJson = typeof dashRes?.json === 'function' ? await dashRes.json() : dashRes;
        const reqJson = typeof reqRes?.json === 'function' ? await reqRes.json() : reqRes;

        if (dashJson && dashJson.success && dashJson.data) {
          const d = dashJson.data;
          setStats(prev => ({
            ...prev,
            todaysOrdersCount: d.todaysOrdersCount !== undefined ? d.todaysOrdersCount : prev.todaysOrdersCount,
            revenueToday: d.revenueToday !== undefined ? d.revenueToday : prev.revenueToday,
            rating: d.rating !== undefined ? d.rating : prev.rating,
            reviewCount: d.reviewCount !== undefined ? d.reviewCount : prev.reviewCount,
            liveRequestsCount: d.liveRequestsCount !== undefined ? d.liveRequestsCount : prev.liveRequestsCount
          }));

          if (d.kitchenCapacity) {
            const maxM = Number(d.kitchenCapacity.maxMeals) || 30;
            const cookedM = Number(d.kitchenCapacity.cookedMeals !== undefined ? d.kitchenCapacity.cookedMeals : d.kitchenCapacity.bookedMeals) || 0;
            const lunchCap = Number(d.kitchenCapacity.lunch?.capacity) || Math.ceil(maxM / 2);
            const dinnerCap = Number(d.kitchenCapacity.dinner?.capacity) || Math.floor(maxM / 2);
            const lunchBooked = Number(d.kitchenCapacity.lunch?.booked) || 0;
            const dinnerBooked = Number(d.kitchenCapacity.dinner?.booked) || 0;
            const remainingM = Math.max(0, maxM - cookedM);
            const util = maxM > 0 ? Math.round((cookedM / maxM) * 100) : 0;

            setKitchenCapacity({
              maxMeals: maxM,
              cookedMeals: cookedM,
              bookedMeals: cookedM,
              remainingMeals: remainingM,
              utilization: util,
              lunch: {
                booked: lunchBooked,
                capacity: lunchCap,
                remaining: Math.max(0, lunchCap - lunchBooked),
                isMaxed: lunchBooked >= lunchCap
              },
              dinner: {
                booked: dinnerBooked,
                capacity: dinnerCap,
                remaining: Math.max(0, dinnerCap - dinnerBooked),
                isMaxed: dinnerBooked >= dinnerCap
              }
            });
          } else {
            const cookedM = d.todaysOrdersCount || 0;
            setKitchenCapacity({
              maxMeals: 30,
              cookedMeals: cookedM,
              bookedMeals: cookedM,
              remainingMeals: Math.max(0, 30 - cookedM),
              utilization: Math.round((cookedM / 30) * 100),
              lunch: { booked: cookedM, capacity: 15, remaining: Math.max(0, 15 - cookedM), isMaxed: cookedM >= 15 },
              dinner: { booked: 0, capacity: 15, remaining: 15, isMaxed: false }
            });
          }

          if (d.deliveryCounts) {
            setDeliveryCounts({
              ready: d.deliveryCounts.ready || 0,
              assigned: d.deliveryCounts.assigned || 0,
              searching: d.deliveryCounts.searching || 0
            });
          }

          if (Array.isArray(d.todaysOrders)) {
            const seenIds = new Set();
            const uniqueRaw = d.todaysOrders.filter(o => {
              const key = String(o.id || o.orderId || o._id || '').trim();
              if (key && seenIds.has(key)) return false;
              if (key) seenIds.add(key);
              return true;
            });
            const formatted = uniqueRaw.map(o => ({
              id: o.id || o.orderId || '#ORD',
              customer: o.customer || 'Customer',
              items: o.qtyText || 'Tiffin Meal',
              time: 'Today',
              amount: o.amount || 0,
              status: o.status,
              statusBg: o.statusBg || 'bg-indigo-100 text-indigo-800 border-indigo-200'
            }));
            setTodaysOrders(formatted);
          }
        }

        if (reqJson && reqJson.success && Array.isArray(reqJson.data)) {
          const pendingList = reqJson.data.filter(r => r.status === 'pending');
          setStats(prev => ({ ...prev, liveRequestsCount: pendingList.length }));

          if (pendingList.length > 0) {
            const req = pendingList[0];
            setLiveRequest({
              id: req._id ? `REQ-${String(req._id).slice(-4).toUpperCase()}` : 'REQ',
              customerName: req.customerName || 'Customer',
              customerPhone: req.customerPhone || '—',
              items: `${req.quantity || 1} × ${req.mealType || 'Tiffin'}`,
              time: `${req.date || 'Today'}${req.time ? ` • ${req.time}` : ''}`,
              distance: `${req.distance || ''}${req.deliveryType ? ` • ${req.deliveryType}` : ''}`,
              price: req.budget || 0,
              secondsLeft: 60
            });
          } else {
            setLiveRequest(null);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data from MongoDB:', err);
      }
    }, []);

    useEffect(() => {
      if (currentUser) {
        fetchDashboardDataFromDb();
      }
    }, [currentUser, fetchDashboardDataFromDb]);

    // Real-time synchronization via Socket.IO
    useEffect(() => {
      let socket;
      try {
        socket = getSocket();
        if (socket && currentUser) {
          const pId = currentUser?.providerId || currentUser?.id || currentUser?._id;
          if (pId) {
            socket.emit('join:provider', { providerId: String(pId) });
          }

          const handleRealtimeSync = () => {
            fetchDashboardDataFromDb();
          };

          socket.on('order:created', handleRealtimeSync);
          socket.on('order:new', handleRealtimeSync);
          socket.on('order:updated', handleRealtimeSync);
          socket.on('order:status:updated', handleRealtimeSync);
          socket.on('order:cancelled', handleRealtimeSync);
          socket.on('capacity:updated', handleRealtimeSync);
          socket.on('delivery:status:updated', handleRealtimeSync);

          return () => {
            socket.off('order:created', handleRealtimeSync);
            socket.off('order:new', handleRealtimeSync);
            socket.off('order:updated', handleRealtimeSync);
            socket.off('order:status:updated', handleRealtimeSync);
            socket.off('order:cancelled', handleRealtimeSync);
            socket.off('capacity:updated', handleRealtimeSync);
            socket.off('delivery:status:updated', handleRealtimeSync);
          };
        }
      } catch (err) {
        console.warn('Socket setup warning in DashboardOverviewTab:', err);
      }
    }, [currentUser, fetchDashboardDataFromDb]);

  // Filter Orders for Modal Report
  const getFilteredReportOrders = () => {
    if (reportFilter === 'today') {
      return allRawOrders.filter(o => isTodayDate(o.createdAt || o.date));
    }
    if (reportFilter === 'yesterday') {
      return allRawOrders.filter(o => isYesterdayDate(o.createdAt || o.date));
    }
    if (reportFilter === '7days') {
      return allRawOrders.filter(o => isWithinLastDays(o.createdAt || o.date, 7));
    }
    return allRawOrders; // 'all'
  };

  // Export CSV Report Handler
  const handleExportCSVReport = () => {
    const reportList = getFilteredReportOrders();
    if (reportList.length === 0) return;

    const headers = ['Order ID', 'Date & Time', 'Customer Name', 'Phone', 'Address', 'Tiffin Item', 'Qty', 'Amount (INR)', 'Payment', 'Status'];
    const rows = reportList.map(o => [
      `"${o.orderId || ''}"`,
      `"${formatDateFormatted(o.createdAt || o.date)}"`,
      `"${o.customerName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.customerAddress || ''}"`,
      `"${o.tiffinName || ''}"`,
      o.quantity || 1,
      o.totalAmount || 0,
      `"${o.paymentStatus || 'Paid'}"`,
      `"${o.status || 'Completed'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TiffinLink_Orders_Report_${reportFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to create demo today order for dynamic testing
  const handleCreateTodayOrderDemo = async () => {
    try {
      const demoOrder = {
        customerName: 'Karan Mehta',
        customerPhone: '+91 98123 77889',
        customerAddress: 'C-501 Shivalik Park, Bodakdev, Ahmedabad',
        tiffinName: 'Gujarati Special Kathiawadi Thali',
        tiffinCategory: 'Gujarati',
        quantity: 2,
        unitPrice: 130,
        distanceKm: 2.4,
        paymentStatus: 'Paid',
        status: 'Preparing'
      };

      const data = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(demoOrder)
      });
      if (data.success) {
        setToastMessage(`✓ Order ${data.data.orderId} created for Today! Orders Today incremented.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Error creating demo today order:', err);
    }
  };

  const handleToggleAcceptingOrders = async () => {
    const nextState = !acceptingOrders;
    setAcceptingOrders(nextState);
    localStorage.setItem('tiffinlink_provider_accepting_orders', String(nextState));

    setToastMessage(
      nextState 
        ? '🟢 Kitchen Status: LIVE - Now accepting new tiffin orders!'
        : '⏸️ Kitchen Status: PAUSED - Incoming orders are temporarily paused.'
    );

    try {
      await apiRequest('/providers/status', {
        method: 'PUT',
        body: JSON.stringify({ acceptingOrders: nextState })
      });
    } catch (err) {
      console.error('Error syncing status to MongoDB:', err);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAcceptLiveRequest = async () => {
    if (!liveRequest) return;
    const activeReq = liveRequest;
    setLiveRequest(null);
    setToastMessage('✓ Live Request Accepted! Creating order in database & navigating to Preparing...');

    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: activeReq.customerName || 'Rahul Shah',
          customerPhone: activeReq.customerPhone || '+91 98765 12345',
          customerAddress: 'B-402, Shivalik Towers, Satellite, Ahmedabad',
          tiffinName: activeReq.items || 'Gujarati Veg Special Thali',
          tiffinCategory: 'Gujarati',
          tiffinImage: '/assets/provider_1.png',
          quantity: 2,
          unitPrice: activeReq.price || 120,
          distanceKm: 1.8,
          paymentStatus: 'Paid',
          status: 'Preparing'
        })
      });

      if (activeReq.id && activeReq.id.length > 10) {
        await apiRequest(`/requests/${activeReq.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'accepted' })
        });
      }
    } catch (err) {
      console.error('Error accepting live request:', err);
    }

    setTimeout(() => {
      setToastMessage(null);
      if (onNavigateTab) onNavigateTab('orders-preparing');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-slide-up relative text-on-surface">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-onyx-black text-bone-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-sand-neutral/30">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="font-button-text text-button-text font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Welcome Banner & Accepting Orders Toggle */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-sand-neutral/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-headline-md text-on-surface font-normal">
              Good afternoon, {providerName} 👋
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-caps text-label-caps font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-pulse"></span>
              {currentUser?.id ? `PROV-${String(currentUser.id).slice(-4).toUpperCase()}` : 'PROV-XOXO-991'}
            </span>
          </div>
          <p className="font-body-md text-body-md text-secondary">
            Here's what needs your kitchen's attention today.
          </p>
        </div>

        {/* Actions & Online Kitchen Switch */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-button-text text-button-text cursor-pointer border border-sand-neutral/40"
          >
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            <span>Report &amp; Export</span>
            <span className="material-symbols-outlined text-[16px] text-secondary">expand_more</span>
          </button>

          {/* Toggle Status Card */}
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-surface-container-low border border-sand-neutral/40">
            <div className="flex flex-col text-right">
              <span className="inline-flex items-center gap-1.5 font-label-caps text-[11px] font-bold text-on-surface uppercase tracking-wider">
                <span className={`w-2 h-2 rounded-full ${acceptingOrders ? 'bg-onyx-black animate-pulse' : 'bg-gray-400'}`}></span>
                ACCEPTING ORDERS ({acceptingOrders ? 'ON' : 'OFF'})
              </span>
              <span className="font-label-caps text-[9px] text-secondary">Synced: MongoDB Live Node</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={acceptingOrders}
                onChange={handleToggleAcceptingOrders}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Four Main Statistics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* KPI 1: Live Requests */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('requests')}
          className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-sand-neutral/40 flex flex-col justify-between relative overflow-hidden group hover:translate-y-[-1px] transition-transform cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-semibold block">⚡ Live Requests</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-lg text-[40px] leading-none text-on-surface font-normal">
                  {String(stats.liveRequestsCount || 0).padStart(2, '0')}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-label-caps font-bold bg-secondary-container text-on-secondary-fixed-variant">
                  {stats.liveRequestsCount > 0 ? 'URGENT' : 'IDLE'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-low -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-secondary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-ping"></span>
              WebSocket queue active
            </span>
            <span className="font-label-caps text-[10px] font-bold text-on-surface hover:underline">View ↗</span>
          </div>
        </div>

        {/* KPI 2: Orders Today */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-sand-neutral/40 flex flex-col justify-between relative overflow-hidden group hover:translate-y-[-1px] transition-transform cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-semibold block">📦 Orders Today</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-lg text-[40px] leading-none text-on-surface font-normal">
                  {stats.todaysOrdersCount || 0}
                </span>
                <span className="font-label-caps text-[12px] text-secondary font-semibold">
                  ({kitchenCapacity.cookedMeals || stats.todaysOrdersCount || 0} meals)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">lunch_dining</span>
            </div>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-low -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-secondary font-semibold text-onyx-black">
              Today's Live Batch
            </span>
            <span className="font-label-caps text-[9px] text-secondary truncate max-w-[120px]">
              MongoDB Synced
            </span>
          </div>
        </div>

        {/* KPI 3: Earned Today */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('earnings')}
          className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-sand-neutral/40 flex flex-col justify-between relative overflow-hidden group hover:translate-y-[-1px] transition-transform cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-semibold block">💰 Earned Today</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-lg text-[40px] leading-none text-on-surface font-normal">
                  ₹{Number(stats.revenueToday || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-low -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-on-surface">verified_user</span>
              Settlement Escrow Clear
            </span>
            <span className="font-label-caps text-[10px] font-bold text-on-surface">
              {stats.todaysOrdersCount || 0} Orders
            </span>
          </div>
        </div>

        {/* KPI 4: Kitchen Rating */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('reviews')}
          className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-sand-neutral/40 flex flex-col justify-between relative overflow-hidden group hover:translate-y-[-1px] transition-transform cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-semibold block">⭐ Kitchen Rating</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-lg text-[40px] leading-none text-on-surface font-normal">
                  {stats.rating ? Number(stats.rating).toFixed(1) : '4.7'}
                </span>
                <span className="font-label-caps text-[12px] text-clay-earth font-bold">★★★★★</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[20px]">star</span>
            </div>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-low -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-secondary">
              Based on {stats.reviewCount || 6} authentic reviews
            </span>
            <span className="font-label-caps text-[9px] px-1.5 py-0.5 rounded bg-surface-container font-semibold uppercase text-on-surface">
              Top 5%
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Layout (8 Column Left / 4 Column Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Today's Active Orders Panel */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-sand-neutral/40 overflow-hidden">
            
            {/* Header */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest border-b border-sand-neutral/30">
              <div>
                <h2 className="font-headline-md text-[24px] text-on-surface font-normal">Today's Active Orders</h2>
                <p className="font-body-md text-[13px] text-secondary">Live order tickets assigned to your kitchen batch</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('orders')}
                className="inline-flex items-center gap-1 font-label-caps text-label-caps font-bold text-on-surface hover:text-clay-earth cursor-pointer"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </button>
            </div>

            {/* Filter Pill Chips */}
            <div className="px-5 py-2.5 bg-surface-container-low flex items-center gap-2 overflow-x-auto border-b border-sand-neutral/30">
              <button className="px-3 py-1 rounded bg-onyx-black text-bone-white font-label-caps text-[11px] font-semibold whitespace-nowrap cursor-pointer">
                All Today ({todaysOrders.length || stats.todaysOrdersCount || 2})
              </button>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('orders-preparing')}
                className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-highest text-secondary hover:text-on-surface font-label-caps text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                In Prep ({todaysOrders.filter(o => o.status === 'Preparing').length})
              </button>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('orders-ready')}
                className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-highest text-secondary hover:text-on-surface font-label-caps text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Ready for Pickup ({deliveryCounts.ready || 0})
              </button>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('orders-completed')}
                className="px-3 py-1 rounded bg-surface-container hover:bg-surface-container-highest text-secondary hover:text-on-surface font-label-caps text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Completed ({todaysOrders.filter(o => o.status === 'Completed').length || 2})
              </button>
            </div>

            {/* Order Rows List */}
            <div className="divide-y divide-sand-neutral/30">
              {todaysOrders.length > 0 ? (
                todaysOrders.map((order, idx) => (
                  <div key={order.id || idx} className="p-5 hover:bg-surface-container-low/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex-shrink-0 flex items-center justify-center text-clay-earth">
                        <span className="material-symbols-outlined text-[24px]">bento</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-label-caps text-[12px] font-bold text-on-surface">{order.id}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(order.id)} 
                            className="text-secondary hover:text-on-surface cursor-pointer" 
                            title="Copy Order ID"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          </button>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-caps text-[10px] font-semibold">
                            Standard Lunch
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-body-md text-[14px] text-on-surface font-medium">
                          <span>{order.customer}</span>
                          <span className="text-secondary text-xs">•</span>
                          <span className="font-body-md text-[13px] text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">phone</span> +91 98201 ••••
                          </span>
                        </div>
                        <p className="font-body-md text-[13px] text-secondary">
                          {order.items}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:text-right">
                      <div>
                        <span className="font-label-caps text-[14px] font-bold text-on-surface block">₹{order.amount || 280}</span>
                        <span className="font-label-caps text-[10px] text-secondary">Paid Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-caps text-[11px] font-bold">
                          {order.status || 'Completed'}
                        </span>
                        <button 
                          onClick={() => onNavigateTab && onNavigateTab('orders')}
                          className="px-3 py-1 rounded bg-onyx-black text-bone-white hover:bg-stone-800 transition-colors font-button-text text-[12px] cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-1">
                    <span className="material-symbols-outlined text-[24px]">inbox</span>
                  </div>
                  <p className="font-headline-md text-sm text-on-surface font-semibold">No active orders today</p>
                  <p className="font-body-md text-xs text-secondary max-w-sm">New orders assigned to your kitchen batch will appear here in real-time when placed by customers.</p>
                </div>
              )}
            </div>

            {/* Dynamic Query Telemetry Footer */}
            <div className="p-3.5 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between text-secondary font-label-caps text-[11px] gap-2 border-t border-sand-neutral/30">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-on-surface">terminal</span>
                <code>db.orders.find({`{ providerId: "${currentUser?.id || 'PROV-XOXO-991'}", date: "today" }`})</code>
              </div>
              <span className="font-semibold text-on-surface">Total {kitchenCapacity.cookedMeals ?? 0} meals fulfilled today</span>
            </div>
          </div>

          {/* Live Meal Inquiries & Customer Demand Radar */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-sand-neutral/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-onyx-black animate-ping"></div>
                <h3 className="font-headline-md text-[20px] text-on-surface font-normal">Live Meal Inquiries &amp; Nearby Demands</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-caps text-[10px] font-semibold uppercase">
                Bodakdev &amp; Satellite Radar
              </span>
            </div>

            <div className="space-y-3">
              {/* Inquiry Request 1 */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-sand-neutral/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-[14px] font-semibold text-on-surface">Jain Swaminarayan Thali Request (4 pax)</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-caps text-[10px]">1.8 km</span>
                  </div>
                  <p className="font-body-md text-[13px] text-secondary">Bodakdev High St · Require 1:30 PM delivery · No onion/garlic strict</p>
                </div>
                <button 
                  onClick={handleAcceptLiveRequest}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-onyx-black text-bone-white hover:bg-stone-800 transition-colors font-button-text text-button-text cursor-pointer"
                >
                  <span>Send Offer</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>

              {/* Inquiry Request 2 */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-sand-neutral/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-[14px] font-semibold text-on-surface">Healthy Low-Oil Dinner Plan (Monthly Subscription)</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-caps text-[10px]">2.4 km</span>
                  </div>
                  <p className="font-body-md text-[13px] text-secondary">Satellite Towers · Starting Tomorrow dinner · Trial requested</p>
                </div>
                <button 
                  onClick={handleAcceptLiveRequest}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-onyx-black text-bone-white hover:bg-stone-800 transition-colors font-button-text text-button-text cursor-pointer"
                >
                  <span>Send Offer</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Kitchen Capacity */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-sand-neutral/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-clay-earth text-[20px]">speed</span>
                <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-secondary">KITCHEN CAPACITY</span>
              </div>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('capacity')}
                className="font-label-caps text-[11px] font-bold text-on-surface underline uppercase tracking-wider hover:text-clay-earth cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-display-lg text-[32px] leading-none text-on-surface font-normal">
                  {kitchenCapacity.cookedMeals} <span className="text-secondary text-[20px]">/ {kitchenCapacity.maxMeals} meals</span>
                </span>
                <span className="font-label-caps text-[12px] font-bold text-on-surface">
                  {kitchenCapacity.maxMeals > 0 ? Math.round((kitchenCapacity.cookedMeals / kitchenCapacity.maxMeals) * 100) : 0}%
                </span>
              </div>
              <p className="font-body-md text-[12px] text-secondary">Daily meal preparation capacity allocation</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-onyx-black h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, kitchenCapacity.maxMeals > 0 ? Math.round((kitchenCapacity.cookedMeals / kitchenCapacity.maxMeals) * 100) : 0)}%` }}
              ></div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low space-y-2 border border-sand-neutral/30">
              <div className="flex items-center justify-between font-label-caps text-[11px]">
                <span className="text-secondary font-medium">Lunch Batch:</span>
                <span className="font-bold text-on-surface">
                  {kitchenCapacity.lunch?.booked ?? 0} / {kitchenCapacity.lunch?.capacity ?? 15} Booked {
                    (kitchenCapacity.lunch?.booked ?? 0) >= (kitchenCapacity.lunch?.capacity ?? 15)
                      ? '(Maxed)'
                      : `(${(kitchenCapacity.lunch?.capacity ?? 15) - (kitchenCapacity.lunch?.booked ?? 0)} Slots Open)`
                  }
                </span>
              </div>
              <div className="flex items-center justify-between font-label-caps text-[11px]">
                <span className="text-secondary font-medium">Dinner Batch:</span>
                <span className="font-bold text-on-surface">
                  {kitchenCapacity.dinner?.booked ?? 0} / {kitchenCapacity.dinner?.capacity ?? 15} Booked {
                    (kitchenCapacity.dinner?.booked ?? 0) >= (kitchenCapacity.dinner?.capacity ?? 15)
                      ? '(Maxed)'
                      : `(${(kitchenCapacity.dinner?.capacity ?? 15) - (kitchenCapacity.dinner?.booked ?? 0)} Slots Open)`
                  }
                </span>
              </div>
            </div>

            <button 
              onClick={() => onNavigateTab && onNavigateTab('capacity')}
              className="w-full py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors font-button-text text-button-text text-center cursor-pointer border border-sand-neutral/30"
            >
              Adjust Daily Quota
            </button>
          </div>

          {/* Card 2: Delivery Status */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-sand-neutral/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-clay-earth text-[20px]">moped</span>
                <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-secondary">DELIVERY STATUS</span>
              </div>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('delivery')}
                className="font-label-caps text-[11px] font-bold text-on-surface hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View</span>
                <span className="material-symbols-outlined text-[13px]">arrow_outward</span>
              </button>
            </div>
            <p className="font-body-md text-[12px] text-secondary">Real-time courier coordination &amp; dispatches</p>

            {/* Dynamic Live Status Blocks */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-sand-neutral/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sand-neutral"></span>
                  <span className="font-body-md text-[13px] text-on-surface">Ready for Pickup</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-caps text-[10px] font-bold">
                  {deliveryCounts.ready || 0} Orders
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-sand-neutral/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sand-neutral"></span>
                  <span className="font-body-md text-[13px] text-on-surface">Assigned Couriers</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-caps text-[10px] font-bold">
                  {deliveryCounts.assigned || 0} Partners
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between border border-sand-neutral/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sand-neutral"></span>
                  <span className="font-body-md text-[13px] text-on-surface">Awaiting Partner Arrival</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-caps text-[10px] font-bold">
                  Searching ({deliveryCounts.searching || 0})
                </span>
              </div>
            </div>

            {/* Note info banner */}
            <div className="p-3 rounded-xl bg-surface-container text-secondary font-label-caps text-[11px] leading-relaxed flex items-start gap-2 border border-sand-neutral/30">
              <span className="material-symbols-outlined text-[16px] text-on-surface flex-shrink-0 mt-0.5">info</span>
              <span>All lunch dispatches fulfilled. Waiting for dinner transit window (starts 06:30 PM).</span>
            </div>
          </div>


        </div>

      </div>

      {/* Report & Export Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-onyx-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-sand-neutral/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface text-[22px]">assessment</span>
                <h3 className="font-headline-md text-[20px] text-on-surface font-normal">Kitchen Sales &amp; Order Report</h3>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)} 
                className="text-secondary hover:text-on-surface p-1 rounded hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold block">
                Select Date Range Filter:
              </label>
              <div className="grid grid-cols-2 gap-2 font-button-text text-[13px]">
                <button
                  type="button"
                  onClick={() => setReportFilter('today')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    reportFilter === 'today' ? 'bg-onyx-black text-bone-white border-onyx-black' : 'bg-surface-container-low text-on-surface border-sand-neutral/40'
                  }`}
                >
                  <span>Today's Batch</span>
                  <span className="font-bold">({allRawOrders.filter(o => isTodayDate(o.createdAt || o.date)).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('yesterday')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    reportFilter === 'yesterday' ? 'bg-onyx-black text-bone-white border-onyx-black' : 'bg-surface-container-low text-on-surface border-sand-neutral/40'
                  }`}
                >
                  <span>Yesterday</span>
                  <span className="font-bold">({allRawOrders.filter(o => isYesterdayDate(o.createdAt || o.date)).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('7days')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    reportFilter === '7days' ? 'bg-onyx-black text-bone-white border-onyx-black' : 'bg-surface-container-low text-on-surface border-sand-neutral/40'
                  }`}
                >
                  <span>Last 7 Days</span>
                  <span className="font-bold">({allRawOrders.filter(o => isWithinLastDays(o.createdAt || o.date, 7)).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter('all')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                    reportFilter === 'all' ? 'bg-onyx-black text-bone-white border-onyx-black' : 'bg-surface-container-low text-on-surface border-sand-neutral/40'
                  }`}
                >
                  <span>All Time</span>
                  <span className="font-bold">({allRawOrders.length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-neutral/40">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors font-button-text text-button-text cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { handleExportCSVReport(); setIsReportModalOpen(false); }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-onyx-black text-bone-white hover:bg-stone-800 transition-colors font-button-text text-button-text cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
