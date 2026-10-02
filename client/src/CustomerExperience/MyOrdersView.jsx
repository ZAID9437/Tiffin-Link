import React, { useState, useEffect } from 'react';
import { 
  Package, Clock, CheckCircle2, AlertCircle, ChevronRight, 
  MapPin, Phone, ShieldCheck, Download, RefreshCw, Eye, X, 
  Truck, ArrowRight, Calendar, User, FileText
} from 'lucide-react';

export default function MyOrdersView({ currentUser, onNavigate, onOpenTracking }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'track', 'upcoming', 'history', 'cancelled'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [invoiceToast, setInvoiceToast] = useState(false);

  // Fetch customer orders from MongoDB API or local session
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const email = currentUser?.email || 'zaid@example.com';
      const phone = currentUser?.phone || '';
      
      const res = await fetch(`http://localhost:5000/api/orders/my-orders?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      const json = await res.json();

      let orderList = [];
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        orderList = json.data;
      } else {
        // High quality fallback demonstration orders tailored to the user
        orderList = [
          {
            _id: 'ORD-8821',
            orderId: '#TL-8821',
            providerName: "Mom's Kitchen",
            providerImage: '/assets/provider_1.png',
            providerPhone: '+91 98250 11223',
            providerAddress: 'Satellite Road, Ahmedabad',
            tiffinName: 'Executive Gujarati Thali (Pure Ghee)',
            items: [
              { name: 'Ringna No Olo & Bhindi Sambhariya', qty: 1, price: 120 },
              { name: 'Soft Phulka Rotli (4 pcs)', qty: 1, price: 20 },
              { name: 'Kadhi, Dal & Steamed Rice', qty: 1, price: 0 },
              { name: 'Masala Chaas Canister', qty: 1, price: 15 }
            ],
            quantity: 1,
            itemPrice: 155,
            deliveryCharge: 0,
            platformFee: 5,
            tax: 0,
            totalAmount: 160,
            status: 'Out for Delivery',
            paymentStatus: 'Paid via UPI (HDFC)',
            paymentMethod: 'UPI',
            deliveryAddress: 'B-402, Shivalik Residency, Satellite Road, Ahmedabad',
            deliverySlot: 'Lunch Slot (12:00 - 13:30)',
            date: 'Today, 12:45 PM',
            otp: '4892',
            etaMinutes: 12,
            driver: {
              name: 'Ramesh Solanki',
              phone: '+91 97230 45678',
              vehicle: 'Honda Activa (GJ-01-ET-3841)',
              rating: '4.9'
            },
            timeline: [
              { title: 'Order Placed & Confirmed', time: '12:05 PM', completed: true },
              { title: 'Kitchen Accepted & Cooking', time: '12:08 PM', completed: true },
              { title: 'Packed in 304 Stainless Canister', time: '12:28 PM', completed: true },
              { title: 'Driver Picked Up & Out for Delivery', time: '12:35 PM', completed: true },
              { title: 'Delivered at Doorstep', time: 'Est. 12:47 PM', completed: false }
            ]
          },
          {
            _id: 'ORD-8819',
            orderId: '#TL-8819',
            providerName: 'Ghar Ka Khana',
            providerImage: '/assets/provider_2.png',
            providerPhone: '+91 98790 33445',
            providerAddress: 'Near Vastrapur Lake, Ahmedabad',
            tiffinName: '100% Jain Satvik Thali',
            items: [
              { name: 'Gatte Ki Subzi & Sev Tameta', qty: 1, price: 130 },
              { name: 'Jain Rotli (4 pcs)', qty: 1, price: 0 }
            ],
            quantity: 1,
            itemPrice: 130,
            deliveryCharge: 0,
            platformFee: 5,
            totalAmount: 135,
            status: 'Delivered',
            paymentStatus: 'Paid Online',
            paymentMethod: 'Online Payment',
            deliveryAddress: 'B-402, Shivalik Residency, Satellite Road, Ahmedabad',
            deliverySlot: 'Lunch Slot (12:00 - 13:30)',
            date: 'Yesterday, 1:10 PM',
            otp: '7103',
            driver: {
              name: 'Vikram Patel',
              phone: '+91 98980 12345',
              vehicle: 'Hero Splendor (GJ-01-AB-1234)',
              rating: '4.8'
            }
          },
          {
            _id: 'ORD-8810',
            orderId: '#TL-8810',
            providerName: 'Shree Tiffin Service',
            providerImage: '/assets/provider_3.png',
            providerPhone: '+91 99090 99887',
            providerAddress: 'Prahlad Nagar, Ahmedabad',
            tiffinName: 'Special Kathiyawadi Rotla Thali',
            items: [
              { name: 'Sev Dungri & Baingan Bhartha', qty: 1, price: 140 },
              { name: 'Bajra Rotla with Desi Ghee & Gud', qty: 2, price: 30 }
            ],
            quantity: 1,
            itemPrice: 170,
            deliveryCharge: 0,
            platformFee: 5,
            totalAmount: 175,
            status: 'Delivered',
            paymentStatus: 'Paid Online',
            paymentMethod: 'UPI',
            deliveryAddress: 'B-402, Shivalik Residency, Satellite Road, Ahmedabad',
            deliverySlot: 'Dinner Slot (19:30 - 21:00)',
            date: '28 Sep 2026, 8:20 PM',
            otp: '3391'
          },
          {
            _id: 'ORD-8790',
            orderId: '#TL-8790',
            providerName: 'Foodie Home Kitchen',
            providerImage: '/assets/provider_4.png',
            providerPhone: '+91 98251 77665',
            providerAddress: 'Bodakdev, Ahmedabad',
            tiffinName: 'North Indian Paneer Butter Masala Combo',
            items: [
              { name: 'Paneer Butter Masala', qty: 1, price: 150 }
            ],
            quantity: 1,
            itemPrice: 150,
            deliveryCharge: 0,
            platformFee: 5,
            totalAmount: 155,
            status: 'Cancelled',
            cancelReason: 'Customer requested cancellation prior to kitchen prep.',
            refundStatus: 'Full Refund ₹155 credited to Source UPI',
            paymentStatus: 'Refunded',
            date: '25 Sep 2026, 12:15 PM'
          }
        ];
      }

      setOrders(orderList);
    } catch (e) {
      console.warn('Orders fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const activeOrders = orders.filter(o => ['pending', 'Preparing', 'Out for Delivery', 'Driver Picked Up', 'Driver Assigned'].includes(o.status));
  const historyOrders = orders.filter(o => ['Delivered', 'Completed'].includes(o.status));
  const cancelledOrders = orders.filter(o => ['Cancelled', 'Rejected'].includes(o.status));

  const handleDownloadInvoice = (order) => {
    setInvoiceToast(true);
    setTimeout(() => setInvoiceToast(false), 3000);
    // Open a simple printable invoice window
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Tax Invoice - ${order.orderId || order._id}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #1a1a1a; }
              .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 20px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th, .table td { border-bottom: 1px solid #ded9d1; padding: 10px; text-align: left; }
              .total { font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>TiffinLink Tax Invoice</h1>
              <p>Order ID: ${order.orderId || order._id} | Date: ${order.date || 'Today'}</p>
              <p>Kitchen: ${order.providerName || "Mom's Kitchen"} | FSSAI #10721026000412</p>
            </div>
            <p><strong>Customer:</strong> ${currentUser?.name || 'Zaid Mansuri'} (${currentUser?.email || 'zaid@example.com'})</p>
            <p><strong>Handover Address:</strong> ${order.deliveryAddress || 'Satellite, Ahmedabad'}</p>
            <table class="table">
              <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
              <tr><td>${order.tiffinName || 'Special Thali'}</td><td>${order.quantity || 1}</td><td>₹${order.totalAmount || 140}</td></tr>
            </table>
            <p class="total" style="margin-top: 30px;">Grand Total Paid: ₹${order.totalAmount || 140} (${order.paymentStatus || 'Paid'})</p>
            <p style="margin-top: 40px; font-size: 12px; color: #666;">Generated securely via TiffinLink Live Geomatics Network.</p>
          </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  const handleReorder = (order) => {
    if (onNavigate) {
      onNavigate('#find-tiffin');
    } else {
      window.location.hash = '#find-tiffin';
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a] pt-24 sm:pt-28 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-margin-desktop w-full space-y-8">
        
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#ded9d1]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b5e20] animate-pulse" />
              <span className="font-label-caps text-xs text-[#665d52] uppercase tracking-widest font-semibold">
                Customer Dining Portal • Order Operations
              </span>
            </div>
            <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-5xl text-[#1a1a1a] tracking-tight">
              My Orders &amp; Tiffin Subscriptions
            </h1>
            <p className="text-sm sm:text-base text-[#665d52] max-w-2xl mt-1">
              Live geomatics route tracking, active OTP handovers, dispatch history, and scheduled meal deliveries.
            </p>
          </div>

          <button
            onClick={() => {
              if (onNavigate) onNavigate('#find-tiffin');
              else window.location.hash = '#find-tiffin';
            }}
            className="px-6 py-3 rounded-xl bg-[#1a1a1a] text-white hover:bg-[#a0522d] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto active:scale-95"
          >
            <span>Order New Tiffin</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Orders Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#ded9d1]/80 pb-3">
          {[
            { id: 'active', label: 'Active Orders', count: activeOrders.length, icon: Package },
            { id: 'track', label: 'Track Order', icon: Truck },
            { id: 'upcoming', label: 'Upcoming Tiffins', count: 3, icon: Calendar },
            { id: 'history', label: 'Order History', count: historyOrders.length, icon: CheckCircle2 },
            { id: 'cancelled', label: 'Cancelled Orders', count: cancelledOrders.length, icon: AlertCircle }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#1a1a1a] text-white shadow-sm' 
                    : 'bg-white/80 hover:bg-[#ded9d1]/40 text-[#4a4238] border border-[#ded9d1]/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-[#665d52]'} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#ded9d1]/60 text-[#1a1a1a]'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Active Orders */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {activeOrders.length === 0 ? (
              <div className="bg-white/60 border border-[#ded9d1] rounded-3xl p-12 text-center space-y-4">
                <Package size={48} className="mx-auto text-[#665d52]/40" />
                <h3 className="font-display-lg text-2xl text-[#1a1a1a]">No Active Tiffin Deliveries Right Now</h3>
                <p className="text-xs sm:text-sm text-[#665d52] max-w-md mx-auto">
                  All your previous tiffins have arrived hot and fresh. Design a new dining experience from local home kitchens nearby!
                </p>
                <button
                  onClick={() => window.location.hash = '#find-tiffin'}
                  className="px-6 py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#a0522d] transition-all cursor-pointer"
                >
                  Find Nearby Providers
                </button>
              </div>
            ) : (
              activeOrders.map(order => (
                <div key={order._id} className="bg-white rounded-3xl border-2 border-[#1a1a1a] p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in">
                  
                  {/* Status & ETA Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ded9d1]">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#e4e2de] overflow-hidden shrink-0 border border-[#ded9d1]">
                        <img src={order.providerImage} alt={order.providerName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#a0522d]">{order.orderId}</span>
                          <span className="bg-[#1b5e20] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                            {order.status}
                          </span>
                        </div>
                        <h3 className="font-display-lg text-2xl text-[#1a1a1a] mt-0.5">{order.providerName}</h3>
                        <p className="text-xs text-[#665d52] flex items-center gap-1 mt-0.5">
                          <MapPin size={12} /> {order.providerAddress}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#f5f3ef] p-4 rounded-2xl border border-[#ded9d1] flex items-center justify-between sm:justify-start gap-6">
                      <div>
                        <p className="text-[10px] font-label-caps uppercase text-[#665d52] font-bold">Estimated Arrival</p>
                        <p className="text-lg font-bold text-[#1b5e20] flex items-center gap-1.5 mt-0.5">
                          <Clock size={16} /> {order.etaMinutes || 12} mins
                        </p>
                      </div>
                      <div className="border-l border-[#ded9d1] pl-6">
                        <p className="text-[10px] font-label-caps uppercase text-[#665d52] font-bold">Handover OTP</p>
                        <p className="text-xl font-mono font-black text-[#1a1a1a] tracking-widest mt-0.5">
                          {order.otp || '4892'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Handover Bar */}
                  {order.driver && (
                    <div className="bg-[#fbf9f5] border border-[#ded9d1] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-sm">
                          {order.driver.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1.5">
                            <span>{order.driver.name}</span>
                            <span className="bg-[#ded9d1]/60 text-[#4a4238] text-[10px] font-bold px-1.5 rounded">
                              ★ {order.driver.rating}
                            </span>
                          </p>
                          <p className="text-[11px] text-[#665d52] mt-0.5">{order.driver.vehicle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${order.driver.phone}`}
                          className="px-3.5 py-1.5 rounded-xl border border-[#ded9d1] bg-white text-xs font-bold text-[#1a1a1a] hover:bg-black/5 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Phone size={12} className="text-[#1b5e20]" />
                          <span>Call Partner</span>
                        </a>
                        <button
                          onClick={() => {
                            if (onOpenTracking) onOpenTracking(order.orderId || order._id);
                            else setActiveTab('track');
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#1b5e20] text-white text-xs font-bold hover:bg-[#144919] transition-all flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Truck size={14} />
                          <span>Live Map Track</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions & Details Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="text-xs text-[#665d52]">
                      <span>{order.tiffinName}</span> • <strong className="text-[#1a1a1a]">₹{order.totalAmount}</strong> ({order.paymentStatus})
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="text-xs font-bold text-[#1a1a1a] underline hover:no-underline cursor-pointer flex items-center gap-1"
                      >
                        <Eye size={14} /> View Complete Dossier
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content 2: Track Order (Live Geomatics Radar) */}
        {activeTab === 'track' && (
          <div className="bg-white rounded-3xl border border-[#ded9d1] p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ded9d1]">
              <div>
                <span className="bg-[#1b5e20]/10 text-[#1b5e20] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Live Dispatch Geomatics
                </span>
                <h3 className="font-display-lg text-2xl text-[#1a1a1a] mt-1">
                  Active Delivery Transit #TL-8821
                </h3>
                <p className="text-xs text-[#665d52]">Mom's Kitchen ➔ B-402, Shivalik Residency, Satellite Road</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#665d52]">Share Handover OTP:</span>
                <span className="font-mono text-xl font-black bg-[#1a1a1a] text-white px-3.5 py-1 rounded-xl">
                  4892
                </span>
              </div>
            </div>

            {/* Step-by-Step Delivery Route Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {[
                { title: 'Confirmed', desc: '12:05 PM', done: true },
                { title: 'Cooking', desc: 'Fresh on flame', done: true },
                { title: 'Stainless Sealed', desc: '304 Canister', done: true },
                { title: 'In Transit', desc: 'Ramesh on way', done: true, active: true },
                { title: 'Handover', desc: 'OTP verification', done: false }
              ].map((step, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${
                  step.active ? 'border-[#1b5e20] bg-[#1b5e20]/5 ring-2 ring-[#1b5e20]/20' : step.done ? 'border-[#ded9d1] bg-[#f5f3ef]' : 'border-[#ded9d1]/40 bg-white/40 opacity-50'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {step.done ? (
                      <CheckCircle2 size={14} className="text-[#1b5e20]" />
                    ) : (
                      <Clock size={14} className="text-[#665d52]" />
                    )}
                    <span className="text-xs font-bold text-[#1a1a1a]">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-[#665d52]">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Radar Map Simulation Card */}
            <div className="aspect-[21/9] w-full rounded-2xl bg-[#e4e2de] relative overflow-hidden flex items-center justify-center border border-[#ded9d1]">
              <div className="absolute inset-0 bg-[radial-gradient(#a0522d_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
              <div className="relative text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1b5e20] text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Truck size={24} />
                </div>
                <p className="font-bold text-sm text-[#1a1a1a]">Driver Ramesh Solanki is 1.4 KM away</p>
                <p className="text-xs text-[#665d52]">Navigating via Satellite West Corridor • Food temperature maintained at 68°C</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Upcoming Tiffins (Meal Subscriptions Calendar) */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#ded9d1] p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="font-display-lg text-2xl text-[#1a1a1a]">Upcoming Scheduled Meals</h3>
                <p className="text-xs text-[#665d52]">Scheduled daily lunch &amp; dinner deliveries from your active monthly subscriptions.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { day: 'Tomorrow, Lunch', date: '03 Oct', kitchen: "Mom's Kitchen", menu: 'Sev Tameta, Gujarati Kadhi, 4 Rotli, Chaas', slot: '12:30 - 13:30' },
                  { day: 'Friday, Lunch', date: '04 Oct', kitchen: "Mom's Kitchen", menu: 'Paneer Bhurji, Dal Fry, 4 Phulka Rotli, Gulab Jamun', slot: '12:30 - 13:30' },
                  { day: 'Saturday, Lunch', date: '05 Oct', kitchen: "Mom's Kitchen", menu: 'Kathiyawadi Baingan Bhartha, Rotla, Garlic Chutney', slot: '12:30 - 13:30' }
                ].map((meal, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#f5f3ef] border border-[#ded9d1] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#a0522d]">{meal.day}</span>
                      <span className="text-[11px] font-mono font-bold text-[#665d52]">{meal.date}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1a1a1a]">{meal.kitchen}</h4>
                    <p className="text-xs text-[#665d52] leading-snug">{meal.menu}</p>
                    <div className="pt-2 border-t border-[#ded9d1]/70 flex items-center justify-between text-xs">
                      <span className="text-[#665d52]">{meal.slot}</span>
                      <button 
                        onClick={() => alert(`Tomorrow's (${meal.day}) meal paused successfully.`)}
                        className="text-[#a0522d] font-bold hover:underline cursor-pointer"
                      >
                        Pause Meal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: Order History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyOrders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl border border-[#ded9d1] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#1a1a1a]/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e4e2de] overflow-hidden shrink-0">
                    <img src={order.providerImage} alt={order.providerName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1a1a1a]">{order.providerName}</span>
                      <span className="bg-[#1b5e20]/10 text-[#1b5e20] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Delivered
                      </span>
                    </div>
                    <p className="text-xs text-[#665d52] mt-0.5">{order.tiffinName}</p>
                    <p className="text-[11px] text-[#665d52] mt-1 font-mono">{order.orderId} • {order.date}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ded9d1]/50">
                  <div className="sm:text-right pr-2">
                    <p className="font-bold text-sm text-[#1a1a1a]">₹{order.totalAmount}</p>
                    <p className="text-[10px] text-[#1b5e20] font-semibold">{order.paymentStatus}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(order)}
                    className="p-2 rounded-xl border border-[#ded9d1] bg-white text-[#4a4238] hover:text-[#1a1a1a] hover:bg-black/5 transition-colors cursor-pointer"
                    title="Download Tax Invoice"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleReorder(order)}
                    className="px-4 py-2 rounded-xl bg-[#1a1a1a] text-white text-xs font-bold hover:bg-[#a0522d] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content 5: Cancelled Orders */}
        {activeTab === 'cancelled' && (
          <div className="space-y-4">
            {cancelledOrders.map(order => (
              <div key={order._id} className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600">{order.orderId}</span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Cancelled
                    </span>
                  </div>
                  <span className="text-xs text-[#665d52]">{order.date}</span>
                </div>
                <h4 className="font-bold text-sm text-[#1a1a1a]">{order.providerName} - {order.tiffinName}</h4>
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-800 space-y-1">
                  <p><strong>Reason:</strong> {order.cancelReason || 'Customer requested'}</p>
                  <p><strong>Refund:</strong> {order.refundStatus || 'Refund processed'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Complete Order Details Dossier Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#ded9d1]">
              <div>
                <span className="text-xs font-mono font-bold text-[#a0522d]">{selectedOrderDetails.orderId}</span>
                <h3 className="font-display-lg text-2xl text-[#1a1a1a] mt-0.5">Order Dossier &amp; Receipt</h3>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-[#ded9d1]/40 hover:bg-[#ded9d1] flex items-center justify-center cursor-pointer text-[#1a1a1a]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Provider and Handover details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#ded9d1]/60">
                <span className="text-[#665d52]">Kitchen Provider:</span>
                <span className="font-bold text-[#1a1a1a]">{selectedOrderDetails.providerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ded9d1]/60">
                <span className="text-[#665d52]">Delivery Slot:</span>
                <span className="font-bold text-[#1a1a1a]">{selectedOrderDetails.deliverySlot}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ded9d1]/60">
                <span className="text-[#665d52]">Destination:</span>
                <span className="font-medium text-[#1a1a1a] max-w-xs text-right">{selectedOrderDetails.deliveryAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#ded9d1]/60">
                <span className="text-[#665d52]">Verification OTP:</span>
                <span className="font-mono font-bold text-sm text-[#1b5e20]">{selectedOrderDetails.otp}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Tiffin Meal Composition</p>
              <div className="bg-[#f5f3ef] p-4 rounded-2xl border border-[#ded9d1] space-y-2 text-xs">
                {(selectedOrderDetails.items || [{ name: selectedOrderDetails.tiffinName, qty: 1, price: selectedOrderDetails.totalAmount }]).map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-[#4a4238]">{it.name} (x{it.qty})</span>
                    <span className="font-bold text-[#1a1a1a]">₹{it.price}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#ded9d1] flex justify-between font-bold text-sm text-[#1a1a1a]">
                  <span>Total Amount Paid</span>
                  <span>₹{selectedOrderDetails.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleDownloadInvoice(selectedOrderDetails)}
                className="flex-1 py-3 px-4 rounded-xl border border-[#ded9d1] text-xs font-bold text-[#1a1a1a] hover:bg-black/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Download Invoice</span>
              </button>
              <button
                onClick={() => {
                  setSelectedOrderDetails(null);
                  handleReorder(selectedOrderDetails);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1a1a1a] text-white hover:bg-[#a0522d] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Reorder Now</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Invoice Generated Toast */}
      {invoiceToast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-[#1a1a1a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <Download size={16} className="text-[#4ade80]" />
          <span>Tax Invoice generated and ready to print!</span>
        </div>
      )}

    </div>
  );
}
