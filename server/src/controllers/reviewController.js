const Review = require('../models/Review');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to filter dates
const filterByDateRange = (dateObj, range) => {
  if (!dateObj || range === 'All' || range === 'All Time') return true;
  const d = new Date(dateObj);
  const now = new Date();

  if (range === 'Today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'Last 7 Days' || range === 'This Week') {
    const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }
  if (range === 'Last 30 Days' || range === 'This Month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
};

// @desc    Get provider-specific reviews with complete dynamic MongoDB analytics
// @route   GET /api/reviews
const getReviews = async (req, res) => {
  try {
    const providerId = req.providerId || req.user?._id?.toString() || req.query.providerId;
    if (!providerId) {
      return res.json({
        success: true,
        data: {
          stats: {
            overallRating: '0.0',
            totalReviews: 0,
            positivePercent: 0,
            needAttentionCount: 0,
            thisMonthCount: 0,
            breakdownCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            ratingDistribution: {
              5: { count: 0, percent: 0 },
              4: { count: 0, percent: 0 },
              3: { count: 0, percent: 0 },
              2: { count: 0, percent: 0 },
              1: { count: 0, percent: 0 }
            },
            tiffinPerformance: [],
            uniqueTiffins: []
          },
          pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
          reviews: []
        },
        source: 'database'
      });
    }
    const {
      search = '',
      rating = 'All',
      tiffin = 'All',
      status = 'All',
      dateRange = 'All',
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    let reviewList = [];

    if (await isDbConnected()) {
      reviewList = await Review.find({ providerId }).sort({ createdAt: -1 }).lean();
    }

    // Dynamic Summary Calculations across ALL provider reviews
    const totalReviews = reviewList.length;
    const totalRatingSum = reviewList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const overallRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '0.0';

    // Positive Reviews (4 & 5 stars)
    const positiveCount = reviewList.filter(r => r.rating >= 4).length;
    const positivePercent = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

    // Need Attention (Unanswered / Pending Replies)
    const needAttentionCount = reviewList.filter(r => !r.providerReply || r.providerReply.trim() === '').length;

    // Reviews added this month
    const now = new Date();
    const thisMonthCount = reviewList.filter(r => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Rating Breakdown (5★, 4★, 3★, 2★, 1★)
    const breakdownCounts = {
      5: reviewList.filter(r => r.rating === 5).length,
      4: reviewList.filter(r => r.rating === 4).length,
      3: reviewList.filter(r => r.rating === 3).length,
      2: reviewList.filter(r => r.rating === 2).length,
      1: reviewList.filter(r => r.rating === 1).length
    };

    const ratingDistribution = {
      5: { count: breakdownCounts[5], percent: totalReviews > 0 ? Math.round((breakdownCounts[5] / totalReviews) * 100) : 0 },
      4: { count: breakdownCounts[4], percent: totalReviews > 0 ? Math.round((breakdownCounts[4] / totalReviews) * 100) : 0 },
      3: { count: breakdownCounts[3], percent: totalReviews > 0 ? Math.round((breakdownCounts[3] / totalReviews) * 100) : 0 },
      2: { count: breakdownCounts[2], percent: totalReviews > 0 ? Math.round((breakdownCounts[2] / totalReviews) * 100) : 0 },
      1: { count: breakdownCounts[1], percent: totalReviews > 0 ? Math.round((breakdownCounts[1] / totalReviews) * 100) : 0 }
    };

    // Dynamic Tiffin Performance Grouping
    const tiffinMap = {};
    reviewList.forEach(r => {
      const name = r.tiffinName || 'Tiffin Meal';
      if (!tiffinMap[name]) {
        tiffinMap[name] = { tiffinName: name, totalRating: 0, count: 0 };
      }
      tiffinMap[name].totalRating += Number(r.rating) || 5;
      tiffinMap[name].count += 1;
    });

    const tiffinPerformance = Object.values(tiffinMap).map(t => {
      const avg = (t.totalRating / t.count).toFixed(1);
      const trend = avg >= 4.7 ? '↑' : avg >= 4.4 ? '→' : '↓';
      return {
        tiffinName: t.tiffinName,
        reviewsCount: t.count,
        rating: avg,
        trend
      };
    });

    // Extract unique Tiffin names for filter dropdown
    let uniqueTiffins = Array.from(new Set(reviewList.map(r => r.tiffinName).filter(Boolean)));
    if (uniqueTiffins.length === 0 && (await isDbConnected())) {
      const dbTiffins = await Tiffin.find({ providerId }).distinct('name');
      uniqueTiffins = dbTiffins;
    }

    // Apply Search & Filters
    let filtered = reviewList.filter(r => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.tiffinName && r.tiffinName.toLowerCase().includes(q)) ||
        (r.orderId && r.orderId.toLowerCase().includes(q));

      const matchesRating = rating === 'All' || rating === 'All Ratings' || r.rating === parseInt(rating, 10);
      const matchesTiffin = tiffin === 'All' || tiffin === 'All Tiffins' || r.tiffinName.toLowerCase().includes(tiffin.toLowerCase());
      
      const matchesStatus = status === 'All' || status === 'All Status' ||
        (status === 'Replied' && r.providerReply && r.providerReply.trim() !== '') ||
        (status === 'Not Replied' && (!r.providerReply || r.providerReply.trim() === ''));

      const matchesDate = filterByDateRange(r.createdAt, dateRange);

      return matchesSearch && matchesRating && matchesTiffin && matchesStatus && matchesDate;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'highest' || sortBy === 'Highest Rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lowest' || sortBy === 'Lowest Rating') {
        return a.rating - b.rating;
      }
      // default: newest
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedReviews = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: {
        stats: {
          overallRating,
          totalReviews,
          positivePercent,
          needAttentionCount,
          thisMonthCount,
          breakdownCounts,
          ratingDistribution,
          tiffinPerformance,
          uniqueTiffins
        },
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages
        },
        reviews: paginatedReviews
      },
      source: (await isDbConnected()) ? 'database' : 'memory'
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Reply to a customer review in MongoDB
// @route   PUT /api/reviews/:id/reply
const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId || req.user?._id?.toString() || req.body.providerId;
    const { providerReply, repliedBy = (req.user?.businessName || req.user?.name || 'Kitchen Partner') } = req.body;

    if (!providerReply || providerReply.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid reply message' });
    }

    if (await isDbConnected()) {
      const updatedReview = await Review.findOneAndUpdate(
        { _id: id, providerId },
        {
          providerReply: providerReply.trim(),
          repliedAt: new Date(),
          repliedBy
        },
        { new: true }
      );

      if (!updatedReview) {
        return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
      }

      return res.json({
        success: true,
        message: '✓ Reply saved successfully in MongoDB!',
        data: updatedReview
      });
    }

    return res.json({
      success: true,
      message: '✓ Reply saved successfully!',
      data: { _id: id, providerReply, repliedAt: new Date(), repliedBy }
    });
  } catch (error) {
    console.error('Error saving provider reply:', error);
    res.status(500).json({ success: false, message: 'Failed to save reply: ' + error.message });
  }
};

// @desc    Create new review
// @route   POST /api/reviews
const createReview = async (req, res) => {
  try {
    const {
      providerId = req.body.providerId || '',
      orderId = '',
      customerName,
      customerPhone,
      tiffinName,
      rating = 5,
      foodQualityRating,
      packagingRating,
      tasteRating,
      deliveryRating,
      orderAmount,
      orderQuantity,
      comment
    } = req.body;

    const customerId = req.user?._id?.toString() || req.body.customerId || '';
    const finalCustomerName = (req.user?.name || req.user?.fullName || customerName || 'Verified Diner').trim();
    const finalCustomerPhone = req.user?.phone || req.user?.mobile || customerPhone || '';
    const finalCustomerEmail = req.user?.email || '';

    if (!finalCustomerName || !comment) {
      return res.status(400).json({ success: false, message: 'Customer name and comment are required' });
    }

    const reviewData = {
      providerId: String(providerId),
      orderId: String(orderId),
      customerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerEmail: finalCustomerEmail,
      tiffinName: tiffinName || 'Tiffin Meal',
      rating: Number(rating) || 5,
      foodQualityRating: Number(foodQualityRating) || Number(rating) || 5,
      packagingRating: Number(packagingRating) || Number(rating) || 5,
      tasteRating: Number(tasteRating) || Number(rating) || 5,
      deliveryRating: Number(deliveryRating) || Number(rating) || 5,
      orderAmount: Number(orderAmount) || 0,
      orderQuantity: Number(orderQuantity) || 1,
      comment: String(comment).trim(),
      providerReply: '',
      createdAt: new Date()
    };

    if (await isDbConnected()) {
      const newRev = new Review(reviewData);
      await newRev.save();

      // Update Order isReviewed flag
      try {
        const Order = require('../models/Order');
        await Order.updateMany(
          { $or: [{ orderId }, { orderId: `#${orderId}` }, { _id: orderId }] },
          { $set: { isReviewed: true, reviewRating: reviewData.rating } }
        );
      } catch (oErr) {}

      return res.status(201).json({ success: true, message: '✓ Review submitted successfully', data: newRev });
    }

    return res.status(201).json({ success: true, message: '✓ Review submitted', data: { _id: 'rev_' + Date.now(), ...reviewData } });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

module.exports = {
  getReviews,
  replyToReview,
  createReview
};
