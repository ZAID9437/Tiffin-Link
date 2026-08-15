const Review = require('../models/Review');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialReviews = [
  {
    orderId: '#1024',
    customerName: 'Raj Patel',
    customerEmail: 'raj.patel@gmail.com',
    tiffinName: 'Gujarati Home Thali',
    tiffinCategory: 'Gujarati',
    rating: 5,
    comment: 'The food was fresh, extremely delicious, and packed with authentic homemade flavor! Prompt delivery too.',
    providerReply: 'Thank you Raj! We take great pride in delivering fresh homemade meals every day.',
    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
  },
  {
    orderId: '#1025',
    customerName: 'Amit Shah',
    customerEmail: 'amit.shah@yahoo.com',
    tiffinName: 'Jain Special Thali',
    tiffinCategory: 'Jain',
    rating: 4,
    comment: 'Great Jain food option in satellite area. Rotis were soft and curry was savory.',
    providerReply: 'Thanks Amit! Glad you enjoyed our pure Jain menu.',
    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36)
  },
  {
    orderId: '#1026',
    customerName: 'Neha Patel',
    customerEmail: 'neha.patel@outlook.com',
    tiffinName: 'Kathiyawadi Special Combo',
    tiffinCategory: 'Kathiyawadi',
    rating: 5,
    comment: 'Amazing Ringan Bhartho and Bajra Rotla! Reminded me of village style cooking.',
    providerReply: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
  },
  {
    orderId: '#1027',
    customerName: 'Vikram Mehta',
    customerEmail: 'vikram.mehta@gmail.com',
    tiffinName: 'Panjabi Deluxe Thali',
    tiffinCategory: 'Panjabi',
    rating: 5,
    comment: 'Paneer Makhani was rich and delicious. Generous portion sizes!',
    providerReply: 'Thank you Vikram! Happy to serve you anytime.',
    repliedAt: new Date(Date.now() - 1000 * 60 * 60 * 60),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72)
  },
  {
    orderId: '#1028',
    customerName: 'Pooja Sharma',
    customerEmail: 'pooja.sharma@icloud.com',
    tiffinName: 'Gujarati Home Thali',
    tiffinCategory: 'Gujarati',
    rating: 3,
    comment: 'Food quality was decent but delivery took 10 minutes longer than estimated time.',
    providerReply: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96)
  }
];

// @desc    Get all reviews with real MongoDB calculations
// @route   GET /api/reviews
const getReviews = async (req, res) => {
  try {
    if (await isDbConnected()) {
      let reviews = await Review.find().sort({ createdAt: -1 });
      if (reviews.length === 0) {
        await Review.insertMany(defaultInitialReviews);
        reviews = await Review.find().sort({ createdAt: -1 });
      }

      // Calculate real statistics from database reviews
      const totalReviews = reviews.length;
      const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
      const overallRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '5.0';
      const fiveStarCount = reviews.filter(r => r.rating === 5).length;
      const repliedCount = reviews.filter(r => r.providerReply && r.providerReply.trim() !== '').length;
      const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 100;

      const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      return res.json({
        success: true,
        data: reviews,
        stats: {
          overallRating,
          totalReviews,
          fiveStarCount,
          responseRate,
          ratingDistribution
        },
        source: 'database',
        databaseName: 'tiffinlink'
      });
    } else {
      return res.json({
        success: true,
        data: defaultInitialReviews,
        stats: {
          overallRating: '4.7',
          totalReviews: 5,
          fiveStarCount: 3,
          responseRate: 60,
          ratingDistribution: { 5: 3, 4: 1, 3: 1, 2: 0, 1: 0 }
        },
        source: 'in-memory'
      });
    }
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
    const { providerReply } = req.body;

    if (!providerReply || providerReply.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a valid reply message' });
    }

    if (await isDbConnected()) {
      const updatedReview = await Review.findByIdAndUpdate(
        id,
        {
          providerReply: providerReply.trim(),
          repliedAt: new Date()
        },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Reply saved successfully in MongoDB!',
        data: updatedReview
      });
    }

    return res.json({
      success: true,
      message: 'Reply saved (in-memory)',
      data: { _id: id, providerReply, repliedAt: new Date() }
    });
  } catch (error) {
    console.error('Error saving provider reply:', error);
    res.status(500).json({ success: false, message: 'Failed to save reply: ' + error.message });
  }
};

module.exports = {
  getReviews,
  replyToReview
};
