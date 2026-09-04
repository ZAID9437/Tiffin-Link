import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Save, 
  RotateCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Sliders, 
  ShieldCheck, 
  Users, 
  Truck,
  Compass,
  Check,
  X
} from 'lucide-react';

import ServiceAreaMap from '../components/ServiceAreaMap';
import { apiRequest } from '../services/api';

export default function ServiceAreaTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Overview Summary Metrics
  const [summary, setSummary] = useState({
    activeAreasCount: 3,
    eligibleCustomersCount: 128,
    todaysDeliveriesCount: 24
  });

  // Kitchen Location
  const [kitchenLocation, setKitchenLocation] = useState({
    address: '102, Shivalik Plaza, CG Road, Ahmedabad',
    locality: 'CG Road',
    city: 'Ahmedabad',
    latitude: 23.0300,
    longitude: 72.5650
  });

  // Settings State
  const [deliveryMode, setDeliveryMode] = useState('Radius Based'); // 'Radius Based' | 'Area Based'
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [minOrderAmount, setMinOrderAmount] = useState(150);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(500);
  const [acceptOrdersOnlyInsideArea, setAcceptOrdersOnlyInsideArea] = useState(true);

  // Active Service Areas List
  const [areasList, setAreasList] = useState([]);

  // Modal / Add Area State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaRadius, setNewAreaRadius] = useState(4);

  // Edit Area State
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editAreaRadiusVal, setEditAreaRadiusVal] = useState(4);

  useEffect(() => {
    fetchServiceAreaFromDb();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchServiceAreaFromDb = async () => {
    try {
      setLoading(true);
      const json = await apiRequest('/service-area');

      if (json.success && json.data) {
        if (json.data.summary) {
          setSummary(json.data.summary);
        }
        if (json.data.kitchenLocation) {
          setKitchenLocation(json.data.kitchenLocation);
        }
        if (json.data.settings) {
          setDeliveryMode(json.data.settings.deliveryMode || 'Radius Based');
          setDeliveryRadius(json.data.settings.deliveryRadius ?? 5);
          setMinOrderAmount(json.data.settings.minOrderAmount ?? 150);
          setDeliveryFee(json.data.settings.deliveryFee ?? 30);
          setFreeDeliveryAbove(json.data.settings.freeDeliveryAbove ?? 500);
          setAcceptOrdersOnlyInsideArea(json.data.settings.acceptOrdersOnlyInsideArea ?? true);
        }
        if (Array.isArray(json.data.areas)) {
          setAreasList(json.data.areas);
        }
      }
    } catch (err) {
      console.error('Error fetching service area data from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const json = await apiRequest('/service-area/settings', {
        method: 'PUT',
        body: JSON.stringify({
          maxDeliveryRadiusKm: Number(deliveryRadius),
          minOrderAmount: Number(minOrderAmount),
          deliveryFee: Number(deliveryFee),
          freeDeliveryAbove: Number(freeDeliveryAbove),
          acceptOrdersOnlyInsideArea: Boolean(acceptOrdersOnlyInsideArea)
        })
      });
      if (json.success) {
        showToast('✓ Saved Service Area Settings!');
        fetchServiceAreaFromDb();
      } else {
        showToast('⚠️ ' + (json.message || 'Failed to save settings'));
      }
    } catch (err) {
      console.error('Error saving service area settings:', err);
      showToast('⚠️ Server connection error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Add New Service Area
  const handleAddArea = async (e) => {
    if (e) e.preventDefault();
    if (!newAreaName.trim()) {
      showToast('⚠️ Please enter a valid area name');
      return;
    }

    try {
      const json = await apiRequest('/service-area/areas', {
        method: 'POST',
        body: JSON.stringify({
          areaName: newAreaName.trim(),
          radiusKm: Number(newAreaRadius) || 4
        })
      });
      if (json.success) {
        showToast(`✓ Added ${newAreaName} to active service areas!`);
        setIsAddModalOpen(false);
        setNewAreaName('');
        setNewAreaRadius(4);
        fetchServiceAreaFromDb();
      }
    } catch (err) {
      console.error('Error adding area:', err);
    }
  };

  // Edit Area Radius
  const handleSaveAreaEdit = async (areaId) => {
    try {
      const json = await apiRequest(`/service-area/areas/${areaId}`, {
        method: 'PUT',
        body: JSON.stringify({
          radiusKm: Number(editAreaRadiusVal)
        })
      });
      if (json.success) {
        showToast('✓ Updated service area radius!');
        setEditingAreaId(null);
        fetchServiceAreaFromDb();
      }
    } catch (err) {
      console.error('Error editing area:', err);
    }
  };

  // Delete Area
  const handleDeleteArea = async (areaId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from service areas?`)) return;
    try {
      const json = await apiRequest(`/service-area/areas/${areaId}`, {
        method: 'DELETE'
      });
      if (json.success) {
        showToast(`✓ Deleted ${name} from service areas`);
        fetchServiceAreaFromDb();
      }
    } catch (err) {
      console.error('Error deleting area:', err);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827]">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>Operations</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Service Area</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">Service Area</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#0A8B5F] border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage where your kitchen delivers.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchServiceAreaFromDb}
            className="px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RotateCw size={14} className="text-[#0A8B5F]" />
            <span>Refresh</span>
          </button>

          <button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: SERVICE AREA OVERVIEW CARDS */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="border-b border-[#E5ECE8] pb-3">
          <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">SERVICE AREA OVERVIEW</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Active Areas */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Active Areas</div>
            <div className="text-4xl font-black text-[#111827]">{summary.activeAreasCount || areasList.length}</div>
            <p className="text-[10px] text-[#0A8B5F] font-extrabold mt-1">● LIVE Coverage Zones</p>
          </div>

          {/* Card 2: Customers */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Customers</div>
            <div className="text-4xl font-black text-indigo-600">{summary.eligibleCustomersCount}</div>
            <p className="text-[10px] text-indigo-700 font-semibold mt-1">Eligible in active radius</p>
          </div>

          {/* Card 3: Deliveries */}
          <div className="bg-[#F9FBF9] p-5 rounded-2xl border border-[#E5ECE8]">
            <div className="text-xs font-bold text-[#6B7280] mb-2 uppercase">Deliveries</div>
            <div className="text-4xl font-black text-[#0A8B5F]">{summary.todaysDeliveriesCount}</div>
            <p className="text-[10px] text-[#0A8B5F] font-semibold mt-1">Today in service zone</p>
          </div>

        </div>
      </div>

      {/* SECTION 2: DELIVERY SERVICE MAP */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-4">
        <div className="border-b border-[#E5ECE8] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">DELIVERY SERVICE MAP</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Real-time interactive Google / OpenStreet Map with delivery radius circle overlay.</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-[#0A8B5F] border border-emerald-200 text-[10px] font-black rounded-lg">
            📍 {kitchenLocation.locality}, {kitchenLocation.city}
          </span>
        </div>

        {/* Embedded Interactive Map Component */}
        <ServiceAreaMap 
          kitchenLocation={kitchenLocation}
          radiusKm={deliveryRadius}
          deliveryMode={deliveryMode}
          areas={areasList}
          height="26rem"
        />

        {/* Map Control Action Buttons */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button 
            type="button"
            onClick={() => {
              const val = prompt('Enter custom delivery radius in KM:', deliveryRadius);
              if (val && !isNaN(val)) {
                setDeliveryRadius(Number(val));
                showToast(`✓ Radius updated to ${val} KM`);
              }
            }}
            className="px-4 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Compass size={15} className="text-[#0A8B5F]" />
            <span>Set Radius</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setDeliveryMode('Area Based');
              showToast('✓ Switched to Area Based Delivery Mode');
            }}
            className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              deliveryMode === 'Area Based' ? 'bg-[#0A8B5F] text-white border-[#0A8B5F]' : 'bg-[#F9FBF9] border-[#E5ECE8] text-[#111827]'
            }`}
          >
            <Navigation size={15} />
            <span>Draw Area</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setDeliveryRadius(3);
              setDeliveryMode('Radius Based');
              showToast('✓ Cleared area and reset radius to 3 KM');
            }}
            className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Clear Area</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: SERVICE AREA SETTINGS */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6">
        <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider border-b border-[#E5ECE8] pb-3">
          SERVICE AREA SETTINGS
        </h2>

        <div className="space-y-5">
          {/* Delivery Mode Radio Options */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#111827]">Delivery Mode</label>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                <input 
                  type="radio" 
                  name="deliveryMode"
                  value="Radius Based"
                  checked={deliveryMode === 'Radius Based'}
                  onChange={e => setDeliveryMode(e.target.value)}
                  className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
                />
                <span>Radius Based</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-extrabold cursor-pointer">
                <input 
                  type="radio" 
                  name="deliveryMode"
                  value="Area Based"
                  checked={deliveryMode === 'Area Based'}
                  onChange={e => setDeliveryMode(e.target.value)}
                  className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
                />
                <span>Area Based</span>
              </label>
            </div>
          </div>

          {/* Delivery Radius */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-[#111827]">Delivery Radius</label>
              <span className="text-sm font-black text-[#0A8B5F]">{deliveryRadius} KM</span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="number"
                min="1"
                max="25"
                value={deliveryRadius}
                onChange={e => setDeliveryRadius(Number(e.target.value))}
                className="w-32 px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
              <span className="text-xs text-[#6B7280]">KM Maximum Distance</span>
            </div>
          </div>

          {/* Minimum Order */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#111827]">Minimum Order Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#6B7280]">₹</span>
              <input 
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={e => setMinOrderAmount(Number(e.target.value))}
                className="w-36 px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>
          </div>

          {/* Delivery Fee */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#111827]">Delivery Fee</label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#6B7280]">₹</span>
              <input 
                type="number"
                min="0"
                value={deliveryFee}
                onChange={e => setDeliveryFee(Number(e.target.value))}
                className="w-36 px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>
          </div>

          {/* Free Delivery Above */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#111827]">Free Delivery Above</label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#6B7280]">₹</span>
              <input 
                type="number"
                min="0"
                value={freeDeliveryAbove}
                onChange={e => setFreeDeliveryAbove(Number(e.target.value))}
                className="w-36 px-3 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-black text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
              />
            </div>
          </div>

          {/* Strict Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-extrabold text-[#111827] cursor-pointer">
              <input 
                type="checkbox"
                checked={acceptOrdersOnlyInsideArea}
                onChange={e => setAcceptOrdersOnlyInsideArea(e.target.checked)}
                className="w-4 h-4 accent-[#0A8B5F] cursor-pointer"
              />
              <span>Accept orders only inside service area boundary</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* SECTION 4: ACTIVE SERVICE AREAS TABLE */}
      <div className="bg-white rounded-2xl border border-[#E5ECE8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E5ECE8] bg-[#F9FBF9] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider">ACTIVE SERVICE AREAS</h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Specific localities and coverage zones served by your kitchen.</p>
          </div>

          <button 
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={15} />
            <span>+ ADD SERVICE AREA</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#111827]">
            <thead className="bg-[#F9FBF9] border-b border-[#E5ECE8] text-[#6B7280] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4">Area</th>
                <th className="p-4">Radius</th>
                <th className="p-4">Customers</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5ECE8] font-bold">
              {areasList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#6B7280]">
                    No active service areas found. Click "+ ADD SERVICE AREA" to create one.
                  </td>
                </tr>
              ) : (
                areasList.map((item) => {
                  const isEditing = editingAreaId === (item._id || item.id);
                  return (
                    <tr key={item._id || item.id || item.areaName} className="hover:bg-[#F9FBF9] transition-colors">
                      <td className="p-4 font-black text-[#111827]">
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-[#0A8B5F]" />
                          <span>{item.areaName}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="number"
                              min="1"
                              max="30"
                              value={editAreaRadiusVal}
                              onChange={e => setEditAreaRadiusVal(Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-white border border-[#0A8B5F] rounded-lg text-xs font-black focus:outline-none"
                            />
                            <span className="text-[10px] text-[#6B7280]">km</span>
                            <button 
                              onClick={() => handleSaveAreaEdit(item._id || item.id)}
                              className="p-1 bg-[#0A8B5F] text-white rounded cursor-pointer ml-1"
                            >
                              <Check size={13} />
                            </button>
                            <button 
                              onClick={() => setEditingAreaId(null)}
                              className="p-1 bg-gray-200 text-[#111827] rounded cursor-pointer"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-black text-sm text-[#111827]">{item.radiusKm} km</span>
                        )}
                      </td>

                      <td className="p-4 text-indigo-600 font-black text-sm">
                        {item.customersCount || 20}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          ● {item.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isEditing && (
                            <button 
                              onClick={() => {
                                setEditingAreaId(item._id || item.id);
                                setEditAreaRadiusVal(item.radiusKm);
                              }}
                              className="px-3 py-1.5 bg-white border border-[#E5ECE8] hover:bg-gray-50 text-[#111827] font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={13} className="text-[#0A8B5F]" />
                              <span>Edit</span>
                            </button>
                          )}

                          <button 
                            onClick={() => handleDeleteArea(item._id || item.id, item.areaName)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding New Service Area */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#E5ECE8] animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-black text-[#111827]">Add New Service Area</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#111827] rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddArea} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Area / Locality Name</label>
                <input 
                  type="text"
                  placeholder="E.g., Paldi, Prahlad Nagar, Vastrapur"
                  value={newAreaName}
                  onChange={e => setNewAreaName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B7280]">Delivery Radius (KM)</label>
                <input 
                  type="number"
                  min="1"
                  max="25"
                  value={newAreaRadius}
                  onChange={e => setNewAreaRadius(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5ECE8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Add Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
