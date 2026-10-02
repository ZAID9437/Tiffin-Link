import React, { useState } from 'react';

const KITCHENS = [
  {
    id: 1, name: "Priya's Home Kitchen", distance: '1.2 km', rating: 4.8, reviews: 342,
    address: 'Prernatirth Derasar Road, Satellite',
    desc: 'Gujarati Heritage Thali • Kathiyawadi Khichdi • Jain Satvik Option',
    tags: ['Pure Veg', 'Clay Pot Kadhi', 'Fresh Phulka Rotli'],
    price: '₹120', unit: 'thali', status: 'Accepting Dinner Slots (5:00 PM)',
    filters: ['veg', 'gujarati', 'jain'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRMgHXlGpzmLSCskotnLn0Oj2iDyReXLR0bmBlFohi0g4-nB8qnZdtBxvjKC0rCAwb3RYvt2SneKaxf7tmtd7IBoBdpTprLbZNH7KkYYV6SQybY0I6xYRC6aSenA_22JmG3fdI9QJ1-4nYB8tvaV0TnLgdSzdjMgSxje9MsMWIucM2R9NP_DVxA-nXA4UaA5TIviMgENF4G90vq_7Hg712RnIKUCj-QnxV03ouU7BwyZDaNv6bpBBB',
  },
  {
    id: 2, name: 'Maa Tiffin Service', distance: '2.4 km', rating: 4.6, reviews: 189,
    address: 'Vastrapur Lake Enclave, Vastrapur',
    desc: 'Homestyle Punjabi • Dal Makhani • Paneer Special • Soft Rotis',
    tags: ['🚴 Delivery In 20m', '🏃 Self Pickup', 'Pure Butter Roti'],
    price: '₹100', unit: 'meal', status: 'Dispatching Now',
    filters: ['punjabi'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHlU-A5u9_8hbP8bLIFn9nkpUONl-AJLgp-_uEG1mu6jkBigvBNBI0X5k8guM8QEi4G7-cScKm080INtTGCNpqYdKmwC30osMLbjhO71WoFG__6sXwgGGOPboKiJtxdNZn6zMU7rYfngmzUC4YQVWwYII9a1W5ebmjsp9RHYK6th_gTrty1G0p03gmlmfSdpGyk1MyHmW6lK46VcqFBiW0CWLXAwYc5MeT2_wyLSIysLpPhVdn8ApR',
  },
  {
    id: 3, name: 'Shreeji Satvik Bhojan', distance: '3.1 km', rating: 4.9, reviews: 410,
    address: 'Sindhu Bhavan Extension, Bodakdev',
    desc: 'Ayurvedic Satvik • Strictly Zero Onion & Zero Garlic • Cold Pressed Sesame Oil',
    tags: ['Satvik Pure', 'Low Sodium', 'Brass Pot Cooked'],
    price: '₹140', unit: 'thali', status: 'Verified Jain Certified Kitchen',
    filters: ['veg', 'jain', 'healthy'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt5UOF92ohVCLAzoPUY-86gDM5iORDvCU1nHvZZim2jzo8btitH6veCpF_etWZYgAqeJzySoHSx1g2So8MgcbViSUm-f4HePWqnvbJfO3Tbl0cUg7O-sURQ41L56N3Aqa1Uda73-OMVNNLZ-XuNNLAJVsVdrbziLlvo14BdJqNFyqGrl2yZ2R9psuZoLruOHqpp2asUl1MN6qSE3lmxWcJR6ny8EyoyVBa-xkF2ZDa-p6hskrkCQ2p',
  },
  {
    id: 4, name: 'Tulsi Kathiyawadi Rasoi', distance: '3.8 km', rating: 4.7, reviews: 275,
    address: 'Judges Bungalow Road, Bodakdev',
    desc: 'Bajra Rotla • Ringna no Oro • Sev Tameta • Garlic Chutney • Chhas',
    tags: ['Kathiyawadi Authentic', 'White Butter', 'Ghee Rotla'],
    price: '₹130', unit: 'thali', status: 'Woodfire Prep Complete',
    filters: ['veg', 'kathiyawadi', 'gujarati'],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYqTYrkh1PIKv9e3l2i8i3P34Yibsc73H9fWRFpcA-63J0hsqYqvVeAAXuMby0W3B_T_hdVzGREOj1zyzHaZIE4j_AFpm6Wrv4YK-C-0MZ0V9TmtyBhh41ltaJ8w6pA6fAEhWEQL1RA4Bt_nDB-454BHWKYFqkcqrL9kNHYlKfXMioFRI4g2l5us-8cx191WCoVVDEyETcZLX6QVc8lRHN9JrFOzKMljSBGYkoO5QDvZMOcG-iEgRb',
  },
];

const FILTERS = [
  { id: 'all', label: 'All (14)' },
  { id: 'veg', label: 'Pure Veg (12)' },
  { id: 'jain', label: 'Jain Satvik (6)' },
  { id: 'gujarati', label: 'Gujarati (8)' },
  { id: 'kathiyawadi', label: 'Kathiyawadi (5)' },
  { id: 'punjabi', label: 'Punjabi (4)' },
  { id: 'healthy', label: 'Low Oil / Ayurvedic (3)' },
];

export default function NearbyTiffinServices({ onNavigate }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const displayed = activeFilter === 'all'
    ? KITCHENS
    : KITCHENS.filter(k => k.filters.includes(activeFilter));

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5]">
      {/* Header */}
      <div className="w-full bg-[#f5f3ef] py-10">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase text-[#665d52] tracking-widest">Discovery</span>
            <span className="text-[#665d52]/40 text-xs">/</span>
            <span className="text-xs font-bold uppercase text-[#1a1a1a]">Local Artisanal Kitchens</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#1a1a1a]"></span>
                <span className="text-xs font-bold uppercase text-[#665d52] tracking-wider">Satellite, Ahmedabad Corridor</span>
              </div>
              <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl lg:text-5xl text-[#1a1a1a] tracking-tight">
                14 Curated Kitchens Within 5.0 km
              </h1>
            </div>
          </div>
          <div className="p-4 bg-[#ded9d1]/30 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#4a4238] text-[20px]">near_me</span>
              <p className="text-sm text-[#4a4238]">
                Active dispatch radius serving <strong className="text-[#1a1a1a] font-medium">Satellite, Bodakdev &amp; Vastrapur</strong>. Fresh batch thermal dispatch guaranteed within 35 minutes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#665d52] whitespace-nowrap">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></span>
              <span>Verified Food Safety Escrow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full bg-[#fbf9f5]/95 backdrop-blur-md py-6 sticky top-20 z-40 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase transition-all whitespace-nowrap ${activeFilter === f.id ? 'bg-[#1a1a1a] text-white shadow-sm' : 'bg-[#f5f3ef] text-[#444748] hover:bg-[#ded9d1]'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold uppercase text-[#665d52]">Sort:</span>
            <div className="relative inline-block">
              <select className="appearance-none bg-[#f5f3ef] text-xs font-semibold text-[#1a1a1a] py-2 pl-3 pr-8 rounded cursor-pointer focus:outline-none shadow-sm">
                <option>Distance (Nearest First)</option>
                <option>Rating (4.8+ Stars)</option>
                <option>Price (Lowest First)</option>
                <option>Prep Velocity (&lt; 25m)</option>
              </select>
              <span className="material-symbols-outlined text-[18px] text-[#665d52] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="w-full py-8 lg:py-12">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kitchen Cards */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {displayed.map(k => (
              <article key={k.id} className="bg-white p-6 rounded shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="sm:w-44 h-44 shrink-0 rounded overflow-hidden relative">
                    <img src={k.img} alt={k.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#1a1a1a]/85 backdrop-blur-sm text-white text-[10px] font-bold uppercase">{k.distance}</div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#1a1a1a]"></span>
                          <span className="text-[10px] font-bold uppercase text-[#665d52]">{k.status}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[#ded9d1]/50 px-2 py-0.5 rounded">
                          <span className="material-symbols-outlined text-[14px] text-[#1a1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs font-bold text-[#1a1a1a]">{k.rating}</span>
                          <span className="text-[10px] text-[#665d52]">({k.reviews})</span>
                        </div>
                      </div>
                      <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] mb-1">{k.name}</h3>
                      <p className="text-sm text-[#665d52] mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-[#4a4238]">location_on</span>{k.address}
                      </p>
                      <p className="text-sm text-[#1a1a1a] mb-3">{k.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {k.tags.map(t => <span key={t} className="px-2 py-0.5 rounded bg-[#efeeea] text-[10px] font-bold uppercase text-[#665d52]">{t}</span>)}
                      </div>
                    </div>
                    <div className="pt-3 bg-[#f5f3ef] -mx-6 -mb-6 p-4 px-6 flex flex-wrap items-center justify-between gap-4 mt-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#665d52] block">Starting Daily Rate</span>
                        <span className="text-2xl font-semibold text-[#1a1a1a]">{k.price} <span className="text-sm text-[#665d52] font-normal">/ {k.unit}</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="text-xs font-semibold text-[#1a1a1a] underline hover:text-[#4a4238] transition-colors">View Full Menu →</button>
                        <button onClick={() => onNavigate && onNavigate('provider-showcase')} className="px-5 py-2 rounded bg-[#1a1a1a] text-white text-xs font-bold uppercase hover:bg-[#4a4238] transition-colors shadow-sm">
                          Select Kitchen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-5 sticky top-40 space-y-6">
            <div className="bg-[#f5f3ef] p-6 rounded shadow-md">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#665d52] block">Geospatial Radial Mesh</span>
                  <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a]">5.0 KM Radar Corridor</h2>
                </div>
                <div className="flex items-center gap-1.5 bg-[#fbf9f5] px-2.5 py-1 rounded text-[#1a1a1a] text-xs font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#1a1a1a] animate-pulse"></span>GPS SYNCED
                </div>
              </div>
              <div className="relative w-full h-[420px] bg-[#fbf9f5] rounded overflow-hidden shadow-inner flex items-center justify-center p-4">
                <svg className="w-full h-full" fill="none" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="200" cy="200" r="180" stroke="#665d52" strokeOpacity="0.2" strokeDasharray="4 4" strokeWidth="1.5" />
                  <circle cx="200" cy="200" r="130" stroke="#665d52" strokeOpacity="0.3" strokeWidth="1.5" />
                  <circle cx="200" cy="200" r="80" stroke="#665d52" strokeOpacity="0.3" strokeDasharray="4 4" strokeWidth="1.5" />
                  <circle cx="200" cy="200" r="35" stroke="#665d52" strokeOpacity="0.4" strokeWidth="1.5" />
                  <line stroke="#665d52" strokeOpacity="0.2" strokeWidth="0.8" x1="20" x2="380" y1="200" y2="200" />
                  <line stroke="#665d52" strokeOpacity="0.2" strokeWidth="0.8" x1="200" x2="200" y1="20" y2="380" />
                  <path d="M200 200 L235 140" stroke="#1a1a1a" strokeLinecap="round" strokeWidth="1.5" />
                  <path d="M200 200 L140 120" stroke="#1a1a1a" strokeDasharray="2 3" strokeWidth="1.5" />
                  <path d="M200 200 L280 270" stroke="#1a1a1a" strokeDasharray="2 3" strokeWidth="1.5" />
                  <path d="M200 200 L95 285" stroke="#1a1a1a" strokeDasharray="2 3" strokeWidth="1.5" />
                  <circle cx="200" cy="200" fill="#1a1a1a" r="8" />
                  <circle cx="200" cy="200" r="16" stroke="#1a1a1a" strokeWidth="1" opacity="0.3" />
                  <circle cx="235" cy="140" fill="#1a1a1a" r="6" />
                  <circle cx="140" cy="120" fill="#4a4238" r="6" />
                  <circle cx="280" cy="270" fill="#4a4238" r="6" />
                  <circle cx="95" cy="285" fill="#4a4238" r="6" />
                  <text fill="#1a1a1a" fontFamily="sans-serif" fontSize="10" fontWeight="700" x="205" y="222">YOU (Satellite)</text>
                  <text fill="#1a1a1a" fontFamily="sans-serif" fontSize="10" fontWeight="600" x="245" y="144">Priya's (1.2k)</text>
                  <text fill="#4a4238" fontFamily="sans-serif" fontSize="10" x="75" y="115">Maa Tiffin (2.4k)</text>
                  <text fill="#4a4238" fontFamily="sans-serif" fontSize="10" x="290" y="275">Shreeji (3.1k)</text>
                  <text fill="#4a4238" fontFamily="sans-serif" fontSize="10" x="35" y="295">Tulsi Rasoi (3.8k)</text>
                  <text fill="#665d52" fontFamily="sans-serif" fontSize="9" x="204" y="42">5.0 KM</text>
                  <text fill="#665d52" fontFamily="sans-serif" fontSize="9" x="204" y="90">3.0 KM</text>
                  <text fill="#665d52" fontFamily="sans-serif" fontSize="9" x="204" y="135">1.5 KM</text>
                </svg>
                <div className="absolute bottom-3 left-3 bg-[#fbf9f5]/90 backdrop-blur-sm px-2.5 py-1.5 rounded text-[10px] text-[#665d52] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#1a1a1a]"></span>
                  Center: Prernatirth Road, Satellite
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#f5f3ef] p-3 rounded">
                  <span className="text-[10px] font-bold uppercase text-[#665d52] block mb-1">Average Prep Window</span>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a]">18 - 26 min</span>
                </div>
                <div className="bg-[#f5f3ef] p-3 rounded">
                  <span className="text-[10px] font-bold uppercase text-[#665d52] block mb-1">Escrow Carrier Route</span>
                  <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a]">100% Thermal</span>
                </div>
              </div>
            </div>
            <div className="bg-[#efeeea] p-6 rounded shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#4a4238] text-[20px]">verified</span>
                <span className="text-xs font-bold uppercase text-[#1a1a1a]">TiffinLink Quality Protocol</span>
              </div>
              <p className="text-sm text-[#665d52] leading-relaxed mb-4">
                Every home kitchen within your 5 km perimeter undergoes quarterly water purity inspections, physical kitchen sanitization verification, and packaging health reviews.
              </p>
              <button className="text-xs font-semibold text-[#1a1a1a] underline hover:text-[#4a4238] transition-colors inline-flex items-center gap-1">
                <span>Read culinary charter &amp; kitchen checklist</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How Subscriptions Work */}
      <div className="w-full bg-[#f5f3ef] py-16">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#665d52] tracking-widest block mb-1">Flexibility Guarantee</span>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a]">How Local Subscriptions Work</h2>
            </div>
            <p className="text-sm text-[#665d52] max-w-md">Switch daily between kitchens within your 5 km zone without forfeiting subscription value.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Select Primary Master Chef', desc: 'Pick your default homestyle kitchen based on your preferred flavor profile and dietary restrictions.' },
              { n: '02', title: 'Daily 4:00 PM Dish Swap', desc: 'Craving Kathiyawadi instead of your daily Punjabi? Tap swap before the prep cutoff with one click.' },
              { n: '03', title: 'Insulated Stainless Steel Cans', desc: 'Meals arrive in heritage grade insulated stainless containers. Zero microplastics, piping hot food.' },
            ].map(s => (
              <div key={s.n} className="bg-white p-6 rounded shadow-sm">
                <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl text-[#665d52]/40 block mb-2">{s.n}</span>
                <h4 style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] mb-2">{s.title}</h4>
                <p className="text-sm text-[#665d52]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

