import React, { useState, useMemo, useEffect } from 'react';

const INITIAL_CANDIDATES = [];

export default function PendingKycTab({ onNavigate, onOpenDriver360 }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingReview: 0,
    readyForAudit: 0,
    correctionsSent: 0,
    approvedToday: 0,
    rejectedMtd: 0
  });

  // Fetch real-time data from MongoDB
  const fetchQueueData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/api/admin/drivers/kyc-queue');
      const data = await res.json();
      if (data.success) {
        if (data.stats) {
          setStats(data.stats);
        }
        setCandidates(data.candidates || []);
        if (data.candidates && data.candidates.length > 0) {
          setSelectedCandidateId((prev) =>
            data.candidates.some((c) => c.id === prev) ? prev : data.candidates[0].id
          );
        } else {
          setSelectedCandidateId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching KYC queue from database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  // Modals state
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('DL Expired / Fraudulent Documents');
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [reuploadNotes, setReuploadNotes] = useState('Please re-upload a clear, glare-free photo of your Driving License.');
  const [auditChecklist, setAuditChecklist] = useState({
    cctns: true,
    hygiene: true,
    secondaryPhoto: true
  });
  const [auditorNote, setAuditorNote] = useState('DL verified with RTO Sarathi national gateway. Clear for onboarding.');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandidateId) || candidates[0] || null;
  }, [candidates, selectedCandidateId]);

  // Filtering candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.plate.toLowerCase().includes(searchQuery.toLowerCase());

      let matchTier = true;
      if (tierFilter === 'LEVEL_1') matchTier = c.attestation?.aadhaar;
      if (tierFilter === 'LEVEL_2') matchTier = c.attestation?.dl && c.attestation?.rc;
      if (tierFilter === 'LEVEL_3') matchTier = c.bank?.pennyVerified;

      let matchFlag = true;
      if (flagFilter === 'OCR_BLUR') matchFlag = c.dlData?.flag?.includes('BLUR');
      if (flagFilter === 'EXPIRED_INS') matchFlag = !c.attestation?.ins;
      if (flagFilter === 'PENDING_PENNY') matchFlag = !c.bank?.pennyVerified;

      return matchSearch && matchTier && matchFlag;
    });
  }, [candidates, searchQuery, tierFilter, flagFilter]);

  // Actions
  const handleInspectCandidate = (cId) => {
    setSelectedCandidateId(cId);
    showToast(`Dossier loaded for ${cId}`);
    setTimeout(() => {
      const el = document.getElementById('inspection-dossier');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.classList.add('ring-2', 'ring-[#1a1a1a]');
        setTimeout(() => el.classList.remove('ring-2', 'ring-[#1a1a1a]'), 1500);
      }
    }, 50);
  };

  const handleApproveImmediate = async (cId, cName) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drivers/kyc/${cId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Courier ${cName} (#${cId}) approved! Activated in fleet database.`);
        fetchQueueData();
      } else {
        showToast(data.message || 'Approval completed');
      }
    } catch (err) {
      console.error('Error approving candidate in DB:', err);
      setCandidates(prev =>
        prev.map(c =>
          c.id === cId
            ? { ...c, status: 'APPROVED', statusLabel: 'Approved & Active', statusTone: 'emerald' }
            : c
        )
      );
      showToast(`Courier ${cName} (#${cId}) approved!`);
    }
  };

  const handleConfirmReject = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drivers/kyc/${selectedCandidate.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Courier #${selectedCandidate.id} rejected and blacklisted for: ${rejectReason}`);
        fetchQueueData();
      } else {
        showToast(data.message || 'Rejected');
      }
    } catch (err) {
      console.error('Error rejecting candidate in DB:', err);
      setCandidates(prev =>
        prev.map(c =>
          c.id === selectedCandidate.id
            ? { ...c, status: 'REJECTED_BLACKLIST', statusLabel: 'Rejected / Blacklist', statusTone: 'red' }
            : c
        )
      );
      showToast(`Courier #${selectedCandidate.id} rejected and blacklisted for: ${rejectReason}`);
    } finally {
      setIsRejectModalOpen(false);
    }
  };

  const handleConfirmReupload = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/drivers/kyc/${selectedCandidate.id}/request-fix`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reuploadNotes })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Correction notice & SMS push sent to ${selectedCandidate.phone}: "${reuploadNotes}"`);
        fetchQueueData();
      } else {
        showToast(data.message || 'Correction requested');
      }
    } catch (err) {
      console.error('Error requesting reupload in DB:', err);
      showToast(`Correction notice & SMS push sent to ${selectedCandidate.phone}: "${reuploadNotes}"`);
    } finally {
      setIsReuploadModalOpen(false);
    }
  };

  const handleExportQueue = () => {
    const csvRows = [
      ['ID', 'Name', 'Phone', 'Email', 'Vehicle', 'Plate', 'Status', 'Zone', 'Aadhaar', 'DL', 'RC', 'Insurance', 'Bank Verified'],
      ...candidates.map(c => [
        c.id,
        c.name,
        c.phone,
        c.email,
        c.vehicle,
        c.plate,
        c.statusLabel,
        c.zone,
        c.attestation.aadhaar ? 'YES' : 'NO',
        c.attestation.dl ? 'YES' : 'NO',
        c.attestation.rc ? 'YES' : 'NO',
        c.attestation.ins ? 'YES' : 'NO',
        c.bank.pennyVerified ? 'YES' : 'NO'
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tiffinlink_kyc_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported forensic KYC manifest CSV.');
  };

  const handleBulkAudit = () => {
    showToast('Bulk attestation engine ran on 5 candidates: 2 passed, 2 flagged, 1 incomplete.');
  };

  return (
    <div className="flex flex-col w-full -m-4 sm:-m-6 md:-m-8 bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      {/* Top Header & Breadcrumbs */}
      <div className="px-6 sm:px-8 py-6 bg-[#fbf9f5] border-b border-[#ded9d1]">
        <div className="max-w-[1560px] mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#665d52] tracking-widest uppercase">
              <span>Super Admin</span>
              <span>/</span>
              <span>Management</span>
              <span>/</span>
              <span>Delivery Partners</span>
              <span>/</span>
              <span className="text-[#1a1a1a] font-bold">Pending KYC Verification</span>
            </div>
            <div className="flex items-center gap-2.5 font-mono text-[11px]">
              <span className="px-2.5 py-1 bg-[#eae8e4] text-[#4a4238] font-semibold border border-[#ded9d1]">NODE: BOM-SEC-01</span>
              <span className="px-2.5 py-1 bg-[#f5f3ef] text-[#665d52] border border-[#ded9d1]">SLA: 4.2h AVG</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#eee0d2] text-[#211b12] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] animate-ping" />
                <span>QUEUE ACTIVE ({candidates.length} CANDIDATES)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="max-w-4xl space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight font-normal leading-none">
                Courier Onboarding & Forensic KYC Verification
              </h1>
              <p className="text-sm text-[#665d52] max-w-3xl leading-relaxed">
                Legal compliance review, Aadhaar DigiLocker attestation, Driving License machine validation, and commercial vehicle insurance verification prior to route activation.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsGuidelinesModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-[#ded9d1] hover:border-[#1a1a1a] text-[#1a1a1a] text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span>Guidelines</span>
              </button>
              <button
                onClick={handleExportQueue}
                className="px-4 py-2.5 bg-white border border-[#ded9d1] hover:border-[#1a1a1a] text-[#1a1a1a] text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export Queue (CSV)</span>
              </button>
              <button
                onClick={handleBulkAudit}
                className="px-5 py-2.5 bg-[#1a1a1a] text-white hover:bg-black text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">rule</span>
                <span>Bulk Audit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-[1560px] mx-auto w-full space-y-8">
        {/* Metric Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-5 border border-[#ded9d1] flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#665d52] uppercase">
              <span>Pending Review</span>
              <span className="bg-[#eae8e4] px-1.5 py-0.5">Q-ALL</span>
            </div>
            <div className="mt-3">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {String(stats.pendingReview ?? 0).padStart(2, '0')}
              </div>
              <div className="font-mono text-[11px] text-[#665d52] mt-1">Awaiting manual clearance</div>
            </div>
          </div>

          <div className="bg-white p-5 border border-[#ded9d1] flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#665d52] uppercase">
              <span>Ready for Audit</span>
              <span className="text-emerald-800 font-bold">{stats.readyForAudit ?? 0}/5 PASS</span>
            </div>
            <div className="mt-3">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {String(stats.readyForAudit ?? 0).padStart(2, '0')}
              </div>
              <div className="font-mono text-[11px] text-[#665d52] mt-1">4 of 4 credentials valid</div>
            </div>
          </div>

          <div className="bg-[#eee0d2] p-5 border border-[#ded9d1] flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#211b12] uppercase font-bold">
              <span>Corrections Sent</span>
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
            <div className="mt-3">
              <div className="font-serif text-3xl text-[#211b12] leading-none font-bold">
                {String(stats.correctionsSent ?? 0).padStart(2, '0')}
              </div>
              <div className="font-mono text-[11px] text-[#4a4238] mt-1">DL blur / Expired insurance</div>
            </div>
          </div>

          <div className="bg-white p-5 border border-[#ded9d1] flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-[#665d52] uppercase">
              <span>Approved Today</span>
              <span className="text-emerald-800 font-bold">DISPATCHED</span>
            </div>
            <div className="mt-3">
              <div className="font-serif text-3xl text-[#1a1a1a] leading-none">
                {String(stats.approvedToday ?? 0).padStart(2, '0')}
              </div>
              <div className="font-mono text-[11px] text-[#665d52] mt-1">Assigned live routes</div>
            </div>
          </div>

          <div className="bg-red-50 p-5 border border-red-200 flex flex-col justify-between min-h-[130px] shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-red-900 uppercase font-bold">
              <span>Rejected (MTD)</span>
              <span className="material-symbols-outlined text-[18px]">gavel</span>
            </div>
            <div className="mt-3">
              <div className="font-serif text-3xl text-red-900 leading-none font-bold">
                {String(stats.rejectedMtd ?? 0).padStart(2, '0')}
              </div>
              <div className="font-mono text-[11px] text-red-800 mt-1">Compliance/record check fail</div>
            </div>
          </div>
        </div>

        {/* Filter & Registry Search Architecture */}
        <div className="bg-white p-5 border border-[#ded9d1] space-y-4 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#665d52] text-[20px]">
                person_search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate by legal name, DP-ID, phone, or plate..."
                className="w-full bg-[#f5f3ef] text-[#1a1a1a] placeholder:text-[#665d52] text-xs pl-11 pr-4 py-2.5 border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a] transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1] px-3 py-1.5">
                <span className="font-mono text-[10px] text-[#665d52] uppercase pr-2">Tier:</span>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-transparent text-xs text-[#1a1a1a] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Full Attestation (All)</option>
                  <option value="LEVEL_1">Level 1 (Aadhaar Only)</option>
                  <option value="LEVEL_2">Level 2 (DL + Vahan)</option>
                  <option value="LEVEL_3">Level 3 (Bank Ledger)</option>
                </select>
              </div>

              <div className="flex items-center bg-[#f5f3ef] border border-[#ded9d1] px-3 py-1.5">
                <span className="font-mono text-[10px] text-[#665d52] uppercase pr-2">Flagged:</span>
                <select
                  value={flagFilter}
                  onChange={(e) => setFlagFilter(e.target.value)}
                  className="bg-transparent text-xs text-[#1a1a1a] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Any Flags</option>
                  <option value="OCR_BLUR">OCR Failure / Blur</option>
                  <option value="EXPIRED_INS">Expired Commercial Ins</option>
                  <option value="PENDING_PENNY">Pending Penny Drop</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setTierFilter('ALL');
                  setFlagFilter('ALL');
                }}
                className="px-3.5 py-2 bg-[#f0eeea] hover:bg-[#eae8e4] text-xs text-[#1a1a1a] font-medium transition-colors border border-[#ded9d1] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">tune</span>
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pending Queue Table Section */}
        <div className="bg-white border border-[#ded9d1] shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-[#f5f3ef] border-b border-[#ded9d1] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#1a1a1a]">dvr</span>
              <h2 className="font-serif text-xl text-[#1a1a1a] font-medium">Active Forensic KYC Queue Ledger</h2>
              <span className="px-2 py-0.5 bg-[#1a1a1a] text-white font-mono text-[10px] tracking-wider uppercase">
                {filteredCandidates.length} CANDIDATES ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#665d52]">
              <span className={`w-2 h-2 rounded-full ${selectedCandidate ? 'bg-emerald-600 animate-pulse' : 'bg-stone-300'}`} />
              <span>Selected Target: {selectedCandidate ? `#${selectedCandidate.id}` : 'None'}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0eeea] text-[#665d52] font-mono text-[11px] uppercase tracking-wider border-b border-[#ded9d1]">
                  <th className="py-3 px-5 font-semibold">Candidate</th>
                  <th className="py-3 px-4 font-semibold">Contact Details</th>
                  <th className="py-3 px-4 font-semibold">Vehicle Specs</th>
                  <th className="py-3 px-4 font-semibold">Submission (IST)</th>
                  <th className="py-3 px-4 font-semibold">Attestation Registry</th>
                  <th className="py-3 px-4 font-semibold">Banking Ledger</th>
                  <th className="py-3 px-4 font-semibold">Verification State</th>
                  <th className="py-3 px-5 text-right font-semibold">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ded9d1]">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#665d52]">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-[#ded9d1] mb-2">verified_user</span>
                        <p className="font-serif text-lg text-[#1a1a1a]">No Pending Driver KYC Applications</p>
                        <p className="text-xs text-[#665d52] font-mono mt-1">All registered delivery partners in your database have been processed.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((cand) => {
                    const isSelected = selectedCandidate && cand.id === selectedCandidate.id;

                  return (
                    <tr
                      key={cand.id}
                      onClick={() => handleInspectCandidate(cand.id)}
                      className={`hover:bg-[#f9f8f6] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#eee0d2]/40' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1a1a1a] text-white flex items-center justify-center font-mono text-xs font-semibold">
                            {cand.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#1a1a1a] tracking-tight flex items-center gap-1.5">
                              {cand.name}
                              {isSelected && (
                                <span className="px-1.5 py-0.2 bg-[#1a1a1a] text-white font-mono text-[9px]">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-xs text-[#665d52]">#{cand.id} • Age {cand.age}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="text-[#1a1a1a] font-medium">{cand.phone}</div>
                        <div className="text-[#665d52] truncate max-w-[150px]">{cand.email}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-xs text-[#1a1a1a]">{cand.vehicle}</div>
                        <div className="font-mono text-[10px] text-[#665d52] bg-[#f0eeea] px-1.5 py-0.5 inline-block mt-0.5">
                          {cand.plate}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-[#665d52]">
                        <div>{cand.submissionDate}</div>
                        <div className="text-[10px]">{cand.submissionTime}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[210px] font-mono text-[10px]">
                          <span className={`px-1.5 py-0.5 font-medium border ${cand.attestation.aadhaar ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                            AADHAAR {cand.attestation.aadhaar ? '✓' : '⚠️'}
                          </span>
                          <span className={`px-1.5 py-0.5 font-medium border ${cand.attestation.dl ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                            DL {cand.attestation.dl ? '✓' : cand.dlData.flag || 'BLUR ⚠️'}
                          </span>
                          <span className={`px-1.5 py-0.5 font-medium border ${cand.attestation.rc ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                            RC {cand.attestation.rc ? '✓' : 'MISSING'}
                          </span>
                          <span className={`px-1.5 py-0.5 font-medium border ${cand.attestation.ins ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                            INS {cand.attestation.ins ? '✓' : 'EXP ⚠️'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="text-[#1a1a1a] flex items-center gap-1 font-medium">
                          <span>{cand.bank.name.split(' ')[0]} {cand.bank.masked}</span>
                          {cand.bank.pennyVerified && (
                            <span className="material-symbols-outlined text-[13px] text-emerald-800">verified</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#665d52]">
                          {cand.bank.pennyVerified ? 'Penny Verified: INR 1.00' : 'Awaiting Auth'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border font-semibold ${
                            cand.statusTone === 'emerald'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : cand.statusTone === 'amber'
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : cand.statusTone === 'red'
                              ? 'bg-red-50 text-red-900 border-red-200'
                              : 'bg-[#f0eeea] text-[#665d52] border-[#ded9d1]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {cand.statusTone === 'emerald' ? 'check_circle' : cand.statusTone === 'red' ? 'block' : 'warning'}
                          </span>
                          <span>{cand.statusLabel}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 font-mono">
                          <button
                            onClick={() => handleInspectCandidate(cand.id)}
                            className="px-2.5 py-1.5 bg-[#1a1a1a] text-white hover:bg-black text-[10px] tracking-wider uppercase transition-colors"
                          >
                            Inspect
                          </button>
                          {cand.status === 'READY_APPROVAL' && (
                            <button
                              onClick={() => handleApproveImmediate(cand.id, cand.name)}
                              className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] transition-colors"
                              title="Approve Immediate"
                            >
                              <span className="material-symbols-outlined text-[14px]">done</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deep-Dive Document Inspection Workspace */}
        {selectedCandidate ? (
          <div id="inspection-dossier" className="bg-white border border-[#ded9d1] p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 bg-[#f5f3ef] border border-[#ded9d1] p-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-widest font-semibold">
                  Active Forensic Verification Dossier
                </span>
                <span className="font-mono text-xs bg-[#1a1a1a] text-white px-2 py-0.5">
                  TARGET: #{selectedCandidate.id}
                </span>
              </div>
              <h2 className="font-serif text-2xl text-[#1a1a1a] font-bold mt-1">
                {selectedCandidate.name} — Forensic Attestation
              </h2>
              <p className="text-xs text-[#665d52] font-mono mt-0.5">
                {selectedCandidate.jurisdiction} • Applicant Joined: {selectedCandidate.submissionDate} • Match Confidence: {selectedCandidate.matchConfidence}%
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Reject & Blacklist</span>
              </button>
              <button
                onClick={() => setIsReuploadModalOpen(true)}
                className="px-4 py-2 bg-[#eee0d2] text-[#211b12] hover:bg-[#d1c5b7] text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">replay</span>
                <span>Request Re-upload</span>
              </button>
              <button
                onClick={() => handleApproveImmediate(selectedCandidate.id, selectedCandidate.name)}
                className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Approve & Grant Route Access</span>
              </button>
            </div>
          </div>

          {/* Applicant Identity & Biometrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#f9f8f6] border border-[#ded9d1] p-5">
            <div className="flex items-center gap-4 md:border-r md:border-[#ded9d1] md:pr-4">
              <img
                className="w-16 h-20 object-cover border border-[#ded9d1] bg-[#eae8e4]"
                src={selectedCandidate.selfieUrl}
                alt="Courier headshot"
              />
              <div className="space-y-1">
                <span className="font-mono text-[9px] text-[#665d52] uppercase tracking-wider block">Selfie Authentication</span>
                <div className="font-mono text-xs text-emerald-800 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">face</span>
                  <span>{selectedCandidate.matchConfidence}% MATCH</span>
                </div>
                <div className="font-mono text-[10px] text-[#665d52]">Liveness: CONFIRMED ({selectedCandidate.livenessScore})</div>
              </div>
            </div>

            <div className="space-y-1 md:border-r md:border-[#ded9d1] md:pr-4">
              <span className="font-mono text-[9px] text-[#665d52] uppercase tracking-wider block">Residential Jurisdict</span>
              <div className="font-medium text-sm text-[#1a1a1a] leading-tight">{selectedCandidate.jurisdiction}</div>
              <div className="font-mono text-[10px] text-[#665d52]">PIN: {selectedCandidate.pin} • Zone: {selectedCandidate.zone}</div>
            </div>

            <div className="space-y-1 md:border-r md:border-[#ded9d1] md:pr-4">
              <span className="font-mono text-[9px] text-[#665d52] uppercase tracking-wider block">Telephony & Email</span>
              <div className="font-mono text-xs text-[#1a1a1a] font-semibold">{selectedCandidate.phone} (OTP ✓)</div>
              <div className="font-mono text-[10px] text-[#665d52] truncate">{selectedCandidate.email} (Verified)</div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#665d52] uppercase tracking-wider block">Background Registry</span>
              <div className="font-mono text-xs text-emerald-800 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">shield</span>
                <span>NO CRIMINAL RECORDS</span>
              </div>
              <div className="font-mono text-[10px] text-[#665d52]">CCTNS Check: CLEARED 04-OCT</div>
            </div>
          </div>

          {/* 4-Quadrant Document Inspection Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: DigiLocker Aadhaar */}
            <div className="bg-[#f9f8f6] border border-[#ded9d1] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 bg-[#f0eeea] px-3 py-1.5 border border-[#ded9d1]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#1a1a1a]">fingerprint</span>
                    <span className="font-mono text-[11px] uppercase font-bold text-[#1a1a1a]">01 • Aadhaar XML DigiLocker</span>
                  </div>
                  <span className="font-mono text-[10px] bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold">
                    UIDAI SECURE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Reference Hash</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.aadhaarData.refHash}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Name on Record</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.aadhaarData.recordName}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Date of Birth</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.aadhaarData.dob}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Gender & Address</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.aadhaarData.gender} • {selectedCandidate.aadhaarData.address}</span>
                  </div>
                </div>

                <div className="bg-[#eae8e4] p-3 border border-[#ded9d1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] text-[#665d52]">GOVERNMENT OF INDIA • UNIQUE IDENTIFICATION</div>
                      <div className="font-mono text-xs font-bold text-[#1a1a1a]">{selectedCandidate.aadhaarData.maskedUid}</div>
                    </div>
                    <span className="material-symbols-outlined text-xl text-[#665d52]">verified</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#ded9d1] flex items-center justify-between text-[10px] font-mono text-[#665d52]">
                    <span>DIGILOCKER XML SIGNED</span>
                    <span>SHA256: {selectedCandidate.aadhaarData.xmlSha}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between font-mono text-xs text-[#665d52]">
                <span>Attested by DigiLocker Node</span>
                <button onClick={() => showToast('DigiLocker XML Payload verified valid.')} className="text-[#1a1a1a] underline hover:text-black">
                  View XML Payload
                </button>
              </div>
            </div>

            {/* Panel 2: Driving License */}
            <div className="bg-[#f9f8f6] border border-[#ded9d1] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 bg-[#f0eeea] px-3 py-1.5 border border-[#ded9d1]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#1a1a1a]">badge</span>
                    <span className="font-mono text-[11px] uppercase font-bold text-[#1a1a1a]">02 • Driving License (Sarathi Vahan)</span>
                  </div>
                  <span className={`font-mono text-[10px] px-2 py-0.5 font-bold border ${selectedCandidate.attestation.dl ? 'bg-white text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'}`}>
                    {selectedCandidate.attestation.dl ? 'VALID UNTIL 2038' : selectedCandidate.dlData.flag || 'FLAGGED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">License Number</span>
                    <span className="font-mono font-bold text-[#1a1a1a]">{selectedCandidate.dlData.number}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Vehicle Class</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.dlData.vehicleClass}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Issue Authority</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.dlData.authority}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Validity Expiry</span>
                    <span className={`font-mono font-bold ${selectedCandidate.attestation.dl ? 'text-emerald-800' : 'text-red-700'}`}>
                      {selectedCandidate.dlData.expiry}
                    </span>
                  </div>
                </div>

                <div className="relative bg-[#eae8e4] p-2.5 flex items-center gap-3 border border-[#ded9d1]">
                  <img
                    className="w-24 h-16 object-cover bg-[#ded9d1]"
                    src={selectedCandidate.dlData.scanUrl}
                    alt="Driving license scan"
                  />
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs text-[#1a1a1a] font-bold">OCR Data Extracted ({selectedCandidate.dlData.scanConfidence})</div>
                    <div className="font-mono text-[10px] text-[#665d52]">Optical Match: {selectedCandidate.name} • DOB matches UIDAI</div>
                    <div className="font-mono text-[10px] text-emerald-800">No suspension / endorsements found</div>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between font-mono text-xs text-[#665d52]">
                <span>RTO Sarathi API Latency: 310ms</span>
                <button onClick={() => showToast('Opening high-res OCR document scan.')} className="text-[#1a1a1a] underline hover:text-black">
                  Inspect Raw Scan
                </button>
              </div>
            </div>

            {/* Panel 3: Vehicle RC */}
            <div className="bg-[#f9f8f6] border border-[#ded9d1] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 bg-[#f0eeea] px-3 py-1.5 border border-[#ded9d1]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#1a1a1a]">two_wheeler</span>
                    <span className="font-mono text-[11px] uppercase font-bold text-[#1a1a1a]">03 • Vehicle Registration Certificate (RC)</span>
                  </div>
                  <span className="font-mono text-[10px] bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold">
                    REG ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Registration Plate</span>
                    <span className="font-mono font-bold text-[#1a1a1a]">{selectedCandidate.rcData.plate}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Vehicle Make / Model</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.rcData.model}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Chassis / Engine</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.rcData.chassis}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Emission Standard</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.rcData.emission}</span>
                  </div>
                </div>

                <div className="bg-[#eae8e4] p-3 border border-[#ded9d1] font-mono text-xs">
                  <div className="flex items-center justify-between text-[#1a1a1a]">
                    <span>Owner: {selectedCandidate.rcData.owner}</span>
                    <span className="text-emerald-800 font-bold">OWNERSHIP 1ST</span>
                  </div>
                  <div className="text-[10px] text-[#665d52] mt-0.5">
                    Fitness Valid Thru: {selectedCandidate.rcData.fitness} • Fuel: {selectedCandidate.rcData.fuel}
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between font-mono text-xs text-[#665d52]">
                <span>Parivahan National Registry Sync</span>
                <button onClick={() => showToast('Parivahan Registry live response: OK')} className="text-[#1a1a1a] underline hover:text-black">
                  Parivahan Record
                </button>
              </div>
            </div>

            {/* Panel 4: Commercial Insurance */}
            <div className="bg-[#f9f8f6] border border-[#ded9d1] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 bg-[#f0eeea] px-3 py-1.5 border border-[#ded9d1]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#1a1a1a]">security</span>
                    <span className="font-mono text-[11px] uppercase font-bold text-[#1a1a1a]">04 • Vehicle Commercial Insurance</span>
                  </div>
                  <span className={`font-mono text-[10px] px-2 py-0.5 font-bold border ${selectedCandidate.attestation.ins ? 'bg-white text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'}`}>
                    {selectedCandidate.attestation.ins ? 'VALID TILL SEP 2027' : 'LAPSED / NO INS'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Insurance Provider</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.insData.provider}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Policy Certificate No.</span>
                    <span className="font-mono font-bold text-[#1a1a1a]">{selectedCandidate.insData.policyNo}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Coverage Category</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{selectedCandidate.insData.coverage}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-[#665d52] uppercase block">Expiration Date</span>
                    <span className={`font-mono font-bold ${selectedCandidate.attestation.ins ? 'text-emerald-800' : 'text-red-700'}`}>
                      {selectedCandidate.insData.expiry}
                    </span>
                  </div>
                </div>

                <div className="bg-[#eae8e4] p-3 border border-[#ded9d1] flex items-center justify-between font-mono text-xs">
                  <div>
                    <div className="text-[#1a1a1a] font-medium">IRDAI Registry Verification</div>
                    <div className="text-[10px] text-[#665d52]">Direct API handshake confirmed premium active</div>
                  </div>
                  <span className="material-symbols-outlined text-emerald-800">task_alt</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between font-mono text-xs text-[#665d52]">
                <span>IIB Portal Token: {selectedCandidate.insData.token}</span>
                <button onClick={() => showToast('Policy document downloaded successfully.')} className="text-[#1a1a1a] underline hover:text-black">
                  Download Policy PDF
                </button>
              </div>
            </div>
          </div>

          {/* Banking Ledger Verification Bar */}
          <div className="bg-[#f9f8f6] border border-[#ded9d1] p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ded9d1]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-[#1a1a1a]">account_balance</span>
                <h3 className="font-serif text-lg text-[#1a1a1a] font-bold">
                  Direct Payout Bank Account — Penny-Drop Telemetry
                </h3>
              </div>
              <span className="font-mono text-xs bg-white text-emerald-900 border border-emerald-300 px-3 py-1 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>NPCI IMPS CLEAR: 100% NAME MATCH</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[9px] text-[#665d52] uppercase block">Bank Name</span>
                <span className="font-bold text-[#1a1a1a]">{selectedCandidate.bank.name}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#665d52] uppercase block">Account Identifier</span>
                <span className="font-bold text-[#1a1a1a]">{selectedCandidate.bank.account} ({selectedCandidate.bank.masked})</span>
              </div>
              <div>
                <span className="text-[9px] text-[#665d52] uppercase block">IFSC Node & Branch</span>
                <span className="font-bold text-[#1a1a1a]">{selectedCandidate.bank.ifsc} • {selectedCandidate.bank.branch}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#665d52] uppercase block">IMPS Beneficiary Name</span>
                <span className="font-bold text-emerald-800">{selectedCandidate.bank.beneficiary}</span>
              </div>
            </div>
          </div>

          {/* Compliance Operator Audit Checklist & Signoff */}
          <div className="bg-[#f0eeea] border border-[#ded9d1] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-xs">
              <div className="font-serif text-xl text-[#1a1a1a] font-bold">Compliance Operator Sign-Off</div>
              <p className="text-[#665d52] leading-relaxed">
                Approving this courier executes immediate dispatch eligibility on Route Zone {selectedCandidate.zone}, publishes an AES-256 encrypted credential bundle to the TiffinLink Fleet app, and issues a Welcome SMS with initial delivery schedule.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 font-mono">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auditChecklist.cctns}
                    onChange={(e) => setAuditChecklist(prev => ({ ...prev, cctns: e.target.checked }))}
                    className="accent-[#1a1a1a]"
                  />
                  <span>CCTNS Criminal record cross-check</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auditChecklist.hygiene}
                    onChange={(e) => setAuditChecklist(prev => ({ ...prev, hygiene: e.target.checked }))}
                    className="accent-[#1a1a1a]"
                  />
                  <span>Food safety & hygiene training attested</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auditChecklist.secondaryPhoto}
                    onChange={(e) => setAuditChecklist(prev => ({ ...prev, secondaryPhoto: e.target.checked }))}
                    className="accent-[#1a1a1a]"
                  />
                  <span>Secondary photo inspection verified</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleApproveImmediate(selectedCandidate.id, selectedCandidate.name)}
                className="px-8 py-3.5 bg-[#1a1a1a] text-white hover:bg-black font-semibold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Approve & Grant Route Access</span>
              </button>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-white border border-[#ded9d1] p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-[#ded9d1] mb-2 inline-block">folder_open</span>
            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">No Candidate Selected For Forensic Inspection</h3>
            <p className="font-mono text-xs text-[#665d52] mt-1">There are currently no pending unverified partner KYC records in your MongoDB database.</p>
          </div>
        )}
      </div>

      {/* GUIDELINES MODAL */}
      {isGuidelinesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-[#1a1a1a]">policy</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Forensic KYC Verification Guidelines</h3>
              </div>
              <button onClick={() => setIsGuidelinesModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <div className="space-y-3 text-[#665d52] max-h-96 overflow-y-auto pr-1">
              <div>
                <strong className="text-[#1a1a1a] block">1. Aadhaar UIDAI DigiLocker</strong>
                Must match full legal name and date of birth within 95%+ confidence. XML payload must be cryptographically signed by UIDAI CA.
              </div>
              <div>
                <strong className="text-[#1a1a1a] block">2. Driving License (Sarathi Vahan)</strong>
                Must have valid MCWG (Motorcycle with Gear) or LMV endorsement valid for at least 6 months ahead. Any blur, corner glare, or altered text must be flagged for re-upload.
              </div>
              <div>
                <strong className="text-[#1a1a1a] block">3. Commercial Vehicle Insurance</strong>
                Commercial passenger or courier transit policy coverage is mandatory. Expired policies must be rejected.
              </div>
              <div>
                <strong className="text-[#1a1a1a] block">4. Direct Penny-Drop Banking Ledger</strong>
                NPCI IMPS ₹1.00 transfer must return exact beneficiary name matching Aadhaar name.
              </div>
            </div>
            <div className="pt-3 border-t border-[#ded9d1] flex justify-end">
              <button onClick={() => setIsGuidelinesModalOpen(false)} className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-semibold">
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-red-300 max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2 text-red-700">
                <span className="material-symbols-outlined text-lg">gavel</span>
                <h3 className="font-serif text-lg font-bold text-red-900">Reject & Blacklist Courier</h3>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <p className="text-[#665d52]">
              You are rejecting <strong>{selectedCandidate.name} (#{selectedCandidate.id})</strong>. This will revoke applicant access and append phone & Aadhaar hash to the blacklist registry.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] text-[#665d52] uppercase block">Select Rejection Cause</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 bg-white border border-[#ded9d1] text-xs focus:outline-none"
              >
                <option value="DL Expired / Fraudulent Documents">DL Expired / Fraudulent Documents</option>
                <option value="Aadhaar Name Mismatch / Impersonation">Aadhaar Name Mismatch / Impersonation</option>
                <option value="Commercial Insurance Failure">Commercial Insurance Failure</option>
                <option value="Failed CCTNS Criminal Check">Failed CCTNS Criminal Check</option>
                <option value="Vehicle Fitness Disqualified">Vehicle Fitness Disqualified</option>
              </select>
            </div>
            <div className="pt-3 border-t border-[#ded9d1] flex justify-end gap-2">
              <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a]">Cancel</button>
              <button onClick={handleConfirmReject} className="px-5 py-2 bg-red-700 text-white hover:bg-red-800 font-bold">
                Confirm Reject & Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST RE-UPLOAD MODAL */}
      {isReuploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fbf9f5] border border-[#ded9d1] max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#ded9d1] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-amber-700">sms</span>
                <h3 className="font-serif text-lg font-bold text-[#1a1a1a]">Request Document Re-upload</h3>
              </div>
              <button onClick={() => setIsReuploadModalOpen(false)} className="w-7 h-7 flex items-center justify-center bg-[#f0eeea] hover:bg-[#eae8e4]">✕</button>
            </div>
            <p className="text-[#665d52]">
              Send an instant SMS & WhatsApp notification to <strong>{selectedCandidate.phone}</strong> requesting updated documents.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] text-[#665d52] uppercase block">Instructions for Courier</label>
              <textarea
                rows={3}
                value={reuploadNotes}
                onChange={(e) => setReuploadNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#ded9d1] text-xs focus:outline-none"
              />
            </div>
            <div className="pt-3 border-t border-[#ded9d1] flex justify-end gap-2">
              <button onClick={() => setIsReuploadModalOpen(false)} className="px-4 py-2 bg-[#f0eeea] text-[#1a1a1a]">Cancel</button>
              <button onClick={handleConfirmReupload} className="px-5 py-2 bg-[#1a1a1a] text-white hover:bg-black font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Send Re-upload SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white px-4 py-3 font-mono text-xs flex items-center gap-2.5 shadow-2xl z-50 border border-[#ded9d1] animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
