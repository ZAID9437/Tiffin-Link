import React, { useState } from 'react';
import use3DTilt from '../components/use3DTilt';

const REGIONS = [
  {
    id: 'malabar',
    name: 'MALABAR COAST',
    tagline: 'A legacy of spice trails and coconut groves.',
    description: 'Prepared by home chefs who have preserved ancestral recipes of aromatic coconut stews, layered parottas, and fresh black pepper curries from the southern coast.',
    image: '/assets/food_south_indian.png',
    chef: 'Chef Meera Nair',
    chefQuote: 'We slow-simmer our stews in clay pots, just like my grandmother did on the Malabar coast.',
    tiers: [
      { label: 'TIER 1: THE MAINS', value: 'Classic Malabar Veg Stew & Kappa Puzhukku' },
      { label: 'TIER 2: THE GRAINS', value: 'Layered Malabar Parotta & Fragrant Ghee Rice' },
      { label: 'TIER 3: THE SWEET', value: 'Elaneer Payasam (Tender Coconut Pudding)' }
    ]
  },
  {
    id: 'awadh',
    name: 'ROYAL AWADH',
    tagline: 'The art of slow dum cooking and aromatic spices.',
    description: 'A curated menu bringing you the royal flavours of Lucknow, featuring slow-cooked rich gravies, melt-in-mouth kebabs, and saffron-infused rice.',
    image: '/assets/food_biryani.png',
    chef: 'Chef Tasneem Khan',
    chefQuote: 'Our masalas are hand-ground daily and simmered for 6 hours under charcoal dum.',
    tiers: [
      { label: 'TIER 1: THE MAINS', value: 'Paneer Awadhi Korma & Slow-Simmered Dal' },
      { label: 'TIER 2: THE GRAINS', value: 'Saffron Dum Biryani & Soft Hand-Rolled Sheermal' },
      { label: 'TIER 3: THE SWEET', value: 'Shahi Tukda with Almond Rabdi' }
    ]
  },
  {
    id: 'kathiawar',
    name: 'KATHIAWAR HEARTH',
    tagline: 'Robust, sun-drenched flavours of Gujarat.',
    description: 'Authentic Kathiawadi rustic food featuring spicy curries, hand-pounded garlic chutneys, and rotlas made from pearl millet, cooked over dry wood fire.',
    image: '/assets/food_vada.png',
    chef: 'Chef Hansaben Patel',
    chefQuote: 'We use heritage pearl millet flour and pure organic jaggery for that rustic village taste.',
    tiers: [
      { label: 'TIER 1: THE MAINS', value: 'Ringan No Oro (Roasted Eggplant) & Sev Tameta' },
      { label: 'TIER 2: THE GRAINS', value: 'Millet Bajra Rotla & Steaming Khichdi' },
      { label: 'TIER 3: THE SWEET', value: 'Warm Gor-Ghee (Jaggery Butter) & Buttermilk' }
    ]
  },
  {
    id: 'bengal',
    name: 'BENGAL DELTA',
    tagline: 'Delicate mustard oils and sweet syrup legacies.',
    description: 'Experience the subtle sweet and pungent balances of traditional Bengali home kitchens, featuring mustard-tempered gravies and heirloom lentil recipes.',
    image: '/assets/indian_tiffin_heritage.png',
    chef: 'Chef Arundhati Roy',
    chefQuote: 'Our mustard paste is stone-ground (shil-nora) to release its sweet pungency.',
    tiers: [
      { label: 'TIER 1: THE MAINS', value: 'Doi Potol (Pointed Gourd in Yogurt) & Chhanar Dalna' },
      { label: 'TIER 2: THE GRAINS', value: 'Gobindobhog Rice & Lucis (Soft Fried Bread)' },
      { label: 'TIER 3: THE SWEET', value: 'Nolen Gur Sondesh & Misti Doi' }
    ]
  },
  {
    id: 'punjab',
    name: 'PUNJABI RASOI',
    tagline: 'Hearty clay-oven traditions and rich dollops of butter.',
    description: 'Robust, comforting meals cooked in local home kitchens, featuring charcoal-smoked black dals, fresh greens, and hand-churned white butter.',
    image: '/assets/food_vada_pav.png',
    chef: 'Chef Amrik Singh',
    chefQuote: 'Our lentils are slow-cooked overnight on a tandoor for that signature smoky flavor.',
    tiers: [
      { label: 'TIER 1: THE MAINS', value: 'Slow-Cooked Dal Makhani & Sarson Ka Saag' },
      { label: 'TIER 2: THE GRAINS', value: 'Makki Ki Roti & Clay-Oven Garlic Naan' },
      { label: 'TIER 3: THE SWEET', value: 'Warm Gajar Ka Halwa with Pistachio' }
    ]
  }
];

