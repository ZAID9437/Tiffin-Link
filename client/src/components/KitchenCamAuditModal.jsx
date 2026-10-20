import React, { useState, useEffect } from 'react';
import {
  Video,
  ShieldCheck,
  CheckCircle2,
  Thermometer,
  Sparkles,
  X,
  Play,
  RotateCw,
  Eye,
  Award,
  AlertTriangle
} from 'lucide-react';
import { getKitchenAuditData } from '../services/advancedFeaturesApi';

export default function KitchenCamAuditModal({ isOpen, onClose, kitchenName = 'Radhe Krishna Satvik Kitchen' }) {
  const [audit, setAudit] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getKitchenAuditData(kitchenName).then(res => {
        if (res && res.success) {
          setAudit(res.audit);
        }
      }).catch(() => {});
    }
  }, [isOpen, kitchenName]);

  if (!isOpen) return null;

  const data = audit || {
    fssaiLicense: '10020021004921',
    cleanlinessRating: 4.9,
    oilQualityTpm: '12% TPM (Fresh cold-pressed)',
    waterPurityTds: '68 ppm (RO + Copper Infused)',
    staffSanitation: '100% Hairnets, Masks & Gloves verified',
    lastSanitizedAt: 'Today, 6:00 AM'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-bone-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-sand-neutral dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-surface-container dark:bg-stone-900 p-6 sm:p-7 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-surface-container-lowest dark:bg-stone-800 border border-sand-neutral/90 dark:border-stone-700 flex items-center justify-center shrink-0 text-[#6B4B2B] dark:text-[#D4AF37] shadow-2xs">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase">
                  TRANSPARENCY &amp; HYGIENE
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#6B4B2B]/10 dark:bg-[#D4AF37]/15 text-[#6B4B2B] dark:text-[#D4AF37] tracking-widest uppercase border border-[#6B4B2B]/20">
                  Live Stream
                </span>
              </div>
              <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-stone-100 font-normal tracking-tight">
                Kitchen Cam &amp; Hygiene Audit
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans leading-relaxed">
                100% Transparent Cooking: Watch how your meal is prepped &amp; packed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest dark:bg-stone-800 hover:bg-sand-neutral dark:hover:bg-stone-700 border border-sand-neutral/80 dark:border-stone-700 flex items-center justify-center text-onyx-black dark:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-onyx-black dark:text-stone-100">
          {/* Simulated CCTV Stream Display */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-stone-950 border border-stone-800 shadow-inner group">
            {/* Background Kitchen Cam Simulation */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-black flex items-center justify-center">
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-pulse">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  CAM 02 &bull; MAIN PREP COOKING HUB
                </div>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  Live stream active &bull; Clean stainless-steel cookware &bull; Filtered RO water
                </p>
              </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                REC &bull; 1080p HD
              </span>
            </div>

            <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
              Temp: 24°C &bull; Kitchen Air Purified
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/80 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <span className="font-semibold">{kitchenName}</span>
              <span className="font-mono text-[10px] text-stone-400">FPS: 30 &bull; Encryption: AES-256</span>
            </div>
          </div>

          {/* Hygiene Telemetry Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-surface-container-lowest dark:bg-stone-800/70 border border-sand-neutral dark:border-stone-800">
              <div className="flex items-center gap-2 text-[#6B4B2B] dark:text-[#D4AF37] text-[10px] uppercase font-label-caps tracking-wider font-bold">
                <Thermometer className="w-3.5 h-3.5 text-[#C25E34]" />
                <span>Oil Freshness (TPM)</span>
              </div>
              <div className="text-sm font-bold text-onyx-black dark:text-stone-100 mt-1 font-serif">
                {data.oilQualityTpm}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                Safe limit is &lt;25% &bull; Grade A
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-lowest dark:bg-stone-800/70 border border-sand-neutral dark:border-stone-800">
              <div className="flex items-center gap-2 text-[#6B4B2B] dark:text-[#D4AF37] text-[10px] uppercase font-label-caps tracking-wider font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
                <span>Water Purity Index</span>
              </div>
              <div className="text-sm font-bold text-onyx-black dark:text-stone-100 mt-1 font-serif">
                {data.waterPurityTds}
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 font-sans mt-0.5">
                Lab Tested Mineral Balance
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-4 rounded-xl bg-surface-container-low dark:bg-stone-800/40 border border-sand-neutral dark:border-stone-800 space-y-2.5">
            <h4 className="font-label-caps text-[11px] font-bold text-[#6B4B2B] dark:text-[#D4AF37] uppercase tracking-[0.2em]">
              Daily Cleanliness Audit Passed
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
                <span>FSSAI Lic: #{data.fssaiLicense}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
                <span>{data.staffSanitation}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
                <span>UV Sterilized Utensils</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
                <span>Pest-Control Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
