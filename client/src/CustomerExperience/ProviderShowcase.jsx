import React, { useState } from 'react';

const VARIETIES = [
  { name: 'Gujarati Home Meal', price: '₹120', badge: '★ Most Popular', desc: 'Everyday comfort thali: 4 Phulka Rotli, 1 Seasonal Shak (Sev Tameta or Bhindi), Gujarati Khatti-Meethi Dal, Steamed Rice, Kachumber & Chutney.', tags: ['4 Phulkas', 'Gujarati Dal', 'Kachumber'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVejg1BHzTc9vcxxKY2hBGyfAAEJGh6sHk9syQwyc4El8qaRCozHoP5-Z06l52JIvJRW10_ZxBVz8U8XkQdqfkPRlSFD13AepuLhBrNYuLM91ufrWQeUfX9i3enZXR4HgchmbqOBljuJ1di33So682yJl4JjSf0KmZXpDpauqa2pgUsTTLRtNQInxcpTObKoRDgFa4z-zH9lKyMqYYc3lwx5sDgjbi4raNMJ1P627qeYy1uwhJMsIA' },
  { name: 'Kathiyawadi Village Thali', price: '₹160', badge: null, desc: 'Rustic Saurashtra flavors: 2 Bajra No Rotlo, Ringan Bhartu with Lasan ni Chutney, Sev Tameta, and fresh hand-churned chaas.', tags: ['2 Bajra Rotlo', 'Ringan Bhartu', 'White Butter'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiSd4jOSgvZIH91yg5g7vlYDEvS9Jy9H4sQ7ne1WOMhz_QB59Kq98yW1IEbL2h-Mph4s-oyvc6eg0oHZJM9rt14RjdjUr7d6A2fBJLJVUXN33VBfErH8esgX6m-7kDsjZqSY0s8u5LZ2Zf0YmR8Y7dkola84VrxEsDO3TcjYV3p3BXvwDj6Ugg85JAZk-IDuMr3Pb6Pa2hJIy3oavbsC4g4JBWPWVoA3JyJ-ZcIwprFiH5szfV0ejq' },
  { name: 'Celebration Thali', price: '₹195', badge: null, desc: 'Full feast: 5 Ghee Phulkas, 2 Shaks (Rasawala Bateta + Paneer Bhurji), Gujarati Dal, Jeera Rice, Farsan (Khaman), and Shrikhand sweet.', tags: ['2 Shaks', 'Khaman Farsan', 'Shrikhand Sweet'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD12P3Hhps5sOV-35KeYNdzMllHa1bXYtktat5T62maZHnQRfgbdv8eSoZgu9Nvc4EN6WXLMhb974eKyOLhVagOBLTqzEiPxbimZpggoeQvMqThbrcOj_Q0fclGB8ZrKO0OcayK-WriQwJi4CJEiC-ph5DKlLTroDPOum2OkFnCNwEf8FW9LTi1wnhdgYnIK7yyAejvQ6mO4TzwUTrYrU4UhBhKROdcRXnd16fvSuVqNwtYKsIFZQs4' },
  { name: 'Light Khichdi-Kadhi Box', price: '₹110', badge: null, desc: 'Soothing comfort: Hand-churned Vaghareli Khichdi, piping hot Gujarati Kadhi, crisp roasted Papad, and homemade spicy mango pickle.', tags: ['Vaghareli Khichdi', 'Sweet Kadhi', 'Roasted Papad'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2IA8ZTrRwVKovIZKLVeS_0MqLuYfwvtrN1D3Qk62uuKKvIZ9k6gvLyXfq4e2LXUBbBd532Ux3oyZmRFhNRXh9YrsMvRPy4Dk-faOAi6DIiVoyQbemazgFcwsK3afXPcu2NU9snxYMabL_VEFn7Dnt-dJFETllcyOqajvCgLL8-yufNTgptTM8nJFXHvCQKzlWyCt-0B-NXaeF-NM0Sncqug1UQ5l5a571daYnAt7nT4XuTgHRbu6V' },
  { name: 'Dal-Dhokli Heritage Meal', price: '₹130', badge: null, desc: 'Traditional spiced wheat flour ribbons simmered in sweet-tangy lentil stew, served with Steamed Rice and a dollop of pure A2 Cow Ghee.', tags: ['Spiced Wheat Ribbons', 'Basmati Rice', 'Pure Cow Ghee'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDm3OTbQs1NfcfObg9-4w2bAMeoLqGiyFYKNp5O2-Qa7qhhR_WYi-E6ZC7iWrAKjDp1A9tYGwczNVC8ELh56QzbSzOzDVO6lJSNBC5yzKtzfczkn3KkG7O8qnqClfxWO2yEO17Ekd-23MgpuSdsJz2LaMPnL6phVGzo-1iIMZc7jhq420THBrZhfKIb2WpLTGqGF0seyArKPHs_aubJ4PzmwA-YKblODUIWlBLe4rQ6_hcU3dE-W8MI' },
  { name: 'Office Executive Thali', price: '₹140', badge: null, desc: 'Spill-proof 5-compartment eco-box engineered for office desks with balanced nutrition, zero mess, and lightweight wheat phulkas.', tags: ['Spill-Proof Box', 'Dry Shak Spec', 'Cutlery Included'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFrL4Mnj-3E2Veop1UpnAIIoOPDNz-4vMqEj4Vku_5EcWSSh-uK9RUVyeknvPP0Fiwma1eju7TGJAGH7kclIedQXpZh5ojSwZBm76COE1tRrdDb3vnzHUPmS3mkis9NoKNubst9dd4PAQPSLlXmlrcSlNxUCyC8Z7JZcWlIdLa-T2qyqqm2fUhBZAyvz2Ipwntqim_5WnTUKr4FOrcZRn8fHcb1ncXkvrb2K7KLeVGyyhbn1MUqDSK' },
];

const TABS = ['Gujarati Varieties', 'Punjabi Home Specials', 'Jain Satvik Menu', 'Healthy & Millet Thalis'];

export default function ProviderShowcase({ onNavigate }) {
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVariety, setSelectedVariety] = useState(null);
  const [addedMsg, setAddedMsg] = useState(false);

  const openDrawer = (v) => { setSelectedVariety(v); setDrawerOpen(true); setAddedMsg(false); };
  const closeDrawer = () => setDrawerOpen(false);
  const confirmAdd = () => {
    setAddedMsg(true);
    setTimeout(() => { setDrawerOpen(false); setAddedMsg(false); }, 900);
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5]">
      {/* Breadcrumb */}
      <section className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 pt-8 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={() => onNavigate && onNavigate('nearby-tiffin-services')} className="inline-flex items-center gap-2 text-xs font-semibold text-[#665d52] hover:text-[#1a1a1a] transition-colors group">
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_left_alt</span>
            Back to Nearby Tiffins
          </button>
          <div className="flex items-center gap-6 text-xs font-bold uppercase text-[#665d52]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4a4238]"></span>FSSAI Lic. #10822003001844
            </span>
            <span className="hidden sm:inline text-[#ded9d1]">/</span>
            <span className="hidden sm:inline">Certified Batch #GJ-092-25</span>
          </div>
        </div>
      </section>

      {/* Hero Banner */}
      <section className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 pb-14">
        <div className="bg-[#f5f3ef] rounded-lg p-6 lg:p-12 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-[#ded9d1]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#efeeea]">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5aJwLtR9ycPzUZtKtNwVnaK4P3xYLhDh8Q7ExsvacUg5T6mGisjFjXXzWKNTsRwCkIPXWIAlYFIED6y9RDGBLZLo8hzR9yFjLRkh8QY61lkU5ndTa8c1aO93w3IxoLEJFjdw36HvIdBzq0xA4jQWv1mwK7WWlfD0EEjjQnYbW8m_x_2-At--V6M9vgAR5cCIhpWtW7Tj4tIIHYLA-jTpcEIMu4hYsY9-BY0fVg1m27Z0Yx86eodlr" alt="Priya's Kitchen" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-[#fbf9f5]/90 backdrop-blur-md px-3 py-1 rounded">
                  <p className="text-[10px] font-bold uppercase text-[#1a1a1a]">Small-Batch Hearth</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: '4.8', l: '342 Reviews' }, { v: '1.2', l: 'KM • Satellite' }, { v: '12m', l: 'Prep Window' }].map(s => (
                  <div key={s.l} className="bg-[#fbf9f5] rounded p-2.5 text-center">
                    <span style={{ fontFamily: "'EB Garamond', serif" }} className="block text-2xl text-[#1a1a1a] leading-none">{s.v}</span>
                    <span className="text-[10px] font-bold uppercase text-[#665d52] mt-1 block">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8 flex flex-col justify-between h-full">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  {[{ dot: 'bg-[#1b5e20]', label: 'Open Now' }, { icon: 'pedal_bike', label: 'Delivery Available' }, { icon: 'storefront', label: 'Pickup Window Ready' }].map((b, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fbf9f5] rounded text-[10px] font-bold uppercase text-[#665d52]">
                      {b.dot ? <span className={`w-2 h-2 rounded-full ${b.dot} animate-pulse`}></span> : <span className="material-symbols-outlined text-[15px] text-[#4a4238]">{b.icon}</span>}
                      {b.label}
                    </span>
                  ))}
                </div>
                <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl lg:text-5xl text-[#1a1a1a] mb-3 tracking-tight">Priya's Home Kitchen</h1>
                <p className="text-lg text-[#665d52] max-w-2xl leading-relaxed mb-6">
                  Authentic Gujarati home-cooked meals prepared in small batches using cold-pressed groundnut oil and freshly ground spices. No soda, no preservatives, strictly sattvic purity standards.
                </p>
              </div>
              <div className="bg-[#fbf9f5] p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded bg-[#ded9d1]/40 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#4a4238] text-[22px]">schedule</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#665d52] block">Active Preparation Cycle</span>
                    <p className="text-sm font-semibold text-[#1a1a1a]">Evening Cycle: 5:00 PM – 7:30 PM slot</p>
                    <p className="text-xs text-[#665d52]">Orders lock 45 minutes prior for fresh rotli rolling.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-3 py-1.5 bg-[#1a1a1a] text-white rounded inline-block whitespace-nowrap">Accepting Orders</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cuisine Tabs */}
      <section className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 mb-12">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase text-[#665d52]">Culinary Categories</span>
          <span className="text-xs font-bold text-[#4a4238]">4 Daily Kitchen Menus</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`px-5 py-3 rounded text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors ${activeTab === i ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f3ef] text-[#665d52] hover:text-[#1a1a1a]'}`}>
              {i === 0 && <span className="w-2 h-2 rounded-full bg-[#4caf50]"></span>}
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Variety Grid */}
      <section className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 mb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase text-[#4a4238] tracking-widest block mb-2">Regional Heritage • Handcrafted Daily</span>
            <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl text-[#1a1a1a] leading-tight">Gujarati Food — Choose your regional meal variety</h2>
          </div>
          <p className="text-sm text-[#665d52] max-w-md">Select a base style to customize your thali components, ghee quantity, rotli count, and evening sides.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VARIETIES.map((v, i) => (
            <div key={i} className="bg-[#f5f3ef] rounded-lg p-6 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden">
              {v.badge && (
                <div className="absolute top-0 right-0 bg-[#1a1a1a] text-white px-3 py-1.5 rounded-bl text-[10px] font-bold uppercase tracking-wider">{v.badge}</div>
              )}
              <div>
                <div className="w-full h-48 rounded bg-[#efeeea] overflow-hidden mb-6 relative">
                  <img src={v.img} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] group-hover:text-[#4a4238] transition-colors">{v.name}</h3>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] font-semibold">{v.price}</span>
                </div>
                <p className="text-sm text-[#665d52] mb-6 leading-relaxed">{v.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {v.tags.map(t => <span key={t} className="px-2 py-0.5 bg-[#ded9d1]/50 rounded text-[11px] font-bold text-[#1a1a1a]">{t}</span>)}
                </div>
              </div>
              <button onClick={() => openDrawer(v)} className="w-full py-3.5 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 group-hover:bg-[#4a4238] transition-colors">
                <span>Select &amp; Customize Meal</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Hygiene Section */}
      <section className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 pb-24">
        <div className="bg-[#fbf9f5] rounded-lg p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f5f3ef] rounded text-xs font-bold uppercase text-[#4a4238]">
                <span className="material-symbols-outlined text-[16px]">verified</span>Kitchen Notes &amp; Hygiene Transparency
              </div>
              <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a]">Verified Clean Hearth Standard: Daily fresh local sourcing without cold storage lag.</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  { icon: 'local_mall', title: 'Vegetable Procurement', desc: 'Bodakdev Farmers Market (07:30 AM). Zero deep-freezing or chemical wash agents.' },
                  { icon: 'water_drop', title: 'Water & Oil Pureness', desc: '100% RO Purified water for all dals. Pure cow ghee for rotlis and Saurashtra groundnut oil for curries.' },
                ].map(h => (
                  <div key={h.title} className="p-4 bg-[#fbf9f5] rounded">
                    <div className="flex items-center gap-2 mb-1.5 text-[#1a1a1a] text-xs font-bold">
                      <span className="material-symbols-outlined text-[#4a4238] text-[18px]">{h.icon}</span>{h.title}
                    </div>
                    <p className="text-[13px] text-[#665d52]">{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 bg-[#fbf9f5] rounded-lg p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase text-[#665d52]">Kitchen Hygiene Index</span>
                <span className="text-[10px] font-bold text-[#1b5e20]">99.4% Verified</span>
              </div>
              <div className="flex items-center gap-4 py-2">
                <svg className="w-16 h-16 shrink-0" viewBox="0 0 36 36">
                  <path fill="none" stroke="#ded9d1" strokeWidth="3.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path fill="none" stroke="#1a1a1a" strokeDasharray="96, 100" strokeLinecap="round" strokeWidth="3.5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text fontSize="9" fontWeight="bold" fill="#1a1a1a" textAnchor="middle" x="18" y="20.5">A+</text>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">Spotless Health Audit</p>
                  <p className="text-[13px] text-[#665d52] leading-tight">Passed 18-point municipal food quality inspection.</p>
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between text-[#665d52] text-[11px] uppercase font-bold">
                <span>Audit Date: 12 Oct 2025</span>
                <span className="text-[#4a4238]">Sanitized 4x/Day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customization Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={closeDrawer}></div>
          <div className="w-full max-w-lg bg-[#fbf9f5] shadow-2xl p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#4a4238] block">Customizing Component Specs</span>
                  <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a]">{selectedVariety?.name}</h3>
                </div>
                <button onClick={closeDrawer} className="w-10 h-10 rounded bg-[#f5f3ef] flex items-center justify-center text-[#1a1a1a] hover:bg-[#ded9d1] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase text-[#1a1a1a] block mb-2">Rotli Count &amp; Ghee Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['4 Ghee Phulkas', '4 Dry (No Ghee)'].map((r, i) => (
                      <label key={r} className="p-3 bg-[#f5f3ef] rounded flex items-center justify-between cursor-pointer">
                        <span className="text-sm">{r}</span>
                        <input type="radio" defaultChecked={i === 0} name="rotli" className="accent-[#1a1a1a]" />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-[#1a1a1a] block mb-2">Today's Shak Selection</label>
                  <div className="space-y-2">
                    {[{ n: 'Sev Tameta Nu Shak', d: 'Sweet-tangy tomato gravy topped with ratlami sev' }, { n: 'Bhindi Masala (Dry)', d: 'Crisp okra sautéed with roasted coriander and cumin' }].map((s, i) => (
                      <label key={s.n} className="p-3 bg-[#f5f3ef] rounded flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-medium block">{s.n}</span>
                          <span className="text-xs text-[#665d52]">{s.d}</span>
                        </div>
                        <input type="radio" defaultChecked={i === 0} name="shak" className="accent-[#1a1a1a]" />
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-[#1a1a1a] block mb-2">Add-On Accompaniments</label>
                  <div className="space-y-2">
                    {[{ n: 'Masala Chaas Glass (250ml)', p: '+ ₹20' }, { n: 'Extra Katori Gujarati Dal', p: '+ ₹35' }, { n: 'Gulab Jamun (2 Pcs)', p: '+ ₹30' }].map(a => (
                      <label key={a.n} className="p-3 bg-[#f5f3ef] rounded flex items-center justify-between cursor-pointer">
                        <span className="text-sm">{a.n}</span>
                        <span className="text-xs font-bold text-[#1a1a1a]">{a.p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase text-[#665d52]">Total Configured</span>
                <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] font-semibold">{selectedVariety?.price}</span>
              </div>
              <button onClick={confirmAdd} className="w-full py-4 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-[#4a4238] transition-colors">
                {addedMsg ? "Added to Today's Tiffin ✓" : 'Confirm & Add to Daily Tiffin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

