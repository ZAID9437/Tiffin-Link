import React, { useState, useEffect } from 'react';

export default function FleetAnalyticsTab({ onNavigate }) {
  const [timeHorizon, setTimeHorizon] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isEscrowClearing, setIsEscrowClearing] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      totalPartners: 0,
      activeFleet: 0,
      fleetUtilization: '0%',
      totalDeliveries: '0',
      completionSla: '100%',
      avgLatency: '—'
    },
    availabilityAllocation: {
      onlineFleet: { count: 0, percentage: '0%' },
      inTransit: { count: 0, percentage: '0%' },
      stagedAtHubs: { count: 0, percentage: '0%' },
      offlineRest: { count: 0, percentage: '0%' },
      suspendedHold: { count: 0, percentage: '0%' }
    },
    latencyVolumeTelemetry: {
      completedDeliveries: '0',
      completedDeliveriesSub: '0% total cycle',
      onTimeSlaRate: '100%',
      onTimeSlaSub: '< 35 min guarantee',
      firstRoundAccept: '100%',
      firstRoundAcceptSub: 'Dispatch lock time <40s',
      cancelledOrders: '0',
      cancelledOrdersSub: '0% total pool',
      failedOtpRate: '0',
      failedOtpSub: '0% dispute rate',
      avgDwellKitchen: '—',
      avgDwellSub: 'Packaging handoff lag'
    },
    leaderboard: [],
    corridors: [],
    financialSummary: {
      grossGmv: '₹0',
      partnerDirectPayouts: '₹0',
      platformTakeRate: '₹0',
      incentivesFuel: '₹0',
      settledImps: '₹0',
      pendingEscrow: '₹0'
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/fleet-analytics?timeHorizon=${timeHorizon}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load fleet analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeHorizon]);

  const handleExportDossier = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      reportTitle: 'TiffinLink Fleet Operational Telemetry & Analytics Dossier',
      generatedAt: new Date().toISOString(),
      timeHorizon,
      ...analyticsData
    }, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `tiffinlink_fleet_analytics_dossier_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast('Exported Fleet Operational Dossier (JSON / CSV).');
  };

  const handleGenerateBenchmark = () => {
    showToast('Generating Ahmedabad West Cluster Benchmark across 4 corridors...');
    setTimeout(() => {
      showToast('Benchmark generated: Fleet efficiency is +14.2% above Ahmedabad metro average.');
    }, 1200);
  };

  const handleRebalanceHub = () => {
    setIsRebalancing(true);
    showToast('Initiating dynamic corridor auto-dispatch rebalancing...');
    setTimeout(() => {
      setIsRebalancing(false);
      showToast('Rebalanced Satellite Hub: 3 standby couriers staged towards Bodakdev SG Highway.');
    }, 1500);
  };

  const handleTriggerEscrow = () => {
    setIsEscrowClearing(true);
    showToast('Authorizing Yes Bank Nodal API Gateway instant escrow clearance...');
    setTimeout(() => {
      setIsEscrowClearing(false);
      showToast('Instant Escrow Clearance executed: ₹6,510 queued for immediate IMPS disbursal.');
    }, 1800);
  };

  const handleDownloadTax = () => {
    showToast('Generating TDS 194C Form Statement for FY 2026-27 (Quarter 3)...');
  };

  return (
    <div className="flex flex-col w-full font-sans antialiased text-[#1b1c1a]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white px-4 py-2.5 rounded shadow-2xl font-mono text-xs flex items-center gap-2 border border-[#ded9d1] animate-fadeIn">
          <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* BREADCRUMB & CONTEXT META */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#ded9d1]/60">
        <div className="flex items-center gap-2 font-mono text-xs text-[#665d52] uppercase tracking-widest">
          <span>SUPER ADMIN</span>
          <span className="text-[#ded9d1]">/</span>
          <span>MANAGEMENT</span>
          <span className="text-[#ded9d1]">/</span>
          <span>DELIVERY PARTNERS</span>
          <span className="text-[#ded9d1]">/</span>
          <span className="text-[#1a1a1a] font-bold">FLEET ANALYTICS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#efeeea] text-[#444748] font-mono text-[11px] uppercase tracking-wider border border-[#ded9d1]">
            <span className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full animate-pulse" />
            STREAM: ACTIVE TELEMETRY
          </span>
          <span className="font-mono text-[11px] text-[#665d52] tracking-widest uppercase">
            NODE: BOM-IND-01-A
          </span>
        </div>
      </div>

      {/* COMMAND CENTER HEADER & ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#ded9d1] mb-8">
        <div className="max-w-3xl space-y-2">
          <div className="font-mono text-xs text-[#665d52] uppercase tracking-[0.2em]">
            TELEMETRIC DISPATCH &amp; YIELD ENGINE
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1a1a1a] tracking-tight font-normal">
            Fleet Operational Telemetry &amp; Analytics
          </h1>
          <p className="text-sm sm:text-base text-[#444748] max-w-2xl leading-relaxed">
            Platform-wide analytics of delivery partner capacity, fulfillment velocity, corridor density, partner earnings, and route efficiency.
          </p>
        </div>

        {/* ACTION CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Horizon Selector */}
          <div className="relative inline-block">
            <select
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="appearance-none bg-[#f5f3ef] text-[#1a1a1a] font-mono text-xs uppercase tracking-wider pl-4 pr-10 py-2.5 focus:outline-none border-b-2 border-[#1a1a1a] cursor-pointer"
            >
              <option value="30d">Time Horizon: Last 30 Days</option>
              <option value="today">Time Horizon: Current Shift (Today)</option>
              <option value="7d">Time Horizon: Last 7 Days (W-42)</option>
              <option value="qtd">Time Horizon: Quarter to Date</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#665d52] text-[18px]">
              expand_more
            </span>
          </div>

          {/* Export Dossier */}
          <button
            onClick={handleExportDossier}
            className="flex items-center gap-2 bg-[#eae8e4] hover:bg-[#efeeea] text-[#1a1a1a] font-mono text-xs uppercase tracking-wider px-4 py-2.5 transition-colors border border-[#ded9d1] shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span>Export Dossier (PDF/CSV)</span>
          </button>

          {/* Generate Benchmark */}
          <button
            onClick={handleGenerateBenchmark}
            className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-black text-white font-mono text-xs uppercase tracking-wider px-5 py-2.5 transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            <span>Generate Cluster Benchmark</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE KPI MATRIX */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-semibold">Total Partners</span>
            <span className="material-symbols-outlined text-[#665d52] text-[18px]">group</span>
          </div>
          <div>
            <div className="font-serif text-3xl text-[#1a1a1a] leading-none">{analyticsData.kpis.totalPartners}</div>
            <div className="font-mono text-[11px] text-[#444748] mt-2 tracking-tight">Registered fleet pool</div>
          </div>
        </div>

        <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-semibold">Active Fleet</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#1a1a1a] bg-[#efeeea] px-1.5 py-0.5 border border-[#ded9d1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] animate-ping" />
              LIVE
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl text-[#1a1a1a] leading-none">{analyticsData.kpis.activeFleet}</div>
            <div className="font-mono text-[11px] text-[#444748] mt-2 tracking-tight">Daily operational headcount</div>
          </div>
        </div>

        <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-semibold">Fleet Utilization</span>
            <span className="material-symbols-outlined text-[#665d52] text-[18px]">timelapse</span>
          </div>
          <div>
            <div className="font-serif text-3xl text-[#1a1a1a] leading-none">{analyticsData.kpis.fleetUtilization}</div>
            <div className="font-mono text-[11px] text-[#444748] mt-2 tracking-tight">Active transit vs standby</div>
          </div>
        </div>

        <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-semibold">Total Deliveries</span>
            <span className="material-symbols-outlined text-[#665d52] text-[18px]">takeout_dining</span>
          </div>
          <div>
            <div className="font-serif text-3xl text-[#1a1a1a] leading-none">{analyticsData.kpis.totalDeliveries}</div>
            <div className="font-mono text-[11px] text-[#444748] mt-2 tracking-tight">Last 30-day aggregate</div>
          </div>
        </div>

        <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-semibold">Completion SLA</span>
            <span className="material-symbols-outlined text-[#665d52] text-[18px]">verified</span>
          </div>
          <div>
            <div className="font-serif text-3xl text-[#1a1a1a] leading-none">{analyticsData.kpis.completionSla}</div>
            <div className="font-mono text-[11px] text-[#444748] mt-2 tracking-tight">Target: &gt;95.0% threshold</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] text-white p-5 flex flex-col justify-between h-36 border border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-stone-400 uppercase tracking-wider font-semibold">Avg Latency</span>
            <span className="material-symbols-outlined text-stone-400 text-[18px]">speed</span>
          </div>
          <div>
            <div className="font-serif text-3xl text-white leading-none">
              {analyticsData.kpis.avgLatency.split(' ')[0]} <span className="font-sans text-sm font-light text-stone-400">min</span>
            </div>
            <div className="font-mono text-[11px] text-stone-400 mt-2 tracking-tight">Dispatch to customer OTP</div>
          </div>
        </div>
      </div>

      {/* GRID ROW 1: CAPACITY ALLOCATION & SLA TELEMETRY TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* PANEL 1: Fleet Utilization & Availability State Breakdown (5 COLS) */}
        <div className="lg:col-span-5 bg-[#f5f3ef] p-6 flex flex-col justify-between border border-[#ded9d1]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1] mb-5">
              <div>
                <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase block">State Distribution</span>
                <h2 className="font-serif text-2xl text-[#1a1a1a] font-normal">Fleet Availability Allocation</h2>
              </div>
              <span className="font-mono text-xs text-[#665d52] tracking-wider">67 REGISTERED</span>
            </div>

            {/* Stacked Utilization Segment Bar */}
            <div className="w-full bg-[#ded9d1] h-3 flex overflow-hidden mb-6">
              <div className="bg-[#1a1a1a] h-full" style={{ width: '50.7%' }} title="Online: 50.7%" />
              <div className="bg-[#4a4238] h-full" style={{ width: '26.9%' }} title="On Delivery: 26.9%" />
              <div className="bg-[#665d52] h-full" style={{ width: '22.4%' }} title="Available at Hubs: 22.4%" />
            </div>

            {/* Metric Rows */}
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[#ded9d1]/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#1a1a1a]" />
                  <span className="text-[#1a1a1a] font-medium font-sans">Online Fleet</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#665d52]">34 Couriers</span>
                  <span className="text-[#1a1a1a] font-semibold text-right w-12">50.7%</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#ded9d1]/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#4a4238]" />
                  <span className="text-[#1a1a1a] font-medium font-sans">In-Transit (Active Order)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#665d52]">18 Couriers</span>
                  <span className="text-[#1a1a1a] font-semibold text-right w-12">26.9%</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#ded9d1]/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#665d52]" />
                  <span className="text-[#1a1a1a] font-medium font-sans">Staged at Cloud Kitchens</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#665d52]">15 Couriers</span>
                  <span className="text-[#1a1a1a] font-semibold text-right w-12">22.4%</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#ded9d1]/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#dbdad6]" />
                  <span className="text-[#665d52] font-sans">Offline (Rest / Off-Shift)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#665d52]">18 Couriers</span>
                  <span className="text-[#665d52] text-right w-12">—</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-[#ba1a1a]" />
                  <span className="text-red-700 font-medium font-sans">Suspended / Compliance Lock</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-red-700">2 Couriers</span>
                  <span className="text-red-700 font-semibold text-right w-12">3.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Advisory Footnote */}
          <div className="mt-6 pt-4 border-t border-[#ded9d1] flex items-start gap-2.5 text-xs text-[#444748]">
            <span className="material-symbols-outlined text-[#665d52] text-[16px] mt-0.5">info</span>
            <span className="font-sans">
              Peak lunchtime window [12:15 - 13:45 IST] requires minimum 38 active units to maintain &lt;30m doorstep SLA. Current buffer: +4 standby units.
            </span>
          </div>
        </div>

        {/* PANEL 2: Delivery Performance & Fulfillment SLA Trends (7 COLS) */}
        <div className="lg:col-span-7 bg-[#f5f3ef] p-6 flex flex-col justify-between border border-[#ded9d1]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ded9d1] gap-2 mb-4">
              <div>
                <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase block">30-Day Fulfillment Curve</span>
                <h2 className="font-serif text-2xl text-[#1a1a1a] font-normal">Cook-to-Doorstep Latency &amp; Volume Telemetry</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#665d52]">
                  <span className="w-2.5 h-0.5 bg-[#1a1a1a]" /> VOLUME (DELIVERIES)
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#665d52]">
                  <span className="w-2.5 h-0.5 bg-[#4a4238] border-b border-dashed border-[#4a4238]" /> LATENCY (MIN)
                </div>
              </div>
            </div>

            {/* Inline Telemetry SVG Graph */}
            <div className="w-full h-48 py-2 relative">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 160">
                {/* Grid lines */}
                <line className="text-[#ded9d1]" stroke="currentColor" strokeDasharray="3,3" strokeWidth="0.75" x1="0" x2="600" y1="20" y2="20" />
                <line className="text-[#ded9d1]" stroke="currentColor" strokeDasharray="3,3" strokeWidth="0.75" x1="0" x2="600" y1="60" y2="60" />
                <line className="text-[#ded9d1]" stroke="currentColor" strokeDasharray="3,3" strokeWidth="0.75" x1="0" x2="600" y1="100" y2="100" />
                <line className="text-[#ded9d1]" stroke="currentColor" strokeWidth="1" x1="0" x2="600" y1="140" y2="140" />

                {/* Volume Area Fill + Stroke */}
                <path className="fill-[#ded9d1]/40" d="M 0,130 C 50,120 80,105 120,95 C 160,85 200,100 240,75 C 280,50 320,60 360,45 C 400,30 450,40 500,28 C 540,18 570,25 600,15 L 600,140 L 0,140 Z" />
                <path className="text-[#1a1a1a]" d="M 0,130 C 50,120 80,105 120,95 C 160,85 200,100 240,75 C 280,50 320,60 360,45 C 400,30 450,40 500,28 C 540,18 570,25 600,15" fill="none" stroke="currentColor" strokeWidth="2" />

                {/* Latency Stroke */}
                <path className="text-[#4a4238]" d="M 0,70 C 60,78 120,85 180,68 C 240,52 300,65 360,58 C 420,52 480,48 540,42 C 570,39 590,38 600,36" fill="none" stroke="currentColor" strokeDasharray="4,3" strokeWidth="1.75" />

                {/* Markers */}
                <circle className="fill-[#1a1a1a]" cx="500" cy="28" r="3.5" />
                <circle className="fill-[#4a4238]" cx="500" cy="45" r="3" />
              </svg>
              <div className="flex justify-between font-mono text-[10px] text-[#665d52] uppercase tracking-widest mt-1">
                <span>Day 01 (Oct 26)</span>
                <span>Day 10 (Nov 05)</span>
                <span>Day 20 (Nov 15)</span>
                <span>Day 30 (Nov 25 - Active)</span>
              </div>
            </div>

            {/* 6 Granular Telemetric KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-[#ded9d1] mt-2 font-mono">
              <div className="p-2.5 bg-white border border-[#ded9d1]">
                <span className="text-[10px] text-[#665d52] tracking-wider block uppercase">COMPLETED DELIVERIES</span>
                <span className="text-lg text-[#1a1a1a] font-semibold">{analyticsData.latencyVolumeTelemetry.completedDeliveries}</span>
                <span className="text-xs text-[#444748] block">{analyticsData.latencyVolumeTelemetry.completedDeliveriesSub}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#ded9d1]">
                <span className="text-[10px] text-[#665d52] tracking-wider block uppercase">ON-TIME SLA RATE</span>
                <span className="text-lg text-[#1a1a1a] font-semibold">{analyticsData.latencyVolumeTelemetry.onTimeSlaRate}</span>
                <span className="text-xs text-[#444748] block">{analyticsData.latencyVolumeTelemetry.onTimeSlaSub}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#ded9d1]">
                <span className="text-[10px] text-[#665d52] tracking-wider block uppercase">FIRST-ROUND ACCEPT</span>
                <span className="text-lg text-[#1a1a1a] font-semibold">{analyticsData.latencyVolumeTelemetry.firstRoundAccept}</span>
                <span className="text-xs text-[#444748] block">{analyticsData.latencyVolumeTelemetry.firstRoundAcceptSub}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#ded9d1]">
                <span className="text-[10px] text-[#665d52] tracking-wider block uppercase">CANCELLED ORDERS</span>
                <span className="text-lg text-[#1a1a1a] font-semibold">{analyticsData.latencyVolumeTelemetry.cancelledOrders}</span>
                <span className="text-xs text-[#665d52] block">{analyticsData.latencyVolumeTelemetry.cancelledOrdersSub}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#ded9d1]">
                <span className="text-[10px] text-[#665d52] tracking-wider block uppercase">FAILED HANDSHAKE / OTP</span>
                <span className="text-lg text-[#1a1a1a] font-semibold">{analyticsData.latencyVolumeTelemetry.failedOtpRate}</span>
                <span className="text-xs text-[#665d52] block">{analyticsData.latencyVolumeTelemetry.failedOtpSub}</span>
              </div>
              <div className="p-2.5 bg-white border border-[#ded9d1]">
                <span className="text-[10px] text-[#665d52] tracking-wider block uppercase">AVG DWELL AT KITCHEN</span>
                <span className="text-lg text-[#1a1a1a] font-semibold">{analyticsData.latencyVolumeTelemetry.avgDwellKitchen}</span>
                <span className="text-xs text-[#444748] block">{analyticsData.latencyVolumeTelemetry.avgDwellSub}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID ROW 2: PARTNER LEADERBOARD & GEOGRAPHIC CORRIDOR DENSITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* PANEL 3: Partner Performance Leaderboard Matrix (7 COLS) */}
        <div className="lg:col-span-7 bg-white p-6 border border-[#ded9d1]">
          <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1] mb-4">
            <div>
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase block">Operator Audit Matrix</span>
              <h2 className="font-serif text-2xl text-[#1a1a1a] font-normal">Partner Performance &amp; Disciplinary Audit</h2>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('drivers-all')}
              className="font-mono text-xs text-[#1a1a1a] underline hover:text-[#4a4238] transition-colors uppercase font-semibold"
            >
              View Complete Fleet Ledger →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#ded9d1] font-mono text-[11px] text-[#665d52] tracking-wider uppercase">
                  <th className="py-2.5 font-normal">Partner Detail</th>
                  <th className="py-2.5 font-normal text-right">Orders</th>
                  <th className="py-2.5 font-normal text-right">Completion</th>
                  <th className="py-2.5 font-normal text-right">Rating</th>
                  <th className="py-2.5 font-normal text-right">Earnings</th>
                  <th className="py-2.5 font-normal text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/50 font-mono">
                {analyticsData.leaderboard.map((leader) => {
                  const isError = leader.badgeTone === 'error';
                  const isTop = leader.badgeTone === 'onyx';
                  return (
                    <tr
                      key={leader.id}
                      className={`hover:bg-[#f5f3ef] transition-colors ${isError ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="py-3.5">
                        <div className={`font-semibold font-sans ${isError ? 'text-red-700' : 'text-[#1a1a1a]'}`}>{leader.name}</div>
                        <div className="font-mono text-[10px] text-[#665d52] tracking-wider uppercase">UID: {leader.id} • {leader.vehicleDesc}</div>
                      </td>
                      <td className={`py-3.5 text-right font-medium ${isError ? 'text-red-700' : 'text-[#1a1a1a]'}`}>{leader.orders}</td>
                      <td className={`py-3.5 text-right ${isError ? 'text-red-700' : 'text-[#1a1a1a]'}`}>{leader.completion}</td>
                      <td className={`py-3.5 text-right font-medium ${isError ? 'text-red-700' : 'text-[#1a1a1a]'}`}>{leader.rating}</td>
                      <td className={`py-3.5 text-right font-medium ${isError ? 'text-red-700' : 'text-[#1a1a1a]'}`}>{leader.earnings}</td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                          isError
                            ? 'bg-red-700 text-white'
                            : (isTop
                              ? 'bg-[#1a1a1a] text-white'
                              : 'bg-[#efeeea] text-[#1a1a1a] border border-[#ded9d1]')
                        }`}>
                          {leader.complianceBadge}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[#665d52] font-mono border-t border-[#ded9d1]/60">
            <span>* Ratings normalized over minimum 25 dispatched tiffin subscriptions</span>
            <span className="font-bold">AUTOMATED ESCALATION: 3 STRIKES POLICY</span>
          </div>
        </div>

        {/* PANEL 4: Geographical Corridor & Density Analytics (5 COLS) */}
        <div className="lg:col-span-5 bg-[#f5f3ef] p-6 flex flex-col justify-between border border-[#ded9d1]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1] mb-5">
              <div>
                <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase block">Spatial Routing Matrix</span>
                <h2 className="font-serif text-2xl text-[#1a1a1a] font-normal">Ahmedabad West Corridor Heatmap</h2>
              </div>
              <span className="font-mono text-xs text-[#1a1a1a] bg-[#eae8e4] px-2 py-1 uppercase tracking-wider border border-[#ded9d1]">
                ZONE 1
              </span>
            </div>

            {/* Geographic Corridor List */}
            <div className="space-y-4">
              {analyticsData.corridors.map((corridor, idx) => (
                <div key={idx} className="p-3 bg-white border border-[#ded9d1]">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[#1a1a1a] text-sm">{corridor.name}</div>
                    <span className="font-mono text-xs text-[#1a1a1a] font-semibold">{corridor.deliveries}</span>
                  </div>
                  <div className="w-full bg-[#ded9d1] h-1.5 mt-2 mb-2">
                    <div
                      className={`h-1.5 ${corridor.statusColor === 'onyx' ? 'bg-[#1a1a1a]' : (corridor.statusColor === 'clay' ? 'bg-[#4a4238]' : 'bg-[#665d52]')}`}
                      style={{ width: `${corridor.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-sans text-[#444748]">
                    <span>Status: <strong className="text-[#1a1a1a]">{corridor.statusLabel}</strong></span>
                    <span className={corridor.noteColor}>{corridor.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Trigger */}
          <div className="mt-4 pt-4 border-t border-[#ded9d1] flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#665d52] tracking-wider uppercase">DYNAMIC ROUTE CLUSTERING</span>
            <button
              onClick={handleRebalanceHub}
              disabled={isRebalancing}
              className="bg-[#1a1a1a] hover:bg-black text-white font-mono text-xs px-3.5 py-1.5 transition-colors uppercase flex items-center gap-1.5 shadow-sm"
            >
              <span className={`material-symbols-outlined text-xs ${isRebalancing ? 'animate-spin' : ''}`}>sync</span>
              <span>{isRebalancing ? 'Rebalancing...' : 'Rebalance Satellite Hub (Auto-Dispatch)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: FINANCIAL ECONOMICS & ESCROW PAYOUT SUMMARY */}
      <div className="bg-[#1a1a1a] text-white p-8 mb-12 shadow-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-stone-800 gap-4 mb-8">
          <div>
            <span className="font-mono text-xs text-stone-400 uppercase tracking-[0.2em] block mb-1">
              Settlement Ledger &amp; Treasury Disbursals
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-white tracking-tight font-normal">
              Financial Economics &amp; Payout Summary
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#111111] font-mono text-[11px] text-[#ded9d1] border border-stone-800">
              NODE: RBI NODAL ESCROW • SETTLEMENT CYCLIC #42
            </span>
          </div>
        </div>

        {/* 6 Column Financial Blueprint */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8 font-mono">
          <div className="p-4 bg-[#111111] border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Gross Delivery GMV</span>
            <div className="font-serif text-2xl text-white font-normal">{analyticsData.financialSummary.grossGmv}</div>
            <div className="text-[11px] text-stone-400 mt-1">100.0% Order Revenue</div>
          </div>

          <div className="p-4 bg-[#111111] border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Partner Direct Payouts</span>
            <div className="font-serif text-2xl text-white font-normal">{analyticsData.financialSummary.partnerDirectPayouts}</div>
            <div className="text-[11px] text-stone-300 mt-1">81.2% Courier Share</div>
          </div>

          <div className="p-4 bg-[#111111] border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Platform Take Rate</span>
            <div className="font-serif text-2xl text-white font-normal">{analyticsData.financialSummary.platformTakeRate}</div>
            <div className="text-[11px] text-stone-400 mt-1">10.0% Tech Commission</div>
          </div>

          <div className="p-4 bg-[#111111] border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Incentives &amp; Fuel</span>
            <div className="font-serif text-2xl text-white font-normal">{analyticsData.financialSummary.incentivesFuel}</div>
            <div className="text-[11px] text-stone-300 mt-1">Long-distance &amp; Surge</div>
          </div>

          <div className="p-4 bg-[#111111] border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Settled via IMPS</span>
            <div className="font-serif text-2xl text-white font-normal">{analyticsData.financialSummary.settledImps}</div>
            <div className="text-[11px] text-stone-300 mt-1">Disbursed to Bank Accts</div>
          </div>

          <div className="p-4 bg-[#111111] border border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block mb-1">Pending In Escrow</span>
            <div className="font-serif text-2xl text-amber-400 font-normal">{analyticsData.financialSummary.pendingEscrow}</div>
            <div className="text-[11px] text-stone-400 mt-1">Held for weekly cycle</div>
          </div>
        </div>

        {/* Payout Automation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-stone-800 gap-4">
          <div className="flex items-center gap-3 text-xs text-stone-400 font-sans">
            <span className="material-symbols-outlined text-[#ded9d1] text-[18px]">verified_user</span>
            <span>Next automated batch nodal settlement scheduled for Friday, 23:59:59 IST via Yes Bank Nodal API Gateway.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs uppercase">
            <button
              onClick={handleDownloadTax}
              className="bg-[#111111] hover:bg-stone-800 text-white px-4 py-2 border border-stone-700 transition-colors"
            >
              Download Tax Statement (TDS 194C)
            </button>
            <button
              onClick={handleTriggerEscrow}
              disabled={isEscrowClearing}
              className="bg-white text-[#1a1a1a] hover:bg-[#efeeea] px-5 py-2 transition-colors font-semibold"
            >
              {isEscrowClearing ? 'Clearing Escrow...' : 'Trigger Instant Escrow Clearance'}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER AUDIT METADATA */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#665d52] font-mono border-t border-[#ded9d1] pt-4 pb-8">
        <div className="flex items-center gap-4">
          <span>HASH: SHA256-8F02B91A4</span>
          <span>•</span>
          <span>REFRESH RATE: 30 SECONDS</span>
          <span>•</span>
          <span>GEOPROJECTION: EPSG:4326 (WGS 84)</span>
        </div>
        <div>
          <span>TIFFINLINK FLEET TELEMETRY ENGINE v4.19-PROD</span>
        </div>
      </div>
    </div>
  );
}
