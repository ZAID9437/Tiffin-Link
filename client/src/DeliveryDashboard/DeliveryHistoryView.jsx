import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToConnectionStatus, subscribeToDeliveryLifecycle } from '../services/socket';

export default function DeliveryHistoryView({ currentUser, onNavigateTab }) {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOption, setSortOption] = useState('recent');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector & Modal State
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Socket Connection Status
  const [isConnected, setIsConnected] = useState(true);

  // Auth User / Token recovery
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const token = typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '') : '';

  const email = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const phone = currentUser?.phone || savedUser?.phone || '';

  const fetchDeliveryHistory = useCallback(async (isLoadMore = false, targetPage = 1) => {
    if (!isLoadMore) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const queryParams = new URLSearchParams({
        email,
        driverId,
        phone,
        page: String(targetPage),
        limit: '10',
        search: searchTerm.trim(),
        status: statusFilter,
        date: dateFilter,
        sort: sortOption
      });

      const res = await fetch(`http://localhost:5000/api/delivery/history?${queryParams.toString()}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        const fetchedList = json.data.deliveries || [];

        if (isLoadMore) {
          setDeliveries(prev => [...prev, ...fetchedList]);
        } else {
          setDeliveries(fetchedList);
          if (fetchedList.length > 0 && !selectedDelivery) {
            setSelectedDelivery(fetchedList[0]);
          }
        }

        setStats(json.data.stats || {
          totalTrips: 0,
          completedCount: 0,
          cancelledCount: 0,
          totalEarnings: 0
        });

        const pag = json.pagination || {};
        setTotalCount(pag.total || fetchedList.length);
        setHasMore(targetPage < (pag.totalPages || 1));
      } else {
        throw new Error(json.message || 'Failed to load delivery history');
      }
    } catch (err) {
      console.error('Error fetching delivery history:', err);
      setError(err.message || 'Unable to load delivery history.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [email, driverId, phone, token, searchTerm, statusFilter, dateFilter, sortOption, selectedDelivery]);

  // Initial Load & Filter trigger
  useEffect(() => {
    setPage(1);
    fetchDeliveryHistory(false, 1);
  }, [searchTerm, statusFilter, dateFilter, sortOption]);

  // Socket Live Sync Listeners
  useEffect(() => {
    const unsubConn = subscribeToConnectionStatus((status) => {
      setIsConnected(status);
    });

    const unsubLifecycle = subscribeToDeliveryLifecycle({
      onCompleted: () => fetchDeliveryHistory(false, 1),
      onStatusUpdate: () => fetchDeliveryHistory(false, 1)
    });

    return () => {
      if (unsubConn) unsubConn();
      if (unsubLifecycle) unsubLifecycle();
    };
  }, [fetchDeliveryHistory]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeliveryHistory(true, nextPage);
  };

  const handleOpenDetails = (item) => {
    setSelectedDelivery(item);
    setIsModalOpen(true);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return dateStr;

    const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return `${dateFormatted} · ${timeStr}`;
  };

  return (
    <div className="flex flex-col w-full selection:bg-onyx-black selection:text-white">
      {/* 1. Header & Live Sync Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-sand-neutral">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-label-caps text-xs uppercase tracking-wider text-secondary">
            <span>My Deliveries</span>
            <span className="text-sand-neutral">/</span>
            <span className="text-onyx-black font-semibold">Delivery History</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 font-label-caps text-[11px] rounded-full ${isConnected ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600 animate-ping'}`} />
            <span>{isConnected ? 'LIVE SYNC' : 'RECONNECTING...'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDeliveryHistory(false, 1)}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-sand-neutral font-button-text text-xs text-onyx-black hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Editorial Page Headline */}
      <div className="pt-6 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-label-caps text-xs uppercase tracking-widest text-secondary block mb-1">Operational History</span>
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-onyx-black tracking-tight font-serif">Delivery History</h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1.5 max-w-2xl">
            Complete record of your past delivery activity, completed fulfillment, and cancelled orders.
          </p>
        </div>
      </div>

      {/* 3. Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
        {/* Card 1: Total Trips */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Total Trips</span>
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          </div>
          <div>
            <div className="font-headline-md text-3xl text-onyx-black font-serif">
              {loading ? '...' : stats.totalTrips}
            </div>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              Historical trips assigned
            </p>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Completed</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-700">task_alt</span>
          </div>
          <div>
            <div className="font-headline-md text-3xl text-onyx-black font-serif">
              {loading ? '...' : stats.completedCount}
            </div>
            <p className="font-body-md text-xs text-emerald-800 font-medium mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Successfully delivered
            </p>
          </div>
        </div>

        {/* Card 3: Cancelled */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Cancelled</span>
            <span className="material-symbols-outlined text-[20px] text-rose-700">cancel</span>
          </div>
          <div>
            <div className="font-headline-md text-3xl text-onyx-black font-serif">
              {loading ? '...' : stats.cancelledCount}
            </div>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5">
              Cancelled / Terminated
            </p>
          </div>
        </div>

        {/* Card 4: Total Earnings */}
        <div className="p-6 bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="font-label-caps text-xs uppercase tracking-wider">Total Earnings</span>
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
          <div>
            <div className="font-headline-md text-3xl text-onyx-black font-serif">
              {loading ? '...' : `₹${stats.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </div>
            <p className="font-body-md text-xs text-emerald-800 font-medium mt-1.5">
              Lifetime courier earnings
            </p>
          </div>
        </div>
      </div>

      {/* 4. Search, Status, Date & Sort Toolbar */}
      <div className="p-4 bg-surface-container-low border border-sand-neutral flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order #, customer, or kitchen..."
              className="w-full bg-surface-container-lowest border border-sand-neutral pl-10 pr-4 py-2 font-body-md text-sm text-onyx-black placeholder-secondary focus:outline-none focus:border-onyx-black transition-colors"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-sand-neutral text-xs">
              <span className="text-secondary font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-button-text font-semibold text-onyx-black focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-sand-neutral text-xs">
              <span className="text-secondary font-medium">Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent font-button-text font-semibold text-onyx-black focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-sand-neutral text-xs">
              <span className="text-secondary font-medium">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-transparent font-button-text font-semibold text-onyx-black focus:outline-none cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest</option>
                <option value="highest_earnings">Highest Earnings</option>
                <option value="lowest_earnings">Lowest Earnings</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Content Area */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <span className="material-symbols-outlined text-[36px] animate-spin text-onyx-black">progress_activity</span>
          <p className="font-body-md text-sm text-secondary">Loading delivery history from MongoDB...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-error-container/20 border border-error/30 text-center space-y-3 my-4">
          <span className="material-symbols-outlined text-[36px] text-error">error_outline</span>
          <h3 className="font-headline-md text-lg text-onyx-black font-serif">Unable to load delivery history</h3>
          <p className="font-body-md text-xs text-on-surface-variant max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => fetchDeliveryHistory(false, 1)}
            className="px-6 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="p-12 bg-surface-container-lowest border border-sand-neutral text-center space-y-4 my-4">
          <span className="material-symbols-outlined text-[48px] text-secondary">history</span>
          <div>
            <h3 className="font-headline-md text-xl text-onyx-black font-serif">No Delivery History</h3>
            <p className="font-body-md text-sm text-on-surface-variant mt-1 max-w-sm mx-auto">
              Your completed and historical delivery activity will appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('delivery-requests')}
            className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider font-bold hover:bg-stone-800 transition-colors inline-block cursor-pointer"
          >
            View Delivery Requests
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* Left Column: Delivery Cards (7 cols on XL) */}
          <div className="xl:col-span-7 flex flex-col gap-4">
            {deliveries.map((item) => {
              const isSelected = selectedDelivery && selectedDelivery._id === item._id;
              const isDelivered = item.status === 'DELIVERED';
              const isCancelled = item.status === 'CANCELLED';

              return (
                <div
                  key={item._id || item.orderId}
                  onClick={() => handleOpenDetails(item)}
                  className={`p-6 bg-surface-container-lowest border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'border-2 border-onyx-black shadow-md relative' : 'border border-sand-neutral hover:border-onyx-black'
                    }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 right-6 bg-onyx-black text-on-primary font-label-caps text-[10px] px-2.5 py-0.5 tracking-widest uppercase">
                      Inspecting Order
                    </div>
                  )}

                  <div>
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-sand-neutral">
                      <div className="flex items-center gap-2.5">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-label-caps text-[11px] font-semibold tracking-wide">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            DELIVERED
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-label-caps text-[11px] font-semibold tracking-wide">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            CANCELLED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-label-caps text-[11px] font-semibold tracking-wide">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            {item.status}
                          </span>
                        )}
                        <span className="font-button-text font-bold text-onyx-black text-[15px]">{item.orderId}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-label-caps text-[10px] text-secondary uppercase block">
                          {isDelivered ? 'Driver Earnings' : 'Earnings'}
                        </span>
                        <span className={`font-button-text font-bold text-[18px] ${isDelivered ? 'text-onyx-black' : 'text-secondary'}`}>
                          ₹{item.driverEarning ? item.driverEarning.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider block mb-1">Order Summary</span>
                        <h3 className="font-headline-md text-lg text-onyx-black font-serif leading-tight">{item.tiffinName}</h3>
                        <p className="font-body-md text-xs text-on-surface-variant mt-1">
                          From <span className="font-medium text-onyx-black">{item.providerName}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium text-onyx-black">{item.customerName}</span>
                        </p>
                      </div>

                      <div className="border-l-0 md:border-l md:border-sand-neutral md:pl-4">
                        <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider block mb-1">Timestamp & Status</span>
                        <div className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(item.completedAt || item.requestedAt)}</div>
                        <p className="font-body-md text-xs text-on-surface-variant truncate mt-0.5">
                          {isCancelled ? `Reason: ${item.cancellationReason || 'Cancelled before delivery'}` : `Payment: ${item.paymentStatus || 'Paid'}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 border-t border-sand-neutral flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-secondary font-label-caps text-[11px]">
                      <span>{formatDateTime(item.completedAt || item.requestedAt)}</span>
                      <span>•</span>
                      <span>Order Value: ₹{item.orderTotal ? item.orderTotal.toFixed(2) : '224.00'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(item);
                      }}
                      className="inline-flex items-center gap-1.5 text-onyx-black hover:text-stone-700 font-button-text text-xs font-semibold underline underline-offset-4 transition-colors cursor-pointer"
                    >
                      <span>VIEW DETAILS →</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-4 bg-surface-container-low border border-dashed border-sand-neutral text-onyx-black font-button-text text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Loading More...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    <span>Load More History ({totalCount - deliveries.length} Remaining)</span>
                  </>
                )}
              </button>
            )}

            {!hasMore && deliveries.length > 0 && (
              <div className="py-3 text-center font-label-caps text-xs text-secondary uppercase tracking-wider">
                All history records loaded ({totalCount} total)
              </div>
            )}
          </div>

          {/* Right Column: Inspector Details Drawer (5 cols on XL) */}
          {selectedDelivery && (
            <div className="hidden xl:flex xl:col-span-5 bg-surface-container-lowest border border-onyx-black p-6 flex-col gap-6 sticky top-6 shadow-sm">

              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-sand-neutral pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-caps text-xs uppercase tracking-widest text-secondary">DELIVERY DETAILS</span>
                    <span className={`px-2 py-0.5 font-label-caps text-[10px] font-bold ${selectedDelivery.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                      {selectedDelivery.status === 'DELIVERED' ? '✓ DELIVERED' : '✕ CANCELLED'}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-2xl text-onyx-black font-serif">{selectedDelivery.orderId}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="p-1 text-secondary hover:text-onyx-black transition-colors cursor-pointer"
                  title="Close Details"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Customer & Kitchen Information */}
              <div className="space-y-4 bg-surface-container-low p-4 border border-sand-neutral text-xs">
                {/* Kitchen */}
                <div>
                  <span className="font-label-caps text-[10px] uppercase tracking-wider text-secondary block">KITCHEN</span>
                  <div className="font-button-text text-sm text-onyx-black font-bold mt-0.5">{selectedDelivery.providerName}</div>
                  <p className="font-body-md text-xs text-on-surface-variant leading-snug mt-0.5">
                    {typeof selectedDelivery.pickupAddress === 'string'
                      ? selectedDelivery.pickupAddress
                      : (selectedDelivery.pickupAddress?.street || 'Kitchen address on file')}
                  </p>
                </div>

                <div className="border-t border-sand-neutral/50 pt-3">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider text-secondary block">CUSTOMER</span>
                  <div className="font-button-text text-sm text-onyx-black font-bold mt-0.5">{selectedDelivery.customerName}</div>
                  <p className="font-body-md text-xs text-on-surface-variant leading-snug mt-0.5">
                    {typeof selectedDelivery.deliveryAddress === 'string'
                      ? selectedDelivery.deliveryAddress
                      : (selectedDelivery.deliveryAddress?.street || 'Customer address on file')}
                  </p>
                </div>
              </div>

              {/* Item Summary */}
              <div className="space-y-2 text-xs">
                <div className="font-label-caps text-xs uppercase tracking-wider text-secondary">ORDER</div>
                <div className="p-3 bg-surface-container-low border border-sand-neutral flex items-center justify-between font-medium">
                  <span className="text-onyx-black font-semibold">{selectedDelivery.tiffinName}</span>
                  <span className="font-mono text-onyx-black">× {selectedDelivery.itemCount || selectedDelivery.quantity || 1}</span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="space-y-2 border-t border-sand-neutral pt-4 text-xs">
                <div className="flex justify-between py-1 border-b border-sand-neutral/40">
                  <span className="text-secondary uppercase tracking-wider font-label-caps text-[11px]">ORDER TOTAL</span>
                  <span className="font-button-text font-bold text-onyx-black">₹{selectedDelivery.orderTotal ? selectedDelivery.orderTotal.toFixed(2) : '224.00'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-sand-neutral/40">
                  <span className="text-secondary uppercase tracking-wider font-label-caps text-[11px]">DRIVER EARNINGS</span>
                  <span className="font-button-text font-bold text-emerald-800">₹{selectedDelivery.driverEarning ? selectedDelivery.driverEarning.toFixed(2) : '0.00'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-sand-neutral/40">
                  <span className="text-secondary uppercase tracking-wider font-label-caps text-[11px]">PAYMENT</span>
                  <span className="font-button-text font-bold text-onyx-black">{selectedDelivery.paymentStatus || 'PAID'}</span>
                </div>
              </div>

              {/* Lifecycle Milestones Timeline */}
              <div className="space-y-2 text-xs">
                <div className="font-label-caps text-xs uppercase tracking-wider text-secondary">DELIVERY TIMELINE</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-surface-container-low border border-sand-neutral">
                    <span className="font-label-caps text-[10px] text-secondary block">Assigned</span>
                    <span className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(selectedDelivery.requestedAt)}</span>
                  </div>
                  <div className="p-2.5 bg-surface-container-low border border-sand-neutral">
                    <span className="font-label-caps text-[10px] text-secondary block">Picked Up</span>
                    <span className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(selectedDelivery.pickedUpAt || selectedDelivery.requestedAt)}</span>
                  </div>
                  <div className="p-2.5 bg-surface-container-low border border-sand-neutral">
                    <span className="font-label-caps text-[10px] text-secondary block">Arrived at Site</span>
                    <span className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(selectedDelivery.arrivedAt || selectedDelivery.completedAt)}</span>
                  </div>
                  <div className={`p-2.5 border ${selectedDelivery.status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <span className={`font-label-caps text-[10px] font-bold block ${selectedDelivery.status === 'DELIVERED' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {selectedDelivery.status === 'DELIVERED' ? 'Delivered' : 'Cancelled'}
                    </span>
                    <span className="font-button-text text-xs text-onyx-black font-bold">{formatDateTime(selectedDelivery.completedAt || selectedDelivery.deliveredAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="w-full py-3 bg-onyx-black text-on-primary font-button-text text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          )}

        </div>
      )}

      {/* 6. Modal Overlay Dialog (Pops up when VIEW DETAILS → is clicked across all screen sizes) */}
      {isModalOpen && selectedDelivery && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-surface-container-lowest border-2 border-onyx-black p-6 sm:p-8 max-w-xl w-full flex flex-col gap-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sand-neutral pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-label-caps text-xs uppercase tracking-widest text-secondary">DELIVERY DETAILS</span>
                  <span className={`px-2 py-0.5 font-label-caps text-[10px] font-bold ${selectedDelivery.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                    {selectedDelivery.status === 'DELIVERED' ? '✓ DELIVERED' : '✕ CANCELLED'}
                  </span>
                </div>
                <h2 className="font-headline-md text-2xl sm:text-3xl text-onyx-black font-serif">{selectedDelivery.orderId}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-secondary hover:text-onyx-black transition-colors cursor-pointer"
                title="Close Modal"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Customer & Kitchen Information */}
            <div className="space-y-4 bg-surface-container-low p-4 border border-sand-neutral text-xs">
              <div>
                <span className="font-label-caps text-[10px] uppercase tracking-wider text-secondary block">KITCHEN</span>
                <div className="font-button-text text-sm text-onyx-black font-bold mt-0.5">{selectedDelivery.providerName}</div>
                <p className="font-body-md text-xs text-on-surface-variant leading-snug mt-0.5">
                  {typeof selectedDelivery.pickupAddress === 'string'
                    ? selectedDelivery.pickupAddress
                    : (selectedDelivery.pickupAddress?.street || 'Kitchen address on file')}
                </p>
              </div>

              <div className="border-t border-sand-neutral/50 pt-3">
                <span className="font-label-caps text-[10px] uppercase tracking-wider text-secondary block">CUSTOMER</span>
                <div className="font-button-text text-sm text-onyx-black font-bold mt-0.5">{selectedDelivery.customerName}</div>
                <p className="font-body-md text-xs text-on-surface-variant leading-snug mt-0.5">
                  {typeof selectedDelivery.deliveryAddress === 'string'
                    ? selectedDelivery.deliveryAddress
                    : (selectedDelivery.deliveryAddress?.street || 'Customer address on file')}
                </p>
              </div>
            </div>

            {/* Item Summary */}
            <div className="space-y-2 text-xs">
              <div className="font-label-caps text-xs uppercase tracking-wider text-secondary">ORDER</div>
              <div className="p-3 bg-surface-container-low border border-sand-neutral flex items-center justify-between font-medium">
                <span className="text-onyx-black font-semibold">{selectedDelivery.tiffinName}</span>
                <span className="font-mono text-onyx-black">× {selectedDelivery.itemCount || selectedDelivery.quantity || 1}</span>
              </div>
            </div>

            {/* Financial Calculation */}
            <div className="space-y-2 border-t border-sand-neutral pt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-sand-neutral/40">
                <span className="text-secondary uppercase tracking-wider font-label-caps text-[11px]">ORDER TOTAL</span>
                <span className="font-button-text font-bold text-onyx-black">₹{selectedDelivery.orderTotal ? selectedDelivery.orderTotal.toFixed(2) : '224.00'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-sand-neutral/40">
                <span className="text-secondary uppercase tracking-wider font-label-caps text-[11px]">DRIVER EARNINGS</span>
                <span className="font-button-text font-bold text-emerald-800">₹{selectedDelivery.driverEarning ? selectedDelivery.driverEarning.toFixed(2) : '0.00'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-sand-neutral/40">
                <span className="text-secondary uppercase tracking-wider font-label-caps text-[11px]">PAYMENT</span>
                <span className="font-button-text font-bold text-onyx-black">{selectedDelivery.paymentStatus || 'PAID'}</span>
              </div>
            </div>

            {/* Lifecycle Milestones Timeline */}
            <div className="space-y-2 text-xs">
              <div className="font-label-caps text-xs uppercase tracking-wider text-secondary">DELIVERY TIMELINE</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-surface-container-low border border-sand-neutral">
                  <span className="font-label-caps text-[10px] text-secondary block">Assigned</span>
                  <span className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(selectedDelivery.requestedAt)}</span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-sand-neutral">
                  <span className="font-label-caps text-[10px] text-secondary block">Picked Up</span>
                  <span className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(selectedDelivery.pickedUpAt || selectedDelivery.requestedAt)}</span>
                </div>
                <div className="p-2.5 bg-surface-container-low border border-sand-neutral">
                  <span className="font-label-caps text-[10px] text-secondary block">Arrived at Site</span>
                  <span className="font-button-text text-xs text-onyx-black font-medium">{formatDateTime(selectedDelivery.arrivedAt || selectedDelivery.completedAt)}</span>
                </div>
                <div className={`p-2.5 border ${selectedDelivery.status === 'DELIVERED' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <span className={`font-label-caps text-[10px] font-bold block ${selectedDelivery.status === 'DELIVERED' ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {selectedDelivery.status === 'DELIVERED' ? 'Delivered' : 'Cancelled'}
                  </span>
                  <span className="font-button-text text-xs text-onyx-black font-bold">{formatDateTime(selectedDelivery.completedAt || selectedDelivery.deliveredAt)}</span>
                </div>
              </div>
            </div>

            {/* Cancellation info if available */}
            {selectedDelivery.status === 'CANCELLED' && selectedDelivery.cancellationReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-xs space-y-1">
                <span className="font-label-caps text-[10px] text-rose-800 uppercase tracking-wider font-bold">CANCELLATION INFO</span>
                <p className="font-body-md text-xs text-rose-950 font-medium">
                  {selectedDelivery.cancellationReason}
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full py-3 bg-onyx-black text-on-primary font-button-text text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
