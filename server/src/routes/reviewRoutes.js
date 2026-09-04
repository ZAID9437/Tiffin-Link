const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getReviews,
  replyToReview,
  createReview
} = require('../controllers/reviewController');

router.get('/', protect, requireProvider, getReviews);
router.post('/', protect, requireProvider, createReview);
router.put('/:id/reply', protect, requireProvider, replyToReview);

module.exports = router;
