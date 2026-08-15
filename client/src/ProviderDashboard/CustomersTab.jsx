import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  Star, 
  ArrowUpRight, 
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
  RotateCw
} from 'lucide-react';

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('mostSpent');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRealCustomersFromDb();
  }, []);

  const fetchRealCustomersFromDb = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/customers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
      }
    } catch (err) {
      console.error('Error fetching customers from MongoDB API:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering & Sorting Logic
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'mostSpent') return (b.totalSpent || 0) - (a.totalSpent || 0);
    if (sortBy === 'mostOrders') return (b.totalOrdersCount || 0) - (a.totalOrdersCount || 0);
    if (sortBy === 'newest') return new Date(b.lastOrderDate) - new Date(a.lastOrderDate);
    if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Real Metric Summaries
  const totalCustomersCount = customers.length;
  const activeCustomersCount = customers.filter(c => c.status === 'Active').length;
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const newTodayCount = customers.filter(c => 
    c.orders && c.orders.some(o => new Date(o.createdAt).toISOString().slice(0, 10) === todayStr)
  ).length;

  const totalOrdersCount = customers.reduce((sum, c) => sum + (c.totalOrdersCount || 0), 0);

  return (
    <div className="space-y-6 animate-slide-up relative">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Customers</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Customer Directory</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Real-time customer accounts fetched directly from MongoDB database <span className="text-[#0A8B5F] font-bold">tiffinlink.users</span>.</p>
        </div>

        <button 
          onClick={fetchRealCustomersFromDb}
          className="px-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RotateCw size={14} className="text-[#0A8B5F]" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">TOTAL CUSTOMERS</span>
            <Users size={17} className="text-[#0A8B5F]" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{totalCustomersCount}</div>
          <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Registered customer profiles</p>
        </div>

        {/* Card 2: Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">ACTIVE CUSTOMERS</span>
            <UserCheck size={17} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{activeCustomersCount}</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">● Active buyers in MongoDB</p>
        </div>

        {/* Card 3: New Today */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">NEW TODAY</span>
            <Clock size={17} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{newTodayCount}</div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">Ordered food today</p>
        </div>

        {/* Card 4: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">TOTAL ORDERS</span>
            <ShoppingBag size={17} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-[#111827]">{totalOrdersCount}</div>
          <p className="text-[11px] text-indigo-700 font-semibold mt-1">Associated order history</p>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-wrap gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
          <input 
            type="text" 
            placeholder="Search customer name, real email, phone, address..." 
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          <select 
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="mostSpent">Most Spent</option>
            <option value="mostOrders">Most Orders</option>
            <option value="newest">Newest Customer</option>
            <option value="nameAsc">Name (A - Z)</option>
          </select>

        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6B7280] font-bold mt-3">Fetching real customer accounts from MongoDB...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users size={40} className="mx-auto text-gray-400" />
            <h3 className="text-base font-extrabold text-[#111827]">No Customers Found</h3>
            <p className="text-xs text-[#6B7280]">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Last Order</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECE8] font-bold">
                {paginatedCustomers.map(cust => (
                  <tr 
                    key={cust.id || cust.email} 
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-[#F9FBF9] transition-colors cursor-pointer"
                  >
                    {/* Name & Real Email */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E8F0EC] text-[#0A8B5F] border border-[#C5DDD2] font-black text-xs flex items-center justify-center shrink-0">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#111827] text-sm">{cust.name}</div>
                          <div className="text-[11px] text-[#0A8B5F] font-semibold">{cust.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Address */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[#111827]">
                        <Phone size={13} className="text-[#0A8B5F]" />
                        <span>{cust.phone}</span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] truncate max-w-[160px]">{cust.address}</div>
                    </td>

                    {/* Orders Count */}
                    <td className="p-4 text-center font-black text-sm text-[#111827]">
                      {cust.totalOrdersCount}
                    </td>

                    {/* Total Spent */}
                    <td className="p-4 font-black text-[#0A8B5F] text-sm">
                      ₹{cust.totalSpent.toLocaleString()}
                    </td>

                    {/* Last Order Date */}
                    <td className="p-4 text-[#6B7280] font-medium">
                      {new Date(cust.lastOrderDate).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
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
            Showing <span className="text-[#111827] font-black">{Math.min(filteredCustomers.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-[#111827] font-black">{Math.min(filteredCustomers.length, currentPage * itemsPerPage)}</span> of <span className="text-[#111827] font-black">{filteredCustomers.length}</span> customers
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

      {/* CUSTOMER DETAILS DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-6 max-h-[92vh] overflow-y-auto text-xs font-bold text-[#111827]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#E5ECE8] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0A8B5F] text-white font-black text-base flex items-center justify-center shadow-md">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#111827]">{selectedCustomer.name}</h2>
                  <div className="text-xs text-[#0A8B5F] font-semibold">{selectedCustomer.email}</div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="p-1.5 rounded-xl border border-[#E5ECE8] hover:bg-gray-100 text-[#6B7280] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 4 Quick Stat Box Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                <div className="text-[10px] text-[#6B7280] font-extrabold uppercase">Total Orders</div>
                <div className="text-lg font-black text-[#111827] mt-0.5">{selectedCustomer.totalOrdersCount}</div>
              </div>

              <div className="bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                <div className="text-[10px] text-emerald-700 font-extrabold uppercase">Completed</div>
                <div className="text-lg font-black text-emerald-700 mt-0.5">{selectedCustomer.completedCount}</div>
              </div>

              <div className="bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                <div className="text-[10px] text-red-600 font-extrabold uppercase">Cancelled</div>
                <div className="text-lg font-black text-red-600 mt-0.5">{selectedCustomer.cancelledCount}</div>
              </div>

              <div className="bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8]">
                <div className="text-[10px] text-[#0A8B5F] font-extrabold uppercase">Total Spent</div>
                <div className="text-lg font-black text-[#0A8B5F] mt-0.5">₹{selectedCustomer.totalSpent.toLocaleString()}</div>
              </div>
            </div>

            {/* Contact & Address Box */}
            <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
              <div className="text-xs uppercase font-extrabold text-[#0A8B5F] flex items-center gap-1.5">
                <Users size={15} />
                <span>Contact & Delivery Address</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#111827] font-bold">
                <Phone size={14} className="text-[#0A8B5F]" />
                <span>{selectedCustomer.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-[#6B7280] pt-2 border-t border-[#E5ECE8]">
                <MapPin size={15} className="text-[#0A8B5F] shrink-0 mt-0.5" />
                <span>{selectedCustomer.address}</span>
              </div>
            </div>

            {/* Customer Order History List */}
            <div className="space-y-3">
              <div className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag size={15} className="text-[#0A8B5F]" />
                <span>Order History ({selectedCustomer.orders ? selectedCustomer.orders.length : 0} orders)</span>
              </div>

              <div className="divide-y divide-[#E5ECE8] bg-[#F9FBF9] rounded-2xl border border-[#E5ECE8] overflow-hidden">
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  selectedCustomer.orders.map(ord => (
                    <div key={ord.id || ord.orderId} className="p-3.5 flex items-center justify-between text-xs font-bold">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#0A8B5F]">{ord.orderId}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md border ${
                            ord.status === 'New' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            ord.status === 'Preparing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            ord.status === 'Ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            ord.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-semibold mt-0.5">
                          {ord.quantity} × {ord.tiffinName}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-[#0A8B5F]">₹{ord.totalAmount}</div>
                        <div className="text-[10px] text-[#6B7280]">{new Date(ord.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[#6B7280]">No orders found for this customer.</div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-[#E5ECE8]">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
