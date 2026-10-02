import React, { useState, useEffect, useMemo } from 'react';

export default function ProviderPerformanceTab({ onNavigate }) {
  // Real-time Database & Filter States
  const [dbData, setDbData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('AMD-C');
  const [activeTelemetryMetric, setActiveTelemetryMetric] = useState('volume');

  // Slide-over Inspection Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({
    name: 'Xoxo Men Kitchen',
    cluster: 'Bodakdev',
    status: 'Optimal',
    prepTime: '18.2 mins',
    handoffDelay: '1.8 mins',
    rejectionRate: '0.4%',
    reorderRate: '78.4%',
    notes: ''
  });

  // Triage Action States
  const [triageThrottled, setTriageThrottled] = useState(false);
  const [auditorDispatched, setAuditorDispatched] = useState(false);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Seed / Curated Base Kitchens
  const [kitchens, setKitchens] = useState([
    {
      id: 'KTC-409',
      name: 'Xoxo Men Kitchen',
      chef: 'Chef Rahul Patel',
      area: 'Bodakdev',
      orders: 128,
      acceptance: 96.4,
      fulfillment: 94.2,
      cancellation: 2.1,
      avgPrep: '16.2 m',
      prepMinutes: 16.2,
      hygieneGrade: '99.4% Spotless',
      csat: 4.8,
      tier: 'Tier 1 Top',
      status: 'Optimal',
      quota: 40
    },
    {
      id: 'KTC-212',
      name: 'Maa Annapurna Rasoi',
      chef: 'Chef Kavita Ben',
      area: 'Navrangpura',
      orders: 94,
      acceptance: 91.2,
      fulfillment: 89.7,
      cancellation: 4.2,
      avgPrep: '21.4 m',
      prepMinutes: 21.4,
      hygieneGrade: '98.1% Good',
      csat: 4.6,
      tier: 'Tier 2 Standard',
      status: 'Staging Review',
      quota: 30
    },
    {
      id: 'KTC-188',
      name: 'Rasoi Express',
      chef: 'Chef Manish Dave',
      area: 'Vastrapur',
      orders: 67,
      acceptance: 97.1,
      fulfillment: 95.5,
      cancellation: 1.4,
      avgPrep: '18.0 m',
      prepMinutes: 18.0,
      hygieneGrade: '97.5% Standard',
      csat: 4.7,
      tier: 'Tier 1 Performer',
      status: 'Optimal',
      quota: 35
    },
    {
      id: 'KTC-093',
      name: 'Shreenathji Dining Hall',
      chef: 'Chef V. Joshi',
      area: 'Paldi',
      orders: 48,
      acceptance: 98.2,
      fulfillment: 97.8,
      cancellation: 0.8,
      avgPrep: '15.4 m',
      prepMinutes: 15.4,
      hygieneGrade: '99.8% Gold',
      csat: 4.9,
      tier: 'Tier 1 Top',
      status: 'Gold SLA',
      quota: 45
    },
    {
      id: 'KTC-055',
      name: 'Tulsi Kathiyawadi',
      chef: 'Chef Bhavik Patel',
      area: 'Chandkheda',
      orders: 112,
      acceptance: 86.4,
      fulfillment: 82.1,
      cancellation: 7.8,
      avgPrep: '27.6 m (Breach)',
      prepMinutes: 27.6,
      hygieneGrade: '91.2% Flagged',
      csat: 4.2,
      tier: 'Remediation',
      status: 'Critical Breach',
      isFlagged: true,
      quota: 25
    },
    {
      id: 'KTC-331',
      name: 'Kitchen Anand',
      chef: 'Chef Anand Soni',
      area: 'Navrangpura',
      orders: 85,
      acceptance: 94.1,
      fulfillment: 93.0,
      cancellation: 2.6,
      avgPrep: '17.5 m',
      prepMinutes: 17.5,
      hygieneGrade: '98.6% Spotless',
      csat: 4.8,
      tier: 'Tier 1 Performer',
      status: 'Optimal',
      quota: 35
    }
  ]);

  // Fetch Real Database Stats
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        setIsLoading(true);
        const [overviewRes, providersRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/overview').then(r => r.json()).catch(() => null),
          fetch('http://localhost:5000/api/admin/providers').then(r => r.json()).catch(() => null)
        ]);

        if (overviewRes && overviewRes.data) {
          setDbData(overviewRes.data);
        }

        if (providersRes && (providersRes.providers || providersRes.data)) {
          const list = providersRes.providers || providersRes.data || [];
          if (list.length > 0) {
            // Update kitchen counts dynamically if providers found in MongoDB
            setKitchens(prev => {
              const updated = [...prev];
              list.slice(0, 3).forEach((p, idx) => {
                if (updated[idx]) {
                  updated[idx].name = p.businessName || p.name || updated[idx].name;
                  updated[idx].area = p.address?.locality || p.city || updated[idx].area;
                }
              });
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching live performance data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  // Filtered Kitchens for Data Grid
  const filteredKitchens = useMemo(() => {
    return kitchens.filter(k => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          k.name.toLowerCase().includes(q) ||
          k.chef.toLowerCase().includes(q) ||
          k.area.toLowerCase().includes(q) ||
          k.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [kitchens, search]);

  // Open Drawer for a specific kitchen
  const handleOpenDrawer = (kitchen) => {
    setDrawerData({
      name: kitchen.name,
      cluster: kitchen.area,
      status: kitchen.status,
      prepTime: kitchen.avgPrep,
      handoffDelay: kitchen.isFlagged ? '4.2 mins' : '1.8 mins',
      rejectionRate: `${(kitchen.cancellation * 0.2).toFixed(1)}%`,
      reorderRate: `${(kitchen.csat * 16.5).toFixed(1)}%`,
      notes: kitchen.isFlagged
        ? 'Rotla batch delay identified during evening peak. Fresh dough prep requires dedicated assistant.'
        : 'Smooth operational throughput. Thermal retention verified.'
    });
    setDrawerOpen(true);
  };

  const handleAdjustQuota = (kitchenId) => {
    setKitchens(prev =>
      prev.map(k => {
        if (k.id === kitchenId) {
          const newQ = k.quota + 10;
          showToast(`Increased active order quota for ${k.name} to ${newQ} concurrent tiffins.`);
          return { ...k, quota: newQ };
        }
        return k;
      })
    );
  };

  const handleAwardBadge = (kitchenName) => {
    showToast(`Awarded 'Gold SLA Kitchen of the Month' badge to ${kitchenName}. Digital seal issued.`);
  };

  const handleThrottleQuota = () => {
    setTriageThrottled(true);
    setKitchens(prev =>
      prev.map(k => (k.id === 'KTC-055' ? { ...k, quota: 15, status: 'Quota Throttled (15)' } : k))
    );
    showToast('Tulsi Kathiyawadi live order intake throttled to 15 concurrent tiffins.');
  };

  const handleDispatchAuditor = () => {
    setAuditorDispatched(true);
    showToast('Field QA auditor dispatched to Tulsi Kathiyawadi (Chandkheda). Estimated arrival: 25 mins.');
  };

  const handleCommitDrawerAudit = () => {
    setDrawerOpen(false);
    showToast(`Telemetry audit observations committed for ${drawerData.name}. Log updated.`);
  };

  const handleDownloadPdf = () => {
    showToast('Generating signed Provider Comparative Matrix (PDF)... Download will initiate.');
    window.print();
  };

  const handleGenerateReport = () => {
    showToast('Cluster Benchmark Report generated for BOM-IND-01 • AMD-C. Exported to ledger.');
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10 max-w-[1560px] mx-auto w-full">
        
        {/* Section 1: Editorial Header & Macro Controls */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#665d52] tracking-widest uppercase">
              <span>Super Admin</span>
              <span>/</span>
              <span>Management</span>
              <span>/</span>
              <span>Providers</span>
              <span>/</span>
              <span className="text-[#1a1a1a] font-semibold bg-[#efeeea] px-2 py-0.5">
                Performance &amp; Telemetry
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[#1a1a1a] leading-none">
              Provider Operational Performance
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#665d52] text-balance mt-1">
              Comparative throughput telemetry, SLA adherence rankings, prep duration benchmarks, and architectural quality audits across monitored kitchen clusters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 bg-[#eae8e4] text-[#1a1a1a] font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#e4e2de] transition-colors flex items-center gap-2 border border-[#ded9d1]"
              id="downloadPdfBtn"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              <span>Download Comparative Matrix (PDF)</span>
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-6 py-2.5 bg-[#1a1a1a] text-white font-sans text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm"
              id="generateReportBtn"
            >
              <span className="material-symbols-outlined text-[18px]">assessment</span>
              <span>Generate Cluster Benchmark Report</span>
            </button>
          </div>
        </header>

        {/* Section 2: Six Operational Benchmark KPI Panels */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Metric 1 */}
          <div className="bg-white p-5 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Monitored Base</span>
              <span className="font-mono text-[11px] text-[#665d52]">Cluster BOM</span>
            </div>
            <div>
              <div className="font-serif text-3xl text-[#1a1a1a] tracking-tight">
                {dbData?.kpis?.totalProviders || 42}
              </div>
              <div className="font-mono text-xs text-[#1a1a1a] mt-1">Active Kitchens</div>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#665d52] pt-2 border-t border-[#ded9d1]/30">
              <span>Active Capacity</span>
              <span className="text-[#1a1a1a] font-medium">94.2%</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white p-5 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Acceptance Rate</span>
              <span className="px-1.5 py-0.5 bg-[#efeeea] text-[#1a1a1a] font-mono text-[10px]">+1.1% vs Goal</span>
            </div>
            <div>
              <div className="font-serif text-3xl text-[#1a1a1a] tracking-tight">
                {dbData?.performance?.providerAcceptanceRate ? `${dbData.performance.providerAcceptanceRate}%` : '96.1%'}
              </div>
              <div className="font-mono text-xs text-[#665d52] mt-1">Target: &gt;95.0%</div>
            </div>
            <div className="w-full bg-[#eae8e4] h-1 overflow-hidden">
              <div className="bg-[#1a1a1a] h-full w-[96.1%]"></div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white p-5 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Prep Latency</span>
              <span className="font-mono text-[10px] text-[#665d52]">Optimal Range</span>
            </div>
            <div>
              <div className="font-serif text-3xl text-[#1a1a1a] tracking-tight">
                18.4 <span className="text-sm font-sans font-normal text-[#665d52]">mins</span>
              </div>
              <div className="font-mono text-xs text-[#665d52] mt-1">SLA Standard: 20.0m</div>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#665d52] pt-2 border-t border-[#ded9d1]/30">
              <span>P95 Delta</span>
              <span className="text-[#1a1a1a] font-medium">-1.6m buffer</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-white p-5 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Fulfillment Rate</span>
              <span className="px-1.5 py-0.5 bg-[#eae8e4] text-[#1a1a1a] font-mono text-[10px]">Healthy</span>
            </div>
            <div>
              <div className="font-serif text-3xl text-[#1a1a1a] tracking-tight">
                {dbData?.performance?.fulfillmentRate ? `${dbData.performance.fulfillmentRate}%` : '94.8%'}
              </div>
              <div className="font-mono text-xs text-[#665d52] mt-1">Target: &gt;92.0%</div>
            </div>
            <div className="w-full bg-[#eae8e4] h-1 overflow-hidden">
              <div className="bg-[#1a1a1a] h-full w-[94.8%]"></div>
            </div>
          </div>

          {/* Metric 5 */}
          <div className="bg-white p-5 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Cancellation Rate</span>
              <span className="font-mono text-[10px] text-[#665d52]">Tolerance &lt;3.0%</span>
            </div>
            <div>
              <div className="font-serif text-3xl text-[#1a1a1a] tracking-tight">
                {dbData?.performance?.cancellationRate ? `${dbData.performance.cancellationRate}%` : '2.1%'}
              </div>
              <div className="font-mono text-xs text-[#665d52] mt-1">Platform Avg Delta: -0.9%</div>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#665d52] pt-2 border-t border-[#ded9d1]/30">
              <span>Breach Incidents</span>
              <span className="text-[#ba1a1a] font-medium">1 Provider</span>
            </div>
          </div>

          {/* Metric 6 */}
          <div className="bg-white p-5 flex flex-col justify-between h-40 shadow-sm relative overflow-hidden border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Aggregate CSAT</span>
              <span className="material-symbols-outlined text-[16px] text-[#1a1a1a]">star</span>
            </div>
            <div>
              <div className="font-serif text-3xl text-[#1a1a1a] tracking-tight">
                {dbData?.kpis?.avgRating || '4.74'} <span className="text-sm font-sans font-normal text-[#665d52]">/ 5.0</span>
              </div>
              <div className="font-mono text-xs text-[#665d52] mt-1">1,842 fulfilled meals</div>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#665d52] pt-2 border-t border-[#ded9d1]/30">
              <span>Praise Ratio</span>
              <span className="text-[#1a1a1a] font-medium">96.8%</span>
            </div>
          </div>
        </section>

        {/* Section 3: Telemetry Charts & Peak Load Diagnostics */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Line / Trend Chart Panel (8 cols) */}
          <div className="lg:col-span-8 bg-white p-7 shadow-sm flex flex-col gap-6 border border-[#ded9d1]/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-mono text-xs uppercase tracking-widest text-[#665d52]">Telemetry Projection</span>
                <h2 className="font-serif text-2xl text-[#1a1a1a] mt-1">Order Volume vs. Preparation Speed (30 Days)</h2>
              </div>
              {/* Metric Switch Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-[#f5f3ef] p-1 text-[#1a1a1a] border border-[#ded9d1]">
                {[
                  { id: 'volume', label: 'Order Volume' },
                  { id: 'acceptance', label: 'Acceptance Rate' },
                  { id: 'cancellation', label: 'Cancellation Rate' },
                  { id: 'latency', label: 'Prep Latency' },
                  { id: 'csat', label: 'CSAT' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTelemetryMetric(tab.id)}
                    className={`telemetry-tab px-2.5 py-1 text-xs font-mono transition-colors ${
                      activeTelemetryMetric === tab.id
                        ? 'bg-[#1a1a1a] text-white font-bold'
                        : 'text-[#665d52] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Legend */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#665d52] pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#1a1a1a]"></span>
                <span className="text-[#1a1a1a] font-medium">Xoxo Men Kitchen (128 ord / 16.2m avg)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#665d52]"></span>
                <span>Maa Annapurna (94 ord / 21.4m avg)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#c4c7c7]"></span>
                <span>Rasoi Express (67 ord / 18.0m avg)</span>
              </div>
            </div>

            {/* Architectural Inline SVG Chart */}
            <div className="relative w-full h-[260px] bg-[#f5f3ef]/40 p-4 flex flex-col justify-between border border-[#ded9d1]">
              {/* Background Grid Lines */}
              <div className="absolute inset-x-8 top-8 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="w-full border-b border-[#ded9d1]"></div>
                <div className="w-full border-b border-[#ded9d1]"></div>
                <div className="w-full border-b border-[#ded9d1]"></div>
                <div className="w-full border-b border-[#ded9d1]"></div>
              </div>

              {/* Scaled Telemetry SVG Paths */}
              <svg className="w-full h-full relative z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                {/* Curve 1: Xoxo Men Kitchen (Solid Onyx Black) */}
                <path
                  d={
                    activeTelemetryMetric === 'latency'
                      ? 'M 10,70 C 70,80 120,65 180,50 C 240,45 300,55 360,40 C 420,35 480,30 540,25 C 600,20 650,22 690,18'
                      : 'M 10,150 C 70,140 120,110 180,95 C 240,80 300,90 360,70 C 420,50 480,45 540,35 C 600,25 650,22 690,20'
                  }
                  fill="none"
                  stroke="#1a1a1a"
                  strokeLinecap="round"
                  strokeWidth="2.2"
                ></path>
                {/* Node markers */}
                <circle cx="180" cy={activeTelemetryMetric === 'latency' ? '50' : '95'} fill="#1a1a1a" r="3"></circle>
                <circle cx="360" cy={activeTelemetryMetric === 'latency' ? '40' : '70'} fill="#1a1a1a" r="3"></circle>
                <circle cx="540" cy={activeTelemetryMetric === 'latency' ? '25' : '35'} fill="#1a1a1a" r="3"></circle>
                <circle cx="690" cy={activeTelemetryMetric === 'latency' ? '18' : '20'} fill="#1a1a1a" r="3.5"></circle>

                {/* Curve 2: Maa Annapurna (Secondary Clay) */}
                <path
                  d="M 10,165 C 70,160 120,145 180,135 C 240,125 300,115 360,120 C 420,125 480,105 540,100 C 600,95 650,85 690,82"
                  fill="none"
                  stroke="#665d52"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                ></path>
                <circle cx="360" cy="120" fill="#665d52" r="2.5"></circle>
                <circle cx="690" cy="82" fill="#665d52" r="3"></circle>

                {/* Curve 3: Rasoi Express (Light Outline Slate) */}
                <path
                  d="M 10,180 C 70,175 120,160 180,155 C 240,150 300,140 360,135 C 420,130 480,130 540,120 C 600,115 650,110 690,108"
                  fill="none"
                  stroke="#747878"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                ></path>
                <circle cx="690" cy="108" fill="#747878" r="2.5"></circle>

                {/* Threshold Horizon (20 min prep SLA limit) */}
                <line opacity="0.6" stroke="#ba1a1a" strokeDasharray="2 3" strokeWidth="1" x1="0" x2="700" y1="110" y2="110"></line>
                <text fill="#ba1a1a" fontFamily="monospace" fontSize="9" x="600" y="105">
                  SLA CEILING (20m)
                </text>
              </svg>

              {/* Axis Labels */}
              <div className="flex justify-between font-mono text-[10px] text-[#665d52] relative z-10 pt-2 border-t border-[#ded9d1]">
                <span>Day 01 (08:00)</span>
                <span>Day 07</span>
                <span>Day 14 (Mid-Cycle)</span>
                <span>Day 21</span>
                <span>Day 30 (Current)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#665d52] bg-[#f5f3ef] px-4 py-2.5 border border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#1a1a1a]">info</span>
                <span>
                  Correlation Analysis: Higher volume kitchen batches demonstrate -14.2% prep latency due to optimized assembly-line staging.
                </span>
              </div>
              <span className="text-[#1a1a1a] font-semibold">r = -0.78</span>
            </div>
          </div>

          {/* Time-of-day kitchen load distribution (4 cols) */}
          <div className="lg:col-span-4 bg-white p-7 shadow-sm flex flex-col justify-between gap-6 border border-[#ded9d1]/60">
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-[#665d52]">Temporal Stress</span>
                <span className="px-2 py-0.5 bg-[#efeeea] text-[#1a1a1a] font-mono text-[10px] uppercase">Daily Cycle</span>
              </div>
              <h2 className="font-serif text-2xl text-[#1a1a1a] mt-1">Kitchen Load Distribution</h2>
              <p className="font-sans text-xs text-[#665d52] mt-1">Bimodal dispatch pattern across urban delivery hubs.</p>
            </div>

            {/* Visual Segmented Bar */}
            <div className="flex flex-col gap-5">
              <div className="flex h-12 w-full overflow-hidden shadow-inner border border-[#ded9d1]">
                <div className="bg-[#1a1a1a] flex items-center justify-center text-white font-mono text-xs font-semibold px-2" style={{ width: '62%' }}>
                  62% LUNCH
                </div>
                <div className="bg-[#eae8e4] flex items-center justify-center text-[#1a1a1a] font-mono text-xs font-semibold px-2" style={{ width: '38%' }}>
                  38% DINNER
                </div>
              </div>

              {/* Breakdown Details */}
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1a1a1a]"></span>
                      Lunch Peak Window
                    </span>
                    <span className="text-[#1a1a1a] font-bold">62% Volume</span>
                  </div>
                  <div className="flex justify-between text-[#665d52] text-[11px] mt-0.5">
                    <span>11:30 AM – 01:30 PM IST</span>
                    <span>Avg Prep: 17.2 mins</span>
                  </div>
                  <div className="text-[10px] text-[#665d52] mt-1">
                    1,142 orders handled concurrently • Max batch queuing: 4 tiffins
                  </div>
                </div>

                <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#665d52]"></span>
                      Dinner Peak Window
                    </span>
                    <span className="text-[#1a1a1a] font-bold">38% Volume</span>
                  </div>
                  <div className="flex justify-between text-[#665d52] text-[11px] mt-0.5">
                    <span>05:30 PM – 08:00 PM IST</span>
                    <span>Avg Prep: 20.1 mins</span>
                  </div>
                  <div className="text-[10px] text-[#665d52] mt-1">
                    700 orders handled • Fresh phulka bottlenecks detected in 2 clusters
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Health Badge */}
            <div className="p-3 bg-[#f5f3ef] border-l-2 border-[#1a1a1a] flex items-center justify-between text-xs font-mono">
              <span className="text-[#1a1a1a]">Thermal Retention Risk:</span>
              <span className="font-semibold text-[#1a1a1a]">Low (98.4% insulated transit)</span>
            </div>
          </div>
        </section>

        {/* Section 4: Detailed Provider Performance Ranking Table */}
        <section className="bg-white p-7 shadow-sm flex flex-col gap-5 border border-[#ded9d1]/60">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#665d52]">Cluster Ranking</span>
              <h2 className="font-serif text-2xl text-[#1a1a1a] mt-1">Provider Telemetry Matrix</h2>
              <p className="font-sans text-xs text-[#665d52] mt-0.5">
                Live index based on rolling 30-day fulfillment, hygiene verification, and consumer rating.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f3ef] text-xs font-mono text-[#665d52] border border-[#ded9d1]">
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                <span>Cluster: Ahmedabad Central ({selectedCluster})</span>
              </div>

              {/* Quick Filter Search */}
              <div className="flex items-center gap-2 px-3 py-1 bg-[#f5f3ef] border border-[#ded9d1] text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#665d52]">search</span>
                <input
                  type="text"
                  placeholder="Filter kitchen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent focus:outline-none text-[#1a1a1a] placeholder:text-[#665d52]"
                />
              </div>

              <span className="font-mono text-xs text-[#665d52]">Showing {filteredKitchens.length} Key Providers</span>
            </div>
          </div>

          {/* Responsive Data Grid */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#eae8e4] text-[11px] font-mono uppercase tracking-wider text-[#665d52] border-b border-[#ded9d1]">
                  <th className="py-3 px-4 font-semibold">Kitchen &amp; Head Chef</th>
                  <th className="py-3 px-3 font-semibold">Cluster Area</th>
                  <th className="py-3 px-3 font-semibold text-right">Orders</th>
                  <th className="py-3 px-3 font-semibold text-right">Acceptance</th>
                  <th className="py-3 px-3 font-semibold text-right">Fulfillment</th>
                  <th className="py-3 px-3 font-semibold text-right">Cancellation</th>
                  <th className="py-3 px-3 font-semibold text-right">Avg Prep</th>
                  <th className="py-3 px-3 font-semibold text-center">Hygiene Index</th>
                  <th className="py-3 px-3 font-semibold text-center">CSAT</th>
                  <th className="py-3 px-3 font-semibold">Tier Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/40 font-mono text-xs text-[#1a1a1a]">
                {filteredKitchens.map((k) => (
                  <tr
                    key={k.id}
                    className={`transition-colors ${
                      k.isFlagged
                        ? 'bg-red-50/25 hover:bg-red-50/50'
                        : 'hover:bg-[#f5f3ef]/60'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col font-sans">
                        <div className="flex items-center gap-1.5">
                          {k.isFlagged && (
                            <span className="material-symbols-outlined text-[#ba1a1a] text-[16px]">warning</span>
                          )}
                          <span
                            className={`font-semibold text-[13px] ${
                              k.isFlagged ? 'text-[#ba1a1a]' : 'text-[#1a1a1a]'
                            }`}
                          >
                            {k.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#665d52] font-mono">
                          {k.chef} • #{k.id}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-[11px]">{k.area}</td>

                    <td className="py-3.5 px-3 text-right font-medium">{k.orders}</td>

                    <td
                      className={`py-3.5 px-3 text-right ${
                        k.acceptance < 90 ? 'text-[#ba1a1a] font-semibold' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {k.acceptance}%
                    </td>

                    <td
                      className={`py-3.5 px-3 text-right ${
                        k.fulfillment < 90 ? 'text-[#ba1a1a] font-semibold' : 'text-[#1a1a1a]'
                      }`}
                    >
                      {k.fulfillment}%
                    </td>

                    <td
                      className={`py-3.5 px-3 text-right ${
                        k.cancellation > 3 ? 'text-[#ba1a1a] font-bold' : 'text-[#665d52]'
                      }`}
                    >
                      {k.cancellation}%
                    </td>

                    <td
                      className={`py-3.5 px-3 text-right font-medium ${
                        k.isFlagged ? 'text-[#ba1a1a] font-bold' : ''
                      }`}
                    >
                      {k.avgPrep}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold ${
                          k.isFlagged
                            ? 'bg-red-50 text-[#ba1a1a] border border-red-200'
                            : k.hygieneGrade.includes('Gold')
                            ? 'bg-[#eee0d2] text-[#211b12]'
                            : 'bg-[#efeeea] text-[#1a1a1a]'
                        }`}
                      >
                        {k.hygieneGrade}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold">
                      {k.csat} ★
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-1 text-[10px] tracking-wider uppercase font-semibold ${
                          k.tier === 'Tier 1 Top'
                            ? 'bg-[#1a1a1a] text-white'
                            : k.tier === 'Remediation'
                            ? 'bg-[#ba1a1a] text-white'
                            : 'bg-[#eae8e4] text-[#1a1a1a]'
                        }`}
                      >
                        {k.tier}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {k.isFlagged ? (
                          <button
                            onClick={() => handleOpenDrawer(k)}
                            className="px-2.5 py-1 bg-[#ba1a1a] text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors"
                          >
                            Mandatory SLA Audit
                          </button>
                        ) : (
                          <>
                            {k.hygieneGrade.includes('Gold') && (
                              <button
                                onClick={() => handleAwardBadge(k.name)}
                                className="px-2.5 py-1 bg-[#eae8e4] hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] text-[11px] transition-colors border border-[#ded9d1]"
                              >
                                Award Badge
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDrawer(k)}
                              className="px-2.5 py-1 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-[11px] transition-colors border border-[#ded9d1]"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleAdjustQuota(k.id)}
                              className="px-2.5 py-1 bg-[#eae8e4] hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] text-[11px] transition-colors border border-[#ded9d1]"
                              title={`Current Quota: ${k.quota} orders`}
                            >
                              Quota +
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination / Matrix Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#ded9d1] text-xs font-mono text-[#665d52]">
            <div>Showing 1 - {filteredKitchens.length} of 42 Monitored Kitchens • Last Telemetry Sync: 14:31:40 IST</div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 bg-[#efeeea] text-[#665d52] disabled:opacity-40" disabled>
                Previous
              </button>
              <span className="px-3 py-1 bg-[#1a1a1a] text-white font-bold">1</span>
              <button className="px-3 py-1 bg-[#efeeea] text-[#1a1a1a] hover:bg-[#eae8e4]">2</button>
              <button className="px-3 py-1 bg-[#efeeea] text-[#1a1a1a] hover:bg-[#eae8e4]">3</button>
              <button className="px-3 py-1 bg-[#efeeea] text-[#1a1a1a] hover:bg-[#eae8e4]">Next</button>
            </div>
          </div>
        </section>

        {/* Section 5: SLA Exception & Remediation Triage Panel */}
        <section className="bg-white p-7 shadow-sm flex flex-col gap-6 border border-[#ded9d1]/60">
          <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-[#ba1a1a] rounded-full animate-pulse"></span>
              <h2 className="font-serif text-2xl text-[#1a1a1a]">Active SLA Exception &amp; Remediation Triage</h2>
            </div>
            <span className="font-mono text-xs text-[#ba1a1a] font-semibold">
              1 Critical Provider Requiring Admin Intervention
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Root Cause Card (8 cols) */}
            <div className="lg:col-span-8 p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#ba1a1a] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">report</span>
                    High Severity Alert: SLA Threshold Breach
                  </span>
                  <span className="font-mono text-xs text-[#665d52]">Incident #SLA-2023-889</span>
                </div>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Tulsi Kathiyawadi (Chandkheda)</h3>
                <p className="font-sans text-sm text-[#665d52] mt-1 leading-relaxed">
                  Kitchen preparation latency has consistently exceeded the 25-minute ceiling during evening peak hours (rolling average 27.6 minutes). Telemetry identifies the bottleneck in fresh Rotla rolling batches during peak volume. 4 customer complaints registered in past 72h citing lukewarm Dal packaging.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#ded9d1] text-xs font-mono">
                <div>
                  <span className="text-[#665d52] block">Latency Overrun:</span>
                  <span className="text-[#ba1a1a] font-bold">+7.6 mins over SLA</span>
                </div>
                <div>
                  <span className="text-[#665d52] block">Cancellation Spike:</span>
                  <span className="text-[#ba1a1a] font-bold">7.8% (Tolerance: &lt;3%)</span>
                </div>
                <div>
                  <span className="text-[#665d52] block">Staging Status:</span>
                  <span className="text-[#1a1a1a] font-semibold">Thermal Bags Pending</span>
                </div>
              </div>
            </div>

            {/* Corrective Action Engine (4 cols) */}
            <div className="lg:col-span-4 p-6 bg-[#1a1a1a] text-white flex flex-col justify-between gap-5 shadow-sm">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-[#ded9d1]">Remediation Protocol</span>
                <div className="font-serif text-xl text-white">Enforce Kitchen SLA Action Plan</div>
                <p className="font-sans text-xs text-white/80 mt-1 leading-normal">
                  Admin intervention will temporarily throttle incoming order quota to 15 concurrent tiffins and dispatch a field QA auditor.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleThrottleQuota}
                  disabled={triageThrottled}
                  className={`w-full py-2.5 font-sans text-xs uppercase tracking-wider font-semibold transition-colors ${
                    triageThrottled
                      ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      : 'bg-white text-[#1a1a1a] hover:bg-[#efeeea]'
                  }`}
                  id="throttleQuotaBtn"
                >
                  {triageThrottled ? '✓ Concurrency Throttled (15)' : 'Throttle Live Order Concurrency'}
                </button>
                <button
                  onClick={handleDispatchAuditor}
                  disabled={auditorDispatched}
                  className={`w-full py-2.5 font-sans text-xs uppercase tracking-wider font-semibold transition-colors ${
                    auditorDispatched
                      ? 'bg-red-900 text-red-300 cursor-not-allowed'
                      : 'bg-[#ba1a1a] text-white hover:bg-red-700'
                  }`}
                  id="dispatchAuditorBtn"
                >
                  {auditorDispatched ? '✓ Auditor En Route' : 'Dispatch Field Hygiene & Prep Auditor'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Curated Architectural Gallery / Audit Evidence Preview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 shadow-sm flex flex-col gap-3 border border-[#ded9d1]/60">
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80"
              alt="Stainless steel kitchen staging"
              className="w-full h-48 object-cover border border-[#ded9d1]"
            />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Quality Audit Evidence</span>
              <span className="font-sans font-semibold text-sm text-[#1a1a1a] mt-1">Shreenathji Dining Hall Staging Hub</span>
              <span className="font-mono text-[11px] text-[#665d52]">Score: 99.8% • Gold Verification Tier</span>
            </div>
          </div>

          <div className="bg-white p-5 shadow-sm flex flex-col gap-3 border border-[#ded9d1]/60">
            <img
              src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80"
              alt="Thermal retention packaging"
              className="w-full h-48 object-cover border border-[#ded9d1]"
            />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Packaging Standardisation</span>
              <span className="font-sans font-semibold text-sm text-[#1a1a1a] mt-1">Thermal Retention Compliance Matrix</span>
              <span className="font-mono text-[11px] text-[#665d52]">Double-walled insulated tiffin vessels tested</span>
            </div>
          </div>

          <div className="bg-white p-5 shadow-sm flex flex-col gap-3 border border-[#ded9d1]/60">
            <img
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"
              alt="Operational dispatch terminal"
              className="w-full h-48 object-cover border border-[#ded9d1]"
            />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Dispatch Terminal</span>
              <span className="font-sans font-semibold text-sm text-[#1a1a1a] mt-1">Xoxo Men Kitchen Live KDS Station</span>
              <span className="font-mono text-[11px] text-[#665d52]">P95 Dispatch Latency: 16.2 mins sustained</span>
            </div>
          </div>
        </section>
      </div>

      {/* Interactive Slide-over Inspection Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/50 backdrop-blur-xs z-50 transition-opacity flex justify-end">
          <div className="w-full max-w-lg bg-[#fbf9f5] p-8 shadow-2xl flex flex-col justify-between overflow-y-auto h-full border-l border-[#ded9d1]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
                <div className="flex flex-col">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#665d52]">Telemetry Deep Dive</span>
                  <h3 className="font-serif text-2xl text-[#1a1a1a] mt-1" id="drawerKitchenTitle">
                    {drawerData.name} Telemetry
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-[#665d52] hover:text-[#1a1a1a]"
                  id="closeDrawerBtn"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-4 font-mono text-xs">
                <div className="p-3 bg-white border border-[#ded9d1] flex justify-between">
                  <span className="text-[#665d52]">Cluster Jurisdiction:</span>
                  <span className="font-semibold text-[#1a1a1a]" id="drawerCluster">
                    {drawerData.cluster}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#ded9d1] flex justify-between">
                  <span className="text-[#665d52]">Status Diagnostics:</span>
                  <span className="font-semibold text-[#1a1a1a]" id="drawerStatus">
                    {drawerData.status}
                  </span>
                </div>
                <div className="p-4 bg-white border border-[#ded9d1] flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase text-[#665d52]">Telemetry Metrics</span>
                  <div className="flex justify-between">
                    <span>Rolling P90 Prep:</span>
                    <span className="font-semibold">{drawerData.prepTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rider Handoff Delay:</span>
                    <span className="font-semibold">{drawerData.handoffDelay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Rejection Rate:</span>
                    <span className="font-semibold">{drawerData.rejectionRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Re-order:</span>
                    <span className="font-semibold">{drawerData.reorderRate}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                <span className="font-mono text-xs uppercase text-[#665d52] font-semibold">Root Operations Notes</span>
                <textarea
                  value={drawerData.notes}
                  onChange={(e) => setDrawerData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full h-28 p-3 bg-white text-[#1a1a1a] border border-[#ded9d1] text-xs focus:outline-none"
                  placeholder="Enter administrative observations or override instructions..."
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-6 border-t border-[#ded9d1] mt-6">
              <button
                onClick={handleCommitDrawerAudit}
                className="w-full py-3 bg-[#1a1a1a] text-white font-sans text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                id="saveDrawerBtn"
              >
                Commit Telemetry Audit
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2 text-[#665d52] hover:text-[#1a1a1a] text-xs font-mono"
                id="cancelDrawerBtn"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] text-white shadow-xl font-sans text-xs border border-neutral-700 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
