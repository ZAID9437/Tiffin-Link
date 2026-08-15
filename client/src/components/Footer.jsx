import React from 'react';

export default function Footer({ onOpenBecomeProviderModal, onOpenCookieConsentModal }) {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-bone-white pt-section-gap pb-margin-mobile border-t border-sand-neutral">
      <div className="px-margin-desktop max-w-[1440px] mx-auto">
        <div className="mb-24 overflow-hidden">
          <marquee scrollamount="8" behavior="scroll" direction="left" className="block select-none">
            <h2 
              className="font-display-lg text-display-lg uppercase tracking-tighter text-onyx-black opacity-[0.12] hover:opacity-20 hover:tracking-normal hover:text-clay-earth transition-all duration-1000 ease-out cursor-default select-none whitespace-nowrap"
            >
              TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK
            </h2>
          </marquee>
        </div>
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-12 md:col-span-4 mb-12 md:mb-0">
            <p className="font-label-caps text-label-caps mb-8 text-secondary">NEWSLETTER</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex pb-2 relative group/form">
              <input 
                className="bg-transparent border-none p-0 flex-grow focus:ring-0 font-label-caps text-label-caps placeholder-secondary/30 text-onyx-black" 
                placeholder="YOUR EMAIL" 
                type="email"
              />
              <button type="submit" className="material-symbols-outlined transition-all duration-300 active:scale-75 hover:text-clay-earth text-onyx-black">arrow_forward</button>
              
              {/* Custom Animated Underline */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand-neutral" />
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-clay-earth scale-x-0 group-hover/form:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
            </form>
          </div>
          <div className="col-span-6 md:col-span-2 md:col-start-7">
            <p className="font-label-caps text-label-caps mb-8 text-secondary">NAVIGATION</p>
            <ul className="space-y-4 font-label-caps text-label-caps">
              <li><a className="hover:opacity-50 transition-opacity" href="#kitchens">KITCHENS</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#process">THE PROCESS</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#story">STORY</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#delivery">DELIVERY PARTNERS</a></li>
              <li>
                <button 
                  onClick={onOpenBecomeProviderModal}
                  className="hover:opacity-50 transition-opacity text-left uppercase"
                >
                  MEMBERSHIP
                </button>
              </li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-2">
            <p className="font-label-caps text-label-caps mb-8 text-secondary">SOCIAL</p>
            <ul className="space-y-4 font-label-caps text-label-caps">
              <li><a className="hover:opacity-50 transition-opacity" href="#instagram">INSTAGRAM</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#linkedin">LINKEDIN</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#pinterest">PINTEREST</a></li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="font-label-caps text-label-caps mb-8 text-secondary">LEGAL</p>
            <ul className="space-y-4 font-label-caps text-label-caps">
              <li><a className="hover:opacity-50 transition-opacity" href="#privacy">PRIVACY</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#terms">TERMS</a></li>
              <li>
                <button 
                  onClick={onOpenCookieConsentModal} 
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase text-clay-earth font-bold flex items-center gap-1"
                >
                  <span>🍪 COOKIES & SESSIONS</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-sand-neutral/30 flex justify-between items-center">
          <p className="font-body-md text-body-md text-secondary opacity-50">© 2024 TIFFINLINK. ARTISANAL CRAFT.</p>
          <button 
            onClick={handleBackToTop}
            className="font-label-caps text-label-caps text-secondary hover:text-onyx-black transition-colors" 
            id="back-to-top"
          >
            BACK TO TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
