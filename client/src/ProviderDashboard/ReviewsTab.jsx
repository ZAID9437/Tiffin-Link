import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Search,
  RotateCw,
  Download,
  CheckCircle2,
  Clock,
  MessageSquare,
  TrendingUp,
  Heart,
  Reply,
  Edit3,
  X,
  Send,
  Calendar,
  Package,
  ShoppingBag,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Truck
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { getSocket } from '../services/socket';

export default function ReviewsTab({ currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    overallRating: '0.0',
    totalReviews: 0,
    positivePercent: 0,
    fiveStarCount: 0,
    fiveStarPercent: 0,
    repliedCount: 0,
    awaitingReplyCount: 0,
    responseRate: 0,
    totalDeliveries: 0,
    monthTrendText: 'Audited Quality Data',
    breakdownCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    ratingDistribution: {
      5: { count: 0, percent: 0 },
      4: { count: 0, percent: 0 },
      3: { count: 0, percent: 0 },
      2: { count: 0, percent: 0 },
      1: { count: 0, percent: 0 }
    },
    uniqueTiffins: []
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [replyModalReview, setReplyModalReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [viewOrderModal, setViewOrderModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch reviews from MongoDB via server API
  const fetchReviewsFromDb = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setErrorState(false);

      const params = new URLSearchParams({
        search: searchQuery.trim(),
        rating: ratingFilter,
        status: statusFilter,
        dateRange: dateRangeFilter,
        sortBy,
        page: currentPage,
        limit: 6
      });

      if (dateRangeFilter === 'Custom Date Range' && customStart && customEnd) {
        params.append('startDate', customStart);
        params.append('endDate', customEnd);
      }

      const res = await apiRequest(`/reviews?${params.toString()}`);
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success && json.data) {
        setReviews(Array.isArray(json.data.reviews) ? json.data.reviews : []);
        if (json.data.stats) {
          setStats(prev => ({ ...prev, ...json.data.stats }));
        }
        if (json.data.pagination) {
          setPagination(json.data.pagination);
        }
      } else {
        setErrorState(true);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setErrorState(true);
    } finally {
      if (showLoading) setLoading(false);
      setIsSyncing(false);
    }
  };

  // Trigger fetch when filters or pagination change
  useEffect(() => {
    if (currentUser) {
      fetchReviewsFromDb(true);
    }
  }, [
    currentUser,
    ratingFilter,
    statusFilter,
    dateRangeFilter,
    customStart,
    customEnd,
    sortBy,
    currentPage
  ]);

  // Debounced search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentUser) {
        setCurrentPage(1);
        fetchReviewsFromDb(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Socket.IO Listener for real-time review replies & live sync
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
      if (socket && currentUser) {
        const pId = currentUser?.providerId || currentUser?._id || currentUser?.id;
        if (pId) {
          socket.emit('join:provider', { providerId: String(pId) });
          socket.on('review:replied', () => {
            fetchReviewsFromDb(false);
          });
        }
      }
    } catch (err) {}

    return () => {
      if (socket) {
        socket.off('review:replied');
      }
    };
  }, [currentUser]);

  // Manual Live Sync
  const handleLiveSync = () => {
    setIsSyncing(true);
    fetchReviewsFromDb(true);
    showToast('Telemetry refreshed from MongoDB database.');
  };

  // Open Reply Modal
  const handleOpenReplyModal = (review) => {
    setReplyModalReview(review);
    setReplyText(review.providerReply || '');
  };

  // Submit Provider Reply
  const handleSubmitReply = async (e) => {
    e?.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;

    if (replyText.trim().length > 1000) {
      showToast('Reply must be within 1000 characters.');
      return;
    }

    try {
      setSubmittingReply(true);
      const res = await apiRequest(`/reviews/${replyModalReview._id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({
          providerReply: replyText.trim(),
          repliedBy: currentUser?.businessName || currentUser?.name || 'Mansuri Kitchen'
        })
      });

      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        showToast('✓ Official reply published successfully!');
        setReplyModalReview(null);
        setReplyText('');
        // Refresh reviews and statistics from DB
        fetchReviewsFromDb(false);
      } else {
        showToast(json?.message || 'Failed to submit reply. Please retry.');
      }
    } catch (err) {
      console.error('Error saving review reply:', err);
      showToast('Error communicating with database server.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (reviews.length === 0) {
      showToast('No reviews available in current filter to export.');
      return;
    }

    const headers = [
      'Review ID',
      'Order ID',
      'Customer Name',
      'Customer Phone',
      'Tiffin Plan',
      'Rating',
      'Comment',
      'Created Date',
      'Replied Status',
      'Provider Reply',
      'Replied Date'
    ];

    const rows = reviews.map(r => [
      `"${r._id || ''}"`,
      `"${r.orderId || ''}"`,
      `"${(r.customerName || '').replace(/"/g, '""')}"`,
      `"${r.customerPhone || ''}"`,
      `"${(r.tiffinName || '').replace(/"/g, '""')}"`,
      r.rating || 5,
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      `"${r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : ''}"`,
      r.providerReply ? 'Replied' : 'Awaiting Reply',
      `"${(r.providerReply || '').replace(/"/g, '""')}"`,
      `"${r.repliedAt ? new Date(r.repliedAt).toLocaleString('en-IN') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TiffinLink_Reviews_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Reviews CSV exported successfully.');
  };

  // Star Rating Component
  const renderStars = (ratingNum, size = 16) => {
    const val = Number(ratingNum) || 0;
    return (
      <div className="flex items-center text-[#c95e32]">
        {[1, 2, 3, 4, 5].map(starIndex => {
          const filled = val >= starIndex;
          const half = !filled && val >= starIndex - 0.5;
          return (
            <span key={starIndex} className="inline-block">
              {filled ? (
                <Star size={size} className="fill-[#c95e32] text-[#c95e32]" />
              ) : half ? (
                <span className="relative inline-block" style={{ width: size, height: size }}>
                  <Star size={size} className="text-[#c95e32]/30" />
                  <span className="absolute top-0 left-0 overflow-hidden w-1/2">
                    <Star size={size} className="fill-[#c95e32] text-[#c95e32]" />
                  </span>
                </span>
              ) : (
                <Star size={size} className="text-[#e4dfd7]" />
              )}
            </span>
          );
        })}
      </div>
    );
  };

  // Format Date Helper
  const formatReviewDate = (dateVal) => {
    if (!dateVal) return 'Recently';
    const d = new Date(dateVal);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  };

  return (
    <div className="w-full space-y-8 animate-fade-in font-sans text-[#1a1a1a]">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white px-5 py-3 rounded shadow-2xl text-xs font-mono flex items-center gap-2 border border-[#4a4a46] animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* A. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e4dfd7] pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#8c887b] mb-1">
            CUSTOMER EXPERIENCE // AUDIT &amp; QUALITY ASSURANCE
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a] tracking-tight">
            Ratings &amp; Reviews
          </h1>
          <p className="text-sm text-[#5a5955] mt-1.5 max-w-xl">
            Understand customer feedback and improve your culinary service. Real-time telemetry synchronized with MongoDB collection{' '}
            <code className="text-xs font-mono text-[#1a1a1a] bg-[#ece8e0] px-1 py-0.5 rounded">
              reviews
            </code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#1a1a1a] text-xs font-medium text-[#1a1a1a] bg-transparent hover:bg-[#ece8e0] transition-colors rounded cursor-pointer"
          >
            <Download size={15} />
            <span>Export Reviews (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handleLiveSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-xs font-medium text-white hover:bg-neutral-800 transition-colors rounded cursor-pointer disabled:opacity-60"
          >
            <RotateCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {/* B. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Average Rating */}
        <div className="bg-white border border-[#e4dfd7] p-5 rounded relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#71716b]">
            <span>AVERAGE RATING</span>
            <Star size={18} className="text-[#c95e32] fill-[#c95e32]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a]">
              {stats.overallRating || '0.0'}
            </span>
            <div className="flex items-center">
              {renderStars(stats.overallRating, 16)}
            </div>
          </div>
          <p className="mt-2 text-xs text-[#71716b]">
            Based on actual audited reviews across all tiffin plans
          </p>
          <div className="mt-3 text-[10px] font-mono text-emerald-700 flex items-center gap-1">
            <TrendingUp size={13} />
            <span>{stats.monthTrendText || '+0.2 vs last month'}</span>
          </div>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="bg-white border border-[#e4dfd7] p-5 rounded shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#71716b]">
            <span>TOTAL REVIEWS</span>
            <MessageSquare size={18} className="text-[#1a1a1a]" />
          </div>
          <div className="mt-3">
            <span className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a]">
              {stats.totalReviews || 0}
            </span>
          </div>
          <p className="mt-2 text-xs text-[#71716b]">
            Total verified reviews received from delivered orders
          </p>
          <div className="mt-3 text-[10px] font-mono text-[#71716b]">
            <span>{stats.totalDeliveries || 0} verified meal deliveries</span>
          </div>
        </div>

        {/* Card 3: 5-Star Ratings */}
        <div className="bg-white border border-[#e4dfd7] p-5 rounded shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#71716b]">
            <span>5-STAR RATINGS</span>
            <CheckCircle2 size={18} className="text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a]">
              {stats.fiveStarCount || 0}
            </span>
            <span className="text-xs font-mono text-[#71716b]">
              ({stats.fiveStarPercent || 0}%)
            </span>
          </div>
          <p className="mt-2 text-xs text-[#71716b]">
            Highest customer satisfaction and taste consistency
          </p>
          <div className="mt-3 text-[10px] font-mono text-emerald-700 flex items-center gap-1">
            <Heart size={13} className="fill-emerald-600 text-emerald-600" />
            <span>Top tier home atelier rating</span>
          </div>
        </div>

        {/* Card 4: Response Rate */}
        <div className="bg-white border border-[#e4dfd7] p-5 rounded shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#71716b]">
            <span>RESPONSE RATE</span>
            <Reply size={18} className="text-blue-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a]">
              {stats.responseRate || 0}%
            </span>
            <span className="text-xs font-mono text-[#71716b]">
              {stats.repliedCount || 0} replied
            </span>
          </div>
          <p className="mt-2 text-xs text-[#71716b]">
            Reviews replied by provider within 24hr SLA
          </p>
          <div className={`mt-3 text-[10px] font-mono flex items-center gap-1 ${
            (stats.awaitingReplyCount || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            <Clock size={13} />
            <span>
              {(stats.awaitingReplyCount || 0) > 0
                ? `${stats.awaitingReplyCount} awaiting your reply`
                : 'All reviews responded'}
            </span>
          </div>
        </div>

      </div>

      {/* C. Rating Distribution Section */}
      <div className="bg-white border border-[#e4dfd7] p-6 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f2efe9] pb-4 mb-5">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1a1a1a]">Rating Distribution</h2>
            <p className="text-xs text-[#71716b]">Real-time frequency histogram aggregated from MongoDB provider records</p>
          </div>
          <span className="text-[11px] font-mono text-[#71716b] bg-[#f7f4ee] px-2.5 py-1 rounded border border-[#e4dfd7]">
            AGGREGATION: 100% AUDITED
          </span>
        </div>

        <div className="space-y-3 max-w-3xl">
          {[
            { star: 5, label: '★★★★★ (5)', count: stats.breakdownCounts?.[5] || 0, percent: stats.ratingDistribution?.[5]?.percent || 0, color: 'bg-[#1a1a1a]' },
            { star: 4, label: '★★★★☆ (4)', count: stats.breakdownCounts?.[4] || 0, percent: stats.ratingDistribution?.[4]?.percent || 0, color: 'bg-[#4a4a46]' },
            { star: 3, label: '★★★☆☆ (3)', count: stats.breakdownCounts?.[3] || 0, percent: stats.ratingDistribution?.[3]?.percent || 0, color: 'bg-[#8c887b]' },
            { star: 2, label: '★★☆☆☆ (2)', count: stats.breakdownCounts?.[2] || 0, percent: stats.ratingDistribution?.[2]?.percent || 0, color: 'bg-[#c95e32]' },
            { star: 1, label: '★☆☆☆☆ (1)', count: stats.breakdownCounts?.[1] || 0, percent: stats.ratingDistribution?.[1]?.percent || 0, color: 'bg-rose-700' }
          ].map(row => (
            <div key={row.star} className="flex items-center gap-4 text-xs">
              <div className="w-24 flex items-center gap-1 shrink-0 font-medium text-[#1a1a1a]">
                <span className="text-amber-500 font-serif">{row.label.split(' ')[0]}</span>
                <span className="text-[11px] text-[#71716b]">{row.label.split(' ')[1]}</span>
              </div>
              <div className="flex-1 bg-[#f2efe9] h-2.5 rounded-full overflow-hidden">
                <div
                  className={`${row.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, row.percent))}%` }}
                />
              </div>
              <div className="w-24 text-right font-mono text-xs text-[#1a1a1a] font-medium">
                {row.count} <span className="text-[#71716b] text-[11px] font-normal">({row.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* D. Search & Filters Container */}
      <div className="bg-white border border-[#e4dfd7] p-5 rounded space-y-4 shadow-sm">

        {/* Search bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71716b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews, customers, order ID (e.g. #TL-8421, Rahul Patel)..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f5] border border-[#e4dfd7] rounded text-xs text-[#1a1a1a] placeholder-[#8c887b] focus:outline-none focus:border-[#1a1a1a] transition-colors"
          />
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* Rating Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#71716b] mb-1">Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#fbf9f5] border border-[#e4dfd7] text-xs px-3 py-2 rounded text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] cursor-pointer"
            >
              <option value="All">All Ratings (1 - 5 ★)</option>
              <option value="5">5 Stars ({stats.breakdownCounts?.[5] || 0})</option>
              <option value="4">4 Stars ({stats.breakdownCounts?.[4] || 0})</option>
              <option value="3">3 Stars ({stats.breakdownCounts?.[3] || 0})</option>
              <option value="2">2 Stars ({stats.breakdownCounts?.[2] || 0})</option>
              <option value="1">1 Star ({stats.breakdownCounts?.[1] || 0})</option>
            </select>
          </div>

          {/* Response Status Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#71716b] mb-1">Response Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#fbf9f5] border border-[#e4dfd7] text-xs px-3 py-2 rounded text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Awaiting Reply">Awaiting Reply ({stats.awaitingReplyCount || 0})</option>
              <option value="Replied">Replied ({stats.repliedCount || 0})</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#71716b] mb-1">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => { setDateRangeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#fbf9f5] border border-[#e4dfd7] text-xs px-3 py-2 rounded text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] cursor-pointer"
            >
              <option value="All">All Time</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
              <option value="Today">Today</option>
              <option value="Custom Date Range">Custom Date Range</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#71716b] mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#fbf9f5] border border-[#e4dfd7] text-xs px-3 py-2 rounded text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating (5 → 1)</option>
              <option value="lowest">Lowest Rating (1 → 5)</option>
            </select>
          </div>

        </div>

        {/* Custom Date Range Picker */}
        {dateRangeFilter === 'Custom Date Range' && (
          <div className="flex items-center gap-3 pt-2 border-t border-[#f2efe9] text-xs font-mono">
            <span className="text-[#71716b]">Date Span:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-[#fbf9f5] border border-[#e4dfd7] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#1a1a1a]"
            />
            <span className="text-[#71716b]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[#fbf9f5] border border-[#e4dfd7] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
        )}

        {/* Quick Tag Toggles */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#f2efe9]">
          <span className="text-[11px] font-mono text-[#71716b] mr-2">Quick View:</span>
          <button
            type="button"
            onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}
            className={`px-3 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
              statusFilter === 'All'
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-[#f7f4ee] hover:bg-[#ece8e0] text-[#1a1a1a] border border-[#e4dfd7]'
            }`}
          >
            All Reviews ({stats.totalReviews || 0})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('Replied'); setCurrentPage(1); }}
            className={`px-3 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
              statusFilter === 'Replied'
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-[#f7f4ee] hover:bg-[#ece8e0] text-[#1a1a1a] border border-[#e4dfd7]'
            }`}
          >
            Replied ({stats.repliedCount || 0})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('Awaiting Reply'); setCurrentPage(1); }}
            className={`px-3 py-1 text-xs rounded font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              statusFilter === 'Awaiting Reply'
                ? 'bg-[#c95e32] text-white'
                : 'bg-[#f7f4ee] hover:bg-[#ece8e0] text-[#c95e32] border border-[#e4dfd7]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'Awaiting Reply' ? 'bg-white' : 'bg-[#c95e32]'}`} />
            Awaiting Reply ({stats.awaitingReplyCount || 0})
          </button>
        </div>

      </div>

      {/* E. Customer Reviews List */}
      <div className="space-y-4">

        <div className="flex items-center justify-between text-xs text-[#71716b] px-1 font-mono">
          <span>
            {pagination.total > 0
              ? `SHOWING ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} OF ${pagination.total} REVIEWS`
              : 'SHOWING 0 REVIEWS'}
          </span>
          <span>
            PAGE {pagination.page} OF {pagination.totalPages} // SERVER-SIDE PAGINATED
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(sk => (
              <div key={sk} className="bg-white border border-[#e4dfd7] p-6 rounded space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-[#ece8e0] rounded w-32" />
                  <div className="h-4 bg-[#ece8e0] rounded w-24" />
                </div>
                <div className="h-4 bg-[#ece8e0] rounded w-48" />
                <div className="h-16 bg-[#f7f4ee] rounded w-full" />
                <div className="h-8 bg-[#ece8e0] rounded w-40" />
              </div>
            ))}
          </div>
        ) : errorState ? (
          /* Error State */
          <div className="bg-white border border-rose-300 p-8 rounded text-center space-y-3">
            <AlertCircle size={32} className="mx-auto text-rose-600" />
            <h3 className="text-base font-serif font-bold text-[#1a1a1a]">Unable to Load Reviews</h3>
            <p className="text-xs text-[#71716b] max-w-md mx-auto">
              There was an issue communicating with the MongoDB cluster. Please check connection and retry.
            </p>
            <button
              type="button"
              onClick={() => fetchReviewsFromDb(true)}
              className="px-4 py-2 bg-[#1a1a1a] text-white text-xs rounded hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Retry Database Fetch
            </button>
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-[#e4dfd7] p-12 rounded text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-[#f7f4ee] rounded-full flex items-center justify-center text-[#71716b]">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1a1a1a]">No Reviews Found</h3>
            <p className="text-xs text-[#71716b] max-w-sm mx-auto">
              No diner feedback matches your selected filters or search criteria. Try modifying your criteria or checking all reviews.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('All');
                setStatusFilter('All');
                setDateRangeFilter('All');
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-[#1a1a1a] text-xs font-medium text-[#1a1a1a] hover:bg-[#ece8e0] rounded transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Render Review Cards */
          reviews.map((review) => {
            const hasReply = Boolean(review.providerReply && review.providerReply.trim() !== '');

            return (
              <div
                key={review._id}
                className="bg-white border border-[#e4dfd7] p-6 rounded hover:border-[#8c887b] transition-colors space-y-4 shadow-sm"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {renderStars(review.rating, 18)}
                    <span className="text-sm font-serif font-bold text-[#1a1a1a]">
                      {Number(review.rating).toFixed(1)}
                    </span>
                    {review.isVerifiedOrder && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-700" />
                        Verified Order
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-[#71716b]">
                    {formatReviewDate(review.createdAt)}
                  </div>
                </div>

                {/* Customer Details Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <span className="font-semibold text-[#1a1a1a]">
                      {review.customerName || 'Verified Diner'}
                    </span>
                    <span className="text-[#71716b] ml-2">
                      {review.customerLocation || 'Ahmedabad'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#71716b]">
                    Order: <span className="text-[#1a1a1a] font-medium">{review.orderId || '#TL-XXXX'}</span>
                    {' • '}
                    <span>{review.tiffinName || 'Gujarati Homestyle Thali'}</span>
                  </div>
                </div>

                {/* Review Quote Block */}
                <div className="p-4 bg-[#fbf9f5] border-l-2 border-[#1a1a1a] rounded-r">
                  <p className="text-sm text-[#1a1a1a] leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>

                {/* Nested Provider Response if exists */}
                {hasReply && (
                  <div className="ml-4 sm:ml-8 p-4 bg-[#f7f4ee] border border-[#e4dfd7] rounded space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1a1a1a]">
                          {review.repliedBy || currentUser?.businessName || 'Mansuri Kitchen'} (Provider Response)
                        </span>
                        <span className="text-[10px] font-mono bg-[#ece8e0] text-[#4a4a46] px-1.5 py-0.5 rounded">
                          OFFICIAL REPLY
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#71716b]">
                        {formatReviewDate(review.repliedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#4a4a46] leading-relaxed">
                      "{review.providerReply}"
                    </p>
                  </div>
                )}

                {/* Actions & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#f2efe9]">
                  <div className="flex items-center gap-3">
                    {hasReply ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                        ✓ Replied
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                        ● Awaiting Reply
                      </span>
                    )}

                    {review.deliveryCourier && (
                      <span className="text-[11px] text-[#71716b] flex items-center gap-1">
                        <Truck size={12} />
                        Courier: {review.deliveryCourier}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {review.orderDetails && (
                      <button
                        type="button"
                        onClick={() => setViewOrderModal(review.orderDetails)}
                        className="px-3 py-1.5 text-xs text-[#1a1a1a] hover:bg-[#ece8e0] rounded border border-[#e4dfd7] transition-colors font-medium cursor-pointer"
                      >
                        View Order
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenReplyModal(review)}
                      className={`px-3 py-1.5 text-xs rounded transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
                        hasReply
                          ? 'text-[#1a1a1a] hover:bg-[#ece8e0] border border-[#e4dfd7]'
                          : 'bg-[#1a1a1a] text-white hover:bg-neutral-800'
                      }`}
                    >
                      {hasReply ? <Edit3 size={13} /> : <Reply size={13} />}
                      <span>{hasReply ? 'Edit Reply' : 'Reply to Review'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}

      </div>

      {/* Server-Side Pagination Bar */}
      {pagination.totalPages > 1 && (
        <div className="bg-white border border-[#e4dfd7] p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs text-[#71716b] font-mono">
            Showing{' '}
            <span className="text-[#1a1a1a] font-semibold">
              {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="text-[#1a1a1a] font-semibold">{pagination.total}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 text-xs border border-[#e4dfd7] rounded text-[#71716b] hover:bg-[#fbf9f5] disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => {
              if (
                p === 1 ||
                p === pagination.totalPages ||
                (p >= pagination.page - 1 && p <= pagination.page + 1)
              ) {
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 text-xs rounded font-medium cursor-pointer transition-colors ${
                      pagination.page === p
                        ? 'bg-[#1a1a1a] text-white'
                        : 'border border-[#e4dfd7] text-[#1a1a1a] hover:bg-[#ece8e0]'
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (p === pagination.page - 2 || p === pagination.page + 2) {
                return <span key={p} className="text-xs text-[#71716b] px-1">...</span>;
              }
              return null;
            })}

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              className="px-3 py-1.5 text-xs border border-[#e4dfd7] rounded text-[#1a1a1a] hover:bg-[#ece8e0] disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* F. Reply to Review Modal */}
      {replyModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#1a1a1a] shadow-2xl rounded-lg max-w-lg w-full overflow-hidden animate-scale-up">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e4dfd7] bg-[#fbf9f5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1a1a1a]">Reply to Customer Review</h3>
                <p className="text-[11px] font-mono text-[#71716b]">
                  Order {replyModalReview.orderId || '#TL-XXXX'} • {replyModalReview.customerName || 'Verified Diner'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalReview(null)}
                className="text-[#71716b] hover:text-[#1a1a1a] p-1 rounded transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReply} className="p-6 space-y-4">

              {/* Customer Rating & Review Snippet */}
              <div className="p-3.5 bg-[#f7f4ee] border border-[#e4dfd7] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {renderStars(replyModalReview.rating, 16)}
                    <span className="text-xs font-serif font-bold text-[#1a1a1a]">
                      {Number(replyModalReview.rating).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#71716b]">
                    Received {formatReviewDate(replyModalReview.createdAt)}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase text-[#71716b]">Customer Review:</p>
                  <p className="text-xs text-[#1a1a1a] italic mt-0.5 leading-relaxed">
                    "{replyModalReview.comment}"
                  </p>
                </div>
              </div>

              {/* Provider Response Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="responseTextarea" className="block text-xs font-medium text-[#1a1a1a]">
                    Your Response <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#71716b]">
                    {replyText.length} / 1000
                  </span>
                </div>
                <textarea
                  id="responseTextarea"
                  rows={5}
                  maxLength={1000}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a courteous, professional response acknowledging the customer's experience, kitchen preparation standards, or addressing any constructive suggestions..."
                  className="w-full p-3 bg-[#fbf9f5] border border-[#e4dfd7] rounded text-xs text-[#1a1a1a] placeholder-[#8c887b] focus:outline-none focus:border-[#1a1a1a] transition-colors leading-relaxed"
                />
              </div>

              <div className="flex items-start gap-2 text-[11px] text-[#71716b] bg-[#fbf9f5] p-2.5 rounded border border-[#e4dfd7]">
                <AlertCircle size={16} className="text-blue-700 shrink-0 mt-0.5" />
                <span>
                  Your reply will be published publicly beneath the customer review on the TiffinLink marketplace and saved in MongoDB.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#f2efe9]">
                <button
                  type="button"
                  onClick={() => setReplyModalReview(null)}
                  className="px-4 py-2 border border-[#e4dfd7] text-xs font-medium text-[#1a1a1a] hover:bg-[#ece8e0] rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-4 py-2 bg-[#1a1a1a] text-xs font-medium text-white hover:bg-neutral-800 rounded transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} className={submittingReply ? 'animate-pulse' : ''} />
                  <span>{submittingReply ? 'Saving to DB...' : 'Submit Reply'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#1a1a1a] shadow-2xl rounded-lg max-w-lg w-full overflow-hidden animate-scale-up">

            <div className="px-6 py-4 border-b border-[#e4dfd7] bg-[#fbf9f5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1a1a1a]">Order Details</h3>
                <p className="text-[11px] font-mono text-[#71716b]">Order #{viewOrderModal.orderId}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewOrderModal(null)}
                className="text-[#71716b] hover:text-[#1a1a1a] p-1 rounded transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f7f4ee] p-3 rounded border border-[#e4dfd7]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#71716b]">Customer</span>
                  <p className="font-semibold text-[#1a1a1a]">{viewOrderModal.customerName}</p>
                  <p className="text-[#71716b] text-[11px]">{viewOrderModal.customerPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#71716b]">Status</span>
                  <p className="font-semibold text-emerald-800">{viewOrderModal.status || 'Completed'}</p>
                  <p className="text-[#71716b] text-[11px]">{viewOrderModal.deliverySlot || 'Lunch Slot'}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#71716b]">Delivery Address</span>
                <p className="text-[#1a1a1a] mt-0.5 leading-relaxed bg-[#fbf9f5] p-2.5 rounded border border-[#e4dfd7]">
                  {viewOrderModal.customerAddress || 'Ahmedabad, Gujarat'}
                </p>
              </div>

              {viewOrderModal.items && viewOrderModal.items.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#71716b]">Ordered Items</span>
                  <div className="mt-1 divide-y divide-[#f2efe9] border border-[#e4dfd7] rounded overflow-hidden">
                    {viewOrderModal.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between bg-white text-xs">
                        <span>{item.name || 'Kathiyawadi Thali'} × {item.quantity || 1}</span>
                        <span className="font-mono font-medium">₹{item.price || item.totalPrice || 120}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#f2efe9] font-mono">
                <span className="text-xs text-[#71716b]">TOTAL BILLED</span>
                <span className="text-base font-bold text-[#1a1a1a]">₹{viewOrderModal.totalAmount || 240}</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#fbf9f5] border-t border-[#e4dfd7] flex justify-end">
              <button
                type="button"
                onClick={() => setViewOrderModal(null)}
                className="px-4 py-1.5 bg-[#1a1a1a] text-white text-xs rounded hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
