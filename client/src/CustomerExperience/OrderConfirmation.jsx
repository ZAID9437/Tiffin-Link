import React, { useState, useCallback } from 'react';
import { apiRequest } from '../services/api';

/**
 * OrderConfirmation — Checkout Review Screen
 *
 * Props:
 *  checkoutData  — pre-built payload from TiffinCustomizer (items, pricing, provider/tiffin info)
 *  currentUser   — authenticated user object
 *  onBack        — go back to customizer
 *  onOrderPlaced — called with confirmed order data after successful submission
 */
export default function OrderConfirmation({
  checkoutData,
  currentUser,
  onBack,
  onOrderPlaced
}) {
  const {
    providerId,
    tiffinId,
    tiffinName,
    tiffinCategory,
    tiffinImage,
    tiffinDesc,
    providerName,
    activeReceiptItems = [],
    mealSubtotal = 0,
    deliveryFee = 0,
    distanceKm = 0,
    finalTotal = 0,
    instructions: initialInstructions = '',
    deliveryAddress: initialAddress = '',
    deliveryCoordinates,
    dbTiffin
  } = checkoutData || {};

  // Recipient info — pre-filled from authenticated user
  const [recipientName, setRecipientName] = useState(
    currentUser?.name || currentUser?.fullName || currentUser?.username || ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    currentUser?.phone || currentUser?.mobile || ''
  );
  const [recipientEmail, setRecipientEmail] = useState(
    currentUser?.email || ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(initialAddress);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [paymentMethod, setPaymentMethod] = useState('Online Payment');
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // GST shown upfront for transparency (server recalculates authoritatively)
  const gstAmount = Math.round(mealSubtotal * 0.05);
  const totalWithGst = mealSubtotal + deliveryFee + gstAmount;

  const handleConfirmOrder = useCallback(async () => {
    setOrderError('');

    if (!deliveryAddress || !deliveryAddress.trim()) {
      setOrderError('Please enter your delivery address before confirming.');
      return;
    }
    if (!recipientName || !recipientName.trim()) {
      setOrderError('Please enter your name.');
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedItemsList = activeReceiptItems.map(r => ({
        itemId: r.id,
        name: r.name,
        itemName: r.name,
        quantity: r.qty,
        unitPrice: r.unitPrice,
        totalPrice: r.lineTotal
      }));

      const payload = {
        providerId,
        tiffinId,
        tiffinName: dbTiffin?.name || tiffinName || 'Tiffin',
        tiffinCategory: dbTiffin?.category || tiffinCategory || '',
        tiffinImage: dbTiffin?.image || tiffinImage || '',
        quantity: 1,
        unitPrice: 0,
        mealSubtotal,
        deliveryDistance: `${distanceKm} km`,
        deliveryFee,
        finalTotal,
        customerName: recipientName.trim(),
        customerEmail: recipientEmail.trim(),
        customerPhone: recipientPhone.trim(),
        customerAddress: deliveryAddress.trim(),
        deliveryCoordinates: deliveryCoordinates || null,
        items: selectedItemsList,
        selectedItems: selectedItemsList,
        instructions: instructions.trim(),
        paymentMethod
      };

      const res = await apiRequest('/orders/customer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success && res.data) {
        localStorage.removeItem('tiffinlink_pending_customization');
        if (typeof onOrderPlaced === 'function') {
          onOrderPlaced(res.data);
        }
      } else {
        setOrderError(res?.message || 'Could not confirm order. Please try again.');
      }
    } catch (err) {
      console.error('Order placement error:', err);
      setOrderError(err.message || 'Network error while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    providerId, tiffinId, tiffinName, tiffinCategory, tiffinImage,
    mealSubtotal, deliveryFee, finalTotal, distanceKm,
    activeReceiptItems, instructions, deliveryAddress,
    recipientName, recipientEmail, recipientPhone,
    paymentMethod, deliveryCoordinates, dbTiffin, onOrderPlaced
  ]);

  const totalItems = activeReceiptItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fbf9f5] min-h-screen text-[#1b1c1a] pt-20 sm:pt-24">

      {/* ─── Top Navigation Bar ─── */}
      <div className="w-full bg-[#f5f3ef] py-4 px-4 sm:px-6 lg:px-20 border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#4a4238] text-white px-4 py-2 transition-all group cursor-pointer shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span className="font-button-text text-xs uppercase tracking-wider">Back to Customizer</span>
            </button>
            <div className="h-5 w-px bg-[#ded9d1] hidden sm:block" />
            <button
              type="button"
              onClick={() => { window.location.hash = '#find-tiffin'; }}
              className="hidden sm:inline-flex items-center gap-1.5 font-label-caps text-xs text-[#665d52] hover:text-[#1a1a1a] uppercase tracking-wider transition-colors cursor-pointer font-semibold"
            >
              All Kitchens
            </button>
          </div>
          <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest hidden sm:inline">
            Step 2 of 2 — Confirm Order
          </span>
        </div>
      </div>

      {/* ─── Page Header ─── */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-20 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest">Checkout Review</span>
          <span className="w-6 h-[1px] bg-[#ded9d1]" />
          <span className="font-label-caps text-xs text-[#4a4238] font-medium uppercase">{providerName || 'Kitchen Partner'}</span>
        </div>
        <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl sm:text-5xl text-[#1a1a1a] tracking-tight leading-none">
          Review Your Order
        </h1>
        <p className="text-sm text-[#665d52] mt-2 leading-relaxed">
          Verify your tray selection and delivery details before confirming dispatch.
        </p>
      </section>

      {/* ─── Two Column Layout ─── */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* LEFT: Order Items Summary */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

            {/* Tiffin Info Header */}
            <div className="bg-white border border-[#ded9d1] p-5 flex gap-4 items-start">
              {(dbTiffin?.image || tiffinImage) && (
                <div className="w-20 h-20 shrink-0 overflow-hidden border border-[#ded9d1]">
                  <img
                    src={dbTiffin?.image || tiffinImage}
                    alt={dbTiffin?.name || tiffinName}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-label-caps text-[11px] text-[#665d52] uppercase tracking-widest block">{providerName}</span>
                <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] mt-0.5 leading-tight">
                  {dbTiffin?.name || tiffinName}
                </h2>
                {(dbTiffin?.description || tiffinDesc) && (
                  <p className="text-xs text-[#665d52] mt-1 leading-relaxed line-clamp-2">
                    {dbTiffin?.description || tiffinDesc}
                  </p>
                )}
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="bg-white border border-[#ded9d1]">
              <div className="px-5 py-3.5 border-b border-[#ded9d1] flex items-center justify-between">
                <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold tracking-wider">
                  Your Tray Configuration
                </span>
                <span className="font-label-caps text-[11px] text-[#665d52] uppercase">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="divide-y divide-[#ded9d1]/60">
                {activeReceiptItems.map(item => (
                  <div key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#1a1a1a] block">{item.name}</span>
                      <span className="font-label-caps text-[11px] text-[#665d52]">
                        {String.fromCharCode(8377)}{item.unitPrice} &times; {item.qty} portion{item.qty !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="font-button-text text-sm text-[#1a1a1a] font-semibold shrink-0">
                      {String.fromCharCode(8377)}{item.lineTotal}
                    </span>
                  </div>
                ))}
              </div>
              {instructions && (
                <div className="px-5 py-3.5 border-t border-[#ded9d1]/60 bg-[#f5f3ef]/50">
                  <span className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Kitchen Note</span>
                  <p className="text-xs text-[#1a1a1a] italic">&ldquo;{instructions}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Billing Breakdown */}
            <div className="bg-white border border-[#ded9d1]">
              <div className="px-5 py-3.5 border-b border-[#ded9d1]">
                <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold tracking-wider">
                  Billing Summary
                </span>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm text-[#665d52]">
                <div className="flex justify-between">
                  <span>Meal Subtotal</span>
                  <span className="text-[#1a1a1a] font-medium">{String.fromCharCode(8377)}{mealSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span>Delivery Fee</span>
                    <span className="block font-label-caps text-[10px] text-[#665d52]">{distanceKm} km &middot; {String.fromCharCode(8377)}25 base + {String.fromCharCode(8377)}8/km</span>
                  </div>
                  <span className="text-[#1a1a1a] font-medium">{String.fromCharCode(8377)}{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span>GST (5%)</span>
                    <span className="block font-label-caps text-[10px] text-[#665d52]">Applied on meal subtotal</span>
                  </div>
                  <span className="text-[#1a1a1a] font-medium">{String.fromCharCode(8377)}{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging</span>
                  <span className="font-label-caps text-xs text-[#1b5e20] font-bold">{String.fromCharCode(8377)}0.00 FREE</span>
                </div>
                <div className="border-t border-[#ded9d1] pt-3 flex justify-between font-bold text-base text-[#1a1a1a]">
                  <span>Grand Total</span>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl">
                    {String.fromCharCode(8377)}{totalWithGst.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatch Notice */}
            <div className="bg-[#f5f3ef] p-4 border-l-2 border-[#1a1a1a] text-xs text-[#665d52] space-y-1">
              <p className="font-semibold text-[#1a1a1a] uppercase font-label-caps tracking-wider">Estimated Dispatch Window</p>
              <p>12:30 PM &ndash; 01:15 PM &middot; Hand-delivered in food-grade stainless steel dabba.</p>
              <p className="text-[#4a4238]">Kitchen slot reservation locks upon confirmation. No cancellations after dispatch.</p>
            </div>
          </div>

          {/* RIGHT: Sticky Recipient + Payment Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 space-y-5">

              {/* Recipient Details Card */}
              <div className="bg-white border border-[#ded9d1] p-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1] mb-4">
                  <div>
                    <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block">Recipient Details</span>
                    <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mt-0.5">Delivery To</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingRecipient(v => !v)}
                    className="inline-flex items-center gap-1.5 font-label-caps text-[11px] uppercase text-[#665d52] hover:text-[#1a1a1a] border border-[#ded9d1] px-2.5 py-1.5 hover:bg-[#f5f3ef] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">{isEditingRecipient ? 'check' : 'edit'}</span>
                    {isEditingRecipient ? 'Done' : 'Edit'}
                  </button>
                </div>

                {isEditingRecipient ? (
                  <div className="space-y-3">
                    <div>
                      <label className="font-label-caps text-[11px] uppercase text-[#665d52] font-semibold block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                        className="w-full bg-[#f5f3ef] px-3 py-2 text-sm text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[11px] uppercase text-[#665d52] font-semibold block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value)}
                        className="w-full bg-[#f5f3ef] px-3 py-2 text-sm text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[11px] uppercase text-[#665d52] font-semibold block mb-1">Email</label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={e => setRecipientEmail(e.target.value)}
                        className="w-full bg-[#f5f3ef] px-3 py-2 text-sm text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-[#4a4238]">person</span>
                      <span className="text-[#1a1a1a] font-medium">
                        {recipientName || <span className="text-[#ba1a1a] italic text-xs">Not set — click Edit</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-[#4a4238]">phone</span>
                      <span className="text-[#665d52]">
                        {recipientPhone || <span className="text-[#ba1a1a] italic text-xs">Not set</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-[#4a4238]">mail</span>
                      <span className="text-[#665d52] text-xs">
                        {recipientEmail || <span className="italic text-[#665d52]">—</span>}
                      </span>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="mt-4 pt-4 border-t border-[#ded9d1] space-y-1.5">
                  <label className="font-label-caps text-[11px] uppercase text-[#665d52] font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    Delivery Address
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    rows={2}
                    placeholder="Flat/Office No., Building, Street, Locality — Ahmedabad"
                    className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a] resize-none leading-relaxed"
                  />
                </div>

                {/* Kitchen Note */}
                <div className="mt-3 space-y-1.5">
                  <label className="font-label-caps text-[11px] uppercase text-[#665d52] font-semibold">Kitchen Note</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    placeholder="e.g. Less spicy, no garlic..."
                    className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-[#ded9d1] p-6">
                <div className="pb-3 border-b border-[#ded9d1] mb-4">
                  <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block">Payment Method</span>
                  <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mt-0.5">How to Pay</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { value: 'Online Payment', icon: 'credit_card', label: 'Online Payment', desc: 'UPI / Card / Net Banking — Escrow held until delivery verified' },
                    { value: 'Cash on Delivery', icon: 'payments', label: 'Cash on Delivery', desc: 'Pay the delivery partner on receipt of your tiffin' }
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3.5 border cursor-pointer transition-all ${
                        paymentMethod === opt.value
                          ? 'border-[#1a1a1a] bg-[#f5f3ef]'
                          : 'border-[#ded9d1] hover:border-[#1a1a1a]/40 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                        className="mt-0.5 accent-[#1a1a1a] shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#4a4238]">{opt.icon}</span>
                          <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold">{opt.label}</span>
                        </div>
                        <p className="text-[10px] text-[#665d52] mt-0.5 leading-relaxed">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Total Mini Summary */}
              <div className="bg-[#f5f3ef] border border-[#ded9d1] p-5">
                <div className="space-y-2 text-xs text-[#665d52]">
                  <div className="flex justify-between">
                    <span>Meal Subtotal</span>
                    <span className="text-[#1a1a1a]">{String.fromCharCode(8377)}{mealSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery ({distanceKm} km)</span>
                    <span className="text-[#1a1a1a]">{String.fromCharCode(8377)}{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="text-[#1a1a1a]">{String.fromCharCode(8377)}{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#ded9d1] pt-2 flex justify-between items-baseline">
                    <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold">Total Payable</span>
                    <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] font-semibold">
                      {String.fromCharCode(8377)}{totalWithGst.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {orderError && (
                <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium border border-[#ba1a1a]/30">
                  {orderError}
                </div>
              )}

              {/* Confirm Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="w-full py-4 bg-[#1a1a1a] hover:bg-[#4a4238] disabled:bg-[#ded9d1] disabled:cursor-not-allowed text-[#fbf9f5] font-button-text text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Confirm &amp; Place Order</span>
                    <span className="h-3 w-[1px] bg-white/30" />
                    <span>{String.fromCharCode(8377)}{totalWithGst.toFixed(2)}</span>
                  </>
                )}
              </button>

              {/* Back to Customizer */}
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 bg-white hover:bg-[#f5f3ef] text-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-center border border-[#ded9d1] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Edit Tray Selection
              </button>

              {/* Trust Badge */}
              <div className="bg-[#f5f3ef] p-4 border border-[#ded9d1]">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#4a4238] text-[22px] shrink-0">verified_user</span>
                  <div>
                    <span className="font-label-caps text-xs text-[#1a1a1a] uppercase tracking-wider block font-bold">Escrow Quality Lock</span>
                    <p className="font-body-md text-[11px] text-[#665d52] mt-0.5 leading-relaxed">
                      Payment held securely until canister temperature and hygiene seal are verified upon delivery.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
