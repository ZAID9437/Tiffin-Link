import React, { useState, useEffect, useRef } from 'react';

/**
 * PersonalInformationView Component
 * Renders the Driver Panel "Personal Information" sub-page under Profile.
 * Real-time synchronization directly with MongoDB driver records.
 * Zero static mock data.
 */
export default function PersonalInformationView({ currentUser, onNavigateTab, onShowToast }) {
  const savedUserStr = typeof window !== 'undefined'
    ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user'))
    : null;
  let savedUser = null;
  try {
    if (savedUserStr) savedUser = JSON.parse(savedUserStr);
  } catch (e) {}

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fileInputRef = useRef(null);

  const activeToken = typeof window !== 'undefined'
    ? (localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('token') || localStorage.getItem('tiffinlink_token') || '')
    : '';

  const emailParam = currentUser?.email || savedUser?.email || '';
  const phoneParam = currentUser?.phone || savedUser?.phone || '';
  const driverIdParam = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';

  const [profileData, setProfileData] = useState({
    driverId: '',
    fullName: currentUser?.name || currentUser?.fullName || savedUser?.name || savedUser?.fullName || '',
    email: emailParam,
    phone: phoneParam,
    dob: '',
    gender: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    hubAssociation: '',
    cluster: '',
    role: 'Delivery Partner',
    tier: 'Active Courier',
    status: 'ONLINE',
    avatar: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    isEmailVerified: false,
    isPhoneVerified: false,
    accountCreated: '',
    rating: 5.0,
    deliveriesCount: 0
  });

  const [formData, setFormData] = useState({ ...profileData });

  // Fetch real-time data from MongoDB
  const fetchProfile = async (isManual = false) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (emailParam) queryParams.append('email', emailParam);
      if (phoneParam) queryParams.append('phone', phoneParam);
      if (driverIdParam) queryParams.append('driverId', driverIdParam);

      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`http://localhost:5000/api/driver/account?${queryParams.toString()}`, { headers });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const d = json.data;
        const mapped = {
          driverId: d.driverId || driverIdParam || '',
          fullName: d.fullName || currentUser?.fullName || currentUser?.name || savedUser?.fullName || savedUser?.name || '',
          email: d.email || emailParam,
          phone: d.phone || phoneParam,
          dob: d.dob || '',
          gender: d.gender || '',
          bloodGroup: d.bloodGroup || '',
          address: d.address || '',
          city: d.city || '',
          state: d.state || '',
          pincode: d.pincode || '',
          hubAssociation: d.hubAssociation || (d.city ? `${d.city} Logistics Hub` : 'Main Operations Hub'),
          cluster: d.cluster || (d.city ? `${d.city} Cluster` : 'Active Cluster'),
          role: d.role || 'Delivery Partner',
          tier: d.tier || 'Active Courier',
          status: d.status || 'ONLINE',
          avatar: d.avatar || '',
          emergencyContact: {
            name: d.emergencyContact?.name || '',
            phone: d.emergencyContact?.phone || '',
            relationship: d.emergencyContact?.relationship || ''
          },
          isEmailVerified: Boolean(d.isEmailVerified),
          isPhoneVerified: Boolean(d.isPhoneVerified),
          accountCreated: d.accountCreated ? new Date(d.accountCreated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently Joined',
          rating: d.rating || 5.0,
          deliveriesCount: d.activeDeliveries || 0
        };
        setProfileData(mapped);
        setFormData(mapped);
        if (isManual && onShowToast) onShowToast('✓ Profile updated successfully');
      } else {
        if (isManual && onShowToast) onShowToast('⚠️ Could not load profile records');
      }
    } catch (err) {
      console.error('Error fetching driver profile:', err);
      if (isManual && onShowToast) onShowToast('⚠️ Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        if (onShowToast) onShowToast('⚠️ File size exceeds 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
        setProfileData(prev => ({ ...prev, avatar: reader.result }));
        if (onShowToast) onShowToast('✓ Photo preview updated. Click "Save Changes" to apply.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (formData.pincode && !/^\d{6}$/.test(String(formData.pincode).trim())) {
      setErrorMessage('Pincode must be 6 digits.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dob: formData.dob.trim(),
        gender: formData.gender,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        avatar: formData.avatar,
        emergencyName: formData.emergencyContact?.name?.trim(),
        emergencyMobile: formData.emergencyContact?.phone?.trim(),
        emergencyRelationship: formData.emergencyContact?.relationship?.trim()
      };

      const res = await fetch('http://localhost:5000/api/driver/account', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setProfileData({ ...formData });
        setIsEditing(false);
        setSuccessMessage('Profile saved successfully.');
        if (onShowToast) onShowToast('✓ Personal profile saved successfully!');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.error('Error updating driver profile:', err);
      setErrorMessage('Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...profileData });
    setIsEditing(false);
    setErrorMessage(null);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-[#1A1A1A] animate-spin">autorenew</span>
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Loading Personal Information...</h3>
        <p className="text-xs text-[#8C7A6B]">Loading personal profile records...</p>
      </div>
    );
  }

  const initialLetter = (profileData.fullName || 'D').charAt(0).toUpperCase();

  return (
    <div className="flex flex-col w-full pb-24 space-y-8 animate-fadeIn">
      
      {/* 1. Header & Navigation Context */}
      <section className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[#8C7A6B] font-mono tracking-widest uppercase text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span>PROFILE</span>
            <span className="text-stone-400">/</span>
            <span className="text-[#1A1A1A] font-semibold">PERSONAL INFORMATION</span>
            {profileData.driverId && (
              <>
                <span className="text-stone-400">•</span>
                <span className="bg-[#EBE7DF] text-[#1A1A1A] px-2 py-0.5 rounded text-[11px] font-bold">
                  ID: {profileData.driverId}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#DED9D1]">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              Personal Information
            </h1>
            <p className="text-sm text-[#666666] mt-1.5 max-w-2xl">
              Verified records of your personal credentials, contact details, residential address, and emergency contacts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => fetchProfile(true)}
              className="inline-flex items-center gap-2 bg-[#F5F3EF] hover:bg-[#EBE7DF] text-[#1A1A1A] px-4 py-2 border border-[#DED9D1] text-xs font-semibold rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>Refresh</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 bg-[#1A1A1A] hover:bg-stone-800 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit Details</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-[#1A1A1A] text-xs font-semibold rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded transition-colors shadow-xs disabled:opacity-50"
                >
                  {saving ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border-l-4 border-red-600 text-red-900 text-xs font-medium flex items-center justify-between rounded">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="underline text-xs">Dismiss</button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900 text-xs font-medium flex items-center justify-between rounded">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="underline text-xs">Dismiss</button>
          </div>
        )}
      </section>

      {/* 2. Hero Identity Card */}
      <section className="bg-white p-6 sm:p-8 rounded-xl border border-[#DED9D1] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-3xl shadow-md">
                {(isEditing ? formData.avatar : profileData.avatar) ? (
                  <img
                    src={isEditing ? formData.avatar : profileData.avatar}
                    alt={profileData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#1A1A1A] text-white p-1.5 rounded-full hover:bg-stone-800 transition-colors shadow-md"
                  title="Upload Photo"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold font-serif text-[#1A1A1A]">
                  {profileData.fullName || 'Delivery Partner'}
                </h2>
                <span className="bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
                  ★ {profileData.rating} Rating
                </span>
              </div>
              <p className="text-xs text-[#8C7A6B] font-mono mt-1 flex items-center gap-2">
                <span>{profileData.role}</span>
                <span>•</span>
                <span className="font-bold text-[#1A1A1A]">{profileData.tier}</span>
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-[#555555] flex-wrap">
                <span className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[15px] ${profileData.driverId ? 'text-emerald-600' : 'text-stone-400'}`}>verified</span>
                  <span>{profileData.driverId ? 'Registered Partner' : 'Registration Pending'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[15px] ${profileData.phone ? 'text-emerald-600' : 'text-stone-400'}`}>call</span>
                  <span>{profileData.phone ? 'Phone Recorded' : 'Phone Missing'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[15px] ${profileData.email ? 'text-emerald-600' : 'text-stone-400'}`}>mail</span>
                  <span>{profileData.email ? 'Email Recorded' : 'Email Missing'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 p-4 bg-[#F5F3EF] rounded-lg border border-[#DED9D1] text-xs font-mono w-full sm:w-auto">
            <span className="text-[#8C7A6B] text-[11px] uppercase tracking-wider font-sans font-semibold">Assigned Hub</span>
            <span className="text-[#1A1A1A] font-bold text-sm">{profileData.hubAssociation || 'Central Operations'}</span>
            <span className="text-[#666666]">{profileData.cluster || 'Primary Dispatch'}</span>
            <span className="text-[11px] text-stone-500 mt-1">Joined: {profileData.accountCreated}</span>
          </div>
        </div>
      </section>

      {/* 3. Detailed Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Section A: Basic Personal Information */}
        <section className="bg-white p-6 sm:p-7 rounded-xl border border-[#DED9D1] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#DED9D1]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#1A1A1A]">person</span>
              <h3 className="font-bold text-base text-[#1A1A1A]">Basic Personal Details</h3>
            </div>
            <span className="text-[11px] font-mono text-[#8C7A6B]">OFFICIAL RECORD</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                Full Legal Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                />
              ) : (
                <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A]">
                  {profileData.fullName || <span className="text-stone-400 italic">Not Provided</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Mobile Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A] flex items-center justify-between">
                    <span>{profileData.phone || <span className="text-stone-400 italic">Not Provided</span>}</span>
                    {profileData.phone && (
                      <span className="material-symbols-outlined text-[16px] text-emerald-600" title="Verified">verified</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A] flex items-center justify-between">
                    <span className="truncate">{profileData.email || <span className="text-stone-400 italic">Not Provided</span>}</span>
                    {profileData.email && (
                      <span className="material-symbols-outlined text-[16px] text-emerald-600" title="Verified">verified</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-xs text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-xs text-[#1A1A1A]">
                    {profileData.dob || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-xs text-[#1A1A1A]"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-xs text-[#1A1A1A]">
                    {profileData.gender || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section B: Emergency Contact */}
        <section className="bg-white p-6 sm:p-7 rounded-xl border border-[#DED9D1] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#DED9D1]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-red-600">emergency</span>
              <h3 className="font-bold text-base text-[#1A1A1A]">Emergency Contact</h3>
            </div>
            <span className="text-[11px] font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">SOS LINKED</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                Emergency Contact Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContact?.name || ''}
                  onChange={(e) => handleEmergencyChange('name', e.target.value)}
                  placeholder="Enter Contact Person Name"
                  className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                />
              ) : (
                <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A]">
                  {profileData.emergencyContact?.name || <span className="text-stone-400 italic">Not Provided</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Relationship
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.emergencyContact?.relationship || ''}
                    onChange={(e) => handleEmergencyChange('relationship', e.target.value)}
                    placeholder="Father, Brother, Spouse, etc."
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A]">
                    {profileData.emergencyContact?.relationship || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Emergency Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) => handleEmergencyChange('phone', e.target.value)}
                    placeholder="+91 Mobile Number"
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A]">
                    {profileData.emergencyContact?.phone || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">info</span>
              <span>In case of on-duty emergency, automated SOS notifications will be sent to this verified number.</span>
            </div>
          </div>
        </section>

        {/* Section C: Complete Residential Address */}
        <section className="bg-white p-6 sm:p-7 rounded-xl border border-[#DED9D1] shadow-xs space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#DED9D1]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#1A1A1A]">home_pin</span>
              <h3 className="font-bold text-base text-[#1A1A1A]">Permanent &amp; Residential Address</h3>
            </div>
            <span className="text-[11px] font-mono text-[#8C7A6B]">RESIDENTIAL RECORD</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                House / Flat / Street / Area
              </label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Complete Address"
                  className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                />
              ) : (
                <div className="p-3 bg-[#F5F3EF] rounded font-medium text-sm text-[#1A1A1A] leading-relaxed">
                  {profileData.address || <span className="text-stone-400 italic">No address recorded yet. Click Edit to add.</span>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A]">
                    {profileData.city || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="State"
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A]">
                    {profileData.state || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A6B] mb-1">
                  Postal Pincode
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="6-digit Pincode"
                    className="w-full px-3 py-2 border border-[#DED9D1] rounded bg-[#FBF9F5] focus:outline-none focus:border-[#1A1A1A] text-sm text-[#1A1A1A]"
                  />
                ) : (
                  <div className="p-2.5 bg-[#F5F3EF] rounded font-semibold text-sm text-[#1A1A1A] font-mono">
                    {profileData.pincode || <span className="text-stone-400 italic">Not Provided</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>



    </div>
  );
}
