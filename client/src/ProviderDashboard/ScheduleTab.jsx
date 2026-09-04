import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Save, 
  RotateCw, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle,
  Sun,
  Moon,
  Coffee,
  X,
  Check
} from 'lucide-react';

export default function ScheduleTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Today's Status State
  const [todayStatus, setTodayStatus] = useState({
    isOpen: true,
    statusText: 'OPEN',
    closedReason: '',
    currentDay: 'Monday',
    currentSlot: 'Lunch (12:00–3:00 PM)',
    ordersStatusText: 'OPEN Until 11:30 AM'
  });

  // Weekly Schedule State (7 Days)
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 'Monday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
    { day: 'Tuesday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
    { day: 'Wednesday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
    { day: 'Thursday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
    { day: 'Friday', isOpen: true, openTime: '09:00 AM', closeTime: '09:00 PM' },
    { day: 'Saturday', isOpen: true, openTime: '09:00 AM', closeTime: '10:00 PM' },
    { day: 'Sunday', isOpen: false, openTime: '09:00 AM', closeTime: '09:00 PM' }
  ]);

  // Order Windows State
  const [orderWindows, setOrderWindows] = useState([
    { name: 'Breakfast', icon: '🍱', cutoffTime: '08:30 AM', deliveryStartTime: '09:00 AM', deliveryEndTime: '11:00 AM', isActive: true },
    { name: 'Lunch', icon: '🍛', cutoffTime: '11:30 AM', deliveryStartTime: '12:00 PM', deliveryEndTime: '03:00 PM', isActive: true },
    { name: 'Dinner', icon: '🌙', cutoffTime: '07:30 PM', deliveryStartTime: '08:00 PM', deliveryEndTime: '10:00 PM', isActive: true }
  ]);

  // Special Holiday Overrides
  const [specialDates, setSpecialDates] = useState([]);

  // Modal & Edit States
  const [editingDay, setEditingDay] = useState(null);
  const [editOpenTime, setEditOpenTime] = useState('09:00 AM');
  const [editCloseTime, setEditCloseTime] = useState('09:00 PM');

  const [editingWindowName, setEditingWindowName] = useState(null);
  const [editCutoff, setEditCutoff] = useState('11:30 AM');
  const [editDeliveryStart, setEditDeliveryStart] = useState('12:00 PM');
  const [editDeliveryEnd, setEditDeliveryEnd] = useState('03:00 PM');

  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState(false);
  const [newDateVal, setNewDateVal] = useState('');
  const [newReasonVal, setNewReasonVal] = useState('Holiday');

  useEffect(() => {
    fetchScheduleFromDb();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchScheduleFromDb = async () => {
    try {
      setLoading(true);
      const json = await apiRequest('/schedule');

      if (json.success && json.data) {
        if (json.data.todayStatus) {
          setTodayStatus(json.data.todayStatus);
        }
        if (Array.isArray(json.data.weeklySchedule)) {
          setWeeklySchedule(json.data.weeklySchedule);
        }
        if (Array.isArray(json.data.orderWindows)) {
          setOrderWindows(json.data.orderWindows);
        }
        if (Array.isArray(json.data.specialDates)) {
          setSpecialDates(json.data.specialDates);
        }
      }
    } catch (err) {
      console.error('Error fetching schedule data from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Complete Schedule Settings to MongoDB
  const handleSaveAllSchedule = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const json = await apiRequest('/schedule/settings', {
        method: 'POST',
        body: JSON.stringify({
          weeklySchedule,
          orderWindows,
          specialDates
        })
      });
      if (json.success) {
        showToast('✓ Saved Kitchen Schedule & Order Windows!');
        fetchScheduleFromDb();
      } else {
        showToast('⚠️ ' + (json.message || 'Failed to save schedule'));
      }
    } catch (err) {
      console.error('Error saving schedule settings:', err);
      showToast('⚠️ Connection error saving schedule');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Day Open/Closed Status
  const handleToggleDayOpen = (dayName) => {
    const updated = weeklySchedule.map(item => {
      if (item.day === dayName) {
        return { ...item, isOpen: !item.isOpen };
      }
      return item;
    });
    setWeeklySchedule(updated);
    showToast(`Updated ${dayName} status`);
  };

  // Save Day Hours Edit
  const handleSaveDayHours = (dayName) => {
    const updated = weeklySchedule.map(item => {
      if (item.day === dayName) {
        return { ...item, openTime: editOpenTime, closeTime: editCloseTime };
      }
      return item;
    });
    setWeeklySchedule(updated);
    setEditingDay(null);
    showToast(`✓ Updated ${dayName} working hours`);
  };

  // Save Order Window Edit
  const handleSaveWindowEdit = (winName) => {
    const updated = orderWindows.map(w => {
      if (w.name === winName) {
        return {
          ...w,
          cutoffTime: editCutoff,
          deliveryStartTime: editDeliveryStart,
          deliveryEndTime: editDeliveryEnd
        };
      }
      return w;
    });
    setOrderWindows(updated);
    setEditingWindowName(null);
    showToast(`✓ Updated ${winName} window & cutoff time`);
  };

  // Add Special Holiday Date
  const handleAddSpecialDate = async (e) => {
    if (e) e.preventDefault();
    if (!newDateVal.trim()) {
      showToast('⚠️ Please enter a valid date');
      return;
    }

    try {
      const json = await apiRequest('/schedule/special-date', {
        method: 'POST',
        body: JSON.stringify({
          date: newDateVal.trim(),
          reason: newReasonVal.trim() || 'Holiday',
          status: 'CLOSED'
        })
      });
      if (json.success) {
        showToast(`✓ Added ${newDateVal} to holiday overrides!`);
        setIsAddDateModalOpen(false);
        setNewDateVal('');
        setNewReasonVal('Holiday');
        fetchScheduleFromDb();
      }
    } catch (err) {
      console.error('Error adding special date:', err);
    }
  };

  // Delete Special Date
  const handleDeleteSpecialDate = async (id, dateStr) => {
    if (!window.confirm(`Are you sure you want to remove ${dateStr} from special dates?`)) return;
    try {
      const json = await apiRequest(`/schedule/special-date/${id}`, {
        method: 'DELETE'
      });
      if (json.success) {
        showToast(`✓ Removed ${dateStr} from special dates`);
        fetchScheduleFromDb();
      }
    } catch (err) {
      console.error('Error deleting special date:', err);
    }
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

      {/* Page Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Operations</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Schedule</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Schedule</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0A8B5F] border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage your kitchen hours, order windows & holidays.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchScheduleFromDb}
            className="px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RotateCw size={14} className="text-[#0A8B5F]" />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleSaveAllSchedule}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: TODAY'S STATUS CARDS */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="border-b border-[#E5ECE8] pb-3">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">TODAY'S STATUS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Kitchen Status */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Kitchen Status</div>
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${todayStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-2xl font-black ${todayStatus.isOpen ? 'text-emerald-700' : 'text-red-600'}`}>
                ● {todayStatus.statusText}
              </span>
            </div>
            {todayStatus.closedReason && (
              <p className="text-[10px] text-red-600 font-bold mt-1">({todayStatus.closedReason})</p>
            )}
          </div>

          {/* Card 2: Current Slot */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Current Slot</div>
            <div className="text-2xl font-black text-[#111827]">{todayStatus.currentSlot}</div>
            <p className="text-[10px] text-[#0A8B5F] font-semibold mt-1">Active Meal Window</p>
          </div>

          {/* Card 3: Orders Status & Cutoff */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Orders</div>
            <div className="text-2xl font-black text-[#0A8B5F]">{todayStatus.ordersStatusText}</div>
            <p className="text-[10px] text-[#6B7280] font-semibold mt-1">Order Cutoff System Enforced</p>
          </div>

        </div>
      </div>

      {/* SECTION 2: WEEKLY SCHEDULE */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="border-b border-[#E5ECE8] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">WEEKLY SCHEDULE</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Set daily opening & closing hours for your kitchen.</p>
          </div>
          <button
            type="button"
            onClick={handleSaveAllSchedule}
            className="text-xs text-[#0A8B5F] font-black hover:underline cursor-pointer"
          >
            Save All Days
          </button>
        </div>

        <div className="divide-y divide-[#E5ECE8]">
          {weeklySchedule.map((item) => {
            const isEditing = editingDay === item.day;
            return (
              <div key={item.day} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FBF9] px-2 rounded-xl transition-colors">
                
                {/* Day Name */}
                <div className="w-32 font-black text-sm text-[#111827]">
                  {item.day}
                </div>

                {/* Hours Display / Editor */}
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input 
                        type="text" 
                        value={editOpenTime}
                        onChange={e => setEditOpenTime(e.target.value)}
                        className="w-24 px-2.5 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black"
                        placeholder="09:00 AM"
                      />
                      <span className="text-xs text-[#6B7280]">to</span>
                      <input 
                        type="text" 
                        value={editCloseTime}
                        onChange={e => setEditCloseTime(e.target.value)}
                        className="w-24 px-2.5 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black"
                        placeholder="09:00 PM"
                      />
                      <button 
                        onClick={() => handleSaveDayHours(item.day)}
                        className="p-1.5 bg-[#0A8B5F] text-white rounded-lg cursor-pointer ml-1"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => setEditingDay(null)}
                        className="p-1.5 bg-gray-200 text-[#111827] rounded-lg cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-[#111827]">
                      {item.isOpen ? `${item.openTime} – ${item.closeTime}` : <span className="text-red-500 font-extrabold">Closed</span>}
                    </div>
                  )}
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleDayOpen(item.day)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border cursor-pointer transition-all ${
                      item.isOpen 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    ● {item.isOpen ? 'OPEN' : 'CLOSED'}
                  </button>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDay(item.day);
                        setEditOpenTime(item.openTime);
                        setEditCloseTime(item.closeTime);
                      }}
                      className="px-3 py-1 bg-white border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Edit3 size={13} className="text-[#0A8B5F]" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ORDER WINDOWS */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="border-b border-[#E5ECE8] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">ORDER WINDOWS</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Meal specific ordering cutoff times and delivery slots.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {orderWindows.map((win) => {
            const isEditingWin = editingWindowName === win.name;
            return (
              <div key={win.name} className="p-5 bg-[#F9FBF9] rounded-2xl border border-[#E5ECE8] space-y-3 relative">
                <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{win.icon || '🍱'}</span>
                    <span className="text-sm font-black text-[#111827]">{win.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ● ACTIVE
                  </span>
                </div>

                {isEditingWin ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-[#6B7280]">Cutoff Time</label>
                      <input 
                        type="text"
                        value={editCutoff}
                        onChange={e => setEditCutoff(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6B7280]">Delivery Start</label>
                      <input 
                        type="text"
                        value={editDeliveryStart}
                        onChange={e => setEditDeliveryStart(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6B7280]">Delivery End</label>
                      <input 
                        type="text"
                        value={editDeliveryEnd}
                        onChange={e => setEditDeliveryEnd(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setEditingWindowName(null)}
                        className="px-3 py-1 bg-gray-200 text-[#111827] text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleSaveWindowEdit(win.name)}
                        className="px-3 py-1 bg-[#0A8B5F] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Save Window
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Order Until:</span>
                      <strong className="text-red-600 font-black">{win.cutoffTime}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Delivery:</span>
                      <strong className="text-[#111827]">{win.deliveryStartTime} – {win.deliveryEndTime}</strong>
                    </div>

                    <div className="pt-2 border-t border-[#E5ECE8] flex justify-end">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingWindowName(win.name);
                          setEditCutoff(win.cutoffTime);
                          setEditDeliveryStart(win.deliveryStartTime);
                          setEditDeliveryEnd(win.deliveryEndTime);
                        }}
                        className="text-xs text-[#0A8B5F] font-black hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 size={12} />
                        <span>Edit Window</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: SPECIAL DATES / HOLIDAYS */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">SPECIAL DATES / HOLIDAYS</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Holiday and festival date overrides for kitchen closing.</p>
          </div>

          <button 
            type="button"
            onClick={() => setIsAddDateModalOpen(true)}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Add Special Date</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#111827]">
            <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8] font-bold">
              {specialDates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[#6B7280]">
                    No special holiday dates configured. Click "+ Add Special Date" to add one.
                  </td>
                </tr>
              ) : (
                specialDates.map((item) => (
                  <tr key={item._id || item.date} className="hover:bg-[#F9FBF9] transition-colors">
                    <td className="p-4 font-black text-[#111827]">
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-red-500" />
                        <span>{item.date}</span>
                      </div>
                    </td>

                    <td className="p-4 text-[#6B7280]">
                      {item.reason}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                        ● {item.status || 'CLOSED'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteSpecialDate(item._id || item.date, item.date)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding Special Holiday Date */}
      {isAddDateModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#E5ECE8] animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-black text-[#111827]">Add Special Holiday Date</h3>
              <button 
                onClick={() => setIsAddDateModalOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#111827] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSpecialDate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Date (E.g. 18 Aug, 25 Aug, 2026-08-20)</label>
                <input 
                  type="text"
                  placeholder="18 Aug"
                  value={newDateVal}
                  onChange={e => setNewDateVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Reason / Occasion</label>
                <input 
                  type="text"
                  placeholder="E.g., Festival, Kitchen Cleaning, Public Holiday"
                  value={newReasonVal}
                  onChange={e => setNewReasonVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5ECE8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Add Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
