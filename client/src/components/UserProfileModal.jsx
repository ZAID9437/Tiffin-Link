import React, { useState, useEffect } from 'react';
import { 
  X, User, MapPin, CreditCard, Utensils, Calendar, Bell, 
  Check, Plus, Trash2, ShieldCheck, Save, Smartphone, Mail,
  Sun, Moon, Monitor, Palette
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function UserProfileModal({ isOpen, onClose, initialTab = 'profile', currentUser, onUpdateUser, onLogout, onOpenLegalModal }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saveToast, setSaveToast] = useState(false);
  const [privacyToast, setPrivacyToast] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);
  const { theme, resolvedTheme, isDark, compactMode, reduceMotion, setTheme, setCompactMode, setReduceMotion } = useTheme();

  // Active sessions state
  const [sessions, setSessions] = useState([
    { id: 'curr', device: 'Chrome 129 on Windows 11', ip: '103.21.124.89 (Ahmedabad, Gujarat)', isCurrent: true, lastActive: 'Active now' },
    { id: 'mob', device: 'Mobile Safari on iPhone 15', ip: '103.21.124.91 (Ahmedabad, Gujarat)', isCurrent: false, lastActive: 'Yesterday at 8:42 PM' }
  ]);

  // Privacy and data consents
  const [privacySettings, setPrivacySettings] = useState({
    shareLiveGps: true,
    telemetryAnalytics: true,
    personalizedChefs: true,
    retainOrderHistory: true
  });

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

  const handleSignOutOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    setPrivacyToast('Signed out of all other active sessions and devices.');
    setTimeout(() => setPrivacyToast(''), 3500);
  };

  const handleExportData = () => {
    const archiveData = {
      exportTimestamp: new Date().toISOString(),
      platform: 'TiffinLink Artisanal Dining',
      user: {
        id: currentUser?._id || currentUser?.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        role: currentUser?.role || 'customer'
      },
      diningPreferences: {
        dietary: profileData.dietary,
        spiceLevel: profileData.spiceLevel,
        rotliType: profileData.rotliType,
        noOnionGarlic: profileData.noOnionGarlic,
        lessOil: profileData.lessOil
      },
      savedAddresses: addresses,
      paymentProfilesCount: paymentMethods.length,
      consents: privacySettings,
      activeSessionsCount: sessions.length
    };

    const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TiffinLink_Data_Archive_${(profileData.name || 'user').replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setPrivacyToast('Personal data archive generated and downloaded.');
    setTimeout(() => setPrivacyToast(''), 3500);
  };

  const handleConfirmDeletion = () => {
    setDeletionSuccess(true);
    setPrivacyToast('Account deletion request submitted. Regulatory verification in progress.');
    setTimeout(() => {
      setPrivacyToast('');
      setIsDeletingAccount(false);
      setDeletionSuccess(false);
      if (onLogout) onLogout();
      onClose();
    }, 2500);
  };

  const tabs = [
    { id: 'profile', label: 'Personal Information', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'preferences', label: 'Tiffin Preferences', icon: Utensils },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'subscriptions', label: 'Subscriptions', icon: Calendar },
    { id: 'notifications', label: 'Notifications Settings', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheck }
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

            {/* Tab: Appearance & Theme */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a0522d]">Display & Aesthetics</span>
                  <h3 className="text-xl font-bold text-[#1a1a1a] dark:text-[#F4F4F6] mt-0.5">Appearance &amp; Density</h3>
                  <p className="text-xs text-[#665d52] dark:text-[#A1A1AA] mt-1">
                    Choose how TiffinLink renders across your device. Changes apply immediately across the entire website.
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-[#F4F4F6]">Interface Theme</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* System Default */}
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${
                        theme === 'system'
                          ? 'border-[#1a1a1a] dark:border-white bg-[#f5f3ef] dark:bg-[#1F1F24] ring-2 ring-black/10 dark:ring-white/20 shadow-md'
                          : 'border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] hover:border-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Monitor size={22} className="text-[#1a1a1a] dark:text-[#F4F4F6]" />
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          theme === 'system'
                            ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-[#111113]'
                            : 'bg-black/5 dark:bg-white/10 text-[#665d52] dark:text-[#A1A1AA]'
                        }`}>
                          {theme === 'system' ? 'ACTIVE' : 'OS SYNC'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1a1a1a] dark:text-[#F4F4F6] flex items-center justify-between">
                          <span>System Default</span>
                          {theme === 'system' && <Check size={14} className="text-emerald-600 font-bold" />}
                        </div>
                        <p className="text-[10px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Auto-detect from host OS</p>
                      </div>
                    </button>

                    {/* Light Mode */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'border-[#1a1a1a] dark:border-white bg-[#FAF8F5] dark:bg-[#1F1F24] ring-2 ring-black/10 dark:ring-white/20 shadow-md'
                          : 'border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] hover:border-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Sun size={22} className="text-amber-600" />
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          theme === 'light'
                            ? 'bg-[#1a1a1a] text-white dark:bg-white dark:text-[#111113]'
                            : 'bg-black/5 dark:bg-white/10 text-[#665d52] dark:text-[#A1A1AA]'
                        }`}>
                          {theme === 'light' ? 'ACTIVE' : 'LIGHT'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#1a1a1a] dark:text-[#F4F4F6] flex items-center justify-between">
                          <span>Light Mode</span>
                          {theme === 'light' && <Check size={14} className="text-emerald-600 font-bold" />}
                        </div>
                        <p className="text-[10px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Sand &amp; Bone White</p>
                      </div>
                    </button>

                    {/* Dark Mode */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between h-36 transition-all cursor-pointer bg-[#18181B] text-white ${
                        theme === 'dark'
                          ? 'border-white ring-2 ring-white/30 shadow-md'
                          : 'border-[#2C2C34] hover:border-white/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Moon size={22} className="text-indigo-300" />
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          theme === 'dark'
                            ? 'bg-white text-[#111113]'
                            : 'bg-white/10 text-white/70'
                        }`}>
                          {theme === 'dark' ? 'ACTIVE' : 'NIGHT SHIFT'}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span>Dark Mode</span>
                          {theme === 'dark' && <Check size={14} className="text-emerald-400 font-bold" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Obsidian &amp; Charcoal</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Density & Shaders Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1a1a1a] dark:text-[#F4F4F6]">Compact Density Mode</p>
                      <p className="text-[11px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Compresses cards to surface more content</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCompactMode(!compactMode)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        compactMode ? 'bg-[#1a1a1a] dark:bg-emerald-600' : 'bg-[#ded9d1] dark:bg-neutral-700'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#ded9d1] dark:border-[#2C2C34] bg-white dark:bg-[#18181B] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1a1a1a] dark:text-[#F4F4F6]">Reduce Motion &amp; Shaders</p>
                      <p className="text-[11px] text-[#665d52] dark:text-[#A1A1AA] mt-0.5">Disables micro-transitions to conserve battery</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReduceMotion(!reduceMotion)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        reduceMotion ? 'bg-[#1a1a1a] dark:bg-emerald-600' : 'bg-[#ded9d1] dark:bg-neutral-700'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${reduceMotion ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
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

            {/* Tab 8: Privacy & Data Settings (Checklist Section 4 & Section 3) */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 max-w-xl">
                {privacyToast && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Check size={16} className="shrink-0" />
                    <span>{privacyToast}</span>
                  </div>
                )}

                {/* Active Sessions & Devices */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a] dark:text-white">Active Sessions &amp; Devices</h4>
                      <p className="text-[11px] text-[#665d52] dark:text-stone-400">Devices authorized to access your TiffinLink account</p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSignOutOtherSessions}
                        className="text-[11px] font-bold text-[#a0522d] hover:underline cursor-pointer"
                      >
                        Sign Out Other Devices
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {sessions.map((sess) => (
                      <div 
                        key={sess.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                          sess.isCurrent 
                            ? 'bg-[#1b5e20]/5 border-[#1b5e20]/30 text-[#181512] dark:text-white' 
                            : 'bg-white dark:bg-stone-800 border-[#ded9d1] dark:border-stone-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-[#1b5e20] text-white text-[9px] font-bold uppercase">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#665d52] dark:text-stone-400">{sess.ip} &bull; {sess.lastActive}</p>
                        </div>
                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              setSessions(prev => prev.filter(s => s.id !== sess.id));
                              setPrivacyToast(`Session revoked for ${sess.device}`);
                              setTimeout(() => setPrivacyToast(''), 3000);
                            }}
                            className="text-[11px] text-red-600 hover:underline font-semibold"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Consents & Permissions */}
                <div className="space-y-3 pt-2 border-t border-[#ded9d1]/60 dark:border-stone-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a] dark:text-white">Privacy Choices &amp; Consents</h4>
                  <div className="space-y-2.5">
                    {[
                      { key: 'shareLiveGps', label: 'Precise GPS Telemetry during Active Delivery', desc: 'Allows assigned driver to find your exact drop-off location. Automatically stops once delivered.' },
                      { key: 'personalizedChefs', label: 'Hyperlocal Culinary Recommendations', desc: 'Allows TiffinLink to recommend home chefs based on your spice tolerance and dietary history.' },
                      { key: 'telemetryAnalytics', label: 'Platform Performance & Operational Analytics', desc: 'Anonymous latency monitoring that prevents culinary ordering downtime.' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-start justify-between p-3.5 rounded-xl border border-[#ded9d1] dark:border-stone-700 bg-white dark:bg-stone-800 cursor-pointer">
                        <div className="pr-4">
                          <p className="text-xs font-bold text-[#1a1a1a] dark:text-white">{item.label}</p>
                          <p className="text-[11px] text-[#665d52] dark:text-stone-400 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={privacySettings[item.key]}
                          onChange={(e) => setPrivacySettings({ ...privacySettings, [item.key]: e.target.checked })}
                          className="w-4 h-4 rounded text-[#1a1a1a] focus:ring-0 mt-0.5 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data Portability (Export My Data) */}
                <div className="space-y-2 pt-2 border-t border-[#ded9d1]/60 dark:border-stone-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a] dark:text-white">Data Portability &amp; Archive</h4>
                  <div className="p-4 rounded-xl border border-[#ded9d1] dark:border-stone-700 bg-white dark:bg-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-[#1a1a1a] dark:text-white">Request a Copy of Your Personal Data</p>
                      <p className="text-[11px] text-[#665d52] dark:text-stone-400 mt-0.5">Download a machine-readable JSON archive of your dining profile, addresses, and meal history.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-xl bg-[#181512] dark:bg-stone-100 text-white dark:text-[#181512] font-bold text-xs uppercase tracking-wider hover:bg-[#6B4B2B] transition-colors shrink-0 cursor-pointer"
                    >
                      Export Archive (.JSON)
                    </button>
                  </div>
                </div>

                {/* Legal Policy Reference & Account Erasure */}
                <div className="space-y-3 pt-2 border-t border-[#ded9d1]/60 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenLegalModal) onOpenLegalModal('privacy-policy');
                        onClose();
                      }}
                      className="text-xs font-bold text-[#6B4B2B] dark:text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Complete TiffinLink Privacy Policy</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {/* Account Deletion */}
                  <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 space-y-2">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300">Account Erasure &amp; Deletion</p>
                    <p className="text-[11px] text-red-700/80 dark:text-red-300/70 leading-relaxed">
                      Request permanent deletion of your account. Under Indian accounting and GST regulations, transaction tax invoices are retained for 7 years; all contact information, addresses, and profiles are permanently erased.
                    </p>
                    {isDeletingAccount ? (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmDeletion}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                        >
                          Confirm &amp; Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDeletingAccount(false)}
                          className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsDeletingAccount(true)}
                        className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Request Account Deletion &rarr;
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
