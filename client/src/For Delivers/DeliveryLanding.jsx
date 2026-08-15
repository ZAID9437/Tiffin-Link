import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
 
export default function DeliveryLanding({ onOpenBecomeDeliveryPartnerModal, onOpenDemoModal }) {
  // Calculator state
  const [deliveries, setDeliveries] = useState(12);
  const [days, setDays] = useState(20);
  const baseDeliveryRate = 60; // Average earnings per delivery (in ₹)
  const estimatedEarnings = deliveries * days * baseDeliveryRate;
 
  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
 
  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
 
  const handleConfettiTrigger = () => {
    confetti({
      particleCount: 150,
      spread: 85,
      origin: { y: 0.8 },
      colors: ['#F5F3EF', '#1A1A1A', '#665d52', '#DED9D1']
    });
    onOpenBecomeDeliveryPartnerModal();
  };

  // Stats count up animation
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef(null);
  
  const [partnersCount, setPartnersCount] = useState(0);
  const [deliveriesCount, setDeliveriesCount] = useState(0);
  const [earningsCount, setEarningsCount] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!statsStarted) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const intervalTime = duration / steps;

    const targetPartners = 1200;
    const targetDeliveries = 50;
    const targetEarnings = 2;
    const targetRating = 49; // 4.9 * 10

    let step = 0;

    const timer = setInterval(() => {
      step++;

      setPartnersCount(Math.min(targetPartners, Math.round((targetPartners / steps) * step)));
      setDeliveriesCount(Math.min(targetDeliveries, Math.round((targetDeliveries / steps) * step)));
      setEarningsCount(Math.min(targetEarnings, Math.round((targetEarnings / steps) * step)));
      setRatingCount(Math.min(targetRating, Math.round((targetRating / steps) * step)));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [statsStarted]);

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-sand-neutral overflow-x-hidden min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="min-h-screen relative w-full overflow-hidden flex flex-col items-center justify-center py-32">
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              className="w-full h-full object-cover parallax-img"
              data-parallax-speed="0.12"
            >
              <source src="/create_one_indain_delivery_dri.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-onyx-black/45"></div>
          </div>
          <div className="relative z-10 text-center px-margin-mobile reveal-on-scroll max-w-5xl mx-auto flex flex-col items-center" id="hero-content">
            <p className="font-label-caps text-label-caps mb-6 text-bone-white opacity-85 uppercase tracking-[0.2em]">Join the network</p>
            <h1 className="font-display-lg text-[42px] sm:text-[60px] md:text-[76px] lg:text-[90px] text-bone-white mb-8 leading-[1.05] tracking-tighter uppercase reveal-text">
              Deliver Fresh Meals.<br className="hidden sm:inline" /> Earn on Your Schedule.
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-3xl mb-12">
              <div className="w-px h-16 bg-bone-white/30 hidden md:block"></div>
              <p className="font-body-lg text-body-lg text-bone-white/95 max-w-lg italic text-center md:text-left leading-relaxed">
                Experience true flexibility with a delivery system designed for the modern architectural pace. Transparent earnings, artisanal routes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={handleConfettiTrigger}
                className="bg-bone-white text-onyx-black px-10 py-5 font-button-text text-button-text uppercase tracking-widest hover:scale-95 transition-transform duration-200 rounded-none cursor-pointer"
              >
                Become a Partner
              </button>
              <button 
                onClick={onOpenDemoModal}
                className="text-white font-button-text text-button-text border-b border-white pb-1 hover:pb-2 transition-all duration-200"
              >
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section ref={statsRef} className="bg-onyx-black text-bone-white py-16">
          <div className="max-w-[1440px] mx-auto px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-12 text-center reveal-on-scroll">
            <div>
              <p className="font-headline-lg text-headline-lg">{partnersCount}+</p>
              <p className="font-label-caps text-label-caps text-surface-dim uppercase tracking-widest mt-2">Active Partners</p>
            </div>
            <div>
              <p className="font-headline-lg text-headline-lg">{deliveriesCount}k+</p>
              <p className="font-label-caps text-label-caps text-surface-dim uppercase tracking-widest mt-2">Deliveries Completed</p>
            </div>
            <div>
              <p className="font-headline-lg text-headline-lg">₹{earningsCount}M+</p>
              <p className="font-label-caps text-label-caps text-surface-dim uppercase tracking-widest mt-2">Partner Earnings</p>
            </div>
            <div>
              <p className="font-headline-lg text-headline-lg">{(ratingCount / 10).toFixed(1)}/5</p>
              <p className="font-label-caps text-label-caps text-surface-dim uppercase tracking-widest mt-2">Partner Rating</p>
            </div>
          </div>
        </section>

        {/* Why Deliver */}
        <section className="px-margin-desktop py-section-gap max-w-[1440px] mx-auto relative">
          <div className="mb-24 text-center reveal-on-scroll">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">The Tiffin Advantage</span>
            <h2 className="font-headline-lg text-headline-lg mt-4">Why Deliver with TiffinLink?</h2>
          </div>
          
          <div className="relative w-full">
            {/* Supporting Beam / Brass Rod */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-clay-earth via-sand-neutral to-clay-earth rounded z-20 shadow-sm" />
            
            <div className="architectural-grid pt-4">
              {/* Card 1 */}
              <div className="col-span-12 md:col-span-4 flex flex-col items-center">
                {/* Ring/Hook attachment */}
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                {/* Rope Line */}
                <div className="w-[1.5px] h-[70px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                {/* Knot */}
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                {/* Swaying Card Container */}
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-card-1 5.2s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-surface-container p-10 flex flex-col border border-sand-neutral/10 hover:border-sand-neutral/30 transition-all duration-500 shadow-sm hover:shadow-md h-full mt-3">
                    {/* Hook */}
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <span className="material-symbols-outlined text-4xl mb-6 text-clay-earth" data-icon="schedule">schedule</span>
                    <h3 className="font-headline-md text-headline-md mb-4">Flexible Hours</h3>
                    <p className="font-body-md text-secondary">You choose when you want to be on the road. No minimum hours, no fixed shifts. Total freedom.</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="col-span-12 md:col-span-4 flex flex-col items-center mt-12 md:mt-0">
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                <div className="w-[1.5px] h-[90px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-card-2 6.0s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-bone-white border border-sand-neutral p-10 flex flex-col hover:shadow-md transition-all duration-500 h-full mt-3">
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <span className="material-symbols-outlined text-4xl mb-6 text-clay-earth" data-icon="explore">explore</span>
                    <h3 className="font-headline-md text-headline-md mb-4">Real-Time Nav</h3>
                    <p className="font-body-md text-secondary">Our advanced routing algorithm ensures you take the most efficient paths, minimizing downtime and maximizing pay.</p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="col-span-12 md:col-span-4 flex flex-col items-center mt-12 md:mt-0">
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                <div className="w-[1.5px] h-[75px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-card-3 5.5s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-surface-container p-10 flex flex-col border border-sand-neutral/10 hover:border-sand-neutral/30 transition-all duration-500 shadow-sm hover:shadow-md h-full mt-3">
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <span className="material-symbols-outlined text-4xl mb-6 text-clay-earth" data-icon="account_balance_wallet">account_balance_wallet</span>
                    <h3 className="font-headline-md text-headline-md mb-4">Weekly Payouts</h3>
                    <p className="font-body-md text-secondary">Reliable earnings delivered directly to your bank account every Tuesday. Track your growth in real-time.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Embedded Custom Keyframe Animations */}
          <style>{`
            @keyframes sway-card-1 {
              0% { transform: rotate(-1.5deg); }
              100% { transform: rotate(1.5deg); }
            }
            @keyframes sway-card-2 {
              0% { transform: rotate(-2.2deg); }
              100% { transform: rotate(2.2deg); }
            }
            @keyframes sway-card-3 {
              0% { transform: rotate(-1.8deg); }
              100% { transform: rotate(1.8deg); }
            }
          `}</style>
        </section>

        {/* Earnings Calculator */}
        <section className="bg-surface py-section-gap overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-margin-desktop architectural-grid items-center">
            <div className="col-span-12 md:col-span-6 reveal-on-scroll">
              <h2 className="font-headline-lg text-headline-lg mb-8">How much could you earn?</h2>
              <p className="font-body-lg text-secondary mb-12">Earnings vary based on time spent, location, and the number of deliveries you complete. Estimate your monthly potential below.</p>
              <div className="space-y-12">
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-label-caps text-label-caps uppercase">Deliveries Per Day</label>
                    <span className="font-body-lg font-bold" id="deliveries-val">{deliveries}</span>
                  </div>
                  <input 
                    className="w-full accent-onyx-black" 
                    id="deliveries-slider" 
                    max="30" 
                    min="1" 
                    type="range" 
                    value={deliveries}
                    onChange={(e) => setDeliveries(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="font-label-caps text-label-caps uppercase">Days Per Month</label>
                    <span className="font-body-lg font-bold" id="days-val">{days}</span>
                  </div>
                  <input 
                    className="w-full accent-onyx-black" 
                    id="days-slider" 
                    max="31" 
                    min="1" 
                    type="range" 
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 md:offset-1 mt-16 md:mt-0 reveal-on-scroll delay-200">
              <div className="bg-onyx-black p-12 text-bone-white text-center">
                <span className="font-label-caps text-label-caps text-surface-dim uppercase tracking-widest mb-4 block">Estimated Monthly Earnings</span>
                <div className="font-display-lg text-display-lg mb-8" id="earnings-total">
                  ₹{estimatedEarnings.toLocaleString()}
                </div>
                <p className="font-body-md text-surface-dim italic">Calculated based on average delivery earnings in your area.</p>
                <button 
                  onClick={handleConfettiTrigger}
                  className="w-full mt-10 border border-bone-white py-4 font-button-text text-button-text uppercase tracking-widest hover:bg-bone-white hover:text-onyx-black transition-colors duration-300"
                >
                  Start Earning
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How Delivery Works */}
        <section className="px-margin-desktop py-section-gap max-w-[1440px] mx-auto relative">
          <div className="text-center mb-24 reveal-on-scroll">
            <h2 className="font-headline-lg text-headline-lg">Simple Workflow</h2>
          </div>
          
          <div className="relative w-full">
            {/* Supporting Beam / Brass Rod */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-clay-earth via-sand-neutral to-clay-earth rounded z-20 shadow-sm" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                {/* Ring/Hook attachment */}
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                {/* Rope Line */}
                <div className="w-[1.5px] h-[60px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                {/* Knot */}
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                {/* Swaying Card Container */}
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-step-1 5.0s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-surface-container p-8 flex flex-col items-center text-center border border-sand-neutral/10 hover:border-sand-neutral/30 transition-all duration-500 shadow-sm hover:shadow-md h-full mt-3">
                    {/* Hook */}
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <div className="w-10 h-10 bg-onyx-black text-bone-white flex items-center justify-center font-headline-md mb-6 rounded-none">1</div>
                    <h4 className="font-headline-md text-headline-md mb-3">Register</h4>
                    <p className="font-body-md text-secondary text-sm">Complete the online application and background check in minutes.</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center mt-12 md:mt-0">
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                <div className="w-[1.5px] h-[85px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-step-2 5.8s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-bone-white border border-sand-neutral p-8 flex flex-col items-center text-center hover:shadow-md transition-all duration-500 h-full mt-3">
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <div className="w-10 h-10 bg-onyx-black text-bone-white flex items-center justify-center font-headline-md mb-6 rounded-none">2</div>
                    <h4 className="font-headline-md text-headline-md mb-3">Onboard</h4>
                    <p className="font-body-md text-secondary text-sm">Quick virtual training on our delivery standards and app usage.</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center mt-12 md:mt-0">
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                <div className="w-[1.5px] h-[70px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-step-3 5.4s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-surface-container p-8 flex flex-col items-center text-center border border-sand-neutral/10 hover:border-sand-neutral/30 transition-all duration-500 shadow-sm hover:shadow-md h-full mt-3">
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <div className="w-10 h-10 bg-onyx-black text-bone-white flex items-center justify-center font-headline-md mb-6 rounded-none">3</div>
                    <h4 className="font-headline-md text-headline-md mb-3">Deliver</h4>
                    <p className="font-body-md text-secondary text-sm">Log in whenever you’re ready and start accepting delivery requests.</p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center mt-12 md:mt-0">
                <div className="w-3 h-3 rounded-full border-2 border-clay-earth bg-background -mt-[10px] z-20" />
                <div className="w-[1.5px] h-[95px] bg-clay-earth/70 relative">
                  <div className="absolute inset-0 border-l border-dashed border-sand-neutral" />
                </div>
                <div className="w-2 h-2 rounded-full bg-clay-earth -mb-[1px] z-10" />
                <div 
                  className="w-full flex flex-col origin-top-center"
                  style={{
                    transformOrigin: 'top center',
                    animation: 'sway-step-4 6.2s infinite ease-in-out alternate'
                  }}
                >
                  <div className="relative bg-bone-white border border-sand-neutral p-8 flex flex-col items-center text-center hover:shadow-md transition-all duration-500 h-full mt-3">
                    <svg width="12" height="16" className="absolute -top-3 left-1/2 -translate-x-1/2 text-clay-earth" viewBox="0 0 14 18" fill="none">
                      <path d="M7 0C7.5 0 8 0.5 8 1V6C8 6.5 7.5 7 7 7C6.5 7 6 6.5 6 6V1C6 0.5 6.5 0 7 0Z" fill="currentColor"/>
                      <path d="M7 6C9.2 6 11 7.8 11 10C11 11 10.2 11.8 9.2 11.8C8.2 11.8 7.4 11 7.4 10C7.4 9.8 7.2 9.6 7 9.6C6.8 9.6 6.6 9.8 6.6 10C6.6 11.8 5 13.4 3.2 13.4C1.4 13.4 0 11.8 0 10C0 6.1 3.1 3 7 3" fill="currentColor"/>
                    </svg>
                    <div className="w-10 h-10 bg-onyx-black text-bone-white flex items-center justify-center font-headline-md mb-6 rounded-none">4</div>
                    <h4 className="font-headline-md text-headline-md mb-3">Get Paid</h4>
                    <p className="font-body-md text-secondary text-sm">Track earnings after each trip and receive weekly direct deposits.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Embedded Custom Keyframe Animations */}
          <style>{`
            @keyframes sway-step-1 {
              0% { transform: rotate(-1.5deg); }
              100% { transform: rotate(1.5deg); }
            }
            @keyframes sway-step-2 {
              0% { transform: rotate(-2.0deg); }
              100% { transform: rotate(2.0deg); }
            }
            @keyframes sway-step-3 {
              0% { transform: rotate(-1.8deg); }
              100% { transform: rotate(1.8deg); }
            }
            @keyframes sway-step-4 {
              0% { transform: rotate(-2.4deg); }
              100% { transform: rotate(2.4deg); }
            }
          `}</style>
        </section>

        {/* Requirements & FAQ */}
        <section className="bg-surface-container py-section-gap">
          <div className="max-w-[1440px] mx-auto px-margin-desktop architectural-grid">
            <div className="col-span-12 md:col-span-4 reveal-on-scroll">
              <h2 className="font-headline-lg text-headline-lg mb-12">Requirements to Join</h2>
              <ul className="space-y-6">
                <li className="flex items-start space-x-4">
                  <span className="material-symbols-outlined mt-1" data-icon="check_circle">check_circle</span>
                  <span className="font-body-md text-onyx-black">18+ years of age</span>
                </li>
                <li className="flex items-start space-x-4">
                  <span className="material-symbols-outlined mt-1" data-icon="check_circle">check_circle</span>
                  <span className="font-body-md text-onyx-black">Valid driver's license (if using vehicle)</span>
                </li>
                <li className="flex items-start space-x-4">
                  <span className="material-symbols-outlined mt-1" data-icon="check_circle">check_circle</span>
                  <span className="font-body-md text-onyx-black">Smart phone with data plan</span>
                </li>
                <li className="flex items-start space-x-4">
                  <span className="material-symbols-outlined mt-1" data-icon="check_circle">check_circle</span>
                  <span className="font-body-md text-onyx-black">Background check consent</span>
                </li>
              </ul>
            </div>
            <div className="col-span-12 md:col-span-7 md:offset-1 mt-16 md:mt-0 reveal-on-scroll delay-200">
              <h2 className="font-headline-lg text-headline-lg mb-12">Common Questions</h2>
              <div className="space-y-1">
                <div className="border-b border-sand-neutral py-6">
                  <button className="w-full flex justify-between items-center text-left" onClick={() => toggleFaq(0)}>
                    <span className="font-headline-md text-headline-md text-lg text-onyx-black">When do I get paid?</span>
                    <span 
                      className="material-symbols-outlined transition-transform duration-300 text-onyx-black" 
                      style={{ transform: openFaqIndex === 0 ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      data-icon="expand_more"
                    >
                      expand_more
                    </span>
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: openFaqIndex === 0 ? '200px' : '0px' }}
                  >
                    <p className="pt-4 font-body-md text-secondary">Payouts are processed weekly every Tuesday for the previous week's earnings (Monday-Sunday).</p>
                  </div>
                </div>
                <div className="border-b border-sand-neutral py-6">
                  <button className="w-full flex justify-between items-center text-left" onClick={() => toggleFaq(1)}>
                    <span className="font-headline-md text-headline-md text-lg text-onyx-black">Do I need a car?</span>
                    <span 
                      className="material-symbols-outlined transition-transform duration-300 text-onyx-black" 
                      style={{ transform: openFaqIndex === 1 ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      data-icon="expand_more"
                    >
                      expand_more
                    </span>
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: openFaqIndex === 1 ? '200px' : '0px' }}
                  >
                    <p className="pt-4 font-body-md text-secondary">In select city centers, we support bicycle and walking deliveries. Check your specific city requirements during registration.</p>
                  </div>
                </div>
                <div className="border-b border-sand-neutral py-6">
                  <button className="w-full flex justify-between items-center text-left" onClick={() => toggleFaq(2)}>
                    <span className="font-headline-md text-headline-md text-lg text-onyx-black">Can I choose my deliveries?</span>
                    <span 
                      className="material-symbols-outlined transition-transform duration-300 text-onyx-black" 
                      style={{ transform: openFaqIndex === 2 ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      data-icon="expand_more"
                    >
                      expand_more
                    </span>
                  </button>
                  <div 
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: openFaqIndex === 2 ? '200px' : '0px' }}
                  >
                    <p className="pt-4 font-body-md text-secondary">Yes, you receive a notification with estimated pay and distance before accepting any delivery request.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative h-[600px] overflow-hidden">
          <div className="absolute inset-0 bg-onyx-black/55 z-10"></div>
          <video 
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover absolute inset-0 parallax-img"
            src="/make_one_video_for_website_of.mp4"
          />
          <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-margin-desktop reveal-on-scroll">
            <h2 className="font-display-lg text-display-lg text-bone-white mb-8">Ready to Start Delivering?</h2>
            <p className="font-body-lg text-bone-white mb-12 max-w-2xl">Join our community of artisanal delivery partners and redefine your earning potential.</p>
            <button 
              onClick={handleConfettiTrigger}
              className="bg-bone-white text-onyx-black px-12 py-5 font-button-text text-button-text uppercase tracking-widest hover:scale-105 transition-transform duration-300"
            >
              Apply Now
            </button>
          </div>
        </section>
      </main>

      {/* Embedded CSS rules to ensure consistency with custom layout */}
      <style>{`
        .architectural-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        @media (min-width: 768px) {
          .md\\:offset-1 {
            grid-column-start: 8;
          }
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-on-scroll.active, .reveal-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
