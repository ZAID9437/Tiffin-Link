import React, { useState, useEffect, useCallback } from 'react';
import GoogleDeliveryMap from '../components/GoogleDeliveryMap';
import { sendDriverLocationUpdate, subscribeToDeliveryLifecycle } from '../services/socket';

const formatOrderRef = (ref) => {
  if (!ref) return '';
  const clean = String(ref).trim().replace(/^#+/, '');
  return `#${clean}`;
};

export default function ActiveDeliveryView({
  activeDelivery: initialActiveDelivery = null,
  currentUser = null,
  onNavigateTab = null,
  onStatusUpdate = null
}) {
  const [activeDelivery, setActiveDelivery] = useState(initialActiveDelivery);
  const [loading, setLoading] = useState(!initialActiveDelivery);
  const [toastMessage, setToastMessage] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Recalibrate Location State (Section 8 & 9 & 14)
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [recalibrateToast, setRecalibrateToast] = useState('');
  const [currentGpsAccuracy, setCurrentGpsAccuracy] = useState(null);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpType, setOtpType] = useState('pickup'); // 'pickup' | 'delivery'
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown countdown timer for OTP resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Report Delay Modal State
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('Promenade Traffic Congestion');

  // SOS Emergency Modal State
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch real active delivery from MongoDB for authenticated driver
  const fetchActiveDelivery = async () => {
    try {
      setLoading(true);
      const email = currentUser?.email || localStorage.getItem('user_email') || '';
      const driverId = currentUser?.id || currentUser?._id || localStorage.getItem('driver_id') || '';
      const phone = currentUser?.phone || '';

      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `http://localhost:5000/api/delivery/active-delivery?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}`,
        { headers }
      );
      const json = await res.json();

      if (json.success && json.activeDelivery) {
        setActiveDelivery(json.activeDelivery);
      } else {
        setActiveDelivery(null);
      }
    } catch (err) {
      console.error('Error fetching active delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDelivery();
  }, [currentUser]);

  // Sync with prop updates
  useEffect(() => {
    if (initialActiveDelivery) {
      setActiveDelivery(initialActiveDelivery);
      setLoading(false);
    }
  }, [initialActiveDelivery]);

  // Real-Time Socket.IO Subscriptions for Status & Location Sync
  useEffect(() => {
    const unsubscribe = subscribeToDeliveryLifecycle({
      onStatusUpdate: () => fetchActiveDelivery(),
      onPickup: () => fetchActiveDelivery(),
      onCompleted: () => {
        fetchActiveDelivery();
        showToast('🎉 Delivery Completed! Great job on your handover.');
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Watch Driver GPS position & transmit to Socket.IO room
  useEffect(() => {
    if (!activeDelivery) return;

    const deliveryId = activeDelivery.requestId || activeDelivery.orderId || activeDelivery._id;

    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        sendDriverLocationUpdate({
          deliveryId,
          lat: latitude,
          lng: longitude,
          accuracy
        });
      },
      (err) => {
        console.warn('GPS location watch warning:', err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeDelivery]);

  // Intelligent Driver Location Recalibration Handler (Section 8 & 9 & 14)
  const handleRecalibrate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      showToast('Unable to determine your current location.');
      setRecalibrateToast('Unable to determine your current location.');
      setTimeout(() => setRecalibrateToast(''), 4500);
      return;
    }

    setIsRecalibrating(true);
    setRecalibrateToast('Recalibrating location...');
    showToast('Recalibrating location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const rawLat = pos.coords?.latitude;
        const rawLng = pos.coords?.longitude;
        const accuracy = pos.coords?.accuracy || 0;
        const speed = pos.coords?.speed || 0;
        const heading = pos.coords?.heading || 0;

        // 1. Strict coordinate validation (Section 9)
        if (
          typeof rawLat !== 'number' ||
          typeof rawLng !== 'number' ||
          isNaN(rawLat) ||
          isNaN(rawLng) ||
          rawLat < -90 ||
          rawLat > 90 ||
          rawLng < -180 ||
          rawLng > 180
        ) {
          setIsRecalibrating(false);
          showToast('Unable to determine your current location.');
          setRecalibrateToast('Unable to determine your current location.');
          setTimeout(() => setRecalibrateToast(''), 4500);
          return;
        }

        const lat = Number(rawLat.toFixed(5));
        const lng = Number(rawLng.toFixed(5));
        setCurrentGpsAccuracy(accuracy);

        // 2. Update local state for Map & UI
        const freshLocation = {
          lat,
          lng,
          accuracy: Number(accuracy || 0),
          speed: Number(speed || 0),
          heading: Number(heading || 0),
          updatedAt: new Date()
        };

        setActiveDelivery((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            assignedDriver: {
              ...(prev.assignedDriver || {}),
              location: freshLocation
            },
            driverLocation: freshLocation
          };
        });

        const deliveryId = activeDelivery?.requestId || activeDelivery?.orderId || activeDelivery?._id;

        // 3. Socket.IO Broadcast (Section 8)
        if (deliveryId) {
          sendDriverLocationUpdate({
            deliveryId,
            lat,
            lng,
            accuracy,
            heading,
            speed
          });
        }

        // 4. Update MongoDB latest location via REST API (Section 8)
        try {
          const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch('http://localhost:5000/api/delivery/location', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              requestId: deliveryId,
              lat,
              lng,
              accuracy,
              heading,
              speed
            })
          });
        } catch (apiErr) {
          console.warn('Backend location sync warning:', apiErr);
        }

        setIsRecalibrating(false);

        // 5. Accuracy message (Section 8 & 9)
        if (accuracy > 50) {
          const warnMsg = `Location updated successfully. (Warning: Low GPS accuracy ±${Math.round(accuracy)}m)`;
          showToast(warnMsg);
          setRecalibrateToast(warnMsg);
        } else {
          showToast('Location updated successfully.');
          setRecalibrateToast('Location updated successfully.');
        }
        setTimeout(() => setRecalibrateToast(''), 4500);
      },
      (err) => {
        console.warn('Geolocation recalibrate failed:', err);
        setIsRecalibrating(false);
        showToast('Unable to determine your current location.');
        setRecalibrateToast('Unable to determine your current location.');
        setTimeout(() => setRecalibrateToast(''), 4500);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [activeDelivery]);

  // Launch Turn-by-Turn GPS Navigation in Google Maps
  const handleOpenGoogleMapsNavigation = (destinationAddress) => {
    const encoded = encodeURIComponent(destinationAddress || 'Mumbai');
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(mapsUrl, '_blank');
  };

  // Generic Status Update Handler
  const handleUpdateStatus = async (nextStatus) => {
    if (!activeDelivery) return;
    const reqId = activeDelivery.requestId || activeDelivery._id || activeDelivery.orderId;

    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/delivery/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestId: reqId,
          orderId: activeDelivery.orderId || reqId,
          status: nextStatus,
          driverId: currentUser?.id || currentUser?._id || 'TL-8041'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(`⚠️ ${json.message || 'Unable to update status.'}`);
        return;
      }

      setActiveDelivery(prev => prev ? { ...prev, status: nextStatus } : prev);
      showToast(`✓ Delivery status updated to: ${nextStatus}`);
      if (onStatusUpdate) onStatusUpdate();
      await fetchActiveDelivery();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast(`⚠️ ${err.message || 'Server error updating status.'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Dispatch REAL OTP (Kitchen Pickup Email OTP or Customer Handover SMS OTP)
  const handleSendOtp = async () => {
    if (!activeDelivery || resendCooldown > 0) return;
    const rawReqId = activeDelivery.requestId || activeDelivery._id || activeDelivery.orderId;
    const cleanReqId = String(rawReqId || '').replace(/^#+/, '');

    try {
      setSendingOtp(true);
      setOtpSentNotice('');
      setOtpError('');

      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = otpType === 'delivery'
        ? 'http://localhost:5000/api/delivery/customer-handover-otp/send'
        : 'http://localhost:5000/api/delivery/send-otp-sms';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestId: cleanReqId,
          deliveryId: cleanReqId,
          orderId: activeDelivery.orderId,
          type: otpType,
          driverId: currentUser?.id || currentUser?._id
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setResendCooldown(30);
        const notice = json.message || `Verification code sent to customer's registered email (${json.maskedEmail || 'customer email'})`;
        setOtpSentNotice(notice);
        showToast(notice);
      } else {
        if (res.status === 401) {
          setOtpError('Your session has expired. Please sign in again.');
        } else if (res.status === 403) {
          setOtpError(json.message || 'You are not authorized to verify this delivery.');
        } else if (res.status === 404) {
          setOtpError(json.message || 'Delivery request not found.');
        } else if (res.status === 500) {
          setOtpError('Unable to process request. Please try again.');
        } else {
          setOtpError(json.message || 'Unable to send verification code. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setOtpError('Unable to send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // OTP Verification Submission
  const handleVerifyOtp = async () => {
    const cleanOtp = (otpInput || '').trim();
    if (!cleanOtp || cleanOtp.length < 4 || cleanOtp.length > 6 || !/^\d+$/.test(cleanOtp)) {
      setOtpError('Please enter a valid numeric verification code');
      return;
    }

    if (!activeDelivery) return;
    const rawReqId = activeDelivery.requestId || activeDelivery._id || activeDelivery.orderId;
    const cleanReqId = String(rawReqId || '').replace(/^#+/, '');

    try {
      setIsUpdatingStatus(true);
      setOtpError('');

      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = otpType === 'delivery'
        ? 'http://localhost:5000/api/delivery/customer-handover-otp/verify'
        : 'http://localhost:5000/api/delivery/verify-otp';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          requestId: cleanReqId,
          deliveryId: cleanReqId,
          orderId: activeDelivery.orderId,
          otp: cleanOtp,
          code: cleanOtp,
          type: otpType,
          driverId: currentUser?.id || currentUser?._id
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (res.status === 401) {
          setOtpError('Your session has expired. Please sign in again.');
        } else if (res.status === 403) {
          setOtpError(json.message || 'You are not authorized to verify this delivery.');
        } else if (res.status === 404) {
          setOtpError(json.message || 'Delivery request not found.');
        } else if (res.status === 500) {
          setOtpError('Unable to process pickup verification. Please try again.');
        } else {
          setOtpError(json.message || 'Invalid verification code. Please try again.');
        }
        return;
      }

      const nextStatus = otpType === 'pickup' ? 'Picked Up' : 'Delivered';

      // Optimistically update local activeDelivery state immediately so UI transitions instantly
      setActiveDelivery(prev => prev ? { ...prev, status: nextStatus } : prev);

      setOtpModalOpen(false);
      setOtpInput('');
      setOtpSentNotice('');
      showToast(otpType === 'pickup' ? '✓ Kitchen pickup verified successfully!' : '🎉 Customer handover verified! Delivery completed.');
      
      if (onStatusUpdate) onStatusUpdate();
      await fetchActiveDelivery();
    } catch (err) {
      console.error('OTP error:', err);
      setOtpError('Server connection error verifying code.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Calculate current stepper active stage
  const getStepperStage = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('DELIVERED') || s.includes('COMPLETED')) return 5;
    if (s.includes('ARRIVED_CUSTOMER') || s.includes('ARRIVED AT CUSTOMER') || s.includes('AT CUSTOMER')) return 4;
    if (s.includes('OUT_FOR_DELIVERY') || s.includes('PICKED_UP') || s.includes('IN TRANSIT') || s === 'PICKED UP' || s === 'OUT FOR DELIVERY') return 3;
    if (s.includes('ARRIVED_PROVIDER') || s.includes('AT KITCHEN') || s.includes('KITCHEN') || s.includes('ARRIVED_AT_PICKUP')) return 2;
    return 1;
  };

  const currentStage = getStepperStage(activeDelivery?.status);

  // Derive display names & properties dynamically from MongoDB active delivery
  const orderRef = activeDelivery ? formatOrderRef(activeDelivery.orderId || activeDelivery.requestId || activeDelivery._id) : '#ORD';
  const providerName = activeDelivery?.providerName || 'Kitchen Provider';
  const providerCity = activeDelivery?.pickupAddress?.city || activeDelivery?.city || '';

  const customerName = activeDelivery?.customerName || 'Customer';
  const customerEmail = activeDelivery?.customerEmail || '';
  const customerPhone = activeDelivery?.customerPhone || '';
  const customerAddress = typeof activeDelivery?.deliveryAddress === 'string'
    ? activeDelivery.deliveryAddress
    : (activeDelivery?.deliveryAddress?.street || activeDelivery?.customerAddress || '');
  
  const tripFare = activeDelivery?.driverEarning || activeDelivery?.payout || 0;
  const tiffinItemName = activeDelivery?.tiffinName || 'Tiffin Box Meal';
  const etaMinutes = activeDelivery?.etaMinutes || 10;
  const distanceKm = activeDelivery?.distanceKm || 0;

  if (loading) {
    return (
      <div className="py-20 text-center bg-surface-container-lowest border border-sand-neutral space-y-3 shadow-xs">
        <span className="material-symbols-outlined text-onyx-black text-[36px] animate-spin">refresh</span>
        <p className="font-label-caps text-xs text-secondary uppercase tracking-widest">Loading authentic active delivery data...</p>
      </div>
    );
  }

  if (!activeDelivery) {
    return (
      <div className="py-20 px-6 bg-surface-container-lowest border border-sand-neutral text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
        <span className="material-symbols-outlined text-secondary text-[56px]">local_shipping</span>
        <h3 className="font-headline-md text-2xl text-onyx-black font-serif">No Active Delivery</h3>
        <p className="font-body-md text-sm text-on-surface-variant max-w-md">
          You currently have no active trip assigned. Check available delivery requests or stand by for new automatic dispatches.
        </p>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('delivery-requests')}
          className="px-6 py-3 bg-onyx-black text-on-primary font-button-text text-xs uppercase tracking-wider mt-2 cursor-pointer hover:bg-stone-800 transition-colors font-bold"
        >
          View Delivery Requests
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full antialiased text-on-surface bg-surface selection:bg-onyx-black selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-semibold px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Minimalist Architectural Top Navigation Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between pb-8 gap-4 border-b border-sand-neutral mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-[11px] tracking-widest text-secondary uppercase font-semibold">
              Live Dispatch Route
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-onyx-black font-label-caps text-[10px] tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {activeDelivery.status || 'EN ROUTE'}
            </span>
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-onyx-black tracking-tight font-serif">
            Active Delivery
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant font-light">
            Order <strong className="text-onyx-black font-semibold">{orderRef}</strong> <span className="text-sand-neutral px-1.5">•</span> Kitchen: <span className="text-onyx-black font-medium">{providerName}</span> ({providerCity})
          </p>
        </div>

        {/* Quick Vital Metrics & Live Recalibrate Action */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
          {/* Section 8 & 14: RECALIBRATE button */}
          <button
            type="button"
            onClick={handleRecalibrate}
            disabled={isRecalibrating}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#333333] active:scale-95 text-white font-label-caps text-[11px] uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-60 shrink-0 font-bold border border-black"
            title="Recalibrate GPS Location & Synchronize Delivery Route"
          >
            <span className={`material-symbols-outlined text-[15px] text-[#38bdf8] ${isRecalibrating ? 'animate-spin' : ''}`}>
              {isRecalibrating ? 'sync' : 'my_location'}
            </span>
            <span className="text-white tracking-wider">{isRecalibrating ? 'CALIBRATING...' : 'RECALIBRATE'}</span>
          </button>

          <div className="flex items-center gap-6 bg-surface-container-low px-5 py-3 border border-sand-neutral shadow-xs">
            <div className="flex flex-col">
              <span className="font-label-caps text-[10px] uppercase text-secondary tracking-wider">Trip Fare</span>
              <span className="font-headline-md text-2xl text-onyx-black leading-none mt-1 font-serif font-bold">
                ₹{tripFare}
              </span>
            </div>
            <div className="w-px h-8 bg-sand-neutral" />
            <div className="flex flex-col">
              <span className="font-label-caps text-[10px] uppercase text-secondary tracking-wider">Target Handover</span>
              <span className="font-button-text text-xs text-onyx-black mt-1 font-bold">
                {new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Editorial Architectural Progress Stepper */}
      <section className="w-full bg-surface-container-lowest p-6 border border-sand-neutral mb-8 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          
          {/* Step 1: Accepted */}
          <div className={`flex flex-col gap-2 p-3 rounded-md transition-all ${
            currentStage >= 1 ? 'bg-surface-container-low' : 'bg-surface-container-lowest opacity-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] text-secondary uppercase font-semibold">01 // Confirmation</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">check_circle</span>
            </div>
            <div className="font-button-text text-xs text-onyx-black font-bold">Accepted</div>
            <span className="font-label-caps text-[10px] text-on-surface-variant">Dispatch verified</span>
          </div>

          {/* Step 2: At Kitchen */}
          <div className={`flex flex-col gap-2 p-3 rounded-md transition-all ${
            currentStage === 2 
              ? 'bg-onyx-black text-on-primary shadow-md' 
              : currentStage > 2 
                ? 'bg-surface-container-low' 
                : 'bg-surface-container-lowest opacity-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-label-caps text-[10px] uppercase font-semibold ${currentStage === 2 ? 'text-sand-neutral' : 'text-secondary'}`}>
                02 // Kitchen
              </span>
              <span className={`material-symbols-outlined text-[18px] ${currentStage === 2 ? 'text-on-primary animate-pulse' : 'text-onyx-black'}`}>
                inventory_2
              </span>
            </div>
            <div className={`font-button-text text-xs font-bold ${currentStage === 2 ? 'text-on-primary' : 'text-onyx-black'}`}>
              At Kitchen
            </div>
            <span className={`font-label-caps text-[10px] ${currentStage === 2 ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
              Insulated seal applied
            </span>
          </div>

          {/* Step 3: Order Picked Up / In Transit */}
          <div className={`flex flex-col gap-2 p-3 rounded-md transition-all ${
            currentStage === 3 
              ? 'bg-onyx-black text-on-primary shadow-md' 
              : currentStage > 3 
                ? 'bg-surface-container-low' 
                : 'bg-surface-container-lowest opacity-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-label-caps text-[10px] uppercase font-semibold ${currentStage === 3 ? 'text-sand-neutral' : 'text-secondary'}`}>
                03 // In Transit
              </span>
              <span className={`material-symbols-outlined text-[20px] ${currentStage === 3 ? 'text-on-primary animate-pulse' : 'text-onyx-black'}`}>
                local_shipping
              </span>
            </div>
            <div className={`font-button-text text-xs font-bold ${currentStage === 3 ? 'text-on-primary' : 'text-onyx-black'}`}>
              Order Picked Up
            </div>
            <span className={`font-label-caps text-[10px] ${currentStage === 3 ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
              Active Step • Heading to destination
            </span>
          </div>

          {/* Step 4: Delivered */}
          <div className={`flex flex-col gap-2 p-3 rounded-md transition-all ${
            currentStage === 4 
              ? 'bg-emerald-950 text-emerald-100 shadow-md' 
              : 'bg-surface-container-lowest opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] text-secondary uppercase font-semibold">04 // Delivery</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">home</span>
            </div>
            <div className="font-button-text text-xs text-secondary font-bold">Delivered to Customer</div>
            <span className="font-label-caps text-[10px] text-secondary">Tiffin container exchange</span>
          </div>

        </div>
      </section>

      {/* 3. Two Column Layout: Left Details (40%) & Right Live Map (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL (5 cols on 12-col grid = ~41.6%) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Customer Dossier Card */}
          <div className="bg-surface-container-lowest p-7 border border-sand-neutral flex flex-col gap-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-sand-neutral shrink-0">
                  <span className="material-symbols-outlined text-onyx-black text-[28px]">person</span>
                </div>
                <div>
                  <span className="font-label-caps text-[10px] uppercase text-secondary block font-semibold">Client Handover</span>
                  <h2 className="font-headline-md text-xl text-onyx-black tracking-tight font-serif font-bold">{customerName}</h2>
                  <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase font-semibold">
                    Premium Tiffin Subscriber
                  </span>
                </div>
              </div>

              {/* Immediate Comms Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${customerPhone}`}
                  className="w-10 h-10 bg-surface-container-low hover:bg-onyx-black hover:text-on-primary text-onyx-black flex items-center justify-center transition-colors border border-sand-neutral"
                  title="Call Customer"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
                <button
                  type="button"
                  onClick={() => showToast(`📱 SMS prompt initiated for ${customerPhone}`)}
                  className="w-10 h-10 bg-surface-container-low hover:bg-onyx-black hover:text-on-primary text-onyx-black flex items-center justify-center transition-colors border border-sand-neutral cursor-pointer"
                  title="Send SMS"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </button>
              </div>
            </div>

            {/* Destination Details */}
            <div className="bg-surface-container-low p-4 flex gap-3.5 items-start border border-sand-neutral">
              <span className="material-symbols-outlined text-onyx-black text-[22px] mt-0.5">location_on</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] uppercase text-secondary font-semibold">Drop-off Address</span>
                <p className="font-body-md text-xs text-onyx-black font-medium leading-relaxed mt-0.5">
                  {customerAddress}
                </p>
                <span className="font-label-caps text-[10px] text-on-surface-variant mt-1">
                  Contact: {customerPhone}
                </span>
              </div>
            </div>

            {/* Delivery Notes & Container Exchange Callout */}
            <div className="bg-secondary-fixed/50 p-4 border border-sand-neutral flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-onyx-black">swap_calls</span>
                <span className="font-label-caps text-[10px] uppercase text-onyx-black font-bold tracking-wider">
                  Tiffin Return Instruction
                </span>
              </div>
              <p className="font-body-md text-xs text-onyx-black leading-relaxed italic">
                “Please ring the bell and hand over the tiffin container. Returning previous stainless steel container set.”
              </p>
            </div>

            {/* Manifest & Items Breakdown */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] uppercase text-secondary font-semibold">Packaged Tiffin Contents</span>
                <span className="font-label-caps text-[10px] text-secondary uppercase font-semibold">
                  {activeDelivery.itemCount || 1} Tiffin Box
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-surface-container-low border border-sand-neutral">
                  <div className="flex items-center gap-2.5">
                    <span className="font-label-caps text-[10px] bg-onyx-black text-on-primary px-1.5 py-0.5">1x</span>
                    <span className="font-button-text text-xs text-onyx-black font-semibold">{tiffinItemName}</span>
                  </div>
                  <span className="font-label-caps text-[10px] text-secondary uppercase">Tiered Stainless Steel Cask</span>
                </div>
              </div>
            </div>

            {/* Financial Status */}
            <div className="flex items-center justify-between p-3.5 bg-surface-container-low border border-sand-neutral">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-700 text-[20px]">verified</span>
                <div>
                  <span className="font-button-text text-xs text-onyx-black block font-bold">Prepaid Order</span>
                  <span className="font-label-caps text-[10px] text-secondary uppercase">Paid Online via UPI</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-label-caps text-[9px] uppercase text-secondary block">Collect From Client</span>
                <span className="font-button-text text-xs text-emerald-800 font-bold">₹0.00</span>
              </div>
            </div>

            {/* Primary & Secondary Interactive Action CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              
              {/* STATUS-AWARE PRIMARY CTA */}
              {currentStage === 1 && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus('ARRIVED_PROVIDER')}
                  className="w-full bg-onyx-black hover:bg-clay-earth text-on-primary py-4 px-6 font-button-text text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                  <span>{isUpdatingStatus ? 'Updating...' : 'Confirm Arrival at Kitchen Location'}</span>
                </button>
              )}

              {currentStage === 2 && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    setOtpType('pickup');
                    setOtpModalOpen(true);
                  }}
                  className="w-full bg-onyx-black hover:bg-clay-earth text-on-primary py-4 px-6 font-button-text text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                  <span>{isUpdatingStatus ? 'Updating...' : 'Verify Kitchen Pickup OTP'}</span>
                </button>
              )}

              {currentStage === 3 && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateStatus('ARRIVED_CUSTOMER')}
                  className="w-full bg-onyx-black hover:bg-clay-earth text-on-primary py-4 px-6 font-button-text text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                  <span>{isUpdatingStatus ? 'Updating...' : 'Confirm Arrival at Customer Location'}</span>
                </button>
              )}

              {currentStage >= 4 && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => {
                    setOtpType('delivery');
                    setOtpModalOpen(true);
                  }}
                  className="w-full bg-emerald-900 hover:bg-emerald-950 text-on-primary py-4 px-6 font-button-text text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  <span>{isUpdatingStatus ? 'Updating...' : 'Verify Customer Handover OTP'}</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDelayModalOpen(true)}
                  className="bg-surface-container-low hover:bg-surface-container-high text-onyx-black py-3 px-4 font-button-text text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-sand-neutral cursor-pointer font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span>Report Delay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSosModalOpen(true)}
                  className="bg-error-container hover:bg-red-200 text-on-error-container py-3 px-4 font-button-text text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">emergency</span>
                  <span>SOS Emergency</span>
                </button>
              </div>
            </div>

          </div>

          {/* Driver Partner Assurance Banner */}
          <div className="p-4 bg-bone-white border border-sand-neutral text-secondary flex items-center gap-3 shadow-xs">
            <span className="material-symbols-outlined text-[20px] text-clay-earth">shield</span>
            <p className="font-body-md text-xs leading-snug">
              Trip covered under active partner insurance. Automatic location tracking is synchronized with TiffinLink Central Dispatch.
            </p>
          </div>

        </div>

        {/* RIGHT PANEL: HIGH CONTRAST ARCHITECTURAL ROUTE SIMULATION (7 cols = ~58.3%) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Google Maps / Architectural Vector Canvas */}
          <div className="relative w-full h-[640px] bg-bone-white border border-sand-neutral overflow-hidden shadow-md flex flex-col justify-between">
            
            {/* Real Google Maps Component Integration */}
            <GoogleDeliveryMap
              delivery={activeDelivery}
              height="100%"
              activeRole="driver"
              hideOuterCard={true}
            />

            {/* Top Floating Overlay: Navigation Instructions HUD */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pointer-events-auto">
              
              {/* Turn-By-Turn HUD Card */}
              <div className="bg-onyx-black text-on-primary p-4 shadow-xl flex items-center gap-4 max-w-md border border-onyx-black">
                <div className="w-10 h-10 bg-surface-container-low/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-primary text-[24px]">turn_right</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-caps text-[10px] text-sand-neutral uppercase tracking-wider font-semibold">
                    Next Maneuver in 350m
                  </span>
                  <p className="font-button-text text-xs font-semibold text-on-primary truncate">
                    Turn right onto Carter Road
                  </p>
                  <span className="font-label-caps text-[10px] text-sand-neutral">
                    Then continue straight for {distanceKm} km along promenade
                  </span>
                </div>
              </div>

              {/* Dynamic ETA & Distance Metric Pill */}
              <div className="bg-surface-container-lowest/95 backdrop-blur px-5 py-3 border border-sand-neutral shadow-md flex items-center gap-4 self-start md:self-auto">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-onyx-black text-[22px]">timer</span>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest font-semibold">Est. Travel</span>
                    <span className="font-headline-md text-xl text-onyx-black leading-none font-serif font-bold">
                      {etaMinutes} MINS
                    </span>
                  </div>
                </div>
                <div className="w-px h-7 bg-sand-neutral" />
                <div className="flex flex-col">
                  <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest font-semibold">Remaining</span>
                  <span className="font-button-text text-xs text-onyx-black font-bold leading-none mt-1">
                    {distanceKm} KM
                  </span>
                </div>
              </div>

            </div>

            {/* Live Recalibrate Status Banner / Notification (Section 8) */}
            {recalibrateToast && (
              <div className="absolute top-24 left-4 right-4 z-20 flex justify-center pointer-events-none">
                <div className={`flex items-center gap-2 py-2 px-4 shadow-xl border font-mono text-xs font-semibold rounded-xs pointer-events-auto transition-all ${
                  recalibrateToast.includes('Unable')
                    ? 'bg-[#ffebee] border-[#ffcdd2] text-[#c62828]'
                    : recalibrateToast.includes('Recalibrating')
                      ? 'bg-[#e0f2fe] border-[#bae6fd] text-[#0369a1]'
                      : recalibrateToast.includes('Low') || recalibrateToast.includes('Warning')
                        ? 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]'
                        : 'bg-[#e8f5e9] border-[#c8e6c9] text-[#1b5e20]'
                }`}>
                  <span className={`material-symbols-outlined text-[16px] ${recalibrateToast.includes('Recalibrating') ? 'animate-spin' : ''}`}>
                    {recalibrateToast.includes('Unable')
                      ? 'error'
                      : recalibrateToast.includes('Recalibrating')
                        ? 'sync'
                        : recalibrateToast.includes('Low') || recalibrateToast.includes('Warning')
                          ? 'warning'
                          : 'check_circle'}
                  </span>
                  <span>{recalibrateToast}</span>
                </div>
              </div>
            )}

            {/* Bottom Floating Controls & Speed Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between pointer-events-auto">
              
              {/* Speedometer & Transit Mode Badge */}
              <div className="bg-surface-container-lowest/90 backdrop-blur p-3.5 border border-sand-neutral shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 bg-surface-container-high flex items-center justify-center font-button-text text-onyx-black font-bold text-xs">
                  34
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[9px] text-secondary uppercase font-semibold">Current Speed</span>
                  <span className="font-label-caps text-[10px] text-onyx-black font-bold">KM/H • Motorcycle</span>
                </div>
              </div>

              {/* Map Utility Controls: RECALIBRATE & Navigation (Section 8 & 14) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecalibrate}
                  disabled={isRecalibrating}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#333333] active:scale-95 text-white font-label-caps text-[11px] uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-60 shrink-0 font-bold border border-black"
                  title="Calibrate GPS Location & Synchronize Delivery Route"
                >
                  <span className={`material-symbols-outlined text-[15px] text-[#38bdf8] ${isRecalibrating ? 'animate-spin' : ''}`}>
                    {isRecalibrating ? 'sync' : 'my_location'}
                  </span>
                  <span className="text-white tracking-wider">{isRecalibrating ? 'CALIBRATING...' : 'RECALIBRATE'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenGoogleMapsNavigation(customerAddress)}
                  className="h-9 px-3 bg-surface-container-lowest hover:bg-onyx-black hover:text-on-primary text-onyx-black shadow-md flex items-center gap-1.5 transition-all border border-sand-neutral cursor-pointer font-button-text text-xs uppercase font-bold"
                  title="Open Google Navigation"
                >
                  <span className="material-symbols-outlined text-[18px]">near_me</span>
                  <span className="hidden sm:inline">Navigate</span>
                </button>
              </div>

            </div>

          </div>

          {/* Quick Route Traffic & Quality Assessment Footnote */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface-container-lowest p-3.5 border border-sand-neutral shadow-xs flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-emerald-700">traffic</span>
              <div>
                <span className="font-label-caps text-[9px] uppercase text-secondary block font-semibold">Traffic Flow</span>
                <span className="font-button-text text-xs text-onyx-black font-semibold">Moderate • Smooth</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3.5 border border-sand-neutral shadow-xs flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-onyx-black">wb_sunny</span>
              <div>
                <span className="font-label-caps text-[9px] uppercase text-secondary block font-semibold">Weather Alert</span>
                <span className="font-button-text text-xs text-onyx-black font-semibold">Clear • 29°C Dry</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-3.5 border border-sand-neutral shadow-xs flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-onyx-black">local_parking</span>
              <div>
                <span className="font-label-caps text-[9px] uppercase text-secondary block font-semibold">Building Access</span>
                <span className="font-button-text text-xs text-onyx-black font-semibold">Bike Bay at Gate 2</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* OTP VERIFICATION MODAL (KITCHEN PICKUP OR CUSTOMER HANDOVER) */}
      {otpModalOpen && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-onyx-black p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-lg text-onyx-black font-serif font-bold">
                  {otpType === 'delivery' ? 'Verify Customer Handover OTP' : 'Verify Kitchen Pickup OTP'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase ${
                  otpType === 'delivery' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {otpType === 'delivery' ? 'Customer Handover' : 'Kitchen Provider'}
                </span>
              </div>
              <p className="font-body-md text-xs text-secondary mt-1">
                {otpType === 'delivery'
                  ? 'Ask the customer for the verification code sent to their registered email address.'
                  : 'Ask the kitchen provider for the verification code sent to their registered email address.'}
              </p>
            </div>

            {/* Contact & Dispatch Info Box */}
            <div className="p-3 bg-surface-container-low border border-sand-neutral space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-onyx-black">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">mail</span>
                  <span>{otpType === 'delivery' ? 'Customer Registered Email' : 'Kitchen Provider Contact'}</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold uppercase">
                  EMAIL OTP
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-mono">
                {otpType === 'delivery' ? (
                  <>
                    👤 Customer: <span className="font-semibold text-onyx-black">{customerName}</span><br/>
                    ✉️ Email (Masked): <span className="font-semibold text-onyx-black">
                      {activeDelivery?.customerEmail
                        ? activeDelivery.customerEmail.replace(/^(.{1}).*?(@.*)$/, '$1******$2')
                        : (activeDelivery?.email ? activeDelivery.email.replace(/^(.{1}).*?(@.*)$/, '$1******$2') : 'c******@gmail.com')}
                    </span>
                  </>
                ) : (
                  <>
                    🏢 Kitchen: <span className="font-semibold text-onyx-black">{providerName}</span><br/>
                    ✉️ Email (Masked): <span className="font-semibold text-onyx-black">
                      {activeDelivery?.providerEmail ? activeDelivery.providerEmail.replace(/^(.{1}).*?(@.*)$/, '$1******$2') : 'p******@gmail.com'}
                    </span>
                  </>
                )}
              </p>

              {/* Action Button to Send/Resend OTP */}
              <div className="mt-2">
                <button
                  type="button"
                  disabled={sendingOtp || resendCooldown > 0}
                  onClick={handleSendOtp}
                  className="w-full py-2.5 px-3 bg-onyx-black hover:bg-stone-800 text-white font-button-text text-[11px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>
                    {sendingOtp
                      ? 'Sending Verification OTP...'
                      : resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : 'SEND EMAIL OTP'}
                  </span>
                </button>
              </div>
            </div>

            {/* OTP Dispatch Feedback Banner */}
            {otpSentNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{otpSentNotice}</span>
              </div>
            )}

            {otpError && (
              <div className="p-2.5 bg-red-50 border border-red-300 text-red-800 text-xs font-semibold rounded flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>⚠️ {otpError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[10px] uppercase text-secondary font-bold">ENTER VERIFICATION CODE</label>
                <span className="text-[10px] text-secondary font-semibold">4–6 Digit Code</span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '');
                  setOtpInput(val);
                }}
                placeholder="Enter 4-6 digit code"
                autoFocus
                className="w-full p-3 bg-bone-white border border-sand-neutral text-center text-2xl font-bold tracking-widest text-onyx-black focus:outline-none focus:border-onyx-black font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOtpModalOpen(false);
                  setOtpError('');
                  setOtpSentNotice('');
                }}
                className="px-4 py-2 border border-sand-neutral font-button-text text-xs uppercase font-medium text-secondary hover:text-onyx-black cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus || !otpInput || otpInput.trim().length < 4}
                onClick={handleVerifyOtp}
                className="px-6 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase font-bold hover:bg-stone-800 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{isUpdatingStatus ? 'Verifying...' : 'VERIFY OTP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT DELAY MODAL */}
      {delayModalOpen && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-onyx-black p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div>
              <h3 className="font-headline-md text-lg text-onyx-black font-serif font-bold">Report Transit Delay</h3>
              <p className="font-body-md text-xs text-secondary mt-1">Specify reason for delay to update ETA for customer.</p>
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] uppercase text-secondary font-bold">Delay Reason</label>
              <select
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className="w-full p-2.5 bg-bone-white border border-sand-neutral text-xs font-medium text-onyx-black focus:outline-none"
              >
                <option value="Promenade Traffic Congestion">Promenade Traffic Congestion</option>
                <option value="Kitchen Preparation Delay">Kitchen Preparation Delay</option>
                <option value="Building Security Checkpoint">Building Security Checkpoint</option>
                <option value="Weather / Heavy Rain">Weather / Heavy Rain</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDelayModalOpen(false)}
                className="px-4 py-2 border border-sand-neutral font-button-text text-xs uppercase font-medium text-secondary hover:text-onyx-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDelayModalOpen(false);
                  showToast(`✓ Delay reported: "${delayReason}". Customer notified of +5m estimate.`);
                }}
                className="px-5 py-2 bg-onyx-black text-on-primary font-button-text text-xs uppercase font-bold hover:bg-clay-earth cursor-pointer"
              >
                Broadcast Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS EMERGENCY MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 bg-onyx-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-red-700 p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-2 text-red-700">
              <span className="material-symbols-outlined text-[28px]">emergency</span>
              <h3 className="font-headline-md text-lg font-serif font-bold uppercase tracking-wider">Trigger Emergency SOS?</h3>
            </div>
            <p className="font-body-md text-xs text-secondary leading-relaxed">
              TiffinLink Central Safety Desk will be alerted with your live GPS location and will call your registered phone immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="px-4 py-2 border border-sand-neutral font-button-text text-xs uppercase font-medium text-secondary hover:text-onyx-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSosModalOpen(false);
                  showToast('🚨 SOS Signal Broadcasted! Emergency Desk Dispatching.');
                }}
                className="px-5 py-2 bg-error text-on-error font-button-text text-xs uppercase font-bold hover:bg-red-900 cursor-pointer"
              >
                Confirm SOS Signal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
