import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  MapPin,
  Car,
  Star
} from 'lucide-react';

export default function DriversManagementTab({ onOpenDriver360, subTab = 'drivers-all' }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!subTab) return;
    if (subTab === 'drivers-pending' || subTab === 'verify-drivers') setStatusFilter('pending');
    else if (subTab === 'drivers-active') setStatusFilter('available');
    else if (subTab === 'drivers-all' || subTab === 'drivers') setStatusFilter('all');
  }, [subTab]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/drivers?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.drivers)) {
        setDrivers(json.drivers);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: 'Admin override' })
      });
      const json = await res.json();
      if (json.success) {
        fetchDrivers();
      }
    } catch (err) {
      console.error('Error updating driver status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || 'AVAILABLE').toUpperCase();
    switch (st) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-800 font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" /> Online & Available
          </span>
        );
      case 'BUSY':
        return (
          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-800 font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 w-fit">
            <Clock size={12} /> On Delivery Trip
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="px-2.5 py-0.5 bg-[#eae8e4] text-[#444748] font-mono text-[11px] tracking-wider uppercase w-fit">
            Offline
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-red-500/10 text-red-800 font-mono text-[11px] tracking-wider uppercase w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#ded9d1]/60 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#665d52] uppercase tracking-widest">
            <span>Marketplace</span>
            <span className="text-[#ded9d1]">/</span>
            <span>Delivery Partners</span>
          </div>
          <h2 className="font-serif text-2xl text-[#1b1c1a] tracking-tight mt-1 flex items-center gap-2">
            <Truck className="text-[#1b1c1a]" size={22} />
            <span>Delivery Partner Fleet Registry</span>
          </h2>
          <p className="text-xs text-[#444748] mt-1">
            Registered Courier Partners and Delivery Agents across all cluster hubs.
          </p>
        </div>

        <button
          onClick={fetchDrivers}
          className="bg-[#1b1c1a] hover:bg-neutral-800 text-white font-medium text-xs px-4 py-2 flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Fleet Database</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#ded9d1]/60 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#747878]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver name, phone, vehicle no..."
            className="w-full bg-[#efeeea] border border-transparent rounded pl-10 pr-4 py-2 text-xs text-[#1b1c1a] placeholder:text-[#444748] focus:outline-none focus:bg-white focus:border-[#1b1c1a] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#efeeea] border border-transparent text-[#1b1c1a] font-medium text-xs px-3 py-2 focus:outline-none focus:bg-white focus:border-[#1b1c1a] transition-all"
          >
            <option value="all">All Fleet Statuses</option>
            <option value="available">Online & Available</option>
            <option value="pending">Pending Verification</option>
            <option value="busy">On Active Trip</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white border border-[#ded9d1]/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1b1c1a]">
            <thead className="bg-[#efeeea] text-[#665d52] font-mono uppercase text-[10px] tracking-wider border-b border-[#ded9d1]/60">
              <tr>
                <th className="py-3.5 px-4">Courier Partner</th>
                <th className="py-3.5 px-4">Vehicle & RC</th>
                <th className="py-3.5 px-4">Completed Trips</th>
                <th className="py-3.5 px-4">Total Earnings</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Duty Status</th>
                <th className="py-3.5 px-4 text-right">Actions / 360°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ded9d1]/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#665d52]">
                    Loading driver fleet database...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#665d52]">
                    No drivers found matching current search.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr
                    key={d._id}
                    className="hover:bg-[#f5f3ef] transition-colors group cursor-pointer"
                    onClick={() => onOpenDriver360(d._id)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1b1c1a] text-[#fbf9f5] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#1b1c1a] text-sm group-hover:underline decoration-[#1b1c1a]">
                            {d.name || 'Delivery Partner'}
                          </p>
                          <p className="text-[11px] text-[#665d52]">
                            ID: {d.driverId || d._id.substring(0, 6)} • {d.phone || 'Phone N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium text-[#444748]">
                      <div className="flex items-center gap-1.5">
                        <Car size={13} className="text-[#665d52]" />
                        <span>{d.vehicleNo || 'GJ-01-TL-8831'} ({d.vehicleType || 'Bike'})</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#1b1c1a]">
                      {d.deliveriesCount || 0} Trips
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#1b1c1a]">
                      ₹{(d.earnings || 0).toLocaleString()}
                    </td>

                    <td className="py-4 px-4 font-bold text-[#1b1c1a]">
                      <span className="flex items-center gap-1 font-serif text-sm">
                        {Number(d.rating || 4.9).toFixed(1)}
                        <Star size={12} className="fill-amber-600 text-amber-600" />
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(d.status)}
                    </td>

                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenDriver360(d._id)}
                        className="bg-[#1b1c1a] hover:bg-neutral-800 text-white font-medium px-3 py-1 text-[11px] flex items-center gap-1 transition-colors ml-auto"
                      >
                        <Eye size={13} />
                        <span>Driver 360°</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
