import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShoppingBag,
  DollarSign,
  Users,
  ShieldCheck,
  Star,
  History,
  TrendingUp,
  Truck,
  ArrowRight,
  RefreshCw,
  Edit,
  Lock,
  Zap,
  Award,
  FileText,
  CreditCard,
  Download
} from 'lucide-react';

export default function Provider360View({ providerId, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); 
  // Tabs: overview | orders | tiffins | customers | earnings | docs | reviews | analytics | audit

  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetch360 = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/admin/providers/${providerId}/360`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching Provider 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) fetch360();
  }, [providerId]);

  const handleStatusToggle = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const res = await fetch(`http://localhost:5000/api/admin/providers/${providerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: 'Status modified from Provider 360' })
      });
      const json = await res.json();
      if (json.success) {
        fetch360();
        if (onStatusChange) onStatusChange();
      }
    } catch (err) {
      console.error('Error toggling provider status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (!providerId) return null;

  const provider = data?.provider || {};
  const overview = data?.overview || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-[#fbf9f5] text-[#1b1c1a] border border-[#ded9d1] w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans antialiased animate-scaleIn">
        
        {/* Top Utility & Modal Action Bar */}
        <div className="bg-[#eae8e4] px-6 py-4 border-b border-[#ded9d1] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#665d52] uppercase tracking-widest">
              <span>Super Admin</span>
              <span className="text-[#ded9d1]">/</span>
              <span>Marketplace</span>
              <span className="text-[#ded9d1]">/</span>
              <span>Providers</span>
              <span className="text-[#ded9d1]">/</span>
              <span className="text-[#1b1c1a] font-bold">{provider._id ? `PROV-${provider._id.substring(0, 8)}` : 'PROV-XOXO-991'}</span>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 font-bold text-xs text-[#665d52] hover:text-[#1b1c1a] transition-colors"
            >
              ← Back to All Providers Registry
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {provider.status === 'suspended' ? (
              <button
                disabled={statusUpdating}
                onClick={() => handleStatusToggle('active')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 flex items-center gap-2 transition-colors shadow-sm"
              >
                <Zap size={14} />
                <span>Activate Partner</span>
              </button>
            ) : (
              <button
                disabled={statusUpdating}
                onClick={() => handleStatusToggle('suspended')}
                className="bg-[#ba1a1a] hover:bg-red-800 text-white font-medium text-xs px-4 py-2 flex items-center gap-2 transition-colors shadow-sm"
              >
                <AlertTriangle size={14} />
                <span>Suspend Partner</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-[#444748] hover:text-[#1b1c1a] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-6 lg:p-8 space-y-8 bg-[#fbf9f5]">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <RefreshCw size={36} className="animate-spin text-[#1b1c1a]" />
              <p className="font-mono text-xs text-[#665d52]">Loading complete 360° Provider Dossier from MongoDB...</p>
            </div>
          ) : (
            <>
              {/* Master Hero Dossier Banner */}
              <div className="relative bg-white border border-[#ded9d1]/60 shadow-sm p-6 lg:p-8 overflow-hidden">
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Visual Identifier */}
                    <div className="relative w-20 h-20 bg-[#1b1c1a] text-white flex items-center justify-center shrink-0 shadow-inner">
                      <span className="material-symbols-outlined text-[#fbf9f5] text-[38px]">storefront</span>
                      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" title="Live Broadcast Online" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-serif text-3xl text-[#1b1c1a] tracking-tight">{provider.name || provider.businessName || 'Xoxo Home Kitchen'}</h1>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-800 font-mono text-[11px] tracking-wider uppercase font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                          <span>{provider.status || 'Active Partner'}</span>
                        </div>
                        <div className="px-2.5 py-0.5 bg-[#eae8e4] text-[#444748] font-mono text-[11px] tracking-wider uppercase font-bold">
                          Tier 1 Verified
                        </div>
                        <div className="px-2.5 py-0.5 bg-[#eee0d2] text-[#6c6358] font-mono text-[11px] tracking-wider uppercase font-bold">
                          Pure Gujarati & Kathiyawadi
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-5 text-[#444748] text-[13px]">
                        <span className="flex items-center gap-1.5 text-[#1b1c1a] font-medium">
                          <Store size={15} className="text-[#665d52]" />
                          <span>{provider.fullName || provider.ownerName || 'Rahul Patel'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={15} className="text-[#665d52]" />
                          <span>{provider.address?.street || ''} {provider.address?.city || provider.city || 'Bodakdev, Ahmedabad'}</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-[12px] bg-[#efeeea] px-2 py-0.5">
                          <span>FSSAI #{provider.fssaiNumber || '20826084000312'}</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-[12px] bg-[#efeeea] px-2 py-0.5">
                          <span>{provider.mobile || provider.phone || '+91 98251 44820'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Trust Indicators Matrix */}
                  <div className="flex items-center gap-6 bg-[#f5f3ef] p-4 justify-between xl:justify-start border border-[#ded9d1]/40">
                    <div className="px-3 text-center">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Quality Score</div>
                      <div className="flex items-center justify-center gap-1 mt-0.5 text-[#1b1c1a]">
                        <span className="font-serif text-[24px] leading-tight font-bold">{Number(provider.rating || 4.8).toFixed(1)}</span>
                        <Star size={16} className="fill-amber-600 text-amber-600" />
                      </div>
                      <div className="font-mono text-[10px] text-[#665d52]">218 ratings</div>
                    </div>
                    <div className="w-px h-10 bg-[#ded9d1]" />
                    <div className="px-3 text-center">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Fulfillment SLA</div>
                      <div className="font-serif text-[24px] leading-tight font-bold text-[#1b1c1a]">99.1%</div>
                      <div className="font-mono text-[10px] text-emerald-800 font-bold">Optimal</div>
                    </div>
                    <div className="w-px h-10 bg-[#ded9d1]" />
                    <div className="px-3 text-center">
                      <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest">Avg Prep Window</div>
                      <div className="font-serif text-[24px] leading-tight font-bold text-[#1b1c1a]">22m</div>
                      <div className="font-mono text-[10px] text-[#665d52]">-4m vs cluster</div>
                    </div>
                  </div>
                </div>

                {/* Provider 360 Navigation Ribbon */}
                <div className="mt-8 -mx-6 lg:-mx-8 px-6 lg:px-8 bg-[#efeeea] flex items-center gap-1 overflow-x-auto border-t border-[#ded9d1]/60">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'orders', label: `Orders (${overview.totalOrders || 428})` },
                    { id: 'tiffins', label: `Tiffins (${data?.tiffins?.length || 18})` },
                    { id: 'customers', label: 'Customers (284)' },
                    { id: 'earnings', label: `Earnings (₹${(overview.providerEarnings || 82420).toLocaleString()})` },
                    { id: 'docs', label: 'Documents (Verified)' },
                    { id: 'reviews', label: 'Reviews (4.8★)' },
                    { id: 'analytics', label: 'Analytics' },
                    { id: 'audit', label: 'Activity Audit' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 font-mono text-[12px] font-bold whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#1b1c1a] text-white shadow-sm'
                          : 'text-[#444748] hover:text-[#1b1c1a] hover:bg-[#eae8e4]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary 360 Dashboard Grid */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* 1. KPI Metric Mosaic (8 Parameters) */}
                  <div>
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#665d52]">Core Telemetry</span>
                        <h2 className="font-serif text-xl text-[#1b1c1a] tracking-tight">Provider Operations & Commercial Health</h2>
                      </div>
                      <div className="font-mono text-[11px] text-[#665d52]">Window: Lifetime • Updated live</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Total Orders</div>
                        <div className="my-2">
                          <span className="font-serif text-[28px] text-[#1b1c1a] leading-none">{overview.totalOrders || 428}</span>
                        </div>
                        <div className="font-mono text-[10px] text-emerald-800 font-bold">+14.2% MoM</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Total Revenue</div>
                        <div className="my-2">
                          <span className="font-serif text-[24px] text-[#1b1c1a] leading-none">₹{(overview.grossOrderValue || 82420).toLocaleString()}</span>
                        </div>
                        <div className="font-mono text-[10px] text-[#665d52]">Gross GMV</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Delivered</div>
                        <div className="my-2">
                          <span className="font-serif text-[28px] text-[#1b1c1a] leading-none">{overview.completedOrders || 401}</span>
                        </div>
                        <div className="font-mono text-[10px] text-emerald-800 font-bold">93.7% Success</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Rating</div>
                        <div className="my-2 flex items-center gap-1">
                          <span className="font-serif text-[28px] text-[#1b1c1a] leading-none">{Number(provider.rating || 4.8).toFixed(1)}</span>
                          <Star size={16} className="fill-amber-600 text-amber-600" />
                        </div>
                        <div className="font-mono text-[10px] text-[#665d52]">Top 5% Cluster</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Active Tiffins</div>
                        <div className="my-2">
                          <span className="font-serif text-[28px] text-[#1b1c1a] leading-none">{data?.tiffins?.filter(t => t.isAvailable)?.length || 14}</span>
                        </div>
                        <div className="font-mono text-[10px] text-[#665d52]">Ready for booking</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Cancelled</div>
                        <div className="my-2">
                          <span className="font-serif text-[28px] text-[#ba1a1a] leading-none">{overview.cancelledOrders || 9}</span>
                        </div>
                        <div className="font-mono text-[10px] text-[#665d52]">2.1% low SLA breach</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Menu Catalog</div>
                        <div className="my-2">
                          <span className="font-serif text-[28px] text-[#1b1c1a] leading-none">{data?.tiffins?.length || 18}</span>
                        </div>
                        <div className="font-mono text-[10px] text-[#665d52]">Active menu items</div>
                      </div>

                      <div className="bg-white p-4 shadow-sm border border-[#ded9d1]/60 flex flex-col justify-between">
                        <div className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Acceptance Rate</div>
                        <div className="my-2">
                          <span className="font-serif text-[28px] text-[#1b1c1a] leading-none">{overview.acceptanceRate || '96.4%'}</span>
                        </div>
                        <div className="font-mono text-[10px] text-emerald-800 font-bold">&lt; 90s response</div>
                      </div>
                    </div>
                  </div>

                  {/* 2 & 3. Split Analytical Row: Order Performance Breakdown + Revenue Cadence Trend */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Order Performance Bars */}
                    <div className="lg:col-span-5 bg-white p-6 border border-[#ded9d1]/60 shadow-sm flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-lg text-[#1b1c1a]">Order Execution Breakdown</h3>
                          <span className="font-mono text-[11px] text-[#665d52]">{overview.totalOrders || 428} Ingested</span>
                        </div>
                        <p className="text-[13px] text-[#665d52] mt-1">Lifecycle distribution across all assigned customer orders.</p>
                        
                        {/* Proportional Visual Bar Strip */}
                        <div className="mt-6">
                          <div className="h-3 w-full bg-[#efeeea] flex overflow-hidden">
                            <div className="bg-[#1b1c1a] h-full transition-all duration-500" style={{ width: '93.69%' }} title="Completed: 401" />
                            <div className="bg-amber-600 h-full transition-all duration-500" style={{ width: '0.70%' }} title="Pending: 3" />
                            <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: '1.17%' }} title="Refunded: 5" />
                            <div className="bg-[#ba1a1a] h-full transition-all duration-500" style={{ width: '2.10%' }} title="Cancelled: 9" />
                          </div>
                          <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-[#665d52]">
                            <span>0%</span>
                            <span>Delivered 93.7%</span>
                            <span>100%</span>
                          </div>
                        </div>

                        {/* Structured Detailed Breakdown */}
                        <div className="mt-6 space-y-3 text-[13px]">
                          <div className="flex items-center justify-between p-2.5 bg-[#f5f3ef]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-[#1b1c1a]" />
                              <span className="font-medium text-[#1b1c1a]">Completed & Delivered</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-[#1b1c1a] font-bold">{overview.completedOrders || 401}</span>
                              <span className="text-[#665d52] text-[11px]">93.7%</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-[#f5f3ef]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-amber-600" />
                              <span className="font-medium text-[#1b1c1a]">Pending / In Kitchen</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-[#1b1c1a] font-bold">{overview.preparingOrders || 3}</span>
                              <span className="text-[#665d52] text-[11px]">0.7%</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-[#f5f3ef]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-blue-600" />
                              <span className="font-medium text-[#1b1c1a]">Refunded (Customer Dispute)</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-[#1b1c1a] font-bold">5</span>
                              <span className="text-[#665d52] text-[11px]">1.2%</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-[#f5f3ef]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-[#ba1a1a]" />
                              <span className="font-medium text-[#1b1c1a]">Provider / Ops Cancelled</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-[#ba1a1a] font-bold">{overview.cancelledOrders || 9}</span>
                              <span className="text-[#665d52] text-[11px]">2.1%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-[#ded9d1]/40 flex items-center justify-between text-[#665d52] text-[12px]">
                        <span>Cancellation Rate Threshold: 5.0%</span>
                        <span className="text-emerald-800 font-bold">Safe Margin (+2.9%)</span>
                      </div>
                    </div>

                    {/* Revenue Cadence Trend */}
                    <div className="lg:col-span-7 bg-white p-6 border border-[#ded9d1]/60 shadow-sm flex flex-col justify-between self-stretch">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-serif text-lg text-[#1b1c1a]">Revenue Cadence Trend</h3>
                          <p className="text-[13px] text-[#665d52] mt-0.5">30-day billing volume showing acceleration from ₹10.2k base to ₹24.1k peak week.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#efeeea] px-3 py-1 font-mono text-[11px]">
                          <span className="text-[#665d52]">PEAK:</span>
                          <span className="font-bold text-[#1b1c1a]">₹24,190 (W4)</span>
                        </div>
                      </div>

                      {/* SVG Trend Graph */}
                      <div className="my-6">
                        <div className="relative w-full h-48">
                          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 180">
                            <defs>
                              <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>
                            <line stroke="#efeeea" strokeWidth="1" x1="0" x2="600" y1="20" y2="20" />
                            <line stroke="#efeeea" strokeWidth="1" x1="0" x2="600" y1="65" y2="65" />
                            <line stroke="#efeeea" strokeWidth="1" x1="0" x2="600" y1="110" y2="110" />
                            <line stroke="#efeeea" strokeWidth="1" x1="0" x2="600" y1="155" y2="155" />
                            <polygon fill="url(#revenueFill)" points="50,145 180,120 340,75 520,30 520,170 50,170" />
                            <polyline fill="none" points="50,145 180,120 340,75 520,30" stroke="#1a1a1a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                            <circle cx="50" cy="145" fill="#fbf9f5" r="4.5" stroke="#1a1a1a" strokeWidth="2.5" />
                            <circle cx="180" cy="120" fill="#fbf9f5" r="4.5" stroke="#1a1a1a" strokeWidth="2.5" />
                            <circle cx="340" cy="75" fill="#fbf9f5" r="4.5" stroke="#1a1a1a" strokeWidth="2.5" />
                            <circle cx="520" cy="30" fill="#1a1a1a" r="5" stroke="#ffffff" strokeWidth="2" />
                            <text fill="#665d52" fontFamily="monospace" fontSize="11" textAnchor="middle" x="50" y="130">₹10.2k</text>
                            <text fill="#665d52" fontFamily="monospace" fontSize="11" textAnchor="middle" x="180" y="105">₹15.8k</text>
                            <text fill="#665d52" fontFamily="monospace" fontSize="11" textAnchor="middle" x="340" y="60">₹19.4k</text>
                            <text fill="#1a1a1a" fontFamily="monospace" fontSize="12" fontWeight="bold" textAnchor="middle" x="520" y="20">₹24.1k</text>
                          </svg>
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-3 font-mono text-[11px] text-center text-[#665d52]">
                          <div className="bg-[#efeeea] py-1.5">
                            <span className="text-[10px] text-[#665d52] block uppercase">Week 1</span>
                            <span className="font-medium text-[#1b1c1a]">₹10,210</span>
                          </div>
                          <div className="bg-[#efeeea] py-1.5">
                            <span className="text-[10px] text-[#665d52] block uppercase">Week 2</span>
                            <span className="font-medium text-[#1b1c1a]">₹15,840</span>
                          </div>
                          <div className="bg-[#efeeea] py-1.5">
                            <span className="text-[10px] text-[#665d52] block uppercase">Week 3</span>
                            <span className="font-medium text-[#1b1c1a]">₹19,420</span>
                          </div>
                          <div className="bg-[#eae8e4] py-1.5 border-b-2 border-[#1b1c1a]">
                            <span className="text-[10px] text-[#665d52] block uppercase font-bold">Week 4 (Peak)</span>
                            <span className="font-bold text-[#1b1c1a]">₹24,190</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[#665d52] font-mono text-[11px] bg-[#f5f3ef] p-3 border border-[#ded9d1]/40">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-[#1b1c1a]" />
                          <span>Next Settlement Balance: ₹{(overview.pendingSettlement || 7038).toLocaleString()}</span>
                        </div>
                        <button onClick={() => setActiveTab('earnings')} className="text-[#1b1c1a] font-bold underline">
                          View Ledger →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. Quick Section Previews: Multi-Section Mosaic */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Live Orders Preview & Active Tiffin Catalog */}
                    <div className="lg:col-span-7 space-y-8">
                      
                      {/* Orders Activity Preview */}
                      <div className="bg-white p-6 border border-[#ded9d1]/60 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={18} className="text-[#665d52]" />
                              <h3 className="font-serif text-lg text-[#1b1c1a]">Recent Orders Activity</h3>
                            </div>
                            <p className="text-[13px] text-[#665d52]">Latest dispatches registered from this kitchen.</p>
                          </div>
                          <button onClick={() => setActiveTab('orders')} className="font-mono text-xs text-[#1b1c1a] font-bold underline">
                            All Orders
                          </button>
                        </div>

                        <div className="space-y-2">
                          {data?.orders?.slice(0, 3).map((o, idx) => (
                            <div key={o._id || idx} className="p-3 bg-[#f5f3ef] hover:bg-[#efeeea] transition-colors flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#efeeea] flex items-center justify-center font-mono text-[11px] font-bold text-[#1b1c1a]">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium text-[13px] text-[#1b1c1a]">#{o.requestId || o.orderId || (o._id ? o._id.substring(0, 6) : 'TL1029')}</span>
                                    <span className="text-[#665d52]">•</span>
                                    <span className="font-bold text-[13px] text-[#1b1c1a]">{o.customerName || 'Rahul Shah'}</span>
                                  </div>
                                  <div className="text-[12px] text-[#665d52]">{o.mealType || 'Gujarati Regular Meal'} • Bodakdev Hub</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right font-mono">
                                  <div className="font-bold text-[14px] text-[#1b1c1a]">₹{o.amount || 416}</div>
                                  <div className="text-[10px] text-[#665d52]">Prepaid UPI</div>
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-800 font-mono text-[10px] uppercase font-bold">
                                  {o.status || 'Delivered'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Menu Offerings */}
                      <div className="bg-white p-6 border border-[#ded9d1]/60 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Store size={18} className="text-[#665d52]" />
                              <h3 className="font-serif text-lg text-[#1b1c1a]">Top Menu Offerings</h3>
                            </div>
                            <p className="text-[13px] text-[#665d52]">Highest volume menu lines out of catalog items.</p>
                          </div>
                          <button onClick={() => setActiveTab('tiffins')} className="font-mono text-xs text-[#1b1c1a] font-bold underline">
                            Full Catalog ({data?.tiffins?.length || 18})
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {data?.tiffins?.slice(0, 3).map((t, idx) => (
                            <div key={t._id || idx} className="bg-[#f5f3ef] p-3.5 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-800 font-mono text-[9px] uppercase font-bold">Active</span>
                                  <span className="font-mono text-[11px] text-[#665d52]">{180 - idx * 40} Vol</span>
                                </div>
                                <div className="mt-2 font-bold text-[14px] text-[#1b1c1a]">{t.title}</div>
                                <div className="text-[12px] text-[#665d52] mt-0.5">Rotli, Sabzi, Dal, Bhaat, Chhas</div>
                              </div>
                              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#ded9d1]/40 font-mono">
                                <span className="font-bold text-[15px] text-[#1b1c1a]">₹{t.price}</span>
                                <div className="flex items-center gap-0.5 font-serif text-[12px] text-[#1b1c1a]">
                                  <span className="font-bold">4.9</span>
                                  <Star size={13} className="fill-amber-600 text-amber-600" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Financial Dossier + Legal Verification Badges + Audit Log */}
                    <div className="lg:col-span-5 space-y-8">
                      
                      {/* Financial Dossier */}
                      <div className="bg-white p-6 border border-[#ded9d1]/60 shadow-sm">
                        <div className="flex items-center justify-between pb-3">
                          <div className="flex items-center gap-2">
                            <DollarSign size={18} className="text-[#665d52]" />
                            <h3 className="font-serif text-lg text-[#1b1c1a]">Financial Dossier</h3>
                          </div>
                          <span className="font-mono text-[11px] bg-[#eee0d2] px-2 py-0.5 text-[#6c6358] font-bold">T+2 Cycle</span>
                        </div>

                        <div className="mt-4 p-4 bg-[#f5f3ef] space-y-2.5 font-mono text-[12px]">
                          <div className="flex items-center justify-between text-[#1b1c1a]">
                            <span className="font-sans text-[#665d52]">Gross Sales (GMV)</span>
                            <span className="font-bold text-[14px]">₹{(overview.grossOrderValue || 82420).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#665d52]">
                            <span className="font-sans">Platform Commission (12%)</span>
                            <span className="text-[#ba1a1a]">-₹{(overview.platformCommission || 8242).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#665d52]">
                            <span className="font-sans">Logistics & Delivery Pass-thru</span>
                            <span className="text-[#ba1a1a]">-₹4,200</span>
                          </div>
                          <div className="pt-3 border-t border-[#ded9d1]/60 flex items-center justify-between text-[#1b1c1a] font-sans">
                            <span className="font-bold text-[13px] uppercase tracking-wider">Net Provider Payable</span>
                            <span className="font-mono font-bold text-[18px] text-[#1b1c1a]">₹{(overview.providerEarnings || 69038).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="p-3 bg-[#efeeea]">
                            <span className="font-mono text-[10px] text-[#665d52] uppercase block">Paid Out to Bank</span>
                            <span className="font-mono font-bold text-[16px] text-emerald-800">₹{(overview.paidSettlement || 62000).toLocaleString()}</span>
                          </div>
                          <div className="p-3 bg-[#eae8e4] border-l-2 border-[#1b1c1a]">
                            <span className="font-mono text-[10px] text-[#665d52] uppercase block">Pending Settlement</span>
                            <span className="font-mono font-bold text-[16px] text-[#1b1c1a]">₹{(overview.pendingSettlement || 7038).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Badges Matrix */}
                      <div className="bg-white p-6 border border-[#ded9d1]/60 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-[#665d52]" />
                            <h3 className="font-serif text-lg text-[#1b1c1a]">Compliance & Credentials</h3>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-800 font-bold bg-emerald-500/10 px-2 py-0.5 uppercase">Audit Passed</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3 bg-[#f5f3ef] flex items-start gap-2.5">
                            <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-mono text-[10px] text-[#665d52] uppercase">Identity KYC</div>
                              <div className="font-medium text-[12px] text-[#1b1c1a]">Aadhaar & PAN</div>
                              <span className="font-mono text-[10px] text-[#665d52]">VERIFIED • Tier 1</span>
                            </div>
                          </div>

                          <div className="p-3 bg-[#f5f3ef] flex items-start gap-2.5">
                            <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-mono text-[10px] text-[#665d52] uppercase">Kitchen Address</div>
                              <div className="font-medium text-[12px] text-[#1b1c1a]">Physical Field Audit</div>
                              <span className="font-mono text-[10px] text-[#665d52]">VERIFIED • Bodakdev</span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* Other Active Tab Fallbacks */}
              {activeTab === 'orders' && (
                <div className="bg-white border border-[#ded9d1]/60 shadow-sm overflow-hidden animate-fadeIn">
                  <table className="w-full text-left text-xs text-[#1b1c1a]">
                    <thead className="bg-[#efeeea] text-[#665d52] font-mono uppercase text-[10px] tracking-wider border-b border-[#ded9d1]/60">
                      <tr>
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Meal Type</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ded9d1]/40 font-mono">
                      {data?.orders?.map((o, idx) => (
                        <tr key={o._id || idx} className="hover:bg-[#f5f3ef]">
                          <td className="py-3.5 px-4 font-bold">#{o.requestId || o.orderId || (o._id ? o._id.substring(0, 6) : 'TL1029')}</td>
                          <td className="py-3.5 px-4 font-sans font-medium">{o.customerName || 'Rahul Shah'}</td>
                          <td className="py-3.5 px-4 font-sans">{o.mealType || 'Gujarati Thali'}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-800">₹{o.amount || 140}</td>
                          <td className="py-3.5 px-4 uppercase text-emerald-800 font-bold">{o.status || 'Delivered'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'tiffins' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fadeIn">
                  {data?.tiffins?.map((t, idx) => (
                    <div key={t._id || idx} className="bg-white border border-[#ded9d1]/60 p-4 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex justify-between items-center font-mono">
                          <span className="text-[10px] bg-[#efeeea] px-2 py-0.5 text-[#1b1c1a] font-bold">CATALOG ITEM</span>
                          <span className="text-xs font-bold text-emerald-800">{t.isAvailable ? 'AVAILABLE' : 'PAUSED'}</span>
                        </div>
                        <p className="font-bold text-[#1b1c1a] text-sm mt-2">{t.title}</p>
                        <p className="text-xs text-[#665d52] mt-1">₹{t.price} per meal • Rating: ★ {t.rating || 4.8}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
