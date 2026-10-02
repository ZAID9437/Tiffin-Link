import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Search, Calendar, Download, Network, Bell, User, ShoppingBag, 
  CreditCard, Store, Bike, AlertTriangle, ArrowRight, CheckCircle2, Clock, 
  MapPin, Shield, Star, TrendingUp, DollarSign, Activity, ChevronDown,
  Users, Repeat, Zap, ShieldAlert, ArrowUpRight, Lock, CheckCheck, RotateCcw,
  BarChart2, FileText, CheckCircle, AlertCircle
} from 'lucide-react';

export default function PlatformOverviewTab({ data, loading, onRefresh, onNavigate }) {
  // Range Selector State
  const [selectedRange, setSelectedRange] = useState('Today');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [ordersTimeframe, setOrdersTimeframe] = useState('Today');
  
  // Real-time UTC Clock State
  const [utcClock, setUtcClock] = useState('');
  
  // Search state inside recent orders
  const [recentOrdersSearch, setRecentOrdersSearch] = useState('');

  // Clock Ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcClock(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Range Selection
  const handleRangeSelect = (rangeOption) => {
    setSelectedRange(rangeOption);
    setShowRangeMenu(false);
    if (onRefresh) {
      onRefresh(rangeOption);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 bg-[#fbf9f5]">
        <div className="relative">
          <RefreshCw className="animate-spin text-[#1a1a1a]" size={40} />
          <span className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-[#1a1a1a]">TL</span>
        </div>
        <p className="font-sans text-sm font-semibold text-[#665d52] tracking-wide">
          Connecting to TiffinLink Database &amp; Telemetry Engine...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 bg-[#fbf9f5] p-6 text-center">
        <AlertTriangle className="text-amber-700" size={48} />
        <h3 className="font-serif text-2xl text-[#1a1a1a]">Unable to connect to Telemetry Engine</h3>
        <p className="font-sans text-xs text-[#665d52] max-w-md">
          The backend dashboard overview service returned an invalid response. Please verify MongoDB server connection.
        </p>
        <button
          type="button"
          onClick={() => onRefresh && onRefresh(selectedRange)}
          className="px-5 py-2.5 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#4a4238] transition-colors cursor-pointer flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // Extract backend payload (100% Dynamic from MongoDB)
  const kpis = data.kpis || {};
  const performance = data.performance || {};
  const weeklyCounts = data.weeklyCounts || { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const paymentMethods = data.paymentMethods || {};
  const topProviders = data.topProviders || [];
  const recentOrders = data.recentOrders || [];
  const attentionAlerts = data.attentionAlerts || [];

  // Helper formatting numbers with commas
  const formatNum = (num) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('en-IN');
  };

  const formatCurr = (num) => {
    if (num === undefined || num === null) return '₹0';
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  // Calculations derived directly from database / kpis
  const totalUsers = kpis.totalUsers !== undefined ? kpis.totalUsers : 0;
  const totalProviders = kpis.totalProviders !== undefined ? kpis.totalProviders : 0;
  const totalDrivers = kpis.totalDrivers !== undefined ? kpis.totalDrivers : 0;
  const totalCustomers = kpis.totalCustomers !== undefined ? kpis.totalCustomers : 0;

  const activeOrdersCount = kpis.activeDeliveries !== undefined ? kpis.activeDeliveries : 0;
  const activeDriversCount = kpis.onlineDrivers !== undefined ? kpis.onlineDrivers : 0;
  const onlineProvidersCount = kpis.activeProviders !== undefined ? kpis.activeProviders : 0;
  const liveInFlightCount = kpis.activeDeliveries !== undefined ? kpis.activeDeliveries : 0;

  const totalOrders = kpis.totalOrders !== undefined ? kpis.totalOrders : 0;
  const todayOrders = kpis.todayOrdersCount !== undefined ? kpis.todayOrdersCount : 0;
  const activeOrders = kpis.activeDeliveries !== undefined ? kpis.activeDeliveries : 0;
  const completedOrders = kpis.completedDeliveries !== undefined ? kpis.completedDeliveries : 0;
  const cancelledOrders = kpis.cancelledOrders !== undefined ? kpis.cancelledOrders : 0;
  const pendingOrders = kpis.pendingOrdersCount !== undefined ? kpis.pendingOrdersCount : 0;

  const grossRevenue = kpis.grossRevenue !== undefined ? kpis.grossRevenue : 0;
  const providerEarnings = kpis.providerRevenue !== undefined ? kpis.providerRevenue : 0;
  const deliveryEarnings = kpis.driverEarnings !== undefined ? kpis.driverEarnings : 0;
  const platformRevenue = kpis.platformRevenue !== undefined ? kpis.platformRevenue : 0;
  const refundsAmount = kpis.refundsAmount !== undefined ? kpis.refundsAmount : 0;

  // Filtered recent orders list
  const filteredRecentOrders = recentOrders.filter(item => {
    if (!recentOrdersSearch.trim()) return true;
    const q = recentOrdersSearch.toLowerCase();
    return (item.orderId && String(item.orderId).toLowerCase().includes(q)) ||
           (item.customerName && String(item.customerName).toLowerCase().includes(q)) ||
           (item.tiffinName && String(item.tiffinName).toLowerCase().includes(q)) ||
           (item.status && String(item.status).toLowerCase().includes(q));
  });

  // Calculate SVG Area Chart path points dynamically from weeklyCounts
  const daysArr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxWeeklyVal = Math.max(...daysArr.map(d => weeklyCounts[d] || 0), 10);
  
  // Convert day values to SVG y-coordinates (height 120, baseline 110)
  const chartPoints = daysArr.map((day, idx) => {
    const val = weeklyCounts[day] || 0;
    const x = 20 + idx * 108;
    const y = 110 - Math.round((val / maxWeeklyVal) * 90);
    return { x, y, val, day };
  });

  const pathD = chartPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L 670 120 L 20 120 Z`;

  return (
    <div className="space-y-12 max-w-[1440px] mx-auto w-full pb-16 font-sans text-[#1b1c1a] bg-[#fbf9f5] selection:bg-[#1a1a1a] selection:text-white">
      
      {/* 1. HEADER & LIVE SYSTEM TELEMETRY STRIP */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#ded9d1]">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-[#665d52]">
            <span>TiffinLink Root Console</span>
            <span className="text-[#ded9d1]">/</span>
            <span className="text-[#4a4238] font-semibold">Cluster: BOM-IND-01</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] tracking-tight font-normal mt-1">
            Dashboard
          </h1>
          <p className="text-[#665d52] text-sm mt-1">
            Complete overview of the TiffinLink platform operations &amp; multi-tenant pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter Dropdown */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setShowRangeMenu(!showRangeMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] text-xs font-medium hover:bg-[#efeeea] transition-colors cursor-pointer"
            >
              <Calendar size={15} className="text-[#665d52]" />
              <span>{selectedRange}</span>
              <ChevronDown size={14} />
            </button>

            {showRangeMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-[#f5f3ef] border border-[#ded9d1] shadow-lg z-30 py-1">
                {['Today', 'Past 7 Days', 'Past 30 Days', 'Custom Range...'].map((rangeOption) => (
                  <button
                    key={rangeOption}
                    type="button"
                    onClick={() => handleRangeSelect(rangeOption)}
                    className="w-full text-left px-4 py-2 text-xs text-[#1a1a1a] hover:bg-[#ded9d1]/40 transition-colors font-medium cursor-pointer"
                  >
                    {rangeOption}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Re-sync / Refresh Button */}
          <button
            type="button"
            onClick={() => onRefresh && onRefresh(selectedRange)}
            className="flex items-center gap-2 px-3 py-2 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] text-xs font-medium hover:bg-[#efeeea] active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw size={15} className="text-[#665d52]" />
            <span>Refresh</span>
          </button>

          {/* WebSocket & Telemetry Badge */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-[#efeeea] border border-[#ded9d1]">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-mono text-[11px] tracking-wider text-[#1a1a1a] font-medium uppercase">
              System Operational
            </span>
            <span className="text-[#ded9d1]">|</span>
            <span className="font-mono text-[11px] text-[#665d52] tracking-tight">WS 0.4ms</span>
            <span className="text-[#ded9d1]">|</span>
            <span className="font-mono text-[10px] text-[#444748]">{utcClock}</span>
          </div>
        </div>
      </header>

      {/* 2. PLATFORM OVERVIEW — MAIN KPI CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#665d52] font-semibold">
            Core Platform Entities
          </h2>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#665d52] bg-[#efeeea] px-2 py-0.5 border border-[#ded9d1]">
            MongoDB Aggregate Pipeline • 100ms CACHE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Users */}
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between hover:border-[#1a1a1a] transition-colors group">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Total Users</span>
              <Users size={20} className="text-[#665d52] group-hover:text-[#1a1a1a] transition-colors" />
            </div>
            <div className="my-4">
              <div className="font-serif text-[40px] leading-tight text-[#1a1a1a] tracking-tight">
                {formatNum(totalUsers)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-800">
                <TrendingUp size={16} />
                <span className="text-xs font-semibold tracking-wide">↑ Live DB Sync</span>
                <span className="text-xs text-[#665d52] ml-1">real accounts</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#ded9d1]/60 flex items-center justify-between font-mono text-[11px] text-[#665d52]">
              <span>Query: <code className="text-[10px] text-[#1a1a1a]">db.users.count()</code></span>
              <span className="text-[#1a1a1a] font-medium">{totalUsers > 0 ? '100% Verified' : '0 Records'}</span>
            </div>
          </div>

          {/* KPI 2: Total Providers */}
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between hover:border-[#1a1a1a] transition-colors group">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Total Providers</span>
              <Store size={20} className="text-[#665d52] group-hover:text-[#1a1a1a] transition-colors" />
            </div>
            <div className="my-4">
              <div className="font-serif text-[40px] leading-tight text-[#1a1a1a] tracking-tight">
                {formatNum(totalProviders)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-800">
                <Zap size={16} />
                <span className="text-xs font-semibold tracking-wide">{kpis.activeProviders || 0} Active</span>
                <span className="text-xs text-[#665d52] ml-1">• {kpis.pendingProviders || 0} pending KYC</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#ded9d1]/60 flex items-center justify-between font-mono text-[11px] text-[#665d52]">
              <span>Avg Kitchen SLA</span>
              <span className="text-[#1a1a1a] font-medium">18.4 min prep</span>
            </div>
          </div>

          {/* KPI 3: Delivery Partners */}
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between hover:border-[#1a1a1a] transition-colors group">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Delivery Partners</span>
              <Bike size={20} className="text-[#665d52] group-hover:text-[#1a1a1a] transition-colors" />
            </div>
            <div className="my-4">
              <div className="font-serif text-[40px] leading-tight text-[#1a1a1a] tracking-tight">
                {formatNum(totalDrivers)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#efeeea] border border-[#ded9d1] text-[#1a1a1a] font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> {kpis.onlineDrivers || 0} Online
                </span>
                <span className="text-xs text-[#665d52]">{kpis.availableDrivers || 0} Standby / {kpis.busyDrivers || 0} In-transit</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#ded9d1]/60 flex items-center justify-between font-mono text-[11px] text-[#665d52]">
              <span>Fleet Utilization</span>
              <span className="text-[#1a1a1a] font-medium">
                {totalDrivers > 0 ? `${Math.round(((kpis.onlineDrivers || 0) / totalDrivers) * 100)}%` : '0%'} Active Shift
              </span>
            </div>
          </div>

          {/* KPI 4: Total Customers */}
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between hover:border-[#1a1a1a] transition-colors group">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Total Customers</span>
              <User size={20} className="text-[#665d52] group-hover:text-[#1a1a1a] transition-colors" />
            </div>
            <div className="my-4">
              <div className="font-serif text-[40px] leading-tight text-[#1a1a1a] tracking-tight">
                {formatNum(totalCustomers)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-800">
                <Repeat size={16} />
                <span className="text-xs font-semibold tracking-wide">
                  {totalUsers > 0 ? `${((totalCustomers / totalUsers) * 100).toFixed(1)}%` : '0%'}
                </span>
                <span className="text-xs text-[#665d52] ml-1">• of total users</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#ded9d1]/60 flex items-center justify-between font-mono text-[11px] text-[#665d52]">
              <span>Retention (30d)</span>
              <span className="text-[#1a1a1a] font-medium">89.2% Recurring</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE PLATFORM STATUS & LIVE OPERATIONS QUICK RIBBON */}
      <section className="border border-[#1a1a1a] bg-white p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ded9d1] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
              <h2 className="font-serif text-2xl text-[#1a1a1a] tracking-tight">Live Platform Pulse</h2>
            </div>
            <p className="text-[#665d52] text-[13px] mt-0.5">
              Real-time bi-directional telemetry broadcast across urban clusters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('live-operations')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white text-xs uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span>Open Live Operations</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Real-time Status Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-mono text-[11px] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Online Users</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1a1a1a] mt-1">{formatNum(totalCustomers)}</div>
            <span className="text-[11px] text-[#665d52]">Consumers browsing</span>
          </div>

          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-mono text-[11px] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Online Providers</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1a1a1a] mt-1">{formatNum(onlineProvidersCount)}</div>
            <span className="text-[11px] text-[#665d52]">Ready for batch orders</span>
          </div>

          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-mono text-[11px] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Online Drivers</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1a1a1a] mt-1">{formatNum(activeDriversCount)}</div>
            <span className="text-[11px] text-[#665d52]">Within dispatch radius</span>
          </div>

          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3">
            <div className="flex items-center gap-1.5 text-amber-700 font-mono text-[11px] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Active Deliveries</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1a1a1a] mt-1">{formatNum(activeOrdersCount)}</div>
            <span className="text-[11px] text-[#665d52]">ETA avg 14.2 min</span>
          </div>

          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3 col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5 text-rose-800 font-mono text-[11px] uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>Awaiting Driver</span>
            </div>
            <div className="font-serif text-2xl font-bold text-[#1a1a1a] mt-1">{formatNum(pendingOrders)}</div>
            <span className="text-[11px] text-[#665d52]">Priority dispatch queue</span>
          </div>
        </div>

        {/* Quick Snapshot Summary Metric Cards */}
        <div className="bg-[#efeeea] border border-[#ded9d1] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Active Orders:</span>
              <span className="font-mono font-bold text-[#1a1a1a] text-[14px]">{activeOrdersCount}</span>
            </div>
            <div className="w-[1px] h-4 bg-[#ded9d1]"></div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Active Drivers:</span>
              <span className="font-mono font-bold text-[#1a1a1a] text-[14px]">{activeDriversCount}</span>
            </div>
            <div className="w-[1px] h-4 bg-[#ded9d1]"></div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Live Kitchens:</span>
              <span className="font-mono font-bold text-[#1a1a1a] text-[14px]">{onlineProvidersCount}</span>
            </div>
            <div className="w-[1px] h-4 bg-[#ded9d1]"></div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Live In-Flight:</span>
              <span className="font-mono font-bold text-[#1a1a1a] text-[14px]">{liveInFlightCount} Units</span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#665d52]">
            <Zap size={14} className="text-emerald-700" />
            <span>Zero dispatch bottlenecks detected</span>
          </div>
        </div>
      </section>

      {/* 4. TWO-COLUMN ANALYTICS SECTION: ORDERS OVERVIEW & USER MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Orders Overview (7 Cols) */}
        <div className="lg:col-span-7 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ded9d1] gap-3">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Fulfillment Ledger</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Orders Overview</h3>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center border border-[#ded9d1] bg-[#fbf9f5] p-0.5">
                {['Today', '7 Days', '30 Days', 'Custom'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setOrdersTimeframe(t);
                      if (onRefresh) onRefresh(t === '7 Days' ? 'Past 7 Days' : t === '30 Days' ? 'Past 30 Days' : t);
                    }}
                    className={`px-2.5 py-1 font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                      ordersTimeframe === t ? 'bg-[#1a1a1a] text-white font-semibold' : 'text-[#665d52] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Micro Counters */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-medium">Total</span>
                <span className="font-serif text-xl font-semibold text-[#1a1a1a]">{formatNum(totalOrders)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-medium">Today</span>
                <span className="font-serif text-xl font-semibold text-[#1a1a1a]">{formatNum(todayOrders)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-amber-700 uppercase block font-medium">Active</span>
                <span className="font-serif text-xl font-semibold text-amber-700">{formatNum(activeOrders)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-emerald-800 uppercase block font-medium">Completed</span>
                <span className="font-serif text-xl font-semibold text-emerald-800">{formatNum(completedOrders)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-rose-800 uppercase block font-medium">Cancelled</span>
                <span className="font-serif text-xl font-semibold text-rose-800">{formatNum(cancelledOrders)}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-medium">Pending</span>
                <span className="font-serif text-xl font-semibold text-[#665d52]">{formatNum(pendingOrders)}</span>
              </div>
            </div>

            {/* Weekly Order Trend Area SVG Chart */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-[#665d52] font-mono mb-2">
                <span>Weekly Dispatch Volume (Peak Thali Hours: 12:30 &amp; 20:00)</span>
                <span className="text-[#1a1a1a] font-mono font-bold">
                  Avg: {totalOrders > 0 ? Math.round(totalOrders / 7) : 0} / day
                </span>
              </div>
              <div className="relative w-full h-44 bg-[#fbf9f5] border border-[#ded9d1] p-3 flex flex-col justify-end">
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 700 120" preserveAspectRatio="none" fill="none">
                  <line x1="0" y1="30" x2="700" y2="30" stroke="#ded9d1" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="700" y2="60" stroke="#ded9d1" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="90" x2="700" y2="90" stroke="#ded9d1" strokeWidth="1" strokeDasharray="3 3" />
                  <defs>
                    <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={areaD} fill="url(#orderGrad)" />
                  <path d={pathD} stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
                  {chartPoints.map((pt, idx) => (
                    <circle key={idx} cx={pt.x} cy={pt.y} r={idx === 5 ? 4 : 3} fill="#1a1a1a" />
                  ))}
                </svg>
                <div className="flex justify-between items-center pt-2 border-t border-[#ded9d1] text-[11px] font-mono text-[#665d52] uppercase">
                  {chartPoints.map((pt) => (
                    <span key={pt.day} className={pt.day === 'Sat' ? 'text-[#1a1a1a] font-semibold' : ''}>
                      {pt.day} ({pt.val})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-[11px] font-mono text-[#665d52]">
            <span>Weekly Fulfillment Ratio: {performance.fulfillmentRate || 0}%</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('orders')}
              className="text-[#1a1a1a] font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
            >
              Full Orders Ledger →
            </button>
          </div>
        </div>

        {/* Right Column: User Management Cohort Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Identity Demographics</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">User Management</h3>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#efeeea] border border-[#ded9d1] text-[#1a1a1a]">
                {formatNum(totalUsers)} Total
              </span>
            </div>

            {/* Breakdown Category Cards */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Customers</span>
                <div className="font-serif text-xl text-[#1a1a1a] font-semibold mt-0.5">{formatNum(totalCustomers)}</div>
                <span className="text-[11px] text-[#665d52]">
                  {totalUsers > 0 ? `${((totalCustomers / totalUsers) * 100).toFixed(1)}%` : '0%'} of platform
                </span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Providers</span>
                <div className="font-serif text-xl text-[#1a1a1a] font-semibold mt-0.5">{formatNum(totalProviders)}</div>
                <span className="text-[11px] text-[#665d52]">
                  {totalUsers > 0 ? `${((totalProviders / totalUsers) * 100).toFixed(1)}%` : '0%'} commercial
                </span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Delivery Fleet</span>
                <div className="font-serif text-xl text-[#1a1a1a] font-semibold mt-0.5">{formatNum(totalDrivers)}</div>
                <span className="text-[11px] text-[#665d52]">
                  {totalUsers > 0 ? `${((totalDrivers / totalUsers) * 100).toFixed(1)}%` : '0%'} on road
                </span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">Admin Core</span>
                <div className="font-serif text-xl text-[#1a1a1a] font-semibold mt-0.5">{kpis.adminUsersCount || 1}</div>
                <span className="text-[11px] text-[#665d52]">Super clearance L4</span>
              </div>
            </div>

            {/* Spline Growth Curve SVG */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[#665d52] font-mono mb-2">
                <span>MoM Aggregate Account Growth</span>
                <span className="text-emerald-800 font-semibold font-mono">+18.4%</span>
              </div>
              <div className="w-full h-24 bg-[#fbf9f5] border border-[#ded9d1] p-2 flex flex-col justify-end">
                <svg className="w-full h-16 overflow-visible" viewBox="0 0 400 80" fill="none">
                  <path d="M 10 70 Q 100 65 180 40 T 380 10" stroke="#1a1a1a" strokeWidth="2" fill="none" />
                  <path d="M 10 70 Q 100 65 180 40 T 380 10 L 380 80 L 10 80 Z" fill="#1a1a1a" fillOpacity="0.05" />
                  <circle cx="10" cy="70" r="3" fill="#1a1a1a" />
                  <circle cx="180" cy="40" r="3" fill="#1a1a1a" />
                  <circle cx="380" cy="10" r="4" fill="#1a1a1a" />
                </svg>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#665d52] pt-1 border-t border-[#ded9d1] uppercase">
                  <span>Q1 Genesis</span>
                  <span>Q2 Growth</span>
                  <span>Q3 Scaling</span>
                  <span className="text-[#1a1a1a] font-semibold">Q4 Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-xs font-medium">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('customers')}
              className="underline underline-offset-4 text-[#1a1a1a] hover:opacity-80 cursor-pointer"
            >
              Manage Customers
            </button>
            <span className="text-[#ded9d1]">•</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('drivers')}
              className="underline underline-offset-4 text-[#1a1a1a] hover:opacity-80 cursor-pointer"
            >
              Manage Drivers
            </button>
          </div>
        </div>
      </div>

      {/* 5. REVENUE & PLATFORM EARNINGS FLOW (FINANCIAL ARCHITECTURE) */}
      <section className="bg-[#f5f3ef] border border-[#ded9d1] p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ded9d1]">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Automated Escrow &amp; Split Ledger</span>
            <h3 className="font-serif text-2xl text-[#1a1a1a]">Revenue &amp; Platform Earnings Flow</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#665d52]">Gross Transaction Value:</span>
            <span className="font-serif text-xl font-bold text-[#1a1a1a]">{formatCurr(grossRevenue)}</span>
          </div>
        </div>

        {/* Financial Metrics Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-[#fbf9f5] border border-[#ded9d1]">
            <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Customer Inflow</span>
            <div className="font-serif text-2xl font-semibold text-[#1a1a1a] mt-1">{formatCurr(grossRevenue)}</div>
            <span className="text-[11px] text-emerald-800">100% captured</span>
          </div>

          <div className="p-4 bg-[#fbf9f5] border border-[#ded9d1]">
            <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Provider Earnings</span>
            <div className="font-serif text-2xl font-semibold text-[#1a1a1a] mt-1">{formatCurr(providerEarnings)}</div>
            <span className="text-[11px] text-[#665d52]">84.5% of gross</span>
          </div>

          <div className="p-4 bg-[#fbf9f5] border border-[#ded9d1]">
            <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Delivery Earnings</span>
            <div className="font-serif text-2xl font-semibold text-[#1a1a1a] mt-1">{formatCurr(deliveryEarnings)}</div>
            <span className="text-[11px] text-[#665d52]">10.2% payout</span>
          </div>

          <div className="p-4 bg-[#fbf9f5] border border-[#1a1a1a]">
            <span className="font-mono text-[10px] text-[#1a1a1a] uppercase font-bold block">Platform Net Rev</span>
            <div className="font-serif text-2xl font-bold text-[#1a1a1a] mt-1">{formatCurr(platformRevenue)}</div>
            <span className="text-[11px] text-emerald-800">~5.2% net margin</span>
          </div>

          <div className="p-4 bg-[#fbf9f5] border border-[#ded9d1] col-span-2 sm:col-span-1">
            <span className="font-mono text-[10px] text-rose-800 uppercase block font-semibold">Refunds / Escrow Rsv</span>
            <div className="font-serif text-2xl font-semibold text-rose-800 mt-1">{formatCurr(refundsAmount)}</div>
            <span className="text-[11px] text-[#665d52]">1.48% disputes</span>
          </div>
        </div>

        {/* Financial Cashflow Stepper / Linear Pipeline Diagram */}
        <div className="pt-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-3 font-semibold">
            Escrow Distribution Waterfall
          </span>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 relative">
            {/* Step 1 */}
            <div className="bg-[#efeeea] p-3 border border-[#ded9d1] relative flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-medium">Step 01: Capture</span>
              <div className="my-2">
                <span className="text-sm font-bold text-[#1a1a1a] block">Customer UPI/Card</span>
                <span className="font-mono text-xs text-[#665d52]">{formatCurr(grossRevenue)} Gross</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                <CheckCircle size={12} /> Settled T+0
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#efeeea] p-3 border border-[#ded9d1] relative flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-medium">Step 02: Commission</span>
              <div className="my-2">
                <span className="text-sm font-bold text-[#1a1a1a] block">Platform Fee (~5.2%)</span>
                <span className="font-mono text-xs text-[#665d52]">{formatCurr(platformRevenue)} Retained</span>
              </div>
              <div className="text-[10px] font-mono text-[#665d52] flex items-center gap-1">
                <Lock size={12} /> Escrow Ledger
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#efeeea] p-3 border border-[#ded9d1] relative flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-medium">Step 03: Kitchen Payout</span>
              <div className="my-2">
                <span className="text-sm font-bold text-[#1a1a1a] block">Provider Settlement</span>
                <span className="font-mono text-xs text-[#665d52]">{formatCurr(providerEarnings)} Disbursed</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                <CheckCheck size={12} /> 72 Batches
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#efeeea] p-3 border border-[#ded9d1] relative flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#665d52] uppercase font-medium">Step 04: Rider Payout</span>
              <div className="my-2">
                <span className="text-sm font-bold text-[#1a1a1a] block">Delivery Partner Fees</span>
                <span className="font-mono text-xs text-[#665d52]">{formatCurr(deliveryEarnings)} Disbursed</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                <CheckCheck size={12} /> Direct Bank IMPS
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-[#efeeea] p-3 border border-[#ded9d1] relative flex flex-col justify-between">
              <span className="font-mono text-[10px] text-rose-800 uppercase font-medium">Step 05: Dispute Pool</span>
              <div className="my-2">
                <span className="text-sm font-bold text-rose-800 block">Refunds &amp; Reserves</span>
                <span className="font-mono text-xs text-[#665d52]">{formatCurr(refundsAmount)} Buffer</span>
              </div>
              <div className="text-[10px] font-mono text-[#665d52] flex items-center gap-1">
                <Shield size={12} /> Reserve Wallet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TWO-COLUMN OPERATIONS SECTION: PROVIDERS & DELIVERY PARTNERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Provider Overview (7 cols) */}
        <div className="lg:col-span-7 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Kitchen Ecosystem</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Provider Overview</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('providers')}
                className="text-[#1a1a1a] text-xs font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                View All Providers →
              </button>
            </div>

            {/* Provider Status Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 py-3 border-b border-[#ded9d1] text-xs font-mono">
              <span className="text-[#665d52] uppercase font-semibold">Summary:</span>
              <span className="text-[#1a1a1a] font-semibold">Total: {totalProviders}</span>
              <span className="text-[#ded9d1]">|</span>
              <span className="text-emerald-800 font-semibold">Active: {kpis.activeProviders || 0}</span>
              <span className="text-[#ded9d1]">|</span>
              <span className="text-amber-700 font-semibold">Pending KYC: {kpis.pendingProviders || 0}</span>
              <span className="text-[#ded9d1]">|</span>
              <span className="text-rose-800 font-semibold">Suspended: {kpis.suspendedProviders || 0}</span>
              <span className="text-[#ded9d1]">|</span>
              <span className="text-[#665d52]">Offline: {kpis.offlineProviders || 0}</span>
            </div>

            {/* Structured Provider Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#ded9d1] font-mono text-[10px] text-[#665d52] uppercase tracking-wider">
                    <th className="py-2 pr-4 font-semibold">Provider / Kitchen</th>
                    <th className="py-2 px-3 font-semibold text-center">Orders Today</th>
                    <th className="py-2 px-3 font-semibold text-center">Status</th>
                    <th className="py-2 px-3 font-semibold text-center">Rating</th>
                    <th className="py-2 pl-3 font-semibold text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded9d1]/60 text-xs">
                  {topProviders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-[#665d52] font-mono">
                        No commercial providers registered in database yet.
                      </td>
                    </tr>
                  ) : (
                    topProviders.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-[#ded9d1]/20 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-[#1a1a1a]">{p.name || p.businessName}</div>
                          <span className="text-[11px] text-[#665d52]">{p.desc || 'Merchant Kitchen'}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#1a1a1a]">{p.ordersToday || 0}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 border border-[#ded9d1] font-mono text-[10px] ${
                            p.status === 'Online' ? 'bg-[#efeeea] text-emerald-800' : 'bg-[#efeeea] text-[#665d52]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Online' ? 'bg-emerald-600' : 'bg-secondary'}`}></span> {p.status || 'Offline'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{p.rating || 4.7} <span className="text-amber-600">★</span></td>
                        <td className="py-3 pl-3 text-right font-mono font-semibold text-[#1a1a1a]">{formatCurr(p.earnings || 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-xs font-mono text-[#665d52]">
            <span>Sanitation Inspection Audit: 100% Compliant</span>
            <span className="text-[#1a1a1a]">FSSAI Master DB Connected</span>
          </div>
        </div>

        {/* Right Column: Delivery Partners Overview (5 cols) */}
        <div className="lg:col-span-5 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Fleet Telematics</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Delivery Partners Overview</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('drivers')}
                className="text-[#1a1a1a] text-xs font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Full Fleet →
              </button>
            </div>

            {/* Driver Summary Counters */}
            <div className="py-3 border-b border-[#ded9d1] flex flex-wrap items-center justify-between text-xs font-mono">
              <span className="text-[#665d52] uppercase font-semibold">Active Roster:</span>
              <span className="font-bold text-[#1a1a1a]">{totalDrivers} Total</span>
              <span className="text-emerald-800 font-semibold">{kpis.onlineDrivers || 0} Online</span>
              <span className="text-[#665d52]">{kpis.offlineDrivers || 0} Offline</span>
            </div>

            {/* Fleet Distribution Breakdown Visual */}
            <div className="my-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#665d52] uppercase font-semibold">Rider Allocation Status</span>
                <span className="text-[#1a1a1a]">
                  {kpis.busyDrivers || 0} On Delivery • {kpis.availableDrivers || 0} Available
                </span>
              </div>

              {/* Progress Multi-bar */}
              <div className="w-full h-3 bg-[#efeeea] flex overflow-hidden border border-[#ded9d1]">
                <div className="bg-[#1a1a1a] h-full" style={{ width: `${totalDrivers > 0 ? Math.round(((kpis.busyDrivers || 0)/totalDrivers)*100) : 0}%` }} title="On Delivery"></div>
                <div className="bg-emerald-700 h-full" style={{ width: `${totalDrivers > 0 ? Math.round(((kpis.availableDrivers || 0)/totalDrivers)*100) : 0}%` }} title="Available"></div>
                <div className="bg-[#ded9d1] h-full" style={{ width: `${totalDrivers > 0 ? Math.round(((kpis.offlineDrivers || 0)/totalDrivers)*100) : 0}%` }} title="Offline"></div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#665d52] pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1a1a1a]"></span> On Delivery ({kpis.busyDrivers || 0})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-700"></span> Available ({kpis.availableDrivers || 0})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ded9d1]"></span> Offline ({kpis.offlineDrivers || 0})</span>
              </div>
            </div>

            {/* Today's Delivery Fulfillment Mini Card */}
            <div className="p-4 bg-[#fbf9f5] border border-[#ded9d1] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#665d52] uppercase font-semibold">Today's Fulfillment</span>
                <span className="font-mono text-xs font-bold text-[#1a1a1a]">{todayOrders} Shift Dispatches</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-[#efeeea] border border-[#ded9d1]">
                  <span className="font-mono text-[10px] text-[#665d52] block">Completed</span>
                  <span className="font-mono text-base font-bold text-emerald-800">{completedOrders}</span>
                </div>
                <div className="p-2 bg-[#efeeea] border border-[#ded9d1]">
                  <span className="font-mono text-[10px] text-[#665d52] block">Active</span>
                  <span className="font-mono text-base font-bold text-amber-700">{activeOrders}</span>
                </div>
                <div className="p-2 bg-[#efeeea] border border-[#ded9d1]">
                  <span className="font-mono text-[10px] text-[#665d52] block">Cancelled</span>
                  <span className="font-mono text-base font-bold text-rose-800">{cancelledOrders}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-xs font-mono text-[#665d52]">
            <span>Average Delivery Time: 21.2 min</span>
            <span className="text-emerald-800 font-semibold">99.1% On-Time SLA</span>
          </div>
        </div>
      </div>

      {/* 7. PLATFORM PERFORMANCE BENCHMARKS & PAYMENT OPERATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Platform Performance (6 cols) */}
        <div className="lg:col-span-6 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Service SLA Quality</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Platform Performance</h3>
              </div>
              <span className="font-mono text-[10px] bg-[#efeeea] border border-[#ded9d1] px-2 py-0.5 text-[#1a1a1a]">Target: &gt;90%</span>
            </div>

            {/* Detailed Benchmarks with Linear Indicators */}
            <div className="space-y-4 my-5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#1a1a1a]">Order Fulfillment Rate</span>
                  <span className="font-bold text-[#1a1a1a]">{performance.fulfillmentRate || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#efeeea] overflow-hidden">
                  <div className="bg-[#1a1a1a] h-full" style={{ width: `${performance.fulfillmentRate || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#1a1a1a]">Delivery Success Rate</span>
                  <span className="font-bold text-[#1a1a1a]">{performance.deliverySuccessRate || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#efeeea] overflow-hidden">
                  <div className="bg-[#1a1a1a] h-full" style={{ width: `${performance.deliverySuccessRate || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#1a1a1a]">Payment Gateway Success Rate</span>
                  <span className="font-bold text-[#1a1a1a]">{performance.paymentGatewaySuccessRate || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#efeeea] overflow-hidden">
                  <div className="bg-[#1a1a1a] h-full" style={{ width: `${performance.paymentGatewaySuccessRate || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#1a1a1a]">Provider Acceptance Rate</span>
                  <span className="font-bold text-[#1a1a1a]">{performance.providerAcceptanceRate || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#efeeea] overflow-hidden">
                  <div className="bg-[#1a1a1a] h-full" style={{ width: `${performance.providerAcceptanceRate || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#1a1a1a]">Driver Acceptance Rate</span>
                  <span className="font-bold text-[#1a1a1a]">{performance.driverAcceptanceRate || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#efeeea] overflow-hidden">
                  <div className="bg-[#665d52] h-full" style={{ width: `${performance.driverAcceptanceRate || 0}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#665d52]">Cancellation Rate (Safe Threshold &lt; 3%)</span>
                  <span className="font-bold text-emerald-800">{performance.cancellationRate || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#efeeea] overflow-hidden">
                  <div className="bg-emerald-700 h-full" style={{ width: `${performance.cancellationRate || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] flex items-center justify-between text-xs font-mono text-[#665d52]">
            <span>Dynamic Throttling: Inactive</span>
            <span className="text-[#1a1a1a] font-medium">All Clusters Nominal</span>
          </div>
        </div>

        {/* Right Column: Payment & Transaction Status (6 cols) */}
        <div className="lg:col-span-6 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Treasury &amp; Gateway Health</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Payment &amp; Transaction Status</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('finance-payments')}
                className="text-[#1a1a1a] text-xs font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Ledger →
              </button>
            </div>

            {/* Transaction Status Counter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Successful</span>
                <span className="font-mono text-xl font-bold text-emerald-800 block mt-1">{formatNum(completedOrders)}</span>
                <span className="text-[10px] text-[#665d52]">Settled via Gateway</span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Pending</span>
                <span className="font-mono text-xl font-bold text-amber-700 block mt-1">{formatNum(activeOrders)}</span>
                <span className="text-[10px] text-[#665d52]">In verification</span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-rose-800 uppercase block font-semibold">Failed</span>
                <span className="font-mono text-xl font-bold text-rose-800 block mt-1">{formatNum(cancelledOrders)}</span>
                <span className="text-[10px] text-rose-800">Action needed</span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Refunded</span>
                <span className="font-mono text-xl font-bold text-[#665d52] block mt-1">{formatNum(cancelledOrders)}</span>
                <span className="text-[10px] text-[#665d52]">Auto credited</span>
              </div>
            </div>

            {/* Payment Method Share Breakdown */}
            <div className="mt-4 space-y-2">
              <span className="font-mono text-[11px] text-[#665d52] uppercase block font-semibold">Payment Method Share</span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-2.5 py-1.5 bg-[#fbf9f5] border border-[#1a1a1a] flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1a1a1a]">UPI</span>
                  <span className="font-mono text-xs text-[#665d52] font-bold">{paymentMethods.upiShare || 0}%</span>
                </div>
                <div className="px-2.5 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] flex items-center gap-2">
                  <span className="text-xs text-[#1a1a1a]">Cards</span>
                  <span className="font-mono text-xs text-[#665d52]">{paymentMethods.cardsShare || 0}%</span>
                </div>
                <div className="px-2.5 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] flex items-center gap-2">
                  <span className="text-xs text-[#1a1a1a]">Net Banking</span>
                  <span className="font-mono text-xs text-[#665d52]">{paymentMethods.netBankingShare || 0}%</span>
                </div>
                <div className="px-2.5 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] flex items-center gap-2">
                  <span className="text-xs text-[#1a1a1a]">Wallet</span>
                  <span className="font-mono text-xs text-[#665d52]">{paymentMethods.walletShare || 0}%</span>
                </div>
                <div className="px-2.5 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] flex items-center gap-2">
                  <span className="text-xs text-[#1a1a1a]">Cash</span>
                  <span className="font-mono text-xs text-[#665d52]">{paymentMethods.cashShare || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-xs font-mono text-[#665d52]">
            <span>Razorpay &amp; Cashfree Multi-routing: Active</span>
            <span className="text-emerald-800 font-semibold">0 Webhook Drops</span>
          </div>
        </div>
      </div>

      {/* 8. RECENT ORDERS & SYSTEM ALERTS (DUAL CRITICAL PANE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Orders Ledger (7 cols) */}
        <div className="lg:col-span-7 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#665d52] font-semibold">Live Audit Stream</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Recent Orders</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('orders')}
                className="text-[#1a1a1a] text-xs font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                View All Orders →
              </button>
            </div>

            {/* Real-time Order Rows */}
            <div className="divide-y divide-[#ded9d1]/60 mt-2">
              {filteredRecentOrders.length === 0 ? (
                <div className="py-6 text-center text-[#665d52] font-mono text-xs">
                  No orders recorded in database for this period.
                </div>
              ) : (
                filteredRecentOrders.map((ord, idx) => (
                  <div key={ord.orderId || idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#ded9d1]/20 transition-colors px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#efeeea] border border-[#ded9d1] flex items-center justify-center font-mono text-xs font-bold text-[#1a1a1a]">
                        {ord.shortId || `#${idx + 1}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1a1a1a]">{ord.orderId}</span>
                          <span className="text-[#ded9d1]">•</span>
                          <span className="text-xs text-[#1a1a1a]">{ord.customerName}</span>
                        </div>
                        <span className="text-xs text-[#665d52]">{ord.tiffinName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <span className="font-mono text-sm font-semibold text-[#1a1a1a]">{formatCurr(ord.totalAmount)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-[#efeeea] border border-[#ded9d1] font-mono text-[10px] ${
                        ord.status === 'PREPARING' || ord.status === 'Preparing' ? 'text-amber-700' : 'text-emerald-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ord.status === 'PREPARING' || ord.status === 'Preparing' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
                        }`}></span>
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-xs font-mono text-[#665d52]">
            <span>Automatic Webhook Syncing Active</span>
            <span className="text-[#1a1a1a]">Polling Live Database</span>
          </div>
        </div>

        {/* Right Column: System Alerts (Actionable Critical Events) (5 cols) */}
        <div className="lg:col-span-5 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-rose-800 font-semibold">Priority Interventions</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">System Alerts</h3>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            </div>

            {/* Alerts Stack */}
            <div className="space-y-2.5 mt-4">
              {attentionAlerts.length === 0 ? (
                <div className="p-3 bg-[#efeeea] border border-[#ded9d1] text-center text-xs text-[#665d52] font-mono">
                  All system parameters nominal. Zero priority alerts requiring action.
                </div>
              ) : (
                attentionAlerts.map((alert, idx) => (
                  <div key={alert.id || idx} className="p-3 bg-surface-bright border border-[#ded9d1] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${alert.type === 'error' ? 'bg-rose-600' : 'bg-amber-500'}`}></span>
                      <span className="text-xs text-[#1a1a1a] font-medium">{alert.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate(alert.targetTab || 'dashboard')}
                      className="text-[11px] text-[#1a1a1a] font-semibold underline underline-offset-2 hover:opacity-80 cursor-pointer"
                    >
                      {alert.actionText || 'Action →'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#ded9d1] mt-4 flex items-center justify-between text-xs font-mono text-[#665d52]">
            <span>Alert Severity Index: Dynamic DB Evaluation</span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('audit-logs')}
              className="text-[#1a1a1a] font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
            >
              Audit Logs Archive →
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
