import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../components/common/DataTable';
import { ShieldAlert, ShieldCheck, Clock, Store, Check, AlertTriangle, Eye, MoreVertical, X } from 'lucide-react';

export default function ProvidersManagementTab({ onOpenProvider360, subTab = 'providers-all' }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabFilter, setActiveTabFilter] = useState('all');

  // Modal for new kitchen onboarding
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    fssaiLicense: '',
    city: 'Ahmedabad',
    address: '',
    cuisineTypes: 'Pure Gujarati Thali'
  });
  const [submittingOnboard, setSubmittingOnboard] = useState(false);

  useEffect(() => {
    if (!subTab) return;
    if (subTab === 'providers-pending' || subTab === 'kyc-verification') setActiveTabFilter('pending');
    else if (subTab === 'providers-active') setActiveTabFilter('active');
    else if (subTab === 'providers-suspended') setActiveTabFilter('suspended');
    else if (subTab === 'providers-all' || subTab === 'providers') setActiveTabFilter('all');
  }, [subTab]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Fetch all to allow client-side pagination and stats aggregation
      const res = await fetch(`http://localhost:5000/api/admin/providers?limit=1000`);
      const json = await res.json();
      if (json.success && Array.isArray(json.providers)) {
        setProviders(json.providers);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/admin/providers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: 'Super Admin Override' })
      });
      fetchProviders();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingOnboard(true);
      const res = await fetch('http://localhost:5000/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...onboardForm,
          cuisineTypes: [onboardForm.cuisineTypes],
          status: 'active'
        })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setIsOnboardingModalOpen(false);
        setOnboardForm({
          businessName: '', ownerName: '', phone: '', email: '',
          fssaiLicense: '', city: 'Ahmedabad', address: '', cuisineTypes: 'Pure Gujarati Thali'
        });
        fetchProviders();
      }
    } catch (err) {
      console.error('Failed to onboard provider:', err);
    } finally {
      setSubmittingOnboard(false);
    }
  };

  // Compute counts
  const counts = useMemo(() => {
    let active = 0, pending = 0, suspended = 0, blocked = 0;
    const uniqueDistricts = new Set();

    providers.forEach(p => {
      const st = (p.status || 'active').toLowerCase();
      if (st === 'pending') pending++;
      else if (st === 'suspended') suspended++;
      else if (st === 'blocked' || st === 'offline') blocked++;
      else active++;

      if (p.city) uniqueDistricts.add(p.city);
    });

    const total = providers.length;
    return {
      total, active, pending, suspended, blocked,
      activePercent: total > 0 ? ((active / total) * 100).toFixed(1) : '0.0',
      churnPercent: total > 0 ? ((suspended / total) * 100).toFixed(1) : '0.0',
      districtsCount: uniqueDistricts.size || 0
    };
  }, [providers]);

  // Filter providers for table
  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      if (activeTabFilter === 'active' && p.status !== 'active') return false;
      if (activeTabFilter === 'pending' && p.status !== 'pending') return false;
      if (activeTabFilter === 'suspended' && p.status !== 'suspended') return false;
      if (activeTabFilter === 'blocked' && p.status !== 'blocked' && p.status !== 'offline') return false;
      return true;
    });
  }, [providers, activeTabFilter]);

  const columns = [
    {
      key: 'kitchenName',
      label: 'Kitchen Info',
      sortable: true,
      render: (val, row) => {
        const name = row.businessName || row.name || 'Kitchen';
        const initials = name.substring(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ded9d1] flex items-center justify-center font-serif text-[#4a4238] font-bold uppercase rounded-sm">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-[#1a1a1a] text-sm">{name}</span>
              <span className="text-[11px] text-[#665d52]">{row.legalName || name}</span>
              <span className="font-mono text-[10px] text-[#665d52] mt-0.5">FSSAI: {row.fssaiLicense || row.fssaiNumber || 'N/A'}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'contact',
      label: 'Contact & Hub',
      render: (val, row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-[#1a1a1a]">{row.ownerName || row.fullName || 'Partner'}</span>
          <span className="text-[#665d52]">{row.mobile || row.phone || 'No Phone'}</span>
          <span className="text-[#665d52]/80">{row.email || 'No Email'}</span>
          <span className="mt-1 text-[11px] font-medium text-[#1a1a1a] flex items-center gap-1">
             <Store size={12}/> {row.city || 'Ahmedabad'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Verification & Status',
      sortable: true,
      render: (val, row) => {
        const status = (row.status || 'active').toLowerCase();
        if (status === 'suspended') {
           return (
             <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[10px] uppercase font-bold border border-rose-200">
               <AlertTriangle size={12}/> Suspended
             </span>
           );
        }
        if (status === 'pending') {
           return (
             <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 font-mono text-[10px] uppercase font-bold border border-amber-200">
               <Clock size={12}/> Pending
             </span>
           );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono text-[10px] uppercase font-bold border border-emerald-200">
             <ShieldCheck size={12}/> Active & Verified
          </span>
        );
      }
    },
    {
      key: 'metrics',
      label: 'Orders & Revenue',
      render: (val, row) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold text-[#1a1a1a]">{row.ordersCount || 0} Total Orders</span>
          <span className="text-[#665d52]">Revenue: ₹{(row.revenue || 0).toLocaleString()}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Quick Controls',
      align: 'right',
      render: (val, row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status === 'pending' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(row._id, 'active'); }}
              className="px-2.5 py-1 bg-[#1a1a1a] text-white hover:bg-[#4a4238] font-sans text-[11px] uppercase tracking-wider font-semibold transition-colors"
            >
              Verify Docs
            </button>
          ) : row.status === 'suspended' ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(row._id, 'active'); }}
              className="px-2 py-1 bg-[#efeeea] hover:bg-[#ded9d1] font-sans text-[11px] uppercase tracking-wider text-rose-800 font-bold border border-[#ded9d1]"
            >
              Resolve Flag
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenProvider360 && onOpenProvider360(row._id); }}
              className="px-2 py-1 bg-[#efeeea] border border-[#ded9d1] hover:bg-[#ded9d1] font-sans text-[11px] uppercase tracking-wider text-[#1a1a1a] font-semibold transition-colors"
            >
              <Eye size={12} className="inline mr-1" />
              Inspect
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col w-full -m-4 sm:-m-6 md:-m-8 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* 1. Sub-header Breadcrumb Bar */}
      <div className="w-full px-8 py-4 bg-[#f5f3ef] border-b border-[#ded9d1] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tracking-widest uppercase text-[#665d52] font-semibold">SUPER ADMIN</span>
          <span className="text-[#665d52]/60 text-xs">/</span>
          <span className="font-mono text-[11px] tracking-widest uppercase text-[#665d52] font-semibold">PROVIDERS</span>
          <span className="text-[#665d52]/60 text-xs">/</span>
          <span className="font-mono text-[11px] tracking-widest uppercase text-[#1a1a1a] font-bold">DIRECTORY</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOnboardingModalOpen(true)}
            className="px-4 py-1.5 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#4a4238] transition-colors"
          >
            + Onboard Kitchen
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Top Level Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between shadow-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] font-bold">Total Registered</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl text-[#1a1a1a] font-bold">{counts.total}</span>
            </div>
          </div>
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between shadow-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] font-bold">Active & Dispatching</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl text-[#1a1a1a] font-bold">{counts.active}</span>
              <span className="font-mono text-[11px] text-emerald-800 font-bold">{counts.activePercent}%</span>
            </div>
          </div>
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between shadow-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] font-bold">Pending Verification</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl text-[#1a1a1a] font-bold">{counts.pending}</span>
            </div>
          </div>
          <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5 flex flex-col justify-between shadow-xs">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#665d52] font-bold">Suspended Flags</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl text-rose-700 font-bold">{counts.suspended}</span>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-1 border-b border-[#ded9d1] pb-2">
          {['all', 'active', 'pending', 'suspended'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTabFilter(tab)}
              className={`px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTabFilter === tab ? 'bg-[#1a1a1a] text-white' : 'text-[#665d52] hover:bg-[#ded9d1]/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredProviders}
          loading={loading}
          onRefresh={fetchProviders}
          title="Master Providers Directory"
          subtitle="Cryptographically attested registry"
          exportFileName="TiffinLink_Providers"
        />
      </div>

      {/* Onboarding Modal (Kept simple) */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f3ef] border border-[#ded9d1] max-w-xl w-full p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-2xl font-bold">Onboard Kitchen</h3>
                <button onClick={() => setIsOnboardingModalOpen(false)}><X size={20}/></button>
             </div>
             <form onSubmit={handleOnboardSubmit} className="space-y-4">
               <input
                 required placeholder="Kitchen Name" value={onboardForm.businessName}
                 onChange={e => setOnboardForm(p => ({...p, businessName: e.target.value}))}
                 className="w-full bg-[#efeeea] border border-[#ded9d1] px-3 py-2 text-xs"
               />
               <input
                 required placeholder="Owner Name" value={onboardForm.ownerName}
                 onChange={e => setOnboardForm(p => ({...p, ownerName: e.target.value}))}
                 className="w-full bg-[#efeeea] border border-[#ded9d1] px-3 py-2 text-xs"
               />
               <input
                 required placeholder="Phone" value={onboardForm.phone}
                 onChange={e => setOnboardForm(p => ({...p, phone: e.target.value}))}
                 className="w-full bg-[#efeeea] border border-[#ded9d1] px-3 py-2 text-xs"
               />
               <input
                 type="email" required placeholder="Email" value={onboardForm.email}
                 onChange={e => setOnboardForm(p => ({...p, email: e.target.value}))}
                 className="w-full bg-[#efeeea] border border-[#ded9d1] px-3 py-2 text-xs"
               />
               <button type="submit" disabled={submittingOnboard} className="w-full bg-[#1a1a1a] text-white py-2 text-xs font-bold uppercase">
                 {submittingOnboard ? 'Enrolling...' : 'Enroll Kitchen'}
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
