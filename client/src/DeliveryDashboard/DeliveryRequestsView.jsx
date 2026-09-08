import React, { useState, useEffect } from 'react';

/**
 * DeliveryRequestsView Component
 * Exact UI Layout, Design, and Interactivity matching the TiffinLink Delivery Requests Matrix specification.
 */
export default function DeliveryRequestsView({ onAcceptDelivery, onNavigateTab }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [soundActive, setSoundActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [acceptedOrderTitle, setAcceptedOrderTitle] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Initial Requests Feed State with Live Countdown Timers
  const [requests, setRequests] = useState([
    {
      id: 'req-card-4091',
      orderRef: '#TL-REQ-4091',
      type: 'instant',
      isUrgent: true,
      readyTime: 'Ready in 5m',
      distance: '4.2 km total',
      estTime: 'Est. 22 mins',
      payout: 165,
      surgeBonus: '+₹30 Surge Bonus',
      pickupName: 'The Malabar Chronicle',
      pickupAddress: 'Shop 4, Hill Road, Bandra West',
      pickupBay: 'Tiffin Dispatch Bay 2',
      dropName: 'Marcus Reed',
      dropAddress: 'Flat 602, Sea Pearl Apt, 14th Road, Khar West',
      dropWindow: 'Window: 1:15 PM – 1:30 PM',
      items: '2x Signature Kerala Tiffin Box',
      ecoReturn: true,
      secondsLeft: 45
    },
    {
      id: 'req-card-4095',
      orderRef: '#TL-REQ-4095',
      type: 'subscription',
      isScheduled: true,
      readyTime: 'Ready for pickup',
      distance: '5.8 km total',
      estTime: 'Est. 28 mins',
      payout: 190,
      surgeBonus: 'Standard Transit Rate',
      pickupName: 'Spice Route Kitchen',
      pickupAddress: 'Pali Naka, Pali Hill, Bandra',
      pickupBay: 'Pickup verified by chef',
      dropName: 'Dr. Sarah Jenkins',
      dropAddress: 'Lilavati Quarters, Gate 3, Bandra Reclamation',
      dropWindow: 'Medical Faculty Priority',
      items: '1x Diabetic Care Lunch Tiffin',
      ecoReturn: false,
      secondsLeft: 80
    },
    {
      id: 'req-card-4088',
      orderRef: '#TL-REQ-4088',
      type: 'instant',
      isCorporate: true,
      readyTime: 'Ready in 2 mins',
      distance: '3.1 km total',
      estTime: 'Est. 16 mins',
      payout: 135,
      surgeBonus: 'Short Hop Transit',
      pickupName: 'Green Leaf Organic Kitchen',
      pickupAddress: 'Prabhat Colony, Santacruz East',
      pickupBay: 'Order Packed',
      dropName: 'Tech Park Tower B',
      dropAddress: 'Main Reception Desk, Kalpataru Point',
      dropWindow: 'Front Desk Dropoff',
      items: '3x Executive Millet Thali',
      ecoReturn: false,
      secondsLeft: 130
    }
  ]);

  // Live Timer Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests((prevRequests) =>
        prevRequests
          .map((req) => ({
            ...req,
            secondsLeft: Math.max(0, req.secondsLeft - 1)
          }))
          .filter((req) => req.secondsLeft > 0)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDecline = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('Request declined');
  };

  const handleAccept = (req) => {
    setAcceptedOrderTitle(req.orderRef);
    setShowModal(true);
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    if (onAcceptDelivery) {
      onAcceptDelivery({
        id: req.orderRef,
        orderId: req.orderRef,
        customerName: req.dropName,
        customerAddress: req.dropAddress,
        pickupAddress: req.pickupAddress,
        deliveryFee: req.payout
      });
    }
  };

  const formatSeconds = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}s remaining`;
  };

  // Filter requests based on tab selection
  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'instant') return r.type === 'instant';
    if (activeFilter === 'subscription') return r.type === 'subscription';
    if (activeFilter === 'incentive') return r.surgeBonus.includes('+₹30') || r.surgeBonus.includes('+₹40');
    return true;
  });

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface antialiased bg-surface selection:bg-onyx-black selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-onyx-black text-on-primary text-xs font-medium px-4 py-3 shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Live Broadcast Signal */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-sand-neutral">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-onyx-black animate-ping" />
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest text-[11px]">
              Active Dispatch Matrix
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight font-serif text-3xl sm:text-4xl">
            Delivery Requests
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm sm:text-base">
            3 available delivery requests nearby. Accept within the allocated countdown to reserve your route and lock guaranteed partner surges.
          </p>
        </div>

        {/* Live Fleet Stats pill summary */}
        <div className="flex items-center gap-4 bg-bone-white p-3 border border-sand-neutral self-start lg:self-auto">
          <div className="px-3 border-r border-sand-neutral">
            <span className="font-label-caps text-label-caps text-secondary uppercase block text-[10px]">Current Zone</span>
            <span className="font-button-text text-button-text text-onyx-black font-semibold text-xs sm:text-sm">Bandra-Khar West</span>
          </div>
          <div className="px-3">
            <span className="font-label-caps text-label-caps text-secondary uppercase block text-[10px]">Demand Pulse</span>
            <span className="font-button-text text-button-text text-onyx-black font-semibold flex items-center gap-1 text-xs sm:text-sm">
              <span className="material-symbols-outlined text-[16px] text-onyx-black">trending_up</span> High (+₹30 avg)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Strip & Quick Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex flex-wrap items-center gap-2" id="filter-container">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 font-label-caps text-label-caps uppercase transition-all cursor-pointer text-xs font-semibold ${
              activeFilter === 'all'
                ? 'bg-onyx-black text-on-primary'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setActiveFilter('instant')}
            className={`px-4 py-2 font-label-caps text-label-caps uppercase transition-all cursor-pointer text-xs font-semibold ${
              activeFilter === 'instant'
                ? 'bg-onyx-black text-on-primary'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            Instant Delivery ({requests.filter(r => r.type === 'instant').length})
          </button>
          <button
            onClick={() => setActiveFilter('subscription')}
            className={`px-4 py-2 font-label-caps text-label-caps uppercase transition-all cursor-pointer text-xs font-semibold ${
              activeFilter === 'subscription'
                ? 'bg-onyx-black text-on-primary'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            Scheduled Subscription ({requests.filter(r => r.type === 'subscription').length})
          </button>
          <button
            onClick={() => setActiveFilter('incentive')}
            className={`px-4 py-2 font-label-caps text-label-caps uppercase transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 ${
              activeFilter === 'incentive'
                ? 'bg-onyx-black text-on-primary'
                : 'bg-bone-white text-secondary hover:text-onyx-black border border-sand-neutral'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span> High Incentive (+₹40)
          </button>
        </div>

        <div className="flex items-center gap-3 text-secondary">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-[11px]">Audio Radar</span>
          <button
            onClick={() => setSoundActive(!soundActive)}
            className={`w-8 h-8 flex items-center justify-center bg-bone-white border border-sand-neutral hover:bg-surface-container-high transition-colors cursor-pointer ${
              !soundActive ? 'opacity-50' : ''
            }`}
            title="Toggle Request Ping"
          >
            <span className="material-symbols-outlined text-[18px] text-onyx-black">
              {soundActive ? 'volume_up' : 'volume_off'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid Workspace (Requests Feed + Operational Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Request Cards Feed (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6" id="requests-wrapper">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`request-card relative bg-surface-container-lowest p-6 transition-all border ${
                req.isUrgent ? 'border-2 border-onyx-black hover:bg-bone-white/60' : 'border-sand-neutral hover:border-onyx-black'
              }`}
            >
              {/* Badge Banner Overlap */}
              {req.isUrgent && (
                <div className="absolute -top-3 left-6 bg-onyx-black text-on-primary px-3 py-0.5 font-label-caps text-[11px] uppercase tracking-widest flex items-center gap-1.5 font-semibold">
                  <span className="material-symbols-outlined text-[13px]">electric_bolt</span> Urgent Dispatch
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-2 pb-4 border-b border-sand-neutral">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest text-[11px]">Order Ref</span>
                    <span className="font-button-text text-button-text font-bold text-onyx-black">{req.orderRef}</span>
                    {req.isScheduled && (
                      <span className="px-2 py-0.5 bg-bone-white border border-sand-neutral font-label-caps text-[10px] uppercase text-secondary">
                        Scheduled Route
                      </span>
                    )}
                    {req.isCorporate && (
                      <span className="px-2 py-0.5 bg-bone-white border border-sand-neutral font-label-caps text-[10px] uppercase text-secondary">
                        Corporate Pack
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-secondary text-xs sm:text-sm">
                    <span className="font-body-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span> {req.readyTime}
                    </span>
                    <span className="text-sand-neutral">/</span>
                    <span className="font-body-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">navigation</span> {req.distance}
                    </span>
                    <span className="text-sand-neutral">/</span>
                    <span className="font-body-md">{req.estTime}</span>
                  </div>
                </div>

                {/* Payout Block */}
                <div className="sm:text-right">
                  <div className="flex items-baseline sm:justify-end gap-1.5">
                    <span className="font-headline-md text-headline-md text-onyx-black font-serif text-3xl font-bold">₹{req.payout}</span>
                    <span className="font-label-caps text-[11px] text-secondary uppercase">Guaranteed</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-label-caps text-[10px] uppercase font-semibold">
                    {req.surgeBonus}
                  </span>
                </div>
              </div>

              {/* Waypoint Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                {/* Pickup */}
                <div className="p-4 bg-bone-white border border-sand-neutral relative">
                  <span className="absolute top-3 right-3 font-label-caps text-[10px] text-secondary uppercase tracking-wider">Stop 1</span>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-onyx-black mt-0.5 text-[20px]">storefront</span>
                    <div>
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block">Pickup Kitchen</span>
                      <span className="font-headline-md text-lg text-onyx-black font-serif block font-bold">{req.pickupName}</span>
                      <p className="font-body-md text-sm text-on-surface-variant mt-0.5">{req.pickupAddress}</p>
                      <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-label-caps text-secondary bg-surface-container-lowest px-2 py-0.5 border border-sand-neutral">
                        <span className="material-symbols-outlined text-[14px]">soup_kitchen</span> {req.pickupBay}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dropoff */}
                <div className="p-4 bg-bone-white border border-sand-neutral relative">
                  <span className="absolute top-3 right-3 font-label-caps text-[10px] text-secondary uppercase tracking-wider">Stop 2</span>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-onyx-black mt-0.5 text-[20px]">location_on</span>
                    <div>
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-wider block">Drop Destination</span>
                      <span className="font-headline-md text-lg text-onyx-black font-serif block font-bold">{req.dropName}</span>
                      <p className="font-body-md text-sm text-on-surface-variant mt-0.5">{req.dropAddress}</p>
                      <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-label-caps text-onyx-black bg-surface-container-lowest px-2 py-0.5 border border-onyx-black font-semibold">
                        <span className="material-symbols-outlined text-[14px]">alarm</span> {req.dropWindow}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meal Inventory & Mandatory Directives */}
              <div className="p-3 bg-surface-container-low border border-sand-neutral flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">lunch_dining</span>
                  <span className="font-body-md text-on-surface font-medium">{req.items}</span>
                </div>
                {req.ecoReturn && (
                  <div className="flex items-center gap-1.5 text-secondary font-label-caps text-[11px] uppercase">
                    <span className="material-symbols-outlined text-[16px] text-onyx-black">autorenew</span>
                    <span>Eco-Tiffin Return Required (Pickup Empty Cask)</span>
                  </div>
                )}
              </div>

              {/* Timer & Decision Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-sand-neutral">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" fill="none" r="13" stroke="#ded9d1" strokeWidth="2.5" />
                      <circle
                        className="transition-all duration-1000 ease-linear"
                        cx="16"
                        cy="16"
                        fill="none"
                        r="13"
                        stroke="#1a1a1a"
                        strokeDasharray="81.68"
                        strokeDashoffset={(1 - req.secondsLeft / 120) * 81.68}
                        strokeWidth="2.5"
                      />
                    </svg>
                    <span className="material-symbols-outlined text-[14px] absolute text-onyx-black">hourglass_bottom</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-[10px] text-secondary uppercase block">Expiries in</span>
                    <span className="font-button-text text-sm font-bold text-onyx-black tracking-wider">
                      {formatSeconds(req.secondsLeft)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleDecline(req.id)}
                    className="w-1/2 sm:w-auto px-6 py-2.5 font-button-text text-button-text text-secondary hover:text-onyx-black transition-colors underline hover:no-underline cursor-pointer text-xs font-semibold"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(req)}
                    className="w-1/2 sm:w-auto px-8 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text tracking-wider uppercase transition-colors cursor-pointer text-xs font-bold"
                  >
                    Accept Request
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Zero State Placeholder */}
          {filteredRequests.length === 0 && (
            <div className="py-16 px-6 bg-surface-container-lowest border border-sand-neutral text-center flex flex-col items-center justify-center space-y-4">
              <span className="material-symbols-outlined text-secondary text-[48px]">radar</span>
              <h3 className="font-headline-md text-headline-md text-onyx-black font-serif text-2xl font-bold">Scanning For Requests</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-sm">
                You are positioned in a high-demand sector. New incoming tiffin dispatches will automatically populate here.
              </p>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text uppercase tracking-wider text-xs font-bold cursor-pointer"
              >
                Force Radar Check
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Strategic Sidebar / Operational Intel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Efficiency Route Optimizer Widget */}
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-[20px]">alt_route</span>
                <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider text-xs font-bold">
                  Route Intelligence
                </span>
              </div>
              <span className="px-2 py-0.5 bg-bone-white border border-sand-neutral font-label-caps text-[10px] text-secondary">
                AI Dispatch
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-headline-md text-lg text-onyx-black font-serif font-bold">Pairing Opportunity Identified</h4>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Accepting <strong className="text-onyx-black font-medium">#TL-REQ-4091</strong> pairs seamlessly with a scheduled return collection in Khar West, increasing your hourly run-rate by +34%.
              </p>
            </div>

            {/* Inline Visual Route Sparkline / Efficiency Map Pin */}
            <div className="p-3 bg-bone-white border border-sand-neutral space-y-2">
              <div className="flex justify-between font-label-caps text-[11px] text-secondary uppercase">
                <span>Route Optimization</span>
                <span className="text-onyx-black font-bold">92% Match</span>
              </div>
              <div className="w-full bg-sand-neutral h-1.5 overflow-hidden">
                <div className="bg-onyx-black h-full w-[92%]" />
              </div>
              <div className="flex items-center justify-between text-[12px] text-on-surface-variant pt-1">
                <span>Deadhead distance: 0.4 km</span>
                <span>Fuel save: ~18%</span>
              </div>
            </div>

            {/* Compact Zone Demand Graphic */}
            <div className="pt-2 border-t border-sand-neutral">
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest block mb-2 font-bold">
                Hourly Payout Index (Bandra Hub)
              </span>
              <div className="flex items-end gap-1.5 h-16 pt-2">
                <div className="flex-1 bg-surface-container-high h-[40%]" title="11:00 AM" />
                <div className="flex-1 bg-surface-container-high h-[65%]" title="12:00 PM" />
                <div className="flex-1 bg-onyx-black h-[100%]" title="01:00 PM (Current Peak)" />
                <div className="flex-1 bg-surface-container-high h-[80%]" title="02:00 PM" />
                <div className="flex-1 bg-surface-container-high h-[30%]" title="03:00 PM" />
              </div>
              <div className="flex justify-between text-[10px] font-label-caps text-secondary mt-1.5 uppercase">
                <span>11 AM</span>
                <span className="text-onyx-black font-bold">Peak Now</span>
                <span>3 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Setup: Auto-Accept Configuration */}
          <div className="bg-surface-container-lowest border border-sand-neutral p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-[20px]">tune</span>
                <span className="font-label-caps text-label-caps uppercase text-onyx-black tracking-wider text-xs font-bold">
                  Auto-Accept Rules
                </span>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('settings')}
                className="font-label-caps text-[11px] text-secondary hover:text-onyx-black underline cursor-pointer"
              >
                Configure
              </button>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant leading-normal">
              Automatically confirm rides matching your custom fuel &amp; radius criteria while on active transit.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-2.5 bg-bone-white border border-sand-neutral cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-button-text text-sm font-medium text-onyx-black">Min. Payout ≥ ₹150</span>
                  <span className="font-label-caps text-[10px] text-secondary uppercase">Skips sub-tier orders</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-onyx-black w-4 h-4 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-bone-white border border-sand-neutral cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-button-text text-sm font-medium text-onyx-black">Max Radius &lt; 5.0 km</span>
                  <span className="font-label-caps text-[10px] text-secondary uppercase">Short delivery perimeter</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-onyx-black w-4 h-4 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between p-2.5 bg-bone-white border border-sand-neutral cursor-pointer hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-button-text text-sm font-medium text-onyx-black">Only Eco-Tiffin Swaps</span>
                  <span className="font-label-caps text-[10px] text-secondary uppercase">+₹15 collection rebate</span>
                </div>
                <input type="checkbox" className="accent-onyx-black w-4 h-4 cursor-pointer" />
              </label>
            </div>

            <button
              onClick={() => showToast('✓ Auto-Accept automation preferences saved!')}
              className="w-full py-2.5 bg-surface-container-low border border-onyx-black hover:bg-onyx-black hover:text-on-primary font-button-text text-button-text text-onyx-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span> Save Automation Mode
            </button>
          </div>

          {/* Shift Snapshot Summary */}
          <div className="p-5 bg-bone-white border border-sand-neutral space-y-4">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block text-[11px] font-bold">
              Today's Milestone
            </span>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-headline-md text-2xl text-onyx-black font-serif font-bold">₹820</span>
                <span className="text-sm font-body-md text-secondary"> / ₹1,200 Target</span>
              </div>
              <span className="font-label-caps text-[11px] text-onyx-black font-bold uppercase">68% Achieved</span>
            </div>
            <div className="w-full bg-sand-neutral h-1">
              <div className="bg-onyx-black h-1 w-[68%]" />
            </div>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Complete 2 more deliveries during this lunch surge to unlock the <strong className="text-onyx-black">₹200 Peak Champion Bonus</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Acceptance Confirmation Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border-2 border-onyx-black p-8 max-w-md w-full space-y-6 animate-fade-in shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-onyx-black">
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-xs font-bold">Confirmed Dispatch</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-onyx-black font-serif text-2xl font-bold">
                Request Accepted ({acceptedOrderTitle})
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                Route locked into your active terminal. Navigation directions are ready.
              </p>
            </div>
            <div className="p-4 bg-bone-white border border-sand-neutral space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Expected Pickup:</span>
                <span className="font-medium text-onyx-black">Under 10 mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Customer Contact:</span>
                <span className="font-medium text-onyx-black">Encrypted via App</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  if (onNavigateTab) onNavigateTab('active-delivery');
                }}
                className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text uppercase tracking-wider text-xs font-bold cursor-pointer"
              >
                Proceed to Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
