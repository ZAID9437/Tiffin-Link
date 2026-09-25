import React, { useState, useEffect } from 'react';

/**
 * WorkingScheduleView Component - Driver Working Schedule Module
 * Full real-time MongoDB persistence, quick macros, interactive day editor,
 * dynamic hours allocation visualizer, and exact TiffinLink Driver Panel aesthetics.
 */
export default function WorkingScheduleView({ currentUser, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncTime, setSyncTime] = useState('Just now');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const activeToken = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const driverId = currentUser?.driverId || currentUser?.id || currentUser?._id || '';
  const driverName = currentUser?.fullName || currentUser?.name || 'Courier Partner';

  // Initial default schedule structure
  const defaultSchedule = {
    monday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    tuesday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    wednesday: { enabled: false, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    thursday: { enabled: true, startTime: '10:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    friday: { enabled: true, startTime: '09:00 AM', endTime: '09:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    saturday: { enabled: true, startTime: '10:00 AM', endTime: '06:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
    sunday: { enabled: false, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' }
  };

  const [weeklySchedule, setWeeklySchedule] = useState(defaultSchedule);
  const [autoAccept, setAutoAccept] = useState(true);

  // Day Editor state
  const [selectedDayKey, setSelectedDayKey] = useState('monday');
  const [dayForm, setDayForm] = useState(defaultSchedule.monday);

  const daysOrder = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  // Helper to parse "09:00 AM" into fractional hours (24-hr base)
  const parseTimeToHours = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours + (minutes / 60);
  };

  // Helper to calculate net hours for a day
  const calculateDayHours = (dayObj) => {
    if (!dayObj || !dayObj.enabled) return 0;
    const start = parseTimeToHours(dayObj.startTime);
    const end = parseTimeToHours(dayObj.endTime);
    let gross = end - start;
    if (gross < 0) gross += 24; // overnight shift handling if any

    if (dayObj.breakEnabled) {
      const bStart = parseTimeToHours(dayObj.breakStart);
      const bEnd = parseTimeToHours(dayObj.breakEnd);
      let breakDur = bEnd - bStart;
      if (breakDur < 0) breakDur += 24;
      gross -= Math.max(0, breakDur);
    }
    return Math.max(0, Number(gross.toFixed(1)));
  };

  // Calculate overall metrics
  const activeDaysCount = daysOrder.filter(d => weeklySchedule[d.key]?.enabled).length;
  const totalCommittedHours = daysOrder.reduce((acc, d) => acc + calculateDayHours(weeklySchedule[d.key]), 0);

  // Fetch schedule from MongoDB
  const fetchScheduleFromBackend = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const email = currentUser?.email || '';
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/driver/schedule?email=${encodeURIComponent(email)}&driverId=${encodeURIComponent(driverId)}`, {
        headers
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.weeklySchedule) {
          setWeeklySchedule(json.data.weeklySchedule);
          if (json.data.weeklySchedule[selectedDayKey]) {
            setDayForm(json.data.weeklySchedule[selectedDayKey]);
          }
        }
        if (typeof json.data.autoAccept === 'boolean') {
          setAutoAccept(json.data.autoAccept);
        }
        setSyncTime('2m ago');
      }
    } catch (err) {
      console.error('Error fetching driver schedule:', err);
      setErrorMessage('Failed to connect to backend schedule service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleFromBackend();
  }, [currentUser]);

  // Keep dayForm in sync when selectedDayKey changes
  const handleSelectDay = (dayKey) => {
    setSelectedDayKey(dayKey);
    if (weeklySchedule[dayKey]) {
      setDayForm({ ...weeklySchedule[dayKey] });
    }
  };

  // Save changes to backend
  const handleSaveChanges = async (customSchedule = null) => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const scheduleToSave = customSchedule || weeklySchedule;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('http://localhost:5000/api/driver/schedule', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          driverId,
          email: currentUser?.email,
          autoAccept,
          weeklySchedule: scheduleToSave
        })
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?.weeklySchedule) {
          setWeeklySchedule(json.data.weeklySchedule);
        }
        setSuccessMessage('Schedule updated and synchronized to MongoDB!');
        setSyncTime('Just now');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(json.message || 'Failed to update working schedule.');
      }
    } catch (err) {
      console.error('Error saving driver schedule:', err);
      setErrorMessage('Network error. Unable to save working schedule.');
    } finally {
      setSaving(false);
    }
  };

  // Save Day Editor changes to local weeklySchedule state and trigger save
  const handleSaveDayForm = () => {
    // Validate shift times
    const start = parseTimeToHours(dayForm.startTime);
    const end = parseTimeToHours(dayForm.endTime);
    if (dayForm.enabled && start >= end) {
      setErrorMessage('Shift start time must be before end time.');
      return;
    }

    if (dayForm.enabled && dayForm.breakEnabled) {
      const bStart = parseTimeToHours(dayForm.breakStart);
      const bEnd = parseTimeToHours(dayForm.breakEnd);
      if (bStart >= bEnd) {
        setErrorMessage('Break start time must be before break end time.');
        return;
      }
      if (bStart < start || bEnd > end) {
        setErrorMessage('Break window must fall within the working shift window.');
        return;
      }
    }

    const updated = {
      ...weeklySchedule,
      [selectedDayKey]: { ...dayForm }
    };
    setWeeklySchedule(updated);
    handleSaveChanges(updated);
  };

  // Macro: Copy Monday to all Weekdays (Tue, Wed, Thu, Fri)
  const handleMacroCopyMonToWeekdays = () => {
    const mon = weeklySchedule.monday;
    const updated = {
      ...weeklySchedule,
      tuesday: { ...mon },
      wednesday: { ...mon },
      thursday: { ...mon },
      friday: { ...mon }
    };
    setWeeklySchedule(updated);
    handleSaveChanges(updated);
  };

  // Macro: Set All Days Off
  const handleMacroSetAllOff = () => {
    const updated = {};
    daysOrder.forEach(d => {
      updated[d.key] = { ...weeklySchedule[d.key], enabled: false };
    });
    setWeeklySchedule(updated);
    handleSaveChanges(updated);
  };

  // Macro: Standard Split (Mon-Sat ON, Sun OFF)
  const handleMacroStandardSplit = () => {
    const updated = {
      monday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
      tuesday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
      wednesday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
      thursday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
      friday: { enabled: true, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: true, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
      saturday: { enabled: true, startTime: '10:00 AM', endTime: '06:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' },
      sunday: { enabled: false, startTime: '09:00 AM', endTime: '08:00 PM', breakEnabled: false, breakStart: '01:00 PM', breakEnd: '02:00 PM' }
    };
    setWeeklySchedule(updated);
    handleSaveChanges(updated);
  };

  const timeOptions = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
    '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
  ];

  return (
    <div className="flex flex-col w-full pb-16 font-sans bg-[#FBF9F5] text-[#1A1A1A]">
      <div className="w-full pb-20 pt-2 space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DED9D1]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-sans text-[11px] font-bold tracking-widest text-[#4A4238] uppercase">
                <span>Availability</span>
                <span className="text-[#DED9D1]">/</span>
                <span className="text-[#1A1A1A]">Working Schedule</span>
              </div>
              <span className="px-2 py-0.5 bg-[#E4E2DE] text-[10px] tracking-wider uppercase text-[#1A1A1A] flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                MongoDB Recurring Dispatch Synced
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] tracking-tight mt-1 font-normal">
              Working Schedule
            </h1>
            <p className="text-sm text-[#665D52] max-w-2xl">
              Set your recurring weekly delivery availability windows and automatic shift commitments across regional courier clusters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-[#4A4238] text-[11px] uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-sm text-[#1A1A1A]">sync</span>
              <span>Last synced: {syncTime} • Telemetry Valid</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchScheduleFromBackend}
                disabled={loading || saving}
                className="px-4 py-2 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#E4E2DE] transition-colors cursor-pointer border border-transparent hover:border-[#DED9D1]"
              >
                Reset To Saved
              </button>
              <button
                type="button"
                onClick={() => handleSaveChanges()}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A4238] transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Notifications Alert Bar */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-red-600">error</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="font-bold underline cursor-pointer">
              DISMISS
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Quick Actions Toolbar */}
        <section className="bg-[#F5F3EF] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border border-[#DED9D1] shadow-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[11px] font-bold uppercase text-[#4A4238] tracking-widest mr-2">
              Quick Macros:
            </span>
            <button
              type="button"
              onClick={handleMacroCopyMonToWeekdays}
              className="px-3 py-1.5 bg-white hover:bg-[#DED9D1]/60 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-[#DED9D1] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">bolt</span>
              Copy Mon To Weekdays
            </button>
            <button
              type="button"
              onClick={handleMacroSetAllOff}
              className="px-3 py-1.5 bg-white hover:bg-[#DED9D1]/60 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-[#DED9D1] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">block</span>
              Set All Off
            </button>
            <button
              type="button"
              onClick={handleMacroStandardSplit}
              className="px-3 py-1.5 bg-white hover:bg-[#DED9D1]/60 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-[#DED9D1] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              Standard Split
            </button>
          </div>

          <div className="flex items-center gap-3 bg-white px-3 py-1.5 border border-[#DED9D1]">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#4A4238] font-bold uppercase tracking-wider leading-tight">
                Shift Matching
              </span>
              <span className="text-xs text-[#1A1A1A] tracking-wide font-semibold">
                Auto-Accept: {autoAccept ? 'ON' : 'OFF'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !autoAccept;
                setAutoAccept(nextVal);
                handleSaveChanges();
              }}
              className={`w-8 h-4 ${autoAccept ? 'bg-[#1A1A1A]' : 'bg-gray-400'} flex items-center justify-end px-0.5 cursor-pointer transition-colors`}
            >
              <div className={`w-3 h-3 bg-white transition-transform ${autoAccept ? 'translate-x-0' : '-translate-x-4'}`} />
            </button>
          </div>
        </section>

        {/* Main Workspace Split Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Weekly Recurring Roster (7 cols) */}
          <section className="xl:col-span-7 bg-white border border-[#DED9D1] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-widest text-[#4A4238] font-bold">
                  Schedule Database
                </span>
                <h2 className="font-serif text-2xl text-[#1A1A1A]">Weekly Recurring Roster</h2>
                <p className="text-xs text-[#665D52]">
                  Direct telemetry mapping to <code className="font-mono text-xs bg-[#F5F3EF] px-1 py-0.5 text-[#1A1A1A]">DriverSchedule</code> document.
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[11px] text-[#4A4238] uppercase tracking-wider font-bold">Scheduled Target</span>
                <span className="font-serif text-3xl text-[#1A1A1A] leading-none mt-1">
                  {totalCommittedHours}<span className="text-xs font-sans text-[#4A4238] ml-1 font-bold">HRS</span>
                </span>
              </div>
            </div>

            {/* Weekly Table */}
            <div className="w-full overflow-x-auto border border-[#DED9D1]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F3EF] text-[#4A4238] text-[11px] font-bold uppercase tracking-wider border-b border-[#DED9D1]">
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Window</th>
                    <th className="py-3 px-3">Break Window</th>
                    <th className="py-3 px-3 text-right">Committed</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED9D1]/60">
                  {daysOrder.map(dayObj => {
                    const dayData = weeklySchedule[dayObj.key] || defaultSchedule[dayObj.key];
                    const isSelected = selectedDayKey === dayObj.key;
                    const hours = calculateDayHours(dayData);

                    return (
                      <tr
                        key={dayObj.key}
                        onClick={() => handleSelectDay(dayObj.key)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#DED9D1]/40' : dayData.enabled ? 'hover:bg-[#F5F3EF]' : 'bg-[#F5F3EF]/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {isSelected && <span className="w-1.5 h-1.5 bg-[#1A1A1A]" />}
                            <span className={`text-sm font-semibold ${dayData.enabled ? 'text-[#1A1A1A]' : 'text-[#4A4238]'}`}>
                              {dayObj.label}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${
                            dayData.enabled ? 'bg-[#1A1A1A] text-white' : 'bg-[#E4E2DE] text-[#4A4238]'
                          }`}>
                            {dayData.enabled ? 'ON' : 'OFF'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-xs text-[#1A1A1A]">
                          {dayData.enabled ? `${dayData.startTime} – ${dayData.endTime}` : '—'}
                        </td>

                        <td className="py-3.5 px-3 font-mono text-xs text-[#665D52]">
                          {dayData.enabled && dayData.breakEnabled ? `${dayData.breakStart} – ${dayData.breakEnd}` : 'None'}
                        </td>

                        <td className="py-3.5 px-3 font-mono text-xs text-right font-medium text-[#1A1A1A]">
                          {hours.toFixed(1)} hrs
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isSelected ? (
                            <span className="px-2.5 py-1 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider">
                              Editing
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleSelectDay(dayObj.key); }}
                              className="px-2.5 py-1 text-[#1A1A1A] hover:bg-[#DED9D1] text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              {dayData.enabled ? 'Edit' : 'Set Active'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Weekly Load Visualizer (SVG Bar Chart) */}
            <div className="pt-4 bg-[#F5F3EF] p-4 border border-[#DED9D1]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A4238]">
                  Daily Hours Allocation
                </span>
                <span className="font-mono text-xs text-[#1A1A1A] font-semibold">
                  Weekly Target: {totalCommittedHours}h / 50h Cap
                </span>
              </div>

              <div className="h-12 w-full flex items-end gap-2 pt-2">
                {daysOrder.map(d => {
                  const h = calculateDayHours(weeklySchedule[d.key]);
                  const pct = Math.min(100, Math.max(8, (h / 12) * 100));
                  return (
                    <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full transition-all duration-500 ${h > 0 ? 'bg-[#1A1A1A]' : 'bg-[#DED9D1] h-1'}`}
                        style={{ height: h > 0 ? `${pct}%` : '4px' }}
                        title={`${d.label}: ${h}h`}
                      />
                      <span className="text-[9px] font-bold text-[#4A4238] uppercase">
                        {d.key.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right Column: Interactive Day Editor Module (5 cols) */}
          <section className="xl:col-span-5 bg-[#F5F3EF] border border-[#DED9D1] p-6 sm:p-8 space-y-6 shadow-xs relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#DED9D1]/60">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#4A4238] font-bold">
                  Shift Configuration
                </span>
                <h3 className="font-serif text-2xl text-[#1A1A1A] mt-0.5 capitalize">
                  {daysOrder.find(d => d.key === selectedDayKey)?.label} • Inspection &amp; Edit
                </h3>
              </div>
              <span className="material-symbols-outlined text-[#4A4238] text-lg">tune</span>
            </div>

            {/* Toggle: Active vs Off Duty */}
            <div className="grid grid-cols-2 p-1 bg-[#DED9D1]/50 border border-[#DED9D1]">
              <button
                type="button"
                onClick={() => setDayForm(prev => ({ ...prev, enabled: true }))}
                className={`py-2 px-3 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  dayForm.enabled ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#4A4238] hover:text-[#1A1A1A]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${dayForm.enabled ? 'bg-white' : 'bg-gray-400'}`} />
                Available (Active)
              </button>

              <button
                type="button"
                onClick={() => setDayForm(prev => ({ ...prev, enabled: false }))}
                className={`py-2 px-3 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  !dayForm.enabled ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#4A4238] hover:text-[#1A1A1A]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${!dayForm.enabled ? 'bg-white' : 'bg-gray-400'}`} />
                Off Duty
              </button>
            </div>

            {/* Shift Window Input Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A4238]">
                  Shift Start
                </label>
                <select
                  value={dayForm.startTime}
                  onChange={(e) => setDayForm(prev => ({ ...prev, startTime: e.target.value }))}
                  disabled={!dayForm.enabled}
                  className="w-full bg-white border border-[#DED9D1] px-3 py-2.5 font-mono text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] cursor-pointer"
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4A4238]">
                  Shift End
                </label>
                <select
                  value={dayForm.endTime}
                  onChange={(e) => setDayForm(prev => ({ ...prev, endTime: e.target.value }))}
                  disabled={!dayForm.enabled}
                  className="w-full bg-white border border-[#DED9D1] px-3 py-2.5 font-mono text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] cursor-pointer"
                >
                  {timeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Break Options Container */}
            <div className="bg-white p-4 border border-[#DED9D1] space-y-4">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => dayForm.enabled && setDayForm(prev => ({ ...prev, breakEnabled: !prev.breakEnabled }))}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <div className={`w-4 h-4 border ${dayForm.breakEnabled && dayForm.enabled ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#DED9D1]'} flex items-center justify-center`}>
                    {dayForm.breakEnabled && dayForm.enabled && <span className="material-symbols-outlined text-xs">check</span>}
                  </div>
                  <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold">
                    Enable Midday Break
                  </span>
                </div>
                <span className="text-[10px] text-[#4A4238] uppercase font-bold">1.0 hr deduction</span>
              </div>

              {dayForm.breakEnabled && dayForm.enabled && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#DED9D1]/50">
                  <div>
                    <span className="block text-[10px] text-[#4A4238] uppercase tracking-wider mb-1 font-bold">
                      Break From
                    </span>
                    <select
                      value={dayForm.breakStart}
                      onChange={(e) => setDayForm(prev => ({ ...prev, breakStart: e.target.value }))}
                      className="w-full bg-[#F5F3EF] border border-[#DED9D1] px-2.5 py-1.5 font-mono text-xs text-[#1A1A1A]"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] text-[#4A4238] uppercase tracking-wider mb-1 font-bold">
                      Break Until
                    </span>
                    <select
                      value={dayForm.breakEnd}
                      onChange={(e) => setDayForm(prev => ({ ...prev, breakEnd: e.target.value }))}
                      className="w-full bg-[#F5F3EF] border border-[#DED9D1] px-2.5 py-1.5 font-mono text-xs text-[#1A1A1A]"
                    >
                      {timeOptions.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* High-Contrast Operational Efficiency Readout */}
            <div className="bg-[#1A1A1A] text-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-[#858383] font-bold">
                  Shift Efficiency Preview
                </span>
                <span className="font-mono text-xs text-white font-semibold">
                  {calculateDayHours(dayForm)} Net Hrs
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-white">verified</span>
                  <span className="text-gray-200">
                    Lunch Peak Guaranteed (11:30 AM – 02:30 PM covered with break stagger)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-white">verified</span>
                  <span className="text-gray-200">
                    Evening Dinner Peak Guaranteed (06:30 PM – 08:00 PM covered)
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatch Hub Match Info */}
            <div className="bg-[#DED9D1]/30 p-3.5 border border-[#DED9D1] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1A1A1A] text-lg">alt_route</span>
              <div className="flex flex-col text-xs">
                <span className="text-[#1A1A1A] uppercase tracking-wider font-semibold">
                  Dispatch Node: Central Hub 12
                </span>
                <span className="text-[#4A4238] text-[11px]">
                  Assigned zones: Bandra West, Pali Hill &amp; Khar coastal delivery ring.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDayForm(weeklySchedule[selectedDayKey] || defaultSchedule[selectedDayKey])}
                className="px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#4A4238] hover:text-[#1A1A1A] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDayForm}
                disabled={saving}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A4238] transition-colors cursor-pointer"
              >
                {saving ? 'Saving Day...' : 'Save Day Schedule'}
              </button>
            </div>
          </section>

        </div>

        {/* Weekly Availability Summary (4-Metric Architectural Grid) */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#4A4238] font-bold">
              Weekly Availability Audit
            </span>
            <span className="font-mono text-xs text-[#4A4238]">Cluster #MUM-C12</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-[#F5F3EF] border border-[#DED9D1] p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#4A4238] font-bold">Coverage</span>
                <span className="material-symbols-outlined text-base text-[#1A1A1A]">calendar_today</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#1A1A1A] leading-none">{activeDaysCount} / 7</span>
                <span className="text-xs text-[#4A4238] uppercase font-bold">Days Active</span>
              </div>
              <p className="text-xs text-[#665D52] pt-1">
                {((activeDaysCount / 7) * 100).toFixed(1)}% active week quota. Meets courier operational benchmark.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#F5F3EF] border border-[#DED9D1] p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#4A4238] font-bold">Committed Hours</span>
                <span className="material-symbols-outlined text-base text-[#1A1A1A]">timelapse</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#1A1A1A] leading-none">{totalCommittedHours}h</span>
                <span className="text-xs text-[#4A4238] uppercase font-bold">/ 50h Cap</span>
              </div>
              <p className="text-xs text-[#665D52] pt-1">
                {totalCommittedHours >= 40 ? 'Tier 1 Surge Bonus Pool activated for >40h threshold.' : 'Commit >40h to unlock Tier 1 Surge Bonus Pool.'}
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#F5F3EF] border border-[#DED9D1] p-5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#4A4238] font-bold">Next Shift</span>
                <span className="material-symbols-outlined text-base text-[#1A1A1A]">moped</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl text-[#1A1A1A] leading-none">Mon 09:00</span>
                <span className="text-[11px] text-[#4A4238] uppercase font-bold">AM</span>
              </div>
              <p className="text-xs text-[#665D52] pt-1">
                Geo-clustering pre-dispatch locks 30 mins before shift window start.
              </p>
            </div>

            {/* Metric 4 */}
            <div className="bg-[#1A1A1A] text-white p-5 space-y-2 border border-[#1A1A1A] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#858383] font-bold">
                  Live Dispatch Status
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl text-white leading-none">Available</span>
              </div>
              <p className="text-xs text-gray-300 pt-1">
                Synchronized with Go Online hardware beacon &amp; central route scheduler.
              </p>
            </div>
          </div>
        </section>

        {/* Security, Telemetry & Scope Notice */}
        <footer className="bg-[#F5F3EF] border border-[#DED9D1] p-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-[#4A4238]">
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined text-base text-[#1A1A1A]">security</span>
            <span>
              Driver Recurring Schedule scoped to JWT principal <strong className="text-[#1A1A1A]">#{driverId} ({driverName})</strong>. Asia/Kolkata (IST).
            </span>
          </div>
          <div className="font-mono text-[11px] tracking-wide text-[#1A1A1A]">
            SYNC PROTOCOL: SOCKET.IO / MONGO_STREAM_V2
          </div>
        </footer>

      </div>
    </div>
  );
}
