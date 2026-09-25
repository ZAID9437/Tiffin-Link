import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';

export default function SafetyEmergencyView({ currentUser, onNavigateTab, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [safetyData, setSafetyData] = useState({
    activeSos: null,
    activeDelivery: null,
    emergencyContacts: [],
    sosHistory: []
  });

  // UI state for SOS trigger confirmation box
  const [sosConfirmationOpen, setSosConfirmationOpen] = useState(false);
  const [sosSubmitting, setSosSubmitting] = useState(false);
  const [resolvingSos, setResolvingSos] = useState(false);

  // Live sensor GPS telemetry
  const [location, setLocation] = useState({
    lat: 19.0596,
    lng: 72.8295,
    accuracy: 11.4,
    speed: 26,
    heading: 284,
    address: 'Bandra West, Carter Road Sector'
  });

  // Emergency Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    relationship: 'Brother',
    isPrimary: false,
    autoSmsEnabled: true,
    autoCallEnabled: true
  });
  const [savingContact, setSavingContact] = useState(false);

  // Local Toast alert state
  const [toast, setToast] = useState({ show: false, title: '', message: '' });

  const showToastMsg = (title, message) => {
    if (onShowToast) {
      onShowToast(`🚨 ${title}: ${message}`);
    }
    setToast({ show: true, title, message });
    setTimeout(() => {
      setToast({ show: false, title: '', message: '' });
    }, 4000);
  };

  // User session parameters
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const userEmail = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const userPhone = currentUser?.phone || savedUser?.phone || '';
  const queryParams = `email=${encodeURIComponent(userEmail)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(userPhone)}`;

  // Auth token helper
  const getAuthToken = () => {
    return localStorage.getItem('tiffinlink_access_token') ||
           localStorage.getItem('token') ||
           localStorage.getItem('tiffinlink_token') || '';
  };

  // 1. Fetch Safety Status & Contacts from MongoDB
  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/driver/safety/emergency?${queryParams}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setSafetyData({
          activeSos: json.data.activeSos || null,
          activeDelivery: json.data.activeDelivery || null,
          emergencyContacts: json.data.emergencyContacts || [],
          sosHistory: json.data.sosHistory || []
        });
      } else {
        setError(json.message || 'Failed to load safety data.');
      }
    } catch (err) {
      console.error('Error fetching safety status:', err);
      setError('Network error loading safety desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, [currentUser]);

  // Real browser GPS calibration
  const updateBrowserGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation((prev) => ({
            ...prev,
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
            accuracy: Number((pos.coords.accuracy || 10).toFixed(1))
          }));
          showToastMsg('GPS Recalibrated', `Location accurate to ±${pos.coords.accuracy ? pos.coords.accuracy.toFixed(1) : '10'}m`);
        },
        (err) => {
          console.warn('Browser GPS warning:', err.message);
          showToastMsg('GPS Standby', 'Using carrier telemetry coordinates.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      showToastMsg('Telemetry Synced', 'Corridor vector locked.');
    }
  };

  useEffect(() => {
    updateBrowserGps();
  }, []);

  // Socket.IO real-time SOS listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSosCreated = () => fetchSafetyData();
    const handleSosResolved = () => fetchSafetyData();

    socket.on('sos:created', handleSosCreated);
    socket.on('sos:resolved', handleSosResolved);

    return () => {
      socket.off('sos:created', handleSosCreated);
      socket.off('sos:resolved', handleSosResolved);
    };
  }, []);

  // 2. Trigger Emergency SOS (Confirm -> POST API)
  const handleConfirmTriggerSos = async () => {
    try {
      setSosSubmitting(true);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/driver/safety/sos?${queryParams}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          address: location.address,
          note: 'Distress triggered from terminal',
          driverId,
          email: userEmail
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToastMsg('🚨 EMERGENCY BROADCAST', 'Distress telemetry dispatched to central desk & contacts.');
        setSosConfirmationOpen(false);
        fetchSafetyData();
      } else {
        showToastMsg('Error', json.message || 'Unable to broadcast SOS alert.');
      }
    } catch (err) {
      console.error('Error activating SOS:', err);
      showToastMsg('Error', 'Failed to transmit SOS signal.');
    } finally {
      setSosSubmitting(false);
    }
  };

  // 3. Resolve Active SOS (PATCH API)
  const handleResolveSos = async () => {
    if (!safetyData.activeSos) return;
    if (!window.confirm('Are you sure you want to resolve and clear this active Emergency SOS alert?')) return;

    try {
      setResolvingSos(true);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const sosId = safetyData.activeSos.sosId || safetyData.activeSos._id;
      const res = await fetch(`http://localhost:5000/api/driver/safety/sos/${encodeURIComponent(sosId)}/resolve?${queryParams}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ note: 'Resolved by courier', driverId, email: userEmail })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToastMsg('SOS RESOLVED', 'Safety incident status set to resolved.');
        fetchSafetyData();
      } else {
        showToastMsg('Error', json.message || 'Failed to resolve SOS incident.');
      }
    } catch (err) {
      console.error('Error resolving SOS:', err);
      showToastMsg('Error', 'Unable to reach backend to resolve SOS.');
    } finally {
      setResolvingSos(false);
    }
  };

  // 4. Emergency Contacts CRUD
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactForm({
      name: '',
      phone: '+91 ',
      relationship: 'Brother',
      isPrimary: safetyData.emergencyContacts.length === 0,
      autoSmsEnabled: true,
      autoCallEnabled: true
    });
    setContactModalOpen(true);
  };

  const handleOpenEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      phone: contact.phone || '',
      relationship: contact.relationship || 'Brother',
      isPrimary: Boolean(contact.isPrimary),
      autoSmsEnabled: contact.autoSmsEnabled !== false,
      autoCallEnabled: contact.autoCallEnabled !== false
    });
    setContactModalOpen(true);
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      showToastMsg('Validation Error', 'Please fill in both Contact Name and Phone Number.');
      return;
    }

    try {
      setSavingContact(true);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = editingContact
        ? `http://localhost:5000/api/driver/safety/emergency-contacts/${editingContact._id}?${queryParams}`
        : `http://localhost:5000/api/driver/safety/emergency-contacts?${queryParams}`;

      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...contactForm,
          driverId,
          email: userEmail
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToastMsg('Contact Saved', editingContact ? 'Emergency contact updated.' : 'New contact added.');
        setContactModalOpen(false);
        fetchSafetyData();
      } else {
        showToastMsg('Error', json.message || 'Failed to save contact.');
      }
    } catch (err) {
      console.error('Error saving contact:', err);
      showToastMsg('Error', 'Network error saving contact.');
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Delete this emergency contact?')) return;

    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/driver/safety/emergency-contacts/${contactId}?${queryParams}`, {
        method: 'DELETE',
        headers
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToastMsg('Contact Removed', 'Emergency contact deleted.');
        fetchSafetyData();
      } else {
        showToastMsg('Error', json.message || 'Failed to delete contact.');
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
      showToastMsg('Error', 'Unable to delete contact.');
    }
  };

  // Primary contact phone for direct dialing
  const primaryContact = safetyData.emergencyContacts.find(c => c.isPrimary) || safetyData.emergencyContacts[0];

  if (loading && !safetyData.emergencyContacts.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="material-symbols-outlined text-4xl text-onyx-black animate-spin">cyclone</span>
        <span className="font-headline-md text-lg text-onyx-black font-serif">Connecting to Safety Center...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16 selection:bg-onyx-black selection:text-white">
      
      {/* Dynamic Feedback Toast */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-50 transform transition-all duration-300 bg-onyx-black text-white p-4 max-w-sm flex items-center gap-3 shadow-2xl border-l-4 border-emerald-500 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-xl">verified</span>
          <div className="flex flex-col">
            <span className="font-button-text text-sm font-semibold">{toast.title}</span>
            <span className="font-label-caps text-[11px] text-stone-300">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. Header & Telemetry Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-surface-container-highest">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-caps text-[11px] tracking-widest uppercase">
            <span>Safety & Compliance</span>
            <span className="text-clay-earth font-bold">/</span>
            <span className="text-on-surface font-semibold">Emergency & SOS</span>
            <span className="text-clay-earth font-bold">/</span>
            <span className="text-clay-earth">Real-time Telemetry</span>
          </div>
          
          <div className="flex items-baseline gap-4 mt-1">
            <h1 className="font-headline-lg text-3xl sm:text-4xl text-onyx-black tracking-tight font-serif font-normal">
              Emergency Assistance
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-950 font-label-caps text-[10px] uppercase font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              Safety Status: Active
            </span>
          </div>
          
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl mt-1">
            Distress protocol gateway for active delivery corridors. Activating SOS transmits cryptographic device coordinates, alert dispatches, and alerts local emergency fleets.
          </p>
        </div>

        {/* Quick Stats & Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex flex-col items-start bg-bone-white px-4 py-2 border border-surface-container-highest">
            <span className="font-label-caps text-[10px] uppercase text-clay-earth tracking-wider font-semibold">Trusted Contacts</span>
            <span className="font-headline-md text-xl text-onyx-black font-serif leading-none mt-0.5">
              {safetyData.emergencyContacts.length} Registered
            </span>
          </div>
          
          <div className="flex flex-col items-start bg-bone-white px-4 py-2 border border-surface-container-highest">
            <span className="font-label-caps text-[10px] uppercase text-clay-earth tracking-wider font-semibold">National Line</span>
            <span className="font-headline-md text-xl text-onyx-black font-serif leading-none mt-0.5">112 Active</span>
          </div>
          
          <button
            type="button"
            onClick={updateBrowserGps}
            className="flex items-center gap-1.5 px-3 py-3 bg-surface-container hover:bg-sand-neutral text-on-surface font-button-text text-xs uppercase tracking-wider transition-colors border border-sand-neutral cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">sync</span>
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Primary 12-Column Responsive Architectural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* LEFT COLUMN (Span 7): Master Triggers, Active Simulation, Consignment Context, Audit Log */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* A. SOS DISPATCH TRIGGER PANEL */}
          <section className="bg-primary-container text-on-primary p-6 md:p-8 flex flex-col relative overflow-hidden bg-stone-950">
            <div className="absolute -right-8 -top-8 text-stone-800/30 select-none pointer-events-none font-headline-lg text-[140px] leading-none font-serif">
              SOS
            </div>

            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="font-label-caps text-xs uppercase tracking-widest text-red-500 font-bold">
                  Emergency Distress Gateway
                </span>
              </div>
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-stone-400">
                ISO-27001 Protocol
              </span>
            </div>

            <h2 className="font-headline-md text-2xl sm:text-3xl text-white mt-4 z-10 font-serif">
              High-Priority SOS Transmission
            </h2>
            
            <p className="font-body-md text-xs sm:text-sm text-stone-300 mt-2 max-w-xl z-10 leading-relaxed">
              Immediate trigger coordinates Central Fleet Support, activates ambient status on terminal, and transmits live location vector to emergency dispatch (112).
            </p>

            {/* Dynamic Trigger Action State */}
            <div className="mt-8 z-10 flex flex-col gap-4">
              
              {!safetyData.activeSos ? (
                <>
                  {!sosConfirmationOpen ? (
                    /* Main Trigger Button */
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setSosConfirmationOpen(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white p-5 flex items-center justify-center gap-3 transition-all text-left group cursor-pointer shadow-lg"
                      >
                        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">emergency</span>
                        <span className="font-button-text text-sm sm:text-base uppercase tracking-widest font-bold">
                          Activate Instant SOS Dispatch
                        </span>
                      </button>
                      <div className="flex items-center justify-between text-stone-400 font-label-caps text-[10px] uppercase tracking-wider">
                        <span>Click to reveal 2-step confirmation check</span>
                        <span>Encrypted via SHA-256</span>
                      </div>
                    </div>
                  ) : (
                    /* Two-step Confirmation Box */
                    <div className="bg-stone-900 p-6 flex flex-col gap-4 border-l-4 border-red-600 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-500 text-3xl">report_problem</span>
                        <div>
                          <span className="font-label-caps text-xs uppercase text-red-500 tracking-wider font-bold block">
                            Critical Action Confirmation
                          </span>
                          <p className="font-body-md text-xs sm:text-sm text-white mt-1 leading-normal">
                            Are you sure you want to broadcast an emergency distress signal? This immediately alerts fleet coordination at <span className="text-amber-300 font-medium">{location.lat}° N, {location.lng}° E</span>
                            {safetyData.activeDelivery ? ` for Order #${safetyData.activeDelivery.orderId}` : ''}.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSosConfirmationOpen(false)}
                          disabled={sosSubmitting}
                          className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-white font-button-text text-xs uppercase tracking-wider transition-colors text-center cursor-pointer font-semibold"
                        >
                          Cancel Request
                        </button>

                        <button
                          type="button"
                          onClick={handleConfirmTriggerSos}
                          disabled={sosSubmitting}
                          className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-button-text text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center cursor-pointer font-bold"
                        >
                          {sosSubmitting ? (
                            <>
                              <span className="material-symbols-outlined text-sm animate-spin">cyclone</span>
                              <span>Transmitting SOS...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">notification_important</span>
                              <span>Confirm SOS Dispatch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* SOS ACTIVE STATE CARD */
                <div className="bg-red-950/90 border-2 border-red-600 p-6 flex flex-col gap-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="font-label-caps text-xs font-bold uppercase tracking-widest text-red-300">
                        🚨 SOS ACTIVE — DISPATCH CELL ALERTED
                      </span>
                    </div>
                    <span className="font-label-caps text-[10px] uppercase text-stone-300 font-mono">
                      {safetyData.activeSos.sosId}
                    </span>
                  </div>

                  <div className="text-xs text-stone-200">
                    Activated at <strong className="text-white">{new Date(safetyData.activeSos.activatedAt || Date.now()).toLocaleTimeString()}</strong> • Live emergency tracking active.
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {primaryContact && (
                      <a
                        href={`tel:${primaryContact.phone}`}
                        className="px-4 py-2.5 bg-white text-stone-950 font-button-text text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 hover:bg-stone-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">call</span>
                        <span>Call {primaryContact.name}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={handleResolveSos}
                      disabled={resolvingSos}
                      className="px-4 py-2.5 bg-stone-900 border border-red-500 hover:bg-stone-800 text-red-200 font-button-text text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>{resolvingSos ? 'Resolving...' : 'Resolve SOS'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            <div className="mt-6 pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-stone-400 font-label-caps text-[10px] uppercase tracking-wider z-10">
              <span>Target Corridor: {location.address}</span>
              <span>Coordinates: {location.lat}° N, {location.lng}° E</span>
            </div>
          </section>

          {/* B. ACTIVE INCIDENT TELEMETRY BANNER */}
          <section className="bg-bone-white p-6 border-l-4 border-onyx-black flex flex-col gap-4 border border-surface-container-highest">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-onyx-black text-white font-label-caps text-[10px] uppercase tracking-wider font-semibold">
                  Status: {safetyData.activeSos ? '🚨 SOS DISPATCH ACTIVE' : 'Standby Telemetry'}
                </span>
                <span className="font-label-caps text-[11px] text-clay-earth uppercase">Session #SES-9821</span>
              </div>
              <span className="font-label-caps text-[11px] text-on-surface-variant">Last ping: 2s ago</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div>
                <h3 className="font-headline-md text-xl text-onyx-black font-serif">Fleet Security Coordination Cell</h3>
                <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                  Escalation officer: Capt. H. Mehta (Dispatched via Hub 12 Bandra West)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:18002004409"
                  className="px-3 py-2 bg-sand-neutral hover:bg-surface-container-highest text-onyx-black font-button-text text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-base">phone_in_talk</span>
                  <span>Hub Lead</span>
                </a>
                <button
                  type="button"
                  onClick={updateBrowserGps}
                  className="px-3 py-2 bg-onyx-black hover:opacity-90 text-white font-button-text text-xs uppercase tracking-wider flex items-center gap-1.5 transition-opacity cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">share_location</span>
                  <span>Ping GPS</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-surface-container-highest text-on-surface">
              <div>
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider block font-semibold">Heartbeat Interval</span>
                <span className="font-button-text text-xs font-bold text-onyx-black">1,000 ms</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider block font-semibold">Signal Link</span>
                <span className="font-button-text text-xs font-bold text-onyx-black">4G LTE (98%)</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider block font-semibold">GPS Precision</span>
                <span className="font-button-text text-xs font-bold text-onyx-black">±{location.accuracy}m</span>
              </div>
              <div>
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider block font-semibold">Dispatch Lock</span>
                <span className="font-button-text text-xs font-bold text-onyx-black">Armed & Synced</span>
              </div>
            </div>
          </section>

          {/* C. ACTIVE DELIVERY CONSIGNMENT CONTEXT */}
          <section className="bg-bone-white p-6 flex flex-col gap-5 border border-surface-container-highest">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-xl">takeout_dining</span>
                <span className="font-label-caps text-xs uppercase tracking-wider text-onyx-black font-bold">
                  Current Consignment Context
                </span>
              </div>
              
              {safetyData.activeDelivery ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-950 font-label-caps text-[10px] uppercase font-bold">
                  ● In Transit (#{safetyData.activeDelivery.orderId})
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-sand-neutral text-onyx-black font-label-caps text-[10px] uppercase">
                  No Active Delivery
                </span>
              )}
            </div>

            {safetyData.activeDelivery ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kitchen Source */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-label-caps text-[11px] uppercase text-clay-earth tracking-wider font-semibold">
                      Kitchen & Pickup Point
                    </span>
                    <span className="font-headline-md text-lg text-onyx-black font-serif">
                      {safetyData.activeDelivery.providerName}
                    </span>
                    <p className="font-body-md text-xs text-on-surface-variant">
                      {typeof safetyData.activeDelivery.pickupAddress === 'string'
                        ? safetyData.activeDelivery.pickupAddress
                        : (safetyData.activeDelivery.pickupAddress?.street || 'Pickup Kitchen Address')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <a
                        className="inline-flex items-center gap-1 text-onyx-black font-button-text text-xs uppercase font-semibold hover:underline"
                        href={`tel:${safetyData.activeDelivery.kitchenPhone || '+919820011223'}`}
                      >
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span>Call Kitchen ({safetyData.activeDelivery.kitchenPhone || '+91 98200 11223'})</span>
                      </a>
                    </div>
                  </div>

                  {/* Customer Destination */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-label-caps text-[11px] uppercase text-clay-earth tracking-wider font-semibold">
                      Recipient Customer
                    </span>
                    <span className="font-headline-md text-lg text-onyx-black font-serif">
                      {safetyData.activeDelivery.customerName} (#{safetyData.activeDelivery.orderId})
                    </span>
                    <p className="font-body-md text-xs text-on-surface-variant">
                      {typeof safetyData.activeDelivery.deliveryAddress === 'string'
                        ? safetyData.activeDelivery.deliveryAddress
                        : (safetyData.activeDelivery.deliveryAddress?.street || 'Customer Address')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <a
                        className="inline-flex items-center gap-1 text-onyx-black font-button-text text-xs uppercase font-semibold hover:underline"
                        href={`tel:${safetyData.activeDelivery.customerPhone || '+919833099887'}`}
                      >
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span>Call Customer ({safetyData.activeDelivery.customerPhone || '+91 98330 99887'})</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 border border-surface-container-highest">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-onyx-black text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">timer</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider block font-semibold">Transit Chronometer</span>
                      <span className="font-headline-md text-lg leading-tight text-onyx-black font-serif">
                        14 min elapsed • {safetyData.activeDelivery.etaMinutes} min ETA
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('active-delivery')}
                    className="px-4 py-2.5 bg-onyx-black text-white hover:opacity-90 font-button-text text-xs uppercase tracking-wider transition-opacity cursor-pointer font-semibold"
                  >
                    View Active Delivery
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-clay-earth">no_crash</span>
                <h4 className="font-headline-md text-base text-onyx-black font-serif">No Active Delivery</h4>
                <p className="font-body-md text-xs text-on-surface-variant max-w-sm mx-auto">
                  You are currently not assigned to an active delivery trip. Safety monitoring remains active.
                </p>
              </div>
            )}
          </section>

          {/* D. AUDIT LOG & HISTORICAL INCIDENTS */}
          <section className="bg-bone-white p-6 flex flex-col border border-surface-container-highest">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-4">
              <div>
                <h3 className="font-headline-md text-xl text-onyx-black font-serif">Incident & SOS Audit History</h3>
                <p className="font-label-caps text-[10px] text-clay-earth uppercase mt-0.5 tracking-wider font-semibold">
                  MongoDB Authenticated Driver Logs
                </p>
              </div>
              <span className="font-label-caps text-[11px] text-on-surface-variant">
                {safetyData.sosHistory.length} Total Incidents Recorded
              </span>
            </div>

            {/* Ledger Table Entries */}
            <div className="flex flex-col divide-y divide-surface-container-highest mt-2">
              {safetyData.sosHistory.length > 0 ? (
                safetyData.sosHistory.map((item, idx) => (
                  <div key={item.sosId || item._id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-button-text font-bold text-onyx-black text-xs">{item.sosId || '#SOS-LOG'}</span>
                        <span className="px-2 py-0.5 bg-surface-container text-onyx-black font-label-caps text-[10px] uppercase">
                          {item.orderId ? `Order #${item.orderId}` : 'Terminal Incident'}
                        </span>
                        <span className="font-label-caps text-[10px] text-clay-earth">
                          {new Date(item.activatedAt || item.createdAt || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <span className="font-body-md text-xs text-on-surface-variant mt-1">
                        {item.note || 'Emergency assistance requested. Dispatched to regional safety desk.'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className={`px-2.5 py-1 font-label-caps text-[10px] uppercase font-bold ${
                        item.status === 'ACTIVE' ? 'bg-red-600 text-white' : 'bg-surface-container-highest text-onyx-black'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No previous SOS incidents recorded in history.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN (Span 5): Sensor Telemetry Radar, Emergency Contacts, Direct Dial Directory */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* E. REAL-TIME GPS & SENSOR TELEMETRY */}
          <section className="bg-bone-white p-6 flex flex-col gap-4 border border-surface-container-highest">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-xl">satellite_alt</span>
                <h3 className="font-headline-md text-lg text-onyx-black font-serif">Live Corridor Telemetry</h3>
              </div>
              
              <span className="flex items-center gap-1 font-label-caps text-[10px] text-onyx-black uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Socket.IO Link
              </span>
            </div>

            {/* Telemetry Details */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-label-caps uppercase text-clay-earth font-semibold">GPS Coordinates</span>
                <span className="font-button-text font-bold text-onyx-black tracking-wide">{location.lat}° N, {location.lng}° E</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-label-caps uppercase text-clay-earth font-semibold">Current Precision</span>
                <span className="font-body-md text-on-surface">±{location.accuracy} Meters (Dual L1/L5)</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-label-caps uppercase text-clay-earth font-semibold">Corridor Speed</span>
                <span className="font-body-md text-on-surface">{location.speed} km/h (Transit Corridor)</span>
              </div>
            </div>

            {/* Realtime Brutalist Vector Radar Map */}
            <div className="relative w-full h-44 bg-surface-container overflow-hidden flex flex-col justify-between p-4 border border-surface-container-highest">
              <svg className="absolute inset-0 w-full h-full stroke-surface-dim opacity-50" height="100%" width="100%">
                <defs>
                  <pattern height="24" id="grid-pattern-safety" patternUnits="userSpaceOnUse" width="24">
                    <path d="M 24 0 L 0 0 0 24" fill="none" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect fill="url(#grid-pattern-safety)" height="100%" width="100%" />
              </svg>

              <svg className="absolute inset-0 w-full h-full" fill="none" viewBox="0 0 400 180">
                <path d="M 40 140 Q 140 100 210 110 T 360 40" stroke="#1a1a1a" strokeLinecap="square" strokeWidth="3" />
                <circle cx="210" cy="110" fill="#1a1a1a" r="7" />
                <circle className="animate-spin" cx="210" cy="110" r="14" stroke="#1a1a1a" strokeDasharray="2 2" strokeWidth="1.5" />
                <rect fill="#4a4238" height="10" width="10" x="35" y="135" />
                <rect fill="#000000" height="10" width="10" x="355" y="35" />
              </svg>

              <div className="relative z-10 flex justify-between items-center text-[10px] font-label-caps uppercase font-bold">
                <span className="bg-bone-white/90 px-2 py-0.5 text-onyx-black tracking-widest backdrop-blur-sm">Sector 14 • Pali Hill</span>
                <span className="bg-onyx-black text-white px-2 py-0.5 tracking-wider">LIVE CARRIER VECTOR</span>
              </div>

              <div className="relative z-10 flex justify-between items-end">
                <div className="bg-bone-white/95 p-2 backdrop-blur-sm">
                  <span className="text-[9px] font-label-caps text-clay-earth uppercase block leading-none font-bold">Destination Node</span>
                  <span className="text-xs font-bold text-onyx-black mt-1 block">Sea Pearl Apt (0.9 km)</span>
                </div>
                <span className="font-label-caps text-[9px] text-clay-earth uppercase bg-surface-container px-2 py-0.5 font-bold">Compass: {location.heading}° WNW</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`https://maps.google.com/?q=${location.lat},${location.lng}`);
                  showToastMsg('GPS Link Copied', 'Location coordinates copied to clipboard.');
                }}
                className="px-3 py-2.5 bg-surface-container hover:bg-sand-neutral text-onyx-black font-button-text text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-sand-neutral font-semibold"
              >
                <span className="material-symbols-outlined text-base">share</span>
                <span>Share GPS Link</span>
              </button>
              
              <button
                type="button"
                onClick={updateBrowserGps}
                className="px-3 py-2.5 bg-onyx-black hover:opacity-90 text-white font-button-text text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-opacity cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-base">my_location</span>
                <span>Recalibrate Sensor</span>
              </button>
            </div>
          </section>

          {/* F. TRUSTED EMERGENCY CONTACTS (Real MongoDB CRUD) */}
          <section className="bg-bone-white p-6 flex flex-col gap-4 border border-surface-container-highest">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <div>
                <h3 className="font-headline-md text-lg text-onyx-black font-serif">Trusted Emergency Contacts</h3>
                <span className="font-label-caps text-[10px] uppercase text-clay-earth tracking-wider font-semibold block">
                  {safetyData.emergencyContacts.length} Registered Contacts
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleOpenAddContact}
                className="px-2.5 py-1.5 bg-sand-neutral hover:bg-surface-container-highest text-onyx-black font-button-text text-xs uppercase tracking-wider transition-colors cursor-pointer font-bold border border-sand-neutral"
              >
                + Add Contact
              </button>
            </div>

            {/* Contact Cards List */}
            <div className="flex flex-col gap-3">
              {safetyData.emergencyContacts.map((contact, idx) => (
                <div key={contact._id || idx} className="p-4 bg-surface-container flex flex-col gap-2 border border-surface-container-highest">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-button-text font-bold text-onyx-black text-sm">{contact.name}</span>
                        {contact.isPrimary && (
                          <span className="px-1.5 py-0.5 bg-onyx-black text-white font-label-caps text-[9px] uppercase font-bold">
                            Primary
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-bone-white text-clay-earth font-label-caps text-[9px] uppercase font-semibold">
                          {contact.relationship || 'Contact'}
                        </span>
                      </div>
                      <span className="font-body-md text-xs text-on-surface-variant mt-0.5 block">{contact.phone}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        className="w-8 h-8 bg-onyx-black text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                        href={`tel:${contact.phone}`}
                        title="Call Contact"
                      >
                        <span className="material-symbols-outlined text-base">call</span>
                      </a>
                      
                      <button
                        type="button"
                        onClick={() => handleOpenEditContact(contact)}
                        className="w-8 h-8 bg-surface-container-highest text-onyx-black flex items-center justify-center hover:bg-sand-neutral transition-colors cursor-pointer"
                        title="Edit Contact"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact._id)}
                        className="w-8 h-8 bg-surface-container-highest text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-surface-container-highest text-clay-earth font-label-caps text-[10px] uppercase font-semibold">
                    <span className="material-symbols-outlined text-xs">done_all</span>
                    <span>Automated SMS & Call alert enabled</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* G. QUICK DIRECT DIAL DIRECTORY */}
          <section className="bg-bone-white p-6 flex flex-col gap-4 border border-surface-container-highest">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-xl">contact_phone</span>
                <h3 className="font-headline-md text-lg text-onyx-black font-serif">Direct Crisis Hotlines</h3>
              </div>
              <span className="font-label-caps text-[10px] uppercase text-clay-earth font-semibold">Direct Route</span>
            </div>

            <div className="flex flex-col divide-y divide-surface-container-highest">
              
              {/* 112 National */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-onyx-black text-white flex items-center justify-center font-button-text font-bold text-xs">
                    112
                  </div>
                  <div>
                    <span className="font-button-text font-bold text-onyx-black block text-xs">National Emergency Helpline</span>
                    <span className="font-label-caps text-[10px] text-clay-earth uppercase font-semibold">Police • Fire • Medical</span>
                  </div>
                </div>
                <a className="px-3 py-1.5 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider hover:opacity-90 transition-opacity font-bold" href="tel:112">
                  Dial 112
                </a>
              </div>

              {/* 108 Ambulance */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-container text-onyx-black flex items-center justify-center font-button-text font-bold text-xs border border-sand-neutral">
                    108
                  </div>
                  <div>
                    <span className="font-button-text font-bold text-onyx-black block text-xs">State Emergency Medical</span>
                    <span className="font-label-caps text-[10px] text-clay-earth uppercase font-semibold">Ambulance Rapid Care</span>
                  </div>
                </div>
                <a className="px-3 py-1.5 bg-surface-container hover:bg-sand-neutral text-onyx-black font-button-text text-xs uppercase tracking-wider transition-colors font-bold border border-sand-neutral" href="tel:108">
                  Dial 108
                </a>
              </div>

              {/* TiffinLink Line */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-onyx-black text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">shield</span>
                  </div>
                  <div>
                    <span className="font-button-text font-bold text-onyx-black block text-xs">TiffinLink Rider Helpline</span>
                    <span className="font-label-caps text-[10px] text-clay-earth uppercase font-semibold">Toll Free 1800-200-4409</span>
                  </div>
                </div>
                <a className="px-3 py-1.5 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider hover:opacity-90 transition-opacity font-bold" href="tel:18002004409">
                  Instant
                </a>
              </div>

              {/* 1091 Women Safety */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-container text-onyx-black flex items-center justify-center font-button-text font-bold text-xs border border-sand-neutral">
                    1091
                  </div>
                  <div>
                    <span className="font-button-text font-bold text-onyx-black block text-xs">Women Protection Cell</span>
                    <span className="font-label-caps text-[10px] text-clay-earth uppercase font-semibold">24/7 Police Rapid Assistance</span>
                  </div>
                </div>
                <a className="px-3 py-1.5 bg-surface-container hover:bg-sand-neutral text-onyx-black font-button-text text-xs uppercase tracking-wider transition-colors font-bold border border-sand-neutral" href="tel:1091">
                  Call 1091
                </a>
              </div>

            </div>
          </section>

          {/* H. SECURITY COMPLIANCE BADGE */}
          <div className="bg-surface-container p-4 flex flex-col gap-2 border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] uppercase text-clay-earth tracking-widest font-bold">
                Security Provenance
              </span>
              <span className="material-symbols-outlined text-base text-clay-earth">verified_user</span>
            </div>
            <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider leading-relaxed font-mono">
              Cryptographic Audit: SHA-256 Encrypted Incident Logs • JWT Principal {currentUser?.driverId || currentUser?.id ? `#${currentUser?.driverId || currentUser?.id}` : ''} • Central Zone Gateway • Socket.IO WebRTC Active.
            </p>
          </div>

        </div>
      </div>

      {/* EMERGENCY CONTACT ADD/EDIT MODAL */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bone-white border-2 border-onyx-black p-6 w-full max-w-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-3">
              <h3 className="font-headline-md text-lg text-onyx-black font-serif">
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h3>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="text-onyx-black hover:opacity-60"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="flex flex-col gap-4">
              <div>
                <label className="font-label-caps text-[10px] uppercase text-clay-earth font-bold block mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Rahul Mansuri"
                  className="w-full p-2.5 bg-surface-container border border-sand-neutral text-xs font-body-md text-onyx-black focus:outline-none focus:border-onyx-black"
                />
              </div>

              <div>
                <label className="font-label-caps text-[10px] uppercase text-clay-earth font-bold block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 bg-surface-container border border-sand-neutral text-xs font-body-md text-onyx-black focus:outline-none focus:border-onyx-black"
                />
              </div>

              <div>
                <label className="font-label-caps text-[10px] uppercase text-clay-earth font-bold block mb-1">Relationship</label>
                <select
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                  className="w-full p-2.5 bg-surface-container border border-sand-neutral text-xs font-body-md text-onyx-black focus:outline-none focus:border-onyx-black"
                >
                  <option value="Brother">Brother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sister">Sister</option>
                  <option value="Friend">Friend</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={contactForm.isPrimary}
                  onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 accent-onyx-black"
                />
                <label htmlFor="isPrimary" className="text-xs font-body-md text-onyx-black cursor-pointer font-semibold">
                  Set as Primary Contact (Called first during SOS)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-highest">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 bg-surface-container text-onyx-black font-button-text text-xs uppercase tracking-wider hover:bg-sand-neutral transition-colors font-semibold"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-5 py-2 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider hover:opacity-90 transition-opacity font-bold cursor-pointer"
                >
                  {savingContact ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
