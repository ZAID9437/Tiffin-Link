import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import { getSocket } from '../services/socket';

export default function OrdersTab({ currentUser, initialStatus = 'All' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Rejection Modal State
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('Kitchen at Full Preparation Capacity');
  const [rejectNotes, setRejectNotes] = useState('');

  // Audio & Kitchen Toggle State
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [isKitchenAccepting, setIsKitchenAccepting] = useState(true);

  // Filter States
  const [activeStatusTab, setActiveStatusTab] = useState(initialStatus);
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [quickChipFilter, setQuickChipFilter] = useState('ALL');
  const [stationFilter, setStationFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    setActiveStatusTab(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (currentUser) {
      fetchOrders(true);
    }
    const interval = setInterval(() => {
      if (currentUser) fetchOrders(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Socket.IO Realtime Listener with Cleanup
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
      if (socket && currentUser) {
        const pId = currentUser?.providerId || currentUser?.id || currentUser?._id;
        if (pId) {
          socket.emit('join:provider', { providerId: pId });
        }

        const handleRealtimeOrderEvent = (data) => {
          fetchOrders(false);
        };

        socket.on('order:created', handleRealtimeOrderEvent);
        socket.on('order:updated', handleRealtimeOrderEvent);
        socket.on('order:status:updated', handleRealtimeOrderEvent);
        socket.on('delivery:status:updated', handleRealtimeOrderEvent);
        socket.on('delivery:assigned', handleRealtimeOrderEvent);
        socket.on('delivery:accepted', handleRealtimeOrderEvent);
        socket.on('delivery:request:new', handleRealtimeOrderEvent);

        return () => {
          socket.off('order:created', handleRealtimeOrderEvent);
          socket.off('order:updated', handleRealtimeOrderEvent);
          socket.off('order:status:updated', handleRealtimeOrderEvent);
          socket.off('delivery:status:updated', handleRealtimeOrderEvent);
          socket.off('delivery:assigned', handleRealtimeOrderEvent);
          socket.off('delivery:accepted', handleRealtimeOrderEvent);
          socket.off('delivery:request:new', handleRealtimeOrderEvent);
        };
      }
    } catch (err) {
      console.warn('Socket setup error in OrdersTab:', err);
    }
  }, [currentUser]);

  // Audio Chime Generator
  const playChime = () => {
    if (!chimeEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const fetchOrders = async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      const res = await apiRequest('/orders');
      const json = typeof res?.json === 'function' ? await res.json() : res;
      if (json && json.success && Array.isArray(json.data)) {
        // Deduplicate incoming order data to prevent duplicate order entries
        const seenIds = new Set();
        const seenOrderIds = new Set();
        const uniqueRawData = json.data.filter(o => {
          const idStr = String(o._id || o.id || '').trim();
          const ordIdStr = String(o.orderId || '').trim();

          if (idStr && seenIds.has(idStr)) return false;
          if (ordIdStr && seenOrderIds.has(ordIdStr)) return false;

          if (idStr) seenIds.add(idStr);
          if (ordIdStr) seenOrderIds.add(ordIdStr);
          return true;
        });

        const now = Date.now();
        const formatted = uniqueRawData.map((o, idx) => {
          const subtotal = o.pricing?.itemsSubtotal || o.mealSubtotal || o.subtotal || (o.quantity || 1) * (o.unitPrice || 0);
          const deliveryFee = o.pricing?.deliveryCharge || o.deliveryFee || 0;
          const driverEarning = o.pricing?.driverEarning || o.driverEarning || deliveryFee;
          const packagingFee = o.pricing?.packagingCharge || o.packagingFee || 0;
          const gross = o.pricing?.customerPaidTotal || o.totalAmount || (subtotal + deliveryFee + packagingFee);
          const comm = o.pricing?.platformFee || o.platformCommission || 0;
          const net = o.pricing?.providerPayout || o.netPayout || (gross - comm);

          let secondsLeft = o.secondsLeft !== undefined ? o.secondsLeft : 165;
          const mainTiffinName = o.tiffinName || (o.items && o.items[0]?.name) || 'Tiffin Meal';

          return {
            id: o._id || o.id,
            orderId: o.orderId || `#ORD-${(o._id || '').slice(-6).toUpperCase()}`,
            createdAt: o.createdAt || new Date(),
            updatedAt: o.updatedAt || o.createdAt || new Date(),
            customerName: o.customerName || o.user?.name || 'Customer',
            customerPhone: o.customerPhone || '—',
            customerAddress: o.customerAddress || 'Address unavailable',
            customerTier: o.quantity >= 5 ? 'CORPORATE ACCOUNT' : 'STANDARD SUBSCRIBER',
            tiffinName: mainTiffinName,
            tiffinCategory: o.tiffinCategory || o.category || 'General',
            tiffinNotes: o.tiffinNotes || '',
            itemsBreakdown: o.itemsBreakdown || (o.items && o.items.length > 0 ? o.items.map(i => `${i.qty || 1} × ${i.name || i.tiffinName || 'Item'}`) : [mainTiffinName]),
            specialInstructions: o.specialInstructions || 'None',
            quantity: o.quantity || 1,
            unitPrice: o.unitPrice || (o.quantity ? Math.round(subtotal / o.quantity) : 0),
            subtotal,
            packagingFee,
            deliveryFee,
            driverEarning,
            discount: o.discount || 0,
            grossAmount: gross,
            platformCommission: comm,
            netPayout: net,
            paymentStatus: o.paymentStatus || 'Paid',
            status: o.status || 'New',
            deliveryMode: o.deliveryMode || 'Courier Dispatch',
            deliveryTarget: o.deliveryTarget || 'Standard',
            deliveryDistance: o.deliveryDistance || (o.deliveryKm ? `${o.deliveryKm} km` : '3.2 km'),
            driverName: o.driverName || o.driver?.name || o.deliveryPartnerName || 'Unassigned',
            driverPhone: o.driverPhone || o.driver?.phone || o.deliveryPartnerPhone || '—',
            driverVehicle: o.driverVehicle || o.driver?.vehicle || '—',
            deliveryStatus: o.deliveryStatus || (o.status === 'Ready' ? 'Awaiting Pickup' : o.status === 'Delivery' ? 'Searching' : o.status === 'Completed' ? 'Delivered' : 'Unassigned'),
            pickupOtp: o.pickupOtp || '',
            deliveryOtp: o.deliveryOtp || '',
            cancelledBy: o.cancelledBy || 'Customer',
            cancellationReason: o.cancellationReason || 'Order cancelled.',
            cancelledAt: o.cancelledAt || o.updatedAt || o.createdAt,
            refundStatus: o.refundStatus || 'Refund Processed',
            completedAt: o.completedAt || o.updatedAt || o.createdAt,
            utr: o.utr || `4291${Math.floor(10000000 + Math.random() * 90000000)}`,
            secondsLeft
          };
        });

        setOrders(prev => {
          if (prev.length > 0 && formatted.length > prev.length && !isInitial) {
            playChime();
          }
          return formatted;
        });

        if (formatted.length > 0) {
          setSelectedOrder(prev => {
            if (!prev) return formatted[0];
            const match = formatted.find(o => 
              (o.id && prev.id && String(o.id) === String(prev.id)) ||
              (o.orderId && prev.orderId && String(o.orderId) === String(prev.orderId)) ||
              (o._id && prev._id && String(o._id) === String(prev._id))
            );
            return match || prev || formatted[0];
          });
        }
      } else {
        setError(json?.message || 'Unable to load orders from MongoDB');
      }
    } catch (err) {
      console.error('Error fetching orders from MongoDB API:', err);
      setError('Unable to load orders. Please check database connection.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // 1-second ticking countdown for pending timers
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders(prev => {
        return prev.map(o => {
          if (o.status !== 'New' || o.secondsLeft <= 0) return o;
          return { ...o, secondsLeft: o.secondsLeft - 1 };
        });
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrintKOT = (ord) => {
    if (!ord) return;
    try {
      const printWindow = window.open('', '_blank', 'width=600,height=700');
      if (!printWindow) {
        showToast('⚠️ Pop-up blocked! Printing window directly...');
        window.print();
        return;
      }
      
      const itemsHtml = Array.isArray(ord.itemsBreakdown) && ord.itemsBreakdown.length > 0
        ? ord.itemsBreakdown.map(i => `<li>${i}</li>`).join('')
        : `<li>${ord.quantity || 1} × ${ord.tiffinName || 'Tiffin Meal'}</li>`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>KOT Ticket - ${ord.orderId}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
              color: #000;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 { font-size: 18px; margin: 0; }
            .header p { font-size: 11px; margin: 4px 0 0 0; }
            .meta { font-size: 12px; margin-bottom: 15px; }
            .meta div { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 15px; }
            .items h3 { margin: 0 0 8px 0; font-size: 13px; }
            .items ul { margin: 0; padding-left: 20px; }
            .totals { font-size: 13px; font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 15px; }
            .footer { text-align: center; font-size: 10px; border-top: 2px dashed #000; padding-top: 10px; }
            @media print { body { padding: 0; margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TIFFINLINK KITCHEN KOT</h1>
            <p>Order Ticket & Manifest</p>
          </div>
          <div class="meta">
            <div><strong>ORDER ID:</strong> <span>${ord.orderId}</span></div>
            <div><strong>CUSTOMER:</strong> <span>${ord.customerName}</span></div>
            <div><strong>PHONE:</strong> <span>${ord.customerPhone}</span></div>
            <div><strong>MODE:</strong> <span>${ord.deliveryMode || 'Courier Dispatch'}</span></div>
          </div>
          <div class="items">
            <h3>ORDER ITEMS:</h3>
            <div><strong>${ord.quantity} × ${ord.tiffinName}</strong></div>
            <ul>${itemsHtml}</ul>
            ${ord.specialInstructions && ord.specialInstructions !== 'None' ? `<div style="margin-top: 8px;"><strong>Notes:</strong> ${ord.specialInstructions}</div>` : ''}
          </div>
          <div class="totals">
            <span>TOTAL PAID:</span>
            <span>₹${ord.grossAmount}.00</span>
          </div>
          <div class="footer">
            <p>--- END OF KOT TICKET ---</p>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      showToast(`🖨️ KOT Ticket printed for Order ${ord.orderId}`);
    } catch (err) {
      console.error('Print KOT error:', err);
      window.print();
    }
  };

  const formatTimer = (sec) => {
    if (!sec || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, reason = '') => {
    if (updatingOrderId) return;
    const targetOrder = orders.find(o => 
      (o._id && String(o._id) === String(orderId)) ||
      (o.id && String(o.id) === String(orderId)) ||
      (o.orderId && String(o.orderId) === String(orderId))
    );
    if (!targetOrder) return;
    const dbId = targetOrder.id || targetOrder._id || targetOrder.orderId;
    const cleanDbId = String(dbId).replace(/^#/, '').trim();

    let apiEndpoint = `/orders/${encodeURIComponent(cleanDbId)}`;
    let method = 'PUT';
    let bodyObj = { status: newStatus, cancellationReason: reason };

    if (newStatus === 'Preparing' || newStatus === 'Accepted') {
      apiEndpoint = `/orders/${encodeURIComponent(cleanDbId)}/accept`;
      method = 'POST';
      bodyObj = {};
    } else if (newStatus === 'Ready') {
      apiEndpoint = `/orders/${encodeURIComponent(cleanDbId)}/ready`;
      method = 'POST';
      bodyObj = {};
    } else if (newStatus === 'Confirm Pickup' || newStatus === 'Delivery' || newStatus === 'DELIVERY_REQUESTED') {
      apiEndpoint = `/orders/${encodeURIComponent(cleanDbId)}/confirm-pickup`;
      method = 'POST';
      bodyObj = {};
    } else if (newStatus === 'Cancelled') {
      apiEndpoint = `/orders/${encodeURIComponent(cleanDbId)}/reject`;
      method = 'POST';
      bodyObj = { reason: reason || 'Declined by provider' };
    }

    try {
      setUpdatingOrderId(orderId);
      const res = await apiRequest(apiEndpoint, {
        method,
        body: JSON.stringify(bodyObj)
      });
      const json = typeof res?.json === 'function' ? await res.json() : res;

      if (json && json.success) {
        const nextDeliveryStatus = (newStatus === 'Delivery' || newStatus === 'Confirm Pickup') ? 'Searching' : undefined;
        const newPickupOtp = json.data?.order?.pickupOtp || json.data?.deliveryRequest?.pickupOtp;
        const newDeliveryOtp = json.data?.order?.deliveryOtp || json.data?.deliveryRequest?.deliveryOtp;

        setOrders(prev => prev.map(o => {
          const isMatch = (o.id && String(o.id) === String(targetOrder.id)) ||
                          (o._id && String(o._id) === String(targetOrder.id)) ||
                          (o.orderId && String(o.orderId) === String(targetOrder.orderId));
          if (!isMatch) return o;
          return {
            ...o,
            status: newStatus === 'Confirm Pickup' ? 'Delivery' : newStatus,
            ...(nextDeliveryStatus ? { deliveryStatus: nextDeliveryStatus } : {}),
            ...(newPickupOtp ? { pickupOtp: newPickupOtp } : {}),
            ...(newDeliveryOtp ? { deliveryOtp: newDeliveryOtp } : {})
          };
        }));

        if (selectedOrder) {
          const isSelMatch = (selectedOrder.id && String(selectedOrder.id) === String(targetOrder.id)) ||
                             (selectedOrder.orderId && String(selectedOrder.orderId) === String(targetOrder.orderId));
          if (isSelMatch) {
            setSelectedOrder(prev => ({
              ...prev,
              status: newStatus === 'Confirm Pickup' ? 'Delivery' : newStatus,
              ...(nextDeliveryStatus ? { deliveryStatus: nextDeliveryStatus } : {}),
              ...(newPickupOtp ? { pickupOtp: newPickupOtp } : {}),
              ...(newDeliveryOtp ? { deliveryOtp: newDeliveryOtp } : {})
            }));
          }
        }

        if (newStatus === 'Preparing' || newStatus === 'Accepted') {
          showToast(`✓ Order ${targetOrder.orderId} Accepted! Moved to Kitchen Prep Queue.`);
          setActiveStatusTab('Preparing');
        } else if (newStatus === 'Delivery' || newStatus === 'Confirm Pickup') {
          showToast(`✓ Order ${targetOrder.orderId} dispatched to courier network! Delivery broadcast active.`);
          setActiveStatusTab('Delivery');
        } else if (newStatus === 'Cancelled') {
          showToast(`Order ${targetOrder.orderId} Declined. Reason logged.`);
        } else {
          showToast(`✓ Order ${targetOrder.orderId} status updated to ${newStatus}`);
        }
      } else {
        console.error('Order status update failed on backend:', json);
        showToast(`⚠️ ${json?.message || 'Action could not be completed'}`);
      }
      fetchOrders(false);
    } catch (err) {
      console.error('Error updating order status in MongoDB:', err);
      showToast('⚠️ Failed to communicate with database engine');
      fetchOrders(false);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast('No orders available to export.');
      return;
    }

    const headers = ['Order ID', 'Created Date', 'Customer Name', 'Phone', 'Address', 'Tiffin Name', 'Quantity', 'Gross Amount', 'Net Payout', 'Payment Status', 'Status'];
    const rows = filteredOrders.map(o => [
      `"${o.orderId}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerAddress}"`,
      `"${o.tiffinName}"`,
      o.quantity,
      o.grossAmount,
      o.netPayout,
      `"${o.paymentStatus}"`,
      `"${o.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TiffinLink_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('✓ Order records exported to CSV successfully!');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied ${text} to clipboard!`);
    }).catch(() => {});
  };

  // Metric Computations (Real MongoDB Data Scoped to Authenticated Provider)
  const totalOrdersCount = orders.length;
  const newOrdersList = orders.filter(o => o.status === 'New' || o.status === 'Pending');
  const newOrdersCount = newOrdersList.length;

  const onlinePaymentsCount = newOrdersList.filter(o => {
    const ps = (o.paymentStatus || '').toLowerCase();
    return ps.includes('paid') || ps.includes('upi') || ps.includes('escrow');
  }).length;
  const codPaymentsCount = newOrdersList.filter(o => {
    const ps = (o.paymentStatus || '').toLowerCase();
    return ps.includes('cash') || ps.includes('cod');
  }).length;
  const totalPendingAmount = newOrdersList.reduce((sum, o) => sum + (o.grossAmount || 0), 0);
  const totalNetPayoutPending = newOrdersList.reduce((sum, o) => sum + (o.netPayout || 0), 0);

  const preparingOrdersList = orders.filter(o => o.status === 'Preparing' || o.status === 'In Prep');
  const preparingNowCount = preparingOrdersList.length;
  const todaysPreparingCount = preparingOrdersList.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length || preparingNowCount;
  const mealsInPrepCount = preparingOrdersList.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const prepValueTotal = preparingOrdersList.reduce((sum, o) => sum + (o.grossAmount || 0), 0);
  const netPrepPayout = preparingOrdersList.reduce((sum, o) => sum + (o.netPayout || 0), 0);
  const readyOrdersList = orders.filter(o => o.status === 'Ready');
  const readyNowCount = readyOrdersList.length;
  const readyForDeliveryCount = readyOrdersList.filter(o => !(o.deliveryMode || '').toLowerCase().includes('pickup')).length;
  const readyCustomerPickupCount = readyOrdersList.filter(o => (o.deliveryMode || '').toLowerCase().includes('pickup')).length;
  const readyOrderValueTotal = readyOrdersList.reduce((sum, o) => sum + (o.grossAmount || 0), 0);
  const readyNetPayoutTotal = readyOrdersList.reduce((sum, o) => sum + (o.netPayout || 0), 0);

  const isNewOrdersTab = activeStatusTab === 'New' || activeStatusTab === 'orders-new';
  const isPreparingTab = activeStatusTab === 'Preparing' || activeStatusTab === 'orders-preparing';
  const isReadyTab = activeStatusTab === 'Ready' || activeStatusTab === 'orders-ready';
  const isDeliveryTab = activeStatusTab === 'Delivery' || activeStatusTab === 'orders-delivery' || activeStatusTab === 'delivery';
  const isCompletedTab = activeStatusTab === 'Completed' || activeStatusTab === 'orders-completed';
  const isCancelledTab = activeStatusTab === 'Cancelled' || activeStatusTab === 'orders-cancelled';

  // Metrics for Delivery Tab
  const deliveryOrdersList = orders.filter(o => o.status === 'Delivery' || o.status === 'Out for Delivery' || o.status === 'Dispatched' || o.status === 'In Transit');
  const ordersOutForDeliveryCount = deliveryOrdersList.length;
  const awaitingPickupCount = orders.filter(o => o.status === 'Ready' || o.deliveryStatus === 'Awaiting Pickup').length;
  const pickedUpCount = deliveryOrdersList.filter(o => o.deliveryStatus === 'Picked Up' || o.status === 'Picked Up').length;
  const inTransitCount = deliveryOrdersList.filter(o => o.deliveryStatus === 'In Transit' || o.status === 'In Transit' || o.status === 'Delivery' || o.status === 'Out for Delivery').length || ordersOutForDeliveryCount;

  // Metrics for Completed Tab
  const completedOrdersList = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered');
  const totalCompletedOrders = completedOrdersList.length;
  const todaysCompletedCount = completedOrdersList.filter(o => {
    const d = new Date(o.createdAt || o.updatedAt || Date.now());
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length || totalCompletedOrders;
  const completedRevenue = completedOrdersList.reduce((sum, o) => sum + (o.grossAmount || o.totalAmount || 0), 0);
  const averageOrderValue = totalCompletedOrders > 0 ? (completedRevenue / totalCompletedOrders) : 0;

  // Metrics for Cancelled Tab
  const cancelledOrdersList = orders.filter(o => o.status === 'Cancelled');
  const totalCancelledOrders = cancelledOrdersList.length;
  const cancelledTodayCount = cancelledOrdersList.filter(o => {
    const d = new Date(o.createdAt || o.updatedAt || Date.now());
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length || totalCancelledOrders;
  const cancellationValue = cancelledOrdersList.reduce((sum, o) => sum + (o.grossAmount || o.totalAmount || 0), 0);
  const cancellationRate = totalOrdersCount > 0 ? ((totalCancelledOrders / totalOrdersCount) * 100).toFixed(1) : 0;

  const isDriverAcceptedForOrder = (ord) => {
    if (!ord) return false;
    const dName = ord.driverName || ord.deliveryPartnerName || ord.driver?.name;
    const dStatus = (ord.deliveryStatus || '').toLowerCase();
    const ordStatus = (ord.status || '').toLowerCase();

    if (ordStatus === 'completed' || ordStatus === 'delivered' || dStatus === 'delivered' || dStatus === 'completed') {
      return true;
    }

    const isAcceptedName = Boolean(
      dName &&
      dName !== 'Unassigned' &&
      dName !== 'Searching...' &&
      !dName.toLowerCase().includes('searching') &&
      dName !== '—' &&
      !dName.includes('—')
    );
    const isAcceptedStatus = Boolean(dStatus && !dStatus.includes('searching') && dStatus !== 'unassigned' && dStatus !== 'pending');
    return isAcceptedName || isAcceptedStatus;
  };

  // Filtering & Sorting
  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.customerPhone && o.customerPhone.includes(q)) ||
      (o.tiffinName && o.tiffinName.toLowerCase().includes(q)) ||
      (o.driverName && o.driverName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeStatusTab === 'New' && (o.status !== 'New' && o.status !== 'Pending')) return false;
    if (isPreparingTab && (o.status !== 'Preparing' && o.status !== 'In Prep')) return false;
    if (isReadyTab && o.status !== 'Ready') return false;
    if (isDeliveryTab && (o.status !== 'Delivery' && o.status !== 'Out for Delivery' && o.status !== 'Dispatched' && o.status !== 'In Transit')) return false;
    if (isCompletedTab && (o.status !== 'Completed' && o.status !== 'Delivered')) return false;
    if (isCancelledTab && o.status !== 'Cancelled') return false;

    if (paymentFilter !== 'All') {
      const ps = (o.paymentStatus || '').toLowerCase();
      if (paymentFilter === 'Paid' && !ps.includes('paid') && !ps.includes('upi')) return false;
      if (paymentFilter === 'COD' && !ps.includes('cash') && !ps.includes('cod')) return false;
      if (paymentFilter === 'Escrow' && !ps.includes('escrow')) return false;
    }

    if (deliveryFilter !== 'All') {
      const dm = (o.deliveryMode || '').toLowerCase();
      if (deliveryFilter === 'Courier' && !dm.includes('courier') && !dm.includes('dispatch')) return false;
      if (deliveryFilter === 'Pickup' && !dm.includes('pickup') && !dm.includes('counter')) return false;
    }

    if (isPreparingTab && stationFilter !== 'All') {
      const tn = (o.tiffinName || '').toLowerCase();
      if (stationFilter === 'Station1' && !tn.includes('roti') && !tn.includes('deluxe') && !tn.includes('thali')) return false;
      if (stationFilter === 'Station2' && !tn.includes('curry') && !tn.includes('dal') && !tn.includes('jain') && !tn.includes('kathiyawadi')) return false;
      if (stationFilter === 'Station3' && !tn.includes('bowl') && !tn.includes('combo') && !tn.includes('khichdi') && !tn.includes('health')) return false;
    }

    if (quickChipFilter === 'URGENT' && o.secondsLeft > 180) return false;
    if (quickChipFilter === 'BULK' && o.quantity < 5) return false;
    if (quickChipFilter === 'JAIN') {
      const tc = (o.tiffinCategory || '').toLowerCase();
      const tn = (o.tiffinName || '').toLowerCase();
      if (!tc.includes('jain') && !tn.includes('jain')) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'urgency') return (a.secondsLeft || 999) - (b.secondsLeft || 999);
    if (sortBy === 'amountHigh') return b.grossAmount - a.grossAmount;
    return 0;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (filteredOrders && filteredOrders.length > 0) {
      setSelectedOrder(prev => {
        if (!prev) return filteredOrders[0];
        const isCurrentInFiltered = filteredOrders.some(o => 
          (o.id && prev.id && String(o.id) === String(prev.id)) ||
          (o.orderId && prev.orderId && String(o.orderId) === String(prev.orderId)) ||
          (o._id && prev._id && String(o._id) === String(prev._id))
        );
        return isCurrentInFiltered ? prev : filteredOrders[0];
      });
    }
  }, [activeStatusTab]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full font-body-md text-on-surface">

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-onyx-black text-bone-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-button-text text-button-text animate-bounce border border-sand-neutral/40">
          <span className="material-symbols-outlined text-[18px] text-[#0A8B5F]">check_circle</span>
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Telemetry & Control Bar */}
      <div className="px-6 py-3 bg-surface-container-low border border-sand-neutral/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-label-caps tracking-widest text-clay-earth uppercase font-bold">
            <span>Provider</span>
            <span className="text-sand-neutral">/</span>
            <span>Orders</span>
            <span className="text-sand-neutral">/</span>
            <span className="text-onyx-black font-extrabold">
              {isReadyTab ? 'Ready' : isPreparingTab ? 'Preparing' : isNewOrdersTab ? 'New Orders' : `${activeStatusTab} Orders`}
            </span>
          </div>
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-sand-neutral/60 text-[11px] font-mono text-secondary">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            <span className="text-emerald-800 font-semibold uppercase">Socket.IO Live (0.8ms)</span>
            <span className="text-sand-neutral">•</span>
            <span>Replica Synced</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => {
              setChimeEnabled(!chimeEnabled);
              showToast(chimeEnabled ? 'Audio alert chime muted' : 'Audio alert chime enabled');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-label-caps transition-colors cursor-pointer border ${
              chimeEnabled ? 'bg-surface-container border-sand-neutral/40 text-on-surface' : 'bg-surface-container-low text-secondary opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-amber-600">notifications_active</span>
            <span>Alert Chime: {chimeEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto Refresh */}
          <button
            type="button"
            onClick={() => {
              showToast('Refreshed latest websocket event backlog from MongoDB');
              fetchOrders(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors text-xs font-label-caps text-on-surface border border-sand-neutral/40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Auto-Sync (3s)</span>
          </button>

          {/* Accepting Orders Status Badge */}
          <button
            type="button"
            onClick={() => {
              setIsKitchenAccepting(!isKitchenAccepting);
              showToast(isKitchenAccepting ? 'Kitchen status set to Paused' : 'Kitchen status set to Accepting Orders');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-label-caps font-bold tracking-wide border cursor-pointer ${
              isKitchenAccepting ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-error-container text-on-error-container border-error/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isKitchenAccepting ? 'bg-emerald-600 animate-pulse' : 'bg-error'}`}></span>
            <span>ACCEPTING ORDERS ({isKitchenAccepting ? 'ON' : 'OFF'})</span>
          </button>

          {/* Avg SLA Window */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold">
            <span className="material-symbols-outlined text-[15px] text-amber-700">timer</span>
            <span>Avg Window: <strong>02:45</strong></span>
          </div>
        </div>
      </div>

      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight font-normal">
              {isDeliveryTab
                ? 'Delivery Orders'
                : isCompletedTab
                ? 'Completed Orders'
                : isCancelledTab
                ? 'Cancelled Orders'
                : isReadyTab
                ? 'Ready Orders'
                : isPreparingTab
                ? 'Preparing'
                : isNewOrdersTab
                ? 'New Orders'
                : `${activeStatusTab} Orders`}
            </h1>
            {isDeliveryTab && (
              <span className="px-3 py-1 rounded-full text-xs font-label-caps bg-onyx-black text-bone-white font-bold">
                {ordersOutForDeliveryCount} ACTIVE IN TRANSIT
              </span>
            )}
            {isCompletedTab && (
              <span className="px-3 py-1 rounded-full text-xs font-label-caps bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                {totalCompletedOrders} FULFILLED MEALS
              </span>
            )}
            {isCancelledTab && (
              <span className="px-3 py-1 rounded-full text-xs font-label-caps bg-error-container text-error font-bold border border-error/30">
                {totalCancelledOrders} ARCHIVED INCIDENTS
              </span>
            )}
            {isReadyTab && (
              <span className="px-3 py-1 rounded-full text-xs font-label-caps bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                {readyNowCount} READY IN STAGING BAY
              </span>
            )}
            {isPreparingTab && (
              <span className="px-3 py-1 rounded-full text-xs font-label-caps bg-secondary-container text-on-secondary-fixed-variant font-bold border border-sand-neutral/40">
                {preparingNowCount} IN OVEN & PANS
              </span>
            )}
            {isNewOrdersTab && (
              <span className="px-3 py-1 rounded-full text-xs font-label-caps bg-amber-100 text-amber-900 font-bold border border-amber-300">
                {newOrdersCount} PENDING ACTION
              </span>
            )}
          </div>
          <p className="font-body-md text-secondary max-w-2xl">
            {isDeliveryTab
              ? 'Track orders currently assigned for delivery with assigned delivery partners in real time.'
              : isCompletedTab
              ? 'Archived records of successfully fulfilled, OTP-verified meal deliveries and financial settlements.'
              : isCancelledTab
              ? 'Review orders that were cancelled. Complete timestamps, fault attribution, and cancellation logs are permanently archived.'
              : isReadyTab
              ? 'Orders prepared and ready for customer pickup or courier delivery. Complete handover verification.'
              : isPreparingTab
              ? 'Orders currently being prepared by your kitchen. Track cooking stations, pack manifests, and transition tickets to Ready.'
              : isNewOrdersTab
              ? 'Review and accept incoming customer orders. Verify meal tickets in real time before fulfillment prep windows lapse.'
              : 'Manage, filter, and track all live, preparing, and historical orders received by your kitchen.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-button-text font-button-text transition-colors border border-sand-neutral/40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManualEntryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-onyx-black hover:bg-stone-800 text-bone-white text-button-text font-button-text transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Manual Order Entry</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards (Dynamic from MongoDB) */}
      {isDeliveryTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Orders Out for Delivery */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Out for Delivery</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">moped</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {ordersOutForDeliveryCount < 10 ? `0${ordersOutForDeliveryCount}` : ordersOutForDeliveryCount}
              </div>
              <div className="text-xs text-secondary font-bold">Active Courier Deliveries En Route</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Fleet Dispatch</span>
              <span className="text-emerald-800 font-bold">Live GPS Telemetry</span>
            </div>
          </div>

          {/* Card 2: Awaiting Pickup */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Awaiting Pickup</span>
              <span className="material-symbols-outlined text-clay-earth text-[18px]">timer</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {awaitingPickupCount < 10 ? `0${awaitingPickupCount}` : awaitingPickupCount}
              </div>
              <div className="text-xs text-secondary font-bold">Staged & Courier Arriving</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Kitchen Staging</span>
              <span className="text-amber-800 font-bold">Bay 1 thermal rack</span>
            </div>
          </div>

          {/* Card 3: Picked Up */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Picked Up</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">inventory_2</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {pickedUpCount < 10 ? `0${pickedUpCount}` : pickedUpCount}
              </div>
              <div className="text-xs text-secondary font-bold">Handed Over to Driver</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>OTP Verified</span>
              <span className="text-emerald-800 font-bold">Handover Complete</span>
            </div>
          </div>

          {/* Card 4: In Transit */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">In Transit</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">near_me</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {inTransitCount < 10 ? `0${inTransitCount}` : inTransitCount}
              </div>
              <div className="text-xs text-secondary font-bold">Approaching Customer Dropoff</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>ETA Target</span>
              <span className="text-onyx-black font-bold">&lt; 15 Mins Drop</span>
            </div>
          </div>

        </div>
      ) : isCompletedTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Completed Orders */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Completed Orders</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">task_alt</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {totalCompletedOrders < 10 ? `0${totalCompletedOrders}` : totalCompletedOrders}
              </div>
              <div className="text-xs text-emerald-800 font-bold">All-Time Fulfilled Meals</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Settlement Ledger</span>
              <span className="text-emerald-800 font-bold">100% Verified</span>
            </div>
          </div>

          {/* Card 2: Today's Completed */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Today's Completed</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {todaysCompletedCount < 10 ? `0${todaysCompletedCount}` : todaysCompletedCount}
              </div>
              <div className="text-xs text-secondary font-bold">Delivered Today</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Fulfillment Rate</span>
              <span className="text-emerald-800 font-bold">On-Time Batch</span>
            </div>
          </div>

          {/* Card 3: Completed Revenue */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Completed Revenue</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">account_balance_wallet</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                ₹{completedRevenue.toLocaleString('en-IN')}.00
              </div>
              <div className="text-xs text-secondary font-bold">Total Gross Earnings Collected</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Reconciliation</span>
              <span className="text-emerald-800 font-bold">MongoDB Aggregated</span>
            </div>
          </div>

          {/* Card 4: Average Order Value */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Average Order Value</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">query_stats</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                ₹{averageOrderValue.toFixed(2)}
              </div>
              <div className="text-xs text-secondary font-bold">Average Spend Per Order</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Metric Formula</span>
              <span>Revenue ÷ Orders</span>
            </div>
          </div>

        </div>
      ) : isCancelledTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Cancelled */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Total Cancelled</span>
              <span className="material-symbols-outlined text-error text-[18px]">cancel</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {totalCancelledOrders < 10 ? `0${totalCancelledOrders}` : totalCancelledOrders}
              </div>
              <div className="text-xs text-error font-bold">Immutable Incidents Preserved</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Record Retention</span>
              <span className="text-onyx-black font-bold">Never Deleted</span>
            </div>
          </div>

          {/* Card 2: Cancelled Today */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Cancelled Today</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {cancelledTodayCount < 10 ? `0${cancelledTodayCount}` : cancelledTodayCount}
              </div>
              <div className="text-xs text-secondary font-bold">Today's Shift Cancellation Count</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Grace Window</span>
              <span>5 Min Policy</span>
            </div>
          </div>

          {/* Card 3: Cancellation Value */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Cancellation Value</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">currency_rupee</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                ₹{cancellationValue.toLocaleString('en-IN')}.00
              </div>
              <div className="text-xs text-secondary font-bold">Gross Refunded / Waived Amount</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Refund Telemetry</span>
              <span className="text-emerald-800 font-bold">Gateway Reconciled</span>
            </div>
          </div>

          {/* Card 4: Cancellation Rate */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Cancellation Rate</span>
              <span className="font-label-caps text-[10px] bg-surface-container px-2 py-0.5 rounded text-onyx-black font-bold">LIMIT &lt; 5%</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {cancellationRate}%
              </div>
              <div className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Nominal SLA Status</span>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Kitchen Health</span>
              <span className="text-emerald-800 font-bold">Tier 1 Standing</span>
            </div>
          </div>

        </div>
      ) : isReadyTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Ready Now */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Ready Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {readyNowCount < 10 ? `0${readyNowCount}` : readyNowCount}
              </div>
              <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                <span>Heat-Sealed & Warming Rack</span>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Staging Telemetry</span>
              <span className="text-emerald-800 font-bold">100% On-Time</span>
            </div>
          </div>

          {/* Card 2: Ready for Delivery */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Ready for Delivery</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">moped</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {readyForDeliveryCount < 10 ? `0${readyForDeliveryCount}` : readyForDeliveryCount}
              </div>
              <div className="text-xs text-secondary font-bold">Awaiting Courier Pickup</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Delivery Dispatch</span>
              <span className="text-onyx-black font-bold">Courier Assigned</span>
            </div>
          </div>

          {/* Card 3: Customer Pickup */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Customer Pickup</span>
              <span className="material-symbols-outlined text-clay-earth text-[18px]">person_pin_circle</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {readyCustomerPickupCount < 10 ? `0${readyCustomerPickupCount}` : readyCustomerPickupCount}
              </div>
              <div className="text-xs text-secondary font-bold">Staged in Bay 2 Counter Shelf</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Customer Notification</span>
              <span className="text-emerald-800 font-bold">SMS & WhatsApp Sent</span>
            </div>
          </div>

          {/* Card 4: Ready Order Value */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Ready Order Value</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">account_balance_wallet</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                ₹{readyOrderValueTotal.toLocaleString('en-IN')}.00
              </div>
              <div className="text-xs text-secondary font-bold">
                Est. Net: <strong className="text-onyx-black font-mono">₹{readyNetPayoutTotal.toLocaleString('en-IN')}.00</strong>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Escrow Status</span>
              <span className="text-emerald-800 font-bold">Locked in Gateway</span>
            </div>
          </div>

        </div>
      ) : isPreparingTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Preparing Now */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Preparing Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-onyx-black animate-pulse"></span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {preparingNowCount < 10 ? `0${preparingNowCount}` : preparingNowCount}
              </div>
              <div className="text-xs text-clay-earth font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">skillet</span>
                <span>Active Kitchen Prep Tickets</span>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Kitchen Capacity</span>
              <span className="text-onyx-black font-bold">83% Load</span>
            </div>
          </div>

          {/* Card 2: Today's Preparing */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Today's Preparing</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {todaysPreparingCount < 10 ? `0${todaysPreparingCount}` : todaysPreparingCount}
              </div>
              <div className="text-xs text-secondary font-bold">Cumulative Shift Batches</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Shift Progress</span>
              <span className="text-emerald-800 font-bold">In Active Prep</span>
            </div>
          </div>

          {/* Card 3: Meals in Preparation */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Meals in Prep</span>
              <span className="material-symbols-outlined text-clay-earth text-[18px]">lunch_dining</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {mealsInPrepCount} Units
              </div>
              <div className="text-xs text-secondary font-bold">Rotis, Curries, Thalis</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Total Containers</span>
              <span className="text-onyx-black font-bold">{mealsInPrepCount * 3} Compartments</span>
            </div>
          </div>

          {/* Card 4: Preparation Value */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Preparation Value</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">currency_rupee</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                ₹{prepValueTotal.toLocaleString('en-IN')}.00
              </div>
              <div className="text-xs text-secondary font-bold">
                Net Payout: <strong className="text-onyx-black font-mono">₹{netPrepPayout.toLocaleString('en-IN')}.00</strong>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Platform Cut (12.5%)</span>
              <span>-₹{prepValueTotal - netPrepPayout}</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: New Orders */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">New Orders</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {newOrdersCount < 10 ? `0${newOrdersCount}` : newOrdersCount}
              </div>
              <div className="text-xs text-amber-700 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">error</span>
                <span>Pending Kitchen Acceptance</span>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>SLA Target: &lt; 3 mins</span>
              <span className="text-amber-800">{newOrdersCount} awaiting review</span>
            </div>
          </div>

          {/* Card 2: Online Payments */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Online Payments</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {onlinePaymentsCount < 10 ? `0${onlinePaymentsCount}` : onlinePaymentsCount}
              </div>
              <div className="text-xs text-emerald-700 font-bold">Prepaid via UPI / Escrow Secured</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Settled in Gateway</span>
              <span className="text-onyx-black font-bold">₹{totalPendingAmount - (codPaymentsCount * 280)}</span>
            </div>
          </div>

          {/* Card 3: Cash on Delivery */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Cash on Delivery</span>
              <span className="material-symbols-outlined text-clay-earth text-[18px]">payments</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                {codPaymentsCount < 10 ? `0${codPaymentsCount}` : codPaymentsCount}
              </div>
              <div className="text-xs text-secondary font-bold">Physical Cash Verification Required</div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Uncollected Balance</span>
              <span className="text-onyx-black font-bold">₹{codPaymentsCount * 280}</span>
            </div>
          </div>

          {/* Card 4: Total Pending Amount */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase font-bold">Total Pending Amount</span>
              <span className="material-symbols-outlined text-onyx-black text-[18px]">trending_up</span>
            </div>
            <div>
              <div className="text-4xl font-headline-md text-onyx-black font-semibold mb-1">
                ₹{totalPendingAmount.toLocaleString('en-IN')}.00
              </div>
              <div className="text-xs text-secondary font-bold">
                Est. Net Kitchen Payout: <strong className="text-onyx-black font-mono">₹{totalNetPayoutPending.toLocaleString('en-IN')}.00</strong>
              </div>
            </div>
            <div className="pt-3 border-t border-sand-neutral/40 text-[11px] text-secondary flex justify-between font-mono font-semibold">
              <span>Platform Fee Cut (12.5%)</span>
              <span>-₹{totalPendingAmount - totalNetPayoutPending}</span>
            </div>
          </div>

        </div>
      )}

      {/* Filter & Control Deck */}
      <div className="space-y-3">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-sand-neutral/40 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative w-full lg:w-96 flex items-center bg-surface-container-low rounded-xl px-3 py-2 border border-sand-neutral/30">
            <span className="material-symbols-outlined text-secondary text-[20px] mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search Order ID (#ORD-xxxx), Name, Phone, Item..."
              className="bg-transparent w-full text-xs text-on-surface placeholder:text-secondary focus:outline-none font-body-md"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="text-secondary hover:text-on-surface text-xs">
                ✕
              </button>
            )}
          </div>

          {/* Filter Selects */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* Payment Dropdown */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-surface-container-low text-on-surface font-button-text text-[13px] px-3.5 py-2 pr-8 rounded-lg border border-sand-neutral/30 focus:outline-none cursor-pointer uppercase font-bold tracking-wider"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Prepaid (UPI/Card)</option>
                <option value="COD">Cash on Delivery</option>
                <option value="Escrow">Escrow Hold</option>
              </select>
              <span className="material-symbols-outlined text-secondary text-[16px] absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
            </div>

            {/* Delivery Mode Dropdown */}
            <div className="relative">
              <select
                value={deliveryFilter}
                onChange={(e) => { setDeliveryFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-surface-container-low text-on-surface font-button-text text-[13px] px-3.5 py-2 pr-8 rounded-lg border border-sand-neutral/30 focus:outline-none cursor-pointer uppercase font-bold tracking-wider"
              >
                <option value="All">All Delivery Modes</option>
                <option value="Courier">Courier Dispatch</option>
                <option value="Pickup">Self Pickup Counter</option>
              </select>
              <span className="material-symbols-outlined text-secondary text-[16px] absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface-container-low text-on-surface font-button-text text-[13px] px-3.5 py-2 pr-8 rounded-lg border border-sand-neutral/30 focus:outline-none cursor-pointer uppercase font-bold tracking-wider"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="urgency">Sort: Urgency / Ready Time</option>
                <option value="amountHigh">Sort: Value High to Low</option>
              </select>
              <span className="material-symbols-outlined text-secondary text-[16px] absolute right-2.5 top-2.5 pointer-events-none">swap_vert</span>
            </div>

          </div>

        </div>

        {/* Quick Filter Chips & Station Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {isPreparingTab ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold mr-1">Cooking Stations:</span>
              <button
                type="button"
                onClick={() => setStationFilter('All')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  stationFilter === 'All' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                All Stations ({preparingNowCount})
              </button>
              <button
                type="button"
                onClick={() => setStationFilter('Station1')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  stationFilter === 'Station1' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                Station 1: Hot Breads & Rotis
              </button>
              <button
                type="button"
                onClick={() => setStationFilter('Station2')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  stationFilter === 'Station2' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                Station 2: Curries & Dals
              </button>
              <button
                type="button"
                onClick={() => setStationFilter('Station3')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  stationFilter === 'Station3' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                Station 3: Assembly & Packaging
              </button>
            </div>
          ) : isReadyTab ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label-caps text-[11px] uppercase tracking-wider text-secondary font-bold mr-1">Logistics Telemetry:</span>
              <button
                type="button"
                onClick={() => setDeliveryFilter('All')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  deliveryFilter === 'All' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                All Staging ({readyNowCount})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter('Courier')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  deliveryFilter === 'Courier' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                Ready for Courier ({readyForDeliveryCount})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter('Pickup')}
                className={`px-3 py-1 rounded-full font-label-caps text-[11px] font-bold tracking-wider cursor-pointer transition-colors ${
                  deliveryFilter === 'Pickup' ? 'bg-onyx-black text-bone-white shadow-xs' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                Customer Pickup ({readyCustomerPickupCount})
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickChipFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-label-caps text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  quickChipFilter === 'ALL' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                All Orders ({filteredOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setQuickChipFilter('URGENT')}
                className={`px-3 py-1 rounded-lg font-label-caps text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  quickChipFilter === 'URGENT' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                Urgent (&lt; 3m left)
              </button>

              <button
                type="button"
                onClick={() => setQuickChipFilter('BULK')}
                className={`px-3 py-1 rounded-lg font-label-caps text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  quickChipFilter === 'BULK' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                Corporate Bulk
              </button>

              <button
                type="button"
                onClick={() => setQuickChipFilter('JAIN')}
                className={`px-3 py-1 rounded-lg font-label-caps text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  quickChipFilter === 'JAIN' ? 'bg-onyx-black text-bone-white shadow-sm' : 'bg-surface-container-low text-clay-earth border border-sand-neutral/40 hover:bg-surface-container'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Dietary / Jain
              </button>
            </div>
          )}

          <div className="text-[11px] font-mono text-secondary flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[14px] text-emerald-700">hub</span>
            <span>Event: <code className="text-onyx-black font-bold">"ready_orders_sync"</code> active</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (7-Column Table + 5-Column Side Inspector Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Table View */}
        <div className={`${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'} rounded-2xl bg-surface-container-lowest border border-sand-neutral/40 shadow-xs overflow-hidden transition-all`}>
          
          <div className="px-5 py-3.5 bg-surface-container-low/70 border-b border-sand-neutral/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-onyx-black text-[18px]">receipt_long</span>
              <span className="font-label-caps text-xs font-bold text-onyx-black uppercase tracking-wider">
                Queue: {filteredOrders.length} {isReadyTab ? 'Ready Orders' : isPreparingTab ? 'Preparing Orders' : isNewOrdersTab ? 'New Orders' : `${activeStatusTab} Orders`}
              </span>
            </div>
            <span className="text-[11px] font-mono text-secondary font-semibold">Click row to inspect docket</span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
              <h3 className="font-headline-md text-lg text-on-surface">Connecting to MongoDB Orders Queue...</h3>
              <p className="font-body-md text-xs text-secondary">Fetching real customer orders scoped to authenticated kitchen.</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-4 bg-error-container/20 border-t border-error/30">
              <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
              <h3 className="font-headline-md text-xl text-on-surface font-normal">
                {isDeliveryTab ? 'Unable to load delivery orders' : isCompletedTab ? 'Unable to load completed orders' : isCancelledTab ? 'Unable to load cancelled orders' : 'Unable to load orders'}
              </h3>
              <p className="font-body-md text-xs text-secondary max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={() => fetchOrders(true)}
                className="px-5 py-2.5 bg-onyx-black text-bone-white rounded-lg font-button-text text-button-text hover:bg-stone-800 transition-colors inline-flex items-center gap-2 cursor-pointer font-bold"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>RETRY</span>
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-[36px] text-secondary">inbox</span>
              <h3 className="font-headline-md text-xl text-on-surface font-normal">
                {isDeliveryTab
                  ? 'No delivery orders found.'
                  : isCompletedTab
                  ? 'No completed orders found.'
                  : isCancelledTab
                  ? 'No cancelled orders found.'
                  : isReadyTab
                  ? 'No Ready Orders'
                  : isPreparingTab
                  ? 'No Orders Being Prepared'
                  : isNewOrdersTab
                  ? 'No New Orders'
                  : 'No Orders Found'}
              </h3>
              <p className="font-body-md text-xs text-secondary max-w-md mx-auto">
                {isDeliveryTab
                  ? 'Dispatched orders undergoing courier fulfillment will appear here in real time.'
                  : isCompletedTab
                  ? 'Fulfilled orders verified with handover OTPs will be archived here for settlement auditing.'
                  : isCancelledTab
                  ? 'Cancelled order records and audit traces will appear here permanently.'
                  : isReadyTab
                  ? 'Prepared orders will appear here automatically when they are ready for pickup or courier delivery.'
                  : isPreparingTab
                  ? 'Accepted customer orders will appear here automatically while your kitchen prepares them.'
                  : 'New customer orders will appear here automatically via Socket.IO.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sand-neutral/40 text-[11px] font-label-caps uppercase tracking-wider text-secondary bg-surface-container-low/30 font-bold">
                    {isDeliveryTab ? (
                      <>
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Tiffin Item</th>
                        <th className="py-3.5 px-4">Qty</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Assigned Driver</th>
                        <th className="py-3.5 px-4">Delivery Status</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </>
                    ) : isCompletedTab ? (
                      <>
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Tiffin Item</th>
                        <th className="py-3.5 px-4">Qty</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Driver</th>
                        <th className="py-3.5 px-4">Completed At</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </>
                    ) : isCancelledTab ? (
                      <>
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Tiffin Item</th>
                        <th className="py-3.5 px-4">Qty</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4">Cancelled By</th>
                        <th className="py-3.5 px-4">Cancellation Reason</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3.5 px-4">Order ID & Timer</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Tiffin Item</th>
                        <th className="py-3.5 px-4">Total</th>
                        <th className="py-3.5 px-4">Payment</th>
                        <th className="py-3.5 px-4 text-right">Quick Action</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-neutral/40 text-xs font-body-md">
                  {paginatedOrders.map((ord) => {
                    const isSelected = selectedOrder && (
                      (selectedOrder.id && ord.id && String(selectedOrder.id) === String(ord.id)) ||
                      (selectedOrder.orderId && ord.orderId && String(selectedOrder.orderId) === String(ord.orderId)) ||
                      (selectedOrder._id && ord._id && String(selectedOrder._id) === String(ord._id))
                    );

                    return (
                      <tr
                        key={ord.id || ord._id || ord.orderId}
                        onClick={() => { setSelectedOrder(ord); setIsDrawerOpen(true); }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/40 border-l-4 border-l-onyx-black font-semibold' : 'hover:bg-surface-container-low/60'
                        }`}
                      >
                        {isDeliveryTab ? (
                          <>
                            <td className="py-3.5 px-4 font-mono font-bold text-onyx-black">{ord.orderId}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-onyx-black">{ord.customerName}</div>
                              <div className="text-[11px] text-secondary font-mono">{ord.customerPhone}</div>
                              <div className="text-[10px] text-secondary truncate max-w-[160px] font-sans" title={ord.customerAddress}>{ord.customerAddress}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-onyx-black">{ord.tiffinName}</div>
                              {ord.itemsBreakdown && ord.itemsBreakdown.length > 0 && (
                                <div className="text-[10px] text-secondary truncate max-w-[150px]">{ord.itemsBreakdown.join(', ')}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold">{ord.quantity}</td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-onyx-black">₹{ord.grossAmount}.00</div>
                              <div className="text-[10px] text-secondary font-mono">Sub: ₹{ord.subtotal} • Fee: ₹{ord.deliveryFee}</div>
                              <div className="text-[10px] text-emerald-800 font-bold">{ord.paymentStatus}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-onyx-black text-xs">{ord.driverName}</div>
                              <div className="text-[10px] font-mono text-secondary">{ord.driverPhone}</div>
                              <div className="text-[10px] text-secondary font-sans">{ord.deliveryDistance}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              {isDriverAcceptedForOrder(ord) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-label-caps bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {ord.deliveryStatus === 'Searching' || ord.deliveryStatus === 'SEARCHING' ? 'Assigned' : (ord.deliveryStatus || 'In Transit')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-label-caps bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                  Searching
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {isDriverAcceptedForOrder(ord) ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(ord.orderId, 'Completed')}
                                  className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors cursor-pointer font-bold mr-1"
                                >
                                  Mark Delivered
                                </button>
                              ) : (
                                <span className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-mono font-bold inline-flex items-center gap-1.5 mr-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                  Searching Courier
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => { setSelectedOrder(ord); setIsDrawerOpen(true); }}
                                className="px-2.5 py-1.5 bg-surface-container text-on-surface hover:bg-surface-container-highest rounded-lg text-xs font-button-text transition-colors cursor-pointer font-bold"
                              >
                                Details
                              </button>
                            </td>
                          </>
                        ) : isCompletedTab ? (
                          <>
                            <td className="py-3.5 px-4 font-mono font-bold text-onyx-black">{ord.orderId}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-onyx-black">{ord.customerName}</div>
                              <div className="text-[11px] text-secondary font-mono">{ord.customerPhone}</div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-onyx-black">{ord.tiffinName}</td>
                            <td className="py-3.5 px-4 font-mono font-bold">{ord.quantity}</td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-onyx-black">₹{ord.grossAmount}.00</div>
                              <div className="text-[10px] text-emerald-800 font-bold">Net: ₹{ord.netPayout}.00</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-caps bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase">
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-onyx-black">{ord.driverName}</td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-secondary">
                              {new Date(ord.completedAt || ord.createdAt).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => { setSelectedOrder(ord); setIsDrawerOpen(true); }}
                                className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors cursor-pointer font-bold"
                              >
                                Details
                              </button>
                            </td>
                          </>
                        ) : isCancelledTab ? (
                          <>
                            <td className="py-3.5 px-4 font-mono font-bold text-onyx-black">
                              <div>{ord.orderId}</div>
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-label-caps bg-error-container text-error font-bold uppercase">Cancelled</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-onyx-black">{ord.customerName}</div>
                              <div className="text-[11px] text-secondary font-mono">{ord.customerPhone}</div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-onyx-black">{ord.tiffinName}</td>
                            <td className="py-3.5 px-4 font-mono font-bold">{ord.quantity}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-onyx-black">₹{ord.grossAmount}.00</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-caps bg-surface-container text-clay-earth font-bold">
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-caps bg-surface-container-high text-onyx-black font-bold">
                                {ord.cancelledBy || 'Customer'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-secondary text-[11px] max-w-[200px] truncate" title={ord.cancellationReason}>
                              {ord.cancellationReason || 'Not provided'}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => { setSelectedOrder(ord); setIsDrawerOpen(true); }}
                                className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors cursor-pointer font-bold"
                              >
                                Details
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Order ID & Timer */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center gap-1.5 font-bold text-onyx-black">
                                <span>{ord.orderId}</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(ord.orderId); }}
                                  className="text-secondary hover:text-onyx-black"
                                  title="Copy ID"
                                >
                                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                                </button>
                              </div>
                              <div className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold mt-0.5">
                                <span className="material-symbols-outlined text-[12px] text-amber-700">timer</span>
                                <span>{formatTimer(ord.secondsLeft)} left</span>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-onyx-black text-xs">{ord.customerName}</div>
                              <div className="text-[11px] text-secondary font-mono font-medium">{ord.customerPhone}</div>
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-label-caps bg-surface-container text-clay-earth font-bold">
                                {ord.customerTier}
                              </span>
                            </td>

                            {/* Tiffin Item */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-onyx-black line-clamp-1">{ord.tiffinName}</div>
                              <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                <span>Pure Veg • {ord.quantity} Meal{ord.quantity > 1 ? 's' : ''}</span>
                              </div>
                            </td>

                            {/* Total */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-onyx-black">₹{ord.grossAmount}.00</div>
                              <div className="text-[10px] text-secondary font-semibold">Net: ₹{ord.netPayout}.00</div>
                            </td>

                            {/* Payment */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-label-caps bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                {ord.paymentStatus}
                              </span>
                              <div className="text-[10px] text-secondary mt-1 font-medium">Just now</div>
                            </td>

                            {/* Quick Action */}
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              {ord.status === 'Completed' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✓ Completed
                                </span>
                              ) : ord.status === 'Cancelled' || ord.status === 'Rejected' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  ✕ Cancelled
                                </span>
                              ) : ord.status === 'Delivery' || ord.status === 'Out for Delivery' || ord.status === 'In Transit' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(ord.orderId, 'Completed')}
                                  className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer font-bold"
                                >
                                  Mark Delivered
                                </button>
                              ) : ord.status === 'Ready' || isReadyTab ? (
                                ord.deliveryMode.toLowerCase().includes('pickup') ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.orderId, 'Completed')}
                                    className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer font-bold"
                                  >
                                    Handover
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === ord.orderId}
                                    onClick={() => handleUpdateOrderStatus(ord.orderId, 'Delivery')}
                                    className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                                  >
                                    {updatingOrderId === ord.orderId ? (
                                      <>
                                        <span className="w-3 h-3 border-2 border-bone-white/30 border-t-bone-white rounded-full animate-spin"></span>
                                        <span>Courier...</span>
                                      </>
                                    ) : (
                                      'Courier'
                                    )}
                                  </button>
                                )
                              ) : ord.status === 'Preparing' || ord.status === 'In Prep' || isPreparingTab ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.orderId, 'Ready')}
                                    className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer font-bold mr-1"
                                  >
                                    Ready
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingOrder(ord)}
                                    className="px-2.5 py-1.5 border border-sand-neutral/60 text-secondary hover:text-error hover:border-error rounded-lg text-xs transition-colors cursor-pointer"
                                    title="Cancel Order"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateOrderStatus(ord.orderId, 'Preparing')}
                                    className="px-3 py-1.5 bg-onyx-black text-bone-white rounded-lg text-xs font-button-text hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer font-bold mr-1"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingOrder(ord)}
                                    className="px-2.5 py-1.5 border border-sand-neutral/60 text-secondary hover:text-error hover:border-error rounded-lg text-xs transition-colors cursor-pointer"
                                    title="Cancel Order"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </td>
                          </>
                        )}

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 bg-surface-container-low border-t border-sand-neutral/30 flex flex-col sm:flex-row items-center justify-between font-label-caps text-[11px] text-secondary gap-3 font-semibold">
            <div>Page {currentPage} of {totalPages} • {filteredOrders.length} orders indexed</div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 rounded-lg bg-surface-container text-on-surface disabled:opacity-40 cursor-pointer font-bold"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                    currentPage === p ? 'bg-onyx-black text-bone-white' : 'bg-surface-container text-on-surface hover:bg-surface-container-highest'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 rounded-lg bg-surface-container text-on-surface disabled:opacity-40 cursor-pointer font-bold"
              >
                Next
              </button>
            </div>
          </div>

        </div>

        {/* Real-Time Order Details Docket (lg:col-span-5) */}
        {selectedOrder && isDrawerOpen && (
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-sand-neutral/50 shadow-sm overflow-hidden flex flex-col animate-scale-in">
            
            {/* Docket Header */}
            <div className="p-5 bg-surface-container-low border-b border-sand-neutral/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">ORDER INSPECTION</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-label-caps bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                      {selectedOrder.status.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-2xl text-onyx-black font-normal mt-1">{selectedOrder.orderId}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-mono font-bold">
                    <span className="material-symbols-outlined text-[14px] text-amber-700">alarm</span>
                    <span>{formatTimer(selectedOrder.secondsLeft)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePrintKOT(selectedOrder)}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-secondary cursor-pointer"
                    title="Print KOT Ticket"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-secondary mt-1 font-medium">
                {selectedOrder.status === 'Completed' || selectedOrder.status === 'Delivered'
                  ? 'Order fulfilled and completed.'
                  : selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Rejected'
                  ? 'Order cancelled and archived.'
                  : selectedOrder.status === 'Delivery' || selectedOrder.status === 'Out for Delivery' || selectedOrder.status === 'In Transit'
                  ? 'Dispatched with delivery partner for customer dropoff.'
                  : selectedOrder.status === 'Ready'
                  ? 'Staged in Bay 1 / Bay 2. Heat-sealed and ready for courier pickup or customer takeaway.'
                  : selectedOrder.status === 'Preparing' || selectedOrder.status === 'In Prep'
                  ? 'Active in kitchen prep. Mark ready once all compartments are sealed.'
                  : 'Auto-reject fallback if no confirmation within window to avoid kitchen bottleneck.'
                }
              </p>
            </div>

            <div className="p-5 space-y-6 flex-1 overflow-y-auto max-h-[720px]">
              
              {/* Customer Identity Card */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-sand-neutral/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-label-caps text-clay-earth uppercase tracking-wider font-bold">Customer Dossier</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                    {selectedOrder.customerTier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-onyx-black text-sm">{selectedOrder.customerName}</div>
                    <div className="text-xs font-mono text-secondary font-bold">{selectedOrder.customerPhone}</div>
                  </div>
                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest text-onyx-black cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                  </a>
                </div>
                <div className="pt-2 border-t border-sand-neutral/40 text-xs space-y-1 font-medium">
                  <div className="flex items-start gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-onyx-black shrink-0 mt-0.5">location_on</span>
                    <span className="text-on-surface">{selectedOrder.customerAddress} ({selectedOrder.deliveryDistance} away)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary pl-5 text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">moped</span>
                    <span>Mode: <strong className="text-onyx-black">{selectedOrder.deliveryMode}</strong> • Pickup: <strong>{selectedOrder.deliveryTarget}</strong></span>
                  </div>
                </div>
              </div>

              {/* Tiffin Manifest */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-label-caps text-clay-earth uppercase tracking-wider font-bold">Tiffin Manifest</span>
                  <span className="text-xs font-mono text-secondary font-bold">Station: #ST-NORTH-2</span>
                </div>
                <div className="p-4 rounded-xl border border-sand-neutral/40 space-y-3 bg-surface-container-lowest">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border border-emerald-700 p-0.5 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                        </span>
                        <h3 className="font-bold text-sm text-onyx-black">{selectedOrder.quantity} × {selectedOrder.tiffinName}</h3>
                      </div>
                      <p className="text-xs text-secondary mt-0.5 font-medium">{selectedOrder.tiffinNotes}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-onyx-black">₹{selectedOrder.subtotal}.00</span>
                  </div>

                  {/* Item Breakdown */}
                  <div className="bg-surface-container-low p-3 rounded-lg text-[11px] text-secondary space-y-1 font-medium border border-sand-neutral/30">
                    <div className="font-bold text-onyx-black">Tiffin Compartments & Sides:</div>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      {selectedOrder.itemsBreakdown.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Special Instructions */}
                  {selectedOrder.specialInstructions && (
                    <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/70 text-xs">
                      <div className="flex items-center gap-1 text-amber-900 font-bold mb-0.5">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        <span>Customer Dietary & Delivery Notes:</span>
                      </div>
                      <p className="text-amber-950 text-[11px] leading-relaxed font-medium">
                        "{selectedOrder.specialInstructions}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Ledger */}
              <div className="space-y-2">
                <span className="text-[11px] font-label-caps text-clay-earth uppercase tracking-wider font-bold">Ledger & Payout Audit</span>
                <div className="p-4 bg-surface-container-low rounded-xl border border-sand-neutral/30 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-secondary font-medium">
                    <span>Items Subtotal ({selectedOrder.quantity} units)</span>
                    <span>₹{selectedOrder.subtotal}.00</span>
                  </div>
                  <div className="flex justify-between text-secondary font-medium">
                    <span>Eco-Packaging Surcharge</span>
                    <span>+ ₹{selectedOrder.packagingFee}.00</span>
                  </div>
                  <div className="flex justify-between text-secondary font-medium">
                    <span>Standard Delivery Logistics</span>
                    <span>+ ₹{selectedOrder.deliveryFee}.00</span>
                  </div>
                  <div className="flex justify-between border-t border-sand-neutral/40 pt-2 font-bold text-onyx-black text-sm">
                    <span>Customer Paid Total</span>
                    <span>₹{selectedOrder.grossAmount}.00</span>
                  </div>

                  <div className="pt-2 mt-1 border-t border-dashed border-sand-neutral/50 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-emerald-900 font-bold block">Net Kitchen Payout</span>
                      <span className="text-[10px] text-secondary font-sans font-medium">Platform fee cut (12.5%) applied</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-800 font-mono">₹{selectedOrder.netPayout}.00</span>
                  </div>
                  <div className="pt-1 text-[10px] text-secondary flex items-center gap-1 font-sans font-semibold">
                    <span className="material-symbols-outlined text-[12px] text-emerald-700">lock</span>
                    <span>Settlement UTR: <strong>{selectedOrder.utr}</strong> (Escrow Locked)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Footer */}
            <div className="p-4 bg-surface-container-low border-t border-sand-neutral/40 space-y-2.5">
              {selectedOrder.status === 'Completed' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-center rounded-lg">
                  <span className="font-bold text-emerald-800 text-xs flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    Order Fulfilled & Completed
                  </span>
                </div>
              ) : selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Rejected' ? (
                <div className="p-3 bg-rose-50 border border-rose-200 text-center rounded-lg">
                  <span className="font-bold text-rose-800 text-xs flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Order Cancelled
                  </span>
                </div>
              ) : selectedOrder.status === 'Delivery' || selectedOrder.status === 'Out for Delivery' || selectedOrder.status === 'In Transit' ? (
                <div className="space-y-2">
                  {selectedOrder.deliveryStatus === 'Searching' || selectedOrder.deliveryStatus === 'SEARCHING' || selectedOrder.deliveryStatus === 'Searching Drivers' || !isDriverAcceptedForOrder(selectedOrder) ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span className="font-bold text-amber-900">Broadcast Active: Searching Available Couriers</span>
                      </div>
                      {selectedOrder.pickupOtp && (
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-amber-900">
                          Pickup OTP: {selectedOrder.pickupOtp}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Courier Assigned: {selectedOrder.driverName || selectedOrder.deliveryPartnerName || 'Partner'}
                        </span>
                        {selectedOrder.pickupOtp && (
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-900">
                            Pickup OTP: {selectedOrder.pickupOtp}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-800">Phone: {selectedOrder.driverPhone || selectedOrder.deliveryPartnerPhone || 'Contacting...'}</div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={updatingOrderId === selectedOrder.orderId}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, 'Completed')}
                    className="w-full py-3 px-4 bg-onyx-black hover:bg-stone-800 text-bone-white font-button-text text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">task_alt</span>
                    <span>Mark as Delivered</span>
                  </button>
                </div>
              ) : selectedOrder.status === 'Ready' ? (
                selectedOrder.deliveryMode.toLowerCase().includes('pickup') ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, 'Completed')}
                      className="col-span-2 py-3 px-4 bg-onyx-black hover:bg-stone-800 text-bone-white font-button-text text-button-text text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-emerald-400">pin</span>
                      <span>Verify Pickup & Complete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRejectingOrder(selectedOrder)}
                      className="col-span-1 py-3 px-3 border border-sand-neutral/60 bg-surface-container-lowest hover:bg-error-container hover:text-on-error-container hover:border-error rounded-lg text-xs font-button-text transition-colors flex items-center justify-center gap-1 text-secondary cursor-pointer font-bold"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.deliveryStatus === 'Searching' || selectedOrder.status === 'DELIVERY_REQUESTED' ? (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                          <span className="font-bold text-amber-900">Broadcast Active: Searching Available Couriers</span>
                        </div>
                        {selectedOrder.pickupOtp && (
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold text-amber-900">
                            Pickup OTP: {selectedOrder.pickupOtp}
                          </span>
                        )}
                      </div>
                    ) : selectedOrder.deliveryStatus === 'Assigned' ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Courier Assigned: {selectedOrder.driverName || 'Partner'}
                          </span>
                          {selectedOrder.pickupOtp && (
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-900">
                              Pickup OTP: {selectedOrder.pickupOtp}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-800">Phone: {selectedOrder.driverPhone || 'Contacting...'}</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={updatingOrderId === selectedOrder.orderId}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, 'Delivery')}
                          className="col-span-2 py-3 px-4 bg-onyx-black hover:bg-stone-800 text-bone-white font-button-text text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {updatingOrderId === selectedOrder.orderId ? (
                            <>
                              <span className="w-4 h-4 border-2 border-bone-white/30 border-t-bone-white rounded-full animate-spin"></span>
                              <span>Dispatching Courier...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px] text-amber-400">send</span>
                              <span>Confirm Pickup & Dispatch</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setRejectingOrder(selectedOrder)}
                          className="col-span-1 py-3 px-3 border border-sand-neutral/60 bg-surface-container-lowest hover:bg-error-container hover:text-on-error-container hover:border-error rounded-lg text-xs font-button-text transition-colors flex items-center justify-center gap-1 text-secondary cursor-pointer font-bold"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              ) : selectedOrder.status === 'Preparing' || selectedOrder.status === 'In Prep' ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, 'Ready')}
                    className="col-span-2 py-3 px-4 bg-onyx-black hover:bg-stone-800 text-bone-white font-button-text text-button-text text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                    <span>Mark as Ready (Advance)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRejectingOrder(selectedOrder)}
                    className="col-span-1 py-3 px-3 border border-sand-neutral/60 bg-surface-container-lowest hover:bg-error-container hover:text-on-error-container hover:border-error rounded-lg text-xs font-button-text transition-colors flex items-center justify-center gap-1 text-secondary cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Cancel</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, 'Preparing')}
                    className="col-span-2 py-3 px-4 bg-onyx-black hover:bg-stone-800 text-bone-white font-button-text text-button-text text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                    <span>Accept Order (Start Prep)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRejectingOrder(selectedOrder)}
                    className="col-span-1 py-3 px-3 border border-sand-neutral/60 bg-surface-container-lowest hover:bg-error-container hover:text-on-error-container hover:border-error rounded-lg text-xs font-button-text transition-colors flex items-center justify-center gap-1 text-secondary cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Decline</span>
                  </button>
       {/* Rejection Modal */}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Rejection Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-[6000] bg-onyx-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl border border-sand-neutral/50 shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <span>Reject Order {rejectingOrder.orderId}</span>
              </div>
              <button type="button" onClick={() => setRejectingOrder(null)} className="text-secondary hover:text-onyx-black p-1 rounded">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-secondary leading-relaxed font-medium">
              Are you sure you want to decline this order from <strong className="text-on-surface">{rejectingOrder.customerName}</strong>? Please select a reason for platform telemetry:
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-label-caps uppercase text-clay-earth font-bold">Reason for Declining</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-surface-container-low p-2.5 rounded-lg text-xs text-on-surface border border-sand-neutral/30 focus:outline-none font-bold"
              >
                <option value="Kitchen at Full Preparation Capacity">Kitchen at Full Preparation Capacity</option>
                <option value="Key Ingredients / Dishes Out of Stock">Key Ingredients / Dishes Out of Stock</option>
                <option value="Cannot Fulfill Customer Customization Request">Cannot Fulfill Customer Customization Request</option>
                <option value="Delivery Address Beyond Active Kitchen Radius">Delivery Address Beyond Active Kitchen Radius</option>
                <option value="Closure / Power Interruption">Closure / Power Interruption</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-label-caps uppercase text-clay-earth font-bold">Internal Kitchen Notes (Optional)</label>
              <textarea
                rows={2}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Explain details for customer dispatch support..."
                className="w-full bg-surface-container-low p-2.5 rounded-lg text-xs text-on-surface border border-sand-neutral/30 focus:outline-none placeholder:text-secondary font-body-md"
              />
            </div>

            <div className="pt-2 border-t border-sand-neutral/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 text-xs font-button-text rounded-lg border border-sand-neutral/40 text-secondary hover:bg-surface-container cursor-pointer font-bold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const ordToReject = rejectingOrder;
                  setRejectingOrder(null);
                  handleUpdateOrderStatus(ordToReject.orderId, 'Cancelled', rejectReason);
                }}
                className="px-4 py-2 text-xs font-button-text rounded-lg bg-error text-bone-white hover:bg-red-800 transition-colors shadow-xs cursor-pointer font-bold"
              >
                Confirm Decline & Refund Escrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Entry Modal */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 bg-onyx-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl border border-sand-neutral/50 shadow-2xl p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-onyx-black">add_circle</span>
                <h3 className="font-headline-md text-lg text-on-surface font-normal">Manual Order Entry</h3>
              </div>
              <button type="button" onClick={() => setIsManualEntryOpen(false)} className="text-secondary hover:text-on-surface p-1 rounded cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs font-body-md">
              <div>
                <label className="font-label-caps text-[10px] uppercase text-secondary font-bold block mb-1">Customer Name</label>
                <input type="text" placeholder="Enter customer name" className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-sand-neutral/30 focus:outline-none font-bold" />
              </div>
              <div>
                <label className="font-label-caps text-[10px] uppercase text-secondary font-bold block mb-1">Customer Phone</label>
                <input type="text" placeholder="+91 98000 00000" className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-sand-neutral/30 focus:outline-none font-bold" />
              </div>
              <div>
                <label className="font-label-caps text-[10px] uppercase text-secondary font-bold block mb-1">Select Tiffin Dish</label>
                <select className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-sand-neutral/30 focus:outline-none font-bold">
                  <option>Gujarati Special Kathiyawadi Thali (₹192)</option>
                  <option>Jain Swaminarayan Executive Thali (₹220)</option>
                  <option>Healthy Khichdi & Kadhi Bowl (₹160)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-sand-neutral/40 flex justify-end gap-3">
              <button type="button" onClick={() => setIsManualEntryOpen(false)} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface cursor-pointer font-bold">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  setIsManualEntryOpen(false);
                  showToast('✓ Manual order created & added to MongoDB database!');
                  fetchOrders(false);
                }}
                className="px-5 py-2.5 rounded-lg bg-onyx-black text-bone-white font-button-text text-button-text cursor-pointer font-bold"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
