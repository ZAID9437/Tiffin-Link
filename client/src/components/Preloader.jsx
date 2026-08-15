import React, { useEffect, useState } from 'react';

export default function Preloader({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [lettersActive, setLettersActive] = useState(false);
  const [lineActive, setLineActive] = useState(false);
  const [slideOut, setSlideOut] = useState(false);

  const brandName = "TiffinLink";

  useEffect(() => {
    // Phase 1: Reveal letters
    const letterTimer = setTimeout(() => {
      setLettersActive(true);
    }, 200);

    // Phase 2: Draw the line
    const lineTimer = setTimeout(() => {
      setLineActive(true);
    }, 1000);

    // Phase 3: Slide out the screen
    const slideOutTimer = setTimeout(() => {
      setSlideOut(true);
    }, 2000);

    // Phase 4: Unmount preloader
    const finishTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(letterTimer);
      clearTimeout(lineTimer);
      clearTimeout(slideOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[10000] bg-onyx-black flex flex-col items-center justify-center transition-transform duration-[1000ms] ease-[cubic-bezier(0.85,0,0.15,1)] ${
        slideOut ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="relative flex flex-col items-center select-none pointer-events-none">
        {/* Letters container */}
        <div className="flex overflow-hidden pb-4">
          {brandName.split("").map((char, index) => (
            <span
              key={index}
              className={`font-display-lg text-bone-white text-5xl md:text-7xl font-light tracking-tight transition-all duration-700 transform ${
                lettersActive 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-full opacity-0'
              }`}
              style={{ 
                transitionDelay: `${index * 60}ms`,
                fontFamily: "'EB Garamond', serif"
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Animated accent line */}
        <div className="w-48 h-[1px] overflow-hidden relative mt-2 bg-bone-white/10">
          <div 
            className={`absolute inset-0 bg-bone-white transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${
              lineActive ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </div>

        {/* Subtext */}
        <span 
          className={`font-label-caps text-[10px] text-bone-white/50 tracking-[0.3em] uppercase mt-6 transition-opacity duration-700 ${
            lineActive ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          Artisanal Dining Experience
        </span>
      </div>
    </div>
  );
}
