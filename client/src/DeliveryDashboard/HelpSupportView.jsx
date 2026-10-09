import React, { useState, useEffect, useMemo } from 'react';
import { getSocket } from '../services/socket';

export default function HelpSupportView({ currentUser, onNavigateTab, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Dynamic Data from API
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [faqCategory, setFaqCategory] = useState('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [expandedFaqId, setExpandedFaqId] = useState('faq-1');

  // Form State
  const [formOrderRef, setFormOrderRef] = useState('none');
  const [formCategory, setFormCategory] = useState('payment');
  const [formPriority, setFormPriority] = useState('high');
  const [formSubject, setFormSubject] = useState('Payout discrepancy on weekend monsoon surge bonus');
  const [formDescription, setFormDescription] = useState('Completed 6 consecutive deliveries during Sunday dinner monsoon peak between 07:00 PM and 10:30 PM in Bandra West Sector 4, but the 25% surge incentive ledger entry (#TXN-90214) has not reflected in my available wallet balance. Attached trip completion receipts.');
  const [formAttachment, setFormAttachment] = useState({ name: 'trip_summary_slip_sep22.pdf', size: '1.2 MB' });
  const [formContactChannel, setFormContactChannel] = useState('phone');

  // Ticket Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // User session parameters
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const userEmail = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const userPhone = currentUser?.phone || savedUser?.phone || '';
  const driverName = currentUser?.name || savedUser?.name || 'Courier Partner';
  const driverCode = currentUser?.driverId || savedUser?.driverId || '';

  // CMD+K shortcut binding
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('ticketSearchInput');
        if (input) {
          input.focus();
          input.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch tickets, FAQs, orders on mount
  useEffect(() => {
    fetchSupportData();

    // Socket.io integration
    const socket = getSocket();
    if (socket) {
      socket.on('support:ticket-updated', () => fetchSupportData());
      return () => {
        socket.off('support:ticket-updated');
      };
    }
  }, []);

  const fetchSupportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || localStorage.getItem('tiffinlink_access_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId,
        phone: userPhone
      }).toString();

      // Parallel fetch tickets & FAQs & orders
      const [ticketsRes, faqsRes, ordersRes] = await Promise.all([
        fetch(`/api/support/tickets?${queryParams}`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        }),
        fetch(`/api/support/faqs`),
        fetch(`/api/driver/safety/reports?${queryParams}`, {
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        })
      ]);

      if (ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setTickets(tData.allTickets || tData.tickets || []);
      }

      if (faqsRes.ok) {
        const fData = await faqsRes.json();
        setFaqs(fData.faqs || []);
      }

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setRecentOrders(oData.recentOrders || []);
        if (oData.recentOrders && oData.recentOrders.length > 0) {
          setFormOrderRef(oData.recentOrders[0].orderId);
        }
      }
    } catch (err) {
      console.error('Error fetching support data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('File size exceeds 25MB limit.');
        return;
      }
      setFormAttachment({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      });
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) {
      alert('Please fill out both the Subject Line and Detailed Description.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId,
        phone: userPhone
      }).toString();

      const payload = {
        subject: formSubject.trim(),
        category: formCategory,
        priority: formPriority,
        relatedOrderId: formOrderRef === 'none' ? '' : formOrderRef,
        description: formDescription.trim(),
        attachmentUrl: formAttachment?.name || '',
        contactPreference: formContactChannel,
        email: userEmail
      };

      const res = await fetch(`/api/support/tickets?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit support ticket');
      }

      // Success
      setTickets((prev) => [data.ticket, ...prev]);
      if (onShowToast) {
        onShowToast(`✓ Ticket #${data.ticket.ticketId} created and assigned to Bandra Hub 12.`);
      } else {
        alert(`Support Ticket ${data.ticket.ticketId} successfully created and assigned to Bandra West Hub 12 Fleet Operations.`);
      }

      // Scroll to ticket ledger table
      const ledger = document.getElementById('ticket-ledger');
      if (ledger) ledger.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error('Error creating ticket:', err);
      alert(`Ticket Creation Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendTicketReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token');
      const id = selectedTicket.ticketId || selectedTicket._id;

      const res = await fetch(`/api/support/tickets/${encodeURIComponent(id)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: replyText.trim(), senderRole: 'provider' })
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket);
        setTickets((prev) => prev.map((t) => (t.ticketId === data.ticket.ticketId || t._id === data.ticket._id ? data.ticket : t)));
        setReplyText('');
        if (onShowToast) onShowToast('✓ Reply sent to support desk.');
      }
    } catch (err) {
      console.error('Error sending ticket reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    const list = faqs.length > 0 ? faqs : [
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

    return list.filter((item) => {
      let matchesCat = faqCategory === 'ALL' || item.category === faqCategory || (faqCategory === 'Delivery Help' && item.category === 'Delivery');
      let matchesQ = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${item.question} ${item.answer} ${item.category}`.toLowerCase();
        matchesQ = text.includes(q);
      }
      return matchesCat && matchesQ;
    });
  }, [faqs, faqCategory, searchQuery]);

  // Filtered Tickets Ledger
  const filteredTickets = useMemo(() => {
    return tickets.filter((item) => {
      let matchesStatus = true;
      const s = item.status ? item.status.toUpperCase() : 'OPEN';
      if (ticketStatusFilter === 'OPEN') matchesStatus = s === 'OPEN';
      else if (ticketStatusFilter === 'IN_REVIEW') matchesStatus = s === 'IN REVIEW' || s === 'IN_REVIEW';
      else if (ticketStatusFilter === 'IN_PROGRESS') matchesStatus = s === 'IN PROGRESS' || s === 'IN_PROGRESS';
      else if (ticketStatusFilter === 'WAITING_FOR_DRIVER') matchesStatus = s.includes('WAITING');
      else if (ticketStatusFilter === 'RESOLVED') matchesStatus = s === 'RESOLVED';
      else if (ticketStatusFilter === 'CLOSED') matchesStatus = s === 'CLOSED';

      let matchesQ = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${item.ticketId} ${item.subject} ${item.description} ${item.category}`.toLowerCase();
        matchesQ = text.includes(q);
      }

      return matchesStatus && matchesQ;
    });
  }, [tickets, ticketStatusFilter, searchQuery]);

  return (
    <div className="flex flex-col w-full pb-16 space-y-10 text-on-surface">
      
      {/* Top Context Meta & Page Header */}
      <section className="flex flex-col gap-6 pt-4">
        {/* Breadcrumb & Architecture Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-clay-earth">
          <div className="flex items-center gap-2 font-label-caps text-label-caps tracking-widest uppercase">
            <span className="text-on-surface-variant">Support</span>
            <span className="text-sand-neutral text-xs">/</span>
            <span className="text-onyx-black font-semibold">Help &amp; Support</span>
            <span className="inline-block w-1 h-1 bg-clay-earth rounded-full mx-1"></span>
            <span className="text-on-surface-variant text-[11px]">MongoDB FAQ &amp; Tickets Synced</span>
            <span className="text-sand-neutral text-xs">•</span>
            <span className="text-on-surface-variant text-[11px]">Socket.IO SLA v4.2</span>
          </div>
          <div className="flex items-center gap-2 bg-bone-white px-3 py-1 text-on-surface-variant font-label-caps text-[11px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
            <span>Avg SLA: 8 Mins</span>
            <span className="text-sand-neutral">•</span>
            <span>Hub Dispatcher Online</span>
          </div>
        </div>

        {/* Main Title & Operational Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-headline-lg text-headline-lg text-onyx-black leading-none tracking-tight">Help &amp; Support</h1>
            <p className="font-body-md text-body-md text-clay-earth mt-2">
              Find operational answers, search carrier protocols, or contact our dedicated central dispatch desk.
            </p>
          </div>

          {/* Header Search & Create Ticket Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] sm:min-w-[340px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-clay-earth text-base">search</span>
              <input
                type="text"
                id="ticketSearchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, policies, error codes, #TKT-ID..."
                className="w-full bg-surface-container-lowest pl-9 pr-14 py-2.5 text-on-surface font-body-md text-sm placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-bone-white transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-label-caps text-[10px] text-clay-earth bg-sand-neutral/50 px-1.5 py-0.5 rounded">⌘K</span>
            </div>
            <a
              href="#submit-ticket"
              className="inline-flex items-center gap-2 bg-onyx-black text-on-primary px-5 py-2.5 font-button-text text-button-text hover:bg-clay-earth transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Create Support Ticket</span>
            </a>
          </div>
        </div>
      </section>

      {/* Section 1: Quick Help Category Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Delivery Help */}
        <div
          onClick={() => setFaqCategory(faqCategory === 'Delivery Help' ? 'ALL' : 'Delivery Help')}
          className={`p-5 flex flex-col justify-between transition-colors group cursor-pointer ${
            faqCategory === 'Delivery Help' ? 'bg-onyx-black text-white' : 'bg-bone-white hover:bg-surface-container text-on-surface'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 flex items-center justify-center ${faqCategory === 'Delivery Help' ? 'bg-white/10 text-white' : 'bg-surface-container text-onyx-black group-hover:bg-onyx-black group-hover:text-white'} transition-colors`}>
                <span className="material-symbols-outlined text-lg">local_shipping</span>
              </div>
              <span className={`font-label-caps text-[10px] uppercase tracking-wider px-2 py-0.5 ${faqCategory === 'Delivery Help' ? 'bg-white/20 text-white' : 'text-clay-earth bg-sand-neutral/40'}`}>
                14 Articles
              </span>
            </div>
            <h3 className={`font-headline-md text-xl mb-1 ${faqCategory === 'Delivery Help' ? 'text-white' : 'text-onyx-black'}`}>Delivery Help</h3>
            <p className={`font-body-md text-xs leading-relaxed ${faqCategory === 'Delivery Help' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
              Acceptance window, route delay mitigation, OTP handoffs &amp; customer drop-off protocols.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 bg-sand-neutral/30 -mx-5 -mb-5 px-5 py-2.5">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Active Hub SLA</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
        </div>

        {/* Card 2: Payment & Earnings */}
        <div
          onClick={() => setFaqCategory(faqCategory === 'Payment & Earnings' ? 'ALL' : 'Payment & Earnings')}
          className={`p-5 flex flex-col justify-between transition-colors group cursor-pointer ${
            faqCategory === 'Payment & Earnings' ? 'bg-onyx-black text-white' : 'bg-bone-white hover:bg-surface-container text-on-surface'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 flex items-center justify-center ${faqCategory === 'Payment & Earnings' ? 'bg-white/10 text-white' : 'bg-surface-container text-onyx-black group-hover:bg-onyx-black group-hover:text-white'} transition-colors`}>
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
              <span className={`font-label-caps text-[10px] uppercase tracking-wider px-2 py-0.5 ${faqCategory === 'Payment & Earnings' ? 'bg-white/20 text-white' : 'text-clay-earth bg-sand-neutral/40'}`}>
                18 Articles
              </span>
            </div>
            <h3 className={`font-headline-md text-xl mb-1 ${faqCategory === 'Payment & Earnings' ? 'text-white' : 'text-onyx-black'}`}>Payment &amp; Earnings</h3>
            <p className={`font-body-md text-xs leading-relaxed ${faqCategory === 'Payment & Earnings' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
              Surge bonus calculation, instant IMPS wallet withdrawals, escrow timing &amp; ledger adjustments.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 bg-sand-neutral/30 -mx-5 -mb-5 px-5 py-2.5">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Direct Escrow</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
        </div>

        {/* Card 3: Account & Profile */}
        <div
          onClick={() => setFaqCategory(faqCategory === 'Account & Profile' ? 'ALL' : 'Account & Profile')}
          className={`p-5 flex flex-col justify-between transition-colors group cursor-pointer ${
            faqCategory === 'Account & Profile' ? 'bg-onyx-black text-white' : 'bg-bone-white hover:bg-surface-container text-on-surface'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 flex items-center justify-center ${faqCategory === 'Account & Profile' ? 'bg-white/10 text-white' : 'bg-surface-container text-onyx-black group-hover:bg-onyx-black group-hover:text-white'} transition-colors`}>
                <span className="material-symbols-outlined text-lg">badge</span>
              </div>
              <span className={`font-label-caps text-[10px] uppercase tracking-wider px-2 py-0.5 ${faqCategory === 'Account & Profile' ? 'bg-white/20 text-white' : 'text-clay-earth bg-sand-neutral/40'}`}>
                9 Articles
              </span>
            </div>
            <h3 className={`font-headline-md text-xl mb-1 ${faqCategory === 'Account & Profile' ? 'text-white' : 'text-onyx-black'}`}>Account &amp; Profile</h3>
            <p className={`font-body-md text-xs leading-relaxed ${faqCategory === 'Account & Profile' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
              Document verification, vehicle RC registration, health certificates &amp; thermal crate compliance.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 bg-sand-neutral/30 -mx-5 -mb-5 px-5 py-2.5">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Tier 1 Senior</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
        </div>

        {/* Card 4: Technical Support */}
        <div
          onClick={() => setFaqCategory(faqCategory === 'Technical Support' ? 'ALL' : 'Technical Support')}
          className={`p-5 flex flex-col justify-between transition-colors group cursor-pointer ${
            faqCategory === 'Technical Support' ? 'bg-onyx-black text-white' : 'bg-bone-white hover:bg-surface-container text-on-surface'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 flex items-center justify-center ${faqCategory === 'Technical Support' ? 'bg-white/10 text-white' : 'bg-surface-container text-onyx-black group-hover:bg-onyx-black group-hover:text-white'} transition-colors`}>
                <span className="material-symbols-outlined text-lg">settings_suggest</span>
              </div>
              <span className={`font-label-caps text-[10px] uppercase tracking-wider px-2 py-0.5 ${faqCategory === 'Technical Support' ? 'bg-white/20 text-white' : 'text-clay-earth bg-sand-neutral/40'}`}>
                12 Articles
              </span>
            </div>
            <h3 className={`font-headline-md text-xl mb-1 ${faqCategory === 'Technical Support' ? 'text-white' : 'text-onyx-black'}`}>Technical Support</h3>
            <p className={`font-body-md text-xs leading-relaxed ${faqCategory === 'Technical Support' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
              Corridor GPS drift, local offline cache recovery, Bluetooth printer logs &amp; audio intercom feeds.
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 bg-sand-neutral/30 -mx-5 -mb-5 px-5 py-2.5">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Live Gate</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </div>
        </div>

      </section>

      {/* Section 2: Main Workspace (FAQ + Lateral Dispatch Telemetry) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: FAQ Accordion (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 bg-transparent">
            <div>
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Dynamic Knowledge Base</span>
              <h2 className="font-headline-md text-2xl text-onyx-black">Frequently Asked Questions</h2>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-label-caps">
              <span className="w-1.5 h-1.5 bg-onyx-black rounded-full"></span>
              <span>Category: {faqCategory === 'ALL' ? 'All Topics' : faqCategory}</span>
            </div>
          </div>

          <div className="flex flex-col space-y-2" id="faqAccordionGroup">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 bg-bone-white text-center text-clay-earth">
                <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
                <p className="font-headline-md text-base text-onyx-black">No help articles found</p>
                <p className="font-body-md text-xs mt-1">Try adjusting your search terms or category filter.</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className="faq-item bg-bone-white overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="faq-trigger w-full flex items-center justify-between p-5 text-left focus:outline-none cursor-pointer"
                    >
                      <span className="font-headline-md text-lg text-onyx-black pr-4">{faq.question}</span>
                      <span className="faq-indicator w-6 h-6 flex items-center justify-center bg-sand-neutral/60 text-onyx-black font-semibold text-xs shrink-0">
                        {isExpanded ? '—' : '+'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="faq-content px-5 pb-5 pt-0 text-clay-earth font-body-md text-sm leading-relaxed border-t border-sand-neutral/30 mt-1">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Dedicated Dispatch Telemetry Rail (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Central Desk Hotline Box */}
          <div className="bg-bone-white p-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3">
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Hub Telephony Link</span>
              <span className="inline-flex items-center gap-1 font-label-caps text-[10px] uppercase text-onyx-black bg-sand-neutral/60 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
                VHF Ch 4
              </span>
            </div>
            <h3 className="font-headline-md text-xl text-onyx-black mb-1">Mumbai West Hub 12 Desk</h3>
            <p className="font-body-md text-xs text-clay-earth mb-4">Direct tele-dispatch priority channel for active transit incidents and kitchen delays.</p>
            <div className="bg-surface-container p-3 mb-4">
              <span className="font-label-caps text-[10px] uppercase tracking-wider text-clay-earth block">Priority Courier Hotline</span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-headline-md text-xl tracking-tight text-onyx-black">+91 1800-419-TIFFIN</span>
                <a
                  href="tel:18004198433"
                  className="bg-onyx-black text-white px-2.5 py-1 text-xs font-button-text hover:bg-clay-earth transition-colors"
                >
                  Call
                </a>
              </div>
            </div>
            <div className="space-y-2 text-xs font-body-md">
              <div className="flex items-center justify-between text-clay-earth">
                <span>Hub Dispatch Supervisor</span>
                <span className="text-onyx-black font-medium">Capt. H. Mehta</span>
              </div>
              <div className="flex items-center justify-between text-clay-earth">
                <span>Voice Protocol</span>
                <span className="text-onyx-black font-medium">Encrypted WebRTC SIP</span>
              </div>
              <div className="flex items-center justify-between text-clay-earth">
                <span>Today's Response Rate</span>
                <span className="text-onyx-black font-medium">8.4 mins avg resolution</span>
              </div>
            </div>
          </div>

          {/* Emergency SOS Quick Bridge Banner */}
          <div className="bg-onyx-black text-white p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-error">fmd_bad</span>
                <span className="font-label-caps text-[11px] uppercase tracking-widest text-error font-semibold">Immediate Emergency Protocol</span>
              </div>
              <h4 className="font-headline-md text-lg text-white mb-1">Accident or Vehicle Breakdown?</h4>
              <p className="font-body-md text-xs text-sand-neutral leading-relaxed">
                Trigger automated carrier safety beacon to halt live active trip, notify Hub 12, and dispatch paramedic escort.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('safety-emergency')}
              className="mt-4 inline-flex items-center justify-between w-full bg-bone-white text-onyx-black px-4 py-2 text-xs font-button-text uppercase tracking-wider hover:bg-white transition-colors cursor-pointer"
            >
              <span>Go to Emergency &amp; SOS Center</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

        </div>
      </div>

      {/* Section 3: Create Support Ticket Module (Interactive Form) */}
      <section className="bg-bone-white p-6 sm:p-8 flex flex-col space-y-6" id="submit-ticket">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 bg-sand-neutral/30 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-6 sm:p-8">
          <div>
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Incident Dispatch Escalation</span>
            <h2 className="font-headline-md text-2xl text-onyx-black">Submit a Support Ticket</h2>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 text-xs text-clay-earth">
            <span className="material-symbols-outlined text-sm text-onyx-black">support_agent</span>
            <span className="font-label-caps text-[11px] uppercase">West Mumbai Fleet Coordinator on Standby</span>
          </div>
        </div>

        <form className="flex flex-col space-y-5" onSubmit={handleCreateTicketSubmit}>
          
          {/* Form Row 1: Order + Category + Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Related Order Reference</label>
              <select
                value={formOrderRef}
                onChange={(e) => setFormOrderRef(e.target.value)}
                className="w-full bg-surface-container-lowest px-3 py-2.5 text-sm font-body-md text-on-surface focus:outline-none focus:bg-surface-container"
              >
                {recentOrders.length > 0 ? (
                  recentOrders.map((ord) => (
                    <option key={ord.orderId} value={ord.orderId}>
                      #{ord.orderId} — {ord.customerName} ({ord.deliveryAddress || 'Central Hub'}) [{ord.status}]
                    </option>
                  ))
                ) : (
                  <option value="">No recent active orders linked</option>
                )}
                <option value="none">No Related Order / General Account Support</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Incident Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-surface-container-lowest px-3 py-2.5 text-sm font-body-md text-on-surface focus:outline-none focus:bg-surface-container"
              >
                <option value="payment">Payment &amp; Payouts Discrepancy</option>
                <option value="delivery">Active Delivery &amp; Customer Handoff</option>
                <option value="account">Account, RC &amp; Verification</option>
                <option value="technical">Technical App &amp; GPS Telemetry</option>
                <option value="provider">Provider / Kitchen Handover Delay</option>
                <option value="safety">Safety, Harassment &amp; Road Incident</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Urgency / Priority Tier</label>
              <div className="grid grid-cols-4 gap-1.5 h-[42px]">
                {['low', 'medium', 'high', 'critical'].map((pri) => (
                  <label key={pri} className="cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={pri}
                      checked={formPriority === pri}
                      onChange={() => setFormPriority(pri)}
                      className="peer sr-only"
                    />
                    <span className={`w-full h-full flex items-center justify-center text-xs font-label-caps uppercase transition-colors ${
                      formPriority === pri
                        ? pri === 'critical' ? 'bg-error text-white' : 'bg-onyx-black text-white'
                        : 'bg-surface-container-lowest text-clay-earth'
                    }`}>
                      {pri === 'critical' ? 'SOS' : pri.charAt(0).toUpperCase() + pri.slice(1, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Form Row 2: Subject */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Subject Line</label>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              className="w-full bg-surface-container-lowest px-4 py-2.5 text-sm font-body-md text-on-surface focus:outline-none focus:bg-surface-container"
            />
          </div>

          {/* Form Row 3: Description */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Detailed Explanation &amp; Waypoint Context</label>
            <textarea
              rows={4}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-surface-container-lowest px-4 py-3 text-sm font-body-md text-on-surface focus:outline-none focus:bg-surface-container leading-relaxed"
            />
          </div>

          {/* Form Row 4: Attachment Dropzone & Contact Channel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Attachment file card */}
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Supporting Documents / Trip Logs</label>
              <label className="bg-surface-container-lowest p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-sand-neutral/30 transition-colors block">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-base text-clay-earth">attachment</span>
                  <span className="truncate font-mono text-onyx-black">{formAttachment?.name || 'Tap to attach trip slip...'}</span>
                  {formAttachment?.size && <span className="text-clay-earth text-[11px] shrink-0">({formAttachment.size})</span>}
                </div>
                {formAttachment && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFormAttachment(null); }}
                    className="text-clay-earth hover:text-error transition-colors text-xs font-label-caps uppercase tracking-wider ml-2"
                  >
                    Remove
                  </button>
                )}
              </label>
            </div>

            {/* Contact Preference */}
            <div className="flex flex-col space-y-1.5">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth">Preferred Resolution Channel</label>
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-onyx-black">
                  <input
                    type="radio"
                    name="contactChannel"
                    value="phone"
                    checked={formContactChannel === 'phone'}
                    onChange={() => setFormContactChannel('phone')}
                    className="accent-onyx-black"
                  />
                  <span>Priority Phone Call (+91 98765 43210)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-clay-earth">
                  <input
                    type="radio"
                    name="contactChannel"
                    value="chat"
                    checked={formContactChannel === 'chat'}
                    onChange={() => setFormContactChannel('chat')}
                    className="accent-onyx-black"
                  />
                  <span>In-App Chat Ticket</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body-md text-clay-earth">
                  <input
                    type="radio"
                    name="contactChannel"
                    value="email"
                    checked={formContactChannel === 'email'}
                    onChange={() => setFormContactChannel('email')}
                    className="accent-onyx-black"
                  />
                  <span>Email Summary</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Row 5: Action Controls */}
          <div className="flex items-center justify-between pt-4 bg-sand-neutral/20 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8">
            <button
              type="button"
              onClick={() => { setFormSubject(''); setFormDescription(''); setFormAttachment(null); }}
              className="text-xs font-button-text uppercase tracking-widest text-clay-earth hover:text-onyx-black transition-colors"
            >
              Reset Fields
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-onyx-black text-on-primary px-6 py-3 font-button-text text-button-text flex items-center gap-2 hover:bg-clay-earth transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Transmitting Ticket...</span>
                </>
              ) : (
                <>
                  <span>Submit Support Ticket</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Section 4: My Support Tickets (Strictly Scoped Incident Ledger) */}
      <section className="flex flex-col space-y-4" id="ticket-ledger">
        {/* Header with courier tenant scoping notice */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth">Incident Ledger &amp; SLA Tracking</span>
              <span className="w-1 h-1 bg-clay-earth rounded-full"></span>
              <span className="font-label-caps text-[10px] text-clay-earth tracking-wider uppercase">Strict Scoped View</span>
            </div>
            <h2 className="font-headline-md text-2xl text-onyx-black">My Support Tickets</h2>
          </div>
          <div className="text-right">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-widest block">Principal: #{driverCode} ({driverName})</span>
            <span className="font-label-caps text-[10px] text-on-surface-variant/70 uppercase">Zero cross-tenant visibility enforced</span>
          </div>
        </div>

        {/* Filter Pills Tab Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-bone-white p-1.5" id="ticketTabs">
          {[
            { id: 'ALL', label: `All Tickets (${tickets.length})` },
            { id: 'OPEN', label: 'Open' },
            { id: 'IN_REVIEW', label: 'In Review' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'WAITING_FOR_DRIVER', label: 'Waiting for Driver' },
            { id: 'RESOLVED', label: 'Resolved' },
            { id: 'CLOSED', label: 'Closed' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTicketStatusFilter(tab.id)}
              className={`tab-btn px-3 py-1.5 font-label-caps text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                ticketStatusFilter === tab.id ? 'bg-onyx-black text-white font-semibold' : 'text-clay-earth hover:text-onyx-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tickets Data Table */}
        <div className="bg-bone-white overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-clay-earth">
              <span className="w-6 h-6 border-2 border-onyx-black border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
              <p className="font-body-md text-sm">Fetching authenticated driver support tickets from MongoDB...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center bg-bone-white/50 border border-dashed border-sand-neutral">
              <span className="material-symbols-outlined text-3xl text-clay-earth mb-2">confirmation_number_off</span>
              <p className="font-headline-md text-base text-onyx-black">No Support Tickets Found</p>
              <p className="font-body-md text-xs text-clay-earth mt-1">No support tickets match your current status filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-surface-container font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Subject &amp; Root Context</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status &amp; Agent</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-on-surface font-body-md text-xs">
                {filteredTickets.map((ticket, idx) => {
                  const isHigh = (ticket.priority || '').toUpperCase() === 'HIGH' || (ticket.priority || '').toUpperCase() === 'URGENT';
                  const isEven = idx % 2 === 0;

                  return (
                    <tr key={ticket.ticketId || ticket._id} className={`hover:bg-sand-neutral/30 transition-colors ${isEven ? 'bg-surface-container-lowest' : 'bg-bone-white'}`}>
                      <td className="px-5 py-4 font-mono font-semibold text-onyx-black">{ticket.ticketId}</td>
                      <td className="px-5 py-4 font-body-md font-medium text-onyx-black max-w-xs truncate">
                        {ticket.subject}
                        {ticket.relatedOrderId && (
                          <span className="block text-[11px] font-normal text-clay-earth mt-0.5">Linked Order: #{ticket.relatedOrderId}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-sand-neutral/50 px-2 py-1 font-label-caps text-[10px] text-clay-earth uppercase">
                          {ticket.category || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-label-caps text-[10px] uppercase font-semibold ${isHigh ? 'text-error' : 'text-clay-earth'}`}>
                          {ticket.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ticket.status === 'Open' ? 'bg-onyx-black animate-pulse' : ticket.status === 'Resolved' ? 'bg-emerald-600' : 'bg-clay-earth'}`}></span>
                          <span className="font-label-caps text-[11px] font-semibold text-onyx-black uppercase">{ticket.status}</span>
                        </div>
                        <span className="text-[10px] text-clay-earth block mt-0.5 font-label-caps">{ticket.assignedTo || 'Hub Dispatch Desk'}</span>
                      </td>
                      <td className="px-5 py-4 text-clay-earth">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="bg-onyx-black text-white px-3 py-1 font-button-text text-[11px] uppercase tracking-wider hover:bg-clay-earth transition-colors cursor-pointer"
                        >
                          View Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Ticket Thread Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-onyx-black/70 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-onyx-black hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Hub Telemetry Ticket</span>
            <h3 className="font-headline-md text-xl text-onyx-black mb-1">{selectedTicket.ticketId} — {selectedTicket.subject}</h3>
            <span className="font-label-caps text-xs text-clay-earth block mb-4">Assigned: {selectedTicket.assignedTo || 'Bandra West Hub Desk'}</span>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-bone-white mb-4 border border-sand-neutral">
              <div className="bg-surface-container-lowest p-3 border-l-2 border-onyx-black">
                <div className="flex justify-between items-center mb-1 text-[11px] font-label-caps">
                  <span className="font-bold text-onyx-black">{selectedTicket.providerId || driverCode} (Courier)</span>
                  <span className="text-clay-earth">{selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : ''}</span>
                </div>
                <p className="font-body-md text-xs leading-relaxed text-onyx-black">{selectedTicket.description}</p>
              </div>

              {selectedTicket.messages && selectedTicket.messages.map((msg, i) => (
                <div key={i} className={`p-3 border-l-2 ${msg.senderRole === 'support' ? 'bg-amber-50 border-amber-800 ml-4' : 'bg-surface-container-lowest border-onyx-black'}`}>
                  <div className="flex justify-between items-center mb-1 text-[11px] font-label-caps">
                    <span className="font-bold text-onyx-black">{msg.senderName || msg.senderRole}</span>
                    <span className="text-clay-earth">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</span>
                  </div>
                  <p className="font-body-md text-xs leading-relaxed text-onyx-black">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type reply message to Hub supervisor..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTicketReply()}
                className="flex-1 bg-bone-white px-3 py-2 text-xs font-body-md text-onyx-black focus:outline-none border border-sand-neutral"
              />
              <button
                type="button"
                disabled={sendingReply}
                onClick={handleSendTicketReply}
                className="px-4 py-2 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider hover:bg-clay-earth disabled:opacity-50 cursor-pointer"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Provenance & Cryptographic Security Footer */}
      <footer className="pt-6 mt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-clay-earth font-label-caps text-[11px] uppercase tracking-wider border-t border-sand-neutral/60">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-onyx-black"></span>
          <span>Scoped Principal: {driverName} (#{driverCode})</span>
          <span className="text-sand-neutral">•</span>
          <span>Bandra West Hub 12</span>
        </div>
        <div className="flex items-center gap-4 text-clay-earth">
          <span>TLS 1.3 End-to-End Encrypted Support Gateway</span>
          <span>•</span>
          <span>Asia/Kolkata (IST)</span>
        </div>
      </footer>

    </div>
  );
}