export default function Categories() {
  const [activeTab, setActiveTab] = useState('malabar');
  const activeRegion = REGIONS.find(r => r.id === activeTab) || REGIONS[0];
  const tiltRef = use3DTilt(10, 1.02);

  return (
    <section className="pt-8 pb-section-gap px-margin-desktop bg-bone-white" id="heritage-explorer">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) rotate(-1deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        
        @keyframes photoSway {
          0% { transform: rotate(-2deg); }
          100% { transform: rotate(2deg); }
        }
        .animate-photo-sway {
          animation: photoSway 6.5s ease-in-out infinite alternate;
          transform-origin: top center;
          will-change: transform;
        }
      `}</style>

      <div className="max-w-[1440px] mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-label-caps text-label-caps text-secondary tracking-[0.2em] mb-3">
            EXPLORE REGIONAL LEGACIES
          </p>
          <h2 className="font-headline-lg text-4xl md:text-5xl text-onyx-black mb-4">
            Curated Ancestral Kitchens
          </h2>
          <p className="font-body-md text-secondary text-sm md:text-base italic leading-relaxed">
            Skip the fast food. Experience slow-cooked heirloom recipes crafted in micro-batches by local home chefs.
          </p>
        </div>

        {/* Regional Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 border-b border-clay-earth/20 pb-4 mb-16 max-w-4xl mx-auto">
          {REGIONS.map((region) => {
            const isActive = region.id === activeTab;
            return (
              <button
                key={region.id}
                onClick={() => setActiveTab(region.id)}
                className={`font-label-caps text-[10px] md:text-xs tracking-[0.2em] font-semibold pb-2.5 transition-all duration-300 relative ${
                  isActive 
                    ? 'text-clay-earth' 
                    : 'text-secondary/60 hover:text-onyx-black hover:tracking-[0.22em]'
                }`}
              >
                {region.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-clay-earth rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Premium Framing of Visual Image hanging from a rope */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start min-h-[460px] pt-4 overflow-hidden relative">
            {/* Static Horizontal Support Bar / Brass Rod */}
            <div className="w-32 h-[3px] bg-gradient-to-r from-clay-earth via-sand-neutral to-clay-earth rounded z-20 shadow-sm mb-[-9px]" />
            
            {/* Ring/Hook attachment at the beam */}
            <div className="w-3.5 h-3.5 rounded-full border-2 border-clay-earth bg-bone-white z-20 shadow-sm" />
            
            {/* The swaying rig */}
            <div 
              key={activeTab + '-image-rig'}
              className="flex flex-col items-center origin-top animate-photo-sway z-20"
              style={{ transformOrigin: 'top center' }}
            >
              {/* Rope Line */}
              <div className="w-[2px] h-16 bg-gradient-to-b from-clay-earth via-secondary/70 to-clay-earth relative">
                {/* Rope texture effect using dashed border overlay */}
                <div className="absolute inset-0 border-l border-dashed border-sand-neutral/40" />
              </div>
              
              {/* Knot / Loop right above the hook */}
              <div className="w-2.5 h-2.5 rounded-full bg-clay-earth -mb-0.5" />
              
              {/* Hook Attachment Ring of the Card */}
              <div className="w-3 h-3 rounded-full border-[1.5px] border-clay-earth bg-bone-white z-20 shadow-sm" />
              
              {/* Photo Frame Card */}
              <div 
                ref={tiltRef}
                className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-2xl border border-clay-earth/25 p-4 bg-surface-bright shadow-[0_15px_45px_rgba(74,66,56,0.12)] group/img cursor-pointer transition-all duration-500 hover:shadow-[0_20px_50px_rgba(74,66,56,0.18)] animate-scale-in -mt-[1px]"
              >
                {/* Luxury gold inset border */}
                <div className="absolute inset-2 border border-clay-earth/10 pointer-events-none rounded-xl" />
                
                <div className="w-full h-full rounded-lg overflow-hidden bg-sand-neutral/10 border border-clay-earth/10 flex items-center justify-center p-2 relative">
                  
                  {/* Floating shine layer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10" />

                  <img 
                    src={activeRegion.image} 
                    alt={activeRegion.name} 
                    className="max-w-[90%] max-h-[90%] object-contain select-none pointer-events-none transform group-hover/img:scale-105 group-hover/img:rotate-1 transition-transform duration-700 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial details & Story */}
          <div 
            key={activeTab + '-details'}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            <span className="font-label-caps text-[9px] uppercase text-clay-earth font-bold tracking-widest bg-sand-neutral/30 px-3 py-1 rounded-md mb-4 animate-fade-in-up">
              REGIONAL LEGACY: {activeRegion.name}
            </span>
            
            <h3 className="font-display-lg text-3xl md:text-4xl text-onyx-black mb-3 leading-tight font-medium animate-fade-in-up delay-100">
              {activeRegion.tagline}
            </h3>

            <p className="font-body-md text-sm md:text-base text-secondary italic mb-8 leading-relaxed max-w-xl animate-fade-in-up delay-100">
              "{activeRegion.description}"
            </p>

            {/* Interactive 3-Tier Tiffin Carrier Stack Card */}
            <div className="w-full max-w-2xl bg-surface-bright border border-clay-earth/20 rounded-xl p-6 shadow-sm relative overflow-hidden mb-8 group/tiffin animate-fade-in-up delay-200">
              {/* Inset Border */}
              <div className="absolute inset-1.5 border border-clay-earth/10 pointer-events-none rounded-lg" />
              
              {/* Vertical Brass Carrier Frame Rod */}
              <div className="absolute left-10 top-8 bottom-8 w-[2px] bg-clay-earth/20 hidden sm:block" />

              <div className="space-y-5 relative z-10">
                {activeRegion.tiers.map((tier, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-4 group/tier cursor-pointer transition-all duration-300 sm:pl-2"
                  >
                    {/* Metallic Tier Pin */}
                    <div className="w-6 h-6 rounded-full border border-clay-earth/30 bg-surface-bright flex items-center justify-center font-serif text-[10px] font-bold text-clay-earth/80 shrink-0 z-10 transition-all duration-300 group-hover/tier:border-clay-earth group-hover/tier:bg-clay-earth group-hover/tier:text-bone-white shadow-sm">
                      {idx + 1}
                    </div>

                    <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between border-b border-sand-neutral/20 pb-3 last:border-0 last:pb-0 group-hover/tier:translate-x-1.5 transition-transform duration-300">
                      <span className="font-label-caps text-[9px] tracking-wider text-clay-earth/80 font-bold mb-0.5 sm:mb-0 shrink-0 group-hover/tier:text-clay-earth transition-colors">
                        {tier.label}
                      </span>
                      <span className="font-display-lg text-sm md:text-base text-onyx-black text-right group-hover/tier:text-onyx-black font-semibold transition-colors">
                        {tier.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chef Quote Card */}
            <div className="flex items-start gap-4 border-l-2 border-clay-earth/50 pl-4 py-1.5 mb-8 max-w-xl animate-fade-in-up delay-300">
              <div>
                <p className="font-body-md text-xs md:text-sm text-secondary italic leading-relaxed">
                  "{activeRegion.chefQuote}"
                </p>
                <p className="font-label-caps text-[9px] tracking-wider text-onyx-black font-bold mt-2">
                  — {activeRegion.chef.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Interactive Call to Action Button */}
            <button className="bg-onyx-black text-bone-white px-8 py-3.5 font-button-text hover:bg-clay-earth transition-all duration-500 scale-100 active:scale-98 hover:tracking-widest flex items-center gap-2 group/btn rounded-[2px] shadow-md animate-fade-in-up delay-400">
              ORDER {activeRegion.name} TIFFIN
              <span className="material-symbols-outlined text-base translate-y-[0.5px] transform group-hover/btn:translate-x-1.5 transition-transform duration-300">
                arrow_forward
              </span>
            </button>

          </div>

        </div>

      </div>
    </section>
  );
}
