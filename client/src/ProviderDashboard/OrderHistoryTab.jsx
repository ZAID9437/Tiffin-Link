import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText
} from 'lucide-react';

export default function OrderHistoryTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchHistoryOrders();
  }, []);

  const fetchHistoryOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Error fetching order history from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateInput) => {
    if (!dateInput) return 'Today';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day}/${month}/${year} ${timeStr}`;
  };

  const filteredOrders = orders.filter(o => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (o.orderId || '').toLowerCase().includes(query) ||
      (o.customerName || '').toLowerCase().includes(query) ||
      (o.tiffinName || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;

    let matchesDate = true;
    if (startDate) {
      const orderD = new Date(o.createdAt || o.date);
      const startD = new Date(startDate);
      if (orderD < startD) matchesDate = false;
    }
    if (endDate) {
      const orderD = new Date(o.createdAt || o.date);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      if (orderD > endD) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = ['Order ID', 'Date & Time (DD/MM/YYYY)', 'Customer Name', 'Phone', 'Address', 'Tiffin Item', 'Qty', 'Amount (INR)', 'Payment Status', 'Status'];
    const rows = filteredOrders.map(o => [
      `"${o.orderId || ''}"`,
      `"${formatDateDisplay(o.createdAt || o.date)}"`,
      `"${o.customerName || ''}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.customerAddress || ''}"`,
      `"${o.tiffinName || ''}"`,
      o.quantity || 1,
      o.totalAmount || 0,
      `"${o.paymentStatus || 'Paid'}"`,
      `"${o.status || 'Completed'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TiffinLink_OrderHistory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A2E26] tracking-tight">Order History</h1>
          <p className="text-xs text-[#5B7067] font-medium mt-1">Review, filter, and export past transactions by date format.</p>
        </div>

        {/* Date Range & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F7FAF8] border border-[#E5ECE8] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A2E26]">
            <Calendar size={14} className="text-[#5B7067]" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none" 
            />
            <span className="text-[#5B7067]">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none" 
            />
          </div>

          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7FAF8] border border-[#E5ECE8] text-[#1A2E26] text-xs font-bold rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Orders Container */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden space-y-4 p-6">
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-[#5B7067]" />
          <input 
            type="text" 
            placeholder="Search orders, customers, or tiffins..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7FAF8] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#1A2E26] focus:outline-none focus:border-[#0A8B5F]"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#5B7067] font-bold">Loading order history...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5B7067] font-bold">No matching orders found.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5ECE8] text-[#5B7067] uppercase font-extrabold tracking-wider">
                  <th className="py-3.5 px-3">Order ID</th>
                  <th className="py-3.5 px-3">Date & Time (DD/MM/YYYY)</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Items</th>
                  <th className="py-3.5 px-3">Total Amount</th>
                  <th className="py-3.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECE8] text-[#1A2E26] font-medium">
                {filteredOrders.map(order => (
                  <tr key={order._id || order.orderId} className="hover:bg-[#F9FBF9] transition-colors">
                    <td className="py-4 px-3 font-bold text-[#0A8B5F]">{order.orderId}</td>
                    <td className="py-4 px-3 text-[#5B7067] font-bold">
                      {formatDateDisplay(order.createdAt || order.date)}
                    </td>
                    <td className="py-4 px-3 font-bold">
                      <div>{order.customerName}</div>
                      <div className="text-[10px] text-[#5B7067] font-normal">{order.customerPhone}</div>
                    </td>
                    <td className="py-4 px-3 text-[#4A5D54]">
                      {order.tiffinName} <span className="font-extrabold text-[#111827]">(x{order.quantity || 1})</span>
                    </td>
                    <td className="py-4 px-3 font-black text-[#1A2E26]">₹{order.totalAmount}</td>
                    <td className="py-4 px-3">
                      <span className={`px-3 py-1 font-extrabold text-[10px] rounded-full border ${
                        order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        order.status === 'Preparing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        order.status === 'Ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {order.status === 'Completed' ? '✓ ' : '• '}{order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5ECE8] text-xs text-[#5B7067] font-bold">
          <span>Showing {filteredOrders.length} orders</span>
        </div>

      </div>
    </div>
  );
}
