import React, { useState, useEffect } from 'react';
import { X, Search, Navigation, PackageCheck, Clock, Phone, MapPin, Truck, Store, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import GoogleDeliveryMap from './GoogleDeliveryMap';
import { apiRequest } from '../services/api';
import { 
  joinDeliveryRoom, 
  leaveDeliveryRoom, 
  subscribeToLocationUpdates, 
  subscribeToDeliveryLifecycle 
} from '../services/socket';

export default function CustomerDeliveryTrackingModal({ isOpen, onClose, initialOrderId = '' }) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || 'REQ-1001');
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialOrderId) {
        setOrderIdInput(initialOrderId);
        fetchCustomerDelivery(initialOrderId);
      } else {
        fetchCustomerDelivery('#1024');
      }
    }
  }, [isOpen, initialOrderId]);

  // Real-Time Socket.IO Subscriptions for Customer Delivery Tracking
  useEffect(() => {
    if (!activeDelivery) return;
    const cleanId = activeDelivery.requestId || activeDelivery.orderId || activeDelivery._id;
    if (!cleanId) return;

    joinDeliveryRoom(cleanId);

    const unsubscribeLocation = subscribeToLocationUpdates((data) => {
      if (data && data.location) {
        setActiveDelivery(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status || prev.status,
            etaMinutes: data.etaMinutes || prev.etaMinutes,
            assignedDriver: {
              ...(prev.assignedDriver || {}),
              location: data.location
            }
          };
        });
      }
    });

    const unsubscribeLifecycle = subscribeToDeliveryLifecycle({
      onStatusUpdate: (data) => {
        if (data && data.status) {
          setActiveDelivery(prev => prev ? { ...prev, status: data.status } : prev);
        }
      },
      onPickup: (data) => {
        setActiveDelivery(prev => prev ? { ...prev, status: 'Out for Delivery' } : prev);
      },
      onCompleted: (data) => {
        setActiveDelivery(prev => prev ? { ...prev, status: 'Delivered' } : prev);
      }
    });

    return () => {
      leaveDeliveryRoom(cleanId);
      unsubscribeLocation();
      unsubscribeLifecycle();
    };
  }, [activeDelivery?.requestId, activeDelivery?.orderId, activeDelivery?._id]);

  const fetchCustomerDelivery = async (idToFetch) => {
    const queryId = (idToFetch || orderIdInput || '').trim();
    if (!queryId) return;

    setLoading(true);
    setError(null);

    try {
      const cleanId = String(queryId).replace(/^#+/, '');
      const res = await apiRequest(`/delivery/track/${encodeURIComponent(cleanId)}`);
      if (res && res.success && (res.delivery || res.request)) {
        setActiveDelivery(res.delivery || res.request);
      } else {
        const ordRes = await apiRequest(`/orders/${encodeURIComponent(cleanId)}`);
        if (ordRes && ordRes.success && ordRes.data) {
          const ord = ordRes.data;
          const isCancelled = String(ord.status || '').toLowerCase() === 'cancelled' || String(ord.status || '').toLowerCase() === 'rejected';
          setActiveDelivery({
            orderId: ord.orderId,
            requestId: ord.orderId,
            status: ord.deliveryStatus === 'Delivered' ? 'Delivered' : (ord.status === 'Delivery' ? (ord.deliveryStatus || 'Searching Drivers') : ord.status),
            isCancelled,
            cancelledBy: ord.cancelledBy || 'Provider',
            cancellationReason: ord.cancellationReason || 'The kitchen is at peak capacity and was unable to fulfill this order.',
            providerName: ord.providerName || 'The Kitchen Partner',
            totalAmount: ord.totalAmount || 0,
            etaMinutes: ord.estimatedTime ? parseInt(ord.estimatedTime) || 15 : 15,
            distanceKm: ord.deliveryDistance ? parseFloat(ord.deliveryDistance) || 2.4 : 2.4,
            pickupAddress: { street: ord.pickupAddress || 'Kitchen Hub, Ahmedabad' },
            deliveryAddress: { street: ord.customerAddress || 'Customer Address, Ahmedabad' },
            assignedDriver: {
              name: ord.deliveryPartnerName || ord.driverName || '',
              phone: ord.deliveryPartnerPhone || ord.driverPhone || '',
              rating: 4.8,
              vehicleNo: ord.driverVehicle || ''
            },
            pickupOtp: ord.pickupOtp || '',
            deliveryOtp: ord.deliveryOtp || ''
          });
        } else {
          setError('No active delivery found matching this order ID.');
        }
      }
    } catch (err) {
      console.error('Error fetching customer delivery tracking:', err);
      setError('Failed to connect to delivery tracking server.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5ECE8] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#E5ECE8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container text-onyx-black flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-[10px] font-black text-onyx-black uppercase tracking-wider">CUSTOMER LIVE DELIVERY TRACKER</div>
              <h2 className="text-lg font-black text-[#111827]">Track Your Tiffin Order</h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-[#F9FBF9] border-b border-[#E5ECE8] flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
            <input 
              type="text"
              placeholder="Enter your Order ID (e.g. REQ-1001)..."
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-onyx-black"
            />
          </div>
          <button 
            onClick={() => fetchCustomerDelivery()}
            className="px-4 py-2 bg-onyx-black hover:bg-neutral-800 text-bone-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Track
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-4 border-onyx-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">Fetching real-time GPS tracking data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200 space-y-2">
              <p className="text-xs font-black text-red-800">{error}</p>
            </div>
          ) : activeDelivery?.isCancelled || String(activeDelivery?.status || '').toLowerCase() === 'cancelled' || String(activeDelivery?.status || '').toLowerCase() === 'rejected' ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Store size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded">
                      Order Declined by Kitchen
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-0.5">
                      {activeDelivery.providerName || 'Kitchen Partner'}
                    </h3>
                  </div>
                </div>

                <div className="bg-white/90 border border-rose-200/80 rounded-xl p-3.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span>Restaurant Message</span>
                  </div>
                  <p className="text-xs font-medium text-gray-800 italic pl-3 border-l-2 border-amber-400">
                    &ldquo;{activeDelivery.cancellationReason || 'The kitchen is at peak capacity and unable to prepare this order.'}&rdquo;
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div className="text-xs text-emerald-900 font-semibold">
                    100% Escrow Refund Recredited to Source Account (Zero Cancellation Fee)
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      onClose();
                      window.location.hash = '#find-tiffin';
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Browse Other Kitchens</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.hash = '#cancelled-orders';
                    }}
                    className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    View Refund Details
                  </button>
                </div>
              </div>
            </div>
          ) : activeDelivery ? (
            <div className="space-y-4">
              
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-surface-container border border-sand-neutral/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-secondary font-black uppercase">DELIVERY STATUS</div>
                  <div className="text-base font-black text-[#111827]">{activeDelivery.status || 'Out for Delivery'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#6B7280] font-extrabold">ESTIMATED ETA</div>
                  <div className="text-xl font-black text-onyx-black">{activeDelivery.etaMinutes || 12} mins</div>
                </div>
              </div>

              {/* Real Google Map Component */}
              <GoogleDeliveryMap 
                delivery={{
                  ...activeDelivery,
                  requestId: activeDelivery.requestId || activeDelivery.orderId || activeDelivery._id,
                  pickupAddress: typeof activeDelivery.pickupAddress === 'string'
                    ? { street: activeDelivery.pickupAddress, lat: activeDelivery.pickupLocation?.lat, lng: activeDelivery.pickupLocation?.lng }
                    : activeDelivery.pickupAddress || { street: 'Kitchen Location' },
                  deliveryAddress: typeof activeDelivery.deliveryAddress === 'string'
                    ? { street: activeDelivery.deliveryAddress, lat: activeDelivery.deliveryLocation?.lat, lng: activeDelivery.deliveryLocation?.lng }
                    : activeDelivery.deliveryAddress || { street: 'Customer Drop Location' }
                }}
                height="20rem"
                activeRole="customer"
              />

              {/* Delivery Partner & Phone Contact */}
              {activeDelivery.assignedDriver?.name && (
                <div className="p-4 bg-white rounded-2xl border border-[#E5ECE8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container text-onyx-black flex items-center justify-center font-black text-sm">
                      {activeDelivery.assignedDriver.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#111827]">{activeDelivery.assignedDriver.name}</div>
                      <div className="text-[10px] text-[#6B7280] font-semibold">★ {activeDelivery.assignedDriver.rating || 4.8} • Assigned Delivery Partner</div>
                    </div>
                  </div>

                  {activeDelivery.assignedDriver.phone && (
                    <a 
                      href={`tel:${activeDelivery.assignedDriver.phone}`}
                      className="px-4 py-2 bg-onyx-black text-bone-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Phone size={13} />
                      <span>Call Driver</span>
                    </a>
                  )}
                </div>
              )}

            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
