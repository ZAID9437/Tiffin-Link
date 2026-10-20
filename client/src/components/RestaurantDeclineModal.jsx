import React from 'react';
import { Store, AlertTriangle, ShieldCheck, ArrowRight, RotateCcw, X, Utensils } from 'lucide-react';

export default function RestaurantDeclineModal({
  isOpen,
  onClose,
  declineData,
  onFindAlternative,
  onViewCancelledOrders
}) {
  if (!isOpen || !declineData) return null;

  const {
    orderId = '',
    providerName = 'Kitchen Partner',
    tiffinName = 'Tiffin Meal',
    cancellationReason = 'The kitchen is at peak capacity and cannot prepare this order right now.',
    totalAmount = 0,
    refundNotice = '100% Escrow Refund Recredited to Source Account'
  } = declineData;

  const displayOrderId = orderId.startsWith('#') ? orderId : `#${orderId}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-red-100 overflow-hidden transform transition-all animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decline-dialog-title"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-5 border-b border-rose-100 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm border border-rose-200">
              <Store size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Kitchen Declined Order
                </span>
                <span className="text-xs font-semibold text-gray-500">{displayOrderId}</span>
              </div>
              <h2 id="decline-dialog-title" className="text-lg font-bold text-gray-900 mt-0.5">
                {providerName} Was Unable to Accept
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Meal summary line */}
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-3.5 py-2 rounded-lg border border-gray-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Utensils size={14} className="text-gray-500" />
              {tiffinName}
            </span>
            <span className="font-bold text-gray-900">
              ₹{Number(totalAmount).toFixed(2)}
            </span>
          </div>

          {/* Restaurant Reason Callout */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider mb-1.5">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <span>Explanation from Kitchen</span>
            </div>
            <p className="text-sm font-medium text-amber-950 italic pl-5 border-l-2 border-amber-400 leading-relaxed">
              &ldquo;{cancellationReason}&rdquo;
            </p>
          </div>

          {/* 100% Refund Escrow Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>100% Escrow Refund Reversal</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-semibold uppercase">Zero Fee</span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-normal">
                {refundNotice || 'Your payment has been fully reversed to your original payment method. No cancellation penalty applies.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onViewCancelledOrders) onViewCancelledOrders();
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>View Refund Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onFindAlternative) onFindAlternative();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Browse Other Nearby Kitchens</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
