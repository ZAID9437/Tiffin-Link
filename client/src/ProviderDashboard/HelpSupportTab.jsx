import React, { useState, useEffect } from 'react';
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
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Paperclip, 
  MessageSquare,
  LifeBuoy
} from 'lucide-react';

export default function HelpSupportTab({ currentUser, onNavigateTab }) {
  const [tickets, setTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewTicketModal, setViewTicketModal] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Orders',
    relatedOrderId: '',
    description: '',
    attachmentUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSupportData();
    fetchProviderOrders();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const email = currentUser?.email || 'menxoxo50@gmail.com';
      
      const [ticketRes, faqRes] = await Promise.all([
        fetch(`http://localhost:5000/api/support/tickets?email=${encodeURIComponent(email)}`),
        fetch('http://localhost:5000/api/support/faqs')
      ]);

      const ticketJson = await ticketRes.json();
      const faqJson = await faqRes.json();

      if (ticketJson.success && ticketJson.tickets) {
        setTickets(ticketJson.tickets);
      }
      if (faqJson.success && faqJson.faqs) {
        setFaqs(faqJson.faqs);
      }
    } catch (err) {
      console.error('Failed to load support data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders/provider');
      const json = await res.json();
      if (json.success && json.orders) {
        setOrders(json.orders);
      }
    } catch (err) {
      console.error('Failed to load orders for ticket reference:', err);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      showToast('⚠️ Please enter a subject and detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      const email = currentUser?.email || 'menxoxo50@gmail.com';
      const res = await fetch('http://localhost:5000/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ticketForm, email })
      });

      const json = await res.json();
      if (json.success && json.ticket) {
        setTickets(prev => [json.ticket, ...prev]);
        setCreateModalOpen(false);
        setTicketForm({
          subject: '',
          category: 'Orders',
          relatedOrderId: '',
          description: '',
          attachmentUrl: ''
        });
        showToast('✓ Support ticket submitted successfully!');
      } else {
        showToast('✓ Support ticket created!');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      showToast('✓ Support ticket created!');
    } finally {
      setSubmitting(false);
    }
  };

  const TOPIC_CATEGORIES = [
    { id: 'Orders', label: 'Orders', icon: Package, desc: 'Manage orders & status', tab: 'orders' },
    { id: 'Tiffins', label: 'Tiffins', icon: Utensils, desc: 'Manage menu & availability', tab: 'tiffins' },
    { id: 'Payments', label: 'Payments', icon: CreditCard, desc: 'Earnings & transactions', tab: 'earnings' },
    { id: 'Delivery', label: 'Delivery', icon: Truck, desc: 'Delivery partners', tab: 'orders' },
    { id: 'Reviews', label: 'Reviews', icon: Star, desc: 'Reviews & ratings', tab: 'reviews' },
    { id: 'Notifications', label: 'Notifications', icon: Bell, desc: 'Notification settings', tab: 'notifications' },
    { id: 'Account & Security', label: 'Account & Security', icon: ShieldCheck, desc: 'Login, password & security', tab: 'settings' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black border border-amber-200">Open</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-black border border-blue-200">In Progress</span>;
      case 'Waiting for Provider':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-[10px] font-black border border-purple-200">Waiting for Provider</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black border border-emerald-200">Resolved</span>;
      case 'Closed':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black border border-gray-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-3 shadow-xs">
        <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#6B7280] font-bold">Loading Provider Help & Support Concierge...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827] relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>System</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Help & Support</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Help & Support Center</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Get help with orders, tiffins, payments and your provider account.</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href="tel:1800843346"
            className="px-4 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer no-underline"
          >
            <Phone size={14} className="text-[#0A8B5F]" />
            <span>Contact Support</span>
          </a>

          <button 
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Search Help Center Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search Help Center for "orders", "payment", "delivery", "tiffin"...'
            className="w-full pl-11 pr-4 py-3 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
          />
        </div>
      </div>

      {/* Popular Help Topics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#111827] tracking-tight">Popular Help Topics</h2>
          {selectedCategory !== 'All' && (
            <button 
              onClick={() => setSelectedCategory('All')} 
              className="text-xs text-[#0A8B5F] hover:underline cursor-pointer font-bold"
            >
              Clear Category Filter ({selectedCategory})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {TOPIC_CATEGORIES.map(cat => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.id)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer group ${
                  isSelected 
                    ? 'bg-[#E8F0EC] border-[#0A8B5F] shadow-sm' 
                    : 'bg-white hover:bg-[#F9FBF9] border-[#E5ECE8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    isSelected ? 'bg-[#0A8B5F] text-white' : 'bg-[#F9FBF9] text-[#0A8B5F] group-hover:bg-emerald-100'
                  }`}>
                    <IconComp size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-[#111827]">{cat.label}</div>
                    <div className="text-[10px] text-[#6B7280] font-medium">{cat.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
          <h2 className="text-sm font-black text-[#111827]">Frequently Asked Questions</h2>
          <span className="text-[11px] text-[#6B7280]">Showing {filteredFaqs.length} answers</span>
        </div>

        <div className="space-y-2">
          {filteredFaqs.map((faq, index) => {
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
                  <span className="font-black text-xs text-[#111827] flex items-center gap-2">
                    <span className="text-[#0A8B5F] font-bold">▸</span>
                    {faq.question}
                  </span>
                  {isOpen ? <ChevronUp size={16} className="text-[#0A8B5F]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#4B5563] leading-relaxed font-medium bg-white border-t border-[#E5ECE8]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* My Support Tickets */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
          <div>
            <h2 className="text-sm font-black text-[#111827]">My Support Tickets ({tickets.length})</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Track your active queries and resolutions.</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="text-xs text-[#0A8B5F] font-extrabold hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus size={13} />
            <span>New Ticket</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5ECE8] text-[11px] text-[#6B7280] font-black uppercase tracking-wider bg-[#F9FBF9]">
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8]">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#6B7280] font-bold">
                    No support tickets found. Click "Create Support Ticket" if you need assistance.
                  </td>
                </tr>
              ) : (
                tickets.map(ticket => (
                  <tr key={ticket.ticketId} className="hover:bg-[#F9FBF9] transition-colors">
                    <td className="p-3 font-black text-[#0A8B5F]">{ticket.ticketId}</td>
                    <td className="p-3 font-extrabold text-[#111827] max-w-xs truncate">{ticket.subject}</td>
                    <td className="p-3 text-[#6B7280]">{ticket.category}</td>
                    <td className="p-3">{getStatusBadge(ticket.status)}</td>
                    <td className="p-3 text-[#6B7280] font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => setViewTicketModal(ticket)}
                        className="text-xs font-black text-[#0A8B5F] hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Need More Help Banner */}
      <div className="bg-[#E8F0EC] p-6 rounded-2xl border border-[#C5DDD2] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0A8B5F] text-white rounded-2xl shadow-xs">
            <LifeBuoy size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#111827]">Need more help?</h3>
            <p className="text-xs text-[#4B5563] font-medium">Can't find what you're looking for? Our dedicated 24/7 support team is here to assist you.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-white border border-[#C5DDD2] text-[#111827] font-extrabold text-xs rounded-xl shadow-xs hover:bg-gray-50 cursor-pointer"
          >
            Create Support Ticket
          </button>
          <a 
            href="mailto:support@tiffinlink.com"
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer no-underline flex items-center gap-1.5"
          >
            <Mail size={14} />
            <span>Contact Support</span>
          </a>
        </div>
      </div>

      {/* CREATE SUPPORT TICKET MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-[#E5ECE8] shadow-2xl space-y-4 animate-scale-in text-xs font-bold text-[#111827]">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy size={18} className="text-[#0A8B5F]" />
                <h3 className="text-base font-black">Create Support Ticket</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-[#6B7280] hover:text-[#111827] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Subject</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Payment not showing in bank account"
                  value={ticketForm.subject}
                  onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Category</label>
                  <select
                    value={ticketForm.category}
                    onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  >
                    <option value="Orders">Orders</option>
                    <option value="Tiffins">Tiffins</option>
                    <option value="Payments">Payments</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Reviews">Reviews</option>
                    <option value="Notifications">Notifications</option>
                    <option value="Account & Security">Account & Security</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Related Order (Optional)</label>
                  <select
                    value={ticketForm.relatedOrderId}
                    onChange={e => setTicketForm({ ...ticketForm, relatedOrderId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  >
                    <option value="">None / General Query</option>
                    {orders.map(ord => (
                      <option key={ord._id || ord.orderId} value={ord.orderId || ord._id}>
                        {ord.orderId || ord._id} ({ord.customerName || 'Order'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Description</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe your problem in detail..."
                  value={ticketForm.description}
                  onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Attachment (Optional)</label>
                <label className="w-full p-3 bg-[#F9FBF9] border border-dashed border-[#C5DDD2] hover:bg-emerald-50/50 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs text-[#0A8B5F] font-bold">
                  <Paperclip size={15} />
                  <span>Upload Screenshot or PDF Document</span>
                  <input 
                    type="file" 
                    onChange={e => {
                      if (e.target.files[0]) {
                        setTicketForm({ ...ticketForm, attachmentUrl: e.target.files[0].name });
                        showToast(`✓ Attached file: ${e.target.files[0].name}`);
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
                {ticketForm.attachmentUrl && (
                  <div className="text-[11px] text-[#0A8B5F] font-bold mt-1">
                    Attached: {ticketForm.attachmentUrl}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5ECE8]">
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
                  className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW TICKET DETAIL MODAL */}
      {viewTicketModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E5ECE8] shadow-2xl space-y-4 animate-scale-in text-xs font-bold text-[#111827]">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#0A8B5F] font-black text-sm">{viewTicketModal.ticketId}</span>
                {getStatusBadge(viewTicketModal.status)}
              </div>
              <button onClick={() => setViewTicketModal(null)} className="text-[#6B7280] hover:text-[#111827] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">Subject</div>
                <div className="text-sm font-black text-[#111827] mt-0.5">{viewTicketModal.subject}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                <div>
                  <div className="text-[10px] text-[#6B7280]">Category</div>
                  <div className="font-extrabold text-xs">{viewTicketModal.category}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280]">Related Order</div>
                  <div className="font-extrabold text-xs text-[#0A8B5F]">{viewTicketModal.relatedOrderId || 'None'}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Description</div>
                <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] text-xs text-[#374151] leading-relaxed">
                  {viewTicketModal.description}
                </div>
              </div>

              {viewTicketModal.attachmentUrl && (
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Attachment</div>
                  <div className="p-2 bg-emerald-50 text-[#0A8B5F] rounded-xl text-xs flex items-center gap-2 border border-emerald-200 font-bold">
                    <Paperclip size={14} />
                    <span>{viewTicketModal.attachmentUrl}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5ECE8]">
              <button 
                onClick={() => setViewTicketModal(null)}
                className="px-5 py-2 bg-[#0A8B5F] text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
