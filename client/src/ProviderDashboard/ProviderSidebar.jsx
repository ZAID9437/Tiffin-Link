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
  badgeCounts = { liveRequests: 2, newOrders: 5, notifications: 3 },
  currentUser,
  isKitchenOnline = true,
  onToggleKitchenOnline,
  onLogout
}) {
  const providerName = currentUser?.name || "Aria's Artisanal Kitchen";
  const providerId = currentUser?.id || currentUser?._id || '5021';
  const initials = providerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AK';

  const [expandedMenus, setExpandedMenus] = useState({
    orders: true,
    tiffins: true
  });

  const toggleSubMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleNavClick = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Left Sidebar Container */}
      <aside
        className={`
          w-72 bg-[#fbf9f5] border-r border-[#e7e3db] flex-shrink-0 flex flex-col h-screen 
          sticky top-0 custom-scrollbar overflow-y-auto z-40 transition-transform duration-300 ease-in-out
          fixed lg:sticky
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
        data-purpose="sidebar"
      >
        {/* Brand Header */}
        <div className="px-6 pt-7 pb-5 border-b border-[#e7e3db]/60 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-black leading-none">
              TiffinLink
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#726f68] mt-1.5 font-sans">
              Provider Partner
            </p>
          </div>
          {setIsMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-[#726f68] hover:text-black p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Provider Profile Card */}
        <div className="px-6 py-4 border-b border-[#e7e3db]/60 bg-[#f7f4ee]/40 font-sans">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#171717] text-white flex items-center justify-center font-serif text-base font-medium shadow-sm shrink-0">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <h4 className="text-xs font-semibold text-[#171717] truncate">{providerName}</h4>
                <span className="text-emerald-700 text-[11px]" title="FSSAI Verified">
                  ✓
                </span>
              </div>
              <p className="text-[10px] text-[#726f68] truncate">Home Kitchen Provider #{providerId}</p>
            </div>
          </div>
        </div>

        {/* Kitchen Status Card */}
        <div className="px-6 py-3.5 border-b border-[#e7e3db]/60 font-sans">
          <div className="bg-white border border-[#e7e3db] rounded-sm p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isKitchenOnline ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  {isKitchenOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleKitchenOnline}
                className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 border border-[#e7e3db] hover:bg-[#f7f4ee] rounded text-[#171717] transition-colors cursor-pointer"
              >
                {isKitchenOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
            <p className="text-[10px] text-[#726f68] mt-1.5 leading-snug">
              {isKitchenOnline ? 'Accepting customer orders in real-time' : 'Kitchen currently paused'}
            </p>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-6 text-xs text-[#524f49] font-sans" data-purpose="sidebar-navigation">
          
          {/* Section 1: OVERVIEW */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Overview
            </p>
            <div className="space-y-0.5">
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
                href="#dashboard"
                className={`flex items-center justify-between px-3 py-2 rounded-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'text-white bg-[#171717]'
                    : 'text-[#171717] hover:bg-[#f2ece1]'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-xs">📊</span>
                  <span className="tracking-wide">Dashboard</span>
                </span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('requests'); }}
                href="#live-requests"
                className={`flex items-center justify-between px-3 py-2 rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'requests'
                    ? 'text-white bg-[#171717] font-medium'
                    : 'text-[#171717] hover:bg-[#f2ece1]'
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-xs">⚡</span>
                  <span>Live Requests</span>
                </span>
                {badgeCounts.liveRequests > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#171717] text-white text-[10px] font-medium rounded-full">
                    {badgeCounts.liveRequests}
                  </span>
                )}
              </a>
            </div>
          </div>

          {/* Section 2: ORDERS MANAGEMENT */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Orders Management
            </p>
            <div className="space-y-0.5">
              <div>
                <div
                  onClick={() => toggleSubMenu('orders')}
                  className="flex items-center justify-between px-3 py-1.5 text-[#171717] font-semibold cursor-pointer hover:bg-[#f2ece1] rounded-sm transition-colors"
                >
                  <span className="flex items-center space-x-2.5">
                    <span className="text-xs">🛍️</span>
                    <span>Orders</span>
                  </span>
                  <span className="text-[10px] text-[#8e8b83]">
                    {expandedMenus.orders ? '▴' : '▾'}
                  </span>
                </div>

                {expandedMenus.orders && (
                  <div className="ml-5 pl-3 border-l border-[#dcd7ce] space-y-1 mt-1 text-[11px]">
                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('orders'); }}
                      href="#all-orders"
                      className={`block py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'orders' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      📋 All Orders
                    </a>

                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('orders-new'); }}
                      href="#new-orders"
                      className={`flex items-center justify-between py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'orders-new' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      <span>📥 New Orders</span>
                      {badgeCounts.newOrders > 0 && (
                        <span className="px-1.5 py-0.2 bg-[#171717] text-white text-[9px] font-medium rounded-full">
                          {badgeCounts.newOrders}
                        </span>
                      )}
                    </a>

                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('orders-preparing'); }}
                      href="#preparing"
                      className={`block py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'orders-preparing' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      🍳 Preparing
                    </a>

                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('orders-ready'); }}
                      href="#ready"
                      className={`block py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'orders-ready' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      🎖️ Ready
                    </a>

                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('delivery-management'); }}
                      href="#delivery-mgmt"
                      className={`block py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'delivery-management' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      🚚 Delivery Management
                    </a>

                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('orders-completed'); }}
                      href="#completed"
                      className={`block py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'orders-completed' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      ✅ Completed
                    </a>

                    <a
                      onClick={(e) => { e.preventDefault(); handleNavClick('orders-cancelled'); }}
                      href="#cancelled"
                      className={`block py-1 px-1.5 rounded-sm transition-colors ${
                        activeTab === 'orders-cancelled' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                      }`}
                    >
                      ❌ Cancelled
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: FOOD & MENU */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Food &amp; Menu
            </p>
            <div>
              <div
                onClick={() => toggleSubMenu('tiffins')}
                className="flex items-center justify-between px-3 py-1.5 text-[#171717] font-medium cursor-pointer hover:bg-[#f2ece1] rounded-sm transition-colors"
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-xs">🍱</span>
                  <span>My Tiffins</span>
                </span>
                <span className="text-[10px] text-[#8e8b83]">
                  {expandedMenus.tiffins ? '▴' : '▾'}
                </span>
              </div>

              {expandedMenus.tiffins && (
                <div className="ml-5 pl-3 border-l border-[#dcd7ce] space-y-1 mt-1 text-[11px]">
                  <a
                    onClick={(e) => { e.preventDefault(); handleNavClick('tiffins'); }}
                    href="#all-tiffins"
                    className={`block py-1 px-1.5 rounded-sm transition-colors ${
                      activeTab === 'tiffins' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                    }`}
                  >
                    📜 All Tiffins
                  </a>
                  <a
                    onClick={(e) => { e.preventDefault(); handleNavClick('add-tiffin'); }}
                    href="#add-tiffin"
                    className={`block py-1 px-1.5 rounded-sm transition-colors ${
                      activeTab === 'add-tiffin' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                    }`}
                  >
                    ➕ Add Tiffin
                  </a>
                  <a
                    onClick={(e) => { e.preventDefault(); handleNavClick('availability'); }}
                    href="#availability"
                    className={`block py-1 px-1.5 rounded-sm transition-colors ${
                      activeTab === 'availability' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                    }`}
                  >
                    📅 Availability
                  </a>
                  <a
                    onClick={(e) => { e.preventDefault(); handleNavClick('categories'); }}
                    href="#categories"
                    className={`block py-1 px-1.5 rounded-sm transition-colors ${
                      activeTab === 'categories' ? 'font-medium text-black bg-[#f0ebdF]/60' : 'text-[#524f49] hover:text-black'
                    }`}
                  >
                    🏷️ Categories
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: CUSTOMERS */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Customers
            </p>
            <div className="space-y-0.5">
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('customers'); }}
                href="#customers"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'customers' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">👥</span>
                <span>Customers</span>
              </a>
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('subscriptions'); }}
                href="#subscriptions"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'subscriptions' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">🔄</span>
                <span>Subscriptions</span>
              </a>
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('reviews'); }}
                href="#reviews"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'reviews' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">⭐</span>
                <span>Reviews &amp; Ratings</span>
              </a>
            </div>
          </div>

          {/* Section 5: BUSINESS & FINANCE */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Business &amp; Finance
            </p>
            <div className="space-y-0.5">
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('earnings'); }}
                href="#earnings"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'earnings' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">💼</span>
                <span>Earnings &amp; Payouts</span>
              </a>
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('analytics'); }}
                href="#analytics"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'analytics' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">📈</span>
                <span>Business Analytics</span>
              </a>
            </div>
          </div>

          {/* Section 6: OPERATIONS */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Operations
            </p>
            <div className="space-y-0.5">
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('capacity'); }}
                href="#capacity"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'capacity' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">🏪</span>
                <span>Kitchen Capacity</span>
              </a>
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('service-area'); }}
                href="#service-area"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'service-area' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">📍</span>
                <span>Service Area</span>
              </a>
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('schedule'); }}
                href="#schedule"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'schedule' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">📅</span>
                <span>Schedule</span>
              </a>
            </div>
          </div>

          {/* Section 7: COMMUNICATION */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              Communication
            </p>
            <div className="space-y-0.5">
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('notifications'); }}
                href="#notifications"
                className={`flex items-center justify-between px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'notifications' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="flex items-center space-x-2.5">
                  <span className="text-xs">🔔</span>
                  <span>Notifications</span>
                </span>
                {badgeCounts.notifications > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#171717] text-white text-[10px] font-medium rounded-full">
                    {badgeCounts.notifications}
                  </span>
                )}
              </a>
            </div>
          </div>

          {/* Section 8: SYSTEM */}
          <div className="pb-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e8b83] mb-1.5">
              System
            </p>
            <div className="space-y-0.5">
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('settings'); }}
                href="#settings"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">⚙️</span>
                <span>Settings</span>
              </a>
              <a
                onClick={(e) => { e.preventDefault(); handleNavClick('help'); }}
                href="#help"
                className={`flex items-center space-x-2.5 px-3 py-1.5 text-[#171717] hover:bg-[#f2ece1] rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'help' ? 'font-bold bg-[#f0ebdF]/60' : ''
                }`}
              >
                <span className="text-xs">❓</span>
                <span>Help &amp; Support</span>
              </a>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center space-x-2.5 px-3 py-1.5 text-rose-800 hover:bg-rose-50 rounded-sm transition-colors text-left cursor-pointer font-medium"
                >
                  <span className="text-xs">🚪</span>
                  <span>Logout Account</span>
                </button>
              )}
            </div>
          </div>

        </nav>
      </aside>
    </>
  );
}
