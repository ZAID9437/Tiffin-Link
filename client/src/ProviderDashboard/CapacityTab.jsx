import React, { useState } from 'react';
import { Store, Sliders, CheckCircle2, ShieldCheck, AlertTriangle, Save } from 'lucide-react';

export default function CapacityTab() {
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [currentConfirmed, setCurrentConfirmed] = useState(32);
  const [autoPause, setAutoPause] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const remaining = Math.max(0, maxCapacity - currentConfirmed);
  const percentage = Math.min(100, Math.round((currentConfirmed / maxCapacity) * 100));

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setToastMsg('✓ Kitchen capacity limits updated successfully!');
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
            <span className="text-[#0A8B5F] font-extrabold">🏪 Kitchen Capacity</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Kitchen Capacity & Meal Limits</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Control your kitchen's daily meal preparation capacity to ensure high quality and prevent order overflow.</p>
        </div>

        <button 
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save Capacity</span>
        </button>
      </div>

      {/* Today's Live Capacity Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5ECE8] pb-4">
          <div>
            <h3 className="text-base font-black text-[#111827]">Today's Preparation Volume</h3>
            <p className="text-xs text-[#6B7280] font-medium">Real-time status of orders accepted vs daily limit.</p>
          </div>
          <span className={`px-3 py-1 text-xs font-black rounded-lg ${
            remaining > 0 ? 'bg-emerald-100 text-[#0A8B5F] border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'
          }`}>
            {remaining > 0 ? `🟢 ${remaining} Slots Available` : '🔴 Kitchen Full (Limit Reached)'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-[#111827]">{currentConfirmed} <span className="text-xs text-[#6B7280] font-normal">/ {maxCapacity} meals confirmed</span></span>
            <span className="text-sm font-black text-[#0A8B5F]">{percentage}% Capacity</span>
          </div>

          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-[#E5ECE8]">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-[#0A8B5F]'
              }`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {remaining <= 5 && remaining > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Capacity Warning: You have only {remaining} meal slots remaining today!</span>
          </div>
        )}
      </div>

      {/* Capacity Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6">
        <h3 className="text-base font-black text-[#111827] border-b border-[#E5ECE8] pb-3">Daily Capacity Rules</h3>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#6B7280]">Daily Max Meal Capacity Limit</label>
            <input 
              type="number"
              value={maxCapacity}
              onChange={e => setMaxCapacity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
            <p className="text-[10px] text-[#6B7280]">Maximum number of tiffins your kitchen can cook and package per day.</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
            <div>
              <div className="text-xs font-black text-[#111827]">Auto-Pause Requests when Limit Reached</div>
              <div className="text-[11px] text-[#6B7280]">Automatically stop receiving new order requests once capacity reaches {maxCapacity} meals</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoPause(!autoPause)}
              className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${autoPause ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoPause ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
          <button 
            type="submit"
            className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
          >
            <Save size={15} />
            <span>Save Capacity Preferences</span>
          </button>
        </div>
      </form>

    </div>
  );
}
