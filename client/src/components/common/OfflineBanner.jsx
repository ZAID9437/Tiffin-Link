import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * Global Network Status & Offline Recovery Banner
 * Section 4.6 Requirement:
 * - Detects browser connectivity changes + backend API reachability
 * - Does not assume write failed/succeeded solely from client timeout
 * - Provides non-intrusive artisanal banner with live "Retry Connection" action
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [isChecking, setIsChecking] = useState(false);
  const [justRestored, setJustRestored] = useState(false);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    try {
      // Ping root health check endpoint with cache busting
      const response = await fetch(`http://localhost:5000/?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(3500)
      });
      if (response.ok) {
        setIsOffline(false);
        setJustRestored(true);
        setTimeout(() => setJustRestored(false), 3000);
      } else {
        setIsOffline(true);
      }
    } catch (e) {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustRestored(false);
    };

    const handleCustomOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('tiffinlink:network-offline', handleCustomOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('tiffinlink:network-offline', handleCustomOffline);
    };
  }, [checkConnectivity]);

  if (!isOffline && !justRestored) return null;

  return (
    <div 
      className={`fixed top-0 inset-x-0 z-[9999] px-4 py-2.5 transition-all duration-300 font-sans text-xs sm:text-sm select-none shadow-md ${
        justRestored 
          ? 'bg-[#1b5e20] text-white' 
          : 'bg-[#181512] text-[#fbf9f5] border-b border-[#ded9d1]/30'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {justRestored ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-[#D4AF37] shrink-0" />
          )}
          <span className="font-medium">
            {justRestored 
              ? 'Connection restored! Live culinary data synchronized.' 
              : "You're offline. Some features may not be available."}
          </span>
        </div>

        {!justRestored && (
          <button
            type="button"
            onClick={checkConnectivity}
            disabled={isChecking}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[#FAF7F2] font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Retry Connection'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
