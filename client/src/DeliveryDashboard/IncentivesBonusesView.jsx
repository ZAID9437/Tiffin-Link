import React, { useState, useEffect } from 'react';

const IncentivesBonusesView = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    summary: {
      totalEarned: 0,
      activeCampaignsCount: 0,
      pendingRewards: 0,
      verifiedSettlements: 0,
      totalProgramsCount: 0,
      completedProgramsCount: 0,
      activeProgramsCount: 0
    },
    allIncentives: [],
    incentives: [],
    hasData: false
  });

  const [selectedIncentiveId, setSelectedIncentiveId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Incentive Types');
  const [horizonFilter, setHorizonFilter] = useState('Horizon: This Week');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Fetch incentives telemetry from API
  const fetchIncentivesData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter.toLowerCase());
      if (typeFilter !== 'All Incentive Types') queryParams.append('type', typeFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/delivery/incentives?${queryParams.toString()}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
        if (json.data.incentives && json.data.incentives.length > 0) {
          const firstActive = json.data.incentives.find(i => i.status === 'ACTIVE' || i.status === 'IN_PROGRESS') || json.data.incentives[0];
          setSelectedIncentiveId(prev => prev || firstActive.id);
        }
      }
    } catch (err) {
      console.error('Error fetching incentives:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncentivesData();
  }, [statusFilter, typeFilter, searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchIncentivesData();
  };

  const selectedIncentive = (data.incentives || []).find(i => i.id === selectedIncentiveId) || (data.incentives || [])[0];

  // Helper formatting functions
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Top Meta & Synchronous Telemetry Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 mb-8 border-b border-sand-neutral">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Earnings &amp; Payments</span>
            <span className="text-secondary text-xs">/</span>
            <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">Incentives &amp; Bonuses</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high text-onyx-black font-label-caps text-[11px] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Socket.io Synced • Live Targets
            </span>
            <span className="font-label-caps text-[11px] text-secondary tracking-widest uppercase">Telemetry Port: :8443</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container-low hover:bg-surface-container text-onyx-black transition-colors font-button-text text-button-text border border-sand-neutral cursor-pointer"
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            <span>{refreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
          </button>
          <button
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-onyx-black hover:bg-primary-container text-on-primary transition-colors font-button-text text-button-text cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">rule</span>
            <span>Incentive Rules &amp; Terms</span>
          </button>
        </div>
      </div>

      {/* Editorial Headline Section */}
      <div className="mb-10 max-w-3xl">
        <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none mb-3">
          Incentives &amp; Bonuses
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Track eligible milestone incentives, surge multipliers, and circular tiffin return rewards verified across the active courier operational radius.
        </p>
      </div>

      {/* Executive Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {/* KPI 1 */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-44 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Total Earned</span>
            <span className="material-symbols-outlined text-onyx-black text-[20px]">account_balance_wallet</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black tracking-tight mb-1">
              {formatCurrency(data.summary?.totalEarned ?? 0)}
            </div>
            <p className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">Across all programs • Settled</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-onyx-black h-1" style={{ width: `${Math.min(100, Math.round(((data.summary?.completedProgramsCount ?? 0) / (data.summary?.totalProgramsCount || 1)) * 100))}%` }}></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-44 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Active Campaigns</span>
            <span className="material-symbols-outlined text-onyx-black text-[20px]">flag</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black tracking-tight mb-1">
              {String(data.summary?.activeCampaignsCount ?? 0).padStart(2, '0')} Programs
            </div>
            <p className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">In-progress runs this week</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-onyx-black h-1" style={{ width: `${Math.min(100, Math.round(((data.summary?.activeCampaignsCount ?? 0) / (data.summary?.totalProgramsCount || 1)) * 100))}%` }}></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-44 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Pending Rewards</span>
            <span className="material-symbols-outlined text-onyx-black text-[20px]">hourglass_top</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black tracking-tight mb-1">
              {formatCurrency(data.summary?.pendingRewards ?? 0)}
            </div>
            <p className="font-label-caps text-[11px] text-secondary uppercase tracking-wider">Unlockable upon milestone completion</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-amber-700 h-1" style={{ width: `${(data.summary?.pendingRewards ?? 0) > 0 ? '50%' : '0%'}` }}></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-44 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Verified Settlements</span>
            <span className="material-symbols-outlined text-onyx-black text-[20px]">verified</span>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black tracking-tight mb-1">
              {formatCurrency(data.summary?.verifiedSettlements ?? 0)}
            </div>
            <p className="font-label-caps text-[11px] text-emerald-800 uppercase tracking-wider font-semibold">100% Cryptographic Cleared</p>
          </div>
          <div className="w-full bg-sand-neutral h-1">
            <div className="bg-emerald-700 h-1" style={{ width: `${(data.summary?.verifiedSettlements ?? 0) > 0 ? '100%' : '0%'}` }}></div>
          </div>
        </div>
      </div>

      {/* Filter & Control Panel */}
      <div className="bg-bone-white border border-sand-neutral p-4 mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Tab Filter Group */}
        <div className="flex flex-wrap items-center gap-1.5" id="status-filters">
          {['All', 'Active', 'Completed', 'Expired'].map(status => {
            const list = data.allIncentives && data.allIncentives.length > 0 ? data.allIncentives : data.incentives || [];
            let count = list.length;
            if (status === 'Active') {
              count = list.filter(i => i.status === 'ACTIVE' || i.status === 'IN_PROGRESS').length;
            } else if (status === 'Completed') {
              count = list.filter(i => i.status === 'COMPLETED').length;
            } else if (status === 'Expired') {
              count = list.filter(i => i.status === 'EXPIRED').length;
            }

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 text-xs font-label-caps uppercase tracking-wider transition-all cursor-pointer ${statusFilter === status
                  ? 'bg-onyx-black text-on-primary font-medium'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-onyx-black'
                  }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        {/* Secondary Attributes & Live Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-surface-container-lowest border border-sand-neutral pl-3 pr-8 py-2 font-button-text text-[13px] text-onyx-black focus:outline-none focus:border-onyx-black cursor-pointer"
            >
              <option value="All Incentive Types">All Incentive Types</option>
              <option value="Milestone Targets">Milestone Targets</option>
              <option value="Peak Hour Surges">Peak Hour Surges</option>
              <option value="Container Return Bonuses">Container Return Bonuses</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2.5 text-[16px] text-secondary pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <select
              value={horizonFilter}
              onChange={(e) => setHorizonFilter(e.target.value)}
              className="appearance-none bg-surface-container-lowest border border-sand-neutral pl-3 pr-8 py-2 font-button-text text-[13px] text-onyx-black focus:outline-none focus:border-onyx-black cursor-pointer"
            >
              <option value="Horizon: This Week">Horizon: This Week</option>
              <option value="Horizon: This Month">Horizon: This Month</option>
              <option value="Horizon: Custom Scope">Horizon: Custom Scope</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-2.5 text-[16px] text-secondary pointer-events-none">calendar_today</span>
          </div>

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search incentive, code..."
              className="w-full bg-surface-container-lowest border border-sand-neutral pl-9 pr-3 py-2 font-body-md text-[13px] text-onyx-black placeholder:text-secondary focus:outline-none focus:border-onyx-black"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-secondary">search</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-sand-neutral mb-12">
          <span className="material-symbols-outlined text-[36px] text-secondary animate-spin mb-2 block">sync</span>
          <p className="font-button-text text-onyx-black">Loading telemetry &amp; incentive rules...</p>
        </div>
      ) : !data.hasData || (data.incentives || []).length === 0 ? (
        /* Empty State */
        <div className="bg-surface-container-lowest border border-sand-neutral p-12 text-center mb-12 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-bone-white border border-sand-neutral flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-secondary">military_tech</span>
          </div>
          <h3 className="font-headline-md text-[24px] text-onyx-black mb-2">No incentives or bonuses yet</h3>
          <p className="font-body-md text-on-surface-variant text-[14px] max-w-md mx-auto leading-relaxed mb-6">
            Eligible incentives and promotional rewards will appear here when available based on your GPS operational zone and trip volume.
          </p>
          <button
            onClick={handleRefresh}
            className="px-5 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text inline-flex items-center gap-2 cursor-pointer hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            <span>Check Active Campaigns</span>
          </button>
        </div>
      ) : (
        /* Primary Asymmetric Grid: 65% Main List / 35% Inspector Drawer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column: Incentive Cards Stream */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {(data.incentives || []).map((incentive) => {
              const isSelected = selectedIncentive?.id === incentive.id;
              const isCompleted = incentive.status === 'COMPLETED';

              return (
                <div
                  key={incentive.id}
                  onClick={() => setSelectedIncentiveId(incentive.id)}
                  className={`bg-surface-container-lowest p-6 relative transition-all cursor-pointer ${isSelected
                    ? 'border-2 border-onyx-black shadow-md'
                    : 'border border-sand-neutral hover:border-onyx-black'
                    } ${isCompleted ? 'opacity-90' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 font-label-caps text-[10px] tracking-wider uppercase font-semibold flex items-center gap-1 ${isCompleted
                          ? 'bg-emerald-100 text-emerald-950'
                          : incentive.category === 'circularity'
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : 'bg-emerald-100 text-emerald-900'
                          }`}>
                          {isCompleted && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                          {incentive.statusBadge || incentive.status}
                        </span>
                        <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest">{incentive.code}</span>
                      </div>
                      <h3 className="font-headline-md text-[24px] leading-tight text-onyx-black">{incentive.title}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-label-caps text-[10px] uppercase text-secondary block">{incentive.rewardType || 'Bonus Pool'}</span>
                      <span className={`font-headline-md text-[26px] font-semibold ${isCompleted ? 'text-emerald-900' : 'text-onyx-black'}`}>
                        {incentive.formattedReward || formatCurrency(incentive.reward)}
                      </span>
                    </div>
                  </div>

                  <p className="font-body-md text-on-surface-variant text-[14px] leading-relaxed mb-5">
                    {incentive.description}
                  </p>

                  {/* Progress Metrics & Stepped Bar */}
                  <div className="mb-5 bg-bone-white p-4 border border-sand-neutral">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-label-caps text-label-caps uppercase text-onyx-black">
                        {incentive.unitLabel || 'Progress'}
                      </span>
                      <span className="font-button-text text-[13px] text-onyx-black font-semibold">
                        {incentive.completedUnits} of {incentive.targetUnits} Completed ({incentive.progressPercent}%)
                      </span>
                    </div>
                    <div className="relative w-full h-2.5 bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full bg-onyx-black transition-all duration-500"
                        style={{ width: `${incentive.progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-label-caps uppercase text-secondary mt-2">
                      <span>Start (0)</span>
                      <span className="text-onyx-black font-medium">
                        {incentive.remainingUnits > 0 ? `${incentive.remainingUnits} Runs Remaining` : 'Goal Reached!'}
                      </span>
                      <span>Target ({incentive.targetUnits})</span>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-sand-neutral text-[13px]">
                    <div className="flex items-center gap-1.5 text-secondary">
                      <span className="material-symbols-outlined text-[16px]">
                        {isCompleted ? 'verified' : 'timer'}
                      </span>
                      <span>
                        {isCompleted ? 'Settled on: ' : 'Valid until: '}
                        <strong className="text-onyx-black font-medium">{incentive.validUntil}</strong>
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 font-button-text text-button-text text-onyx-black underline font-semibold">
                      {isSelected ? 'Inspection Drawer Active' : 'View Metric Parameters'}
                      <span className="material-symbols-outlined text-[16px]">
                        {isSelected ? 'arrow_forward' : 'arrow_right_alt'}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Discreet Informational Callout */}
            <div className="p-6 bg-bone-white border border-sand-neutral flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary text-[24px] flex-shrink-0 mt-0.5">info</span>
              <div>
                <h4 className="font-button-text text-[14px] text-onyx-black font-semibold uppercase tracking-wider mb-1">
                  Program Auto-Allocation
                </h4>
                <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">
                  Eligible localized incentives and regional micro-surges automatically activate based on your GPS telemetry and live route density. No manual opt-in required for Tier 1 couriers.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Incentive Details Drawer / Inspection Panel */}
          {selectedIncentive && (
            <div className="lg:col-span-5 sticky top-6">
              <div className="bg-surface-container-lowest border border-onyx-black p-7 shadow-sm">
                {/* Drawer Top Control */}
                <div className="flex items-center justify-between pb-5 border-b border-sand-neutral">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Incentive Details</span>
                    <span className="font-mono text-[11px] text-onyx-black font-semibold">
                      {selectedIncentive.code} • {selectedIncentive.cluster || 'BANDRA CLUSTER'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 font-label-caps text-[10px] tracking-widest uppercase font-semibold ${selectedIncentive.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-950'
                    : 'bg-onyx-black text-on-primary'
                    }`}>
                    {selectedIncentive.status === 'COMPLETED' ? 'SETTLED' : 'ACTIVE NOW'}
                  </span>
                </div>

                {/* Selected Item Core Profile */}
                <div className="py-6 border-b border-sand-neutral">
                  <h2 className="font-headline-md text-[26px] leading-tight text-onyx-black mb-2">
                    {selectedIncentive.title}
                  </h2>
                  <div className="p-4 bg-bone-white border border-sand-neutral mb-4">
                    <span className="font-label-caps text-[11px] text-secondary uppercase block mb-1">Target Payout</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-lg text-[36px] font-semibold text-onyx-black">
                        {selectedIncentive.formattedReward || formatCurrency(selectedIncentive.reward)}
                      </span>
                      <span className="font-body-md text-xs text-on-surface-variant">Instant Wallet Credit</span>
                    </div>
                    <p className="font-label-caps text-[10px] text-secondary uppercase mt-2">
                      Zero escrow delay • Directly disbursed via UPI upon OTP validation
                    </p>
                  </div>

                  {/* Circular Metric / Vector Progress Indicator */}
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-sand-neutral">
                    <div className="space-y-1">
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block">Quota Progress</span>
                      <div className="font-headline-md text-[24px] text-onyx-black">
                        {selectedIncentive.completedUnits} / {selectedIncentive.targetUnits} Consignments
                      </div>
                      <span className="font-label-caps text-[11px] text-emerald-800 font-semibold uppercase">
                        {selectedIncentive.remainingUnits > 0
                          ? `${selectedIncentive.remainingUnits} deliveries left to release ${selectedIncentive.formattedReward || formatCurrency(selectedIncentive.reward)}`
                          : 'Milestone 100% Cleared'}
                      </span>
                    </div>

                    {/* Inline Mini SVG Progress Radial */}
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-sand-neutral"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        ></path>
                        <path
                          className="text-onyx-black"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray={`${selectedIncentive.progressPercent}, 100`}
                          strokeLinecap="square"
                          strokeWidth="3.5"
                        ></path>
                      </svg>
                      <span className="absolute font-button-text text-[12px] font-bold text-onyx-black">
                        {selectedIncentive.progressPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strict Eligibility Rules Specification */}
                <div className="py-6 border-b border-sand-neutral">
                  <h4 className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    Strict Eligibility Parameters
                  </h4>
                  <ul className="space-y-3 font-body-md text-[13px] text-on-surface-variant">
                    {(selectedIncentive.rules || [
                      'Cluster Origin: Consignments must be accepted from verified kitchens in Bandra West, Khar, or Santacruz East.',
                      'Quality Baseline: Transit trip rating must average ≥ 4.50 with zero reported spilled containers.',
                      'Active Window: Dispatched between Friday 18:00 IST and Sunday 23:59 IST exclusively.'
                    ]).map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[16px] text-onyx-black mt-0.5 flex-shrink-0">check</span>
                        <span dangerouslySetInnerHTML={{ __html: rule }}></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Live Delivery Verification Feed (Associated Orders Log) */}
                <div className="py-6 border-b border-sand-neutral">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                      Qualified Trips Log ({selectedIncentive.completedUnits})
                    </h4>
                    <span className="font-label-caps text-[10px] text-secondary">Auto-Appended</span>
                  </div>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 font-body-md text-[13px]">
                    {(selectedIncentive.qualifiedTrips || []).slice(0, selectedIncentive.completedUnits).map((trip, tIdx) => (
                      <div key={tIdx} className="p-2.5 bg-bone-white border border-sand-neutral flex items-center justify-between">
                        <div>
                          <span className="font-mono font-medium text-onyx-black text-[12px]">{trip.orderId}</span>
                          <span className="text-secondary text-[12px] block">{trip.item}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-label-caps text-[10px] text-emerald-800 font-semibold block">{trip.status}</span>
                          <span className="text-[11px] text-secondary">{trip.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Timelines & Trigger Metadata */}
                <div className="py-5 text-[12px] font-body-md text-secondary space-y-1.5 border-b border-sand-neutral">
                  <div className="flex justify-between">
                    <span className="font-label-caps text-[11px] uppercase">Sprint Activated:</span>
                    <span className="text-onyx-black font-medium">15 Sep 2026, 06:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-label-caps text-[11px] uppercase">Sprint Closes:</span>
                    <span className="text-onyx-black font-medium">{selectedIncentive.validUntil}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-label-caps text-[11px] uppercase">Trigger Engine:</span>
                    <span className="text-onyx-black font-medium">Socket.IO Ledger Pipeline v2.4</span>
                  </div>
                </div>

                {/* Inspector Drawer Actions */}
                <div className="pt-6 space-y-2.5">
                  <button
                    onClick={() => {
                      alert('Navigating to live available delivery requests in your active operational zone...');
                    }}
                    className="w-full py-3 px-4 bg-onyx-black hover:bg-primary-container text-on-primary font-button-text text-button-text tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                    <span>Find Available Deliveries in Zone</span>
                  </button>

                  <button
                    onClick={() => setShowRulesModal(true)}
                    className="w-full py-2.5 px-4 bg-bone-white hover:bg-surface-container border border-sand-neutral text-onyx-black font-button-text text-[13px] tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">help_center</span>
                    <span>Incentive Terms &amp; Policy FAQ</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Verification & Security Telemetry Footer */}
      <div className="mt-auto bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none bg-bone-white border border-sand-neutral flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-onyx-black text-[20px]">encrypted</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-button-text text-[13px] text-onyx-black font-semibold uppercase tracking-wider">Driver Telemetry Authenticated</span>
              <span className="px-1.5 py-0.2 bg-surface-container-high text-onyx-black font-label-caps text-[10px]">
                {data.driver?.id ? `#${data.driver.id}` : ''}
              </span>
            </div>
            <p className="font-body-md text-[12px] text-secondary">
              Scoped directly to {data.driver?.name || 'Courier Partner'} ({data.driver?.tier || 'Tier 1 Courier'}). Progress calculations derived strictly from authenticated MongoDB delivery receipts &amp; GPS logs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-secondary font-label-caps text-[11px] uppercase tracking-wider flex-shrink-0">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
            GPS High Accuracy • 4m
          </span>
          <span>•</span>
          <span>Sync Latency: 42ms</span>
        </div>
      </div>

      {/* Rules & Terms Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest border-2 border-onyx-black w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-sand-neutral flex items-center justify-between bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-[24px]">gavel</span>
                <h3 className="font-headline-md text-[22px] text-onyx-black">Incentive Rules &amp; Operational Policy</h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-secondary hover:text-onyx-black p-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 font-body-md text-[14px] text-on-surface-variant">
              <div className="p-4 bg-bone-white border border-sand-neutral">
                <h4 className="font-button-text text-onyx-black font-semibold text-[15px] mb-1">1. Automatic Milestone Allocation</h4>
                <p className="text-[13px] leading-relaxed">
                  All active courier partners logged into TiffinLink with verified GPS status are automatically enrolled into regional milestone sprints. No manual claim code is required.
                </p>
              </div>

              <div className="p-4 bg-bone-white border border-sand-neutral">
                <h4 className="font-button-text text-onyx-black font-semibold text-[15px] mb-1">2. Disqualification &amp; Spill Policy</h4>
                <p className="text-[13px] leading-relaxed">
                  Consignments with reported packaging spills, unexcused delivery cancellations, or customer ratings below 4.0 will be automatically excluded from milestone progression calculations.
                </p>
              </div>

              <div className="p-4 bg-bone-white border border-sand-neutral">
                <h4 className="font-button-text text-onyx-black font-semibold text-[15px] mb-1">3. Immediate Settlement &amp; Wallet Credit</h4>
                <p className="text-[13px] leading-relaxed">
                  Incentive rewards unlock immediately upon completing the required quota. Rewards are disbursed directly into your TiffinLink Wallet and can be withdrawn via UPI at any time.
                </p>
              </div>

              <div className="p-4 bg-bone-white border border-sand-neutral">
                <h4 className="font-button-text text-onyx-black font-semibold text-[15px] mb-1">4. Circular Tiffin Container Exchange Rewards</h4>
                <p className="text-[13px] leading-relaxed">
                  Reverse delivery bonuses (₹15/container + milestone lump sum) require valid QR/OTP validation at customer pickup and kitchen drop-off.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-sand-neutral bg-surface-container-lowest flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text cursor-pointer hover:bg-primary-container"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentivesBonusesView;
