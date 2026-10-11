import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';

export default function HelpSupportTab({ currentUser, onNavigateTab }) {
  // Database Data States
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waiting: 0,
    resolved: 0
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10
  });
  const [faqs, setFaqs] = useState([]);
  const [providerOrders, setProviderOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState('All');
  const [statusSelect, setStatusSelect] = useState('All');
  const [rangeSelect, setRangeSelect] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Category for FAQ View
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // Active Ticket Dossier (Right Column)
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Create Ticket Drawer / Modal
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Delivery Problems',
    relatedOrderId: '',
    priority: 'High',
    description: '',
    attachmentUrl: ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const messagesEndRef = useRef(null);
  const categoriesRef = useRef(null);
  const ledgerRef = useRef(null);

  // Station Information
  const stationNode = currentUser?._id ? `msr-node-${String(currentUser._id).slice(-4)}` : 'msr-node-04';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // 1. Fetch FAQs
  const fetchFaqs = async () => {
    try {
      const res = await apiRequest('/support/faqs');
      if (res && res.success && Array.isArray(res.faqs)) {
        setFaqs(res.faqs);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  };

  // 2. Fetch Provider's Real Orders for Ticket Linking
  const fetchProviderOrders = async () => {
    try {
      const res = await apiRequest('/orders/provider?limit=25');
      if (res && res.success && Array.isArray(res.orders)) {
        setProviderOrders(res.orders);
      }
    } catch (err) {
      console.warn('Could not load orders for ticket reference:', err);
    }
  };

  // 3. Fetch Support Tickets from MongoDB
  const fetchTickets = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);

      const effectiveStatus = activeTabFilter !== 'All' ? activeTabFilter : statusSelect;
      const effectiveSearch = ticketSearch || globalSearch;

      const queryParams = new URLSearchParams({
        search: effectiveSearch,
        status: effectiveStatus,
        range: rangeSelect,
        page: currentPage.toString(),
        limit: '10'
      });

      const res = await apiRequest(`/support/tickets?${queryParams.toString()}`);
      if (res && res.success) {
        const fetchedTickets = Array.isArray(res.tickets) ? res.tickets : [];
        setTickets(fetchedTickets);
        if (res.summary) {
          setSummary(res.summary);
        }
        if (res.pagination) {
          setPagination(res.pagination);
        }

        // Auto-select first ticket if none selected or current no longer in list
        if (fetchedTickets.length > 0) {
          if (!activeTicket || !fetchedTickets.some(t => (t.ticketId === activeTicket.ticketId || t._id === activeTicket._id))) {
            setActiveTicket(fetchedTickets[0]);
          }
        }
      } else {
        throw new Error(res?.message || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      if (!isBackground) {
        setError(err.message || 'Unable to connect to support database');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchFaqs();
    fetchProviderOrders();
  }, []);

  // Fetch Tickets on Filter / Search / Pagination Change
  useEffect(() => {
    fetchTickets();
  }, [activeTabFilter, statusSelect, rangeSelect, currentPage]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [ticketSearch, globalSearch]);

  // Auto-scroll messages in active ticket
  useEffect(() => {
    if (activeTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages]);

  // Handle Create Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      showToast('⚠️ Subject and detailed description are required.');
      return;
    }

    try {
      setSubmittingTicket(true);
      const res = await apiRequest('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketForm)
      });

      if (res && res.success && res.ticket) {
        showToast(`✓ Ticket ${res.ticket.ticketId} created successfully!`);
        setIsCreateDrawerOpen(false);
        setTicketForm({
          subject: '',
          category: 'Delivery Problems',
          relatedOrderId: '',
          priority: 'High',
          description: '',
          attachmentUrl: ''
        });
        await fetchTickets();
        setActiveTicket(res.ticket);
      } else {
        throw new Error(res?.message || 'Could not create ticket');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      showToast(`⚠️ ${err.message || 'Failed to create support ticket'}`);
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Handle Send Reply
  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const ticketId = activeTicket._id || activeTicket.ticketId;
      const res = await apiRequest(`/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: replyText.trim(),
          senderRole: 'provider'
        })
      });

      if (res && res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTickets(prev =>
          prev.map(t =>
            (t.ticketId === res.ticket.ticketId || t._id === res.ticket._id) ? res.ticket : t
          )
        );
        setReplyText('');
        showToast('✓ Reply sent to TiffinLink Operations.');
      } else {
        throw new Error(res?.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      showToast(`⚠️ ${err.message || 'Failed to send message'}`);
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Close / Resolve Ticket
  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    try {
      const ticketId = activeTicket._id || activeTicket.ticketId;
      const nextStatus = activeTicket.status === 'Resolved' ? 'Closed' : 'Resolved';
      const res = await apiRequest(`/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });

      if (res && res.success && res.ticket) {
        setActiveTicket(res.ticket);
        setTickets(prev =>
          prev.map(t =>
            (t.ticketId === res.ticket.ticketId || t._id === res.ticket._id) ? res.ticket : t
          )
        );
        setSummary(prev => ({
          ...prev,
          open: Math.max(0, prev.open - 1),
          resolved: prev.resolved + 1
        }));
        showToast(`✓ Ticket ${res.ticket.ticketId} marked as ${nextStatus}!`);
      }
    } catch (err) {
      console.error('Error resolving ticket:', err);
      showToast('⚠️ Could not update ticket status.');
    }
  };

  // Format Helper: Relative Time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Helper for Status Badge Styling
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'open') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-clay-earth font-label-caps text-label-caps uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-clay-earth"></span>
          Open
        </span>
      );
    }
    if (s === 'in progress' || s === 'in_progress' || s === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-onyx-black font-label-caps text-label-caps uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
          In Progress
        </span>
      );
    }
    if (s.includes('waiting')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-secondary font-label-caps text-label-caps uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          Waiting for Provider
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface text-secondary font-label-caps text-label-caps uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
        {status || 'Resolved'}
      </span>
    );
  };

  // Categories Definition
  const helpCategories = [
    {
      id: 'CAT // 01',
      title: 'Order Management',
      icon: 'room_service',
      articleCount: '18 Articles',
      desc: 'Protocols for real-time order surges, kitchen preparation countdown adjustments, emergency cancellations, and custom allergen specifications.'
    },
    {
      id: 'CAT // 02',
      title: 'Payments & Payouts',
      icon: 'account_balance_wallet',
      articleCount: '12 Articles',
      desc: 'Escrow clearance schedules, bank direct-credit settlements, UPI audit trails, platform commission reconciliation, and minimum batch thresholds.'
    },
    {
      id: 'CAT // 03',
      title: 'Delivery Problems',
      icon: 'local_shipping',
      articleCount: '24 Articles',
      desc: 'Courier arrival latency, real-time rider reallocation, thermal insulated canister lock integrity, and live GPS corridor discrepancies.'
    },
    {
      id: 'CAT // 04',
      title: 'Tiffin Management',
      icon: 'inventory_2',
      articleCount: '15 Articles',
      desc: 'Nutritional menu catalog parameters, seasonal rotation formulas, daily meal caps, portion variance controls, and canister inventory recovery.'
    },
    {
      id: 'CAT // 05',
      title: 'Account & Profile',
      icon: 'verified_user',
      articleCount: '09 Articles',
      desc: 'Statutory FSSAI certificate upload, kitchen operating shift hours, polygon geofence mapping, and secondary kitchen manager authorizations.'
    },
    {
      id: 'CAT // 06',
      title: 'Technical Issues',
      icon: 'terminal',
      articleCount: '11 Articles',
      desc: 'Acoustic audio chime debugging, thermal kitchen ticket printer drivers, telemetry websocket dropout recovery, and dashboard latency.'
    }
  ];

  // Filtered FAQs based on selected category or search
  const visibleFaqs = faqs.filter(faq => {
    const matchesCat = !selectedCategory || faq.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !globalSearch ||
      faq.question.toLowerCase().includes(globalSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(globalSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-surface px-4 lg:px-8 py-6 font-body-md text-body-md text-on-surface antialiased">
      <div className="flex flex-col w-full pb-24 max-w-7xl mx-auto">
        
        {/* Telemetry Bar */}
        <section className="w-full pt-4 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand-neutral/40">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse"></span>
            <span className="font-label-caps text-label-caps tracking-widest text-secondary uppercase">
              COMMUNICATION &amp; OPERATIONS // PROVIDER SUPPORT DESK • Node: {stationNode} • SLA: &lt;15m Response
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-label-caps uppercase text-secondary">Escalation Desk:</span>
            <span className="font-button-text text-button-text text-onyx-black px-2 py-0.5 bg-surface-container font-semibold">
              L3 Standby
            </span>
          </div>
        </section>

        {/* Editorial Page Title & Quick Navigation Actions */}
        <section className="w-full pt-8 pb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex flex-col max-w-3xl">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest mb-2">
              Concierge &amp; Escalation Ledger
            </span>
            <h1 className="font-headline-lg text-3xl lg:text-5xl text-onyx-black tracking-tight leading-none mb-3">
              Help &amp; Support
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl font-light">
              Direct architectural oversight for order disputes, batch escrow disbursements, dispatch transit irregularities, and atelier kitchen facilities.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
            <button
              type="button"
              onClick={() => {
                categoriesRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high transition-colors text-onyx-black font-button-text text-button-text flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>Browse FAQs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                ledgerRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high transition-colors text-onyx-black font-button-text text-button-text flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
              <span>My Support Tickets ({summary.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateDrawerOpen(true)}
              className="px-5 py-2.5 bg-onyx-black text-on-primary hover:bg-clay-earth transition-colors font-button-text text-button-text flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create Ticket</span>
            </button>
          </div>
        </section>

        {/* Search Bar with Architectural Minimalist Stance */}
        <section className="w-full pb-12">
          <div className="bg-surface-container p-2 flex flex-col md:flex-row items-stretch gap-2">
            <div className="flex-1 flex items-center px-4 py-3 bg-surface">
              <span className="material-symbols-outlined text-secondary mr-3 text-[20px]">search</span>
              <input
                id="globalSupportSearch"
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search topics, batch payouts, transit delays, canisters, or ticket IDs..."
                className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (categoriesRef.current) {
                  categoriesRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-8 py-3 bg-onyx-black text-on-primary font-button-text text-button-text flex items-center justify-center gap-2 hover:bg-clay-earth transition-colors cursor-pointer"
            >
              <span>Query Knowledgebase</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Section B: Support Overview Status Counters (Real MongoDB Dynamic Data) */}
        <section className="w-full pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Open Tickets */}
            <div className="bg-surface-container-low p-6 flex flex-col justify-between transition-colors hover:bg-surface-container">
              <div className="flex items-center justify-between pb-8">
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                  Active Action
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-clay-earth"></span>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth font-semibold">
                    Open
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-display-lg text-4xl lg:text-5xl text-onyx-black leading-none font-normal">
                  {String(summary.open).padStart(2, '0')}
                </span>
                <span className="font-label-caps text-label-caps uppercase text-secondary">
                  Queued
                </span>
              </div>
              <div className="font-body-md text-body-md text-on-surface-variant font-light text-sm">
                Requires kitchen or support agent response to resume fulfillment flow.
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-surface-container-low p-6 flex flex-col justify-between transition-colors hover:bg-surface-container">
              <div className="flex items-center justify-between pb-8">
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                  Active Investigation
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-onyx-black animate-ping"></span>
                  <span className="font-label-caps text-label-caps uppercase text-onyx-black font-semibold">
                    Processing
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-display-lg text-4xl lg:text-5xl text-onyx-black leading-none font-normal">
                  {String(summary.inProgress).padStart(2, '0')}
                </span>
                <span className="font-label-caps text-label-caps uppercase text-secondary">
                  Under Review
                </span>
              </div>
              <div className="font-body-md text-body-md text-on-surface-variant font-light text-sm">
                Assigned to technical operations or live dispatch telematics team.
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-surface-container-low p-6 flex flex-col justify-between transition-colors hover:bg-surface-container">
              <div className="flex items-center justify-between pb-8">
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                  Settled Ledger
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span className="font-label-caps text-label-caps uppercase text-secondary font-semibold">
                    Closed
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-display-lg text-4xl lg:text-5xl text-onyx-black leading-none font-normal">
                  {String(summary.resolved).padStart(2, '0')}
                </span>
                <span className="font-label-caps text-label-caps uppercase text-secondary">
                  Audited Total
                </span>
              </div>
              <div className="font-body-md text-body-md text-on-surface-variant font-light text-sm">
                Successfully verified, closed, and audited with average resolution under 18 mins.
              </div>
            </div>

          </div>
        </section>

        {/* Section C: Browse Help Categories (Structured 3x2 Grid) */}
        <section className="w-full pb-20" id="categories" ref={categoriesRef}>
          <div className="flex items-end justify-between pb-6 mb-6 border-b border-sand-neutral/40">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest mb-1">
                Knowledge Taxonomy
              </span>
              <h2 className="font-headline-md text-2xl lg:text-3xl text-onyx-black">
                Browse Atelier Help Categories
              </h2>
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-onyx-black text-xs font-button-text uppercase tracking-wider cursor-pointer"
              >
                Clear Category Filter
              </button>
            )}
            {!selectedCategory && (
              <span className="font-label-caps text-label-caps text-secondary uppercase hidden sm:block">
                Index: 06 Protocols
              </span>
            )}
          </div>

          {/* Grid of Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((cat) => {
              const isSelected = selectedCategory === cat.title;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(isSelected ? null : cat.title);
                  }}
                  className={`p-6 flex flex-col justify-between group transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-surface-container border-onyx-black'
                      : 'bg-surface-container-low hover:bg-surface-container border-transparent'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-6">
                      <div className="w-10 h-10 bg-surface-container flex items-center justify-center text-onyx-black">
                        <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                      </div>
                      <span className="font-label-caps text-label-caps text-secondary uppercase">{cat.id}</span>
                    </div>
                    <h3 className="font-headline-md text-2xl text-onyx-black mb-2">{cat.title}</h3>
                    <p className="font-body-md text-on-surface-variant font-light leading-relaxed mb-6 text-sm">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-sand-neutral/40">
                    <span className="font-label-caps text-label-caps uppercase text-secondary">{cat.articleCount}</span>
                    <span className="material-symbols-outlined text-onyx-black text-[18px] group-hover:translate-x-1 transition-transform">
                      {isSelected ? 'expand_less' : 'arrow_forward'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive FAQs Accordion (When Category selected or Search active) */}
          {(selectedCategory || globalSearch) && (
            <div className="mt-8 bg-surface-container-low p-6 border-t-2 border-onyx-black animate-slide-down">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-sand-neutral/40">
                <span className="font-label-caps text-clay-earth uppercase tracking-widest font-semibold">
                  {selectedCategory ? `${selectedCategory.toUpperCase()} PROTOCOLS` : 'SEARCH RESULTS'}
                </span>
                <span className="text-xs text-secondary font-label-caps">
                  {visibleFaqs.length} verified answers
                </span>
              </div>

              {visibleFaqs.length === 0 ? (
                <div className="py-6 text-center text-sm text-secondary">
                  No specific articles found. You can submit an urgent inquiry below using the [ Create Ticket ] button.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleFaqs.map((faq) => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div key={faq.id} className="bg-surface p-4">
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                          className="w-full flex items-center justify-between text-left font-button-text text-sm text-onyx-black cursor-pointer"
                        >
                          <span className="font-semibold pr-4">{faq.question}</span>
                          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">
                            {isOpen ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="pt-3 mt-3 border-t border-sand-neutral/40 text-sm font-body-md text-on-surface-variant leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section D & F: Interactive Ledger and Detail Drawer Split */}
        <section className="w-full pb-20" id="ledger" ref={ledgerRef}>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-6">
            <div>
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest mb-1">
                Operational Audit
              </span>
              <h2 className="font-headline-md text-2xl lg:text-3xl text-onyx-black">
                My Support Tickets
              </h2>
            </div>

            {/* Controls & Filter Set */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-surface-container px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">filter_alt</span>
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Filter ticket ID or subject..."
                  className="bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline text-xs w-48"
                />
              </div>

              <div className="bg-surface-container px-3 py-2 flex items-center gap-2">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Status:</span>
                <select
                  value={statusSelect}
                  onChange={(e) => {
                    setStatusSelect(e.target.value);
                    setActiveTabFilter('All');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none outline-none font-button-text text-button-text text-onyx-black cursor-pointer text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Provider">Waiting for Provider</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="bg-surface-container px-3 py-2 flex items-center gap-2">
                <span className="font-label-caps text-label-caps uppercase text-secondary">Range:</span>
                <select
                  value={rangeSelect}
                  onChange={(e) => {
                    setRangeSelect(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none outline-none font-button-text text-button-text text-onyx-black cursor-pointer text-xs"
                >
                  <option value="All">All Time</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Today Only">Today Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tab Strip Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
            <button
              type="button"
              onClick={() => { setActiveTabFilter('All'); setCurrentPage(1); }}
              className={`px-4 py-2 font-button-text text-button-text flex-shrink-0 cursor-pointer transition-colors ${
                activeTabFilter === 'All'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              All ({summary.total})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTabFilter('Open'); setCurrentPage(1); }}
              className={`px-4 py-2 font-button-text text-button-text flex-shrink-0 cursor-pointer transition-colors ${
                activeTabFilter === 'Open'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Open ({summary.open})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTabFilter('In Progress'); setCurrentPage(1); }}
              className={`px-4 py-2 font-button-text text-button-text flex-shrink-0 cursor-pointer transition-colors ${
                activeTabFilter === 'In Progress'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              In Progress ({summary.inProgress})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTabFilter('Waiting for Provider'); setCurrentPage(1); }}
              className={`px-4 py-2 font-button-text text-button-text flex-shrink-0 cursor-pointer transition-colors ${
                activeTabFilter === 'Waiting for Provider'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Waiting for Provider ({summary.waiting})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTabFilter('Resolved'); setCurrentPage(1); }}
              className={`px-4 py-2 font-button-text text-button-text flex-shrink-0 cursor-pointer transition-colors ${
                activeTabFilter === 'Resolved'
                  ? 'bg-onyx-black text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Resolved ({summary.resolved})
            </button>
          </div>

          {/* Split Workspace: Tickets Ledger + Active Live Chat Dossier */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* Tickets Table (Left Column: 7 cols) */}
            <div className="xl:col-span-7 bg-surface-container-low overflow-hidden">
              {loading && tickets.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-3xl animate-spin text-onyx-black">
                    progress_activity
                  </span>
                  <span className="font-button-text text-xs text-secondary">Querying operational ledger...</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-secondary mb-2">
                    inbox
                  </span>
                  <div className="font-headline-md text-lg text-onyx-black mb-1">
                    No Support Tickets Found
                  </div>
                  <p className="font-body-md text-xs text-on-surface-variant max-w-sm mb-4">
                    {ticketSearch || globalSearch
                      ? 'No tickets match your query terms. Try resetting filters.'
                      : 'You do not have any open tickets in this category queue.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateDrawerOpen(true)}
                    className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Create Support Ticket
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container">
                        <th className="p-4 font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                          Ticket ID
                        </th>
                        <th className="p-4 font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                          Subject &amp; Scope
                        </th>
                        <th className="p-4 font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                          Ref
                        </th>
                        <th className="p-4 font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                          Priority
                        </th>
                        <th className="p-4 font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                          Status
                        </th>
                        <th className="p-4 font-label-caps text-label-caps uppercase text-secondary tracking-widest text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md text-on-surface divide-y divide-sand-neutral/30">
                      {tickets.map((t) => {
                        const isSelected = activeTicket && (activeTicket.ticketId === t.ticketId || activeTicket._id === t._id);
                        return (
                          <tr
                            key={t.ticketId || t._id}
                            onClick={() => setActiveTicket(t)}
                            className={`transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-surface hover:bg-surface-container-lowest ring-1 ring-onyx-black'
                                : 'bg-surface-container-low hover:bg-surface-container'
                            }`}
                          >
                            <td className="p-4 font-mono font-medium text-onyx-black text-xs whitespace-nowrap">
                              {t.ticketId}
                            </td>

                            <td className="p-4 max-w-xs">
                              <div className="flex flex-col">
                                <span className="font-medium text-onyx-black text-sm line-clamp-1">
                                  {t.subject}
                                </span>
                                <span className="font-label-caps text-label-caps uppercase text-secondary mt-0.5">
                                  {t.category}
                                </span>
                              </div>
                            </td>

                            <td className="p-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">
                              {t.relatedOrderId ? `Order #${t.relatedOrderId}` : 'Hub General'}
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              <span className={`inline-block px-2 py-0.5 font-label-caps text-label-caps uppercase ${
                                t.priority === 'Critical' || t.priority === 'Urgent'
                                  ? 'bg-error-container text-on-error-container font-bold'
                                  : t.priority === 'High'
                                  ? 'bg-surface-container text-onyx-black font-semibold'
                                  : 'bg-surface-container text-secondary'
                              }`}>
                                {t.priority}
                              </span>
                            </td>

                            <td className="p-4 whitespace-nowrap">
                              {renderStatusBadge(t.status)}
                            </td>

                            <td className="p-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTicket(t);
                                }}
                                className={`px-3 py-1.5 font-button-text text-button-text text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-onyx-black text-on-primary'
                                    : 'bg-surface-container text-onyx-black hover:bg-surface'
                                }`}
                              >
                                {t.status === 'In Progress' ? 'Active Chat' : 'View'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Bar */}
              {pagination.totalCount > 0 && (
                <div className="p-4 bg-surface flex items-center justify-between border-t border-sand-neutral/40">
                  <span className="font-label-caps text-label-caps text-secondary uppercase text-xs">
                    Showing {Math.min((pagination.currentPage - 1) * pagination.limit + 1, pagination.totalCount)} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} tickets
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 bg-surface-container text-secondary hover:text-onyx-black font-button-text text-xs disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="px-2 py-1 bg-onyx-black text-on-primary font-button-text text-xs">
                      {pagination.currentPage}
                    </span>
                    <button
                      type="button"
                      disabled={pagination.currentPage >= pagination.totalPages}
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      className="px-2.5 py-1 bg-surface-container text-secondary hover:text-onyx-black font-button-text text-xs disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section F: Ticket Details & Active Conversation Panel (Right Column: 5 cols) */}
            <div className="xl:col-span-5 bg-surface-container p-6 flex flex-col justify-between min-h-[540px]">
              {activeTicket ? (
                <div>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-onyx-black text-on-primary">
                        {activeTicket.ticketId}
                      </span>
                      <span className="font-label-caps text-label-caps text-secondary uppercase">
                        {activeTicket.status === 'In Progress' ? 'Active Dispatch Session' : 'Incident Dossier'}
                      </span>
                    </div>
                    <span className="font-label-caps text-label-caps text-secondary text-xs">
                      Updated {formatTimeAgo(activeTicket.updatedAt || activeTicket.createdAt)}
                    </span>
                  </div>

                  <h3 className="font-headline-md text-2xl text-onyx-black my-4 leading-snug">
                    {activeTicket.subject}
                  </h3>

                  {/* Metadata Chips Bar */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-surface mb-6 text-xs">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-secondary">Priority</span>
                      <span className="font-button-text text-button-text text-onyx-black font-bold">
                        {activeTicket.priority} Priority
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-secondary">Status</span>
                      <span className="font-button-text text-button-text text-onyx-black">
                        {activeTicket.status}
                      </span>
                    </div>
                    <div className="flex flex-col pt-2">
                      <span className="font-label-caps text-label-caps uppercase text-secondary">Created</span>
                      <span className="font-body-md text-xs text-on-surface">
                        {new Date(activeTicket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex flex-col pt-2">
                      <span className="font-label-caps text-label-caps uppercase text-secondary">Assignee</span>
                      <span className="font-body-md text-xs text-onyx-black font-medium">
                        {activeTicket.assignedTo || 'Snehal M. (Dispatch Lead)'}
                      </span>
                    </div>
                  </div>

                  {/* Thread Conversation Stream */}
                  <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1">
                    {Array.isArray(activeTicket.messages) && activeTicket.messages.length > 0 ? (
                      activeTicket.messages.map((msg, idx) => {
                        const isSupport = msg.senderRole === 'support' || msg.senderRole === 'system';
                        return (
                          <div
                            key={idx}
                            className={`p-4 flex flex-col ${
                              isSupport ? 'bg-surface-container-high' : 'bg-surface'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-button-text text-button-text text-onyx-black flex items-center gap-1.5 text-xs">
                                {isSupport && <span className="w-2 h-2 rounded-full bg-onyx-black"></span>}
                                {msg.senderName || (isSupport ? 'TiffinLink Support' : 'Mansuri Kitchen (Provider)')}
                              </span>
                              <span className="font-mono text-xs text-secondary">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="font-body-md text-body-md text-on-surface-variant font-light text-sm leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-surface text-sm text-secondary italic">
                        {activeTicket.description}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Interactive Quick Reply Zone */}
                  <div className="pt-4 flex flex-col gap-3 border-t border-sand-neutral/40">
                    <div className="bg-surface p-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply to dispatch &amp; support team..."
                        rows={3}
                        className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline p-2 resize-none text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleCloseTicket}
                        className="px-4 py-2.5 bg-surface text-secondary hover:text-onyx-black font-button-text text-button-text text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>{activeTicket.status === 'Resolved' ? 'Close Ticket' : 'Mark Resolved'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={sendingReply || !replyText.trim()}
                        onClick={handleSendReply}
                        className="px-5 py-2.5 bg-onyx-black text-on-primary hover:bg-clay-earth font-button-text text-button-text text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <span>{sendingReply ? 'Sending...' : 'Send Reply'}</span>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-secondary text-sm">
                  Select a ticket from the ledger to view the live conversation stream.
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Section E: Create Support Ticket Drawer / Modal */}
        {isCreateDrawerOpen && (
          <section className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-onyx-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-surface p-8 max-h-[90vh] overflow-y-auto shadow-2xl border-t-4 border-onyx-black">
              
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-sand-neutral/40">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                    Escalation Protocol
                  </span>
                  <h2 className="font-headline-md text-2xl lg:text-3xl text-onyx-black">
                    Create Support Ticket
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-onyx-black text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-6">
                
                {/* Subject Field */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps uppercase text-secondary">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Briefly state your concern, e.g. Courier arrival delayed by 25 mins..."
                    className="w-full bg-surface-container px-4 py-3 font-body-md text-body-md text-on-surface outline-none text-sm"
                  />
                </div>

                {/* Grid 2-col: Category & Order Ref */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-label-caps uppercase text-secondary">
                      Category *
                    </label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-surface-container px-4 py-3 font-body-md text-body-md text-on-surface outline-none cursor-pointer text-sm"
                    >
                      <option value="Delivery Problems">Delivery Problems / Driver Delays</option>
                      <option value="Order Management">Order Management &amp; Prep Time</option>
                      <option value="Payments & Payouts">Payments, Escrow &amp; Payouts</option>
                      <option value="Tiffin Management">Tiffin Canister &amp; Portions</option>
                      <option value="Account & Profile">Account, License &amp; Geofence</option>
                      <option value="Technical Issues">Kitchen Telematics / Printer</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-caps text-label-caps uppercase text-secondary">
                      Related Order ID (Optional)
                    </label>
                    <select
                      value={ticketForm.relatedOrderId}
                      onChange={(e) => setTicketForm(f => ({ ...f, relatedOrderId: e.target.value }))}
                      className="w-full bg-surface-container px-4 py-3 font-body-md text-body-md text-on-surface outline-none cursor-pointer text-sm"
                    >
                      <option value="">General / Not Order Specific</option>
                      {providerOrders.map((ord) => (
                        <option key={ord._id || ord.orderId} value={ord.orderId || ord._id}>
                          #{ord.orderId || ord._id} - {ord.tiffinName || 'Gujarati Special Tiffin'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority Field */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps uppercase text-secondary">
                    Priority Level *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Normal', 'High', 'Critical'].map((pri) => {
                      const isSelected = ticketForm.priority === pri;
                      return (
                        <button
                          key={pri}
                          type="button"
                          onClick={() => setTicketForm(f => ({ ...f, priority: pri }))}
                          className={`p-3 font-button-text text-button-text text-xs uppercase tracking-wider transition-colors cursor-pointer text-center ${
                            isSelected
                              ? 'bg-onyx-black text-on-primary font-bold'
                              : 'bg-surface-container text-onyx-black hover:bg-surface-container-high'
                          }`}
                        >
                          {pri}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps uppercase text-secondary">
                    Detailed Incident Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Provide specific details, order number, courier name, or temperature conditions..."
                    className="w-full bg-surface-container p-4 font-body-md text-body-md text-on-surface outline-none leading-relaxed text-sm resize-none"
                  />
                </div>

                {/* Attachments Zone */}
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-label-caps uppercase text-secondary">
                    Attachments (Optional)
                  </label>
                  <div className="p-5 bg-surface-container flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[28px] text-secondary mb-1">attachment</span>
                    <span className="font-button-text text-button-text text-onyx-black text-xs">
                      Upload Dispatch Photo / Temperature Slip
                    </span>
                    <span className="font-body-md text-[11px] text-secondary mt-0.5">
                      PNG, JPG, or PDF up to 10MB
                    </span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-neutral/40">
                  <button
                    type="button"
                    onClick={() => setIsCreateDrawerOpen(false)}
                    className="px-5 py-3 bg-surface-container text-onyx-black font-button-text text-button-text hover:bg-surface-container-high transition-colors text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="px-6 py-3 bg-onyx-black text-on-primary font-button-text text-button-text hover:bg-clay-earth transition-colors flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    <span>{submittingTicket ? 'Submitting...' : 'Submit Ticket & Notify Helpdesk'}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

              </form>
            </div>
          </section>
        )}

        {/* Editorial Architectural Footer Banner */}
        <section className="w-full p-8 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-6 border-t border-sand-neutral/40">
          <div className="flex flex-col max-w-xl">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest mb-1">
              Direct Helpline
            </span>
            <h3 className="font-headline-md text-2xl text-onyx-black">
              Kitchen Operations Emergency Desk
            </h3>
            <p className="font-body-md text-on-surface-variant font-light text-sm mt-1">
              For active culinary spills, extreme courier accidents, or batch recall scenarios, reach out directly to your assigned Ahmedabad Hub Operations Lead.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="font-mono text-sm font-semibold text-onyx-black">
                +91 (079) 4920-8400
              </span>
              <span className="font-label-caps text-label-caps uppercase text-secondary text-xs">
                Toll-Free Kitchen Hotline
              </span>
            </div>
            <a
              href="tel:+9107949208400"
              className="px-5 py-3 bg-onyx-black text-on-primary font-button-text text-button-text hover:bg-clay-earth transition-colors flex items-center gap-2 text-xs uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Call Hotline</span>
            </a>
          </div>
        </section>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-onyx-black text-on-primary px-5 py-3 shadow-xl flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
            check_circle
          </span>
          <span className="text-xs font-button-text tracking-wide">
            {toastMessage}
          </span>
        </div>
      )}

    </div>
  );
}
