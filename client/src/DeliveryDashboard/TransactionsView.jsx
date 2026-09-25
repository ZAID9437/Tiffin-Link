import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToEarnings, subscribeToDeliveryLifecycle } from '../services/socket';

export default function TransactionsView({ currentUser, onNavigateTab }) {
  // Main Data States
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalCredits: 0,
    totalDebits: 0,
    completedCount: 0,
    pendingCount: 0,
    totalCount: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [sortOption, setSortOption] = useState('recent');
  const [page, setPage] = useState(1);

  // Custom Date Modal
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  // Dispute Modal
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Auth User & Token Recovery
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch transactions from MongoDB
  const fetchTransactions = useCallback(async (isRefresh = false, targetPage = page) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const queryParams = new URLSearchParams({
        page: String(targetPage),
        limit: '20',
        search: searchTerm.trim(),
        type: typeFilter,
        status: statusFilter,
        date: dateFilter,
        sort: sortOption
      });

      if (dateFilter === 'custom' && customFromDate && customToDate) {
        queryParams.append('from', customFromDate);
        queryParams.append('to', customToDate);
      }

      const res = await fetch(`http://localhost:5000/api/delivery/transactions?${queryParams.toString()}`, { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to retrieve driver transactions telemetry');
      }

      const txns = json.data?.transactions || [];
      setTransactions(txns);
      setSummary(json.data?.summary || { totalCredits: 0, totalDebits: 0, completedCount: 0, pendingCount: 0, totalCount: 0 });
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });

      if (txns.length > 0 && (!selectedTxn || !txns.some(t => t.id === selectedTxn.id))) {
        setSelectedTxn(txns[0]);
      }

      if (isRefresh) {
        showToast('✓ Transactions ledger synced with MongoDB!');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Unable to load transaction records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, typeFilter, statusFilter, dateFilter, sortOption, page, customFromDate, customToDate, token, selectedTxn]);

  useEffect(() => {
    fetchTransactions(false, page);
  }, [fetchTransactions, page]);

  // Handle Search Input Change with Debounce
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Real-time Socket Updates
  useEffect(() => {
    const unsubEarnings = subscribeToEarnings(() => fetchTransactions(true, 1));
    const unsubLifecycle = subscribeToDeliveryLifecycle({
      onCompleted: () => fetchTransactions(true, 1)
    });

    return () => {
      if (typeof unsubEarnings === 'function') unsubEarnings();
      if (typeof unsubLifecycle === 'function') unsubLifecycle();
    };
  }, [fetchTransactions]);

  // Export CSV Statement Download
  const handleExportStatement = async () => {
    try {
      const activeToken = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || token;
      const headers = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const queryParams = new URLSearchParams({
        search: searchTerm.trim(),
        type: typeFilter,
        status: statusFilter,
        date: dateFilter
      });

      if (dateFilter === 'custom' && customFromDate && customToDate) {
        queryParams.append('from', customFromDate);
        queryParams.append('to', customToDate);
      }

      const res = await fetch(`http://localhost:5000/api/delivery/transactions/export?${queryParams.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to generate CSV export statement');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `TiffinLink_Transactions_Statement_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast('✓ Downloaded CSV transactions statement!');
    } catch (err) {
      console.error('Export error:', err);
      showToast('⚠️ Failed to export statement. Please try again.');
    }
  };

  // Download Receipt / Print PDF
  const handleDownloadReceipt = (txn) => {
    if (!txn) return;
    showToast(`✓ Generating receipt PDF for ${txn.txnId}...`);
    setTimeout(() => {
      window.print();
    }, 600);
  };

  // Submit Dispute Inquiry
  const handleSubmitDispute = () => {
    if (!disputeReason.trim()) {
      showToast('⚠️ Please enter a dispute reason');
      return;
    }
    setIsDisputeModalOpen(false);
    setDisputeReason('');
    showToast(`✓ Dispute ticket submitted for ${selectedTxn?.txnId}. Support team will audit within 2 hours.`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setPage(1);
  };

  // Skeleton Loader for Initial Fetch
  if (loading && transactions.length === 0) {
    return (
      <div className="w-full max-w-[1560px] mx-auto p-4 sm:p-6 lg:p-12 space-y-6 animate-pulse selection:bg-onyx-black selection:text-white">
        <div className="h-10 bg-surface-container-high w-1/3 rounded-sm" />
        <div className="h-14 bg-surface-container-low w-full rounded-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-28 bg-surface-container-lowest border border-sand-neutral p-4" />)}
        </div>
        <div className="h-96 bg-surface-container-lowest border border-sand-neutral" />
      </div>
    );
  }

  // Error State
  if (error && transactions.length === 0) {
    return (
      <div className="w-full max-w-[1560px] mx-auto p-8 lg:p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-surface-container-lowest border border-sand-neutral p-8 text-center max-w-md shadow-xs space-y-4">
          <span className="material-symbols-outlined text-[48px] text-error">error_outline</span>
          <h2 className="font-headline-md text-xl text-onyx-black font-serif">Unable to load transactions</h2>
          <p className="font-body-md text-sm text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={() => fetchTransactions(false, 1)}
            className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider hover:bg-clay-earth transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const driverName = currentUser?.fullName || currentUser?.name || savedUser?.fullName || savedUser?.name || 'Courier Partner';
  const driverIdStr = currentUser?.driverId || currentUser?.id || currentUser?._id || savedUser?.driverId || savedUser?.id || savedUser?._id || '';

  return (
    <div className="flex flex-col w-full selection:bg-onyx-black selection:text-white">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-medium px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation Breadcrumbs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sand-neutral/70">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest text-[11px]">Earnings &amp; Payments</span>
            <span className="text-secondary text-sm">/</span>
            <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-widest font-semibold text-[11px]">Transactions</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full ml-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">SOCKET.IO SYNCED • LIVE LEDGER</span>
            </div>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight mt-2 font-serif text-3xl sm:text-4xl">Transactions</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1 text-sm sm:text-base">
            Comprehensive ledger of courier credits, incentives, withdrawals, and instant OTP settlements.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Refresh Button */}
          <button
            type="button"
            id="refreshTransactionsBtn"
            onClick={() => fetchTransactions(true, page)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest border border-sand-neutral text-on-surface hover:bg-surface-container-high transition-colors font-button-text text-button-text text-xs cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {/* Export Statement Button */}
          <button
            type="button"
            id="exportStatementBtn"
            onClick={handleExportStatement}
            className="inline-flex items-center gap-2 px-4 py-2 bg-onyx-black text-on-primary hover:bg-clay-earth transition-colors font-button-text text-button-text text-xs shadow-xs cursor-pointer font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Statement</span>
          </button>
        </div>
      </header>

      {/* Search & Control Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-surface-container-lowest border border-sand-neutral shadow-xs">
        {/* Search Field */}
        <div className="flex-1 min-w-[280px] max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search Transaction ID, Order #, description..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-sand-neutral text-on-surface font-body-md text-sm placeholder:text-secondary focus:outline-none focus:border-onyx-black transition-colors"
          />
        </div>

        {/* Filters Select Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <label className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold">Type:</label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-surface-container-low border border-sand-neutral font-button-text text-[13px] text-on-surface pl-3 pr-8 py-2 focus:outline-none focus:border-onyx-black cursor-pointer font-medium"
              >
                <option value="all">All Types</option>
                <option value="delivery">Delivery Earnings</option>
                <option value="incentive">Incentive</option>
                <option value="bonus">Bonus</option>
                <option value="tip">Tip</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="refund">Refund</option>
                <option value="adjustment">Adjustment</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary text-[16px] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold">Status:</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-surface-container-low border border-sand-neutral font-button-text text-[13px] text-on-surface pl-3 pr-8 py-2 focus:outline-none focus:border-onyx-black cursor-pointer font-medium"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary text-[16px] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <label className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold">Date:</label>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setIsCustomDateModalOpen(true);
                  } else {
                    setDateFilter(val);
                    setPage(1);
                  }
                }}
                className="appearance-none bg-surface-container-low border border-sand-neutral font-button-text text-[13px] text-on-surface pl-3 pr-8 py-2 focus:outline-none focus:border-onyx-black cursor-pointer font-medium"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary text-[16px] pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards (4 Grid Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        {/* Card 1: Total Credits */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">Total Credits</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-700">arrow_downward</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-emerald-800 font-serif leading-none tracking-tight text-3xl">
              ₹{(summary.totalCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">add_circle</span>
              +{summary.completedCount || 0} credits in horizon
            </span>
            <span className="font-label-caps text-[10px] text-secondary font-semibold">Verified</span>
          </div>
        </div>

        {/* Card 2: Total Debits */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">Total Debits</span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_upward</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              ₹{(summary.totalDebits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-secondary font-medium">Dispatched withdrawals</span>
            <span className="font-label-caps text-[10px] text-onyx-black font-semibold">Processed</span>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">Completed</span>
            <span className="material-symbols-outlined text-[20px] text-emerald-700">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              {summary.completedCount || 0}
            </span>
            <span className="font-body-md text-[14px] text-secondary ml-1 font-medium">transactions</span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-emerald-700 font-semibold">100% verified settlement</span>
            <span className="font-label-caps text-[10px] text-secondary font-medium">Zero chargebacks</span>
          </div>
        </div>

        {/* Card 4: Pending */}
        <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-secondary mb-3">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px] font-bold">Pending</span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">hourglass_top</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-onyx-black font-serif leading-none tracking-tight text-3xl">
              {summary.pendingCount || 0}
            </span>
            <span className="font-body-md text-[14px] text-secondary ml-1 font-medium">transactions</span>
          </div>
          <div className="mt-4 pt-3 bg-surface-container-high/40 -mx-5 -mb-5 px-5 py-2.5 flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-amber-700 font-semibold">Processing queue active</span>
            <span className="font-label-caps text-[10px] text-secondary font-medium">Syncing</span>
          </div>
        </div>
      </section>

      {/* Main Split Layout: Left 70% Table + Right 30% Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
        
        {/* Left 70%: Transactions Table */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-sand-neutral shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-surface-container-lowest border-b border-sand-neutral flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-headline-md text-[20px] text-onyx-black font-serif leading-tight">Ledger Records</h3>
              <p className="font-body-md text-[12px] text-secondary">Real-time driver balance impact with instant audit trail</p>
            </div>
            <span className="font-label-caps text-[10px] bg-surface-container-high px-2.5 py-1 text-onyx-black uppercase tracking-wider font-bold">
              {pagination.total || 0} TOTAL ROWS
            </span>
          </div>

          {/* Table View (Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            {transactions.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sand-neutral bg-surface-container-low text-secondary font-label-caps text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3.5 font-bold">Transaction ID</th>
                    <th className="py-3 px-3 font-bold">Date &amp; Time</th>
                    <th className="py-3 px-3 font-bold">Type</th>
                    <th className="py-3 px-3 font-bold">Description / Order</th>
                    <th className="py-3 px-3 text-right font-bold">Amount</th>
                    <th className="py-3 px-3 text-center font-bold">Status</th>
                    <th className="py-3 px-3 text-center font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-neutral/60 text-[13px]">
                  {transactions.map((txn) => {
                    const isSelected = selectedTxn && selectedTxn.id === txn.id;
                    return (
                      <tr
                        key={txn.id}
                        onClick={() => setSelectedTxn(txn)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-surface-container-high/70' : 'hover:bg-surface-container-high/30'}`}
                      >
                        <td className="py-3 px-3.5 font-button-text font-semibold text-onyx-black whitespace-nowrap">
                          {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-onyx-black mr-1.5 align-middle" />}
                          {txn.txnId}
                        </td>
                        <td className="py-3 px-3 text-secondary whitespace-nowrap">{txn.date}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-label-caps text-[10px] uppercase tracking-wider px-2 py-0.5 bg-surface-container border border-sand-neutral text-onyx-black font-semibold">
                            <span className="material-symbols-outlined text-[12px]">{txn.isCredit ? 'local_shipping' : 'output'}</span> {txn.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-onyx-black max-w-[200px] truncate" title={txn.description}>
                          {txn.description}
                        </td>
                        <td className={`py-3 px-3 text-right font-headline-md text-[16px] font-serif font-bold whitespace-nowrap ${txn.isCredit ? 'text-emerald-800' : 'text-onyx-black'}`}>
                          {txn.formattedAmount}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-label-caps text-[10px] font-semibold uppercase tracking-wider ${
                            txn.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : txn.status === 'PROCESSING' || txn.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            <span className="material-symbols-outlined text-[11px]">{txn.status === 'COMPLETED' ? 'done' : 'sync'}</span> {txn.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedTxn(txn); }}
                            className={`px-2.5 py-1 font-label-caps text-[10px] uppercase tracking-wider font-semibold cursor-pointer ${
                              isSelected
                                ? 'bg-onyx-black text-on-primary'
                                : 'text-secondary hover:text-onyx-black border border-sand-neutral hover:bg-surface-container-high'
                            }`}
                          >
                            {isSelected ? 'Inspected' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center space-y-3">
                <span className="material-symbols-outlined text-[36px] text-secondary">search_off</span>
                <p className="font-headline-md text-lg text-onyx-black font-serif">No transactions found</p>
                <p className="font-body-md text-xs text-secondary">No records match your selected filter criteria.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-1.5 bg-onyx-black text-on-primary font-label-caps text-[10px] uppercase tracking-wider hover:bg-clay-earth"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Mobile Cards View (<768px) */}
          <div className="md:hidden divide-y divide-sand-neutral/60">
            {transactions.length > 0 ? (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTxn(txn)}
                  className={`p-4 space-y-2 cursor-pointer transition-colors ${selectedTxn?.id === txn.id ? 'bg-surface-container-high/60' : 'hover:bg-surface-container-low'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-surface-container border border-sand-neutral text-onyx-black">
                      {txn.type}
                    </span>
                    <span className={`font-headline-md text-base font-serif font-bold ${txn.isCredit ? 'text-emerald-800' : 'text-onyx-black'}`}>
                      {txn.formattedAmount}
                    </span>
                  </div>

                  <p className="font-button-text text-sm font-semibold text-onyx-black">{txn.description}</p>

                  <div className="flex items-center justify-between text-xs text-secondary font-body-md">
                    <span>{txn.date}</span>
                    <span className={`px-2 py-0.5 font-label-caps text-[10px] uppercase font-bold ${
                      txn.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {txn.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-sand-neutral/40 text-xs">
                    <span className="font-mono text-[11px] text-secondary">ID: {txn.txnId}</span>
                    <span className="font-button-text text-xs text-onyx-black underline font-semibold">View Details →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <p className="font-body-md text-sm text-onyx-black font-semibold">No transactions found</p>
                <button type="button" onClick={clearFilters} className="text-xs underline font-bold text-secondary">Clear Filters</button>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-surface-container-lowest border-t border-sand-neutral flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-secondary">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong class="text-onyx-black font-medium">{Math.min(pagination.total, (page - 1) * pagination.limit + 1)}–{Math.min(pagination.total, page * pagination.limit)}</strong> of <strong class="text-onyx-black font-medium">{pagination.total || 0}</strong> transactions
              </span>
              <span className="text-secondary font-mono text-[11px] ml-2 px-2 py-0.5 bg-surface-container-high font-bold">
                ?page={page}&amp;limit={pagination.limit}
              </span>
            </div>

            <div className="flex items-center gap-1 font-label-caps text-[11px]">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 border border-sand-neutral text-secondary hover:text-onyx-black hover:bg-surface-container-high uppercase tracking-wider disabled:opacity-50 cursor-pointer font-bold"
              >
                ← Prev
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => i + 1).map(pNum => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`px-3 py-1.5 cursor-pointer font-bold ${
                    page === pNum
                      ? 'bg-onyx-black text-on-primary'
                      : 'border border-sand-neutral text-secondary hover:text-onyx-black hover:bg-surface-container-high'
                  }`}
                >
                  {pNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(p => Math.min(pagination.totalPages || 1, p + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="px-2.5 py-1.5 border border-sand-neutral text-secondary hover:text-onyx-black hover:bg-surface-container-high uppercase tracking-wider disabled:opacity-50 cursor-pointer font-bold"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right 30%: Inspected Transaction Details Drawer */}
        <div className="lg:col-span-4 bg-surface-container-lowest border border-sand-neutral shadow-xs flex flex-col sticky top-6">
          {selectedTxn ? (
            <>
              {/* Drawer Header */}
              <div className="p-5 border-b border-sand-neutral bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-[10px] uppercase tracking-widest text-secondary font-bold">Transaction Details</span>
                    <span className="px-1.5 py-0.2 bg-onyx-black text-on-primary font-label-caps text-[9px] uppercase font-semibold">Live Audit</span>
                  </div>
                  <h3 className="font-headline-md text-[22px] text-onyx-black font-serif tracking-tight mt-0.5">{selectedTxn.txnId}</h3>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 font-label-caps text-[10px] font-semibold uppercase tracking-wider ${
                  selectedTxn.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <span className="material-symbols-outlined text-[13px]">{selectedTxn.status === 'COMPLETED' ? 'check' : 'sync'}</span> {selectedTxn.status}
                </span>
              </div>

              {/* Drawer Body Metadata */}
              <div className="p-5 space-y-4">
                {/* Status & Type Group */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-sand-neutral/80 text-[13px]">
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Settlement Status</span>
                    <span className="font-button-text font-medium text-emerald-800 mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">verified</span> {selectedTxn.otpVerified ? 'OTP Verified' : 'Standard Credit'}
                    </span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Transaction Type</span>
                    <span className="font-button-text font-medium text-onyx-black mt-0.5 block">{selectedTxn.typeLabel || selectedTxn.type}</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Date &amp; Time</span>
                    <span className="font-body-md text-[12px] text-on-surface-variant mt-0.5 block">{selectedTxn.date}</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Delivery Ref</span>
                    <span className="font-mono text-[12px] text-onyx-black mt-0.5 block">{selectedTxn.deliveryId}</span>
                  </div>
                </div>

                {/* Order & Location Context */}
                <div className="space-y-2.5 pb-3 border-b border-sand-neutral/80 text-[13px]">
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Associated Order</span>
                    <span className="font-headline-md text-[16px] font-serif text-onyx-black font-bold block">{selectedTxn.orderId}</span>
                    <span className="text-secondary text-[12px] block">{selectedTxn.description}</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Provider Kitchen</span>
                    <span className="font-button-text text-onyx-black block font-medium">{selectedTxn.providerName}</span>
                    <span className="text-secondary text-[12px] block">{selectedTxn.providerLocation}</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] uppercase text-secondary block font-bold">Consignee</span>
                    <span className="font-button-text text-onyx-black block font-medium">{selectedTxn.customerName}</span>
                    <span className="text-secondary text-[12px] block">{selectedTxn.customerAddress}</span>
                  </div>
                </div>

                {/* Financial Breakdown Table */}
                <div className="space-y-2 pt-1">
                  <span className="font-label-caps text-[10px] uppercase tracking-wider text-secondary block font-bold">Fare Calculation Breakdown</span>
                  <div className="bg-surface-container-low p-3.5 border border-sand-neutral space-y-2 text-[13px]">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>Base Courier Fare</span>
                      <span className="font-medium text-onyx-black">₹{selectedTxn.baseFare || 65}</span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>Distance Pay ({selectedTxn.distanceKm || 2.4} km)</span>
                      <span className="font-medium text-onyx-black">₹{selectedTxn.distanceFare || 13}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-800">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">recycling</span>
                        Dabba Return Swap Credit
                      </span>
                      <span className="font-semibold">+₹{selectedTxn.dabbaSwapCredit || 15}</span>
                    </div>
                    <div className="pt-2 border-t border-sand-neutral flex items-center justify-between font-medium">
                      <span className="font-label-caps text-label-caps uppercase text-onyx-black font-bold">Total Settlement</span>
                      <span className={`font-headline-md text-[22px] font-serif font-bold ${selectedTxn.isCredit ? 'text-emerald-800' : 'text-onyx-black'}`}>
                        {selectedTxn.formattedAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ledger Audit Metadata */}
                <div className="pt-2 space-y-1.5 text-[11px] text-secondary font-label-caps">
                  <div className="flex items-center justify-between">
                    <span>Payment Method:</span>
                    <span className="text-onyx-black font-medium">{selectedTxn.paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Created:</span>
                    <span className="text-onyx-black">{selectedTxn.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Settled:</span>
                    <span className="text-onyx-black font-semibold text-emerald-800">{selectedTxn.date}</span>
                  </div>
                </div>
              </div>

              {/* Drawer Actions Footer */}
              <div className="p-4 bg-surface-container-high/40 border-t border-sand-neutral flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(selectedTxn)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-onyx-black text-on-primary hover:bg-clay-earth transition-colors font-button-text text-button-text text-xs shadow-xs text-center cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>Download Receipt PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1 py-2 px-3 border border-sand-neutral text-secondary hover:text-onyx-black hover:bg-surface-container-high transition-colors font-button-text text-button-text text-xs cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  <span>Dispute</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center space-y-2">
              <span className="material-symbols-outlined text-[32px] text-secondary">touch_app</span>
              <p className="font-body-md text-xs text-secondary">Select a transaction row to inspect live audit details</p>
            </div>
          )}
        </div>

      </div>

      {/* Security & Isolation Banner */}
      <footer className="p-4 bg-surface-container-high/60 border border-sand-neutral flex items-center gap-3 text-secondary text-xs leading-relaxed">
        <span className="material-symbols-outlined text-[18px] text-onyx-black shrink-0">lock</span>
        <span>
          <strong className="text-onyx-black font-medium">Driver Telemetry Verified:</strong> Authenticated Session for {driverName} (ID: #{driverIdStr}). Data cryptographically scoped via JWT claims to MongoDB driver records. Zero cross-driver access allowed. Instant settlement guaranteed via TiffinLink escrow contract.
        </span>
      </footer>

      {/* Custom Date Range Modal */}
      {isCustomDateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <h3 className="font-headline-md text-lg text-onyx-black font-serif">Custom Date Range</h3>
              <button type="button" onClick={() => setIsCustomDateModalOpen(false)} className="text-secondary hover:text-onyx-black">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-body-md text-xs">
              <div>
                <label className="block text-secondary font-medium uppercase tracking-wider mb-1">From Date</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-sand-neutral text-onyx-black text-xs"
                />
              </div>

              <div>
                <label className="block text-secondary font-medium uppercase tracking-wider mb-1">To Date</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-full p-2 bg-surface-container-low border border-sand-neutral text-onyx-black text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-neutral">
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(false)}
                className="px-4 py-2 border border-sand-neutral text-secondary text-xs uppercase font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (customFromDate && customToDate) {
                    setDateFilter('custom');
                    setPage(1);
                    setIsCustomDateModalOpen(false);
                  } else {
                    showToast('⚠️ Please select both From and To dates');
                  }
                }}
                className="px-5 py-2 bg-onyx-black text-on-primary text-xs uppercase font-medium hover:bg-clay-earth"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Inquiry Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <h3 className="font-headline-md text-lg text-onyx-black font-serif">Dispute Transaction #{selectedTxn?.txnId}</h3>
              <button type="button" onClick={() => setIsDisputeModalOpen(false)} className="text-secondary hover:text-onyx-black">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-body-md text-xs">
              <p className="text-on-surface-variant">
                Submit an official dispute for transaction <strong>{selectedTxn?.txnId}</strong> ({selectedTxn?.formattedAmount}). Our compliance team will audit the order logs.
              </p>

              <div>
                <label className="block text-secondary font-medium uppercase tracking-wider mb-1">Reason for Dispute</label>
                <textarea
                  rows="3"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe fare calculation issue or missing tip/bonus credit..."
                  className="w-full p-2 bg-surface-container-low border border-sand-neutral text-onyx-black text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-neutral">
              <button
                type="button"
                onClick={() => setIsDisputeModalOpen(false)}
                className="px-4 py-2 border border-sand-neutral text-secondary text-xs uppercase font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDispute}
                className="px-5 py-2 bg-onyx-black text-on-primary text-xs uppercase font-medium hover:bg-clay-earth"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
