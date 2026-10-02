import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, User, MapPin, CreditCard, Utensils, Calendar, 
  Settings, LogOut, CheckCircle2, Truck, Clock, ShieldCheck, 
  ChevronDown, X, ShoppingBag
} from 'lucide-react';

export default function Navbar({ 
  onOpenBecomeProviderModal, 
  onOpenBecomeDeliveryPartnerModal, 
  onOpenLogin, 
  onOpenTrackingModal,
  onOpenProfileModal,
  hasActiveOrder = false,
  currentView,
  forceSolid = false,
  isFormOpen = false,
  onCloseForm,
  currentUser = null,
  onLogout
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const lastScrollY = useRef(0);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Live notifications feed
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Order #TL-8821 Accepted',
      desc: "Mom's Kitchen has accepted your Executive Gujarati Thali.",
      time: '12:08 PM',
      unread: true,
      icon: 'kitchen',
      link: '#orders'
    },
    {
      id: 2,
      title: 'Provider Preparing Order',
      desc: 'Fresh rotlis cooked on direct flame. Packed in 304 Canister.',
      time: '12:20 PM',
      unread: true,
      icon: 'cooking',
      link: '#orders'
    },
    {
      id: 3,
      title: 'Driver Assigned & Picked Up',
      desc: 'Partner Ramesh Solanki picked up your hot lunch canister.',
      time: '12:35 PM',
      unread: true,
      icon: 'truck',
      link: '#orders'
    },
    {
      id: 4,
      title: 'Out for Delivery (12 Mins)',
      desc: 'Transit via Satellite West Corridor. OTP: 4892.',
      time: '12:38 PM',
      unread: false,
      icon: 'truck',
      link: '#orders'
    },
    {
      id: 5,
      title: 'Payment Confirmed',
      desc: '₹160 confirmed via UPI (HDFC Bank).',
      time: '12:05 PM',
      unread: false,
      icon: 'payment',
      link: '#orders'
    },
    {
      id: 6,
      title: 'Subscription Reminder',
      desc: "Tomorrow's lunch: Sev Tameta & 4 Phulka Rotli.",
      time: '10:00 AM',
      unread: false,
      icon: 'calendar',
      link: '#orders'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 120) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsScrolled(false);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [currentView]);

  const roleLabel = currentUser ? (
    currentUser.role === 'provider' ? 'Provider' : (currentUser.role === 'delivery' || currentUser.role === 'deliverer' ? 'Deliverer' : (currentUser.role === 'admin' ? 'Admin' : 'Diner'))
  ) : 'Diner';

  const userInitial = currentUser ? (
    currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()
  ) : 'Z';

  // Navigation Links: Clean Diner / User navigation matching specification
  const getNavLinks = () => {
    if (currentUser && currentUser.role === 'admin') {
      return [
        { label: 'Super Admin', href: '#/admin', id: 'admin' },
        { label: 'Diner Portal', href: '#', id: 'home' },
        { label: 'Providers', href: '#/admin/providers/all', id: 'admin-providers' },
        { label: 'Customers', href: '#/admin/customers/all', id: 'admin-customers' },
        { label: 'Orders', href: '#/admin/orders/all', id: 'admin-orders' }
      ];
    }

    if (currentUser && currentUser.role === 'provider') {
      return [
        { label: 'Dashboard', href: '#provider', id: 'provider' },
        { label: 'My Tiffins', href: '#my-tiffins', id: 'my-tiffins' },
        { label: 'Orders', href: '#provider-orders', id: 'provider-orders' },
        { label: 'Earnings', href: '#provider-earnings', id: 'provider-earnings' }
      ];
    }

    if (currentUser && (currentUser.role === 'delivery' || currentUser.role === 'deliverer')) {
      return [
        { label: 'Dashboard', href: '#delivery', id: 'delivery' },
        { label: 'My Deliveries', href: '#my-deliveries', id: 'my-deliveries' },
        { label: 'Earnings', href: '#delivery-earnings', id: 'delivery-earnings' }
      ];
    }

    // Default User / Diner Experience (Exact structure requested)
    return [
      { label: 'Home', href: '#', id: 'home' },
      { label: 'Order Tiffin', href: '#find-tiffin', id: 'find-tiffin' },
      { label: 'My Orders', href: '#orders', id: 'orders' }
    ];
  };

  const navLinks = getNavLinks();

  const isLightPage = currentView !== 'home' && currentView !== 'provider' && currentView !== 'delivery';
  const isHashLight = typeof window !== 'undefined' && (
    window.location.hash.includes('find-tiffin') || 
    window.location.hash.includes('order-tiffin') || 
    window.location.hash.includes('orders') ||
    window.location.hash.includes('my-orders')
  );
  const showSolidNav = isScrolled || forceSolid || isMobileMenuOpen || isLightPage || isHashLight;

  const handleProfileItemClick = (tab) => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    if (onOpenProfileModal) {
      onOpenProfileModal(tab);
    } else if (onOpenLogin && !currentUser) {
      onOpenLogin();
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 px-4 sm:px-6 md:px-margin-desktop py-3.5 md:py-4 flex justify-between items-center transition-all duration-500 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          showSolidNav
            ? 'bg-[#fbf9f5]/95 backdrop-blur-md text-[#1a1a1a] shadow-sm border-b border-[#ded9d1]' 
            : 'bg-transparent text-bone-white'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <a 
            className={`font-headline-md text-2xl md:text-headline-md tracking-tighter cursor-pointer ${
              showSolidNav ? 'text-[#1a1a1a]' : 'text-bone-white'
            }`} 
            href="#" 
            onClick={isFormOpen ? onCloseForm : () => setIsMobileMenuOpen(false)}
          >
            TiffinLink
          </a>

          {/* Desktop Navigation Links: Home | Order Tiffin | My Orders */}
          <div className="hidden md:flex space-x-8 lg:space-x-10 items-center">
            {navLinks.map((link) => {
              const isActive = (currentView === link.id) || (link.id === 'home' && currentView === 'home') || (window.location.hash === link.href);
              return (
                <a 
                  key={link.label}
                  className={`font-label-caps text-label-caps relative transition-colors ${
                    showSolidNav 
                      ? (isActive ? 'text-[#1a1a1a] font-bold border-b-2 border-[#a0522d] pb-1' : 'text-[#4a4238] hover:text-[#1a1a1a]') 
                      : (isActive ? 'text-white font-bold border-b-2 border-white pb-1' : 'text-bone-white/80 hover:text-white')
                  }`} 
                  href={link.href}
                  onClick={isFormOpen ? onCloseForm : undefined}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right Section: Notifications | Profile / User Dropdown */}
        <div className="flex items-center gap-3 md:gap-5">
          
          {/* Active Order Quick Track Pill */}
          {hasActiveOrder && onOpenTrackingModal && (
            <button 
              onClick={onOpenTrackingModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1b5e20] text-white hover:bg-[#144919] transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>📍 Live Track</span>
            </button>
          )}

          {/* 🔔 Notifications Button & Dropdown */}
          <div className="relative" ref={notifMenuRef}>
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsUserMenuOpen(false);
              }}
              className={`p-2 rounded-full transition-all relative cursor-pointer ${
                showSolidNav 
                  ? 'hover:bg-black/5 text-[#1a1a1a]' 
                  : 'hover:bg-white/10 text-bone-white'
              }`}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#a0522d] text-white font-mono text-[9px] font-black flex items-center justify-center shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#fbf9f5] border border-[#ded9d1] rounded-2xl shadow-2xl p-4 text-[#1a1a1a] z-[110] animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-[#a0522d]/10 text-[#a0522d] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-xs text-[#a0522d] hover:underline font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#ded9d1]/60 max-h-80 overflow-y-auto mt-2">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        window.location.hash = notif.link;
                      }}
                      className={`p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                        notif.unread ? 'bg-[#f5f3ef] hover:bg-[#ded9d1]/40' : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/10 text-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                        {notif.icon === 'truck' ? <Truck size={14} /> : notif.icon === 'cooking' ? <Utensils size={14} /> : <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#1a1a1a]">{notif.title}</p>
                          <span className="text-[10px] text-[#665d52]">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-[#665d52] mt-0.5 leading-snug">{notif.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#ded9d1] mt-2 text-center">
                  <a 
                    href="#orders" 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-xs font-bold text-[#1a1a1a] hover:underline"
                  >
                    View All Orders in Dispatch Tracker →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 👤 Profile Button & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className={`flex items-center gap-2 md:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-full border transition-all duration-300 cursor-pointer ${
                showSolidNav
                  ? 'border-[#1a1a1a]/20 bg-black/5 hover:bg-black/10 text-[#1a1a1a]' 
                  : 'border-white/30 bg-white/10 hover:bg-white/20 text-bone-white'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-[#a0522d] text-white font-bold flex items-center justify-center text-xs shadow">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block pr-1">
                <p className={`text-xs font-bold leading-none ${showSolidNav ? 'text-[#1a1a1a]' : 'text-bone-white'}`}>
                  {currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : 'Zaid Mansuri'}
                </p>
                <p className={`text-[9px] leading-none mt-1 uppercase tracking-wider font-semibold ${showSolidNav ? 'text-[#665d52]' : 'opacity-75'}`}>
                  {roleLabel}
                </p>
              </div>
              <ChevronDown size={14} className={`opacity-60 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu (Exact structure requested) */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-[#fbf9f5] border border-[#ded9d1] rounded-2xl shadow-2xl p-4 text-[#1a1a1a] z-[110] animate-in fade-in slide-in-from-top-2">
                
                {/* User Info Header */}
                <div className="pb-3 border-b border-[#ded9d1] mb-2">
                  <p className="text-[10px] text-[#a0522d] font-bold uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-bold truncate mt-0.5">{currentUser?.name || 'Zaid Mansuri'}</p>
                  <p className="text-xs text-[#665d52] truncate">{currentUser?.email || 'zaid@example.com'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1b5e20]/10 text-[#1b5e20] uppercase">
                    Verified Customer Diner
                  </span>
                </div>

                {/* Profile Links Matching Specification */}
                <div className="space-y-1 text-xs font-semibold">
                  <button
                    onClick={() => handleProfileItemClick('profile')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <User size={15} className="text-[#665d52]" />
                    <span>Personal Information</span>
                  </button>

                  <button
                    onClick={() => handleProfileItemClick('addresses')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <MapPin size={15} className="text-[#665d52]" />
                    <span>Saved Addresses</span>
                  </button>

                  <button
                    onClick={() => handleProfileItemClick('payments')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <CreditCard size={15} className="text-[#665d52]" />
                    <span>Payment Methods</span>
                  </button>

                  <button
                    onClick={() => handleProfileItemClick('preferences')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <Utensils size={15} className="text-[#665d52]" />
                    <span>Tiffin Preferences</span>
                  </button>

                  <button
                    onClick={() => handleProfileItemClick('subscriptions')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <Calendar size={15} className="text-[#665d52]" />
                    <span>Subscriptions</span>
                  </button>

                  <button
                    onClick={() => handleProfileItemClick('notifications')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <Settings size={15} className="text-[#665d52]" />
                    <span>Notifications Settings</span>
                  </button>
                </div>

                {/* Sign Out Action */}
                <div className="pt-2 border-t border-[#ded9d1] mt-2">
                  <button 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onLogout) onLogout();
                      else if (onOpenLogin) onOpenLogin();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={15} />
                      <span>{currentUser ? 'Logout' : 'Sign In / Switch'}</span>
                    </div>
                    <span>➔</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Mobile Right: Cart Icon (as requested in spec: ☰ TiffinLink 🛒 🔔) */}
          <a
            href="#orders"
            className={`md:hidden p-2 rounded-full cursor-pointer transition-all ${
              showSolidNav ? 'text-[#1a1a1a] hover:bg-black/5' : 'text-bone-white hover:bg-white/10'
            }`}
            aria-label="Orders Cart"
          >
            <ShoppingBag size={20} />
          </a>

          {/* Mobile Hamburger Trigger (☰) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${
              showSolidNav 
                ? 'text-[#1a1a1a] hover:bg-black/5' 
                : 'text-bone-white hover:bg-white/10'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} />
            ) : (
              <div className="flex flex-col gap-1 w-5">
                <span className={`h-0.5 w-full rounded ${showSolidNav ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
                <span className={`h-0.5 w-full rounded ${showSolidNav ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
                <span className={`h-0.5 w-full rounded ${showSolidNav ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Off-Canvas Navigation Drawer (Spec: Home, Order Tiffin, My Orders, Notifications, My Profile, Saved Addresses, Subscriptions, Logout) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[58px] bg-[#fbf9f5] text-[#1a1a1a] z-40 md:hidden flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 border-b border-[#ded9d1] shadow-2xl">
          <div className="flex flex-col space-y-2 pt-2">
            
            <a 
              className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between" 
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Home</span>
              <span>➔</span>
            </a>

            <a 
              className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between" 
              href="#find-tiffin"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Order Tiffin</span>
              <span>➔</span>
            </a>

            <a 
              className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between" 
              href="#orders"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>My Orders</span>
              {activeOrders.length > 0 && (
                <span className="bg-[#1b5e20] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {activeOrders.length} Active
                </span>
              )}
            </a>

            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsNotificationsOpen(true);
              }}
              className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between text-left"
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#a0522d] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} Unread
                </span>
              )}
            </button>

            <button 
              onClick={() => handleProfileItemClick('profile')}
              className="text-base font-semibold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between text-left"
            >
              <span>My Profile</span>
              <span>➔</span>
            </button>

            <button 
              onClick={() => handleProfileItemClick('addresses')}
              className="text-base font-semibold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between text-left"
            >
              <span>Saved Addresses</span>
              <span>➔</span>
            </button>

            <button 
              onClick={() => handleProfileItemClick('subscriptions')}
              className="text-base font-semibold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between text-left"
            >
              <span>Subscriptions</span>
              <span>➔</span>
            </button>

            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (onLogout) onLogout();
              }}
              className="text-base font-bold py-3 text-red-600 flex items-center justify-between text-left mt-2"
            >
              <span>Logout</span>
              <span>➔</span>
            </button>

          </div>
        </div>
      )}
    </>
  );
}
