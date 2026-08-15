import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WhyChoose() {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const steps = [
    {
      label: "STEP 01",
      title: "Rigorous vetting, total tranquility.",
      description: "Every kitchen in our network undergoes a 4-stage audit for hygiene, skill, and source-transparency.",
      icon: "verified_user"
    },
    {
      label: "STEP 02",
      title: "Hyper-local sourcing.",
      description: "We prioritize ingredients sourced within a 50-mile radius of your kitchen to support local farms.",
      icon: "eco"
    },
    {
      label: "STEP 03",
      title: "Fluid scheduling options.",
      description: "On-demand or long-term subscriptions that adapt seamlessly to your shifting calendar.",
      icon: "schedule"
    },
    {
      label: "STEP 04",
      title: "Artisanal by design.",
      description: "Not just food, but a curated dining narrative delivered to your doorstep in sustainable, elegant packaging.",
      icon: "auto_awesome"
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      const totalScrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      
      let ratio = scrolled / totalScrollable;
      ratio = Math.max(0, Math.min(1, ratio));
      
      setProgress(ratio * 100);
      
      // Map scroll ratio to active index (4 zones)
      let active = 0;
      if (ratio > 0.16) active = 1;
      if (ratio > 0.50) active = 2;
      if (ratio > 0.83) active = 3;
      setActiveIndex(active);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNext = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const totalScrollable = rect.height - window.innerHeight;
    
    const nextIndex = (activeIndex + 1) % steps.length;
    const targetRatio = nextIndex / (steps.length - 1);
    
    const docScrollTop = window.pageYOffset + rect.top;
    const targetScrollY = docScrollTop + targetRatio * totalScrollable;
    
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  const handlePrev = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const totalScrollable = rect.height - window.innerHeight;
    
    const prevIndex = (activeIndex - 1 + steps.length) % steps.length;
    const targetRatio = prevIndex / (steps.length - 1);
    
    const docScrollTop = window.pageYOffset + rect.top;
    const targetScrollY = docScrollTop + targetRatio * totalScrollable;
    
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  const handleDotClick = (idx) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const totalScrollable = rect.height - window.innerHeight;
    
    const targetRatio = idx / (steps.length - 1);
    const docScrollTop = window.pageYOffset + rect.top;
    const targetScrollY = docScrollTop + targetRatio * totalScrollable;
    
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  return (
    <div ref={containerRef} className="relative h-[220vh] bg-onyx-black z-10">
      
      {/* Sticky Content Wrapper */}
      <div className="sticky top-[96px] h-[calc(100vh-96px)] w-full flex flex-col justify-between overflow-hidden bg-onyx-black text-bone-white z-10 px-margin-desktop pt-12 pb-24">
        
        {/* Soft glowing ambient lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="max-w-[1200px] mx-auto w-full relative z-10 flex flex-col flex-grow">
          <p className="font-label-caps text-label-caps opacity-50 mb-10 text-center tracking-[0.25em]">THE TIFFINLINK STANDARD</p>
          
          {/* Main Visual Layout */}
          <div className="relative flex-grow w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 min-h-[400px]">
            
            {/* Left/Right Navigation Arrows */}
            <button 
              onClick={handlePrev}
              className="absolute left-[-20px] lg:left-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/10 hover:border-white/30 bg-[#1A1A1A] flex items-center justify-center transition-all duration-300 active:scale-90 z-30 group"
              aria-label="Previous step"
            >
              <ChevronLeft size={20} className="text-white opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={handleNext}
              className="absolute right-[-20px] lg:right-[-60px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/10 hover:border-white/30 bg-[#1A1A1A] flex items-center justify-center transition-all duration-300 active:scale-90 z-30 group"
              aria-label="Next step"
            >
              <ChevronRight size={20} className="text-white opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Left Side: Timeline column (Centered vertically and horizontally on the left) */}
            <div className="relative w-full md:w-[35%] h-[80px] md:h-[300px] flex items-center justify-center z-10">
              
              {/* Vertical Line for Desktop */}
              <div className="absolute left-4 right-4 md:left-1/2 md:right-auto md:top-4 md:bottom-4 h-[2px] md:h-auto md:w-[2px] bg-white/10 rounded-full md:-translate-x-1/2 w-[calc(100%-32px)] md:w-[2px] top-1/2 -translate-y-1/2 md:translate-y-0">
                
                {/* Dynamic Scroll Progress segment */}
                <div 
                  className="absolute top-0 left-0 w-full md:w-full bg-sand-neutral transition-all duration-300 origin-left md:origin-top rounded-full shadow-[0_0_10px_rgba(222,217,209,0.5)]"
                  style={{ 
                    height: isMobile ? '100%' : `${progress}%`,
                    width: isMobile ? `${progress}%` : '100%'
                  }}
                />
                
                {/* Step Nodes (dots) */}
                {steps.map((step, idx) => {
                  const isActive = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;
                  const pos = (idx / (steps.length - 1)) * 100;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      className="absolute w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 z-20 focus:outline-none"
                      style={{ 
                        top: isMobile ? '50%' : `${pos}%`,
                        left: isMobile ? `${pos}%` : '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Outer ring */}
                      <div className={`w-full h-full rounded-full absolute inset-0 transition-all duration-500 border-2 ${
                        isCurrent 
                          ? 'bg-[#1A1A1A] border-sand-neutral shadow-[0_0_12px_rgba(222,217,209,0.6)] scale-125' 
                          : isActive 
                            ? 'bg-sand-neutral border-sand-neutral shadow-[0_0_6px_rgba(222,217,209,0.3)]'
                            : 'bg-[#1A1A1A] border-white/20 hover:border-white/40'
                      }`} />
                      
                      {/* Inner core */}
                      <div className={`w-1.5 h-1.5 rounded-full z-30 transition-all duration-500 ${
                        isCurrent ? 'bg-sand-neutral' : isActive ? 'bg-[#1A1A1A]' : 'bg-white/25'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Centered Details Card Column (Stable Vertical Position) */}
            <div className="relative w-full md:w-[60%] h-[260px] md:h-[240px] flex items-center justify-center z-10">
              {steps.map((step, idx) => {
                const isCurrent = idx === activeIndex;
                
                return (
                  <div
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] absolute p-8 md:p-10 rounded-2xl border flex flex-col justify-between cursor-pointer w-full h-[220px] md:h-[220px] ${
                      isCurrent
                        ? 'bg-[#1C1B1A]/90 border-white/15 text-bone-white opacity-100 scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.45)] translate-y-0 z-20 pointer-events-auto backdrop-blur-md'
                        : 'text-bone-white opacity-0 scale-95 translate-y-8 pointer-events-none z-10 border-transparent'
                    }`}
                  >
                    {/* Luxury inner thin border */}
                    <div className="absolute inset-2 border border-white/5 pointer-events-none rounded-xl" />

                    <div className="flex justify-between items-start mb-4 z-10">
                      {/* Pill Step Label */}
                      <span className={`font-label-caps text-[9px] font-bold px-3 py-1 rounded-md tracking-widest transition-all duration-500 ${
                        isCurrent 
                          ? 'bg-sand-neutral text-onyx-black shadow-[0_4px_12px_rgba(222,217,209,0.3)]' 
                          : 'bg-white/5 text-bone-white/40'
                      }`}>
                        {step.label}
                      </span>
                      
                      <span 
                        className={`material-symbols-outlined text-2xl transition-colors duration-500 ${
                          isCurrent ? 'text-sand-neutral' : 'text-white/30'
                        }`}
                        style={{ fontVariationSettings: "'FILL' 0" }}
                      >
                        {step.icon}
                      </span>
                    </div>

                    <div className="z-10">
                      <h3 className={`font-display-lg text-2xl md:text-3xl mb-3 transition-colors duration-500 ${
                        isCurrent ? 'text-bone-white font-medium' : 'text-bone-white/40'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`font-body-md text-xs md:text-sm leading-relaxed text-bone-white/80 transition-opacity duration-500 ${
                        isCurrent ? 'opacity-85' : 'opacity-30'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
