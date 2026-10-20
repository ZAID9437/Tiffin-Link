import React from 'react';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * Reusable Theme-Consistent Empty State Component
 * Adheres strictly to the TiffinLink Landing Page Aesthetic:
 * - Font: EB Garamond for titles, Hanken Grotesk for body
 * - Palette: Bone-white (#FAF7F2 / #fbf9f5), Onyx-black (#181512), Sand (#ded9d1 / #D8CEBE), Clay (#4B3621 / #6B4B2B), Gold (#D4AF37)
 */
export default function ThemedEmptyState({
  title = 'No records found',
  description = 'There are no active records matching your criteria right now.',
  badgeText = 'STATUS NOTICE',
  icon: IconComponent = Sparkles,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onRefresh,
  className = '',
  compact = false
}) {
  return (
    <div 
      className={`w-full bg-[#fbf9f5] dark:bg-[#121214] border border-[#ded9d1] dark:border-stone-800 rounded-2xl ${compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'} text-center flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${className}`}
      role="region"
      aria-label={title}
    >
      {/* Subtle Warm Amber Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Decorative Icon Container */}
      <div className={`${compact ? 'w-12 h-12 mb-3.5' : 'w-16 h-16 mb-4'} rounded-2xl bg-white dark:bg-stone-800 border border-[#ded9d1] dark:border-stone-700 text-[#6B4B2B] dark:text-[#D4AF37] flex items-center justify-center shadow-2xs relative z-10 transition-transform duration-300 hover:scale-105`}>
        {IconComponent && <IconComponent className={compact ? 'w-6 h-6' : 'w-8 h-8'} aria-hidden="true" />}
      </div>

      {/* Eyebrow Badge */}
      {badgeText && (
        <span className="font-label-caps text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase mb-2 block relative z-10">
          {badgeText}
        </span>
      )}

      {/* Serif Title */}
      <h3 
        style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
        className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-normal text-[#181512] dark:text-[#fbf9f5] tracking-tight mb-2 max-w-lg leading-snug relative z-10`}
      >
        {title}
      </h3>

      {/* Descriptive Text */}
      <p className="text-xs sm:text-sm text-[#665d52] dark:text-stone-400 font-sans max-w-md mx-auto leading-relaxed mb-6 relative z-10">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>{secondaryActionLabel}</span>
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2.5 sm:py-3 bg-transparent hover:bg-[#ded9d1]/40 text-[#665d52] dark:text-stone-300 font-button-text font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Refresh"
            aria-label="Refresh view"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}
