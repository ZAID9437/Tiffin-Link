import React from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartDrawer({
  onProceedToCheckout
}) {
  const {
    cart,
    subtotal,
    deliveryFee,
    packagingFee,
    gstTax,
    totalAmount,
    totalCount,
    updateQuantity,
    removeItem,
    clearCart,
    isCartOpen,
    setIsCartOpen
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#fbf9f5] h-full shadow-2xl flex flex-col justify-between border-l border-[#ded9d1] animate-slide-left relative"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-[#ded9d1] flex items-center justify-between bg-[#f5f3ef]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] text-white flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
                Your Tiffin Bag
              </h3>
              <p className="text-xs text-[#665d52]">
                {cart.provider ? `${cart.provider.name} • ` : ''}{totalCount} {totalCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a] flex items-center justify-center transition-all cursor-pointer border border-[#ded9d1]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#ded9d1]/40 flex items-center justify-center text-[#665d52]">
                <ShoppingBag size={36} />
              </div>
              <div className="space-y-1">
                <h4 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-bold text-[#1a1a1a]">Your Bag is Empty</h4>
                <p className="text-xs text-[#665d52] max-w-xs">
                  Explore fresh authentic kitchens near you and add artisan homestyle meals to your cart.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  window.location.hash = '#find-tiffin';
                }}
                className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white font-button-text text-xs uppercase tracking-wider font-bold hover:bg-[#333] transition-all cursor-pointer"
              >
                Explore Nearby Tiffins
              </button>
            </div>
          ) : (
            <>
              {/* Kitchen Banner */}
              {cart.provider && (
                <div className="p-3 bg-[#f5f3ef] rounded-2xl border border-[#ded9d1]/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#a0522d] block">Ordering From</span>
                    <span className="font-bold text-[#1a1a1a] text-sm">{cart.provider.name}</span>
                    <span className="text-[#665d52] block text-[11px] truncate max-w-[240px]">{cart.provider.address}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Active Kitchen
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-[#ded9d1]/70 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#1a1a1a] leading-tight">
                          {item.tiffinName}
                        </h4>
                        <div className="text-[11px] text-[#665d52] mt-0.5 space-y-0.5">
                          {item.selectedShaak && <div>Shaak: {item.selectedShaak}</div>}
                          {item.rotliCount && <div>Rotlis: {item.rotliCount} Phulka with Desi Ghee</div>}
                          {Array.isArray(item.extras) && item.extras.length > 0 && (
                            <div className="text-amber-800">
                              + {item.extras.map(x => x.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#1a1a1a]">
                          ₹{(item.itemTotal || (item.unitPrice * item.quantity)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ded9d1]/40">
                      <div className="flex items-center gap-2 bg-[#f5f3ef] rounded-lg p-1 border border-[#ded9d1]/50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white hover:bg-[#ded9d1] flex items-center justify-center text-[#1a1a1a] transition-all cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-mono text-xs font-bold w-5 text-center text-[#1a1a1a]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white hover:bg-[#ded9d1] flex items-center justify-center text-[#1a1a1a] transition-all cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#665d52] hover:text-red-600 p-1.5 rounded transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer with Financial Breakdown */}
        {cart.items.length > 0 && (
          <div className="p-5 sm:p-6 bg-[#f5f3ef] border-t border-[#ded9d1] space-y-4">
            <div className="space-y-1.5 text-xs font-body-md">
              <div className="flex justify-between text-[#665d52]">
                <span>Items Subtotal</span>
                <span className="font-mono font-semibold text-[#1a1a1a]">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Corridor Thermal Delivery</span>
                <span className="font-mono font-semibold text-[#1a1a1a]">₹{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Food-Grade 304 Stainless Packaging</span>
                <span className="font-mono font-semibold text-[#1a1a1a]">₹{packagingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1a1a1a] pt-2 border-t border-[#ded9d1]">
                <span>Final Payable</span>
                <span className="font-mono text-lg text-emerald-800">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                if (onProceedToCheckout) onProceedToCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#333] text-white font-button-text text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              <span>Proceed to Checkout (₹{totalAmount})</span>
              <ArrowRight size={15} />
            </button>

            <p className="text-[10px] text-center text-[#665d52] uppercase tracking-widest font-mono">
              🔒 TiffinLink Escrow: No payment released until OTP verification
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
