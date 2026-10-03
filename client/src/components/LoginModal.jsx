import React, { useState, useEffect } from 'react';
import { setAuthTokens, saveUserSession } from '../services/api';

export default function LoginModal({ 
  isOpen, 
  onClose, 
  initialRole = 'customer',
  initialMode = 'login',
  onOpenBecomeProviderModal,
  onOpenBecomeDeliveryPartnerModal,
  onLoginSuccess
}) {
  // Active Role Tab: 'customer' | 'provider' | 'delivery'
  const [activeRole, setActiveRole] = useState(initialRole);

  // Modal Mode & Step State
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [step, setStep] = useState('form'); // 'form' | 'otp'

  // Form Field State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Authentication Method: 'otp' | 'password'
  const [authMethod, setAuthMethod] = useState('otp');

  // Validation Errors State
  const [errors, setErrors] = useState({});

  // Submission State
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'verifying' | 'granted'
  const [isActive, setIsActive] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpMessage, setOtpMessage] = useState('');
  const [shakeInputs, setShakeInputs] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto focus first OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) firstInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  // Update activeRole when initialRole prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveRole(initialRole);
      setMode(initialMode || 'login');
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      setIsActive(false);
      document.body.style.overflow = '';
      // Reset state on modal close
      setMode('login');
      setStep('form');
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setAuthMethod('otp');
      setErrors({});
      setOtp(['', '', '', '', '', '']);
      setOtpMessage('');
      setShakeInputs(false);
      setSubmitStatus('idle');
      setResendCooldown(0);
    }
  }, [isOpen, initialRole]);

  // Handle switching role tabs
  const handleRoleTabChange = (role) => {
    setActiveRole(role);
    setErrors({});
    setOtpMessage('');
    setPassword('');
    setStep('form');
  };

  // Real-time Field Validation Helper
  const validateField = (fieldName, value) => {
    let newErrors = { ...errors };

    if (fieldName === 'name') {
      if (!value || value.trim().length < 2) {
        newErrors.name = 'Full name must be at least 2 characters';
      } else {
        delete newErrors.name;
      }
    }

    if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value.trim())) {
        newErrors.email = 'Please enter a valid email address (e.g. name@domain.com)';
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === 'phone') {
      const phoneClean = value.replace(/[^0-9]/g, '');
      if (!value || phoneClean.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit mobile number';
      } else {
        delete newErrors.phone;
      }
    }

    setErrors(newErrors);
  };

  // Validate entire form prior to submission
  const validateAll = () => {
    const errs = {};
    if (mode === 'signup' && activeRole === 'customer') {
      if (!name || name.trim().length < 2) {
        errs.name = 'Full name must be at least 2 characters';
      }
      const phoneClean = phone.replace(/[^0-9]/g, '');
      if (!phone || phoneClean.length !== 10) {
        errs.phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (mode === 'login' && authMethod === 'password') {
      if (!password) {
        errs.password = 'Please enter your account password';
      }
    }

    if (mode === 'signup' && !password) {
      errs.password = 'Please set an account password';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. name@domain.com)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submit (Sign In with OTP / Sign In with Password / Sign Up)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'signup') {
      if (activeRole === 'provider' && onOpenBecomeProviderModal) {
        onClose();
        onOpenBecomeProviderModal();
        return;
      }
      if (activeRole === 'delivery' && onOpenBecomeDeliveryPartnerModal) {
        onClose();
        onOpenBecomeDeliveryPartnerModal();
        return;
      }
    }

    if (!validateAll()) return;

    setSubmitStatus('verifying');
    setOtpMessage('');

    // OPTION 1: SIGN IN WITH PASSWORD (Direct authentication, NO OTP DISPATCHED)
    if (mode === 'login' && authMethod === 'password') {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            role: activeRole
          })
        });
        const data = await response.json();

        if (data.success) {
          setSubmitStatus('granted');
          if (data.accessToken) {
            setAuthTokens(data.accessToken, data.refreshToken);
          }

          const rawUser = data.user || { email: email.trim(), name: email.split('@')[0] };
          const userId = String(rawUser._id || rawUser.id || '');
          let authenticatedUser = {
            ...rawUser,
            id: userId,
            _id: userId,
            role: activeRole || rawUser.role || 'customer'
          };

          saveUserSession(authenticatedUser, data.accessToken, data.refreshToken);

          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(authenticatedUser, data.accessToken, data.refreshToken);
            }
            onClose();
          }, 400);
        } else {
          setSubmitStatus('idle');
          setOtpMessage(data.message || 'Invalid credentials. Please check your password.');
          if (data.message && data.message.toLowerCase().includes('password')) {
            setErrors(prev => ({ ...prev, password: data.message }));
          } else if (data.message && data.message.toLowerCase().includes('email')) {
            setErrors(prev => ({ ...prev, email: data.message }));
          }
        }
      } catch (error) {
        console.error('Password Login error:', error);
        setSubmitStatus('idle');
        setOtpMessage('Unable to sign in with password. Please check server connection.');
      }
      return;
    }

    // OPTION 2: SIGN IN WITH OTP / SIGN UP (Sends 6-digit OTP code to registered email)
    const endpoint = mode === 'signup' 
      ? 'http://localhost:5000/api/auth/register' 
      : 'http://localhost:5000/api/auth/send-otp';

    const payload = mode === 'signup' 
      ? { name: name.trim(), email: email.trim(), phone: phone.trim(), password: password, role: activeRole } 
      : { email: email.trim(), role: activeRole };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        setSubmitStatus('idle');
        setStep('otp');
        setResendCooldown(60);
        setOtpMessage(`Verification OTP code dispatched to ${email}. Please check your Inbox.`);
      } else {
        setSubmitStatus('idle');
        setOtpMessage(data.message || 'Unable to send verification email. Please try again.');
        if (data.message && data.message.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: data.message }));
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('idle');
      setOtpMessage('Unable to send verification email. Please check server connection.');
    }
  };

  // Handle OTP Verification Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;

    setSubmitStatus('verifying');
    setOtpMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          otp: otpCode,
          name: mode === 'signup' ? name.trim() : undefined,
          phone: mode === 'signup' ? phone.trim() : undefined,
          role: activeRole
        })
      });
      const data = await response.json();

      if (data.success) {
        setSubmitStatus('granted');
        if (data.accessToken) {
          setAuthTokens(data.accessToken, data.refreshToken);
        }

        const rawUser = data.user || { email: email.trim(), name: name.trim() || email.split('@')[0] };
        const userId = String(rawUser._id || rawUser.id || '');
        let authenticatedUser = {
          ...rawUser,
          id: userId,
          _id: userId,
          role: activeRole || rawUser.role || 'customer',
          isVerified: true,
          emailVerified: true
        };

        // Fetch fresh user profile from DB to enforce DB source of truth (Requirement 16)
        if (data.accessToken) {
          try {
            const meRes = await fetch('http://localhost:5000/api/auth/me', {
              headers: { 'Authorization': `Bearer ${data.accessToken}` }
            });
            const meData = await meRes.json();
            if (meData.success && meData.user) {
              const freshId = String(meData.user._id || meData.user.id || userId);
              authenticatedUser = { ...meData.user, id: freshId, _id: freshId, emailVerified: true };
            }
          } catch (meErr) {
            console.warn('Profile sync fetch error:', meErr);
          }
        }

        saveUserSession(authenticatedUser, data.accessToken, data.refreshToken);
        if (onLoginSuccess) {
          onLoginSuccess(authenticatedUser, data.accessToken, data.refreshToken);
        }
        setTimeout(() => {
          setSubmitStatus('idle');
          onClose();
        }, 400);
      } else {
        setSubmitStatus('idle');
        setOtpMessage(data.message || 'Invalid verification code.');
        setShakeInputs(true);
        setTimeout(() => setShakeInputs(false), 500);
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      setSubmitStatus('idle');
      setOtpMessage('Verification request failed. Please try again.');
      setShakeInputs(true);
      setTimeout(() => setShakeInputs(false), 500);
    }
  };

  const handleOtpChange = (value, index) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanValue ? cleanValue.substring(cleanValue.length - 1) : '';
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      const targetIndex = Math.min(pastedData.length, 5);
      const targetInput = document.getElementById(`otp-input-${targetIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setOtpMessage('Sending new verification key...');
    setResendCooldown(60);

    try {
      const endpoint = mode === 'signup' 
        ? 'http://localhost:5000/api/auth/register' 
        : 'http://localhost:5000/api/auth/send-otp';

      const payload = mode === 'signup' 
        ? { name, email, phone, role: activeRole } 
        : { email, role: activeRole };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setOtpMessage('A new verification key has been sent to your email.');
      } else {
        setOtpMessage(data.message || 'Failed to resend verification code.');
        setResendCooldown(0);
      }
    } catch (error) {
      console.error(error);
      setOtpMessage('Unable to send verification email. Please try again.');
      setResendCooldown(0);
    }
  };

  if (!isOpen) return null;

  // Role Labels & Styling
  const roleLabels = {
    customer: { title: 'Diner Portal', tag: 'Gastronomic Journey' },
    provider: { title: 'Home-Chef Portal', tag: 'Artisanal Kitchens' },
    delivery: { title: 'Delivery Partner', tag: 'Logistics Fleet' },
    admin: { title: 'Super Admin OS', tag: 'Platform Control Center' }
  };

  // Dynamic Button State
  let buttonText = step === 'form' 
    ? (mode === 'signup' 
        ? (activeRole === 'provider' ? 'Open Provider Application' : activeRole === 'delivery' ? 'Open Partner Application' : 'Create Account') 
        : (authMethod === 'password'
            ? `Sign In as ${activeRole === 'admin' ? 'Super Admin' : (activeRole === 'provider' ? 'Provider' : (activeRole === 'delivery' ? 'Deliverer' : 'Diner'))}`
            : 'Send OTP Code'))
    : 'Verify Key';
  let buttonStyle = {};
  let isButtonDisabled = false;

  if (submitStatus === 'verifying') {
    buttonText = 'PROCESSING...';
    buttonStyle = { opacity: '0.7' };
    isButtonDisabled = true;
  } else if (submitStatus === 'granted') {
    buttonText = 'ACCESS GRANTED';
    buttonStyle = { backgroundColor: '#1b1c1a' };
    isButtonDisabled = true;
  }

  const isOtpIncomplete = step === 'otp' && otp.join('').length < 6;
  const isFormIncomplete = step === 'form' && (
    mode === 'signup' 
      ? (activeRole === 'customer' ? (!name || !email || !phone || !password) : (!email || !password))
      : (authMethod === 'password' ? (!email || !password) : !email)
  );
  const isButtonDisabledFinal = isButtonDisabled || isFormIncomplete || isOtpIncomplete;

  return (
    <div 
      className="login-modal-overlay fixed inset-0 bg-black/45 backdrop-blur-sm z-[9999] flex justify-center items-center px-3 sm:px-4 py-4"
      onClick={onClose}
    >
      <div 
        className={`login-modal-card bg-surface w-full max-w-[560px] p-4 sm:p-8 md:py-8 md:px-12 relative shadow-2xl border border-outline-variant/30 reveal ${isActive ? 'active' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          .login-modal-card {
            background-color: #fbf9f5;
            color: #1b1c1a;
            font-family: 'Hanken Grotesk', sans-serif;
            border-radius: 0.5rem;
            max-height: 92vh;
            overflow-y: auto;
          }
          
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          
          .reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          }
          
          .reveal.active {
            opacity: 1;
            transform: translateY(0);
          }
          
          .underline-animate {
            position: relative;
          }
          
          .underline-animate::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 1px;
            bottom: -2px;
            left: 0;
            background-color: currentColor;
            transform: scaleX(0);
            transform-origin: bottom right;
            transition: transform 0.3s ease-out;
          }
          
          .underline-animate:hover::after {
            transform: scaleX(1);
            transform-origin: bottom left;
          }

          .login-modal-card .font-label-caps {
            font-family: 'Hanken Grotesk', sans-serif !important;
          }
          .login-modal-card .text-label-caps {
            font-size: 11px !important;
            line-height: 16px !important;
            letter-spacing: 0.1em !important;
            font-weight: 600 !important;
          }
          
          .login-modal-card .font-headline-md {
            font-family: 'EB Garamond', serif !important;
          }
          .login-modal-card .text-headline-md {
            font-size: 30px !important;
            line-height: 38px !important;
            font-weight: 400 !important;
          }
          
          .login-modal-card .font-body-md {
            font-family: 'Hanken Grotesk', sans-serif !important;
          }
          .login-modal-card .text-body-md {
            font-size: 15px !important;
            line-height: 22px !important;
            font-weight: 400 !important;
          }
          
          .login-modal-card .font-button-text {
            font-family: 'Hanken Grotesk', sans-serif !important;
          }
          .login-modal-card .text-button-text {
            font-size: 14px !important;
            line-height: 20px !important;
            letter-spacing: 0.05em !important;
            font-weight: 500 !important;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .shake {
            animation: shake 0.4s ease-in-out;
          }
        `}</style>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-primary hover:opacity-60 transition-opacity cursor-pointer p-1"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        <div className="space-y-5">
          
          {/* ROLE SELECTOR TABS */}
          {step === 'form' && (
            <div className="border-b border-outline-variant/30 pb-3">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-2 text-center text-[10px] opacity-75">
                SELECT PORTAL ROLE
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-surface-container-low p-1 rounded-md border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('customer')}
                  className={`py-2 text-[10px] sm:text-[11px] font-label-caps rounded transition-all text-center ${
                    activeRole === 'customer' 
                      ? 'bg-onyx-black text-white font-bold shadow' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  For Diners
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('provider')}
                  className={`py-2 text-[10px] sm:text-[11px] font-label-caps rounded transition-all text-center ${
                    activeRole === 'provider' 
                      ? 'bg-onyx-black text-white font-bold shadow' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  For Providers
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('delivery')}
                  className={`py-2 text-[10px] sm:text-[11px] font-label-caps rounded transition-all text-center ${
                    activeRole === 'delivery' 
                      ? 'bg-onyx-black text-white font-bold shadow' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  For Deliverers
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('admin')}
                  className={`py-2 text-[10px] sm:text-[11px] font-label-caps rounded transition-all text-center ${
                    activeRole === 'admin' 
                      ? 'bg-emerald-600 text-white font-bold shadow' 
                      : 'text-on-surface-variant hover:text-emerald-600'
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>
          )}

          {/* Header Title */}
          <div className="text-center space-y-1">
            <h2 className="font-headline-md text-headline-md text-primary tracking-tight">
              {step === 'otp' 
                ? 'Verify your Key.' 
                : (mode === 'signup' 
                    ? (activeRole === 'provider' ? 'Become a Provider' : activeRole === 'delivery' ? 'Become a Partner' : activeRole === 'admin' ? 'Create Super Admin Account' : 'Create Diner Account') 
                    : `${roleLabels[activeRole]?.title}`)}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-[440px] mx-auto text-[14px]">
              {step === 'otp' 
                ? `We've sent a one-time verification key to ${email}.`
                : (mode === 'signup' 
                    ? (activeRole === 'provider' 
                        ? 'Register your kitchen brand to serve homemade thalis to diners.' 
                        : activeRole === 'delivery'
                        ? 'Join our local delivery fleet to deliver thalis and earn.'
                        : activeRole === 'admin'
                        ? 'Create a Super Admin operational account with root privileges.'
                        : 'Join TiffinLink to explore home-cooked thalis and tiffin subscriptions.') 
                    : `Authenticate access for ${roleLabels[activeRole]?.tag}.`)
              }
            </p>
          </div>

          {/* Form Content */}
          <form className="space-y-4" onSubmit={step === 'form' ? handleFormSubmit : handleOtpSubmit}>
            {step === 'form' ? (
              <>
                {/* AUTH METHOD SELECTOR BUTTONS (SIGN IN WITH OTP vs SIGN IN WITH PASSWORD) */}
                {mode === 'login' && (
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-md border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setErrors({});
                        setOtpMessage('');
                      }}
                      className={`py-2 px-2 text-[11px] font-label-caps rounded transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        authMethod === 'otp'
                          ? 'bg-onyx-black text-white font-bold shadow'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">mark_email_unread</span>
                      Sign In with OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setErrors({});
                        setOtpMessage('');
                      }}
                      className={`py-2 px-2 text-[11px] font-label-caps rounded transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        authMethod === 'password'
                          ? 'bg-onyx-black text-white font-bold shadow'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">lock</span>
                      Sign In with Password
                    </button>
                  </div>
                )}

                {/* DINER / ADMIN SIGN UP FIELDS */}
                {mode === 'signup' && (activeRole === 'customer' || activeRole === 'admin') && (
                  <div className="relative group">
                    <label 
                      className="font-label-caps text-label-caps text-on-surface-variant block mb-1" 
                      htmlFor="name"
                    >
                      FULL NAME *
                    </label>
                    <input 
                      className={`w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-1.5 text-body-md text-primary placeholder-outline transition-all focus:ring-0 ${
                        errors.name ? 'border-red-500 text-red-600' : 'border-outline-variant focus:border-primary'
                      }`} 
                      id="name" 
                      name="name" 
                      placeholder="e.g. Zaid Mansuri" 
                      required 
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        validateField('name', e.target.value);
                      }}
                      disabled={submitStatus !== 'idle'}
                    />
                    {errors.name && (
                      <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Email Address Input */}
                <div className="relative group">
                  <label 
                    className="font-label-caps text-label-caps text-on-surface-variant block mb-1" 
                    htmlFor="email"
                  >
                    {activeRole === 'provider' ? 'KITCHEN / PROVIDER EMAIL *' : activeRole === 'delivery' ? 'DELIVERY PARTNER EMAIL *' : activeRole === 'admin' ? 'SUPER ADMIN EMAIL *' : 'DINER EMAIL ADDRESS *'}
                  </label>
                  <input 
                    className={`w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-1.5 text-body-md text-primary placeholder-outline transition-all focus:ring-0 ${
                      errors.email ? 'border-red-500 text-red-600' : 'border-outline-variant focus:border-primary'
                    }`} 
                    id="email" 
                    name="email" 
                    placeholder="yourname@domain.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateField('email', e.target.value);
                    }}
                    disabled={submitStatus !== 'idle'}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* PASSWORD INPUT (Shown for Password Login OR Signup) */}
                {((mode === 'login' && authMethod === 'password') || mode === 'signup') && (
                  <div className="relative group">
                    <label 
                      className="font-label-caps text-label-caps text-on-surface-variant block mb-1" 
                      htmlFor="password"
                    >
                      {mode === 'signup' ? 'SET ACCOUNT PASSWORD *' : 'ACCOUNT PASSWORD *'}
                    </label>
                    <input 
                      className={`w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-1.5 text-body-md text-primary placeholder-outline transition-all focus:ring-0 ${
                        errors.password ? 'border-red-500 text-red-600' : 'border-outline-variant focus:border-primary'
                      }`} 
                      id="password" 
                      name="password" 
                      placeholder="••••••••" 
                      required 
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (!e.target.value) {
                          setErrors(prev => ({ ...prev, password: 'Password is required' }));
                        } else {
                          setErrors(prev => {
                            const copy = { ...prev };
                            delete copy.password;
                            return copy;
                          });
                        }
                      }}
                      disabled={submitStatus !== 'idle'}
                    />
                    {errors.password && (
                      <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}

                {/* DINER / ADMIN SIGN UP: Mobile Number */}
                {mode === 'signup' && (activeRole === 'customer' || activeRole === 'admin') && (
                  <div className="relative group">
                    <label 
                      className="font-label-caps text-label-caps text-on-surface-variant block mb-1" 
                      htmlFor="phone"
                    >
                      MOBILE NUMBER (10 DIGITS) *
                    </label>
                    <input 
                      className={`w-full bg-transparent border-t-0 border-x-0 border-b px-0 py-1.5 text-body-md text-primary placeholder-outline transition-all focus:ring-0 ${
                        errors.phone ? 'border-red-500 text-red-600' : 'border-outline-variant focus:border-primary'
                      }`} 
                      id="phone" 
                      name="phone" 
                      placeholder="9876543210" 
                      maxLength={10}
                      required 
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        setPhone(clean);
                        validateField('phone', clean);
                      }}
                      disabled={submitStatus !== 'idle'}
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* OTP VERIFICATION STEP */
              <div className="space-y-4 py-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant block text-center mb-1">
                  SECURE ONE-TIME PASSWORD
                </label>
                <div className={`flex justify-between w-full max-w-[360px] mx-auto gap-2 ${shakeInputs ? 'shake' : ''}`} onPaste={handlePaste}>
                  {otp.map((digit, idx) => {
                    const isError = otpMessage && (
                      otpMessage.toLowerCase().includes('invalid') || 
                      otpMessage.toLowerCase().includes('failed')
                    );
                    return (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        disabled={submitStatus !== 'idle'}
                        className={`w-full aspect-[4/5] sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-normal border rounded-md focus:outline-none focus:ring-0 bg-transparent text-primary transition-all duration-300 ${
                          isError 
                            ? 'border-red-500 focus:border-red-500 text-red-600'
                            : 'border-outline-variant/60 focus:border-primary'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons & Navigation */}
            <div className="space-y-3 pt-2">
              <button 
                className="w-full bg-onyx-black text-on-primary font-button-text text-button-text py-3.5 px-8 uppercase tracking-[0.2em] hover:bg-clay-earth transition-colors duration-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={isButtonDisabledFinal}
                style={buttonStyle}
              >
                {buttonText}
              </button>

              {step === 'form' ? (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 w-full text-center">
                  {mode === 'login' ? (
                    <>
                      <p className="font-label-caps text-label-caps text-on-surface-variant">
                        {activeRole === 'provider' 
                          ? 'Want to list your kitchen? ' 
                          : activeRole === 'delivery'
                          ? 'Want to deliver thalis? '
                          : 'New to TiffinLink? '}
                        <button 
                          type="button"
                          onClick={() => {
                            if (activeRole === 'provider' && onOpenBecomeProviderModal) {
                              onClose();
                              onOpenBecomeProviderModal();
                            } else if (activeRole === 'delivery' && onOpenBecomeDeliveryPartnerModal) {
                              onClose();
                              onOpenBecomeDeliveryPartnerModal();
                            } else {
                              setMode('signup');
                              setErrors({});
                              setOtpMessage('');
                            }
                          }}
                          className="text-primary underline-animate ml-1 font-bold cursor-pointer bg-transparent border-none p-0"
                        >
                          {activeRole === 'provider' ? 'Become a Provider' : activeRole === 'delivery' ? 'Become a Partner' : 'Create an account'}
                        </button>
                      </p>
                      <a className="font-label-caps text-label-caps text-on-secondary-fixed-variant underline-animate" href="#forgot">
                        Forgot your key?
                      </a>
                    </>
                  ) : (
                    <p className="font-label-caps text-label-caps text-on-surface-variant mx-auto">
                      Already have an account? 
                      <button 
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrors({});
                          setOtpMessage('');
                        }}
                        className="text-primary underline-animate ml-1.5 font-bold cursor-pointer bg-transparent border-none p-0"
                      >
                        Sign In
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 w-full text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setOtp(['', '', '', '', '', '']);
                      }}
                      className="font-label-caps text-label-caps text-primary underline-animate cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                    >
                      Edit details
                    </button>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendOtp}
                      className="font-label-caps text-label-caps text-on-secondary-fixed-variant underline-animate cursor-pointer bg-transparent border-none p-0 focus:outline-none disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status or Alert Message */}
              {otpMessage && (
                <p className={`text-center font-label-caps text-[12px] font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  otpMessage.toLowerCase().includes('invalid') || 
                  otpMessage.toLowerCase().includes('failed') ||
                  otpMessage.toLowerCase().includes('no registered') ||
                  otpMessage.toLowerCase().includes('registered as')
                    ? 'text-red-600'
                    : 'text-clay-earth animate-pulse'
                }`}>
                  {(otpMessage.toLowerCase().includes('invalid') || 
                    otpMessage.toLowerCase().includes('failed') ||
                    otpMessage.toLowerCase().includes('no registered') ||
                    otpMessage.toLowerCase().includes('registered as')) && (
                    <span className="material-symbols-outlined text-[14px] font-bold text-red-600">error</span>
                  )}
                  {otpMessage}
                </p>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 space-y-2 border-t border-outline-variant/30">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-0 text-[11px] font-label-caps text-on-surface-variant opacity-60">
              <p>Contact Us +91-97-38383838</p>
              <p>By continuing, you agree to our</p>
            </div>
            <div className="flex justify-center gap-4 text-[11px] font-label-caps text-primary">
              <a className="underline-animate text-[11px]" href="#terms">Terms of service</a>
              <span className="opacity-40">|</span>
              <a className="underline-animate text-[11px]" href="#privacy">Privacy Policy</a>
              <span className="opacity-40">|</span>
              <a className="underline-animate text-[11px]" href="#conduct">Code of Conduct</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
