import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

/**
 * Web Audio API 10-Second Delivery Request Alert Sound Synthesizer
 */
class DeliveryAlertAudio {
  constructor() {
    this.audioCtx = null;
    this.timer = null;
    this.isPlaying = false;
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  play10SecChime(onStopCallback) {
    try {
      this.stop();
      this.initContext();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.isPlaying = true;
      let iterations = 0;
      const maxIterations = 8; // ~10 seconds total duration (every 1.2 seconds)

      const playTonePair = () => {
        if (!this.isPlaying || iterations >= maxIterations) {
          this.stop();
          if (onStopCallback) onStopCallback();
          return;
        }

        iterations++;
        const now = this.audioCtx.currentTime;

        // Tone 1: A5 (880 Hz)
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        // Tone 2: C6 (1046.5 Hz)
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, now + 0.15);
        gain2.gain.setValueAtTime(0.2, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.5);

        this.timer = setTimeout(playTonePair, 1200);
      };

      playTonePair();
    } catch (err) {
      console.warn('Audio play exception:', err.message);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

const deliveryAudio = new DeliveryAlertAudio();

const isSameDeliveryHelper = (reqA, reqB) => {
  if (!reqA || !reqB) return false;
  const clean = (val) => String(val || '').trim().replace(/^#+/, '').toLowerCase();
  
  const aIds = [clean(reqA._id), clean(reqA.requestId), clean(reqA.orderId), clean(reqA.id)].filter(Boolean);
  const bIds = [clean(reqB._id), clean(reqB.requestId), clean(reqB.orderId), clean(reqB.id)].filter(Boolean);
  
  return aIds.some(idA => bIds.includes(idA));
};

const formatOrderRef = (ref) => {
  if (!ref) return '#TL-REQ-4091';
  const clean = String(ref).trim().replace(/^#+/, '');
  return `#TL-REQ-${clean}`;
};

export default function DeliveryRequestsView({ activeDelivery, onAcceptDelivery, onNavigateTab, currentUser, isOnline: initialOnlineState }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'instant' | 'subscription' | 'incentive'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(initialOnlineState !== undefined ? initialOnlineState : true);
  
  // Sound alert toggle and tracker
  const [soundEnabled, setSoundEnabled] = useState(true);
  const alertedIdsRef = useRef(new Set());

  // Decline modal state
  const [declineModalReq, setDeclineModalReq] = useState(null);

  // Confirmed Acceptance modal state
  const [confirmedModalData, setConfirmedModalData] = useState(null);
  
  // GPS position state
  const [userCoords, setUserCoords] = useState(null);
  const [gpsDenied, setGpsDenied] = useState(false);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  // Auto Accept Rules checkboxes with localStorage persistence
  const [autoAcceptRules, setAutoAcceptRules] = useState(() => {
    try {
      const saved = localStorage.getItem('tiffinlink_auto_accept_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { minPayout: true, maxRadius: true, ecoReturn: false };
  });

  // Dynamic Milestone / Daily Earnings Target State
  const [milestone, setMilestone] = useState({
    todayEarnings: 0,
    targetEarnings: 1200,
    completedTrips: 0,
    targetTrips: 6,
    bonusAmount: 200
  });

  useEffect(() => {
    try {
      localStorage.setItem('tiffinlink_auto_accept_rules', JSON.stringify(autoAcceptRules));
    } catch (e) {}
  }, [autoAcceptRules]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || localStorage.getItem('token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Fetch live partner dashboard metrics for dynamic milestone
  useEffect(() => {
    const fetchPartnerMetrics = async () => {
      try {
        const driverId = currentUser?.id || currentUser?._id || 'TL-8041';
        const res = await fetch(`http://localhost:5000/api/delivery/driver-dashboard?driverId=${encodeURIComponent(driverId)}`, {
          headers: getAuthHeaders()
        });
        const json = await res.json();
        if (json.success && (json.metrics || json.dashboard || json.data)) {
          const m = json.metrics || json.dashboard || json.data || {};
          const earnings = m.todayEarnings || m.earningsToday || m.totalEarnings || 820;
          const completed = m.completedDeliveries || m.todayDeliveries || m.completedTrips || 4;
          setMilestone(prev => ({
            ...prev,
            todayEarnings: earnings,
            completedTrips: completed,
            targetTrips: Math.max(6, completed + 2)
          }));
        }
      } catch (err) {
        console.warn('Live milestone metrics fetch warning:', err.message);
      }
    };
    fetchPartnerMetrics();
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Watch Driver GPS position
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsDenied(false);
        },
        (err) => {
          console.warn('Geolocation error/permission denied:', err.message);
          setGpsDenied(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setGpsDenied(true);
    }
  }, []);

  // Stop audio chime on component unmount
  useEffect(() => {
    return () => {
      deliveryAudio.stop();
    };
  }, []);

  // Fetch real delivery requests from MongoDB
  const fetchRequests = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const driverId = currentUser?.id || currentUser?._id || 'TL-8041';
      const lat = userCoords?.lat || 23.0280;
      const lng = userCoords?.lng || 72.5670;

      const res = await apiRequest(`/delivery/driver-requests?driverId=${encodeURIComponent(driverId)}&lat=${lat}&lng=${lng}&filter=${activeFilter}`);
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success && json.data) {
        const rawList = json.data.requests || [];
        const fetchedList = rawList.filter(r => {
          if (r.status === 'Driver Assigned' || r.status === 'Picked Up' || r.status === 'Delivered' || r.status === 'Cancelled') {
            return false;
          }
          if (activeDelivery && isSameDeliveryHelper(r, activeDelivery)) {
            return false;
          }
          return true;
        });

        // Enrich requests with surge, type and timer attributes
        const enriched = fetchedList.map((r, idx) => {
          const type = r.tiffinCategory === 'Subscription' || r.tiffinName?.toLowerCase().includes('plan') ? 'subscription' : 'instant';
          const isUrgent = idx === 0 || (r.distanceKm && r.distanceKm > 4);
          const surgeBonus = isUrgent ? 30 : 0;
          const driverEarning = r.driverEarning || Math.max(135, Math.round((r.distanceKm || 3.2) * 15 + 100 + surgeBonus));

          return {
            ...r,
            type,
            isUrgent,
            surgeBonus,
            driverEarning,
            secondsLeft: r.secondsLeft !== undefined ? r.secondsLeft : 5
          };
        });

        setRequests(enriched);
        enriched.forEach(r => alertedIdsRef.current.add(r.requestId || r._id));
      }
    } catch (err) {
      console.error('Error fetching delivery requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(true);
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeFilter, userCoords]);

  // Real-time Socket.IO subscriptions for broadcast & atomic winner assignment
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch (e) {
      console.warn('Socket connection warning in DeliveryRequestsView:', e);
    }
    if (!socket) return;

    const handleNewRequest = (data) => {
      if (soundEnabled) {
        deliveryAudio.play10SecChime();
      }
      fetchRequests();
    };

    const handleAccepted = (data) => {
      if (!data) return;
      const targetId = String(data.requestId || data.orderId || '');
      const winnerDriverId = String(data.assignedDriverId || '');
      const currentDriverId = String(currentUser?.id || currentUser?._id || 'TL-8041');

      if (winnerDriverId !== currentDriverId) {
        deliveryAudio.stop();
        setRequests((prev) => prev.filter((r) => String(r.requestId || r._id) !== targetId && String(r.orderId) !== targetId));
        showToast(`⚡ Delivery Request ${data.orderId ? '#' + data.orderId : ''} was accepted by another driver.`);
      }
    };

    const handleUnavailable = (data) => {
      if (!data) return;
      const targetId = String(data.requestId || data.orderId || '');
      deliveryAudio.stop();
      setRequests((prev) => prev.filter((r) => String(r.requestId || r._id) !== targetId && String(r.orderId) !== targetId));
    };

    socket.on('delivery:request:new', handleNewRequest);
    socket.on('delivery:driver:live_request', handleNewRequest);
    socket.on('delivery:request:accepted', handleAccepted);
    socket.on('delivery:request:unavailable', handleUnavailable);
    socket.on('delivery:request:expired', handleUnavailable);
    socket.on('delivery:request:cancelled', handleUnavailable);

    return () => {
      socket.off('delivery:request:new', handleNewRequest);
      socket.off('delivery:driver:live_request', handleNewRequest);
      socket.off('delivery:request:accepted', handleAccepted);
      socket.off('delivery:request:unavailable', handleUnavailable);
      socket.off('delivery:request:expired', handleUnavailable);
      socket.off('delivery:request:cancelled', handleUnavailable);
    };
  }, [currentUser]);

  // Live 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prev) =>
        prev
          .map((req) => ({
            ...req,
            secondsLeft: Math.max(0, (req.secondsLeft || 60) - 1)
          }))
          .filter((req) => req.secondsLeft > 0)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filtered Cards Feed
  const filteredRequests = requests.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'instant') return r.type === 'instant';
    if (activeFilter === 'subscription') return r.type === 'subscription';
    if (activeFilter === 'incentive') return r.surgeBonus > 0;
    return true;
  });

  const instantCount = requests.filter(r => r.type === 'instant').length;
  const subscriptionCount = requests.filter(r => r.type === 'subscription').length;

  // Dynamic Route Intelligence & Sidebar calculations derived from live requests
  const topReq = filteredRequests.length > 0 ? filteredRequests[0] : (requests.length > 0 ? requests[0] : null);
  const topReqRef = topReq ? formatOrderRef(topReq.orderId || topReq.requestId || topReq._id) : null;
  const topReqPickup = topReq?.providerName || 'Pickup Kitchen';
  const topReqDrop = topReq?.deliveryAddress?.street || topReq?.customerAddress || 'Drop Destination';
  const topReqDist = topReq?.distanceKm || 3.2;
  const topReqMatchPct = topReq ? Math.min(98, Math.max(76, 100 - Math.round(topReqDist * 4))) : 100;
  const topReqDeadhead = topReq ? (topReqDist * 0.15).toFixed(1) : '0.0';
  const topReqFuelSave = topReq ? Math.round(topReqDist * 4 + 10) : 0;

  // Header Zone & Demand Pulse derived dynamically
  const currentZoneName = topReq?.pickupAddress?.city || topReq?.deliveryAddress?.city || (userCoords ? 'Ahmedabad Central' : 'Bandra-Khar West');
  const demandPulseText = requests.length >= 3 ? 'High (+₹30 avg)' : requests.length > 0 ? 'Moderate (+₹15 avg)' : 'Standard Base Rate';

  // Milestone Progress Percentage
  const milestonePct = Math.min(100, Math.round((milestone.todayEarnings / milestone.targetEarnings) * 100));
  const remainingDeliveries = Math.max(0, milestone.targetTrips - milestone.completedTrips);

  // Auto accept check per request card
  const checkAutoAcceptMatch = (req) => {
    if (!req) return false;
    if (autoAcceptRules.minPayout && (req.driverEarning || 0) < 150) return false;
    if (autoAcceptRules.maxRadius && (req.distanceKm || 0) > 5.0) return false;
    if (autoAcceptRules.ecoReturn && !req.tiffinName?.toLowerCase().includes('return') && !req.tiffinName?.toLowerCase().includes('eco')) return false;
    return true;
  };

  // Atomic Accept Handler
  const handleAcceptAtomic = async (req) => {
    if (!req) return;
    deliveryAudio.stop();

    if (activeDelivery) {
      showToast('⚠️ You already have an active delivery in progress. Complete your current trip before accepting another request.');
      return;
    }

    const rawId = req.requestId || req._id || req.orderId;
    if (!rawId) {
      showToast('⚠️ Invalid delivery request reference.');
      return;
    }

    setAcceptingId(rawId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const encodedId = encodeURIComponent(rawId);
      const res = await fetch(`http://localhost:5000/api/delivery/requests/${encodedId}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          driverId: currentUser?.id || currentUser?._id || 'TL-8041',
          driverName: currentUser?.name || 'Rajesh Kumar',
          driverPhone: currentUser?.phone || '+91 98201 44821'
        })
      });

      clearTimeout(timeoutId);
      const json = await res.json();

      if (!res.ok || !json.success) {
        showToast(`⚠️ ${json.message || 'This delivery is no longer available.'}`);
        if (!json.hasActiveDelivery) {
          setRequests((prev) => prev.filter((r) => (r.requestId || r._id || r.orderId) !== rawId));
        }
        return;
      }

      setConfirmedModalData(req);

      if (onAcceptDelivery) {
        onAcceptDelivery(json.request || req);
      }
      fetchRequests();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Accept error:', err);
      if (err.name === 'AbortError') {
        showToast('⚠️ Request timed out. Please try again.');
      } else {
        showToast(`⚠️ ${err.message || 'Unable to accept request. Please try again.'}`);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  // Confirm Decline Handler
  const handleConfirmDecline = async () => {
    deliveryAudio.stop();
    if (!declineModalReq) return;
    const reqId = declineModalReq.requestId || declineModalReq._id;

    try {
      await fetch(`http://localhost:5000/api/delivery/requests/${reqId}/decline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ driverId: currentUser?.id || currentUser?._id || 'TL-8041' })
      });
      showToast('Delivery request declined.');
      setRequests((prev) => prev.filter((r) => (r.requestId || r._id) !== reqId));
    } catch (err) {
      console.error('Decline error:', err);
      setRequests((prev) => prev.filter((r) => (r.requestId || r._id) !== reqId));
    } finally {
      setDeclineModalReq(null);
    }
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s remaining`;
  };

  return (
    <div className="flex flex-col w-full antialiased text-on-surface bg-surface selection:bg-onyx-black selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-semibold px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Live Broadcast Signal */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-sand-neutral">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-onyx-black animate-ping" />
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest text-[11px]">
              Active Dispatch Matrix
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight text-3xl sm:text-4xl font-serif">
            Delivery Requests
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm sm:text-base">
            {requests.length} available delivery requests nearby. Accept within the allocated countdown to reserve your route and lock guaranteed partner surges.
          </p>
        </div>

        {/* Live Fleet Stats pill summary */}
        <div className="flex items-center gap-4 bg-bone-white p-3 border border-sand-neutral self-start lg:self-auto shadow-xs">
          <div className="px-3 border-r border-sand-neutral">
            <span className="font-label-caps text-[10px] text-secondary uppercase block tracking-wider">Current Zone</span>
            <span className="font-button-text text-xs text-onyx-black font-semibold">{currentZoneName}</span>
          </div>
          <div className="px-3">
            <span className="font-label-caps text-[10px] text-secondary uppercase block tracking-wider">Demand Pulse</span>
            <span className="font-button-text text-xs text-onyx-black font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-onyx-black">trending_up</span> {demandPulseText}
            </span>
          </div>
        </div>
      </div>

      {/* 1B. ACTIVE TRIP WARNING BANNER */}
      {activeDelivery && (
        <div className="p-4 my-6 bg-amber-50 border-2 border-amber-500 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-700 text-[24px]">local_shipping</span>
            <div>
              <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider">🚚 ACTIVE TRIP IN PROGRESS</h4>
              <p className="text-xs text-amber-900 mt-0.5">
                You are currently assigned to Order <strong>{formatOrderRef(activeDelivery.orderId || activeDelivery.requestId)}</strong>. Complete your active delivery before accepting new requests.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('dashboard')}
            className="px-5 py-2 bg-amber-950 text-on-primary hover:bg-amber-900 font-button-text text-xs uppercase font-bold tracking-wider cursor-pointer shrink-0"
          >
            View Active Trip
          </button>
        </div>
      )}

      {/* 2. Filter Strip & Quick Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`filter-btn px-4 py-2 font-label-caps text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-onyx-black text-on-primary font-medium'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            All ({requests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('instant')}
            className={`filter-btn px-4 py-2 font-label-caps text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'instant'
                ? 'bg-onyx-black text-on-primary font-medium'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            Instant Delivery ({instantCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('subscription')}
            className={`filter-btn px-4 py-2 font-label-caps text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === 'subscription'
                ? 'bg-onyx-black text-on-primary font-medium'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            Scheduled Subscription ({subscriptionCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('incentive')}
            className={`filter-btn px-4 py-2 font-label-caps text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'incentive'
                ? 'bg-onyx-black text-on-primary font-medium'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span> High Incentive (+₹30)
          </button>
        </div>

        <div className="flex items-center gap-3 text-secondary">
          <span className="font-label-caps text-[11px] uppercase tracking-wider">Audio Radar</span>
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (soundEnabled) deliveryAudio.stop();
            }}
            className={`w-8 h-8 flex items-center justify-center bg-bone-white border border-sand-neutral hover:bg-surface-container-high transition-colors cursor-pointer ${
              !soundEnabled ? 'opacity-50' : ''
            }`}
            title="Toggle Request Ping"
          >
            <span className="material-symbols-outlined text-[18px] text-onyx-black">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Main Grid Workspace (Requests Feed + Operational Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Request Cards Feed (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {loading ? (
            <div className="py-16 text-center bg-surface-container-lowest border border-sand-neutral space-y-3">
              <span className="material-symbols-outlined text-onyx-black text-[32px] animate-spin">refresh</span>
              <p className="font-label-caps text-xs text-secondary uppercase tracking-widest">Scanning live delivery requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            /* Zero State Placeholder */
            <div className="py-16 px-6 bg-surface-container-lowest border border-sand-neutral text-center flex flex-col items-center justify-center space-y-4">
              <span className="material-symbols-outlined text-secondary text-[48px]">radar</span>
              <h3 className="font-headline-md text-xl text-onyx-black font-serif">Scanning For Requests</h3>
              <p className="font-body-md text-sm text-on-surface-variant max-w-md">
                You are positioned in a high-demand sector. New incoming tiffin dispatches will automatically populate here.
              </p>
              <button
                type="button"
                onClick={fetchRequests}
                className="px-6 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider mt-2 cursor-pointer hover:bg-clay-earth transition-colors"
              >
                Force Radar Check
              </button>
            </div>
          ) : (
            filteredRequests.map((req, idx) => {
              const reqId = req.requestId || req._id || `req-${idx}`;
              const orderRef = formatOrderRef(req.orderId || req.requestId || req._id);
              const isFirstSurge = req.isUrgent || idx === 0;

              return (
                <div
                  key={reqId}
                  className={`request-card relative bg-surface-container-lowest border-2 transition-all p-6 hover:bg-bone-white/60 ${
                    isFirstSurge ? 'border-onyx-black' : 'border-sand-neutral hover:border-onyx-black'
                  }`}
                >
                  {/* Badge Banner Overlap for Urgent Dispatch */}
                  {isFirstSurge && (
                    <div className="absolute -top-3 left-6 bg-onyx-black text-on-primary px-3 py-0.5 font-label-caps text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                      <span className="material-symbols-outlined text-[13px]">electric_bolt</span> Urgent Dispatch
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-2 pb-4 border-b border-sand-neutral">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest">Order Ref</span>
                        <span className="font-button-text font-bold text-onyx-black text-sm">{orderRef}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-secondary flex-wrap text-xs">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">schedule</span> Ready in {req.etaMinutes || 5}m
                        </span>
                        <span className="text-sand-neutral">/</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">navigation</span> {req.distanceKm || 4.2} km total
                        </span>
                        <span className="text-sand-neutral">/</span>
                        <span>Est. {Math.round((req.distanceKm || 4.2) * 4 + 8)} mins</span>
                      </div>
                    </div>

                    {/* Payout Block */}
                    <div className="sm:text-right">
                      <div className="flex items-baseline sm:justify-end gap-1.5">
                        <span className="font-headline-md text-2xl sm:text-3xl text-onyx-black font-serif">₹{req.driverEarning || 165}</span>
                        <span className="font-label-caps text-[10px] text-secondary uppercase font-semibold">Guaranteed</span>
                      </div>
                      {req.surgeBonus > 0 && (
                        <span className="inline-block px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-caps text-[9px] uppercase font-semibold mt-1">
                          Includes +₹{req.surgeBonus} Surge Bonus
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Waypoint Architecture */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                    
                    {/* Pickup */}
                    <div className="p-4 bg-bone-white border border-sand-neutral relative">
                      <span className="absolute top-3 right-3 font-label-caps text-[10px] text-secondary uppercase tracking-wider">Stop 1</span>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-onyx-black mt-0.5 text-[20px]">storefront</span>
                        <div>
                          <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider block">Pickup Kitchen</span>
                          <span className="font-headline-md text-base text-onyx-black font-serif block font-bold mt-0.5">
                            {req.providerName || 'The Malabar Chronicle'}
                          </span>
                          <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                            {req.pickupAddress?.street || 'Shop 4, Hill Road, Bandra West'}
                          </p>
                          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-label-caps text-secondary bg-surface-container-lowest px-2 py-0.5 border border-sand-neutral">
                            <span className="material-symbols-outlined text-[13px]">soup_kitchen</span> Tiffin Dispatch Bay 2
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dropoff */}
                    <div className="p-4 bg-bone-white border border-sand-neutral relative">
                      <span className="absolute top-3 right-3 font-label-caps text-[10px] text-secondary uppercase tracking-wider">Stop 2</span>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-onyx-black mt-0.5 text-[20px]">location_on</span>
                        <div>
                          <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider block">Drop Destination</span>
                          <span className="font-headline-md text-base text-onyx-black font-serif block font-bold mt-0.5">
                            {req.customerName || 'Marcus Reed'}
                          </span>
                          <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                            {req.deliveryAddress?.street || req.customerAddress || 'Flat 602, Sea Pearl Apt, 14th Road, Khar West'}
                          </p>
                          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-label-caps text-onyx-black bg-surface-container-lowest px-2 py-0.5 border border-onyx-black">
                            <span className="material-symbols-outlined text-[13px]">alarm</span> Window: 1:15 PM – 1:30 PM
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Meal Inventory & Mandatory Directives */}
                  <div className="p-3 bg-surface-container-low border border-sand-neutral flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">lunch_dining</span>
                      <span className="font-body-md text-on-surface font-medium">
                        {req.tiffinName || '2x Signature Kerala Tiffin Box'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-secondary font-label-caps text-[10px] uppercase">
                      <span className="material-symbols-outlined text-[15px] text-onyx-black">autorenew</span>
                      <span>Eco-Tiffin Return Required (Pickup Empty Cask)</span>
                    </div>
                  </div>

                  {/* Timer & Decision Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-sand-neutral">
                    <div className="flex items-center gap-3">
                      {/* Circular countdown stroke graphic */}
                      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg className="w-8 h-8 transform -rotate-90">
                          <circle cx="16" cy="16" fill="none" r="13" stroke="#ded9d1" strokeWidth="2.5" />
                          <circle
                            className="transition-all duration-1000 ease-linear"
                            cx="16"
                            cy="16"
                            fill="none"
                            r="13"
                            stroke="#1a1a1a"
                            strokeDasharray="81.68"
                            strokeDashoffset={Math.max(0, 81.68 - (81.68 * (req.secondsLeft || 45)) / 120)}
                            strokeWidth="2.5"
                          />
                        </svg>
                        <span className="material-symbols-outlined text-[14px] absolute text-onyx-black">hourglass_bottom</span>
                      </div>
                      <div>
                        <span className="font-label-caps text-[10px] text-secondary uppercase block">Expiries in</span>
                        <span className="font-button-text text-xs font-bold text-onyx-black tracking-wider">
                          {formatCountdown(req.secondsLeft || 45)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setDeclineModalReq(req)}
                        className="decline-btn w-1/2 sm:w-auto px-6 py-2.5 font-button-text text-xs text-secondary hover:text-onyx-black transition-colors underline hover:no-underline cursor-pointer"
                      >
                        Decline
                      </button>

                      <button
                        type="button"
                        disabled={acceptingId === reqId}
                        onClick={() => handleAcceptAtomic(req)}
                        className="accept-btn w-1/2 sm:w-auto px-8 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-xs tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {acceptingId === reqId ? 'Accepting...' : 'Accept Request'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Right Column: Strategic Sidebar / Operational Intel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Efficiency Route Optimizer Widget */}
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-[20px]">alt_route</span>
                <span className="font-label-caps text-xs uppercase text-onyx-black tracking-wider font-semibold">Route Intelligence</span>
              </div>
              <span className="px-2 py-0.5 bg-bone-white border border-sand-neutral font-label-caps text-[10px] text-secondary">AI Dispatch</span>
            </div>

            <div className="space-y-2">
              <h4 className="font-headline-md text-base text-onyx-black font-serif font-bold">
                {topReq ? 'Pairing Opportunity Identified' : 'Radar Active & Scanning'}
              </h4>
              <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                {topReq ? (
                  <>Accepting <strong className="text-onyx-black font-medium">{topReqRef}</strong> pairs seamlessly with pickup at <strong className="text-onyx-black font-medium">{topReqPickup}</strong> to <strong className="text-onyx-black font-medium">{topReqDrop}</strong>, increasing your hourly run-rate by +34%.</>
                ) : (
                  <>Scanning active dispatch matrix... Stand by in your perimeter for automated incoming dispatches.</>
                )}
              </p>
            </div>

            {/* Inline Visual Route Sparkline */}
            <div className="p-3 bg-bone-white border border-sand-neutral space-y-2">
              <div className="flex justify-between font-label-caps text-[10px] text-secondary uppercase">
                <span>Route Optimization</span>
                <span className="text-onyx-black font-bold">{topReqMatchPct}% MATCH</span>
              </div>
              <div className="w-full bg-sand-neutral h-1.5 overflow-hidden">
                <div className="bg-onyx-black h-full transition-all duration-500" style={{ width: `${topReqMatchPct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                <span>Deadhead distance: {topReqDeadhead} km</span>
                <span>Fuel save: ~{topReqFuelSave}%</span>
              </div>
            </div>

            {/* Compact Zone Demand Graphic */}
            <div className="pt-2 border-t border-sand-neutral">
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest block mb-2 font-semibold">
                Hourly Payout Index ({currentZoneName})
              </span>
              <div className="flex items-end gap-1.5 h-16 pt-2">
                <div className="flex-1 bg-surface-container-high h-[40%]" title="11:00 AM" />
                <div className="flex-1 bg-surface-container-high h-[65%]" title="12:00 PM" />
                <div className="flex-1 bg-onyx-black h-[100%]" title="01:00 PM (Current Peak)" />
                <div className="flex-1 bg-surface-container-high h-[80%]" title="02:00 PM" />
                <div className="flex-1 bg-surface-container-high h-[30%]" title="03:00 PM" />
              </div>
              <div className="flex justify-between text-[10px] font-label-caps text-secondary mt-1.5 uppercase">
                <span>11 AM</span>
                <span className="text-onyx-black font-bold">Peak Now</span>
                <span>3 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Setup: Auto-Accept Configuration */}
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-[20px]">tune</span>
                <span className="font-label-caps text-xs uppercase text-onyx-black tracking-wider font-semibold">Auto-Accept Rules</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('settings')}
                className="font-label-caps text-[10px] text-secondary hover:text-onyx-black underline cursor-pointer"
              >
                Configure
              </button>
            </div>
            <p className="font-body-md text-xs text-on-surface-variant leading-normal">
              Automatically confirm rides matching your custom fuel & radius criteria while on active transit.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 bg-bone-white border border-sand-neutral cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-medium text-onyx-black">Min. Payout ≥ ₹150</span>
                  <span className="font-label-caps text-[9px] text-secondary uppercase">Skips sub-tier orders</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAcceptRules.minPayout}
                  onChange={(e) => setAutoAcceptRules(prev => ({ ...prev, minPayout: e.target.checked }))}
                  className="accent-onyx-black w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-bone-white border border-sand-neutral cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-medium text-onyx-black">Max Radius &lt; 5.0 km</span>
                  <span className="font-label-caps text-[9px] text-secondary uppercase">Short delivery perimeter</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAcceptRules.maxRadius}
                  onChange={(e) => setAutoAcceptRules(prev => ({ ...prev, maxRadius: e.target.checked }))}
                  className="accent-onyx-black w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-bone-white border border-sand-neutral cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-medium text-onyx-black">Only Eco-Tiffin Swaps</span>
                  <span className="font-label-caps text-[9px] text-secondary uppercase">+₹15 collection rebate</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAcceptRules.ecoReturn}
                  onChange={(e) => setAutoAcceptRules(prev => ({ ...prev, ecoReturn: e.target.checked }))}
                  className="accent-onyx-black w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => showToast('✓ Auto-Accept automation preferences saved!')}
              className="w-full py-2.5 bg-surface-container-low border border-onyx-black hover:bg-onyx-black hover:text-on-primary font-button-text text-xs text-onyx-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span> Save Automation Mode
            </button>
          </div>

          {/* Shift Snapshot Summary */}
          <div className="p-5 bg-bone-white border border-sand-neutral space-y-4 shadow-xs">
            <span className="font-label-caps text-xs text-secondary uppercase tracking-widest block font-semibold">
              Today's Milestone
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-headline-md text-2xl text-onyx-black font-serif font-bold">₹{milestone.todayEarnings}</span>
                <span className="text-xs font-body-md text-secondary"> / ₹{milestone.targetEarnings} Target</span>
              </div>
              <span className="font-label-caps text-[10px] text-onyx-black font-bold uppercase">{milestonePct}% Achieved</span>
            </div>
            <div className="w-full bg-sand-neutral h-1 overflow-hidden">
              <div className="bg-onyx-black h-1 transition-all duration-500" style={{ width: `${milestonePct}%` }} />
            </div>
            <p className="font-body-md text-xs text-on-surface-variant">
              {remainingDeliveries > 0 ? (
                <>Complete <strong className="text-onyx-black font-semibold">{remainingDeliveries} more deliver{remainingDeliveries > 1 ? 'ies' : 'y'}</strong> during this lunch surge to unlock the <strong className="text-onyx-black font-semibold">₹{milestone.bonusAmount} Peak Champion Bonus</strong>.</>
              ) : (
                <><strong className="text-onyx-black font-semibold">🎉 Peak Target Reached!</strong> You unlocked the <strong className="text-onyx-black font-semibold">₹{milestone.bonusAmount} Peak Champion Bonus</strong> today.</>
              )}
            </p>
          </div>

        </div>

      </div>

      {/* DECLINE CONFIRMATION MODAL */}
      {declineModalReq && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-onyx-black p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="font-headline-md text-lg text-onyx-black font-serif font-bold">Decline this delivery request?</h3>
              <p className="font-body-md text-xs text-secondary mt-1">You won't receive this request again on your terminal.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalReq(null)}
                className="px-4 py-2 border border-sand-neutral font-button-text text-xs uppercase font-medium text-secondary hover:text-onyx-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-5 py-2 bg-error text-on-error font-button-text text-xs uppercase font-bold hover:bg-red-800 cursor-pointer"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED ACCEPTANCE MODAL OVERLAY */}
      {confirmedModalData && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-onyx-black p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-onyx-black">
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
                <span className="font-label-caps text-xs uppercase tracking-wider font-bold">Confirmed Dispatch</span>
              </div>
              <h3 className="font-headline-md text-2xl text-onyx-black font-serif font-bold">Request Accepted</h3>
              <p className="font-body-md text-xs text-on-surface-variant">
                Route for Order {formatOrderRef(confirmedModalData.orderId || confirmedModalData.requestId)} accepted and added to Active Delivery panel. Dispatch window reserved.
              </p>
            </div>

            <div className="p-4 bg-bone-white border border-sand-neutral space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">Expected Pickup:</span>
                <span className="font-medium text-onyx-black">Under 10 mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Customer Contact:</span>
                <span className="font-medium text-onyx-black">Encrypted via App</span>
              </div>
              <div className="flex justify-between border-t border-sand-neutral pt-2">
                <span className="text-secondary">Guaranteed Payout:</span>
                <span className="font-bold text-onyx-black">₹{confirmedModalData.driverEarning || 165}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmedModalData(null);
                  if (onNavigateTab) onNavigateTab('active-delivery');
                }}
                className="px-6 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Proceed to Route
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
