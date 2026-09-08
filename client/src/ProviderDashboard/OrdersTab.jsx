import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronRight, 
  MapPin, 
  Phone, 
  User, 
  Download, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  ChevronLeft,
  ShoppingBag,
  CreditCard,
  ChefHat,
  Truck,
  XCircle,
  FileSpreadsheet,
  RotateCw,
  Check,
  Ban,
  Compass,
  ExternalLink,
  Navigation,
  Receipt,
  FileText
} from 'lucide-react';
import DeliveryManagementTab from './DeliveryManagementTab';
import { apiRequest } from '../services/api';

export default function OrdersTab({ initialStatus = 'All' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Filters State
  const [activeStatusTab, setActiveStatusTab] = useState(initialStatus);
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [tiffinFilter, setTiffinFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [toastMessage, setToastMessage] = useState(null);

  const statusPipeline = ['New', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

  useEffect(() => {
    setActiveStatusTab(initialStatus);
  }, [initialStatus]);

  // Fetch Orders from MongoDB Database on Mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const json = await apiRequest('/orders');
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data.map(o => ({
          ...o,
          id: o._id || o.id
        })));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Status Update Handler (Persisted directly to MongoDB database `tiffinlink.orders`)
  const handleUpdateOrderStatus = async (orderId, newStatus, reason = '') => {
    const targetOrder = orders.find(o => o.id === orderId || o._id === orderId || o.orderId === orderId);
    if (!targetOrder) return;

    const dbId = targetOrder.id || targetOrder._id;

    // Optimistic state update
    setOrders(prev => prev.map(o => (o.id === dbId || o._id === dbId || o.orderId === orderId) ? { 
      ...o, 
      status: newStatus,
      cancellationReason: reason || o.cancellationReason
    } : o));

    if (selectedOrder && (selectedOrder.id === dbId || selectedOrder.orderId === orderId)) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus, cancellationReason: reason || prev.cancellationReason }));
    }

    if (newStatus === 'Preparing') {
      showToast(`✓ Order ${targetOrder.orderId} accepted! Moved to Preparing stage.`);
    } else if (newStatus === 'Cancelled') {
      showToast(`Order ${targetOrder.orderId} rejected.`);
    } else {
      showToast(`✓ Order ${targetOrder.orderId} status updated to ${newStatus}`);
    }

    try {
      await apiRequest(`/orders/${dbId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, cancellationReason: reason })
      });
    } catch (err) {
      console.error('Error updating order status in MongoDB:', err);
    }

    setRejectingOrder(null);
    setRejectReason('');
  };

  // Export Orders CSV
  const handleExportCSV = () => {
    if (orders.length === 0) return;
    
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Address', 'Tiffin', 'Qty', 'Amount', 'Payment Status', 'Status', 'Date'];
    const csvRows = [
      headers.join(','),
      ...filteredOrders.map(o => [
        `"${o.orderId}"`,
        `"${o.customerName}"`,
        `"${o.customerPhone}"`,
        `"${o.customerAddress}"`,
        `"${o.tiffinName}"`,
        o.quantity,
        o.totalAmount,
        `"${o.paymentStatus}"`,
        `"${o.status}"`,
        `"${new Date(o.createdAt).toLocaleDateString()}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TiffinLink_Orders_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showToast('✓ Orders exported to CSV file successfully!');
  };

  // Unique Tiffin Names for Filter
  const uniqueTiffins = Array.from(new Set(orders.map(o => o.tiffinName)));

  // Helper to check if an order has a delivery assignment/partner
  const isDeliveryOrder = (o) => {
    if (!o) return false;
    if (o.status === 'Delivery') return true;
    if (o.deliveryPartnerName && o.deliveryPartnerName.trim() !== '') return true;
    if (o.deliveryStatus && o.deliveryStatus !== 'Unassigned') return true;
    return false;
  };

  // Filtering & Sorting Logic
  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
      (o.tiffinName && o.tiffinName.toLowerCase().includes(q));

    const matchesStatus = activeStatusTab === 'All' 
      ? true 
      : (activeStatusTab === 'Delivery' ? isDeliveryOrder(o) : o.status === activeStatusTab);

    const matchesPayment = paymentFilter === 'All' || o.paymentStatus === paymentFilter;
    const matchesTiffin = tiffinFilter === 'All' || o.tiffinName === tiffinFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesTiffin;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'amountHigh') return b.totalAmount - a.totalAmount;
    if (sortBy === 'amountLow') return a.totalAmount - b.totalAmount;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // New Orders Specific Metrics
  const newOrdersList = orders.filter(o => o.status === 'New');
  const newOrdersCount = newOrdersList.length;
  const newOrdersTotalQty = newOrdersList.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const newOrdersTotalValue = newOrdersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // Overall Metrics
  const totalOrdersCount = orders.length;
  const preparingOrdersCount = orders.filter(o => o.status === 'Preparing').length;
  const readyOrdersCount = orders.filter(o => o.status === 'Ready').length;
  const deliveryOrdersCount = orders.filter(isDeliveryOrder).length;
  const completedOrdersCount = orders.filter(o => o.status === 'Completed').length;

  if (activeStatusTab === 'Delivery') {
    return <DeliveryManagementTab />;
  }

  return (
    <div className="space-y-6 animate-slide-up relative">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#111827] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Module Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#E5ECE8] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['All', 'New', 'Preparing', 'Ready', 'Delivery', 'Completed', 'Cancelled'].map(stg => (
            <button 
              key={stg}
              onClick={() => { setActiveStatusTab(stg); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                activeStatusTab === stg ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
              }`}
            >
              {stg === 'All' ? 'All Orders' : (stg === 'Delivery' ? '🚴 Delivery' : stg)} {stg === 'New' && newOrdersCount > 0 ? `(${newOrdersCount})` : ''}
            </button>
          ))}
        </div>

        <button 
          onClick={() => { fetchOrders(); showToast('✓ Refreshed orders from database!'); }}
          className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <RotateCw size={14} className="text-[#0A8B5F]" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ==================== SUB-VIEW: NEW ORDERS (SPECIALIZED UI) ==================== */}
      {activeStatusTab === 'New' ? (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
                <span>Orders</span>
                <span>/</span>
                <span className="text-[#0A8B5F] font-extrabold">New Orders</span>
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">New Orders</h1>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Orders waiting for your kitchen review and acceptance.</p>
            </div>

            <button 
              onClick={() => { fetchOrders(); showToast('✓ Refreshed orders!'); }}
              className="px-4 py-2 bg-[#0A8B5F] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <RotateCw size={14} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* 4 Summary Metric Cards for New Orders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">NEW ORDERS</div>
              <div className="text-3xl font-black text-amber-600">{newOrdersCount}</div>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">● Pending kitchen action</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">TODAY</div>
              <div className="text-3xl font-black text-[#111827]">{totalOrdersCount}</div>
              <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Total orders today</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">TOTAL QTY</div>
              <div className="text-3xl font-black text-indigo-600">{newOrdersTotalQty}</div>
              <p className="text-[11px] text-[#6B7280] font-semibold mt-1">Portions requested</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">TOTAL VALUE</div>
              <div className="text-3xl font-black text-[#0A8B5F]">₹{newOrdersTotalValue}</div>
              <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Pending order revenue</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:w-auto">
              <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
              <input 
                type="text" 
                placeholder="Search order ID or customer name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                value={tiffinFilter}
                onChange={e => setTiffinFilter(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="All">All Tiffins</option>
                {uniqueTiffins.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amountHigh">Amount: High to Low</option>
              </select>
            </div>
          </div>

          {/* New Orders Action Cards */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-3">
                <CheckCircle size={40} className="mx-auto text-[#0A8B5F]" />
                <h3 className="text-base font-extrabold text-[#111827]">No New Orders Pending</h3>
                <p className="text-xs text-[#6B7280]">All incoming customer orders have been accepted and processed!</p>
              </div>
            ) : (
              filteredOrders.map(ord => (
                <div key={ord.id || ord._id} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4 food-card-hover">
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#0A8B5F]">{ord.orderId}</span>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded-full animate-pulse">
                          ● NEW ORDER
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-[#111827]">{ord.customerName}</div>
                      <div className="text-xs text-[#6B7280] font-medium flex items-center gap-2">
                        <span>📞 {ord.customerPhone}</span>
                        <span>•</span>
                        <span>📍 {ord.customerAddress}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-[#0A8B5F]">₹{ord.totalAmount}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${
                        ord.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {ord.paymentStatus === 'Paid' ? '✓ Paid Online (Advance)' : ord.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Row */}
                  <div className="bg-[#F9FBF9] p-3.5 rounded-xl border border-[#E5ECE8] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={ord.tiffinImage || '/assets/provider_1.png'} alt={ord.tiffinName} className="w-10 h-10 rounded-lg object-cover border border-[#E5ECE8]" />
                      <div>
                        <div className="text-xs font-black text-[#111827]">{ord.quantity} × {ord.tiffinName}</div>
                        <div className="text-[10px] text-[#6B7280] font-semibold">{ord.tiffinCategory}</div>
                      </div>
                    </div>

                    <div className="text-xs text-[#6B7280] font-bold flex items-center gap-1">
                      <Clock size={13} className="text-amber-600" />
                      <span>Placed on {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-1 border-t border-[#E5ECE8]">
                    <button 
                      onClick={() => setSelectedOrder(ord)}
                      className="px-4 py-2 border border-[#E5ECE8] bg-[#F9FBF9] text-[#111827] hover:bg-gray-100 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      View Details
                    </button>

                    <button 
                      onClick={() => setRejectingOrder(ord)}
                      className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Ban size={14} />
                      <span>Reject</span>
                    </button>

                    <button 
                      onClick={() => handleUpdateOrderStatus(ord.orderId, 'Preparing')}
                      className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Check size={15} />
                      <span>Accept Order</span>
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      ) : (
        /* ==================== GENERAL ALL ORDERS TABLE VIEW ==================== */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
                <span>Provider</span>
                <span>/</span>
                <span>Order Management</span>
                <span>/</span>
                <span className="text-[#0A8B5F] font-extrabold">{activeStatusTab} Orders</span>
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">{activeStatusTab === 'All' ? 'All Orders' : `${activeStatusTab} Orders`}</h1>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Manage and track all orders received for your tiffin business.</p>
            </div>

            <button 
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Download size={15} className="text-[#0A8B5F]" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => { setActiveStatusTab('All'); setCurrentPage(1); }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                activeStatusTab === 'All' ? 'bg-[#E8F0EC] border-[#0A8B5F] ring-2 ring-[#0A8B5F]/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">All Orders</span>
                <ShoppingBag size={17} className="text-[#0A8B5F]" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{totalOrdersCount}</div>
              <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Total orders received</p>
            </div>

            <div 
              onClick={() => { setActiveStatusTab('New'); setCurrentPage(1); }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                activeStatusTab === 'New' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">New Orders</span>
                <Clock size={17} className="text-amber-600" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{newOrdersCount}</div>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">● Pending review</p>
            </div>

            <div 
              onClick={() => { setActiveStatusTab('Preparing'); setCurrentPage(1); }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                activeStatusTab === 'Preparing' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Preparing</span>
                <ChefHat size={17} className="text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{preparingOrdersCount}</div>
              <p className="text-[11px] text-indigo-700 font-semibold mt-1">Currently cooking</p>
            </div>

            <div 
              onClick={() => { setActiveStatusTab('Completed'); setCurrentPage(1); }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                activeStatusTab === 'Completed' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Completed</span>
                <CheckCircle size={17} className="text-[#0A8B5F]" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{completedOrdersCount}</div>
              <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Fulfilled successfully</p>
            </div>
          </div>

          {/* Search & Multi-Filter Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
              <input 
                type="text" 
                placeholder="Search order ID, customer, phone, tiffin..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={activeStatusTab}
                onChange={e => { setActiveStatusTab(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Delivery">Delivery</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select 
                value={paymentFilter}
                onChange={e => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Pending">Pending</option>
              </select>

              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amountHigh">Amount: High to Low</option>
                <option value="amountLow">Amount: Low to High</option>
              </select>
            </div>
          </div>

          {/* Orders Data Table */}
          <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#6B7280] font-bold mt-3">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShoppingBag size={40} className="mx-auto text-gray-400" />
                <h3 className="text-base font-extrabold text-[#111827]">No Orders Found</h3>
                <p className="text-xs text-[#6B7280]">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#111827]">
                  <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Tiffin</th>
                      <th className="p-4 text-center">Qty</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5ECE8] font-bold">
                    {paginatedOrders.map(ord => (
                      <tr 
                        key={ord.id || ord._id} 
                        onClick={() => setSelectedOrder(ord)}
                        className="hover:bg-[#F9FBF9] transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-black text-[#0A8B5F]">
                          {ord.orderId}
                        </td>

                        <td className="p-4">
                          <div className="font-extrabold text-[#111827]">{ord.customerName}</div>
                          <div className="text-[11px] text-[#6B7280] font-medium">{ord.customerPhone}</div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <img src={ord.tiffinImage || '/assets/provider_1.png'} alt={ord.tiffinName} className="w-8 h-8 rounded-lg object-cover border border-[#E5ECE8]" />
                            <div>
                              <div className="font-extrabold text-[#111827]">{ord.tiffinName}</div>
                              <div className="text-[10px] text-[#6B7280] font-semibold">{ord.tiffinCategory}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center font-black text-sm">
                          {ord.quantity}
                        </td>

                        <td className="p-4 font-black text-[#0A8B5F] text-sm">
                          ₹{ord.totalAmount}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border ${
                            ord.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            ord.paymentStatus === 'Cash on Delivery' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-3 py-1 text-[11px] font-extrabold rounded-full border ${
                            ord.status === 'New' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            ord.status === 'Preparing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            ord.status === 'Ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            ord.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            ● {ord.status}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="px-3 py-1.5 bg-[#E8F0EC] text-[#0A8B5F] hover:bg-[#D2E4DC] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
                          >
                            <Eye size={14} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[#E5ECE8] bg-[#F9FBF9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#6B7280]">
              <div>
                Showing <span className="text-[#111827] font-black">{Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-[#111827] font-black">{Math.min(filteredOrders.length, currentPage * itemsPerPage)}</span> of <span className="text-[#111827] font-black">{filteredOrders.length}</span> orders
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                      currentPage === page ? 'bg-[#0A8B5F] text-white shadow-xs' : 'hover:bg-white text-[#6B7280]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-6 max-h-[92vh] overflow-y-auto text-xs font-bold text-[#111827]">
            
            <div className="flex justify-between items-start border-b border-[#E5ECE8] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-[#0A8B5F]">{selectedOrder.orderId}</span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                    selectedOrder.status === 'New' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    selectedOrder.status === 'Preparing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    selectedOrder.status === 'Ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    selectedOrder.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    ● {selectedOrder.status}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B7280] font-medium mt-1">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>

              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-1.5 rounded-xl border border-[#E5ECE8] hover:bg-gray-100 text-[#6B7280] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preparation Pipeline Stage Bar */}
            <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-3">
              <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F]">
                Order Status Workflow
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {statusPipeline.map((stg) => {
                  const isCurrent = selectedOrder.status === stg;
                  return (
                    <button 
                      key={stg}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, stg)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        isCurrent ? 'bg-[#0A8B5F] text-white shadow-sm ring-2 ring-[#0A8B5F]/30 scale-105' : 'bg-white border border-[#E5ECE8] text-[#6B7280] hover:bg-gray-100'
                      }`}
                    >
                      <span>{stg}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Partner Live Tracking Box for Provider */}
            <div className="bg-[#E8F0EC] p-4 rounded-2xl border border-[#C5DDD2] space-y-2">
              <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Truck size={16} />
                  <span>Delivery Partner Live Tracking</span>
                </div>

                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${
                  selectedOrder.deliveryStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  selectedOrder.deliveryStatus === 'Arrived at Pickup' ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' :
                  selectedOrder.deliveryPartnerName ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  ● {selectedOrder.deliveryStatus || 'Searching'}
                </span>
              </div>

              {selectedOrder.deliveryPartnerName ? (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                  <div>
                    <div className="text-sm font-black text-[#111827]">
                      {selectedOrder.deliveryPartnerName}
                    </div>
                    <div className="text-xs text-[#0A8B5F] font-semibold mt-0.5">
                      {selectedOrder.deliveryStatus === 'Accepted' && '🛵 Assigned & Heading to your kitchen for pickup'}
                      {selectedOrder.deliveryStatus === 'Arrived at Pickup' && '🛵 HAS ARRIVED AT YOUR KITCHEN FOR PICKUP!'}
                      {selectedOrder.deliveryStatus === 'Picked Up' && '📦 Food Picked Up — On the way to customer address'}
                      {selectedOrder.deliveryStatus === 'On The Way' && '🚚 En route to customer delivery location'}
                      {selectedOrder.deliveryStatus === 'Delivered' && '✓ Successfully delivered to customer!'}
                    </div>
                  </div>

                  {selectedOrder.deliveryPartnerPhone && (
                    <a 
                      href={`tel:${selectedOrder.deliveryPartnerPhone}`}
                      className="px-3.5 py-1.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Phone size={13} />
                      <span>Call Partner ({selectedOrder.deliveryPartnerPhone})</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[#6B7280] font-bold flex items-center gap-2 py-1">
                  <Clock size={14} className="text-amber-600 animate-spin" />
                  <span>
                    {selectedOrder.status === 'Ready' 
                      ? 'Searching for available Delivery Partner nearby...' 
                      : 'Delivery partner will be assigned once order is marked Ready.'}
                  </span>
                </div>
              )}
            </div>

            {/* INTERACTIVE VISUAL LIVE ROUTE MAP WIDGET MATCHING BRAND THEME */}
            <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-2.5">
                <div className="flex items-center gap-2">
                  <Navigation size={16} className="text-[#0A8B5F]" />
                  <span className="font-extrabold tracking-wide text-xs text-[#111827]">LIVE ROUTE MAP & GPS TRACKING</span>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-[#E8F0EC] text-[#0A8B5F] rounded-md border border-[#C5DDD2]">
                    GPS ACTIVE
                  </span>
                </div>

                <button 
                  onClick={() => {
                    const encoded = encodeURIComponent(selectedOrder.customerAddress);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
                  }}
                  className="px-3.5 py-1.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Compass size={14} />
                  <span>Open Live Maps</span>
                  <ExternalLink size={13} />
                </button>
              </div>

              {/* Visual Map Route Component */}
              <div className="py-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  
                  {/* Start Pin: Kitchen */}
                  <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-[#E5ECE8] shadow-xs flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[#0A8B5F] text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                      <ChefHat size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-extrabold text-[#6B7280]">Pickup Kitchen</div>
                      <div className="text-xs font-black text-[#111827]">{selectedOrder.pickupAddress || 'Shreeji Kitchen, Satellite'}</div>
                    </div>
                  </div>

                  {/* Route Distance Indicator Line */}
                  <div className="flex flex-col items-center justify-center shrink-0 text-center px-2">
                    <div className="text-xs text-[#0A8B5F] font-black mb-1">
                      {selectedOrder.deliveryDistance || '3.2 km'} • {selectedOrder.estimatedTime || '25 min'}
                    </div>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-[#0A8B5F] via-indigo-500 to-red-500 rounded-full animate-pulse shadow-xs" />
                  </div>

                  {/* End Pin: Customer Drop */}
                  <div className="flex items-center gap-2.5 bg-white p-3 rounded-xl border border-[#E5ECE8] shadow-xs flex-1">
                    <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-extrabold text-[#6B7280]">Customer Drop</div>
                      <div className="text-xs font-black text-[#111827]">{selectedOrder.customerName}</div>
                      <div className="text-[11px] text-[#6B7280] font-medium truncate max-w-[180px]">{selectedOrder.customerAddress}</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Customer Info & Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
                <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F] flex items-center gap-1.5">
                  <User size={15} />
                  <span>Customer Information</span>
                </div>
                <div className="text-sm font-black text-[#111827]">{selectedOrder.customerName}</div>
                <div className="text-xs text-[#6B7280] font-semibold flex items-center gap-1">
                  <Phone size={13} className="text-[#0A8B5F]" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="text-xs text-[#6B7280] font-medium pt-2 border-t border-[#E5ECE8] flex items-start gap-1">
                  <MapPin size={14} className="text-[#0A8B5F] shrink-0 mt-0.5" />
                  <span>{selectedOrder.customerAddress}</span>
                </div>
              </div>

              <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
                <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F] flex items-center gap-1.5">
                  <ChefHat size={15} />
                  <span>Tiffin Summary</span>
                </div>

                <div className="flex items-center gap-3">
                  <img src={selectedOrder.tiffinImage || '/assets/provider_1.png'} alt={selectedOrder.tiffinName} className="w-12 h-12 rounded-xl object-cover border border-[#E5ECE8]" />
                  <div>
                    <div className="text-sm font-black text-[#111827]">{selectedOrder.tiffinName}</div>
                    <div className="text-xs text-[#6B7280] font-semibold">{selectedOrder.tiffinCategory}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#E5ECE8] text-xs font-bold text-[#6B7280]">
                  <span>Qty: {selectedOrder.quantity} × ₹{selectedOrder.unitPrice}</span>
                  <span className="text-[#0A8B5F] font-black text-sm">Total: ₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
            {/* ITEMIZED BILL RECEIPT & DELIVERY CHARGE BREAKDOWN */}
            <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-2.5">
                <div className="flex items-center gap-2 text-[#0A8B5F]">
                  <Receipt size={16} />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#111827]">Order Bill & Payment Breakdown</span>
                </div>

                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md border ${
                  selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2 text-xs font-bold text-[#6B7280]">
                
                {/* Food Item Subtotal */}
                <div className="flex justify-between items-center">
                  <span>Item Subtotal ({selectedOrder.quantity} × ₹{selectedOrder.unitPrice})</span>
                  <span className="text-[#111827]">₹{selectedOrder.subtotal || selectedOrder.quantity * selectedOrder.unitPrice}</span>
                </div>

                {/* Per KM Delivery Fee */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1">
                    <span>Delivery Partner Fee</span>
                    <span className="text-[10px] text-[#0A8B5F] bg-[#E8F0EC] px-1.5 py-0.5 rounded border border-[#C5DDD2]">
                      {selectedOrder.deliveryDistance || '3.2 km'} @ ₹10/km
                    </span>
                  </div>
                  <span className="text-[#111827]">₹{selectedOrder.deliveryFee || 45}</span>
                </div>

                {/* Packaging Fee */}
                <div className="flex justify-between items-center">
                  <span>Eco Packaging & Hygiene Fee</span>
                  <span className="text-[#111827]">₹{selectedOrder.packagingFee || 15}</span>
                </div>

                {/* Taxes & GST */}
                <div className="flex justify-between items-center">
                  <span>Taxes & GST (5%)</span>
                  <span className="text-[#111827]">₹{selectedOrder.gstTax || 12}</span>
                </div>

                {/* Grand Total Divider */}
                <div className="pt-2 border-t border-[#E5ECE8] flex justify-between items-center text-sm font-black text-[#111827]">
                  <span>Grand Total Payable</span>
                  <span className="text-base text-[#0A8B5F]">₹{selectedOrder.totalAmount}</span>
                </div>

              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-2 border-t border-[#E5ECE8]">
              {selectedOrder.status === 'New' && (
                <>
                  <button 
                    onClick={() => { setSelectedOrder(null); setRejectingOrder(selectedOrder); }}
                    className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Reject Order
                  </button>
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, 'Preparing')}
                    className="px-5 py-2 bg-[#0A8B5F] text-white font-bold text-xs rounded-xl hover:bg-[#08734E] cursor-pointer shadow-xs"
                  >
                    Accept Order
                  </button>
                </>
              )}
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 border border-[#E5ECE8] text-[#6B7280] hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REJECT ORDER MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-4 text-xs font-bold text-[#111827]">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-extrabold text-[#111827]">Reject Order {rejectingOrder.orderId}?</h3>
              <button onClick={() => setRejectingOrder(null)} className="p-1 text-[#6B7280] hover:text-[#111827] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Are you sure you want to reject this order from <span className="text-[#111827] font-black">{rejectingOrder.customerName}</span>?
            </p>

            <div>
              <label className="block mb-1 text-[#6B7280]">Reason for Rejection (Optional)</label>
              <textarea 
                rows={2}
                placeholder="e.g. Daily capacity reached, Kitchen closing early..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-red-500 bg-[#F9FBF9]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#E5ECE8]">
              <button 
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 border border-[#E5ECE8] text-[#6B7280] rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUpdateOrderStatus(rejectingOrder.orderId, 'Cancelled', rejectReason || 'Kitchen rejected order.')}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
