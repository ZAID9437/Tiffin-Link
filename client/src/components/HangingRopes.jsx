import React, { useEffect, useState, useRef } from 'react';

const HANGING_ITEMS = [
  {
    id: 1,
    name: 'Traditional Filter Coffee',
    desc: 'Strong chicory blend, frothed with hot milk in a heritage brass tumbler.',
    image: '/assets/food_coffee.png',
    badge: 'Freshly Brewed',
    length: 130, //px
    swayDuration: 4.8, // seconds
    swayDelay: 0.2, // seconds
    mobileHidden: true,
    tabletHidden: true,
  },
  {
    id: 2,
    name: 'Artisanal Medu Vada',
    desc: 'Crispy lentil fritters served with hot sambar and fresh coconut chutney.',
    image: '/assets/food_vada.png',
    badge: 'Morning Fresh',
    length: 190,
    swayDuration: 5.6,
    swayDelay: 0.7,
    mobileHidden: true,
    tabletHidden: false,
  },
  {
    id: 3,
    name: 'Heritage Brass Tiffin',
    desc: 'A curated 3-tier meal of slow-cooked curry, heirloom rice, and hand-rolled rotis.',
    image: '/assets/indian_tiffin_heritage.png',
    badge: "Chef's Special",
    length: 280, // The Extra Long Rope!
    swayDuration: 6.4,
    swayDelay: 0.0,
    isSpecial: true, // Special animation (steam, glow)
    mobileHidden: false,
    tabletHidden: false,
  },
  {
    id: 4,
    name: 'Clay-Pot Dum Biryani',
    desc: 'Fragrant basmati rice layered with aromatic spices and saffron, cooked on charcoal dum.',
    image: '/assets/food_biryani.png',
    badge: 'Slow Cooked',
    length: 230,
    swayDuration: 5.2,
    swayDelay: 1.1,
    mobileHidden: false,
    tabletHidden: false,
  },
  {
    id: 5,
    name: 'Mumbai Vada Pav',
    desc: 'Golden potato dumpling inside a soft pav, laced with spicy garlic chutney.',
    image: '/assets/food_vada_pav.png',
    badge: 'Crispy & Spicy',
    length: 150,
    swayDuration: 4.2,
    swayDelay: 0.5,
    mobileHidden: true,
    tabletHidden: true,
  }
];

