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

/**
 * TiffinCustomizer
 * Customer-facing page that lets users see and customize a specific tiffin
 * from a specific provider.
 *
 * Props:
 *   tiffin: { id, name, category, foodType, description, image, price, ... }
 *   provider: { id, name, rating, ... }
 *   onBack: () => void
 *   onCheckout: (orderPayload) => void
 *   currentUser: user object or null
 *   onOpenLogin: () => void
 */
export default function TiffinCustomizer({
  tiffin,
  provider,
  onBack,
  onCheckout,
  currentUser,
  onOpenLogin
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});  // { [itemId]: qty }
  const [selected, setSelected] = useState({});       // { [itemId]: boolean }
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryFee = 30;
  const taxRate = 0.05;

  const fetchItems = useCallback(async () => {
    if (!tiffin?.id && !tiffin?._id) return;
    const tiffinId = tiffin.id || tiffin._id;
    try {
      setLoading(true);
      const json = await apiRequest(`/tiffin-items?tiffinId=${tiffinId}`);
      if (json.success && Array.isArray(json.data)) {
        const availableItems = json.data
          .filter(i => i.isAvailable !== false)
          .map(i => ({ ...i, id: i._id || i.id }));

        setItems(availableItems);

        // Initialize quantities and selection from defaults
        const initQty = {};
        const initSel = {};
        availableItems.forEach(item => {
          initQty[item.id] = item.defaultQuantity || 1;
          initSel[item.id] = item.isDefault !== false;
        });
        setQuantities(initQty);
        setSelected(initSel);
      }
    } catch (err) {
      console.error('Error fetching tiffin items:', err);
    } finally {
      setLoading(false);
    }
  }, [tiffin]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const adjustQty = (itemId, delta) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const minQ = item.minQuantity ?? 0;
    const maxQ = item.maxQuantity ?? 20;
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(minQ, Math.min(maxQ, (prev[itemId] || 0) + delta))
    }));
  };

  const toggleItem = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.isCustomizable === false) return;
    setSelected(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Price calculation
  const selectedItems = items.filter(i => selected[i.id]);
  const defaultItems = items.filter(i => i.isDefault !== false && selected[i.id]);

  const foodSubtotal = selectedItems.reduce((sum, item) => {
    const qty = quantities[item.id] || item.defaultQuantity || 1;
    return sum + (item.unitPrice || 0) * qty;
  }, 0);

  const tax = Math.round(foodSubtotal * taxRate);
  const grandTotal = foodSubtotal + deliveryFee + tax;

  const itemsByCategory = FOOD_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  const categoriesWithItems = FOOD_CATEGORIES.filter(cat => (itemsByCategory[cat] || []).length > 0);

  const handleCheckout = async () => {
    if (!currentUser) {
      if (onOpenLogin) onOpenLogin();
      return;
    }
    if (selectedItems.length === 0) return;

    setIsProcessing(true);

    // Build order snapshot (prices frozen at checkout time)
    const orderItemsSnapshot = selectedItems.map(item => ({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      quantity: quantities[item.id] || item.defaultQuantity || 1,
      unitPrice: item.unitPrice || 0,
      totalPrice: (item.unitPrice || 0) * (quantities[item.id] || item.defaultQuantity || 1)
    }));

    const orderPayload = {
      providerId: provider?.id || provider?._id,
      providerName: provider?.name,
      tiffinId: tiffin?.id || tiffin?._id,
      tiffinName: tiffin?.name,
      orderItems: orderItemsSnapshot,
      foodSubtotal,
      deliveryFee,
      tax,
      finalTotal: grandTotal,
      specialInstructions,
      paymentMethod
    };

    if (onCheckout) {
      onCheckout(orderPayload);
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span>
          <p className="font-body-md text-secondary">Loading tiffin details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 pt-8 pb-2">
        <nav className="flex items-center gap-2 font-label-caps text-[11px] uppercase tracking-widest text-secondary">
          <button onClick={onBack} className="hover:text-onyx-black transition-colors cursor-pointer">Providers</button>
          <span>/</span>
          <button onClick={onBack} className="hover:text-onyx-black transition-colors cursor-pointer">{provider?.name || 'Provider'}</button>
          <span>/</span>
          <span className="text-onyx-black font-bold">{tiffin?.name}</span>
        </nav>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT COLUMN: Item Customizer */}
          <section className="lg:col-span-7 space-y-6">

            {/* Provider + Tiffin Header */}
            <div className="bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-sm">
              {tiffin?.image && (
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-sand-neutral/40">
                  <img src={tiffin.image} alt={tiffin.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-label-caps text-[10px] uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {tiffin?.foodType || 'Veg'}
                  </span>
                  <span className="font-label-caps text-[10px] uppercase text-secondary">{tiffin?.category}</span>
                </div>
                <h1 className="font-headline-lg text-2xl lg:text-3xl text-onyx-black leading-tight">{tiffin?.name}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="font-button-text text-sm font-semibold text-on-surface">{provider?.name}</span>
                  {provider?.rating && (
                    <div className="flex items-center gap-1 text-clay-earth">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-label-caps text-[11px] font-bold">{provider.rating}</span>
                    </div>
                  )}
                </div>
                {tiffin?.description && (
                  <p className="font-body-md text-xs text-secondary mt-1.5 leading-relaxed">{tiffin.description}</p>
                )}
              </div>
              <div className="bg-bone-white rounded-xl p-4 text-center flex-shrink-0 border border-sand-neutral/40 min-w-[110px]">
                <div className="font-label-caps text-[10px] uppercase text-secondary">Starting</div>
                <div className="font-headline-md text-2xl text-onyx-black font-bold">₹{tiffin?.price || foodSubtotal}</div>
                <div className="font-label-caps text-[9px] text-secondary">Base price</div>
              </div>
            </div>

            {/* No Items State */}
            {items.length === 0 ? (
              <div className="p-10 rounded-2xl bg-surface-container-lowest border border-dashed border-sand-neutral text-center space-y-3">
                <span className="material-symbols-outlined text-[48px] text-secondary">restaurant_menu</span>
                <h3 className="font-headline-md text-xl text-on-surface">Menu not configured yet</h3>
                <p className="text-sm text-secondary">This provider is still setting up their tiffin menu. Check back soon!</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="font-headline-md text-xl text-on-surface">Customize Your Tiffin</h2>
                  <p className="font-body-md text-xs text-secondary">
                    Checked items are included. Toggle optional items, adjust quantities within allowed limits.
                  </p>
                </div>

                {/* Category Sections */}
                {categoriesWithItems.map(category => {
                  const categoryItems = itemsByCategory[category];
                  const hasSelected = categoryItems.some(i => selected[i.id]);

                  return (
                    <div key={category} className="bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 shadow-sm overflow-hidden">
                      {/* Category Header */}
                      <div className={`px-6 py-4 flex items-center justify-between border-b border-sand-neutral/30 ${hasSelected ? 'bg-bone-white' : ''}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[20px] text-clay-earth">
                            {CATEGORY_ICONS[category] || 'restaurant'}
                          </span>
                          <h3 className="font-headline-md text-lg text-on-surface">{category}</h3>
                        </div>
                        <span className="font-label-caps text-[10px] uppercase text-secondary">
                          {categoryItems.length} option{categoryItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-sand-neutral/20">
                        {categoryItems.map(item => {
                          const isSelected = selected[item.id] || false;
                          const qty = quantities[item.id] || item.defaultQuantity || 1;
                          const itemTotal = (item.unitPrice || 0) * qty;
                          const isCustomizable = item.isCustomizable !== false;
                          const isDefault = item.isDefault !== false;
                          const minQ = item.minQuantity ?? 0;
                          const maxQ = item.maxQuantity ?? 20;

                          return (
                            <div
                              key={item.id}
                              className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                                isSelected ? 'bg-surface-container-lowest' : 'bg-bone-white/30 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                {/* Toggle checkbox */}
                                <button
                                  type="button"
                                  onClick={() => toggleItem(item.id)}
                                  disabled={!isCustomizable || isDefault}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                    isSelected
                                      ? 'bg-onyx-black border-onyx-black'
                                      : 'border-sand-neutral bg-surface-container-lowest'
                                  } ${isDefault ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                  title={isDefault ? 'This item is included in base tiffin' : isCustomizable ? 'Toggle item' : 'Not customizable'}
                                >
                                  {isSelected && (
                                    <span className="material-symbols-outlined text-bone-white text-[13px]">check</span>
                                  )}
                                </button>

                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-button-text text-sm font-semibold text-on-surface">{item.name}</span>
                                    {isDefault && (
                                      <span className="font-label-caps text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase">Included</span>
                                    )}
                                    {!isCustomizable && (
                                      <span className="font-label-caps text-[9px] bg-surface-container text-secondary px-1.5 py-0.5 rounded-full font-bold uppercase">Fixed</span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="font-body-md text-[11px] text-secondary mt-0.5">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 font-label-caps text-[11px] text-secondary">
                                    <span>₹{item.unitPrice} per {item.unit || 'piece'}</span>
                                    {isSelected && item.unitPrice > 0 && (
                                      <span className="font-bold text-onyx-black">= ₹{itemTotal}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quantity Control */}
                              {isSelected && isCustomizable && (
                                <div className="flex items-center gap-1 bg-surface-container-lowest border border-sand-neutral/50 rounded-xl px-1 py-1 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => adjustQty(item.id, -1)}
                                    disabled={qty <= minQ}
                                    className="w-8 h-8 flex items-center justify-center text-secondary hover:text-onyx-black disabled:opacity-30 transition-colors cursor-pointer rounded-lg hover:bg-surface-container"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">remove</span>
                                  </button>
                                  <span className="font-mono font-bold text-sm text-on-surface w-7 text-center">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => adjustQty(item.id, 1)}
                                    disabled={qty >= maxQ}
                                    className="w-8 h-8 flex items-center justify-center text-secondary hover:text-onyx-black disabled:opacity-30 transition-colors cursor-pointer rounded-lg hover:bg-surface-container"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                  </button>
                                </div>
                              )}
                              {isSelected && !isCustomizable && (
                                <div className="font-mono text-sm font-bold text-onyx-black self-end sm:self-auto">
                                  ₹{itemTotal}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Special Instructions */}
                <div className="bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 p-6 space-y-3 shadow-sm">
                  <h3 className="font-headline-md text-lg text-on-surface">Special Instructions</h3>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Less spicy, no jaggery in dal..."
                    className="w-full bg-bone-white px-4 py-3 rounded-xl text-on-surface font-body-md text-sm focus:outline-none focus:bg-surface-container transition-colors border border-sand-neutral/40"
                  />
                  <p className="font-body-md text-[11px] text-secondary">
                    Notes will be shared with {provider?.name}. Best-effort basis only.
                  </p>
                </div>
              </>
            )}
          </section>

          {/* RIGHT COLUMN: Order Summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div className="bg-surface-container-lowest rounded-2xl border border-sand-neutral/40 shadow-md p-6 space-y-5">
              {/* Summary Header */}
              <div className="space-y-1 pb-3 border-b border-sand-neutral/30">
                <div className="font-label-caps text-[10px] uppercase text-clay-earth tracking-widest">Order Summary</div>
                <h3 className="font-headline-md text-xl text-onyx-black">{provider?.name}</h3>
                <p className="font-body-md text-xs text-secondary">{tiffin?.name}</p>
              </div>

              {/* Selected Items Breakdown */}
              {selectedItems.length === 0 ? (
                <p className="font-body-md text-xs text-secondary text-center py-4">Select items to see your order summary</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {FOOD_CATEGORIES.map(cat => {
                    const catItems = selectedItems.filter(i => i.category === cat);
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="font-label-caps text-[9px] uppercase text-clay-earth font-bold mb-1">{cat}</div>
                        {catItems.map(item => {
                          const qty = quantities[item.id] || item.defaultQuantity || 1;
                          return (
                            <div key={item.id} className="flex justify-between items-center text-xs py-0.5">
                              <span className="text-on-surface">
                                {item.name}
                                <span className="text-secondary ml-1">× {qty}</span>
                              </span>
                              <span className="font-mono font-semibold text-onyx-black">
                                ₹{(item.unitPrice || 0) * qty}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Price Breakdown */}
              {selectedItems.length > 0 && (
                <div className="bg-bone-white rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Food Subtotal</span>
                    <span className="font-mono font-bold text-onyx-black">₹{foodSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">Delivery Fee</span>
                    <span className="font-mono text-on-surface">₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-secondary">GST (5%)</span>
                    <span className="font-mono text-on-surface">₹{tax}</span>
                  </div>
                  <div className="border-t border-sand-neutral/40 pt-2 flex justify-between items-baseline">
                    <span className="font-label-caps text-xs font-bold text-on-surface uppercase">Total Payable</span>
                    <span className="font-headline-md text-2xl font-bold text-onyx-black">₹{grandTotal}</span>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <div className="font-label-caps text-[10px] uppercase text-secondary tracking-widest">Payment Method</div>
                <div className="space-y-2">
                  {[
                    { id: 'upi', label: 'UPI / Online (Recommended)', icon: 'verified_user', desc: 'Secure escrow payment' },
                    { id: 'cod', label: 'Cash on Delivery', icon: 'payments', desc: 'Pay on delivery' }
                  ].map(method => (
                    <label key={method.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      paymentMethod === method.id
                        ? 'bg-onyx-black border-onyx-black text-bone-white'
                        : 'bg-bone-white border-sand-neutral/40 text-on-surface hover:bg-surface-container-low'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)}
                          className="accent-bone-white"
                        />
                        <div>
                          <div className="font-button-text text-xs font-semibold">{method.label}</div>
                          <div className={`text-[10px] ${paymentMethod === method.id ? 'text-bone-white/70' : 'text-secondary'}`}>{method.desc}</div>
                        </div>
                      </div>
                      <span className={`material-symbols-outlined text-[18px] ${paymentMethod === method.id ? 'text-bone-white' : 'text-secondary'}`}>
                        {method.icon}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isProcessing || selectedItems.length === 0}
                className="w-full py-4 bg-onyx-black text-bone-white rounded-xl font-button-text text-sm font-bold tracking-widest uppercase hover:bg-stone-800 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Login to Order</span>
                  </>
                ) : selectedItems.length === 0 ? (
                  <span>Select Items First</span>
                ) : (
                  <>
                    <span>Continue to Checkout</span>
                    <span className="font-bold opacity-80">• ₹{grandTotal}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Trust Badge */}
              <div className="flex items-start gap-2.5 p-3 bg-bone-white rounded-xl border border-sand-neutral/40">
                <span className="material-symbols-outlined text-[18px] text-clay-earth flex-shrink-0 mt-0.5">shield</span>
                <p className="font-body-md text-[11px] text-secondary leading-relaxed">
                  <strong className="text-on-surface">TiffinLink Guarantee:</strong> Payment held in escrow until delivery confirmed. Full refund on issues.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
