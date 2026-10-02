import React, { useState, useEffect } from 'react';

const STEPS = [
  { icon: 'check_circle', label: 'Order Confirmed', sub: '5:00 PM', done: true },
  { icon: 'restaurant', label: 'Kitchen Preparing', sub: 'Rotli rolling in progress', done: true },
  { icon: 'pedal_bike', label: 'Out for Delivery', sub: 'Carrier is en route', done: true, active: true },
  { icon: 'home', label: 'Delivered', sub: 'Estimated 5:28 PM', done: false },
];

export default function LiveOrderTracking({ onNavigate }) {
  const [eta, setEta] = useState(18);
  const [pulsed, setPulsed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setEta(p => (p > 1 ? p - 1 : 0));
      setPulsed(true);
      setTimeout(() => setPulsed(false), 600);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen">
      {/* Banner */}
      <section className="w-full bg-[#1a1a1a] text-white py-3">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4caf50] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest">Live Order Tracking Active</span>
          </div>
          <div className="text-xs text-white/60 font-semibold uppercase hidden sm:block">Order #TL-4729 • Placed 5:00 PM</div>
          <button onClick={() => onNavigate && onNavigate('customer-home')} className="text-xs font-semibold text-white/60 hover:text-white transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_left_alt</span> Back
          </button>
        </div>
      </section>

      {/* Main */}
      <section className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Journey Map */}
        <div className="lg:col-span-7 space-y-8">
          {/* Kitchen to Door Map */}
          <div className="bg-white rounded-xl shadow-lg p-8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full opacity-5" viewBox="0 0 800 400" fill="none">
                <circle cx="100" cy="200" r="90" stroke="#1a1a1a" strokeWidth="60" opacity="0.5" />
                <circle cx="700" cy="200" r="90" stroke="#1a1a1a" strokeWidth="60" opacity="0.5" />
              </svg>
            </div>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#665d52] block">Route Visualization</span>
                <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a]">Kitchen → Your Door</h2>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] text-white transition-transform ${pulsed ? 'scale-110' : 'scale-100'}`}>
                <span className="w-2 h-2 rounded-full bg-[#4caf50] animate-ping"></span>
                <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-semibold">{eta}</span>
                <span className="text-xs font-bold uppercase text-white/70">min</span>
              </div>
            </div>
            {/* Route SVG */}
            <div className="relative w-full h-48 bg-[#f5f3ef] rounded-lg overflow-hidden">
              <svg viewBox="0 0 800 190" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Dashed road */}
                <path d="M80 95 C 200 30, 400 160, 720 95" stroke="#ded9d1" strokeWidth="3" fill="none" strokeDasharray="8 6" />
                {/* Solid progress */}
                <path d="M80 95 C 200 30, 400 160, 560 118" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" />
                {/* Kitchen */}
                <circle cx="80" cy="95" r="18" fill="#f5f3ef" stroke="#1a1a1a" strokeWidth="2" />
                <text x="80" y="100" textAnchor="middle" fontSize="16">🏠</text>
                {/* Driver */}
                <circle cx="560" cy="118" r="20" fill="#1a1a1a" />
                <text x="560" y="123" textAnchor="middle" fontSize="16">🚴</text>
                {/* Destination */}
                <circle cx="720" cy="95" r="18" fill="#f5f3ef" stroke="#4a4238" strokeWidth="2" strokeDasharray="3 2" />
                <text x="720" y="100" textAnchor="middle" fontSize="16">📍</text>
                {/* Labels */}
                <text x="80" y="126" textAnchor="middle" fontSize="10" fill="#665d52" fontFamily="sans-serif" fontWeight="700">KITCHEN</text>
                <text x="720" y="126" textAnchor="middle" fontSize="10" fill="#665d52" fontFamily="sans-serif" fontWeight="700">YOUR DOOR</text>
                <text x="560" y="148" textAnchor="middle" fontSize="10" fill="#1a1a1a" fontFamily="sans-serif" fontWeight="700">CARRIER</text>
              </svg>
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-[#4a4238] uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20] animate-pulse"></span> Live GPS Sync
              </div>
            </div>
          </div>

          {/* Step Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] mb-6">Delivery Progress</h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#efeeea]"></div>
              <div className="absolute left-5 top-0 w-0.5 bg-[#1a1a1a]" style={{ height: '66%' }}></div>
              <ol className="space-y-8 relative">
                {STEPS.map((s, i) => (
                  <li key={i} className="flex items-start gap-5">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${s.active ? 'bg-[#1a1a1a] border-[#1a1a1a] shadow-lg' : s.done ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'bg-[#f5f3ef] border-[#ded9d1]'}`}>
                      <span className={`material-symbols-outlined text-[20px] ${s.done || s.active ? 'text-white' : 'text-[#ded9d1]'}`}
                        style={s.active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {s.icon}
                      </span>
                      {s.active && <span className="absolute -inset-1.5 rounded-full bg-[#1a1a1a]/20 animate-ping"></span>}
                    </div>
                    <div className="pt-1">
                      <div className={`font-semibold text-sm ${s.done || s.active ? 'text-[#1a1a1a]' : 'text-[#ded9d1]'}`}>{s.label}</div>
                      <div className={`text-xs mt-0.5 ${s.active ? 'text-[#4a4238] font-bold' : 'text-[#665d52]'}`}>{s.sub}</div>
                      {s.active && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#efeeea] rounded text-[10px] font-bold text-[#1a1a1a] uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20] animate-pulse"></span>
                          IN PROGRESS
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Right: Order Details Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Driver Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-[#665d52]">Assigned Thermal Carrier</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#1b5e20] bg-[#1b5e20]/10 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20] animate-pulse"></span>Active
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#ded9d1]/50 flex items-center justify-center text-3xl">🧑‍🍳</div>
              <div className="flex-1">
                <p style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a]">Ramesh S.</p>
                <div className="flex items-center gap-1 text-[11px] text-[#665d52] font-semibold">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 4.9
                  <span className="text-[#ded9d1] mx-1">•</span>
                  <span>TL-Rider #1872</span>
                  <span className="text-[#ded9d1] mx-1">•</span>
                  <span>Hero Activa</span>
                </div>
              </div>
              <a href="tel:+91" className="w-10 h-10 rounded-full bg-[#f5f3ef] flex items-center justify-center text-[#4a4238] hover:bg-[#ded9d1] transition-colors">
                <span className="material-symbols-outlined text-[22px]">call</span>
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[{ v: `${eta} min`, l: 'ETA' }, { v: '1.8 km', l: 'Away' }, { v: '5:28 PM', l: 'Est. Arrival' }].map(s => (
                <div key={s.l} className="bg-[#f5f3ef] rounded p-3 text-center">
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className={`text-xl font-semibold block text-[#1a1a1a] ${pulsed && s.l === 'ETA' ? 'text-[#4a4238]' : ''} transition-colors`}>{s.v}</span>
                  <span className="text-[10px] font-bold uppercase text-[#665d52]">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-[#1a1a1a]">Order Summary</h3>
              <span className="text-xs font-bold text-[#665d52] uppercase">#TL-4729</span>
            </div>
            <div className="divide-y divide-[#efeeea] text-sm">
              {[
                { name: 'Gujarati Home Meal Thali', desc: '4 Phulkas, Sev Tameta, Dal, Rice', price: '₹120', qty: 1 },
                { name: 'Masala Chaas Glass', desc: '250ml fresh-churned buttermilk', price: '₹20', qty: 1 },
                { name: 'Doorstep Delivery', desc: 'Insulated thermal carrier', price: '₹20', qty: null },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 gap-3">
                  <div>
                    <p className="font-semibold text-[#1a1a1a]">{item.name} {item.qty && <span className="text-[#665d52] font-normal">×{item.qty}</span>}</p>
                    <p className="text-xs text-[#665d52]">{item.desc}</p>
                  </div>
                  <span className="font-semibold text-[#1a1a1a] whitespace-nowrap">{item.price}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#f5f3ef] p-4 rounded flex items-center justify-between">
              <span className="text-sm font-bold uppercase text-[#1a1a1a]">Total Paid</span>
              <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-semibold text-[#1a1a1a]">₹160</span>
            </div>
            <p className="text-xs text-[#665d52] leading-relaxed">✓ Payment via UPI Escrow. Funds held until successful delivery confirmation.</p>
          </div>

          {/* Kitchen info */}
          <div className="bg-[#f5f3ef] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm">🏠</div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#665d52] block">Dispatched From</span>
              <p className="text-sm font-semibold text-[#1a1a1a]">Priya's Home Kitchen, Satellite</p>
              <p className="text-xs text-[#665d52]">Batch sealed 4:58 PM • 100% stainless steel can</p>
            </div>
          </div>

          {/* Help */}
          <div className="text-center">
            <p className="text-xs text-[#665d52] mb-2">Need help with your order?</p>
            <button className="text-xs font-bold text-[#1a1a1a] uppercase underline hover:text-[#4a4238] transition-colors">Contact TiffinLink Support →</button>
          </div>
        </div>
      </section>
    </div>
  );
}

