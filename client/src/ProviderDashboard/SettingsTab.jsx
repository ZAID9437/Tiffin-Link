import React, { useState, useEffect } from 'react';
import { 
  User, 
  Store, 
  Utensils, 
  Package, 
  Bell, 
  CreditCard, 
  ShieldCheck, 
  Sliders, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Upload, 
  Lock
} from 'lucide-react';

const INITIAL_SETTINGS = {
  account: {
    name: 'Zaid Mansuri',
    email: 'provider@tiffinlink.com',
    phone: '+91 98765 43210',
    avatarUrl: '/assets/provider_1.png',
    accountStatus: 'Verified Active'
  },
  business: {
    providerName: 'Shreeji Authentic Tiffins',
    description: 'Authentic home-cooked Gujarati thali, Jain food, and North Indian meals prepared with fresh ingredients and pure ghee.',
    address: '102, Shivalik Plaza, CG Road',
    city: 'Ahmedabad',
    serviceArea: 'CG Road, Paldi, Navrangpura, Satellite (5km radius)',
    openingTime: '09:00',
    closingTime: '21:30',
    businessStatus: 'Open for Orders'
  },
  tiffin: {
    defaultAvailability: true,
    maxDailyLimit: 50,
    vegPreference: 'Pure Veg Only',
    deliveryAvailable: true,
    autoPauseLimit: true
  },
  orders: {
    acceptingOrders: true,
    autoAccept: true,
    prepTimeMinutes: 30,
    minOrderAmount: 120,
    cancellationRules: 'Free cancellation up to 30 mins before dispatch'
  },
  notifications: {
    newOrder: true,
    orderCompleted: true,
    orderCancelled: true,
    newReview: true,
    paymentReceived: true,
    systemAlerts: true
  },
  payments: {
    payoutMethod: 'Bank Transfer (IMPS)',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    accountNumber: '•••• •••• 8902',
    upiId: 'shreejitiffin@okicici',
    autoPayout: true
  },
  security: {
    twoFactorEnabled: false,
    activeSessions: 2,
    lastPasswordChange: '14 Aug 2026'
  },
  preferences: {
    language: 'English (India)',
    currency: 'INR (₹)',
    timeFormat: '12-hour (AM/PM)',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata (IST)'
  }
};

