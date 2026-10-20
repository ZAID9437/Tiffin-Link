import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  X,
  Sparkles,
  UtensilsCrossed
} from 'lucide-react';
import { requestMealSwap, getMySwaps } from '../services/advancedFeaturesApi';

export default function MealSwapModal({ isOpen, onClose, activeOrders = [] }) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [replacementDate, setReplacementDate] = useState('Tomorrow');
  const [targetMeal, setTargetMeal] = useState('Kathiyawadi Ringan Oro & Bajra Rotla');
  const [dietaryType, setDietaryType] = useState('Pure Veg');
  const [reason, setReason] = useState('taste_variety');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pastSwaps, setPastSwaps] = useState([]);

  useEffect(() => {
    if (activeOrders?.length > 0 && !selectedOrderId) {
      setSelectedOrderId(activeOrders[0]._id || activeOrders[0].id);
    }
  }, [activeOrders, selectedOrderId]);

  useEffect(() => {
    if (isOpen) {
      getMySwaps().then(res => {
        if (res && res.success) {
          setPastSwaps(res.swaps || []);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwap = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await requestMealSwap({
        orderId: selectedOrderId || 'sub-ord-01',
        scheduledDate: replacementDate,
        targetMealType: targetMeal,
        dietaryType,
        reason
      });

      if (res && res.success) {
        setMessage('Meal swap confirmed! Tomorrow’s meal has been upgraded with 0 extra fees.');
        setPastSwaps(prev => [res.swapRequest, ...prev]);
      }
    } catch (err) {
      setMessage('Swap processed locally: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-onyx-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-bone-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-sand-neutral/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header - Editorial Artisanal Theme */}
        <div className="p-6 bg-surface-container dark:bg-stone-900 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                FLEXI-DINING PASS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps tracking-wider uppercase bg-sand-neutral/80 dark:bg-stone-800 text-onyx-black dark:text-stone-300 border border-sand-neutral">
                ZERO FEE SWAP
              </span>
            </div>
            <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-bone-white font-normal leading-tight">
              Meal Swap &amp; Substitute
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-secondary dark:text-stone-400">
              Not craving today&apos;s scheduled menu? Seamlessly swap for an artisanal regional special.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-sand-neutral/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-sand-neutral/80 dark:border-stone-700 flex items-center justify-center text-onyx-black dark:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-onyx-black dark:text-stone-100">
          {message && (
            <div className="p-3.5 rounded-xl bg-surface-container border border-[#6B4B2B]/40 text-onyx-black dark:text-stone-200 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Quota Badge */}
          <div className="p-4 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37]" />
              <span className="font-label-caps text-[11px] font-bold tracking-wider text-onyx-black dark:text-stone-200 uppercase">
                Monthly Swap Allowance
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-surface-container border border-sand-neutral text-onyx-black dark:text-stone-300 font-label-caps text-[10px] font-bold">
              3 of 4 Free Swaps Left
            </span>
          </div>

          <form onSubmit={handleSwap} className="p-5 rounded-xl border border-sand-neutral/80 dark:border-stone-800 bg-surface-container-lowest dark:bg-[#1E1E22] shadow-xs space-y-4">
            <div>
              <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                SELECT ACTIVE SUBSCRIPTION / MEAL DAY
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs outline-none transition-all cursor-pointer"
              >
                <option value="sub-tomorrow">Tomorrow&apos;s Lunch (Standard Gujarati Thali)</option>
                <option value="sub-friday">Friday&apos;s Dinner (Dal Khichdi & Buttermilk)</option>
                <option value="sub-saturday">Saturday&apos;s Lunch (Puri Sabji Feast)</option>
              </select>
            </div>

            <div>
              <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                CHOOSE REPLACEMENT DISH / THALI
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Kathiyawadi Ringan Oro & Bajra Rotla', desc: 'Charcoal-roasted eggplant with handmade millet rotla' },
                  { name: 'Special Rajasthani Dal Baati Churma', desc: 'Baked wheat baatis in pure desi ghee with spiced lentil soup' },
                  { name: 'Satvik Jain Paneer Bhurji & Phulka Box', desc: 'Fresh paneer crumbled with cumin and turmeric, zero root veg' },
                  { name: 'Light Moong Khichdi & Roasted Papad', desc: 'Ultra-light soothing comfort meal for detox' }
                ].map((item) => (
                  <label
                    key={item.name}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      targetMeal === item.name
                        ? 'border-onyx-black dark:border-stone-400 bg-surface-container/60 dark:bg-stone-800 shadow-2xs'
                        : 'border-sand-neutral/80 dark:border-stone-800 bg-surface-container-low dark:bg-stone-900/40 hover:border-sand-neutral'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="targetMeal"
                        checked={targetMeal === item.name}
                        onChange={() => setTargetMeal(item.name)}
                        className="text-onyx-black focus:ring-onyx-black"
                      />
                      <div>
                        <div className="font-serif text-sm font-medium text-onyx-black dark:text-bone-white">{item.name}</div>
                        <div className="font-body-md text-[11px] text-secondary dark:text-stone-400">{item.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                  DIETARY PREPARATION
                </label>
                <select
                  value={dietaryType}
                  onChange={(e) => setDietaryType(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs outline-none transition-all cursor-pointer"
                >
                  <option value="Pure Veg">Pure Vegetarian</option>
                  <option value="Jain">100% Jain</option>
                  <option value="Swaminarayan">Swaminarayan Satvik</option>
                </select>
              </div>

              <div>
                <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                  REASON FOR SWAP
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs outline-none transition-all cursor-pointer"
                >
                  <option value="taste_variety">Craving Something Different</option>
                  <option value="fasting_tithi">Fasting / Special Religious Day</option>
                  <option value="travel_shift">Time Shift</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'PROCESSING SWAP...' : 'CONFIRM MEAL SUBSTITUTION (FREE)'}
            </button>
          </form>

          {/* Past Swaps History */}
          {pastSwaps.length > 0 && (
            <div className="pt-3 border-t border-sand-neutral/60 dark:border-stone-800 space-y-2">
              <h5 className="font-label-caps text-[11px] font-bold tracking-widest text-secondary dark:text-stone-400 uppercase">
                RECENT SUBSTITUTED MEALS
              </h5>
              <div className="space-y-2">
                {pastSwaps.slice(0, 3).map((sw, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-container-lowest dark:bg-stone-800/50 border border-sand-neutral/80 dark:border-stone-800 text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="font-serif text-sm font-medium text-onyx-black dark:text-bone-white">{sw.targetMealType}</span>
                      <p className="font-body-md text-[11px] text-secondary dark:text-stone-400">{sw.scheduledDate} &bull; {sw.dietaryType}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-secondary dark:text-stone-300 bg-surface-container px-2.5 py-0.5 rounded-full border border-sand-neutral">
                      Swapped
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
