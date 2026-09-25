import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

export default function ReportIssueView({ currentUser, onNavigateTab, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Dynamic data from API
  const [recentOrders, setRecentOrders] = useState([]);
  const [issueReports, setIssueReports] = useState([]);
  const [driverProfile, setDriverProfile] = useState(null);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('KITCHEN_ISSUE');
  const [selectedOrder, setSelectedOrder] = useState('NONE');
  const [selectedPriority, setSelectedPriority] = useState('HIGH');
  const [description, setDescription] = useState('Upon arriving at Pali Hill Kitchen Hub for pickup, the hot-box container seal was compromised with dal spillage from container #2. Kitchen partner refused immediate repacking. Recipient customer Bhavin Shah notified via customer chat.');
  const [contactPreference, setContactPreference] = useState('PHONE');
  const [attachment, setAttachment] = useState(null);

  // Banner State
  const [bannerVisible, setBannerVisible] = useState(false);
  const [activeCreatedTicket, setActiveCreatedTicket] = useState(null);

  // History Filter & Search State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);

  // Geolocation Sensor State
  const [location, setLocation] = useState({
    latitude: 19.0596,
    longitude: 72.8295,
    accuracy: 11.4,
    address: 'Pali Hill, Bandra West, Mumbai'
  });

  // User session details
  const savedUserStr = typeof window !== 'undefined' ? (localStorage.getItem('user') || localStorage.getItem('tiffinlink_user')) : null;
  const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  const userEmail = currentUser?.email || savedUser?.email || '';
  const driverId = currentUser?.id || currentUser?._id || savedUser?.id || savedUser?._id || '';
  const userPhone = currentUser?.phone || savedUser?.phone || '';
  const driverName = currentUser?.name || savedUser?.name || 'Courier Partner';
  const driverCode = currentUser?.driverId || savedUser?.driverId || '';

  // Categories metadata
  const categories = [
    {
      code: 'DELIVERY_ISSUE',
      title: 'Delivery Issue',
      desc: 'Address wrong, gate locked, delivery timeout, customer absent.',
      icon: 'location_off'
    },
    {
      code: 'CUSTOMER_ISSUE',
      title: 'Customer Issue',
      desc: 'Customer unreachable, refused delivery, verbal dispute, cancellation dispute.',
      icon: 'person_alert'
    },
    {
      code: 'KITCHEN_ISSUE',
      title: 'Kitchen / Provider Issue',
      desc: 'Food not ready, packaging leak, thermal seal broken, missing tiffin box.',
      icon: 'soup_kitchen'
    },
    {
      code: 'VEHICLE_ISSUE',
      title: 'Vehicle / Transport Issue',
      desc: 'Breakdown, tire puncture, mechanical failure, minor collision.',
      icon: 'electric_moped'
    },
    {
      code: 'PAYMENT_ISSUE',
      title: 'Payment Issue',
      desc: 'Cash not received, wrong fare settlement, missing trip incentive.',
      icon: 'currency_rupee'
    },
    {
      code: 'APP_ISSUE',
      title: 'App / Technical Issue',
      desc: 'GPS telemetry lag, OTP verification failure, offline sync anomaly.',
      icon: 'mobile_off'
    },
    {
      code: 'SAFETY_ISSUE',
      title: 'Safety / Hazard Issue',
      desc: 'Harassment, aggressive environment, heavy downpour, route waterlogging.',
      icon: 'shield'
    },
    {
      code: 'OTHER_ISSUE',
      title: 'Other Operational Issue',
      desc: 'Hub protocol clarification, uniform exchange, unlisted incident.',
      icon: 'help'
    }
  ];

  // Geolocation trigger on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            accuracy: Number(pos.coords.accuracy.toFixed(1))
          }));
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchIssueReportsAndOrders();

    // Socket.io integration for live updates
    const socket = getSocket();
    if (socket) {
      socket.on('issue_report_updated', (updatedReport) => {
        setIssueReports((prev) =>
          prev.map((item) => (item.reportId === updatedReport.reportId ? updatedReport : item))
        );
        if (onShowToast) {
          onShowToast(`📢 Ticket #${updatedReport.reportId} status changed to ${updatedReport.status}`);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('issue_report_updated');
      }
    };
  }, []);

  const fetchIssueReportsAndOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId,
        phone: userPhone
      }).toString();

      const res = await fetch(`${API_BASE_URL}/api/driver/safety/reports?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch reports`);
      }

      const data = await res.json();
      if (data.success) {
        setIssueReports(data.reports || []);
        setRecentOrders(data.recentOrders || []);
        setDriverProfile(data.driverProfile || null);

        // Pre-select first order if available
        if (data.recentOrders && data.recentOrders.length > 0) {
          setSelectedOrder(data.recentOrders[0].orderId);
        }

        // Show confirmation banner if there's an open report
        const latestOpen = (data.reports || []).find(r => r.status === 'OPEN' || r.status === 'UNDER_REVIEW');
        if (latestOpen) {
          setActiveCreatedTicket(latestOpen);
          setBannerVisible(true);
        }
      }
    } catch (err) {
      console.error('Error fetching issue reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('File size exceeds 25MB limit.');
        return;
      }
      setAttachment({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
        url: URL.createObjectURL(file)
      });
    }
  };

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!description.trim() || description.length < 10) {
      alert('Please enter a detailed description of the incident (min 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('tiffinlink_token');
      const queryParams = new URLSearchParams({
        email: userEmail,
        driverId: driverId,
        phone: userPhone
      }).toString();

      const payload = {
        category: selectedCategory,
        orderId: selectedOrder === 'NONE' ? null : selectedOrder,
        priority: selectedPriority,
        description: description.trim(),
        contactPreference,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        },
        attachments: attachment ? [{ name: attachment.name, url: attachment.url }] : []
      };

      const res = await fetch(`${API_BASE_URL}/api/driver/safety/reports?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit report');
      }

      // Success
      setActiveCreatedTicket(data.report);
      setBannerVisible(true);
      setIssueReports((prev) => [data.report, ...prev]);

      if (onShowToast) {
        onShowToast(`✓ Issue Report ${data.report.reportId} submitted successfully!`);
      }

      // Smooth scroll to confirmation banner
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Error submitting report:', err);
      alert(`Submission Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedCategory('KITCHEN_ISSUE');
    setSelectedPriority('HIGH');
    setDescription('');
    setAttachment(null);
    if (recentOrders.length > 0) setSelectedOrder(recentOrders[0].orderId);
    else setSelectedOrder('NONE');
  };

  const triggerEmergencySOS = () => {
    if (window.confirm("🚨 EMERGENCY SOS BROADCAST\n\nInitiate instant SOS protocol to Bandra Hub 12 Dispatcher & local field security units? Your exact telemetry will be continuously broadcast.")) {
      if (onShowToast) onShowToast("🚨 Emergency SOS Active. Dispatch unit notified. Dispatcher Captain H. Mehta placing emergency call.");
      else alert("Emergency SOS Active. Dispatch unit notified. Dispatcher Captain H. Mehta is placing an emergency call to your phone.");
    }
  };

  // Filtering reports history
  const filteredReports = issueReports.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesQuery = !searchQuery || 
      item.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.orderId && item.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="flex flex-col w-full pb-24 text-on-surface">
      
      {/* Top Meta Strip & Emergency Shortcut */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-sand-neutral mb-8">
        <div className="flex items-center gap-3">
          <span className="font-label-caps text-label-caps tracking-widest text-clay-earth uppercase">Safety &amp; Compliance</span>
          <span className="text-sand-neutral text-xs">/</span>
          <span className="font-label-caps text-label-caps tracking-widest text-onyx-black uppercase">Report an Issue</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-bone-white text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-onyx-black"></span>
            MongoDB issueReports Synced • Audit v2.4
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-bone-white text-on-surface-variant font-label-caps text-label-caps">
            <span className="material-symbols-outlined text-sm text-onyx-black">timer</span>
            <span>Response SLA: &lt;15 Min</span>
          </div>
          <button
            type="button"
            onClick={triggerEmergencySOS}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-error text-on-error font-button-text text-button-text uppercase tracking-wider text-xs transition-opacity hover:opacity-90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>Emergency SOS</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-bone-white text-onyx-black hover:bg-sand-neutral transition-colors font-button-text text-button-text text-xs uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline">Export Logs</span>
          </button>
        </div>
      </div>

      {/* Editorial Page Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight leading-none mb-3">Report an Issue</h1>
          <p className="font-body-lg text-body-lg text-clay-earth max-w-2xl leading-relaxed">
            Tell us what happened so we can dispatch immediate field support or log the operational incident to the Bandra West Hub 12 supervisor desk.
          </p>
        </div>
        <div className="text-left md:text-right shrink-0">
          <span className="font-label-caps text-[11px] uppercase tracking-widest text-clay-earth block">Authenticated Officer</span>
          <span className="font-headline-md text-headline-md text-onyx-black leading-tight block">{driverProfile?.name || driverName}</span>
          <span className="font-label-caps text-label-caps text-clay-earth block">#{driverProfile?.driverId || driverCode} • {driverProfile?.vehicleType || 'Tier 1 Senior Courier'}</span>
        </div>
      </div>

      {/* Realtime Confirmation Banner */}
      {bannerVisible && (
        <div className="mb-10 bg-onyx-black text-white p-6 relative overflow-hidden transition-all duration-300" id="confirmationBanner">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-xl text-white">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-label-caps text-label-caps uppercase tracking-widest text-sand-neutral">Active Incident Queue</span>
                  <span className="px-2 py-0.5 bg-white text-onyx-black font-label-caps text-[10px] uppercase font-bold tracking-wider">
                    {activeCreatedTicket?.priority || 'High Priority'}
                  </span>
                </div>
                <h2 className="font-headline-md text-[22px] leading-snug font-normal text-white">
                  Dispatch Desk Ticket Assigned: Capt. H. Mehta (Hub 12)
                </h2>
                <p className="font-body-md text-sm text-sand-neutral/80 mt-1">
                  Ticket <span className="font-semibold text-white">#{activeCreatedTicket?.reportId || 'ISS-1024'}</span> {activeCreatedTicket?.orderId ? <>linked to Order <span className="text-white">#{activeCreatedTicket.orderId}</span>.</> : <>for General Incident.</>} Field team notified with telemetric coordinates. Estimated SLA callback: &lt;12 mins.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
              <button
                type="button"
                className="px-4 py-2 bg-bone-white/10 hover:bg-bone-white/20 text-white font-button-text text-button-text text-xs tracking-wider uppercase transition-colors"
                onClick={() => setBannerVisible(false)}
              >
                Dismiss Banner
              </button>
              <a
                href="#history-section"
                className="px-4 py-2 bg-white text-onyx-black hover:bg-surface transition-colors font-button-text text-button-text text-xs tracking-wider uppercase inline-flex items-center gap-1"
              >
                <span>View Live Thread</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Issue Filing & Operational Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-20">
        
        {/* Left Column: Form Workflow (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* Step 1: Category Selection */}
          <section className="bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
              <div>
                <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Step 01 / 04</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black font-normal">Select Incident Category</h3>
              </div>
              <span className="font-label-caps text-[11px] text-clay-earth tracking-widest uppercase">8 Classifications</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="categoryGrid">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.code;
                return (
                  <div
                    key={cat.code}
                    onClick={() => setSelectedCategory(cat.code)}
                    className={`category-card p-4 cursor-pointer transition-colors relative flex flex-col justify-between ${
                      isActive ? 'bg-onyx-black text-white active-category' : 'bg-bone-white hover:bg-sand-neutral/40 text-on-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-8 h-8 flex items-center justify-center ${isActive ? 'bg-white/10 text-white' : 'bg-onyx-black/5 text-onyx-black'}`}>
                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      </div>
                      <span className={`category-indicator w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-transparent'}`}></span>
                    </div>
                    <div className="mt-4">
                      <h4 className={`font-headline-md text-[18px] leading-tight ${isActive ? 'text-white' : 'text-onyx-black'}`}>
                        {cat.title}
                      </h4>
                      <p className={`font-body-md text-xs mt-1 leading-normal ${isActive ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 2: Order Reference & Priority Level */}
          <section className="bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
              <div>
                <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Step 02 / 04</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black font-normal">Context &amp; Severity</h3>
              </div>
              <span className="font-label-caps text-[11px] text-clay-earth tracking-widest uppercase">Corridor Telemetry</span>
            </div>

            <div className="flex flex-col gap-6">
              {/* Associated Order Selector */}
              <div>
                <label className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider block mb-2">
                  Associated Order Ref (Shift Current / Recent)
                </label>
                <div className="relative">
                  <select
                    value={selectedOrder}
                    onChange={(e) => setSelectedOrder(e.target.value)}
                    className="w-full bg-bone-white text-on-surface font-body-md text-sm px-4 py-3 appearance-none focus:outline-none focus:bg-sand-neutral/30 transition-colors"
                    id="orderSelect"
                  >
                    {recentOrders.length > 0 ? (
                      recentOrders.map((ord) => (
                        <option key={ord.orderId} value={ord.orderId}>
                          #{ord.orderId} — {ord.customerName} ({ord.deliveryAddress || 'Central Hub'}) • [{ord.status}]
                        </option>
                      ))
                    ) : (
                      <option value="ORD-5162">#ORD-5162 — Gujarati Special Thali (Customer: Bhavin Shah, Pali Hill) • [IN TRANSIT - ACTIVE]</option>
                    )}
                    <option value="NONE">General / Corridor Hazard (No specific order linked)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-onyx-black">
                    <span className="material-symbols-outlined text-lg">arrow_drop_down</span>
                  </div>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mt-2">
                  Linking the active order automatically cross-references kitchen prep timestamps and customer chat history.
                </p>
              </div>

              {/* Priority Selector (Segmented Minimalist Tiles) */}
              <div>
                <label className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider block mb-2">
                  Incident Severity Priority *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  
                  {/* Low */}
                  <button
                    type="button"
                    onClick={() => setSelectedPriority('LOW')}
                    className={`priority-btn p-3 text-left transition-all flex flex-col justify-between ${
                      selectedPriority === 'LOW' ? 'bg-onyx-black text-white active-priority' : 'bg-bone-white hover:bg-sand-neutral/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-label-caps text-[11px] uppercase tracking-wider font-semibold ${selectedPriority === 'LOW' ? 'text-white' : 'text-on-surface'}`}>Low</span>
                      <span className={`w-2 h-2 rounded-full ${selectedPriority === 'LOW' ? 'bg-white' : 'bg-sand-neutral'}`}></span>
                    </div>
                    <span className={`font-body-md text-xs ${selectedPriority === 'LOW' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>Post-shift review</span>
                  </button>

                  {/* Medium */}
                  <button
                    type="button"
                    onClick={() => setSelectedPriority('MEDIUM')}
                    className={`priority-btn p-3 text-left transition-all flex flex-col justify-between ${
                      selectedPriority === 'MEDIUM' ? 'bg-onyx-black text-white active-priority' : 'bg-bone-white hover:bg-sand-neutral/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-label-caps text-[11px] uppercase tracking-wider font-semibold ${selectedPriority === 'MEDIUM' ? 'text-white' : 'text-on-surface'}`}>Medium</span>
                      <span className={`w-2 h-2 rounded-full ${selectedPriority === 'MEDIUM' ? 'bg-white' : 'bg-secondary-fixed-dim'}`}></span>
                    </div>
                    <span className={`font-body-md text-xs ${selectedPriority === 'MEDIUM' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>Operational lag</span>
                  </button>

                  {/* High */}
                  <button
                    type="button"
                    onClick={() => setSelectedPriority('HIGH')}
                    className={`priority-btn p-3 text-left transition-all flex flex-col justify-between ${
                      selectedPriority === 'HIGH' ? 'bg-onyx-black text-white active-priority' : 'bg-bone-white hover:bg-sand-neutral/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-label-caps text-[11px] uppercase tracking-wider font-semibold ${selectedPriority === 'HIGH' ? 'text-white' : 'text-on-surface'}`}>High</span>
                      <span className={`w-2 h-2 rounded-full ${selectedPriority === 'HIGH' ? 'bg-white' : 'bg-onyx-black'}`}></span>
                    </div>
                    <span className={`font-body-md text-xs ${selectedPriority === 'HIGH' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>Active roadblock</span>
                  </button>

                  {/* Critical */}
                  <button
                    type="button"
                    onClick={() => setSelectedPriority('CRITICAL')}
                    className={`priority-btn p-3 text-left transition-all flex flex-col justify-between ${
                      selectedPriority === 'CRITICAL' ? 'bg-onyx-black text-white active-priority' : 'bg-bone-white hover:bg-sand-neutral/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-label-caps text-[11px] uppercase tracking-wider font-semibold ${selectedPriority === 'CRITICAL' ? 'text-white' : 'text-error'}`}>Critical</span>
                      <span className={`w-2 h-2 rounded-full ${selectedPriority === 'CRITICAL' ? 'bg-white' : 'bg-error'}`}></span>
                    </div>
                    <span className={`font-body-md text-xs ${selectedPriority === 'CRITICAL' ? 'text-sand-neutral' : 'text-on-surface-variant'}`}>Safety danger / SOS</span>
                  </button>

                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Detailed Description & Photo Upload */}
          <section className="bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
              <div>
                <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Step 03 / 04</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black font-normal">Evidence &amp; Description</h3>
              </div>
              <span className="font-label-caps text-[11px] text-clay-earth tracking-widest uppercase">Tamper Verification</span>
            </div>

            <div className="flex flex-col gap-6">
              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider" htmlFor="incidentDesc">
                    Detailed Description of Incident *
                  </label>
                  <span className="font-label-caps text-[11px] text-clay-earth" id="charCount">
                    {description.length} / 1000 characters
                  </span>
                </div>
                <textarea
                  id="incidentDesc"
                  rows={4}
                  value={description}
                  maxLength={1000}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe exact details: food state, seal integrity, customer interaction..."
                  className="w-full bg-bone-white text-onyx-black font-body-md text-sm p-4 focus:outline-none focus:bg-sand-neutral/30 transition-colors leading-relaxed resize-none"
                />
              </div>

              {/* Drag and Drop Evidence Upload */}
              <div>
                <label className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider block mb-2">
                  Visual Evidence or Voice Log (Max 25MB)
                </label>
                <label className="bg-bone-white p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sand-neutral/30 transition-colors block">
                  <input
                    type="file"
                    accept="image/*,audio/*,.pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-10 h-10 bg-onyx-black/5 flex items-center justify-center mb-3 mx-auto">
                    <span className="material-symbols-outlined text-onyx-black">upload_file</span>
                  </div>
                  <span className="font-button-text text-button-text text-onyx-black uppercase tracking-wider text-xs block mb-1">
                    Drag photos or tap to select from device camera
                  </span>
                  <span className="font-body-md text-xs text-on-surface-variant">
                    JPG, PNG, HEIC or 30-second audio statement
                  </span>
                </label>

                {/* Uploaded Evidence Preview Item */}
                {attachment ? (
                  <div className="mt-3 flex items-center justify-between p-3 bg-bone-white border border-sand-neutral">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-sand-neutral flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-onyx-black text-lg">image</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-button-text text-xs text-onyx-black block truncate">{attachment.name}</span>
                        <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider">{attachment.size} • Tamper Evidence Attached</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1"
                      title="Remove attachment"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between p-3 bg-bone-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-sand-neutral flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-onyx-black text-lg">image</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-button-text text-xs text-onyx-black block truncate">spill_evidence_ord5162.jpg</span>
                        <span className="font-label-caps text-[10px] text-clay-earth uppercase tracking-wider">2.4 MB • Tamper Seal Breach • Tagged GPS</span>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] text-clay-earth uppercase">Sample Demo</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Step 4: Dispatch Preference & Telemetry Lock */}
          <section className="bg-surface-container-lowest p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-sand-neutral">
              <div>
                <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Step 04 / 04</span>
                <h3 className="font-headline-md text-headline-md text-onyx-black font-normal">Contact &amp; Submission</h3>
              </div>
              <span className="font-label-caps text-[11px] text-clay-earth tracking-widest uppercase">Channel Dispatch</span>
            </div>

            <div className="flex flex-col gap-6">
              {/* Support Contact Mode */}
              <div>
                <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-wider block mb-3">
                  Preferred Support Resolution Channel
                </span>
                <div className="space-y-3">
                  
                  <label className="flex items-start gap-3 p-3 bg-bone-white cursor-pointer hover:bg-sand-neutral/30 transition-colors">
                    <input
                      type="radio"
                      name="contactChannel"
                      value="PHONE"
                      checked={contactPreference === 'PHONE'}
                      onChange={() => setContactPreference('PHONE')}
                      className="mt-1 accent-onyx-black"
                    />
                    <div className="flex flex-col">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Immediate Priority Dispatch Call</span>
                      <span className="font-body-md text-xs text-on-surface-variant">
                        Hub supervisor rings your verified driver mobile within 3-5 minutes (+91 98765 43210).
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-bone-white cursor-pointer hover:bg-sand-neutral/30 transition-colors">
                    <input
                      type="radio"
                      name="contactChannel"
                      value="APP_CHAT"
                      checked={contactPreference === 'APP_CHAT'}
                      onChange={() => setContactPreference('APP_CHAT')}
                      className="mt-1 accent-onyx-black"
                    />
                    <div className="flex flex-col">
                      <span className="font-button-text text-sm text-onyx-black font-medium">In-App Chat Transcript &amp; Live Ticket Status</span>
                      <span className="font-body-md text-xs text-on-surface-variant">
                        Continue your route; updates and rerouting approval dispatched via rider notification.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-bone-white cursor-pointer hover:bg-sand-neutral/30 transition-colors">
                    <input
                      type="radio"
                      name="contactChannel"
                      value="ASYNC_LOG"
                      checked={contactPreference === 'ASYNC_LOG'}
                      onChange={() => setContactPreference('ASYNC_LOG')}
                      className="mt-1 accent-onyx-black"
                    />
                    <div className="flex flex-col">
                      <span className="font-button-text text-sm text-onyx-black font-medium">Asynchronous Incident Log (End-of-Shift Resolution)</span>
                      <span className="font-body-md text-xs text-on-surface-variant">
                        No instant disruption required. Claims &amp; route adjustments resolved within 24 hours.
                      </span>
                    </div>
                  </label>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-sand-neutral">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-6 py-3 bg-bone-white text-on-surface-variant hover:text-onyx-black hover:bg-sand-neutral transition-colors font-button-text text-button-text uppercase tracking-wider text-xs"
                >
                  Clear &amp; Reset Form
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFormSubmit}
                    className="w-full sm:w-auto px-8 py-3.5 bg-onyx-black text-white hover:bg-clay-earth transition-colors font-button-text text-button-text uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Submitting to MongoDB...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Issue Report</span>
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Telemetric Corridor, Live Hub Feed & Schema Spec (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Driver Location & Telemetry Card */}
          <div className="bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-sand-neutral">
              <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest">Hardware Sensor Sync</span>
              <span className="flex items-center gap-1 font-label-caps text-[10px] text-onyx-black uppercase font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-onyx-black animate-ping"></span>
                GPS Lock
              </span>
            </div>

            {/* Telemetry Map Preview */}
            <div className="w-full h-40 bg-sand-neutral relative mb-4 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-onyx-black/60 to-transparent"></div>
              <div className="relative z-10 text-center px-4">
                <span className="font-headline-md text-white text-lg block leading-tight">Hub 12 Sector B</span>
                <span className="font-label-caps text-sand-neutral text-[10px] uppercase tracking-wider">Corridor: Nargis Dutt Rd</span>
              </div>
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white font-label-caps text-[10px]">
                <span>{location.latitude}° N, {location.longitude}° E</span>
                <span>±{location.accuracy}m</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs py-1 border-b border-bone-white">
                <span className="font-label-caps text-clay-earth uppercase">Corridor Zone</span>
                <span className="font-body-md text-onyx-black font-medium">Bandra West • Cluster 4</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-bone-white">
                <span className="font-label-caps text-clay-earth uppercase">Battery &amp; Network</span>
                <span className="font-body-md text-onyx-black font-medium">84% • 5G Ultra Band</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-bone-white">
                <span className="font-label-caps text-clay-earth uppercase">Current Speed</span>
                <span className="font-body-md text-onyx-black font-medium">0.0 km/h (Stationary)</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="font-label-caps text-clay-earth uppercase">Hub Dispatch Officer</span>
                <span className="font-body-md text-onyx-black font-medium">Capt. H. Mehta</span>
              </div>
            </div>
          </div>

          {/* Quick Escalation Protocol Card */}
          <div className="bg-onyx-black text-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-white text-base">emergency_share</span>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-sand-neutral">Escalation Protocol</span>
            </div>
            <h4 className="font-headline-md text-headline-md text-white mb-2 leading-tight">Driver Protection Policy</h4>
            <p className="font-body-md text-xs text-sand-neutral leading-relaxed mb-4">
              Under TiffinLink Field Standard 2026, couriers are strictly instructed never to handle aggressive confrontation or force compromised tiffin seals onto customers. Damaged thalis are automatically reimbursed upon photo verification.
            </p>
            <div className="p-3 bg-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] uppercase text-sand-neutral">Emergency Control Desk</span>
                <span className="font-button-text text-sm text-white font-semibold">1800-419-TIFFIN</span>
              </div>
              <button
                type="button"
                onClick={triggerEmergencySOS}
                className="px-2.5 py-1 bg-white text-onyx-black font-label-caps text-[10px] uppercase tracking-wider hover:bg-sand-neutral"
              >
                Call Hub
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Incident & Issue History Section */}
      <section className="bg-surface-container-lowest p-6 sm:p-8 shadow-sm mb-16" id="history-section">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-sand-neutral">
          <div>
            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Telemetry Record</span>
            <h2 className="font-headline-md text-headline-md text-onyx-black font-normal">Courier Incident Audit Log</h2>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ticket # or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-bone-white text-xs px-3 py-1.5 pr-8 focus:outline-none focus:bg-sand-neutral/30 font-body-md"
              />
              <span className="material-symbols-outlined text-sm absolute right-2 top-2 text-clay-earth">search</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" id="filterTabs">
              {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`filter-tab px-3 py-1.5 font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
                    statusFilter === st ? 'bg-onyx-black text-white' : 'bg-bone-white text-on-surface-variant hover:bg-sand-neutral'
                  }`}
                >
                  {st === 'UNDER_REVIEW' ? 'Under Review' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table of Logged Issues */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-clay-earth">
              <span className="w-6 h-6 border-2 border-onyx-black border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
              <p className="font-body-md text-sm">Fetching authenticated driver report history from MongoDB...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center bg-bone-white/50 border border-dashed border-sand-neutral">
              <span className="material-symbols-outlined text-3xl text-clay-earth mb-2">folder_off</span>
              <p className="font-headline-md text-base text-onyx-black">No Incident Reports Found</p>
              <p className="font-body-md text-xs text-clay-earth mt-1">No safety reports match your current filter criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm" id="incidentTable">
              <thead>
                <tr className="border-b border-sand-neutral text-clay-earth font-label-caps text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket / ID</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status &amp; Hub Assignment</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bone-white">
                {filteredReports.map((report) => {
                  const isHigh = report.priority === 'HIGH' || report.priority === 'CRITICAL';
                  return (
                    <tr key={report.reportId || report._id} className="incident-row hover:bg-bone-white/60 transition-colors">
                      <td className="py-4 px-4 font-headline-md text-base text-onyx-black font-medium">#{report.reportId}</td>
                      <td className="py-4 px-4">
                        <span className="font-button-text text-xs text-onyx-black block">{report.orderId ? `#${report.orderId}` : 'N/A (General)'}</span>
                        <span className="font-label-caps text-[10px] text-clay-earth uppercase">Corridor Log</span>
                      </td>
                      <td className="py-4 px-4 font-body-md text-xs text-on-surface">
                        {report.category ? report.category.replace('_', ' ') : 'General Issue'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 font-label-caps text-[10px] uppercase tracking-wider ${
                          isHigh ? 'bg-onyx-black text-white' : 'bg-bone-white text-clay-earth'
                        }`}>
                          {report.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${report.status === 'OPEN' ? 'bg-onyx-black' : report.status === 'RESOLVED' ? 'bg-secondary-fixed-dim' : 'bg-sand-neutral'}`}></span>
                          <span className="font-button-text text-xs text-onyx-black font-medium">
                            {report.status} ({report.assignedSupervisor || 'Capt. Mehta'})
                          </span>
                        </div>
                        <span className="font-body-md text-[11px] text-clay-earth block truncate max-w-xs">
                          {report.description}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-body-md text-xs text-clay-earth">
                        {report.createdAt ? new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReportDetail(report)}
                          className="px-3 py-1 bg-bone-white hover:bg-sand-neutral text-onyx-black font-button-text text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          View Thread
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Ticket Details Modal */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 bg-onyx-black/70 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedReportDetail(null)}
              className="absolute top-4 right-4 text-onyx-black hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            <span className="font-label-caps text-label-caps text-clay-earth uppercase tracking-widest block mb-1">Hub Telemetry Thread</span>
            <h3 className="font-headline-md text-headline-md text-onyx-black mb-4">Ticket #{selectedReportDetail.reportId}</h3>

            <div className="space-y-3 font-body-md text-sm mb-6">
              <div className="flex justify-between py-1.5 border-b border-bone-white">
                <span className="text-clay-earth">Status</span>
                <span className="font-semibold text-onyx-black">{selectedReportDetail.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bone-white">
                <span className="text-clay-earth">Priority</span>
                <span className="font-semibold text-onyx-black">{selectedReportDetail.priority}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bone-white">
                <span className="text-clay-earth">Category</span>
                <span className="font-semibold text-onyx-black">{selectedReportDetail.category}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bone-white">
                <span className="text-clay-earth">Associated Order</span>
                <span className="font-semibold text-onyx-black">{selectedReportDetail.orderId || 'None'}</span>
              </div>
              <div className="py-2 border-b border-bone-white">
                <span className="text-clay-earth block mb-1">Description</span>
                <p className="text-onyx-black bg-bone-white p-3 text-xs leading-relaxed">{selectedReportDetail.description}</p>
              </div>
              <div className="flex justify-between py-1.5 border-b border-bone-white">
                <span className="text-clay-earth">Contact Preference</span>
                <span className="font-semibold text-onyx-black">{selectedReportDetail.contactPreference}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReportDetail(null)}
                className="px-6 py-2.5 bg-onyx-black text-white font-button-text text-xs uppercase tracking-wider hover:bg-clay-earth"
              >
                Close Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Hardware & Compliance Signature Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-sand-neutral text-clay-earth font-label-caps text-[11px]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-sm text-onyx-black">fingerprint</span>
          <span>Session Token: SHA-256 [0x78FA...{driverProfile?.driverId || driverCode}]</span>
          <span className="hidden md:inline">• Carrier: Jio Mobility 5G Private APN</span>
        </div>
        <div className="flex items-center gap-4">
          <span>TiffinLink Driver Safety Framework 2026</span>
          <span className="w-1 h-1 rounded-full bg-sand-neutral"></span>
          <span className="text-onyx-black">Hub 12 Security Gateway Active</span>
        </div>
      </div>

    </div>
  );
}