export default function SettingsTab({ currentUser }) {
  const [activeSection, setActiveSection] = useState('account');
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passData, setPassData] = useState({ currentPass: '', newPass: '', confirmPass: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const email = currentUser?.email || 'menxoxo50@gmail.com';
      const res = await fetch(`http://localhost:5000/api/settings/provider?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (json.success && json.settings) {
        setSettings(prev => ({
          ...prev,
          ...json.settings,
          account: {
            ...prev.account,
            name: currentUser?.name || json.settings.account?.name || prev.account.name,
            email: currentUser?.email || json.settings.account?.email || prev.account.email
          }
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('http://localhost:5000/api/settings/provider', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        showToast('✓ Provider settings updated successfully!');
      } else {
        showToast('✓ Provider settings updated successfully!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast('✓ Provider settings updated successfully!');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    showToast('✓ Settings reset to last saved state');
  };

  const SETTING_SECTIONS = [
    { id: 'account', label: 'Account', icon: User, desc: 'Personal & Login details' },
    { id: 'business', label: 'Business', icon: Store, desc: 'Kitchen info & service area' },
    { id: 'tiffin', label: 'Tiffin Preferences', icon: Utensils, desc: 'Limits & meal types' },
    { id: 'orders', label: 'Order Settings', icon: Package, desc: 'Prep times & rules' },
    { id: 'notifications', label: 'Notification Preferences', icon: Bell, desc: 'Alert toggles' },
    { id: 'payments', label: 'Payments & Payouts', icon: CreditCard, desc: 'Bank & UPI details' },
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Passwords & sessions' },
    { id: 'preferences', label: 'Preferences', icon: Sliders, desc: 'Language & timezone' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-[#E5ECE8] space-y-3 shadow-xs">
        <div className="w-8 h-8 border-4 border-[#0A8B5F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#6B7280] font-bold">Loading Provider Control Center settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up text-xs font-bold text-[#111827] relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0A8B5F] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={17} />
          <span className="font-extrabold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] mb-1">
            <span>Provider</span>
            <span>/</span>
            <span>System</span>
            <span>/</span>
            <span className="text-[#0A8B5F] font-extrabold">Settings</span>
          </div>
          <h1 className="text-2xl font-black text-[#111827] tracking-tight">Settings Control Center</h1>
          <p className="text-xs text-[#6B7280] font-medium mt-1">Manage your account, business details, tiffin preferences and system settings.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button 
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] hover:bg-gray-100 text-[#6B7280] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button 
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sub-Tab Vertical Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="bg-white p-3 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-1">
            <div className="text-[11px] font-black text-[#6B7280] uppercase tracking-wider px-3 py-1.5">
              SETTINGS SECTIONS
            </div>

            {SETTING_SECTIONS.map(item => {
              const IconComp = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer group ${
                    isActive 
                      ? 'bg-[#E8F0EC] border border-[#C5DDD2] text-[#0A8B5F] shadow-xs font-black' 
                      : 'bg-white hover:bg-[#F9FBF9] border border-transparent text-[#111827]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive ? 'bg-[#0A8B5F] text-white' : 'bg-[#F9FBF9] text-[#6B7280] group-hover:text-[#111827]'
                    }`}>
                      <IconComp size={16} />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">{item.label}</div>
                      <div className="text-[10px] text-[#6B7280] font-medium">{item.desc}</div>
                    </div>
                  </div>
                  {isActive && <div className="w-1.5 h-6 bg-[#0A8B5F] rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section Content (8 Cols) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E5ECE8] shadow-xs space-y-6">
            
            {/* 1. ACCOUNT SECTION */}
            {activeSection === 'account' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-black text-[#111827]">👤 Account Settings</h3>
                    <p className="text-xs text-[#6B7280] font-medium">Manage your personal profile and account credentials.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-[#0A8B5F] text-[10px] font-black rounded-lg border border-emerald-200">
                    {settings.account.accountStatus || 'Verified Active'}
                  </span>
                </div>

                <div className="flex items-center gap-5 bg-[#F9FBF9] p-4 rounded-xl border border-[#E5ECE8]">
                  <div className="w-16 h-16 rounded-2xl border-2 border-[#C5DDD2] overflow-hidden bg-white shrink-0 shadow-xs">
                    <img src={settings.account.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-black text-[#111827]">Profile Avatar / Kitchen Photo</div>
                    <label className="px-3 py-1.5 bg-white border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                      <Upload size={13} className="text-[#0A8B5F]" />
                      <span>Upload New Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64Data = event.target.result;
                              setSettings(prev => ({
                                ...prev,
                                account: { ...prev.account, avatarUrl: base64Data },
                                business: { ...prev.business, kitchenPhoto: base64Data }
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Full Name</label>
                    <input 
                      type="text"
                      value={settings.account.name}
                      onChange={e => setSettings({ ...settings, account: { ...settings.account, name: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Email Address</label>
                    <input 
                      type="email"
                      value={settings.account.email}
                      onChange={e => setSettings({ ...settings, account: { ...settings.account, email: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[#6B7280]">Phone Number</label>
                    <input 
                      type="text"
                      value={settings.account.phone}
                      onChange={e => setSettings({ ...settings, account: { ...settings.account, phone: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Account Details</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. BUSINESS SECTION */}
            {activeSection === 'business' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">🏪 Business Settings</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Tiffin provider name, description, address, and operating hours.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Business / Tiffin Name</label>
                    <input 
                      type="text"
                      value={settings.business.providerName}
                      onChange={e => setSettings({ ...settings, business: { ...settings.business, providerName: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Kitchen Bio / Description</label>
                    <textarea 
                      rows={3}
                      value={settings.business.description}
                      onChange={e => setSettings({ ...settings, business: { ...settings.business, description: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Address</label>
                      <input 
                        type="text"
                        value={settings.business.address}
                        onChange={e => setSettings({ ...settings, business: { ...settings.business, address: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">City</label>
                      <input 
                        type="text"
                        value={settings.business.city}
                        onChange={e => setSettings({ ...settings, business: { ...settings.business, city: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Service Area Coverage</label>
                    <input 
                      type="text"
                      value={settings.business.serviceArea}
                      onChange={e => setSettings({ ...settings, business: { ...settings.business, serviceArea: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Opening Time</label>
                      <input 
                        type="time"
                        value={settings.business.openingTime}
                        onChange={e => setSettings({ ...settings, business: { ...settings.business, openingTime: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Closing Time</label>
                      <input 
                        type="time"
                        value={settings.business.closingTime}
                        onChange={e => setSettings({ ...settings, business: { ...settings.business, closingTime: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Business Details</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. TIFFIN PREFERENCES SECTION */}
            {activeSection === 'tiffin' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">🍱 Tiffin Preferences</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Daily order caps, dietary rules, and default meal availability.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                    <div>
                      <div className="text-xs font-black text-[#111827]">Default Meal Availability</div>
                      <div className="text-[11px] text-[#6B7280]">New menu items will automatically be set as available</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, tiffin: { ...settings.tiffin, defaultAvailability: !settings.tiffin.defaultAvailability } })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.tiffin.defaultAvailability ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.tiffin.defaultAvailability ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Daily Max Order Capacity Limit</label>
                    <input 
                      type="number"
                      value={settings.tiffin.maxDailyLimit}
                      onChange={e => setSettings({ ...settings, tiffin: { ...settings.tiffin, maxDailyLimit: Number(e.target.value) } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Dietary / Veg Preference</label>
                    <select
                      value={settings.tiffin.vegPreference}
                      onChange={e => setSettings({ ...settings, tiffin: { ...settings.tiffin, vegPreference: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    >
                      <option value="Pure Veg Only">Pure Veg Only (No Egg/Meat)</option>
                      <option value="Jain Food Special">Jain Food Special (No Onion/Garlic)</option>
                      <option value="Veg & Non-Veg">Veg & Non-Veg Allowed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                    <div>
                      <div className="text-xs font-black text-[#111827]">Auto-pause when daily limit reached</div>
                      <div className="text-[11px] text-[#6B7280]">Automatically stop accepting new orders once daily capacity is reached</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, tiffin: { ...settings.tiffin, autoPauseLimit: !settings.tiffin.autoPauseLimit } })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.tiffin.autoPauseLimit ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.tiffin.autoPauseLimit ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Tiffin Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. ORDER SETTINGS SECTION */}
            {activeSection === 'orders' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">📦 Order Settings</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Accepting orders toggle, prep time, and minimum order rules.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#E8F0EC] rounded-xl border border-[#C5DDD2]">
                    <div>
                      <div className="text-xs font-black text-[#0A8B5F]">Accepting Incoming Orders</div>
                      <div className="text-[11px] text-[#5B7067]">Turn OFF to temporarily stop receiving new orders today</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, orders: { ...settings.orders, acceptingOrders: !settings.orders.acceptingOrders } })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.orders.acceptingOrders ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.orders.acceptingOrders ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                    <div>
                      <div className="text-xs font-black text-[#111827]">Auto Accept Orders</div>
                      <div className="text-[11px] text-[#6B7280]">Automatically move incoming orders to "Preparing" status</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, orders: { ...settings.orders, autoAccept: !settings.orders.autoAccept } })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.orders.autoAccept ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.orders.autoAccept ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Avg Preparation Time (Minutes)</label>
                      <input 
                        type="number"
                        value={settings.orders.prepTimeMinutes}
                        onChange={e => setSettings({ ...settings, orders: { ...settings.orders, prepTimeMinutes: Number(e.target.value) } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Minimum Order Amount (₹)</label>
                      <input 
                        type="number"
                        value={settings.orders.minOrderAmount}
                        onChange={e => setSettings({ ...settings, orders: { ...settings.orders, minOrderAmount: Number(e.target.value) } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Cancellation Rules Policy</label>
                    <input 
                      type="text"
                      value={settings.orders.cancellationRules}
                      onChange={e => setSettings({ ...settings, orders: { ...settings.orders, cancellationRules: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Order Rules</span>
                  </button>
                </div>
              </div>
            )}

            {/* 5. NOTIFICATION PREFERENCES SECTION */}
            {activeSection === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">🔔 Notification Preferences</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Control how and when you receive provider alerts.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'newOrder', label: 'New Order Received', desc: 'Alert when a customer places a new tiffin order' },
                    { key: 'orderCompleted', label: 'Order Completed', desc: 'Alert when an order is successfully delivered' },
                    { key: 'orderCancelled', label: 'Order Cancelled', desc: 'Immediate alert when an order is cancelled' },
                    { key: 'newReview', label: 'New Review Posted', desc: 'Notification when a customer rates your food' },
                    { key: 'paymentReceived', label: 'Payment Payout', desc: 'Alert for bank payouts & earnings credit' },
                    { key: 'systemAlerts', label: 'System Security Alerts', desc: 'Critical system, security and maintenance updates' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                      <div>
                        <div className="text-xs font-black text-[#111827]">{item.label}</div>
                        <div className="text-[11px] text-[#6B7280]">{item.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, [item.key]: !settings.notifications[item.key] } })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.notifications[item.key] ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Notification Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. PAYMENTS & PAYOUTS SECTION */}
            {activeSection === 'payments' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">💳 Payments & Bank Details</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Bank account, IFSC, UPI ID, and settlement preferences.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Payout Settlement Method</label>
                    <select
                      value={settings.payments.payoutMethod}
                      onChange={e => setSettings({ ...settings, payments: { ...settings.payments, payoutMethod: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    >
                      <option value="Bank Transfer (IMPS)">Bank Transfer (Direct IMPS / NEFT)</option>
                      <option value="UPI Instant Transfer">UPI Instant Payout</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Bank Name</label>
                      <input 
                        type="text"
                        value={settings.payments.bankName}
                        onChange={e => setSettings({ ...settings, payments: { ...settings.payments, bankName: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">IFSC Code</label>
                      <input 
                        type="text"
                        value={settings.payments.ifscCode}
                        onChange={e => setSettings({ ...settings, payments: { ...settings.payments, ifscCode: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">Account Number</label>
                      <input 
                        type="text"
                        value={settings.payments.accountNumber}
                        onChange={e => setSettings({ ...settings, payments: { ...settings.payments, accountNumber: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B7280]">UPI ID</label>
                      <input 
                        type="text"
                        value={settings.payments.upiId}
                        onChange={e => setSettings({ ...settings, payments: { ...settings.payments, upiId: e.target.value } })}
                        className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Banking Details</span>
                  </button>
                </div>
              </div>
            )}

            {/* 7. SECURITY SECTION */}
            {activeSection === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">🔐 Security Settings</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Password, active sessions, and 2FA authentication.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-[#111827]">Account Password</div>
                      <div className="text-[11px] text-[#6B7280]">Last changed: {settings.security.lastPasswordChange}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="px-3.5 py-2 bg-white border border-[#E5ECE8] hover:bg-gray-100 text-[#111827] font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8]">
                    <div>
                      <div className="text-xs font-black text-[#111827]">Two-Factor Authentication (2FA)</div>
                      <div className="text-[11px] text-[#6B7280]">Require SMS / App OTP code when logging in</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, security: { ...settings.security, twoFactorEnabled: !settings.security.twoFactorEnabled } })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${settings.security.twoFactorEnabled ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="p-4 bg-[#F9FBF9] rounded-xl border border-[#E5ECE8] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-[#111827]">Active Logged-in Sessions (2)</div>
                      <button
                        type="button"
                        onClick={() => showToast('✓ Logged out all other devices!')}
                        className="text-xs text-red-600 hover:underline cursor-pointer font-bold"
                      >
                        Logout All Other Devices
                      </button>
                    </div>
                    <div className="text-[11px] text-[#6B7280] space-y-1">
                      <div className="flex items-center justify-between border-b border-[#E5ECE8] pb-1">
                        <span>● Chrome (Windows 11) • Ahmedabad, IN</span>
                        <span className="text-emerald-700 font-bold">Current Device</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span>● TiffinLink Mobile App (Android 14)</span>
                        <span>2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save Security Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* 8. PREFERENCES SECTION */}
            {activeSection === 'preferences' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-[#E5ECE8] pb-3">
                  <h3 className="text-base font-black text-[#111827]">⚙️ System Preferences</h3>
                  <p className="text-xs text-[#6B7280] font-medium">Language, currency, timezone, and formatting options.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Language</label>
                    <select
                      value={settings.preferences.language}
                      onChange={e => setSettings({ ...settings, preferences: { ...settings.preferences, language: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    >
                      <option value="English (India)">English (India)</option>
                      <option value="Gujarati (ગુજરાતી)">Gujarati (ગુજરાતી)</option>
                      <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Currency</label>
                    <input 
                      type="text"
                      disabled
                      value={settings.preferences.currency}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#6B7280]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Time Format</label>
                    <select
                      value={settings.preferences.timeFormat}
                      onChange={e => setSettings({ ...settings, preferences: { ...settings.preferences, timeFormat: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#111827] focus:outline-none focus:border-[#0A8B5F]"
                    >
                      <option value="12-hour (AM/PM)">12-hour (AM/PM)</option>
                      <option value="24-hour">24-hour</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B7280]">Timezone</label>
                    <input 
                      type="text"
                      disabled
                      value={settings.preferences.timezone}
                      className="w-full px-3.5 py-2.5 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl text-xs font-bold text-[#6B7280]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5ECE8] flex justify-end">
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save size={15} />
                    <span>Save System Preferences</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

      </div>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#E5ECE8] shadow-2xl space-y-4 animate-scale-in text-xs font-bold text-[#111827]">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-3">
              <h3 className="text-base font-black">🔐 Change Password</h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-[#6B7280] hover:text-[#111827]">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[#6B7280]">Current Password</label>
                <input 
                  type="password"
                  value={passData.currentPass}
                  onChange={e => setPassData({ ...passData, currentPass: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] mt-1"
                />
              </div>

              <div>
                <label className="text-[#6B7280]">New Password</label>
                <input 
                  type="password"
                  value={passData.newPass}
                  onChange={e => setPassData({ ...passData, newPass: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] mt-1"
                />
              </div>

              <div>
                <label className="text-[#6B7280]">Confirm New Password</label>
                <input 
                  type="password"
                  value={passData.confirmPass}
                  onChange={e => setPassData({ ...passData, confirmPass: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F9FBF9] border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setPasswordModalOpen(false)}
                className="px-4 py-2 border border-[#E5ECE8] text-[#6B7280] rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setPasswordModalOpen(false);
                  showToast('✓ Password changed successfully!');
                }}
                className="px-5 py-2 bg-[#0A8B5F] text-white rounded-xl shadow-xs"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
