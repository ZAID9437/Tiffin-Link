import React from 'react';
import { 
  Clock, 
  FileCheck2, 
  AlertCircle, 
  ShieldAlert, 
  FileEdit, 
  UserX, 
  MailCheck, 
  KeyRound, 
  Home, 
  RefreshCw, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

/**
 * Standardized Account & Application State Page
 * Handles Provider/Delivery verification flows, suspensions, document updates, and auth states.
 * Styled with TiffinLink's exact artisanal theme.
 */
const ACCOUNT_STATES = {
  provider_pending: {
    badge: 'APPLICATION IN CULINARY AUDIT',
    icon: Clock,
    iconBg: 'bg-[#FAF1D8] text-[#6B4B2B] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]',
    title: 'Your Kitchen Application is Under Review',
    description: 'Our culinary auditing team is currently reviewing your kitchen standards, FSSAI registration, and hygiene practices. Kitchen reviews typically take 24–48 hours.',
    checklist: [
      { text: 'FSSAI License & Identity Verification', done: true },
      { text: 'Kitchen Hygiene & Cleanliness Review', done: false },
      { text: 'Menu Items & Safe Sourcing Standards', done: false },
      { text: 'Banking & Automated Payout Channel', done: true }
    ],
    primaryAction: { label: 'Refresh Audit Status', action: 'refresh' },
    secondaryAction: { label: 'Contact Kitchen Onboarding', action: 'support' }
  },
  delivery_pending: {
    badge: 'PARTNER APPLICATION IN REVIEW',
    icon: Clock,
    iconBg: 'bg-[#FAF1D8] text-[#6B4B2B] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]',
    title: 'Your Delivery Partner Account is Being Verified',
    description: 'Our fleet safety desk is reviewing your driver license, vehicle registration, and background verification. You will receive an SMS and email notification once approved.',
    checklist: [
      { text: 'Driving License & Government ID Verified', done: true },
      { text: 'Vehicle Registration Document Audit', done: false },
      { text: 'Thermal Tiffin Bag & Safety Training', done: false },
      { text: 'Weekly Payout Bank Verification', done: true }
    ],
    primaryAction: { label: 'Check Status', action: 'refresh' },
    secondaryAction: { label: 'Contact Driver Support', action: 'support' }
  },
  rejected: {
    badge: 'APPLICATION NOT APPROVED',
    icon: AlertCircle,
    iconBg: 'bg-[#dc2626]/10 text-[#dc2626] dark:bg-red-950/40 dark:text-red-300',
    title: 'Your Application Could Not Be Approved',
    description: 'Unfortunately, your submission did not meet the mandatory compliance or documentation criteria for our artisanal network. You may update your documentation and reapply.',
    checklist: null,
    primaryAction: { label: 'Resubmit Documents', action: 'resubmit' },
    secondaryAction: { label: 'Inquire with Support', action: 'support' }
  },
  documents_correction: {
    badge: 'DOCUMENT UPDATE REQUIRED',
    icon: FileEdit,
    iconBg: 'bg-[#a0522d]/10 text-[#a0522d] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]',
    title: 'Additional Documentation Required',
    description: 'Our compliance desk requires an updated or clearer copy of your registered documentation (FSSAI certificate, Government ID, or Bank passbook).',
    checklist: null,
    primaryAction: { label: 'Update Documents Now', action: 'update_docs' },
    secondaryAction: { label: 'Contact Support', action: 'support' }
  },
  suspended: {
    badge: 'ACCOUNT ACCESS RESTRICTED',
    icon: ShieldAlert,
    iconBg: 'bg-[#dc2626]/10 text-[#dc2626] dark:bg-red-950/40 dark:text-red-300',
    title: 'Your Account Has Been Temporarily Suspended',
    description: 'Access to dispatch and order acceptance has been temporarily halted in accordance with platform quality or community standards. Please reach out to our partner compliance desk.',
    checklist: null,
    primaryAction: { label: 'Contact Compliance Desk', action: 'support' },
    secondaryAction: { label: 'Return Home', action: 'home' }
  },
  onboarding_incomplete: {
    badge: 'ONBOARDING INCOMPLETE',
    icon: FileCheck2,
    iconBg: 'bg-[#FAF1D8] text-[#6B4B2B] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]',
    title: 'Complete Your Profile to Begin Receiving Orders',
    description: 'You have unfinished onboarding steps. Finalize your service area, bank details, and sample menu to activate your kitchen storefront.',
    checklist: null,
    primaryAction: { label: 'Resume Onboarding', action: 'resume' },
    secondaryAction: { label: 'Go to Dashboard', action: 'dashboard' }
  },
  profile_not_found: {
    badge: 'PROFILE NOT FOUND',
    icon: UserX,
    iconBg: 'bg-[#f5f3ef] text-[#665d52] dark:bg-stone-800 dark:text-stone-300',
    title: 'Account Ledger Record Not Found',
    description: 'The requested partner or user record could not be located in our system or may have been permanently archived.',
    checklist: null,
    primaryAction: { label: 'Return Home', action: 'home' },
    secondaryAction: { label: 'Contact Support', action: 'support' }
  }
};

export default function ThemedAccountStatePage({
  stateKey = 'provider_pending',
  customTitle,
  customDescription,
  user,
  onRefresh,
  onAction,
  onNavigateHome,
  onOpenSupport
}) {
  const stateConfig = ACCOUNT_STATES[stateKey] || ACCOUNT_STATES.provider_pending;
  const IconComponent = stateConfig.icon;

  const handleActionClick = (actionType) => {
    switch (actionType) {
      case 'refresh':
        if (onRefresh) onRefresh();
        else window.location.reload();
        break;
      case 'home':
        if (onNavigateHome) onNavigateHome();
        else window.location.hash = '#home';
        break;
      case 'support':
        if (onOpenSupport) onOpenSupport();
        else window.location.hash = '#contact';
        break;
      case 'resubmit':
      case 'update_docs':
      case 'resume':
      case 'dashboard':
        if (onAction) onAction(actionType);
        else if (user?.role === 'provider') window.location.hash = '#provider';
        else if (user?.role === 'delivery') window.location.hash = '#delivery';
        else window.location.hash = '#home';
        break;
      default:
        if (onAction) onAction(actionType);
    }
  };

  return (
    <div className="min-h-[85vh] w-full bg-[#fbf9f5] dark:bg-[#121214] flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden font-sans select-none">
      {/* Warm Ambient Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 border border-[#ded9d1] dark:border-stone-800 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl text-center overflow-hidden animate-fade-in">
        
        {/* Top Decorative Artisanal Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#6B4B2B] to-[#D4AF37]/20" />

        {/* State Icon */}
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${stateConfig.iconBg} border border-[#ded9d1] dark:border-stone-700 flex items-center justify-center mx-auto mb-5 shadow-xs transition-transform duration-300 hover:scale-105`}>
          <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
        </div>

        {/* Eyebrow */}
        <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase mb-2.5 block">
          {stateConfig.badge}
        </span>

        {/* Title */}
        <h1 
          style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
          className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
        >
          {customTitle || stateConfig.title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
          {customDescription || stateConfig.description}
        </p>

        {/* Real User/Business Details Snapshot if present */}
        {user && (
          <div className="mb-6 p-4 rounded-xl bg-[#fbf9f5] dark:bg-stone-800/60 border border-[#ded9d1] dark:border-stone-700/80 text-left text-xs font-sans space-y-1.5">
            <div className="flex items-center justify-between text-[#181512] dark:text-white font-medium">
              <span>Account:</span>
              <span className="font-semibold">{user.businessName || user.name || user.email}</span>
            </div>
            <div className="flex items-center justify-between text-[#665d52] dark:text-stone-400">
              <span>Role:</span>
              <span className="uppercase font-mono text-[11px]">{user.role || 'Partner'}</span>
            </div>
            {user.createdAt && (
              <div className="flex items-center justify-between text-[#665d52] dark:text-stone-400">
                <span>Application Date:</span>
                <span>{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        )}

        {/* Audit Checklist (for pending states) */}
        {stateConfig.checklist && (
          <div className="mb-6 p-4 rounded-xl bg-[#fbf9f5] dark:bg-stone-800/40 border border-[#ded9d1] dark:border-stone-700/60 text-left space-y-2.5">
            <span className="font-label-caps text-[10px] font-bold tracking-[0.2em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase block">
              Vetting Progress Checklist
            </span>
            {stateConfig.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-[#181512] dark:text-stone-200">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#1b5e20] dark:text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin shrink-0" />
                )}
                <span className={item.done ? 'opacity-90' : 'font-medium'}>{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
          {stateConfig.primaryAction && (
            <button
              type="button"
              onClick={() => handleActionClick(stateConfig.primaryAction.action)}
              className="flex-1 px-6 py-3.5 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{stateConfig.primaryAction.label}</span>
            </button>
          )}

          {stateConfig.secondaryAction && (
            <button
              type="button"
              onClick={() => handleActionClick(stateConfig.secondaryAction.action)}
              className="flex-1 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{stateConfig.secondaryAction.label}</span>
            </button>
          )}
        </div>

        {/* Footer Seal */}
        <div className="mt-8 pt-5 border-t border-[#ded9d1]/70 dark:border-stone-800/80 flex items-center justify-center gap-2 text-[10px] font-label-caps text-[#8C827A] dark:text-stone-500 uppercase tracking-widest font-bold">
          <Sparkles className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
          <span>FSSAI Hygiene Compliant &bull; Verified Kitchen Security</span>
        </div>
      </div>
    </div>
  );
}
