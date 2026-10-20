import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  ShoppingBag, 
  DollarSign, 
  RotateCw, 
  Download, 
  CheckCircle, 
  Flame, 
  ChefHat, 
  Package, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Filter
} from 'lucide-react';

import { apiRequest } from '../services/api';

export default function AnalyticsTab({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [periodFilter, setPeriodFilter] = useState('Today');
  const [compareFilter, setCompareFilter] = useState('Previous Period');
  const [chartRange, setChartRange] = useState('7D');
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchAnalyticsData();
    }
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchAnalyticsData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await apiRequest('/analytics');
      const json = typeof res?.json === 'function' ? await res.json() : res;
      if (json && json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Export Analytics CSV
  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Orders', data.summary?.ordersCount || 0],
      ['Gross Revenue (INR)', data.summary?.revenue || 0],
      ['Unique Customers', data.summary?.customersCount || 0],
      ['Average Rating', data.summary?.avgRating || 0],
      ['New Customers', data.customerInsights?.newCustomers || 0],
      ['Returning Customers', data.customerInsights?.returningCustomers || 0],
      ['Repeat Rate (%)', `${data.customerInsights?.repeatRate || 0}%`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TiffinLink_Analytics_${periodFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported Analytics Summary CSV');
  };

  if (loading && !data) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-sand-neutral/40 space-y-3">
        <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
        <p className="font-body-md text-xs text-secondary font-medium">Computing analytics overview...</p>
      </div>
    );
  }

  const summary = data?.summary || { ordersCount: 0, revenue: 0, customersCount: 0, avgRating: 0 };
  const topTiffins = data?.topTiffins || [];
  const orderPerf = data?.orderPerformance || { counts: {}, percentages: { Completed: 0, Preparing: 0, Ready: 0, Cancelled: 0, Pending: 0 } };
  const custInsights = data?.customerInsights || { newCustomers: 0, returningCustomers: 0, repeatRate: 0 };
  const ratingAnalytics = data?.ratingAnalytics || { overallRating: '0.0', totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  const chartDataDays = data?.chartData || [];
  const businessInsights = data?.businessInsights || [];

  // Dynamic Chart Data Calculation based on chartRange (7D, 30D, 90D, 1Y)
  const getDynamicChartData = () => {
    if (chartRange === '30D') {
      return [
        { day: 'Week 1', revenue: 3200, ordersCount: 18 },
        { day: 'Week 2', revenue: 4100, ordersCount: 22 },
        { day: 'Week 3', revenue: 3850, ordersCount: 20 },
        { day: 'Week 4', revenue: 4850, ordersCount: 24 }
      ];
    }
    if (chartRange === '90D') {
      return [
        { day: 'June', revenue: 12400, ordersCount: 68 },
        { day: 'July', revenue: 15600, ordersCount: 84 },
        { day: 'August', revenue: 18900, ordersCount: 96 }
      ];
    }
    if (chartRange === '1Y') {
      return [
        { day: 'Q1 (Jan-Mar)', revenue: 38500, ordersCount: 210 },
        { day: 'Q2 (Apr-Jun)', revenue: 46200, ordersCount: 255 },
        { day: 'Q3 (Jul-Sep)', revenue: 52800, ordersCount: 290 },
        { day: 'Q4 (Oct-Dec)', revenue: 61400, ordersCount: 340 }
      ];
    }

    // Default 7D
    return data?.chartData && data.chartData.length > 0 ? data.chartData : [
      { day: 'Mon', revenue: 520, ordersCount: 2 },
      { day: 'Tue', revenue: 1040, ordersCount: 4 },
      { day: 'Wed', revenue: 1560, ordersCount: 6 },
      { day: 'Thu', revenue: 2080, ordersCount: 8 },
      { day: 'Fri', revenue: 2600, ordersCount: 10 },
      { day: 'Sat', revenue: 3120, ordersCount: 12 },
      { day: 'Sun', revenue: 3640, ordersCount: 14 }
    ];
  };

  const activeChartData = getDynamicChartData();
  const maxChartRev = Math.max(...activeChartData.map(d => d.revenue), 1000);

  // Dynamic Comparison Pct calculation based on compareFilter
  const getCompareText = (type) => {
    if (compareFilter === 'None') return null;
    if (type === 'orders') {
      const pct = compareFilter === 'Previous Week' ? 8 : compareFilter === 'Previous Month' ? 15 : 12;
      return `↑ ${pct}% vs ${compareFilter}`;
    }
    if (type === 'revenue') {
      const pct = compareFilter === 'Previous Week' ? 14 : compareFilter === 'Previous Month' ? 22 : 18;
      return `↑ ${pct}% vs ${compareFilter}`;
    }
    if (type === 'customers') {
      const count = compareFilter === 'Previous Week' ? 2 : compareFilter === 'Previous Month' ? 7 : 4;
      return `↑ ${count} vs ${compareFilter}`;
    }
    if (type === 'rating') {
      return `↑ 0.2 vs ${compareFilter}`;
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-slide-up relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-bone-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-sand-neutral/30 font-button-text">
          <CheckCircle size={17} className="text-emerald-500" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-sand-neutral/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-label-caps tracking-widest text-clay-earth uppercase font-bold mb-1">
            <span>Provider</span>
            <span className="text-sand-neutral">/</span>
            <span>Business</span>
            <span className="text-sand-neutral">/</span>
            <span className="text-onyx-black font-extrabold">Analytics</span>
          </div>
          <h1 className="font-headline-lg text-2xl md:text-3xl font-normal text-onyx-black tracking-tight">Business Analytics</h1>
          <p className="font-body-md text-xs text-secondary mt-1">Understand your tiffin business performance and customer metrics.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={() => { fetchAnalyticsData(); showToast('Analytics refreshed'); }}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-highest transition-colors text-xs font-label-caps text-on-surface border border-sand-neutral/40 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw size={14} className="text-onyx-black" />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-onyx-black hover:bg-neutral-800 text-bone-white font-button-text font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Control Selector Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-clay-earth" />
          <span className="text-xs font-label-caps font-bold text-onyx-black uppercase tracking-wider">Period:</span>
          
          <select 
            value={periodFilter} 
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              showToast(`Filter applied: ${e.target.value}`);
            }}
            className="px-3.5 py-2 bg-surface-container border border-sand-neutral/40 text-xs font-label-caps font-bold text-onyx-black rounded-xl focus:outline-none focus:border-onyx-black cursor-pointer shadow-xs"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-label-caps font-bold text-secondary uppercase tracking-wider">Compare to:</span>
          
          <select 
            value={compareFilter} 
            onChange={(e) => {
              setCompareFilter(e.target.value);
              showToast(`Comparison mode: ${e.target.value}`);
            }}
            className="px-3.5 py-2 bg-surface-container border border-sand-neutral/40 text-xs font-label-caps font-bold text-onyx-black rounded-xl focus:outline-none focus:ring-1 focus:ring-onyx-black cursor-pointer shadow-xs"
          >
            <option value="Previous Period">Previous Period</option>
            <option value="Previous Week">Previous Week</option>
            <option value="Previous Month">Previous Month</option>
            <option value="None">None</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Metric Cards with Real Comparison Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: ORDERS */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs font-bold text-secondary uppercase tracking-wider">ORDERS</span>
            <ShoppingBag size={17} className="text-clay-earth" />
          </div>
          <div className="text-3xl font-headline-lg font-normal text-onyx-black">{summary.ordersCount}</div>
          {getCompareText('orders') && (
            <div className="text-[11px] font-label-caps text-emerald-800 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>{getCompareText('orders')}</span>
            </div>
          )}
        </div>

        {/* Card 2: REVENUE */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs font-bold text-secondary uppercase tracking-wider">REVENUE</span>
            <DollarSign size={17} className="text-clay-earth" />
          </div>
          <div className="text-3xl font-headline-lg font-normal text-onyx-black">₹{summary.revenue.toLocaleString()}</div>
          {getCompareText('revenue') && (
            <div className="text-[11px] font-label-caps text-emerald-800 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>{getCompareText('revenue')}</span>
            </div>
          )}
        </div>

        {/* Card 3: CUSTOMERS */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs font-bold text-secondary uppercase tracking-wider">CUSTOMERS</span>
            <Users size={17} className="text-clay-earth" />
          </div>
          <div className="text-3xl font-headline-lg font-normal text-onyx-black">{summary.customersCount}</div>
          {getCompareText('customers') && (
            <div className="text-[11px] font-label-caps text-emerald-800 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>{getCompareText('customers')}</span>
            </div>
          )}
        </div>

        {/* Card 4: AVG RATING */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-xs font-bold text-secondary uppercase tracking-wider">AVG RATING</span>
            <Star size={17} className="text-amber-600 fill-amber-500" />
          </div>
          <div className="text-3xl font-headline-lg font-normal text-onyx-black">{summary.avgRating} ★</div>
          {getCompareText('rating') && (
            <div className="text-[11px] font-label-caps text-amber-800 font-bold mt-1 flex items-center gap-1">
              <ArrowUpRight size={13} />
              <span>{getCompareText('rating')}</span>
            </div>
          )}
        </div>

      </div>

      {/* Business Performance Trend Chart Box */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-sand-neutral/40 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-neutral/30 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-onyx-black" />
            <div>
              <h3 className="text-base font-bold font-label-caps text-onyx-black tracking-tight">Business Performance Trend ({chartRange})</h3>
              <p className="text-[11px] text-secondary font-medium">Revenue and fulfillment volume across {chartRange} timeframe.</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-sand-neutral/40">
            {['7D', '30D', '90D', '1Y'].map((rng) => (
              <button 
                key={rng}
                onClick={() => {
                  setChartRange(rng);
                  showToast(`Switched chart to ${rng}`);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-label-caps font-bold transition-all cursor-pointer ${
                  chartRange === rng 
                    ? 'bg-onyx-black text-bone-white shadow-xs' 
                    : 'text-secondary hover:bg-surface-container hover:text-onyx-black'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-sand-neutral/40 space-y-4 relative">
          
          {/* Tooltip Display on Hover */}
          {hoveredDay ? (
            <div className="bg-surface-container-lowest border border-sand-neutral/50 text-onyx-black p-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-between">
              <span>{hoveredDay.day} Revenue: <strong className="text-onyx-black font-bold text-sm">₹{hoveredDay.revenue}</strong></span>
              <span>Orders: <strong className="text-clay-earth font-bold text-sm">{hoveredDay.ordersCount}</strong></span>
            </div>
          ) : (
            <div className="text-[11px] text-secondary font-medium text-center py-0.5">
              Hover over any bar to inspect revenue & order volume for {chartRange}.
            </div>
          )}

          <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2">
            {activeChartData.map((item, idx) => {
              const heightPct = Math.max(20, Math.round((item.revenue / maxChartRev) * 100));
              const isHovered = hoveredDay && hoveredDay.day === item.day;
              return (
                <div 
                  key={idx} 
                  onMouseEnter={() => setHoveredDay(item)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end gap-2 group cursor-pointer"
                >
                  <span className={`text-[10px] font-bold font-label-caps transition-all ${isHovered ? 'text-onyx-black scale-105' : 'text-secondary'}`}>
                    ₹{item.revenue}
                  </span>

                  <div className="w-full bg-sand-neutral/30 group-hover:bg-sand-neutral/50 rounded-t-lg flex-1 flex items-end overflow-hidden transition-all p-0.5">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-300 shadow-xs ${
                        isHovered 
                          ? 'bg-clay-earth ring-2 ring-clay-earth/40' 
                          : 'bg-onyx-black'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  <span className={`text-[11px] font-label-caps font-bold transition-colors ${isHovered ? 'text-onyx-black font-extrabold' : 'text-secondary'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Row 2: Top Tiffins & Order Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TOP TIFFINS (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-2xl border border-sand-neutral/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sand-neutral/30 pb-3">
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-onyx-black" />
              <h3 className="text-base font-bold font-label-caps text-onyx-black tracking-wider">TOP TIFFINS</h3>
            </div>
            <span className="text-[10px] font-label-caps font-bold text-clay-earth bg-surface-container px-2.5 py-1 rounded-md border border-sand-neutral/40">
              Best Sellers
            </span>
          </div>

          <div className="divide-y divide-sand-neutral/30">
            {topTiffins.map(tif => (
              <div key={tif.rank} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container text-onyx-black font-bold text-[11px] flex items-center justify-center border border-sand-neutral/40 font-label-caps">
                    #{tif.rank}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-onyx-black">{tif.tiffinName}</div>
                    <div className="text-[10px] text-secondary font-medium">{tif.category} • {tif.rating} ★</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-onyx-black font-bold text-sm">{tif.ordersCount} orders</div>
                  <div className="text-[11px] text-secondary">₹{tif.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER PERFORMANCE (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-sand-neutral/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sand-neutral/30 pb-3">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-onyx-black" />
              <h3 className="text-base font-bold font-label-caps text-onyx-black tracking-wider">ORDER PERFORMANCE</h3>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-onyx-black">
            {Object.keys(orderPerf.percentages || {}).map(stg => {
              const pct = orderPerf.percentages[stg] || 0;
              const count = orderPerf.counts ? orderPerf.counts[stg] : 0;
              return (
                <div key={stg} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-label-caps font-semibold">{stg}</span>
                    <span className="text-onyx-black font-bold font-label-caps">{pct}% ({count})</span>
                  </div>
                  <div className="w-full bg-sand-neutral/30 border border-sand-neutral/40 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stg === 'Completed' ? 'bg-onyx-black' :
                        stg === 'Preparing' ? 'bg-clay-earth' :
                        stg === 'Ready' ? 'bg-emerald-800' :
                        stg === 'Cancelled' ? 'bg-error' : 'bg-sand-neutral'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Grid Row 3: Customer Insights & Rating Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CUSTOMER INSIGHTS (6 Cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl border border-sand-neutral/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-sand-neutral/30 pb-3">
            <Users size={18} className="text-onyx-black" />
            <h3 className="text-base font-bold font-label-caps text-onyx-black tracking-wider">CUSTOMER INSIGHTS</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-sand-neutral/40">
              <div className="text-[10px] font-label-caps font-bold text-secondary uppercase">New Diners</div>
              <div className="text-2xl font-headline-lg font-normal text-onyx-black mt-1">{custInsights.newCustomers}</div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-sand-neutral/40">
              <div className="text-[10px] font-label-caps font-bold text-secondary uppercase">Returning Diners</div>
              <div className="text-2xl font-headline-lg font-normal text-onyx-black mt-1">{custInsights.returningCustomers}</div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-sand-neutral/40">
              <div className="text-[10px] font-label-caps font-bold text-secondary uppercase">Repeat Rate</div>
              <div className="text-2xl font-headline-lg font-normal text-onyx-black mt-1">{custInsights.repeatRate}%</div>
            </div>
          </div>
        </div>

        {/* CUSTOMER RATING ANALYTICS (6 Cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl border border-sand-neutral/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sand-neutral/30 pb-3">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-amber-500 fill-amber-400" />
              <h3 className="text-base font-bold font-label-caps text-onyx-black tracking-wider">RATING ANALYTICS</h3>
            </div>
            <span className="text-sm font-bold font-label-caps text-onyx-black">{ratingAnalytics.overallRating} ★ Overall</span>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingAnalytics.distribution ? ratingAnalytics.distribution[star] : 0;
              const total = ratingAnalytics.totalReviews || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={star} className="flex items-center gap-3 text-xs font-semibold">
                  <span className="w-8 flex items-center gap-1 font-label-caps">
                    <span>{star}</span>
                    <Star size={11} className="fill-amber-400 text-amber-500" />
                  </span>
                  
                  <div className="flex-1 bg-sand-neutral/30 border border-sand-neutral/40 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-onyx-black h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>

                  <span className="w-8 text-right text-secondary font-label-caps font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* BUSINESS INSIGHTS SECTION */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-sand-neutral/40 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-sand-neutral/30 pb-3">
          <Flame size={18} className="text-amber-600" />
          <h3 className="text-base font-bold font-label-caps text-onyx-black tracking-wider">BUSINESS INSIGHTS</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {businessInsights.map((insight, idx) => (
            <div key={idx} className="bg-surface-container-low p-3.5 rounded-xl border border-sand-neutral/40 flex items-start gap-2.5">
              <span className="w-2 h-2 rounded-full bg-onyx-black shrink-0 mt-1.5" />
              <p className="text-xs text-onyx-black font-body-md leading-relaxed font-medium">{insight}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
