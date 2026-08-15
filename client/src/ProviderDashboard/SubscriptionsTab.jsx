import React, { useState, useEffect } from 'react';
import { Repeat, Calendar, Clock, User, CheckCircle2, Search, Filter, ShieldCheck, ChevronRight, PauseCircle, PlayCircle, RefreshCw } from 'lucide-react';

export default function SubscriptionsTab() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/subscriptions');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSubscribers(json.data.map(s => ({
          id: s.subId || s._id,
          dbId: s._id,
          customerName: s.customerName,
          email: s.customerEmail,
          phone: s.customerPhone,
          plan: s.plan,
          mealType: s.mealType,
          pricePerMeal: s.pricePerMeal,
          nextMeal: s.nextMeal,
          address: s.address,
          status: s.status
        })));
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (sub) => {
    const nextStatus = sub.status === 'Active' ? 'Paused' : 'Active';
    setSubscribers(prev => prev.map(s => s.id === sub.id ? { ...s, status: nextStatus } : s));
    setToastMsg(`✓ Subscription #${sub.id} is now ${nextStatus}`);
    setTimeout(() => setToastMsg(''), 3500);

    if (sub.dbId) {
      try {
        await fetch(`http://localhost:5000/api/subscriptions/${sub.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
      } catch (err) {
        console.error('Error updating subscription in MongoDB:', err);
      }
    }
  };

  const filtered = subscribers.filter(s => 
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.mealType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">🔄 Subscriptions</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Recurring Meal Subscriptions</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage daily and weekly recurring tiffin subscribers for predictable kitchen volume.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[#0A8B5F]">
            <div className="text-[10px] uppercase font-bold text-[#6B7280]">ACTIVE SUBSCRIBERS</div>
            <div className="text-lg font-black">{subscribers.filter(s => s.status === 'Active').length} Customers</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-1">
          <div className="text-xs font-bold text-[#6B7280]">Lunch Subscriptions</div>
          <div className="text-xl font-black text-[#111827]">16 Meals Daily</div>
          <div className="text-[10px] text-[#0A8B5F] font-bold">11:30 AM – 2:30 PM Window</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-1">
          <div className="text-xs font-bold text-[#6B7280]">Dinner Subscriptions</div>
          <div className="text-xl font-black text-[#111827]">8 Meals Daily</div>
          <div className="text-[10px] text-[#0A8B5F] font-bold">6:00 PM – 9:00 PM Window</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-1">
          <div className="text-xs font-bold text-[#6B7280]">Monthly Recurring Revenue</div>
          <div className="text-xl font-black text-[#0A8B5F]">₹48,600 / Mo</div>
          <div className="text-[10px] text-[#6B7280] font-medium">Guaranteed predictable payout</div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#E5ECE8]">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input 
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#0A8B5F]"
            />
          </div>
          <span className="text-xs text-[#6B7280] font-medium self-end sm:self-auto">Showing {filtered.length} subscribers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(sub => (
            <div key={sub.id} className="p-4 rounded-xl border border-[#E5ECE8] bg-[#F9FBF9] hover:bg-white hover:border-[#C5DDD2] transition-all space-y-3 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-[#6B7280] uppercase">{sub.id}</span>
                  <h4 className="text-sm font-black text-[#111827]">{sub.customerName}</h4>
                  <p className="text-xs text-[#6B7280] font-medium">{sub.phone}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg ${
                  sub.status === 'Active' ? 'bg-emerald-100 text-[#0A8B5F] border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  {sub.status}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E5ECE8] space-y-1">
                <div className="font-extrabold text-[#0A8B5F]">{sub.mealType}</div>
                <div className="text-[11px] text-[#4B5563] font-medium flex items-center gap-1">
                  <Repeat size={12} className="text-[#0A8B5F]" />
                  {sub.plan}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[#6B7280]">
                <span>Next Meal: <strong className="text-[#111827]">{sub.nextMeal}</strong></span>
                <span className="font-black text-[#111827]">₹{sub.pricePerMeal} / meal</span>
              </div>

              <button
                onClick={() => setSelectedSub(sub)}
                className="w-full py-2 bg-white border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <span>View Details</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[#E5ECE8] animate-scale-in">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#6B7280]">{selectedSub.id}</span>
                <h3 className="text-base font-black text-[#111827]">{selectedSub.customerName}</h3>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-[#6B7280] hover:text-[#111827] cursor-pointer">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                <div className="font-bold text-[#6B7280]">Delivery Address</div>
                <div className="font-extrabold text-[#111827]">{selectedSub.address}</div>
              </div>

              <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                <div className="font-bold text-[#6B7280]">Recurring Plan</div>
                <div className="font-extrabold text-[#0A8B5F]">{selectedSub.plan} ({selectedSub.mealType})</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSub(null)}
              className="w-full py-2.5 bg-[#0A8B5F] text-white font-extrabold rounded-xl shadow-md cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
