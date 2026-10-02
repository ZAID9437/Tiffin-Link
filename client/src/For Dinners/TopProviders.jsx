import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronRight, ChevronLeft, Star, MapPin, Phone, ShieldCheck, X, Utensils } from 'lucide-react';
import use3DTilt from '../components/use3DTilt';

function ProviderCard({ provider, onSelect, onOrder }) {
  const tiltRef = use3DTilt(8, 1.01);

  return (
    <div 
      ref={tiltRef}
      onClick={() => onSelect && onSelect(provider)}
      className="min-w-[290px] md:min-w-[310px] bg-surface-bright rounded-2xl border border-clay-earth/20 p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden group/card transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(74,66,56,0.14)] hover:border-clay-earth/40"
    >
      {/* Luxury Inset Border */}
      <div className="absolute inset-2.5 border border-clay-earth/10 pointer-events-none rounded-xl z-0" />

      {/* Glare Sheen Layer */}
      <div className="tilt-glare absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 opacity-0 group-hover/card:opacity-100" />
      
      <div className="z-10">
        {/* Image & Rating */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sand-neutral/10 border border-clay-earth/10 shadow-sm">
          <img 
            src={provider.image || '/assets/provider_1.png'} 
            alt={provider.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
          />

          {/* Glass Rating Badge */}
          <span className="absolute top-3 right-3 bg-black/85 backdrop-blur-md text-white text-[11px] font-extrabold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20 z-20">
            ★ {provider.rating ? Number(provider.rating).toFixed(1) : '4.8'}
          </span>

          {/* Luxury Circular VIEW Badge on Hover (matching user screenshot) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            <span className="w-16 h-16 rounded-full bg-black/80 backdrop-blur-md text-white font-label-caps text-xs tracking-widest uppercase flex items-center justify-center border border-white/20 shadow-2xl scale-90 group-hover/card:scale-100 transition-transform duration-300">
              VIEW
            </span>
          </div>
        </div>

        {/* Info */}
        <h3 className="font-display-lg text-2xl text-onyx-black tracking-tight group-hover/card:text-clay-earth transition-colors duration-300 truncate mb-1 mt-4">
          {provider.name}
        </h3>
        <p className="text-xs text-secondary italic truncate mb-2">
          {provider.description || 'Authentic homestyle dining prepared fresh daily.'}
        </p>

        {/* Luxury Separator */}
        <div className="flex items-center justify-center gap-2 my-3 w-full opacity-60">
          <div className="h-[1px] bg-clay-earth/15 flex-1" />
          <span className="w-1.5 h-1.5 rotate-45 border border-clay-earth/30 bg-sand-neutral/50" />
          <div className="h-[1px] bg-clay-earth/15 flex-1" />
        </div>
      </div>

      <div className="z-10">
        {/* Details */}
        <div className="flex justify-between items-center text-secondary mb-3">
          <span className="font-label-caps text-[9px] tracking-wider flex items-center gap-1">
            <Clock size={11} className="text-secondary/70" />
            {provider.eta ? provider.eta.toUpperCase() : '20-30 MIN'}
          </span>
          <span className="font-display-lg text-lg text-clay-earth">
            ₹{provider.price || 120} <span className="font-label-caps text-[8px] text-secondary tracking-normal">/ MEAL</span>
          </span>
        </div>

        {/* Tag & Action */}
        <div className="flex justify-between items-center mt-4 pt-1 z-10">
          {/* Official Indian Food Classification Mark */}
          <div className="flex items-center gap-2">
            {/* Veg Indicator */}
            {(!provider.tags || provider.tags.some(t => t.toLowerCase().includes('pure veg'))) && (
              <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-[2px] bg-emerald-500/5 rounded-[2px] shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            )}
            {/* Jain Indicator */}
            {provider.tags && provider.tags.some(t => t.toLowerCase().includes('jain')) && (
              <div className="w-3.5 h-3.5 border border-sky-600 flex items-center justify-center p-[2px] bg-sky-500/5 rounded-[2px] shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              </div>
            )}
            {/* Non-Veg/Mixed Indicator */}
            {provider.tags && provider.tags.some(t => t.toLowerCase().includes('non-veg')) && (
              <div className="w-3.5 h-3.5 border border-rose-700 flex items-center justify-center p-[2px] bg-rose-500/5 rounded-[2px] shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-700" />
              </div>
            )}

            {/* Text Label */}
            <span className="font-label-caps text-[9px] text-secondary tracking-widest font-semibold uppercase">
              {provider.tags && provider.tags.length > 0 ? provider.tags[0] : 'PURE VEG'}
            </span>
          </div>
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOrder) onOrder(provider);
              else if (onSelect) onSelect(provider);
            }}
            className="text-[10px] font-label-caps font-bold text-onyx-black hover:text-clay-earth transition-all duration-300 flex items-center gap-0.5 cursor-pointer bg-sand-neutral/30 hover:bg-sand-neutral/60 px-2 py-0.5 rounded"
          >
            ORDER <span className="material-symbols-outlined text-[10px] translate-y-[0.5px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TopProviders({ onExplore, onSelectProvider }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModalProvider, setSelectedModalProvider] = useState(null);
  const scrollContainerRef = useRef(null);

  const fetchProviders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/providers');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch providers from API:', error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.7 
        : scrollLeft + clientWidth * 0.7;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleCardClick = (provider) => {
    setSelectedModalProvider(provider);
  };

  const handleOrderDirectly = (provider) => {
    if (onSelectProvider) {
      onSelectProvider(provider);
    } else {
      window.location.hash = `#find-tiffin?provider=${provider._id}`;
    }
  };

  return (
    <section className="pt-12 md:pt-section-gap pb-8 px-4 sm:px-6 md:px-margin-desktop bg-bone-white" id="kitchens">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 md:mb-12">
          <h2 className="font-bold text-2xl sm:text-3xl tracking-tight text-onyx-black">
            Top Tiffin Providers Near You
          </h2>
          <button 
            onClick={() => {
              if (onExplore) onExplore();
              else window.location.hash = '#find-tiffin';
            }}
            className="font-semibold text-onyx-black hover:opacity-50 flex items-center gap-1 transition-colors text-sm cursor-pointer"
          >
            View all providers <span className="text-base">→</span>
          </button>
        </div>

        {/* Slider Wrapper */}
        <div className="relative">
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 z-10 bg-sand-neutral/40 border border-sand-neutral/20 rounded-full p-3 shadow-md hover:bg-sand-neutral/80 transition-all active:scale-90 hidden md:flex items-center justify-center cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <ChevronLeft size={20} className="text-onyx-black" />
          </button>

          {/* Scroll Container */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 scrollbar-hide py-4 px-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {providers.map((provider) => (
              <ProviderCard 
                key={provider._id} 
                provider={provider} 
                onSelect={handleCardClick}
                onOrder={handleOrderDirectly}
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-10 bg-sand-neutral/40 border border-sand-neutral/20 rounded-full p-3 shadow-md hover:bg-sand-neutral/80 transition-all active:scale-90 hidden md:flex items-center justify-center cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            <ChevronRight size={20} className="text-onyx-black" />
          </button>
        </div>
      </div>

      {/* Provider Profile Information Modal */}
      {selectedModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Image Header */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-neutral/20">
              <img 
                src={selectedModalProvider.image || '/assets/provider_1.png'} 
                alt={selectedModalProvider.name}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedModalProvider(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="bg-[#1b5e20] text-white font-label-caps text-[10px] px-2.5 py-1 rounded-full uppercase font-bold flex items-center gap-1 shadow">
                  <ShieldCheck size={12} /> Verified Atelier
                </span>
                <span className="bg-black/80 backdrop-blur-md text-white font-label-caps text-[10px] px-2.5 py-1 rounded-full uppercase font-bold flex items-center gap-1 shadow">
                  ★ {selectedModalProvider.rating ? Number(selectedModalProvider.rating).toFixed(1) : '4.8'} ({selectedModalProvider.reviewCount || 18} reviews)
                </span>
              </div>
            </div>

            {/* Modal Body: Profile Information */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="font-display-lg text-2xl sm:text-3xl text-[#1a1a1a] tracking-tight">
                  {selectedModalProvider.name}
                </h3>
                <p className="text-sm text-[#665d52] mt-1 italic">
                  {selectedModalProvider.description || 'Homestyle regional delicacies cooked daily with unadulterated cold-pressed oils.'}
                </p>
              </div>

              {/* Kitchen Badges & Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#f5f3ef] p-3 rounded-xl border border-[#ded9d1]/60">
                  <p className="text-[10px] font-label-caps text-[#665d52] uppercase font-bold">Location</p>
                  <p className="text-xs font-semibold text-[#1a1a1a] mt-0.5 truncate flex items-center gap-1">
                    <MapPin size={12} className="text-[#a0522d]" />
                    {selectedModalProvider.address?.locality || 'Satellite'}, Ahmedabad
                  </p>
                </div>
                <div className="bg-[#f5f3ef] p-3 rounded-xl border border-[#ded9d1]/60">
                  <p className="text-[10px] font-label-caps text-[#665d52] uppercase font-bold">Starting Price</p>
                  <p className="text-xs font-semibold text-[#1a1a1a] mt-0.5">
                    ₹{selectedModalProvider.price || 120} / Meal
                  </p>
                </div>
                <div className="bg-[#f5f3ef] p-3 rounded-xl border border-[#ded9d1]/60 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-label-caps text-[#665d52] uppercase font-bold">Delivery ETA</p>
                  <p className="text-xs font-semibold text-[#1a1a1a] mt-0.5 flex items-center gap-1">
                    <Clock size={12} className="text-[#1b5e20]" />
                    {selectedModalProvider.eta || '20–30 MIN'}
                  </p>
                </div>
              </div>

              {/* FSSAI & Food Hygiene Details */}
              <div className="bg-sand-neutral/20 p-4 rounded-xl border border-clay-earth/20 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-700" />
                    FSSAI Certified Kitchen
                  </p>
                  <p className="text-[11px] text-[#665d52] mt-0.5 font-mono">
                    Lic. #{selectedModalProvider.fssaiNumber || '10721026000412'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#665d52] uppercase font-bold">Dispatch Hotline</p>
                  <p className="font-mono font-bold text-xs text-[#1a1a1a]">
                    {selectedModalProvider.mobile || '+91 98765 43210'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedModalProvider(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-[#ded9d1] text-xs font-bold text-[#4a4238] hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedModalProvider;
                    setSelectedModalProvider(null);
                    handleOrderDirectly(p);
                  }}
                  className="flex-[2] py-3 px-5 rounded-xl bg-[#1a1a1a] text-white hover:bg-[#a0522d] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Utensils size={14} />
                  <span>Customize & Order Meal →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
