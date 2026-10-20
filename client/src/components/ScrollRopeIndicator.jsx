import React, { useEffect, useRef } from 'react';
 
export default function ScrollRopeIndicator({ view }) {
  const ropeRef = useRef(null);
 
  const updateHeight = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) : 0;
    
    if (ropeRef.current) {
      // Base length at start is 40px, extends up to 60% of current viewport height
      const maxTravel = window.innerHeight * 0.6;
      const currentHeight = 40 + scrollPercent * maxTravel;
      ropeRef.current.style.height = `${currentHeight}px`;
    }
  };

  useEffect(() => {
    let ticked = false;
 
    const handleScroll = () => {
      if (!ticked) {
        window.requestAnimationFrame(() => {
          updateHeight();
          ticked = false;
        });
        ticked = true;
      }
    };
 
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    updateHeight();
 
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Recalculate height when page view changes
  useEffect(() => {
    const timer = setTimeout(updateHeight, 100);
    return () => clearTimeout(timer);
  }, [view]);
 
  return (
    <div 
      className="fixed top-0 left-4 sm:left-8 z-50 pointer-events-none flex flex-col items-center"
      style={{ filter: 'drop-shadow(0px 3px 6px rgba(74,66,56,0.12))' }}
    >
      <style>{`
        @keyframes indicator-sway {
          0%, 100% { transform: rotate(-3.5deg); }
          50% { transform: rotate(3.5deg); }
        }
        .animate-indicator-sway {
          animation: indicator-sway 4s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
 
      {/* Ceiling Mounting Ring / Anchor (matching screenshot hardware) */}
      <div className="w-3.5 h-3.5 rounded-full border-2 border-[#4B3621] dark:border-[#D4AF37] bg-[#DFD3C3] dark:bg-[#2A2016] shadow-sm -mb-[2px] z-20" />

      {/* Solid Dark Brown Rope Cord */}
      <div 
        ref={ropeRef}
        className="w-[2px] bg-[#4B3621] dark:bg-[#D4AF37] rounded-full relative"
        style={{ height: '40px' }}
      />
 
      {/* Unified Swaying Emblem Assembly */}
      <div className="flex flex-col items-center animate-indicator-sway -mt-[2px] relative z-10">
        {/* Knot connection */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#4B3621] dark:bg-[#D4AF37] shadow-sm -mb-[2px] z-20" />
        
        {/* Ring eyelet attaching to emblem */}
        <div className="w-2.5 h-2.5 rounded-full border-2 border-[#4B3621] dark:border-[#D4AF37] bg-[#DFD3C3] dark:bg-[#2A2016] -mb-[3px] z-10" />

        {/* Hanging Brass/Copper Icon Emblem */}
        <div className="w-8 h-8 rounded-full border-2 border-[#4B3621] dark:border-[#D4AF37] bg-white dark:bg-[#1E1E22] flex items-center justify-center shadow-lg relative">
          {/* Double circular line detail */}
          <div className="absolute inset-[2px] border border-[#4B3621]/20 dark:border-[#D4AF37]/20 rounded-full" />
          
          {/* Cooking pot & spoon icon */}
          <span className="material-symbols-outlined text-[#4B3621] dark:text-[#D4AF37] text-sm font-bold relative z-10 select-none">
            soup_kitchen
          </span>
        </div>
      </div>
    </div>
  );
}