export default function HangingRopes() {
  const [inView, setInView] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
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
      className="relative w-full h-[760px] bg-bone-white overflow-hidden border-b border-sand-neutral/30 flex flex-col pt-12 select-none"
    >
      {/* Editorial Header */}
      <div className="text-center px-margin-mobile z-10 max-w-3xl mx-auto mb-6">
        <p className="font-label-caps text-label-caps text-secondary tracking-[0.2em] mb-3">ARTISANAL HARVEST</p>
        <h2 className="font-headline-lg text-4xl md:text-5xl text-onyx-black mb-4">
          Generations of flavor, suspended in time.
        </h2>
        <p className="font-body-md text-secondary max-w-xl mx-auto italic text-sm md:text-base">
          Hover over each hanging parcel to uncover culinary traditions kept alive in home kitchens.
        </p>
      </div>

      {/* Ropes & Beam Area */}
      <div className="relative flex-1 w-full max-w-[1200px] mx-auto px-4 mt-4">
        
        {/* Supporting Beam / Brass Rod */}
        <div className="absolute top-0 left-4 right-4 h-[3px] bg-gradient-to-r from-clay-earth via-sand-neutral to-clay-earth rounded z-20 shadow-sm" />

        {/* Rope Elements */}
        <div className="relative w-full h-full flex justify-around items-start pt-4">
          {HANGING_ITEMS.map((item) => {
            const isHovered = hoveredId === item.id;
            
            // Generate class name based on hidden flags
            let visibilityClass = "flex flex-col items-center absolute";
            if (item.mobileHidden) visibilityClass += " hidden lg:flex";
            else if (item.tabletHidden) visibilityClass += " hidden md:flex";
            else visibilityClass += " flex";

            // Left percentages for absolute positioning to space them evenly
            const leftPositions = {
              1: '10%',
              2: '30%',
              3: '50%',
              4: '70%',
              5: '90%'
            };

            return (
              <div
                key={item.id}
                className={visibilityClass}
                style={{
                  left: leftPositions[item.id],
                  transform: 'translateX(-50%)',
                  height: '100%',
                  zIndex: isHovered ? 30 : 10
                }}
              >
                {/* Ring/Hook attachment at the beam */}
                <div className="w-3.5 h-3.5 rounded-full border-2 border-clay-earth bg-bone-white -mt-[9px] z-20" />

                {/* Swaying Rig */}
                <div
                  className="flex flex-col items-center origin-top-center"
                  style={{
                    opacity: inView ? 1 : 0,
                    animation: inView 
                      ? `sway-${item.id} ${isHovered ? item.swayDuration * 0.6 : item.swayDuration}s infinite ease-in-out alternate`
                      : 'none',
                    transformOrigin: 'top center',
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Rope Line */}
                  <div 
                    className="w-[2px] bg-gradient-to-b from-clay-earth via-secondary/70 to-clay-earth relative transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    style={{
                      height: inView ? `${item.length}px` : '0px',
                      transitionDelay: `${item.swayDelay}s`
                    }}
                  >
                    {/* Rope texture effect using dashed border overlay */}
                    <div className="absolute inset-0 border-l border-dashed border-sand-neutral/40" />
                  </div>

                  {/* Knot / Loop right above the hook */}
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-clay-earth -mb-0.5 transition-opacity duration-500" 
                    style={{ opacity: inView ? 1 : 0 }}
                  />

                  {/* Hanging Item Anchor */}
                  <div 
                    className="relative cursor-pointer flex flex-col items-center transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    style={{
                      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                      opacity: inView ? 1 : 0,
                      transitionDelay: `${item.swayDelay}s`
                    }}
                  >
                    {/* Steam Animation (Only for Item 3 / Special Long Tiffin) */}
                    {item.isSpecial && (
                      <svg 
                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-14 h-16 pointer-events-none z-30" 
                        viewBox="0 0 40 60"
                      >
                        <path className="steam-line steam-line-1" d="M12,45 Q16,33 10,23 T14,5" fill="none" stroke="rgba(74, 66, 56, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
                        <path className="steam-line steam-line-2" d="M20,45 Q24,31 18,21 T22,3" fill="none" stroke="rgba(74, 66, 56, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
                        <path className="steam-line steam-line-3" d="M28,45 Q26,33 32,23 T28,5" fill="none" stroke="rgba(74, 66, 56, 0.45)" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}

                    {/* Ambient Glow behind the food */}
                    <div 
                      className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 -z-10 ${
                        item.isSpecial 
                          ? 'bg-secondary-container/50 scale-125' 
                          : 'bg-transparent'
                      } ${isHovered ? 'opacity-100 scale-150' : 'opacity-60'}`}
                    />

                    {/* Food Frame with Hook */}
                    <div className="relative group">
                      {/* Brass hook hanging the frame */}
                      <svg width="14" height="18" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth drop-shadow-sm" viewBox="0 0 14 18" fill="none">
                        <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                        <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                      </svg>

                      {/* Floating Food Image container */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center p-1 rounded-full border border-clay-earth/35 bg-surface-bright shadow-md overflow-hidden group-hover:border-clay-earth/60 transition-colors duration-500 mt-2 z-10">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-full select-none pointer-events-none transform group-hover:scale-110 transition-transform duration-700" 
                        />
                      </div>
                    </div>

                    <div
                      className={`absolute bottom-full mb-6 w-60 md:w-64 p-5 rounded-2xl bg-surface-bright border border-clay-earth/35 shadow-[0_15px_35px_rgba(74,66,56,0.22)] transition-all duration-500 flex flex-col items-start text-left -translate-x-1/2 left-1/2 pointer-events-none z-50 ${
                        isHovered 
                          ? 'opacity-100 translate-y-0 scale-100 visible' 
                          : 'opacity-0 translate-y-2 scale-95 invisible'
                      }`}
                    >
                      <span className="font-label-caps text-[9px] uppercase text-clay-earth font-semibold tracking-wider bg-sand-neutral/30 px-2 py-0.5 rounded-full mb-2">
                        {item.badge}
                      </span>
                      <h4 className="font-display-lg text-lg text-onyx-black font-medium leading-snug">
                        {item.name}
                      </h4>
                      <p className="font-body-md text-xs text-secondary mt-1.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Embedding Custom Keyframe Animations */}
      <style>{`
        @keyframes sway-1 {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        @keyframes sway-2 {
          0% { transform: rotate(-4deg); }
          100% { transform: rotate(4deg); }
        }
        @keyframes sway-3 {
          0% { transform: rotate(-5.5deg); }
          100% { transform: rotate(5.5deg); }
        }
        @keyframes sway-4 {
          0% { transform: rotate(-4.5deg); }
          100% { transform: rotate(4.5deg); }
        }
        @keyframes sway-5 {
          0% { transform: rotate(-3.5deg); }
          100% { transform: rotate(3.5deg); }
        }
        
        /* Steam Animation */
        .steam-line {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
        }
        .steam-line-1 {
          animation: steam-rise 4.5s infinite linear;
        }
        .steam-line-2 {
          animation: steam-rise 4.5s infinite linear 1.5s;
        }
        .steam-line-3 {
          animation: steam-rise 4.5s infinite linear 3s;
        }
        
        @keyframes steam-rise {
          0% {
            stroke-dashoffset: 40;
            opacity: 0;
            transform: translateY(0) scaleX(1);
          }
          15% {
            opacity: 0.65;
          }
          80% {
            opacity: 0.3;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
            transform: translateY(-28px) scaleX(1.3);
          }
        }
      `}</style>
    </section>
  );
}
