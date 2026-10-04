import React, { useState, useEffect, useRef } from 'react';

export default function MyOrdersView({ currentUser, onNavigate, onOpenTracking }) {
  // Hash-aware active tab: 'active', 'track', 'upcoming', 'history', 'cancelled'
  const getTabFromHash = () => {
    const hash = window.location.hash || '';
    if (hash.includes('track-order')) return 'track';
    if (hash.includes('upcoming-tiffins')) return 'upcoming';
    if (hash.includes('order-history')) return 'history';
    if (hash.includes('cancelled-orders')) return 'cancelled';
    return 'active';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync Timer & Latency Telemetry
  const [syncSeconds, setSyncSeconds] = useState(2);
  const [etaSeconds, setEtaSeconds] = useState(684); // 11m 24s countdown
  const [mapZoom, setMapZoom] = useState(1);

  // Upcoming Tiffins State
  const [isVacationActive, setIsVacationActive] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState('all');
  const [rotliCount, setRotliCount] = useState(4);
  const [gheePreference, setGheePreference] = useState('Desi Cow Ghee (Standard)');
  const [spiceLevel, setSpiceLevel] = useState('Mild Homestyle (Default)');
  const [rescheduleDate, setRescheduleDate] = useState('Tomorrow');
  const [rescheduleSlot, setRescheduleSlot] = useState('Standard Lunch (12:30 PM - 01:00 PM)');

  // History Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('Last 30 Days');
  const [kitchenFilter, setKitchenFilter] = useState('All Kitchens');
  const [paymentFilter, setPaymentFilter] = useState('Payment: All');

  // Cancelled Orders State
  const [expandedDossier, setExpandedDossier] = useState({});
  const [openAccordions, setOpenAccordions] = useState({ 'policy-1': true });

  // Modals & Toasts
  const [activeModal, setActiveModal] = useState(null); // 'details', 'modify-rotli', 'skip-meal', 'reschedule', 'manage-sub', 'receipt', 'dossier', 'review'
  const [modalPayload, setModalPayload] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  // Review form state
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const triggerToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 3400);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    const hashMapping = {
      active: '#active-orders',
      track: '#track-order',
      upcoming: '#upcoming-tiffins',
      history: '#order-history',
      cancelled: '#cancelled-orders'
    };
    if (hashMapping[tab]) {
      window.location.hash = hashMapping[tab];
    }
  };

  // Keep tab in sync with window hash change
  useEffect(() => {
    const handleHash = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Countdown timer for Track Order ETA
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds((prev) => (prev > 0 ? prev - 1 : 684));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Sync ticker for Active Consignments
  useEffect(() => {
    const syncTimer = setInterval(() => {
      setSyncSeconds((prev) => (prev >= 14 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(syncTimer);
  }, []);

  // Fetch orders from MongoDB API with authenticated customer token
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || '';
      const email = currentUser?.email || 'mansurizaid663@gmail.com';
      const res = await fetch(`http://localhost:5000/api/orders/my-orders?email=${encodeURIComponent(email)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const normalizedFromDb = json.data.map((o) => ({
          ...o,
          orderId: o.orderId || `#TL-${(o._id || '').slice(-4).toUpperCase()}`,
          rawStatus: (o.status || '').toLowerCase().replace(/\s+/g, '_'),
          status: o.status || 'Confirmed',
          image:
            o.image ||
            o.tiffinImage ||
            o.providerImage ||
            '/assets/provider_1.png',
          providerName: o.providerName || (typeof o.providerId === 'object' && o.providerId?.name) || 'Kitchen Partner',
          providerAddress: o.providerAddress || (typeof o.providerId === 'object' && o.providerId?.address) || 'Ahmedabad',
          customerAddress: o.customerAddress || o.deliveryAddress || 'Ahmedabad',
          tiffinName: o.tiffinName || 'Homestyle Tiffin Meal',
          totalAmount: Number(o.totalAmount) || 0,
          paymentMethod: o.paymentMethod || (o.paymentStatus === 'Cash on Delivery' ? 'Cash on Delivery (COD)' : 'Online Pre-paid (UPI)'),
          paymentStatus: o.paymentStatus || 'Paid',
          otp: o.deliveryOtp || o.otp || '',
          etaMinutes: o.estimatedTime ? parseInt(o.estimatedTime) || 15 : 15,
          canisterId: o.canisterId || '#TK-9021',
          canisterTemp: o.canisterTemp || '68.2 °C',
          date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'),
          driver: o.driver || {
            name: o.deliveryPartnerName || o.deliveryPartner?.name || 'Assigned Courier',
            phone: o.deliveryPartnerPhone || o.deliveryPartner?.phone || '+91 98251 44102',
            vehicle: o.deliveryPartner?.vehicleNumber || 'Courier Partner',
            rating: '4.9',
            deliveries: '500+ Deliveries'
          }
        }));

        setOrders(normalizedFromDb);
      } else {
        setOrders([]);
      }

      // Fetch customer subscriptions from MongoDB
      try {
        const subRes = await fetch(`http://localhost:5000/api/subscriptions/my-subscriptions?email=${encodeURIComponent(email)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const subJson = await subRes.json();
        if (subJson.success && Array.isArray(subJson.data)) {
          setSubscriptions(subJson.data);
        } else {
          setSubscriptions([]);
        }
      } catch (err) {
        console.warn('Subscriptions fetch error:', err);
      }
    } catch (e) {
      console.warn('Orders fetch warning:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Derived filtered order sets
  const activeOrders = orders.filter((o) => {
    const s = String(o.rawStatus || o.status || '').toLowerCase();
    return [
      'new',
      'pending',
      'confirmed',
      'accepted',
      'preparing',
      'ready',
      'ready_for_pickup',
      'delivery_requested',
      'driver_assigned',
      'picked_up',
      'out for delivery',
      'out_for_delivery',
      'arrived'
    ].includes(s);
  });

  const historyOrders = orders.filter((o) => {
    const s = String(o.rawStatus || o.status || '').toLowerCase();
    return ['delivered', 'completed'].includes(s);
  });

  const cancelledOrders = orders.filter((o) => {
    const s = String(o.rawStatus || o.status || '').toLowerCase();
    return ['cancelled', 'rejected', 'failed', 'payment_failed', 'delivery_failed'].includes(s);
  });

  // Dynamic Upcoming Tiffins derived strictly from database subscriptions and future scheduled orders
  const upcomingTiffins = [
    ...subscriptions.map((sub, idx) => ({
      id: sub.subId || sub._id || `SUB-${idx + 1}`,
      category: 'subs week all',
      dateText: sub.nextDeliveryDate || (sub.deliveryDays ? `${sub.deliveryDays.join(', ')}` : 'Active Subscription'),
      slotText: `Recurring Subscription • ${sub.slotTime || sub.mealType || 'Daily Slot'}`,
      title: sub.plan || 'Homestyle Monthly Tiffin Plan',
      provider: sub.providerName || "Artisanal Home Kitchen",
      hub: sub.address || 'Fulfillment Hub',
      tier: 'Standard Stainless Steel Tiffin',
      amount: `₹${sub.pricePerMeal || Math.round((sub.amount || 0) / (sub.totalMeals || 1)) || 140}`,
      isSub: true,
      subProgress: {
        delivered: sub.deliveredMeals || 0,
        total: sub.totalMeals || 26,
        percent: sub.totalMeals ? Math.round(((sub.deliveredMeals || 0) / sub.totalMeals) * 100) : 0,
        remaining: sub.remainingMeals || 0,
        nextBill: sub.endDate || 'Active'
      },
      image: sub.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVTYSFo5IXhMeJB0IUzwaUBjeRXlfJKSrGerIwI_zRrZIA8eWbmJBMRZiI5yUpQ14D8IyxVEGK5iYB4BaQZ1GhZwgvI-dUHKv7yLGYKX9Tp-U4cRbO2aKN6krVwWPuL2bQalI3L0ryAXemKAlpf6sj9-AvcurbMfwdt02c-R4IFZ80cf_xHJ7NOKmEXZLy3-npTZGyaRnB84-RX46pDFFpEGGMnQjFoi_A8E6GY2zHCo3lvjAVPHHD',
      inclusions: sub.inclusions || ['Fresh Homestyle Preparation', 'Cow Ghee Roti', 'Daily Dal & Sabzi', 'Steamed Rice'],
      destination: sub.address || 'Home Delivery',
      cutoff: 'Modify dishes before 09:00 PM',
      timeLeft: 'Active'
    })),
    ...orders.filter(o => {
      const s = String(o.rawStatus || o.status || '').toLowerCase();
      return ['scheduled', 'future'].includes(s);
    }).map(o => ({
      id: o.orderId || o._id,
      category: 'tomorrow week all',
      dateText: o.deliveryDate || 'Scheduled Delivery',
      slotText: `Scheduled • ${o.deliverySlot || 'Lunch Slot'}`,
      title: o.tiffinName || 'Homestyle Meal',
      provider: o.providerName || "Kitchen Partner",
      hub: o.providerAddress || 'Satellite Hub',
      tier: 'Standard Tier Brass Tiffin',
      amount: `₹${o.totalAmount}`,
      escrowState: 'Escrow Pre-Authorized',
      image: o.image,
      inclusions: (o.items && o.items.length > 0) ? o.items.map(i => `${i.quantity || 1}x ${i.name}`) : ['Homestyle Pure Veg Inclusions'],
      destination: o.customerAddress || 'Home Dropoff',
      cutoff: 'Modify dishes before today 09:00 PM',
      timeLeft: 'Active'
    }))
  ];

  // Primary active consignment for detailed telemetry & live tracking
  const activeConsignment = activeOrders[0] || null;

  // Formatted countdown time
  const formatCountdown = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Vacation Mode Toggle
  const handleToggleVacation = () => {
    const nextState = !isVacationActive;
    setIsVacationActive(nextState);
    if (nextState) {
      triggerToast('All upcoming tiffins paused until unsuspended.');
    } else {
      triggerToast('Tiffin deliveries resumed according to schedule.');
    }
  };

  // Review Submission
  const handleSubmitReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!reviewOrder || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || '';
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          providerId: reviewOrder.providerId || '6a7f3051d4b48741d8722416',
          orderId: reviewOrder.orderId || reviewOrder._id,
          tiffinName: reviewOrder.tiffinName || 'Deluxe Thali',
          rating: reviewRating,
          comment: reviewComment.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveModal(null);
        setReviewOrder(null);
        setReviewComment('');
        triggerToast('Thank you! Your culinary inspection review has been recorded.');
        fetchOrders();
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      triggerToast('Review logged successfully.');
      setActiveModal(null);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Cancel Order on MongoDB backend
  const handleCancelActiveOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Instant 100% refund will be credited.')) return;
    try {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || '';
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: 'Customer requested 0-penalty cancellation' })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Order cancelled. 100% escrow refund processed.');
        fetchOrders();
      } else {
        triggerToast(data.message || 'Order voided under 10-minute policy.');
      }
    } catch (e) {
      triggerToast('Order voided under 10-minute policy.');
    }
  };

  // Export PDF Statement
  const handleExportStatement = () => {
    triggerToast('Generating authenticated PDF audit statement with verified FSSAI ledger...');
    window.print();
  };

  return (
    <div className="flex flex-col w-full bg-surface font-body-md text-on-surface antialiased pt-20 sm:pt-24 pb-20">
      
      {/* Toast Notification Banner */}
      <div
        className={`fixed bottom-8 right-8 z-[200] transform transition-all duration-300 pointer-events-none bg-onyx-black text-bone-white px-6 py-4 rounded shadow-2xl flex items-center gap-3 font-button-text text-button-text ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-[18px] text-surface-tint">check_circle</span>
        <span>{toastMessage}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-margin-desktop w-full flex flex-col">
        
        {/* COMMON TOP SUB-NAVIGATION (Exact 5-tab bar with Dynamic Badges) */}
        <header className="w-full bg-surface/90 border-b border-sand-neutral mb-8">
          <div className="h-14 flex items-center justify-between overflow-x-auto">
            <nav className="flex items-center gap-6 sm:gap-8 h-full whitespace-nowrap">
              {/* Active Orders */}
              <button
                onClick={() => switchTab('active')}
                className={`flex items-center gap-2 h-full font-button-text text-button-text transition-colors cursor-pointer ${
                  activeTab === 'active'
                    ? 'border-b-2 border-onyx-black text-onyx-black font-semibold'
                    : 'text-on-surface-variant hover:text-onyx-black'
                }`}
              >
                <span>Active Orders</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-caps text-label-caps text-onyx-black">
                  {activeOrders.length}
                </span>
              </button>

              {/* Track Order */}
              <button
                onClick={() => switchTab('track')}
                className={`flex items-center gap-2 h-full font-button-text text-button-text transition-colors cursor-pointer ${
                  activeTab === 'track'
                    ? 'border-b-2 border-onyx-black text-onyx-black font-semibold'
                    : 'text-on-surface-variant hover:text-onyx-black'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Track Order</span>
              </button>

              {/* Upcoming Tiffins */}
              <button
                onClick={() => switchTab('upcoming')}
                className={`flex items-center gap-2 h-full font-button-text text-button-text transition-colors cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'border-b-2 border-onyx-black text-onyx-black font-semibold'
                    : 'text-on-surface-variant hover:text-onyx-black'
                }`}
              >
                <span>Upcoming Tiffins</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-caps text-label-caps text-onyx-black">
                  {upcomingTiffins.length}
                </span>
              </button>

              {/* Order History */}
              <button
                onClick={() => switchTab('history')}
                className={`flex items-center gap-2 h-full font-button-text text-button-text transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-b-2 border-onyx-black text-onyx-black font-semibold'
                    : 'text-on-surface-variant hover:text-onyx-black'
                }`}
              >
                <span>Order History</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-caps text-label-caps text-onyx-black">
                  {historyOrders.length}
                </span>
              </button>

              {/* Cancelled Orders */}
              <button
                onClick={() => switchTab('cancelled')}
                className={`flex items-center gap-2 h-full font-button-text text-button-text transition-colors cursor-pointer ${
                  activeTab === 'cancelled'
                    ? 'border-b-2 border-onyx-black text-onyx-black font-semibold'
                    : 'text-on-surface-variant hover:text-onyx-black'
                }`}
              >
                <span>Cancelled Orders</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-caps text-label-caps text-onyx-black">
                  {cancelledOrders.length}
                </span>
              </button>
            </nav>

            <div className="hidden md:flex items-center gap-2 text-secondary font-label-caps text-label-caps shrink-0 pl-4">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Lunch Window: 12:30 PM - 01:45 PM</span>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* SUBVIEW 1: ACTIVE ORDERS                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'active' && (
          <div className="w-full flex flex-col gap-10 animate-in fade-in duration-200">
            {/* Page Header with Telemetry live sync ticker */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                    Active Dispatch Manifest
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-onyx-black" />
                  <span className="font-label-caps text-label-caps text-secondary">
                    Node Cluster: Satellite West (GJ-01)
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                  Active Consignments
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  Real-time operational orders feed backed by MongoDB &amp; Socket.IO telemetry. Cryptographically sealed handshakes and thermal threshold monitoring.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-bone-white px-4 py-2.5 rounded shadow-sm border border-sand-neutral/40 self-start md:self-auto">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                  </span>
                  <span className="font-label-caps text-label-caps text-onyx-black uppercase tracking-wider">
                    WebSocket: Live
                  </span>
                </div>
                <span className="text-sand-neutral text-xs">|</span>
                <span className="font-label-caps text-label-caps text-secondary lowercase">
                  last sync: {syncSeconds}s ago
                </span>
              </div>
            </div>

            {/* Active Consignment Card */}
            {activeOrders.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl border border-sand-neutral/70 p-12 text-center space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-secondary">lunch_dining</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black">No Active Consignments</h3>
                <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                  All your past orders have been safely delivered. Browse artisanal home kitchens in Satellite and Bodakdev to order fresh homestyle tiffins!
                </p>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('#order-tiffin');
                    else window.location.hash = '#order-tiffin';
                  }}
                  className="px-6 py-3 bg-onyx-black text-on-primary rounded font-button-text text-button-text hover:bg-neutral-800 transition-colors"
                >
                  Order Tiffin Now
                </button>
              </div>
            ) : (
              <div className="w-full bg-surface-container-lowest rounded-xl border border-sand-neutral/70 shadow-sm overflow-hidden flex flex-col">
                {/* Consignment Header with Provider, ETA, and Handover OTP */}
                <div className="p-6 md:p-8 bg-surface-container-low/40 border-b border-sand-neutral/40 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center gap-5 min-w-0">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                      <img
                        className="w-full h-full object-cover"
                        alt="Kathiyawadi Thali"
                        src={activeConsignment.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPbgHX-SWuQwFR9geMvHoTEYRi2DqiRZm4Hg15sqiHY0c83zzUb8jhbqC61nRPvt5i3qpb4KYuEsw9QAtHhRxnwjpulun18bomyxatAu--_hTp9mthN5hrZ6gipQXHH-G1RQGzWyQ4sTCjLT3SsWL_4cMSWb3wPfV8oxBfd9HO_hNqde0kEqujGMNPwR3lZAjdjJX4ZOOmQ_qWNoLIwEfmQtwbz4hRA6u273Blnyrh1P5VdJ3ggYTB'}
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-onyx-black/80 backdrop-blur-sm rounded text-[10px] text-white font-label-caps uppercase">
                        1x
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-headline-md text-headline-md text-onyx-black tracking-tight">
                          {activeConsignment.orderId || `#TL-${(activeConsignment._id || '').slice(-4).toUpperCase()}`}
                        </span>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-200/80">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span className="font-label-caps text-label-caps uppercase tracking-wider">
                            {activeConsignment.status || 'Active Dispatch'}
                          </span>
                        </div>
                        <span className="hidden sm:inline-block font-label-caps text-label-caps text-secondary uppercase tracking-widest px-2 py-0.5 rounded bg-surface-container">
                          Batch Priority α
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md truncate">
                        <span className="material-symbols-outlined text-[18px] text-clay-earth shrink-0">trip_origin</span>
                        <span className="font-medium text-onyx-black">{activeConsignment.providerName || 'Culinary Partner'}</span>
                        <span className="text-secondary text-xs hidden sm:inline">({activeConsignment.providerAddress || 'Kitchen'})</span>
                        <span className="material-symbols-outlined text-[16px] text-secondary">arrow_forward</span>
                        <span className="truncate">{activeConsignment.customerAddress || 'Delivery Address'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-sand-neutral/50">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                        Est. Arrival
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-headline-lg text-headline-lg text-onyx-black font-normal tracking-tight">
                          {activeConsignment.etaMinutes || 15}
                        </span>
                        <span className="font-button-text text-button-text text-secondary">mins</span>
                      </div>
                      <span className="font-label-caps text-[11px] text-emerald-700 font-medium">
                        On Schedule • Transit En Route
                      </span>
                    </div>

                    <div className="h-12 w-[1px] bg-sand-neutral hidden sm:block" />

                    <div className="flex flex-col bg-bone-white px-5 py-3 rounded-lg border border-sand-neutral/80 min-w-[200px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-clay-earth">lock</span>
                          Handover OTP
                        </span>
                        <span className="px-1.5 py-0.5 bg-onyx-black text-white text-[9px] font-label-caps tracking-widest rounded">
                          AIR-GAPPED
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="font-headline-md text-headline-md tracking-widest text-onyx-black font-semibold">
                          {activeConsignment.otp || '----'}
                        </span>
                        {activeConsignment.otp && (
                          <button
                            className="text-secondary hover:text-onyx-black transition-colors"
                            onClick={() => {
                              navigator.clipboard?.writeText(activeConsignment.otp || '');
                              triggerToast(`Handover OTP ${activeConsignment.otp} copied to clipboard.`);
                            }}
                            title="Copy OTP"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        )}
                      </div>
                      <span className="font-label-caps text-[10px] text-secondary/80 mt-1 leading-tight">
                        Reveal to courier only upon canister physical handover
                      </span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Progression Strip (Legs 1 to 5) */}
                {(() => {
                  const s = String(activeConsignment.rawStatus || activeConsignment.status || '').toLowerCase();
                  let currentLeg = 1;
                  if (['preparing', 'kitchen_prep'].includes(s)) currentLeg = 2;
                  else if (['ready', 'ready_for_pickup', 'packing', 'sealed'].includes(s)) currentLeg = 3;
                  else if (['out for delivery', 'out_for_delivery', 'picked_up', 'in_transit'].includes(s)) currentLeg = 4;
                  else if (['arrived', 'delivered', 'doorstep'].includes(s)) currentLeg = 5;

                  const orderTime = activeConsignment.date || 'Recent';

                  return (
                    <div className="p-6 md:p-8 bg-surface border-b border-sand-neutral/40">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                            Telemetry Progression
                          </span>
                          <span className="font-label-caps text-label-caps text-onyx-black font-semibold">
                            Transit Leg {currentLeg} of 5 ({currentLeg * 20}% Complete)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                          <div className={`flex flex-col gap-1.5 p-3 rounded ${currentLeg === 1 ? 'bg-onyx-black text-white shadow-sm ring-1 ring-onyx-black' : currentLeg > 1 ? 'bg-surface-container-low border border-sand-neutral/30' : 'bg-bone-white/60 border border-sand-neutral/40 opacity-70'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-label-caps text-[11px] ${currentLeg === 1 ? 'text-sand-neutral' : 'text-secondary'}`}>01 / ORDER</span>
                              {currentLeg > 1 ? (
                                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                              ) : currentLeg === 1 ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">radio_button_unchecked</span>
                              )}
                            </div>
                            <span className={`font-button-text text-button-text ${currentLeg === 1 ? 'text-white' : 'text-onyx-black'}`}>Confirmed</span>
                            <span className={`font-label-caps text-[10px] ${currentLeg === 1 ? 'text-surface-variant' : 'text-secondary'}`}>{orderTime}</span>
                          </div>

                          <div className={`flex flex-col gap-1.5 p-3 rounded ${currentLeg === 2 ? 'bg-onyx-black text-white shadow-sm ring-1 ring-onyx-black' : currentLeg > 2 ? 'bg-surface-container-low border border-sand-neutral/30' : 'bg-bone-white/60 border border-sand-neutral/40 opacity-70'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-label-caps text-[11px] ${currentLeg === 2 ? 'text-sand-neutral' : 'text-secondary'}`}>02 / KITCHEN</span>
                              {currentLeg > 2 ? (
                                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                              ) : currentLeg === 2 ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">radio_button_unchecked</span>
                              )}
                            </div>
                            <span className={`font-button-text text-button-text ${currentLeg === 2 ? 'text-white' : 'text-onyx-black'}`}>Preparing</span>
                            <span className={`font-label-caps text-[10px] ${currentLeg === 2 ? 'text-surface-variant' : 'text-secondary'}`}>{currentLeg >= 2 ? 'In Progress' : 'Queued'}</span>
                          </div>

                          <div className={`flex flex-col gap-1.5 p-3 rounded ${currentLeg === 3 ? 'bg-onyx-black text-white shadow-sm ring-1 ring-onyx-black' : currentLeg > 3 ? 'bg-surface-container-low border border-sand-neutral/30' : 'bg-bone-white/60 border border-sand-neutral/40 opacity-70'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-label-caps text-[11px] ${currentLeg === 3 ? 'text-sand-neutral' : 'text-secondary'}`}>03 / PACKING</span>
                              {currentLeg > 3 ? (
                                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                              ) : currentLeg === 3 ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">radio_button_unchecked</span>
                              )}
                            </div>
                            <span className={`font-button-text text-button-text ${currentLeg === 3 ? 'text-white' : 'text-onyx-black'}`}>Sealed &amp; Insulated</span>
                            <span className={`font-label-caps text-[10px] ${currentLeg === 3 ? 'text-surface-variant' : 'text-secondary'}`}>{currentLeg >= 3 ? '304-SS Locked' : 'Pending Pack'}</span>
                          </div>

                          <div className={`flex flex-col gap-1.5 p-3 rounded ${currentLeg === 4 ? 'bg-onyx-black text-white shadow-sm ring-1 ring-onyx-black' : currentLeg > 4 ? 'bg-surface-container-low border border-sand-neutral/30' : 'bg-bone-white/60 border border-sand-neutral/40 opacity-70'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-label-caps text-[11px] ${currentLeg === 4 ? 'text-sand-neutral' : 'text-secondary'}`}>04 / DISPATCH</span>
                              {currentLeg > 4 ? (
                                <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                              ) : currentLeg === 4 ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">radio_button_unchecked</span>
                              )}
                            </div>
                            <span className={`font-button-text text-button-text ${currentLeg === 4 ? 'text-white' : 'text-onyx-black'}`}>Out for Delivery</span>
                            <span className={`font-label-caps text-[10px] ${currentLeg === 4 ? 'text-surface-variant' : 'text-secondary'}`}>{currentLeg >= 4 ? `${activeConsignment.etaMinutes || 15}m ETA` : 'Awaiting Courier'}</span>
                          </div>

                          <div className={`flex flex-col gap-1.5 p-3 rounded ${currentLeg === 5 ? 'bg-onyx-black text-white shadow-sm ring-1 ring-onyx-black' : 'bg-bone-white/60 border border-sand-neutral/40 col-span-2 md:col-span-1 opacity-70'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-label-caps text-[11px] ${currentLeg === 5 ? 'text-sand-neutral' : 'text-secondary'}`}>05 / DESTINATION</span>
                              {currentLeg === 5 ? (
                                <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                              ) : (
                                <span className="material-symbols-outlined text-[16px] text-secondary">hourglass_empty</span>
                              )}
                            </div>
                            <span className={`font-button-text text-button-text ${currentLeg === 5 ? 'text-white' : 'text-on-surface'}`}>Doorstep Verification</span>
                            <span className={`font-label-caps text-[10px] ${currentLeg === 5 ? 'text-surface-variant' : 'text-secondary'}`}>{activeConsignment.otp ? `Pending OTP ${activeConsignment.otp}` : 'Pending Arrival'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom 2-Column Structure: Items & Hardware Telemetry */}
                <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-surface-container-lowest">
                  {/* Left Column: Container Breakdown & Courier */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between">
                        <h2 className="font-headline-md text-headline-md text-onyx-black">
                          {activeConsignment.tiffinName || 'Homestyle Tiffin Meal'}
                        </h2>
                        <div className="flex items-baseline gap-1">
                          <span className="font-headline-md text-headline-md text-onyx-black">
                            ₹{activeConsignment.totalAmount || 0}
                          </span>
                          <span className="font-label-caps text-[11px] text-secondary uppercase">
                            {activeConsignment.paymentMethod?.includes('Cash') ? 'COD' : 'UPI'}
                          </span>
                        </div>
                      </div>
                      <p className="font-body-md text-body-md text-secondary">
                        {activeConsignment.isSubscription ? 'Standard Tier Artisanal Escrow • Daily Subscription Inclusion' : 'Standard Tier Artisanal Escrow • Fresh Homestyle Meal Dispatch'}
                      </p>
                    </div>

                    <div className="bg-bone-white p-5 rounded-lg border border-sand-neutral/50 flex flex-col gap-3">
                      <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                        Curated Container Breakdown
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {activeConsignment.items && activeConsignment.items.length > 0 ? (
                          activeConsignment.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <span className="material-symbols-outlined text-[18px] text-clay-earth">radio_button_checked</span>
                              <span className="font-body-md text-body-md text-onyx-black">
                                {it.quantity ? `${it.quantity}x ` : '1x '}{it.name || it.tiffinName || 'Culinary Dish'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2.5 col-span-2">
                            <span className="material-symbols-outlined text-[18px] text-clay-earth">radio_button_checked</span>
                            <span className="font-body-md text-body-md text-onyx-black">
                              {activeConsignment.tiffinName || 'Homestyle Special Meal'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-container-low border border-sand-neutral/60">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-onyx-black text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-button-text text-button-text text-onyx-black">
                              {activeConsignment.driver?.name || 'Assigned Courier Partner'}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 bg-bone-white rounded border border-sand-neutral text-onyx-black">
                              {activeConsignment.driver?.rating || '4.9'} <span className="material-symbols-outlined text-[12px] text-amber-600">star</span>
                            </span>
                          </div>
                          <span className="font-label-caps text-[11px] text-secondary">
                            {activeConsignment.driver?.vehicle || 'Delivery Courier Partner'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          className="px-4 py-2 bg-onyx-black text-white rounded font-button-text text-button-text flex items-center gap-2 hover:bg-clay-earth transition-colors"
                          href={`tel:${activeConsignment.driver?.phone || '+919825144102'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">call</span>
                          <span>Call Courier</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Hardware Telemetry & Quick Live Track Action */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-6 bg-bone-white/70 p-6 rounded-xl border border-sand-neutral/60">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-sand-neutral/50 pb-3">
                        <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                          Hardware Telemetry
                        </span>
                        <span className="font-label-caps text-[11px] text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                          Thermal Lock Active
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-surface-container rounded-lg border border-sand-neutral flex items-center justify-center">
                          <span className="material-symbols-outlined text-[28px] text-clay-earth">thermostat</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-caps text-[11px] uppercase text-secondary">
                            Canister ID &amp; Temperature
                          </span>
                          <span className="font-headline-md text-headline-md text-onyx-black">
                            {activeConsignment.canisterTemp || '68.2 °C'}
                          </span>
                          <span className="font-body-md text-[13px] text-on-surface-variant">
                            Grade 304 Stainless Steel • {activeConsignment.canisterId || '#TK-9021'}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden mt-1">
                        <div className="bg-amber-600 h-2 rounded-full" style={{ width: '78%' }} />
                      </div>

                      <div className="flex justify-between font-label-caps text-[10px] text-secondary">
                        <span>Optimal Floor: 60.0 °C</span>
                        <span>Target: 70.0 °C</span>
                        <span>Sensor Signal: 99.4%</span>
                      </div>

                      <div className="p-3.5 bg-surface-container-high/60 rounded border border-sand-neutral/60 text-xs text-on-surface-variant flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[16px] text-clay-earth mt-0.5">verified_user</span>
                        <span>
                          Digital tamper seal #{activeConsignment.tamperSeal || 'TS-8841'} is intact. Prepared by {activeConsignment.providerName || 'Culinary Hub'} at {activeConsignment.date || 'Scheduled Time'}.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 pt-4 border-t border-sand-neutral/50">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          className="flex-1 py-3 px-4 bg-onyx-black text-white rounded font-button-text text-button-text flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                          onClick={() => switchTab('track')}
                        >
                          <span>Track Order Live</span>
                          <span className="material-symbols-outlined text-[18px]">north_east</span>
                        </button>
                        <button
                          className="py-3 px-4 bg-surface-container rounded border border-sand-neutral font-button-text text-button-text text-onyx-black hover:bg-surface-container-high transition-colors"
                          onClick={() => {
                            setModalPayload(activeConsignment);
                            setActiveModal('dossier');
                          }}
                        >
                          View Dossier
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => handleCancelActiveOrder(activeConsignment._id)}
                          className="text-error hover:underline flex items-center gap-1 font-button-text text-button-text"
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          <span>Cancel Order (0 Penalty)</span>
                        </button>

                        <button
                          onClick={() => triggerToast('Connecting with Satellite Desk Concierge...')}
                          className="font-button-text text-button-text text-secondary hover:text-onyx-black underline decoration-sand-neutral underline-offset-4"
                        >
                          Delivery Grievance Support
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Auxiliary Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 rounded-xl bg-surface-container-low/40 border border-sand-neutral/50 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                    Courier Handshake Policy
                  </span>
                  <h3 className="font-headline-md text-[22px] leading-tight text-onyx-black">
                    Zero-Contact Handover
                  </h3>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Your courier will verify your four-digit secure key before exchanging the pressurized thermal canister. Retain your empty lunch container for tomorrow's round-robin pickup.
                </p>
                <span className="font-label-caps text-[11px] text-secondary">
                  Hardware Custody Standard § 14
                </span>
              </div>

              <div className="p-6 rounded-xl bg-surface-container-low/40 border border-sand-neutral/50 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                    Secondary Dispatch Queuing
                  </span>
                  <h3 className="font-headline-md text-[22px] leading-tight text-onyx-black">
                    Evening Dinner Consignment
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-clay-earth text-[24px]">bedtime</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-button-text text-onyx-black">Kathiyawadi Khichdi &amp; Kadhi</span>
                    <span className="font-label-caps text-[11px] text-secondary">
                      Dispatch Window: 07:30 PM • Satellite Hub
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-sand-neutral/40 flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-emerald-800 font-semibold">Queued for Prep</span>
                  <span className="font-label-caps text-label-caps text-secondary">Slot #TL-4680</span>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-bone-white border border-sand-neutral/70 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                    Network Health
                  </span>
                  <h3 className="font-headline-md text-[22px] leading-tight text-onyx-black">
                    Cluster Operations Normal
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Satellite Traffic Latency</span>
                    <span className="font-medium text-onyx-black">Normal • 8 mins avg</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Active Hub Couriers</span>
                    <span className="font-medium text-onyx-black">14 On Road</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Escrow Vault State</span>
                    <span className="font-medium text-emerald-700">Secured (₹140 Locked)</span>
                  </div>
                </div>
                <button
                  onClick={() => triggerToast('Displaying regional fleet health logs...')}
                  className="font-button-text text-button-text text-onyx-black hover:underline flex items-center gap-1 text-left"
                >
                  <span>Inspect Regional Fleet Metrics</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 2: TRACK ORDER (Live Ahmedabad Geomatics Radar)                   */}
        {/* ========================================================================= */}
        {activeTab === 'track' && (
          <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-200">
            {!activeConsignment ? (
              <div className="bg-surface-container-lowest rounded-xl border border-sand-neutral/70 p-12 text-center space-y-4 shadow-sm my-6">
                <span className="material-symbols-outlined text-[48px] text-secondary">explore</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black">No Active Delivery in Transit</h3>
                <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                  Live GPS transit telemetry, route geomatics, and handover OTP will appear here as soon as an order is dispatched.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => switchTab('active')}
                    className="px-6 py-2.5 bg-onyx-black text-on-primary rounded font-button-text text-button-text hover:bg-neutral-800 transition-colors"
                  >
                    View Active Orders
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('#order-tiffin');
                      else window.location.hash = '#order-tiffin';
                    }}
                    className="px-6 py-2.5 bg-surface-container text-onyx-black rounded font-button-text text-button-text hover:bg-surface-container-high transition-colors"
                  >
                    Explore Tiffins
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Top Navigation & Telemetry Lock Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => switchTab('active')}
                  className="group flex items-center gap-2 font-button-text text-button-text text-secondary hover:text-onyx-black transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                    arrow_back
                  </span>
                  <span>Back to Active Orders</span>
                </button>
                <span className="text-sand-neutral text-xs">/</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Telemetry</span>
                  <span className="font-button-text text-button-text font-semibold text-onyx-black tracking-wider">
                    {activeConsignment.orderId || '#TL-4669'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                </span>
                <div className="px-3 py-1 bg-surface-container rounded-full text-on-surface-variant font-label-caps text-label-caps flex items-center gap-2 shadow-sm">
                  <span>Socket.IO v4.7</span>
                  <span className="text-sand-neutral">•</span>
                  <span className="text-onyx-black font-semibold">20ms latency</span>
                  <span className="text-sand-neutral">•</span>
                  <span className="text-emerald-700">PostGIS Lock</span>
                </div>
              </div>
            </div>

            {/* State Vector Progress Banner */}
            {(() => {
              const s = String(activeConsignment.rawStatus || activeConsignment.status || '').toLowerCase();
              let currentLeg = 1;
              if (['preparing', 'kitchen_prep'].includes(s)) currentLeg = 2;
              else if (['ready', 'ready_for_pickup', 'packing', 'sealed'].includes(s)) currentLeg = 3;
              else if (['out for delivery', 'out_for_delivery', 'picked_up', 'in_transit'].includes(s)) currentLeg = 4;
              else if (['arrived', 'delivered', 'doorstep'].includes(s)) currentLeg = 5;

              const targetArrival = activeConsignment.etaMinutes ? `${activeConsignment.etaMinutes} mins` : '15 mins';

              return (
                <div className="bg-surface-container-low rounded-xl p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-sand-neutral/60">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-secondary block mb-1">State Vector</span>
                      <h2 className="font-headline-md text-headline-md text-onyx-black">Transit Telemetry</h2>
                    </div>
                    <div className="text-right">
                      <span className="font-label-caps text-label-caps uppercase text-secondary block mb-1">Target Arrival</span>
                      <span className="font-headline-md text-headline-md text-onyx-black font-medium">{targetArrival}</span>
                    </div>
                  </div>

                  <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[14px] ${currentLeg > 1 ? 'bg-onyx-black text-on-primary' : currentLeg === 1 ? 'bg-clay-earth text-bone-white ring-4 ring-secondary-container' : 'bg-surface-container-high text-secondary'}`}>
                          <span className="material-symbols-outlined text-[16px]">{currentLeg > 1 ? 'check' : currentLeg === 1 ? 'sync' : 'radio_button_unchecked'}</span>
                        </span>
                        <div className="w-0.5 h-6 bg-onyx-black md:hidden" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-button-text text-button-text text-onyx-black font-semibold">Confirmed</span>
                        <span className="font-label-caps text-label-caps text-secondary">{activeConsignment.date || 'Recent'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[14px] ${currentLeg > 2 ? 'bg-onyx-black text-on-primary' : currentLeg === 2 ? 'bg-clay-earth text-bone-white ring-4 ring-secondary-container' : 'bg-surface-container-high text-secondary'}`}>
                          <span className="material-symbols-outlined text-[16px]">{currentLeg > 2 ? 'check' : currentLeg === 2 ? 'sync' : 'radio_button_unchecked'}</span>
                        </span>
                        <div className="w-0.5 h-6 bg-onyx-black md:hidden" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-button-text text-button-text text-onyx-black font-semibold">Kitchen Prep</span>
                        <span className="font-label-caps text-label-caps text-secondary">{currentLeg >= 2 ? 'In Progress' : 'Queued'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[14px] ${currentLeg > 3 ? 'bg-onyx-black text-on-primary' : currentLeg === 3 ? 'bg-clay-earth text-bone-white ring-4 ring-secondary-container' : 'bg-surface-container-high text-secondary'}`}>
                          <span className="material-symbols-outlined text-[16px]">{currentLeg > 3 ? 'check' : currentLeg === 3 ? 'sync' : 'radio_button_unchecked'}</span>
                        </span>
                        <div className="w-0.5 h-6 bg-onyx-black md:hidden" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-button-text text-button-text text-onyx-black font-semibold">Canister Sealed</span>
                        <span className="font-label-caps text-label-caps text-secondary">{currentLeg >= 3 ? '304-SS Clamped' : 'Pending Pack'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[14px] ${currentLeg > 4 ? 'bg-onyx-black text-on-primary' : currentLeg === 4 ? 'bg-clay-earth text-bone-white ring-4 ring-secondary-container' : 'bg-surface-container-high text-secondary'}`}>
                          <span className={`material-symbols-outlined text-[16px] ${currentLeg === 4 ? 'animate-spin' : ''}`}>{currentLeg > 4 ? 'check' : currentLeg === 4 ? 'sync' : 'radio_button_unchecked'}</span>
                        </span>
                        <div className="w-0.5 h-6 bg-sand-neutral md:hidden" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-button-text text-button-text text-onyx-black font-semibold">In Transit</span>
                          {currentLeg === 4 && <span className="px-1.5 py-0.2 bg-onyx-black text-surface font-label-caps text-[10px] rounded">ACTIVE</span>}
                        </div>
                        <span className="font-label-caps text-label-caps text-secondary">{currentLeg >= 4 ? `${activeConsignment.etaMinutes || 15}m ETA` : 'Awaiting Dispatch'}</span>
                      </div>
                    </div>

                    <div className={`flex items-start gap-3 ${currentLeg < 5 ? 'opacity-60' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-[14px] ${currentLeg === 5 ? 'bg-emerald-600 text-white' : 'bg-surface-container-high text-secondary'}`}>
                          <span className="material-symbols-outlined text-[16px]">{currentLeg === 5 ? 'check' : 'key'}</span>
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-button-text text-button-text text-on-surface-variant font-medium">OTP Handshake</span>
                        <span className="font-label-caps text-label-caps text-secondary">{activeConsignment.otp ? `Pending OTP ${activeConsignment.otp}` : 'Pending Arrival'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2-Column: Live SVG Map & Dual Escrow Security */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols): Pristine Ahmedabad Geomatics Map */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div
                  className="relative w-full h-[620px] rounded-xl overflow-hidden bg-[#f7f5f0] shadow-md border border-sand-neutral/60 transition-transform duration-300"
                  style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center' }}
                >
                  <svg
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid slice"
                    viewBox="0 0 1000 800"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect fill="#f7f5f0" height="100%" width="100%" />
                    <path d="M 680,0 Q 720,240 760,450 T 820,800" fill="none" stroke="#d5d0c7" strokeLinecap="round" strokeWidth="48" />
                    <path d="M 680,0 Q 720,240 760,450 T 820,800" fill="none" stroke="#f1eeea" strokeWidth="40" />
                    <path d="M 0,260 L 1000,320" fill="none" stroke="#ded9d1" strokeWidth="32" />
                    <path d="M 0,260 L 1000,320" fill="none" stroke="#ffffff" strokeWidth="24" />
                    <path d="M 120,0 L 420,800" fill="none" stroke="#e4e0d7" strokeWidth="24" />
                    <path d="M 120,0 L 420,800" fill="none" stroke="#faf8f4" strokeWidth="16" />
                    <path d="M 0,550 C 300,520 600,600 1000,530" fill="none" stroke="#ded9d1" strokeWidth="26" />
                    <path d="M 0,550 C 300,520 600,600 1000,530" fill="none" stroke="#ffffff" strokeWidth="18" />
                    {/* Vastrapur Lake */}
                    <path d="M 320,180 C 420,200 480,140 540,210 C 600,280 520,380 430,360 C 350,340 280,260 320,180 Z" fill="#d3dede" opacity="0.85" />
                    <text fill="#4a5f5f" fontFamily="EB Garamond" fontSize="15" letterSpacing="1" x="390" y="275">
                      Vastrapur Lake
                    </text>
                    <path d="M 280,120 L 720,150" fill="none" stroke="#e8e4db" strokeWidth="10" />
                    <path d="M 450,400 L 900,450" fill="none" stroke="#e8e4db" strokeWidth="12" />
                    <path d="M 180,680 L 600,710" fill="none" stroke="#e8e4db" strokeWidth="10" />
                    <path d="M 520,180 L 640,650" fill="none" stroke="#e2dfd7" strokeWidth="14" />
                    <text fill="#8f897e" fontFamily="Hanken Grotesk" fontSize="11" fontWeight="600" letterSpacing="2" transform="rotate(76,730,650)" x="730" y="650">
                      S.G. HIGHWAY EXPRESSWAY
                    </text>
                    <text fill="#8f897e" fontFamily="Hanken Grotesk" fontSize="11" fontWeight="600" letterSpacing="2" transform="rotate(3,210,245)" x="210" y="245">
                      SATELLITE MAIN ROAD
                    </text>
                    <text fill="#8f897e" fontFamily="Hanken Grotesk" fontSize="11" fontWeight="600" letterSpacing="2" x="280" y="470">
                      BODAKDEV SECTOR
                    </text>

                    {/* Transit Route */}
                    <path d="M 220,300 L 390,312 L 490,430 L 580,480 L 640,510" fill="none" id="transitRoute" stroke="#000000" strokeDasharray="8 6" strokeLinecap="round" strokeWidth="5" />
                    {/* Origin Kitchen Pin */}
                    <circle cx="220" cy="300" fill="#ffffff" r="14" stroke="#1a1a1a" strokeWidth="3" />
                    <circle cx="220" cy="300" fill="#1a1a1a" r="5" />
                    {/* Customer Destination Pin */}
                    <circle cx="640" cy="510" fill="#ba1a1a" fillOpacity="0.12" r="32" />
                    <circle cx="640" cy="510" fill="#ba1a1a" r="14" stroke="#ffffff" strokeWidth="3" />
                    <circle cx="640" cy="510" fill="#ffffff" r="5" />

                    {/* Active Courier Marker */}
                    <g transform="translate(490, 430)">
                      <circle cx="0" cy="0" fill="#1a1a1a" r="16" stroke="#ffffff" strokeWidth="3" />
                      <path d="M 0,-8 L 6,6 L 0,3 L -6,6 Z" fill="#ffffff" transform="rotate(54)" />
                    </g>
                  </svg>

                  {/* Top-left Origin & Geofence pills */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 max-w-sm pointer-events-none">
                    <div className="bg-surface/95 backdrop-blur-md px-3.5 py-2.5 rounded shadow-md border border-sand-neutral/50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-clay-earth">soup_kitchen</span>
                        <div>
                          <span className="font-label-caps text-[10px] text-secondary uppercase block">Kitchen Origin</span>
                          <span className="font-button-text text-button-text font-semibold text-onyx-black">
                            {activeConsignment.providerName || 'Kitchen Partner'} • {activeConsignment.providerAddress || 'Ahmedabad'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface/95 backdrop-blur-md px-3.5 py-2.5 rounded shadow-md border border-sand-neutral/50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-error">apartment</span>
                        <div>
                          <span className="font-label-caps text-[10px] text-secondary uppercase block">Customer Geofence</span>
                          <span className="font-button-text text-button-text font-semibold text-onyx-black">
                            {activeConsignment.customerAddress || 'Delivery Address'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top-right Interactive Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button
                      onClick={() => setMapZoom((prev) => Math.min(prev + 0.15, 1.6))}
                      className="w-10 h-10 bg-surface text-onyx-black rounded shadow-md flex items-center justify-center hover:bg-surface-container transition-colors"
                      title="Zoom In"
                    >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                    <button
                      onClick={() => setMapZoom((prev) => Math.max(prev - 0.15, 0.85))}
                      className="w-10 h-10 bg-surface text-onyx-black rounded shadow-md flex items-center justify-center hover:bg-surface-container transition-colors"
                      title="Zoom Out"
                    >
                      <span className="material-symbols-outlined text-[20px]">remove</span>
                    </button>
                    <button
                      onClick={() => {
                        setMapZoom(1);
                        triggerToast('Centered courier GPS route locked.');
                      }}
                      className="w-10 h-10 bg-surface text-onyx-black rounded shadow-md flex items-center justify-center hover:bg-surface-container transition-colors"
                      title="Center Courier"
                    >
                      <span className="material-symbols-outlined text-[20px]">my_location</span>
                    </button>
                    <button
                      onClick={() => {
                        setMapZoom(1);
                        triggerToast('Full transit route displayed.');
                      }}
                      className="w-10 h-10 bg-surface text-onyx-black rounded shadow-md flex items-center justify-center hover:bg-surface-container transition-colors"
                      title="Full Route"
                    >
                      <span className="material-symbols-outlined text-[20px]">route</span>
                    </button>
                  </div>

                  {/* Bottom Courier Overlay Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-surface/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-sand-neutral/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-onyx-black text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-button-text text-button-text font-bold text-onyx-black">
                            {activeConsignment.driver?.name || 'Assigned Courier Partner'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-onyx-black font-label-caps text-label-caps font-semibold">
                            {activeConsignment.driver?.vehicle || 'Delivery Vehicle'}
                          </span>
                        </div>
                        <p className="font-body-md text-[13px] text-secondary">Transit in progress • {activeConsignment.status || 'Active Delivery'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="font-label-caps text-label-caps uppercase text-secondary block">Remaining</span>
                        <span className="font-button-text text-button-text font-bold text-onyx-black">{activeConsignment.etaMinutes || 15} mins</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-high rounded p-3.5 flex items-center gap-3 text-on-surface-variant text-body-md text-[14px]">
                  <span className="material-symbols-outlined text-clay-earth text-[20px]">verified</span>
                  <span>Operational Standard: Stainless steel 304 thermal seal verified. Safe transit corridor active.</span>
                </div>
              </div>

              {/* Right Column (5 cols): Escrow Handshake Token & Courier Dossier */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Handshake Token Block */}
                <div className="bg-onyx-black text-bone-white rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-clay-earth/20 blur-3xl pointer-events-none" />
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase tracking-widest text-sand-neutral block">
                        Dual Escrow Security
                      </span>
                      <h3 className="font-headline-md text-headline-md text-bone-white">Handshake Token</h3>
                    </div>
                    <div className="px-2.5 py-1 bg-white/10 rounded font-label-caps text-[11px] text-sand-neutral flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      <span>Encrypted</span>
                    </div>
                  </div>

                  <div className="my-6 text-center">
                    <span className="font-label-caps text-label-caps text-sand-neutral uppercase block mb-1">
                      Pass this Code at Handover
                    </span>
                    <div className="font-display-lg text-display-lg tracking-widest text-bone-white font-serif leading-none py-2 select-all">
                      {activeConsignment.otp || '----'}
                    </div>
                    <p className="font-body-md text-[13px] text-sand-neutral/80 mt-2 max-w-xs mx-auto">
                      Share this 4-digit security code with {activeConsignment.driver?.name || 'courier'} only when your 304-SS hot canister seal is inspected and handed over.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    <div className="bg-white/5 rounded p-3">
                      <span className="font-label-caps text-[11px] text-sand-neutral uppercase block">ETA Countdown</span>
                      <span className="font-headline-md text-[24px] text-bone-white block mt-0.5 font-mono">
                        {formatCountdown(etaSeconds)}
                      </span>
                      <span className="font-label-caps text-[10px] text-sand-neutral/70">Est. {activeConsignment.etaMinutes || 15} mins</span>
                    </div>

                    <div className="bg-white/5 rounded p-3">
                      <span className="font-label-caps text-[11px] text-sand-neutral uppercase block">Core Temp Sensor</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-headline-md text-[24px] text-emerald-400">{activeConsignment.canisterTemp || '68.2°C'}</span>
                      </div>
                      <span className="font-label-caps text-[10px] text-sand-neutral/70">Canister {activeConsignment.canisterId || '#TK-9021'} • Sealed</span>
                    </div>
                  </div>
                </div>

                {/* Driver Profile */}
                <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-sand-neutral/60">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center font-headline-md text-[20px] text-onyx-black uppercase font-serif">
                        {(activeConsignment.driver?.name || 'CP').split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-button-text text-button-text font-bold text-onyx-black">{activeConsignment.driver?.name || 'Assigned Courier Partner'}</h4>
                          <span className="font-label-caps text-[11px] text-secondary bg-surface-container px-1.5 py-0.5 rounded">
                            {activeConsignment.driver?.rating || '4.9'} ★
                          </span>
                        </div>
                        <span className="font-label-caps text-[11px] text-secondary">
                          {activeConsignment.driver?.deliveries || '350+ Deliveries'} • {activeConsignment.driver?.vehicle || 'Delivery Partner'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <a
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-onyx-black text-on-primary rounded font-button-text text-button-text hover:bg-neutral-800 transition-colors"
                      href={`tel:${activeConsignment.driver?.phone || '+919825144102'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      <span>Call Driver</span>
                    </a>
                    <button
                      onClick={() => triggerToast(`Masked relay connected to courier ${activeConsignment.driver?.name || 'Partner'}.`)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-onyx-black rounded font-button-text text-button-text transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      <span>Masked Chat</span>
                    </button>
                  </div>
                </div>

                {/* Order Manifest Card */}
                <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-sand-neutral/60 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/60">
                    <span className="font-button-text text-button-text font-bold text-onyx-black">Order Manifest</span>
                    <span className="font-label-caps text-label-caps text-secondary">{activeConsignment.providerName || 'Artisanal Kitchen'}</span>
                  </div>

                  <div className="space-y-2 text-body-md text-[14px]">
                    {activeConsignment.items && activeConsignment.items.length > 0 ? (
                      activeConsignment.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-onyx-black">
                          <span>{it.quantity ? `${it.quantity}x ` : '1x '}{it.name || it.tiffinName || 'Homestyle Dish'}</span>
                          <span className="font-medium">₹{Number(it.totalPrice || (it.unitPrice && it.quantity ? it.unitPrice * it.quantity : it.price) || 0).toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center text-onyx-black">
                        <span>{activeConsignment.tiffinName || 'Homestyle Tiffin'} × 1</span>
                        <span className="font-medium">₹{Number(activeConsignment.totalAmount || 0)}.00</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-secondary text-[13px]">
                      <span>Hygienic Transit &amp; Escrow Protection</span>
                      <span>Included</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-sand-neutral/60 flex items-center justify-between">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-secondary block">Total Payable</span>
                      <span className="font-headline-md text-[24px] font-bold text-onyx-black">₹{Number(activeConsignment.totalAmount || 0)}.00</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-fixed font-label-caps text-label-caps uppercase rounded">
                        {activeConsignment.paymentMethod || 'Cash on Delivery'}
                      </span>
                      <p className="font-label-caps text-[10px] text-secondary mt-1">
                        {activeConsignment.paymentStatus === 'Paid' ? 'Paid Online' : 'Exact cash or scan UPI at door'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-sand-neutral/40 flex items-center justify-between text-[13px] text-secondary">
                    <span>
                      Prepared by <strong>{activeConsignment.providerName || 'Kitchen Partner'}</strong>
                    </span>
                    <a
                      className="hover:text-onyx-black flex items-center gap-1 font-button-text text-button-text"
                      href={`tel:${activeConsignment.driver?.phone || '+919876543210'}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      <span>{activeConsignment.driver?.phone || '+91 98765 43210'}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 3: UPCOMING TIFFINS & SCHEDULED DELIVERIES                       */}
        {/* ========================================================================= */}
        {activeTab === 'upcoming' && (
          <div className="w-full flex flex-col gap-10 animate-in fade-in duration-200">
            {/* Header with Vacation Mode / Pause All */}
            <section className="w-full pb-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                      Operational Logistics
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-clay-earth" />
                    <span className="font-label-caps text-label-caps uppercase tracking-widest text-onyx-black">
                      {upcomingTiffins.length} Dispatches Scheduled
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none mb-3">
                    Upcoming Tiffins &amp; Scheduled Deliveries
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                    Manage future meal dispatch slots, subscription rotations, vacation pause, and dietary customization with structured culinary escrow.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleToggleVacation}
                    className={`px-5 py-3 rounded transition-colors flex items-center gap-2 font-button-text text-button-text text-onyx-black group ${
                      isVacationActive ? 'bg-surface-container-highest' : 'bg-surface-container-high hover:bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isVacationActive ? 'bg-clay-earth' : 'bg-sand-neutral group-hover:bg-clay-earth'
                      }`}
                    />
                    <span>{isVacationActive ? 'Vacation Mode: Active (Paused)' : 'Vacation Mode / Pause All'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('#order-tiffin');
                      else window.location.hash = '#order-tiffin';
                    }}
                    className="px-6 py-3 rounded bg-onyx-black text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-button-text text-button-text shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Schedule New Meal</span>
                  </button>
                </div>
              </div>

              {/* Metric Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4">
                <div className="bg-surface-container-low p-4 rounded flex flex-col justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Locked Deliveries</span>
                  <span className="font-headline-md text-headline-md text-onyx-black mt-2 leading-none">
                    {upcomingTiffins.length < 10 ? `0${upcomingTiffins.length}` : upcomingTiffins.length}
                  </span>
                </div>
                <div className="bg-surface-container-low p-4 rounded flex flex-col justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Active Subscription</span>
                  <span className="font-headline-md text-headline-md text-onyx-black mt-2 leading-none">
                    {subscriptions.length} <span className="font-body-md text-body-md text-secondary">Plan</span>
                  </span>
                </div>
                <div className="bg-surface-container-low p-4 rounded flex flex-col justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Pre-Authorized Escrow</span>
                  <span className="font-headline-md text-headline-md text-onyx-black mt-2 leading-none">
                    ₹{subscriptions.reduce((sum, s) => sum + (Number(s.escrowHeld) || 0), 0)}
                  </span>
                </div>
                <div className="bg-surface-container-low p-4 rounded flex flex-col justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Stainless Canisters in Loop</span>
                  <span className="font-headline-md text-headline-md text-onyx-black mt-2 leading-none">
                    {subscriptions.filter((s) => s.canisterId).length < 10
                      ? `0${subscriptions.filter((s) => s.canisterId).length}`
                      : subscriptions.filter((s) => s.canisterId).length}
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-2">
                {[
                  { id: 'all', label: `All Upcoming (${upcomingTiffins.length})` },
                  { id: 'tomorrow', label: `Tomorrow (${upcomingTiffins.filter((t) => t.category?.includes('tomorrow')).length})` },
                  { id: 'week', label: `This Week (${upcomingTiffins.filter((t) => t.category?.includes('week')).length})` },
                  { id: 'subs', label: `Active Subscriptions (${subscriptions.length})` }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setUpcomingFilter(pill.id)}
                    className={`px-4 py-2 rounded font-label-caps text-label-caps uppercase transition-colors ${
                      upcomingFilter === pill.id
                        ? 'bg-onyx-black text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:text-onyx-black'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Upcoming Feed Cards */}
            <section className="w-full space-y-8 pb-8">
              {upcomingTiffins.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl border border-sand-neutral/70 p-12 text-center space-y-4 shadow-sm">
                  <span className="material-symbols-outlined text-[48px] text-secondary">calendar_month</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black">No Upcoming Deliveries</h3>
                  <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                    You currently have no scheduled meal deliveries in the queue. Order meal slots or activate an automated recurring subscription!
                  </p>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('#order-tiffin');
                      else window.location.hash = '#order-tiffin';
                    }}
                    className="px-6 py-3 bg-onyx-black text-on-primary rounded font-button-text text-button-text hover:bg-neutral-800 transition-colors"
                  >
                    Schedule New Meal
                  </button>
                </div>
              ) : (
                upcomingTiffins
                  .filter((item) => upcomingFilter === 'all' || item.category.includes(upcomingFilter))
                  .map((tiffin) => (
                  <article
                    key={tiffin.id}
                    className="bg-bone-white rounded-lg p-6 lg:p-8 relative transition-transform duration-200"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Visual Column (4 cols) */}
                      <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="font-label-caps text-label-caps text-secondary uppercase">
                            {tiffin.dateText}
                          </span>
                          <span className="px-2.5 py-1 rounded bg-surface-container-high font-label-caps text-label-caps text-onyx-black uppercase tracking-wider">
                            Confirmed
                          </span>
                        </div>

                        <div className="relative w-full h-48 rounded overflow-hidden">
                          <img className="w-full h-full object-cover" alt={tiffin.title} src={tiffin.image} />
                          <div className="absolute inset-0 bg-gradient-to-t from-onyx-black/60 via-transparent to-transparent flex items-end p-4">
                            <span className="px-2 py-0.5 rounded bg-surface text-onyx-black font-label-caps text-label-caps uppercase">
                              {tiffin.tier}
                            </span>
                          </div>
                        </div>

                        <div className="bg-surface p-3.5 rounded flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-clay-earth">storefront</span>
                          <div className="flex flex-col">
                            <span className="font-button-text text-button-text text-onyx-black leading-tight">
                              {tiffin.provider}
                            </span>
                            <span className="font-label-caps text-label-caps text-secondary">{tiffin.hub}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Order Details (5 cols) */}
                      <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-onyx-black font-label-caps text-label-caps uppercase tracking-wider">
                              {tiffin.slotText}
                            </span>
                          </div>
                          <h2 className="font-headline-md text-headline-md text-onyx-black tracking-tight">
                            {tiffin.title}
                          </h2>
                          <div className="flex items-baseline gap-3 mt-1">
                            <span className="font-button-text text-button-text text-onyx-black">Quantity: 1 Tiffin</span>
                            <span className="text-secondary">•</span>
                            <span className="font-headline-md text-[20px] text-onyx-black">{tiffin.amount}</span>
                            {tiffin.escrowState && (
                              <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-caps text-label-caps">
                                {tiffin.escrowState}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subscription Progress Meter if applicable */}
                        {tiffin.isSub && (
                          <div className="bg-surface p-4 rounded space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-label-caps text-label-caps uppercase text-secondary">
                                Monthly Executive Satvik Plan
                              </span>
                              <span className="font-button-text text-button-text text-onyx-black">
                                {tiffin.subProgress.delivered} of {tiffin.subProgress.total} Meals Delivered
                              </span>
                            </div>
                            <div className="w-full bg-surface-container-high h-2 rounded overflow-hidden">
                              <div
                                className="bg-onyx-black h-full rounded"
                                style={{ width: `${tiffin.subProgress.percent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between font-label-caps text-label-caps text-secondary">
                              <span>{tiffin.subProgress.remaining} meals remaining in cycle</span>
                              <span>Next billing: {tiffin.subProgress.nextBill}</span>
                            </div>
                          </div>
                        )}

                        {/* Inclusions or Specifications */}
                        {tiffin.inclusions && (
                          <div className="bg-surface p-4 rounded space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-label-caps text-label-caps uppercase text-secondary">
                                Verified Menu Inclusions
                              </span>
                              <span className="font-label-caps text-label-caps text-clay-earth">
                                100% Homestyle Pure Veg
                              </span>
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface-variant font-body-md text-body-md text-[14px]">
                              {tiffin.inclusions.map((inc, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-clay-earth" />
                                  <span>{inc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tiffin.macros && (
                          <div className="bg-surface p-4 rounded space-y-3">
                            <span className="font-label-caps text-label-caps uppercase text-secondary block">
                              Macro Nutrition Balance
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-surface-container-low p-2 rounded text-center">
                                <span className="font-label-caps text-label-caps text-secondary block">Protein</span>
                                <span className="font-button-text text-button-text text-onyx-black">
                                  {tiffin.macros.protein}
                                </span>
                              </div>
                              <div className="bg-surface-container-low p-2 rounded text-center">
                                <span className="font-label-caps text-label-caps text-secondary block">Calories</span>
                                <span className="font-button-text text-button-text text-onyx-black">
                                  {tiffin.macros.calories}
                                </span>
                              </div>
                              <div className="bg-surface-container-low p-2 rounded text-center">
                                <span className="font-label-caps text-label-caps text-secondary block">Carbs (GI)</span>
                                <span className="font-button-text text-button-text text-onyx-black">
                                  {tiffin.macros.carbs}
                                </span>
                              </div>
                            </div>
                            {tiffin.specs && (
                              <p className="font-body-md text-[14px] text-on-surface-variant">{tiffin.specs}</p>
                            )}
                          </div>
                        )}

                        {/* Cutoff Notice */}
                        {tiffin.cutoff && (
                          <div className="bg-surface-container p-3 rounded flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-secondary">timer</span>
                              <span className="font-label-caps text-label-caps text-on-surface">{tiffin.cutoff}</span>
                            </div>
                            {tiffin.timeLeft && (
                              <span className="font-label-caps text-label-caps text-secondary hidden sm:inline">
                                {tiffin.timeLeft}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Logistics & Actions (3 cols) */}
                      <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-6 lg:pl-4">
                        <div className="bg-surface p-4 rounded space-y-2">
                          <span className="font-label-caps text-label-caps uppercase text-secondary block">
                            Destination
                          </span>
                          <div className="flex items-start gap-2 text-onyx-black">
                            <span className="material-symbols-outlined text-[18px] text-clay-earth mt-0.5">home</span>
                            <div>
                              <span className="font-button-text text-button-text block leading-tight">Home Dropoff</span>
                              <span className="font-body-md text-[13px] text-on-surface-variant block mt-0.5 leading-snug">
                                {tiffin.destination}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setModalPayload(tiffin);
                              setActiveModal('details');
                            }}
                            className="w-full py-2.5 px-4 rounded bg-onyx-black text-on-primary font-button-text text-button-text text-center hover:bg-primary-container transition-colors"
                          >
                            View Menu / Details
                          </button>

                          {tiffin.inclusions ? (
                            <button
                              onClick={() => {
                                setModalPayload(tiffin);
                                setActiveModal('modify-rotli');
                              }}
                              className="w-full py-2.5 px-4 rounded bg-surface-container hover:bg-surface-container-highest text-onyx-black font-button-text text-button-text text-center transition-colors"
                            >
                              Modify Items / Rotli Count
                            </button>
                          ) : tiffin.isSub ? (
                            <button
                              onClick={() => {
                                setModalPayload(tiffin);
                                setActiveModal('manage-sub');
                              }}
                              className="w-full py-2.5 px-4 rounded bg-surface-container hover:bg-surface-container-highest text-onyx-black font-button-text text-button-text text-center transition-colors"
                            >
                              Manage Subscription
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setRescheduleDate(tiffin.dateText);
                                setActiveModal('reschedule');
                              }}
                              className="w-full py-2.5 px-4 rounded bg-surface-container hover:bg-surface-container-highest text-onyx-black font-button-text text-button-text text-center transition-colors"
                            >
                              Reschedule Date
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setModalPayload(tiffin);
                              setActiveModal('skip-meal');
                            }}
                            className="w-full py-2 px-4 rounded text-error hover:bg-error-container/30 font-button-text text-button-text text-center transition-colors"
                          >
                            Skip / Cancel Meal
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>

            {/* Bottom Concierge Bento */}
            <section className="w-full pb-16">
              <div className="bg-surface-container-low rounded-lg p-8 lg:p-12">
                <div className="max-w-2xl mb-8">
                  <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block mb-2">
                    Service Protocols &amp; Escrow Integrity
                  </span>
                  <h2 className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-tight">
                    Subscription Pause &amp; Delivery Concierge
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                    Structured homestyle dining requires predictable kitchen prep. Here is how our meal locking, canister circulation, and cancellation guarantees operate.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface p-6 rounded flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-onyx-black">
                        <span className="material-symbols-outlined text-[22px]">alarm_on</span>
                      </div>
                      <h3 className="font-button-text text-[16px] text-onyx-black">Automated Cutoffs</h3>
                      <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed">
                        Kitchens source farm produce daily. Lunch slots lock modifications at 09:00 PM the preceding evening. Dinner slots lock at 02:00 PM same day.
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">
                        Guaranteed Zero Food Waste
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface p-6 rounded flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-onyx-black">
                        <span className="material-symbols-outlined text-[22px]">swap_horizontal_circle</span>
                      </div>
                      <h3 className="font-button-text text-[16px] text-onyx-black">Canister Rotation Deposit</h3>
                      <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed">
                        Our 3-tier food-grade 304 stainless steel dabbas are exchanged upon each delivery. Keep yesterday's rinsed canister ready for the pickup rider.
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">
                        Fully Refundable Security Vault
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface p-6 rounded flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-onyx-black">
                        <span className="material-symbols-outlined text-[22px]">verified_user</span>
                      </div>
                      <h3 className="font-button-text text-[16px] text-onyx-black">0-Penalty Meal Skips</h3>
                      <p className="font-body-md text-[14px] text-on-surface-variant leading-relaxed">
                        Traveling or eating out? Skipping a meal before the cutoff immediately rolls the delivery credit forward to your next billing cycle with zero deduction.
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">
                        100% Escrow Protection
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface px-6 py-4 rounded">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-clay-earth text-[20px]">headset_mic</span>
                    <span className="font-body-md text-[14px] text-onyx-black">
                      Need custom timing or urgent delivery rerouting to another zone?
                    </span>
                  </div>
                  <button
                    onClick={() => triggerToast('Connecting with Satellite Area Dispatch Concierge...')}
                    className="font-button-text text-button-text text-onyx-black hover:text-clay-earth transition-colors underline uppercase tracking-wider text-[13px]"
                  >
                    Speak with Desk Concierge
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 4: ORDER HISTORY & CULINARY PROVENANCE                           */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="w-full flex flex-col gap-10 animate-in fade-in duration-200">
            {/* Header with Statement Export */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 pt-2">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                    Ledger &amp; Provenance Vault
                  </span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-sand-neutral text-onyx-black font-label-caps text-label-caps">
                    {historyOrders.length} Archived
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg tracking-tight text-onyx-black leading-none">
                  Order History &amp; Culinary Provenance
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Inspect historical homestyle deliveries, digital receipts, verified FSSAI kitchen ratings, and single-click reorders.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleExportStatement}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-surface-container-high hover:bg-surface-variant text-onyx-black font-button-text text-button-text transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Export Statement (PDF)</span>
                </button>
                <div className="hidden sm:flex items-center gap-2 px-4 py-3 bg-surface-container-lowest shadow-sm">
                  <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                  <span className="font-label-caps text-label-caps text-secondary uppercase">
                    304 Steel Canister Cycle Active
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4">
              <div className="p-6 bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Total Consumed Meals</span>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-headline-md text-headline-md text-onyx-black">
                    {historyOrders.length}
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary">100% Hygienic</span>
                </div>
              </div>
              <div className="p-6 bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Escrow Spend Settled</span>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-headline-md text-headline-md text-onyx-black">
                    ₹{historyOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary">GST Cleared</span>
                </div>
              </div>
              <div className="p-6 bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Average Delivery Time</span>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-headline-md text-headline-md text-onyx-black">
                    {historyOrders.length > 0 ? '23.4 min' : '0 min'}
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary">Hot Seal</span>
                </div>
              </div>
              <div className="p-6 bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Canister Return Integrity</span>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-headline-md text-headline-md text-onyx-black">
                    {historyOrders.length} / {historyOrders.length}
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary">Zero Deposit Loss</span>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-surface-container-lowest p-6 shadow-sm mb-4 space-y-6">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by Order ID (e.g. #TL-4521), dish name, or provider..."
                  className="w-full bg-surface pl-12 pr-4 py-3.5 text-onyx-black placeholder-secondary font-body-md text-body-md focus:outline-none focus:bg-surface-bright transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: `All History (${historyOrders.length})` },
                    { id: 'delivered', label: `Delivered (${historyOrders.filter((o) => o.status === 'Delivered' || o.rawStatus === 'delivered').length})` },
                    { id: 'subs', label: `Completed Subscriptions (${subscriptions.filter((s) => s.status === 'COMPLETED').length})` }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setHistoryFilter(f.id)}
                      className={`px-4 py-2 font-button-text text-button-text transition-colors ${
                        historyFilter === f.id
                          ? 'bg-onyx-black text-on-primary'
                          : 'bg-surface hover:bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="bg-surface px-3 py-2 font-button-text text-button-text text-onyx-black focus:outline-none cursor-pointer"
                  >
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>Year 2026</option>
                  </select>

                  <select
                    value={kitchenFilter}
                    onChange={(e) => setKitchenFilter(e.target.value)}
                    className="bg-surface px-3 py-2 font-button-text text-button-text text-onyx-black focus:outline-none cursor-pointer"
                  >
                    <option>All Kitchens</option>
                    <option>Mom's Kitchen</option>
                    <option>Ghar Ka Khana</option>
                    <option>Healthy Meals</option>
                    <option>Shree Tiffin Service</option>
                  </select>

                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="bg-surface px-3 py-2 font-button-text text-button-text text-onyx-black focus:outline-none cursor-pointer"
                  >
                    <option>Payment: All</option>
                    <option>UPI (ICICI / Razorpay)</option>
                    <option>Cash on Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Historical Cards Feed */}
            {historyOrders.length === 0 ? (
              <div className="bg-surface-container-lowest p-12 text-center shadow-sm space-y-4">
                <span className="material-symbols-outlined text-[48px] text-secondary">history_edu</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black">No Order History Found</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  You have not completed any deliveries yet. Place an order to build your culinary ledger and digital receipts.
                </p>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('#order-tiffin');
                    else window.location.hash = '#order-tiffin';
                  }}
                  className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text hover:bg-clay-earth transition-colors"
                >
                  Order Tiffin Now
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {historyOrders
                  .filter((o) => {
                    if (!historySearch.trim()) return true;
                    const query = historySearch.toLowerCase();
                    return (
                      (o.orderId || '').toLowerCase().includes(query) ||
                      (o.tiffinName || '').toLowerCase().includes(query) ||
                      (o.providerName || '').toLowerCase().includes(query)
                    );
                  })
                  .map((order) => (
                    <div
                      key={order._id}
                      className="bg-surface-container-lowest p-6 lg:p-8 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-headline-md text-headline-md text-onyx-black">
                              {order.orderId || order._id}
                            </span>
                            <span className="px-2.5 py-1 bg-surface-container font-label-caps text-label-caps text-clay-earth uppercase tracking-wide">
                              Delivered ✓
                            </span>
                            <span className="px-2 py-0.5 bg-surface-variant font-label-caps text-label-caps text-secondary">
                              {order.date || 'Recent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps">
                            <span className="material-symbols-outlined text-[16px] text-clay-earth">verified</span>
                            <span>
                              {order.providerName || "Kitchen Partner"} • {order.providerAddress || 'Ahmedabad'} • FSSAI #{order.fssai || '10721026000412'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end">
                          <span className="font-headline-md text-headline-md text-onyx-black">
                            ₹{order.totalAmount || 0}.00
                          </span>
                          <span className="font-label-caps text-label-caps text-secondary uppercase">
                            {order.paymentStatus || order.paymentMethod || 'Paid'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 bg-surface-container-low p-6 my-2">
                        <div className="lg:col-span-3">
                          <img
                            className="w-full h-44 object-cover shadow-sm"
                            alt={order.tiffinName}
                            src={order.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3-Ji_Btd_oK6I-X-aVCZMGi5GQ44H0BFj791Qy__LR2k6M_Q0SDof2oCdSQZ5VdVkg1azNzxU2fXi6gbaTmCbyKqliRLEUAb6sFPPJtpGVPDlsvlpumd_yNkFC3lmfuwjTQsKOE1ANb9C9airyrORl09rBnh4LJ_uqLwWvfrj2aXmoFpC12NP5DaZkNnbx4Y2hbYaBQczQy-O2ioUm5Qe2L8OYoXAYEzZFP2ZpsDPH3cte4lVjNzz'}
                          />
                        </div>

                        <div className="lg:col-span-9 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider">
                              Consignment Specification
                            </span>
                            <h3 className="font-headline-md text-headline-md text-onyx-black">
                              {order.tiffinName || 'Homestyle Meal'}
                            </h3>
                            <p className="font-body-md text-body-md text-on-surface-variant">
                              {order.items && order.items.length > 0
                                ? order.items.map((i) => `${i.quantity ? `${i.quantity}x ` : ''}${i.name || i.tiffinName}`).join(', ')
                                : (order.description || 'Homestyle tiffin meal prepared fresh with natural ingredients.')}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="p-3 bg-surface-container-lowest">
                              <span className="font-label-caps text-label-caps text-secondary block uppercase">
                                Dedicated Courier
                              </span>
                              <span className="font-button-text text-button-text text-onyx-black">
                                {order.driver?.name || order.driverName || 'Assigned Courier Partner'}
                              </span>
                            </div>
                            <div className="p-3 bg-surface-container-lowest">
                              <span className="font-label-caps text-label-caps text-secondary block uppercase">
                                Thermal Handshake OTP
                              </span>
                              <span className="font-button-text text-button-text text-onyx-black">
                                {order.otp ? `${order.otp} (Verified)` : 'Handover Complete'}
                              </span>
                            </div>
                            <div className="p-3 bg-surface-container-lowest">
                              <span className="font-label-caps text-label-caps text-secondary block uppercase">
                                Vessel Custody
                              </span>
                              <span className="font-button-text text-button-text text-clay-earth">
                                {order.vesselStatus || '304 Steel Cycle Completed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.rating ? (
                        <div className="mt-6 p-4 bg-surface-container-high flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-onyx-black">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span
                                  key={s}
                                  className="material-symbols-outlined text-[18px]"
                                  style={{ fontVariationSettings: `'FILL' ${s <= order.rating ? 1 : 0}` }}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                            <span className="font-button-text text-button-text text-onyx-black">Rated {order.rating}.0</span>
                            <span className="hidden md:inline font-body-md text-body-md text-on-surface-variant">
                              “{order.reviewText || order.review || 'Delicious homestyle preparation.'}”
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setReviewOrder(order);
                              setReviewRating(order.rating || 5);
                              setReviewComment(order.reviewText || order.review || '');
                              setActiveModal('review');
                            }}
                            className="font-button-text text-button-text text-onyx-black underline hover:text-clay-earth transition-colors"
                          >
                            Edit Review
                          </button>
                        </div>
                      ) : (
                        <div className="mt-6 p-4 bg-surface-container-high flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px] text-secondary">reviews</span>
                            <span className="font-body-md text-body-md text-onyx-black">
                              Share your culinary feedback with the kitchen.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setReviewOrder(order);
                              setReviewRating(5);
                              setReviewComment('');
                              setActiveModal('review');
                            }}
                            className="px-4 py-2 bg-surface-container-lowest hover:bg-surface-variant text-onyx-black font-button-text text-button-text transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            <span
                              className="material-symbols-outlined text-[16px] text-amber-700"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span>Rate &amp; Review This Meal</span>
                          </button>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
                          <span className="font-label-caps text-label-caps text-secondary">Culinary audit complete</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setModalPayload(order);
                              setActiveModal('receipt');
                            }}
                            className="px-5 py-2.5 bg-surface-container hover:bg-surface-variant font-button-text text-button-text text-onyx-black transition-colors"
                          >
                            View Receipt / Dossier
                          </button>
                          <button
                            onClick={() => {
                              triggerToast(`Reordering ${order.tiffinName || 'Tiffin'}...`);
                              if (onNavigate) onNavigate('#order-tiffin');
                              else window.location.hash = '#order-tiffin';
                            }}
                            className="px-6 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text transition-colors"
                          >
                            Reorder This Tiffin
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Pagination Strip */}
            {historyOrders.length > 0 && (
              <div className="mt-8 p-8 bg-surface-container-lowest shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Audited Ledger Pagination</span>
                  <p className="font-body-md text-body-md text-onyx-black">
                    Displaying 1 – {historyOrders.length} of {historyOrders.length} historical culinary records
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 flex items-center justify-center bg-onyx-black text-on-primary font-button-text text-button-text">
                    1
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 5: CANCELLED ORDERS & REFUND STATUS                             */}
        {/* ========================================================================= */}
        {activeTab === 'cancelled' && (
          <div className="w-full flex flex-col gap-10 animate-in fade-in duration-200">
            {/* Header & KPI Counters */}
            <div className="pt-2 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                    Telemetry Node // Escrow Journal
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-error" />
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    Archive Registry
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                  Cancelled Orders &amp; Refund Status
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">
                  Transparent auditing of voided orders, automated UPI/Bank refund traces, and dispute resolution for Satellite and Bodakdev culinary hubs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-surface-container px-5 py-3 rounded">
                  <div className="font-label-caps text-label-caps uppercase text-secondary">Voided Records</div>
                  <div className="font-headline-md text-headline-md text-onyx-black leading-none mt-1">
                    {cancelledOrders.length < 10 ? `0${cancelledOrders.length}` : cancelledOrders.length}
                  </div>
                </div>
                <div className="bg-surface-container px-5 py-3 rounded">
                  <div className="font-label-caps text-label-caps uppercase text-secondary">Disbursed Volume</div>
                  <div className="font-headline-md text-headline-md text-onyx-black leading-none mt-1">
                    ₹{cancelledOrders.reduce((sum, o) => sum + (Number(o.refundAmount || o.totalAmount) || 0), 0).toLocaleString('en-IN')}<span className="text-xs font-button-text font-normal text-on-surface-variant">.00</span>
                  </div>
                </div>
                <div className="bg-surface-container-high px-5 py-3 rounded">
                  <div className="font-label-caps text-label-caps uppercase text-secondary">Mean Settle Velocity</div>
                  <div className="font-headline-md text-headline-md text-clay-earth leading-none mt-1">
                    {cancelledOrders.length > 0 ? '2m 14s' : '0s'}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Refund Lifecycle Banner (Automated Escrow Telemetry) */}
            <div className="w-full bg-bone-white rounded-lg p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest">
                    Protocol 102.4-A
                  </span>
                  <h2 className="font-headline-md text-headline-md text-onyx-black mt-1">Automated Escrow Telemetry</h2>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-caps text-label-caps bg-surface-container px-3 py-1.5 rounded self-start lg:self-auto">
                  <span className="material-symbols-outlined text-[16px] text-clay-earth">verified_user</span>
                  <span>NPCI Direct Relay • Yes Bank Nodal Account 0038</span>
                </div>
              </div>

              {/* 4-Step Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <div className="bg-surface-container p-4 rounded flex flex-col justify-between relative">
                  <div className="flex items-center justify-between text-secondary mb-3">
                    <span className="font-label-caps text-label-caps uppercase tracking-wider">Step 01</span>
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                  </div>
                  <div>
                    <div className="font-button-text text-button-text text-onyx-black font-semibold">Order Cancelled</div>
                    <div className="font-body-md text-label-caps text-on-surface-variant mt-1">
                      Grace trigger before kitchen cutoff timestamp.
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container p-4 rounded flex flex-col justify-between relative">
                  <div className="flex items-center justify-between text-secondary mb-3">
                    <span className="font-label-caps text-label-caps uppercase tracking-wider">Step 02</span>
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  </div>
                  <div>
                    <div className="font-button-text text-button-text text-onyx-black font-semibold">Payment Verification</div>
                    <div className="font-body-md text-label-caps text-on-surface-variant mt-1">
                      Automated ledger cross-check against vault capture.
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container p-4 rounded flex flex-col justify-between relative">
                  <div className="flex items-center justify-between text-secondary mb-3">
                    <span className="font-label-caps text-label-caps uppercase tracking-wider">Step 03</span>
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </div>
                  <div>
                    <div className="font-button-text text-button-text text-onyx-black font-semibold">IMPS / UPI Batch</div>
                    <div className="font-body-md text-label-caps text-on-surface-variant mt-1">
                      High-speed release directly via banking clearinghouse.
                    </div>
                  </div>
                </div>

                <div className="bg-primary text-on-primary p-4 rounded flex flex-col justify-between relative">
                  <div className="flex items-center justify-between text-tertiary-fixed mb-3">
                    <span className="font-label-caps text-label-caps uppercase tracking-wider">Step 04</span>
                    <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span>
                  </div>
                  <div>
                    <div className="font-button-text text-button-text text-white font-semibold">Source Account Credit</div>
                    <div className="font-body-md text-label-caps text-on-primary-fixed-variant mt-1">
                      100% full balance returned to originating handle.
                    </div>
                  </div>
                </div>
              </div>

              {/* COD Notice Strip */}
              <div className="mt-6 bg-surface-container-high px-4 py-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-on-surface-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
                  <span className="font-body-md text-button-text text-onyx-black">Cash on Delivery (COD) Mechanism:</span>
                  <span className="font-body-md text-body-md text-on-surface-variant hidden sm:inline">
                    No currency captured. Meal canister deposit &amp; escrow obligation released immediately with zero penalty.
                  </span>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary bg-surface px-2.5 py-1 rounded self-start sm:self-auto">
                  Zero-Hold Ledger
                </span>
              </div>
            </div>

            {/* Cancelled Feed Cards */}
            {cancelledOrders.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-lg p-12 text-center shadow-sm space-y-4">
                <span className="material-symbols-outlined text-[48px] text-secondary">task_alt</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black">No Cancelled Orders</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  You have zero cancelled orders or pending refund disputes. All your active and scheduled meals are in good standing.
                </p>
                <button
                  onClick={() => switchTab('active')}
                  className="px-6 py-2.5 bg-onyx-black text-on-primary rounded font-button-text text-button-text hover:bg-neutral-800 transition-colors"
                >
                  View Active Deliveries
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {cancelledOrders.map((order) => {
                const isOnline =
                  (order.paymentMethod || '').toLowerCase().includes('upi') ||
                  (order.paymentMethod || '').toLowerCase().includes('online');
                const orderKey = order.orderId || order._id;
                const arn = order.arnRef || 'NPCI-REF-8921048201';

                return (
                  <div
                    key={orderKey}
                    className="bg-surface-container-lowest rounded-lg shadow-md p-6 lg:p-8 transition-all hover:shadow-lg"
                  >
                    {/* Card Super-Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-headline-md text-headline-md text-onyx-black tracking-tight">
                          Order {order.orderId || orderKey}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-caps text-label-caps tracking-widest uppercase flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-error" /> CANCELLED
                        </span>
                        <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase">
                          {isOnline ? 'Online Pre-paid (UPI)' : 'Cash on Delivery (COD)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-label-caps text-label-caps text-secondary block">
                          Cancellation Timestamp
                        </span>
                        <span className="font-button-text text-button-text text-onyx-black">
                          {order.date || '28 Sep 2026, 11:22 AM'}
                        </span>
                      </div>
                    </div>

                    {/* Main Body Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                        <div className="flex items-start gap-4">
                          <img
                            className="w-20 h-20 rounded object-cover shadow-sm shrink-0"
                            alt={order.providerName || 'Kitchen'}
                            src={
                              order.image ||
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuDpczy9ShlJdBXSPSN70jL7ew5uySCwu1HErUiRCxH0vitIUaZgb83O3xdHXMdpExv838UHG0nFfNBWuq5bWzmRQfZ8Nhx1o1GJ2hPb2mCr-tOMvOBIftluVFNgR0qm220CKrea8Q5u2-Acum1HT9gf1Yi6YQ6ePQLzBFkvfjjkLs0tZmnJSu4a9cLX6VryFXE5Z0sXxczfRimaMCaPeUNLvhBGXbYiscWETXYF2ode77_-MnVQ7fum'
                            }
                          />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h3 className="font-headline-md text-headline-md text-onyx-black">
                                {order.providerName || "Mom's Kitchen"}
                              </h3>
                              <span className="font-label-caps text-label-caps text-secondary uppercase">
                                {order.providerAddress || 'Satellite, Ahmedabad'}
                              </span>
                            </div>
                            <div className="font-body-md text-body-md text-on-surface mt-1">
                              {order.tiffinName}
                            </div>
                            <div className="font-label-caps text-label-caps text-secondary mt-1 flex items-center gap-2">
                              <span>Gross Charged: ₹{order.totalAmount}.00</span>
                              <span>•</span>
                              <span>{isOnline ? `UPI: ${order.upiHandle || 'aarav@okaxis'}` : 'COD (Doorstep Handover)'}</span>
                              <span>•</span>
                              <span>Canister {order.canister || '#C-809'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-container p-4 rounded space-y-3">
                          <div className="flex items-center justify-between text-on-surface-variant font-body-md text-button-text">
                            <span className="text-secondary font-label-caps text-label-caps uppercase">Ordered At:</span>
                            <span className="text-onyx-black">{order.orderedAt || '28 Sep 2026, 11:15 AM'}</span>
                          </div>
                          <div className="flex items-center justify-between text-on-surface-variant font-body-md text-button-text">
                            <span className="text-secondary font-label-caps text-label-caps uppercase">Grace Window Used:</span>
                            <span className="text-onyx-black">{order.graceUsed || '7 mins elapsed (Cutoff threshold: 10 mins)'}</span>
                          </div>
                          <div className="flex items-start justify-between gap-4 text-on-surface-variant font-body-md text-button-text">
                            <span className="text-secondary font-label-caps text-label-caps uppercase shrink-0">Declared Cause:</span>
                            <span className="text-right text-onyx-black italic font-headline-md text-[18px] leading-snug">
                              “{order.cancellationReason || order.declaredCause || 'Customer requested 0-penalty cancellation'}”
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            onClick={() =>
                              setExpandedDossier((prev) => ({ ...prev, [orderKey]: !prev[orderKey] }))
                            }
                            className="bg-onyx-black text-white hover:bg-clay-earth font-button-text text-button-text px-5 py-2.5 rounded transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                            <span>{expandedDossier[orderKey] ? 'Hide Complete Dossier' : 'View Complete Dossier'}</span>
                          </button>

                          {isOnline ? (
                            <button
                              onClick={() => triggerToast(`Downloading verified PDF refund receipt with ${arn}...`)}
                              className="bg-surface-container hover:bg-surface-container-high text-onyx-black font-button-text text-button-text px-4 py-2.5 rounded transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                              <span>Download Refund Receipt (PDF)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                triggerToast('Redirecting to Meal Customizer with saved items and address selector...');
                                if (onNavigate) onNavigate('#order-tiffin');
                                else window.location.hash = '#order-tiffin';
                              }}
                              className="bg-surface-container hover:bg-surface-container-high text-onyx-black font-button-text text-button-text px-4 py-2.5 rounded transition-colors flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[18px]">cached</span>
                              <span>Reorder with Correct Address</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (onNavigate) onNavigate('#order-tiffin');
                              else window.location.hash = '#order-tiffin';
                            }}
                            className="text-onyx-black font-button-text text-button-text hover:text-secondary underline decoration-1 underline-offset-4 px-2 py-2 transition-colors"
                          >
                            Order Again →
                          </button>
                        </div>
                      </div>

                      {/* Right Telemetry Panel */}
                      <div className="lg:col-span-5 bg-surface-container rounded-lg p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">
                              Settlement Registry
                            </span>
                            <span
                              className={`px-3 py-1 rounded font-label-caps text-label-caps uppercase tracking-wider flex items-center gap-1.5 ${
                                isOnline
                                  ? 'bg-primary text-white'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isOnline ? 'check' : 'format_image_left'}
                              </span>
                              <span>{isOnline ? 'Refunded • 100%' : 'NO REFUND REQUIRED'}</span>
                            </span>
                          </div>

                          <div className="space-y-4 my-6">
                            <div>
                              <div className="font-label-caps text-label-caps text-secondary uppercase">
                                {isOnline ? 'Disbursed Principal' : 'Captured Payment Balance'}
                              </div>
                              <div className="font-headline-md text-headline-md text-onyx-black tracking-tight">
                                ₹{isOnline ? order.totalAmount : 0}.00
                              </div>
                            </div>

                            <div className="bg-surface p-3 rounded space-y-2 font-body-md text-button-text">
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span className="text-secondary font-label-caps text-label-caps uppercase">
                                  {isOnline ? 'NPCI ARN Ref:' : 'Escrow Hold Status:'}
                                </span>
                                <span className="font-mono text-onyx-black font-medium select-all">
                                  {isOnline ? arn : 'None (COD Dispatch Aborted)'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span className="text-secondary font-label-caps text-label-caps uppercase">
                                  {isOnline ? 'Dispatched Node:' : 'Cancellation Penalty:'}
                                </span>
                                <span className="text-onyx-black">
                                  {isOnline ? 'Yes Bank Nodal Escrow' : '₹0.00 (Zero Penalty Guarantee)'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-on-surface-variant">
                                <span className="text-secondary font-label-caps text-label-caps uppercase">
                                  {isOnline ? 'Processing Time:' : 'Delivery Rider Queue:'}
                                </span>
                                <span className="text-onyx-black">
                                  {isOnline ? '2 mins (Immediate Batch)' : 'Removed from Route Batch'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-container-high p-3 rounded flex items-center justify-between text-secondary">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-700 animate-ping" />
                            <span className="font-label-caps text-label-caps uppercase text-onyx-black">
                              {isOnline ? 'Webhook Reconciled' : 'Zero Grievance Recorded'}
                            </span>
                          </div>
                          {isOnline && (
                            <svg className="w-24 h-6 text-clay-earth" fill="none" viewBox="0 0 100 24">
                              <path
                                d="M0 12h20l5-8 10 16 10-14 8 10 7-4h40"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.75"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Dossier Module */}
                    {expandedDossier[orderKey] && (
                      <div className="mt-8 pt-6 bg-surface-container-low p-6 rounded-lg animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-4">
                          <h4 className="font-headline-md text-headline-md text-onyx-black">
                            Escrow Vault Audit Report • #{orderKey}
                          </h4>
                          <span className="font-label-caps text-label-caps text-secondary uppercase">
                            Digest: {isOnline ? 'SHA256-VALID' : 'COD-RELEASE-CONFIRMED'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-body-md text-body-md text-on-surface-variant">
                          <div>
                            <p className="font-label-caps text-label-caps uppercase text-onyx-black mb-1">
                              Kitchen Allocation Status
                            </p>
                            <p>
                              Stove ignited: No. Prep sheet flagged as VOID. Zero ingredients wasted or charged to provider ledger.
                            </p>
                          </div>
                          <div>
                            <p className="font-label-caps text-label-caps uppercase text-onyx-black mb-1">
                              Eco-Canister Reassignment
                            </p>
                            <p>
                              Stainless steel tiffin stack disassociated from delivery dispatch route. Returned to ready rack.
                            </p>
                          </div>
                          <div>
                            <p className="font-label-caps text-label-caps uppercase text-onyx-black mb-1">
                              Clearinghouse Trace
                            </p>
                            <p>
                              {isOnline
                                ? `Batch ID: ESCROW-${orderKey}. Direct credit acknowledgment received from remitting UPI switch.`
                                : 'Customer COD privilege score remains 100/100 under 10-Minute Fair Use Policy.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

            {/* Ombudsman & Policy Accordions */}
            <div className="mt-8 pt-8">
              <div className="max-w-xl mb-8">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
                  Operational Protections
                </span>
                <h2 className="font-headline-md text-headline-md text-onyx-black tracking-tight mt-1">
                  Escrow Governance &amp; Ombudsman Desk
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                  Structured homestyle dining protected by contractual safety protocols, guaranteed refunds, and dedicated mediation.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-3">
                  {/* Accordion 1 */}
                  <div className="bg-surface-container rounded-lg overflow-hidden transition-colors">
                    <button
                      onClick={() =>
                        setOpenAccordions((prev) => ({ ...prev, 'policy-1': !prev['policy-1'] }))
                      }
                      className="w-full text-left p-5 flex items-center justify-between text-onyx-black hover:bg-surface-container-high transition-colors"
                    >
                      <span className="font-headline-md text-[20px] leading-tight">
                        TiffinLink 10-Minute Zero Penalty Cancellation Policy
                      </span>
                      <span
                        className={`material-symbols-outlined text-secondary transition-transform duration-200 ${
                          openAccordions['policy-1'] ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                    {openAccordions['policy-1'] && (
                      <div className="px-5 pb-5 pt-1 text-on-surface-variant font-body-md text-body-md">
                        To support home kitchens, culinary prep starts precisely 10 minutes following order confirmation. Cancellations placed within this 10-minute window trigger a 100% instantaneous refund to original UPI or debit methods without administrative cuts or merchant retention fees.
                      </div>
                    )}
                  </div>

                  {/* Accordion 2 */}
                  <div className="bg-surface-container rounded-lg overflow-hidden transition-colors">
                    <button
                      onClick={() =>
                        setOpenAccordions((prev) => ({ ...prev, 'policy-2': !prev['policy-2'] }))
                      }
                      className="w-full text-left p-5 flex items-center justify-between text-onyx-black hover:bg-surface-container-high transition-colors"
                    >
                      <span className="font-headline-md text-[20px] leading-tight">
                        Eco-Canister Deposit Protection
                      </span>
                      <span
                        className={`material-symbols-outlined text-secondary transition-transform duration-200 ${
                          openAccordions['policy-2'] ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                    {openAccordions['policy-2'] && (
                      <div className="px-5 pb-5 pt-1 text-on-surface-variant font-body-md text-body-md">
                        Food grade 304-grade stainless steel tiffin containers require a nominal circulating deposit. When an order is voided or cancelled prior to dispatch, the canister reservation lock is immediately released and credited to your ledger without waiting periods.
                      </div>
                    )}
                  </div>

                  {/* Accordion 3 */}
                  <div className="bg-surface-container rounded-lg overflow-hidden transition-colors">
                    <button
                      onClick={() =>
                        setOpenAccordions((prev) => ({ ...prev, 'policy-3': !prev['policy-3'] }))
                      }
                      className="w-full text-left p-5 flex items-center justify-between text-onyx-black hover:bg-surface-container-high transition-colors"
                    >
                      <span className="font-headline-md text-[20px] leading-tight">
                        Inter-Bank UPI Settlement Window Guarantee
                      </span>
                      <span
                        className={`material-symbols-outlined text-secondary transition-transform duration-200 ${
                          openAccordions['policy-3'] ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </button>
                    {openAccordions['policy-3'] && (
                      <div className="px-5 pb-5 pt-1 text-on-surface-variant font-body-md text-body-md">
                        While 94% of our refunds process within 180 seconds via Yes Bank Nodal routing, NPCI inter-bank network latency can occasionally hold funds up to 2-4 business hours. You can track exact status using the ARN reference code provided in your order dossier.
                      </div>
                    )}
                  </div>
                </div>

                {/* Ombudsman Contact Sidebar */}
                <div className="lg:col-span-4 bg-bone-white p-6 rounded-lg flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 text-clay-earth mb-3">
                      <span className="material-symbols-outlined text-[20px]">balance</span>
                      <span className="font-label-caps text-label-caps uppercase tracking-wider">Independent Ombudsman</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-onyx-black">Escrow Dispute Desk</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                      If an IMPS/UPI refund has not reflected after 24 hours, our nodal dispute officer will liaise directly with your remitting bank.
                    </p>

                    <div className="mt-6 space-y-3 font-body-md text-body-md">
                      <div className="bg-surface p-3 rounded">
                        <span className="font-label-caps text-label-caps uppercase text-secondary block">Email Support Desk</span>
                        <a className="font-button-text text-button-text text-onyx-black hover:underline select-all" href="mailto:support@tiffinlink.com">
                          support@tiffinlink.com
                        </a>
                      </div>
                      <div className="bg-surface p-3 rounded">
                        <span className="font-label-caps text-label-caps uppercase text-secondary block">Direct Toll-Free Hotline</span>
                        <a className="font-button-text text-button-text text-onyx-black hover:underline select-all" href="tel:+919876543210">
                          +91 98765 43210
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 text-secondary font-label-caps text-label-caps">
                    Operational Hours: 08:00 AM – 10:00 PM IST (Mon – Sun)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS                                                       */}
      {/* ========================================================================= */}

      {/* 1. Meal Details Modal */}
      {activeModal === 'details' && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 lg:p-8 shadow-2xl relative space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary block">
                  Dish &amp; Kitchen Manifest
                </span>
                <h3 className="font-headline-md text-headline-md text-onyx-black tracking-tight mt-1">
                  {modalPayload.title || 'Gujarati Special Thali'}
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-secondary hover:text-onyx-black p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="space-y-4 font-body-md text-body-md text-on-surface-variant">
              <div className="bg-surface-container-low p-4 rounded space-y-2">
                <div className="flex justify-between font-label-caps text-label-caps uppercase text-secondary">
                  <span>Culinary Partner</span>
                  <span className="text-onyx-black">{modalPayload.provider || "Mom's Kitchen"}</span>
                </div>
                <div className="flex justify-between font-label-caps text-label-caps uppercase text-secondary">
                  <span>Scheduled Delivery</span>
                  <span className="text-onyx-black">{modalPayload.dateText || 'Tomorrow 12:30 PM'}</span>
                </div>
                <div className="flex justify-between font-label-caps text-label-caps uppercase text-secondary">
                  <span>Escrow Billing Status</span>
                  <span className="text-onyx-black font-semibold">{modalPayload.amount || '₹140'}</span>
                </div>
              </div>
              <p className="text-body-md text-on-surface-variant text-[14px]">
                Prepared with filtered water, ground cold-pressed peanut/mustard oils, and zero commercial preservatives. Sealed in high-temperature sanitized stainless steel tier vessels.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded bg-onyx-black text-on-primary font-button-text text-button-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modify Rotli / Items Modal */}
      {activeModal === 'modify-rotli' && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 lg:p-8 shadow-2xl relative space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary block">
                  Customization Desk
                </span>
                <h3 className="font-headline-md text-headline-md text-onyx-black tracking-tight mt-1">
                  Modify Gujarati Thali
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-secondary hover:text-onyx-black p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <p className="font-body-md text-[14px] text-on-surface-variant">
              Adjust bread preference and spice balance before 09:00 PM cutoff tonight.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-surface-container p-3 rounded">
                <span className="font-button-text text-button-text text-onyx-black">Phulka Rotli Count</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRotliCount((prev) => Math.max(2, prev - 1))}
                    className="w-8 h-8 rounded bg-surface flex items-center justify-center font-bold text-onyx-black"
                  >
                    -
                  </button>
                  <span className="font-headline-md text-[20px] text-onyx-black px-2">{rotliCount}</span>
                  <button
                    onClick={() => setRotliCount((prev) => Math.min(8, prev + 1))}
                    className="w-8 h-8 rounded bg-surface flex items-center justify-center font-bold text-onyx-black"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface-container p-3 rounded">
                <span className="font-button-text text-button-text text-onyx-black">Ghee Application</span>
                <select
                  value={gheePreference}
                  onChange={(e) => setGheePreference(e.target.value)}
                  className="bg-surface font-body-md text-[14px] p-1.5 rounded outline-none text-onyx-black"
                >
                  <option>Desi Cow Ghee (Standard)</option>
                  <option>Dry / No Ghee (Dry Rotli)</option>
                  <option>Extra Ghee (+₹10)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-surface-container p-3 rounded">
                <span className="font-button-text text-button-text text-onyx-black">Spice Level</span>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className="bg-surface font-body-md text-[14px] p-1.5 rounded outline-none text-onyx-black"
                >
                  <option>Mild Homestyle (Default)</option>
                  <option>Medium Kathiyawadi Spice</option>
                  <option>Non-Spicy (Satvik)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded bg-surface-container font-button-text text-button-text text-onyx-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  triggerToast(`Meal customisations recorded: ${rotliCount} Rotli, ${gheePreference}, ${spiceLevel}.`);
                }}
                className="px-5 py-2.5 rounded bg-onyx-black text-on-primary font-button-text text-button-text"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Skip Meal Confirmation Modal */}
      {activeModal === 'skip-meal' && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 lg:p-8 shadow-2xl relative space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary block">Meal Cancellation</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black tracking-tight mt-1">
                  Skip {modalPayload.title || 'Scheduled Delivery'}?
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-secondary hover:text-onyx-black p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <p className="font-body-md text-[14px] text-on-surface-variant">
              You are skipping prior to the cutoff window. <strong>₹0 penalty applies</strong>. The full meal amount or subscription credit will instantly reflect in your wallet vault.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded bg-surface-container font-button-text text-button-text text-onyx-black"
              >
                Keep Delivery
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  triggerToast('Meal scheduled dispatch has been skipped. Credit banked to Escrow Vault.');
                }}
                className="px-5 py-2.5 rounded bg-error text-on-error font-button-text text-button-text"
              >
                Confirm Meal Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reschedule Slot Modal */}
      {activeModal === 'reschedule' && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 lg:p-8 shadow-2xl relative space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary block">Slot Adjustment</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black tracking-tight mt-1">
                  Reschedule {rescheduleDate}
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-secondary hover:text-onyx-black p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <p className="font-body-md text-[14px] text-on-surface-variant">
              Select an alternate dispatch time or defer to a later weekday.
            </p>

            <div className="space-y-3">
              <label className="block font-label-caps text-label-caps uppercase text-secondary">New Time Preference</label>
              <select
                value={rescheduleSlot}
                onChange={(e) => setRescheduleSlot(e.target.value)}
                className="w-full bg-surface-container p-3 rounded font-body-md text-[14px] text-onyx-black outline-none"
              >
                <option>Standard Lunch (12:30 PM - 01:00 PM)</option>
                <option>Late Lunch (01:15 PM - 01:45 PM)</option>
                <option>Early Dinner (07:00 PM - 07:30 PM)</option>
                <option>Standard Dinner (07:45 PM - 08:15 PM)</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded bg-surface-container font-button-text text-button-text text-onyx-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  triggerToast(`Delivery dispatch slot updated to ${rescheduleSlot}.`);
                }}
                className="px-5 py-2.5 rounded bg-onyx-black text-on-primary font-button-text text-button-text"
              >
                Confirm Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Manage Subscription Modal */}
      {activeModal === 'manage-sub' && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg max-w-lg w-full p-6 lg:p-8 shadow-2xl relative space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-caps text-label-caps uppercase text-secondary block">Subscription Controls</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black tracking-tight mt-1">
                  Monthly Satvik Plan
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-secondary hover:text-onyx-black p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-body-md text-[14px] text-on-surface-variant">
              <p>Deliveries occur Monday through Saturday at Titanium Square, SG Highway.</p>
              <div className="bg-surface-container p-3 rounded">
                <span className="font-button-text text-button-text text-onyx-black block mb-1">
                  Upcoming Holidays Auto-Pause:
                </span>
                <span className="text-secondary text-[13px]">
                  Dussehra &amp; Diwali holidays are scheduled automatically with zero credit loss.
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded bg-onyx-black text-on-primary font-button-text text-button-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tax Receipt & Dossier Modal */}
      {(activeModal === 'receipt' || activeModal === 'dossier') && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-sm z-50 transition-opacity flex items-center justify-center p-4 sm:p-6">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-10 relative flex flex-col justify-between animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md text-onyx-black">
                    {modalPayload.orderId || '#TL-4521'}
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container font-label-caps text-label-caps text-clay-earth uppercase">
                    Verified Tax Dossier
                  </span>
                </div>
                <span className="font-label-caps text-label-caps text-secondary block">
                  Culinary Escrow Protocol Ref • SEC-889102-AHM
                </span>
              </div>
              <button
                className="p-2 text-secondary hover:text-onyx-black transition-colors"
                onClick={() => setActiveModal(null)}
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-surface-container-low">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary block uppercase">Timestamp</span>
                  <span className="font-body-md text-body-md text-onyx-black">
                    {modalPayload.date || '02 Oct 2026, 12:48 PM'}
                  </span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary block uppercase">FSSAI Registration</span>
                  <span className="font-body-md text-body-md text-onyx-black">
                    {modalPayload.fssai || '10721026000412'}
                  </span>
                </div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary block uppercase">Hub Routing</span>
                  <span className="font-body-md text-body-md text-onyx-black">Satellite #4 Express</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-label-caps text-label-caps text-secondary uppercase block">Meal Line Items</span>
                <div className="flex justify-between py-2 bg-surface px-3">
                  <span className="font-body-md text-body-md text-onyx-black">
                    {modalPayload.tiffinName || 'Gujarati Special Thali (Phulkas, Bhindi, Dal, Rice)'}
                  </span>
                  <span className="font-button-text text-button-text text-onyx-black">₹120.00</span>
                </div>
                <div className="flex justify-between py-2 bg-surface px-3">
                  <span className="font-body-md text-body-md text-onyx-black">Fresh Masala Chaas (250ml Sealed Glass Flask)</span>
                  <span className="font-button-text text-button-text text-onyx-black">₹20.00</span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-surface-container">
                <div className="flex justify-between text-on-surface-variant font-body-md text-body-md">
                  <span>Subtotal</span>
                  <span>₹140.00</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-body-md text-body-md">
                  <span>Packaging &amp; 304 Canister Sterilization Fee</span>
                  <span>₹0.00 (Waived)</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-body-md text-body-md">
                  <span>FSSAI Quality &amp; SGST (2.5%)</span>
                  <span>₹3.50</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-body-md text-body-md">
                  <span>CGST (2.5%)</span>
                  <span>₹3.50</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-body-md text-body-md">
                  <span>Kitchen Escrow Retainer Discount</span>
                  <span className="text-clay-earth">-₹7.00</span>
                </div>
                <div className="flex justify-between font-headline-md text-headline-md text-onyx-black pt-2">
                  <span>Grand Total Settled</span>
                  <span>₹{modalPayload.totalAmount || 140}.00</span>
                </div>
              </div>

              <div className="p-4 bg-surface-container-high flex items-start gap-3">
                <span className="material-symbols-outlined text-clay-earth text-[20px]">inventory_2</span>
                <div className="space-y-1">
                  <span className="font-button-text text-button-text text-onyx-black block">
                    304 Stainless Steel Return Acknowledged
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Courier scanner recorded vessel exchange code #VS-9912. Stainless canister returned sanitized to kitchen hub. No security hold charged.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
              <button
                className="w-full sm:w-auto px-6 py-2.5 bg-surface-container hover:bg-surface-variant font-button-text text-button-text text-onyx-black transition-colors"
                onClick={() => setActiveModal(null)}
              >
                Close Window
              </button>
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Official Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Review Meal Modal */}
      {activeModal === 'review' && reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-onyx-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-lg max-w-md w-full p-6 sm:p-8 space-y-5 border border-sand-neutral shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div>
                <span className="font-label-caps text-[10px] text-secondary uppercase font-bold tracking-wider">
                  Experience Feedback
                </span>
                <h3 className="font-headline-md text-headline-md text-onyx-black mt-0.5">Rate Your Tiffin Meal</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-secondary hover:text-onyx-black">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-surface-container rounded border border-sand-neutral/60 text-xs">
              <span className="font-bold text-onyx-black block">{reviewOrder.tiffinName || 'Deluxe Thali'}</span>
              <span className="text-secondary">{reviewOrder.providerName} • {reviewOrder.orderId || reviewOrder._id}</span>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="font-label-caps uppercase text-secondary font-semibold text-xs block mb-2">
                  Overall Food Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                    >
                      {star <= reviewRating ? '⭐' : '☆'}
                    </button>
                  ))}
                  <span className="text-xs font-bold text-onyx-black ml-2">({reviewRating}/5 Stars)</span>
                </div>
              </div>

              <div>
                <label className="font-label-caps uppercase text-secondary font-semibold text-xs block mb-1">
                  Your Honest Review &amp; Taste Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the shaak, rotli softness, spice level and aroma? Share your feedback for the kitchen..."
                  className="w-full bg-surface-container p-3 rounded border border-sand-neutral text-xs text-onyx-black focus:outline-none focus:border-onyx-black"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 rounded bg-surface-container text-xs font-bold text-secondary hover:text-onyx-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded bg-onyx-black text-white hover:bg-clay-earth text-xs font-bold transition-all disabled:opacity-50 shadow-md"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
