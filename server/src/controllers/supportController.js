const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    category: 'Delivery Help',
    question: 'How do I accept a delivery request?',
    answer: 'When a new meal request appears on your radar, verify pickup distance, estimated transit time, and payout floor. You have a 45-second countdown window to click [ Accept Request ]. If Auto-Assignment is enabled in your Delivery Preferences, priority requests within your preferred 12km cluster are instantly queued to your active dispatch.'
  },
  {
    id: 'faq-2',
    category: 'Delivery Help',
    question: 'How do I verify kitchen pickup OTP?',
    answer: 'Present your 4-digit provider pickup OTP or scan the kitchen tamper QR seal at the dispatch counter before loading hot-box crates into your carrier bay. Both options immediately update order state to IN_TRANSIT.'
  },
  {
    id: 'faq-3',
    category: 'Delivery Help',
    question: 'How do I contact a customer during transit?',
    answer: 'Use the in-app masked VoIP call or instant WhatsApp dispatch trigger in your Active Delivery tracking screen. Customer phone numbers remain completely anonymized per regional courier privacy mandates.'
  },
  {
    id: 'faq-4',
    category: 'Payment & Earnings',
    question: 'How are my delivery earnings calculated?',
    answer: 'Earnings include base distance transit rate + ₹15 thermal packaging handling allowance + dynamic peak surge bonus + 100% of customer direct tips. Payout calculations are audited at each corridor waypoint closure.'
  },
  {
    id: 'faq-5',
    category: 'Payment & Earnings',
    question: 'How do I request a wallet withdrawal to my bank?',
    answer: 'Navigate to Wallet & Withdrawals. Choose Instant IMPS or Weekly Auto-Payout. The minimum withdrawal threshold is ₹100 into your authenticated HDFC Bank corporate payroll account.'
  },
  {
    id: 'faq-6',
    category: 'Technical Support',
    question: 'Why can’t I switch status to Online?',
    answer: 'Ensure your GPS location permission is set to “Always Allow”, battery level is above 30%, and your quarterly safety compliance attestation has been confirmed by Bandra West Hub 12 administrators.'
  }
];

// Helper to extract principal user ID (supports driver, provider, user session)
const getSupportUserId = (req) => {
  return req.driverId || 
    req.driver?.driverId || 
    req.providerId || 
    req.user?.driverId || 
    req.query?.driverId || 
    req.body?.driverId || 
    req.user?.id || 
    req.user?._id?.toString() || 
    'DP-4409';
};

// @desc    Get support tickets with search, filtering, sorting, and pagination
// @route   GET /api/support/tickets
const getTickets = async (req, res) => {
  try {
    const principalId = getSupportUserId(req);
    const userEmail = req.user?.email || req.query?.email || '';

    const { 
      search = '', 
      status = 'All', 
      category = 'All', 
      priority = 'All', 
      sortBy = 'newest',
      page = 1,
      limit = 10 
    } = req.query;

    if (await isDbConnected()) {
      // Query tickets belonging to principalId OR providerEmail
      const query = {
        $or: [
          { providerId: principalId },
          { providerId: { $in: [req.driverId, req.providerId, req.user?.id].filter(Boolean) } },
          ...(userEmail ? [{ providerEmail: userEmail }] : [])
        ]
      };

      let tickets = await SupportTicket.find(query).sort({ createdAt: -1 });

// No seed: return empty tickets if none exist in DB

      // Filter in memory for maximum reliability
      let filtered = tickets.filter(t => {
        let matchStatus = true;
        if (status !== 'All') {
          const s = status.toLowerCase();
          const tStatus = (t.status || '').toLowerCase();
          if (s === 'open') matchStatus = tStatus === 'open';
          else if (s === 'in_review' || s === 'in review') matchStatus = tStatus === 'in review' || tStatus === 'in_review';
          else if (s === 'in_progress' || s === 'in progress') matchStatus = tStatus === 'in progress' || tStatus === 'in_progress';
          else if (s === 'waiting_for_driver' || s === 'waiting') matchStatus = tStatus.includes('waiting');
          else if (s === 'resolved') matchStatus = tStatus === 'resolved';
          else if (s === 'closed') matchStatus = tStatus === 'closed';
        }

        let matchCat = true;
        if (category !== 'All') {
          matchCat = (t.category || '').toLowerCase().includes(category.toLowerCase());
        }

        let matchPri = true;
        if (priority !== 'All') {
          matchPri = (t.priority || '').toLowerCase() === priority.toLowerCase();
        }

        let matchSearch = true;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const text = `${t.ticketId} ${t.subject} ${t.description} ${t.relatedOrderId || ''}`.toLowerCase();
          matchSearch = text.includes(q);
        }

        return matchStatus && matchCat && matchPri && matchSearch;
      });

      // Sorting
      if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const totalCount = filtered.length;
      const skip = (pageNum - 1) * limitNum;
      const paginatedTickets = filtered.slice(skip, skip + limitNum);
      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      return res.json({
        success: true,
        tickets: paginatedTickets,
        allTickets: tickets,
        pagination: {
          totalCount,
          currentPage: pageNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        },
        source: 'database'
      });
    } else {
      return res.json({
        success: true,
        tickets: [],
        allTickets: [],
        pagination: { totalCount: 0, currentPage: 1, totalPages: 1 },
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, tickets: [] });
  }
};

