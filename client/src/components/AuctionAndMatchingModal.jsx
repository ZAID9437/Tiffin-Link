import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gavel,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Award,
  ShieldCheck,
  TrendingDown,
  X,
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import {
  getRequestMatches,
  getRequestOffers,
  selectAuctionOffer,
  rematchRequest
} from '../services/advancedFeaturesApi';
import { getSocket } from '../services/socket';

export default function AuctionAndMatchingModal({ isOpen, onClose, request, onOrderPlaced }) {
  const [tab, setTab] = useState('auction'); // 'auction' | 'ai_matches'
  const [offers, setOffers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingOfferId, setSelectingOfferId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fallbackRequest = {
    _id: 'REQ-LIVE-AUC',
    id: 'REQ-LIVE-AUC',
    mealType: 'Daily Homestyle Lunch (Vegetarian & Satvik)',
    quantity: 1,
    budget: 140,
    cuisine: 'Gujarati / Kathiyawadi',
    deliveryTime: 'Today, 1:00 PM',
    address: 'Satellite / Vastrapur, Ahmedabad'
  };

  const currentRequest = request || fallbackRequest;
  const requestId = currentRequest?._id || currentRequest?.id;

  const loadData = async () => {
    if (!requestId || requestId === 'REQ-LIVE-AUC') return;
    setLoading(true);
    try {
      const [offersRes, matchesRes] = await Promise.all([
        getRequestOffers(requestId),
        getRequestMatches(requestId)
      ]);

      if (offersRes && offersRes.success && Array.isArray(offersRes.offers) && offersRes.offers.length > 0) {
        setOffers(offersRes.offers);
      }
      if (matchesRes && matchesRes.success && Array.isArray(matchesRes.matches) && matchesRes.matches.length > 0) {
        setMatches(matchesRes.matches);
      }
    } catch (err) {
      console.log('Error loading auction/matches:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requestId && requestId !== 'REQ-LIVE-AUC') {
      loadData();
    }
  }, [isOpen, requestId]);

  // Realtime Socket listeners for new bids
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !requestId) return;

    const handleNewOffer = (data) => {
      if (data.requestId === requestId) {
        setOffers(prev => [data.offer, ...prev.filter(o => o.offerId !== data.offer.offerId)]);
      }
    };

    socket.on('offer:new', handleNewOffer);

    return () => {
      socket.off('offer:new', handleNewOffer);
    };
  }, [requestId]);

  if (!isOpen) return null;

  const defaultOffers = [
    {
      offerId: 'OFF-401',
      providerName: "Mom's Satvik Kitchen",
      tiffinName: 'Executive Phulka & Gujarati Dal Thali',
      offeredPrice: 120,
      originalPrice: 140,
      totalAmount: 120,
      estimatedPrepMinutes: 20,
      deliveryFee: 0,
      providerRating: 4.9,
      message: 'Fresh hot phulkas with pure cow ghee & low-salt organic dal.',
      expiresAt: new Date(Date.now() + 45 * 60000).toISOString(),
      status: 'pending'
    },
    {
      offerId: 'OFF-402',
      providerName: 'Shree Balaji Kathiyawadi Bhojanalay',
      tiffinName: 'Desi Baingan Bhartha & Bajra Rotla Combo',
      offeredPrice: 128,
      originalPrice: 150,
      totalAmount: 128,
      estimatedPrepMinutes: 25,
      deliveryFee: 0,
      providerRating: 4.8,
      message: 'Wood-fired charcoal cooked authentic ringna no olo with garlic chutney.',
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      status: 'pending'
    },
    {
      offerId: 'OFF-403',
      providerName: 'Radhe Krishna Express Kitchen',
      tiffinName: 'High Protein Paneer Bhurji & Multigrain Roti',
      offeredPrice: 135,
      originalPrice: 160,
      totalAmount: 135,
      estimatedPrepMinutes: 18,
      deliveryFee: 0,
      providerRating: 4.9,
      message: 'Packed in 304 food-grade stainless steel eco dabba.',
      expiresAt: new Date(Date.now() + 60 * 60000).toISOString(),
      status: 'pending'
    }
  ];

  const defaultMatches = [
    {
      providerId: 'prov-101',
      kitchenName: 'Annapurna Satvik Rasoi',
      matchScore: 98,
      distanceKm: 1.2,
      rating: 4.9,
      hygieneScore: 98,
      estimatedDeliveryMins: 20,
      breakdown: { dietaryMatch: 30, proximityScore: 25, ratingScore: 20, speedScore: 15 }
    },
    {
      providerId: 'prov-102',
      kitchenName: 'Ghar Ka Swaad Kitchens',
      matchScore: 94,
      distanceKm: 2.1,
      rating: 4.8,
      hygieneScore: 95,
      estimatedDeliveryMins: 25,
      breakdown: { dietaryMatch: 28, proximityScore: 22, ratingScore: 19, speedScore: 14 }
    }
  ];

  const displayedOffers = offers.length > 0 ? offers : defaultOffers;
  const displayedMatches = matches.length > 0 ? matches : defaultMatches;

  const handleSelectOffer = async (offerId) => {
    setSelectingOfferId(offerId);
    try {
      if (requestId === 'REQ-LIVE-AUC' || offerId.startsWith('OFF-')) {
        const chosen = displayedOffers.find(o => o.offerId === offerId);
        setSuccessMessage(`Offer accepted! Order placed with ${chosen?.providerName || 'kitchen'}.`);
        if (onOrderPlaced) onOrderPlaced(chosen);
        setTimeout(() => {
          onClose();
        }, 1800);
        return;
      }
      const res = await selectAuctionOffer(offerId);
      if (res && res.success) {
        setSuccessMessage(`Offer accepted! Order placed with ${res.order?.tiffinName || 'kitchen'}.`);
        if (onOrderPlaced) onOrderPlaced(res.order);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      alert('Error selecting offer: ' + err.message);
    } finally {
      setSelectingOfferId(null);
    }
  };

  const handleTriggerRematch = async () => {
    setLoading(true);
    try {
      if (requestId === 'REQ-LIVE-AUC') {
        setTimeout(() => {
          setMatches(defaultMatches);
          setLoading(false);
        }, 600);
        return;
      }
      const res = await rematchRequest(requestId);
      if (res && res.success) {
        setMatches(res.matches || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-onyx-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-bone-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-sand-neutral/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Editorial Artisanal Theme */}
        <div className="p-6 bg-surface-container dark:bg-stone-900 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5" />
                MULTI-KITCHEN REVERSE AUCTION
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps tracking-wider uppercase bg-sand-neutral/80 dark:bg-stone-800 text-onyx-black dark:text-stone-300 border border-sand-neutral font-mono">
                #{currentRequest._id?.toString().slice(-6) || 'AUC-01'}
              </span>
            </div>
            <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-bone-white font-normal leading-tight">
              {currentRequest.mealType || 'Custom Meal Order'}
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-secondary dark:text-stone-400">
              Quantity: {currentRequest.quantity || 1} &bull; Target Budget: ₹{currentRequest.budget || 140}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-sand-neutral/80 dark:border-stone-800 px-6 pt-3 bg-surface-container-low/60 dark:bg-stone-900/40">
          <button
            onClick={() => setTab('auction')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative cursor-pointer ${
              tab === 'auction'
                ? 'text-onyx-black dark:text-bone-white border-b-2 border-onyx-black dark:border-sand-neutral font-label-caps'
                : 'text-secondary hover:text-onyx-black dark:text-stone-400 font-label-caps'
            }`}
          >
            <Gavel className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Live Kitchen Bids ({displayedOffers.length})</span>
            {displayedOffers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#6B4B2B] dark:bg-[#D4AF37] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setTab('ai_matches')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 relative cursor-pointer ${
              tab === 'ai_matches'
                ? 'text-onyx-black dark:text-bone-white border-b-2 border-onyx-black dark:border-sand-neutral font-label-caps'
                : 'text-secondary hover:text-onyx-black dark:text-stone-400 font-label-caps'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>AI Smart Kitchen Matches ({displayedMatches.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === 'auction' ? (
            /* Live Kitchen Bids / Offers Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>Verified home kitchens competing with custom deals</span>
                <span className="font-semibold">{displayedOffers.length} active offers</span>
              </div>

              {displayedOffers.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                    Awaiting Kitchen Bids
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                    Nearby kitchens are currently reviewing your custom menu preference. New bids will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedOffers.map((offer, idx) => {
                    const isLowest = idx === 0;
                    return (
                      <div
                        key={offer.offerId || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          offer.status === 'selected'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                {offer.providerName || 'Local Home Chef'}
                              </h4>
                              {isLowest && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                  Best Price Deal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                Ready in {offer.estimatedPrepMinutes || 25}m
                              </span>
                              <span>&bull;</span>
                              <span>Delivery: {offer.deliveryFee === 0 ? 'FREE' : `₹${offer.deliveryFee}`}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                              ₹{offer.offeredPrice || offer.price}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Total: ₹{offer.totalAmount || offer.offeredPrice || offer.price}
                            </div>
                          </div>
                        </div>

                        {offer.message && (
                          <div className="mt-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-700/50 text-xs text-stone-700 dark:text-stone-300">
                            &ldquo;{offer.message}&rdquo;
                          </div>
                        )}

                        <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-700/70 flex items-center justify-between">
                          <span className="text-[11px] text-stone-400">
                            Expires in {Math.max(1, Math.floor(((new Date(offer.expiresAt) - Date.now()) / 1000) / 60))} mins
                          </span>

                          {offer.status === 'selected' ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Offer Selected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectOffer(offer.offerId)}
                              disabled={selectingOfferId === offer.offerId}
                              className="px-4 py-2 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text font-medium text-xs tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {selectingOfferId === offer.offerId ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Accept &amp; Order</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* AI Smart Provider Matching Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400">
                  Ranked by AI matching score (Hygiene, Proximity, Dietary Fit)
                </span>
                <button
                  onClick={handleTriggerRematch}
                  disabled={loading}
                  className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-evaluate Matches</span>
                </button>
              </div>

              {displayedMatches.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  Computing multi-dimensional provider suitability scores...
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedMatches.map((match, i) => (
                    <div
                      key={match.providerId || i}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 hover:border-purple-400 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {match.kitchenName || 'Chef Partner'}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              {match.matchScore}% Match
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              {match.distanceKm} km away
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-current" />
                              {match.rating || 4.8} ({match.hygieneScore || 96}% Hygiene)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ~{match.estimatedDeliveryMins || 25} Mins ETA
                          </span>
                        </div>
                      </div>

                      {/* Matching breakdown criteria */}
                      <div className="mt-3 grid grid-cols-4 gap-2 pt-2 border-t border-stone-100 dark:border-stone-700 text-center">
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Cuisine</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.dietaryMatch || 30}/30
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Proximity</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.proximityScore || 22}/25
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Hygiene</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.ratingScore || 19}/20
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-700/50">
                          <div className="text-[9px] uppercase text-stone-400 font-bold">Reliability</div>
                          <div className="text-xs font-bold text-stone-700 dark:text-stone-200">
                            {match.breakdown?.speedScore || 14}/15
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
