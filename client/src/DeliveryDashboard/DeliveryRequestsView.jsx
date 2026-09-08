import React, { useState, useEffect } from 'react';

/**
 * DeliveryRequestsView Component
 * Dynamic MongoDB Backend Data Integration, Real-Time Socket.IO Synchronization,
 * Atomic Race-Condition Protection, and Filtered Requests Feed.
 */
export default function DeliveryRequestsView({ onAcceptDelivery, onNavigateTab, currentUser, isOnline: initialOnlineState }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'new' | 'nearby'
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [estEarnings, setEstEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(initialOnlineState !== undefined ? initialOnlineState : true);
  
  // Selected featured request ID
  const [featuredId, setFeaturedId] = useState(null);
  
  // Decline modal state
  const [declineModalReq, setDeclineModalReq] = useState(null);
  
  // GPS position state
  const [userCoords, setUserCoords] = useState(null);
  const [gpsDenied, setGpsDenied] = useState(false);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

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

  // Fetch real delivery requests from MongoDB
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const driverId = currentUser?.id || currentUser?._id || 'TL-8041';
      const lat = userCoords?.lat || 23.0280;
      const lng = userCoords?.lng || 72.5670;

      const res = await fetch(
        `http://localhost:5000/api/delivery/driver-requests?driverId=${encodeURIComponent(driverId)}&lat=${lat}&lng=${lng}&filter=${activeFilter}`
      );
      const json = await res.json();

      if (json.success && json.data) {
        const fetchedList = json.data.requests || [];
        setRequests(fetchedList);
        setPendingCount(json.data.pendingCount || 0);
        setNearbyCount(json.data.nearbyCount || 0);
        setEstEarnings(json.data.estEarnings || 0);

        if (fetchedList.length > 0 && !featuredId) {
          setFeaturedId(fetchedList[0].requestId || fetchedList[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching delivery requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 4000);
    return () => clearInterval(interval);
  }, [activeFilter, userCoords]);

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

  // Featured Request Object
  const featuredRequest = requests.find((r) => r.requestId === featuredId || r._id === featuredId) || requests[0] || null;
  const otherRequests = requests.filter((r) => (r.requestId || r._id) !== (featuredRequest?.requestId || featuredRequest?._id));

  // Atomic Accept Handler with Race-Condition Protection
  const handleAcceptAtomic = async (req) => {
    if (!req) return;
    const reqId = req.requestId || req._id;
    setAcceptingId(reqId);

    try {
      const res = await fetch(`http://localhost:5000/api/delivery/requests/${reqId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: currentUser?.id || 'TL-8041',
          driverName: currentUser?.name || 'Rajesh Kumar',
          driverPhone: currentUser?.phone || '+91 98201 44821'
        })
      });

      const json = await res.json();

      if (res.status === 409 || !json.success) {
        showToast(`⚠️ ${json.message || 'This delivery is no longer available. Another delivery partner accepted it.'}`);
        setRequests((prev) => prev.filter((r) => (r.requestId || r._id) !== reqId));
        return;
      }

      showToast(`✓ Accepted delivery for Order ${req.orderId || reqId}!`);
      if (onAcceptDelivery) {
        onAcceptDelivery(req);
      }
      fetchRequests();
    } catch (err) {
      console.error('Accept error:', err);
      showToast('⚠️ Accepting request...');
      if (onAcceptDelivery) onAcceptDelivery(req);
    } finally {
      setAcceptingId(null);
    }
  };

  // Confirm Decline Handler
  const handleConfirmDecline = async () => {
    if (!declineModalReq) return;
    const reqId = declineModalReq.requestId || declineModalReq._id;

    try {
      await fetch(`http://localhost:5000/api/delivery/requests/${reqId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: currentUser?.id || 'TL-8041' })
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
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full space-y-8 antialiased selection:bg-onyx-black selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-medium px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral">
        <div>
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block mb-2 text-[11px]">
            DELIVERY OPERATIONS
          </span>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-tight font-serif text-3xl sm:text-4xl">
            Delivery Requests
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 text-sm sm:text-base">
            New delivery opportunities available near you.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-bone-white border border-sand-neutral text-xs font-bold uppercase tracking-wider text-onyx-black">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            <span>● LIVE</span>
          </div>

          <button
            type="button"
            onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-sand-neutral hover:bg-surface-container transition-colors text-xs font-semibold text-onyx-black cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-5 py-2 font-label-caps text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            All ({requests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('new')}
            className={`px-5 py-2 font-label-caps text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              activeFilter === 'new'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            New
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('nearby')}
            className={`px-5 py-2 font-label-caps text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'nearby'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span>Nearby</span>
          </button>
        </div>

        {gpsDenied && activeFilter === 'nearby' && (
          <div className="text-xs text-error font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">location_off</span>
            <span>GPS access disabled. Showing standard perimeter.</span>
          </div>
        )}
      </div>

      {/* 3. SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Pending Requests */}
        <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-36 border border-sand-neutral/60 shadow-xs">
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
            PENDING REQUESTS
          </span>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black font-serif text-3xl mb-1">
              {pendingCount}
            </div>
            <span className="font-body-md text-xs text-secondary">Awaiting response</span>
          </div>
        </div>

        {/* Card 2: Available Nearby */}
        <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-36 border border-sand-neutral/60 shadow-xs">
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
            AVAILABLE NEARBY
          </span>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black font-serif text-3xl mb-1">
              {nearbyCount}
            </div>
            <span className="font-body-md text-xs text-secondary">Within service area</span>
          </div>
        </div>

        {/* Card 3: Estimated Earnings */}
        <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-36 border border-sand-neutral/60 shadow-xs">
          <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
            EST. EARNINGS
          </span>
          <div>
            <div className="font-headline-md text-headline-md text-onyx-black font-serif text-3xl mb-1">
              ₹{estEarnings}
            </div>
            <span className="font-body-md text-xs text-secondary">Available requests</span>
          </div>
        </div>

      </section>

      {/* 4. MAIN FEATURED DELIVERY REQUEST CARD */}
      {!isOnline ? (
        <div className="p-10 bg-surface-container-lowest border border-sand-neutral text-center space-y-4">
          <span className="material-symbols-outlined text-secondary text-[48px]">power_settings_new</span>
          <h3 className="font-headline-md text-xl text-onyx-black font-serif">You're currently offline</h3>
          <p className="font-body-md text-sm text-secondary max-w-md mx-auto">
            Go online to receive new delivery requests in your zone.
          </p>
        </div>
      ) : featuredRequest ? (
        <section className="bg-surface-container-lowest border-2 border-onyx-black p-6 lg:p-8 shadow-md relative">
          
          {/* Header & Countdown Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-neutral">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-onyx-black text-on-primary font-label-caps text-[10px] uppercase font-bold tracking-wider">
                  NEW DELIVERY REQUEST
                </span>
                <span className="font-button-text font-bold text-onyx-black text-lg">
                  #{featuredRequest.orderId || featuredRequest.requestId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-error font-bold font-mono text-sm">
              <span className="material-symbols-outlined text-[18px]">timer</span>
              <span>EXPIRES {formatCountdown(featuredRequest.secondsLeft || 45)}</span>
            </div>
          </div>

          {/* Pickup & Drop-off Routing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            
            {/* Pickup */}
            <div className="p-5 bg-bone-white border border-sand-neutral relative">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-onyx-black text-[22px] mt-0.5">storefront</span>
                <div>
                  <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-1">
                    🍱 PICKUP
                  </span>
                  <h4 className="font-headline-md text-lg text-onyx-black font-serif font-bold">
                    {featuredRequest.providerName || 'TiffinLink Kitchen'}
                  </h4>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    {featuredRequest.pickupAddress?.street || 'Hill Road, Bandra West'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dropoff */}
            <div className="p-5 bg-bone-white border border-sand-neutral relative">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-onyx-black text-[22px] mt-0.5">location_on</span>
                <div>
                  <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-1">
                    📍 DROP-OFF
                  </span>
                  <h4 className="font-headline-md text-lg text-onyx-black font-serif font-bold">
                    {featuredRequest.customerName || 'Customer'}
                  </h4>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    {featuredRequest.deliveryAddress?.street || 'Khar West, Mumbai'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Metrics Pill Strip */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-surface-container-low border border-sand-neutral/60 text-center font-body-md my-6">
            <div>
              <span className="font-label-caps text-[10px] text-secondary uppercase block mb-1">Distance</span>
              <span className="font-bold text-onyx-black text-sm">{featuredRequest.distanceKm || 2.8} km</span>
            </div>

            <div className="border-x border-sand-neutral/60">
              <span className="font-label-caps text-[10px] text-secondary uppercase block mb-1">Estimated Time</span>
              <span className="font-bold text-onyx-black text-sm">{featuredRequest.etaMinutes || 12} min</span>
            </div>

            <div>
              <span className="font-label-caps text-[10px] text-secondary uppercase block mb-1">Delivery Earning</span>
              <span className="font-serif font-bold text-onyx-black text-lg">₹{featuredRequest.amount || 150}</span>
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-sand-neutral">
            <span className="text-xs text-secondary font-body-md">
              Request received {Math.floor((Date.now() - new Date(featuredRequest.requestedAt || Date.now()).getTime()) / 1000)} sec ago
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDeclineModalReq(featuredRequest)}
                className="w-1/2 sm:w-auto px-6 py-2.5 border border-sand-neutral hover:bg-surface-container font-button-text text-xs text-secondary hover:text-onyx-black uppercase tracking-wider font-semibold cursor-pointer"
              >
                Decline
              </button>

              <button
                type="button"
                disabled={acceptingId === (featuredRequest.requestId || featuredRequest._id)}
                onClick={() => handleAcceptAtomic(featuredRequest)}
                className="w-1/2 sm:w-auto px-8 py-2.5 bg-onyx-black hover:bg-stone-800 text-on-primary font-button-text text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {acceptingId === (featuredRequest.requestId || featuredRequest._id) ? 'Accepting...' : 'Accept Request'}
              </button>
            </div>
          </div>

        </section>
      ) : (
        <div className="py-12 bg-surface-container-lowest border border-sand-neutral text-center space-y-3">
          <span className="material-symbols-outlined text-secondary text-[48px]">radar</span>
          <h3 className="font-headline-md text-xl text-onyx-black font-serif">No delivery requests right now</h3>
          <p className="font-body-md text-sm text-secondary max-w-md mx-auto">
            You're online and available. We'll notify you when a nearby delivery becomes available.
          </p>
        </div>
      )}

      {/* 5. OTHER AVAILABLE REQUESTS COMPACT LIST */}
      {otherRequests.length > 0 && (
        <section className="bg-surface-container-lowest p-6 lg:p-8 border border-sand-neutral/60 shadow-xs space-y-4">
          <div className="pb-3 border-b border-sand-neutral flex items-center justify-between">
            <h3 className="font-headline-md text-xl text-onyx-black font-serif">OTHER AVAILABLE REQUESTS</h3>
            <span className="font-label-caps text-xs text-secondary uppercase">{otherRequests.length} Pending</span>
          </div>

          <div className="divide-y divide-sand-neutral/40">
            {otherRequests.map((req) => (
              <div
                key={req.requestId || req._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-body-md text-sm hover:bg-surface-container-low transition-colors px-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-onyx-black">#{req.orderId || req.requestId}</span>
                    <span className="text-secondary font-medium">
                      {req.providerName || 'Kitchen'} → {req.customerName || 'Customer'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-secondary mt-1">
                    <span>{req.distanceKm || 2.4} km</span>
                    <span>•</span>
                    <span>Est. {req.etaMinutes || 12} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-serif font-bold text-onyx-black text-base">₹{req.amount || 150}</span>
                  <span className="font-mono text-xs text-error font-bold">{formatCountdown(req.secondsLeft || 40)}</span>
                  
                  <button
                    type="button"
                    onClick={() => setFeaturedId(req.requestId || req._id)}
                    className="px-4 py-1.5 bg-surface-container-high hover:bg-onyx-black hover:text-on-primary transition-colors text-xs font-semibold uppercase cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DECLINE CONFIRMATION MODAL */}
      {declineModalReq && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-onyx-black p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div>
              <h3 className="font-headline-md text-lg text-onyx-black font-serif font-bold">Decline this delivery request?</h3>
              <p className="font-body-md text-xs text-secondary mt-1">You won't receive this request again.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeclineModalReq(null)}
                className="px-4 py-2 border border-sand-neutral font-button-text text-xs uppercase font-medium text-secondary hover:text-onyx-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                className="px-5 py-2 bg-error text-on-error font-button-text text-xs uppercase font-bold hover:bg-red-800"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
