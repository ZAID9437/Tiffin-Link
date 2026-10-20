const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getReviews,
  replyToReview,
  createReview
} = require('../controllers/reviewController');

// Allow public fetching of reviews if providerId is supplied in query (e.g. diner viewing kitchen profile)
router.get('/', (req, res, next) => {
  if (req.query.providerId) {
    return getReviews(req, res, next);
  }
  return protect(req, res, () => requireProvider(req, res, next));
});
router.post('/', protect, createReview);
router.put('/:id/reply', protect, requireProvider, replyToReview);

module.exports = router;
