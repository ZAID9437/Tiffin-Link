import React, { useState, useEffect, useMemo } from 'react';

export default function ProviderProfilesTab({ onNavigate, onOpenProvider360 }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  // Drawer state for 360° dossier
  const [activeDossier, setActiveDossier] = useState(null);
  const [dossierTab, setDossierTab] = useState('overview');

  // Add Provider modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKitchen, setNewKitchen] = useState({
    name: '',
    owner: '',
    phone: '',
    cluster: 'Bodakdev Hub #04',
    quota: 30,
    fssai: '',
    cuisine: 'Pure Gujarati Thali'
  });

  const defaultProviders = [
    {
      id: 'xoxo',
      initial: 'X',
      name: 'Xoxo Men Kitchen',
      owner: 'Rahul Patel',
      phone: '+91 98251 44102',
      email: 'rahul@xoxomen.in',
      cluster: 'Bodakdev #04',
      clusterKey: 'bodakdev',
      zone: 'Zone A-West',
      cuisine: 'Pure Veg Kathiyawadi',
      cuisineKey: 'kathiyawadi',
      liveOrders: 16,
      totalOrders: 128,
      rating: 4.8,
      reviewsCount: 114,
      complianceTier: 'Tier-1 FSSAI',
      fssaiNumber: '#10822003001844',
      status: 'active',
      statusLabel: 'Active (16/30)',
      activePrepping: 16,
      maxQuota: 30,
      scheduled: 4,
      openQuota: 10,
      joinedDate: '14 Aug 2024',
      address: 'Bodakdev Cloud Cluster #04, SG Highway Link, Ahmedabad',
      gps: '23.0384° N, 72.5119° E',
      grossGmv: '₹42.5k',
      netPayout: '₹39.8k',
      platformFee: '₹2,125',
      pendingRelease: '₹10,000',
      acceptanceRate: '96.4%',
      onTimeRate: '97.2%',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBg9QrV3L214vUk1AkCK1lTaWMcMd74dkJ6q0IDVIsaVdbqhaPebT0YZkRyaZNYB33nMorBWrrMsovQ9PxB1rDnUoBpx3RfMkGtaEIkZpWKgg8-7GrpaKfgJOpJ1Ved1RavnLo7ncjWTWrzNGgTahV9jgwxhN5-N7EQi5wle5xdVeyaeXf6UJc-Da6tMX2eaPS-27zOMit-0qJUzimzV-_PqAQSsH2OcqHpXppsmsWosTo0FJeWu1sV'
    },
    {
      id: 'annapurna',
      initial: 'M',
      name: 'Maa Annapurna Rasoi',
      owner: 'Kavita Ben Shah',
      phone: '+91 94280 11982',
      email: 'kavita@annapurnarasoi.com',
      cluster: 'Navrangpura #01',
      clusterKey: 'navrangpura',
      zone: 'Zone B-Central',
      cuisine: 'Punjabi & Gujarati',
      cuisineKey: 'gujarati',
      liveOrders: 22,
      totalOrders: 94,
      rating: 4.6,
      reviewsCount: 88,
      complianceTier: 'Tier-1 FSSAI',
      fssaiNumber: '#10821004000319',
      status: 'active',
      statusLabel: 'Active (22/25)',
      activePrepping: 22,
      maxQuota: 25,
      scheduled: 2,
      openQuota: 1,
      joinedDate: '02 Jun 2024',
      address: 'Shop 12, Swastik Cross Rd, Navrangpura Central, Ahmedabad',
      gps: '23.0365° N, 72.5611° E',
      grossGmv: '₹38.2k',
      netPayout: '₹35.4k',
      platformFee: '₹1,910',
      pendingRelease: '₹8,400',
      acceptanceRate: '97.8%',
      onTimeRate: '95.1%',
      avatarUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'rasoi-express',
      initial: 'R',
      name: 'Rasoi Express',
      owner: 'Manish G. Dave',
      phone: '+91 97129 88341',
      email: 'manish@rasoiexpress.co',
      cluster: 'Vastrapur #02',
      clusterKey: 'vastrapur',
      zone: 'Zone A-South',
      cuisine: 'North Indian & Dal Bati',
      cuisineKey: 'punjabi',
      liveOrders: 0,
      totalOrders: 67,
      rating: 4.7,
      reviewsCount: 61,
      complianceTier: 'Docs In Review',
      fssaiNumber: 'Renewal Doc Uploaded',
      status: 'pending',
      statusLabel: 'Pending FSSAI',
      activePrepping: 0,
      maxQuota: 20,
      scheduled: 0,
      openQuota: 20,
      joinedDate: '19 Sep 2024',
      address: 'Near Vastrapur Lake, Vastrapur South, Ahmedabad',
      gps: '23.0350° N, 72.5293° E',
      grossGmv: '₹22.1k',
      netPayout: '₹20.4k',
      platformFee: '₹1,105',
      pendingRelease: '₹4,500',
      acceptanceRate: '94.2%',
      onTimeRate: '96.0%',
      avatarUrl: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'shreenathji',
      initial: 'S',
      name: 'Shreenathji Dining Hall',
      owner: 'Dharmesh Trivedi',
      phone: '+91 99092 33411',
      email: 'dharmesh@shreenathji.in',
      cluster: 'Paldi #03',
      clusterKey: 'paldi',
      zone: 'Zone C-East',
      cuisine: 'Satvik Pure Jain',
      cuisineKey: 'jain',
      liveOrders: 8,
      totalOrders: 48,
      rating: 4.9,
      reviewsCount: 46,
      complianceTier: 'Tier-1 FSSAI',
      fssaiNumber: '#10823001004921',
      status: 'active',
      statusLabel: 'Active (8/20)',
      activePrepping: 8,
      maxQuota: 20,
      scheduled: 3,
      openQuota: 9,
      joinedDate: '28 Jul 2024',
      address: 'Paldi Cross Road, Old Town Hub, Ahmedabad',
      gps: '23.0125° N, 72.5622° E',
      grossGmv: '₹18.9k',
      netPayout: '₹17.2k',
      platformFee: '₹945',
      pendingRelease: '₹3,200',
      acceptanceRate: '99.1%',
      onTimeRate: '98.5%',
      avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'tulsi',
      initial: 'T',
      name: 'Tulsi Kathiyawadi',
      owner: 'Bhavik Patel',
      phone: '+91 98980 55190',
      email: 'bhavik@tulsirasoi.com',
      cluster: 'Chandkheda #02',
      clusterKey: 'chandkheda',
      zone: 'Zone D-North',
      cuisine: 'Woodfire Kathiyawadi',
      cuisineKey: 'kathiyawadi',
      liveOrders: 0,
      totalOrders: 112,
      rating: 4.7,
      reviewsCount: 98,
      complianceTier: 'Audit Breached',
      fssaiNumber: '24m Delay SLA',
      status: 'suspended',
      statusLabel: 'Suspended',
      activePrepping: 0,
      maxQuota: 25,
      scheduled: 0,
      openQuota: 0,
      joinedDate: '11 May 2024',
      address: 'Chandkheda Ring Road, North Grid, Ahmedabad',
      gps: '23.1118° N, 72.5855° E',
      grossGmv: '₹51.0k',
      netPayout: '₹47.1k',
      platformFee: '₹2,550',
      pendingRelease: '₹0',
      acceptanceRate: '91.0%',
      onTimeRate: '88.2%',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'anand',
      initial: 'A',
      name: 'Kitchen Anand',
      owner: 'Anand Soni',
      phone: '+91 93740 44211',
      email: 'anand@kitchenanand.in',
      cluster: 'Navrangpura #04',
      clusterKey: 'navrangpura',
      zone: 'Zone B-Central',
      cuisine: 'Gujarati Thali',
      cuisineKey: 'gujarati',
      liveOrders: 0,
      totalOrders: 85,
      rating: 4.8,
      reviewsCount: 79,
      complianceTier: 'Tier-1 FSSAI',
      fssaiNumber: '#10822002009841',
      status: 'offline',
      statusLabel: 'Offline',
      activePrepping: 0,
      maxQuota: 25,
      scheduled: 5,
      openQuota: 20,
      joinedDate: '15 Mar 2024',
      address: 'Commerce Six Roads, Navrangpura, Ahmedabad',
      gps: '23.0410° N, 72.5510° E',
      grossGmv: '₹34.7k',
      netPayout: '₹32.1k',
      platformFee: '₹1,735',
      pendingRelease: '₹5,100',
      acceptanceRate: '95.5%',
      onTimeRate: '96.8%',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    }
  ];

  // Fetch real providers from API
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/admin/providers');
      const json = await res.json();
      if (json.success && Array.isArray(json.providers) && json.providers.length > 0) {
        // Map live DB entries and blend with baseline schema
        const mapped = json.providers.map((p, idx) => {
          const fallback = defaultProviders[idx % defaultProviders.length];
          return {
            id: p._id || fallback.id,
            initial: (p.businessName || p.name || 'K')[0].toUpperCase(),
            name: p.businessName || p.name || fallback.name,
            owner: p.ownerName || p.fullName || fallback.owner,
            phone: p.phone || p.mobile || fallback.phone,
            email: p.email || fallback.email,
            cluster: p.address?.locality ? `${p.address.locality} Hub` : fallback.cluster,
            clusterKey: 'bodakdev',
            zone: 'Zone Central',
            cuisine: p.cuisineTypes || p.cuisineType || fallback.cuisine,
            cuisineKey: 'gujarati',
            liveOrders: p.activeOrdersCount || fallback.liveOrders,
            totalOrders: p.totalOrdersCount || fallback.totalOrders,
            rating: p.rating || fallback.rating,
            reviewsCount: p.totalReviews || fallback.reviewsCount,
            complianceTier: p.fssaiLicense ? 'Tier-1 FSSAI' : fallback.complianceTier,
            fssaiNumber: p.fssaiLicense ? `#${p.fssaiLicense}` : fallback.fssaiNumber,
            status: p.status || fallback.status,
            statusLabel: p.status === 'active' ? `Active (${p.currentCapacity || 16}/${p.maxCapacity || 30})` : p.status,
            activePrepping: p.currentCapacity || fallback.activePrepping,
            maxQuota: p.maxCapacity || fallback.maxQuota,
            scheduled: 4,
            openQuota: Math.max(0, (p.maxCapacity || 30) - (p.currentCapacity || 16)),
            joinedDate: new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            address: typeof p.address === 'object' ? `${p.address?.houseNo || ''} ${p.address?.street || ''} ${p.address?.locality || 'Ahmedabad'}` : fallback.address,
            gps: fallback.gps,
            grossGmv: fallback.grossGmv,
            netPayout: fallback.netPayout,
            platformFee: fallback.platformFee,
            pendingRelease: fallback.pendingRelease,
            acceptanceRate: fallback.acceptanceRate,
            onTimeRate: fallback.onTimeRate,
            avatarUrl: fallback.avatarUrl
          };
        });
        setProviders(mapped);
      } else {
        setProviders(defaultProviders);
      }
    } catch (err) {
      console.warn('API fetch failed, utilizing baseline providers:', err);
      setProviders(defaultProviders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Filter providers
  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (clusterFilter !== 'all' && p.clusterKey !== clusterFilter) return false;
      if (cuisineFilter !== 'all' && p.cuisineKey !== cuisineFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q) ||
          p.fssaiNumber.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [providers, statusFilter, clusterFilter, cuisineFilter, search]);

  // Open Dossier
  const handleOpenDossier = (provider) => {
    setActiveDossier(provider);
    setDossierTab('overview');
  };

  // Suspend action
  const handleSuspendToggle = async (provider) => {
    const isSuspending = provider.status !== 'suspended';
    const msg = isSuspending
      ? `CRITICAL: Are you sure you want to suspend ${provider.name}? Active orders and driver dispatches will halt immediately.`
      : `Re-activate kitchen operations for ${provider.name}?`;
    
    if (window.confirm(msg)) {
      try {
        await fetch(`http://localhost:5000/api/admin/providers/${provider.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: isSuspending ? 'suspended' : 'active' })
        });
      } catch (e) {
        console.warn('Backend patch error:', e);
      }
      setProviders(prev => prev.map(item => item.id === provider.id ? {
        ...item,
        status: isSuspending ? 'suspended' : 'active',
        statusLabel: isSuspending ? 'Suspended' : `Active (${item.activePrepping}/${item.maxQuota})`
      } : item));
      if (activeDossier && activeDossier.id === provider.id) {
        setActiveDossier(prev => ({
          ...prev,
          status: isSuspending ? 'suspended' : 'active',
          statusLabel: isSuspending ? 'Suspended' : `Active (${prev.activePrepping}/${prev.maxQuota})`
        }));
      }
      alert(`${provider.name} status updated to: ${isSuspending ? 'SUSPENDED' : 'ACTIVE'}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const header = 'Kitchen Legal Name,Owner Contact,Mobile Phone,Cluster Hub,Cuisine,Live Orders,Total Orders,Rating,FSSAI,Status\n';
    const rows = providers.map(p => `"${p.name}","${p.owner}","${p.phone}","${p.cluster}","${p.cuisine}",${p.liveOrders},${p.totalOrders},${p.rating},"${p.fssaiNumber}","${p.status}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TiffinLink_Providers_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Provider Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `custom-${Date.now()}`,
      initial: newKitchen.name[0]?.toUpperCase() || 'K',
      name: newKitchen.name,
      owner: newKitchen.owner,
      phone: newKitchen.phone,
      email: `${newKitchen.name.toLowerCase().replace(/\s+/g, '')}@tiffinlink.partner`,
      cluster: newKitchen.cluster,
      clusterKey: 'bodakdev',
      zone: 'Zone Ahmedabad',
      cuisine: newKitchen.cuisine,
      cuisineKey: 'kathiyawadi',
      liveOrders: 0,
      totalOrders: 0,
      rating: 5.0,
      reviewsCount: 0,
      complianceTier: 'Tier-1 FSSAI',
      fssaiNumber: `#${newKitchen.fssai || '10822003009988'}`,
      status: 'active',
      statusLabel: `Active (0/${newKitchen.quota})`,
      activePrepping: 0,
      maxQuota: Number(newKitchen.quota),
      scheduled: 0,
      openQuota: Number(newKitchen.quota),
      joinedDate: 'Today',
      address: `${newKitchen.cluster}, Ahmedabad`,
      gps: '23.0384° N, 72.5119° E',
      grossGmv: '₹0',
      netPayout: '₹0',
      platformFee: '₹0',
      pendingRelease: '₹0',
      acceptanceRate: '100%',
      onTimeRate: '100%',
      avatarUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop&q=80'
    };
    setProviders(prev => [newEntry, ...prev]);
    setIsAddModalOpen(false);
    alert(`Kitchen "${newKitchen.name}" registered successfully. Verification ticket dispatched to cluster admin.`);
    setNewKitchen({
      name: '',
      owner: '',
      phone: '',
      cluster: 'Bodakdev Hub #04',
      quota: 30,
      fssai: '',
      cuisine: 'Pure Gujarati Thali'
    });
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 max-w-[1560px] mx-auto w-full">
        
        {/* Top Metadata Header (Rigid, Typographic, Editorial Brutalist) */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Structured Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-[#665d52] uppercase">
              <span className="hover:text-[#1b1c1a] cursor-pointer">Super Admin</span>
              <span>/</span>
              <span className="hover:text-[#1b1c1a] cursor-pointer">Management</span>
              <span>/</span>
              <span className="hover:text-[#1b1c1a] cursor-pointer">Providers</span>
              <span>/</span>
              <span className="text-[#1b1c1a] font-semibold bg-[#efeeea] px-2 py-0.5">
                Profiles &amp; 360° Directory
              </span>
            </nav>

            {/* Node & Engine Stamp */}
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eae8e4] text-[#1b1c1a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></span>
                SYNC: POSTGRES-READ-REPLICA-03
              </span>
              <span className="text-[#665d52]">TLS 1.3 STRICT</span>
            </div>
          </div>

          {/* Main Headline + Editorial Intent & Action Buttons */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
            <div className="flex flex-col gap-2 max-w-3xl">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight leading-none">
                Provider Profiles
              </h1>
              <p className="font-sans text-base text-[#665d52] max-w-2xl font-light">
                Comprehensive registry, compliance dossiers, and 360° lifecycle controls across Ahmedabad Central kitchen nodes.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start xl:self-end">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-[#efeeea] text-[#1b1c1a] hover:bg-[#e4e2de] transition-colors font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-2 border border-[#ded9d1]"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span>Export Registry (CSV)</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-neutral-800 transition-colors font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Add Provider</span>
              </button>
            </div>
          </div>
        </header>

        {/* Structural KPI Matrix: Architectural Planar Tonal Cards */}
        <section aria-label="System Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Total Kitchens */}
          <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Total Registered</span>
              <span className="font-mono text-[10px] text-[#665d52] px-1.5 py-0.5 bg-[#efeeea]">ALL TIME</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#1a1a1a] font-normal">{providers.length}</span>
                <span className="font-mono text-xs text-[#665d52] font-medium">Nodes</span>
              </div>
              <p className="font-mono text-[11px] text-[#665d52] mt-1">Cluster: AMD-Central Grid</p>
            </div>
          </div>

          {/* Active Dispatching */}
          <div className="bg-[#efeeea] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#1a1a1a] uppercase font-semibold">Active Dispatching</span>
              <span className="w-2 h-2 rounded-full bg-[#1a1a1a] animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#1a1a1a] font-normal">
                  {providers.filter(p => p.status === 'active').length}
                </span>
                <span className="font-mono text-xs text-[#1a1a1a] font-semibold">73.8%</span>
              </div>
              <div className="w-full bg-[#e4e2de] h-1 mt-2">
                <div className="bg-[#1a1a1a] h-1" style={{ width: '73.8%' }}></div>
              </div>
            </div>
          </div>

          {/* Pending KYC / FSSAI */}
          <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Pending KYC / FSSAI</span>
              <span className="font-mono text-[11px] text-[#4a4238] font-medium">INSPECT</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#4a4238] font-normal">
                  {String(providers.filter(p => p.status === 'pending').length).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs text-[#665d52]">In verification</span>
              </div>
              <p className="font-mono text-[11px] text-[#665d52] mt-1">SLA target: &lt; 24h review</p>
            </div>
          </div>

          {/* Suspended / SLA Flag */}
          <div className="bg-[#ffdad6]/30 p-5 flex flex-col justify-between h-36 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#ba1a1a] uppercase font-semibold">Suspended / Warnings</span>
              <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">report_problem</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#ba1a1a] font-normal">
                  {String(providers.filter(p => p.status === 'suspended').length).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs text-[#ba1a1a]">Critical actions</span>
              </div>
              <p className="font-mono text-[11px] text-[#ba1a1a]/80 mt-1">Quality audits &amp; SLA breaches</p>
            </div>
          </div>

          {/* Offline / Scheduled */}
          <div className="bg-[#f5f3ef] p-5 flex flex-col justify-between h-36 border border-[#ded9d1]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">Offline / Scheduled</span>
              <span className="font-mono text-[10px] text-[#665d52]">OFF SHIFT</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#665d52] font-normal">
                  {String(providers.filter(p => p.status === 'offline').length).padStart(2, '0')}
                </span>
                <span className="font-mono text-xs text-[#665d52]">Batch resting</span>
              </div>
              <p className="font-mono text-[11px] text-[#665d52] mt-1">Evening load opens 18:00</p>
            </div>
          </div>
        </section>

        {/* Operational Filter Bar: Clean Linear Functional Interface */}
        <section className="bg-white p-5 shadow-sm border border-[#ded9d1]/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input with strict architectural stroke */}
          <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-[#f5f3ef] focus-within:bg-[#efeeea] transition-colors border border-[#ded9d1]/50">
            <span className="material-symbols-outlined text-[20px] text-[#665d52]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search kitchen name, owner, FSSAI #, phone..."
              className="w-full bg-transparent text-sm font-sans text-[#1a1a1a] placeholder:text-[#665d52]/70 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="font-mono text-[10px] text-[#665d52] px-1.5 py-0.5 bg-[#e4e2de] hover:bg-[#ded9d1]"
              >
                ESC TO CLEAR
              </button>
            )}
          </div>

          {/* Segmented Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-2 pr-8 font-sans text-xs uppercase tracking-wider text-[#1a1a1a] cursor-pointer focus:outline-none"
              >
                <option value="all">Status: All ({providers.length})</option>
                <option value="active">Active ({providers.filter(p => p.status === 'active').length})</option>
                <option value="pending">Pending KYC ({providers.filter(p => p.status === 'pending').length})</option>
                <option value="suspended">Suspended ({providers.filter(p => p.status === 'suspended').length})</option>
                <option value="offline">Offline ({providers.filter(p => p.status === 'offline').length})</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[16px] text-[#665d52]">
                expand_more
              </span>
            </div>

            {/* Cluster Filter */}
            <div className="relative">
              <select
                value={clusterFilter}
                onChange={(e) => setClusterFilter(e.target.value)}
                className="appearance-none bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-2 pr-8 font-sans text-xs uppercase tracking-wider text-[#1a1a1a] cursor-pointer focus:outline-none"
              >
                <option value="all">Cluster: All Ahmedabad</option>
                <option value="bodakdev">Bodakdev Hub</option>
                <option value="navrangpura">Navrangpura Hub</option>
                <option value="vastrapur">Vastrapur Central</option>
                <option value="paldi">Paldi Old Town</option>
                <option value="chandkheda">Chandkheda North</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[16px] text-[#665d52]">
                expand_more
              </span>
            </div>

            {/* Cuisine Filter */}
            <div className="relative">
              <select
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
                className="appearance-none bg-[#f5f3ef] border border-[#ded9d1]/60 px-3 py-2 pr-8 font-sans text-xs uppercase tracking-wider text-[#1a1a1a] cursor-pointer focus:outline-none"
              >
                <option value="all">Cuisine: All</option>
                <option value="kathiyawadi">Kathiyawadi</option>
                <option value="gujarati">Gujarati Homestyle</option>
                <option value="jain">Pure Jain Satvik</option>
                <option value="punjabi">Punjabi Tiffin</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[16px] text-[#665d52]">
                expand_more
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setClusterFilter('all');
                setCuisineFilter('all');
              }}
              className="p-2 text-[#665d52] hover:text-[#1a1a1a] hover:bg-[#f5f3ef] border border-[#ded9d1]/60 transition-colors"
              title="Reset Filters"
            >
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            </button>
          </div>
        </section>

        {/* Master Registry Grid: Editorial Monospace Details + Precision Actions */}
        <section className="bg-white shadow-sm border border-[#ded9d1]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f3ef] text-[#665d52] font-mono text-[11px] tracking-widest uppercase border-b border-[#ded9d1]/60">
                  <th className="py-3 px-5 font-semibold">Kitchen &amp; Owner</th>
                  <th className="py-3 px-4 font-semibold">Cluster Hub</th>
                  <th className="py-3 px-4 font-semibold">Verified Cuisine</th>
                  <th className="py-3 px-4 font-semibold">Orders (Act / Tot)</th>
                  <th className="py-3 px-4 font-semibold">Rating</th>
                  <th className="py-3 px-4 font-semibold">Compliance Tier</th>
                  <th className="py-3 px-4 font-semibold">Operational Status</th>
                  <th className="py-3 px-5 text-right font-semibold">Direct 360° Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]/40 font-sans text-[#1a1a1a]">
                {filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#665d52] font-mono text-sm">
                      No registered kitchen nodes match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#f5f3ef]/70 transition-colors group ${
                        p.status === 'suspended'
                          ? 'bg-red-50/20 hover:bg-red-50/30'
                          : p.status === 'pending'
                          ? 'bg-[#f5f3ef]/30'
                          : ''
                      }`}
                    >
                      {/* Kitchen & Owner */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center font-serif text-lg font-bold ${
                              p.status === 'suspended'
                                ? 'bg-red-100 text-[#ba1a1a]'
                                : 'bg-[#eae8e4] text-[#1a1a1a]'
                            }`}
                          >
                            {p.initial}
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => handleOpenDossier(p)}
                              className={`font-medium group-hover:underline cursor-pointer flex items-center gap-1.5 ${
                                p.status === 'suspended' ? 'text-[#ba1a1a]' : 'text-[#1a1a1a]'
                              }`}
                            >
                              <span>{p.name}</span>
                              {p.complianceTier.includes('Tier-1') && (
                                <span className="material-symbols-outlined text-[14px] text-[#665d52]">verified</span>
                              )}
                            </div>
                            <div className="text-xs text-[#665d52] font-mono">
                              {p.owner} • {p.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cluster Hub */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="font-semibold text-[#1a1a1a]">{p.cluster}</div>
                        <div className="text-[10px] text-[#665d52]">{p.zone}</div>
                      </td>

                      {/* Verified Cuisine */}
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-[#efeeea] font-mono text-[11px] text-[#1a1a1a] border border-[#ded9d1]/40">
                          {p.cuisine}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <span className={`font-bold ${p.status === 'suspended' ? 'text-[#ba1a1a]' : 'text-[#1a1a1a]'}`}>
                          {p.status === 'suspended' ? 'Locked' : `${p.liveOrders} live`}
                        </span>
                        <span className="text-[#665d52]"> / {p.totalOrders} total</span>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <span className="font-semibold text-[#1a1a1a]">{p.rating}</span>
                        <span className="text-[#665d52]"> ★ ({p.reviewsCount})</span>
                      </td>

                      {/* Compliance Tier */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`font-mono text-[11px] font-semibold ${
                              p.status === 'suspended'
                                ? 'text-[#ba1a1a]'
                                : p.status === 'pending'
                                ? 'text-[#4a4238]'
                                : 'text-[#1a1a1a]'
                            }`}
                          >
                            {p.complianceTier}
                          </span>
                          <span
                            className={`text-[10px] font-mono ${
                              p.status === 'suspended' ? 'text-[#ba1a1a]' : 'text-[#665d52]'
                            }`}
                          >
                            {p.fssaiNumber}
                          </span>
                        </div>
                      </td>

                      {/* Operational Status */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.status === 'active'
                                ? 'bg-[#1a1a1a]'
                                : p.status === 'pending'
                                ? 'bg-[#4a4238]'
                                : p.status === 'suspended'
                                ? 'bg-[#ba1a1a]'
                                : 'bg-[#c4c7c7]'
                            }`}
                          ></span>
                          <span
                            className={`font-mono text-xs font-medium ${
                              p.status === 'suspended'
                                ? 'text-[#ba1a1a] font-semibold'
                                : p.status === 'pending'
                                ? 'text-[#4a4238]'
                                : 'text-[#1a1a1a]'
                            }`}
                          >
                            {p.statusLabel}
                          </span>
                        </div>
                      </td>

                      {/* Direct 360° Controls */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDossier(p)}
                            className="px-2.5 py-1 bg-[#efeeea] hover:bg-[#1a1a1a] hover:text-white transition-colors font-sans text-xs uppercase tracking-wider font-semibold border border-[#ded9d1]"
                          >
                            Inspect 360°
                          </button>
                          <button
                            onClick={() => onNavigate && onNavigate('providers-orders')}
                            className="p-1 hover:bg-[#efeeea] text-[#665d52] hover:text-[#1a1a1a] transition-colors"
                            title="View Orders"
                          >
                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                          </button>
                          <button
                            onClick={() => onNavigate && onNavigate('providers-settlements')}
                            className="p-1 hover:bg-[#efeeea] text-[#665d52] hover:text-[#1a1a1a] transition-colors"
                            title="Financial Ledger"
                          >
                            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                          </button>
                          <button
                            onClick={() => handleSuspendToggle(p)}
                            className={`p-1 transition-colors ${
                              p.status === 'suspended'
                                ? 'hover:bg-emerald-100 text-[#1a1a1a] hover:text-emerald-800'
                                : 'hover:bg-red-100 text-[#665d52] hover:text-[#ba1a1a]'
                            }`}
                            title={p.status === 'suspended' ? 'Re-activate Provider' : 'Suspend Provider'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {p.status === 'suspended' ? 'check_circle' : 'block'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination and Registry Metadata Footer */}
          <div className="p-4 bg-[#f5f3ef] border-t border-[#ded9d1]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-xs text-[#665d52]">
              <span>SHOWING 1 - {filteredProviders.length} OF {providers.length} PROVIDER NODES</span>
              <span>•</span>
              <span className="text-[#1a1a1a]">PAGE 1 OF 1</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs">
              <button className="px-3 py-1.5 bg-[#eae8e4] text-[#665d52] opacity-60 cursor-not-allowed" disabled>
                PREV
              </button>
              <button className="px-3 py-1.5 bg-[#1a1a1a] text-white font-semibold">1</button>
              <button className="px-3 py-1.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a]">2</button>
              <button className="px-3 py-1.5 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a]">NEXT</button>
            </div>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE SLIDE-OUT / DRAWER: 360° OPERATIONAL DOSSIER */}
      {/* ========================================================================= */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveDossier(null)}
          />

          <aside className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col justify-between overflow-hidden z-50">
            {/* Drawer Fixed Header */}
            <div className="p-6 bg-[#f5f3ef] border-b border-[#ded9d1]/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[#665d52] uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#1a1a1a]"></span>
                  <span>Node 360° Dossier • Ref: TL-KTC-{activeDossier.id.toUpperCase().slice(0, 6)}</span>
                </div>
                <button
                  aria-label="Close Dossier"
                  onClick={() => setActiveDossier(null)}
                  className="p-1 hover:bg-[#efeeea] text-[#665d52] hover:text-[#1a1a1a] transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Identity Strip with Rich Editorial Composition */}
              <div className="flex items-start gap-4">
                <img
                  className="w-16 h-16 object-cover bg-[#eae8e4] flex-shrink-0 border border-[#ded9d1]"
                  src={activeDossier.avatarUrl}
                  alt={activeDossier.name}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl text-[#1a1a1a] leading-tight truncate">
                      {activeDossier.name}
                    </h2>
                    <span className="px-2 py-0.5 bg-[#efeeea] text-[#1a1a1a] font-mono text-[11px] font-semibold border border-[#ded9d1]">
                      TIER-1
                    </span>
                  </div>
                  <p className="font-mono text-xs text-[#665d52] mt-0.5">
                    Owner: {activeDossier.owner} • {activeDossier.phone} • {activeDossier.email}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs font-mono text-[#665d52]">
                    <span>{activeDossier.cluster}, Ahmedabad</span>
                    <span>•</span>
                    <span>Joined: {activeDossier.joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Quick Sub-Navigation Modules Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pt-2 font-sans text-xs font-semibold uppercase tracking-wider">
                {[
                  { id: 'overview', label: 'Overview 360°' },
                  { id: 'live', label: `Live Orders (${activeDossier.liveOrders})` },
                  { id: 'history', label: 'Order History' },
                  { id: 'financials', label: 'Financial Ledger' },
                  { id: 'telemetry', label: 'Telemetry & Audit' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDossierTab(t.id)}
                    className={`px-3 py-1.5 whitespace-nowrap transition-colors ${
                      dossierTab === t.id
                        ? 'bg-[#1a1a1a] text-white'
                        : 'bg-[#efeeea] text-[#1a1a1a] hover:bg-[#eae8e4]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Dossier Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 bg-white">
              
              {/* ========================================================================= */}
              {/* TAB 1: OVERVIEW 360° */}
              {/* ========================================================================= */}
              {dossierTab === 'overview' && (
                <>
                  {/* Capacity & Operational Load (High Impact Graphic) */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-semibold">
                        Real-Time Kitchen Load &amp; Batch Quota
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#1a1a1a]">
                        {activeDossier.activePrepping} / {activeDossier.maxQuota} Tiffins Reserved
                      </span>
                    </div>
                    <div className="w-full bg-[#efeeea] h-3 flex overflow-hidden border border-[#ded9d1]">
                      <div
                        className="bg-[#1a1a1a] h-3 transition-all duration-500"
                        style={{ width: `${Math.round((activeDossier.activePrepping / activeDossier.maxQuota) * 100)}%` }}
                      ></div>
                      <div
                        className="bg-[#4a4238] h-3 transition-all duration-500"
                        style={{ width: `${Math.round((activeDossier.scheduled / activeDossier.maxQuota) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#665d52]">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#1a1a1a]"></span> Active Prepping ({activeDossier.activePrepping})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#4a4238]"></span> Scheduled ({activeDossier.scheduled})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#e4e2de]"></span> Open Quota ({activeDossier.openQuota})
                        </span>
                      </div>
                      <span>Shift Ends: 21:30 IST</span>
                    </div>
                  </div>

                  {/* Bento Grid for Profile Attributes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Business & Schedule Card */}
                    <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col gap-2">
                      <span className="font-mono text-xs text-[#665d52] uppercase font-bold tracking-wider">
                        Business &amp; Windows
                      </span>
                      <div className="font-mono text-xs text-[#1a1a1a] flex flex-col gap-1.5 mt-1">
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Cuisine:</span>
                          <span className="font-semibold">{activeDossier.cuisine}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Batches:</span>
                          <span>Lunch (11-14) / Dinner (18-21:30)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Kitchen Class:</span>
                          <span>Commercial Cloud Unit</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Avg Prep:</span>
                          <span>18 mins / tiffin</span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance & Regulatory Card */}
                    <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col gap-2">
                      <span className="font-mono text-xs text-[#665d52] uppercase font-bold tracking-wider">
                        Regulatory &amp; Audits
                      </span>
                      <div className="font-mono text-xs text-[#1a1a1a] flex flex-col gap-1.5 mt-1">
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">FSSAI Lic:</span>
                          <span className="font-semibold text-[#1a1a1a]">{activeDossier.fssaiNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Valid Till:</span>
                          <span>31 Mar 2026 (Active)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Water Audit:</span>
                          <span className="font-semibold text-emerald-800">Passed (99.4%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#665d52]">Bank Escrow:</span>
                          <span>HDFC Bank (Verified)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Lifecycle Summary */}
                  <div className="p-5 bg-[#efeeea] border border-[#ded9d1] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#665d52] uppercase font-bold tracking-wider">
                        Platform Ledger Lifecycle
                      </span>
                      <span className="font-mono text-xs text-[#1a1a1a]">Rolling Cycle (BOM-IND-01)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      <div>
                        <span className="font-mono text-[10px] text-[#665d52] uppercase block">Gross GMV</span>
                        <span className="font-serif text-2xl text-[#1a1a1a] font-light leading-tight">
                          {activeDossier.grossGmv}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-[#665d52] uppercase block">Provider Net</span>
                        <span className="font-serif text-2xl text-[#1a1a1a] font-light leading-tight">
                          {activeDossier.netPayout}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-[#665d52] uppercase block">Platform (5%)</span>
                        <span className="font-serif text-2xl text-[#1a1a1a] font-light leading-tight">
                          {activeDossier.platformFee}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-[#665d52] uppercase block">Pending Release</span>
                        <span className="font-serif text-2xl text-[#4a4238] font-light leading-tight">
                          {activeDossier.pendingRelease}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Telemetry Sparklines */}
                  <div className="flex flex-col gap-3">
                    <span className="font-mono text-xs text-[#665d52] uppercase font-bold tracking-wider">
                      Performance Vector &amp; Health Metrics
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col justify-between">
                        <span className="font-mono text-[10px] text-[#665d52]">ACCEPTANCE RATE</span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="font-serif text-2xl text-[#1a1a1a] leading-none">{activeDossier.acceptanceRate}</span>
                          <span className="material-symbols-outlined text-[16px] text-[#1a1a1a]">arrow_outward</span>
                        </div>
                        {/* SVG Mini Sparkline */}
                        <svg className="w-full h-6 mt-2 text-[#1a1a1a]" fill="none" viewBox="0 0 100 25">
                          <path d="M0,20 L20,16 L40,18 L60,10 L80,12 L100,5" stroke="currentColor" strokeWidth="1.5"></path>
                        </svg>
                      </div>

                      <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col justify-between">
                        <span className="font-mono text-[10px] text-[#665d52]">ON-TIME DISPATCH</span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="font-serif text-2xl text-[#1a1a1a] leading-none">{activeDossier.onTimeRate}</span>
                          <span className="material-symbols-outlined text-[16px] text-[#1a1a1a]">check_circle</span>
                        </div>
                        <svg className="w-full h-6 mt-2 text-[#1a1a1a]" fill="none" viewBox="0 0 100 25">
                          <path d="M0,15 L20,12 L40,14 L60,8 L80,9 L100,4" stroke="currentColor" strokeWidth="1.5"></path>
                        </svg>
                      </div>

                      <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col justify-between">
                        <span className="font-mono text-[10px] text-[#665d52]">FEEDBACK SCORE</span>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="font-serif text-2xl text-[#1a1a1a] leading-none">{activeDossier.rating} ★</span>
                          <span className="font-mono text-[10px] text-[#665d52]">{activeDossier.reviewsCount} REV</span>
                        </div>
                        <svg className="w-full h-6 mt-2 text-[#1a1a1a]" fill="none" viewBox="0 0 100 25">
                          <path d="M0,10 L25,12 L50,8 L75,9 L100,7" stroke="currentColor" strokeWidth="1.5"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Live Order Snapshot (Nested Minimal Table) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#665d52] uppercase font-bold tracking-wider">
                        Current Queue in Progress
                      </span>
                      <span className="font-mono text-xs text-[#665d52]">{activeDossier.liveOrders} Batches in Pan</span>
                    </div>
                    <div className="bg-[#f5f3ef] border border-[#ded9d1]/60 divide-y divide-[#ded9d1]/50 font-mono text-xs">
                      <div className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">#ORD-9842</span>
                          <span className="text-[#665d52] ml-2">Deluxe Kathiyawadi Thali (x2)</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#e4e2de] text-[#1a1a1a] text-[10px]">PACKING • 4m left</span>
                      </div>
                      <div className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">#ORD-9845</span>
                          <span className="text-[#665d52] ml-2">Sev Tameta + 4 Bajra Rotla</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#e4e2de] text-[#1a1a1a] text-[10px]">DISPATCHED • Rider #14</span>
                      </div>
                      <div className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">#ORD-9848</span>
                          <span className="text-[#665d52] ml-2">Light Ringan Bhartu Meal</span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#e4e2de] text-[#1a1a1a] text-[10px]">SIMMERING • 12m left</span>
                      </div>
                    </div>
                  </div>

                  {/* Kitchen Physical Location & Visual Documentation */}
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-[#665d52] uppercase font-bold tracking-wider">
                      Kitchen Geometry &amp; Verified Premises
                    </span>
                    <div
                      className="w-full h-44 bg-[#eae8e4] bg-cover bg-center flex items-end p-3 border border-[#ded9d1]"
                      style={{
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80')`
                      }}
                    >
                      <div className="bg-white/95 backdrop-blur-sm p-2 font-mono text-xs flex items-center justify-between w-full border border-[#ded9d1]">
                        <span className="text-[#1a1a1a] truncate mr-2">{activeDossier.address}</span>
                        <span className="text-[#665d52] shrink-0">GPS: {activeDossier.gps}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: LIVE ORDERS FOR THIS KITCHEN */}
              {/* ========================================================================= */}
              {dossierTab === 'live' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]/60">
                    <div>
                      <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-bold">
                        Active Kitchen Dispatch Stream
                      </span>
                      <h3 className="font-serif text-xl text-[#1a1a1a] mt-0.5">
                        {activeDossier.name} • {activeDossier.liveOrders} Active Tickets
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span className="font-mono text-xs text-emerald-800 font-semibold">Kitchen Pan Hot</span>
                    </div>
                  </div>

                  {/* Live Tickets List */}
                  <div className="space-y-3 font-sans">
                    {[
                      {
                        id: '4956',
                        meal: `${activeDossier.cuisine} Signature Thali × 2`,
                        customer: 'Aarav Sharma',
                        address: 'Tower 4B, Prerna Apts (1.2 km)',
                        stage: 'READY FOR COURIER',
                        stageClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                        timer: 'Pack complete: Staged Rack #B-04',
                        courier: 'Rahul Patel (GJ-01-ET-4412)',
                        courierStatus: 'ETA 3m to kitchen',
                        amount: '₹372'
                      },
                      {
                        id: '4959',
                        meal: 'Sev Tameta + 8 Phulkas + Chaas Box × 1',
                        customer: 'Priya Desai',
                        address: 'Judges Bungalow (3.1 km)',
                        stage: 'IN TRANSIT',
                        stageClass: 'bg-[#1a1a1a] text-white border-transparent',
                        timer: 'Dispatched 12m ago',
                        courier: 'Aman Varma (GJ-27-AK-1088)',
                        courierStatus: 'Dropping off in 4m',
                        amount: '₹260'
                      },
                      {
                        id: '4961',
                        meal: 'Dal Bati Churma Homestyle Banquet × 1',
                        customer: 'Karan Mehta',
                        address: 'Satellite Central (0.8 km)',
                        stage: 'PREPARING',
                        stageClass: 'bg-amber-100 text-amber-900 border-amber-300',
                        timer: 'Stove #2 simmering (8m in)',
                        courier: 'Searching Driver Pool',
                        courierStatus: '2 couriers pinged',
                        amount: '₹195'
                      },
                      {
                        id: '4964',
                        meal: 'Kathiyawadi Village Khichdi-Kadhi × 1',
                        customer: 'Deepal Trivedi',
                        address: 'Prahladnagar East (1.6 km)',
                        stage: 'ACCEPTED',
                        stageClass: 'bg-blue-50 text-blue-900 border-blue-200',
                        timer: 'Queued on induction station',
                        courier: 'Assigned: Snehal Joshi',
                        courierStatus: 'Standby at Hub',
                        amount: '₹140'
                      }
                    ].map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 bg-[#f5f3ef] border border-[#ded9d1]/60 flex flex-col gap-3 hover:border-[#1a1a1a] transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-[#1a1a1a]">#{ticket.id}</span>
                              <span className="text-xs text-[#665d52]">•</span>
                              <span className="font-medium text-sm text-[#1a1a1a]">{ticket.meal}</span>
                            </div>
                            <div className="text-xs text-[#665d52] mt-0.5">
                              Customer: {ticket.customer} • {ticket.address}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-[#1a1a1a]">{ticket.amount}</span>
                            <span className="block font-mono text-[10px] text-emerald-700">UPI Verified</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ded9d1]/40 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 font-mono text-[10px] font-bold border ${ticket.stageClass}`}>
                              {ticket.stage}
                            </span>
                            <span className="font-mono text-[#665d52]">{ticket.timer}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[#665d52]">
                              Courier: <strong className="text-[#1a1a1a]">{ticket.courier}</strong> ({ticket.courierStatus})
                            </span>
                            <button
                              onClick={() => alert(`POS ping dispatched for Order #${ticket.id}`)}
                              className="px-2 py-1 bg-white border border-[#ded9d1] hover:bg-[#1a1a1a] hover:text-white transition-colors text-[11px] font-mono"
                            >
                              Ping POS
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Control footer */}
                  <div className="p-3 bg-[#efeeea] border border-[#ded9d1] flex items-center justify-between font-mono text-xs">
                    <span>Live kitchen load: 74% batch density</span>
                    <button
                      onClick={() => onNavigate && onNavigate('providers-orders')}
                      className="text-[#1a1a1a] underline font-bold"
                    >
                      Open Full Screen Live Matrix →
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: ORDER HISTORY FOR THIS KITCHEN */}
              {/* ========================================================================= */}
              {dossierTab === 'history' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]/60">
                    <div>
                      <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-bold">
                        Forensic Order History
                      </span>
                      <h3 className="font-serif text-xl text-[#1a1a1a] mt-0.5">
                        {activeDossier.name} • {activeDossier.totalOrders} Archived Fulfillment Records
                      </h3>
                    </div>
                    <button
                      onClick={() => alert(`Exporting complete historical ledger for ${activeDossier.name} (CSV)...`)}
                      className="px-3 py-1.5 bg-[#efeeea] border border-[#ded9d1] hover:bg-[#eae8e4] text-xs font-mono font-semibold"
                    >
                      Export Dossiers (CSV)
                    </button>
                  </div>

                  {/* Summary Metric Ribbon */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">All-time Orders</span>
                      <span className="font-serif text-2xl text-[#1a1a1a] font-normal">{activeDossier.totalOrders}</span>
                    </div>
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Fulfillment Success</span>
                      <span className="font-serif text-2xl text-emerald-800 font-normal">96.8%</span>
                    </div>
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Disbursed Volume</span>
                      <span className="font-serif text-2xl text-[#1a1a1a] font-normal">{activeDossier.grossGmv}</span>
                    </div>
                  </div>

                  {/* Historical Table */}
                  <div className="border border-[#ded9d1]/60 overflow-hidden">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-[#f5f3ef] font-mono text-[10px] text-[#665d52] uppercase border-b border-[#ded9d1]/60">
                        <tr>
                          <th className="py-2.5 px-3">Dossier ID</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Meal Item</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ded9d1]/40">
                        {[
                          { id: '#TL-4956', date: '28 Sep 19:15', meal: 'Kathiyawadi Thali × 1', amount: '₹186.00', status: 'DELIVERED', turnaround: '27m' },
                          { id: '#TL-4952', date: '28 Sep 12:40', meal: 'Gujarati Meal × 2', amount: '₹280.00', status: 'DELIVERED', turnaround: '26m' },
                          { id: '#TL-4945', date: '27 Sep 19:50', meal: 'Bajra Rotla Thali × 1', amount: '₹195.00', status: 'DELIVERED', turnaround: '24m' },
                          { id: '#TL-4938', date: '27 Sep 12:20', meal: 'Dal Bati Churma × 2', amount: '₹240.00', status: 'DELIVERED', turnaround: '29m' },
                          { id: '#TL-4929', date: '26 Sep 20:05', meal: 'Executive Meal Box × 1', amount: '₹165.00', status: 'DELIVERED', turnaround: '28m' },
                          { id: '#TL-4912', date: '26 Sep 12:10', meal: 'Sev Tameta Meal × 1', amount: '₹150.00', status: 'CANCELLED', turnaround: 'Auto-Refund' }
                        ].map((item, i) => (
                          <tr key={i} className="hover:bg-[#f5f3ef]/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#1a1a1a]">{item.id}</td>
                            <td className="py-2.5 px-3 font-mono text-[#665d52]">{item.date}</td>
                            <td className="py-2.5 px-3 font-medium text-[#1a1a1a]">{item.meal}</td>
                            <td className="py-2.5 px-3 font-mono text-right font-semibold text-[#1a1a1a]">{item.amount}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 font-mono text-[9px] font-bold border ${
                                item.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => alert(`Downloading tax slip & proof for ${item.id}`)}
                                className="text-[11px] font-mono text-[#1a1a1a] underline hover:text-[#4a4238]"
                              >
                                Slip
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60 flex items-center justify-between font-mono text-xs text-[#665d52]">
                    <span>WORM Vault Hash Integrity: All 6 signatures verified</span>
                    <button
                      onClick={() => onNavigate && onNavigate('providers-history')}
                      className="text-[#1a1a1a] underline font-bold"
                    >
                      Open Full Order History Ledger →
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: FINANCIAL LEDGER & SETTLEMENTS */}
              {/* ========================================================================= */}
              {dossierTab === 'financials' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]/60">
                    <div>
                      <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-bold">
                        Financial Ledger &amp; Escrow Settlements
                      </span>
                      <h3 className="font-serif text-xl text-[#1a1a1a] mt-0.5">
                        {activeDossier.name} • Settlement Account #TL-ESC-4410
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-semibold">
                      Direct NEFT / IMPS Active
                    </span>
                  </div>

                  {/* Bank Account Verification Card */}
                  <div className="p-4 bg-[#f5f3ef] border border-[#ded9d1]/60 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[24px] text-[#1a1a1a]">account_balance</span>
                      <div>
                        <div className="font-medium text-sm text-[#1a1a1a]">HDFC Bank • Commercial Settlement A/C</div>
                        <div className="font-mono text-xs text-[#665d52] mt-0.5">
                          Account: ••••••••••4412 • IFSC: HDFC0000042 • Holder: {activeDossier.owner}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-800 mt-1 flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Penny-Drop Bank Verification Succeeded (NPCI / Yes Bank Nodal)
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-[#efeeea] font-mono text-[10px] text-[#665d52]">
                      Daily Sweep (23:59 IST)
                    </span>
                  </div>

                  {/* Financial Breakdown Bento Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Pending Release</span>
                      <span className="font-serif text-2xl text-[#4a4238] font-bold">{activeDossier.pendingRelease}</span>
                      <span className="font-mono text-[10px] text-[#665d52] block mt-0.5">Disburses tonight</span>
                    </div>
                    <div className="p-3 bg-white border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Lifetime Net Paid</span>
                      <span className="font-serif text-2xl text-[#1a1a1a] font-bold">{activeDossier.netPayout}</span>
                      <span className="font-mono text-[10px] text-emerald-700 block mt-0.5">100% Cleared</span>
                    </div>
                    <div className="p-3 bg-white border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Platform Take (5%)</span>
                      <span className="font-serif text-2xl text-[#1a1a1a] font-bold">{activeDossier.platformFee}</span>
                      <span className="font-mono text-[10px] text-[#665d52] block mt-0.5">TDS Deducted</span>
                    </div>
                    <div className="p-3 bg-white border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Escrow Security</span>
                      <span className="font-serif text-2xl text-emerald-800 font-bold">₹5,000</span>
                      <span className="font-mono text-[10px] text-[#665d52] block mt-0.5">Locked Reserve</span>
                    </div>
                  </div>

                  {/* Recent Settlement Batches */}
                  <div>
                    <span className="font-mono text-xs uppercase font-bold text-[#1a1a1a] block mb-2">
                      Recent Settlement Batches
                    </span>
                    <div className="border border-[#ded9d1]/60 overflow-hidden">
                      <table className="w-full text-left font-sans text-xs">
                        <thead className="bg-[#f5f3ef] font-mono text-[10px] text-[#665d52] uppercase border-b border-[#ded9d1]/60">
                          <tr>
                            <th className="py-2.5 px-3">Batch ID</th>
                            <th className="py-2.5 px-3">Cycle Date</th>
                            <th className="py-2.5 px-3">Tiffins</th>
                            <th className="py-2.5 px-3 text-right">Gross GMV</th>
                            <th className="py-2.5 px-3 text-right">Net Disbursed</th>
                            <th className="py-2.5 px-3">UTR Reference</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ded9d1]/40">
                          {[
                            { batch: 'SETTL-2026-0927', date: '27 Sep 2026', count: '18 tiffins', gmv: '₹3,420', net: '₹3,249', utr: 'CMS-99018441', status: 'SETTLED' },
                            { batch: 'SETTL-2026-0926', date: '26 Sep 2026', count: '24 tiffins', gmv: '₹4,560', net: '₹4,332', utr: 'CMS-99014112', status: 'SETTLED' },
                            { batch: 'SETTL-2026-0925', date: '25 Sep 2026', count: '21 tiffins', gmv: '₹3,990', net: '₹3,790', utr: 'CMS-99008921', status: 'SETTLED' },
                            { batch: 'SETTL-2026-0924', date: '24 Sep 2026', count: '19 tiffins', gmv: '₹3,610', net: '₹3,429', utr: 'CMS-99002144', status: 'SETTLED' }
                          ].map((b, idx) => (
                            <tr key={idx} className="hover:bg-[#f5f3ef]/50">
                              <td className="py-2.5 px-3 font-mono font-bold text-[#1a1a1a]">{b.batch}</td>
                              <td className="py-2.5 px-3 font-mono text-[#665d52]">{b.date}</td>
                              <td className="py-2.5 px-3 text-[#1a1a1a]">{b.count}</td>
                              <td className="py-2.5 px-3 font-mono text-right text-[#665d52]">{b.gmv}</td>
                              <td className="py-2.5 px-3 font-mono text-right font-bold text-[#1a1a1a]">{b.net}</td>
                              <td className="py-2.5 px-3 font-mono text-[10px] text-[#665d52]">{b.utr}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[9px] font-bold">
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => alert(`Manual settlement trigger initialized for ${activeDossier.pendingRelease} to ${activeDossier.name}`)}
                      className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-neutral-800 font-sans text-xs uppercase tracking-wider font-semibold"
                    >
                      Trigger Immediate Settlement Sweep
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: TELEMETRY & AUDIT */}
              {/* ========================================================================= */}
              {dossierTab === 'telemetry' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]/60">
                    <div>
                      <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider font-bold">
                        Kitchen Telemetry &amp; Compliance Logs
                      </span>
                      <h3 className="font-serif text-xl text-[#1a1a1a] mt-0.5">
                        {activeDossier.name} • Operational Health Scorecard
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-mono text-xs font-bold">
                      HEALTH: 99.2% OPTIMAL
                    </span>
                  </div>

                  {/* Real-time Hardware Telemetry Bar */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Node Latency</span>
                      <span className="font-mono text-xl font-bold text-[#1a1a1a]">12ms</span>
                      <span className="font-mono text-[10px] text-emerald-800 block">WebSocket Live</span>
                    </div>
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Induction Station</span>
                      <span className="font-mono text-xl font-bold text-[#1a1a1a]">68°C Hot</span>
                      <span className="font-mono text-[10px] text-emerald-800 block">Optimal Range</span>
                    </div>
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Terminal POS</span>
                      <span className="font-mono text-xl font-bold text-[#1a1a1a]">v4.2.1</span>
                      <span className="font-mono text-[10px] text-emerald-800 block">Up to date</span>
                    </div>
                    <div className="p-3 bg-[#f5f3ef] border border-[#ded9d1]/60">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">SLA Breaches</span>
                      <span className="font-mono text-xl font-bold text-[#1a1a1a]">0 / 30D</span>
                      <span className="font-mono text-[10px] text-emerald-800 block">Zero Critical</span>
                    </div>
                  </div>

                  {/* Hygiene & Food Safety Certifications */}
                  <div className="p-4 bg-white border border-[#ded9d1]/60 space-y-3">
                    <span className="font-mono text-xs uppercase font-bold text-[#1a1a1a] block">
                      Hygiene &amp; Regulatory Certifications
                    </span>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="p-2.5 bg-[#f5f3ef] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-700">verified</span>
                          <span>FSSAI License ({activeDossier.fssaiNumber})</span>
                        </div>
                        <span className="text-emerald-800 font-bold">Active (Expires 31 Mar 2026)</span>
                      </div>
                      <div className="p-2.5 bg-[#f5f3ef] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-700">water_drop</span>
                          <span>Commercial RO Drinking Water Test</span>
                        </div>
                        <span className="text-emerald-800 font-bold">TDS 72 • Passed 99.4%</span>
                      </div>
                      <div className="p-2.5 bg-[#f5f3ef] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-700">sanitizer</span>
                          <span>Kitchen Counter Biological Swab Test</span>
                        </div>
                        <span className="text-emerald-800 font-bold">Zero Contaminants • Grade A</span>
                      </div>
                      <div className="p-2.5 bg-[#f5f3ef] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-700">thermostat</span>
                          <span>Dispatch Thermal Vacuum Seal Insulation</span>
                        </div>
                        <span className="text-emerald-800 font-bold">Maintains &gt;65°C for 90m</span>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Telemetry Logs */}
                  <div>
                    <span className="font-mono text-xs uppercase font-bold text-[#1a1a1a] block mb-2">
                      Recent System Telemetry Logs
                    </span>
                    <div className="p-3 bg-[#1a1a1a] text-emerald-400 font-mono text-[11px] space-y-1.5 border border-neutral-800">
                      <div>[2026-09-30 19:42:18] ORDER_DISPATCH_CONFIRMED: Canister seal #TK-9021 verified by courier #DP-4409.</div>
                      <div>[2026-09-30 19:32:40] HEAT_SEAL_LOCKED: Thermal temp verified at 68.4°C. Station #1 cleared.</div>
                      <div>[2026-09-30 19:16:15] POS_TICKET_ACK: Station #1 induction active. 4 Phulkas, Ringan Bhartu.</div>
                      <div>[2026-09-30 18:00:00] BATCH_LOAD_INITIALIZED: Dinner service slot opened. Quota capacity: 30 tiffins.</div>
                      <div>[2026-09-30 14:02:10] LUNCH_SWEEP_CLEARED: 24 lunch tiffins fulfilled with 0 cancellations.</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Action Bottom Footer */}
            <div className="p-4 bg-[#f5f3ef] border-t border-[#ded9d1]/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Dialing emergency dispatch hotline for ${activeDossier.name} (${activeDossier.phone})...`)}
                  className="px-3 py-2 bg-[#efeeea] hover:bg-[#eae8e4] transition-colors font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 border border-[#ded9d1]"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Hotline</span>
                </button>
                <button
                  onClick={() => alert(`Displaying compliance certificates and FSSAI audits for license ${activeDossier.fssaiNumber}`)}
                  className="px-3 py-2 bg-[#efeeea] hover:bg-[#eae8e4] transition-colors font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 border border-[#ded9d1]"
                >
                  <span className="material-symbols-outlined text-[16px]">badge</span>
                  <span>Audit Docs</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSuspendToggle(activeDossier)}
                  className={`px-3.5 py-2 transition-colors font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-1 ${
                    activeDossier.status === 'suspended'
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-[#ba1a1a] text-white hover:bg-[#ba1a1a]/90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {activeDossier.status === 'suspended' ? 'check' : 'warning'}
                  </span>
                  <span>{activeDossier.status === 'suspended' ? 'Re-activate Kitchen' : 'Suspend Kitchen'}</span>
                </button>
                <button
                  onClick={() => alert(`Opening Kitchen Capacity and Profile Editor for ${activeDossier.name}`)}
                  className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-neutral-800 transition-colors font-sans text-xs uppercase tracking-wider font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PROVIDER (Quick Minimal Drawer) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#1a1a1a]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 border border-[#ded9d1]">
            <div className="flex items-center justify-between pb-2 border-b border-[#ded9d1]/60">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-[#665d52] uppercase tracking-wider">New Onboarding Dossier</span>
                <h3 className="font-serif text-2xl text-[#1a1a1a]">Register Kitchen Node</h3>
              </div>
              <button
                className="p-1 text-[#665d52] hover:text-[#1a1a1a]"
                onClick={() => setIsAddModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div>
                <label className="font-mono text-xs text-[#665d52] uppercase block mb-1 font-bold">
                  Kitchen Legal Name *
                </label>
                <input
                  required
                  value={newKitchen.name}
                  onChange={(e) => setNewKitchen(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  placeholder="e.g. Radhe Kathiyawadi Rasoi"
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs text-[#665d52] uppercase block mb-1 font-bold">
                    Owner Contact Name *
                  </label>
                  <input
                    required
                    value={newKitchen.owner}
                    onChange={(e) => setNewKitchen(prev => ({ ...prev, owner: e.target.value }))}
                    className="w-full bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                    placeholder="e.g. Hasmukh Patel"
                    type="text"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-[#665d52] uppercase block mb-1 font-bold">
                    Direct Mobile Phone *
                  </label>
                  <input
                    required
                    value={newKitchen.phone}
                    onChange={(e) => setNewKitchen(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                    placeholder="+91 98XXX XXXXX"
                    type="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs text-[#665d52] uppercase block mb-1 font-bold">
                    Cluster Hub
                  </label>
                  <select
                    value={newKitchen.cluster}
                    onChange={(e) => setNewKitchen(prev => ({ ...prev, cluster: e.target.value }))}
                    className="w-full bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2 text-[#1a1a1a] focus:outline-none"
                  >
                    <option value="Bodakdev Hub #04">Bodakdev Hub #04</option>
                    <option value="Navrangpura Central">Navrangpura Central</option>
                    <option value="Vastrapur East">Vastrapur East</option>
                    <option value="Paldi Old Town">Paldi Old Town</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs text-[#665d52] uppercase block mb-1 font-bold">
                    Daily Meal Quota
                  </label>
                  <input
                    value={newKitchen.quota}
                    onChange={(e) => setNewKitchen(prev => ({ ...prev, quota: e.target.value }))}
                    className="w-full bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2 text-[#1a1a1a] focus:outline-none"
                    type="number"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-[#665d52] uppercase block mb-1 font-bold">
                  14-Digit FSSAI License Number
                </label>
                <input
                  value={newKitchen.fssai}
                  onChange={(e) => setNewKitchen(prev => ({ ...prev, fssai: e.target.value }))}
                  className="w-full bg-[#f5f3ef] border border-[#ded9d1] px-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  placeholder="1082XXXXXXXXXX"
                  type="text"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ded9d1]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#efeeea] border border-[#ded9d1] hover:bg-[#ded9d1] font-sans text-xs uppercase tracking-wider text-[#1a1a1a] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-neutral-800 font-sans text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm"
                >
                  Create &amp; Initiate KYC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
