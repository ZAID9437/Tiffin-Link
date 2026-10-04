import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../services/api';

export default function TiffinCustomizer({
  tiffin,
  provider,
  onBack,
  onCheckout,
  currentUser,
  onOpenLogin
}) {
  const [dbItems, setDbItems] = useState([]);
  const [dbProvider, setDbProvider] = useState(provider || null);
  const [dbTiffin, setDbTiffin] = useState(tiffin || null);
  const [loading, setLoading] = useState(true);

  // Map of itemId -> selected quantity
  const [quantities, setQuantities] = useState({});
  const [instructions, setInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser?.address || 'Satellite, Ahmedabad'
  );

  // Order submission & status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const targetTiffinId = tiffin?._id || tiffin?.id;
  const targetProviderId = provider?._id || provider?.id || tiffin?.providerId;

  // 1. Fetch live Tiffin, Provider & Tiffin Items from MongoDB
  const fetchCustomizerData = useCallback(async () => {
    try {
      setLoading(true);
      setOrderError('');

      // Fetch Provider
      if (targetProviderId) {
        try {
          const pRes = await apiRequest(`/providers/${targetProviderId}`);
          if (pRes?.success && pRes.data) {
            setDbProvider(pRes.data);
          }
        } catch (e) {
          console.warn('Could not fetch provider from DB:', e);
        }
      }

      // Fetch Tiffin
      if (targetTiffinId) {
        try {
          const tRes = await apiRequest(`/tiffins/${targetTiffinId}`);
          if (tRes?.success && tRes.data) {
            setDbTiffin(tRes.data);
          }
        } catch (e) {
          console.warn('Could not fetch tiffin from DB:', e);
        }

        // Fetch Items for this exact Tiffin
        try {
          const itemsRes = await apiRequest(`/tiffin-items?tiffinId=${targetTiffinId}`);
          if (itemsRes?.success && Array.isArray(itemsRes.data)) {
            const fetched = itemsRes.data.map(i => ({ ...i, id: i._id || i.id }));
            setDbItems(fetched);

            // Check if restored from pending checkout session
            const pendingCustom = localStorage.getItem('tiffinlink_pending_customization');
            let restoredQty = null;
            if (pendingCustom) {
              try {
                const parsed = JSON.parse(pendingCustom);
                if (parsed.tiffinId === targetTiffinId && parsed.quantities) {
                  restoredQty = parsed.quantities;
                }
              } catch (e) {}
            }

            if (restoredQty) {
              setQuantities(restoredQty);
            } else {
              // Initialize default quantities from DB definition
              const initialQ = {};
              fetched.forEach(item => {
                const isAvail = item.isAvailable !== false && (item.availableQuantity === undefined || item.availableQuantity > 0);
                if (item.isDefault && isAvail) {
                  initialQ[item.id] = item.defaultQuantity || 1;
                } else {
                  initialQ[item.id] = 0;
                }
              });
              setQuantities(initialQ);
            }
          }
        } catch (e) {
          console.warn('Could not fetch tiffin items from DB:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching customizer data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetTiffinId, targetProviderId]);

  useEffect(() => {
    fetchCustomizerData();
  }, [fetchCustomizerData]);

  // Group items by category dynamically (no hardcoded category names!)
  const categories = useMemo(() => {
    const map = new Map();
    dbItems.forEach(item => {
      const cat = (item.category || 'General').trim();
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat).push(item);
    });

    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      items: items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    }));
  }, [dbItems]);

  // Handle Stepper Increment / Decrement
  const handleQuantityChange = (item, delta) => {
    const current = quantities[item.id] || 0;
    const next = current + delta;
    const min = item.minQuantity !== undefined ? item.minQuantity : 0;
    const max = item.maxQuantity !== undefined ? item.maxQuantity : (item.availableQuantity || 10);
    const stock = item.availableQuantity !== undefined ? item.availableQuantity : 99;

    if (next < min) return;
    if (next > stock) {
      alert(`Only ${stock} portions of ${item.name} available in today's kitchen run.`);
      return;
    }
    if (next > max) {
      alert(`Maximum ${max} portions allowed for ${item.name}.`);
      return;
    }

    setQuantities(prev => ({
      ...prev,
      [item.id]: next
    }));
  };

  // Distance & Delivery Fee Calculation
  const distanceKm = useMemo(() => {
    const p = dbProvider || provider;
    if (p?.distanceKm) return Number(p.distanceKm);
    return 1.8;
  }, [dbProvider, provider]);

  // delivery fee formula: ₹25 base + ₹8/km
  const deliveryFee = useMemo(() => {
    return Math.max(25, Math.round(25 + distanceKm * 8));
  }, [distanceKm]);

  // Financial Calculations
  const baseTiffinPrice = Number(dbTiffin?.price !== undefined ? dbTiffin.price : (tiffin?.price || 140));

  const { itemsExtraTotal, totalCustomizedCount, activeReceiptItems } = useMemo(() => {
    let extra = 0;
    let count = 0;
    const receipt = [];

    dbItems.forEach(item => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        const unitP = Number(item.price !== undefined ? item.price : (item.unitPrice || 0));
        const lineTotal = unitP * qty;
        extra += lineTotal;
        count += qty;
        receipt.push({
          id: item.id,
          name: item.name,
          unitPrice: unitP,
          qty,
          lineTotal
        });
      }
    });

    return {
      itemsExtraTotal: extra,
      totalCustomizedCount: count,
      activeReceiptItems: receipt
    };
  }, [dbItems, quantities]);

  const grandTotal = baseTiffinPrice + itemsExtraTotal + deliveryFee;

  // Handle Checkout / Confirmation
  const handleProceedToCheckout = async () => {
    setOrderError('');

    // If not authenticated, save selection and open login
    if (!currentUser) {
      const pendingData = {
        providerId: targetProviderId,
        tiffinId: targetTiffinId,
        quantities,
        instructions,
        deliveryAddress
      };
      localStorage.setItem('tiffinlink_pending_customization', JSON.stringify(pendingData));

      if (typeof onOpenLogin === 'function') {
        onOpenLogin('login');
      } else {
        setShowLoginPrompt(true);
      }
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload matching backend expectation
      const selectedItemsList = activeReceiptItems.map(r => ({
        itemId: r.id,
        name: r.name,
        quantity: r.qty,
        unitPrice: r.unitPrice
      }));

      const payload = {
        providerId: targetProviderId,
        tiffinId: targetTiffinId,
        tiffinName: dbTiffin?.name || tiffin?.name || 'Special Tiffin',
        tiffinCategory: dbTiffin?.category || tiffin?.category || 'Gujarati Traditional',
        tiffinImage: dbTiffin?.image || tiffin?.image || '/assets/provider_1.png',
        quantity: 1,
        unitPrice: baseTiffinPrice,
        customerName: currentUser.name || currentUser.fullName || 'Customer',
        customerEmail: currentUser.email || '',
        customerPhone: currentUser.phone || currentUser.mobile || '+91 98765 43210',
        customerAddress: deliveryAddress,
        deliveryCoordinates: { lat: 23.0300, lng: 72.5178 },
        items: selectedItemsList,
        instructions: instructions,
        paymentMethod: 'Online Payment'
      };

      const res = await apiRequest('/orders/customer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success && res.data) {
        setConfirmedOrder(res.data);
        setOrderConfirmed(true);
        localStorage.removeItem('tiffinlink_pending_customization');

        // Notify parent / app
        if (typeof onCheckout === 'function') {
          onCheckout(res.data);
        }
      } else {
        setOrderError(res?.message || 'Could not confirm order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setOrderError(err.message || 'Network error while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProviderName = dbProvider?.name || provider?.name || 'Mansuri Kitchen';
  const activeTiffinName = dbTiffin?.name || tiffin?.name || 'Gujarati Special Tiffin';
  const activeTiffinDesc = dbTiffin?.description || tiffin?.description || 'Traditional home-style meal prepared fresh in pure cold-pressed oil with zero industrial preservatives.';
  const activeTiffinImg = dbTiffin?.image || tiffin?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMu_TVgTec0S1wQHIMMwrELkw3t1LX664GkNNa9BT258VzR9SyXuP-XB5KYIGq_KZVXp1A5qIcS4ooyOIfdEsA87ygeKHaE6foMiv-C3yyM21VcGBWEnvu8WvL-RQFZZCXkE0OTNxmoEQF_tdo0sj5L0-0wTY238PdytDxl_KerGP8fiigXMye8nczTLWNQYaTsD1-Ud3QDfxvSghCcVy1TIzjU_6sLPwbEMb1Ras9rHO-tsMIYxzw';
  const availableSlots = dbTiffin?.available !== undefined ? dbTiffin.available : 14;

  if (orderConfirmed && confirmedOrder) {
    return (
      <div className="w-full bg-[#fbf9f5] min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-20">
        <div className="max-w-2xl mx-auto bg-white border border-[#ded9d1] p-8 sm:p-12 shadow-md">
          <div className="flex items-center gap-3 text-[#1b5e20] mb-4">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
            <span className="font-label-caps text-xs uppercase tracking-widest font-bold">Kitchen Allocation Confirmed</span>
          </div>

          <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-4xl text-[#1a1a1a] mb-2 leading-tight">
            Order #{confirmedOrder.orderId || 'TL-CONFIRMED'}
          </h1>
          <p className="text-sm text-[#665d52] mb-8">
            Your custom tiffin is locked into today's kitchen run at <strong className="text-[#1a1a1a]">{activeProviderName}</strong>.
          </p>

          {/* Receipt Breakdown */}
          <div className="bg-[#f5f3ef] p-6 space-y-3 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-[#665d52]">Tiffin:</span>
              <strong className="text-[#1a1a1a]">{confirmedOrder.tiffinName || activeTiffinName}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#665d52]">Base Price:</span>
              <span className="text-[#1a1a1a]">₹{(confirmedOrder.unitPrice || baseTiffinPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#665d52]">Customized Items:</span>
              <span className="text-[#1a1a1a]">₹{(confirmedOrder.itemsAmount || itemsExtraTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#665d52]">Delivery Corridor ({distanceKm} km):</span>
              <span className="text-[#1a1a1a]">₹{(confirmedOrder.deliveryFee || deliveryFee).toFixed(2)}</span>
            </div>
            <div className="border-t border-[#ded9d1] pt-3 flex justify-between font-bold text-base">
              <span>Total Paid:</span>
              <span>₹{(confirmedOrder.totalAmount || grandTotal).toFixed(2)}</span>
            </div>
          </div>

          {/* Dispatch Notice */}
          <div className="bg-[#f5f3ef]/60 p-4 border-l-2 border-[#1a1a1a] mb-8 text-xs text-[#665d52] space-y-1">
            <p className="font-semibold text-[#1a1a1a] uppercase font-label-caps tracking-wider">Estimated Dispatch Window</p>
            <p>12:30 PM – 01:15 PM • Hand-delivered in 304 food-grade stainless steel dabba.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                window.location.hash = '#my-orders';
              }}
              className="flex-1 bg-[#1a1a1a] text-[#f5f3ef] py-3.5 px-6 font-button-text text-xs uppercase tracking-wider font-semibold hover:bg-[#4a4238] transition-colors text-center"
            >
              Track In My Orders →
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-[#f5f3ef] text-[#1a1a1a] py-3.5 px-6 font-button-text text-xs uppercase tracking-wider font-semibold hover:bg-[#ded9d1] transition-colors text-center border border-[#ded9d1]"
            >
              Back to Kitchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* Top Navigation Corridor */}
      <div className="w-full bg-[#f5f3ef] py-4 px-4 sm:px-6 lg:px-20 border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 font-label-caps text-xs text-[#665d52] hover:text-[#1a1a1a] tracking-widest uppercase transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to {activeProviderName}
          </button>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ded9d1]/50 text-[#665d52] font-label-caps text-[11px] uppercase">
              <span className={`w-1.5 h-1.5 rounded-full ${availableSlots > 0 ? 'bg-[#1b5e20]' : 'bg-[#ba1a1a]'} animate-pulse`}></span>
              {availableSlots > 0 ? `${availableSlots} Lunch Slots Remaining` : 'Sold Out for Today'}
            </span>
            <span className="font-label-caps text-[11px] text-[#665d52] hidden sm:inline uppercase">
              Batch: 12:30 PM Run
            </span>
          </div>
        </div>
      </div>

      {/* Hero Header Block (Architectural Editorial Offset) */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-20 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest">
                Culinary Atelier // {activeProviderName}
              </span>
              <span className="w-4 h-[1px] bg-[#ded9d1]"></span>
              <span className="font-label-caps text-xs text-[#4a4238] font-medium uppercase">
                Satellite West Corridor
              </span>
            </div>
            <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl sm:text-5xl lg:text-6xl text-[#1a1a1a] tracking-tight leading-none">
              {activeTiffinName}
            </h1>
            <p className="font-body-lg text-sm sm:text-base text-[#665d52] max-w-2xl mt-1 leading-relaxed">
              {activeTiffinDesc}
            </p>
          </div>

          <div className="lg:col-span-4 relative -mt-4 lg:mt-0">
            <div className="relative w-full h-48 bg-[#f5f3ef] overflow-hidden shadow-sm border border-[#ded9d1]">
              <img
                className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                src={activeTiffinImg}
                alt={activeTiffinName}
              />
              <div className="absolute bottom-0 inset-x-0 bg-[#1a1a1a]/85 text-[#fbf9f5] px-4 py-1.5 flex items-center justify-between text-[11px] font-label-caps uppercase">
                <span>Vessel: 3-Tier Steel Canister</span>
                <span className="text-[#ded9d1]">Zero-Waste Loop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workstation Layout (65% / 35%) */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: Dynamic Category Engine (65%) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
            <div className="flex items-baseline justify-between bg-[#f5f3ef] px-6 py-4 border border-[#ded9d1]">
              <div>
                <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl text-[#1a1a1a]">
                  Select Your Meal Composition
                </h2>
                <p className="font-label-caps text-xs text-[#665d52] uppercase tracking-wider mt-0.5">
                  Live inventory synchronized from morning kitchen run
                </p>
              </div>
              <span className="font-label-caps text-xs text-[#1a1a1a] bg-[#ded9d1]/60 px-2 py-1 uppercase">
                Stage 01 / Build
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-3 bg-white border border-[#ded9d1]">
                <div className="w-8 h-8 border-3 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="font-label-caps text-xs uppercase text-[#665d52]">Loading authentic tiffin items...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center bg-white border border-[#ded9d1] space-y-2">
                <p className="text-[#1a1a1a] font-medium">Standard Tiffin Tray</p>
                <p className="text-xs text-[#665d52]">All seasonal preparations are included in standard batch allocation.</p>
              </div>
            ) : (
              categories.map((category, catIdx) => (
                <div key={category.name} className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#ded9d1]">
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] italic">
                        {String(catIdx + 1).padStart(2, '0')}.
                      </span>
                      <h3 className="font-label-caps text-xs sm:text-sm text-[#1a1a1a] tracking-widest uppercase font-bold">
                        {category.name}
                      </h3>
                    </div>
                    <span className="font-label-caps text-[11px] text-[#665d52] uppercase">
                      {category.items.length} Options Available
                    </span>
                  </div>

                  <div className="space-y-2">
                    {category.items.map(item => {
                      const qty = quantities[item.id] || 0;
                      const unitPrice = Number(item.price !== undefined ? item.price : (item.unitPrice || 0));
                      const isOutOfStock = item.isAvailable === false || (item.availableQuantity !== undefined && item.availableQuantity <= 0);
                      const maxCap = item.availableQuantity !== undefined ? item.availableQuantity : 10;
                      const lineTotal = qty * unitPrice;

                      return (
                        <div
                          key={item.id}
                          className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border ${
                            isOutOfStock 
                              ? 'bg-[#ded9d1]/20 border-[#ded9d1]/50 opacity-60' 
                              : 'bg-white border-[#ded9d1] hover:border-[#1a1a1a]/60'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2.5">
                              <span className={`font-body-lg text-base sm:text-lg font-medium ${isOutOfStock ? 'line-through text-[#665d52]' : 'text-[#1a1a1a]'}`}>
                                {item.name}
                              </span>
                              <span className="font-label-caps text-xs text-[#4a4238]">
                                ₹{unitPrice} / {item.unit || 'portion'}
                              </span>
                            </div>

                            {item.description && (
                              <p className="font-body-md text-xs sm:text-sm text-[#665d52] mt-0.5">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              {isOutOfStock ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                                  <span className="font-label-caps text-[11px] text-[#ba1a1a] font-bold uppercase">
                                    0 Left — Depleted for Today
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]"></span>
                                  <span className="font-label-caps text-[11px] text-[#665d52]">
                                    {maxCap} left in daily run
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Stepper & Line Price */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ded9d1]/50">
                            <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1]">
                              <button
                                type="button"
                                disabled={isOutOfStock || qty <= (item.minQuantity || 0)}
                                onClick={() => handleQuantityChange(item, -1)}
                                className="w-9 h-9 flex items-center justify-center text-[#1a1a1a] hover:bg-[#ded9d1] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                              </button>
                              <span className="w-10 text-center font-button-text text-sm text-[#1a1a1a] font-semibold">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={isOutOfStock || qty >= maxCap}
                                onClick={() => handleQuantityChange(item, 1)}
                                className="w-9 h-9 flex items-center justify-center text-[#1a1a1a] hover:bg-[#ded9d1] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>

                            <span className="font-button-text text-sm sm:text-base text-[#1a1a1a] w-16 text-right font-medium">
                              {isOutOfStock ? '—' : `₹${lineTotal}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Special Instructions & Note */}
            <div className="bg-white p-6 border border-[#ded9d1] space-y-3">
              <label className="font-label-caps text-xs uppercase text-[#1a1a1a] block font-bold">
                Special Dietary Instructions for Kitchen
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Less spicy, mild tempering, no green chillies..."
                className="w-full bg-[#f5f3ef] px-4 py-3 text-sm text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
              />
              <p className="text-[11px] text-[#665d52]">
                Our atelier chef will honor specific salt, spice, and jain tempering requests.
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Order Summary Ledger (35%) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 space-y-6">
              
              <div className="bg-white p-6 sm:p-7 shadow-sm border border-[#ded9d1]">
                <div className="pb-4 border-b border-[#ded9d1]">
                  <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block font-semibold">
                    Ledger Specification
                  </span>
                  <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] mt-1 font-medium">
                    Order Summary
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#665d52]">
                    <span className="font-medium text-[#1a1a1a]">{activeProviderName}</span>
                    <span>•</span>
                    <span className="font-label-caps text-[#4a4238] uppercase">Satellite ({distanceKm} km)</span>
                  </div>
                </div>

                {/* Base Allocation Tag */}
                <div className="py-3 px-3.5 bg-[#f5f3ef] flex items-center justify-between my-4 border border-[#ded9d1]/60">
                  <div>
                    <span className="text-xs font-semibold text-[#1a1a1a] block">{activeTiffinName}</span>
                    <span className="font-label-caps text-[10px] text-[#665d52] uppercase">Standard Meal Run</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a1a]">₹{baseTiffinPrice.toFixed(2)}</span>
                </div>

                {/* Line Items Breakdown */}
                <div className="space-y-3 text-sm text-[#665d52] py-3 border-b border-[#ded9d1]">
                  <div className="flex items-center justify-between">
                    <span>Tiffin Base Allocation</span>
                    <span className="text-[#1a1a1a] font-medium">₹{baseTiffinPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#1a1a1a]">Selected Items Extra</span>
                      <span className="block font-label-caps text-[11px] text-[#665d52]">
                        {totalCustomizedCount} items customized
                      </span>
                    </div>
                    <span className="text-[#1a1a1a] font-medium">₹{itemsExtraTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[#1a1a1a]">Delivery Corridor Fee</span>
                      <span className="block font-label-caps text-[11px] text-[#665d52]">
                        {distanceKm} km corridor (₹25 base + ₹8/km)
                      </span>
                    </div>
                    <span className="text-[#1a1a1a] font-medium">₹{deliveryFee.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span>Circular Canister Deposit</span>
                      <span className="block font-label-caps text-[10px] text-[#4a4238] uppercase">Zero-waste return loop</span>
                    </div>
                    <span className="font-label-caps text-xs text-[#1b5e20] font-bold">₹0.00 FREE</span>
                  </div>
                </div>

                {/* Itemized Tray Breakdown Tray */}
                <div className="my-4 p-3.5 bg-[#f5f3ef] space-y-1.5 text-xs text-[#665d52]">
                  <div className="font-label-caps text-[11px] text-[#1a1a1a] uppercase font-bold mb-1">
                    Active Tray Configuration:
                  </div>
                  {activeReceiptItems.length === 0 ? (
                    <p className="italic text-[11px]">No extra items selected (Base thali included)</p>
                  ) : (
                    activeReceiptItems.map(item => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.name} (x{item.qty})</span>
                        <span className="font-mono text-[#1a1a1a]">₹{item.lineTotal}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Delivery Address Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-label-caps text-[11px] uppercase text-[#665d52] font-semibold">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your flat/office address in Ahmedabad"
                    className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none"
                  />
                </div>

                {/* Grand Total */}
                <div className="pt-5 mt-4 border-t border-[#ded9d1]">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block font-bold">
                        Total Payable
                      </span>
                      <span className="font-label-caps text-[11px] text-[#665d52]">
                        Calculated dynamically from DB prices
                      </span>
                    </div>
                    <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl font-semibold text-[#1a1a1a]">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {orderError && (
                  <div className="mt-3 p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium border border-[#ba1a1a]/30">
                    {orderError}
                  </div>
                )}

                {/* Action Trigger */}
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting || availableSlots <= 0}
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 bg-[#1a1a1a] hover:bg-[#4a4238] disabled:bg-[#ded9d1] text-[#fbf9f5] font-button-text text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Validating Kitchen Slot...</span>
                    ) : (
                      <>
                        <span>Quick Checkout</span>
                        <span className="h-3 w-[1px] bg-white/30"></span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || availableSlots <= 0}
                    onClick={handleProceedToCheckout}
                    className="w-full py-3 bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-center border border-[#ded9d1]"
                  >
                    Save To Daily Tray
                  </button>
                </div>

                <div className="mt-4 flex items-start gap-2 text-[#665d52] text-xs leading-relaxed">
                  <span className="material-symbols-outlined text-[16px] text-[#4a4238] shrink-0 mt-0.5">lock_clock</span>
                  <p>
                    Kitchen slot reservation locks upon confirmation. Arrival window: <strong>12:45 PM – 1:15 PM</strong>.
                  </p>
                </div>
              </div>

              {/* Escrow Quality Lock Note */}
              <div className="bg-[#f5f3ef] p-5 border border-[#ded9d1]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#4a4238] text-[24px]">verified_user</span>
                  <div>
                    <span className="font-label-caps text-xs text-[#1a1a1a] uppercase tracking-wider block font-bold">
                      Escrow Quality Lock
                    </span>
                    <p className="font-body-md text-xs text-[#665d52] mt-0.5">
                      Payment is held securely until canister temperature and hygiene seal are verified upon delivery.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Fallback Login Prompt Modal */}
      {showLoginPrompt && !currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl relative border border-[#ded9d1]">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 text-[#665d52] hover:text-[#1a1a1a]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <span className="font-label-caps text-xs text-[#4a4238] uppercase tracking-wider block font-bold mb-1">
              Authentication Required
            </span>
            <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] mb-3">
              Sign In to Lock Kitchen Slot
            </h3>
            <p className="text-xs text-[#665d52] mb-6 leading-relaxed">
              Your customized tray has been saved. Please sign in or create an account to process payment and confirm dispatch.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  if (typeof onOpenLogin === 'function') {
                    onOpenLogin('login');
                  }
                }}
                className="w-full py-3 bg-[#1a1a1a] text-white font-button-text text-xs uppercase tracking-wider font-bold"
              >
                Log In to Your Account
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  if (typeof onOpenLogin === 'function') {
                    onOpenLogin('signup');
                  }
                }}
                className="w-full py-3 bg-[#f5f3ef] text-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-bold border border-[#ded9d1]"
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
