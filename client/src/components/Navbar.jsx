import React, { useState, useEffect, useRef } from 'react';

export default function Navbar({ 
  onOpenBecomeProviderModal, 
  onOpenBecomeDeliveryPartnerModal, 
  onOpenLogin, 
  onOpenTrackingModal,
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
  const lastScrollY = useRef(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  }, [currentView]);

  const roleLabel = currentUser ? (
    currentUser.role === 'provider' ? 'Provider' : (currentUser.role === 'delivery' || currentUser.role === 'deliverer' ? 'Deliverer' : (currentUser.role === 'admin' ? 'Admin' : 'Diner'))
  ) : '';

  const userInitial = currentUser ? (
    currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.email[0].toUpperCase()
  ) : 'U';

  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { label: 'For Diners', href: '#', id: 'home' },
        { label: 'For Providers', href: '#provider', id: 'provider' },
        { label: 'For Deliverers', href: '#delivery', id: 'delivery' },
        { label: 'Super Admin', href: '#/admin', id: 'admin' }
      ];
    }

    const role = (currentUser.role || 'customer').toLowerCase();

    if (role === 'admin') {
      return [
        { label: 'Super Admin', href: '#/admin', id: 'admin' },
        { label: 'Diner Portal', href: '#', id: 'home' },
        { label: 'Providers', href: '#/admin/providers/all', id: 'admin-providers' },
        { label: 'Customers', href: '#/admin/customers/all', id: 'admin-customers' },
        { label: 'Orders', href: '#/admin/orders/all', id: 'admin-orders' }
      ];
    }

    if (role === 'provider') {
      return [
        { label: 'Dashboard', href: '#provider', id: 'provider' },
        { label: 'My Tiffins', href: '#my-tiffins', id: 'my-tiffins' },
        { label: 'Orders', href: '#provider-orders', id: 'provider-orders' },
        { label: 'Earnings', href: '#provider-earnings', id: 'provider-earnings' }
      ];
    }

    if (role === 'delivery' || role === 'deliverer') {
      return [
        { label: 'Dashboard', href: '#delivery', id: 'delivery' },
        { label: 'My Deliveries', href: '#my-deliveries', id: 'my-deliveries' },
        { label: 'Earnings', href: '#delivery-earnings', id: 'delivery-earnings' }
      ];
    }

    // Default for Diner / Customer
    return [
      { label: 'Home', href: '#', id: 'home' },
      { label: 'Order Tiffin', href: '#find-tiffin', id: 'find-tiffin' },
      { label: 'My Orders', href: '#orders', id: 'orders' }
    ];
  };

  const navLinks = getNavLinks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on view change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  const isLightPage = currentView !== 'home' && currentView !== 'provider' && currentView !== 'delivery';
  const isHashLight = typeof window !== 'undefined' && (
    window.location.hash.includes('find-tiffin') || 
    window.location.hash.includes('order-tiffin') || 
    window.location.hash.includes('orders')
  );
  const showSolidNav = isScrolled || forceSolid || isMobileMenuOpen || isLightPage || isHashLight;

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 px-4 sm:px-6 md:px-margin-desktop py-4 md:py-5 flex justify-between items-center transition-all duration-500 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          showSolidNav
            ? 'bg-[#fbf9f5]/95 backdrop-blur-md text-[#1a1a1a] shadow-sm border-b border-[#ded9d1]' 
            : 'bg-transparent text-bone-white'
        }`}
      >
        <a 
          className={`font-headline-md text-2xl md:text-headline-md tracking-tighter ${
            showSolidNav ? 'text-[#1a1a1a]' : 'text-bone-white'
          }`} 
          href="#" 
          onClick={isFormOpen ? onCloseForm : () => setIsMobileMenuOpen(false)}
        >
          TiffinLink
        </a>
        <div className="hidden md:flex space-x-12">
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
        <div className="flex items-center gap-3 md:gap-6">
          {/* Show Track Order button ONLY for authenticated Diner/Customer who has an active delivery order */}
          {currentUser && (currentUser.role !== 'provider' && currentUser.role !== 'delivery') && hasActiveOrder && onOpenTrackingModal && (
            <button 
              onClick={onOpenTrackingModal}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                showSolidNav 
                  ? 'bg-[#0A8B5F] text-white hover:bg-[#08734e]' 
                  : 'bg-[#0A8B5F] hover:bg-[#08734e] text-white border border-emerald-400/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>📍 Track Order</span>
            </button>
          )}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-all duration-300 ${
                  showSolidNav
                    ? 'border-[#1a1a1a]/30 bg-black/5 hover:bg-black/10 text-[#1a1a1a]' 
                    : 'border-white/30 bg-white/10 hover:bg-white/20 text-bone-white'
                }`}
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-clay-earth text-bone-white font-bold flex items-center justify-center text-xs md:text-sm shadow">
                  {userInitial}
                </div>
                <div className="text-left hidden sm:block">
                  <p className={`text-xs font-bold leading-none ${showSolidNav ? 'text-[#1a1a1a]' : 'text-bone-white'}`}>
                    {currentUser.name || currentUser.email.split('@')[0]}
                  </p>
                  <p className={`text-[10px] leading-none mt-1 uppercase tracking-wider ${showSolidNav ? 'text-[#665d52]' : 'opacity-75'}`}>
                    {roleLabel}
                  </p>
                </div>
                <span className={`text-xs ${showSolidNav ? 'text-[#1a1a1a]/60' : 'opacity-60'}`}>▼</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-bone-white border border-clay-earth/20 rounded-xl shadow-2xl p-4 text-onyx-black z-[100] animate-in fade-in slide-in-from-top-2">
                  <div className="pb-3 border-b border-sand-neutral/30 mb-3">
                    <p className="text-xs text-muted-gold font-semibold uppercase tracking-wider">Logged In Account</p>
                    <p className="text-sm font-bold truncate mt-1">{currentUser.name || 'Valued User'}</p>
                    <p className="text-xs text-secondary-dark truncate">{currentUser.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-clay-earth/10 text-clay-earth uppercase">
                      {roleLabel} Access
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {currentUser.role === 'admin' && (
                      <a 
                        href="#/admin" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 font-semibold transition-colors flex items-center justify-between text-onyx-black"
                      >
                        <span className="flex items-center gap-2">
                          <span>🛡️</span>
                          <span>Super Admin Portal</span>
                        </span>
                        <span>➔</span>
                      </a>
                    )}
                    <button 
                      onClick={() => { setIsUserMenuOpen(false); if (onLogout) onLogout(); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-bold transition-colors flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={isFormOpen ? onCloseForm : onOpenLogin}
                className={`font-label-caps text-label-caps relative nav-underline cursor-pointer ${
                  showSolidNav ? 'text-[#1a1a1a]' : 'text-bone-white'
                }`}
              >
                Log in
              </button>
              <button 
                onClick={isFormOpen ? onCloseForm : onOpenLogin}
                className={`font-label-caps text-label-caps relative nav-underline cursor-pointer ${
                  showSolidNav ? 'text-[#1a1a1a]' : 'text-bone-white'
                }`}
              >
                Sign up
              </button>
            </div>
          )}
          <button 
            onClick={isFormOpen ? onCloseForm : (currentView === 'delivery' ? onOpenBecomeDeliveryPartnerModal : onOpenBecomeProviderModal)}
            className={`hidden sm:inline-block px-5 md:px-8 py-2.5 md:py-3 text-xs md:text-sm font-button-text transition-all duration-500 scale-100 active:scale-95 hover:tracking-widest magnetic ${
              showSolidNav
                ? 'bg-onyx-black text-bone-white hover:bg-clay-earth' 
                : 'bg-bone-white text-onyx-black hover:bg-clay-earth hover:text-bone-white'
            }`}
          >
            {isFormOpen ? 'Close Form' : (currentView === 'provider' ? 'Become a Provider' : currentView === 'delivery' ? 'Become a Partner' : 'Join the Table')}
          </button>

          {/* Mobile Hamburger Menu Trigger */}
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Off-Canvas Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[60px] bg-bone-white text-onyx-black z-40 md:hidden flex flex-col p-6 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 border-b border-sand-neutral/40 shadow-2xl">
          <div className="flex flex-col space-y-4 pt-2">
            {navLinks.map((link) => {
              const isActive = (currentView === link.id) || (link.id === 'home' && currentView === 'home') || (window.location.hash === link.href);
              return (
                <a 
                  key={link.label}
                  className={`text-lg font-semibold py-2 border-b border-sand-neutral/30 ${
                    isActive && !isFormOpen ? 'text-[#0A8B5F] font-bold' : 'text-onyx-black'
                  }`} 
                  href={link.href}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isFormOpen && onCloseForm) onCloseForm();
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-sand-neutral/40 flex flex-col space-y-3">
            {currentUser && (currentUser.role !== 'provider' && currentUser.role !== 'delivery') && hasActiveOrder && onOpenTrackingModal && (
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onOpenTrackingModal(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0A8B5F] text-white font-bold text-sm shadow cursor-pointer active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>📍 Track Active Order</span>
              </button>
            )}

            {!currentUser && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); onOpenLogin(); }}
                  className="w-full py-3 px-4 rounded-xl border border-onyx-black text-onyx-black font-bold text-sm text-center"
                >
                  Log in
                </button>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); onOpenLogin(); }}
                  className="w-full py-3 px-4 rounded-xl bg-onyx-black text-bone-white font-bold text-sm text-center"
                >
                  Sign up
                </button>
              </div>
            )}

            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (isFormOpen && onCloseForm) onCloseForm();
                else if (currentView === 'delivery') onOpenBecomeDeliveryPartnerModal();
                else onOpenBecomeProviderModal();
              }}
              className="w-full py-3 px-4 rounded-xl bg-clay-earth text-bone-white font-bold text-sm text-center shadow"
            >
              {isFormOpen ? 'Close Form' : (currentView === 'provider' ? 'Become a Provider' : currentView === 'delivery' ? 'Become a Partner' : 'Join the Table')}
            </button>

            {currentUser && (
              <button 
                onClick={() => { setIsMobileMenuOpen(false); if (onLogout) onLogout(); }}
                className="w-full py-2.5 text-center text-red-600 font-bold text-sm hover:underline mt-2"
              >
                Sign Out ({currentUser.name || currentUser.email})
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
