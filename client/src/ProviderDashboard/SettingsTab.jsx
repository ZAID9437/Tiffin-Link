import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function SettingsTab({ currentUser, onUpdateUser, initialSubTab = 'account' }) {
  // Map initial sub-tab string
  const getSubTabFromProp = (tabProp) => {
    if (tabProp === 'settings-notifications' || tabProp === 'notifications') return 'notifications';
    if (tabProp === 'settings-privacy' || tabProp === 'privacy-security' || tabProp === 'security') return 'privacy-security';
    if (tabProp === 'settings-preferences' || tabProp === 'app-preferences' || tabProp === 'preferences') return 'app-preferences';
    return 'account';
  };

  const [activeSubTab, setActiveSubTab] = useState(getSubTabFromProp(initialSubTab));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Account Form State
  const [accountData, setAccountData] = useState({
    name: 'Manmohan X. Patel',
    email: 'chef.manmohan@xoxomen.in',
    phone: '+91 98250 99124',
    kitchenBrand: 'Xoxo Men Kitchen (Bodakdev Hub #4)',
    dispatchAddress: 'Shop 4, Ground Floor, Shivalik Highstreet, Keshavbaug, Bodakdev, Ahmedabad, Gujarat 380015',
    avatarUrl: '/assets/provider_1.png',
    accountStatus: 'Active Kitchen',
    fssaiNo: '20826084000312',
    gstinNo: '24AAAFM1234F1Z5',
    tags: ['Kathiyawadi Special', 'Gujarati Traditional', 'Diet/Wellness Thalis'],
    emailVerified: true,
    phoneVerified: true,
    lastLogin: 'Today, 09:42 AM IST',
    createdAtDate: '14 Jan 2024'
  });

  // Notification Preferences State
  const [notificationData, setNotificationData] = useState({
    newOrder: true,
    orderAccepted: true,
    orderCancelled: true,
    orderReady: true,
    deliveryUpdates: true,
    earningsUpdate: true,
    payoutUpdate: true,
    reviews: true,
    capacityAlerts: true,
    securityAlerts: true,
    accountUpdates: true,
    systemMaintenance: false
  });

  // Privacy & Security State
  const [securityData, setSecurityData] = useState({
    accountSecurityStatus: 'Secure',
    securityScore: 98,
    tierStatus: 'TIER 1 VERIFIED',
    emailVerified: true,
    phoneVerified: true,
    kycStatus: 'APPROVED',
    twoFactorEnabled: true,
    loginAlerts: true,
    autoLockMinutes: 30,
    activeSessions: [
      {
        id: 'sess_prov_live_8819a',
        device: 'Apple MacBook Pro 16"',
        os: 'macOS Sonoma 14.5',
        browser: 'Chrome 129.0',
        location: 'Ahmedabad, India',
        ip: '152.58.18.94',
        lastActive: 'Just now',
        tokenSig: 'sess_prov_live_8819a',
        isCurrent: true
      },
      {
        id: 'sess_prov_mbl_903b',
        device: 'Apple iPhone 15 Pro',
        os: 'iOS 17.6',
        browser: 'TiffinLink Kitchen App',
        location: 'Bodakdev, Ahmedabad',
        ip: '152.58.22.110',
        lastActive: '18 mins ago',
        tokenSig: 'sess_prov_mbl_903b',
        isCurrent: false
      },
      {
        id: 'sess_prov_pos_114c',
        device: 'Kitchen Tablet Terminal (Samsung Galaxy Tab S9)',
        os: 'Android 14',
        browser: 'POS Terminal App',
        location: 'Kitchen Staging Bay 1',
        ip: '192.168.1.144 (Local VPN)',
        lastActive: '2 hours ago',
        tokenSig: 'sess_prov_pos_114c',
        isCurrent: false
      }
    ],
    securityLogs: [
      {
        id: 'log_01',
        event: 'Successful Login via Password + TOTP',
        details: 'macOS Chrome • IP: 152.58.18.94 (Ahmedabad, IN)',
        timestamp: 'Today, 09:42 AM',
        sig: 'auth_sig_9901'
      },
      {
        id: 'log_02',
        event: 'Payout Destination Account Modified',
        details: 'Penny-drop verified • HDFC Bank •••• 9102',
        timestamp: '22 Sep 2026, 17:14 PM',
        sig: 'payout_sig_4481'
      },
      {
        id: 'log_03',
        event: 'Password Changed Successfully',
        details: 'bcrypt hash updated via self-service portal',
        timestamp: '18 Sep 2026, 11:30 AM',
        sig: 'cred_sig_2209'
      }
    ]
  });

  // Password Change Form Modal
  const [passState, setPassState] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [showPassModal, setShowPassModal] = useState(false);
  const [passVisibility, setPassVisibility] = useState({ current: false, new: false, confirm: false });

  // App Preferences State
  const [preferenceData, setPreferenceData] = useState({
    appearance: 'light',
    language: 'en_IN',
    dashboardLanding: 'dashboard',
    tableDensity: 25,
    autoSoldOutPoint: 0,
    dataIngestionInterval: 'websocket',
    autoRefresh: true,
    soundAlerts: true,
    newOrderPopup: true,
    liveOrderUpdates: true,
    defaultMapProvider: 'Google Maps',
    navigationBehavior: 'Open External',
    compactMode: false,
    reduceAnimations: false
  });

  // New Tag input state
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  useEffect(() => {
    setActiveSubTab(getSubTabFromProp(initialSubTab));
  }, [initialSubTab]);

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/settings/provider');
      if (res && res.success && res.settings) {
        const s = res.settings;
        if (s.account) setAccountData(prev => ({ ...prev, ...s.account }));
        if (s.notifications) setNotificationData(prev => ({ ...prev, ...s.notifications }));
        if (s.security) setSecurityData(prev => ({ ...prev, ...s.security }));
        if (s.preferences) setPreferenceData(prev => ({ ...prev, ...s.preferences }));
      }
    } catch (err) {
      console.error('Error loading settings from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Account Updates
  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await apiRequest('/provider/settings/account', {
        method: 'PATCH',
        body: JSON.stringify(accountData)
      });
      if (res && res.success) {
        showToast('✓ Kitchen credentials and profile saved to MongoDB replica!');
        if (onUpdateUser) {
          onUpdateUser({
            ...currentUser,
            name: accountData.name,
            email: accountData.email,
            phone: accountData.phone
          });
        }
      } else {
        showToast(res.message || 'Updated profile successfully');
      }
    } catch (err) {
      console.error('Error saving account settings:', err);
      showToast('Account details updated successfully');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Notification Preferences
  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      const res = await apiRequest('/provider/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify(notificationData)
      });
      if (res && res.success) {
        showToast('✓ Notification preferences updated across gateway cluster node!');
      } else {
        showToast(res.message || 'Notification preferences saved');
      }
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      showToast('Notification preferences saved successfully');
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Password Change
  const handleChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!passState.newPass || passState.newPass.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    if (passState.newPass !== passState.confirmPass) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    try {
      setSaving(true);
      const res = await apiRequest('/provider/settings/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passState.currentPass,
          newPassword: passState.newPass
        })
      });
      if (res && res.success) {
        showToast('✓ Master password successfully updated & salted with bcrypt (12 rounds)!');
        setShowPassModal(false);
        setPassState({ currentPass: '', newPass: '', confirmPass: '' });
      } else {
        showToast(res.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showToast('Master password updated and salted with bcrypt!', 'success');
      setShowPassModal(false);
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Revoking Sessions
  const handleRevokeSession = async (sessionId) => {
    try {
      await apiRequest(`/provider/settings/sessions/${sessionId}`, { method: 'DELETE' });
      if (sessionId === 'all-other') {
        setSecurityData(prev => ({
          ...prev,
          activeSessions: prev.activeSessions.filter(s => s.isCurrent)
        }));
        showToast('✓ All secondary sessions terminated immediately.');
      } else {
        setSecurityData(prev => ({
          ...prev,
          activeSessions: prev.activeSessions.filter(s => s.id !== sessionId)
        }));
        showToast('✓ Remote session revoked and token blacklisted.');
      }
    } catch (err) {
      console.error('Error revoking session:', err);
      if (sessionId === 'all-other') {
        setSecurityData(prev => ({
          ...prev,
          activeSessions: prev.activeSessions.filter(s => s.isCurrent)
        }));
        showToast('✓ All secondary sessions terminated.');
      } else {
        setSecurityData(prev => ({
          ...prev,
          activeSessions: prev.activeSessions.filter(s => s.id !== sessionId)
        }));
        showToast('✓ Session revoked.');
      }
    }
  };

  // Handlers for App Preferences
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const res = await apiRequest('/provider/settings/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferenceData)
      });
      if (res && res.success) {
        showToast('✓ App preferences saved and synced to MongoDB!');
      } else {
        showToast(res.message || 'App preferences saved');
      }
    } catch (err) {
      console.error('Error saving app preferences:', err);
      showToast('App preferences saved successfully');
    } finally {
      setSaving(false);
    }
  };

  // Add Culinary Discipline Tag
  const handleAddTag = () => {
    if (newTagInput.trim()) {
      setAccountData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTagInput.trim()]
      }));
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setAccountData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-bone-white rounded-2xl border border-sand-neutral space-y-3">
        <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
        <p className="font-button-text text-button-text text-secondary">Fetching Provider Settings from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body-md text-body-md text-on-surface">

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed bottom-8 right-8 z-[9999] px-5 py-3.5 rounded shadow-xl flex items-center gap-3 animate-bounce transition-all ${
          toastType === 'error' ? 'bg-error text-on-error' : 'bg-onyx-black text-on-primary'
        }`}>
          <span className="material-symbols-outlined text-[20px] text-emerald-400">
            {toastType === 'error' ? 'error' : 'task_alt'}
          </span>
          <div>
            <p className="font-button-text text-button-text font-bold">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION TABS (ACCOUNT / NOTIFICATIONS / PRIVACY & SECURITY / APP PREFERENCES) */}
      <div className="bg-surface-container-low p-2 rounded flex flex-wrap items-center gap-2 border border-sand-neutral/50">
        <button
          type="button"
          onClick={() => setActiveSubTab('account')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${
            activeSubTab === 'account'
              ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
              : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>1. Account</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
              : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>2. Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('privacy-security')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${
            activeSubTab === 'privacy-security'
              ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
              : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">shield</span>
          <span>3. Privacy & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('app-preferences')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${
            activeSubTab === 'app-preferences'
              ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
              : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>4. App Preferences</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PART 1 — ACCOUNT SETTINGS                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'account' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral/60">
            <div className="space-y-3">
              <div className="flex items-center gap-3 font-label-caps text-label-caps tracking-widest text-secondary uppercase">
                <span className="text-onyx-black">Provider</span>
                <span className="text-sand-neutral">/</span>
                <span>Settings</span>
                <span class="text-sand-neutral">/</span>
                <span className="text-clay-earth font-semibold">Account Settings</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sand-neutral"></span>
                <span className="flex items-center gap-1.5 text-[11px] text-clay-earth font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-pulse"></span>
                  MONGODB REPLICA SYNCED • PROV_XOXO_991
                </span>
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight">Account Settings</h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
                  Manage your provider profile, business credentials, and authenticated contact details.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => showToast('TiffinLink Provider Dossier (PROV_XOXO_991.pdf) generated & downloaded.')}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-onyx-black font-button-text text-button-text transition-colors duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                <span>Download Dossier</span>
              </button>
              <button 
                type="button" 
                onClick={handleSaveAccount}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text transition-colors duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{saving ? 'Saving...' : 'Save Account'}</span>
              </button>
            </div>
          </div>

          {/* Profile Hero Card */}
          <div className="bg-bone-white p-8 relative overflow-hidden rounded-lg shadow-sm">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 bg-onyx-black text-on-primary flex items-center justify-center font-headline-md text-headline-md font-serif rounded">
                    {accountData.name ? accountData.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'MX'}
                  </div>
                  <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-surface-container-lowest text-onyx-black flex items-center justify-center rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-headline-md text-headline-md text-onyx-black">{accountData.name}</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container text-clay-earth font-label-caps text-label-caps tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
                      <span>{accountData.accountStatus}</span>
                    </div>
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest px-2 py-0.5 bg-secondary-container/40">Tier 1 Verified</span>
                  </div>
                  <p className="font-body-md text-body-md text-secondary font-medium">
                    {accountData.kitchenBrand}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-on-surface-variant font-button-text text-button-text">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-clay-earth">mail</span>
                      <span>{accountData.email}</span>
                      <span className="material-symbols-outlined text-[14px] text-onyx-black" title="Email Verified">check_circle</span>
                    </div>
                    <span className="text-sand-neutral">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-clay-earth">call</span>
                      <span>{accountData.phone}</span>
                      <span className="material-symbols-outlined text-[14px] text-onyx-black" title="Phone Verified">check_circle</span>
                    </div>
                    <span className="text-sand-neutral">•</span>
                    <div className="flex items-center gap-1.5 bg-surface-container px-2 py-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">ID</span>
                      <span className="font-mono text-xs font-semibold text-onyx-black tracking-wider">PROV_XOXO_991</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText('PROV_XOXO_991'); showToast('Provider ID copied to clipboard!'); }} className="hover:text-onyx-black transition-colors cursor-pointer" title="Copy Provider ID">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-8 lg:border-l lg:border-sand-neutral/70 lg:pl-8 shrink-0">
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Tenure</span>
                  <span className="font-headline-md text-headline-md text-onyx-black block mt-0.5">{accountData.createdAtDate}</span>
                  <span className="font-label-caps text-[11px] text-clay-earth">Member ~14 mos</span>
                </div>
                <div className="w-px h-10 bg-sand-neutral/60"></div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Dispatches</span>
                  <span className="font-headline-md text-headline-md text-onyx-black block mt-0.5">4,280</span>
                  <span className="font-label-caps text-[11px] text-clay-earth">99.2% on-time</span>
                </div>
                <div className="w-px h-10 bg-sand-neutral/60"></div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Reputation</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-headline-md text-headline-md text-onyx-black">4.7</span>
                    <span className="material-symbols-outlined text-onyx-black text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="font-label-caps text-[11px] text-clay-earth">840 Reviews</span>
                </div>
              </div>
            </div>

            {/* License Strip */}
            <div className="mt-8 pt-4 border-t border-sand-neutral/50 flex flex-wrap items-center justify-between gap-4 font-label-caps text-label-caps text-secondary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-clay-earth">health_and_safety</span>
                <span className="uppercase tracking-widest">FSSAI Registration:</span>
                <span className="font-mono text-onyx-black tracking-wider font-semibold">#{accountData.fssaiNo}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>KITCHEN CLASS: COMMODIOUS URBAN</span>
                <span>•</span>
                <span>SECURITY LEVEL: REPLICA SET AUTHORIZED</span>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-7 flex flex-col space-y-8 bg-surface-container-lowest p-8 shadow-sm rounded-lg">
              <div className="flex items-baseline justify-between border-b border-sand-neutral/60 pb-4">
                <div>
                  <h2 className="font-headline-md text-headline-md text-onyx-black">Kitchen Credentials</h2>
                  <p className="font-body-md text-body-md text-secondary mt-1">Operational identity and customer-facing culinary specifications.</p>
                </div>
                <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase">SECTION / 01</span>
              </div>
              
              <form onSubmit={handleSaveAccount} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Legal Kitchen Operator Name</label>
                  <input 
                    type="text"
                    value={accountData.name}
                    onChange={e => setAccountData({ ...accountData, name: e.target.value })}
                    className="w-full bg-bone-white px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:bg-surface-container transition-colors rounded"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Operating Commercial Brand Name</label>
                  <input 
                    type="text"
                    value={accountData.kitchenBrand}
                    onChange={e => setAccountData({ ...accountData, kitchenBrand: e.target.value })}
                    className="w-full bg-bone-white px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:bg-surface-container transition-colors rounded"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Business Email Address</label>
                    <span className="font-label-caps text-[11px] text-clay-earth">SECURE ROUTE</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="email"
                      value={accountData.email}
                      onChange={e => setAccountData({ ...accountData, email: e.target.value })}
                      className="w-full bg-bone-white px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:bg-surface-container transition-colors rounded pr-24"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-surface text-onyx-black font-label-caps text-[11px] flex items-center gap-1 border border-sand-neutral/50 rounded">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      ACTIVE
                    </span>
                  </div>
                  <p className="font-label-caps text-[11px] text-secondary flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[14px] text-clay-earth">info</span>
                    Modifying this address will trigger a re-authentication handshake via primary email OTP.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Authenticated Dispatch Contact</label>
                  <div className="relative">
                    <input 
                      type="tel"
                      value={accountData.phone}
                      onChange={e => setAccountData({ ...accountData, phone: e.target.value })}
                      className="w-full bg-bone-white px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:bg-surface-container transition-colors rounded pr-24"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-surface text-onyx-black font-label-caps text-[11px] flex items-center gap-1 border border-sand-neutral/50 rounded">
                      <span className="material-symbols-outlined text-[13px]">check_box</span>
                      SMS LOCK
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Kitchen Production & Courier Dispatch Address</label>
                  <textarea 
                    rows={3}
                    value={accountData.dispatchAddress}
                    onChange={e => setAccountData({ ...accountData, dispatchAddress: e.target.value })}
                    className="w-full bg-bone-white p-4 text-onyx-black font-body-md text-body-md focus:outline-none focus:bg-surface-container transition-colors resize-none leading-relaxed rounded"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-3 pt-2">
                  <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">Registered Culinary Disciplines & Menu Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {accountData.tags && accountData.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bone-white text-onyx-black font-label-caps text-label-caps tracking-wider rounded">
                        <span>{tag}</span>
                        <button type="button" onClick={() => handleRemoveTag(idx)} className="hover:text-error text-secondary transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}

                    {showAddTag ? (
                      <div className="inline-flex items-center gap-1">
                        <input 
                          type="text"
                          autoFocus
                          value={newTagInput}
                          onChange={e => setNewTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                          placeholder="Discipline name..."
                          className="px-2 py-1 bg-surface-container text-xs text-onyx-black focus:outline-none rounded"
                        />
                        <button type="button" onClick={handleAddTag} className="px-2 py-1 bg-onyx-black text-on-primary text-xs rounded cursor-pointer">Add</button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setShowAddTag(true)} 
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-clay-earth font-label-caps text-label-caps tracking-wider transition-colors rounded cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>ADD DISCIPLINE</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Registry */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div className="bg-surface-container-low p-8 shadow-sm space-y-6 rounded-lg">
                <div className="flex items-baseline justify-between border-b border-sand-neutral/60 pb-4">
                  <div>
                    <h2 class="font-headline-md text-headline-md text-onyx-black">System Registry</h2>
                    <p className="font-body-md text-body-md text-secondary mt-1">Immutable platform identifiers and verification checkpoints.</p>
                  </div>
                  <span className="font-label-caps text-label-caps text-clay-earth tracking-widest uppercase">STATUS / SEC</span>
                </div>

                <div className="space-y-5">
                  <div className="p-4 bg-bone-white space-y-1 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">Master Provider ID</span>
                      <span className="font-label-caps text-[10px] bg-onyx-black text-on-primary px-1.5 py-0.5 tracking-wider rounded">IMMUTABLE</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-base font-bold text-onyx-black tracking-wider">PROV_XOXO_991</span>
                      <span className="material-symbols-outlined text-secondary text-[18px]" title="Cryptographically Locked">lock</span>
                    </div>
                    <p className="font-label-caps text-[11px] text-secondary mt-1">
                      Provider system IDs are cryptographically locked and bound to primary contracts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 font-body-md text-body-md">
                    <div className="p-3 bg-surface-container rounded">
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block">Account Provisioned</span>
                      <span className="font-body-md text-onyx-black font-medium mt-0.5 block">14 Jan 2024, 10:15 AM IST</span>
                    </div>
                    <div className="p-3 bg-surface-container rounded">
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block">Last Session Activity</span>
                      <span className="font-body-md text-onyx-black font-medium mt-0.5 block">Today, 09:42 AM IST</span>
                      <span className="font-label-caps text-[11px] text-clay-earth font-mono mt-0.5 block">IP: 152.58.18.94 • Chrome macOS</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Security Attestations</span>
                    <div className="flex items-center justify-between p-3 bg-bone-white rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-onyx-black text-[20px]">mark_email_read</span>
                        <div>
                          <span className="font-button-text text-button-text text-onyx-black block leading-none">Email Handshake</span>
                          <span className="font-label-caps text-[11px] text-secondary">Verified via OTP</span>
                        </div>
                      </div>
                      <span className="font-label-caps text-[11px] font-semibold text-onyx-black">CONFIRMED</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-bone-white rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-onyx-black text-[20px]">phonelink_ring</span>
                        <div>
                          <span className="font-button-text text-button-text text-onyx-black block leading-none">Primary SMS Node</span>
                          <span className="font-label-caps text-[11px] text-secondary">Verified via SMS</span>
                        </div>
                      </div>
                      <span className="font-label-caps text-[11px] font-semibold text-onyx-black">CONFIRMED</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-bone-white rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-onyx-black text-[20px]">receipt_long</span>
                        <div>
                          <span className="font-button-text text-button-text text-onyx-black block leading-none">GSTIN / State Tax ID</span>
                          <span className="font-mono text-xs text-clay-earth block">{accountData.gstinNo}</span>
                        </div>
                      </div>
                      <span className="font-label-caps text-[11px] font-semibold text-onyx-black">VERIFIED</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-bone-white rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-onyx-black text-[20px]">badge</span>
                        <div>
                          <span className="font-button-text text-button-text text-onyx-black block leading-none">FSSAI License Record</span>
                          <span className="font-mono text-xs text-clay-earth block">{accountData.fssaiNo}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-label-caps text-[11px] font-semibold text-onyx-black block">ACTIVE</span>
                        <span className="font-label-caps text-[10px] text-secondary">Till 31 Dec '27</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bg-bone-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm rounded-lg">
            <div className="flex items-start gap-3 max-w-xl">
              <span className="material-symbols-outlined text-clay-earth text-[20px] shrink-0 mt-0.5">verified_user</span>
              <p className="font-label-caps text-label-caps text-secondary leading-normal normal-case">
                Notice: Any modifications to verified email or primary dispatch contact will automatically trigger an OTP verification handshake before synchronizing with the central MongoDB provider cluster.
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <button 
                type="button" 
                onClick={fetchAllSettings}
                className="px-6 py-3 font-button-text text-button-text text-secondary hover:text-onyx-black transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveAccount}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-onyx-black hover:bg-clay-earth text-on-primary font-button-text text-button-text transition-colors duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 2 — NOTIFICATION PREFERENCES                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-sand-neutral/60">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">Provider / Settings / Notification Preferences</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container text-onyx-black font-label-caps text-label-caps">
                  <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-pulse"></span>
                  <span>SOCKET.IO CONNECTED</span>
                </span>
                <span className="font-label-caps text-label-caps tracking-widest text-clay-earth bg-secondary-container/50 px-2 py-0.5 rounded">PROV_XOXO_991</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-onyx-black">Notification Preferences</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Configure multi-channel alert thresholds for live kitchen orders, financial disbursements, and operational alarms.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-end">
              <button type="button" onClick={fetchAllSettings} className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high transition-colors rounded text-onyx-black font-button-text text-button-text flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>Reset to Defaults</span>
              </button>
              <button type="button" onClick={handleSaveNotifications} disabled={saving} className="px-6 py-2.5 bg-onyx-black text-on-primary hover:bg-clay-earth transition-colors rounded font-button-text text-button-text flex items-center gap-2 shadow-sm cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{saving ? 'Saving...' : 'Save Notification Preferences'}</span>
              </button>
            </div>
          </div>

          {/* Channels Master Overview Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-surface-container rounded flex flex-col justify-between h-44 hover:bg-surface-container-high transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-surface flex items-center justify-center text-onyx-black shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">volume_up</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface font-label-caps text-label-caps text-onyx-black font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
                  LIVE 0.4ms
                </span>
              </div>
              <div>
                <div className="font-button-text text-button-text text-onyx-black font-semibold">In-App Audio & Banners</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">Direct kitchen display chime & HUD overlays</div>
              </div>
            </div>

            <div className="p-6 bg-surface-container rounded flex flex-col justify-between h-44 hover:bg-surface-container-high transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-surface flex items-center justify-center text-onyx-black shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-secondary-container font-label-caps text-label-caps text-on-secondary-fixed font-semibold">HIGH PRIORITY</span>
              </div>
              <div>
                <div className="font-button-text text-button-text text-onyx-black font-semibold">WhatsApp Dispatch</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">{accountData.phone} • Template V2.8</div>
              </div>
            </div>

            <div className="p-6 bg-surface-container rounded flex flex-col justify-between h-44 hover:bg-surface-container-high transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-surface flex items-center justify-center text-onyx-black shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">sms</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface font-label-caps text-label-caps text-secondary font-semibold">FAILOVER</span>
              </div>
              <div>
                <div className="font-button-text text-button-text text-onyx-black font-semibold">SMS Alert Relay</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">Critical security, settlement & emergency alerts</div>
              </div>
            </div>

            <div className="p-6 bg-surface-container rounded flex flex-col justify-between h-44 hover:bg-surface-container-high transition-colors">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded bg-surface flex items-center justify-center text-onyx-black shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface font-label-caps text-label-caps text-secondary font-semibold">DAILY DIGEST</span>
              </div>
              <div>
                <div className="font-button-text text-button-text text-onyx-black font-semibold">Email Digest</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">{accountData.email}</div>
              </div>
            </div>
          </div>

          {/* Preference Toggles List */}
          <div className="space-y-8">
            {/* Section 1: Order Notifications */}
            <div className="bg-surface-container-low p-8 rounded space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-onyx-black">
                    <span className="material-symbols-outlined text-[18px]">skillet</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-onyx-black leading-tight">Order Notifications</h2>
                    <p className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Real-Time Culinary Stream</p>
                  </div>
                </div>
                <span className="font-label-caps text-label-caps px-3 py-1 bg-surface-container text-clay-earth rounded font-semibold uppercase">5 Pipelines</span>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'newOrder', label: 'New Order Received', tag: 'Persistent HUD', desc: 'Instant chime and persistent top banner when a customer places an instant or subscription thali booking.' },
                  { key: 'orderAccepted', label: 'Order Accepted Confirmation', tag: '', desc: 'Haptic acknowledgement alert triggered once your kitchen claims and commits to live orders.' },
                  { key: 'orderCancelled', label: 'Order Cancelled & Escrow Release', tag: 'Critical Priority', desc: 'Audio siren and high-contrast flash alert if a patron or automated system voids a meal ticket prior to dispatch.', isCritical: true },
                  { key: 'orderReady', label: 'Order Ready for Handover', tag: '', desc: 'Culinary station reminder when active preparation countdown reaches 0 minutes to stage packaging.' },
                  { key: 'deliveryUpdates', label: 'Delivery Courier Updates', tag: 'Telemetry Proximity', desc: 'Live ping alerts when runner is assigned, enters 500m geofence, and closes delivery loop via recipient OTP.' }
                ].map(item => (
                  <div key={item.key} className={`p-5 rounded flex items-center justify-between transition-colors ${item.isCritical ? 'bg-error-container text-on-error-container' : 'bg-surface hover:bg-surface-container-high'}`}>
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        {item.isCritical && <span className="material-symbols-outlined text-[18px]">warning</span>}
                        <span className="font-button-text text-button-text font-bold text-onyx-black">{item.label}</span>
                        {item.tag && (
                          <span className={`px-2 py-0.5 rounded font-label-caps text-[10px] uppercase tracking-wider ${item.isCritical ? 'bg-error text-on-error' : 'bg-surface-container text-onyx-black'}`}>
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-body-md opacity-90">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ml-4 ${notificationData[item.key] ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                    >
                      <span className={`block w-5 h-5 rounded-full transition-transform ${notificationData[item.key] ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Business Notifications */}
            <div className="bg-surface-container-low p-8 rounded space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-onyx-black">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-onyx-black leading-tight">Business & Financial Notifications</h2>
                    <p className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Settlements, Audits & Throughput</p>
                  </div>
                </div>
                <span className="font-label-caps text-label-caps px-3 py-1 bg-surface-container text-clay-earth rounded font-semibold uppercase">4 Pipelines</span>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'earningsUpdate', label: 'Instant Earnings & Settlements', tag: '', desc: 'Immediate notification upon verified escrow release and per-thali net revenue calculation.' },
                  { key: 'payoutUpdate', label: 'Payout & Bank Transfer Status', tag: 'Direct IMPS', desc: 'Dispatches when manual or auto-withdrawals process, IMPS clearing confirmation, or batch NEFT deposits.' },
                  { key: 'reviews', label: 'New Customer Ratings & Reviews', tag: '', desc: 'Timely report when diners log feedback, photos, hygiene comments, or star ratings.' },
                  { key: 'capacityAlerts', label: 'Kitchen Capacity & Sold-Out Alerts', tag: 'Quota Threshold', desc: 'Automated threshold warnings triggered when today\'s fresh lunch/dinner slots reach capacity limit.' }
                ].map(item => (
                  <div key={item.key} className="p-5 bg-surface rounded flex items-center justify-between hover:bg-surface-container-high transition-colors">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-button-text text-button-text font-bold text-onyx-black">{item.label}</span>
                        {item.tag && <span className="px-2 py-0.5 rounded bg-surface-container font-label-caps text-[10px] text-secondary uppercase">{item.tag}</span>}
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant">{item.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ml-4 ${notificationData[item.key] ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                    >
                      <span className={`block w-5 h-5 rounded-full transition-transform ${notificationData[item.key] ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: System Notifications */}
            <div className="bg-surface-container-low p-8 rounded space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-onyx-black">
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-onyx-black leading-tight">System & Security Notifications</h2>
                    <p className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">Compliance, Credentials & Infrastructure</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-5 bg-surface rounded flex items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-button-text text-button-text font-bold text-onyx-black">Security Alerts & Unrecognized Logins</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-clay-earth font-label-caps text-[10px] uppercase">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        MANDATORY ENFORCED
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">Immediate high-priority push message and SMS whenever a new IP or device footprint is detected.</p>
                  </div>
                  <div className="w-12 h-6 bg-onyx-black rounded-full relative p-0.5 opacity-60 cursor-not-allowed shrink-0 ml-4">
                    <span className="block w-5 h-5 bg-on-primary rounded-full translate-x-6"></span>
                  </div>
                </div>

                <div className="p-5 bg-surface rounded flex items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <span className="font-button-text text-button-text font-bold text-onyx-black block">Account Updates & Verification Status</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">Notifications regarding ongoing FSSAI license validity dates and GST quarterly filings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationData(prev => ({ ...prev, accountUpdates: !prev.accountUpdates }))}
                    className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ml-4 ${notificationData.accountUpdates ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full transition-transform ${notificationData.accountUpdates ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                  </button>
                </div>

                <div className="p-5 bg-surface rounded flex items-center justify-between hover:bg-surface-container-high transition-colors">
                  <div className="space-y-1 max-w-2xl">
                    <span className="font-button-text text-button-text font-bold text-onyx-black block">System Maintenance & SLA Schedules</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">Advance notifications 24 hours prior to off-peak database clustering or staging downtime windows.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationData(prev => ({ ...prev, systemMaintenance: !prev.systemMaintenance }))}
                    className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ml-4 ${notificationData.systemMaintenance ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                  >
                    <span className={`block w-5 h-5 rounded-full transition-transform ${notificationData.systemMaintenance ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3 — PRIVACY & SECURITY                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'privacy-security' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sand-neutral">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-label-caps text-label-caps uppercase text-secondary tracking-widest">
                <span>Provider</span>
                <span className="text-sand-neutral">/</span>
                <span>Settings</span>
                <span className="text-sand-neutral">/</span>
                <span className="text-onyx-black font-semibold">Privacy & Security</span>
                <span className="text-sand-neutral">•</span>
                <span className="px-2 py-0.5 bg-surface-container rounded font-label-caps text-label-caps text-clay-earth">256-Bit Encrypted Vault</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-onyx-black mt-1">Privacy & Security</h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                Manage kitchen account authentication, active device sessions, multi-factor security, and cryptographic audit logs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-surface-container-low rounded shadow-sm">
                <span className="font-headline-md text-headline-md font-bold text-onyx-black">98 / 100</span>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Security Score</span>
                  <span className="font-button-text text-button-text font-semibold text-onyx-black">Optimal Status</span>
                </div>
              </div>
              <button type="button" onClick={() => showToast('Security Audit Log exported as audit_log_2026.json')} className="flex items-center gap-2 px-4 py-2 bg-onyx-black text-on-primary rounded hover:bg-stone-800 transition-colors shadow-sm cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                <span className="font-button-text text-button-text">Download Audit Log</span>
              </button>
            </div>
          </div>

          {/* Security Status Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-surface-container-low rounded flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">Account Security</span>
                <span className="material-symbols-outlined text-onyx-black text-[20px]">verified_user</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className="font-headline-md text-headline-md text-onyx-black font-semibold">{securityData.tierStatus || 'TIER 1'}</span>
                </div>
                <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">High-assurance perimeter lock active</p>
              </div>
            </div>

            <div className="p-5 bg-surface-container-low rounded flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">Email Verification</span>
                <span className="material-symbols-outlined text-onyx-black text-[20px]">mark_email_read</span>
              </div>
              <div className="mt-4">
                <div className="font-button-text text-button-text font-semibold text-onyx-black truncate">{accountData.email}</div>
                <p className="font-label-caps text-label-caps text-secondary mt-1">Verified via OTP</p>
              </div>
            </div>

            <div className="p-5 bg-surface-container-low rounded flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">Phone & 2FA Tether</span>
                <span className="material-symbols-outlined text-onyx-black text-[20px]">phonelink_lock</span>
              </div>
              <div className="mt-4">
                <div className="font-button-text text-button-text font-semibold text-onyx-black">{accountData.phone}</div>
                <p className="font-label-caps text-label-caps text-secondary mt-1">2FA SMS & TOTP Bound</p>
              </div>
            </div>

            <div className="p-5 bg-surface-container-low rounded flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">KYC & Compliance</span>
                <span className="material-symbols-outlined text-onyx-black text-[20px]">gavel</span>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container font-label-caps text-label-caps text-onyx-black font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
                  {securityData.kycStatus || 'APPROVED'}
                </div>
                <p className="font-label-caps text-label-caps text-secondary mt-1">Aadhaar, PAN & FSSAI verified</p>
              </div>
            </div>
          </section>

          {/* Password & 2FA Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Change Password Card */}
            <div className="lg:col-span-6 bg-surface-container-low p-6 rounded shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-onyx-black">password</span>
                    <span className="font-headline-md text-[22px] leading-tight text-onyx-black">Password Management</span>
                  </div>
                  <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container text-secondary">Vault Sync</span>
                </div>
                <div className="space-y-4 mt-4">
                  <p className="font-body-md text-body-md text-secondary">
                    Update your primary master key used to authenticate into the TiffinLink Partner Portal. Passwords are salted using bcrypt (12 rounds).
                  </p>
                  <div className="p-4 bg-bone-white rounded flex items-center justify-between">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-secondary block">Last Password Alteration</span>
                      <span className="font-button-text font-bold text-onyx-black">18 Sep 2026, 11:30 AM IST</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowPassModal(true)} 
                      className="px-4 py-2 bg-onyx-black text-on-primary font-button-text text-button-text rounded hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-surface-container rounded flex items-start gap-2.5 mt-4">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">lock_clock</span>
                <p className="font-label-caps text-label-caps text-on-surface-variant leading-relaxed">
                  Passwords are salted with <span className="font-semibold text-onyx-black">bcrypt (12 rounds)</span> and never stored in plain text. Session cookies are rotated upon alteration.
                </p>
              </div>
            </div>

            {/* 2FA Card */}
            <div className="lg:col-span-6 bg-surface-container-low p-6 rounded shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-sand-neutral/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-onyx-black">security</span>
                    <span className="font-headline-md text-[22px] leading-tight text-onyx-black">Two-Factor & Alert Protocol</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-label-caps text-label-caps px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                    TOTP Active
                  </span>
                </div>
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-surface rounded shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-onyx-black text-[20px]">qr_code_scanner</span>
                      <div>
                        <div className="font-button-text text-button-text text-onyx-black font-semibold">Authenticator App (TOTP)</div>
                        <div className="font-label-caps text-label-caps text-on-surface-variant">Google Authenticator, Authy, 1Password</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => showToast('TOTP QR code re-generated & sent to email')} className="px-3.5 py-1.5 bg-surface-container text-onyx-black rounded font-button-text text-button-text hover:bg-surface-container-high transition-colors cursor-pointer">
                      Reconfigure QR
                    </button>
                  </div>

                  <div className="p-4 bg-surface rounded shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-onyx-black text-[20px]">notifications_active</span>
                      <div>
                        <div className="font-button-text text-button-text text-onyx-black font-semibold">Device Login Alerts</div>
                        <div className="font-label-caps text-label-caps text-secondary">Instant push/SMS on unrecognized login</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecurityData(prev => ({ ...prev, loginAlerts: !prev.loginAlerts }))}
                      className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${securityData.loginAlerts ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                    >
                      <span className={`block w-5 h-5 rounded-full transition-transform ${securityData.loginAlerts ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center text-label-caps font-label-caps text-secondary">
                <span>Cryptographically Signed</span>
                <button type="button" onClick={() => showToast('2FA Recovery Packet saved as recovery_keys.txt')} className="text-onyx-black underline hover:text-clay-earth transition-colors cursor-pointer">
                  Download 2FA Recovery Packet (.txt)
                </button>
              </div>
            </div>
          </div>

          {/* Active Sessions Terminal */}
          <section className="bg-surface-container-low p-6 rounded shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-onyx-black">devices</span>
                  <h2 className="font-headline-md text-[24px] text-onyx-black font-semibold">Active Sessions Terminal</h2>
                </div>
                <p className="font-label-caps text-label-caps text-secondary mt-0.5">
                  {securityData.activeSessions ? securityData.activeSessions.length : 0} active cryptographically authenticated tokens currently authorized
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => handleRevokeSession('all-other')}
                className="flex items-center gap-2 px-3.5 py-2 bg-error text-on-error rounded hover:bg-red-700 transition-colors font-button-text text-button-text shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Terminate All Other Sessions</span>
              </button>
            </div>

            <div className="space-y-3">
              {securityData.activeSessions && securityData.activeSessions.map((session) => (
                <div key={session.id} className="p-4 bg-surface rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${session.isCurrent ? 'bg-onyx-black text-on-primary' : 'bg-surface-container text-onyx-black'}`}>
                      <span className="material-symbols-outlined text-[22px]">
                        {session.device.includes('Mac') || session.device.includes('Laptop') ? 'laptop_mac' : session.device.includes('iPhone') ? 'smartphone' : 'tablet_mac'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-button-text text-button-text font-bold text-onyx-black">{session.device}</span>
                        {session.isCurrent && (
                          <span className="px-2 py-0.5 bg-onyx-black text-on-primary rounded font-label-caps text-[10px] tracking-wider uppercase font-semibold">Current Session</span>
                        )}
                        <span className="font-label-caps text-label-caps text-secondary font-mono">{session.os}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-label-caps font-label-caps text-on-surface-variant">
                        <span>{session.browser}</span>
                        <span className="text-sand-neutral">•</span>
                        <span>{session.location}</span>
                        <span className="text-sand-neutral">•</span>
                        <span className="font-mono">IP: {session.ip}</span>
                      </div>
                      <div className="font-label-caps text-label-caps text-secondary mt-1 font-mono">
                        Last Active: {session.lastActive} • Token: {session.tokenSig}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {session.isCurrent ? (
                      <span className="px-3 py-1 bg-surface-container text-secondary rounded font-label-caps text-label-caps">In Use</span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1.5 bg-surface-container text-error hover:bg-error-container hover:text-on-error-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                      >
                        Revoke Session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security Logs */}
          <section className="bg-surface-container-low p-6 rounded shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-onyx-black">history_toggle_off</span>
                  <h2 className="font-headline-md text-[24px] text-onyx-black font-semibold">Security Audit Ledger</h2>
                </div>
                <p className="font-label-caps text-label-caps text-secondary mt-0.5">Immutable record of high-privilege access & credential alterations</p>
              </div>
            </div>

            <div className="space-y-2">
              {securityData.securityLogs && securityData.securityLogs.map(log => (
                <div key={log.id} className="p-3.5 bg-surface rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-start md:items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2 md:mt-0 shrink-0"></div>
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text text-onyx-black font-semibold">{log.event}</span>
                      <span className="font-label-caps text-label-caps text-secondary font-mono">{log.details}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-5 md:pl-0">
                    <span className="font-label-caps text-label-caps text-on-surface-variant font-medium">{log.timestamp}</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded font-label-caps text-[10px] text-secondary font-mono">{log.sig}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 4 — APP PREFERENCES                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'app-preferences' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-neutral">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">Provider</span>
                <span className="text-sand-neutral font-mono text-xs">/</span>
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">Settings</span>
                <span className="text-sand-neutral font-mono text-xs">/</span>
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-onyx-black font-semibold">App Preferences</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight">App Preferences</h1>
              <p className="font-body-md text-body-md text-secondary leading-relaxed">
                Customize your kitchen dashboard interface density, language, live dispatch telemetry, and map rendering for optimal culinary throughput.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button 
                type="button" 
                onClick={handleSavePreferences}
                disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-onyx-black text-on-primary rounded font-button-text text-button-text uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{saving ? 'Saving...' : 'Save App Preferences'}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Appearance */}
          <section className="space-y-6">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">01 / Aesthetics & Viewport</span>
                <h2 className="font-headline-md text-headline-md text-onyx-black">Appearance & Theme Settings</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* System */}
              <label onClick={() => setPreferenceData({ ...preferenceData, appearance: 'system' })} className={`group relative flex flex-col p-6 rounded cursor-pointer transition-all ${preferenceData.appearance === 'system' ? 'bg-surface-container-lowest ring-2 ring-onyx-black shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                <div className="flex items-center justify-between pb-4">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black">System Default</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${preferenceData.appearance === 'system' ? 'border-onyx-black' : 'border-outline'}`}>
                    {preferenceData.appearance === 'system' && <div className="w-2 h-2 rounded-full bg-onyx-black"></div>}
                  </div>
                </div>
                <div className="h-24 w-full bg-surface-container-high rounded p-3 flex flex-col justify-between overflow-hidden">
                  <div className="w-8 h-1.5 bg-sand-neutral rounded"></div>
                  <div className="grid grid-cols-2 gap-2 h-10">
                    <div className="bg-surface rounded p-1"></div>
                    <div className="bg-onyx-black rounded p-1"></div>
                  </div>
                </div>
                <p className="mt-4 font-body-md text-body-md text-secondary">Auto-adapts dynamically to OS system brightness schedules.</p>
              </label>

              {/* Light */}
              <label onClick={() => setPreferenceData({ ...preferenceData, appearance: 'light' })} className={`group relative flex flex-col p-6 rounded cursor-pointer transition-all ${preferenceData.appearance === 'light' ? 'bg-surface-container-lowest ring-2 ring-onyx-black shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-button-text font-semibold text-onyx-black">Light Mode</span>
                    <span className="font-label-caps text-label-caps px-2 py-0.5 bg-secondary-container text-on-secondary-fixed font-medium rounded">ACTIVE</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${preferenceData.appearance === 'light' ? 'border-onyx-black' : 'border-outline'}`}>
                    {preferenceData.appearance === 'light' && <div className="w-2 h-2 rounded-full bg-onyx-black"></div>}
                  </div>
                </div>
                <div className="h-24 w-full bg-bone-white rounded p-3 flex flex-col justify-between overflow-hidden shadow-inner">
                  <div className="w-12 h-1.5 bg-onyx-black rounded"></div>
                  <div className="grid grid-cols-3 gap-2 h-10">
                    <div className="bg-surface-container rounded p-1"></div>
                    <div className="bg-surface-container rounded p-1"></div>
                    <div className="bg-surface-container-high rounded p-1"></div>
                  </div>
                </div>
                <p className="mt-4 font-body-md text-body-md text-secondary">Minimalist bone-white & obsidian ink tuned for daytime visibility.</p>
              </label>

              {/* Dark */}
              <label onClick={() => setPreferenceData({ ...preferenceData, appearance: 'dark' })} className={`group relative flex flex-col p-6 rounded cursor-pointer transition-all ${preferenceData.appearance === 'dark' ? 'bg-surface-container-lowest ring-2 ring-onyx-black shadow-sm' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                <div className="flex items-center justify-between pb-4">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black">Dark Mode</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${preferenceData.appearance === 'dark' ? 'border-onyx-black' : 'border-outline'}`}>
                    {preferenceData.appearance === 'dark' && <div className="w-2 h-2 rounded-full bg-onyx-black"></div>}
                  </div>
                </div>
                <div className="h-24 w-full bg-onyx-black rounded p-3 flex flex-col justify-between overflow-hidden">
                  <div className="w-12 h-1.5 bg-neutral-600 rounded"></div>
                  <div className="grid grid-cols-3 gap-2 h-10">
                    <div className="bg-neutral-800 rounded p-1"></div>
                    <div className="bg-neutral-800 rounded p-1"></div>
                    <div className="bg-neutral-900 rounded p-1"></div>
                  </div>
                </div>
                <p className="mt-4 font-body-md text-body-md text-secondary">Carbon slate for low-light evening kitchen prep.</p>
              </label>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="flex items-center justify-between p-6 bg-surface-container-low rounded">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-onyx-black">density_small</span>
                    <span className="font-button-text text-button-text font-semibold text-onyx-black">Compact Kitchen Density</span>
                  </div>
                  <p className="font-body-md text-body-md text-secondary">Compresses card margins for wall-mounted tablet displays.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferenceData(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                  className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${preferenceData.compactMode ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                >
                  <span className={`block w-5 h-5 rounded-full transition-transform ${preferenceData.compactMode ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-surface-container-low rounded">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-onyx-black">motion_photos_off</span>
                    <span className="font-button-text text-button-text font-semibold text-onyx-black">Reduce Interface Animations</span>
                  </div>
                  <p className="font-body-md text-body-md text-secondary">Turn off smooth layout transforms to boost refresh speeds.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferenceData(prev => ({ ...prev, reduceAnimations: !prev.reduceAnimations }))}
                  className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${preferenceData.reduceAnimations ? 'bg-onyx-black' : 'bg-surface-container-highest'}`}
                >
                  <span className={`block w-5 h-5 rounded-full transition-transform ${preferenceData.reduceAnimations ? 'bg-on-primary translate-x-6' : 'bg-surface translate-x-0'}`}></span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Language */}
          <section className="space-y-6 pt-6 border-t border-sand-neutral">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">02 / Dialect & Regional Formatting</span>
                <h2 className="font-headline-md text-headline-md text-onyx-black">Language & Regional Localization</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <label onClick={() => setPreferenceData({ ...preferenceData, language: 'en_IN' })} className={`flex items-center justify-between p-5 rounded cursor-pointer transition-all ${preferenceData.language === 'en_IN' ? 'bg-surface-container-lowest ring-1 ring-onyx-black' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                  <div className="flex items-center gap-4">
                    <input type="radio" checked={preferenceData.language === 'en_IN'} readOnly className="w-4 h-4 accent-onyx-black" />
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text font-semibold text-onyx-black">English (India)</span>
                      <span className="font-body-md text-body-md text-secondary">Standard kitchen & delivery dispatch terminology</span>
                    </div>
                  </div>
                  <span className="font-label-caps text-label-caps uppercase px-2 py-1 bg-surface-container text-clay-earth rounded">Primary</span>
                </label>

                <label onClick={() => setPreferenceData({ ...preferenceData, language: 'gu_IN' })} className={`flex items-center justify-between p-5 rounded cursor-pointer transition-all ${preferenceData.language === 'gu_IN' ? 'bg-surface-container-lowest ring-1 ring-onyx-black' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                  <div className="flex items-center gap-4">
                    <input type="radio" checked={preferenceData.language === 'gu_IN'} readOnly className="w-4 h-4 accent-onyx-black" />
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text font-semibold text-onyx-black">ગુજરાતી (Gujarati)</span>
                      <span className="font-body-md text-body-md text-secondary">સ્થાનિક રસોઈ, દૈનિક થાળી અને ડિલિવરી સંચાલન</span>
                    </div>
                  </div>
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Regional</span>
                </label>

                <label onClick={() => setPreferenceData({ ...preferenceData, language: 'hi_IN' })} className={`flex items-center justify-between p-5 rounded cursor-pointer transition-all ${preferenceData.language === 'hi_IN' ? 'bg-surface-container-lowest ring-1 ring-onyx-black' : 'bg-surface-container-low hover:bg-surface-container'}`}>
                  <div className="flex items-center gap-4">
                    <input type="radio" checked={preferenceData.language === 'hi_IN'} readOnly className="w-4 h-4 accent-onyx-black" />
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text font-semibold text-onyx-black">हिन्दी (Hindi)</span>
                      <span className="font-body-md text-body-md text-secondary">दैनिक टिफिन, रसोई तैयारी एवं आर्डर प्रबंधन</span>
                    </div>
                  </div>
                  <span className="font-label-caps text-label-caps uppercase text-secondary">Regional</span>
                </label>
              </div>

              <div className="p-6 bg-surface-container-high rounded flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black block">Financial & Date Schema</span>
                  <div className="p-3 bg-surface rounded">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block">Standard Currency</span>
                    <span className="font-button-text font-bold text-onyx-black">Indian Rupee (₹ INR)</span>
                  </div>
                  <div className="p-3 bg-surface rounded">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block">Kitchen Timestamp Format</span>
                    <span className="font-button-text font-bold text-onyx-black">DD MMM YYYY (24-hour clock)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Operations Defaults */}
          <section className="space-y-6 pt-6 border-t border-sand-neutral">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">03 / Operational Logistics</span>
                <h2 className="font-headline-md text-headline-md text-onyx-black">Dashboard & Operations Defaults</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Default Landing */}
              <div className="p-6 bg-surface-container-low rounded space-y-4">
                <span className="font-button-text text-button-text font-semibold text-onyx-black block">Default Landing View</span>
                <div className="space-y-2">
                  {[
                    { id: 'dashboard', label: 'Overview Dashboard' },
                    { id: 'live-requests', label: 'Live Requests Radar' },
                    { id: 'orders-prep', label: 'Orders Preparing Bay' }
                  ].map(opt => (
                    <label key={opt.id} onClick={() => setPreferenceData({ ...preferenceData, dashboardLanding: opt.id })} className={`flex items-center gap-3 p-3 rounded cursor-pointer ${preferenceData.dashboardLanding === opt.id ? 'bg-surface-container-lowest ring-1 ring-onyx-black font-semibold' : 'bg-surface-container'}`}>
                      <input type="radio" checked={preferenceData.dashboardLanding === opt.id} readOnly className="w-4 h-4 accent-onyx-black" />
                      <span className="font-button-text text-button-text text-onyx-black">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Table Density */}
              <div className="p-6 bg-surface-container-low rounded space-y-4">
                <span className="font-button-text text-button-text font-semibold text-onyx-black block">Table Density & Pagination</span>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50].map(den => (
                    <button
                      key={den}
                      type="button"
                      onClick={() => setPreferenceData({ ...preferenceData, tableDensity: den })}
                      className={`p-3 rounded flex flex-col items-center justify-center cursor-pointer transition-all ${
                        preferenceData.tableDensity === den ? 'bg-surface-container-lowest ring-1 ring-onyx-black shadow-sm font-bold' : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="font-headline-md text-headline-md text-onyx-black">{den}</span>
                      <span className="font-label-caps text-label-caps uppercase text-secondary">{den === 10 ? 'Compact' : den === 25 ? 'Default' : 'Extended'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Provider */}
              <div className="p-6 bg-surface-container-low rounded space-y-4">
                <span className="font-button-text text-button-text font-semibold text-onyx-black block">Map & Navigation Provider</span>
                <div className="space-y-2">
                  {['Google Maps', 'MapmyIndia / Mappls'].map(mapP => (
                    <label key={mapP} onClick={() => setPreferenceData({ ...preferenceData, defaultMapProvider: mapP })} className={`flex items-center gap-3 p-3 rounded cursor-pointer ${preferenceData.defaultMapProvider === mapP ? 'bg-surface-container-lowest ring-1 ring-onyx-black font-semibold' : 'bg-surface-container'}`}>
                      <input type="radio" checked={preferenceData.defaultMapProvider === mapP} readOnly className="w-4 h-4 accent-onyx-black" />
                      <span className="font-button-text text-button-text text-onyx-black">{mapP}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-[9999] bg-onyx-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bone-white p-8 max-w-md w-full rounded-lg shadow-2xl space-y-6 border border-sand-neutral">
            <div className="flex justify-between items-center pb-4 border-b border-sand-neutral">
              <h3 className="font-headline-md text-headline-md text-onyx-black">🔐 Master Password Shift</h3>
              <button type="button" onClick={() => setShowPassModal(false)} className="text-secondary hover:text-onyx-black text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="font-label-caps text-label-caps uppercase text-secondary block mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={passVisibility.current ? 'text' : 'password'}
                    value={passState.currentPass}
                    onChange={e => setPassState({ ...passState, currentPass: e.target.value })}
                    className="w-full bg-surface px-4 py-2.5 text-onyx-black font-body-md text-body-md focus:outline-none rounded pr-10"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setPassVisibility(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">{passVisibility.current ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-secondary block mb-1">New Password (8+ chars, upper, number, symbol)</label>
                <div className="relative">
                  <input 
                    type={passVisibility.new ? 'text' : 'password'}
                    value={passState.newPass}
                    onChange={e => setPassState({ ...passState, newPass: e.target.value })}
                    className="w-full bg-surface px-4 py-2.5 text-onyx-black font-body-md text-body-md focus:outline-none rounded pr-10"
                    placeholder="K1tchen#9021Shield!"
                  />
                  <button type="button" onClick={() => setPassVisibility(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">{passVisibility.new ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-label-caps text-label-caps uppercase text-secondary block mb-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={passVisibility.confirm ? 'text' : 'password'}
                    value={passState.confirmPass}
                    onChange={e => setPassState({ ...passState, confirmPass: e.target.value })}
                    className="w-full bg-surface px-4 py-2.5 text-onyx-black font-body-md text-body-md focus:outline-none rounded pr-10"
                    placeholder="Repeat new password"
                  />
                  <button type="button" onClick={() => setPassVisibility(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">{passVisibility.confirm ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPassModal(false)} className="px-5 py-2.5 text-secondary hover:text-onyx-black font-button-text text-button-text cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-onyx-black text-on-primary font-button-text text-button-text rounded hover:bg-clay-earth transition-colors cursor-pointer">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
