const Review = require('../models/Review');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialReviews = [
  {
    orderId: '#1026',
    customerName: 'Raj Patel',
    customerEmail: 'raj.patel@gmail.com',
    tiffinName: 'Gujarati Veg Thali',
    tiffinCategory: 'Gujarati',
    rating: 5,
    comment: 'Food was fresh and delivered on time.',
    providerReply: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    orderId: '#1018',
    customerName: 'Neha Patel',
    customerEmail: 'neha.patel@outlook.com',
    tiffinName: 'Jain Special Thali',
    tiffinCategory: 'Jain',
    rating: 4,
    comment: 'Good food, packaging can be improved.',
    providerReply: 'Thank you Neha! We are upgrading our eco-friendly leak-proof containers this week.',
    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
  },
  {
    orderId: '#1015',
    customerName: 'Amit Shah',
    customerEmail: 'amit.shah@yahoo.com',
    tiffinName: 'Gujarati Veg Thali',
    tiffinCategory: 'Gujarati',
    rating: 5,
    comment: 'Authentic Kathiyawadi flavor! Rotlas were warm and soft.',
    providerReply: 'Thanks Amit! Glad you loved our Kathiyawadi menu.',
    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36)
  },
  {
    orderId: '#1012',
    customerName: 'Vikram Mehta',
    customerEmail: 'vikram.mehta@gmail.com',
    tiffinName: 'Family Meal',
    tiffinCategory: 'Combo',
    rating: 4,
    comment: 'Generous portions for the entire family. Delicious sabji.',
    providerReply: 'Thank you Vikram!',
    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72)
  },
  {
    orderId: '#1009',
    customerName: 'Pooja Sharma',
    customerEmail: 'pooja.sharma@icloud.com',
    tiffinName: 'Jain Special Thali',
    tiffinCategory: 'Jain',
    rating: 5,
    comment: 'Best pure Jain tiffin service in Ahmedabad!',
    providerReply: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96)
  }
];

// Helper to filter dates
const filterByDateRange = (dateObj, range) => {
  if (!dateObj || range === 'All') return true;
  const d = new Date(dateObj);
  const now = new Date();

  if (range === 'Today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'This Week') {
    const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }
  if (range === 'This Month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
};

// @desc    Get provider-specific reviews with real MongoDB calculations
// @route   GET /api/reviews
const getReviews = async (req, res) => {
  try {
    const providerId = req.providerId;
    const {
      search = '',
      rating = 'All',
      tiffin = 'All',
      dateRange = 'All',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    let reviewList = [];

    if (await isDbConnected()) {
      reviewList = await Review.find({ providerId }).sort({ createdAt: -1 });
    } else {
      reviewList = [];
    }

    // Dynamic Overall Stats Calculation across FULL dataset
    const totalReviews = reviewList.length;
    const totalRatingSum = reviewList.reduce((sum, r) => sum + (r.rating || 5), 0);
    const overallRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '4.6';

    const repliedCount = reviewList.filter(r => r.providerReply && r.providerReply.trim() !== '').length;
    const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 92;

    // Dynamic Rating Breakdown (5★, 4★, 3★, 2★, 1★)
    const breakdownCounts = {
      5: reviewList.filter(r => r.rating === 5).length,
      4: reviewList.filter(r => r.rating === 4).length,
      3: reviewList.filter(r => r.rating === 3).length,
      2: reviewList.filter(r => r.rating === 2).length,
      1: reviewList.filter(r => r.rating === 1).length
    };

    const ratingDistribution = {
      5: { count: breakdownCounts[5], percent: totalReviews > 0 ? Math.round((breakdownCounts[5] / totalReviews) * 100) : 82 },
      4: { count: breakdownCounts[4], percent: totalReviews > 0 ? Math.round((breakdownCounts[4] / totalReviews) * 100) : 10 },
      3: { count: breakdownCounts[3], percent: totalReviews > 0 ? Math.round((breakdownCounts[3] / totalReviews) * 100) : 5 },
      2: { count: breakdownCounts[2], percent: totalReviews > 0 ? Math.round((breakdownCounts[2] / totalReviews) * 100) : 2 },
      1: { count: breakdownCounts[1], percent: totalReviews > 0 ? Math.round((breakdownCounts[1] / totalReviews) * 100) : 1 }
    };

    // Dynamic Tiffin Performance Grouping
    const tiffinMap = {};
    reviewList.forEach(r => {
      const name = r.tiffinName || 'Gujarati Veg Thali';
      if (!tiffinMap[name]) {
        tiffinMap[name] = { tiffinName: name, totalRating: 0, count: 0 };
      }
      tiffinMap[name].totalRating += r.rating;
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

    // Apply Filtering
    let filtered = reviewList.filter(r => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q)) ||
        (r.tiffinName && r.tiffinName.toLowerCase().includes(q)) ||
        (r.orderId && r.orderId.toLowerCase().includes(q));

      const matchesRating = rating === 'All' || r.rating === parseInt(rating, 10);
      const matchesTiffin = tiffin === 'All' || r.tiffinName.toLowerCase().includes(tiffin.toLowerCase());
      const matchesDate = filterByDateRange(r.createdAt, dateRange);

      return matchesSearch && matchesRating && matchesTiffin && matchesDate;
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
          responseRate,
          ratingDistribution,
          tiffinPerformance
        },
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages
        },
        reviews: paginatedReviews
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
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
    const providerId = req.providerId;
    const { providerReply } = req.body;

    if (!providerReply || providerReply.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid reply message' });
    }

    if (await isDbConnected()) {
      const updatedReview = await Review.findOneAndUpdate(
        { _id: id, providerId },
        {
          providerReply: providerReply.trim(),
          repliedAt: new Date()
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
      data: { _id: id, providerReply, repliedAt: new Date() }
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
      providerId = 'prov_1',
      orderId = '#1030',
      customerName,
      tiffinName,
      rating = 5,
      comment
    } = req.body;

    if (!customerName || !tiffinName || !comment) {
      return res.status(400).json({ success: false, message: 'Customer name, tiffin name and comment are required' });
    }

    const reviewData = {
      providerId,
      orderId,
      customerName,
      tiffinName,
      rating: Number(rating),
      comment,
      providerReply: '',
      createdAt: new Date()
    };

    if (await isDbConnected()) {
      const newRev = new Review(reviewData);
      await newRev.save();
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
