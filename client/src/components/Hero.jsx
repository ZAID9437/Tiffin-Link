import React from 'react';

export default function Hero() {
  return (
    <section className="h-screen relative w-full overflow-hidden flex items-center justify-center bg-[#141210]">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/75 via-black/50 to-[#141210]">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nopictureinpicture"
          className="w-full h-full object-cover parallax-img pointer-events-none"
        >
          <source src="/generate_one_local_indian_food.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-black/55 to-black/70"></div>
        <div className="absolute inset-0 bg-black/25"></div>
      </div>
      <div className="relative z-10 text-center px-4 sm:px-6 md:px-margin-desktop animate-fade-in" id="hero-content">
        <p className="font-label-caps text-xs sm:text-sm mb-4 sm:mb-6 text-[#F3E5AB] font-semibold tracking-[0.25em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          EST. 2026 — ARTISANAL DINING
        </p>
        <h1 className="font-display-lg text-4xl sm:text-7xl lg:text-display-lg text-white max-w-5xl mb-6 lg:mb-12 leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
          Home-cooked meals, exactly when you need.
        </h1>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="w-[2px] h-16 md:h-24 bg-[#F3E5AB]/60 hidden md:block drop-shadow-sm"></div>
          <p className="font-body-lg text-base sm:text-body-lg text-white font-medium max-w-md italic drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] leading-relaxed">
            A culinary bridge between ancestral kitchens and your modern table. Nourishment redefined through craft and patience.
          </p>
        </div>
      </div>
    </section>
  );
}
