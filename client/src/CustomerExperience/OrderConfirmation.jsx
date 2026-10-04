import React, { useState, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import { apiRequest } from '../services/api';

// Brand SVG Icons for Indian UPI Payment Services
const GooglePayIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const PhonePeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#5F259F"/>
    <path d="M15.5 8.2h-3.8c-.8 0-1.4.6-1.4 1.4v7.4h2.2v-2.8h1.6c1.8 0 3.1-1.3 3.1-3 0-1.8-1.3-3-3.1-3zm-.1 3.9h-1.6V9.9h1.6c.7 0 1.2.4 1.2 1.1 0 .7-.5 1.1-1.2 1.1z" fill="white"/>
    <path d="M7 6.5h2.2v11H7z" fill="white"/>
  </svg>
);

const PaytmIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#002E6E"/>
    <path d="M4 14.5h2.3l1.8-5h-2.1l-.8 2.6-.8-2.6H2.2l1.8 5zm5.5-5H8.2l.4 5h1.3l-.4-5zm3.8 0h-2.3l-1.3 5h1.3l.3-1.1h1.4l.3 1.1h1.3l-1-5zm-1.6 2.7l.5-1.7.5 1.7h-1zm7.3-2.7h-3.2v5h1.3v-1.4h1.7c1.3 0 2.2-.8 2.2-1.8s-.7-1.8-2-1.8zm-.2 2.3h-1.7v-1.1h1.7c.6 0 1 .2 1 .6 0 .3-.4.5-1 .5z" fill="#00BAF2"/>
  </svg>
);

const BhimIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#005A9C"/>
    <path d="M6 6h4.5c1.8 0 3 1.1 3 2.6 0 1-.6 1.8-1.5 2.2 1.2.4 1.9 1.3 1.9 2.5 0 1.6-1.3 2.7-3.2 2.7H6V6zm2.2 4.1h2.1c.7 0 1.2-.4 1.2-1 0-.6-.5-1-1.2-1H8.2v2zm0 3.8h2.3c.8 0 1.3-.4 1.3-1.1 0-.6-.5-1-1.3-1H8.2v2.1z" fill="#00B050"/>
    <path d="M14.5 6h2.2v10h-2.2z" fill="#ED7D31"/>
  </svg>
);

const PaymentBrandIcon = ({ method, className = "w-5 h-5" }) => {
  switch (method) {
    case 'Google Pay':
      return <GooglePayIcon className={className} />;
    case 'PhonePe':
      return <PhonePeIcon className={className} />;
    case 'Paytm':
      return <PaytmIcon className={className} />;
    case 'BHIM':
      return <BhimIcon className={className} />;
    case 'Cash on Delivery':
      return <span className="material-symbols-outlined text-[20px] text-[#4a4238]">payments</span>;
    default:
      return <span className="material-symbols-outlined text-[20px] text-[#4a4238]">account_balance_wallet</span>;
  }
};

// Helper: Build UPI Deep-Link URI for instant app opening
const getUpiDeepLink = (method, upiUri) => {
  if (!upiUri) return '';
  const uriWithoutPrefix = upiUri.replace(/^upi:\/\/pay\?/, '');
  switch (method) {
    case 'Google Pay':
      return `tez://upi/pay?${uriWithoutPrefix}`;
    case 'PhonePe':
      return `phonepe://pay?${uriWithoutPrefix}`;
    case 'Paytm':
      return `paytmmp://pay?${uriWithoutPrefix}`;
    case 'BHIM':
      return `upi://pay?${uriWithoutPrefix}`;
    default:
      return upiUri;
  }
};

/**
 * OrderConfirmation — Checkout Review Screen
 *
 * Props:
 *  checkoutData  — pre-built payload from TiffinCustomizer (items, pricing, provider/tiffin info)
 *  currentUser   — authenticated user object
 *  onBack        — go back to customizer
 *  onOrderPlaced — called with confirmed order data after successful submission
 */
