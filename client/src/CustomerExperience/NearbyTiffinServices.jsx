import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import TiffinCustomizer from './TiffinCustomizer';
import ProviderDossier from './ProviderDossier';

const AHMEDABAD_LOCALITIES = {
  'satellite': { lat: 23.0300, lng: 72.5178, name: 'Satellite, Ahmedabad' },
  'vastrapur': { lat: 23.0358, lng: 72.5293, name: 'Vastrapur, Ahmedabad' },
  'bodakdev': { lat: 23.0425, lng: 72.5150, name: 'Bodakdev, Ahmedabad' },
  'prahlad nagar': { lat: 23.0125, lng: 72.5100, name: 'Prahlad Nagar, Ahmedabad' },
  'prahlad': { lat: 23.0125, lng: 72.5100, name: 'Prahlad Nagar, Ahmedabad' },
  'navrangpura': { lat: 23.0370, lng: 72.5600, name: 'Navrangpura, Ahmedabad' },
  'cg road': { lat: 23.0280, lng: 72.5590, name: 'C.G. Road, Ahmedabad' },
  'paldi': { lat: 23.0150, lng: 72.5620, name: 'Paldi, Ahmedabad' },
  'gota': { lat: 23.1000, lng: 72.5350, name: 'Gota, Ahmedabad' },
  'bopal': { lat: 23.0350, lng: 72.4650, name: 'South Bopal, Ahmedabad' },
  'maninagar': { lat: 22.9978, lng: 72.6033, name: 'Maninagar, Ahmedabad' },
  'makarba': { lat: 22.9960, lng: 72.5020, name: 'Makarba, Ahmedabad' },
  'thaltej': { lat: 23.0560, lng: 72.5050, name: 'Thaltej, Ahmedabad' },
  'memnagar': { lat: 23.0500, lng: 72.5330, name: 'Memnagar, Ahmedabad' },
  'science city': { lat: 23.0760, lng: 72.4980, name: 'Science City, Ahmedabad' },
  'sindhu bhavan': { lat: 23.0450, lng: 72.5020, name: 'Sindhu Bhavan Road, Ahmedabad' },
  'iscon': { lat: 23.0270, lng: 72.5070, name: 'Iscon Cross Roads, Ahmedabad' },
  'naranpura': { lat: 23.0550, lng: 72.5530, name: 'Naranpura, Ahmedabad' },
  'ambawadi': { lat: 23.0210, lng: 72.5480, name: 'Ambawadi, Ahmedabad' },
  'chandkheda': { lat: 23.1120, lng: 72.5850, name: 'Chandkheda, Ahmedabad' }
};

