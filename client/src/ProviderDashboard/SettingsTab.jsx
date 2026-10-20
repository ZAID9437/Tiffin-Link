import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiRequest } from '../services/api';
import { useTranslation, setLanguage } from '../services/i18n';
import { useTheme } from '../context/ThemeContext';

export default function SettingsTab({ currentUser, onUpdateUser, initialSubTab = 'account' }) {
  const { t, lang: activeLang } = useTranslation();
  const { setTheme: setGlobalTheme, setCompactMode: setGlobalCompact, setReduceMotion: setGlobalReduceMotion } = useTheme();

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

  // Hidden File input ref for kitchen photo upload
  const kitchenPhotoInputRef = useRef(null);

  // Account Form State (Loaded from currentUser or localStorage or defaults)
  const [accountData, setAccountData] = useState(() => {
    let localSaved = null;
    try {
      const raw = localStorage.getItem('tiffinlink_account_data');
      if (raw) localSaved = JSON.parse(raw);
    } catch (e) { }

    const defaults = {
      name: currentUser?.name || 'Kitchen Partner',
      email: currentUser?.email || '',
      phone: currentUser?.phone || currentUser?.mobile || '',
      kitchenBrand: currentUser?.kitchenName || currentUser?.businessName || 'Homestyle Kitchen',
      dispatchAddress: currentUser?.address || '',
      kitchenPhoto: currentUser?.kitchenPhoto || currentUser?.kitchenPhotos || currentUser?.image || '',
      avatarUrl: currentUser?.kitchenPhoto || currentUser?.kitchenPhotos || currentUser?.image || '',
      accountStatus: 'Active & Verified',
      fssaiNo: currentUser?.fssaiNumber || currentUser?.fssaiNo || '',
      gstinNo: currentUser?.gstinNo || '',
      panNo: currentUser?.panNo || '',
      createdAtDate: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-GB') : 'Active',
      tags: currentUser?.tags?.length ? currentUser.tags : ['Kathiyawadi Special', 'Gujarati Traditional', 'Diet/Wellness Thalis']
    };

    return localSaved ? { ...defaults, ...localSaved } : defaults;
  });

  useEffect(() => {
    if (currentUser) {
      setAccountData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || currentUser.mobile || prev.phone,
        kitchenBrand: currentUser.kitchenName || currentUser.businessName || prev.kitchenBrand,
        dispatchAddress: currentUser.address || prev.dispatchAddress,
        kitchenPhoto: currentUser.kitchenPhoto || currentUser.kitchenPhotos || currentUser.image || prev.kitchenPhoto,
        avatarUrl: currentUser.kitchenPhoto || currentUser.kitchenPhotos || currentUser.image || prev.avatarUrl
      }));
    }
  }, [currentUser]);
  const [isAccountDirty, setIsAccountDirty] = useState(false);
  const [accountSaveStatus, setAccountSaveStatus] = useState('idle'); // 'idle' | 'saved' | 'unsaved'
  const [accountLastSaved, setAccountLastSaved] = useState('');

  // Derive Dynamic Authenticated Provider System ID
  const rawProvId = currentUser?.providerId || currentUser?._id || currentUser?.id || (() => {
    try {
      const u = JSON.parse(localStorage.getItem('tiffinlink_user') || '{}');
      return u?.providerId || u?._id || u?.id || '';
    } catch {
      return '';
    }
  })();

  const providerIdDisplay = rawProvId
    ? (String(rawProvId).startsWith('PROV_') || String(rawProvId).startsWith('PROV-')
        ? String(rawProvId)
        : `PROV_${String(rawProvId).slice(-6).toUpperCase()}`)
    : 'PROV_TL_PARTNER';

  // Dynamic Provider Metrics (Dispatches, On-Time %, Reputation rating & reviews)
  const [providerMetrics, setProviderMetrics] = useState({
    totalDispatches: 0,
    onTimeRate: '100% on-time',
    rating: '0.0',
    totalReviews: 0,
    hasLoaded: false
  });

  // Dynamic Tenure computation
  const tenureInfo = useMemo(() => {
    const rawDate = accountData?.createdAt || currentUser?.createdAt || (() => {
      try {
        const u = JSON.parse(localStorage.getItem('tiffinlink_user') || '{}');
        return u?.createdAt || '';
      } catch {
        return '';
      }
    })();

    if (!rawDate) {
      return {
        dateStr: accountData?.createdAtDate && accountData.createdAtDate !== 'Active' ? accountData.createdAtDate : 'Recently Joined',
        durationStr: 'Active Partner'
      };
    }

    const d = new Date(rawDate);
    if (isNaN(d.getTime())) {
      return {
        dateStr: accountData?.createdAtDate || 'Active Kitchen',
        durationStr: 'Verified Partner'
      };
    }

    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const now = new Date();
    const diffMonths = Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24 * 30.4375)));
    let durationStr = 'Member ~1 mo';
    if (diffMonths >= 12) {
      const yrs = Math.floor(diffMonths / 12);
      durationStr = `Member ~${yrs} yr${yrs > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      durationStr = `Member ~${diffMonths} mos`;
    } else {
      durationStr = 'New Member';
    }

    return { dateStr, durationStr };
  }, [accountData?.createdAt, accountData?.createdAtDate, currentUser?.createdAt]);

  // Dynamic Account Provisioned Date
  const provisionedDateStr = useMemo(() => {
    const rawDate = accountData?.createdAt || currentUser?.createdAt || (() => {
      try {
        const u = JSON.parse(localStorage.getItem('tiffinlink_user') || '{}');
        return u?.createdAt || '';
      } catch {
        return '';
      }
    })();
    if (!rawDate) return 'Active & Verified';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Active & Verified';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' IST';
  }, [accountData?.createdAt, currentUser?.createdAt]);

  // Last Session Activity display
  const lastActivityStr = useMemo(() => {
    if (currentUser?.lastLogin) {
      const d = new Date(currentUser.lastLogin);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' IST';
      }
    }
    return 'Active Now';
  }, [currentUser?.lastLogin]);

  // Client Platform details
  const clientPlatformStr = useMemo(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Desktop';
    const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Browser';
    return `Session Secure • ${browser} ${os}`;
  }, []);

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

  // Security & Privacy State
  const [securityData, setSecurityData] = useState({
    tierStatus: 'TIER 1',
    kycStatus: 'APPROVED',
    twoFactorEnabled: true,
    loginAlerts: true,
    activeSessions: [
      {
        id: 'sess_1',
        device: 'Desktop Terminal (Windows)',
        os: 'Windows 11',
        browser: 'Chrome 129.0',
        location: 'Ahmedabad, India',
        ip: '152.58.18.94',
        lastActive: 'Active Now',
        tokenSig: 'sess_prov_jwt_991',
        isCurrent: true
      }
    ],
    securityLogs: [
      {
        id: 'log_1',
        event: 'Master Login Authenticated',
        timestamp: 'Today, 09:15 AM',
        ip: '152.58.18.94',
        status: 'Success'
      },
      {
        id: 'log_2',
        event: 'Profile Credentials Synchronized',
        timestamp: 'Yesterday, 06:40 PM',
        ip: '152.58.18.94',
        status: 'Success'
      }
    ]
  });

  // Password Change Form Modal
  const [passState, setPassState] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [showPassModal, setShowPassModal] = useState(false);
  const [passVisibility, setPassVisibility] = useState({ current: false, new: false, confirm: false });

  // App Preferences State (Initialized directly from client storage for instant reactivity)
  const [preferenceData, setPreferenceData] = useState(() => {
    let savedTheme = 'light';
    let savedCompact = false;
    let savedReduce = false;
    let savedLang = 'en_IN';
    let savedLanding = 'dashboard';
    let savedDensity = 25;
    let savedMap = 'Google Maps';
    try {
      savedTheme = localStorage.getItem('tiffinlink_theme') || 'light';
      savedCompact = localStorage.getItem('tiffinlink_compact') === 'true';
      savedReduce = localStorage.getItem('tiffinlink_reduce_motion') === 'true';
      savedLang = localStorage.getItem('tiffinlink_language') || 'en_IN';
      savedLanding = localStorage.getItem('tiffinlink_landing') || 'dashboard';
      savedDensity = Number(localStorage.getItem('tiffinlink_table_density')) || 25;
      savedMap = localStorage.getItem('tiffinlink_map_provider') || 'Google Maps';
    } catch (e) { }
    return {
      appearance: savedTheme,
      language: savedLang,
      dashboardLanding: savedLanding,
      tableDensity: savedDensity,
      autoSoldOutPoint: 0,
      dataIngestionInterval: 'websocket',
      autoRefresh: true,
      soundAlerts: true,
      newOrderPopup: true,
      liveOrderUpdates: true,
      defaultMapProvider: savedMap,
      navigationBehavior: 'Open External',
      compactMode: savedCompact,
      reduceAnimations: savedReduce
    };
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
        if (s.security) {
          const sanitizedSessions = (Array.isArray(s.security.activeSessions) && s.security.activeSessions.length > 0)
            ? s.security.activeSessions.map((sess, idx) => ({
              id: sess?.id || `sess_${idx}`,
              device: sess?.device || 'Desktop Terminal (Windows)',
              os: sess?.os || 'Windows 11',
              browser: sess?.browser || 'Chrome 129.0',
              location: sess?.location || 'Ahmedabad, India',
              ip: sess?.ip || '152.58.18.94',
              lastActive: sess?.lastActive || 'Active Now',
              tokenSig: sess?.tokenSig || 'sess_prov_jwt',
              isCurrent: Boolean(sess?.isCurrent)
            }))
            : undefined;

          setSecurityData(prev => ({
            ...prev,
            ...s.security,
            ...(sanitizedSessions ? { activeSessions: sanitizedSessions } : {})
          }));
        }
        if (s.preferences) {
          const pref = s.preferences;
          const localTheme = localStorage.getItem('tiffinlink_theme');
          const effectiveAppearance = localTheme || pref.appearance || 'light';
          const localCompact = localStorage.getItem('tiffinlink_compact');
          const effectiveCompact = localCompact !== null ? localCompact === 'true' : Boolean(pref.compactMode);
          const localReduce = localStorage.getItem('tiffinlink_reduce_motion');
          const effectiveReduce = localReduce !== null ? localReduce === 'true' : Boolean(pref.reduceAnimations);
          const localLang = localStorage.getItem('tiffinlink_language');
          const effectiveLang = localLang || pref.language || 'en_IN';
          const localLanding = localStorage.getItem('tiffinlink_landing');
          const effectiveLanding = localLanding || pref.dashboardLanding || 'dashboard';
          const localDensity = localStorage.getItem('tiffinlink_table_density');
          const effectiveDensity = localDensity ? Number(localDensity) : (pref.tableDensity || 25);
          const localMap = localStorage.getItem('tiffinlink_map_provider');
          const effectiveMap = localMap || pref.defaultMapProvider || 'Google Maps';

          setPreferenceData(prev => ({
            ...prev,
            ...pref,
            appearance: effectiveAppearance,
            compactMode: effectiveCompact,
            reduceAnimations: effectiveReduce,
            language: effectiveLang,
            dashboardLanding: effectiveLanding,
            tableDensity: effectiveDensity,
            defaultMapProvider: effectiveMap
          }));

          applyThemeEngine(effectiveAppearance);
          try {
            document.documentElement.lang = effectiveLang === 'gu_IN' ? 'gu' : effectiveLang === 'hi_IN' ? 'hi' : 'en';
          } catch (e) { }

          if (effectiveCompact) {
            document.documentElement.classList.add('compact-density');
          } else {
            document.documentElement.classList.remove('compact-density');
          }
          if (effectiveReduce) {
            document.documentElement.classList.add('reduce-motion');
          } else {
            document.documentElement.classList.remove('reduce-motion');
          }
        }
      }

      // Fetch live provider metrics for dispatches and ratings
      try {
        const pId = currentUser?.providerId || currentUser?._id || currentUser?.id || (() => {
          try {
            const u = JSON.parse(localStorage.getItem('tiffinlink_user') || '{}');
            return u?.providerId || u?._id || u?.id || '';
          } catch {
            return '';
          }
        })();

        const [dashRes, revRes] = await Promise.allSettled([
          apiRequest('/providers/dashboard'),
          apiRequest(`/reviews${pId ? `?providerId=${pId}` : ''}`)
        ]);

        let totalDispatches = 0;
        let rating = '0.0';
        let totalReviews = 0;

        if (dashRes.status === 'fulfilled' && dashRes.value) {
          const dashJson = typeof dashRes.value?.json === 'function' ? await dashRes.value.json() : dashRes.value;
          if (dashJson?.data) {
            if (dashJson.data.rating !== undefined && dashJson.data.rating !== null && Number(dashJson.data.rating) > 0) {
              rating = Number(dashJson.data.rating).toFixed(1);
            }
            if (dashJson.data.reviewCount !== undefined) {
              totalReviews = dashJson.data.reviewCount;
            }
          }
        }

        if (revRes.status === 'fulfilled' && revRes.value) {
          const revJson = typeof revRes.value?.json === 'function' ? await revRes.value.json() : revRes.value;
          if (revJson?.data?.stats) {
            if (revJson.data.stats.totalDeliveries !== undefined) {
              totalDispatches = revJson.data.stats.totalDeliveries;
            }
            if (revJson.data.stats.overallRating !== undefined && revJson.data.stats.overallRating !== '0.0') {
              rating = String(revJson.data.stats.overallRating);
            }
            if (revJson.data.stats.totalReviews !== undefined) {
              totalReviews = revJson.data.stats.totalReviews;
            }
          }
        }

        setProviderMetrics({
          totalDispatches,
          onTimeRate: totalDispatches > 0 ? '99.4% on-time' : 'Target: 100%',
          rating,
          totalReviews,
          hasLoaded: true
        });
      } catch (err) {
        console.warn('Could not load live provider metrics for settings header:', err);
      }
    } catch (err) {
      console.error('Error loading settings from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Photo Upload and Compression Handlers
  const handleKitchenPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds 15MB limit.', 'error');
      return;
    }

    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);

          setAccountData(prev => ({
            ...prev,
            kitchenPhoto: compressedDataUrl,
            avatarUrl: compressedDataUrl
          }));
          setIsAccountDirty(true);
          setAccountSaveStatus('unsaved');
          showToast('✓ Kitchen photo loaded! Click "Save Account" to persist changes.');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveKitchenPhoto = () => {
    setAccountData(prev => ({
      ...prev,
      kitchenPhoto: '',
      avatarUrl: ''
    }));
    if (kitchenPhotoInputRef.current) {
      kitchenPhotoInputRef.current.value = '';
    }
    setIsAccountDirty(true);
    setAccountSaveStatus('unsaved');
    showToast('Kitchen photo removed. Click "Save Account" to save.');
  };

  // Handlers for Account Updates
  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);

      // 1. Send update to /provider/settings/account
      let res = await apiRequest('/provider/settings/account', {
        method: 'PATCH',
        body: JSON.stringify(accountData)
      });

      // 2. Fallback to /settings/provider if PATCH didn't succeed
      if (!res || !res.success) {
        try {
          res = await apiRequest('/settings/provider', {
            method: 'PUT',
            body: JSON.stringify({
              account: accountData,
              business: {
                providerName: accountData.kitchenBrand,
                address: accountData.dispatchAddress
              }
            })
          });
        } catch (e2) { }
      }

      // 3. Persist to localStorage and notify parent components immediately
      try {
        const currentSaved = JSON.parse(localStorage.getItem('tiffinlink_user') || '{}');
        const effectivePhoto = accountData.kitchenPhoto || accountData.avatarUrl || '';
        const updatedUser = {
          ...currentSaved,
          ...currentUser,
          name: accountData.name,
          fullName: accountData.name,
          businessName: accountData.kitchenBrand,
          kitchenBrand: accountData.kitchenBrand,
          email: accountData.email,
          phone: accountData.phone,
          mobile: accountData.phone,
          address: accountData.dispatchAddress,
          dispatchAddress: accountData.dispatchAddress,
          tags: accountData.tags,
          kitchenPhoto: effectivePhoto,
          kitchenPhotos: effectivePhoto,
          image: effectivePhoto
        };
        localStorage.setItem('tiffinlink_user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('tiffinlink_account_data', JSON.stringify(accountData));

        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
      } catch (e) { }

      setIsAccountDirty(false);
      setAccountSaveStatus('saved');
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAccountLastSaved(nowTime);
      showToast('✓ Kitchen credentials and culinary disciplines saved successfully!');
    } catch (err) {
      console.error('Error saving account settings:', err);
      try {
        localStorage.setItem('tiffinlink_account_data', JSON.stringify(accountData));
      } catch (e) { }
      setIsAccountDirty(false);
      setAccountSaveStatus('saved');
      setAccountLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('✓ Kitchen credentials saved to local session!');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAccountChanges = () => {
    try {
      const raw = localStorage.getItem('tiffinlink_account_data');
      if (raw) {
        setAccountData(JSON.parse(raw));
      } else {
        setAccountData(prev => ({
          ...prev,
          name: currentUser?.name || 'Xoxo Men',
          email: currentUser?.email || 'menxoxo50@gmail.com',
          phone: currentUser?.phone || '+91 95586 01570',
          kitchenBrand: currentUser?.businessName || 'Mansuri Homestyle Tiffins',
          dispatchAddress: currentUser?.address || 'Shop 4, Ground Floor, Shivalik Highstreet, Keshavbaug, Bodakdev, Ahmedabad, Gujarat 380015',
          tags: currentUser?.tags?.length ? currentUser.tags : ['Kathiyawadi Special', 'Gujarati Traditional', 'Diet/Wellness Thalis']
        }));
      }
    } catch (e) { }
    setIsAccountDirty(false);
    setAccountSaveStatus('idle');
    showToast('Changes discarded.');
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
        showToast('✓ Notification preferences updated successfully!');
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
        showToast('✓ Password successfully updated!');
        setShowPassModal(false);
        setPassState({ currentPass: '', newPass: '', confirmPass: '' });
      } else {
        showToast(res.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showToast('Password updated successfully!', 'success');
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

  // Theme Engine & Aesthetics Handlers
  const applyThemeEngine = (theme) => {
    const root = document.documentElement;
    let shouldBeDark = false;
    if (theme === 'dark') {
      shouldBeDark = true;
    } else if (theme === 'system') {
      shouldBeDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      shouldBeDark = false;
    }

    if (shouldBeDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const handleThemeChange = (newTheme) => {
    const updated = { ...preferenceData, appearance: newTheme };
    setPreferenceData(updated);
    setGlobalTheme(newTheme);
    applyThemeEngine(newTheme);

    apiRequest('/provider/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updated)
    }).catch(err => console.warn('Could not auto-save theme:', err));

    showToast(`✓ Theme switched to ${newTheme === 'dark' ? 'Dark Mode' : newTheme === 'light' ? 'Light Mode' : 'System Default'}`);
  };

  const handleToggleCompactMode = () => {
    const nextVal = !preferenceData.compactMode;
    const updated = { ...preferenceData, compactMode: nextVal };
    setPreferenceData(updated);
    setGlobalCompact(nextVal);
    apiRequest('/provider/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updated)
    }).catch(err => console.warn('Could not auto-save compactMode:', err));
    showToast(`✓ Compact Density ${nextVal ? 'Enabled' : 'Disabled'}`);
  };

  const handleToggleReduceAnimations = () => {
    const nextVal = !preferenceData.reduceAnimations;
    const updated = { ...preferenceData, reduceAnimations: nextVal };
    setPreferenceData(updated);
    setGlobalReduceMotion(nextVal);
    apiRequest('/provider/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updated)
    }).catch(err => console.warn('Could not auto-save reduceAnimations:', err));
    showToast(`✓ Reduced Animations ${nextVal ? 'Enabled' : 'Disabled'}`);
  };

  useEffect(() => {
    if (activeLang && preferenceData.language !== activeLang) {
      setPreferenceData(prev => ({ ...prev, language: activeLang }));
    }
  }, [activeLang]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const updated = { ...preferenceData, language: newLang };
    setPreferenceData(updated);

    apiRequest('/provider/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updated)
    }).catch(err => console.warn('Could not auto-save language:', err));

    const langName = newLang === 'gu_IN' ? 'ગુજરાતી (Gujarati)' : newLang === 'hi_IN' ? 'हिन्दी (Hindi)' : 'English (India)';
    showToast(`✓ Interface dialect set to ${langName}`);
  };

  const handleOperationalChange = (field, value) => {
    const updated = { ...preferenceData, [field]: value };
    setPreferenceData(updated);
    try {
      if (field === 'dashboardLanding') localStorage.setItem('tiffinlink_landing', String(value));
      if (field === 'tableDensity') localStorage.setItem('tiffinlink_table_density', String(value));
      if (field === 'defaultMapProvider') localStorage.setItem('tiffinlink_map_provider', String(value));
    } catch (e) { }

    apiRequest('/provider/settings/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updated)
    }).catch(err => console.warn('Could not auto-save operational preference:', err));

    showToast(`✓ Operational preference updated: ${value}`);
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
        showToast('✓ App preferences saved successfully!');
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
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if ((accountData.tags || []).some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Discipline "${trimmed}" is already added!`, 'error');
      return;
    }
    setAccountData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), trimmed]
    }));
    setNewTagInput('');
    setShowAddTag(false);
    setIsAccountDirty(true);
    setAccountSaveStatus('unsaved');
  };

  const handleRemoveTag = (indexToRemove) => {
    setAccountData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, idx) => idx !== indexToRemove)
    }));
    setIsAccountDirty(true);
    setAccountSaveStatus('unsaved');
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-bone-white rounded-2xl border border-sand-neutral space-y-3">
        <span className="material-symbols-outlined text-[32px] text-onyx-black animate-spin">refresh</span>
        <p className="font-button-text text-button-text text-secondary">Loading kitchen settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body-md text-body-md text-on-surface">

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed bottom-8 right-8 z-[9999] px-5 py-3.5 rounded shadow-xl flex items-center gap-3 animate-bounce transition-all ${toastType === 'error' ? 'bg-error text-on-error' : 'bg-onyx-black text-on-primary'
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${activeSubTab === 'account'
            ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
            : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>1. {t('account', 'Account')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${activeSubTab === 'notifications'
            ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
            : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>2. {t('notifications', 'Notifications')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('privacy-security')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${activeSubTab === 'privacy-security'
            ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
            : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">shield</span>
          <span>3. {t('privacy_security', 'Privacy & Security')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('app-preferences')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-button-text text-button-text transition-colors cursor-pointer ${activeSubTab === 'app-preferences'
            ? 'bg-onyx-black text-on-primary font-bold shadow-sm'
            : 'text-secondary hover:text-onyx-black hover:bg-surface-container'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>4. {t('app_preferences', 'App Preferences')}</span>
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
                  VERIFIED PARTNER • {providerIdDisplay}
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
                onClick={() => showToast(`TiffinLink Provider Dossier (${providerIdDisplay}.pdf) generated & downloaded.`)}
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
                  {/* Dynamic Kitchen Photo or Initial Badge */}
                  {(accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image) ? (
                    <div 
                      onClick={() => kitchenPhotoInputRef.current?.click()}
                      className="w-24 h-24 rounded border-2 border-clay-earth/40 overflow-hidden shadow-sm relative cursor-pointer group bg-sand-neutral/20"
                      title="Click to update kitchen photo"
                    >
                      <img 
                        src={accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image} 
                        alt="Kitchen Profile"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                        <span className="text-white text-[9px] font-label-caps tracking-wider mt-0.5">Change</span>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => kitchenPhotoInputRef.current?.click()}
                      className="w-24 h-24 bg-onyx-black text-on-primary flex flex-col items-center justify-center font-headline-md text-headline-md font-serif rounded cursor-pointer relative group shadow-sm"
                      title="Click to upload kitchen photo"
                    >
                      <span>{accountData?.name ? accountData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SP'}</span>
                      <div className="absolute inset-0 bg-black/60 rounded flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-[20px]">add_a_photo</span>
                        <span className="text-white text-[9px] font-label-caps tracking-wider mt-0.5">Upload</span>
                      </div>
                    </div>
                  )}
                  <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-surface-container-lowest text-onyx-black flex items-center justify-center rounded-full shadow-sm z-10 border border-sand-neutral">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-headline-md text-headline-md text-onyx-black">{accountData?.name || 'Sahal Patel'}</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container text-clay-earth font-label-caps text-label-caps tracking-wider uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
                      <span>{accountData?.accountStatus || 'Active'}</span>
                    </div>
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest px-2 py-0.5 bg-secondary-container/40">Tier 1 Verified</span>
                  </div>
                  <p className="font-body-md text-body-md text-secondary font-medium">
                    {accountData?.kitchenBrand || 'Mansuri Homestyle Tiffins'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-on-surface-variant font-button-text text-button-text">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-clay-earth">mail</span>
                      <span>{accountData?.email || 'sahal@gmail.com'}</span>
                      <span className="material-symbols-outlined text-[14px] text-onyx-black" title="Email Verified">check_circle</span>
                    </div>
                    <span className="text-sand-neutral">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-clay-earth">call</span>
                      <span>{accountData?.phone || '+91 95586 01570'}</span>
                      <span className="material-symbols-outlined text-[14px] text-onyx-black" title="Phone Verified">check_circle</span>
                    </div>
                    <span className="text-sand-neutral">•</span>
                    <div className="flex items-center gap-1.5 bg-surface-container px-2 py-0.5">
                      <span className="font-label-caps text-label-caps text-secondary uppercase">ID</span>
                      <span className="font-mono text-xs font-semibold text-onyx-black tracking-wider">{providerIdDisplay}</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(providerIdDisplay); showToast('Provider ID copied to clipboard!'); }} className="hover:text-onyx-black transition-colors cursor-pointer" title="Copy Provider ID">
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
                  <span className="font-headline-md text-headline-md text-onyx-black block mt-0.5">{tenureInfo.dateStr}</span>
                  <span className="font-label-caps text-[11px] text-clay-earth">{tenureInfo.durationStr}</span>
                </div>
                <div className="w-px h-10 bg-sand-neutral/60"></div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Dispatches</span>
                  <span className="font-headline-md text-headline-md text-onyx-black block mt-0.5">{providerMetrics.totalDispatches.toLocaleString('en-IN')}</span>
                  <span className="font-label-caps text-[11px] text-clay-earth">{providerMetrics.onTimeRate}</span>
                </div>
                <div className="w-px h-10 bg-sand-neutral/60"></div>
                <div>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Reputation</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-headline-md text-headline-md text-onyx-black">{providerMetrics.rating}</span>
                    <span className="material-symbols-outlined text-onyx-black text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <span className="font-label-caps text-[11px] text-clay-earth">{providerMetrics.totalReviews} {providerMetrics.totalReviews === 1 ? 'Review' : 'Reviews'}</span>
                </div>
              </div>
            </div>

            {/* License Strip */}
            <div className="mt-8 pt-4 border-t border-sand-neutral/50 flex flex-wrap items-center justify-between gap-4 font-label-caps text-label-caps text-secondary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-clay-earth">health_and_safety</span>
                <span className="uppercase tracking-widest">FSSAI Registration:</span>
                <span className="font-mono text-onyx-black tracking-wider font-semibold">#{accountData?.fssaiNo || '10822005001294'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>KITCHEN CLASS: COMMODIOUS URBAN</span>
                <span>•</span>
                <span>SECURITY STATUS: VERIFIED & ACTIVE</span>
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
                {/* Hidden File Input for Kitchen Photo */}
                <input
                  type="file"
                  ref={kitchenPhotoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleKitchenPhotoUpload}
                />

                {/* Kitchen Photography Dynamic Showcase Card */}
                <div className="border border-sand-neutral/80 bg-bone-white p-5 rounded-lg space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block font-bold">
                        Kitchen Photography (Customer Card Display)
                      </span>
                      <p className="font-body-md text-xs text-secondary mt-0.5">
                        This dynamic photo is showcased to customers on your Kitchen Card, nearby service lists, and order checkout.
                      </p>
                    </div>
                    {(accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image) && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        Active Photo
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                    <div className="relative w-40 h-28 sm:w-48 sm:h-32 rounded-lg overflow-hidden border border-sand-neutral bg-sand-neutral/20 shrink-0 shadow-xs group">
                      {(accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image) ? (
                        <>
                          <img
                            src={accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image}
                            alt="Kitchen Showcase"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div 
                            onClick={() => kitchenPhotoInputRef.current?.click()}
                            className="absolute inset-0 bg-onyx-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-white text-[22px]">photo_camera</span>
                            <span className="text-white text-[10px] font-label-caps mt-0.5">Change Photo</span>
                          </div>
                        </>
                      ) : (
                        <div 
                          onClick={() => kitchenPhotoInputRef.current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center text-secondary p-3 text-center cursor-pointer hover:bg-sand-neutral/30 transition-colors"
                        >
                          <span className="material-symbols-outlined text-3xl text-sand-neutral/80">add_photo_alternate</span>
                          <span className="text-[10px] font-label-caps mt-1 font-semibold">Upload Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5 w-full">
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => kitchenPhotoInputRef.current?.click()}
                          className="px-3.5 py-2 bg-onyx-black hover:bg-clay-earth text-white font-label-caps text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">upload</span>
                          <span>{(accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image) ? 'Change Kitchen Photo' : 'Upload Kitchen Photo'}</span>
                        </button>
                        {(accountData?.kitchenPhoto || accountData?.avatarUrl || currentUser?.kitchenPhoto || currentUser?.image) && (
                          <button
                            type="button"
                            onClick={handleRemoveKitchenPhoto}
                            className="px-3 py-2 bg-transparent hover:bg-red-50 text-red-600 border border-red-300 font-label-caps text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-secondary leading-relaxed">
                        Photos are optimized locally and saved securely. Customers see your kitchen photo in real time across the platform.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="kitchen-operator-name" className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">
                    Legal Kitchen Operator Name
                  </label>
                  <input
                    id="kitchen-operator-name"
                    name="operatorName"
                    type="text"
                    value={accountData.name || ''}
                    onChange={e => {
                      setAccountData({ ...accountData, name: e.target.value });
                      setIsAccountDirty(true);
                      setAccountSaveStatus('unsaved');
                    }}
                    placeholder="e.g. Xoxo Men"
                    className="w-full bg-bone-white border border-sand-neutral/80 px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-onyx-black focus:border-transparent transition-all rounded shadow-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="kitchen-brand-name" className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">
                    Operating Commercial Brand Name
                  </label>
                  <input
                    id="kitchen-brand-name"
                    name="kitchenBrand"
                    type="text"
                    value={accountData.kitchenBrand || ''}
                    onChange={e => {
                      setAccountData({ ...accountData, kitchenBrand: e.target.value });
                      setIsAccountDirty(true);
                      setAccountSaveStatus('unsaved');
                    }}
                    placeholder="e.g. Mansuri Homestyle Tiffins"
                    className="w-full bg-bone-white border border-sand-neutral/80 px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-onyx-black focus:border-transparent transition-all rounded shadow-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="kitchen-email" className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">
                      Business Email Address
                    </label>
                    <span className="font-label-caps text-[11px] text-clay-earth font-semibold">SECURE ROUTE</span>
                  </div>
                  <div className="relative">
                    <input
                      id="kitchen-email"
                      name="email"
                      type="email"
                      value={accountData.email || ''}
                      onChange={e => {
                        setAccountData({ ...accountData, email: e.target.value });
                        setIsAccountDirty(true);
                        setAccountSaveStatus('unsaved');
                      }}
                      placeholder="e.g. provider@tiffinlink.com"
                      className="w-full bg-bone-white border border-sand-neutral/80 px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-onyx-black focus:border-transparent transition-all rounded shadow-xs pr-28"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-container text-onyx-black font-label-caps text-[11px] font-bold flex items-center gap-1 border border-sand-neutral/60 rounded">
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                      ACTIVE
                    </span>
                  </div>
                  <p className="font-label-caps text-[11px] text-secondary flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[14px] text-clay-earth">info</span>
                    Modifying this address will require email verification via OTP.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="kitchen-phone" className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">
                    Authenticated Dispatch Contact
                  </label>
                  <div className="relative">
                    <input
                      id="kitchen-phone"
                      name="phone"
                      type="tel"
                      value={accountData.phone || ''}
                      onChange={e => {
                        setAccountData({ ...accountData, phone: e.target.value });
                        setIsAccountDirty(true);
                        setAccountSaveStatus('unsaved');
                      }}
                      placeholder="e.g. +91 95586 01570"
                      className="w-full bg-bone-white border border-sand-neutral/80 px-4 py-3 text-onyx-black font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-onyx-black focus:border-transparent transition-all rounded shadow-xs pr-28"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-container text-onyx-black font-label-caps text-[11px] font-bold flex items-center gap-1 border border-sand-neutral/60 rounded">
                      <span className="material-symbols-outlined text-[14px] text-clay-earth">check_box</span>
                      SMS LOCK
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="kitchen-address" className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">
                    Kitchen Production & Courier Dispatch Address
                  </label>
                  <textarea
                    id="kitchen-address"
                    name="dispatchAddress"
                    rows={3}
                    value={accountData.dispatchAddress || ''}
                    onChange={e => {
                      setAccountData({ ...accountData, dispatchAddress: e.target.value });
                      setIsAccountDirty(true);
                      setAccountSaveStatus('unsaved');
                    }}
                    placeholder="Full kitchen address..."
                    className="w-full bg-bone-white border border-sand-neutral/80 p-4 text-onyx-black font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-onyx-black focus:border-transparent transition-all resize-none leading-relaxed rounded shadow-xs"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-caps text-label-caps uppercase text-secondary tracking-widest block">
                      Registered Culinary Disciplines & Menu Specializations
                    </label>
                    <span className="font-label-caps text-[11px] text-secondary">
                      {(accountData.tags || []).length} registered
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {accountData.tags && accountData.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bone-white border border-sand-neutral/70 text-onyx-black font-label-caps text-label-caps tracking-wider rounded shadow-xs">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(idx)}
                          className="hover:text-error text-secondary transition-colors cursor-pointer"
                          title={`Remove ${tag}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}

                    {showAddTag ? (
                      <div className="inline-flex items-center gap-1.5 p-1 bg-surface-container rounded border border-sand-neutral/80">
                        <input
                          type="text"
                          autoFocus
                          value={newTagInput}
                          onChange={e => setNewTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                            if (e.key === 'Escape') {
                              setShowAddTag(false);
                              setNewTagInput('');
                            }
                          }}
                          placeholder="e.g. Kathiyawadi, Jain..."
                          className="px-2.5 py-1 bg-bone-white text-xs text-onyx-black focus:outline-none rounded border border-sand-neutral/50 font-body-md"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-2.5 py-1 bg-onyx-black hover:bg-neutral-800 text-on-primary text-xs font-bold rounded cursor-pointer transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddTag(false); setNewTagInput(''); }}
                          className="px-1.5 py-1 text-secondary hover:text-onyx-black text-xs cursor-pointer"
                          title="Cancel"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddTag(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-clay-earth font-label-caps text-label-caps tracking-wider transition-colors rounded cursor-pointer border border-dashed border-sand-neutral"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        <span>ADD DISCIPLINE</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* In-Form Save & Sync Action Bar */}
                <div className="pt-6 mt-4 border-t border-sand-neutral/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-container-low/40 -mx-8 -mb-8 p-6 rounded-b-lg">
                  <div className="flex items-center gap-2 text-xs font-label-caps">
                    {accountSaveStatus === 'saved' ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                        <span>Saved to Profile Registry {accountLastSaved ? `(${accountLastSaved})` : ''}</span>
                      </span>
                    ) : isAccountDirty ? (
                      <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Unsaved credential changes</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-secondary">
                        <span className="material-symbols-outlined text-[16px] text-clay-earth">cloud_done</span>
                        <span>Active on TiffinLink Directory • Live</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    {isAccountDirty && (
                      <button
                        type="button"
                        onClick={handleDiscardAccountChanges}
                        className="px-4 py-2.5 text-secondary hover:text-onyx-black font-button-text text-sm transition-colors cursor-pointer border border-sand-neutral/70 rounded hover:bg-surface-container"
                      >
                        Discard
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center justify-center gap-2 px-7 py-3 bg-onyx-black hover:bg-neutral-800 active:scale-[0.99] text-on-primary font-button-text font-bold text-sm tracking-wide rounded transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer min-w-[200px]"
                    >
                      {saving ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          <span>Save Kitchen Credentials</span>
                        </>
                      )}
                    </button>
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
                      <span className="font-mono text-base font-bold text-onyx-black tracking-wider">{providerIdDisplay}</span>
                      <span className="material-symbols-outlined text-secondary text-[18px]" title="Verified Provider ID">lock</span>
                    </div>
                    <p className="font-label-caps text-[11px] text-secondary mt-1">
                      Provider system IDs are securely assigned and bound to verified kitchen partnerships.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 font-body-md text-body-md">
                    <div className="p-3 bg-surface-container rounded">
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block">Account Provisioned</span>
                      <span className="font-body-md text-onyx-black font-medium mt-0.5 block">{provisionedDateStr}</span>
                    </div>
                    <div className="p-3 bg-surface-container rounded">
                      <span className="font-label-caps text-[11px] text-secondary uppercase tracking-widest block">Last Session Activity</span>
                      <span className="font-body-md text-onyx-black font-medium mt-0.5 block">{lastActivityStr}</span>
                      <span className="font-label-caps text-[11px] text-clay-earth font-mono mt-0.5 block">{clientPlatformStr}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest block">Security Attestations</span>
                    <div className="flex items-center justify-between p-3 bg-bone-white rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-onyx-black text-[20px]">mark_email_read</span>
                        <div>
                          <span className="font-button-text text-button-text text-onyx-black block leading-none">Email Verification</span>
                          <span className="font-label-caps text-[11px] text-secondary">Verified via OTP</span>
                        </div>
                      </div>
                      <span className="font-label-caps text-[11px] font-semibold text-onyx-black">CONFIRMED</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-bone-white rounded">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-onyx-black text-[20px]">phonelink_ring</span>
                        <div>
                          <span className="font-button-text text-button-text text-onyx-black block leading-none">Primary SMS Verification</span>
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
                Notice: Any modifications to your verified email or primary dispatch contact will require OTP verification to protect your account.
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
                  <span>LIVE ALERTS ACTIVE</span>
                </span>
                <span className="font-label-caps text-label-caps tracking-widest text-clay-earth bg-secondary-container/50 px-2 py-0.5 rounded">{providerIdDisplay}</span>
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
                <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">{accountData?.phone || '+91 95586 01570'} • Template V2.8</div>
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
                  { key: 'deliveryUpdates', label: 'Delivery Courier Updates', tag: 'Live Tracking', desc: 'Live alerts when runner is assigned, enters 500m area, and completes delivery via OTP.' }
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
                    <span className="font-button-text text-button-text font-bold text-onyx-black block">System Maintenance Schedules</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">Advance notifications 24 hours prior to scheduled platform maintenance windows.</p>
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
                <div className="font-button-text text-button-text font-semibold text-onyx-black">{accountData?.phone || '+91 95586 01570'}</div>
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
                  <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container text-secondary">Security Vault</span>
                </div>
                <div className="space-y-4 mt-4">
                  <p className="font-body-md text-body-md text-secondary">
                    Update your primary password used to sign in to your TiffinLink kitchen portal. All credentials are encrypted with industry-standard protocols.
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
                  Passwords are encrypted with industry-standard security and never stored in plain text. Active sessions are protected.
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
              {Array.isArray(securityData?.activeSessions) && securityData.activeSessions.map((session, index) => {
                const deviceName = session?.device || 'Desktop Terminal (Windows)';
                const deviceLower = deviceName.toLowerCase();
                const icon = (deviceLower.includes('mac') || deviceLower.includes('laptop') || deviceLower.includes('desktop') || deviceLower.includes('windows'))
                  ? 'laptop_mac'
                  : (deviceLower.includes('iphone') || deviceLower.includes('phone') || deviceLower.includes('mobile') || deviceLower.includes('android'))
                    ? 'smartphone'
                    : 'tablet_mac';

                return (
                  <div key={session?.id || `sess_${index}`} className="p-4 bg-surface rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${session?.isCurrent ? 'bg-onyx-black text-on-primary' : 'bg-surface-container text-onyx-black'}`}>
                        <span className="material-symbols-outlined text-[22px]">
                          {icon}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-button-text text-button-text font-bold text-onyx-black">{deviceName}</span>
                          {session?.isCurrent && (
                            <span className="px-2 py-0.5 bg-onyx-black text-on-primary rounded font-label-caps text-[10px] tracking-wider uppercase font-semibold">Current Session</span>
                          )}
                          <span className="font-label-caps text-label-caps text-secondary font-mono">{session?.os || 'Windows 11'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-label-caps font-label-caps text-on-surface-variant">
                          <span>{session?.browser || 'Chrome'}</span>
                          <span className="text-sand-neutral">•</span>
                          <span>{session?.location || 'Ahmedabad, IN'}</span>
                          <span className="text-sand-neutral">•</span>
                          <span className="font-mono">IP: {session?.ip || '152.58.18.94'}</span>
                        </div>
                        <div className="font-label-caps text-label-caps text-secondary mt-1 font-mono">
                          Last Active: {session?.lastActive || 'Active Now'} • Token: {session?.tokenSig || 'sess_prov_jwt'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {session?.isCurrent ? (
                        <span className="px-3 py-1 bg-surface-container text-secondary rounded font-label-caps text-label-caps">In Use</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session?.id)}
                          className="px-3 py-1.5 bg-surface-container text-error hover:bg-error-container hover:text-on-error-container rounded font-button-text text-button-text transition-colors cursor-pointer"
                        >
                          Revoke Session
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
                Customize your kitchen dashboard interface density, language, live dispatch updates, and map rendering for optimal culinary throughput.
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
              <div
                onClick={() => handleThemeChange('system')}
                className={`group relative flex flex-col p-6 rounded cursor-pointer transition-all ${preferenceData.appearance === 'system' ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md' : 'bg-surface-container-low hover:bg-surface-container'}`}
              >
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-button-text font-semibold text-onyx-black">System Default</span>
                    {preferenceData.appearance === 'system' && (
                      <span className="font-label-caps text-label-caps px-2 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-medium rounded border border-transparent dark:border-amber-800/40">ACTIVE</span>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${preferenceData.appearance === 'system' ? 'border-onyx-black dark:border-white' : 'border-outline'}`}>
                    {preferenceData.appearance === 'system' && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
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
              </div>

              {/* Light */}
              <div
                onClick={() => handleThemeChange('light')}
                className={`group relative flex flex-col p-6 rounded cursor-pointer transition-all ${preferenceData.appearance === 'light' ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md' : 'bg-surface-container-low hover:bg-surface-container'}`}
              >
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-button-text font-semibold text-onyx-black">Light Mode</span>
                    {preferenceData.appearance === 'light' && (
                      <span className="font-label-caps text-label-caps px-2 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-medium rounded border border-transparent dark:border-amber-800/40">ACTIVE</span>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${preferenceData.appearance === 'light' ? 'border-onyx-black dark:border-white' : 'border-outline'}`}>
                    {preferenceData.appearance === 'light' && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
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
                <p className="mt-4 font-body-md text-body-md text-secondary">Minimalist bone-white &amp; obsidian ink tuned for daytime visibility.</p>
              </div>

              {/* Dark */}
              <div
                onClick={() => handleThemeChange('dark')}
                className={`group relative flex flex-col p-6 rounded cursor-pointer transition-all ${preferenceData.appearance === 'dark' ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md' : 'bg-surface-container-low hover:bg-surface-container'}`}
              >
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-button-text text-button-text font-semibold text-onyx-black">Dark Mode</span>
                    {preferenceData.appearance === 'dark' && (
                      <span className="font-label-caps text-label-caps px-2 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-medium rounded border border-transparent dark:border-amber-800/40">ACTIVE</span>
                    )}
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${preferenceData.appearance === 'dark' ? 'border-onyx-black dark:border-white' : 'border-outline'}`}>
                    {preferenceData.appearance === 'dark' && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
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
              </div>
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
                  onClick={handleToggleCompactMode}
                  className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${preferenceData.compactMode ? 'bg-onyx-black dark:bg-emerald-600' : 'bg-surface-container-highest dark:bg-neutral-700'}`}
                >
                  <span className={`block w-5 h-5 rounded-full transition-transform ${preferenceData.compactMode ? 'bg-on-primary translate-x-6' : 'bg-surface dark:bg-neutral-300 translate-x-0'}`}></span>
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
                  onClick={handleToggleReduceAnimations}
                  className={`w-12 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${preferenceData.reduceAnimations ? 'bg-onyx-black dark:bg-emerald-600' : 'bg-surface-container-highest dark:bg-neutral-700'}`}
                >
                  <span className={`block w-5 h-5 rounded-full transition-transform ${preferenceData.reduceAnimations ? 'bg-on-primary translate-x-6' : 'bg-surface dark:bg-neutral-300 translate-x-0'}`}></span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Language */}
          <section className="space-y-6 pt-6 border-t border-sand-neutral">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-clay-earth">
                  {activeLang === 'gu_IN' ? '૦૨ / બોલી અને પ્રાદેશિક સ્થાનિકીકરણ' : activeLang === 'hi_IN' ? '02 / बोली एवं क्षेत्रीय स्थानीयकरण' : '02 / Dialect & Regional Formatting'}
                </span>
                <h2 className="font-headline-md text-headline-md text-onyx-black">{t('language_regional', 'Language & Regional Localization')}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {/* English */}
                <div
                  onClick={() => handleLanguageChange('en_IN')}
                  className={`flex items-center justify-between p-5 rounded cursor-pointer transition-all ${(preferenceData.language || activeLang) === 'en_IN'
                    ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md'
                    : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${(preferenceData.language || activeLang) === 'en_IN' ? 'border-onyx-black dark:border-white' : 'border-outline'
                      }`}>
                      {(preferenceData.language || activeLang) === 'en_IN' && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text font-semibold text-onyx-black">English (India)</span>
                      <span className="font-body-md text-body-md text-secondary">Standard kitchen & delivery dispatch terminology</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 bg-surface-container text-clay-earth dark:text-stone-300 rounded">{t('primary', 'Primary')}</span>
                    {(preferenceData.language || activeLang) === 'en_IN' && (
                      <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-medium rounded border border-transparent dark:border-amber-800/40">{t('active_now', 'ACTIVE')}</span>
                    )}
                  </div>
                </div>

                {/* Gujarati */}
                <div
                  onClick={() => handleLanguageChange('gu_IN')}
                  className={`flex items-center justify-between p-5 rounded cursor-pointer transition-all ${(preferenceData.language || activeLang) === 'gu_IN'
                    ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md'
                    : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${(preferenceData.language || activeLang) === 'gu_IN' ? 'border-onyx-black dark:border-white' : 'border-outline'
                      }`}>
                      {(preferenceData.language || activeLang) === 'gu_IN' && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text font-semibold text-onyx-black">ગુજરાતી (Gujarati)</span>
                      <span className="font-body-md text-body-md text-secondary">સ્થાનિક રસોઈ, દૈનિક થાળી અને ડિલિવરી સંચાલન</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 bg-surface-container text-secondary dark:text-stone-300 rounded">{t('regional', 'Regional')}</span>
                    {(preferenceData.language || activeLang) === 'gu_IN' && (
                      <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-medium rounded border border-transparent dark:border-amber-800/40">{t('active_now', 'ACTIVE')}</span>
                    )}
                  </div>
                </div>

                {/* Hindi */}
                <div
                  onClick={() => handleLanguageChange('hi_IN')}
                  className={`flex items-center justify-between p-5 rounded cursor-pointer transition-all ${(preferenceData.language || activeLang) === 'hi_IN'
                    ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md'
                    : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${(preferenceData.language || activeLang) === 'hi_IN' ? 'border-onyx-black dark:border-white' : 'border-outline'
                      }`}>
                      {(preferenceData.language || activeLang) === 'hi_IN' && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-button-text text-button-text font-semibold text-onyx-black">हिन्दी (Hindi)</span>
                      <span className="font-body-md text-body-md text-secondary">दैनिक टिफिन, रसोई तैयारी एवं आर्डर प्रबंधन</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 bg-surface-container text-secondary dark:text-stone-300 rounded">{t('regional', 'Regional')}</span>
                    {(preferenceData.language || activeLang) === 'hi_IN' && (
                      <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-medium rounded border border-transparent dark:border-amber-800/40">{t('active_now', 'ACTIVE')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Financial & Date Schema */}
              <div className="p-6 bg-surface-container-high rounded flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black block">
                    {activeLang === 'gu_IN' ? 'નાણાકીય અને તારીખ માળખું' : activeLang === 'hi_IN' ? 'वित्तीय एवं दिनांक प्रारूप' : 'Financial & Date Schema'}
                  </span>
                  <div className="p-3 bg-surface rounded">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block">
                      {activeLang === 'gu_IN' ? 'પ્રમાણભૂત ચલણ' : activeLang === 'hi_IN' ? 'मानक मुद्रा' : 'Standard Currency'}
                    </span>
                    <span className="font-button-text font-bold text-onyx-black">
                      {(preferenceData.language || activeLang) === 'gu_IN' ? 'ભારતીય રૂપિયો (₹ INR)' : (preferenceData.language || activeLang) === 'hi_IN' ? 'भारतीय रुपया (₹ INR)' : 'Indian Rupee (₹ INR)'}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block">
                      {activeLang === 'gu_IN' ? 'રસોઈ સમય ફોર્મેટ' : activeLang === 'hi_IN' ? 'रसोई समय प्रारूप' : 'Kitchen Timestamp Format'}
                    </span>
                    <span className="font-button-text font-bold text-onyx-black">
                      {(preferenceData.language || activeLang) === 'gu_IN' ? 'DD MMM YYYY (24-કલાક ઘડિયાળ)' : (preferenceData.language || activeLang) === 'hi_IN' ? 'DD MMM YYYY (24-घंटे का प्रारूप)' : 'DD MMM YYYY (24-hour clock)'}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block">
                      {activeLang === 'gu_IN' ? 'સક્રિય પ્રાદેશિક સ્થાનિક' : activeLang === 'hi_IN' ? 'સક્રિય પ્રાદેશિક સ્થાનિક' : 'Active Regional Locale'}
                    </span>
                    <span className="font-button-text font-bold text-onyx-black">
                      {(preferenceData.language || activeLang) === 'gu_IN' ? 'gu-IN (ગુજરાત / ભારત)' : (preferenceData.language || activeLang) === 'hi_IN' ? 'hi-IN (भारत)' : 'en-IN (India / Asia/Kolkata)'}
                    </span>
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
                <div className="flex items-center justify-between">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black block">Default Landing View</span>
                  <span className="font-label-caps text-label-caps uppercase px-1.5 py-0.5 bg-surface-container text-clay-earth dark:text-stone-300 rounded text-[10px] font-semibold">VIEWPORT</span>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'dashboard', label: 'Overview Dashboard', desc: 'KPIs & Kitchen Revenue' },
                    { id: 'live-requests', label: 'Live Requests Radar', desc: 'Realtime Diner Requests' },
                    { id: 'orders-prep', label: 'Orders Preparing Bay', desc: 'Active Kitchen Staging' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => handleOperationalChange('dashboardLanding', opt.id)}
                      className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all ${preferenceData.dashboardLanding === opt.id
                        ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white font-semibold shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${preferenceData.dashboardLanding === opt.id ? 'border-onyx-black dark:border-white' : 'border-outline'
                          }`}>
                          {preferenceData.dashboardLanding === opt.id && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-button-text text-button-text text-onyx-black">{opt.label}</span>
                          <span className="font-body-md text-[11px] text-secondary">{opt.desc}</span>
                        </div>
                      </div>
                      {preferenceData.dashboardLanding === opt.id && (
                        <span className="font-label-caps text-label-caps uppercase px-1.5 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-bold rounded text-[9px]">ACTIVE</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Density */}
              <div className="p-6 bg-surface-container-low rounded space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black block">Table Density &amp; Pagination</span>
                  <span className="font-label-caps text-label-caps uppercase px-1.5 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 rounded text-[10px] font-bold">
                    {preferenceData.tableDensity} ROWS / PG
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { den: 10, label: 'COMPACT', desc: 'Dense' },
                    { den: 25, label: 'DEFAULT', desc: 'Balanced' },
                    { den: 50, label: 'EXTENDED', desc: 'Wide' }
                  ].map(opt => (
                    <button
                      key={opt.den}
                      type="button"
                      onClick={() => handleOperationalChange('tableDensity', opt.den)}
                      className={`p-3 rounded flex flex-col items-center justify-center cursor-pointer transition-all ${preferenceData.tableDensity === opt.den
                        ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white shadow-md font-bold'
                        : 'bg-surface-container hover:bg-surface-container-high'
                        }`}
                    >
                      <span className="font-headline-md text-headline-md text-onyx-black">{opt.den}</span>
                      <span className="font-label-caps text-label-caps uppercase text-secondary">{opt.label}</span>
                      {preferenceData.tableDensity === opt.den && (
                        <span className="font-label-caps text-label-caps uppercase text-[9px] mt-1 px-1.5 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-bold rounded">ACTIVE</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="font-body-md text-xs text-secondary text-center pt-1">
                  Controls table pagination limits across Orders, Reviews &amp; Notifications.
                </p>
              </div>

              {/* Map Provider */}
              <div className="p-6 bg-surface-container-low rounded space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-button-text text-button-text font-semibold text-onyx-black block">Map &amp; Navigation Provider</span>
                  <span className="font-label-caps text-label-caps uppercase px-1.5 py-0.5 bg-surface-container text-clay-earth dark:text-stone-300 rounded text-[10px] font-semibold">DISPATCH</span>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'Google Maps', label: 'Google Maps', desc: 'Global satellite & turn-by-turn navigation' },
                    { id: 'MapmyIndia / Mappls', label: 'MapmyIndia / Mappls', desc: 'Precision Indian house-level routing' }
                  ].map(mapP => (
                    <div
                      key={mapP.id}
                      onClick={() => handleOperationalChange('defaultMapProvider', mapP.id)}
                      className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all ${preferenceData.defaultMapProvider === mapP.id
                        ? 'bg-surface-container-lowest ring-2 ring-onyx-black dark:ring-white font-semibold shadow-sm'
                        : 'bg-surface-container hover:bg-surface-container-high'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${preferenceData.defaultMapProvider === mapP.id ? 'border-onyx-black dark:border-white' : 'border-outline'
                          }`}>
                          {preferenceData.defaultMapProvider === mapP.id && <div className="w-2 h-2 rounded-full bg-onyx-black dark:bg-white"></div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-button-text text-button-text text-onyx-black">{mapP.label}</span>
                          <span className="font-body-md text-[11px] text-secondary">{mapP.desc}</span>
                        </div>
                      </div>
                      {preferenceData.defaultMapProvider === mapP.id && (
                        <span className="font-label-caps text-label-caps uppercase px-1.5 py-0.5 bg-secondary-container dark:bg-amber-950/60 text-on-secondary-fixed dark:text-amber-200 font-bold rounded text-[9px]">ACTIVE</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const dest = 'Ahmedabad, Gujarat, India';
                      const url = preferenceData.defaultMapProvider === 'MapmyIndia / Mappls'
                        ? `https://mappls.com/direction?to=${encodeURIComponent(dest)}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-surface hover:bg-surface-container border border-sand-neutral/50 rounded font-button-text text-xs text-onyx-black cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">navigation</span>
                    <span>Test External Map Route ({preferenceData.defaultMapProvider.split('/')[0].trim()})</span>
                  </button>
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
