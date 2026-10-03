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

  // Dynamic Sidebar Badge Counts from MongoDB Database
  const [badgeCounts, setBadgeCounts] = useState({
    liveRequests: 0,
    newOrders: 0
  });

  useEffect(() => {
    const fetchSidebarBadges = async () => {
      try {
        const dashRes = await apiRequest('/providers/dashboard');
        const dashJson = typeof dashRes?.json === 'function' ? await dashRes.json() : dashRes;
        if (dashJson && dashJson.success && dashJson.data) {
          if (dashJson.data.acceptingOrders !== undefined) {
            setIsKitchenOnline(Boolean(dashJson.data.acceptingOrders));
          }
          setBadgeCounts({
            liveRequests: dashJson.data.liveRequestsCount || 0,
            newOrders: dashJson.data.newOrdersCount || 0
          });
        }
      } catch (err) {
        console.error('Error fetching sidebar badge counts from MongoDB:', err);
      }
    };

    if (currentUser) {
      fetchSidebarBadges();
    }
  }, [currentUser]);

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
          return <NotificationsTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
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
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">

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

            <div className="w-full flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-sand-neutral/30">
              <span className="material-symbols-outlined text-secondary text-[20px] mr-2.5">search</span>
              <input
                type="text"
                placeholder="Search orders, tiffins, customers... (Order ID, Name, Phone)"
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
                {isKitchenOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-clay-earth text-bone-white font-label-caps text-[9px] flex items-center justify-center font-bold">
                {badgeCounts.notifications || 3}
              </span>
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
                    {currentUser?.name || currentUser?.businessName || 'Xoxo Men'}
                  </div>
                  <div className="font-label-caps text-[9px] text-secondary leading-tight">
                    Home Kitchen Provider
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary text-[16px]">expand_more</span>
              </button>

              {/* Profile Menu Popup */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-sand-neutral rounded-2xl shadow-xl py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-sand-neutral/40">
                    <p className="font-button-text font-bold text-on-surface text-[13px]">
                      {currentUser?.name || currentUser?.businessName || 'Xoxo Men'}
                    </p>
                    <p className="font-label-caps text-[10px] text-secondary truncate">
                      {currentUser?.email || 'menxoxo50@gmail.com'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('settings'); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-low font-button-text text-[13px] flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    <span>Account Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('help'); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-low font-button-text text-[13px] flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">help</span>
                    <span>Help Concierge</span>
                  </button>

                  <div className="my-1 border-t border-sand-neutral/40" />

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => { setIsProfileDropdownOpen(false); onLogout(); }}
                      className="w-full text-left px-4 py-2 text-error hover:bg-error-container/20 font-button-text text-[13px] flex items-center gap-2.5 cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Log Out</span>
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

      {/* Status Toast Banner */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-bone-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce font-button-text text-button-text border border-sand-neutral/40">
          <span>{statusToast}</span>
        </div>
      )}
    </div>
  );
}

