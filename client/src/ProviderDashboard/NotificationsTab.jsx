import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { 
  Bell, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  Star, 
  Utensils, 
  ShieldAlert, 
  CheckCircle, 
  RotateCw, 
  MoreVertical, 
  Trash2, 
  CheckCheck, 
  CircleDot, 
  Search, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    notificationId: 'NOTIF-1001',
    title: 'New Order Received',
    message: 'Order #1029 from Raj Patel • ₹240 • Gujarati Veg Thali',
    category: 'Orders',
    read: false,
    referenceId: '1029',
    referenceType: 'order',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  },
  {
    notificationId: 'NOTIF-1002',
    title: 'Order Ready',
    message: 'Order #1027 is ready for delivery partner pickup',
    category: 'Orders',
    read: false,
    referenceId: '1027',
    referenceType: 'order',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    notificationId: 'NOTIF-1003',
    title: 'New Customer Review',
    message: 'Neha Shah rated Gujarati Thali 5 stars: "Super delicious home cooked thali!"',
    category: 'Reviews',
    read: false,
    referenceId: 'rev_1',
    referenceType: 'review',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    notificationId: 'NOTIF-1004',
    title: 'Payment Received',
    message: '₹360.00 received for Order #1025 via UPI',
    category: 'Payments',
    read: true,
    referenceId: '1025',
    referenceType: 'payment',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
  },
  {
    notificationId: 'NOTIF-1005',
    title: 'Tiffin Availability Alert',
    message: 'Gujarati Thali has reached today\'s order limit (50 units)',
    category: 'Tiffins',
    read: true,
    referenceId: 'tif_1',
    referenceType: 'tiffin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    notificationId: 'NOTIF-1006',
    title: 'System Security Alert',
    message: 'Successful login detected from Chrome (Windows) at 11:20 PM',
    category: 'System',
    read: true,
    referenceId: 'sec_1',
    referenceType: 'system',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
  }
];