// @desc    Get single ticket details with conversation messages
// @route   GET /api/support/tickets/:id
const getTicketById = async (req, res) => {
  try {
    const principalId = getSupportUserId(req);
    const { id } = req.params;

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          { $or: [{ providerId: principalId }, { providerEmail: req.user?.email || req.query?.email }] },
          { $or: [{ _id: id }, { ticketId: id }] }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Support ticket not found or access denied.' });
      }

      return res.json({ success: true, ticket });
    }

    return res.status(404).json({ success: false, message: 'Support ticket not found.' });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create new support ticket for logged-in driver / provider
// @route   POST /api/support/tickets
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, relatedOrderId, description, attachmentUrl } = req.body;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and detailed description are required.' });
    }

    const principalId = getSupportUserId(req);
    const providerEmail = req.user?.email || req.body?.email || req.query?.email || '';
    const userName = req.driver?.name || req.user?.name || req.provider?.businessName || 'Support User';

    // Generate secure random ticket number e.g. #TKT-8842
    const ticketId = `#TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialMessages = [
      {
        senderId: principalId,
        senderRole: 'provider',
        senderName: userName,
        message: description.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        createdAt: new Date()
      }
    ];

    const newTicketData = {
      ticketId,
      providerId: principalId,
      providerEmail,
      subject: subject.trim(),
      category: category || 'General Inquiry',
      priority: priority ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : 'Normal',
      relatedOrderId: (relatedOrderId && relatedOrderId !== 'none') ? relatedOrderId : '',
      description: description.trim(),
      attachmentUrl: attachmentUrl || '',
      status: 'Open',
      assignedTo: 'Bandra West Hub 12 Operations',
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (await isDbConnected()) {
      const ticket = await SupportTicket.create(newTicketData);

      // Trigger In-App Notification
      await sendProviderNotification(
        principalId,
        `🔔 Support Ticket Created (${ticketId})`,
        `Your support request "${subject}" has been queued. Hub supervisor will call or reply shortly.`,
        ticketId
      );

      return res.status(201).json({
        success: true,
        message: 'Support ticket created successfully!',
        ticket
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully!',
      ticket: newTicketData
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Add a message to an existing support ticket conversation
// @route   POST /api/support/tickets/:id/messages
const addTicketMessage = async (req, res) => {
  try {
    const principalId = getSupportUserId(req);
    const { id } = req.params;
    const { message, attachmentUrl, senderRole = 'provider' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          { $or: [{ providerId: principalId }, { providerEmail: req.user?.email || req.query?.email }] },
          { $or: [{ _id: id }, { ticketId: id }] }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found or access denied.' });
      }

      if (ticket.status === 'Closed') {
        return res.status(400).json({ success: false, message: 'This ticket has been closed. Please create a new ticket for further assistance.' });
      }

      const userName = req.driver?.name || req.user?.name || req.provider?.businessName || 'Courier';
      
      const newMessage = {
        senderId: senderRole === 'support' ? 'support-admin' : principalId,
        senderRole,
        senderName: senderRole === 'support' ? 'TiffinLink Support' : userName,
        message: message.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        createdAt: new Date()
      };

      ticket.messages.push(newMessage);
      ticket.updatedAt = new Date();

      if (senderRole === 'support' && ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }

      await ticket.save();

      return res.json({
        success: true,
        message: 'Message sent successfully!',
        ticket
      });
    }

    return res.status(400).json({ success: false, message: 'Database not connected.' });
  } catch (error) {
    console.error('Error adding ticket message:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update ticket status (e.g. Mark Resolved or Closed)
// @route   PATCH /api/support/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  try {
    const principalId = getSupportUserId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          { $or: [{ providerId: principalId }, { providerEmail: req.user?.email || req.query?.email }] },
          { $or: [{ _id: id }, { ticketId: id }] }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found or access denied.' });
      }

      ticket.status = status;
      ticket.updatedAt = new Date();
      if (status === 'Resolved' || status === 'RESOLVED') ticket.resolvedAt = new Date();
      if (status === 'Closed' || status === 'CLOSED') ticket.closedAt = new Date();

      ticket.messages.push({
        senderId: 'system',
        senderRole: 'system',
        senderName: 'TiffinLink System',
        message: `Ticket status updated to "${status}".`,
        createdAt: new Date()
      });

      await ticket.save();

      return res.json({
        success: true,
        message: `Ticket status updated to ${status}!`,
        ticket
      });
    }

    return res.status(400).json({ success: false, message: 'Database not connected.' });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get structured FAQs
// @route   GET /api/support/faqs
const getFaqs = async (req, res) => {
  try {
    return res.json({
      success: true,
      faqs: DEFAULT_FAQS
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, faqs: DEFAULT_FAQS });
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  addTicketMessage,
  updateTicketStatus,
  getFaqs
};
