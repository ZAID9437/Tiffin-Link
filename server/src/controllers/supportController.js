const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Provider = require('../models/Provider');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Structured Atelier Provider FAQs across all 6 categories
const DEFAULT_FAQS = [
  // 1. Order Management
  {
    id: 'faq-ord-1',
    category: 'Order Management',
    question: 'How do I handle sudden order surges during peak lunch cycles?',
    answer: 'Navigate to Live Orders or Capacity settings to increase or pause your batch cap. If your kitchen capacity reaches maximum volume, toggle Kitchen Status to Paused to temporarily hold incoming tickets without affecting your provider quality score.'
  },
  {
    id: 'faq-ord-2',
    category: 'Order Management',
    question: 'Can I adjust kitchen preparation countdown timers for custom orders?',
    answer: 'Yes. When accepting a live order ticket with special dietary or phulka rotli requests, select the extended preparation window (+10 or +15 mins). Dispatch telemetry automatically informs the customer and reschedules courier pickup.'
  },
  {
    id: 'faq-ord-3',
    category: 'Order Management',
    question: 'What is the procedure for emergency customer order cancellations?',
    answer: 'If an order is cancelled by the customer before preparation commences, you receive a push notification and the order moves to Cancelled. If food was already prepared, culinary escrow protection applies per TiffinLink provider fair terms.'
  },

  // 2. Payments & Payouts
  {
    id: 'faq-pay-1',
    category: 'Payments & Payouts',
    question: 'How does culinary escrow clearance work for daily lunch and dinner dispatches?',
    answer: 'Customer payments are held in culinary escrow until delivery is verified via doorstep QR handshake. Once verified, batch funds are credited into your Provider Withdrawal Wallet within 15 minutes.'
  },
  {
    id: 'faq-pay-2',
    category: 'Payments & Payouts',
    question: 'What are the bank transfer settlement timelines and minimum thresholds?',
    answer: 'Instant IMPS transfers to verified provider bank accounts (e.g. HDFC Bank) settle within minutes. Minimum payout threshold is ₹100 with zero platform settlement fees on standard weekly cycles.'
  },
  {
    id: 'faq-pay-3',
    category: 'Payments & Payouts',
    question: 'Where can I find GST and platform commission reconciliation vouchers?',
    answer: 'Go to Earnings > Transactions and click [ Download Ledger ]. Every transaction includes transparent breakdowns of tiffin prices, handling allowances, and monthly GST statements.'
  },

  // 3. Delivery Problems
  {
    id: 'faq-del-1',
    category: 'Delivery Problems',
    question: 'What should I do if an assigned delivery courier is delayed past pickup ETA?',
    answer: 'Open the Live Orders tab to monitor rider GPS. If courier ETA exceeds 15 minutes, click [ Request Backup Courier ] or submit an urgent ticket here to have our Ahmedabad Hub dispatcher reassign a nearby active rider.'
  },
  {
    id: 'faq-del-2',
    category: 'Delivery Problems',
    question: 'How do insulated stainless steel canister seals protect meal temperatures?',
    answer: 'All TiffinLink partner couriers use thermal delivery crates. Ensure canisters are sealed at 65°C+ before QR handover. If any tamper seal discrepancy occurs during transit, dispatch telemetry logs the exact checkpoint.'
  },
  {
    id: 'faq-del-3',
    category: 'Delivery Problems',
    question: 'What happens if a customer address falls outside our defined service polygon?',
    answer: 'Orders outside your configured 8km radius are filtered out automatically. If a customer provides incorrect delivery coordinates, rider GPS telemetry flags the mismatch to Support Desk.'
  },

  // 4. Tiffin Management
  {
    id: 'faq-tif-1',
    category: 'Tiffin Management',
    question: 'How do I configure rotating daily menus (Kathiyawadi, Jain, Gujarati Special)?',
    answer: 'Under Food & Menu > Schedule, you can pre-schedule your subji, dal, and roti variants for all 7 days of the week. Updates take effect immediately for customer pre-orders.'
  },
  {
    id: 'faq-tif-2',
    category: 'Tiffin Management',
    question: 'How does canister inventory tracking and recovery operate?',
    answer: 'When a customer subscribes to daily homestyle tiffins, a circular canister deposit is tracked. Delivery partners collect yesterday’s cleaned carrier during today’s drop-off and return it to your hub station.'
  },

  // 5. Account & Profile
  {
    id: 'faq-acc-1',
    category: 'Account & Profile',
    question: 'How do I upload and renew our mandatory FSSAI food hygiene license?',
    answer: 'Go to System Settings > Account Profile and locate the Regulatory Compliance section. Upload your renewed FSSAI certificate PDF. Audit approvals are cleared within 24 business hours.'
  },
  {
    id: 'faq-acc-2',
    category: 'Account & Profile',
    question: 'Can I designate secondary kitchen managers with role-based dashboard access?',
    answer: 'Yes. In System Settings > Security & Permissions, create operator sessions for kitchen floor chefs with restricted access to live prep tickets only.'
  },

  // 6. Technical Issues
  {
    id: 'faq-tec-1',
    category: 'Technical Issues',
    question: 'How do I configure acoustic order chime alerts on our kitchen terminal tablet?',
    answer: 'Ensure audio autoplay permissions are granted in your browser settings. You can test chime volume anytime via System Settings > Kitchen Preferences.'
  },
  {
    id: 'faq-tec-2',
    category: 'Technical Issues',
    question: 'What should I do if real-time order telematics experience websocket dropouts?',
    answer: 'The TiffinLink Provider Portal includes an automatic heartbeat reconnect protocol. If offline, the interface falls back to rapid HTTP polling so no order tickets are missed.'
  }
];

