import React, { useEffect, useState, useRef } from 'react';

const SPICE_ITEMS = [
  {
    id: 1,
    name: 'Ceylon Cinnamon',
    type: 'Dalchini',
    desc: 'Delivers a subtle woody sweetness to regional slow-simmered curries.',
    length: 80, //px
    swayDuration: 4.6,
    swayDelay: 0.1,
    mobileHidden: true,
    tabletHidden: true,
    svg: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="drop-shadow-md">
        <defs>
          <linearGradient id="cinnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D29A6C" />
            <stop offset="50%" stopColor="#AC7D54" />
            <stop offset="100%" stopColor="#6E4522" />
          </linearGradient>
        </defs>
        <rect x="25" y="8" width="10" height="44" rx="2" transform="rotate(-15 30 30)" fill="url(#cinnGrad)" />
        <line x1="28" y1="10" x2="25" y2="50" stroke="#462B15" strokeWidth="1" transform="rotate(-15 30 30)" />
        <line x1="31" y1="10" x2="28" y2="50" stroke="#462B15" strokeWidth="1" transform="rotate(-15 30 30)" />
      </svg>
    )
  },
  {
    id: 2,
    name: 'Star Anise',
    type: 'Chakra Phool',
    desc: 'Infuses biryanis with a signature sweet, licorice-like aroma.',
    length: 130,
    swayDuration: 5.4,
    swayDelay: 0.4,
    mobileHidden: true,
    tabletHidden: false,
    svg: (
      <svg width="65" height="65" viewBox="0 0 65 65" fill="none" className="drop-shadow-md">
        <defs>
          <linearGradient id="aniseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DF9B63" />
            <stop offset="60%" stopColor="#8A5227" />
            <stop offset="100%" stopColor="#4A2910" />
          </linearGradient>
        </defs>
        <g transform="translate(32.5,32.5)">
          {[...Array(8)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 45})`}>
              <path d="M0 0 C-4 -12 -7 -22 0 -27 C7 -22 4 -12 0 0" fill="url(#aniseGrad)" />
              <ellipse cx="0" cy="-15" rx="1.8" ry="3" fill="#FFE5A3" opacity="0.9" />
            </g>
          ))}
        </g>
      </svg>
    )
  },
  {
    id: 3,
    name: 'Brass Ladle',
    type: 'Karchi',
    desc: 'Used to hand-stir micro-batch meals in traditional brass vessels.',
    length: 180, // Longest
    swayDuration: 6.2,
    swayDelay: 0.0,
    isSpecial: true,
    mobileHidden: false,
    tabletHidden: false,
    svg: (
      <svg width="70" height="70" viewBox="0 0 70 70" fill="none" className="drop-shadow-md">
        <defs>
          <linearGradient id="brassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9DF95" />
            <stop offset="50%" stopColor="#C99B3B" />
            <stop offset="100%" stopColor="#8C6A21" />
          </linearGradient>
        </defs>
        <rect x="33" y="10" width="4" height="42" rx="1.5" transform="rotate(35 35 35)" fill="url(#brassGrad)" />
        <circle cx="45" cy="46" r="10" fill="url(#brassGrad)" />
        <circle cx="43" cy="44" r="8" stroke="#FFEBA8" strokeWidth="0.5" fill="none" opacity="0.3" />
      </svg>
    )
  },
  {
    id: 4,
    name: 'Kashmiri Chilli',
    type: 'Lal Mirch',
    desc: 'Brings a mild warmth and a brilliant crimson hue to heritage curries.',
    length: 110,
    swayDuration: 5.0,
    swayDelay: 0.6,
    mobileHidden: false,
    tabletHidden: false,
    svg: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="drop-shadow-md">
        <defs>
          <linearGradient id="chilliGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4B3A" />
            <stop offset="50%" stopColor="#C21C1C" />
            <stop offset="100%" stopColor="#7A0B0B" />
          </linearGradient>
          <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>
        </defs>
        <path d="M30 8 C32 8 34 13 30 17 C28 14 27 11 30 8" fill="url(#stemGrad)" />
        <path d="M30 16 C36 21 37 31 33 44 C31 49 26 53 23 54 C22 52 26 44 29 34 C31 24 29 19 30 16" fill="url(#chilliGrad)" />
      </svg>
    )
  },
  {
    id: 5,
    name: 'Green Cardamom',
    type: 'Elaichi',
    desc: 'Provides a sweet, complex floral essence to heirloom desserts.',
    length: 150,
    swayDuration: 5.8,
    swayDelay: 0.2,
    mobileHidden: true,
    tabletHidden: true,
    svg: (
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="drop-shadow-md">
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BCE3A1" />
            <stop offset="50%" stopColor="#83AF5D" />
            <stop offset="100%" stopColor="#4E7035" />
          </linearGradient>
        </defs>
        <path d="M30 10 C41 16 43 40 30 48 C17 40 19 16 30 10Z" fill="url(#cardGrad)" />
        <path d="M30 10 C34 18 34 38 30 48" stroke="#3A5326" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <path d="M30 10 C26 18 26 38 30 48" stroke="#3A5326" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        <path d="M30 10 C29.5 8 30.5 8 30 6" stroke="#3A5326" strokeWidth="1.5" />
      </svg>
    )
  }
];

export default function HangingSpices() {
  const sectionRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full h-[520px] bg-bone-white overflow-hidden border-y border-sand-neutral/30 flex flex-col pt-10 select-none"
    >
      {/* Decorative brass supporting beam */}
      <div className="absolute top-0 left-8 right-8 h-[3px] bg-gradient-to-r from-clay-earth/20 via-clay-earth/65 to-clay-earth/20 rounded shadow-sm z-20" />

      {/* Grid container holding the ropes */}
      <div className="relative flex-1 w-full max-w-[1100px] mx-auto px-4 mt-2">
        <div className="relative w-full h-full flex justify-around items-start pt-3">
          {SPICE_ITEMS.map((item) => {
            const isHovered = hoveredId === item.id;
            const isHiddenClass = `${item.mobileHidden ? 'hidden' : 'flex'} ${item.tabletHidden ? 'md:hidden' : 'md:flex'} lg:flex`;

            return (
              <div
                key={item.id}
                className={`flex-col items-center relative ${isHiddenClass}`}
                style={{
                  height: '100%',
                  zIndex: isHovered ? 40 : 10
                }}
              >
                {/* Brass hook attachment ring */}
                <div className="absolute top-0 -mt-[8px] w-2 h-2 rounded-full border border-clay-earth bg-bone-white z-20" />

                {/* Swaying Rig */}
                <div
                  className="flex flex-col items-center origin-top transition-all duration-[1200ms]"
                  style={{
                    animation: hasStarted 
                      ? `sway-spice-${item.id} ${isHovered ? item.swayDuration * 0.55 : item.swayDuration}s infinite ease-in-out alternate`
                      : 'none',
                    transformOrigin: 'top center',
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Rope Line */}
                  <div
                    className="w-[1.2px] bg-gradient-to-b from-clay-earth to-[#5C4D3C] transition-all duration-[1400ms] cubic-bezier(0.19, 1, 0.22, 1) relative"
                    style={{
                      height: hasStarted ? `${item.length}px` : '0px',
                      transitionDelay: `${item.swayDelay}s`
                    }}
                  >
                    {/* Fiber twist shadow */}
                    <div className="absolute inset-y-0 left-0 w-full border-l border-dashed border-sand-neutral/30" />
                  </div>

                  {/* Knot connector */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-clay-earth border border-[#5C4D3C] -mt-[3px] transition-all duration-300 relative"
                    style={{
                      opacity: hasStarted ? 1 : 0,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />

                  {/* Spices container with transparent background */}
                  <div 
                    className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 flex items-center justify-center p-1 cursor-pointer transition-all duration-[1000ms] relative mt-2 z-10"
                    style={{
                      transform: isHovered ? 'scale(1.15) rotate(8deg)' : 'scale(1) rotate(0deg)',
                      opacity: hasStarted ? 1 : 0
                    }}
                  >
                    {item.svg}
                  </div>

                  {/* High contrast tooltip cards */}
                  <div
                    className={`absolute top-full mt-6 w-56 md:w-60 p-4 rounded-xl bg-surface-bright border border-clay-earth/30 shadow-[0_12px_30px_rgba(74,66,56,0.18)] transition-all duration-500 flex flex-col items-start text-left -translate-x-1/2 left-1/2 pointer-events-none z-50 ${
                      isHovered 
                        ? 'opacity-100 translate-y-0 scale-100 visible' 
                        : 'opacity-0 -translate-y-2 scale-95 invisible'
                    }`}
                  >
                    {/* Inset Border */}
                    <div className="absolute inset-1.5 border border-clay-earth/10 pointer-events-none rounded-lg" />
                    
                    <span className="font-label-caps text-[8px] uppercase text-clay-earth font-semibold tracking-widest bg-sand-neutral/30 px-2 py-0.5 rounded-md mb-1.5 z-10">
                      {item.type}
                    </span>
                    <h4 className="font-display-lg text-base text-onyx-black font-medium z-10">
                      {item.name}
                    </h4>
                    <p className="font-body-md text-[11px] text-secondary mt-1 z-10 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spices sway keyframes */}
      <style>{`
        @keyframes sway-spice-1 {
          0% { transform: rotate(-3.5deg); }
          100% { transform: rotate(3.5deg); }
        }
        @keyframes sway-spice-2 {
          0% { transform: rotate(-5deg); }
          100% { transform: rotate(5deg); }
        }
        @keyframes sway-spice-3 {
          0% { transform: rotate(-2deg); }
          100% { transform: rotate(2deg); }
        }
        @keyframes sway-spice-4 {
          0% { transform: rotate(-4.5deg); }
          100% { transform: rotate(4.5deg); }
        }
        @keyframes sway-spice-5 {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
      `}</style>
    </section>
  );
}
