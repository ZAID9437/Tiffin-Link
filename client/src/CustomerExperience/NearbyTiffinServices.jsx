import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoginRequiredModal from '../components/LoginRequiredModal';
import ProviderConflictModal from '../components/ProviderConflictModal';
import TiffinCustomizer from './TiffinCustomizer';

const AHMEDABAD_LOCALITIES = {
  'satellite': { lat: 23.0300, lng: 72.5178 },
  'vastrapur': { lat: 23.0358, lng: 72.5293 },
  'bodakdev': { lat: 23.0425, lng: 72.5150 },
  'prahlad': { lat: 23.0125, lng: 72.5100 },
  'navrangpura': { lat: 23.0370, lng: 72.5600 },
  'cg road': { lat: 23.0280, lng: 72.5590 },
  'paldi': { lat: 23.0150, lng: 72.5620 },
  'gota': { lat: 23.1000, lng: 72.5350 },
  'bopal': { lat: 23.0350, lng: 72.4650 },
  'maninagar': { lat: 22.9978, lng: 72.6033 },
  'makarba': { lat: 22.9960, lng: 72.5020 },
  'thaltej': { lat: 23.0560, lng: 72.5050 },
  'memnagar': { lat: 23.0500, lng: 72.5330 }
};

export default function NearbyTiffinServices({ onNavigate, initialFilters = {}, onOpenLogin }) {
  const dossierRef = useRef(null);

  // Full-page Artisanal Tiffin Customizer State
  const [customizingTiffin, setCustomizingTiffin] = useState(null);

  // Geolocation & Search Parameters
  const [address, setAddress] = useState(initialFilters.location || 'Satellite, Ahmedabad');
  const [coordinates, setCoordinates] = useState({ lat: 23.0300, lng: 72.5178 });
  const [radiusKm, setRadiusKm] = useState(5.0);
  const [dietary, setDietary] = useState(initialFilters.mealType ? (initialFilters.mealType.includes('Jain') ? 'jain' : (initialFilters.mealType.includes('Non-Veg') ? 'non-veg' : 'veg')) : 'all');
  const [priceRange, setPriceRange] = useState('all'); // 'all', '100-150', '150-200', '200+'
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'price_asc', 'slots'
  const [selectedSlot, setSelectedSlot] = useState('Lunch Slot (12:00 - 13:30)');

  // Providers & Database State
  const [providers, setProviders] = useState([]);
  const [telemetry, setTelemetry] = useState({
    activeKitchensCount: 6,
    matchingCount: 0,
    excludedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Synchronize dynamic initialFilters coming from Kitchen Concierge form or Categories
  useEffect(() => {
    if (!initialFilters || Object.keys(initialFilters).length === 0) return;

    if (initialFilters.location) {
      setAddress(initialFilters.location);
      setDeliveryAddress(initialFilters.location);
      const locLower = initialFilters.location.toLowerCase();
      for (const [key, coords] of Object.entries(AHMEDABAD_LOCALITIES)) {
        if (locLower.includes(key)) {
          setCoordinates(coords);
          break;
        }
      }
    }

    if (initialFilters.mealType) {
      const mt = initialFilters.mealType.toLowerCase();
      if (mt.includes('jain')) setDietary('jain');
      else if (mt.includes('non-veg')) setDietary('non-veg');
      else if (mt.includes('veg')) setDietary('veg');
      else setDietary('all');
    }

    if (initialFilters.budget) {
      const b = Number(initialFilters.budget);
      if (b <= 150) setPriceRange('100-150');
      else if (b <= 200) setPriceRange('150-200');
      else setPriceRange('200+');
    }

    if (initialFilters.time) {
      const t = String(initialFilters.time);
      if (t.includes('19:') || t.includes('20:') || t.includes('21:') || t.includes('7:') || t.includes('8:')) {
        setSelectedSlot('Dinner Slot (19:30 - 21:00)');
      } else {
        setSelectedSlot('Lunch Slot (12:00 - 13:30)');
      }
    }

    if (initialFilters.selectedProvider) {
      loadProviderDossier(initialFilters.selectedProvider);
    } else if (initialFilters.selectedProviderId) {
      loadProviderDossier({ _id: initialFilters.selectedProviderId });
    }
  }, [initialFilters]);

  // URL Hash Deep-Linking (e.g. #find-tiffin?provider=ID)
  useEffect(() => {
    const handleUrlHash = () => {
      const hash = window.location.hash || '';
      if (hash.includes('provider=')) {
        const provId = hash.split('provider=')[1]?.split('&')[0];
        if (provId) {
          loadProviderDossier({ _id: provId });
        }
      }
    };
    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);
    return () => window.removeEventListener('hashchange', handleUrlHash);
  }, []);

  // Meal Customization State inside Dossier
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTiffin, setSelectedTiffin] = useState(null);
  const [selectedShaak, setSelectedShaak] = useState('Bhindi Sambhariya (Stuffed Okra)');
  const [rotliCount, setRotliCount] = useState(4);
  const [quantity, setQuantity] = useState(1);
  const [extras, setExtras] = useState({
    chaas: true,
    sweet: true,
    extraRotli: false
  });
  const [instructions, setInstructions] = useState('Less spicy, no green chillies in dal.');

  const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const {
    cart,
    addToCart,
    clearCart,
    savePendingCheckout,
    getPendingCheckout,
    clearPendingCheckout,
    providerConflict,
    resolveProviderConflict
  } = useCart();

  // Cart & Order State
  const [cartFeedback, setCartFeedback] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(address);
  const [paymentMethod, setPaymentMethod] = useState('Online Payment');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Sync customer details when currentUser is available
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setCustomerName(currentUser.name);
      if (currentUser.phone) setCustomerPhone(currentUser.phone);
      if (currentUser.email) setCustomerEmail(currentUser.email);
    } else {
      try {
        const savedUser = localStorage.getItem('tiffinlink_user');
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.name) setCustomerName(u.name);
          if (u.phone) setCustomerPhone(u.phone);
          if (u.email) setCustomerEmail(u.email);
        }
      } catch (e) {}
    }
  }, [currentUser]);

  // Restore pending checkout state after successful login or page reload
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoginRequiredOpen(false);
    }
    const pending = getPendingCheckout();
    if (pending) {
      const pData = pending.checkout || pending;
      if (pData.provider) {
        setSelectedProvider(pData.provider);
      }
      if (pData.selectedCategory) setSelectedCategory(pData.selectedCategory);
      if (pData.selectedTiffin) setSelectedTiffin(pData.selectedTiffin);
      if (pData.selectedShaak) setSelectedShaak(pData.selectedShaak);
      if (pData.rotliCount) setRotliCount(pData.rotliCount);
      if (pData.quantity) setQuantity(pData.quantity);
      if (pData.extras) setExtras(pData.extras);
      if (pData.instructions) setInstructions(pData.instructions);
      if (pData.deliveryAddress) setDeliveryAddress(pData.deliveryAddress);
      if (pData.paymentMethod) setPaymentMethod(pData.paymentMethod);
      if (pData.selectedSlot) setSelectedSlot(pData.selectedSlot);

      if (currentUser) {
        setCustomerName(currentUser.name || pData.customerName || '');
        setCustomerPhone(currentUser.phone || pData.customerPhone || '');
        setCustomerEmail(currentUser.email || pData.customerEmail || '');
      } else {
        if (pData.customerName) setCustomerName(pData.customerName);
        if (pData.customerPhone) setCustomerPhone(pData.customerPhone);
        if (pData.customerEmail) setCustomerEmail(pData.customerEmail);
      }

      setIsCheckoutOpen(true);
    }
  }, [currentUser, isAuthenticated]);

  // Check URL deep-linking for checkout
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.includes('checkout=true')) {
      if (authLoading) return;
      if (!isAuthenticated && !currentUser) {
        setIsLoginRequiredOpen(true);
      } else {
        setIsCheckoutOpen(true);
      }
    }
  }, [authLoading, isAuthenticated, currentUser]);

  // Fetch Providers dynamically from MongoDB based on coordinates, radius, dietary, and filters
  const fetchProviders = async () => {
    setLoading(true);
    try {
      let minPrice = 0;
      let maxPrice = 9999;
      if (priceRange === '100-150') { minPrice = 100; maxPrice = 150; }
      else if (priceRange === '150-200') { minPrice = 150; maxPrice = 200; }
      else if (priceRange === '200+') { minPrice = 200; maxPrice = 9999; }

      const params = new URLSearchParams({
        lat: coordinates.lat,
        lng: coordinates.lng,
        radius: radiusKm,
        dietary,
        sort: sortBy,
        minPrice,
        maxPrice,
        search: address.toLowerCase().includes('ahmedabad') ? '' : address
      });

      const res = await fetch(`http://localhost:5000/api/providers?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setProviders(json.data);
        if (json.telemetry) {
          setTelemetry(json.telemetry);
        }

        // Auto-select first provider for Dossier if none selected or if currently selected is not in results
        if (json.data.length > 0) {
          if (!selectedProvider || !json.data.some(p => p._id === selectedProvider._id)) {
            loadProviderDossier(json.data[0]);
          }
        } else {
          setSelectedProvider(null);
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [coordinates, radiusKm, dietary, priceRange, sortBy]);

  // Load full details for selected Provider
  const loadProviderDossier = async (prov) => {
    try {
      const res = await fetch(`http://localhost:5000/api/providers/${prov._id}`);
      const json = await res.json();
      const p = json.success && json.data ? json.data : prov;
      setSelectedProvider(p);

      const availableCats = p.categories && p.categories.length > 0 ? p.categories : ['Gujarati Thali'];
      setSelectedCategory(availableCats[0]);

      if (p.tiffins && p.tiffins.length > 0) {
        setSelectedTiffin(p.tiffins[0]);
      } else {
        setSelectedTiffin({
          name: `${p.name} Special Thali`,
          price: p.price || 120,
          description: p.description || 'Authentic daily meal prepared fresh.'
        });
      }
    } catch (e) {
      setSelectedProvider(prov);
      setSelectedCategory(prov.categories?.[0] || 'Gujarati Thali');
    }

    // Scroll to dossier smoothly if on mobile / tablet or clicking card
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        dossierRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Change category within selected provider
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (selectedProvider?.tiffins) {
      const matched = selectedProvider.tiffins.find(t => t.category === cat);
      if (matched) {
        setSelectedTiffin(matched);
      }
    }
  };

  // Browser Geolocation Detection
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAddress('Current GPS Location (Ahmedabad)');
          setDeliveryAddress('Current GPS Location (Ahmedabad)');
        },
        (err) => {
          console.warn('Geolocation permission denied, falling back to Satellite, Ahmedabad');
          setCoordinates({ lat: 23.0300, lng: 72.5178 });
          setAddress('Satellite, Ahmedabad');
        }
      );
    }
  };

  // Price Calculations
  const basePrice = selectedTiffin?.price || selectedProvider?.price || 120;
  let extrasTotal = 0;
  if (extras.chaas) extrasTotal += 15;
  if (extras.sweet) extrasTotal += 20;
  if (extras.extraRotli) extrasTotal += 10;

  const subtotal = (basePrice + extrasTotal) * quantity;
  const deliveryFee = 20;
  const finalPayable = subtotal + deliveryFee;

  // Add to Cart action with full provider and item specification
  const handleAddToCart = () => {
    if (!selectedProvider) return;
    const selectedExtrasList = [];
    if (extras.chaas) selectedExtrasList.push({ name: 'Fresh Masala Chaas (250ml Clay Pot)', price: 15 });
    if (extras.sweet) selectedExtrasList.push({ name: 'Elaichi Kesar Shrikhand (100g Cup)', price: 20 });
    if (extras.extraRotli) selectedExtrasList.push({ name: 'Extra Rotli Pair (+2 Pieces)', price: 10 });

    const item = {
      tiffinId: selectedTiffin?._id || '',
      tiffinName: selectedTiffin?.name || `${selectedProvider.name} ${selectedCategory || 'Standard Thali'}`,
      selectedCategory: selectedCategory || 'Gujarati Thali',
      unitPrice: basePrice,
      quantity,
      selectedShaak,
      rotliCount,
      extras: selectedExtrasList,
      instructions
    };

    const res = addToCart(selectedProvider, item);
    if (res.success) {
      setCartFeedback(true);
      setTimeout(() => setCartFeedback(false), 2000);
    }
  };

  // Place Order API execution with mandatory authentication check
  const handlePlaceOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Please enter your Name and Phone Number to complete the order.');
      return;
    }

    const selectedExtrasList = [];
    if (extras.chaas) selectedExtrasList.push({ name: 'Fresh Masala Chaas (250ml Clay Pot)', price: 15 });
    if (extras.sweet) selectedExtrasList.push({ name: 'Elaichi Kesar Shrikhand (100g Cup)', price: 20 });
    if (extras.extraRotli) selectedExtrasList.push({ name: 'Extra Rotli Pair (+2 Pieces)', price: 10 });

    const checkoutPayload = {
      provider: selectedProvider,
      selectedCategory,
      selectedTiffin,
      selectedShaak,
      rotliCount,
      quantity,
      extras,
      instructions,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || currentUser?.email || '',
      deliveryAddress: deliveryAddress.trim() || address,
      paymentMethod,
      selectedSlot,
      coordinates
    };

    // 1. RULE: Check current authentication state
    if (authLoading) return;

    const isAuthed = Boolean(isAuthenticated || (currentUser && (currentUser._id || currentUser.id)));
    if (!isAuthed) {
      savePendingCheckout(checkoutPayload);
      setIsLoginRequiredOpen(true);
      return;
    }

    // 2. Prevent double-click duplicate orders
    if (orderSubmitting) return;
    setOrderSubmitting(true);

    try {
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || '';

      const payload = {
        providerId: selectedProvider._id,
        tiffinId: selectedTiffin?._id || '',
        tiffinName: selectedTiffin?.name || `${selectedProvider.name} ${selectedCategory || 'Standard Thali'}`,
        tiffinCategory: selectedCategory || 'Gujarati Thali',
        tiffinImage: selectedProvider.image || '/assets/provider_1.png',
        quantity,
        unitPrice: basePrice,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || currentUser?.email || '',
        customerAddress: deliveryAddress.trim() || address,
        deliveryCoordinates: coordinates,
        deliverySlot: selectedSlot,
        items: [
          { name: selectedShaak, category: 'Shaak' },
          { name: `${rotliCount} Phulka Rotlis with Desi Ghee`, category: 'Breads' },
          { name: 'Gujarati Dal & Steamed Rice', category: 'Base' }
        ],
        extras: selectedExtrasList,
        rotliCount,
        selectedShaak,
        instructions,
        paymentMethod
      };

      const res = await fetch('http://localhost:5000/api/orders/customer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 401 || (data.success === false && (data.message?.toLowerCase().includes('authentication') || data.message?.toLowerCase().includes('unauthorized')))) {
        savePendingCheckout(checkoutPayload);
        setIsLoginRequiredOpen(true);
        return;
      }

      if (data.success && data.data) {
        setPlacedOrder(data.data);
        localStorage.setItem('tiffinlink_recent_order', data.data.orderId);
        clearCart();
        clearPendingCheckout();
        setIsCheckoutOpen(false);
        setIsLoginRequiredOpen(false);
        clearCart();
        clearPendingCheckout();
        setIsCheckoutOpen(false);
      } else {
        alert('Could not place order: ' + (data.message || 'Please try again.'));
      }
    } catch (err) {
      console.error('Order placement error:', err);
      alert('Network error while placing order. Please check server connection.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (customizingTiffin) {
    return (
      <TiffinCustomizer
        tiffin={customizingTiffin.tiffin}
        provider={customizingTiffin.provider}
        currentUser={currentUser}
        onBack={() => setCustomizingTiffin(null)}
        onOpenLogin={onOpenLogin}
        onCheckout={(order) => {
          localStorage.setItem('tiffinlink_recent_order', order.orderId || order._id);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a] pt-24 sm:pt-28">
      {/* Hyperlocal Context Header & Geospatial Status */}
      <section className="w-full bg-[#fbf9f5] py-8 sm:py-10 border-b border-[#ded9d1]/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-margin-desktop space-y-8">
          {/* Top Title & Realtime Proximity Ribbon */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#ded9d1]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1b5e20] animate-pulse"></span>
                <span className="font-label-caps text-xs sm:text-label-caps text-[#665d52] uppercase tracking-widest font-semibold">
                  AHMEDABAD WEST CORRIDOR • LIVE GEOMATICS
                </span>
              </div>
              <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-5xl lg:text-headline-lg text-[#1a1a1a] tracking-tight leading-tight">
                Top Tiffin Providers Near You
              </h1>
              <p className="font-body-md text-sm sm:text-base text-[#665d52] max-w-2xl leading-relaxed">
                Locally audited homestyle culinary ateliers delivering hot artisan meals via food-grade 304 stainless steel insulated canisters.
              </p>
            </div>

            {/* Telemetry Indicators */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-[#f5f3ef] px-3.5 py-2 rounded-lg border border-[#ded9d1]/50 text-xs sm:text-sm">
                <span className="material-symbols-outlined text-[18px] text-[#4a4238]">my_location</span>
                <span className="font-label-caps uppercase text-[#1a1a1a] font-bold">{address.split(',')[0]}</span>
                <span className="text-[#665d52] text-[11px] font-mono">({coordinates.lat.toFixed(4)}° N, {coordinates.lng.toFixed(4)}° E)</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f5f3ef] px-3.5 py-2 rounded-lg border border-[#ded9d1]/50 text-xs sm:text-sm">
                <span className="material-symbols-outlined text-[18px] text-[#665d52]">radar</span>
                <span className="font-label-caps uppercase text-[#1a1a1a] font-semibold">Radius: {radiusKm} KM Strict</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] text-[#f5f3ef] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs">
                <span className="material-symbols-outlined text-[18px] text-[#4ade80]">check_circle</span>
                <span className="font-label-caps uppercase">{telemetry.matchingCount} Kitchens Online</span>
              </div>
            </div>
          </div>

          {/* Search Input & Filter System Architecture */}
          <div className="space-y-5">
            {/* Geolocation Address Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 bg-[#f5f3ef] rounded-xl flex items-center px-4 py-3 border border-[#ded9d1]/60 focus-within:border-[#1a1a1a] transition-all">
                <span className="material-symbols-outlined text-[#4a4238] mr-3 text-[22px]">location_searching</span>
                <input 
                  className="w-full bg-transparent font-body-md text-sm sm:text-base text-[#1a1a1a] placeholder:text-[#665d52]/70 focus:outline-none"
                  placeholder="Change address or landmark within Ahmedabad..." 
                  type="text" 
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setDeliveryAddress(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const locLower = address.toLowerCase();
                      for (const [key, coords] of Object.entries(AHMEDABAD_LOCALITIES)) {
                        if (locLower.includes(key)) {
                          setCoordinates(coords);
                          break;
                        }
                      }
                      fetchProviders();
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const locLower = address.toLowerCase();
                    for (const [key, coords] of Object.entries(AHMEDABAD_LOCALITIES)) {
                      if (locLower.includes(key)) {
                        setCoordinates(coords);
                        break;
                      }
                    }
                    fetchProviders();
                  }}
                  className="font-label-caps text-xs uppercase text-[#1a1a1a] hover:bg-[#ded9d1] font-bold px-3 py-1.5 bg-[#ded9d1]/60 rounded transition-colors whitespace-nowrap ml-2 cursor-pointer"
                >
                  Search
                </button>
                <button 
                  onClick={handleDetectLocation}
                  className="font-label-caps text-xs uppercase text-[#4a4238] hover:text-[#1a1a1a] font-bold px-3 py-1.5 bg-[#ded9d1]/40 rounded hover:bg-[#ded9d1]/80 transition-colors whitespace-nowrap ml-1 cursor-pointer"
                >
                  GPS Locate
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="bg-[#f5f3ef] rounded-xl px-4 py-3 flex items-center gap-2 border border-[#ded9d1]/60">
                  <span className="material-symbols-outlined text-[#665d52] text-[20px]">sort</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent font-button-text text-xs sm:text-sm text-[#1a1a1a] focus:outline-none cursor-pointer"
                  >
                    <option value="distance">Sort: Distance (Nearest First)</option>
                    <option value="rating">Rating: High to Low (4.5+)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="slots">Daily Slots Remaining</option>
                  </select>
                </div>

                <div className="bg-[#f5f3ef] rounded-xl px-4 py-3 flex items-center gap-2 border border-[#ded9d1]/60">
                  <span className="material-symbols-outlined text-[#665d52] text-[20px]">schedule</span>
                  <select 
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="bg-transparent font-button-text text-xs sm:text-sm text-[#1a1a1a] focus:outline-none cursor-pointer"
                  >
                    <option value="Lunch Slot (12:00 - 13:30)">Lunch Slot (12:00 - 13:30)</option>
                    <option value="Dinner Slot (19:30 - 21:00)">Dinner Slot (19:30 - 21:00)</option>
                    <option value="Both Slots (Full Subscription)">Both Slots (Full Subscription)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Strips: Dietary & Price Brackets */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Dietary Requirements */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-label-caps text-xs uppercase text-[#665d52] font-semibold mr-1">Dietary:</span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'veg', label: 'Pure Veg', color: '#22c55e' },
                  { id: 'non-veg', label: 'Non-Veg', color: '#ef4444' },
                  { id: 'jain', label: 'Jain Friendly', color: '#84cc16' }
                ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setDietary(item.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dietary === item.id 
                        ? 'bg-[#1a1a1a] text-[#f5f3ef] shadow-xs' 
                        : 'bg-[#f5f3ef] hover:bg-[#ded9d1]/60 text-[#1a1a1a] border border-[#ded9d1]/50'
                    }`}
                  >
                    {item.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Price Ranges & Radius Toggle */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-label-caps text-xs uppercase text-[#665d52] font-semibold mr-1">Meal Price:</span>
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: '100-150', label: '₹100 – ₹150' },
                    { id: '150-200', label: '₹150 – ₹200' },
                    { id: '200+', label: '₹200+' }
                  ].map(pr => (
                    <button 
                      key={pr.id}
                      onClick={() => setPriceRange(pr.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        priceRange === pr.id 
                          ? 'bg-[#1a1a1a] text-[#f5f3ef]' 
                          : 'bg-[#f5f3ef] text-[#665d52] hover:text-[#1a1a1a] border border-[#ded9d1]/50'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 pl-3 border-l border-[#ded9d1]">
                  <span className="font-label-caps text-xs uppercase text-[#665d52] font-semibold mr-1">Radius:</span>
                  <button 
                    onClick={() => setRadiusKm(5.0)}
                    className={`px-2.5 py-1 rounded text-xs font-bold ${radiusKm === 5.0 ? 'bg-[#4a4238] text-white' : 'text-[#665d52] hover:text-black'}`}
                  >
                    5 KM
                  </button>
                  <button 
                    onClick={() => setRadiusKm(10.0)}
                    className={`px-2.5 py-1 rounded text-xs font-bold ${radiusKm === 10.0 ? 'bg-[#4a4238] text-white' : 'text-[#665d52] hover:text-black'}`}
                  >
                    10 KM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Exploration Grid & Integrated Dossier / Drawer Section */}
      <section className="w-full bg-[#f5f3ef] py-10 sm:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-margin-desktop">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Listing of Verified Kitchens (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between pb-2">
                <span className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold tracking-wider">
                  MATCHING GEO-VERIFIED KITCHENS ({providers.length} WITHIN {radiusKm} KM)
                </span>
                <span className="font-label-caps text-[11px] text-[#665d52] uppercase">
                  Live MongoDB Data
                </span>
              </div>

              {loading ? (
                <div className="py-24 text-center space-y-3 bg-[#fbf9f5] rounded-2xl border border-[#ded9d1]/50">
                  <div className="w-8 h-8 border-3 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-label-caps text-xs uppercase text-[#665d52] tracking-wider">Finding audited home kitchens nearby...</p>
                </div>
              ) : providers.length === 0 ? (
                <div className="p-12 text-center bg-[#fbf9f5] rounded-2xl border border-[#ded9d1]/60 space-y-4">
                  <span className="material-symbols-outlined text-4xl text-[#665d52]">restaurant</span>
                  <h3 className="text-xl font-bold text-[#1a1a1a]">No Kitchens in {radiusKm} KM Strict Radius</h3>
                  <p className="text-sm text-[#665d52] max-w-md mx-auto">
                    Try expanding your search radius to 10 KM or adjusting dietary filters to explore nearby Ahmedabad kitchens.
                  </p>
                  <button 
                    onClick={() => { setRadiusKm(10.0); setDietary('all'); setPriceRange('all'); }}
                    className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-[#f5f3ef] font-button-text text-xs uppercase tracking-wider font-bold hover:bg-[#4a4238] transition-all cursor-pointer"
                  >
                    Expand to 10 KM &amp; Show All
                  </button>
                </div>
              ) : (
                providers.map((prov) => {
                  const isSelected = selectedProvider?._id === prov._id;
                  const provImg = prov.image && prov.image.startsWith('http') ? prov.image : '/assets/provider_1.png';
                  
                  return (
                    <div 
                      key={prov._id}
                      onClick={() => loadProviderDossier(prov)}
                      className={`bg-[#fbf9f5] rounded-2xl p-5 sm:p-6 transition-all duration-300 relative cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-[#1a1a1a] shadow-lg scale-[1.01]' 
                          : 'hover:shadow-md border border-[#ded9d1]/60 hover:border-[#1a1a1a]/40'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 right-6 bg-[#1a1a1a] text-[#f5f3ef] px-3 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold tracking-wider shadow">
                          Selected Atelier
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                        {/* Thumbnail */}
                        <div className="w-full sm:w-44 h-44 rounded-xl bg-[#e4e2de] overflow-hidden flex-shrink-0 relative">
                          <img 
                            className="w-full h-full object-cover" 
                            src={provImg}
                            alt={prov.name}
                          />
                          <div className="absolute bottom-2 left-2 bg-[#1a1a1a]/85 backdrop-blur-sm text-[#f5f3ef] font-label-caps text-[9px] px-2 py-0.5 rounded uppercase font-semibold">
                            FSSAI #{prov.fssaiNumber || '10721026000412'}
                          </div>
                        </div>

                        {/* Information Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl text-[#1a1a1a] leading-tight font-medium">
                                {prov.name}
                              </h3>
                              <p className="font-body-md text-xs sm:text-sm text-[#665d52]">
                                {prov.description || 'Traditional homestyle meals prepared daily with pure ghee'}
                              </p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <span className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">₹{prov.price || 120}</span>
                              <span className="font-label-caps text-[10px] text-[#665d52] block uppercase font-medium">/ base meal</span>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(prov.tags || ['Pure Veg']).map((tag, idx) => (
                              <span key={idx} className="bg-[#f5f3ef] text-[#1a1a1a] px-2 py-0.5 rounded text-[11px] font-label-caps uppercase font-bold border border-[#ded9d1]/40">
                                {tag}
                              </span>
                            ))}
                            <span className="bg-[#f5f3ef] text-[#1a1a1a] px-2 py-0.5 rounded text-[11px] font-label-caps uppercase border border-[#ded9d1]/40">
                              304-SS Insulated Pack
                            </span>
                            <span className="bg-[#e8f5e9] text-[#1b5e20] px-2 py-0.5 rounded text-[11px] font-label-caps uppercase font-bold">
                              ★ {prov.rating || 4.8} ({prov.reviewCount || 340}+ Reviews)
                            </span>
                          </div>

                          {/* Distance, Time & Realtime Slot Counter */}
                          <div className="pt-2 border-t border-[#ded9d1]/50 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-4 text-[#665d52] font-label-caps text-[11px]">
                              <span className="flex items-center gap-1 font-semibold text-[#1a1a1a]">
                                <span className="material-symbols-outlined text-[15px] text-[#4a4238]">near_me</span> {prov.distanceKm || '1.8'} KM ({prov.address?.locality || 'Satellite'})
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px]">timelapse</span> {prov.eta || '25–35 MIN'}
                              </span>
                            </div>
                            <span className="font-label-caps text-[11px] text-[#1b5e20] font-bold uppercase">
                              🟢 {prov.availableSlots || 28} Lunch Slots Available Today
                            </span>
                          </div>

                          {/* Action Strip */}
                          <div className="pt-1 flex items-center justify-between">
                            <div className="text-[12px] text-[#665d52] font-body-md truncate max-w-[280px]">
                              <span>Specialty: </span>
                              <span className="text-[#1a1a1a] font-medium">{(prov.categories || ['Gujarati Thali']).join(' • ')}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetTiffin = prov.tiffins?.[0] || {
                                  name: `${prov.name} Special Thali`,
                                  price: prov.price || 130,
                                  category: prov.categories?.[0] || 'Gujarati'
                                };
                                setCustomizingTiffin({ provider: prov, tiffin: targetTiffin });
                              }}
                              className={`px-4 py-2 rounded-xl font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected 
                                  ? 'bg-[#1a1a1a] text-[#f5f3ef]' 
                                  : 'bg-[#f5f3ef] text-[#1a1a1a] hover:bg-[#ded9d1]'
                              }`}
                            >
                              <span>Customize Thali</span>
                              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Corridor Filter Exclusion Notice */}
              <div className="p-4 bg-[#ded9d1]/40 rounded-2xl flex items-center justify-between text-[#665d52]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#4a4238] text-[20px]">info</span>
                  <p className="font-body-md text-xs sm:text-[13px] leading-snug">
                    Showing {providers.length} kitchens within strict {radiusKm} KM corridor. Out-of-zone kitchens are hidden to ensure food arrives above 65°C.
                  </p>
                </div>
                {radiusKm === 5.0 && (
                  <button 
                    onClick={() => setRadiusKm(10.0)}
                    className="font-label-caps text-xs uppercase text-[#1a1a1a] font-bold underline hover:no-underline whitespace-nowrap ml-4 cursor-pointer"
                  >
                    Expand to 10 KM
                  </button>
                )}
              </div>
            </div>

            {/* Right: Interactive Meal Customization & Provider Dossier Drawer (5 Columns Sticky) */}
            <div ref={dossierRef} className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              {selectedProvider ? (
                <div className="bg-[#fbf9f5] rounded-3xl p-6 sm:p-7 shadow-xl border-t-4 border-[#1a1a1a] space-y-6 border border-[#ded9d1]/60">
                  {/* Dossier Header */}
                  <div className="space-y-3 pb-5 border-b border-[#ded9d1]">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-xs uppercase text-[#4a4238] font-bold tracking-wider">
                        PROVIDER DOSSIER &amp; CUSTOMIZER
                      </span>
                      <span className="bg-[#1b5e20] text-[#f5f3ef] font-label-caps text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold">
                        Verified Kitchen
                      </span>
                    </div>

                    <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] font-medium leading-none">
                      {selectedProvider.name}
                    </h2>

                    <div className="space-y-1.5 font-body-md text-[13px] text-[#665d52]">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#4a4238]">pin_drop</span>
                        <span>{selectedProvider.address?.street || 'Satellite Road'}, {selectedProvider.address?.locality || 'Satellite'}, Ahmedabad</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#4a4238]">support_agent</span>
                        <span>Dispatch Hotline: <strong className="font-mono text-[#1a1a1a]">{selectedProvider.mobile || '+91 98765 43210'}</strong></span>
                      </p>
                      <div className="flex items-center gap-4 pt-1 text-[12px] font-semibold text-[#1a1a1a]">
                        <span className="flex items-center gap-1 text-[#1b5e20]">✓ Contactless Canister Handover</span>
                        <span className="flex items-center gap-1">✓ FSSAI Verified</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomizingTiffin({
                          provider: selectedProvider,
                          tiffin: selectedTiffin || selectedProvider.tiffins?.[0] || {
                            name: `${selectedProvider.name} Special Thali`,
                            price: selectedProvider.price || 130,
                            category: selectedCategory || 'Gujarati'
                          }
                        });
                      }}
                      className="w-full py-3 bg-[#1a1a1a] hover:bg-[#4a4238] text-white rounded-xl font-button-text text-xs uppercase tracking-wider font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                      <span>Open Full Customizer Studio</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>

                  {/* 1. Cuisine Category Selector Tabs (Provider Specific!) */}
                  <div className="space-y-2">
                    <span className="font-label-caps text-xs uppercase text-[#665d52] block font-semibold">
                      1. Select Meal Style (Provider Categories)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(selectedProvider.categories || ['Gujarati Thali']).map((cat) => {
                        const isCatSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                              isCatSelected 
                                ? 'bg-[#1a1a1a] text-[#f5f3ef] border-[#1a1a1a] shadow' 
                                : 'bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#1a1a1a] border-[#ded9d1]/60'
                            }`}
                          >
                            <span className="font-button-text text-xs block font-bold leading-tight truncate">{cat}</span>
                            <span className={`font-mono text-[10px] ${isCatSelected ? 'opacity-80' : 'text-[#665d52]'}`}>
                              ₹{basePrice} base
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Meal Customization Module */}
                  <div className="space-y-4 bg-[#f5f3ef]/80 p-4 rounded-2xl border border-[#ded9d1]/50">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-xs uppercase text-[#665d52] font-semibold">
                        2. Thali Composition &amp; Portions
                      </span>
                      <span className="font-label-caps text-[10px] text-[#4a4238] font-bold uppercase bg-[#ded9d1]/50 px-2 py-0.5 rounded">
                        Fixed Base Included
                      </span>
                    </div>

                    {/* Fixed Included Items Preview */}
                    <p className="text-[12px] text-[#665d52] font-body-md bg-[#fbf9f5] p-2.5 rounded-xl border border-[#ded9d1]/40 leading-relaxed">
                      <strong className="text-[#1a1a1a]">Standard Package:</strong> Gujarati Dal (Sweet &amp; Sour), Steamed Jeera Basmati Rice, Kacha Keri Salad, Mango Mustard Chutney.
                    </p>

                    {/* Choice of Shaak (Daily Sabzi) */}
                    <div className="space-y-2">
                      <label className="font-label-caps text-xs uppercase text-[#1a1a1a] flex items-center justify-between font-bold">
                        <span>Choice of Today's Shaak (Select 1)</span>
                        <span className="text-[#665d52] font-normal lowercase">required</span>
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Bhindi Sambhariya (Stuffed Okra)', tag: 'Chef Signature', color: '#1b5e20' },
                          { label: 'Sev Tameta Nu Shaak (Tangy Kathiyawadi)', tag: 'Classic', color: '#665d52' },
                          { label: 'Aloo Palak Desi Gravy', tag: 'Mild', color: '#665d52' }
                        ].map(s => (
                          <label 
                            key={s.label}
                            onClick={() => setSelectedShaak(s.label)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors border ${
                              selectedShaak === s.label ? 'bg-[#fbf9f5] border-[#1a1a1a] shadow-2xs' : 'bg-[#fbf9f5] border-transparent hover:bg-[#ded9d1]/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input 
                                type="radio" 
                                name="shaak" 
                                checked={selectedShaak === s.label}
                                onChange={() => setSelectedShaak(s.label)}
                                className="accent-[#1a1a1a] w-4 h-4 cursor-pointer"
                              />
                              <span className="font-body-md text-xs sm:text-[13px] text-[#1a1a1a] font-medium">{s.label}</span>
                            </div>
                            <span className="font-label-caps text-[9px] uppercase font-bold" style={{ color: s.color }}>{s.tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Phulka Rotli Adjuster */}
                    <div className="flex items-center justify-between py-2.5 border-y border-[#ded9d1]">
                      <div>
                        <span className="font-body-md text-[13px] text-[#1a1a1a] block font-bold">Warm Phulka Rotli Count</span>
                        <span className="text-[11px] text-[#665d52]">Pure whole wheat cooked in desi cow ghee</span>
                      </div>
                      <div className="flex items-center gap-3 bg-[#fbf9f5] px-3 py-1 rounded-xl border border-[#ded9d1]/60">
                        <button 
                          onClick={() => setRotliCount(prev => Math.max(2, prev - 1))}
                          className="text-[#1a1a1a] hover:text-[#665d52] font-bold text-base px-1 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm font-bold text-[#1a1a1a]">{rotliCount}</span>
                        <button 
                          onClick={() => setRotliCount(prev => Math.min(8, prev + 1))}
                          className="text-[#1a1a1a] hover:text-[#665d52] font-bold text-base px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add-ons & Extras */}
                    <div className="space-y-2">
                      <span className="font-label-caps text-xs uppercase text-[#1a1a1a] block font-bold">
                        3. Artisanal Add-ons
                      </span>
                      <div className="space-y-1.5">
                        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#fbf9f5] cursor-pointer hover:bg-[#ded9d1]/30 transition-colors border border-[#ded9d1]/40">
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              checked={extras.chaas} 
                              onChange={(e) => setExtras({ ...extras, chaas: e.target.checked })}
                              className="accent-[#1a1a1a] rounded w-4 h-4 cursor-pointer"
                            />
                            <span className="font-body-md text-xs text-[#1a1a1a] font-medium">Fresh Masala Chaas (250ml Clay Pot)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#1a1a1a]">+₹15</span>
                        </label>
                        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#fbf9f5] cursor-pointer hover:bg-[#ded9d1]/30 transition-colors border border-[#ded9d1]/40">
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              checked={extras.sweet} 
                              onChange={(e) => setExtras({ ...extras, sweet: e.target.checked })}
                              className="accent-[#1a1a1a] rounded w-4 h-4 cursor-pointer"
                            />
                            <span className="font-body-md text-xs text-[#1a1a1a] font-medium">Elaichi Kesar Shrikhand (100g Cup)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#1a1a1a]">+₹20</span>
                        </label>
                        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#fbf9f5] cursor-pointer hover:bg-[#ded9d1]/30 transition-colors border border-[#ded9d1]/40">
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              checked={extras.extraRotli} 
                              onChange={(e) => setExtras({ ...extras, extraRotli: e.target.checked })}
                              className="accent-[#1a1a1a] rounded w-4 h-4 cursor-pointer"
                            />
                            <span className="font-body-md text-xs text-[#1a1a1a] font-medium">Extra Rotli Pair (+2 Pieces)</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#1a1a1a]">+₹10</span>
                        </label>
                      </div>
                    </div>

                    {/* Kitchen Note Input */}
                    <div className="space-y-1">
                      <label className="font-label-caps text-xs uppercase text-[#665d52] block font-semibold">
                        Customization Instructions
                      </label>
                      <input 
                        type="text" 
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g. Mild dal, no ghee on rotlis..."
                        className="w-full bg-[#fbf9f5] px-3 py-2 text-xs font-body-md text-[#1a1a1a] rounded-xl border border-[#ded9d1] focus:outline-none focus:border-[#1a1a1a]"
                      />
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-label-caps text-xs uppercase text-[#665d52] font-semibold">Tiffin Quantity</span>
                      <div className="flex items-center gap-3 bg-[#fbf9f5] px-3 py-1 rounded-xl border border-[#ded9d1]/60">
                        <button 
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="text-[#1a1a1a] hover:text-[#665d52] font-bold text-base px-1 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-mono text-sm font-bold text-[#1a1a1a]">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(prev => Math.min(10, prev + 1))}
                          className="text-[#1a1a1a] hover:text-[#665d52] font-bold text-base px-1 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price Computation Architecture */}
                  <div className="space-y-2 pt-2 border-t border-[#ded9d1] font-body-md text-xs sm:text-[13px]">
                    <div className="flex justify-between text-[#665d52]">
                      <span>{selectedCategory} Base ({quantity}x)</span>
                      <span className="font-mono font-semibold text-[#1a1a1a]">₹{(basePrice * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#665d52]">
                      <span>Add-ons Total</span>
                      <span className="font-mono font-semibold text-[#1a1a1a]">₹{(extrasTotal * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#665d52]">
                      <span>Thermal Delivery &amp; Corridor Escrow</span>
                      <span className="font-mono font-semibold text-[#1a1a1a]">₹{deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-[#1a1a1a] pt-3 border-t border-[#ded9d1]">
                      <span>Final Payable</span>
                      <span className="font-mono text-2xl text-[#1a1a1a]">₹{finalPayable.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button 
                      onClick={handleAddToCart}
                      className="bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#1a1a1a] py-3.5 rounded-xl font-button-text text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#ded9d1]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {cartFeedback ? 'check_circle' : 'shopping_bag'}
                      </span>
                      <span>{cartFeedback ? 'Added to Bag!' : `Add to Cart (₹${finalPayable})`}</span>
                    </button>

                    <button 
                      onClick={() => setIsCheckoutOpen(true)}
                      className="bg-[#1a1a1a] hover:bg-[#4a4238] text-[#f5f3ef] py-3.5 rounded-xl font-button-text text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
                    >
                      <span>Quick Checkout →</span>
                    </button>
                  </div>

                  {/* Security & Guarantee Footnote */}
                  <p className="text-center font-label-caps text-[10px] text-[#665d52] uppercase tracking-widest">
                    🔒 TiffinLink Escrow: Provider paid upon 4-Digit OTP handover.
                  </p>
                </div>
              ) : (
                <div className="p-8 bg-[#fbf9f5] rounded-3xl border border-[#ded9d1] text-center text-[#665d52]">
                  <p className="text-sm">Select any kitchen on the left to customize your meal thali.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Ecosystem Lifecycle & Live Telemetry Ribbon */}
      <section className="w-full bg-[#1a1a1a] text-[#f5f3ef] py-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-margin-desktop space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800">
            <div className="space-y-2">
              <span className="font-label-caps text-xs uppercase text-[#4ade80] tracking-widest font-bold block">
                HYPERLOCAL OPERATIONAL INTEGRITY
              </span>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-4xl text-[#f5f3ef] font-medium">
                Order Lifecycle Protocol: Satellite &amp; Vastrapur Zone
              </h2>
            </div>
            {placedOrder && (
              <button 
                onClick={() => {}}
                className="bg-[#f5f3ef] text-[#1a1a1a] px-6 py-3 rounded-xl font-button-text text-xs uppercase tracking-wider font-bold hover:bg-[#ded9d1] transition-all inline-flex items-center gap-2 whitespace-nowrap self-start md:self-auto cursor-pointer"
              >
                <span>Track Active Order #{placedOrder.orderId}</span>
                <span className="material-symbols-outlined text-[16px]">navigation</span>
              </button>
            )}
          </div>

          {/* Lifecycle Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { stage: 'STAGE 01', icon: 'touch_app', title: 'Placement', desc: 'Order locked via UPI/COD Escrow. Instant culinary dispatch ping emitted to kitchen dashboard.' },
              { stage: 'STAGE 02', icon: 'done_all', title: '3-Min Acceptance', desc: `${selectedProvider?.name || "Mom's Kitchen"} acknowledges. Fresh ingredients chopped; rotlis cooked on direct flame.` },
              { stage: 'STAGE 03', icon: 'lock_clock', title: 'Thermal Seal (68°C)', desc: 'Stacked into 304 food-grade stainless steel canisters with vacuum silicone safety gasket.' },
              { stage: 'STAGE 04', icon: 'moped', title: 'Atomic Courier', desc: 'Assigned to nearest verified driver with real-time GPS telemetry and insulated thermal bag.' },
              { stage: 'STAGE 05', icon: 'key', title: '4-Digit Handover', desc: 'Customer reveals OTP upon door delivery. Escrow settles payment automatically.' }
            ].map(step => (
              <div key={step.stage} className="space-y-3 bg-stone-900/80 p-5 rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#4ade80] font-bold">{step.stage}</span>
                  <span className="material-symbols-outlined text-[20px] text-[#665d52]">{step.icon}</span>
                </div>
                <h4 className="font-button-text text-sm text-[#f5f3ef] uppercase font-bold">{step.title}</h4>
                <p className="font-body-md text-xs text-stone-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fbf9f5] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#ded9d1] space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ded9d1]">
              <div>
                <span className="font-label-caps text-[10px] text-[#4a4238] uppercase font-bold tracking-wider">Fast Checkout</span>
                <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl font-bold text-[#1a1a1a]">Confirm Your Tiffin Order</h3>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f5f3ef] flex items-center justify-center text-[#665d52] hover:text-[#1a1a1a] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="p-3 bg-[#f5f3ef] rounded-xl border border-[#ded9d1]/60 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-[#1a1a1a]">
                  <span>{selectedProvider?.name}</span>
                  <span>{quantity}x {selectedCategory}</span>
                </div>
                <div className="text-[#665d52]">Shaak: {selectedShaak} • {rotliCount} Rotlis</div>
                <div className="flex justify-between text-[#1a1a1a] pt-1 border-t border-[#ded9d1]/50 font-bold">
                  <span>Grand Total:</span>
                  <span className="text-sm font-mono text-[#1b5e20]">₹{finalPayable.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-label-caps uppercase text-[#665d52] font-semibold block mb-1">Your Full Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Rahul Patel"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#f5f3ef] px-3.5 py-2.5 rounded-xl border border-[#ded9d1] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="font-label-caps uppercase text-[#665d52] font-semibold block mb-1">Contact Phone Number</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#f5f3ef] px-3.5 py-2.5 rounded-xl border border-[#ded9d1] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="font-label-caps uppercase text-[#665d52] font-semibold block mb-1">Delivery Address</label>
                  <textarea 
                    required
                    rows="2"
                    placeholder="Flat/House No, Street, Society, Landmark..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-[#f5f3ef] px-3.5 py-2.5 rounded-xl border border-[#ded9d1] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="font-label-caps uppercase text-[#665d52] font-semibold block mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethod('Online Payment')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === 'Online Payment' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-[#f5f3ef] text-[#1a1a1a] border-[#ded9d1]'
                      }`}
                    >
                      💳 Online / UPI
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethod('Cash on Delivery')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === 'Cash on Delivery' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-[#f5f3ef] text-[#1a1a1a] border-[#ded9d1]'
                      }`}
                    >
                      💵 Cash on Delivery
                    </button>
                  </div>
                </div>
              </div>

                {/* Authentication Notice Pill */}
                <div className="p-3 bg-[#f5f3ef] rounded-xl border border-[#ded9d1]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{currentUser ? '🟢' : '🔒'}</span>
                    <div>
                      <span className="font-bold text-[#1a1a1a] block">
                        {currentUser ? `Ordering as ${currentUser.name || currentUser.email.split('@')[0]}` : 'Guest Checkout'}
                      </span>
                      <span className="text-[#665d52] text-[11px]">
                        {currentUser ? 'Verified account authenticated' : 'Login will be requested before order is created'}
                      </span>
                    </div>
                  </div>
                  {!currentUser && (
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Login Required on Confirm
                    </span>
                  )}
                </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#1a1a1a] hover:bg-[#4a4238] text-[#f5f3ef] font-button-text text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md active:scale-98"
                >
                  {orderSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Order in MongoDB...</span>
                    </>
                  ) : (
                    <span>Confirm Order (₹{finalPayable})</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Required Modal (Prevents order creation before authentication) */}
      <LoginRequiredModal 
        isOpen={isLoginRequiredOpen && !isAuthenticated}
        onClose={() => setIsLoginRequiredOpen(false)}
        onOpenLogin={() => {
          setIsLoginRequiredOpen(false);
          if (onOpenLogin) onOpenLogin('login');
        }}
        onOpenSignup={() => {
          setIsLoginRequiredOpen(false);
          if (onOpenLogin) onOpenLogin('signup');
        }}
        orderDetails={{
          providerName: selectedProvider?.name || cart.provider?.name,
          totalAmount: finalPayable || cart.totalAmount || 0,
          itemCount: quantity || (cart.items && cart.items.length) || 1
        }}
      />

      {/* Provider Collision Modal (Single Provider Rule) */}
      <ProviderConflictModal 
        conflict={providerConflict}
        onResolve={resolveProviderConflict}
      />

      {/* Order Confirmation & Tracking Screen */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#fbf9f5] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#ded9d1] space-y-6 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-full bg-[#e8f5e9] text-[#1b5e20] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div className="space-y-1">
              <span className="font-label-caps text-xs text-[#1b5e20] uppercase font-bold tracking-widest">Order Confirmed</span>
              <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl font-bold text-[#1a1a1a]">Order #{placedOrder.orderId}</h3>
              <p className="text-xs text-[#665d52]">Saved to database &amp; dispatched to {selectedProvider?.name}</p>
            </div>

            <div className="p-4 bg-[#f5f3ef] rounded-2xl border border-[#ded9d1]/60 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#1a1a1a]">
                <span>Kitchen Provider:</span>
                <span>{selectedProvider?.name}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Meal Selected:</span>
                <span className="font-semibold text-[#1a1a1a]">{placedOrder.quantity}x {placedOrder.tiffinName}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Delivery To:</span>
                <span className="text-right truncate max-w-[240px] text-[#1a1a1a]">{placedOrder.customerAddress}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Corridor Delivery Charge:</span>
                <span className="font-mono text-[#1a1a1a]">₹{placedOrder.deliveryFee || 20}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Payment Status:</span>
                <span className="font-semibold text-emerald-800">{placedOrder.paymentStatus || 'Paid'}</span>
              </div>
              <div className="flex justify-between text-[#665d52]">
                <span>Estimated Delivery:</span>
                <span className="font-semibold text-[#1a1a1a]">25 - 35 mins</span>
              </div>
              <div className="flex justify-between text-[#665d52] pt-1">
                <span>Delivery OTP for Handover:</span>
                <span className="font-mono font-bold text-sm text-[#1b5e20] bg-[#e8f5e9] px-2 py-0.5 rounded">8429</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1a1a1a] pt-2 border-t border-[#ded9d1]">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-base text-[#1b5e20]">₹{placedOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button 
                onClick={() => {
                  setPlacedOrder(null);
                  if (onNavigate) onNavigate('#orders');
                  else window.location.hash = '#orders';
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#4a4238] text-[#f5f3ef] font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Go to My Orders</span>
                <span>➔</span>
              </button>
              <button 
                onClick={() => setPlacedOrder(null)}
                className="py-3 px-5 rounded-xl bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#1a1a1a] font-button-text text-xs uppercase tracking-wider font-bold transition-all cursor-pointer border border-[#ded9d1]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
