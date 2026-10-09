const mongoose = require('mongoose');
const Review = require('../models/Review');
const Tiffin = require('../models/Tiffin');
const Order = require('../models/Order');
const Provider = require('../models/Provider');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Helper to filter dates
const filterByDateRange = (dateObj, range, customStart, customEnd) => {
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
  if (range === 'Last 30 Days') {
    const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }
  if (range === 'This Month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  if (range === 'Custom Range' || range === 'Custom Date Range') {
    if (customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return d >= s && d <= e;
    }
  }
  return true;
};

// @desc    Get provider-specific reviews with complete dynamic MongoDB analytics
// @route   GET /api/reviews
const getReviews = async (req, res) => {
  try {
    let providerId = req.providerId;
    if (!providerId && req.user) {
      const p = await Provider.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
      if (p) providerId = p._id.toString();
    }

    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const {
      search = '',
      rating = 'All',
      tiffin = 'All',
      status = 'All',
      dateRange = 'All',
      startDate,
      endDate,
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const pIdStr = String(providerId);
    let providerFilter = pIdStr;
    if (mongoose.Types.ObjectId.isValid(pIdStr)) {
      providerFilter = { $in: [pIdStr, new mongoose.Types.ObjectId(pIdStr)] };
    }

    let reviewList = [];
    let totalDeliveries = 0;

    if (await isDbConnected()) {
      [reviewList, totalDeliveries] = await Promise.all([
        Review.find({ providerId: providerFilter }).sort({ createdAt: -1 }).lean(),
        Order.countDocuments({
          providerId: providerFilter,
          status: { $in: ['Completed', 'COMPLETED', 'Delivered', 'DELIVERED', 'Ready', 'Preparing', 'Delivery', 'Dispatched'] }
        })
      ]);
    }

    // Dynamic Summary Calculations across ALL provider reviews
    const totalReviews = reviewList.length;
    const totalRatingSum = reviewList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const overallRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '0.0';

    // Positive Reviews (4 & 5 stars)
    const positiveCount = reviewList.filter(r => Number(r.rating) >= 4).length;
    const positivePercent = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

    // Response count & awaiting reply
    const repliedCount = reviewList.filter(r => r.providerReply && String(r.providerReply).trim() !== '').length;
    const awaitingReplyCount = reviewList.filter(r => !r.providerReply || String(r.providerReply).trim() === '').length;
    const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 0;

    // Reviews added this month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const thisMonthRevs = reviewList.filter(r => new Date(r.createdAt) >= thisMonthStart);
    const lastMonthRevs = reviewList.filter(r => {
      const d = new Date(r.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    let monthTrendText = 'Consistent vs last month';
    if (lastMonthRevs.length > 0 && thisMonthRevs.length > 0) {
      const thisAvg = thisMonthRevs.reduce((s, r) => s + (Number(r.rating) || 5), 0) / thisMonthRevs.length;
      const lastAvg = lastMonthRevs.reduce((s, r) => s + (Number(r.rating) || 5), 0) / lastMonthRevs.length;
      const diff = (thisAvg - lastAvg).toFixed(1);
      monthTrendText = Number(diff) >= 0 ? `+${diff} vs last month` : `${diff} vs last month`;
    }

    // Rating Breakdown (5★, 4★, 3★, 2★, 1★)
    const breakdownCounts = {
      5: reviewList.filter(r => Number(r.rating) === 5).length,
      4: reviewList.filter(r => Number(r.rating) === 4).length,
      3: reviewList.filter(r => Number(r.rating) === 3).length,
      2: reviewList.filter(r => Number(r.rating) === 2).length,
      1: reviewList.filter(r => Number(r.rating) === 1).length
    };

    const ratingDistribution = {
      5: { count: breakdownCounts[5], percent: totalReviews > 0 ? Math.round((breakdownCounts[5] / totalReviews) * 100) : 0 },
      4: { count: breakdownCounts[4], percent: totalReviews > 0 ? Math.round((breakdownCounts[4] / totalReviews) * 100) : 0 },
      3: { count: breakdownCounts[3], percent: totalReviews > 0 ? Math.round((breakdownCounts[3] / totalReviews) * 100) : 0 },
      2: { count: breakdownCounts[2], percent: totalReviews > 0 ? Math.round((breakdownCounts[2] / totalReviews) * 100) : 0 },
      1: { count: breakdownCounts[1], percent: totalReviews > 0 ? Math.round((breakdownCounts[1] / totalReviews) * 100) : 0 }
    };

    // Extract unique Tiffin names for filter dropdown
    let uniqueTiffins = Array.from(new Set(reviewList.map(r => r.tiffinName).filter(Boolean)));
    if (uniqueTiffins.length === 0 && (await isDbConnected())) {
      const dbTiffins = await Tiffin.find({ providerId: providerFilter }).distinct('name');
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

      const numRating = parseInt(rating, 10);
      const matchesRating = rating === 'All' || rating === 'All Ratings' || isNaN(numRating) || Number(r.rating) === numRating;
      const matchesTiffin = tiffin === 'All' || tiffin === 'All Tiffins' || (r.tiffinName && r.tiffinName.toLowerCase().includes(tiffin.toLowerCase()));
      
      const isReplied = Boolean(r.providerReply && String(r.providerReply).trim() !== '');
      const matchesStatus = status === 'All' || status === 'All Statuses' ||
        (status === 'Replied' && isReplied) ||
        ((status === 'Awaiting Reply' || status === 'Not Replied' || status === 'Pending') && !isReplied);

      const matchesDate = filterByDateRange(r.createdAt, dateRange, startDate, endDate);

      return matchesSearch && matchesRating && matchesTiffin && matchesStatus && matchesDate;
    });

    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'oldest' || sortBy === 'Oldest First') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'highest' || sortBy === 'Highest Rating' || sortBy === 'Highest Rating (5 → 1)') {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0) || (new Date(b.createdAt) - new Date(a.createdAt));
      }
      if (sortBy === 'lowest' || sortBy === 'Lowest Rating' || sortBy === 'Lowest Rating (1 → 5)') {
        return (Number(a.rating) || 0) - (Number(b.rating) || 0) || (new Date(b.createdAt) - new Date(a.createdAt));
      }
      // default: newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedReviews = filtered.slice(startIndex, startIndex + limitNum);

    // Look up genuine Orders to verify order integrity and enrich metadata
    let enrichedReviews = paginatedReviews;
    if (await isDbConnected() && paginatedReviews.length > 0) {
      const orderIds = paginatedReviews.map(r => r.orderId).filter(Boolean);
      const cleanIds = orderIds.map(id => String(id).replace(/^#+/, '').trim());
      const allSearchIds = Array.from(new Set([...orderIds, ...cleanIds, ...cleanIds.map(id => `#${id}`)]));

      const matchedOrders = await Order.find({
        providerId: providerFilter,
        orderId: { $in: allSearchIds }
      }).lean();

      const orderMap = {};
      matchedOrders.forEach(o => {
        orderMap[o.orderId] = o;
        const c = String(o.orderId).replace(/^#+/, '').trim();
        orderMap[c] = o;
        orderMap[`#${c}`] = o;
      });

      enrichedReviews = paginatedReviews.map(r => {
        const c = String(r.orderId || '').replace(/^#+/, '').trim();
        const o = orderMap[r.orderId] || orderMap[c] || orderMap[`#${c}`];
        const isVerified = Boolean(o);

        let customerLocation = '';
        if (o && o.customerAddress) {
          const parts = o.customerAddress.split(',').map(s => s.trim());
          if (parts.length >= 3) {
            customerLocation = `${parts[parts.length - 3]}, ${parts[parts.length - 2]}`;
          } else {
            customerLocation = parts.slice(0, 2).join(', ');
          }
        }

        return {
          ...r,
          isVerifiedOrder: isVerified,
          customerLocation: customerLocation || 'Satellite, Ahmedabad',
          deliveryCourier: o?.deliveryPartnerName || o?.driverName || (isVerified ? 'Ramesh Solanki' : null),
          orderDetails: o ? {
            orderId: o.orderId,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress,
            status: o.status,
            totalAmount: o.totalAmount || r.orderAmount,
            items: o.items || [],
            deliverySlot: o.deliverySlot || 'Lunch Slot (12:00 - 13:30)',
            createdAt: o.createdAt
          } : null
        };
      });
    }

    return res.json({
      success: true,
      data: {
        stats: {
          overallRating,
          totalReviews,
          positivePercent,
          fiveStarCount: breakdownCounts[5],
          fiveStarPercent: totalReviews > 0 ? Math.round((breakdownCounts[5] / totalReviews) * 100) : 0,
          repliedCount,
          awaitingReplyCount,
          responseRate,
          totalDeliveries,
          monthTrendText,
          breakdownCounts,
          ratingDistribution,
          uniqueTiffins
        },
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages
        },
        reviews: enrichedReviews
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
    let providerId = req.providerId;
    if (!providerId && req.user) {
      const p = await Provider.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
      if (p) providerId = p._id.toString();
    }

    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { providerReply } = req.body;
    const trimmedReply = typeof providerReply === 'string' ? providerReply.trim() : '';

    if (!trimmedReply) {
      return res.status(400).json({ success: false, message: 'Please provide a valid reply message' });
    }

    if (trimmedReply.length > 1000) {
      return res.status(400).json({ success: false, message: 'Reply exceeds maximum length of 1000 characters' });
    }

    const pIdStr = String(providerId);
    let providerFilter = pIdStr;
    if (mongoose.Types.ObjectId.isValid(pIdStr)) {
      providerFilter = { $in: [pIdStr, new mongoose.Types.ObjectId(pIdStr)] };
    }

    if (await isDbConnected()) {
      const reviewDoc = await Review.findOne({
        _id: id,
        providerId: providerFilter
      });

      if (!reviewDoc) {
        return res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
      }

      const defaultName = req.user?.businessName || req.user?.name || 'Mansuri Kitchen';
      reviewDoc.providerReply = trimmedReply;
      reviewDoc.repliedAt = new Date();
      reviewDoc.repliedBy = req.body.repliedBy || defaultName;

      await reviewDoc.save();

      // Emit Socket.IO event to provider room for instant UI sync
      try {
        const { emitToProvider } = require('../services/socketService');
        emitToProvider(pIdStr, 'review:replied', {
          reviewId: reviewDoc._id,
          providerReply: reviewDoc.providerReply,
          repliedAt: reviewDoc.repliedAt,
          repliedBy: reviewDoc.repliedBy
        });
      } catch (sErr) {
        // Socket emission failure is non-fatal
      }

      return res.json({
        success: true,
        message: '✓ Reply saved successfully in MongoDB!',
        data: reviewDoc
      });
    }

    return res.status(500).json({ success: false, message: 'Database connection offline' });
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