// Helper to extract verified authenticated provider identity
const getValidatedProviderId = async (req) => {
  if (req.providerId) return String(req.providerId);
  if (req.user) {
    if (req.user.role === 'provider') {
      const p = await Provider.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
      if (p) return p._id.toString();
    }
    return req.user._id ? req.user._id.toString() : null;
  }
  return null;
};

// Helper to create in-app notification when support events occur
const sendSupportNotification = async (providerId, title, message, referenceId) => {
  try {
    if (!providerId) return;
    await Notification.create({
      notificationId: `#NOTIF-SUP-${Math.floor(100000 + Math.random() * 900000)}`,
      recipientId: String(providerId),
      title,
      message,
      category: 'System',
      priority: 'MEDIUM',
      referenceId: String(referenceId || ''),
      referenceType: 'system',
      read: false
    });
  } catch (err) {
    console.error('Error sending support notification:', err);
  }
};

// @desc    Get support tickets with search, filtering, sorting, summary metrics, and pagination
// @route   GET /api/support/tickets
const getTickets = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { 
      search = '', 
      status = 'All', 
      category = 'All', 
      priority = 'All', 
      range = 'All',
      sortBy = 'newest',
      page = 1,
      limit = 10 
    } = req.query;

    if (await isDbConnected()) {
      // Strictly scoped query for authenticated provider
      const query = {
        $or: [
          { providerId: String(providerId) },
          ...(req.user?.email ? [{ providerEmail: req.user.email }] : [])
        ]
      };

      const allProviderTickets = await SupportTicket.find(query).sort({ createdAt: -1 }).lean();

      // Compute dynamic database summary counts
      const summary = {
        total: allProviderTickets.length,
        open: allProviderTickets.filter(t => (t.status || '').toLowerCase() === 'open').length,
        inProgress: allProviderTickets.filter(t => {
          const s = (t.status || '').toLowerCase();
          return s === 'in progress' || s === 'in_progress' || s === 'processing';
        }).length,
        waiting: allProviderTickets.filter(t => (t.status || '').toLowerCase().includes('waiting')).length,
        resolved: allProviderTickets.filter(t => {
          const s = (t.status || '').toLowerCase();
          return s === 'resolved' || s === 'closed';
        }).length
      };

      // Filter in memory for search and multi-field criteria
      let filtered = allProviderTickets.filter(t => {
        // Status filter
        let matchStatus = true;
        if (status !== 'All') {
          const s = status.toLowerCase();
          const tStatus = (t.status || '').toLowerCase();
          if (s === 'open') matchStatus = tStatus === 'open';
          else if (s === 'in progress' || s === 'in_progress') matchStatus = tStatus === 'in progress' || tStatus === 'in_progress';
          else if (s === 'waiting for provider' || s === 'waiting') matchStatus = tStatus.includes('waiting');
          else if (s === 'resolved') matchStatus = tStatus === 'resolved';
          else if (s === 'closed') matchStatus = tStatus === 'closed';
        }

        // Category filter
        let matchCat = true;
        if (category !== 'All') {
          matchCat = (t.category || '').toLowerCase().includes(category.toLowerCase());
        }

        // Priority filter
        let matchPri = true;
        if (priority !== 'All') {
          matchPri = (t.priority || '').toLowerCase() === priority.toLowerCase();
        }

        // Date range filter
        let matchRange = true;
        if (range && range !== 'All' && range !== 'All Time' && range !== 'Last 30 Days') {
          const ticketDate = new Date(t.createdAt);
          const now = new Date();
          if (range === 'Today Only' || range === 'today') {
            const startOfToday = new Date(now.setHours(0, 0, 0, 0));
            matchRange = ticketDate >= startOfToday;
          } else if (range === 'Last 7 Days' || range === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchRange = ticketDate >= sevenDaysAgo;
          }
        }

        // Search filter
        let matchSearch = true;
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const text = `${t.ticketId || ''} ${t.subject || ''} ${t.description || ''} ${t.category || ''} ${t.relatedOrderId || ''}`.toLowerCase();
          matchSearch = text.includes(q);
        }

        return matchStatus && matchCat && matchPri && matchRange && matchSearch;
      });

      // Sorting
      if (sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const totalCount = filtered.length;
      const skip = (pageNum - 1) * limitNum;
      const paginatedTickets = filtered.slice(skip, skip + limitNum);
      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      return res.json({
        success: true,
        tickets: paginatedTickets,
        summary,
        pagination: {
          totalCount,
          currentPage: pageNum,
          totalPages,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        },
        source: 'database'
      });
    }

    return res.status(500).json({ success: false, message: 'Database connection offline' });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, tickets: [] });
  }
};

