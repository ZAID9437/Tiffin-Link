const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getTickets, 
  getTicketById, 
  createTicket, 
  addTicketMessage, 
  updateTicketStatus, 
  getFaqs 
} = require('../controllers/supportController');

router.get('/tickets', protect, requireProvider, getTickets);
router.post('/tickets', protect, requireProvider, createTicket);
router.get('/tickets/:id', protect, requireProvider, getTicketById);
router.post('/tickets/:id/messages', protect, requireProvider, addTicketMessage);
router.patch('/tickets/:id/status', protect, requireProvider, updateTicketStatus);
router.get('/faqs', getFaqs);

module.exports = router;
