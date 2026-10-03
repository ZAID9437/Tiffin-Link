import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

const FOOD_CATEGORIES = [
  'Breads',
  'Vegetable Curries',
  'Dal & Kadhi',
  'Rice & Khichdi',
  'Farsan',
  'Accompaniments',
  'Sweets',
  'Other'
];

const CATEGORY_ICONS = {
  'Breads': 'breakfast_dining',
  'Vegetable Curries': 'eco',
  'Dal & Kadhi': 'soup_kitchen',
  'Rice & Khichdi': 'rice_bowl',
  'Farsan': 'tapas',
  'Accompaniments': 'local_drink',
  'Sweets': 'icecream',
  'Other': 'restaurant'
};

const EMPTY_ITEM = {
  name: '',
  description: '',
  category: 'Breads',
  unit: 'piece',
  defaultQuantity: 1,
  minQuantity: 0,
  maxQuantity: 10,
  unitPrice: 0,
  isDefault: true,
  isAvailable: true,
  isCustomizable: true
};

export default function CategoriesItemsTab({ tiffins = [], onToast }) {
  const [selectedTiffinId, setSelectedTiffinId] = useState(tiffins.length > 0 ? (tiffins[0].id || tiffins[0]._id) : null);
  const [activeCategory, setActiveCategory] = useState('Breads');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState({ ...EMPTY_ITEM });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const showToast = (msg) => {
    if (onToast) onToast(msg);
  };

  const fetchItems = useCallback(async (tiffinId) => {
    if (!tiffinId) return;
    try {
      setLoading(true);
      const json = await apiRequest(`/tiffin-items?tiffinId=${tiffinId}`);
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data.map(i => ({ ...i, id: i._id || i.id })));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTiffinId) fetchItems(selectedTiffinId);
  }, [selectedTiffinId, fetchItems]);

  useEffect(() => {
    if (tiffins.length > 0 && !selectedTiffinId) {
      setSelectedTiffinId(tiffins[0].id || tiffins[0]._id);
    }
  }, [tiffins, selectedTiffinId]);

  const itemsByCategory = FOOD_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  const handleFormChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState({ ...EMPTY_ITEM, category: activeCategory });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formState.name.trim()) { showToast('⚠️ Item name is required'); return; }
    if (!selectedTiffinId) { showToast('⚠️ Please select a tiffin first'); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formState,
        tiffinId: selectedTiffinId,
        name: formState.name.trim(),
        defaultQuantity: Number(formState.defaultQuantity),
        minQuantity: Number(formState.minQuantity),
        maxQuantity: Number(formState.maxQuantity),
        unitPrice: Number(formState.unitPrice),
      };

      if (editingItem) {
        const json = await apiRequest(`/tiffin-items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (json.success) {
          showToast(`✓ Item "${formState.name}" updated!`);
          fetchItems(selectedTiffinId);
          resetForm();
        } else {
          showToast('⚠️ Failed to update item');
        }
      } else {
        const json = await apiRequest('/tiffin-items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (json.success) {
          showToast(`✓ Item "${formState.name}" added!`);
          fetchItems(selectedTiffinId);
          resetForm();
        } else {
          showToast('⚠️ Failed to add item');
        }
      }
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('⚠️ Error saving item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const json = await apiRequest(`/tiffin-items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !item.isAvailable })
      });
      if (json.success) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
        showToast(`✓ "${item.name}" ${!item.isAvailable ? 'activated' : 'deactivated'}`);
      }
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      const json = await apiRequest(`/tiffin-items/${deletingItem.id}`, { method: 'DELETE' });
      if (json.success) {
        showToast(`✓ Item "${deletingItem.name}" removed`);
        setItems(prev => prev.filter(i => i.id !== deletingItem.id));
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
    setDeletingItem(null);
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormState({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'Breads',
      unit: item.unit || 'piece',
      defaultQuantity: item.defaultQuantity || 1,
      minQuantity: item.minQuantity || 0,
      maxQuantity: item.maxQuantity || 10,
      unitPrice: item.unitPrice || 0,
      isDefault: item.isDefault !== false,
      isAvailable: item.isAvailable !== false,
      isCustomizable: item.isCustomizable !== false
    });
    setActiveCategory(item.category || 'Breads');
    setShowAddForm(true);
  };

  const selectedTiffin = tiffins.find(t => (t.id || t._id) === selectedTiffinId);
  const activeCategoryItems = itemsByCategory[activeCategory] || [];

  const totalItems = items.length;
  const availableItems = items.filter(i => i.isAvailable).length;
  const defaultItems = items.filter(i => i.isDefault).length;
  const totalValue = items.filter(i => i.isDefault).reduce((sum, i) => sum + (i.unitPrice * i.defaultQuantity), 0);

  return (
    <div className="flex flex-col w-full space-y-6">

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-sand-neutral">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              <h3 className="font-headline-md text-xl text-on-surface">Remove Item</h3>
            </div>
            <p className="text-xs text-secondary font-body-md">
              Deactivate <strong className="text-on-surface">"{deletingItem.name}"</strong> from this tiffin? 
              Historical orders will remain intact.
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeletingItem(null)} className="flex-1 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteItem} className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer">
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sand-neutral/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-label-caps text-xs text-secondary tracking-wider uppercase">
            <span>My Tiffins</span><span>/</span>
            <span className="text-onyx-black font-bold">Categories & Items</span>
          </div>
          <h1 className="font-headline-lg text-3xl text-on-surface">Manage Food Items</h1>
          <p className="font-body-md text-xs text-secondary">Configure all food items, categories, quantities and pricing for each tiffin.</p>
        </div>
        <button
          type="button"
          onClick={() => { setFormState({ ...EMPTY_ITEM, category: activeCategory }); setEditingItem(null); setShowAddForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Custom Item
        </button>
      </div>

      {/* Tiffin Selector */}
      {tiffins.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 text-center space-y-2">
          <span className="material-symbols-outlined text-[40px] text-secondary">restaurant_menu</span>
          <p className="text-sm font-body-md text-secondary">No tiffins found. Create a tiffin first, then add items here.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tiffins.map(t => {
              const tid = t.id || t._id;
              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setSelectedTiffinId(tid)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedTiffinId === tid ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container-low text-secondary hover:text-onyx-black'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          {/* Summary KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Items', val: totalItems, icon: 'list_alt', color: '' },
              { label: 'Available', val: availableItems, icon: 'check_circle', color: 'text-emerald-700' },
              { label: 'In Default Meal', val: defaultItems, icon: 'star', color: 'text-amber-700' },
              { label: 'Base Price', val: `₹${totalValue}`, icon: 'currency_rupee', color: 'text-onyx-black' }
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-sm flex items-center gap-3">
                <span className={`material-symbols-outlined text-[22px] ${stat.color || 'text-secondary'}`}>{stat.icon}</span>
                <div>
                  <div className={`font-headline-md text-xl font-bold ${stat.color || 'text-on-surface'}`}>{stat.val}</div>
                  <div className="font-label-caps text-[10px] uppercase text-secondary">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid: Category Tabs + Items */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Category Tabs */}
            <div className="lg:col-span-3 space-y-2">
              <div className="font-label-caps text-[10px] uppercase text-secondary tracking-widest px-1 font-bold">Food Categories</div>
              {FOOD_CATEGORIES.map(cat => {
                const count = (itemsByCategory[cat] || []).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-onyx-black text-bone-white shadow-sm'
                        : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low hover:text-on-surface border border-sand-neutral/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[18px] ${activeCategory === cat ? 'text-bone-white' : 'text-clay-earth'}`}>
                        {CATEGORY_ICONS[cat] || 'restaurant'}
                      </span>
                      <span className="font-button-text text-xs font-semibold">{cat}</span>
                    </div>
                    {count > 0 && (
                      <span className={`font-label-caps text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeCategory === cat ? 'bg-bone-white/20 text-bone-white' : 'bg-surface-container text-secondary'
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Items List */}
            <div className="lg:col-span-9 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-clay-earth">{CATEGORY_ICONS[activeCategory]}</span>
                  <h2 className="font-headline-md text-xl text-on-surface">{activeCategory}</h2>
                  <span className="font-label-caps text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                    {activeCategoryItems.length} items
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setFormState({ ...EMPTY_ITEM, category: activeCategory }); setEditingItem(null); setShowAddForm(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer border border-sand-neutral/40"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add to {activeCategory}
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-secondary text-xs">
                  <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
                  <p className="mt-2">Loading items...</p>
                </div>
              ) : activeCategoryItems.length === 0 ? (
                <div className="p-10 rounded-2xl bg-surface-container-lowest border border-dashed border-sand-neutral text-center space-y-2">
                  <span className="material-symbols-outlined text-[40px] text-secondary">add_circle</span>
                  <p className="text-sm text-secondary">No items in {activeCategory} yet.</p>
                  <button
                    type="button"
                    onClick={() => { setFormState({ ...EMPTY_ITEM, category: activeCategory }); setEditingItem(null); setShowAddForm(true); }}
                    className="px-4 py-2 bg-onyx-black text-bone-white text-xs font-bold rounded-xl hover:bg-stone-800 cursor-pointer"
                  >
                    + Add First Item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCategoryItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        item.isAvailable
                          ? 'bg-surface-container-lowest border-sand-neutral/40 shadow-sm'
                          : 'bg-surface-container-low border-sand-neutral/30 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${item.isAvailable ? 'bg-emerald-500' : 'bg-secondary'}`} />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-button-text text-sm font-semibold text-on-surface">{item.name}</span>
                              {item.isDefault && (
                                <span className="font-label-caps text-[9px] uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">Default</span>
                              )}
                              {item.isCustomizable && (
                                <span className="font-label-caps text-[9px] uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Customizable</span>
                              )}
                              {!item.isAvailable && (
                                <span className="font-label-caps text-[9px] uppercase bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-full font-bold">Unavailable</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-secondary mt-0.5">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-2 font-label-caps text-[11px] text-secondary">
                              <span>Default: <strong className="text-on-surface">{item.defaultQuantity} {item.unit || 'pc'}</strong></span>
                              <span>Range: <strong className="text-on-surface">{item.minQuantity}–{item.maxQuantity}</strong></span>
                              <span>Unit Price: <strong className="text-on-surface">₹{item.unitPrice}</strong></span>
                              <span>Subtotal: <strong className="text-onyx-black">₹{item.unitPrice * item.defaultQuantity}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              item.isAvailable
                                ? 'bg-surface-container text-secondary hover:bg-surface-container-high'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {item.isAvailable ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Item Slide-in Panel */}
      {showAddForm && (
        <div className="fixed inset-0 bg-onyx-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-sand-neutral max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-container-lowest border-b border-sand-neutral/40 px-6 py-4 flex items-center justify-between">
              <h2 className="font-headline-md text-xl text-on-surface">
                {editingItem ? `Edit: ${editingItem.name}` : 'Add Custom Item'}
              </h2>
              <button type="button" onClick={resetForm} className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px] text-secondary">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-5">
              {/* Item Name */}
              <div className="space-y-1.5">
                <label className="font-label-caps text-[11px] uppercase text-secondary tracking-widest">Item Name *</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Methi Thepla"
                  required
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-on-surface text-sm font-body-md focus:outline-none focus:bg-surface-container transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-label-caps text-[11px] uppercase text-secondary tracking-widest">Description</label>
                <input
                  type="text"
                  value={formState.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  placeholder="Brief description..."
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-on-surface text-sm font-body-md focus:outline-none focus:bg-surface-container transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-label-caps text-[11px] uppercase text-secondary tracking-widest">Category *</label>
                <select
                  value={formState.category}
                  onChange={e => handleFormChange('category', e.target.value)}
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-xl text-on-surface text-sm font-body-md focus:outline-none appearance-none cursor-pointer"
                >
                  {FOOD_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="font-label-caps text-[11px] uppercase text-secondary tracking-widest">Unit</label>
                <div className="flex gap-2 flex-wrap">
                  {['piece', 'serving', 'bowl', 'plate', 'glass', 'grams'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleFormChange('unit', u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        formState.unit === u ? 'bg-onyx-black text-bone-white' : 'bg-surface-container-low text-secondary hover:text-on-surface'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Settings */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Default Qty', field: 'defaultQuantity', min: 0 },
                  { label: 'Min Qty', field: 'minQuantity', min: 0 },
                  { label: 'Max Qty', field: 'maxQuantity', min: 1 }
                ].map(({ label, field, min }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="font-label-caps text-[10px] uppercase text-secondary">{label}</label>
                    <input
                      type="number"
                      min={min}
                      value={formState[field]}
                      onChange={e => handleFormChange(field, e.target.value)}
                      className="w-full bg-surface-container-low px-3 py-2 rounded-xl text-on-surface text-sm text-center font-mono focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Unit Price */}
              <div className="space-y-1.5">
                <label className="font-label-caps text-[11px] uppercase text-secondary tracking-widest">Unit Price (₹)</label>
                <div className="flex items-center bg-surface-container-low rounded-xl overflow-hidden">
                  <span className="px-3 text-secondary font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={formState.unitPrice}
                    onChange={e => handleFormChange('unitPrice', e.target.value)}
                    className="flex-1 py-2.5 pr-4 bg-transparent text-on-surface text-sm font-mono font-bold focus:outline-none"
                  />
                </div>
                {formState.unitPrice > 0 && (
                  <p className="text-[11px] text-secondary">
                    {formState.defaultQuantity} × ₹{formState.unitPrice} = <strong className="text-onyx-black">₹{formState.defaultQuantity * formState.unitPrice}</strong>
                  </p>
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Default Item', field: 'isDefault', desc: 'Auto-included in tiffin' },
                  { label: 'Available', field: 'isAvailable', desc: 'Currently in stock' },
                  { label: 'Customizable', field: 'isCustomizable', desc: 'Customer can adjust qty' }
                ].map(({ label, field, desc }) => (
                  <div
                    key={field}
                    onClick={() => handleFormChange(field, !formState[field])}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formState[field]
                        ? 'bg-onyx-black border-onyx-black text-bone-white'
                        : 'bg-surface-container-low border-sand-neutral/40 text-secondary hover:border-sand-neutral'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-caps text-[10px] uppercase font-bold">{label}</span>
                      <span className={`material-symbols-outlined text-[16px] ${formState[field] ? 'text-bone-white' : 'text-secondary'}`}>
                        {formState[field] ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <p className={`text-[10px] leading-tight ${formState[field] ? 'text-bone-white/70' : 'text-secondary'}`}>{desc}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-surface-container text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-onyx-black text-bone-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
