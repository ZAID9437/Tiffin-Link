import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Shield, FileText, Search, Printer, CheckCircle, 
  ExternalLink, ChevronRight, Lock, BookOpen, AlertCircle, 
  Share2, Check, Download, Mail
} from 'lucide-react';
import { LEGAL_DOCUMENTS } from './legalContent';

export default function ThemedLegalModal({ 
  isOpen, 
  onClose, 
  initialDocId = 'privacy-policy',
  onAcknowledge,
  requireAcknowledgement = false
}) {
  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (initialDocId && LEGAL_DOCUMENTS[initialDocId]) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeDoc = LEGAL_DOCUMENTS[selectedDocId] || LEGAL_DOCUMENTS['privacy-policy'];

  // Categories list
  const categories = ['All', 'Core Policies', 'Role Agreements', 'Disclaimers'];

  // Filtered documents list
  const filteredDocs = useMemo(() => {
    return Object.values(LEGAL_DOCUMENTS).filter(doc => {
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.sections.some(s => s.heading.toLowerCase().includes(searchQuery.toLowerCase()) || s.content.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/#${activeDoc.id}`;
      navigator.clipboard?.writeText(url).then(() => {
        setHasCopiedLink(true);
        setTimeout(() => setHasCopiedLink(false), 2000);
      });
    }
  };

  const handleDownloadText = () => {
    const textContent = `${activeDoc.title.toUpperCase()}\n` +
      `Category: ${activeDoc.category}\n` +
      `Last Updated: ${activeDoc.lastUpdated} | Effective Date: ${activeDoc.effectiveDate}\n\n` +
      `SUMMARY:\n${activeDoc.summary}\n\n` +
      activeDoc.sections.map(s => `${s.heading}\n${s.content}\n`).join('\n\n') +
      `\n\n© TiffinLink Artisanal Dining Technologies Pvt. Ltd. All Rights Reserved.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TiffinLink_${activeDoc.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div 
        style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
        className="relative w-full max-w-5xl h-[92vh] max-h-[880px] bg-[#fbf9f5] dark:bg-[#151518] border border-[#ded9d1] dark:border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#181512] dark:text-[#fbf9f5]"
      >
        {/* Top Decorative Gold/Amber Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#6B4B2B] to-[#D4AF37]/20 z-20" />

        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-[#ded9d1] dark:border-stone-800 flex items-center justify-between shrink-0 bg-[#fbf9f5]/90 dark:bg-[#151518]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B4B2B]/10 dark:bg-[#D4AF37]/15 text-[#6B4B2B] dark:text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#6B4B2B]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 
                  id="legal-modal-title"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  className="text-xl sm:text-2xl font-medium tracking-tight text-[#181512] dark:text-white leading-tight"
                >
                  TiffinLink Legal &amp; Policies
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-[#D4AF37]/20 text-[#8C6239] dark:text-[#D4AF37] border border-[#D4AF37]/30">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-[#665d52] dark:text-stone-400">
                Transparent agreements governing dining, verified kitchens, fleet dispatch, and data privacy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#665d52] dark:text-stone-400 hover:text-[#181512] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content Reader */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left Sidebar: Document Navigation */}
          <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#ded9d1] dark:border-stone-800 flex flex-col shrink-0 bg-[#f5f3ef]/50 dark:bg-stone-900/40">
            {/* Search within Policies */}
            <div className="p-3.5 border-b border-[#ded9d1] dark:border-stone-800">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clauses or terms..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-800 border border-[#ded9d1] dark:border-stone-700 rounded-xl text-xs text-[#181512] dark:text-stone-100 placeholder-[#8C827A] focus:outline-none focus:ring-1 focus:ring-[#6B4B2B]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pt-2.5 pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-[#181512] text-white dark:bg-stone-100 dark:text-[#181512] font-semibold' 
                        : 'bg-black/5 dark:bg-white/5 text-[#665d52] dark:text-stone-400 hover:bg-black/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Document List */}
            <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {filteredDocs.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8C827A]">
                  No matching policies found.
                </div>
              ) : (
                filteredDocs.map(doc => {
                  const isSelected = doc.id === activeDoc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected 
                          ? 'bg-white dark:bg-stone-800 border border-[#ded9d1] dark:border-stone-700 shadow-xs' 
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#665d52] dark:text-stone-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded ${
                            isSelected 
                              ? 'bg-[#6B4B2B]/10 text-[#6B4B2B] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37]' 
                              : 'text-[#8C827A]'
                          }`}>
                            {doc.badge}
                          </span>
                        </div>
                        <p className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-[#181512] dark:text-white font-bold' : ''
                        }`}>
                          {doc.title}
                        </p>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 transition-transform ${
                        isSelected ? 'text-[#6B4B2B] dark:text-[#D4AF37] translate-x-0.5' : 'text-[#8C827A] opacity-60'
                      }`} />
                    </button>
                  );
                })
              )}
            </nav>
          </aside>

          {/* Right Reader: Active Legal Policy Text */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white dark:bg-stone-900/60">
            
            {/* Document Header & Actions */}
            <div className="px-6 sm:px-10 py-5 border-b border-[#ded9d1] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-label-caps text-[10px] font-bold tracking-[0.2em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase">
                    {activeDoc.category} &bull; {activeDoc.badge}
                  </span>
                </div>
                <h1 
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  className="text-2xl sm:text-3xl font-medium tracking-tight text-[#181512] dark:text-white"
                >
                  {activeDoc.title}
                </h1>
                <p className="text-[11px] font-mono text-[#8C827A] dark:text-stone-400 mt-0.5">
                  Effective: {activeDoc.effectiveDate} &bull; Last Revised: {activeDoc.lastUpdated}
                </p>
              </div>

              {/* Utility actions: Print, Share, Download */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy permanent policy link"
                  className="p-2 rounded-xl border border-[#ded9d1] dark:border-stone-700 hover:bg-[#f5f3ef] dark:hover:bg-stone-800 text-[#665d52] dark:text-stone-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  {hasCopiedLink ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                  <span className="hidden sm:inline">{hasCopiedLink ? 'Copied' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadText}
                  title="Download offline copy"
                  className="p-2 rounded-xl border border-[#ded9d1] dark:border-stone-700 hover:bg-[#f5f3ef] dark:hover:bg-stone-800 text-[#665d52] dark:text-stone-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  title="Print this policy"
                  className="p-2 rounded-xl border border-[#ded9d1] dark:border-stone-700 hover:bg-[#f5f3ef] dark:hover:bg-stone-800 text-[#665d52] dark:text-stone-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6 text-sm text-[#4a4238] dark:text-stone-300 leading-relaxed">
              
              {/* Executive Summary Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#f5f3ef] dark:bg-stone-800/70 border border-[#ded9d1] dark:border-stone-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#6B4B2B] dark:bg-[#D4AF37]" />
                <div className="flex items-start gap-3">
                  <BookOpen className="w-4 h-4 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B4B2B] dark:text-[#D4AF37] mb-1">
                      Plain-Language Summary
                    </h3>
                    <p className="text-xs sm:text-sm text-[#665d52] dark:text-stone-300 leading-normal">
                      {activeDoc.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Numbered Legal Sections */}
              <div className="space-y-6 pt-2">
                {activeDoc.sections.map((section, idx) => (
                  <section 
                    key={idx}
                    className="pb-5 border-b border-[#ded9d1]/60 dark:border-stone-800/60 last:border-b-0 space-y-2"
                  >
                    <h2 
                      style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                      className="text-lg sm:text-xl font-medium tracking-tight text-[#181512] dark:text-white"
                    >
                      {section.heading}
                    </h2>
                    <div className="text-xs sm:text-sm text-[#4a4238] dark:text-stone-300 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>

              {/* Regulatory Contact Notice */}
              <div className="p-4 rounded-xl border border-dashed border-[#ded9d1] dark:border-stone-700 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-[#665d52] dark:text-stone-400">
                  <Mail size={15} />
                  <span>Have questions regarding our terms or compliance?</span>
                </div>
                <a 
                  href="mailto:legal@tiffinlink.in"
                  className="font-bold text-[#6B4B2B] dark:text-[#D4AF37] hover:underline shrink-0"
                >
                  Contact Legal Desk &rarr;
                </a>
              </div>
            </div>

            {/* Modal Footer (Optional Acknowledgement or Close) */}
            <div className="px-6 sm:px-10 py-4 border-t border-[#ded9d1] dark:border-stone-800 bg-[#fbf9f5] dark:bg-stone-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-[#8C827A] dark:text-stone-400">
                Document Reference: TL-LEGAL-{activeDoc.id.toUpperCase().replace(/-/g, '_')}-V2.4
              </div>

              <div className="flex items-center gap-3">
                {requireAcknowledgement ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAcknowledged(true);
                      if (onAcknowledge) onAcknowledge(activeDoc.id);
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#181512] dark:bg-white text-white dark:text-[#181512] font-bold text-xs uppercase tracking-wider hover:bg-[#6B4B2B] dark:hover:bg-stone-200 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle size={15} />
                    <span>I Accept &amp; Acknowledge</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#181512] dark:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-[#6B4B2B] transition-colors cursor-pointer"
                  >
                    Close Policy Viewer
                  </button>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
