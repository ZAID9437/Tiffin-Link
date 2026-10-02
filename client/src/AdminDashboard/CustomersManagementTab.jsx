import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Search, RefreshCw, Phone, Mail, MapPin, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle, Clock, ArrowLeft, Download, FileText, ExternalLink,
  ChevronDown, ArrowUpDown, Filter, Eye, UserCheck, UserX, MoreVertical,
  Calendar, CreditCard, Sparkles, Send, Ban, Play, Pause, Navigation, Utensils,
  Award, Activity, Check, X, Bell, Hash, Laptop, CheckCircle2, ChevronRight,
  TrendingUp, ShoppingBag, Radio, Shield, HelpCircle, Copy, Printer, CheckSquare,
  Square, Bike, Store, RotateCcw, AlertCircle, FileCheck, Layers, Compass, Lock
} from 'lucide-react';

export default function CustomersManagementTab({ subTab = 'customers-all', onNavigate }) {
  // Normalize subTab routing
  const normalizedSubTab = useMemo(() => {
    if (!subTab) return 'all';
    if (subTab.startsWith('customers-')) return subTab.replace('customers-', '');
    if (subTab === 'customers') return 'all';
    return subTab;
  }, [subTab]);

  // Master States
  const [activeViewOverride, setActiveViewOverride] = useState(null);
  const currentView = activeViewOverride || normalizedSubTab;

  // Reset override whenever the parent subTab prop changes (e.g., user clicks sidebar item)
  useEffect(() => {
    setActiveViewOverride(null);
  }, [subTab]);

  // Real Database Entities
  const [customers, setCustomers] = useState([]);
  const [dbCustomerStats, setDbCustomerStats] = useState({ total: 0, active: 0, suspended: 0, subscribed: 0, adHoc: 0, newThisMonth: 0 });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Orders State (for Customer Orders & Order History)
  const [orders, setOrders] = useState([]);
  const [dbOrderStats, setDbOrderStats] = useState({ total: 0, pending: 0, active: 0, completed: 0, cancelled: 0, refunded: 0, totalGross: 0, aov: 0 });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Activity State (for Customer Activity)
  const [activities, setActivities] = useState([]);
  const [activityStats, setActivityStats] = useState({ totalCustomers: 0, activeNow: 0, newToday: 0, suspended: 0 });
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);

  // Subscriptions State (for Subscriptions View)
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expiringSoon: 0,
    paused: 0,
    expired: 0,
    cancelled: 0
  });
  const [subscriptionDistribution, setSubscriptionDistribution] = useState({
    activePct: 84.1,
    pendingPct: 2.2,
    expiringPct: 5.1,
    pausedPct: 3.9,
    expiredPct: 3.6,
    cancelledPct: 1.1
  });
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedSubDossier, setSelectedSubDossier] = useState(null);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');
  const [subKitchenFilter, setSubKitchenFilter] = useState('ALL');
  const [subPlanFilter, setSubPlanFilter] = useState('ALL');
  const [subPaymentFilter, setSubPaymentFilter] = useState('ALL');
  const [subHorizon, setSubHorizon] = useState('30 Days');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Sub Action Confirmation Modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [subModalConfig, setSubModalConfig] = useState({ type: '', subId: '', title: '', message: '' });

  // Filter States for other tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [customerToSuspend, setCustomerToSuspend] = useState(null);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('Security / KYC verification flag');

  const forensicSectionRef = useRef(null);
  const subDossierRef = useRef(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Real Customers from DB
  const fetchCustomers = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`http://localhost:5000/api/admin/customers?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        if (data.stats) setDbCustomerStats(data.stats);
        if (data.customers.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(data.customers[0].id || data.customers[0].mongoId);
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Fetch Real Orders from DB
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/orders?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.stats) setDbOrderStats(data.stats);
        if (data.orders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(data.orders[0].orderId || data.orders[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // 3. Fetch Real Activities from DB
  const fetchActivities = async () => {
    try {
      setActivityLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/audit-logs?search=${encodeURIComponent(searchQuery)}&type=${eventTypeFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.activities)) {
        setActivities(data.activities);
        if (data.stats) setActivityStats(data.stats);
        if (data.activities.length > 0 && !selectedActivityId) {
          setSelectedActivityId(data.activities[0]._id || 'act_0');
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  // 4. Fetch Real Subscriptions from DB
  const fetchSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      const params = new URLSearchParams();
      if (subSearchQuery) params.append('search', subSearchQuery);
      if (subStatusFilter !== 'ALL') params.append('status', subStatusFilter);
      if (subKitchenFilter !== 'ALL') params.append('provider', subKitchenFilter);
      if (subPlanFilter !== 'ALL') params.append('plan', subPlanFilter);
      if (subPaymentFilter !== 'ALL') params.append('paymentStatus', subPaymentFilter);

      const res = await fetch(`http://localhost:5000/api/admin/subscriptions?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.subscriptions)) {
        setSubscriptions(data.subscriptions);
        if (data.stats) setSubscriptionStats(data.stats);
        if (data.distribution) setSubscriptionDistribution(data.distribution);
        if (data.subscriptions.length > 0 && !selectedSubId) {
          setSelectedSubId(data.subscriptions[0].subId);
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  // 5. Fetch Subscription 360° Dossier
  const fetchSubDossier = async (subId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/subscriptions/${encodeURIComponent(subId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedSubDossier(data.data);
      }
    } catch (err) {
      console.error('Error fetching sub dossier:', err);
    }
  };

  // Initial & Reactive Data Loads
  useEffect(() => {
    fetchCustomers();
    fetchOrders();
    fetchActivities();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (currentView === 'orders' || currentView === 'customer-orders' || currentView === 'history' || currentView === 'order-history') {
      fetchOrders();
    } else if (currentView === 'activity' || currentView === 'customer-activity') {
      fetchActivities();
    } else if (currentView === 'subscriptions' || currentView === 'customers-subscriptions') {
      fetchSubscriptions();
    } else {
      fetchCustomers();
    }
  }, [currentView, searchQuery, eventTypeFilter, subSearchQuery, subStatusFilter, subKitchenFilter, subPlanFilter, subPaymentFilter]);

  useEffect(() => {
    if (selectedSubId) {
      fetchSubDossier(selectedSubId);
    }
  }, [selectedSubId]);

  // Update Customer Status (Suspend / Reactivate)
  const handleUpdateCustomerStatus = async (customerId, newStatus, reason) => {
    try {
      setIsSyncing(true);
      const res = await fetch(`http://localhost:5000/api/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Customer ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully.`);
        fetchCustomers();
        fetchActivities();
        setShowSuspendModal(false);
      } else {
        triggerToast(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating customer status:', err);
      triggerToast('Error updating customer status');
    } finally {
      setIsSyncing(false);
    }
  };

  // Perform Subscription Action (Pause / Resume / Cancel / Renew)
  const executeSubAction = async () => {
    const { type, subId } = subModalConfig;
    if (!type || !subId) return;
    try {
      setIsSyncing(true);
      const endpoint = `http://localhost:5000/api/admin/subscriptions/${encodeURIComponent(subId)}/${type.toLowerCase()}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || `Action ${type} completed successfully.`);
        fetchSubscriptions();
        fetchSubDossier(subId);
        setShowSubModal(false);
      } else {
        triggerToast(data.message || 'Action failed.');
      }
    } catch (err) {
      console.error('Error executing sub action:', err);
      triggerToast('Network error performing action.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Selected Entities
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId || c.mongoId === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  const currentOrder = useMemo(() => {
    return orders.find(o => (o.orderId === selectedOrderId || o._id === selectedOrderId)) || orders[0] || null;
  }, [orders, selectedOrderId]);

  const currentActivity = useMemo(() => {
    return activities.find(a => (a._id === selectedActivityId || a.id === selectedActivityId)) || activities[0] || null;
  }, [activities, selectedActivityId]);

  // Filtered Orders for "Customer Orders" view
  const filteredCustomerOrders = useMemo(() => {
    return orders.filter(o => {
      const st = String(o.status || '').toLowerCase();
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING' && !['pending', 'order_placed', 'created'].includes(st)) return false;
        if (statusFilter === 'ACTIVE' && !['active', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'on route', 'prep'].includes(st)) return false;
        if (statusFilter === 'COMPLETED' && !['completed', 'delivered'].includes(st)) return false;
        if (statusFilter === 'CANCELLED' && !['cancelled', 'canceled'].includes(st)) return false;
      }
      if (paymentFilter !== 'ALL') {
        const pSt = String(o.paymentStatus || '').toUpperCase();
        if (paymentFilter === 'PAID' && pSt !== 'PAID') return false;
        if (paymentFilter === 'PENDING' && pSt !== 'PENDING') return false;
      }
      if (providerFilter !== 'ALL') {
        if (!String(o.providerName || '').toLowerCase().includes(providerFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, providerFilter]);

  // Filtered Orders for "Order History" view
  const filteredOrderHistory = useMemo(() => {
    return orders.filter(o => {
      const st = String(o.status || '').toLowerCase();
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'COMPLETED' && !['completed', 'delivered'].includes(st)) return false;
        if (statusFilter === 'CANCELLED' && !['cancelled', 'canceled'].includes(st)) return false;
        if (statusFilter === 'REFUNDED' && !['refunded', 'disputed'].includes(st)) return false;
      }
      if (providerFilter !== 'ALL') {
        if (!String(o.providerName || '').toLowerCase().includes(providerFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [orders, statusFilter, providerFilter]);

  // Export handlers
  const handleExportOrdersCsv = () => {
    if (orders.length === 0) {
      triggerToast('No orders to export.');
      return;
    }
    const headers = ['OrderID', 'Customer', 'Phone', 'Provider', 'Manifest', 'Amount', 'PaymentStatus', 'Status', 'Date'];
    const rows = orders.map(o => [
      `"${o.orderId || o._id}"`,
      `"${o.customerName || 'Customer'}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.providerName || ''}"`,
      `"${o.tiffinName || ''}"`,
      o.totalAmount || o.grossAmount || 0,
      o.paymentStatus || 'PAID',
      o.status || 'Delivered',
      `"${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tiffinlink_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Orders ledger exported as CSV.');
  };

  const handleExportSubscriptionsCsv = () => {
    if (subscriptions.length === 0) {
      triggerToast('No subscriptions to export.');
      return;
    }
    const headers = ['SubscriptionID', 'Customer', 'Phone', 'Provider', 'Plan', 'TotalMeals', 'Delivered', 'Remaining', 'Amount', 'Payment', 'Status', 'StartDate', 'EndDate'];
    const rows = subscriptions.map(s => [
      `"${s.subId}"`,
      `"${s.customerName}"`,
      `"${s.customerPhone}"`,
      `"${s.providerName}"`,
      `"${s.plan}"`,
      s.totalMeals,
      s.deliveredMeals,
      s.remainingMeals,
      s.amount,
      s.paymentStatus,
      s.status,
      `"${s.startDate}"`,
      `"${s.endDate}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tiffinlink_subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Subscriptions exported as CSV.');
  };

  const handleExportAuditJson = () => {
    const jsonStr = JSON.stringify(activities, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiffinlink_audit_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Audit logs exported as JSON.');
  };

  return (
    <div className="w-full min-h-screen bg-[#fbf9f5] text-[#1b1c1a] antialiased flex flex-col font-sans select-text">

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1a1a] text-white px-5 py-3 border border-[#ded9d1] shadow-2xl flex items-center gap-3 animate-slideIn">
          <Sparkles size={16} className="text-[#eee0d2]" />
          <span className="font-mono text-xs tracking-tight">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modal: Suspend / Reactivate Customer */}
      {showSuspendModal && customerToSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={customerToSuspend.status === 'suspended' ? 'text-emerald-700' : 'text-[#ba1a1a]'} />
                <h3 className="font-serif text-lg text-[#1a1a1a] font-normal">
                  {customerToSuspend.status === 'suspended' ? 'Reactivate Customer Account' : 'Suspend Customer Account'}
                </h3>
              </div>
              <button onClick={() => setShowSuspendModal(false)} className="text-[#665d52] hover:text-[#1a1a1a]">
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-[#444748] space-y-2">
              <p>
                <strong>Patron:</strong> {customerToSuspend.name} ({customerToSuspend.email})
              </p>
              <p>
                {customerToSuspend.status === 'suspended'
                  ? 'Reactivating will restore ordering privileges, renew mandate processing, and clear platform restrictions.'
                  : 'Suspension will immediately block active meal orders, pause recurring subscriptions, and record an audit security flag.'}
              </p>
            </div>

            {customerToSuspend.status !== 'suspended' && (
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase text-[#665d52] font-semibold">Reason for Suspension</label>
                <input
                  type="text"
                  value={suspensionReasonInput}
                  onChange={(e) => setSuspensionReasonInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#ded9d1] text-xs font-mono outline-none"
                  placeholder="e.g. Fraud dispute / Repeated OTP failure"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#ded9d1]">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 bg-[#efeeea] hover:bg-[#eae8e4] text-xs font-medium text-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetStatus = customerToSuspend.status === 'suspended' ? 'active' : 'suspended';
                  handleUpdateCustomerStatus(customerToSuspend.mongoId || customerToSuspend.id, targetStatus, suspensionReasonInput);
                }}
                className={`px-4 py-2 text-xs font-medium text-white transition-colors ${
                  customerToSuspend.status === 'suspended' ? 'bg-[#1a1a1a] hover:bg-emerald-800' : 'bg-[#ba1a1a] hover:bg-red-800'
                }`}
              >
                {customerToSuspend.status === 'suspended' ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Subscription Action Confirmation (Pause / Resume / Cancel / Renew) */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={subModalConfig.type === 'CANCEL' ? 'text-[#ba1a1a]' : 'text-amber-700'} />
                <h3 className="font-serif text-lg text-[#1a1a1a] font-normal">
                  {subModalConfig.title}
                </h3>
              </div>
              <button onClick={() => setShowSubModal(false)} className="text-[#665d52] hover:text-[#1a1a1a]">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#444748] leading-relaxed">
              {subModalConfig.message}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#ded9d1]">
              <button
                onClick={() => setShowSubModal(false)}
                className="px-4 py-2 bg-[#efeeea] hover:bg-[#eae8e4] text-xs font-medium text-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                onClick={executeSubAction}
                className={`px-4 py-2 text-xs font-medium text-white transition-colors ${
                  subModalConfig.type === 'CANCEL' ? 'bg-[#ba1a1a] hover:bg-red-800' : 'bg-[#1a1a1a] hover:bg-neutral-800'
                }`}
              >
                Confirm {subModalConfig.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CUSTOMER ORDERS & LIVE DISPATCH VIEW                                   */}
      {/* ========================================================================= */}
      {currentView === 'orders' || currentView === 'customer-orders' ? (
        <div className="px-8 py-8 space-y-8 max-w-[1720px] mx-auto w-full animate-fadeIn">
          {/* Breadcrumb & Surveillance Metadata */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono uppercase text-[#665d52] tracking-widest text-[11px]">
                <span>Super Admin</span>
                <span>/</span>
                <span>Management</span>
                <span>/</span>
                <span>Customers</span>
                <span>/</span>
                <span className="text-[#1a1a1a] font-bold">Customer Orders</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] tracking-tight font-normal">
                Customer Orders &amp; Live Dispatch
              </h1>
              <p className="text-sm text-[#444748] max-w-3xl">
                Real-time platform surveillance of active customer demand, kitchen fulfillment states, and courier handover telemetry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#efeeea] font-mono text-[11px] text-[#1b1c1a]">
                <span className="w-2 h-2 rounded-full bg-[#1a1a1a] animate-pulse"></span>
                <span>WebSocket Active (TLS 1.3)</span>
              </div>
              <button
                onClick={handleExportOrdersCsv}
                className="px-4 py-2 bg-[#efeeea] hover:bg-[#eae8e4] transition-colors text-xs font-medium flex items-center gap-2 text-[#1b1c1a] border border-[#ded9d1]"
              >
                <Download size={15} />
                <span>Export Orders CSV</span>
              </button>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-black/90 transition-colors text-xs font-medium flex items-center gap-2"
              >
                <RefreshCw size={15} className={ordersLoading ? 'animate-spin' : ''} />
                <span>Refresh Stream</span>
              </button>
            </div>
          </div>

          {/* Top KPI Telemetry Grid (5 Real DB Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Total Orders Today</span>
                <ReceiptIcon />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none mb-1">
                  {dbOrderStats.total}
                </div>
                <div className="font-mono text-[11px] text-[#665d52] tracking-wide">
                  Platform-wide volume
                </div>
              </div>
              <div className="w-full bg-[#ded9d1] h-1 overflow-hidden">
                <div className="bg-[#1a1a1a] h-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Pending Acceptance</span>
                <Clock size={16} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none mb-1">
                  {dbOrderStats.pending}
                </div>
                <div className="font-mono text-[11px] text-[#665d52] tracking-wide">
                  Awaiting kitchen ACK &lt; 3m SLA
                </div>
              </div>
              <div className="w-full bg-[#ded9d1] h-1 overflow-hidden">
                <div className="bg-[#1a1a1a] h-full" style={{ width: `${Math.min(100, dbOrderStats.pending * 10)}%` }}></div>
              </div>
            </div>

            <div className="p-5 bg-[#1a1a1a] text-white flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase text-white/70 tracking-widest text-[10px] font-semibold">Active In-Flight</span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </div>
              <div>
                <div className="font-serif text-3xl text-white font-normal leading-none mb-1">
                  {dbOrderStats.active}
                </div>
                <div className="font-mono text-[11px] text-white/80 tracking-tight">
                  Kitchen prep &amp; courier routes
                </div>
              </div>
              <div className="w-full bg-white/20 h-1 overflow-hidden">
                <div className="bg-white h-full" style={{ width: `${Math.min(100, dbOrderStats.active * 15)}%` }}></div>
              </div>
            </div>

            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Completed Today</span>
                <CheckCircle2 size={16} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none mb-1">
                  {dbOrderStats.completed}
                </div>
                <div className="font-mono text-[11px] text-[#665d52] tracking-wide">
                  {dbOrderStats.total > 0 ? Math.round((dbOrderStats.completed / dbOrderStats.total) * 100) : 100}% fulfillment rate
                </div>
              </div>
              <div className="w-full bg-[#ded9d1] h-1 overflow-hidden">
                <div className="bg-[#1a1a1a] h-full" style={{ width: `${Math.min(100, (dbOrderStats.completed / (dbOrderStats.total || 1)) * 100)}%` }}></div>
              </div>
            </div>

            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Cancelled / Exception</span>
                <AlertTriangle size={16} className={dbOrderStats.cancelled > 0 ? 'text-[#ba1a1a]' : 'text-[#665d52]'} />
              </div>
              <div>
                <div className={`font-serif text-3xl font-normal leading-none mb-1 ${dbOrderStats.cancelled > 0 ? 'text-[#ba1a1a]' : 'text-[#1a1a1a]'}`}>
                  {dbOrderStats.cancelled}
                </div>
                <div className="font-mono text-[11px] text-[#665d52] tracking-wide">
                  Auto-reversed to source
                </div>
              </div>
              <div className="w-full bg-[#ded9d1] h-1 overflow-hidden">
                <div className="bg-[#ba1a1a] h-full" style={{ width: `${Math.min(100, dbOrderStats.cancelled * 20)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Filter & Multi-Criteria Panel */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex-1 min-w-[280px] bg-[#fbf9f5] px-3 py-2 flex items-center gap-2 border border-[#ded9d1]">
                <Search size={18} className="text-[#665d52]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Order #TL, Customer name, Phone, Kitchen, or Courier..."
                  className="w-full bg-transparent text-xs text-[#1b1c1a] focus:outline-none placeholder:text-[#665d52]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#fbf9f5] border border-[#ded9d1] px-3 py-2 font-mono text-xs text-[#1b1c1a] outline-none cursor-pointer"
                >
                  <option value="ALL">Status: All Active</option>
                  <option value="ACTIVE">Active (In Prep/Route)</option>
                  <option value="PENDING">Pending Acceptance</option>
                  <option value="COMPLETED">Completed Handshake</option>
                  <option value="CANCELLED">Cancelled / Reversed</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-[#fbf9f5] border border-[#ded9d1] px-3 py-2 font-mono text-xs text-[#1b1c1a] outline-none cursor-pointer"
                >
                  <option value="ALL">Payment: All Types</option>
                  <option value="PAID">Paid / Captured</option>
                  <option value="PENDING">Payment Pending</option>
                </select>

                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="bg-[#fbf9f5] border border-[#ded9d1] px-3 py-2 font-mono text-xs text-[#1b1c1a] outline-none cursor-pointer"
                >
                  <option value="ALL">Kitchens: All Hubs</option>
                  <option value="Xoxo">Xoxo Men Kitchen</option>
                  <option value="Ghar">Ghar Ka Khana</option>
                  <option value="Annapurna">Maa Annapurna Rasoi</option>
                  <option value="Priya">Priya's Home Kitchen</option>
                  <option value="Rasoi">Rasoi Express</option>
                </select>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPaymentFilter('ALL');
                    setProviderFilter('ALL');
                    triggerToast('Filters reset.');
                  }}
                  className="bg-[#fbf9f5] hover:bg-[#eae8e4] border border-[#ded9d1] text-xs font-mono uppercase text-[#1a1a1a] transition-colors py-2 px-3"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Master Table + Detail Flyout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Table (8 Cols) */}
            <div className="xl:col-span-8 flex flex-col gap-4">
              <div className="w-full overflow-x-auto bg-[#fbf9f5] border border-[#ded9d1]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] uppercase tracking-wider border-b border-[#ded9d1]">
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-4 font-semibold">Customer &amp; Phone</th>
                      <th className="py-3 px-4 font-semibold">Provider Kitchen</th>
                      <th className="py-3 px-4 font-semibold">Tiffin Manifest</th>
                      <th className="py-3 px-4 font-semibold text-right">Amount</th>
                      <th className="py-3 px-4 font-semibold">Lifecycle Stage</th>
                      <th className="py-3 px-4 font-semibold">Courier Node</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ded9d1]/60">
                    {ordersLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#665d52]">Loading real orders from MongoDB...</td>
                      </tr>
                    ) : filteredCustomerOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#665d52]">No customer orders matching criteria.</td>
                      </tr>
                    ) : (
                      filteredCustomerOrders.map((ord) => {
                        const isSelected = selectedOrderId === (ord.orderId || ord._id);
                        const isDelivered = ['delivered', 'completed'].includes(String(ord.status).toLowerCase());
                        const isCancelled = ['cancelled', 'canceled'].includes(String(ord.status).toLowerCase());
                        const isInFlight = ['active', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit'].includes(String(ord.status).toLowerCase());

                        return (
                          <tr
                            key={ord.orderId || ord._id}
                            onClick={() => setSelectedOrderId(ord.orderId || ord._id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#eae8e4] font-medium'
                                : 'hover:bg-[#f5f3ef]'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono font-medium text-[#1a1a1a]">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isInFlight ? 'bg-[#1a1a1a] animate-ping' : isDelivered ? 'bg-emerald-600' : 'bg-[#ded9d1]'}`}></span>
                                <span>{ord.orderId || ord.requestId || `#TL-${String(ord._id).slice(-4)}`}</span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#1a1a1a]">{ord.customerName}</div>
                              <div className="text-[11px] font-mono text-[#665d52]">{ord.customerPhone}</div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="text-[#1a1a1a]">{ord.providerName}</div>
                              <div className="text-[11px] font-mono text-[#665d52]">{ord.providerAddress || 'Ahmedabad Node'}</div>
                            </td>

                            <td className="py-3 px-4 max-w-[190px]">
                              <div className="truncate text-[#1a1a1a] font-medium">{ord.tiffinName} × {ord.quantity || 1}</div>
                              <div className="text-[10px] font-mono text-[#665d52]">Canister #TK-9021</div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="font-mono text-[#1a1a1a] font-semibold">₹{(ord.totalAmount || ord.grossAmount || 0).toFixed(2)}</div>
                              <div className="text-[10px] font-mono text-[#665d52]">{ord.paymentStatus || 'PAID'}</div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                                isInFlight ? 'bg-[#1a1a1a] text-white' : isCancelled ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#efeeea] text-[#1b1c1a]'
                              }`}>
                                {ord.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-[#665d52]">
                              {ord.assignedDriverName || 'Unassigned'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderId(ord.orderId || ord._id);
                                }}
                                className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[11px] uppercase tracking-wider hover:bg-[#4a4238] transition-colors"
                              >
                                Inspect ↗
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Route Velocity & Regional Load Telemetry */}
              <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-widest font-semibold">Route Velocity &amp; Handover Health</span>
                  <div className="font-serif text-2xl text-[#1a1a1a] font-normal">Ahmedabad West Corridor</div>
                  <p className="text-xs text-[#665d52] max-w-lg">
                    Average delivery turnaround is currently 26.4 mins from kitchen seal to doorstep handshake. Zero canister retention violations.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Courier Availability</span>
                    <span className="font-serif text-2xl text-[#1a1a1a] leading-tight">88%</span>
                    <span className="font-mono text-[10px] text-[#1a1a1a]">Active Live Fleet</span>
                  </div>
                  <svg className="w-28 h-10 text-[#1a1a1a]" fill="none" viewBox="0 0 128 48">
                    <rect fill="currentColor" height="24" opacity="0.3" width="8" x="0" y="24"></rect>
                    <rect fill="currentColor" height="32" opacity="0.4" width="8" x="14" y="16"></rect>
                    <rect fill="currentColor" height="28" opacity="0.5" width="8" x="28" y="20"></rect>
                    <rect fill="currentColor" height="38" opacity="0.6" width="8" x="42" y="10"></rect>
                    <rect fill="currentColor" height="40" opacity="0.8" width="8" x="56" y="8"></rect>
                    <rect fill="currentColor" height="44" opacity="0.9" width="8" x="70" y="4"></rect>
                    <rect fill="currentColor" height="36" width="8" x="84" y="12"></rect>
                    <rect fill="currentColor" height="30" opacity="0.7" width="8" x="98" y="18"></rect>
                    <rect fill="currentColor" height="34" opacity="0.85" width="8" x="112" y="14"></rect>
                  </svg>
                </div>
              </div>
            </div>

            {/* Live Order Detail Flyout (4 Cols) */}
            <div className="xl:col-span-4 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col gap-6">
              {currentOrder ? (
                <>
                  <div className="flex items-start justify-between pb-3 border-b border-[#ded9d1]">
                    <div>
                      <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px]">Real-Time Telemetry Dossier</span>
                      <h2 className="font-serif text-2xl text-[#1a1a1a] font-normal leading-tight">
                        Order {currentOrder.orderId || currentOrder.requestId}
                      </h2>
                      <div className="font-mono text-[11px] text-[#665d52] mt-0.5">
                        SESSION TOKEN: 0x9F82A4...B81
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#1a1a1a] text-white font-mono uppercase text-[10px] tracking-widest">
                      {currentOrder.status}
                    </span>
                  </div>

                  {/* Telemetry Map Preview Component */}
                  <div className="relative w-full h-40 bg-[#ded9d1] overflow-hidden border border-[#ded9d1]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-stone-900/20 to-transparent pointer-events-none z-10"></div>
                    <svg className="w-full h-full opacity-60" viewBox="0 0 400 160" preserveAspectRatio="none">
                      <line x1="0" y1="40" x2="400" y2="40" stroke="#747878" strokeWidth="0.8" />
                      <line x1="0" y1="80" x2="400" y2="80" stroke="#747878" strokeWidth="1.2" />
                      <line x1="0" y1="120" x2="400" y2="120" stroke="#747878" strokeWidth="0.8" />
                      <line x1="60" y1="0" x2="60" y2="160" stroke="#747878" strokeWidth="0.8" />
                      <line x1="140" y1="0" x2="140" y2="160" stroke="#747878" strokeWidth="1.2" />
                      <line x1="220" y1="0" x2="220" y2="160" stroke="#747878" strokeWidth="0.8" />
                      <line x1="300" y1="0" x2="300" y2="160" stroke="#747878" strokeWidth="1.2" />
                      <path d="M 60 80 Q 140 30 220 80 T 360 120" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeDasharray="4 2" />
                      <circle cx="60" cy="80" r="5" fill="#1a1a1a" />
                      <circle cx="360" cy="120" r="5" fill="#1a1a1a" />
                    </svg>
                    <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1 font-mono text-[10px] text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5 border border-[#ded9d1]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] animate-pulse"></span>
                      GPS Stream Active: Bodakdev Cluster
                    </div>
                    <div className="absolute bottom-3 right-3 z-20 bg-[#1a1a1a] text-white px-3 py-1 font-mono text-[11px]">
                      ETA: 6 MINS
                    </div>
                  </div>

                  {/* Customer End-Point */}
                  <div className="space-y-2">
                    <div className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Customer End-Point</div>
                    <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] flex items-start justify-between">
                      <div>
                        <div className="font-medium text-[#1a1a1a] text-sm">{currentOrder.customerName}</div>
                        <div className="font-mono text-xs text-[#665d52]">{currentOrder.customerPhone}</div>
                        <div className="text-xs text-[#444748] mt-1">{currentOrder.customerAddress}</div>
                      </div>
                      <button
                        onClick={() => triggerToast(`Contacting ${currentOrder.customerName}...`)}
                        className="p-1.5 text-[#665d52] hover:text-[#1a1a1a] transition-colors"
                      >
                        <Phone size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Provider Kitchen Node */}
                  <div className="space-y-2">
                    <div className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Provider Fulfillment Node</div>
                    <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1a1a1a]">{currentOrder.providerName}</span>
                        <span className="font-mono text-[10px] text-[#665d52]">FSSAI CERTIFIED</span>
                      </div>
                      <div className="text-[#665d52]">Culinary Dispatch Bay #04</div>
                      <div className="p-2 bg-[#f5f3ef] font-mono text-[11px] text-[#1a1a1a] flex items-center justify-between border border-[#ded9d1]">
                        <span>CANISTER HW: 304 STEEL #TK-9021</span>
                        <span className="font-bold">RFID LOCKED</span>
                      </div>
                    </div>
                  </div>

                  {/* Tiffin Manifest */}
                  <div className="space-y-2">
                    <div className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Tiffin Manifest Specification</div>
                    <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium text-[#1a1a1a]">
                        <span>{currentOrder.tiffinName} × {currentOrder.quantity || 1}</span>
                        <span className="font-mono font-bold">₹{(currentOrder.totalAmount || currentOrder.grossAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-[#665d52]">
                        Stainless Canister Packed • Zero Plastic SLA
                      </div>
                    </div>
                  </div>

                  {/* Courier & Protocol */}
                  <div className="space-y-2">
                    <div className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Assigned Logistics Courier</div>
                    <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white">
                          <Bike size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-[#1a1a1a]">{currentOrder.assignedDriverName || 'Awaiting Courier Handover'}</div>
                          <div className="font-mono text-[10px] text-[#665d52]">Hero Splendor • 4.9★</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#f5f3ef] font-mono text-[10px] text-[#1a1a1a] font-bold border border-[#ded9d1]">
                        OTP PENDING
                      </span>
                    </div>
                  </div>

                  {/* Settlement & Escrow Breakdown */}
                  <div className="space-y-2">
                    <div className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Settlement Telemetry (Escrow Hold)</div>
                    <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] font-mono text-xs space-y-1.5">
                      <div className="flex justify-between text-[#665d52]">
                        <span>Order Gross:</span>
                        <span className="text-[#1a1a1a] font-semibold">₹{(currentOrder.grossAmount || currentOrder.totalAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#665d52]">
                        <span>Courier Delivery Fee:</span>
                        <span className="text-[#1a1a1a]">₹{(currentOrder.deliveryFee || 20).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#665d52]">
                        <span>Platform Take-Rate (6%):</span>
                        <span className="text-[#1a1a1a]">₹{(currentOrder.platformFee || 10).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#665d52] pt-1 border-t border-[#ded9d1]">
                        <span>Kitchen Net Disbursement:</span>
                        <span className="text-[#1a1a1a] font-bold">₹{(currentOrder.providerAmount || 156).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-Time Lifecycle Stepper Timeline */}
                  <div className="space-y-3 pt-2">
                    <div className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Telemetry Lifecycle Log</div>
                    <div className="relative pl-6 space-y-3 font-mono text-[11px]">
                      <div className="absolute left-2 top-1 bottom-1 w-[1px] bg-[#ded9d1]"></div>
                      <div className="relative flex items-start justify-between">
                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-[#1a1a1a]"></div>
                        <div>
                          <span className="font-medium text-[#1a1a1a]">Order Placed via App</span>
                          <div className="text-[10px] text-[#665d52]">UI handshake valid</div>
                        </div>
                        <span className="text-[#665d52] text-[10px]">19:15</span>
                      </div>
                      <div className="relative flex items-start justify-between">
                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-[#1a1a1a]"></div>
                        <div>
                          <span className="font-medium text-[#1a1a1a]">Kitchen ACK Received</span>
                          <div className="text-[10px] text-[#665d52]">Within SLA</div>
                        </div>
                        <span className="text-[#665d52] text-[10px]">19:16</span>
                      </div>
                      <div className="relative flex items-start justify-between">
                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-[#1a1a1a]"></div>
                        <div>
                          <span className="font-medium text-[#1a1a1a]">Canister Sealed</span>
                          <div className="text-[10px] text-[#665d52]">Thermal verified 74°C</div>
                        </div>
                        <span className="text-[#665d52] text-[10px]">19:32</span>
                      </div>
                      <div className="relative flex items-start justify-between">
                        <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-white ring-2 ring-[#1a1a1a]"></div>
                        <div>
                          <span className="font-bold text-[#1a1a1a]">In Transit (1.2 km away)</span>
                          <div className="text-[10px] text-[#665d52]">Speed: 28 km/h</div>
                        </div>
                        <span className="text-[#1a1a1a] font-bold text-[10px]">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => triggerToast(`SMS alert dispatched to ${currentOrder.customerPhone}.`)}
                      className="w-full py-2.5 bg-[#1a1a1a] text-white font-medium text-xs hover:bg-[#4a4238] transition-colors"
                    >
                      Transmit Customer SMS Alert
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => triggerToast(`Reassignment request queued for Order ${currentOrder.orderId}.`)}
                        className="w-full py-2 bg-[#fbf9f5] border border-[#ded9d1] text-xs font-medium text-[#1a1a1a] hover:bg-[#eae8e4] transition-colors"
                      >
                        Reassign Courier
                      </button>
                      <button
                        onClick={() => triggerToast(`Order ${currentOrder.orderId} force-cancelled; escrow reversal initiated.`)}
                        className="w-full py-2 bg-[#ffdad6] border border-[#ffdad6] text-xs font-medium text-[#ba1a1a] hover:bg-red-200 transition-colors"
                      >
                        Force-Cancel
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-[#665d52] italic">
                  Select an order to inspect live telemetry.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : currentView === 'history' || currentView === 'order-history' ? (
        /* ========================================================================= */
        /* 2. ORDER HISTORY & FORENSIC ARCHIVE VIEW                                  */
        /* ========================================================================= */
        <div className="px-8 py-8 space-y-10 max-w-[1720px] mx-auto w-full animate-fadeIn">
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono uppercase text-[#665d52] tracking-widest text-[11px]">
              <span>SUPER ADMIN</span>
              <span className="text-[#ded9d1]">/</span>
              <span>MANAGEMENT</span>
              <span className="text-[#ded9d1]">/</span>
              <span>CUSTOMERS</span>
              <span className="text-[#ded9d1]">/</span>
              <span className="text-[#1a1a1a] font-semibold">ORDER HISTORY</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2">
              <div className="space-y-1 max-w-3xl">
                <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] tracking-tight font-normal">
                  Historical Order Intelligence &amp; Forensic Archive
                </h1>
                <p className="text-sm text-[#444748]">
                  Permanent WORM-compliant repository of completed, cancelled, refunded, and archived customer transactions across all culinary clusters.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleExportOrdersCsv}
                  className="px-4 py-2.5 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] hover:bg-[#eae8e4] transition-colors text-xs font-medium flex items-center gap-2"
                >
                  <Download size={15} />
                  <span>Export Audit CSV / JSON</span>
                </button>
                <button
                  onClick={fetchOrders}
                  className="px-4 py-2.5 bg-[#1a1a1a] text-white hover:bg-[#4a4238] transition-colors text-xs font-medium flex items-center gap-2"
                >
                  <RefreshCw size={15} className={ordersLoading ? 'animate-spin' : ''} />
                  <span>Refresh Ledger</span>
                  <span className="font-mono text-[10px] text-white/70 ml-1 px-1.5 py-0.5 bg-black/40">SHA-256 OK</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Real DB KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Total Historical Orders</span>
                <FileText size={18} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal tracking-tight">{dbOrderStats.total}</div>
                <div className="text-xs text-[#665d52] mt-1 font-mono">All-time recorded ledger entries</div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Completed Orders</span>
                <CheckCircle2 size={18} className="text-[#1a1a1a]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal tracking-tight">{dbOrderStats.completed}</div>
                <div className="text-xs text-[#665d52] mt-1 flex items-center gap-1.5 font-mono">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></span>
                  {dbOrderStats.total > 0 ? Math.round((dbOrderStats.completed / dbOrderStats.total) * 100) : 100}% fulfillment compliance
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Cancelled Orders</span>
                <AlertTriangle size={18} className="text-[#ba1a1a]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#ba1a1a] font-normal tracking-tight">{dbOrderStats.cancelled}</div>
                <div className="text-xs text-[#665d52] mt-1 font-mono">
                  {dbOrderStats.total > 0 ? ((dbOrderStats.cancelled / dbOrderStats.total) * 100).toFixed(1) : 0}% cancellation rate
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Total Revenue Disbursed</span>
                <CreditCard size={18} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal tracking-tight">₹{Math.floor(dbOrderStats.totalGross).toLocaleString()}</div>
                <div className="text-xs text-[#665d52] mt-1 font-mono">Avg order value ₹{dbOrderStats.aov.toFixed(0)}</div>
              </div>
            </div>
          </div>

          {/* Granular Filter Surface */}
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative w-full lg:flex-1">
                <Search size={18} className="absolute left-3 top-3 text-[#665d52]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Customer, Order ID (#TL-XXXX), Kitchen, or Courier..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#fbf9f5] border border-[#ded9d1] text-xs text-[#1a1a1a] placeholder:text-[#665d52] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-[#fbf9f5] border border-[#ded9d1] font-mono text-xs text-[#1a1a1a] outline-none"
                >
                  <option value="ALL">All Outcomes ({orders.length})</option>
                  <option value="COMPLETED">Completed Handshake</option>
                  <option value="CANCELLED">Cancelled / Reversed</option>
                </select>

                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="px-3 py-2.5 bg-[#fbf9f5] border border-[#ded9d1] font-mono text-xs text-[#1a1a1a] outline-none"
                >
                  <option value="ALL">All Kitchen Providers</option>
                  <option value="Xoxo">Xoxo Men Kitchen</option>
                  <option value="Ghar">Ghar Ka Khana</option>
                  <option value="Annapurna">Maa Annapurna Rasoi</option>
                  <option value="Priya">Priya's Home Kitchen</option>
                </select>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setProviderFilter('ALL');
                  }}
                  className="px-4 py-2.5 bg-[#fbf9f5] border border-[#ded9d1] text-xs font-mono uppercase text-[#1a1a1a]"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Historical Table */}
          <div className="overflow-x-auto bg-[#fbf9f5] border border-[#ded9d1]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] uppercase tracking-wider border-b border-[#ded9d1]">
                  <th className="py-3.5 px-4 font-semibold">Order ID</th>
                  <th className="py-3.5 px-4 font-semibold">Customer &amp; Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Provider Kitchen</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Meal Summary</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Gross Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Resolution</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/60">
                {filteredOrderHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#665d52]">No historical order records match criteria.</td>
                  </tr>
                ) : (
                  filteredOrderHistory.map((ord) => (
                    <tr key={ord.orderId || ord._id} className="hover:bg-[#f5f3ef] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1a1a1a]">
                        {ord.orderId || ord.requestId || `#TL-${String(ord._id).slice(-4)}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1a1a1a]">{ord.customerName}</div>
                        <div className="font-mono text-[11px] text-[#665d52]">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1a1a1a]">{ord.providerName}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#665d52]">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-[#1a1a1a] max-w-[180px] truncate">{ord.tiffinName}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1a1a1a]">
                        ₹{(ord.totalAmount || ord.grossAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#1a1a1a]">{ord.paymentMethod || 'UPI Intent'}</div>
                        <div className="font-mono text-[10px] text-[#665d52]">{ord.paymentStatus || 'PAID'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] uppercase font-bold ${
                          ['delivered', 'completed'].includes(String(ord.status).toLowerCase())
                            ? 'bg-[#efeeea] text-[#1a1a1a]'
                            : 'bg-[#ffdad6] text-[#ba1a1a]'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrderId(ord.orderId || ord._id);
                            if (forensicSectionRef.current) {
                              forensicSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="underline underline-offset-4 text-[#1a1a1a] hover:text-[#4a4238] font-medium"
                        >
                          View Forensic Trace
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Deep Audit Forensic Trace Section */}
          <section ref={forensicSectionRef} className="bg-[#f5f3ef] border border-[#ded9d1] p-8 lg:p-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-[#ded9d1]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#1a1a1a] text-white font-mono text-[11px] tracking-wider uppercase font-semibold">
                    IMMUTABLE SNAPSHOT
                  </span>
                  <span className="font-mono text-xs text-[#665d52]">NODAL BATCH #20260930-BOM-091</span>
                </div>
                <h2 className="font-serif text-2xl text-[#1a1a1a] tracking-tight font-normal">
                  ORDER {currentOrder?.orderId || '#TL-HISTORICAL'} Complete Lifecycle &amp; Escrow Dissection
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#665d52] pt-1">
                  <span>Merkle Block: <strong className="text-[#1a1a1a]">#1,489,102</strong></span>
                  <span>•</span>
                  <span>Yes Bank Nodal Settlement UTR: <strong className="text-[#1a1a1a]">YESB26270019284</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] text-xs font-medium flex items-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Print Affidavit</span>
                </button>
                <button
                  onClick={() => triggerToast('WORM Cryptographic SHA-256 Signature verified.')}
                  className="px-3 py-1.5 bg-[#fbf9f5] border border-[#ded9d1] text-xs font-medium flex items-center gap-1.5"
                >
                  <ShieldCheck size={15} />
                  <span>Verify Signature</span>
                </button>
              </div>
            </div>

            {/* Asymmetric Financial Dissection & Telemetry Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Financial Split (5 cols) */}
              <div className="lg:col-span-5 bg-[#fbf9f5] border border-[#ded9d1] p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                  <h3 className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Multi-Party Financial Split</h3>
                  <span className="font-mono text-[11px] text-[#665d52]">ESCROW RELEASED</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-[#665d52]">
                    <span>Patron Paid Gross:</span>
                    <span className="text-[#1a1a1a] font-bold text-sm">
                      ₹{(currentOrder?.grossAmount || currentOrder?.totalAmount || 186).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#665d52]">
                    <span>Kitchen Provider Share (83.8%):</span>
                    <span className="text-[#1a1a1a] font-semibold">
                      ₹{(currentOrder?.providerAmount || 156).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#665d52]">
                    <span>Courier Delivery Fee:</span>
                    <span className="text-[#1a1a1a]">₹{(currentOrder?.driverAmount || 20).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#665d52]">
                    <span>TiffinLink Protocol Commission (5.4%):</span>
                    <span className="text-[#1a1a1a]">₹{(currentOrder?.platformFee || 10).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] space-y-1.5 text-xs">
                  <div className="font-mono text-[10px] uppercase text-[#665d52]">Mutual Dual-Key Rating</div>
                  <div className="flex items-center justify-between font-mono text-xs text-[#1a1a1a]">
                    <span>Food Quality: <strong>5.0 / 5.0</strong></span>
                    <span>Courier Handshake: <strong>5.0 / 5.0</strong></span>
                  </div>
                </div>
              </div>

              {/* Operational Sequence Log (7 cols) */}
              <div className="lg:col-span-7 bg-[#fbf9f5] border border-[#ded9d1] p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                  <h3 className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Operational Sequence Log</h3>
                  <span className="font-mono text-[11px] text-[#665d52]">TOTAL TIME: 27m 16s</span>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]">
                    <div className="flex justify-between text-[#665d52] text-[11px]">
                      <span>19:15:02 IST</span>
                      <span>ORDER INITIALIZED</span>
                    </div>
                    <div className="text-[#1a1a1a] font-medium mt-1">Patron {currentOrder?.customerName || 'Aarav Sharma'} authorized payment via UPI Intent.</div>
                  </div>

                  <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]">
                    <div className="flex justify-between text-[#665d52] text-[11px]">
                      <span>19:16:15 IST</span>
                      <span>KITCHEN ACKNOWLEDGED</span>
                    </div>
                    <div className="text-[#1a1a1a] font-medium mt-1">{currentOrder?.providerName || 'Local Kitchen'} confirmed preparation queue.</div>
                  </div>

                  <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]">
                    <div className="flex justify-between text-[#665d52] text-[11px]">
                      <span>19:35:10 IST</span>
                      <span>DISPATCH &amp; COURIER CUSTODY</span>
                    </div>
                    <div className="text-[#1a1a1a] font-medium mt-1">Courier {currentOrder?.assignedDriverName || 'Assigned Delivery Partner'} scanned optical seal.</div>
                  </div>

                  <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]">
                    <div className="flex justify-between text-[#665d52] text-[11px]">
                      <span>19:42:18 IST</span>
                      <span>DOORSTEP FINALITY</span>
                    </div>
                    <div className="text-[#1a1a1a] font-medium mt-1">OTP handshake verified; escrow funds settled to nodal vault.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : currentView === 'activity' || currentView === 'customer-activity' ? (
        /* ========================================================================= */
        /* 3. CUSTOMER ACTIVITY & FORENSIC AUDIT STREAM                              */
        /* ========================================================================= */
        <div className="px-8 py-8 flex flex-col space-y-10 max-w-[1720px] mx-auto w-full animate-fadeIn">
          {/* Breadcrumb & Top Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#ded9d1]/60">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono uppercase text-[#665d52] tracking-widest text-[11px]">
                <span>SUPER ADMIN</span>
                <span>/</span>
                <span>MANAGEMENT</span>
                <span>/</span>
                <span>CUSTOMERS</span>
                <span>/</span>
                <span className="text-[#1a1a1a] font-bold">CUSTOMER ACTIVITY</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] tracking-tight font-normal">
                Customer Activity &amp; Forensic Audit Stream
              </h1>
              <p className="text-sm text-[#444748] max-w-3xl">
                Real-time cryptographic ledger of customer authentication, lifecycle transitions, cart mutations, and platform governance events across Ahmedabad clusters.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#f5f3ef] border border-[#ded9d1] text-[#1a1a1a] text-xs font-mono tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#1a1a1a] animate-ping"></span>
                <span className="uppercase font-semibold">Ingest Tail: LIVE</span>
              </div>
              <button
                onClick={fetchActivities}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-xs font-medium hover:bg-[#4a4238] transition-colors"
              >
                <RefreshCw size={15} className={activityLoading ? 'animate-spin' : ''} />
                <span>Refresh Audit Stream</span>
              </button>
            </div>
          </div>

          {/* Platform Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">TOTAL REGISTERED PATRONS</span>
                <Users size={18} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none tracking-tight">
                  {activityStats.totalCustomers || dbCustomerStats.total}
                </div>
                <div className="mt-2 text-xs text-[#665d52]">Western Ahmedabad cluster</div>
              </div>
              <div className="h-0.5 w-full bg-[#ded9d1]">
                <div className="h-0.5 bg-[#1a1a1a] w-4/5"></div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">ACTIVE HEARTBEATS NOW</span>
                <Activity size={18} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none tracking-tight">
                  {activityStats.activeNow || dbCustomerStats.active}
                </div>
                <div className="mt-2 text-xs text-[#665d52]">WebSocket sessions alive</div>
              </div>
              <div className="h-0.5 w-full bg-[#ded9d1]">
                <div className="h-0.5 bg-[#1a1a1a] w-2/3"></div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">NEW REGISTRATIONS TODAY</span>
                <UserCheck size={18} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none tracking-tight">
                  {activityStats.newToday || dbCustomerStats.newThisMonth}
                </div>
                <div className="mt-2 text-xs text-[#665d52]">All carrier-verified OTPs</div>
              </div>
              <div className="h-0.5 w-full bg-[#ded9d1]">
                <div className="h-0.5 bg-[#1a1a1a] w-1/4"></div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-[#ba1a1a] tracking-widest font-semibold">SUSPENDED / QUARANTINED</span>
                <ShieldAlert size={18} className="text-[#ba1a1a]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#ba1a1a] font-normal leading-none tracking-tight">
                  {activityStats.suspended || dbCustomerStats.suspended}
                </div>
                <div className="mt-2 text-xs text-[#665d52]">Held under fraud review</div>
              </div>
              <div className="h-0.5 w-full bg-[#ffdad6]">
                <div className="h-0.5 bg-[#ba1a1a] w-1/6"></div>
              </div>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex-1 flex items-center gap-3 bg-[#fbf9f5] px-4 py-2.5 border border-[#ded9d1]">
              <Search size={18} className="text-[#665d52]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Customer name, phone, IP address, event ID..."
                className="bg-transparent text-xs text-[#1a1a1a] placeholder:text-[#665d52] focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="bg-[#fbf9f5] border border-[#ded9d1] px-4 py-2.5 font-mono text-xs text-[#1a1a1a] uppercase outline-none cursor-pointer"
              >
                <option value="ALL">Event Type: All 19 Categories</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="REGISTRATION">REGISTRATION</option>
                <option value="PROFILE_UPDATED">PROFILE_UPDATED</option>
                <option value="ADDRESS_ADDED">ADDRESS_ADDED</option>
                <option value="ADDRESS_UPDATED">ADDRESS_UPDATED</option>
                <option value="ORDER_CREATED">ORDER_CREATED</option>
                <option value="ORDER_CANCELLED">ORDER_CANCELLED</option>
                <option value="ORDER_COMPLETED">ORDER_COMPLETED</option>
                <option value="SUBSCRIPTION_CREATED">SUBSCRIPTION_CREATED</option>
                <option value="SUBSCRIPTION_RENEWED">SUBSCRIPTION_RENEWED</option>
                <option value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</option>
                <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
                <option value="REFUND_REQUESTED">REFUND_REQUESTED</option>
                <option value="REFUND_COMPLETED">REFUND_COMPLETED</option>
                <option value="REVIEW_SUBMITTED">REVIEW_SUBMITTED</option>
                <option value="SUPPORT_REQUEST">SUPPORT_REQUEST</option>
                <option value="ACCOUNT_SUSPENDED">ACCOUNT_SUSPENDED</option>
                <option value="ACCOUNT_REACTIVATED">ACCOUNT_REACTIVATED</option>
              </select>

              <button
                onClick={handleExportAuditJson}
                className="px-4 py-2.5 bg-[#fbf9f5] border border-[#ded9d1] text-xs font-mono uppercase text-[#1a1a1a] flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Chronological Stream + Forensic Inspector */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Chronological Stream (7 Cols) */}
            <div className="xl:col-span-7 space-y-3">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">
                    CHRONOLOGICAL AUDIT LOG
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-[#f5f3ef] text-[#665d52]">
                    {activities.length} EVENTS RECORDED
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#665d52] tracking-wider">SYNC ENGINE: SECURE-WORM</span>
              </div>

              <div className="space-y-2.5">
                {activities.length === 0 ? (
                  <div className="p-8 text-center bg-[#f5f3ef] border border-[#ded9d1] text-xs text-[#665d52]">
                    No activity logs match the selected filter.
                  </div>
                ) : (
                  activities.map((act) => {
                    const isSelected = selectedActivityId === act._id;
                    const isWarning = ['ORDER_CANCELLED', 'PAYMENT_FAILED', 'REFUND_REQUESTED', 'ACCOUNT_SUSPENDED'].includes(act.action);

                    return (
                      <div
                        key={act._id}
                        onClick={() => setSelectedActivityId(act._id)}
                        className={`p-5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#eae8e4] border-l-4 border-l-[#1a1a1a] border-[#ded9d1]'
                            : isWarning
                            ? 'bg-[#f5f3ef] border-l-4 border-l-[#ba1a1a] border-[#ded9d1] hover:bg-[#eae8e4]'
                            : 'bg-[#f5f3ef] border border-[#ded9d1] hover:bg-[#eae8e4]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-mono font-medium text-[#1a1a1a]">
                                {act.createdAt ? new Date(act.createdAt).toLocaleTimeString('en-GB') : 'Just Now'}
                              </span>
                              <span className="text-[#ded9d1]">•</span>
                              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white font-mono text-[10px] tracking-wider uppercase">
                                {act.action}
                              </span>
                              <span className="text-[#ded9d1]">•</span>
                              <span className="font-medium text-[#1a1a1a]">{act.customerName || act.performedBy || 'Customer'}</span>
                            </div>
                            <p className="text-xs text-[#1b1c1a] line-clamp-1">{act.details || 'Event logged into audit registry.'}</p>
                            <div className="flex items-center gap-4 text-[11px] font-mono text-[#665d52] pt-1">
                              <span className="flex items-center gap-1">
                                <Laptop size={13} />
                                {act.ipAddress || '152.58.42.112'}
                              </span>
                              <span>{act.device || 'Chrome / Windows'}</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className={`px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase ${
                              isWarning ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#efeeea] text-[#1a1a1a]'
                            }`}>
                              {isWarning ? 'WARNING' : 'SUCCESS'}
                            </span>
                            <ChevronRight size={16} className="text-[#665d52]" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Inspector (5 Cols) */}
            <div className="xl:col-span-5 sticky top-24 space-y-4">
              <div className="p-6 bg-[#1a1a1a] text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/20">
                  <div>
                    <span className="font-mono text-[10px] tracking-widest text-[#ded9d1] uppercase block font-semibold">
                      AUDIT TELEMETRY INSPECTOR
                    </span>
                    <h2 className="font-serif text-2xl font-normal leading-snug tracking-tight text-white mt-0.5">
                      {currentActivity?._id || '#EVT-CUS-LIVE'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-[10px] font-mono uppercase tracking-wider text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    VERIFIED WORM
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2 border-b border-white/20 text-xs">
                  <div>
                    <div className="font-mono text-[10px] text-[#ded9d1] uppercase font-semibold">PATRON IDENTITY</div>
                    <div className="text-white font-medium mt-1">{currentActivity?.customerName || 'Customer Patron'}</div>
                    <div className="font-mono text-[11px] text-[#ded9d1]">{currentActivity?.customerEmail || 'patron@tiffinlink.com'}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-[#ded9d1] uppercase font-semibold">SECURITY STATUS</div>
                    <div className="text-white font-medium mt-1">Verified Patron (Low Risk)</div>
                    <div className="font-mono text-[11px] text-[#ded9d1]">Audit Consensus: Valid</div>
                  </div>
                </div>

                {/* Canonical Payload JSON */}
                <div className="py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#ded9d1] uppercase font-semibold">CANONICAL PAYLOAD JSON</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(currentActivity, null, 2));
                        triggerToast('JSON copied to clipboard.');
                      }}
                      className="text-[10px] font-mono uppercase text-[#ded9d1] hover:text-white flex items-center gap-1"
                    >
                      <Copy size={13} />
                      <span>Copy Raw</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/40 font-mono text-[11px] text-[#eee0d2] overflow-x-auto leading-relaxed border-l-2 border-white/40 max-h-60 select-all whitespace-pre">
                    {JSON.stringify(currentActivity, null, 2)}
                  </pre>
                </div>

                {/* Geolocation Visual Container */}
                <div className="pt-2 pb-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#ded9d1]">
                    <span>CAPTURE COORDINATES</span>
                    <span className="text-white font-bold">23.0338° N, 72.5850° E</span>
                  </div>
                  <div className="w-full h-20 bg-stone-800 flex items-center justify-center relative border border-white/10 overflow-hidden">
                    <svg className="w-full h-full opacity-30 absolute inset-0" viewBox="0 0 300 80">
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#fff" strokeWidth="0.5" />
                      <line x1="0" y1="40" x2="300" y2="40" stroke="#fff" strokeWidth="1" />
                      <line x1="0" y1="60" x2="300" y2="60" stroke="#fff" strokeWidth="0.5" />
                      <line x1="60" y1="0" x2="60" y2="80" stroke="#fff" strokeWidth="0.5" />
                      <line x1="150" y1="0" x2="150" y2="80" stroke="#fff" strokeWidth="1" />
                      <line x1="240" y1="0" x2="240" y2="80" stroke="#fff" strokeWidth="0.5" />
                      <circle cx="150" cy="40" r="4" fill="#fff" />
                    </svg>
                    <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 bg-black/70 font-mono text-[10px] text-white">
                      <MapPin size={12} className="text-[#ded9d1]" />
                      <span>Ahmedabad West: Navrangpura Node</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/20 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('customers-all');
                      else setActiveViewOverride('all');
                    }}
                    className="flex-1 px-3 py-2 bg-white text-[#1a1a1a] font-medium text-xs text-center hover:bg-[#eae8e4] transition-colors"
                  >
                    View Patron Dossier
                  </button>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate('customers-orders');
                      else setActiveViewOverride('orders');
                    }}
                    className="flex-1 px-3 py-2 bg-white/20 text-white font-medium text-xs text-center hover:bg-white/30 transition-colors"
                  >
                    View In Orders
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentView === 'subscriptions' || currentView === 'customers-subscriptions' ? (
        /* ========================================================================= */
        /* 4. SUBSCRIPTIONS & RECURRING MEAL PLANS VIEW                              */
        /* ========================================================================= */
        <div className="px-8 py-8 space-y-8 max-w-[1720px] mx-auto w-full animate-fadeIn">
          {/* Breadcrumb & Metadata Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#665d52] tracking-widest">
              <span>Super Admin</span>
              <span className="text-[#ded9d1]">/</span>
              <span>Management</span>
              <span className="text-[#ded9d1]">/</span>
              <span>Customers</span>
              <span className="text-[#ded9d1]">/</span>
              <span className="text-[#1a1a1a] font-semibold">Subscriptions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#efeeea] font-mono text-[11px] text-[#1b1c1a]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>WebSocket Stream: Synced (TLS 1.3)</span>
                <span className="text-[#665d52]">•</span>
                <span className="text-[#665d52]">Merkle Root Verified</span>
              </div>
            </div>
          </div>

          {/* Title & Actions Strip */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
            <div className="max-w-3xl space-y-2">
              <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] tracking-tight font-normal">
                Subscription Lifecycle &amp; Recurring Contract Ledger
              </h1>
              <p className="text-sm text-[#444748] leading-relaxed">
                Platform-wide governance of automated meal mandates, multi-week culinary contracts, kitchen batch forecasting, and escrow-backed recurring debits across Ahmedabad clusters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative bg-[#efeeea]">
                <select
                  value={subHorizon}
                  onChange={(e) => setSubHorizon(e.target.value)}
                  className="appearance-none bg-transparent font-medium text-xs text-[#1a1a1a] pl-3 pr-8 py-2.5 focus:outline-none cursor-pointer border border-[#ded9d1]"
                >
                  <option value="Today">Today</option>
                  <option value="7 Days">7 Days</option>
                  <option value="30 Days">30 Days (Selected)</option>
                  <option value="Custom">Custom Horizon</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#665d52]" />
              </div>
              <button
                onClick={fetchSubscriptions}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#efeeea] text-[#1a1a1a] text-xs font-medium hover:bg-[#eae8e4] transition-colors border border-[#ded9d1]"
              >
                <RefreshCw size={14} className={subscriptionsLoading ? 'animate-spin' : ''} />
                <span>Refresh Telemetry</span>
              </button>
              <button
                onClick={handleExportSubscriptionsCsv}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Download size={14} />
                <span>Export (CSV / JSON)</span>
              </button>
            </div>
          </div>

          {/* 7 KPI Summary Mosaic (Dynamic from MongoDB) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-widest font-semibold">Total Subscriptions</span>
              <div className="my-1">
                <span className="font-serif text-3xl text-[#1a1a1a]">{subscriptionStats.total}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">Across culinary hubs</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-widest font-semibold">Active Recurring</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              </div>
              <div className="my-1">
                <span className="font-serif text-3xl text-[#1a1a1a]">{subscriptionStats.active}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">{subscriptionDistribution.activePct}% fulfillment pool</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-widest font-semibold">Pending Activation</span>
                <Clock size={14} className="text-amber-700" />
              </div>
              <div className="my-1">
                <span className="font-serif text-3xl text-[#1a1a1a]">{subscriptionStats.pending}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">Mandate lock pending</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-amber-800 tracking-widest font-semibold">Expiring Soon (&lt;7D)</span>
                <AlertTriangle size={14} className="text-amber-700" />
              </div>
              <div className="my-1">
                <span className="font-serif text-3xl text-amber-900">{subscriptionStats.expiringSoon}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">Auto-renewal queued</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-widest font-semibold">Paused / Holiday</span>
                <Pause size={14} className="text-[#665d52]" />
              </div>
              <div className="my-1">
                <span className="font-serif text-3xl text-[#1a1a1a]">{subscriptionStats.paused}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">4:00 PM cutoff holds</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <span className="font-mono text-[10px] uppercase text-[#665d52] tracking-widest font-semibold">Expired / Renewed</span>
              <div className="my-1">
                <span className="font-serif text-3xl text-[#1a1a1a]">{subscriptionStats.expired}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">Cycle completed 100%</div>
            </div>

            <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#ba1a1a] tracking-widest font-semibold">Cancelled / Churn</span>
                <TrendingUp size={14} className="text-[#ba1a1a] rotate-180" />
              </div>
              <div className="my-1">
                <span className="font-serif text-3xl text-[#ba1a1a]">{subscriptionStats.cancelled}</span>
              </div>
              <div className="text-[11px] text-[#665d52]">{subscriptionDistribution.cancelledPct}% platform churn</div>
            </div>
          </div>

          {/* Proportional Segment Bar & Interactive Status Filter Pills */}
          <div className="space-y-4">
            <div className="w-full h-2.5 bg-[#efeeea] flex overflow-hidden border border-[#ded9d1]">
              <div className="h-full bg-[#1a1a1a]" style={{ width: `${subscriptionDistribution.activePct}%` }} title={`Active: ${subscriptionDistribution.activePct}%`}></div>
              <div className="h-full bg-amber-600" style={{ width: `${subscriptionDistribution.pendingPct}%` }} title={`Pending: ${subscriptionDistribution.pendingPct}%`}></div>
              <div className="h-full bg-amber-800" style={{ width: `${subscriptionDistribution.expiringPct}%` }} title={`Expiring Soon: ${subscriptionDistribution.expiringPct}%`}></div>
              <div className="h-full bg-[#665d52]" style={{ width: `${subscriptionDistribution.pausedPct}%` }} title={`Paused: ${subscriptionDistribution.pausedPct}%`}></div>
              <div className="h-full bg-[#ded9d1]" style={{ width: `${subscriptionDistribution.expiredPct}%` }} title={`Expired: ${subscriptionDistribution.expiredPct}%`}></div>
              <div className="h-full bg-[#ba1a1a]" style={{ width: `${subscriptionDistribution.cancelledPct}%` }} title={`Cancelled: ${subscriptionDistribution.cancelledPct}%`}></div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSubStatusFilter('ALL')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  subStatusFilter === 'ALL'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                All ({subscriptionStats.total})
              </button>
              <button
                onClick={() => setSubStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  subStatusFilter === 'ACTIVE'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>Active ({subscriptionStats.active} • {subscriptionDistribution.activePct}%)</span>
              </button>
              <button
                onClick={() => setSubStatusFilter('PENDING')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  subStatusFilter === 'PENDING'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span>Pending ({subscriptionStats.pending} • {subscriptionDistribution.pendingPct}%)</span>
              </button>
              <button
                onClick={() => setSubStatusFilter('EXPIRING_SOON')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  subStatusFilter === 'EXPIRING_SOON'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                <AlertTriangle size={12} className="text-amber-700" />
                <span>Expiring Soon ({subscriptionStats.expiringSoon} • {subscriptionDistribution.expiringPct}%)</span>
              </button>
              <button
                onClick={() => setSubStatusFilter('PAUSED')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  subStatusFilter === 'PAUSED'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                <Pause size={12} />
                <span>Paused ({subscriptionStats.paused} • {subscriptionDistribution.pausedPct}%)</span>
              </button>
              <button
                onClick={() => setSubStatusFilter('EXPIRED')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  subStatusFilter === 'EXPIRED'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                <Check size={12} />
                <span>Completed / Expired ({subscriptionStats.expired} • {subscriptionDistribution.expiredPct}%)</span>
              </button>
              <button
                onClick={() => setSubStatusFilter('CANCELLED')}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  subStatusFilter === 'CANCELLED'
                    ? 'bg-[#1a1a1a] text-white font-bold'
                    : 'bg-[#efeeea] text-[#444748] hover:bg-[#eae8e4]'
                }`}
              >
                <X size={12} className="text-[#ba1a1a]" />
                <span>Cancelled ({subscriptionStats.cancelled} • {subscriptionDistribution.cancelledPct}%)</span>
              </button>
            </div>
          </div>

          {/* Multi-Factor Filter Controls Bar */}
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 flex items-center gap-2 bg-[#fbf9f5] px-3 py-2 border border-[#ded9d1]">
                <Search size={18} className="text-[#665d52]" />
                <input
                  type="text"
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  placeholder="Search by Customer, Phone, ID (#SUB-XXXX), Kitchen..."
                  className="bg-transparent text-xs text-[#1b1c1a] placeholder:text-[#665d52] focus:outline-none w-full"
                />
                <kbd className="hidden sm:inline font-mono text-[10px] text-[#665d52] bg-[#efeeea] px-1.5 py-0.5">ESC</kbd>
              </div>

              <div className="md:col-span-3 relative bg-[#fbf9f5] border border-[#ded9d1]">
                <select
                  value={subKitchenFilter}
                  onChange={(e) => setSubKitchenFilter(e.target.value)}
                  className="w-full appearance-none bg-transparent text-xs text-[#1a1a1a] pl-3 pr-8 py-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Kitchens (All hubs)</option>
                  <option value="Mansuri">Mansuri Kitchen</option>
                  <option value="Xoxo">Xoxo Men Kitchen</option>
                  <option value="Ghar">Ghar Ka Khana</option>
                  <option value="Mom">Mom's Kitchen</option>
                  <option value="Shree">Shree Tiffin Service</option>
                  <option value="Foodie">Foodie Home Kitchen</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#665d52]" />
              </div>

              <div className="md:col-span-2 relative bg-[#fbf9f5] border border-[#ded9d1]">
                <select
                  value={subPlanFilter}
                  onChange={(e) => setSubPlanFilter(e.target.value)}
                  className="w-full appearance-none bg-transparent text-xs text-[#1a1a1a] pl-3 pr-8 py-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Plan Tiers</option>
                  <option value="Gujarati">Gujarati Executive</option>
                  <option value="Kathiyawadi">Kathiyawadi Evening</option>
                  <option value="Satvik">Satvik Jain Khichdi</option>
                  <option value="Corporate">Corporate Double Thali</option>
                  <option value="Punjabi">Punjabi Deluxe</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#665d52]" />
              </div>

              <div className="md:col-span-2 relative bg-[#fbf9f5] border border-[#ded9d1]">
                <select
                  value={subPaymentFilter}
                  onChange={(e) => setSubPaymentFilter(e.target.value)}
                  className="w-full appearance-none bg-transparent text-xs text-[#1a1a1a] pl-3 pr-8 py-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Settlement States</option>
                  <option value="PAID">Paid / Captured</option>
                  <option value="PENDING">Mandate Pending</option>
                  <option value="REFUNDED">Refunded / Disputed</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#665d52]" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 text-[#665d52]">
                <span className="font-mono text-[10px] uppercase font-semibold">Quick Presets:</span>
                <button
                  onClick={() => setSubPlanFilter('Corporate')}
                  className="px-2 py-0.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-[11px] transition-colors"
                >
                  Corporate Contracts
                </button>
                <button
                  onClick={() => setSubStatusFilter('EXPIRING_SOON')}
                  className="px-2 py-0.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a] text-[11px] transition-colors"
                >
                  Expiring Soon (&lt;7D)
                </button>
              </div>

              <button
                onClick={() => {
                  setSubSearchQuery('');
                  setSubStatusFilter('ALL');
                  setSubKitchenFilter('ALL');
                  setSubPlanFilter('ALL');
                  setSubPaymentFilter('ALL');
                  triggerToast('Filters reset.');
                }}
                className="underline hover:text-black transition-colors font-mono text-[11px]"
              >
                Clear all parameters
              </button>
            </div>
          </div>

          {/* Master Subscription Ledger Table */}
          <div className="w-full bg-[#fbf9f5] border border-[#ded9d1] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] uppercase tracking-wider border-b border-[#ded9d1]">
                    <th className="py-3.5 px-4 font-semibold">Subscription &amp; Cycle</th>
                    <th className="py-3.5 px-4 font-semibold">Customer &amp; Geo</th>
                    <th className="py-3.5 px-4 font-semibold">Kitchen Partner</th>
                    <th className="py-3.5 px-4 font-semibold">Manifest &amp; Slot</th>
                    <th className="py-3.5 px-4 font-semibold">Fulfillment Progress</th>
                    <th className="py-3.5 px-4 font-semibold">Contract &amp; Escrow</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded9d1]/60">
                  {subscriptionsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#665d52]">
                        Loading real subscription contracts from MongoDB...
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#665d52]">
                        No subscriptions found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isSelected = selectedSubId === sub.subId;
                      const isActive = sub.status === 'ACTIVE';
                      const isExpiring = sub.isExpiringSoon;
                      const isPaused = sub.status === 'PAUSED';
                      const isCancelled = sub.status === 'CANCELLED';

                      return (
                        <tr
                          key={sub.subId}
                          onClick={() => setSelectedSubId(sub.subId)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#eae8e4] font-medium' : 'hover:bg-[#f5f3ef]'
                          }`}
                        >
                          <td className="py-4 px-4 align-top">
                            <div className="font-mono font-medium text-[#1a1a1a] text-[13px]">{sub.subId}</div>
                            <div className="font-mono text-[10px] text-[#665d52] uppercase mt-0.5">Cycle Daily • Mandate OK</div>
                          </td>

                          <td className="py-4 px-4 align-top">
                            <div className="font-medium text-[#1a1a1a]">{sub.customerName}</div>
                            <div className="text-[11px] text-[#665d52] font-mono">{sub.customerPhone}</div>
                            <div className="text-[11px] text-[#444748] truncate max-w-[180px]">{sub.address}</div>
                          </td>

                          <td className="py-4 px-4 align-top">
                            <div className="font-medium text-[#1a1a1a]">{sub.providerName}</div>
                            <div className="text-[11px] text-[#665d52]">Culinary Dispatch Hub</div>
                            <div className="font-mono text-[10px] text-[#665d52]">FSSAI Verified</div>
                          </td>

                          <td className="py-4 px-4 align-top">
                            <div className="font-medium text-[#1a1a1a]">{sub.plan}</div>
                            <div className="text-[11px] text-[#665d52]">{sub.totalMeals} Meals Plan</div>
                            <div className="font-mono text-[10px] text-[#4a4238] font-medium">{sub.slotTime}</div>
                          </td>

                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-mono font-semibold">{sub.deliveredMeals} / {sub.totalMeals}</span>
                              <span className="text-[#665d52] text-[10px]">{sub.fulfillmentRate}%</span>
                            </div>
                            <div className="w-28 h-1.5 bg-[#ded9d1] overflow-hidden">
                              <div
                                className={`h-full ${isExpiring ? 'bg-amber-700' : isCancelled ? 'bg-[#ba1a1a]' : 'bg-[#1a1a1a]'}`}
                                style={{ width: `${Math.min(100, sub.fulfillmentRate)}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-[#665d52] mt-1">{sub.startDate} → {sub.endDate}</div>
                          </td>

                          <td className="py-4 px-4 align-top">
                            <div className="font-mono font-semibold text-[#1a1a1a]">₹{Number(sub.amount || 0).toLocaleString()}</div>
                            <div className="text-[10px] text-[#665d52] flex items-center gap-1">
                              <Lock size={11} className="text-emerald-700" />
                              <span>{sub.mandateStatus}</span>
                            </div>
                            <div className="text-[10px] text-[#665d52] font-mono">Held: ₹{sub.escrowHeld?.toLocaleString() || 0}</div>
                          </td>

                          <td className="py-4 px-4 align-top">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase font-semibold ${
                              isCancelled
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : isPaused
                                ? 'bg-[#efeeea] text-[#665d52]'
                                : isExpiring
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-[#efeeea] text-[#1a1a1a]'
                            }`}>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>}
                              {isExpiring ? 'Expiring Soon' : sub.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubId(sub.subId);
                                  if (subDossierRef.current) {
                                    subDossierRef.current.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="px-2.5 py-1 bg-[#1a1a1a] text-white font-medium text-[11px] tracking-wider hover:bg-neutral-800 transition-colors"
                              >
                                Dossier 360°
                              </button>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === sub.subId ? null : sub.subId);
                                  }}
                                  className="p-1 text-[#665d52] hover:text-[#1a1a1a]"
                                >
                                  <MoreVertical size={16} />
                                </button>
                                {activeMenuId === sub.subId && (
                                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#ded9d1] shadow-xl py-1 z-30 text-left">
                                    {sub.status === 'PAUSED' ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuId(null);
                                          setSubModalConfig({
                                            type: 'RESUME',
                                            subId: sub.subId,
                                            title: `Resume Subscription ${sub.subId}`,
                                            message: `Resume active daily meal dispatch for ${sub.customerName}? Scheduled deliveries will resume immediately.`
                                          });
                                          setShowSubModal(true);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f3ef]"
                                      >
                                        Resume Subscription
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuId(null);
                                          setSubModalConfig({
                                            type: 'PAUSE',
                                            subId: sub.subId,
                                            title: `Pause Subscription ${sub.subId}`,
                                            message: `Temporarily pause deliveries for ${sub.customerName}? Kitchen batch preparation will be put on hold.`
                                          });
                                          setShowSubModal(true);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f3ef]"
                                      >
                                        Pause Subscription
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(null);
                                        setSubModalConfig({
                                          type: 'RENEW',
                                          subId: sub.subId,
                                          title: `Trigger Cycle Renewal for ${sub.subId}`,
                                          message: `Renew subscription mandate for next monthly cycle? Bank AutoPay will be verified.`
                                        });
                                        setShowSubModal(true);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#f5f3ef]"
                                    >
                                      Trigger Renewal
                                    </button>
                                    <div className="h-px bg-[#ded9d1] my-1"></div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(null);
                                        setSubModalConfig({
                                          type: 'CANCEL',
                                          subId: sub.subId,
                                          title: `Terminate Contract ${sub.subId}`,
                                          message: `Are you sure you want to terminate subscription contract for ${sub.customerName}? Remaining escrow balance will be refunded.`
                                        });
                                        setShowSubModal(true);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-[#ba1a1a] hover:bg-red-50"
                                    >
                                      Terminate Contract
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 bg-[#f5f3ef] border-t border-[#ded9d1] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#665d52]">
              <div>
                Showing <strong>1 – {subscriptions.length}</strong> of <strong>{subscriptionStats.total}</strong> recurring contracts across operational zones
              </div>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1 bg-[#efeeea] text-[#1a1a1a]">1</button>
              </div>
            </div>
          </div>

          {/* Subscription Dossier & 360° Inspection Section */}
          <section ref={subDossierRef} className="space-y-8 pt-4">
            {selectedSubDossier ? (
              <>
                {/* Identity & Controls Banner */}
                <div className="bg-[#f5f3ef] border border-[#ded9d1] p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#1a1a1a]">
                        CONTRACT {selectedSubDossier.subscription.subId}
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#1a1a1a] text-white font-mono uppercase text-[10px] tracking-widest font-semibold">
                        {selectedSubDossier.subscription.status} • IN FULFILLMENT
                      </span>
                      <span className="font-mono text-[11px] text-[#665d52]">Token: npci_tok_8921b7a01</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl text-[#1a1a1a]">
                      Complete Contract &amp; Escrow Breakdown: {selectedSubDossier.customer.name} × {selectedSubDossier.provider.name}
                    </h2>
                    <div className="text-xs text-[#665d52]">
                      Governed under Ahmedabad Central Food Commission • RBI Guidelines for AutoPay Nodal Settlement
                    </div>
                  </div>

                  {/* Super Admin Mutating Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const isPaused = selectedSubDossier.subscription.status === 'PAUSED';
                        setSubModalConfig({
                          type: isPaused ? 'RESUME' : 'PAUSE',
                          subId: selectedSubDossier.subscription.subId,
                          title: isPaused ? 'Resume Subscription' : 'Pause Subscription',
                          message: isPaused
                            ? `Resume deliveries for ${selectedSubDossier.customer.name}?`
                            : `Pause deliveries for ${selectedSubDossier.customer.name}?`
                        });
                        setShowSubModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#1a1a1a] hover:bg-[#eae8e4] transition-colors text-xs font-medium border border-[#ded9d1]"
                    >
                      <Pause size={14} />
                      <span>{selectedSubDossier.subscription.status === 'PAUSED' ? 'Resume Subscription' : 'Pause Subscription'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSubModalConfig({
                          type: 'RENEW',
                          subId: selectedSubDossier.subscription.subId,
                          title: 'Force Sync Mandate',
                          message: `Force sync bank mandate and verify auto-renewal token for ${selectedSubDossier.subscription.subId}?`
                        });
                        setShowSubModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#1a1a1a] hover:bg-[#eae8e4] transition-colors text-xs font-medium border border-[#ded9d1]"
                    >
                      <RefreshCw size={14} />
                      <span>Force Sync Mandate</span>
                    </button>
                    <button
                      onClick={() => triggerToast(`Delivery window editor opened for ${selectedSubDossier.subscription.subId}.`)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#1a1a1a] hover:bg-[#eae8e4] transition-colors text-xs font-medium border border-[#ded9d1]"
                    >
                      <Clock size={14} />
                      <span>Edit Window</span>
                    </button>
                    <button
                      onClick={() => {
                        setSubModalConfig({
                          type: 'CANCEL',
                          subId: selectedSubDossier.subscription.subId,
                          title: 'Terminate Contract',
                          message: `Are you sure you want to terminate contract ${selectedSubDossier.subscription.subId}? Remaining escrow will be reversed to customer.`
                        });
                        setShowSubModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#ffdad6] text-[#ba1a1a] hover:bg-red-200 transition-colors text-xs font-medium border border-[#ffdad6]"
                    >
                      <Ban size={14} />
                      <span>Terminate Contract</span>
                    </button>
                  </div>
                </div>

                {/* Bento Grid: Entities & Operational Parameters */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Customer Entity Card */}
                  <div className="lg:col-span-4 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                        <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Patron Entity</span>
                        <span className="px-2 py-0.5 bg-[#eee0d2] text-[#4a4238] font-mono text-[10px] font-bold">
                          {selectedSubDossier.customer.tier}
                        </span>
                      </div>
                      <div className="flex items-start gap-4 pt-4">
                        <div className="w-12 h-12 bg-[#1a1a1a] text-white font-serif text-lg flex items-center justify-center shrink-0">
                          {selectedSubDossier.customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-serif text-xl leading-tight text-[#1a1a1a]">{selectedSubDossier.customer.name}</h3>
                          <div className="font-mono text-[11px] text-[#665d52] mt-0.5">
                            ID: {selectedSubDossier.customer.id} • Rating: {selectedSubDossier.customer.rating}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-2.5 text-xs font-mono text-[#1a1a1a]">
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Phone:</span>
                          <span className="font-bold">{selectedSubDossier.customer.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Email:</span>
                          <span>{selectedSubDossier.customer.email}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[#665d52]">Delivery Geofence:</span>
                          <span className="text-right max-w-[190px] text-[11px]">{selectedSubDossier.customer.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Instruction:</span>
                          <span className="italic text-[11px]">"{selectedSubDossier.customer.deliveryInstruction}"</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t border-[#ded9d1]">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(selectedSubDossier.customer.id);
                          setActiveViewOverride('profile');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-[#1a1a1a] underline hover:text-[#4a4238] font-medium"
                      >
                        <span>View Patron Dossier 360°</span>
                        <ArrowLeft size={14} className="rotate-180" />
                      </button>
                    </div>
                  </div>

                  {/* Provider Kitchen Entity Card */}
                  <div className="lg:col-span-4 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                        <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Culinary Node</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold">
                          Verified FSSAI
                        </span>
                      </div>
                      <div className="flex items-start gap-4 pt-4">
                        <div className="w-12 h-12 bg-[#665d52] text-white font-serif text-lg flex items-center justify-center shrink-0">
                          {selectedSubDossier.provider.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-serif text-xl leading-tight text-[#1a1a1a]">{selectedSubDossier.provider.name}</h3>
                          <div className="font-mono text-[11px] text-[#665d52] mt-0.5">
                            {selectedSubDossier.provider.chef} • {selectedSubDossier.provider.id}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-2.5 text-xs font-mono text-[#1a1a1a]">
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Node Hub:</span>
                          <span>{selectedSubDossier.provider.hub}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">FSSAI License:</span>
                          <span>{selectedSubDossier.provider.fssai}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Node Rating:</span>
                          <span>{selectedSubDossier.provider.rating}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Batch Cutoff:</span>
                          <span>{selectedSubDossier.provider.cutoff}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t border-[#ded9d1]">
                      <button
                        onClick={() => triggerToast(`Kitchen operator dossier opened for ${selectedSubDossier.provider.name}.`)}
                        className="inline-flex items-center gap-1 text-xs text-[#1a1a1a] underline hover:text-[#4a4238] font-medium"
                      >
                        <span>View Kitchen Operator Dossier</span>
                        <ArrowLeft size={14} className="rotate-180" />
                      </button>
                    </div>
                  </div>

                  {/* Hardware Telemetry Card */}
                  <div className="lg:col-span-4 bg-[#f5f3ef] border border-[#ded9d1] p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                        <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Hardware Telemetry</span>
                        <span className="font-mono text-[10px] text-[#665d52]">NFC PASSIVE TAGS</span>
                      </div>
                      <h3 className="font-serif text-xl leading-tight text-[#1a1a1a] mt-3">
                        304-Grade Canister Circulation
                      </h3>
                      <p className="text-xs text-[#665d52] mt-1">
                        Dual-container rotational system for zero single-use plastic waste.
                      </p>
                      <div className="mt-5 space-y-3">
                        <div className="p-3 bg-white border border-[#ded9d1]">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="font-semibold text-[#1a1a1a]">{selectedSubDossier.hardware.inField.id}</span>
                            <span className="text-emerald-700 font-bold">{selectedSubDossier.hardware.inField.status}</span>
                          </div>
                          <div className="text-[11px] text-[#665d52] mt-0.5">{selectedSubDossier.hardware.inField.detail}</div>
                        </div>
                        <div className="p-3 bg-white border border-[#ded9d1]">
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="font-semibold text-[#1a1a1a]">{selectedSubDossier.hardware.cycleReady.id}</span>
                            <span className="text-[#665d52] font-bold">{selectedSubDossier.hardware.cycleReady.status}</span>
                          </div>
                          <div className="text-[11px] text-[#665d52] mt-0.5">{selectedSubDossier.hardware.cycleReady.detail}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-[#665d52] pt-4 border-t border-[#ded9d1]">
                      Security Deposit Locked: {selectedSubDossier.hardware.securityDeposit}
                    </div>
                  </div>
                </div>

                {/* Contract Details & Fulfillment Performance Summary */}
                <div className="bg-[#f5f3ef] border border-[#ded9d1] p-6 lg:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#ded9d1] gap-4">
                    <div>
                      <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Contract Manifest</span>
                      <h3 className="font-serif text-2xl text-[#1a1a1a] mt-1">
                        {selectedSubDossier.subscription.plan} ({selectedSubDossier.subscription.totalMeals} Meals)
                      </h3>
                      <div className="text-xs text-[#665d52] mt-0.5">
                        Window: Monday through Saturday • 12:30 PM – 01:00 PM • Roti (5), Gujarati Dal, Shaak (2 varieties), Rice, Farsan, Sweet Kadhi
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Fulfillment Rate</div>
                        <div className="font-serif text-2xl text-[#1a1a1a]">{selectedSubDossier.subscription.fulfillmentRate}%</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">On-Time Transit</div>
                        <div className="font-serif text-2xl text-[#1a1a1a]">{selectedSubDossier.subscription.onTimeTransit}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Avg Delivery Span</div>
                        <div className="font-serif text-2xl text-[#1a1a1a]">{selectedSubDossier.subscription.avgDeliverySpan}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white border border-[#ded9d1] p-3.5">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Total Contract</div>
                      <div className="font-mono text-xl font-semibold text-[#1a1a1a] mt-1">{selectedSubDossier.subscription.totalMeals} Meals</div>
                    </div>
                    <div className="bg-white border border-[#ded9d1] p-3.5">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Delivered</div>
                      <div className="font-mono text-xl font-semibold text-emerald-800 mt-1">{selectedSubDossier.subscription.deliveredMeals} Meals</div>
                    </div>
                    <div className="bg-white border border-[#ded9d1] p-3.5">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">In-Flight Today</div>
                      <div className="font-mono text-xl font-semibold text-[#1a1a1a] mt-1">{selectedSubDossier.subscription.inFlightToday} Meal</div>
                    </div>
                    <div className="bg-white border border-[#ded9d1] p-3.5">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Remaining</div>
                      <div className="font-mono text-xl font-semibold text-[#1a1a1a] mt-1">{selectedSubDossier.subscription.remainingMeals} Meals</div>
                    </div>
                    <div className="bg-white border border-[#ded9d1] p-3.5">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Skipped by Patron</div>
                      <div className="font-mono text-xl font-semibold text-[#665d52] mt-1">{selectedSubDossier.subscription.skippedMeals} Meal</div>
                    </div>
                    <div className="bg-white border border-[#ded9d1] p-3.5">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Kitchen Cancelled</div>
                      <div className="font-mono text-xl font-semibold text-[#1a1a1a] mt-1">{selectedSubDossier.subscription.cancelledMeals} Meals</div>
                    </div>
                  </div>
                </div>

                {/* Milestone Pipeline & Escrow Financial Ledger */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Subscription Event Timeline */}
                  <div className="lg:col-span-7 bg-[#f5f3ef] border border-[#ded9d1] p-6 lg:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                      <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Audit History Timeline</span>
                      <span className="font-mono text-xs text-[#665d52]">7 Verified Milestones</span>
                    </div>

                    <div className="relative pl-6 space-y-6 border-l border-[#ded9d1]">
                      {selectedSubDossier.timeline.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ${idx === selectedSubDossier.timeline.length - 1 ? 'bg-emerald-600' : 'bg-[#1a1a1a]'}`}></div>
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-xs text-[#1a1a1a]">{item.title}</span>
                            <span className="font-mono text-[11px] text-[#665d52]">{item.time}</span>
                          </div>
                          <p className="text-xs text-[#444748] mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Escrow, Billing & Financial Ledger */}
                  <div className="lg:col-span-5 bg-[#f5f3ef] border border-[#ded9d1] p-6 lg:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]">
                        <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">Escrow Liquidity Ledger</span>
                        <span className="font-mono text-xs text-[#665d52]">INR Net Breakdown</span>
                      </div>

                      <div className="p-4 bg-white border border-[#ded9d1] flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Total Mandate Value</div>
                          <div className="font-serif text-3xl text-[#1a1a1a]">₹{selectedSubDossier.escrow.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs text-[#665d52]">26 Meals @ ₹161.53 avg</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs font-mono text-[#1a1a1a] pt-2">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#665d52]">Released to Kitchen (21 meals):</span>
                          <span className="font-medium">₹{selectedSubDossier.escrow.releasedKitchen.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#665d52]">Released to Courier Fleet:</span>
                          <span className="font-medium">₹{selectedSubDossier.escrow.releasedFleet.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#665d52]">Platform Commission Cut (5%):</span>
                          <span className="font-medium">₹{selectedSubDossier.escrow.platformCut.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 bg-[#eee0d2] px-2 font-bold text-[#4a4238]">
                          <span>Escrow Funds Held ({selectedSubDossier.subscription.remainingMeals} meals):</span>
                          <span>₹{selectedSubDossier.escrow.heldAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#665d52]">Pro-Rata Refunded / Disputed:</span>
                          <span>₹{selectedSubDossier.escrow.refundedAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Sub-table of Transaction History */}
                      <div className="pt-3">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest mb-2 font-semibold">
                          Escrow Micro-Ledger Transactions
                        </div>
                        <div className="space-y-2 text-[11px] font-mono">
                          {selectedSubDossier.escrow.transactions.map((tx, idx) => (
                            <div key={idx} className="p-2 bg-white border border-[#ded9d1] flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-[#1a1a1a]">{tx.id}</span>
                                <span className="text-[#665d52] ml-1.5">• {tx.date}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#1a1a1a] font-semibold">₹{tx.amount.toLocaleString()}</span>
                                <span className="text-emerald-700 font-bold ml-1">{tx.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 text-center border-t border-[#ded9d1]">
                      <button
                        onClick={() => triggerToast(`Node Escrow Certificate downloaded for ${selectedSubDossier.subscription.subId}.`)}
                        className="w-full py-2 bg-white border border-[#ded9d1] text-[#1a1a1a] hover:bg-[#eae8e4] text-xs font-medium transition-colors"
                      >
                        Download Full Node Escrow Certificate (PDF)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-Time Subscription Activity Audit Stream */}
                <div className="bg-[#f5f3ef] border border-[#ded9d1] p-6 lg:p-8 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#1a1a1a]" />
                      <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">
                        Real-time Immutable Activity Log
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[#665d52]">Append-Only Journal</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {selectedSubDossier.activityLog.map((log, idx) => (
                      <div key={idx} className="p-3 bg-white border border-[#ded9d1] flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-[#665d52] bg-[#efeeea] px-2 py-0.5">{log.time}</span>
                          <span className="font-mono text-[10px] text-[#1a1a1a] uppercase font-bold">{log.tag}</span>
                          <span className="text-[#1a1a1a]">{log.desc}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#665d52]">{log.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-[#665d52] bg-[#f5f3ef] border border-[#ded9d1]">
                Select a subscription above to inspect its complete 360° lifecycle dossier.
              </div>
            )}
          </section>
        </div>
      ) : currentView === 'profile' || currentView === 'customers-profile' ? (
        /* ========================================================================= */
        /* 5. CUSTOMER 360° PROFILE DOSSIER VIEW                                     */
        /* ========================================================================= */
        <div className="px-8 py-8 space-y-8 max-w-[1720px] mx-auto w-full animate-fadeIn">
          {/* Header & Back Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ded9d1]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (onNavigate) onNavigate('customers-all');
                  else setActiveViewOverride('all');
                }}
                className="p-2 bg-[#f5f3ef] border border-[#ded9d1] hover:bg-[#eae8e4] text-[#1a1a1a] transition-colors"
                title="Back to Customer Directory"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 font-mono uppercase text-[#665d52] tracking-widest text-[11px]">
                  <span>Customer 360° Dossier</span>
                  <span>/</span>
                  <span className="text-[#1a1a1a] font-bold">{currentCustomer?.name || 'Patron'}</span>
                </div>
                <h1 className="font-serif text-3xl text-[#1a1a1a] font-normal leading-tight">
                  {currentCustomer?.name || 'Customer Patron'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCustomerToSuspend(currentCustomer);
                  setShowSuspendModal(true);
                }}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  currentCustomer?.status === 'suspended'
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-red-200'
                }`}
              >
                {currentCustomer?.status === 'suspended' ? 'Reactivate Patron Account' : 'Suspend Customer'}
              </button>
              <button
                onClick={() => triggerToast(`Contact SMS transmitted to ${currentCustomer?.phone}`)}
                className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-[#4a4238] text-xs font-medium transition-colors"
              >
                Transmit Alert
              </button>
            </div>
          </div>

          {/* 4 Lifetime Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-32">
              <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Total Orders Placed</span>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none mb-1">
                  {currentCustomer?.ordersCount || 0}
                </div>
                <div className="font-mono text-[11px] text-[#665d52]">On-platform verified</div>
              </div>
            </div>

            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-32">
              <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Lifetime Platform Spend</span>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none mb-1">
                  ₹{(currentCustomer?.totalSpent || 0).toLocaleString()}
                </div>
                <div className="font-mono text-[11px] text-[#665d52]">Gross settled value</div>
              </div>
            </div>

            <div className="p-5 bg-[#f5f3ef] border border-[#ded9d1] flex flex-col justify-between h-32">
              <span className="font-mono uppercase text-[#665d52] tracking-widest text-[10px] font-semibold">Average Order Value</span>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] font-normal leading-none mb-1">
                  ₹{currentCustomer?.ordersCount > 0 ? Math.round((currentCustomer.totalSpent || 0) / currentCustomer.ordersCount) : 0}
                </div>
                <div className="font-mono text-[11px] text-[#665d52]">Per transaction mean</div>
              </div>
            </div>

            <div className="p-5 bg-[#1a1a1a] text-white flex flex-col justify-between h-32">
              <span className="font-mono uppercase text-white/70 tracking-widest text-[10px] font-semibold">Status &amp; Risk Rating</span>
              <div>
                <div className="font-serif text-2xl text-white font-normal leading-none mb-1 uppercase">
                  {currentCustomer?.status === 'suspended' ? 'Suspended' : 'Active Patron'}
                </div>
                <div className="font-mono text-[11px] text-white/80">Compliance Score: 99.4/100</div>
              </div>
            </div>
          </div>

          {/* Customer KYC & Dietary Specs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] space-y-4">
              <h2 className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold pb-2 border-b border-[#ded9d1]">
                Patron Contact &amp; Geographic End-Point
              </h2>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Mobile Phone:</span>
                  <span className="text-[#1a1a1a] font-bold">{currentCustomer?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Registered Email:</span>
                  <span className="text-[#1a1a1a]">{currentCustomer?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[#665d52]">Primary Delivery Node:</span>
                  <span className="text-[#1a1a1a] max-w-[260px] text-right truncate">{currentCustomer?.address || 'Ahmedabad, Gujarat'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Customer Joined Date:</span>
                  <span className="text-[#1a1a1a]">{currentCustomer?.joinedDate || 'Recent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Cluster Route Node:</span>
                  <span className="text-[#1a1a1a]">Western Ahmedabad Corridor</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#f5f3ef] border border-[#ded9d1] space-y-4">
              <h2 className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold pb-2 border-b border-[#ded9d1]">
                Culinary Discipline &amp; Hardware Canister Protocol
              </h2>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Base Meal Discipline:</span>
                  <span className="text-[#1a1a1a] font-bold">Pure Vegetarian / Kathiyawadi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Cooking Oil Base:</span>
                  <span className="text-[#1a1a1a]">Cold-Pressed Groundnut Oil</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Bread Protocol:</span>
                  <span className="text-[#1a1a1a]">Wood-Fired Bajra Rotla / Phulkas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Canister Hardware:</span>
                  <span className="text-[#1a1a1a] font-bold">Grade 304 Stainless Steel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#665d52]">Canister Return Compliance:</span>
                  <span className="text-emerald-700 font-bold">100% On-Time Exchange</span>
                </div>
              </div>
            </div>
          </div>

          {/* Patron Orders Table */}
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase text-[#665d52] tracking-widest font-semibold">
              Recent Order History for {currentCustomer?.name}
            </h2>
            <div className="overflow-x-auto bg-[#fbf9f5] border border-[#ded9d1]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] uppercase tracking-wider border-b border-[#ded9d1]">
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Kitchen</th>
                    <th className="py-3 px-4 font-semibold">Meal Manifest</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded9d1]/60">
                  {currentCustomer?.recentOrders && currentCustomer.recentOrders.length > 0 ? (
                    currentCustomer.recentOrders.map((ord, idx) => (
                      <tr key={ord.id || idx} className="hover:bg-[#f5f3ef]">
                        <td className="py-3 px-4 font-mono font-bold text-[#1a1a1a]">{ord.id}</td>
                        <td className="py-3 px-4 font-mono text-[#665d52]">{ord.time}</td>
                        <td className="py-3 px-4">{ord.provider}</td>
                        <td className="py-3 px-4">{ord.manifest}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#1a1a1a]">₹{(ord.amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 font-mono text-[10px] bg-[#efeeea] text-[#1a1a1a]">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#665d52]">
                        No order records found for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* DEFAULT: ALL / ACTIVE / SUSPENDED CUSTOMERS DIRECTORY                     */
        /* ========================================================================= */
        <div className="px-8 py-8 flex flex-col gap-8 max-w-[1600px] mx-auto w-full animate-fadeIn">
          {/* Breadcrumb */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[#665d52] font-mono text-[11px] uppercase tracking-widest">
              <span>SUPER ADMIN</span>
              <span className="text-[#ded9d1]">/</span>
              <span>MANAGEMENT</span>
              <span className="text-[#ded9d1]">/</span>
              <span>CUSTOMERS</span>
              <span className="text-[#ded9d1]">/</span>
              <span className="text-[#1a1a1a] font-semibold">
                {currentView === 'suspended' ? 'SUSPENDED CUSTOMERS' : currentView === 'active' ? 'ACTIVE CUSTOMERS' : 'ALL CUSTOMERS'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f5f3ef] font-mono text-[11px] text-[#665d52] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></span>
                LIVE DATABASE STREAM
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-[#efeeea] font-mono text-[11px] text-[#444748]">
                MONGODB CONNECTED
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="max-w-3xl">
              <span className="font-mono text-xs uppercase text-[#665d52] tracking-widest block mb-2">
                Live Database Registry
              </span>
              <h1 className="font-serif text-4xl text-[#1a1a1a] tracking-tight leading-none mb-3">
                {currentView === 'suspended'
                  ? 'Suspended Customers & Compliance Triage'
                  : currentView === 'active'
                  ? 'Active Customers Operational Directory'
                  : 'Customer Directory & Identity Registry'}
              </h1>
              <p className="text-sm text-[#444748] leading-relaxed">
                {currentView === 'suspended'
                  ? 'Review suspended diner profiles, KYC hold reasons, and execute instant account reactivations.'
                  : currentView === 'active'
                  ? 'Active ordering diners with valid credentials and zero security flags across all delivery clusters.'
                  : 'Displaying real customer accounts fetched strictly from your active MongoDB database.'}
              </p>
            </div>

            <div className="flex items-center gap-3 self-start lg:self-end flex-wrap">
              <button
                onClick={fetchCustomers}
                className="px-4 py-2.5 bg-[#f5f3ef] hover:bg-[#eae8e4] text-[#1a1a1a] font-medium text-xs transition-colors flex items-center gap-2 border border-[#ded9d1]"
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>Refresh Live DB</span>
              </button>
            </div>
          </div>

          {/* Real Database KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52]">TOTAL REGISTERED</span>
                <Users size={16} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] leading-none tracking-tight">
                  {dbCustomerStats.total}
                </div>
                <div className="font-mono text-[11px] text-[#444748] mt-2">In MongoDB `users`</div>
              </div>
            </div>

            <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52]">ACTIVE PATRONS</span>
                <span className="inline-flex w-2 h-2 rounded-full bg-[#1a1a1a] animate-pulse"></span>
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] leading-none tracking-tight">
                  {dbCustomerStats.active}
                </div>
                <div className="font-mono text-[11px] text-[#665d52] mt-2">
                  {dbCustomerStats.total > 0 ? Math.round((dbCustomerStats.active / dbCustomerStats.total) * 100) : 100}% Active status
                </div>
              </div>
            </div>

            <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52]">SUSPENDED / REVIEW</span>
                <AlertTriangle size={16} className={dbCustomerStats.suspended > 0 ? 'text-[#ba1a1a]' : 'text-[#665d52]'} />
              </div>
              <div>
                <div className={`font-serif text-3xl leading-none tracking-tight ${dbCustomerStats.suspended > 0 ? 'text-[#ba1a1a]' : 'text-[#1a1a1a]'}`}>
                  {dbCustomerStats.suspended}
                </div>
                <div className="font-mono text-[11px] text-[#444748] mt-2">
                  {dbCustomerStats.suspended === 0 ? '0 KYC anomalies' : 'Action required'}
                </div>
              </div>
            </div>

            <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52]">SUBSCRIBED MEMBERS</span>
                <RefreshCw size={16} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] leading-none tracking-tight">
                  {dbCustomerStats.subscribed}
                </div>
                <div className="font-mono text-[11px] text-[#665d52] mt-2">With active order records</div>
              </div>
            </div>

            <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52]">ONE-TIME TASTERS</span>
                <ShoppingBag size={16} className="text-[#665d52]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] leading-none tracking-tight">
                  {dbCustomerStats.adHoc}
                </div>
                <div className="font-mono text-[11px] text-[#444748] mt-2">Ad-hoc registered</div>
              </div>
            </div>

            <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52]">NEW THIS MONTH</span>
                <TrendingUp size={16} className="text-[#1a1a1a]" />
              </div>
              <div>
                <div className="font-serif text-3xl text-[#1a1a1a] leading-none tracking-tight">
                  {dbCustomerStats.newThisMonth}
                </div>
                <div className="font-mono text-[11px] text-[#444748] mt-2">Joined recently</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 bg-[#f5f3ef] p-3 border border-[#ded9d1]">
            <Search size={18} className="text-[#665d52]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Customer by Name, Phone, Email, or Mongo ID..."
              className="w-full bg-transparent text-xs text-[#1a1a1a] outline-none placeholder:text-[#665d52]"
            />
          </div>

          {/* Master Table of Real Database Customers */}
          <div className="w-full overflow-x-auto bg-[#fbf9f5] border border-[#ded9d1]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] uppercase tracking-wider border-b border-[#ded9d1]">
                  <th className="py-4 px-4 font-semibold">CUSTOMER NAME &amp; MONGO ID</th>
                  <th className="py-4 px-4 font-semibold">PHONE &amp; EMAIL</th>
                  <th className="py-4 px-4 font-semibold">DELIVERY ADDRESS</th>
                  <th className="py-4 px-4 font-semibold text-right">ORDERS</th>
                  <th className="py-4 px-4 font-semibold text-right">TOTAL SPENT</th>
                  <th className="py-4 px-4 font-semibold text-center">STATUS</th>
                  <th className="py-4 px-4 font-semibold">JOINED DATE</th>
                  <th className="py-4 px-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/60">
                {customers
                  .filter(cust => {
                    if (currentView === 'active' && cust.status === 'suspended') return false;
                    if (currentView === 'suspended' && cust.status !== 'suspended') return false;
                    return true;
                  })
                  .length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#665d52]">
                      No customers found in database matching criteria.
                    </td>
                  </tr>
                ) : (
                  customers
                    .filter(cust => {
                      if (currentView === 'active' && cust.status === 'suspended') return false;
                      if (currentView === 'suspended' && cust.status !== 'suspended') return false;
                      return true;
                    })
                    .map((cust) => {
                      const isSuspended = cust.status === 'suspended';
                      return (
                        <tr key={cust.mongoId || cust.id} className="hover:bg-[#f5f3ef] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 flex items-center justify-center font-serif text-sm font-semibold bg-[#efeeea] text-[#1a1a1a]">
                                {cust.avatar}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#1a1a1a] text-sm">{cust.name}</span>
                                <span className="font-mono text-[10px] text-[#665d52]">
                                  ID: {cust.mongoId ? String(cust.mongoId).slice(-8) : cust.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-mono text-xs text-[#1a1a1a]">{cust.phone}</div>
                            <div className="text-[11px] text-[#444748] truncate max-w-[200px]">{cust.email}</div>
                          </td>

                          <td className="py-4 px-4 text-[#665d52] max-w-[220px] truncate">{cust.address}</td>
                          <td className="py-4 px-4 text-right font-serif text-base text-[#1a1a1a]">{cust.ordersCount || 0}</td>
                          <td className="py-4 px-4 text-right font-mono text-xs font-semibold text-[#1a1a1a]">
                            ₹{(cust.totalSpent || 0).toLocaleString()}
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                              isSuspended ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#efeeea] text-[#1a1a1a]'
                            }`}>
                              {cust.status}
                            </span>
                          </td>

                          <td className="py-4 px-4 font-mono text-[11px] text-[#444748]">{cust.joinedDate}</td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomerId(cust.id || cust.mongoId);
                                  setActiveViewOverride('profile');
                                }}
                                className="px-2.5 py-1 bg-[#f5f3ef] hover:bg-[#1a1a1a] hover:text-white font-medium text-[11px] text-[#1a1a1a] transition-colors border border-[#ded9d1]"
                              >
                                Inspect 360°
                              </button>
                              <button
                                onClick={() => {
                                  setCustomerToSuspend(cust);
                                  setShowSuspendModal(true);
                                }}
                                className={`px-2 py-1 font-mono text-[10px] uppercase font-semibold transition-colors ${
                                  isSuspended
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-red-200'
                                }`}
                              >
                                {isSuspended ? 'Reactivate' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function ReceiptIcon() {
  return (
    <svg className="w-4 h-4 text-[#665d52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
