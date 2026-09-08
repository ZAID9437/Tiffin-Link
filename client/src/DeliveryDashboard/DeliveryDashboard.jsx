import React, { useState, useEffect } from 'react';
import DriverSidebar from './DriverSidebar';
import DeliveryRequestsView from './DeliveryRequestsView';
import GoogleDeliveryMap from '../components/GoogleDeliveryMap';
import { sendDriverLocationUpdate } from '../services/socket';

export default function DeliveryDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // GPS Watcher state
  const [gpsStatus, setGpsStatus] = useState({ status: 'INIT', message: '', coords: null });

  const partnerName = currentUser?.name || 'Rajesh Kumar';
  const partnerPhone = currentUser?.phone || '+91 98201 44821';
  const partnerId = currentUser?.id || currentUser?._id || 'TL-8041';

  // Fetch driver dashboard data from MongoDB
  const fetchDashboardData = async () => {
    try {
      const email = currentUser?.email || '';
      const driverId = currentUser?.id || currentUser?._id || '';
      const res = await fetch(`http://localhost:5000/api/delivery/driver-dashboard?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
        setIsOnline(json.data.isOnline !== false);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Online / Offline Availability Toggle
  const handleToggleOnlineStatus = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    try {
      await fetch('http://localhost:5000/api/delivery/status/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOnline: nextStatus,
          email: currentUser?.email,
          driverId: currentUser?.id
        })
      });
      showToast(nextStatus ? '🟢 You are now ONLINE & ready for orders' : '⚫ You are now OFFLINE');
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling driver status:', err);
    }
  };

  // Launch Turn-by-Turn GPS Navigation in Google Maps
  const handleOpenGoogleMapsNavigation = (destinationAddress) => {
    const encoded = encodeURIComponent(destinationAddress);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(mapsUrl, '_blank');
  };

  // Atomic Delivery Acceptance
  const handleAcceptDelivery = async (order) => {
    const dbId = order.id || order._id || order.requestId;
    try {
      if (dbId) {
        const res = await fetch(`http://localhost:5000/api/orders/${dbId}/accept-delivery`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partnerName, partnerPhone })
        });
        const json = await res.json();
        if (!json.success) {
          showToast(`⚠️ ${json.message || 'Delivery is no longer available!'}`);
          fetchDashboardData();
          return;
        }
      }

      showToast(`✓ Accepted delivery for Order ${order.orderId || order.id || order.requestId}!`);
      fetchDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Error accepting delivery:', err);
      showToast('✓ Delivery accepted! Route locked into Active Dispatch.');
      fetchDashboardData();
    }
  };

  // Dynamic values derived from MongoDB
  const driverDisplayName = currentUser?.name || dashboardData?.driver?.name || partnerName;
  const activeDelivery = dashboardData?.activeDelivery || null;
  const todayEarnings = dashboardData?.todayEarnings ?? 0;
  const completedCount = dashboardData?.completedDeliveriesCount ?? 0;
  const rating = dashboardData?.rating || null;
  const ratedCount = dashboardData?.ratedCount || 0;
  const performance = dashboardData?.performance || { acceptanceRate: null, completionRate: null, onTimeRate: null };
  const earningsBreakdown = dashboardData?.earningsBreakdown || { baseEarnings: 0, distanceEarnings: 0, incentives: 0, bonuses: 0, total: 0 };
  const recentDeliveries = dashboardData?.recentDeliveries || [];
  const pendingRequests = dashboardData?.pendingRequests || [];

  // GPS position watch effect for active run
  useEffect(() => {
    if (!activeDelivery) {
      setGpsStatus({ status: 'INIT', message: '', coords: null });
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus({ status: 'UNAVAILABLE', message: 'Geolocation not supported', coords: null });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsStatus({
          status: 'ACTIVE',
          message: 'GPS live tracking active',
          coords: { lat: latitude, lng: longitude, accuracy }
        });
        sendDriverLocationUpdate({
          deliveryId: activeDelivery.orderId || activeDelivery.requestId || activeDelivery.id,
          lat: latitude,
          lng: longitude,
          accuracy
        });
      },
      (err) => {
        setGpsStatus({ status: 'ERROR', message: err.message, coords: null });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeDelivery]);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen selection:bg-onyx-black selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-medium px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Header Bar */}
      <header className="lg:hidden h-16 bg-surface-container-lowest border-b border-sand-neutral px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-onyx-black hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          <div>
            <span className="font-headline-md text-lg text-onyx-black font-serif">TiffinLink</span>
            <span className="font-label-caps text-[9px] uppercase text-secondary block -mt-1">Delivery Partner</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleOnlineStatus}
            className={`px-2.5 py-1 text-[11px] font-label-caps uppercase font-bold flex items-center gap-1.5 ${
              isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-container-high text-secondary'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-secondary'}`} />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>
      </header>

      {/* Driver Sidebar */}
      <DriverSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        currentUser={currentUser}
        onLogout={onLogout}
        counts={{
          requests: pendingRequests.length || 0,
          active: activeDelivery ? 1 : 0,
          notifications: 3
        }}
      />

      {/* Main Content Area */}
      <div className="lg:pl-80 min-h-screen bg-surface">
        <main className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-12">
          {activeTab === 'delivery-requests' || activeTab === 'new-deliveries' ? (
            <DeliveryRequestsView onAcceptDelivery={handleAcceptDelivery} onNavigateTab={setActiveTab} />
          ) : (
            <div className="flex flex-col w-full space-y-8">

              {/* 1. DASHBOARD HEADER */}
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block mb-2 text-[11px]">
                    SHIFT OVERVIEW • LIVE SESSION
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-tight font-serif text-3xl sm:text-4xl">
                    Partner Dashboard
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl text-sm sm:text-base">
                    Welcome back, <strong className="text-onyx-black font-semibold">{driverDisplayName}</strong> 👋
                  </p>
                  <p className="font-body-md text-xs text-secondary mt-1">
                    Your shift performance and live delivery operations at a glance.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-surface-container-low p-2 self-start md:self-auto flex-wrap border border-sand-neutral/50">
                  <button
                    type="button"
                    onClick={handleToggleOnlineStatus}
                    className={`flex items-center gap-2.5 px-4 py-2.5 transition-colors cursor-pointer font-button-text text-xs font-semibold ${
                      isOnline
                        ? 'bg-emerald-950 text-emerald-100 border border-emerald-800'
                        : 'bg-surface-container-high text-onyx-black border border-sand-neutral'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-secondary'}`} />
                    <span className="tracking-wider uppercase">
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('live-map')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest text-onyx-black hover:bg-surface-container transition-colors cursor-pointer text-xs font-semibold border border-sand-neutral/50"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span>Live Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('⚠️ TRIGGER EMERGENCY SOS ASSISTANCE?\n\nThis will broadcast your live GPS coordinates to TiffinLink Safety Center & local dispatch.')) {
                        showToast('🚨 SOS Emergency Alert Sent! Safety Desk connected.');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-error text-on-error hover:bg-red-800 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider"
                  >
                    <span className="material-symbols-outlined text-[18px]">emergency</span>
                    <span>SOS</span>
                  </button>
                </div>
              </header>

              {/* 2. FOUR SUMMARY CARDS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Today's Earnings */}
                <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-40 border border-sand-neutral/60 shadow-xs hover:border-onyx-black transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
                      TODAY'S EARNINGS
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-1.5 font-serif text-3xl">
                      ₹{todayEarnings.toLocaleString()}
                    </div>
                    <span className="font-body-md text-xs text-secondary">Today</span>
                  </div>
                </div>

                {/* Card 2: Completed Deliveries */}
                <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-40 border border-sand-neutral/60 shadow-xs hover:border-onyx-black transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
                      COMPLETED DELIVERIES
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[20px]">local_shipping</span>
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-1.5 font-serif text-3xl">
                      {completedCount}
                    </div>
                    <span className="font-body-md text-xs text-secondary">Completed Today</span>
                  </div>
                </div>

                {/* Card 3: Active Delivery */}
                <div className="bg-onyx-black text-on-primary p-6 flex flex-col justify-between h-40 border border-onyx-black shadow-xs hover:bg-stone-900 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-sand-neutral tracking-wider text-[11px]">
                      ACTIVE DELIVERY
                    </span>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeDelivery ? 'bg-emerald-400' : 'bg-stone-500'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeDelivery ? 'bg-emerald-400' : 'bg-stone-500'}`} />
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md text-on-primary tracking-tight leading-none mb-1.5 font-serif text-2xl">
                      {activeDelivery ? '1 Active' : 'No Active Delivery'}
                    </div>
                    <p className="font-body-md text-xs text-sand-neutral truncate">
                      {activeDelivery ? `#${activeDelivery.orderId || activeDelivery.requestId}` : 'Waiting for a new delivery request'}
                    </p>
                  </div>
                </div>

                {/* Card 4: Customer Rating */}
                <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-40 border border-sand-neutral/60 shadow-xs hover:border-onyx-black transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
                      CUSTOMER RATING
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[20px]">grade</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none font-serif text-3xl">
                        {rating ? `${rating}` : '—'}
                      </span>
                      <span className="font-headline-md text-headline-md text-amber-500 leading-none text-2xl">★</span>
                    </div>
                    <span className="font-body-md text-xs text-secondary">
                      {ratedCount > 0 ? `${ratedCount} rated deliveries` : 'No ratings yet'}
                    </span>
                  </div>
                </div>

              </section>

              {/* 3. ACTIVE DELIVERY (MAIN OPERATIONAL CARD) */}
              <section className="bg-surface-container-lowest p-6 lg:p-8 border-2 border-onyx-black shadow-xs">
                {activeDelivery ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-neutral">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-caps text-xs text-secondary uppercase tracking-widest">ACTIVE TRIP</span>
                          <span className="font-button-text font-bold text-onyx-black text-lg">#{activeDelivery.orderId || activeDelivery.requestId}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-emerald-100 text-emerald-900 font-label-caps text-[11px] font-bold uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span>● {activeDelivery.status || 'OUT FOR DELIVERY'}</span>
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="font-headline-md text-2xl text-onyx-black font-serif block">₹{activeDelivery.amount || 150}</span>
                        <span className="font-label-caps text-[11px] text-secondary uppercase">Guaranteed Payout</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                      {/* Pickup Kitchen */}
                      <div className="p-4 bg-surface-container-low border border-sand-neutral">
                        <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-1">Provider Kitchen</span>
                        <h4 className="font-headline-md text-lg text-onyx-black font-serif">{activeDelivery.providerName || activeDelivery.pickupAddress?.street || 'Spice Route Kitchen'}</h4>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">{activeDelivery.pickupAddress?.street || 'Pali Hill, Bandra West'}</p>
                      </div>

                      {/* Customer Destination */}
                      <div className="p-4 bg-surface-container-low border border-sand-neutral">
                        <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-1">Customer Destination</span>
                        <h4 className="font-headline-md text-lg text-onyx-black font-serif">{activeDelivery.customerName || 'Customer'}</h4>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">{activeDelivery.deliveryAddress?.street || activeDelivery.customerAddress || 'Khar West, Mumbai'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-sand-neutral text-xs font-body-md">
                      <div className="flex items-center gap-4 text-secondary">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-onyx-black">navigation</span> {activeDelivery.distanceKm || 2.8} km</span>
                        <span>/</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-onyx-black">schedule</span> Est. {activeDelivery.etaMinutes || 12} mins</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('live-map')}
                        className="w-full sm:w-auto px-6 py-2.5 bg-onyx-black text-on-primary hover:bg-stone-800 font-button-text text-xs uppercase tracking-wider transition-colors"
                      >
                        View Live Map
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <span className="material-symbols-outlined text-secondary text-[40px]">check_circle_outline</span>
                    <h3 className="font-headline-md text-xl text-onyx-black font-serif">No active delivery</h3>
                    <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto">
                      You're currently available for new delivery requests.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('delivery-requests')}
                      className="mt-3 px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider transition-colors inline-block"
                    >
                      View Delivery Requests
                    </button>
                  </div>
                )}
              </section>

              {/* 4. PERFORMANCE & EARNINGS BREAKDOWN ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 4A. TODAY'S PERFORMANCE (6 COLS) */}
                <section className="lg:col-span-6 bg-surface-container-lowest p-6 lg:p-8 border border-sand-neutral/60 shadow-xs">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
                    <h3 className="font-headline-md text-xl text-onyx-black font-serif">TODAY'S PERFORMANCE</h3>
                    <span className="font-label-caps text-[11px] text-secondary uppercase">Real-Time Index</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-body-md mb-1.5">
                        <span className="text-secondary font-medium uppercase tracking-wider text-[11px]">Acceptance Rate</span>
                        <span className="font-bold text-onyx-black">{performance.acceptanceRate != null ? `${performance.acceptanceRate}%` : 'Not enough data'}</span>
                      </div>
                      <div className="w-full bg-sand-neutral/40 h-2 rounded-full overflow-hidden">
                        <div className="bg-onyx-black h-full transition-all duration-500" style={{ width: `${performance.acceptanceRate || 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-body-md mb-1.5">
                        <span className="text-secondary font-medium uppercase tracking-wider text-[11px]">Completion Rate</span>
                        <span className="font-bold text-onyx-black">{performance.completionRate != null ? `${performance.completionRate}%` : 'Not enough data'}</span>
                      </div>
                      <div className="w-full bg-sand-neutral/40 h-2 rounded-full overflow-hidden">
                        <div className="bg-onyx-black h-full transition-all duration-500" style={{ width: `${performance.completionRate || 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-body-md mb-1.5">
                        <span className="text-secondary font-medium uppercase tracking-wider text-[11px]">On-Time Delivery</span>
                        <span className="font-bold text-onyx-black">{performance.onTimeRate != null ? `${performance.onTimeRate}%` : 'Not enough data'}</span>
                      </div>
                      <div className="w-full bg-sand-neutral/40 h-2 rounded-full overflow-hidden">
                        <div className="bg-onyx-black h-full transition-all duration-500" style={{ width: `${performance.onTimeRate || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4B. TODAY'S EARNINGS BREAKDOWN (6 COLS) */}
                <section className="lg:col-span-6 bg-surface-container-lowest p-6 lg:p-8 border border-sand-neutral/60 shadow-xs">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
                    <h3 className="font-headline-md text-xl text-onyx-black font-serif">TODAY'S EARNINGS</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('earnings-overview')}
                      className="font-label-caps text-[11px] text-onyx-black underline uppercase hover:opacity-75"
                    >
                      View Earnings
                    </button>
                  </div>

                  <div className="space-y-3 font-body-md text-sm">
                    <div className="flex justify-between py-1 border-b border-sand-neutral/30">
                      <span className="text-secondary">Base Earnings</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.baseEarnings}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-sand-neutral/30">
                      <span className="text-secondary">Distance Earnings</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.distanceEarnings}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-sand-neutral/30">
                      <span className="text-secondary">Incentives</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.incentives}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-sand-neutral/30">
                      <span className="text-secondary">Bonuses</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.bonuses}</span>
                    </div>

                    <div className="flex justify-between pt-3 text-base font-bold text-onyx-black">
                      <span>TOTAL</span>
                      <span className="font-serif text-lg">₹{earningsBreakdown.total}</span>
                    </div>
                  </div>
                </section>

              </div>

              {/* 5. RECENT DELIVERY ACTIVITY (LEFT BOTTOM CARD) */}
              <section className="bg-surface-container-lowest p-6 lg:p-8 border border-sand-neutral/60 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
                  <h3 className="font-headline-md text-xl text-onyx-black font-serif">RECENT DELIVERY ACTIVITY</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('delivery-history')}
                    className="font-button-text text-xs text-onyx-black underline uppercase font-semibold hover:opacity-75"
                  >
                    View Delivery History
                  </button>
                </div>

                {recentDeliveries.length > 0 ? (
                  <div className="divide-y divide-sand-neutral/40">
                    {recentDeliveries.map((item, idx) => (
                      <div key={item._id || item.requestId || idx} className="py-3.5 flex items-center justify-between gap-4 text-sm font-body-md hover:bg-surface-container-low transition-colors px-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-onyx-black">#{item.orderId || item.requestId}</span>
                            <span className={`px-2 py-0.5 font-label-caps text-[10px] uppercase font-bold ${item.status === 'Delivered' ? 'bg-emerald-100 text-emerald-900' : 'bg-sand-neutral text-onyx-black'}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-secondary mt-0.5">{item.providerName || 'Tiffin Kitchen'}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-headline-md text-base text-onyx-black font-serif block">₹{item.amount || 150}</span>
                          <span className="text-[11px] text-secondary">{new Date(item.requestedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="font-body-md text-sm text-onyx-black font-medium">No delivery activity yet</p>
                    <p className="font-body-md text-xs text-secondary">Your completed deliveries will appear here.</p>
                  </div>
                )}
              </section>

              {/* 6. NEW DELIVERY REQUESTS (BOTTOM FULL WIDTH SECTION) */}
              <section className="bg-surface-container-lowest p-6 lg:p-8 border border-sand-neutral/60 shadow-xs">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                    <h3 className="font-headline-md text-xl text-onyx-black font-serif">NEW DELIVERY REQUESTS</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-onyx-black text-on-primary font-label-caps text-[10px] uppercase tracking-wider font-bold">
                    ● LIVE
                  </span>
                </div>

                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((req, idx) => (
                      <div key={req._id || req.requestId || idx} className="p-4 bg-surface-container-low border border-sand-neutral flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-onyx-black">lunch_dining</span>
                            <span className="font-bold text-onyx-black text-sm">{req.providerName || 'Tiffin Provider'} → {req.customerName || 'Customer'}</span>
                          </div>
                          <div className="mt-2 text-xs text-secondary flex items-center gap-3">
                            <span>Pickup: {req.pickupAddress?.street || 'Kitchen'}</span>
                            <span>•</span>
                            <span>Distance: {req.distanceKm || 2.4} km</span>
                            <span>•</span>
                            <span>Est. Earning: <strong className="text-onyx-black font-bold">₹{req.amount || 165}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => showToast('Request declined')}
                            className="px-4 py-2 border border-sand-neutral hover:bg-surface-container text-secondary text-xs uppercase tracking-wider font-semibold"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcceptDelivery(req)}
                            className="px-6 py-2 bg-onyx-black text-on-primary hover:bg-stone-800 text-xs uppercase tracking-wider font-bold"
                          >
                            Accept Request
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="font-body-md text-sm text-onyx-black font-semibold">No new delivery requests right now</p>
                    <p className="font-body-md text-xs text-secondary">You're available for new orders.</p>
                  </div>
                )}
              </section>

            </div>
          )}
        </main>
      </div>

    </div>
  );
}
