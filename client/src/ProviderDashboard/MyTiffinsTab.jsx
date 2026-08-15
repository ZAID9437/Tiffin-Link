import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Search, 
  Filter, 
  X, 
  Utensils, 
  Tag, 
  Clock, 
  MapPin, 
  CheckCircle, 
  CircleDot, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Upload,
  MoreVertical,
  Check,
  ImageIcon,
  Camera,
  FolderPlus,
  Eye,
  ChevronRightIcon,
  Sparkles,
  ShoppingBag,
  PauseCircle,
  PlayCircle,
  BarChart2,
  Layers,
  CheckSquare,
  XCircle,
  ArrowRight
} from 'lucide-react';

export default function MyTiffinsTab({ initialSubView = 'all', initialOpenModal = false, defaultOpenAdd = false }) {
  const [subView, setSubView] = useState(
    initialOpenModal ? 'add' :
    initialSubView === 'add' ? 'add' : 
    initialSubView === 'availability' ? 'availability' : 
    initialSubView === 'categories' ? 'categories' : 'all'
  );
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterFoodType, setFilterFoodType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingTiffin, setEditingTiffin] = useState(null);
  const [deletingTiffin, setDeletingTiffin] = useState(null);
  const [pausingTiffin, setPausingTiffin] = useState(null);
  
  // Category State & Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('All');

  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tiffins, setTiffins] = useState([]);
  const [categories, setCategories] = useState([]);

  const [catFormState, setCatFormState] = useState({
    name: '',
    description: '',
    status: 'Active',
    image: '/assets/provider_1.png'
  });

  // Preset Food Image Options Gallery
  const foodImageGallery = [
    { label: 'Gujarati Thali', url: '/assets/provider_1.png' },
    { label: 'Panjabi Thali', url: '/assets/provider_4.png' },
    { label: 'Jain Thali', url: '/assets/provider_3.png' },
    { label: 'Kathiyawadi Meal', url: '/assets/provider_2.png' },
    { label: 'Deluxe Feast', url: '/assets/provider_5.png' },
    { label: 'Heritage Meal', url: '/assets/indian_tiffin_heritage.png' },
    { label: 'South Indian', url: '/assets/food_south_indian.png' },
    { label: 'Special Biryani', url: '/assets/food_biryani.png' }
  ];

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    price: '120',
    category: 'Gujarati',
    foodType: 'Veg',
    capacity: '30',
    days: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false },
    area: 'Navrangpura, Satellite',
    ingredients: 'Fresh vegetables, Whole wheat flour, Pure Ghee',
    status: 'Active',
    image: '/assets/provider_1.png'
  });

  // Fetch Tiffins & Categories on Mount from MongoDB
  useEffect(() => {
    fetchTiffins();
    fetchCategories();
  }, []);

  const fetchTiffins = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/tiffins');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTiffins(json.data.map(t => ({
          ...t,
          id: t._id || t.id
        })));
      }
    } catch (err) {
      console.error('Error fetching tiffins:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const json = await res.json();
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

  useEffect(() => {
    if (defaultOpenAdd || initialOpenModal) {
      setSubView('add');
    }
  }, [defaultOpenAdd, initialOpenModal]);

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Category Handlers with MongoDB API calls
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatFormState({
      name: '',
      description: '',
      status: 'Active',
      image: '/assets/provider_1.png'
    });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatFormState({
      name: cat.name,
      description: cat.description || '',
      status: cat.status || 'Active',
      image: cat.image || '/assets/provider_1.png'
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catFormState.name.trim()) return;

    const trimmed = catFormState.name.trim();

    const payload = {
      name: trimmed,
      description: catFormState.description || 'Delicious home-cooked meal category.',
      status: catFormState.status,
      image: catFormState.image || '/assets/provider_1.png'
    };

    if (editingCategory) {
      const targetId = editingCategory.id || editingCategory._id;
      try {
        const res = await fetch(`http://localhost:5000/api/categories/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast(`✓ Category "${trimmed}" updated successfully!`);
          fetchCategories();
        }
      } catch (err) {
        console.error('Error updating category:', err);
      }
    } else {
      if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
        showToast(`⚠️ Category "${trimmed}" already exists.`);
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          showToast(`✓ Category "${trimmed}" created successfully!`);
          fetchCategories();
        }
      } catch (err) {
        console.error('Error creating category:', err);
      }
    }

    setShowCategoryModal(false);
  };

  const toggleCategoryStatus = async (cat) => {
    const nextStatus = cat.status === 'Active' ? 'Inactive' : 'Active';
    const targetId = cat.id || cat._id;
    
    setCategories(prev => prev.map(c => (c.id === targetId || c._id === targetId) ? { ...c, status: nextStatus } : c));
    showToast(`Category "${cat.name}" is now ${nextStatus.toLowerCase()}`);

    try {
      await fetch(`http://localhost:5000/api/categories/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error('Error updating category status:', err);
    }
  };

  const handleDeleteCategoryRequest = (cat) => {
    const linkedTiffinsCount = tiffins.filter(t => t.category === cat.name).length;
    setDeletingCategory({ ...cat, count: linkedTiffinsCount });
  };

  const confirmDeleteCategory = async () => {
    if (deletingCategory) {
      const targetId = deletingCategory.id || deletingCategory._id;
      if (deletingCategory.count > 0) {
        showToast(`⚠️ Cannot delete "${deletingCategory.name}". Reassign ${deletingCategory.count} tiffins first.`);
        setDeletingCategory(null);
        return;
      }

      setCategories(prev => prev.filter(c => (c.id !== targetId && c._id !== targetId)));
      showToast(`✓ Category "${deletingCategory.name}" removed successfully.`);

      try {
        await fetch(`http://localhost:5000/api/categories/${targetId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Error deleting category:', err);
      }

      setDeletingCategory(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({ ...prev, image: reader.result }));
        showToast('✓ Custom food image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTiffinStatus = async (id) => {
    const target = tiffins.find(t => t.id === id || t._id === id);
    if (!target) return;

    const nextStatus = target.status === 'Active' ? 'Paused' : 'Active';
    
    setTiffins(prev => prev.map(t => (t.id === id || t._id === id) ? { ...t, status: nextStatus } : t));
    showToast(`Tiffin "${target.name}" status updated to ${nextStatus}`);

    try {
      await fetch(`http://localhost:5000/api/tiffins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }

    setPausingTiffin(null);
  };

  const handleDeleteTiffin = async () => {
    if (deletingTiffin) {
      const targetId = deletingTiffin.id || deletingTiffin._id;
      setTiffins(prev => prev.filter(t => (t.id !== targetId && t._id !== targetId)));
      showToast(`Tiffin "${deletingTiffin.name}" deleted successfully.`);
      
      try {
        await fetch(`http://localhost:5000/api/tiffins/${targetId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Error deleting tiffin:', err);
      }

      setDeletingTiffin(null);
    }
  };

  const handleSaveTiffin = async (e) => {
    e.preventDefault();
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
      description: formState.description || 'Authentic home-style thali prepared daily.',
      price: Number(formState.price),
      category: formState.category,
      foodType: formState.foodType,
      capacity: Number(formState.capacity) || 30,
      days: selectedDaysArr.length > 0 ? selectedDaysArr : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: formState.area || 'All Localities',
      ingredients: formState.ingredients || 'Fresh veggies, Whole wheat flour, Ghee',
      status: formState.status,
      image: formState.image || '/assets/provider_1.png'
    };

    if (editingTiffin) {
      const targetId = editingTiffin.id || editingTiffin._id;
      try {
        const res = await fetch(`http://localhost:5000/api/tiffins/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
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
        const res = await fetch('http://localhost:5000/api/tiffins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success && json.data) {
          showToast(`✓ Tiffin "${payload.name}" created successfully!`);
          fetchTiffins();
        }
      } catch (err) {
        console.error('Error storing tiffin:', err);
      }
    }

    setIsSubmitting(false);
    setSubView('all');
    setFormState({
      name: '',
      description: '',
      price: '120',
      category: 'Gujarati',
      foodType: 'Veg',
      capacity: '30',
      days: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: false },
      area: 'Navrangpura, Satellite',
      ingredients: '',
      status: 'Active',
      image: '/assets/provider_1.png'
    });
  };

  const startEdit = (tiffin) => {
    setEditingTiffin(tiffin);
    const dayObj = { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false };
    if (Array.isArray(tiffin.days)) {
      tiffin.days.forEach(d => { dayObj[d] = true; });
    }
    setFormState({
      name: tiffin.name,
      description: tiffin.description,
      price: tiffin.price ? tiffin.price.toString() : '120',
      category: tiffin.category || 'Gujarati',
      foodType: tiffin.foodType || 'Veg',
      capacity: tiffin.capacity ? tiffin.capacity.toString() : '30',
      days: dayObj,
      area: tiffin.area || '',
      ingredients: tiffin.ingredients || '',
      status: tiffin.status || 'Active',
      image: tiffin.image || '/assets/provider_1.png'
    });
    setSubView('add');
  };

  const filteredTiffins = tiffins.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = filterCategory === 'All' || t.category === filterCategory;
    const matchesFood = filterFoodType === 'All' || t.foodType === filterFoodType;
    
    let matchesStatus = filterStatus === 'All';
    if (filterStatus === 'Active') matchesStatus = t.status === 'Active' && ((t.capacity - (t.ordersToday || 0)) > 0);
    if (filterStatus === 'Paused') matchesStatus = t.status === 'Paused';
    if (filterStatus === 'Sold Out') matchesStatus = (t.capacity - (t.ordersToday || 0)) <= 0;

    return matchesSearch && matchesCat && matchesFood && matchesStatus;
  });

  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) || (c.description && c.description.toLowerCase().includes(categorySearchQuery.toLowerCase()));
    const matchesStatus = categoryStatusFilter === 'All' || c.status === categoryStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = tiffins.filter(t => t.status === 'Active' && ((t.capacity - (t.ordersToday || 0)) > 0)).length;
  const pausedCount = tiffins.filter(t => t.status === 'Paused').length;
  const soldOutCount = tiffins.filter(t => (t.capacity - (t.ordersToday || 0)) <= 0).length;
  const totalAvailablePortions = tiffins.reduce((sum, t) => sum + Math.max(0, t.capacity - (t.ordersToday || 0)), 0);

  const activeCategoriesCount = categories.filter(c => c.status === 'Active').length;
  const inactiveCategoriesCount = categories.filter(c => c.status === 'Inactive').length;

  return (
    <div className="space-y-6 animate-slide-up relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#111827] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Module Sub-Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#E5ECE8] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSubView('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              subView === 'all' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            All Tiffins
          </button>
          <button 
            onClick={() => { setEditingTiffin(null); setSubView('add'); }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              subView === 'add' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            + Add Tiffin
          </button>
          <button 
            onClick={() => setSubView('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              subView === 'availability' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            Availability
          </button>
          <button 
            onClick={() => setSubView('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              subView === 'categories' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            <Tag size={13} />
            <span>Categories</span>
          </button>
        </div>

        <div className="text-xs text-[#6B7280] font-bold">
          Categories: <span className="text-[#0A8B5F] font-black">{categories.length}</span> | Tiffins: <span className="text-[#111827] font-black">{tiffins.length}</span>
        </div>
      </div>

      {/* ==================== SUB-VIEW 1: ALL TIFFINS ==================== */}
      {subView === 'all' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#111827] tracking-tight">My Tiffins</h1>
                <p className="text-xs text-[#6B7280] font-medium mt-1">Manage your tiffin menu, pricing, categories and daily availability.</p>
              </div>
              <button 
                onClick={() => { setEditingTiffin(null); setSubView('add'); }}
                className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Plus size={16} />
                <span>Add Tiffin</span>
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E5ECE8]">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
                <input 
                  type="text" 
                  placeholder="Search tiffins..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>

              <select 
                value={filterFoodType}
                onChange={e => setFilterFoodType(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="All">All Food Types</option>
                <option value="Veg">🟢 Veg</option>
                <option value="Jain">🟡 Jain</option>
                <option value="Non-Veg">🔴 Non-Veg</option>
              </select>

              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Sold Out">Sold Out</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8]">
              <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#6B7280] font-bold mt-3">Loading tiffins...</p>
            </div>
          ) : filteredTiffins.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-4">
              <Utensils size={40} className="mx-auto text-gray-400" />
              <h3 className="text-lg font-bold text-[#111827]">No Tiffins Found</h3>
              <p className="text-xs text-[#6B7280]">Start building your menu by adding your first tiffin offering.</p>
              <button 
                onClick={() => { setEditingTiffin(null); setSubView('add'); }}
                className="px-5 py-2 bg-[#0A8B5F] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                + Add First Tiffin
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTiffins.map(tif => (
                <div key={tif.id || tif._id} className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden shadow-xs food-card-hover group flex flex-col justify-between">
                  <div>
                    {/* Image Area with Badges */}
                    <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                      <img 
                        src={tif.image || '/assets/provider_1.png'} 
                        alt={tif.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        onError={(e) => { e.target.src = "/assets/provider_1.png"; }}
                      />
                      
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-extrabold text-[#111827] shadow-xs">
                        {tif.category}
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border shadow-xs ${
                          tif.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          tif.status === 'Sold Out' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          ● {tif.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base font-extrabold text-[#111827]">{tif.name}</h3>
                        <span className="text-base font-black text-[#0A8B5F]">₹{tif.price}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">{tif.description}</p>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="p-5 pt-0 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-[#6B7280] border-t border-[#E5ECE8] pt-3">
                      <span>Daily Cap: {tif.available || tif.capacity}/{tif.capacity}</span>
                      <span>⭐ {tif.rating || 4.8}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button 
                        onClick={() => startEdit(tif)}
                        className="flex-1 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>

                      <button 
                        onClick={() => toggleTiffinStatus(tif.id || tif._id)}
                        className={`py-2 px-3 border text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                          tif.status === 'Active' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {tif.status === 'Active' ? 'Pause' : 'Activate'}
                      </button>

                      <button 
                        onClick={() => setDeletingTiffin(tif)}
                        className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-VIEW 2: ADD TIFFIN (PRO TWO-COLUMN LAYOUT WITH LIVE PREVIEW) ==================== */}
      {subView === 'add' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
                <button onClick={() => setSubView('all')} className="hover:text-[#0A8B5F] cursor-pointer">My Tiffins</button>
                <span>/</span>
                <span className="text-[#0A8B5F] font-extrabold">{editingTiffin ? 'Edit Tiffin' : 'Add Tiffin'}</span>
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">{editingTiffin ? 'Edit Tiffin' : 'Add New Tiffin'}</h1>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Create a delicious meal that customers can discover and order.</p>
            </div>
            
            <button 
              onClick={() => setSubView('all')}
              className="px-4 py-2 border border-[#E5ECE8] text-[#6B7280] hover:bg-gray-50 font-bold text-xs rounded-xl transition-all cursor-pointer self-start sm:self-auto"
            >
              ← Back to All Tiffins
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8]">
              <form onSubmit={handleSaveTiffin} className="space-y-6 text-xs font-bold text-[#111827]">
                
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F] border-b border-[#E5ECE8] pb-2">
                    BASIC INFORMATION
                  </div>
                  
                  <div>
                    <label className="block mb-1 text-[#6B7280]">Tiffin Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Gujarati Home Thali"
                      value={formState.name}
                      onChange={e => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[#6B7280]">Description</label>
                      <span className="text-[10px] text-[#6B7280] font-bold">{formState.description.length} / 500</span>
                    </div>
                    <textarea 
                      rows={3}
                      maxLength={500}
                      placeholder="Authentic Gujarati home-style meal cooked with pure ghee, including 2 sabzi, rotis, dal & rice..."
                      value={formState.description}
                      onChange={e => setFormState({ ...formState, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[#6B7280]">Category</label>
                        <button 
                          type="button"
                          onClick={() => setSubView('categories')}
                          className="text-[10px] text-[#0A8B5F] font-bold hover:underline cursor-pointer"
                        >
                          + Add New Category
                        </button>
                      </div>
                      <select 
                        value={formState.category}
                        onChange={e => setFormState({ ...formState, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                      >
                        {categories.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-[#6B7280]">Food Type</label>
                      <select 
                        value={formState.foodType}
                        onChange={e => setFormState({ ...formState, foodType: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                      >
                        <option value="Veg">🟢 Veg</option>
                        <option value="Jain">🟡 Jain</option>
                        <option value="Non-Veg">🔴 Non-Veg</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] space-y-4">
                  <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F]">PRICING & CAPACITY</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-[#6B7280]">Price (₹) <span className="text-red-500">*</span></label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="120"
                        value={formState.price}
                        onChange={e => setFormState({ ...formState, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-[#6B7280]">Daily Capacity (Portions)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="30"
                        value={formState.capacity}
                        onChange={e => setFormState({ ...formState, capacity: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] space-y-4">
                  <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F] flex items-center gap-2">
                    <ImageIcon size={15} />
                    <span>TIFFIN IMAGE</span>
                  </div>

                  <label className="border-2 border-dashed border-[#E5ECE8] hover:border-[#0A8B5F] bg-[#F9FBF9] p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-2">
                    <Upload size={24} className="text-[#0A8B5F]" />
                    <div className="font-extrabold text-xs text-[#111827]">Upload Image / Drag & Drop</div>
                    <div className="text-[10px] text-[#6B7280]">JPG / PNG / WEBP</div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  <div className="space-y-2">
                    <label className="block text-[#6B7280] text-[11px]">Or Select from Preset Food Photos</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {foodImageGallery.map(item => (
                        <div 
                          key={item.url}
                          onClick={() => setFormState({ ...formState, image: item.url })}
                          className={`relative h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            formState.image === item.url ? 'border-[#0A8B5F] ring-2 ring-[#0A8B5F]/30 scale-95 shadow-md' : 'border-[#E5ECE8] hover:border-gray-400'
                          }`}
                        >
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                          {formState.image === item.url && (
                            <div className="absolute top-1 right-1 bg-[#0A8B5F] text-white p-0.5 rounded-full">
                              <Check size={10} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] space-y-4">
                  <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F]">AVAILABILITY & INITIAL STATUS</div>

                  <div>
                    <label className="block mb-2 text-[#6B7280]">Available Operating Days</label>
                    <div className="flex flex-wrap gap-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#111827] bg-[#F9FBF9] px-3 py-1.5 rounded-xl border border-[#E5ECE8]">
                          <input 
                            type="checkbox"
                            checked={Boolean(formState.days[day])}
                            onChange={e => setFormState({ ...formState, days: { ...formState.days, [day]: e.target.checked } })}
                            className="w-4 h-4 accent-[#0A8B5F] rounded cursor-pointer"
                          />
                          <span>{day.substring(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-[#6B7280]">Initial Kitchen Status</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#111827]">
                        <input 
                          type="radio" 
                          name="status"
                          value="Active"
                          checked={formState.status === 'Active'}
                          onChange={e => setFormState({ ...formState, status: e.target.value })}
                          className="accent-[#0A8B5F]"
                        />
                        <span>● Active (Accepting Orders)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#111827]">
                        <input 
                          type="radio" 
                          name="status"
                          value="Paused"
                          checked={formState.status === 'Paused'}
                          onChange={e => setFormState({ ...formState, status: e.target.value })}
                          className="accent-amber-600"
                        />
                        <span>○ Paused</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-[#E5ECE8]">
                  <button 
                    type="button" 
                    onClick={() => setSubView('all')}
                    className="px-6 py-2.5 border border-[#E5ECE8] rounded-xl text-[#6B7280] hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#0A8B5F] text-white font-bold rounded-xl hover:bg-[#08734E] transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Tiffin...</span>
                      </>
                    ) : (
                      <span>{editingTiffin ? 'Save Changes' : 'Create Tiffin'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4 sticky top-20 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-2">
                  <div className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5 uppercase tracking-wider">
                    <Eye size={15} className="text-[#0A8B5F]" />
                    <span>LIVE PREVIEW</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-[#0A8B5F] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Real-time Card
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden shadow-md">
                  <div className="relative h-44 w-full bg-gray-100">
                    <img src={formState.image || '/assets/provider_1.png'} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-extrabold text-[#111827] shadow-xs">
                      {formState.category || 'Gujarati'}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border shadow-xs ${
                        formState.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        ● {formState.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-extrabold text-[#111827]">
                        {formState.name.trim() || 'Gujarati Home Thali'}
                      </h3>
                      <span className="text-base font-black text-[#0A8B5F]">
                        ₹{formState.price || '120'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                      {formState.description.trim() || 'Authentic home-style thali prepared fresh daily.'}
                    </p>

                    <div className="flex justify-between items-center text-xs font-bold text-[#6B7280] border-t border-[#E5ECE8] pt-3 mt-3">
                      <span>Daily Cap: {formState.capacity || '30'} portions</span>
                      <span>● {formState.foodType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 3: MASTER AVAILABILITY DASHBOARD ==================== */}
      {subView === 'availability' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
                <button onClick={() => setSubView('all')} className="hover:text-[#0A8B5F] cursor-pointer">My Tiffins</button>
                <span>/</span>
                <span className="text-[#0A8B5F] font-extrabold">Availability</span>
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">Availability</h1>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Manage your daily tiffin availability, capacity and order fulfillment status.</p>
            </div>

            <div className="flex items-center gap-3 bg-[#F9FBF9] p-3 rounded-2xl border border-[#E5ECE8]">
              <Calendar size={18} className="text-[#0A8B5F]" />
              <div className="leading-tight">
                <div className="text-[10px] uppercase font-black text-[#0A8B5F] tracking-wider">TODAY</div>
                <div className="text-xs font-extrabold text-[#111827]">Friday, 14 August 2026</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setFilterStatus('Active')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                filterStatus === 'Active' ? 'bg-[#E8F0EC] border-[#0A8B5F] ring-2 ring-[#0A8B5F]/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Active Tiffins</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{activeCount}</div>
              <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">● Accepting orders now</p>
            </div>

            <div 
              onClick={() => setFilterStatus('Paused')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                filterStatus === 'Paused' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Paused Tiffins</span>
                <PauseCircle size={16} className="text-amber-600" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{pausedCount}</div>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">○ Temporarily paused</p>
            </div>

            <div 
              onClick={() => setFilterStatus('Sold Out')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer food-card-hover ${
                filterStatus === 'Sold Out' ? 'bg-red-50 border-red-500 ring-2 ring-red-500/30' : 'bg-white border-[#E5ECE8]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Sold Out</span>
                <AlertTriangle size={16} className="text-red-500" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{soldOutCount}</div>
              <p className="text-[11px] text-red-600 font-semibold mt-1">● Capacity reached (0 left)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Available Portions</span>
                <BarChart2 size={16} className="text-[#0A8B5F]" />
              </div>
              <div className="text-3xl font-black text-[#111827]">{totalAvailablePortions}</div>
              <p className="text-[11px] text-[#0A8B5F] font-semibold mt-1">Total remaining meals</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="text-base font-extrabold text-[#111827] shrink-0">Today's Tiffins</h3>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
                <input 
                  type="text" 
                  placeholder="Search tiffins..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Sold Out">Sold Out</option>
              </select>

              <select 
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredTiffins.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-3">
                <Utensils size={36} className="mx-auto text-gray-400" />
                <h3 className="text-base font-extrabold text-[#111827]">No Matching Availability Found</h3>
                <p className="text-xs text-[#6B7280]">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              filteredTiffins.map(tif => {
                const ordersCount = tif.ordersToday || 0;
                const capacity = tif.capacity || 30;
                const rem = Math.max(0, capacity - ordersCount);
                const isSoldOut = rem === 0;
                const percentUsed = Math.min(100, Math.round((ordersCount / capacity) * 100));

                return (
                  <div key={tif.id || tif._id} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4 food-card-hover">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#E5ECE8] bg-gray-100 shrink-0">
                          <img src={tif.image || '/assets/provider_1.png'} alt={tif.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-[#111827]">{tif.name}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280]">
                            <span className="text-[#0A8B5F] font-black">₹{tif.price}</span>
                            <span>•</span>
                            <span>{tif.category}</span>
                            <span>•</span>
                            <span>{tif.foodType}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${
                        isSoldOut ? 'bg-red-50 text-red-700 border-red-200' :
                        tif.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isSoldOut ? '● SOLD OUT' : tif.status === 'Active' ? '● ACTIVE' : '○ PAUSED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#F9FBF9] p-3 rounded-xl border border-[#E5ECE8] text-center text-xs font-bold">
                      <div>
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">Capacity</div>
                        <div className="text-base font-black text-[#111827]">{capacity}</div>
                      </div>
                      <div className="border-x border-[#E5ECE8]">
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">Ordered</div>
                        <div className="text-base font-black text-indigo-600">{ordersCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">Remaining</div>
                        <div className={`text-base font-black ${rem === 0 ? 'text-red-600' : 'text-[#0A8B5F]'}`}>{rem}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="w-full bg-[#E8F0EC] h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isSoldOut ? 'bg-red-500' : 'bg-[#0A8B5F]'}`} 
                          style={{ width: `${percentUsed}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-extrabold text-[#6B7280]">
                        <span>{percentUsed}% capacity used</span>
                        <span>{rem} portions left for ordering</span>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-2 border-t border-[#E5ECE8]">
                      <button 
                        onClick={() => startEdit(tif)}
                        className="px-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-[#111827] text-xs font-bold rounded-xl hover:bg-gray-100 cursor-pointer"
                      >
                        Manage
                      </button>

                      {tif.status === 'Active' ? (
                        <button 
                          onClick={() => setPausingTiffin(tif)}
                          className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <PauseCircle size={14} />
                          <span>Pause Tiffin</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => toggleTiffinStatus(tif.id || tif._id)}
                          className="px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <PlayCircle size={14} />
                          <span>Resume Tiffin</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 4: MASTER CATEGORIES MANAGEMENT MODULE ==================== */}
      {subView === 'categories' && (
        <div className="space-y-6">
          
          {/* Header & Primary Action */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
                <button onClick={() => setSubView('all')} className="hover:text-[#0A8B5F] cursor-pointer">Provider</button>
                <span>/</span>
                <span className="text-[#0A8B5F] font-extrabold">Categories</span>
              </div>
              <h1 className="text-2xl font-black text-[#111827] tracking-tight">Categories</h1>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Organize your tiffins into clear and easy-to-browse categories.</p>
            </div>

            <button 
              onClick={handleOpenAddCategory}
              className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Total Categories</div>
              <div className="text-3xl font-black text-[#111827]">{categories.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Active Categories</div>
              <div className="text-3xl font-black text-[#0A8B5F]">{activeCategoriesCount}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Inactive Categories</div>
              <div className="text-3xl font-black text-amber-600">{inactiveCategoriesCount}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs food-card-hover">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Categorized Tiffins</div>
              <div className="text-3xl font-black text-indigo-600">{tiffins.length}</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:w-auto">
              <Search size={15} className="absolute left-3.5 top-3 text-[#6B7280]" />
              <input 
                type="text" 
                placeholder="Search categories..."
                value={categorySearchQuery}
                onChange={e => setCategorySearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>

            <select 
              value={categoryStatusFilter}
              onChange={e => setCategoryStatusFilter(e.target.value)}
              className="w-full md:w-auto px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] text-xs font-bold text-[#111827] rounded-xl focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Professional Category Table / Cards List */}
          <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#111827]">
                <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Category</th>
                    <th className="p-4">Tiffins</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Updated</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5ECE8] font-bold">
                  {filteredCategories.map(cat => {
                    const catTiffinsCount = tiffins.filter(t => t.category === cat.name).length;

                    return (
                      <tr key={cat.id || cat._id} className="hover:bg-[#F9FBF9] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-[#E5ECE8] shrink-0">
                              <img src={cat.image || '/assets/provider_1.png'} alt={cat.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-[#111827]">{cat.name}</div>
                              <div className="text-[11px] text-[#6B7280] font-medium">{cat.description}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg border border-indigo-200">
                            {catTiffinsCount} tiffins
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${
                            cat.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            ● {cat.status}
                          </span>
                        </td>

                        <td className="p-4 text-[#6B7280] font-medium">
                          {cat.updated || 'Today'}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setFilterCategory(cat.name);
                                setSubView('all');
                              }}
                              className="px-3 py-1.5 bg-[#E8F0EC] text-[#0A8B5F] hover:bg-[#D2E4DC] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                              title="View Tiffins"
                            >
                              <span>View Tiffins</span>
                              <ArrowRight size={12} />
                            </button>

                            <button 
                              onClick={() => handleOpenEditCategory(cat)}
                              className="p-1.5 border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] rounded-xl transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button 
                              onClick={() => toggleCategoryStatus(cat)}
                              className={`p-1.5 border text-xs rounded-xl transition-colors cursor-pointer ${
                                cat.status === 'Active' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={cat.status === 'Active' ? 'Deactivate Category' : 'Activate Category'}
                            >
                              {cat.status === 'Active' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                            </button>

                            <button 
                              onClick={() => handleDeleteCategoryRequest(cat)}
                              className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-4 text-xs font-bold text-[#111827]">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-extrabold text-[#111827]">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 text-[#6B7280] hover:text-[#111827] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block mb-1 text-[#6B7280]">Category Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Gujarati Meals"
                  value={catFormState.name}
                  onChange={e => setCatFormState({ ...catFormState, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                />
              </div>

              <div>
                <label className="block mb-1 text-[#6B7280]">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Short description for customers..."
                  value={catFormState.description}
                  onChange={e => setCatFormState({ ...catFormState, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F9FBF9]"
                />
              </div>

              <div>
                <label className="block mb-1 text-[#6B7280]">Category Photo</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {foodImageGallery.slice(0, 4).map(img => (
                    <div 
                      key={img.url}
                      onClick={() => setCatFormState({ ...catFormState, image: img.url })}
                      className={`h-12 rounded-xl overflow-hidden border-2 cursor-pointer ${
                        catFormState.image === img.url ? 'border-[#0A8B5F] ring-2 ring-[#0A8B5F]/30' : 'border-[#E5ECE8]'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[#6B7280]">Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="catStatus"
                      value="Active"
                      checked={catFormState.status === 'Active'}
                      onChange={e => setCatFormState({ ...catFormState, status: e.target.value })}
                      className="accent-[#0A8B5F]"
                    />
                    <span>● Active</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="catStatus"
                      value="Inactive"
                      checked={catFormState.status === 'Inactive'}
                      onChange={e => setCatFormState({ ...catFormState, status: e.target.value })}
                      className="accent-gray-500"
                    />
                    <span>○ Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5ECE8]">
                <button 
                  type="button" 
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-[#E5ECE8] text-[#6B7280] rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#0A8B5F] text-white font-bold rounded-xl hover:bg-[#08734E] cursor-pointer shadow-xs"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY MODAL (WITH TIFFIN REASSIGNMENT GUARD) */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-4 text-center">
            <AlertTriangle size={36} className="text-amber-500 mx-auto" />
            <h3 className="text-base font-extrabold text-[#111827]">Delete Category?</h3>
            
            {deletingCategory.count > 0 ? (
              <div className="space-y-2 text-xs text-[#6B7280]">
                <p className="font-bold text-red-600">This category contains {deletingCategory.count} tiffins.</p>
                <p>You must reassign these tiffins to another category before permanently deleting this category.</p>
              </div>
            ) : (
              <p className="text-xs text-[#6B7280]">Are you sure you want to delete "{deletingCategory.name}"?</p>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingCategory(null)}
                className="w-1/2 py-2 border border-[#E5ECE8] text-[#6B7280] text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              
              {deletingCategory.count === 0 ? (
                <button 
                  onClick={confirmDeleteCategory}
                  className="w-1/2 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
                >
                  Delete
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setFilterCategory(deletingCategory.name);
                    setDeletingCategory(null);
                    setSubView('all');
                  }}
                  className="w-1/2 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                >
                  Reassign Tiffins
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pause Confirmation Modal */}
      {pausingTiffin && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-4 text-center">
            <PauseCircle size={36} className="text-amber-500 mx-auto" />
            <h3 className="text-base font-extrabold text-[#111827]">Pause Tiffin?</h3>
            <p className="text-xs text-[#6B7280]">Customers will not be able to place new orders for "{pausingTiffin.name}" while it is paused.</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setPausingTiffin(null)}
                className="w-1/2 py-2 border border-[#E5ECE8] text-[#6B7280] text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => toggleTiffinStatus(pausingTiffin.id || pausingTiffin._id)}
                className="w-1/2 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
              >
                Pause Tiffin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tiffin Confirmation Modal */}
      {deletingTiffin && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-slide-up space-y-4 text-center">
            <AlertTriangle size={36} className="text-red-500 mx-auto" />
            <h3 className="text-base font-extrabold text-[#111827]">Delete Tiffin?</h3>
            <p className="text-xs text-[#6B7280]">Are you sure you want to delete "{deletingTiffin.name}"? This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingTiffin(null)}
                className="w-1/2 py-2 border border-[#E5ECE8] text-[#6B7280] text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteTiffin}
                className="w-1/2 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
