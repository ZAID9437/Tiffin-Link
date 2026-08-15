import React, { useState, useEffect } from 'react';
import { Zap, Clock, MapPin, CheckCircle2, XCircle, Utensils, AlertCircle, RefreshCw } from 'lucide-react';

export default function LiveRequestsTab({ onNavigateTab, onAcceptRequest }) {
  const [requests, setRequests] = useState([
    {
      id: 'REQ-1092',
      customerName: 'Rahul Shah',
      customerPhone: '+91 98765 12345',
      items: [
        { name: 'Gujarati Veg Special Thali', qty: 2, price: 120 }
      ],
      totalAmount: 240,
      distance: '1.8 km',
      deliveryTime: 'Today • 5:00 PM',
      secondsLeft: 54,
      status: 'pending'
    },
    {
      id: 'REQ-1093',
      customerName: 'Priya Patel',
      customerPhone: '+91 98123 45678',
      items: [
        { name: 'Jain Full Thali (No Onion/Garlic)', qty: 1, price: 130 },
        { name: 'Extra Butter Milk', qty: 1, price: 20 }
      ],
      totalAmount: 150,
      distance: '2.4 km',
      deliveryTime: 'Today • 5:30 PM',
      secondsLeft: 112,
      status: 'pending'
    },
    {
      id: 'REQ-1094',
      customerName: 'Amit Verma',
      customerPhone: '+91 97654 32109',
      items: [
        { name: 'North Indian Deluxe Tiffin', qty: 3, price: 150 }
      ],
      totalAmount: 450,
      distance: '3.1 km',
      deliveryTime: 'Today • 7:00 PM',
      secondsLeft: 180,
      status: 'pending'
    }
  ]);

  const [toastMsg, setToastMsg] = useState('');

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

  const handleAccept = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    setToastMsg(`✓ Request #${id} accepted! Moved to Preparing orders.`);
    setTimeout(() => setToastMsg(''), 3500);
    if (onAcceptRequest) onAcceptRequest(id);
  };

  const handleDecline = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    setToastMsg(`Request #${id} declined.`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Toast Banner */}
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
            <span className="text-[#0A8B5F] font-extrabold">⚡ Live Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Live Customer Requests</h1>
            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 text-xs font-extrabold rounded-full border border-amber-500/20 animate-pulse">
              {requests.length} Pending
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Review and accept incoming meal requests from nearby customers before the timer expires.</p>
        </div>

        <button 
          onClick={() => {
            setToastMsg('Refreshing live requests...');
            setTimeout(() => setToastMsg(''), 2000);
          }}
          className="px-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className="text-[#0A8B5F]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Live Request Cards List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] shadow-xs space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-[#0A8B5F] rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Zap size={24} />
          </div>
          <h3 className="text-sm font-black text-[#111827]">No Live Requests Right Now</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto font-medium">Your kitchen is active and ready. New customer meal requests will appear here automatically with live countdown timers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border-2 border-amber-400/60 p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between">
              
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                <Clock size={12} />
                <span>{formatTimer(req.secondsLeft)}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-black text-amber-600 uppercase tracking-wider">{req.id} • NEW REQUEST</span>
                </div>

                <div>
                  <h4 className="text-base font-black text-[#111827]">{req.customerName}</h4>
                  <p className="text-xs text-[#6B7280] font-medium">{req.customerPhone}</p>
                </div>

                <div className="p-3 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] space-y-1.5">
                  {req.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-[#111827] flex items-center gap-1.5">
                        <Utensils size={13} className="text-[#0A8B5F]" />
                        {item.qty} × {item.name}
                      </span>
                      <span className="font-black text-[#0A8B5F]">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B7280] font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-[#0A8B5F]" />
                    {req.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-amber-500" />
                    {req.distance}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5ECE8] space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-[#6B7280]">Total Request Value</span>
                  <span className="text-base font-black text-[#111827]">₹{req.totalAmount}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDecline(req.id)}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-[#4B5563] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <XCircle size={15} />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
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
