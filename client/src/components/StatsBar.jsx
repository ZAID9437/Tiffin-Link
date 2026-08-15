import React, { useState, useEffect, useRef } from 'react';
import { Users, ChefHat, Heart, MapPin, Clock } from 'lucide-react';

export default function StatsBar() {
  const sectionRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  
  const [val1, setVal1] = useState(0);
  const [val2, setVal2] = useState(0);
  const [val3, setVal3] = useState(0);
  const [val4, setVal4] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
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

  useEffect(() => {
    if (!hasStarted) return;

    const duration = 2000;
    const steps = 60;
    const intervalTime = duration / steps;

    const target1 = 12;
    const target2 = 450;
    const target3 = 98;
    const target4 = 15;

    let step = 0;

    const timer = setInterval(() => {
      step++;

      setVal1(Math.min(target1, Math.round((target1 / steps) * step)));
      setVal2(Math.min(target2, Math.round((target2 / steps) * step)));
      setVal3(Math.min(target3, Math.round((target3 / steps) * step)));
      setVal4(Math.min(target4, Math.round((target4 / steps) * step)));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [hasStarted]);

  const STATS_ITEMS = [
    {
      id: 1,
      icon: Users,
      value: `${val1}k+`,
      label: 'HAPPY CUSTOMERS',
      ropeLength: 100, //px
      swayDuration: 4.8, // seconds
      delay: 0.1
    },
    {
      id: 2,
      icon: ChefHat,
      value: val2,
      label: 'ARTISAN KITCHENS',
      ropeLength: 150,
      swayDuration: 5.8,
      delay: 0.3
    },
    {
      id: 3,
      icon: Heart,
      value: `${val3}%`,
      label: 'CLIENT RETENTION',
      ropeLength: 120,
      swayDuration: 5.2,
      delay: 0.2
    },
    {
      id: 4,
      icon: MapPin,
      value: val4,
      label: 'CITIES REACHED',
      ropeLength: 170,
      swayDuration: 6.2,
      delay: 0.4
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="relative bg-surface-container pt-8 pb-24 overflow-hidden border-b border-sand-neutral/30 select-none"
    >
      <div className="px-margin-desktop max-w-[1440px] mx-auto relative flex flex-col items-center">
        
        {/* Sleek Horizontal Supporting Rod */}
        <div className="absolute top-0 left-4 right-4 h-[3px] bg-gradient-to-r from-clay-earth/20 via-clay-earth/60 to-clay-earth/20 rounded z-20 shadow-sm" />

        {/* Hanging Signboards Grid */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 items-start justify-items-center pt-3">
          {STATS_ITEMS.map((item) => {
            const isHovered = hoveredId === item.id;
            
            return (
              <div 
                key={item.id} 
                className="flex flex-col items-center relative"
                style={{
                  height: '100%',
                  zIndex: isHovered ? 30 : 10
                }}
              >
                {/* Dual hanging rings at the rod */}
                <div className="absolute top-0 left-8 -mt-[9px] w-2.5 h-2.5 rounded-full border-2 border-clay-earth/60 bg-surface-container z-20" />
                <div className="absolute top-0 right-8 -mt-[9px] w-2.5 h-2.5 rounded-full border-2 border-clay-earth/60 bg-surface-container z-20" />

                {/* Swaying Rig */}
                <div
                  className="flex flex-col items-center origin-top-center transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  style={{
                    opacity: hasStarted ? 1 : 0,
                    animation: hasStarted 
                      ? `sway-stats-${item.id} ${isHovered ? item.swayDuration * 0.65 : item.swayDuration}s infinite ease-in-out alternate`
                      : 'none',
                    transformOrigin: 'top center',
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Dual Ropes Container */}
                  <div 
                    className="relative w-28 flex justify-between transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
                    style={{ 
                      height: hasStarted ? `${item.ropeLength}px` : '0px',
                      transitionDelay: `${item.delay}s`
                    }}
                  >
                    {/* Left Rope */}
                    <div className="w-[1.5px] bg-gradient-to-b from-clay-earth to-secondary/80 h-full relative">
                      <div className="absolute inset-0 border-l border-dashed border-sand-neutral/30" />
                    </div>
                    {/* Right Rope */}
                    <div className="w-[1.5px] bg-gradient-to-b from-clay-earth to-secondary/80 h-full relative">
                      <div className="absolute inset-0 border-l border-dashed border-sand-neutral/30" />
                    </div>
                  </div>

                  {/* Hanging Stat Card */}
                  <div 
                    className="relative bg-surface-bright border border-clay-earth/20 rounded-xl p-5 w-44 md:w-48 shadow-md hover:shadow-xl hover:border-clay-earth/35 transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275) flex flex-col items-center text-center -mt-[1px] z-10"
                    style={{
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      opacity: hasStarted ? 1 : 0,
                      transitionDelay: `${item.delay + 0.1}s`
                    }}
                  >
                    {/* Inset Border Line for menu look */}
                    <div className="absolute inset-1.5 border border-clay-earth/10 pointer-events-none rounded-lg" />
                    
                    {/* Stat Icon */}
                    <item.icon size={16} className="text-clay-earth/70 mb-2.5 z-10" />

                    {/* Numerical Value */}
                    <p className="font-display-lg text-3xl md:text-4xl text-onyx-black mb-1 z-10 font-medium">
                      {item.value}
                    </p>
                    
                    {/* Description Label */}
                    <p className="font-label-caps text-[8px] md:text-[9px] tracking-wider text-secondary z-10 whitespace-nowrap">
                      {item.label}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Stats Sway Keyframes */}
      <style>{`
        @keyframes sway-stats-1 {
          0% { transform: rotate(-2.5deg); }
          100% { transform: rotate(2.5deg); }
        }
        @keyframes sway-stats-2 {
          0% { transform: rotate(-3.5deg); }
          100% { transform: rotate(3.5deg); }
        }
        @keyframes sway-stats-3 {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        @keyframes sway-stats-4 {
          0% { transform: rotate(-4deg); }
          100% { transform: rotate(4deg); }
        }
      `}</style>
    </section>
  );
}
