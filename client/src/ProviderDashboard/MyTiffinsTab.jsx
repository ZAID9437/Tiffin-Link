import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../services/api';
import MealBuilderTab from './MealBuilderTab';

const DAYS_CONFIG = [
  { key: 'mon', short: 'Mon', full: 'Monday' },
  { key: 'tue', short: 'Tue', full: 'Tuesday' },
  { key: 'wed', short: 'Wed', full: 'Wednesday' },
  { key: 'thu', short: 'Thu', full: 'Thursday' },
  { key: 'fri', short: 'Fri', full: 'Friday' },
  { key: 'sat', short: 'Sat', full: 'Saturday' },
  { key: 'sun', short: 'Sun', full: 'Sunday' }
];

const PRESET_TIFFIN_IMAGES = [
  { label: 'Gujarati Special', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8QQzVgko9nNu4_SsDiyuUddEJNcWGXvNBPmE-pv0qiPSfZe8g189a3mcHpC2iDCC4rjrQrexEUvCdhHLQ66hFXqI5yCifyHUSiYBgZWdecVPFLt9fTRxPV8phlcfjxRCU6YAE6gm4hxXRjH9BHn91IwRvlbAdGNTixR2JgBWWpHqTtIEtHsxseZ-794WRvuWukAwg5PqaBNbW4S_KzYlPej-PJqC9AAwZvyUTvlkB7mxK6o2S2ORR' },
  { label: 'Satvik Jain Deluxe', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCaizVDeW28iwY5ui51hxuU909KA2mHXvuur_GapbKhrwfFwuwi9Sa2Ydl6rYWQze_dV52NE73mh4_QALx9DelXKik5dIrU71p8iTbY1PavV49_ZJa9DcYoV3PR7aMWAcjZvy7oa7s9HNvF9iNdIn4Ur0cHyVZeZEG4f0VUBABdiCC1AsMgXYVrgxtcr6AFahJzE-Fcl_O76esX1ZQmZzCjwiLtm22hWZDHF6dM67SZJIuHD2v8pT4' },
  { label: 'Kathiyawadi Feast', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdDK2iHV62rSWmk1EuvsuZZylT6Q4IWfvs9hikrbQHfiiOOmrdhZVuX5mWqaKMTC9BOZk4Y6rt4P8k9ouAmuc72CywaQosoCr8zfs2wUNG1_kYB_1WdOED9qFjpBdfCMbO1Ifsuo73bEvYjuhb5ReeibH6bLjrCpyikrwsntPyiJFpYenqx4n0xVhjP-DZo5BNJu3xaLOkpjiRCm1dYmwVaRdUeWj39tlkQGwqsFAaIfKw19v0OuPo' },
  { label: 'High-Protein Healthy', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM0aHvfoJpN6RMR62OTMvVHqc1FMMurz4SEaKeL1-daqiiJu_T6lr2QmoQ1xLyUdtBM3pi5ccHtNCPN2XIon_z7yRV5unEK2xc3DTUWp5CllHfmIe3-oVnNz2uftOPWKe6IP8Nwa6Q_IJVE5It9Odq1I__nejEhKq82u6um1quV2erafOJ07fMBJ4epgZKrdBXkkcVvSAw5jVeoRh1htemR5_IoTJTn0edJ721FzGgvWMZOhfNIrKe' },
  { label: 'Punjabi North-Indian', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwUcUoJ6r89gVPSfnHsNZQ8qlsAlTmq2iqCNe6MqERgBZmGW39wzerJvrTStWCEEOkak684jpl3pjEBzf3uogJwAEB7hqmYBHvBY5114CyEBjV6-piEoG31mlLGXlBX_d2K_cS3tdacpiR4S66b9NlYmZ7E1xKK6mKLTxx2P21p5MuUBJpgb2cpHg_a2ToVphk6OelK7cpIFpJ43HDOwJdsaX0jB3RUrP2NyrrRBUGiJoUNYZ1G9s8' }
];

const ITEM_CATEGORIES = [
  'Breads',
  'Vegetable Curries',
  'Dal & Kadhi',
  'Rice & Khichdi',
  'Farsan',
  'Accompaniments',
  'Sweets',
  'Other'
];

export default function MyTiffinsTab({
  currentUser,
  initialSubView = 'all',
  initialOpenModal = false,
  onNavigateTab
}) {
  const [subView, setSubView] = useState(
    initialOpenModal ? 'add' :
    ['all', 'categories', 'add', 'tiffin-items', 'availability', 'meal-builder'].includes(initialSubView) ? initialSubView : 'all'
  );

  // Core Data States
  const [tiffins, setTiffins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tiffinItems, setTiffinItems] = useState([]);
  const [allItemsMap, setAllItemsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Selected Tiffin for Items & Availability tabs
  const [selectedTiffinId, setSelectedTiffinId] = useState(null);

  // Filter & Search states for All Tiffins
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals & Forms
  const [editingTiffin, setEditingTiffin] = useState(null);
  const [deletingTiffin, setDeletingTiffin] = useState(null);

  // Category Management Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    status: 'Active',
    image: ''
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Add/Edit Tiffin Form State (STRICTLY simplified 4-part form per prompt)
  const [tiffinForm, setTiffinForm] = useState({
    name: '',
    category: '',
    tiffinCategoryId: '',
    description: '',
    image: PRESET_TIFFIN_IMAGES[0].url,
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    status: 'Active'
  });
  const [isSubmittingTiffin, setIsSubmittingTiffin] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Add/Edit Item Form State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Breads',
    description: '',
    price: '',
    availableQuantity: '100',
    image: '',
    status: 'Available'
  });
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize initial subView changes
  useEffect(() => {
    if (initialSubView && ['all', 'categories', 'add', 'tiffin-items', 'availability', 'meal-builder'].includes(initialSubView)) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  // Initial Fetch: Tiffins & Categories
  const fetchTiffins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/tiffins');
      if (res.success && Array.isArray(res.data)) {
        const formatted = res.data.map(t => ({
          ...t,
          id: t._id || t.id
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
  }, [selectedTiffinId]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiRequest('/categories');
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data.map(c => ({ ...c, id: c._id || c.id })));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchItemsForTiffin = useCallback(async (tiffinId) => {
    if (!tiffinId) return;
    try {
      setLoadingItems(true);
      const res = await apiRequest(`/tiffin-items?tiffinId=${tiffinId}`);
      if (res.success && Array.isArray(res.data)) {
        setTiffinItems(res.data.map(i => ({ ...i, id: i._id || i.id })));
      } else {
        setTiffinItems([]);
      }
    } catch (err) {
      console.error('Error fetching tiffin items:', err);
      setTiffinItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const fetchAllItems = useCallback(async () => {
    try {
      const res = await apiRequest('/tiffin-items');
      if (res.success && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(item => {
          const tid = String(item.tiffinId?._id || item.tiffinId || '');
          if (tid) {
            if (!map[tid]) map[tid] = [];
            map[tid].push(item);
          }
        });
        setAllItemsMap(map);
      }
    } catch (err) {
      console.error('Error fetching all tiffin items:', err);
    }
  }, []);

  useEffect(() => {
    fetchTiffins();
    fetchCategories();
    fetchAllItems();
  }, [fetchTiffins, fetchCategories, fetchAllItems]);

  useEffect(() => {
    if (selectedTiffinId) {
      fetchItemsForTiffin(selectedTiffinId);
    }
  }, [selectedTiffinId, fetchItemsForTiffin]);

  // Derived selected tiffin
  const currentSelectedTiffin = useMemo(() => {
    return tiffins.find(t => t.id === selectedTiffinId || t._id === selectedTiffinId) || tiffins[0] || null;
  }, [tiffins, selectedTiffinId]);

  // =========================================================================
  // CATEGORIES LOGIC
  // =========================================================================
  const handleSaveCategory = async (e) => {
    if (e) e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast('⚠️ Category name is required');
      return;
    }

    setIsSubmittingCat(true);
    try {
      if (editingCategory) {
        const id = editingCategory.id || editingCategory._id;
        const res = await apiRequest(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim(),
            status: categoryForm.status,
            image: categoryForm.image || '/assets/provider_1.png'
          })
        });
        if (res.success) {
          showToast(`✓ Category "${categoryForm.name}" updated!`);
          fetchCategories();
          resetCategoryForm();
        } else {
          showToast(`⚠️ ${res.message || 'Failed to update category'}`);
        }
      } else {
        const res = await apiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: categoryForm.name.trim(),
            description: categoryForm.description.trim() || 'Traditional home-cooked culinary category',
            status: categoryForm.status,
            image: categoryForm.image || '/assets/provider_1.png'
          })
        });
        if (res.success) {
          showToast(`✓ Category "${categoryForm.name}" created successfully!`);
          fetchCategories();
          resetCategoryForm();
        } else {
          showToast(`⚠️ ${res.message || 'Failed to create category'}`);
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      showToast('⚠️ Error saving category');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', status: 'Active', image: '' });
    setEditingCategory(null);
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
      status: cat.status || 'Active',
      image: cat.image || ''
    });
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This action cannot be undone.`)) return;
    try {
      const id = cat.id || cat._id;
      const res = await apiRequest(`/categories/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast(`✓ Category "${cat.name}" deleted`);
        fetchCategories();
        if (editingCategory && (editingCategory.id === id || editingCategory._id === id)) {
          resetCategoryForm();
        }
      } else {
        showToast(`⚠️ ${res.message || 'Failed to delete'}`);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // =========================================================================
  // ADD / EDIT TIFFIN LOGIC (STRICTLY 4 SECTIONS)
  // =========================================================================
  const resetTiffinForm = () => {
    setEditingTiffin(null);
    setTiffinForm({
      name: '',
      category: categories.length > 0 ? categories[0].name : 'Gujarati Tiffin',
      tiffinCategoryId: categories.length > 0 ? categories[0].id : '',
      description: '',
      image: PRESET_TIFFIN_IMAGES[0].url,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      status: 'Active'
    });
  };

  const startEditTiffin = (tiffin, e) => {
    if (e) e.stopPropagation();
    setEditingTiffin(tiffin);
    const existingDays = Array.isArray(tiffin.days) && tiffin.days.length > 0
      ? tiffin.days
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    setTiffinForm({
      name: tiffin.name || '',
      category: tiffin.category || (categories.length > 0 ? categories[0].name : ''),
      tiffinCategoryId: tiffin.tiffinCategoryId || '',
      description: tiffin.description || '',
      image: tiffin.image || PRESET_TIFFIN_IMAGES[0].url,
      availableDays: existingDays,
      status: tiffin.status || 'Active'
    });
    setSubView('add');
  };

  const handleSaveTiffin = async (e) => {
    if (e) e.preventDefault();
    if (!tiffinForm.name.trim()) {
      showToast('⚠️ Tiffin name is required');
      return;
    }
    if (!tiffinForm.category) {
      showToast('⚠️ Please select a Tiffin Category');
      return;
    }
    if (!tiffinForm.availableDays || tiffinForm.availableDays.length === 0) {
      showToast('⚠️ Please select at least one available day');
      return;
    }

    setIsSubmittingTiffin(true);
    try {
      const selectedCatObj = categories.find(c => c.name === tiffinForm.category || c.id === tiffinForm.tiffinCategoryId);
      const catId = selectedCatObj ? selectedCatObj.id : undefined;

      const payload = {
        name: tiffinForm.name.trim(),
        category: tiffinForm.category,
        tiffinCategoryId: catId,
        description: tiffinForm.description || '',
        image: tiffinForm.image || PRESET_TIFFIN_IMAGES[0].url,
        days: tiffinForm.availableDays,
        status: tiffinForm.status,
        // Sensible defaults preserving existing business models
        price: 140,
        capacity: 40,
        foodType: tiffinForm.category.toLowerCase().includes('jain') ? 'Jain Friendly' : 'Pure Veg'
      };

      if (editingTiffin) {
        const id = editingTiffin.id || editingTiffin._id;
        const res = await apiRequest(`/tiffins/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast(`✓ Tiffin "${payload.name}" updated successfully!`);
          await fetchTiffins();
          resetTiffinForm();
          setSubView('all');
        } else {
          showToast(`⚠️ ${res.message || 'Failed to update tiffin'}`);
        }
      } else {
        const res = await apiRequest('/tiffins', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success && res.data) {
          const newId = res.data._id || res.data.id;
          showToast(`✓ Tiffin "${payload.name}" created! Proceeding to Tiffin Items...`);
          await fetchTiffins();
          setSelectedTiffinId(newId);
          resetTiffinForm();
          // Transition directly to Tiffin Items per requirement
          setSubView('tiffin-items');
        } else {
          showToast(`⚠️ ${res.message || 'Failed to create tiffin'}`);
        }
      }
    } catch (err) {
      console.error('Error saving tiffin:', err);
      showToast('⚠️ Error saving tiffin');
    } finally {
      setIsSubmittingTiffin(false);
    }
  };

  const handleToggleDay = (dayFull) => {
    setTiffinForm(prev => {
      const exists = prev.availableDays.includes(dayFull);
      const next = exists ? prev.availableDays.filter(d => d !== dayFull) : [...prev.availableDays, dayFull];
      return { ...prev, availableDays: next };
    });
  };

  const setDayPreset = (preset) => {
    if (preset === 'all') {
      setTiffinForm(prev => ({ ...prev, availableDays: DAYS_CONFIG.map(d => d.full) }));
    } else if (preset === 'weekdays') {
      setTiffinForm(prev => ({ ...prev, availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }));
    } else if (preset === 'weekends') {
      setTiffinForm(prev => ({ ...prev, availableDays: ['Saturday', 'Sunday'] }));
    }
  };

  // Delete Tiffin
  const confirmDeleteTiffin = async () => {
    if (!deletingTiffin) return;
    const id = deletingTiffin.id || deletingTiffin._id;
    try {
      const res = await apiRequest(`/tiffins/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast(`✓ Tiffin "${deletingTiffin.name}" deleted.`);
        fetchTiffins();
        if (selectedTiffinId === id) setSelectedTiffinId(null);
      }
    } catch (err) {
      console.error('Error deleting tiffin:', err);
    } finally {
      setDeletingTiffin(null);
    }
  };

  // =========================================================================
  // TIFFIN ITEMS MANAGEMENT LOGIC
  // =========================================================================
  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      category: 'Breads',
      description: '',
      price: '',
      availableQuantity: '100',
      image: '',
      status: 'Available'
    });
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      category: item.category || 'Breads',
      description: item.description || '',
      price: item.price !== undefined ? item.price.toString() : (item.unitPrice || '').toString(),
      availableQuantity: item.availableQuantity !== undefined ? item.availableQuantity.toString() : (item.defaultQuantity || 50).toString(),
      image: item.image || '',
      status: item.isAvailable ? 'Available' : 'Unavailable'
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    if (e) e.preventDefault();
    if (!selectedTiffinId) {
      showToast('⚠️ Please select a Tiffin first');
      return;
    }
    if (!itemForm.name.trim()) {
      showToast('⚠️ Item name is required');
      return;
    }
    const priceNum = Number(itemForm.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('⚠️ Please enter a valid price (₹)');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const payload = {
        tiffinId: selectedTiffinId,
        name: itemForm.name.trim(),
        category: itemForm.category,
        description: itemForm.description.trim(),
        price: priceNum,
        unitPrice: priceNum,
        availableQuantity: Number(itemForm.availableQuantity) || 50,
        defaultQuantity: 1,
        image: itemForm.image || '',
        isAvailable: itemForm.status === 'Available'
      };

      if (editingItem) {
        const id = editingItem.id || editingItem._id;
        const res = await apiRequest(`/tiffin-items/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast(`✓ Item "${payload.name}" updated!`);
          fetchItemsForTiffin(selectedTiffinId);
          fetchAllItems();
          fetchTiffins();
          setShowItemModal(false);
        } else {
          showToast(`⚠️ ${res.message || 'Failed to update item'}`);
        }
      } else {
        const res = await apiRequest('/tiffin-items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast(`✓ Item "${payload.name}" added to tiffin!`);
          fetchItemsForTiffin(selectedTiffinId);
          fetchAllItems();
          fetchTiffins();
          setShowItemModal(false);
        } else {
          showToast(`⚠️ ${res.message || 'Failed to add item'}`);
        }
      }
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('⚠️ Error saving item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    const id = deletingItem.id || deletingItem._id;
    try {
      const res = await apiRequest(`/tiffin-items/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast(`✓ Item "${deletingItem.name}" deleted.`);
        fetchItemsForTiffin(selectedTiffinId);
        fetchAllItems();
        fetchTiffins();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setDeletingItem(null);
    }
  };

  // =========================================================================
  // AVAILABILITY LOGIC
  // =========================================================================
  const handleSaveAvailability = async (tiffinId, isAvailable, days) => {
    try {
      const res = await apiRequest(`/tiffins/${tiffinId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: isAvailable ? 'Active' : 'Inactive',
          days
        })
      });
      if (res.success) {
        showToast('✓ Availability schedule updated in database!');
        fetchTiffins();
      } else {
        showToast('⚠️ Failed to update availability');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  // Filtered Tiffins for All Tiffins view
  const filteredTiffins = useMemo(() => {
    return tiffins.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q || (t.name && t.name.toLowerCase().includes(q)) || (t.description && t.description.toLowerCase().includes(q));
      const matchCat = filterCategory === 'all' || (t.category && t.category.toLowerCase() === filterCategory.toLowerCase());
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? t.status === 'Active' : t.status !== 'Active');
      return matchQ && matchCat && matchStatus;
    });
  }, [tiffins, searchQuery, filterCategory, filterStatus]);

  return (
    <div className="flex flex-col w-full space-y-6 antialiased">

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-onyx-black text-on-primary font-button-text text-button-text px-5 py-3 rounded-lg shadow-xl border border-sand-neutral/30 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Tiffin Confirmation Modal */}
      {deletingTiffin && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-[26px]">warning</span>
              <h3 className="font-headline-md text-xl text-primary">Delete Tiffin</h3>
            </div>
            <p className="font-body-md text-sm text-secondary">
              Are you sure you want to delete <strong className="text-primary">"{deletingTiffin.name}"</strong>? All associated configuration will be removed from your kitchen catalog.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTiffin(null)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-button-text text-button-text rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTiffin}
                className="px-4 py-2 bg-error hover:bg-red-700 text-on-primary font-button-text text-button-text rounded transition-colors"
              >
                Delete Tiffin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-sand-neutral rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-[26px]">warning</span>
              <h3 className="font-headline-md text-xl text-primary">Delete Tiffin Item</h3>
            </div>
            <p className="font-body-md text-sm text-secondary">
              Remove <strong className="text-primary">"{deletingItem.name}"</strong> from this tiffin?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-button-text text-button-text rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-4 py-2 bg-error hover:bg-red-700 text-on-primary font-button-text text-button-text rounded transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Header Navigation Switcher (5 Primary Views + Meal Builder) */}
      <div className="bg-surface-container-lowest p-3 rounded-xl border border-sand-neutral/50 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubView('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button-text text-button-text transition-all cursor-pointer ${
              subView === 'all'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lunch_dining</span>
            <span>All Tiffins ({tiffins.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button-text text-button-text transition-all cursor-pointer ${
              subView === 'categories'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">category</span>
            <span>Tiffin Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { resetTiffinForm(); setSubView('add'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button-text text-button-text transition-all cursor-pointer ${
              subView === 'add'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Add Tiffin</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('tiffin-items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button-text text-button-text transition-all cursor-pointer ${
              subView === 'tiffin-items'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            <span>Tiffin Items</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('availability')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-button-text text-button-text transition-all cursor-pointer ${
              subView === 'availability'
                ? 'bg-onyx-black text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">toggle_on</span>
            <span>Availability</span>
          </button>
        </div>

        <div className="font-label-caps text-label-caps text-secondary px-3 py-1 bg-surface-container rounded">
          Scope: <strong className="text-primary font-semibold">{currentUser?.businessName || currentUser?.name || "Your Kitchen"}</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ALL TIFFINS SUB-VIEW                                                   */}
      {/* ========================================================================= */}
      {subView === 'all' && (
        <div className="space-y-6">
          {/* Top Editorial Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="max-w-2xl">
              <div className="flex items-baseline gap-4">
                <h1 className="font-headline-lg text-headline-lg font-serif text-primary tracking-tight">My Tiffins</h1>
                <span className="font-label-caps text-label-caps text-secondary px-2.5 py-1 bg-surface-container rounded">
                  {tiffins.length} Active Plans
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">
                Manage all your tiffin offerings, menu types, operational availability, and item configurations.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={fetchTiffins}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-button-text text-button-text rounded transition-all shadow-sm border border-sand-neutral/40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Refresh Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => { resetTiffinForm(); setSubView('add'); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text rounded transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Add Tiffin</span>
              </button>
            </div>
          </div>

          {/* Operational Filter Strip */}
          <div className="p-4 bg-surface-container-lowest rounded-lg border border-sand-neutral/40 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shadow-sm">
            <div className="flex-1 max-w-lg relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Tiffin offerings by name or ingredients..."
                className="w-full bg-surface-container-low pl-11 pr-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-secondary rounded outline-none transition-all focus:bg-surface-container border border-sand-neutral/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded border border-sand-neutral/40">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Category:</span>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-transparent font-button-text text-button-text text-on-surface outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded border border-sand-neutral/40">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Status:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-transparent font-button-text text-button-text text-on-surface outline-none cursor-pointer"
                >
                  <option value="all">All States</option>
                  <option value="active">Active / Available</option>
                  <option value="paused">Paused / Inactive</option>
                </select>
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="font-label-caps text-label-caps text-secondary underline hover:text-primary cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* Main Offering Architectural Grid */}
          {loading ? (
            <div className="py-20 text-center text-secondary font-body-md">
              <span className="material-symbols-outlined text-[32px] animate-spin block mb-2">progress_activity</span>
              Loading your tiffin catalog...
            </div>
          ) : filteredTiffins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest rounded-lg border border-sand-neutral/40 p-8">
              <span className="material-symbols-outlined text-[48px] text-secondary mb-3">search_off</span>
              <h3 className="font-headline-md text-headline-md font-serif text-primary">No Matching Offerings</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1 mb-6">
                No active tiffins matched your criteria. You can create a new tiffin or reset filters.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterStatus('all'); }}
                  className="px-4 py-2 bg-surface-container text-on-surface font-button-text text-button-text rounded cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  onClick={() => { resetTiffinForm(); setSubView('add'); }}
                  className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-button-text rounded cursor-pointer"
                >
                  + Add Tiffin
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTiffins.map(tiffin => {
                const isActive = tiffin.status === 'Active';
                const configuredDays = Array.isArray(tiffin.days) && tiffin.days.length > 0 ? tiffin.days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const daysLabel = configuredDays.length === 7 ? 'All Days (Mon – Sun)' : `${configuredDays[0]?.slice(0, 3)} – ${configuredDays[configuredDays.length - 1]?.slice(0, 3)} (${configuredDays.length} Days)`;
                
                const tiffinIdStr = String(tiffin.id || tiffin._id || '');
                const configuredFromMap = allItemsMap[tiffinIdStr] || [];
                const dbItems = Array.isArray(tiffin.items) && tiffin.items.length > 0 ? tiffin.items : [];
                const effectiveItems = configuredFromMap.length > 0
                  ? configuredFromMap.map(i => i.name || i)
                  : dbItems;
                const itemsCount = effectiveItems.length > 0
                  ? effectiveItems.length
                  : (typeof tiffin.itemsCount === 'number' ? tiffin.itemsCount : 0);

                return (
                  <article
                    key={tiffin.id}
                    className="flex flex-col bg-surface-container-lowest rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-sand-neutral/40"
                  >
                    <div className="relative w-full h-64 overflow-hidden bg-surface-container">
                      <img
                        src={tiffin.image || PRESET_TIFFIN_IMAGES[0].url}
                        alt={tiffin.name}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      {/* Status Overlays */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-surface-container-lowest/90 backdrop-blur-md font-label-caps text-label-caps text-primary tracking-widest uppercase rounded shadow-sm">
                          {tiffin.foodType || 'Pure Veg'}
                        </span>
                        <span className={`px-2.5 py-1 ${isActive ? 'bg-onyx-black text-on-primary' : 'bg-surface-container-highest text-secondary'} font-label-caps text-label-caps tracking-widest uppercase rounded shadow-sm`}>
                          {isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-onyx-black/75 backdrop-blur-sm text-bone-white font-label-caps text-[10px] tracking-widest rounded">
                        TF-{String(tiffin.id).slice(-4).toUpperCase()}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-1.5">
                          <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                            {tiffin.category || 'Menu Offering'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-600 animate-pulse' : 'bg-error'}`}></span>
                            <span className="font-label-caps text-label-caps text-on-surface font-semibold">
                              {isActive ? "Online for Today's Service" : 'Kitchen Paused'}
                            </span>
                          </div>
                        </div>

                        <h2 className="font-headline-md text-headline-md font-serif text-primary tracking-tight">
                          {tiffin.name}
                        </h2>

                        <p className="font-body-md text-body-md text-on-surface-variant mt-2 line-clamp-2">
                          {tiffin.description || 'Homestyle traditional culinary meal prepared daily with authentic ingredients.'}
                        </p>
                      </div>

                      {/* Architectural Metadata Bar */}
                      <div className="grid grid-cols-2 gap-3 p-4 bg-surface-container-low rounded border border-sand-neutral/30">
                        <div className="flex flex-col">
                          <span className="font-label-caps text-label-caps text-secondary uppercase">Modular Composition</span>
                          <span className="font-button-text text-button-text text-primary mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-clay-earth">dashboard_customize</span>
                            <span>{itemsCount} Items Configured</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-caps text-label-caps text-secondary uppercase">Weekly Service</span>
                          <span className="font-button-text text-button-text text-primary mt-0.5 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-clay-earth">date_range</span>
                            <span>{daysLabel}</span>
                          </span>
                        </div>
                      </div>

                      {/* Modular Item Chips Preview */}
                      <div className="flex flex-wrap gap-1.5">
                        {(effectiveItems.length > 0 ? effectiveItems.slice(0, 4) : ['Phulka (4)', 'Daily Shaak', 'Dal', 'Rice']).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-surface-container text-on-surface font-label-caps text-[11px] rounded">
                            {typeof item === 'string' ? item : item.name}
                          </span>
                        ))}
                        {itemsCount > 4 && (
                          <span className="px-2 py-1 bg-surface-container-highest text-secondary font-label-caps text-[11px] rounded">
                            +{itemsCount - 4} more
                          </span>
                        )}
                      </div>

                      {/* Discrete Action Group */}
                      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-sand-neutral/30">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTiffinId(tiffin.id);
                            setSubView('tiffin-items');
                          }}
                          className="flex-1 min-w-[130px] px-3 py-2 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text rounded transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                          <span>Manage Items ({itemsCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => startEditTiffin(tiffin, e)}
                          className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-button-text text-button-text rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Edit Tiffin</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTiffinId(tiffin.id);
                            setSubView('availability');
                          }}
                          className="px-3 py-2 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-button-text text-button-text rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">calendar_clock</span>
                          <span>Schedule</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingTiffin(tiffin)}
                          title="Delete Tiffin"
                          className="p-2 text-secondary hover:text-error hover:bg-surface-container rounded transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Production Insights Banner */}
          <section className="mt-8 bg-surface-container-low p-6 rounded-lg border border-sand-neutral/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm shrink-0 border border-sand-neutral/30">
                <span className="material-symbols-outlined text-[24px]">kitchen</span>
              </div>
              <div className="flex flex-col">
                <span className="font-button-text text-button-text text-primary">Active Subscription Window</span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Lunch dispatch cut-off is 10:30 AM IST. All availability toggles update storefront catalog in real-time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Active Plans:</span>
              <span className="px-3 py-1 bg-surface-container-highest text-primary font-mono text-button-text font-semibold rounded">
                {tiffins.filter(t => t.status === 'Active').length} Live
              </span>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TIFFIN CATEGORIES SUB-VIEW (Full HTML Mockup Fidelity)                 */}
      {/* ========================================================================= */}
      {subView === 'categories' && (
        <div className="space-y-8">
          {/* Breadcrumb & Header Zone */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral/60">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Food & Menu</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Tiffin Categories</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">
                Tiffin Categories & Menu Types
              </h1>
              <p className="font-body-md text-body-md text-secondary max-w-2xl">
                Create and organize custom culinary categories to classify your tiffins across menus, diet restrictions, and client culinary discovery.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  resetCategoryForm();
                  document.getElementById('cat-name-input')?.focus();
                }}
                className="px-5 py-2.5 bg-onyx-black hover:bg-neutral-800 text-on-primary font-button-text text-button-text rounded flex items-center gap-2 transition-transform active:scale-95 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Add Tiffin Category</span>
              </button>
            </div>
          </div>

          {/* Editorial Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-low p-5 rounded-lg border border-sand-neutral/30 flex flex-col justify-between gap-3">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Active Categories</span>
              <div className="flex items-baseline justify-between">
                <span className="font-headline-md text-headline-md text-primary font-serif">
                  {String(categories.filter(c => c.status === 'Active').length).padStart(2, '0')}
                </span>
                <span className="font-label-caps text-label-caps text-secondary bg-surface-container-highest px-2 py-0.5 rounded">Operational</span>
              </div>
              <div className="w-full bg-sand-neutral h-1 rounded-full overflow-hidden">
                <div className="bg-onyx-black h-full w-4/5"></div>
              </div>
            </div>

            <div className="bg-surface-container-low p-5 rounded-lg border border-sand-neutral/30 flex flex-col justify-between gap-3">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Draft / Inactive</span>
              <div className="flex items-baseline justify-between">
                <span className="font-headline-md text-headline-md text-primary font-serif">
                  {String(categories.filter(c => c.status !== 'Active').length).padStart(2, '0')}
                </span>
                <span className="font-label-caps text-label-caps text-secondary bg-surface-container px-2 py-0.5 rounded">Pending Menu</span>
              </div>
              <div className="w-full bg-sand-neutral h-1 rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-1/5"></div>
              </div>
            </div>

            <div className="bg-surface-container-low p-5 rounded-lg border border-sand-neutral/30 flex flex-col justify-between gap-3">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Linked Tiffin Plans</span>
              <div className="flex items-baseline justify-between">
                <span className="font-headline-md text-headline-md text-primary font-serif">
                  {String(tiffins.length).padStart(2, '0')}
                </span>
                <span className="font-label-caps text-label-caps text-primary bg-secondary-container px-2 py-0.5 rounded">Live Menus</span>
              </div>
              <div className="w-full bg-sand-neutral h-1 rounded-full overflow-hidden">
                <div className="bg-onyx-black h-full w-full"></div>
              </div>
            </div>

            <div className="bg-surface-container-low p-5 rounded-lg border border-sand-neutral/30 flex flex-col justify-between gap-3">
              <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Kitchen Capacity</span>
              <div className="flex items-baseline justify-between">
                <span className="font-headline-md text-headline-md text-primary font-serif">94%</span>
                <span className="font-label-caps text-label-caps text-on-surface bg-surface-container-highest px-2 py-0.5 rounded">Optimal</span>
              </div>
              <div className="w-full bg-sand-neutral h-1 rounded-full overflow-hidden">
                <div className="bg-onyx-black h-full w-[94%]"></div>
              </div>
            </div>
          </div>

          {/* Main Workspace Split: Master List (7 cols) vs Form Drawer (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Master List of Categories */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">Classified Registry</span>
                  <span className="text-xs bg-surface-container text-on-surface px-2 py-0.5 rounded font-mono font-medium">
                    {categories.length} TOTAL
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {categories.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-lowest rounded-lg border border-sand-neutral/40 text-secondary">
                    No custom categories yet. Use the form on the right to create your first tiffin category.
                  </div>
                ) : (
                  categories.map(cat => {
                    const linkedCount = tiffins.filter(t => t.category === cat.name || t.tiffinCategoryId === cat.id).length;
                    const isActive = cat.status === 'Active';

                    return (
                      <article
                        key={cat.id}
                        className="group bg-surface-container-lowest hover:bg-surface-container-low/60 rounded-lg p-6 transition-colors duration-200 border-l-4 border-onyx-black border border-sand-neutral/40 flex flex-col md:flex-row gap-6 items-start"
                      >
                        <div className="w-full md:w-36 h-28 shrink-0 overflow-hidden rounded bg-surface-container relative">
                          <img
                            src={cat.image || '/assets/provider_1.png'}
                            alt={cat.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-onyx-black/80 backdrop-blur-sm text-on-primary font-label-caps text-[10px] rounded">
                            CUSTOM
                          </span>
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 justify-between gap-3 h-full">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-headline-md text-[22px] leading-tight text-primary font-serif">
                                {cat.name}
                              </h3>
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface">
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-onyx-black' : 'bg-secondary'}`}></span>
                                <span className="font-label-caps text-[11px] uppercase tracking-wider">
                                  {isActive ? 'Active' : 'Draft'}
                                </span>
                              </div>
                            </div>
                            <p className="font-body-md text-secondary text-sm leading-relaxed line-clamp-2">
                              {cat.description || 'Traditional home-cooked culinary category.'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sand-neutral/60">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-secondary">lunch_dining</span>
                              <span className="font-label-caps text-label-caps text-primary font-medium tracking-wide">
                                {linkedCount} Tiffins linked
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditCategory(cat)}
                                className="px-2.5 py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <span className="text-sand-neutral text-xs">/</span>
                              <button
                                type="button"
                                onClick={() => {
                                  // Switch to Tiffin Items
                                  const linked = tiffins.find(t => t.category === cat.name || t.tiffinCategoryId === cat.id);
                                  if (linked) setSelectedTiffinId(linked.id);
                                  setSubView('tiffin-items');
                                }}
                                className="px-2.5 py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                              >
                                Manage Dishes
                              </button>
                              <span className="text-sand-neutral text-xs">/</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="px-2.5 py-1 text-secondary hover:text-error hover:bg-surface-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Embedded Drawer / Add Category Form (5 cols) */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-surface-container-lowest rounded-lg p-6 sm:p-8 border border-sand-neutral/80 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between pb-4 border-b border-sand-neutral">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                      {editingCategory ? 'Update Mode' : 'Architectural Form'}
                    </span>
                    <h2 className="font-headline-md text-[24px] text-primary font-serif">
                      {editingCategory ? `Edit Category` : 'Add Tiffin Category'}
                    </h2>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[22px]">post_add</span>
                </div>

                <form onSubmit={handleSaveCategory} className="flex flex-col gap-6">
                  {/* Category Name */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-label-caps text-label-caps uppercase tracking-wider text-primary" htmlFor="cat-name-input">
                        Category Name <span className="text-error">*</span>
                      </label>
                      <span className="text-xs text-secondary font-mono">REGIONAL / DIET</span>
                    </div>
                    <input
                      id="cat-name-input"
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g. Gujarati Tiffin, Jain Tiffin, Kathiyawadi Tiffin"
                      className="w-full bg-surface-container-low px-4 py-3 rounded text-on-surface font-body-md text-body-md placeholder:text-secondary/60 focus:bg-surface-container-lowest focus:ring-1 focus:ring-onyx-black outline-none border border-sand-neutral/60 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-label-caps uppercase tracking-wider text-primary" htmlFor="cat-desc-input">
                      Description
                    </label>
                    <textarea
                      id="cat-desc-input"
                      rows={3}
                      value={categoryForm.description}
                      onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Describe this culinary category and meal philosophy..."
                      className="w-full bg-surface-container-low p-4 rounded text-on-surface font-body-md text-body-md placeholder:text-secondary/60 focus:bg-surface-container-lowest focus:ring-1 focus:ring-onyx-black outline-none border border-sand-neutral/60 resize-none transition-all"
                    />
                  </div>

                  {/* Status Selector Segment */}
                  <div className="flex flex-col gap-2.5">
                    <label className="font-label-caps text-label-caps uppercase tracking-wider text-primary">
                      Operational Status
                    </label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-surface-container-low rounded border border-sand-neutral/40">
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, status: 'Active' })}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded transition-all font-button-text text-button-text cursor-pointer ${
                          categoryForm.status === 'Active'
                            ? 'bg-onyx-black text-on-primary'
                            : 'text-secondary hover:text-on-surface'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-surface"></span>
                        <span>Active</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, status: 'Inactive' })}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded transition-all font-button-text text-button-text cursor-pointer ${
                          categoryForm.status !== 'Active'
                            ? 'bg-onyx-black text-on-primary'
                            : 'text-secondary hover:text-on-surface'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span>Inactive</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Helper Notice */}
                  <div className="p-3.5 bg-surface-container-low rounded border-l-4 border-secondary flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">info</span>
                    <p className="font-body-md text-xs text-secondary leading-relaxed">
                      Categories created here dynamically populate into the <strong className="text-on-surface font-medium">Add Tiffin</strong> selection dropdown.
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-neutral">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={resetCategoryForm}
                        className="px-4 py-2.5 bg-transparent hover:bg-surface-container font-button-text text-button-text text-secondary hover:text-on-surface rounded transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmittingCat || !categoryForm.name.trim()}
                      className="px-6 py-2.5 bg-onyx-black hover:bg-neutral-800 disabled:opacity-50 text-on-primary font-button-text text-button-text rounded transition-all active:scale-95 shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADD TIFFIN SUB-VIEW (Strictly simplified 4-part form per prompt)      */}
      {/* ========================================================================= */}
      {subView === 'add' && (
        <div className="max-w-[880px] mx-auto w-full space-y-8">
          {/* Header Zone */}
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-2 font-label-caps text-label-caps text-secondary uppercase tracking-widest">
              <span>Food & Menu</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">{editingTiffin ? 'Edit Tiffin' : 'Add New Tiffin'}</span>
            </nav>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-serif">
              {editingTiffin ? 'Edit Tiffin Offering' : 'Add New Tiffin'}
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Create a fundamental tiffin entity and define its operational weekly cadence. Food items and pricing are configured separately in the Tiffin Items console.
            </p>
          </div>

          {/* Main Architectural Form Card */}
          <form onSubmit={handleSaveTiffin} className="flex flex-col gap-10 bg-surface-container-lowest p-8 md:p-10 rounded-lg shadow-sm border border-sand-neutral/50">

            {/* Section 1: Basic Information */}
            <section className="flex flex-col gap-6">
              <div className="flex items-baseline justify-between pb-3 border-b border-sand-neutral/40">
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">01</span>
                  <h2 className="font-headline-md text-headline-md text-primary font-serif">Basic Information</h2>
                </div>
                <span className="font-label-caps text-label-caps text-secondary uppercase">* Mandatory Fields</span>
              </div>

              {/* Tiffin Name */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary uppercase tracking-wider" htmlFor="tiffinNameInput">
                  Tiffin Name <span className="text-error">*</span>
                </label>
                <input
                  id="tiffinNameInput"
                  type="text"
                  required
                  value={tiffinForm.name}
                  onChange={e => setTiffinForm({ ...tiffinForm, name: e.target.value })}
                  placeholder="Enter tiffin name (e.g. Gujarati Tiffin, Jain Tiffin, Kathiyawadi Tiffin)"
                  className="w-full bg-surface-container-low px-4 py-3.5 text-on-surface font-body-md text-body-md rounded focus:outline-none focus:bg-surface-container transition-colors border border-sand-neutral/40"
                />
              </div>

              {/* Menu Type / Category Dropdown */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary uppercase tracking-wider" htmlFor="tiffinCategorySelect">
                  Menu Type / Category <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <select
                    id="tiffinCategorySelect"
                    required
                    value={tiffinForm.category}
                    onChange={e => {
                      const selected = categories.find(c => c.name === e.target.value);
                      setTiffinForm({
                        ...tiffinForm,
                        category: e.target.value,
                        tiffinCategoryId: selected ? selected.id : ''
                      });
                    }}
                    className="w-full appearance-none bg-surface-container-low px-4 py-3.5 text-on-surface font-body-md text-body-md rounded focus:outline-none focus:bg-surface-container transition-colors cursor-pointer border border-sand-neutral/40"
                  >
                    <option value="" disabled>Select Tiffin Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[20px]">
                    expand_more
                  </span>
                </div>
                <p className="font-label-caps text-label-caps text-secondary italic">
                  Categories are fetched dynamically from your Tiffin Categories module.
                </p>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-secondary uppercase tracking-wider" htmlFor="tiffinDescInput">
                  Description
                </label>
                <textarea
                  id="tiffinDescInput"
                  rows={4}
                  value={tiffinForm.description}
                  onChange={e => setTiffinForm({ ...tiffinForm, description: e.target.value })}
                  placeholder="Describe this tiffin, cooking philosophy, and authenticity notes..."
                  className="w-full bg-surface-container-low p-4 text-on-surface font-body-md text-body-md rounded focus:outline-none focus:bg-surface-container transition-colors resize-none border border-sand-neutral/40"
                />
              </div>
            </section>

            {/* Section 2: Tiffin Image */}
            <section className="flex flex-col gap-5 pt-4">
              <div className="flex items-center gap-2 pb-2 border-b border-sand-neutral/40">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">02</span>
                <h2 className="font-headline-md text-headline-md text-primary font-serif">Tiffin Image</h2>
              </div>

              <div
                onClick={() => setShowImagePicker(!showImagePicker)}
                className="relative group cursor-pointer bg-surface-container-low rounded-lg p-6 flex flex-col items-center justify-center text-center overflow-hidden transition-all hover:bg-surface-container border-2 border-dashed border-sand-neutral hover:border-onyx-black"
              >
                <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-xl">
                  {/* Image Preview */}
                  <div className="relative w-44 h-28 shrink-0 rounded overflow-hidden bg-surface-container-high flex items-center justify-center">
                    <img
                      src={tiffinForm.image || PRESET_TIFFIN_IMAGES[0].url}
                      alt="Tiffin Preview"
                      className="w-full h-full object-cover filter contrast-[0.95]"
                    />
                    <div className="absolute inset-0 bg-onyx-black/15 flex items-center justify-center backdrop-blur-[1px]">
                      <span className="material-symbols-outlined text-surface-container-lowest text-[22px]">photo_camera</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col items-center md:items-start gap-1 text-left">
                    <span className="flex items-center gap-2 font-button-text text-button-text text-primary">
                      <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                      <span>Upload Tiffin Image</span>
                    </span>
                    <p className="font-body-md text-body-md text-secondary">
                      Click to choose culinary presentation frame
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-label-caps text-label-caps px-2 py-0.5 bg-surface-container-highest text-secondary rounded">
                        16:9 RATIO
                      </span>
                      <span className="font-label-caps text-label-caps px-2 py-0.5 bg-surface-container-highest text-secondary rounded">
                        JPG / PNG
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preset Image Picker Drawer */}
              {showImagePicker && (
                <div className="p-4 bg-surface-container-low rounded-lg border border-sand-neutral/50 space-y-3">
                  <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">
                    Select Curated Studio Photograph:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {PRESET_TIFFIN_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTiffinForm({ ...tiffinForm, image: img.url });
                          setShowImagePicker(false);
                        }}
                        className={`group rounded-lg overflow-hidden border-2 text-left cursor-pointer transition-all ${
                          tiffinForm.image === img.url ? 'border-onyx-black shadow-md' : 'border-sand-neutral/50 hover:border-secondary'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-20 object-cover" />
                        <div className="p-2 bg-surface-container-lowest font-label-caps text-[11px] truncate text-primary">
                          {img.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Section 3: Available Days */}
            <section className="flex flex-col gap-5 pt-4">
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 pb-2 border-b border-sand-neutral/40">
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">03</span>
                  <h2 className="font-headline-md text-headline-md text-primary font-serif">Available Days</h2>
                  <span className="text-error font-body-md">*</span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDayPreset('all')}
                    className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-low hover:bg-surface-container-highest text-secondary hover:text-primary rounded transition-colors cursor-pointer border border-sand-neutral/30"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayPreset('weekdays')}
                    className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-low hover:bg-surface-container-highest text-secondary hover:text-primary rounded transition-colors cursor-pointer border border-sand-neutral/30"
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayPreset('weekends')}
                    className="font-label-caps text-label-caps px-3 py-1 bg-surface-container-low hover:bg-surface-container-highest text-secondary hover:text-primary rounded transition-colors cursor-pointer border border-sand-neutral/30"
                  >
                    Weekends
                  </button>
                </div>
              </div>

              {/* Checkbox Pill Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {DAYS_CONFIG.map(day => {
                  const isChecked = tiffinForm.availableDays.includes(day.full);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => handleToggleDay(day.full)}
                      className={`flex items-center justify-center gap-1.5 py-3.5 px-2 rounded font-button-text text-button-text transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-onyx-black text-on-primary shadow-sm font-semibold'
                          : 'bg-surface-container-low text-secondary hover:bg-surface-container border border-sand-neutral/40'
                      }`}
                    >
                      {isChecked && <span className="material-symbols-outlined text-[16px]">check</span>}
                      <span>{day.short}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Section 4: Operational Status */}
            <section className="flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-2 pb-1 border-b border-sand-neutral/40">
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">04</span>
                <h2 className="font-headline-md text-headline-md text-primary font-serif">Operational Status</h2>
              </div>

              <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-lg border border-sand-neutral/40">
                <div className="flex flex-col gap-0.5">
                  <span className="font-body-md text-body-md text-primary font-medium">
                    Available for Customer Orders
                  </span>
                  <span className="font-label-caps text-label-caps text-secondary">
                    When toggled off, this tiffin is temporarily paused on the consumer storefront
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tiffinForm.status === 'Active'}
                    onChange={e => setTiffinForm({ ...tiffinForm, status: e.target.checked ? 'Active' : 'Inactive' })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:bg-onyx-black transition-colors"></div>
                  <div className="absolute left-1 top-1 bg-surface-container-lowest w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6 flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-onyx-black text-[14px]">check</span>
                  </div>
                  <span className="ml-3 font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider w-8">
                    {tiffinForm.status === 'Active' ? 'ON' : 'OFF'}
                  </span>
                </label>
              </div>
            </section>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t border-sand-neutral">
              <button
                type="button"
                onClick={() => { resetTiffinForm(); setSubView('all'); }}
                className="w-full sm:w-auto px-6 py-3 font-button-text text-button-text text-secondary hover:text-primary transition-colors text-center cursor-pointer"
              >
                Cancel / Discard
              </button>

              <button
                type="submit"
                disabled={isSubmittingTiffin}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-onyx-black hover:bg-neutral-800 disabled:opacity-50 text-on-primary font-button-text text-button-text rounded transition-all shadow-sm cursor-pointer"
              >
                <span>{editingTiffin ? 'Update Tiffin Offering' : 'Create Tiffin & Proceed to Items'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TIFFIN ITEMS SUB-VIEW (Dedicated Items Console)                         */}
      {/* ========================================================================= */}
      {subView === 'tiffin-items' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-sand-neutral/40">
            <div>
              <div className="flex items-center gap-2 font-label-caps text-label-caps text-secondary uppercase tracking-widest">
                <span>Food & Menu</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Tiffin Items</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg font-serif text-primary tracking-tight mt-1">
                Tiffin Items
              </h1>
              <p className="font-body-md text-body-md text-secondary">
                Add and manage individual dishes and portions configured inside each tiffin offering.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!selectedTiffinId}
                onClick={openAddItemModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-onyx-black hover:bg-neutral-800 disabled:opacity-50 text-on-primary font-button-text text-button-text rounded transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>+ Add Item</span>
              </button>
            </div>
          </div>

          {/* Tiffin Selector Strip */}
          <div className="p-5 bg-surface-container-lowest rounded-lg border border-sand-neutral/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest shrink-0" htmlFor="targetTiffinSelect">
                Select Tiffin:
              </label>
              <div className="relative flex-1 max-w-md">
                <select
                  id="targetTiffinSelect"
                  value={selectedTiffinId || ''}
                  onChange={e => setSelectedTiffinId(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low px-4 py-2.5 pr-10 text-on-surface font-button-text text-button-text rounded border border-sand-neutral/40 focus:outline-none focus:bg-surface-container cursor-pointer"
                >
                  {tiffins.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category || 'Menu'})</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[20px]">
                  unfold_more
                </span>
              </div>
            </div>

            {currentSelectedTiffin && (
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded border border-sand-neutral/30 self-start md:self-auto">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Selected Menu Type:</span>
                <span className="font-button-text text-button-text text-primary font-semibold">
                  {currentSelectedTiffin.category || 'Standard'}
                </span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-surface-container-lowest rounded-lg border border-sand-neutral/50 shadow-sm overflow-hidden">
            {loadingItems ? (
              <div className="py-16 text-center text-secondary font-body-md">
                <span className="material-symbols-outlined text-[28px] animate-spin block mb-2">progress_activity</span>
                Loading tiffin items...
              </div>
            ) : tiffinItems.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[44px] text-secondary mb-3">restaurant_menu</span>
                <h3 className="font-headline-md text-xl text-primary font-serif">No Items Added Yet</h3>
                <p className="font-body-md text-sm text-secondary max-w-sm mt-1 mb-6">
                  {currentSelectedTiffin ? `"${currentSelectedTiffin.name}" currently has no dishes configured.` : 'Select a tiffin to start configuring items.'}
                </p>
                <button
                  type="button"
                  onClick={openAddItemModal}
                  className="px-5 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text rounded flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Add First Item</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-secondary font-label-caps text-label-caps uppercase tracking-wider border-b border-sand-neutral/40">
                      <th className="py-3 px-6 font-normal">Item Name</th>
                      <th className="py-3 px-4 font-normal">Category</th>
                      <th className="py-3 px-4 font-normal">Item Price</th>
                      <th className="py-3 px-4 font-normal">Available Qty</th>
                      <th className="py-3 px-4 text-center font-normal">Status</th>
                      <th className="py-3 px-6 text-right font-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                    {tiffinItems.map(item => {
                      const isAvail = item.isAvailable;
                      const displayPrice = item.price !== undefined ? item.price : (item.unitPrice || 0);
                      const displayQty = item.availableQuantity !== undefined ? item.availableQuantity : (item.defaultQuantity || 50);

                      return (
                        <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-4 px-6 font-button-text text-button-text text-primary">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[18px]">restaurant</span>
                              </div>
                              <div>
                                <div className="font-semibold text-primary">{item.name}</div>
                                {item.description && (
                                  <div className="font-body-md text-xs text-secondary line-clamp-1">{item.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-label-caps text-label-caps px-2.5 py-0.5 bg-surface-container text-on-surface rounded">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap font-button-text text-button-text font-bold text-primary">
                            ₹{displayPrice}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap font-mono text-sm text-secondary">
                            {displayQty}
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 font-label-caps text-label-caps ${isAvail ? 'text-primary' : 'text-secondary'}`}>
                              <span className={`w-2 h-2 rounded-full ${isAvail ? 'bg-emerald-600' : 'bg-secondary'}`}></span>
                              <span>{isAvail ? 'Available' : 'Out of Stock'}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditItemModal(item)}
                                className="px-2.5 py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <span className="text-sand-neutral text-xs">/</span>
                              <button
                                type="button"
                                onClick={() => setDeletingItem(item)}
                                className="px-2.5 py-1 text-secondary hover:text-error hover:bg-surface-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add / Edit Item Modal */}
          {showItemModal && (
            <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest border border-sand-neutral rounded-lg max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-sand-neutral">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                      {editingItem ? 'Edit Item' : 'New Dish'}
                    </span>
                    <h2 className="font-headline-md text-2xl text-primary font-serif">
                      {editingItem ? 'Edit Tiffin Item' : 'Add Item'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="text-secondary hover:text-primary p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleSaveItem} className="space-y-4">
                  {/* Selected Tiffin Context */}
                  <div className="p-3 bg-surface-container-low rounded border border-sand-neutral/40 flex items-center justify-between text-xs">
                    <span className="font-label-caps uppercase text-secondary">Target Tiffin:</span>
                    <span className="font-button-text font-bold text-primary">
                      {currentSelectedTiffin?.name || 'Selected Tiffin'}
                    </span>
                  </div>

                  {/* Item Name */}
                  <div className="space-y-1.5">
                    <label className="block font-label-caps text-label-caps uppercase text-primary tracking-wider" htmlFor="item-name">
                      Item Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="item-name"
                      type="text"
                      required
                      value={itemForm.name}
                      onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="e.g. Rotli, Thepla, Sev Tameta, Gujarati Dal"
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded font-body-md text-sm border border-sand-neutral/50 focus:bg-surface-container-lowest focus:outline-none"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block font-label-caps text-label-caps uppercase text-primary tracking-wider" htmlFor="item-category">
                      Item Category <span className="text-error">*</span>
                    </label>
                    <select
                      id="item-category"
                      required
                      value={itemForm.category}
                      onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                      className="w-full bg-surface-container-low px-4 py-2.5 rounded font-button-text text-sm border border-sand-neutral/50 focus:outline-none cursor-pointer"
                    >
                      {ITEM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="block font-label-caps text-label-caps uppercase text-primary tracking-wider" htmlFor="item-desc">
                      Item Description
                    </label>
                    <textarea
                      id="item-desc"
                      rows={2}
                      value={itemForm.description}
                      onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="Soft wheat roti tossed in pure ghee..."
                      className="w-full bg-surface-container-low p-3 rounded font-body-md text-sm border border-sand-neutral/50 resize-none focus:outline-none"
                    />
                  </div>

                  {/* Price & Quantity Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-label-caps text-label-caps uppercase text-primary tracking-wider" htmlFor="item-price">
                        Item Price (₹) <span className="text-error">*</span>
                      </label>
                      <input
                        id="item-price"
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        value={itemForm.price}
                        onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                        placeholder="5.00"
                        className="w-full bg-surface-container-low px-4 py-2.5 rounded font-mono text-sm border border-sand-neutral/50 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-label-caps text-label-caps uppercase text-primary tracking-wider" htmlFor="item-qty">
                        Available Quantity <span className="text-error">*</span>
                      </label>
                      <input
                        id="item-qty"
                        type="number"
                        min="0"
                        required
                        value={itemForm.availableQuantity}
                        onChange={e => setItemForm({ ...itemForm, availableQuantity: e.target.value })}
                        placeholder="100"
                        className="w-full bg-surface-container-low px-4 py-2.5 rounded font-mono text-sm border border-sand-neutral/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block font-label-caps text-label-caps uppercase text-primary tracking-wider">
                      Availability Status
                    </label>
                    <div className="grid grid-cols-2 gap-3 p-1 bg-surface-container-low rounded border border-sand-neutral/40">
                      <button
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, status: 'Available' })}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded font-button-text text-button-text transition-all cursor-pointer ${
                          itemForm.status === 'Available' ? 'bg-onyx-black text-on-primary' : 'text-secondary'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Available</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, status: 'Unavailable' })}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded font-button-text text-button-text transition-all cursor-pointer ${
                          itemForm.status !== 'Available' ? 'bg-onyx-black text-on-primary' : 'text-secondary'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span>Out of Stock</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-neutral">
                    <button
                      type="button"
                      onClick={() => setShowItemModal(false)}
                      className="px-5 py-2.5 bg-transparent hover:bg-surface-container font-button-text text-button-text text-secondary rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingItem}
                      className="px-6 py-2.5 bg-onyx-black hover:bg-neutral-800 disabled:opacity-50 text-on-primary font-button-text text-button-text rounded transition-all cursor-pointer shadow-sm"
                    >
                      {isSubmittingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Save Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TIFFIN AVAILABILITY SUB-VIEW (Quick Editor + Weekly Matrix)             */}
      {/* ========================================================================= */}
      {subView === 'availability' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral/60">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-secondary font-label-caps text-label-caps uppercase tracking-widest">
                <span>Food & Menu</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Tiffin Availability</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight font-serif">
                Tiffin Availability & Operational Days
              </h1>
              <p className="font-body-md text-body-md text-secondary max-w-2xl">
                Control customer ordering availability and active kitchen days for each tiffin offering. Changes propagate to customer checkout in real-time.
              </p>
            </div>

            <div className="flex items-center gap-6 bg-surface-container-low px-6 py-4 rounded-lg border border-sand-neutral/40 shrink-0">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Active Offerings</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-headline-md text-headline-md text-primary leading-none">
                    {tiffins.filter(t => t.status === 'Active').length}
                  </span>
                  <span className="font-button-text text-button-text text-secondary">/ {tiffins.length} Total</span>
                </div>
              </div>
              <div className="w-px h-8 bg-surface-container-highest"></div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-secondary uppercase">Kitchen Cycle</span>
                <span className="font-button-text text-button-text text-onyx-black mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-onyx-black inline-block"></span>
                  <span>Standard Service</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Quick Availability Editor (5 cols) + Weekly Matrix (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Panel 1: Quick Availability Editor */}
            <div className="lg:col-span-5 flex flex-col bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-sand-neutral/60">
              <div className="flex items-center justify-between pb-6 border-b border-sand-neutral/40">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-onyx-black text-[22px]">tune</span>
                  <h2 className="font-headline-md text-headline-md text-onyx-black text-[24px] leading-tight font-serif">
                    Quick Availability Editor
                  </h2>
                </div>
                <span className="font-label-caps text-label-caps bg-surface-container px-2.5 py-1 text-secondary rounded">
                  SCHEDULE
                </span>
              </div>

              {currentSelectedTiffin ? (
                <div className="flex flex-col gap-6 pt-6">
                  {/* Select Tiffin Control */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-baseline">
                      <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest" htmlFor="avail-tiffin-select">
                        Target Tiffin Selection
                      </label>
                      <span className="font-label-caps text-label-caps px-2 py-0.5 bg-secondary-container text-on-secondary-fixed-variant rounded">
                        {currentSelectedTiffin.category || 'Standard'}
                      </span>
                    </div>
                    <div className="relative bg-surface-container-low rounded border border-sand-neutral/40">
                      <select
                        id="avail-tiffin-select"
                        value={selectedTiffinId || ''}
                        onChange={e => setSelectedTiffinId(e.target.value)}
                        className="w-full bg-transparent font-button-text text-button-text text-on-surface py-3 px-4 pr-10 appearance-none outline-none cursor-pointer"
                      >
                        {tiffins.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary flex items-center">
                        <span className="material-symbols-outlined text-[20px]">unfold_more</span>
                      </div>
                    </div>
                  </div>

                  {/* Master Availability Toggle */}
                  <div className="p-4 bg-surface-container-low rounded border border-sand-neutral/40 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-button-text text-button-text text-onyx-black flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${currentSelectedTiffin.status === 'Active' ? 'bg-onyx-black' : 'bg-secondary'}`}></span>
                        <span>{currentSelectedTiffin.status === 'Active' ? 'Tiffin Available for Ordering' : 'Tiffin Paused / Unavailable'}</span>
                      </span>
                      <span className="font-label-caps text-label-caps text-secondary">
                        Kitchen is accepting customer orders for this tiffin
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus = currentSelectedTiffin.status === 'Active' ? 'Inactive' : 'Active';
                        handleSaveAvailability(currentSelectedTiffin.id, nextStatus === 'Active', currentSelectedTiffin.days || []);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                        currentSelectedTiffin.status === 'Active' ? 'bg-onyx-black' : 'bg-surface-dim'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest transition duration-200 ease-in-out ${
                        currentSelectedTiffin.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Weekly Days Checkbox Array */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                        Active Kitchen Service Days
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {DAYS_CONFIG.map(day => {
                        const daysArr = Array.isArray(currentSelectedTiffin.days) ? currentSelectedTiffin.days : [];
                        const isDayActive = daysArr.includes(day.full);

                        return (
                          <label
                            key={day.key}
                            onClick={(e) => {
                              e.preventDefault();
                              const nextDays = isDayActive ? daysArr.filter(d => d !== day.full) : [...daysArr, day.full];
                              handleSaveAvailability(currentSelectedTiffin.id, currentSelectedTiffin.status === 'Active', nextDays);
                            }}
                            className="group flex items-center justify-between p-3 rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-sand-neutral/30"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                readOnly
                                checked={isDayActive}
                                className="w-4 h-4 rounded text-onyx-black accent-onyx-black cursor-pointer"
                              />
                              <span className="font-button-text text-button-text text-onyx-black">{day.full}</span>
                            </div>
                            <span className="font-label-caps text-label-caps text-secondary group-hover:text-on-surface">
                              {isDayActive ? 'Active for Orders' : 'Off-Schedule'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Batch Ceiling Protocol Notice Box */}
                  <div className="bg-surface-container p-4 rounded border border-sand-neutral/40 flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">info</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-button-text text-button-text text-on-surface font-semibold">Live Storefront Sync</span>
                      <p className="font-label-caps text-label-caps text-secondary">
                        Changes committed here update your consumer storefront availability and prevent orders on off-days.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-secondary font-body-md">
                  No tiffins available to schedule. Create a tiffin first.
                </div>
              )}
            </div>

            {/* Panel 2: Weekly Schedule Matrix (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border border-sand-neutral/60 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-onyx-black text-[22px]">calendar_view_week</span>
                      <h2 className="font-headline-md text-headline-md text-onyx-black text-[24px] leading-tight font-serif">
                        Weekly Schedule Matrix
                      </h2>
                    </div>
                    <p className="font-label-caps text-label-caps text-secondary mt-1">
                      Overview of all provider tiffins and active operating slots
                    </p>
                  </div>
                  <span className="font-label-caps text-label-caps text-secondary bg-surface-container px-2.5 py-1 rounded">
                    {tiffins.length} Offerings
                  </span>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary font-label-caps text-label-caps uppercase tracking-wider border-b border-sand-neutral/40">
                        <th className="py-3 px-4 rounded-l font-normal">Tiffin Name</th>
                        <th className="py-3 px-3 font-normal">Category</th>
                        <th className="py-3 px-2 text-center font-normal">Mon</th>
                        <th className="py-3 px-2 text-center font-normal">Tue</th>
                        <th className="py-3 px-2 text-center font-normal">Wed</th>
                        <th className="py-3 px-2 text-center font-normal">Thu</th>
                        <th className="py-3 px-2 text-center font-normal">Fri</th>
                        <th className="py-3 px-2 text-center font-normal">Sat</th>
                        <th className="py-3 px-2 text-center font-normal">Sun</th>
                        <th className="py-3 px-3 text-center font-normal">Status</th>
                        <th className="py-3 px-4 text-right rounded-r font-normal">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                      {tiffins.map(t => {
                        const isSelected = selectedTiffinId === t.id;
                        const daysArr = Array.isArray(t.days) ? t.days : [];
                        const isActive = t.status === 'Active';

                        return (
                          <tr
                            key={t.id}
                            className={`transition-colors ${isSelected ? 'bg-surface-container/60 font-semibold' : 'hover:bg-surface-container-low/50'}`}
                          >
                            <td className="py-3.5 px-4 font-button-text text-button-text text-onyx-black whitespace-nowrap">
                              {t.name}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="font-label-caps text-label-caps px-2 py-0.5 bg-surface-container-highest text-on-surface rounded">
                                {t.category || 'Menu'}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Monday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Tuesday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Wednesday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Thursday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Friday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Saturday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              {daysArr.includes('Sunday') ? <span className="font-bold text-onyx-black">✓</span> : <span className="text-secondary">—</span>}
                            </td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 font-label-caps text-label-caps ${isActive ? 'text-onyx-black' : 'text-secondary'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-onyx-black' : 'bg-secondary'}`}></span>
                                <span>{isActive ? 'Available' : 'Paused'}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedTiffinId(t.id)}
                                className="font-button-text text-button-text text-onyx-black underline hover:opacity-75 cursor-pointer"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-secondary font-label-caps text-label-caps bg-surface-container-low p-4 rounded border border-sand-neutral/30">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                      <span className="text-onyx-black font-bold">✓</span> Ordering Window Open
                    </span>
                    <span className="flex items-center gap-2">
                      <span>—</span> Off-Schedule / Closed
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                    <span>Real-time DB Sync</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MEAL BUILDER SUB-VIEW (Preserved for compatibility)                     */}
      {/* ========================================================================= */}
      {subView === 'meal-builder' && (
        <MealBuilderTab
          tiffins={tiffins}
          onToast={(msg) => {
            showToast(msg);
            fetchAllItems();
            fetchTiffins();
          }}
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
