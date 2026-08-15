import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, Save, Compass } from 'lucide-react';

export default function ServiceAreaTab() {
  const [address, setAddress] = useState('102, Shivalik Plaza, CG Road');
  const [locality, setLocality] = useState('Satellite');
  const [city, setCity] = useState('Ahmedabad');
  const [radius, setRadius] = useState(4.0);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setToastMsg('✓ Service area coverage settings saved to database!');
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Operations</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">📍 Service Area</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Kitchen Service Area & Delivery Radius</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Set your kitchen location and maximum delivery distance to receive relevant nearby meal requests.</p>
        </div>

        <button 
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save Area</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Controls (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6">
          <h3 className="text-base font-black text-[#111827] border-b border-[#E5ECE8] pb-3">Kitchen Location Details</h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#6B7280]">Street Address / House No.</label>
              <input 
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Locality / Landmark</label>
                <input 
                  type="text"
                  value={locality}
                  onChange={e => setLocality(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">City</label>
                <input 
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>
            </div>
          </div>

          <h3 className="text-base font-black text-[#111827] border-b border-[#E5ECE8] pb-3 pt-2">Delivery Distance Coverage Radius</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#6B7280]">Maximum Delivery Radius</span>
              <span className="text-base font-black text-[#0A8B5F]">{radius} km</span>
            </div>

            <input 
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={radius}
              onChange={e => setRadius(parseFloat(e.target.value))}
              className="w-full accent-[#0A8B5F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6B7280] font-bold">
              <span>1 km (Strictly Local)</span>
              <span>5 km (Standard Radius)</span>
              <span>10 km (Extended City)</span>
            </div>
          </div>

          <h3 className="text-base font-black text-[#111827] border-b border-[#E5ECE8] pb-3 pt-2">Fulfillment Methods Available</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
              <div>
                <div className="text-xs font-black text-[#111827]">Home / Office Delivery</div>
                <div className="text-[11px] text-[#6B7280]">Delivery partner picks up and delivers to customer doorstep</div>
              </div>
              <input 
                type="checkbox"
                checked={deliveryAvailable}
                onChange={e => setDeliveryAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
              <div>
                <div className="text-xs font-black text-[#111827]">Customer Self-Pickup</div>
                <div className="text-[11px] text-[#6B7280]">Customer comes directly to your kitchen location to pick up</div>
              </div>
              <input 
                type="checkbox"
                checked={pickupAvailable}
                onChange={e => setPickupAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
            <button 
              type="submit"
              className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save size={15} />
              <span>Save Service Area</span>
            </button>
          </div>
        </div>

        {/* Right Interactive Coverage Preview Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-[#0A8B5F]" />
              <h3 className="text-sm font-black text-[#111827]">Active Service Radius Preview</h3>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center space-y-2">
              <MapPin size={24} className="text-[#0A8B5F] mx-auto animate-bounce" />
              <div>
                <div className="text-sm font-black text-[#111827]">{locality}, {city}</div>
                <div className="text-xs text-[#6B7280]">{address}</div>
              </div>
              <div className="inline-block px-3 py-1 bg-[#0A8B5F] text-white text-xs font-black rounded-full shadow-xs">
                {radius} km Radius Active
              </div>
            </div>

            <div className="text-[11px] text-[#6B7280] space-y-1.5 p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
              <div className="flex justify-between">
                <span>Coverage Area:</span>
                <strong className="text-[#111827]">{locality}, Paldi, Navrangpura</strong>
              </div>
              <div className="flex justify-between">
                <span>Avg Delivery ETA:</span>
                <strong className="text-[#0A8B5F]">25 – 35 mins</strong>
              </div>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
