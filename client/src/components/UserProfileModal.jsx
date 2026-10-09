import React, { useState, useEffect } from 'react';
import { 
  X, User, MapPin, CreditCard, Utensils, Calendar, Bell, 
  Check, Plus, Trash2, ShieldCheck, Save, Smartphone, Mail
} from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose, initialTab = 'profile', currentUser, onUpdateUser, onLogout }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveToast, setSaveToast] = useState(false);

  // Profile fields state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    dietary: currentUser?.dietary || 'Veg',
    spiceLevel: currentUser?.spiceLevel || 'Medium Spice',
    rotliType: currentUser?.rotliType || 'Soft Phulka Rotli (Ghee)',
    noOnionGarlic: currentUser?.noOnionGarlic || false,
    lessOil: currentUser?.lessOil || false
  });

  // Saved addresses state
  const [addresses, setAddresses] = useState(currentUser?.addresses || []);
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressType, setNewAddressType] = useState('Home');

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState(currentUser?.paymentMethods || []);
  const [newUpiId, setNewUpiId] = useState('');

  // Notifications preferences state
  const [notifications, setNotifications] = useState({
    orderStatusWhatsapp: true,
    driverEnRouteSms: true,
    dailyTiffinReminder: true,
    kitchenMenuUpdates: false,
    promotions: false
  });

  // Sync when initialTab or currentUser changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone
      }));
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        name: profileData.name,
        phone: profileData.phone
      });
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    const newAddr = {
      id: Date.now(),
      type: newAddressType,
      address: newAddressText.trim(),
      locality: 'Ahmedabad',
      city: 'Ahmedabad',
      isDefault: addresses.length === 0
    };
    setAddresses([...addresses, newAddr]);
    setNewAddressText('');
  };

  const handleDeleteAddress = (id) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const handleAddUpi = (e) => {
    e.preventDefault();
    if (!newUpiId.trim() || !newUpiId.includes('@')) return;
    setPaymentMethods([...paymentMethods, {
      id: Date.now(),
      type: 'UPI',
      detail: newUpiId.trim(),
      label: 'Added UPI',
      isDefault: false
    }]);
    setNewUpiId('');
  };

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'preferences', label: 'Tiffin Preferences', icon: Utensils },
    { id: 'subscriptions', label: 'Subscriptions', icon: Calendar },
    { id: 'notifications', label: 'Notifications Settings', icon: Bell }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#fbf9f5] border border-[#ded9d1] rounded-3xl max-w-4xl w-full h-[90vh] max-h-[720px] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 bg-[#f5f3ef] border-b md:border-b-0 md:border-r border-[#ded9d1] p-5 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 pb-5 border-b border-[#ded9d1]/70">
              <div className="w-12 h-12 rounded-full bg-[#a0522d] text-white flex items-center justify-center text-lg font-bold shadow">
                {(profileData.name || 'Z')[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-[#1a1a1a] truncate">{profileData.name}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1b5e20]/10 text-[#1b5e20] uppercase">
                  Verified Diner
                </span>
              </div>
            </div>

            <nav className="mt-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#1a1a1a] text-white shadow-sm' 
                        : 'text-[#4a4238] hover:bg-black/5 hover:text-[#1a1a1a]'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-[#665d52]'} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-[#ded9d1]/70 mt-4">
            <button
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="w-full text-left text-xs font-bold text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Sign Out</span>
              <span>➔</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf9f5]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ded9d1] bg-[#fbf9f5]">
            <h2 className="font-display-lg text-xl sm:text-2xl text-[#1a1a1a]">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#ded9d1]/40 hover:bg-[#ded9d1] text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            
            {/* Tab 1: Personal Information */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                <div className="space-y-1">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-3.5 text-[#665d52]" />
                    <input 
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Mobile Phone (Delivery OTP & SMS)</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3.5 top-3.5 text-[#665d52]" />
                    <input 
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-[#665d52]" />
                    <input 
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ded9d1] bg-[#ded9d1]/30 text-sm text-[#665d52] cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-[#665d52]">Primary account ID cannot be changed directly.</p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-[#a0522d] text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-2"
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                  {saveToast && (
                    <span className="text-xs font-bold text-[#1b5e20] flex items-center gap-1 animate-in fade-in">
                      <Check size={14} /> Saved successfully!
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* Tab 2: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                  <p className="text-xs text-[#665d52] italic py-4 text-center">
                    No saved delivery addresses. Add your address below.
                  </p>
                ) : (
                  addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        addr.isDefault 
                          ? 'border-[#1a1a1a] bg-[#f5f3ef] shadow-sm' 
                          : 'border-[#ded9d1] bg-white/50 hover:bg-[#f5f3ef]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="p-2 rounded-xl bg-[#a0522d]/10 text-[#a0522d] shrink-0 mt-0.5">
                          <MapPin size={18} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-[#1b5e20] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#1a1a1a] mt-1 leading-snug">{addr.address}</p>
                          <p className="text-xs text-[#665d52] mt-0.5">{addr.locality}, {addr.city}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs font-semibold text-[#665d52] hover:text-[#1a1a1a] underline cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )))}
                </div>

                {/* Add New Address Form */}
                <form onSubmit={handleAddAddress} className="p-4 rounded-2xl bg-[#f5f3ef] border border-[#ded9d1] space-y-3">
                  <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} /> Add New Ahmedabad Address
                  </p>
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewAddressType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                          newAddressType === type ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-white border-[#ded9d1] text-[#4a4238]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text"
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    placeholder="Flat/House No., Building Name, Locality (e.g. Vastrapur)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded9d1] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-[#a0522d] transition-all cursor-pointer"
                  >
                    Add Address
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Payment Methods */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {paymentMethods.length === 0 ? (
                  <p className="text-xs text-[#665d52] italic py-4 text-center">
                    No saved payment methods. Add your UPI ID below.
                  </p>
                ) : (
                  paymentMethods.map((pm) => (
                    <div 
                      key={pm.id}
                      className="p-4 rounded-2xl border border-[#ded9d1] bg-[#f5f3ef] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#ded9d1] flex items-center justify-center text-[#1a1a1a]">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1a1a1a]">{pm.label}</p>
                          <p className="text-sm font-mono text-[#4a4238] mt-0.5">{pm.detail}</p>
                        </div>
                      </div>
                      {pm.isDefault ? (
                        <span className="bg-[#1b5e20] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Default
                        </span>
                      ) : (
                        <button 
                          onClick={() => setPaymentMethods(paymentMethods.map(p => ({ ...p, isDefault: p.id === pm.id })))}
                          className="text-xs text-[#665d52] hover:text-[#1a1a1a] underline cursor-pointer"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                  )))}
                </div>

                <form onSubmit={handleAddUpi} className="p-4 rounded-2xl bg-[#f5f3ef] border border-[#ded9d1] space-y-3">
                  <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} /> Link New UPI VPA ID
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newUpiId}
                      onChange={(e) => setNewUpiId(e.target.value)}
                      placeholder="username@okhdfcbank or yourphone@paytm"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#ded9d1] bg-white text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-[#a0522d] transition-all cursor-pointer whitespace-nowrap"
                    >
                      Verify &amp; Link
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 4: Tiffin Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 max-w-lg">
                <div className="space-y-2">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Dietary Classification</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Veg', 'Jain Satvik', 'Non-Veg'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, dietary: d })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          profileData.dietary === d 
                            ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow' 
                            : 'bg-white border-[#ded9d1] text-[#4a4238] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Rotli / Bread Preference</label>
                  <select
                    value={profileData.rotliType}
                    onChange={(e) => setProfileData({ ...profileData, rotliType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-sm text-[#1a1a1a] focus:outline-none"
                  >
                    <option value="Soft Phulka Rotli (Ghee)">Soft Phulka Rotli (Ghee)</option>
                    <option value="Dry Phulka (No Ghee / Satvik)">Dry Phulka (No Ghee / Satvik)</option>
                    <option value="Kathiyawadi Bajra Rotla">Kathiyawadi Bajra Rotla</option>
                    <option value="Crispy Gujarati Bhakhri">Crispy Gujarati Bhakhri</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label-caps uppercase text-[#665d52] font-semibold">Spice Tolerance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Mild / Sweet (Gujarati)', 'Medium Spice', 'Spicy / Kathiyawadi'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, spiceLevel: s })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                          profileData.spiceLevel === s 
                            ? 'bg-[#a0522d] text-white border-[#a0522d] shadow' 
                            : 'bg-white border-[#ded9d1] text-[#4a4238] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={profileData.noOnionGarlic}
                      onChange={(e) => setProfileData({ ...profileData, noOnionGarlic: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-[#1a1a1a]">Strictly No Onion &amp; No Garlic (Jain / Vaishnav Prep)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={profileData.lessOil}
                      onChange={(e) => setProfileData({ ...profileData, lessOil: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-[#1a1a1a]">Healthy Low Oil &amp; Low Sodium Cooking</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSaveToast(true);
                    setTimeout(() => setSaveToast(false), 2500);
                  }}
                  className="px-6 py-2.5 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#a0522d] transition-all cursor-pointer shadow"
                >
                  Save Food Preferences
                </button>
              </div>
            )}

            {/* Tab 5: Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                {currentUser?.subscription ? (
                  <div className="p-5 rounded-2xl border border-[#1b5e20]/30 bg-[#1b5e20]/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1b5e20]">Active Plan</span>
                        <h4 className="font-display-lg text-lg text-[#1a1a1a] mt-0.5">{currentUser.subscription.planName || 'Active Meal Plan'}</h4>
                      </div>
                      <span className="bg-[#1b5e20] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {currentUser.subscription.mealsLeft || 0} Meals Left
                      </span>
                    </div>
                    <p className="text-xs text-[#665d52]">
                      {currentUser.subscription.schedule || 'Scheduled delivery in 304 Food-Grade Insulated Canisters.'}
                    </p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#665d52] bg-[#f5f3ef] border border-[#ded9d1] rounded-2xl p-6">
                    <p className="font-semibold text-sm text-[#1a1a1a] mb-1">No Active Meal Subscription</p>
                    <p className="mb-4">Subscribe to a daily or weekly tiffin plan for automated fresh deliveries.</p>
                    <button 
                      onClick={() => {
                        onClose();
                        window.location.hash = '#find-tiffin';
                      }}
                      className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl hover:bg-[#a0522d] cursor-pointer"
                    >
                      Browse Tiffin Plans
                    </button>
                  </div>
                )}

                <div className="p-4 rounded-xl border border-[#ded9d1] bg-[#f5f3ef] text-xs text-[#665d52]">
                  💡 <strong>Did you know?</strong> You can pause or reschedule your tiffins up to 2 hours before the delivery slot without any penalty.
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 max-w-lg">
                <p className="text-xs text-[#665d52]">Select how you would like to receive real-time updates regarding your meals:</p>
                <div className="space-y-3">
                  {[
                    { key: 'orderStatusWhatsapp', label: 'Order Status & Dispatch on WhatsApp', desc: 'Instant live GPS link & driver details via WhatsApp' },
                    { key: 'driverEnRouteSms', label: 'Delivery OTP via SMS', desc: 'Secure 4-digit handover code sent on arrival' },
                    { key: 'dailyTiffinReminder', label: 'Daily Meal Slot Reminder', desc: 'Reminder 1 hour before scheduled lunch/dinner' },
                    { key: 'kitchenMenuUpdates', label: 'Daily Shaak/Sabzi Menu Update', desc: 'Notification when provider updates today’s special thali' }
                  ].map((n) => (
                    <label key={n.key} className="flex items-start justify-between p-3.5 rounded-xl border border-[#ded9d1] bg-white/70 cursor-pointer">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-[#1a1a1a]">{n.label}</p>
                        <p className="text-[11px] text-[#665d52] mt-0.5">{n.desc}</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={notifications[n.key]}
                        onChange={(e) => setNotifications({ ...notifications, [n.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0 mt-0.5 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
