import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import PlatformOverviewTab from './PlatformOverviewTab';
import ProvidersManagementTab from './ProvidersManagementTab';
import Provider360View from './Provider360View';
import DriversManagementTab from './DriversManagementTab';
import Driver360View from './Driver360View';
import CustomersManagementTab from './CustomersManagementTab';
import OrdersManagementTab from './OrdersManagementTab';
import LiveOperationsTab from './LiveOperationsTab';
import FinanceSettlementsTab from './FinanceSettlementsTab';
import AuditLogsTab from './AuditLogsTab';
import ProviderLiveOrdersTab from './ProviderLiveOrdersTab';
import ProviderProfilesTab from './ProviderProfilesTab';
import ProviderOrderHistoryTab from './ProviderOrderHistoryTab';
import ProviderPerformanceTab from './ProviderPerformanceTab';
import DeliveryPartnersRegistryTab from './DeliveryPartnersRegistryTab';
import DispatchEngineTab from './DispatchEngineTab';
import ActiveDeliveriesTab from './ActiveDeliveriesTab';
import LiveFleetGpsTab from './LiveFleetGpsTab';
import PendingKycTab from './PendingKycTab';
import OfflineTelemetryTab from './OfflineTelemetryTab';
import ActivePartnersTab from './ActivePartnersTab';
import DriverHistoryAuditsTab from './DriverHistoryAuditsTab';
import FleetAnalyticsTab from './FleetAnalyticsTab';

import { Search, Bell, Menu, Radio, ShieldCheck, CheckCircle2 } from 'lucide-react';

