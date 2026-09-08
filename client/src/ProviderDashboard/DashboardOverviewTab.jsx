import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function DashboardOverviewTab({ currentUser, onNavigateTab }) {
  const chefName = currentUser?.name || 'Chef Aria';

  const [stats, setStats] = useState({
    liveRequestsCount: 2,
    todaysOrdersCount: 18,
    revenueToday: 6450.00,
    rating: 4.95,
    reviewCount: 320
  });

  const [orders, setOrders] = useState([
    { id: '#TL-4487', customer: 'Vikram Mehta', type: 'Executive 4-Tier', time: '12:15 PM', rider: 'Rohan V.', status: 'DELIVERED', statusBg: 'bg-[#f0ece1] text-[#2c2b29]' },
    { id: '#TL-4481', customer: 'Sunita Rao', type: 'Sattvic Mini Box', time: '12:30 PM', rider: 'Karan D.', status: 'DELIVERED', statusBg: 'bg-[#f0ece1] text-[#2c2b29]' },
    { id: '#TL-4476', customer: 'Kabir Khan', type: 'Diet Keto Homestyle', time: '12:45 PM', rider: 'Rahul S.', status: 'IN TRANSIT', statusBg: 'bg-amber-100 text-amber-900' },
    { id: '#TL-4469', customer: 'Devika Sen', type: 'Standard North Veg', time: '1:15 PM', rider: 'Unassigned', status: 'PREPARING', statusBg: 'bg-[#171717] text-white' }
  ]);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Poll MongoDB Database for Real Dashboard Data
  useEffect(() => {
    const fetchDashboardDataFromDb = async () => {
      try {
        const ordJson = await apiRequest('/orders');
        if (ordJson.success && Array.isArray(ordJson.data) && ordJson.data.length > 0) {
          const fetchedOrders = ordJson.data;
          const revToday = fetchedOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
          
          setStats(prev => ({
            ...prev,
            todaysOrdersCount: fetchedOrders.length || prev.todaysOrdersCount,
            revenueToday: revToday || prev.revenueToday
          }));

          const activeOrdersFormatted = fetchedOrders.slice(0, 5).map(o => {
            let statusBg = 'bg-[#f0ece1] text-[#2c2b29]';
            if (o.status === 'Preparing') statusBg = 'bg-[#171717] text-white';
            if (o.status === 'In Transit') statusBg = 'bg-amber-100 text-amber-900';
            if (o.status === 'Delivered') statusBg = 'bg-[#f0ece1] text-[#2c2b29]';

            return {
              id: o.orderId || '#TL-9042',
              customer: o.customerName || 'Customer',
              type: o.tiffinName || 'Artisanal Tiffin Box',
              time: '12:45 PM',
              rider: o.deliveryPartnerName || 'Assigned Rider',
              status: (o.status || 'DELIVERED').toUpperCase(),
              statusBg
            };
          });

          setOrders(activeOrdersFormatted);
        }
      } catch (err) {
        console.error('Error fetching dashboard data from DB:', err);
      }
    };

    fetchDashboardDataFromDb();
  }, []);

  return (
    <div className="space-y-8 font-sans bg-[#fbf9f5] text-[#171717] pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#171717] text-white px-5 py-3 rounded-sm shadow-xl font-medium text-xs animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <header className="pt-2 pb-6 border-b border-[#e7e3db]/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <p className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#726f68] mb-1.5">
            Shift Overview • Live Session
          </p>
          <h2 className="font-serif text-4xl text-black font-normal tracking-tight">
            Partner Dashboard
          </h2>
          <p className="text-sm text-[#726f68] mt-1.5 font-light">
            Welcome back, {chefName}. Your kitchen production queue and dispatch timings are synchronized.
          </p>
        </div>

        {/* Top Utility Controls */}
        <div className="flex items-center flex-wrap gap-2.5 self-start lg:self-center">
          {/* Live Active Shift Pill */}
          <div className="flex items-center space-x-2 bg-[#171717] text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>SHIFT ACTIVE</span>
          </div>

          {/* Live Radar Button */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('requests')}
            className="flex items-center space-x-2 bg-white border border-[#e7e3db] text-[#171717] px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-[#f5f1e8] rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            <span>📡</span>
            <span>Live Radar</span>
          </button>

          {/* Broadcast Alert Button */}
          <button
            type="button"
            onClick={() => showToast('Kitchen broadcast notification sent to all active delivery partners!')}
            className="flex items-center space-x-1.5 bg-white border border-[#e7e3db] text-rose-700 px-4 py-2.5 text-xs font-semibold tracking-wide hover:bg-rose-50 rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            <span>✳</span>
            <span>Kitchen Broadcast</span>
          </button>
        </div>
      </header>

      {/* BEGIN: MetricsOverviewRow (4 Column Summary Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-purpose="kpi-metrics-grid">
        {/* Metric 1: Today's Earnings */}
        <div className="bg-white border border-[#e7e3db] p-5 rounded-sm relative flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#726f68]">Today's Earnings</span>
            <span className="text-xs text-[#726f68]">💳</span>
          </div>
          <div className="mt-4">
            <p className="font-serif text-3xl font-medium text-black">
              ₹{stats.revenueToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#4d7355] mt-1 flex items-center font-medium">
              <span className="mr-1">↑ 14%</span> <span class="text-[#726f68] font-normal">vs yesterday</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Completed Orders Target */}
        <div className="bg-white border border-[#e7e3db] p-5 rounded-sm relative flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#726f68]">Completed Orders</span>
            <span className="text-xs text-[#726f68]">✓</span>
          </div>
          <div className="mt-3">
            <p className="font-serif text-3xl font-medium text-black">
              {stats.todaysOrdersCount} <span className="text-base text-[#726f68] font-sans font-normal">/ 24</span>
            </p>
            <div className="w-full bg-[#f0ebdF] h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#171717] h-full transition-all duration-500" 
                style={{ width: `${Math.min((stats.todaysOrdersCount / 24) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-[#726f68]">
              <span>Daily Target</span>
              <span className="font-medium text-[#171717]">
                {Math.round((stats.todaysOrdersCount / 24) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Active in Kitchen (Dark Accent Card) */}
        <div className="bg-[#171717] text-white p-5 rounded-sm relative flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-300">Active In Kitchen</span>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          </div>
          <div className="mt-4">
            <p className="font-serif text-3xl font-medium text-white">4 Preparing</p>
            <p className="text-[11px] text-zinc-300 mt-1 truncate">
              2 Ready for Handover
            </p>
          </div>
        </div>

        {/* Metric 4: Customer & Hygiene Rating */}
        <div className="bg-white border border-[#e7e3db] p-5 rounded-sm relative flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#726f68]">Hygiene &amp; Rating</span>
            <span className="text-xs text-[#726f68]">★</span>
          </div>
          <div className="mt-4">
            <p className="font-serif text-3xl font-medium text-black">
              {stats.rating} <span className="text-xl text-amber-500">★</span>
            </p>
            <p className="text-[11px] text-[#726f68] mt-1">
              FSSAI Verified • {stats.reviewCount} patron reviews
            </p>
          </div>
        </div>
      </section>

      {/* BEGIN: MainTwoColumnWorkArea */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8" data-purpose="work-area-layout">
        
        {/* LEFT COLUMN: Live Production Pipeline & Handover Log (7 Cols) */}
        <div className="xl:col-span-7 space-y-8">
          
          {/* Kitchen Production Pipeline Card */}
          <div className="bg-white border border-[#e7e3db] p-7 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]" data-purpose="live-order-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#e7e3db]/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#726f68]">Operational Dispatch</p>
                <h3 className="font-serif text-2xl text-black mt-0.5">Live Kitchen Production Pipeline</h3>
              </div>
              <span className="bg-[#171717] text-white text-[11px] font-mono uppercase px-2.5 py-1 tracking-wider rounded-sm font-semibold">
                ORDER #TL-9042
              </span>
            </div>

            {/* Pipeline Item Details */}
            <div className="mt-6 space-y-6">
              {/* Timeline node 1: Customer Profile */}
              <div className="flex items-start space-x-3.5">
                <div className="w-3 h-3 rounded-full border-2 border-emerald-600 bg-white mt-1 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#726f68]">Subscriber Handover (Priority 1)</p>
                  <p className="text-base font-semibold text-black mt-0.5">Priya Nair <span className="text-xs font-normal text-[#726f68]">• Monthly Lunch Subscriber</span></p>
                  <p className="text-xs text-[#726f68]">1x Premium Brass 3-Tier Lunch (Paneer Makhani, Multigrain Roti, Dal Tadka, Salad)</p>
                </div>
                <span className="text-sm">🍱</span>
              </div>

              {/* Timeline node 2: Delivery & Timings */}
              <div className="flex items-start space-x-3.5">
                <div className="w-3 h-3 rounded-full bg-[#171717] mt-1 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#726f68]">Target Dispatch Time</p>
                  <p className="text-sm font-semibold text-black mt-0.5">12:45 PM Handover (Countdown: 14 mins)</p>
                  <p className="text-xs text-[#726f68]">Assigned Courier: Rahul Sharma (Arrived at Gate 2)</p>
                </div>
                <span className="text-sm">📍</span>
              </div>

              {/* Secondary Nested Alert Box */}
              <div className="bg-[#f7f5f0] border border-[#e6e2d8] p-4 rounded-sm flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">⏲️</span>
                  <div>
                    <p className="text-xs font-semibold text-[#171717]">Order #TL-9048 — Ananya &amp; Sidharth</p>
                    <p className="text-[11px] text-[#726f68]">Twin Lunch Pack • Special Note: Less spicy, no coriander</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#8e8b83] tracking-wide">Ready Slot</span>
                  <p className="text-xs font-mono font-bold text-black">1:05 PM</p>
                </div>
              </div>

              {/* Operational Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => showToast('Order #TL-9042 marked as Packed & Ready!')}
                  className="bg-[#171717] hover:bg-black text-white px-4 py-3 text-xs font-semibold tracking-wider uppercase rounded-sm transition-colors text-center shadow-sm cursor-pointer"
                >
                  Mark as Packed &amp; Ready
                </button>
                <button 
                  type="button"
                  onClick={() => showToast('Contacting assigned rider Rahul Sharma (+91 98765 43210)...')}
                  className="bg-white hover:bg-[#f7f5f0] border border-[#e7e3db] text-[#171717] px-4 py-3 text-xs font-semibold tracking-wider uppercase rounded-sm transition-colors text-center cursor-pointer"
                >
                  Contact Assigned Rider
                </button>
              </div>
            </div>
          </div>

          {/* Completed Runs / Dispatch Log Table */}
          <div className="bg-white border border-[#e7e3db] p-7 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]" data-purpose="dispatch-log">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#726f68]">Ledger</p>
                <h3 className="font-serif text-2xl text-black mt-0.5">Today's Dispatch Runs &amp; Handover Log</h3>
              </div>
              <button 
                onClick={() => onNavigateTab && onNavigateTab('delivery-management')}
                className="text-xs font-medium text-black hover:underline underline-offset-4 decoration-1 cursor-pointer"
              >
                View Complete Log
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e7e3db] text-[10px] uppercase tracking-[0.14em] text-[#726f68]">
                    <th className="pb-2.5 font-bold">Order ID</th>
                    <th className="pb-2.5 font-bold">Customer</th>
                    <th className="pb-2.5 font-bold">Tiffin Type</th>
                    <th className="pb-2.5 font-bold">Slot Time</th>
                    <th className="pb-2.5 font-bold">Rider Assigned</th>
                    <th className="pb-2.5 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e3db]/60 text-[#171717] font-sans">
                  {orders.map((o, idx) => (
                    <tr key={o.id || idx}>
                      <td className="py-3.5 font-mono text-[11px] font-medium text-black">{o.id}</td>
                      <td className="py-3.5 font-medium">{o.customer}</td>
                      <td className="py-3.5 text-[#524f49]">{o.type}</td>
                      <td className="py-3.5 text-[#726f68]">{o.time}</td>
                      <td className="py-3.5 text-[#524f49]">{o.rider}</td>
                      <td className="py-3.5 text-right">
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${o.statusBg || 'bg-[#f0ece1] text-[#2c2b29]'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Radar, Targets & Kitchen Cleanliness (5 Cols) */}
        <div className="xl:col-span-5 space-y-8">
          
          {/* Live Requests Radar Card */}
          <div className="bg-white border border-[#e7e3db] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]" data-purpose="live-radar-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e3db]/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#726f68]">Demand Radar</p>
                <h3 className="font-serif text-xl text-black">Live Custom Requests</h3>
              </div>
              <span className="text-[10px] font-mono text-[#726f68] uppercase tracking-wider">Real-Time</span>
            </div>

            {/* Surge Alert Banner */}
            <div className="mt-4 bg-[#171717] text-white p-3.5 rounded-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Service Corridor</span>
                <p className="text-xs font-semibold tracking-wide mt-0.5">Bandra West &amp; Khar Dhabas</p>
              </div>
              <span className="bg-white text-[#171717] text-[11px] font-bold px-2.5 py-1 rounded-sm">
                +₹40 SURGE
              </span>
            </div>

            {/* Radar List */}
            <div className="mt-4 space-y-3">
              {/* Item 1 */}
              <div className="p-3 bg-[#fbf9f5] border border-[#e7e3db] rounded-sm hover:bg-[#f6f2e9] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-semibold text-[#171717]">Corporate Bulk Lunch (12 Pax)</h5>
                    <p className="text-[11px] text-[#726f68] mt-0.5">Pali Hill Studio • Delivery by 1:30 PM</p>
                  </div>
                  <span className="bg-[#171717] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm font-mono">+₹480</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e7e3db]/60">
                  <span className="text-[10px] text-amber-700 font-medium">Expires in 03:42 mins</span>
                  <button 
                    type="button"
                    onClick={() => {
                      showToast('Corporate Bulk Lunch request accepted!');
                      if (onNavigateTab) onNavigateTab('orders-preparing');
                    }}
                    className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-black text-white hover:bg-zinc-800 rounded-sm cursor-pointer"
                  >
                    Accept Request
                  </button>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 bg-[#fbf9f5] border border-[#e7e3db] rounded-sm hover:bg-[#f6f2e9] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-semibold text-[#171717]">Gluten-Free Custom Tiffin</h5>
                    <p className="text-[11px] text-[#726f68] mt-0.5">Carter Road • Delivery by 1:15 PM</p>
                  </div>
                  <span className="bg-[#e9e4d8] text-[#171717] text-[10px] font-bold px-2 py-0.5 rounded-sm font-mono">+₹40</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#e7e3db]/60">
                  <span className="text-[10px] text-emerald-800 font-medium">Direct Repeat Patron</span>
                  <button 
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('requests');
                    }}
                    className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-white border border-[#e7e3db] hover:bg-[#eae4d5] rounded-sm cursor-pointer"
                  >
                    Review Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Target & Volume Incentives */}
          <div className="bg-white border border-[#e7e3db] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]" data-purpose="incentives-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e3db]/60">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#726f68]">Incentive Program</p>
                <h3 className="font-serif text-xl text-black">Daily Target &amp; Incentives</h3>
              </div>
              <span className="text-base">🎖️</span>
            </div>

            {/* Afternoon Target Stat Box */}
            <div className="mt-4 p-4 bg-[#f8f5ee] border border-[#e7e3db] rounded-sm">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#726f68]">Afternoon Target</span>
                  <p className="font-serif text-2xl font-medium text-black mt-1">
                    {stats.todaysOrdersCount} of 24 <span className="text-xs font-sans text-[#726f68]">meals fulfilled</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Earn ₹450</span>
                  <p className="text-[10px] text-[#726f68]">Bonus Pool</p>
                </div>
              </div>
              <div className="w-full bg-[#e3ded4] h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-black h-full transition-all duration-500" 
                  style={{ width: `${Math.min((stats.todaysOrdersCount / 24) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-[#726f68] mt-2">
                {Math.max(0, 24 - stats.todaysOrdersCount)} meals required before 3:00 PM kitchen cut-off
              </p>
            </div>

            {/* Checklist Milestones */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-sm border border-[#e7e3db]/80 bg-white">
                <span className="flex items-center space-x-2 text-[#171717] font-medium">
                  <span className="text-emerald-700">☑</span>
                  <span>Base Kitchen Quota (15 orders)</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-800">+₹200 Unlocked</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-sm border border-[#e7e3db]/80 bg-white">
                <span className="flex items-center space-x-2 text-[#171717] font-medium">
                  <span className="text-zinc-400">☐</span>
                  <span>Peak Lunch Surge (24 orders)</span>
                </span>
                <span className="text-[11px] text-[#726f68]">+₹250 Pending</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-sm border border-[#e7e3db]/80 bg-white">
                <span className="flex items-center space-x-2 text-[#171717] font-medium">
                  <span className="text-emerald-700">☑</span>
                  <span>100% On-Time Handover Streak</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-800">+₹100 EOD</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('earnings')}
              className="w-full mt-4 bg-[#f2ede4] hover:bg-[#e9e3d8] text-[#171717] text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-sm transition-colors cursor-pointer"
            >
              Explore Incentive Rules
            </button>
          </div>

          {/* Kitchen Hygiene & Quick Desk Log */}
          <div className="bg-[#f7f5ee] border border-[#e7e3db] p-4 rounded-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs">
                🎧
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#171717]">Provider Desk Live Support</h5>
                <p className="text-[10px] text-[#726f68]">Avg. Chef Response: &lt; 2 minutes</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('help')}
              className="text-xs font-bold tracking-wider uppercase text-black hover:underline underline-offset-4 decoration-1 cursor-pointer"
            >
              GET HELP
            </button>
          </div>

        </div>

      </section>
      {/* END: MainTwoColumnWorkArea */}
    </div>
  );
}
