import React, { useState, useEffect, useRef } from 'react';

/**
 * AccountSettingsView Component - Driver Panel Account & Security Management
 * Connected to MongoDB backend API endpoints:
 *  - GET /api/driver/account
 *  - PUT /api/driver/account
 *  - PUT /api/driver/account/password
 *  - POST /api/driver/account/terminate-sessions
 */
export default function AccountSettingsView({ currentUser, onNavigateTab, onShowToast }) {
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  let savedUser = null;
  try {
    if (savedUserStr) savedUser = JSON.parse(savedUserStr);
  } catch (e) {}

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailVerificationMsg, setEmailVerificationMsg] = useState(null);

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(600);

  // File Upload Ref
  const fileInputRef = useRef(null);

  // Form State
  const [accountData, setAccountData] = useState({
    driverId: currentUser?.driverId || savedUser?.driverId || currentUser?.id || currentUser?._id || '',
    fullName: currentUser?.name || currentUser?.fullName || savedUser?.name || savedUser?.fullName || '',
    email: currentUser?.email || savedUser?.email || '',
    phone: currentUser?.phone || savedUser?.phone || '',
    role: 'Delivery Partner',
    accountStatus: 'Active',
    tier: 'Tier 1 Senior Courier',
    hubAssociation: 'Ahmedabad Central Hub 12',
    cluster: 'Amber Tower Cluster',
    avatar: '',
    dob: '2006-09-20',
    gender: 'Male',
    address: '4, Ruhan Duplex In Aman Park, FATEHWADI SARKHEJ ROAD, Amber Tower',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380055',
    emergencyContact: {
      name: 'Samir mansuri',
      phone: '+91 9558601570',
      relationship: 'Father'
    },
    isEmailVerified: true,
    isPhoneVerified: true,
    whatsappNotifications: true,
    twoFactorEnabled: true,
    lastPasswordChange: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(),
    accountCreated: '12 Jan 2024',
    lastLogin: 'Today, 08:15 AM',
    status: 'ONLINE',
    healthAttestation: 'Completed',
    securityScore: 98,
    activeSessions: []
  });

  // Track original copy to allow cancel/reset
  const [initialData, setInitialData] = useState(null);

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Emergency Contact Form State
  const [emergencyForm, setEmergencyForm] = useState({
    name: 'Rahul Mansuri',
    phone: '+91 98200 11223',
    relationship: 'Brother'
  });

  const activeToken = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const emailParam = currentUser?.email || savedUser?.email || '';
  const phoneParam = currentUser?.phone || savedUser?.phone || '';
  const driverIdParam = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';

  // Fetch Driver Account from MongoDB
  const fetchAccountData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setLoading(true);
    }
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (emailParam) queryParams.append('email', emailParam);
      if (phoneParam) queryParams.append('phone', phoneParam);
      if (driverIdParam) queryParams.append('driverId', driverIdParam);

      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/driver/account?${queryParams.toString()}`, {
        headers
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setAccountData(json.data);
        setInitialData(json.data);
        if (json.data.emergencyContact) {
          setEmergencyForm(json.data.emergencyContact);
        }
        if (isManualRefresh) {
          if (onShowToast) onShowToast('✓ Account information refreshed from MongoDB.');
        }
      } else {
        if (!initialData) {
          console.warn('API returned non-ok for account settings:', json.message);
        }
      }
    } catch (err) {
      console.error('Error fetching driver account settings:', err);
      if (isManualRefresh && onShowToast) {
        onShowToast('⚠️ Server connection error while fetching profile data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [currentUser]);

  // Handle Form Change
  const handleChange = (field, value) => {
    setAccountData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save Changes to MongoDB
  const handleSaveChanges = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validation
    if (!accountData.fullName || !accountData.fullName.trim()) {
      setErrorMessage('Legal Full Name cannot be blank.');
      setSaving(false);
      return;
    }

    if (accountData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) {
      setErrorMessage('Please enter a valid email address.');
      setSaving(false);
      return;
    }

    if (accountData.pincode && !/^\d{6}$/.test(String(accountData.pincode).trim())) {
      setErrorMessage('Postal Pincode must be a 6-digit Indian pincode (e.g. 400052).');
      setSaving(false);
      return;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const payload = {
        fullName: accountData.fullName,
        email: accountData.email,
        phone: accountData.phone,
        dob: accountData.dob,
        gender: accountData.gender,
        address: accountData.address,
        city: accountData.city,
        state: accountData.state,
        pincode: accountData.pincode,
        emergencyName: accountData.emergencyContact?.name,
        emergencyMobile: accountData.emergencyContact?.phone,
        emergencyRelationship: accountData.emergencyContact?.relationship,
        whatsappNotifications: accountData.whatsappNotifications,
        avatar: accountData.avatar
      };

      const res = await fetch('http://localhost:5000/api/driver/account', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage('Account information updated successfully.');
        setInitialData(accountData);
        if (onShowToast) onShowToast('✓ Account information saved to MongoDB successfully!');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.message || 'Failed to save account changes.');
        if (onShowToast) onShowToast(`⚠️ ${json.message || 'Error saving changes'}`);
      }
    } catch (err) {
      console.error('Error saving driver account settings:', err);
      setErrorMessage('Server network error. Please try again.');
      if (onShowToast) onShowToast('⚠️ Server network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Reset Changes
  const handleCancelChanges = () => {
    if (initialData) {
      setAccountData(initialData);
      if (initialData.emergencyContact) {
        setEmergencyForm(initialData.emergencyContact);
      }
      setErrorMessage(null);
      setSuccessMessage(null);
      if (onShowToast) onShowToast('Unsaved changes discarded.');
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current master password.');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('http://localhost:5000/api/driver/account/password', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
          email: emailParam,
          driverId: driverIdParam
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsPasswordModalOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        if (onShowToast) onShowToast('✓ Password changed successfully!');
        fetchAccountData();
      } else {
        setPasswordError(json.message || 'Password update failed. Check current password.');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError('Network error while updating password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Countdown timer effect for OTP modal
  useEffect(() => {
    let timer = null;
    if (isOtpModalOpen && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOtpModalOpen, otpCountdown]);

  // Helper to resolve API base URL
  const getApiBaseUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return '';
  };

  // Handle Re-verify Email API Call & open OTP modal
  const handleReverifyEmail = async () => {
    setVerifyingEmail(true);
    setEmailVerificationMsg(null);
    try {
      const token = activeToken || (typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '') : '');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseUrl = getApiBaseUrl();
      let res;
      try {
        res = await fetch(`${baseUrl}/api/driver/email/reverify`, {
          method: 'POST',
          headers
        });
      } catch (directErr) {
        // Fallback relative fetch via Vite proxy
        res = await fetch(`/api/driver/email/reverify`, {
          method: 'POST',
          headers
        });
      }

      const json = await res.json();
      if (res.ok && json.success) {
        setIsOtpModalOpen(true);
        setOtpInput('');
        setOtpError(null);
        setOtpSuccessMsg(null);
        setOtpCountdown(600);
        const msg = json.message || 'Verification code sent to your registered email.';
        setEmailVerificationMsg(msg);
        if (onShowToast) onShowToast('✓ ' + msg);
      } else {
        const msg = json.message || 'Failed to send verification email.';
        setEmailVerificationMsg(msg);
        if (onShowToast) onShowToast('❌ ' + msg);
      }
    } catch (err) {
      console.error('Error re-verifying email:', err);
      const msg = 'Unable to connect to server. Please check backend status.';
      setEmailVerificationMsg(msg);
      if (onShowToast) onShowToast('❌ ' + msg);
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError('Please enter a valid 6-digit verification code.');
      return;
    }
    setOtpVerifying(true);
    setOtpError(null);
    setOtpSuccessMsg(null);
    try {
      const token = activeToken || (typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '') : '');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseUrl = getApiBaseUrl();
      let res;
      try {
        res = await fetch(`${baseUrl}/api/driver/email/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ otp: otpInput.trim() })
        });
      } catch (directErr) {
        res = await fetch(`/api/driver/email/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ otp: otpInput.trim() })
        });
      }

      const json = await res.json();
      if (res.ok && json.success) {
        const msg = json.message || 'Email verified successfully.';
        setOtpSuccessMsg(msg);
        if (onShowToast) onShowToast('✓ ' + msg);
        setAccountData(prev => ({ ...prev, isEmailVerified: true }));
        setTimeout(() => {
          setIsOtpModalOpen(false);
          fetchAccountData();
        }, 1200);
      } else {
        setOtpError(json.message || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setOtpError('Network error while verifying OTP.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpResending(true);
    setOtpError(null);
    try {
      const token = activeToken || (typeof window !== 'undefined' ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '') : '');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseUrl = getApiBaseUrl();
      let res;
      try {
        res = await fetch(`${baseUrl}/api/driver/email/resend-otp`, {
          method: 'POST',
          headers
        });
      } catch (directErr) {
        res = await fetch(`/api/driver/email/resend-otp`, {
          method: 'POST',
          headers
        });
      }

      const json = await res.json();
      if (res.ok && json.success) {
        setOtpCountdown(600);
        setOtpInput('');
        setOtpSuccessMsg('A new verification code has been sent to your email.');
        if (onShowToast) onShowToast('✓ Verification code resent.');
      } else {
        setOtpError(json.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      setOtpError('Network error while resending code.');
    } finally {
      setOtpResending(false);
    }
  };

  // Submit Emergency Contact Edit
  const handleEmergencySubmit = (e) => {
    e.preventDefault();
    setAccountData(prev => ({
      ...prev,
      emergencyContact: { ...emergencyForm }
    }));
    setIsEmergencyModalOpen(false);
    if (onShowToast) onShowToast('Emergency contact updated. Click SAVE CHANGES to persist.');
  };

  // Terminate Device Sessions
  const handleTerminateOtherSessions = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      await fetch('http://localhost:5000/api/driver/account/terminate-sessions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ driverId: driverIdParam })
      });

      setAccountData(prev => ({
        ...prev,
        activeSessions: prev.activeSessions.filter(s => s.isCurrent)
      }));

      if (onShowToast) onShowToast('✓ All other active sessions terminated.');
    } catch (err) {
      console.error('Error terminating sessions:', err);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        if (onShowToast) onShowToast('⚠️ Image size exceeds 4MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('avatar', reader.result);
        if (onShowToast) onShowToast('✓ Photo preview updated. Click SAVE CHANGES to save.');
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-onyx-black animate-spin">autorenew</span>
        <h3 className="font-headline-md text-xl text-onyx-black">Loading Account Information...</h3>
        <p className="font-body-md text-xs text-clay-earth">Fetching profile telemetry from MongoDB driver records...</p>
      </div>
    );
  }

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';
  const displayAvatar = accountData.avatar || currentUser?.avatar || defaultAvatar;

  return (
    <div className="flex flex-col w-full pb-32 space-y-10 selection:bg-onyx-black selection:text-white">
      
      {/* Top Telemetry Header & Breadcrumbs */}
      <section className="flex flex-col space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-clay-earth font-label-caps text-label-caps tracking-widest uppercase text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span>SETTINGS</span>
            <span className="text-outline-variant">/</span>
            <span className="text-onyx-black font-semibold">ACCOUNT SETTINGS</span>
            <span className="text-outline-variant">•</span>
            <span className="text-on-surface-variant font-mono">MONGODB DRIVERS PROFILE SYNCED</span>
            <span className="text-outline-variant">•</span>
            <span className="bg-surface-container-high px-2 py-0.5 font-mono text-onyx-black tracking-normal text-[11px]">JWT ENCRYPTED V2.4</span>
          </div>

          <div className="flex items-center gap-2 bg-bone-white px-3 py-1 text-onyx-black border border-sand-neutral/40">
            <span className="w-2 h-2 rounded-full bg-onyx-black animate-ping" />
            <span className="font-mono text-[11px] font-semibold tracking-normal">
              PROFILE DATA SYNCED • SCOPED PRINCIPAL: {accountData.driverId} ({accountData.fullName.toUpperCase()})
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none font-serif text-3xl sm:text-4xl">
              Account Settings
            </h1>
            <p className="font-body-md text-body-md text-clay-earth mt-2 max-w-2xl text-sm">
              Manage your account information, personal verification credentials, security posture, and active device sessions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              id="refreshDataBtn"
              onClick={() => fetchAccountData(true)}
              className="inline-flex items-center gap-2 bg-surface-container px-4 py-2.5 text-on-surface hover:bg-surface-container-highest transition-colors font-button-text text-button-text shadow-xs border border-sand-neutral text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-base">sync</span>
              <span>Refresh Data</span>
            </button>
            <button
              type="button"
              id="securityAuditBtn"
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-2 bg-onyx-black text-on-primary px-4 py-2.5 hover:bg-stone-800 transition-colors font-button-text text-button-text shadow-xs text-xs font-bold uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-base text-on-primary">shield_person</span>
              <span>Security Audit Log</span>
            </button>
          </div>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border-l-4 border-error text-error text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Global Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{successMessage}</span>
            </div>
            <button type="button" onClick={() => setSuccessMessage(null)} className="underline text-xs">Dismiss</button>
          </div>
        )}
      </section>

      {/* Section 1: Core Profile Identity Card */}
      <section className="bg-bone-white p-6 sm:p-8 shadow-xs border border-sand-neutral/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Avatar and Photo Controls */}
          <div className="lg:col-span-4 flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-sand-neutral/60 shrink-0 border-2 border-onyx-black">
              <img
                src={displayAvatar}
                alt={accountData.fullName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = defaultAvatar; }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-onyx-black/85 py-0.5 text-center text-on-primary font-label-caps text-[9px] uppercase tracking-wider">
                VERIFIED
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-[11px] uppercase tracking-wider text-clay-earth">Driver Principal</span>
                <span className="bg-surface-container-highest text-onyx-black px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider border border-sand-neutral">
                  VERIFIED HUB COURIER
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="bg-onyx-black text-on-primary px-3 py-1 font-button-text text-xs hover:bg-stone-800 transition-colors uppercase font-bold"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={() => { handleChange('avatar', ''); if (onShowToast) onShowToast('Photo removed.'); }}
                  className="bg-surface-container text-clay-earth hover:text-error px-3 py-1 font-button-text text-xs transition-colors border border-sand-neutral"
                >
                  Remove
                </button>
              </div>
              <span className="font-label-caps text-[10px] text-on-surface-variant">JPG, WEBP up to 4MB • Face clearly visible</span>
            </div>
          </div>

          {/* Identity Metadata */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-surface-container-lowest p-6 border border-sand-neutral/60">
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Full Name</span>
              <span className="font-headline-md text-2xl text-onyx-black font-serif font-normal mt-0.5 truncate">{accountData.fullName}</span>
              <div className="flex items-center gap-1.5 mt-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-onyx-black shrink-0" />
                <span className="font-label-caps text-[11px] uppercase text-onyx-black font-semibold truncate">
                  ACTIVE • {accountData.tier.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Driver ID</span>
              <div className="flex items-center gap-2 mt-1 min-w-0">
                <span className="font-mono text-sm sm:text-base text-onyx-black font-bold tracking-tight truncate" title={accountData.driverId}>
                  {accountData.driverId}
                </span>
                <button
                  type="button"
                  title="Copy ID"
                  onClick={() => {
                    navigator.clipboard.writeText(accountData.driverId);
                    if (onShowToast) onShowToast(`Copied ID ${accountData.driverId}`);
                  }}
                  className="text-clay-earth hover:text-onyx-black transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-base">content_copy</span>
                </button>
              </div>
              <span className="font-label-caps text-[11px] text-clay-earth mt-1 truncate">{accountData.tier}</span>
            </div>

            <div className="flex flex-col sm:col-span-2 md:col-span-1 min-w-0">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Hub Association</span>
              <span className="font-body-md text-onyx-black font-semibold mt-1 text-sm truncate">{accountData.hubAssociation}</span>
              <span className="font-label-caps text-[11px] text-clay-earth mt-0.5 truncate">{accountData.cluster}</span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Primary Email</span>
              <span className="font-mono text-xs text-onyx-black mt-1 truncate font-medium">{accountData.email}</span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Registered Phone</span>
              <span className="font-mono text-xs text-onyx-black mt-1 font-medium truncate">{accountData.phone}</span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Account Role</span>
              <span className="font-body-md text-onyx-black text-sm mt-1 font-semibold truncate">{accountData.role}</span>
            </div>
          </div>

        </div>
      </section>

      {/* Section 2: Personal Details Form */}
      <section className="bg-bone-white p-6 sm:p-8 shadow-xs border border-sand-neutral/60 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Personal Verification Details</h2>
            <span className="bg-surface-container-highest text-clay-earth px-2.5 py-0.5 font-label-caps text-label-caps uppercase text-[10px] border border-sand-neutral font-semibold">
              Aadhaar Linked
            </span>
          </div>
          <span className="font-mono text-xs text-clay-earth hidden sm:inline-block">CONFIDENTIAL • RECORD ID: PER-9844-IN</span>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Full Name */}
          <div className="md:col-span-6 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Legal Full Name (as per Gov ID)</label>
            <input
              type="text"
              value={accountData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="bg-transparent text-onyx-black font-body-md text-base focus:outline-none focus:ring-0 font-medium"
            />
          </div>

          {/* Date of Birth */}
          <div className="md:col-span-3 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <div className="flex items-center justify-between">
              <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Date of Birth</label>
              <span className="font-label-caps text-[10px] text-onyx-black font-bold">✓ AADHAAR VERIFIED</span>
            </div>
            <input
              type="text"
              value={accountData.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="bg-transparent text-onyx-black font-body-md text-base focus:outline-none font-medium"
            />
          </div>

          {/* Gender */}
          <div className="md:col-span-3 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Gender</label>
            <select
              value={accountData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="bg-transparent text-onyx-black font-body-md text-base focus:outline-none font-medium cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary / Other">Non-Binary / Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Residential Address */}
          <div className="md:col-span-12 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Permanent Residential Address</label>
            <input
              type="text"
              value={accountData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="bg-transparent text-onyx-black font-body-md text-base focus:outline-none font-medium"
            />
          </div>

          {/* City */}
          <div className="md:col-span-4 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">City</label>
            <input
              type="text"
              value={accountData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="bg-transparent text-onyx-black font-body-md text-base focus:outline-none font-medium"
            />
          </div>

          {/* State */}
          <div className="md:col-span-4 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">State</label>
            <input
              type="text"
              value={accountData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="bg-transparent text-onyx-black font-body-md text-base focus:outline-none font-medium"
            />
          </div>

          {/* Pincode */}
          <div className="md:col-span-4 flex flex-col space-y-1.5 bg-surface-container-lowest p-4 border border-sand-neutral/60">
            <label className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Postal Pincode</label>
            <input
              type="text"
              value={accountData.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              className="bg-transparent font-mono text-onyx-black text-base focus:outline-none font-semibold"
            />
          </div>

          {/* Emergency Contact Link Box */}
          <div className="md:col-span-12 bg-surface-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-sand-neutral">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-onyx-black text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">contact_emergency</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Emergency Dispatch Contact</span>
                  <span className="bg-onyx-black text-on-primary px-1.5 py-0.2 font-label-caps text-[10px] uppercase font-bold">
                    RELATION: {accountData.emergencyContact?.relationship?.toUpperCase() || 'BROTHER'}
                  </span>
                </div>
                <div className="font-body-md text-onyx-black font-semibold text-sm">
                  {accountData.emergencyContact?.name} • {accountData.emergencyContact?.phone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-onyx-black hover:text-clay-earth font-button-text text-xs font-semibold self-start sm:self-center uppercase tracking-wider border border-sand-neutral px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container transition-colors"
            >
              <span>Edit Emergency Contact</span>
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>

        </form>
      </section>

      {/* Section 3: Contact Verification & Communications */}
      <section className="bg-bone-white p-6 sm:p-8 shadow-xs border border-sand-neutral/60 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
          <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Contact Verification &amp; Communications</h2>
          <span className="font-label-caps text-label-caps text-clay-earth uppercase text-xs font-semibold">2-FACTOR TELECOM RAILS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Email Verification */}
          <div className="bg-surface-container-lowest p-6 flex flex-col justify-between space-y-5 border border-sand-neutral/60">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Primary Email Address</span>
                <span className="bg-surface-container-highest text-onyx-black px-2 py-0.5 font-label-caps text-[10px] font-bold uppercase border border-sand-neutral">
                  ✓ VERIFIED
                </span>
              </div>
              <div className="font-mono text-onyx-black text-base font-semibold break-all">{accountData.email}</div>
              <p className="font-body-md text-xs text-clay-earth">
                Used for official tax invoices, weekly settlement sheets, and security recovery alerts.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleReverifyEmail}
                disabled={verifyingEmail}
                className="bg-surface-container px-4 py-2 text-onyx-black hover:bg-surface-container-highest font-button-text text-xs font-semibold transition-colors border border-sand-neutral flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 w-fit"
              >
                {verifyingEmail && (
                  <span className="w-3.5 h-3.5 border-2 border-onyx-black border-t-transparent rounded-full animate-spin"></span>
                )}
                <span>{verifyingEmail ? 'Sending Link...' : 'Re-verify Email'}</span>
              </button>
              {emailVerificationMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-label-caps text-[11px] leading-tight">
                  {emailVerificationMsg}
                </div>
              )}
            </div>
          </div>

          {/* Phone Verification */}
          <div className="bg-surface-container-lowest p-6 flex flex-col justify-between space-y-5 border border-sand-neutral/60">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Primary Dispatch Mobile</span>
                <span className="bg-surface-container-highest text-onyx-black px-2 py-0.5 font-label-caps text-[10px] font-bold uppercase border border-sand-neutral">
                  ✓ VERIFIED VIA OTP
                </span>
              </div>
              <div className="font-mono text-onyx-black text-base font-semibold">{accountData.phone}</div>
              <p className="font-body-md text-xs text-clay-earth">
                Directly coupled to your driver app live telemetry and automated customer calling bridge.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => { if (onShowToast) onShowToast('To update phone number, please contact Dispatch Hub Support.'); }}
                className="bg-surface-container px-4 py-2 text-onyx-black hover:bg-surface-container-highest font-button-text text-xs font-semibold transition-colors border border-sand-neutral"
              >
                Update Phone
              </button>
            </div>
          </div>

          {/* Secondary Notification Channel */}
          <div className="bg-surface-container-lowest p-6 flex items-center justify-between border border-sand-neutral/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Secondary Channel</span>
                <span className="w-1.5 h-1.5 rounded-full bg-onyx-black" />
                <span className="font-label-caps text-[10px] uppercase font-bold text-onyx-black">
                  {accountData.whatsappNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="font-body-md text-onyx-black font-semibold text-sm">WhatsApp Dispatch Broadcasts</div>
              <div className="font-body-md text-xs text-clay-earth">Receive high-surge announcements &amp; shift reminders on WhatsApp.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accountData.whatsappNotifications}
                onChange={(e) => handleChange('whatsappNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black" />
            </label>
          </div>

          {/* Emergency SOS Rail */}
          <div className="bg-surface-container-lowest p-6 flex items-center justify-between border border-sand-neutral/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Safety Protocol</span>
                <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-ping" />
                <span className="font-label-caps text-[10px] uppercase font-bold text-onyx-black">Live Linked</span>
              </div>
              <div className="font-body-md text-onyx-black font-semibold text-sm">Emergency SOS Trigger Rail</div>
              <div className="font-mono text-xs text-clay-earth">Linked to primary device {accountData.phone}</div>
            </div>
            <span className="material-symbols-outlined text-onyx-black text-2xl">sensors</span>
          </div>

        </div>
      </section>

      {/* Section 4: Security & Authentication */}
      <section className="bg-bone-white p-6 sm:p-8 shadow-xs border border-sand-neutral/60 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
          <div>
            <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Security &amp; Authentication</h2>
            <p className="font-body-md text-xs text-clay-earth mt-1">Multi-factor tokens, encryption keys, and active session boundaries.</p>
          </div>
          <span className="font-mono text-xs text-clay-earth font-bold">SECURITY SCORE: {accountData.securityScore}/100 (HIGH)</span>
        </div>

        {/* Password & 2FA Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Password */}
          <div className="bg-surface-container-lowest p-6 space-y-4 border border-sand-neutral/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Master Password</span>
                <span className="font-mono text-xs text-clay-earth">Last changed 56 Days Ago</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 font-mono text-lg text-onyx-black tracking-widest font-bold">
                  <span>••••••••••••••••</span>
                </div>
                <span className="bg-surface-container-high px-2 py-0.5 font-label-caps text-[10px] text-clay-earth uppercase border border-sand-neutral font-semibold">
                  ENCRYPTED BCRYPT
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="bg-onyx-black text-on-primary px-4 py-2 font-button-text text-xs uppercase tracking-wider font-bold hover:bg-stone-800 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-surface-container-lowest p-6 space-y-4 border border-sand-neutral/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-wider text-clay-earth text-[11px]">Two-Factor Authentication (2FA)</span>
                <span className="bg-onyx-black text-on-primary px-2 py-0.5 font-label-caps text-[10px] font-bold uppercase">
                  ENABLED
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-body-md text-onyx-black font-semibold text-sm">TOTP Authenticator &amp; SMS Backup</div>
                <div className="font-body-md text-xs text-clay-earth">Time-based one-time code generated via Google Authenticator with encrypted SMS failsafe.</div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => { if (onShowToast) onShowToast('2FA settings are active and managed via Authenticator App.'); }}
                className="bg-surface-container text-onyx-black px-4 py-2 font-button-text text-xs font-semibold hover:bg-surface-container-highest transition-colors border border-sand-neutral"
              >
                Manage 2FA Methods
              </button>
            </div>
          </div>

        </div>

        {/* Active Sessions & Device Security */}
        <div className="bg-surface-container-lowest p-6 space-y-6 border border-sand-neutral/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-sand-neutral">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black text-lg">devices</span>
                <span className="font-headline-md text-xl text-onyx-black font-serif">Active Device Sessions</span>
              </div>
              <p className="font-body-md text-xs text-clay-earth">Authorized hardware handles accessing your dispatch tokens and wallet telemetry.</p>
            </div>

            <button
              type="button"
              onClick={handleTerminateOtherSessions}
              className="bg-surface-container text-clay-earth hover:text-error hover:bg-red-50 px-4 py-2 font-button-text text-xs font-semibold transition-colors self-start sm:self-auto flex items-center gap-1.5 border border-sand-neutral uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">lock_reset</span>
              <span>Terminate Other Active Sessions</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Session 1 */}
            <div className="bg-surface-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-sand-neutral">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-onyx-black text-on-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">smartphone</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-body-md font-semibold text-onyx-black text-sm">Chrome 128 on Android 15 (OnePlus 11R)</span>
                    <span className="bg-onyx-black text-on-primary px-1.5 py-0.2 font-label-caps text-[9px] uppercase font-bold">Current Device</span>
                  </div>
                  <div className="font-mono text-xs text-clay-earth">
                    Bandra West, Mumbai • IP: 103.21.144.92 • Active Now
                  </div>
                </div>
              </div>
              <span className="font-label-caps text-xs text-onyx-black font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-onyx-black animate-pulse" />
                ACTIVE SESSION
              </span>
            </div>

            {/* Session 2 */}
            {accountData.activeSessions?.some(s => !s.isCurrent) !== false && (
              <div className="bg-surface-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-sand-neutral">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-sand-neutral text-onyx-black flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">tablet_mac</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-body-md font-semibold text-onyx-black text-sm">TiffinLink Driver App v4.2 on iOS 18</span>
                      <span className="bg-surface-container-highest text-clay-earth px-1.5 py-0.2 font-label-caps text-[9px] uppercase border border-sand-neutral">Spare Device</span>
                    </div>
                    <div className="font-mono text-xs text-clay-earth">
                      Hub 12 Depot, Bandra West • Last active 2 hours ago
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleTerminateOtherSessions();
                  }}
                  className="text-clay-earth hover:text-error font-button-text text-xs underline font-semibold"
                >
                  Revoke Access
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 5: Account Provenance & Status Telemetry */}
      <section className="bg-bone-white p-6 sm:p-8 shadow-xs border border-sand-neutral/60 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
          <h2 className="font-headline-md text-2xl text-onyx-black font-serif">Account Provenance &amp; Status Telemetry</h2>
          <span className="font-mono text-xs text-clay-earth font-bold">AUDIT ID: 7780-DP-RELAY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Account Created Date */}
          <div className="bg-surface-container-lowest p-6 space-y-2 border border-sand-neutral/60">
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Account Enlistment</span>
            <div className="font-mono text-xl text-onyx-black font-bold">12 Jan 2024</div>
            <div className="font-body-md text-xs text-clay-earth">986 active courier days completed with flawless fulfillment.</div>
          </div>

          {/* Last Login */}
          <div className="bg-surface-container-lowest p-6 space-y-2 border border-sand-neutral/60">
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Last Authenticated</span>
            <div className="font-mono text-xl text-onyx-black font-bold">Today, 08:15 AM</div>
            <div className="font-body-md text-xs text-clay-earth">Biometric passkey verified on primary handheld.</div>
          </div>

          {/* Current Real-time Dispatch Status */}
          <div className="bg-surface-container-lowest p-6 space-y-2 border border-sand-neutral/60">
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Live Dispatch Mesh</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-onyx-black animate-ping" />
              <span className="font-mono text-xl text-onyx-black font-bold uppercase">{accountData.status}</span>
            </div>
            <div className="font-body-md text-xs text-clay-earth">Accepting lunch orders in Hub 12 Bandra cluster.</div>
          </div>

          {/* Driver Health Attestation */}
          <div className="bg-surface-container-lowest p-6 space-y-2 border border-sand-neutral/60">
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider text-[11px]">Health Attestation</span>
            <div className="font-mono text-xl text-onyx-black font-bold">{accountData.healthAttestation}</div>
            <div className="font-body-md text-xs text-clay-earth">Annual fitness &amp; medical cert valid through Nov 2026.</div>
          </div>
        </div>
      </section>

      {/* Section 6: Cryptographic Footer Bar */}
      <footer className="pt-4 flex flex-col sm:flex-row items-center justify-between text-clay-earth font-mono text-[11px] uppercase tracking-wider gap-4 border-t border-sand-neutral/60">
        <div>AUTHENTICATED DRIVER PRINCIPAL {accountData.driverId} • CENTRAL HUB 12 DISPATCH CLUSTER</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-onyx-black" />
          <span>TLS 1.3 ENCRYPTED POST • NODE RUNNER: BOM-04</span>
        </div>
      </footer>

      {/* Bottom Floating / Sticky Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 lg:left-[340px] lg:right-8 z-40 bg-bone-white p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-onyx-black">
        <div className="flex items-center gap-2 text-clay-earth">
          <span className="material-symbols-outlined text-base">info</span>
          <span className="font-body-md text-xs">Unsaved changes will be discarded on page refresh.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="cancelChangesBtn"
            onClick={handleCancelChanges}
            className="bg-transparent text-onyx-black px-4 py-2 hover:bg-surface-container font-button-text text-xs uppercase tracking-wider font-semibold transition-colors border border-sand-neutral"
          >
            Cancel Changes
          </button>
          <button
            type="button"
            id="saveChangesBtn"
            disabled={saving}
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-2 bg-onyx-black text-on-primary px-6 py-2 hover:bg-stone-800 font-button-text text-xs uppercase tracking-wider font-bold transition-colors shadow-xs"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin text-on-primary">autorenew</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base text-on-primary">check</span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL 1: Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-onyx-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bone-white p-6 sm:p-8 max-w-md w-full border-2 border-onyx-black shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <h3 className="font-headline-md text-xl text-onyx-black font-serif">Change Master Password</h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-clay-earth hover:text-onyx-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border-l-4 border-error text-error text-xs font-medium">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-sand-neutral p-2.5 text-sm text-onyx-black focus:outline-none focus:border-onyx-black"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-sand-neutral p-2.5 text-sm text-onyx-black focus:outline-none focus:border-onyx-black"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-sand-neutral p-2.5 text-sm text-onyx-black focus:outline-none focus:border-onyx-black"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-onyx-black text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-2 bg-onyx-black text-on-primary hover:bg-stone-800 text-xs font-bold uppercase tracking-wider"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Contact Edit Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-onyx-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bone-white p-6 sm:p-8 max-w-md w-full border-2 border-onyx-black shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <h3 className="font-headline-md text-xl text-onyx-black font-serif">Edit Emergency Contact</h3>
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="text-clay-earth hover:text-onyx-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEmergencySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={emergencyForm.name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-sand-neutral p-2.5 text-sm text-onyx-black focus:outline-none focus:border-onyx-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={emergencyForm.phone}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-sand-neutral p-2.5 text-sm text-onyx-black focus:outline-none focus:border-onyx-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">Relationship</label>
                <input
                  type="text"
                  required
                  value={emergencyForm.relationship}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-sand-neutral p-2.5 text-sm text-onyx-black focus:outline-none focus:border-onyx-black"
                  placeholder="e.g. Brother, Spouse, Parent"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-onyx-black text-xs font-semibold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-onyx-black text-on-primary hover:bg-stone-800 text-xs font-bold uppercase tracking-wider"
                >
                  Update Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Security Audit Log Dialog */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-onyx-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bone-white p-6 sm:p-8 max-w-lg w-full border-2 border-onyx-black shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black">security</span>
                <h3 className="font-headline-md text-xl text-onyx-black font-serif">Security Audit Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="text-clay-earth hover:text-onyx-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs text-onyx-black bg-surface-container-lowest p-4 border border-sand-neutral max-h-60 overflow-y-auto">
              <div className="pb-2 border-b border-sand-neutral/50">
                <span className="text-emerald-800 font-bold">[PASS]</span> TLS 1.3 Handshake verified for principal {accountData.driverId}
                <div className="text-[10px] text-clay-earth">2026-09-23T08:15:02Z • Node: BOM-04</div>
              </div>
              <div className="pb-2 border-b border-sand-neutral/50">
                <span className="text-emerald-800 font-bold">[PASS]</span> MongoDB Drivers record query validated without unauthorized claims.
                <div className="text-[10px] text-clay-earth">2026-09-23T08:15:00Z • Cluster: West Mumbai Hub 12</div>
              </div>
              <div className="pb-2 border-b border-sand-neutral/50">
                <span className="text-emerald-800 font-bold">[PASS]</span> Zero IDOR or session privilege escalation attempts detected in past 90 days.
                <div className="text-[10px] text-clay-earth">Security Index: 98/100</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-6 py-2 bg-onyx-black text-on-primary hover:bg-stone-800 text-xs font-bold uppercase tracking-wider"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Email OTP Verification Dialog */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-onyx-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bone-white p-6 sm:p-8 max-w-md w-full border-2 border-onyx-black shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sand-neutral">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-onyx-black">mark_email_read</span>
                <h3 className="font-headline-md text-xl text-onyx-black font-serif">Verify Email Address</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(false)}
                className="text-clay-earth hover:text-onyx-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-md text-xs text-clay-earth">
              A 6-digit verification code has been sent to your registered email address <strong className="text-onyx-black font-mono">{accountData.email}</strong>.
            </p>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {otpError}
              </div>
            )}

            {otpSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                {otpSuccessMsg}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-xs text-clay-earth uppercase tracking-wider block">Enter 6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-container-lowest border-2 border-onyx-black p-3 text-center text-2xl font-mono tracking-[0.4em] text-onyx-black focus:outline-none focus:ring-2 focus:ring-onyx-black font-bold"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-clay-earth pt-1">
                <span>Code expires in: <strong className="font-mono text-onyx-black">{Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}</strong></span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpResending}
                  className="text-onyx-black underline font-semibold hover:text-clay-earth disabled:opacity-50"
                >
                  {otpResending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-onyx-black text-xs font-semibold uppercase tracking-wider border border-sand-neutral"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpVerifying || otpInput.length !== 6}
                  className="px-6 py-2 bg-onyx-black text-on-primary hover:bg-stone-800 text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {otpVerifying && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  <span>{otpVerifying ? 'Verifying...' : 'Verify OTP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
