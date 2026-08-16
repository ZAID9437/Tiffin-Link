import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  X,
  UserCheck,
  DollarSign,
  RotateCw,
  Download,
  ExternalLink,
  Map,
  Filter
} from 'lucide-react';

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 128,
    activeCustomers: 94,
    newToday: 6,
    totalOrders: 342,
    totalRevenue: 64200
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orderFilter, setOrderFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Customer for Details Side Drawer / Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    fetchCustomersFromDb();
  }, [searchQuery, statusFilter, orderFilter, dateRangeFilter, currentPage]);

  const fetchCustomersFromDb = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        providerId: 'prov_1',
        search: searchQuery,
        status: statusFilter,
        orderFilter: orderFilter,
        dateRange: dateRangeFilter,
        page: currentPage,
        limit: 5
      });

      const res = await fetch(`http://localhost:5000/api/customers?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        if (Array.isArray(json.data.customers)) {
          setCustomers(json.data.customers);
        }
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
        if (json.data.pagination) {
          setPagination(json.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching customers from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (customers.length === 0) return;

    const headers = ['Customer Name', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Spent (INR)', 'Status'];
    const rows = customers.map(c => [
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.totalOrdersCount || 0,
      c.totalSpent || 0,
      `"${c.status || 'Active'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Customers</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Customers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0A8B5F] border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage customers who order from your kitchen.</p>
        </div>

        {/* Top Actions: Search & Export */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search size={15} className="absolute left-3.5 top-2.5 text-[#6B7280]" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
          </div>

          {/* Export Button */}
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOTAL CUSTOMERS */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">TOTAL CUSTOMERS</div>
          <div className="text-4xl font-black text-[#111827]">{metrics.totalCustomers || 128}</div>
        </div>

        {/* Card 2: ACTIVE CUSTOMERS */}
        <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">ACTIVE CUSTOMERS</div>
          <div className="text-4xl font-black text-[#0A8B5F]">{metrics.activeCustomers || 94}</div>
        </div>

        {/* Card 3: NEW TODAY */}
        <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">NEW TODAY</div>
          <div className="text-4xl font-black text-amber-600">{metrics.newToday || 6}</div>
        </div>

        {/* Card 4: ORDERS */}
        <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider mb-2">ORDERS</div>
          <div className="text-4xl font-black text-indigo-600">{metrics.totalOrders || 342}</div>
        </div>

      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#6B7280]">
          <Filter size={15} className="text-[#0A8B5F]" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#6B7280]">Status:</span>
            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Orders Frequency Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#6B7280]">Orders:</span>
            <select 
              value={orderFilter}
              onChange={e => { setOrderFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Frequent">Frequent (5+)</option>
              <option value="New">New (1-2)</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#6B7280]">Date:</span>
            <select 
              value={dateRangeFilter}
              onChange={e => { setDateRangeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* CUSTOMER LIST SECTION */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">CUSTOMER LIST</h2>
          <span className="text-xs text-[#6B7280] font-bold">Showing page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7280] font-bold mt-3">Fetching real customers from MongoDB database...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users size={40} className="mx-auto text-gray-400" />
            <h3 className="text-base font-extrabold text-[#111827]">No Customers Found</h3>
            <p className="text-xs text-[#6B7280]">Try clearing or adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-[#111827]">
                <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4 text-center">Orders</th>
                    <th className="p-4">Spent</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] font-bold">
                  {customers.map(cust => (
                    <tr 
                      key={cust.id || cust.email} 
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-[#F9FBF9] transition-colors cursor-pointer"
                    >
                      {/* Customer Name & Photo/Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#E8F0EC] text-[#0A8B5F] border border-[#C5DDD2] font-black text-xs flex items-center justify-center shrink-0">
                            {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CU'}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#111827] text-sm">{cust.name}</div>
                            <div className="text-[11px] text-[#6B7280] font-medium">{cust.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4 text-[#111827]">
                        {cust.phone}
                      </td>

                      {/* Orders Count */}
                      <td className="p-4 text-center font-black text-sm text-[#111827]">
                        {cust.totalOrdersCount}
                      </td>

                      {/* Spent */}
                      <td className="p-4 font-black text-[#0A8B5F] text-sm">
                        ₹{Number(cust.totalSpent || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-md uppercase border ${
                          cust.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          ● {cust.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Action View Button */}
                      <td className="p-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className="px-3 py-1.5 bg-[#E8F0EC] text-[#0A8B5F] hover:bg-[#D2E4DC] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
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

            {/* Mobile Card List View (No Horizontal Overflow) */}
            <div className="block md:hidden divide-y divide-[#E5ECE8]">
              {customers.map(cust => (
                <div 
                  key={cust.id || cust.email}
                  onClick={() => setSelectedCustomer(cust)}
                  className="p-4 space-y-3 hover:bg-[#F9FBF9] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#E8F0EC] text-[#0A8B5F] font-black text-xs flex items-center justify-center shrink-0">
                        {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div>
                        <div className="font-extrabold text-[#111827]">{cust.name}</div>
                        <div className="text-[10px] text-[#6B7280]">{cust.phone}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase border ${
                      cust.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      ● {cust.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5ECE8] text-xs">
                    <div>
                      <span className="text-[#6B7280]">Orders: </span>
                      <strong className="text-[#111827]">{cust.totalOrdersCount}</strong>
                    </div>
                    <div>
                      <span className="text-[#6B7280]">Spent: </span>
                      <strong className="text-[#0A8B5F]">₹{Number(cust.totalSpent || 0).toLocaleString()}</strong>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(cust);
                      }}
                      className="px-2.5 py-1 bg-[#E8F0EC] text-[#0A8B5F] font-bold text-[11px] rounded-lg"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Server-Side Pagination Footer */}
        <div className="p-4 border-t border-[#E5ECE8] bg-[#F9FBF9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#6B7280]">
          <div>
            Showing <span className="text-[#111827] font-black">{customers.length}</span> of <span className="text-[#111827] font-black">{pagination.total}</span> customers
          </div>

          {/* Pagination Number Controls */}
          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
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
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-[#E5ECE8] hover:bg-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* CUSTOMER DETAILS SIDE DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 border-l border-[#E5ECE8] animate-slide-left space-y-6 overflow-y-auto text-xs font-bold text-[#111827]">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-4">
              <h2 className="text-base font-black text-[#111827]">Customer Details</h2>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="p-1.5 rounded-xl border border-[#E5ECE8] hover:bg-gray-100 text-[#6B7280] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Section */}
            <div className="text-center space-y-2 py-2">
              <div className="w-20 h-20 rounded-full bg-[#0A8B5F] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg border-4 border-[#E8F0EC]">
                {selectedCustomer.name ? selectedCustomer.name.slice(0, 2).toUpperCase() : 'CU'}
              </div>
              <h3 className="text-lg font-black text-[#111827]">{selectedCustomer.name}</h3>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-full uppercase">
                ● Active
              </span>
            </div>

            {/* Contact Details */}
            <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-3">
              <div>
                <label className="text-[10px] text-[#6B7280] font-extrabold uppercase">Phone</label>
                <div className="text-xs font-black text-[#111827]">{selectedCustomer.phone}</div>
              </div>

              <div className="pt-2 border-t border-[#E5ECE8]">
                <label className="text-[10px] text-[#6B7280] font-extrabold uppercase">Email</label>
                <div className="text-xs font-black text-[#0A8B5F]">{selectedCustomer.email}</div>
              </div>

              <div className="pt-2 border-t border-[#E5ECE8]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#6B7280] font-extrabold uppercase">Delivery Address</label>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedCustomer.address || 'Ahmedabad')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#0A8B5F] hover:underline font-extrabold flex items-center gap-1"
                  >
                    <span>View Location</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="text-xs font-semibold text-[#111827] mt-0.5">{selectedCustomer.address}</div>
              </div>
            </div>

            {/* ORDER SUMMARY Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">ORDER SUMMARY</h4>

              <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Total Orders</span>
                  <strong className="text-[#111827]">{selectedCustomer.totalOrdersCount}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Completed</span>
                  <strong className="text-emerald-700">{selectedCustomer.completedCount || 0}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Cancelled</span>
                  <strong className="text-red-600">{selectedCustomer.cancelledCount || 0}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Active</span>
                  <strong className="text-indigo-600">{selectedCustomer.activeCount || 0}</strong>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#E5ECE8]">
                  <span className="text-[#111827] font-black">Total Spent</span>
                  <strong className="text-[#0A8B5F] text-sm">₹{Number(selectedCustomer.totalSpent || 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* RECENT ORDERS Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">RECENT ORDERS</h4>

              <div className="divide-y divide-[#E5ECE8] bg-[#F9FBF9] rounded-2xl border border-[#E5ECE8] overflow-hidden">
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  selectedCustomer.orders.slice(0, 3).map(ord => (
                    <div key={ord.id || ord.orderId} className="p-3 flex items-center justify-between text-xs font-bold">
                      <div>
                        <div className="font-black text-[#0A8B5F]">{ord.orderId}</div>
                        <div className="text-[11px] text-[#6B7280]">{ord.tiffinName}</div>
                        <span className={`inline-block mt-0.5 px-2 py-0.2 text-[9px] font-black rounded border ${
                          ord.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-right font-black text-[#0A8B5F]">
                        ₹{ord.totalAmount}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[#6B7280]">No recent orders found.</div>
                )}
              </div>
            </div>

            {/* Drawer Action Footer */}
            <div className="pt-3 border-t border-[#E5ECE8]">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold rounded-xl transition-colors cursor-pointer shadow-xs text-center"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
