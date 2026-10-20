import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Users,
  Wallet,
  Star,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  X,
  PlusCircle,
  List,
  CalendarCheck,
  ListOrdered,
  Inbox,
  BadgeCheck,
  CheckCircle,
  CircleX,
  WalletCards,
  CircleHelp,
  UserCircle,
  Tag,
  ChefHat,
  Zap,
  Repeat,
  Store,
  MapPin,
  Calendar,
  Truck
} from 'lucide-react';

import ProviderSidebar from './ProviderSidebar';
import { playKitchenOrderSound, playKitchenAlertLoop, stopKitchenAlertSound, isSoundEnabled, setSoundEnabled } from '../services/soundNotifier';
import DashboardOverviewTab from './DashboardOverviewTab';
import LiveRequestsTab from './LiveRequestsTab';
import MyTiffinsTab from './MyTiffinsTab';
import OrdersTab from './OrdersTab';
import CustomersTab from './CustomersTab';
import SubscriptionsTab from './SubscriptionsTab';
import EarningsTab from './EarningsTab';
import ReviewsTab from './ReviewsTab';
import AnalyticsTab from './AnalyticsTab';
import CapacityTab from './CapacityTab';
import ServiceAreaTab from './ServiceAreaTab';
import ScheduleTab from './ScheduleTab';
import NotificationsTab from './NotificationsTab';
import SettingsTab from './SettingsTab';
import DeliveryManagementTab from './DeliveryManagementTab';
import HelpSupportTab from './HelpSupportTab';
import PerformanceTab from './PerformanceTab';
import { useTranslation } from '../services/i18n';
import { apiRequest } from '../services/api';
import { getSocket } from '../services/socket';

const getProviderTabFromHash = (rawHash) => {
  const hash = (rawHash || (typeof window !== 'undefined' ? window.location.hash : '') || '').toLowerCase().trim();
  if (hash.includes('/orders/new')) return 'orders-new';
  if (hash.includes('/orders/preparing')) return 'orders-preparing';
  if (hash.includes('/orders/ready')) return 'orders-ready';
  if (hash.includes('/orders/delivery')) return 'orders-delivery';
  if (hash.includes('/orders/completed')) return 'orders-completed';
  if (hash.includes('/orders/cancelled')) return 'orders-cancelled';
  if (hash.includes('/orders')) return 'orders-all';

  if (hash.includes('/tiffins/add')) return 'add-tiffin';
  if (hash.includes('/tiffins/availability')) return 'availability';
  if (hash.includes('/tiffins/categories')) return 'categories';
  if (hash.includes('/tiffins/items') || hash.includes('/tiffin-items')) return 'tiffin-items';
  if (hash.includes('/tiffins/meal-builder')) return 'meal-builder';
  if (hash.includes('/tiffins')) return 'tiffins';

  if (hash.includes('/delivery-management')) return 'delivery-management';
  if (hash.includes('/customers')) return 'customers';
  if (hash.includes('/subscriptions')) return 'subscriptions';

  if (hash.includes('/earnings/transactions')) return 'transactions';
  if (hash.includes('/earnings/incentives')) return 'incentives';
  if (hash.includes('/earnings/wallet')) return 'wallet';
  if (hash.includes('/earnings/bank') || hash.includes('/earnings/payout')) return 'bank-payout';
  if (hash.includes('/earnings')) return 'earnings';

  if (hash.includes('/reviews')) return 'reviews';
  if (hash.includes('/analytics')) return 'analytics';
  if (hash.includes('/capacity')) return 'capacity';
  if (hash.includes('/service-area')) return 'service-area';
  if (hash.includes('/schedule')) return 'schedule';
  if (hash.includes('/performance')) return 'performance';
  if (hash.includes('/notifications')) return 'notifications';
  if (hash.includes('/settings')) return 'settings';
  if (hash.includes('/requests') || hash.includes('/live-requests')) return 'live-requests';
  if (hash.includes('/help')) return 'help';

  // Honor user's saved default landing view when visiting generic provider root
  if (typeof window !== 'undefined' && (!hash || hash === '#provider' || hash === '#/provider' || hash === '#/provider/dashboard')) {
    try {
      const savedLanding = localStorage.getItem('tiffinlink_landing');
      if (savedLanding === 'live-requests') return 'live-requests';
      if (savedLanding === 'orders-prep' || savedLanding === 'orders-preparing') return 'orders-preparing';
      if (savedLanding === 'dashboard') return 'dashboard';
    } catch (e) {}
  }

  return 'dashboard';
};

