import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  Search, 
  Package, 
  Utensils, 
  CreditCard, 
  Truck, 
  Star, 
  Bell, 
  ShieldCheck, 
  Plus, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Paperclip, 
  Send,
  LifeBuoy,
  RefreshCw,
  MessageCircle,
  Filter,
  User,
  Headphones,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../services/api';

export default function HelpSupportTab({ currentUser, onNavigateTab }) {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, currentPage: 1, totalPages: 1 });
  const [faqs, setFaqs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search State
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Active Ticket View
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Orders',
    priority: 'Normal',
    relatedOrderId: '',
    description: '',
    attachmentUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const faqSectionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchFaqs();
    fetchProviderOrders();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [ticketSearchQuery, statusFilter, categoryFilter, priorityFilter, sortBy, currentPage]);

  // Live Chat Auto-Poll (every 4 seconds) when a ticket is open
  useEffect(() => {
    let pollInterval;
    if (activeTicket) {
      pollInterval = setInterval(() => {
        refreshActiveTicket(activeTicket._id || activeTicket.ticketId);
      }, 4000);
    }
    return () => clearInterval(pollInterval);
  }, [activeTicket]);

  useEffect(() => {
    if (activeTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchFaqs = async () => {
    try {
      const json = await apiRequest('/support/faqs');
      if (json.success && json.faqs) {
        setFaqs(json.faqs);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  };

  const fetchProviderOrders = async () => {
    try {
      const json = await apiRequest('/orders/provider');
      if (json.success && json.orders) {
        setOrders(json.orders);
      }
    } catch (err) {
      console.error('Failed to load orders for ticket link:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        search: ticketSearchQuery,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        sortBy,
        page: currentPage,
        limit: 10
      }).toString();

      const json = await apiRequest(`/support/tickets?${queryParams}`);
      if (json.success) {
        setTickets(json.tickets || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } else {
        setError(json.message || 'Failed to load support requests.');
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      setError('Unable to connect to support server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveTicket = async (ticketId) => {
    try {
      const json = await apiRequest(`/support/tickets/${ticketId}`);
      if (json.success && json.ticket) {
        setActiveTicket(json.ticket);
        // Also update in list
        setTickets(prev => prev.map(t => (t.ticketId === json.ticket.ticketId || t._id === json.ticket._id ? json.ticket : t)));
      }
    } catch (err) {
      console.error('Failed to refresh active ticket:', err);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      showToast('⚠️ Subject and detailed description are required.');
      return;
    }

    try {
      setSubmitting(true);
      const json = await apiRequest('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketForm)
      });

      if (json.success && json.ticket) {
        showToast(`✓ Ticket ${json.ticket.ticketId} created successfully!`);
        setCreateModalOpen(false);
        setTicketForm({
          subject: '',
          category: 'Orders',
          priority: 'Normal',
          relatedOrderId: '',
          description: '',
          attachmentUrl: ''
        });
        fetchTickets();
        setActiveTicket(json.ticket);
      } else {
        showToast(json.message || '✓ Ticket created successfully!');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      showToast('⚠️ Failed to create ticket. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setSendingReply(true);
      const ticketId = activeTicket._id || activeTicket.ticketId;
      const json = await apiRequest(`/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyMessage,
          attachmentUrl: replyAttachment,
          senderRole: 'provider'
        })
      });

      if (json.success && json.ticket) {
        setActiveTicket(json.ticket);
        setReplyMessage('');
        setReplyAttachment('');
        setTickets(prev => prev.map(t => (t.ticketId === json.ticket.ticketId || t._id === json.ticket._id ? json.ticket : t)));
        showToast('✓ Reply sent to Support Team');
      } else {
        showToast(json.message || '✓ Reply sent');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      showToast('⚠️ Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!activeTicket) return;
    try {
      const ticketId = activeTicket._id || activeTicket.ticketId;
      const json = await apiRequest(`/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (json.success && json.ticket) {
        setActiveTicket(json.ticket);
        setTickets(prev => prev.map(t => (t.ticketId === json.ticket.ticketId || t._id === json.ticket._id ? json.ticket : t)));
        showToast(`✓ Ticket marked as ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('⚠️ Could not update ticket status.');
    }
  };

  const scrollToFaqs = (category) => {
    setSelectedFaqCategory(category);
    if (faqSectionRef.current) {
      faqSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const TOPIC_CATEGORIES = [
    { id: 'Orders', label: 'Orders', icon: Package, desc: 'Issues with orders & status', color: 'emerald' },
    { id: 'Tiffins', label: 'Tiffins', icon: Utensils, desc: 'Manage menu & availability', color: 'amber' },
    { id: 'Payments', label: 'Payments', icon: CreditCard, desc: 'Earnings, payouts & billing', color: 'blue' },
    { id: 'Delivery', label: 'Delivery', icon: Truck, desc: 'Delivery & delivery partners', color: 'purple' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory;
    const matchesSearch = faqSearchQuery === '' || 
      faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-black border border-blue-200 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            In Progress
          </span>
        );
      case 'Waiting for Provider':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-black border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Waiting for You
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black border border-gray-200 inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Closed
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[9.5px] font-black border border-red-200">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[9.5px] font-black border border-orange-200">High</span>;
      case 'Low':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9.5px] font-bold">Low</span>;
      default:
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9.5px] font-bold">Normal</span>;
    }
  };

  // Timeline Progress Calculator
  const getTimelineSteps = (status) => {
    const steps = [
      { id: 'created', label: 'Request Created', state: 'done' },
      { id: 'assigned', label: 'Support Assigned', state: 'done' },
      { id: 'inprogress', label: 'Investigation / In Progress', state: 'pending' },
      { id: 'resolved', label: 'Resolution', state: 'pending' },
      { id: 'closed', label: 'Closed', state: 'pending' }
    ];

    if (status === 'Open') {
      steps[2].state = 'active';
    } else if (status === 'In Progress' || status === 'Waiting for Provider') {
      steps[2].state = 'done';
      steps[3].state = 'active';
    } else if (status === 'Resolved') {
      steps[2].state = 'done';
      steps[3].state = 'done';
      steps[4].state = 'active';
    } else if (status === 'Closed') {
      steps[2].state = 'done';
      steps[3].state = 'done';
      steps[4].state = 'done';
    }

    return steps;
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827] relative">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>System</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Help & Support</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Help & Support</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">
            Need help with your TiffinLink business? Find answers, report an issue, or contact our support team.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <a
            href="mailto:support@tiffinlink.com"
            className="px-4 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer no-underline"
          >
            <Mail size={14} className="text-[#0A8B5F]" />
            <span>Contact Support</span>
          </a>

          <button 
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>+ New Request</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Help Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {TOPIC_CATEGORIES.map(cat => {
          const IconComp = cat.icon;
          return (
            <div 
              key={cat.id}
              onClick={() => scrollToFaqs(cat.id)}
              className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs hover:border-[#0A8B5F] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-[#E8F0EC] text-[#0A8B5F] rounded-xl group-hover:bg-[#0A8B5F] group-hover:text-white transition-colors">
                    <IconComp size={20} />
                  </div>
                  <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Help</span>
                </div>
                <h3 className="text-sm font-black text-[#111827] mb-1">{cat.label}</h3>
                <p className="text-xs text-[#6B7280] font-medium leading-relaxed mb-4">{cat.desc}</p>
              </div>
              <div className="text-xs font-black text-[#0A8B5F] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Help</span>
                <ArrowRight size={13} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Search Help Center & FAQs Accordion */}
      <div ref={faqSectionRef} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5ECE8] pb-4">
          <div>
            <h2 className="text-base font-black text-[#111827]">Frequently Asked Questions</h2>
            <p className="text-xs text-[#6B7280] font-medium">Quick solutions and help guide for common queries.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input 
              type="text"
              value={faqSearchQuery}
              onChange={e => setFaqSearchQuery(e.target.value)}
              placeholder="🔍 Search questions..."
              className="w-full pl-9 pr-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Orders', 'Tiffins', 'Payments', 'Delivery', 'Account & Security'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFaqCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFaqCategory === cat 
                  ? 'bg-[#0A8B5F] text-white shadow-xs' 
                  : 'bg-[#F9FBF9] text-[#6B7280] hover:bg-gray-100 border border-[#E5ECE8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-2 pt-1">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] text-xs text-[#6B7280] font-bold">
              No matching help questions found. Try adjusting your search query.
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div 
                  key={faq.id || index}
                  className="border border-[#E5ECE8] rounded-xl overflow-hidden transition-all bg-[#F9FBF9]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 transition-colors"
                  >
                    <span className="font-extrabold text-xs text-[#111827] flex items-center gap-2.5">
                      <span className="text-[#0A8B5F] font-black text-sm">▼</span>
                      {faq.question}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-[#0A8B5F]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[#374151] leading-relaxed font-medium bg-white border-t border-[#E5ECE8] animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Support Tickets Section ("My Support Requests") */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5ECE8] pb-4">
          <div>
            <h2 className="text-base font-black text-[#111827]">My Support Requests</h2>
            <p className="text-xs text-[#6B7280] font-medium">Track, manage and message support regarding your open issues.</p>
          </div>

          <button 
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>+ New Request</span>
          </button>
        </div>

        {/* Ticket Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-[#F9FBF9] p-3.5 rounded-xl border border-[#E5ECE8]">
          {/* Search Ticket */}
          <div className="md:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input 
              type="text"
              value={ticketSearchQuery}
              onChange={e => { setTicketSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by ticket ID (#SUP-10482), subject..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Open">🟡 Open</option>
              <option value="In Progress">🔵 In Progress</option>
              <option value="Waiting for Provider">🟣 Waiting for Provider</option>
              <option value="Resolved">🟢 Resolved</option>
              <option value="Closed">⚫ Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Orders">Orders</option>
              <option value="Tiffins">Tiffins</option>
              <option value="Payments">Payments</option>
              <option value="Delivery">Delivery</option>
              <option value="Customers">Customers</option>
              <option value="Account & Security">Account & Security</option>
              <option value="Technical Issue">Technical Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="recently_updated">Sort: Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200 space-y-3">
            <AlertCircle size={28} className="text-red-600 mx-auto" />
            <div className="text-sm font-black text-red-800">⚠️ Unable to load Help & Support</div>
            <p className="text-xs text-red-600 font-medium max-w-sm mx-auto">{error}</p>
            <button 
              onClick={fetchTickets}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        ) : tickets.length === 0 ? (
          /* 13. Empty State */
          <div className="p-12 text-center bg-[#F9FBF9] rounded-2xl border border-dashed border-[#C5DDD2] space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0A8B5F] flex items-center justify-center mx-auto shadow-xs">
              <Headphones size={32} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111827]">No support requests yet</h3>
              <p className="text-xs text-[#6B7280] font-medium max-w-md mx-auto mt-1 leading-relaxed">
                If you need help with orders, payments, delivery, tiffins or your TiffinLink account, you can create a support request.
              </p>
            </div>
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Create Support Request</span>
            </button>
          </div>
        ) : (
          /* Tickets Table / List */
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-[#E5ECE8]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5ECE8] text-[11px] text-[#6B7280] font-black uppercase tracking-wider bg-[#F9FBF9]">
                    <th className="p-3.5">Ticket ID</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8]">
                  {tickets.map(ticket => (
                    <tr key={ticket._id || ticket.ticketId} className="hover:bg-[#F9FBF9] transition-colors group">
                      <td className="p-3.5 font-black text-[#0A8B5F] shrink-0">
                        {ticket.ticketId}
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-black text-[#111827] truncate">{ticket.subject}</div>
                        {ticket.relatedOrderId && (
                          <div className="text-[10px] text-[#6B7280] font-medium">Order: #{ticket.relatedOrderId}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-[#6B7280] font-bold">{ticket.category}</td>
                      <td className="p-3.5">{getPriorityBadge(ticket.priority)}</td>
                      <td className="p-3.5">{getStatusBadge(ticket.status)}</td>
                      <td className="p-3.5 text-[#6B7280] font-medium text-[11px]">
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => refreshActiveTicket(ticket._id || ticket.ticketId)}
                          className="px-3 py-1.5 bg-[#E8F0EC] hover:bg-[#0A8B5F] hover:text-white text-[#0A8B5F] font-black rounded-lg text-xs transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>View Ticket</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-[#6B7280] font-bold">
                  Showing page <span className="text-[#111827]">{pagination.currentPage}</span> of <span className="text-[#111827]">{pagination.totalPages}</span> ({pagination.totalCount} total requests)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 bg-white border border-[#E5ECE8] rounded-xl hover:bg-gray-50 text-[#111827] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        currentPage === p 
                          ? 'bg-[#0A8B5F] text-white shadow-xs' 
                          : 'bg-white border border-[#E5ECE8] text-[#6B7280] hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    className="p-2 bg-white border border-[#E5ECE8] rounded-xl hover:bg-gray-50 text-[#111827] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. CREATE SUPPORT REQUEST MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-[#E5ECE8] shadow-2xl space-y-5 animate-scale-in text-xs font-bold text-[#111827]">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#E8F0EC] text-[#0A8B5F] rounded-xl">
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">Create Support Request</h3>
                  <p className="text-[11px] text-[#6B7280] font-medium">Raise an official inquiry to TiffinLink Merchant Support.</p>
                </div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-[#6B7280] hover:text-[#111827] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Subject / Summary *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Payment settlement not received for yesterday"
                  value={ticketForm.subject}
                  onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Category *</label>
                  <select
                    value={ticketForm.category}
                    onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
                  >
                    <option value="Orders">Orders</option>
                    <option value="Tiffins">Tiffins</option>
                    <option value="Payments">Payments</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Customers">Customers</option>
                    <option value="Account & Security">Account & Security</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Priority *</label>
                  <select
                    value={ticketForm.priority}
                    onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Related Order</label>
                  <select
                    value={ticketForm.relatedOrderId}
                    onChange={e => setTicketForm({ ...ticketForm, relatedOrderId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F] cursor-pointer"
                  >
                    <option value="">None / General Query</option>
                    {orders.map(ord => (
                      <option key={ord._id || ord.orderId} value={ord.orderId || ord._id}>
                        {ord.orderId || ord._id} - {ord.customerName || 'Customer'} (₹{ord.totalAmount || ord.price || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Description / Detailed Issue *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Explain your issue in detail so support can assist quickly..."
                  value={ticketForm.description}
                  onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Attachments (Optional)</label>
                <label className="w-full p-3 bg-[#F9FBF9] border border-dashed border-[#C5DDD2] hover:bg-emerald-50/50 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs text-[#0A8B5F] font-bold transition-colors">
                  <Paperclip size={15} />
                  <span>+ Add Screenshot / PDF Receipt</span>
                  <input 
                    type="file" 
                    onChange={e => {
                      if (e.target.files[0]) {
                        setTicketForm({ ...ticketForm, attachmentUrl: e.target.files[0].name });
                        showToast(`✓ Attached: ${e.target.files[0].name}`);
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
                {ticketForm.attachmentUrl && (
                  <div className="text-[11px] text-[#0A8B5F] font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Attached file: {ticketForm.attachmentUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5ECE8]">
                <button 
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#E5ECE8] text-[#6B7280] font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={14} />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. TICKET DETAILS MODAL (TIMELINE & LIVE CONVERSATION CHAT) */}
      {activeTicket && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full h-[90vh] border border-[#E5ECE8] shadow-2xl flex flex-col overflow-hidden animate-scale-in text-xs font-bold text-[#111827]">
            
            {/* Ticket Details Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTicket(null)} 
                  className="p-1.5 bg-white border border-[#E5ECE8] hover:bg-gray-100 rounded-xl text-[#6B7280] cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0A8B5F] text-base">{activeTicket.ticketId}</span>
                    {getStatusBadge(activeTicket.status)}
                    {getPriorityBadge(activeTicket.priority)}
                  </div>
                  <h2 className="text-sm font-black text-[#111827] mt-0.5 truncate max-w-md">{activeTicket.subject}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeTicket.status !== 'Resolved' && activeTicket.status !== 'Closed' && (
                  <button
                    onClick={() => handleStatusUpdate('Resolved')}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold hover:bg-emerald-200 cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
                <button onClick={() => setActiveTicket(null)} className="text-[#6B7280] hover:text-[#111827] cursor-pointer p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Ticket Info & 7. Status Timeline Bar */}
            <div className="p-4 bg-white border-b border-[#E5ECE8] space-y-4 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8] text-[11px]">
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Category</span>
                  <span className="font-black text-[#111827]">{activeTicket.category}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Related Order</span>
                  <span className="font-black text-[#0A8B5F]">{activeTicket.relatedOrderId ? `#${activeTicket.relatedOrderId}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Created Date</span>
                  <span className="font-extrabold text-[#111827]">
                    {new Date(activeTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px]">Assigned To</span>
                  <span className="font-extrabold text-[#111827]">{activeTicket.assignedTo || 'Support Team'}</span>
                </div>
              </div>

              {/* Status Timeline Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-extrabold flex justify-between">
                  <span>Ticket Status Timeline</span>
                  <span className="text-[#0A8B5F]">Live Tracking</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {getTimelineSteps(activeTicket.status).map((step, idx) => (
                    <div key={step.id} className="space-y-1">
                      <div className={`h-1.5 rounded-full transition-all ${
                        step.state === 'done' ? 'bg-[#0A8B5F]' : step.state === 'active' ? 'bg-amber-500 animate-pulse' : 'bg-gray-200'
                      }`} />
                      <div className="text-[9.5px] font-extrabold leading-tight text-[#111827]">
                        {step.state === 'done' ? '✓ ' : ''}{step.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F9FBF9]">
              
              {/* Original Description Prompt */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="font-black text-[#111827]">Original Request Details</span>
                  <span>{new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-[#374151] font-medium leading-relaxed bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                  {activeTicket.description}
                </p>
                {activeTicket.attachmentUrl && (
                  <div className="text-[11px] text-[#0A8B5F] font-bold flex items-center gap-1.5 pt-1">
                    <Paperclip size={13} />
                    <span>Attachment: {activeTicket.attachmentUrl}</span>
                  </div>
                )}
              </div>

              {/* Messages List */}
              {activeTicket.messages && activeTicket.messages.length > 0 ? (
                activeTicket.messages.map((msg, idx) => {
                  const isProvider = msg.senderRole === 'provider';
                  const isSystem = msg.senderRole === 'system';

                  if (isSystem) {
                    return (
                      <div key={idx} className="text-center py-2">
                        <span className="px-3 py-1 bg-gray-200/70 text-gray-700 text-[10px] font-bold rounded-full border border-gray-300">
                          ⚙️ {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${isProvider ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                        <span className="font-black text-[#111827]">{isProvider ? 'You (Provider)' : 'TiffinLink Support'}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className={`p-4 rounded-2xl max-w-lg shadow-2xs leading-relaxed text-xs font-medium ${
                        isProvider 
                          ? 'bg-[#0A8B5F] text-white rounded-br-none' 
                          : 'bg-white text-[#111827] border border-[#E5ECE8] rounded-bl-none'
                      }`}>
                        {msg.message}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`mt-2 pt-2 border-t text-[10.5px] font-bold flex items-center gap-1.5 ${
                            isProvider ? 'border-white/20 text-white' : 'border-[#E5ECE8] text-[#0A8B5F]'
                          }`}>
                            <Paperclip size={13} />
                            <span>Attachment: {msg.attachments.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer Footer */}
            {activeTicket.status !== 'Closed' ? (
              <form onSubmit={handleSendReply} className="p-3 sm:p-4 bg-white border-t border-[#E5ECE8] flex items-center gap-3 shrink-0">
                <label className="p-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 rounded-xl text-[#6B7280] cursor-pointer shrink-0">
                  <Paperclip size={16} />
                  <input 
                    type="file" 
                    onChange={e => {
                      if (e.target.files[0]) {
                        setReplyAttachment(e.target.files[0].name);
                        showToast(`✓ Attached: ${e.target.files[0].name}`);
                      }
                    }} 
                    className="hidden" 
                  />
                </label>

                <input 
                  type="text"
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Write a message to support team..."
                  className="flex-1 px-4 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />

                <button 
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            ) : (
              <div className="p-4 bg-gray-100 text-center text-xs text-gray-600 font-bold border-t border-[#E5ECE8]">
                This ticket has been marked as Closed. Create a new support request if you need further assistance.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
