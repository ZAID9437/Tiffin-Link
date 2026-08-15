import React, { useState } from 'react';
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
import HelpSupportTab from './HelpSupportTab';

export default function ProviderDashboard({ currentUser, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState({
    tiffins: true,
    orders: true
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isKitchenOnline, setIsKitchenOnline] = useState(true);

  // Real-time Database Badge Counters
  const [liveRequestsCount, setLiveRequestsCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        // 1. Fetch live requests count
        const reqRes = await fetch('http://localhost:5000/api/requests');
        const reqJson = await reqRes.json();
        if (reqJson.success && Array.isArray(reqJson.data)) {
          setLiveRequestsCount(reqJson.data.filter(r => r.status === 'pending').length);
        } else {
          setLiveRequestsCount(0);
        }

        // 2. Fetch new orders count
        const ordRes = await fetch('http://localhost:5000/api/orders');
        const ordJson = await ordRes.json();
        if (ordJson.success && Array.isArray(ordJson.data)) {
          setNewOrdersCount(ordJson.data.filter(o => o.status === 'New').length);
        } else {
          setNewOrdersCount(0);
        }

        // 3. Fetch notifications count
        const notifRes = await fetch('http://localhost:5000/api/notifications');
        const notifJson = await notifRes.json();
        if (notifJson.success && Array.isArray(notifJson.data)) {
          setUnreadNotificationsCount(notifJson.data.filter(n => !n.isRead).length);
        } else {
          setUnreadNotificationsCount(0);
        }
      } catch (err) {
        console.error('Error fetching real-time badge counts from MongoDB:', err);
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 3000);
    return () => clearInterval(interval);
  }, []);

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
          return <LiveRequestsTab onNavigateTab={setActiveTab} onAcceptRequest={() => setActiveTab('orders-preparing')} />;
        case 'tiffins':
          return <MyTiffinsTab key="all" initialSubView="all" onNavigateTab={setActiveTab} />;
        case 'add-tiffin':
          return <MyTiffinsTab key="add" initialSubView="add" initialOpenModal={true} onNavigateTab={setActiveTab} />;
        case 'availability':
          return <MyTiffinsTab key="availability" initialSubView="availability" onNavigateTab={setActiveTab} />;
        case 'categories':
          return <MyTiffinsTab key="categories" initialSubView="categories" onNavigateTab={setActiveTab} />;
        case 'orders':
        case 'orders-all':
          return <OrdersTab initialStatus="All" />;
        case 'orders-new':
          return <OrdersTab initialStatus="New" />;
        case 'orders-preparing':
          return <OrdersTab initialStatus="Preparing" />;
        case 'orders-ready':
          return <OrdersTab initialStatus="Ready" />;
        case 'orders-delivery':
          return <OrdersTab initialStatus="Delivery" />;
        case 'orders-completed':
          return <OrdersTab initialStatus="Completed" />;
        case 'orders-cancelled':
          return <OrdersTab initialStatus="Cancelled" />;
        case 'customers':
          return <CustomersTab />;
        case 'subscriptions':
          return <SubscriptionsTab />;
        case 'reviews':
          return <ReviewsTab />;
        case 'earnings':
          return <EarningsTab />;
        case 'analytics':
          return <AnalyticsTab />;
        case 'capacity':
          return <CapacityTab />;
        case 'service-area':
          return <ServiceAreaTab />;
        case 'schedule':
          return <ScheduleTab />;
        case 'notifications':
          return <NotificationsTab onNavigateTab={setActiveTab} />;
        case 'settings':
          return <SettingsTab currentUser={currentUser} onUpdateUser={onUpdateUser} />;
        case 'help':
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
    <div className="min-h-screen bg-[#F4F7F5] font-sans antialiased text-[#111827] selection:bg-[#0A8B5F] selection:text-white flex flex-col">
      
      {/* TOP NAVIGATION BAR */}
      <header className="h-16 bg-white border-b border-[#E5ECE8] px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        
        {/* Left Branding & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FBF9] rounded-xl transition-colors cursor-pointer"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <a href="#" className="flex items-center gap-2.5 text-decoration-none">
            <div className="w-9 h-9 rounded-xl bg-[#0A8B5F] text-white flex items-center justify-center font-black text-lg shadow-sm">
              🍱
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#111827] leading-none">
                Tiffin<span className="text-[#0A8B5F]">Link</span>
              </span>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mt-0.5">Provider Partner</span>
            </div>
          </a>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input 
              type="text" 
              placeholder="Search orders, tiffins, customers..."
              className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:border-[#0A8B5F] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FBF9] rounded-xl transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button 
            onClick={() => setActiveTab('help')}
            className="p-2 text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FBF9] rounded-xl transition-colors cursor-pointer"
            title="Help & Support"
          >
            <CircleHelp size={18} />
          </button>

          <div className="h-6 w-px bg-[#E5ECE8] mx-1" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#F9FBF9] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] text-[#0A8B5F] font-bold flex items-center justify-center text-xs overflow-hidden border border-[#C5DDD2]">
                <img 
                  src={currentUser?.avatar || "/assets/provider_1.png"} 
                  alt="Provider" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.src = "/assets/provider_1.png"; }}
                />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-[#111827] leading-tight">
                  {currentUser?.name || "Xoxo Men"}
                </span>
                <span className="text-[10px] text-[#6B7280] font-semibold">Home Kitchen Provider</span>
              </div>
              <ChevronDown size={14} className="text-[#6B7280] hidden lg:block" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E5ECE8] py-1.5 z-50 animate-scale-in text-xs font-medium">
                <div className="px-4 py-2 border-b border-[#E5ECE8]">
                  <p className="font-bold text-[#111827]">{currentUser?.name || "Xoxo Men"}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">{currentUser?.email || "menxoxo50@gmail.com"}</p>
                </div>

                <button 
                  onClick={() => { setActiveTab('settings'); setIsProfileDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827] flex items-center gap-2 cursor-pointer"
                >
                  <Settings size={14} />
                  <span>Account Settings</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('help'); setIsProfileDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827] flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle size={14} />
                  <span>Help Concierge</span>
                </button>

                <div className="my-1 border-t border-[#E5ECE8]" />

                <button 
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-bold"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT BODY (FULL SCREEN EDGE-TO-EDGE) */}
      <div className="flex-1 flex w-full min-h-[calc(100vh-64px)]">
        
        {/* HIGH-DENSITY FLUSH PROVIDER SIDEBAR */}
        <aside className={`
          fixed md:sticky top-16 left-0 z-30 w-64 bg-white border-r border-[#E5ECE8] p-4 
          h-[calc(100vh-64px)] overflow-y-auto transform transition-transform duration-200 ease-in-out md:transform-none flex flex-col justify-between shrink-0
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-4">
            
            {/* Authenticated Provider Identity Header */}
            <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-[#111827]">
                <span className="w-2 h-2 rounded-full bg-[#0A8B5F] animate-pulse" />
                <span>🍱 TiffinLink</span>
              </div>
              <div className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">PROVIDER PARTNER</div>
              <div className="pt-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-black text-[#0A8B5F] truncate">{currentUser?.name || "Xoxo Men"}</span>
              </div>
              <div className="text-[10px] text-[#6B7280]">Home Kitchen Provider</div>
            </div>

            {/* Navigation Groups */}
            <div className="space-y-1">
              
              {/* GROUP 1: OVERVIEW */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">OVERVIEW</div>
                
                <button 
                  onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={17} />
                    <span>Dashboard</span>
                  </div>
                </button>

                <button 
                  onClick={() => { setActiveTab('requests'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'requests' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap size={17} className="text-amber-500 group-hover:text-amber-600" />
                    <span className="font-extrabold">Live Requests</span>
                  </div>
                  {liveRequestsCount > 0 ? (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">
                      {liveRequestsCount}
                    </span>
                  ) : null}
                </button>
              </div>

              {/* GROUP 2: ORDERS */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">ORDERS</div>
                <div>
                  <div 
                    onClick={() => toggleSubMenu('orders')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab.startsWith('orders') ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-3 font-bold text-xs">
                      <ShoppingBag size={17} />
                      <span>Orders</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${expandedMenus.orders ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedMenus.orders && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5">
                      <button 
                        onClick={() => { setActiveTab('orders-all'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders' || activeTab === 'orders-all' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ListOrdered size={14} />
                          <span>All Orders</span>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => { setActiveTab('orders-new'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-new' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Inbox size={14} />
                          <span>New Orders</span>
                        </div>
                        {newOrdersCount > 0 ? (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full animate-pulse">
                            {newOrdersCount}
                          </span>
                        ) : null}
                      </button>

                      <button 
                        onClick={() => { setActiveTab('orders-preparing'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-preparing' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <Utensils size={14} />
                        <span>Preparing</span>
                      </button>

                      <button 
                        onClick={() => { setActiveTab('orders-ready'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-ready' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <BadgeCheck size={14} />
                        <span>Ready</span>
                      </button>

                      <button 
                        onClick={() => { setActiveTab('orders-delivery'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-delivery' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <Truck size={14} />
                        <span>Delivery</span>
                      </button>

                      <button 
                        onClick={() => { setActiveTab('orders-completed'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-completed' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <CheckCircle size={14} />
                        <span>Completed</span>
                      </button>

                      <button 
                        onClick={() => { setActiveTab('orders-cancelled'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-cancelled' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <CircleX size={14} />
                        <span>Cancelled</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP 3: FOOD */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">FOOD</div>
                <div>
                  <div 
                    onClick={() => toggleSubMenu('tiffins')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab.startsWith('tiffin') || activeTab === 'add-tiffin' || activeTab === 'availability' || activeTab === 'categories' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-3 font-bold text-xs">
                      <Utensils size={17} />
                      <span>My Tiffins</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${expandedMenus.tiffins ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedMenus.tiffins && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5">
                      <button 
                        onClick={() => { setActiveTab('tiffins'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'tiffins' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <List size={14} />
                        <span>All Tiffins</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('add-tiffin'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'add-tiffin' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <PlusCircle size={14} />
                        <span>Add Tiffin</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('availability'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'availability' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <CalendarCheck size={14} />
                        <span>Availability</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('categories'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'categories' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        <Tag size={14} />
                        <span>Categories</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* GROUP 4: CUSTOMERS */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">CUSTOMERS</div>
                <button 
                  onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'customers' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Users size={17} />
                  <span>Customers</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('subscriptions'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'subscriptions' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Repeat size={17} />
                  <span>Subscriptions</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('reviews'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'reviews' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Star size={17} />
                  <span>Reviews</span>
                </button>
              </div>

              {/* GROUP 5: BUSINESS */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">BUSINESS</div>
                <button 
                  onClick={() => { setActiveTab('earnings'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'earnings' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Wallet size={17} />
                  <span>Earnings</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('analytics'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'analytics' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <BarChart3 size={17} />
                  <span>Analytics</span>
                </button>
              </div>

              {/* GROUP 6: OPERATIONS */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">OPERATIONS</div>
                <button 
                  onClick={() => { setActiveTab('capacity'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'capacity' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Store size={17} />
                  <span>Kitchen Capacity</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('service-area'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'service-area' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <MapPin size={17} />
                  <span>Service Area</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('schedule'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'schedule' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Calendar size={17} />
                  <span>Schedule</span>
                </button>
              </div>

              {/* GROUP 7: COMMUNICATION */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">COMMUNICATION</div>
                <button 
                  onClick={() => { setActiveTab('notifications'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'notifications' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell size={17} />
                    <span>Notifications</span>
                  </div>
                  {unreadNotificationsCount > 0 ? (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  ) : null}
                </button>
              </div>

              {/* GROUP 8: SYSTEM */}
              <div className="pt-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#9CA3AF] px-3 mb-1">SYSTEM</div>
                <button 
                  onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'settings' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <Settings size={17} />
                  <span>Settings</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('help'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'help' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#4B5563] hover:bg-[#F9FBF9] hover:text-[#111827]'
                  }`}
                >
                  <CircleHelp size={17} />
                  <span>Help & Support</span>
                </button>
              </div>

            </div>

          </div>

          {/* Sidebar Footer Online Switch & Logout */}
          <div className="pt-4 border-t border-[#E5ECE8] space-y-2">
            <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black">
                <span className={`w-2 h-2 rounded-full ${isKitchenOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <span>{isKitchenOnline ? 'ACCEPTING' : 'OFFLINE'}</span>
              </div>

              <button
                onClick={() => setIsKitchenOnline(!isKitchenOnline)}
                className="text-[10px] text-[#0A8B5F] hover:underline font-bold cursor-pointer"
              >
                {isKitchenOnline ? '[ Go Offline ]' : '[ Go Online ]'}
              </button>
            </div>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN TAB CONTENT CONTAINER */}
        <main className="flex-1 bg-[#F4F6F8] min-w-0 p-6 md:p-8 overflow-y-auto min-h-[calc(100vh-64px)]">
          {renderActiveTabContent()}
        </main>

      </div>
    </div>
  );
}

