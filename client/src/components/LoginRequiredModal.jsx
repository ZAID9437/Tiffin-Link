import React from 'react';
import { Lock, ShieldCheck, ArrowRight, UserPlus, LogIn, ShoppingBag, X } from 'lucide-react';

export default function LoginRequiredModal({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenSignup,
  orderDetails = null
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fbf9f5] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ded9d1] space-y-6 animate-scale-in text-center relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a] flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Security Lock Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#a0522d]/10 text-[#a0522d] flex items-center justify-center mx-auto shadow-sm border border-[#a0522d]/20">
          <Lock size={32} />
        </div>

        {/* Header & Explanatory Copy */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b5e20]/10 text-[#1b5e20] text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Secure Order Authentication</span>
          </div>
          <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">
            Login Required
          </h3>
          <p className="text-sm text-[#665d52] leading-relaxed max-w-sm mx-auto">
            Please login or create an account to place your order. Your cart and checkout details are safely preserved.
          </p>
        </div>

        {/* Order Summary Snapshot to reassure the guest that their cart is intact */}
        {orderDetails && (
          <div className="p-3.5 bg-[#f5f3ef] rounded-2xl border border-[#ded9d1]/70 text-left space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-[#1a1a1a]">
              <span className="truncate max-w-[200px]">{orderDetails.providerName || 'Artisan Kitchen'}</span>
              <span className="font-mono text-emerald-800">₹{orderDetails.totalAmount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-[#665d52]">
              <span className="flex items-center gap-1">
                <ShoppingBag size={13} />
                <span>{orderDetails.itemCount || 1} Item(s) in Cart</span>
              </span>
              <span className="text-[11px] text-[#1b5e20] font-semibold">✓ Cart Preserved</span>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => {
              onClose();
              if (onOpenLogin) onOpenLogin();
            }}
            className="w-full py-3.5 px-5 rounded-xl bg-[#1a1a1a] hover:bg-[#333] text-[#f5f3ef] font-button-text text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <LogIn size={16} />
            <span>Login to Confirm Order</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenSignup) onOpenSignup();
            }}
            className="w-full py-3 px-5 rounded-xl bg-white hover:bg-[#f5f3ef] text-[#1a1a1a] border border-[#ded9d1] font-button-text text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <UserPlus size={16} />
            <span>Create New Account</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-[#665d52] hover:text-[#1a1a1a] font-semibold transition-colors cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>

        {/* Escrow Guarantee Footnote */}
        <p className="text-[10px] text-[#665d52]/80 uppercase tracking-widest font-mono">
          🔒 100% Encrypted Customer Session &bull; TiffinLink Food Escrow
        </p>
      </div>
    </div>
  );
}
