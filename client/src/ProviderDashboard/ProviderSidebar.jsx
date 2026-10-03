import React, { useState, useEffect } from 'react';

/**
 * ProviderSidebar Component
 * Redesigned with hierarchical collapsible accordion dropdowns according to the exact TiffinLink specification:
 * - Dashboard
 * - Live Requests
 * - Orders (All Orders, New Orders, Preparing, Ready, Delivery, Completed, Cancelled)
 * - My Tiffins (All Tiffins, Add Tiffin, Availability)
 * - Delivery Management
 * - Earnings & Payments (Earnings Overview, Transactions, Incentives, Wallet, Bank & Payout)
 * - Performance (Ratings & Reviews)
 * - Notifications
 * - Help & Support
 * - Settings (Account, Notifications, Privacy & Security, App Preferences)
 */
export default function ProviderSidebar({
  activeTab = 'dashboard',
  setActiveTab,
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen,
  badgeCounts = { liveRequests: 4, newOrders: 0, notifications: 3 },
  currentUser,
  isKitchenOnline = true,
  onToggleKitchenOnline,
  onLogout
}) {
  const providerName = currentUser?.name || currentUser?.businessName || 'Xoxo Men';
  const providerId = currentUser?.id || currentUser?._id || 'PROV-XOXO-991';

  // Section Accordion Collapsible States
  const [openSections, setOpenSections] = useState({
    orders: true,
    tiffins: false,
    earnings: false,
    performance: false,
    settings: false
  });

  // Auto-expand accordion if child tab becomes active
  useEffect(() => {
    if (['orders', 'orders-all', 'orders-new', 'orders-preparing', 'orders-ready', 'orders-completed', 'orders-cancelled'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, orders: true }));
    } else if (['tiffins', 'add-tiffin', 'availability', 'categories', 'tiffin-items', 'meal-builder'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, tiffins: true }));
    } else if (['earnings', 'transactions', 'incentives', 'wallet', 'bank-payout'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, earnings: true }));
    } else if (['performance', 'reviews'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, performance: true }));
    } else if (['settings', 'settings-account', 'settings-notifications', 'settings-privacy', 'settings-preferences'].includes(activeTab)) {
      setOpenSections(prev => ({ ...prev, settings: true }));
    }
  }, [activeTab]);

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleNavClick = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const isTabActive = (tabId) => activeTab === tabId;

  const parentClass = (sectionKey, childTabs = []) => {
    const isChildActive = childTabs.includes(activeTab);
    return `flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
      isChildActive
        ? 'bg-surface-container font-semibold text-on-surface'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }`;
  };

  const childClass = (tabId) => `
    flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
      isTabActive(tabId)
        ? 'bg-onyx-black text-bone-white font-bold shadow-2xs'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-medium'
    }
  `;

  const singleClass = (tabId) => `
    flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
      isTabActive(tabId)
        ? 'bg-surface-container font-bold text-on-surface'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }
  `;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-onyx-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Left Sidebar Container */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-72 bg-surface-container-lowest flex flex-col z-50 overflow-y-auto
          border-r border-sand-neutral/50 transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header Branding & Kitchen Status Profile */}
        <div className="p-4 pb-3 border-b border-sand-neutral/30 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-onyx-black flex items-center justify-center text-bone-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">lunch_dining</span>
              </div>
              <div>
                <span className="font-label-caps text-label-caps text-on-surface uppercase block font-bold tracking-wider">
                  TiffinLink
                </span>
                <span className="font-label-caps text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-surface-container text-clay-earth font-semibold">
                  Provider Partner
                </span>
              </div>
            </div>

            {setIsMobileSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden text-secondary hover:text-on-surface p-1 rounded hover:bg-surface-container-low cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-onyx-black ring-4 ring-sand-neutral shrink-0"></div>
              <div className="truncate">
                <div className="font-label-caps text-label-caps font-semibold text-on-surface truncate">
                  {providerName}
                </div>
                <div className="font-label-caps text-[10px] text-secondary truncate">
                  Home Kitchen Provider
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-clay-earth text-[16px] shrink-0" title="Verified Provider">
              verified
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-3 font-body-md text-body-md">
          
          {/* 1. Dashboard */}
          <div>
            <div onClick={() => handleNavClick('dashboard')} className={singleClass('dashboard')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span className="font-button-text text-button-text">Dashboard</span>
              </div>
            </div>
          </div>

          {/* 2. Live Requests */}
          <div>
            <div onClick={() => handleNavClick('requests')} className={singleClass('requests')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">flash_on</span>
                <span className="font-button-text text-button-text">Live Requests</span>
              </div>
              {badgeCounts.liveRequests > 0 && (
                <span className="font-label-caps text-[10px] bg-secondary-container text-on-secondary-fixed-variant px-1.5 py-0.5 rounded font-bold">
                  {badgeCounts.liveRequests}
                </span>
              )}
            </div>
          </div>

          {/* 3. Orders (Collapsible Accordion Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => toggleSection('orders')}
              className={parentClass('orders', ['orders', 'orders-new', 'orders-preparing', 'orders-ready', 'delivery', 'orders-completed', 'orders-cancelled'])}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span className="font-button-text text-button-text font-bold">Orders</span>
              </div>
              <div className="flex items-center gap-1.5">
                {badgeCounts.newOrders > 0 && (
                  <span className="font-label-caps text-[10px] bg-onyx-black text-bone-white px-1.5 py-0.5 rounded font-bold">
                    {badgeCounts.newOrders}
                  </span>
                )}
                <span className="material-symbols-outlined text-[18px] text-secondary transition-transform duration-200" style={{ transform: openSections.orders ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>
            </div>

            {openSections.orders && (
              <div className="border-l-2 border-sand-neutral/50 ml-5 pl-2.5 space-y-1 mt-1 animate-slide-down">
                <div onClick={() => handleNavClick('orders')} className={childClass('orders')}>
                  <span>All Orders</span>
                </div>
                <div onClick={() => handleNavClick('orders-new')} className={childClass('orders-new')}>
                  <span>New Orders</span>
                  {badgeCounts.newOrders > 0 && (
                    <span className="font-label-caps text-[9px] bg-onyx-black text-bone-white px-1 rounded font-bold">
                      {badgeCounts.newOrders}
                    </span>
                  )}
                </div>
                <div onClick={() => handleNavClick('orders-preparing')} className={childClass('orders-preparing')}>
                  <span>Preparing</span>
                </div>
                <div onClick={() => handleNavClick('orders-ready')} className={childClass('orders-ready')}>
                  <span>Ready</span>
                </div>
                <div onClick={() => handleNavClick('delivery')} className={childClass('delivery')}>
                  <span>Delivery</span>
                </div>
                <div onClick={() => handleNavClick('orders-completed')} className={childClass('orders-completed')}>
                  <span>Completed</span>
                </div>
                <div onClick={() => handleNavClick('orders-cancelled')} className={childClass('orders-cancelled')}>
                  <span>Cancelled</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. My Tiffins (Collapsible Accordion Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => toggleSection('tiffins')}
              className={parentClass('tiffins', ['tiffins', 'categories', 'add-tiffin', 'tiffin-items', 'availability'])}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">lunch_dining</span>
                <span className="font-button-text text-button-text font-bold">My Tiffins</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary transition-transform duration-200" style={{ transform: openSections.tiffins ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>

            {openSections.tiffins && (
              <div className="border-l-2 border-sand-neutral/50 ml-5 pl-2.5 space-y-1 mt-1 animate-slide-down">
                <div onClick={() => handleNavClick('tiffins')} className={childClass('tiffins')}>
                  <span>All Tiffins</span>
                </div>
                <div onClick={() => handleNavClick('categories')} className={childClass('categories')}>
                  <span>Tiffin Categories</span>
                </div>
                <div onClick={() => handleNavClick('add-tiffin')} className={childClass('add-tiffin')}>
                  <span>Add Tiffin</span>
                </div>
                <div onClick={() => handleNavClick('tiffin-items')} className={childClass('tiffin-items')}>
                  <span>Tiffin Items</span>
                </div>
                <div onClick={() => handleNavClick('availability')} className={childClass('availability')}>
                  <span>Availability</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Delivery Management */}
          <div>
            <div onClick={() => handleNavClick('delivery-management')} className={singleClass('delivery-management')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">moped</span>
                <span className="font-button-text text-button-text">Delivery Management</span>
              </div>
            </div>
          </div>

          {/* 6. Earnings & Payments (Collapsible Accordion Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => toggleSection('earnings')}
              className={parentClass('earnings', ['earnings', 'transactions', 'incentives', 'wallet', 'bank-payout'])}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="font-button-text text-button-text font-bold">Earnings & Payments</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary transition-transform duration-200" style={{ transform: openSections.earnings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>

            {openSections.earnings && (
              <div className="border-l-2 border-sand-neutral/50 ml-5 pl-2.5 space-y-1 mt-1 animate-slide-down">
                <div onClick={() => handleNavClick('earnings')} className={childClass('earnings')}>
                  <span>Earnings Overview</span>
                </div>
                <div onClick={() => handleNavClick('transactions')} className={childClass('transactions')}>
                  <span>Transactions</span>
                </div>
                <div onClick={() => handleNavClick('incentives')} className={childClass('incentives')}>
                  <span>Incentives</span>
                </div>
                <div onClick={() => handleNavClick('wallet')} className={childClass('wallet')}>
                  <span>Wallet</span>
                </div>
                <div onClick={() => handleNavClick('bank-payout')} className={childClass('bank-payout')}>
                  <span>Bank & Payout</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. Performance (Collapsible Accordion Dropdown) */}
          <div className="space-y-1">
            <div
              onClick={() => toggleSection('performance')}
              className={parentClass('performance', ['performance', 'reviews'])}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span className="font-button-text text-button-text font-bold">Performance</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary transition-transform duration-200" style={{ transform: openSections.performance ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>

            {openSections.performance && (
              <div className="border-l-2 border-sand-neutral/50 ml-5 pl-2.5 space-y-1 mt-1 animate-slide-down">
                <div onClick={() => handleNavClick('performance')} className={childClass('performance')}>
                  <span>Performance</span>
                </div>
                <div onClick={() => handleNavClick('reviews')} className={childClass('reviews')}>
                  <span>Ratings & Reviews</span>
                </div>
              </div>
            )}
          </div>

          {/* 8. Notifications */}
          <div>
            <div onClick={() => handleNavClick('notifications')} className={singleClass('notifications')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                <span className="font-button-text text-button-text">Notifications</span>
              </div>
              {badgeCounts.notifications > 0 && (
                <span className="font-label-caps text-[10px] bg-secondary-container text-on-secondary-fixed-variant px-1.5 py-0.5 rounded font-bold">
                  {badgeCounts.notifications}
                </span>
              )}
            </div>
          </div>

          {/* 9. Help & Support */}
          <div>
            <div onClick={() => handleNavClick('help')} className={singleClass('help')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">help</span>
                <span className="font-button-text text-button-text">Help & Support</span>
              </div>
            </div>
          </div>

          {/* 10. Settings (Collapsible Accordion Dropdown) */}
          <div className="space-y-1 pb-4">
            <div
              onClick={() => toggleSection('settings')}
              className={parentClass('settings', ['settings', 'settings-account', 'settings-notifications', 'settings-privacy', 'settings-preferences'])}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span className="font-button-text text-button-text font-bold">Settings</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary transition-transform duration-200" style={{ transform: openSections.settings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>

            {openSections.settings && (
              <div className="border-l-2 border-sand-neutral/50 ml-5 pl-2.5 space-y-1 mt-1 animate-slide-down">
                <div onClick={() => handleNavClick('settings-account')} className={childClass('settings-account')}>
                  <span>Account</span>
                </div>
                <div onClick={() => handleNavClick('settings-notifications')} className={childClass('settings-notifications')}>
                  <span>Notifications</span>
                </div>
                <div onClick={() => handleNavClick('settings-privacy')} className={childClass('settings-privacy')}>
                  <span>Privacy & Security</span>
                </div>
                <div onClick={() => handleNavClick('settings-preferences')} className={childClass('settings-preferences')}>
                  <span>App Preferences</span>
                </div>
              </div>
            )}
          </div>

        </nav>

        {/* Footer Kitchen Online Toggle Box & Logout */}
        <div className="p-4 border-t border-sand-neutral bg-surface-container-lowest space-y-3 mt-auto sticky bottom-0 shrink-0">
          <div className="p-3 rounded-lg bg-surface-container-low border border-sand-neutral/30">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isKitchenOnline ? 'bg-onyx-black animate-pulse' : 'bg-gray-400'}`}></span>
                <span className="font-label-caps text-[11px] font-bold text-on-surface uppercase">
                  {isKitchenOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleKitchenOnline}
                className="font-label-caps text-[10px] text-secondary hover:text-on-surface underline uppercase tracking-wider font-semibold cursor-pointer"
              >
                {isKitchenOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
            <div className="font-label-caps text-[10px] text-secondary leading-tight flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-on-surface">check_circle</span>
              {isKitchenOnline ? 'Accepting customer orders in real-time' : 'Kitchen currently paused'}
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-2 py-1 font-label-caps text-label-caps font-semibold text-error hover:text-on-error-container transition-colors cursor-pointer w-full"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Log Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
