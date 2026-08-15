import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export default function OrderHistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const orders = [
    {
      id: '#ORD-8924',
      date: 'Oct 24, 2023',
      time: '1:45 PM',
      customer: 'John Doe',
      avatar: 'JD',
      avatarBg: 'bg-indigo-100 text-indigo-700',
      items: '2x Classic Veg Thali, 1x Extra Roti',
      total: 24.50,
      status: 'Completed',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: '#ORD-8923',
      date: 'Oct 24, 2023',
      time: '12:30 PM',
      customer: 'Alice Smith',
      avatar: 'AS',
      avatarBg: 'bg-rose-100 text-rose-700',
      items: '1x Paneer Butter Masala Combo',
      total: 16.00,
      status: 'Cancelled',
      statusClass: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      id: '#ORD-8922',
      date: 'Oct 23, 2023',
      time: '7:15 PM',
      customer: 'Rahul Jain',
      avatar: 'RJ',
      avatarBg: 'bg-emerald-100 text-emerald-700',
      items: '3x Homestyle Chicken Curry, Rice',
      total: 45.00,
      status: 'Completed',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: '#ORD-8921',
      date: 'Oct 23, 2023',
      time: '1:15 PM',
      customer: 'Siddharth V.',
      avatar: 'SV',
      avatarBg: 'bg-[#E8F0EC] text-[#0A8B5F]',
      items: '2x Special Veg Biryani',
      total: 20.00,
      status: 'Completed',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.items.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E26] tracking-tight">Order History</h1>
          <p className="text-sm text-[#5B7067] mt-1">Review and manage past transactions.</p>
        </div>

        {/* Date Range & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F7FAF8] border border-[#E5ECE8] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A2E26]">
            <Calendar size={14} className="text-[#5B7067]" />
            <input type="date" className="bg-transparent border-none text-xs focus:outline-none" />
            <span className="text-[#5B7067]">to</span>
            <input type="date" className="bg-transparent border-none text-xs focus:outline-none" />
          </div>

          <button className="px-3.5 py-2 bg-[#F7FAF8] border border-[#E5ECE8] text-[#1A2E26] text-xs font-semibold rounded-xl hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer">
            <Filter size={14} />
            <span>Filter</span>
          </button>

          <button className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Orders Container */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-sm overflow-hidden space-y-4 p-6">
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-3 text-[#5B7067]" />
          <input 
            type="text" 
            placeholder="Search orders, customers, or items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7FAF8] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#1A2E26] focus:outline-none focus:border-[#0A8B5F]"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5ECE8] text-[#5B7067] uppercase font-semibold">
                <th className="py-3.5 px-3">Order ID</th>
                <th className="py-3.5 px-3">Date & Time</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3">Items</th>
                <th className="py-3.5 px-3">Total</th>
                <th className="py-3.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8] text-[#1A2E26] font-medium">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#F9FBF9] transition-colors">
                  <td className="py-4 px-3 font-bold text-[#0A8B5F]">{order.id}</td>
                  <td className="py-4 px-3 text-[#5B7067]">
                    <div>{order.date}</div>
                    <div className="text-[11px] opacity-75">{order.time}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${order.avatarBg} font-bold text-[11px] flex items-center justify-center`}>
                        {order.avatar}
                      </div>
                      <span className="font-semibold">{order.customer}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-[#4A5D54]">{order.items}</td>
                  <td className="py-4 px-3 font-extrabold text-[#1A2E26]">${order.total.toFixed(2)}</td>
                  <td className="py-4 px-3">
                    <span className={`px-3 py-1 font-bold text-[11px] rounded-full border ${order.statusClass}`}>
                      {order.status === 'Completed' ? '✓ ' : '✕ '}{order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5ECE8] text-xs text-[#5B7067] font-semibold">
          <span>Showing 1 to {filteredOrders.length} of 124 orders</span>
          
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-[#E5ECE8] flex items-center justify-center hover:bg-gray-50 text-gray-500 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#0A8B5F] text-white flex items-center justify-center font-bold cursor-pointer">
              1
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#E5ECE8] flex items-center justify-center hover:bg-gray-50 cursor-pointer">
              2
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#E5ECE8] flex items-center justify-center hover:bg-gray-50 cursor-pointer">
              3
            </button>
            <button className="w-8 h-8 rounded-lg border border-[#E5ECE8] flex items-center justify-center hover:bg-gray-50 text-gray-500 cursor-pointer">
              ChevronRight
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