const getHashFromProviderTab = (tab) => {
  switch (tab) {
    case 'dashboard': return '#/provider/dashboard';
    case 'requests':
    case 'live-requests': return '#/provider/requests';
    case 'tiffins': return '#/provider/tiffins';
    case 'add-tiffin': return '#/provider/tiffins/add';
    case 'availability': return '#/provider/tiffins/availability';
    case 'categories': return '#/provider/tiffins/categories';
    case 'tiffin-items': return '#/provider/tiffins/items';
    case 'meal-builder': return '#/provider/tiffins/meal-builder';
    case 'orders':
    case 'orders-all': return '#/provider/orders';
    case 'orders-new': return '#/provider/orders/new';
    case 'orders-preparing': return '#/provider/orders/preparing';
    case 'orders-ready': return '#/provider/orders/ready';
    case 'orders-delivery': return '#/provider/orders/delivery';
    case 'orders-completed': return '#/provider/orders/completed';
    case 'orders-cancelled': return '#/provider/orders/cancelled';
    case 'delivery-management': return '#/provider/delivery-management';
    case 'customers': return '#/provider/customers';
    case 'subscriptions': return '#/provider/subscriptions';
    case 'earnings': return '#/provider/earnings';
    case 'transactions': return '#/provider/earnings/transactions';
    case 'incentives': return '#/provider/earnings/incentives';
    case 'wallet': return '#/provider/earnings/wallet';
    case 'bank-payout': return '#/provider/earnings/bank';
    case 'reviews': return '#/provider/reviews';
    case 'analytics': return '#/provider/analytics';
    case 'capacity': return '#/provider/capacity';
    case 'service-area': return '#/provider/service-area';
    case 'schedule': return '#/provider/schedule';
    case 'performance': return '#/provider/performance';
    case 'notifications': return '#/provider/notifications';
    case 'settings': return '#/provider/settings';
    case 'help': return '#/provider/help';
    default: return '#/provider/dashboard';
  }
};

