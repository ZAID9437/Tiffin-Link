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
      style={{ filter: 'drop-shadow(0px 3px 6px rgba(74,66,56,0.08))' }}
    >
      <style>{`
        @keyframes indicator-sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-indicator-sway {
          animation: indicator-sway 4s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
 
      {/* Thin Dashed Rope */}
      <div 
        ref={ropeRef}
        className="w-[1.5px] border-l border-dashed border-clay-earth/60"
        style={{ height: '40px' }}
      />
 
      {/* Hanging Brass/Copper Icon Emblem */}
      <div className="w-8 h-8 rounded-full border border-clay-earth/40 bg-surface-bright flex items-center justify-center shadow-md animate-indicator-sway -mt-[1px] relative">
        {/* Double circular line detail */}
        <div className="absolute inset-[2px] border border-clay-earth/10 rounded-full" />
        
        {/* Cooking pot & spoon icon */}
        <span className="material-symbols-outlined text-clay-earth text-sm font-bold relative z-10 select-none">
          soup_kitchen
        </span>
      </div>
    </div>
  );
}
