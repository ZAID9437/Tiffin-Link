import React from 'react';
import { ArrowRight, UtensilsCrossed, ShieldCheck, Clock, Star } from 'lucide-react';

export default function Hero() {
  const handleScrollToRequest = () => {
    const el = document.getElementById('meal-request-form') || document.getElementById('find-tiffin');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#find-tiffin';
    }
  };

  return (
    <section className="min-h-screen relative w-full overflow-hidden flex flex-col justify-between pt-28 pb-12 px-4 sm:px-6 md:px-margin-desktop bg-[#120f0d]">
      {/* Cinematic Video Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          className="w-full h-full object-cover scale-105 parallax-img opacity-60"
        >
          <source src="/generate_one_local_indian_food.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Multilayered radial and linear contrast gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0a08]/85 via-[#120f0d]/50 to-[#120f0d]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(13,10,8,0.85)_100%)]"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#120f0d] to-transparent"></div>
      </div>

      {/* Hero Body Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex-1 flex flex-col items-center justify-center animate-fade-in my-auto py-10" id="hero-content">
        
        {/* Heritage Pill Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-bone-white text-xs font-semibold tracking-wider uppercase mb-6 sm:mb-8 shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-[#e08e45] animate-ping"></span>
          <span className="text-[#f5e6d3] text-[11px] font-mono tracking-widest">EST. 2024 • ARTISANAL HOMESTYLE DINING</span>
        </div>

        {/* Headline */}
        <h1 className="font-display-lg text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-bone-white font-normal tracking-tight leading-[1.08] mb-6 sm:mb-8 max-w-4xl text-balance">
          Home-cooked meals, crafted with ancestral patience.
        </h1>

        {/* Subtitle / Philosophy */}
        <p className="font-body-lg text-base sm:text-xl text-[#ded7cd] max-w-2xl mx-auto font-light leading-relaxed mb-8 sm:mb-10 text-balance">
          A culinary bridge between generational family kitchens and your everyday table. Delivered fresh in food-grade insulated canisters, exactly when your day calls for it.
        </p>

        {/* Primary & Secondary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10 sm:mb-12">
          <a
            href="#find-tiffin"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#d97706] to-[#b45309] text-white font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_12px_32px_rgba(217,119,6,0.35)] hover:shadow-[0_16px_40px_rgba(217,119,6,0.5)] hover:scale-[1.03] active:scale-95 cursor-pointer group"
          >
            <span>Order Today's Tiffin</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </a>

          <button
            onClick={handleScrollToRequest}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-bone-white font-semibold text-sm tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg"
          >
            <UtensilsCrossed size={17} className="text-[#f5c278]" />
            <span>Customize Meal Request</span>
          </button>
        </div>

        {/* Quick Regional Taste Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-2xl opacity-90">
          <span className="text-[11px] font-mono text-[#a89f91] uppercase tracking-wider mr-1">Daily Specials:</span>
          {['Gujarati Kathiawadi', 'Punjabi Dal Makhani', 'Malabar Coconut Stew', 'Pure Jain Satvik'].map((special) => (
            <a
              key={special}
              href="#find-tiffin"
              className="text-xs px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-[#f0ebe1] transition-all hover:border-[#d97706]/60 cursor-pointer"
            >
              {special}
            </a>
          ))}
        </div>

      </div>

      {/* Floating Trust Metrics Footer Ribbon */}
      <div className="relative z-10 max-w-4xl mx-auto w-full pt-8 sm:pt-10 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center shrink-0">
            <Star size={16} className="text-[#f59e0b] fill-[#f59e0b]" />
          </div>
          <div>
            <p className="text-sm font-bold text-bone-white">4.9 / 5 Rating</p>
            <p className="text-xs text-[#a89f91]">Over 25,000+ meals relished</p>
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-bone-white">Food-Grade 304</p>
            <p className="text-xs text-[#a89f91]">Zero-plastic steel canisters</p>
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#d97706]/15 border border-[#d97706]/30 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-[#f59e0b]" />
          </div>
          <div>
            <p className="text-sm font-bold text-bone-white">45-Min Fast Dispatch</p>
            <p className="text-xs text-[#a89f91]">Insulated thermal delivery</p>
          </div>
        </div>
      </div>
    </section>
  );
}
