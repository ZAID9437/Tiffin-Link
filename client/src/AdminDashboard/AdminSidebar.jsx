import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Radio,
  Store,
  Users,
  Truck,
  Receipt,
  Route,
  Activity,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  ArrowLeftRight,
  RotateCcw,
  BarChart3,
  FileText,
  UserCheck,
  Bell,
  HeartPulse,
  Settings,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';

export default function AdminSidebar({
  activeTab = 'dashboard',
  setActiveTab,
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen,
  onLogout,
  badgeCounts = { pendingProviders: 0, pendingDrivers: 0, openDisputes: 0 }
}) {
  // Collapsible dropdown state for all sections
  const [openSections, setOpenSections] = useState({
    // MANAGEMENT
    providers: true,
    customers: false,
    drivers: false,

    // OPERATIONS
    orders: false,
    dispatch: false,
    tracking: false,
    alerts: false,

    // FINANCE
    transactions: false,
    revenue: false,
    settlements: false,
    refunds: false,

    // ANALYTICS
    analytics: false,
    reports: false,

    // PLATFORM
    userRoles: false,
    notifications: false,
    systemHealth: false,
    settings: false,

    // SECURITY
    security: false,

    // SUPPORT
    support: false
  });

  // Automatically expand parent dropdown if child tab is active
  useEffect(() => {
    if (activeTab === 'providers' || activeTab.startsWith('providers-')) {
      setOpenSections(prev => ({ ...prev, providers: true }));
    } else if (activeTab === 'customers' || activeTab.startsWith('customers-')) {
      setOpenSections(prev => ({ ...prev, customers: true }));
    } else if (activeTab === 'drivers' || activeTab.startsWith('drivers-')) {
      setOpenSections(prev => ({ ...prev, drivers: true }));
    } else if (activeTab === 'orders' || activeTab.startsWith('orders-')) {
      setOpenSections(prev => ({ ...prev, orders: true }));
    } else if (activeTab.startsWith('dispatch-')) {
      setOpenSections(prev => ({ ...prev, dispatch: true }));
    } else if (activeTab.startsWith('tracking-') || activeTab === 'live-operations') {
      setOpenSections(prev => ({ ...prev, tracking: true }));
    } else if (activeTab.startsWith('alerts-')) {
      setOpenSections(prev => ({ ...prev, alerts: true }));
    } else if (activeTab.startsWith('finance-transactions-') || activeTab === 'finance-payments') {
      setOpenSections(prev => ({ ...prev, transactions: true }));
    } else if (activeTab.startsWith('finance-revenue-')) {
      setOpenSections(prev => ({ ...prev, revenue: true }));
    } else if (activeTab.startsWith('finance-settlements-') || activeTab === 'settlements') {
      setOpenSections(prev => ({ ...prev, settlements: true }));
    } else if (activeTab.startsWith('finance-refunds-')) {
      setOpenSections(prev => ({ ...prev, refunds: true }));
    } else if (activeTab.startsWith('analytics-')) {
      setOpenSections(prev => ({ ...prev, analytics: true }));
    } else if (activeTab.startsWith('reports-')) {
      setOpenSections(prev => ({ ...prev, reports: true }));
    } else if (activeTab.startsWith('platform-users-') || activeTab === 'users-roles') {
      setOpenSections(prev => ({ ...prev, userRoles: true }));
    } else if (activeTab.startsWith('notifications-') || activeTab === 'notifications') {
      setOpenSections(prev => ({ ...prev, notifications: true }));
    } else if (activeTab.startsWith('health-')) {
      setOpenSections(prev => ({ ...prev, systemHealth: true }));
    } else if (activeTab.startsWith('settings-') || activeTab === 'system-settings') {
      setOpenSections(prev => ({ ...prev, settings: true }));
    } else if (activeTab.startsWith('security-') || activeTab === 'audit-logs' || activeTab === 'kyc-verification') {
      setOpenSections(prev => ({ ...prev, security: true }));
    } else if (activeTab.startsWith('support-')) {
      setOpenSections(prev => ({ ...prev, support: true }));
    }
  }, [activeTab]);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNav = (tabId) => {
    if (setActiveTab) setActiveTab(tabId);
    if (setIsMobileSidebarOpen) setIsMobileSidebarOpen(false);
  };

  // Complete Menu Data Configuration according to Specification
  const navigationGroups = [
    {
      groupTitle: 'OVERVIEW',
      items: [
        {
          type: 'single',
          id: 'dashboard',
          title: 'Dashboard',
          icon: LayoutDashboard,
          glyph: '▦'
        },
        {
          type: 'single',
          id: 'live-operations',
          title: 'Live Operations',
          icon: Radio,
          glyph: '◉',
          pulse: true
        }
      ]
    },
    {
      groupTitle: 'MANAGEMENT',
      items: [
        {
          type: 'dropdown',
          key: 'providers',
          title: 'Providers',
          icon: Store,
          glyph: '▣',
          defaultTab: 'providers-all',
          badgeText: (badgeCounts?.pendingProviders || 0) > 0 ? `${badgeCounts.pendingProviders}` : null,
          subItems: [
            { id: 'providers-all', label: 'All Providers' },
            { id: 'providers-pending', label: 'Pending Verification', badge: String(badgeCounts?.pendingProviders ?? 0) },
            { id: 'providers-active', label: 'Active Providers' },
            { id: 'providers-suspended', label: 'Suspended Providers' },
            { id: 'providers-profiles', label: 'Profiles & Verification' },
            { id: 'providers-orders', label: 'Live Orders' },
            { id: 'providers-history', label: 'Order History' },
            { id: 'providers-settlements', label: 'Earnings & Settlements' },
            { id: 'providers-performance', label: 'Performance Metrics' },
            { id: 'providers-logs', label: 'Activity Logs' }
          ]
        },
        {
          type: 'dropdown',
          key: 'customers',
          title: 'Customers',
          icon: Users,
          glyph: '♙',
          defaultTab: 'customers-all',
          subItems: [
            { id: 'customers-all', label: 'All Customers' },
            { id: 'customers-profile', label: 'Customer Profile (360°)' },
            { id: 'customers-active', label: 'Active Customers' },
            { id: 'customers-suspended', label: 'Suspended Customers' },
            { id: 'customers-subscriptions', label: 'Subscriptions' },
            { id: 'customers-orders', label: 'Customer Orders' },
            { id: 'customers-history', label: 'Order History' },
            { id: 'customers-activity', label: 'Customer Activity' }
          ]
        },
        {
          type: 'dropdown',
          key: 'drivers',
          title: 'Delivery Partners',
          icon: Truck,
          glyph: '♧',
          defaultTab: 'drivers-all',
          badgeText: (badgeCounts?.pendingDrivers || 0) > 0 ? `${badgeCounts.pendingDrivers}` : null,
          subItems: [
            { id: 'drivers-all', label: 'All Delivery Partners' },
            { id: 'drivers-live', label: 'Live Fleet & GPS' },
            { id: 'drivers-requests', label: 'Dispatch Engine' },
            { id: 'drivers-active-deliveries', label: 'In-Flight Active' },
            { id: 'drivers-pending', label: 'Pending KYC', badge: String(badgeCounts?.pendingDrivers ?? 0) },
            { id: 'drivers-active', label: 'Active Partners' },
            { id: 'drivers-offline', label: 'Offline Telemetry' },
            { id: 'drivers-history', label: 'History & Audits' },
            { id: 'drivers-earnings', label: 'Earnings & Payouts' },
            { id: 'drivers-performance', label: 'Fleet Analytics' }
          ]
        }
      ]
    },
    {
      groupTitle: 'OPERATIONS',
      items: [
        {
          type: 'dropdown',
          key: 'orders',
          title: 'Orders',
          icon: Receipt,
          glyph: '▤',
          defaultTab: 'orders-all',
          subItems: [
            { id: 'orders-all', label: 'All Orders' },
            { id: 'orders-new', label: 'New Orders' },
            { id: 'orders-active', label: 'Active Orders' },
            { id: 'orders-preparing', label: 'Preparing' },
            { id: 'orders-ready', label: 'Ready for Pickup' },
            { id: 'orders-assigned', label: 'Assigned' },
            { id: 'orders-in-transit', label: 'In Transit' },
            { id: 'orders-delivered', label: 'Delivered' },
            { id: 'orders-cancelled', label: 'Cancelled' },
            { id: 'orders-refunded', label: 'Failed / Refunded' }
          ]
        },
        {
          type: 'dropdown',
          key: 'dispatch',
          title: 'Dispatch & Allocation',
          icon: Route,
          glyph: '◎',
          defaultTab: 'dispatch-active',
          subItems: [
            { id: 'dispatch-unassigned', label: 'Unassigned Orders' },
            { id: 'dispatch-driver-requests', label: 'Driver Requests' },
            { id: 'dispatch-active', label: 'Active Dispatch' },
            { id: 'dispatch-auto', label: 'Auto Dispatch' },
            { id: 'dispatch-history', label: 'Dispatch History' }
          ]
        },
        {
          type: 'dropdown',
          key: 'tracking',
          title: 'Live Tracking',
          icon: Activity,
          glyph: '⌁',
          defaultTab: 'tracking-live-map',
          subItems: [
            { id: 'tracking-live-map', label: 'Live Map' },
            { id: 'tracking-active-drivers', label: 'Active Drivers' },
            { id: 'tracking-active-deliveries', label: 'Active Deliveries' },
            { id: 'tracking-provider-locations', label: 'Provider Locations' },
            { id: 'tracking-route-monitoring', label: 'Route Monitoring' }
          ]
        },
        {
          type: 'dropdown',
          key: 'alerts',
          title: 'Operational Alerts',
          icon: AlertTriangle,
          glyph: '⚠',
          defaultTab: 'alerts-active',
          subItems: [
            { id: 'alerts-active', label: 'Active Alerts' },
            { id: 'alerts-delays', label: 'Delivery Delays' },
            { id: 'alerts-providers', label: 'Provider Issues' },
            { id: 'alerts-drivers', label: 'Driver Issues' },
            { id: 'alerts-exceptions', label: 'System Exceptions' }
          ]
        }
      ]
    },
    {
      groupTitle: 'FINANCE',
      items: [
        {
          type: 'dropdown',
          key: 'transactions',
          title: 'Payments & Transactions',
          icon: CreditCard,
          glyph: '₹',
          defaultTab: 'finance-transactions-all',
          subItems: [
            { id: 'finance-transactions-all', label: 'All Transactions' },
            { id: 'finance-transactions-success', label: 'Successful' },
            { id: 'finance-transactions-pending', label: 'Pending' },
            { id: 'finance-transactions-failed', label: 'Failed' },
            { id: 'finance-transactions-refunded', label: 'Refunded' }
          ]
        },
        {
          type: 'dropdown',
          key: 'revenue',
          title: 'Revenue & Earnings',
          icon: TrendingUp,
          glyph: '₹',
          defaultTab: 'finance-revenue-platform',
          subItems: [
            { id: 'finance-revenue-platform', label: 'Platform Revenue' },
            { id: 'finance-revenue-provider', label: 'Provider Earnings' },
            { id: 'finance-revenue-delivery', label: 'Delivery Earnings' },
            { id: 'finance-revenue-commissions', label: 'Commissions' },
            { id: 'finance-revenue-reports', label: 'Revenue Reports' }
          ]
        },
        {
          type: 'dropdown',
          key: 'settlements',
          title: 'Settlements',
          icon: ArrowLeftRight,
          glyph: '⇄',
          defaultTab: 'finance-settlements-providers',
          subItems: [
            { id: 'finance-settlements-providers', label: 'Provider Settlements' },
            { id: 'finance-settlements-drivers', label: 'Driver Settlements' },
            { id: 'finance-settlements-pending', label: 'Pending Payouts' },
            { id: 'finance-settlements-completed', label: 'Completed Payouts' },
            { id: 'finance-settlements-history', label: 'Settlement History' }
          ]
        },
        {
          type: 'dropdown',
          key: 'refunds',
          title: 'Refunds & Disputes',
          icon: RotateCcw,
          glyph: '▤',
          defaultTab: 'finance-refunds-requests',
          subItems: [
            { id: 'finance-refunds-requests', label: 'Refund Requests' },
            { id: 'finance-refunds-disputes', label: 'Disputes' },
            { id: 'finance-refunds-chargebacks', label: 'Chargebacks' },
            { id: 'finance-refunds-history', label: 'Resolution History' }
          ]
        }
      ]
    },
    {
      groupTitle: 'ANALYTICS',
      items: [
        {
          type: 'dropdown',
          key: 'analytics',
          title: 'Analytics Dashboard',
          icon: BarChart3,
          glyph: '◒',
          defaultTab: 'analytics-platform',
          subItems: [
            { id: 'analytics-platform', label: 'Platform Analytics' },
            { id: 'analytics-users', label: 'User Analytics' },
            { id: 'analytics-providers', label: 'Provider Analytics' },
            { id: 'analytics-delivery', label: 'Delivery Analytics' },
            { id: 'analytics-orders', label: 'Order Analytics' }
          ]
        },
        {
          type: 'dropdown',
          key: 'reports',
          title: 'Reports',
          icon: FileText,
          glyph: '▥',
          defaultTab: 'reports-orders',
          subItems: [
            { id: 'reports-orders', label: 'Order Reports' },
            { id: 'reports-revenue', label: 'Revenue Reports' },
            { id: 'reports-providers', label: 'Provider Reports' },
            { id: 'reports-delivery', label: 'Delivery Reports' },
            { id: 'reports-customers', label: 'Customer Reports' },
            { id: 'reports-custom', label: 'Custom Reports' }
          ]
        }
      ]
    },
    {
      groupTitle: 'PLATFORM',
      items: [
        {
          type: 'dropdown',
          key: 'userRoles',
          title: 'User & Role Management',
          icon: UserCheck,
          glyph: '♙',
          defaultTab: 'platform-users-admin',
          subItems: [
            { id: 'platform-users-admin', label: 'Admin Users' },
            { id: 'platform-users-roles', label: 'Roles' },
            { id: 'platform-users-permissions', label: 'Permissions' },
            { id: 'platform-users-access', label: 'Access Control' }
          ]
        },
        {
          type: 'dropdown',
          key: 'notifications',
          title: 'Notifications',
          icon: Bell,
          glyph: '◈',
          defaultTab: 'notifications-system',
          subItems: [
            { id: 'notifications-system', label: 'System Notifications' },
            { id: 'notifications-providers', label: 'Provider Notifications' },
            { id: 'notifications-customers', label: 'Customer Notifications' },
            { id: 'notifications-drivers', label: 'Driver Notifications' },
            { id: 'notifications-logs', label: 'Notification Logs' }
          ]
        },
        {
          type: 'dropdown',
          key: 'systemHealth',
          title: 'System Health',
          icon: HeartPulse,
          glyph: '⌁',
          defaultTab: 'health-api',
          subItems: [
            { id: 'health-api', label: 'API Health' },
            { id: 'health-database', label: 'Database' },
            { id: 'health-websocket', label: 'WebSocket' },
            { id: 'health-payments', label: 'Payment Gateway' },
            { id: 'health-notifications', label: 'Notification Services' },
            { id: 'health-logs', label: 'System Logs' }
          ]
        },
        {
          type: 'dropdown',
          key: 'settings',
          title: 'Settings',
          icon: Settings,
          glyph: '⚙',
          defaultTab: 'settings-general',
          subItems: [
            { id: 'settings-general', label: 'General Settings' },
            { id: 'settings-orders', label: 'Order Settings' },
            { id: 'settings-delivery', label: 'Delivery Settings' },
            { id: 'settings-payments', label: 'Payment Settings' },
            { id: 'settings-commissions', label: 'Commission Settings' },
            { id: 'settings-notifications', label: 'Notification Settings' },
            { id: 'settings-security', label: 'Security Settings' }
          ]
        }
      ]
    },
    {
      groupTitle: 'SECURITY',
      items: [
        {
          type: 'dropdown',
          key: 'security',
          title: 'Security Center',
          icon: ShieldAlert,
          glyph: '♙',
          defaultTab: 'security-overview',
          subItems: [
            { id: 'security-overview', label: 'Security Overview' },
            { id: 'security-login-activity', label: 'Login Activity' },
            { id: 'security-audit-logs', label: 'Audit Logs' },
            { id: 'security-suspicious', label: 'Suspicious Activity' },
            { id: 'security-events', label: 'Security Events' }
          ]
        }
      ]
    },
    {
      groupTitle: 'SUPPORT',
      items: [
        {
          type: 'dropdown',
          key: 'support',
          title: 'Support & Complaints',
          icon: HelpCircle,
          glyph: '◉',
          defaultTab: 'support-customers',
          subItems: [
            { id: 'support-customers', label: 'Customer Complaints' },
            { id: 'support-providers', label: 'Provider Complaints' },
            { id: 'support-drivers', label: 'Driver Complaints' },
            { id: 'support-open-tickets', label: 'Open Tickets' },
            { id: 'support-resolved-tickets', label: 'Resolved Tickets' }
          ]
        }
      ]
    }
  ];

  const isDropdownActive = (dropdownItem) => {
    if (activeTab === dropdownItem.key || activeTab === dropdownItem.defaultTab) return true;
    return dropdownItem.subItems?.some(sub => activeTab === sub.id);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen && setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Super Admin Console Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-full bg-[#f5f3ef] text-[#1b1c1a] flex flex-col border-r border-[#ded9d1] shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 lg:static lg:w-72 lg:h-full lg:shrink-0 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="px-6 py-5 border-b border-[#ded9d1] shrink-0 bg-[#f5f3ef]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-serif text-2xl tracking-tight text-[#1a1a1a] font-bold leading-tight">
                TIFFINLINK
              </span>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#665d52] font-bold mt-1">
                SUPER ADMIN CONSOLE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#1a1a1a] text-[#f5f3ef] font-bold">
                ROOT
              </span>
              {setIsMobileSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="lg:hidden text-[#444748] hover:text-[#1b1c1a] ml-1 p-1"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Tree */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-5 text-xs select-none admin-sidebar-scroll">
          {navigationGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 font-mono text-[10px] uppercase tracking-widest text-[#665d52] font-bold mb-1.5 pt-1">
                {group.groupTitle}
              </div>

              {group.items.map((item) => {
                // Single direct navigation link
                if (item.type === 'single') {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#1a1a1a] text-white font-semibold shadow-none'
                          : 'text-[#444748] hover:text-[#1b1c1a] hover:bg-[#ded9d1]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={`shrink-0 ${item.pulse ? 'animate-pulse' : ''}`} />
                        <span className="font-sans text-[13px]">{item.title}</span>
                      </div>
                    </button>
                  );
                }

                // Collapsible accordion dropdown item
                const isOpen = openSections[item.key];
                const isGroupActive = isDropdownActive(item);
                const Icon = item.icon;

                return (
                  <div key={item.key} className="space-y-0.5">
                    {/* Master Dropdown Header */}
                    <button
                      type="button"
                      onClick={() => toggleSection(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                        isGroupActive && !isOpen
                          ? 'bg-[#1a1a1a] text-white font-semibold shadow-none'
                          : isGroupActive && isOpen
                          ? 'text-[#1a1a1a] font-semibold bg-[#ded9d1]/30'
                          : 'text-[#444748] hover:text-[#1b1c1a] hover:bg-[#ded9d1]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          className={`shrink-0 ${isGroupActive && !isOpen ? 'text-white' : 'text-[#1a1a1a]'}`}
                        />
                        <span className={`font-sans text-[13px] truncate ${isGroupActive ? 'font-semibold' : 'font-medium'}`}>
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badgeText && (
                          <span
                            className={`font-mono text-[9px] px-1.5 py-0.2 font-bold ${
                              isGroupActive && !isOpen
                                ? 'bg-white text-black'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {item.badgeText}
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${
                            isGroupActive && !isOpen ? 'text-white' : 'text-[#665d52]'
                          } ${isOpen ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Sub-Items Tree */}
                    {isOpen && (
                      <div className="ml-3 pl-2 border-l border-[#ded9d1] space-y-0.5 py-0.5 animate-fadeIn">
                        {item.subItems.map((sub) => {
                          const isItemActive =
                            activeTab === sub.id ||
                            (sub.id === item.defaultTab && activeTab === item.key);

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleNav(sub.id)}
                              className={`w-full text-left py-1.5 px-2.5 flex items-center justify-between group transition-colors text-xs ${
                                isItemActive
                                  ? 'bg-[#1a1a1a] text-white font-semibold shadow-none'
                                  : 'text-[#444748] hover:text-[#1a1a1a] hover:bg-[#ded9d1]/40'
                              }`}
                            >
                              <div className="flex items-center min-w-0">
                                <span
                                  className={`truncate font-sans text-[12px] ${
                                    isItemActive
                                      ? 'text-white font-semibold'
                                      : 'text-[#374151] group-hover:text-[#111827] font-medium'
                                  }`}
                                >
                                  {sub.label}
                                </span>
                              </div>

                              {sub.badge !== undefined && sub.badge !== null && (
                                <span
                                  className={`font-mono text-[9px] font-bold px-1.5 py-0.2 ml-1 shrink-0 ${
                                    isItemActive
                                      ? 'bg-white text-black'
                                      : Number(sub.badge) > 0
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-[#ded9d1]/60 text-[#665d52] border border-[#ded9d1]'
                                  }`}
                                >
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Admin Profile Card */}
        <div className="p-4 bg-[#efeeea] border-t border-[#ded9d1] shrink-0 mt-auto sticky bottom-0 z-20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#665d52] font-bold">
              ADMIN
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-mono text-[9px] tracking-wider uppercase text-[#1a1a1a] font-semibold">
                ROOT SECURE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-[#f5f3ef] border border-[#ded9d1]">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-[#f5f3ef] font-bold flex items-center justify-center text-xs shrink-0">
              SA
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-xs text-[#1a1a1a] font-bold truncate">
                Super Admin
              </span>
              <span className="font-mono text-[10px] text-[#665d52] truncate">
                admin@tiffinlink.com
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => handleNav('settings-general')}
              className="flex items-center gap-1.5 text-xs text-[#444748] hover:text-[#1a1a1a] font-medium transition-colors"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-[#ba1a1a] hover:text-rose-800 font-semibold transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
