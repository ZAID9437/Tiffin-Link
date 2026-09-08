import React, { useState, useEffect } from 'react';
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

export default function DashboardOverviewTab({ currentUser, onNavigateTab }) {
  const providerName = currentUser?.name || 'Xoxo Men';

  const [stats, setStats] = useState({
    liveRequestsCount: 0,
    todaysOrdersCount: 0,
    revenueToday: 0,
    rating: 4.4,
    reviewCount: 5
  });

  const [allRawOrders, setAllRawOrders] = useState([]);

  const [todaysOrders, setTodaysOrders] = useState([]);
  const [kitchenCapacity, setKitchenCapacity] = useState({
    maxMeals: 40,
    cookedMeals: 0
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

  // Poll MongoDB Database for Real Dashboard Data
  useEffect(() => {
    const fetchDashboardDataFromDb = async () => {
      try {
        // 1. Fetch Orders from MongoDB
        const ordJson = await apiRequest('/orders');
        
        if (ordJson.success && Array.isArray(ordJson.data)) {
          const fetchedOrders = ordJson.data;
          setAllRawOrders(fetchedOrders);

          // Todays Orders (or recent orders if today filter yields empty)
          const todaysOrdersOnly = fetchedOrders.filter(o => isTodayDate(o.createdAt || o.date));
          const activeOrdersList = todaysOrdersOnly.length > 0 ? todaysOrdersOnly : fetchedOrders;
          const todaysCount = activeOrdersList.length;

          // Revenue Today (for non-cancelled orders)
          const revToday = activeOrdersList
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

          // Active Orders for Table (Top 5 active/recent)
          const activeOrdersFormatted = fetchedOrders.slice(0, 5).map(o => {
            let statusBg = 'bg-gray-100 text-[#111827] border-gray-200';
            if (o.status === 'Preparing') statusBg = 'bg-amber-100 text-amber-800 border-amber-200';
            if (o.status === 'Ready') statusBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            if (o.status === 'New') statusBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';
            if (o.deliveryPartnerName) statusBg = 'bg-blue-100 text-blue-800 border-blue-200';

            return {
              id: o.orderId || '#1027',
              customer: o.customerName || 'Customer',
              items: `${o.tiffinName || 'Tiffin Meal'} × ${o.quantity || 1}`,
              time: o.createdAt ? formatDateFormatted(o.createdAt) : 'Today',
              amount: o.totalAmount || 120,
              status: o.deliveryPartnerName ? `Partner: ${o.deliveryPartnerName}` : o.status,
              statusBg
            };
          });

          setTodaysOrders(activeOrdersFormatted);

          // Kitchen Capacity Calculation (cooked meals today)
          const totalCooked = activeOrdersList
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);

          setKitchenCapacity(prev => ({ ...prev, cookedMeals: totalCooked }));

          // Delivery Status Widget Counts
          const rdy = fetchedOrders.filter(o => o.status === 'Ready').length;
          const asg = fetchedOrders.filter(o => o.deliveryPartnerName && o.deliveryPartnerName.trim() !== '').length;
          const src = fetchedOrders.filter(o => o.status === 'Ready' && (!o.deliveryPartnerName || o.deliveryPartnerName.trim() === '')).length;

          setDeliveryCounts({ ready: rdy, assigned: asg, searching: src });

          setStats(prev => ({
            ...prev,
            todaysOrdersCount: todaysCount,
            revenueToday: revToday
          }));
        }

        // 2. Fetch Live Requests from MongoDB
        const reqJson = await apiRequest('/requests');
        if (reqJson.success && Array.isArray(reqJson.data)) {
          const pendingList = reqJson.data.filter(r => r.status === 'pending');
          setStats(prev => ({ ...prev, liveRequestsCount: pendingList.length }));

          if (pendingList.length > 0) {
            const req = pendingList[0];
            setLiveRequest({
              id: req._id || 'REQ-1092',
              customerName: req.customerName || 'Rahul Shah',
              customerPhone: req.customerPhone || '+91 98765 12345',
              items: `${req.quantity || 1} × ${req.mealType || 'Veg Tiffin'}`,
              time: `${req.date || 'Today'} • ${req.time || '5:00 PM'}`,
              distance: `${req.distance || '1.8 km'} • ${req.deliveryType || 'Delivery'}`,
              price: req.budget || 120,
              secondsLeft: 60
            });
          } else {
            setLiveRequest(null);
          }
        }

        // 3. Fetch Reviews Rating from MongoDB
        const revJson = await apiRequest('/reviews');
        if (revJson.success && revJson.stats) {
          setStats(prev => ({
            ...prev,
            rating: Number(revJson.stats.overallRating || 4.4),
            reviewCount: Number(revJson.stats.totalReviews || 5)
          }));
        } else if (revJson.success && Array.isArray(revJson.data) && revJson.data.length > 0) {
          const avg = (revJson.data.reduce((sum, r) => sum + (r.rating || 5), 0) / revJson.data.length).toFixed(1);
          setStats(prev => ({ ...prev, rating: Number(avg), reviewCount: revJson.data.length }));
        }

      } catch (err) {
        console.error('Error fetching dashboard data from MongoDB:', err);
      }
    };

    fetchDashboardDataFromDb();
    const interval = setInterval(fetchDashboardDataFromDb, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="space-y-6 animate-slide-up relative text-xs font-bold text-[#111827]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Good afternoon, {providerName} 👋</h1>
          <p className="text-xs font-medium text-[#6B7280] mt-1">Here's what needs your attention today.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Report & Export Button */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileText size={16} />
            <span>📊 Report & Export</span>
          </button>

          {/* Accepting Orders Switch */}
          <div className="flex items-center gap-3 bg-[#F9FBF9] px-4 py-2.5 rounded-xl border border-[#E5ECE8]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${acceptingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-bold text-[#111827]">
                {acceptingOrders ? '🟢 ACCEPTING ORDERS' : '🔴 KITCHEN OFFLINE'}
              </span>
            </div>

            <button 
              type="button"
              onClick={handleToggleAcceptingOrders}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                acceptingOrders ? 'bg-[#0A8B5F]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  acceptingOrders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards (Dynamic from MongoDB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Live Requests */}
        <div 
          onClick={() => onNavigateTab('requests')}
          className="bg-white p-5 rounded-2xl border-2 border-amber-400/60 shadow-xs cursor-pointer hover:border-amber-500 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Zap size={15} />
              <span>Live Requests</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-3xl font-black text-[#111827]">
            {(stats.liveRequestsCount || 0).toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-2">Requires immediate response</div>
        </div>

        {/* Orders Today */}
        <div 
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-5 rounded-2xl border-2 border-emerald-500/80 shadow-xs cursor-pointer hover:border-[#0A8B5F] transition-all relative overflow-hidden"
        >
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <ShoppingBag size={15} className="text-[#0A8B5F]" />
            <span>Orders Today</span>
          </div>
          <div className="text-3xl font-black text-[#111827]">
            {stats.todaysOrdersCount}
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold mt-2 flex items-center gap-1">
            <span>📈 Live Sync</span>
            <span className="opacity-75">• Today only</span>
          </div>
        </div>

        {/* Earned Today */}
        <div 
          onClick={() => onNavigateTab('earnings')}
          className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs cursor-pointer hover:border-[#0A8B5F] transition-all"
        >
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <TrendingUp size={15} className="text-[#0A8B5F]" />
            <span>Earned Today</span>
          </div>
          <div className="text-3xl font-black text-[#111827]">
            ₹{stats.revenueToday.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold mt-2">Ready for withdrawal</div>
        </div>

        {/* Provider Rating */}
        <div 
          onClick={() => onNavigateTab('reviews')}
          className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs cursor-pointer hover:border-amber-500 transition-all"
        >
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <Star size={15} className="text-amber-500 fill-amber-500" />
            <span>Kitchen Rating</span>
          </div>
          <div className="text-3xl font-black text-[#111827]">{stats.rating} ★</div>
          <div className="text-[11px] text-[#6B7280] font-medium mt-2">
            {stats.reviewCount > 0 ? `Based on ${stats.reviewCount} reviews` : 'Top Rated Home Kitchen'}
          </div>
        </div>

      </div>

      {/* Live Requests Banner Card */}
      {liveRequest && (
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-400 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500 animate-pulse" />
              <h3 className="text-sm font-black text-[#111827]">⚡ NEW LIVE REQUEST AVAILABLE</h3>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-lg flex items-center gap-1">
              <Clock size={13} />
              <span>00:{(liveRequest.secondsLeft || 60).toString().padStart(2, '0')}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-sm font-black text-[#111827]">{liveRequest.items}</div>
              <div className="text-xs text-[#6B7280]">{liveRequest.time}</div>
            </div>

            <div className="text-xs text-[#6B7280]">
              <div>📍 {liveRequest.distance}</div>
            </div>

            <div className="text-base font-black text-[#0A8B5F]">
              ₹{liveRequest.price}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLiveRequest(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-[#4B5563] font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptLiveRequest}
                className="flex-1 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Accept Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row: Today's Orders & Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Today's Active Orders Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
            <h3 className="text-base font-black text-[#111827]">Today's Active Orders</h3>
            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#0A8B5F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {todaysOrders.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280] space-y-2">
              <ShoppingBag size={24} className="mx-auto text-[#0A8B5F]" />
              <div className="font-extrabold text-[#111827]">No active orders right now</div>
              <p className="text-[11px]">When customers place new orders, they will show up here live.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysOrders.map(ord => (
                <div key={ord.id} className="p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0A8B5F]">{ord.id}</span>
                      <span className="font-extrabold text-xs text-[#111827]">{ord.customer}</span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] mt-0.5">{ord.items} • {ord.time}</div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border ${ord.statusBg}`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operational Capacity & Delivery Status Widgets (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Kitchen Capacity Widget */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-2">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">KITCHEN CAPACITY</h4>
              <button onClick={() => onNavigateTab('capacity')} className="text-[10px] text-[#0A8B5F] hover:underline">Manage</button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span>{kitchenCapacity.cookedMeals} / {kitchenCapacity.maxMeals} meals</span>
                <span className="text-[#0A8B5F]">{Math.max(0, kitchenCapacity.maxMeals - kitchenCapacity.cookedMeals)} remaining</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-[#E5ECE8]">
                <div 
                  className="h-full bg-[#0A8B5F] rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((kitchenCapacity.cookedMeals / kitchenCapacity.maxMeals) * 100))}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Delivery Status Widget */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-2">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">DELIVERY STATUS</h4>
              <button onClick={() => onNavigateTab('orders-delivery')} className="text-[10px] text-[#0A8B5F] hover:underline">View Delivery</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800">
                <span>● {deliveryCounts.ready} orders ready for pickup</span>
                <span className="font-black">Ready</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-blue-800">
                <span>● {deliveryCounts.assigned} delivery partners assigned</span>
                <span className="font-black">Assigned</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-800">
                <span>● {deliveryCounts.searching} awaiting partner arrival</span>
                <span className="font-black">Searching</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Daily & Previous Orders Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5ECE8] overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#0A8B5F] text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <FileText size={22} />
                  <span>Daily & Previous Orders Report</span>
                </h2>
                <p className="text-xs opacity-90 font-medium mt-1">
                  Filter, review, and export real-time order history by formatted date
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Controls Toolbar */}
            <div className="p-4 bg-[#F9FBF9] border-b border-[#E5ECE8] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {[
                  { id: 'today', label: "Today's Orders" },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: 'all', label: 'All Previous Orders' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReportFilter(tab.id)}
                    className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      reportFilter === tab.id
                        ? 'bg-[#0A8B5F] text-white shadow-xs'
                        : 'bg-white text-[#4B5563] border border-[#E5ECE8] hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSVReport}
                  className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download size={15} />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-gray-300"
                >
                  <Printer size={15} />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {/* Summary Statistics Pill Header */}
            {(() => {
              const currentList = getFilteredReportOrders();
              const totalRev = currentList.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
              const completedCount = currentList.filter(o => o.status === 'Completed' || o.status === 'Ready' || o.status === 'Preparing').length;
              const cancelledCount = currentList.filter(o => o.status === 'Cancelled').length;

              return (
                <div className="p-6 border-b border-[#E5ECE8] grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white">
                  <div className="p-4 rounded-2xl bg-[#F9FBF9] border border-[#E5ECE8]">
                    <div className="text-[11px] font-bold text-[#6B7280] uppercase">Selected Orders</div>
                    <div className="text-2xl font-black text-[#111827] mt-1">{currentList.length}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase">Total Revenue</div>
                    <div className="text-2xl font-black text-emerald-900 mt-1">₹{totalRev.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="text-[11px] font-bold text-blue-700 uppercase">Completed / Active</div>
                    <div className="text-2xl font-black text-blue-900 mt-1">{completedCount}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="text-[11px] font-bold text-rose-700 uppercase">Cancelled</div>
                    <div className="text-2xl font-black text-rose-900 mt-1">{cancelledCount}</div>
                  </div>
                </div>
              );
            })()}

            {/* Formatted Date Orders Table */}
            <div className="p-6 flex-1 overflow-y-auto">
              {getFilteredReportOrders().length === 0 ? (
                <div className="p-12 text-center text-[#6B7280]">
                  <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                  <div className="font-extrabold text-[#111827]">No orders found for selected date range</div>
                  <p className="text-xs mt-1">Try switching tabs to view previous orders or today's orders.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5ECE8] text-[#6B7280] uppercase font-black tracking-wider">
                      <th className="pb-3 px-2">Date & Time (DD/MM/YYYY)</th>
                      <th className="pb-3 px-2">Order ID</th>
                      <th className="pb-3 px-2">Customer</th>
                      <th className="pb-3 px-2">Tiffin Item</th>
                      <th className="pb-3 px-2">Amount</th>
                      <th className="pb-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECE8] font-medium text-[#111827]">
                    {getFilteredReportOrders().map(o => (
                      <tr key={o._id || o.orderId} className="hover:bg-[#F9FBF9]">
                        <td className="py-3 px-2 font-bold text-[#4B5563]">
                          {formatDateFormatted(o.createdAt || o.date)}
                        </td>
                        <td className="py-3 px-2 font-black text-[#0A8B5F]">{o.orderId}</td>
                        <td className="py-3 px-2">
                          <div className="font-bold">{o.customerName}</div>
                          <div className="text-[10px] text-[#6B7280]">{o.customerPhone}</div>
                        </td>
                        <td className="py-3 px-2 text-[#4B5563]">
                          {o.tiffinName} <span className="font-extrabold text-[#111827]">(x{o.quantity || 1})</span>
                        </td>
                        <td className="py-3 px-2 font-black text-[#111827]">₹{o.totalAmount}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                            o.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'Preparing' ? 'bg-amber-100 text-amber-800' :
                            o.status === 'Ready' ? 'bg-blue-100 text-blue-800' :
                            o.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F9FBF9] border-t border-[#E5ECE8] flex items-center justify-between text-xs text-[#6B7280]">
              <span className="font-bold">Total {getFilteredReportOrders().length} orders loaded</span>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-[#111827] font-black rounded-xl transition-all cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
