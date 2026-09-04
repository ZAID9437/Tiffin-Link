import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Utensils, 
  AlertCircle, 
  RefreshCw, 
  Phone, 
  FileText, 
  Sparkles,
  PlusCircle
} from 'lucide-react';
import { apiRequest } from '../services/api';

export default function LiveRequestsTab({ onNavigateTab, onAcceptRequest }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const requestsRef = useRef([]);

  // Keep ref synchronized for timer ticker
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    fetchLiveRequests();
    // Poll for new requests every 5 seconds without overwriting ticking countdown
    const interval = setInterval(() => {
      fetchLiveRequests(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveRequests = async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      const json = await apiRequest('/requests');
      if (json.success && Array.isArray(json.data)) {
        const now = Date.now();
        setRequests(prev => {
          return json.data.map((r, i) => {
            // Find existing request in state to maintain continuous second countdown
            const existing = prev.find(p => (p.dbId === r._id || p.id === r.id));

            let secondsLeft = r.secondsLeft !== undefined ? r.secondsLeft : 120;
            if (r.expiresAt) {
              secondsLeft = Math.max(0, Math.floor((new Date(r.expiresAt).getTime() - now) / 1000));
            } else if (existing && existing.secondsLeft !== undefined) {
              secondsLeft = existing.secondsLeft;
            }

            const formattedItems = Array.isArray(r.items) && r.items.length > 0
              ? r.items
              : [{ name: r.mealType || 'Veg Special Thali', qty: r.quantity || 1, price: r.budget || 120 }];

            return {
              id: r.id || (r._id ? `REQ-${r._id.toString().slice(-4).toUpperCase()}` : `REQ-${1090 + i}`),
              dbId: r._id,
              customerName: r.customerName || 'Customer',
              customerPhone: r.customerPhone || '+91 98765 43210',
              customerAddress: r.customerAddress || r.location || 'Satellite, Ahmedabad',
              mealType: r.mealType || formattedItems[0]?.name,
              category: r.category || 'Gujarati',
              items: formattedItems,
              totalAmount: r.totalAmount || (r.quantity || 1) * (r.budget || 120),
              distance: r.distance || '1.8 km',
              deliveryTime: `${r.date || 'Today'} • ${r.time || '1:30 PM'}`,
              specialInstructions: r.specialInstructions || '',
              secondsLeft,
              status: r.status || 'pending'
            };
          });
        });
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching dynamic live requests from API:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests(prev => prev.map(req => ({
        ...req,
        secondsLeft: req.secondsLeft > 0 ? req.secondsLeft - 1 : 0
      })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSimulate = async () => {
    try {
      setActionInProgress(true);
      setToastMsg('⚡ Generating realistic dynamic customer order...');
      const json = await apiRequest('/requests/simulate', { method: 'POST' });
      if (json.success && json.data) {
        setToastMsg(`✓ Real-time Request received from ${json.data.customerName}!`);
        await fetchLiveRequests(false);
      }
    } catch (err) {
      console.error('Error simulating dynamic request:', err);
      setToastMsg('Error generating dynamic request');
    } finally {
      setActionInProgress(false);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleAccept = async (id, dbId) => {
    const targetId = dbId || id;
    const targetReq = requests.find(r => r.id === id || r.dbId === targetId);
    
    // Immediate optimistic state update
    setRequests(prev => prev.filter(r => r.id !== id && r.dbId !== targetId));
    setToastMsg(`✓ Accepting #${id}... Moving to Preparing orders`);

    try {
      const json = await apiRequest(`/requests/${targetId}/accept`, {
        method: 'POST'
      });

      if (json.success) {
        setToastMsg(`✓ Order ${json.data?.order?.orderId || ''} created & in Kitchen Preparing!`);
      }
    } catch (err) {
      console.error('Error accepting live request in API:', err);
    }

    setTimeout(() => {
      setToastMsg('');
      if (onAcceptRequest) onAcceptRequest(id);
      if (onNavigateTab) onNavigateTab('orders-preparing');
    }, 1200);
  };

  const handleDecline = async (id, dbId) => {
    const targetId = dbId || id;
    setRequests(prev => prev.filter(r => r.id !== id && r.dbId !== targetId));
    setToastMsg(`Request #${id} declined.`);

    try {
      await apiRequest(`/requests/${targetId}/decline`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error declining request in API:', err);
    }

    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold flex items-center gap-1">
              <Zap size={13} className="text-amber-500 fill-amber-500" />
              Live Requests (Real-Time API)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Live Customer Requests</h1>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-black rounded-full border border-amber-500/20 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {requests.length} Active Pending
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">
            Real-time incoming customer orders from nearby diners. Accept before the timer expires to begin preparation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            disabled={actionInProgress}
            onClick={handleSimulate}
            className="px-4 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={15} />
            <span>+ Simulate Live Order</span>
          </button>

          <button 
            onClick={() => {
              setToastMsg('Refreshing live requests from API...');
              fetchLiveRequests(false);
              setTimeout(() => setToastMsg(''), 1500);
            }}
            className="px-4 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className="text-[#0A8B5F]" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Live Request Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] shadow-xs space-y-3">
          <RefreshCw size={28} className="text-[#0A8B5F] animate-spin mx-auto" />
          <h3 className="text-sm font-black text-[#111827]">Connecting to Real-time Orders Feed...</h3>
          <p className="text-xs text-[#6B7280]">Syncing with live customer requests API.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-[#0A8B5F] rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <Zap size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-[#111827]">No Live Requests Pending</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto font-medium mt-1">
              Your kitchen is active and accepting incoming customer meal requests in real time. Click "+ Simulate Live Order" above to test an incoming request instantly.
            </p>
          </div>
          <button
            onClick={handleSimulate}
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Generate Test Live Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div 
              key={req.id} 
              className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between ${
                req.secondsLeft < 30 ? 'border-red-400 bg-red-50/10' : 'border-amber-400/70 hover:border-amber-500'
              }`}
            >
              {/* Countdown Timer Badge */}
              <div className={`absolute top-0 right-0 text-[10px] font-black px-3.5 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-xs ${
                req.secondsLeft < 30 ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'
              }`}>
                <Clock size={12} />
                <span>{formatTimer(req.secondsLeft)}</span>
              </div>

              <div className="space-y-3.5">
                {/* ID & Category Tag */}
                <div className="flex items-center justify-between pr-20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-black text-amber-600 uppercase tracking-wider">{req.id}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-[#0A8B5F] border border-emerald-200 rounded-md text-[10px] font-extrabold uppercase">
                    {req.category}
                  </span>
                </div>

                {/* Customer Details */}
                <div>
                  <h4 className="text-base font-black text-[#111827]">{req.customerName}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-[#4B5563] font-medium mt-0.5">
                    <Phone size={12} className="text-[#0A8B5F]" />
                    <span>{req.customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-[#6B7280] font-medium mt-1">
                    <MapPin size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{req.customerAddress}</span>
                  </div>
                </div>

                {/* Meal Items Breakdown */}
                <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] space-y-2">
                  {req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs gap-2">
                      <span className="font-extrabold text-[#111827] flex items-center gap-1.5 leading-snug">
                        <Utensils size={13} className="text-[#0A8B5F] shrink-0" />
                        <span>{item.qty} × {item.name}</span>
                      </span>
                      <span className="font-black text-[#0A8B5F] shrink-0">₹{item.price * item.qty}</span>
                    </div>
                  ))}

                  {/* Special Instructions */}
                  {req.specialInstructions && (
                    <div className="pt-2 border-t border-[#E5ECE8] text-[11px] text-amber-700 font-medium flex items-start gap-1.5">
                      <FileText size={12} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="italic leading-tight">{req.specialInstructions}</span>
                    </div>
                  )}
                </div>

                {/* Delivery Time and Distance */}
                <div className="flex items-center justify-between text-xs text-[#6B7280] font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-[#0A8B5F]" />
                    {req.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                    <MapPin size={12} />
                    {req.distance}
                  </span>
                </div>
              </div>

              {/* Card Footer: Price & Accept/Decline Actions */}
              <div className="pt-4 border-t border-[#E5ECE8] space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Total Request Value</span>
                  <span className="text-lg font-black text-[#111827]">₹{req.totalAmount}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecline(req.id, req.dbId)}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-[#4B5563] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <XCircle size={15} />
                    <span>Decline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id, req.dbId)}
                    className="py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 hover:shadow-lg"
                  >
                    <CheckCircle2 size={15} />
                    <span>Accept Request</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

