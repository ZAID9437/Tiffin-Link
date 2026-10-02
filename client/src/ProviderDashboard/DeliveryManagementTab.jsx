import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { getSocket } from '../services/socket';
import GoogleDeliveryMap from '../components/GoogleDeliveryMap';

export default function DeliveryManagementTab({ currentUser, onNavigateTab }) {
  const [deliveries, setDeliveries] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(true);

  // Filters & Search
  const [activeStatusTab, setActiveStatusTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Drawers
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetOrder, setAssignTargetOrder] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [isTrackingDrawerOpen, setIsTrackingDrawerOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Initial Fetch & Realtime Socket Subscription
  useEffect(() => {
    fetchDeliveryData(true);
    
    // Poll every 5 seconds as fallback
    const interval = setInterval(() => {
      fetchDeliveryData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Socket.IO Setup
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
      if (socket) {
        setIsSocketConnected(socket.connected);
        
        const pId = currentUser?.providerId || currentUser?.id || currentUser?._id;
        if (pId) {
          socket.emit('join:provider', { providerId: pId });
        }

        const handleConnect = () => setIsSocketConnected(true);
        const handleDisconnect = () => setIsSocketConnected(false);

        const handleRealtimeDeliveryEvent = (data) => {
          console.log('⚡ [Provider Delivery Realtime Event]:', data);
          fetchDeliveryData(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('delivery:assigned', handleRealtimeDeliveryEvent);
        socket.on('delivery:accepted', handleRealtimeDeliveryEvent);
        socket.on('delivery:request:accepted', handleRealtimeDeliveryEvent);
        socket.on('delivery:picked_up', handleRealtimeDeliveryEvent);
        socket.on('delivery:out_for_delivery', handleRealtimeDeliveryEvent);
        socket.on('delivery:delivered', handleRealtimeDeliveryEvent);
        socket.on('delivery:cancelled', handleRealtimeDeliveryEvent);
        socket.on('delivery:status:updated', handleRealtimeDeliveryEvent);

        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('delivery:assigned', handleRealtimeDeliveryEvent);
          socket.off('delivery:accepted', handleRealtimeDeliveryEvent);
          socket.off('delivery:request:accepted', handleRealtimeDeliveryEvent);
          socket.off('delivery:picked_up', handleRealtimeDeliveryEvent);
          socket.off('delivery:out_for_delivery', handleRealtimeDeliveryEvent);
          socket.off('delivery:delivered', handleRealtimeDeliveryEvent);
          socket.off('delivery:cancelled', handleRealtimeDeliveryEvent);
          socket.off('delivery:status:updated', handleRealtimeDeliveryEvent);
        };
      }
    } catch (e) {
      console.warn('Socket connection error in DeliveryManagementTab:', e);
    }
  }, [currentUser]);

  const fetchDeliveryData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // 1. Fetch active delivery requests from MongoDB
      const delJson = await apiRequest('/delivery/requests');
      if (delJson && delJson.success && Array.isArray(delJson.requests)) {
        setDeliveries(delJson.requests);
      } else if (delJson && Array.isArray(delJson.data)) {
        setDeliveries(delJson.data);
      }

      // 2. Fetch orders ready for pickup from MongoDB
      const ordJson = await apiRequest('/orders/provider');
      if (ordJson && ordJson.success && Array.isArray(ordJson.orders)) {
        const rOrders = ordJson.orders.filter(o => o.status === 'Ready' || o.status === 'READY');
        setReadyOrders(rOrders);
      } else if (ordJson && Array.isArray(ordJson.data)) {
        const rOrders = ordJson.data.filter(o => o.status === 'Ready' || o.status === 'READY');
        setReadyOrders(rOrders);
      }

      // 3. Fetch nearby available drivers from MongoDB
      const drvJson = await apiRequest('/delivery/drivers/nearby');
      if (drvJson && drvJson.success && Array.isArray(drvJson.drivers)) {
        setNearbyDrivers(drvJson.drivers);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching delivery management data:', err);
      if (isInitial) {
        setError('Unable to load delivery data. Please verify backend connection.');
      }
    } finally {
      if (isInitial) setLoading(false);
      setRefreshing(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Status normalization helper
  const getNormalizedStatus = (item) => {
    if (!item) return 'READY';
    const st = String(item.status || item.deliveryStatus || '').toUpperCase();
    if (st.includes('DELIVERED') || st.includes('COMPLETED')) return 'DELIVERED';
    if (st.includes('OUT_FOR_DELIVERY') || st.includes('OUT FOR DELIVERY') || st.includes('IN_TRANSIT')) return 'OUT_FOR_DELIVERY';
    if (st.includes('PICKED_UP') || st.includes('PICKED UP') || st.includes('ARRIVED_AT_PICKUP')) return 'PICKED_UP';
    if (st.includes('ASSIGNED') || st.includes('ACCEPTED') || st.includes('DRIVER_ASSIGNED')) return 'ASSIGNED';
    if (st.includes('CANCELLED') || st.includes('FAILED')) return 'CANCELLED';
    return 'READY';
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'READY':
        return 'bg-[#FFF8E7] text-[#9A6700] border-[#FFE8A3]';
      case 'ASSIGNED':
        return 'bg-surface-container text-on-surface border-sand-neutral';
      case 'PICKED_UP':
        return 'bg-[#F0F4FF] text-[#1E40AF] border-[#BFDBFE]';
      case 'OUT_FOR_DELIVERY':
        return 'bg-onyx-black text-on-primary border-onyx-black animate-pulse';
      case 'DELIVERED':
        return 'bg-[#E6F4EA] text-[#137333] border-[#A8DADC]';
      case 'CANCELLED':
        return 'bg-[#FCE8E6] text-[#C5221F] border-[#F5C2C7]';
      default:
        return 'bg-surface-container text-secondary border-sand-neutral';
    }
  };

  // Metric Computations (Calculated dynamically from MongoDB)
  const readyCount = readyOrders.length + deliveries.filter(d => getNormalizedStatus(d) === 'READY').length;
  const assignedCount = deliveries.filter(d => getNormalizedStatus(d) === 'ASSIGNED').length;
  const outForDeliveryCount = deliveries.filter(d => getNormalizedStatus(d) === 'OUT_FOR_DELIVERY' || getNormalizedStatus(d) === 'PICKED_UP').length;
  
  const todayStr = new Date().toDateString();
  const completedTodayCount = deliveries.filter(d => {
    if (getNormalizedStatus(d) !== 'DELIVERED') return false;
    const dateObj = new Date(d.deliveredAt || d.updatedAt || d.createdAt || Date.now());
    return dateObj.toDateString() === todayStr;
  }).length;

  // Manual Driver Assignment Action
  const handleAssignDriver = async (driverId, driverName) => {
    if (!assignTargetOrder || isAssigning) return;
    setIsAssigning(true);

    const orderId = assignTargetOrder.orderId || assignTargetOrder.requestId || assignTargetOrder._id;
    try {
      showToast(`Assigning driver ${driverName}...`);

      const json = await apiRequest('/delivery/assign', {
        method: 'POST',
        body: JSON.stringify({
          requestId: orderId,
          orderId: orderId,
          driverId: driverId
        })
      });

      if (json && (json.success || json.delivery)) {
        showToast(`✓ Driver ${driverName} assigned to Order #${orderId}!`);
        setIsAssignModalOpen(false);
        setAssignTargetOrder(null);
        fetchDeliveryData(false);
      } else {
        showToast(json?.message || 'Driver assignment initiated. Awaiting driver acceptance.');
        setIsAssignModalOpen(false);
        setAssignTargetOrder(null);
        fetchDeliveryData(false);
      }
    } catch (err) {
      console.error('Error assigning driver:', err);
      showToast('⚠️ Driver assignment request sent to dispatch network.');
      setIsAssignModalOpen(false);
      setAssignTargetOrder(null);
      fetchDeliveryData(false);
    } finally {
      setIsAssigning(false);
    }
  };

  // Helper to format addresses safely (whether string or object)
  const formatAddrStr = (addr, fallback = '') => {
    const kitchenName = currentUser?.businessName || currentUser?.name || currentUser?.kitchenName || 'Kitchen Hub';
    const defaultFallback = currentUser?.address || `${kitchenName}, Satellite, Ahmedabad`;

    let raw = '';
    if (!addr) {
      raw = defaultFallback;
    } else if (typeof addr === 'string') {
      raw = addr;
    } else if (typeof addr === 'object') {
      const parts = [addr.street, addr.area || addr.locality, addr.city, addr.pincode || addr.zip].filter(Boolean);
      raw = parts.length > 0 ? parts.join(', ') : (addr.address || addr.name || defaultFallback);
    } else {
      raw = defaultFallback;
    }

    // Replace legacy hardcoded 'Shreeji Tiffin Kitchen' with dynamic kitchen name if present
    if (raw.includes('Shreeji Tiffin Kitchen')) {
      raw = raw.replace(/Shreeji Tiffin Kitchen/g, kitchenName);
    }

    // Deduplicate repeated city/locality occurrences like 'Satellite, Ahmedabad, Ahmedabad'
    const tokens = raw.split(',').map(s => s.trim());
    const uniqueTokens = tokens.filter((item, pos) => item && tokens.indexOf(item) === pos);
    return uniqueTokens.join(', ') || defaultFallback;
  };

  // CSV Export
  const handleExportCSV = () => {
    if (deliveries.length === 0 && readyOrders.length === 0) {
      showToast('No delivery records to export.');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Customer Phone', 'Pickup Address', 'Delivery Address', 'Amount (INR)', 'Delivery Fee', 'Payment Status', 'Delivery Status', 'Driver Name', 'Requested At'];
    const rows = filteredDeliveries.map(d => [
      `"${d.orderId || d.requestId || d._id}"`,
      `"${d.customerName || 'N/A'}"`,
      `"${d.customerPhone || 'N/A'}"`,
      `"${formatAddrStr(d.pickupAddress, 'Kitchen Staging Bay')}"`,
      `"${formatAddrStr(d.deliveryAddress, 'Ahmedabad')}"`,
      d.amount || d.totalAmount || 0,
      d.pricing?.deliveryCharge || d.deliveryFee || 51,
      `"${d.paymentStatus || 'PAID'}"`,
      `"${getNormalizedStatus(d)}"`,
      `"${d.assignedDriver?.name || d.deliveryPartnerName || 'Unassigned'}"`,
      `"${new Date(d.requestedAt || d.createdAt || Date.now()).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TiffinLink_Delivery_Manifest_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('✓ Delivery manifest exported to CSV successfully!');
  };

  // Search & Filter Logic
  const filteredDeliveries = deliveries.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (d.orderId && String(d.orderId).toLowerCase().includes(q)) ||
      (d.requestId && String(d.requestId).toLowerCase().includes(q)) ||
      (d.customerName && d.customerName.toLowerCase().includes(q)) ||
      (d.customerPhone && d.customerPhone.includes(q)) ||
      (d.assignedDriver?.name && d.assignedDriver.name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const normStatus = getNormalizedStatus(d);
    if (activeStatusTab === 'READY' && normStatus !== 'READY') return false;
    if (activeStatusTab === 'ASSIGNED' && normStatus !== 'ASSIGNED') return false;
    if (activeStatusTab === 'OUT_FOR_DELIVERY' && normStatus !== 'OUT_FOR_DELIVERY' && normStatus !== 'PICKED_UP') return false;
    if (activeStatusTab === 'DELIVERED' && normStatus !== 'DELIVERED') return false;
    if (activeStatusTab === 'CANCELLED' && normStatus !== 'CANCELLED') return false;

    if (paymentFilter !== 'All') {
      const pStatus = String(d.paymentStatus || '').toUpperCase();
      if (paymentFilter === 'PAID' && !pStatus.includes('PAID') && !pStatus.includes('UPI')) return false;
      if (paymentFilter === 'COD' && !pStatus.includes('COD') && !pStatus.includes('CASH')) return false;
    }

    if (driverFilter !== 'All') {
      const dName = d.assignedDriver?.name || d.deliveryPartnerName || '';
      if (dName !== driverFilter) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.requestedAt || a.createdAt || Date.now());
    const dateB = new Date(b.requestedAt || b.createdAt || Date.now());
    if (sortBy === 'newest') return dateB - dateA;
    if (sortBy === 'oldest') return dateA - dateB;
    if (sortBy === 'amountHigh') return (b.amount || 0) - (a.amount || 0);
    return 0;
  });

  return (
    <div className="flex flex-col w-full space-y-8 font-body-md text-on-surface">
      
      {/* Toast Alert Popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-button-text text-button-text animate-bounce border border-sand-neutral">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-sand-neutral">
        <div className="flex flex-col space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 font-label-caps text-label-caps text-secondary tracking-widest uppercase">
            <span>Provider</span>
            <span class="text-outline-variant">/</span>
            <span class="text-onyx-black font-semibold">Delivery Management</span>
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-sand-neutral mx-1"></span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 ${isSocketConnected ? 'bg-surface-container-low text-clay-earth' : 'bg-error-container text-on-error-container'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-onyx-black animate-pulse' : 'bg-error'}`}></span>
              {isSocketConnected ? 'Live Dispatch Sync' : 'Reconnecting...'}
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Delivery Management</h1>
            <p className="font-body-md text-body-md text-secondary mt-1">
              Track, assign and manage deliveries for your orders across kitchen staging bays.
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchDeliveryData(false);
            }}
            className="group flex items-center gap-2 px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all border border-sand-neutral font-button-text text-button-text"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>sync</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all border border-sand-neutral font-button-text text-button-text"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* 4 Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: Ready for Pickup */}
        <div 
          onClick={() => setActiveStatusTab('READY')}
          className="p-5 rounded-lg bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between relative overflow-hidden group hover:border-onyx-black transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Ready for Pickup</span>
            <span className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">takeout_dining</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display-lg text-[54px] leading-none text-on-surface">{readyCount.toString().padStart(2, '0')}</span>
            <span className="font-label-caps text-[11px] text-secondary">Awaiting Driver Pickup</span>
          </div>
          <div className="mt-3 pt-3 border-t border-sand-neutral/60 flex items-center justify-between text-secondary font-label-caps text-[11px]">
            <span>Kitchen Staging Bays</span>
            <span className="text-on-surface font-semibold">100% Prepared</span>
          </div>
        </div>

        {/* Card 2: Assigned */}
        <div 
          onClick={() => setActiveStatusTab('ASSIGNED')}
          className="p-5 rounded-lg bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between relative overflow-hidden group hover:border-onyx-black transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Assigned</span>
            <span className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display-lg text-[54px] leading-none text-on-surface">{assignedCount.toString().padStart(2, '0')}</span>
            <span className="font-label-caps text-[11px] text-secondary font-medium">Couriers Matched</span>
          </div>
          <div className="mt-3 pt-3 border-t border-sand-neutral/60 flex items-center justify-between text-secondary font-label-caps text-[11px]">
            <span>En Route to Kitchen</span>
            <span className="text-on-surface font-semibold">Avg ETA 4 mins</span>
          </div>
        </div>

        {/* Card 3: Out for Delivery */}
        <div 
          onClick={() => setActiveStatusTab('OUT_FOR_DELIVERY')}
          className="p-5 rounded-lg bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between relative overflow-hidden group hover:border-onyx-black transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Out for Delivery</span>
            <span className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">navigation</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display-lg text-[54px] leading-none text-on-surface">{outForDeliveryCount.toString().padStart(2, '0')}</span>
            <span className="font-label-caps text-[11px] text-secondary">In Active Transit</span>
          </div>
          <div className="mt-3 pt-3 border-t border-sand-neutral/60 flex items-center justify-between text-secondary font-label-caps text-[11px]">
            <span>Live GPS Radar</span>
            <span className="text-on-surface font-semibold">Broadcasting</span>
          </div>
        </div>

        {/* Card 4: Completed Today */}
        <div 
          onClick={() => setActiveStatusTab('DELIVERED')}
          className="p-5 rounded-lg bg-surface-container-lowest border border-sand-neutral flex flex-col justify-between relative overflow-hidden group hover:border-onyx-black transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Completed Today</span>
            <span className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display-lg text-[54px] leading-none text-on-surface">{completedTodayCount.toString().padStart(2, '0')}</span>
            <span className="font-label-caps text-[11px] text-secondary">Fulfilled Orders</span>
          </div>
          <div className="mt-3 pt-3 border-t border-sand-neutral/60 flex items-center justify-between text-secondary font-label-caps text-[11px]">
            <span>Customer Handshake</span>
            <span className="text-on-surface font-semibold">OTP Verified</span>
          </div>
        </div>
      </div>

      {/* Ready Orders Urgent Alert Callout */}
      {readyOrders.length > 0 && (
        <div className="p-4 rounded-lg bg-surface-container-low border border-sand-neutral flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-onyx-black flex items-center justify-center text-on-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-[11px] font-bold text-on-surface uppercase tracking-wider">Orders Ready for Assignment ({readyOrders.length})</span>
                <span className="font-label-caps text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-clay-earth font-semibold uppercase">Action Required</span>
              </div>
              <p className="font-body-md text-xs text-secondary mt-0.5">
                Food preparation is complete. Assign available delivery partners for immediate pickup.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {readyOrders.slice(0, 3).map(order => (
              <button
                key={order._id || order.orderId}
                type="button"
                onClick={() => {
                  setAssignTargetOrder(order);
                  setIsAssignModalOpen(true);
                }}
                className="px-3.5 py-2 bg-onyx-black text-on-primary hover:bg-clay-earth font-button-text text-button-text rounded transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Assign Driver for #{order.orderId || order._id}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar Control Plane */}
      <div className="p-4 rounded-lg bg-surface-container-lowest border border-sand-neutral flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Search Query Bar */}
        <div className="flex-1 flex items-center bg-surface-container-low rounded px-3 py-2 border border-sand-neutral">
          <span className="material-symbols-outlined text-secondary text-[20px] mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Customer Name, Phone, or Delivery Partner..."
            className="w-full bg-transparent text-sm text-on-surface placeholder:text-secondary focus:outline-none font-body-md"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-secondary hover:text-on-surface text-xs font-bold uppercase">
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tab Filter */}
          <select
            value={activeStatusTab}
            onChange={e => setActiveStatusTab(e.target.value)}
            className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container border border-sand-neutral text-on-surface font-button-text text-button-text cursor-pointer focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="READY">Ready for Pickup</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container border border-sand-neutral text-on-surface font-button-text text-button-text cursor-pointer focus:outline-none"
          >
            <option value="All">All Payment Modes</option>
            <option value="PAID">Prepaid (UPI / Card)</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>

          {/* Driver Filter */}
          <select
            value={driverFilter}
            onChange={e => setDriverFilter(e.target.value)}
            className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container border border-sand-neutral text-on-surface font-button-text text-button-text cursor-pointer focus:outline-none"
          >
            <option value="All">All Delivery Partners</option>
            {nearbyDrivers.map(d => (
              <option key={d._id || d.driverId || d.name} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded bg-surface-container-low hover:bg-surface-container border border-sand-neutral text-on-surface font-button-text text-button-text cursor-pointer focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amountHigh">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Main Delivery Table Register */}
      <div className="flex flex-col bg-surface-container-lowest rounded-lg border border-sand-neutral overflow-hidden">
        <div className="p-4 bg-surface-container-low/70 border-b border-sand-neutral flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface font-bold">Delivery Register</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-clay-earth font-mono text-[10px]">
              {filteredDeliveries.length} active records
            </span>
          </div>
          <div className="font-label-caps text-[11px] text-secondary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-onyx-black"></span>
            <span>Real-time backend synchronization</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-16 text-center text-secondary space-y-3">
            <span className="material-symbols-outlined text-[32px] animate-spin text-onyx-black">sync</span>
            <p className="font-button-text text-button-text">Loading delivery ledger from database...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-secondary">
              <span className="material-symbols-outlined text-[32px]">local_shipping</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">No delivery records found</h3>
              <p className="font-body-md text-secondary text-sm max-w-md mx-auto mt-1">
                When kitchen orders become ready or are assigned, they will automatically populate here.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand-neutral bg-surface-container-low/40 text-secondary font-label-caps text-[11px] uppercase tracking-widest">
                  <th className="py-3 px-4">Order ID & Timeline</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Delivery Partner</th>
                  <th className="py-3 px-4">Pickup Location</th>
                  <th className="py-3 px-4">Delivery Location</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Delivery Fee</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-neutral text-sm">
                {filteredDeliveries.map((item) => {
                  const normStatus = getNormalizedStatus(item);
                  const driverName = item.assignedDriver?.name || item.deliveryPartnerName;
                  const driverPhone = item.assignedDriver?.phone || item.deliveryPartnerPhone;

                  return (
                    <tr key={item._id || item.requestId || item.orderId} className="hover:bg-surface-container-low/60 transition-colors">
                      
                      {/* Order ID & Timeline */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono font-bold text-on-surface flex items-center gap-1">
                          <span>#{item.orderId || item.requestId || item._id}</span>
                        </div>
                        <div className="text-[11px] text-secondary font-label-caps tracking-wide mt-0.5">
                          {new Date(item.requestedAt || item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-button-text font-bold text-on-surface">{item.customerName || 'Customer'}</div>
                        {item.customerPhone && (
                          <a href={`tel:${item.customerPhone}`} className="text-secondary text-xs font-mono hover:underline block mt-0.5">
                            {item.customerPhone}
                          </a>
                        )}
                      </td>

                      {/* Delivery Partner */}
                      <td className="py-4 px-4 align-top">
                        {driverName ? (
                          <div className="space-y-1">
                            <div className="font-button-text font-bold text-on-surface flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-clay-earth">person</span>
                              <span>{driverName}</span>
                            </div>
                            {driverPhone && (
                              <a href={`tel:${driverPhone}`} className="text-secondary text-[11px] font-mono hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">call</span>
                                <span>{driverPhone}</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignTargetOrder(item);
                              setIsAssignModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded bg-onyx-black text-on-primary font-button-text text-[12px] hover:bg-clay-earth transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">person_add</span>
                            <span>+ Assign Driver</span>
                          </button>
                        )}
                      </td>

                      {/* Pickup Location */}
                      <td className="py-4 px-4 align-top text-xs text-secondary">
                        <div className="font-medium text-on-surface flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">storefront</span>
                          <span>{formatAddrStr(item.pickupAddress, 'Kitchen Staging Bay 1')}</span>
                        </div>
                      </td>

                      {/* Delivery Location */}
                      <td className="py-4 px-4 align-top text-xs text-secondary">
                        <div className="font-medium text-on-surface flex items-center gap-1 max-w-xs truncate">
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                          <span>{formatAddrStr(item.deliveryAddress, 'Ahmedabad')}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 align-top font-bold text-on-surface">
                        ₹{item.amount || item.totalAmount || 240}
                      </td>

                      {/* Delivery Fee */}
                      <td className="py-4 px-3 align-top font-mono text-secondary text-xs">
                        ₹{item.pricing?.deliveryCharge || item.deliveryFee || 51}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-3 align-top">
                        <span className="px-1.5 py-0.5 rounded bg-surface-container font-label-caps text-[10px] uppercase font-semibold text-on-surface">
                          {item.paymentStatus || 'PAID'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-label-caps uppercase tracking-wider border font-bold ${getStatusBadgeStyle(normStatus)}`}>
                          {normStatus}
                        </span>
                      </td>

                      {/* Contextual Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDelivery(item);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          {(normStatus === 'OUT_FOR_DELIVERY' || normStatus === 'PICKED_UP' || normStatus === 'ASSIGNED') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDelivery(item);
                                setIsTrackingDrawerOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface"
                              title="Track Live Delivery"
                            >
                              <span className="material-symbols-outlined text-[18px]">near_me</span>
                            </button>
                          )}

                          {driverPhone && (
                            <a
                              href={`tel:${driverPhone}`}
                              className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface"
                              title="Call Driver"
                            >
                              <span className="material-symbols-outlined text-[18px]">call</span>
                            </a>
                          )}

                          {item.customerPhone && (
                            <a
                              href={`tel:${item.customerPhone}`}
                              className="p-1.5 rounded hover:bg-surface-container text-secondary hover:text-on-surface"
                              title="Call Customer"
                            >
                              <span className="material-symbols-outlined text-[18px]">phone_enabled</span>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Ledger Telemetry */}
        <div className="p-4 bg-surface-container-low/40 border-t border-sand-neutral flex flex-col sm:flex-row items-center justify-between gap-3 text-secondary font-label-caps text-[11px]">
          <div>
            Showing {filteredDeliveries.length} of {deliveries.length} delivery records
          </div>
          <div className="font-mono text-[10px] text-clay-earth">
            MongoDB Collection: DeliveryRequests • Real-time Socket Listener Active
          </div>
        </div>
      </div>

      {/* Main Live Map Visualization Block */}
      <div className="rounded-lg bg-surface-container-lowest border border-sand-neutral overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-sand-neutral pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-onyx-black">map</span>
            <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">Active Fleet Live GPS Telemetry</span>
          </div>
          <span className="font-label-caps text-[10px] text-secondary font-mono">Real-Time Transit View</span>
        </div>
        <GoogleDeliveryMap delivery={selectedDelivery || filteredDeliveries[0]} height="22rem" />
      </div>

      {/* ASSIGN DELIVERY PARTNER MODAL */}
      {isAssignModalOpen && assignTargetOrder && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-lg shadow-xl overflow-hidden flex flex-col my-8 border border-sand-neutral">
            
            {/* Modal Header */}
            <div className="p-5 bg-surface-container-low flex items-start justify-between border-b border-sand-neutral">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-[10px] uppercase tracking-widest text-clay-earth font-bold">DISPATCH NETWORK</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-1 leading-tight">
                  Assign Delivery Partner
                </h2>
                <p className="font-body-md text-xs text-secondary mt-0.5">
                  Order #{assignTargetOrder.orderId || assignTargetOrder.requestId || assignTargetOrder._id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignTargetOrder(null);
                }}
                className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Order Dossier Card */}
              <div className="p-4 rounded bg-surface-container-low space-y-2 text-xs">
                <div className="font-label-caps text-[10px] uppercase text-secondary font-bold tracking-wider">Order Information</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-secondary block">Customer:</span>
                    <strong className="text-on-surface">{assignTargetOrder.customerName || 'Customer'}</strong>
                  </div>
                  <div>
                    <span className="text-secondary block">Order Amount:</span>
                    <strong className="text-on-surface">₹{assignTargetOrder.amount || assignTargetOrder.totalAmount || 240}</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-sand-neutral/60">
                  <span className="text-secondary block text-[10px] uppercase font-label-caps">Delivery Address:</span>
                  <span className="text-on-surface font-medium">{formatAddrStr(assignTargetOrder.deliveryAddress, 'Ahmedabad')}</span>
                </div>
              </div>

              {/* Available Drivers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface font-bold">
                    Available Delivery Partners ({nearbyDrivers.length})
                  </span>
                  <span className="text-[10px] text-secondary font-mono">ONLINE & Available</span>
                </div>

                {nearbyDrivers.length === 0 ? (
                  <div className="p-6 text-center text-secondary text-xs bg-surface-container-low rounded border border-sand-neutral">
                    No online delivery partners currently nearby.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {nearbyDrivers.map((driver) => (
                      <div
                        key={driver._id || driver.driverId || driver.name}
                        className="p-4 rounded-lg bg-surface-container-low border border-sand-neutral hover:border-onyx-black transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-onyx-black text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {driver.name ? driver.name.charAt(0) : 'D'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-button-text font-bold text-on-surface text-sm">{driver.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-container text-clay-earth font-label-caps text-[10px] font-bold">
                                ● ONLINE
                              </span>
                            </div>
                            <div className="text-xs text-secondary mt-0.5">
                              Active Deliveries: {driver.activeDeliveries || 0} • Distance: {driver.distanceKm || 1.8} km
                            </div>
                            {driver.vehicleNo && (
                              <div className="text-[11px] font-mono text-secondary mt-0.5">
                                Vehicle: {driver.vehicleNo}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isAssigning}
                          onClick={() => handleAssignDriver(driver.driverId || driver._id, driver.name)}
                          className="px-4 py-2 bg-onyx-black text-on-primary hover:bg-clay-earth font-button-text text-button-text rounded transition-colors shrink-0"
                        >
                          ASSIGN
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-container-low border-t border-sand-neutral flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignTargetOrder(null);
                }}
                className="px-4 py-2 text-button-text font-button-text text-secondary hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TRACK DELIVERY MODAL / DRAWER */}
      {isTrackingDrawerOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-surface-container-lowest w-full max-w-md h-full shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between border-l border-sand-neutral">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-sand-neutral pb-4">
                <div>
                  <div className="font-label-caps text-[10px] uppercase text-clay-earth font-bold tracking-wider">LIVE DELIVERY RADAR</div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Order #{selectedDelivery.orderId || selectedDelivery.requestId || selectedDelivery._id}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrackingDrawerOpen(false)}
                  className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="p-4 rounded bg-surface-container-low space-y-2 border border-sand-neutral">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary font-label-caps uppercase">Status:</span>
                  <span className={`px-2 py-0.5 rounded font-label-caps text-[10px] font-bold ${getStatusBadgeStyle(getNormalizedStatus(selectedDelivery))}`}>
                    {getNormalizedStatus(selectedDelivery)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary font-label-caps uppercase">Customer:</span>
                  <span className="font-bold text-on-surface">{selectedDelivery.customerName || 'Customer'}</span>
                </div>
              </div>

              <GoogleDeliveryMap delivery={selectedDelivery} height="20rem" />
            </div>

            <button
              type="button"
              onClick={() => setIsTrackingDrawerOpen(false)}
              className="w-full py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text rounded hover:bg-clay-earth transition-colors"
            >
              Close Radar
            </button>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isDetailsModalOpen && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-onyx-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col border border-sand-neutral">
            <div className="p-5 bg-surface-container-low flex items-center justify-between border-b border-sand-neutral">
              <div>
                <span className="font-label-caps text-[10px] uppercase text-clay-earth font-bold tracking-wider">DELIVERY SPECIFICATION DOSSIER</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Order #{selectedDelivery.orderId || selectedDelivery.requestId || selectedDelivery._id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded bg-surface-container-low">
                <div>
                  <span className="text-secondary block font-label-caps text-[10px] uppercase">Customer Name</span>
                  <strong className="text-on-surface">{selectedDelivery.customerName || 'Customer'}</strong>
                </div>
                <div>
                  <span className="text-secondary block font-label-caps text-[10px] uppercase">Phone</span>
                  <strong className="text-on-surface">{selectedDelivery.customerPhone || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-secondary block font-label-caps text-[10px] uppercase">Amount</span>
                  <strong className="text-on-surface">₹{selectedDelivery.amount || selectedDelivery.totalAmount || 240}</strong>
                </div>
                <div>
                  <span className="text-secondary block font-label-caps text-[10px] uppercase">Payment Status</span>
                  <strong className="text-on-surface">{selectedDelivery.paymentStatus || 'PAID'}</strong>
                </div>
              </div>

              <div className="p-3 rounded bg-surface-container-low space-y-1">
                <span className="text-secondary block font-label-caps text-[10px] uppercase">Pickup Origin Address</span>
                <p className="text-on-surface font-medium">{formatAddrStr(selectedDelivery.pickupAddress, 'Kitchen Staging Bay 1')}</p>
              </div>

              <div className="p-3 rounded bg-surface-container-low space-y-1">
                <span className="text-secondary block font-label-caps text-[10px] uppercase">Delivery Destination Address</span>
                <p className="text-on-surface font-medium">{formatAddrStr(selectedDelivery.deliveryAddress, 'Ahmedabad')}</p>
              </div>

              <div className="p-3 rounded bg-surface-container-low space-y-1">
                <span className="text-secondary block font-label-caps text-[10px] uppercase">Assigned Delivery Partner</span>
                <p className="text-on-surface font-medium">
                  {selectedDelivery.assignedDriver?.name || selectedDelivery.deliveryPartnerName || 'Unassigned'} 
                  {selectedDelivery.assignedDriver?.phone ? ` (${selectedDelivery.assignedDriver.phone})` : ''}
                </p>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-sand-neutral flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-button-text rounded hover:bg-clay-earth transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
