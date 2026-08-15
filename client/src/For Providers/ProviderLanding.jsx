import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Bot, 
  Zap, 
  BarChart3, 
  Check, 
  Play, 
  Star, 
  CheckCircle2,
  ChefHat,
  IndianRupee,
  Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';

// 1. Isolated Provider Hero Component to prevent re-renders
function ProviderHero({ onOpenBecomeProviderModal, handleConfettiTrigger }) {
  return (
    <header className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-48 pb-32">
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          className="w-full h-full object-cover"
        >
          <source src="/make_one_video_of_indian_chef.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-onyx-black/50"></div>
      </div>
      
      <div className="relative z-10 text-center px-margin-mobile max-w-4xl mx-auto flex flex-col items-center">
        <span className="font-label-caps text-label-caps text-bone-white opacity-85 mb-6 block uppercase tracking-[0.2em]">Partner with us</span>
        
        <h1 className="font-display-lg text-[32px] sm:text-[48px] md:text-[64px] lg:text-[76px] text-bone-white mb-10 leading-[1.05] tracking-tighter uppercase reveal-text">
          Turn Your Home Kitchen Into a Growing Business.
        </h1>
        
        <div className="flex items-start gap-6 max-w-xl mb-12">
          <div className="w-px h-16 bg-bone-white/30 hidden md:block mt-1"></div>
          <p className="font-body-lg text-body-lg text-bone-white/90 italic leading-relaxed text-center md:text-left">
            A sophisticated platform designed for artisanal home chefs. Manage orders, track real-time earnings, and connect with a curated local community.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-8 items-center justify-center">
          <button 
            onClick={handleConfettiTrigger}
            className="bg-bone-white text-onyx-black hover:bg-clay-earth hover:text-bone-white px-10 py-5 font-button-text text-button-text uppercase tracking-widest transition-all duration-500 scale-100 active:scale-95 border-0 rounded-none cursor-pointer magnetic"
          >
            Become a Provider
          </button>
        </div>
      </div>
    </header>
  );
}

