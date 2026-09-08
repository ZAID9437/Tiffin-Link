import React, { useState, useEffect } from 'react';
import DriverSidebar from './DriverSidebar';
import GoogleDeliveryMap from '../components/GoogleDeliveryMap';
import { sendDriverLocationUpdate } from '../services/socket';

export default function DeliveryDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // GPS Watcher state
  const [gpsStatus, setGpsStatus] = useState({ status: 'INIT', message: '', coords: null });

  const partnerName = currentUser?.name || 'Rajesh Kumar';
  const partnerPhone = currentUser?.phone || '+91 98201 44821';
  const partnerId = currentUser?.id || currentUser?._id || 'TL-8041';

  // Fetch orders from MongoDB
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data.map(o => ({ ...o, id: o._id || o.id })));
      }
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Launch Turn-by-Turn GPS Navigation in Google Maps
  const handleOpenGoogleMapsNavigation = (destinationAddress) => {
    const encoded = encodeURIComponent(destinationAddress);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(mapsUrl, '_blank');
  };

  // Atomic Delivery Acceptance
  const handleAcceptDelivery = async (order) => {
    const dbId = order.id || order._id;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${dbId}/accept-delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerName, partnerPhone })
      });

      const json = await res.json();
      if (!json.success) {
        showToast(`⚠️ ${json.message || 'Delivery is no longer available!'}`);
        fetchOrders();
        return;
      }

      showToast(`✓ Accepted delivery for Order ${order.orderId || order.id}!`);
      fetchOrders();
      setActiveTab('active-delivery');
    } catch (err) {
      console.error('Error accepting delivery:', err);
      showToast('⚠️ Failed to accept delivery. Please try again.');
    }
  };

  // Update Delivery Status Stepper
  const handleUpdateDeliveryStatus = async (orderId, newDeliveryStatus) => {
    const targetOrder = orders.find(o => o.id === orderId || o._id === orderId || o.orderId === orderId);
    if (!targetOrder) return;
    const dbId = targetOrder.id || targetOrder._id;

    setOrders(prev => prev.map(o => (o.id === dbId || o._id === dbId || o.orderId === orderId) ? {
      ...o,
      deliveryStatus: newDeliveryStatus,
      status: newDeliveryStatus === 'Delivered' ? 'Completed' : o.status
    } : o));

    showToast(`✓ Status updated to ${newDeliveryStatus}`);

    try {
      await fetch(`http://localhost:5000/api/orders/${dbId}/delivery-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: newDeliveryStatus })
      });
      fetchOrders();
    } catch (err) {
      console.error('Error updating delivery status:', err);
    }
  };

  // Categorize orders
  const newDeliveries = orders.filter(o => 
    o.status === 'Ready' && 
    (o.deliveryStatus === 'Searching' || o.deliveryStatus === 'Unassigned' || !o.deliveryStatus)
  );

  const activeDeliveries = orders.filter(o => 
    (o.deliveryPartnerName === partnerName || o.deliveryPartnerName === currentUser?.name) && 
    ['Accepted', 'Arrived at Pickup', 'Picked Up', 'On The Way'].includes(o.deliveryStatus)
  );

  const activeDelivery = activeDeliveries[0] || null;

  const completedDeliveries = orders.filter(o => 
    (o.deliveryPartnerName === partnerName || o.deliveryPartnerName === currentUser?.name) && 
    (o.deliveryStatus === 'Delivered' || o.status === 'Completed')
  );

  const totalTodayEarnings = completedDeliveries.reduce((sum, o) => sum + (o.deliveryFee || 140), 1450);

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
          deliveryId: activeDelivery.orderId || activeDelivery.id,
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
            onClick={() => setIsOnline(!isOnline)}
            className={`px-2.5 py-1 text-[11px] font-label-caps uppercase font-bold flex items-center gap-1.5 ${
              isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-container-high text-secondary'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-secondary'}`} />
            <span>{isOnline ? 'Active' : 'Paused'}</span>
          </button>
        </div>
      </header>

      {/* Exact Driver Sidebar Component */}
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
          requests: newDeliveries.length || 3,
          active: activeDelivery ? 1 : 0,
          notifications: 3
        }}
      />

      {/* Main Content Area */}
      <div className="lg:pl-80 min-h-screen bg-surface">
        <main className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-12">
          <div className="flex flex-col w-full">

            {/* HEADER BANNER */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-sand-neutral mb-8">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block mb-2 text-[11px]">
                  Shift Overview • Live Session
                </span>
                <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-tight font-serif text-3xl sm:text-4xl">
                  Partner Dashboard
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl text-sm sm:text-base">
                  Welcome back, {partnerName.split(' ')[0]}. Your shift performance and live operations at a glance.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-surface-container-low p-2 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  id="toggleShiftBtn"
                  onClick={() => setIsOnline(!isOnline)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 transition-colors cursor-pointer ${
                    isOnline
                      ? 'bg-onyx-black text-on-primary'
                      : 'bg-surface-container-high text-onyx-black'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-surface-bright animate-pulse' : 'bg-secondary'}`} />
                  <span className="font-button-text text-button-text tracking-wider uppercase text-xs font-semibold">
                    {isOnline ? 'Shift Active' : 'Shift Paused'}
                  </span>
                </button>

                <a
                  onClick={(e) => { e.preventDefault(); setActiveTab('live-map'); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest text-onyx-black hover:bg-surface-container transition-colors cursor-pointer text-xs font-semibold"
                  href="#"
                >
                  <span className="material-symbols-outlined text-[18px]">map</span>
                  <span className="font-button-text text-button-text">Live Map</span>
                </a>

                <a
                  onClick={(e) => { e.preventDefault(); setActiveTab('safety-center'); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-surface-container-lowest text-error hover:bg-error-container transition-colors cursor-pointer text-xs font-semibold"
                  href="#"
                  title="Safety Assistance"
                >
                  <span className="material-symbols-outlined text-[18px]">emergency</span>
                  <span className="font-button-text text-button-text uppercase">SOS</span>
                </a>
              </div>
            </header>

            {/* METRICS CARDS ROW */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              
              {/* Card 1: Today's Earnings */}
              <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-44 shadow-xs hover:shadow-md transition-shadow border border-sand-neutral/50">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
                    Today's Earnings
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-2 font-serif text-3xl">
                    ₹{totalTodayEarnings.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant font-body-md text-[13px]">
                    <span className="material-symbols-outlined text-[16px] text-onyx-black">arrow_upward</span>
                    <span className="font-medium text-onyx-black">14%</span>
                    <span className="text-secondary ml-1">vs yesterday</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Completed Deliveries */}
              <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-44 shadow-xs hover:shadow-md transition-shadow border border-sand-neutral/50">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
                    Completed Deliveries
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-2 font-serif text-3xl">
                    {completedDeliveries.length > 0 ? completedDeliveries.length : 8} <span className="text-[18px] text-secondary font-light">/ 12</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1 mb-2 overflow-hidden">
                    <div className="bg-onyx-black h-full w-2/3 transition-all duration-500" />
                  </div>
                  <div className="flex items-center justify-between font-label-caps text-[11px] text-secondary">
                    <span>Target Progress</span>
                    <span className="text-onyx-black font-semibold">66%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Active Run */}
              <div className="bg-onyx-black text-on-primary p-6 flex flex-col justify-between h-44 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-sand-neutral tracking-wider text-[11px]">
                    Active Run
                  </span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-surface-bright opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-surface-bright" />
                  </span>
                </div>
                <div>
                  <div className="font-headline-md text-headline-md text-on-primary tracking-tight leading-none mb-2 font-serif text-3xl">
                    {activeDelivery ? '1 Active' : '0 Active'}
                  </div>
                  <p className="font-body-md text-[13px] text-sand-neutral line-clamp-1">
                    {activeDelivery
                      ? `${activeDelivery.customerName || 'Elena Vance'} • ${activeDelivery.customerAddress || 'Khar West'} (ETA 12m)`
                      : 'Elena Vance • Khar West (ETA 12m)'}
                  </p>
                </div>
              </div>

              {/* Card 4: Customer Rating */}
              <div className="bg-surface-container-lowest p-6 flex flex-col justify-between h-44 shadow-xs hover:shadow-md transition-shadow border border-sand-neutral/50">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px]">
                    Customer Rating
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">grade</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none font-serif text-3xl">
                      4.89
                    </span>
                    <span className="font-headline-md text-headline-md text-onyx-black leading-none text-2xl">★</span>
                  </div>
                  <p className="font-body-md text-[13px] text-secondary">
                    Calibrated from 240 rated runs
                  </p>
                </div>
              </div>

            </section>

            {/* MAIN TWO-COLUMN DASHBOARD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN (7 COLS) */}
              <div className="lg:col-span-7 flex flex-col gap-8">
                
                {/* Operational Dispatch Card */}
                <article className="bg-surface-container-lowest p-6 lg:p-8 shadow-xs border border-sand-neutral/50">
                  <div className="flex items-center justify-between pb-6 mb-6 bg-surface-container-low -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 p-6 lg:p-8">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary text-[11px]">
                        Operational Dispatch
                      </span>
                      <h2 className="font-headline-md text-headline-md text-onyx-black mt-1 font-serif text-2xl">
                        Active Trip In-Progress
                      </h2>
                    </div>
                    <span className="bg-onyx-black text-on-primary font-label-caps text-[11px] px-2.5 py-1 tracking-wider uppercase font-semibold">
                      Order #{activeDelivery?.orderId || 'TL-4492'}
                    </span>
                  </div>

                  {/* Stepper timeline */}
                  <div className="relative pl-6 space-y-6 my-4">
                    <div className="absolute left-2 top-2 bottom-3 w-px bg-sand-neutral" />
                    
                    {/* Pickup Node */}
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sand-neutral ring-4 ring-surface-container-lowest" />
                      <div>
                        <span className="font-label-caps text-label-caps uppercase text-secondary block text-[11px]">
                          Kitchen Pickup (Completed)
                        </span>
                        <p className="font-body-lg text-body-lg text-onyx-black font-medium mt-0.5 text-base">
                          {activeDelivery?.pickupAddress || "Nawab's Table"}
                        </p>
                        <p className="font-body-md text-[13px] text-on-surface-variant">
                          Pali Hill, Bandra West • Ready at 13:10
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-[20px]">restaurant</span>
                    </div>

                    {/* Dropoff Node */}
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-onyx-black ring-4 ring-surface-container-lowest" />
                      <div>
                        <span className="font-label-caps text-label-caps uppercase text-onyx-black font-semibold block text-[11px]">
                          Dropoff Destination
                        </span>
                        <p className="font-body-lg text-body-lg text-onyx-black font-medium mt-0.5 text-base">
                          {activeDelivery?.customerName || 'Elena Vance'}
                        </p>
                        <p className="font-body-md text-[13px] text-on-surface-variant">
                          {activeDelivery?.customerAddress || '402 Silver Arch, 14th Road, Khar West'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-onyx-black text-[20px]">person_pin_circle</span>
                    </div>
                  </div>

                  {/* Trip status strip */}
                  <div className="bg-surface-container-low p-4 my-6 flex flex-wrap items-center justify-between gap-4 border border-sand-neutral/30">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-onyx-black text-[24px]">directions_bike</span>
                      <div>
                        <p className="font-button-text text-button-text text-onyx-black font-medium">
                          Food Picked Up — On the way
                        </p>
                        <p className="font-body-md text-[13px] text-secondary">
                          Estimated Arrival in 12 mins • 2.4 km remaining
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-caps text-[10px] text-secondary uppercase block">Trip Payout</span>
                      <span className="font-headline-md text-[24px] text-onyx-black leading-none font-medium font-serif">
                        ₹{activeDelivery?.deliveryFee || 140}
                      </span>
                    </div>
                  </div>

                  {/* Trip Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenGoogleMapsNavigation(activeDelivery?.customerAddress || 'Khar West, Mumbai')}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-onyx-black text-on-primary hover:bg-primary-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">turn_right</span>
                      <span className="font-button-text text-button-text uppercase tracking-wider text-xs font-semibold">
                        Open Turn Navigation
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Calling Customer ${activeDelivery?.customerName || 'Elena Vance'} (+91 98201 44821)`)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-surface-container-high text-onyx-black hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      <span className="font-button-text text-button-text uppercase tracking-wider text-xs font-semibold">
                        Contact Customer
                      </span>
                    </button>
                  </div>
                </article>

                {/* Today's Completed Runs Ledger */}
                <section className="bg-surface-container-lowest p-6 lg:p-8 shadow-xs border border-sand-neutral/50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary text-[11px]">
                        Ledger
                      </span>
                      <h2 className="font-headline-md text-headline-md text-onyx-black font-serif text-2xl">
                        Today's Completed Runs
                      </h2>
                    </div>
                    <a
                      onClick={(e) => { e.preventDefault(); setActiveTab('completed-deliveries'); }}
                      className="font-button-text text-[13px] text-onyx-black underline hover:opacity-75 cursor-pointer font-medium"
                      href="#"
                    >
                      View Complete Log
                    </a>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md text-[14px]">
                      <thead>
                        <tr className="bg-surface-container-low text-secondary font-label-caps text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-3">Order ID</th>
                          <th className="py-3 px-3">Kitchen Source</th>
                          <th className="py-3 px-3">Drop Zone</th>
                          <th className="py-3 px-3 text-right">Time</th>
                          <th className="py-3 px-3 text-right">Payout</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high">
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-3 font-medium text-onyx-black">#TL-4487</td>
                          <td className="py-3.5 px-3">Bandra Bowl Co.</td>
                          <td className="py-3.5 px-3 text-on-surface-variant">Hill Road</td>
                          <td className="py-3.5 px-3 text-right text-secondary">12:35 PM</td>
                          <td className="py-3.5 px-3 text-right font-medium text-onyx-black">₹165</td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="inline-block bg-surface-container-high text-onyx-black font-label-caps text-[10px] px-2 py-0.5 uppercase font-semibold">
                              Delivered
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-3 font-medium text-onyx-black">#TL-4481</td>
                          <td className="py-3.5 px-3">Amma's South Tiffin</td>
                          <td className="py-3.5 px-3 text-on-surface-variant">Pali Naka</td>
                          <td className="py-3.5 px-3 text-right text-secondary">11:50 AM</td>
                          <td className="py-3.5 px-3 text-right font-medium text-onyx-black">₹140</td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="inline-block bg-surface-container-high text-onyx-black font-label-caps text-[10px] px-2 py-0.5 uppercase font-semibold">
                              Delivered
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-3 font-medium text-onyx-black">#TL-4476</td>
                          <td className="py-3.5 px-3">Dabba Republic</td>
                          <td className="py-3.5 px-3 text-on-surface-variant">Perry Cross</td>
                          <td className="py-3.5 px-3 text-right text-secondary">11:15 AM</td>
                          <td className="py-3.5 px-3 text-right font-medium text-onyx-black">₹190</td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="inline-block bg-surface-container-high text-onyx-black font-label-caps text-[10px] px-2 py-0.5 uppercase font-semibold">
                              Delivered
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3.5 px-3 font-medium text-onyx-black">#TL-4469</td>
                          <td className="py-3.5 px-3">Spice Route Gourmet</td>
                          <td className="py-3.5 px-3 text-on-surface-variant">Carter Road</td>
                          <td className="py-3.5 px-3 text-right text-secondary">10:28 AM</td>
                          <td className="py-3.5 px-3 text-right font-medium text-onyx-black">₹155</td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="inline-block bg-surface-container-high text-onyx-black font-label-caps text-[10px] px-2 py-0.5 uppercase font-semibold">
                              Delivered
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

              </div>

              {/* RIGHT COLUMN (5 COLS) */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                
                {/* Demand Hotspots Map Banner Card */}
                <div className="bg-surface-container-lowest p-6 lg:p-8 shadow-xs border border-sand-neutral/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary text-[11px]">
                        Demand Map
                      </span>
                      <h3 className="font-headline-md text-[26px] text-onyx-black leading-tight font-serif">
                        Live Demand Hotspots
                      </h3>
                    </div>
                    <span className="font-label-caps text-[11px] text-secondary">Real-Time</span>
                  </div>

                  {/* Interactive Map Visualizer */}
                  <div className="w-full h-52 bg-slate-900 rounded-lg overflow-hidden mb-5 relative flex flex-col justify-end">
                    <GoogleDeliveryMap
                      origin="Bandra West, Mumbai"
                      destination="Khar West, Mumbai"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-onyx-black/90 backdrop-blur-sm text-on-primary p-3 flex items-center justify-between z-10">
                      <div>
                        <span className="font-label-caps text-[10px] text-sand-neutral uppercase tracking-wider block">
                          Current Zone
                        </span>
                        <p className="font-button-text text-button-text text-on-primary font-medium text-sm">
                          Bandra-Khar Belt
                        </p>
                      </div>
                      <span className="bg-surface-bright text-onyx-black font-label-caps text-[11px] px-2 py-1 font-semibold uppercase">
                        +₹30 Surge
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container transition-colors border border-sand-neutral/30">
                      <div>
                        <p className="font-button-text text-[14px] text-onyx-black font-medium">
                          Bandra West (Pali Hill • Carter)
                        </p>
                        <p className="font-body-md text-[12px] text-secondary">
                          High lunch rush volume • 14 unassigned runs
                        </p>
                      </div>
                      <span className="bg-onyx-black text-on-primary font-label-caps text-[11px] px-2 py-1 font-semibold">
                        +₹30 / trip
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container transition-colors border border-sand-neutral/30">
                      <div>
                        <p className="font-button-text text-[14px] text-onyx-black font-medium">
                          Khar West • 14th - 17th Rd
                        </p>
                        <p className="font-body-md text-[12px] text-secondary">
                          Steady demand • 6 unassigned runs
                        </p>
                      </div>
                      <span className="bg-surface-container-high text-onyx-black font-label-caps text-[11px] px-2 py-1 font-semibold">
                        +₹25 / trip
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container transition-colors border border-sand-neutral/30">
                      <div>
                        <p className="font-button-text text-[14px] text-onyx-black font-medium">
                          Santacruz West (Station Road)
                        </p>
                        <p className="font-body-md text-[12px] text-secondary">
                          Emerging surge • 9 unassigned runs
                        </p>
                      </div>
                      <span className="bg-surface-container-high text-onyx-black font-label-caps text-[11px] px-2 py-1 font-semibold">
                        +₹20 / trip
                      </span>
                    </div>
                  </div>
                </div>

                {/* Incentive Program Progress Card */}
                <div className="bg-surface-container-lowest p-6 lg:p-8 shadow-xs border border-sand-neutral/50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary text-[11px]">
                        Incentive Program
                      </span>
                      <h3 className="font-headline-md text-[26px] text-onyx-black leading-tight font-serif">
                        Daily Target &amp; Incentives
                      </h3>
                    </div>
                    <span className="material-symbols-outlined text-onyx-black text-[24px]">military_tech</span>
                  </div>

                  <div className="bg-surface-container-low p-5 mb-5 border border-sand-neutral/30">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-label-caps text-label-caps uppercase text-secondary text-[11px]">
                        Afternoon Target
                      </span>
                      <span className="font-headline-md text-[22px] text-onyx-black font-serif">
                        8 of 12 trips
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 mb-3">
                      <div className="bg-onyx-black h-full w-[66.6%]" />
                    </div>
                    <div className="flex items-center justify-between font-body-md text-[13px]">
                      <span className="text-on-surface-variant">4 runs required before 4:00 PM</span>
                      <span className="font-medium text-onyx-black">Earn ₹300 Bonus</span>
                    </div>
                  </div>

                  <div className="space-y-3 font-body-md text-[13px]">
                    <div className="flex items-start justify-between py-2 border-b border-surface-container-high">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-onyx-black">check_box</span>
                        <span className="text-on-surface">Base Shift Completed (5 trips)</span>
                      </div>
                      <span className="font-medium text-onyx-black">+₹150 Unlocked</span>
                    </div>

                    <div className="flex items-start justify-between py-2 border-b border-surface-container-high">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">check_box_outline_blank</span>
                        <span className="text-on-surface">Peak Lunch Tier 2 (12 trips)</span>
                      </div>
                      <span className="text-secondary font-medium">+₹300 Pending</span>
                    </div>

                    <div className="flex items-start justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">check_box_outline_blank</span>
                        <span className="text-on-surface">Zero Cancellation Streak (100%)</span>
                      </div>
                      <span className="text-secondary font-medium">+₹100 EOD</span>
                    </div>
                  </div>

                  <a
                    onClick={(e) => { e.preventDefault(); setActiveTab('incentives-bonuses'); }}
                    className="block text-center mt-6 py-3 bg-surface-container-high text-onyx-black hover:bg-surface-container transition-colors font-button-text text-button-text uppercase tracking-wider text-xs font-semibold cursor-pointer"
                    href="#"
                  >
                    Explore Incentive Rules
                  </a>
                </div>

                {/* Partner Live Help Desk Card */}
                <div className="bg-surface-container-low p-6 flex items-center justify-between border border-sand-neutral/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-onyx-black text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">support_agent</span>
                    </div>
                    <div>
                      <p className="font-button-text text-button-text text-onyx-black font-medium text-sm">
                        Partner Desk Live
                      </p>
                      <p className="font-body-md text-[12px] text-secondary">
                        Average response time: &lt; 2 minutes
                      </p>
                    </div>
                  </div>
                  <a
                    onClick={(e) => { e.preventDefault(); setActiveTab('help-support'); }}
                    className="font-button-text text-[13px] text-onyx-black underline uppercase tracking-wider font-semibold cursor-pointer"
                    href="#"
                  >
                    Get Help
                  </a>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>

    </div>
  );
}
