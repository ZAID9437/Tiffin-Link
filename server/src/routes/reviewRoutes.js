const express = require('express');
const router = express.Router();
const {
  getReviews,
  replyToReview,
  createReview
} = require('../controllers/reviewController');

router.get('/', getReviews);
router.post('/', createReview);
router.put('/:id/reply', replyToReview);

module.exports = router;