const getAdminTabFromHash = (rawHash) => {
  const hash = (rawHash || (typeof window !== 'undefined' ? window.location.hash : '') || '').toLowerCase().trim();
  if (hash.includes('provider-live-orders') || hash.includes('providers/live-orders') || hash.includes('providers/orders')) return 'providers-orders';
  if (hash.includes('provider-profiles') || hash.includes('providers/profiles')) return 'providers-profiles';
  if (hash.includes('provider-order-history') || hash.includes('providers/history')) return 'providers-history';
  if (hash.includes('provider-performance') || hash.includes('providers/performance')) return 'providers-performance';
  if (hash.includes('provider-earnings') || hash.includes('providers/settlements')) return 'providers-settlements';
  if (hash.includes('provider-activity-logs') || hash.includes('providers/logs')) return 'providers-logs';
  if (hash.includes('/admin/providers')) {
    const parts = hash.split('/admin/providers');
    const sub = parts[1]?.replace(/^\//, '');
    if (sub) return `providers-${sub}`;
    return 'providers-all';
  }
  if (hash.includes('all-delivery-partners')) return 'drivers-all';
  if (hash.includes('live-fleet-gps-command') || hash.includes('drivers/live') || hash.includes('live-fleet')) return 'drivers-live';
  if (hash.includes('delivery-requests-dispatch') || hash.includes('dispatch-engine') || hash.includes('drivers/requests')) return 'drivers-requests';
  if (hash.includes('active-deliveries') || hash.includes('in-flight-active') || hash.includes('drivers/active-deliveries')) return 'drivers-active-deliveries';
  if (hash.includes('pending-kyc') || hash.includes('pending-verification') || hash.includes('verify-drivers')) return 'drivers-pending';
  if (hash.includes('offline-telemetry') || hash.includes('drivers/offline')) return 'drivers-offline';
  if (hash.includes('active-partners') || hash.includes('drivers/active')) return 'drivers-active';
  if (hash.includes('history-and-audits') || hash.includes('drivers-history') || hash.includes('drivers/history') || hash.includes('audit-ledger')) return 'drivers-history';
  if (hash.includes('fleet-analytics') || hash.includes('drivers-performance') || hash.includes('drivers/performance') || hash.includes('drivers/analytics')) return 'drivers-performance';
  if (hash.includes('/admin/drivers')) {
    const parts = hash.split('/admin/drivers');
    const sub = parts[1]?.replace(/^\//, '');
    if (sub) return `drivers-${sub}`;
    return 'drivers-all';
  }
  if (hash.includes('/admin/customers')) {
    const parts = hash.split('/admin/customers');
    const sub = parts[1]?.replace(/^\//, '');
    if (sub) return `customers-${sub}`;
    return 'customers-all';
  }
  if (hash.includes('/admin/orders')) {
    const parts = hash.split('/admin/orders');
    const sub = parts[1]?.replace(/^\//, '');
    if (sub) return `orders-${sub}`;
    return 'orders-all';
  }
  if (hash.includes('/admin/live-operations') || hash.includes('/admin/operations')) return 'live-operations';
  if (hash.includes('/admin/verify-providers')) return 'providers-pending';
  if (hash.includes('/admin/verify-drivers')) return 'drivers-pending';
  if (hash.includes('/admin/finance')) return 'finance-payments';
  if (hash.includes('/admin/settlements')) return 'settlements';
  if (hash.includes('/admin/audit-logs')) return 'audit-logs';
  if (hash.includes('/admin/settings')) return 'system-settings';
  return 'dashboard';
};

const getHashFromAdminTab = (tab) => {
  if (tab.startsWith('providers-')) {
    const sub = tab.replace('providers-', '');
    return `#/admin/providers/${sub}`;
  }
  if (tab.startsWith('drivers-')) {
    const sub = tab.replace('drivers-', '');
    return `#/admin/drivers/${sub}`;
  }
  if (tab.startsWith('customers-')) {
    const sub = tab.replace('customers-', '');
    return `#/admin/customers/${sub}`;
  }
  if (tab.startsWith('orders-')) {
    const sub = tab.replace('orders-', '');
    return `#/admin/orders/${sub}`;
  }
  switch (tab) {
    case 'dashboard': return '#/admin/dashboard';
    case 'providers': return '#/admin/providers/all';
    case 'drivers': return '#/admin/drivers/all';
    case 'customers': return '#/admin/customers/all';
    case 'orders': return '#/admin/orders/all';
    case 'live-operations': return '#/admin/live-operations';
    case 'verify-providers': return '#/admin/providers/pending';
    case 'verify-drivers': return '#/admin/drivers/pending';
    case 'finance-payments': return '#/admin/finance';
    case 'settlements': return '#/admin/settlements';
    case 'audit-logs': return '#/admin/audit-logs';
    case 'system-settings': return '#/admin/settings';
    default: return '#/admin/dashboard';
  }
};

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTabState] = useState(() => {
    return getAdminTabFromHash(typeof window !== 'undefined' ? window.location.hash : '');
  });

  const setActiveTab = (newTab, updateHash = true) => {
    setActiveTabState(newTab);
    if (updateHash && typeof window !== 'undefined') {
      const targetHash = getHashFromAdminTab(newTab);
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const tabFromHash = getAdminTabFromHash(window.location.hash);
      setActiveTabState(tabFromHash);
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // 360° View Drawer states
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // Global Navbar Search
  const [globalSearch, setGlobalSearch] = useState('');

  const fetchOverviewData = async (rangeOption, isSilent = false) => {
    try {
      if (!isSilent) setLoadingOverview(true);
      const url = rangeOption ? `http://localhost:5000/api/admin/overview?range=${encodeURIComponent(rangeOption)}` : 'http://localhost:5000/api/admin/overview';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setOverviewData(json.data);
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    } finally {
      if (!isSilent) setLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    const intervalId = setInterval(() => {
      fetchOverviewData(undefined, true);
    }, 20000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#fbf9f5] text-[#1b1c1a] flex font-sans antialiased selection:bg-[#1b1c1a] selection:text-white">
      {/* Super Admin Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onLogout={onLogout}
        badgeCounts={{
          pendingProviders: overviewData?.kpis?.pendingProviders || 0,
          pendingDrivers: overviewData?.kpis?.pendingDrivers || 0,
          openDisputes: overviewData?.kpis?.openDisputes || 0
        }}
      />

      {/* Main Operating System View Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Top Navbar Header */}
        <header className="h-16 shrink-0 px-6 lg:px-8 bg-[#fbf9f5]/90 border-b border-[#ded9d1]/60 flex items-center justify-between z-30 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden text-[#665d52] hover:text-[#1b1c1a] p-1.5 rounded-lg hover:bg-[#efeeea]"
              >
                <Menu size={20} />
              </button>

              {/* Global Search Input */}
              <div className="relative hidden sm:block w-72 md:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747878]" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search providers, drivers, orders, transactions..."
                  className="w-full bg-[#efeeea] border border-transparent rounded-lg pl-10 pr-12 py-2 text-xs text-[#1b1c1a] placeholder:text-[#444748] focus:outline-none focus:bg-white focus:border-[#1b1c1a] transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#444748] bg-[#eae8e4] px-1.5 py-0.5 rounded border border-[#c4c7c7]">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Diner Website Portal Link */}
              <a
                href="#"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f3ef] border border-[#ded9d1] hover:bg-[#eae8e4] text-[#1a1a1a] font-medium text-xs rounded transition-colors"
                title="Go to main diner website"
              >
                <span>← Diner Website</span>
              </a>

              {/* Telemetry Cluster Status Pill */}
              <div className="hidden lg:flex items-center gap-2 bg-[#efeeea] px-3 py-1.5 rounded">
                <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-wider">Cluster:</span>
                <span className="font-semibold text-xs text-[#1b1c1a]">Ahmedabad Hub</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b1c1a] animate-pulse" />
                <span className="font-mono text-[10px] uppercase text-[#665d52]">WS Live</span>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setActiveTab('audit-logs')}
                className="relative text-[#444748] hover:text-[#1b1c1a] p-2 rounded-lg hover:bg-[#efeeea] transition-colors"
                title="System Notifications & Logs"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-3 border-l border-[#ded9d1]">
                <div className="w-8 h-8 rounded-full bg-[#1b1c1a] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  SA
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-[#1b1c1a] leading-none">Super Admin</p>
                  <p className="font-mono text-[10px] text-[#665d52] uppercase mt-0.5">Clearance L4</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Render Area */}
          <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto bg-[#fbf9f5]">
            {activeTab === 'dashboard' && (
              <PlatformOverviewTab
                data={overviewData}
                loading={loadingOverview}
                onRefresh={fetchOverviewData}
                onNavigate={setActiveTab}
              />
            )}

            {(activeTab === 'providers' || activeTab.startsWith('providers-') || activeTab.startsWith('provider-') || activeTab === 'kyc-verification') && (
              activeTab === 'providers-settlements' || activeTab === 'provider-earnings' ? (
                <FinanceSettlementsTab onNavigate={setActiveTab} />
              ) : activeTab === 'providers-logs' || activeTab === 'provider-activity-logs' ? (
                <AuditLogsTab onNavigate={setActiveTab} />
              ) : activeTab === 'providers-orders' || activeTab === 'provider-live-orders' || activeTab === 'providers-live' ? (
                <ProviderLiveOrdersTab
                  onNavigate={setActiveTab}
                  onOpenProvider360={(pId) => setSelectedProviderId(pId)}
                />
              ) : activeTab === 'providers-history' || activeTab === 'provider-order-history' ? (
                <ProviderOrderHistoryTab onNavigate={setActiveTab} />
              ) : activeTab === 'providers-performance' || activeTab === 'provider-performance' ? (
                <ProviderPerformanceTab onNavigate={setActiveTab} />
              ) : activeTab === 'providers-profiles' || activeTab === 'provider-profiles' ? (
                <ProviderProfilesTab
                  onNavigate={setActiveTab}
                  onOpenProvider360={(pId) => setSelectedProviderId(pId)}
                />
              ) : (
                <ProvidersManagementTab
                  subTab={activeTab}
                  onOpenProvider360={(pId) => setSelectedProviderId(pId)}
                  onNavigate={setActiveTab}
                />
              )
            )}

            {(activeTab === 'drivers' || activeTab.startsWith('drivers-') || activeTab === 'verify-drivers' || activeTab === 'all-delivery-partners' || activeTab === 'live-fleet-gps-command' || activeTab === 'delivery-requests-dispatch' || activeTab === 'active-deliveries' || activeTab === 'pending-kyc' || activeTab === 'offline-telemetry' || activeTab === 'active-partners' || activeTab === 'history-and-audits' || activeTab === 'fleet-analytics') && (
              activeTab === 'drivers-live' || activeTab === 'live-fleet-gps-command' ? (
                <LiveFleetGpsTab
                  onNavigate={setActiveTab}
                  onOpenDriver360={(dId) => setSelectedDriverId(dId)}
                />
              ) : activeTab === 'drivers-requests' || activeTab === 'delivery-requests-dispatch' || activeTab === 'dispatch-engine' ? (
                <DispatchEngineTab onNavigate={setActiveTab} />
              ) : activeTab === 'drivers-active-deliveries' || activeTab === 'active-deliveries' || activeTab === 'in-flight-active' ? (
                <ActiveDeliveriesTab onNavigate={setActiveTab} />
              ) : activeTab === 'drivers-pending' || activeTab === 'pending-kyc' || activeTab === 'pending-kyc-verification' ? (
                <PendingKycTab
                  onNavigate={setActiveTab}
                  onOpenDriver360={(dId) => setSelectedDriverId(dId)}
                />
              ) : activeTab === 'drivers-offline' || activeTab === 'offline-telemetry' ? (
                <OfflineTelemetryTab
                  onNavigate={setActiveTab}
                  onOpenDriver360={(dId) => setSelectedDriverId(dId)}
                />
              ) : activeTab === 'drivers-active' || activeTab === 'active-partners' ? (
                <ActivePartnersTab
                  onNavigate={setActiveTab}
                  onOpenDriver360={(dId) => setSelectedDriverId(dId)}
                />
              ) : activeTab === 'drivers-history' || activeTab === 'history-and-audits' || activeTab === 'partner-history-audits' ? (
                <DriverHistoryAuditsTab onNavigate={setActiveTab} />
              ) : activeTab === 'drivers-performance' || activeTab === 'fleet-analytics' || activeTab === 'partner-fleet-analytics' ? (
                <FleetAnalyticsTab onNavigate={setActiveTab} />
              ) : activeTab === 'drivers-earnings' || activeTab === 'partner-earnings-payouts' ? (
                <FinanceSettlementsTab />
              ) : (
                <DeliveryPartnersRegistryTab
                  onOpenDriver360={(dId) => setSelectedDriverId(dId)}
                  onNavigate={setActiveTab}
                />
              )
            )}

            {(activeTab === 'customers' || activeTab.startsWith('customers-') || activeTab === 'users-roles') && (
              <CustomersManagementTab subTab={activeTab} onNavigate={setActiveTab} />
            )}

            {(activeTab === 'orders' || activeTab.startsWith('orders-') || activeTab === 'delivery-requests') && (
              <OrdersManagementTab subTab={activeTab} />
            )}

            {(activeTab === 'live-operations' || activeTab.startsWith('dispatch-') || activeTab.startsWith('tracking-') || activeTab.includes('delivery')) && (
              <LiveOperationsTab data={overviewData} onNavigate={setActiveTab} />
            )}

            {(activeTab === 'finance-payments' || activeTab.startsWith('finance-') || activeTab === 'settlements' || activeTab === 'provider-earnings' || activeTab === 'driver-earnings' || activeTab === 'transactions' || activeTab === 'withdrawals' || activeTab === 'refunds' || activeTab === 'delivery-pricing') && (
              <FinanceSettlementsTab />
            )}

            {(activeTab.startsWith('analytics') || activeTab.startsWith('reports')) && (
              <PlatformOverviewTab
                data={overviewData}
                loading={loadingOverview}
                onRefresh={fetchOverviewData}
                onNavigate={setActiveTab}
              />
            )}

            {(activeTab === 'audit-logs' || activeTab.startsWith('alerts-') || activeTab.startsWith('platform-') || activeTab.startsWith('notifications') || activeTab.startsWith('health-') || activeTab.startsWith('settings') || activeTab.startsWith('security') || activeTab.startsWith('support')) && (
              <AuditLogsTab />
            )}
          </main>
        </div>

        {/* 360° Profile Modals */}
      {selectedProviderId && (
        <Provider360View
          providerId={selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
          onStatusChange={fetchOverviewData}
        />
      )}

      {selectedDriverId && (
        <Driver360View
          driverId={selectedDriverId}
          onClose={() => setSelectedDriverId(null)}
          onStatusChange={fetchOverviewData}
        />
      )}
    </div>
  );
}
