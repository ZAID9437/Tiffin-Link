import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  RotateCw, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  User, 
  ChefHat, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    overallRating: '4.7',
    totalReviews: 5,
    fiveStarCount: 3,
    responseRate: 80,
    ratingDistribution: { 5: 3, 4: 1, 3: 1, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [tiffinFilter, setTiffinFilter] = useState('All');
  const [responseFilter, setResponseFilter] = useState('All');

  // Modal & Reply States
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReviewsFromDb();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchReviewsFromDb = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/reviews');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReviews(json.data.map(r => ({
          ...r,
          id: r._id || r.id
        })));
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedReview) return;
    try {
      setSubmittingReply(true);
      const res = await fetch(`http://localhost:5000/api/reviews/${selectedReview.id || selectedReview._id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerReply: replyText.trim() })
      });
      const json = await res.json();
      if (json.success) {
        showToast('✓ Provider reply saved to MongoDB database!');
        setReplyText('');
        setSelectedReview(null);
        fetchReviewsFromDb();
      } else {
        alert(json.message || 'Failed to save reply');
      }
    } catch (err) {
      console.error('Error saving provider reply:', err);
      alert('Server error saving reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Extract unique tiffins for filter
  const uniqueTiffins = Array.from(new Set(reviews.map(r => r.tiffinName))).filter(Boolean);

  // Filtering Logic
  const filteredReviews = reviews.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      r.customerName.toLowerCase().includes(q) ||
      r.tiffinName.toLowerCase().includes(q) ||
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.orderId && r.orderId.toLowerCase().includes(q));

    const matchesRating = ratingFilter === 'All' || r.rating === Number(ratingFilter);
    const matchesTiffin = tiffinFilter === 'All' || r.tiffinName === tiffinFilter;
    const matchesResponse = responseFilter === 'All' || 
      (responseFilter === 'Replied' && r.providerReply && r.providerReply.trim() !== '') ||
      (responseFilter === 'Unreplied' && (!r.providerReply || r.providerReply.trim() === ''));

    return matchesSearch && matchesRating && matchesTiffin && matchesResponse;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const dist = stats.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalDistCount = Object.values(dist).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6 animate-slide-up relative text-xs font-bold text-[#111827]">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={17} />
          <span className="font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Reviews</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Customer Reviews</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">See what customers are saying about your tiffins and service.</p>
        </div>

        <button 
          onClick={() => { fetchReviewsFromDb(); showToast('✓ Refreshed reviews from MongoDB!'); }}
          className="px-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RotateCw size={14} className="text-[#0A8B5F]" />
          <span>Refresh Reviews</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Overall Rating */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">OVERALL RATING</span>
            <Star size={17} className="text-amber-500 fill-amber-400" />
          </div>
          <div className="text-3xl font-black text-[#111827] flex items-baseline gap-1">
            <span>{stats.overallRating} ★</span>
            <span className="text-xs text-[#6B7280] font-bold">out of 5</span>
          </div>
          <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Based on MongoDB customer feedback</p>
        </div>

        {/* Card 2: Total Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">TOTAL REVIEWS</span>
            <MessageSquare size={17} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{stats.totalReviews}</div>
          <p className="text-[11px] text-indigo-700 font-semibold mt-1">Diner reviews received</p>
        </div>

        {/* Card 3: 5 Star Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">5 STAR REVIEWS</span>
            <TrendingUp size={17} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{stats.fiveStarCount}</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Excellent ratings</p>
        </div>

        {/* Card 4: Response Rate */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">RESPONSE RATE</span>
            <Percent size={17} className="text-[#0A8B5F]" />
          </div>
          <div className="text-3xl font-black text-[#0A8B5F]">{stats.responseRate}%</div>
          <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Provider replies sent</p>
        </div>

      </div>

      {/* RATING DISTRIBUTION BARS SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#6B7280]">Rating Distribution Breakdown</h3>
        
        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star] || 0;
            const pct = Math.round((count / totalDistCount) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-xs font-bold">
                <span className="w-10 text-[#111827] font-black flex items-center gap-1">
                  <span>{star}</span>
                  <Star size={12} className="fill-amber-400 text-amber-500" />
                </span>
                
                <div className="flex-1 bg-[#F9FBF9] border border-[#E5ECE8] h-3 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="bg-[#0A8B5F] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>

                <span className="w-12 text-right text-[#6B7280] font-black">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Multi-Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-wrap gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
          <input 
            type="text" 
            placeholder="Search reviews, customer, or order ID..." 
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select 
            value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select 
            value={tiffinFilter}
            onChange={e => { setTiffinFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">All Tiffins</option>
            {uniqueTiffins.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select 
            value={responseFilter}
            onChange={e => { setResponseFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">All Reviews</option>
            <option value="Replied">Replied</option>
            <option value="Unreplied">Unreplied</option>
          </select>

        </div>
      </div>

      {/* Reviews Data Table */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7280] font-bold mt-3">Loading customer reviews from MongoDB...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare size={40} className="mx-auto text-gray-400" />
            <h3 className="text-base font-extrabold text-[#111827]">No Reviews Found</h3>
            <p className="text-xs text-[#6B7280]">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Tiffin</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Review Comment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECE8] font-bold">
                {paginatedReviews.map(rev => (
                  <tr 
                    key={rev.id || rev._id} 
                    onClick={() => { setSelectedReview(rev); setReplyText(rev.providerReply || ''); }}
                    className="hover:bg-[#F9FBF9] transition-colors cursor-pointer"
                  >
                    {/* Customer */}
                    <td className="p-4">
                      <div className="font-extrabold text-[#111827] text-sm">{rev.customerName}</div>
                      <div className="text-[10px] text-[#6B7280]">{rev.orderId}</div>
                    </td>

                    {/* Tiffin */}
                    <td className="p-4">
                      <div className="font-extrabold text-[#111827]">{rev.tiffinName}</div>
                      <div className="text-[10px] text-[#0A8B5F] font-semibold">{rev.tiffinCategory}</div>
                    </td>

                    {/* Rating Stars */}
                    <td className="p-4">
                      <div className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={14} className="fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                    </td>

                    {/* Review Snippet */}
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-[#111827] font-medium truncate">"{rev.comment}"</p>
                      {rev.providerReply && (
                        <span className="text-[10px] text-[#0A8B5F] font-extrabold block mt-0.5">
                          ✓ Replied by Kitchen
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-[#6B7280] font-medium">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReview(rev);
                          setReplyText(rev.providerReply || '');
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ml-auto ${
                          rev.providerReply 
                            ? 'bg-[#E8F0EC] text-[#0A8B5F] hover:bg-[#D2E4DC]' 
                            : 'bg-[#0A8B5F] text-white hover:bg-[#08734E]'
                        }`}
                      >
                        <MessageCircle size={14} />
                        <span>{rev.providerReply ? 'View Reply' : 'Reply'}</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E5ECE8] bg-[#F9FBF9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#6B7280]">
          <div>
            Showing <span className="text-[#111827] font-black">{Math.min(filteredReviews.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-[#111827] font-black">{Math.min(filteredReviews.length, currentPage * itemsPerPage)}</span> of <span className="text-[#111827] font-black">{filteredReviews.length}</span> reviews
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* REVIEW DETAILS & PROVIDER REPLY MODAL */}
      {selectedReview && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-5 text-xs font-bold text-[#111827]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#E5ECE8] pb-3">
              <div>
                <h2 className="text-base font-black text-[#111827]">Review Details</h2>
                <span className="text-xs text-[#0A8B5F] font-bold">Order {selectedReview.orderId}</span>
              </div>

              <button 
                onClick={() => setSelectedReview(null)} 
                className="p-1.5 rounded-xl border border-[#E5ECE8] hover:bg-gray-100 text-[#6B7280] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Review Info */}
            <div className="space-y-3 bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0A8B5F] text-white font-black text-xs flex items-center justify-center">
                    {selectedReview.customerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#111827]">{selectedReview.customerName}</div>
                    <div className="text-[10px] text-[#6B7280]">{selectedReview.tiffinName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: selectedReview.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-500" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#111827] font-medium leading-relaxed italic bg-white p-3 rounded-xl border border-[#E5ECE8]">
                "{selectedReview.comment}"
              </p>

              <div className="text-[10px] text-[#6B7280] font-semibold text-right">
                Reviewed on {new Date(selectedReview.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Provider Reply Section */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-[#0A8B5F] flex items-center gap-1.5">
                <MessageCircle size={15} />
                <span>Provider Reply</span>
              </div>

              {selectedReview.providerReply ? (
                <div className="bg-[#E8F0EC] p-3.5 rounded-2xl border border-[#C5DDD2] space-y-1">
                  <div className="text-xs font-bold text-[#111827]">Your Response:</div>
                  <p className="text-xs text-[#0A8B5F] font-semibold">"{selectedReview.providerReply}"</p>
                  {selectedReview.repliedAt && (
                    <div className="text-[10px] text-[#6B7280] text-right pt-1">
                      Replied on {new Date(selectedReview.repliedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Reply Input Box */}
              <div className="space-y-2">
                <textarea 
                  rows={3}
                  placeholder="Type your response to this customer..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full p-3 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    onClick={() => setSelectedReview(null)}
                    className="px-4 py-2 border border-[#E5ECE8] text-[#6B7280] hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button 
                    disabled={submittingReply || !replyText.trim()}
                    onClick={handleSendReply}
                    className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{submittingReply ? 'Saving Reply...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