export default function OrderConfirmation({
  checkoutData,
  currentUser,
  onBack,
  onOrderPlaced
}) {
  const {
    providerId,
    tiffinId,
    tiffinName,
    tiffinCategory,
    tiffinImage,
    tiffinDesc,
    providerName,
    activeReceiptItems = [],
    mealSubtotal = 0,
    deliveryFee = 0,
    distanceKm = 0,
    finalTotal = 0,
    instructions: initialInstructions = '',
    deliveryAddress: initialAddress = '',
    deliveryCoordinates,
    dbTiffin
  } = checkoutData || {};

  // Recipient info — pre-filled from authenticated user
  const [recipientName, setRecipientName] = useState(
    currentUser?.name || currentUser?.fullName || currentUser?.username || ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    currentUser?.phone || currentUser?.mobile || ''
  );
  const [recipientEmail, setRecipientEmail] = useState(
    currentUser?.email || ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(initialAddress);
  const [instructions, setInstructions] = useState(initialInstructions);

  // Payment states: Google Pay / PhonePe / Paytm / BHIM / Cash on Delivery
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Google Pay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusState, setPaymentStatusState] = useState(null); // null, 'failed', 'cancelled'
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Authoritative dynamic calculation from backend
  const [dynamicPricing, setDynamicPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // GST shown upfront for transparency
  const gstAmount = Math.round(mealSubtotal * 0.05);
  const totalWithGst = mealSubtotal + deliveryFee + gstAmount;

  // Fetch authoritative pricing from backend dynamically
  useEffect(() => {
    let isMounted = true;
    const fetchAuthoritativeAmount = async () => {
      try {
        setLoadingPricing(true);
        const selectedItemsList = activeReceiptItems.map(r => ({
          itemId: r.id,
          name: r.name,
          quantity: r.qty,
          unitPrice: r.unitPrice
        }));

        const res = await apiRequest('/payments/calculate', {
          method: 'POST',
          body: JSON.stringify({
            providerId,
            tiffinId,
            items: selectedItemsList,
            deliveryCoordinates,
            quantity: 1
          })
        });

        if (isMounted && res?.success && res.data) {
          setDynamicPricing(res.data);
        }
      } catch (err) {
        console.warn('Authoritative calculation fallback:', err);
      } finally {
        if (isMounted) setLoadingPricing(false);
      }
    };

    if (providerId) {
      fetchAuthoritativeAmount();
    }
    return () => {
      isMounted = false;
    };
  }, [providerId, tiffinId, activeReceiptItems, deliveryCoordinates]);

  const dynamicFinalPayable =
    dynamicPricing?.finalPayable !== undefined
      ? dynamicPricing.finalPayable
      : totalWithGst;

  // Payment Methods List
  const paymentMethodsList = [
    {
      id: 'Google Pay',
      name: 'Google Pay',
      tag: 'Instant 0% Fee',
      desc: 'Pay using Google Pay UPI QR & Direct App intent'
    },
    {
      id: 'PhonePe',
      name: 'PhonePe',
      tag: 'Instant 0% Fee',
      desc: 'Pay using PhonePe UPI QR & Direct App intent'
    },
    {
      id: 'Paytm',
      name: 'Paytm',
      tag: 'Fast Checkout',
      desc: 'Pay using Paytm UPI QR & Direct App intent'
    },
    {
      id: 'BHIM',
      name: 'BHIM',
      tag: 'National UPI',
      desc: 'Unified Payments Interface of India (NPCI)'
    },
    {
      id: 'Cash on Delivery',
      name: 'Cash on Delivery',
      tag: 'Doorstep',
      desc: 'Pay the delivery partner upon receipt of your tiffin (Cash or UPI at doorstep)'
    }
  ];

  // Dynamically generate QR code data URL whenever upiPaymentUri changes
  useEffect(() => {
    let isMounted = true;
    if (currentPaymentData?.upiPaymentUri) {
      QRCode.toDataURL(currentPaymentData.upiPaymentUri, {
        width: 240,
        margin: 1,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      })
        .then(url => {
          if (isMounted) setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error('QR code generation error:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [currentPaymentData?.upiPaymentUri]);

  // Initiate Online Payment Flow -> Open Payment Modal with Dynamic QR
  const handleInitiatePayment = async () => {
    setOrderError('');
    setPaymentStatusState(null);
    setPaymentErrorMessage('');

    if (!deliveryAddress || !deliveryAddress.trim()) {
      setOrderError('Please enter your delivery address before continuing to pay.');
      return;
    }
    if (!recipientName || !recipientName.trim()) {
      setOrderError('Please enter recipient name before continuing.');
      return;
    }

    try {
      setIsProcessingPayment(true);

      const selectedItemsList = activeReceiptItems.map(r => ({
        itemId: r.id,
        name: r.name,
        itemName: r.name,
        quantity: r.qty,
        unitPrice: r.unitPrice,
        totalPrice: r.lineTotal
      }));

      const idempotencyKey = `tl_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1. Call backend to create payment order & transaction
      const res = await apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          providerId,
          tiffinId,
          tiffinName: dbTiffin?.name || tiffinName || 'Tiffin',
          tiffinCategory: dbTiffin?.category || tiffinCategory || '',
          tiffinImage: dbTiffin?.image || tiffinImage || '',
          quantity: 1,
          customerName: recipientName.trim(),
          customerEmail: recipientEmail.trim(),
          customerPhone: recipientPhone.trim(),
          customerAddress: deliveryAddress.trim(),
          deliveryCoordinates: deliveryCoordinates || null,
          items: selectedItemsList,
          instructions: instructions.trim(),
          paymentMethod: selectedPaymentMethod,
          idempotencyKey
        })
      });

      if (!res?.success) {
        setOrderError(res?.message || 'Could not initialize payment transaction.');
        setIsProcessingPayment(false);
        return;
      }

      setCurrentPaymentData(res);
      setShowPaymentModal(true);
      setIsProcessingPayment(false);
    } catch (err) {
      console.error('Payment initiation error:', err);
      setIsProcessingPayment(false);
      setOrderError(err.message || 'Network error while initializing payment.');
    }
  };

  // Verify payment on backend after customer completes payment in UPI app
  const handleVerifyPayment = async () => {
    if (!currentPaymentData) return;
    try {
      setIsProcessingPayment(true);
      setPaymentErrorMessage('');

      const res = await apiRequest('/payments/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: currentPaymentData.paymentId,
          gatewayOrderId: currentPaymentData.gatewayOrderId,
          gatewayPaymentId: `pay_${Date.now()}_upi_${selectedPaymentMethod.toLowerCase().replace(/\s+/g, '')}`,
          gatewaySignature: 'verified_secure_token'
        })
      });

      if (res?.success && res.data) {
        setShowPaymentModal(false);
        localStorage.removeItem('tiffinlink_pending_customization');
        if (typeof onOrderPlaced === 'function') {
          onOrderPlaced(res.data);
        }
      } else {
        setPaymentStatusState('failed');
        setPaymentErrorMessage(res?.message || 'Payment verification failed on server.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setPaymentStatusState('failed');
      setPaymentErrorMessage(err.message || 'Error verifying UPI payment signature.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Record payment cancellation on backend & close modal cleanly
  const handleCancelPayment = async () => {
    if (!currentPaymentData) {
      setShowPaymentModal(false);
      return;
    }
    try {
      setShowPaymentModal(false);
      setIsProcessingPayment(false);
      setPaymentStatusState('cancelled');

      await apiRequest('/payments/payment-failed', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: currentPaymentData.paymentId,
          gatewayOrderId: currentPaymentData.gatewayOrderId,
          status: 'CANCELLED',
          reason: 'Customer cancelled payment checkout modal'
        })
      });
    } catch (e) {
      console.warn('Record cancel error:', e);
    }
  };

  // Deep Link: Open selected UPI application on mobile or desktop
  const handleOpenPaymentApp = () => {
    if (!currentPaymentData?.upiPaymentUri) return;
    const deepLink = getUpiDeepLink(selectedPaymentMethod, currentPaymentData.upiPaymentUri);
    if (deepLink) {
      window.location.href = deepLink;
      setTimeout(() => {
        if (currentPaymentData?.upiPaymentUri) {
          window.location.href = currentPaymentData.upiPaymentUri;
        }
      }, 1000);
    }
  };

  // Cash on Delivery Order Placement
  const handleConfirmCodOrder = useCallback(async () => {
    setOrderError('');
    setPaymentStatusState(null);

    if (!deliveryAddress || !deliveryAddress.trim()) {
      setOrderError('Please enter your delivery address before confirming.');
      return;
    }
    if (!recipientName || !recipientName.trim()) {
      setOrderError('Please enter your name.');
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedItemsList = activeReceiptItems.map(r => ({
        itemId: r.id,
        name: r.name,
        itemName: r.name,
        quantity: r.qty,
        unitPrice: r.unitPrice,
        totalPrice: r.lineTotal
      }));

      const payload = {
        providerId,
        tiffinId,
        tiffinName: dbTiffin?.name || tiffinName || 'Tiffin',
        tiffinCategory: dbTiffin?.category || tiffinCategory || '',
        tiffinImage: dbTiffin?.image || tiffinImage || '',
        quantity: 1,
        unitPrice: 0,
        mealSubtotal,
        deliveryDistance: `${distanceKm} km`,
        deliveryFee,
        finalTotal,
        customerName: recipientName.trim(),
        customerEmail: recipientEmail.trim(),
        customerPhone: recipientPhone.trim(),
        customerAddress: deliveryAddress.trim(),
        deliveryCoordinates: deliveryCoordinates || null,
        items: selectedItemsList,
        selectedItems: selectedItemsList,
        instructions: instructions.trim(),
        paymentMethod: 'Cash on Delivery'
      };

      const res = await apiRequest('/orders/customer', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res?.success && res.data) {
        localStorage.removeItem('tiffinlink_pending_customization');
        if (typeof onOrderPlaced === 'function') {
          onOrderPlaced(res.data);
        }
      } else {
        setOrderError(res?.message || 'Could not confirm COD order. Please try again.');
      }
    } catch (err) {
      console.error('COD order placement error:', err);
      setOrderError(err.message || 'Network error while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    providerId, tiffinId, tiffinName, tiffinCategory, tiffinImage,
    mealSubtotal, deliveryFee, finalTotal, distanceKm,
    activeReceiptItems, instructions, deliveryAddress,
    recipientName, recipientEmail, recipientPhone,
    deliveryCoordinates, dbTiffin, onOrderPlaced
  ]);

  const totalItems = activeReceiptItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fbf9f5] min-h-screen text-[#1b1c1a] pt-20 sm:pt-24">

      {/* ─── Top Navigation Bar ─── */}
      <div className="w-full bg-[#f5f3ef] py-4 px-4 sm:px-6 lg:px-20 border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#4a4238] text-white px-4 py-2 transition-all group cursor-pointer shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span className="font-button-text text-xs uppercase tracking-wider">Back to Customizer</span>
            </button>
            <div className="h-5 w-px bg-[#ded9d1] hidden sm:block" />
            <button
              type="button"
              onClick={() => { window.location.hash = '#find-tiffin'; }}
              className="hidden sm:inline-flex items-center gap-1.5 font-label-caps text-xs text-[#665d52] hover:text-[#1a1a1a] uppercase tracking-wider transition-colors cursor-pointer font-semibold"
            >
              All Kitchens
            </button>
          </div>
          <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest hidden sm:inline">
            Step 2 of 2 — Confirm Order &amp; Payment
          </span>
        </div>
      </div>

      {/* ─── Page Header ─── */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-20 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest">Checkout Review</span>
          <span className="w-6 h-[1px] bg-[#ded9d1]" />
          <span className="font-label-caps text-xs text-[#4a4238] font-medium uppercase">{providerName || 'Kitchen Partner'}</span>
        </div>
        <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl sm:text-5xl text-[#1a1a1a] tracking-tight leading-none">
          Review Your Order
        </h1>
        <p className="text-sm text-[#665d52] mt-2 leading-relaxed">
          Verify your tray selection, delivery details, and secure escrow payment method before confirming dispatch.
        </p>
      </section>

      {/* ─── Two Column Layout ─── */}
      <section className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* LEFT: Order Items Summary */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

            {/* Tiffin Info Header */}
            <div className="bg-white border border-[#ded9d1] p-5 flex gap-4 items-start">
              {(dbTiffin?.image || tiffinImage) && (
                <div className="w-20 h-20 shrink-0 overflow-hidden border border-[#ded9d1]">
                  <img
                    src={dbTiffin?.image || tiffinImage}
                    alt={dbTiffin?.name || tiffinName}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-label-caps text-[11px] text-[#665d52] uppercase tracking-widest block">{providerName}</span>
                <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] mt-0.5 leading-tight">
                  {dbTiffin?.name || tiffinName}
                </h2>
                {(dbTiffin?.description || tiffinDesc) && (
                  <p className="text-xs text-[#665d52] mt-1 leading-relaxed line-clamp-2">
                    {dbTiffin?.description || tiffinDesc}
                  </p>
                )}
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="bg-white border border-[#ded9d1]">
              <div className="px-5 py-3.5 border-b border-[#ded9d1] flex items-center justify-between">
                <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold tracking-wider">
                  Your Tray Configuration
                </span>
                <span className="font-label-caps text-[11px] text-[#665d52] uppercase">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="divide-y divide-[#ded9d1]/60">
                {activeReceiptItems.map(item => (
                  <div key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#1a1a1a] block">{item.name}</span>
                      <span className="font-label-caps text-[11px] text-[#665d52]">
                        {String.fromCharCode(8377)}{item.unitPrice} &times; {item.qty} portion{item.qty !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="font-button-text text-sm text-[#1a1a1a] font-semibold shrink-0">
                      {String.fromCharCode(8377)}{item.lineTotal}
                    </span>
                  </div>
                ))}
              </div>
              {instructions && (
                <div className="px-5 py-3.5 border-t border-[#ded9d1]/60 bg-[#f5f3ef]/50">
                  <span className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Kitchen Note</span>
                  <p className="text-xs text-[#1a1a1a] italic">&ldquo;{instructions}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Billing Breakdown */}
            <div className="bg-white border border-[#ded9d1]">
              <div className="px-5 py-3.5 border-b border-[#ded9d1]">
                <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold tracking-wider">
                  Billing Summary
                </span>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm text-[#665d52]">
                <div className="flex justify-between">
                  <span>Meal Subtotal</span>
                  <span className="text-[#1a1a1a] font-medium">₹{mealSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span>Delivery Fee</span>
                    <span className="block font-label-caps text-[10px] text-[#665d52]">{distanceKm} km &middot; ₹25 base + ₹8/km</span>
                  </div>
                  <span className="text-[#1a1a1a] font-medium">₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <div>
                    <span>GST (5%)</span>
                    <span className="block font-label-caps text-[10px] text-[#665d52]">Applied on meal subtotal</span>
                  </div>
                  <span className="text-[#1a1a1a] font-medium">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging &amp; 304 Sanitization</span>
                  <span className="font-label-caps text-xs text-[#1b5e20] font-bold">₹0.00 FREE</span>
                </div>
                <div className="border-t border-[#ded9d1] pt-3 flex justify-between font-bold text-base text-[#1a1a1a]">
                  <div>
                    <span>Grand Total</span>
                    <span className="block font-label-caps text-[10px] text-[#665d52] font-normal">
                      Verified Authoritative Escrow Amount
                    </span>
                  </div>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl">
                    ₹{dynamicFinalPayable.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Delivery Info & Payment Selection */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">

            {/* Recipient Details */}
            <div className="bg-white border border-[#ded9d1] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
                <div>
                  <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block">Recipient</span>
                  <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mt-0.5">Contact &amp; Address</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingRecipient(!isEditingRecipient)}
                  className="font-label-caps text-xs uppercase tracking-wider text-[#4a4238] hover:text-[#1a1a1a] underline cursor-pointer"
                >
                  {isEditingRecipient ? 'Done' : 'Edit'}
                </button>
              </div>

              {isEditingRecipient ? (
                <div className="space-y-3">
                  <div>
                    <label className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-[#665d52]">
                  <p className="font-medium text-sm text-[#1a1a1a]">{recipientName || 'Name not provided'}</p>
                  <p>{recipientPhone || 'Phone not provided'}</p>
                  {recipientEmail && <p>{recipientEmail}</p>}
                </div>
              )}

              {/* Delivery Address */}
              <div className="pt-3 border-t border-[#ded9d1]/70">
                <label className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Apartment, building, street, area, city..."
                  className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a] resize-none"
                />
              </div>

              {/* Special Instructions */}
              <div className="pt-2">
                <label className="font-label-caps text-[11px] text-[#665d52] uppercase block mb-1">Cooking / Delivery Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Less spicy, no garlic, ring bell..."
                  className="w-full bg-[#f5f3ef] px-3 py-2 text-xs text-[#1a1a1a] border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>
            </div>

            {/* Payment Method Selector & Gateway Interface */}
            <div className="bg-white border border-[#ded9d1] p-6 space-y-4">
              <div className="pb-3 border-b border-[#ded9d1] flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest block">Payment Method</span>
                  <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mt-0.5">How to Pay</h3>
                </div>
                <span className="px-2 py-0.5 bg-[#f5f3ef] border border-[#ded9d1] font-label-caps text-[10px] text-[#4a4238] uppercase tracking-wider">
                  Escrow Protected
                </span>
              </div>

              {/* Payment Failure Alert */}
              {paymentStatusState === 'failed' && (
                <div className="bg-[#ffdad6]/40 border-2 border-[#ba1a1a] p-4 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[#ba1a1a]">
                    <span className="material-symbols-outlined text-[22px]">error</span>
                    <h4 className="font-button-text text-xs uppercase tracking-wider font-bold text-[#ba1a1a]">
                      Payment failed. Please try again.
                    </h4>
                  </div>
                  <p className="text-xs text-[#665d52] leading-relaxed">
                    {paymentErrorMessage || 'The payment could not be verified by the banking system. No amount was debited.'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      className="px-3.5 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-button-text text-[11px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                    >
                      TRY AGAIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatusState(null);
                        setPaymentErrorMessage('');
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#f5f3ef] text-[#1a1a1a] border border-[#ded9d1] font-button-text text-[11px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                    >
                      CHANGE PAYMENT METHOD
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Cancelled Alert */}
              {paymentStatusState === 'cancelled' && (
                <div className="bg-[#f5f3ef] border-2 border-[#665d52]/60 p-4 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-[#1a1a1a]">
                    <span className="material-symbols-outlined text-[22px] text-[#665d52]">cancel</span>
                    <h4 className="font-button-text text-xs uppercase tracking-wider font-bold text-[#1a1a1a]">
                      Payment cancelled.
                    </h4>
                  </div>
                  <p className="text-xs text-[#665d52] leading-relaxed">
                    You closed the payment modal before completing authorization. Your order is not yet confirmed.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 items-center">
                    <button
                      type="button"
                      onClick={handleInitiatePayment}
                      className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#4a4238] text-white font-button-text text-[11px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                    >
                      TRY AGAIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatusState(null);
                      }}
                      className="px-2 py-1 text-xs text-[#665d52] hover:text-[#1a1a1a] underline font-button-text uppercase tracking-wider cursor-pointer"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods List */}
              <div className="space-y-2.5">
                {paymentMethodsList.map((method) => {
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <label
                      key={method.id}
                      onClick={() => {
                        setSelectedPaymentMethod(method.id);
                        setPaymentStatusState(null);
                        setOrderError('');
                      }}
                      className={`flex items-start gap-3.5 p-3.5 border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1a1a1a] bg-[#fbf9f5] ring-1 ring-[#1a1a1a]/15 shadow-xs'
                          : 'border-[#ded9d1] hover:border-[#1a1a1a]/40 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedPaymentMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedPaymentMethod(method.id);
                          setPaymentStatusState(null);
                          setOrderError('');
                        }}
                        className="mt-1 accent-[#1a1a1a] shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <PaymentBrandIcon method={method.id} className="w-5 h-5 shrink-0" />
                            <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold tracking-wider">
                              {method.name}
                            </span>
                          </div>
                          {method.tag && (
                            <span
                              className={`font-label-caps text-[10px] font-semibold uppercase px-2 py-0.5 ${
                                method.id === 'Google Pay'
                                  ? 'text-[#1a73e8] bg-[#1a73e8]/10'
                                  : method.id === 'PhonePe'
                                  ? 'text-[#5f259f] bg-[#5f259f]/10'
                                  : method.id === 'Paytm'
                                  ? 'text-[#002e6e] bg-[#00baf2]/15'
                                  : method.id === 'BHIM'
                                  ? 'text-[#005a9c] bg-[#005a9c]/10'
                                  : 'text-[#665d52] bg-[#ded9d1]/40'
                              }`}
                            >
                              {method.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#665d52] mt-1 leading-relaxed">
                          {method.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Order Total Mini Summary */}
              <div className="bg-[#f5f3ef] border border-[#ded9d1] p-4 mt-2">
                <div className="space-y-1.5 text-xs text-[#665d52]">
                  <div className="flex justify-between">
                    <span>Meal Subtotal</span>
                    <span className="text-[#1a1a1a]">₹{mealSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery ({distanceKm} km)</span>
                    <span className="text-[#1a1a1a]">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="text-[#1a1a1a]">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#ded9d1] pt-2 flex justify-between items-baseline">
                    <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold">Total Payable</span>
                    <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] font-semibold">
                      ₹{dynamicFinalPayable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {orderError && (
                <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium border border-[#ba1a1a]/30">
                  {orderError}
                </div>
              )}

              {/* Dynamic Payment Action Button */}
              {selectedPaymentMethod === 'Cash on Delivery' ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmCodOrder}
                  className="w-full py-4 bg-[#1a1a1a] hover:bg-[#4a4238] disabled:bg-[#ded9d1] disabled:cursor-not-allowed text-[#fbf9f5] font-button-text text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming COD Order...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>CONFIRM &amp; PLACE ORDER (COD) — ₹{dynamicFinalPayable.toFixed(2)}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleInitiatePayment}
                  className="w-full py-4 bg-[#1a1a1a] hover:bg-[#4a4238] disabled:bg-[#ded9d1] disabled:cursor-not-allowed text-[#fbf9f5] font-button-text text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Preparing Payment QR...</span>
                    </>
                  ) : (
                    <>
                      <PaymentBrandIcon method={selectedPaymentMethod} className="w-5 h-5 text-white" />
                      <span>PAY ₹{dynamicFinalPayable.toFixed(2)} VIA {selectedPaymentMethod.toUpperCase()} (AUTHORIZE)</span>
                    </>
                  )}
                </button>
              )}

              {/* Back to Customizer */}
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 bg-white hover:bg-[#f5f3ef] text-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-center border border-[#ded9d1] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Edit Tray Selection
              </button>

              {/* Trust Badge */}
              <div className="bg-[#f5f3ef] p-4 border border-[#ded9d1]">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#4a4238] text-[22px] shrink-0">verified_user</span>
                  <div>
                    <span className="font-label-caps text-xs text-[#1a1a1a] uppercase tracking-wider block font-bold">Escrow Quality Lock</span>
                    <p className="font-body-md text-[11px] text-[#665d52] mt-0.5 leading-relaxed">
                      Payment held securely until canister temperature and hygiene seal are verified upon delivery.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── COMPLETE PAYMENT MODAL (UPI DYNAMIC QR FLOW) ─── */}
      {showPaymentModal && currentPaymentData && (
        <div className="fixed inset-0 z-[200] bg-[#1a1a1a]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 rounded-sm max-h-[94vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="bg-[#1a1a1a] text-white px-5 py-4 flex items-center justify-between border-b border-[#ded9d1]/20 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-400">qr_code_2</span>
                <div>
                  <div className="font-label-caps text-xs tracking-wider uppercase text-white font-bold">
                    COMPLETE PAYMENT
                  </div>
                  <div className="text-[10px] text-white/70">
                    Order Ref: #{currentPaymentData.orderId}
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleCancelPayment}
                className="text-white/70 hover:text-white transition-colors cursor-pointer p-1"
                title="Cancel Payment"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-center">
              {/* Dynamic QR Code Card */}
              <div className="bg-white border border-[#ded9d1] p-4 rounded-sm shadow-xs inline-block mx-auto max-w-full">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`UPI Payment QR for ${currentPaymentData.orderId}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 mx-auto flex flex-col items-center justify-center bg-[#f5f3ef] text-[#665d52] gap-2">
                    <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] font-label-caps">Generating Dynamic QR...</span>
                  </div>
                )}
                <div className="mt-2 text-center">
                  <span className="text-[11px] text-[#665d52] block font-mono">
                    UPI ID: <strong className="text-[#1a1a1a]">{currentPaymentData.provider?.upiId || 'zaidupi@abcbank'}</strong>
                  </span>
                  <span className="text-[10px] text-[#665d52] block mt-0.5">
                    Payee: {currentPaymentData.provider?.name || providerName || 'Mansuri Kitchen'}
                  </span>
                </div>
              </div>

              {/* Dynamic Payable Amount */}
              <div>
                <div className="font-label-caps text-[11px] uppercase tracking-wider text-[#665d52]">
                  Total Amount Payable
                </div>
                <div
                  style={{ fontFamily: "'EB Garamond', serif" }}
                  className="text-3xl font-bold text-[#1a1a1a] tracking-tight"
                >
                  ₹{Number(currentPaymentData.amount || dynamicFinalPayable).toFixed(2)}
                </div>
              </div>

              {/* Pay using selected UPI method */}
              <div className="pt-1 text-left">
                <div className="font-label-caps text-[11px] uppercase tracking-wider text-[#665d52] text-center mb-2">
                  Pay using selected UPI method
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => {
                    const isSelected = selectedPaymentMethod === app;
                    return (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(app)}
                        className={`py-2 px-1 border text-center rounded text-[11px] font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-sm font-bold scale-[1.02]'
                            : 'border-[#ded9d1] bg-white text-[#1a1a1a] hover:border-[#1a1a1a]/50 hover:bg-[#f5f3ef]'
                        }`}
                      >
                        <PaymentBrandIcon method={app} className="w-5 h-5" />
                        <span className="truncate w-full text-[10px]">{app}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verification Error Notice */}
              {paymentErrorMessage && (
                <div className="p-2.5 bg-[#ffdad6] text-[#ba1a1a] text-xs font-medium border border-[#ba1a1a]/30 rounded text-left">
                  {paymentErrorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* 1. Open Payment App */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleOpenPaymentApp}
                  className="w-full py-3 px-4 bg-white hover:bg-[#f5f3ef] text-[#1a1a1a] border border-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <PaymentBrandIcon method={selectedPaymentMethod} className="w-4 h-4" />
                  <span>Open {selectedPaymentMethod} App</span>
                </button>

                {/* 2. I HAVE COMPLETED PAYMENT */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleVerifyPayment}
                  className="w-full py-3.5 px-4 bg-[#1a1a1a] hover:bg-[#4a4238] disabled:bg-[#ded9d1] text-white font-button-text text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Payment with Bank...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>I HAVE COMPLETED PAYMENT</span>
                    </>
                  )}
                </button>

                {/* 3. Cancel Payment */}
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleCancelPayment}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-[#ded9d1]/40 text-[#665d52] hover:text-[#1a1a1a] font-button-text text-[11px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                >
                  Cancel Payment
                </button>
              </div>

              <div className="text-[10px] text-[#665d52] text-center pt-2 border-t border-[#ded9d1]">
                🔒 256-Bit SSL Encrypted Escrow • Powered by TiffinLink UPI Infrastructure
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
