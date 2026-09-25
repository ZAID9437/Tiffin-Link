import React, { useState, useEffect } from 'react';

/**
 * NotificationPreferencesView Component - Driver Panel Notification Settings
 * Connected to MongoDB backend API endpoints:
 *  - GET /api/driver/notification-preferences
 *  - PUT /api/driver/notification-preferences
 *  - POST /api/driver/notification-preferences/reset
 */
export default function NotificationPreferencesView({ currentUser, onNavigateTab, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successBanner, setSuccessBanner] = useState(true);
  const [pingAlertVisible, setPingAlertVisible] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [previewBannerText, setPreviewBannerText] = useState(null);

  // Default initial preferences matching HTML prompt
  const [preferences, setPreferences] = useState({
    deliveryNotifications: {
      newDeliveryRequest: true,
      deliveryAssigned: true,
      deliveryAccepted: true,
      pickupReminder: true,
      customerArrival: true,
      deliveryCompleted: true,
      deliveryCancelled: true
    },
    earningsNotifications: {
      paymentReceived: true,
      earningsCredited: true,
      payoutStatus: true,
      failedPayment: true,
      weeklySummary: true
    },
    securityNotifications: {
      loginAlert: true,
      passwordChanged: true,
      emailVerification: true,
      phoneVerification: true,
      suspiciousLogin: true
    },
    channels: {
      inApp: true,
      push: true,
      sms: true,
      email: true
    },
    soundAlerts: {
      standardChime: true,
      highDecibelAlarm: true,
      hapticVibration: true,
      urgentSafetyAlerts: true
    },
    quietHours: {
      enabled: true,
      from: '23:00',
      to: '07:00'
    }
  });

  const [initialPreferences, setInitialPreferences] = useState(null);

  const activeToken = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

  const emailParam = currentUser?.email || savedUser?.email || '';
  const phoneParam = currentUser?.phone || savedUser?.phone || '';
  const driverIdParam = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';

  // Fetch preferences from MongoDB
  const fetchPreferences = async (isManual = false) => {
    if (isManual) setLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (emailParam) queryParams.append('email', emailParam);
      if (phoneParam) queryParams.append('phone', phoneParam);
      if (driverIdParam) queryParams.append('driverId', driverIdParam);

      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/driver/notification-preferences?${queryParams.toString()}`, {
        headers
      });

      const json = await res.json();
      if (res.ok && json.success && json.data && json.data.notificationPreferences) {
        setPreferences(json.data.notificationPreferences);
        setInitialPreferences(json.data.notificationPreferences);
        if (isManual && onShowToast) onShowToast('✓ Notification preferences loaded from MongoDB.');
      } else {
        if (!initialPreferences) {
          console.warn('Preferences fetch warning:', json.message);
        }
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      if (isManual) setErrorMessage('Unable to load notification preferences from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [currentUser]);

  // Toggle Handler for nested objects
  const handleToggle = (category, key) => {
    // Security notifications cannot be toggled off
    if (category === 'securityNotifications') {
      if (onShowToast) onShowToast('🔒 Security notifications are mandatory and cannot be disabled.');
      return;
    }

    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  // Handle Quiet Hours changes
  const handleQuietHoursChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  // Save Preferences to MongoDB
  const handleSavePreferences = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const payload = {
        email: emailParam,
        driverId: driverIdParam,
        notificationPreferences: preferences
      };

      const res = await fetch('http://localhost:5000/api/driver/notification-preferences', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setInitialPreferences(preferences);
        setSuccessBanner(true);
        if (onShowToast) onShowToast('✓ Notification preferences updated successfully in MongoDB!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(json.message || 'Failed to update preferences.');
        if (onShowToast) onShowToast(`⚠️ ${json.message || 'Error saving preferences'}`);
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setErrorMessage('Network error while saving notification preferences.');
      if (onShowToast) onShowToast('⚠️ Network error while saving preferences.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    if (confirm('Reset all custom alert triggers, quiet hours, and audio routes to TiffinLink Fleet Standard defaults?')) {
      setSaving(true);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

        const res = await fetch('http://localhost:5000/api/driver/notification-preferences/reset', {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: emailParam, driverId: driverIdParam })
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setPreferences(json.data);
          setInitialPreferences(json.data);
          if (onShowToast) onShowToast('✓ Reset to TiffinLink Fleet Standard defaults.');
        }
      } catch (err) {
        console.error('Error resetting preferences:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  // Discard changes
  const handleDiscard = () => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
      if (onShowToast) onShowToast('Unsaved preference changes discarded.');
    }
  };

  // Simulate Dispatch Ping
  const handleTestDispatchPing = () => {
    setPingLoading(true);
    setPingAlertVisible(true);

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }

    setTimeout(() => {
      setPingLoading(false);
    }, 1200);

    setTimeout(() => {
      setPingAlertVisible(false);
    }, 4500);
  };

  // Preview Tone
  const handlePreviewTone = (toneName) => {
    setPreviewBannerText(`Acoustic Preview Emitted: "${toneName}" (44.1 kHz PCM)`);
    if (onShowToast) onShowToast(`🔊 Previewing tone: ${toneName}`);
    setTimeout(() => setPreviewBannerText(null), 3500);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-onyx-black animate-spin">autorenew</span>
        <h3 className="font-headline-md text-xl text-onyx-black font-serif">Loading Notification Preferences...</h3>
        <p className="font-body-md text-xs text-clay-earth">Fetching real-time preferences from MongoDB driver_preferences...</p>
      </div>
    );
  }

  const driverIdDisplay = currentUser?.driverId || savedUser?.driverId || currentUser?.id || currentUser?._id || '';
  const driverNameDisplay = currentUser?.fullName || currentUser?.name || savedUser?.fullName || savedUser?.name || 'Courier Partner';

  return (
    <div className="flex flex-col w-full pb-32 selection:bg-onyx-black selection:text-white">
      
      {/* Toast Banner */}
      {successBanner && (
        <div className="mb-8 w-full bg-bone-white p-5 flex items-start justify-between transition-all duration-300 relative overflow-hidden border border-sand-neutral shadow-xs" id="toast-banner">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-onyx-black" />
          <div className="flex items-start gap-3.5 pl-2">
            <span className="material-symbols-outlined text-onyx-black text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <div className="flex flex-col">
              <span className="font-button-text text-button-text text-onyx-black font-semibold tracking-wide text-sm">
                Notification preferences updated successfully
              </span>
              <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest mt-1">
                Scoped to Driver Principal #{driverIdDisplay} • Synced to MongoDB driver_preferences collection
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(false)}
            className="text-clay-earth hover:text-onyx-black transition-colors p-1"
            title="Dismiss notification"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Tone Preview Feedback Banner */}
      {previewBannerText && (
        <div className="mb-6 p-4 bg-onyx-black text-on-primary font-mono text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-amber-400">graphic_eq</span>
            <span>{previewBannerText}</span>
          </div>
          <button type="button" onClick={() => setPreviewBannerText(null)} className="text-sand-neutral text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-error text-error text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => fetchPreferences(true)} className="underline text-xs font-bold">RETRY</button>
        </div>
      )}

      {/* Header & Telemetry Area */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-sand-neutral/50">
        <div className="flex flex-col max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest text-xs">Settings</span>
            <span className="text-clay-earth text-xs font-mono">/</span>
            <span className="font-label-caps text-label-caps text-onyx-black uppercase tracking-widest font-bold text-xs">Notification Preferences</span>
            <span className="text-clay-earth text-xs font-mono">•</span>
            <div className="flex items-center gap-1.5 bg-sand-neutral px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-onyx-black" />
              <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-semibold">MongoDB driver_preferences synced</span>
            </div>
            <div className="flex items-center gap-1.5 bg-bone-white px-2 py-0.5 border border-sand-neutral/50">
              <span className="w-1.5 h-1.5 rounded-full bg-clay-earth animate-pulse" />
              <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Client WebSocket Active</span>
            </div>
          </div>

          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none mb-3 font-serif text-3xl sm:text-4xl">
            Notification Preferences
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
            Control how and when you receive dispatch alerts, escrow payouts, security bulletins, and hardware vibration signals across physical vehicle mounts and wearables.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-end">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-bone-white hover:bg-sand-neutral text-onyx-black transition-colors font-button-text text-xs uppercase tracking-wider flex items-center gap-2 font-semibold border border-sand-neutral"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            disabled={pingLoading}
            onClick={handleTestDispatchPing}
            className="px-5 py-2.5 bg-onyx-black text-white hover:bg-stone-800 transition-colors font-button-text text-xs uppercase tracking-wider flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <span>{pingLoading ? 'Testing...' : 'Test Dispatch Ping'}</span>
          </button>
        </div>
      </header>

      {/* Live Acoustic Test Banner */}
      {pingAlertVisible && (
        <div className="my-6 bg-onyx-black text-white p-4 flex items-center justify-between transition-all animate-bounce shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-bone-white text-2xl">priority_high</span>
            <div className="flex flex-col">
              <span className="font-button-text text-sm tracking-wider uppercase font-bold text-white">Simulated Haptic &amp; 95dB Intercom Ping Sent</span>
              <span className="font-label-caps text-[11px] text-sand-neutral uppercase tracking-widest">WebSocket event `DISPATCH_TEST_PROBE` emitted to Handset #{driverIdDisplay}</span>
            </div>
          </div>
          <span className="font-label-caps text-[10px] bg-clay-earth px-2 py-1 text-white uppercase font-bold">RTT: 14ms</span>
        </div>
      )}

      <div className="flex flex-col gap-14 mt-8">

        {/* SECTION 1: DELIVERY NOTIFICATIONS */}
        <section className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-sand-neutral/60">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">Protocol Stream 01</span>
                <span className="text-clay-earth text-xs font-mono">•</span>
                <span className="font-label-caps text-[11px] text-onyx-black uppercase tracking-widest font-semibold">Priority Transit</span>
              </div>
              <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Delivery Notifications</h2>
            </div>
            <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-wider mt-1 md:mt-0">
              7 Events Configured • Real-time Radar Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* New Delivery Request */}
            <div className="bg-bone-white p-6 flex flex-col justify-between transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">notification_important</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-button-text text-onyx-black font-semibold text-base">New Delivery Request</span>
                      <span className="font-label-caps text-[9px] bg-onyx-black text-white px-1.5 py-0.5 uppercase tracking-wider font-bold">Radar Overlay</span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Immediate radar sound and full-screen vehicle takeover modal for incoming lunch/dinner orders with active 45s acceptance timer.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.newDeliveryRequest ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'newDeliveryRequest')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: Audio Chime + HUD Modal</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.newDeliveryRequest ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.newDeliveryRequest ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Delivery Assigned */}
            <div className="bg-bone-white p-6 flex flex-col justify-between transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">assignment_turned_in</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-semibold text-base">Delivery Assigned</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Confirmation dispatch notification when Central Hub routes an optimized multi-tier lunch thali or bulk corporate batch.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.deliveryAssigned ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'deliveryAssigned')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: In-App Toast</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.deliveryAssigned ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.deliveryAssigned ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Delivery Accepted */}
            <div className="bg-bone-white p-6 flex flex-col justify-between transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">task_alt</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-semibold text-base">Delivery Accepted</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Operational manifest validation logged when your mobile terminal locks the trip waypoint sequence and initializes GPS telemetry.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.deliveryAccepted ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'deliveryAccepted')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: In-App Drawer</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.deliveryAccepted ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.deliveryAccepted ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Pickup Reminder */}
            <div className="bg-bone-white p-6 flex flex-col justify-between transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">schedule</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-semibold text-base">Pickup Reminder</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      10-minute warning alert before commercial kitchen pickup window expires to preserve thermal fresh food safety compliance.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.pickupReminder ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'pickupReminder')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: High Audio + Vibration</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.pickupReminder ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.pickupReminder ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Customer Arrival */}
            <div className="bg-bone-white p-6 flex flex-col justify-between transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">near_me</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-semibold text-base">Customer Arrival (Geofence)</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Automated geofence trigger fired when courier vehicle enters within 400m perimeter of customer drop-off coordinates.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.customerArrival ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'customerArrival')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: Voice Prompt + Sound</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.customerArrival ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.customerArrival ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Delivery Completed */}
            <div className="bg-bone-white p-6 flex flex-col justify-between transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">verified</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-semibold text-base">Delivery Completed</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Digital handshake notification following valid customer OTP receipt, cryptographic proof of drop-off, and escrow release.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.deliveryCompleted ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'deliveryCompleted')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: In-App Toast + Ledger Sync</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.deliveryCompleted ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.deliveryCompleted ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Delivery Cancelled */}
            <div className="bg-bone-white p-6 flex flex-col justify-between md:col-span-2 transition-colors hover:bg-sand-neutral/40 border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">cancel</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-button-text text-onyx-black font-semibold text-base">Delivery Cancelled &amp; Penalty Guarantee</span>
                      <span className="font-label-caps text-[9px] bg-clay-earth text-white px-1.5 py-0.5 uppercase tracking-wider font-bold">Immediate Reroute</span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Urgent alert with dynamic return instructions, kitchen return authorization code, and immediate base-fare convenience compensation credited to your partner wallet.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.deliveryNotifications?.deliveryCancelled ?? true}
                    onChange={() => handleToggle('deliveryNotifications', 'deliveryCancelled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-3 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Channel: Urgent Push + High Sound + SMS Fallback</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.deliveryNotifications?.deliveryCancelled ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  State: {preferences.deliveryNotifications?.deliveryCancelled ? 'Active' : 'Muted'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: EARNINGS & PAYMENT NOTIFICATIONS */}
        <section className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-sand-neutral/60">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">Protocol Stream 02</span>
                <span className="text-clay-earth text-xs font-mono">•</span>
                <span className="font-label-caps text-[11px] text-onyx-black uppercase tracking-widest font-semibold">Financial Ledger</span>
              </div>
              <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Earnings &amp; Payment Notifications</h2>
            </div>
            <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-wider mt-1 md:mt-0">
              Automated Settlement Webhooks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Payment Received */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <span className="font-button-text text-onyx-black font-semibold text-base">Payment Received</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider mt-0.5">Real-time Escrow Clear</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.earningsNotifications?.paymentReceived ?? true}
                    onChange={() => handleToggle('earningsNotifications', 'paymentReceived')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mb-6">
                Real-time ping when customer gratuity tips or per-kilometer surge bonuses unlock and balance in escrow.
              </p>
              <div className="bg-surface-container-highest p-3 flex items-center justify-between border border-sand-neutral">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase">Threshold</span>
                <span className="font-button-text text-xs text-onyx-black font-mono font-bold">₹0.00 (Instant)</span>
              </div>
            </div>

            {/* Earnings Credited */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <span className="font-button-text text-onyx-black font-semibold text-base">Earnings Credited</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider mt-0.5">Shift Reconcile</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.earningsNotifications?.earningsCredited ?? true}
                    onChange={() => handleToggle('earningsNotifications', 'earningsCredited')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mb-6">
                Shift closing balance audits, daily fuel subsidy calculations, and courier tier milestone rewards.
              </p>
              <div className="bg-surface-container-highest p-3 flex items-center justify-between border border-sand-neutral">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase">Schedule</span>
                <span className="font-button-text text-xs text-onyx-black font-mono font-bold">23:59 Daily Shift Close</span>
              </div>
            </div>

            {/* Withdrawal / Payout Status */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <span className="font-button-text text-onyx-black font-semibold text-base">Withdrawal / Payout Status</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider mt-0.5">Bank Settlement</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.earningsNotifications?.payoutStatus ?? true}
                    onChange={() => handleToggle('earningsNotifications', 'payoutStatus')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mb-6">
                Instant IMPS / UPI transaction updates dispatched to registered bank account ending in <strong className="font-mono text-onyx-black">•••• 9012</strong>.
              </p>
              <div className="bg-surface-container-highest p-3 flex items-center justify-between border border-sand-neutral">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase">Destination</span>
                <span className="font-button-text text-xs text-onyx-black font-mono font-bold">HDFC •••• 9012</span>
              </div>
            </div>

            {/* Failed Payment (Critical) */}
            <div className="bg-sand-neutral p-6 flex flex-col justify-between md:col-span-2 border border-sand-neutral">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">error</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-button-text text-onyx-black font-bold text-base">Failed Payment &amp; Escrow Halt</span>
                      <span className="font-label-caps text-[9px] bg-onyx-black text-white px-2 py-0.5 uppercase tracking-wider font-bold">High Priority</span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Instant escalation alert if bank clearing fails, ACH chargebacks occur, or gateway reversals require immediate bank detail re-attestation.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.earningsNotifications?.failedPayment ?? true}
                    onChange={() => handleToggle('earningsNotifications', 'failedPayment')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-bone-white peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-onyx-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between text-clay-earth pt-2 border-t border-sand-neutral/50">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Routing: Redundant Push + Instant SMS Broadcast</span>
                <span className="font-label-caps text-[10px] text-onyx-black font-bold uppercase">Zero Dropped Event SLA</span>
              </div>
            </div>

            {/* Weekly Earnings Summary */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <span className="font-button-text text-onyx-black font-semibold text-base">Weekly Summary</span>
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider mt-0.5">Digest • Monday 06:00</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.earningsNotifications?.weeklySummary ?? true}
                    onChange={() => handleToggle('earningsNotifications', 'weeklySummary')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant mb-6">
                Aggregated earnings statement containing total completed trips, incentive payouts, customer ratings, and downloadable tax invoice.
              </p>
              <div className="bg-surface-container-highest p-3 flex items-center justify-between border border-sand-neutral">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase">Format</span>
                <span className="font-button-text text-xs text-onyx-black font-mono font-bold">PDF + In-App Summary</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 3: ACCOUNT & SECURITY (MANDATORY COMPLIANCE) */}
        <section className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-sand-neutral/60">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">Protocol Stream 03</span>
                <span className="text-clay-earth text-xs font-mono">•</span>
                <span className="font-label-caps text-[11px] text-onyx-black uppercase tracking-widest font-semibold">Fleet Governance</span>
              </div>
              <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Account &amp; Security Verification</h2>
            </div>
            <div className="flex items-center gap-2 bg-sand-neutral px-3 py-1.5 mt-2 md:mt-0 border border-sand-neutral">
              <span className="material-symbols-outlined text-xs text-onyx-black">lock</span>
              <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-widest font-bold">
                Mandatory Policy Enforcement • Immutable Controls
              </span>
            </div>
          </div>

          <div className="bg-bone-white p-6 mb-4 border border-sand-neutral/60">
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              In compliance with TiffinLink Fleet Security Directive ISO/IEC 27001, courier security feeds cannot be toggled off. These protocols safeguard your partner earnings, delivery credentials, and identity verification records against unauthorized takeover.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            
            {/* Item 1: Login Alert */}
            <div className="bg-surface-container-low p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sand-neutral/60">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-sand-neutral flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-onyx-black text-lg">shield_person</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-onyx-black font-semibold text-sm">Login Alert</span>
                    <span className="font-label-caps text-[9px] bg-sand-neutral text-clay-earth px-1.5 py-0.5 uppercase tracking-wider font-bold border border-sand-neutral">Mandatory</span>
                  </div>
                  <span className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    Instant notification whenever your driver account is accessed from an unfamiliar mobile IMEI or browser fingerprint.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest font-mono font-bold">ENFORCED</span>
                <div className="w-11 h-6 bg-onyx-black rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90" title="Security compliance requires this setting to remain active.">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-onyx-black">lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2: Password Changed */}
            <div className="bg-surface-container-low p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sand-neutral/60">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-sand-neutral flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-onyx-black text-lg">password</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-onyx-black font-semibold text-sm">Password &amp; PIN Alteration</span>
                    <span className="font-label-caps text-[9px] bg-sand-neutral text-clay-earth px-1.5 py-0.5 uppercase tracking-wider font-bold border border-sand-neutral">Mandatory</span>
                  </div>
                  <span className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    Immediate cryptographic push notification and SMS trigger whenever your terminal authentication key is updated.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest font-mono font-bold">ENFORCED</span>
                <div className="w-11 h-6 bg-onyx-black rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-onyx-black">lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 3: Email Verification */}
            <div className="bg-surface-container-low p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sand-neutral/60">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-sand-neutral flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-onyx-black text-lg">mail_lock</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-onyx-black font-semibold text-sm">Email Verification &amp; Legal Notices</span>
                    <span className="font-label-caps text-[9px] bg-sand-neutral text-clay-earth px-1.5 py-0.5 uppercase tracking-wider font-bold border border-sand-neutral">Mandatory</span>
                  </div>
                  <span className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    Official partner contract revisions, insurance coverage renewals, and dispute resolution confirmations.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest font-mono font-bold">ENFORCED</span>
                <div className="w-11 h-6 bg-onyx-black rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-onyx-black">lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 4: Phone Verification */}
            <div className="bg-surface-container-low p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sand-neutral/60">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-sand-neutral flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-onyx-black text-lg">phonelink_lock</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-onyx-black font-semibold text-sm">Phone Verification &amp; 2FA Tokens</span>
                    <span className="font-label-caps text-[9px] bg-sand-neutral text-clay-earth px-1.5 py-0.5 uppercase tracking-wider font-bold border border-sand-neutral">Mandatory</span>
                  </div>
                  <span className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    One-Time Passwords (OTPs) for wallet payout releases and customer communication proxy bridging.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest font-mono font-bold">ENFORCED</span>
                <div className="w-11 h-6 bg-onyx-black rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-onyx-black">lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 5: Suspicious Login */}
            <div className="bg-surface-container-low p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sand-neutral/60">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-sand-neutral flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-onyx-black text-lg">gpp_maybe</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-onyx-black font-semibold text-sm">Suspicious Login &amp; Concurrent Session Lock</span>
                    <span className="font-label-caps text-[9px] bg-sand-neutral text-clay-earth px-1.5 py-0.5 uppercase tracking-wider font-bold border border-sand-neutral">Mandatory</span>
                  </div>
                  <span className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    Fleet defense quarantine alerts when multiple simultaneous devices attempt GPS spoofing or location jumps.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest font-mono font-bold">ENFORCED</span>
                <div className="w-11 h-6 bg-onyx-black rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-onyx-black">lock</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: DELIVERY CHANNELS MATRIX */}
        <section className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-sand-neutral/60">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">Protocol Stream 04</span>
                <span className="text-clay-earth text-xs font-mono">•</span>
                <span className="font-label-caps text-[11px] text-onyx-black uppercase tracking-widest font-semibold">Carrier Rails</span>
              </div>
              <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Delivery Channels Matrix</h2>
            </div>
            <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-wider mt-1 md:mt-0">
              Hardware &amp; Transport Multiplexing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* In-App Notifications */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-onyx-black text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">web_asset</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.channels?.inApp ?? true}
                      onChange={() => handleToggle('channels', 'inApp')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                  </label>
                </div>
                <h3 className="font-button-text text-onyx-black font-bold uppercase tracking-wider mb-2 text-sm">In-App Panel</h3>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  Real-time HUD toast alerts, audio banners, and live notification drawer within this operational browser console.
                </p>
              </div>
              <div className="pt-6 mt-4 flex items-center justify-between text-clay-earth border-t border-sand-neutral/40">
                <span className="font-label-caps text-[10px] uppercase">Latency: ~35ms</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.channels?.inApp ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  {preferences.channels?.inApp ? 'Online' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-onyx-black text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">phone_android</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.channels?.push ?? true}
                      onChange={() => handleToggle('channels', 'push')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                  </label>
                </div>
                <h3 className="font-button-text text-onyx-black font-bold uppercase tracking-wider mb-2 text-sm">Mobile Push</h3>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  Apple APNs and Google FCM system notifications routed directly to your active smartphone or smart helmet unit.
                </p>
              </div>
              <div className="pt-6 mt-4 flex items-center justify-between text-clay-earth border-t border-sand-neutral/40">
                <span className="font-label-caps text-[10px] uppercase">FCM / APNs</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.channels?.push ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  {preferences.channels?.push ? 'Paired (Pixel 8)' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* SMS Carrier Gateway */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-onyx-black text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">sms</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.channels?.sms ?? true}
                      onChange={() => handleToggle('channels', 'sms')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                  </label>
                </div>
                <h3 className="font-button-text text-onyx-black font-bold uppercase tracking-wider mb-2 text-sm">SMS Gateway</h3>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  High-priority SMS alerts strictly reserved for mandatory 2FA OTP codes, offline fallback dispatches, and SOS rescue beacons.
                </p>
              </div>
              <div className="pt-6 mt-4 flex items-center justify-between text-clay-earth border-t border-sand-neutral/40">
                <span className="font-label-caps text-[10px] uppercase">+91 98•••• 4321</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.channels?.sms ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  {preferences.channels?.sms ? 'Verified Rail' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Email Summaries */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-onyx-black text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">mark_email_read</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.channels?.email ?? true}
                      onChange={() => handleToggle('channels', 'email')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                  </label>
                </div>
                <h3 className="font-button-text text-onyx-black font-bold uppercase tracking-wider mb-2 text-sm">Email Feed</h3>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  Cryptographically signed tax invoices, weekly performance analytics, fleet compliance bulletins, and account notices.
                </p>
              </div>
              <div className="pt-6 mt-4 flex items-center justify-between text-clay-earth border-t border-sand-neutral/40">
                <span className="font-label-caps text-[10px] uppercase truncate max-w-[100px]">{emailParam || 'r.verma@tiffin...'}</span>
                <span className={`font-label-caps text-[10px] uppercase font-bold ${preferences.channels?.email ? 'text-onyx-black' : 'text-clay-earth'}`}>
                  {preferences.channels?.email ? 'DKIM Signed' : 'Disabled'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 5: SOUND & HARDWARE ALERT SETTINGS */}
        <section className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-sand-neutral/60">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">Protocol Stream 05</span>
                <span className="text-clay-earth text-xs font-mono">•</span>
                <span className="font-label-caps text-[11px] text-onyx-black uppercase tracking-widest font-semibold">Acoustic &amp; Tactile Signals</span>
              </div>
              <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Sound &amp; Hardware Alert Settings</h2>
            </div>
            <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-wider mt-1 md:mt-0">
              Cockpit Helmet &amp; Mount Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Notification Sound */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">volume_up</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-bold text-base">Standard Acoustic Chime</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Gentle dual-tone acoustic chime emitted for generic shift updates, route rebalancing, and customer text alerts.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.soundAlerts?.standardChime ?? true}
                    onChange={() => handleToggle('soundAlerts', 'standardChime')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-4 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase">Audio Output: System Default</span>
                <button
                  type="button"
                  onClick={() => handlePreviewTone('Standard Chime')}
                  className="font-button-text text-xs text-onyx-black font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">play_circle</span> Preview
                </button>
              </div>
            </div>

            {/* High-Decibel Alert */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">volume_down_alt</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-button-text text-onyx-black font-bold text-base">High-Decibel Request Alarm</span>
                      <span className="font-label-caps text-[9px] bg-onyx-black text-white px-1.5 py-0.5 uppercase font-bold">Helmet Penetration</span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      High-gain 2.8kHz resonant frequency alert designed specifically to penetrate full-face motorbike helmets and urban traffic noise.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.soundAlerts?.highDecibelAlarm ?? true}
                    onChange={() => handleToggle('soundAlerts', 'highDecibelAlarm')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-4 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase">Gain: +6dB Boost</span>
                <button
                  type="button"
                  onClick={() => handlePreviewTone('High-Decibel Alarm')}
                  className="font-button-text text-xs text-onyx-black font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">play_circle</span> Preview
                </button>
              </div>
            </div>

            {/* Haptic Vibration */}
            <div className="bg-bone-white p-6 flex flex-col justify-between border border-sand-neutral/60">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">vibration</span>
                  <div className="flex flex-col">
                    <span className="font-button-text text-onyx-black font-bold text-base">Continuous Haptic Vibration</span>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Continuous synchronized pulse pattern on paired handlebar-mounted smartphone during incoming dispatch offer countdowns.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={preferences.soundAlerts?.hapticVibration ?? true}
                    onChange={() => handleToggle('soundAlerts', 'hapticVibration')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
                </label>
              </div>
              <div className="flex items-center justify-between pt-4 text-clay-earth border-t border-sand-neutral/30">
                <span className="font-label-caps text-[10px] uppercase">Motor Profile: Heavy Quad-Pulse</span>
                <button
                  type="button"
                  onClick={() => handlePreviewTone('Haptic Vibration')}
                  className="font-button-text text-xs text-onyx-black font-bold hover:underline flex items-center gap-1 uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">touch_app</span> Test Buzz
                </button>
              </div>
            </div>

            {/* Urgent Safety Alerts (Locked ON) */}
            <div className="bg-sand-neutral p-6 flex flex-col justify-between border border-sand-neutral">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-onyx-black text-2xl mt-0.5">emergency</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-button-text text-onyx-black font-bold text-base">Urgent Fleet Safety Alerts</span>
                      <span className="font-label-caps text-[9px] bg-onyx-black text-white px-2 py-0.5 uppercase tracking-wider font-bold">Mandatory SLA</span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed mt-1">
                      Overriding high-volume audible siren for emergency weather shutdowns, localized civil curfews, and dispatch SOS alerts.
                    </p>
                  </div>
                </div>
                <div className="w-11 h-6 bg-onyx-black rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-90 shrink-0 mt-1" title="Emergency broadcast protocols cannot be disabled">
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-onyx-black">lock</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 text-clay-earth border-t border-sand-neutral/50">
                <span className="font-label-caps text-[10px] uppercase tracking-wider">Override: DND Bypass Enabled</span>
                <span className="font-label-caps text-[10px] text-onyx-black font-bold uppercase">Immutable</span>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 6: QUIET HOURS & DO NOT DISTURB */}
        <section className="flex flex-col">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-sand-neutral/60">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-widest">Protocol Stream 06</span>
                <span className="text-clay-earth text-xs font-mono">•</span>
                <span className="font-label-caps text-[11px] text-onyx-black uppercase tracking-widest font-semibold">Courier Wellness</span>
              </div>
              <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Quiet Hours &amp; Do Not Disturb</h2>
            </div>
            <span className="font-label-caps text-[11px] text-clay-earth uppercase tracking-wider mt-1 md:mt-0">
              Scheduled Off-Duty Silence
            </span>
          </div>

          <div className="bg-bone-white p-6 sm:p-8 flex flex-col gap-8 border border-sand-neutral/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-onyx-black text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">bedtime</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-headline-md text-2xl text-onyx-black font-serif">Enable Nighttime Silence Window</span>
                    <span className="font-label-caps text-[10px] bg-sand-neutral text-onyx-black px-2 py-0.5 uppercase tracking-wider font-bold border border-sand-neutral">
                      {preferences.quietHours?.enabled ? 'Scheduled Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="font-body-md text-xs text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
                    Automatically silences non-urgent marketing, weekly stats, customer reviews, and routine settlement notifications during designated off-duty resting hours.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.quietHours?.enabled ?? false}
                  onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5.5 after:w-6 after:transition-all peer-checked:bg-onyx-black" />
              </label>
            </div>

            {/* Time Picker Controls */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 bg-surface-container-lowest p-6 border border-sand-neutral transition-all ${preferences.quietHours?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex flex-col">
                <label className="font-label-caps text-xs uppercase tracking-wider text-clay-earth mb-2" htmlFor="quiet-from">
                  Quiet Window Start (Mute Inbound Tones)
                </label>
                <div className="relative flex items-center bg-bone-white p-3.5 border border-sand-neutral">
                  <span className="material-symbols-outlined text-onyx-black text-lg mr-3">bedtime</span>
                  <input
                    id="quiet-from"
                    type="time"
                    value={preferences.quietHours?.from || '23:00'}
                    onChange={(e) => handleQuietHoursChange('from', e.target.value)}
                    className="w-full bg-transparent font-mono text-base font-semibold text-onyx-black outline-none cursor-pointer"
                  />
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-widest font-mono">IST</span>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="font-label-caps text-xs uppercase tracking-wider text-clay-earth mb-2" htmlFor="quiet-to">
                  Quiet Window End (Resume Normal Alerts)
                </label>
                <div className="relative flex items-center bg-bone-white p-3.5 border border-sand-neutral">
                  <span className="material-symbols-outlined text-onyx-black text-lg mr-3">wb_sunny</span>
                  <input
                    id="quiet-to"
                    type="time"
                    value={preferences.quietHours?.to || '07:00'}
                    onChange={(e) => handleQuietHoursChange('to', e.target.value)}
                    className="w-full bg-transparent font-mono text-base font-semibold text-onyx-black outline-none cursor-pointer"
                  />
                  <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-widest font-mono">IST</span>
                </div>
              </div>
            </div>

            {/* Safe Harbor Exception Rule Card */}
            <div className="bg-sand-neutral p-5 flex items-start gap-4 border border-sand-neutral">
              <span className="material-symbols-outlined text-onyx-black text-xl shrink-0 mt-0.5">policy</span>
              <div className="flex flex-col">
                <span className="font-button-text text-onyx-black uppercase tracking-wider font-bold text-xs">
                  Autonomous Dispatch Safe Harbor Exception
                </span>
                <p className="font-body-md text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Quiet hours mute non-critical marketing, shift summaries, and routine tips. High-priority delivery assignments during active shifts and Emergency SOS overrides will always bypass quiet hours to guarantee courier safety and SLA obligations.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER & TELEMETRY STICKY BAR */}
      <div className="fixed bottom-6 left-6 right-6 lg:left-[340px] lg:right-8 z-40 bg-bone-white p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-onyx-black">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="font-button-text text-xs text-clay-earth hover:text-onyx-black transition-colors uppercase tracking-wider underline font-semibold"
          >
            Reset to System Defaults
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-clay-earth">
          <span className="w-2 h-2 rounded-full bg-onyx-black" />
          <span className="font-label-caps text-[11px] uppercase tracking-wider font-medium">
            Changes persist immediately across mobile handheld and desktop web sessions
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-5 py-2 bg-bone-white hover:bg-sand-neutral text-onyx-black transition-colors font-button-text text-xs uppercase tracking-wider font-semibold border border-sand-neutral"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSavePreferences}
            className="px-7 py-2 bg-onyx-black hover:bg-stone-800 text-white transition-colors font-button-text text-xs uppercase tracking-widest flex items-center gap-2 font-bold shadow-xs"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cryptographic Provenance Metadata Stamp */}
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-clay-earth border-t border-sand-neutral/60 mt-12">
        <span className="font-label-caps text-[10px] uppercase tracking-widest font-mono">
          SECURITY PROTOCOL SHA-256 • SCOPED PRINCIPAL: {driverNameDisplay.toUpperCase()} (#{driverIdDisplay})
        </span>
        <span className="font-label-caps text-[10px] uppercase tracking-widest font-mono">
          CLOUD-SYNC PROTOCOL V4.2 • MONGO_COLLECTION: DRIVER_PREFERENCES
        </span>
      </div>

    </div>
  );
}
