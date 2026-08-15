import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Navigation, 
  Phone, 
  User, 
  ChefHat, 
  DollarSign, 
  RotateCw, 
  X, 
  Check, 
  List, 
  PackageCheck, 
  LogOut,
  AlertCircle,
  ShieldCheck,
  Compass,
  ExternalLink
} from 'lucide-react';

export default function DeliveryDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('new-deliveries');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const partnerName = currentUser?.name || 'Rahul M.';
  const partnerPhone = currentUser?.phone || '+91 98765 11223';

  // Fetch all orders from MongoDB database on mount & interval
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data.map(o => ({ ...o, id: o._id || o.id })));
      }
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Launch Google Maps Live Turn-by-Turn GPS Navigation
  const handleOpenGoogleMapsNavigation = (destinationAddress) => {
    const encoded = encodeURIComponent(destinationAddress);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(mapsUrl, '_blank');
  };

  // Atomic Delivery Acceptance (Backend verified to prevent race conditions)
  const handleAcceptDelivery = async (order) => {
    const dbId = order.id || order._id;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${dbId}/accept-delivery`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerName,
          partnerPhone
        })
      });

      const json = await res.json();
      if (!json.success) {
        showToast(`⚠️ ${json.message || 'Delivery is no longer available!'}`);
        fetchOrders();
        return;
      }

      showToast(`✓ Accepted delivery for Order ${order.orderId}!`);
      fetchOrders();
      setActiveTab('active-delivery');
    } catch (err) {
      console.error('Error accepting delivery:', err);
      showToast('⚠️ Failed to accept delivery. Please try again.');
    }
  };

  // Delivery Status Lifecycle Stepper Handler
  const handleUpdateDeliveryStatus = async (orderId, newDeliveryStatus) => {
    const targetOrder = orders.find(o => o.id === orderId || o._id === orderId || o.orderId === orderId);
    if (!targetOrder) return;

    const dbId = targetOrder.id || targetOrder._id;

    // Optimistic update
    setOrders(prev => prev.map(o => (o.id === dbId || o._id === dbId || o.orderId === orderId) ? {
      ...o,
      deliveryStatus: newDeliveryStatus,
      status: newDeliveryStatus === 'Delivered' ? 'Completed' : o.status
    } : o));

    showToast(`✓ Status updated to ${newDeliveryStatus}`);

    try {
      await fetch(`http://localhost:5000/api/orders/${dbId}/delivery-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: newDeliveryStatus })
      });
      fetchOrders();
    } catch (err) {
      console.error('Error updating delivery status:', err);
    }
  };

  // Filter Orders for Delivery Partner Views
  const newDeliveries = orders.filter(o => 
    o.status === 'Ready' && 
    (o.deliveryStatus === 'Searching' || o.deliveryStatus === 'Unassigned' || !o.deliveryStatus)
  );

  const activeDeliveries = orders.filter(o => 
    o.deliveryPartnerName === partnerName && 
    ['Accepted', 'Arrived at Pickup', 'Picked Up', 'On The Way'].includes(o.deliveryStatus)
  );

  const activeDelivery = activeDeliveries[0] || null;

  const completedDeliveries = orders.filter(o => 
    o.deliveryPartnerName === partnerName && 
    o.deliveryStatus === 'Delivered'
  );

  const totalEarnings = completedDeliveries.reduce((sum, o) => sum + (o.deliveryFee || 45), 0);

  return (
    <div className="min-h-screen bg-[#F9FBF9] text-[#111827] font-sans flex flex-col selection:bg-[#0A8B5F] selection:text-white">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#111827] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Delivery Navbar */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E5ECE8] sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A8B5F] text-white font-black flex items-center justify-center text-sm shadow-xs">
            <Truck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[#111827]">Tiffin<span className="text-[#0A8B5F]">Link</span></span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#E8F0EC] text-[#0A8B5F] rounded-md border border-[#C5DDD2]">
                DELIVERY PARTNER
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { fetchOrders(); showToast('✓ Refreshed live delivery offers!'); }}
            className="p-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl hover:bg-gray-100 text-[#111827] transition-colors cursor-pointer"
          >
            <RotateCw size={16} className="text-[#0A8B5F]" />
          </button>

          <div className="flex items-center gap-2 bg-[#F9FBF9] border border-[#E5ECE8] px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#111827]">
            <div className="w-6 h-6 rounded-lg bg-[#0A8B5F] text-white flex items-center justify-center text-xs font-bold">
              {partnerName.charAt(0)}
            </div>
            <span>{partnerName}</span>
          </div>

          {onLogout && (
            <button 
              onClick={onLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-[#E5ECE8] shadow-xs flex flex-wrap gap-2 text-xs font-extrabold">
          <button 
            onClick={() => setActiveTab('new-deliveries')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'new-deliveries' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            <Truck size={15} />
            <span>New Deliveries</span>
            {newDeliveries.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {newDeliveries.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('active-delivery')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'active-delivery' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            <Navigation size={15} />
            <span>Active Delivery</span>
            {activeDelivery && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            <PackageCheck size={15} />
            <span>Delivery History</span>
          </button>

          <button 
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'earnings' ? 'bg-[#0A8B5F] text-white shadow-xs' : 'text-[#6B7280] hover:bg-[#F9FBF9]'
            }`}
          >
            <DollarSign size={15} />
            <span>Earnings (₹{totalEarnings})</span>
          </button>
        </div>

        {/* TAB 1: NEW DELIVERIES AVAILABLE */}
        {activeTab === 'new-deliveries' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-[#111827] tracking-tight">Available Delivery Offers</h1>
                <p className="text-xs text-[#6B7280] font-medium mt-1">Accept orders that are prepared and ready for customer pickup.</p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-[#0A8B5F]">{newDeliveries.length}</span>
                <span className="block text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Ready for Pickup</span>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E5ECE8]">
                <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#6B7280] font-bold mt-3">Fetching delivery offers...</p>
              </div>
            ) : newDeliveries.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-[#E5ECE8] space-y-3">
                <CheckCircle size={40} className="mx-auto text-[#0A8B5F]" />
                <h3 className="text-base font-extrabold text-[#111827]">No New Delivery Offers</h3>
                <p className="text-xs text-[#6B7280]">New prepared tiffins will appear here in real time as providers mark them ready.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newDeliveries.map(ord => (
                  <div key={ord.id || ord._id} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4 food-card-hover text-xs font-bold text-[#111827]">
                    
                    <div className="flex justify-between items-start border-b border-[#E5ECE8] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-[#0A8B5F]">{ord.orderId}</span>
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full">
                            ● READY FOR PICKUP
                          </span>
                        </div>
                        <div className="text-xs text-[#6B7280] font-semibold mt-1">
                          {ord.quantity} × {ord.tiffinName}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-[#0A8B5F]">₹{ord.deliveryFee || 45}</div>
                        <div className="text-[10px] text-[#6B7280] font-semibold">Delivery Earning</div>
                      </div>
                    </div>

                    {/* Pickup & Drop Addresses */}
                    <div className="space-y-3 bg-[#F9FBF9] p-3.5 rounded-xl border border-[#E5ECE8]">
                      
                      <div className="flex items-start gap-2.5">
                        <ChefHat size={16} className="text-[#0A8B5F] shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-[10px] uppercase font-extrabold text-[#6B7280]">Pickup Location</div>
                          <div className="font-black text-[#111827]">{ord.pickupAddress || 'Shreeji Tiffin Kitchen, Satellite'}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 pt-2 border-t border-[#E5ECE8]">
                        <MapPin size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-[10px] uppercase font-extrabold text-[#6B7280]">Customer Drop Address</div>
                          <div className="font-black text-[#111827]">{ord.customerName}</div>
                          <div className="text-[#6B7280] font-medium text-[11px]">{ord.customerAddress}</div>
                        </div>
                      </div>

                    </div>

                    <div className="flex items-center justify-between text-[#6B7280] text-[11px] font-semibold pt-1">
                      <span>Distance: {ord.deliveryDistance || '3.2 km'}</span>
                      <span>Est. Time: {ord.estimatedTime || '25 min'}</span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        onClick={() => handleOpenGoogleMapsNavigation(ord.pickupAddress || 'Satellite, Ahmedabad')}
                        className="py-2.5 px-3 border border-[#E5ECE8] bg-[#F9FBF9] hover:bg-gray-100 text-[#111827] font-bold rounded-xl cursor-pointer text-center flex items-center justify-center gap-1"
                      >
                        <Compass size={14} className="text-[#0A8B5F]" />
                        <span>Map</span>
                      </button>

                      <button 
                        onClick={() => handleAcceptDelivery(ord)}
                        className="flex-1 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-black rounded-xl cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check size={16} />
                        <span>Accept Delivery</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE DELIVERY LIFE CYCLE STEPPER & LIVE GPS MAP */}
        {activeTab === 'active-delivery' && (
          <div className="space-y-6 animate-slide-up">
            {!activeDelivery ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-[#E5ECE8] space-y-3">
                <Truck size={40} className="mx-auto text-gray-400" />
                <h3 className="text-base font-extrabold text-[#111827]">No Active Delivery in Progress</h3>
                <p className="text-xs text-[#6B7280]">Accept an available order from "New Deliveries" to start your trip.</p>
                <button 
                  onClick={() => setActiveTab('new-deliveries')}
                  className="px-5 py-2.5 bg-[#0A8B5F] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-block mt-2"
                >
                  Browse Available Deliveries
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6 text-xs font-bold text-[#111827]">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E5ECE8] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#0A8B5F]">{activeDelivery.orderId}</span>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-full">
                        ● {activeDelivery.deliveryStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B7280] mt-1">Assigned Delivery Partner: {partnerName}</div>
                  </div>

                  {/* Direct Launch Google Maps Navigation Button */}
                  <button 
                    onClick={() => handleOpenGoogleMapsNavigation(
                      ['Accepted', 'Arrived at Pickup'].includes(activeDelivery.deliveryStatus) 
                        ? (activeDelivery.pickupAddress || 'Satellite, Ahmedabad') 
                        : activeDelivery.customerAddress
                    )}
                    className="px-4 py-2.5 bg-[#111827] hover:bg-black text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Compass size={16} className="text-emerald-400 animate-spin" />
                    <span>Start Live GPS Navigation (Google Maps)</span>
                    <ExternalLink size={14} />
                  </button>
                </div>

                {/* INTERACTIVE VISUAL ROUTE MAP WIDGET MATCHING BRAND THEME */}
                <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4 text-xs font-bold text-[#111827]">
                  <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
                    <div className="flex items-center gap-2">
                      <Navigation size={16} className="text-[#0A8B5F]" />
                      <span className="font-extrabold tracking-wide text-xs">LIVE ROUTE NAVIGATION MAP</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-[#E8F0EC] text-[#0A8B5F] rounded-md border border-[#C5DDD2]">
                      GPS ACTIVE
                    </span>
                  </div>

                  {/* Visual Route Track */}
                  <div className="relative py-2 px-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                      
                      {/* Start Pin: Kitchen */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E5ECE8] shadow-xs flex-1">
                        <div className="w-8 h-8 rounded-lg bg-[#0A8B5F] text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                          <ChefHat size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-extrabold text-[#6B7280]">Pickup Kitchen</div>
                          <div className="text-xs font-black text-[#111827]">{activeDelivery.pickupAddress || 'Shreeji Tiffin Kitchen'}</div>
                        </div>
                      </div>

                      {/* Route Distance Line */}
                      <div className="flex flex-col items-center justify-center shrink-0 text-center px-2">
                        <div className="text-xs text-[#0A8B5F] font-black mb-1">
                          {activeDelivery.deliveryDistance || '3.2 km'} • {activeDelivery.estimatedTime || '25 min'}
                        </div>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-[#0A8B5F] via-indigo-500 to-red-500 rounded-full animate-pulse shadow-xs" />
                      </div>

                      {/* End Pin: Customer Drop */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E5ECE8] shadow-xs flex-1">
                        <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-extrabold text-[#6B7280]">Customer Drop</div>
                          <div className="text-xs font-black text-[#111827]">{activeDelivery.customerName}</div>
                          <div className="text-[11px] text-[#6B7280] font-medium truncate max-w-[200px]">{activeDelivery.customerAddress}</div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Call Quick Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5ECE8] text-xs font-bold">
                    <a 
                      href={`tel:${activeDelivery.customerPhone}`}
                      className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Phone size={14} />
                      <span>Call Customer ({activeDelivery.customerPhone})</span>
                    </a>

                    <a 
                      href="tel:+919825012345"
                      className="px-4 py-2 bg-[#F9FBF9] hover:bg-gray-100 border border-[#E5ECE8] text-[#111827] font-extrabold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Phone size={14} className="text-[#0A8B5F]" />
                      <span>Call Kitchen Hotline</span>
                    </a>
                  </div>
                </div>

                {/* Delivery Lifecycle Stepper Bar */}
                <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-3">
                  <div className="text-xs uppercase tracking-wider font-extrabold text-[#0A8B5F]">
                    Delivery Trip Progress
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'Accepted', label: '1. Accepted' },
                      { key: 'Arrived at Pickup', label: '2. At Pickup' },
                      { key: 'Picked Up', label: '3. Picked Up' },
                      { key: 'Delivered', label: '4. Delivered' }
                    ].map(stg => {
                      const isCurrent = activeDelivery.deliveryStatus === stg.key;
                      return (
                        <div 
                          key={stg.key}
                          className={`p-2.5 rounded-xl text-center font-extrabold text-xs border ${
                            isCurrent ? 'bg-[#0A8B5F] text-white border-[#0A8B5F] shadow-xs' : 'bg-white text-[#6B7280] border-[#E5ECE8]'
                          }`}
                        >
                          {stg.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pickup & Drop Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
                    <div className="text-xs uppercase font-extrabold text-[#0A8B5F] flex items-center gap-1.5">
                      <ChefHat size={16} />
                      <span>STEP 1: PICKUP FROM PROVIDER</span>
                    </div>
                    <div className="text-sm font-black text-[#111827]">{activeDelivery.pickupAddress || 'Shreeji Tiffin Kitchen'}</div>
                    <div className="text-xs text-[#6B7280]">{activeDelivery.quantity} × {activeDelivery.tiffinName}</div>
                    
                    <button 
                      onClick={() => handleOpenGoogleMapsNavigation(activeDelivery.pickupAddress || 'Satellite, Ahmedabad')}
                      className="mt-2 text-xs font-bold text-[#0A8B5F] underline flex items-center gap-1 cursor-pointer"
                    >
                      <Compass size={13} />
                      <span>Navigate to Kitchen in Maps</span>
                    </button>
                  </div>

                  <div className="bg-[#F9FBF9] p-4 rounded-2xl border border-[#E5ECE8] space-y-2">
                    <div className="text-xs uppercase font-extrabold text-[#0A8B5F] flex items-center gap-1.5">
                      <MapPin size={16} />
                      <span>STEP 2: DROP TO CUSTOMER</span>
                    </div>
                    <div className="text-sm font-black text-[#111827]">{activeDelivery.customerName}</div>
                    <div className="text-xs text-[#6B7280] flex items-center gap-1">
                      <Phone size={13} className="text-[#0A8B5F]" />
                      <span>{activeDelivery.customerPhone}</span>
                    </div>
                    <div className="text-xs text-[#6B7280] pt-1 border-t border-[#E5ECE8]">{activeDelivery.customerAddress}</div>
                    
                    <button 
                      onClick={() => handleOpenGoogleMapsNavigation(activeDelivery.customerAddress)}
                      className="mt-2 text-xs font-bold text-[#0A8B5F] underline flex items-center gap-1 cursor-pointer"
                    >
                      <Compass size={13} />
                      <span>Navigate to Customer Drop in Maps</span>
                    </button>
                  </div>
                </div>

                {/* Lifecycle Action Control Buttons */}
                <div className="p-4 bg-[#E8F0EC] rounded-2xl border border-[#C5DDD2] space-y-3">
                  <div className="text-xs font-extrabold text-[#0A8B5F] uppercase">Next Step Action</div>
                  
                  {activeDelivery.deliveryStatus === 'Accepted' && (
                    <button 
                      onClick={() => handleUpdateDeliveryStatus(activeDelivery.orderId, 'Arrived at Pickup')}
                      className="w-full py-3 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Navigation size={18} />
                      <span>I Have Arrived at Kitchen / Pickup Location</span>
                    </button>
                  )}

                  {activeDelivery.deliveryStatus === 'Arrived at Pickup' && (
                    <button 
                      onClick={() => handleUpdateDeliveryStatus(activeDelivery.orderId, 'Picked Up')}
                      className="w-full py-3 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      <PackageCheck size={18} />
                      <span>Food Picked Up — Start Delivery Trip</span>
                    </button>
                  )}

                  {activeDelivery.deliveryStatus === 'Picked Up' && (
                    <button 
                      onClick={() => handleUpdateDeliveryStatus(activeDelivery.orderId, 'On The Way')}
                      className="w-full py-3 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Truck size={18} />
                      <span>On The Way to Customer Address</span>
                    </button>
                  )}

                  {activeDelivery.deliveryStatus === 'On The Way' && (
                    <button 
                      onClick={() => handleUpdateDeliveryStatus(activeDelivery.orderId, 'Delivered')}
                      className="w-full py-3 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      <span>Mark Delivered to Customer (Complete Order)</span>
                    </button>
                  )}

                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: DELIVERY HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4 animate-slide-up text-xs font-bold">
            <h2 className="text-xl font-black text-[#111827]">Delivery History</h2>
            
            {completedDeliveries.length === 0 ? (
              <div className="p-8 text-center text-[#6B7280]">
                No completed deliveries recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E5ECE8]">
                {completedDeliveries.map(ord => (
                  <div key={ord.id || ord._id} className="py-4 flex justify-between items-center">
                    <div>
                      <div className="font-black text-[#0A8B5F] text-sm">{ord.orderId} — {ord.tiffinName}</div>
                      <div className="text-xs text-[#6B7280] font-medium">Delivered to {ord.customerName} ({ord.customerAddress})</div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-[#0A8B5F] text-base">+₹{ord.deliveryFee || 45}</div>
                      <div className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                        Completed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: EARNINGS SUMMARY */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs flex justify-between items-center">
              <div>
                <div className="text-xs uppercase font-bold text-[#6B7280]">Total Earnings Accumulated</div>
                <div className="text-4xl font-black text-[#0A8B5F] mt-1">₹{totalEarnings}</div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-[#111827]">{completedDeliveries.length}</div>
                <div className="text-xs text-[#6B7280] font-bold">Completed Trips</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