// @desc    Get single ticket details with full conversation history
// @route   GET /api/support/tickets/:id
const getTicketById = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { id } = req.params;

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          {
            $or: [
              { providerId: String(providerId) },
              ...(req.user?.email ? [{ providerEmail: req.user.email }] : [])
            ]
          },
          { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }] }
        ]
      }).lean();

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Support ticket not found or unauthorized.' });
      }

      return res.json({ success: true, ticket });
    }

    return res.status(500).json({ success: false, message: 'Database offline' });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create new support ticket for authenticated provider
// @route   POST /api/support/tickets
const createTicket = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { subject, category, priority, relatedOrderId, description, attachmentUrl } = req.body;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and detailed incident description are required.' });
    }

    const providerEmail = req.user?.email || '';
    const kitchenBrand = req.provider?.businessName || req.user?.name || 'Mansuri Kitchen';

    // Format ticket ID as #TK-XXXX
    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `#TK-${ticketNumber}`;

    const initialMessages = [
      {
        senderId: String(providerId),
        senderRole: 'provider',
        senderName: `${kitchenBrand} (Provider)`,
        message: description.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        createdAt: new Date()
      }
    ];

    const newTicketData = {
      ticketId,
      providerId: String(providerId),
      providerEmail,
      subject: subject.trim(),
      category: category || 'Order Management',
      priority: priority ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : 'Normal',
      relatedOrderId: (relatedOrderId && relatedOrderId !== 'none' && relatedOrderId !== 'General / Not Order Specific') ? relatedOrderId : '',
      description: description.trim(),
      attachmentUrl: attachmentUrl || '',
      status: 'Open',
      assignedTo: 'Ahmedabad Hub Operations Lead',
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (await isDbConnected()) {
      const ticket = await SupportTicket.create(newTicketData);

      // Trigger In-App Notification
      await sendSupportNotification(
        providerId,
        `Support Ticket Queued (${ticketId})`,
        `Your escalation regarding "${subject}" has been submitted to Ahmedabad Operations Desk.`,
        ticketId
      );

      return res.status(201).json({
        success: true,
        message: `Support ticket ${ticketId} created successfully!`,
        ticket
      });
    }

    return res.status(500).json({ success: false, message: 'Database connection failed' });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Add a message to an existing support ticket conversation
// @route   POST /api/support/tickets/:id/messages
const addTicketMessage = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { id } = req.params;
    const { message, attachmentUrl, senderRole = 'provider' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          {
            $or: [
              { providerId: String(providerId) },
              ...(req.user?.email ? [{ providerEmail: req.user.email }] : [])
            ]
          },
          { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }] }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found or access denied.' });
      }

      if (ticket.status === 'Closed') {
        return res.status(400).json({ success: false, message: 'This ticket has been closed. Please create a new ticket for further assistance.' });
      }

      const kitchenBrand = req.provider?.businessName || req.user?.name || 'Mansuri Kitchen';
      const senderName = senderRole === 'support'
        ? 'TiffinLink Support (Dispatch Lead)'
        : `${kitchenBrand} (Provider)`;

      const newMessage = {
        senderId: senderRole === 'support' ? 'support-desk' : String(providerId),
        senderRole,
        senderName,
        message: message.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        createdAt: new Date()
      };

      ticket.messages.push(newMessage);
      ticket.updatedAt = new Date();

      if (ticket.status === 'Waiting for Provider' && senderRole === 'provider') {
        ticket.status = 'In Progress';
      }

      await ticket.save();

      return res.json({
        success: true,
        message: 'Message sent successfully!',
        ticket
      });
    }

    return res.status(500).json({ success: false, message: 'Database offline' });
  } catch (error) {
    console.error('Error adding ticket message:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update ticket status (e.g. Mark Resolved or Closed)
// @route   PATCH /api/support/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  try {
    const providerId = await getValidatedProviderId(req);
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          {
            $or: [
              { providerId: String(providerId) },
              ...(req.user?.email ? [{ providerEmail: req.user.email }] : [])
            ]
          },
          { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }] }
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
        message: `Ticket resolution logged: status changed to "${status}".`,
        createdAt: new Date()
      });

      await ticket.save();

      return res.json({
        success: true,
        message: `Ticket status updated to ${status}!`,
        ticket
      });
    }

    return res.status(500).json({ success: false, message: 'Database offline' });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get structured FAQs across all Atelier categories
// @route   GET /api/support/faqs
const getFaqs = async (req, res) => {
  try {
    const { category } = req.query;
    let list = DEFAULT_FAQS;
    if (category && category !== 'All') {
      list = list.filter(f => f.category.toLowerCase().includes(category.toLowerCase()));
    }

    return res.json({
      success: true,
      faqs: list
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
