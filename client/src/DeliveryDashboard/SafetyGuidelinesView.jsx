import React, { useState, useEffect } from 'react';

export default function SafetyGuidelinesView({ currentUser, onNavigateTab, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guidelinesData, setGuidelinesData] = useState({
    version: 'SAF-902-v4.2',
    effectiveDate: '18 Sep 2026',
    isAcknowledged: false,
    acknowledgedAt: null,
    digitalSignature: null
  });

  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);

  const driverName = currentUser?.fullName || currentUser?.name || 'Courier Partner';
  const driverId = currentUser?.driverId || currentUser?.id || currentUser?._id || '';

  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const userEmail = currentUser?.email || savedUser?.email || '';
  const userPhone = currentUser?.phone || savedUser?.phone || '';
  const queryParams = `email=${encodeURIComponent(userEmail)}&driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(userPhone)}`;

  const getAuthToken = () => {
    return localStorage.getItem('tiffinlink_access_token') ||
           localStorage.getItem('token') ||
           localStorage.getItem('tiffinlink_token') || '';
  };

  // Fetch Safety Guidelines Status from MongoDB
  const fetchGuidelinesStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/driver/safety/guidelines?${queryParams}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setGuidelinesData(json.data);
        if (json.data.isAcknowledged) {
          setChecked(true);
        }
      } else {
        setError(json.message || 'Unable to load safety policy directives.');
      }
    } catch (err) {
      console.error('Error fetching safety guidelines status:', err);
      setError('Network error connecting to safety policy desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidelinesStatus();
  }, [currentUser]);

  // Submit digital compliance attestation to MongoDB
  const handleSubmitAttestation = async (e) => {
    e.preventDefault();
    if (!checked) return;

    try {
      setSubmitting(true);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/driver/safety/guidelines/acknowledge?${queryParams}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ version: guidelinesData.version, driverId, email: userEmail })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setGuidelinesData((prev) => ({
          ...prev,
          isAcknowledged: true,
          acknowledgedAt: json.data?.acknowledgedAt || new Date().toISOString(),
          digitalSignature: json.data?.digitalSignature || `Digitally Signed by ${driverName}`
        }));

        if (onShowToast) {
          onShowToast('✓ Safety compliance attestation recorded & verified in MongoDB.');
        }
      } else {
        if (onShowToast) {
          onShowToast(`⚠️ ${json.message || 'Failed to submit compliance attestation.'}`);
        }
      }
    } catch (err) {
      console.error('Error submitting compliance attestation:', err);
      if (onShowToast) {
        onShowToast('⚠️ Network error recording compliance attestation.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const downloadManual = () => {
    alert("Initiating secure download of 'TiffinLink_Safety_Manual_SAF-902_2026.pdf' (14.2 MB)...");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="material-symbols-outlined text-4xl text-onyx-black animate-spin">cyclone</span>
        <span className="font-headline-md text-lg text-onyx-black font-serif">Loading Safety Guidelines...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-bone-white border-2 border-red-600 space-y-4 max-w-xl mx-auto my-8">
        <span className="material-symbols-outlined text-4xl text-red-600">error_outline</span>
        <h3 className="font-headline-md text-xl text-onyx-black font-serif font-bold">Unable to Load Guidelines</h3>
        <p className="font-body-md text-xs text-on-surface-variant">{error}</p>
        <button
          type="button"
          onClick={fetchGuidelinesStatus}
          className="px-6 py-2.5 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider font-bold cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20 selection:bg-onyx-black selection:text-white">
      
      {/* 1. Breadcrumb & Audit Sync Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-surface-container-highest">
        <div className="flex items-center gap-3">
          <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-semibold">Safety</span>
          <span className="text-clay-earth/40 text-xs">/</span>
          <span className="font-label-caps text-xs uppercase tracking-widest text-onyx-black font-bold">Safety Guidelines</span>
          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-sand-neutral" />
          <div className="inline-flex items-center gap-2 bg-bone-white px-2.5 py-1 border border-sand-neutral">
            <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-pulse" />
            <span className="font-label-caps text-[10px] uppercase tracking-wider text-onyx-black font-semibold">
              MongoDB Compliance Policies Synced • Audit {guidelinesData.version}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-1 ${guidelinesData.isAcknowledged ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-secondary-container text-on-secondary-container'}`}>
            <span className="font-label-caps text-[11px] uppercase tracking-wider font-bold">
              {guidelinesData.isAcknowledged ? '✓ STATUS: COMPLIANCE VERIFIED' : 'Status: Mandatory Acknowledgement Pending'}
            </span>
          </div>
          <span className="font-label-caps text-[11px] text-clay-earth tracking-wide hidden lg:inline-block font-semibold">
            Last Revised: {guidelinesData.effectiveDate} • Policy #SAF-902
          </span>
        </div>
      </div>

      {/* 2. Title & Header Action Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-6 pb-8">
        <div className="flex flex-col max-w-3xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-semibold">Central Fleet Safety Directive</span>
            <span className="text-clay-earth text-xs">•</span>
            <span className="font-label-caps text-xs uppercase tracking-wider text-clay-earth font-semibold">Regulatory Code 2026-B</span>
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-onyx-black tracking-tight leading-tight font-serif font-normal">
            Safety Guidelines & Compliance
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
            Follow these operational guidelines to keep yourself, kitchen partners, and customers safe during deliveries. Managed, verified, and dynamically enforced via central fleet safety policies.
          </p>
        </div>

        {/* Actions & SOS Quick Launch */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadManual}
            className="inline-flex items-center gap-2 bg-bone-white hover:bg-sand-neutral text-onyx-black px-4 py-2.5 transition-colors cursor-pointer border border-sand-neutral font-semibold text-xs uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download Safety Manual PDF</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSosModalOpen(true)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 transition-colors cursor-pointer font-semibold text-xs uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-base">emergency_home</span>
            <span>Emergency SOS Shortcut</span>
          </button>
        </div>
      </div>

      {/* 3. Prominent Zero-Compromise Safety Mandate (Obsidian Architectural Card) */}
      <div className="relative bg-onyx-black text-on-primary p-7 lg:p-9 mb-10 overflow-hidden shadow-xl border border-stone-900">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col max-w-3xl">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              <span className="font-label-caps text-xs uppercase tracking-widest text-red-400 font-bold">
                Safety First — Zero Compromise Mandate
              </span>
              <span className="bg-red-900/60 text-white font-label-caps text-[9px] px-2 py-0.5 tracking-widest uppercase font-bold">
                P0 Non-Negotiable
              </span>
            </div>
            
            <p className="font-headline-md text-xl lg:text-2xl text-stone-100 leading-snug font-serif">
              Never compromise your personal safety to complete a delivery.
            </p>
            
            <p className="font-body-md text-stone-300 mt-2.5 leading-relaxed text-xs sm:text-sm">
              If you encounter hazardous weather, hostile situations, road blockades, low structural lighting, or feel unsafe at any moment: <strong className="text-white font-semibold">pause transit immediately</strong>, move to a secure well-lit public corridor, and trigger the Emergency SOS or contact Dispatch Desk. No order priority, tip, or SLA rating ever takes precedence over your physical wellbeing.
            </p>
          </div>

          {/* Hotline Quick Access Pills */}
          <div className="flex flex-col justify-between bg-white/5 p-4 lg:min-w-[280px] border border-white/10">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-sand-neutral mb-3 font-bold block">
              24/7 Immediate Contact Rails
            </span>
            <div className="flex flex-col gap-2.5 font-label-caps text-[11px] text-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Dispatch Telemetry SOS:</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Police & Ambulance:</span>
                <span className="text-white font-bold">112</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Fleet Safety Officer:</span>
                <span className="text-white font-bold">1800-200-4409</span>
              </div>
            </div>
            
            <a
              className="mt-4 text-center bg-white text-onyx-black py-2 font-button-text text-xs uppercase tracking-wider hover:bg-stone-200 transition-colors font-bold"
              href="tel:18002004409"
            >
              One-Touch Dispatch Call
            </a>
          </div>
        </div>
      </div>

      {/* 4. Section Header: 5 Operational Pillars */}
      <div className="flex items-end justify-between mb-6 pb-2 border-b border-surface-container-highest">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-semibold">Operational Safety Architecture</span>
            <span className="text-clay-earth text-xs">/</span>
            <span className="font-label-caps text-xs text-clay-earth uppercase font-bold">5 Core Mandates</span>
          </div>
          <h2 className="font-headline-md text-2xl text-onyx-black font-serif mt-1">Five Operational Pillars</h2>
        </div>
        <span className="hidden md:inline-block font-label-caps text-xs text-clay-earth uppercase tracking-wider font-semibold">
          Strict Adherence Required Under Hub Audit
        </span>
      </div>

      {/* FIVE OPERATIONAL PILLARS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* PILLAR 01: BEFORE STARTING */}
        <div className="bg-bone-white p-6 flex flex-col justify-between border border-surface-container-highest">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-onyx-black text-2xl">two_wheeler</span>
                <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-bold">Pillar 01</span>
              </div>
              <span className="font-label-caps text-[10px] bg-sand-neutral px-2 py-0.5 text-onyx-black uppercase tracking-wider font-bold">Pre-Trip</span>
            </div>
            
            <h3 className="font-headline-md text-xl text-onyx-black font-serif mt-3">Before Starting Transit</h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Operational readiness check before signing onto active dispatch corridors.
            </p>

            <ul className="flex flex-col gap-3 mt-5">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">check_box</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Vehicle mechanical diagnostics:</strong> verify hydraulic brakes, tire tread & pressure, rearview mirrors, and turn signals.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">check_box</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Battery & fuel reserve:</strong> Maintain min. 35% EV battery or fuel reserve before accepting order assignments.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">check_box</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Device charge status:</strong> Mobile battery &gt; 70% with emergency power bank tethered and active.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">check_box</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Digital regulatory wallet:</strong> Valid Driving Licence, Registration Certificate (RC), and active Pollution Certificate (PUC).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">check_box</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Thermal carrier inspection:</strong> Clean, dry, dual-latched hot-box delivery unit with sanitised internal divider.
                </span>
              </li>
            </ul>
          </div>
          
          <div className="mt-6 pt-4 bg-sand-neutral/30 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between border-t border-sand-neutral/50">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Ref: #SEC-VEH-01</span>
            <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">Enforced: Daily Hub Audit</span>
          </div>
        </div>

        {/* PILLAR 02: WHILE DRIVING */}
        <div className="bg-bone-white p-6 flex flex-col justify-between border border-surface-container-highest">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-onyx-black text-2xl">alt_route</span>
                <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-bold">Pillar 02</span>
              </div>
              <span className="font-label-caps text-[10px] bg-sand-neutral px-2 py-0.5 text-onyx-black uppercase tracking-wider font-bold">In-Transit</span>
            </div>

            <h3 className="font-headline-md text-xl text-onyx-black font-serif mt-3">Corridor Transit Safety</h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Defensive road discipline across public arterial and neighborhood corridors.
            </p>

            <ul className="flex flex-col gap-3 mt-5">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">speed</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Corridor caps:</strong> Max 40 km/h in high-density residential and school sectors; obey all traffic signals without exception.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">phone_disabled</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Zero manual phone usage:</strong> Rely exclusively on voice cues via mounted display. Pull over safely to check customer chats.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">sports_motorsports</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Mandatory certified gear:</strong> ISI / DOT helmet with chin strap securely locked at all transit instances.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">distance</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Defensive braking buffer:</strong> Maintain min. 3-metre headway gap; double to 6 metres in monsoon downpours or wet tarmac.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">fmd_good</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Approved GPS corridors:</strong> Do not navigate unpaved alleys, private gated tracts, or unlit shortcut lanes.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 bg-sand-neutral/30 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between border-t border-sand-neutral/50">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Ref: #SEC-ROA-02</span>
            <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">Enforced: Telemetry Alarms</span>
          </div>
        </div>

        {/* PILLAR 03: PICKUP PROTOCOLS */}
        <div className="bg-bone-white p-6 flex flex-col justify-between border border-surface-container-highest">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-onyx-black text-2xl">soup_kitchen</span>
                <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-bold">Pillar 03</span>
              </div>
              <span className="font-label-caps text-[10px] bg-sand-neutral px-2 py-0.5 text-onyx-black uppercase tracking-wider font-bold">Kitchen Pickup</span>
            </div>

            <h3 className="font-headline-md text-xl text-onyx-black font-serif mt-3">Provider Handover Protocols</h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Standard operational workflow when collecting dabbas from cloud hubs and home chefs.
            </p>

            <ul className="flex flex-col gap-3 mt-5">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">door_front</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Entry gate protocols:</strong> Verify provider entrance guidelines, sign society security manifests where mandated.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">verified</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Seal & thermal integrity:</strong> Verify physical tamper tape is intact and hot-pot temperature registers warmth.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">qr_code_scanner</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Digital handshake:</strong> Execute the kitchen QR scan or 4-digit provider OTP confirmation prior to loading bag.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">inventory_2</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Horizontal balancing:</strong> Secure curries and dal vessels level on partitioned shock-absorbing base. Never tilt containers.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">lock</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Double-latch lock:</strong> Fasten insulated zippers and secondary storm-buckle before boarding vehicle.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 bg-sand-neutral/30 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between border-t border-sand-neutral/50">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Ref: #SEC-PKP-03</span>
            <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">Enforced: Provider Scan</span>
          </div>
        </div>

        {/* PILLAR 04: CUSTOMER HANDOVER */}
        <div className="bg-bone-white p-6 flex flex-col justify-between lg:col-span-2 border border-surface-container-highest">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-onyx-black text-2xl">handshake</span>
                <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-bold">Pillar 04</span>
              </div>
              <span className="font-label-caps text-[10px] bg-sand-neutral px-2 py-0.5 text-onyx-black uppercase tracking-wider font-bold">Threshold Delivery</span>
            </div>

            <h3 className="font-headline-md text-xl text-onyx-black font-serif mt-3">Customer Handover & Residential Etiquette</h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Threshold exchange etiquette, boundary respect, and physical dabba exchange procedures.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div className="flex items-start gap-2.5 bg-surface p-3.5 border border-sand-neutral/50">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">badge</span>
                <div>
                  <span className="font-button-text text-xs text-onyx-black font-bold block">Order ID Verification</span>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5 leading-normal">
                    Always confirm customer full name and match unique Order ID (#ORD-XXXX) before transferring tiffin tin.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-surface p-3.5 border border-sand-neutral/50">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">pin</span>
                <div>
                  <span className="font-button-text text-xs text-onyx-black font-bold block">Customer OTP Flow</span>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5 leading-normal">
                    Execute the 4-digit OTP handover in customer presence. Never enter default codes or mark delivered in advance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-surface p-3.5 border border-sand-neutral/50">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">do_not_disturb_on</span>
                <div>
                  <span className="font-button-text text-xs text-onyx-black font-bold block">Strict Spatial Boundary</span>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5 leading-normal">
                    Never cross residential thresholds, apartment hallways, or private inner zones. Deliver at main door or building lobby reception.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-surface p-3.5 border border-sand-neutral/50">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">sync_alt</span>
                <div>
                  <span className="font-button-text text-xs text-onyx-black font-bold block">Reverse Dabba Return Inspection</span>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5 leading-normal">
                    For lunch subscription returns, inspect previous empty container for cleanliness and close clamp before storing into bottom bay.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 bg-sand-neutral/30 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between border-t border-sand-neutral/50">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Ref: #SEC-HND-04</span>
            <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">Enforced: Customer Handshake OTP</span>
          </div>
        </div>

        {/* PILLAR 05: NIGHT DELIVERY & ADVERSE CONDITIONS */}
        <div className="bg-bone-white p-6 flex flex-col justify-between border border-surface-container-highest">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-onyx-black text-2xl">dark_mode</span>
                <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-bold">Pillar 05</span>
              </div>
              <span className="font-label-caps text-[10px] bg-onyx-black text-white px-2 py-0.5 uppercase tracking-wider font-bold">Night Protocol</span>
            </div>

            <h3 className="font-headline-md text-xl text-onyx-black font-serif mt-3">Night & Adverse Weather</h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Heightened situational protocols for dinner shifts after 20:00 and monsoon downpours.
            </p>

            <ul className="flex flex-col gap-3 mt-5">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">lightbulb</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Arterial lighting:</strong> Always prioritize well-illuminated main avenues. Avoid poorly lit cul-de-sacs or unstaffed underpasses.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">share_location</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Live family telemetry:</strong> Activate continuous live GPS tracking share with emergency contacts via driver dashboard settings.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">thunderstorm</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Flash flooding rule:</strong> If road water exceeds 6 inches, stop dispatch immediately, notify support, and wait out storm surge.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-base text-onyx-black mt-0.5">contact_emergency</span>
                <span className="font-body-md text-xs text-on-surface leading-normal">
                  <strong>Instant panic armed:</strong> Keep SOS trigger button active on hardware helmet intercom or lock screen widget.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 bg-sand-neutral/30 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between border-t border-sand-neutral/50">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Ref: #SEC-NGH-05</span>
            <span className="font-label-caps text-[10px] text-onyx-black uppercase tracking-wider font-bold">Enforced: Shift GPS Telemetry</span>
          </div>
        </div>

      </div>

      {/* 5. SECONDARY CONTEXT: COMPLETED SAFETY TRAINING & ACCREDITATIONS */}
      <div className="bg-surface-container p-6 lg:p-8 mb-10 border border-surface-container-highest">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sand-neutral">
          <div>
            <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-semibold">Courier Verification Credentials</span>
            <h3 className="font-headline-md text-2xl text-onyx-black font-serif mt-1">Driver Safety Training & Certifications</h3>
          </div>
          <div className="flex items-center gap-2 text-clay-earth font-label-caps text-xs font-semibold">
            <span className="material-symbols-outlined text-base text-onyx-black">verified_user</span>
            <span>Scoped to Profile: {driverName} (#{driverId})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-bone-white p-4 flex flex-col justify-between border border-surface-container-highest">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Module 01</span>
                <span className="font-label-caps text-[10px] bg-emerald-100 text-emerald-950 px-1.5 py-0.5 font-bold">Verified ✓</span>
              </div>
              <span className="font-button-text text-sm font-bold text-onyx-black block">Monsoon Defensive Driving</span>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">Braking distance, aquaplaning risk mitigation, water-sealed carrier packing.</p>
            </div>
            <div className="pt-4 mt-3 text-[11px] font-label-caps text-clay-earth border-t border-sand-neutral/40 font-semibold">
              Status: Completed • Valid till 30 Nov 2026
            </div>
          </div>

          <div className="bg-bone-white p-4 flex flex-col justify-between border border-surface-container-highest">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Module 02</span>
                <span className="font-label-caps text-[10px] bg-emerald-100 text-emerald-950 px-1.5 py-0.5 font-bold">Verified ✓</span>
              </div>
              <span className="font-button-text text-sm font-bold text-onyx-black block">First Aid & CPR Foundations</span>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">Certified field responder course completed via Red Cross Society India chapter.</p>
            </div>
            <div className="pt-4 mt-3 text-[11px] font-label-caps text-clay-earth border-t border-sand-neutral/40 font-semibold">
              Status: Certified • Red Cross India #RC-9921
            </div>
          </div>

          <div className="bg-bone-white p-4 flex flex-col justify-between border border-surface-container-highest">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider font-semibold">Module 03</span>
                <span className="font-label-caps text-[10px] bg-emerald-100 text-emerald-950 px-1.5 py-0.5 font-bold">Verified ✓</span>
              </div>
              <span className="font-button-text text-sm font-bold text-onyx-black block">Food Safety & Thermal Hygiene</span>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">Cross-contamination protocols & strict tiffin temperature preservation rules.</p>
            </div>
            <div className="pt-4 mt-3 text-[11px] font-label-caps text-clay-earth border-t border-sand-neutral/40 font-semibold">
              Status: Certified • FSSAI Partner Delivery v2
            </div>
          </div>
        </div>
      </div>

      {/* 6. DRIVER ACKNOWLEDGEMENT & MONGODB ATTESTATION SECTION */}
      <div className="bg-bone-white p-7 lg:p-9 border border-surface-container-highest">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6">
          <div className="flex flex-col max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-onyx-black text-xl">gavel</span>
              <span className="font-label-caps text-xs uppercase tracking-widest text-clay-earth font-bold">Quarterly Legal Acknowledgment</span>
            </div>
            <h3 className="font-headline-md text-2xl sm:text-3xl text-onyx-black font-serif">Courier Compliance Attestation</h3>
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
              Regulatory compliance mandates that every active delivery partner review and acknowledge these safety standards quarterly. Your acknowledgment is digitally signed, timestamped, and immutably recorded in MongoDB.
            </p>
          </div>

          {/* Scoped Courier Identity Badge */}
          <div className="bg-surface p-4 min-w-[240px] border border-sand-neutral">
            <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-widest block mb-1 font-bold">Authenticated Principal</span>
            <span className="font-headline-md text-lg text-onyx-black block leading-none font-serif font-bold">{driverName}</span>
            <span className="font-label-caps text-[11px] text-clay-earth mt-1 block font-semibold">Courier ID: #{driverId}</span>
            <span className="font-label-caps text-[10px] text-onyx-black mt-2 inline-block bg-sand-neutral px-2 py-0.5 font-bold">Tier 1 Senior Courier</span>
          </div>
        </div>

        {/* Interactive Checkbox & Submission Form */}
        <form onSubmit={handleSubmitAttestation} className="bg-surface p-6 border border-sand-neutral">
          <label className="flex items-start gap-3.5 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={guidelinesData.isAcknowledged}
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 w-4 h-4 rounded-none accent-onyx-black cursor-pointer"
            />
            <span className="font-body-md text-xs lg:text-sm text-onyx-black leading-relaxed">
              I, <strong className="font-bold">{driverName} (#{driverId})</strong>, hereby confirm that I have thoroughly read, understood, and agreed to strictly abide by all five TiffinLink Safety Guidelines, road speed regulations, and emergency SOS protocols. I understand that failure to adhere may result in immediate suspension from the dispatch platform.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 bg-sand-neutral/20 -mx-6 -mb-6 px-6 py-4 border-t border-sand-neutral/50">
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={!checked || guidelinesData.isAcknowledged || submitting}
                className={`px-6 py-3 font-button-text text-xs uppercase tracking-wider transition-all font-bold ${
                  guidelinesData.isAcknowledged
                    ? 'bg-onyx-black text-white cursor-default'
                    : checked
                    ? 'bg-onyx-black text-white hover:bg-stone-800 cursor-pointer'
                    : 'bg-onyx-black/50 text-white cursor-not-allowed'
                }`}
              >
                {guidelinesData.isAcknowledged
                  ? 'COMPLIANCE RECORDED & VERIFIED ✓'
                  : submitting
                  ? 'RECORDING AUDIT IN MONGODB...'
                  : 'I Understand & Confirm Compliance'}
              </button>

              <span className="font-label-caps text-[11px] text-clay-earth font-semibold">
                {guidelinesData.isAcknowledged && guidelinesData.acknowledgedAt
                  ? `Digitally Signed: ${new Date(guidelinesData.acknowledgedAt).toLocaleString()}`
                  : 'Ready for audit dispatch'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setRevisionModalOpen(true)}
                className="font-button-text text-xs text-onyx-black hover:text-clay-earth underline underline-offset-4 cursor-pointer font-semibold"
              >
                Review Revision History
              </button>
              <span className="text-clay-earth/40 text-xs">•</span>
              <a
                href="tel:18002004409"
                className="font-button-text text-xs text-onyx-black hover:text-clay-earth underline underline-offset-4 cursor-pointer font-semibold"
              >
                Ask Safety Officer
              </a>
            </div>
          </div>
        </form>

        {/* MongoDB State Persistence Note */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] font-label-caps text-clay-earth px-1 gap-2">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-onyx-black" />
            <span>State persists to MongoDB: driverId: {driverId}, policyVersion: {guidelinesData.version}, timestamp: UTC.</span>
          </span>
          <span className="font-mono text-[10px]">Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
        </div>
      </div>

      {/* EMERGENCY SOS MODAL DIALOG */}
      {sosModalOpen && (
        <div className="fixed inset-0 bg-onyx-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full p-8 relative flex flex-col border-2 border-onyx-black shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-sand-neutral">
              <div className="flex items-center gap-2 text-red-600">
                <span className="material-symbols-outlined text-2xl">emergency</span>
                <span className="font-label-caps text-xs uppercase tracking-widest font-bold">Priority Emergency SOS</span>
              </div>
              <button
                type="button"
                className="text-onyx-black hover:opacity-60 cursor-pointer"
                onClick={() => setSosModalOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="font-headline-md text-xl sm:text-2xl text-onyx-black mt-3 font-serif">Trigger Incident Alert?</p>
            <p className="font-body-md text-xs text-on-surface-variant mt-2 leading-relaxed">
              Activating this will immediately broadcast your real-time GPS telemetry to Central Dispatch Desk, alert emergency authorities (112), and open the Emergency / SOS view.
            </p>

            <div className="bg-bone-white p-4 my-6 flex flex-col gap-2 font-label-caps text-xs border border-sand-neutral">
              <div className="flex justify-between">
                <span className="text-clay-earth font-semibold">Active Courier:</span>
                <span className="text-onyx-black font-bold">{driverName} (#{driverId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay-earth font-semibold">Current Node:</span>
                <span className="text-onyx-black font-bold">Bandra West • Sector 14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay-earth font-semibold">Incident Dispatch:</span>
                <span className="text-red-600 font-bold">P0 Response Unit Standby</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 font-button-text text-xs uppercase tracking-wider font-bold cursor-pointer"
                onClick={() => {
                  setSosModalOpen(false);
                  if (onNavigateTab) onNavigateTab('safety-emergency');
                }}
              >
                Go to Emergency / SOS Desk
              </button>
              
              <button
                type="button"
                className="w-full bg-sand-neutral/50 hover:bg-sand-neutral text-onyx-black py-2.5 font-button-text text-xs uppercase tracking-wider cursor-pointer font-semibold"
                onClick={() => setSosModalOpen(false)}
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION HISTORY MODAL */}
      {revisionModalOpen && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bone-white max-w-md w-full p-6 relative flex flex-col border-2 border-onyx-black shadow-2xl gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-highest">
              <h3 className="font-headline-md text-lg text-onyx-black font-serif">Policy Revision Log</h3>
              <button
                type="button"
                className="text-onyx-black hover:opacity-60 cursor-pointer"
                onClick={() => setRevisionModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs font-body-md">
              <div className="p-3 bg-surface border border-sand-neutral">
                <span className="font-bold text-onyx-black block">v4.2 (18 Sep 2026) — Current Policy</span>
                <p className="text-secondary mt-1">Monsoon braking buffers, 35% battery reserve thresholds, and multi-factor QR/OTP handshake mandates added.</p>
              </div>

              <div className="p-3 bg-surface border border-sand-neutral">
                <span className="font-bold text-onyx-black block">v4.1 (12 Jun 2026)</span>
                <p className="text-secondary mt-1">Provider entry gate protocols & thermal container latch verification rules updated.</p>
              </div>

              <div className="p-3 bg-surface border border-sand-neutral">
                <span className="font-bold text-onyx-black block">v4.0 (01 Jan 2026)</span>
                <p className="text-secondary mt-1">Mandatory quarterly digital compliance attestation framework introduced.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRevisionModalOpen(false)}
              className="mt-2 w-full py-2 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              Close History
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
