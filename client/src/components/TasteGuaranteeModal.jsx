import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  RotateCcw,
  Sparkles,
  X,
  MessageSquare,
  ThumbsDown,
  Clock
} from 'lucide-react';
import { submitTasteGuaranteeClaim } from '../services/advancedFeaturesApi';

export default function TasteGuaranteeModal({ isOpen, onClose, activeOrders = [] }) {
  const [orderId, setOrderId] = useState('ord-recent-01');
  const [issueType, setIssueType] = useState('Too salty/spicy');
  const [compensationChoice, setCompensationChoice] = useState('full_refund');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await submitTasteGuaranteeClaim({
        orderId,
        kitchenName: 'Radhe Krishna Satvik Kitchen',
        issueType,
        compensationChoice,
        notes
      });

      if (res && res.success) {
        setClaimResult(res.claim);
        setClaimed(true);
      }
    } catch (err) {
      alert('Error submitting claim: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-bone-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-sand-neutral dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-surface-container dark:bg-stone-900 p-6 sm:p-7 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-surface-container-lowest dark:bg-stone-800 border border-sand-neutral/90 dark:border-stone-700 flex items-center justify-center shrink-0 text-[#6B4B2B] dark:text-[#D4AF37] shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase">
                  ZERO HASSLE ASSURANCE
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#6B4B2B]/10 dark:bg-[#D4AF37]/15 text-[#6B4B2B] dark:text-[#D4AF37] tracking-widest uppercase border border-[#6B4B2B]/20">
                  Instant Refund
                </span>
              </div>
              <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-stone-100 font-normal tracking-tight">
                Taste &amp; Freshness Guarantee
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                Didn&apos;t love the taste? We refund or replace it instantly — no questions asked.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest dark:bg-stone-800 hover:bg-sand-neutral dark:hover:bg-stone-700 border border-sand-neutral/80 dark:border-stone-700 flex items-center justify-center text-onyx-black dark:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 flex-1 text-onyx-black dark:text-stone-100">
          {claimed ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-headline-md font-serif text-xl font-normal text-onyx-black dark:text-stone-100">
                Claim Approved Instantly!
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto font-sans leading-relaxed">
                {compensationChoice === 'full_refund'
                  ? '₹120 has been credited back to your Tiffin-Link Wallet instantly. We have also notified the head chef to adjust spice levels.'
                  : 'An immediate replacement meal has been dispatched from our closest kitchen express hub!'}
              </p>
              <div className="p-3 rounded-lg bg-surface-container-low dark:bg-stone-800 border border-sand-neutral dark:border-stone-700 text-xs font-mono text-stone-600 dark:text-stone-300">
                Claim Ref: {claimResult?.claimId || 'CLM-90184'} &bull; Status: Auto-Resolved
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text text-xs uppercase tracking-widest font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#6B4B2B] dark:text-[#D4AF37] uppercase font-label-caps tracking-[0.2em] mb-1.5">
                  Which Meal Had an Issue?
                </label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-sand-neutral dark:border-stone-700 bg-surface-container-lowest dark:bg-stone-800 text-xs font-medium text-onyx-black dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-onyx-black"
                >
                  <option value="ord-recent-01">Today&apos;s Lunch (Gujarati Dal-Bhat &amp; Phulka Thali)</option>
                  <option value="ord-recent-02">Yesterday&apos;s Dinner (Kathiyawadi Sev Tameta)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B4B2B] dark:text-[#D4AF37] uppercase font-label-caps tracking-[0.2em] mb-1.5">
                  What Went Wrong?
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'Too salty/spicy',
                    'Oil level too high',
                    'Cold / delayed arrival',
                    'Missing salad / sweet',
                    'Texture not tender',
                    'Burnt roti'
                  ].map((issue) => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setIssueType(issue)}
                      className={`p-2.5 rounded-lg border text-left font-sans text-xs font-semibold transition cursor-pointer ${
                        issueType === issue
                          ? 'border-onyx-black bg-onyx-black text-bone-white dark:border-[#D4AF37] dark:bg-[#D4AF37] dark:text-stone-900 shadow-2xs'
                          : 'border-sand-neutral dark:border-stone-700 bg-surface-container-lowest dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-surface-container'
                      }`}
                    >
                      {issue}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B4B2B] dark:text-[#D4AF37] uppercase font-label-caps tracking-[0.2em] mb-1.5">
                  Select Desired Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      compensationChoice === 'full_refund'
                        ? 'border-onyx-black bg-surface-container dark:border-[#D4AF37] dark:bg-stone-800/80 ring-1 ring-onyx-black dark:ring-[#D4AF37]'
                        : 'border-sand-neutral dark:border-stone-700 bg-surface-container-lowest dark:bg-stone-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="comp"
                      checked={compensationChoice === 'full_refund'}
                      onChange={() => setCompensationChoice('full_refund')}
                      className="hidden"
                    />
                    <div className="font-button-text font-bold text-xs uppercase tracking-wider text-onyx-black dark:text-[#D4AF37]">
                      100% Instant Refund
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">Credited to wallet in under 10 seconds</p>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      compensationChoice === 'replacement_meal'
                        ? 'border-onyx-black bg-surface-container dark:border-[#D4AF37] dark:bg-stone-800/80 ring-1 ring-onyx-black dark:ring-[#D4AF37]'
                        : 'border-sand-neutral dark:border-stone-700 bg-surface-container-lowest dark:bg-stone-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="comp"
                      checked={compensationChoice === 'replacement_meal'}
                      onChange={() => setCompensationChoice('replacement_meal')}
                      className="hidden"
                    />
                    <div className="font-button-text font-bold text-xs uppercase tracking-wider text-onyx-black dark:text-[#D4AF37]">
                      Dispatch Fresh Meal
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">Hot replacement delivered ASAP</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6B4B2B] dark:text-[#D4AF37] uppercase font-label-caps tracking-[0.2em] mb-1.5">
                  Optional Feedback for Chef
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what you didn't like so we can improve the recipe..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-sand-neutral dark:border-stone-700 bg-surface-container-lowest dark:bg-stone-800 text-xs font-medium text-onyx-black dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-onyx-black"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text font-medium text-xs tracking-[0.15em] uppercase transition-all duration-200 shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing Guarantee...' : 'Claim 100% Taste Guarantee'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