// 2. Isolated Stats Component to confine count-up re-renders
function ProviderStats() {
  const statsSectionRef = useRef(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const [hoveredStatId, setHoveredStatId] = useState(null);
  
  const [val1, setVal1] = useState(0);
  const [val2, setVal2] = useState(0);
  const [val3, setVal3] = useState(0);
  const [val4, setVal4] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (statsSectionRef.current) {
      observer.observe(statsSectionRef.current);
    }

    return () => {
      if (statsSectionRef.current) {
        observer.unobserve(statsSectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!statsStarted) return;

    const duration = 2000;
    const steps = 60;
    const intervalTime = duration / steps;

    const target1 = 1200; 
    const target2 = 48;   
    const target3 = 150;  
    const target4 = 49;   

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
  }, [statsStarted]);

  const PROVIDER_STATS_ITEMS = [
    {
      id: 1,
      icon: ChefHat,
      value: val1.toLocaleString() + '+',
      label: 'VERIFIED KITCHENS',
      ropeLength: 100,
      swayDuration: 4.8,
      delay: 0.1
    },
    {
      id: 2,
      icon: IndianRupee,
      value: `₹${(val2 / 10).toFixed(1)}M`,
      label: 'TOTAL EARNINGS',
      ropeLength: 150,
      swayDuration: 5.8,
      delay: 0.3
    },
    {
      id: 3,
      icon: Utensils,
      value: val3 + 'k+',
      label: 'MEALS DELIVERED',
      ropeLength: 120,
      swayDuration: 5.2,
      delay: 0.2
    },
    {
      id: 4,
      icon: Star,
      value: `${(val4 / 10).toFixed(1)}/5`,
      label: 'AVERAGE RATING',
      ropeLength: 170,
      swayDuration: 6.2,
      delay: 0.4
    }
  ];

  return (
    <section 
      ref={statsSectionRef} 
      className="relative bg-bone-white pt-8 pb-24 overflow-hidden border-b border-sand-neutral/30 select-none"
    >
      <div className="px-margin-desktop max-w-[1440px] mx-auto relative flex flex-col items-center">
        <div className="absolute top-0 left-4 right-4 h-[3px] bg-gradient-to-r from-clay-earth/20 via-clay-earth/60 to-clay-earth/20 rounded z-20 shadow-sm" />

        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 items-start justify-items-center pt-3">
          {PROVIDER_STATS_ITEMS.map((item) => {
            const isHovered = hoveredStatId === item.id;
            
            return (
              <div 
                key={item.id} 
                className="flex flex-col items-center relative"
                style={{
                  height: '100%',
                  zIndex: isHovered ? 30 : 10
                }}
              >
                <div className="absolute top-0 left-8 -mt-[9px] w-2.5 h-2.5 rounded-full border-2 border-clay-earth/60 bg-bone-white z-20" />
                <div className="absolute top-0 right-8 -mt-[9px] w-2.5 h-2.5 rounded-full border-2 border-clay-earth/60 bg-bone-white z-20" />

                <div
                  className="flex flex-col items-center origin-top-center transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  style={{
                    opacity: statsStarted ? 1 : 0,
                    animation: statsStarted 
                      ? `sway-provider-stats-${item.id} ${isHovered ? item.swayDuration * 0.65 : item.swayDuration}s infinite ease-in-out alternate`
                      : 'none',
                    transformOrigin: 'top center',
                  }}
                  onMouseEnter={() => setHoveredStatId(item.id)}
                  onMouseLeave={() => setHoveredStatId(null)}
                >
                  <div 
                    className="relative w-28 flex justify-between transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
                    style={{ 
                      height: statsStarted ? `${item.ropeLength}px` : '0px',
                      transitionDelay: `${item.delay}s`
                    }}
                  >
                    <div className="w-[1.5px] bg-gradient-to-b from-clay-earth to-secondary/80 h-full relative">
                      <div className="absolute inset-0 border-l border-dashed border-sand-neutral/30" />
                    </div>
                    <div className="w-[1.5px] bg-gradient-to-b from-clay-earth to-secondary/80 h-full relative">
                      <div className="absolute inset-0 border-l border-dashed border-sand-neutral/30" />
                    </div>
                  </div>

                  <div 
                    className="relative bg-surface-bright border border-clay-earth/20 rounded-xl p-5 w-44 md:w-48 shadow-md hover:shadow-xl hover:border-clay-earth/35 transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275) flex flex-col items-center text-center -mt-[1px] z-10"
                    style={{
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      opacity: statsStarted ? 1 : 0,
                      transitionDelay: `${item.delay + 0.1}s`
                    }}
                  >
                    <div className="absolute inset-1.5 border border-clay-earth/10 pointer-events-none rounded-lg" />
                    <item.icon size={16} className="text-clay-earth/70 mb-2.5 z-10" />
                    <p className="font-display-lg text-3xl md:text-4xl text-onyx-black mb-1 z-10 font-medium">
                      {item.value}
                    </p>
                    <p className="font-label-caps text-[8px] md:text-[9px] tracking-wider text-secondary z-10 whitespace-nowrap uppercase">
                      {item.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes sway-provider-stats-1 {
          0% { transform: rotate(-2.5deg); }
          100% { transform: rotate(2.5deg); }
        }
        @keyframes sway-provider-stats-2 {
          0% { transform: rotate(-3.5deg); }
          100% { transform: rotate(3.5deg); }
        }
        @keyframes sway-provider-stats-3 {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        @keyframes sway-provider-stats-4 {
          0% { transform: rotate(-4deg); }
          100% { transform: rotate(4deg); }
        }
      `}</style>
    </section>
  );
}

// 3. Isolated Features Component to confine hover state re-renders
function ProviderFeatures() {
  const [hoveredFeatureId, setHoveredFeatureId] = useState(null);

  const FEATURE_ITEMS = [
    {
      id: 1,
      iconName: 'psychology',
      title: 'AI Smart Matching',
      description: 'Our proprietary algorithm connects your specific culinary niche with customers who crave exactly what you create.',
      ropeLength: 100,
      swayDuration: 5.4,
      delay: 0.1
    },
    {
      id: 2,
      iconName: 'dashboard',
      title: 'Real-Time Management',
      description: 'A unified dashboard to track ingredients, orders, and delivery windows with architectural precision.',
      ropeLength: 140,
      swayDuration: 6.0,
      delay: 0.3
    },
    {
      id: 3,
      iconName: 'shield_with_heart',
      title: 'Secure Infrastructure',
      description: 'Enterprise-grade payment processing with instant payouts and comprehensive liability protection.',
      ropeLength: 110,
      swayDuration: 5.0,
      delay: 0.2
    }
  ];

  return (
    <section className="py-32 px-margin-desktop max-w-[1440px] mx-auto reveal-on-scroll relative">
      <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
        <div className="max-w-2xl text-left">
          <span className="font-label-caps text-label-caps text-secondary mb-4 block uppercase tracking-widest">Efficiency Redefined</span>
          <h2 className="font-display-lg text-[32px] sm:text-[48px] md:text-[56px] leading-[1.1] uppercase tracking-tighter reveal-text">
            An ecosystem built for modern entrepreneurs.
          </h2>
        </div>
        <div className="flex items-start gap-4 max-w-xs text-left">
          <div className="w-px h-16 bg-sand-neutral hidden md:block"></div>
          <p className="font-body-md text-secondary leading-relaxed italic">
            We handle the logistics so you can focus on the craft of culinary storytelling.
          </p>
        </div>
      </div>

      <div className="relative pt-8 min-h-[460px]">
        <div className="absolute top-0 left-4 right-4 h-[3px] bg-gradient-to-r from-clay-earth/20 via-clay-earth/60 to-clay-earth/20 rounded z-20 shadow-sm" />

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 items-start justify-items-center pt-3">
          {FEATURE_ITEMS.map((item) => {
            const isHovered = hoveredFeatureId === item.id;
            
            return (
              <div 
                key={item.id} 
                className="flex flex-col items-center relative"
                style={{
                  height: '100%',
                  zIndex: isHovered ? 30 : 10
                }}
              >
                <div className="absolute top-0 left-12 -mt-[9px] w-2.5 h-2.5 rounded-full border-2 border-clay-earth/60 bg-background z-20" />
                <div className="absolute top-0 right-12 -mt-[9px] w-2.5 h-2.5 rounded-full border-2 border-clay-earth/60 bg-background z-20" />

                <div
                  className="flex flex-col items-center origin-top-center transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                  style={{
                    animation: `sway-feature-${item.id} ${isHovered ? item.swayDuration * 0.65 : item.swayDuration}s infinite ease-in-out alternate`,
                    transformOrigin: 'top center',
                  }}
                  onMouseEnter={() => setHoveredFeatureId(item.id)}
                  onMouseLeave={() => setHoveredFeatureId(null)}
                >
                  <div 
                    className="relative w-36 flex justify-between transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
                    style={{ 
                      height: `${item.ropeLength}px`
                    }}
                  >
                    <div className="w-[1.5px] bg-gradient-to-b from-clay-earth to-secondary/80 h-full relative">
                      <div className="absolute inset-0 border-l border-dashed border-sand-neutral/30" />
                    </div>
                    <div className="w-[1.5px] bg-gradient-to-b from-clay-earth to-secondary/80 h-full relative">
                      <div className="absolute inset-0 border-l border-dashed border-sand-neutral/30" />
                    </div>
                  </div>

                  <div 
                    className="relative bg-bone-white border border-sand-neutral hover:border-clay-earth/40 hover:bg-white rounded-none p-10 w-80 md:w-88 shadow-md hover:shadow-xl transition-all duration-[1200ms] cubic-bezier(0.175, 0.885, 0.32, 1.275) flex flex-col items-center text-center -mt-[1px] z-10 cursor-hover-category"
                    style={{
                      transform: isHovered ? 'scale(1.03) rotate(0.5deg)' : 'scale(1)'
                    }}
                  >
                    <div className="absolute inset-2 border border-clay-earth/5 pointer-events-none rounded-none" />
                    
                    <span className="material-symbols-outlined text-4xl mb-6 text-secondary group-hover:text-onyx-black">
                      {item.iconName}
                    </span>

                    <h3 className="font-display-lg text-2xl mb-4 uppercase tracking-wide">
                      {item.title}
                    </h3>

                    <p className="font-body-md text-secondary leading-relaxed normal-case">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes sway-feature-1 {
          0% { transform: rotate(-2deg); }
          100% { transform: rotate(2deg); }
        }
        @keyframes sway-feature-2 {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        @keyframes sway-feature-3 {
          0% { transform: rotate(-2.5deg); }
          100% { transform: rotate(2.5deg); }
        }
      `}</style>
    </section>
  );
}

export default function ProviderLanding({ onOpenBecomeProviderModal }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Reveal on scroll logic
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          if (entry.target.classList.contains('reveal-text')) {
            entry.target.querySelectorAll('.reveal-char').forEach(char => {
              char.classList.add('active');
            });
          }
        }
      });
    }, observerOptions);

    // Dynamic Character Splitting for reveal-text headers
    const textRevealElements = document.querySelectorAll('.reveal-text');
    textRevealElements.forEach(element => {
      if (element.querySelector('.reveal-char')) return; // Prevent duplicate split
      const text = element.textContent || '';
      element.innerHTML = '';
      const words = text.split(' ');
      let charIndex = 0;
      
      words.forEach((word, wordIdx) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'inline-block whitespace-nowrap';
        
        word.split('').forEach((char) => {
          const span = document.createElement('span');
          span.textContent = char;
          span.className = 'reveal-char';
          span.style.transitionDelay = `${charIndex * 15}ms`;
          wordSpan.appendChild(span);
          charIndex++;
        });
        
        element.appendChild(wordSpan);
        
        // Add a space after the word if it's not the last word
        if (wordIdx < words.length - 1) {
          const space = document.createElement('span');
          space.textContent = '\u00A0'; // non-breaking space
          space.className = 'reveal-char';
          space.style.transitionDelay = `${charIndex * 15}ms`;
          element.appendChild(space);
          charIndex++;
        }
      });
      observer.observe(element);
    });

    const revealElements = document.querySelectorAll('.reveal, .reveal-on-scroll, .line-draw');
    revealElements.forEach(el => observer.observe(el));

    // Navbar scroll handler
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Trigger immediate animation of Hero text on mount
    setTimeout(() => {
      const heroRevealText = document.querySelector('header .reveal-text');
      if (heroRevealText) {
        heroRevealText.classList.add('active');
        heroRevealText.querySelectorAll('.reveal-char').forEach(char => {
          char.classList.add('active');
        });
      }
    }, 150);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleConfettiTrigger = () => {
    confetti({
      particleCount: 150,
      spread: 85,
      origin: { y: 0.8 },
      colors: ['#F5F3EF', '#1A1A1A', '#665d52', '#DED9D1']
    });
    onOpenBecomeProviderModal();
  };

  return (
    <div className="bg-background text-onyx-black font-body-md overflow-x-hidden min-h-screen selection:bg-onyx-black selection:text-bone-white">
      
      {/* Provider Hero */}
      <ProviderHero 
        onOpenBecomeProviderModal={onOpenBecomeProviderModal} 
        handleConfettiTrigger={handleConfettiTrigger} 
      />

      {/* Decorative Line Draw */}
      <div className="line-draw w-full h-[1px] bg-sand-neutral/30"></div>

      {/* Provider Stats */}
      <ProviderStats />

      {/* Provider Features */}
      <ProviderFeatures />

      {/* Decorative Line Draw */}
      <div className="line-draw w-full h-[1px] bg-sand-neutral/30"></div>

      {/* Dashboard Preview (Editorial Reveal) */}
      <section id="demo-section" className="py-32 bg-onyx-black text-bone-white overflow-hidden px-margin-desktop">
        <div className="max-w-[1440px] mx-auto grid grid-cols-12 gap-gutter items-center">
          
          <div className="col-span-12 lg:col-span-5 mb-16 lg:mb-0 reveal-on-scroll">
            <span className="font-label-caps text-label-caps text-sand-neutral mb-6 block tracking-[0.2em] uppercase">The Interface</span>
            <h2 className="font-display-lg text-[32px] sm:text-[48px] md:text-[56px] leading-[1.1] mb-8 uppercase tracking-tighter reveal-text">
              Clarity in every data point.
            </h2>
            
            <div className="space-y-8 mt-10">
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full border border-sand-neutral/30 flex items-center justify-center shrink-0 text-sm font-label-caps font-bold">1</div>
                <div>
                  <h4 className="font-display-lg text-xl mb-2 uppercase tracking-wide">Revenue Overview</h4>
                  <p className="text-sand-neutral/70 font-body-md leading-relaxed">Visualize growth with granular filtering by week, month, or menu item.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full border border-sand-neutral/30 flex items-center justify-center shrink-0 text-sm font-label-caps font-bold">2</div>
                <div>
                  <h4 className="font-display-lg text-xl mb-2 uppercase tracking-wide">Order Analytics</h4>
                  <p className="text-sand-neutral/70 font-body-md leading-relaxed">Understand peak demand times and optimize your kitchen workflow.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-12 lg:col-span-7 relative reveal-on-scroll flex justify-center items-center overflow-hidden">
            <div className="bg-white/5 p-4 border border-white/10 rounded-none w-full h-full">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                preload="auto"
                className="w-full h-auto shadow-2xl transition-transform duration-700 hover:scale-[1.03]"
              >
                <source src="/make_one_video_showing_earning.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-clay-earth/20 blur-3xl rounded-full pointer-events-none"></div>
          </div>

        </div>
      </section>

      {/* Benefits (Narrative Section) */}
      <section className="py-32 px-margin-desktop">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-section-gap items-center">
          
          <div className="order-2 lg:order-1 relative flex justify-center items-center overflow-hidden">
            <div className="aspect-[4/5] bg-sand-neutral overflow-hidden reveal-on-scroll w-full max-w-[480px]">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                preload="auto"
                className="w-full h-full object-cover mix-blend-multiply opacity-85 transition-transform duration-1000 hover:scale-105"
              >
                <source src="/make_one_video_of_Indian_woman.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="absolute -top-12 -right-12 w-2/3 h-2/3 border border-sand-neutral -z-10"></div>
          </div>
          
          <div className="order-1 lg:order-2 reveal-on-scroll">
            <span className="font-label-caps text-label-caps text-secondary mb-6 block tracking-widest uppercase">Your Freedom</span>
            
            <h2 className="font-display-lg text-[32px] sm:text-[48px] md:text-[56px] leading-[1.1] mb-12 uppercase tracking-tighter reveal-text">
              Scale without the overhead noise.
            </h2>
            
            <div className="space-y-12">
              <div className="border-l border-sand-neutral pl-8 py-2">
                <h4 className="font-display-lg text-2xl mb-4 italic uppercase">Zero Marketing Costs</h4>
                <p className="font-body-md text-secondary max-w-md leading-relaxed">
                  Access an established network of high-intent customers immediately. We handle the digital presence so you can focus on the flavor.
                </p>
              </div>
              
              <div className="border-l border-sand-neutral pl-8 py-2">
                <h4 className="font-display-lg text-2xl mb-4 italic uppercase">Complete Autonomy</h4>
                <p className="font-body-md text-secondary max-w-md leading-relaxed">
                  Define your availability, set your pricing, and manage your kitchen capacity with complete flexibility. You are the architect of your time.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Decorative Line Draw */}
      <div className="line-draw w-full h-[1px] bg-sand-neutral/30"></div>

      {/* Pricing */}
      <section id="pricing-section" className="py-32 bg-bone-white px-margin-desktop">
        <div className="max-w-[1440px] mx-auto text-center mb-24 reveal-on-scroll">
          <span className="font-label-caps text-label-caps text-secondary mb-4 block uppercase tracking-[0.3em]">No Subscriptions</span>
          <h2 className="font-display-lg text-[32px] sm:text-[48px] md:text-[56px] leading-[1.1] uppercase tracking-tighter reveal-text">
            Simple, Transactional Pricing.
          </h2>
        </div>

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <div className="col-span-12 lg:col-span-6 reveal-on-scroll pr-0 lg:pr-12 text-left">
            <h3 className="font-display-lg text-4xl mb-6 uppercase tracking-tight">Zero upfront risk. <br/><span className="italic text-secondary">Pay only when you earn.</span></h3>
            <p className="font-body-lg text-body-lg text-secondary mb-8 leading-relaxed normal-case">
              We believe in partnerships, not gatekeeping. That is why TiffinLink charges absolutely <strong className="text-onyx-black font-semibold">zero monthly subscription fees</strong>, zero activation costs, and zero hidden platform maintenance rates.
            </p>
            <div className="border-t border-sand-neutral/50 pt-8 flex gap-8">
              <div>
                <span className="block text-4xl font-display-lg text-onyx-black">₹0</span>
                <span className="text-secondary font-label-caps text-xs tracking-wider uppercase">Setup Fee</span>
              </div>
              <div className="border-l border-sand-neutral/50 pl-8">
                <span className="block text-4xl font-display-lg text-onyx-black">₹0</span>
                <span className="text-secondary font-label-caps text-xs tracking-wider uppercase">Monthly Cost</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 reveal-on-scroll mt-12 lg:mt-0 text-left">
            <div className="bg-onyx-black text-bone-white p-12 border border-onyx-black flex flex-col h-full shadow-2xl relative rounded-none overflow-hidden">
              <span className="font-label-caps text-label-caps text-sand-neutral uppercase mb-8 block tracking-widest">Single Unified Tier</span>
              
              <div className="mb-10 flex items-baseline">
                <span className="text-7xl font-display-lg text-bone-white">10%</span>
                <span className="text-sand-neutral font-label-caps ml-4 text-sm tracking-widest">FLAT COMMISSION</span>
              </div>
              
              <p className="text-sand-neutral/80 font-body-md mb-10 leading-relaxed normal-case">
                We charge a flat 10% commission fee only on completed customer orders. This flat fee completely covers all core services:
              </p>
              
              <ul className="space-y-6 mb-16 list-none p-0">
                <li className="flex items-center gap-4 font-body-md">
                  <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
                  <span>AI Smart Matching & instant local requests routing</span>
                </li>
                <li className="flex items-center gap-4 font-body-md">
                  <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
                  <span>Secure payment processing (credit card / UPI merchant fees included)</span>
                </li>
                <li className="flex items-center gap-4 font-body-md">
                  <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
                  <span>Full access to provider dashboard, analytics, and CRM tools</span>
                </li>
                <li className="flex items-center gap-4 font-body-md">
                  <span className="material-symbols-outlined text-emerald-500 font-bold">check_circle</span>
                  <span>Curated high-intent customer network with zero marketing overhead</span>
                </li>
              </ul>
              
              <button 
                onClick={handleConfettiTrigger}
                className="w-full bg-bone-white text-onyx-black py-5 font-button-text uppercase tracking-widest hover:bg-clay-earth hover:text-bone-white transition-all duration-300 border-0 cursor-pointer rounded-none magnetic"
              >
                Become a Partner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-margin-desktop overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative h-[65vh] flex items-center justify-center bg-onyx-black group rounded-none overflow-hidden">
          
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              className="w-full h-full object-cover opacity-35 transition-transform duration-[3s] group-hover:scale-105" 
            >
              <source src="/make_one_video_of_inadian_food.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="relative z-10 text-center px-6 max-w-2xl reveal-on-scroll">
            <h2 className="font-display-lg text-white text-[48px] md:text-[68px] leading-[1.1] mb-12 uppercase tracking-tighter reveal-text">
              Ready to grow your Tiffin Business?
            </h2>
            <button 
              onClick={handleConfettiTrigger}
              className="bg-white text-onyx-black px-12 py-6 font-button-text text-button-text uppercase tracking-widest hover:tracking-[0.18em] transition-all duration-500 border-0 rounded-none cursor-pointer magnetic"
            >
              Become a Provider
            </button>
          </div>

        </div>
      </section>

      {/* Embedded CSS rules */}
      <style>{`
        .glass-panel {
          background: rgba(251, 249, 245, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(222, 217, 209, 0.3);
        }
        .underline-grow {
          position: relative;
        }
        .underline-grow::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: currentColor;
          transition: width 0.3s ease;
        }
        .underline-grow:hover::after {
          width: 100%;
        }
        
        /* Reveal animations matching home page spacing rules */
        .reveal, .reveal-on-scroll {
          opacity: 1;
          transform: translateY(0);
          transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Characters reveal */
        .reveal-char {
          display: inline-block;
          transform: translateY(0);
          opacity: 1;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-char.active,
        .active > .reveal-char,
        .active .reveal-char,
        .reveal-on-scroll.active .reveal-char,
        .reveal-text.active .reveal-char,
        .reveal.active .reveal-char {
          transform: translateY(0) !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
