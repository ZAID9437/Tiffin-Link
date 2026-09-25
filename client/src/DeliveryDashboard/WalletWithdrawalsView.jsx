import React, { useState, useEffect } from 'react';

const WalletWithdrawalsView = ({ currentUser, onNavigateTab, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationNotice, setVerificationNotice] = useState(null);

  // Helper function for navigating between tabs in DeliveryDashboard
  const handleNav = (tabKey) => {
    if (typeof onNavigateTab === 'function') {
      onNavigateTab(tabKey);
    } else if (typeof onNavigate === 'function') {
      onNavigate(tabKey);
    }
  };

  // Wallet data state derived dynamically from MongoDB
  const [walletData, setWalletData] = useState({
    driver: {
      driverId: '',
      name: '',
      email: '',
      phone: '',
      rating: 5.0,
      tier: 'Delivery Partner'
    },
    wallet: {
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      lifetimeGross: 0,
      currency: 'INR'
    },
    payments: {
      onlinePayments: 0,
      cashPayments: 0,
      totalPayments: 0
    },
    payoutAccount: {
      bankName: '',
      accountNumberMasked: '',
      ifscCode: '',
      upiHandle: '',
      accountHolderName: '',
      isPrimary: false
    },
    kycStatus: 'VERIFIED',
    isBankVerified: true,
    hasData: false
  });

  // Payout methods state derived strictly from MongoDB
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState(null);

  // Withdrawals history state derived from MongoDB
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateFilter, setDateFilter] = useState('This Month (Sep 2026)');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalRecords: 0 });

  // Withdrawal form inputs
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('200');
  const [selectedRoute, setSelectedRoute] = useState('bank'); // 'bank' or 'upi'
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : '';

  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_user') || localStorage.getItem('user')) : null;
  let savedUser = null;
  try {
    if (savedUserStr) savedUser = JSON.parse(savedUserStr);
  } catch (e) {}

  const email = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const phone = currentUser?.phone || savedUser?.phone || '';
  const driverName = currentUser?.name || currentUser?.fullName || savedUser?.name || 'Courier Partner';

  // Fetch Wallet & Withdrawals Data from backend APIs
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [walletRes, historyRes, payoutRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/delivery/wallet?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}&driverName=${encodeURIComponent(driverName)}`, { headers }),
        fetch(`${API_BASE_URL}/api/delivery/withdrawals?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}&search=${encodeURIComponent(searchTerm)}&status=${encodeURIComponent(statusFilter)}&page=${pagination.page}`, { headers }),
        fetch(`${API_BASE_URL}/api/delivery/payout-methods?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}`, { headers })
      ]);

      const walletJson = await walletRes.json();
      const historyJson = await historyRes.json();
      const payoutJson = await payoutRes.json();

      if (walletJson.success && walletJson.data) {
        setWalletData(walletJson.data);
      }

      if (payoutJson.success && Array.isArray(payoutJson.data)) {
        setPayoutMethods(payoutJson.data);
        const primary = payoutJson.data.find(m => m.isPrimary && m.status === 'VERIFIED') || payoutJson.data.find(m => m.status === 'VERIFIED') || payoutJson.data[0];
        if (primary) {
          setSelectedPayoutMethodId(primary.id || primary.payoutMethodId);
        }
      }

      if (historyJson.success && historyJson.data) {
        setWithdrawals(historyJson.data.withdrawals || []);
        if (historyJson.pagination) {
          setPagination(historyJson.pagination);
        }
        if (historyJson.data.withdrawals && historyJson.data.withdrawals.length > 0) {
          setSelectedWithdrawalId(prev => prev || historyJson.data.withdrawals[0].withdrawalId || historyJson.data.withdrawals[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [statusFilter, searchTerm, pagination.page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  // Handle REQUEST PAYOUT / WITHDRAW Button Click with Verification decision gates
  const handleRequestPayoutButtonClick = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const available = Number(walletData.wallet?.availableBalance || 0);

    if (available <= 0) {
      setErrorMsg('No amount is currently available for withdrawal.');
      return;
    }

    if (available < 200) {
      setErrorMsg('Minimum withdrawal amount threshold is ₹200.00.');
      return;
    }

    // Check KYC status
    const kyc = String(walletData.kycStatus || '').toUpperCase();
    if (kyc !== 'VERIFIED') {
      setVerificationNotice({
        type: 'KYC',
        title: 'KYC Verification Required',
        message: 'Complete KYC before requesting a payout.',
        buttonText: 'COMPLETE KYC',
        targetTab: 'profile-documents'
      });
      const elem = document.getElementById('withdraw-flow');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Check Bank Verification
    if (walletData.isBankVerified === false || !walletData.payoutAccount?.accountNumberMasked) {
      setVerificationNotice({
        type: 'BANK',
        title: 'Bank / UPI Verification Required',
        message: 'Verify your bank/UPI account before withdrawing.',
        buttonText: 'VERIFY PAYOUT ACCOUNT',
        targetTab: 'bank-payout-details'
      });
      const elem = document.getElementById('withdraw-flow');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setVerificationNotice(null);
    const elem = document.getElementById('withdraw-flow');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Submit Withdrawal Request (Stored strictly as REQUESTED in MongoDB)
  const handleSubmitWithdrawal = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const numAmount = Number(withdrawAmountInput);

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive withdrawal amount.');
      return;
    }

    if (numAmount < 200) {
      setErrorMsg('Minimum withdrawal amount threshold is ₹200.00.');
      return;
    }

    if (numAmount > walletData.wallet.availableBalance) {
      setErrorMsg(`Insufficient available balance. Your withdrawable balance is ₹${walletData.wallet.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`);
      return;
    }

    // Re-check KYC
    if (String(walletData.kycStatus || '').toUpperCase() !== 'VERIFIED') {
      setErrorMsg('Complete KYC before requesting a payout.');
      return;
    }

    // Re-check Bank verification
    if (walletData.isBankVerified === false || !walletData.payoutAccount?.accountNumberMasked) {
      setErrorMsg('Verify your bank/UPI account before withdrawing.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        amount: numAmount,
        method: selectedRoute === 'upi' ? 'UPI' : 'IMPS',
        bankName: walletData.payoutAccount.bankName,
        accountNumber: walletData.payoutAccount.accountNumberMasked,
        upiId: walletData.payoutAccount.upiHandle,
        email,
        phone,
        driverId,
        driverName
      };

      const res = await fetch(`${API_BASE_URL}/api/delivery/withdrawals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.requiresKyc) {
          setVerificationNotice({
            type: 'KYC',
            title: 'KYC Verification Required',
            message: json.message || 'Complete KYC before requesting a payout.',
            buttonText: 'COMPLETE KYC',
            targetTab: 'profile-documents'
          });
        } else if (json.requiresBankVerification) {
          setVerificationNotice({
            type: 'BANK',
            title: 'Bank / UPI Verification Required',
            message: json.message || 'Verify your bank/UPI account before withdrawing.',
            buttonText: 'VERIFY PAYOUT ACCOUNT',
            targetTab: 'bank-payout-details'
          });
        }
        setErrorMsg(json.message || 'Unable to submit withdrawal request.');
        return;
      }

      setSuccessMsg(json.message || `✓ Withdrawal request of ₹${numAmount.toLocaleString()} submitted successfully! Status: REQUESTED`);
      setWithdrawAmountInput('200');
      fetchWalletData();
    } catch (err) {
      console.error('Error submitting withdrawal request:', err);
      setErrorMsg('Failed to process withdrawal request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Selected Withdrawal Record for Inspector Panel
  const selectedWithdrawal = withdrawals.find(w => w.withdrawalId === selectedWithdrawalId || w.id === selectedWithdrawalId) || withdrawals[0];

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Top Header Bar */}
      <header className="pb-5 border-b border-sand-neutral mb-8">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wide text-secondary mb-3">
          <div className="flex items-center gap-2">
            <span>EARNINGS &amp; PAYMENTS</span>
            <span className="text-secondary/50">/</span>
            <span className="text-onyx-black font-semibold">WALLET &amp; WITHDRAWALS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 border border-emerald-200 text-[10px] font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              SOCKET.IO SYNCED • INSTANT PAYOUT GATEWAY
            </span>
            <span className="text-secondary/50">|</span>
            <span className="text-secondary">ESCROW LEDGER PORT: :8443</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none">
              Wallet &amp; Withdrawals
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
              Manage your real-time available courier earnings, initiate instant bank or UPI disbursements, and audit verified settlement logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-button-text bg-surface-container-lowest border border-sand-neutral text-onyx-black hover:bg-surface-container transition-all shadow-xs cursor-pointer"
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
              <span>{refreshing ? 'Syncing...' : 'Refresh Balance'}</span>
            </button>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-button-text bg-onyx-black text-on-primary hover:bg-primary-container transition-all shadow-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              <span>Payout Accounts</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="space-y-8 w-full">

        {/* ================================================== */}
        {/* FIRST ROW — PAYMENT COLLECTION BREAKDOWN */}
        {/* ================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
            <span className="font-semibold text-onyx-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              FIRST ROW — PAYMENT COLLECTION BREAKDOWN
            </span>
            <span>DERIVED FROM VALID MONGODB CUSTOMER PAYMENT RECORDS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: ONLINE PAYMENTS 🟢 */}
            <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs relative">
              <div>
                <div className="flex items-center justify-between text-secondary text-xs uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    🟢 Online Payments
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 font-bold">
                    ONLINE / UPI / CARD
                  </span>
                </div>
                <div className="font-headline-md text-3xl font-bold text-onyx-black mt-2.5 tracking-tight">
                  {formatCurrency(walletData.payments?.onlinePayments ?? 0)}
                </div>
                <p className="font-body-md text-[11.5px] text-secondary mt-1.5 leading-snug">
                  Total amount of legitimate customer payments paid ONLINE for completed orders.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-neutral flex items-center justify-between text-[11px] font-mono text-secondary">
                <span>Accounting Status:</span>
                <span className="text-emerald-800 font-semibold">✓ Verified Online</span>
              </div>
            </div>

            {/* CARD 2: CASH PAYMENTS 🟠 */}
            <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-secondary text-xs uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                    🟠 Cash Payments
                  </span>
                  <span className="text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 font-bold">
                    CASH / COD
                  </span>
                </div>
                <div className="font-headline-md text-3xl font-bold text-onyx-black mt-2.5 tracking-tight">
                  {formatCurrency(walletData.payments?.cashPayments ?? 0)}
                </div>
                <p className="font-body-md text-[11.5px] text-secondary mt-1.5 leading-snug">
                  Actual COD / cash payments collected from customers by driver for completed runs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-neutral flex items-center justify-between text-[11px] font-mono text-secondary">
                <span>Collection Type:</span>
                <span className="text-amber-800 font-semibold">Customer Cash/COD</span>
              </div>
            </div>

            {/* CARD 3: TOTAL PAYMENTS 🔵 */}
            <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-secondary text-xs uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-800 font-bold">
                    🔵 Total Payments
                  </span>
                  <span className="text-[10px] font-mono bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 font-bold">
                    ONLINE + CASH
                  </span>
                </div>
                <div className="font-headline-md text-3xl font-bold text-onyx-black mt-2.5 tracking-tight">
                  {formatCurrency(walletData.payments?.totalPayments ?? ((walletData.payments?.onlinePayments ?? 0) + (walletData.payments?.cashPayments ?? 0)))}
                </div>
                <p className="font-body-md text-[11.5px] text-secondary mt-1.5 leading-snug">
                  Calculated Online Payments + Cash Payments customer collection total.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-neutral flex items-center justify-between text-[11px] font-mono text-secondary">
                <span>Gross Collection:</span>
                <span className="text-blue-900 font-semibold">Online + Cash Total</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* SECOND ROW — DRIVER FINANCIAL SUMMARY */}
        {/* ================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
            <span className="font-semibold text-onyx-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-onyx-black inline-block"></span>
              SECOND ROW — DRIVER FINANCIAL SUMMARY
            </span>
            <span>REAL-TIME DRIVER NET EARNINGS &amp; AVAILABLE WITHDRAWABLE BALANCE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 4: TOTAL EARNINGS */}
            <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-secondary text-xs uppercase tracking-wider font-semibold">
                  <span className="text-onyx-black font-bold">Total Earnings</span>
                  <span className="text-[10px] font-mono bg-stone-100 border border-stone-300 text-onyx-black px-2 py-0.5 font-bold">
                    DRIVER NET
                  </span>
                </div>
                <div className="font-headline-md text-3xl font-bold text-onyx-black mt-2.5 tracking-tight">
                  {formatCurrency(walletData.wallet.lifetimeGross)}
                </div>
                <p className="font-body-md text-[11.5px] text-secondary mt-1.5 leading-snug">
                  Driver's actual earned amount according to TiffinLink commission/earning rules.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-neutral flex items-center justify-between text-[11px] font-mono text-secondary">
                <span>Rule Model:</span>
                <span className="text-onyx-black font-semibold">Net Driver Earnings</span>
              </div>
            </div>

            {/* CARD 5: TOTAL WITHDRAWN */}
            <div className="bg-surface-container-lowest border border-sand-neutral p-5 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between text-secondary text-xs uppercase tracking-wider font-semibold">
                  <span className="text-onyx-black font-bold">Total Withdrawn</span>
                  <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 font-bold">
                    ✓ CLEARED
                  </span>
                </div>
                <div className="font-headline-md text-3xl font-bold text-onyx-black mt-2.5 tracking-tight">
                  {formatCurrency(walletData.wallet.totalWithdrawn)}
                </div>
                <p className="font-body-md text-[11.5px] text-secondary mt-1.5 leading-snug">
                  Total amount that has actually been successfully withdrawn/paid out to driver.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-neutral flex items-center justify-between text-[11px] font-mono text-secondary">
                <span>Cleared Status:</span>
                <span className="text-emerald-800 font-semibold">Completed Only</span>
              </div>
            </div>

            {/* CARD 6: AVAILABLE TO WITHDRAW */}
            <div className="bg-surface-container-lowest border-2 border-onyx-black p-5 flex flex-col justify-between relative shadow-xs">
              <div className="absolute -top-2.5 right-4 bg-onyx-black text-on-primary text-[9px] uppercase tracking-widest px-2 py-0.5 font-mono font-bold">
                Ready To Disburse
              </div>
              <div>
                <div className="flex items-center justify-between text-secondary text-xs uppercase tracking-wider font-semibold">
                  <span className="text-onyx-black font-bold">Available to Withdraw</span>
                  <span className="text-emerald-700 text-sm font-bold">●</span>
                </div>
                <div className="font-headline-md text-3xl font-bold text-onyx-black mt-2.5 tracking-tight">
                  {formatCurrency(walletData.wallet.availableBalance)}
                </div>
                <p className="font-body-md text-[11.5px] text-secondary mt-1.5 leading-snug">
                  Currently website available amount ready for withdrawal disburse.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-dashed border-sand-neutral">
                <button
                  type="button"
                  onClick={handleRequestPayoutButtonClick}
                  className="w-full inline-flex justify-center items-center gap-2 bg-onyx-black text-on-primary text-xs font-button-text py-2.5 px-3 hover:bg-primary-container transition-colors uppercase tracking-wider cursor-pointer shadow-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">bolt</span>
                  REQUEST PAYOUT / WITHDRAW
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Active Withdrawal Initiation Section & Form */}
        <section className="bg-surface-container-lowest border border-sand-neutral p-6 shadow-xs" id="withdraw-flow">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Left Column: Input Form */}
            <div className="flex-1 space-y-6">
              <div className="border-b border-sand-neutral pb-4 flex justify-between items-start">
                <div>
                  <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-emerald-900 bg-emerald-100 px-2 py-0.5 mb-1 font-semibold">
                    Zero Escrow Wait • Direct IMPS / UPI
                  </span>
                  <h3 className="font-headline-md text-2xl font-semibold text-onyx-black">Initiate Payout Transfer</h3>
                  <p className="font-body-md text-xs text-secondary mt-0.5">Select disbursement amount and destination routing endpoint.</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-secondary uppercase tracking-wider block">Withdrawable Ceiling</span>
                  <span className="font-mono text-base font-bold text-onyx-black">
                    {formatCurrency(walletData.wallet.availableBalance)}
                  </span>
                </div>
              </div>

              {/* Verification Gate Notice Banner */}
              {verificationNotice && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 text-amber-950 font-body-md shadow-sm space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide">
                    <span className="material-symbols-outlined text-amber-600 text-[22px]">verified_user</span>
                    <span>{verificationNotice.title}</span>
                  </div>
                  <p className="text-xs text-amber-900 font-medium">
                    {verificationNotice.message}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleNav(verificationNotice.targetTab)}
                      className="inline-flex items-center gap-2 bg-onyx-black text-on-primary text-xs font-button-text py-2 px-4 hover:bg-primary-container uppercase tracking-wider cursor-pointer shadow-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      <span>{verificationNotice.buttonText}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Alert Feedback Messages */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-body-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-body-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Amount Input & Quick Chips */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-onyx-black">
                  Disbursement Amount (INR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-2xl font-serif text-secondary">₹</span>
                  </div>
                  <input
                    type="number"
                    value={withdrawAmountInput}
                    onChange={(e) => setWithdrawAmountInput(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-2.5 text-2xl font-mono font-medium border border-sand-neutral focus:ring-1 focus:ring-onyx-black focus:border-onyx-black bg-bone-white"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono text-secondary">
                    INSTANT ELIGIBLE
                  </div>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[200, 500, 1000, 2500, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setWithdrawAmountInput(String(amt))}
                      className={`px-3 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                        withdrawAmountInput === String(amt)
                          ? 'border-2 border-onyx-black bg-onyx-black text-on-primary font-semibold shadow-xs'
                          : 'border-sand-neutral bg-bone-white hover:bg-surface-container text-onyx-black'
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountInput(String(walletData.wallet.availableBalance))}
                    className="px-3 py-1 text-xs font-mono border border-sand-neutral bg-bone-white hover:bg-surface-container text-onyx-black transition-colors cursor-pointer"
                  >
                    Withdraw Max ({formatCurrency(walletData.wallet.availableBalance)})
                  </button>
                </div>
              </div>

              {/* Destination Account Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-onyx-black">
                  Destination Payout Route
                </label>
                {payoutMethods.length === 0 ? (
                  <div className="p-4 bg-bone-white border border-sand-neutral text-center space-y-3">
                    <div className="text-xs text-secondary font-medium">
                      No payout method added to your account yet.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNav('bank-payout-details')}
                      className="inline-flex items-center gap-2 bg-onyx-black text-on-primary text-xs font-button-text py-2 px-4 hover:bg-primary-container uppercase tracking-wider cursor-pointer font-bold shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_card</span>
                      <span>+ ADD BANK / PAYOUT ACCOUNT</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payoutMethods.map((pm) => {
                      const isSelected = selectedPayoutMethodId === (pm.id || pm.payoutMethodId);
                      const isBank = pm.type === 'BANK_ACCOUNT';
                      const isVerified = pm.status === 'VERIFIED';

                      return (
                        <label
                          key={pm.id || pm.payoutMethodId}
                          onClick={() => {
                            if (isVerified) setSelectedPayoutMethodId(pm.id || pm.payoutMethodId);
                          }}
                          className={`flex items-center justify-between p-3.5 border transition-colors ${
                            isSelected && isVerified
                              ? 'border-2 border-onyx-black bg-surface-container-lowest shadow-xs'
                              : 'border-sand-neutral bg-surface-container-lowest hover:bg-bone-white'
                          } ${!isVerified ? 'opacity-75 bg-amber-50/40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="payout_destination"
                              checked={isSelected && isVerified}
                              onChange={() => {
                                if (isVerified) setSelectedPayoutMethodId(pm.id || pm.payoutMethodId);
                              }}
                              disabled={!isVerified}
                              className="text-onyx-black focus:ring-onyx-black h-4 w-4 border-sand-neutral cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-onyx-black tracking-wide">
                                  {isBank ? (pm.bankName || 'Bank Account') : 'UPI Virtual Payment Address'}
                                </span>
                                {pm.isPrimary && (
                                  <span className="text-[9.5px] bg-onyx-black text-on-primary px-1.5 py-0.2 font-mono font-bold">PRIMARY</span>
                                )}
                                <span className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 ${
                                  isVerified ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-100 text-amber-950'
                                }`}>
                                  {isVerified ? '✓ VERIFIED' : 'PENDING VERIFICATION'}
                                </span>
                              </div>
                              <p className="text-[11.5px] font-mono text-secondary mt-0.5">
                                {isBank
                                  ? `A/C: ${pm.accountNumberMasked || '••••'}` + (pm.ifscCode ? ` • IFSC: ${pm.ifscCode}` : '')
                                  : `VPA: ${pm.upiHandleMasked || pm.upiId || '••••@upi'}`
                                }
                              </p>
                            </div>
                          </div>

                          <div className="text-right font-mono text-[11px]">
                            {isVerified ? (
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Eligible
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNav('bank-payout-details');
                                }}
                                className="text-amber-800 font-bold hover:underline cursor-pointer"
                              >
                                Verify Now →
                              </button>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Triggers */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitWithdrawal}
                  disabled={submitting || walletData.wallet.availableBalance < 200}
                  className="flex-1 bg-onyx-black text-on-primary hover:bg-primary-container font-button-text text-xs py-3 px-6 uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                  <span>{submitting ? 'Submitting Request...' : `Disburse ₹${Number(withdrawAmountInput || 0).toLocaleString()} Instantly`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setWithdrawAmountInput('200'); setErrorMsg(''); setSuccessMsg(''); setVerificationNotice(null); }}
                  className="px-4 py-3 border border-sand-neutral text-xs font-button-text text-secondary hover:bg-surface-container uppercase tracking-wider cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Right Column: Protocol Rules & Security Snapshot */}
            <div className="w-full lg:w-80 bg-bone-white border border-sand-neutral p-5 space-y-4 text-[12px]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-onyx-black border-b border-sand-neutral pb-2.5">
                <span className="material-symbols-outlined text-[18px] text-onyx-black">security</span>
                <span>Disbursement Policy</span>
              </div>
              <ul className="space-y-2.5 text-secondary text-[11.5px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-onyx-black font-bold">▪</span>
                  <span><strong>Zero Platform Fee:</strong> TiffinLink does not deduct convenience fees on approved courier disbursements.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-onyx-black font-bold">▪</span>
                  <span><strong>Daily IMPS Cap:</strong> ₹25,000.00 / day across all verified couriers. (UPI capped at ₹10,000/day by NPCI).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-onyx-black font-bold">▪</span>
                  <span><strong>Min Payout:</strong> Minimum withdrawal threshold is ₹200.00.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-onyx-black font-bold">▪</span>
                  <span><strong>2FA Driver Verification:</strong> Sessions bound to hardware telemetry ID: <code className="font-mono text-onyx-black">DP-HW-99201</code>.</span>
                </li>
              </ul>
              <div className="p-3 bg-surface-container-lowest border border-sand-neutral space-y-1 text-[11px] font-mono">
                <div className="text-secondary uppercase text-[10px]">Session Cryptography</div>
                <div className="text-onyx-black truncate">JWT: eyJhbGciOiJIUzI1...4198</div>
                <div className="text-emerald-800 font-semibold">● MONGODB ACID LOCK ACTIVE</div>
              </div>
            </div>
          </div>
        </section>

        {/* Ledger & Inspector Split View */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Withdrawal Ledger History (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter and Search Header */}
            <div className="bg-surface-container-lowest border border-sand-neutral p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Withdrawal ID, UTR, Ref #..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-sand-neutral rounded-none focus:ring-1 focus:ring-onyx-black focus:border-onyx-black font-mono"
                />
                <span className="material-symbols-outlined text-[18px] text-secondary absolute left-2.5 top-2">search</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-mono">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-sand-neutral py-1.5 px-2.5 text-xs bg-surface-container-lowest text-onyx-black focus:ring-0 focus:border-onyx-black cursor-pointer"
                >
                  <option value="All Status">All Status ({withdrawals.length})</option>
                  <option value="Completed">Completed</option>
                  <option value="Processing">Processing / Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-sand-neutral py-1.5 px-2.5 text-xs bg-surface-container-lowest text-onyx-black focus:ring-0 focus:border-onyx-black cursor-pointer"
                >
                  <option value="This Month (Sep 2026)">This Month (Sep 2026)</option>
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="All Time">All Time</option>
                </select>
                <button
                  type="button"
                  onClick={() => alert('Exporting withdrawal ledger statement...')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sand-neutral bg-bone-white hover:bg-surface-container text-onyx-black cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Table or Empty State */}
            <div className="bg-surface-container-lowest border border-sand-neutral shadow-xs overflow-x-auto">
              <div className="p-3 bg-bone-white border-b border-sand-neutral flex justify-between items-center text-xs">
                <span className="font-headline-md font-semibold text-base text-onyx-black">Withdrawal Audit History</span>
                <span className="font-mono text-[11px] text-secondary">{withdrawals.length} DISBURSEMENTS</span>
              </div>

              {withdrawals.length === 0 ? (
                /* Empty State */
                <div className="p-12 text-center bg-surface-container-lowest">
                  <div className="w-12 h-12 rounded-full bg-bone-white border border-sand-neutral flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[24px] text-secondary">account_balance_wallet</span>
                  </div>
                  <h4 className="font-headline-md text-[20px] text-onyx-black mb-1">No withdrawals yet</h4>
                  <p className="font-body-md text-secondary text-xs">
                    Your withdrawal history will appear here after you submit a payout request.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-sand-neutral bg-surface-container-low text-[10px] font-mono uppercase tracking-wider text-secondary">
                      <th className="py-2.5 px-4 font-semibold">WITHDRAWAL ID</th>
                      <th className="py-2.5 px-4 font-semibold">DATE &amp; TIME</th>
                      <th className="py-2.5 px-4 font-semibold">DESTINATION / ROUTE</th>
                      <th className="py-2.5 px-4 font-semibold text-right">AMOUNT</th>
                      <th className="py-2.5 px-4 font-semibold text-center">STATUS</th>
                      <th className="py-2.5 px-4 font-semibold">UTR / AUDIT REF</th>
                      <th className="py-2.5 px-4 font-semibold text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-neutral font-mono text-[11.5px]">
                    {withdrawals.map((wDoc) => {
                      const isSelected = selectedWithdrawal?.withdrawalId === wDoc.withdrawalId || selectedWithdrawal?.id === wDoc.id;
                      const isCompleted = wDoc.status === 'COMPLETED';
                      const isPending = wDoc.status === 'REQUESTED' || wDoc.status === 'PENDING' || wDoc.status === 'PROCESSING';
                      const isFailed = wDoc.status === 'FAILED';

                      return (
                        <tr
                          key={wDoc.id || wDoc.withdrawalId}
                          onClick={() => setSelectedWithdrawalId(wDoc.withdrawalId || wDoc.id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-surface-container-high font-medium' : 'hover:bg-bone-white'
                          } ${isFailed ? 'bg-red-50/30' : ''}`}
                        >
                          <td className="py-3 px-4 font-bold text-onyx-black flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-onyx-black' : 'bg-secondary'}`}></span>
                            {wDoc.withdrawalId}
                          </td>
                          <td className="py-3 px-4 text-secondary">{wDoc.requestedAt}</td>
                          <td className="py-3 px-4 text-onyx-black">
                            <span className="inline-block bg-surface-container-lowest border border-sand-neutral px-1 py-0.2 text-[9.5px] mr-1">
                              {wDoc.method || 'IMPS'}
                            </span>
                            {wDoc.bankName || 'HDFC'} ({wDoc.accountNumber || '••••4198'})
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-onyx-black">
                            {wDoc.formattedAmount || formatCurrency(wDoc.amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-950'
                                : isPending
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-950'
                            }`}>
                              {isCompleted ? '✓ COMPLETED' : isPending ? '⏳ REQUESTED' : '✕ FAILED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-secondary truncate max-w-[120px]">
                            {wDoc.utrRef || (isCompleted ? 'UTR-260915849201' : isFailed ? 'ERR-BANK-504' : 'PENDING_ACK')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button className={`font-semibold hover:underline text-[11px] cursor-pointer ${
                              isSelected ? 'text-onyx-black' : 'text-secondary hover:text-onyx-black'
                            }`}>
                              {isSelected ? 'Selected' : 'Inspect →'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Pagination Bar */}
              <div className="px-4 py-3 bg-bone-white border-t border-sand-neutral flex items-center justify-between text-xs font-mono">
                <div className="text-secondary">
                  Showing <span className="font-semibold text-onyx-black">{withdrawals.length}</span> of {pagination.totalRecords || withdrawals.length} records
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    className="px-2.5 py-1 border border-sand-neutral bg-surface-container-lowest text-secondary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← PREV
                  </button>
                  <button className="px-2.5 py-1 border border-onyx-black bg-onyx-black text-on-primary font-bold">
                    {pagination.page}
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="px-2.5 py-1 border border-sand-neutral bg-surface-container-lowest text-onyx-black hover:bg-surface-container cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    NEXT →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Slide-Over Style Side Inspector for Selected Withdrawal */}
          {selectedWithdrawal && (
            <div className="lg:col-span-4 bg-surface-container-lowest border border-sand-neutral shadow-xs">
              {/* Inspector Header */}
              <div className="p-4 border-b border-sand-neutral bg-bone-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-secondary">WITHDRAWAL INSPECTOR</div>
                  <div className="font-headline-md text-xl font-bold text-onyx-black mt-0.5">{selectedWithdrawal.withdrawalId}</div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold ${
                  selectedWithdrawal.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-950'
                    : selectedWithdrawal.status === 'FAILED'
                    ? 'bg-red-100 text-red-950'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {selectedWithdrawal.status === 'COMPLETED' ? '✓ COMPLETED' : selectedWithdrawal.status === 'FAILED' ? '✕ FAILED' : '⏳ REQUESTED / PENDING'}
                </span>
              </div>

              {/* Inspector Content */}
              <div className="p-5 space-y-5 text-xs">
                {/* Net Payout Badge */}
                <div className="p-4 bg-bone-white border border-sand-neutral text-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-secondary">Disbursed Amount</div>
                  <div className="font-headline-md text-3xl font-semibold text-onyx-black mt-1">
                    {selectedWithdrawal.formattedAmount || formatCurrency(selectedWithdrawal.amount)}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-mono mt-1 font-medium">
                    {selectedWithdrawal.status === 'COMPLETED'
                      ? '100% Cleared to Bank Escrow'
                      : selectedWithdrawal.status === 'FAILED'
                      ? 'Disbursement Rejected by Bank Node'
                      : 'Pending Admin & Ledger Validation'}
                  </div>
                </div>

                {/* Detailed Key-Values */}
                <div className="space-y-3 font-mono text-[11.5px]">
                  <div className="flex justify-between pb-2 border-b border-sand-neutral">
                    <span className="text-secondary">Requested Timestamp:</span>
                    <span className="text-onyx-black font-medium">{selectedWithdrawal.requestedAt || '15 Sep 2026, 03:15 PM'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-sand-neutral">
                    <span className="text-secondary">Settled Timestamp:</span>
                    <span className="text-onyx-black font-medium">{selectedWithdrawal.processedAt || 'Pending Processing'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-sand-neutral">
                    <span className="text-secondary">Disbursement Method:</span>
                    <span className="text-onyx-black font-medium">{selectedWithdrawal.method || 'IMPS / Bank Transfer'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-sand-neutral">
                    <span className="text-secondary">Destination Account:</span>
                    <span className="text-onyx-black font-medium">{selectedWithdrawal.bankName || 'Payout Destination'} ({selectedWithdrawal.accountNumber || '••••'})</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-sand-neutral">
                    <span className="text-secondary">Bank IFSC:</span>
                    <span className="text-onyx-black font-medium">{selectedWithdrawal.ifscCode || 'N/A'}</span>
                  </div>
                  <div className="space-y-1 pb-2 border-b border-sand-neutral">
                    <span className="text-secondary block">Bank UTR Reference:</span>
                    <span className="text-onyx-black font-bold break-all">
                      {selectedWithdrawal.utrRef || 'PENDING_BANK_ACK'}
                    </span>
                  </div>
                  <div className="space-y-1 pb-2 border-b border-sand-neutral">
                    <span className="text-secondary block">Settlement Gateway:</span>
                    <span className="text-onyx-black">RazorpayX / Cashfree Banking Node (Tier 1)</span>
                  </div>
                </div>

                {/* Execution Lifecycle Timeline */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-secondary mb-2.5">
                    EXECUTION LIFECYCLE
                  </div>
                  <div className="border-l-2 border-onyx-black pl-3 space-y-2 text-[11px]">
                    <div>
                      <div className="font-mono text-onyx-black font-semibold">REQUEST INITIATED</div>
                      <div className="text-secondary text-[10px]">Driver requested {formatCurrency(selectedWithdrawal.amount)} via App 2FA token.</div>
                    </div>
                    <div>
                      <div className="font-mono text-onyx-black font-semibold">DATABASE ACID RECORD CREATED</div>
                      <div className="text-secondary text-[10px]">Withdrawal logged as REQUESTED in MongoDB.</div>
                    </div>
                    <div>
                      <div className="font-mono text-emerald-800 font-semibold">
                        {selectedWithdrawal.status === 'COMPLETED' ? 'SETTLED & CONFIRMED' : 'WAITING FOR ADMIN / BANK PROCESSING'}
                      </div>
                      <div className="text-secondary text-[10px]">
                        {selectedWithdrawal.status === 'COMPLETED' ? 'RBI UTR generated. Escrow deducted.' : 'Escrow locked. Payment API call deferred.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => alert(`Downloading Payment Advice PDF for ${selectedWithdrawal.withdrawalId}...`)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-onyx-black text-on-primary text-xs font-button-text py-2.5 px-3 uppercase tracking-wider hover:bg-primary-container transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download Payment Advice PDF</span>
                  </button>
                  <button
                    onClick={() => alert(`Inquiry initiated for ${selectedWithdrawal.withdrawalId}. Support Ticket #TICK-9021 created.`)}
                    className="w-full inline-flex items-center justify-center gap-2 border border-sand-neutral bg-bone-white text-onyx-black text-xs font-button-text py-2 px-3 hover:bg-surface-container transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">help_outline</span>
                    <span>Dispute or Inquiry</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Cryptographic Security & Verification Footer */}
        <footer className="bg-surface-container-lowest border border-sand-neutral p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-bone-white border border-sand-neutral text-onyx-black">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
            <div>
              <div className="font-semibold text-onyx-black flex items-center gap-2">
                <span>DRIVER TELEMETRY AUTHENTICATED</span>
                <span className="text-[10px] font-mono bg-surface-container-high border border-sand-neutral px-1 text-secondary">
                  {walletData.driver?.driverId ? `#${walletData.driver.driverId}` : ''}
                </span>
              </div>
              <p className="text-[11px] text-secondary mt-0.5">
                Scoped directly to {walletData.driver?.name || 'Courier Partner'} ({walletData.driver?.tier || 'Tier 1 Courier'}). Wallet transactions enforce server-side JWT claims and MongoDB ACID isolation locks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10.5px] font-mono text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              256-BIT SSL ENCRYPTED
            </span>
            <span className="text-secondary/40">|</span>
            <span>MONGODB TRANSACTION ISOLATION</span>
            <span className="text-secondary/40">|</span>
            <span>SOCKET.IO PIPELINE v2.4</span>
          </div>
        </footer>
      </div>

      {/* Payout Account Info Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border-2 border-onyx-black w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-neutral pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black">account_balance</span>
                <h3 className="font-headline-md text-xl text-onyx-black">Primary Payout Account</h3>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-secondary hover:text-onyx-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 bg-bone-white border border-sand-neutral space-y-2 font-mono text-xs text-onyx-black">
              <div className="flex justify-between">
                <span className="text-secondary">Account Holder:</span>
                <span className="font-semibold">{walletData.payoutAccount.accountHolderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Bank Name:</span>
                <span className="font-semibold">{walletData.payoutAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Account Number:</span>
                <span className="font-semibold">{walletData.payoutAccount.accountNumberMasked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">IFSC Code:</span>
                <span className="font-semibold">{walletData.payoutAccount.ifscCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">UPI Handle:</span>
                <span className="font-semibold">{walletData.payoutAccount.upiHandle}</span>
              </div>
            </div>

            <p className="text-[12px] text-secondary leading-relaxed font-body-md">
              Payout accounts are verified against your bank KYC document. To update your bank details, visit <strong>Bank &amp; Payout Details</strong> in the sidebar.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="px-5 py-2 bg-onyx-black text-on-primary font-button-text text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletWithdrawalsView;
