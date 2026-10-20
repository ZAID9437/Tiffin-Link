import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import TiffinCustomizer from './TiffinCustomizer';
import ProviderDossier from './ProviderDossier';
import { getSocket } from '../services/socket';
import NutritionDietitianModal from '../components/NutritionDietitianModal';
import CorporateBulkModal from '../components/CorporateBulkModal';
import KitchenCamAuditModal from '../components/KitchenCamAuditModal';
import CommunityRecipeModal from '../components/CommunityRecipeModal';
import TasteGuaranteeModal from '../components/TasteGuaranteeModal';
import MealSwapModal from '../components/MealSwapModal';
import DabbaDepositModal from '../components/DabbaDepositModal';
import EmergencyMealModal from '../components/EmergencyMealModal';
import AuctionAndMatchingModal from '../components/AuctionAndMatchingModal';
import HostelBulkPoolModal from '../components/HostelBulkPoolModal';
import HyperlocalBroadcastBanner from '../components/HyperlocalBroadcastBanner';
import { 
  Zap, 
  Scale, 
  Building2, 
  Users, 
  ChefHat, 
  HeartPulse, 
  Package, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';


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
  'vatva': { lat: 22.9584, lng: 72.6346, name: 'Vatva, Ahmedabad' },
  'narol': { lat: 22.9734, lng: 72.5935, name: 'Narol, Ahmedabad' },
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

const getProviderHighlightQuote = (prov) => {
  if (!prov) return { icon: '✨', text: 'Fresh Daily Homestyle Batch' };

  // 1. Explicit provider offer, promo or tagline if defined
  if (prov.offer && typeof prov.offer === 'string' && prov.offer.trim()) {
    return { icon: '🏷️', text: prov.offer.trim() };
  }
  if (prov.tagline && typeof prov.tagline === 'string' && prov.tagline.trim()) {
    return { icon: '✨', text: prov.tagline.trim() };
  }

  // 2. Derive dynamically from kitchen's real attributes in MongoDB
  const tags = (prov.tags || []).map(t => String(t || '').trim());
  const cuisines = String(prov.cuisines || '').toLowerCase();
  const desc = String(prov.description || '').toLowerCase();
  const categories = (prov.categories || []).map(c => String(c || '').toLowerCase());
  const tiffinNames = (prov.tiffins || []).map(t => String(t.name || '').toLowerCase()).join(' ');
  const combined = `${tags.join(' ')} ${cuisines} ${desc} ${categories.join(' ')} ${tiffinNames}`.toLowerCase();

  // Jain / Satvik / Swaminarayan
  if (combined.includes('satvik') || combined.includes('jain') || combined.includes('no onion') || combined.includes('without onion')) {
    return { icon: '🏷️', text: '100% Satvik Jain Available' };
  }
  if (combined.includes('swaminarayan')) {
    return { icon: '🏷️', text: 'Pure Swaminarayan Option' };
  }

  // Desi Ghee / Kathiyawadi
  if (combined.includes('desi ghee') || combined.includes('pure ghee') || combined.includes('ghee')) {
    if (combined.includes('kathiyawadi')) {
      return { icon: '✨', text: 'Pure Desi Ghee Kathiyawadi' };
    }
    return { icon: '✨', text: 'Cooked in Pure Desi Ghee' };
  }
  if (combined.includes('kathiyawadi')) {
    return { icon: '✨', text: 'Authentic Kathiyawadi Taste' };
  }

  // Gujarati & Punjabi
  if ((combined.includes('gujarati') && combined.includes('panjabi')) || (combined.includes('gujarati') && combined.includes('punjabi'))) {
    return { icon: '✨', text: 'Fresh Gujarati & Punjabi Meals' };
  }
  if (combined.includes('gujarati')) {
    return { icon: '✨', text: 'Traditional Gujarati Thali' };
  }
  if (combined.includes('punjabi') || combined.includes('panjabi')) {
    return { icon: '✨', text: 'Authentic Punjabi Desi Style' };
  }
  if (combined.includes('healthy') || combined.includes('diet') || combined.includes('protein')) {
    return { icon: '🌱', text: 'Healthy Balanced Home Diet' };
  }
  if (combined.includes('chinese')) {
    return { icon: '⚡', text: 'Homestyle Desi Chinese & Meals' };
  }
  if (combined.includes('pure veg') || tags.some(t => t.toLowerCase() === 'pure veg')) {
    return { icon: '🌱', text: '100% Pure Veg Home Kitchen' };
  }
  if (combined.includes('non-veg') || tags.some(t => t.toLowerCase().includes('non-veg'))) {
    return { icon: '🍗', text: 'Fresh Veg & Non-Veg Homestyle' };
  }

  // Top Rated Badge
  if (prov.rating && prov.rating >= 4.7) {
    return { icon: '⭐', text: `Top Rated • ${prov.rating}★ Kitchen` };
  }

  // Same Day Delivery
  if (prov.sameDayDelivery) {
    return { icon: '⚡', text: 'Express Lunch Dispatch' };
  }

  // Specific clean tag if available
  const validTag = tags.find(t => t && !t.toLowerCase().includes('http') && t.length < 30 && t.toLowerCase() !== 'indian');
  if (validTag) {
    return { icon: '✨', text: `${validTag} Special` };
  }

  if (combined.includes('indian')) {
    return { icon: '✨', text: 'Authentic Indian Homestyle Batch' };
  }

  return { icon: '✨', text: 'Fresh Daily Homestyle Batch' };
};

export default function NearbyTiffinServices({ onNavigate, initialFilters = {}, onOpenLogin }) {
  const { currentUser } = useAuth();
  // Centralized real-time location context
  const { location, isRecalibrating, recalibrateToast, recalibrate, setCustomLocation } = useLocation();

  // Navigation View: 'listing' | 'dossier' | 'customizer'
  const [activeView, setActiveView] = useState('listing');
  const [selectedDossierProvider, setSelectedDossierProvider] = useState(null);
  const [selectedCustomizerTiffin, setSelectedCustomizerTiffin] = useState(null);

  // Advanced Feature Modals State
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isCorporateModalOpen, setIsCorporateModalOpen] = useState(false);
  const [isKitchenCamModalOpen, setIsKitchenCamModalOpen] = useState(false);
  const [isCommunityRecipeModalOpen, setIsCommunityRecipeModalOpen] = useState(false);
  const [isTasteGuaranteeModalOpen, setIsTasteGuaranteeModalOpen] = useState(false);
  const [isMealSwapModalOpen, setIsMealSwapModalOpen] = useState(false);
  const [isDabbaDepositModalOpen, setIsDabbaDepositModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [isHostelPoolModalOpen, setIsHostelPoolModalOpen] = useState(false);
  const [activeAuditKitchen, setActiveAuditKitchen] = useState('');
  const [activeAuctionRequest, setActiveAuctionRequest] = useState(null);


  // Search & Filter State (Screen 1 & 2)
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
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

  const { addToCart } = useCart();

  // Fetch Providers dynamically from MongoDB based on coordinates, radius, dietary, and live search
  const fetchProviders = async (overrideCoords = null, queryOverride = null) => {
    setLoading(true);
    try {
      const activeCoords = overrideCoords || coordinates;
      const activeSearch = queryOverride !== null ? queryOverride : searchQuery;
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

      if (activeSearch && activeSearch.trim()) {
        params.set('search', activeSearch.trim());
      }

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

  // Live dynamic real-time search debouncer: Hits MongoDB directly as the user types
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders(null, searchQuery.trim());
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Instant Swiggy/Zomato Filter Engine (Client-side instant responsiveness while fetching)
  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase().trim();
    return providers.filter(prov => {
      const name = (prov.name || '').toLowerCase();
      const bName = (prov.businessName || '').toLowerCase();
      const fName = (prov.fullName || '').toLowerCase();
      const loc = (prov.address?.locality || prov.address?.street || prov.address?.city || prov.address?.houseNo || '').toLowerCase();
      const desc = (prov.description || '').toLowerCase();
      const tags = (prov.tags || []).join(' ').toLowerCase();
      const cuisines = (prov.cuisines || '').toLowerCase();
      const cats = (prov.categories || []).join(' ').toLowerCase();
      const tiffins = (prov.tiffins || []).map(t => (t.name || '').toLowerCase()).join(' ');
      const tItems = (prov.tiffins || []).flatMap(t => t.items || []).join(' ').toLowerCase();
      const tDesc = (prov.tiffins || []).map(t => (t.description || '').toLowerCase()).join(' ');

      return (
        name.includes(q) ||
        bName.includes(q) ||
        fName.includes(q) ||
        loc.includes(q) ||
        desc.includes(q) ||
        tags.includes(q) ||
        cuisines.includes(q) ||
        cats.includes(q) ||
        tiffins.includes(q) ||
        tItems.includes(q) ||
        tDesc.includes(q)
      );
    });
  }, [providers, searchQuery]);

  const featuredProvider = useMemo(() => {
    if (filteredProviders.length === 0) return null;
    return filteredProviders.find(p => p.rating >= 4.8) || filteredProviders[0];
  }, [filteredProviders]);

  // Scroll to starting point cleanly on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [coordinates, radiusKm, mealType, budget, sortBy]);

  // Real-time live rating updates for all kitchen cards without page refresh
  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const handleRatingUpdated = (data) => {
      if (!data || !data.providerId) return;
      const targetId = String(data.providerId);
      const newRating = Number(data.rating);
      const newCount = Number(data.reviewCount || data.totalReviews || 0);

      setProviders(prevList => prevList.map(prov => {
        const provId = String(prov._id || prov.id || prov.providerId || '');
        if (provId === targetId) {
          return {
            ...prov,
            rating: !isNaN(newRating) ? newRating : prov.rating,
            reviewCount: newCount > 0 ? newCount : (prov.reviewCount || 0)
          };
        }
        return prov;
      }));
    };

    const handleNewReview = (data) => {
      if (!data) return;
      const targetId = String(data.providerId || data.review?.providerId || '');
      if (!targetId) return;

      const newRating = data.providerRating !== undefined ? Number(data.providerRating) : Number(data.rating);
      const newCount = data.providerReviewCount !== undefined ? Number(data.providerReviewCount) : null;

      setProviders(prevList => prevList.map(prov => {
        const provId = String(prov._id || prov.id || prov.providerId || '');
        if (provId === targetId) {
          return {
            ...prov,
            rating: !isNaN(newRating) && newRating > 0 ? newRating : prov.rating,
            reviewCount: newCount !== null ? newCount : ((prov.reviewCount || 0) + 1)
          };
        }
        return prov;
      }));
    };

    s.on('provider:rating:updated', handleRatingUpdated);
    s.on('review:new', handleNewReview);

    return () => {
      s.off('provider:rating:updated', handleRatingUpdated);
      s.off('review:new', handleNewReview);
    };
  }, []);

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

  // Reset scroll to top on mount and whenever sub-view transitions (listing <-> dossier <-> customizer)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [activeView]);

  // URL Hash Deep-Linking (e.g. #find-tiffin?provider=ID or #find-tiffin?tiffin=ID)
  useEffect(() => {
    const handleUrlHash = async () => {
      const hash = window.location.hash || '';
      if (hash.includes('tiffin=')) {
        if (!currentUser) {
          if (typeof onOpenLogin === 'function') {
            onOpenLogin('login');
          }
          if (hash.includes('provider=')) {
            const pId = hash.split('provider=')[1]?.split('&')[0];
            window.location.hash = `#find-tiffin?provider=${pId}`;
          } else {
            window.location.hash = '#find-tiffin';
          }
          return;
        }
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
            const uLat = coordinates?.lat || 23.0300;
            const uLng = coordinates?.lng || 72.5178;
            const res = await fetch(`http://localhost:5000/api/providers/${provId}?lat=${uLat}&lng=${uLng}`);
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
        customerCoordinates={coordinates}
        customerAddress={locationAddress}
        onOpenLogin={onOpenLogin}
        onBack={() => {
          setActiveView('listing');
          window.location.hash = '#find-tiffin';
        }}
        currentUser={currentUser}
        onSelectTiffin={(tif) => {
          if (!currentUser) {
            if (typeof onOpenLogin === 'function') {
              onOpenLogin('login');
            }
            return;
          }
          setSelectedCustomizerTiffin({ tiffin: tif, provider: selectedDossierProvider });
          setActiveView('customizer');
          window.location.hash = `#find-tiffin?provider=${selectedDossierProvider._id}&tiffin=${tif._id}`;
        }}
      />
    );
  }

  // VIEW 3: Provider Results Page (Screen 2)
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
    <div className="flex flex-col w-full bg-[#fbf9f5] min-h-screen text-[#1b1c1a] pt-[72px]">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          TOP STICKY FILTER ARCHITECTURE BAR (SCREEN 2)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#fbf9f5]/95 backdrop-blur-md sticky top-[72px] z-30 shadow-xs border-b border-[#ded9d1]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Left: Back Button & Essential Filter Meta */}
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('#home');
                else window.location.hash = '#home';
              }}
              className="inline-flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333] text-white px-3.5 py-1.5 rounded-lg transition-all group cursor-pointer shadow-xs font-bold text-xs uppercase tracking-wider shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px] transition-transform group-hover:-translate-x-1">arrow_back</span>
              <span>Back to Home</span>
            </button>

            <div className="h-4 w-px bg-[#ded9d1] hidden sm:block shrink-0"></div>

            <span className="font-label-caps text-xs uppercase text-[#4a4238] tracking-widest flex items-center gap-1.5 font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Active Filters
            </span>

            {/* Filter Chips with clean overflow management */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[#1b1c1a] shadow-xs border border-[#ded9d1] text-xs">
                <span className="material-symbols-outlined text-[14px] text-[#a0522d]">location_on</span>
                <span className="font-button-text font-semibold truncate max-w-[150px] sm:max-w-[200px]">{locationAddress}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[#1b1c1a] shadow-xs border border-[#ded9d1] text-xs">
                <span className="material-symbols-outlined text-[14px] text-emerald-700">eco</span>
                <span className="font-button-text font-semibold">{mealType}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[#1b1c1a] shadow-xs border border-[#ded9d1] text-xs">
                <span className="material-symbols-outlined text-[14px] text-[#4a4238]">schedule</span>
                <span className="font-button-text font-semibold">{timeSlot.split(' ')[0]}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[#1b1c1a] shadow-xs border border-[#ded9d1] text-xs">
                <span className="material-symbols-outlined text-[14px] text-emerald-800">payments</span>
                <span className="font-button-text font-semibold">≤ ₹{budget}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[#1b1c1a] shadow-xs border border-[#ded9d1] text-xs hidden xl:inline-flex">
                <span className="material-symbols-outlined text-[14px] text-[#4a4238]">near_me</span>
                <span className="font-button-text font-semibold">{radiusKm} km</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg text-[#1b1c1a] shadow-xs border border-[#ded9d1] text-xs hidden xl:inline-flex">
                <span className="material-symbols-outlined text-[14px] text-[#4a4238]">two_wheeler</span>
                <span className="font-button-text font-semibold">{fulfillment}</span>
              </div>
            </div>
          </div>

          {/* Right: Edit Search Button */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-[#1a1a1a] hover:text-white text-[#1a1a1a] rounded-lg border border-[#ded9d1] font-button-text text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer font-bold shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>{isSearchFormOpen ? 'Close Filters' : 'Edit Search'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real-time Hyperlocal Broadcast Notifications (Feature 9) */}
      <HyperlocalBroadcastBanner />

      {/* Advanced Food Tech Innovations Quick Launch Bar - Artisanal Editorial Setup */}
      <section className="w-full bg-surface-container-low dark:bg-stone-900 border-b border-sand-neutral/80 dark:border-stone-800 py-3 px-4 sm:px-6 lg:px-20 overflow-x-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2.5 min-w-max text-xs">
          <span className="font-label-caps text-[10px] uppercase font-bold text-[#6B4B2B] dark:text-[#D4AF37] tracking-[0.2em] shrink-0 flex items-center gap-1.5 pr-2.5 border-r border-sand-neutral/80 dark:border-stone-800">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B4B2B] dark:bg-[#D4AF37] animate-pulse" />
            Marketplace Services:
          </span>

          <button
            type="button"
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <Zap className="w-3.5 h-3.5 text-[#C25E34] dark:text-[#E07A5F]" />
            <span>Emergency Meal Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuctionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <Scale className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Multi-Kitchen Auction</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCorporateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <Building2 className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Corporate Catering</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHostelPoolModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <Users className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Hostel / PG Bulk Pool</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCommunityRecipeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <ChefHat className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Community Chef Spotlight</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNutritionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <HeartPulse className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Dietitian &amp; Macros</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDabbaDepositModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <Package className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Eco-Dabba Deposit &amp; Return</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMealSwapModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>1-Click Meal Swap</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTasteGuaranteeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-lowest dark:bg-stone-800 hover:bg-surface-container text-onyx-black dark:text-stone-200 border border-sand-neutral/90 dark:border-stone-700 rounded-full font-label-caps text-[11px] font-semibold tracking-wider transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0 group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#6B4B2B] dark:text-[#D4AF37]" />
            <span>Taste Guarantee Claim</span>
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
                FIND YOUR PERFECT MEAL
              </span>
              <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl sm:text-4xl text-[#1a1a1a] font-medium tracking-tight">
                Design your dining experience
              </h2>
              <p className="text-sm text-[#665d52]">
                Fresh homestyle meals prepared daily by verified home kitchens in your neighborhood.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Form */}
              <div className="lg:col-span-8 bg-white p-6 sm:p-8 shadow-xs border border-[#ded9d1] relative">
                <form onSubmit={handleSearchSubmit} className="space-y-6">
                  {/* Field 1: Meal Type Selector */}
                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                      01 • Meal Preference
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
                        02 • Delivery Date
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
                        03 • Delivery Slot
                      </label>
                      <div className="flex items-center bg-[#fbf9f5] px-3.5 py-2.5 border border-[#ded9d1]">
                        <span className="material-symbols-outlined text-[#665d52] mr-2 text-[18px]">schedule</span>
                        <select
                          value={timeSlot}
                          onChange={(e) => setTimeSlot(e.target.value)}
                          className="w-full bg-transparent font-button-text text-xs text-[#1a1a1a] outline-none cursor-pointer"
                        >
                          <option value="01:00 PM - Lunch">01:00 PM — Lunch</option>
                          <option value="01:45 PM - Late Lunch">01:45 PM — Late Lunch</option>
                          <option value="07:30 PM - Dinner">07:30 PM — Dinner</option>
                          <option value="08:30 PM - Night Dinner">08:30 PM — Late Dinner</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Field 4: Fulfillment Method */}
                  <div className="space-y-2">
                    <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                      04 • Delivery or Pickup
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
                          <p className="text-[11px] text-[#665d52] mt-0.5">Delivered fresh and warm to your door within {radiusKm} km.</p>
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
                          <span className="font-button-text text-xs text-[#1a1a1a] font-semibold block">Self Pickup</span>
                          <p className="text-[11px] text-[#665d52] mt-0.5">Pick up your fresh meal directly from the home kitchen.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Field 5: Location */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label className="block font-label-caps text-xs uppercase tracking-wider text-[#1b1c1a] font-bold">
                        05 • Delivery Address
                      </label>
                      <span className="font-mono text-[10px] text-[#4a4238]">
                        {coordinates?.lat && coordinates?.lng
                          ? '📍 GPS Location Detected'
                          : '📍 Click DETECT GPS to locate'}
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
                        placeholder="Enter current address or click DETECT GPS"
                        className="w-full bg-transparent font-button-text text-xs text-[#1a1a1a] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isRecalibrating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#333333] active:scale-95 text-white font-label-caps text-[11px] uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-60 shrink-0 font-bold border border-black"
                        title="Detect GPS Location"
                      >
                        <span className={`material-symbols-outlined text-[15px] text-[#38bdf8] ${isRecalibrating ? 'animate-spin' : ''}`}>
                          {isRecalibrating ? 'sync' : 'my_location'}
                        </span>
                        <span className="text-white tracking-wider">{isRecalibrating ? 'DETECTING...' : 'DETECT GPS'}</span>
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
                          06 • Price Budget
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
                        <span>Standard ₹150</span>
                        <span>Feast ₹300</span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-[#fbf9f5] p-3.5 border border-[#ded9d1]">
                      <div className="flex justify-between items-baseline">
                        <label className="font-label-caps text-[11px] uppercase tracking-wider text-[#1b1c1a] font-bold">
                          07 • Delivery Radius
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
                        <span>5.0 km Nearby</span>
                        <span>7.5 km Medium</span>
                        <span>10.0 km Wide</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1a1a1a] text-white font-button-text text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-[#4a4238] transition-colors cursor-pointer font-bold rounded-xl"
                  >
                    <span>FIND MATCHING KITCHENS</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>
              </div>

              {/* Right: Delivery Coverage Map Card */}
              <div className="lg:col-span-4 bg-white p-6 shadow-xs border border-[#ded9d1] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-xs uppercase text-[#1a1a1a] tracking-wider font-bold">DELIVERY COVERAGE</span>
                  <span className="font-label-caps text-xs text-[#a0522d] font-bold">WITHIN {radiusKm} KM</span>
                </div>
                <div className="w-full h-48 bg-[#ded9d1] relative overflow-hidden flex items-end p-3 rounded-xl border border-[#ded9d1]">
                  <img 
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYJfOhWCYJaGO5pVRCFve6WoZZxEEY_pLdHkfGosN8bV9Dum0myPzUNbEeosxERSlnkXFD6QX9HPvpoQxOMP_l5kEHlaWGCPpfcISHGDnNK6EfcG5mDLYAjeKrAEkkvb7zbiziiK1WgP1y0BEEDK63TjkLaDWA3pobQIxYBo9wJPyEvAMS1qEx4Zp6Tr5dOrwOryeqsljfPHvYSTFA7BLAGrWAkAf2R_4o-3a4Ek6hQ89VZ5-6oLxO"
                    alt="Map"
                  />
                  <div className="absolute inset-0 bg-[#1a1a1a]/15"></div>
                  <div className="relative z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-[#1a1a1a] rounded-lg border border-[#ded9d1] shadow-xs">
                    📍 {locationAddress.split(',')[0]} & Surrounding Areas
                  </div>
                </div>
                <p className="text-xs text-[#665d52] leading-relaxed">
                  Home chefs prepare each meal fresh on order, packed in eco-friendly thermal containers to ensure authentic warmth and aroma.
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
              <span className="font-label-caps text-xs text-[#a0522d] uppercase tracking-wider font-bold">
                Fresh Tiffins
              </span>
              <span className="w-8 h-[1px] bg-[#ded9d1]"></span>
              <span className="font-label-caps text-xs text-[#665d52] uppercase font-semibold hidden sm:inline">
                Verified Kitchens Within {radiusKm} km
              </span>
            </div>
            <h1 style={{ fontFamily: "'EB Garamond', serif" }} className="text-4xl sm:text-5xl text-[#1a1a1a] tracking-tight font-normal">
              Home Kitchens in {locationAddress.split(',')[0] || 'Ahmedabad'}
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-[#665d52] max-w-xl leading-relaxed">
              Discover authentic home-cooked meals prepared fresh daily with pure ingredients and delivered warm to your doorstep.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#f5f3ef] px-6 py-4 border border-[#ded9d1] rounded-xl">
            <div>
              <span className="font-label-caps text-[10px] block text-[#4a4238] uppercase font-semibold">Delivery Time</span>
              <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] leading-tight font-semibold">
                ~25-35 mins
              </span>
            </div>
            <div className="w-[1px] h-9 bg-[#ded9d1]"></div>
            <div>
              <span className="font-label-caps text-[10px] block text-[#4a4238] uppercase font-semibold">Active Kitchens</span>
              <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl text-[#1a1a1a] leading-tight font-semibold">
                {filteredProviders.length} Available
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            SWIGGY / ZOMATO STYLE INSTANT SEARCH BAR
            ───────────────────────────────────────────────────────────────────────────── */}
        <div className="w-full space-y-2.5">
          <div className="relative flex items-center bg-white border-2 border-[#ded9d1] hover:border-[#1a1a1a] focus-within:border-[#1a1a1a] focus-within:shadow-md rounded-2xl transition-all duration-200 overflow-hidden px-4 py-3">
            <span className="material-symbols-outlined text-[#8c6239] text-[22px] mr-3 shrink-0">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your favourite kitchen, thali, or dish (e.g. the testing, Mansuri, Mom's, Kathiyawadi, Jain)..."
              className="w-full bg-transparent text-[#1a1a1a] placeholder-[#8c7a6b] text-sm font-medium outline-none"
            />
            {loading && (
              <span className="w-4 h-4 border-2 border-[#8c6239] border-t-transparent rounded-full animate-spin mr-2 shrink-0" title="Searching live..." />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full bg-[#f5f3ef] hover:bg-[#ded9d1] text-[#665d52] hover:text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer ml-1 shrink-0"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Search Chips & Search Status */}
          {searchQuery ? (
            <div className="flex items-center justify-between text-xs text-[#665d52] pt-0.5 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Found <strong>{filteredProviders.length}</strong> {filteredProviders.length === 1 ? 'kitchen' : 'kitchens'} matching "<strong>{searchQuery}</strong>"
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#a0522d] hover:underline font-semibold cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pt-0.5 pb-1 no-scrollbar text-xs">
              <span className="text-[#8c7a6b] font-medium text-[11px] shrink-0">Popular Searches:</span>
              {['the testing', 'Mansuri Kitchen', 'Mom\'s Kitchen', 'Kathiyawadi Thali', 'Jain Pure Veg', 'Gujarati Thali'].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearchQuery(chip)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer border ${
                    chip === 'the testing' 
                      ? 'bg-[#fcf8f2] border-[#a0522d]/60 text-[#a0522d] font-bold hover:bg-[#a0522d] hover:text-white' 
                      : 'bg-white hover:bg-[#1a1a1a] hover:text-white text-[#4a4238] border-[#ded9d1]'
                  }`}
                >
                  {chip === 'the testing' ? '✨ the testing' : chip}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zomato-Style Interactive Filter Chips Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setIsSearchFormOpen(!isSearchFormOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              isSearchFormOpen
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-sm'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a] hover:bg-[#fbf9f5]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Filters</span>
            {isSearchFormOpen && <span className="w-1.5 h-1.5 rounded-full bg-[#f6ad55]" />}
          </button>

          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'rating' ? 'distance' : 'rating')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              sortBy === 'rating'
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a]'
            }`}
          >
            <span>Rating: 4.5+</span>
            <span className="text-amber-500 text-[11px]">★</span>
          </button>

          <button
            type="button"
            onClick={() => setMealType(mealType === 'Veg Tiffin' ? 'All' : 'Veg Tiffin')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              mealType === 'Veg Tiffin'
                ? 'bg-[#1b5e20] text-white border-[#1b5e20]'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pure Veg</span>
          </button>

          <button
            type="button"
            onClick={() => setMealType(mealType === 'Jain Friendly' ? 'Veg Tiffin' : 'Jain Friendly')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              mealType === 'Jain Friendly'
                ? 'bg-[#0284c7] text-white border-[#0284c7]'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Jain Friendly</span>
          </button>

          <button
            type="button"
            onClick={() => setBudget(budget <= 150 ? 250 : 150)}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              budget <= 150
                ? 'bg-[#a0522d] text-white border-[#a0522d]'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a]'
            }`}
          >
            <span>Under ₹150</span>
          </button>

          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'distance' ? 'rating' : 'distance')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              sortBy === 'distance'
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">near_me</span>
            <span>Nearest</span>
          </button>

          <button
            type="button"
            onClick={() => setRadiusKm(radiusKm === 5.0 ? 10.0 : 5.0)}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all cursor-pointer ${
              radiusKm === 5.0
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#4a4238] border-[#ded9d1] hover:border-[#1a1a1a]'
            }`}
          >
            <span>Within 5 km</span>
          </button>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#c8e6c9] bg-[#f1f8f4] text-[#1b5e20] text-xs font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Open Now</span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3 bg-white border border-[#ded9d1]">
            <div className="w-8 h-8 border-3 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-label-caps text-xs uppercase text-[#665d52] font-semibold">
              Finding fresh home kitchens within {radiusKm} km...
            </p>
          </div>
        ) : providers.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-white border border-[#ded9d1] p-8">
            <span className="material-symbols-outlined text-5xl text-[#665d52]">storefront</span>
            <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a]">
              No Home Kitchens Found Within {radiusKm} KM
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
                SECTION 1: RECOMMENDED FOR YOU
                ───────────────────────────────────────────────────────────────────────────── */}
            {featuredProvider && (
              <section className="space-y-5">
                <div className="flex items-baseline justify-between">
                  <div className="space-y-1">
                    <span className="font-label-caps text-xs tracking-widest uppercase text-[#a0522d] block font-bold">
                      Chef's Special Recommendation
                    </span>
                    <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] font-medium">
                      Recommended For You
                    </h2>
                  </div>
                  <span className="font-label-caps text-xs uppercase text-[#665d52] hidden sm:inline">
                    Fresh Daily Homestyle Meal • {mealType} • {locationAddress.split(',')[0]}
                  </span>
                </div>

                {/* Hero Recommendation Feature Box */}
                <div className="bg-white shadow-xs border border-[#ded9d1] rounded-2xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden transition-all duration-300">
                  {/* Visual Presentation Left */}
                  <div className="lg:col-span-5 relative min-h-[340px] lg:min-h-full overflow-hidden bg-[#ded9d1]">
                    <img
                      className="w-full h-full object-cover"
                      src={featuredProvider.kitchenPhoto || featuredProvider.kitchenPhotos || featuredProvider.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiw6tDo_f_kjjAYJbR39UjbsjfiZLISgukNlT1NLBHi6J70rn0ejgipVric4kdY9aLpNEJMCdaVDiL8ZUhs2Pr3i82XS9JcfUcjDgDZsKMMdXcuPnaz-tc9K8m4GT_mWP4uXCToqmZ-cdSH4BbRHLvSLcscSQcf-bTi_8Ahcdj52ThYGMoKswqnaycYzc9phyP3adyOX_soeSnnwvIYuhZa0M7qQAON5joyoBaSK28KytaqIUDCJ7G'}
                      alt={featuredProvider.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span className="font-label-caps text-[10px] uppercase tracking-wider font-bold">
                          Hygiene Verified Kitchen
                        </span>
                      </div>
                      <span className="font-label-caps text-[10px] bg-[#1a1a1a]/90 px-2.5 py-1 uppercase tracking-widest text-white border border-white/20 font-bold rounded-md">
                        Top Rated Partner
                      </span>
                    </div>
                  </div>

                  {/* Metric & Dossier Right */}
                  <div className="lg:col-span-7 p-7 lg:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Header & Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <span className="font-label-caps text-[10px] uppercase tracking-widest px-2.5 py-0.5 bg-[#f5f3ef] text-[#a0522d] font-bold border border-[#ded9d1] rounded-md">
                          Handpicked For You
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
                      <div className="grid grid-cols-3 gap-3 py-3.5 bg-[#fbf9f5] px-4 mb-5 border border-[#ded9d1] rounded-xl">
                        <div className="space-y-0.5">
                          <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Distance</span>
                          <span className="font-button-text text-base text-[#1a1a1a] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-[#4a4238]">near_me</span>
                            {featuredProvider.distanceKm || '1.2'} km
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Delivery Time</span>
                          <span className="font-button-text text-base text-[#1a1a1a] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[16px] text-[#4a4238]">timelapse</span>
                            ~{featuredProvider.etaMinutes || '22'} mins
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-label-caps text-[9px] text-[#665d52] block uppercase font-bold">Price / Meal</span>
                          <span style={{ fontFamily: "'EB Garamond', serif" }} className="text-xl text-[#1a1a1a] font-semibold">
                            ₹{featuredProvider.price || 140}<span className="text-xs text-[#665d52] font-sans">/meal</span>
                          </span>
                        </div>
                      </div>

                      {/* Dietary Protocol Chips */}
                      <div className="space-y-1.5 mb-5">
                        <span className="font-label-caps text-[10px] uppercase text-[#4a4238] block font-bold">
                          Dietary Specialties
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(featuredProvider.tags || ['Veg', 'Jain Friendly', 'Gir Cow Ghee Only', 'Cold-Pressed Oil']).map((tg, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-[#f5f3ef] text-[#1a1a1a] font-label-caps text-[10px] uppercase font-semibold border border-[#ded9d1]/60 rounded-md">
                              {tg}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Configured Tiffin Sets Within Range */}
                      <div className="space-y-1.5">
                        <span className="font-label-caps text-[10px] uppercase text-[#4a4238] block font-bold">
                          Popular Tiffins Available
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
                            <div key={idx} className="p-2.5 bg-[#fbf9f5] border border-[#ded9d1] rounded-lg">
                              <span className="font-button-text text-xs block text-[#1a1a1a] truncate font-medium">{t.name}</span>
                              <span className="text-xs text-[#4a4238] font-semibold">₹{t.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Capacity Bar & Direct Action */}
                    <div className="pt-4 bg-[#f5f3ef] p-4 space-y-3 border border-[#ded9d1] rounded-xl">
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
                      <div className="w-full bg-[#ded9d1] h-1.5 overflow-hidden rounded-full">
                        <div className="bg-[#1a1a1a] h-full rounded-full" style={{ width: '60%' }}></div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                        <span className="text-xs text-[#665d52]">✓ Prepared fresh with hygienic packaging</span>
                        <button
                          type="button"
                          onClick={() => handleOpenDossier(featuredProvider)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white font-button-text text-xs uppercase tracking-wider hover:bg-[#4a4238] transition-colors cursor-pointer font-bold rounded-xl"
                        >
                          <span>View Menu & Order</span>
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
                  <span className="font-label-caps text-xs tracking-widest uppercase text-[#a0522d] block font-bold">
                    EXPLORE NEARBY
                  </span>
                  <h2 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a] font-medium">
                    All Nearby Home Kitchens ({filteredProviders.length} Open)
                  </h2>
                </div>

                {/* Sort metric toggle */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-label-caps text-[11px] text-[#665d52] uppercase font-semibold">Sort By:</span>
                  {[
                    { id: 'distance', label: 'Distance' },
                    { id: 'rating', label: 'Rating' },
                    { id: 'price_asc', label: 'Price: Low to High' }
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

              {/* Zomato-Inspired Clean 3-Column Provider Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {filteredProviders.length === 0 ? (
                  <div className="col-span-full py-16 text-center space-y-4 bg-white border border-[#ded9d1] p-8 rounded-2xl">
                    <span className="material-symbols-outlined text-5xl text-[#8c6239]">search_off</span>
                    <h3 style={{ fontFamily: "'EB Garamond', serif" }} className="text-3xl text-[#1a1a1a]">
                      No kitchens found matching "{searchQuery}"
                    </h3>
                    <p className="text-sm text-[#665d52] max-w-md mx-auto">
                      We couldn't find any home kitchens or tiffins matching your search term. Try searching for "Mansuri", "Kathiyawadi", "Jain", or clear your search to explore all nearby kitchens.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-6 py-3 bg-[#1a1a1a] text-white text-xs uppercase font-bold tracking-wider rounded-xl cursor-pointer hover:bg-[#4a4238] transition-colors"
                    >
                      Clear Search &amp; View All Kitchens
                    </button>
                  </div>
                ) : (
                  filteredProviders.map((prov, index) => {
                  const pLocality = prov.address?.locality || 'Satellite Zone, Ahmedabad';
                  const pStartingPrice = prov.price || 120;
                  const pFormats = (prov.categories && prov.categories.length > 0)
                    ? prov.categories
                    : (prov.tags || ['Gujarati Thali', 'Kathiyawadi', 'Homestyle']);
                  const pRating = (prov.rating !== undefined && prov.rating !== null && !isNaN(Number(prov.rating)) && Number(prov.rating) > 0)
                    ? Number(prov.rating).toFixed(1)
                    : (prov.rating === 0 ? '0.0' : '4.8');
                  const fallbackImg = `/assets/provider_${(index % 5) + 1}.png`;

                  return (
                    <article
                      key={prov._id}
                      onClick={() => handleOpenDossier(prov)}
                      className="bg-white rounded-2xl p-3 border border-[#ded9d1]/80 hover:border-[#b0aba2] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden"
                    >
                      <div>
                        {/* Food / Kitchen Photograph */}
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#ded9d1]/40 mb-3">
                          <img
                            src={prov.kitchenPhoto || prov.kitchenPhotos || prov.image || fallbackImg}
                            alt={prov.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { e.target.src = fallbackImg; }}
                          />

                          {/* Top-Left: Promoted Badge (only for sponsored/top partner) */}
                          {(prov.isPromoted || index === 0) && (
                            <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                              Promoted
                            </span>
                          )}

                          {/* Top-Right: Indian Food Classification Mark (Green = Veg, Red = Non-Veg) */}
                          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs p-1 rounded-sm shadow-sm flex items-center justify-center">
                            <div className={`w-3.5 h-3.5 border ${
                              prov.categories?.some(c => c.toLowerCase().includes('non-veg'))
                                ? 'border-red-700 bg-red-500/5'
                                : 'border-emerald-600 bg-emerald-500/5'
                            } flex items-center justify-center p-[2px] rounded-[2px]`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                prov.categories?.some(c => c.toLowerCase().includes('non-veg'))
                                  ? 'bg-red-700'
                                  : 'bg-emerald-600'
                              }`} />
                            </div>
                          </div>

                          {/* Bottom-Left: Dynamic Kitchen Offer / Specialty Quote Pill */}
                          {(() => {
                            const highlight = getProviderHighlightQuote(prov);
                            return (
                              <div className="absolute bottom-2.5 left-2.5 bg-[#a0522d] text-white font-bold text-[11px] px-2.5 py-1 rounded-sm flex items-center gap-1.5 shadow-md">
                                <span className="text-[12px]">{highlight.icon}</span>
                                <span>{highlight.text}</span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Line 1: Kitchen Name & Rating Badge */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-base sm:text-[17px] text-[#1c1c1a] group-hover:text-[#a0522d] transition-colors truncate">
                            {prov.name}
                          </h3>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#247c37] text-white text-xs font-bold rounded shrink-0 shadow-xs">
                            <span>{pRating}</span>
                            <span className="text-[10px]">★</span>
                          </div>
                        </div>

                        {/* Line 2: Cuisines / Formats & Price */}
                        <div className="flex items-center justify-between text-xs text-[#665d52] gap-2 mb-2">
                          <span className="truncate">{pFormats.join(', ')}</span>
                          <span className="shrink-0 font-medium text-[#4a4238]">₹{pStartingPrice} for one</span>
                        </div>
                      </div>

                      {/* Line 3: Locality & Distance / ETA & Live Audit */}
                      <div className="flex items-center justify-between text-xs text-[#828282] gap-2 pt-2 border-t border-[#f0eeea]">
                        <span className="truncate">{pLocality.split(',')[0]}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAuditKitchen(prov.name);
                              setIsKitchenCamModalOpen(true);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition cursor-pointer"
                            title="Live CCTV & Temperature Audit"
                          >
                            <span>🎥</span>
                            <span>Audit</span>
                          </button>
                          <span className="font-medium text-[#665d52]">
                            {prov.distanceKm || '1.5'} km • ~{prov.etaMinutes || '25'} min
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                }))}
              </div>
            </section>

            {/* Customer Reassurance & Freshness Promise */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#f5f3ef] p-8 border border-[#ded9d1] rounded-2xl">
              <div className="lg:col-span-5 space-y-3">
                <span className="font-label-caps text-xs uppercase text-[#a0522d] tracking-widest block font-bold">
                  Freshness &amp; Hygiene Promise
                </span>
                <h4 style={{ fontFamily: "'EB Garamond', serif" }} className="text-2xl sm:text-3xl text-[#1a1a1a] font-medium">
                  100% Quality &amp; Taste Guarantee
                </h4>
                <p className="text-xs sm:text-sm text-[#665d52] leading-relaxed">
                  Every home kitchen partner is individually verified for hygiene, fresh ingredients, and authentic taste. Deliveries arrive warm in insulated food-grade containers within {radiusKm} km of your doorstep.
                </p>
                <div className="flex items-center gap-6 text-[#1a1a1a] font-label-caps text-[11px] uppercase pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#1b5e20]">verified</span>
                    <span className="font-bold">Verified Kitchens</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#a0522d]">lock</span>
                    <span className="font-bold">Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#4a4238]">eco</span>
                    <span className="font-bold">Pure Ingredients</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="w-full h-64 bg-[#ded9d1] relative overflow-hidden flex items-end p-4 border border-[#ded9d1] rounded-xl">
                  <img
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYJfOhWCYJaGO5pVRCFve6WoZZxEEY_pLdHkfGosN8bV9Dum0myPzUNbEeosxERSlnkXFD6QX9HPvpoQxOMP_l5kEHlaWGCPpfcISHGDnNK6EfcG5mDLYAjeKrAEkkvb7zbiziiK1WgP1y0BEEDK63TjkLaDWA3pobQIxYBo9wJPyEvAMS1qEx4Zp6Tr5dOrwOryeqsljfPHvYSTFA7BLAGrWAkAf2R_4o-3a4Ek6hQ89VZ5-6oLxO"
                    alt="Delivery Zone Map"
                  />
                  <div className="absolute inset-0 bg-[#1a1a1a]/15"></div>
                  <div className="relative z-10 bg-white/95 backdrop-blur-sm p-3 w-full flex items-center justify-between border border-[#ded9d1] rounded-lg">
                    <div>
                      <span className="font-label-caps text-[9px] uppercase block text-[#4a4238] font-bold">Delivery Location</span>
                      <span className="font-button-text text-xs text-[#1a1a1a] font-semibold">{locationAddress}</span>
                    </div>
                    <span className="font-label-caps text-[10px] px-2.5 py-1 bg-[#1a1a1a] text-white uppercase font-bold rounded">
                      Within {radiusKm} KM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reassurance Banner */}
            <div className="bg-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#ded9d1] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#a0522d] text-[22px]">health_and_safety</span>
                <p className="text-xs text-[#665d52]">
                  Fresh home-cooked tiffins delivered within <strong className="text-[#1a1a1a] font-semibold">{radiusKm} km</strong> of your area. Prepared fresh to order with transparent prices and contactless delivery.
                </p>
              </div>
              <span className="font-label-caps text-[10px] text-[#4a4238] tracking-widest uppercase font-bold shrink-0">
                TiffinLink Quality Standards
              </span>
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          ADVANCED MARKETPLACE & CUSTOMER EXPERIENCE MODALS
          ───────────────────────────────────────────────────────────────────────────── */}
      <EmergencyMealModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        defaultAddress={locationAddress}
      />

      <AuctionAndMatchingModal
        isOpen={isAuctionModalOpen}
        onClose={() => setIsAuctionModalOpen(false)}
        request={activeAuctionRequest}
      />

      <CorporateBulkModal
        isOpen={isCorporateModalOpen}
        onClose={() => setIsCorporateModalOpen(false)}
      />

      <HostelBulkPoolModal
        isOpen={isHostelPoolModalOpen}
        onClose={() => setIsHostelPoolModalOpen(false)}
      />

      <CommunityRecipeModal
        isOpen={isCommunityRecipeModalOpen}
        onClose={() => setIsCommunityRecipeModalOpen(false)}
      />

      <NutritionDietitianModal
        isOpen={isNutritionModalOpen}
        onClose={() => setIsNutritionModalOpen(false)}
      />

      <DabbaDepositModal
        isOpen={isDabbaDepositModalOpen}
        onClose={() => setIsDabbaDepositModalOpen(false)}
      />

      <MealSwapModal
        isOpen={isMealSwapModalOpen}
        onClose={() => setIsMealSwapModalOpen(false)}
      />

      <TasteGuaranteeModal
        isOpen={isTasteGuaranteeModalOpen}
        onClose={() => setIsTasteGuaranteeModalOpen(false)}
      />

      <KitchenCamAuditModal
        isOpen={isKitchenCamModalOpen}
        onClose={() => setIsKitchenCamModalOpen(false)}
        kitchenName={activeAuditKitchen || 'Ahmedabad Partner Kitchen'}
      />
    </div>
  );
}
