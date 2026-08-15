const express = require('express');
const router = express.Router();
const { getReviews, replyToReview } = require('../controllers/reviewController');

router.get('/', getReviews);
router.put('/:id/reply', replyToReview);

module.exports = router;
