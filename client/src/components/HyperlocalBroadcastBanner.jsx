import React, { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, Info, X, ExternalLink, Check, Bell } from 'lucide-react';
import { getActiveBroadcasts, acknowledgeBroadcast, dismissBroadcast } from '../services/advancedFeaturesApi';
import { getSocket } from '../services/socket';

export default function HyperlocalBroadcastBanner({ userRole = 'all' }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchBroadcasts = async () => {
    try {
      const res = await getActiveBroadcasts(userRole);
      if (res && res.success && Array.isArray(res.broadcasts)) {
        setBroadcasts(res.broadcasts);
      }
    } catch (err) {
      console.log('Broadcasts fetch error:', err.message);
    }
  };

  useEffect(() => {
    fetchBroadcasts();

    // Listen for real-time broadcasts
    const socket = getSocket();
    if (socket) {
      const handleNewBroadcast = (newBc) => {
        setBroadcasts(prev => [newBc, ...prev.filter(b => b.broadcastId !== newBc.broadcastId)]);
      };
      socket.on('broadcast:new', handleNewBroadcast);
      return () => {
        socket.off('broadcast:new', handleNewBroadcast);
      };
    }
  }, [userRole]);

  if (!broadcasts || broadcasts.length === 0) return null;

  const activeBc = broadcasts[currentIndex] || broadcasts[0];

  const handleDismiss = async () => {
    try {
      await dismissBroadcast(activeBc.broadcastId);
    } catch (e) {}
    setBroadcasts(prev => prev.filter(b => b.broadcastId !== activeBc.broadcastId));
    if (currentIndex >= broadcasts.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeBroadcast(activeBc.broadcastId);
    } catch (e) {}
    handleDismiss();
  };

  const isEmergency = activeBc.priority === 'urgent' || activeBc.category === 'emergency_alert';

  return (
    <div
      className={`relative z-40 px-4 py-2 text-xs sm:text-sm font-medium transition-all border-b ${
        isEmergency
          ? 'bg-[#7A271A] text-bone-white border-[#5c1c13] shadow-xs'
          : 'bg-surface-container-low dark:bg-stone-900 text-onyx-black dark:text-stone-100 border-sand-neutral/80 dark:border-stone-800 shadow-2xs'
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isEmergency 
              ? 'bg-white/20 text-white' 
              : 'bg-surface-container-lowest dark:bg-stone-800 border border-sand-neutral dark:border-stone-700 text-[#6B4B2B] dark:text-[#D4AF37]'
          }`}>
            {isEmergency ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Megaphone className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="truncate">
            <span className={`font-label-caps text-[10px] font-bold uppercase tracking-wider mr-2 px-2 py-0.5 rounded ${
              isEmergency 
                ? 'bg-black/25 text-white' 
                : 'bg-surface-container dark:bg-stone-800 border border-sand-neutral dark:border-stone-700 text-[#6B4B2B] dark:text-[#D4AF37]'
            }`}>
              {activeBc.targetAreaName || 'Area Broadcast'}
            </span>
            <span className="font-bold text-xs uppercase font-label-caps tracking-wider">{activeBc.title}:</span>{' '}
            <span className="font-sans text-xs opacity-90">{activeBc.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeBc.actionUrl && (
            <a
              href={activeBc.actionUrl}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-button-text uppercase tracking-wider font-semibold transition ${
                isEmergency
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral dark:border-stone-700'
              }`}
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={handleAcknowledge}
            className={`px-2.5 py-1 rounded-md text-[11px] font-button-text uppercase tracking-wider font-semibold transition flex items-center gap-1 cursor-pointer ${
              isEmergency
                ? 'bg-black/30 hover:bg-black/40 text-white'
                : 'bg-onyx-black hover:bg-[#6B4B2B] text-bone-white'
            }`}
            title="Mark as Read"
          >
            <Check className="w-3 h-3" />
            <span className="hidden md:inline">Got it</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition opacity-70 hover:opacity-100 cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
