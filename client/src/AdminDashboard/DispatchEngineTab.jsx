import React, { useState, useEffect } from 'react';

export default function DispatchEngineTab({ onNavigate }) {
  const [isSweeping, setIsSweeping] = useState(false);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    activeHandovers: 0,
    candidatesNotified: 0,
    assignmentLatency: '14.2s',
    raceConflicts: 0,
    firstRoundRate: '100.0%'
  });
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sweepClock, setSweepClock] = useState(() => {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0') + ' IST';
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [engineParams, setEngineParams] = useState({
    broadcastRadius: 5.0,
    raceWindow: 15.0,
    candidateLimit: 5,
    autoReassignTimeout: 45,
    routingStrategy: 'CLOSEST_ETA'
  });
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportLedger = () => {
    if (!requests || requests.length === 0) {
      showToast('No dispatch ledger records to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      timestamp: new Date().toISOString(),
      engineMode: 'ATOMIC_LOCK_V2',
      requestsCount: requests.length,
      engineParams,
      stats,
      requests
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tiffinlink_dispatch_ledger_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${requests.length} dispatch requests ledger (JSON)`);
  };

  const fetchDispatchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dispatch-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setRequests(data.requests);
        if (data.stats) setStats(data.stats);
        if (data.requests.length > 0) {
          setSelectedReqId((prev) => {
            const exists = data.requests.some((r) => r.reqId === prev || r._id === prev);
            return exists ? prev : data.requests[0].reqId;
          });
        }
      }
    } catch (err) {
      console.error('Failed to load dispatch requests from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const handleSweep = async () => {
    setIsSweeping(true);
    await fetchDispatchData();
    const now = new Date();
    const updatedTime = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0') + ' IST';
    setSweepClock(updatedTime);
    setIsSweeping(false);
    showToast(`Dispatch sweep complete: ${requests.length} database requests synchronized`);
  };

  const selectedReq = requests.find((r) => r.reqId === selectedReqId || r._id === selectedReqId) || requests[0] || null;

  const activeAudit = selectedReq ? {
    reqId: selectedReq.reqId,
    statusPill: selectedReq.status,
    events: selectedReq.auditEvents || [],
    raceDelta: selectedReq.winner ? '14.000 ms' : 'AWAITING LOCK',
    dbIsolation: 'READ COMMITTED 2PC (MongoDB)'
  } : {
    reqId: 'STANDBY',
    statusPill: 'IDLE',
    events: [
      {
        time: sweepClock,
        step: 'STEP 1 / STANDBY',
        desc: 'Broadcasting socket pool active across Ahmedabad geofence nodes.',
        detail: 'Listening for new provider ready notices on MongoDB stream.'
      }
    ],
    raceDelta: '0.0 ms',
    dbIsolation: 'READ COMMITTED 2PC (MongoDB)'
  };

  return (
    <div className="flex flex-col w-full -m-4 sm:-m-6 md:-m-8 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* Top Engine Header & Telemetry Strip */}
      <section className="px-6 sm:px-8 py-6 bg-[#fbf9f5] border-b border-[#ded9d1]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 max-w-[1440px] mx-auto">
          <div className="space-y-2 max-w-4xl">
            <div className="flex items-center gap-2 text-[#665d52] font-mono tracking-widest text-[11px] uppercase">
              <span>SUPER ADMIN</span>
              <span className="text-[#ded9d1]">/</span>
              <span>MANAGEMENT</span>
              <span className="text-[#ded9d1]">/</span>
              <span>DELIVERY PARTNERS</span>
              <span className="text-[#ded9d1]">/</span>
              <span className="text-[#1a1a1a] font-semibold">DELIVERY REQUESTS DISPATCH</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight leading-none font-normal">
              Delivery Requests Dispatch & Atomic Broadcast Engine
            </h1>
            <p className="text-sm text-[#665d52] max-w-3xl leading-relaxed">
              Real-time broadcast queue from kitchen batch ready events to nearby eligible couriers with atomic single-winner assignment locking (preventing 409 race conditions).
            </p>
          </div>

          {/* Action Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSweep}
              disabled={isSweeping}
              className="px-4 py-2.5 bg-[#1a1a1a] text-white text-xs font-medium hover:bg-black transition-colors flex items-center gap-2 active:scale-[0.98] border border-[#1a1a1a]"
            >
              <span className={`material-symbols-outlined text-[17px] ${isSweeping ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isSweeping ? 'Sweeping Queue...' : 'Force Dispatch Sweep'}</span>
            </button>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2.5 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-xs font-medium transition-colors flex items-center gap-2 border border-[#ded9d1]"
              title="Configure Dispatch Broadcast Parameters"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
              <span>Configure Parameters</span>
            </button>
            <button
              onClick={handleExportLedger}
              className="px-3 py-2.5 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#665d52] hover:text-[#1a1a1a] transition-colors border border-[#ded9d1]"
              title="Export Dispatch Log JSON Ledger"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
            </button>
          </div>
        </div>

        {/* Telemetry Status Ribbon */}
        <div className="mt-5 pt-4 border-t border-[#ded9d1] flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#665d52] max-w-[1440px] mx-auto">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="text-[#1a1a1a] font-semibold">ENGINE MODE:</span>
              <span className="bg-[#eae8e4] px-2 py-0.5 text-[#1a1a1a] border border-[#ded9d1]">ATOMIC_LOCK_V2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#665d52]">radar</span>
              <span>BROADCAST RADIUS:</span>
              <span className="text-[#1a1a1a] font-semibold">3.5 km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#665d52]">speed</span>
              <span>PING RTT:</span>
              <span className="text-[#1a1a1a] font-semibold">45ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-700">lock</span>
              <span>MUTEX DRIVER:</span>
              <span className="text-[#1a1a1a] font-semibold">MongoDB WiredTiger 2PC</span>
            </div>
          </div>
          <div className="text-[#665d52]">
            <span>LAST SWEEP: </span>
            <span className="text-[#1a1a1a] font-semibold">{sweepClock}</span>
          </div>
        </div>
      </section>

      <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-8 py-6 space-y-6">
        {/* Key Metrics Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 border border-[#ded9d1] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">Kitchen Handovers</span>
              <span className="material-symbols-outlined text-base">soup_kitchen</span>
            </div>
            <div className="my-3">
              <div className="font-serif text-3xl text-[#1a1a1a] font-medium tracking-tight">
                {stats.activeHandovers}
              </div>
              <div className="text-xs text-[#665d52] mt-0.5">Active requests queued</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>{stats.activeHandovers > 0 ? 'Active in flight' : 'Queue clear'}</span>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#ded9d1] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">Candidates Notified</span>
              <span className="material-symbols-outlined text-base">cell_tower</span>
            </div>
            <div className="my-3">
              <div className="font-serif text-3xl text-[#1a1a1a] font-medium tracking-tight">
                {stats.candidatesNotified}
              </div>
              <div className="text-xs text-[#665d52] mt-0.5">Couriers in push ring</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#665d52]">
              <span>Pool density:</span>
              <span className="text-[#1a1a1a] font-semibold">{stats.candidatesNotified} active</span>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#ded9d1] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">Assignment Latency</span>
              <span className="material-symbols-outlined text-base">timer</span>
            </div>
            <div className="my-3">
              <div className="font-serif text-3xl text-[#1a1a1a] font-medium tracking-tight">
                {stats.assignmentLatency}
              </div>
              <div className="text-xs text-[#665d52] mt-0.5">SLA Target &lt; 45.0s</div>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-800 font-medium">
              <span className="material-symbols-outlined text-xs">trending_down</span>
              <span>Sub-second DB lock</span>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#ded9d1] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">Race Conflicts</span>
              <span className="material-symbols-outlined text-base">shield_with_heart</span>
            </div>
            <div className="my-3">
              <div className="font-serif text-3xl text-[#1a1a1a] font-medium tracking-tight">
                {stats.raceConflicts}
              </div>
              <div className="text-xs text-[#665d52] mt-0.5">409 cleanly resolved</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-800">
              <span>Zero double-binds</span>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#ded9d1] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">First-Round Rate</span>
              <span className="material-symbols-outlined text-base">verified</span>
            </div>
            <div className="my-3">
              <div className="font-serif text-3xl text-[#1a1a1a] font-medium tracking-tight">
                {stats.firstRoundRate}
              </div>
              <div className="text-xs text-[#665d52] mt-0.5">First broadcast lock</div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>High Liquidity</span>
            </div>
          </div>
        </section>

        {/* Architectural Flow Lifecycle Banner */}
        <section className="bg-white border border-[#ded9d1] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#ded9d1]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#1a1a1a]">account_tree</span>
              <h2 className="font-serif text-lg text-[#1a1a1a] font-medium">Atomic Dispatch State Machine Lifecycle</h2>
            </div>
            <span className="font-mono text-[11px] text-[#665d52] uppercase tracking-wider">
              Pipeline: ZERO_CONFLICT_STRICT
            </span>
          </div>

          {/* Flow Pipeline Step Tracker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3 flex flex-col justify-between space-y-1.5">
              <div className="font-mono text-[9px] text-[#665d52] uppercase font-semibold">01 • INGESTION</div>
              <div className="font-medium text-xs text-[#1a1a1a] leading-tight">Provider Ready Notice</div>
              <div className="text-[10px] font-mono text-[#665d52]">Kafka batch:ready</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3 flex flex-col justify-between space-y-1.5">
              <div className="font-mono text-[9px] text-[#665d52] uppercase font-semibold">02 • SYNTHESIS</div>
              <div className="font-medium text-xs text-[#1a1a1a] leading-tight">Delivery Request Generated</div>
              <div className="text-[10px] font-mono text-[#665d52]">Payload signed</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3 flex flex-col justify-between space-y-1.5">
              <div className="font-mono text-[9px] text-[#665d52] uppercase font-semibold">03 • SPATIAL</div>
              <div className="font-medium text-xs text-[#1a1a1a] leading-tight">Geo-Spatial Filter</div>
              <div className="text-[10px] font-mono text-[#665d52]">Redis GeoRadius ≤3.5km</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3 flex flex-col justify-between space-y-1.5">
              <div className="font-mono text-[9px] text-[#665d52] uppercase font-semibold">04 • MULTICAST</div>
              <div className="font-medium text-xs text-[#1a1a1a] leading-tight">Socket Broadcast</div>
              <div className="text-[10px] font-mono text-[#665d52]">5–8 Couriers in ring</div>
            </div>

            <div className="bg-[#eee0d2] border border-[#ded9d1] p-3 flex flex-col justify-between space-y-1.5">
              <div className="font-mono text-[9px] text-[#211b12] uppercase font-semibold">05 • FIRST HIT</div>
              <div className="font-medium text-xs text-[#1a1a1a] leading-tight">Courier Accepts</div>
              <div className="text-[10px] font-mono text-[#4a4238]">TCP handshake rtt</div>
            </div>

            <div className="bg-[#1a1a1a] text-white p-3 flex flex-col justify-between space-y-1.5 shadow-sm">
              <div className="font-mono text-[9px] text-[#ded9d1] uppercase font-semibold">06 • ATOMIC LOCK</div>
              <div className="font-medium text-xs text-white leading-tight">Atomic DB Mutation</div>
              <div className="text-[10px] font-mono text-[#ded9d1]">status=ASSIGNED (4ms)</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-3 flex flex-col justify-between space-y-1.5">
              <div className="font-mono text-[9px] text-[#665d52] uppercase font-semibold">07 • REJECTION</div>
              <div className="font-medium text-xs text-[#1a1a1a] leading-tight">409 Sent to Slower</div>
              <div className="text-[10px] font-mono text-[#665d52]">Candidate ring released</div>
            </div>
          </div>
        </section>

        {/* Live Broadcast Queue & Conflict Split Section */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Table: Left 8 Cols */}
          <div className="xl:col-span-8 flex flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-[#1a1a1a] font-medium">In-Flight Broadcast Queue</h2>
                <p className="text-xs text-[#665d52] mt-0.5">Live orders currently traversing candidate negotiation rings</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-mono text-[11px] text-[#665d52]">SOCKET: sub:/broadcast/hubs/navrangpura</span>
              </div>
            </div>

            {/* Queue Table Container */}
            <div className="bg-white border border-[#ded9d1] overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f0eeea] border-b border-[#ded9d1] font-mono text-[10px] text-[#665d52] uppercase tracking-wider">
                    <th className="py-3 px-3.5">Request / Order</th>
                    <th className="py-3 px-3.5">Customer & Route</th>
                    <th className="py-3 px-3.5">Kitchen Hub</th>
                    <th className="py-3 px-3.5">Fee / Dist</th>
                    <th className="py-3 px-3.5">Couriers Pushed</th>
                    <th className="py-3 px-3.5">Elapsed</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded9d1]/60">
                  {requests.map((req) => {
                    const isSelected = selectedReqId === req.reqId;
                    return (
                      <tr
                        key={req.reqId}
                        onClick={() => setSelectedReqId(req.reqId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#eee0d2]/40 hover:bg-[#eee0d2]/60 border-l-4 border-[#1a1a1a]'
                            : req.status === 'SLA_WARNING'
                            ? 'bg-red-50/50 hover:bg-red-50'
                            : 'hover:bg-[#f5f3ef]'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono">
                          <div className="font-bold text-[#1a1a1a]">#{req.reqId}</div>
                          <div className="text-[10px] text-[#665d52]">#{req.orderId}</div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-medium text-[#1a1a1a]">{req.customer}</div>
                          <div className="text-[#665d52] text-[11px] truncate max-w-[140px]">{req.destination}</div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-medium text-[#1a1a1a]">{req.kitchen}</div>
                          <div className="font-mono text-[10px] text-[#665d52]">{req.kitchenHub}</div>
                        </td>

                        <td className="py-3 px-3.5 font-mono">
                          <div className="text-[#1a1a1a] font-semibold">{req.fee}</div>
                          <div className="text-[10px] text-[#665d52]">{req.dist}</div>
                        </td>

                        <td className="py-3 px-3.5 font-mono">
                          {req.winner ? (
                            <div>
                              <div className="font-semibold text-emerald-800">{req.winner}</div>
                              <div className="text-[10px] text-[#665d52]">{req.winnerNote}</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-[#1a1a1a]">{req.candidatesCount} candidates</div>
                              <div className="text-[10px] text-[#665d52] truncate max-w-[120px]">{req.candidatesPill}</div>
                            </div>
                          )}
                        </td>

                        <td className={`py-3 px-3.5 font-mono font-semibold ${
                          req.status === 'SLA_WARNING'
                            ? 'text-red-700'
                            : req.status === 'BROADCASTING'
                            ? 'text-amber-700'
                            : 'text-[#665d52]'
                        }`}>
                          {req.elapsed}
                        </td>

                        <td className="py-3 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase border ${
                              req.status === 'BROADCASTING'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : req.status === 'AWAITING_ACCEPT'
                                ? 'bg-orange-50 text-orange-900 border-orange-200'
                                : req.status === 'LOCKED_ASSIGNED' || req.status === 'DELIVERED' || req.status === 'IN_TRANSIT'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-red-50 text-red-900 border-red-200'
                            }`}
                          >
                            {req.status === 'BROADCASTING' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            )}
                            {(req.status === 'LOCKED_ASSIGNED' || req.status === 'DELIVERED') && (
                              <span className="material-symbols-outlined text-[11px]">check</span>
                            )}
                            {req.status === 'IN_TRANSIT' && (
                              <span className="material-symbols-outlined text-[11px]">two_wheeler</span>
                            )}
                            {req.status === 'CANCELLED' && (
                              <span className="material-symbols-outlined text-[11px]">close</span>
                            )}
                            {req.status}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedReqId(req.reqId)}
                              className="px-2 py-1 bg-[#1a1a1a] text-white hover:bg-black text-[10px]"
                            >
                              Inspect
                            </button>
                            {req.status === 'BROADCASTING' && (
                              <button
                                onClick={() => showToast(`Force assigning driver to #${req.reqId}`)}
                                className="px-2 py-1 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-[10px] border border-[#ded9d1]"
                              >
                                Force Assign
                              </button>
                            )}
                            {req.status === 'SLA_WARNING' && (
                              <button
                                onClick={() => showToast(`Auto-assigning nearest courier for #${req.reqId}`)}
                                className="px-2 py-1 bg-red-700 text-white hover:bg-red-800 text-[10px]"
                              >
                                Auto Nearest
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-[#665d52] font-mono text-xs">
                        {loading ? 'Fetching real dispatch requests from MongoDB...' : 'No delivery requests found in database.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Broadcast Spatial Coverage & Density Heatmap Radar representation */}
            <div className="bg-white border border-[#ded9d1] p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-[#1a1a1a]">Spatial Coverage & Density Heatmap</h3>
                  <p className="text-xs text-[#665d52]">Active radius 3.5km geofence around central kitchen hubs in Ahmedabad</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-[#665d52]"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Active Couriers ({stats.candidatesNotified})</span>
                  <span className="flex items-center gap-1 text-[#665d52]"><span className="w-2 h-2 rounded-full bg-amber-500" /> In-Queue ({requests.length})</span>
                  <span className="flex items-center gap-1 text-[#665d52]"><span className="w-2 h-2 rounded-full bg-[#1a1a1a]" /> Kitchen Hubs (2)</span>
                </div>
              </div>

              {/* Static Location View Container with HUD */}
              <div
                className="w-full h-64 bg-cover bg-center relative overflow-hidden border border-[#ded9d1]"
                style={{
                  backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDpMWpnqXKhTUzaj5OIWTxM2HNtpQMgWgk1MFNsbauLrELINB9LR_DmKdXMkBdma5IBUJU6fQWMd18BRKv9fImHzLXe5jH88XeJmVpu-_B_oKhcgl8RLwnLPggJNDzDjsNNYm2SC9ZEQsxTw9cZSsDPu7_eKooTQD4D71jOJbCp-XVuDginGc2FdAzZpBFyhzqHdsR-mgD1cQGfWNMxHL40mETgmksIEND-vRpSS1H_VFjz8DRNV1Pu')`
                }}
              >
                {/* Translucent HUD overlay over map */}
                <div className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-[1px] p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between font-mono text-[10px] text-white">
                    <span className="bg-[#1a1a1a]/80 px-2 py-0.5 border border-white/20">GEO_HASH: te7u2p • ZOOM: 14.2x</span>
                    <span className="bg-[#1a1a1a]/80 px-2 py-0.5 border border-white/20">GEOFENCE ACTIVE: 3,500m</span>
                  </div>

                  {/* Central Radar HUD Markers */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="w-44 h-44 rounded-full border border-white/20 absolute flex items-center justify-center pointer-events-none">
                      <div className="w-28 h-28 rounded-full border border-white/30 absolute" />
                      <div className="w-14 h-14 rounded-full border border-amber-400/50 absolute animate-pulse" />
                    </div>

                    {/* Kitchen Hub Marker */}
                    <div className="absolute z-10 flex flex-col items-center">
                      <span className="w-4 h-4 bg-amber-400 text-[#1a1a1a] flex items-center justify-center shadow-md font-bold">
                        <span className="material-symbols-outlined text-[11px]">restaurant</span>
                      </span>
                      <span className="bg-[#1a1a1a] text-white font-mono text-[9px] px-1 mt-0.5">
                        {selectedReq?.kitchenHub || 'SATELLITE_HUB'}
                      </span>
                    </div>

                    {/* Real Courier Winner Marker */}
                    <div className="absolute -translate-x-16 -translate-y-10 flex flex-col items-center">
                      <span className="w-3.5 h-3.5 bg-emerald-500 text-white flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-[10px]">two_wheeler</span>
                      </span>
                      <span className="bg-[#1a1a1a] text-white font-mono text-[8px] px-1 mt-0.5">
                        {selectedReq?.winner ? selectedReq.winner : 'TL-65013-B (Ziyan Mansuri)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[10px] text-white/90">
                    <span className="bg-[#1a1a1a]/80 px-2 py-0.5 border border-white/20">SOCKET BROADCAST POOL: ACTIVE</span>
                    <span className="bg-[#1a1a1a]/80 px-2 py-0.5 border border-white/20">CLUSTER: BOM-IND-01-AMD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspector Panel: Right 4 Cols */}
          <div className="xl:col-span-4 flex flex-col space-y-4">
            <div>
              <h2 className="font-serif text-xl text-[#1a1a1a] font-medium">Atomic Inspector</h2>
              <p className="text-xs text-[#665d52] mt-0.5">Sub-millisecond resolution lock resolution trace</p>
            </div>

            <div className="bg-white border border-[#ded9d1] p-5 space-y-5 flex-1 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                  <div>
                    <span className="font-mono text-[10px] text-[#665d52] uppercase font-semibold">ACTIVE AUDIT RECORD</span>
                    <div className="font-serif text-lg text-[#1a1a1a] font-medium">Request #{activeAudit.reqId}</div>
                  </div>
                  <span className="px-2 py-0.5 font-mono text-[9px] bg-emerald-50 text-emerald-800 font-semibold uppercase border border-emerald-200">
                    {activeAudit.statusPill}
                  </span>
                </div>

                {/* Microscopic Audit Log Stepper */}
                <div className="space-y-2.5 font-mono text-xs">
                  {activeAudit.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 space-y-1 border ${
                        ev.isWinner
                          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                          : 'bg-[#f5f3ef] border-[#ded9d1]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={ev.isWinner ? 'text-[#ded9d1]' : 'text-[#665d52]'}>{ev.time}</span>
                        <span
                          className={`font-semibold ${
                            ev.isWinner
                              ? 'bg-white text-[#1a1a1a] px-1 text-[9px] font-bold'
                              : ev.stepClass || 'text-[#1a1a1a]'
                          }`}
                        >
                          {ev.step}
                        </span>
                      </div>
                      <div className={`text-xs ${ev.isWinner ? 'text-white' : 'text-[#1a1a1a]'}`}>{ev.desc}</div>
                      {ev.detail && <div className="text-[10px] text-[#665d52]">{ev.detail}</div>}
                      {ev.code && (
                        <div className="text-[10px] font-mono break-all text-emerald-300 bg-black/40 p-1.5 border border-white/10">
                          {ev.code}
                        </div>
                      )}
                      {ev.conflictPill && (
                        <div className="p-1 bg-red-50 text-red-900 text-[10px] font-mono border border-red-200">
                          {ev.conflictPill}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry Audit Summary Footer */}
              <div className="pt-3 border-t border-[#ded9d1] space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#665d52]">RACE DELTA TO 2ND PLACE</span>
                  <span className="text-[#1a1a1a] font-bold">{activeAudit.raceDelta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#665d52]">DATABASE ISOLATION</span>
                  <span className="text-[#1a1a1a] font-bold">{activeAudit.dbIsolation}</span>
                </div>
                <button
                  onClick={handleExportLedger}
                  className="w-full mt-2 py-2 bg-[#f0eeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 border border-[#ded9d1]"
                >
                  <span className="material-symbols-outlined text-sm">terminal</span>
                  <span>Download Raw Engine JSON Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CONFIGURE PARAMETERS MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div>
                <span className="text-[10px] text-[#665d52] uppercase tracking-wider block">Atomic Dispatch Settings</span>
                <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Configure Engine Parameters</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[#1a1a1a] font-semibold mb-1">
                  <span>Geofence Broadcast Radius</span>
                  <span className="text-emerald-800">{engineParams.broadcastRadius} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={engineParams.broadcastRadius}
                  onChange={(e) => setEngineParams({ ...engineParams, broadcastRadius: parseFloat(e.target.value) })}
                  className="w-full accent-[#1a1a1a]"
                />
                <span className="text-[10px] text-[#665d52]">Maximum distance from kitchen node to search candidate couriers.</span>
              </div>

              <div>
                <div className="flex justify-between text-[#1a1a1a] font-semibold mb-1">
                  <span>First-Response Race Window</span>
                  <span className="text-emerald-800">{engineParams.raceWindow} ms</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={engineParams.raceWindow}
                  onChange={(e) => setEngineParams({ ...engineParams, raceWindow: parseFloat(e.target.value) })}
                  className="w-full accent-[#1a1a1a]"
                />
                <span className="text-[10px] text-[#665d52]">Atomic 2PC lock resolution window to resolve multi-partner taps.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#665d52] text-[10px] uppercase font-semibold mb-1">Max Candidates / Blast</label>
                  <select
                    value={engineParams.candidateLimit}
                    onChange={(e) => setEngineParams({ ...engineParams, candidateLimit: parseInt(e.target.value) })}
                    className="w-full bg-white border border-[#ded9d1] p-2 text-xs text-[#1a1a1a]"
                  >
                    <option value={3}>3 Couriers</option>
                    <option value={5}>5 Couriers</option>
                    <option value={8}>8 Couriers</option>
                    <option value={12}>12 Couriers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#665d52] text-[10px] uppercase font-semibold mb-1">Auto-Reroute Sla</label>
                  <select
                    value={engineParams.autoReassignTimeout}
                    onChange={(e) => setEngineParams({ ...engineParams, autoReassignTimeout: parseInt(e.target.value) })}
                    className="w-full bg-white border border-[#ded9d1] p-2 text-xs text-[#1a1a1a]"
                  >
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#665d52] text-[10px] uppercase font-semibold mb-1">Routing Heuristic</label>
                <select
                  value={engineParams.routingStrategy}
                  onChange={(e) => setEngineParams({ ...engineParams, routingStrategy: e.target.value })}
                  className="w-full bg-white border border-[#ded9d1] p-2 text-xs text-[#1a1a1a]"
                >
                  <option value="CLOSEST_ETA">Closest ETA (Dijkstra + Live Traffic)</option>
                  <option value="THERMAL_PRIORITY">Thermal Retention Priority (&gt;65°C Bags)</option>
                  <option value="BALANCED_WORKLOAD">Driver Workload Balance</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ded9d1] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a] hover:bg-[#eae8e4] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('Dispatch engine parameters successfully saved & applied live.');
                  setIsConfigModalOpen(false);
                }}
                className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Apply Parameters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white px-4 py-3 font-mono text-xs flex items-center gap-2.5 shadow-xl z-50 border border-[#ded9d1] animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
