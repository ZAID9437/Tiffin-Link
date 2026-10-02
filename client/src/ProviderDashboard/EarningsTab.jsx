import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function EarningsTab({ currentUser, initialSubTab = 'earnings' }) {
  // Active Sub-Tab state ('earnings' | 'transactions' | 'incentives' | 'wallet' | 'bank-payout')
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'earnings');

  // Update when prop changes from sidebar navigation
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Global Toast & Notification
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // ==========================================
  // STATE 1: EARNINGS OVERVIEW
  // ==========================================
  const [earningsData, setEarningsData] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState(null);
  const [earningsPeriod, setEarningsPeriod] = useState('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchEarningsOverview = async () => {
    try {
      setEarningsLoading(true);
      setEarningsError(null);
      let url = `/provider/earnings/overview?period=${encodeURIComponent(earningsPeriod)}`;
      if (earningsPeriod === 'Custom Range' && customFrom && customTo) {
        url += `&startDate=${customFrom}&endDate=${customTo}`;
      }
      const res = await apiRequest(url);
      const json = typeof res?.json === 'function' ? await res.json() : res;
      if (json && json.success) {
        const raw = json.data || {};
        const chartData = (raw.chartData || []).map(c => ({
          ...c,
          amount: c.amount ?? c.revenue ?? 0,
          label: c.label ?? c.day ?? c.date ?? ''
        }));
        setEarningsData({
          ...raw,
          summary: {
            today: raw.summary?.today ?? raw.todayEarnings ?? 0,
            thisWeek: raw.summary?.thisWeek ?? raw.weekEarnings ?? 0,
            thisMonth: raw.summary?.thisMonth ?? raw.monthEarnings ?? 0,
            availableBalance: raw.summary?.availableBalance ?? raw.availableBalance ?? 0,
            grossPeriod: raw.summary?.grossPeriod ?? raw.grossPeriodEarnings ?? 0,
          },
          chartData
        });
      } else {
        setEarningsError(json?.message || 'Unable to load earnings overview from server. Please retry.');
      }
    } catch (err) {
      console.error('Error fetching earnings overview:', err);
      setEarningsError('Unable to load earnings overview from server. Please retry.');
    } finally {
      setEarningsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'earnings' || activeSubTab === 'earnings-overview') {
      fetchEarningsOverview();
    }
  }, [activeSubTab, earningsPeriod, customFrom, customTo]);

  // ==========================================
  // STATE 2: TRANSACTIONS
  // ==========================================
  const [txns, setTxns] = useState([]);
  const [txnSummary, setTxnSummary] = useState({ totalVolume: 0, count: 0, completedCount: 0, pendingCount: 0, withdrawnVolume: 0 });
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState(null);
  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [txnStatusFilter, setTxnStatusFilter] = useState('ALL');
  const [txnSort, setTxnSort] = useState('newest');
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchTransactions = async () => {
    try {
      setTxnLoading(true);
      setTxnError(null);
      const query = new URLSearchParams({
        page: txnPage,
        limit: 8,
        search: txnSearch,
        type: txnTypeFilter,
        status: txnStatusFilter,
        sort: txnSort
      }).toString();

      const res = await apiRequest(`/provider/earnings/transactions?${query}`);
      const json = typeof res?.json === 'function' ? await res.json() : res;
      if (json && json.success) {
        setTxns(json.data || []);
        if (json.summary) setTxnSummary(json.summary);
        if (json.pagination) setTxnTotalPages(json.pagination.pages || 1);
      } else {
        setTxnError(json?.message || 'Unable to load transaction records.');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTxnError('Failed to connect to transaction service.');
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeSubTab, txnPage, txnTypeFilter, txnStatusFilter, txnSort]);

  const handleTxnSearchSubmit = (e) => {
    e.preventDefault();
    setTxnPage(1);
    fetchTransactions();
  };

  // ==========================================
  // STATE 3: INCENTIVES
  // ==========================================
  const [incentivesData, setIncentivesData] = useState(null);
  const [incentivesLoading, setIncentivesLoading] = useState(false);
  const [incentivesError, setIncentivesError] = useState(null);

  const fetchIncentives = async () => {
    try {
      setIncentivesLoading(true);
      setIncentivesError(null);
      const res = await apiRequest('/provider/incentives');
      const json = typeof res?.json === 'function' ? await res.json() : res;
      if (json && json.success) {
        setIncentivesData(json.data);
      } else {
        setIncentivesError(json?.message || 'Unable to load incentives.');
      }
    } catch (err) {
      console.error('Error fetching incentives:', err);
      setIncentivesError('Failed to fetch incentive programs.');
    } finally {
      setIncentivesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'incentives' || activeSubTab === 'incentives-and-bonuses') {
      fetchIncentives();
    }
  }, [activeSubTab]);

  // ==========================================
  // STATE 4: WALLET & WITHDRAWALS
  // ==========================================
  const [walletData, setWalletData] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // Withdrawal Request Modal Form State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('bank');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawFormError, setWithdrawFormError] = useState('');

  const fetchWalletAndWithdrawals = async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const [walletRes, withdrawRes] = await Promise.all([
        apiRequest('/provider/wallet'),
        apiRequest('/provider/withdrawals')
      ]);

      const walletJson = typeof walletRes?.json === 'function' ? await walletRes.json() : walletRes;
      const withdrawJson = typeof withdrawRes?.json === 'function' ? await withdrawRes.json() : withdrawRes;

      if (walletJson && walletJson.success) {
        setWalletData(walletJson.data);
      }
      if (withdrawJson && withdrawJson.success) {
        setWithdrawals(withdrawJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching wallet/withdrawals:', err);
      setWalletError('Unable to load wallet and payout data.');
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'wallet' || activeSubTab === 'wallet-and-withdrawals') {
      fetchWalletAndWithdrawals();
    }
  }, [activeSubTab]);

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawFormError('');
    const amt = parseFloat(withdrawAmount);

    if (!amt || isNaN(amt) || amt <= 0) {
      setWithdrawFormError('Please enter a valid withdrawal amount greater than ₹0.');
      return;
    }

    if (walletData && amt > walletData.availableBalance) {
      setWithdrawFormError(`Insufficient available balance. Max available: ₹${walletData.availableBalance}`);
      return;
    }

    if (amt < 500) {
      setWithdrawFormError('Minimum withdrawal amount is ₹500.');
      return;
    }

    try {
      setWithdrawSubmitting(true);
      const res = await apiRequest('/provider/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          destinationType: withdrawDestination
        })
      });
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        showToast('✓ Withdrawal request submitted successfully! Status: PENDING validation.', 'success');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchWalletAndWithdrawals();
      } else {
        setWithdrawFormError(json?.message || 'Withdrawal request failed. Please verify payout account details.');
      }
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      setWithdrawFormError('Failed to submit withdrawal request. Check backend connection.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // ==========================================
  // STATE 5: BANK & PAYOUT DETAILS
  // ==========================================
  const [payoutDoc, setPayoutDoc] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState(null);
  const [showPayoutEditModal, setShowPayoutEditModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    upiId: ''
  });
  const [payoutFormError, setPayoutFormError] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const fetchPayoutAccount = async () => {
    try {
      setPayoutLoading(true);
      setPayoutError(null);
      const res = await apiRequest('/provider/payout-account');
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        setPayoutDoc(json.data);
        if (json.data) {
          setPayoutForm({
            accountHolderName: json.data.accountHolderName || '',
            bankName: json.data.bankName || '',
            accountNumber: '',
            confirmAccountNumber: '',
            ifscCode: json.data.ifscCode || '',
            upiId: json.data.upiId || ''
          });
        }
      } else {
        setPayoutError(json?.message || 'Unable to load payout account details.');
      }
    } catch (err) {
      console.error('Error fetching payout account:', err);
      setPayoutError('Failed to retrieve bank payout details.');
    } finally {
      setPayoutLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'bank-payout' || activeSubTab === 'bank-and-payout-details') {
      fetchPayoutAccount();
    }
  }, [activeSubTab]);

  const handleUpdatePayoutAccount = async (e) => {
    e.preventDefault();
    setPayoutFormError('');

    if (!payoutForm.accountHolderName || !payoutForm.bankName) {
      setPayoutFormError('Please fill in Account Holder Name and Bank Name.');
      return;
    }

    if (payoutForm.accountNumber || payoutForm.confirmAccountNumber) {
      if (payoutForm.accountNumber !== payoutForm.confirmAccountNumber) {
        setPayoutFormError('Bank Account Numbers do not match. Please re-check.');
        return;
      }
      if (!payoutForm.ifscCode || payoutForm.ifscCode.length < 4) {
        setPayoutFormError('Please provide a valid 11-digit IFSC code.');
        return;
      }
    }

    try {
      setPayoutSubmitting(true);
      const res = await apiRequest('/provider/payout-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutForm)
      });
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        showToast('✓ Bank & payout account updated & verified successfully!', 'success');
        setShowPayoutEditModal(false);
        fetchPayoutAccount();
      } else {
        setPayoutFormError(json?.message || 'Failed to update payout account details.');
      }
    } catch (err) {
      console.error('Error updating payout account:', err);
      setPayoutFormError('Error saving payout account details.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Helper renderer for normalized tab name
  const isTab = (key) => {
    if (key === 'earnings') return activeSubTab === 'earnings' || activeSubTab === 'earnings-overview';
    if (key === 'transactions') return activeSubTab === 'transactions';
    if (key === 'incentives') return activeSubTab === 'incentives' || activeSubTab === 'incentives-and-bonuses';
    if (key === 'wallet') return activeSubTab === 'wallet' || activeSubTab === 'wallet-and-withdrawals';
    if (key === 'bank-payout') return activeSubTab === 'bank-payout' || activeSubTab === 'bank-and-payout-details';
    return false;
  };

  return (
    <div className="flex flex-col w-full space-y-8 min-h-screen selection:bg-sand-neutral selection:text-onyx-black">

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-6 py-3.5 border shadow-2xl flex items-center gap-3 font-mono text-xs animate-slide-up ${
          toastType === 'error' 
            ? 'bg-error text-on-error border-error-container' 
            : 'bg-onyx-black text-on-primary border-sand-neutral'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toastType === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar for 5 Financial Views */}
      <div className="bg-bone-white border border-sand-neutral p-2 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('earnings')}
            className={`px-4 py-2 font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
              isTab('earnings')
                ? 'bg-onyx-black text-on-primary font-semibold'
                : 'text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            <span>Earnings Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
              isTab('transactions')
                ? 'bg-onyx-black text-on-primary font-semibold'
                : 'text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('incentives')}
            className={`px-4 py-2 font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
              isTab('incentives')
                ? 'bg-onyx-black text-on-primary font-semibold'
                : 'text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">military_tech</span>
            <span>Incentives & Bonuses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('wallet')}
            className={`px-4 py-2 font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
              isTab('wallet')
                ? 'bg-onyx-black text-on-primary font-semibold'
                : 'text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>Wallet & Withdrawals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bank-payout')}
            className={`px-4 py-2 font-button-text text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
              isTab('bank-payout')
                ? 'bg-onyx-black text-on-primary font-semibold'
                : 'text-secondary hover:text-onyx-black hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <span>Bank & Payout</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 pr-2 font-mono text-[11px] text-secondary">
          <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse"></span>
          <span>LIVE MONGO LEDGER</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PART 1 — EARNINGS OVERVIEW VIEW                                          */}
      {/* ========================================================================= */}
      {isTab('earnings') && (
        <div className="space-y-8 animate-slide-up">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Provider</span>
                <span>/</span>
                <span>Earnings & Payments</span>
                <span>/</span>
                <span className="text-onyx-black font-semibold">Earnings Overview</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                Earnings Overview
              </h1>
              <p className="font-body-md text-body-md text-clay-earth max-w-2xl">
                Real-time financial summary calculated strictly from verified MongoDB kitchen transactions.
              </p>
            </div>

            {/* Date-Range Filter Switcher */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-bone-white border border-sand-neutral p-1">
                {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Last Month', 'Custom Range'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEarningsPeriod(p)}
                    className={`px-3 py-1.5 font-label-caps text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                      earningsPeriod === p 
                        ? 'bg-onyx-black text-on-primary font-semibold' 
                        : 'text-secondary hover:text-onyx-black'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {earningsPeriod === 'Custom Range' && (
                <div className="flex items-center gap-2 bg-bone-white border border-sand-neutral p-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="bg-surface font-mono text-xs px-2 py-1 border border-sand-neutral focus:outline-none"
                  />
                  <span className="text-secondary font-mono text-xs">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className="bg-surface font-mono text-xs px-2 py-1 border border-sand-neutral focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error Banner with Retry */}
          {earningsError && (
            <div className="p-4 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm backdrop-blur-sm transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">error_outline</span>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-red-900 dark:text-red-200 uppercase tracking-wide">Sync Alert</h4>
                  <p className="font-body-md text-xs text-red-700 dark:text-red-300 font-medium mt-0.5">{earningsError}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={fetchEarningsOverview}
                  className="px-4 py-1.5 bg-onyx-black hover:bg-neutral-800 active:bg-black text-white font-button-text text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Retry Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEarningsError(null)}
                  className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  title="Dismiss alert"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Top 4 Summary Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Earnings */}
            <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44 relative group">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">Today's Earnings</span>
                <span className="material-symbols-outlined text-[20px] text-secondary">today</span>
              </div>
              <div>
                {earningsLoading ? (
                  <div className="font-headline-lg text-headline-lg text-secondary animate-pulse">₹ ----</div>
                ) : (
                  <div className="font-headline-lg text-headline-lg text-onyx-black font-normal tracking-tight">
                    ₹{(earningsData?.summary?.today || 0).toLocaleString()}
                  </div>
                )}
                <p className="font-body-md text-xs text-clay-earth mt-2">Calculated from completed today dispatches</p>
              </div>
              <div className="w-full bg-sand-neutral h-1 overflow-hidden">
                <div className="bg-onyx-black h-full w-full"></div>
              </div>
            </div>

            {/* Card 2: This Week */}
            <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44 relative group">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">This Week</span>
                <span className="material-symbols-outlined text-[20px] text-secondary">date_range</span>
              </div>
              <div>
                {earningsLoading ? (
                  <div className="font-headline-lg text-headline-lg text-secondary animate-pulse">₹ ----</div>
                ) : (
                  <div className="font-headline-lg text-headline-lg text-onyx-black font-normal tracking-tight">
                    ₹{(earningsData?.summary?.thisWeek || 0).toLocaleString()}
                  </div>
                )}
                <p className="font-body-md text-xs text-clay-earth mt-2">Rolling 7-day revenue total</p>
              </div>
              <div className="w-full bg-sand-neutral h-1 overflow-hidden">
                <div className="bg-onyx-black h-full w-[70%]"></div>
              </div>
            </div>

            {/* Card 3: This Month */}
            <div className="bg-bone-white p-6 border border-sand-neutral flex flex-col justify-between h-44 relative group">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">This Month</span>
                <span className="material-symbols-outlined text-[20px] text-secondary">calendar_month</span>
              </div>
              <div>
                {earningsLoading ? (
                  <div className="font-headline-lg text-headline-lg text-secondary animate-pulse">₹ ----</div>
                ) : (
                  <div className="font-headline-lg text-headline-lg text-onyx-black font-normal tracking-tight">
                    ₹{(earningsData?.summary?.thisMonth || 0).toLocaleString()}
                  </div>
                )}
                <p className="font-body-md text-xs text-clay-earth mt-2">Current calendar month aggregate</p>
              </div>
              <div className="w-full bg-sand-neutral h-1 overflow-hidden">
                <div className="bg-onyx-black h-full w-[85%]"></div>
              </div>
            </div>

            {/* Card 4: Available Balance */}
            <div className="bg-onyx-black text-on-primary p-6 flex flex-col justify-between h-44 relative">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-sand-neutral">Available Balance</span>
                <span className="material-symbols-outlined text-[20px] text-sand-neutral">account_balance_wallet</span>
              </div>
              <div>
                {earningsLoading ? (
                  <div className="font-headline-lg text-headline-lg text-sand-neutral animate-pulse">₹ ----</div>
                ) : (
                  <div className="font-headline-lg text-headline-lg text-bone-white font-normal tracking-tight">
                    ₹{(earningsData?.summary?.availableBalance || 0).toLocaleString()}
                  </div>
                )}
                <p className="font-body-md text-xs text-sand-neutral/80 mt-2">Available for immediate withdrawal</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-sand-neutral/30">
                <span className="font-mono text-[10px] text-sand-neutral uppercase">Escrow Cleared</span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('wallet')}
                  className="px-3 py-1 bg-bone-white text-onyx-black font-button-text text-[11px] uppercase"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Earnings Chart & Breakdown Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Chart Section (8 cols) */}
            <div className="lg:col-span-8 bg-bone-white p-8 border border-sand-neutral space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand-neutral">
                <div>
                  <h3 className="font-headline-md text-headline-md text-onyx-black">Earnings Trend</h3>
                  <p className="font-body-md text-xs text-secondary mt-1">Aggregated daily revenue from real MongoDB order settlements.</p>
                </div>
                <span className="font-mono text-xs px-2 py-1 bg-surface border border-sand-neutral text-clay-earth uppercase">
                  {earningsPeriod}
                </span>
              </div>

              {/* SVG Dynamic Line Chart */}
              {earningsLoading ? (
                <div className="h-64 flex items-center justify-center bg-surface border border-sand-neutral font-mono text-xs text-secondary">
                  Loading real-time financial chart...
                </div>
              ) : !earningsData?.chartData || earningsData.chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-surface border border-sand-neutral p-6 text-center space-y-2">
                  <span className="material-symbols-outlined text-secondary text-4xl">query_stats</span>
                  <p className="font-headline-md text-base text-onyx-black">No earnings data available for this period.</p>
                  <p className="font-body-md text-xs text-secondary">Completed order revenues will render automatically when orders are delivered.</p>
                </div>
              ) : (
                <div className="relative h-64 bg-surface p-4 border border-sand-neutral">
                  <div className="h-48 flex items-end justify-between gap-2 border-b border-sand-neutral pb-2">
                    {earningsData.chartData.map((item, idx) => {
                      const maxAmount = Math.max(...earningsData.chartData.map(d => d.amount), 1);
                      const heightPct = Math.max(10, Math.round((item.amount / maxAmount) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                          <span className="font-mono text-[10px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            ₹{item.amount}
                          </span>
                          <div
                            className="w-full bg-onyx-black group-hover:bg-clay-earth transition-all rounded-t-xs"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="font-mono text-[10px] text-secondary mt-2 truncate w-full text-center">
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center pt-2 font-mono text-[10px] text-secondary">
                    <span>PERIOD START</span>
                    <span>PERIOD END</span>
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown Box (4 cols) */}
            <div className="lg:col-span-4 bg-bone-white p-8 border border-sand-neutral space-y-6">
              <div className="pb-3 border-b border-sand-neutral">
                <h3 className="font-headline-md text-headline-md text-onyx-black">Net Earnings Breakdown</h3>
                <p className="font-body-md text-xs text-secondary mt-1">Itemized accounting for selected period.</p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-sand-neutral/60">
                  <span className="text-secondary font-label-caps uppercase text-[10px]">Order/Service Earnings</span>
                  <span className="text-onyx-black font-semibold">₹{(earningsData?.breakdown?.orderEarnings || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-sand-neutral/60">
                  <span className="text-secondary font-label-caps uppercase text-[10px]">Delivery Logistics Earnings</span>
                  <span className="text-onyx-black font-semibold">₹{(earningsData?.breakdown?.deliveryEarnings || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-sand-neutral/60">
                  <span className="text-secondary font-label-caps uppercase text-[10px]">Bonuses</span>
                  <span className="text-onyx-black font-semibold">+₹{(earningsData?.breakdown?.bonuses || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-sand-neutral/60">
                  <span className="text-secondary font-label-caps uppercase text-[10px]">Incentives</span>
                  <span className="text-onyx-black font-semibold">+₹{(earningsData?.breakdown?.incentives || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-sand-neutral/60 text-error">
                  <span className="font-label-caps uppercase text-[10px]">Platform Fees & Commission</span>
                  <span className="font-semibold">-₹{(earningsData?.breakdown?.platformFees || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-sand-neutral/60 text-error">
                  <span className="font-label-caps uppercase text-[10px]">Refunds & Adjustments</span>
                  <span className="font-semibold">-₹{(earningsData?.breakdown?.refunds || 0).toLocaleString()}</span>
                </div>

                <div className="p-4 bg-surface border border-sand-neutral mt-4 flex items-center justify-between">
                  <span className="font-label-caps text-xs uppercase text-onyx-black font-semibold">Net Payout Earnings</span>
                  <span className="font-headline-md text-xl text-onyx-black font-semibold">
                    ₹{(earningsData?.breakdown?.netEarnings || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 2 — TRANSACTIONS VIEW                                               */}
      {/* ========================================================================= */}
      {isTab('transactions') && (
        <div className="space-y-8 animate-slide-up">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Provider</span>
                <span>/</span>
                <span>Earnings & Payments</span>
                <span>/</span>
                <span className="text-onyx-black font-semibold">Transactions</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                Transactions
              </h1>
              <p className="font-body-md text-body-md text-clay-earth max-w-2xl">
                Audited posting history of all order credits, bonuses, withdrawals, and platform fee splits.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchTransactions}
              className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start lg:self-end"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Sync Ledger</span>
            </button>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Total Earnings Volume</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(txnSummary.totalVolume || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Across {txnSummary.count || 0} posted entries</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Completed Postings</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                {txnSummary.completedCount || 0}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Fully settled & cleared</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Pending Escrow</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                {txnSummary.pendingCount || 0}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">In transit verification</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Withdrawn Volume</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(txnSummary.withdrawnVolume || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Disbursed to bank / UPI</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-bone-white border border-sand-neutral space-y-4">
            <form onSubmit={handleTxnSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
                <input
                  type="text"
                  value={txnSearch}
                  onChange={e => setTxnSearch(e.target.value)}
                  placeholder="Search Txn ID (#TXN-xxxx), Order ID (#ORD-xxxx), or reference..."
                  className="w-full pl-9 pr-4 py-2 bg-surface text-onyx-black placeholder:text-outline text-xs border border-sand-neutral focus:outline-none focus:border-onyx-black font-mono"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-surface border border-sand-neutral px-3 py-1.5">
                  <label className="font-label-caps text-[10px] uppercase text-secondary mr-2">Type:</label>
                  <select
                    value={txnTypeFilter}
                    onChange={e => { setTxnTypeFilter(e.target.value); setTxnPage(1); }}
                    className="bg-transparent text-onyx-black font-button-text text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Types</option>
                    <option value="ORDER_EARNING">Order Earning</option>
                    <option value="DELIVERY_EARNING">Delivery Earning</option>
                    <option value="BONUS">Bonus</option>
                    <option value="INCENTIVE">Incentive</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="REFUND">Refund</option>
                  </select>
                </div>

                <div className="flex items-center bg-surface border border-sand-neutral px-3 py-1.5">
                  <label className="font-label-caps text-[10px] uppercase text-secondary mr-2">Status:</label>
                  <select
                    value={txnStatusFilter}
                    onChange={e => { setTxnStatusFilter(e.target.value); setTxnPage(1); }}
                    className="bg-transparent text-onyx-black font-button-text text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REVERSED">Reversed</option>
                  </select>
                </div>

                <div className="flex items-center bg-surface border border-sand-neutral px-3 py-1.5">
                  <label className="font-label-caps text-[10px] uppercase text-secondary mr-2">Sort:</label>
                  <select
                    value={txnSort}
                    onChange={e => { setTxnSort(e.target.value); setTxnPage(1); }}
                    className="bg-transparent text-onyx-black font-button-text text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Amount (High to Low)</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Transactions Table & Inspector Drawer Container */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-8 bg-bone-white border border-sand-neutral overflow-hidden">
              <div className="px-6 py-4 border-b border-sand-neutral flex items-center justify-between bg-surface-container-low">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-onyx-black">
                  AUDITED TRANSACTION JOURNAL
                </span>
                <span className="font-mono text-[11px] text-secondary">
                  SERVER PAGINATED
                </span>
              </div>

              {txnLoading ? (
                <div className="p-12 text-center font-mono text-xs text-secondary">
                  Fetching verified transaction records from MongoDB...
                </div>
              ) : txns.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <span className="material-symbols-outlined text-secondary text-4xl">receipt_long</span>
                  <p className="font-headline-md text-base text-onyx-black">No transactions found.</p>
                  <p className="font-body-md text-xs text-secondary">No financial records match your current filter selection.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-sand-neutral bg-surface-container-high/40 text-[11px] font-label-caps uppercase text-secondary tracking-widest">
                        <th className="py-3.5 px-4 font-semibold">Txn ID</th>
                        <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                        <th className="py-3.5 px-4 font-semibold">Type</th>
                        <th className="py-3.5 px-4 font-semibold">Order</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                        <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-neutral text-xs font-body-md text-on-surface">
                      {txns.map(t => (
                        <tr key={t.txnId} className="hover:bg-surface/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-onyx-black">
                            {t.txnId}
                          </td>
                          <td className="py-3.5 px-4 text-clay-earth font-mono text-[11px]">
                            {t.createdAtFormatted}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface-container-high text-onyx-black font-mono text-[10px] border border-sand-neutral">
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-clay-earth">
                            {t.orderId || '—'}
                          </td>
                          <td className={`py-3.5 px-4 font-mono font-medium text-right ${
                            t.isDebit ? 'text-error' : 'text-onyx-black'
                          }`}>
                            {t.amountFormatted}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold ${
                              t.status === 'COMPLETED' ? 'text-onyx-black' : t.status === 'PENDING' ? 'text-clay-earth' : 'text-error'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedTxn(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-onyx-black text-on-primary text-[11px] font-button-text uppercase hover:bg-clay-earth cursor-pointer"
                            >
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="px-6 py-4 bg-surface-container-low border-t border-sand-neutral flex items-center justify-between">
                <span className="font-mono text-[11px] text-secondary">
                  Page <span className="text-onyx-black font-semibold">{txnPage}</span> of <span className="text-onyx-black font-semibold">{txnTotalPages}</span>
                </span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <button
                    type="button"
                    disabled={txnPage <= 1}
                    onClick={() => setTxnPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 border border-sand-neutral bg-surface disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    disabled={txnPage >= txnTotalPages}
                    onClick={() => setTxnPage(p => Math.min(txnTotalPages, p + 1))}
                    className="px-3 py-1 border border-sand-neutral bg-surface disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Inspector Side Drawer */}
            {selectedTxn ? (
              <div className="xl:col-span-4 bg-bone-white border border-onyx-black p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-sand-neutral pb-3">
                  <div>
                    <span className="font-label-caps text-[10px] uppercase tracking-widest text-secondary block">INSPECTOR</span>
                    <h3 className="font-headline-md text-lg text-onyx-black">{selectedTxn.txnId}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedTxn(null)} className="p-1 text-secondary hover:text-onyx-black">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Reference ID:</span>
                    <span className="text-onyx-black font-semibold">{selectedTxn.referenceId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Posting Type:</span>
                    <span className="text-onyx-black">{selectedTxn.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Linked Order:</span>
                    <span className="text-onyx-black">{selectedTxn.orderId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Amount:</span>
                    <span className="text-onyx-black font-bold">{selectedTxn.amountFormatted}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Status:</span>
                    <span className="text-onyx-black font-semibold">{selectedTxn.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Payment Method:</span>
                    <span className="text-onyx-black">{selectedTxn.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-sand-neutral/50">
                    <span className="text-secondary">Date & Time:</span>
                    <span className="text-onyx-black">{selectedTxn.createdAtFormatted}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-secondary block mb-1">Description:</span>
                    <p className="text-onyx-black font-body-md text-xs bg-surface p-2 border border-sand-neutral">
                      {selectedTxn.description || 'No additional posting details.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="w-full py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase"
                >
                  Close Inspector
                </button>
              </div>
            ) : (
              <div className="xl:col-span-4 bg-bone-white border border-sand-neutral p-6 text-center space-y-2">
                <span className="material-symbols-outlined text-secondary text-3xl">info</span>
                <p className="font-headline-md text-sm text-onyx-black">Transaction Inspector</p>
                <p className="font-body-md text-xs text-secondary">Click "Inspect" on any table row to review full audit log metadata.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3 — INCENTIVES & BONUSES VIEW                                       */}
      {/* ========================================================================= */}
      {isTab('incentives') && (
        <div className="space-y-8 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Provider</span>
                <span>/</span>
                <span>Earnings & Payments</span>
                <span>/</span>
                <span className="text-onyx-black font-semibold">Incentives & Bonuses</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                Incentives & Bonuses
              </h1>
              <p className="font-body-md text-body-md text-clay-earth max-w-2xl">
                Kitchen throughput rewards and milestone bonuses dynamically queried from MongoDB.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchIncentives}
              className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start lg:self-end"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Refresh Incentives</span>
            </button>
          </div>

          {/* Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Active Incentives</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                {incentivesData?.summary?.activeCount || 0}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Active reward programs</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Earned This Month</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(incentivesData?.summary?.earnedThisMonth || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Credited to wallet balance</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Pending Rewards</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(incentivesData?.summary?.pendingRewards || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Threshold nearing completion</span>
            </div>

            <div className="p-6 bg-onyx-black text-on-primary border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-sand-neutral block">Total Lifetime Bonuses</span>
              <div className="font-headline-lg text-3xl text-bone-white font-normal mt-2">
                ₹{(incentivesData?.summary?.totalBonuses || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-sand-neutral/80 mt-1 block">Verified kitchen milestone rewards</span>
            </div>
          </div>

          {/* Incentive Program Cards */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-onyx-black">Eligible Kitchen Incentives</h3>

            {incentivesLoading ? (
              <div className="p-12 bg-bone-white border border-sand-neutral text-center font-mono text-xs text-secondary">
                Loading incentive metrics...
              </div>
            ) : !incentivesData?.programs || incentivesData.programs.length === 0 ? (
              <div className="p-12 bg-bone-white border border-sand-neutral text-center space-y-2">
                <span className="material-symbols-outlined text-secondary text-4xl">military_tech</span>
                <p className="font-headline-md text-base text-onyx-black">No active incentives available.</p>
                <p className="font-body-md text-xs text-secondary">Check back soon for new milestone bonus programs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {incentivesData.programs.map((inc) => (
                  <div key={inc.id} className="bg-bone-white p-6 border border-sand-neutral space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-caps text-[10px] uppercase text-secondary tracking-widest">{inc.status}</span>
                        <h4 className="font-headline-md text-xl text-onyx-black">{inc.name}</h4>
                        <p className="font-body-md text-xs text-secondary mt-1">{inc.description}</p>
                      </div>
                      <span className="font-mono text-base font-bold text-onyx-black">₹{inc.rewardAmount}</span>
                    </div>

                    <div className="space-y-2 bg-surface p-4 border border-sand-neutral">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-secondary">Progress: {inc.currentProgress} / {inc.target} orders</span>
                        <span className="text-onyx-black font-bold">{inc.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-sand-neutral h-2 overflow-hidden">
                        <div className="bg-onyx-black h-full" style={{ width: `${inc.progressPercent}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 4 — WALLET & WITHDRAWALS VIEW                                      */}
      {/* ========================================================================= */}
      {isTab('wallet') && (
        <div className="space-y-8 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Provider</span>
                <span>/</span>
                <span>Earnings & Payments</span>
                <span>/</span>
                <span className="text-onyx-black font-semibold">Wallet & Withdrawals</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                Wallet & Withdrawals
              </h1>
              <p className="font-body-md text-body-md text-clay-earth max-w-2xl">
                Manage your available balance and request payouts to verified bank accounts or UPI VPAs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="px-6 py-3 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm hover:bg-clay-earth transition-colors self-start lg:self-end"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Withdraw / Request Payout</span>
            </button>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Available Balance</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(walletData?.availableBalance || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Ready to withdraw now</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Pending Balance</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(walletData?.pendingBalance || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Pending order clearance</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Total Lifetime Earned</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(walletData?.totalEarned || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Cumulative gross earnings</span>
            </div>

            <div className="p-6 bg-bone-white border border-sand-neutral">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary block">Total Withdrawn</span>
              <div className="font-headline-lg text-3xl text-onyx-black font-normal mt-2">
                ₹{(walletData?.totalWithdrawn || 0).toLocaleString()}
              </div>
              <span className="font-mono text-[11px] text-secondary mt-1 block">Disbursed to bank</span>
            </div>
          </div>

          {/* Hero Balance Box */}
          <div className="bg-bone-white border border-sand-neutral p-8 text-center space-y-4">
            <span className="font-label-caps text-xs uppercase tracking-widest text-secondary">WALLET ESCROW BALANCE</span>
            <div className="font-headline-lg text-5xl text-onyx-black font-normal">
              ₹{(walletData?.availableBalance || 0).toLocaleString()}
            </div>
            <p className="font-body-md text-xs text-secondary max-w-md mx-auto">
              Withdrawal requests undergo backend validation, KYC checks, and bank verification before processing.
            </p>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="px-8 py-3 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-widest hover:bg-clay-earth transition-colors"
            >
              Request Payout
            </button>
          </div>

          {/* Withdrawals History Table */}
          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-onyx-black">Withdrawal & Payout History</h3>

            {walletLoading ? (
              <div className="p-12 bg-bone-white border border-sand-neutral text-center font-mono text-xs text-secondary">
                Loading withdrawal history...
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="p-12 bg-bone-white border border-sand-neutral text-center space-y-2">
                <span className="material-symbols-outlined text-secondary text-4xl">history</span>
                <p className="font-headline-md text-base text-onyx-black">No withdrawal requests yet.</p>
                <p className="font-body-md text-xs text-secondary">Submit your first payout request using the button above.</p>
              </div>
            ) : (
              <div className="bg-bone-white border border-sand-neutral overflow-x-auto">
                <table className="w-full text-left border-collapse font-body-md text-xs">
                  <thead>
                    <tr className="border-b border-sand-neutral bg-surface-container-high/40 text-[11px] font-label-caps uppercase text-secondary tracking-widest">
                      <th className="py-3.5 px-4 font-semibold">Withdrawal ID</th>
                      <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                      <th className="py-3.5 px-4 font-semibold">Destination</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Reference ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-neutral">
                    {withdrawals.map(w => (
                      <tr key={w.withdrawalId} className="hover:bg-surface/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-onyx-black">{w.withdrawalId}</td>
                        <td className="py-3.5 px-4 font-mono text-clay-earth">{w.createdAtFormatted}</td>
                        <td className="py-3.5 px-4 font-mono text-right font-bold text-onyx-black">₹{w.amount}</td>
                        <td className="py-3.5 px-4 font-mono text-clay-earth">{w.destination}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border ${
                            w.status === 'COMPLETED' ? 'bg-surface text-onyx-black border-sand-neutral' :
                            w.status === 'PENDING' || w.status === 'REQUESTED' ? 'bg-surface-container text-clay-earth border-sand-neutral' :
                            'bg-error-container text-on-error-container border-error'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-right text-secondary">{w.referenceId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Withdrawal Request Modal */}
          {showWithdrawModal && (
            <div className="fixed inset-0 z-[999] bg-onyx-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-surface border border-sand-neutral p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-sand-neutral pb-3">
                  <h3 className="font-headline-md text-xl text-onyx-black">Request Payout / Withdrawal</h3>
                  <button type="button" onClick={() => setShowWithdrawModal(false)} className="text-secondary hover:text-onyx-black">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {withdrawFormError && (
                  <div className="p-3 bg-error-container text-on-error-container text-xs font-body-md border border-error">
                    {withdrawFormError}
                  </div>
                )}

                <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Available Balance</label>
                    <div className="font-mono text-lg font-bold text-onyx-black">
                      ₹{(walletData?.availableBalance || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Amount to Withdraw (Min ₹500)</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount (e.g. 1000)"
                      className="w-full p-2.5 bg-bone-white border border-sand-neutral font-mono text-sm focus:outline-none focus:border-onyx-black"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount('500')}
                        className="px-2 py-1 bg-surface-container font-mono text-[10px]"
                      >
                        ₹500
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount('1000')}
                        className="px-2 py-1 bg-surface-container font-mono text-[10px]"
                      >
                        ₹1,000
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(walletData?.availableBalance || 0))}
                        className="px-2 py-1 bg-onyx-black text-on-primary font-mono text-[10px]"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Payout Destination</label>
                    <select
                      value={withdrawDestination}
                      onChange={e => setWithdrawDestination(e.target.value)}
                      className="w-full p-2.5 bg-bone-white border border-sand-neutral font-button-text text-xs focus:outline-none"
                    >
                      <option value="bank">Bank Account ({payoutDoc?.accountNumberMasked || 'Not set'})</option>
                      <option value="upi">UPI VPA ({payoutDoc?.upiIdMasked || 'Not set'})</option>
                    </select>
                  </div>

                  <div className="p-3 bg-bone-white border border-sand-neutral text-[11px] font-mono text-secondary space-y-1">
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="text-onyx-black">₹0.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-onyx-black pt-1 border-t border-sand-neutral">
                      <span>Status on submission:</span>
                      <span>REQUESTED / PENDING</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-2.5 border border-sand-neutral text-secondary font-button-text text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={withdrawSubmitting}
                      className="flex-1 py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase disabled:opacity-50"
                    >
                      {withdrawSubmitting ? 'Submitting...' : 'Confirm Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 5 — BANK & PAYOUT DETAILS VIEW                                     */}
      {/* ========================================================================= */}
      {isTab('bank-payout') && (
        <div className="space-y-8 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Provider</span>
                <span>/</span>
                <span>Earnings & Payments</span>
                <span>/</span>
                <span className="text-onyx-black font-semibold">Bank & Payout Details</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
                Bank & Payout Details
              </h1>
              <p className="font-body-md text-body-md text-clay-earth max-w-2xl">
                Secure bank account & UPI payment routing with masked account numbers for provider data protection.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPayoutEditModal(true)}
              className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start lg:self-end"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit / Update Payout Account</span>
            </button>
          </div>

          {payoutLoading ? (
            <div className="p-12 bg-bone-white border border-sand-neutral text-center font-mono text-xs text-secondary">
              Loading bank & payout account verification data...
            </div>
          ) : payoutError ? (
            <div className="p-4 bg-error-container text-on-error-container border border-error flex items-center justify-between">
              <span>{payoutError}</span>
              <button type="button" onClick={fetchPayoutAccount} className="px-3 py-1 bg-onyx-black text-on-primary text-xs uppercase">
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Bank Account Card */}
              <div className="bg-bone-white p-8 border border-sand-neutral space-y-6">
                <div className="flex items-center justify-between border-b border-sand-neutral pb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-onyx-black">account_balance</span>
                    <div>
                      <h3 className="font-headline-md text-xl text-onyx-black">Bank Account Details</h3>
                      <span className="font-mono text-[10px] text-secondary">NEFT / IMPS DIRECT DISBURSEMENT</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 font-mono text-[10px] uppercase border ${
                    payoutDoc?.status === 'VERIFIED' ? 'bg-surface text-onyx-black border-sand-neutral' : 'bg-surface-container text-clay-earth border-sand-neutral'
                  }`}>
                    {payoutDoc?.status || 'NOT_CONFIGURED'}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-sand-neutral/50">
                    <span className="text-secondary font-label-caps text-[10px] uppercase">Account Holder</span>
                    <span className="text-onyx-black font-semibold">{payoutDoc?.accountHolderName || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sand-neutral/50">
                    <span className="text-secondary font-label-caps text-[10px] uppercase">Bank Name</span>
                    <span className="text-onyx-black font-semibold">{payoutDoc?.bankName || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sand-neutral/50">
                    <span className="text-secondary font-label-caps text-[10px] uppercase">Account Number</span>
                    <span className="text-onyx-black font-mono font-bold">{payoutDoc?.accountNumberMasked || '••••••••'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sand-neutral/50">
                    <span className="text-secondary font-label-caps text-[10px] uppercase">IFSC Code</span>
                    <span className="text-onyx-black font-mono font-bold">{payoutDoc?.ifscCode || 'Not set'}</span>
                  </div>
                </div>

                <div className="p-3 bg-surface border border-sand-neutral text-[11px] font-mono text-secondary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-onyx-black">lock</span>
                  <span>Account numbers are masked for financial privacy. Sensitive payment details are never stored unencrypted.</span>
                </div>
              </div>

              {/* UPI Card */}
              <div className="bg-bone-white p-8 border border-sand-neutral space-y-6">
                <div className="flex items-center justify-between border-b border-sand-neutral pb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-onyx-black">qr_code_2</span>
                    <div>
                      <h3 className="font-headline-md text-xl text-onyx-black">UPI / VPA Route</h3>
                      <span className="font-mono text-[10px] text-secondary">INSTANT UPI TRANSFER</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 font-mono text-[10px] uppercase border ${
                    payoutDoc?.status === 'VERIFIED' ? 'bg-surface text-onyx-black border-sand-neutral' : 'bg-surface-container text-clay-earth border-sand-neutral'
                  }`}>
                    {payoutDoc?.status || 'NOT_CONFIGURED'}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-sand-neutral/50">
                    <span className="text-secondary font-label-caps text-[10px] uppercase">UPI VPA Handle</span>
                    <span className="text-onyx-black font-semibold">{payoutDoc?.upiIdMasked || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-sand-neutral/50">
                    <span className="text-secondary font-label-caps text-[10px] uppercase">Verification Method</span>
                    <span className="text-onyx-black font-semibold">Automated Format & Ownership Validation</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPayoutEditModal(true)}
                  className="w-full py-2.5 bg-onyx-black text-on-primary font-button-text text-xs uppercase"
                >
                  Update UPI / Bank Information
                </button>
              </div>
            </div>
          )}

          {/* Edit Payout Account Modal */}
          {showPayoutEditModal && (
            <div className="fixed inset-0 z-[999] bg-onyx-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-surface border border-sand-neutral p-6 max-w-lg w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-sand-neutral pb-3">
                  <h3 className="font-headline-md text-xl text-onyx-black">Update Bank & Payout Details</h3>
                  <button type="button" onClick={() => setShowPayoutEditModal(false)} className="text-secondary hover:text-onyx-black">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {payoutFormError && (
                  <div className="p-3 bg-error-container text-on-error-container text-xs font-body-md border border-error">
                    {payoutFormError}
                  </div>
                )}

                <form onSubmit={handleUpdatePayoutAccount} className="space-y-4">
                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={payoutForm.accountHolderName}
                      onChange={e => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })}
                      placeholder="e.g. Zaid Mansuri"
                      className="w-full p-2 bg-bone-white border border-sand-neutral text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={payoutForm.bankName}
                      onChange={e => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                      placeholder="e.g. ICICI Bank"
                      className="w-full p-2 bg-bone-white border border-sand-neutral text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Account Number</label>
                      <input
                        type="password"
                        value={payoutForm.accountNumber}
                        onChange={e => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                        placeholder="Enter account number"
                        className="w-full p-2 bg-bone-white border border-sand-neutral text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-xs uppercase text-secondary block mb-1">Confirm Account Number</label>
                      <input
                        type="text"
                        value={payoutForm.confirmAccountNumber}
                        onChange={e => setPayoutForm({ ...payoutForm, confirmAccountNumber: e.target.value })}
                        placeholder="Re-enter account number"
                        className="w-full p-2 bg-bone-white border border-sand-neutral text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={payoutForm.ifscCode}
                      onChange={e => setPayoutForm({ ...payoutForm, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. ICIC0000102"
                      className="w-full p-2 bg-bone-white border border-sand-neutral text-xs font-mono uppercase focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-label-caps text-xs uppercase text-secondary block mb-1">UPI ID / VPA</label>
                    <input
                      type="text"
                      value={payoutForm.upiId}
                      onChange={e => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                      placeholder="e.g. name@upi"
                      className="w-full p-2 bg-bone-white border border-sand-neutral text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPayoutEditModal(false)}
                      className="flex-1 py-2 border border-sand-neutral text-secondary font-button-text text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={payoutSubmitting}
                      className="flex-1 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase disabled:opacity-50"
                    >
                      {payoutSubmitting ? 'Saving...' : 'Save & Verify Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