export default function ProviderDashboard({ currentUser, onLogout, onUpdateUser }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTabState] = useState(() => {
    return getProviderTabFromHash(typeof window !== 'undefined' ? window.location.hash : '');
  });

  const setActiveTab = (newTab, updateHash = true) => {
    setActiveTabState(newTab);
    if (updateHash && typeof window !== 'undefined') {
      const targetHash = getHashFromProviderTab(newTab);
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const tabFromHash = getProviderTabFromHash(window.location.hash);
      setActiveTabState(tabFromHash);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);
  const [expandedMenus, setExpandedMenus] = useState({
    tiffins: true,
    orders: true
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isKitchenOnline, setIsKitchenOnline] = useState(true);
  const [statusToast, setStatusToast] = useState('');
  const [soundActive, setSoundActive] = useState(isSoundEnabled());
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [isAcceptingAlert, setIsAcceptingAlert] = useState(false);
  const [isDecliningAlert, setIsDecliningAlert] = useState(false);

  // Dynamic Sidebar & Header Badge Counts from MongoDB Database
  const [badgeCounts, setBadgeCounts] = useState({
    liveRequests: 0,
    newOrders: 0,
    notifications: 0
  });

  const updateNotificationBadgeCount = (count) => {
    setBadgeCounts(prev => ({
      ...prev,
      notifications: typeof count === 'number' ? Math.max(0, count) : 0
    }));
  };

  const fetchSidebarBadges = async () => {
    try {
      const dashRes = await apiRequest('/providers/dashboard');
      const dashJson = typeof dashRes?.json === 'function' ? await dashRes.json() : dashRes;
      if (dashJson && dashJson.success && dashJson.data) {
        if (dashJson.data.acceptingOrders !== undefined) {
          setIsKitchenOnline(Boolean(dashJson.data.acceptingOrders));
        }
        setBadgeCounts(prev => ({
          ...prev,
          liveRequests: dashJson.data.liveRequestsCount || 0,
          newOrders: dashJson.data.newOrdersCount || 0
        }));

        // If there are live requests and no alert is active, surface the latest pending request
        if (dashJson.data.liveRequestsCount > 0) {
          try {
            const reqRes = await apiRequest('/requests');
            const reqJson = typeof reqRes?.json === 'function' ? await reqRes.json() : reqRes;
            if (reqJson && reqJson.success && Array.isArray(reqJson.data) && reqJson.data.length > 0) {
              const pendingReq = reqJson.data.find(r => r.status === 'pending');
              if (pendingReq) {
                setNewOrderAlert(prev => {
                  if (prev) return prev;
                  playKitchenAlertLoop();
                  return pendingReq;
                });
              }
            }
          } catch (e) {}
        }
      }

      // Fetch real unread notification count
      const notifRes = await apiRequest('/notifications?limit=1');
      const notifJson = typeof notifRes?.json === 'function' ? await notifRes.json() : notifRes;
      if (notifJson && notifJson.success && notifJson.summary) {
        setBadgeCounts(prev => ({
          ...prev,
          notifications: notifJson.summary.unread || 0
        }));
      }
    } catch (err) {
      console.error('Error fetching sidebar badge counts from MongoDB:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSidebarBadges();
    }

    const interval = setInterval(() => {
      if (currentUser) fetchSidebarBadges();
    }, 4000);

    let socket;
    try {
      socket = getSocket();
      if (socket && currentUser) {
        const pId = currentUser?.providerId || currentUser?.id || currentUser?._id;
        if (pId) {
          socket.emit('join:provider', { providerId: String(pId) });
        }

        const handleNewOrderIncoming = (data) => {
          if (data?.providerId && pId && String(data.providerId) !== String(pId)) return;
          fetchSidebarBadges();
          playKitchenAlertLoop();
          if (data) {
            // Keep request showing on provider dashboard until provider explicitly accepts or declines
            setNewOrderAlert(data);
          }
          window.dispatchEvent(new CustomEvent('tiffinlink:new-order', { detail: data }));
        };

        const handleBadgeSync = (data) => {
          if (data?.providerId && pId && String(data.providerId) !== String(pId)) return;
          fetchSidebarBadges();
          window.dispatchEvent(new CustomEvent('tiffinlink:new-order', { detail: data }));
        };

        const handleRequestResolved = (data) => {
          if (data?.requestId || data?.orderId || data?.id) {
            const resolvedId = String(data.requestId || data.orderId || data.id || '').replace(/^#/, '');
            setNewOrderAlert(prev => {
              if (!prev) return null;
              const prevId = String(prev._id || prev.id || prev.requestId || prev.orderId || '').replace(/^#/, '');
              if (prevId === resolvedId) {
                stopKitchenAlertSound();
                return null;
              }
              return prev;
            });
          }
          fetchSidebarBadges();
        };

        const handleWindowOrderAccepted = () => {
          stopKitchenAlertSound();
          setNewOrderAlert(null);
          fetchSidebarBadges();
        };

        const handleWindowRequestDeclined = () => {
          stopKitchenAlertSound();
          setNewOrderAlert(null);
          fetchSidebarBadges();
        };

        window.addEventListener('tiffinlink:order-accepted', handleWindowOrderAccepted);
        window.addEventListener('tiffinlink:request-declined', handleWindowRequestDeclined);

        socket.on('order:created', handleNewOrderIncoming);
        socket.on('order:new', handleNewOrderIncoming);
        socket.on('request:new', handleNewOrderIncoming);
        socket.on('order:status:updated', handleBadgeSync);
        socket.on('request:accepted', handleRequestResolved);
        socket.on('request:declined', handleRequestResolved);
        socket.on('request:cancelled', handleRequestResolved);
        socket.on('notification:new', handleBadgeSync);

        return () => {
          clearInterval(interval);
          stopKitchenAlertSound();
          window.removeEventListener('tiffinlink:order-accepted', handleWindowOrderAccepted);
          window.removeEventListener('tiffinlink:request-declined', handleWindowRequestDeclined);
          socket.off('order:created', handleNewOrderIncoming);
          socket.off('order:new', handleNewOrderIncoming);
          socket.off('request:new', handleNewOrderIncoming);
          socket.off('order:status:updated', handleBadgeSync);
          socket.off('request:accepted', handleRequestResolved);
          socket.off('request:declined', handleRequestResolved);
          socket.off('request:cancelled', handleRequestResolved);
          socket.off('notification:new', handleBadgeSync);
        };
      }
    } catch (e) {}

    return () => clearInterval(interval);
  }, [currentUser]);

  // Live countdown ticker for newOrderAlert if secondsLeft exists
  useEffect(() => {
    if (!newOrderAlert) return;
    const timer = setInterval(() => {
      setNewOrderAlert(prev => {
        if (!prev) return null;
        if (typeof prev.secondsLeft === 'number') {
          if (prev.secondsLeft <= 1) {
            stopKitchenAlertSound();
            return null;
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [newOrderAlert]);

  const handleAcceptIncomingAlert = async (alertItem) => {
    if (!alertItem || isAcceptingAlert || isDecliningAlert) return;
    setIsAcceptingAlert(true);
    stopKitchenAlertSound();

    const rawId = alertItem._id || alertItem.id || alertItem.requestId || alertItem.orderId;
    const cleanId = String(rawId || '').replace(/^#/, '').trim();
    const isOrder = Boolean(alertItem.orderId && !alertItem.requestId && !alertItem.mealType);

    try {
      const endpoint = isOrder ? `/orders/${encodeURIComponent(cleanId)}/accept` : `/requests/${encodeURIComponent(cleanId)}/accept`;
      const res = await apiRequest(endpoint, { method: 'POST' });
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        setStatusToast('✓ Request accepted! Order created in Kitchen Prep Queue.');
        setNewOrderAlert(null);
        window.dispatchEvent(new CustomEvent('tiffinlink:order-accepted', { detail: { id: cleanId } }));
      } else {
        setStatusToast(`⚠️ ${json?.message || 'Request is no longer available.'}`);
        setNewOrderAlert(null);
      }
    } catch (err) {
      console.error('Error accepting incoming request:', err);
      setStatusToast('⚠️ Failed to accept request. Please try again.');
    } finally {
      setIsAcceptingAlert(false);
      setTimeout(() => setStatusToast(''), 4000);
      fetchSidebarBadges();
    }
  };

  const handleDeclineIncomingAlert = async (alertItem) => {
    if (!alertItem || isAcceptingAlert || isDecliningAlert) return;
    setIsDecliningAlert(true);
    stopKitchenAlertSound();

    const rawId = alertItem._id || alertItem.id || alertItem.requestId || alertItem.orderId;
    const cleanId = String(rawId || '').replace(/^#/, '').trim();
    const isOrder = Boolean(alertItem.orderId && !alertItem.requestId && !alertItem.mealType);

    try {
      if (isOrder) {
        await apiRequest(`/orders/${encodeURIComponent(cleanId)}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason: 'Declined by kitchen provider' })
        }).catch(() => {});
      } else {
        await apiRequest(`/requests/${encodeURIComponent(cleanId)}/decline`, {
          method: 'POST'
        }).catch(() => {});
      }

      setStatusToast('Request declined and removed.');
      setNewOrderAlert(null);
      window.dispatchEvent(new CustomEvent('tiffinlink:request-declined', { detail: { id: cleanId } }));
    } catch (err) {
      console.error('Error declining incoming request:', err);
      setNewOrderAlert(null);
    } finally {
      setIsDecliningAlert(false);
      setTimeout(() => setStatusToast(''), 3500);
      fetchSidebarBadges();
    }
  };

  const handleToggleKitchenOnline = async () => {
    const nextStatus = !isKitchenOnline;
    setIsKitchenOnline(nextStatus);
    try {
      const json = await apiRequest('/providers/status', {
        method: 'PUT',
        body: JSON.stringify({
          acceptingOrders: nextStatus
        })
      });
      if (json.success) {
        setStatusToast(`✓ Kitchen status updated to ${nextStatus ? 'ONLINE (Accepting Orders)' : 'OFFLINE (Paused)'}`);
        setTimeout(() => setStatusToast(''), 3500);
      }
    } catch (err) {
      console.error('Error updating status in database:', err);
    }
  };

  const toggleSubMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const renderActiveTabContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardOverviewTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
        case 'requests':
        case 'live-requests':
          return <LiveRequestsTab currentUser={currentUser} onNavigateTab={setActiveTab} onAcceptRequest={() => setActiveTab('orders-preparing')} />;
        case 'tiffins':
          return <MyTiffinsTab currentUser={currentUser} key="all" initialSubView="all" onNavigateTab={setActiveTab} />;
        case 'add-tiffin':
          return <MyTiffinsTab currentUser={currentUser} key="add" initialSubView="add" initialOpenModal={true} onNavigateTab={setActiveTab} />;
        case 'availability':
          return <MyTiffinsTab currentUser={currentUser} key="availability" initialSubView="availability" onNavigateTab={setActiveTab} />;
        case 'categories':
          return <MyTiffinsTab currentUser={currentUser} key="categories" initialSubView="categories" onNavigateTab={setActiveTab} />;
        case 'tiffin-items':
          return <MyTiffinsTab currentUser={currentUser} key="tiffin-items" initialSubView="tiffin-items" onNavigateTab={setActiveTab} />;
        case 'meal-builder':
          return <MyTiffinsTab currentUser={currentUser} key="meal-builder" initialSubView="meal-builder" onNavigateTab={setActiveTab} />;
        case 'orders':
        case 'orders-all':
          return <OrdersTab currentUser={currentUser} initialStatus="All" />;
        case 'orders-new':
          return <OrdersTab currentUser={currentUser} initialStatus="New" />;
        case 'orders-preparing':
          return <OrdersTab currentUser={currentUser} initialStatus="Preparing" />;
        case 'orders-ready':
          return <OrdersTab currentUser={currentUser} initialStatus="Ready" />;
        case 'orders-delivery':
        case 'delivery':
          return <OrdersTab currentUser={currentUser} initialStatus="Delivery" />;
        case 'delivery-management':
          return <DeliveryManagementTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
        case 'orders-completed':
          return <OrdersTab currentUser={currentUser} initialStatus="Completed" />;
        case 'orders-cancelled':
          return <OrdersTab currentUser={currentUser} initialStatus="Cancelled" />;
        case 'customers':
          return <CustomersTab currentUser={currentUser} />;
        case 'subscriptions':
          return <SubscriptionsTab currentUser={currentUser} />;
        case 'performance':
          return <PerformanceTab currentUser={currentUser} />;
        case 'reviews':
        case 'ratings-reviews':
          return <ReviewsTab currentUser={currentUser} />;
        case 'earnings':
        case 'transactions':
        case 'incentives':
        case 'wallet':
        case 'bank-payout':
          return <EarningsTab currentUser={currentUser} initialSubTab={activeTab} />;
        case 'analytics':
          return <AnalyticsTab currentUser={currentUser} />;
        case 'capacity':
          return <CapacityTab currentUser={currentUser} />;
        case 'service-area':
          return <ServiceAreaTab currentUser={currentUser} />;
        case 'schedule':
          return <ScheduleTab currentUser={currentUser} />;
        case 'notifications':
          return (
            <NotificationsTab
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onUnreadCountChange={updateNotificationBadgeCount}
            />
          );
        case 'settings':
        case 'settings-account':
        case 'settings-notifications':
        case 'settings-privacy':
        case 'settings-preferences':
          return <SettingsTab currentUser={currentUser} onUpdateUser={onUpdateUser} initialSubTab={activeTab} />;
        case 'help':
        case 'help-support':
          return <HelpSupportTab currentUser={currentUser} onNavigateTab={setActiveTab} />;

        default:
          return <DashboardOverviewTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
      }
    } catch (err) {
      console.error('Error rendering active provider tab:', err);
      return (
        <div className="bg-white p-8 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3 text-center">
          <div className="text-sm font-black text-[#111827]">Tab Content Loading</div>
          <p className="text-xs text-[#6B7280]">Please click another tab in the sidebar to view details.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>

      {/* LEFT FIXED SIDEBAR */}
      <ProviderSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        badgeCounts={badgeCounts}
        currentUser={currentUser}
        isKitchenOnline={isKitchenOnline}
        onToggleKitchenOnline={handleToggleKitchenOnline}
        onLogout={onLogout}
      />

      {/* TOP HEADER & MAIN CONTAINER */}
      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl z-40 flex items-center justify-between px-4 lg:px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-sand-neutral/30">
          
          {/* Mobile Menu Toggle & Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>

            <a
              href="#"
              className="lg:hidden flex items-center shrink-0 cursor-pointer no-underline mr-1"
              title="TiffinLink"
            >
              <span
                className="font-headline-md text-xl tracking-tighter text-[#1a1a1a]"
                style={{ fontFamily: "'EB Garamond', serif" }}
              >
                TiffinLink
              </span>
            </a>

            <div className="w-full flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-sand-neutral/30">
              <span className="material-symbols-outlined text-secondary text-[20px] mr-2.5">search</span>
              <input
                type="text"
                placeholder={t('search_placeholder', 'Search orders, tiffins, customers... (Order ID, Name, Phone)')}
                className="bg-transparent w-full text-sm placeholder:text-secondary focus:outline-none text-on-surface font-body-md"
              />
              <kbd className="hidden sm:inline-block font-label-caps text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded border border-sand-neutral">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Header Status & Controls */}
          <div className="flex items-center gap-3 ml-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low border border-sand-neutral/30">
              <span className={`w-2 h-2 rounded-full ${isKitchenOnline ? 'bg-onyx-black animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="font-label-caps text-[11px] font-bold uppercase text-on-surface tracking-wider">
                {isKitchenOnline ? t('online', 'ONLINE') : t('offline', 'OFFLINE')}
              </span>
            </div>

            {/* Audio Alerts Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !soundActive;
                setSoundActive(nextVal);
                setSoundEnabled(nextVal);
                if (nextVal) playKitchenOrderSound();
              }}
              title={soundActive ? 'Order Alert Chimes: Active (Click to mute)' : 'Order Alert Chimes: Muted (Click to enable)'}
              className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${soundActive ? 'text-onyx-black hover:bg-surface-container-low' : 'text-neutral-400 hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {soundActive ? 'volume_up' : 'volume_off'}
              </span>
              <span className="hidden md:inline font-label-caps text-[10px] uppercase font-bold tracking-wider">
                {soundActive ? 'Chime On' : 'Muted'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {badgeCounts.notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-clay-earth text-bone-white font-label-caps text-[9px] flex items-center justify-center font-bold">
                  {badgeCounts.notifications > 99 ? '99+' : badgeCounts.notifications}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('help')}
              aria-label="Help & Support"
              className="p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative border-l border-sand-neutral/40 pl-2">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-onyx-black flex items-center justify-center text-bone-white font-bold text-xs overflow-hidden">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-bone-white text-[18px]">person</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-label-caps text-[11px] font-bold text-on-surface leading-tight">
                    {currentUser?.kitchenName || currentUser?.businessName || currentUser?.name || 'Kitchen Partner'}
                  </div>
                  <div className="font-label-caps text-[9px] text-secondary leading-tight">
                    {t('home_kitchen_provider', 'Home Kitchen Provider')}
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary text-[16px]">expand_more</span>
              </button>

              {/* Profile Menu Popup */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-sand-neutral rounded-2xl shadow-xl py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-sand-neutral/40">
                    <p className="font-button-text font-bold text-on-surface text-[13px]">
                      {currentUser?.kitchenName || currentUser?.businessName || currentUser?.name || 'Kitchen Partner'}
                    </p>
                    <p className="font-label-caps text-[10px] text-secondary truncate">
                      {currentUser?.email || ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('settings'); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-low font-button-text text-[13px] flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    <span>{t('account_settings', 'Account Settings')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('help'); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-low font-button-text text-[13px] flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span>{t('help_support', 'Help & Support')}</span>
                  </button>

                  <div className="my-1 border-t border-sand-neutral/40" />

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => { setIsProfileDropdownOpen(false); onLogout(); }}
                      className="w-full text-left px-4 py-2 text-error hover:bg-error-container/20 font-button-text text-[13px] flex items-center gap-2.5 cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>{t('log_out', 'Log Out')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="w-full pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-surface min-h-screen">
          <div className="max-w-7xl mx-auto">
            {renderActiveTabContent()}
          </div>
        </main>
      </div>

      {/* Real-Time Incoming Request / Order Persistent Modal Banner */}
      {newOrderAlert && (
        <div className="fixed top-20 right-4 sm:right-8 z-[9999] animate-in slide-in-from-top-4 duration-300 max-w-lg w-[calc(100vw-2rem)] sm:w-full bg-white text-stone-900 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border-2 border-stone-800 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center animate-pulse shrink-0 border border-emerald-300">
                <span className="material-symbols-outlined text-[24px]">notifications_active</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-base text-stone-900 tracking-tight">
                    {newOrderAlert.orderId ? '🛎️ New Customer Order' : '🚨 New Incoming Live Request'}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider animate-pulse">
                    PENDING ACTION
                  </span>
                </div>
                <div className="text-xs text-stone-600 mt-0.5 font-medium">
                  Action required • Remains on screen until Accepted or Declined
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold block">Order Value</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                ₹{newOrderAlert.totalAmount || (newOrderAlert.quantity || 1) * (newOrderAlert.budget || 0) || newOrderAlert.budget || newOrderAlert.amount || '0'}
              </span>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-600 font-semibold text-xs">Meal Item:</span>
              <span className="font-bold text-stone-900 truncate text-right text-xs">
                {newOrderAlert.mealType || newOrderAlert.tiffinName || (newOrderAlert.items && newOrderAlert.items[0]?.name) || 'Homestyle Tiffin'} • {newOrderAlert.quantity || 1} Box(es)
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-600 font-semibold text-xs">Customer:</span>
              <span className="font-bold text-stone-900 truncate text-right text-xs">
                {newOrderAlert.customerName || 'Direct Customer'} {newOrderAlert.customerPhone ? `(${newOrderAlert.customerPhone})` : ''}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-stone-600 font-semibold text-xs shrink-0">Delivery Location:</span>
              <span className="font-medium text-stone-800 text-right truncate max-w-[280px] text-xs">
                {newOrderAlert.customerAddress || newOrderAlert.location || newOrderAlert.deliveryAddress?.street || 'Customer address on file'}
              </span>
            </div>

            {newOrderAlert.specialInstructions && (
              <div className="pt-2 border-t border-stone-200 text-stone-700 italic text-[11px] flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-amber-600">info</span>
                <span>Note: "{newOrderAlert.specialInstructions}"</span>
              </div>
            )}

            {typeof newOrderAlert.secondsLeft === 'number' && (
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                <span className="text-stone-600 font-medium">Auto-expires in:</span>
                <span className="text-amber-700 font-black font-mono">
                  {Math.floor(newOrderAlert.secondsLeft / 60)}:{(newOrderAlert.secondsLeft % 60).toString().padStart(2, '0')}s
                </span>
              </div>
            )}
          </div>

          {/* Action Decision Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isAcceptingAlert || isDecliningAlert}
              onClick={() => handleAcceptIncomingAlert(newOrderAlert)}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{isAcceptingAlert ? 'Accepting...' : 'Accept Request'}</span>
            </button>

            <button
              type="button"
              disabled={isAcceptingAlert || isDecliningAlert}
              onClick={() => handleDeclineIncomingAlert(newOrderAlert)}
              className="py-3 px-5 bg-stone-100 hover:bg-rose-100 hover:border-rose-400 hover:text-rose-800 text-stone-800 border border-stone-300 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>{isDecliningAlert ? 'Declining...' : 'Decline'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (newOrderAlert.orderId) {
                  setActiveTab('orders-all');
                } else {
                  setActiveTab('live-requests');
                }
              }}
              className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center"
              title="View full details in dashboard tab"
            >
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Toast Banner */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-bone-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce font-button-text text-button-text border border-sand-neutral/40">
          <span>{statusToast}</span>
        </div>
      )}
    </div>
  );
}

