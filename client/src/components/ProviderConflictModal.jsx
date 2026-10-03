import React from 'react';
import { AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function ProviderConflictModal({
  conflict,
  onResolve
}) {
  if (!conflict) return null;

  const { currentProvider, newProvider, pendingItem } = conflict;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fbf9f5] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#ded9d1] space-y-6 animate-scale-in text-center relative">
        <button 
          onClick={() => onResolve('keep')}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a] flex items-center justify-center transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
          <AlertTriangle size={28} />
        </div>

        <div className="space-y-2">
          <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-bold text-[#1a1a1a]">
            Different Kitchen Selected
          </h3>
          <p className="text-xs sm:text-sm text-[#665d52] leading-relaxed">
            Your cart already contains delicious items from <span className="font-semibold text-[#1a1a1a]">{currentProvider?.name || 'another provider'}</span>. Would you like to replace your cart with items from <span className="font-semibold text-[#1a1a1a]">{newProvider?.name || 'the new kitchen'}</span>?
          </p>
        </div>

        <div className="p-3 bg-[#f5f3ef] rounded-xl border border-[#ded9d1]/70 text-xs text-left space-y-1">
          <div className="text-[#665d52]">New Item to Add:</div>
          <div className="font-semibold text-[#1a1a1a]">{pendingItem?.tiffinName || 'Selected Meal'} ({pendingItem?.quantity || 1}x)</div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onResolve('keep')}
            className="py-3 px-4 rounded-xl bg-white hover:bg-[#f5f3ef] text-[#1a1a1a] border border-[#ded9d1] font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
          >
            Keep Current Cart
          </button>

          <button
            onClick={() => onResolve('replace')}
            className="py-3 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#333] text-white font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer shadow-md"
          >
            Replace Cart
          </button>
        </div>
      </div>
    </div>
  );
}
