import React from 'react';

export default function FoodSafety() {
  return (
    <section className="pt-section-gap pb-28 px-margin-desktop bg-bone-white" id="process">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="md:col-span-5 reveal-on-scroll">
          <h2 className="font-headline-lg text-headline-lg mb-16">Four steps to absolute trust.</h2>
          <div className="space-y-16">
            <div className="flex gap-8 group">
              <span className="font-display-lg text-[32px] opacity-20 group-hover:opacity-100 transition-opacity duration-500">01</span>
              <div>
                <h4 className="font-label-caps text-label-caps mb-2">SOURCE VERIFICATION</h4>
                <p className="font-body-md text-body-md opacity-60">Tracing the origin of every ingredient to ethical, high-quality purveyors.</p>
              </div>
            </div>
            <div className="flex gap-8 group">
              <span className="font-display-lg text-[32px] opacity-20 group-hover:opacity-100 transition-opacity duration-500">02</span>
              <div>
                <h4 className="font-label-caps text-label-caps mb-2">HYGIENE CERTIFICATION</h4>
                <p className="font-body-md text-body-md opacity-60">Bi-monthly physical inspections of all partner cooking facilities.</p>
              </div>
            </div>
            <div className="flex gap-8 group">
              <span className="font-display-lg text-[32px] opacity-20 group-hover:opacity-100 transition-opacity duration-500">03</span>
              <div>
                <h4 className="font-label-caps text-label-caps mb-2">SENSORY AUDIT</h4>
                <p className="font-body-md text-body-md opacity-60">Blind tastings by our culinary curators to ensure flavor and texture excellence.</p>
              </div>
            </div>
            <div className="flex gap-8 group">
              <span className="font-display-lg text-[32px] opacity-20 group-hover:opacity-100 transition-opacity duration-500">04</span>
              <div>
                <h4 className="font-label-caps text-label-caps mb-2">SUSTAINABLE LOGISTICS</h4>
                <p className="font-body-md text-body-md opacity-60">Final review of delivery paths and zero-waste packaging compliance.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7 reveal-on-scroll">
          <div className="relative">
            <div 
              className="aspect-square bg-cover bg-center" 
              data-alt="A minimalist architectural shot of a bright, white-tiled professional kitchen. The surfaces are gleaming and sterile, yet the space feels warm due to soft natural light. There is a single artisan bowl of fresh herbs on a stainless steel counter, illustrating the clean and meticulous standard of TiffinLink kitchens." 
              style={{ 
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_SjvlgcbEn5AeB2PrcvrtEvexHLk6ded3x_qlpnYlK4bZHrhpWSkDkhLzZBa46E78Vvm7WHWZPG_xNBJOOCzaRQCkAh5zIwmyUuvuKmO9NCtW-Q6AI-IyPQNFeoBzShWY8iobzSN_J-2LDXl2NHqpvYnhxcim0zWcVx6MwDwU1AcQzulAimbE-ci_xyH0W39OMJuX9jrATvUM8hypEYX3E_11UUvFXVWYitvBHAFWcsm6WQQPQD1U')" 
              }}
            ></div>
            {/* Trust Standards Box */}
            <div className="absolute -bottom-12 -left-12 bg-onyx-black text-bone-white p-6 hidden lg:block w-80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-card-float hover-trigger group rounded-[2px]">
              <style>{`
                @keyframes card-float {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
                .animate-card-float {
                  animation: card-float 5s ease-in-out infinite;
                }
                @keyframes shine-sweep {
                  0% { left: -100%; }
                  100% { left: 200%; }
                }
                .shine-effect::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  height: 100%;
                  width: 60px;
                  background: linear-gradient(to right, transparent, rgba(196, 160, 114, 0.25), transparent);
                  transform: skewX(-20deg);
                  left: -100%;
                }
                .hover-trigger:hover .shine-effect::after {
                  animation: shine-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
              `}</style>
              
              {/* Shine sweep overlay */}
              <div className="absolute inset-0 shine-effect pointer-events-none" />

              {/* Gold Inset Border */}
              <div className="absolute inset-1.5 border border-clay-earth/20 pointer-events-none rounded" />
              
              <div className="relative z-10">
                <p className="font-label-caps text-[9px] text-clay-earth tracking-[0.2em] mb-3 font-bold">
                  TRUST STANDARDS
                </p>
                <div className="h-[1px] bg-white/10 w-full mb-4" />
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 group/row cursor-pointer transition-all duration-300">
                    <span className="material-symbols-outlined text-clay-earth text-base mt-0.5 transform group-hover/row:scale-125 group-hover/row:rotate-12 transition-all duration-300 shrink-0">verified_user</span>
                    <div className="transform group-hover/row:translate-x-1.5 transition-transform duration-300">
                      <p className="font-label-caps text-[9px] text-bone-white tracking-wider font-semibold group-hover/row:text-clay-earth transition-colors">FSSAI AUDITED KITCHENS</p>
                      <p className="font-body-md text-[10px] text-bone-white/60 mt-0.5 leading-relaxed">All home chefs verified with active government safety registration.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group/row cursor-pointer transition-all duration-300">
                    <span className="material-symbols-outlined text-clay-earth text-base mt-0.5 transform group-hover/row:scale-125 group-hover/row:rotate-12 transition-all duration-300 shrink-0">sanitizer</span>
                    <div className="transform group-hover/row:translate-x-1.5 transition-transform duration-300">
                      <p className="font-label-caps text-[9px] text-bone-white tracking-wider font-semibold group-hover/row:text-clay-earth transition-colors">HYGIENE GRADE 5/5</p>
                      <p className="font-body-md text-[10px] text-bone-white/60 mt-0.5 leading-relaxed">Bi-monthly physical inspections matching ISO-22000 checklists.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group/row cursor-pointer transition-all duration-300">
                    <span className="material-symbols-outlined text-clay-earth text-base mt-0.5 transform group-hover/row:scale-125 group-hover/row:rotate-12 transition-all duration-300 shrink-0">eco</span>
                    <div className="transform group-hover/row:translate-x-1.5 transition-transform duration-300">
                      <p className="font-label-caps text-[9px] text-bone-white tracking-wider font-semibold group-hover/row:text-clay-earth transition-colors">ZERO-WASTE PACKAGING</p>
                      <p className="font-body-md text-[10px] text-bone-white/60 mt-0.5 leading-relaxed">Delivered in traditional clay, brass, or certified compostable containers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
