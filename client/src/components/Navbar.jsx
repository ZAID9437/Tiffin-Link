import React, { useState, useEffect, useRef } from 'react';

export default function Navbar({ 
  onOpenBecomeProviderModal, 
  onOpenBecomeDeliveryPartnerModal, 
  onOpenLogin, 
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
        { label: 'For Deliverers', href: '#delivery', id: 'delivery' }
      ];
    }

    const role = (currentUser.role || 'customer').toLowerCase();

    if (role === 'customer' || role === 'diner') {
      return [
        { label: 'Home', href: '#', id: 'home' },
        { label: 'Explore Tiffins', href: '#explore', id: 'explore' },
        { label: 'My Orders', href: '#orders', id: 'orders' },
        { label: 'Favorites', href: '#favorites', id: 'favorites' },
        { label: 'Cart', href: '#cart', id: 'cart' }
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

    if (role === 'admin') {
      return [
        { label: 'Dashboard', href: '#admin', id: 'admin' },
        { label: 'Users', href: '#admin-users', id: 'admin-users' },
        { label: 'Providers', href: '#admin-providers', id: 'admin-providers' },
        { label: 'Tiffins', href: '#admin-tiffins', id: 'admin-tiffins' },
        { label: 'Orders', href: '#admin-orders', id: 'admin-orders' },
        { label: 'Reports', href: '#admin-reports', id: 'admin-reports' }
      ];
    }

    return [
      { label: 'Home', href: '#', id: 'home' },
      { label: 'Explore Tiffins', href: '#explore', id: 'explore' },
      { label: 'My Orders', href: '#orders', id: 'orders' },
      { label: 'Favorites', href: '#favorites', id: 'favorites' },
      { label: 'Cart', href: '#cart', id: 'cart' }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav 
      className={`fixed top-0 w-full z-50 px-margin-desktop py-6 flex justify-between items-center transition-all duration-500 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled || forceSolid
          ? 'bg-bone-white/95 backdrop-blur-md text-onyx-black shadow-sm border-b border-sand-neutral/20' 
          : 'bg-transparent text-bone-white'
      }`}
    >
      <a className="font-headline-md text-headline-md tracking-tighter" href="#" onClick={isFormOpen ? onCloseForm : undefined}>TiffinLink</a>
      <div className="hidden md:flex space-x-12">
        {navLinks.map((link) => {
          const isActive = (currentView === link.id) || (link.id === 'home' && currentView === 'home') || (window.location.hash === link.href);
          return (
            <a 
              key={link.label}
              className={`font-label-caps text-label-caps relative ${
                isActive && !isFormOpen ? 'border-b border-current pb-1 font-bold pointer-events-none' : 'nav-underline'
              }`} 
              href={link.href}
              onClick={isFormOpen ? onCloseForm : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </div>
      <div className="flex items-center gap-6 md:gap-8">
        {currentUser ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${
                isScrolled || forceSolid 
                  ? 'border-onyx-black/30 bg-black/5 hover:bg-black/10 text-onyx-black' 
                  : 'border-white/30 bg-white/10 hover:bg-white/20 text-bone-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-clay-earth text-bone-white font-bold flex items-center justify-center text-sm shadow">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-none">{currentUser.name || currentUser.email.split('@')[0]}</p>
                <p className="text-[10px] opacity-75 leading-none mt-1 uppercase tracking-wider">{roleLabel}</p>
              </div>
              <span className="text-xs opacity-60">▼</span>
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
              className="font-label-caps text-label-caps relative nav-underline cursor-pointer"
            >
              Log in
            </button>
            <button 
              onClick={isFormOpen ? onCloseForm : onOpenLogin}
              className="font-label-caps text-label-caps relative nav-underline cursor-pointer"
            >
              Sign up
            </button>
          </div>
        )}
        <button 
          onClick={isFormOpen ? onCloseForm : (currentView === 'delivery' ? onOpenBecomeDeliveryPartnerModal : onOpenBecomeProviderModal)}
          className={`px-8 py-3 font-button-text transition-all duration-500 scale-100 active:scale-95 hover:tracking-widest magnetic ${
            isScrolled || forceSolid
              ? 'bg-onyx-black text-bone-white hover:bg-clay-earth' 
              : 'bg-bone-white text-onyx-black hover:bg-clay-earth hover:text-bone-white'
          }`}
        >
          {isFormOpen ? 'Close Form' : (currentView === 'provider' ? 'Become a Provider' : currentView === 'delivery' ? 'Become a Partner' : 'Join the Table')}
        </button>
      </div>
    </nav>
  );
}
