import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  Users, 
  ShoppingBag, 
  Radio, 
  Check, 
  X, 
  Clock,
  ArrowUpRight,
  Sparkles,
  Utensils,
  Zap,
  Star,
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

export default function DashboardOverviewTab({ currentUser, onNavigateTab }) {
  const providerName = currentUser?.name || 'Xoxo Men';

  const [stats, setStats] = useState({
    liveRequestsCount: 3,
    todaysOrdersCount: 12,
    revenueToday: 4280,
    rating: 4.8
  });

  const [todaysOrders, setTodaysOrders] = useState([
    { id: '#1027', customer: 'Rahul Shah', items: 'Veg Tiffin × 2', time: '5:00 PM', amount: 240, status: 'Preparing', statusBg: 'bg-amber-100 text-amber-800 border-amber-200' },
    { id: '#1028', customer: 'Amit Verma', items: 'Jain Meal × 1', time: '5:30 PM', amount: 130, status: 'Ready', statusBg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: '#1029', customer: 'Neha Patel', items: 'North Indian × 2', time: '7:00 PM', amount: 300, status: 'Delivery Assigned', statusBg: 'bg-blue-100 text-blue-800 border-blue-200' }
  ]);

  const [liveRequest, setLiveRequest] = useState(null);

  const [acceptingOrders, setAcceptingOrders] = useState(() => {
    return localStorage.getItem('tiffinlink_provider_accepting_orders') !== 'false';
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Poll database for real pending meal requests
  useEffect(() => {
    const fetchRealRequests = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/requests');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const pendingList = json.data.filter(r => r.status === 'pending');
          setStats(prev => ({ ...prev, liveRequestsCount: pendingList.length }));
          if (pendingList.length > 0) {
            const req = pendingList[0];
            setLiveRequest({
              id: req._id || 'REQ-1092',
              customerName: req.customerName || 'Rahul Shah',
              customerPhone: req.customerPhone || '+91 98765 12345',
              items: `${req.quantity || 1} × ${req.mealType || 'Veg Tiffin'}`,
              time: `${req.date || 'Today'} • ${req.time || '5:00 PM'}`,
              distance: `${req.distance || '1.8 km'} • ${req.deliveryType || 'Delivery'}`,
              price: req.budget || 120,
              secondsLeft: 60
            });
          } else {
            setLiveRequest(null);
          }
        } else {
          setStats(prev => ({ ...prev, liveRequestsCount: 0 }));
          setLiveRequest(null);
        }
      } catch (err) {
        console.error('Error fetching live requests from MongoDB:', err);
      }
    };

    fetchRealRequests();
    const interval = setInterval(fetchRealRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAcceptingOrders = async () => {
    const nextState = !acceptingOrders;
    setAcceptingOrders(nextState);
    localStorage.setItem('tiffinlink_provider_accepting_orders', String(nextState));

    setToastMessage(
      nextState 
        ? '🟢 Kitchen Status: LIVE - Now accepting new tiffin orders!'
        : '⏸️ Kitchen Status: PAUSED - Incoming orders are temporarily paused.'
    );

    try {
      await fetch('http://localhost:5000/api/providers/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptingOrders: nextState, email: currentUser?.email })
      });
    } catch (err) {
      console.error('Error syncing status to MongoDB:', err);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAcceptLiveRequest = async () => {
    if (!liveRequest) return;
    const activeReq = liveRequest;
    setLiveRequest(null);
    setToastMessage('✓ Live Request Accepted! Creating order in database & navigating to Preparing...');

    try {
      // 1. Post new order to MongoDB tiffinlink.orders
      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeReq.customerName || 'Rahul Shah',
          customerPhone: activeReq.customerPhone || '+91 98765 12345',
          customerAddress: 'B-402, Shivalik Towers, Satellite, Ahmedabad',
          tiffinName: activeReq.items || 'Gujarati Veg Special Thali',
          tiffinCategory: 'Gujarati',
          tiffinImage: '/assets/provider_1.png',
          quantity: 2,
          unitPrice: activeReq.price || 120,
          distanceKm: 1.8,
          paymentStatus: 'Paid',
          status: 'Preparing'
        })
      });

      // 2. Mark request as accepted in MongoDB
      if (activeReq.id && activeReq.id.length > 10) {
        await fetch(`http://localhost:5000/api/requests/${activeReq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' })
        });
      }
    } catch (err) {
      console.error('Error accepting live request:', err);
    }

    setTimeout(() => {
      setToastMessage(null);
      if (onNavigateTab) onNavigateTab('orders-preparing');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-slide-up relative text-xs font-bold text-[#111827]">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Good afternoon, {providerName} 👋</h1>
          <p className="text-xs font-medium text-[#6B7280] mt-1">Here's what needs your attention today.</p>
        </div>
        
        {/* Accepting Orders Switch */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-[#F9FBF9] px-4 py-2.5 rounded-xl border border-[#E5ECE8]">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${acceptingOrders ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs font-bold text-[#111827]">
              {acceptingOrders ? '🟢 ACCEPTING ORDERS' : '🔴 KITCHEN OFFLINE'}
            </span>
          </div>

          <button 
            type="button"
            onClick={handleToggleAcceptingOrders}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              acceptingOrders ? 'bg-[#0A8B5F]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                acceptingOrders ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Live Requests */}
        <div 
          onClick={() => onNavigateTab('requests')}
          className="bg-white p-5 rounded-2xl border-2 border-amber-400/60 shadow-xs cursor-pointer hover:border-amber-500 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Zap size={15} />
              <span>Live Requests</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-3xl font-black text-[#111827]">
            {stats.liveRequestsCount.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-2">Requires immediate response</div>
        </div>

        {/* Orders Today */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <ShoppingBag size={15} className="text-[#0A8B5F]" />
            <span>Orders Today</span>
          </div>
          <div className="text-3xl font-black text-[#111827]">12</div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold mt-2">📈 +15% vs yesterday</div>
        </div>

        {/* Earned Today */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <TrendingUp size={15} className="text-[#0A8B5F]" />
            <span>Earned Today</span>
          </div>
          <div className="text-3xl font-black text-[#111827]">₹4,280</div>
          <div className="text-[11px] text-[#0A8B5F] font-semibold mt-2">Ready for withdrawal</div>
        </div>

        {/* Provider Rating */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <Star size={15} className="text-amber-500 fill-amber-500" />
            <span>Kitchen Rating</span>
          </div>
          <div className="text-3xl font-black text-[#111827]">4.8 ★</div>
          <div className="text-[11px] text-[#6B7280] font-medium mt-2">Based on 126 reviews</div>
        </div>

      </div>

      {/* Live Requests Banner Card */}
      {liveRequest && (
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-400 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500 animate-pulse" />
              <h3 className="text-sm font-black text-[#111827]">⚡ NEW LIVE REQUEST AVAILABLE</h3>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-lg flex items-center gap-1">
              <Clock size={13} />
              <span>00:{liveRequest.secondsLeft.toString().padStart(2, '0')}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-sm font-black text-[#111827]">{liveRequest.items}</div>
              <div className="text-xs text-[#6B7280]">{liveRequest.time}</div>
            </div>

            <div className="text-xs text-[#6B7280]">
              <div>📍 {liveRequest.distance}</div>
            </div>

            <div className="text-base font-black text-[#0A8B5F]">
              ₹{liveRequest.price}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLiveRequest(null)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-[#4B5563] font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptLiveRequest}
                className="flex-1 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Accept Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row: Today's Orders & Operational Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Today's Orders Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
            <h3 className="text-base font-black text-[#111827]">Today's Active Orders</h3>
            <button 
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#0A8B5F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {todaysOrders.map(ord => (
              <div key={ord.id} className="p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0A8B5F]">{ord.id}</span>
                    <span className="font-extrabold text-xs text-[#111827]">{ord.customer}</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">{ord.items} • {ord.time}</div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg border ${ord.statusBg}`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Operational Capacity & Delivery Status Widgets (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Kitchen Capacity Widget */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-2">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">KITCHEN CAPACITY</h4>
              <button onClick={() => onNavigateTab('capacity')} className="text-[10px] text-[#0A8B5F] hover:underline">Manage</button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span>32 / 40 meals</span>
                <span className="text-[#0A8B5F]">8 remaining</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-[#E5ECE8]">
                <div className="h-full bg-[#0A8B5F] rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>

          {/* Delivery Status Widget */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-2">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">DELIVERY STATUS</h4>
              <button onClick={() => onNavigateTab('orders-delivery')} className="text-[10px] text-[#0A8B5F] hover:underline">View Delivery</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800">
                <span>● 3 orders ready for pickup</span>
                <span className="font-black">Ready</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-blue-800">
                <span>● 2 delivery partners assigned</span>
                <span className="font-black">Assigned</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-800">
                <span>● 1 awaiting partner arrival</span>
                <span className="font-black">Searching</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

