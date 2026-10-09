import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, User, MapPin, CreditCard, Utensils, Calendar, 
  Settings, LogOut, CheckCircle2, Truck, Clock, ShieldCheck, 
  ChevronDown, X, ShoppingBag, LogIn
} from 'lucide-react';
import { useCart } from '../context/CartContext';

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
  
  const { totalCount, setIsCartOpen } = useCart();
  const lastScrollY = useRef(0);
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Live notifications feed
  const [notifications, setNotifications] = useState([]);

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

      if (currentScrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Always keep navbar visible on pages with sticky sub-bars (find-tiffin, orders, etc.)
      if (currentView && currentView !== 'home') {
        setIsVisible(true);
      } else {
        if (currentScrollY > lastScrollY.current && currentScrollY > 150) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  useEffect(() => {
    setIsVisible(true);
    setIsScrolled(false);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [currentView]);

  const userRole = (currentUser?.role || '').toLowerCase();
  const isCustomer = currentUser && (userRole === 'customer' || userRole === 'diner' || !userRole);

  const roleLabel = currentUser ? (
    userRole === 'provider' ? 'Provider' : ((userRole === 'delivery' || userRole === 'deliverer' || userRole === 'driver') ? 'Deliverer' : ((userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin') ? 'Admin' : 'Diner'))
  ) : 'Guest';

  const userInitial = currentUser ? (
    currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()
  ) : 'U';

  // Navigation Links: STRICT ROLE-BASED NAVIGATION
  const getNavLinks = () => {
    // 1. BEFORE LOGIN: PUBLIC NAVIGATION ONLY (Requirement 1)
    if (!currentUser) {
      return [
        { label: 'Home', href: '#', id: 'home' },
        { label: 'For Diners', href: '#for-diners', id: 'for-diners' },
        { label: 'For Providers', href: '#for-providers', id: 'for-providers' },
        { label: 'For Deliverers', href: '#for-deliverers', id: 'for-deliverers' },
        { label: 'Super Admin', href: '#admin-login', id: 'admin-login' }
      ];
    }

    // 2. ADMIN ROLE NAVIGATION (Requirement 4)
    if (userRole === 'admin' || userRole === 'superadmin' || userRole === 'super_admin') {
      return [
        { label: 'Super Admin', href: '#admin', id: 'admin' },
        { label: 'Providers', href: '#/admin/providers/all', id: 'admin-providers' },
        { label: 'Customers', href: '#/admin/customers/all', id: 'admin-customers' },
        { label: 'Orders', href: '#/admin/orders/all', id: 'admin-orders' }
      ];
    }

    // 3. PROVIDER ROLE NAVIGATION (Requirement 4)
    if (userRole === 'provider') {
      return [
        { label: 'Dashboard', href: '#provider', id: 'provider' },
        { label: 'My Tiffins', href: '#my-tiffins', id: 'my-tiffins' },
        { label: 'Orders', href: '#provider-orders', id: 'provider-orders' },
        { label: 'Earnings', href: '#provider-earnings', id: 'provider-earnings' }
      ];
    }

    // 4. DELIVERY PARTNER / DRIVER ROLE NAVIGATION (Requirement 4)
    if (userRole === 'delivery' || userRole === 'deliverer' || userRole === 'driver') {
      return [
        { label: 'Dashboard', href: '#delivery', id: 'delivery' },
        { label: 'My Deliveries', href: '#my-deliveries', id: 'my-deliveries' },
        { label: 'Earnings', href: '#delivery-earnings', id: 'delivery-earnings' }
      ];
    }

    // 5. CUSTOMER / DINER ROLE NAVIGATION (Requirement 4)
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
    window.location.hash.includes('my-orders') ||
    window.location.hash.includes('active-orders') ||
    window.location.hash.includes('track-order') ||
    window.location.hash.includes('upcoming-tiffins') ||
    window.location.hash.includes('order-history') ||
    window.location.hash.includes('cancelled-orders')
  );
  const showSolidNav = isScrolled || forceSolid || isMobileMenuOpen || isLightPage || isHashLight;

  const handleProfileItemClick = (tab) => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    if (onOpenProfileModal) {
      onOpenProfileModal(tab);
    } else if (onOpenLogin && !currentUser) {
      onOpenLogin('login');
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-50 h-[72px] px-4 sm:px-6 md:px-margin-desktop flex justify-between items-center transition-all duration-300 ${
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
            href={!currentUser ? '#' : (userRole === 'provider' ? '#provider' : ((userRole === 'delivery' || userRole === 'driver') ? '#delivery' : ((userRole === 'admin' || userRole === 'superadmin') ? '#admin' : '#')))} 
            onClick={isFormOpen ? onCloseForm : () => setIsMobileMenuOpen(false)}
          >
            TiffinLink
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8 lg:space-x-10 items-center">
            {navLinks.map((link) => {
              const isActive = (currentView === link.id) || (link.id === 'home' && currentView === 'home') || (window.location.hash === link.href);
              return (
                <a 
                  key={link.label}
                  className={`font-label-caps text-label-caps relative transition-colors cursor-pointer ${
                    showSolidNav 
                      ? (isActive ? 'text-[#1a1a1a] font-bold border-b-2 border-[#a0522d] pb-1' : 'text-[#4a4238] hover:text-[#1a1a1a]') 
                      : (isActive ? 'text-white font-bold border-b-2 border-white pb-1' : 'text-bone-white/80 hover:text-white')
                  }`} 
                  href={link.href}
                  onClick={(e) => {
                    if (isFormOpen && onCloseForm) onCloseForm();
                    if (link.id === 'admin-login') {
                      e.preventDefault();
                      if (onOpenLogin) onOpenLogin('login', 'admin');
                    }
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right Section: Public Auth Buttons OR Role-specific Authenticated Controls */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {!currentUser ? (
            /* 1. BEFORE LOGIN: Show ONLY Public Actions */
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => onOpenLogin && onOpenLogin('login')}
                className={`px-3.5 py-1.5 rounded-full font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  showSolidNav 
                    ? 'text-[#1a1a1a] hover:bg-black/5' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => onOpenLogin && onOpenLogin('signup')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-xs ${
                  showSolidNav 
                    ? 'bg-[#1a1a1a] hover:bg-[#333] text-white' 
                    : 'bg-[#a0522d] hover:bg-[#854324] text-white'
                }`}
              >
                <LogIn size={14} />
                <span>Join the Table</span>
              </button>
            </div>
          ) : (
            /* 2. POST LOGIN: Role-specific navigation items only */
            <>
              {/* Active Order Quick Track Pill (Customer Only) */}
              {isCustomer && hasActiveOrder && onOpenTrackingModal && (
                <button 
                  onClick={onOpenTrackingModal}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1b5e20] text-white hover:bg-[#144919] transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  <span>📍 Live Track</span>
                </button>
              )}

              {/* 🛒 Desktop Cart Trigger with Badge (Customer Only) */}
              {isCustomer && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className={`p-2 rounded-full transition-all relative cursor-pointer ${
                    showSolidNav 
                      ? 'hover:bg-black/5 text-[#1a1a1a]' 
                      : 'hover:bg-white/10 text-bone-white'
                  }`}
                  aria-label="View Cart"
                  title="View Cart"
                >
                  <ShoppingBag size={20} />
                  {totalCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#a0522d] text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {totalCount}
                    </span>
                  )}
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
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#665d52]">
                          No notifications
                        </div>
                      ) : (
                        notifications.map(notif => (
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
                      )))}
                    </div>

                    {isCustomer && (
                      <div className="pt-3 border-t border-[#ded9d1] mt-2 text-center">
                        <a 
                          href="#orders" 
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-xs font-bold text-[#1a1a1a] hover:underline"
                        >
                          View All Orders in Dispatch Tracker →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 👤 Profile Button / User Dropdown */}
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
                      {currentUser.name || currentUser.email.split('@')[0]}
                    </p>
                    <p className={`text-[9px] leading-none mt-1 uppercase tracking-wider font-semibold ${showSolidNav ? 'text-[#665d52]' : 'opacity-75'}`}>
                      {roleLabel}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`opacity-60 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#fbf9f5] border border-[#ded9d1] rounded-2xl shadow-2xl p-4 text-[#1a1a1a] z-[110] animate-in fade-in slide-in-from-top-2">
                    
                    {/* User Info Header */}
                    <div className="pb-3 border-b border-[#ded9d1] mb-2">
                      <p className="text-[10px] text-[#a0522d] font-bold uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold truncate mt-0.5">{currentUser.name || currentUser.email.split('@')[0]}</p>
                      <p className="text-xs text-[#665d52] truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1b5e20]/10 text-[#1b5e20] uppercase">
                        {userRole === 'admin' || userRole === 'superadmin' ? 'Super Admin' : (userRole === 'provider' ? 'Verified Kitchen' : ((userRole === 'delivery' || userRole === 'driver') ? 'Verified Driver' : 'Verified Diner'))}
                      </span>
                    </div>

                    {/* Profile Links */}
                    <div className="space-y-1 text-xs font-semibold">
                      <button
                        onClick={() => handleProfileItemClick('profile')}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                      >
                        <User size={15} className="text-[#665d52]" />
                        <span>Personal Information</span>
                      </button>

                      {isCustomer && (
                        <>
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
                        </>
                      )}

                      <button
                        onClick={() => handleProfileItemClick('notifications')}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center gap-2.5 text-[#1a1a1a] cursor-pointer transition-colors"
                      >
                        <Settings size={15} className="text-[#665d52]" />
                        <span>Settings</span>
                      </button>
                    </div>

                    {/* Sign Out Action */}
                    <div className="pt-2 border-t border-[#ded9d1] mt-2">
                      <button 
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) onLogout();
                          else if (onOpenLogin) onOpenLogin('login');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-bold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut size={15} />
                          <span>Logout</span>
                        </div>
                        <span>➔</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile Right: Cart Icon (ONLY for logged-in Diner) */}
          {currentUser && isCustomer && (
            <button
              onClick={() => setIsCartOpen(true)}
              className={`md:hidden p-2 rounded-full cursor-pointer relative transition-all ${
                showSolidNav ? 'text-[#1a1a1a] hover:bg-black/5' : 'text-bone-white hover:bg-white/10'
              }`}
              aria-label="Orders Cart"
            >
              <ShoppingBag size={20} />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#a0522d] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Quick Sign In button (when logged out) */}
          {!currentUser && (
            <button
              onClick={() => onOpenLogin && onOpenLogin('login')}
              className={`sm:hidden px-3 py-1.5 rounded-full font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                showSolidNav ? 'bg-[#1a1a1a] text-white' : 'bg-white/20 text-white'
              }`}
            >
              Login
            </button>
          )}

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

      {/* Mobile Off-Canvas Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[72px] bg-[#fbf9f5] text-[#1a1a1a] z-40 md:hidden flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 border-b border-[#ded9d1] shadow-2xl">
          <div className="flex flex-col space-y-2 pt-2">
            
            {!currentUser ? (
              /* Public Mobile Navigation */
              <>
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
                  href="#for-diners"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>For Diners</span>
                  <span>➔</span>
                </a>

                <a 
                  className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between" 
                  href="#for-providers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>For Providers</span>
                  <span>➔</span>
                </a>

                <a 
                  className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between" 
                  href="#for-deliverers"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>For Deliverers</span>
                  <span>➔</span>
                </a>

                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenLogin) onOpenLogin('login', 'admin');
                  }}
                  className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between text-left"
                >
                  <span>Super Admin</span>
                  <span>➔</span>
                </button>

                <div className="pt-4 flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenLogin) onOpenLogin('login');
                    }}
                    className="w-full py-3 rounded-xl border border-[#1a1a1a] text-[#1a1a1a] font-bold text-center"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenLogin) onOpenLogin('signup');
                    }}
                    className="w-full py-3 rounded-xl bg-[#a0522d] text-white font-bold text-center"
                  >
                    Join the Table / Sign Up
                  </button>
                </div>
              </>
            ) : (
              /* Authenticated Role-Specific Mobile Navigation */
              <>
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    className="text-base font-bold py-2.5 border-b border-[#ded9d1]/60 flex items-center justify-between"
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>{link.label}</span>
                    <span>➔</span>
                  </a>
                ))}

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

                {isCustomer && (
                  <>
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
                  </>
                )}

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
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
