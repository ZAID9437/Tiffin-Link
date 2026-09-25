import React, { useState } from 'react';

/**
 * ProviderSidebar Component
 * Exact UI Layout, Typography, and Styling matching the TiffinLink Provider Partner Dashboard specification.
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

  const handleNavClick = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  const navClass = (tabId) =>
    activeTab === tabId
      ? 'flex items-center justify-between px-3 py-2 rounded transition-colors bg-surface-container font-semibold text-on-surface cursor-pointer'
      : 'flex items-center justify-between px-3 py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer';

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
        <div className="p-4 pb-3 border-b border-sand-neutral/30 space-y-3">
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
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden text-secondary hover:text-on-surface p-1 rounded hover:bg-surface-container-low"
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
        <nav className="flex-1 px-4 py-3 space-y-4 font-body-md text-body-md">
          
          {/* Section: Overview */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Overview
            </div>
            <a onClick={() => handleNavClick('dashboard')} className={navClass('dashboard')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span className="font-button-text text-button-text">Dashboard</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('requests')} className={navClass('requests')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">flash_on</span>
                <span className="font-button-text text-button-text">Live Requests</span>
              </div>
              {badgeCounts.liveRequests > 0 && (
                <span className="font-label-caps text-[10px] bg-secondary-container text-on-secondary-fixed-variant px-1.5 py-0.5 rounded font-bold">
                  {badgeCounts.liveRequests}
                </span>
              )}
            </a>
          </div>

          {/* Section: Orders */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Orders
            </div>
            <a onClick={() => handleNavClick('orders')} className={navClass('orders')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span className="font-button-text text-button-text">All Orders</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('orders-new')} className={navClass('orders-new')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">notification_important</span>
                <span className="font-button-text text-button-text">New Orders</span>
              </div>
              {badgeCounts.newOrders > 0 && (
                <span className="font-label-caps text-[10px] bg-onyx-black text-bone-white px-1.5 py-0.5 rounded font-bold">
                  {badgeCounts.newOrders}
                </span>
              )}
            </a>
            <a onClick={() => handleNavClick('orders-preparing')} className={navClass('orders-preparing')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">skillet</span>
                <span className="font-button-text text-button-text">Preparing</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('orders-ready')} className={navClass('orders-ready')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                <span className="font-button-text text-button-text">Ready</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('delivery')} className={navClass('delivery')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">moped</span>
                <span className="font-button-text text-button-text">Delivery</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('orders-completed')} className={navClass('orders-completed')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                <span className="font-button-text text-button-text">Completed</span>
              </div>
            </a>
          </div>

          {/* Section: Food */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Food
            </div>
            <a onClick={() => handleNavClick('tiffins')} className={navClass('tiffins')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
                <span className="font-button-text text-button-text">My Tiffins</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('availability')} className={navClass('availability')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">toggle_on</span>
                <span className="font-button-text text-button-text">Availability</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('categories')} className={navClass('categories')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">category</span>
                <span className="font-button-text text-button-text">Categories</span>
              </div>
            </a>
          </div>

          {/* Section: Customers */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Customers
            </div>
            <a onClick={() => handleNavClick('customers')} className={navClass('customers')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span className="font-button-text text-button-text">Customers</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('subscriptions')} className={navClass('subscriptions')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span className="font-button-text text-button-text">Subscriptions</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('reviews')} className={navClass('reviews')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">star</span>
                <span className="font-button-text text-button-text">Reviews</span>
              </div>
            </a>
          </div>

          {/* Section: Business */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Business
            </div>
            <a onClick={() => handleNavClick('earnings')} className={navClass('earnings')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="font-button-text text-button-text">Earnings</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('analytics')} className={navClass('analytics')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span className="font-button-text text-button-text">Analytics</span>
              </div>
            </a>
          </div>

          {/* Section: Operations */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Operations
            </div>
            <a onClick={() => handleNavClick('capacity')} className={navClass('capacity')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">speed</span>
                <span className="font-button-text text-button-text">Kitchen Capacity</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('service-area')} className={navClass('service-area')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                <span className="font-button-text text-button-text">Service Area</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('schedule')} className={navClass('schedule')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                <span className="font-button-text text-button-text">Schedule</span>
              </div>
            </a>
          </div>

          {/* Section: Communication */}
          <div className="space-y-1">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              Communication
            </div>
            <a onClick={() => handleNavClick('notifications')} className={navClass('notifications')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                <span className="font-button-text text-button-text">Notifications</span>
              </div>
              {badgeCounts.notifications > 0 && (
                <span className="font-label-caps text-[10px] bg-secondary-container text-on-secondary-fixed-variant px-1.5 py-0.5 rounded font-bold">
                  {badgeCounts.notifications}
                </span>
              )}
            </a>
          </div>

          {/* Section: System */}
          <div className="space-y-1 pb-4">
            <div className="px-3 font-label-caps text-[10px] uppercase text-secondary tracking-widest mb-1.5 font-bold">
              System
            </div>
            <a onClick={() => handleNavClick('settings')} className={navClass('settings')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span className="font-button-text text-button-text">Settings</span>
              </div>
            </a>
            <a onClick={() => handleNavClick('help')} className={navClass('help')}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px]">help</span>
                <span className="font-button-text text-button-text">Help &amp; Support</span>
              </div>
            </a>
          </div>
        </nav>

        {/* Footer Kitchen Online Toggle Box & Logout */}
        <div className="p-4 border-t border-sand-neutral bg-surface-container-lowest space-y-3 mt-auto sticky bottom-0">
          <div className="p-3 rounded-lg bg-surface-container-low">
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
