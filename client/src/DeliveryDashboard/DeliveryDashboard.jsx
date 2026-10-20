import React, { useState, useEffect } from 'react';
import DriverSidebar from './DriverSidebar';
import DeliveryRequestsView from './DeliveryRequestsView';
import ActiveDeliveryView from './ActiveDeliveryView';
import UpcomingDeliveriesView from './UpcomingDeliveriesView';
import CompletedDeliveriesView from './CompletedDeliveriesView';
import DeliveryHistoryView from './DeliveryHistoryView';
import LiveMapView from './LiveMapView';
import RouteNavigationView from './RouteNavigationView';
import EarningsOverviewView from './EarningsOverviewView';
import TransactionsView from './TransactionsView';
import IncentivesBonusesView from './IncentivesBonusesView';
import WalletWithdrawalsView from './WalletWithdrawalsView';
import BankPayoutDetailsView from './BankPayoutDetailsView';
import PerformanceView from './PerformanceView';
import RatingsReviewsView from './RatingsReviewsView';
import DutyStatusView from './DutyStatusView';
import WorkingScheduleView from './WorkingScheduleView';
import DeliveryPreferencesView from './DeliveryPreferencesView';
import SafetyEmergencyView from './SafetyEmergencyView';
import SafetyGuidelinesView from './SafetyGuidelinesView';
import ReportIssueView from './ReportIssueView';
import NotificationsView from './NotificationsView';
import HelpSupportView from './HelpSupportView';
import AccountSettingsView from './AccountSettingsView';
import PersonalInformationView from './PersonalInformationView';
import DocumentsKycView from './DocumentsKycView';
import VehicleDetailsView from './VehicleDetailsView';
import NotificationPreferencesView from './NotificationPreferencesView';
import PrivacySecurityView from './PrivacySecurityView';
import AppPreferencesView from './AppPreferencesView';

import GoogleDeliveryMap from '../components/GoogleDeliveryMap';
import {
  playDeliveryRequestSound,
  stopDeliveryRequestSound,
  isSoundEnabled,
  setSoundEnabled
} from '../services/soundNotifier';
import {
  sendDriverLocationUpdate,
  joinDriverRoom,
  subscribeToDeliveryLifecycle,
  subscribeToEarnings,
  getSocket
} from '../services/socket';

