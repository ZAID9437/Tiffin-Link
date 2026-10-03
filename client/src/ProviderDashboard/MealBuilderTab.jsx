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

export default function MealBuilderTab({ tiffins = [], onToast, onNavigateTab }) {
  const [selectedTiffinId, setSelectedTiffinId] = useState(
    tiffins.length > 0 ? (tiffins[0].id || tiffins[0]._id) : null
  );
  const [allItems, setAllItems] = useState([]);
  const [configuredItems, setConfiguredItems] = useState({});
  // configuredItems: { [itemId]: { ...item, selectedQty, isInMeal, isDefault } }
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Breads');

  const showToast = (msg) => { if (onToast) onToast(msg); };

  const fetchItems = useCallback(async (tiffinId) => {
    if (!tiffinId) return;
    try {
      setLoading(true);
      const json = await apiRequest(`/tiffin-items?tiffinId=${tiffinId}`);
      if (json.success && Array.isArray(json.data)) {
        const items = json.data.map(i => ({ ...i, id: i._id || i.id }));
        setAllItems(items);

        // Build configuredItems state from existing items
        const conf = {};
        items.forEach(item => {
          conf[item.id] = {
            ...item,
            selectedQty: item.defaultQuantity || 1,
            isInMeal: item.isAvailable !== false // all available items are "in meal"
          };
        });
        setConfiguredItems(conf);
      } else {
        setAllItems([]);
        setConfiguredItems({});
      }
    } catch (err) {
      console.error('Error fetching items:', err);
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

  const selectedTiffin = tiffins.find(t => (t.id || t._id) === selectedTiffinId);

  // Items grouped by category for this tiffin
  const itemsByCategory = FOOD_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = allItems.filter(i => i.category === cat);
    return acc;
  }, {});

  const toggleItemInMeal = (itemId) => {
    setConfiguredItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isInMeal: !prev[itemId]?.isInMeal
      }
    }));
  };

  const toggleItemDefault = (itemId) => {
    setConfiguredItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isDefault: !prev[itemId]?.isDefault
      }
    }));
  };

  const adjustQty = (itemId, delta) => {
    const item = configuredItems[itemId];
    if (!item) return;
    const newQty = Math.max(item.minQuantity || 0, Math.min(item.maxQuantity || 20, (item.selectedQty || 1) + delta));
    setConfiguredItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selectedQty: newQty }
    }));
  };

  const updateItemField = (itemId, field, value) => {
    setConfiguredItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  // Price calculations
  const mealItems = Object.values(configuredItems).filter(i => i.isInMeal);
  const defaultMealItems = mealItems.filter(i => i.isDefault);
  const customizableItems = mealItems.filter(i => !i.isDefault);

  const basePrice = defaultMealItems.reduce((sum, i) => sum + ((i.unitPrice || 0) * (i.selectedQty || i.defaultQuantity || 1)), 0);
  const customTotal = customizableItems.reduce((sum, i) => sum + ((i.unitPrice || 0) * (i.selectedQty || i.defaultQuantity || 1)), 0);
  const deliveryFee = 30;
  const grandTotal = basePrice + customTotal + deliveryFee;

  const handleSaveMeal = async () => {
    if (!selectedTiffinId) { showToast('⚠️ Select a tiffin first'); return; }
    if (mealItems.length === 0) { showToast('⚠️ Add at least one item to the meal'); return; }

    setIsSaving(true);
    try {
      const itemsPayload = mealItems.map((item, idx) => ({
        tiffinId: selectedTiffinId,
        category: item.category,
        name: item.name,
        description: item.description || '',
        image: item.image || '',
        unit: item.unit || 'piece',
        defaultQuantity: item.selectedQty || item.defaultQuantity || 1,
        minQuantity: item.minQuantity || 0,
        maxQuantity: item.maxQuantity || 10,
        unitPrice: item.unitPrice || 0,
        isDefault: item.isDefault !== false,
        isAvailable: true,
        isCustomizable: item.isCustomizable !== false,
        sortOrder: idx
      }));

      const json = await apiRequest('/tiffin-items/bulk', {
        method: 'POST',
        body: JSON.stringify({ tiffinId: selectedTiffinId, items: itemsPayload })
      });

      if (json.success) {
        showToast(`✓ Meal configuration saved! ${json.count} items saved.`);
        fetchItems(selectedTiffinId);
      } else {
        showToast('⚠️ Failed to save meal configuration');
      }
    } catch (err) {
      console.error('Error saving meal:', err);
      showToast('⚠️ Error saving meal configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const categoriesWithItems = FOOD_CATEGORIES.filter(cat => (itemsByCategory[cat] || []).length > 0);
  const activeCategoryItems = itemsByCategory[activeCategory] || [];

  return (
    <div className="flex flex-col w-full space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sand-neutral/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-label-caps text-xs text-secondary tracking-wider uppercase">
            <span>My Tiffins</span><span>/</span>
            <span className="text-onyx-black font-bold">Meal Builder</span>
          </div>
          <h1 className="font-headline-lg text-3xl text-on-surface">Meal Builder</h1>
          <p className="font-body-md text-xs text-secondary">
            Configure which items appear in each tiffin, set them as default or optional, and calculate the final price.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('categories')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer border border-sand-neutral/40"
            >
              <span className="material-symbols-outlined text-[16px]">category</span>
              Manage Items
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveMeal}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-onyx-black text-bone-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{isSaving ? 'hourglass_empty' : 'save'}</span>
            {isSaving ? 'Saving...' : 'Save Meal Config'}
          </button>
        </div>
      </div>

      {tiffins.length === 0 ? (
        <div className="p-10 rounded-2xl bg-surface-container-lowest border border-sand-neutral text-center space-y-3">
          <span className="material-symbols-outlined text-[48px] text-secondary">restaurant_menu</span>
          <p className="text-sm text-secondary">No tiffins found. Create a tiffin first, then use Meal Builder to configure items.</p>
          {onNavigateTab && (
            <button onClick={() => onNavigateTab('add-tiffin')} className="px-4 py-2 bg-onyx-black text-bone-white text-xs font-bold rounded-xl cursor-pointer">
              Create Tiffin
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tiffin Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {tiffins.map(t => {
              const tid = t.id || t._id;
              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setSelectedTiffinId(tid)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedTiffinId === tid
                      ? 'bg-onyx-black text-bone-white shadow-sm'
                      : 'bg-surface-container-lowest text-secondary hover:text-onyx-black border border-sand-neutral/40'
                  }`}
                >
                  {t.name}
                  {selectedTiffinId === tid && <span className="ml-1.5 opacity-60">●</span>}
                </button>
              );
            })}
          </div>

          {/* Info Banner */}
          {selectedTiffin && (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-sand-neutral/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedTiffin.image && (
                  <img src={selectedTiffin.image} alt={selectedTiffin.name} className="w-12 h-12 rounded-xl object-cover border border-sand-neutral/50 shrink-0" />
                )}
                <div>
                  <h2 className="font-headline-md text-lg text-on-surface">{selectedTiffin.name}</h2>
                  <div className="font-label-caps text-[11px] text-secondary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {selectedTiffin.category} • {selectedTiffin.foodType}
                  </div>
                </div>
              </div>
              <div className="font-label-caps text-xs text-secondary bg-surface-container-lowest px-3 py-2 rounded-xl border border-sand-neutral/40">
                <div>Default Price: <strong className="text-onyx-black">₹{basePrice}</strong></div>
                <div>{mealItems.length} items configured</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-10 text-center text-secondary">
              <span className="material-symbols-outlined animate-spin text-[36px]">progress_activity</span>
              <p className="mt-2 text-xs">Loading items...</p>
            </div>
          ) : allItems.length === 0 ? (
            <div className="p-10 rounded-2xl bg-surface-container-lowest border border-dashed border-sand-neutral text-center space-y-3">
              <span className="material-symbols-outlined text-[48px] text-secondary">add_shopping_cart</span>
              <p className="text-sm text-secondary">No items found for this tiffin.</p>
              <p className="text-xs text-secondary">Go to <strong>Categories & Items</strong> to add food items first.</p>
              {onNavigateTab && (
                <button onClick={() => onNavigateTab('categories')} className="px-4 py-2 bg-onyx-black text-bone-white text-xs font-bold rounded-xl cursor-pointer">
                  Add Items
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Item Configuration (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 font-label-caps text-[11px] text-secondary p-3 bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-onyx-black"></span> In Meal (Available to customer)</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-200"></span> Default (Auto-included)</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-surface-container-high border border-sand-neutral"></span> Optional (Customer chooses)</div>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {FOOD_CATEGORIES.filter(cat => (itemsByCategory[cat] || []).length > 0).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === cat ? 'bg-onyx-black text-bone-white' : 'bg-surface-container-low text-secondary hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px] mr-1 align-middle">{CATEGORY_ICONS[cat] || 'restaurant'}</span>
                      {cat} ({(itemsByCategory[cat] || []).length})
                    </button>
                  ))}
                </div>

                {/* Items for active category */}
                <div className="space-y-3">
                  {activeCategoryItems.length === 0 ? (
                    <div className="p-6 text-center text-secondary text-xs bg-surface-container-low rounded-xl">
                      No items in {activeCategory}
                    </div>
                  ) : (
                    activeCategoryItems.map(item => {
                      const conf = configuredItems[item.id] || {};
                      const isInMeal = conf.isInMeal !== false;
                      const isDefault = conf.isDefault !== false;
                      const qty = conf.selectedQty || item.defaultQuantity || 1;
                      const itemTotal = (item.unitPrice || 0) * qty;

                      return (
                        <div
                          key={item.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isInMeal
                              ? isDefault
                                ? 'bg-amber-50/40 border-amber-200/60 shadow-sm'
                                : 'bg-surface-container-lowest border-sand-neutral/40 shadow-sm'
                              : 'bg-surface-container-low border-sand-neutral/30 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {/* In Meal Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleItemInMeal(item.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                  isInMeal ? 'bg-onyx-black border-onyx-black' : 'border-sand-neutral bg-surface-container-lowest'
                                }`}
                              >
                                {isInMeal && <span className="material-symbols-outlined text-bone-white text-[13px]">check</span>}
                              </button>

                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`font-button-text text-sm font-semibold ${isInMeal ? 'text-on-surface' : 'text-secondary'}`}>
                                    {item.name}
                                  </span>
                                  {/* Default Toggle */}
                                  {isInMeal && (
                                    <button
                                      type="button"
                                      onClick={() => toggleItemDefault(item.id)}
                                      className={`font-label-caps text-[9px] uppercase px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                                        isDefault
                                          ? 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                                          : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                                      }`}
                                    >
                                      {isDefault ? '★ Default' : '☆ Optional'}
                                    </button>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-secondary mt-0.5">{item.description}</p>
                                )}
                                <div className="mt-1 font-label-caps text-[11px] text-secondary">
                                  ₹{item.unitPrice} per {item.unit || 'piece'}
                                  {isInMeal && <span className="ml-2 font-bold text-onyx-black">Total: ₹{itemTotal}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Quantity Control */}
                            {isInMeal && (
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <div className="flex items-center gap-1 bg-surface-container-lowest border border-sand-neutral/50 rounded-xl px-1 py-1">
                                  <button
                                    type="button"
                                    onClick={() => adjustQty(item.id, -1)}
                                    disabled={qty <= (item.minQuantity || 0)}
                                    className="w-7 h-7 flex items-center justify-center text-secondary hover:text-onyx-black disabled:opacity-30 transition-colors cursor-pointer rounded-lg hover:bg-surface-container"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">remove</span>
                                  </button>
                                  <span className="font-mono font-bold text-sm text-on-surface w-6 text-center">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => adjustQty(item.id, 1)}
                                    disabled={qty >= (item.maxQuantity || 20)}
                                    className="w-7 h-7 flex items-center justify-center text-secondary hover:text-onyx-black disabled:opacity-30 transition-colors cursor-pointer rounded-lg hover:bg-surface-container"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                  </button>
                                </div>
                                <div className="font-mono text-sm font-bold text-onyx-black w-16 text-right">₹{itemTotal}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Live Price Summary (4 cols) */}
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">

                {/* Meal Summary Card */}
                <div className="bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 shadow-sm p-6 space-y-5">
                  <div className="space-y-1">
                    <div className="font-label-caps text-[10px] uppercase text-secondary tracking-widest">Live Composition</div>
                    <h3 className="font-headline-md text-xl text-on-surface">{selectedTiffin?.name || 'Tiffin'}</h3>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{mealItems.length} items • {defaultMealItems.length} default</span>
                    </div>
                  </div>

                  {/* Default Items */}
                  {defaultMealItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-label-caps text-[10px] uppercase text-secondary font-bold">Default Items (Base Meal)</div>
                      {FOOD_CATEGORIES.map(cat => {
                        const catDefaultItems = defaultMealItems.filter(i => i.category === cat);
                        if (catDefaultItems.length === 0) return null;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="font-label-caps text-[9px] uppercase text-clay-earth font-bold">{cat}</div>
                            {catDefaultItems.map(i => (
                              <div key={i.id} className="flex justify-between items-center text-xs">
                                <span className="text-on-surface">
                                  {i.name}
                                  <span className="text-secondary ml-1">× {i.selectedQty || i.defaultQuantity || 1}</span>
                                </span>
                                <span className="font-mono font-bold text-onyx-black">
                                  ₹{(i.unitPrice || 0) * (i.selectedQty || i.defaultQuantity || 1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Optional Items */}
                  {customizableItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-label-caps text-[10px] uppercase text-secondary font-bold">Optional Items</div>
                      {customizableItems.map(i => (
                        <div key={i.id} className="flex justify-between items-center text-xs">
                          <span className="text-secondary">
                            {i.name}
                            <span className="ml-1">× {i.selectedQty || i.defaultQuantity || 1}</span>
                          </span>
                          <span className="font-mono text-secondary">
                            +₹{(i.unitPrice || 0) * (i.selectedQty || i.defaultQuantity || 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="border-t border-sand-neutral/40 pt-4 space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-secondary">Base Meal Price</span>
                      <span className="font-mono font-bold text-onyx-black">₹{basePrice}</span>
                    </div>
                    {customTotal > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-secondary">Optional Items</span>
                        <span className="font-mono text-secondary">+₹{customTotal}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-secondary">Delivery Fee</span>
                      <span className="font-mono text-secondary">₹{deliveryFee}</span>
                    </div>
                    <div className="border-t border-sand-neutral/40 pt-2 flex justify-between items-baseline">
                      <span className="font-label-caps text-xs font-bold uppercase text-on-surface">Customer Pays</span>
                      <span className="font-headline-md text-2xl font-bold text-on-surface">₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={handleSaveMeal}
                    disabled={isSaving || mealItems.length === 0}
                    className="w-full py-3.5 bg-onyx-black text-bone-white rounded-xl font-button-text text-xs font-bold tracking-widest uppercase hover:bg-stone-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">{isSaving ? 'hourglass_empty' : 'publish'}</span>
                    {isSaving ? 'Saving...' : 'Save & Publish Configuration'}
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchItems(selectedTiffinId)}
                    className="w-full py-2.5 bg-surface-container text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Reset to Saved
                  </button>
                </div>

                {/* Help Card */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-sand-neutral/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-clay-earth">info</span>
                    <span className="font-label-caps text-xs font-bold uppercase text-on-surface">How it works</span>
                  </div>
                  <ul className="space-y-1.5 font-body-md text-xs text-secondary">
                    <li>• <strong className="text-on-surface">✓ Check</strong> items to include in this tiffin</li>
                    <li>• Mark as <strong className="text-on-surface">★ Default</strong> to auto-include in customer's order</li>
                    <li>• Leave as <strong className="text-on-surface">☆ Optional</strong> for customers to add/remove</li>
                    <li>• Use <strong className="text-on-surface">− +</strong> to set default portion sizes</li>
                    <li>• Customers can customize within min/max limits</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
