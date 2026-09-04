const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { getTickets, createTicket, getFaqs } = require('../controllers/supportController');

router.get('/tickets', protect, requireProvider, getTickets);
router.post('/tickets', protect, requireProvider, createTicket);
router.get('/faqs', getFaqs);

module.exports = router;

