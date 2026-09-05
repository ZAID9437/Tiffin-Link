import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import use3DTilt from '../components/use3DTilt';

function ProviderCard({ provider }) {
  const tiltRef = use3DTilt(8, 1.01);

  return (
    <div 
      ref={tiltRef}
      className="min-w-[290px] md:min-w-[310px] bg-surface-bright rounded-2xl border border-clay-earth/20 p-5 flex flex-col justify-between cursor-hover-provider relative overflow-hidden group/card transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(74,66,56,0.14)] hover:border-clay-earth/40"
    >
      {/* Luxury Inset Border */}
      <div className="absolute inset-2.5 border border-clay-earth/10 pointer-events-none rounded-xl z-0" />

      {/* Glare Sheen Layer */}
      <div className="tilt-glare absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 opacity-0 group-hover/card:opacity-100" />
      
      <div className="z-10">
        {/* Image & Rating */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sand-neutral/10 border border-clay-earth/10 shadow-sm">
          <img 
            src={provider.image} 
            alt={provider.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
          />
          {/* Glass Rating Badge */}
          <span className="absolute top-3 right-3 bg-black/85 backdrop-blur-md text-white text-[11px] font-extrabold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20 z-20">
            ★ {provider.rating ? Number(provider.rating).toFixed(1) : '4.8'}
          </span>
        </div>

        {/* Info */}
        <h3 className="font-display-lg text-2xl text-onyx-black tracking-tight group-hover/card:text-clay-earth transition-colors duration-300 truncate mb-1 mt-4">
          {provider.name}
        </h3>
        <p className="text-xs text-secondary italic truncate mb-2">
          {provider.description}
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
            {provider.eta.toUpperCase()}
          </span>
          <span className="font-display-lg text-lg text-clay-earth">
            ₹{provider.price} <span className="font-label-caps text-[8px] text-secondary tracking-normal">/ MEAL</span>
          </span>
        </div>

        {/* Tag & Action */}
        {provider.tags && provider.tags.length > 0 && (
          <div className="flex justify-between items-center mt-4 pt-1 z-10">
            {/* Official Indian Food Classification Mark */}
            <div className="flex items-center gap-2">
              {/* Veg Indicator (Green Square + Circle) */}
              {provider.tags[0].toLowerCase() === 'pure veg' && (
                <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center p-[2px] bg-emerald-500/5 rounded-[2px] shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                </div>
              )}
              {/* Jain Indicator (Blue Square + Circle) */}
              {provider.tags[0].toLowerCase() === 'jain food' && (
                <div className="w-3.5 h-3.5 border border-sky-600 flex items-center justify-center p-[2px] bg-sky-500/5 rounded-[2px] shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                </div>
              )}
              {/* Non-Veg/Mixed Indicator (Brown/Red Square + Circle) */}
              {provider.tags[0].toLowerCase() === 'veg & non-veg' && (
                <div className="w-3.5 h-3.5 border border-rose-700 flex items-center justify-center p-[2px] bg-rose-500/5 rounded-[2px] shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-700" />
                </div>
              )}

              {/* Text Label */}
              <span className="font-label-caps text-[9px] text-secondary tracking-widest font-semibold uppercase">
                {provider.tags[0]}
              </span>
            </div>
            
            <span className="text-[9px] font-label-caps font-bold text-onyx-black opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-2 group-hover/card:translate-x-0 flex items-center gap-0.5">
              ORDER <span className="material-symbols-outlined text-[10px] translate-y-[0.5px]">arrow_forward</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TopProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);

  const fetchProviders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/providers');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Fallback local providers matching the screenshot data
      setProviders([
        {
          _id: "p1",
          name: "Mom's Kitchen",
          description: "Home-style Gujarati Food",
          rating: 4.9,
          eta: "30-40 min",
          price: 100,
          tags: ["Pure Veg"],
          image: "/assets/provider_1.png"
        },
        {
          _id: "p2",
          name: "Healthy Meals Kitchen",
          description: "High Protein & Healthy Meals",
          rating: 4.8,
          eta: "25-35 min",
          price: 110,
          tags: ["Pure Veg"],
          image: "/assets/provider_2.png"
        },
        {
          _id: "p3",
          name: "Ghar Ka Khana",
          description: "Authentic Homemade Food",
          rating: 4.7,
          eta: "20-30 min",
          price: 100,
          tags: ["Jain Food"],
          image: "/assets/provider_3.png"
        },
        {
          _id: "p4",
          name: "Shree Tiffin Service",
          description: "Simple, Hygienic & Tasty",
          rating: 4.9,
          eta: "30-40 min",
          price: 90,
          tags: ["Pure Veg"],
          image: "/assets/provider_4.png"
        },
        {
          _id: "p5",
          name: "Foodie Home Kitchen",
          description: "Variety Thalis & Tiffins",
          rating: 4.6,
          eta: "35-45 min",
          price: 120,
          tags: ["Veg & Non-Veg"],
          image: "/assets/provider_5.png"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(() => {
      fetchProviders();
    }, 4000); // 4-second live poll for real-time rating updates on Diner cards
    return () => clearInterval(interval);
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



  return (
    <section className="pt-section-gap pb-8 px-margin-desktop bg-bone-white" id="kitchens">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h2 className="font-bold text-3xl tracking-tight text-onyx-black">
            Top Tiffin Providers Near You
          </h2>
          <a className="font-semibold text-onyx-black hover:opacity-50 flex items-center gap-1 transition-colors text-sm" href="#">
            View all providers <span className="text-base">→</span>
          </a>
        </div>

        {/* Slider Wrapper */}
        <div className="relative">
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 z-10 bg-sand-neutral/40 border border-sand-neutral/20 rounded-full p-3 shadow-md hover:bg-sand-neutral/80 transition-all active:scale-90 hidden md:flex items-center justify-center"
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
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 z-10 bg-sand-neutral/40 border border-sand-neutral/20 rounded-full p-3 shadow-md hover:bg-sand-neutral/80 transition-all active:scale-90 hidden md:flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
          >
            <ChevronRight size={20} className="text-onyx-black" />
          </button>
        </div>
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