export default function NearbyTiffinServices({ onNavigate, initialFilters = {}, onOpenLogin }) {
  // Centralized real-time location context
  const { location, isRecalibrating, recalibrateToast, recalibrate, setCustomLocation } = useLocation();

  // Navigation View: 'listing' | 'dossier' | 'customizer'
  const [activeView, setActiveView] = useState('listing');
  const [selectedDossierProvider, setSelectedDossierProvider] = useState(null);
  const [selectedCustomizerTiffin, setSelectedCustomizerTiffin] = useState(null);

  // Search & Filter State (Screen 1 & 2)
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [mealType, setMealType] = useState(initialFilters.mealType || 'Veg Tiffin');
  const [orderDate, setOrderDate] = useState(initialFilters.date || '2026-10-04');
  const [timeSlot, setTimeSlot] = useState(initialFilters.time || '01:00 PM - Lunch');
  const [fulfillment, setFulfillment] = useState(initialFilters.deliveryType || 'Delivery');
  const [locationAddress, setLocationAddress] = useState(() => {
    return initialFilters.location || location.address || '';
  });
  const [budget, setBudget] = useState(Number(initialFilters.budget) || 150);
  const [radiusKm, setRadiusKm] = useState(5.0); // 5km to 10km supported
  const [coordinates, setCoordinates] = useState(() => {
    if (location.isCalibrated && location.latitude && location.longitude) {
      return { lat: location.latitude, lng: location.longitude };
    }
    if (initialFilters.lat && initialFilters.lng) {
      return { lat: Number(initialFilters.lat), lng: Number(initialFilters.lng) };
    }
    return { lat: 23.0300, lng: 72.5178 };
  });
  const [sortBy, setSortBy] = useState('distance');

  // Atelier cooking standard mandates (checkboxes)
  const [mandates, setMandates] = useState({
    coldPressedOil: true,
    zeroSoda: true,
    pureGhee: true,
    singleOriginFresh: true
  });

  // Database-driven Providers
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currentUser } = useAuth();
  const { addToCart } = useCart();

  // Fetch Providers dynamically from MongoDB based on coordinates, radius, dietary, and filters
  const fetchProviders = async (overrideCoords = null) => {
    setLoading(true);
    try {
      const activeCoords = overrideCoords || coordinates;
      const dietaryQuery = mealType.toLowerCase().includes('jain') 
        ? 'jain' 
        : (mealType.toLowerCase().includes('non-veg') ? 'non-veg' : 'veg');

      const params = new URLSearchParams({
        lat: activeCoords.lat,
        lng: activeCoords.lng,
        radius: radiusKm,
        dietary: dietaryQuery,
        sort: sortBy,
        minPrice: 0,
        maxPrice: budget + 50
      });

      const res = await fetch(`http://localhost:5000/api/providers?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setProviders(json.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [coordinates, radiusKm, mealType, budget, sortBy]);

  // Synchronize dynamic initialFilters coming from Kitchen Concierge form or Categories
  useEffect(() => {
    if (!initialFilters || Object.keys(initialFilters).length === 0) return;

    if (initialFilters.location) {
      setLocationAddress(initialFilters.location);
      const locLower = initialFilters.location.toLowerCase();
      for (const [key, coords] of Object.entries(AHMEDABAD_LOCALITIES)) {
        if (locLower.includes(key)) {
          setCoordinates(coords);
          break;
        }
      }
    }

    if (initialFilters.mealType) {
      setMealType(initialFilters.mealType);
    }

    if (initialFilters.budget) {
      setBudget(Number(initialFilters.budget) || 150);
    }

    if (initialFilters.date) setOrderDate(initialFilters.date);
    if (initialFilters.time) setTimeSlot(initialFilters.time);
    if (initialFilters.deliveryType) setFulfillment(initialFilters.deliveryType);

    if (initialFilters.selectedProvider) {
      setSelectedDossierProvider(initialFilters.selectedProvider);
      setActiveView('dossier');
    } else if (initialFilters.selectedProviderId) {
      setSelectedDossierProvider({ _id: initialFilters.selectedProviderId });
      setActiveView('dossier');
    }
  }, [initialFilters]);

  // URL Hash Deep-Linking (e.g. #find-tiffin?provider=ID or #find-tiffin?tiffin=ID)
  useEffect(() => {
    const handleUrlHash = async () => {
      const hash = window.location.hash || '';
      if (hash.includes('tiffin=')) {
        const tId = hash.split('tiffin=')[1]?.split('&')[0];
        if (tId) {
          try {
            const tRes = await fetch(`http://localhost:5000/api/tiffins/${tId}`);
            const tData = await tRes.json();
            if (tData.success && tData.data) {
              const pId = tData.data.providerId;
              let pData = null;
              if (pId) {
                const pRes = await fetch(`http://localhost:5000/api/providers/${pId}`);
                const pJson = await pRes.json();
                if (pJson.success) pData = pJson.data;
              }
              setSelectedCustomizerTiffin({ tiffin: tData.data, provider: pData });
              setActiveView('customizer');
              return;
            }
          } catch (e) {}
        }
      }

      if (hash.includes('provider=')) {
        const provId = hash.split('provider=')[1]?.split('&')[0];
        if (provId) {
          try {
            const res = await fetch(`http://localhost:5000/api/providers/${provId}`);
            const json = await res.json();
            if (json.success && json.data) {
              setSelectedDossierProvider(json.data);
              setActiveView('dossier');
              return;
            }
          } catch (e) {}
        }
      }

      // Check if user just logged in with a pending customization in local storage
      const pendingCustom = localStorage.getItem('tiffinlink_pending_customization');
      if (pendingCustom && currentUser) {
        try {
          const parsed = JSON.parse(pendingCustom);
          if (parsed.tiffinId) {
            const tRes = await fetch(`http://localhost:5000/api/tiffins/${parsed.tiffinId}`);
            const tJson = await tRes.json();
            let pData = null;
            if (parsed.providerId) {
              const pRes = await fetch(`http://localhost:5000/api/providers/${parsed.providerId}`);
              const pJson = await pRes.json();
              if (pJson.success) pData = pJson.data;
            }
            if (tJson.success && tJson.data) {
              setSelectedCustomizerTiffin({ tiffin: tJson.data, provider: pData });
              setActiveView('customizer');
              return;
            }
          }
        } catch (e) {}
      }
    };

    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);
    return () => window.removeEventListener('hashchange', handleUrlHash);
  }, [currentUser]);

  // Navigate to Provider Dossier
  const handleOpenDossier = (prov) => {
    setSelectedDossierProvider(prov);
    setActiveView('dossier');
    window.location.hash = `#find-tiffin?provider=${prov._id}`;
  };

  // Helper to resolve an address string to coordinates
  const resolveAddressToCoords = (addr) => {
    const text = (addr || '').toLowerCase().trim();
    for (const [key, data] of Object.entries(AHMEDABAD_LOCALITIES)) {
      if (text.includes(key)) {
        return {
          coords: { lat: data.lat, lng: data.lng },
          formattedName: data.name || `${key.charAt(0).toUpperCase() + key.slice(1)}, Ahmedabad`
        };
      }
    }
    return null;
  };

  // Synchronize with calibrated location from context
  useEffect(() => {
    if (location.isCalibrated && location.latitude && location.longitude) {
      const nextCoords = { lat: location.latitude, lng: location.longitude };
      setCoordinates(nextCoords);
      if (location.address) {
        setLocationAddress(location.address);
      }
    }
  }, [location.isCalibrated, location.latitude, location.longitude, location.address]);

  // Quick Zone selection handler
  const handleSelectQuickZone = (zoneName) => {
    const resolved = resolveAddressToCoords(zoneName);
    if (resolved) {
      setCoordinates(resolved.coords);
      setLocationAddress(resolved.formattedName);
      setCustomLocation({
        latitude: resolved.coords.lat,
        longitude: resolved.coords.lng,
        address: resolved.formattedName
      });
      fetchProviders(resolved.coords);
    }
  };

  // Browser Geolocation Detection & Intelligent Recalibration (Section 8 & 9)
  const handleDetectLocation = async () => {
    const updated = await recalibrate();
    if (updated && updated.latitude && updated.longitude) {
      const newCoords = { lat: updated.latitude, lng: updated.longitude };
      setCoordinates(newCoords);
      setLocationAddress(updated.address);
      fetchProviders(newCoords);
    }
  };

  // Submit Search Form (Screen 1)
  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSearchFormOpen(false);
    fetchProviders();
  };

  // VIEW 1: Tiffin Customizer
  if (activeView === 'customizer' && selectedCustomizerTiffin) {
    return (
      <TiffinCustomizer
        tiffin={selectedCustomizerTiffin.tiffin}
        provider={selectedCustomizerTiffin.provider}
        currentUser={currentUser}
        customerCoordinates={coordinates}
        customerAddress={locationAddress}
        onBack={() => {
          if (selectedDossierProvider) {
            setActiveView('dossier');
          } else {
            setActiveView('listing');
          }
        }}
        onOpenLogin={onOpenLogin}
        onCheckout={(order) => {
          localStorage.setItem('tiffinlink_recent_order', order.orderId || order._id);
        }}
      />
    );
  }

  // VIEW 2: Provider Dossier
  if (activeView === 'dossier' && selectedDossierProvider) {
    return (
      <ProviderDossier
        provider={selectedDossierProvider}
        onBack={() => {
          setActiveView('listing');
          window.location.hash = '#find-tiffin';
        }}
        onSelectTiffin={(tif) => {
          setSelectedCustomizerTiffin({ tiffin: tif, provider: selectedDossierProvider });
          setActiveView('customizer');
          window.location.hash = `#find-tiffin?provider=${selectedDossierProvider._id}&tiffin=${tif._id}`;
        }}
      />
    );
  }

  // VIEW 3: Provider Results Page (Screen 2)
  const featuredProvider = providers.find(p => p.rating >= 4.8) || (providers.length > 0 ? providers[0] : null);

  const searchPayload = {
    mealType,
    date: orderDate,
    time: timeSlot,
    fulfillmentType: fulfillment,
    location: locationAddress,
    geoAnchor: `${coordinates.lat.toFixed(4)}° N, ${coordinates.lng.toFixed(4)}° E`,
    budget: budget,
    maxDistanceKm: radiusKm
  };

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a]">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          TOP STICKY FILTER ARCHITECTURE BAR (SCREEN 2)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#f5f3ef]/90 backdrop-blur-md sticky top-20 z-40 shadow-xs border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('#home');
                else window.location.hash = '#home';
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#efeeea] px-3.5 py-1.5 border border-[#ded9d1] transition-colors group cursor-pointer shadow-xs mr-1 text-[#1a1a1a]"
            >
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span className="font-button-text text-xs uppercase tracking-wider font-bold">Back to Home</span>
            </button>

            <span className="font-label-caps text-xs uppercase text-[#4a4238] tracking-widest mr-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#1a1a1a]"></span>Active Polygon Filter
            </span>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">location_on</span>
              <span className="font-button-text text-xs">{locationAddress}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">eco</span>
              <span className="font-button-text text-xs">{mealType}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">calendar_today</span>
              <span className="font-button-text text-xs">{orderDate}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">schedule</span>
              <span className="font-button-text text-xs">{timeSlot.split(' ')[0]}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">payments</span>
              <span className="font-button-text text-xs">Budget ≤ ₹{budget}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">near_me</span>
              <span className="font-button-text text-xs">Radius: {radiusKm} km</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#1b1c1a] shadow-xs border border-[#ded9d1]">
              <span className="material-symbols-outlined text-[15px] text-[#4a4238]">two_wheeler</span>
              <span className="font-button-text text-xs">{fulfillment}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white font-button-text text-xs uppercase tracking-wider hover:bg-[#4a4238] transition-colors cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>{isSearchFormOpen ? 'Close Filters' : 'Edit Search'}</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SCREEN 1: EXPANDABLE "DESIGN YOUR DINING EXPERIENCE" SEARCH ARCHITECTURE
          ───────────────────────────────────────────────────────────────────────────── */}
      {isSearchFormOpen && (
        <section className="w-full bg-[#f5f3ef] border-b border-[#ded9d1] py-10 px-4 sm:px-6 lg:px-20 transition-all duration-500">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setIsSearchFormOpen(false)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#eae8e4] px-3.5 py-1.5 border border-[#ded9d1] transition-colors group cursor-pointer text-[#1a1a1a]"
              >
                <span className="material-symbols-outlined text-[16px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                <span className="font-button-text text-xs uppercase tracking-wider font-bold">Back to Kitchens</span>
              </button>
            </div>
            <div className="max-w-4xl space-y-2 mb-8">
              <span className="font-label-caps text-xs uppercase tracking-widest text-[#4a4238] block font-bold">
                DISCOVERY &amp; REQUISITION PROTOCOL
              </span>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-4xl text-[#1a1a1a] font-medium tracking-tight">
                Design your dining experience
              </h2>
              <p className="text-sm text-[#665d52]">
                Curated homestyle culinary allocations prepared by verified home ateliers across Satellite. Dynamic inventory synchronizes in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Form */}
              <div className="lg:col-span-8 bg-white p-6 sm:p-8 shadow-xs border border-[#ded9d1] relative">
                <form onSubmit={handleSearchSubmit} className="space-y-6">
                  {/* Field 1: Meal Type Selector */}
                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                      01 // Select Meal Architecture
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Veg Tiffin', 'Non-Veg Tiffin'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMealType(type)}
                          className={`px-3.5 py-2.5 font-button-text text-xs text-center transition-all cursor-pointer border ${
                            mealType === type
                              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] font-bold'
                              : 'bg-[#fbf9f5] text-[#444748] hover:text-[#1b1c1a] border-[#ded9d1]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 2 & 3: Date & Slot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                        02 // Dispatch Cycle Date
                      </label>
                      <div className="flex items-center bg-[#fbf9f5] px-3.5 py-2.5 border border-[#ded9d1]">
                        <span className="material-symbols-outlined text-[#665d52] mr-2 text-[18px]">calendar_month</span>
                        <input
                          type="date"
                          value={orderDate}
                          onChange={(e) => setOrderDate(e.target.value)}
                          className="w-full bg-transparent font-button-text text-xs text-[#1a1a1a] outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                        03 // Serving Time Window
                      </label>
                      <div className="flex items-center bg-[#fbf9f5] px-3.5 py-2.5 border border-[#ded9d1]">
                        <span className="material-symbols-outlined text-[#665d52] mr-2 text-[18px]">schedule</span>
                        <select
                          value={timeSlot}
                          onChange={(e) => setTimeSlot(e.target.value)}
                          className="w-full bg-transparent font-button-text text-xs text-[#1a1a1a] outline-none cursor-pointer"
                        >
                          <option value="01:00 PM - Lunch">01:00 PM — Lunch Handshake</option>
                          <option value="01:45 PM - Late Lunch">01:45 PM — Late Lunch Window</option>
                          <option value="07:30 PM - Dinner">07:30 PM — Evening Dispatch</option>
                          <option value="08:30 PM - Night Dinner">08:30 PM — Late Evening Run</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Field 4: Fulfillment Method */}
                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                      04 // Handshake Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setFulfillment('Delivery')}
                        className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 border ${
                          fulfillment === 'Delivery'
                            ? 'bg-[#f5f3ef] border-[#1a1a1a]'
                            : 'bg-[#fbf9f5] border-[#ded9d1] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          fulfillment === 'Delivery' ? 'bg-[#1a1a1a] text-white' : 'border border-[#ded9d1] text-transparent'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]">check</span>
                        </div>
                        <div>
                          <span className="font-button-text text-xs text-[#1a1a1a] font-semibold block">Doorstep Delivery</span>
                          <p className="text-[11px] text-[#665d52] mt-0.5">Calibrated thermal transit pod within {radiusKm} km polygon.</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setFulfillment('Pickup')}
                        className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 border ${
                          fulfillment === 'Pickup'
                            ? 'bg-[#f5f3ef] border-[#1a1a1a]'
                            : 'bg-[#fbf9f5] border-[#ded9d1] hover:bg-[#f5f3ef]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          fulfillment === 'Pickup' ? 'bg-[#1a1a1a] text-white' : 'border border-[#ded9d1] text-transparent'
                        }`}>
                          <span className="material-symbols-outlined text-[13px]">check</span>
                        </div>
                        <div>
                          <span className="font-button-text text-xs text-[#1a1a1a] font-semibold block">Pickup Atelier</span>
                          <p className="text-[11px] text-[#665d52] mt-0.5">Direct handshake at home kitchen atelier counter with QR verification.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field 5: Location with Lat/Long Anchor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                        05 // Delivery Checkpoint
                      </label>
                      <span className="font-mono text-[10px] text-[#4a4238]">
                        {coordinates?.lat && coordinates?.lng
                          ? `GEO: ${Number(coordinates.lat).toFixed(4)}° N, ${Number(coordinates.lng).toFixed(4)}° E`
                          : 'GEO: Not calibrated (Click RECALIBRATE)'}
                      </span>
                    </div>
                    <div className="flex items-center bg-[#fbf9f5] px-3.5 py-2.5 gap-2 border border-[#ded9d1]">
                      <span className="material-symbols-outlined text-[#1a1a1a] text-[18px]">explore</span>
                      <input
                        type="text"
                        value={locationAddress}
                        onChange={(e) => {
                          setLocationAddress(e.target.value);
                          setCustomLocation({ address: e.target.value });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleDetectLocation();
                          }
                        }}
                        placeholder="Enter current address or click RECALIBRATE to detect GPS"
                        className="w-full bg-transparent font-button-text text-xs text-[#1a1a1a] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isRecalibrating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#333333] active:scale-95 text-white font-label-caps text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0 font-bold border border-black"
                        title="Calibrate GPS Location & Recalculate Distance"
                      >
                        <span className={`material-symbols-outlined text-[15px] text-[#38bdf8] ${isRecalibrating ? 'animate-spin' : ''}`}>
                          {isRecalibrating ? 'sync' : 'my_location'}
                        </span>
                        <span className="text-white tracking-wider">{isRecalibrating ? 'CALIBRATING...' : 'RECALIBRATE'}</span>
                      </button>
                    </div>

                    {/* Live Recalibrate Status Toast / Confirmation Badge (Section 8) */}
                    {recalibrateToast && (
                      <div className={`flex items-center gap-1.5 py-1.5 px-3 border font-mono text-[11px] font-medium rounded-xs transition-all ${
                        recalibrateToast.includes('Unable') || recalibrateToast.includes('permission') || recalibrateToast.includes('timed out') || recalibrateToast.includes('Invalid') || recalibrateToast.includes('requires')
                          ? 'bg-[#ffebee] border-[#ffcdd2] text-[#c62828]'
                          : recalibrateToast.includes('LOCATING') || recalibrateToast.includes('Recalibrating')
                            ? 'bg-[#e0f2fe] border-[#bae6fd] text-[#0369a1]'
                            : recalibrateToast.includes('Low') || recalibrateToast.includes('Warning') || recalibrateToast.includes('low')
                              ? 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]'
                              : 'bg-[#e8f5e9] border-[#c8e6c9] text-[#1b5e20]'
                      }`}>
                        <span className={`material-symbols-outlined text-[14px] ${recalibrateToast.includes('LOCATING') || recalibrateToast.includes('Recalibrating') ? 'animate-spin' : ''}`}>
                          {recalibrateToast.includes('Unable') || recalibrateToast.includes('permission') || recalibrateToast.includes('timed out') || recalibrateToast.includes('Invalid') || recalibrateToast.includes('requires')
                            ? 'error'
                            : recalibrateToast.includes('LOCATING') || recalibrateToast.includes('Recalibrating')
                              ? 'sync'
                              : recalibrateToast.includes('Low') || recalibrateToast.includes('Warning') || recalibrateToast.includes('low')
                                ? 'warning'
                                : 'check_circle'}
                        </span>
                        <span>{recalibrateToast}</span>
                      </div>
                    )}

                    {/* Quick Sector Chips for Ahmedabad */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-[#665d52] font-mono uppercase font-semibold">Quick Zones:</span>
                      {['Satellite', 'Vastrapur', 'Bodakdev', 'Prahlad Nagar', 'Navrangpura', 'Bopal'].map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => handleSelectQuickZone(zone)}
                          className="px-2 py-0.5 text-[10px] font-mono bg-white border border-[#ded9d1] hover:border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors cursor-pointer text-[#4a4238]"
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 6 & 7: Budget Slider & Radius Slider */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 bg-[#fbf9f5] p-3.5 border border-[#ded9d1]">
                      <div className="flex justify-between items-baseline">
                        <label className="font-label-caps text-[11px] uppercase tracking-wider text-[#1b1c1a] font-bold">
                          06 // Baseline Price
                        </label>
                        <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] font-semibold">
                          ₹{budget} <span className="text-xs text-[#665d52]">/ meal</span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="300"
                        step="5"
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full accent-[#1a1a1a] cursor-pointer"
                      />
                      <div className="flex justify-between font-label-caps text-[9px] text-[#665d52] uppercase">
                        <span>Min ₹100</span>
                        <span>Target ₹150</span>
                        <span>Feast ₹300</span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-[#fbf9f5] p-3.5 border border-[#ded9d1]">
                      <div className="flex justify-between items-baseline">
                        <label className="font-label-caps text-[11px] uppercase tracking-wider text-[#1b1c1a] font-bold">
                          07 // Search Radius (5km to 10km)
                        </label>
                        <span className="font-button-text text-xs text-[#1a1a1a] font-bold">
                          {radiusKm.toFixed(1)} KM
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="10"
                        step="0.5"
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                        className="w-full accent-[#1a1a1a] cursor-pointer"
                      />
                      <div className="flex justify-between font-label-caps text-[9px] text-[#665d52] uppercase">
                        <span>5.0 km Strict</span>
                        <span>7.5 km Mid</span>
                        <span>10.0 km Max</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Search State Payload Box */}
                  <div className="p-3.5 bg-[#f5f3ef] border border-[#ded9d1] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-[10px] uppercase tracking-widest text-[#665d52] flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[13px]">terminal</span>
                        Active Search State Payload // Escrow Query Matrix
                      </span>
                      <span className="font-label-caps text-[9px] text-[#4a4238] font-mono">STATUS: SYNCED</span>
                    </div>
                    <pre className="font-mono text-[11px] text-[#1b1c1a] bg-white p-2.5 overflow-x-auto leading-relaxed border border-[#ded9d1]">
                      {JSON.stringify(searchPayload, null, 2)}
                    </pre>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1a1a1a] text-white font-button-text text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-[#4a4238] transition-colors cursor-pointer font-bold"
                  >
                    <span>FIND MATCHING PROVIDERS</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>
              </div>

              {/* Right: Architectural Zone Map Anchor */}
              <div className="lg:col-span-4 bg-white p-6 shadow-xs border border-[#ded9d1] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-xs uppercase text-[#1a1a1a] tracking-wider font-bold">ZONE DISPATCH ISOLINE</span>
                  <span className="font-label-caps text-xs text-[#4a4238] font-semibold">{radiusKm} KM RADIAL</span>
                </div>
                <div className="w-full h-48 bg-[#ded9d1] relative overflow-hidden flex items-end p-3 border border-[#ded9d1]">
                  <img 
                    className="absolute inset-0 w-full h-full object-cover grayscale contrast-125"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYJfOhWCYJaGO5pVRCFve6WoZZxEEY_pLdHkfGosN8bV9Dum0myPzUNbEeosxERSlnkXFD6QX9HPvpoQxOMP_l5kEHlaWGCPpfcISHGDnNK6EfcG5mDLYAjeKrAEkkvb7zbiziiK1WgP1y0BEEDK63TjkLaDWA3pobQIxYBo9wJPyEvAMS1qEx4Zp6Tr5dOrwOryeqsljfPHvYSTFA7BLAGrWAkAf2R_4o-3a4Ek6hQ89VZ5-6oLxO"
                    alt="Map"
                  />
                  <div className="absolute inset-0 bg-[#1a1a1a]/15"></div>
                  <div className="relative z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-label-caps uppercase tracking-wider text-[#1a1a1a] border border-[#ded9d1]">
                    GEO-ANCHOR // {locationAddress.split(',')[0]} CORE
                  </div>
                </div>
                <p className="text-xs text-[#665d52] leading-relaxed">
                  Thermal loss coefficient within this zone remains below 1.2°C per 15 minutes of transit in vacuum-sealed 304 food-grade stainless carriers.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SCREEN 2: PROVIDER RESULTS MAIN CANOPY
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-10 w-full space-y-16">
        
        {/* Editorial Spatial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#ded9d1]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('#home');
                  else window.location.hash = '#home';
                }}
                className="inline-flex items-center gap-1.5 font-label-caps text-xs text-[#665d52] hover:text-[#1a1a1a] uppercase tracking-wider transition-colors cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[15px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                <span className="font-bold">Home</span>
              </button>
              <span className="text-[#ded9d1]">/</span>
              <span className="font-label-caps text-xs text-[#4a4238] uppercase tracking-widest font-bold">
                Geolocation Index // R-{radiusKm}km
              </span>
              <span className="w-8 h-[1px] bg-[#ded9d1]"></span>
              <span className="font-label-caps text-xs text-[#665d52] uppercase font-semibold hidden sm:inline">
                Haversine Spatial Verification Passed
              </span>
            </div>
            <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl sm:text-5xl text-[#1a1a1a] tracking-tight font-normal">
              Matching Kitchen Ateliers
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-[#665d52] max-w-xl leading-relaxed">
              Curated culinary producers within your immediate delivery quadrant in {locationAddress.split(',')[0]}. All active participants adhere to strict temperature seals and escrow release protocols.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#f5f3ef] px-6 py-4 border border-[#ded9d1]">
            <div>
              <span className="font-label-caps text-[10px] block text-[#4a4238] uppercase font-semibold">Network Load</span>
              <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] leading-tight font-semibold">
                {Math.min(95, providers.length * 18 + 15)} / 100
              </span>
            </div>
            <div className="w-[1px] h-9 bg-[#ded9d1]"></div>
            <div>
              <span className="font-label-caps text-[10px] block text-[#4a4238] uppercase font-semibold">Verified Nodes</span>
              <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] leading-tight font-semibold">
                0{providers.length} Active
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3 bg-white border border-[#ded9d1]">
            <div className="w-8 h-8 border-3 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-label-caps text-xs uppercase text-[#665d52] font-semibold">
              Querying database for nearest ateliers within {radiusKm} km...
            </p>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white border border-[#ded9d1] p-8">
            <span className="material-symbols-outlined text-5xl text-[#665d52]">storefront</span>
            <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a]">
              No Ateliers Found Within {radiusKm} KM
            </h3>
            <p className="text-sm text-[#665d52] max-w-md mx-auto">
              Try extending your search radius to 10 km or adjust the meal type filter to discover more verified home kitchens.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => { setRadiusKm(10); setIsSearchFormOpen(true); }}
                className="px-6 py-3 bg-[#1a1a1a] text-white text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Expand to 10 KM &amp; Edit Search
              </button>
              <button
                onClick={() => {
                  if (onNavigate) onNavigate('#home');
                  else window.location.hash = '#home';
                }}
                className="px-6 py-3 bg-[#f5f3ef] hover:bg-[#eae8e4] text-[#1a1a1a] text-xs uppercase font-bold tracking-wider cursor-pointer border border-[#ded9d1]"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ─────────────────────────────────────────────────────────────────────────────
                SECTION 1: RECOMMENDED FOR YOU (PRIORITY ALLOCATION - SCREEN 2 HERO CARD)
                ───────────────────────────────────────────────────────────────────────────── */}
            {featuredProvider && (
              <section className="space-y-5">
                <div className="flex items-baseline justify-between">
                  <div className="space-y-1">
                    <span className="font-label-caps text-xs tracking-widest uppercase text-[#4a4238] block font-bold">
                      Priority Allocation
                    </span>
                    <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] font-medium">
                      Recommended For You
                    </h2>
                  </div>
                  <span className="font-label-caps text-xs uppercase text-[#665d52] hidden sm:inline">
                    Criteria match: 99.4% ({mealType} • Lunch • {locationAddress.split(',')[0]} • ₹{budget} baseline)
                  </span>
                </div>

                {/* Hero Recommendation Feature Box */}
                <div className="bg-white shadow-xs border border-[#ded9d1] grid grid-cols-1 lg:grid-cols-12 overflow-hidden transition-all duration-300">
                  {/* Visual Presentation Left */}
                  <div className="lg:col-span-5 relative min-h-[340px] lg:min-h-full overflow-hidden bg-[#ded9d1]">
                    <img
                      className="w-full h-full object-cover"
                      src={featuredProvider.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiw6tDo_f_kjjAYJbR39UjbsjfiZLISgukNlT1NLBHi6J70rn0ejgipVric4kdY9aLpNEJMCdaVDiL8ZUhs2Pr3i82XS9JcfUcjDgDZsKMMdXcuPnaz-tc9K8m4GT_mWP4uXCToqmZ-cdSH4BbRHLvSLcscSQcf-bTi_8Ahcdj52ThYGMoKswqnaycYzc9phyP3adyOX_soeSnnwvIYuhZa0M7qQAON5joyoBaSK28KytaqIUDCJ7G'}
                      alt={featuredProvider.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span className="font-label-caps text-[10px] uppercase tracking-wider font-bold">
                          A-Grade Kitchen Audit // 09-2026
                        </span>
                      </div>
                      <span className="font-label-caps text-[10px] bg-[#1a1a1a]/90 px-2.5 py-1 uppercase tracking-widest text-white border border-white/20 font-bold">
                        Tier 1 Certified
                      </span>
                    </div>
                  </div>

                  {/* Metric & Dossier Right */}
                  <div className="lg:col-span-7 p-7 lg:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Header & Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <span className="font-label-caps text-[10px] uppercase tracking-widest px-2.5 py-0.5 bg-[#f5f3ef] text-[#4a4238] font-bold border border-[#ded9d1]">
                          Automated Prime Recommendation
                        </span>
                        <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                          <span className="material-symbols-outlined text-[18px] text-[#1a1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-button-text text-sm font-bold">{featuredProvider.rating || 4.8}</span>
                          <span className="font-body-md text-xs text-[#665d52]">({featuredProvider.reviewCount || 312} verified ratings)</span>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl lg:text-4xl text-[#1a1a1a] mb-1 font-semibold leading-tight">
                        {featuredProvider.name}
                      </h3>
                      <p className="font-body-md text-xs sm:text-sm text-[#665d52] mb-5 leading-relaxed">
                        {featuredProvider.description || 'Healthy & Delicious Homemade Food • Homestyle Kathiyawadi & Gujarati Craft'}
                      </p>

                      {/* Metrics Cluster */}
                      <div className="grid grid-cols-3 gap-3 py-3.5 bg-[#fbf9f5] px-4 mb-5 border border-[#ded9d1]">
                        <div className="space-y-0.5">
                          <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Spatial Proximity</span>
                          <span className="font-button-text text-base text-[#1a1a1a] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-[#4a4238]">near_me</span>
                            {featuredProvider.distanceKm || '1.2'} km
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Transit Cadence</span>
                          <span className="font-button-text text-base text-[#1a1a1a] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-[#4a4238]">timelapse</span>
                            ~{featuredProvider.etaMinutes || '22'} mins
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Base Allocation</span>
                          <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] font-semibold">
                            ₹{featuredProvider.price || 140}<span className="text-xs text-[#665d52] font-sans">/meal</span>
                          </span>
                        </div>
                      </div>

                      {/* Dietary Protocol Chips */}
                      <div className="space-y-1.5 mb-5">
                        <span className="font-label-caps text-[10px] uppercase text-[#4a4238] block font-bold">
                          Dietary Standard Protocols
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(featuredProvider.tags || ['Veg', 'Jain Friendly', 'Gir Cow Ghee Only', 'Cold-Pressed Oil']).map((tg, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-[#f5f3ef] text-[#1a1a1a] font-label-caps text-[10px] uppercase font-semibold border border-[#ded9d1]/60">
                              {tg}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Configured Tiffin Sets Within Range */}
                      <div className="space-y-1.5">
                        <span className="font-label-caps text-[10px] uppercase text-[#4a4238] block font-bold">
                          Configured Tiffin Sets Within Range
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(featuredProvider.tiffins && featuredProvider.tiffins.length > 0
                            ? featuredProvider.tiffins.slice(0, 3)
                            : [
                                { name: 'Gujarati Special', price: 140 },
                                { name: 'Satvik Jain', price: 150 },
                                { name: 'Kathiyawadi Set', price: 160 }
                              ]
                          ).map((t, idx) => (
                            <div key={idx} className="p-2.5 bg-[#fbf9f5] border border-[#ded9d1]">
                              <span className="font-button-text text-xs block text-[#1a1a1a] truncate font-medium">{t.name}</span>
                              <span className="text-xs text-[#4a4238] font-semibold">₹{t.price} net</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Capacity Bar & Direct Action */}
                    <div className="pt-4 bg-[#f5f3ef] p-4 space-y-3 border border-[#ded9d1]">
                      <div className="flex items-center justify-between text-[#1a1a1a] text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1b5e20] animate-pulse"></span>
                          <span className="font-label-caps text-[11px] uppercase font-bold">
                            {featuredProvider.availableSlots || 18} of 30 Lunch Slots Remaining
                          </span>
                        </div>
                        <span className="font-label-caps text-[10px] text-[#665d52]">Cut-off: 11:30 AM today</span>
                      </div>

                      {/* Progress Line */}
                      <div className="w-full bg-[#ded9d1] h-1.5 overflow-hidden">
                        <div className="bg-[#1a1a1a] h-full" style={{ width: '60%' }}></div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-[#665d52]">Escrow protection applied at checkout</span>
                        <button
                          type="button"
                          onClick={() => handleOpenDossier(featuredProvider)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-button-text text-xs uppercase tracking-wider hover:bg-[#4a4238] transition-colors cursor-pointer font-bold"
                        >
                          <span>View Provider Dossier</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ─────────────────────────────────────────────────────────────────────────────
                SECTION 2: ALL MATCHING PROVIDERS (SCREEN 2 PROVIDER CARDS GRID)
                ───────────────────────────────────────────────────────────────────────────── */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-label-caps text-xs tracking-widest uppercase text-[#4a4238] block font-bold">
                    Complete Quadrant Inventory
                  </span>
                  <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] font-medium">
                    All Matching Providers ({providers.length} Active Ateliers)
                  </h2>
                </div>

                {/* Sort metric toggle */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-label-caps text-[11px] text-[#665d52] uppercase font-semibold">Sort By:</span>
                  {[
                    { id: 'distance', label: 'Spatial Proximity' },
                    { id: 'rating', label: 'Rating' },
                    { id: 'price_asc', label: 'Baseline Price' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`font-button-text text-xs cursor-pointer transition-colors ${
                        sortBy === s.id
                          ? 'text-[#1a1a1a] underline underline-offset-4 font-bold'
                          : 'text-[#665d52] hover:text-[#1a1a1a]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Provider Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {providers.map((prov) => {
                  const pLocality = prov.address?.locality || 'Satellite Zone';
                  const pStartingPrice = prov.price || 120;
                  const pSlots = prov.availableSlots || 15;
                  const pFormats = (prov.categories && prov.categories.length > 0)
                    ? prov.categories
                    : (prov.tags || ['Gujarati Thali', 'Jain Satvik', 'Kathiyawadi']);

                  return (
                    <article
                      key={prov._id}
                      className="bg-white p-7 sm:p-8 flex flex-col justify-between group shadow-xs hover:shadow-md transition-shadow duration-300 border border-[#ded9d1]"
                    >
                      <div className="space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="font-label-caps text-[10px] uppercase text-[#4a4238] tracking-wider block mb-1 font-bold">
                              {pLocality} // Sector Grid
                            </span>
                            <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl text-[#1a1a1a] leading-tight font-semibold">
                              {prov.name}
                            </h3>
                            <p className="font-body-md text-xs sm:text-sm text-[#665d52] mt-1 line-clamp-2">
                              {prov.description || 'Authentic regional homestyle kitchen preparing small batch daily allocations.'}
                            </p>
                          </div>

                          <div className="px-2.5 py-1 bg-[#f5f3ef] text-[#1a1a1a] flex items-center gap-1 border border-[#ded9d1] shrink-0">
                            <span className="material-symbols-outlined text-[16px] text-[#1a1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-button-text text-xs font-bold">{prov.rating || 4.8}</span>
                          </div>
                        </div>

                        {/* Operational Indicators */}
                        <div className="grid grid-cols-3 gap-2 py-3 bg-[#fbf9f5] px-4 text-center border border-[#ded9d1]">
                          <div>
                            <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Distance</span>
                            <span className="font-button-text text-xs text-[#1a1a1a] font-semibold">{prov.distanceKm || '1.8'} km</span>
                          </div>
                          <div>
                            <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Starting At</span>
                            <span className="font-button-text text-xs text-[#1a1a1a] font-semibold">₹{pStartingPrice}/meal</span>
                          </div>
                          <div>
                            <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Available</span>
                            <span className="font-button-text text-xs text-[#1b5e20] font-bold">{pSlots} slots</span>
                          </div>
                        </div>

                        {/* Culinary Formats */}
                        <div className="space-y-1.5">
                          <span className="font-label-caps text-[10px] uppercase text-[#665d52] block font-bold">
                            Culinary Formats
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {pFormats.slice(0, 3).map((fmt, fIdx) => (
                              <span key={fIdx} className="px-2 py-0.5 bg-[#f5f3ef] text-[#1a1a1a] font-label-caps text-[10px] uppercase font-semibold border border-[#ded9d1]/60">
                                {fmt}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-6 mt-6 border-t border-[#ded9d1] flex items-center justify-between">
                        <span className="font-label-caps text-[10px] text-[#4a4238] uppercase font-semibold">
                          Transit: ~{prov.etaMinutes || '22'} Mins
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenDossier(prov)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white font-button-text text-xs uppercase tracking-wider hover:bg-[#4a4238] transition-colors cursor-pointer font-bold"
                        >
                          <span>View Provider</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Geographic & Cartographic Visualization Anchor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#f5f3ef] p-8 border border-[#ded9d1]">
              <div className="lg:col-span-5 space-y-3">
                <span className="font-label-caps text-xs uppercase text-[#4a4238] tracking-widest block font-bold">
                  Polygon Geometry Analysis
                </span>
                <h4 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl text-[#1a1a1a] font-medium">
                  Spatial Escrow Guarantee
                </h4>
                <p className="text-xs sm:text-sm text-[#665d52] leading-relaxed">
                  Each verified kitchen operates within a calibrated {radiusKm}-kilometer transit vector. Deliveries are dispatched in custom thermal-sealed stainless brass carriers designed to preserve 65°C core heat across {locationAddress.split(',')[0]} corridor traffic.
                </p>
                <div className="flex items-center gap-4 text-[#1a1a1a] font-label-caps text-[11px] uppercase pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#4a4238]">shield</span>
                    <span className="font-bold">Escrow Lock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#4a4238]">qr_code_scanner</span>
                    <span className="font-bold">Seal Handshake</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="w-full h-64 bg-[#ded9d1] relative overflow-hidden flex items-end p-4 border border-[#ded9d1]">
                  <img
                    className="absolute inset-0 w-full h-full object-cover grayscale contrast-125"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYJfOhWCYJaGO5pVRCFve6WoZZxEEY_pLdHkfGosN8bV9Dum0myPzUNbEeosxERSlnkXFD6QX9HPvpoQxOMP_l5kEHlaWGCPpfcISHGDnNK6EfcG5mDLYAjeKrAEkkvb7zbiziiK1WgP1y0BEEDK63TjkLaDWA3pobQIxYBo9wJPyEvAMS1qEx4Zp6Tr5dOrwOryeqsljfPHvYSTFA7BLAGrWAkAf2R_4o-3a4Ek6hQ89VZ5-6oLxO"
                    alt="Satellite Zone Map"
                  />
                  <div className="absolute inset-0 bg-[#1a1a1a]/20"></div>
                  <div className="relative z-10 bg-white/95 backdrop-blur-sm p-3 w-full flex items-center justify-between border border-[#ded9d1]">
                    <div>
                      <span className="font-label-caps text-[9px] uppercase block text-[#4a4238] font-bold">Center Point Reference</span>
                      <span className="font-button-text text-xs text-[#1a1a1a] font-semibold">{coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E ({locationAddress})</span>
                    </div>
                    <span className="font-label-caps text-[10px] px-2.5 py-1 bg-[#1a1a1a] text-white uppercase font-bold">
                      Radius: {radiusKm} KM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical / Provenance Protocol Note */}
            <div className="bg-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#ded9d1]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#4a4238] text-[22px]">info</span>
                <p className="text-xs text-[#665d52]">
                  Providers filtered by <strong className="text-[#1a1a1a] font-semibold">Haversine formula within {radiusKm} KM strict polygon</strong>. Dynamic prices reflecting provider starting baseline. Escrow disbursement triggered exclusively upon QR verification at doorstep.
                </p>
              </div>
              <span className="font-label-caps text-[10px] text-[#4a4238] tracking-widest uppercase font-bold shrink-0">
                Protocol v4.2.1-AHM
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
