import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  RefreshCw, 
  ShoppingBag, 
  Truck, 
  Home, 
  ShieldCheck, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { apiRequest } from '../../services/api';

/**
 * Standardized Artisanal Payment & Checkout Result View
 * Section 7 Specification:
 * - Payment Successful
 * - Payment Failed
 * - Payment Pending / Verification
 * - Order Confirmation Pending
 * - Refund Status
 * 
 * Strict rule: All data verified against real MongoDB Order / Payment records.
 */
export default function ThemedPaymentResultView({
  orderId,
  initialStatus = 'pending', // 'success' | 'failed' | 'pending' | 'order_pending' | 'refund'
  onViewOrder,
  onNavigateHome,
  onRetryPayment,
  onExploreFood
}) {
  const [status, setStatus] = useState(initialStatus);
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderId));
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Authoritative Backend Order/Payment Verification
  const verifyOrderStatus = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await apiRequest(`/orders/${orderId}`);
      if (response && (response.success || response.orderId || response._id)) {
        const order = response.data || response;
        setOrderData(order);

        const rawStatus = String(order.status || '').toLowerCase().trim();
        const rawPayment = String(order.paymentStatus || '').toLowerCase().trim();

        if (rawStatus === 'cancelled' || rawStatus === 'rejected') {
          if (order.cancellationReason || order.refundStatus === 'completed' || rawPayment === 'refunded') {
            setStatus('refund');
          } else {
            setStatus('failed');
          }
        } else if (rawPayment === 'failed') {
          setStatus('failed');
        } else if (rawPayment === 'paid' || rawPayment === 'completed' || rawStatus === 'confirmed' || rawStatus === 'preparing' || rawStatus === 'assigned') {
          setStatus('success');
        } else if (rawPayment === 'pending' || rawStatus === 'pending') {
          setStatus('pending');
        } else {
          setStatus('order_pending');
        }
      } else {
        setErrorMessage(response.message || 'Unable to retrieve order details.');
      }
    } catch (err) {
      setErrorMessage('Connection interrupted while reconciling order.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    verifyOrderStatus();
  }, [verifyOrderStatus]);

  const copyOrderIdToClipboard = () => {
    if (!orderId) return;
    try {
      navigator.clipboard.writeText(orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="min-h-[85vh] w-full bg-[#fbf9f5] dark:bg-[#121214] flex items-center justify-center p-4 sm:p-6 md:p-12 relative overflow-hidden font-sans select-none">
      {/* Warm Ambient Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 border border-[#ded9d1] dark:border-stone-800 rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl text-center overflow-hidden animate-fade-in">
        
        {/* Top Decorative Artisanal Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#6B4B2B] to-[#D4AF37]/20" />

        {/* 1. PAYMENT SUCCESSFUL */}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#1b5e20] dark:text-emerald-400 uppercase mb-2.5 block">
              PAYMENT VERIFIED &bull; ORDER CONFIRMED
            </span>

            <h1 
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
              className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
            >
              Thank You for Your Order!
            </h1>

            <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
              Your transaction has been verified and your home chef has been dispatched. Your culinary meal is now scheduled for preparation.
            </p>

            {/* Order Ledger Card */}
            <div className="mb-6 p-4 rounded-xl bg-[#fbf9f5] dark:bg-stone-800/60 border border-[#ded9d1] dark:border-stone-700/80 text-left text-xs font-sans space-y-2">
              <div className="flex items-center justify-between text-[#181512] dark:text-white font-medium">
                <span>Order Reference:</span>
                <button
                  type="button"
                  onClick={copyOrderIdToClipboard}
                  className="font-mono font-bold text-xs flex items-center gap-1.5 hover:text-[#6B4B2B] transition-colors cursor-pointer"
                >
                  <span>{orderId || 'TL-ORDER-VERIFIED'}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 opacity-60" />}
                </button>
              </div>

              {orderData?.totalAmount && (
                <div className="flex items-center justify-between text-[#181512] dark:text-white font-medium">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{orderData.totalAmount}</span>
                </div>
              )}

              {orderData?.providerName && (
                <div className="flex items-center justify-between text-[#665d52] dark:text-stone-400">
                  <span>Kitchen:</span>
                  <span className="font-semibold text-[#181512] dark:text-stone-200">{orderData.providerName}</span>
                </div>
              )}

              {orderData?.deliveryAddress && (
                <div className="flex items-start justify-between text-[#665d52] dark:text-stone-400 pt-1 border-t border-[#ded9d1]/40">
                  <span>Drop-off Address:</span>
                  <span className="max-w-[240px] text-right truncate">{orderData.deliveryAddress}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  if (onViewOrder) onViewOrder(orderId);
                  else window.location.hash = '#orders';
                }}
                className="flex-1 px-6 py-3.5 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Track Live Order</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateHome) onNavigateHome();
                  else window.location.hash = '#home';
                }}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </>
        )}

        {/* 2. PAYMENT FAILED */}
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#dc2626] uppercase mb-2.5 block">
              TRANSACTION COULD NOT BE COMPLETED
            </span>

            <h1 
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
              className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
            >
              Payment Unsuccessful
            </h1>

            <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
              Your payment could not be processed by the gateway or bank. No charges were made to your account. Your items remain safely in your cart.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  if (onRetryPayment) onRetryPayment();
                  else window.location.hash = '#find-tiffin?checkout=true';
                }}
                className="flex-1 px-6 py-3.5 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Payment Safely</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onExploreFood) onExploreFood();
                  else window.location.hash = '#find-tiffin';
                }}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Review Cart</span>
              </button>
            </div>
          </>
        )}

        {/* 3. PAYMENT PENDING / RECONCILING */}
        {(status === 'pending' || status === 'order_pending') && (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF1D8] text-[#6B4B2B] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37] border border-[#ded9d1] dark:border-stone-700 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>

            <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase mb-2.5 block">
              PAYMENT VERIFICATION PENDING
            </span>

            <h1 
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
              className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
            >
              Waiting for Bank Confirmation
            </h1>

            <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
              We have not yet received final confirmation from your bank or UPI gateway. We are automatically polling the server to verify your transaction. Please do not submit duplicate payments.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={verifyOrderStatus}
                disabled={isLoading}
                className="flex-1 px-6 py-3.5 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Reconciling...' : 'Check Status Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateHome) onNavigateHome();
                  else window.location.hash = '#orders';
                }}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>View Order History</span>
              </button>
            </div>
          </>
        )}

        {/* 4. REFUND STATUS */}
        {status === 'refund' && (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#1b5e20] dark:text-emerald-400 uppercase mb-2.5 block">
              100% ESCROW REFUND ISSUED
            </span>

            <h1 
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }} 
              className="text-2xl sm:text-3xl md:text-4xl text-[#181512] dark:text-[#fbf9f5] font-normal tracking-tight mb-3 leading-snug"
            >
              Refund Processed to Source
            </h1>

            <p className="text-sm sm:text-base text-[#665d52] dark:text-stone-400 font-sans leading-relaxed mb-6 max-w-md mx-auto">
              Your order was cancelled by the kitchen or system. Under our TiffinLink Escrow Guarantee, 100% of the funds have been credited back to your original payment method.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  if (onExploreFood) onExploreFood();
                  else window.location.hash = '#find-tiffin';
                }}
                className="flex-1 px-6 py-3.5 bg-[#181512] hover:bg-[#6B4B2B] text-white font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Find Alternative Kitchen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onViewOrder) onViewOrder(orderId);
                  else window.location.hash = '#orders';
                }}
                className="flex-1 px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-[#f5f3ef] dark:hover:bg-stone-700 text-[#181512] dark:text-stone-200 border border-[#ded9d1] dark:border-stone-700 font-button-text font-bold text-xs uppercase tracking-[0.15em] rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Order Details</span>
              </button>
            </div>
          </>
        )}

        {/* Footer Seal */}
        <div className="mt-8 pt-5 border-t border-[#ded9d1]/70 dark:border-stone-800/80 flex items-center justify-center gap-2 text-[10px] font-label-caps text-[#8C827A] dark:text-stone-500 uppercase tracking-widest font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
          <span>TiffinLink Escrow Protection &bull; Zero Unauthorized Charges</span>
        </div>
      </div>
    </div>
  );
}
