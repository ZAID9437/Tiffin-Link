import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';

export default function LiveRequestsTab({ currentUser, onNavigateTab, onAcceptRequest }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [acceptedTodayCount, setAcceptedTodayCount] = useState(1);
  const [selectedModalRequest, setSelectedModalRequest] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isKitchenOnline, setIsKitchenOnline] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const requestsRef = useRef([]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  // Initial fetch and 4s background sync interval
  useEffect(() => {
    if (currentUser) {
      fetchLiveRequests(true);
    }
    const interval = setInterval(() => {
      if (currentUser) {
        fetchLiveRequests(false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Audio Chime Generator using Web Audio API
  const playNotificationChime = () => {
    if (!audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  };

  const fetchLiveRequests = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await apiRequest('/requests');
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success && Array.isArray(json.data)) {
        const now = Date.now();
        // 1. Filter out expired or non-pending items from incoming payload
        const activeRawData = json.data.filter(r => {
          if (r.status && r.status !== 'pending') return false;
          if (r.expiresAt && new Date(r.expiresAt).getTime() <= now) return false;
          if (r.secondsLeft !== undefined && r.secondsLeft <= 0) return false;
          return true;
        });

        // 2. Deduplicate incoming raw data by unique ID and by Customer + Meal combo
        const seenReqIds = new Set();
        const seenCustomerMeal = new Set();
        const uniqueRawData = [];

        for (const r of activeRawData) {
          const key = String(r._id || r.id || r.requestId || r.orderId || '').trim();
          if (key && seenReqIds.has(key)) continue;
          if (key) seenReqIds.add(key);

          // Deduplicate multiple rapid orders from same customer for same meal
          const phone = (r.customerPhone || '').replace(/\D/g, '');
          const name = (r.customerName || '').trim().toLowerCase();
          const meal = (r.mealType || '').trim().toLowerCase();
          const custKey = `${phone || name}_${meal}`;

          if (custKey && custKey !== '_') {
            if (seenCustomerMeal.has(custKey)) continue;
            seenCustomerMeal.add(custKey);
          }

          uniqueRawData.push(r);
        }

        setRequests(prev => {
          const previousIds = new Set(prev.map(p => p.dbId || p.id));
          let hasNewItem = false;

          const updatedList = uniqueRawData.map((r, i) => {
            const existing = prev.find(p => (p.dbId === r._id || p.id === r.id));
            if (!previousIds.has(r._id) && !previousIds.has(r.id) && !isInitial) {
              hasNewItem = true;
            }

            let secondsLeft = 120;
            if (r.expiresAt) {
              const diff = Math.floor((new Date(r.expiresAt).getTime() - now) / 1000);
              secondsLeft = Math.max(0, Math.min(180, diff));
            } else if (r.secondsLeft !== undefined) {
              secondsLeft = Math.max(0, Math.min(180, r.secondsLeft));
            } else if (existing && existing.secondsLeft > 0) {
              secondsLeft = Math.min(180, existing.secondsLeft);
            }

            const formattedItems = Array.isArray(r.items) && r.items.length > 0
              ? r.items
              : [{ name: r.mealType || 'Tiffin Meal', qty: r.quantity || 1, price: r.budget || 0 }];

            const subtotal = r.totalAmount || (r.quantity || 1) * (r.budget || 0);
            const km = parseFloat(r.distance) || 0;
            const platformFee = Math.round(subtotal * 0.12);
            const estimatedPayout = subtotal - platformFee;

            return {
              id: r.id || (r._id ? `REQ-${r._id.toString().slice(-4).toUpperCase()}` : 'REQ'),
              dbId: r._id,
              customerName: r.customerName || 'Customer',
              customerPhone: r.customerPhone || '—',
              customerAddress: r.customerAddress || r.location || '',
              mealType: r.mealType || formattedItems[0]?.name,
              category: r.category || '',
              items: formattedItems,
              quantity: r.quantity || 1,
              totalAmount: subtotal,
              platformFee,
              estimatedPayout,
              distance: `${km} km`,
              pickupAddress: r.pickupAddress || currentUser?.kitchenName || currentUser?.name || 'Kitchen Address',
              deliveryTarget: r.deliveryTime || 'As scheduled',
              specialInstructions: r.specialInstructions || '',
              paymentStatus: r.paymentStatus || 'PAID ONLINE',
              secondsLeft,
              status: r.status || 'pending',
              createdAt: r.createdAt || new Date()
            };
          });

          const finalList = updatedList.filter(item => item.secondsLeft > 0 && item.status === 'pending');
          if (hasNewItem && finalList.length > 0) playNotificationChime();
          return finalList;
        });
      }
    } catch (err) {
      console.error('Error fetching live requests from API:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // 1-second ticking countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests(prev => {
        return prev.map(req => {
          if (req.secondsLeft <= 0 || req.status !== 'pending') return req;
          const nextSec = req.secondsLeft - 1;
          if (nextSec === 0) {
            apiRequest(`/requests/${req.dbId || req.id}/decline`, { method: 'POST' }).catch(() => {});
            showToast(`⚠️ Request #${req.id} expired (Timer reached 0)`);
            return { ...req, secondsLeft: 0, status: 'expired' };
          }
          return { ...req, secondsLeft: nextSec };
        }).filter(r => r.secondsLeft > 0 && r.status === 'pending');
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAcceptRequest = async (reqItem) => {
    const targetId = reqItem.dbId || reqItem.id;
    setActionLoadingId(reqItem.id);
    showToast(`⚡ Accepting #${reqItem.id}... Verifying availability in MongoDB`);

    try {
      const json = await apiRequest(`/requests/${targetId}/accept`, {
        method: 'POST'
      });

      if (json.success) {
        setRequests(prev => prev.filter(r => r.id !== reqItem.id && r.dbId !== targetId));
        setAcceptedTodayCount(prev => prev + 1);
        showToast(`✓ ${reqItem.id} Accepted! Created Order & Assigned to Kitchen Prep Queue.`);
        
        setTimeout(() => {
          if (onAcceptRequest) onAcceptRequest(reqItem.id);
          if (onNavigateTab) onNavigateTab('orders-preparing');
        }, 1200);
      } else {
        showToast(`❌ ${json.message || 'This request is no longer available.'}`);
        await fetchLiveRequests(false);
      }
    } catch (err) {
      console.error('Error accepting live request:', err);
      showToast('❌ Failed to accept request. Another provider may have secured it.');
      await fetchLiveRequests(false);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineRequest = async (reqItem) => {
    const targetId = reqItem.dbId || reqItem.id;
    setRequests(prev => prev.filter(r => r.id !== reqItem.id && r.dbId !== targetId));
    showToast(`Request ${reqItem.id} passed. Updated live stream.`);

    try {
      await apiRequest(`/requests/${targetId}/decline`, { method: 'POST' });
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied ${text} to clipboard!`);
    }).catch(() => {});
  };

  // Filtering & Search
  const filteredRequests = requests.filter(req => {
    if (req.status && req.status !== 'pending') return false;
    if (req.secondsLeft !== undefined && req.secondsLeft <= 0) return false;

    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerPhone.includes(searchQuery) ||
      req.mealType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'VEG') {
      return req.category?.toLowerCase().includes('veg') || req.mealType?.toLowerCase().includes('veg');
    }
    if (activeFilter === 'CATERING') {
      return req.quantity >= 5 || req.category?.toLowerCase().includes('catering') || req.category?.toLowerCase().includes('corporate');
    }
    if (activeFilter === 'EXPIRING') {
      return req.secondsLeft <= 60;
    }
    return true;
  });

  const pendingReviewCount = Math.max(0, filteredRequests.length - 1);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full font-body-md text-on-surface">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-bone-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-button-text text-button-text animate-bounce border border-sand-neutral/40">
          <span className="material-symbols-outlined text-[18px] text-[#0A8B5F]">check_circle</span>
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Top Breadcrumb & Live Socket Telemetry Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex items-center flex-wrap gap-2 text-secondary font-label-caps text-[11px] tracking-wider uppercase">
          <span onClick={() => onNavigateTab && onNavigateTab('dashboard')} className="hover:text-on-surface transition-colors cursor-pointer">Provider</span>
          <span className="text-sand-neutral font-bold">•</span>
          <span className="text-on-surface font-semibold">Live Requests</span>
          <span className="text-sand-neutral font-bold">•</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container-low text-clay-earth border border-sand-neutral/30 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-ping"></span>
            Socket.IO Gateway Connected (WebSocket v4.7)
          </span>
          <span className="text-sand-neutral font-bold">•</span>
          <span className="text-secondary font-mono">Latency: 18ms</span>
        </div>

        {/* Auto-sync & Manual Refresh Control */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container-low border border-sand-neutral/30">
            <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse"></span>
            <span className="font-label-caps text-[11px] text-secondary tracking-widest uppercase">Auto-sync: 4s</span>
          </div>
          <button
            type="button"
            onClick={() => {
              showToast('Synchronizing live requests with MongoDB node...');
              fetchLiveRequests(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-surface-container hover:bg-surface-container-highest transition-colors font-button-text text-button-text text-on-surface cursor-pointer border border-sand-neutral/30"
          >
            <span className="material-symbols-outlined text-[16px]">autorenew</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 font-label-caps text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">
            <span>Real-time Order Dispatch</span>
            <span className="w-1 h-1 rounded-full bg-secondary"></span>
            <span>Bodakdev Kitchen Rail</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-normal">
            Live Delivery Requests
          </h1>
          <p className="font-body-md text-body-md text-secondary max-w-2xl">
            Requests from customers that require your immediate response. Accept requests promptly to claim kitchen prep slots before the matching window closes.
          </p>
        </div>

        {/* Audio Alert Chimes Indicator */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs self-start lg:self-auto">
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-onyx-black">
              {audioEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </div>
          <div>
            <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Audio Chimes</div>
            <div className="font-button-text text-xs text-on-surface font-semibold flex items-center gap-1.5">
              {audioEnabled ? 'Active High-Gain Bell' : 'Chimes Muted'}
              <span className={`w-1.5 h-1.5 rounded-full ${audioEnabled ? 'bg-onyx-black' : 'bg-gray-400'}`}></span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              showToast(audioEnabled ? 'Audio alerts muted' : 'Audio alerts enabled (High Gain)');
            }}
            className="ml-2 font-label-caps text-[10px] text-secondary hover:text-on-surface uppercase underline tracking-wider cursor-pointer font-bold"
          >
            {audioEnabled ? 'Mute' : 'Enable'}
          </button>
        </div>
      </div>

      {/* 3 Summary Statistics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1: Live Requests */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse"></span>
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest font-bold">LIVE REQUESTS</span>
              </div>
              <div className="font-display-lg text-[56px] leading-tight text-on-surface mt-1 font-normal">
                {filteredRequests.length < 10 ? `0${filteredRequests.length}` : filteredRequests.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-onyx-black">bolt</span>
            </div>
          </div>
          <div className="pt-4 border-t border-sand-neutral/30 flex items-center justify-between font-label-caps text-[11px] text-secondary">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-on-surface">stream</span>
              Active in real-time queue
            </span>
            <span className="text-on-surface font-bold">&lt; 3 min window</span>
          </div>
        </div>

        {/* Metric 2: Pending Review */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-clay-earth"></span>
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest font-bold">PENDING REVIEW</span>
              </div>
              <div className="font-display-lg text-[56px] leading-tight text-on-surface mt-1 font-normal">
                {pendingReviewCount < 10 ? `0${pendingReviewCount}` : pendingReviewCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-clay-earth">timer</span>
            </div>
          </div>
          <div className="pt-4 border-t border-sand-neutral/30 flex items-center justify-between font-label-caps text-[11px] text-secondary">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
              Countdown ticking
            </span>
            <span className="text-clay-earth font-bold">Immediate Action</span>
          </div>
        </div>

        {/* Metric 3: Accepted Today */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest font-bold">ACCEPTED TODAY</span>
              </div>
              <div className="font-display-lg text-[56px] leading-tight text-on-surface mt-1 font-normal">
                {acceptedTodayCount < 10 ? `0${acceptedTodayCount}` : acceptedTodayCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-secondary">check_circle</span>
            </div>
          </div>
          <div className="pt-4 border-t border-sand-neutral/30 flex items-center justify-between font-label-caps text-[11px] text-secondary">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">skillet</span>
              Moved to In-Prep batch
            </span>
            <span className="text-on-surface font-bold">100% On-time</span>
          </div>
        </div>

      </div>

      {/* Control Bar: Search Input & Filter Chips */}
      <div className="rounded-2xl bg-surface-container-low p-4 border border-sand-neutral/40 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="w-full lg:w-80 flex items-center bg-surface-container-lowest rounded-xl px-3 py-2 border border-sand-neutral/40">
          <span className="material-symbols-outlined text-secondary text-[20px] mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, Name, Dish..."
            className="bg-transparent w-full text-xs font-body-md placeholder:text-secondary focus:outline-none text-on-surface"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-secondary hover:text-on-surface text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg font-label-caps text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'ALL' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-highest text-on-surface'
            }`}
          >
            All Live Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('VEG')}
            className={`px-3.5 py-1.5 rounded-lg font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'VEG' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold'
            }`}
          >
            Veg Thali Priority
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('CATERING')}
            className={`px-3.5 py-1.5 rounded-lg font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'CATERING' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold'
            }`}
          >
            Bulk Catering
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('EXPIRING')}
            className={`px-3.5 py-1.5 rounded-lg font-label-caps text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'EXPIRING' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold'
            }`}
          >
            Expiring Soon
          </button>
        </div>

      </div>

      {/* Main Grid Stream (8 Columns Left / 4 Columns Right Operations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Live Requests List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {loading ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-sand-neutral/40 shadow-xs space-y-3">
              <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
              <h3 className="font-headline-md text-lg text-on-surface">Connecting to MongoDB Live Requests Feed...</h3>
              <p className="font-body-md text-xs text-secondary">Fetching active customer meal orders scoped to your kitchen.</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-sand-neutral/40 shadow-xs space-y-4">
              <div className="w-14 h-14 bg-surface-container text-onyx-black rounded-2xl flex items-center justify-center mx-auto border border-sand-neutral/40">
                <span className="material-symbols-outlined text-[32px]">bolt</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-md text-xl text-on-surface font-normal">No Live Requests</h3>
                <p className="font-body-md text-xs text-secondary max-w-md mx-auto">
                  All caught up! New delivery requests from nearby customer patrons will appear here automatically via WebSockets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('orders')}
                className="px-5 py-2.5 rounded-lg bg-onyx-black text-bone-white font-button-text text-button-text hover:bg-stone-800 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Go to All Orders</span>
              </button>
            </div>
          ) : (
            filteredRequests.map((reqItem) => {
              const isUrgent = reqItem.secondsLeft <= 60;
              const isCatering = reqItem.quantity >= 5;

              return (
                <article
                  key={reqItem.id}
                  className="p-6 md:p-8 rounded-2xl bg-surface-container-lowest border border-sand-neutral/50 shadow-xs hover:shadow-md transition-all space-y-6 relative overflow-hidden group"
                >
                  {/* Top Accent Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${isUrgent ? 'bg-error' : isCatering ? 'bg-clay-earth' : 'bg-onyx-black'}`} />

                  {/* Header & Live Countdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-neutral/30">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-label-caps text-[11px] font-bold tracking-wider uppercase ${
                        isUrgent ? 'bg-error text-white' : 'bg-onyx-black text-bone-white'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        {isCatering ? 'LIVE CATERING REQUEST' : 'NEW DELIVERY REQUEST'}
                      </span>
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest font-semibold">
                        Just now
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-label-caps font-semibold px-2 py-0.5 rounded bg-surface-container text-clay-earth">
                        🟢 Pure Vegetarian
                      </span>
                    </div>

                    {/* Expiry Timer Chip */}
                    <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-surface-container-low border border-sand-neutral/30 text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-clay-earth animate-spin">timelapse</span>
                      <span className="font-label-caps text-[11px] uppercase tracking-wider font-bold">Expiring in</span>
                      <span className="font-mono font-bold text-xs text-on-surface">{formatTimer(reqItem.secondsLeft)}</span>
                    </div>
                  </div>

                  {/* Order ID & Customer Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-sand-neutral/30">
                    <div>
                      <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Order Identifier</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-body-lg text-body-lg font-bold text-on-surface font-mono">#{reqItem.id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(reqItem.id)}
                          className="p-1 hover:bg-surface-container rounded text-secondary hover:text-on-surface transition-colors cursor-pointer"
                          title="Copy Order ID"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                        </button>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-secondary font-label-caps text-[10px] font-bold">
                        <span className="material-symbols-outlined text-[12px] text-onyx-black">verified_user</span>
                        Frequent Subscriber
                      </div>
                    </div>

                    <div>
                      <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Customer & Contact</div>
                      <div className="font-body-md text-body-md font-bold text-on-surface mt-1">{reqItem.customerName}</div>
                      <div className="font-button-text text-secondary text-xs mt-0.5 flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {reqItem.customerPhone}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-label-caps text-secondary uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[13px] text-on-surface">lock</span>
                        {reqItem.paymentStatus} • Escrow Locked
                      </div>
                    </div>
                  </div>

                  {/* Dish Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold block">Selected Menu Dish</span>
                        <h3 className="font-headline-md text-[22px] leading-tight text-on-surface font-normal mt-0.5">
                          {reqItem.mealType}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold block">Batch Quantity</span>
                        <span className="font-headline-md text-[22px] text-on-surface font-semibold">{reqItem.quantity} Meals</span>
                      </div>
                    </div>

                    {/* Item Contents Tags */}
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-sand-neutral/30 flex flex-wrap items-center gap-2">
                      <span className="font-label-caps text-[10px] uppercase text-secondary font-bold mr-1">Meal Contents:</span>
                      {reqItem.items.map((item, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-sand-neutral/40 text-on-surface font-button-text text-xs font-medium">
                          {item.qty} × {item.name} (₹{item.price * item.qty})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Logistics & Financial Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    {/* Route Transit */}
                    <div className="space-y-3">
                      <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Route & Dispatch Target</div>
                      
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[15px] text-onyx-black">storefront</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-button-text text-xs font-semibold text-on-surface">Pickup: {reqItem.pickupAddress}</div>
                          <div className="font-label-caps text-[11px] text-secondary">Bodakdev Hub • Station ready</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[15px] text-clay-earth">location_on</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-button-text text-xs font-semibold text-on-surface">Drop: {reqItem.customerAddress}</div>
                          <div className="font-label-caps text-[11px] text-secondary">({reqItem.distance} away) • Target: {reqItem.deliveryTarget}</div>
                        </div>
                      </div>
                    </div>

                    {/* Financial Accounting Box */}
                    <div className="p-4 rounded-xl bg-surface-container-low border border-sand-neutral/30 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-xs font-button-text text-secondary mb-1">
                          <span>Gross Order Value</span>
                          <span className="font-semibold text-on-surface">₹{reqItem.totalAmount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-label-caps text-secondary mb-2">
                          <span>Platform Fee & Transit (12%)</span>
                          <span>- ₹{reqItem.platformFee}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-sand-neutral/40 flex items-baseline justify-between">
                        <div>
                          <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-bold block">Estimated Kitchen Payout</span>
                          <span className="font-label-caps text-[10px] text-clay-earth font-bold">Auto-transfers to wallet</span>
                        </div>
                        <div className="font-display-lg text-[26px] font-bold text-on-surface">₹{reqItem.estimatedPayout}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Suite */}
                  <div className="pt-4 border-t border-sand-neutral/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(reqItem)}
                      className="font-label-caps text-[11px] text-secondary hover:text-error transition-colors uppercase tracking-widest cursor-pointer font-bold order-3 sm:order-1"
                    >
                      Pass / Decline Request
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                      <button
                        type="button"
                        onClick={() => setSelectedModalRequest(reqItem)}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors font-button-text text-button-text text-on-surface text-center cursor-pointer border border-sand-neutral/30 font-semibold"
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        disabled={actionLoadingId === reqItem.id}
                        onClick={() => handleAcceptRequest(reqItem)}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-lg bg-onyx-black hover:bg-stone-800 transition-colors font-button-text text-button-text text-bone-white text-center flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {actionLoadingId === reqItem.id ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        )}
                        <span>Accept Request</span>
                      </button>
                    </div>
                  </div>

                </article>
              );
            })
          )}

        </div>

        {/* RIGHT COLUMN: Operational Intelligence Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Kitchen Readiness Barometer */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-onyx-black">speed</span>
                <h2 className="font-label-caps text-label-caps uppercase tracking-widest font-bold text-on-surface">
                  Kitchen Readiness
                </h2>
              </div>
              <span className="font-label-caps text-[10px] text-clay-earth font-bold uppercase">Optimal</span>
            </div>

            {/* Capacity Barometer */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline font-label-caps text-[11px]">
                <span className="text-secondary uppercase tracking-wider font-semibold">Lunch Capacity Usage</span>
                <span className="font-bold text-on-surface">16 / 30 Meals (53%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden p-0.5">
                <div className="h-full bg-onyx-black rounded-full transition-all duration-500" style={{ width: '53%' }}></div>
              </div>
              <div className="font-label-caps text-[10px] text-secondary flex justify-between pt-1 font-medium">
                <span>Remaining Capacity: 14 Slots</span>
                <span>Batch Closes: 1:30 PM</span>
              </div>
            </div>

            {/* Metrics Duo */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-surface-container-low border border-sand-neutral/30">
                <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Avg Response</div>
                <div className="font-headline-md text-[22px] text-on-surface font-semibold mt-1">42s</div>
                <div className="font-label-caps text-[9px] text-clay-earth mt-0.5 font-bold">Top 1% fast responders</div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-sand-neutral/30">
                <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Acceptance Rate</div>
                <div className="font-headline-md text-[22px] text-on-surface font-semibold mt-1">98.4%</div>
                <div className="font-label-caps text-[9px] text-secondary mt-0.5 font-medium">Super Kitchen Tier</div>
              </div>
            </div>

            {/* Zone Information Map Banner */}
            <div className="space-y-2 pt-1">
              <div className="font-label-caps text-[10px] text-secondary uppercase tracking-widest flex items-center justify-between font-bold">
                <span>Live Delivery Zone</span>
                <span className="text-on-surface">Bodakdev Hub</span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low border border-sand-neutral/30 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                  <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse"></span>
                  12 Delivery Couriers Active
                </div>
                <div className="font-label-caps text-[10px] text-secondary">
                  Within 2.5 km of Xoxo Men Kitchen
                </div>
              </div>
            </div>
          </div>

          {/* How Live Dispatch Operates */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-sand-neutral/40">
              <span className="material-symbols-outlined text-[20px] text-onyx-black">info</span>
              <h2 className="font-label-caps text-label-caps uppercase tracking-widest font-bold text-on-surface">
                How Live Dispatch Operates
              </h2>
            </div>

            <div className="space-y-3.5 text-xs font-body-md text-secondary">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-container font-label-caps text-[10px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p className="leading-relaxed">
                  <strong className="text-on-surface font-semibold">Real-time Broadcast:</strong> When a customer orders nearby, requests stream directly via MongoDB & WebSockets.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-container font-label-caps text-[10px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p className="leading-relaxed">
                  <strong className="text-on-surface font-semibold">Atomic Claim:</strong> Clicking "Accept Request" locks the order to your kitchen and prevents double assignment.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-surface-container font-label-caps text-[10px] font-bold text-on-surface flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <p className="leading-relaxed">
                  <strong className="text-on-surface font-semibold">Escrow Protection:</strong> Funds are pre-authorized and automatically clear to your kitchen earnings balance.
                </p>
              </div>
            </div>
          </div>

          {/* Kitchen Status Quick Switch Card */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-sand-neutral/40 shadow-xs flex items-center justify-between gap-4">
            <div>
              <div className="font-button-text text-xs font-bold text-on-surface">Kitchen Broadcast Mode</div>
              <div className="font-label-caps text-[10px] text-secondary mt-0.5">
                {isKitchenOnline ? 'Receiving instant alerts & pings' : 'Orders paused'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsKitchenOnline(!isKitchenOnline);
                showToast(isKitchenOnline ? 'Kitchen switched to Offline mode' : 'Kitchen is now Online & receiving requests');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-label-caps text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer ${
                isKitchenOnline ? 'bg-onyx-black text-bone-white hover:bg-neutral-800' : 'bg-error text-white'
              }`}
            >
              {isKitchenOnline ? 'ONLINE' : 'OFFLINE'}
            </button>
          </div>

        </div>

      </div>

      {/* View Details Manifest Modal */}
      {selectedModalRequest && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl border border-sand-neutral/50 shadow-2xl p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-onyx-black">receipt_long</span>
                <span className="font-label-caps text-label-caps font-bold uppercase text-on-surface">
                  Manifest Breakdown • #{selectedModalRequest.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalRequest(null)}
                className="p-1 text-secondary hover:text-on-surface rounded cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 font-body-md text-xs text-secondary">
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-sand-neutral/30 space-y-1">
                <div className="font-bold text-on-surface text-sm">{selectedModalRequest.mealType} ({selectedModalRequest.quantity} Units)</div>
                <div className="text-secondary font-medium">Customer: {selectedModalRequest.customerName} ({selectedModalRequest.customerPhone})</div>
                {selectedModalRequest.specialInstructions && (
                  <div className="text-clay-earth font-bold pt-1">Note: {selectedModalRequest.specialInstructions}</div>
                )}
              </div>

              <div className="space-y-2 p-3 bg-surface-container-lowest rounded-xl border border-sand-neutral/40">
                <div className="flex justify-between">
                  <span>Gross Meal Amount</span>
                  <span className="text-on-surface font-semibold">₹{selectedModalRequest.totalAmount}</span>
                </div>
                <div className="flex justify-between"><span>Platform Fee & Transit</span><span className="text-on-surface font-semibold">- ₹{selectedModalRequest.platformFee}</span></div>
                <div className="flex justify-between border-t border-sand-neutral/40 pt-2 font-bold text-on-surface text-sm">
                  <span>Estimated Kitchen Earnings</span>
                  <span className="text-[#0A8B5F]">₹{selectedModalRequest.estimatedPayout}</span>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-[11px] text-clay-earth font-medium border border-sand-neutral/30">
                <strong>Escrow Security:</strong> Payment status is verified ({selectedModalRequest.paymentStatus}). Funds release automatically upon order completion.
              </div>
            </div>

            <div className="pt-3 border-t border-sand-neutral/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedModalRequest(null)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest font-button-text text-button-text cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const reqToAccept = selectedModalRequest;
                  setSelectedModalRequest(null);
                  handleAcceptRequest(reqToAccept);
                }}
                className="px-5 py-2.5 rounded-lg bg-onyx-black text-bone-white font-button-text text-button-text hover:bg-stone-800 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>Accept Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
