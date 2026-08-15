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
  Utensils
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export default function DashboardOverviewTab({ currentUser, onNavigateTab }) {
  const providerName = currentUser?.name || 'Zaid';

  const [stats, setStats] = useState({
    todaysOrdersCount: 24,
    activeTiffinsCount: 8,
    todaysCustomersCount: 19,
    revenueToday: 4850
  });

  const [todaysOrders, setTodaysOrders] = useState([
    { id: '#1024', customer: 'Raj Patel', amount: 240, qtyText: '2 Tiffin', status: 'Preparing', statusBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: '#1025', customer: 'Amit Shah', amount: 360, qtyText: '3 Tiffin', status: 'Ready', statusBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: '#1026', customer: 'Neha Patel', amount: 120, qtyText: '1 Tiffin', status: 'Delivered', statusBg: 'bg-[#E8F0EC] text-[#0A8B5F] border-[#C5DDD2]' }
  ]);

  const [acceptingOrders, setAcceptingOrders] = useState(() => {
    return localStorage.getItem('tiffinlink_provider_accepting_orders') !== 'false';
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Real-time Database Fetching from MongoDB
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/providers/dashboard');
        const json = await response.json();
        if (json.success && json.data) {
          setStats({
            todaysOrdersCount: json.data.todaysOrdersCount,
            activeTiffinsCount: json.data.activeTiffinsCount,
            todaysCustomersCount: json.data.todaysCustomersCount,
            revenueToday: json.data.revenueToday
          });
          if (Array.isArray(json.data.todaysOrders) && json.data.todaysOrders.length > 0) {
            setTodaysOrders(json.data.todaysOrders);
          }
        }
      } catch (err) {
        console.error('Error fetching MongoDB dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, []);

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
      await fetch('http://localhost:5000/api/providers/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingOrders: nextState, email: currentUser?.email })
      });
    } catch (err) {
      console.error('Error syncing status to MongoDB:', err);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 animate-slide-up relative">
      {/* Real-time Status Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#111827] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Good Morning Greeting Hero Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Good Morning, {providerName} 👋</h1>
          <p className="text-xs font-medium text-[#6B7280] mt-1">Here's what's happening with your Tiffin business today.</p>
        </div>
        
        {/* Real-Time Animated Accepting Orders Toggle Switch */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#F9FBF9] px-4 py-2.5 rounded-xl border border-[#E5ECE8]">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${acceptingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs font-bold text-[#111827]">
              {acceptingOrders ? 'Accepting Orders' : 'Kitchen Paused'}
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

      {/* Top 4 Metrics Grid with Real-Time Animated Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Today's Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <ShoppingBag size={15} className="text-[#0A8B5F]" />
            <span>Today's Orders</span>
          </div>
          <div className="text-3xl font-black text-[#111827] tracking-tight">
            <AnimatedCounter value={stats.todaysOrdersCount} duration={900} />
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold flex items-center gap-1 mt-2">
            <span>📈 +12% today</span>
          </div>
        </div>

        {/* Metric 2: Active Tiffins */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <Utensils size={15} className="text-[#0A8B5F]" />
            <span>Active Tiffins</span>
          </div>
          <div className="text-3xl font-black text-[#111827] tracking-tight">
            <AnimatedCounter value={stats.activeTiffinsCount} duration={800} />
          </div>
          <div className="text-[11px] text-[#6B7280] font-medium mt-2">{stats.activeTiffinsCount} available for orders</div>
        </div>

        {/* Metric 3: Today's Customers */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <Users size={15} className="text-[#0A8B5F]" />
            <span>Today's Customers</span>
          </div>
          <div className="text-3xl font-black text-[#111827] tracking-tight">
            <AnimatedCounter value={stats.todaysCustomersCount} duration={1000} />
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold mt-2">+4 new today</div>
        </div>

        {/* Metric 4: Revenue Today */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <TrendingUp size={15} className="text-[#0A8B5F]" />
            <span>Revenue Today</span>
          </div>
          <div className="text-3xl font-black text-[#111827] tracking-tight">
            <AnimatedCounter value={stats.revenueToday} prefix="₹" duration={1200} />
          </div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold mt-2">📈 +18% vs yesterday</div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Today's Orders (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#111827]">Today's Orders</h3>
            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#0A8B5F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Orders</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {todaysOrders.map(ord => (
              <div key={ord.id} className="p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] flex items-center justify-between food-card-hover">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0A8B5F]">{ord.id}</span>
                    <span className="font-extrabold text-sm text-[#111827]">{ord.customer}</span>
                  </div>
                  <div className="text-xs text-[#6B7280] mt-0.5 font-medium">{ord.qtyText}</div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm font-black text-[#111827]">₹{ord.amount}</div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${ord.statusBg}`}>
                    ● {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Revenue Overview Chart (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#111827]">Revenue Overview</h3>
            <select className="text-xs font-bold bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] rounded-xl px-3 py-1.5 focus:outline-none">
              <option>This Week</option>
              <option>This Month</option>
              <option>Today</option>
            </select>
          </div>

          <div className="w-full bg-[#F9FBF9] rounded-xl p-4 border border-[#E5ECE8] flex flex-col items-center justify-center min-h-[220px]">
            <svg className="w-full h-44" viewBox="0 0 500 150" fill="none">
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A8B5F" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0A8B5F" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0 120 Q 80 80, 160 100 T 320 40 T 420 70 T 500 10 L 500 150 L 0 150 Z" fill="url(#revGradient)" />
              <path d="M 0 120 Q 80 80, 160 100 T 320 40 T 420 70 T 500 10" stroke="#0A8B5F" strokeWidth="3.5" fill="none" className="animated-chart-line" />
              <circle cx="320" cy="40" r="5" fill="#0A8B5F" stroke="#FFF" strokeWidth="2" />
              <circle cx="500" cy="10" r="5" fill="#0A8B5F" stroke="#FFF" strokeWidth="2" />
            </svg>
            <div className="flex justify-between w-full text-[11px] text-[#6B7280] font-bold pt-2 border-t border-[#E5ECE8]">
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
    </div>
  );
}
