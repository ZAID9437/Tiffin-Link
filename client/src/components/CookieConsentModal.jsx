import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, Lock, Sliders, X, Sparkles, Server } from 'lucide-react';

export default function CookieConsentModal({ isOpenOverride, onCloseOverride }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  // Cookie permission options state
  const [permissions, setPermissions] = useState({
    essential: true, // Always required
    functional: true, // Remembers kitchen state, tab preference, session
    analytics: true,  // Service performance and usage tracking
    marketing: false  // Meal recommendation preferences
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpenOverride) {
      setIsVisible(true);
      const saved = localStorage.getItem('tiffinlink_cookie_consent');
      if (saved) {
        try {
          setPermissions(JSON.parse(saved));
        } catch (e) {}
      }
      return;
    }

    const consent = localStorage.getItem('tiffinlink_cookie_consent');
    if (!consent) {
      // Show consent banner 1 second after landing
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpenOverride]);

  const handleSaveConsent = (customPermissions) => {
    const finalPermissions = customPermissions || permissions;
    localStorage.setItem('tiffinlink_cookie_consent', JSON.stringify({
      ...finalPermissions,
      timestamp: new Date().toISOString()
    }));

    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setIsVisible(false);
      if (onCloseOverride) onCloseOverride();
    }, 1200);
  };

  const handleAcceptAll = () => {
    const allPermissions = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setPermissions(allPermissions);
    handleSaveConsent(allPermissions);
  };

  const handleAcceptEssential = () => {
    const essentialPermissions = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setPermissions(essentialPermissions);
    handleSaveConsent(essentialPermissions);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 animate-slide-up">
      <div 
        style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
        className="bg-[#161412]/95 backdrop-blur-xl text-bone-white p-5 md:p-6 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(160,82,45,0.12)] border border-[#3e342b]/90 ring-1 ring-white/10 space-y-4 relative"
      >
        
        {/* Close button if triggered manually */}
        {isOpenOverride && (
          <button 
            onClick={() => { setIsVisible(false); if (onCloseOverride) onCloseOverride(); }}
            className="absolute top-3.5 right-3.5 text-[#a8a29e] hover:text-bone-white hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#a0522d]/35 to-[#854324]/20 border border-[#a0522d]/50 text-[#f39c6b] flex items-center justify-center shrink-0 shadow-inner mt-0.5">
            <Cookie size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                style={{ fontFamily: "'EB Garamond', serif" }}
                className="text-xl sm:text-[22px] font-normal text-bone-white tracking-wide leading-tight"
              >
                Cookie & Session Permissions
              </h3>
              <span 
                style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
                className="px-2.5 py-0.5 bg-[#a0522d]/25 text-[#f6ad55] text-[10px] tracking-[0.16em] uppercase font-semibold rounded-full border border-[#a0522d]/45"
              >
                Privacy Protected
              </span>
            </div>
            <p className="text-xs text-[#cfc8bd] font-light mt-1.5 leading-relaxed">
              TiffinLink uses essential HTTP-Only cookies and local sessions to keep your kitchen dashboard active, secure your orders, and personalize meal requests.
            </p>
          </div>
        </div>

        {/* Confirmation Saved Alert */}
        {savedNotice && (
          <div className="p-3 bg-[#241c16] border border-[#a0522d]/60 rounded-xl text-xs font-medium text-[#fbd38d] flex items-center gap-2 animate-bounce shadow-md">
            <Check size={16} className="text-[#f6ad55]" />
            <span style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>Cookie & session permissions saved successfully!</span>
          </div>
        )}

        {/* Detailed Customization Panel */}
        {showCustomize && (
          <div className="p-3.5 bg-[#100e0d]/90 rounded-xl border border-[#3e342b]/80 space-y-2.5 text-xs animate-scale-in">
            
            {/* Category 1: Essential */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1815] border border-[#382f28]/70">
              <div className="flex items-center gap-2.5 pr-2">
                <Lock size={15} className="text-[#f6ad55] shrink-0" />
                <div>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-base font-normal text-bone-white tracking-wide">
                    Essential & Sessions (Required)
                  </span>
                  <p className="text-[11px] font-light text-[#a8a29e] mt-0.5">Authenticates secure sessions, account protection, and cart preferences.</p>
                </div>
              </div>
              <span 
                style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
                className="text-[9px] tracking-[0.16em] uppercase font-semibold text-[#f6ad55] bg-[#a0522d]/25 border border-[#a0522d]/40 px-2 py-0.5 rounded-full shrink-0"
              >
                LOCKED
              </span>
            </div>

            {/* Category 2: Functional */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1815]/60 hover:bg-[#1c1815] border border-[#382f28]/40 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <Server size={15} className="text-[#d4a373] shrink-0" />
                <div>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-base font-normal text-bone-white tracking-wide">
                    Functional Preferences
                  </span>
                  <p className="text-[11px] font-light text-[#a8a29e] mt-0.5">Remembers kitchen status (Online/Offline) and active dashboard tabs.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={permissions.functional}
                onChange={(e) => setPermissions(prev => ({ ...prev, functional: e.target.checked }))}
                className="w-4 h-4 accent-[#a0522d] cursor-pointer rounded"
              />
            </div>

            {/* Category 3: Analytics */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1815]/60 hover:bg-[#1c1815] border border-[#382f28]/40 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <ShieldCheck size={15} className="text-[#f6ad55] shrink-0" />
                <div>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-base font-normal text-bone-white tracking-wide">
                    Performance & Analytics
                  </span>
                  <p className="text-[11px] font-light text-[#a8a29e] mt-0.5">Helps optimize meal delivery speed and request matching accuracy.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={permissions.analytics}
                onChange={(e) => setPermissions(prev => ({ ...prev, analytics: e.target.checked }))}
                className="w-4 h-4 accent-[#a0522d] cursor-pointer rounded"
              />
            </div>

            {/* Category 4: Marketing */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1c1815]/60 hover:bg-[#1c1815] border border-[#382f28]/40 transition-colors">
              <div className="flex items-center gap-2.5 pr-2">
                <Sparkles size={15} className="text-[#f39c6b] shrink-0" />
                <div>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-base font-normal text-bone-white tracking-wide">
                    Meal Suggestions
                  </span>
                  <p className="text-[11px] font-light text-[#a8a29e] mt-0.5">Provides personalized tiffin recommendations and promo offers.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={permissions.marketing}
                onChange={(e) => setPermissions(prev => ({ ...prev, marketing: e.target.checked }))}
                className="w-4 h-4 accent-[#a0522d] cursor-pointer rounded"
              />
            </div>

          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
            className="text-xs tracking-[0.1em] uppercase font-semibold text-[#d4976a] hover:text-[#f3b890] flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <Sliders size={13} className="group-hover:rotate-45 transition-transform" />
            <span>{showCustomize ? 'Hide Settings' : 'Customize Permissions'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAcceptEssential}
              style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
              className="px-4 py-2 bg-[#25201c] hover:bg-[#322b26] active:scale-[0.98] text-bone-white/90 hover:text-white border border-[#443830] text-xs uppercase tracking-[0.12em] font-medium rounded-full transition-all cursor-pointer"
            >
              Essential Only
            </button>

            <button
              type="button"
              onClick={showCustomize ? () => handleSaveConsent() : handleAcceptAll}
              style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
              className="px-5 py-2 bg-[#a0522d] hover:bg-[#854324] active:scale-[0.98] text-bone-white text-xs uppercase tracking-[0.14em] font-bold rounded-full shadow-lg shadow-[#a0522d]/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{showCustomize ? 'Save Preferences' : 'Accept All'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
