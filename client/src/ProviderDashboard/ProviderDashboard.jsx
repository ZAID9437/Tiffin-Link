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
  CircleHelp,
  Tag,
  Zap,
  Clock,
  ShieldCheck,
  Power
} from 'lucide-react';

import DashboardOverviewTab from './DashboardOverviewTab';
import MyTiffinsTab from './MyTiffinsTab';
import OrdersTab from './OrdersTab';
import CustomersTab from './CustomersTab';
import EarningsTab from './EarningsTab';
import ReviewsTab from './ReviewsTab';
import AnalyticsTab from './AnalyticsTab';
import NotificationsTab from './NotificationsTab';
import SettingsTab from './SettingsTab';
import HelpSupportTab from './HelpSupportTab';

export default function ProviderDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState({
    tiffins: true,
    orders: true
  });
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Online / Offline Status State (persisted to localStorage)
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('tiffinlink_provider_accepting_orders') !== 'false';
  });

  const [statusToast, setStatusToast] = useState(null);

  const toggleOnlineStatus = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    localStorage.setItem('tiffinlink_provider_accepting_orders', String(nextState));

    setStatusToast(
      nextState 
        ? '🟢 ONLINE — Now accepting incoming tiffin requests!'
        : '⚪ OFFLINE — Kitchen paused. Requests paused.'
    );

    try {
      await fetch('http://localhost:5000/api/providers/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingOrders: nextState, email: currentUser?.email })
      });
    } catch (err) {
      console.error('Error syncing status to backend:', err);
    }

    setTimeout(() => {
      setStatusToast(null);
    }, 3500);
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
        case 'live-requests':
          return <DashboardOverviewTab currentUser={currentUser} onNavigateTab={setActiveTab} isOnline={isOnline} onToggleOnline={toggleOnlineStatus} />;
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
        case 'orders-active':
          return <OrdersTab initialStatus="All" />;
        case 'orders-upcoming':
        case 'orders-new':
          return <OrdersTab initialStatus="New" />;
        case 'orders-preparing':
          return <OrdersTab initialStatus="Preparing" />;
        case 'orders-ready':
          return <OrdersTab initialStatus="Ready" />;
        case 'orders-completed':
          return <OrdersTab initialStatus="Completed" />;
        case 'orders-cancelled':
          return <OrdersTab initialStatus="Cancelled" />;
        case 'customers':
          return <CustomersTab />;
        case 'earnings':
          return <EarningsTab />;
        case 'reviews':
          return <ReviewsTab />;
        case 'analytics':
          return <AnalyticsTab />;
        case 'notifications':
          return <NotificationsTab onNavigateTab={setActiveTab} />;
        case 'settings':
          return <SettingsTab currentUser={currentUser} />;
        case 'help':
          return <HelpSupportTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
        default:
          return <DashboardOverviewTab currentUser={currentUser} onNavigateTab={setActiveTab} isOnline={isOnline} onToggleOnline={toggleOnlineStatus} />;
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-[#0F172A] selection:bg-[#0A8B5F] selection:text-white flex flex-col pb-16 md:pb-0">
      
      {/* Real-time Status Toast Alert */}
      {statusToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E293B] text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <span>{statusToast}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        
        {/* Left Branding & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <a href="#" className="flex items-center gap-2.5 text-decoration-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A8B5F] to-[#046C49] text-white flex items-center justify-center font-black text-lg shadow-sm">
              🍱
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#0F172A] leading-none">
                Tiffin<span className="text-[#0A8B5F]">Link</span>
              </span>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Provider Portal</span>
            </div>
          </a>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Search orders, customers, live requests..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:border-[#0A8B5F] focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Header Online Status Badge */}
          <button
            onClick={toggleOnlineStatus}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          <button 
            onClick={() => setActiveTab('help')}
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
            title="Help & Support"
          >
            <CircleHelp size={18} />
          </button>

          <div className="h-6 w-px bg-[#E2E8F0] mx-1" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-[#E8F0EC] text-[#0A8B5F] font-bold flex items-center justify-center text-xs overflow-hidden border border-[#C5DDD2] shadow-2xs">
                <img 
                  src={currentUser?.avatar || "/assets/provider_1.png"} 
                  alt="Provider" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.target.src = "/assets/provider_1.png"; }}
                />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0F172A] leading-tight">
                  {currentUser?.name || "Priya's Tiffin Kitchen"}
                </span>
                <span className="text-[10px] text-[#0A8B5F] font-bold flex items-center gap-1">
                  <span>4.8 ★</span>
                  <span className="text-[#94A3B8]">| Home Chef</span>
                </span>
              </div>
              <ChevronDown size={14} className="text-[#64748B] hidden lg:block" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] py-1.5 z-50 animate-scale-in text-xs font-medium">
                <div className="px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <p className="font-extrabold text-[#0F172A]">{currentUser?.name || "Priya's Kitchen"}</p>
                  <p className="text-[10px] text-[#64748B] truncate">{currentUser?.email || "priya@tiffinlink.com"}</p>
                </div>

                <div className="p-2 border-b border-[#E2E8F0]">
                  <button 
                    onClick={() => { toggleOnlineStatus(); setIsProfileDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#F1F5F9] flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-bold text-[#0F172A]">Kitchen Status</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </button>
                </div>

                <button 
                  onClick={() => { setActiveTab('settings'); setIsProfileDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Settings size={14} />
                  <span>Business Settings</span>
                </button>

                <button 
                  onClick={() => { setActiveTab('help'); setIsProfileDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <CircleHelp size={14} />
                  <span>Help Concierge</span>
                </button>

                <div className="my-1 border-t border-[#E2E8F0]" />

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

      {/* DASHBOARD LAYOUT BODY */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* RESTRUCTURED 7-SECTION PROVIDER SIDEBAR */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-30 w-60 md:w-64 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs
          transform transition-transform duration-200 ease-in-out md:transform-none flex flex-col justify-between shrink-0 h-fit sticky top-20
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
            
            {/* Authenticated Provider Identity Card */}
            <div className="p-3 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-xl border border-[#E2E8F0] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-wider text-[#64748B] uppercase">
                  <span>🍱 Kitchen</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              </div>
              <div className="text-xs font-black text-[#0F172A] truncate">
                {currentUser?.name || "Priya's Tiffin Service"}
              </div>
              <div className="text-[10px] text-[#0A8B5F] font-bold flex items-center gap-1">
                <span>Verified Provider</span>
                <ShieldCheck size={12} className="text-[#0A8B5F]" />
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="space-y-3">
              
              {/* SECTION 1: OVERVIEW */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">OVERVIEW</div>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'dashboard' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('live-requests'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'live-requests' ? 'bg-amber-500 text-white shadow-xs' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Zap size={16} className={activeTab === 'live-requests' ? 'text-white' : 'text-amber-500'} />
                      <span>Live Requests</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'live-requests' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      8
                    </span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: ORDERS */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">ORDERS</div>
                <div>
                  <div 
                    onClick={() => toggleSubMenu('orders')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab.startsWith('orders') ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-bold text-xs">
                      <ShoppingBag size={16} />
                      <span>Order Center</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#0A8B5F] text-white">3</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${expandedMenus.orders ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {expandedMenus.orders && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5">
                      <button 
                        onClick={() => { setActiveTab('orders-active'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders' || activeTab === 'orders-all' || activeTab === 'orders-active' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ListOrdered size={14} />
                          <span>Active Orders</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#0A8B5F]">3</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('orders-upcoming'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-upcoming' || activeTab === 'orders-new' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <Clock size={14} />
                        <span>Upcoming</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('orders-completed'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'orders-completed' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <CheckCircle size={14} />
                        <span>Completed</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: FOOD */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">FOOD</div>
                <div>
                  <div 
                    onClick={() => toggleSubMenu('tiffins')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab.startsWith('tiffin') || activeTab === 'add-tiffin' || activeTab === 'availability' || activeTab === 'categories' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 font-bold text-xs">
                      <Utensils size={16} />
                      <span>Menu & Meals</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${expandedMenus.tiffins ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedMenus.tiffins && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5">
                      <button 
                        onClick={() => { setActiveTab('tiffins'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'tiffins' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <List size={14} />
                        <span>My Tiffins</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('add-tiffin'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'add-tiffin' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <PlusCircle size={14} />
                        <span>Add Tiffin</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('availability'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'availability' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <CalendarCheck size={14} />
                        <span>Availability</span>
                      </button>
                      <button 
                        onClick={() => { setActiveTab('categories'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeTab === 'categories' ? 'text-[#0A8B5F] font-extrabold bg-[#E8F0EC]' : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <Tag size={14} />
                        <span>Categories</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: CUSTOMERS */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">CUSTOMERS</div>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'customers' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <Users size={16} />
                    <span>Customers</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('reviews'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'reviews' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <Star size={16} />
                    <span>Reviews</span>
                  </button>
                </div>
              </div>

              {/* SECTION 5: BUSINESS */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">BUSINESS</div>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { setActiveTab('earnings'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'earnings' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <Wallet size={16} />
                    <span>Earnings</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('analytics'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'analytics' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <BarChart3 size={16} />
                    <span>Analytics</span>
                  </button>
                </div>
              </div>

              {/* SECTION 6: COMMUNICATION */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">COMMUNICATION</div>
                <button 
                  onClick={() => { setActiveTab('notifications'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    activeTab === 'notifications' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell size={16} />
                    <span>Notifications</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">3</span>
                </button>
              </div>

              {/* SECTION 7: SYSTEM */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#94A3B8] px-3 mb-1">SYSTEM</div>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'settings' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>

                  <button 
                    onClick={() => { setActiveTab('help'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      activeTab === 'help' ? 'bg-[#E8F0EC] text-[#0A8B5F]' : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <CircleHelp size={16} />
                    <span>Help & Support</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* SIDEBAR BOTTOM KITCHEN AVAILABILITY STATUS CARD */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              isOnline ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-100/70 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-[#0F172A]">
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                  <span className="text-[9px] text-[#64748B] font-bold">
                    {isOnline ? 'Accepting requests' : 'Requests paused'}
                  </span>
                </div>
              </div>

              <button 
                onClick={toggleOnlineStatus}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isOnline ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-300 text-slate-700 border-slate-300'
                }`}
                title={isOnline ? 'Go Offline' : 'Go Online'}
              >
                <Power size={14} />
              </button>
            </div>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN TAB CONTENT CONTAINER */}
        <main className="flex-1 min-w-0">
          {renderActiveTabContent()}
        </main>

      </div>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#E2E8F0] px-3 py-2 z-40 flex items-center justify-around shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#0A8B5F]' : 'text-[#64748B]'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('live-requests')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer relative ${
            activeTab === 'live-requests' ? 'text-amber-500' : 'text-[#64748B]'
          }`}
        >
          <Zap size={18} />
          <span>Requests</span>
          <span className="absolute -top-1 right-1 px-1 bg-amber-500 text-white rounded-full text-[9px] font-black">8</span>
        </button>

        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer relative ${
            activeTab.startsWith('orders') ? 'text-[#0A8B5F]' : 'text-[#64748B]'
          }`}
        >
          <ShoppingBag size={18} />
          <span>Orders</span>
          <span className="absolute -top-1 right-1 px-1 bg-[#0A8B5F] text-white rounded-full text-[9px] font-black">3</span>
        </button>

        <button 
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer ${
            activeTab === 'earnings' ? 'text-[#0A8B5F]' : 'text-[#64748B]'
          }`}
        >
          <Wallet size={18} />
          <span>Earnings</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer ${
            activeTab === 'settings' ? 'text-[#0A8B5F]' : 'text-[#64748B]'
          }`}
        >
          <Settings size={18} />
          <span>Profile</span>
        </button>
      </div>

    </div>
  );
}

