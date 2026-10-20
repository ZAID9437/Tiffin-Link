import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCw,
  Download,
  Plus,
  Calendar,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  DollarSign,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  User,
  Filter,
  Package,
  Edit3,
  Play
} from 'lucide-react';

import { apiRequest } from '../services/api';

export default function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    expiringSoonCount: 0,
    pausedCount: 0,
    monthlyRevenue: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Subscription for Details Side Drawer
  const [selectedSub, setSelectedSub] = useState(null);

  // Create Subscription Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [realCustomers, setRealCustomers] = useState([]);
  const [realTiffins, setRealTiffins] = useState([]);

  // Create Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newFrequency, setNewFrequency] = useState('Daily');
  const [newMealType, setNewMealType] = useState('Lunch');
  const [newAmount, setNewAmount] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDeliveryDays, setNewDeliveryDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  useEffect(() => {
    fetchSubscriptionsFromDb();
  }, [searchQuery, statusFilter, planFilter, currentPage]);

  useEffect(() => {
    fetchRealCustomersAndTiffins();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchSubscriptionsFromDb = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        plan: planFilter,
        page: currentPage,
        limit: 5
      });

      const json = await apiRequest(`/subscriptions?${queryParams.toString()}`);

      if (json.success && json.data) {
        if (Array.isArray(json.data.subscriptions)) {
          setSubscriptions(json.data.subscriptions);
        }
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
        if (json.data.pagination) {
          setPagination(json.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealCustomersAndTiffins = async () => {
    try {
      const cRes = await apiRequest('/customers');
      const cJson = await cRes.json();
      if (cJson.success && cJson.data && Array.isArray(cJson.data.customers)) {
        setRealCustomers(cJson.data.customers);
      }

      const tRes = await apiRequest('/tiffins');
      const tJson = await tRes.json();
      if (tJson.success && Array.isArray(tJson.data)) {
        setRealTiffins(tJson.data);
      }
    } catch (err) {
      console.error('Error fetching real customers/tiffins:', err);
    }
  };

  // Status Change Handler (Pause, Resume, Cancel)
  const handleUpdateStatus = async (subId, newStatus) => {
    try {
      const json = await apiRequest(`/subscriptions/${subId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          deliveryDays: selectedSub?.deliveryDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        })
      });
      if (json.success) {
        showToast(`Subscription status updated to ${newStatus}`);
        if (selectedSub) {
          setSelectedSub({ ...selectedSub, status: newStatus });
        }
        fetchSubscriptionsFromDb();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Create Subscription Handler
  const handleCreateSubscription = async (e) => {
    if (e) e.preventDefault();
    if (!newCustName || !newPlanName) {
      showToast('Please select a valid customer and tiffin plan');
      return;
    }

    try {
      setSaving(true);
      const json = await apiRequest('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          customerName: newCustName,
          customerPhone: newCustPhone,
          customerEmail: newCustEmail,
          plan: newPlanName,
          frequency: newFrequency,
          mealType: newMealType,
          amount: Number(newAmount),
          startDate: newStartDate,
          endDate: newEndDate,
          address: newAddress,
          deliveryDays: newDeliveryDays,
          paymentStatus: 'PAID'
        })
      });
      if (json.success) {
        showToast(`Created subscription for ${newCustName}`);
        setIsCreateModalOpen(false);
        fetchSubscriptionsFromDb();
      }
    } catch (err) {
      console.error('Error creating subscription:', err);
    } finally {
      setSaving(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (subscriptions.length === 0) return;

    const headers = ['Subscription ID', 'Customer Name', 'Phone', 'Plan', 'Frequency', 'Next Delivery', 'Amount', 'Payment Status', 'Status'];
    const rows = subscriptions.map(s => [
      `"${s.subId || ''}"`,
      `"${s.customerName || ''}"`,
      `"${s.customerPhone || ''}"`,
      `"${s.plan || ''}"`,
      `"${s.frequency || 'Daily'}"`,
      `"${s.nextDeliveryDate || ''}"`,
      s.amount || 0,
      `"${s.paymentStatus || 'PAID'}"`,
      `"${s.status || 'ACTIVE'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscriptions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-bone-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-sand-neutral/30 font-button-text">
          <CheckCircle2 size={17} className="text-emerald-500" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-sand-neutral/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-label-caps tracking-widest text-clay-earth uppercase font-bold mb-1">
            <span>Provider</span>
            <span className="text-sand-neutral">/</span>
            <span>Customers</span>
            <span className="text-sand-neutral">/</span>
            <span className="text-onyx-black font-extrabold">Subscriptions</span>
          </div>

          <h1 className="font-headline-lg text-2xl md:text-3xl font-normal text-onyx-black tracking-tight">Subscriptions</h1>
          <p className="font-body-md text-xs text-secondary mt-1">Manage recurring meal plans, schedules and subscriber relationships.</p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Search Input */}
          <div className="relative min-w-[180px] sm:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-secondary" />
            <input
              type="text"
              placeholder="Search subscriber..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black focus:outline-none focus:border-onyx-black shadow-xs"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-surface-container border border-sand-neutral/40 hover:bg-surface-container-highest text-onyx-black font-button-text font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="text-onyx-black" />
            <span>Export</span>
          </button>

          {/* Create Subscription Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-onyx-black hover:bg-neutral-800 text-bone-white font-button-text font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: ACTIVE SUBSCRIPTIONS */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="text-xs font-label-caps font-bold text-secondary uppercase tracking-wider mb-2">ACTIVE SUBSCRIPTIONS</div>
          <div className="text-3xl font-headline-lg font-normal text-onyx-black">{metrics.activeCount || 0}</div>
        </div>

        {/* Card 2: EXPIRING SOON */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="text-xs font-label-caps font-bold text-secondary uppercase tracking-wider mb-2">EXPIRING SOON</div>
          <div className="text-3xl font-headline-lg font-normal text-amber-700">{metrics.expiringSoonCount || 0}</div>
        </div>

        {/* Card 3: PAUSED */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="text-xs font-label-caps font-bold text-secondary uppercase tracking-wider mb-2">PAUSED</div>
          <div className="text-3xl font-headline-lg font-normal text-clay-earth">{metrics.pausedCount || 0}</div>
        </div>

        {/* Card 4: MONTHLY REVENUE */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs">
          <div className="text-xs font-label-caps font-bold text-secondary uppercase tracking-wider mb-2">MONTHLY REVENUE</div>
          <div className="text-3xl font-headline-lg font-normal text-onyx-black">₹{Number(metrics.monthlyRevenue || 0).toLocaleString()}</div>
        </div>

      </div>

      {/* FILTER BAR */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-label-caps font-bold text-secondary">
          <Filter size={15} className="text-clay-earth" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-label-caps text-secondary">Status:</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-surface-container border border-sand-neutral/40 text-xs font-label-caps font-bold text-onyx-black rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
            </select>
          </div>

          {/* Plan Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-label-caps text-secondary">Plan:</span>
            <select
              value={planFilter}
              onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-surface-container border border-sand-neutral/40 text-xs font-label-caps font-bold text-onyx-black rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Plans</option>
              <option value="Monthly">Monthly Plans</option>
              <option value="Weekly">Weekly Plans</option>
              <option value="Gujarati">Gujarati Thali</option>
              <option value="Jain">Jain Special</option>
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVE SUBSCRIPTIONS TABLE */}
      <div className="bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-sand-neutral/30 bg-surface-container-low flex items-center justify-between">
          <h2 className="text-xs font-bold font-label-caps text-onyx-black uppercase tracking-wider">ACTIVE SUBSCRIPTIONS</h2>
          <span className="text-xs text-secondary font-label-caps">Page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
            <p className="font-body-md text-xs text-secondary">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package size={40} className="mx-auto text-secondary opacity-60" />
            <h3 className="font-headline-md text-base text-onyx-black font-normal">No Subscriptions Found</h3>
            <p className="font-body-md text-xs text-secondary">Adjust search query or filter options.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-onyx-black">
                <thead className="bg-surface-container-low border-b border-sand-neutral/30 text-secondary font-label-caps font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Frequency</th>
                    <th className="p-4">Next Delivery</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-neutral/30 font-medium">
                  {subscriptions.map(sub => (
                    <tr
                      key={sub._id || sub.subId}
                      onClick={() => setSelectedSub(sub)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      {/* Customer */}
                      <td className="p-4 font-bold text-onyx-black">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-surface-container text-onyx-black font-bold text-xs flex items-center justify-center shrink-0 border border-sand-neutral/40 font-label-caps">
                            {sub.customerName ? sub.customerName.slice(0, 2).toUpperCase() : 'CU'}
                          </div>
                          <div>
                            <div className="font-bold text-onyx-black text-sm">{sub.customerName}</div>
                            <div className="text-[10px] text-secondary font-mono">{sub.subId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="p-4 text-onyx-black font-semibold">
                        {sub.plan}
                      </td>

                      {/* Frequency */}
                      <td className="p-4 text-secondary">
                        {sub.frequency || 'Daily'}
                      </td>

                      {/* Next Delivery */}
                      <td className="p-4 text-onyx-black font-semibold">
                        {sub.nextDeliveryDate || '18 Aug'}
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-sm font-bold text-onyx-black">
                        ₹{Number(sub.amount || 3200).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[10px] font-label-caps font-bold rounded-md uppercase border ${
                          sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                          sub.status === 'PAUSED' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                          'bg-error-container text-on-error-container border-error/20'
                        }`}>
                          ● {sub.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Action View */}
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSub(sub);
                          }}
                          className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-highest text-onyx-black border border-sand-neutral/40 text-xs font-button-text font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-sand-neutral/30">
              {subscriptions.map(sub => (
                <div
                  key={sub._id || sub.subId}
                  onClick={() => setSelectedSub(sub)}
                  className="p-4 space-y-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-surface-container text-onyx-black font-bold text-xs flex items-center justify-center shrink-0 border border-sand-neutral/40">
                        {sub.customerName ? sub.customerName.slice(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div>
                        <div className="font-bold text-onyx-black">{sub.customerName}</div>
                        <div className="text-[10px] text-secondary">{sub.plan}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-label-caps font-bold rounded-md uppercase border ${
                      sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                      sub.status === 'PAUSED' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                      'bg-error-container text-on-error-container border-error/20'
                    }`}>
                      ● {sub.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-sand-neutral/30 text-xs">
                    <div>
                      <span className="text-secondary">Next: </span>
                      <strong className="text-onyx-black">{sub.nextDeliveryDate}</strong>
                    </div>
                    <div>
                      <span className="text-secondary">Amount: </span>
                      <strong className="text-onyx-black">₹{sub.amount}</strong>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSub(sub);
                      }}
                      className="px-2.5 py-1 bg-surface-container text-onyx-black font-bold text-[11px] rounded-lg border border-sand-neutral/40"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Server-Side Pagination Controls */}
        <div className="p-4 border-t border-sand-neutral/30 bg-surface-container-low flex items-center justify-between text-xs font-label-caps text-secondary">
          <div>
            Showing <span className="text-onyx-black font-bold">{subscriptions.length}</span> of <span className="text-onyx-black font-bold">{pagination.total}</span> subscriptions
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-sand-neutral/40 hover:bg-surface-container disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-label-caps font-bold cursor-pointer transition-colors ${
                  currentPage === page ? 'bg-onyx-black text-bone-white shadow-xs' : 'hover:bg-surface-container text-secondary'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-sand-neutral/40 hover:bg-surface-container disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* SUBSCRIPTION DETAILS SIDE DRAWER / MODAL */}
      {selectedSub && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-surface-container-lowest w-full max-w-md h-full shadow-2xl p-6 border-l border-sand-neutral/40 animate-slide-left space-y-5 overflow-y-auto text-xs text-onyx-black">

            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-sand-neutral/30 pb-3">
              <h2 className="text-base font-bold font-label-caps text-onyx-black">Subscription Details</h2>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-xl border border-sand-neutral/40 hover:bg-surface-container text-secondary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile & Status Header */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-sand-neutral/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-onyx-black text-bone-white font-bold text-sm flex items-center justify-center shadow-md">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-onyx-black">{selectedSub.customerName}</h3>
                  <p className="text-[10px] text-secondary font-mono">{selectedSub.customerPhone}</p>
                </div>
              </div>

              <span className={`px-3 py-1 text-[10px] font-label-caps font-bold rounded-full uppercase border ${
                selectedSub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                selectedSub.status === 'PAUSED' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                'bg-error-container text-on-error-container border-error/20'
              }`}>
                ● {selectedSub.status || 'ACTIVE'}
              </span>
            </div>

            {/* Plan Info Fields */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-sand-neutral/40 space-y-3">
              <div>
                <label className="text-[10px] font-label-caps text-secondary uppercase">Plan</label>
                <div className="text-sm font-bold text-onyx-black">{selectedSub.plan}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sand-neutral/30">
                <div>
                  <label className="text-[10px] font-label-caps text-secondary uppercase">Frequency</label>
                  <div className="text-xs font-bold text-onyx-black">{selectedSub.frequency || 'Daily'}</div>
                </div>

                <div>
                  <label className="text-[10px] font-label-caps text-secondary uppercase">Meal Type</label>
                  <div className="text-xs font-bold text-onyx-black">{selectedSub.mealType || 'Lunch'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sand-neutral/30">
                <div>
                  <label className="text-[10px] font-label-caps text-secondary uppercase">Start Date</label>
                  <div className="text-xs font-bold text-onyx-black">{selectedSub.startDate || '01 Aug 2026'}</div>
                </div>

                <div>
                  <label className="text-[10px] font-label-caps text-secondary uppercase">End Date</label>
                  <div className="text-xs font-bold text-onyx-black">{selectedSub.endDate || '31 Aug 2026'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-sand-neutral/30">
                <div>
                  <label className="text-[10px] font-label-caps text-secondary uppercase">Next Delivery</label>
                  <div className="text-xs font-bold text-onyx-black">{selectedSub.nextDeliveryDate || '18 Aug 2026'}</div>
                </div>

                <div>
                  <label className="text-[10px] font-label-caps text-secondary uppercase">Payment Status</label>
                  <div className="text-xs font-bold text-emerald-800 uppercase">{selectedSub.paymentStatus || 'PAID'}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-sand-neutral/30 flex justify-between items-center">
                <span className="text-xs text-secondary font-label-caps">Total Amount:</span>
                <strong className="text-base font-bold text-onyx-black">₹{Number(selectedSub.amount || 3200).toLocaleString()}</strong>
              </div>
            </div>

            {/* DELIVERY SCHEDULE DAYS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold font-label-caps text-onyx-black uppercase tracking-wider">DELIVERY SCHEDULE</h4>

              <div className="grid grid-cols-4 gap-2 text-center">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const isScheduled = (selectedSub.deliveryDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).includes(day);
                  return (
                    <div
                      key={day}
                      className={`p-2 rounded-xl border text-xs font-label-caps font-bold flex items-center justify-center gap-1 ${
                        isScheduled ? 'bg-surface-container text-onyx-black border-sand-neutral/50' : 'bg-surface-container-low text-secondary opacity-50 border-sand-neutral/30'
                      }`}
                    >
                      <span>{isScheduled ? '✓' : '○'}</span>
                      <span>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="pt-3 border-t border-sand-neutral/30 flex items-center gap-2">
              {selectedSub.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedSub._id || selectedSub.id, 'PAUSED')}
                  className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-button-text font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PauseCircle size={15} />
                  <span>Pause</span>
                </button>
              ) : selectedSub.status === 'PAUSED' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedSub._id || selectedSub.id, 'ACTIVE')}
                  className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-button-text font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play size={15} />
                  <span>Resume</span>
                </button>
              ) : null}

              {selectedSub.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedSub._id || selectedSub.id, 'CANCELLED')}
                  className="px-3 py-2.5 bg-error-container hover:bg-error-container/80 text-on-error-container border border-error/20 font-button-text font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <XCircle size={15} />
                  <span>Cancel</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CREATE SUBSCRIPTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-sand-neutral/40 animate-scale-in">
            <div className="flex items-center justify-between border-b border-sand-neutral/30 pb-3">
              <h3 className="text-base font-bold font-label-caps text-onyx-black">Create New Subscription</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-secondary hover:text-onyx-black rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-3">
              {/* Select Customer */}
              <div className="space-y-1">
                <label className="text-xs font-label-caps font-bold text-secondary">Select Customer</label>
                <select
                  onChange={e => {
                    const cust = realCustomers.find(c => c.name === e.target.value);
                    setNewCustName(e.target.value);
                    if (cust) {
                      setNewCustPhone(cust.phone || '');
                      setNewCustEmail(cust.email || '');
                      setNewAddress(cust.address || 'Ahmedabad');
                    }
                  }}
                  className="w-full px-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black focus:outline-none focus:border-onyx-black cursor-pointer"
                  required
                >
                  <option value="">-- Choose Registered Customer --</option>
                  {realCustomers.map(c => (
                    <option key={c.id || c._id || c.name} value={c.name}>{c.name} ({c.phone || '+91 98765 43210'})</option>
                  ))}
                </select>
              </div>

              {/* Select Tiffin Plan */}
              <div className="space-y-1">
                <label className="text-xs font-label-caps font-bold text-secondary">Tiffin Plan / Package</label>
                <select
                  onChange={e => {
                    const tif = realTiffins.find(t => t.name === e.target.value);
                    setNewPlanName(e.target.value);
                    if (tif) {
                      setNewAmount((tif.price || 120) * 26);
                    }
                  }}
                  className="w-full px-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black focus:outline-none focus:border-onyx-black cursor-pointer"
                  required
                >
                  <option value="">-- Choose Tiffin Plan --</option>
                  {realTiffins.map(t => (
                    <option key={t._id || t.id || t.name} value={t.name}>{t.name} (₹{t.price}/meal)</option>
                  ))}
                </select>
              </div>

              {/* Frequency Radio Buttons */}
              <div className="space-y-1">
                <label className="text-xs font-label-caps font-bold text-secondary">Frequency</label>
                <div className="flex items-center gap-4 pt-1">
                  {['Daily', 'Weekly', 'Monthly'].map(freq => (
                    <label key={freq} className="flex items-center gap-1.5 text-xs font-label-caps cursor-pointer">
                      <input
                        type="radio"
                        name="freq"
                        value={freq}
                        checked={newFrequency === freq}
                        onChange={e => setNewFrequency(e.target.value)}
                        className="w-3.5 h-3.5 accent-onyx-black cursor-pointer"
                      />
                      <span>{freq}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Meal Type & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-label-caps font-bold text-secondary">Meal Type</label>
                  <select
                    value={newMealType}
                    onChange={e => setNewMealType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black"
                  >
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Lunch & Dinner">Lunch & Dinner</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-label-caps font-bold text-secondary">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black"
                  />
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-label-caps font-bold text-secondary">Start Date</label>
                  <input
                    type="text"
                    placeholder="01 Aug 2026"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-label-caps font-bold text-secondary">End Date</label>
                  <input
                    type="text"
                    placeholder="31 Aug 2026"
                    value={newEndDate}
                    onChange={e => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-sand-neutral/40 rounded-xl text-xs font-label-caps text-onyx-black"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-sand-neutral/30 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-onyx-black font-button-text font-bold text-xs rounded-xl cursor-pointer border border-sand-neutral/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-onyx-black hover:bg-neutral-800 text-bone-white font-button-text font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
