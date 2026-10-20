import React from 'react';

export default function Story() {
  return (
    <section className="pt-8 pb-12 px-4 sm:px-6 md:px-margin-desktop bg-bone-white" id="story">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-gutter items-center">
        {/* Left Side: Text */}
        <div className="lg:col-span-5 reveal-on-scroll">
          <p className="font-label-caps text-[11px] text-[#8C6239] dark:text-[#D4AF37] font-bold tracking-[0.25em] mb-4 md:mb-8 uppercase">
            OUR HERITAGE
          </p>
          <h2 className="font-headline-lg font-serif font-bold text-3xl sm:text-5xl md:text-headline-lg text-[#181512] dark:text-white mb-8 md:mb-12">
            Traditional home-cooking, scaled for modern life.
          </h2>
          <div className="space-y-6 text-base sm:text-lg font-normal text-[#54483C] dark:text-[#DDD3C5] leading-relaxed">
            <p>
              TiffinLink was born to empower India's talented home chefs and local cloud kitchens. Our story is written by the passionate culinary creators who wake up every morning to dry-roast whole spices, hand-grind masalas, and slow-cook regional delicacies in micro-kitchens across the country.
            </p>
            <p>
              We bridge the gap between traditional food heritage and modern convenience. From hand-rolled flatbreads and slow-simmered regional curries to fresh daily comforts, every meal is prepared in small batches under strict hygiene standards and delivered to nourish your body and soul.
            </p>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="lg:col-span-6 lg:col-start-7 reveal-on-scroll flex items-center">
          <div 
            className="aspect-[4/3] w-full bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-1000 rounded-3xl" 
            data-alt="A premium culinary photograph of an authentic Indian tiffin or thali setup on a dark rustic table, featuring copper bowls filled with rich aromatic dal and regional curries." 
            style={{ 
              backgroundImage: "url('/assets/indian_tiffin_heritage.png')" 
            }}
          ></div>
        </div>
      </div>
    </section>
  );
}
