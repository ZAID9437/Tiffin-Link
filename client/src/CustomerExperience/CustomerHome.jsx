import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { apiRequest } from '../services/api';

export default function CustomerHome({ onNavigate }) {
  const { location } = useLocation();
  const [activeDiet, setActiveDiet] = useState('veg');
  const [activeMealCat, setActiveMealCat] = useState('full');
  const [activeDate, setActiveDate] = useState('today');
  const [activeSlot, setActiveSlot] = useState('5:00 PM');
  const [handoverMode, setHandoverMode] = useState('delivery');
  const [kitchens, setKitchens] = useState([]);
  const [loadingKitchens, setLoadingKitchens] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchKitchens = async () => {
      try {
        const res = await apiRequest('/providers');
        if (isMounted) {
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          setKitchens(list);
        }
      } catch (err) {
        console.error('Failed to load kitchens:', err);
      } finally {
        if (isMounted) setLoadingKitchens(false);
      }
    };
    fetchKitchens();
    return () => { isMounted = false; };
  }, []);

  const mealCategories = [
    { id: 'full', emoji: '🍱', label: 'Full Tiffin', sub: '4 Roti, 2 Sabzi, Dal, Rice' },
    { id: 'quick', emoji: '🍛', label: 'Quick Lunch', sub: 'Bowl meals, Paratha box' },
    { id: 'dinner', emoji: '🌙', label: 'Evening Dinner', sub: 'Khichdi, Kadhi, Phulka' },
    { id: 'satvik', emoji: '🥗', label: 'Satvik / Healthy', sub: 'No Onion/Garlic, Millet' },
  ];

  const slots = ['12:30 PM', '1:30 PM', '5:00 PM', '7:30 PM', '8:30 PM'];
  const slotLabels = { '12:30 PM': 'Lunch', '1:30 PM': 'Lunch', '5:00 PM': 'Snack / Early', '7:30 PM': 'Dinner', '8:30 PM': 'Late Dinner' };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5]">
      {/* Tiffin Discovery Section Heading */}
      <div className="w-full bg-[#1a1a1a] py-3">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#4caf50] animate-pulse"></span>
            <span className="font-bold text-xs uppercase tracking-widest text-white">Find Tiffin Near You</span>
            <span className="hidden md:inline text-white/50 text-xs"> • {kitchens.length} Artisanal Kitchens Available</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/60 uppercase font-semibold">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('#home');
                else window.location.hash = '#home';
              }}
              className="text-white hover:text-white/80 transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Home</span>
            </button>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="hidden sm:inline">Dispatch Window: 12:00 – 14:30 &amp; 18:30 – 21:00</span>
            <span className="text-white">Ahmedabad West</span>
          </div>
        </div>
      </div>

      {/* Hero Discovery Console */}
      <section className="w-full relative overflow-hidden py-12 lg:py-20">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-8 lg:sticky lg:top-28">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#efeeea] rounded text-[#4a4238]">
                  <span className="material-symbols-outlined text-sm">search_off</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">Hyperlocal Tiffin Discovery</span>
                </div>
                <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl lg:text-5xl text-[#1a1a1a] tracking-tight leading-tight">
                  What would you like to eat today? 🍱
                </h1>
                <p className="text-lg text-[#665d52] max-w-md leading-relaxed">
                  Find fresh, authentic homemade tiffin crafted within 5 km of your doorstep. Cooked in brass and cast iron, delivered within minutes of leaving the flame.
                </p>
              </div>
              <div className="p-4 bg-[#f5f3ef] rounded-lg shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1b5e20] text-lg">verified_user</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Precise Geolocation</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1b5e20] bg-white px-2 py-0.5 rounded">GPS Active</span>
                </div>
                <p className="text-xs text-[#665d52] leading-relaxed">
                  Serving Satellite, Prahlad Nagar, Bodakdev &amp; Vastrapur zones. Radius locked to ≤ 4.8 km to ensure rotis stay pillowy soft.
                </p>
              </div>
              <div className="hidden lg:block text-xs font-semibold text-[#665d52] uppercase tracking-wider">
                "No commercial bases. No reused gravies. Just pure home hearths."
              </div>
            </div>

            {/* Right: Console Card */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#1a1a1a]"></div>
                <form className="space-y-8" onSubmit={e => { e.preventDefault(); onNavigate && onNavigate('nearby-tiffin-services'); }}>
                  {/* Location */}
                  <div className="bg-[#f5f3ef] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded bg-[#ded9d1]/60 flex items-center justify-center text-[#4a4238] flex-shrink-0">
                        <span className="material-symbols-outlined text-xl">near_me</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-[#665d52]">Delivering To</div>
                        <div className="text-lg font-semibold text-[#1a1a1a]">
                          {location?.address || 'Satellite, Ahmedabad'}
                        </div>
                        <div className="text-[11px] text-[#1b5e20] mt-0.5 font-semibold uppercase">
                          {location?.isCalibrated ? '✓ Real-time GPS location active • Hyperlocal radius active' : 'GPS location active • Hyperlocal radius active'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate && onNavigate('nearby-tiffin-services')}
                      className="text-xs font-semibold uppercase underline text-[#1a1a1a] hover:text-[#4a4238] transition-colors self-start sm:self-center cursor-pointer"
                      type="button"
                    >
                      Change Location
                    </button>
                  </div>

                  {/* Diet */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-[#1a1a1a]">1. Select Diet Hearth</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ id: 'veg', dot: 'bg-[#2e7d32]', label: '🟢 Pure Veg Hearth' }, { id: 'nonveg', dot: 'bg-[#c62828]', label: '🔴 Non-Veg Kitchen' }].map(d => (
                        <button key={d.id} type="button" onClick={() => setActiveDiet(d.id)}
                          className={`py-3.5 px-4 rounded flex items-center justify-center gap-2.5 transition-all ${activeDiet === d.id ? 'bg-[#1a1a1a] text-white shadow-md' : 'bg-[#efeeea] text-[#1a1a1a] hover:bg-[#ded9d1]/70'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full ${d.dot} border-2 border-white`}></span>
                          <span className="text-xs font-bold uppercase tracking-wider">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal Categories */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-[#1a1a1a]">2. Choose Meal Category</label>
                      <span className="text-xs text-[#665d52] font-semibold">Fresh Kitchen Batches</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {mealCategories.map(cat => (
                        <button key={cat.id} type="button" onClick={() => setActiveMealCat(cat.id)}
                          className={`text-left p-3.5 rounded flex flex-col justify-between h-28 transition-all ${activeMealCat === cat.id ? 'bg-[#1a1a1a] text-white shadow-sm' : 'bg-[#efeeea] text-[#1a1a1a] hover:bg-[#ded9d1]/60'}`}>
                          <span className="text-2xl">{cat.emoji}</span>
                          <div>
                            <div className="text-xs font-bold leading-tight">{cat.label}</div>
                            <div className={`text-[11px] ${activeMealCat === cat.id ? 'opacity-75' : 'text-[#665d52]'}`}>{cat.sub}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slot */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-[#1a1a1a]">3. Target Serving Slot</label>
                      <div className="flex gap-2">
                        {[{ id: 'today', label: 'Today (29 Sep)' }, { id: 'tomorrow', label: 'Tomorrow' }].map(d => (
                          <button key={d.id} type="button" onClick={() => setActiveDate(d.id)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeDate === d.id ? 'bg-[#1a1a1a] text-white' : 'bg-[#efeeea] text-[#665d52] hover:text-[#1a1a1a]'}`}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {slots.map(slot => (
                        <button key={slot} type="button" onClick={() => setActiveSlot(slot)}
                          className={`py-2.5 px-2 rounded text-center transition-all col-span-${slot === '8:30 PM' ? '2' : '1'} sm:col-span-1 ${activeSlot === slot ? 'bg-[#1a1a1a] text-white shadow-sm' : 'bg-[#efeeea] text-[#665d52] hover:bg-[#ded9d1]/60'}`}>
                          <div className={`text-[10px] font-bold uppercase ${activeSlot === slot ? 'text-[#ded9d1]' : ''}`}>{slotLabels[slot]}</div>
                          <div className={`text-xs font-semibold ${activeSlot === slot ? 'text-white' : 'text-[#1a1a1a]'}`}>{slot}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Handover */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-[#1a1a1a]">4. Handover Preference</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'delivery', label: '🚴 Doorstep Delivery', sub: 'Thermal bag direct to door', price: '₹20', green: false },
                        { id: 'pickup', label: '🏃 Self-Pickup', sub: 'Pick straight from home kitchen', price: 'FREE', green: true },
                      ].map(h => (
                        <label key={h.id} className={`cursor-pointer p-3.5 rounded flex items-center justify-between shadow-sm transition-colors ${handoverMode === h.id ? 'bg-[#eae8e4]' : 'bg-[#efeeea] hover:bg-[#eae8e4]'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="handover" value={h.id} checked={handoverMode === h.id} onChange={() => setHandoverMode(h.id)} className="w-4 h-4 accent-[#1a1a1a]" />
                            <div>
                              <div className="text-xs font-bold text-[#1a1a1a]">{h.label}</div>
                              <div className="text-xs text-[#665d52]">{h.sub}</div>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded bg-[#f5f3ef] ${h.green ? 'text-[#1b5e20]' : 'text-[#1a1a1a]'}`}>{h.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-[#1a1a1a] hover:bg-black text-white py-4 px-6 rounded flex items-center justify-between group shadow-xl transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-base tracking-wider uppercase font-semibold">Find Tiffin Near Me</span>
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-semibold uppercase">{kitchens.length} Kitchens Active</span>
                      </div>
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </button>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase text-[#665d52]">
                      <span>✓ 100% Escrow Protection</span>
                      <span>Avg Cook-To-Door: 28 Mins</span>
                      <span className="hidden sm:inline">Zero Canning or Frozen Puree</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="w-full bg-[#f5f3ef] py-12 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '⏱️', badge: 'Skillet Hot', badgeClass: 'text-[#1b5e20] bg-[#1b5e20]/10', title: '28 mins Avg Handover', desc: 'Dispatched straight from mother kitchens upon final phulka puffing. No prolonged warehouse consolidation.', bar: 'w-4/5' },
              { emoji: '🛡️', badge: 'FSSAI 100%', badgeClass: 'text-[#4a4238] bg-[#ded9d1]/50', title: 'Strict Hygiene Audits', desc: 'Every home chef undergoes on-site water quality checks, pest inspection, and mandatory stainless/brass utensil standards.', bar: 'w-full' },
              { emoji: '🍱', badge: 'Pure Harvest', badgeClass: 'text-[#1a1a1a] bg-[#f5f3ef]', title: 'Zero Preservatives', desc: 'Prepared purely in twice-daily batches. Unsold food is never stored overnight or reheated.', bar: 'w-11/12' },
            ].map((m, i) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded bg-[#f5f3ef] flex items-center justify-center text-xl">{m.emoji}</span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${m.badgeClass}`}>{m.badge}</span>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-[#1a1a1a]">{m.title}</div>
                  <p className="text-xs text-[#665d52] mt-1 leading-relaxed">{m.desc}</p>
                </div>
                <div className="h-1 w-full bg-[#efeeea] rounded-full overflow-hidden">
                  <div className={`h-full bg-[#1a1a1a] ${m.bar}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Kitchens */}
      <section className="w-full py-16 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-[#665d52] tracking-widest block">Hyperlocal Culinary Guild</span>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl lg:text-4xl text-[#1a1a1a] mt-1">Trending Kitchens Within 5 km</h2>
            </div>
            <button onClick={() => onNavigate && onNavigate('nearby-tiffin-services')} className="text-xs font-semibold uppercase underline text-[#1a1a1a] hover:text-[#4a4238] transition-colors flex items-center gap-1">
              <span>View All {kitchens.length > 0 ? `${kitchens.length} ` : ''}Kitchens</span>
              <span className="material-symbols-outlined text-sm">east</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingKitchens ? (
              <div className="col-span-1 md:col-span-3 text-center py-12 text-[#665d52]">
                <span className="material-symbols-outlined animate-spin text-2xl block mb-2">progress_activity</span>
                Loading nearby kitchens...
              </div>
            ) : kitchens.length === 0 ? (
              <div className="col-span-1 md:col-span-3 text-center py-12 bg-white rounded-xl border border-[#ded9d1]">
                <span className="material-symbols-outlined text-4xl text-[#a0988c] mb-2 block">storefront</span>
                <p className="font-semibold text-lg text-[#1a1a1a]">No kitchens found</p>
                <p className="text-sm text-[#665d52] mt-1">Check back soon as new culinary partners join your area.</p>
              </div>
            ) : (
              kitchens.slice(0, 3).map((k, i) => {
                const kName = k.name || k.kitchenName || 'Kitchen Partner';
                const kRating = k.rating || 0;
                const kReviews = k.reviewCount ? `${k.reviewCount}+` : '0';
                const kDist = k.distanceKm ? `${k.distanceKm} km away` : (k.distance ? `${k.distance}` : 'Nearby');
                const kBadge = k.foodType || k.cuisine || (k.tags && k.tags[0]) || 'Pure Veg';
                const kStatus = k.status === 'busy' ? 'Busy' : 'Accepting Orders';
                const kDesc = k.description || 'Authentic homestyle dining prepared with fresh ingredients.';
                const kPrice = k.price ? `₹${k.price}` : 'Custom Pricing';
                const kImg = k.image && k.image.startsWith('http') ? k.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

                return (
                  <div key={k._id || i} className="bg-white rounded-xl overflow-hidden shadow-lg group flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
                    <div className="relative h-60 w-full overflow-hidden bg-[#ded9d1]">
                      <img src={kImg} alt={kName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-wider rounded">{kBadge}</span>
                        <span className="px-2.5 py-1 bg-[#1b5e20] text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>{kStatus}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold uppercase text-[#1a1a1a]">{kDist}</div>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-semibold text-[#1a1a1a]">{kName}</h3>
                          <div className="flex items-center gap-1 bg-[#f5f3ef] px-2 py-0.5 rounded text-xs font-bold text-[#1a1a1a]">★ {kRating} <span className="text-[#665d52] font-normal text-[10px]">({kReviews})</span></div>
                        </div>
                        <p className="text-xs text-[#665d52] leading-relaxed">{kDesc}</p>
                      </div>
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-[#665d52]">
                          <span>Daily Menu Rotations</span>
                          <span className="text-[#1a1a1a]">{kPrice}</span>
                        </div>
                        <button onClick={() => onNavigate && onNavigate('provider-showcase')} className="w-full bg-[#f5f3ef] hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
                          Reserve Tiffin
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

