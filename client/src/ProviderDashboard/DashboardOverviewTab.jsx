import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  ShoppingBag, 
  Clock,
  Sparkles,
  Utensils,
  Zap,
  MapPin,
  Flame,
  PlusCircle,
  CalendarCheck,
  Package,
  Wallet,
  ShieldCheck,
  Minus,
  Plus,
  AlertCircle
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export default function DashboardOverviewTab({ currentUser, onNavigateTab, isOnline: propsIsOnline, onToggleOnline }) {
  const providerName = currentUser?.name?.split(' ')[0] || 'Priya';

  // Stats state initialized with realistic fallbacks and synced via MongoDB
  const [stats, setStats] = useState({
    todaysOrdersCount: 12,
    activeTiffinsCount: 8,
    todaysCustomersCount: 19,
    revenueToday: 4280,
    liveRequestsCount: 18
  });

  // Capacity state
  const [capacity, setCapacity] = useState({
    max: 40,
    used: 32
  });

  // Countdown timer state for Live Request
  const [timerSeconds, setTimerSeconds] = useState(42);

  // Live Requests sample list state
  const [liveRequests, setLiveRequests] = useState([
    {
      id: 'REQ-1092',
      mealTitle: 'Veg Deluxe Tiffin',
      quantity: 2,
      time: 'Today, 5:00 PM',
      distance: '1.8 km away',
      location: 'Satellite Road, Ahmedabad',
      fulfillment: 'Delivery',
      budget: 120,
      matchScore: 94,
      matchCriteria: [
        'Within your delivery radius',
        'You serve Veg meals',
        'Available at 5:00 PM',
        'Kitchen capacity available',
        'Customer budget matches'
      ]
    }
  ]);

  // Today's Orders list
  const [todaysOrders, setTodaysOrders] = useState([
    { id: '#TL1024', customer: 'Rahul Shah', meal: 'Veg Tiffin', qty: '2 meals', time: '5:00 PM', fulfillment: 'Delivery', amount: 240, status: 'Preparing', statusBg: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: '#TL1025', customer: 'Meera Patel', meal: 'Jain Meal', qty: '1 meal', time: '5:30 PM', fulfillment: 'Pickup', amount: 130, status: 'Accepted', statusBg: 'bg-blue-100 text-blue-800 border-blue-300' },
    { id: '#TL1026', customer: 'Amit Joshi', meal: 'Veg Tiffin', qty: '3 meals', time: '7:00 PM', fulfillment: 'Delivery', amount: 360, status: 'Ready', statusBg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: '#TL1027', customer: 'Neha Shah', meal: 'Veg Tiffin', qty: '1 meal', time: '7:30 PM', fulfillment: 'Delivery', amount: 120, status: 'Scheduled', statusBg: 'bg-slate-100 text-slate-700 border-slate-300' }
  ]);

  const [toastMessage, setToastMessage] = useState(null);
  const [revenueFilter, setRevenueFilter] = useState('7 Days');

  // Real-time Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 42));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // MongoDB Fetch
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/providers/dashboard');
        const json = await response.json();
        if (json.success && json.data) {
          setStats(prev => ({
            ...prev,
            todaysOrdersCount: json.data.todaysOrdersCount || prev.todaysOrdersCount,
            activeTiffinsCount: json.data.activeTiffinsCount || prev.activeTiffinsCount,
            todaysCustomersCount: json.data.todaysCustomersCount || prev.todaysCustomersCount,
            revenueToday: json.data.revenueToday || prev.revenueToday
          }));
        }
      } catch (err) {
        console.error('Error fetching MongoDB dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAcceptLiveRequest = (reqId, amount) => {
    showToast(`🎉 Request ${reqId} Accepted! Order added to Today's Orders.`);
    // Update stats optimistically
    setStats(prev => ({
      ...prev,
      todaysOrdersCount: prev.todaysOrdersCount + 1,
      revenueToday: prev.revenueToday + amount
    }));
    setCapacity(prev => ({ ...prev, used: Math.min(prev.max, prev.used + 2) }));
    // Remove request from live list
    setLiveRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleDeclineLiveRequest = (reqId) => {
    showToast(`Request ${reqId} declined.`);
    setLiveRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleAdjustCapacity = (delta) => {
    setCapacity(prev => {
      const nextMax = Math.max(prev.used, prev.max + delta);
      showToast(`Kitchen maximum capacity updated to ${nextMax} meals.`);
      return { ...prev, max: nextMax };
    });
  };

  const remainingCapacity = Math.max(0, capacity.max - capacity.used);
  const isCapacityFull = remainingCapacity === 0;

  return (
    <div className="space-y-6 animate-slide-up relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. DASHBOARD HEADER & QUICK ACTIONS */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E2E8F0] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Good afternoon, {providerName} 👋</h1>
              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${
                propsIsOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                ● {propsIsOnline ? 'Accepting Requests' : 'Kitchen Paused'}
              </span>
            </div>
            <p className="text-xs font-medium text-[#64748B] mt-1">Here's what's happening with your tiffin service today.</p>
          </div>

          {/* Online Toggle & Primary Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleOnline}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                propsIsOnline ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${propsIsOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              <span>{propsIsOnline ? '🟢 ONLINE' : '⚪ OFFLINE'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('add-tiffin')}
              className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#076a48] text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>+ Add Meal</span>
            </button>
          </div>
        </div>

        {/* Quick Action Buttons Toolbar */}
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-[#94A3B8] tracking-wider mr-1">Quick Actions:</span>
          
          <button 
            onClick={() => onNavigateTab('add-tiffin')}
            className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F0EC] border border-[#E2E8F0] text-[#0F172A] hover:text-[#0A8B5F] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Utensils size={13} className="text-[#0A8B5F]" />
            <span>+ Add Tiffin</span>
          </button>

          <button 
            onClick={() => onNavigateTab('availability')}
            className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F0EC] border border-[#E2E8F0] text-[#0F172A] hover:text-[#0A8B5F] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck size={13} className="text-[#0A8B5F]" />
            <span>📅 Set Availability</span>
          </button>

          <button 
            onClick={() => handleAdjustCapacity(5)}
            className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F0EC] border border-[#E2E8F0] text-[#0F172A] hover:text-[#0A8B5F] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package size={13} className="text-[#0A8B5F]" />
            <span>📦 Update Capacity (+5)</span>
          </button>

          <button 
            onClick={() => onNavigateTab('earnings')}
            className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F0EC] border border-[#E2E8F0] text-[#0F172A] hover:text-[#0A8B5F] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet size={13} className="text-[#0A8B5F]" />
            <span>💰 Withdraw Earnings</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Live Requests */}
        <div 
          onClick={() => onNavigateTab('live-requests')}
          className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              <span>Live Requests</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
              Waiting
            </span>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight flex items-baseline gap-2">
            <AnimatedCounter value={stats.liveRequestsCount} duration={700} />
            <span className="text-xs font-extrabold text-amber-600">nearby</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-2">
            <span>⚡ +24% today</span>
          </div>
        </div>

        {/* Metric 2: Today's Orders */}
        <div 
          onClick={() => onNavigateTab('orders')}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <ShoppingBag size={16} className="text-[#0A8B5F]" />
              <span>Today's Orders</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-[#0A8B5F] text-[10px] font-black rounded-full">
              Active
            </span>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            <AnimatedCounter value={stats.todaysOrdersCount} duration={800} />
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-bold mt-2">📦 +3 from yesterday</div>
        </div>

        {/* Metric 3: Revenue Today */}
        <div 
          onClick={() => onNavigateTab('earnings')}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <TrendingUp size={16} className="text-[#0A8B5F]" />
              <span>Today's Revenue</span>
            </div>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight">
            <AnimatedCounter value={stats.revenueToday} prefix="₹" duration={1000} />
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-bold mt-2">📈 +12.4% vs target</div>
        </div>

        {/* Metric 4: Provider Rating */}
        <div 
          onClick={() => onNavigateTab('reviews')}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <Sparkles size={16} className="text-amber-500" />
              <span>Provider Rating</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full">
              Excellent
            </span>
          </div>
          <div className="text-3xl font-black text-[#0F172A] tracking-tight flex items-baseline gap-2">
            <span>4.8</span>
            <span className="text-amber-500 text-xl">★</span>
          </div>
          <div className="text-[11px] text-[#64748B] font-semibold mt-2">126 verified reviews</div>
        </div>

      </div>

      {/* 3. SIGNATURE LIVE REQUESTS MODULE (HIGH VISUAL PRIORITY) */}
      <div className="bg-gradient-to-br from-white to-amber-50/40 rounded-2xl p-6 border-2 border-amber-300 shadow-md space-y-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-black text-[#0F172A] tracking-tight flex items-center gap-2">
              <Zap className="text-amber-500 fill-amber-500" size={20} />
              <span>LIVE REQUESTS NEAR YOU</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-xl shadow-xs">
              8 Requests Nearby
            </span>
          </div>
        </div>

        {/* Live Requests Container */}
        {liveRequests.length > 0 ? (
          <div className="space-y-4">
            {liveRequests.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs space-y-4">
                
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      NEW REQUEST
                    </span>
                    <span className="text-xs font-bold text-[#64748B]">{req.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    <Clock size={14} />
                    <span>Expires in 00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</span>
                  </div>
                </div>

                {/* Request Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Left Specs (7 Cols) */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-[#0F172A]">🍱 {req.mealTitle}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                        {req.quantity} Meals
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#475569]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#0A8B5F]" />
                        <span>Required: <strong className="text-[#0F172A]">{req.time}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-red-500" />
                        <span>Distance: <strong className="text-[#0F172A]">{req.distance}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-[#0A8B5F]" />
                        <span>Type: <strong className="text-[#0F172A]">{req.fulfillment}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Wallet size={14} className="text-emerald-600" />
                        <span>Budget: <strong className="text-emerald-700 text-sm">₹{req.budget}</strong></span>
                      </div>
                    </div>

                    <div className="text-xs text-[#64748B] font-semibold flex items-center gap-1 pt-1">
                      <MapPin size={13} className="text-[#94A3B8]" />
                      <span>{req.location}</span>
                    </div>
                  </div>

                  {/* Right Match Score Intelligence (5 Cols) */}
                  <div className="md:col-span-5 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#0F172A] uppercase tracking-wider">
                        MATCH INTELLIGENCE
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">
                        {req.matchScore}% Match
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0A8B5F] h-full rounded-full" style={{ width: `${req.matchScore}%` }} />
                    </div>

                    <div className="space-y-1 text-[11px] font-bold text-slate-600">
                      {req.matchCriteria.map((crit, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-[#0A8B5F] shrink-0" />
                          <span>{crit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={() => handleDeclineLiveRequest(req.id)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Decline
                  </button>

                  <button
                    onClick={() => handleAcceptLiveRequest(req.id, req.budget)}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#076a48] text-white text-xs font-black rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                  >
                    <span>Accept Request → (₹{req.budget})</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-amber-200 text-center space-y-2">
            <div className="text-2xl">🎉</div>
            <p className="text-xs font-bold text-[#0F172A]">All active nearby requests accepted!</p>
            <p className="text-[11px] text-[#64748B]">New tiffin requests will appear here automatically in real time.</p>
          </div>
        )}
      </div>

      {/* 4. TODAY'S ORDERS & KITCHEN CAPACITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Today's Orders Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Today's Orders</h3>
              <p className="text-[11px] text-[#64748B] font-medium">Orders requiring preparation and fulfillment today.</p>
            </div>

            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#0A8B5F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Orders →</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[10px] font-black uppercase text-[#94A3B8] tracking-wider">
                  <th className="py-2.5 px-2">Order</th>
                  <th className="py-2.5 px-2">Customer</th>
                  <th className="py-2.5 px-2">Meal</th>
                  <th className="py-2.5 px-2">Time</th>
                  <th className="py-2.5 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {todaysOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-2 font-black text-[#0A8B5F]">{ord.id}</td>
                    <td className="py-3 px-2 font-extrabold text-[#0F172A]">{ord.customer}</td>
                    <td className="py-3 px-2 font-bold text-[#475569]">{ord.meal} ({ord.qty})</td>
                    <td className="py-3 px-2 font-bold text-[#0F172A]">{ord.time}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${ord.statusBg}`}>
                        ● {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Kitchen Capacity & Demand Near You (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Kitchen Capacity Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="text-[#0A8B5F]" size={18} />
                <h3 className="text-sm font-extrabold text-[#0F172A]">Today's Kitchen Capacity</h3>
              </div>
              
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                <button
                  onClick={() => handleAdjustCapacity(-2)}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Decrease Capacity"
                >
                  <Minus size={13} />
                </button>
                <span className="text-xs font-black text-[#0F172A] px-1">{capacity.max} Max</span>
                <button
                  onClick={() => handleAdjustCapacity(2)}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Increase Capacity"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-extrabold">
                <span className="text-[#0F172A]">{capacity.used} / {capacity.max} Meals Used</span>
                <span className={isCapacityFull ? 'text-red-600' : 'text-[#0A8B5F]'}>
                  {isCapacityFull ? 'FULL' : `${remainingCapacity} Meals Remaining`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCapacityFull ? 'bg-red-500' : (capacity.used / capacity.max > 0.8 ? 'bg-amber-500' : 'bg-[#0A8B5F]')
                  }`}
                  style={{ width: `${Math.min(100, (capacity.used / capacity.max) * 100)}%` }}
                />
              </div>

              {isCapacityFull ? (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>🔴 CAPACITY FULL — New requests automatically paused.</span>
                </div>
              ) : (
                <p className="text-[11px] text-[#64748B] font-medium">
                  Capacity controls how many meal requests your kitchen accepts daily.
                </p>
              )}
            </div>
          </div>

          {/* Demand Near You Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="text-amber-500 fill-amber-500" size={18} />
                <h3 className="text-sm font-extrabold text-[#0F172A]">Demand Around You</h3>
              </div>

              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase">
                🔥 High Demand
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-[#64748B]">
                <strong className="text-[#0F172A] text-base">14 requests</strong> active within 5 km of your location.
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs font-black text-[#0F172A]">8</div>
                  <div className="text-[10px] text-[#64748B] font-bold">Veg</div>
                </div>

                <div className="p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs font-black text-[#0F172A]">3</div>
                  <div className="text-[10px] text-[#64748B] font-bold">Jain</div>
                </div>

                <div className="p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs font-black text-[#0F172A]">2</div>
                  <div className="text-[10px] text-[#64748B] font-bold">Non-Veg</div>
                </div>

                <div className="p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs font-black text-[#0F172A]">1</div>
                  <div className="text-[10px] text-[#64748B] font-bold">Healthy</div>
                </div>
              </div>

              <button 
                onClick={() => onNavigateTab('live-requests')}
                className="w-full py-2 bg-[#F8FAFC] hover:bg-[#E8F0EC] text-[#0A8B5F] text-xs font-extrabold rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <span>View Demand Map →</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 5. PROVIDER TRUST SCORE & UPCOMING SCHEDULE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Provider Trust Score (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-[#0A8B5F]" size={20} />
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Provider Trust Score</h3>
                <p className="text-[11px] text-[#64748B] font-medium">Influences request matching priority on TiffinLink.</p>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#0A8B5F] font-black text-lg flex items-center justify-center border border-[#C5DDD2]">
              94
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-0.5">
              <div className="text-[10px] font-bold text-[#64748B] uppercase">Acceptance Rate</div>
              <div className="text-lg font-black text-emerald-600">92%</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-0.5">
              <div className="text-[10px] font-bold text-[#64748B] uppercase">On-Time Rate</div>
              <div className="text-lg font-black text-emerald-600">96%</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-0.5">
              <div className="text-[10px] font-bold text-[#64748B] uppercase">Cancellation</div>
              <div className="text-lg font-black text-emerald-600">2%</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-0.5">
              <div className="text-[10px] font-bold text-[#64748B] uppercase">Retention Rate</div>
              <div className="text-lg font-black text-[#0F172A]">74%</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-0.5">
              <div className="text-[10px] font-bold text-[#64748B] uppercase">Food Quality</div>
              <div className="text-lg font-black text-amber-600">4.9 ★</div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-0.5">
              <div className="text-[10px] font-bold text-[#64748B] uppercase">Status</div>
              <div className="text-xs font-black text-[#0A8B5F] pt-1">Top Rated</div>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Schedule (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A]">Upcoming Fulfillment Schedule</h3>
              <p className="text-[11px] text-[#64748B] font-medium">Batch preparation time windows today.</p>
            </div>

            <button 
              onClick={() => onNavigateTab('availability')}
              className="text-xs font-bold text-[#0A8B5F] hover:underline cursor-pointer"
            >
              Manage Availability →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-2">
              <div className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider">TODAY</div>
              
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-lg">5:00 PM</div>
                  <div>
                    <div className="font-extrabold text-[#0F172A]">8 × Veg Tiffin</div>
                    <div className="text-[10px] text-[#64748B]">Fulfillment: Delivery</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md">8 Ready</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-blue-100 text-blue-800 font-extrabold rounded-lg">5:30 PM</div>
                  <div>
                    <div className="font-extrabold text-[#0F172A]">4 × Jain Tiffin</div>
                    <div className="text-[10px] text-[#64748B]">Fulfillment: Pickup</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-md">4 Preparing</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 6. REVENUE CHART */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Revenue Overview</h3>
            <p className="text-[11px] text-[#64748B] font-medium">Tracking estimated earnings over time.</p>
          </div>

          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            {['Today', '7 Days', '30 Days', '3 Months'].map(period => (
              <button
                key={period}
                onClick={() => setRevenueFilter(period)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  revenueFilter === period ? 'bg-[#0A8B5F] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] flex flex-col items-center justify-center min-h-[200px]">
          <svg className="w-full h-44" viewBox="0 0 500 150" fill="none">
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A8B5F" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0A8B5F" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M 0 120 Q 80 80, 160 100 T 320 40 T 420 70 T 500 10 L 500 150 L 0 150 Z" fill="url(#revGradient)" />
            <path d="M 0 120 Q 80 80, 160 100 T 320 40 T 420 70 T 500 10" stroke="#0A8B5F" strokeWidth="3.5" fill="none" />
            <circle cx="320" cy="40" r="5" fill="#0A8B5F" stroke="#FFF" strokeWidth="2" />
            <circle cx="500" cy="10" r="5" fill="#0A8B5F" stroke="#FFF" strokeWidth="2" />
          </svg>
          <div className="flex justify-between w-full text-[11px] text-[#64748B] font-bold pt-2 border-t border-[#E2E8F0]">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

    </div>
  );
}
