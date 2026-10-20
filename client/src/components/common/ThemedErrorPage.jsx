import React, { useEffect } from 'react';
import { 
  Compass, 
  Lock, 
  ShieldAlert, 
  ServerCrash, 
  Wrench, 
  WifiOff, 
  Clock, 
  Home, 
  ArrowLeft, 
  RefreshCw, 
  HelpCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

/**
 * Standard HTTP & System Status Configurations
 * All styled strictly with TiffinLink's exact artisanal theme:
 * - Fonts: EB Garamond (serif headers) & Hanken Grotesk (sans-serif body)
 * - Colors: bone-white (#fbf9f5), onyx-black (#181512), clay-earth (#4B3621 / #6B4B2B), gold (#D4AF37), sand-neutral (#ded9d1 / #D8CEBE)
 */
const STATUS_CONFIGS = {
  404: {
    code: '404',
    badge: 'PAGE NOT FOUND',
    icon: Compass,
    iconBg: 'bg-[#6B4B2B]/10 text-[#6B4B2B] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]',
    title: "Oops! This page couldn't be found.",
    description: "The artisanal kitchen, order dispatch, or page you were looking for may have moved, expired, or the link may be incorrect.",
    primaryAction: { label: 'Go Home', icon: Home, target: '#home' },
    secondaryAction: { label: 'Go Back', icon: ArrowLeft, action: 'back' },
    tertiaryAction: { label: 'Contact Support', icon: HelpCircle, target: '#contact' }
  },
  401: {
    code: '401',
    badge: 'AUTHENTICATION REQUIRED',
    icon: Lock,
    iconBg: 'bg-[#6B4B2B]/10 text-[#6B4B2B] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]',
    title: 'Your session has expired. Please sign in again.',
    description: 'To protect your culinary preferences, order history, and account security, your secure session has timed out.',
    primaryAction: { label: 'Log In', icon: Lock, action: 'login' },
    secondaryAction: { label: 'Return Home', icon: Home, target: '#home' },
    tertiaryAction: null
  },
  403: {
    code: '403',
    badge: 'ACCESS RESTRICTED',
    icon: ShieldAlert,
    iconBg: 'bg-[#a0522d]/10 text-[#a0522d] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]',
    title: "You don't have permission to access this page.",
    description: 'Your verified credentials do not have administrative or role clearance to inspect this protected panel or culinary ledger.',
    primaryAction: { label: 'Return to Dashboard', icon: Home, action: 'dashboard' },
    secondaryAction: { label: 'Go Back', icon: ArrowLeft, action: 'back' },
    tertiaryAction: { label: 'Contact Support', icon: HelpCircle, target: '#contact' }
  },
  500: {
    code: '500',
    badge: 'SERVER NOT RESPONDING',
    icon: ServerCrash,
    iconBg: 'bg-[#dc2626]/10 text-[#dc2626] dark:bg-[#fee2e2]/10 dark:text-[#f87171]',
    title: 'Server Is Currently Unreachable',
    description: 'Our culinary kitchen servers are currently not responding. Our engineering team is actively attending to this. The platform will automatically resume once connections are re-established.',
    primaryAction: null,
    secondaryAction: null,
    tertiaryAction: null,
    hideActions: true,
    hideFooter: true
  },
  503: {
    code: '503',
    badge: 'SCHEDULED MAINTENANCE',
    icon: Wrench,
    iconBg: 'bg-[#D4AF37]/15 text-[#8C6239] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37]',
    title: 'TiffinLink Is Under Maintenance',
    description: 'We are currently performing routine upgrades to our meal routing and dispatch engine. The platform will automatically resume once the maintenance window concludes.',
    primaryAction: null,
    secondaryAction: null,
    tertiaryAction: null,
    hideActions: true,
    hideFooter: true
  },
  offline: {
    code: 'OFFLINE',
    badge: 'NETWORK DISCONNECTED',
    icon: WifiOff,
    iconBg: 'bg-[#665d52]/15 text-[#1b1c1a] dark:bg-stone-800 dark:text-stone-300',
    title: "You're offline. Some features may not be available.",
    description: 'Your internet connection was interrupted. Offline mode protects your active selections until full connectivity is restored.',
    primaryAction: { label: 'Retry Connection', icon: RefreshCw, action: 'retry-network' },
    secondaryAction: { label: 'Go Home', icon: Home, target: '#home' },
    tertiaryAction: null
  },
  429: {
    code: '429',
    badge: 'RATE LIMIT REACHED',
    icon: Clock,
    iconBg: 'bg-[#D4AF37]/15 text-[#8C6239] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37]',
    title: 'Too many requests. Please slow down.',
    description: 'You have submitted multiple requests in a short period. Please wait a brief moment before retrying.',
    primaryAction: { label: 'Try Again', icon: RefreshCw, action: 'reload' },
    secondaryAction: { label: 'Go Home', icon: Home, target: '#home' },
    tertiaryAction: null
  }
};

export default function ThemedErrorPage({
  status = 404,
  customTitle,
  customDescription,
  errorId,
  onPrimaryClick,
  onSecondaryClick,
  onTertiaryClick,
  onNavigateHome,
  onOpenLogin,
  onOpenContact
}) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS[404];
  const IconComponent = config.icon;

  useEffect(() => {
    // Accessibility announcement for screen readers
    const announceEl = document.getElementById('a11y-status-announcement');
    if (announceEl) {
      announceEl.textContent = `${config.badge}: ${customTitle || config.title}`;
    }
  }, [config, customTitle]);

  const handleAction = (actionDef, callback) => {
    if (callback) {
      callback();
      return;
    }

    if (!actionDef) return;

    if (actionDef.target) {
      window.location.hash = actionDef.target;
      return;
    }

    switch (actionDef.action) {
      case 'back':
        if (window.history.length > 1) {
          window.history.back();
        } else if (onNavigateHome) {
          onNavigateHome();
        } else {
          window.location.hash = '#home';
        }
        break;
      case 'reload':
      case 'retry-network':
        window.location.reload();
        break;
      case 'login':
        if (onOpenLogin) {
          onOpenLogin();
        } else {
          window.location.hash = '#home';
        }
        break;
      case 'dashboard':
        if (onNavigateHome) {
          onNavigateHome();
        } else {
          window.location.hash = '#home';
        }
        break;
      case 'status':
        window.location.reload();
        break;
      default:
        if (onNavigateHome) onNavigateHome();
        else window.location.hash = '#home';
    }
  };

  return (
    <div 
      className="min-h-[80vh] w-full bg-[#fbf9f5] dark:bg-[#121214] flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden font-sans select-none"
      role="region"
      aria-labelledby="themed-error-title"
    >
      {/* Hidden screen reader live region for accessibility */}
      <div 
        id="a11y-status-announcement" 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
      />

      {/* Subtle Warm Amber / Gold Ambient Glow matching Landing Page */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 border border-[#ded9d1] dark:border-stone-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl text-center overflow-hidden animate-fade-in">
        
        {/* Top Decorative Artisanal Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#6B4B2B] to-[#D4AF37]/20" />

        {/* Big TiffinLink Brand Logo & Error (Specifically for Error 503) */}
        {config.code === '503' ? (
          <div className="mb-2 flex flex-col items-center justify-center">
            {/* Big Artisanal TiffinLink Brand Logo */}
            <div 
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              className="text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight text-[#181512] dark:text-[#fbf9f5] select-none leading-none mb-2"
            >
              TiffinLink
            </div>
            
            <span className="font-label-caps text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase mb-6 block">
              EST. 2026 &bull; ARTISANAL HOME DINING
            </span>

            {/* Scheduled Maintenance Status Badge (No Error Code Displayed) */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#8C6239] dark:text-[#D4AF37] text-xs font-mono font-bold tracking-wider mb-4 shadow-2xs">
              <Wrench className="w-4 h-4 text-[#8C6239] dark:text-[#D4AF37]" />
              <span>SCHEDULED MAINTENANCE</span>
            </div>

            {/* Serif Headline matching Hero / FoodSafety */}
            <h1 
              id="themed-error-title"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
              className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
            >
              {customTitle || config.title}
            </h1>

            {/* Plain Language Body Text */}
            <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
              {customDescription || config.description}
            </p>
          </div>
        ) : (
          <>
            {/* Large Decorative Status Code Watermark (Hidden on 500 & 503) */}
            {config.code !== '500' && config.code !== '503' && (
              <div 
                className="text-6xl sm:text-7xl md:text-8xl font-serif text-[#ded9d1]/40 dark:text-stone-800/60 font-bold select-none pointer-events-none -mb-8 leading-none"
                aria-hidden="true"
              >
                {config.code}
              </div>
            )}

            {/* Status Icon Card */}
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${config.iconBg} border border-[#ded9d1] dark:border-stone-700 flex items-center justify-center mx-auto mb-5 shadow-xs transition-transform duration-300 hover:scale-105`}>
              <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
            </div>

            {/* Artisanal Eyebrow Tag */}
            <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase mb-2.5 block">
              {config.badge}
            </span>

            {/* Serif Headline matching Hero / FoodSafety */}
            <h1 
              id="themed-error-title"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
              className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
            >
              {customTitle || config.title}
            </h1>

            {/* Plain Language Body Text */}
            <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
              {customDescription || config.description}
            </p>
          </>
        )}

        {/* Safe Error Correlation ID if provided */}
        {errorId && (
          <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#f5f3ef] dark:bg-stone-800 border border-[#ded9d1] dark:border-stone-700 text-xs font-mono text-[#665d52] dark:text-stone-300">
            <span>Reference ID:</span>
            <span className="font-bold text-[#181512] dark:text-white">{errorId}</span>
          </div>
        )}

        {/* Context-Aware Primary & Secondary Actions (Hidden on 500 & 503) */}
        {!config.hideActions && (config.primaryAction || config.secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
            {config.primaryAction && (
              <button
                type="button"
                onClick={() => handleAction(config.primaryAction, onPrimaryClick)}
                className="flex-1 px-6 py-3.5 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {React.createElement(config.primaryAction.icon, { className: 'w-4 h-4' })}
                <span>{config.primaryAction.label}</span>
              </button>
            )}

            {config.secondaryAction && (
              <button
                type="button"
                onClick={() => handleAction(config.secondaryAction, onSecondaryClick)}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {React.createElement(config.secondaryAction.icon, { className: 'w-4 h-4' })}
                <span>{config.secondaryAction.label}</span>
              </button>
            )}
          </div>
        )}

        {/* Tertiary Action (e.g. Contact Support) */}
        {!config.hideActions && config.tertiaryAction && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleAction(config.tertiaryAction, onTertiaryClick || onOpenContact)}
              className="text-xs font-button-text font-semibold text-[#6B4B2B] dark:text-[#D4AF37] hover:underline underline-offset-4 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {React.createElement(config.tertiaryAction.icon, { className: 'w-3.5 h-3.5' })}
              <span>Need culinary support or assistance? Reach out to our team</span>
            </button>
          </div>
        )}

        {/* Polite Apology Status Pill (Replacing automated monitoring telemetry) */}
        {config.hideActions && (
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#fbf9f5] dark:bg-stone-800 border border-[#ded9d1] dark:border-stone-700 text-xs font-sans text-[#665d52] dark:text-stone-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-medium tracking-wide">Sorry for the inconvenience</span>
          </div>
        )}

        {/* Footer Guarantee Seal (Hidden on 500 and 503) */}
        {!config.hideFooter && (
          <div className="mt-8 pt-5 border-t border-[#ded9d1]/70 dark:border-stone-800/80 flex items-center justify-center gap-2 text-[10px] font-label-caps text-[#8C827A] dark:text-stone-500 uppercase tracking-widest font-bold">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
            <span>TiffinLink Artisanal Network &bull; Pure Home Dining</span>
          </div>
        )}
      </div>
    </div>
  );
}