export default function NotificationsTab({ onNavigateTab }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [summary, setSummary] = useState({ all: 6, unread: 3, orders: 2, system: 1 });
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [readFilter, setReadFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchNotifications();

    // Real-Time Live Auto-Sync every 4 seconds
    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, 4000);

    return () => clearInterval(intervalId);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchNotifications = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setHasError(false);
      const json = await apiRequest('/notifications');
      if (json.success && Array.isArray(json.notifications) && json.notifications.length > 0) {
        setNotifications(json.notifications);
        if (json.summary) setSummary(json.summary);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (!isBackground && notifications.length === 0) setHasError(true);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Handler: Mark Single Notification Read
  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await apiRequest(`/notifications/${notifId}/read`, { method: 'PUT' });
    } catch (err) {
      console.error('Error marking read:', err);
    }
    setNotifications(prev => prev.map(n => n.notificationId === notifId ? { ...n, read: true } : n));
    setSummary(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    showToast('✓ Notification marked as read');
    setOpenMenuId(null);
  };

  // Handler: Mark Single Notification Unread
  const handleMarkAsUnread = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await apiRequest(`/notifications/${notifId}/unread`, { method: 'PUT' });
    } catch (err) {
      console.error('Error marking unread:', err);
    }
    setNotifications(prev => prev.map(n => n.notificationId === notifId ? { ...n, read: false } : n));
    setSummary(prev => ({ ...prev, unread: prev.unread + 1 }));
    showToast('✓ Notification marked as unread');
    setOpenMenuId(null);
  };

  // Handler: Mark All as Read
  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
    } catch (err) {
      console.error('Error marking all read:', err);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setSummary(prev => ({ ...prev, unread: 0 }));
    showToast('✓ All notifications marked as read!');
  };

  // Handler: Delete Notification
  const handleDeleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await apiRequest(`/notifications/${notifId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
    setNotifications(prev => prev.filter(n => n.notificationId !== notifId));
    setSummary(prev => ({ ...prev, all: Math.max(0, prev.all - 1) }));
    showToast('✓ Notification deleted');
    setOpenMenuId(null);
  };

  // Notification Click Routing Handler
  const handleNotificationClick = (notif) => {
    if (!notif) return;
    if (!notif.read && notif.notificationId) {
      handleMarkAsRead(notif.notificationId);
    }

    if (onNavigateTab) {
      const cat = notif.category || '';
      if (cat === 'Orders') onNavigateTab('orders');
      else if (cat === 'Reviews') onNavigateTab('reviews');
      else if (cat === 'Payments') onNavigateTab('earnings');
      else if (cat === 'Tiffins') onNavigateTab('tiffins');
      else if (cat === 'Customers') onNavigateTab('customers');
    }
  };

  // Category Icon Renderer
  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'Orders':
        return <ShoppingBag className="text-[#0A8B5F]" size={18} />;
      case 'Customers':
        return <Users className="text-indigo-600" size={18} />;
      case 'Payments':
        return <DollarSign className="text-emerald-600" size={18} />;
      case 'Reviews':
        return <Star className="text-amber-500 fill-amber-400" size={18} />;
      case 'Tiffins':
        return <Utensils className="text-amber-700" size={18} />;
      default:
        return <ShieldAlert className="text-blue-600" size={18} />;
    }
  };

  // Formatting relative timestamp safely
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Just now';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Yesterday';
  };

  // Safe Filtered Notifications List
  const filteredNotifications = (notifications || []).filter(n => {
    if (!n) return false;
    const cat = n.category || 'System';
    const title = n.title || '';
    const message = n.message || '';
    const isRead = Boolean(n.read);

    const matchesCategory = categoryFilter === 'All' || cat === categoryFilter;
    const matchesRead = readFilter === 'All' || (readFilter === 'Unread' && !isRead) || (readFilter === 'Read' && isRead);
    const matchesSearch = searchQuery === '' || 
      title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesRead && matchesSearch;
  });

  // Date Grouping (Today, Yesterday, Earlier)
  const todayNotifs = [];
  const yesterdayNotifs = [];
  const earlierNotifs = [];

  const now = new Date();
  filteredNotifications.forEach(n => {
    const created = new Date(n.createdAt || Date.now());
    const diffMs = now.getTime() - created.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 24) todayNotifs.push(n);
    else if (diffHours < 48) yesterdayNotifs.push(n);
    else earlierNotifs.push(n);
  });

  return (
    <div className="space-y-6 animate-slide-up relative text-xs font-bold text-[#111827]">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={17} />
          <span className="font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Communication</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Notifications</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Notifications</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Stay updated with orders, customers, payments and your tiffin business.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Live Sync Badge */}
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black rounded-xl flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>LIVE (Auto-syncing)</span>
          </span>

          <button 
            onClick={handleMarkAllAsRead}
            className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-[#E8F0EC] text-[#0A8B5F] font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck size={15} />
            <span>Mark all as read</span>
          </button>

          <button 
            onClick={() => { fetchNotifications(); showToast('✓ Refreshed notifications!'); }}
            className="p-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RotateCw size={15} className="text-[#0A8B5F]" />
          </button>
        </div>
      </div>

      {/* 4 Real-Time Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-1">ALL</div>
          <div className="text-3xl font-black text-[#111827]">{summary.all || notifications.length}</div>
          <p className="text-[11px] text-[#6B7280] font-medium mt-1">Total notifications</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-1">UNREAD</div>
          <div className="text-3xl font-black text-amber-700">{summary.unread}</div>
          <p className="text-[11px] text-amber-800 font-medium mt-1">● Pending review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#0A8B5F] uppercase tracking-wider mb-1">ORDERS</div>
          <div className="text-3xl font-black text-[#0A8B5F]">{summary.orders}</div>
          <p className="text-[11px] text-[#0A8B5F] font-medium mt-1">Order alerts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-blue-800 uppercase tracking-wider mb-1">SYSTEM</div>
          <div className="text-3xl font-black text-blue-700">{summary.system}</div>
          <p className="text-[11px] text-blue-800 font-medium mt-1">System updates</p>
        </div>

      </div>

      {/* Category Pills Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Orders', 'Customers', 'Payments', 'Reviews', 'Tiffins', 'System'].map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-[#0A8B5F] text-white shadow-xs' 
                    : 'bg-[#F9FBF9] text-[#6B7280] border border-[#E5ECE8] hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Read Status Filter & Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#6B7280]" />
              <input 
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] w-44 md:w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#F9FBF9] p-1 rounded-xl border border-[#E5ECE8]">
              {['All', 'Unread', 'Read'].map(st => (
                <button 
                  key={st}
                  onClick={() => setReadFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                    readFilter === st ? 'bg-white text-[#0A8B5F] shadow-xs' : 'text-[#6B7280]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Notifications Feed Container */}
      <div className="space-y-6">
        
        {loading && notifications.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-3 shadow-xs">
            <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7280] font-bold">Loading real-time notifications...</p>
          </div>
        )}

        {hasError && notifications.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111827]">Unable to load notifications</h3>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Check database connection or network connectivity.</p>
            </div>
            <button 
              onClick={() => fetchNotifications()}
              className="px-4 py-2 bg-[#0A8B5F] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#08734E] cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* TODAY SECTION */}
        {todayNotifs.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-black text-[#6B7280] uppercase tracking-wider px-1">TODAY</div>
            <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs divide-y divide-[#E5ECE8] overflow-hidden">
              {todayNotifs.map(n => renderNotificationCard(n))}
            </div>
          </div>
        )}

        {/* YESTERDAY SECTION */}
        {yesterdayNotifs.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-black text-[#6B7280] uppercase tracking-wider px-1">YESTERDAY</div>
            <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs divide-y divide-[#E5ECE8] overflow-hidden">
              {yesterdayNotifs.map(n => renderNotificationCard(n))}
            </div>
          </div>
        )}

        {/* EARLIER SECTION */}
        {earlierNotifs.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-black text-[#6B7280] uppercase tracking-wider px-1">EARLIER</div>
            <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs divide-y divide-[#E5ECE8] overflow-hidden">
              {earlierNotifs.map(n => renderNotificationCard(n))}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredNotifications.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-[#E5ECE8] shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#0A8B5F] flex items-center justify-center mx-auto border border-[#C5DDD2]">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-black text-[#111827]">You're all caught up!</h3>
            <p className="text-xs text-[#6B7280] font-medium max-w-sm mx-auto">
              No notifications matching your filter right now. New order and system alerts will appear here automatically.
            </p>
          </div>
        )}

      </div>

    </div>
  );

  // Helper Renderer for Single Notification Card
  function renderNotificationCard(item) {
    if (!item) return null;
    const isUnread = !item.read;
    const isMenuOpen = openMenuId === item.notificationId;

    return (
      <div 
        key={item.notificationId || Math.random()}
        onClick={() => handleNotificationClick(item)}
        className={`p-4 flex items-start gap-4 transition-all cursor-pointer relative group ${
          isUnread ? 'bg-[#F9FBF9] border-l-4 border-l-[#0A8B5F]' : 'bg-white hover:bg-[#F9FBF9]'
        }`}
      >
        {/* Category Icon */}
        <div className="w-10 h-10 rounded-2xl bg-[#F9FBF9] border border-[#E5ECE8] flex items-center justify-center shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform">
          {renderCategoryIcon(item.category)}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-[#111827]">{item.title || 'Notification Alert'}</h4>
              {isUnread && (
                <span className="px-2 py-0.5 bg-emerald-100 text-[#0A8B5F] text-[10px] font-black rounded-md flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A8B5F]" />
                  <span>Unread</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#6B7280]">{formatTimeAgo(item.createdAt)}</span>
              
              {/* Action Dropdown ⋮ */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => setOpenMenuId(isMenuOpen ? null : item.notificationId)}
                  className="p-1 text-[#6B7280] hover:text-[#111827] hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                >
                  <MoreVertical size={15} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white border border-[#E5ECE8] rounded-xl shadow-xl py-1 z-50 animate-slide-up text-xs font-bold">
                    {isUnread ? (
                      <button 
                        onClick={e => handleMarkAsRead(item.notificationId, e)}
                        className="w-full text-left px-3 py-2 text-[#111827] hover:bg-[#F9FBF9] flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCheck size={14} className="text-[#0A8B5F]" />
                        <span>Mark as read</span>
                      </button>
                    ) : (
                      <button 
                        onClick={e => handleMarkAsUnread(item.notificationId, e)}
                        className="w-full text-left px-3 py-2 text-[#111827] hover:bg-[#F9FBF9] flex items-center gap-2 cursor-pointer"
                      >
                        <CircleDot size={14} className="text-amber-600" />
                        <span>Mark as unread</span>
                      </button>
                    )}
                    <button 
                      onClick={e => handleDeleteNotification(item.notificationId, e)}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-[#E5ECE8] cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#4B5563] font-medium leading-relaxed">{item.message || ''}</p>
        </div>
      </div>
    );
  }
}