const formatOrderRef = (ref) => {
  if (!ref) return '';
  const clean = String(ref).trim().replace(/^#+/, '');
  return `#${clean}`;
};

const getDriverTabFromHash = (rawHash) => {
  const hash = (rawHash || (typeof window !== 'undefined' ? window.location.hash : '') || '').toLowerCase().trim();
  if (hash.includes('/my-deliveries/upcoming')) return 'upcoming';
  if (hash.includes('/my-deliveries/completed')) return 'completed';
  if (hash.includes('/my-deliveries/active') || hash.includes('/my-deliveries')) return 'active-delivery';
  if (hash.includes('/requests')) return 'requests';
  if (hash.includes('/history')) return 'history';
  if (hash.includes('/map')) return 'live-map';
  if (hash.includes('/navigation')) return 'route-navigation';

  if (hash.includes('/earnings/transactions')) return 'transactions';
  if (hash.includes('/earnings/incentives')) return 'incentives-bonuses';
  if (hash.includes('/earnings/wallet')) return 'wallet-withdrawals';
  if (hash.includes('/earnings/payout') || hash.includes('/earnings/bank')) return 'bank-payout';
  if (hash.includes('/earnings')) return 'earnings-overview';

  if (hash.includes('/performance')) return 'performance';
  if (hash.includes('/reviews')) return 'ratings-reviews';
  if (hash.includes('/duty-status')) return 'duty-status';
  if (hash.includes('/schedule')) return 'working-schedule';
  if (hash.includes('/preferences')) return 'delivery-preferences';
  if (hash.includes('/emergency')) return 'safety-emergency';
  if (hash.includes('/guidelines')) return 'safety-guidelines';
  if (hash.includes('/report-issue')) return 'report-issue';
  if (hash.includes('/notifications')) return 'notifications';
  if (hash.includes('/help')) return 'help-support';

  if (hash.includes('/settings/notifications')) return 'notification-preferences';
  if (hash.includes('/settings/security')) return 'privacy-security';
  if (hash.includes('/settings/app')) return 'app-preferences';
  if (hash.includes('/settings')) return 'account-settings';

  if (hash.includes('/profile/personal') || hash.includes('/partner-profile') || hash.includes('/profile-personal')) return 'partner-profile';
  if (hash.includes('/profile/documents') || hash.includes('/documents') || hash.includes('/kyc')) return 'profile-documents';
  if (hash.includes('/profile/vehicle') || hash.includes('/vehicle')) return 'profile-vehicle';
  if (hash.includes('/profile/bank') || hash.includes('/bank-details')) return 'profile-bank';

  return 'dashboard';
};

const getHashFromDriverTab = (tab) => {
  switch (tab) {
    case 'dashboard': return '#/delivery/dashboard';
    case 'requests': return '#/delivery/requests';
    case 'active-delivery': return '#/delivery/my-deliveries/active';
    case 'upcoming': return '#/delivery/my-deliveries/upcoming';
    case 'completed': return '#/delivery/my-deliveries/completed';
    case 'history': return '#/delivery/history';
    case 'live-map': return '#/delivery/map';
    case 'route-navigation': return '#/delivery/navigation';
    case 'earnings-overview': return '#/delivery/earnings';
    case 'transactions': return '#/delivery/earnings/transactions';
    case 'incentives-bonuses': return '#/delivery/earnings/incentives';
    case 'wallet-withdrawals': return '#/delivery/earnings/wallet';
    case 'bank-payout': return '#/delivery/earnings/bank';
    case 'performance': return '#/delivery/performance';
    case 'ratings-reviews': return '#/delivery/reviews';
    case 'duty-status': return '#/delivery/duty-status';
    case 'working-schedule': return '#/delivery/schedule';
    case 'delivery-preferences': return '#/delivery/preferences';
    case 'safety-emergency': return '#/delivery/emergency';
    case 'safety-guidelines': return '#/delivery/guidelines';
    case 'report-issue': return '#/delivery/report-issue';
    case 'notifications': return '#/delivery/notifications';
    case 'help-support': return '#/delivery/help';
    case 'partner-profile':
    case 'profile-personal': return '#/delivery/profile/personal';
    case 'profile-documents': return '#/delivery/profile/documents';
    case 'profile-vehicle': return '#/delivery/profile/vehicle';
    case 'profile-bank': return '#/delivery/profile/bank';
    case 'account-settings': return '#/delivery/settings';
    case 'notification-preferences': return '#/delivery/settings/notifications';
    case 'privacy-security': return '#/delivery/settings/security';
    case 'app-preferences': return '#/delivery/settings/app';
    default: return '#/delivery/dashboard';
  }
};

export default function DeliveryDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTabState] = useState(() => {
    return getDriverTabFromHash(typeof window !== 'undefined' ? window.location.hash : '');
  });

  const setActiveTab = (newTab, updateHash = true) => {
    setActiveTabState(newTab);
    if (updateHash && typeof window !== 'undefined') {
      const targetHash = getHashFromDriverTab(newTab);
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const tabFromHash = getDriverTabFromHash(window.location.hash);
      setActiveTabState(tabFromHash);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [incomingDeliveryAlert, setIncomingDeliveryAlert] = useState(null);
  const [alertSecondsLeft, setAlertSecondsLeft] = useState(45);

  // Live countdown timer for incoming delivery request ringtone and alert
  useEffect(() => {
    if (!incomingDeliveryAlert) return;

    const timer = setInterval(() => {
      setAlertSecondsLeft((prev) => {
        if (prev <= 1) {
          stopDeliveryRequestSound();
          setIncomingDeliveryAlert(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingDeliveryAlert]);

  // GPS Watcher state
  const [gpsStatus, setGpsStatus] = useState({ status: 'INIT', message: '', coords: null });

  // Retrieve saved session user if prop is loading during browser refresh
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  let savedUser = null;
  try {
    if (savedUserStr) savedUser = JSON.parse(savedUserStr);
  } catch (e) {
    console.warn('Error parsing savedUser from localStorage:', e);
  }
  const token = typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '') : '';

  const partnerName = currentUser?.fullName || currentUser?.name || savedUser?.fullName || savedUser?.name || 'Delivery Partner';
  const partnerPhone = currentUser?.phone || savedUser?.phone || '';
  const partnerId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';

  const driverDisplayName = dashboardData?.driverInfo?.name || partnerName;

  // Fetch driver dashboard data from MongoDB
  const fetchDashboardData = async () => {
    try {
      const email = currentUser?.email || savedUser?.email || '';
      const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
      const phone = currentUser?.phone || savedUser?.phone || '';

      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/delivery/driver-dashboard?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}`, {
        headers
      });
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

  // Fetch live unread notification count from MongoDB
  const fetchUnreadNotifCount = async () => {
    try {
      const email = currentUser?.email || savedUser?.email || '';
      const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
      const phone = currentUser?.phone || savedUser?.phone || '';
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;

      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/notifications?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}`, {
        headers
      });
      const json = await res.json();
      if (json.success) {
        if (json.summary && typeof json.summary.unread === 'number') {
          setUnreadNotifCount(json.summary.unread);
        } else if (Array.isArray(json.notifications)) {
          setUnreadNotifCount(json.notifications.filter(n => !n.read).length);
        }
      }
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUnreadNotifCount();
  }, [currentUser]);

  // Subscribe to real-time delivery lifecycle, earnings, & notification events
  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      joinDriverRoom(currentUser.id || currentUser._id);
    }

    const unsubscribeLifecycle = subscribeToDeliveryLifecycle({
      onAssigned: () => fetchDashboardData(),
      onStatusUpdate: () => fetchDashboardData(),
      onPickup: () => fetchDashboardData(),
      onCompleted: () => fetchDashboardData()
    });

    const unsubscribeEarnings = subscribeToEarnings(() => fetchDashboardData());

    const socket = getSocket();

    const handleCountUpdate = (data) => {
      if (data && typeof data.unreadCount === 'number') {
        setUnreadNotifCount(data.unreadCount);
      } else {
        fetchUnreadNotifCount();
      }
    };

    const handleNewNotif = (data) => {
      if (data && typeof data.unreadCount === 'number') {
        setUnreadNotifCount(data.unreadCount);
      } else {
        fetchUnreadNotifCount();
      }
    };

    const handleRatingUpdate = () => {
      fetchDashboardData();
    };

    const handleNewDeliveryRequest = (data) => {
      const reqObj = data?.request || data;
      if (!reqObj) return;

      const seconds = Math.max(10, Number(reqObj.secondsLeft || reqObj.timeoutSeconds || 45));
      setAlertSecondsLeft(seconds);
      setIncomingDeliveryAlert(reqObj);
      playDeliveryRequestSound(seconds);
      fetchDashboardData();
      window.dispatchEvent(new CustomEvent('tiffinlink:new-delivery-request', { detail: reqObj }));
    };

    const handleDeliveryTakenOrExpired = () => {
      stopDeliveryRequestSound();
      setIncomingDeliveryAlert(null);
      fetchDashboardData();
    };

    if (socket) {
      socket.on('notification:count:update', handleCountUpdate);
      socket.on('notification:new', handleNewNotif);
      socket.on('driver:rating:updated', handleRatingUpdate);
      socket.on('delivery:dashboard:refresh', handleRatingUpdate);
      socket.on('review:new', handleRatingUpdate);
      socket.on('delivery:request:new', handleNewDeliveryRequest);
      socket.on('delivery:driver:live_request', handleNewDeliveryRequest);
      socket.on('delivery:new_request', handleNewDeliveryRequest);
      socket.on('delivery:new-request', handleNewDeliveryRequest);
      socket.on('delivery:request:accepted', handleDeliveryTakenOrExpired);
      socket.on('delivery:request:unavailable', handleDeliveryTakenOrExpired);
      socket.on('delivery:request:expired', handleDeliveryTakenOrExpired);
      socket.on('delivery:request:cancelled', handleDeliveryTakenOrExpired);
    }

    return () => {
      unsubscribeLifecycle();
      unsubscribeEarnings();
      stopDeliveryRequestSound();
      if (socket) {
        socket.off('notification:count:update', handleCountUpdate);
        socket.off('notification:new', handleNewNotif);
        socket.off('driver:rating:updated', handleRatingUpdate);
        socket.off('delivery:dashboard:refresh', handleRatingUpdate);
        socket.off('review:new', handleRatingUpdate);
        socket.off('delivery:request:new', handleNewDeliveryRequest);
        socket.off('delivery:driver:live_request', handleNewDeliveryRequest);
        socket.off('delivery:new_request', handleNewDeliveryRequest);
        socket.off('delivery:new-request', handleNewDeliveryRequest);
        socket.off('delivery:request:accepted', handleDeliveryTakenOrExpired);
        socket.off('delivery:request:unavailable', handleDeliveryTakenOrExpired);
        socket.off('delivery:request:expired', handleDeliveryTakenOrExpired);
        socket.off('delivery:request:cancelled', handleDeliveryTakenOrExpired);
      }
    };
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
    if (!order) return;
    stopDeliveryRequestSound();
    setIncomingDeliveryAlert(null);

    // If order was already accepted via subview, avoid redundant second accept
    if (order.status === 'Driver Assigned' || order.status === 'Picked Up') {
      showToast(`✓ Order ${order.orderId || order.requestId} is now active in your dispatch!`);
      await fetchDashboardData();
      setActiveTab('dashboard');
      return;
    }

    const rawId = order.requestId || order.orderId || order._id || order.id;
    try {
      if (rawId) {
        const encodedId = encodeURIComponent(rawId);
        const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
        const headers = { 'Content-Type': 'application/json' };
        if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

        // 1. Try atomic delivery request acceptance endpoint first
        let res = await fetch(`http://localhost:5000/api/delivery/requests/${encodedId}/accept`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            driverId: partnerId || currentUser?.id || currentUser?._id,
            driverName: driverDisplayName || partnerName,
            driverPhone: partnerPhone
          })
        });
        let json = await res.json();

        // 2. If delivery request not found, try order accept endpoint
        if (!res.ok && res.status === 404) {
          res = await fetch(`http://localhost:5000/api/orders/${encodedId}/accept-delivery`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ partnerName: driverDisplayName || partnerName, partnerPhone })
          });
          json = await res.json();
        }

        if (!res.ok || !json.success) {
          showToast(`⚠️ ${json.message || 'Delivery is no longer available!'}`);
          await fetchDashboardData();
          return;
        }
      }

      showToast(`✓ Accepted delivery for Order ${order.orderId || order.requestId || rawId}!`);
      await fetchDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Error accepting delivery:', err);
      showToast(`⚠️ ${err.message || 'Unable to accept delivery. Please try again.'}`);
      fetchDashboardData();
    }
  };

  // Dynamic values derived from MongoDB
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
      <header className="lg:hidden h-16 bg-surface-container-lowest dark:bg-[#151518] border-b border-sand-neutral dark:border-stone-800 px-4 flex items-center justify-between sticky top-0 z-30">
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
            onClick={() => {
              const nextVal = !soundActive;
              setSoundActive(nextVal);
              setSoundEnabled(nextVal);
              if (nextVal) playDeliveryRequestSound(2);
            }}
            title={soundActive ? 'Alert Sound: Active' : 'Alert Sound: Muted'}
            className={`p-1.5 rounded transition-colors ${soundActive ? 'text-onyx-black' : 'text-neutral-400'}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {soundActive ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleOnlineStatus}
            className={`px-2.5 py-1 text-[11px] font-label-caps uppercase font-bold flex items-center gap-1.5 ${isOnline ? 'bg-emerald-100 text-emerald-900' : 'bg-surface-container-high text-secondary'
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
          notifications: unreadNotifCount
        }}
      />

      {/* Main Content Area */}
      <div className="lg:pl-80 min-h-screen bg-surface dark:bg-[#0E0E10]">
        <main className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-12">
          {activeTab === 'active-delivery' || activeTab === 'active' ? (
            <ActiveDeliveryView
              activeDelivery={activeDelivery}
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onStatusUpdate={fetchDashboardData}
            />
          ) : activeTab === 'delivery-requests' || activeTab === 'requests' || activeTab === 'new-deliveries' ? (
            <DeliveryRequestsView
              activeDelivery={activeDelivery}
              onAcceptDelivery={handleAcceptDelivery}
              onNavigateTab={setActiveTab}
              currentUser={currentUser}
              isOnline={isOnline}
            />
          ) : activeTab === 'upcoming-deliveries' || activeTab === 'upcoming' ? (
            <UpcomingDeliveriesView
              activeDelivery={activeDelivery}
              currentUser={currentUser}
              isOnline={isOnline}
              onNavigateTab={setActiveTab}
              onStatusUpdate={fetchDashboardData}
            />
          ) : activeTab === 'completed-deliveries' || activeTab === 'completed' ? (
            <CompletedDeliveriesView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'delivery-history' || activeTab === 'history' ? (
            <DeliveryHistoryView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'live-map' || activeTab === 'map' ? (
            <LiveMapView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'route-navigation' || activeTab === 'route' || activeTab === 'navigation' ? (
            <RouteNavigationView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'earnings-overview' || activeTab === 'earnings' ? (
            <EarningsOverviewView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'transactions' ? (
            <TransactionsView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'incentives-bonuses' || activeTab === 'incentives' || activeTab === 'incentives-and-bonuses' ? (
            <IncentivesBonusesView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'wallet-withdrawals' || activeTab === 'wallet' || activeTab === 'wallet-and-withdrawals' ? (
            <WalletWithdrawalsView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'bank-payout-details' || activeTab === 'bank-payout' || activeTab === 'bank-payout-details-page' || activeTab === 'bank' || activeTab === 'profile-bank' ? (
            <BankPayoutDetailsView
              currentUser={currentUser}
              onNavigate={setActiveTab}
            />
          ) : activeTab === 'partner-profile' || activeTab === 'profile-personal' ? (
            <PersonalInformationView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'profile-documents' || activeTab === 'documents' || activeTab === 'kyc' ? (
            <DocumentsKycView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'profile-vehicle' || activeTab === 'vehicle' ? (
            <VehicleDetailsView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'performance' ? (
            <PerformanceView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'ratings-reviews' || activeTab === 'reviews' || activeTab === 'ratings' ? (
            <RatingsReviewsView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'duty-status' || activeTab === 'go-online-offline' ? (
            <DutyStatusView
              currentUser={currentUser}
              isOnline={isOnline}
              setIsOnline={setIsOnline}
              activeDelivery={activeDelivery}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'availability-schedule' || activeTab === 'working-schedule' || activeTab === 'schedule' ? (
            <WorkingScheduleView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'delivery-preferences' || activeTab === 'preferences' || activeTab === 'availability' ? (
            <DeliveryPreferencesView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'safety-emergency' || activeTab === 'emergency' || activeTab === 'sos' || activeTab === 'safety-sos' ? (
            <SafetyEmergencyView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'safety-guidelines' || activeTab === 'guidelines' ? (
            <SafetyGuidelinesView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'safety-report' || activeTab === 'safety-report-issue' || activeTab === 'report-issue' || activeTab === 'report' || activeTab === 'report-an-issue' ? (
            <ReportIssueView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'notifications' || activeTab === 'notification' ? (
            <NotificationsView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'help-support' || activeTab === 'help' || activeTab === 'support' ? (
            <HelpSupportView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'settings-account' || activeTab === 'settings' || activeTab === 'account' || activeTab === 'profile' ? (
            <AccountSettingsView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'settings-notifications' || activeTab === 'notification-preferences' || activeTab === 'notifications-preferences' ? (
            <NotificationPreferencesView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'settings-privacy' || activeTab === 'privacy-security' || activeTab === 'privacy' || activeTab === 'security' ? (
            <PrivacySecurityView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : activeTab === 'settings-app' || activeTab === 'app-preferences' || activeTab === 'preferences' ? (
            <AppPreferencesView
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onShowToast={showToast}
            />
          ) : (


            <div className="flex flex-col w-full space-y-8">

              {/* 1. DASHBOARD HEADER PANEL */}
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-7 bg-surface-container-lowest dark:bg-[#16161A] border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-secondary dark:text-[#DFB76C] tracking-widest block mb-1 text-[11px] font-semibold">
                    SHIFT OVERVIEW
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-tight font-serif text-3xl sm:text-4xl">
                    Partner Dashboard
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-xl text-sm sm:text-base">
                    Welcome back, <strong className="text-onyx-black font-semibold">{driverDisplayName}</strong> 👋
                  </p>
                  <p className="font-body-md text-xs text-secondary mt-0.5">
                    Your shift performance and live delivery operations at a glance.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-surface-container-low dark:bg-[#1A1A1E] p-2.5 self-start md:self-auto flex-wrap border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={handleToggleOnlineStatus}
                    className={`flex items-center gap-2.5 px-4 py-2.5 transition-colors cursor-pointer font-button-text text-xs font-semibold rounded-lg ${isOnline
                        ? 'bg-emerald-950 text-emerald-100 border border-emerald-700 dark:border-emerald-600/70'
                        : 'bg-surface-container-high dark:bg-[#24242A] text-onyx-black dark:text-[#FAF8F5] border border-sand-neutral dark:border-[#3F3F4A]'
                      }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-secondary'}`} />
                    <span className="tracking-wider uppercase">
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !soundActive;
                      setSoundActive(nextVal);
                      setSoundEnabled(nextVal);
                      if (nextVal) playDeliveryRequestSound(2);
                    }}
                    title={soundActive ? 'Request Audio Alerts: Active (Click to mute)' : 'Request Audio Alerts: Muted (Click to enable)'}
                    className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors cursor-pointer text-xs font-semibold border rounded-lg ${soundActive ? 'bg-surface-container-lowest dark:bg-[#151518] text-onyx-black dark:text-[#FAF8F5] border-sand-neutral dark:border-[#3F3F4A]' : 'bg-surface-container dark:bg-[#202025] text-neutral-400 border-sand-neutral/40'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {soundActive ? 'volume_up' : 'volume_off'}
                    </span>
                    <span className="hidden sm:inline font-label-caps text-[10px] uppercase font-bold tracking-wider">
                      {soundActive ? 'Sound On' : 'Muted'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('live-map')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest dark:bg-[#151518] text-onyx-black dark:text-[#FAF8F5] hover:bg-surface-container dark:hover:bg-[#24242A] transition-colors cursor-pointer text-xs font-semibold border border-sand-neutral dark:border-[#3F3F4A] rounded-lg shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span>Live Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('safety-emergency')}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-error text-on-error hover:bg-red-800 transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider rounded-lg border border-red-700 dark:border-red-600 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">emergency</span>
                    <span>SOS</span>
                  </button>
                </div>
              </header>

              {/* 2. FOUR SUMMARY CARDS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Card 1: Today's Earnings */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('earnings-overview')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('earnings-overview'); }}
                  className="bg-surface-container-lowest dark:bg-[#16161A] p-6 flex flex-col justify-between h-40 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm hover:border-onyx-black dark:hover:border-[#DFB76C] hover:shadow-md cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-onyx-black dark:focus:ring-[#DFB76C]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px] group-hover:text-onyx-black dark:group-hover:text-[#DFB76C] transition-colors">
                      TODAY'S EARNINGS
                    </span>
                    <span className="material-symbols-outlined text-secondary group-hover:text-onyx-black dark:group-hover:text-[#DFB76C] group-hover:scale-110 transition-all text-[20px]">
                      account_balance_wallet
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-1.5 font-serif text-3xl">
                      ₹{todayEarnings.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-xs text-secondary">Today</span>
                      <span className="font-button-text text-[11px] text-clay-earth group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Details</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Completed Deliveries */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('completed-deliveries')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('completed-deliveries'); }}
                  className="bg-surface-container-lowest dark:bg-[#16161A] p-6 flex flex-col justify-between h-40 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm hover:border-onyx-black dark:hover:border-[#DFB76C] hover:shadow-md cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-onyx-black dark:focus:ring-[#DFB76C]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px] group-hover:text-onyx-black dark:group-hover:text-[#DFB76C] transition-colors">
                      COMPLETED DELIVERIES
                    </span>
                    <span className="material-symbols-outlined text-secondary group-hover:text-onyx-black dark:group-hover:text-[#DFB76C] group-hover:scale-110 transition-all text-[20px]">
                      local_shipping
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-1.5 font-serif text-3xl">
                      {completedCount}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-xs text-secondary">Completed Today</span>
                      <span className="font-button-text text-[11px] text-clay-earth group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>History</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Active Delivery */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (activeDelivery) {
                      setActiveTab('active-delivery');
                    } else {
                      setActiveTab('delivery-requests');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (activeDelivery) setActiveTab('active-delivery');
                      else setActiveTab('delivery-requests');
                    }
                  }}
                  className="bg-surface-container-lowest dark:bg-[#16161A] p-6 flex flex-col justify-between h-40 border-2 border-[#DFB76C] dark:border-[#E5C158] rounded-2xl shadow-sm hover:shadow-lg cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-[#DFB76C]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-[#DFB76C] tracking-wider text-[11px] font-bold">
                      ACTIVE DELIVERY
                    </span>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeDelivery ? 'bg-emerald-400' : 'bg-stone-500'} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeDelivery ? 'bg-emerald-400' : 'bg-stone-500'}`} />
                    </span>
                  </div>
                  <div>
                    <div className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none mb-1.5 font-serif text-2xl flex items-center justify-between">
                      <span>{activeDelivery ? '1 Active' : 'No Active Delivery'}</span>
                      <span className="material-symbols-outlined text-[18px] text-[#DFB76C] group-hover:translate-x-1 transition-transform">
                        {activeDelivery ? 'open_in_new' : 'search'}
                      </span>
                    </div>
                    <p className="font-body-md text-xs text-secondary truncate">
                      {activeDelivery ? `${formatOrderRef(activeDelivery.orderId || activeDelivery.requestId)} • Track trip` : 'Click to find delivery requests →'}
                    </p>
                  </div>
                </div>

                {/* Card 4: Customer Rating */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('ratings-reviews')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab('ratings-reviews'); }}
                  className="bg-surface-container-lowest dark:bg-[#16161A] p-6 flex flex-col justify-between h-40 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm hover:border-onyx-black dark:hover:border-[#DFB76C] hover:shadow-md cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-onyx-black dark:focus:ring-[#DFB76C]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider text-[11px] group-hover:text-onyx-black dark:group-hover:text-[#DFB76C] transition-colors">
                      CUSTOMER RATING
                    </span>
                    <span className="material-symbols-outlined text-secondary group-hover:text-onyx-black dark:group-hover:text-[#DFB76C] group-hover:scale-110 transition-all text-[20px]">
                      grade
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="font-headline-md text-headline-md text-onyx-black tracking-tight leading-none font-serif text-3xl">
                        {rating ? `${rating}` : '—'}
                      </span>
                      {rating ? (
                        <span className="font-headline-md text-headline-md text-amber-500 leading-none text-2xl">★</span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-md text-xs text-secondary">
                        {ratedCount > 0 ? `${ratedCount} verified rating${ratedCount > 1 ? 's' : ''}` : 'New Partner • No ratings'}
                      </span>
                      <span className="font-button-text text-[11px] text-clay-earth group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Reviews</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>

              </section>

              {/* 3. ACTIVE DELIVERY (MAIN OPERATIONAL CARD) */}
              <section className="bg-surface-container-lowest dark:bg-[#16161A] p-6 lg:p-8 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm">
                {activeDelivery ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sand-neutral dark:border-[#3F3F4A]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-caps text-xs text-secondary uppercase tracking-widest">ACTIVE TRIP</span>
                          <span className="font-button-text font-bold text-onyx-black text-lg">{formatOrderRef(activeDelivery.orderId || activeDelivery.requestId || activeDelivery._id)}</span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-lg font-label-caps text-[11px] font-bold uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span>● {activeDelivery.status || 'DRIVER ASSIGNED'}</span>
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="font-headline-md text-2xl text-onyx-black font-serif block">
                          ₹{activeDelivery.driverEarning || activeDelivery.payout || activeDelivery.amount || 'Pending'}
                        </span>
                        <span className="font-label-caps text-[11px] text-secondary uppercase">Guaranteed Payout</span>
                      </div>
                    </div>

                    {/* Real Payment Breakdown Box */}
                    <div className="p-3.5 bg-stone-50 dark:bg-[#1A1A1E] border border-stone-200 dark:border-[#3F3F4A] rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px] block font-bold">Tiffin Order Total</span>
                        <span className="font-bold text-onyx-black text-sm">₹{activeDelivery.tiffinPayment || activeDelivery.amount || 'N/A'}</span>
                      </div>
                      <div className="h-6 w-px bg-stone-300 dark:bg-[#3F3F4A] hidden sm:block" />
                      <div>
                        <span className="text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[10px] block font-bold">Driver Delivery Earning</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">₹{activeDelivery.driverEarning || activeDelivery.payout || 'Pending'}</span>
                      </div>
                      <div className="h-6 w-px bg-stone-300 dark:bg-[#3F3F4A] hidden sm:block" />
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px] block font-bold">Items</span>
                        <span className="font-semibold text-onyx-black text-xs">{activeDelivery.tiffinName || `${activeDelivery.itemCount || 1} Tiffin Box`}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                      {/* Pickup Kitchen */}
                      <div className="p-4 bg-surface-container-low dark:bg-[#1A1A1E] border border-sand-neutral dark:border-[#3F3F4A] rounded-xl">
                        <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-1">Provider Kitchen</span>
                        <h4 className="font-headline-md text-lg text-onyx-black font-serif">
                          {activeDelivery.providerName || (typeof activeDelivery.pickupAddress === 'string' ? activeDelivery.pickupAddress : activeDelivery.pickupAddress?.street) || 'Provider Kitchen'}
                        </h4>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">
                          {typeof activeDelivery.pickupAddress === 'string' ? activeDelivery.pickupAddress : (activeDelivery.pickupAddress?.street || activeDelivery.pickupAddress?.city || 'Pickup address recorded')}
                        </p>
                      </div>

                      {/* Customer Destination */}
                      <div className="p-4 bg-surface-container-low dark:bg-[#1A1A1E] border border-sand-neutral dark:border-[#3F3F4A] rounded-xl">
                        <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block mb-1">Customer Destination</span>
                        <h4 className="font-headline-md text-lg text-onyx-black font-serif">
                          {activeDelivery.customerName || 'Customer'}
                        </h4>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">
                          {typeof activeDelivery.deliveryAddress === 'string' ? activeDelivery.deliveryAddress : (activeDelivery.deliveryAddress?.street || activeDelivery.customerAddress || 'Delivery address recorded')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-sand-neutral dark:border-[#3F3F4A] text-xs font-body-md">
                      <div className="flex items-center gap-4 text-secondary">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-onyx-black">navigation</span>
                          {activeDelivery.distanceKm ? `${activeDelivery.distanceKm} km` : 'Distance pending'}
                        </span>
                        <span>/</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-onyx-black">schedule</span>
                          {activeDelivery.etaMinutes ? `Est. ${activeDelivery.etaMinutes} mins` : 'ETA pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenGoogleMapsNavigation(
                            typeof activeDelivery.deliveryAddress === 'string'
                              ? activeDelivery.deliveryAddress
                              : (activeDelivery.deliveryAddress?.street || activeDelivery.customerAddress || 'Ahmedabad')
                          )}
                          className="px-4 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-onyx-black dark:text-[#FAF8F5] border border-transparent dark:border-[#3F3F4A] rounded-lg font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">near_me</span>
                          <span>GPS Nav</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('live-map')}
                          className="w-full sm:w-auto px-6 py-2.5 bg-onyx-black text-on-primary dark:bg-[#E5C158] dark:text-[#111113] hover:bg-stone-800 dark:hover:bg-[#DFB76C] rounded-lg font-button-text text-xs uppercase tracking-wider font-bold transition-colors"
                        >
                          View Live Map
                        </button>
                      </div>
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
                      className="mt-3 px-6 py-2.5 bg-onyx-black text-on-primary dark:bg-[#E5C158] dark:text-[#111113] dark:hover:bg-[#DFB76C] font-button-text text-xs font-bold uppercase tracking-wider transition-all inline-block rounded-lg shadow-sm hover:shadow-md cursor-pointer"
                    >
                      View Delivery Requests
                    </button>
                  </div>
                )}
              </section>

              {/* 4. PERFORMANCE & EARNINGS BREAKDOWN ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* 4A. TODAY'S PERFORMANCE (6 COLS) */}
                <section className="lg:col-span-6 bg-surface-container-lowest dark:bg-[#16161A] p-6 lg:p-8 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral dark:border-[#3F3F4A]">
                    <h3 className="font-headline-md text-xl text-onyx-black font-serif">TODAY'S PERFORMANCE</h3>
                    <span className="font-label-caps text-[11px] text-secondary uppercase">Real-Time Index</span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs font-body-md mb-1.5">
                        <span className="text-secondary font-medium uppercase tracking-wider text-[11px]">Acceptance Rate</span>
                        <span className="font-bold text-onyx-black">{performance.acceptanceRate != null ? `${performance.acceptanceRate}%` : 'Not enough data'}</span>
                      </div>
                      <div className="w-full bg-sand-neutral/40 dark:bg-stone-800 h-2 rounded-full overflow-hidden border border-transparent dark:border-[#3F3F4A]">
                        <div className="bg-onyx-black dark:bg-[#E5C158] h-full transition-all duration-500" style={{ width: `${performance.acceptanceRate || 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-body-md mb-1.5">
                        <span className="text-secondary font-medium uppercase tracking-wider text-[11px]">Completion Rate</span>
                        <span className="font-bold text-onyx-black">{performance.completionRate != null ? `${performance.completionRate}%` : 'Not enough data'}</span>
                      </div>
                      <div className="w-full bg-sand-neutral/40 dark:bg-stone-800 h-2 rounded-full overflow-hidden border border-transparent dark:border-[#3F3F4A]">
                        <div className="bg-onyx-black dark:bg-[#E5C158] h-full transition-all duration-500" style={{ width: `${performance.completionRate || 0}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-body-md mb-1.5">
                        <span className="text-secondary font-medium uppercase tracking-wider text-[11px]">On-Time Delivery</span>
                        <span className="font-bold text-onyx-black">{performance.onTimeRate != null ? `${performance.onTimeRate}%` : 'Not enough data'}</span>
                      </div>
                      <div className="w-full bg-sand-neutral/40 dark:bg-stone-800 h-2 rounded-full overflow-hidden border border-transparent dark:border-[#3F3F4A]">
                        <div className="bg-onyx-black dark:bg-[#E5C158] h-full transition-all duration-500" style={{ width: `${performance.onTimeRate || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4B. TODAY'S EARNINGS BREAKDOWN (6 COLS) */}
                <section className="lg:col-span-6 bg-surface-container-lowest dark:bg-[#16161A] p-6 lg:p-8 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral dark:border-[#3F3F4A]">
                    <h3 className="font-headline-md text-xl text-onyx-black font-serif">TODAY'S EARNINGS</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('earnings-overview')}
                      className="font-label-caps text-[11px] text-onyx-black dark:text-[#DFB76C] underline uppercase hover:opacity-75 font-semibold"
                    >
                      View Earnings
                    </button>
                  </div>

                  <div className="space-y-3 font-body-md text-sm">
                    <div className="flex justify-between py-1 border-b border-sand-neutral/30 dark:border-[#3F3F4A]">
                      <span className="text-secondary">Base Earnings</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.baseEarnings}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-sand-neutral/30 dark:border-[#3F3F4A]">
                      <span className="text-secondary">Distance Earnings</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.distanceEarnings}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-sand-neutral/30 dark:border-[#3F3F4A]">
                      <span className="text-secondary">Incentives</span>
                      <span className="font-medium text-onyx-black">₹{earningsBreakdown.incentives}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-sand-neutral/30 dark:border-[#3F3F4A]">
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
              <section className="bg-surface-container-lowest dark:bg-[#16161A] p-6 lg:p-8 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral dark:border-[#3F3F4A]">
                  <h3 className="font-headline-md text-xl text-onyx-black font-serif">RECENT DELIVERY ACTIVITY</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('delivery-history')}
                    className="font-button-text text-xs text-onyx-black dark:text-[#DFB76C] underline uppercase font-semibold hover:opacity-75"
                  >
                    View Delivery History
                  </button>
                </div>

                {recentDeliveries.length > 0 ? (
                  <div className="divide-y divide-sand-neutral/40 dark:divide-[#3F3F4A]">
                    {recentDeliveries.map((item, idx) => (
                      <div key={item._id || item.requestId || idx} className="py-3.5 flex items-center justify-between gap-4 text-sm font-body-md hover:bg-surface-container-low dark:hover:bg-[#1E1E24] transition-colors px-2 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-onyx-black">{formatOrderRef(item.orderId || item.requestId)}</span>
                            <span className={`px-2 py-0.5 font-label-caps text-[10px] uppercase font-bold rounded-md ${item.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60' : 'bg-sand-neutral dark:bg-stone-800 text-onyx-black dark:text-stone-300 border border-transparent dark:border-[#3F3F4A]'}`}>
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
              <section className="bg-surface-container-lowest dark:bg-[#16161A] p-6 lg:p-8 border border-[#D5D0C5] dark:border-[#3F3F4A] rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral dark:border-[#3F3F4A]">
                  <h3 className="font-headline-md text-xl text-onyx-black font-serif">NEW DELIVERY REQUESTS</h3>
                </div>

                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((req, idx) => (
                      <div key={req._id || req.requestId || idx} className="p-4 bg-surface-container-low dark:bg-[#1A1A1E] border border-sand-neutral dark:border-[#3F3F4A] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-onyx-black">lunch_dining</span>
                            <span className="font-bold text-onyx-black text-sm">{req.providerName || 'Tiffin Provider'} → {req.customerName || 'Customer'}</span>
                          </div>
                          <div className="mt-2 text-xs text-secondary flex items-center gap-3 flex-wrap">
                            <span>Pickup: {req.pickupAddress?.street || 'Kitchen'}</span>
                            <span>•</span>
                            <span>Distance: {req.distanceKm || 2.4} km</span>
                            <span>•</span>
                            <span>Delivery Fee: <strong className="text-emerald-800 dark:text-emerald-400 font-bold">₹{req.driverEarning || req.deliveryFee || 25}</strong></span>
                            <span>•</span>
                            <span>Order Value: <span className="text-onyx-black font-semibold">₹{req.amount || 175}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => showToast('Request declined')}
                            className="px-4 py-2 border border-sand-neutral dark:border-[#3F3F4A] hover:bg-surface-container dark:hover:bg-[#24242A] text-secondary dark:text-stone-300 text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcceptDelivery(req)}
                            className="px-6 py-2 bg-onyx-black dark:bg-[#E5C158] text-on-primary dark:text-[#111113] hover:bg-stone-800 dark:hover:bg-[#DFB76C] text-xs uppercase tracking-wider font-bold rounded-lg shadow-sm transition-colors"
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
      {/* Live Incoming Delivery Request Notification Modal */}
      {incomingDeliveryAlert && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 duration-300 max-w-md w-full bg-onyx-black text-white p-5 rounded-2xl shadow-2xl border-2 border-clay-earth flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="font-button-text font-bold text-sm tracking-wide text-sand-neutral uppercase flex items-center gap-1.5">
                <span>🔔 New Delivery Request!</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded font-bold border border-red-500/40 animate-pulse">
                ⏳ {alertSecondsLeft}s
              </span>
              <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                Earn ₹{incomingDeliveryAlert.driverEarning || incomingDeliveryAlert.deliveryFee || 50}
              </span>
            </div>
          </div>

          <div className="text-xs text-bone-white/80 space-y-1">
            <div className="font-semibold text-white text-sm">
              {incomingDeliveryAlert.tiffinName || 'Fresh Homestyle Meal'} • {incomingDeliveryAlert.itemCount || 1} item(s)
            </div>
            <div className="flex items-center gap-1.5 text-sand-neutral/90">
              <span className="material-symbols-outlined text-[15px] text-clay-earth">storefront</span>
              <span className="truncate">Pickup: {incomingDeliveryAlert.pickupAddress?.area || incomingDeliveryAlert.pickupAddress?.street || 'Nearby Kitchen'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sand-neutral/90">
              <span className="material-symbols-outlined text-[15px] text-emerald-400">location_on</span>
              <span className="truncate">Drop: {incomingDeliveryAlert.deliveryAddress?.area || incomingDeliveryAlert.deliveryAddress?.street || 'Customer Location'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                stopDeliveryRequestSound();
                setIncomingDeliveryAlert(null);
                handleAcceptDelivery(incomingDeliveryAlert);
              }}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-button-text font-bold uppercase tracking-wider transition-colors shadow-md text-center cursor-pointer"
            >
              Accept Delivery
            </button>
            <button
              onClick={() => {
                setIncomingDeliveryAlert(null);
                setActiveTab('requests');
              }}
              className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-onyx-black rounded-lg text-xs font-button-text font-semibold transition-colors cursor-pointer"
            >
              View
            </button>
            <button
              onClick={() => {
                stopDeliveryRequestSound();
                setIncomingDeliveryAlert(null);
                showToast('Delivery request declined');
              }}
              className="px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-sand-neutral rounded-lg text-xs font-button-text transition-colors cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
