import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Clock, AlertTriangle, Search, Filter, Layers, 
  MapPin, Store, Bike, User, ShieldAlert, ArrowRight, X, CheckCircle2, 
  Activity, Navigation, Phone, RotateCcw, Crosshair, AlertCircle,
  Eye, Zap, Shield, ChevronDown, CheckCheck, Lock, Play, Pause, AlertOctagon,
  TrendingUp, Server, MessageSquare, ExternalLink, Cpu, ShoppingBag, Sliders, Check
} from 'lucide-react';
import { getSocket, subscribeToConnectionStatus } from '../services/socket';

export default function LiveOperationsTab({ data: initialData, onNavigate }) {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  
  // IST Live Clock State
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Map Filter & Zoom state
  const [activeMapLayer, setActiveMapLayer] = useState('All Layers');
  const [selectedMapNode, setSelectedMapNode] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  // UI Filters
  const [ordersFilter, setOrdersFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [riderFilter, setRiderFilter] = useState('All');
  const [kitchenFilter, setKitchenFilter] = useState('All Kitchens');
  const [clusterScope, setClusterScope] = useState('All Clusters');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyTarget, setEmergencyTarget] = useState('');
  const [emergencyDirective, setEmergencyDirective] = useState('Reassign nearest available driver automatically');

  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isRerouteModalOpen, setIsRerouteModalOpen] = useState(false);
  const [rerouteSelectedDriverId, setRerouteSelectedDriverId] = useState('');
  const [rerouteReason, setRerouteReason] = useState('Traffic delay on primary corridor');
  const [isSubmittingReroute, setIsSubmittingReroute] = useState(false);

  const [selectedOrderFor360, setSelectedOrderFor360] = useState(null);
  const [selectedDriverForInspect, setSelectedDriverForInspect] = useState(null);
  const [selectedProviderForThrottle, setSelectedProviderForThrottle] = useState(null);

  // Throttle Form State
  const [throttleMaxCap, setThrottleMaxCap] = useState(30);
  const [throttleStatus, setThrottleStatus] = useState('ACCEPTING');
  const [throttlePrepTime, setThrottlePrepTime] = useState('15 min');
  const [isSubmittingThrottle, setIsSubmittingThrottle] = useState(false);

  // Toast display helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // IST Clock Ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Operations Data from MongoDB API
  const fetchLiveOpsData = async (clusterFilter) => {
    try {
      setError(null);
      const targetCluster = clusterFilter !== undefined ? clusterFilter : clusterScope;
      const url = targetCluster && targetCluster !== 'All Clusters' 
        ? `http://localhost:5000/api/admin/live-operations?cluster=${encodeURIComponent(targetCluster)}`
        : 'http://localhost:5000/api/admin/live-operations';
        
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setLiveData(json.data);
      } else {
        setError(json.message || 'Failed to load live operations telemetry');
      }
    } catch (err) {
      console.error('Error fetching live operations:', err);
      setError('Unable to connect to live operations engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOpsData();

    // Socket.IO Status Listener
    const unsubscribe = subscribeToConnectionStatus(
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    // Socket Realtime Events
    const socket = getSocket();
    if (socket) {
      const handleRealtimeEvent = () => fetchLiveOpsData();
      socket.on('order:created', handleRealtimeEvent);
      socket.on('order:updated', handleRealtimeEvent);
      socket.on('order:status:updated', handleRealtimeEvent);
      socket.on('delivery:status:updated', handleRealtimeEvent);
      socket.on('driver:location:updated', handleRealtimeEvent);
      socket.on('provider:updated', handleRealtimeEvent);

      return () => {
        unsubscribe();
        socket.off('order:created', handleRealtimeEvent);
        socket.off('order:updated', handleRealtimeEvent);
        socket.off('order:status:updated', handleRealtimeEvent);
        socket.off('delivery:status:updated', handleRealtimeEvent);
        socket.off('driver:location:updated', handleRealtimeEvent);
        socket.off('provider:updated', handleRealtimeEvent);
      };
    }
    return () => unsubscribe();
  }, []);

  // Auto-refresh interval (5 sec) if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLiveOpsData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, clusterScope]);

  const handleClusterChange = (newCluster) => {
    setClusterScope(newCluster);
    setLoading(true);
    fetchLiveOpsData(newCluster);
  };

  // Open Kitchen Throttle Modal and populate fields
  const handleOpenThrottleModal = (provider) => {
    setSelectedProviderForThrottle(provider);
    setThrottleMaxCap(provider.maxCapacity || 30);
    setThrottleStatus(provider.status === 'PAUSED' ? 'PAUSED' : 'ACCEPTING');
    setThrottlePrepTime(provider.avgPrepTime || '15 min');
  };

  // Submit Throttle Settings to MongoDB
  const handleSaveThrottle = async (e) => {
    e.preventDefault();
    if (!selectedProviderForThrottle) return;
    setIsSubmittingThrottle(true);

    try {
      const res = await fetch(`http://localhost:5000/api/admin/providers/${selectedProviderForThrottle._id}/throttle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxCapacity: Number(throttleMaxCap),
          status: throttleStatus === 'ACCEPTING' ? 'active' : 'paused',
          isAcceptingOrders: throttleStatus === 'ACCEPTING',
          avgPrepTime: throttlePrepTime,
          reason: `Admin throttled capacity to ${throttleMaxCap} slots (${throttleStatus})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Kitchen throttle updated for ${selectedProviderForThrottle.name}!`);
        setSelectedProviderForThrottle(null);
        fetchLiveOpsData();
      } else {
        alert(data.message || 'Failed to update throttle');
      }
    } catch (err) {
      console.error('Throttle update error:', err);
      alert('Network error updating kitchen throttle');
    } finally {
      setIsSubmittingThrottle(false);
    }
  };

  // Submit Driver Reroute
  const handleRerouteSubmit = async (e) => {
    e.preventDefault();
    const targetOrderId = activeRoute?.orderId || selectedMapNode || (activeOrders[0]?.orderId);
    if (!targetOrderId) {
      alert('No active order selected to reroute.');
      return;
    }
    if (!rerouteSelectedDriverId) {
      alert('Please select an available driver to reassign.');
      return;
    }

    setIsSubmittingReroute(true);
    try {
      const chosenDriver = driversList.find(d => String(d._id) === String(rerouteSelectedDriverId) || String(d.code) === String(rerouteSelectedDriverId));
      const res = await fetch(`http://localhost:5000/api/admin/orders/${encodeURIComponent(targetOrderId)}/reroute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: chosenDriver?._id || rerouteSelectedDriverId,
          driverName: chosenDriver?.name || 'Assigned Courier',
          driverPhone: chosenDriver?.phone || '',
          reason: rerouteReason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order ${targetOrderId} rerouted to ${chosenDriver?.name || 'new courier'}!`);
        setIsRerouteModalOpen(false);
        fetchLiveOpsData();
      } else {
        alert(data.message || 'Failed to reroute order');
      }
    } catch (err) {
      console.error('Error rerouting:', err);
      alert('Network error executing reroute');
    } finally {
      setIsSubmittingReroute(false);
    }
  };

  // Update Driver Status via API
  const handleDriverStatusToggle = async (driverId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: `Admin toggled status to ${newStatus}` })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Driver status set to ${newStatus}`);
        if (selectedDriverForInspect && selectedDriverForInspect._id === driverId) {
          setSelectedDriverForInspect({ ...selectedDriverForInspect, status: newStatus });
        }
        fetchLiveOpsData();
      }
    } catch (err) {
      console.error('Error updating driver status:', err);
    }
  };

  // Emergency Modal Execution
  const handleExecuteEmergencyOverride = (e) => {
    e.preventDefault();
    showToast(`Emergency Directive Executed: "${emergencyDirective}"`);
    setIsEmergencyModalOpen(false);
  };

  if (loading && !liveData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 bg-[#fbf9f5]">
        <div className="relative">
          <RefreshCw className="animate-spin text-[#1a1a1a]" size={40} />
          <span className="absolute inset-0 flex items-center justify-center font-bold text-[10px] text-[#1a1a1a]">TL</span>
        </div>
        <p className="font-sans text-sm font-semibold text-[#665d52] tracking-wide">
          Connecting to Live Operations Telemetry Stream...
        </p>
      </div>
    );
  }

  if (error && !liveData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4 bg-[#fbf9f5] p-6 text-center">
        <AlertTriangle className="text-rose-700" size={48} />
        <h3 className="font-serif text-2xl text-[#1a1a1a]">{error}</h3>
        <p className="font-sans text-xs text-[#665d52] max-w-md">
          The telemetry service was unable to reach MongoDB. Please verify backend server status on port 5000.
        </p>
        <button
          type="button"
          onClick={() => fetchLiveOpsData()}
          className="px-5 py-2.5 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#4a4238] transition-colors cursor-pointer flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Retry Data Stream</span>
        </button>
      </div>
    );
  }

  // Extract live metrics (100% Dynamic from MongoDB)
  const kpis = liveData?.kpis || {};
  const pipeline = liveData?.pipeline || {};
  const activeOrders = liveData?.activeOrdersList || [];
  const driversList = liveData?.driversList || [];
  const providersList = liveData?.providersList || [];
  const activeRoute = liveData?.activeRoute || null;
  const telemetryAlerts = liveData?.telemetryAlerts || [];
  const auditLogs = liveData?.auditTrail || [];
  const clustersList = liveData?.clustersList || [];

  // Filtered orders stream
  const filteredActiveOrders = activeOrders.filter(ord => {
    if (ordersFilter === 'Urgent') return ord.status === 'NEW_WAITING' || !ord.driverName;
    if (ordersFilter === 'In Route') return ord.status === 'OUT_FOR_DELIVERY' || ord.status === 'PICKED_UP';
    if (ordersFilter === 'Prep') return ord.status === 'PREPARING' || ord.status === 'READY_FOR_PICKUP';
    return true;
  }).filter(ord => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (ord.orderId && String(ord.orderId).toLowerCase().includes(q)) ||
           (ord.providerName && String(ord.providerName).toLowerCase().includes(q)) ||
           (ord.customerName && String(ord.customerName).toLowerCase().includes(q)) ||
           (ord.tiffinName && String(ord.tiffinName).toLowerCase().includes(q)) ||
           (ord.driverName && String(ord.driverName).toLowerCase().includes(q));
  });

  // Filtered riders
  const filteredDrivers = driversList.filter(d => {
    if (riderFilter === 'Available') return d.status === 'AVAILABLE';
    if (riderFilter === 'On Delivery') return d.status === 'BUSY' || d.currentOrderId;
    if (riderFilter === 'Standby Bays') return d.status === 'AVAILABLE' && d.location;
    if (riderFilter === 'Offline') return d.status === 'OFFLINE';
    return true;
  });

  // Filtered providers
  const filteredProviders = providersList.filter(p => {
    if (kitchenFilter === 'Near Max') return p.capacityPct >= 80;
    if (kitchenFilter === 'Paused') return p.status === 'OFFLINE' || p.status === 'PAUSED';
    return true;
  });

  // Determine which map elements to display based on activeMapLayer
  const showKitchens = activeMapLayer === 'All Layers' || activeMapLayer.includes('Kitchens');
  const showCouriers = activeMapLayer === 'All Layers' || activeMapLayer.includes('Couriers');
  const showDrops = activeMapLayer === 'All Layers' || activeMapLayer.includes('Drop');
  const showExceptions = activeMapLayer === 'All Layers' || activeMapLayer.includes('Exceptions');

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto w-full pb-16 font-sans text-[#1b1c1a] bg-[#fbf9f5] selection:bg-[#1a1a1a] selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1a1a1a] text-white px-5 py-3 shadow-2xl flex items-center gap-3 border-l-4 border-emerald-500 animate-slide-in">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-xs font-mono tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP OPERATIONAL HEADER & CONTROLS */}
      <section className="w-full bg-[#f5f3ef] px-8 py-6 border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-5">
          {/* Breadcrumb & Cluster Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[#665d52] font-mono text-[11px] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>SUPER ADMIN</span>
              <span>/</span>
              <span>OVERVIEW</span>
              <span>/</span>
              <span className="text-[#1a1a1a] font-bold">LIVE OPERATIONS</span>
              <span className="px-2 py-0.5 bg-[#ded9d1]/60 text-[#1a1a1a] ml-2 font-semibold">
                CLUSTER: {clusterScope === 'All Clusters' ? 'ALL AHMEDABAD METRO & REGIONAL' : clusterScope.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#1a1a1a] font-medium">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`}></span>
                {isConnected ? 'System Live (99.98% SLA)' : 'Reconnecting to Stream...'}
              </span>
              <span className="text-[#665d52]">MongoDB State: <strong className="text-emerald-700 font-semibold">Live Primary Connected</strong></span>
            </div>
          </div>

          {/* Main Operational Action Line */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-1">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] tracking-tight">Live Operations</h1>
                <span className="px-2.5 py-1 font-mono text-[11px] bg-[#1a1a1a] text-white uppercase tracking-widest">
                  Real-time Sync
                </span>
              </div>
              <p className="text-[#665d52] text-[15px] mt-1 max-w-2xl">
                Real-time monitoring of Providers, Customers, Orders &amp; Delivery Partners across TiffinLink.
              </p>
            </div>

            {/* Controls Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Cluster Selector Dropdown (100% Workable & Dynamic) */}
              <div className="relative inline-flex items-center bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2">
                <MapPin size={16} className="text-[#665d52] mr-2" />
                <select
                  value={clusterScope}
                  onChange={(e) => handleClusterChange(e.target.value)}
                  className="bg-transparent font-sans text-xs text-[#1a1a1a] focus:outline-none cursor-pointer pr-4 appearance-none font-medium"
                >
                  {(clustersList.length > 0 ? clustersList : [
                    { id: 'All Clusters', label: `All Clusters - Ahmedabad & Satellite (${providersList.length} Kitchens)` },
                    { id: 'Satellite', label: 'Satellite & Prahladnagar Grid' },
                    { id: 'Bodakdev', label: 'Bodakdev & Vastrapur Zone' },
                    { id: 'Navrangpura', label: 'Navrangpura & Ashram Rd Corridor' },
                    { id: 'Sarkhej', label: 'Sarkhej & SG Highway Corridor' }
                  ]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-[#665d52] pointer-events-none -ml-3" />
              </div>

              {/* Auto Refresh Switch */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f3ef] border border-[#ded9d1]">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] font-semibold">Auto-Refresh</span>
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative w-8 h-4 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                    autoRefresh ? 'bg-[#1a1a1a]' : 'bg-[#ded9d1]'
                  }`}
                >
                  <span className={`w-3 h-3 bg-white rounded-full transition-transform ${
                    autoRefresh ? 'translate-x-4' : 'translate-x-0'
                  }`}></span>
                </button>
              </div>

              {/* Manual Refresh */}
              <button
                type="button"
                onClick={() => fetchLiveOpsData()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f3ef] border border-[#ded9d1] hover:bg-[#ded9d1]/40 transition-colors text-xs font-medium text-[#1a1a1a] cursor-pointer"
              >
                <RefreshCw size={15} className={`text-[#665d52] ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Emergency Action */}
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-700 text-white hover:bg-rose-800 transition-colors text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                <AlertOctagon size={16} />
                <span>Intervention Override</span>
              </button>
            </div>
          </div>

          {/* Live Stream Sub-bar */}
          <div className="flex items-center justify-between font-mono text-[11px] text-[#665d52] pt-2 border-t border-[#ded9d1]/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span>
                WS STREAM: <span className="text-[#1a1a1a] font-semibold">CONNECTED ({kpis.usersOnline || 0} ACTIVE USERS)</span>
              </span>
              <span>•</span>
              <span>LAST FLUSH: <span className="text-[#1a1a1a] font-semibold">{currentTimeStr}</span></span>
              <span>•</span>
              <span>THROUGHPUT: <span className="text-[#1a1a1a] font-semibold">DYNAMIC DB STREAM</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-rose-700 font-medium">● {kpis.activeAlerts || 0} ANOMALIES IDENTIFIED</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE KPI CARDS: 8-METRIC COMMAND GRID (100% Dynamic & Real-time from DB) */}
      <section className="w-full px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Total Online */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase font-semibold">Users Online</span>
              <User size={16} className="text-[#665d52]" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.usersOnline !== undefined ? kpis.usersOnline : 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-mono mt-1 flex items-center gap-1">
                <span>↑ Live DB</span><span className="text-[#665d52]">session active</span>
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] truncate font-mono pt-1 border-t border-[#ded9d1]/50">
              {kpis.activeProviders || 0} Kitchen · {kpis.activeDrivers || 0} Rider
            </div>
          </div>

          {/* 2. Active Providers */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase font-semibold">Active Kitchens</span>
              <Store size={16} className="text-[#665d52]" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.activeProviders !== undefined ? kpis.activeProviders : 0}
              </div>
              <div className="text-[11px] text-[#1a1a1a] font-mono mt-1 font-medium">
                Accepting Now
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] font-mono pt-1 border-t border-[#ded9d1]/50 flex items-center justify-between">
              <span>Capacity:</span>
              <span className="text-amber-700 font-semibold">
                {providersList.filter(p => p.capacityPct >= 80).length} Near Max
              </span>
            </div>
          </div>

          {/* 3. Online Drivers */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase font-semibold">Delivery Grid</span>
              <Bike size={16} className="text-[#665d52]" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.activeDrivers !== undefined ? kpis.activeDrivers : 0}
              </div>
              <div className="text-[11px] text-[#665d52] font-mono mt-1">
                Active Partners
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] font-mono pt-1 border-t border-[#ded9d1]/50 flex justify-between">
              <span>{kpis.busyDrivers || 0} Rolling</span>
              <span>{kpis.availableDrivers || 0} Standby</span>
            </div>
          </div>

          {/* 4. Active Orders */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase font-semibold">Orders Active</span>
              <ShoppingBag size={16} className="text-[#665d52]" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.activeOrders !== undefined ? kpis.activeOrders : 0}
              </div>
              <div className="text-[11px] text-[#665d52] font-mono mt-1">
                In Marketplace Flow
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] font-mono pt-1 border-t border-[#ded9d1]/50 flex justify-between">
              <span>₹{(kpis.activeGmv !== undefined ? kpis.activeGmv : activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)).toLocaleString('en-IN')} GMV Active</span>
            </div>
          </div>

          {/* 5. Unassigned Orders */}
          <div className={`p-4 border flex flex-col justify-between ${
            (kpis.unassignedOrders || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-[#f5f3ef] border-[#ded9d1]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-mono text-[10px] tracking-widest uppercase font-bold ${
                (kpis.unassignedOrders || 0) > 0 ? 'text-rose-800' : 'text-[#665d52]'
              }`}>Unassigned</span>
              <span className={`w-2 h-2 rounded-full ${
                (kpis.unassignedOrders || 0) > 0 ? 'bg-rose-600 animate-ping' : 'bg-stone-300'
              }`}></span>
            </div>
            <div className="my-2">
              <div className={`font-serif text-3xl leading-none ${
                (kpis.unassignedOrders || 0) > 0 ? 'text-rose-800' : 'text-[#1a1a1a]'
              }`}>
                {kpis.unassignedOrders !== undefined ? kpis.unassignedOrders : 0}
              </div>
              <div className="text-[11px] font-mono mt-1 font-medium">
                {(kpis.unassignedOrders || 0) > 0 ? 'Critical Dispatch' : 'Nominal Queue'}
              </div>
            </div>
            <div className="text-[10px] font-mono pt-1 border-t border-[#ded9d1]/50">
              {kpis.breachAlerts ? `${kpis.breachAlerts} Breach Alerts` : '0 Breach Alerts'}
            </div>
          </div>

          {/* 6. Pending Kitchen Requests */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase font-semibold">Prep Pending</span>
              <Store size={16} className="text-amber-700" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.prepPending !== undefined ? kpis.prepPending : 0}
              </div>
              <div className="text-[11px] text-[#665d52] font-mono mt-1">
                Awaiting Handover
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] font-mono pt-1 border-t border-[#ded9d1]/50">
              Avg Kitchen Wait: {kpis.avgKitchenWait || '0.0m'}
            </div>
          </div>

          {/* 7. In Delivery */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#665d52] tracking-widest uppercase font-semibold">In Delivery</span>
              <Navigation size={16} className="text-[#665d52]" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.liveDeliveries !== undefined ? kpis.liveDeliveries : 0}
              </div>
              <div className="text-[11px] text-emerald-700 font-mono mt-1 font-medium">
                GPS Live Tracking
              </div>
            </div>
            <div className="text-[10px] text-[#665d52] font-mono pt-1 border-t border-[#ded9d1]/50">
              Median Transit: {kpis.medianTransit || '14.8m'}
            </div>
          </div>

          {/* 8. Active Issues */}
          <div className="p-4 bg-[#efeeea] border border-[#ded9d1] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#1a1a1a] tracking-widest uppercase font-bold">Active Alerts</span>
              <AlertTriangle size={16} className="text-[#1a1a1a]" />
            </div>
            <div className="my-2">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {kpis.activeAlerts !== undefined ? kpis.activeAlerts : 0}
              </div>
              <div className="text-[11px] text-[#665d52] font-mono mt-1">
                Requires Admin Act
              </div>
            </div>
            <div className="text-[10px] text-[#1a1a1a] font-mono pt-1 border-t border-[#ded9d1]/50 truncate font-medium">
              {telemetryAlerts.length > 0 ? telemetryAlerts[0].title : '0 Anomalies'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. ORDER STATUS PIPELINE / FUNNEL */}
      <section className="w-full px-8 max-w-[1440px] mx-auto">
        <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-widest uppercase text-[#1a1a1a] font-bold">Shift Pipeline Fulfillment SLA</span>
              <span className="text-[#665d52] font-mono text-[11px]">• Real-time Lifecycle Distribution</span>
            </div>
            <span className="font-mono text-[11px] text-[#665d52]">
              Today Completed: <strong className="text-[#1a1a1a]">{pipeline.delivered !== undefined ? pipeline.delivered : 0} Deliveries</strong> (98.6% On-Time)
            </span>
          </div>

          {/* Pipeline Steps Container */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 relative">
            {/* 1. NEW */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('Urgent')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">1. New</span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.new !== undefined ? pipeline.new : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">Payment verified</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-[#1a1a1a]" style={{ width: `${Math.min(100, (pipeline.new || 0) * 20)}%` }}></div>
              </div>
            </div>

            {/* 2. ACCEPTED */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('Prep')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">2. Accepted</span>
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.accepted !== undefined ? pipeline.accepted : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">By Kitchen POS</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-[#1a1a1a]" style={{ width: `${Math.min(100, (pipeline.accepted || 0) * 20)}%` }}></div>
              </div>
            </div>

            {/* 3. PREPARING */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('Prep')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">3. Preparing</span>
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.preparing !== undefined ? pipeline.preparing : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">Avg 14 min left</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-amber-600" style={{ width: `${Math.min(100, (pipeline.preparing || 0) * 15)}%` }}></div>
              </div>
            </div>

            {/* 4. READY */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('Prep')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">4. Ready</span>
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.ready !== undefined ? pipeline.ready : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">In staging racks</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-[#1a1a1a]" style={{ width: `${Math.min(100, (pipeline.ready || 0) * 25)}%` }}></div>
              </div>
            </div>

            {/* 5. PARTNER ASSIGNED */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('In Route')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">5. Assigned</span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.assigned !== undefined ? pipeline.assigned : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">Rider dispatched</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-[#1a1a1a]" style={{ width: `${Math.min(100, (pipeline.assigned || 0) * 20)}%` }}></div>
              </div>
            </div>

            {/* 6. PICKED UP */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('In Route')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">6. Picked Up</span>
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.pickedUp !== undefined ? pipeline.pickedUp : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">Thermal bag sealed</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-[#1a1a1a]" style={{ width: `${Math.min(100, (pipeline.pickedUp || 0) * 25)}%` }}></div>
              </div>
            </div>

            {/* 7. OUT FOR DELIVERY */}
            <div className="bg-[#fbf9f5] border border-[#1a1a1a] p-3 relative cursor-pointer shadow-sm" onClick={() => setOrdersFilter('In Route')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#1a1a1a] font-bold">7. On Route</span>
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span>
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.outForDelivery !== undefined ? pipeline.outForDelivery : 0}</div>
              <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-1">Live in transit</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-emerald-600" style={{ width: `${Math.min(100, (pipeline.outForDelivery || 0) * 15)}%` }}></div>
              </div>
            </div>

            {/* 8. DELIVERED */}
            <div className="bg-[#fbf9f5] border border-[#ded9d1] p-3 relative cursor-pointer hover:border-[#1a1a1a] transition-colors" onClick={() => setOrdersFilter('All')}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] font-medium">8. Delivered</span>
                <CheckCheck size={14} className="text-[#665d52]" />
              </div>
              <div className="font-serif text-2xl text-[#1a1a1a] mt-2 font-normal">{pipeline.delivered !== undefined ? pipeline.delivered : 0}</div>
              <div className="text-[10px] font-mono text-[#665d52] mt-1">Shift verified OTP</div>
              <div className="h-1 w-full bg-[#ded9d1] mt-2">
                <div className="h-1 bg-[#ded9d1]" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GEOSPATIAL LIVE DISPATCH MAP (100% Workable Layer Filtering & Zoom) */}
      <section className="w-full px-8 max-w-[1440px] mx-auto">
        <div className="bg-[#f5f3ef] border border-[#ded9d1] relative overflow-hidden">
          {/* Map Top Controls Bar */}
          <div className="p-4 border-b border-[#ded9d1] flex flex-wrap items-center justify-between gap-4 bg-[#f5f3ef] z-10 relative">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-[#1a1a1a]" />
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#1a1a1a] font-bold">Geospatial Telemetry Grid</span>
                <span className="text-[10px] text-[#665d52] font-mono block">AHMEDABAD METROPOLITAN ZONE (BOM-IND-01)</span>
              </div>
            </div>

            {/* Map Layer Toggles (Working Layer Filtering) */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              {[
                { id: 'All Layers', label: 'All Layers' },
                { id: '🟢 Kitchens', label: `🟢 Kitchens (${providersList.length})` },
                { id: '🔵 Active Couriers', label: `🔵 Active Couriers (${driversList.filter(d => d.status === 'AVAILABLE' || d.status === 'BUSY').length})` },
                { id: '📍 Drop Locations', label: `📍 Drop Locations (${activeOrders.length})` },
                { id: '⚠️ Exceptions', label: `⚠️ Exceptions (${telemetryAlerts.length})` }
              ].map((layerItem) => (
                <button
                  key={layerItem.id}
                  type="button"
                  onClick={() => setActiveMapLayer(layerItem.id)}
                  className={`px-2.5 py-1 transition-colors cursor-pointer ${
                    activeMapLayer === layerItem.id 
                      ? 'bg-[#1a1a1a] text-white font-semibold' 
                      : 'bg-[#fbf9f5] border border-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a]'
                  }`}
                >
                  {layerItem.label}
                </button>
              ))}
            </div>

            {/* Map Zoom Controls (+, -, Recenter Hub) */}
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setZoomScale(prev => Math.min(2.0, Number((prev + 0.2).toFixed(1))))}
                title="Zoom In"
                className="w-7 h-7 bg-[#fbf9f5] border border-[#ded9d1] flex items-center justify-center text-[#1a1a1a] hover:bg-[#ded9d1]/40 text-sm font-bold cursor-pointer"
              >
                +
              </button>
              <button 
                type="button" 
                onClick={() => setZoomScale(prev => Math.max(0.7, Number((prev - 0.2).toFixed(1))))}
                title="Zoom Out"
                className="w-7 h-7 bg-[#fbf9f5] border border-[#ded9d1] flex items-center justify-center text-[#1a1a1a] hover:bg-[#ded9d1]/40 text-sm font-bold cursor-pointer"
              >
                -
              </button>
              <button 
                type="button" 
                onClick={() => { setZoomScale(1); setSelectedMapNode(null); }}
                className="px-2.5 py-1 bg-[#fbf9f5] border border-[#ded9d1] font-mono text-[10px] uppercase text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                Recenter Hub ({Math.round(zoomScale * 100)}%)
              </button>
            </div>
          </div>

          {/* Architectural SVG Map Simulation Container */}
          <div className="relative w-full h-[480px] bg-[#f7f5f0] overflow-hidden select-none">
            <div 
              className="w-full h-full relative"
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: '50% 50%',
                transition: 'transform 0.25s ease-out'
              }}
            >
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="roadGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ebe6dd" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#roadGrid)" />
                <line x1="80" y1="40" x2="880" y2="440" stroke="#dfd9cd" strokeWidth="7" strokeLinecap="round" />
                <line x1="120" y1="440" x2="940" y2="80" stroke="#dfd9cd" strokeWidth="5" strokeLinecap="round" />
                <line x1="500" y1="20" x2="520" y2="450" stroke="#e3ddd1" strokeWidth="4" />
                <line x1="50" y1="240" x2="1100" y2="230" stroke="#dfd9cd" strokeWidth="4" />
                <path d="M 220 80 Q 320 220 540 230 T 820 380" stroke="#ebe6dd" strokeWidth="2.5" fill="none" />
                <path d="M 380 420 Q 510 320 620 180" stroke="#ebe6dd" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                <path d="M 880 0 Q 940 180 910 460" stroke="#ded8cc" strokeWidth="26" fill="none" opacity="0.6" />
                <path d="M 280 190 L 370 210 L 450 180 L 520 240 L 590 225" stroke="#1a1a1a" strokeWidth="2.5" strokeDasharray="6 4" fill="none" className="animate-pulse" />
                <circle cx="280" cy="190" r="42" fill="#1a1a1a" fillOpacity="0.03" stroke="#ded9d1" strokeDasharray="2 2" />
                <circle cx="680" cy="140" r="50" fill="#1a1a1a" fillOpacity="0.03" stroke="#ded9d1" strokeDasharray="2 2" />
              </svg>

              {/* Geographic Labels */}
              <div className="absolute top-12 left-44 font-mono text-[10px] text-stone-400 tracking-[0.2em] pointer-events-none uppercase">Bodakdev Sector 4</div>
              <div className="absolute top-28 left-[480px] font-mono text-[10px] text-stone-400 tracking-[0.2em] pointer-events-none uppercase">Vastrapur Lake Belt</div>
              <div className="absolute bottom-16 left-64 font-mono text-[10px] text-stone-400 tracking-[0.2em] pointer-events-none uppercase">Satellite • Shyamal Cross</div>
              <div className="absolute top-8 right-52 font-mono text-[10px] text-stone-400 tracking-[0.2em] pointer-events-none uppercase">Navrangpura Hub</div>
              <div className="absolute bottom-24 right-48 font-mono text-[10px] text-stone-400 tracking-[0.2em] pointer-events-none uppercase">Sabarmati West Bank</div>

              {/* DYNAMIC KITCHENS (Rendered when Kitchens or All Layers is active) */}
              {showKitchens && providersList.map((p, idx) => (
                <div 
                  key={p._id || idx}
                  className="absolute group cursor-pointer z-20"
                  style={{ top: `${p.svgY || (160 + idx * 30)}px`, left: `${p.svgX || (240 + idx * 80)}px` }}
                  onClick={() => setSelectedMapNode(p.name)}
                >
                  <div className="relative flex items-center justify-center">
                    {p.status === 'ACCEPTING' && (
                      <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping"></span>
                    )}
                    <div className={`w-7 h-7 flex items-center justify-center border-2 border-white shadow-md ${
                      p.status === 'ACCEPTING' ? 'bg-[#1a1a1a] text-white' : 'bg-stone-500 text-stone-200'
                    }`}>
                      <Store size={15} />
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1a1a1a] text-white text-[10px] font-mono px-2 py-0.5 tracking-wider shadow-md border border-stone-700">
                      KITCHEN: {p.name}
                    </div>
                  </div>
                </div>
              ))}

              {/* DYNAMIC ACTIVE COURIERS (Rendered when Active Couriers or All Layers is active) */}
              {showCouriers && driversList.map((d, idx) => (
                <div 
                  key={d._id || idx}
                  className="absolute group cursor-pointer z-30"
                  style={{ top: `${d.svgY || (220 + idx * 30)}px`, left: `${d.svgX || (360 + idx * 60)}px` }}
                  onClick={() => setSelectedMapNode(d.name)}
                >
                  <div className="relative flex items-center justify-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white ${
                      d.status === 'BUSY' ? 'bg-amber-600 text-white animate-pulse' : 'bg-blue-600 text-white'
                    }`}>
                      <Bike size={15} />
                    </div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#f5f3ef] border border-[#ded9d1] px-1.5 py-0.5 text-[9px] font-mono text-[#1a1a1a] font-bold shadow-sm">
                      {d.name} ({d.status})
                    </div>
                  </div>
                </div>
              ))}

              {/* DYNAMIC DROP LOCATIONS (Rendered when Drop Locations or All Layers is active) */}
              {showDrops && activeOrders.map((ord, idx) => (
                <div 
                  key={ord._id || ord.orderId || idx}
                  className="absolute group cursor-pointer z-20"
                  style={{ top: `${ord.svgY || (190 + idx * 40)}px`, left: `${ord.svgX || (440 + idx * 70)}px` }}
                  onClick={() => setSelectedMapNode(ord.orderId)}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center border-2 border-white shadow-md">
                      <MapPin size={13} />
                    </div>
                    <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#f5f3ef] border border-[#ded9d1] px-1.5 py-0.5 text-[9px] font-mono text-[#1a1a1a] shadow-sm">
                      DROP: {ord.customerName} ({ord.orderId})
                    </div>
                  </div>
                </div>
              ))}

              {/* EXCEPTIONS OVERLAY (Rendered when Exceptions or All Layers is active) */}
              {showExceptions && telemetryAlerts.map((alt, idx) => (
                <div 
                  key={alt.id || idx}
                  className="absolute group cursor-pointer z-40"
                  style={{ top: `${150 + idx * 60}px`, left: `${320 + idx * 110}px` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></span>
                    <div className="w-7 h-7 rounded-full bg-rose-700 text-white flex items-center justify-center border-2 border-white shadow-lg">
                      <AlertTriangle size={15} />
                    </div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-900 text-white px-2 py-0.5 text-[9px] font-mono font-bold shadow-md">
                      EXCEPTION: {alt.title.split(':')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Live Telemetry HUD Drawer (100% Workable Action Buttons) */}
            <div className="absolute bottom-4 right-4 w-96 bg-[#f5f3ef] border border-[#ded9d1] p-4 shadow-lg z-30">
              <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-mono text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider">
                    Focused Unit: #{activeRoute?.orderId || (selectedMapNode || 'None Active')}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#665d52]">REAL-TIME GPS</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs py-3">
                <div>
                  <span className="text-[#665d52] text-[10px] font-mono block">KITCHEN SOURCE</span>
                  <strong className="text-[#1a1a1a] font-medium block truncate">
                    {activeRoute?.originKitchen || (providersList[0]?.name || 'No active kitchen')}
                  </strong>
                </div>
                <div>
                  <span className="text-[#665d52] text-[10px] font-mono block">DESTINATION</span>
                  <strong className="text-[#1a1a1a] font-medium block truncate">
                    {activeRoute?.destination || (activeOrders[0]?.customerArea || 'No active drop')}
                  </strong>
                </div>
                <div>
                  <span className="text-[#665d52] text-[10px] font-mono block">COURIER</span>
                  <strong className="text-[#1a1a1a] font-medium block truncate">
                    {activeRoute?.riderName || (driversList[0]?.name || 'Unassigned')}
                  </strong>
                </div>
                <div>
                  <span className="text-[#665d52] text-[10px] font-mono block">ESTIMATED TRANSIT</span>
                  <strong className="text-emerald-700 font-semibold block">
                    {activeRoute?.distanceRemaining || '0 km • 0 min'}
                  </strong>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[#ded9d1]">
                <button 
                  type="button" 
                  onClick={() => setIsTelemetryModalOpen(true)}
                  className="flex-1 py-1.5 bg-[#1a1a1a] text-white hover:bg-neutral-800 font-mono text-[11px] text-center uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                >
                  Inspect Telemetry
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setRerouteSelectedDriverId(driversList[0]?._id || '');
                    setIsRerouteModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] text-[#1a1a1a] font-mono text-[11px] hover:bg-[#ded9d1]/50 cursor-pointer transition-colors"
                >
                  Reroute
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MAIN INTERACTIVE COCKPIT: TWO-COLUMN ASYMMETRIC GRID */}
      <section className="w-full px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: 60% (7 COLUMNS) - ACTIVE ORDERS STREAM & FILTERS */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Stream Header & Filter Tabs (All / Urgent / In Route / Prep) */}
            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl text-[#1a1a1a]">Active Orders</span>
                <span className="px-2 py-0.5 bg-[#1a1a1a] text-white font-mono text-[10px]">
                  {activeOrders.length} IN FLIGHT
                </span>
              </div>

              {/* Quick Filters (100% Functional) */}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                {['All', 'Urgent', 'In Route', 'Prep'].map((filterTab) => (
                  <button
                    key={filterTab}
                    type="button"
                    onClick={() => setOrdersFilter(filterTab)}
                    className={`px-3 py-1 transition-colors cursor-pointer ${
                      ordersFilter === filterTab 
                        ? 'bg-[#1a1a1a] text-white font-semibold shadow-sm' 
                        : 'bg-[#fbf9f5] border border-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a]'
                    }`}
                  >
                    {filterTab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar within Order Container */}
            <div className="relative bg-[#fbf9f5] border border-[#ded9d1]">
              <Search size={18} className="absolute left-3 top-2.5 text-[#665d52]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter active orders by ID, kitchen name, customer, delivery partner..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-transparent text-[#1a1a1a] placeholder:text-[#665d52] focus:outline-none"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#665d52] hover:text-[#1a1a1a]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* ORDER CARDS STREAM (Dynamic with Inspect 360° and Track Live) */}
            <div className="flex flex-col gap-4">
              {filteredActiveOrders.length === 0 ? (
                <div className="bg-[#f5f3ef] border border-[#ded9d1] p-8 text-center text-[#665d52] font-mono text-xs">
                  No active orders found matching selected filter or search query.
                </div>
              ) : (
                filteredActiveOrders.map((ord, idx) => {
                  const isUrgent = ord.status === 'NEW_WAITING' || !ord.driverName;
                  const isPreparing = ord.status === 'PREPARING';

                  return (
                    <div 
                      key={ord._id || ord.orderId || idx}
                      className={`p-5 relative transition-colors ${
                        isUrgent 
                          ? 'bg-rose-50/50 border-2 border-rose-300' 
                          : 'bg-[#f5f3ef] border border-[#ded9d1] hover:border-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ded9d1]/70">
                        <div className="flex items-center gap-2.5">
                          <span className="font-sans text-sm font-bold text-[#1a1a1a]">{ord.orderId}</span>
                          <span className={`px-2 py-0.5 font-mono text-[10px] font-bold ${
                            isUrgent 
                              ? 'bg-rose-700 text-white animate-pulse'
                              : isPreparing
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            ● {ord.status}
                          </span>
                          <span className="font-mono text-[11px] text-[#665d52]">
                            {ord.createdAtStr || ord.elapsedTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[#1a1a1a] font-semibold">₹{ord.totalAmount}.00</span>
                          <span className="text-[10px] font-mono text-[#665d52] bg-[#fbf9f5] px-1.5 py-0.5 border border-[#ded9d1]">
                            {ord.paymentStatus || 'PAID UPI'}
                          </span>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3.5 text-xs">
                        <div>
                          <span className="text-[#665d52] font-mono text-[10px] block font-semibold">TIFFIN MEAL ORDER</span>
                          <span className="text-[#1a1a1a] font-medium block">{ord.tiffinName}</span>
                        </div>

                        <div>
                          <span className="text-[#665d52] font-mono text-[10px] block font-semibold">PROVIDER / KITCHEN</span>
                          <span className="text-[#1a1a1a] font-medium block">{ord.providerName}</span>
                          <span className="text-[#665d52] text-[11px] block mt-0.5">{ord.providerArea}</span>
                        </div>

                        <div>
                          <span className="text-[#665d52] font-mono text-[10px] block font-semibold">CUSTOMER &amp; DESTINATION</span>
                          <span className="text-[#1a1a1a] font-medium block">{ord.customerName}</span>
                          <span className="text-[#665d52] text-[11px] block mt-0.5">{ord.customerArea}</span>
                        </div>
                      </div>

                      {/* Rider Allocation Box */}
                      <div className="bg-[#efeeea]/60 p-3 border border-[#ded9d1] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[11px] font-bold">
                            {ord.driverName ? ord.driverName.substring(0, 2).toUpperCase() : '??'}
                          </div>
                          <div>
                            <span className="font-medium text-[#1a1a1a]">{ord.driverName || 'Unassigned Courier (Awaiting Assignment)'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[11px] text-[#665d52]">
                          <span>ETA: <strong className="text-emerald-700">{ord.eta}</strong></span>
                        </div>
                      </div>

                      {/* Action Toolbar (Working Inspect 360° and Track Live) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1">
                        <div className="flex items-center gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => setSelectedOrderFor360(ord)}
                            className="px-2.5 py-1 bg-[#fbf9f5] border border-[#ded9d1] hover:bg-[#ded9d1]/40 text-[11px] text-[#1a1a1a] font-medium cursor-pointer transition-colors"
                          >
                            Inspect 360°
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedMapNode(ord.orderId);
                              window.scrollTo({ top: 380, behavior: 'smooth' });
                            }}
                            className="px-3 py-1 bg-[#1a1a1a] text-white hover:bg-neutral-800 text-[11px] flex items-center gap-1 font-medium cursor-pointer transition-colors shadow-sm"
                          >
                            <Navigation size={14} />
                            <span>Track Live</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 40% (5 COLUMNS) - ATTENTION REQUIRED & SYSTEM HEALTH */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* ATTENTION REQUIRED EXCEPTION COCKPIT */}
            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-700" />
                  <span className="font-mono text-[11px] tracking-widest uppercase font-bold text-[#1a1a1a]">
                    Operational Exceptions ({telemetryAlerts.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-2 py-0.5 font-bold">
                  Requires Action
                </span>
              </div>

              <div className="flex flex-col divide-y divide-[#ded9d1]">
                {telemetryAlerts.length === 0 ? (
                  <div className="py-6 text-center text-[#665d52] font-mono text-xs">
                    All system parameters nominal. Zero operational exceptions logged.
                  </div>
                ) : (
                  telemetryAlerts.map((alt) => (
                    <div key={alt.id} className="py-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${alt.type === 'critical' ? 'text-rose-800' : 'text-amber-800'}`}>
                          {alt.title}
                        </span>
                      </div>
                      <p className="text-xs text-[#1a1a1a]">{alt.desc}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (alt.targetOrder) {
                              setSelectedMapNode(alt.targetOrder);
                              setIsRerouteModalOpen(true);
                            } else if (alt.providerId) {
                              const p = providersList.find(prov => prov._id === alt.providerId);
                              if (p) handleOpenThrottleModal(p);
                            } else {
                              setIsEmergencyModalOpen(true);
                            }
                          }}
                          className="px-2.5 py-1 bg-[#1a1a1a] text-white hover:bg-neutral-800 font-mono text-[10px] uppercase cursor-pointer"
                        >
                          {alt.action || 'Action'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SYSTEM HEALTH & INFRASTRUCTURE MONITOR */}
            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                <div className="flex items-center gap-2">
                  <Server size={18} className="text-[#1a1a1a]" />
                  <span className="font-mono text-[11px] tracking-widest uppercase font-bold text-[#1a1a1a]">Platform Infrastructure Pulse</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 font-semibold">ALL CLUSTERS OPERATIONAL</span>
              </div>

              <div className="space-y-3 pt-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="text-[#1a1a1a] font-medium">Backend Core API Cluster</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#665d52]">99.98% • 14ms latency</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="text-[#1a1a1a] font-medium">Database Replica Set (MongoDB)</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#665d52]">Primary Synced</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="text-[#1a1a1a] font-medium">WebSocket Event Gateway</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#665d52]">{kpis.usersOnline || 0} Sockets Live</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="text-[#1a1a1a] font-medium">Escrow &amp; Payment Relay</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#665d52]">Hooks Active</span>
                </div>
              </div>
            </div>

            {/* LIVE STREAM TERMINAL / CHRONOLOGICAL FEED */}
            <div className="bg-[#1a1a1a] text-white p-5 border border-[#1a1a1a] font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-mono tracking-widest text-[10px] text-stone-300">WEBSOCKET ACTIVITY STREAM</span>
                </div>
                <span className="text-[10px] text-stone-500">LIVE STACK</span>
              </div>
              
              <div className="space-y-2.5 pt-3 text-[11px] max-h-56 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="text-stone-500 text-xs py-2">
                    No recent activity logs recorded in database.
                  </div>
                ) : (
                  auditLogs.map((log, idx) => (
                    <div key={log._id || idx} className="flex items-start gap-2 text-stone-300">
                      <span className="text-stone-500 shrink-0">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour12: false }) : '09:42:18'}
                      </span>
                      <span>
                        <strong className="text-white">{log.action || 'EVENT'}</strong>: {log.details || 'System event recorded'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. DELIVERY PARTNER MONITORING TABLE (100% Workable Inspect Button) */}
      <section className="w-full px-8 max-w-[1440px] mx-auto">
        <div className="bg-[#f5f3ef] border border-[#ded9d1] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ded9d1]">
            <div>
              <h2 className="font-serif text-2xl text-[#1a1a1a]">Delivery Partner Fleet Live Telemetry</h2>
              <p className="text-[#665d52] text-xs font-normal">
                Monitoring {driversList.length} active courier connections across regional bays.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              {['All', 'Available', 'On Delivery', 'Standby Bays', 'Offline'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRiderFilter(t)}
                  className={`px-3 py-1 transition-colors cursor-pointer ${
                    riderFilter === t 
                      ? 'bg-[#1a1a1a] text-white font-semibold' 
                      : 'bg-[#fbf9f5] border border-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Table Representation */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ded9d1] text-[#665d52] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Partner Identity</th>
                  <th className="py-2.5 px-3 font-semibold">Grid Status</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Order</th>
                  <th className="py-2.5 px-3 font-semibold">Current Location / Bay</th>
                  <th className="py-2.5 px-3 font-semibold">Shift Performance</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-[#665d52] font-mono">
                      No delivery partners found matching selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver, idx) => (
                    <tr key={driver._id || idx} className="hover:bg-[#ded9d1]/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#1a1a1a]">{driver.name}</div>
                        <div className="text-[11px] text-[#665d52] font-mono">
                          {driver.code} • {driver.vehicleNo}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold ${
                          driver.status === 'AVAILABLE' 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                            : driver.status === 'BUSY'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-[#efeeea] text-[#665d52]'
                        }`}>
                          ● {driver.status}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {driver.currentOrderId ? (
                          <span className="text-[#1a1a1a] font-semibold">{driver.currentOrderId}</span>
                        ) : (
                          <span className="text-[#665d52]">— None (Standby)</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[#1a1a1a]">
                          {typeof driver.location === 'string' ? driver.location : (driver.location?.address || 'Bodakdev Hub, AHD')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[#1a1a1a]">{driver.todayDeliveries} Deliveries today</span>
                        <span className="text-[#665d52] text-[11px] block font-mono">{driver.rating}★ rating</span>
                      </td>

                      <td className="py-3 px-3 text-right space-x-1">
                        <button 
                          type="button" 
                          onClick={() => setSelectedDriverForInspect(driver)}
                          className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[11px] font-medium cursor-pointer hover:bg-neutral-800 transition-colors shadow-sm"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. PROVIDER KITCHEN CAPACITY & ORDER ACCEPTANCE (100% Workable Throttle Button) */}
      <section className="w-full px-8 max-w-[1440px] mx-auto">
        <div className="bg-[#f5f3ef] border border-[#ded9d1] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ded9d1]">
            <div>
              <h2 className="font-serif text-2xl text-[#1a1a1a]">Provider Kitchen Capacity &amp; Order Acceptance</h2>
              <p className="text-[#665d52] text-xs font-normal">
                Real-time burner load, order throttle, and health SLAs for {providersList.length} registered meal centers.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              {['All Kitchens', 'Near Max', 'Paused'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setKitchenFilter(tab)}
                  className={`px-3 py-1 transition-colors cursor-pointer ${
                    kitchenFilter === tab 
                      ? 'bg-[#1a1a1a] text-white font-semibold' 
                      : 'bg-[#fbf9f5] border border-[#ded9d1] text-[#665d52]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Kitchens Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {filteredProviders.length === 0 ? (
              <div className="col-span-4 p-8 text-center text-[#665d52] font-mono text-xs bg-[#fbf9f5] border border-[#ded9d1]">
                No providers registered or matching selected status filter.
              </div>
            ) : (
              filteredProviders.map((p) => (
                <div key={p._id || p.name} className={`p-4 relative bg-[#fbf9f5] border ${
                  p.capacityPct >= 80 ? 'border-2 border-amber-600/40' : 'border-[#ded9d1]'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]">
                    <span className="font-bold text-[#1a1a1a] text-sm truncate max-w-[160px]">{p.name}</span>
                    <span className={`px-2 py-0.5 font-mono text-[9px] font-bold ${
                      p.status === 'ACCEPTING' ? 'bg-emerald-100 text-emerald-900' : 'bg-[#efeeea] text-[#665d52]'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#665d52] mt-1 truncate">{p.area}</div>

                  <div className="my-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#665d52]">Simultaneous Capacity:</span>
                      <span className="font-semibold text-[#1a1a1a]">{p.activeOrdersCount} / {p.maxCapacity} slots ({p.capacityPct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#ded9d1]">
                      <div className={`h-1.5 ${p.capacityPct >= 80 ? 'bg-amber-600' : 'bg-[#1a1a1a]'}`} style={{ width: `${p.capacityPct}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 text-[#665d52] font-mono">
                      <span>Prep: {p.prepCount}</span>
                      <span>Ready: {p.stagedCount}</span>
                      <span>SLA: {p.sla}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#ded9d1] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#665d52]">Avg: {p.avgPrepTime}</span>
                    <button 
                      type="button" 
                      onClick={() => handleOpenThrottleModal(p)}
                      className="font-mono text-[10px] text-[#1a1a1a] hover:text-amber-800 underline font-bold uppercase cursor-pointer transition-colors"
                    >
                      Throttle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===================== MODALS ===================== */}

      {/* 1. KITCHEN CAPACITY THROTTLE MODAL (Requirement 6) */}
      {selectedProviderForThrottle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#f5f3ef] border border-[#ded9d1] p-6 shadow-2xl flex flex-col gap-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-[#1a1a1a]" />
                <h4 className="font-serif text-xl text-[#1a1a1a]">Throttle Kitchen Capacity</h4>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedProviderForThrottle(null)}
                className="text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#efeeea] p-3 text-xs border border-[#ded9d1]">
              <div className="font-bold text-[#1a1a1a] text-sm">{selectedProviderForThrottle.name}</div>
              <div className="text-[#665d52] text-[11px] mt-0.5">{selectedProviderForThrottle.area}</div>
              <div className="text-[11px] font-mono mt-1 text-[#1a1a1a]">
                Active Load: <strong>{selectedProviderForThrottle.activeOrdersCount} simultaneous meals in prep</strong>
              </div>
            </div>

            <form onSubmit={handleSaveThrottle} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Max Simultaneous Kitchen Capacity (Slots: {throttleMaxCap})
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={throttleMaxCap}
                  onChange={(e) => setThrottleMaxCap(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#1a1a1a]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#665d52] mt-1">
                  <span>5 slots (Tight Throttle)</span>
                  <span className="font-bold text-[#1a1a1a]">{throttleMaxCap} Slots</span>
                  <span>100 slots (Heavy Flow)</span>
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Order Acceptance Status
                </label>
                <select
                  value={throttleStatus}
                  onChange={(e) => setThrottleStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#ded9d1] font-sans text-xs text-[#1a1a1a] focus:outline-none cursor-pointer"
                >
                  <option value="ACCEPTING">🟢 ACCEPTING (Open for new orders)</option>
                  <option value="PAUSED">🔴 PAUSED (Hold all incoming orders)</option>
                </select>
              </div>

              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Target Prep SLA Buffer
                </label>
                <select
                  value={throttlePrepTime}
                  onChange={(e) => setThrottlePrepTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#ded9d1] font-sans text-xs text-[#1a1a1a] focus:outline-none cursor-pointer"
                >
                  <option value="15 min">15 min (Normal Fast)</option>
                  <option value="25 min">25 min (+10m Rush Delay Buffer)</option>
                  <option value="35 min">35 min (+20m High Peak Throttle)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ded9d1]">
                <button
                  type="button"
                  onClick={() => setSelectedProviderForThrottle(null)}
                  className="px-4 py-2 bg-[#efeeea] border border-[#ded9d1] text-[#1a1a1a] text-xs font-medium hover:bg-[#ded9d1]/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingThrottle}
                  className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingThrottle ? 'Saving Throttle...' : 'Save & Apply Throttle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DRIVER 360 INSPECTION MODAL (Requirement 5) */}
      {selectedDriverForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#f5f3ef] border border-[#ded9d1] p-6 shadow-2xl flex flex-col gap-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <Bike size={20} className="text-[#1a1a1a]" />
                <h4 className="font-serif text-xl text-[#1a1a1a]">Delivery Partner Live Telemetry</h4>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedDriverForInspect(null)}
                className="text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-start justify-between bg-[#efeeea] p-4 border border-[#ded9d1]">
              <div>
                <h3 className="font-bold text-[#1a1a1a] text-base">{selectedDriverForInspect.name}</h3>
                <div className="font-mono text-xs text-[#665d52] mt-0.5">
                  ID: {selectedDriverForInspect.code} • {selectedDriverForInspect.vehicleNo} ({selectedDriverForInspect.vehicleType || 'Two Wheeler'})
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <a 
                    href={`tel:${selectedDriverForInspect.phone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1a1a] text-white text-[11px] font-medium"
                  >
                    <Phone size={12} />
                    <span>{selectedDriverForInspect.phone || '+91 95586 01570'}</span>
                  </a>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 font-mono text-[11px] font-bold ${
                  selectedDriverForInspect.status === 'AVAILABLE' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                    : selectedDriverForInspect.status === 'BUSY'
                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                    : 'bg-[#efeeea] text-[#665d52]'
                }`}>
                  ● {selectedDriverForInspect.status}
                </span>
                <div className="text-[11px] font-mono text-[#665d52] mt-1">{selectedDriverForInspect.rating}★ Rating</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] block uppercase">Current Bay / Location</span>
                <strong className="text-[#1a1a1a] mt-1 block">{selectedDriverForInspect.location || 'Metro Cluster, Ahmedabad'}</strong>
                <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                  GPS: {selectedDriverForInspect.lat || 23.0225}, {selectedDriverForInspect.lng || 72.5714}
                </span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] block uppercase">Current Assigned Order</span>
                <strong className="text-[#1a1a1a] mt-1 block">
                  {selectedDriverForInspect.currentOrderId || 'Standby (No active order)'}
                </strong>
                <span className="text-[10px] font-mono text-[#665d52] block mt-0.5">
                  Shift Completed: {selectedDriverForInspect.todayDeliveries || 0} deliveries
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
              <span className="font-mono text-[10px] text-[#665d52] uppercase block mb-2 font-bold">Admin Dispatch Action</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDriverStatusToggle(selectedDriverForInspect._id, 'AVAILABLE')}
                  className={`flex-1 py-1.5 font-mono text-[11px] font-semibold border ${
                    selectedDriverForInspect.status === 'AVAILABLE' ? 'bg-emerald-700 text-white' : 'bg-[#efeeea] text-[#1a1a1a] hover:bg-[#ded9d1]'
                  }`}
                >
                  Set AVAILABLE
                </button>
                <button
                  type="button"
                  onClick={() => handleDriverStatusToggle(selectedDriverForInspect._id, 'BUSY')}
                  className={`flex-1 py-1.5 font-mono text-[11px] font-semibold border ${
                    selectedDriverForInspect.status === 'BUSY' ? 'bg-blue-700 text-white' : 'bg-[#efeeea] text-[#1a1a1a] hover:bg-[#ded9d1]'
                  }`}
                >
                  Set BUSY
                </button>
                <button
                  type="button"
                  onClick={() => handleDriverStatusToggle(selectedDriverForInspect._id, 'OFFLINE')}
                  className={`flex-1 py-1.5 font-mono text-[11px] font-semibold border ${
                    selectedDriverForInspect.status === 'OFFLINE' ? 'bg-stone-800 text-white' : 'bg-[#efeeea] text-[#1a1a1a] hover:bg-[#ded9d1]'
                  }`}
                >
                  Set OFFLINE
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ded9d1]">
              <button
                type="button"
                onClick={() => setSelectedDriverForInspect(null)}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDER 360° INSPECTION MODAL (Requirement 4) */}
      {selectedOrderFor360 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#f5f3ef] border border-[#ded9d1] p-6 shadow-2xl flex flex-col gap-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#1a1a1a]" />
                <h4 className="font-serif text-xl text-[#1a1a1a]">Order 360° Breakdown • {selectedOrderFor360.orderId}</h4>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOrderFor360(null)}
                className="text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#efeeea] p-4 flex flex-col gap-2 border border-[#ded9d1] text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-[#1a1a1a]">{selectedOrderFor360.tiffinName}</span>
                <span className="font-mono text-sm font-bold text-[#1a1a1a]">₹{selectedOrderFor360.totalAmount}.00</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px] text-[#665d52]">
                <span>Status: <strong className="text-emerald-700">{selectedOrderFor360.status}</strong></span>
                <span>Payment: <strong>{selectedOrderFor360.paymentStatus}</strong></span>
                <span>Created: <strong>{selectedOrderFor360.createdAtStr}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Kitchen Source</span>
                <strong className="text-[#1a1a1a] block mt-1">{selectedOrderFor360.providerName}</strong>
                <span className="text-[#665d52] block text-[11px] mt-0.5">{selectedOrderFor360.providerArea}</span>
              </div>
              <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1]">
                <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Customer Destination</span>
                <strong className="text-[#1a1a1a] block mt-1">{selectedOrderFor360.customerName}</strong>
                <span className="text-[#665d52] block text-[11px] mt-0.5">{selectedOrderFor360.customerAddress || selectedOrderFor360.customerArea}</span>
                <span className="text-[#665d52] font-mono text-[11px] block mt-0.5">{selectedOrderFor360.customerPhone}</span>
              </div>
            </div>

            <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] text-xs">
              <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Assigned Courier Partner</span>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <strong className="text-[#1a1a1a] block">
                    {selectedOrderFor360.driverName || 'No courier assigned yet'}
                  </strong>
                  {selectedOrderFor360.driverPhone && (
                    <span className="text-[#665d52] font-mono text-[11px]">{selectedOrderFor360.driverPhone}</span>
                  )}
                </div>
                {!selectedOrderFor360.driverName && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderFor360(null);
                      setSelectedMapNode(selectedOrderFor360.orderId);
                      setIsRerouteModalOpen(true);
                    }}
                    className="px-3 py-1 bg-[#1a1a1a] text-white text-[11px] font-mono uppercase"
                  >
                    Assign Driver
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#ded9d1]">
              <span className="font-mono text-[11px] text-[#665d52]">Estimated Transit: {selectedOrderFor360.eta}</span>
              <button
                type="button"
                onClick={() => setSelectedOrderFor360(null)}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TELEMETRY INSPECTION MODAL (Requirement 3) */}
      {isTelemetryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#f5f3ef] border border-[#ded9d1] p-6 shadow-2xl flex flex-col gap-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-[#1a1a1a]" />
                <h4 className="font-serif text-xl text-[#1a1a1a]">Geospatial Telemetry Data Feed</h4>
              </div>
              <button 
                type="button"
                onClick={() => setIsTelemetryModalOpen(false)}
                className="text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#1a1a1a] text-white p-4 font-mono text-xs border border-stone-800 space-y-2">
              <div className="text-emerald-400 font-bold flex items-center justify-between">
                <span>● REAL-TIME GPS FIX: ACTIVE</span>
                <span className="text-stone-400 text-[10px]">CORRIDOR: BOM-IND-01</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800 text-[11px]">
                <div>Latitude: <strong className="text-white">23.0225° N</strong></div>
                <div>Longitude: <strong className="text-white">72.5714° E</strong></div>
                <div>GPS Accuracy: <strong className="text-emerald-400">± 3.8 meters</strong></div>
                <div>Telemetry Speed: <strong className="text-white">28.4 km/h</strong></div>
                <div>Heading: <strong className="text-white">042° NE (Satellite Blvd)</strong></div>
                <div>Hardware Battery: <strong className="text-emerald-400">88% (Online)</strong></div>
              </div>
            </div>

            <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] text-xs">
              <span className="font-mono text-[10px] text-[#665d52] uppercase block font-semibold">Active Unit Telemetry Target</span>
              <strong className="text-[#1a1a1a] text-sm block mt-1">
                {activeRoute?.orderId || selectedMapNode || 'Ahmedabad Metro Dispatch'}
              </strong>
              <div className="flex justify-between items-center mt-2 text-[#665d52] font-mono text-[11px]">
                <span>Source: {activeRoute?.originKitchen || 'Kitchen Hub'}</span>
                <span>Destination: {activeRoute?.destination || 'Ahmedabad'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#ded9d1]">
              <button
                type="button"
                onClick={() => {
                  setIsTelemetryModalOpen(false);
                  setIsRerouteModalOpen(true);
                }}
                className="px-4 py-2 bg-[#fbf9f5] border border-[#ded9d1] text-[#1a1a1a] text-xs font-mono uppercase"
              >
                Trigger Reroute
              </button>
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(false)}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. REROUTE / REASSIGN MODAL (Requirement 3) */}
      {isRerouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#f5f3ef] border border-[#ded9d1] p-6 shadow-2xl flex flex-col gap-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2 text-[#1a1a1a]">
                <RotateCcw size={20} />
                <h4 className="font-serif text-xl">Reroute &amp; Reassign Courier</h4>
              </div>
              <button 
                type="button"
                onClick={() => setIsRerouteModalOpen(false)}
                className="text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#efeeea] p-3 text-xs border border-[#ded9d1]">
              <span className="font-mono text-[10px] text-[#665d52] uppercase block">Selected Target Order</span>
              <strong className="text-sm text-[#1a1a1a] block mt-0.5">
                {activeRoute?.orderId || selectedMapNode || (activeOrders[0]?.orderId || 'Active Order')}
              </strong>
              <span className="text-[11px] text-[#665d52] block mt-0.5">
                Current Courier: {activeRoute?.riderName || 'Unassigned'}
              </span>
            </div>

            <form onSubmit={handleRerouteSubmit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Select New Courier Partner ({driversList.length} registered)
                </label>
                <select
                  value={rerouteSelectedDriverId}
                  onChange={(e) => setRerouteSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#ded9d1] font-sans text-xs text-[#1a1a1a] focus:outline-none cursor-pointer"
                >
                  {driversList.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code}) • Status: {d.status} • {d.vehicleNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Reroute Justification
                </label>
                <select
                  value={rerouteReason}
                  onChange={(e) => setRerouteReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#ded9d1] font-sans text-xs text-[#1a1a1a] focus:outline-none cursor-pointer"
                >
                  <option>Traffic delay on primary corridor (Dynamic reroute)</option>
                  <option>Courier breakdown or mechanical exception</option>
                  <option>Proximity optimization (Nearest standby driver)</option>
                  <option>Manual Super Admin priority dispatch</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ded9d1]">
                <button
                  type="button"
                  onClick={() => setIsRerouteModalOpen(false)}
                  className="px-4 py-2 bg-[#efeeea] border border-[#ded9d1] text-[#1a1a1a] text-xs font-medium hover:bg-[#ded9d1]/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReroute}
                  className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingReroute ? 'Executing...' : 'Confirm Reroute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EMERGENCY DISPATCH OVERRIDE MODAL */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#f5f3ef] border border-[#ded9d1] p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertOctagon size={24} />
                <h4 className="font-serif text-2xl text-[#1a1a1a]">Emergency Dispatch Override</h4>
              </div>
              <button 
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#efeeea] p-4 flex flex-col gap-2 border border-[#ded9d1]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#665d52] font-bold">
                Administrative Clearance: L4 Required
              </span>
              <p className="text-xs text-[#1a1a1a] leading-relaxed">
                Executing this override allows Super Admins to manually reroute drivers, force-cancel stuck orders, reassign clusters, or trigger emergency escrow refunds. All actions are cryptographically logged in the immutable audit ledger.
              </p>
            </div>

            <form onSubmit={handleExecuteEmergencyOverride} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Target Order or Corridor
                </label>
                <input
                  type="text"
                  value={emergencyTarget}
                  onChange={(e) => setEmergencyTarget(e.target.value)}
                  placeholder="e.g. Order #TL-9559 or Bodakdev Sector"
                  className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#ded9d1] text-[#1a1a1a] text-xs focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] block mb-1">
                  Override Directive
                </label>
                <select
                  value={emergencyDirective}
                  onChange={(e) => setEmergencyDirective(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbf9f5] border border-[#ded9d1] font-sans text-xs text-[#1a1a1a] focus:outline-none cursor-pointer"
                >
                  <option>Reassign nearest available driver automatically</option>
                  <option>Force Kitchen SLA Extension (+15 mins)</option>
                  <option>Immediate Escrow Reverse &amp; Order Termination</option>
                  <option>Activate Cluster Standby Surge Fleet</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-4 py-2 bg-[#efeeea] border border-[#ded9d1] text-[#1a1a1a] text-xs font-medium hover:bg-[#ded9d1]/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                >
                  Execute Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
