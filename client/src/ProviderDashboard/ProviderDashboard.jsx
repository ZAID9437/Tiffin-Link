import React, { useState, useEffect } from 'react';
import ProviderSidebar from './ProviderSidebar';
import DashboardOverviewTab from './DashboardOverviewTab';
import LiveRequestsTab from './LiveRequestsTab';
import MyTiffinsTab from './MyTiffinsTab';
import OrdersTab from './OrdersTab';
import CustomersTab from './CustomersTab';
import SubscriptionsTab from './SubscriptionsTab';
import EarningsTab from './EarningsTab';
import ReviewsTab from './ReviewsTab';
import AnalyticsTab from './AnalyticsTab';
import CapacityTab from './CapacityTab';
import ServiceAreaTab from './ServiceAreaTab';
import ScheduleTab from './ScheduleTab';
import NotificationsTab from './NotificationsTab';
import SettingsTab from './SettingsTab';
import DeliveryManagementTab from './DeliveryManagementTab';
import HelpSupportTab from './HelpSupportTab';

import { apiRequest } from '../services/api';

export default function ProviderDashboard({ currentUser, onLogout, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isKitchenOnline, setIsKitchenOnline] = useState(true);
  const [statusToast, setStatusToast] = useState('');

  // Dynamic Sidebar Badge Counts from MongoDB Database
  const [badgeCounts, setBadgeCounts] = useState({
    liveRequests: 2,
    newOrders: 5,
    notifications: 3
  });

  useEffect(() => {
    const fetchSidebarBadges = async () => {
      try {
        // 1. Fetch live pending requests count from MongoDB
        const reqRes = await apiRequest('/requests');
        const reqJson = await reqRes.json();
        let reqCount = 0;
        if (reqJson.success && Array.isArray(reqJson.data)) {
          reqCount = reqJson.data.filter(r => r.status === 'pending').length;
        }

        // 2. Fetch new orders count from MongoDB
        const ordRes = await apiRequest('/orders');
        const ordJson = await ordRes.json();
        let newCount = 0;
        if (ordJson.success && Array.isArray(ordJson.data)) {
          newCount = ordJson.data.filter(o => o.status === 'New').length;
        }

        // 3. Fetch provider online status from MongoDB
        const dashRes = await apiRequest('/providers/dashboard');
        const dashJson = await dashRes.json();
        if (dashJson.success && dashJson.data && dashJson.data.acceptingOrders !== undefined) {
          setIsKitchenOnline(Boolean(dashJson.data.acceptingOrders));
        }

        setBadgeCounts(prev => ({
          ...prev,
          liveRequests: reqCount || 2,
          newOrders: newCount || 5
        }));
      } catch (err) {
        console.error('Error fetching sidebar badge counts from MongoDB:', err);
      }
    };

    fetchSidebarBadges();
    const interval = setInterval(fetchSidebarBadges, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleKitchenOnline = async () => {
    const nextStatus = !isKitchenOnline;
    setIsKitchenOnline(nextStatus);
    try {
      const json = await apiRequest('/providers/status', {
        method: 'PUT',
        body: JSON.stringify({
          acceptingOrders: nextStatus
        })
      });
      if (json.success) {
        setStatusToast(`✓ Kitchen status updated to ${nextStatus ? 'ONLINE' : 'OFFLINE'}`);
        setTimeout(() => setStatusToast(''), 3500);
      }
    } catch (err) {
      console.error('Error updating status in database:', err);
    }
  };

  const renderActiveTabContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardOverviewTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
        case 'requests':
          return <LiveRequestsTab onNavigateTab={setActiveTab} onAcceptRequest={() => setActiveTab('orders-preparing')} />;
        case 'tiffins':
          return <MyTiffinsTab key="all" initialSubView="all" onNavigateTab={setActiveTab} />;
        case 'add-tiffin':
          return <MyTiffinsTab key="add" initialSubView="add" onNavigateTab={setActiveTab} />;
        case 'availability':
          return <MyTiffinsTab key="availability" initialSubView="availability" onNavigateTab={setActiveTab} />;
        case 'categories':
          return <MyTiffinsTab key="categories" initialSubView="categories" onNavigateTab={setActiveTab} />;
        case 'orders':
        case 'orders-all':
          return <OrdersTab key="all" initialSubView="all" onNavigateTab={setActiveTab} />;
        case 'orders-new':
          return <OrdersTab key="new" initialSubView="new" onNavigateTab={setActiveTab} />;
        case 'orders-preparing':
          return <OrdersTab key="preparing" initialSubView="preparing" onNavigateTab={setActiveTab} />;
        case 'orders-ready':
          return <OrdersTab key="ready" initialSubView="ready" onNavigateTab={setActiveTab} />;
        case 'orders-completed':
          return <OrdersTab key="completed" initialSubView="completed" onNavigateTab={setActiveTab} />;
        case 'orders-cancelled':
          return <OrdersTab key="cancelled" initialSubView="cancelled" onNavigateTab={setActiveTab} />;
        case 'delivery-management':
          return <DeliveryManagementTab onNavigateTab={setActiveTab} />;
        case 'customers':
          return <CustomersTab onNavigateTab={setActiveTab} />;
        case 'subscriptions':
          return <SubscriptionsTab onNavigateTab={setActiveTab} />;
        case 'earnings':
          return <EarningsTab onNavigateTab={setActiveTab} />;
        case 'reviews':
          return <ReviewsTab onNavigateTab={setActiveTab} />;
        case 'analytics':
          return <AnalyticsTab />;
        case 'capacity':
          return <CapacityTab />;
        case 'service-area':
          return <ServiceAreaTab />;
        case 'schedule':
          return <ScheduleTab />;
        case 'notifications':
          return <NotificationsTab onNavigateTab={setActiveTab} />;
        case 'settings':
          return <SettingsTab currentUser={currentUser} onUpdateUser={onUpdateUser} />;
        case 'help':
          return <HelpSupportTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
        default:
          return <DashboardOverviewTab currentUser={currentUser} onNavigateTab={setActiveTab} />;
      }
    } catch (err) {
      console.error('Error rendering active provider tab:', err);
      return (
        <div className="bg-white p-8 rounded-2xl border border-[#e7e3db] shadow-xs space-y-3 text-center">
          <div className="text-sm font-bold text-[#171717]">Tab Content Loading</div>
          <p className="text-xs text-[#726f68]">Please select another tab in the sidebar.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex text-[#171717] font-sans antialiased selection:bg-[#171717] selection:text-white">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#171717] text-white px-4 py-2.5 rounded-sm shadow-lg text-xs font-semibold animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{statusToast}</span>
        </div>
      )}

      {/* Redesigned Sidebar */}
      <ProviderSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        badgeCounts={badgeCounts}
        currentUser={currentUser}
        isKitchenOnline={isKitchenOnline}
        onToggleKitchenOnline={handleToggleKitchenOnline}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden px-8 py-8" data-purpose="dashboard-main-area">
        {renderActiveTabContent()}
      </main>
    </div>
  );
}
