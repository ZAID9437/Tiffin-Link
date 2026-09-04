import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function MealRequestForm({ onSubmitRequestSuccess }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    mealType: 'Veg Tiffin',
    date: todayStr,
    time: '13:00',
    deliveryType: 'Delivery',
    location: 'Satellite, Ahmedabad',
    budget: '140'
  });
  const [loading, setLoading] = useState(false);
  const [isMealTypeOpen, setIsMealTypeOpen] = useState(false);
  const [isDeliveryTypeOpen, setIsDeliveryTypeOpen] = useState(false);
  const mealTypeRef = useRef(null);
  const deliveryTypeRef = useRef(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('tiffinlink_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setFormData(prev => ({
          ...prev,
          customerName: u.name || prev.customerName,
          customerPhone: u.phone || prev.customerPhone
        }));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mealTypeRef.current && !mealTypeRef.current.contains(event.target)) {
        setIsMealTypeOpen(false);
      }
      if (deliveryTypeRef.current && !deliveryTypeRef.current.contains(event.target)) {
        setIsDeliveryTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mealType || !formData.date || !formData.time || !formData.deliveryType || !formData.location || !formData.budget) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName || 'Customer Diner',
          customerPhone: formData.customerPhone || '+91 98250 99881',
          mealType: formData.mealType,
          date: formData.date,
          time: formData.time,
          deliveryType: formData.deliveryType,
          location: formData.location,
          budget: Number(formData.budget),
          category: formData.mealType.includes('Jain') ? 'Jain' : (formData.mealType.includes('Non-Veg') ? 'Non-Veg' : 'Gujarati')
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Trigger confetti for premium feel
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1A1A1A', '#4A4238', '#DED9D1']
        });
        
        if (onSubmitRequestSuccess) {
          onSubmitRequestSuccess();
        }
      }
    } catch (error) {
      console.error('Request submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-section-gap pb-12 px-margin-desktop bg-bone-white">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left column: Title and form */}
        <div className="md:col-span-5 reveal-on-scroll">
          <p className="font-label-caps text-label-caps text-secondary mb-8">KITCHEN CONCIERGE</p>
          <h2 className="font-headline-lg text-headline-lg mb-12">Design your dining experience.</h2>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              {/* MEAL TYPE */}
              <div ref={mealTypeRef} className="border-b border-sand-neutral pb-4 group relative">
                <label className="font-label-caps text-label-caps text-secondary transition-colors">MEAL TYPE</label>
                <div 
                  onClick={() => setIsMealTypeOpen(!isMealTypeOpen)}
                  className="w-full flex justify-between items-center py-2 cursor-pointer text-body-lg font-body-lg text-onyx-black select-none"
                >
                  <span>{formData.mealType}</span>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isMealTypeOpen ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                  </span>
                </div>
                
                {isMealTypeOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-[#fbf9f5] border border-clay-earth/20 shadow-lg z-[100] transition-all duration-300 max-h-60 overflow-y-auto">
                    {[
                      'Veg Tiffin',
                      'Non-Veg Tiffin',
                      'Jain Tiffin',
                      'Organic Salad',
                      'Custom Meal'
                    ].map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setFormData({ ...formData, mealType: option });
                          setIsMealTypeOpen(false);
                        }}
                        className={`px-4 py-3 text-left hover:bg-clay-earth/10 transition-colors text-body-md font-body-md cursor-pointer ${
                          formData.mealType === option ? 'bg-clay-earth/5 font-semibold text-primary' : 'text-secondary'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DATE */}
              <div className="border-b border-sand-neutral pb-4 group">
                <label className="font-label-caps text-label-caps text-secondary group-focus-within:text-onyx-black transition-colors">DATE</label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-lg font-body-lg text-onyx-black"
                  required
                />
              </div>

              {/* TIME */}
              <div className="border-b border-sand-neutral pb-4 group">
                <label className="font-label-caps text-label-caps text-secondary group-focus-within:text-onyx-black transition-colors">TIME</label>
                <input 
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-lg font-body-lg text-onyx-black"
                  required
                />
              </div>

              {/* DELIVERY/PICKUP */}
              <div ref={deliveryTypeRef} className="border-b border-sand-neutral pb-4 group relative">
                <label className="font-label-caps text-label-caps text-secondary transition-colors">DELIVERY/PICKUP</label>
                <div 
                  onClick={() => setIsDeliveryTypeOpen(!isDeliveryTypeOpen)}
                  className="w-full flex justify-between items-center py-2 cursor-pointer text-body-lg font-body-lg text-onyx-black select-none"
                >
                  <span>{formData.deliveryType}</span>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isDeliveryTypeOpen ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                  </span>
                </div>
                
                {isDeliveryTypeOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-[#fbf9f5] border border-clay-earth/20 shadow-lg z-[100] transition-all duration-300">
                    {[
                      'Delivery',
                      'Pickup'
                    ].map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setFormData({ ...formData, deliveryType: option });
                          setIsDeliveryTypeOpen(false);
                        }}
                        className={`px-4 py-3 text-left hover:bg-clay-earth/10 transition-colors text-body-md font-body-md cursor-pointer ${
                          formData.deliveryType === option ? 'bg-clay-earth/5 font-semibold text-primary' : 'text-secondary'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LOCATION */}
              <div className="border-b border-sand-neutral pb-4 group">
                <label className="font-label-caps text-label-caps text-secondary group-focus-within:text-onyx-black transition-colors">LOCATION</label>
                <input 
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Iscon Circle, Ahmedabad"
                  className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-lg font-body-lg text-onyx-black placeholder:opacity-30"
                  required
                />
              </div>

              {/* BUDGET */}
              <div className="border-b border-sand-neutral pb-4 group">
                <label className="font-label-caps text-label-caps text-secondary group-focus-within:text-onyx-black transition-colors">BUDGET (₹ PER MEAL)</label>
                <input 
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="100"
                  className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-lg font-body-lg text-onyx-black placeholder:opacity-30"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-onyx-black text-bone-white py-6 font-button-text transition-all duration-500 hover:bg-clay-earth hover:tracking-widest scale-100 active:scale-95 disabled:opacity-50 magnetic"
            >
              {loading ? 'FINDING PROVIDERS...' : 'FIND PROVIDERS'}
            </button>
          </form>
        </div>

        {/* Right column: Video */}
        <div className="md:col-span-6 md:col-start-7 reveal-on-scroll flex items-center">
          <div className="aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(74,66,56,0.12)] border border-clay-earth/20 relative group/video">
            {/* Inner Gold Frame */}
            <div className="absolute inset-2 border border-clay-earth/10 pointer-events-none rounded-[20px] z-10 animate-fade-in" />
            
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              className="w-full h-full object-cover select-none transform hover:scale-[1.02] transition-transform duration-700 cursor-pointer"
            >
              <source src="/make_one_video_for_Indian_food.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
