import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function MyTiffinsTab({ 
  initialSubView = 'all', 
  initialOpenModal = false, 
  defaultOpenAdd = false,
  onNavigateTab 
}) {
  const [subView, setSubView] = useState(
    initialOpenModal || defaultOpenAdd ? 'add' : 
    initialSubView === 'add' ? 'add' : 
    initialSubView === 'availability' ? 'availability' : 
    initialSubView === 'categories' ? 'categories' : 'all'
  );

  // Filter & Search states for All Tiffins
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDietary, setFilterDietary] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Selected Tiffin for Dossier (All Tiffins view) and Schedule (Availability view)
  const [selectedTiffinId, setSelectedTiffinId] = useState(null);

  // Modals & Action Confirmation states
  const [editingTiffin, setEditingTiffin] = useState(null);
  const [deletingTiffin, setDeletingTiffin] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Collections
  const [tiffins, setTiffins] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State for Add / Edit Tiffin
  const [formState, setFormState] = useState({
    name: '',
    category: 'Gujarati',
    foodType: 'Pure Veg',
    description: '',
    price: '220',
    discount: '10',
    capacity: '25',
    noticeTime: '2 Hours Notice',
    prepStation: 'Station 2 (Slow Curries)',
    days: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false },
    area: 'Navrangpura, Satellite, Vastrapur',
    ingredients: 'Fresh vegetables, Whole wheat flour, Pure A2 Ghee',
    items: ['4x Phulka Rotis (A2 Ghee)', '1x Sev Tameta Gravy 250ml', '1x Ringan Olo (Baingan Bharta) 200g', '1x Handcrafted Dryfruit Ladoo', '1x Masala Buttermilk 200ml'],
    status: 'Active',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgVbGgvOlqEPwBhHCO0mfTLEfVaodryI5Y-OTN8CXcfAHNIZH_kIdBNi64elpWcbnfv99KLJ-C6fXTTMseFJiZNgrZ1xWRlvnK3Ozg9qQk_oEAGawxyLchVvSwK7aEPuNgLl_gKPbV2WioOVbUZyE1kR0Ycg-qRHtv59KPm0tjW393jmrHiDyIEX3qxzCHTO_qphuMzbM_FmS9_8ViNHwKQAL0dQ7tp5yH_InNUEbHmYKkZu1sc_dy'
  });

  const [newItemTag, setNewItemTag] = useState('');

  // Preset Image Gallery
  const presetImages = [
    { label: 'Gujarati Special', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgVbGgvOlqEPwBhHCO0mfTLEfVaodryI5Y-OTN8CXcfAHNIZH_kIdBNi64elpWcbnfv99KLJ-C6fXTTMseFJiZNgrZ1xWRlvnK3Ozg9qQk_oEAGawxyLchVvSwK7aEPuNgLl_gKPbV2WioOVbUZyE1kR0Ycg-qRHtv59KPm0tjW393jmrHiDyIEX3qxzCHTO_qphuMzbM_FmS9_8ViNHwKQAL0dQ7tp5yH_InNUEbHmYKkZu1sc_dy' },
    { label: 'Amritsari Punjabi', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwUcUoJ6r89gVPSfnHsNZQ8qlsAlTmq2iqCNe6MqERgBZmGW39wzerJvrTStWCEEOkak684jpl3pjEBzf3uogJwAEB7hqmYBHvBY5114CyEBjV6-piEoG31mlLGXlBX_d2K_cS3tdacpiR4S66b9NlYmZ7E1xKK6mKLTxx2P21p5MuUBJpgb2cpHg_a2ToVphk6OelK7cpIFpJ43HDOwJdsaX0jB3RUrP2NyrrRBUGiJoUNYZ1G9s8' },
    { label: 'Jain Sattvik', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBGiHMFySV6bH3-LhYPSoVn_XmeLd5_1OAVDnW-aNKiNV9Lci1Lq-LhAWA_5qYrc9DKcWKLpIZN7bssaIvrRaeQhCXsEInCCq25acAy8buMN6gqh1-GkkF13Q_GXeTnllVMxnuJWL1B_dMgjDpEokpmIxmU7eTQV2cjCVTQTQioabCpkhSRpUxZ1uCoyAbbqeKJ0es3BCs7Ps6J08jhEBPTifsKhJS3lGU5DRRwk7SaEuTeLWaIG5D' },
    { label: 'Wellness Millet', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-fh2xz0j4VLbdx-H7Y7eeiWlVp1mYgauxNJCUKEm-DwpNYIeXy3g5b_tA6ltJJ9AfOzCh2EsnHS-RMCQXgeqi2F9p6eCvhZDQ0mR5Fx-a5SuhaGesfHv7xTOn49j9HbUjE3dAjdn4qM1ex2nSFJLBVF2v6jeJ65aD_QjXGDGrYQ11Xi4AOKrAfNeB2Rs7z2XiPXSe_d-Oi9BN6xPeyzqQowv_vBzp42Ff1DlY1sc9jvNuh3rBklWM' },
    { label: 'Surti Winter Feast', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIPaXCdYL-aMcUxd3Aebu-CST9OAnixKoFULmf3OlJyHWK9BHjM3zmyyCBYcyrOYgPTw-8cQlMHvrMvv8fMXlw8zrynGl0dfrKTajRQ7nN3FymU7jygJCfNuXJP7GCOlF61I8QMjd3SmjMmhbAg69kyAhxVJ7YXVDC_2J8j4GvpwOixJIDbXixyvEegQl2l5cNpp6g4XuFN19Ny_HCYM3uzqbfop7apNGoA9Eo0mdIGzvHZ4q1DE18' }
  ];

  // Fetch Tiffins & Categories from MongoDB
  useEffect(() => {
    fetchTiffins();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTiffins = async () => {
    try {
      setLoading(true);
      const json = await apiRequest('/tiffins');
      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map(t => ({
          ...t,
          id: t._id || t.id,
          ordersToday: t.ordersToday || 0,
          netPayout: Math.round((Number(t.price) || 200) * 0.875)
        }));
        setTiffins(formatted);
        if (formatted.length > 0 && !selectedTiffinId) {
          setSelectedTiffinId(formatted[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching tiffins:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const json = await apiRequest('/categories');
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data.map(c => ({
          ...c,
          id: c._id || c.id
        })));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Toggle Tiffin Active / Inactive
  const toggleTiffinStatus = async (tiffin, e) => {
    if (e) e.stopPropagation();
    const id = tiffin.id || tiffin._id;
    const nextStatus = tiffin.status === 'Active' ? 'Inactive' : 'Active';

    setTiffins(prev => prev.map(t => (t.id === id || t._id === id) ? { ...t, status: nextStatus } : t));
    showToast(`✓ Tiffin "${tiffin.name}" status updated to ${nextStatus}`);

    try {
      await apiRequest(`/tiffins/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Confirm Delete Tiffin
  const confirmDeleteTiffin = async () => {
    if (deletingTiffin) {
      const id = deletingTiffin.id || deletingTiffin._id;
      setTiffins(prev => prev.filter(t => (t.id !== id && t._id !== id)));
      showToast(`✓ Tiffin "${deletingTiffin.name}" deleted successfully.`);

      if (selectedTiffinId === id) {
        setSelectedTiffinId(null);
      }

      try {
        await apiRequest(`/tiffins/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Error deleting tiffin:', err);
      }

      setDeletingTiffin(null);
    }
  };

  // Handle Save (Add or Edit) Tiffin
  const handleSaveTiffin = async (e, publishLive = true) => {
    if (e) e.preventDefault();
    if (!formState.name.trim()) {
      showToast('⚠️ Please enter a tiffin name');
      return;
    }
    if (!formState.price || Number(formState.price) <= 0) {
      showToast('⚠️ Please enter a valid price greater than 0');
      return;
    }

    setIsSubmitting(true);
    const selectedDaysArr = Object.keys(formState.days).filter(d => formState.days[d]);

    const payload = {
      name: formState.name.trim(),
      description: formState.description || 'Authentic home-cooked thali prepared daily.',
      price: Number(formState.price),
      discount: Number(formState.discount) || 0,
      category: formState.category,
      foodType: formState.foodType,
      capacity: Number(formState.capacity) || 25,
      noticeTime: formState.noticeTime,
      prepStation: formState.prepStation,
      days: selectedDaysArr.length > 0 ? selectedDaysArr : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: formState.area || 'All Localities',
      ingredients: formState.ingredients || 'Fresh veggies, Whole wheat flour, Pure Ghee',
      items: formState.items,
      status: publishLive ? 'Active' : 'Inactive',
      image: formState.image
    };

    if (editingTiffin) {
      const targetId = editingTiffin.id || editingTiffin._id;
      try {
        const json = await apiRequest(`/tiffins/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (json.success) {
          showToast(`✓ Tiffin "${payload.name}" updated successfully!`);
          fetchTiffins();
        }
      } catch (err) {
        console.error('Error updating tiffin:', err);
      }
      setEditingTiffin(null);
    } else {
      try {
        const json = await apiRequest('/tiffins', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (json.success && json.data) {
          showToast(`✓ Tiffin "${payload.name}" published to kitchen catalog!`);
          fetchTiffins();
        }
      } catch (err) {
        console.error('Error creating tiffin:', err);
      }
    }

    setIsSubmitting(false);
    setSubView('all');
    resetForm();
  };

  const resetForm = () => {
    setEditingTiffin(null);
    setFormState({
      name: '',
      category: 'Gujarati',
      foodType: 'Pure Veg',
      description: '',
      price: '220',
      discount: '10',
      capacity: '25',
      noticeTime: '2 Hours Notice',
      prepStation: 'Station 2 (Slow Curries)',
      days: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false },
      area: 'Navrangpura, Satellite, Vastrapur',
      ingredients: 'Fresh vegetables, Whole wheat flour, Pure A2 Ghee',
      items: ['4x Phulka Rotis (A2 Ghee)', '1x Sev Tameta Gravy 250ml', '1x Ringan Olo (Baingan Bharta) 200g', '1x Handcrafted Dryfruit Ladoo', '1x Masala Buttermilk 200ml'],
      status: 'Active',
      image: presetImages[0].url
    });
  };

  const startEditTiffin = (tiffin, e) => {
    if (e) e.stopPropagation();
    setEditingTiffin(tiffin);
    const dayObj = { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false };
    if (Array.isArray(tiffin.days)) {
      tiffin.days.forEach(d => { dayObj[d] = true; });
    }
    setFormState({
      name: tiffin.name || '',
      category: tiffin.category || 'Gujarati',
      foodType: tiffin.foodType || 'Pure Veg',
      description: tiffin.description || '',
      price: tiffin.price ? tiffin.price.toString() : '220',
      discount: tiffin.discount ? tiffin.discount.toString() : '10',
      capacity: tiffin.capacity ? tiffin.capacity.toString() : '25',
      noticeTime: tiffin.noticeTime || '2 Hours Notice',
      prepStation: tiffin.prepStation || 'Station 2 (Slow Curries)',
      days: dayObj,
      area: tiffin.area || '',
      ingredients: tiffin.ingredients || '',
      items: Array.isArray(tiffin.items) && tiffin.items.length > 0 ? tiffin.items : ['4x Phulka Rotis', '1x Sabzi', '1x Dal & Rice', '1x Dessert'],
      status: tiffin.status || 'Active',
      image: tiffin.image || presetImages[0].url
    });
    setSubView('add');
  };

  // Filtered & Sorted Tiffins for All Tiffins table
  const filteredTiffins = tiffins.filter(t => {
    const matchesSearch = searchQuery === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesDietary = filterDietary === 'All' || t.foodType === filterDietary;
    
    let matchesStatus = true;
    if (filterStatus === 'Active') matchesStatus = t.status === 'Active';
    if (filterStatus === 'Inactive') matchesStatus = t.status === 'Inactive' || t.status === 'Paused';

    return matchesSearch && matchesCategory && matchesDietary && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
    if (sortBy === 'orders') return (b.ordersToday || 0) - (a.ordersToday || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
  });

  const selectedTiffin = tiffins.find(t => t.id === selectedTiffinId || t._id === selectedTiffinId) || tiffins[0] || null;

  // Calculation KPI stats
  const totalTiffinsCount = tiffins.length;
  const activeTiffinsCount = tiffins.filter(t => t.status === 'Active').length;
  const inactiveTiffinsCount = tiffins.filter(t => t.status === 'Inactive' || t.status === 'Paused').length;
  const todayOrdersSum = tiffins.reduce((acc, t) => acc + (t.ordersToday || 0), 0);

  // Prices calculation helper for Add form
  const basePriceNum = Number(formState.price) || 0;
  const discountNum = Number(formState.discount) || 0;
  const netPrice = Math.max(0, basePriceNum * (1 - discountNum / 100));
  const estimatedPayout = Math.round(netPrice * 0.875);

  return (
    <div className="flex flex-col w-full px-4 lg:px-6 py-6 space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-onyx-black text-bone-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-sand-neutral flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTiffin && (
        <div className="fixed inset-0 bg-onyx-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="font-headline-md text-xl text-on-surface">Delete Tiffin</h3>
            </div>
            <p className="font-body-md text-xs text-secondary">
              Are you sure you want to delete <strong class="text-on-surface">"{deletingTiffin.name}"</strong>? This record will be permanently removed from MongoDB.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTiffin(null)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTiffin}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Delete Tiffin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Header Module Switcher Bar */}
      <div className="bg-surface-container-lowest p-3 rounded-2xl border border-sand-neutral/50 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setSubView('all')}
            className={`px-4 py-2 rounded-xl text-xs font-label-caps font-bold transition-all cursor-pointer ${
              subView === 'all' ? 'bg-onyx-black text-bone-white shadow-xs' : 'text-secondary hover:bg-surface-container-low'
            }`}
          >
            All Tiffins ({totalTiffinsCount})
          </button>
          <button 
            type="button"
            onClick={() => { resetForm(); setSubView('add'); }}
            className={`px-4 py-2 rounded-xl text-xs font-label-caps font-bold transition-all cursor-pointer ${
              subView === 'add' ? 'bg-onyx-black text-bone-white shadow-xs' : 'text-secondary hover:bg-surface-container-low'
            }`}
          >
            + Add New Tiffin
          </button>
          <button 
            type="button"
            onClick={() => setSubView('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-label-caps font-bold transition-all cursor-pointer ${
              subView === 'availability' ? 'bg-onyx-black text-bone-white shadow-xs' : 'text-secondary hover:bg-surface-container-low'
            }`}
          >
            Availability & Slots
          </button>
        </div>

        <div className="text-xs font-mono text-secondary">
          Active Storefront Items: <span className="font-bold text-onyx-black">{activeTiffinsCount}</span> / {totalTiffinsCount}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PART 1 — ALL TIFFINS SUB-VIEW                                            */}
      {/* ========================================================================= */}
      {subView === 'all' && (
        <div className="space-y-6">
          
          {/* Header & Telemetry */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sand-neutral/40">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 font-label-caps text-xs text-secondary tracking-wider uppercase">
                <span>Provider</span>
                <span>/</span>
                <span>My Tiffins</span>
                <span>/</span>
                <span className="text-onyx-black font-bold">All Tiffins</span>
              </div>
              <h1 class="font-headline-lg text-3xl text-on-surface">All Tiffins</h1>
              <p class="font-body-md text-xs text-secondary">
                Curated culinary catalog and active meal subscriptions managed by your home kitchen.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={fetchTiffins}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-sand-neutral/50 text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Refresh Catalog</span>
              </button>
              <button 
                type="button"
                onClick={() => { resetForm(); setSubView('add'); }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add New Tiffin</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs uppercase tracking-wider text-secondary font-semibold">Total Tiffins</span>
                <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display-lg text-4xl text-on-surface">{String(totalTiffinsCount).padStart(2, '0')}</span>
                <span className="font-label-caps text-[11px] text-secondary">In Catalog</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs uppercase tracking-wider text-secondary font-semibold">Active Tiffins</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display-lg text-4xl text-on-surface">{String(activeTiffinsCount).padStart(2, '0')}</span>
                <span className="font-label-caps text-[11px] text-emerald-700 font-bold">Live on Storefront</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs uppercase tracking-wider text-secondary font-semibold">Inactive Tiffins</span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800">
                  <span className="material-symbols-outlined text-[18px]">bedtime</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display-lg text-4xl text-secondary">{String(inactiveTiffinsCount).padStart(2, '0')}</span>
                <span className="font-label-caps text-[11px] text-secondary">Paused / Seasonal</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs uppercase tracking-wider text-secondary font-semibold">Today's Orders</span>
                <span className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[18px]">lunch_dining</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display-lg text-4xl text-on-surface">{todayOrdersSum}</span>
                <span className="font-label-caps text-[11px] text-secondary">Boxes Dispatched</span>
              </div>
            </div>
          </div>

          {/* Filtration Control Plane */}
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            <div className="flex-1 flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-sand-neutral/40">
              <span className="material-symbols-outlined text-secondary text-[20px] mr-2">search</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tiffins by name, ingredients, description..."
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-secondary focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-secondary hover:text-onyx-black">
                  <span className="material-symbols-outlined text-[16px]">clear</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-sand-neutral/40 text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="All">Category: All</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Jain">Jain</option>
                <option value="Kathiyawadi">Kathiyawadi</option>
                <option value="Wellness">Wellness</option>
              </select>

              <select 
                value={filterDietary}
                onChange={e => setFilterDietary(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-sand-neutral/40 text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="All">Dietary: All</option>
                <option value="Pure Veg">Pure Veg</option>
                <option value="Jain Friendly">Jain Friendly</option>
                <option value="Vegan">Vegan</option>
                <option value="High Protein">High Protein</option>
              </select>

              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-sand-neutral/40 text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low border border-sand-neutral/40 text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="orders">Most Ordered</option>
              </select>
            </div>
          </div>

          {/* Main Grid: Catalog Table + Side Inspector Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Table View (7 Columns on desktop) */}
            <div className={`${selectedTiffin ? 'lg:col-span-7' : 'lg:col-span-12'} bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 shadow-xs overflow-hidden transition-all`}>
              <div className="px-5 py-3.5 bg-surface-container-low/70 border-b border-sand-neutral/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-onyx-black text-[18px]">restaurant_menu</span>
                  <span className="font-label-caps text-xs font-bold text-onyx-black uppercase tracking-wider">
                    Catalog Register: {filteredTiffins.length} items
                  </span>
                </div>
                <span className="text-[11px] font-mono text-secondary font-semibold">Click row to inspect dossier</span>
              </div>

              {loading ? (
                <div className="p-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
                  <h3 className="font-headline-md text-lg text-on-surface">Connecting to MongoDB Tiffin Catalog...</h3>
                </div>
              ) : filteredTiffins.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <span className="material-symbols-outlined text-[36px] text-secondary">inbox</span>
                  <h3 className="font-headline-md text-xl text-on-surface">No Tiffins Found</h3>
                  <p className="font-body-md text-xs text-secondary">Create your first home-cooked meal offering by clicking "+ Add New Tiffin".</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sand-neutral/40 text-[11px] font-label-caps uppercase tracking-wider text-secondary bg-surface-container-low/30 font-bold">
                        <th className="py-3.5 px-4">Tiffin & Items</th>
                        <th className="py-3.5 px-3">Cuisine</th>
                        <th className="py-3.5 px-3">Price</th>
                        <th className="py-3.5 px-3 text-center">Orders</th>
                        <th className="py-3.5 px-3 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-neutral/40 text-xs font-body-md">
                      {filteredTiffins.map((tif) => {
                        const isSelected = selectedTiffin && (selectedTiffin.id === tif.id || selectedTiffin._id === tif.id);

                        return (
                          <tr
                            key={tif.id}
                            onClick={() => setSelectedTiffinId(tif.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-50/40 border-l-4 border-l-onyx-black font-semibold' : 'hover:bg-surface-container-low/60'
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={tif.image || presetImages[0].url} 
                                  alt={tif.name} 
                                  className="w-12 h-12 rounded-lg object-cover border border-sand-neutral/50 shrink-0" 
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-onyx-black truncate">{tif.name}</div>
                                  <div className="text-[11px] text-secondary truncate max-w-xs">{tif.description || tif.ingredients}</div>
                                  <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-label-caps bg-surface-container text-clay-earth font-bold">
                                    {tif.foodType || 'Pure Veg'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 font-semibold text-onyx-black">
                              {tif.category || 'Gujarati'}
                            </td>

                            <td className="py-3.5 px-3 font-mono font-bold text-onyx-black">
                              ₹{tif.price}.00
                            </td>

                            <td className="py-3.5 px-3 text-center font-mono font-bold text-onyx-black">
                              {tif.ordersToday || 0}
                            </td>

                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-label-caps uppercase font-bold ${
                                tif.status === 'Active' ? 'bg-onyx-black text-bone-white' : 'bg-surface-container text-secondary'
                              }`}>
                                {tif.status || 'Active'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => startEditTiffin(tif, e)}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-onyx-black transition-colors"
                                title="Edit Tiffin"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => toggleTiffinStatus(tif, e)}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-onyx-black transition-colors"
                                title={tif.status === 'Active' ? 'Pause Tiffin' : 'Activate Tiffin'}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {tif.status === 'Active' ? 'pause_circle' : 'play_circle'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeletingTiffin(tif); }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-secondary hover:text-rose-600 transition-colors"
                                title="Delete Tiffin"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Side Inspector Dossier (5 Columns on desktop) */}
            {selectedTiffin && (
              <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 shadow-xs overflow-hidden sticky top-20 space-y-4 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-onyx-black"></span>
                    <span className="font-label-caps text-xs uppercase font-bold text-onyx-black">Active Item Dossier</span>
                  </div>
                  <span className="font-mono text-[10px] text-secondary">ID: {selectedTiffin.id}</span>
                </div>

                <div className="w-full h-40 rounded-xl overflow-hidden border border-sand-neutral/40 relative">
                  <img src={selectedTiffin.image || presetImages[0].url} alt={selectedTiffin.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-onyx-black/85 text-bone-white text-[10px] font-label-caps px-2 py-0.5 rounded font-bold uppercase">
                    {selectedTiffin.category} • {selectedTiffin.foodType}
                  </span>
                </div>

                <div>
                  <h3 className="font-headline-md text-xl text-on-surface">{selectedTiffin.name}</h3>
                  <p className="font-body-md text-xs text-secondary mt-1">{selectedTiffin.description || selectedTiffin.ingredients}</p>
                </div>

                <div className="p-3 bg-surface-container-low rounded-xl space-y-2 border border-sand-neutral/30 font-label-caps text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Base Price:</span>
                    <span className="font-bold text-onyx-black">₹{selectedTiffin.price}.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Estimated Net Payout (87.5%):</span>
                    <span className="font-bold text-emerald-800">₹{selectedTiffin.netPayout || Math.round(selectedTiffin.price * 0.875)}.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Daily Capacity:</span>
                    <span className="font-bold text-onyx-black">{selectedTiffin.capacity || 25} Meals</span>
                  </div>
                </div>

                {Array.isArray(selectedTiffin.items) && selectedTiffin.items.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-sand-neutral/30">
                    <span className="font-label-caps text-[11px] font-bold text-secondary uppercase block">Meal Composition</span>
                    <div className="space-y-1.5">
                      {selectedTiffin.items.map((item, idx) => (
                        <div key={idx} className="p-2 bg-surface-container-low rounded-lg text-xs text-on-surface font-medium flex items-center justify-between">
                          <span>{item}</span>
                          <span className="material-symbols-outlined text-[14px] text-emerald-600">check</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-sand-neutral/40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => startEditTiffin(selectedTiffin, e)}
                    className="flex-1 py-2.5 bg-onyx-black text-bone-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer text-center"
                  >
                    Edit Specification
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleTiffinStatus(selectedTiffin, e)}
                    className="py-2.5 px-4 bg-surface-container text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    {selectedTiffin.status === 'Active' ? 'Pause' : 'Activate'}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 2 — ADD NEW TIFFIN SUB-VIEW                                         */}
      {/* ========================================================================= */}
      {subView === 'add' && (
        <form onSubmit={(e) => handleSaveTiffin(e, true)} className="space-y-6 max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sand-neutral/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-label-caps text-xs text-secondary tracking-wider uppercase">
                <span>Provider</span>
                <span>/</span>
                <span>My Tiffins</span>
                <span>/</span>
                <span className="text-onyx-black font-bold">{editingTiffin ? 'Edit Tiffin' : 'Add New Tiffin'}</span>
              </div>
              <h1 class="font-headline-lg text-3xl text-on-surface">{editingTiffin ? 'Edit Tiffin Specification' : 'Add New Tiffin'}</h1>
              <p class="font-body-md text-xs text-secondary">
                Author a home-cooked meal offering, define portion architectures, set pricing tiers, and configure kitchen preparation limits.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setSubView('all')}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingTiffin ? 'Update Tiffin' : 'Save & Publish Live'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Main Fields (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Basic Information */}
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
                  <span className="font-label-caps text-xs uppercase font-bold text-onyx-black">01 / Basic Information</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">restaurant_menu</span>
                </div>

                <div className="space-y-2">
                  <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Tiffin Name *</label>
                  <input 
                    type="text"
                    required
                    value={formState.name}
                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                    placeholder="e.g. Gujarati Special Kathiyawadi Thali"
                    className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Category *</label>
                    <select 
                      value={formState.category}
                      onChange={e => setFormState({ ...formState, category: e.target.value })}
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none cursor-pointer"
                    >
                      <option value="Gujarati">Gujarati</option>
                      <option value="Punjabi">Punjabi</option>
                      <option value="Jain">Jain</option>
                      <option value="Kathiyawadi">Kathiyawadi</option>
                      <option value="Wellness">Wellness</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Dietary Type *</label>
                    <select 
                      value={formState.foodType}
                      onChange={e => setFormState({ ...formState, foodType: e.target.value })}
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none cursor-pointer"
                    >
                      <option value="Pure Veg">Pure Veg</option>
                      <option value="Jain Friendly">Jain Friendly</option>
                      <option value="Vegan">Vegan</option>
                      <option value="High Protein">High Protein</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Description & Ingredients</label>
                  <textarea 
                    rows={3}
                    value={formState.description}
                    onChange={e => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Slow-roasted eggplant, phulka rotis, sev tameta gravy, whipped buttermilk, and sweet."
                    className="w-full bg-surface-container-low p-3 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none focus:bg-surface-container-lowest"
                  />
                </div>

                {/* Compartments Tag Builder */}
                <div className="space-y-2">
                  <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Included Items (Compartments)</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low rounded-xl border border-sand-neutral/40">
                    {formState.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-lowest border border-sand-neutral/40 rounded-lg text-xs font-label-caps font-bold text-onyx-black">
                        {item}
                        <button 
                          type="button" 
                          onClick={() => setFormState({ ...formState, items: formState.items.filter((_, i) => i !== idx) })} 
                          className="text-secondary hover:text-rose-600 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1 flex-1 min-w-[160px]">
                      <input 
                        type="text"
                        value={newItemTag}
                        onChange={e => setNewItemTag(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newItemTag.trim()) {
                            e.preventDefault();
                            setFormState({ ...formState, items: [...formState.items, newItemTag.trim()] });
                            setNewItemTag('');
                          }
                        }}
                        placeholder="+ Type item & press Enter"
                        className="w-full bg-transparent text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kitchen Logistics & Capacity */}
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
                  <span className="font-label-caps text-xs uppercase font-bold text-onyx-black">02 / Kitchen Logistics</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">soup_kitchen</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Daily Portion Cap *</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      value={formState.capacity}
                      onChange={e => setFormState({ ...formState, capacity: e.target.value })}
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Lead Notice Time</label>
                    <select 
                      value={formState.noticeTime}
                      onChange={e => setFormState({ ...formState, noticeTime: e.target.value })}
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none cursor-pointer"
                    >
                      <option value="30 Mins Notice">30 Mins Notice</option>
                      <option value="2 Hours Notice">2 Hours Notice</option>
                      <option value="4 Hours Notice">4 Hours Notice</option>
                      <option value="1 Day Prior">1 Day Prior</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Assigned Station</label>
                    <select 
                      value={formState.prepStation}
                      onChange={e => setFormState({ ...formState, prepStation: e.target.value })}
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none cursor-pointer"
                    >
                      <option value="Station 1 (Breads & Roti)">Station 1 (Breads)</option>
                      <option value="Station 2 (Slow Curries)">Station 2 (Curries)</option>
                      <option value="Station 3 (Packing & QC)">Station 3 (Packing)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Active Service Days</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFormState({
                          ...formState,
                          days: { ...formState.days, [day]: !formState.days[day] }
                        })}
                        className={`py-2 rounded-xl text-[11px] font-label-caps font-bold transition-all cursor-pointer ${
                          formState.days[day] ? 'bg-onyx-black text-bone-white' : 'bg-surface-container-low text-secondary'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tiffin Image Selector */}
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
                  <span className="font-label-caps text-xs uppercase font-bold text-onyx-black">03 / Tiffin Imagery</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">photo_camera</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img src={formState.image} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-sand-neutral/50 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <span className="font-label-caps text-xs font-bold text-secondary uppercase block">Select Preset Culinary Image</span>
                    <div className="flex flex-wrap gap-2">
                      {presetImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormState({ ...formState, image: img.url })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                            formState.image === img.url ? 'bg-onyx-black text-bone-white border-onyx-black' : 'bg-surface-container-low text-secondary border-sand-neutral/40'
                          }`}
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Economics & Publication (4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Pricing Architecture */}
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
                  <span className="font-label-caps text-xs uppercase font-bold text-onyx-black">04 / Economics</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
                </div>

                <div className="space-y-2">
                  <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Base Price (₹) *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={formState.price}
                    onChange={e => setFormState({ ...formState, price: e.target.value })}
                    className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface border border-sand-neutral/40 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-label-caps text-xs uppercase font-bold text-secondary">Discount (%)</label>
                  <input 
                    type="number"
                    min={0}
                    max={90}
                    value={formState.discount}
                    onChange={e => setFormState({ ...formState, discount: e.target.value })}
                    className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-xs text-on-surface border border-sand-neutral/40 focus:outline-none"
                  />
                </div>

                {/* Settlement Ledger Card */}
                <div className="p-4 bg-surface-container-low rounded-xl space-y-2 font-label-caps text-xs border border-sand-neutral/30">
                  <div className="flex justify-between items-center text-secondary">
                    <span>Customer Price:</span>
                    <span className="font-bold text-onyx-black">₹{netPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-secondary">
                    <span>TiffinLink Fee (12.5%):</span>
                    <span>- ₹{(netPrice * 0.125).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-sand-neutral/40 flex justify-between items-center font-bold">
                    <span className="text-onyx-black">Est. Provider Payout:</span>
                    <span className="text-emerald-800 text-sm">₹{estimatedPayout}.00</span>
                  </div>
                </div>
              </div>

              {/* Release Gate Actions */}
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-onyx-black text-bone-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Processing...' : 'Save & Publish Live'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSaveTiffin(e, false)}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-surface-container text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Save as Inactive
                </button>
              </div>

            </div>

          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* PART 3 — AVAILABILITY & SLOTS SUB-VIEW                                    */}
      {/* ========================================================================= */}
      {subView === 'availability' && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sand-neutral/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-label-caps text-xs text-secondary tracking-wider uppercase">
                <span>Provider</span>
                <span>/</span>
                <span>My Tiffins</span>
                <span>/</span>
                <span className="text-onyx-black font-bold">Tiffin Availability</span>
              </div>
              <h1 class="font-headline-lg text-3xl text-on-surface">Tiffin Availability</h1>
              <p class="font-body-md text-xs text-secondary">
                Configure weekly dispatch schedules, calibrate preparation thresholds, and set precision time windows for authentic daily home-cooked services.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={fetchTiffins}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-sand-neutral/50 text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Sync Schedules</span>
              </button>
              <button 
                type="button"
                onClick={() => showToast('✓ Availability changes committed to MongoDB!')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Save All Changes</span>
              </button>
            </div>
          </div>

          {/* Tiffin Selector Bar */}
          <div className="p-3 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs flex items-center gap-2 overflow-x-auto">
            {tiffins.map(t => {
              const isSelected = selectedTiffin && (selectedTiffin.id === t.id || selectedTiffin._id === t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTiffinId(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected ? 'bg-onyx-black text-bone-white' : 'bg-surface-container-low text-secondary hover:text-onyx-black'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          {/* Master Banner for Selected Tiffin */}
          {selectedTiffin && (
            <div className="p-6 rounded-2xl bg-surface-container-low border border-sand-neutral/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img src={selectedTiffin.image || presetImages[0].url} alt={selectedTiffin.name} className="w-20 h-20 rounded-xl object-cover border border-sand-neutral/50 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 font-label-caps text-xs font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>{selectedTiffin.status === 'Active' ? 'Active Menu Item' : 'Paused Menu Item'}</span>
                  </div>
                  <h2 className="font-headline-md text-2xl text-on-surface mt-0.5">{selectedTiffin.name}</h2>
                  <div className="text-xs text-secondary font-label-caps mt-1">
                    Base Price: <strong className="text-onyx-black">₹{selectedTiffin.price}.00</strong> • Base Cap: <strong className="text-onyx-black">{selectedTiffin.capacity || 25} meals/shift</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-sand-neutral/40 flex items-center gap-4">
                <div>
                  <div className="font-label-caps text-xs font-bold text-onyx-black uppercase">Kitchen Master Availability</div>
                  <div className="text-[11px] text-secondary font-label-caps">Toggle online storefront bookings</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => toggleTiffinStatus(selectedTiffin, e)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTiffin.status === 'Active' ? 'bg-onyx-black text-bone-white' : 'bg-surface-container text-secondary'
                  }`}
                >
                  {selectedTiffin.status === 'Active' ? 'ONLINE' : 'OFFLINE'}
                </button>
              </div>
            </div>
          )}

          {/* Weekly Schedule Rows */}
          {selectedTiffin && (
            <div className="space-y-4">
              <h3 className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary">Weekly Roster & Portion Quotas</h3>

              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                  const isDayActive = Array.isArray(selectedTiffin.days) ? selectedTiffin.days.includes(day) : true;
                  const dayCap = selectedTiffin.capacity || 25;
                  const booked = selectedTiffin.ordersToday || Math.floor(dayCap * (isDayActive ? 0.6 : 0));

                  return (
                    <div 
                      key={day} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isDayActive ? 'bg-surface-container-lowest border-sand-neutral/40 shadow-xs' : 'bg-surface-container-low border-sand-neutral/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-[180px]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-label-caps font-bold text-xs ${
                          isDayActive ? 'bg-onyx-black text-bone-white' : 'bg-surface-container text-secondary'
                        }`}>
                          0{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-headline-md text-xl text-on-surface">{day}</h4>
                          <span className={`inline-block font-label-caps text-[10px] font-bold uppercase ${
                            isDayActive ? 'text-emerald-800' : 'text-secondary'
                          }`}>
                            {isDayActive ? '● Available' : '○ Unavailable'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 min-w-[200px] font-label-caps text-xs">
                        <span className="text-secondary uppercase text-[10px] font-bold block">Serving Window</span>
                        <div className="font-bold text-onyx-black flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">schedule</span>
                          <span>11:30 AM — 02:00 PM</span>
                        </div>
                      </div>

                      <div className="flex-1 max-w-xs space-y-1.5">
                        <div className="flex justify-between font-label-caps text-xs text-secondary">
                          <span>Capacity: <strong class="text-onyx-black">{dayCap} Meals</strong></span>
                          <span class="font-bold text-onyx-black">{booked} Booked</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-onyx-black rounded-full" style={{ width: `${Math.min(100, Math.round((booked / dayCap) * 100))}%` }}></div>
                        </div>
                        <div className="text-[10px] font-mono text-secondary flex justify-between">
                          <span>Remaining: {Math.max(0, dayCap - booked)} meals</span>
                          <span>{Math.round((booked / dayCap) * 100)}% Filled</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end lg:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            const newCap = prompt(`Override portion capacity for ${day}:`, dayCap);
                            if (newCap && !isNaN(newCap)) {
                              showToast(`✓ ${day} capacity updated to ${newCap} meals.`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          Quick Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast(`✓ ${day} schedule saved.`)}
                          className="px-3 py-1.5 rounded-lg bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
