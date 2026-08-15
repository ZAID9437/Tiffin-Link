import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BecomeDeliveryPartnerModal({ isOpen, onClose, onSubmitSuccess }) {
  // Initial state structure matching all form fields
  const getInitialFormState = () => ({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: '',
    houseNo: '',
    streetName: '',
    area: '',
    city: '',
    state: '',
    zip: '',
    vehicleType: 'motorcycle', // Default selection
    registrationNo: '',
    brand: '',
    model: '',
    licenseNumber: '',
    licenseCopy: null,
    licenseCopyName: '',
    idType: 'Passport',
    idNumber: '',
    idFront: null,
    idFrontName: '',
    idBack: null,
    idBackName: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    routingCode: '',
    upiId: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyMobile: '',
    workingDays: [],
    timeSlot: 'Morning (7 AM - 12 PM)',
    preferredArea: '',
    startImmediately: false,
    experience: '',
    languages: '',
    referralCode: '',
    confirmAccurate: false,
    agreePrivacy: false,
    understandBackgroundCheck: false
  });

  const [formData, setFormData] = useState(getInitialFormState);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  const idFrontInputRef = useRef(null);
  const idBackInputRef = useRef(null);
  const licenseInputRef = useRef(null);

  // Load draft from localStorage on mount/open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAnimatedProgress(0); // Reset counter to 0 on open to animate 0% -> target %
      const saved = localStorage.getItem('tiffinlink_delivery_partner_draft');
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
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Calculate Progress dynamically from 0% to 100%
  const [progress, setProgress] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const fieldsToTrack = [
      formData.fullName, formData.email, formData.mobile, formData.dob, formData.gender,
      formData.houseNo, formData.streetName, formData.area, formData.city, formData.state, formData.zip,
      formData.vehicleType, formData.registrationNo, formData.brand, formData.model,
      formData.licenseNumber, formData.licenseCopy ? 'uploaded' : '',
      formData.idType, formData.idNumber, formData.idFront ? 'uploaded' : '', formData.idBack ? 'uploaded' : '',
      formData.accountHolderName, formData.bankName, formData.accountNumber, formData.routingCode,
      formData.emergencyName, formData.emergencyMobile,
      formData.workingDays.length > 0 ? 'selected' : '', formData.preferredArea,
      formData.confirmAccurate ? 'checked' : '', formData.agreePrivacy ? 'checked' : '', formData.understandBackgroundCheck ? 'checked' : ''
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
    const duration = 500;

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progressRatio = Math.min(elapsed / duration, 1);
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

        const sections = document.querySelectorAll('.reveal-section');
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenderChange = (genderVal) => {
    setFormData(prev => ({ ...prev, gender: genderVal }));
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const isSelected = prev.workingDays.includes(day);
      const workingDays = isSelected
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays };
    });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
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

  const handleSaveDraft = () => {
    localStorage.setItem('tiffinlink_delivery_partner_draft', JSON.stringify(formData));
    alert('Draft saved successfully! You can resume completion anytime.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = [];

    if (!formData.fullName || !formData.fullName.trim()) missing.push("Full Name");
    if (!formData.email || !formData.email.trim()) missing.push("Email Address");
    if (!formData.mobile || !formData.mobile.trim()) missing.push("Mobile Number");
    if (!formData.dob) missing.push("Date of Birth");
    if (!formData.gender) missing.push("Gender");

    if (!formData.houseNo || !formData.houseNo.trim()) missing.push("House No. / Building");
    if (!formData.streetName || !formData.streetName.trim()) missing.push("Street Name");
    if (!formData.area || !formData.area.trim()) missing.push("Area / Locality");
    if (!formData.city || !formData.city.trim()) missing.push("City");
    if (!formData.state) missing.push("State");
    if (!formData.zip || !formData.zip.trim()) missing.push("Pincode / ZIP");

    if (formData.vehicleType !== 'bicycle') {
      if (!formData.licenseNumber || !formData.licenseNumber.trim()) missing.push("Driving License Number");
      if (!formData.licenseCopy) missing.push("Upload Driving License Copy");
    }

    if (!formData.idType) missing.push("ID Document Type");
    if (!formData.idNumber || !formData.idNumber.trim()) missing.push("ID Number");
    if (!formData.idFront) missing.push("Upload ID Front View");
    if (!formData.idBack) missing.push("Upload ID Back View");

    if (!formData.accountHolderName || !formData.accountHolderName.trim()) missing.push("Account Holder Name");
    if (!formData.bankName || !formData.bankName.trim()) missing.push("Bank Name");
    if (!formData.accountNumber || !formData.accountNumber.trim()) missing.push("Account Number");

    if (!formData.confirmAccurate || !formData.agreePrivacy || !formData.understandBackgroundCheck) {
      missing.push("Terms, Conditions & Background Check Confirmations");
    }

    if (missing.length > 0) {
      alert(`⚠️ COMPULSORY FORM VALIDATION ERROR:\n\nAll fields and document uploads are strictly mandatory!\n\nThe following items are missing:\n\n• ${missing.join('\n• ')}\n\nPlease complete all required fields and upload all mandatory verification documents before submitting.`);
      return;
    }

    setLoading(true);

    try {
      // POST delivery partner data to backend
      try {
        await fetch('http://localhost:5000/api/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (apiErr) {
        console.error("Delivery API save error:", apiErr);
      }

      const generatedId = `TL-${Math.floor(10000 + Math.random() * 90000)}-B`;
      const date = new Date();
      date.setDate(date.getDate() + 2);
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options).toUpperCase();

      setRefId(generatedId);
      setExpectedDate(formattedDate);

      setSubmitted(true);
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#F5F3EF', '#1A1A1A', '#665d52', '#DED9D1']
      });

      // Clear draft on successful submission
      localStorage.removeItem('tiffinlink_delivery_partner_draft');

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showLicense = formData.vehicleType !== 'bicycle';

  return (
    <div className="fixed inset-0 z-[5000] bg-bone-white overflow-y-auto w-screen h-screen flex flex-col animate-fade-in text-onyx-black font-body-md selection:bg-sand-neutral selection:text-onyx-black">
      
      {/* Dynamic styles to match user HTML */}
      <style>{`
        .font-headline-md { font-family: 'EB Garamond', serif; }
        .font-headline-lg { font-family: 'EB Garamond', serif; }
        .font-display-lg { font-family: 'EB Garamond', serif; }
        .font-label-caps { font-family: 'Hanken Grotesk', sans-serif; text-transform: uppercase; }
        .font-body-md { font-family: 'Hanken Grotesk', sans-serif; }
        .font-button-text { font-family: 'Hanken Grotesk', sans-serif; }

        /* Minimalist Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #F5F3EF; }
        ::-webkit-scrollbar-thumb { background: #DED9D1; }

        .reveal-section {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .input-underline {
          border: none;
          border-bottom: 1px solid #DED9D1;
          background: transparent;
          transition: border-color 0.3s ease;
        }
        .input-underline:focus {
          outline: none;
          border-color: #1A1A1A;
          box-shadow: none;
        }

        .toggle-checkbox:checked {
          right: 0px !important;
          background-color: #1A1A1A !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .reveal-up {
          animation: revealUp 1s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          opacity: 0;
        }
        @keyframes revealUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .line-draw {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Website Navigation Header - Suppressed on Confirmation Screen */}
      {!submitted && <Navbar forceSolid={true} isFormOpen={true} onCloseForm={onClose} />}

      {submitted ? (
        <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop py-12 md:py-24 relative overflow-hidden w-full">
          {/* Abstract Background Graphic (Architectural minimalist aesthetic) */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-sand-neutral/20 z-0 hidden md:block"></div>
          
          <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter items-center relative z-10 pt-8 md:pt-16">
            
            {/* Visual Section (Bento-inspired asymmetrical layout) */}
            <div className="col-span-1 md:col-span-6 flex justify-center items-center mb-12 md:mb-0 reveal-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative w-full aspect-square max-w-[500px]">
                {/* Minimalist Architectural Success Icon/Graphic */}
                <div className="absolute inset-0 bg-surface-container-high overflow-hidden">
                  <img 
                    className="w-full h-full object-cover mix-blend-multiply opacity-30 select-none pointer-events-none" 
                    alt="Minimalist architectural success graphic" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzqM50qt6lhwb5lUS2ttdNUI1lcgPDWtoC_XQPZD9f6ZjNAC_D38LncKMbz23CaVIJqtl6BIJC0O00vR3WeS6opCEeC8MelEcaI3gSt0kxXm2T7zZ9l6o3unEbaPCjLYDy3KL6dsjFcW9c8KUQmd4Qe4ZbU18kCnzA9MEtSKa0TmUm6gj49WK3-OnP3c5SnInqAjXEraQhjht8MBIfCJTf2j86EW9PsqnikR-nN53VK7yOUiSS6DQh"
                  />
                </div>
                {/* SVG Success Checkmark */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-1/2 h-1/2" fill="none" height="200" viewBox="0 0 200 200" width="200" xmlns="http://www.w3.org/2000/svg">
                    <circle className="text-onyx-black/10" cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="1"></circle>
                    <path className="text-onyx-black line-draw" d="M60 105L85 130L145 70" stroke="currentColor" strokeLinecap="square" strokeWidth="2"></path>
                  </svg>
                </div>
                {/* Floating Tonal Card (Overlapping depth) */}
                <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-onyx-black hidden md:block reveal-up" style={{ animationDelay: '0.4s' }}>
                  <div className="p-6 flex flex-col justify-end h-full">
                    <p className="font-label-caps text-label-caps text-bone-white text-[10px] tracking-widest">STATUS</p>
                    <p className="font-body-md text-body-md text-bone-white/60">VERIFIED PENDING</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="col-span-1 md:col-span-5 md:col-start-8">
              <header className="reveal-up" style={{ animationDelay: '0.2s' }}>
                <span className="font-label-caps text-label-caps text-clay-earth mb-4 block text-xs tracking-widest">SUCCESS</span>
                <h1 className="font-headline-lg text-[36px] md:text-[48px] text-onyx-black mb-6 uppercase leading-tight font-headline-lg">
                  Application Submitted Successfully
                </h1>
              </header>
              <div className="reveal-up" style={{ animationDelay: '0.3s' }}>
                <p className="font-body-lg text-body-lg text-secondary mb-12 max-w-md">
                  Your application has been received. Our team will verify your documents and contact you within 24–48 hours. You can track your application status from your dashboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-gutter">
                  <button 
                    onClick={onClose}
                    className="bg-onyx-black text-white px-8 py-4 font-button-text text-button-text transition-transform active:scale-95 hover:opacity-90 duration-200"
                  >
                    Go to Dashboard
                  </button>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-onyx-black font-button-text text-button-text py-4 border-b border-onyx-black/20 hover:border-onyx-black transition-all duration-300"
                  >
                    Review Submission
                  </button>
                </div>
              </div>
              
              {/* Info List */}
              <div className="mt-20 reveal-up border-t border-sand-neutral pt-8" style={{ animationDelay: '0.5s' }}>
                <div className="grid grid-cols-2 gap-gutter">
                  <div>
                    <p className="font-label-caps text-label-caps text-clay-earth mb-2 text-[10px] tracking-widest">REFERENCE ID</p>
                    <p className="font-body-md text-body-md font-semibold">{refId}</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-label-caps text-clay-earth mb-2 text-[10px] tracking-widest">EXPECTED BY</p>
                    <p className="font-body-md text-body-md font-semibold">{expectedDate}</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </main>
      ) : (
        <main className="flex-grow max-w-[1440px] w-full mx-auto px-margin-mobile md:px-margin-desktop pt-32 pb-12 md:pt-40 md:pb-24">
          
          {/* Hero Banner Section */}
          <div className="relative w-full h-[380px] md:h-[500px] overflow-hidden flex flex-col justify-end p-8 md:p-16 mb-20 group">
            {/* Background Image Container with Zoom effect */}
            <div className="absolute inset-0 z-0 transition-transform duration-[1.5s] ease-out group-hover:scale-105">
              <img 
                src="/assets/becomedeliveryform.jpg" 
                alt="Delivery Partner Background" 
                className="w-full h-full object-cover"
              />
              {/* Premium dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-onyx-black via-onyx-black/35 to-transparent"></div>
            </div>

            {/* Content overlay */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-gutter items-end w-full">
              <div className="md:col-span-8 text-bone-white">
                <span className="font-label-caps text-label-caps text-sand-neutral block mb-4 uppercase tracking-[0.2em] text-xs">Join the Table</span>
                <h1 className="font-display-lg text-[38px] sm:text-[50px] md:text-[72px] mb-4 leading-[1.1] uppercase text-bone-white tracking-tighter">
                  Become a Delivery Partner
                </h1>
                <p className="font-body-md text-bone-white/85 max-w-xl text-sm md:text-base leading-relaxed">
                  Join our artisanal delivery ecosystem. We value precision, punctuality, and the art of professional service.
                </p>
              </div>
              <div className="md:col-span-4 flex md:justify-end mt-6 md:mt-0">
                <div className="text-left md:text-right text-bone-white flex flex-col md:items-end gap-2.5">
                  <span className="font-label-caps text-label-caps text-sand-neutral text-xs font-bold tracking-widest flex items-center gap-2">
                    <span>Application Progress:</span>
                    <span className="text-sm font-extrabold text-bone-white font-mono">{animatedProgress}%</span>
                  </span>
                  <div className="w-full md:w-64 h-[3px] bg-sand-neutral/30 relative overflow-hidden rounded-full shadow-inner">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-sand-neutral via-clay-earth to-emerald-400 transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      style={{ width: `${animatedProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-section-gap" id="application-form">
            
            {/* Section 1: Personal Information */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">01. Personal Identity</h2>
                <p className="text-secondary font-body-md">Your primary contact information used for account management.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Full Name</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="As per government ID" 
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Email Address</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="example@tiffinlink.com" 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Mobile Number</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="+1 (000) 000-0000" 
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Date of Birth</label>
                  <input 
                    className="input-underline py-2" 
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="font-label-caps text-label-caps mb-4">Gender</label>
                  <div className="flex gap-8">
                    {['Male', 'Female', 'Other'].map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          className="w-4 h-4 text-onyx-black focus:ring-0 border-sand-neutral cursor-pointer" 
                          name="gender" 
                          type="radio"
                          checked={formData.gender === g}
                          onChange={() => handleGenderChange(g)}
                          required
                        />
                        <span className="font-body-md group-hover:text-primary transition-colors">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Address */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">02. Residency Details</h2>
                <p className="text-secondary font-body-md">Provide your current residential address for logistics planning.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">House No. / Building</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="houseNo"
                    value={formData.houseNo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Street Name</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="streetName"
                    value={formData.streetName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Area / Locality</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">City</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">State</label>
                  <div className="relative">
                    <select 
                      className="input-underline py-2 w-full appearance-none pr-8 cursor-pointer"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select State</option>
                      <option value="ca">California</option>
                      <option value="ny">New York</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 bottom-2 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Pincode / ZIP</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Vehicle & Driving Details */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">03. Vehicle &amp; License</h2>
                <p className="text-secondary font-body-md">Details of your mode of transport. Driving license is mandatory for motorized vehicles.</p>
              </div>
              <div className="md:col-span-8 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="flex flex-col">
                    <label className="font-label-caps text-label-caps mb-2">Vehicle Type</label>
                    <div className="relative">
                      <select 
                        className="input-underline py-2 w-full appearance-none pr-8 cursor-pointer" 
                        id="vehicle-type"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="bicycle">Bicycle</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="car">Car / Van</option>
                        <option value="e-bike">Electric Scooter</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 bottom-2 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label-caps text-label-caps mb-2">Vehicle Registration No.</label>
                    <input 
                      className="input-underline py-2" 
                      placeholder="If applicable" 
                      type="text"
                      name="registrationNo"
                      value={formData.registrationNo}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label-caps text-label-caps mb-2">Brand</label>
                    <input 
                      className="input-underline py-2" 
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="font-label-caps text-label-caps mb-2">Model</label>
                    <input 
                      className="input-underline py-2" 
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Driving Details (Conditional with react-controlled inline css styling) */}
                <div 
                  className="border-t border-sand-neutral border-dashed transition-all duration-500 overflow-hidden" 
                  id="driving-license-section"
                  style={{
                    maxHeight: showLicense ? '500px' : '0px',
                    opacity: showLicense ? 1 : 0,
                    marginTop: showLicense ? '32px' : '0px',
                    paddingTop: showLicense ? '32px' : '0px',
                    borderTopWidth: showLicense ? '1px' : '0px',
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="flex flex-col">
                      <label className="font-label-caps text-label-caps mb-2">Driving License Number</label>
                      <input 
                        className="input-underline py-2" 
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        required={showLicense}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="font-label-caps text-label-caps mb-2">Upload License Copy</label>
                      <div className="flex items-center gap-4 py-2 border-b border-sand-neutral">
                        <span className="material-symbols-outlined text-secondary">upload_file</span>
                        <span className="text-sm text-secondary truncate max-w-[180px]">
                          {formData.licenseCopyName || 'PDF, JPG (Max 5MB)'}
                        </span>
                        <input 
                          className="hidden" 
                          id="license-upload" 
                          type="file"
                          ref={licenseInputRef}
                          onChange={(e) => handleFileChange(e, 'licenseCopy')}
                        />
                        <button 
                          className="ml-auto font-label-caps text-[10px] bg-onyx-black text-white px-3 py-1 cursor-pointer select-none hover:bg-clay-earth transition-colors"
                          type="button"
                          onClick={() => licenseInputRef.current && licenseInputRef.current.click()}
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: ID Verification */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">04. Verification</h2>
                <p className="text-secondary font-body-md">Upload clear scans of your government-issued identification cards.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">ID Document Type</label>
                  <div className="relative">
                    <select 
                      className="input-underline py-2 w-full appearance-none pr-8 cursor-pointer"
                      name="idType"
                      value={formData.idType}
                      onChange={handleInputChange}
                      required
                    >
                      <option>Passport</option>
                      <option>National Identity Card</option>
                      <option>Voter ID</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 bottom-2 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">ID Number</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {/* ID Front view uploader */}
                <div className="flex flex-col border-b border-sand-neutral pb-4">
                  <label className="font-label-caps text-label-caps mb-4">Front View</label>
                  <input 
                    type="file" 
                    ref={idFrontInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idFront')}
                  />
                  <div 
                    onClick={() => idFrontInputRef.current && idFrontInputRef.current.click()}
                    className="aspect-video bg-surface-container flex flex-col items-center justify-center border border-dashed border-sand-neutral group cursor-pointer hover:bg-white transition-colors duration-300 relative overflow-hidden"
                  >
                    {formData.idFront ? (
                      <>
                        <img src={formData.idFront} alt="ID Front View" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-onyx-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="material-symbols-outlined text-white mb-1">edit</span>
                          <span className="text-[10px] text-white font-label-caps">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-clay-earth mb-2">add_a_photo</span>
                        <span className="text-xs text-secondary group-hover:text-primary">Click to upload image</span>
                      </>
                    )}
                  </div>
                  {formData.idFrontName && (
                    <span className="text-[10px] text-secondary mt-1 truncate">{formData.idFrontName}</span>
                  )}
                </div>

                {/* ID Back view uploader */}
                <div className="flex flex-col border-b border-sand-neutral pb-4">
                  <label className="font-label-caps text-label-caps mb-4">Back View</label>
                  <input 
                    type="file" 
                    ref={idBackInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idBack')}
                  />
                  <div 
                    onClick={() => idBackInputRef.current && idBackInputRef.current.click()}
                    className="aspect-video bg-surface-container flex flex-col items-center justify-center border border-dashed border-sand-neutral group cursor-pointer hover:bg-white transition-colors duration-300 relative overflow-hidden"
                  >
                    {formData.idBack ? (
                      <>
                        <img src={formData.idBack} alt="ID Back View" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-onyx-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="material-symbols-outlined text-white mb-1">edit</span>
                          <span className="text-[10px] text-white font-label-caps">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-clay-earth mb-2">add_a_photo</span>
                        <span className="text-xs text-secondary group-hover:text-primary">Click to upload image</span>
                      </>
                    )}
                  </div>
                  {formData.idBackName && (
                    <span className="text-[10px] text-secondary mt-1 truncate">{formData.idBackName}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Section 5: Bank Details */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">05. Financials</h2>
                <p className="text-secondary font-body-md">Account details for weekly remuneration processing.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Account Holder Name</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Bank Name</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Account Number</label>
                  <input 
                    className="input-underline py-2" 
                    type="password"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">IFSC / Routing Code</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="routingCode"
                    value={formData.routingCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="font-label-caps text-label-caps mb-2">UPI ID (Optional)</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="username@bank" 
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Section 6: Emergency Contact */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">06. Safety</h2>
                <p className="text-secondary font-body-md">A designated contact in case of on-field emergencies.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Contact Name</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Relationship</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Mobile</label>
                  <input 
                    className="input-underline py-2" 
                    type="tel"
                    name="emergencyMobile"
                    value={formData.emergencyMobile}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Section 7: Availability */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">07. Scheduling</h2>
                <p className="text-secondary font-body-md">Define your preferred work rhythm and operational area.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col md:col-span-2">
                  <label className="font-label-caps text-label-caps mb-4">Working Days</label>
                  <div className="flex flex-wrap gap-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const isSelected = formData.workingDays.includes(day);
                      return (
                        <button 
                          key={day}
                          className={`day-toggle px-4 py-2 border border-sand-neutral text-xs font-label-caps transition-all ${
                            isSelected 
                              ? 'bg-onyx-black text-white border-onyx-black' 
                              : 'hover:border-onyx-black text-onyx-black bg-transparent'
                          }`}
                          type="button"
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Time Slot</label>
                  <div className="relative">
                    <select 
                      className="input-underline py-2 w-full appearance-none pr-8 cursor-pointer"
                      name="timeSlot"
                      value={formData.timeSlot}
                      onChange={handleInputChange}
                      required
                    >
                      <option>Morning (7 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 5 PM)</option>
                      <option>Full Day</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 bottom-2 text-secondary pointer-events-none select-none text-[18px]">keyboard_arrow_down</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Preferred Area</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="Enter neighborhood" 
                    type="text"
                    name="preferredArea"
                    value={formData.preferredArea}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {/* Slide Toggle Switch */}
                <div className="flex items-center gap-4 md:col-span-2 mt-4">
                  <div className="relative inline-block w-12 h-6 align-middle select-none">
                    <input 
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-2 border-sand-neutral appearance-none cursor-pointer transition-all duration-300 right-6 checked:right-0" 
                      id="available-now" 
                      name="startImmediately" 
                      type="checkbox"
                      checked={formData.startImmediately}
                      onChange={handleInputChange}
                    />
                    <label 
                      className="toggle-label block overflow-hidden h-6 rounded-full bg-sand-neutral cursor-pointer" 
                      htmlFor="available-now"
                    ></label>
                  </div>
                  <span className="font-body-md select-none">Available to start immediately</span>
                </div>
              </div>
            </section>

            {/* Section 8: Additional Information */}
            <section className="reveal-section grid grid-cols-1 md:grid-cols-12 gap-gutter border-t border-sand-neutral pt-12">
              <div className="md:col-span-4">
                <h2 className="font-headline-md text-3xl mb-4">08. Background</h2>
                <p className="text-secondary font-body-md">Optional information to help us understand your experience.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Previous Experience</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="e.g., 2 years in logistics" 
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-label-caps mb-2">Languages Known</label>
                  <input 
                    className="input-underline py-2" 
                    placeholder="English, Spanish, etc." 
                    type="text"
                    name="languages"
                    value={formData.languages}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label className="font-label-caps text-label-caps mb-2">Referral Code</label>
                  <input 
                    className="input-underline py-2" 
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Section 9: Terms & Submission */}
            <section className="reveal-section border-t border-sand-neutral pt-12">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="space-y-4">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input 
                      className="mt-1 w-4 h-4 text-onyx-black focus:ring-0 border-sand-neutral cursor-pointer" 
                      type="checkbox"
                      name="confirmAccurate"
                      checked={formData.confirmAccurate}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="text-sm text-secondary group-hover:text-primary transition-colors select-none">
                      I confirm that all information provided is accurate and verifiable.
                    </span>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input 
                      className="mt-1 w-4 h-4 text-onyx-black focus:ring-0 border-sand-neutral cursor-pointer" 
                      type="checkbox"
                      name="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="text-sm text-secondary group-hover:text-primary transition-colors select-none">
                      I agree to the TiffinLink Partner Privacy Policy and Data Collection Terms.
                    </span>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input 
                      className="mt-1 w-4 h-4 text-onyx-black focus:ring-0 border-sand-neutral cursor-pointer" 
                      type="checkbox"
                      name="understandBackgroundCheck"
                      checked={formData.understandBackgroundCheck}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="text-sm text-secondary group-hover:text-primary transition-colors select-none">
                      I understand that a background check may be conducted as part of the onboarding process.
                    </span>
                  </label>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 pt-12">
                  <button 
                    onClick={handleSaveDraft}
                    className="flex-1 px-8 py-4 border border-onyx-black text-onyx-black font-button-text text-button-text hover:bg-surface-container transition-all active:scale-98" 
                    type="button"
                  >
                    Save as Draft
                  </button>
                  <button 
                    className="flex-1 px-8 py-4 bg-onyx-black text-white font-button-text text-button-text hover:bg-clay-earth transition-all active:scale-98 flex items-center justify-center gap-2" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                </div>
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
