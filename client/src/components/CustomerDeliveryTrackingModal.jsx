import React, { useState, useEffect } from 'react';
import { X, Search, Navigation, PackageCheck, Clock, Phone, MapPin, Truck } from 'lucide-react';
import GoogleDeliveryMap from './GoogleDeliveryMap';
import { apiRequest } from '../services/api';

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
        fetchCustomerDelivery('REQ-1001');
      }
    }
  }, [isOpen, initialOrderId]);

  const fetchCustomerDelivery = async (idToFetch) => {
    const queryId = (idToFetch || orderIdInput || '').trim();
    if (!queryId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest('/delivery/requests');
      if (res.success && Array.isArray(res.requests)) {
        const found = res.requests.find(r => 
          String(r.requestId).toLowerCase() === queryId.toLowerCase() ||
          String(r.orderId).toLowerCase() === queryId.toLowerCase() ||
          String(r._id).toLowerCase() === queryId.toLowerCase()
        );

        if (found) {
          setActiveDelivery(found);
        } else if (res.requests.length > 0) {
          setActiveDelivery(res.requests[0]);
        } else {
          setError('No active delivery found matching this order ID.');
        }
      } else {
        setError('Unable to fetch live delivery details.');
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
            <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#0A8B5F] flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <div className="text-[10px] font-black text-[#0A8B5F] uppercase tracking-wider">CUSTOMER LIVE DELIVERY TRACKER</div>
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
            />
          </div>
          <button 
            onClick={() => fetchCustomerDelivery()}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734e] text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Track
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold">Fetching real-time GPS tracking data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200 space-y-2">
              <p className="text-xs font-black text-red-800">{error}</p>
            </div>
          ) : activeDelivery ? (
            <div className="space-y-4">
              
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-[#E8F0EC] border border-[#0A8B5F]/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#0A8B5F] font-black uppercase">DELIVERY STATUS</div>
                  <div className="text-base font-black text-[#111827]">{activeDelivery.status || 'Out for Delivery'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#6B7280] font-extrabold">ESTIMATED ETA</div>
                  <div className="text-xl font-black text-[#0A8B5F]">{activeDelivery.etaMinutes || 12} mins</div>
                </div>
              </div>

              {/* Real Google Map Component */}
              <GoogleDeliveryMap 
                delivery={{
                  ...activeDelivery,
                  requestId: activeDelivery.requestId || activeDelivery.orderId || activeDelivery._id,
                  pickupAddress: typeof activeDelivery.pickupAddress === 'string'
                    ? { street: activeDelivery.pickupAddress, lat: 23.0300, lng: 72.5650 }
                    : activeDelivery.pickupAddress || { street: 'Kitchen Location', lat: 23.0300, lng: 72.5650 },
                  deliveryAddress: typeof activeDelivery.deliveryAddress === 'string'
                    ? { street: activeDelivery.deliveryAddress, lat: 23.0380, lng: 72.5580 }
                    : activeDelivery.deliveryAddress || { street: 'Customer Drop Location', lat: 23.0380, lng: 72.5580 }
                }}
                height="20rem"
                activeRole="customer"
              />

              {/* Delivery Partner & Phone Contact */}
              {activeDelivery.assignedDriver?.name && (
                <div className="p-4 bg-white rounded-2xl border border-[#E5ECE8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0A8B5F] flex items-center justify-center font-black text-sm">
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
                      className="px-4 py-2 bg-[#0A8B5F] text-white text-xs font-extrabold rounded-xl hover:bg-[#08734e] transition-all flex items-center gap-1.5 shadow-xs"
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
