import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles,
  UtensilsCrossed
} from 'lucide-react';
import {
  getHostels,
  submitResidentSelection,
  finalizeHostelGroupOrder
} from '../services/advancedFeaturesApi';

export default function HostelBulkPoolModal({ isOpen, onClose }) {
  const [hostels, setHostels] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [activeGroupOrder, setActiveGroupOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Resident Join Form
  const [residentName, setResidentName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [mealCategory, setMealCategory] = useState('Standard Student Thali (₹110)');
  const [spiceLevel, setSpiceLevel] = useState('Medium');

  const loadHostels = async () => {
    setLoading(true);
    try {
      const res = await getHostels();
      if (res && res.success) {
        setHostels(res.hostels || []);
        if (res.hostels?.length > 0 && !selectedHostelId) {
          setSelectedHostelId(res.hostels[0].hostelId);
        }
      }
    } catch (e) {
      console.warn('Error loading hostels:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHostels();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedHostelId) return;

    const fetchActiveGroup = async () => {
      const h = hostels.find(x => x.hostelId === selectedHostelId);
      if (h) {
        setActiveGroupOrder({
          groupOrderId: `grp-${selectedHostelId}`,
          hostelName: h.name,
          hostelId: h.hostelId,
          targetDeliveryTime: 'Tonight, 8:30 PM',
          cutoffTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          minPoolThreshold: 5,
          currentSelectionsCount: 7,
          currentDiscountPercentage: 15,
          nextDiscountTier: { count: 10, discount: 20 },
          selections: [
            { residentName: 'Aarav Patel', roomNumber: '204', mealType: 'Jain Thali', spiceLevel: 'Mild' },
            { residentName: 'Meet Shah', roomNumber: '108', mealType: 'Student Regular', spiceLevel: 'Medium' },
            { residentName: 'Kunal Joshi', roomNumber: '312', mealType: 'Special Thali', spiceLevel: 'Spicy' }
          ]
        });
      }
    };
    fetchActiveGroup();
  }, [selectedHostelId, hostels]);

  if (!isOpen) return null;

  const currentHostel = hostels.find(h => h.hostelId === selectedHostelId) || hostels[0];

  const handleJoinPool = async (e) => {
    e.preventDefault();
    if (!residentName || !roomNumber) {
      alert('Please enter your name and room number');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      if (activeGroupOrder) {
        await submitResidentSelection(activeGroupOrder.groupOrderId, {
          residentName,
          roomNumber,
          phone,
          mealType: mealCategory,
          quantity: 1,
          customNotes: `Spice: ${spiceLevel}`
        });

        setActiveGroupOrder(prev => ({
          ...prev,
          currentSelectionsCount: (prev?.currentSelectionsCount || 0) + 1,
          selections: [
            ...(prev?.selections || []),
            { residentName, roomNumber, mealType: mealCategory, spiceLevel }
          ]
        }));

        setMessage(`Awesome ${residentName}! You joined room pool #${roomNumber}. Collective discount applied!`);
        setResidentName('');
        setRoomNumber('');
      }
    } catch (err) {
      setMessage('Joined pool locally: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!activeGroupOrder) return;
    try {
      await finalizeHostelGroupOrder(activeGroupOrder.groupOrderId);
      setMessage('Hostel pool batch successfully sent to kitchen for collective preparation!');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-onyx-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-bone-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-sand-neutral/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header - Editorial Artisanal Theme */}
        <div className="p-6 bg-surface-container dark:bg-stone-900 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                COLLECTIVE DINING CONCIERGE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps tracking-wider uppercase bg-sand-neutral/80 dark:bg-stone-800 text-onyx-black dark:text-stone-300 border border-sand-neutral">
                BULK SAVINGS
              </span>
            </div>
            <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-bone-white font-normal leading-tight">
              Hostel &amp; PG Bulk Meal Pools
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-secondary dark:text-stone-400">
              Pool orders with your campus mates to unlock up to 25% dining savings &amp; ₹0 delivery fees.
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

        {/* Campus / PG Selector Bar */}
        <div className="px-6 py-3.5 border-b border-sand-neutral/60 dark:border-stone-800 bg-surface-container-low/70 dark:bg-stone-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-label-caps text-[10px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase">
              SELECT CAMPUS / PG:
            </span>
            <select
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-sand-neutral/90 dark:border-stone-700 bg-surface-container-lowest dark:bg-stone-800 text-xs font-semibold text-onyx-black dark:text-stone-200 focus:outline-none focus:border-onyx-black focus:ring-1 focus:ring-onyx-black shadow-2xs cursor-pointer"
            >
              {hostels.map(h => (
                <option key={h.hostelId} value={h.hostelId}>
                  {h.name} ({h.area})
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-sand-neutral/80 text-[11px] font-label-caps font-bold text-onyx-black dark:text-stone-300">
            <Users className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>{activeGroupOrder?.currentSelectionsCount || 0} pooled</span>
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-onyx-black dark:text-stone-100">
          {message && (
            <div className="p-3.5 rounded-xl bg-surface-container border border-[#6B4B2B]/40 text-onyx-black dark:text-stone-200 text-xs font-semibold flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Discount Tier Progress Card */}
          <div className="p-5 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-caps text-[10px] font-bold tracking-[0.2em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase block mb-0.5">
                  COMMUNITY BENEFIT UNLOCKED
                </span>
                <div className="text-2xl font-serif text-onyx-black dark:text-bone-white font-normal">
                  {activeGroupOrder?.currentDiscountPercentage || 15}% Discount Applied!
                </div>
              </div>
              <div className="text-right">
                <span className="font-label-caps text-[10px] uppercase tracking-widest text-secondary dark:text-stone-400 font-bold block">
                  CUTOFF TIMER
                </span>
                <div className="text-xs font-semibold text-onyx-black dark:text-stone-200 flex items-center gap-1.5 justify-end mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
                  <span>45 mins remaining</span>
                </div>
              </div>
            </div>

            {/* Progress bar towards next tier */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between font-label-caps text-[11px] text-secondary dark:text-stone-400">
                <span>{activeGroupOrder?.currentSelectionsCount || 7} orders placed</span>
                <span className="text-[#6B4B2B] dark:text-[#D4AF37] font-bold">
                  Next Milestone: 10 orders → 20% OFF
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-sand-neutral dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-onyx-black to-[#6B4B2B] dark:from-stone-200 dark:to-[#D4AF37] transition-all duration-500"
                  style={{ width: `${Math.min(100, ((activeGroupOrder?.currentSelectionsCount || 7) / 10) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resident Join Form - Matched with Website Signature Concierge Style */}
          <form onSubmit={handleJoinPool} className="p-6 rounded-xl border border-sand-neutral/80 dark:border-stone-800 bg-surface-container-lowest dark:bg-[#1E1E22] shadow-xs space-y-4">
            <div className="border-b border-sand-neutral/60 dark:border-stone-800 pb-3 flex items-center justify-between">
              <h4 className="font-label-caps text-xs font-bold tracking-[0.2em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase">
                Join Tonight&apos;s Hostel Group Pool
              </h4>
              <span className="font-label-caps text-[10px] text-secondary dark:text-stone-400 font-medium tracking-wider">
                BATCH RESERVATION
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                  YOUR FULL NAME
                </label>
                <input
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="e.g. Parth Desai"
                  required
                  className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black dark:focus:ring-sand-neutral rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                  HOSTEL ROOM / WING
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Block B, Room 302"
                  required
                  className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black dark:focus:ring-sand-neutral rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                  THALI SELECTION
                </label>
                <select
                  value={mealCategory}
                  onChange={(e) => setMealCategory(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black dark:focus:ring-sand-neutral rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs outline-none transition-all cursor-pointer"
                >
                  <option value="Standard Student Thali (₹110)">Standard Student Thali (₹110)</option>
                  <option value="Jain Satvik Special (₹130)">Jain Satvik Special (₹130)</option>
                  <option value="High-Protein Paneer Thali (₹150)">High-Protein Paneer Thali (₹150)</option>
                </select>
              </div>

              <div>
                <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                  SPICE PREFERENCE
                </label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black dark:focus:ring-sand-neutral rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs outline-none transition-all cursor-pointer"
                >
                  <option value="Mild">Mild (Low Chili)</option>
                  <option value="Medium">Medium Regular</option>
                  <option value="Spicy">Spicy Gujarati Style</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'ADDING TO POOL...' : 'ADD MY MEAL TO HOSTEL POOL'}
            </button>
          </form>

          {/* Current Room Pool Roster */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-label-caps text-[11px] font-bold tracking-widest text-secondary dark:text-stone-400 uppercase">
                POOL ROSTER ({activeGroupOrder?.selections?.length || 0} RESIDENTS)
              </span>
              <button
                onClick={handleFinalize}
                className="font-button-text text-xs font-semibold text-[#6B4B2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Coordinator: Finalize Batch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {activeGroupOrder?.selections?.map((sel, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-sand-neutral/80 dark:border-stone-800 bg-surface-container-lowest dark:bg-stone-800/50 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="font-serif text-sm font-medium text-onyx-black dark:text-bone-white">
                      {sel.residentName}
                    </div>
                    <div className="font-body-md text-[11px] text-secondary dark:text-stone-400">
                      Room {sel.roomNumber} &bull; {sel.mealType}
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container border border-sand-neutral/80 text-secondary dark:text-stone-300 font-label-caps text-[10px] font-semibold">
                    {sel.spiceLevel || 'Medium'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
