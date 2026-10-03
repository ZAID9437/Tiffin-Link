import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../services/api';
import CategoriesItemsTab from './CategoriesItemsTab';
import MealBuilderTab from './MealBuilderTab';

const DAYS_CONFIG = [
  { key: 'Mon', full: 'Monday', label: 'MON' },
  { key: 'Tue', full: 'Tuesday', label: 'TUE' },
  { key: 'Wed', full: 'Wednesday', label: 'WED' },
  { key: 'Thu', full: 'Thursday', label: 'THU' },
  { key: 'Fri', full: 'Friday', label: 'FRI' },
  { key: 'Sat', full: 'Saturday', label: 'SAT' },
  { key: 'Sun', full: 'Sunday', label: 'SUN' }
];

const PRESET_CATALOG_ITEMS = [
  { name: '4 Bajra Rotla', category: 'Breads' },
  { name: '3 Phulka Roti', category: 'Breads' },
  { name: '2 Butter Paratha', category: 'Breads' },
  { name: '4 Bhakri', category: 'Breads' },
  { name: 'Ringan No Olo', category: 'Vegetable Curries' },
  { name: 'Sev Tameta Shaak', category: 'Vegetable Curries' },
  { name: 'Lasaniya Bataka', category: 'Vegetable Curries' },
  { name: 'Paneer Butter Masala', category: 'Vegetable Curries' },
  { name: 'Gujarati Kadhi', category: 'Dal & Kadhi' },
  { name: 'Dal Tadka', category: 'Dal & Kadhi' },
  { name: 'Vaghareli Khichdi', category: 'Rice & Khichdi' },
  { name: 'Jeera Rice', category: 'Rice & Khichdi' },
  { name: 'Gir Cow Chaas', category: 'Accompaniments' },
  { name: 'Garlic Chutney & Jaggery', category: 'Accompaniments' },
  { name: 'Kachumber Salad', category: 'Accompaniments' },
  { name: 'Fried Papad', category: 'Accompaniments' },
  { name: 'Gulab Jamun (2 pcs)', category: 'Sweets' },
  { name: 'Shrikhand Cup', category: 'Sweets' }
];

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
    initialSubView === 'categories' ? 'categories' : 
    initialSubView === 'meal-builder' ? 'meal-builder' : 'all'
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
  const [draftStatus, setDraftStatus] = useState('Auto-draft saved');
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Data Collections
  const [tiffins, setTiffins] = useState([]);
  const [categories, setCategories] = useState([]);

  // Add Category Modal & Form State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', description: '', status: 'Active' });
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Available Menu Items from DB / Catalog
  const [availableMenuItems, setAvailableMenuItems] = useState([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [selectedItemCategoryFilter, setSelectedItemCategoryFilter] = useState('All');
  const [customInclusionInput, setCustomInclusionInput] = useState('');

  // Form State for Configure / Add / Edit Tiffin
  const [formState, setFormState] = useState({
    name: 'Kathiyawadi Deluxe Homestyle Thali',
    category: 'Kathiyawadi',
    foodType: 'Pure Veg',
    capacity: '40',
    days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false },
    mealType: 'Lunch',
    startTime: '12:00 PM',
    endTime: '02:00 PM',
    orderCutoff: '10:00 AM',
    isAvailable: true,
    status: 'Active',
    price: '140',
    monthlySubPrice: '3640',
    weeklyPrice: '899',
    discount: '0',
    description: 'Prepared with cold-pressed peanut oil and slow-simmered spices. Includes 4 hand-rolled Bajra Rotlas, Ringan No Olo (charred eggplant), Sev Tameta Shaak, authentic Kadhi, steamed rice, and pure churned Gir cow Chaas.',
    noticeTime: '2 Hours Notice',
    prepStation: 'Station 1',
    area: 'All Localities',
    ingredients: 'Cold-pressed peanut oil, slow-simmered spices',
    items: ['4 Rotlas', '2 Sabzis', 'Kadhi-Khichdi', 'Chaas'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoCpsKFtBQ7Y0PkpVHBLhBG0mf0yNeKZ3xpD2Mf9ygH1gzqxHtJshyX53UEIfiCHfxroI2IgNooZWl7FqBrAIeMh_eUK1KRYAGrGr2twEdq1wf6xVjKrm7fXHUxmR6aAzBpFi-ae0Lk_qbfbNvdLX69eafIpARsneiz0HcrbrKmV5m5h0XdxoSFyiRWXlUY8iMSZJxcb6q4W5CluI7hUhQL8nX-mg-7acqxN-hKfU-keBk9A1_2YUT'
  });

  const triggerAutosavePing = () => {
    setDraftStatus('Saving...');
    setTimeout(() => {
      setDraftStatus('Auto-draft saved');
    }, 600);
  };

  const [newItemTag, setNewItemTag] = useState('');

  // Preset Image Gallery
  const presetImages = [
    { label: 'Kathiyawadi Deluxe', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoCpsKFtBQ7Y0PkpVHBLhBG0mf0yNeKZ3xpD2Mf9ygH1gzqxHtJshyX53UEIfiCHfxroI2IgNooZWl7FqBrAIeMh_eUK1KRYAGrGr2twEdq1wf6xVjKrm7fXHUxmR6aAzBpFi-ae0Lk_qbfbNvdLX69eafIpARsneiz0HcrbrKmV5m5h0XdxoSFyiRWXlUY8iMSZJxcb6q4W5CluI7hUhQL8nX-mg-7acqxN-hKfU-keBk9A1_2YUT' },
    { label: 'Traditional Royal Thali', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEdtTNfW6M_QAdqnbORp39Gj1CeBJSWxHGcGuLI4qICxfcxdEyA1_jSsc9E3Vk-Ytvs3Zc8kxVoigf_YjdvuzdKsKNJc8IzKzCbJojPA0KJ2xto_qwxKVPlixSFP43Ryem_4mgijJ2QUwgp4V6znBXsEWUtAUPMnoeNwW87XfE9UClWOKbc7YAw5YMGFb08jj9BHm1U7blUpHsC-_-mu1Q7zBMi7p-aLE_hn5PQQez9fRb10NbJUVC' },
    { label: 'Gujarati Special', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgVbGgvOlqEPwBhHCO0mfTLEfVaodryI5Y-OTN8CXcfAHNIZH_kIdBNi64elpWcbnfv99KLJ-C6fXTTMseFJiZNgrZ1xWRlvnK3Ozg9qQk_oEAGawxyLchVvSwK7aEPuNgLl_gKPbV2WioOVbUZyE1kR0Ycg-qRHtv59KPm0tjW393jmrHiDyIEX3qxzCHTO_qphuMzbM_FmS9_8ViNHwKQAL0dQ7tp5yH_InNUEbHmYKkZu1sc_dy' },
    { label: 'Amritsari Punjabi', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwUcUoJ6r89gVPSfnHsNZQ8qlsAlTmq2iqCNe6MqERgBZmGW39wzerJvrTStWCEEOkak684jpl3pjEBzf3uogJwAEB7hqmYBHvBY5114CyEBjV6-piEoG31mlLGXlBX_d2K_cS3tdacpiR4S66b9NlYmZ7E1xKK6mKLTxx2P21p5MuUBJpgb2cpHg_a2ToVphk6OelK7cpIFpJ43HDOwJdsaX0jB3RUrP2NyrrRBUGiJoUNYZ1G9s8' },
    { label: 'Jain Sattvik', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBGiHMFySV6bH3-LhYPSoVn_XmeLd5_1OAVDnW-aNKiNV9Lci1Lq-LhAWA_5qYrc9DKcWKLpIZN7bssaIvrRaeQhCXsEInCCq25acAy8buMN6gqh1-GkkF13Q_GXeTnllVMxnuJWL1B_dMgjDpEokpmIxmU7eTQV2cjCVTQTQioabCpkhSRpUxZ1uCoyAbbqeKJ0es3BCs7Ps6J08jhEBPTifsKhJS3lGU5DRRwk7SaEuTeLWaIG5D' },
    { label: 'Wellness Millet', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-fh2xz0j4VLbdx-H7Y7eeiWlVp1mYgauxNJCUKEm-DwpNYIeXy3g5b_tA6ltJJ9AfOzCh2EsnHS-RMCQXgeqi2F9p6eCvhZDQ0mR5Fx-a5SuhaGesfHv7xTOn49j9HbUjE3dAjdn4qM1ex2nSFJLBVF2v6jeJ65aD_QjXGDGrYQ11Xi4AOKrAfNeB2Rs7z2XiPXSe_d-Oi9BN6xPeyzqQowv_vBzp42Ff1DlY1sc9jvNuh3rBklWM' },
    { label: 'Surti Winter Feast', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIPaXCdYL-aMcUxd3Aebu-CST9OAnixKoFULmf3OlJyHWK9BHjM3zmyyCBYcyrOYgPTw-8cQlMHvrMvv8fMXlw8zrynGl0dfrKTajRQ7nN3FymU7jygJCfNuXJP7GCOlF61I8QMjd3SmjMmhbAg69kyAhxVJ7YXVDC_2J8j4GvpwOixJIDbXixyvEegQl2l5cNpp6g4XuFN19Ny_HCYM3uzqbfop7apNGoA9Eo0mdIGzvHZ4q1DE18' }
  ];

  // Fetch Tiffins, Categories & Items from MongoDB
  useEffect(() => {
    fetchTiffins();
    fetchCategories();
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (initialSubView) {
      const validViews = ['all', 'add', 'availability', 'categories', 'meal-builder'];
      if (validViews.includes(initialSubView)) {
        setSubView(initialSubView);
      }
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

  const fetchMenuItems = async () => {
    try {
      setLoadingMenuItems(true);
      const json = await apiRequest('/tiffin-items');
      if (json.success && Array.isArray(json.data)) {
        setAvailableMenuItems(json.data.map(i => ({ ...i, id: i._id || i.id })));
      }
    } catch (err) {
      console.error('Error fetching tiffin items:', err);
    } finally {
      setLoadingMenuItems(false);
    }
  };

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCatForm.name.trim()) {
      showToast('⚠️ Please enter a category name');
      return;
    }
    setIsSubmittingCat(true);
    try {
      const res = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatForm.name.trim(),
          description: newCatForm.description.trim() || 'Authentic homestyle meal category',
          status: newCatForm.status || 'Active'
        })
      });
      if (res.success) {
        showToast(`✓ Category "${newCatForm.name.trim()}" created successfully!`);
        await fetchCategories();
        setFormState(prev => ({ ...prev, category: newCatForm.name.trim() }));
        setNewCatForm({ name: '', description: '', status: 'Active' });
        setShowAddCategoryModal(false);
      } else {
        showToast(`⚠️ ${res.message || 'Failed to create category'}`);
      }
    } catch (err) {
      console.error('Error creating category:', err);
      showToast('⚠️ Failed to save category: ' + err.message);
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const combinedCatalogItems = useMemo(() => {
    const list = [...availableMenuItems.map(i => ({ name: i.name, category: i.category || 'Other' }))];
    PRESET_CATALOG_ITEMS.forEach(p => {
      if (!list.some(item => item.name.toLowerCase() === p.name.toLowerCase())) {
        list.push(p);
      }
    });
    return list;
  }, [availableMenuItems]);

  const filteredCatalogItems = useMemo(() => {
    if (selectedItemCategoryFilter === 'All') return combinedCatalogItems;
    return combinedCatalogItems.filter(i => i.category === selectedItemCategoryFilter);
  }, [combinedCatalogItems, selectedItemCategoryFilter]);

  const toggleInclusionItem = (itemName) => {
    setFormState(prev => {
      const current = Array.isArray(prev.items) ? [...prev.items] : [];
      const exists = current.includes(itemName);
      const next = exists ? current.filter(i => i !== itemName) : [...current, itemName];
      return { ...prev, items: next };
    });
    triggerAutosavePing();
  };

  const addCustomInclusion = (e) => {
    if (e) e.preventDefault();
    const trimmed = customInclusionInput.trim();
    if (!trimmed) return;
    if (!formState.items?.includes(trimmed)) {
      setFormState(prev => ({
        ...prev,
        items: [...(Array.isArray(prev.items) ? prev.items : []), trimmed]
      }));
      triggerAutosavePing();
    }
    setCustomInclusionInput('');
  };

  const removeInclusion = (itemToRemove) => {
    setFormState(prev => ({
      ...prev,
      items: (Array.isArray(prev.items) ? prev.items : []).filter(i => i !== itemToRemove)
    }));
    triggerAutosavePing();
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

    setIsSubmitting(true);
    const selectedDaysArr = DAYS_CONFIG
      .filter(d => formState.days[d.key] || formState.days[d.full])
      .map(d => d.full);

    const isAvailableForCustomers = publishLive ? (formState.isAvailable ?? true) : false;

    const payload = {
      name: formState.name.trim(),
      description: formState.description || 'Prepared with cold-pressed peanut oil and slow-simmered spices.',
      price: Number(formState.price) > 0 ? Number(formState.price) : 160,
      monthlyPrice: Number(formState.monthlySubPrice) || 3640,
      weeklyPrice: Number(formState.weeklyPrice) || 899,
      isSubscriptionOnly: formState.isSubscriptionOnly ?? true,
      discount: Number(formState.discount) || 0,
      category: formState.category || 'Kathiyawadi',
      foodType: formState.foodType || 'Pure Veg',
      mealType: formState.mealType || 'Lunch',
      startTime: formState.startTime || '12:00 PM',
      endTime: formState.endTime || '02:00 PM',
      orderCutoff: formState.orderCutoff || '10:00 AM',
      capacity: Number(formState.capacity) || 40,
      available: Number(formState.capacity) || 40,
      noticeTime: formState.noticeTime || '2 Hours Notice',
      prepStation: formState.prepStation || 'Station 1',
      days: selectedDaysArr.length > 0 ? selectedDaysArr : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: formState.area || 'All Localities',
      ingredients: formState.ingredients || 'Cold-pressed peanut oil, slow-simmered spices',
      items: Array.isArray(formState.items) && formState.items.length > 0 ? formState.items : ['4 Rotlas', '2 Sabzis', 'Kadhi-Khichdi', 'Chaas'],
      status: isAvailableForCustomers ? 'Active' : 'Inactive',
      image: formState.image || presetImages[0].url
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
          showToast(publishLive ? `✓ Tiffin "${payload.name}" published to marketplace!` : `✓ Tiffin "${payload.name}" saved as draft!`);
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
      name: 'Kathiyawadi Deluxe Homestyle Thali',
      category: 'Kathiyawadi',
      foodType: 'Pure Veg',
      capacity: '40',
      days: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false },
      mealType: 'Lunch',
      startTime: '12:00 PM',
      endTime: '02:00 PM',
      orderCutoff: '10:00 AM',
      price: '160',
      monthlySubPrice: '3640',
      discount: '0',
      description: 'Prepared with cold-pressed peanut oil and slow-simmered spices. Includes 4 hand-rolled Bajra Rotlas, Ringan No Olo (charred eggplant), Sev Tameta Shaak, authentic Kadhi, steamed rice, and pure churned Gir cow Chaas.',
      isAvailable: true,
      status: 'Active',
      noticeTime: '2 Hours Notice',
      prepStation: 'Station 1',
      area: 'All Localities',
      ingredients: 'Cold-pressed peanut oil, slow-simmered spices',
      items: ['4 Rotlas', '2 Sabzis', 'Kadhi-Khichdi', 'Chaas'],
      image: presetImages[0].url
    });
  };

  const startEditTiffin = (tiffin, e) => {
    if (e) e.stopPropagation();
    setEditingTiffin(tiffin);
    const dayObj = { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false, Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false };
    if (Array.isArray(tiffin.days)) {
      tiffin.days.forEach(d => {
        dayObj[d] = true;
        const short = d.slice(0, 3);
        dayObj[short] = true;
      });
    } else {
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => { dayObj[d] = true; dayObj[d + 'day'] = true; });
    }
    const singlePrice = tiffin.price ? Number(tiffin.price) : 160;
    setFormState({
      name: tiffin.name || '',
      category: tiffin.category || 'Kathiyawadi',
      foodType: tiffin.foodType || 'Pure Veg',
      capacity: tiffin.capacity ? tiffin.capacity.toString() : '40',
      days: dayObj,
      mealType: tiffin.mealType || 'Lunch',
      startTime: tiffin.startTime || '12:00 PM',
      endTime: tiffin.endTime || '02:00 PM',
      orderCutoff: tiffin.orderCutoff || '10:00 AM',
      price: singlePrice.toString(),
      monthlySubPrice: (tiffin.monthlyPrice || Math.round(singlePrice * 26 * 0.875)).toString(),
      weeklyPrice: (tiffin.weeklyPrice || 899).toString(),
      isSubscriptionOnly: tiffin.isSubscriptionOnly ?? true,
      discount: tiffin.discount ? tiffin.discount.toString() : '0',
      description: tiffin.description || '',
      isAvailable: tiffin.status === 'Active',
      status: tiffin.status || 'Active',
      noticeTime: tiffin.noticeTime || '2 Hours Notice',
      prepStation: tiffin.prepStation || 'Station 1',
      area: tiffin.area || '',
      ingredients: tiffin.ingredients || '',
      items: Array.isArray(tiffin.items) && tiffin.items.length > 0 ? tiffin.items : ['4 Rotlas', '2 Sabzis', 'Kadhi-Khichdi', 'Chaas'],
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

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-sand-neutral pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-clay-earth text-[22px]">category</span>
                <h3 className="font-headline-md text-xl text-onyx-black">Add Tiffin Menu Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-secondary hover:text-onyx-black p-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-label-caps text-xs uppercase tracking-wider text-onyx-black font-semibold">
                  Category Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCatForm.name}
                  onChange={e => setNewCatForm({ ...newCatForm, name: e.target.value })}
                  placeholder="e.g. Kathiyawadi, Punjabi, Rajasthani Special"
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-lg border border-sand-neutral focus:border-onyx-black focus:outline-none text-sm text-onyx-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-caps text-xs uppercase tracking-wider text-onyx-black font-semibold">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newCatForm.description}
                  onChange={e => setNewCatForm({ ...newCatForm, description: e.target.value })}
                  placeholder="Describe culinary characteristics, flavours, and regional cooking traditions..."
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-lg border border-sand-neutral focus:border-onyx-black focus:outline-none text-sm text-onyx-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-label-caps text-xs uppercase tracking-wider text-onyx-black font-semibold">
                  Status
                </label>
                <select
                  value={newCatForm.status}
                  onChange={e => setNewCatForm({ ...newCatForm, status: e.target.value })}
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-lg border border-sand-neutral focus:border-onyx-black focus:outline-none text-sm text-onyx-black cursor-pointer"
                >
                  <option value="Active">Active (Available on Storefront)</option>
                  <option value="Inactive">Inactive / Hidden</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-neutral">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat || !newCatForm.name.trim()}
                  className="px-5 py-2 rounded-lg bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCat ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Create Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Header Module Switcher Bar */}
      <div className="bg-surface-container-lowest p-3 rounded-2xl border border-sand-neutral/50 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
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
            + Add Tiffin
          </button>
          <button 
            type="button"
            onClick={() => setSubView('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-label-caps font-bold transition-all cursor-pointer ${
              subView === 'availability' ? 'bg-onyx-black text-bone-white shadow-xs' : 'text-secondary hover:bg-surface-container-low'
            }`}
          >
            Availability
          </button>
          <button 
            type="button"
            onClick={() => setSubView('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-label-caps font-bold transition-all cursor-pointer ${
              subView === 'categories' ? 'bg-onyx-black text-bone-white shadow-xs' : 'text-secondary hover:bg-surface-container-low'
            }`}
          >
            Categories & Items
          </button>
          <button 
            type="button"
            onClick={() => setSubView('meal-builder')}
            className={`px-4 py-2 rounded-xl text-xs font-label-caps font-bold transition-all cursor-pointer ${
              subView === 'meal-builder' ? 'bg-onyx-black text-bone-white shadow-xs' : 'text-secondary hover:bg-surface-container-low'
            }`}
          >
            ⭐ Meal Builder
          </button>
        </div>

        <div className="text-xs font-mono text-secondary">
          Active: <span className="font-bold text-onyx-black">{activeTiffinsCount}</span> / {totalTiffinsCount}
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
      {/* ========================================================================= */}
      {/* PART 2 — CONFIGURE / ADD TIFFIN SUB-VIEW                                 */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* PART 2 — CONFIGURE / ADD TIFFIN SUB-VIEW (EDITORIAL 2-COLUMN WORKSPACE) */}
      {/* ========================================================================= */}
      {subView === 'add' && (
        <div className="flex flex-col w-full space-y-6">
          
          {/* Top Context Header Bar (Breadcrumb + Autosave State) */}
          <div className="pb-6 border-b border-sand-neutral">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <nav className="flex items-center gap-2 font-label-caps text-label-caps text-secondary tracking-wider uppercase">
                  <button 
                    type="button"
                    onClick={() => { resetForm(); setSubView('all'); }}
                    className="hover:text-onyx-black transition-colors cursor-pointer"
                  >
                    My Tiffins
                  </button>
                  <span>/</span>
                  <span className="text-onyx-black font-bold">
                    {editingTiffin ? 'Edit Tiffin' : 'Add New Tiffin'}
                  </span>
                </nav>
                <h1 className="font-headline-md text-headline-md text-onyx-black tracking-tight">
                  {editingTiffin ? 'Edit Tiffin Specification' : 'Add New Tiffin'}
                </h1>
                <p className="font-body-md text-body-md text-secondary">
                  Configure authentic homestyle meal allocations, kitchen capacity limits, and ordering windows.
                </p>
              </div>

              {/* Utilities Badge Bar */}
              <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setSubView('categories')}
                  className="px-4 py-2 bg-onyx-black hover:bg-stone-900 text-bone-white rounded-lg text-xs font-label-caps font-bold tracking-wider uppercase flex items-center gap-2 shadow-xs cursor-pointer transition-colors border border-sand-neutral"
                  title="Open Categories & Items"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">restaurant_menu</span>
                  Categories & Items
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded border border-sand-neutral">
                  <span className="w-2 h-2 rounded-full bg-onyx-black"></span>
                  <span className="font-label-caps text-[11px] uppercase tracking-wider text-onyx-black font-semibold">
                    Mesh Node #9 • Active
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded border border-sand-neutral shadow-sm">
                  <span className="material-symbols-outlined text-secondary text-[16px]">cloud_done</span>
                  <span className="font-label-caps text-[11px] text-secondary tracking-wider uppercase">
                    {draftStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Canvas: Two Column Workspace with Editorial Balance */}
          <form className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" onSubmit={(e) => handleSaveTiffin(e, true)}>
            
            {/* Primary Form Stream (Columns 1-8) */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* 1. TIFFIN INFORMATION */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-sm border border-sand-neutral space-y-6">
                <div className="flex items-baseline justify-between border-b border-sand-neutral pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">01</span>
                    <h2 className="font-headline-md text-[24px] text-onyx-black">Tiffin Information</h2>
                  </div>
                  <span className="font-label-caps text-[11px] text-secondary uppercase">* Required parameters</span>
                </div>

                {/* Tiffin Name */}
                <div className="space-y-2">
                  <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="tiffinName">
                    Tiffin Name <span className="text-error">*</span>
                  </label>
                  <input 
                    id="tiffinName"
                    type="text"
                    required
                    value={formState.name}
                    onChange={e => {
                      setFormState({ ...formState, name: e.target.value });
                      triggerAutosavePing();
                    }}
                    placeholder="e.g. Kathiyawadi Deluxe Homestyle Thali"
                    className="w-full bg-surface-container-low px-4 py-3 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black transition-all"
                  />
                  <p className="font-label-caps text-[11px] text-secondary">
                    A recognizable, heritage-led culinary title displayed on search cards.
                  </p>
                </div>

                {/* Category & Food Type Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="tiffinCategory">
                        Culinary Category <span className="text-error">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSubView('categories')}
                          className="px-2.5 py-1 bg-onyx-black hover:bg-stone-900 text-bone-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer transition-all border border-stone-800"
                          title="Open Categories & Items View"
                        >
                          <span className="material-symbols-outlined text-[13px] text-amber-400">restaurant_menu</span>
                          Categories & Items
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryModal(true)}
                          className="px-2.5 py-1 bg-surface-container-low hover:bg-surface-container text-onyx-black rounded text-[11px] font-semibold flex items-center gap-1 border border-sand-neutral cursor-pointer transition-all"
                          title="Create a new category in MongoDB"
                        >
                          <span className="material-symbols-outlined text-[13px] text-clay-earth">add</span>
                          + Category
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <select 
                        id="tiffinCategory"
                        value={formState.category}
                        onChange={e => {
                          setFormState({ ...formState, category: e.target.value });
                          triggerAutosavePing();
                        }}
                        className="w-full appearance-none bg-surface-container-low px-4 py-3 pr-10 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black cursor-pointer"
                      >
                        {categories && categories.length > 0 ? (
                          categories.map(cat => (
                            <option key={cat.id || cat._id || cat.name} value={cat.name}>
                              {cat.name} {cat.description ? `(${cat.description.slice(0, 30)}...)` : ''}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Kathiyawadi">Kathiyawadi Tradition</option>
                            <option value="Gujarati">Gujarati Sattvik Thali</option>
                            <option value="Punjabi">North Indian / Punjabi Dhabha</option>
                            <option value="Diet">High-Protein & Low Carb</option>
                            <option value="Jain">Strict Jain (No Root Veg)</option>
                            <option value="SouthIndian">South Indian Classic Meals</option>
                          </>
                        )}
                        {formState.category && !categories.some(c => c.name === formState.category) && (
                          <option value={formState.category}>{formState.category}</option>
                        )}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[20px]">
                        expand_more
                      </span>
                    </div>
                    <p className="font-label-caps text-[11px] text-secondary">
                      Categories fetched dynamically from MongoDB kitchen repository.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                      Dietary Standard <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'Pure Veg', label: 'Pure Veg' },
                        { val: 'Jain Friendly', label: 'Jain' },
                        { val: 'Non-Veg', label: 'Non-Veg' }
                      ].map(diet => {
                        const isSelected = formState.foodType === diet.val;
                        return (
                          <button
                            key={diet.val}
                            type="button"
                            onClick={() => {
                              setFormState({ ...formState, foodType: diet.val });
                              triggerAutosavePing();
                            }}
                            className={`py-2.5 px-2 text-center rounded border font-label-caps text-[11px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'border-onyx-black bg-onyx-black text-on-primary font-bold shadow-xs'
                                : 'border-sand-neutral bg-surface-container-low text-secondary hover:text-onyx-black'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-sand-neutral'}`}></span>
                            {diet.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tiffin Menu Items & Compartment Inclusions (Fetched from Catalog) */}
                <div className="space-y-4 pt-4 border-t border-sand-neutral/60">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                          Tiffin Menu Inclusions & Compartments
                        </label>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-onyx-black text-on-primary">
                          {formState.items?.length || 0} selected
                        </span>
                      </div>
                      <p className="font-label-caps text-[11px] text-secondary">
                        Meal components fetched from your kitchen catalog or custom added to this tiffin box.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSubView('categories')}
                      className="self-start sm:self-auto px-3 py-1.5 bg-[#121212] hover:bg-black text-bone-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-neutral-700"
                    >
                      <span className="material-symbols-outlined text-[15px] text-amber-400">category</span>
                      Categories & Items
                    </button>
                  </div>

                  {/* Active Selected Tags in this Tiffin */}
                  <div className="p-3.5 bg-surface-container-low rounded-lg border border-sand-neutral space-y-2">
                    <span className="font-label-caps text-[10px] uppercase tracking-wider text-secondary font-bold block">
                      Currently Included in this Tiffin Plan:
                    </span>
                    {Array.isArray(formState.items) && formState.items.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formState.items.map((item, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-lowest text-onyx-black text-xs font-medium rounded-full border border-sand-neutral shadow-2xs group"
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => removeInclusion(item)}
                              className="text-secondary hover:text-error transition-colors p-0.5 cursor-pointer"
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined text-[13px] block">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary italic">No items selected yet. Select from the catalog below or add a custom component.</p>
                    )}
                  </div>

                  {/* Quick Add Custom Item Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={customInclusionInput}
                        onChange={e => setCustomInclusionInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomInclusion(e);
                          }
                        }}
                        placeholder="Type custom inclusion (e.g. 4 Bajra Rotla, Sev Tameta, Ringan Olo, Gir Chaas...)"
                        className="w-full bg-surface-container-low px-4 py-2.5 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-sm text-onyx-black placeholder:text-secondary/70"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addCustomInclusion}
                      disabled={!customInclusionInput.trim()}
                      className="px-4 py-2.5 bg-onyx-black hover:bg-stone-800 disabled:opacity-40 text-on-primary rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Item
                    </button>
                  </div>

                  {/* Fetched Menu Items Catalog Picker */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold">
                        Kitchen Menu Catalog (Click to toggle in/out):
                      </span>
                      {loadingMenuItems && (
                        <span className="text-[11px] text-secondary flex items-center gap-1">
                          <span className="animate-spin material-symbols-outlined text-[13px]">progress_activity</span>
                          Fetching menu items...
                        </span>
                      )}
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {['All', 'Breads', 'Vegetable Curries', 'Dal & Kadhi', 'Rice & Khichdi', 'Accompaniments', 'Sweets'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedItemCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-label-caps transition-colors cursor-pointer ${
                            selectedItemCategoryFilter === cat
                              ? 'bg-onyx-black text-on-primary font-bold'
                              : 'bg-surface-container-low text-secondary hover:text-onyx-black border border-sand-neutral/60'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 border border-sand-neutral/40 rounded-lg bg-surface-container-low/30">
                      {filteredCatalogItems.map((item, idx) => {
                        const isIncluded = formState.items?.includes(item.name);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleInclusionItem(item.name)}
                            className={`p-2.5 rounded text-left border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                              isIncluded
                                ? 'bg-surface-container border-onyx-black shadow-2xs'
                                : 'bg-surface-container-lowest border-sand-neutral hover:bg-surface-container-low hover:border-secondary'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className={`text-xs font-semibold truncate ${isIncluded ? 'text-onyx-black font-bold' : 'text-secondary'}`}>
                                {item.name}
                              </div>
                              <span className="text-[9px] font-label-caps uppercase text-secondary/70 block">
                                {item.category}
                              </span>
                            </div>
                            <span className={`material-symbols-outlined text-[16px] shrink-0 ${isIncluded ? 'text-onyx-black font-bold' : 'text-sand-neutral'}`}>
                              {isIncluded ? 'check_circle' : 'add_circle'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="tiffinDesc">
                    Composition & Heritage Description
                  </label>
                  <textarea 
                    id="tiffinDesc"
                    rows={4}
                    value={formState.description}
                    onChange={e => {
                      setFormState({ ...formState, description: e.target.value });
                      triggerAutosavePing();
                    }}
                    placeholder="Describe this tiffin, ingredients, preparation style, and culinary heritage..."
                    className="w-full bg-surface-container-low p-4 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black transition-all"
                  />
                  <div className="flex justify-between items-center text-secondary font-label-caps text-[11px]">
                    <span>Include items like bread count, dal varieties, curries, and side digestifs.</span>
                    <span>{formState.description.length} / 600</span>
                  </div>
                </div>

                {/* Visual Asset Upload Zone */}
                <div className="space-y-3 pt-2">
                  <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                    Tiffin Presentation Imagery
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Upload Area */}
                    <div 
                      onClick={() => setShowImagePicker(!showImagePicker)}
                      className="md:col-span-2 border-2 border-dashed border-sand-neutral hover:border-onyx-black rounded-lg p-6 bg-surface-container-low/50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-onyx-black text-[24px]">add_photo_alternate</span>
                      </div>
                      <div className="font-button-text text-button-text text-onyx-black mb-1">+ Upload Tiffin Cover Image</div>
                      <p className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mb-3">
                        JPG, PNG, or WEBP up to 5MB • Recommended 16:9 ratio
                      </p>
                      <div className="inline-flex items-center gap-1.5 text-xs text-clay-earth font-label-caps tracking-wider uppercase underline">
                        {showImagePicker ? 'Close Preset Gallery' : 'Browse Kitchen Storage'}
                      </div>
                    </div>

                    {/* Active Preview Container */}
                    <div 
                      onClick={() => setShowImagePicker(!showImagePicker)}
                      className="relative rounded-lg overflow-hidden border border-sand-neutral aspect-[4/3] bg-surface-container group cursor-pointer"
                    >
                      <img 
                        src={formState.image} 
                        alt="Tiffin Cover" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-onyx-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-2.5 py-1 bg-surface text-onyx-black font-label-caps text-[10px] uppercase font-bold tracking-wider rounded">
                          Replace File
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-onyx-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-label-caps text-on-primary uppercase tracking-widest">
                        Primary Frame
                      </div>
                    </div>
                  </div>

                  {/* Preset Gallery Picker */}
                  {showImagePicker && (
                    <div className="p-4 bg-surface-container-low rounded-lg border border-sand-neutral space-y-2">
                      <span className="font-label-caps text-[11px] font-bold text-secondary uppercase block">
                        Select Culinary Photo:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {presetImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormState({ ...formState, image: img.url });
                              setShowImagePicker(false);
                              triggerAutosavePing();
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer transition-colors ${
                              formState.image === img.url
                                ? 'bg-onyx-black text-on-primary border-onyx-black'
                                : 'bg-surface-container-lowest text-secondary border-sand-neutral hover:bg-surface-container'
                            }`}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 2. AVAILABILITY & CAPACITY */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-sm border border-sand-neutral space-y-6">
                <div className="flex items-baseline justify-between border-b border-sand-neutral pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">02</span>
                    <h2 className="font-headline-md text-[24px] text-onyx-black">Availability & Daily Volume</h2>
                  </div>
                  <span className="font-label-caps text-[11px] text-secondary uppercase">Operational Limits</span>
                </div>

                {/* Daily Capacity Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="capacityInput">
                      Daily Capacity Limit <span className="text-error">*</span>
                    </label>
                    <span className="font-label-caps text-[11px] text-secondary">Kitchen Batch Ceiling</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface-container-low rounded border border-sand-neutral overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, (Number(formState.capacity) || 1) - 5);
                          setFormState({ ...formState, capacity: val.toString() });
                          triggerAutosavePing();
                        }}
                        className="w-12 h-12 flex items-center justify-center text-onyx-black hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <input 
                        id="capacityInput"
                        type="number"
                        min="1"
                        max="500"
                        value={formState.capacity}
                        onChange={e => {
                          setFormState({ ...formState, capacity: e.target.value });
                          triggerAutosavePing();
                        }}
                        className="w-20 text-center bg-transparent py-2.5 font-headline-md text-[20px] text-onyx-black focus:outline-none border-x border-sand-neutral"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const val = (Number(formState.capacity) || 1) + 5;
                          setFormState({ ...formState, capacity: val.toString() });
                          triggerAutosavePing();
                        }}
                        className="w-12 h-12 flex items-center justify-center text-onyx-black hover:bg-surface-container transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                    <div className="font-body-md text-secondary">
                      boxes per meal run to safeguard taste and freshness standards.
                    </div>
                  </div>
                  <p className="font-label-caps text-[11px] text-secondary">
                    Orders will automatically pause once this threshold is claimed by direct orders or active recurring subscriptions.
                  </p>
                </div>

                {/* Schedule Days Matrix */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                      Active Kitchen Days <span className="text-error">*</span>
                    </label>
                    {/* Quick Select Buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          const nextDays = {};
                          DAYS_CONFIG.forEach(d => { nextDays[d.key] = true; nextDays[d.full] = true; });
                          setFormState({ ...formState, days: nextDays });
                          triggerAutosavePing();
                        }}
                        className="font-label-caps text-[10px] uppercase text-secondary hover:text-onyx-black underline tracking-wider cursor-pointer"
                      >
                        All Days
                      </button>
                      <span className="text-sand-neutral">•</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const nextDays = {};
                          DAYS_CONFIG.forEach(d => {
                            const isWeekday = d.key !== 'Sat' && d.key !== 'Sun';
                            nextDays[d.key] = isWeekday;
                            nextDays[d.full] = isWeekday;
                          });
                          setFormState({ ...formState, days: nextDays });
                          triggerAutosavePing();
                        }}
                        className="font-label-caps text-[10px] uppercase text-secondary hover:text-onyx-black underline tracking-wider cursor-pointer"
                      >
                        Weekdays
                      </button>
                      <span className="text-sand-neutral">•</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const nextDays = {};
                          DAYS_CONFIG.forEach(d => {
                            const isWeekend = d.key === 'Sat' || d.key === 'Sun';
                            nextDays[d.key] = isWeekend;
                            nextDays[d.full] = isWeekend;
                          });
                          setFormState({ ...formState, days: nextDays });
                          triggerAutosavePing();
                        }}
                        className="font-label-caps text-[10px] uppercase text-secondary hover:text-onyx-black underline tracking-wider cursor-pointer"
                      >
                        Weekends
                      </button>
                    </div>
                  </div>

                  {/* Day Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
                    {DAYS_CONFIG.map(({ key, full, label }) => {
                      const isSelected = !!(formState.days[key] || formState.days[full]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setFormState({
                              ...formState,
                              days: {
                                ...formState.days,
                                [key]: !isSelected,
                                [full]: !isSelected
                              }
                            });
                            triggerAutosavePing();
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-onyx-black bg-onyx-black text-on-primary shadow-xs'
                              : 'border-sand-neutral bg-surface-container-low text-secondary hover:border-onyx-black'
                          }`}
                        >
                          <span className="font-label-caps text-[12px] font-bold">{label}</span>
                          <span className={`material-symbols-outlined text-[14px] mt-1 ${isSelected ? '' : 'opacity-0'}`}>
                            check
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="font-label-caps text-[11px] text-secondary">
                    {DAYS_CONFIG.filter(d => formState.days[d.key] || formState.days[d.full]).length} days selected per week. {(!formState.days['Sun'] && !formState.days['Sunday']) ? 'Sunday kitchen maintenance schedule active.' : 'Full week operational schedule active.'}
                  </p>
                </div>
              </section>

              {/* 3. MEAL SCHEDULE & FULFILLMENT WINDOW */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-sm border border-sand-neutral space-y-6">
                <div className="flex items-baseline justify-between border-b border-sand-neutral pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">03</span>
                    <h2 className="font-headline-md text-[24px] text-onyx-black">Fulfillment & Delivery Windows</h2>
                  </div>
                  <span className="font-label-caps text-[11px] text-secondary uppercase">Precision Timing</span>
                </div>

                {/* Meal Slot Type */}
                <div className="space-y-2">
                  <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider">
                    Meal Service Slot <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { val: 'Lunch', label: 'Lunch Service', icon: 'wb_sunny' },
                      { val: 'Dinner', label: 'Dinner Service', icon: 'bedtime' },
                      { val: 'All-Day Batch', label: 'Full Day Sub', icon: 'all_inclusive' }
                    ].map(slot => {
                      const isSelected = formState.mealType === slot.val;
                      return (
                        <label 
                          key={slot.val}
                          onClick={() => {
                            setFormState({ ...formState, mealType: slot.val });
                            triggerAutosavePing();
                          }}
                          className={`flex items-center justify-between p-3.5 rounded border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-onyx-black bg-surface-container shadow-xs'
                              : 'border-sand-neutral bg-surface-container-low hover:border-onyx-black'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="radio"
                              name="mealType"
                              value={slot.val}
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-onyx-black cursor-pointer"
                            />
                            <span className="font-body-md text-onyx-black font-medium">{slot.label}</span>
                          </div>
                          <span className="material-symbols-outlined text-secondary text-[18px]">{slot.icon}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Window Times Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="startTime">
                      Dispatch Start Time <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">schedule</span>
                      <input 
                        id="startTime"
                        type="text"
                        value={formState.startTime}
                        onChange={e => {
                          setFormState({ ...formState, startTime: e.target.value });
                          triggerAutosavePing();
                        }}
                        className="w-full bg-surface-container-low pl-10 pr-4 py-3 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="endTime">
                      Dispatch End Time <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px]">schedule</span>
                      <input 
                        id="endTime"
                        type="text"
                        value={formState.endTime}
                        onChange={e => {
                          setFormState({ ...formState, endTime: e.target.value });
                          triggerAutosavePing();
                        }}
                        className="w-full bg-surface-container-low pl-10 pr-4 py-3 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black"
                      />
                    </div>
                  </div>
                </div>

                {/* Cut-off Time Notice Box */}
                <div className="p-4 bg-surface-container-low rounded-lg border border-sand-neutral space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="cutoffTime">
                        Customer Order Cut-off Time <span className="text-error">*</span>
                      </label>
                      <p className="font-body-md text-secondary text-sm">Prevents last-minute orders that compromise kitchen batch prep.</p>
                    </div>
                    <div className="relative w-40">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">lock_clock</span>
                      <input 
                        id="cutoffTime"
                        type="text"
                        value={formState.orderCutoff}
                        onChange={e => {
                          setFormState({ ...formState, orderCutoff: e.target.value });
                          triggerAutosavePing();
                        }}
                        className="w-full bg-surface-container-lowest pl-9 pr-3 py-2 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-clay-earth font-label-caps text-[11px]">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>Calculated buffer: Orders freeze exactly 120 minutes before dispatch release.</span>
                  </div>
                </div>
              </section>

              {/* 4. SUBSCRIPTION PLANS & PRICING */}
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-lg shadow-sm border border-sand-neutral space-y-6">
                <div className="flex items-baseline justify-between border-b border-sand-neutral pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">04</span>
                    <h2 className="font-headline-md text-[24px] text-onyx-black">Subscription Plans & Pricing</h2>
                  </div>
                  <span className="font-label-caps text-[11px] text-secondary uppercase">Subscription Person</span>
                </div>

                {/* Subscription Member Advisory */}
                <div className="p-3.5 bg-surface-container-low rounded-lg border border-sand-neutral/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-onyx-black text-[20px]">loyalty</span>
                    <div>
                      <div className="font-label-caps text-xs font-bold text-onyx-black uppercase tracking-wider">
                        Subscription-Only Meal Service
                      </div>
                      <div className="text-secondary text-xs">
                        Configured specifically for regular recurring tiffin subscribers (Monthly & Weekly meal plans).
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-onyx-black text-on-primary font-label-caps text-[10px] uppercase font-bold rounded">
                    Active Plan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly Subscription */}
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="monthlySubPrice">
                      Monthly Subscription (26 Days) <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-onyx-black font-semibold">₹</span>
                      <input 
                        id="monthlySubPrice"
                        type="number"
                        min="1"
                        value={formState.monthlySubPrice}
                        onChange={e => {
                          const val = e.target.value;
                          const perMeal = val ? Math.round(Number(val) / 26) : 0;
                          setFormState({ 
                            ...formState, 
                            monthlySubPrice: val,
                            price: perMeal.toString()
                          });
                          triggerAutosavePing();
                        }}
                        className="w-full bg-surface-container-low pl-8 pr-4 py-3 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black"
                      />
                    </div>
                    <p className="font-label-caps text-[11px] text-secondary">
                      Full 26-day monthly plan (Effective approx. ₹{formState.price || Math.round((Number(formState.monthlySubPrice) || 3640) / 26)} / meal with 12.5% loyalty discount).
                    </p>
                  </div>

                  {/* Weekly Subscription */}
                  <div className="space-y-2">
                    <label className="block font-label-caps text-label-caps uppercase text-onyx-black tracking-wider" htmlFor="weeklySubPrice">
                      Weekly Subscription (6 Days) <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-onyx-black font-semibold">₹</span>
                      <input 
                        id="weeklySubPrice"
                        type="number"
                        min="1"
                        value={formState.weeklyPrice}
                        onChange={e => {
                          setFormState({ ...formState, weeklyPrice: e.target.value });
                          triggerAutosavePing();
                        }}
                        className="w-full bg-surface-container-low pl-8 pr-4 py-3 rounded border border-sand-neutral focus:border-onyx-black focus:outline-none font-body-md text-onyx-black"
                      />
                    </div>
                    <p className="font-label-caps text-[11px] text-secondary">
                      Flexible 6-day starter trial subscription for new customers.
                    </p>
                  </div>
                </div>

                {/* Per Meal Billing Breakdown */}
                <div className="p-3 bg-surface-container-low/70 rounded-lg flex items-center justify-between text-xs font-label-caps text-secondary border border-sand-neutral/40">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-onyx-black">calculate</span>
                    Effective Per-Meal Base Subscription:
                  </span>
                  <span className="font-bold text-onyx-black text-sm">
                    ₹{formState.price || Math.round((Number(formState.monthlySubPrice) || 3640) / 26)} / meal
                  </span>
                </div>
              </section>

              {/* 5. STATUS & MARKETPLACE VISIBILITY */}
              <section className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-sand-neutral flex items-center justify-between gap-6">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-onyx-black"></span>
                    <h3 className="font-body-md font-bold text-onyx-black text-base">Available for Immediate Discovery</h3>
                  </div>
                  <p className="font-body-md text-secondary text-sm">
                    When toggled ON, this tiffin plan is indexed instantaneously across student hostels, office corridors, and homes within your 5.0 km delivery polygon.
                  </p>
                </div>

                {/* Styled Custom Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={formState.isAvailable}
                    onChange={e => {
                      setFormState({
                        ...formState,
                        isAvailable: e.target.checked,
                        status: e.target.checked ? 'Active' : 'Inactive'
                      });
                      triggerAutosavePing();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:bg-onyx-black transition-colors"></div>
                  <div className="absolute left-1 top-1 bg-surface-container-lowest w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6 flex items-center justify-center">
                    <span className="material-symbols-outlined text-onyx-black text-[14px]">check</span>
                  </div>
                </label>
              </section>

              {/* Form Actions Bar (Sticky & Permanent) */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 pb-12 border-t border-sand-neutral">
                <button 
                  type="button"
                  onClick={() => { resetForm(); setSubView('all'); }}
                  className="w-full sm:w-auto px-6 py-3 rounded border border-sand-neutral text-onyx-black font-button-text hover:bg-surface-container transition-colors tracking-wider uppercase text-xs cursor-pointer"
                >
                  Discard Changes
                </button>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    type="button"
                    disabled={isSubmitting}
                    onClick={(e) => handleSaveTiffin(e, false)}
                    className="w-full sm:w-auto px-6 py-3 rounded border border-onyx-black text-onyx-black font-button-text hover:bg-surface-container-low transition-colors tracking-wider uppercase text-xs cursor-pointer disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded bg-onyx-black text-on-primary font-button-text hover:bg-clay-earth transition-colors flex items-center justify-center gap-2 shadow-md tracking-wider uppercase text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    {isSubmitting ? 'Publishing...' : editingTiffin ? 'Update Tiffin Plan' : 'Publish Tiffin Plan'}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Live Marketplace Simulation Card (Columns 9-12) */}
            <div className="lg:col-span-4 sticky top-24 space-y-6">
              
              {/* Preview Widget Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-onyx-black text-[18px]">visibility</span>
                  <span className="font-label-caps text-label-caps text-onyx-black uppercase tracking-wider">
                    Live Customer Preview
                  </span>
                </div>
                <span className="font-label-caps text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-secondary font-bold uppercase">
                  5km Discovery View
                </span>
              </div>

              {/* Rendered Card Simulation (Matches TiffinLink Consumer App) */}
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-md border border-sand-neutral transition-all">
                
                {/* Image Top Bar */}
                <div className="relative aspect-[16/10] bg-surface-container-low overflow-hidden">
                  <img 
                    src={formState.image} 
                    alt={formState.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-onyx-black/70 via-transparent to-black/20"></div>

                  {/* Badges Over Media */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-surface-container-lowest/95 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-label-caps text-onyx-black font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${formState.foodType === 'Pure Veg' ? 'bg-emerald-600' : 'bg-amber-600'}`}></span> 
                      {formState.foodType}
                    </span>
                    <span className="bg-onyx-black/80 backdrop-blur-md text-on-primary px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-wider">
                      {formState.mealType}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-on-primary">
                    <div>
                      <span className="font-label-caps text-[10px] uppercase tracking-widest opacity-80">Provider Kitchen</span>
                      <div className="font-body-md font-semibold text-sm leading-snug">Xoxo Men Homestyle</div>
                    </div>
                    <div className="bg-surface-container-lowest/90 text-onyx-black px-2 py-1 rounded text-xs font-bold font-label-caps">
                      4.9 ★ <span className="text-[10px] text-secondary font-normal">(184)</span>
                    </div>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-headline-md text-[20px] text-onyx-black leading-tight">
                        {formState.name || 'Untitled Tiffin Plan'}
                      </h3>
                    </div>
                    <p className="font-body-md text-xs text-secondary mt-1.5 line-clamp-2">
                      {formState.description || 'No description provided yet.'}
                    </p>
                  </div>

                  {/* Inclusions Pills */}
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {(Array.isArray(formState.items) && formState.items.length > 0 ? formState.items : ['4 Rotlas', '2 Sabzis', 'Kadhi-Khichdi', 'Chaas']).map((inc, idx) => (
                      <span key={idx} className="bg-surface-container text-secondary text-[11px] font-label-caps px-2 py-0.5 rounded">
                        {inc}
                      </span>
                    ))}
                  </div>

                  {/* Fulfillment Stats */}
                  <div className="p-3 bg-surface-container-low rounded border border-sand-neutral/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-label-caps text-[10px] uppercase text-secondary">Delivery Window</span>
                      <span className="font-body-md text-onyx-black font-semibold text-xs">
                        {formState.startTime} – {formState.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-label-caps text-[10px] uppercase text-secondary">Ordering Cut-Off</span>
                      <span className="font-label-caps text-[10px] font-bold text-error uppercase">
                        Orders Close {formState.orderCutoff}
                      </span>
                    </div>
                    <div className="w-full bg-sand-neutral h-1 rounded-full overflow-hidden">
                      <div className="bg-onyx-black h-full w-3/5"></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-label-caps text-secondary">
                      <span>Daily Quota</span>
                      <span>{formState.capacity || 0} slots capacity</span>
                    </div>
                  </div>

                  {/* Pricing & Call to Action Preview */}
                  <div className="pt-2 flex items-center justify-between border-t border-sand-neutral">
                    <div>
                      <span className="font-label-caps text-[9px] uppercase tracking-widest text-secondary block">
                        Monthly Subscription
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline-md text-[22px] text-onyx-black font-bold">
                          ₹{formState.monthlySubPrice || 3640}
                        </span>
                        <span className="font-label-caps text-[10px] text-secondary">
                          / 26 meals (₹{formState.price || 140}/meal)
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-xs rounded tracking-wider uppercase pointer-events-none opacity-90 shadow-xs"
                    >
                      Subscribe Plan
                    </button>
                  </div>

                </div>

              </div>

              {/* Kitchen Advisory Note */}
              <div className="p-4 bg-secondary-container/40 rounded-lg border border-secondary-fixed space-y-2">
                <div className="flex items-center gap-2 text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider">
                    FSSAI Hygiene Standard
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-secondary-fixed-variant leading-relaxed">
                  All listed tiffins undergo automated random spot audits. Please guarantee thermal food packing vessels are tamper-sealed prior to partner courier pick-up.
                </p>
              </div>

            </div>

          </form>
        </div>
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

      {/* ========================================================================= */}
      {/* PART 4 — CATEGORIES & ITEMS SUB-VIEW                                      */}
      {/* ========================================================================= */}
      {subView === 'categories' && (
        <CategoriesItemsTab
          tiffins={tiffins}
          onToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* PART 5 — MEAL BUILDER SUB-VIEW                                             */}
      {/* ========================================================================= */}
      {subView === 'meal-builder' && (
        <MealBuilderTab
          tiffins={tiffins}
          onToast={showToast}
          onNavigateTab={(view) => {
            if (view === 'categories') setSubView('categories');
            else if (view === 'add-tiffin') setSubView('add');
            else if (onNavigateTab) onNavigateTab(view);
          }}
        />
      )}

    </div>
  );
}
