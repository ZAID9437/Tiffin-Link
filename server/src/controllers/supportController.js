const SupportTicket = require('../models/SupportTicket');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const DEFAULT_TICKETS = [
  {
    ticketId: '#TK-1024',
    providerEmail: 'menxoxo50@gmail.com',
    subject: 'Payment payout delayed for weekly settlement',
    category: 'Payments',
    relatedOrderId: 'ORD-9842',
    description: 'Weekly payout settlement of ₹4,250 for August 2nd week is showing processed but hasn’t reflected in my IMPS bank account yet.',
    attachmentUrl: '',
    status: 'Open',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    ticketId: '#TK-1021',
    providerEmail: 'menxoxo50@gmail.com',
    subject: 'Customer location pin wrong on order #ORD-9801',
    category: 'Orders',
    relatedOrderId: 'ORD-9801',
    description: 'Customer delivery address pin was set to wrong landmark causing delivery delay. Issue resolved after calling customer directly.',
    attachmentUrl: '',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
  }
];

const DEFAULT_FAQS = [
  {
    id: 'faq-1',
    category: 'Tiffins',
    question: 'How do I add a new Tiffin?',
    answer: 'Navigate to "My Tiffins" in your Provider Portal sidebar, click the "+ Add New Tiffin" button in the top right, fill in meal details, price, veg/non-veg status, upload photo and click "Save Tiffin".'
  },
  {
    id: 'faq-2',
    category: 'Orders',
    question: 'How do I accept or reject an order?',
    answer: 'Incoming orders appear under "Orders" -> "New Orders". Click "Accept" to move the order to "Preparing" or "Decline" with a quick reason if daily capacity is full.'
  },
  {
    id: 'faq-3',
    category: 'Delivery',
    question: 'How does delivery partner assignment work?',
    answer: 'Once you mark an order status as "Preparing", TiffinLink nearby delivery partners automatically get notified and assigned to pick up the thali box within 15-20 minutes.'
  },
  {
    id: 'faq-4',
    category: 'Tiffins',
    question: 'How can I change my Tiffin availability?',
    answer: 'Go to "Availability" or "My Tiffins" tab. Use the toggle switch on any tiffin card to mark it "Available" or "Sold Out" instantly.'
  },
  {
    id: 'faq-5',
    category: 'Payments',
    question: 'Where can I see my earnings?',
    answer: 'Go to "Earnings" tab in the sidebar. You will find gross sales, platform commission deduction breakdown, weekly payout status and past bank transactions.'
  },
  {
    id: 'faq-6',
    category: 'Account & Security',
    question: 'How do I update my business information?',
    answer: 'Go to "Settings" -> "Business". You can update your Provider Name, Kitchen Bio, Address, City, Service Area, and Operating Hours.'
  },
  {
    id: 'faq-7',
    category: 'Account & Security',
    question: 'How do I change my password?',
    answer: 'Go to "Settings" -> "Security", click "Change Password", enter your current password followed by your new password and submit.'
  }
];

// @desc    Get support tickets
// @route   GET /api/support/tickets
const getTickets = async (req, res) => {
  try {
    const userEmail = req.query.email || req.headers['x-provider-email'] || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      let tickets = await SupportTicket.find({ providerEmail: userEmail }).sort({ createdAt: -1 });

      if (tickets.length === 0) {
        tickets = await SupportTicket.insertMany(DEFAULT_TICKETS);
      }

      return res.json({
        success: true,
        tickets,
        source: 'database'
      });
    } else {
      return res.json({
        success: true,
        tickets: DEFAULT_TICKETS,
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, tickets: DEFAULT_TICKETS });
  }
};

// @desc    Create support ticket
// @route   POST /api/support/tickets
const createTicket = async (req, res) => {
  try {
    const { subject, category, relatedOrderId, description, attachmentUrl, email } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and description are required' });
    }

    const providerEmail = email || req.query.email || 'menxoxo50@gmail.com';
    const ticketId = `#TK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicketData = {
      ticketId,
      providerEmail,
      subject,
      category: category || 'Orders',
      relatedOrderId: relatedOrderId || '',
      description,
      attachmentUrl: attachmentUrl || '',
      status: 'Open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (await isDbConnected()) {
      const ticket = await SupportTicket.create(newTicketData);
      return res.json({
        success: true,
        message: 'Support ticket created successfully!',
        ticket
      });
    }

    return res.json({
      success: true,
      message: 'Support ticket created successfully!',
      ticket: newTicketData
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get FAQs
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
  createTicket,
  getFaqs
};
