const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    category: 'Orders',
    question: 'How do I accept or decline an incoming tiffin order?',
    answer: 'When a new order arrives, navigate to "Orders" -> "New Orders". Click "Accept" to move it to "Preparing". If you are at full daily capacity, click "Decline" with a quick reason.'
  },
  {
    id: 'faq-2',
    category: 'Tiffins',
    question: 'How do I add or update a Tiffin menu item?',
    answer: 'Navigate to "My Tiffins" in your sidebar, click "+ Add New Tiffin" at the top right, enter meal details, pricing, veg/non-veg status, upload photo and click "Save Tiffin".'
  },
  {
    id: 'faq-3',
    category: 'Tiffins',
    question: 'How do I pause tiffin availability when sold out?',
    answer: 'Go to "Availability" or "My Tiffins". Toggle the status switch on any tiffin card to "Available" or "Sold Out" instantly.'
  },
  {
    id: 'faq-4',
    category: 'Payments',
    question: 'How and when are weekly earnings paid out?',
    answer: 'Earnings settlements are automatically processed every Monday via IMPS/UPI directly into your registered bank account. You can view transaction receipts under the "Earnings" tab.'
  },
  {
    id: 'faq-5',
    category: 'Delivery',
    question: 'How does delivery partner assignment work?',
    answer: 'When you mark an order as "Preparing", TiffinLink nearby delivery partners are automatically alerted via Socket.IO and dispatched to collect your thali box within 15-20 minutes.'
  },
  {
    id: 'faq-6',
    category: 'Delivery',
    question: 'What if a delivery partner is delayed or customer address is wrong?',
    answer: 'Open "Orders" -> click on the order card to view live delivery partner details and phone number. If needed, create a Support Ticket linked to that Order ID.'
  },
  {
    id: 'faq-7',
    category: 'Account & Security',
    question: 'How can I update my business profile or service area?',
    answer: 'Go to "Settings" -> "Business Settings". You can update your Provider Business Name, Bio, Address, City, Service Radius, and Operating Hours.'
  },
  {
    id: 'faq-8',
    category: 'Account & Security',
    question: 'How do I change my password or enable security alerts?',
    answer: 'Go to "Settings" -> "Security", click "Change Password", enter your current password followed by your new password and submit.'
  }
];

// Helper to send in-app notification to provider
const sendProviderNotification = async (providerId, title, message, referenceId) => {
  try {
    if (await isDbConnected()) {
      await Notification.create({
        notificationId: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipientId: providerId.toString(),
        title,
        message,
        category: 'System',
        referenceId: referenceId || '',
        referenceType: 'system',
        read: false,
        createdAt: new Date()
      });
    }
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// @desc    Get support tickets with search, filtering, sorting, and pagination (Scoped strictly to authenticated provider)
// @route   GET /api/support/tickets
const getTickets = async (req, res) => {
  try {
    const providerId = req.providerId.toString();
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
      // Build Provider-Isolated Query
      const query = { providerId };

      if (status !== 'All') {
        query.status = status;
      }
      if (category !== 'All') {
        query.category = category;
      }
      if (priority !== 'All') {
        query.priority = priority;
      }
      if (search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { ticketId: searchRegex },
          { subject: searchRegex },
          { description: searchRegex }
        ];
      }

      // Sorting
      let sortOptions = { createdAt: -1 };
      if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
      if (sortBy === 'recently_updated') sortOptions = { updatedAt: -1 };

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const [tickets, totalCount] = await Promise.all([
        SupportTicket.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum),
        SupportTicket.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      return res.json({
        success: true,
        tickets,
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
    const providerId = req.providerId.toString();
    const { id } = req.params;

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          { providerId },
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

// @desc    Create new support ticket for logged-in provider
// @route   POST /api/support/tickets
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, relatedOrderId, description, attachmentUrl } = req.body;

    if (!subject || !subject.trim() || !description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Subject and detailed description are required.' });
    }

    const providerId = req.providerId.toString();
    const providerEmail = req.user?.email || req.provider?.email || '';
    const providerName = req.provider?.businessName || req.provider?.fullName || req.user?.name || 'Provider';

    // Generate secure random ticket number e.g. #SUP-10482
    const ticketId = `#SUP-${Math.floor(10000 + Math.random() * 90000)}`;

    const initialMessages = [
      {
        senderId: providerId,
        senderRole: 'provider',
        senderName: providerName,
        message: description.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        createdAt: new Date()
      }
    ];

    const newTicketData = {
      ticketId,
      providerId,
      providerEmail,
      subject: subject.trim(),
      category: category || 'Orders',
      priority: priority || 'Normal',
      relatedOrderId: relatedOrderId || '',
      description: description.trim(),
      attachmentUrl: attachmentUrl || '',
      status: 'Open',
      assignedTo: 'TiffinLink Support Team',
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (await isDbConnected()) {
      const ticket = await SupportTicket.create(newTicketData);

      // Trigger In-App Notification
      await sendProviderNotification(
        providerId,
        `🔔 Support Ticket Created (${ticketId})`,
        `Your request "${subject}" has been submitted successfully. Our team will respond shortly.`,
        ticketId
      );

      return res.status(201).json({
        success: true,
        message: 'Support request created successfully!',
        ticket
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Support request created successfully!',
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
    const providerId = req.providerId.toString();
    const { id } = req.params;
    const { message, attachmentUrl, senderRole = 'provider' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          { providerId },
          { $or: [{ _id: id }, { ticketId: id }] }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found or access denied.' });
      }

      if (ticket.status === 'Closed') {
        return res.status(400).json({ success: false, message: 'This ticket has been closed. Please create a new ticket for further assistance.' });
      }

      const providerName = req.provider?.businessName || req.provider?.fullName || req.user?.name || 'Provider';
      
      const newMessage = {
        senderId: senderRole === 'support' ? 'support-admin' : providerId,
        senderRole,
        senderName: senderRole === 'support' ? 'TiffinLink Support' : providerName,
        message: message.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
        createdAt: new Date()
      };

      ticket.messages.push(newMessage);
      ticket.updatedAt = new Date();

      // If support replied, change status to In Progress
      if (senderRole === 'support' && ticket.status === 'Open') {
        ticket.status = 'In Progress';
      }

      await ticket.save();

      // Send notification alert
      if (senderRole === 'support') {
        await sendProviderNotification(
          providerId,
          `🔔 Support Replied to ${ticket.ticketId}`,
          `Support Team replied: "${message.trim().substring(0, 60)}..."`,
          ticket.ticketId
        );
      }

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
    const providerId = req.providerId.toString();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Open', 'In Progress', 'Waiting for Provider', 'Resolved', 'Closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (await isDbConnected()) {
      const ticket = await SupportTicket.findOne({
        $and: [
          { providerId },
          { $or: [{ _id: id }, { ticketId: id }] }
        ]
      });

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found or access denied.' });
      }

      ticket.status = status;
      ticket.updatedAt = new Date();
      if (status === 'Resolved') ticket.resolvedAt = new Date();
      if (status === 'Closed') ticket.closedAt = new Date();

      // Add system timeline message
      ticket.messages.push({
        senderId: 'system',
        senderRole: 'system',
        senderName: 'TiffinLink System',
        message: `Ticket status updated to "${status}".`,
        createdAt: new Date()
      });

      await ticket.save();

      await sendProviderNotification(
        providerId,
        `🔔 Support Ticket Status Updated (${ticket.ticketId})`,
        `Your request #${ticket.ticketId} has been marked as "${status}".`,
        ticket.ticketId
      );

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
