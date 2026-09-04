import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Save, 
  RotateCw, 
  Calendar,
  Layers,
  Edit2,
  Check,
  X
} from 'lucide-react';

import { apiRequest } from '../services/api';

export default function CapacityTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Settings State
  const [maxDailyOrders, setMaxDailyOrders] = useState(50);
  const [autoStopOrders, setAutoStopOrders] = useState(true);
  const [allowOverbooking, setAllowOverbooking] = useState(false);

  // Today's Capacity Summary
  const [todaySummary, setTodaySummary] = useState({
    totalCapacity: 50,
    bookedCount: 0,
    remainingCapacity: 50,
    usagePercentage: 0,
    status: 'OPEN'
  });

  // Multi-day Capacity Schedule
  const [dailySchedule, setDailySchedule] = useState([]);

  // Editing state for day capacity table
  const [editingDateKey, setEditingDateKey] = useState(null);
  const [editingCapacityVal, setEditingCapacityVal] = useState(50);

  useEffect(() => {
    fetchCapacityFromDb();
    const interval = setInterval(fetchCapacityFromDb, 3000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchCapacityFromDb = async () => {
    try {
      const json = await apiRequest('/capacity');

      if (json.success && json.data) {
        if (json.data.today) {
          setTodaySummary(json.data.today);
        }
        if (Array.isArray(json.data.dailySchedule)) {
          setDailySchedule(json.data.dailySchedule);
        }
        if (json.data.settings) {
          setMaxDailyOrders(json.data.settings.maxDailyOrders ?? 50);
          setAutoStopOrders(json.data.settings.autoStopOrders ?? true);
          setAllowOverbooking(json.data.settings.allowOverbooking ?? false);
        }
      }
    } catch (err) {
      console.error('Error fetching capacity from DB:', err);
    }
  };

  // Save Settings to MongoDB
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const json = await apiRequest('/capacity/settings', {
        method: 'POST',
        body: JSON.stringify({
          maxDailyOrders: Number(maxDailyOrders),
          autoStopOrders: Boolean(autoStopOrders),
          allowOverbooking: Boolean(allowOverbooking)
        })
      });
      if (json.success) {
        showToast('✓ Saved Kitchen Capacity Settings successfully!');
        fetchCapacityFromDb();
      } else {
        showToast('⚠️ ' + (json.message || 'Failed to save settings'));
      }
    } catch (err) {
      console.error('Error saving capacity settings:', err);
      showToast('⚠️ Server connection error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Save specific date capacity limit
  const handleSaveDateCapacity = async (dateKey, newCap) => {
    try {
      const json = await apiRequest('/capacity/date', {
        method: 'PUT',
        body: JSON.stringify({
          date: dateKey,
          maxCapacity: Number(newCap)
        })
      });
      if (json.success) {
        showToast(`✓ Updated capacity to ${newCap} for ${dateKey}`);
        setEditingDateKey(null);
        fetchCapacityFromDb();
      }
    } catch (err) {
      console.error('Error updating date capacity:', err);
    }
  };

  const percentage = todaySummary.usagePercentage || 0;

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Operations</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Kitchen Capacity</span>
          </div>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Kitchen Capacity</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0A8B5F] border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage your daily cooking & order capacity in real time.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchCapacityFromDb}
            className="px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RotateCw size={14} className="text-[#0A8B5F]" />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: TODAY'S CAPACITY CARDS */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6">
        <div className="border-b border-[#E5ECE8] pb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">TODAY'S CAPACITY</h2>
          <span className="text-xs text-[#6B7280] font-bold">Real-time Live Order Integration</span>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Total Capacity */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Total Capacity</div>
            <div className="text-4xl font-black text-[#111827]">{todaySummary.totalCapacity}</div>
            <p className="text-[10px] text-[#6B7280] font-semibold mt-1">Maximum cooking limit today</p>
          </div>

          {/* Card 2: Orders Accepted */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Orders Accepted</div>
            <div className="text-4xl font-black text-[#0A8B5F]">{todaySummary.bookedCount}</div>
            <p className="text-[10px] text-[#0A8B5F] font-semibold mt-1">Confirmed orders placed in DB</p>
          </div>

          {/* Card 3: Remaining Capacity */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Remaining Capacity</div>
            <div className={`text-4xl font-black ${todaySummary.remainingCapacity > 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {todaySummary.remainingCapacity}
            </div>
            <p className="text-[10px] text-[#6B7280] font-semibold mt-1">
              {todaySummary.remainingCapacity > 0 ? 'Slots open for new orders' : 'Full capacity reached'}
            </p>
          </div>

        </div>

        {/* Capacity Usage Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-[#111827]">Capacity Usage</span>
            <span className="text-[#0A8B5F]">{percentage}%</span>
          </div>

          <div className="w-full h-4 bg-[#F4F7F5] rounded-full overflow-hidden p-0.5 border border-[#E5ECE8]">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#0A8B5F]'
              }`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: DAILY CAPACITY TABLE (Multi-day support) */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">DAILY CAPACITY</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Set different daily meal capacities per day of the week.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#111827]">
            <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Booked</th>
                <th className="p-4">Available</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8] font-bold">
              {dailySchedule.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#6B7280]">
                    Loading daily capacity schedule...
                  </td>
                </tr>
              ) : (
                dailySchedule.map((item) => {
                  const isEditing = editingDateKey === item.date;
                  return (
                    <tr key={item.date} className="hover:bg-[#F9FBF9] transition-colors">
                      <td className="p-4 font-black text-[#111827]">
                        {item.dateLabel} <span className="text-[10px] text-[#6B7280] font-normal">({item.date})</span>
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="number"
                              min="1"
                              max="500"
                              value={editingCapacityVal}
                              onChange={(e) => setEditingCapacityVal(Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black text-[#111827] focus:outline-none"
                            />
                            <button 
                              onClick={() => handleSaveDateCapacity(item.date, editingCapacityVal)}
                              className="p-1.5 bg-[#0A8B5F] text-white rounded-lg hover:bg-[#08734E] cursor-pointer"
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setEditingDateKey(null)}
                              className="p-1.5 bg-gray-200 text-[#111827] rounded-lg hover:bg-gray-300 cursor-pointer"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-black text-sm text-[#111827]">{item.maxCapacity}</span>
                        )}
                      </td>

                      <td className="p-4 text-[#0A8B5F] font-black text-sm">{item.bookedCount}</td>

                      <td className="p-4 font-black text-sm">
                        <span className={item.availableCapacity > 0 ? 'text-indigo-600' : 'text-red-600'}>
                          {item.availableCapacity}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                          item.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          ● {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        {!isEditing && (
                          <button 
                            onClick={() => {
                              setEditingDateKey(item.date);
                              setEditingCapacityVal(item.maxCapacity);
                            }}
                            className="px-3 py-1.5 bg-white border border-[#E5ECE8] hover:bg-gray-50 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <Edit2 size={13} className="text-[#0A8B5F]" />
                            <span>Manage</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: CAPACITY SETTINGS FORM */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6">
        <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider border-b border-[#E5ECE8] pb-3">
          CAPACITY SETTINGS
        </h2>

        <div className="space-y-5">
          {/* Setting 1: Maximum Daily Orders */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
            <div>
              <div className="text-xs font-black text-[#111827]">Maximum Daily Orders</div>
              <div className="text-[11px] text-[#6B7280] font-medium">Default daily cooking limit for your kitchen</div>
            </div>
            <div className="w-32">
              <input 
                type="number"
                min="1"
                max="1000"
                value={maxDailyOrders}
                onChange={e => setMaxDailyOrders(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-black text-[#111827] text-center focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>
          </div>

          {/* Setting 2: Auto Stop Orders */}
          <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
            <div>
              <div className="text-xs font-black text-[#111827]">Auto Stop Orders</div>
              <div className="text-[11px] text-[#6B7280] font-medium">Automatically stop accepting new order requests when capacity limit is reached</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoStopOrders(!autoStopOrders)}
              className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer ${autoStopOrders ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoStopOrders ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Setting 3: Stop Accepting Indicator */}
          <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
            <div>
              <div className="text-xs font-black text-[#111827]">Stop accepting when</div>
              <div className="text-[11px] text-[#6B7280] font-medium">Current booked ratio threshold for auto-pausing</div>
            </div>
            <div className="px-4 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-black text-[#0A8B5F]">
              [ {todaySummary.bookedCount} / {todaySummary.totalCapacity} ]
            </div>
          </div>

          {/* Setting 4: Allow Overbooking */}
          <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
            <div>
              <div className="text-xs font-black text-[#111827]">Allow Overbooking</div>
              <div className="text-[11px] text-[#6B7280] font-medium">Permit receiving orders even if maximum capacity limit is exceeded</div>
            </div>
            <button
              type="button"
              onClick={() => setAllowOverbooking(!allowOverbooking)}
              className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer ${allowOverbooking ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${allowOverbooking ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

    </div>
  );
}
