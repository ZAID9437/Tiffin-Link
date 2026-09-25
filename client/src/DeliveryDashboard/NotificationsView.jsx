import React, { useState, useEffect, useMemo } from 'react';
import { getSocket } from '../services/socket';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

export default function NotificationsView({ currentUser, onNavigateTab, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ all: 0, unread: 0, important: 0, orders: 0, payments: 0, system: 0 });

  // Filtering & Sorting State
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Session user details
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const userEmail = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const userPhone = currentUser?.phone || savedUser?.phone || '';
  const driverName = currentUser?.name || savedUser?.name || 'Courier Partner';
  const driverCode = currentUser?.driverId || savedUser?.driverId || '';

  useEffect(() => {
    fetchNotifications();

    // Subscribe to Socket.IO real-time notification events
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (data) => {
        if (data && data.notification) {
          setNotifications((prev) => [data.notification, ...prev]);
          if (onShowToast) {
            onShowToast(`🔔 ${data.notification.title}: ${data.notification.message.substring(0, 50)}...`);
          }
        }
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification:count:update', () => fetchNotifications());

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:count:update');
      };
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || localStorage.getItem('tiffinlink_access_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId,
        phone: userPhone
      }).toString();

      const res = await fetch(`${API_BASE_URL}/api/notifications?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Unable to load notifications`);
      }

      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        throw new Error(data.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error fetching driver notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId
      }).toString();

      const targetNotif = notifications.find(n => (n.notificationId === notifId || n._id === notifId));
      if (targetNotif && targetNotif.read) return;

      const res = await fetch(`${API_BASE_URL}/api/notifications/${encodeURIComponent(notifId)}/read?${queryParams}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notifId || n._id === notifId
              ? { ...n, read: true, readAt: new Date() }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId
      }).toString();

      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all?${queryParams}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
        );
        if (onShowToast) {
          onShowToast('✓ All notifications marked as read.');
        }
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    const id = notif.notificationId || notif._id;
    handleMarkAsRead(id);

    // Contextual navigation
    const deepLink = notif.metadata?.deepLink;
    if (deepLink && onNavigateTab) {
      onNavigateTab(deepLink);
      return;
    }

    const cat = (notif.category || '').toLowerCase();
    const type = (notif.referenceType || '').toLowerCase();

    if (onNavigateTab) {
      if (cat === 'orders' || type === 'order') {
        if (notif.metadata?.orderId) {
          onNavigateTab('active-delivery');
        } else {
          onNavigateTab('delivery-requests');
        }
      } else if (cat === 'payments' || type === 'payment') {
        onNavigateTab('wallet-withdrawals');
      } else if (type === 'safety') {
        onNavigateTab('safety-report-issue');
      } else if (cat === 'system' || type === 'system') {
        onNavigateTab('safety-guidelines');
      }
    }
  };

  // Processed Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Category filter
      let matchesCat = true;
      if (categoryFilter === 'UNREAD') matchesCat = !n.read;
      else if (categoryFilter === 'DELIVERY') matchesCat = n.category === 'Orders' || n.category === 'Delivery';
      else if (categoryFilter === 'PAYMENT') matchesCat = n.category === 'Payments';
      else if (categoryFilter === 'SYSTEM') matchesCat = n.category === 'System';

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      let matchesQuery = true;
      if (q) {
        const text = `${n.title} ${n.message} ${n.notificationId} ${n.referenceId || ''} ${n.metadata?.orderId || ''}`.toLowerCase();
        matchesQuery = text.includes(q);
      }

      return matchesCat && matchesQuery;
    }).sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'priority') {
        const pMap = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
      } else {
        // default newest
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [notifications, categoryFilter, searchQuery, sortBy]);

  // Pagination calculations
  const totalItems = filteredNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(start, start + itemsPerPage);
  }, [filteredNotifications, currentPage]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const importantCount = useMemo(() => notifications.filter(n => n.priority === 'HIGH' || n.priority === 'CRITICAL').length, [notifications]);

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      
      {/* Top Meta & Title Bar */}
      <section className="flex flex-col gap-6 pt-6 pb-8 border-b border-sand-neutral/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">SUPPORT / NOTIFICATIONS</span>
            <span className="inline-block w-1 h-1 rounded-full bg-clay-earth"></span>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-sand-neutral/30">
              <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-ping"></span>
              <span className="font-label-caps text-[10px] tracking-wider uppercase text-onyx-black font-semibold">
                MongoDB Notifications Stream Synced • Socket.IO v3.2
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-clay-earth">
            <button
              type="button"
              onClick={fetchNotifications}
              className="flex items-center gap-1 hover:text-onyx-black transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              <span className="font-label-caps text-label-caps uppercase tracking-wider">Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-1 max-w-2xl">
            <h1 className="font-headline-lg text-headline-lg text-onyx-black font-normal tracking-tight">Notifications</h1>
            <p className="font-body-md text-body-md text-clay-earth">Stay updated with your deliveries, payments and account activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="mark-all-read-btn"
              disabled={unreadCount === 0}
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-onyx-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              <span className="font-button-text text-button-text">
                {unreadCount === 0 ? 'All Marked as Read' : 'Mark all as read'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('settings')}
              className="flex items-center gap-2 px-4 py-2.5 bg-sand-neutral/40 hover:bg-sand-neutral text-onyx-black transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span className="font-button-text text-button-text">Notification Settings</span>
            </button>
          </div>
        </div>

        {/* Active Driver Context Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-bone-white">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-clay-earth text-base">verified_user</span>
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-onyx-black">
              Authenticated Driver Context: <strong className="font-semibold">{driverName} (#{driverCode})</strong>
            </span>
            <span className="text-clay-earth">•</span>
            <span className="font-label-caps text-label-caps text-clay-earth uppercase">Tier 1 Senior Courier</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest">Bandra West Hub 12</span>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="flex flex-col p-6 bg-bone-white relative overflow-hidden group hover:bg-sand-neutral/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">Total Ingestion</span>
            <span className="material-symbols-outlined text-clay-earth text-lg">notifications</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-headline-lg text-headline-lg font-normal text-onyx-black leading-none">{summary.all || notifications.length}</span>
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider">Alerts</span>
          </div>
          <p className="font-body-md text-[13px] text-clay-earth mt-2">Aggregated alerts across GPS dispatch, escrow ledger, and hub notices.</p>
        </div>

        <div className="flex flex-col p-6 bg-bone-white relative overflow-hidden group hover:bg-sand-neutral/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-onyx-black"></span>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-onyx-black font-semibold">Unread Attention</span>
            </div>
            <span className="font-label-caps text-label-caps px-2 py-0.5 bg-onyx-black text-white">Active Queue</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-headline-lg text-headline-lg font-normal text-onyx-black leading-none">{unreadCount}</span>
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider">Pending acknowledgment</span>
          </div>
          <p className="font-body-md text-[13px] text-clay-earth mt-2">Requires immediate glance or contextual navigation to avoid dispatch timeouts.</p>
        </div>

        <div className="flex flex-col p-6 bg-bone-white relative overflow-hidden group hover:bg-sand-neutral/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-error font-semibold">Action Required</span>
            <span className="material-symbols-outlined text-error text-lg">crisis_alert</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-headline-lg text-headline-lg font-normal text-onyx-black leading-none">{importantCount}</span>
            <span className="font-label-caps text-label-caps text-error uppercase tracking-wider">Urgent Action</span>
          </div>
          <p className="font-body-md text-[13px] text-clay-earth mt-2">Includes surge dispatch confirmation and incident packaging ledger adjustment.</p>
        </div>
      </section>

      {/* Filter & Controls Sub-bar */}
      <section className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-sand-neutral/60">
          <div className="flex flex-wrap items-center gap-2" id="filter-tabs">
            <button
              type="button"
              onClick={() => { setCategoryFilter('ALL'); setCurrentPage(1); }}
              className={`filter-btn px-3 py-1.5 font-button-text text-button-text uppercase tracking-wider transition-colors cursor-pointer ${
                categoryFilter === 'ALL' ? 'bg-onyx-black text-white' : 'bg-sand-neutral/30 hover:bg-sand-neutral text-on-surface'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => { setCategoryFilter('UNREAD'); setCurrentPage(1); }}
              className={`filter-btn px-3 py-1.5 font-button-text text-button-text uppercase tracking-wider transition-colors cursor-pointer ${
                categoryFilter === 'UNREAD' ? 'bg-onyx-black text-white' : 'bg-sand-neutral/30 hover:bg-sand-neutral text-on-surface'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => { setCategoryFilter('DELIVERY'); setCurrentPage(1); }}
              className={`filter-btn px-3 py-1.5 font-button-text text-button-text uppercase tracking-wider transition-colors cursor-pointer ${
                categoryFilter === 'DELIVERY' ? 'bg-onyx-black text-white' : 'bg-sand-neutral/30 hover:bg-sand-neutral text-on-surface'
              }`}
            >
              Delivery ({notifications.filter(n => n.category === 'Orders' || n.category === 'Delivery').length})
            </button>
            <button
              type="button"
              onClick={() => { setCategoryFilter('PAYMENT'); setCurrentPage(1); }}
              className={`filter-btn px-3 py-1.5 font-button-text text-button-text uppercase tracking-wider transition-colors cursor-pointer ${
                categoryFilter === 'PAYMENT' ? 'bg-onyx-black text-white' : 'bg-sand-neutral/30 hover:bg-sand-neutral text-on-surface'
              }`}
            >
              Payment ({notifications.filter(n => n.category === 'Payments').length})
            </button>
            <button
              type="button"
              onClick={() => { setCategoryFilter('SYSTEM'); setCurrentPage(1); }}
              className={`filter-btn px-3 py-1.5 font-button-text text-button-text uppercase tracking-wider transition-colors cursor-pointer ${
                categoryFilter === 'SYSTEM' ? 'bg-onyx-black text-white' : 'bg-sand-neutral/30 hover:bg-sand-neutral text-on-surface'
              }`}
            >
              System &amp; Security ({notifications.filter(n => n.category === 'System').length})
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-label-caps text-clay-earth uppercase">Filter by:</span>
            <div className="px-2.5 py-1 bg-bone-white font-button-text text-xs text-onyx-black">Today • 24h Window</div>
          </div>
        </div>

        {/* Search and Sort Line */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 flex items-center gap-3 px-4 py-2.5 bg-bone-white">
            <span className="material-symbols-outlined text-clay-earth text-lg">search</span>
            <input
              type="text"
              id="search-input"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search notifications by keyword, #ORD-ID, or tag..."
              className="w-full bg-transparent font-body-md text-sm text-onyx-black placeholder:text-clay-earth focus:outline-none"
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-between px-4 py-2.5 bg-bone-white">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-button-text text-xs uppercase tracking-wider text-onyx-black focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Feed & Right Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Notification Feed Stream (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-4" id="notifications-container">
          
          {loading ? (
            <div className="p-12 text-center text-clay-earth bg-bone-white">
              <span className="w-6 h-6 border-2 border-onyx-black border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
              <p className="font-headline-md text-base text-onyx-black font-normal">Loading notifications from MongoDB...</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-error/10 border border-error text-error text-center">
              <span className="material-symbols-outlined text-3xl mb-2">warning</span>
              <p className="font-headline-md text-lg text-error mb-2">Unable to load notifications</p>
              <p className="font-body-md text-xs mb-4">{error}</p>
              <button
                type="button"
                onClick={fetchNotifications}
                className="px-4 py-2 bg-error text-white font-button-text text-xs uppercase tracking-wider"
              >
                Retry Request
              </button>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="p-12 text-center bg-bone-white/50 border border-dashed border-sand-neutral">
              <span className="material-symbols-outlined text-4xl text-clay-earth mb-2">notifications_off</span>
              <h3 className="font-headline-md text-lg text-onyx-black mb-1">No notifications found</h3>
              <p className="font-body-md text-xs text-clay-earth">There are no notification records matching your selected filter or search criteria.</p>
            </div>
          ) : (
            currentItems.map((notif) => {
              const isUnread = !notif.read;
              const isHigh = notif.priority === 'HIGH' || notif.priority === 'CRITICAL';
              const iconName = 
                notif.category === 'Payments' ? 'payments' :
                notif.category === 'System' ? 'shield' :
                notif.referenceType === 'safety' ? 'warning' :
                'local_shipping';

              return (
                <article
                  key={notif.notificationId || notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`notif-card flex flex-col p-6 relative transition-all group cursor-pointer ${
                    isUnread
                      ? 'bg-bone-white border-l-4 border-onyx-black hover:bg-surface-container'
                      : 'bg-surface-container-lowest opacity-85 hover:opacity-100 hover:bg-bone-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${isUnread ? 'bg-onyx-black text-white' : 'bg-sand-neutral/40 text-onyx-black'}`}>
                        <span className="material-symbols-outlined text-base">{iconName}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold text-onyx-black">
                            {notif.category || 'Notification'}
                          </span>
                          {isHigh && isUnread && (
                            <span className="px-1.5 py-0.5 bg-error text-white font-label-caps text-[10px] uppercase font-bold">
                              Action Required
                            </span>
                          )}
                        </div>
                        <span className="font-label-caps text-[11px] text-clay-earth">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                          {notif.readAt ? ` • Read at ${new Date(notif.readAt).toLocaleTimeString([], { timeStyle: 'short' })}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUnread ? (
                        <span className="unread-indicator flex items-center gap-1 font-label-caps text-[11px] text-onyx-black font-semibold">
                          <span className="w-2 h-2 rounded-full bg-onyx-black"></span> Unread
                        </span>
                      ) : (
                        <span className="font-label-caps text-[11px] text-clay-earth uppercase">Read</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pl-11">
                    <h2 className="font-headline-md text-[20px] leading-tight text-onyx-black font-normal">
                      {notif.title}
                    </h2>
                    <p className="font-body-md text-sm text-clay-earth leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 mt-2 border-t border-sand-neutral/50">
                      <div className="flex flex-wrap items-center gap-2">
                        {notif.metadata?.orderId && (
                          <span className="px-2 py-0.5 bg-sand-neutral/50 font-label-caps text-[11px] text-onyx-black font-medium">
                            #{notif.metadata.orderId}
                          </span>
                        )}
                        {notif.referenceId && !notif.metadata?.orderId && (
                          <span className="px-2 py-0.5 bg-sand-neutral/50 font-label-caps text-[11px] text-onyx-black font-medium">
                            #{notif.referenceId}
                          </span>
                        )}
                        {notif.metadata?.tag && (
                          <span className="px-2 py-0.5 bg-sand-neutral/50 font-label-caps text-[11px] text-onyx-black font-semibold">
                            {notif.metadata.tag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-button-text text-xs uppercase tracking-wider text-onyx-black group-hover:underline underline-offset-4">
                          <span>View Details</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          {/* Stream Footer / Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-bone-white mt-4">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} notifications
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 font-button-text text-xs uppercase bg-sand-neutral/40 hover:bg-sand-neutral text-onyx-black transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 font-button-text text-xs cursor-pointer transition-colors ${
                      currentPage === pg ? 'bg-onyx-black text-white font-bold' : 'bg-sand-neutral/30 hover:bg-sand-neutral text-onyx-black'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 font-button-text text-xs uppercase bg-sand-neutral/40 hover:bg-sand-neutral text-onyx-black transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Rail: Channel Telemetry & Driver Specifications (4 Columns) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 1: Channel Delivery Matrix */}
          <div className="flex flex-col p-6 bg-bone-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-sand-neutral/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-lg">cell_tower</span>
                <h3 className="font-headline-md text-lg text-onyx-black font-normal">Channel Delivery Matrix</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse"></span>
            </div>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center justify-between py-1.5">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-semibold text-onyx-black">Push Notifications</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase">Instant Sound &amp; Haptic</span>
                </div>
                <span className="px-2 py-0.5 bg-onyx-black text-white font-label-caps text-[10px] uppercase font-semibold">Active</span>
              </li>
              <li className="flex items-center justify-between py-1.5 border-t border-sand-neutral/40">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-semibold text-onyx-black">SMS Dispatch Gate</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase">SOS / 112 &amp; High-Value Cargo</span>
                </div>
                <span className="px-2 py-0.5 bg-sand-neutral/60 text-onyx-black font-label-caps text-[10px] uppercase">Critical Only</span>
              </li>
              <li className="flex items-center justify-between py-1.5 border-t border-sand-neutral/40">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-semibold text-onyx-black">WhatsApp Dispatch</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase">+91 98765 43210</span>
                </div>
                <span className="px-2 py-0.5 bg-onyx-black text-white font-label-caps text-[10px] uppercase font-semibold">Active</span>
              </li>
              <li className="flex items-center justify-between py-1.5 border-t border-sand-neutral/40">
                <div className="flex flex-col">
                  <span className="font-button-text text-xs font-semibold text-onyx-black">In-App Audio Ping</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase">Intercom &amp; Helmet High Vol</span>
                </div>
                <span className="px-2 py-0.5 bg-sand-neutral/60 text-onyx-black font-label-caps text-[10px] uppercase">High Gain</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('settings')}
              className="mt-5 w-full py-2.5 bg-onyx-black text-white font-button-text text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Configure Alert Sound &amp; Vibration
            </button>
          </div>

          {/* Card 3: Mark All Read Confirmation Rule & Scope Notice */}
          <div className="flex flex-col p-6 bg-sand-neutral/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-base text-onyx-black">policy</span>
              <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold text-onyx-black">Scoped Isolation Rule</span>
            </div>
            <p className="font-body-md text-xs text-clay-earth leading-relaxed">
              Actions executed through this dashboard are strictly scoped to authenticated driver <strong>#{driverCode}</strong> (Bandra West Hub). Triggers zero cascading modifications on peer courier accounts or kitchen dispatcher queues.
            </p>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-sand-neutral/60">
              <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Zero Side-Effects Enforced</span>
            </div>
          </div>

        </aside>

      </div>

      {/* Telemetry & Session Audit Footer */}
      <footer className="mt-16 pt-6 border-t border-sand-neutral/60 flex flex-wrap items-center justify-between gap-4 text-clay-earth font-label-caps text-label-caps uppercase tracking-widest text-[11px]">
        <div className="flex items-center gap-3">
          <span>SEC-TOKEN: SHA256-{driverCode}-TLINK-SESSION-OK</span>
          <span>•</span>
          <span>Socket.IO Live Gateway (Port 8443)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Timezone: Asia/Kolkata (IST)</span>
          <span>•</span>
          <span>Build: v4.12-PROD</span>
        </div>
      </footer>

    </div>
  );
}
