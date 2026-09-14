import React from 'react';

export default function Hero() {
  return (
    <section className="h-screen relative w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          className="w-full h-full object-cover parallax-img"
        >
          <source src="/generate_one_local_indian_food.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-onyx-black/30"></div>
      </div>
      <div className="relative z-10 text-center px-4 sm:px-6 md:px-margin-desktop reveal-on-scroll" id="hero-content">
        <p className="font-label-caps text-xs sm:text-label-caps mb-4 sm:mb-6 text-bone-white opacity-80">EST. 2024 — ARTISANAL DINING</p>
        <h1 className="font-display-lg text-4xl sm:text-7xl lg:text-display-lg text-bone-white max-w-5xl mb-6 lg:mb-12 reveal-text leading-tight">Home-cooked meals, exactly when you need.</h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="w-px h-16 md:h-24 bg-bone-white/30 hidden md:block"></div>
          <p className="font-body-lg text-base sm:text-body-lg text-bone-white/90 max-w-md italic">A culinary bridge between ancestral kitchens and your modern table. Nourishment redefined through craft and patience.</p>
        </div>
      </div>
    </section>
  );
}
