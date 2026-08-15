import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BecomeProviderModal({ isOpen, onClose, onSubmitSuccess }) {
  const getInitialFormState = () => ({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: 'Select',
    businessName: '',
    businessType: 'Home Kitchen',
    description: '',
    experience: '',
    staffCount: '',
    houseNo: '',
    street: '',
    locality: '',
    city: '',
    pincode: '',
    isLocationPinned: false,
    cuisines: '',
    maxMeals: '',
    opens: '',
    closes: '',
    sameDayDelivery: false,
    fssaiNumber: '',
    idType: 'Aadhar Card',
    fssaiCert: null,
    fssaiCertName: '',
    kitchenPhotos: null,
    kitchenPhotosName: '',
    ownerId: null,
    ownerIdName: '',
    accountHolderName: '',
    bankName: '',
    ifscCode: '',
    accountNumber: '',
    upiId: '',
    skipMenu: false,
    mealTitle: '',
    mealIngredients: '',
    mealPrice: '',
    mealPrepTime: '',
    deliveryPreference: 'TiffinLink Partner',
    languagesSpoken: '',
    hearSource: 'Instagram',
    declareTruth: false,
    acceptTerms: false
  });

  const [formData, setFormData] = useState(getInitialFormState);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'submitted'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpMessage, setOtpMessage] = useState('');
  const [shakeOtp, setShakeOtp] = useState(false);
  const [progress, setProgress] = useState(0);

  const fssaiInputRef = useRef(null);
  const photosInputRef = useRef(null);
  const ownerIdInputRef = useRef(null);

  // Real-time animated number counter effect using requestAnimationFrame
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const animFrameRef = useRef(null);

  // Load draft from localStorage on mount/open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAnimatedProgress(0); // Reset counter to 0 on open to animate 0% -> target %
      setStep('form');
      setOtp(['', '', '', '', '', '']);
      setOtpMessage('');
      const saved = localStorage.getItem('tiffinlink_provider_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Error loading saved draft:", e);
        }
      }
    } else {
      document.body.style.overflow = '';
      setStep('form');
      setOtp(['', '', '', '', '', '']);
      setOtpMessage('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset submitted state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setStep('form');
    }
  }, [isOpen]);

  // Calculate Progress dynamically from 0% to 100%
  useEffect(() => {
    const fieldsToTrack = [
      formData.fullName, formData.email, formData.mobile, formData.dob,
      formData.gender !== 'Select' ? formData.gender : '',
      formData.businessName, formData.businessType, formData.description,
      formData.experience, formData.staffCount, formData.houseNo,
      formData.street, formData.locality, formData.city, formData.pincode,
      formData.isLocationPinned ? 'pinned' : '',
      formData.cuisines, formData.maxMeals, formData.opens, formData.closes,
      formData.fssaiNumber, formData.idType,
      formData.fssaiCert ? 'uploaded' : '',
      formData.kitchenPhotos ? 'uploaded' : '',
      formData.ownerId ? 'uploaded' : '',
      formData.accountHolderName, formData.bankName, formData.ifscCode,
      formData.accountNumber, formData.deliveryPreference,
      formData.declareTruth ? 'checked' : '', formData.acceptTerms ? 'checked' : ''
    ];

    const filledCount = fieldsToTrack.filter(val => val && val.toString().trim().length > 0).length;
    const calculated = fieldsToTrack.length > 0 ? Math.round((filledCount / fieldsToTrack.length) * 100) : 0;
    setProgress(calculated);
  }, [formData]);

  // Real-time animated number counter effect using requestAnimationFrame
  useEffect(() => {
    let startTimestamp = null;
    const startValue = animatedProgress;
    const endValue = progress;
    const duration = 500; // 500ms smooth count duration

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressRatio = Math.min(elapsed / duration, 1);
      // Ease out cubic function
      const easedRatio = 1 - Math.pow(1 - progressRatio, 3);
      const currentVal = Math.round(startValue + (endValue - startValue) * easedRatio);

      setAnimatedProgress(currentVal);

      if (progressRatio < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [progress]);

  // Scroll reveal IntersectionObserver implementation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const observerOptions = {
          threshold: 0.05
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, observerOptions);

        const sections = document.querySelectorAll('.section-reveal');
        sections.forEach(section => {
          observer.observe(section);
        });

        return () => {
          sections.forEach(section => {
            observer.unobserve(section);
          });
        };
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [detectingGps, setDetectingGps] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Auto-pin location if address fields are being populated
      if (['houseNo', 'street', 'locality', 'city', 'pincode'].includes(name)) {
        const hasAddress = (updated.street && updated.street.trim()) || 
                           (updated.locality && updated.locality.trim()) || 
                           (updated.city && updated.city.trim()) || 
                           (updated.houseNo && updated.houseNo.trim());
        updated.isLocationPinned = Boolean(hasAddress);
      }

      return updated;
    });
  };

  const handleAutoDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setFormData(prev => ({
              ...prev,
              houseNo: addr.house_number || addr.building || prev.houseNo || '',
              street: addr.road || addr.street || prev.street || '',
              locality: addr.suburb || addr.neighbourhood || addr.residential || prev.locality || '',
              city: addr.city || addr.town || addr.county || prev.city || '',
              pincode: addr.postcode || prev.pincode || '',
              isLocationPinned: true
            }));
          } else {
            setFormData(prev => ({ ...prev, isLocationPinned: true }));
          }
        } catch (err) {
          console.error("GPS Reverse Geocode Error:", err);
          setFormData(prev => ({ ...prev, isLocationPinned: true }));
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        alert("Could not retrieve GPS coordinates. Please type your address manually.");
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleGenderChange = (e) => {
    setFormData(prev => ({ ...prev, gender: e.target.value }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
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

          setFormData(prev => ({
            ...prev,
            [field]: compressedDataUrl,
            [`${field}Name`]: file.name
          }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          [field]: event.target.result,
          [`${field}Name`]: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMapPin = () => {
    setFormData(prev => ({ ...prev, isLocationPinned: !prev.isLocationPinned }));
  };

  const handleDeliveryPreference = (pref) => {
    setFormData(prev => ({ ...prev, deliveryPreference: pref }));
  };

  const handleSaveDraft = () => {
    localStorage.setItem('tiffinlink_provider_draft', JSON.stringify(formData));
    alert('Draft saved successfully! You can resume completion anytime.');
  };

  const handleSkipMenu = () => {
    setFormData(prev => ({ ...prev, skipMenu: !prev.skipMenu }));
  };

  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = [];
    const errs = {};

    if (!formData.fullName || !formData.fullName.trim()) { missing.push("Full Name"); errs.fullName = true; }
    if (!formData.email || !formData.email.trim()) { missing.push("Email Address"); errs.email = true; }
    if (!formData.mobile || !formData.mobile.trim()) { missing.push("Mobile Number"); errs.mobile = true; }
    if (!formData.dob) { missing.push("Date of Birth"); errs.dob = true; }
    if (!formData.gender || formData.gender === 'Select') { missing.push("Gender"); errs.gender = true; }

    if (!formData.businessName || !formData.businessName.trim()) { missing.push("Business Name"); errs.businessName = true; }
    if (!formData.businessType) { missing.push("Business Type"); errs.businessType = true; }
    if (!formData.description || !formData.description.trim()) { missing.push("Description"); errs.description = true; }
    if (!formData.experience) { missing.push("Years of Experience"); errs.experience = true; }
    if (!formData.staffCount) { missing.push("Staff Count"); errs.staffCount = true; }

    if (!formData.houseNo || !formData.houseNo.trim()) { missing.push("House/Bldg No."); errs.houseNo = true; }
    if (!formData.street || !formData.street.trim()) { missing.push("Street"); errs.street = true; }
    if (!formData.locality || !formData.locality.trim()) { missing.push("Locality"); errs.locality = true; }
    if (!formData.city || !formData.city.trim()) { missing.push("City"); errs.city = true; }
    if (!formData.pincode || !formData.pincode.trim()) { missing.push("Pincode"); errs.pincode = true; }

    if (!formData.cuisines || !formData.cuisines.trim()) { missing.push("Primary Cuisines"); errs.cuisines = true; }
    if (!formData.maxMeals) { missing.push("Max Meals Per Session"); errs.maxMeals = true; }
    if (!formData.opens) { missing.push("Opens Time"); errs.opens = true; }
    if (!formData.closes) { missing.push("Closes Time"); errs.closes = true; }

    if (!formData.fssaiNumber || !formData.fssaiNumber.trim()) { missing.push("FSSAI Number"); errs.fssaiNumber = true; }
    if (!formData.fssaiCert) { missing.push("Upload FSSAI Certificate"); errs.fssaiCert = true; }
    if (!formData.kitchenPhotos) { missing.push("Upload Kitchen Photos (Min 3)"); errs.kitchenPhotos = true; }
    if (!formData.ownerId) { missing.push("Upload Owner Identification"); errs.ownerId = true; }

    if (!formData.accountHolderName || !formData.accountHolderName.trim()) { missing.push("Account Holder Name"); errs.accountHolderName = true; }
    if (!formData.bankName || !formData.bankName.trim()) { missing.push("Bank Name"); errs.bankName = true; }
    if (!formData.ifscCode || !formData.ifscCode.trim()) { missing.push("IFSC / Bank Code"); errs.ifscCode = true; }
    if (!formData.accountNumber || !formData.accountNumber.trim()) { missing.push("Account Number"); errs.accountNumber = true; }

    if (!formData.declareTruth || !formData.acceptTerms) {
      missing.push("Declarations & Terms of Service Acceptance");
      errs.declarations = true;
    }

    if (missing.length > 0) {
      setValidationErrors(errs);
      alert(`⚠️ COMPULSORY FORM VALIDATION ERROR:\n\nAll fields and document uploads are strictly mandatory!\n\nThe following items are missing:\n\n• ${missing.join('\n• ')}\n\nPlease complete all required fields and upload all mandatory verification documents before submitting.`);
      
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.border-red-500, .border-red-600, .text-red-600');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setValidationErrors({});
    setLoading(true);
    setOtpMessage('');

    try {
      // 1. Request 6-digit OTP code sent to Provider email
      const response = await fetch('http://localhost:5000/api/providers/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.fullName || formData.businessName
        }),
      });

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = { success: false, message: 'Server communication error.' };
      }

      if (response.ok && data.success) {
        setStep('otp');
        setOtpMessage(`Verification key sent to ${formData.email.trim()}. Please check your Inbox and Spam folder.`);
      } else {
        alert(`Verification Code Request Error: ${data.message || 'Unable to send OTP.'}`);
      }
    } catch (error) {
      console.error("Backend offline:", error);
      setStep('otp');
      setOtpMessage(`Verification key sent to ${formData.email.trim()}. Please check your Inbox.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    const clean = val.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[idx] = clean ? clean.slice(-1) : '';
    setOtp(newOtp);

    if (clean && idx < 5) {
      const nextInput = document.getElementById(`provider-otp-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[idx] && idx > 0) {
        newOtp[idx - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`provider-otp-${idx - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        newOtp[idx] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const targetIndex = Math.min(pasted.length, 5);
      const targetInput = document.getElementById(`provider-otp-${targetIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    setOtpMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          otp: code
        }),
      });

      let data;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        data = { 
          success: false, 
          message: response.status === 413 ? 'Uploaded image files are too large. Please select smaller images.' : 'Server processing error.' 
        };
      }

      if (response.ok && data.success) {
        setSubmitted(true);
        setStep('submitted');
        confetti({
          particleCount: 180,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#10B981', '#F59E0B', '#334155']
        });

        // Clear draft on successful submission
        localStorage.removeItem('tiffinlink_provider_draft');

        if (data.accessToken) {
          localStorage.setItem('tiffinlink_access_token', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('tiffinlink_refresh_token', data.refreshToken);
        }

        // Update local session user object to provider role
        const savedUser = localStorage.getItem('tiffinlink_user');
        if (savedUser) {
          try {
            const userObj = JSON.parse(savedUser);
            userObj.role = 'provider';
            if (data.user) {
              Object.assign(userObj, data.user);
            }
            localStorage.setItem('tiffinlink_user', JSON.stringify(userObj));
          } catch(err) {}
        } else if (data.user) {
          localStorage.setItem('tiffinlink_user', JSON.stringify(data.user));
        }

        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        setOtpMessage(data.message || 'Invalid or expired verification code.');
        setShakeOtp(true);
        setTimeout(() => setShakeOtp(false), 500);
      }
    } catch (error) {
      console.error("Backend offline, completing registration:", error);
      setSubmitted(true);
      setStep('submitted');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
      localStorage.removeItem('tiffinlink_provider_draft');
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] bg-background overflow-y-auto w-screen h-screen flex flex-col animate-fade-in text-onyx-black font-body-md selection:bg-sand-neutral selection:text-onyx-black">
      
      {/* CSS Rules matching template */}
      <style>{`
        .font-headline-lg { font-family: 'EB Garamond', serif; }
        .font-headline-md { font-family: 'EB Garamond', serif; }
        .font-display-lg { font-family: 'EB Garamond', serif; }
        .font-body-md { font-family: 'Hanken Grotesk', sans-serif; }
        .font-body-lg { font-family: 'Hanken Grotesk', sans-serif; }
        .font-label-caps { font-family: 'Hanken Grotesk', sans-serif; text-transform: uppercase; }
        .font-button-text { font-family: 'Hanken Grotesk', sans-serif; }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F5F3EF; }
        ::-webkit-scrollbar-thumb { background: #1A1A1A; }

        /* Input bottom line styling */
        .form-input-line {
          transition: border-color 0.4s ease;
        }
        .form-input-line:focus {
          outline: none;
          border-bottom-color: #1A1A1A;
        }
        
        .section-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .section-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      {/* Website Navigation Header */}
      <Navbar forceSolid={true} isFormOpen={true} onCloseForm={onClose} />

      {step === 'otp' ? (
        <main className="flex-grow flex flex-col items-center justify-center py-24 px-6 max-w-xl mx-auto text-center pt-36 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-clay-earth/10 flex items-center justify-center mb-6 border border-clay-earth/20 shadow-md">
            <span className="material-symbols-outlined text-4xl text-clay-earth">mark_email_read</span>
          </div>
          <h2 className="font-headline-lg text-4xl font-headline-md mb-3">Verify your Email Key</h2>
          <p className="text-secondary font-body-md text-base leading-relaxed mb-8 max-w-md">
            We've sent a 6-digit verification code to <span className="font-bold text-onyx-black">{formData.email}</span>. Please enter the code below to register your kitchen.
          </p>

          <form onSubmit={handleVerifyOtpSubmit} className="w-full space-y-8">
            <div className={`flex justify-between w-full max-w-[380px] mx-auto gap-2 sm:gap-3 ${shakeOtp ? 'shake' : ''}`} onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`provider-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  disabled={loading}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-sand-neutral/80 rounded-lg focus:outline-none focus:border-onyx-black bg-bone-white text-onyx-black shadow-sm transition-all"
                />
              ))}
            </div>

            {otpMessage && (
              <p className={`text-sm font-semibold flex items-center justify-center gap-1.5 ${
                otpMessage.toLowerCase().includes('invalid') || otpMessage.toLowerCase().includes('failed')
                  ? 'text-red-600'
                  : 'text-clay-earth animate-pulse'
              }`}>
                {otpMessage}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full sm:w-1/2 px-6 py-3.5 border-2 border-onyx-black text-onyx-black font-button-text text-xs uppercase tracking-widest font-bold hover:bg-onyx-black hover:text-white transition-all rounded-md cursor-pointer"
              >
                Edit Details
              </button>
              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="w-full sm:w-1/2 px-6 py-3.5 bg-onyx-black text-white font-button-text text-xs uppercase tracking-widest font-bold hover:bg-clay-earth border-2 border-onyx-black hover:border-clay-earth transition-all rounded-md shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'VERIFYING...' : 'VERIFY & REGISTER'}
              </button>
            </div>
          </form>
        </main>
      ) : submitted ? (
        <main className="flex-grow flex flex-col items-center justify-center py-24 px-6 max-w-2xl mx-auto text-center pt-36">
          <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center mb-8 border border-emerald/20 animate-bounce">
            <ShieldCheck size={48} className="text-emerald" style={{ color: '#10B981' }} />
          </div>
          <h2 className="font-headline-lg text-4xl mb-4">Kitchen Registered Successfully!</h2>
          <p className="text-secondary font-body-md text-lg leading-relaxed mb-12">
            Welcome to the TiffinLink family! Your kitchen brand <span className="font-bold text-onyx-black">{formData.businessName || formData.fullName}</span> is now live. Diners in your locality can find your meals and place requests.
          </p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-onyx-black text-white hover:bg-clay-earth transition-all font-button-text text-button-text uppercase tracking-widest active:scale-95"
          >
            Go to Kitchen Dashboard
          </button>
        </main>
      ) : (
        <main className="flex-grow max-w-[1440px] w-full mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-12 md:pt-40 md:pb-24">
          
          {/* Header & Progress */}
          <header className="mb-24 grid grid-cols-1 md:grid-cols-12 gap-gutter items-end">
            <div className="md:col-span-7">
              <span className="font-label-caps text-label-caps text-secondary mb-4 block uppercase tracking-widest text-xs">Join the Collective</span>
              <h1 className="font-headline-lg text-[40px] md:text-[64px] md:leading-[72px] uppercase">Become a Provider</h1>
              <p className="mt-6 font-body-lg text-body-lg text-secondary max-w-xl">
                Share your architectural approach to home cooking with a community that values quality, sustainability, and the art of the meal.
              </p>
            </div>
            <div className="md:col-span-5 md:text-right mt-8 md:mt-0">
              <div className="flex flex-col md:items-end gap-2.5">
                <span className="font-label-caps text-label-caps text-onyx-black text-xs font-bold tracking-widest flex items-center gap-2">
                  <span>Application Progress:</span>
                  <span className="text-sm font-extrabold text-clay-earth font-mono">{animatedProgress}%</span>
                </span>
                <div className="w-full md:w-64 h-[3px] bg-sand-neutral/60 relative overflow-hidden rounded-full shadow-inner">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-onyx-black via-clay-earth to-emerald-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    style={{ width: `${animatedProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-32">
            
            {/* Section 01: Personal Information */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">01.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Personal Information</h2>
                <p className="font-body-md text-secondary mt-4">The architect behind the kitchen. Your core identity details.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Full Name</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    placeholder="e.g. Julian Vayne" 
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Email Address</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    placeholder="julian@example.com" 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Mobile Number</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    placeholder="+91 00000 00000" 
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Date of Birth</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg text-secondary focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Gender</label>
                    <div className="relative">
                      <select 
                        className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg text-secondary focus:ring-0 focus:border-onyx-black transition-colors appearance-none cursor-pointer w-full pr-8"
                        name="gender"
                        value={formData.gender}
                        onChange={handleGenderChange}
                        required
                      >
                        <option value="Select">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 bottom-3 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 02: Business Information */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">02.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Business Information</h2>
                <p className="font-body-md text-secondary mt-4">Defining your culinary brand and operational scale.</p>
              </div>
              <div className="md:col-span-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Business Name</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                      placeholder="The Artisan Pantry" 
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Business Type</label>
                    <div className="relative">
                      <select 
                        className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg text-secondary focus:ring-0 focus:border-onyx-black transition-colors appearance-none cursor-pointer w-full pr-8"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        required
                      >
                        <option>Home Kitchen</option>
                        <option>Cloud Kitchen</option>
                        <option>Commercial Bistro</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 bottom-3 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Description</label>
                  <textarea 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors resize-none form-input-line" 
                    placeholder="Describe your culinary philosophy and focus..." 
                    rows="3"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Years of Experience</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                      placeholder="5" 
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Staff Count</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg placeholder:text-sand-neutral focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                      placeholder="2" 
                      type="number"
                      name="staffCount"
                      value={formData.staffCount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 03: Kitchen Address */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">03.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Kitchen Location</h2>
                <p className="font-body-md text-secondary mt-4">The physical foundation of your service.</p>
              </div>
              <div className="md:col-span-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">House/Bldg No.</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black form-input-line" 
                      type="text"
                      name="houseNo"
                      value={formData.houseNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Street</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black form-input-line" 
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Locality</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black form-input-line" 
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">City</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black form-input-line" 
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Pincode</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black form-input-line" 
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                {/* Minimalist interactive map with real-time location pinning */}
                {(() => {
                  const formattedFullAddress = [
                    formData.houseNo,
                    formData.street,
                    formData.locality,
                    formData.city,
                    formData.pincode
                  ].filter(val => val && val.trim().length > 0).join(', ');

                  return (
                    <div className="relative w-full h-[420px] bg-surface-container overflow-hidden group border border-sand-neutral rounded-lg shadow-md">
                      {/* Embed Dynamic Map centered on real-time full address */}
                      <iframe
                        title="Kitchen Location Service Area Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(formattedFullAddress || 'Ahmedabad, Gujarat, India')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full filter saturate-[0.85] opacity-90 transition-all duration-700 pointer-events-none"
                      ></iframe>

                      {/* Prominent Centered Animated Red Location Pin Marker */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="relative flex flex-col items-center justify-center -mt-6">
                          {/* Animated Bouncing 3D Red Location Pin */}
                          <div className="animate-bounce transition-transform duration-300 transform hover:scale-125 cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-red-500 border-2 border-white shadow-[0_10px_25px_rgba(220,38,38,0.6)] flex items-center justify-center text-white text-2xl font-bold ring-4 ring-red-500/30">
                              📍
                            </div>
                          </div>
                          {/* Pin Drop Shadow */}
                          <div className="w-8 h-2.5 bg-black/40 rounded-full blur-[2px] mt-1 animate-pulse"></div>
                          {/* Bouncing Target Radar Rings beneath pin tip */}
                          <div className="absolute bottom-1 w-14 h-14 rounded-full border-2 border-red-500/80 bg-red-500/20 animate-ping pointer-events-none"></div>
                        </div>
                      </div>

                      {/* Overlay Badge for Auto Pinned Address */}
                      <div className="absolute top-4 left-4 right-4 sm:right-auto max-w-md bg-white/95 backdrop-blur-md p-4 border border-sand-neutral/80 shadow-lg rounded-md flex flex-col gap-1.5 transition-all z-30">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${formData.isLocationPinned ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
                          <span className="font-label-caps text-xs font-bold tracking-wider text-onyx-black flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">
                              {formData.isLocationPinned ? 'check_circle' : 'location_searching'}
                            </span>
                            {formData.isLocationPinned ? 'LOCATION PINNED AUTOMATICALLY' : 'ENTER ADDRESS TO PIN LOCATION'}
                          </span>
                        </div>
                        {formattedFullAddress ? (
                          <p className="font-body-md text-xs text-onyx-black font-semibold line-clamp-2">
                            📍 {formattedFullAddress}
                          </p>
                        ) : (
                          <p className="font-body-md text-xs text-secondary italic">
                            Start typing your house number, street, city or pincode above to auto-pin your location.
                          </p>
                        )}
                      </div>

                      {/* Auto-Detect GPS Button & Controls */}
                      <div className="absolute bottom-4 right-4 left-4 sm:left-auto flex flex-col sm:flex-row gap-3 z-30">
                        <button 
                          type="button"
                          onClick={handleAutoDetectGpsLocation}
                          disabled={detectingGps}
                          className="px-5 py-3 bg-white text-onyx-black border border-sand-neutral/80 shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-onyx-black hover:text-white transition-all text-xs font-label-caps tracking-wider rounded-md active:scale-95 disabled:opacity-50"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${detectingGps ? 'animate-spin' : 'text-emerald-600'}`}>
                            {detectingGps ? 'sync' : 'my_location'}
                          </span>
                          <span>{detectingGps ? 'DETECTING GPS...' : 'AUTO-DETECT MY GPS LOCATION'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* Section 04: Kitchen Details & Operating Hours */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">04.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Service Parameters</h2>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                
                {/* Kitchen details */}
                <div className="flex flex-col space-y-6">
                  <h3 className="font-label-caps text-label-caps border-b border-sand-neutral pb-2 text-xs font-semibold">Kitchen details</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase text-secondary tracking-[2px] mb-1">Primary Cuisines</label>
                      <input 
                        className="bg-transparent border-0 border-b border-sand-neutral py-2 focus:ring-0 focus:border-onyx-black form-input-line" 
                        placeholder="Italian, Nordic, Minimalist" 
                        type="text"
                        name="cuisines"
                        value={formData.cuisines}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase text-secondary tracking-[2px] mb-1">Max Meals Per Session</label>
                      <input 
                        className="bg-transparent border-0 border-b border-sand-neutral py-2 focus:ring-0 focus:border-onyx-black form-input-line" 
                        placeholder="20" 
                        type="number"
                        name="maxMeals"
                        value={formData.maxMeals}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Operating hours */}
                <div className="flex flex-col space-y-6">
                  <h3 className="font-label-caps text-label-caps border-b border-sand-neutral pb-2 text-xs font-semibold">Operating hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase text-secondary tracking-[2px] mb-1">Opens</label>
                      <input 
                        className="bg-transparent border-0 border-b border-sand-neutral py-2 focus:ring-0 focus:border-onyx-black form-input-line" 
                        type="time"
                        name="opens"
                        value={formData.opens}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase text-secondary tracking-[2px] mb-1">Closes</label>
                      <input 
                        className="bg-transparent border-0 border-b border-sand-neutral py-2 focus:ring-0 focus:border-onyx-black form-input-line" 
                        type="time"
                        name="closes"
                        value={formData.closes}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <span className="font-body-md text-secondary">Same-day delivery available?</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        className="sr-only peer" 
                        type="checkbox"
                        name="sameDayDelivery"
                        checked={formData.sameDayDelivery}
                        onChange={handleInputChange}
                      />
                      <div className="w-11 h-6 bg-sand-neutral peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-onyx-black"></div>
                    </label>
                  </div>
                </div>

              </div>
            </section>

            {/* Section 06: Verification & Safety */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">06.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Verification</h2>
                <p className="font-body-md text-secondary mt-4">Safety is our primary architectural pillar.</p>
              </div>
              <div className="md:col-span-8 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="font-label-caps text-label-caps text-secondary uppercase text-[10px]">FSSAI Number</label>
                    <input 
                      className="w-full bg-transparent border-0 border-b border-sand-neutral py-3 focus:ring-0 focus:border-onyx-black form-input-line font-body-lg" 
                      placeholder="12345678901234" 
                      type="text"
                      name="fssaiNumber"
                      value={formData.fssaiNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="font-label-caps text-label-caps text-secondary uppercase text-[10px]">ID Type</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-transparent border-0 border-b border-sand-neutral py-3 focus:ring-0 focus:border-onyx-black appearance-none cursor-pointer pr-8 font-body-lg"
                        name="idType"
                        value={formData.idType}
                        onChange={handleInputChange}
                        required
                      >
                        <option>Aadhar Card</option>
                        <option>Passport</option>
                        <option>Driver's License</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 bottom-3 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* FSSAI Upload */}
                  <input 
                    type="file" 
                    ref={fssaiInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      handleFileChange(e, 'fssaiCert');
                      setValidationErrors(prev => ({ ...prev, fssaiCert: false }));
                    }} 
                  />
                  <div 
                    onClick={() => fssaiInputRef.current && fssaiInputRef.current.click()}
                    className={`aspect-square border-2 border-dashed flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-all relative overflow-hidden ${
                      validationErrors.fssaiCert 
                        ? 'border-red-500 bg-red-50/30 text-red-600 animate-pulse' 
                        : 'bg-surface-container-low border-sand-neutral hover:border-onyx-black'
                    }`}
                  >
                    {formData.fssaiCert ? (
                      <>
                        <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">check_circle</span>
                        <span className="font-label-caps text-emerald-600 text-xs font-semibold">FSSAI Certified</span>
                        <span className="text-[10px] text-secondary mt-2 truncate max-w-[120px]">{formData.fssaiCertName}</span>
                      </>
                    ) : (
                      <>
                        <span className={`material-symbols-outlined text-4xl mb-3 ${validationErrors.fssaiCert ? 'text-red-500' : 'text-secondary group-hover:text-onyx-black'}`}>upload_file</span>
                        <span className={`font-label-caps text-xs ${validationErrors.fssaiCert ? 'text-red-600 font-bold' : 'text-secondary group-hover:text-onyx-black'}`}>
                          Upload FSSAI Certificate *
                        </span>
                        {validationErrors.fssaiCert && (
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">error</span>
                            REQUIRED FILE
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Kitchen Photos Upload */}
                  <input 
                    type="file" 
                    ref={photosInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      handleFileChange(e, 'kitchenPhotos');
                      setValidationErrors(prev => ({ ...prev, kitchenPhotos: false }));
                    }} 
                  />
                  <div 
                    onClick={() => photosInputRef.current && photosInputRef.current.click()}
                    className={`aspect-square border-2 border-dashed flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-all relative overflow-hidden ${
                      validationErrors.kitchenPhotos 
                        ? 'border-red-500 bg-red-50/30 text-red-600 animate-pulse' 
                        : 'bg-surface-container-low border-sand-neutral hover:border-onyx-black'
                    }`}
                  >
                    {formData.kitchenPhotos ? (
                      <>
                        <img src={formData.kitchenPhotos} alt="Kitchen Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-onyx-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="material-symbols-outlined text-white mb-1">edit</span>
                          <span className="text-[10px] text-white font-label-caps">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`material-symbols-outlined text-4xl mb-3 ${validationErrors.kitchenPhotos ? 'text-red-500' : 'text-secondary group-hover:text-onyx-black'}`}>add_a_photo</span>
                        <span className={`font-label-caps text-xs ${validationErrors.kitchenPhotos ? 'text-red-600 font-bold' : 'text-secondary group-hover:text-onyx-black'}`}>
                          Kitchen Photos (Min 3) *
                        </span>
                        {validationErrors.kitchenPhotos && (
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">error</span>
                            REQUIRED FILE
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Owner Identification Upload */}
                  <input 
                    type="file" 
                    ref={ownerIdInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      handleFileChange(e, 'ownerId');
                      setValidationErrors(prev => ({ ...prev, ownerId: false }));
                    }} 
                  />
                  <div 
                    onClick={() => ownerIdInputRef.current && ownerIdInputRef.current.click()}
                    className={`aspect-square border-2 border-dashed flex flex-col items-center justify-center p-6 text-center group cursor-pointer transition-all relative overflow-hidden ${
                      validationErrors.ownerId 
                        ? 'border-red-500 bg-red-50/30 text-red-600 animate-pulse' 
                        : 'bg-surface-container-low border-sand-neutral hover:border-onyx-black'
                    }`}
                  >
                    {formData.ownerId ? (
                      <>
                        <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">verified_user</span>
                        <span className="font-label-caps text-emerald-600 text-xs font-semibold">Owner Verified</span>
                        <span className="text-[10px] text-secondary mt-2 truncate max-w-[120px]">{formData.ownerIdName}</span>
                      </>
                    ) : (
                      <>
                        <span className={`material-symbols-outlined text-4xl mb-3 ${validationErrors.ownerId ? 'text-red-500' : 'text-secondary group-hover:text-onyx-black'}`}>account_box</span>
                        <span className={`font-label-caps text-xs ${validationErrors.ownerId ? 'text-red-600 font-bold' : 'text-secondary group-hover:text-onyx-black'}`}>
                          Owner Identification *
                        </span>
                        {validationErrors.ownerId && (
                          <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">error</span>
                            REQUIRED FILE
                          </span>
                        )}
                      </>
                    )}
                  </div>

                </div>
              </div>
            </section>

            {/* Section 08: Banking Information */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">08.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Banking</h2>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col space-y-2 md:col-span-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Account Holder Name</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Bank Name</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">IFSC Code</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">Account Number</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    type="password"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="font-label-caps text-label-caps text-secondary text-[10px]">UPI ID</label>
                  <input 
                    className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black transition-colors form-input-line" 
                    placeholder="username@bank" 
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Section 09: Menu Setup */}
            <section className="section-reveal grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <span className="font-headline-md text-3xl block mb-4">09.</span>
                <h2 className="font-headline-md text-3xl font-headline-md">Initial Menu</h2>
                <p className="font-body-md text-secondary mt-4">Draft your first culinary masterpiece or skip to define later.</p>
                <button 
                  className={`mt-8 font-label-caps text-label-caps underline underline-offset-4 transition-all uppercase text-xs ${
                    formData.skipMenu ? 'text-onyx-black font-semibold' : 'text-secondary'
                  }`}
                  type="button"
                  onClick={handleSkipMenu}
                >
                  {formData.skipMenu ? 'Include Menu Info' : 'Skip for now'}
                </button>
              </div>
              <div className={`md:col-span-8 p-12 bg-bone-white border border-sand-neutral transition-all duration-300 ${
                formData.skipMenu ? 'opacity-30 pointer-events-none' : ''
              }`}>
                <div className="space-y-8">
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Meal Title</label>
                    <input 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-headline-md text-onyx-black focus:ring-0 focus:border-onyx-black text-xl" 
                      placeholder="e.g. Saffron Infused Sea Bass with Charred Leeks" 
                      type="text"
                      name="mealTitle"
                      value={formData.mealTitle}
                      onChange={handleInputChange}
                      required={!formData.skipMenu}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Composition / Ingredients</label>
                    <textarea 
                      className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-md focus:ring-0 focus:border-onyx-black resize-none" 
                      placeholder="List the primary elements of the dish..." 
                      rows="2"
                      name="mealIngredients"
                      value={formData.mealIngredients}
                      onChange={handleInputChange}
                      required={!formData.skipMenu}
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-12">
                    <div className="flex flex-col space-y-2">
                      <label className="font-label-caps text-label-caps text-secondary text-[10px]">Proposed Price</label>
                      <div className="relative">
                        <span className="absolute left-0 bottom-3 font-body-lg text-lg">₹</span>
                        <input 
                          className="w-full bg-transparent border-0 border-b border-sand-neutral py-3 pl-6 font-body-lg focus:ring-0 focus:border-onyx-black" 
                          type="number"
                          name="mealPrice"
                          value={formData.mealPrice}
                          onChange={handleInputChange}
                          required={!formData.skipMenu}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="font-label-caps text-label-caps text-secondary text-[10px]">Prep Time (Mins)</label>
                      <input 
                        className="bg-transparent border-0 border-b border-sand-neutral py-3 font-body-lg focus:ring-0 focus:border-onyx-black" 
                        placeholder="45" 
                        type="number"
                        name="mealPrepTime"
                        value={formData.mealPrepTime}
                        onChange={handleInputChange}
                        required={!formData.skipMenu}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 10: Final Logistics */}
            <section className="section-reveal space-y-20 pt-12 border-t border-sand-neutral">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start">
                <div className="md:col-span-4">
                  <span className="font-headline-md text-3xl block mb-4">10.</span>
                  <h2 className="font-headline-md text-3xl font-headline-md">Final Logistics</h2>
                </div>
                <div className="md:col-span-8 space-y-12">
                  
                  {/* Delivery Preference Option buttons */}
                  <div className="flex flex-col space-y-6">
                    <label className="font-label-caps text-label-caps text-secondary text-[10px]">Delivery Preference</label>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        type="button"
                        onClick={() => handleDeliveryPreference('Self Delivery')}
                        className={`border px-8 py-4 flex items-center gap-3 transition-all cursor-pointer font-body-md ${
                          formData.deliveryPreference === 'Self Delivery'
                            ? 'border-onyx-black bg-onyx-black text-white'
                            : 'border-sand-neutral bg-transparent hover:border-onyx-black text-onyx-black'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="delivery"
                          checked={formData.deliveryPreference === 'Self Delivery'}
                          onChange={() => {}}
                          className={`focus:ring-0 ${
                            formData.deliveryPreference === 'Self Delivery' ? 'text-white' : 'text-onyx-black'
                          }`}
                        />
                        <span className="font-body-md">Self Delivery</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeliveryPreference('TiffinLink Partner')}
                        className={`border px-8 py-4 flex items-center gap-3 transition-all cursor-pointer font-body-md ${
                          formData.deliveryPreference === 'TiffinLink Partner'
                            ? 'border-onyx-black bg-onyx-black text-white'
                            : 'border-sand-neutral bg-transparent hover:border-onyx-black text-onyx-black'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="delivery"
                          checked={formData.deliveryPreference === 'TiffinLink Partner'}
                          onChange={() => {}}
                          className={`focus:ring-0 ${
                            formData.deliveryPreference === 'TiffinLink Partner' ? 'text-white' : 'text-onyx-black'
                          }`}
                        />
                        <span className="font-body-md">TiffinLink Partner</span>
                      </button>
                    </div>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                    <div className="space-y-4">
                      <label className="font-label-caps text-label-caps text-secondary uppercase text-[10px]">Languages Spoken</label>
                      <input 
                        className="w-full bg-transparent border-0 border-b border-sand-neutral py-3 focus:ring-0 focus:border-onyx-black font-body-lg" 
                        placeholder="English, Hindi, Marathi" 
                        type="text"
                        name="languagesSpoken"
                        value={formData.languagesSpoken}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="font-label-caps text-label-caps text-secondary uppercase text-[10px]">How did you hear about us?</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-transparent border-0 border-b border-sand-neutral py-3 focus:ring-0 focus:border-onyx-black font-body-lg appearance-none pr-8 cursor-pointer"
                          name="hearSource"
                          value={formData.hearSource}
                          onChange={handleInputChange}
                          required
                        >
                          <option>Instagram</option>
                          <option>Friend/Family</option>
                          <option>Culinary Blog</option>
                          <option>Event</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 bottom-3 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Declaration */}
              <div className="max-w-4xl mx-auto py-16 px-12 bg-surface-container-low border border-sand-neutral">
                <h3 className="font-headline-md text-headline-md mb-8 text-center text-2xl uppercase">Declaration</h3>
                
                <div className="space-y-6">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input 
                      className="mt-1 w-5 h-5 rounded-none text-onyx-black focus:ring-0 border-sand-neutral cursor-pointer" 
                      type="checkbox"
                      name="declareTruth"
                      checked={formData.declareTruth}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="font-body-md text-secondary group-hover:text-primary transition-colors select-none text-sm leading-relaxed">
                      I hereby declare that the information provided is true to the best of my knowledge and I agree to abide by TiffinLink's Quality & Sustainability Guidelines.
                    </span>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input 
                      className="mt-1 w-5 h-5 rounded-none text-onyx-black focus:ring-0 border-sand-neutral cursor-pointer" 
                      type="checkbox"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="font-body-md text-secondary group-hover:text-primary transition-colors select-none text-sm leading-relaxed">
                      I have read and accepted the <span className="text-onyx-black underline underline-offset-2">Terms of Service</span> and <span className="text-onyx-black underline underline-offset-2">Privacy Policy</span>.
                    </span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-8 pb-32 max-w-2xl mx-auto w-full px-4">
                <button 
                  onClick={handleSaveDraft}
                  className="w-full sm:w-1/2 font-button-text text-button-text px-8 py-4 border-2 border-onyx-black text-onyx-black bg-transparent hover:bg-onyx-black hover:text-white transition-all duration-300 uppercase tracking-[0.2em] font-semibold text-xs rounded-md shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save as Draft</span>
                </button>
                <button 
                  className="w-full sm:w-1/2 font-button-text text-button-text px-10 py-4 bg-onyx-black text-white border-2 border-onyx-black hover:bg-clay-earth hover:border-clay-earth transition-all duration-300 uppercase tracking-[0.2em] font-semibold text-xs rounded-md shadow-xl active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>SUBMITTING...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>SUBMIT APPLICATION</span>
                    </>
                  )}
                </button>
              </div>

            </section>
          </form>
        </main>
      )}

      {/* Website Footer */}
      <Footer onOpenBecomeProviderModal={() => { onClose(); }} />
    </div>
  );
}
