const express = require('express');
const router = express.Router();
const { getTickets, createTicket, getFaqs } = require('../controllers/supportController');

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.get('/faqs', getFaqs);

module.exports = router;
