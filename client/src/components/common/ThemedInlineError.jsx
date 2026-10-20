import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

/**
 * Reusable Themed Inline Error Component
 * For displaying field-level, form-level, or card-level errors without triggering full page reloads.
 */
export default function ThemedInlineError({
  message = 'An unexpected error occurred while processing your request.',
  code,
  onRetry,
  onDismiss,
  className = '',
  variant = 'warning' // 'warning' | 'error' | 'info'
}) {
  if (!message) return null;

  const variantStyles = {
    error: 'bg-[#fee2e2]/70 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-900 dark:text-red-200',
    warning: 'bg-[#FAF1D8] dark:bg-amber-950/40 border-[#ded9d1] dark:border-amber-800 text-[#6B4B2B] dark:text-[#E5C158]',
    info: 'bg-[#f5f3ef] dark:bg-stone-800 border-[#ded9d1] dark:border-stone-700 text-[#181512] dark:text-stone-200'
  };

  return (
    <div 
      className={`rounded-xl border p-3.5 sm:p-4 text-xs sm:text-sm font-sans flex items-start gap-3 relative animate-fade-in ${variantStyles[variant] || variantStyles.warning} ${className}`}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-current opacity-90" aria-hidden="true" />
      
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-medium leading-relaxed">{message}</p>
        {code && (
          <span className="block mt-1 text-[11px] font-mono opacity-75">
            Code: {code}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-current text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
