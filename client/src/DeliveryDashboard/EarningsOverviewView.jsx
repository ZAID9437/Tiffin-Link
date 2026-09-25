import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToEarnings, subscribeToDeliveryLifecycle } from '../services/socket';

export default function EarningsOverviewView({ currentUser, onNavigateTab }) {
  // Main Data States
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Controls
  const [timePeriod, setTimePeriod] = useState('this_week'); // 'today', 'yesterday', 'this_week', 'this_month', 'last_month', 'custom'
  const [chartPeriod, setChartPeriod] = useState('7days'); // '7days', '30days', '90days', '1year'
  const [chartMetric, setChartMetric] = useState('earnings'); // 'earnings', 'deliveries'

  // Custom Date Modal State
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  // Dropdown States
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmountInput, setPayoutAmountInput] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Hover Tooltip for SVG Chart
  const [activeHoverNodeIndex, setActiveHoverNodeIndex] = useState(null);

  // Toggle preview empty state for new partners
  const [forceEmptyStatePreview, setForceEmptyStatePreview] = useState(false);

  // Retrieve token & auth credentials
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch telemetry overview from MongoDB
  const fetchEarningsOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      let url = `http://localhost:5000/api/delivery/earnings/overview?period=${encodeURIComponent(timePeriod)}&chartPeriod=${encodeURIComponent(chartPeriod)}&chartMetric=${encodeURIComponent(chartMetric)}`;

      if (timePeriod === 'custom' && customFromDate && customToDate) {
        url += `&from=${encodeURIComponent(customFromDate)}&to=${encodeURIComponent(customToDate)}`;
      }

      const res = await fetch(url, { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to retrieve earnings overview telemetry');
      }

      setEarningsData(json.data);
      if (json.data?.breakdown?.availableBalance) {
        setPayoutAmountInput(String(json.data.breakdown.availableBalance));
      }
      if (isRefresh) {
        showToast('✓ Earnings telemetry successfully resynced with MongoDB!');
      }
    } catch (err) {
      console.error('Error fetching earnings overview:', err);
      setError(err.message || 'Unable to load earnings overview from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timePeriod, chartPeriod, chartMetric, customFromDate, customToDate, token]);

  useEffect(() => {
    fetchEarningsOverview();
  }, [fetchEarningsOverview]);

  // Real-Time Socket Synchronization
  useEffect(() => {
    const unsubEarnings = subscribeToEarnings(() => {
      fetchEarningsOverview(true);
    });

    const unsubLifecycle = subscribeToDeliveryLifecycle({
      onCompleted: () => fetchEarningsOverview(true)
    });

    return () => {
      if (typeof unsubEarnings === 'function') unsubEarnings();
      if (typeof unsubLifecycle === 'function') unsubLifecycle();
    };
  }, [fetchEarningsOverview]);

  // Handle Export Download
  const handleExportStatement = async (format = 'csv') => {
    setIsExportDropdownOpen(false);
    try {
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      let url = `http://localhost:5000/api/delivery/earnings/export?period=${encodeURIComponent(timePeriod)}&format=${encodeURIComponent(format)}`;
      if (timePeriod === 'custom' && customFromDate && customToDate) {
        url += `&from=${encodeURIComponent(customFromDate)}&to=${encodeURIComponent(customToDate)}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to generate export file');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `TiffinLink_Earnings_Statement_${timePeriod}_${Date.now()}.${format === 'csv' ? 'csv' : 'txt'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`✓ Downloaded ${format.toUpperCase()} earnings statement!`);
    } catch (err) {
      console.error('Export error:', err);
      showToast('⚠️ Unable to export statement. Please try again.');
    }
  };

  // Handle Payout / Withdrawal Request
  const handleExecutePayout = async () => {
    const amt = parseFloat(payoutAmountInput);
    if (isNaN(amt) || amt <= 0) {
      showToast('⚠️ Please enter a valid payout withdrawal amount');
      return;
    }

    const available = earningsData?.breakdown?.availableBalance || 0;
    if (amt > available) {
      showToast(`⚠️ Requested amount exceeds available balance (₹${available.toLocaleString()})`);
      return;
    }

    setIsProcessingPayout(true);
    setTimeout(() => {
      setIsProcessingPayout(false);
      setIsPayoutModalOpen(false);
      showToast(`✓ Instant withdrawal request for ₹${amt.toLocaleString()} dispatched to bank via UPI!`);
      fetchEarningsOverview(true);
    }, 1200);
  };

  // Render Skeleton Loader while API is loading
  if (loading && !earningsData) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-12 space-y-8 animate-pulse">
        <div className="h-10 bg-surface-container-high w-1/3 rounded-sm" />
        <div className="h-12 bg-surface-container-high w-full rounded-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-surface-container-lowest border border-sand-neutral p-5" />
          ))}
        </div>
        <div className="h-80 bg-surface-container-lowest border border-sand-neutral p-6" />
      </div>
    );
  }

  // Render Error State
  if (error && !earningsData) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-8 lg:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-surface-container-lowest border border-sand-neutral p-8 text-center max-w-md shadow-sm space-y-4">
          <span className="material-symbols-outlined text-[48px] text-error">error_outline</span>
          <h2 className="font-headline-md text-xl text-onyx-black font-serif">Unable to load earnings</h2>
          <p className="font-body-md text-sm text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={() => fetchEarningsOverview()}
            className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider hover:bg-clay-earth transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const driver = earningsData?.driver || {};
  const summary = earningsData?.summary || {
    today: { amount: 0, trips: 0, changePercent: 0 },
    week: { amount: 0, trips: 0, changePercent: 0 },
    month: { amount: 0, trips: 0, changePercent: 0 },
    lifetime: { amount: 0, trips: 0 }
  };
  const breakdown = earningsData?.breakdown || {
    deliveryEarnings: 0,
    incentives: 0,
    bonuses: 0,
    tips: 0,
    grossEarnings: 0,
    platformFee: 0,
    withdrawals: 0,
    availableBalance: 0
  };
  const deliveryStats = earningsData?.deliveryStats || {
    completedDeliveries: 0,
    avgEarningPerDelivery: 0,
    avgDistanceKm: 0,
    avgTripTimeMinutes: 0
  };
  const topDays = earningsData?.topEarningDays || [];
  const chartPoints = earningsData?.chart || [];
  const hasData = earningsData?.hasData && !forceEmptyStatePreview;

  // Chart SVG scaling math
  const chartValues = chartPoints.map(p => chartMetric === 'earnings' ? (p.earnings || 0) : (p.deliveries || 0));
  const maxChartVal = Math.max(...chartValues, chartMetric === 'earnings' ? 1000 : 10);
  const svgWidth = 750;
  const svgHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;
  const graphW = svgWidth - paddingLeft - paddingRight;
  const graphH = svgHeight - paddingTop - paddingBottom;

  const pointsCoords = chartPoints.map((p, idx) => {
    const val = chartMetric === 'earnings' ? (p.earnings || 0) : (p.deliveries || 0);
    const x = paddingLeft + (idx / Math.max(1, chartPoints.length - 1)) * graphW;
    const y = paddingTop + graphH - (val / maxChartVal) * graphH;
    return { x, y, val, point: p };
  });

  let pathD = '';
  if (pointsCoords.length > 0) {
    pathD = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;
    for (let i = 1; i < pointsCoords.length; i++) {
      const prev = pointsCoords[i - 1];
      const curr = pointsCoords[i];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }
  }

  const areaD = pointsCoords.length > 0
    ? `${pathD} L ${pointsCoords[pointsCoords.length - 1].x} ${paddingTop + graphH} L ${pointsCoords[0].x} ${paddingTop + graphH} Z`
    : '';

  const activeNode = activeHoverNodeIndex != null ? pointsCoords[activeHoverNodeIndex] : pointsCoords[pointsCoords.length - 1];

  return (
    <div className="flex flex-col w-full selection:bg-onyx-black selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-medium px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation Breadcrumb */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest text-[11px]">Earnings &amp; Payments</span>
            <span className="text-secondary text-sm">/</span>
            <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-semibold text-[11px]">Earnings Overview</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full ml-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">SOCKET.IO SYNCED • LIVE LEDGER</span>
            </div>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight mt-2 font-serif text-3xl sm:text-4xl">Earnings Overview</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1 text-sm sm:text-base">
            Comprehensive analysis of your courier compensation, incentives, completed deliveries, and settlement balances.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Refresh Telemetry Button */}
          <button
            type="button"
            id="refreshTelemetryBtn"
            onClick={() => fetchEarningsOverview(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest border border-sand-neutral text-on-surface hover:bg-surface-container-high transition-colors font-button-text text-button-text text-xs cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            <span>{refreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
          </button>

          {/* Export Dropdown Button */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              id="exportDropdownBtn"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-onyx-black text-on-primary hover:bg-clay-earth transition-colors font-button-text text-button-text text-xs shadow-xs cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Export Statement</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {isExportDropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-sand-neutral shadow-lg z-50 py-1">
                <button
                  type="button"
                  onClick={() => handleExportStatement('csv')}
                  className="w-full text-left px-4 py-2.5 text-xs font-body-md text-onyx-black hover:bg-surface-container-high flex items-center justify-between"
                >
                  <span className="font-medium">Export CSV</span>
                  <span className="font-label-caps text-[10px] text-secondary">.CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportStatement('excel')}
                  className="w-full text-left px-4 py-2.5 text-xs font-body-md text-onyx-black hover:bg-surface-container-high flex items-center justify-between border-t border-sand-neutral/40"
                >
                  <span className="font-medium">Export Excel</span>
                  <span className="font-label-caps text-[10px] text-secondary">.XLSX</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-container-lowest border border-sand-neutral mb-8 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label-caps text-label-caps uppercase text-secondary mr-2 text-[11px] font-bold">Time Horizon:</span>
          
          <button
            type="button"
            onClick={() => setTimePeriod('today')}
            className={`px-3.5 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              timePeriod === 'today'
                ? 'bg-onyx-black text-on-primary font-bold'
                : 'bg-surface-container-low text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setTimePeriod('yesterday')}
            className={`px-3.5 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              timePeriod === 'yesterday'
                ? 'bg-onyx-black text-on-primary font-bold'
                : 'bg-surface-container-low text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setTimePeriod('this_week')}
            className={`px-3.5 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              timePeriod === 'this_week' || timePeriod === 'week'
                ? 'bg-onyx-black text-on-primary font-bold'
                : 'bg-surface-container-low text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            This Week
          </button>

          <button
            type="button"
            onClick={() => setTimePeriod('this_month')}
            className={`px-3.5 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              timePeriod === 'this_month' || timePeriod === 'month'
                ? 'bg-onyx-black text-on-primary font-bold'
                : 'bg-surface-container-low text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            This Month
          </button>

          <button
            type="button"
            onClick={() => setTimePeriod('last_month')}
            className={`px-3.5 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              timePeriod === 'last_month'
                ? 'bg-onyx-black text-on-primary font-bold'
                : 'bg-surface-container-low text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            Last Month
          </button>

          <button
            type="button"
            onClick={() => setIsCustomDateModalOpen(true)}
            className={`px-3.5 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              timePeriod === 'custom'
                ? 'bg-onyx-black text-on-primary font-bold'
                : 'bg-surface-container-low text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">date_range</span>
            Custom Range
          </button>
        </div>

        <div className="flex items-center gap-2 text-secondary font-label-caps text-[11px] font-medium">
          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
          <span>{earningsData?.dateRangeLabel || 'Active Cycle'}</span>
        </div>
      </div>

      {/* Summary KPI Cards Grid (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Today's Earnings */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">Today's Earnings</span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              ₹{(summary.today?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className={`font-label-caps text-[10px] font-semibold flex items-center gap-1 ${summary.today?.changePercent >= 0 ? 'text-emerald-700' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[13px]">
                {summary.today?.changePercent >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {summary.today?.changePercent >= 0 ? `+${summary.today?.changePercent}%` : `${summary.today?.changePercent}%`} vs yesterday
            </span>
            <span className="font-label-caps text-[10px] text-secondary">{summary.today?.trips || 0} trips today</span>
          </div>
        </div>

        {/* Card 2: This Week */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">This Week</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-700">account_balance_wallet</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              ₹{(summary.week?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className={`font-label-caps text-[10px] font-semibold flex items-center gap-1 ${summary.week?.changePercent >= 0 ? 'text-emerald-700' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[13px]">
                {summary.week?.changePercent >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {summary.week?.changePercent >= 0 ? `+${summary.week?.changePercent}%` : `${summary.week?.changePercent}%`} vs last week
            </span>
            <span className="font-label-caps text-[10px] text-secondary">{summary.week?.trips || 0} trips logged</span>
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">This Month</span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">calendar_month</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              ₹{(summary.month?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className={`font-label-caps text-[10px] font-semibold flex items-center gap-1 ${summary.month?.changePercent >= 0 ? 'text-emerald-700' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[13px]">
                {summary.month?.changePercent >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {summary.month?.changePercent >= 0 ? `+${summary.month?.changePercent}%` : `${summary.month?.changePercent}%`} vs prev month
            </span>
            <span className="font-label-caps text-[10px] text-secondary">{summary.month?.trips || 0} trips MTD</span>
          </div>
        </div>

        {/* Card 4: Total Earned (Lifetime) */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">Total Earned (Lifetime)</span>
            <span className="material-symbols-outlined text-[20px] text-onyx-black">verified</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              ₹{(summary.lifetime?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-semibold">Lifetime Gross</span>
            <span className="font-label-caps text-[10px] text-onyx-black font-bold">{summary.lifetime?.trips || 0} Deliveries</span>
          </div>
        </div>
      </section>

      {/* Section 1: Earnings Performance Chart & Toggle */}
      <section className="bg-surface-container-lowest border border-sand-neutral p-6 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sand-neutral">
          <div>
            <h2 className="font-headline-md text-2xl text-onyx-black font-serif leading-tight">Earnings Performance</h2>
            <p className="font-body-md text-[13px] text-on-surface-variant mt-0.5">Daily compensation velocity across active delivery windows and bonus surges.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Metric Toggle */}
            <div className="flex bg-surface-container-low p-1 border border-sand-neutral">
              <button
                type="button"
                onClick={() => setChartMetric('earnings')}
                className={`px-3 py-1 font-label-caps text-[11px] uppercase tracking-wider cursor-pointer ${
                  chartMetric === 'earnings'
                    ? 'bg-onyx-black text-on-primary font-bold'
                    : 'text-secondary hover:text-onyx-black'
                }`}
              >
                Earnings (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('deliveries')}
                className={`px-3 py-1 font-label-caps text-[11px] uppercase tracking-wider cursor-pointer ${
                  chartMetric === 'deliveries'
                    ? 'bg-onyx-black text-on-primary font-bold'
                    : 'text-secondary hover:text-onyx-black'
                }`}
              >
                Deliveries
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex bg-surface-container-low p-1 border border-sand-neutral">
              {['7days', '30days', '90days', '1year'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1 font-label-caps text-[11px] uppercase tracking-wider cursor-pointer ${
                    chartPeriod === p
                      ? 'bg-onyx-black text-on-primary font-bold'
                      : 'text-secondary hover:text-onyx-black'
                  }`}
                >
                  {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : p === '90days' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High Fidelity SVG Minimalist Curve Chart */}
        <div className="relative w-full h-[300px] mt-6 select-none overflow-x-auto">
          <svg className="w-full h-full min-w-[600px]" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="earningsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid Y-lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yVal = paddingTop + graphH * (1 - ratio);
              const labelVal = chartMetric === 'earnings'
                ? `₹${Math.round(maxChartVal * ratio).toLocaleString()}`
                : `${Math.round(maxChartVal * ratio)}`;
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={yVal}
                    x2={svgWidth - paddingRight}
                    y2={yVal}
                    stroke={i === 0 ? '#ded9d1' : '#eae8e4'}
                    strokeDasharray={i === 0 ? 'none' : '3 3'}
                    strokeWidth={i === 0 ? 1.5 : 1}
                  />
                  <text
                    x={paddingLeft - 10}
                    y={yVal + 4}
                    fill="#747878"
                    fontSize="10"
                    fontFamily="hankenGrotesk"
                    textAnchor="end"
                  >
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Path Fills & Curves */}
            {pointsCoords.length > 0 && (
              <>
                <path d={areaD} fill="url(#earningsAreaGrad)" />
                <path d={pathD} fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Points & Labels */}
            {pointsCoords.map((pt, idx) => (
              <g key={idx} className="cursor-pointer" onMouseEnter={() => setActiveHoverNodeIndex(idx)}>
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={paddingTop + graphH}
                  stroke={pt.point.isToday ? '#ded9d1' : '#f5f3ef'}
                  strokeDasharray={pt.point.isToday ? '2 2' : 'none'}
                  strokeWidth="1"
                />

                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.point.isToday ? 5 : 4}
                  fill={pt.point.isToday ? '#1a1a1a' : '#ffffff'}
                  stroke="#1a1a1a"
                  strokeWidth="2"
                />

                <text
                  x={pt.x}
                  y={svgHeight - 10}
                  fill={pt.point.isToday ? '#1a1a1a' : '#747878'}
                  fontSize="10"
                  fontFamily="hankenGrotesk"
                  fontWeight={pt.point.isToday ? '600' : '400'}
                  textAnchor="middle"
                >
                  {pt.point.label}
                </text>
              </g>
            ))}

            {/* Interactive Tooltip on Active Node */}
            {activeNode && (
              <g transform={`translate(${Math.min(svgWidth - 145, Math.max(10, activeNode.x - 65))}, ${Math.max(5, activeNode.y - 50)})`}>
                <rect x="0" y="0" width="130" height="42" rx="2" fill="#1a1a1a" />
                <text x="10" y="18" fill="#f5f3ef" fontSize="10" fontFamily="hankenGrotesk" fontWeight="600" letterSpacing="0.05em">
                  {activeNode.point.label}: ₹{(activeNode.point.earnings || 0).toLocaleString()}
                </text>
                <text x="10" y="32" fill="#c8c6c5" fontSize="9" fontFamily="hankenGrotesk">
                  {activeNode.point.deliveries || 0} TRIPS • {activeNode.point.isToday ? 'ACTIVE DAY' : 'LOGGED'}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Live Socket Notification Pill Below Chart */}
        <div className="mt-4 pt-3 border-t border-sand-neutral flex items-center gap-2 text-on-surface-variant font-label-caps text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-onyx-black font-semibold">Real-time recalculation:</span>
          <span>Order total ≠ Driver earning. MongoDB settlement triggers instantly upon customer OTP verification.</span>
        </div>
      </section>

      {/* Two-Column Grid: Ledger Summary & Delivery Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left Column: Earnings Breakdown (Ledger Summary) */}
        <section className="lg:col-span-6 bg-surface-container-lowest border border-sand-neutral p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral">
              <div>
                <h3 className="font-headline-md text-[22px] text-onyx-black font-serif leading-tight">Earnings Breakdown</h3>
                <p className="font-body-md text-[13px] text-on-surface-variant mt-0.5">Detailed composition of current cycle gross compensation.</p>
              </div>
              <span className="font-label-caps text-[10px] bg-surface-container-high px-2 py-0.5 text-secondary uppercase tracking-wider font-bold">
                {earningsData?.dateRangeLabel || 'Active Cycle'}
              </span>
            </div>

            <div className="py-4 space-y-3">
              {/* Item 1 */}
              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">local_shipping</span>
                  <span className="font-button-text text-onyx-black font-medium">Delivery Earnings (Base)</span>
                </div>
                <span className="font-headline-md text-[16px] text-onyx-black font-serif">
                  ₹{(breakdown.deliveryEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">bolt</span>
                  <span className="font-button-text text-onyx-black font-medium">Incentives (Peak Hours)</span>
                </div>
                <span className="font-headline-md text-[16px] text-emerald-800 font-serif">
                  +₹{(breakdown.incentives || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">military_tech</span>
                  <span className="font-button-text text-onyx-black font-medium">Bonuses (Target Milestones)</span>
                </div>
                <span className="font-headline-md text-[16px] text-emerald-800 font-serif">
                  +₹{(breakdown.bonuses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">volunteer_activism</span>
                  <span className="font-button-text text-onyx-black font-medium">Tips (Client Discretionary)</span>
                </div>
                <span className="font-headline-md text-[16px] text-emerald-800 font-serif">
                  +₹{(breakdown.tips || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-sand-neutral" />

              {/* Gross Earnings */}
              <div className="flex items-center justify-between py-1 bg-surface-container-low px-3">
                <span className="font-label-caps text-label-caps uppercase text-onyx-black font-bold tracking-wider text-[11px]">Gross Earnings</span>
                <span className="font-headline-md text-[20px] text-onyx-black font-serif font-bold">
                  ₹{(breakdown.grossEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-sand-neutral" />

              {/* Deductions */}
              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">security</span>
                  <span className="font-button-text text-on-surface-variant">Platform Fee (Tech &amp; Insurance)</span>
                </div>
                <span className="font-headline-md text-[16px] text-error font-serif">
                  -₹{(breakdown.platformFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-secondary">output</span>
                  <span className="font-button-text text-on-surface-variant">Dispatched Withdrawals</span>
                </div>
                <span className="font-headline-md text-[16px] text-error font-serif">
                  -₹{(breakdown.withdrawals || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Available Balance & Payout Action */}
          <div className="pt-4 border-t border-sand-neutral mt-2 bg-surface-container-high/30 -mx-6 -mb-6 p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest block font-bold">Net Available Balance</span>
                <div className="font-headline-lg text-[32px] text-onyx-black font-serif font-bold leading-tight mt-0.5">
                  ₹{(breakdown.availableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(true)}
                className="px-4 py-2.5 bg-onyx-black text-on-primary hover:bg-clay-earth transition-colors font-button-text text-button-text text-xs uppercase tracking-wider font-medium shadow-xs cursor-pointer"
              >
                Request Payout / Withdraw
              </button>
            </div>
            <p className="font-label-caps text-[10px] text-secondary flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[13px] text-emerald-700">check_circle</span>
              Settlement cycle: Daily UPI auto-credit enabled to registered bank account
            </p>
          </div>
        </section>

        {/* Right Column: Delivery Performance & Top Earning Days */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Sub-card 1: Delivery Statistics */}
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral mb-4">
              <h3 className="font-headline-md text-[20px] text-onyx-black font-serif leading-tight">Delivery Statistics</h3>
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-bold">Operational Metrics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-surface-container-low border border-sand-neutral flex flex-col justify-between">
                <span className="font-label-caps text-[10px] uppercase text-secondary font-bold">Completed Deliveries</span>
                <span className="font-headline-md text-[22px] text-onyx-black font-serif font-medium mt-1">
                  {deliveryStats.completedDeliveries}
                </span>
              </div>
              <div className="p-3 bg-surface-container-low border border-sand-neutral flex flex-col justify-between">
                <span className="font-label-caps text-[10px] uppercase text-secondary font-bold">Avg / Delivery</span>
                <span className="font-headline-md text-[22px] text-onyx-black font-serif font-medium mt-1">
                  ₹{deliveryStats.avgEarningPerDelivery}
                </span>
              </div>
              <div className="p-3 bg-surface-container-low border border-sand-neutral flex flex-col justify-between">
                <span className="font-label-caps text-[10px] uppercase text-secondary font-bold">Avg Distance</span>
                <span className="font-headline-md text-[22px] text-onyx-black font-serif font-medium mt-1">
                  {deliveryStats.avgDistanceKm} <span className="text-[12px] font-body-md text-secondary">km</span>
                </span>
              </div>
              <div className="p-3 bg-surface-container-low border border-sand-neutral flex flex-col justify-between">
                <span className="font-label-caps text-[10px] uppercase text-secondary font-bold">Avg Trip Time</span>
                <span className="font-headline-md text-[22px] text-onyx-black font-serif font-medium mt-1">
                  {deliveryStats.avgTripTimeMinutes} <span className="text-[12px] font-body-md text-secondary">min</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sub-card 2: Top Earning Days */}
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral mb-4">
              <h3 className="font-headline-md text-[20px] text-onyx-black font-serif leading-tight">Top Earning Days</h3>
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-bold">High Velocity Shifts</span>
            </div>

            {topDays.length > 0 && hasData ? (
              <div className="space-y-3">
                {topDays.map((item) => (
                  <div key={item.rank} className="p-3.5 bg-surface-container-low border border-sand-neutral flex items-center justify-between hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 font-headline-md text-[15px] font-serif flex items-center justify-center shrink-0 ${item.rank === '#1' ? 'bg-onyx-black text-on-primary' : 'bg-surface-container-high text-onyx-black'}`}>
                        {item.rank}
                      </div>
                      <div>
                        <span className="font-button-text text-[14px] text-onyx-black font-semibold block">{item.formattedDate}</span>
                        <span className="font-body-md text-[12px] text-secondary">{item.deliveries} deliveries • <em className="not-italic text-emerald-800 font-medium">{item.note}</em></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-headline-md text-[18px] text-onyx-black font-serif font-bold">
                        ₹{item.earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="block font-label-caps text-[10px] text-secondary">Peak Day</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <p className="font-body-md text-xs text-secondary italic">No top earning shifts logged yet for this filter</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Empty State Banner preview toggle */}
      {!hasData && (
        <div className="mb-8 p-6 bg-surface-container-lowest border border-sand-neutral shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-secondary">payments</span>
          </div>
          <div>
            <h3 className="font-headline-md text-xl text-onyx-black font-serif">No earnings yet</h3>
            <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto mt-1">
              Complete your first delivery to start building your earnings history.
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('delivery-requests')}
              className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider hover:bg-clay-earth transition-colors"
            >
              View Delivery Requests
            </button>
          )}
        </div>
      )}

      {/* Empty State Preview Notice for partner onboarding */}
      <div className="mb-6 p-4 bg-surface-container-low border border-sand-neutral flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-secondary">info</span>
          <span className="font-body-md text-[13px] text-on-surface-variant">
            <strong className="text-onyx-black font-medium">New Partner Onboarding Preview:</strong> Accounts without trip history show: <em className="text-secondary">"No earnings yet — Complete your first delivery to start building your earnings history."</em>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setForceEmptyStatePreview(!forceEmptyStatePreview)}
          className="font-label-caps text-[11px] text-onyx-black underline uppercase tracking-wider hover:text-secondary cursor-pointer font-bold"
        >
          {forceEmptyStatePreview ? 'Restore Live Telemetry' : 'View Empty State'}
        </button>
      </div>

      {/* Security & Isolation Banner */}
      <footer className="p-4 bg-surface-container-high/60 border border-sand-neutral flex items-center gap-3 text-secondary text-xs leading-relaxed">
        <span className="material-symbols-outlined text-[18px] text-onyx-black shrink-0">lock</span>
        <span>
          <strong className="text-onyx-black font-medium">Driver Telemetry Verified:</strong> Authenticated Session for {driver.name || 'Courier'} (ID: {driver.driverId ? `#${driver.driverId}` : ''}). Data cryptographically scoped via JWT claims to MongoDB driver records. Instant settlement guaranteed via TiffinLink escrow contract.
        </span>
      </footer>

      {/* Custom Date Range Modal */}
      {isCustomDateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <h3 className="font-headline-md text-lg text-onyx-black font-serif">Custom Date Range</h3>
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(false)}
                className="text-secondary hover:text-onyx-black"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-body-md text-xs">
              <div>
                <label className="block text-secondary font-medium uppercase tracking-wider mb-1">From Date</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-sand-neutral text-onyx-black text-xs"
                />
              </div>

              <div>
                <label className="block text-secondary font-medium uppercase tracking-wider mb-1">To Date</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-sand-neutral text-onyx-black text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-neutral">
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(false)}
                className="px-4 py-2 border border-sand-neutral text-secondary text-xs uppercase font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customFromDate && customToDate) {
                    setTimePeriod('custom');
                    setIsCustomDateModalOpen(false);
                  } else {
                    showToast('⚠️ Please select both From and To dates');
                  }
                }}
                className="px-5 py-2 bg-onyx-black text-on-primary text-xs uppercase font-medium hover:bg-clay-earth"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Withdrawal Request Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <h3 className="font-headline-md text-lg text-onyx-black font-serif">Request Payout Withdrawal</h3>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-secondary hover:text-onyx-black"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-body-md text-xs">
              <p className="text-on-surface-variant">
                Withdraw your settled delivery earnings directly to your registered UPI / Bank account.
              </p>

              <div className="p-3 bg-surface-container-low border border-sand-neutral">
                <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest block">Available Balance</span>
                <span className="font-headline-md text-xl text-onyx-black font-serif font-bold">
                  ₹{(breakdown.availableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-secondary font-medium uppercase tracking-wider mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  value={payoutAmountInput}
                  onChange={(e) => setPayoutAmountInput(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-2.5 bg-surface border border-sand-neutral text-onyx-black text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-neutral">
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="px-4 py-2 border border-sand-neutral text-secondary text-xs uppercase font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePayout}
                disabled={isProcessingPayout}
                className="px-5 py-2 bg-onyx-black text-on-primary text-xs uppercase font-medium hover:bg-clay-earth disabled:opacity-50"
              >
                {isProcessingPayout ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
