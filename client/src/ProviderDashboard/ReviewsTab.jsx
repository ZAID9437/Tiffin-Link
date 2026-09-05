import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCw, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Send,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingBag,
  User,
  ThumbsUp,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Phone,
  Tag,
  Check
} from 'lucide-react';
import { apiRequest } from '../services/api';

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    overallRating: '4.8',
    totalReviews: 6,
    positivePercent: 92,
    needAttentionCount: 2,
    thisMonthCount: 6,
    breakdownCounts: { 5: 4, 4: 2, 3: 0, 2: 0, 1: 0 },
    ratingDistribution: {
      5: { count: 4, percent: 67 },
      4: { count: 2, percent: 33 },
      3: { count: 0, percent: 0 },
      2: { count: 0, percent: 0 },
      1: { count: 0, percent: 0 }
    },
    tiffinPerformance: [],
    uniqueTiffins: []
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tiffinFilter, setTiffinFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Drawer & Modal States
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyModalReview, setReplyModalReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Polling for Real-Time Live Updates
  useEffect(() => {
    fetchReviewsFromDb();
    const interval = setInterval(() => {
      fetchReviewsFromDb(false);
    }, 10000); // 10s polling for real-time live sync
    return () => clearInterval(interval);
  }, [searchTerm, ratingFilter, statusFilter, tiffinFilter, dateRangeFilter, sortBy, currentPage]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchReviewsFromDb = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setErrorState(false);

      const queryParams = new URLSearchParams({
        search: searchTerm,
        rating: ratingFilter,
        status: statusFilter,
        tiffin: tiffinFilter,
        dateRange: dateRangeFilter,
        sortBy,
        page: currentPage,
        limit: 5
      });

      const json = await apiRequest(`/reviews?${queryParams.toString()}`);

      if (json.success && json.data) {
        if (Array.isArray(json.data.reviews)) {
          setReviews(json.data.reviews);
        }
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
      console.error('Error fetching reviews from DB:', err);
      setErrorState(true);
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchReviewsFromDb(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRatingFilter('All');
    setStatusFilter('All');
    setTiffinFilter('All');
    setDateRangeFilter('All');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Submit / Save Provider Reply in MongoDB
  const handleSendReply = async (reviewToReply) => {
    const target = reviewToReply || replyModalReview || selectedReview;
    if (!target || !replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const json = await apiRequest(`/reviews/${target._id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({
          providerReply: replyText.trim(),
          repliedBy: 'Mansuri Kitchen'
        })
      });

      if (json.success) {
        showToast('✓ Provider reply saved successfully in MongoDB!');
        setReplyText('');
        setReplyModalReview(null);
        if (selectedReview && selectedReview._id === target._id) {
          setSelectedReview(prev => ({
            ...prev,
            providerReply: replyText.trim(),
            repliedAt: new Date()
          }));
        }
        await fetchReviewsFromDb(false);
      } else {
        showToast(json.message || 'Failed to save reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      showToast('Error saving reply to server');
    } finally {
      setSubmittingReply(false);
    }
  };

  // CSV Export Functionality
  const handleExportCSV = () => {
    if (reviews.length === 0) {
      showToast('No reviews available to export.');
      return;
    }

    const headers = ['Customer Name', 'Phone', 'Order ID', 'Tiffin Name', 'Rating', 'Review Comment', 'Date', 'Reply Status', 'Provider Reply'];
    const rows = reviews.map(r => [
      `"${r.customerName || ''}"`,
      `"${r.customerPhone || ''}"`,
      `"${r.orderId || ''}"`,
      `"${r.tiffinName || ''}"`,
      r.rating || 5,
      `"${(r.comment || '').replace(/"/g, '""')}"`,
      `"${new Date(r.createdAt).toLocaleDateString()}"`,
      r.providerReply ? 'Replied' : 'Pending',
      `"${(r.providerReply || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TiffinLink_Reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExportModalOpen(false);
    showToast('✓ Reviews exported to CSV successfully!');
  };

  // Render Stars Helper
  const renderStars = (count, size = 14) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={size}
            className={star <= count ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  // Relative Time Helper
  const getRelativeTime = (dateInput) => {
    if (!dateInput) return 'Recently';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins || 1} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-[#111827] space-y-6 text-xs font-bold animate-slide-up">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} />
          <span className="font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* ==================== 1. PAGE HEADER ==================== */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Customers</span>
            <span>/</span>
            <span className="text-[#0A8B5F]">Reviews</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-[#111827]">Reviews & Ratings</h1>
            {/* Real-time Live Badge Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-[#0A8B5F] border border-emerald-200 text-[10px] font-extrabold rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#0A8B5F] animate-ping" />
              ● LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-0.5">
            See what customers are saying about your tiffins and service in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border border-[#E5ECE8] bg-[#F9FBF9] hover:bg-gray-100 text-[#111827] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin text-[#0A8B5F]' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Download size={14} />
            <span>Export Reviews</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. SUMMARY CARDS (4 TOP CARDS) ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Rating Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-extrabold uppercase tracking-wider">⭐ Overall Rating</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Star size={16} className="fill-amber-400" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111827]">{stats.overallRating}</span>
            <span className="text-xs font-bold text-[#6B7280]">/ 5</span>
          </div>
          <div className="flex items-center gap-2">
            {renderStars(Math.round(Number(stats.overallRating) || 5), 14)}
            <span className="text-[11px] text-[#6B7280] font-medium">({stats.totalReviews} total)</span>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-extrabold uppercase tracking-wider">💬 Total Reviews</span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <MessageSquare size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111827]">{stats.totalReviews}</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-[#0A8B5F] text-[10px] font-extrabold rounded-full border border-emerald-200">
              +{stats.thisMonthCount || 6} this month
            </span>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium">Verified diner feedback</p>
        </div>

        {/* Positive Reviews Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-extrabold uppercase tracking-wider">👍 Positive Reviews</span>
            <span className="p-2 bg-emerald-50 rounded-xl text-[#0A8B5F]">
              <ThumbsUp size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0A8B5F]">{stats.positivePercent || 92}%</span>
            <span className="text-xs font-bold text-[#6B7280]">4–5 star</span>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium">High satisfaction rate</p>
        </div>

        {/* Need Attention Card */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-extrabold uppercase tracking-wider">⚠️ Need Attention</span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${stats.needAttentionCount > 0 ? 'text-amber-600' : 'text-[#111827]'}`}>
              {stats.needAttentionCount}
            </span>
            <span className="text-xs font-bold text-[#6B7280]">Unanswered</span>
          </div>
          <p className="text-[11px] text-[#6B7280] font-medium">Awaiting provider reply</p>
        </div>
      </div>

      {/* ==================== 3. RATING BREAKDOWN CARD ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#111827]">Rating Breakdown</h3>
            <span className="text-xs text-[#6B7280] font-semibold">Distribution based on {stats.totalReviews} reviews</span>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(star => {
              const info = stats.ratingDistribution ? stats.ratingDistribution[star] : { count: 0, percent: 0 };
              const count = info?.count || 0;
              const percent = info?.percent || 0;

              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-extrabold text-[#111827]">
                    <span>{star}</span>
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        star >= 4 ? 'bg-[#0A8B5F]' : star === 3 ? 'bg-amber-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-black text-[#111827] shrink-0">
                    {count} <span className="text-[10px] text-[#6B7280] font-medium">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tiffin Performance Summary Widget */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#111827]">Tiffin Performance</h3>
            <span className="text-[10px] bg-emerald-50 text-[#0A8B5F] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
              Top Performers
            </span>
          </div>

          <div className="space-y-3">
            {stats.tiffinPerformance && stats.tiffinPerformance.length > 0 ? (
              stats.tiffinPerformance.slice(0, 4).map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9FBF9] border border-[#E5ECE8]">
                  <div className="truncate pr-2">
                    <div className="font-extrabold text-[#111827] truncate">{t.tiffinName}</div>
                    <div className="text-[10px] text-[#6B7280] font-medium">{t.reviewsCount} reviews</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black text-[#0A8B5F]">⭐ {t.rating}</span>
                    <span className="text-xs font-bold text-emerald-600">{t.trend || '↑'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-[#6B7280] text-xs">
                No tiffin performance data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 4. FILTERS & SEARCH BAR ==================== */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer, comment, order # or tiffin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
            >
              <option value="All">Rating: All</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Tiffin Filter */}
            <select
              value={tiffinFilter}
              onChange={(e) => { setTiffinFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#0A8B5F] cursor-pointer truncate"
            >
              <option value="All">Tiffin: All</option>
              {stats.uniqueTiffins && stats.uniqueTiffins.map((tName, i) => (
                <option key={i} value={tName}>{tName}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="Replied">Replied</option>
              <option value="Not Replied">Not Replied</option>
            </select>

            {/* Sort By Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          {(searchTerm || ratingFilter !== 'All' || statusFilter !== 'All' || tiffinFilter !== 'All' || dateRangeFilter !== 'All') && (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors cursor-pointer shrink-0"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ==================== 5. REVIEWS LIST SECTION ==================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#111827]">Customer Reviews</h2>
            <span className="px-2.5 py-0.5 bg-[#0A8B5F]/10 text-[#0A8B5F] text-[11px] font-extrabold rounded-full">
              {pagination.total || reviews.length} Reviews
            </span>
          </div>

          <span className="text-xs text-[#6B7280] font-semibold">
            Showing Page {pagination.page} of {pagination.totalPages}
          </span>
        </div>

        {/* State 1: Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded-md w-32" />
                  <div className="h-4 bg-gray-200 rounded-md w-20" />
                </div>
                <div className="h-3 bg-gray-200 rounded-md w-48" />
                <div className="h-12 bg-gray-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : errorState ? (
          /* State 2: Error State */
          <div className="bg-white rounded-2xl p-12 text-center border border-red-200 space-y-4">
            <AlertTriangle size={40} className="mx-auto text-red-500" />
            <h3 className="text-base font-extrabold text-[#111827]">Unable to load reviews</h3>
            <p className="text-xs text-[#6B7280]">We couldn't fetch your reviews from MongoDB right now.</p>
            <button
              onClick={() => fetchReviewsFromDb(true)}
              className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <RotateCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : reviews.length === 0 ? (
          /* State 3: Empty State */
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 text-2xl font-black shadow-xs">
              ⭐
            </div>
            <h3 className="text-base font-extrabold text-[#111827]">No reviews found</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Once customers review your tiffins, their feedback will appear here in real time. Keep serving great food! 🍱
            </p>
            {(searchTerm || ratingFilter !== 'All' || statusFilter !== 'All' || tiffinFilter !== 'All') && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* State 4: Populated Reviews List */
          <div className="space-y-4">
            {reviews.map(rev => (
              <div 
                key={rev._id || rev.id}
                className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4 hover:border-[#0A8B5F]/40 transition-all"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5ECE8] pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A8B5F]/10 text-[#0A8B5F] font-black text-sm flex items-center justify-center uppercase shrink-0">
                      {rev.customerName ? rev.customerName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-[#111827]">{rev.customerName}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-[#6B7280] text-[10px] font-extrabold rounded-md">
                          Order {rev.orderId || '#1024'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#6B7280] font-medium mt-0.5">
                        <span>Total Orders: {rev.customerTotalOrders || 12}</span>
                        <span>•</span>
                        <span>Reviews Given: {rev.customerTotalReviews || 3}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                      {renderStars(rev.rating, 14)}
                      <span className="text-xs font-black text-amber-700 ml-1">{rev.rating}.0</span>
                    </div>
                    <span className="text-xs text-[#6B7280] font-semibold flex items-center gap-1">
                      <Clock size={12} />
                      {getRelativeTime(rev.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Tiffin Tag */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-[#0A8B5F] border border-emerald-200 text-[10px] font-extrabold uppercase rounded-lg">
                    {rev.tiffinCategory || 'Gujarati'}
                  </span>
                  <span className="text-xs font-extrabold text-[#111827]">{rev.tiffinName}</span>
                </div>

                {/* Review Comment Text */}
                <p className="text-xs text-[#374151] font-medium leading-relaxed bg-[#F9FBF9] p-3.5 rounded-xl border border-[#E5ECE8]">
                  "{rev.comment}"
                </p>

                {/* Provider Reply Box (if replied) */}
                {rev.providerReply && rev.providerReply.trim() !== '' ? (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#0A8B5F] flex items-center gap-1.5">
                        <MessageSquare size={13} />
                        Provider Reply ({rev.repliedBy || 'Mansuri Kitchen'})
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-semibold">
                        {getRelativeTime(rev.repliedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#111827] font-medium">
                      "{rev.providerReply}"
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 font-semibold bg-amber-50/60 px-3 py-1.5 rounded-lg border border-amber-200/60 inline-flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    <span>Awaiting your provider reply</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5ECE8]">
                  <button
                    onClick={() => {
                      setReplyModalReview(rev);
                      setReplyText(rev.providerReply || '');
                    }}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0A8B5F] border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <MessageSquare size={14} />
                    <span>{rev.providerReply ? 'Edit Reply' : 'Reply'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedReview(rev)}
                    className="px-4 py-2 border border-[#E5ECE8] bg-[#F9FBF9] hover:bg-gray-100 text-[#111827] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== PAGINATION CONTROLS ==================== */}
        {pagination.totalPages > 1 && (
          <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex items-center justify-between">
            <span className="text-xs text-[#6B7280] font-semibold">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    currentPage === i + 1 ? 'bg-[#0A8B5F] text-white' : 'bg-gray-100 text-[#111827] hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                className="px-3 py-1.5 border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 6. REVIEW DETAILS DRAWER (RIGHT SLIDE-OVER) ==================== */}
      {selectedReview && (
        <div className="fixed inset-0 z-[999] overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedReview(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E5ECE8] flex flex-col justify-between overflow-y-auto p-6 space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-4">
                <div>
                  <h3 className="text-base font-black text-[#111827]">Review Details</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Order {selectedReview.orderId}</p>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="space-y-5">
                {/* Rating Badge Header */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-amber-800">Customer Rating</div>
                    <div className="text-2xl font-black text-amber-700">{selectedReview.rating}.0 / 5.0</div>
                  </div>
                  {renderStars(selectedReview.rating, 18)}
                </div>

                {/* Customer Info */}
                <div className="bg-[#F9FBF9] p-4 rounded-xl border border-[#E5ECE8] space-y-2">
                  <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Customer</div>
                  <div className="text-sm font-black text-[#111827]">{selectedReview.customerName}</div>
                  <div className="text-xs text-[#6B7280] font-medium flex items-center gap-2">
                    <Phone size={12} className="text-[#0A8B5F]" />
                    <span>{selectedReview.customerPhone || '+91 98250 12345'}</span>
                  </div>
                  <div className="text-xs text-[#6B7280] font-medium flex items-center gap-3 pt-1 border-t border-[#E5ECE8]">
                    <span>Total Orders: {selectedReview.customerTotalOrders || 12}</span>
                    <span>•</span>
                    <span>Reviews Given: {selectedReview.customerTotalReviews || 3}</span>
                  </div>
                </div>

                {/* Order & Tiffin Info */}
                <div className="bg-[#F9FBF9] p-4 rounded-xl border border-[#E5ECE8] space-y-2">
                  <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Order Details</div>
                  <div className="text-xs font-black text-[#111827]">{selectedReview.tiffinName}</div>
                  <div className="flex items-center justify-between text-xs text-[#6B7280] font-semibold pt-1 border-t border-[#E5ECE8]">
                    <span>Quantity: {selectedReview.orderQuantity || 2}</span>
                    <span className="font-black text-[#0A8B5F]">Amount: ₹{selectedReview.orderAmount || 240}</span>
                  </div>
                </div>

                {/* Customer Review Comment */}
                <div className="space-y-1.5">
                  <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Customer Review</div>
                  <p className="text-xs text-[#111827] font-medium bg-[#F9FBF9] p-3.5 rounded-xl border border-[#E5ECE8]">
                    "{selectedReview.comment}"
                  </p>
                </div>

                {/* Delivery & Quality Experience Ratings */}
                <div className="bg-[#F9FBF9] p-4 rounded-xl border border-[#E5ECE8] space-y-2.5">
                  <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">Delivery Experience</div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Food Quality</span>
                      {renderStars(selectedReview.foodQualityRating || selectedReview.rating, 12)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Packaging</span>
                      {renderStars(selectedReview.packagingRating || selectedReview.rating, 12)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Taste</span>
                      {renderStars(selectedReview.tasteRating || selectedReview.rating, 12)}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#111827]">Delivery Speed</span>
                      {renderStars(selectedReview.deliveryRating || 4, 12)}
                    </div>
                  </div>
                </div>

                {/* Provider Reply Section inside Drawer */}
                <div className="space-y-2 pt-2 border-t border-[#E5ECE8]">
                  <div className="text-xs font-extrabold text-[#0A8B5F] uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    <span>Provider Response</span>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Write a polite response to this customer review..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-3 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  />

                  <button
                    disabled={submittingReply || !replyText.trim()}
                    onClick={() => handleSendReply(selectedReview)}
                    className="w-full py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={14} />
                    <span>{submittingReply ? 'Saving Reply...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-[#E5ECE8] pt-4">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="w-full py-2.5 border border-[#E5ECE8] bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 7. REPLY MODAL ==================== */}
      {replyModalReview && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E5ECE8] shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-black text-[#111827]">Reply to Review</h3>
              <button
                onClick={() => setReplyModalReview(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8] space-y-1">
              <div className="text-xs font-black text-[#111827]">{replyModalReview.customerName}</div>
              <p className="text-xs text-[#6B7280] italic">"{replyModalReview.comment}"</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-[#111827]">Your Response</label>
              <textarea
                rows={4}
                placeholder="Write a polite response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReplyModalReview(null)}
                className="px-4 py-2 border border-[#E5ECE8] bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={submittingReply || !replyText.trim()}
                onClick={() => handleSendReply(replyModalReview)}
                className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>{submittingReply ? 'Saving...' : 'Send Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 8. EXPORT MODAL ==================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#E5ECE8] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-black text-[#111827]">Export Reviews</h3>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Download your verified customer ratings and reviews report formatted for analysis.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleExportCSV}
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0A8B5F] rounded-xl font-extrabold text-xs flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={16} />
                  Export as CSV (.csv)
                </span>
                <Download size={14} />
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-full py-2 bg-gray-100 text-[#111827] text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
