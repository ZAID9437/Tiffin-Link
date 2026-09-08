import React, { useState } from 'react';

/**
 * DriverSidebar Component
 * Complete Driver Panel Sidebar matching the exact multi-level category layout requested.
 */
export default function DriverSidebar({
  activeTab = 'dashboard',
  setActiveTab,
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen,
  isOnline = true,
  setIsOnline,
  currentUser,
  onLogout,
  counts = { requests: 3, active: 1, notifications: 3 }
}) {
  const driverName = currentUser?.name || 'Rajesh Kumar';
  const driverId = currentUser?.id || currentUser?._id || 'TL-8041';

  // State to track expanded sections for tree hierarchy
  const [expandedGroups, setExpandedGroups] = useState({
    myDeliveries: true,
    profile: true,
    availability: true,
    safety: true,
    settings: true
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleNav = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Driver Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-80 bg-[#FBF9F5] border-r border-[#DED9D1] z-50 
          flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col">
          {/* Header Branding */}
          <div className="p-5 border-b border-[#DED9D1] bg-[#F5F3EF] flex items-center justify-between sticky top-0 z-20">
            <a
              onClick={(e) => { e.preventDefault(); handleNav('dashboard'); }}
              className="block cursor-pointer"
              href="#"
            >
              <span className="font-serif text-xl font-bold text-[#1A1A1A] tracking-tight block">
                TiffinLink
              </span>
              <span className="font-sans uppercase text-[#8C7A6B] tracking-widest block mt-0.5 text-[10px] font-bold">
                Driver Operations Panel
              </span>
            </a>

            {/* Mobile Close Button */}
            {setIsMobileSidebarOpen && (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 text-[#666666] hover:text-[#1A1A1A] rounded-lg hover:bg-[#EBE7DF] transition-colors"
                title="Close Sidebar"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            )}
          </div>

          {/* Navigation Links Tree */}
          <nav className="py-4 px-3 flex flex-col gap-5 text-sm font-sans">
            
            {/* 1. OVERVIEW */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                OVERVIEW
              </div>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('dashboard'); }}
                href="#"
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">dashboard</span>
                  <span>Dashboard</span>
                </div>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('delivery-requests'); }}
                href="#"
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'delivery-requests' || activeTab === 'new-deliveries'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">electric_bolt</span>
                  <span>Delivery Requests</span>
                </div>
                {counts.requests > 0 && (
                  <span className="bg-amber-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {counts.requests}
                  </span>
                )}
              </a>
            </div>

            {/* 2. DELIVERY MANAGEMENT */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                DELIVERY MANAGEMENT
              </div>

              {/* Parent: My Deliveries */}
              <button
                onClick={() => toggleGroup('myDeliveries')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[#1A1A1A] font-semibold hover:bg-[#EBE7DF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">local_shipping</span>
                  <span>My Deliveries</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: expandedGroups.myDeliveries ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>

              {expandedGroups.myDeliveries && (
                <div className="ml-5 border-l-2 border-[#DED9D1] pl-3 py-1 space-y-1">
                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('active-delivery'); }}
                    href="#"
                    className={`flex items-center justify-between px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'active-delivery'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Active Delivery</span>
                    {counts.active > 0 && (
                      <span className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {counts.active}
                      </span>
                    )}
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('upcoming-deliveries'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'upcoming-deliveries'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Upcoming</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('completed-deliveries'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'completed-deliveries'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Completed</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('delivery-history'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'delivery-history' || activeTab === 'history'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Delivery History</span>
                  </a>
                </div>
              )}
            </div>

            {/* 3. NAVIGATION */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                NAVIGATION
              </div>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('live-map'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'live-map'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">map</span>
                <span>Live Map</span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('route-navigation'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'route-navigation'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">alt_route</span>
                <span>Route &amp; Navigation</span>
              </a>
            </div>

            {/* 4. EARNINGS & PAYMENTS */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                EARNINGS &amp; PAYMENTS
              </div>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('earnings-overview'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'earnings-overview' || activeTab === 'earnings'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">payments</span>
                <span>Earnings Overview</span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('transactions'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">receipt_long</span>
                <span>Transactions</span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('incentives-bonuses'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'incentives-bonuses'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">card_giftcard</span>
                <span>Incentives &amp; Bonuses</span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('wallet-withdrawals'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'wallet-withdrawals'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">account_balance_wallet</span>
                <span>Wallet &amp; Withdrawals</span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('bank-payout-details'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'bank-payout-details'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">account_balance</span>
                <span>Bank &amp; Payout Details</span>
              </a>
            </div>

            {/* 5. PERFORMANCE */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                PERFORMANCE
              </div>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('performance'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">insights</span>
                <span>Performance</span>
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('ratings-reviews'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'ratings-reviews'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">star</span>
                <span>Ratings &amp; Reviews</span>
              </a>
            </div>

            {/* 6. ACCOUNT */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                ACCOUNT
              </div>

              {/* Profile Submenu */}
              <button
                onClick={() => toggleGroup('profile')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[#1A1A1A] font-semibold hover:bg-[#EBE7DF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">badge</span>
                  <span>Profile</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: expandedGroups.profile ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>

              {expandedGroups.profile && (
                <div className="ml-5 border-l-2 border-[#DED9D1] pl-3 py-1 space-y-1">
                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('partner-profile'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'partner-profile' || activeTab === 'profile-personal'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Personal Information</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('profile-documents'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'profile-documents'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Documents &amp; KYC</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('profile-vehicle'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'profile-vehicle'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Vehicle</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('profile-bank'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'profile-bank'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Bank Details</span>
                  </a>
                </div>
              )}

              {/* Availability Submenu */}
              <button
                onClick={() => toggleGroup('availability')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[#1A1A1A] font-semibold hover:bg-[#EBE7DF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">edit_calendar</span>
                  <span>Availability</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: expandedGroups.availability ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>

              {expandedGroups.availability && (
                <div className="ml-5 border-l-2 border-[#DED9D1] pl-3 py-1 space-y-1">
                  <a
                    onClick={(e) => { e.preventDefault(); setIsOnline && setIsOnline(!isOnline); }}
                    href="#"
                    className="flex items-center justify-between px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]"
                  >
                    <span>Go Online / Offline</span>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-gray-400'}`}></span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('availability-schedule'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'availability-schedule'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Working Schedule</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('delivery-preferences'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'delivery-preferences'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Delivery Preferences</span>
                  </a>
                </div>
              )}
            </div>

            {/* 7. SAFETY */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                SAFETY
              </div>

              <button
                onClick={() => toggleGroup('safety')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[#1A1A1A] font-semibold hover:bg-[#EBE7DF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px] text-red-600">health_and_safety</span>
                  <span>Safety Center</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: expandedGroups.safety ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>

              {expandedGroups.safety && (
                <div className="ml-5 border-l-2 border-[#DED9D1] pl-3 py-1 space-y-1">
                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('safety-emergency'); }}
                    href="#"
                    className={`flex items-center justify-between px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'safety-emergency'
                        ? 'bg-red-600 text-white font-medium'
                        : 'text-red-600 font-semibold hover:bg-red-50'
                    }`}
                  >
                    <span>Emergency / SOS</span>
                    <span className="material-symbols-outlined text-[14px]">sos</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('safety-guidelines'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'safety-guidelines'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Safety Guidelines</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('safety-report'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'safety-report'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Report an Issue</span>
                  </a>
                </div>
              )}
            </div>

            {/* 8. SUPPORT */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                SUPPORT
              </div>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('notifications'); }}
                href="#"
                className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">notifications</span>
                  <span>Notifications</span>
                </div>
                {counts.notifications > 0 && (
                  <span className="bg-[#1A1A1A] text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {counts.notifications}
                  </span>
                )}
              </a>

              <a
                onClick={(e) => { e.preventDefault(); handleNav('help-support'); }}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'help-support'
                    ? 'bg-[#1A1A1A] text-white font-medium shadow-xs'
                    : 'text-[#444444] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">help</span>
                <span>Help &amp; Support</span>
              </a>
            </div>

            {/* 9. SYSTEM */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                SYSTEM
              </div>

              <button
                onClick={() => toggleGroup('settings')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[#1A1A1A] font-semibold hover:bg-[#EBE7DF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">settings</span>
                  <span>Settings</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: expandedGroups.settings ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>

              {expandedGroups.settings && (
                <div className="ml-5 border-l-2 border-[#DED9D1] pl-3 py-1 space-y-1">
                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('settings-account'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'settings-account' || activeTab === 'settings'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Account Settings</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('settings-notifications'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'settings-notifications'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Notification Preferences</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('settings-privacy'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'settings-privacy'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>Privacy &amp; Security</span>
                  </a>

                  <a
                    onClick={(e) => { e.preventDefault(); handleNav('settings-app'); }}
                    href="#"
                    className={`flex items-center px-3 py-1.5 rounded-md transition-colors text-xs cursor-pointer ${
                      activeTab === 'settings-app'
                        ? 'bg-[#1A1A1A] text-white font-medium'
                        : 'text-[#555555] hover:bg-[#EBE7DF] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>App Preferences</span>
                  </a>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-[#DED9D1] bg-[#F5F3EF] space-y-3 sticky bottom-0 z-20">
          
          {/* Online / Offline Status Toggle Card */}
          <div className="p-3 bg-white border border-[#DED9D1] rounded-lg flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wide text-[#1A1A1A]">
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
                <span className="text-[10px] text-[#666666]">
                  {isOnline ? 'Receiving Deliveries' : 'Shift Paused'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOnline && setIsOnline(!isOnline)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                isOnline
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>

          {/* User Profile & Logout Action */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {driverName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-[#1A1A1A] font-semibold truncate">
                  {driverName}
                </span>
                <span className="text-[10px] font-mono text-[#8C7A6B]">
                  ID: {driverId.substring(0, 10)}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-[#666666] hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            )}
          </div>

        </div>
      </aside>
    </>
  );
}
