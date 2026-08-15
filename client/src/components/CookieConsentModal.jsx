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
      <div className="bg-[#0F172A] text-white p-5 rounded-2xl shadow-2xl border border-slate-700 space-y-4 relative">
        
        {/* Close button if triggered manually */}
        {isOpenOverride && (
          <button 
            onClick={() => { setIsVisible(false); if (onCloseOverride) onCloseOverride(); }}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Cookie size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight">Cookie & Session Permissions</h3>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold rounded-md border border-emerald-500/30">
                Privacy Protected
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              TiffinLink uses essential HTTP-Only cookies and local sessions to keep your kitchen dashboard active, secure your orders, and personalize meal requests.
            </p>
          </div>
        </div>

        {/* Confirmation Saved Alert */}
        {savedNotice && (
          <div className="p-3 bg-emerald-900/60 border border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-2 animate-bounce">
            <Check size={16} className="text-emerald-400" />
            <span>Cookie & Session permissions saved successfully!</span>
          </div>
        )}

        {/* Detailed Customization Panel */}
        {showCustomize && (
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 text-xs animate-scale-in">
            
            {/* Category 1: Essential */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Essential & Sessions (Required)</span>
                  <p className="text-[10px] text-slate-400">Authenticates sessions, database security, and cart tokens.</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">LOCKED</span>
            </div>

            {/* Category 2: Functional */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 transition-colors">
              <div className="flex items-center gap-2">
                <Server size={14} className="text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Functional Preferences</span>
                  <p className="text-[10px] text-slate-400">Remembers kitchen status (Online/Offline) and active dashboard tabs.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={permissions.functional}
                onChange={(e) => setPermissions(prev => ({ ...prev, functional: e.target.checked }))}
                className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
              />
            </div>

            {/* Category 3: Analytics */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 transition-colors">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Performance & Analytics</span>
                  <p className="text-[10px] text-slate-[#94A3B8]">Helps optimize meal delivery speed and request matching accuracy.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={permissions.analytics}
                onChange={(e) => setPermissions(prev => ({ ...prev, analytics: e.target.checked }))}
                className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
              />
            </div>

            {/* Category 4: Marketing */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/70 transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Meal Suggestions</span>
                  <p className="text-[10px] text-slate-400">Provides personalized tiffin recommendations and promo offers.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={permissions.marketing}
                onChange={(e) => setPermissions(prev => ({ ...prev, marketing: e.target.checked }))}
                className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
              />
            </div>

          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
          >
            <Sliders size={13} />
            <span>{showCustomize ? 'Hide Settings' : 'Customize Permissions'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Essential Only
            </button>

            <button
              type="button"
              onClick={showCustomize ? () => handleSaveConsent() : handleAcceptAll}
              className="px-4 py-1.5 bg-[#0A8B5F] hover:bg-[#076a48] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
