import React, { useEffect, useRef } from 'react';

export default function ScrollMarquee() {
  const containerRef = useRef(null);
  const marqueeRef = useRef(null);
  
  const words = [
    "Ghar Ka Khana",
    "Zero Preservatives",
    "Artisanal Cooked Meals",
    "Regional Delicacies",
    "Local Home Chefs",
    "Slow Cooked",
    "Fresh Daily",
    "Pure Spices"
  ];

  useEffect(() => {
    let animationFrameId;
    let offset = 0;
    let baseSpeed = 0.8; // Base scroll speed (pixels per frame)
    let velocity = 0;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY;
      
      // Speed up or slow down marquee depending on scroll delta
      const deltaVelocity = diff * 0.08;
      velocity += deltaVelocity;
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const animate = () => {
      if (marqueeRef.current) {
        // Friction decay to return to baseline speed
        velocity *= 0.95;
        
        // Cumulative speed
        const currentSpeed = baseSpeed + velocity;
        offset -= currentSpeed;
        
        // Wrap around at 50% since we duplicate the items
        const halfWidth = marqueeRef.current.scrollWidth / 2;
        if (halfWidth > 0 && Math.abs(offset) >= halfWidth) {
          offset = 0;
        }
        
        marqueeRef.current.style.transform = `translateX(${offset}px)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="w-full bg-onyx-black text-bone-white py-6 overflow-hidden relative flex items-center border-y border-sand-neutral/10 select-none"
    >
      <div 
        ref={marqueeRef} 
        className="flex whitespace-nowrap will-change-transform"
      >
        {/* Render twice with shrink-0 to prevent layout collapse */}
        {[...Array(2)].map((_, loopIdx) => (
          <div key={loopIdx} className="flex items-center gap-8 px-4 shrink-0">
            {words.map((word, wordIdx) => (
              <React.Fragment key={wordIdx}>
                <span className="font-display-lg text-lg md:text-2xl font-light italic tracking-tight uppercase" style={{ fontFamily: "'EB Garamond', serif" }}>
                  {word}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-sand-neutral/30 block shrink-0" />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
