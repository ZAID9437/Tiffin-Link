import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, Save, Sun, Moon } from 'lucide-react';

export default function ScheduleTab() {
  const [weeklySchedule, setWeeklySchedule] = useState({
    MON: { active: true, lunch: true, dinner: true },
    TUE: { active: true, lunch: true, dinner: true },
    WED: { active: true, lunch: true, dinner: true },
    THU: { active: true, lunch: true, dinner: true },
    FRI: { active: true, lunch: true, dinner: true },
    SAT: { active: true, lunch: true, dinner: false },
    SUN: { active: false, lunch: false, dinner: false }
  });

  const [lunchTime, setLunchTime] = useState({ opens: '11:30', closes: '14:30', cap: 25 });
  const [dinnerTime, setDinnerTime] = useState({ opens: '18:00', closes: '21:00', cap: 25 });
  const [toastMsg, setToastMsg] = useState('');

  const toggleDay = (day) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active }
    }));
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setToastMsg('✓ Kitchen operating schedule updated successfully!');
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
            <span className="text-[#0A8B5F] font-extrabold">📅 Schedule</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Kitchen Operating Schedule & Meal Windows</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Configure your weekly operating days, lunch/dinner time slots, and prep limits.</p>
        </div>

        <button 
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save Schedule</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Weekly Day Toggles Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <h3 className="text-base font-black text-[#111827] border-b border-[#E5ECE8] pb-3">Weekly Operating Days</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.keys(weeklySchedule).map(day => {
              const item = weeklySchedule[day];
              return (
                <div 
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-center space-y-2 ${
                    item.active 
                      ? 'bg-emerald-50/80 border-[#C5DDD2] text-[#0A8B5F] shadow-xs' 
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="text-sm font-black">{day}</div>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded-md ${
                    item.active ? 'bg-[#0A8B5F] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.active ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meal Time Windows (Lunch & Dinner) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Lunch Window */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E5ECE8] pb-3">
              <Sun size={18} className="text-amber-500" />
              <h3 className="text-base font-black text-[#111827]">Lunch Meal Window</h3>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Slot Start Time</label>
                  <input 
                    type="time"
                    value={lunchTime.opens}
                    onChange={e => setLunchTime({ ...lunchTime, opens: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Slot End Time</label>
                  <input 
                    type="time"
                    value={lunchTime.closes}
                    onChange={e => setLunchTime({ ...lunchTime, closes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Max Lunch Meal Capacity</label>
                <input 
                  type="number"
                  value={lunchTime.cap}
                  onChange={e => setLunchTime({ ...lunchTime, cap: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>
            </div>
          </div>

          {/* Dinner Window */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E5ECE8] pb-3">
              <Moon size={18} className="text-indigo-500" />
              <h3 className="text-base font-black text-[#111827]">Dinner Meal Window</h3>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Slot Start Time</label>
                  <input 
                    type="time"
                    value={dinnerTime.opens}
                    onChange={e => setDinnerTime({ ...dinnerTime, opens: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B7280]">Slot End Time</label>
                  <input 
                    type="time"
                    value={dinnerTime.closes}
                    onChange={e => setDinnerTime({ ...dinnerTime, closes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Max Dinner Meal Capacity</label>
                <input 
                  type="number"
                  value={dinnerTime.cap}
                  onChange={e => setDinnerTime({ ...dinnerTime, cap: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
          <button 
            type="submit"
            className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
          >
            <Save size={15} />
            <span>Save Operating Schedule</span>
          </button>
        </div>
      </form>

    </div>
  );
}
