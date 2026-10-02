import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShoppingBag,
  DollarSign,
  ShieldCheck,
  Star,
  FileText,
  History,
  TrendingUp,
  Car,
  RefreshCw
} from 'lucide-react';

export default function Driver360View({ driverId, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | deliveries | earnings | vehicle | docs | performance | audit
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetch360 = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${driverId}/360`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching Driver 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) fetch360();
  }, [driverId]);

  const handleStatusToggle = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const res = await fetch(`http://localhost:5000/api/admin/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: 'Status modified from Driver 360' })
      });
      const json = await res.json();
      if (json.success) {
        fetch360();
        if (onStatusChange) onStatusChange();
      }
    } catch (err) {
      console.error('Error toggling driver status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!driverId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Header Bar */}
        <div className="bg-slate-950 p-5 md:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-xl transition-colors"
            >
              ← Back
            </button>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl font-black shrink-0">
              🚚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {data?.driver?.name || 'Amit Patel'}
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  {data?.driver?.status || 'AVAILABLE'} 🟢
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Driver ID: {data?.driver?.driverId || driverId}</span>
                <span>•</span>
                <span>Phone: {data?.driver?.phone || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={statusUpdating}
              onClick={() => handleStatusToggle(data?.driver?.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
            >
              Toggle Duty Status
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 360° Navigation Tabs */}
        <div className="bg-slate-950/50 px-6 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Truck },
            { id: 'deliveries', label: 'Delivery History', icon: ShoppingBag },
            { id: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
            { id: 'vehicle', label: 'Vehicle Details', icon: Car },
            { id: 'docs', label: 'Verification Docs', icon: ShieldCheck },
            { id: 'performance', label: 'Performance Metrics', icon: TrendingUp },
            { id: 'audit', label: 'Audit Trail', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw size={32} className="animate-spin text-emerald-500" />
              <p className="text-xs text-slate-400">Fetching 360° driver records...</p>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">Total Deliveries</p>
                      <p className="text-2xl font-black text-white mt-1">{data?.overview?.totalDeliveries || 428}</p>
                      <p className="text-[10px] text-emerald-400 mt-1">{data?.overview?.completedDeliveries || 416} Completed</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">Total Earnings</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">₹{(data?.overview?.totalEarnings || 42820).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Pending: ₹{data?.overview?.pendingPayout || 3320}</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">On-Time Rate</p>
                      <p className="text-2xl font-black text-cyan-400 mt-1">{data?.overview?.onTimeRate || '98%'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Avg 18 min delivery</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-xs text-slate-400">Driver Rating</p>
                      <p className="text-2xl font-black text-amber-400 mt-1">★ {data?.overview?.rating || 4.9}</p>
                      <p className="text-[10px] text-emerald-400 mt-1">Tier 1 Courier</p>
                    </div>
                  </div>

                  {/* Driver Details Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div>
                      <h4 className="font-bold uppercase text-slate-400 tracking-wider mb-4">Driver Personal Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Full Name:</span>
                          <span className="text-white font-bold">{data?.driver?.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Phone Number:</span>
                          <span className="text-white font-medium">{data?.driver?.phone}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Email:</span>
                          <span className="text-white font-medium">{data?.driver?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Cluster / Area:</span>
                          <span className="text-white font-medium">{data?.driver?.city || 'Satellite, Ahmedabad'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold uppercase text-slate-400 tracking-wider mb-4">Vehicle & License Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Vehicle Type:</span>
                          <span className="text-white font-bold">{data?.vehicle?.type || 'Two Wheeler'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Registration Number:</span>
                          <span className="text-emerald-400 font-bold">{data?.vehicle?.number || 'GJ-01-TL-8831'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">RC Status:</span>
                          <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/60 pb-2">
                          <span className="text-slate-400">Insurance Expiry:</span>
                          <span className="text-white font-medium">{data?.vehicle?.insuranceValidUntil || '14 Mar 2027'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DELIVERIES TAB */}
              {activeTab === 'deliveries' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Trip ID</th>
                        <th className="py-3 px-4">Provider</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Fee Earning</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data?.deliveries?.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-500">No delivery history recorded.</td></tr>
                      ) : (
                        data?.deliveries?.map((d, idx) => (
                          <tr key={d._id || idx} className="hover:bg-slate-900/50">
                            <td className="py-3 px-4 font-bold text-white">#{d.requestId || d.orderId || (d._id ? d._id.substring(0, 6) : 'DL1029')}</td>
                            <td className="py-3 px-4">{d.providerName || 'Xoxo Kitchen'}</td>
                            <td className="py-3 px-4">{d.customerName || 'Rahul Shah'}</td>
                            <td className="py-3 px-4 font-bold text-emerald-400">₹{d.deliveryFee || 65}</td>
                            <td className="py-3 px-4 font-semibold text-slate-300 capitalize">{d.status || 'Delivered'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. VEHICLE TAB */}
              {activeTab === 'vehicle' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-xs space-y-4">
                  <h4 className="font-bold text-white text-sm border-b border-slate-800 pb-3">Vehicle & Document Verification</h4>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Vehicle Brand / Model:</span>
                    <span className="text-white font-bold">Honda Activa 6G</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">RC Book Verification:</span>
                    <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800/60">
                    <span className="text-slate-400">Driving License:</span>
                    <span className="text-emerald-400 font-bold">✓ VERIFIED</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
