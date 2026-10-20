import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Truck, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw,
  Ban,
  Activity
} from 'lucide-react';

/**
 * Standardized Artisanal Status Badge for all TiffinLink Panels
 * Maps semantic status tokens to accessible, theme-consistent styles
 */
const STATUS_MAP = {
  // Positive / Success
  delivered: { 
    label: 'Delivered', 
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    icon: CheckCircle2 
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    icon: CheckCircle2 
  },
  verified: { 
    label: 'Verified & Audited', 
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    icon: ShieldCheck 
  },
  approved: { 
    label: 'Approved', 
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    icon: ShieldCheck 
  },
  active: { 
    label: 'Active', 
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    icon: Activity 
  },

  // In-Progress / Ongoing
  preparing: { 
    label: 'Kitchen Preparing', 
    color: 'bg-[#FAF1D8] text-[#6B4B2B] border-[#D4AF37]/40 dark:bg-amber-950/40 dark:text-[#E5C158] dark:border-amber-800', 
    icon: ChefHat 
  },
  on_the_way: { 
    label: 'Out for Delivery', 
    color: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800', 
    icon: Truck 
  },
  dispatched: { 
    label: 'Dispatched', 
    color: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800', 
    icon: Truck 
  },
  assigned: { 
    label: 'Driver Assigned', 
    color: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800', 
    icon: Truck 
  },

  // Pending / Waiting
  pending: { 
    label: 'Pending Kitchen Confirmation', 
    color: 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700', 
    icon: Clock 
  },
  pending_approval: { 
    label: 'Review Pending', 
    color: 'bg-[#FAF1D8] text-[#6B4B2B] border-[#ded9d1] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', 
    icon: Clock 
  },
  in_escrow: { 
    label: 'Secured in Escrow', 
    color: 'bg-[#FAF1D8] text-[#6B4B2B] border-[#D4AF37]/30 dark:bg-amber-950/40 dark:text-[#E5C158] dark:border-amber-800', 
    icon: ShieldCheck 
  },

  // Negative / Terminal
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700', 
    icon: XCircle 
  },
  rejected: { 
    label: 'Declined by Kitchen', 
    color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900', 
    icon: AlertTriangle 
  },
  failed: { 
    label: 'Failed', 
    color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900', 
    icon: AlertTriangle 
  },
  payment_failed: { 
    label: 'Payment Failed', 
    color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900', 
    icon: AlertTriangle 
  },
  suspended: { 
    label: 'Account Suspended', 
    color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900', 
    icon: Ban 
  },

  // Refunds / Disputes
  refunded: { 
    label: '100% Refunded to Source', 
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', 
    icon: RotateCcw 
  },
  dispute_pending: { 
    label: 'Dispute Under Review', 
    color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', 
    icon: AlertTriangle 
  }
};

const SIZE_STYLES = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2'
};

export default function ThemedStatusBadge({
  status = 'pending',
  customLabel = '',
  showIcon = true,
  size = 'md',
  className = ''
}) {
  const normalized = String(status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const matched = STATUS_MAP[normalized] || {
    label: customLabel || status,
    color: 'bg-[#f5f3ef] text-[#665d52] border-[#ded9d1] dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    icon: Clock
  };

  const IconComp = matched.icon;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;
  const labelText = customLabel || matched.label;
  const fullClassName = [
    'inline-flex',
    'items-center',
    'font-button-text',
    'font-semibold',
    'rounded-full',
    'border',
    'select-none',
    sizeClass,
    matched.color,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={fullClassName}>
      {showIcon && IconComp ? (
        <IconComp className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      ) : null}
      <span>{labelText}</span>
    </span>
  );
}
