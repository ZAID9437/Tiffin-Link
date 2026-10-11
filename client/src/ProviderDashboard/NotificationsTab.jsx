import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { getSocket, joinProviderRoom } from '../services/socket';

export default function NotificationsTab({ currentUser, onNavigateTab, onUnreadCountChange }) {
  // State
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({
    all: 0,
    unread: 0,
    read: 0,
    orders: 0,
    delivery: 0,
    payments: 0,
    reviews: 0,
    system: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown & Modal States
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Notification Preferences
  const [preferences, setPreferences] = useState({
    newOrder: true,
    orderAccepted: true,
    orderCancelled: true,
    driverAssigned: true,
    deliveryUpdates: true,
    reviews: true,
    payoutUpdate: true,
    audits: true,
    systemMaintenance: false
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Station Information
  const kitchenName = currentUser?.businessName || currentUser?.name || 'Mansuri Kitchen';
  const stationNode = currentUser?._id ? `msr-node-${String(currentUser._id).slice(-4)}` : 'msr-node-04';

  // Show Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch Notifications
  const fetchNotifications = async (isBackground = false) => {
    try {
      if (!isBackground) {
        if (notifications.length === 0) setLoading(true);
        else setRefreshing(true);
      }
      setHasError(false);

      const queryParams = new URLSearchParams({
        search: searchQuery,
        filter: activeFilter,
        sort: sortBy,
        page: currentPage.toString(),
        limit: '10'
      });

      const json = await apiRequest(`/notifications?${queryParams.toString()}`);
      if (json && json.success) {
        setNotifications(Array.isArray(json.notifications) ? json.notifications : []);
        if (json.summary) {
          setSummary(json.summary);
          if (onUnreadCountChange) {
            onUnreadCountChange(json.summary.unread || 0);
          }
        }
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } else {
        throw new Error(json?.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (!isBackground) {
        setHasError(true);
        setErrorMessage(err.message || 'Unable to connect to database');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Preferences
  const fetchPreferences = async () => {
    try {
      const res = await apiRequest('/notifications/preferences');
      if (res && res.success && res.data) {
        setPreferences(prev => ({
          ...prev,
          ...res.data
        }));
      }
    } catch (err) {
      console.warn('Could not load preferences, using defaults:', err);
    }
  };

  // Initial Load & Query Debounce
  useEffect(() => {
    fetchNotifications();
  }, [activeFilter, sortBy, currentPage]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchNotifications();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial Preferences Load
  useEffect(() => {
    fetchPreferences();
  }, []);

  // Socket.IO Real-Time Updates
  useEffect(() => {
    const socket = getSocket();
    const providerId = currentUser?.providerId || currentUser?._id;
    if (providerId) {
      joinProviderRoom(providerId);
    }

    const handleNewNotification = (data) => {
      if (data && data.notification) {
        // Prepend new notification if it matches current filter or filter is all
        setNotifications(prev => {
          if (prev.some(n => n.notificationId === data.notification.notificationId)) {
            return prev;
          }
          return [data.notification, ...prev];
        });
        setSummary(prev => ({
          ...prev,
          all: prev.all + 1,
          unread: prev.unread + 1,
          orders: data.notification.category === 'Orders' ? prev.orders + 1 : prev.orders,
          delivery: data.notification.category === 'Delivery' ? prev.delivery + 1 : prev.delivery,
          reviews: data.notification.category === 'Reviews' ? prev.reviews + 1 : prev.reviews,
          payments: data.notification.category === 'Payments' ? prev.payments + 1 : prev.payments,
          system: data.notification.category === 'System' ? prev.system + 1 : prev.system
        }));
        if (typeof data.unreadCount === 'number' && onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount);
        }
        showToast(`🔔 ${data.notification.title}`);
      }
    };

    const handleCountUpdate = (data) => {
      if (typeof data?.unreadCount === 'number') {
        setSummary(prev => ({ ...prev, unread: data.unreadCount }));
        if (onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount);
        }
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:count:update', handleCountUpdate);

    // Auto-poll in background every 15 seconds to keep database strictly in sync
    const pollInterval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:count:update', handleCountUpdate);
      clearInterval(pollInterval);
    };
  }, [currentUser]);

  // Mark single as read
  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiRequest(`/notifications/${notifId}/read`, { method: 'PUT' });
      if (res && res.success) {
        setNotifications(prev =>
          prev.map(n =>
            (n.notificationId === notifId || n._id === notifId) ? { ...n, read: true } : n
          )
        );
        const newUnread = typeof res.unreadCount === 'number' ? res.unreadCount : Math.max(0, summary.unread - 1);
        setSummary(prev => ({
          ...prev,
          unread: newUnread,
          read: prev.read + 1
        }));
        if (onUnreadCountChange) onUnreadCountChange(newUnread);
        showToast('✓ Notification marked as read');
      }
    } catch (err) {
      console.error('Error marking read:', err);
      showToast('⚠️ Could not update read status');
    }
    setOpenDropdownId(null);
  };

  // Mark single as unread
  const handleMarkAsUnread = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiRequest(`/notifications/${notifId}/unread`, { method: 'PUT' });
      if (res && res.success) {
        setNotifications(prev =>
          prev.map(n =>
            (n.notificationId === notifId || n._id === notifId) ? { ...n, read: false } : n
          )
        );
        const newUnread = typeof res.unreadCount === 'number' ? res.unreadCount : summary.unread + 1;
        setSummary(prev => ({
          ...prev,
          unread: newUnread,
          read: Math.max(0, prev.read - 1)
        }));
        if (onUnreadCountChange) onUnreadCountChange(newUnread);
        showToast('✓ Notification marked as unread');
      }
    } catch (err) {
      console.error('Error marking unread:', err);
      showToast('⚠️ Could not update status');
    }
    setOpenDropdownId(null);
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (summary.unread === 0) return;
    try {
      const res = await apiRequest('/notifications/read-all', { method: 'PUT' });
      if (res && res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setSummary(prev => ({
          ...prev,
          unread: 0,
          read: prev.all
        }));
        if (onUnreadCountChange) onUnreadCountChange(0);
        showToast('All pending notifications marked as read.');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      showToast('⚠️ Could not mark all as read');
    }
  };

  // Soft Delete notification
  const handleDeleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiRequest(`/notifications/${notifId}`, { method: 'DELETE' });
      if (res && res.success) {
        const deletedItem = notifications.find(n => n.notificationId === notifId || n._id === notifId);
        const wasUnread = deletedItem && !deletedItem.read;

        setNotifications(prev =>
          prev.filter(n => n.notificationId !== notifId && n._id !== notifId)
        );
        setSummary(prev => ({
          ...prev,
          all: Math.max(0, prev.all - 1),
          unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread,
          read: !wasUnread ? Math.max(0, prev.read - 1) : prev.read,
          orders: deletedItem?.category === 'Orders' ? Math.max(0, prev.orders - 1) : prev.orders,
          delivery: deletedItem?.category === 'Delivery' ? Math.max(0, prev.delivery - 1) : prev.delivery,
          payments: deletedItem?.category === 'Payments' ? Math.max(0, prev.payments - 1) : prev.payments,
          reviews: deletedItem?.category === 'Reviews' ? Math.max(0, prev.reviews - 1) : prev.reviews,
          system: deletedItem?.category === 'System' ? Math.max(0, prev.system - 1) : prev.system
        }));

        if (wasUnread && onUnreadCountChange) {
          onUnreadCountChange(Math.max(0, summary.unread - 1));
        }
        showToast('Notification removed from alert feed.');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      showToast('⚠️ Could not delete notification');
    }
    setOpenDropdownId(null);
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    try {
      setIsSavingPrefs(true);
      const res = await apiRequest('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences)
      });
      if (res && res.success) {
        showToast('Notification preferences updated and synced to MongoDB.');
        setIsPreferencesOpen(false);
      } else {
        throw new Error(res?.message || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      showToast('⚠️ Could not save preferences to database');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Format relative time helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) {
      const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Yesterday, ${timePart}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Group notifications into Timeline sections: TODAY, YESTERDAY, EARLIER
  const timelineGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };

    notifications.forEach(item => {
      const itemDate = new Date(item.createdAt || Date.now());
      if (itemDate >= today) {
        groups.today.push(item);
      } else if (itemDate >= yesterday) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [notifications]);

  // Contextual Action Button Handler
  const handleItemPrimaryAction = (notif) => {
    const cat = notif.category;
    if (cat === 'Orders') {
      if (onNavigateTab) onNavigateTab('orders');
    } else if (cat === 'Delivery') {
      if (onNavigateTab) onNavigateTab('orders-delivery');
    } else if (cat === 'Reviews') {
      if (onNavigateTab) onNavigateTab('reviews');
    } else if (cat === 'Payments') {
      if (onNavigateTab) onNavigateTab('wallet');
    } else {
      setSelectedNotification(notif);
    }
  };

  // Category Icon & Styling Helper
  const getCategoryDetails = (category) => {
    switch (category) {
      case 'Orders':
        return {
          icon: 'shopping_bag',
          iconBg: 'bg-secondary-container text-onyx-black',
          badgeText: 'PRIORITY 1',
          actionText: 'View Order'
        };
      case 'Delivery':
        return {
          icon: 'local_shipping',
          iconBg: 'bg-surface-container text-onyx-black',
          badgeText: 'TRANSIT TELEMETRY',
          actionText: 'Track Order'
        };
      case 'Reviews':
        return {
          icon: 'grade',
          iconBg: 'bg-surface-container text-onyx-black',
          badgeText: '5.0 ★ VERIFIED MEAL',
          actionText: 'View Review & Reply'
        };
      case 'Payments':
        return {
          icon: 'account_balance_wallet',
          iconBg: 'bg-surface-container text-onyx-black',
          badgeText: 'SETTLED TRANSACTION',
          actionText: 'View Wallet'
        };
      case 'System':
      default:
        return {
          icon: 'verified',
          iconBg: 'bg-surface-container text-onyx-black',
          badgeText: 'STATUTORY RECORD',
          actionText: 'View Certificate'
        };
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 font-body-md text-body-md text-on-surface antialiased">
      <div className="flex flex-col w-full pb-24 max-w-7xl mx-auto">
        
        {/* Top Meta Ribbon */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-sand-neutral/60">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-clay-earth font-label-caps text-label-caps tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-onyx-black inline-block"></span>
              <span>COMMUNICATION CENTER // REAL-TIME ALERT PROTOCOL</span>
              <span className="text-sand-neutral">•</span>
              <span className="font-normal lowercase tracking-normal text-on-surface-variant text-xs">node: {stationNode}</span>
            </div>
            <h1 className="font-headline-lg text-3xl lg:text-5xl text-onyx-black tracking-tight font-normal">
              Notifications
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Stay updated with your kitchen's orders, dispatch transit telemetry, and customer activities across Satellite Hub.
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-mark-all"
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={summary.unread === 0}
              className={`group flex items-center gap-2 px-4 py-2.5 transition-all duration-200 text-onyx-black text-button-text font-button-text cursor-pointer ${
                summary.unread === 0
                  ? 'bg-surface-container/60 opacity-60 cursor-not-allowed'
                  : 'bg-surface-container hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] text-secondary group-hover:text-onyx-black transition-colors">
                done_all
              </span>
              <span>Mark All as Read</span>
            </button>

            <button
              id="btn-open-settings"
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-onyx-black hover:bg-primary-container text-on-primary text-button-text font-button-text transition-all duration-200 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
              <span>Settings</span>
              <span className="text-[10px] tracking-widest uppercase text-tertiary-fixed ml-1">PREFS</span>
            </button>
          </div>
        </div>

        {/* Telemetry KPI Summary Cards (Real MongoDB Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          
          {/* Card 1: Total */}
          <div className="p-6 bg-surface-container-low flex flex-col justify-between transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between mb-4">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                Total Notifications
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">
                notifications_paused
              </span>
            </div>
            <div>
              <div className="font-headline-lg text-4xl lg:text-5xl text-onyx-black leading-none mb-2 font-normal">
                {summary.all}
              </div>
              <div className="font-button-text text-button-text text-on-surface font-medium">
                All received
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-sand-neutral/50 flex items-center justify-between text-xs text-on-surface-variant">
              <span className="truncate">MongoDB synced • Scoped to {kitchenName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            </div>
          </div>

          {/* Card 2: Unread Queue */}
          <div className="p-6 bg-secondary-container/40 flex flex-col justify-between transition-all hover:bg-secondary-container/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-clay-earth/10 rotate-45 translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest">
                Unread Queue
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold bg-clay-earth text-on-secondary uppercase tracking-wider">
                LIVE
              </span>
            </div>
            <div>
              <div className="font-headline-lg text-4xl lg:text-5xl text-onyx-black leading-none mb-2 font-normal flex items-baseline gap-2">
                <span>{summary.unread}</span>
                <span className="font-body-md text-xs text-clay-earth font-normal tracking-normal">
                  pending review
                </span>
              </div>
              <div className="font-button-text text-button-text text-onyx-black font-medium">
                Need immediate attention
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-sand-neutral/60 flex items-center justify-between text-xs text-clay-earth font-medium">
              <span>Requires acknowledgement</span>
              <span className={`w-2 h-2 rounded-full ${summary.unread > 0 ? 'bg-error animate-pulse' : 'bg-gray-400'}`}></span>
            </div>
          </div>

          {/* Card 3: Orders */}
          <div className="p-6 bg-surface-container-low flex flex-col justify-between transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between mb-4">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                Order Alerts
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">
                room_service
              </span>
            </div>
            <div>
              <div className="font-headline-lg text-4xl lg:text-5xl text-onyx-black leading-none mb-2 font-normal">
                {summary.orders}
              </div>
              <div className="font-button-text text-button-text text-on-surface font-medium">
                Order updates
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-sand-neutral/50 flex items-center justify-between text-xs text-on-surface-variant">
              <span>New & preparing tickets</span>
              <span className="font-label-caps text-[10px] text-secondary">ACTIVE TICKETS</span>
            </div>
          </div>

          {/* Card 4: System Alerts */}
          <div className="p-6 bg-surface-container-low flex flex-col justify-between transition-all hover:bg-surface-container">
            <div className="flex items-center justify-between mb-4">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                System Alerts
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">
                verified_user
              </span>
            </div>
            <div>
              <div className="font-headline-lg text-4xl lg:text-5xl text-onyx-black leading-none mb-2 font-normal">
                {summary.system}
              </div>
              <div className="font-button-text text-button-text text-on-surface font-medium">
                Account alerts
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-sand-neutral/50 flex items-center justify-between text-xs text-on-surface-variant">
              <span>FSSAI audit & payout sync</span>
              <span className="material-symbols-outlined text-[14px] text-onyx-black">check_circle</span>
            </div>
          </div>

        </div>

        {/* Search, Filter & Controls Panel */}
        <div className="mt-10 bg-surface-container-low p-4 lg:p-5 flex flex-col gap-4">
          
          {/* Search & Sort Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
                search
              </span>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications by title, message, order ID, batch number..."
                className="w-full bg-surface py-2.5 pl-11 pr-4 font-body-md text-sm text-onyx-black placeholder:text-outline border-b border-sand-neutral focus:border-onyx-black outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 justify-end shrink-0">
              <div className="flex items-center gap-2 bg-surface px-3 py-2 border-b border-sand-neutral">
                <span className="font-label-caps text-[11px] uppercase text-secondary">Sort:</span>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-button-text text-xs text-onyx-black outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priority">Priority First</option>
                </select>
              </div>

              <button
                id="btn-refresh"
                type="button"
                onClick={() => {
                  fetchNotifications();
                  showToast('Refreshed. Latest operational events up to date.');
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-container border-b border-sand-neutral transition-colors text-onyx-black text-button-text text-xs cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[16px] text-secondary ${refreshing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              All ({summary.all})
            </button>

            <button
              type="button"
              onClick={() => { setActiveFilter('unread'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-clay-earth"></span>
              <span>Unread ({summary.unread})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveFilter('read'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'read'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Read ({summary.read})
            </button>

            <span className="text-sand-neutral px-1">|</span>

            <button
              type="button"
              onClick={() => { setActiveFilter('orders'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'orders'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Orders ({summary.orders})
            </button>

            <button
              type="button"
              onClick={() => { setActiveFilter('delivery'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'delivery'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Delivery ({summary.delivery})
            </button>

            <button
              type="button"
              onClick={() => { setActiveFilter('payments'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'payments'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Payments ({summary.payments})
            </button>

            <button
              type="button"
              onClick={() => { setActiveFilter('reviews'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'reviews'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Reviews ({summary.reviews})
            </button>

            <button
              type="button"
              onClick={() => { setActiveFilter('system'); setCurrentPage(1); }}
              className={`filter-btn px-3.5 py-1.5 font-button-text whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === 'system'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              System ({summary.system})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-onyx-black animate-spin">
              progress_activity
            </span>
            <div className="font-button-text text-sm text-secondary">
              Synchronizing real-time provider telemetry...
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && !loading && (
          <div className="mt-8 p-8 bg-error-container/20 border-l-4 border-error flex flex-col gap-3">
            <div className="flex items-center gap-2 text-error font-button-text font-bold">
              <span className="material-symbols-outlined">warning</span>
              <span>Failed to fetch provider notifications</span>
            </div>
            <p className="text-sm text-on-surface-variant">
              {errorMessage || 'There was a connection glitch fetching MongoDB alerts.'}
            </p>
            <button
              type="button"
              onClick={() => fetchNotifications()}
              className="self-start px-4 py-2 bg-onyx-black text-on-primary text-xs font-button-text uppercase tracking-wider mt-2 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasError && notifications.length === 0 && (
          <div className="mt-12 py-16 px-6 bg-surface-container-low flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded-full text-secondary mb-4">
              <span className="material-symbols-outlined text-[32px]">notifications_off</span>
            </div>
            <h3 className="font-headline-md text-xl text-onyx-black mb-1">
              No notifications found
            </h3>
            <p className="text-sm text-on-surface-variant max-w-md mb-6">
              {searchQuery
                ? `No alerts matching "${searchQuery}". Try clearing search keywords.`
                : activeFilter !== 'all'
                ? `No notifications in the "${activeFilter}" category queue.`
                : 'All clear! Your kitchen is up to date and there are no active alerts.'}
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-5 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Notification Feed Stream (Grouped Timeline) */}
        {!loading && !hasError && notifications.length > 0 && (
          <div className="mt-8 flex flex-col gap-10">

            {/* Timeline Section: TODAY */}
            {timelineGroups.today.length > 0 && (
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4 pb-2 border-b border-sand-neutral/80">
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-bold">
                    TODAY
                  </span>
                  <span className="text-xs font-label-caps text-secondary uppercase">
                    {timelineGroups.today.length} event{timelineGroups.today.length > 1 ? 's' : ''} dispatched
                  </span>
                  <div className="h-px bg-sand-neutral flex-1"></div>
                </div>

                <div className="flex flex-col gap-3">
                  {timelineGroups.today.map((item) => (
                    <NotificationItemCard
                      key={item.notificationId || item._id}
                      item={item}
                      onMarkRead={handleMarkAsRead}
                      onMarkUnread={handleMarkAsUnread}
                      onDelete={handleDeleteNotification}
                      onPrimaryAction={handleItemPrimaryAction}
                      onOpenDetails={() => setSelectedNotification(item)}
                      openDropdownId={openDropdownId}
                      setOpenDropdownId={setOpenDropdownId}
                      formatTimeAgo={formatTimeAgo}
                      getCategoryDetails={getCategoryDetails}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Section: YESTERDAY */}
            {timelineGroups.yesterday.length > 0 && (
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4 pb-2 border-b border-sand-neutral/80">
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-bold">
                    YESTERDAY
                  </span>
                  <span className="text-xs font-label-caps text-secondary uppercase">
                    {timelineGroups.yesterday.length} record archive
                  </span>
                  <div className="h-px bg-sand-neutral flex-1"></div>
                </div>

                <div className="flex flex-col gap-3">
                  {timelineGroups.yesterday.map((item) => (
                    <NotificationItemCard
                      key={item.notificationId || item._id}
                      item={item}
                      onMarkRead={handleMarkAsRead}
                      onMarkUnread={handleMarkAsUnread}
                      onDelete={handleDeleteNotification}
                      onPrimaryAction={handleItemPrimaryAction}
                      onOpenDetails={() => setSelectedNotification(item)}
                      openDropdownId={openDropdownId}
                      setOpenDropdownId={setOpenDropdownId}
                      formatTimeAgo={formatTimeAgo}
                      getCategoryDetails={getCategoryDetails}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Section: EARLIER */}
            {timelineGroups.earlier.length > 0 && (
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4 pb-2 border-b border-sand-neutral/80">
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-bold">
                    EARLIER ARCHIVES
                  </span>
                  <span className="text-xs font-label-caps text-secondary uppercase">
                    {timelineGroups.earlier.length} historical event{timelineGroups.earlier.length > 1 ? 's' : ''}
                  </span>
                  <div className="h-px bg-sand-neutral flex-1"></div>
                </div>

                <div className="flex flex-col gap-3">
                  {timelineGroups.earlier.map((item) => (
                    <NotificationItemCard
                      key={item.notificationId || item._id}
                      item={item}
                      onMarkRead={handleMarkAsRead}
                      onMarkUnread={handleMarkAsUnread}
                      onDelete={handleDeleteNotification}
                      onPrimaryAction={handleItemPrimaryAction}
                      onOpenDetails={() => setSelectedNotification(item)}
                      openDropdownId={openDropdownId}
                      setOpenDropdownId={setOpenDropdownId}
                      formatTimeAgo={formatTimeAgo}
                      getCategoryDetails={getCategoryDetails}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Bottom Pagination Bar */}
        {!loading && !hasError && notifications.length > 0 && (
          <div className="mt-12 pt-6 border-t border-sand-neutral/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-label-caps text-xs text-secondary uppercase tracking-wider">
              Showing <span className="text-onyx-black font-semibold">
                {Math.min((currentPage - 1) * pagination.limit + 1, pagination.total)} to {Math.min(currentPage * pagination.limit, pagination.total)}
              </span> of <span className="text-onyx-black font-semibold">{pagination.total}</span> notifications
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`px-3 py-1.5 bg-surface-container text-onyx-black text-xs font-button-text transition-colors ${
                  currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-high cursor-pointer'
                }`}
              >
                Previous
              </button>

              {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-button-text transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-onyx-black text-on-primary'
                          : 'bg-surface hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="px-1 text-xs text-secondary">...</span>;
                }
                return null;
              })}

              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                className={`px-3 py-1.5 bg-surface-container text-onyx-black text-xs font-button-text transition-colors ${
                  currentPage >= pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-high cursor-pointer'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Notification Preferences Modal (Requirement E: High-Fidelity Dialog Overlay) */}
      {isPreferencesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-onyx-black/60 backdrop-blur-sm transition-opacity duration-200 p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border-t-4 border-onyx-black">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-surface-container-low flex items-start justify-between border-b border-sand-neutral/60">
              <div>
                <div className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest mb-1">
                  PROVIDER TELEMETRY SETTINGS
                </div>
                <h2 className="font-headline-md text-2xl md:text-3xl text-onyx-black font-normal">
                  Notification Preferences
                </h2>
                <p className="font-body-md text-sm text-on-surface-variant mt-1">
                  Configure alerts, communication channels, and dispatch telemetry triggers.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close preferences"
                onClick={() => setIsPreferencesOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-surface-container hover:bg-onyx-black hover:text-on-primary transition-colors text-onyx-black cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body (Grouped Categories) */}
            <div className="p-6 md:p-8 flex flex-col gap-8">
              
              {/* Section 1: Order Notifications */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-clay-earth">restaurant</span>
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-bold">
                    1. ORDER NOTIFICATIONS
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-sand-neutral/40 bg-surface-container-low p-4">
                  
                  {/* Row: New Orders */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">New Orders</span>
                      <span className="font-body-md text-xs text-on-surface-variant">Immediate ping on tiffin booking receipt</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, newOrder: !p.newOrder }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.newOrder ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                  {/* Row: Order Accepted */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Order Accepted</span>
                      <span className="font-body-md text-xs text-on-surface-variant">Confirmation when kitchen moves ticket to prepping</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, orderAccepted: !p.orderAccepted }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.orderAccepted ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                  {/* Row: Order Cancelled */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Order Cancelled</span>
                      <span className="font-body-md text-xs text-on-surface-variant">High-priority warning if customer revokes request</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, orderCancelled: !p.orderCancelled }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.orderCancelled ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Section 2: Delivery Notifications */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-clay-earth">local_shipping</span>
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-bold">
                    2. DELIVERY NOTIFICATIONS
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-sand-neutral/40 bg-surface-container-low p-4">
                  
                  {/* Row: Driver Assigned */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Driver Assigned</span>
                      <span className="font-body-md text-xs text-on-surface-variant">Broadcast courier acceptance & vehicle ID</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, driverAssigned: !p.driverAssigned }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.driverAssigned ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                  {/* Row: Delivery Updates */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Delivery Updates (Pickup & In-Transit)</span>
                      <span className="font-body-md text-xs text-on-surface-variant">GPS geo-fence checkpoints & final handover ping</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, deliveryUpdates: !p.deliveryUpdates }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.deliveryUpdates ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Section 3: Business & System Notifications */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-clay-earth">shield</span>
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-bold">
                    3. BUSINESS & SYSTEM NOTIFICATIONS
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-sand-neutral/40 bg-surface-container-low p-4">
                  
                  {/* Row: Reviews */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">New Customer Reviews</span>
                      <span className="font-body-md text-xs text-on-surface-variant">Customer ratings, written comments, and hygiene feedback</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, reviews: !p.reviews }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.reviews ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                  {/* Row: Settlements */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Payment & Escrow Settlements</span>
                      <span className="font-body-md text-xs text-on-surface-variant">Dispatch wallet transfers, bank credits, and fee summaries</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, payoutUpdate: !p.payoutUpdate }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.payoutUpdate ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                  {/* Row: Audits & System */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col pr-4">
                      <span className="font-button-text text-sm text-onyx-black font-medium">System Alerts & Hygiene Audits</span>
                      <span className="font-body-md text-xs text-on-surface-variant">FSSAI inspection reports, renewal notices, maintenance</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences(p => ({ ...p, audits: !p.audits }))}
                      className={`w-11 h-6 p-0.5 flex items-center transition-colors cursor-pointer ${
                        preferences.audits ? 'bg-onyx-black justify-end' : 'bg-sand-neutral justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-bone-white"></span>
                    </button>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 md:p-8 bg-surface-container-low border-t border-sand-neutral/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-label-caps">
                <span className="w-2 h-2 rounded-full bg-clay-earth"></span>
                <span>Synced to MongoDB provider_settings</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  id="btn-cancel-modal"
                  onClick={() => setIsPreferencesOpen(false)}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-container text-onyx-black font-button-text text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-save-modal"
                  disabled={isSavingPrefs}
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 bg-onyx-black hover:bg-primary-container text-on-primary font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>{isSavingPrefs ? 'Saving...' : 'Save Preferences'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Detail / Certificate Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-onyx-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border-t-4 border-onyx-black animate-scale-up">
            
            <div className="p-6 bg-surface-container-low flex items-start justify-between border-b border-sand-neutral/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-container flex items-center justify-center text-onyx-black">
                  <span className="material-symbols-outlined text-[22px]">
                    {getCategoryDetails(selectedNotification.category).icon}
                  </span>
                </div>
                <div>
                  <div className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">
                    {selectedNotification.category} Alert Details
                  </div>
                  <h3 className="font-headline-md text-xl text-onyx-black">
                    {selectedNotification.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-container hover:bg-onyx-black hover:text-on-primary text-onyx-black transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div>
                <span className="font-label-caps text-xs text-secondary uppercase block mb-1">
                  Message Description
                </span>
                <p className="font-body-md text-sm text-onyx-black leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                <div className="bg-surface-container-low p-4 rounded flex flex-col gap-2.5">
                  <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest font-bold">
                    Database Telemetry Metadata
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(selectedNotification.metadata).map(([key, val]) => (
                      <div key={key} className="flex flex-col">
                        <span className="font-label-caps text-secondary uppercase text-[10px]">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-button-text font-semibold text-onyx-black truncate">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-secondary border-t border-sand-neutral/50 pt-4">
                <span>Ref ID: {selectedNotification.notificationId || selectedNotification._id}</span>
                <span>{formatTimeAgo(selectedNotification.createdAt)}</span>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-sand-neutral/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (selectedNotification.read) {
                    handleMarkAsUnread(selectedNotification.notificationId || selectedNotification._id);
                  } else {
                    handleMarkAsRead(selectedNotification.notificationId || selectedNotification._id);
                  }
                  setSelectedNotification(null);
                }}
                className="px-4 py-2 bg-surface hover:bg-surface-container text-onyx-black font-button-text text-xs cursor-pointer"
              >
                {selectedNotification.read ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleItemPrimaryAction(selectedNotification);
                    setSelectedNotification(null);
                  }}
                  className="px-5 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider cursor-pointer"
                >
                  {getCategoryDetails(selectedNotification.category).actionText}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          id="toast"
          className="fixed bottom-8 right-8 z-50 bg-onyx-black text-on-primary px-5 py-3 shadow-xl flex items-center gap-3 transition-all duration-300 animate-slide-up"
        >
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
            check_circle
          </span>
          <span id="toast-text" className="text-xs font-button-text tracking-wide">
            {toastMessage}
          </span>
        </div>
      )}

    </div>
  );
}

// Subcomponent: Individual Notification Card
function NotificationItemCard({
  item,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onPrimaryAction,
  onOpenDetails,
  openDropdownId,
  setOpenDropdownId,
  formatTimeAgo,
  getCategoryDetails
}) {
  const cat = getCategoryDetails(item.category);
  const notifId = item.notificationId || item._id;
  const isDropdownOpen = openDropdownId === notifId;

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setOpenDropdownId(isDropdownOpen ? null : notifId);
  };

  return (
    <article
      data-status={item.read ? 'read' : 'unread'}
      data-type={item.category.toLowerCase()}
      className={`notification-item group relative transition-all duration-150 p-5 lg:p-6 ${
        item.read
          ? 'bg-surface-container-low hover:bg-surface-container opacity-95'
          : 'bg-surface-container-low hover:bg-surface-container'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        
        {/* Left: Icon & Details */}
        <div className="flex items-start gap-4 flex-1">
          <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${cat.iconBg}`}>
            <span className="material-symbols-outlined text-[24px]">
              {cat.icon}
            </span>
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="font-headline-md text-xl lg:text-2xl text-onyx-black font-normal leading-snug">
                {item.title}
              </h2>

              {!item.read ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-secondary-container text-clay-earth text-[11px] font-label-caps font-semibold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-clay-earth"></span>
                  Unread
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 bg-surface-container-high text-secondary text-[11px] font-label-caps uppercase">
                  Read
                </span>
              )}

              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary hidden md:inline">
                {cat.badgeText}
              </span>
            </div>

            <p className="font-body-md text-on-surface text-sm sm:text-base max-w-3xl leading-relaxed">
              {item.message}
            </p>

            {/* Metadata Chips / Subline */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-on-surface-variant font-label-caps">
              {item.metadata?.orderId && (
                <span className="text-onyx-black font-medium">
                  Order: #{item.metadata.orderId}
                </span>
              )}
              {item.metadata?.batch && (
                <span className="text-onyx-black font-medium">
                  {item.metadata.batch}
                </span>
              )}
              {item.metadata?.auditRef && (
                <span className="text-onyx-black font-medium">
                  Audit Ref: {item.metadata.auditRef}
                </span>
              )}

              <span>•</span>

              {item.metadata?.customerName && (
                <span>{item.metadata.customerName}</span>
              )}
              {item.metadata?.courierName && (
                <span>Courier: {item.metadata.courierName}</span>
              )}
              {item.metadata?.officer && (
                <span>Officer: {item.metadata.officer}</span>
              )}
              {item.metadata?.gateway && (
                <span>{item.metadata.gateway}</span>
              )}

              <span>•</span>

              <span>{formatTimeAgo(item.createdAt)}</span>

              {item.metadata?.customerLocation && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">near_me</span>
                    {item.metadata.customerLocation}
                  </span>
                </>
              )}

              {item.metadata?.validity && (
                <>
                  <span>•</span>
                  <span className="text-clay-earth">{item.metadata.validity}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onPrimaryAction(item)}
            className={`px-4 py-2 font-button-text text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              !item.read
                ? 'bg-onyx-black text-on-primary hover:bg-primary-container'
                : 'bg-surface-container-highest hover:bg-onyx-black hover:text-on-primary text-onyx-black'
            }`}
          >
            {cat.actionText}
          </button>

          {/* Three dots dropdown menu */}
          <div className="relative dropdown-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Context menu"
              onClick={handleDropdownToggle}
              className="w-9 h-9 flex items-center justify-center bg-surface hover:bg-surface-container-high transition-colors text-onyx-black dropdown-toggle cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu absolute right-0 top-10 w-48 bg-surface-container-lowest shadow-md py-1.5 z-20 border-t-2 border-onyx-black">
                
                {!item.read ? (
                  <button
                    type="button"
                    onClick={(e) => onMarkRead(notifId, e)}
                    className="w-full text-left px-4 py-2 text-xs font-button-text text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">drafts</span>
                    Mark as Read
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => onMarkUnread(notifId, e)}
                    className="w-full text-left px-4 py-2 text-xs font-button-text text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">mark_email_unread</span>
                    Mark as Unread
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdownId(null);
                    onOpenDetails();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-button-text text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  View Alert Details
                </button>

                <div className="h-px bg-sand-neutral/50 my-1"></div>

                <button
                  type="button"
                  onClick={(e) => onDelete(notifId, e)}
                  className="w-full text-left px-4 py-2 text-xs font-button-text text-error hover:bg-error-container/30 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  Soft-Delete Alert
                </button>

              </div>
            )}
          </div>
        </div>

      </div>
    </article>
  );
}
