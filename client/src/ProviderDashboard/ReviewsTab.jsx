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
  ThumbsUp
} from 'lucide-react';

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    overallRating: '4.6',
    totalReviews: 128,
    responseRate: 92,
    ratingDistribution: {
      5: { count: 105, percent: 82 },
      4: { count: 13, percent: 10 },
      3: { count: 6, percent: 5 },
      2: { count: 3, percent: 2 },
      1: { count: 1, percent: 1 }
    },
    tiffinPerformance: [
      { tiffinName: 'Gujarati Veg Thali', reviewsCount: 42, rating: '4.8', trend: '↑' },
      { tiffinName: 'Jain Special Thali', reviewsCount: 31, rating: '4.5', trend: '→' },
      { tiffinName: 'Family Meal', reviewsCount: 27, rating: '4.2', trend: '↓' }
    ]
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [tiffinFilter, setTiffinFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Review for Side Drawer
  const [selectedReview, setSelectedReview] = useState(null);

  // Reply Modal State
  const [replyModalReview, setReplyModalReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchReviewsFromDb();
  }, [searchQuery, ratingFilter, tiffinFilter, dateRangeFilter, currentPage]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchReviewsFromDb = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        providerId: 'prov_1',
        search: searchQuery,
        rating: ratingFilter,
        tiffin: tiffinFilter,
        dateRange: dateRangeFilter,
        page: currentPage,
        limit: 5
      });

      const res = await fetch(`http://localhost:5000/api/reviews?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        if (Array.isArray(json.data.reviews)) {
          setReviews(json.data.reviews);
        }
        if (json.data.stats) {
          setStats(json.data.stats);
        }
        if (json.data.pagination) {
          setPagination(json.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit Provider Reply
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyModalReview || !replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await fetch(`http://localhost:5000/api/reviews/${replyModalReview._id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerReply: replyText.trim() })
      });
      const json = await res.json();

      if (json.success) {
        showToast('✓ Provider reply saved successfully!');
        setReplyModalReview(null);
        setReplyText('');
        if (selectedReview && selectedReview._id === replyModalReview._id) {
          setSelectedReview({ ...selectedReview, providerReply: replyText.trim(), repliedAt: new Date() });
        }
        fetchReviewsFromDb();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Helper to render Star icons
  const renderStars = (ratingNum = 5) => {
    return (
      <div className="flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }, (_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={i < ratingNum ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Customers</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Reviews</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Reviews</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0A8B5F] border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage customer feedback and monitor your tiffin quality.</p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-[#6B7280]" />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
          </div>

          {/* Rating Dropdown */}
          <select 
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">Rating: All</option>
            <option value="5">5 ★ Only</option>
            <option value="4">4 ★ Only</option>
            <option value="3">3 ★ Only</option>
            <option value="2">2 ★ Only</option>
            <option value="1">1 ★ Only</option>
          </select>

          {/* Tiffin Dropdown */}
          <select 
            value={tiffinFilter}
            onChange={e => { setTiffinFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">Tiffin: All</option>
            <option value="Gujarati">Gujarati Thali</option>
            <option value="Jain">Jain Special</option>
            <option value="Kathiyawadi">Kathiyawadi</option>
            <option value="Family">Family Meal</option>
          </select>

          {/* Refresh Button */}
          <button 
            onClick={fetchReviewsFromDb}
            className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw size={14} className="text-[#0A8B5F]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* TOP 3 SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: AVERAGE RATING */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">AVERAGE RATING</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[#111827]">{stats.overallRating || '4.6'}</span>
            <span className="text-2xl font-black text-amber-500">★</span>
          </div>
        </div>

        {/* Card 2: TOTAL REVIEWS */}
        <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">TOTAL REVIEWS</div>
          <div className="text-4xl font-black text-[#0A8B5F]">{stats.totalReviews || 128}</div>
        </div>

        {/* Card 3: RESPONSE RATE */}
        <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">RESPONSE RATE</div>
          <div className="text-4xl font-black text-indigo-600">{stats.responseRate || 92}%</div>
        </div>

      </div>

      {/* RATING BREAKDOWN SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">RATING BREAKDOWN</h2>

        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map(starNum => {
            const dist = stats.ratingDistribution?.[starNum] || { count: 0, percent: 0 };
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs font-bold">
                <div className="w-12 text-[#111827] font-black flex items-center gap-1">
                  <span>{starNum}</span>
                  <span className="text-amber-500">★</span>
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1 bg-[#F0F5F2] h-3.5 rounded-full overflow-hidden border border-[#E5ECE8]">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      starNum === 5 ? 'bg-[#0A8B5F]' :
                      starNum === 4 ? 'bg-emerald-500' :
                      starNum === 3 ? 'bg-amber-400' :
                      starNum === 2 ? 'bg-orange-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${dist.percent}%` }}
                  />
                </div>

                <div className="w-12 text-right text-[#6B7280] font-black">{dist.percent}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT REVIEWS SECTION */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">RECENT REVIEWS</h2>
          <span className="text-xs text-[#6B7280] font-bold">Page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7280] font-bold mt-3">Fetching customer reviews from MongoDB database...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare size={40} className="mx-auto text-gray-400" />
            <h3 className="text-base font-extrabold text-[#111827]">No Reviews Found</h3>
            <p className="text-xs text-[#6B7280]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5ECE8]">
            {reviews.map(rev => (
              <div 
                key={rev._id || rev.orderId}
                onClick={() => setSelectedReview(rev)}
                className="p-5 hover:bg-[#F9FBF9] transition-colors cursor-pointer space-y-3"
              >
                {/* Header: Customer Name & Rating Stars */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E8F0EC] text-[#0A8B5F] font-black text-xs flex items-center justify-center shrink-0 border border-[#C5DDD2]">
                      {rev.customerName ? rev.customerName.slice(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#111827] text-sm flex items-center gap-2">
                        <span>👤 {rev.customerName}</span>
                        <span className="text-[11px] text-[#6B7280] font-semibold">({rev.orderId})</span>
                      </div>
                      <div className="text-[11px] text-[#0A8B5F] font-semibold">{rev.tiffinName}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <span className="font-black text-[#111827] text-xs">{rev.rating}.0</span>
                    <span className="text-amber-500 text-xs">★</span>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs font-semibold text-[#374151] italic bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                  "{rev.comment}"
                </p>

                {/* Timestamp & Provider Response Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                  <div className="text-[#6B7280] font-medium flex items-center gap-1">
                    <Clock size={13} />
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Reply Status Badge */}
                    {rev.providerReply && rev.providerReply.trim() !== '' ? (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        <span>✓ Provider replied</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-extrabold">
                        Provider Reply: <span className="text-gray-500 font-bold">Not replied</span>
                      </span>
                    )}

                    {/* Action Buttons */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplyModalReview(rev);
                        setReplyText(rev.providerReply || '');
                      }}
                      className="px-3 py-1.5 bg-[#E8F0EC] hover:bg-[#D2E4DC] text-[#0A8B5F] font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare size={13} />
                      <span>{rev.providerReply ? 'View Reply' : 'Reply'}</span>
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReview(rev);
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#111827] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>View Order</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Server-Side Pagination Controls */}
        <div className="p-4 border-t border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between text-xs font-bold text-[#6B7280]">
          <div>
            Showing <span className="text-[#111827] font-black">{reviews.length}</span> of <span className="text-[#111827] font-black">{pagination.total}</span> reviews
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  currentPage === page ? 'bg-[#0A8B5F] text-white shadow-xs' : 'hover:bg-white text-[#6B7280]'
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* TIFFIN PERFORMANCE TABLE */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5ECE8] bg-[#F9FBF9]">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">TIFFIN PERFORMANCE</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#111827]">
            <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Tiffin</th>
                <th className="p-4 text-center">Reviews</th>
                <th className="p-4">Rating</th>
                <th className="p-4 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8] font-bold">
              {(stats.tiffinPerformance || []).map((tf, idx) => (
                <tr key={idx} className="hover:bg-[#F9FBF9] transition-colors">
                  <td className="p-4 font-extrabold text-[#111827]">
                    {tf.tiffinName}
                  </td>

                  <td className="p-4 text-center font-black text-sm text-[#111827]">
                    {tf.reviewsCount}
                  </td>

                  <td className="p-4 font-black text-[#0A8B5F]">
                    {tf.rating} ★
                  </td>

                  <td className="p-4 text-center font-black text-base">
                    {tf.trend === '↑' ? (
                      <span className="text-emerald-600">↑</span>
                    ) : tf.trend === '→' ? (
                      <span className="text-amber-500">→</span>
                    ) : (
                      <span className="text-red-500">↓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW DETAILS SIDE DRAWER */}
      {selectedReview && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 border-l border-[#E5ECE8] animate-slide-left space-y-5 overflow-y-auto text-xs font-bold text-[#111827]">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <h2 className="text-base font-black text-[#111827]">Review Details</h2>
              <button 
                onClick={() => setSelectedReview(null)} 
                className="p-1.5 rounded-xl border border-[#E5ECE8] hover:bg-gray-100 text-[#6B7280] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile & Rating Header */}
            <div className="flex items-center gap-3 p-4 bg-[#F9FBF9] rounded-2xl border border-[#E5ECE8]">
              <div className="w-11 h-11 rounded-full bg-[#0A8B5F] text-white font-black text-sm flex items-center justify-center shadow-md">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#111827]">{selectedReview.customerName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {renderStars(selectedReview.rating)}
                  <span className="font-black text-[#111827]">{selectedReview.rating}.0</span>
                </div>
              </div>
            </div>

            {/* Tiffin & Review Content */}
            <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
              <div className="text-xs font-black text-[#0A8B5F]">{selectedReview.tiffinName}</div>
              <p className="text-xs font-semibold text-[#374151] italic">"{selectedReview.comment}"</p>
              <div className="text-[10px] text-[#6B7280] pt-2 border-t border-[#E5ECE8]">
                {new Date(selectedReview.createdAt).toLocaleDateString()} • Order {selectedReview.orderId}
              </div>
            </div>

            {/* ORDER Summary Box */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">ORDER</h4>
              <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] flex justify-between items-center">
                <div>
                  <div className="font-black text-[#111827]">{selectedReview.tiffinName}</div>
                  <div className="text-[11px] text-emerald-700 font-extrabold mt-0.5">Delivered</div>
                </div>
                <div className="text-sm font-black text-[#0A8B5F]">₹240</div>
              </div>
            </div>

            {/* PROVIDER RESPONSE Box */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">PROVIDER RESPONSE</h4>
              
              <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-3">
                {selectedReview.providerReply ? (
                  <div>
                    <div className="text-xs font-semibold text-[#111827]">{selectedReview.providerReply}</div>
                    <div className="text-[10px] text-[#6B7280] mt-1">Replied on {new Date(selectedReview.repliedAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <div className="text-xs text-[#6B7280] italic">No response yet.</div>
                )}

                <button 
                  onClick={() => {
                    setReplyModalReview(selectedReview);
                    setReplyText(selectedReview.providerReply || '');
                  }}
                  className="w-full py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>{selectedReview.providerReply ? 'Edit Response' : 'Reply to Customer'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REPLY TO REVIEW MODAL */}
      {replyModalReview && (
        <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E5ECE8] animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-black text-[#111827]">Reply to {replyModalReview.customerName}</h3>
              <button 
                onClick={() => setReplyModalReview(null)}
                className="p-1 text-[#6B7280] hover:text-[#111827] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Review Summary */}
            <div className="bg-[#F9FBF9] p-4 rounded-xl border border-[#E5ECE8] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6B7280]">Customer Review</span>
                {renderStars(replyModalReview.rating)}
              </div>
              <p className="text-xs font-semibold text-[#374151] italic">"{replyModalReview.comment}"</p>
            </div>

            {/* Reply Form Textarea */}
            <form onSubmit={handleSendReply} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Your Response</label>
                <textarea 
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Thank you for your valuable feedback!"
                  className="w-full p-3 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5ECE8]">
                <button 
                  type="button"
                  onClick={() => setReplyModalReview(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button 
                  type="submit"
                  disabled={submittingReply}
                  className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{submittingReply ? 'Sending...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
