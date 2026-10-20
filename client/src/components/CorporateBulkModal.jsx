import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  X,
  FileText,
  TrendingDown,
  Award,
  Sparkles
} from 'lucide-react';
import { submitCorporateInquiry } from '../services/advancedFeaturesApi';

export default function CorporateBulkModal({ isOpen, onClose }) {
  const [companyName, setCompanyName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mealCount, setMealCount] = useState(25);
  const [billingPlan, setBillingPlan] = useState('monthly_invoice');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitCorporateInquiry({
        companyName,
        officeAddress,
        contactPerson,
        email,
        phone,
        mealCountDaily: mealCount,
        billingPreference: billingPlan
      });
      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (e) {
      alert('Inquiry received: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-onyx-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-bone-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-sand-neutral/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header - Editorial Artisanal Theme */}
        <div className="p-6 bg-surface-container dark:bg-stone-900 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                B2B ENTERPRISE CONCIERGE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps tracking-wider uppercase bg-sand-neutral/80 dark:bg-stone-800 text-onyx-black dark:text-stone-300 border border-sand-neutral">
                CORPORATE DESK
              </span>
            </div>
            <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-bone-white font-normal leading-tight">
              Corporate &amp; Office Lunch Desk
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-secondary dark:text-stone-400">
              Fresh, hygienic homestyle meals curated for IT parks, tech hubs, &amp; enterprise teams.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-sand-neutral/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-sand-neutral/80 dark:border-stone-700 flex items-center justify-center text-onyx-black dark:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-onyx-black dark:text-stone-100">
          {submitted ? (
            <div className="text-center py-8 space-y-3 p-6 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800">
              <div className="w-12 h-12 rounded-full bg-surface-container text-[#6B4B2B] dark:text-[#D4AF37] flex items-center justify-center mx-auto border border-sand-neutral">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-xl text-onyx-black dark:text-bone-white font-normal">
                Corporate Pilot Request Received!
              </h4>
              <p className="font-body-md text-xs text-secondary dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                Our Corporate Relations Team will contact <strong>{contactPerson}</strong> at <strong>{companyName}</strong> today to schedule a <strong>Free Complimentary 5-Thali Tasting Session</strong> at your office.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Highlight Banner Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800 text-center shadow-2xs">
                  <TrendingDown className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] mx-auto mb-1" />
                  <div className="font-serif text-xs font-semibold text-onyx-black dark:text-bone-white">Up to 30% OFF</div>
                  <div className="font-body-md text-[10px] text-secondary dark:text-stone-400">Tiered Volume Pricing</div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800 text-center shadow-2xs">
                  <FileText className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] mx-auto mb-1" />
                  <div className="font-serif text-xs font-semibold text-onyx-black dark:text-bone-white">GST Invoices</div>
                  <div className="font-body-md text-[10px] text-secondary dark:text-stone-400">Input Tax Credit Ready</div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800 text-center shadow-2xs">
                  <Award className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] mx-auto mb-1" />
                  <div className="font-serif text-xs font-semibold text-onyx-black dark:text-bone-white">100% Satvik</div>
                  <div className="font-body-md text-[10px] text-secondary dark:text-stone-400">Ayush/FSSAI Audited</div>
                </div>
              </div>

              {/* Form Input Group */}
              <div className="p-5 rounded-xl border border-sand-neutral/80 dark:border-stone-800 bg-surface-container-lowest dark:bg-[#1E1E22] shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                      COMPANY / ORGANIZATION NAME
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Infosys / CyberTech Labs"
                      required
                      className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                      OFFICE / TECH PARK LOCATION
                    </label>
                    <input
                      type="text"
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      placeholder="e.g. Infocity Tower 2, Gandhinagar"
                      required
                      className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                      CONTACT PERSON
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="HR / Ops Lead"
                      required
                      className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                      WORK EMAIL
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hr@company.com"
                      required
                      className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                      DIRECT PHONE
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs placeholder:text-stone-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase">
                      ESTIMATED DAILY HEADCOUNT:
                    </label>
                    <span className="font-serif text-sm font-semibold text-[#6B4B2B] dark:text-[#D4AF37]">
                      {mealCount} Meals / Day
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={mealCount}
                    onChange={(e) => setMealCount(Number(e.target.value))}
                    className="w-full accent-onyx-black dark:accent-[#D4AF37] cursor-pointer"
                  />
                  <div className="flex justify-between font-label-caps text-[10px] text-secondary dark:text-stone-400 mt-1">
                    <span>10 Meals</span>
                    <span>100 Meals</span>
                    <span>300+ Enterprise Meals</span>
                  </div>
                </div>

                <div>
                  <label className="font-label-caps text-[11px] font-bold tracking-widest text-[#2E1E12] dark:text-[#F3E5AB] uppercase block mb-1.5">
                    CORPORATE SUBSIDY MODEL
                  </label>
                  <select
                    value={billingPlan}
                    onChange={(e) => setBillingPlan(e.target.value)}
                    className="w-full bg-surface-container-low dark:bg-stone-800/80 border border-sand-neutral/90 dark:border-stone-700 focus:border-onyx-black dark:focus:border-sand-neutral focus:ring-1 focus:ring-onyx-black rounded-lg px-3.5 py-2.5 text-onyx-black dark:text-white font-body-md text-xs outline-none transition-all cursor-pointer"
                  >
                    <option value="monthly_invoice">100% Company Sponsored (Monthly GST Invoice)</option>
                    <option value="copay_50_50">50-50 Co-Pay (Company Subsidizes Half, Employee Pays Half)</option>
                    <option value="employee_direct_discount">Employee Direct Pay with Corporate 20% Discount</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? 'SUBMITTING...' : 'REQUEST CORPORATE PROPOSAL & FREE TASTING BOX'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
