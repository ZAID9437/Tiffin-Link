import React from 'react';

export default function Footer({ onOpenBecomeProviderModal, onOpenCookieConsentModal, onOpenLegalModal }) {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDoc = (e, docId) => {
    e.preventDefault();
    if (onOpenLegalModal) {
      onOpenLegalModal(docId);
    } else {
      window.location.hash = `#${docId}`;
    }
  };

  return (
    <footer className="bg-bone-white py-12 md:py-16 pb-margin-mobile border-t border-sand-neutral text-onyx-black">
      <div className="px-4 sm:px-6 md:px-margin-desktop max-w-[1440px] mx-auto">
        <div className="mb-12 md:mb-20 overflow-hidden">
          <marquee scrollamount="8" behavior="scroll" direction="left" className="block select-none">
            <h2 
              className="font-display-lg text-4xl sm:text-7xl md:text-display-lg uppercase tracking-tighter text-onyx-black opacity-[0.12] hover:opacity-20 hover:tracking-normal hover:text-clay-earth transition-all duration-1000 ease-out cursor-default select-none whitespace-nowrap"
            >
              TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK &nbsp;&nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;&nbsp; TIFFINLINK
            </h2>
          </marquee>
        </div>
        <div className="grid grid-cols-12 gap-6 md:gap-gutter">
          <div className="col-span-12 md:col-span-3 mb-8 md:mb-0">
            <p className="font-label-caps text-label-caps mb-4 md:mb-6 text-secondary">NEWSLETTER</p>
            <p className="text-xs text-[#665d52] mb-4 leading-relaxed">
              Curated seasonal recipes, verified home chef spotlights, and Satvik dining updates directly to your inbox.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex pb-2 relative group/form">
              <input 
                className="bg-transparent border-none p-0 flex-grow focus:ring-0 font-label-caps text-label-caps placeholder-secondary/30 text-onyx-black text-xs" 
                placeholder="YOUR EMAIL" 
                type="email"
              />
              <button type="submit" className="material-symbols-outlined transition-all duration-300 active:scale-75 hover:text-clay-earth text-onyx-black">arrow_forward</button>
              
              {/* Custom Animated Underline */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand-neutral" />
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-clay-earth scale-x-0 group-hover/form:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
            </form>
          </div>
          
          {/* Navigation */}
          <div className="col-span-6 md:col-span-2 md:col-start-5">
            <p className="font-label-caps text-label-caps mb-4 md:mb-6 text-secondary">DISCOVERY</p>
            <ul className="space-y-3 font-label-caps text-[11px]">
              <li>
                <a 
                  className="hover:opacity-50 transition-opacity cursor-pointer" 
                  href="#for-diners"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                    if (document.body) document.body.scrollTop = 0;
                  }}
                >
                  FOR DINERS
                </a>
              </li>
              <li>
                <a 
                  className="hover:opacity-50 transition-opacity cursor-pointer" 
                  href="#for-providers"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                    if (document.body) document.body.scrollTop = 0;
                  }}
                >
                  FOR PROVIDERS
                </a>
              </li>
              <li>
                <a 
                  className="hover:opacity-50 transition-opacity cursor-pointer" 
                  href="#for-deliverers"
                  onClick={() => {
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    if (document.documentElement) document.documentElement.scrollTop = 0;
                    if (document.body) document.body.scrollTop = 0;
                  }}
                >
                  DELIVERY PARTNERS
                </a>
              </li>
              <li><a className="hover:opacity-50 transition-opacity" href="#find-tiffin">FIND TIFFINS</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#story">OUR HERITAGE</a></li>
              <li>
                <button 
                  onClick={onOpenBecomeProviderModal}
                  className="hover:opacity-50 transition-opacity text-left uppercase cursor-pointer"
                >
                  KITCHEN ONBOARDING
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Consumer Policies */}
          <div className="col-span-6 md:col-span-3">
            <p className="font-label-caps text-label-caps mb-4 md:mb-6 text-secondary">LEGAL &amp; POLICIES</p>
            <ul className="space-y-3 font-label-caps text-[11px]">
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'privacy-policy')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  PRIVACY POLICY
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'terms')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  TERMS &amp; CONDITIONS
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'cancellation-refund-policy')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  CANCELLATION &amp; REFUNDS
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'delivery-policy')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  DELIVERY POLICY
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'pricing-commission-policy')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  PRICING &amp; COMMISSIONS
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'food-safety-disclaimer')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase text-clay-earth font-bold"
                >
                  FOOD SAFETY DISCLAIMER
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'community-guidelines')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  COMMUNITY GUIDELINES
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenCookieConsentModal} 
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase text-[#a0522d] font-bold flex items-center gap-1"
                >
                  <span>🍪 COOKIE PREFERENCES</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Role Agreements & B2B Contracts */}
          <div className="col-span-12 sm:col-span-6 md:col-span-2">
            <p className="font-label-caps text-label-caps mb-4 md:mb-6 text-secondary">ROLE AGREEMENTS</p>
            <ul className="space-y-3 font-label-caps text-[11px]">
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'customer-terms')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  CUSTOMER TERMS
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'provider-agreement')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  PROVIDER AGREEMENT
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'delivery-partner-agreement')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  DRIVER AGREEMENT
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'corporate-terms')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  CORPORATE DINING
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleOpenDoc(e, 'group-hostel-terms')}
                  className="hover:opacity-50 transition-opacity text-left cursor-pointer uppercase"
                >
                  HOSTEL / PG POOL
                </button>
              </li>
            </ul>
          </div>

          {/* Social and Trust */}
          <div className="col-span-12 sm:col-span-6 md:col-span-2">
            <p className="font-label-caps text-label-caps mb-4 md:mb-6 text-secondary">CONNECT</p>
            <ul className="space-y-3 font-label-caps text-[11px]">
              <li><a className="hover:opacity-50 transition-opacity" href="#instagram">INSTAGRAM</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#linkedin">LINKEDIN</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="#contact">CONTACT SUPPORT</a></li>
              <li><a className="hover:opacity-50 transition-opacity" href="mailto:grievance@tiffinlink.in">GRIEVANCE OFFICER</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 md:mt-24 pt-6 md:pt-8 border-t border-sand-neutral/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p className="font-body-md text-xs sm:text-body-md text-secondary opacity-50">© 2026 TIFFINLINK. ARTISANAL CRAFT.</p>
          <button 
            onClick={handleBackToTop}
            className="font-label-caps text-xs sm:text-label-caps text-secondary hover:text-onyx-black transition-colors" 
            id="back-to-top"
          >
            BACK TO TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
