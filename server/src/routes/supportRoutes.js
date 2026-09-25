const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getTickets, 
  getTicketById, 
  createTicket, 
  addTicketMessage, 
  updateTicketStatus, 
  getFaqs 
} = require('../controllers/supportController');

router.get('/tickets', protect, getTickets);
router.post('/tickets', protect, createTicket);
router.get('/tickets/:id', protect, getTicketById);
router.post('/tickets/:id/messages', protect, addTicketMessage);
router.patch('/tickets/:id/status', protect, updateTicketStatus);
router.put('/tickets/:id/status', protect, updateTicketStatus);
router.get('/faqs', getFaqs);

module.exports = router;
